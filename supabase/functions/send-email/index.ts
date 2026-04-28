// =============================================================================
// Send Email - Resend Integration
// Endpoint: POST /functions/v1/send-email
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const RESEND_FROM_DOMAIN = Deno.env.get('RESEND_FROM_DOMAIN');
const RESEND_FROM_NAME = Deno.env.get('RESEND_FROM_NAME') || null;

function errorResponse(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  let authToken: string | null = null;

  try {
    // --- Auth -----------------------------------------------------------------
    authToken = req.headers.get('authorization')?.replace('Bearer ', '') ?? null;
    if (!authToken) return errorResponse(401, 'Missing Authorization header');

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser(authToken);
    if (authError || !user) return errorResponse(401, 'Unauthorized');

    // --- Request --------------------------------------------------------------
    const body: { type?: string; id?: string; orgId?: string; emailedTo?: string } = await req.json();
    const { type, id, orgId, emailedTo } = body;
    if (!type || !id || !orgId) return errorResponse(400, 'Missing required fields: type, id, orgId');
    if (type !== 'estimate' && type !== 'invoice') return errorResponse(400, 'type must be estimate or invoice');

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // --- Fetch document --------------------------------------------------------
    const docTable = type === 'estimate' ? 'estimates' : 'invoices';
    const { data: docRecord, error: docError } = await supabaseAdmin
      .from(docTable)
      .select('*')
      .eq('id', id)
      .single();
    if (docError || !docRecord) return errorResponse(404, `${type} not found`);
    if ((docRecord as any).org_id !== orgId) return errorResponse(403, 'Document org mismatch');

    // --- Fetch org (for From name) -------------------------------------------
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single();
    const orgName = org?.name || 'Your Shop';

    // --- Determine recipient --------------------------------------------------
    let recipientEmail = emailedTo;
    if (!recipientEmail) {
      const customerId = docRecord.customer_id;
      if (!customerId) throw new Error('No customer on record and no emailedTo provided');
      const { data: customer } = await supabaseAdmin
        .from('customers')
        .select('email, first_name, last_name')
        .eq('id', customerId)
        .single();
      recipientEmail = customer?.email;
    }
    if (!recipientEmail) throw new Error('No recipient email available');

    // --- Call generate-pdf Edge Function --------------------------------------
    const genPdfRes = await fetch(`${SUPABASE_URL}/functions/v1/generate-pdf`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'apikey': authToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, id, orgId, emailedTo: recipientEmail }),
    });
    if (!genPdfRes.ok) {
      const err = await genPdfRes.text();
      throw new Error(`generate-pdf failed (${genPdfRes.status}): ${err}`);
    }
    const pdfBuffer = new Uint8Array(await genPdfRes.arrayBuffer());

    // --- SHA-256 hash ---------------------------------------------------------
    const hashBuffer = await crypto.subtle.digest('SHA-256', pdfBuffer);
    const contentHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // --- Upload to Supabase Storage -------------------------------------------
    const docNumber = type === 'estimate' ? docRecord.estimate_number : docRecord.invoice_number;
    const storagePath = `pdfs/${orgId}/${type}/${docNumber}.pdf`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('pdfs')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });
    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

    // --- Upsert archive record (with storage path) ----------------------------
    const now = new Date().toISOString();

    // Check if archive record already exists with this hash
    const { data: existing } = await supabaseAdmin
      .from('pdf_archive')
      .select('id')
      .eq('org_id', orgId)
      .eq('doc_type', type)
      .eq('doc_id', id)
      .eq('content_hash', contentHash)
      .maybeSingle();

    if (existing?.id) {
      await supabaseAdmin
        .from('pdf_archive')
        .update({
          storage_path: storagePath,
          emailed_to: recipientEmail,
          emailed_at: now,
          file_size: pdfBuffer.length,
        })
        .eq('id', existing.id);
    } else {
      // Fallback insert (if generate-pdf never created one)
      await supabaseAdmin.from('pdf_archive').insert({
        org_id: orgId,
        doc_type: type,
        doc_id: id,
        doc_number: docNumber,
        content_hash: contentHash,
        generated_by: user.id,
        emailed_to: recipientEmail,
        emailed_at: now,
        storage_path: storagePath,
        file_size: pdfBuffer.length,
      });
    }

    // --- Send email via Resend ------------------------------------------------
    const fromEmail = RESEND_FROM_DOMAIN ? `no-reply@${RESEND_FROM_DOMAIN}` : `no-reply@wrapmind.com`;
    const fromName = RESEND_FROM_NAME || orgName;
    const from = `${fromName} <${fromEmail}>`;

    const subject = type === 'estimate'
      ? `Your Estimate from ${orgName} – ${docNumber}`
      : `Invoice ${docNumber} from ${orgName}`;

    const htmlBody = `
      <p>Hello,</p>
      <p>Please find your ${type} attached.</p>
      <p>Thank you,<br/>${orgName}</p>
    `;

    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [recipientEmail],
        subject,
        html: htmlBody,
        attachments: [
          {
            filename: `${docNumber}.pdf`,
            content: pdfBase64,
            type: 'application/pdf',
          },
        ],
      }),
    });

    if (!resendRes.ok) {
      const err = await resendRes.text();
      throw new Error(`Resend failed (${resendRes.status}): ${err}`);
    }

    return new Response(JSON.stringify({ ok: true, archiveId: existing?.id, storagePath }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (err: any) {
    console.error('[send-email] error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
});
