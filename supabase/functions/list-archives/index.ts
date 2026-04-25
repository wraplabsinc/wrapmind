// =============================================================================
// List Archives — Edge Function Stub
// Endpoint: POST /functions/v1/list-archives
// PRD: docs/PRD-pdf-archive.md §5
//
// Returns a paginated list of archive records for an org,
// sorted by generated_at DESC.
//
// Auth: Bearer token (service role preferred)
// Request: { orgId: string, docType?: "estimate" | "invoice", limit?: number, offset?: number }
// Response: { archives: PdfArchiveEntry[], total: number, limit: number, offset: number }
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { ListArchivesRequest, ListArchivesResponse, PdfArchiveEntry } from '../generate-pdf/archive-types.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

function getSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    let body: ListArchivesRequest
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const { orgId, docType, limit = 50, offset = 0 } = body
    if (!orgId) {
      return new Response(JSON.stringify({ error: 'Missing required field: orgId' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const supabase = getSupabaseAdminClient()

    // Build query
    let query = supabase
      .from('pdf_archive')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .order('generated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (docType) {
      query = query.eq('doc_type', docType)
    }

    const { data: rows, error, count } = await query

    if (error) {
      return new Response(JSON.stringify({ error: `Database error: ${error.message}` }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // TODO: Generate signed URLs for each record that has a storage_path
    // (deferred — signed URL generation requires storage bucket to be provisioned)
    const archives: PdfArchiveEntry[] = (rows ?? []).map((row) => ({
      id: row.id,
      orgId: row.org_id,
      docType: row.doc_type,
      docId: row.doc_id,
      docNumber: row.doc_number,
      contentHash: row.content_hash,
      generatedBy: row.generated_by,
      generatedAt: row.generated_at,
      emailedTo: row.emailed_to,
      emailedAt: row.emailed_at,
      storagePath: row.storage_path,
      deletedAt: row.deleted_at,
      deletedBy: row.deleted_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      storageUrl: null, // TODO: generateSignedUrl(row.storage_path)
    }))

    const response: ListArchivesResponse = {
      archives,
      total: count ?? 0,
      limit,
      offset,
    }
    return new Response(JSON.stringify(response), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
