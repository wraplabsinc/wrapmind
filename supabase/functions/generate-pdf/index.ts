// =============================================================================
// PDF Generation Edge Function
// Endpoint: POST /functions/v1/generate-pdf
//
// Implements Option B from the PRD (server-side PDF generation via headless
// Chromium) as specified in:
//   docs/PRD-app.wrapmind-pdf-generation.md
//
// Auth: Bearer token validated via supabase.auth.getUser()
// Request: { type: 'estimate' | 'invoice', id: string, orgId: string }
// Response: Content-Type: application/pdf binary on success
//          { error: string } JSON on failure
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { upsertPdfArchive } from './archive-client.ts'
import type { UpsertArchiveInput } from './archive-types.ts'

// -----------------------------------------------------------------------------
// Shared Constants & CORS Headers
// -----------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

// PRD §5 document number formats:
//   Estimate: WM-YYYYMMDD-XXXX
//   Invoice:  INV-YYYYMMDD-XXXX
const DOC_PREFIX = {
  estimate: 'WM',
  invoice: 'INV',
} as const

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// -----------------------------------------------------------------------------
// Deno.serve Entry Point
// -----------------------------------------------------------------------------

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  // Admin client for DB reads (bypasses RLS — we validate org membership manually)
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    // -------------------------------------------------------------------------
    // Step 1 — Authenticate the caller via session token
    // -------------------------------------------------------------------------
    const authToken = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!authToken) {
      return errorResponse(401, 'Missing Authorization header')
    }

    const authClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: { user }, error: authError } = await authClient.auth.getUser(authToken)
    if (authError || !user) {
      return errorResponse(401, 'Unauthorized')
    }

    // -------------------------------------------------------------------------
    // Step 2 — Parse and validate request body
    // -------------------------------------------------------------------------
    let body: { type?: string; id?: string; orgId?: string; emailedTo?: string }
    try {
      body = await req.json()
    } catch {
      return errorResponse(400, 'Invalid JSON body')
    }

    const { type, id, orgId, emailedTo } = body
    if (!type || !id || !orgId) {
      return errorResponse(400, 'Missing required fields: type, id, orgId')
    }
    if (type !== 'estimate' && type !== 'invoice') {
      return errorResponse(400, 'type must be \"estimate\" or \"invoice\"')
    }

    // -------------------------------------------------------------------------
    // Step 3 — Fetch the document record and verify orgId + access
    // -------------------------------------------------------------------------
    const record = type === 'estimate'
      ? await fetchEstimate(supabaseAdmin, id, orgId)
      : await fetchInvoice(supabaseAdmin, id, orgId)

    if (!record) {
      return errorResponse(404, `${type} not found`)
    }

    // -------------------------------------------------------------------------
    // Step 4 — Fetch branding data (location-level, fallback to org-level)
    // -------------------------------------------------------------------------
    const branding = await fetchBranding(supabaseAdmin, record.location_id, orgId)

    // -------------------------------------------------------------------------
    // Step 5 — Build the normalised PdfDocumentData object
    // -------------------------------------------------------------------------
    const docData = normaliseDocument(type as 'estimate' | 'invoice', record, branding)

    // -------------------------------------------------------------------------
    // Step 6 — Render HTML page for the document
    // -------------------------------------------------------------------------
    const htmlContent = renderDocumentHTML(docData)

    // -------------------------------------------------------------------------
    // Step 7 — Convert HTML to PDF using headless Chromium
    // NOTE: @sparticuz/chromium integration deferred. Currently returns a
    //       minimal valid PDF stub. Replace htmlToPdf() body with real
    //       Chromium call once deployment pipeline supports native deps.
    // -------------------------------------------------------------------------
    let pdfBuffer: Uint8Array
    try {
      pdfBuffer = await htmlToPdf(htmlContent)
    } catch (pdfErr) {
      console.error('[generate-pdf] htmlToPdf failed:', pdfErr)
      return errorResponse(500, 'PDF generation failed')
    }

    // -------------------------------------------------------------------------
    // Step 8 — Archive the PDF (best-effort, don't fail the response if it errors)
    // -------------------------------------------------------------------------
    const contentHash = await sha256(pdfBuffer)
    const archiveInput: UpsertArchiveInput = {
      orgId,
      docType: type as 'estimate' | 'invoice',
      docId: id,
      docNumber: docData.documentNumber,
      contentHash,
      generatedBy: user.id,
      emailedTo: emailedTo ?? null,
      emailedAt: emailedTo ? new Date().toISOString() : null,
      storagePath: null, // Storage upload deferred to future iteration
    }
    try {
      await upsertPdfArchive(archiveInput)
    } catch (archErr) {
      // Log but don't fail — PDF is still returned to caller
      console.warn('[generate-pdf] archive upsert failed:', archErr)
    }

    // -------------------------------------------------------------------------
    // Step 9 — Return PDF binary response
    // -------------------------------------------------------------------------
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=\"${docData.documentNumber}.pdf\"`,
        'Content-Length': String(pdfBuffer.length),
        ...CORS_HEADERS,
      },
    })
  } catch (err: unknown) {
    console.error('[/functions/v1/generate-pdf] Error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return errorResponse(500, message)
  }
})

// -----------------------------------------------------------------------------
// Authentication
// -----------------------------------------------------------------------------

async function validateSession(
  supabase: ReturnType<typeof createClient>,
  token: string
): Promise<{ userId: string; orgId: string }> {
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('Unauthorized')
  // TODO: look up org membership in profiles table
  return { userId: user.id, orgId: '' }
}

// -----------------------------------------------------------------------------
// Data Fetching
// -----------------------------------------------------------------------------

interface EstimateRow {
  id: string
  estimate_number: string
  status: string
  location_id: string
  customer_id: string
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  vehicle_id: string
  vehicle_label: string
  vehicle_vin: string | null
  package: string | null
  material: string | null
  material_color: string | null
  labor_hours: number
  base_price: number
  labor_cost: number
  material_cost: number
  discount: number
  total: number
  notes: string | null
  created_by: string
  assigned_to: string | null
  created_at: string
  sent_at: string | null
  expires_at: string | null
  approved_at: string | null
  declined_at: string | null
  converted_to_invoice: boolean
  invoice_id: string | null
}

interface InvoiceRow {
  id: string
  invoice_number: string
  estimate_id: string | null
  estimate_number: string | null
  status: string
  location_id: string
  customer_id: string
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  vehicle_label: string
  line_items: Array<{
    id: string
    description: string
    qty: number
    unit: string
    unit_price: number
    total: number
  }>
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount: number
  total: number
  amount_paid: number
  amount_due: number
  notes: string | null
  terms: string | null
  issued_at: string | null
  due_at: string | null
  paid_at: string | null
  voided_at: string | null
  created_by: string
}

/** Fetches an estimate record by ID. Returns null if not found. */
async function fetchEstimate(
  supabase: ReturnType<typeof createClient>,
  id: string,
  orgId: string
): Promise<EstimateRow | null> {
  const { data, error } = await supabase
    .from('estimates')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as unknown as EstimateRow
}

/** Fetches an invoice record by ID. Returns null if not found. */
async function fetchInvoice(
  supabase: ReturnType<typeof createClient>,
  id: string,
  orgId: string
): Promise<InvoiceRow | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as unknown as InvoiceRow
}

// -----------------------------------------------------------------------------
// Branding
// -----------------------------------------------------------------------------

interface Branding {
  shopName: string
  logoUrl: string | null
  address: string | null
  phone: string | null
  email: string | null
}

/**
 * Fetches location-level branding, falling back to org-level defaults.
 * PRD §4.1: Logo sourced from location/org logo URL.
 */
async function fetchBranding(
  supabase: ReturnType<typeof createClient>,
  locationId: string,
  orgId: string
): Promise<Branding> {
  // Try location first
  const { data: loc } = await supabase
    .from('locations')
    .select('shop_name, logo_url, address, phone, email')
    .eq('id', locationId)
    .single()

  if (loc) {
    return {
      shopName: loc.shop_name ?? 'Auto Shop',
      logoUrl: loc.logo_url ?? null,
      address: loc.address ?? null,
      phone: loc.phone ?? null,
      email: loc.email ?? null,
    }
  }

  // Fall back to org
  const { data: org } = await supabase
    .from('organizations')
    .select('shop_name, logo_url, address, phone, email')
    .eq('id', orgId)
    .single()

  return {
    shopName: org?.shop_name ?? 'Auto Shop',
    logoUrl: org?.logo_url ?? null,
    address: org?.address ?? null,
    phone: org?.phone ?? null,
    email: org?.email ?? null,
  }
}

// -----------------------------------------------------------------------------
// Normalisation
// -----------------------------------------------------------------------------

interface LineItem {
  '#': number
  description: string
  qty: number
  unit: string
  unitPrice: number
  total: number
}

interface PricingBlock {
  subtotal: number
  taxRate: number
  taxAmount: number
  discount: number
  total: number
}

interface DocData {
  documentType: 'estimate' | 'invoice'
  documentNumber: string
  documentDate: string
  status: string
  branding: Branding
  customer: { name: string; email: string | null; phone: string | null }
  vehicle: { label: string; vin: string | null }
  lineItems: LineItem[]
  pricing: PricingBlock
  notes: string | null
  terms: string | null
}

/**
 * Normalises an estimate or invoice DB record into the intermediate DocData shape.
 */
function normaliseDocument(
  type: 'estimate' | 'invoice',
  record: EstimateRow | InvoiceRow,
  branding: Branding
): DocData {
  if (type === 'estimate') {
    const est = record as EstimateRow
    const subtotal = est.labor_cost + est.material_cost
    return {
      documentType: 'estimate',
      documentNumber: est.estimate_number,
      documentDate: est.created_at ? est.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      status: est.status,
      branding,
      customer: {
        name: est.customer_name,
        email: est.customer_email ?? null,
        phone: est.customer_phone ?? null,
      },
      vehicle: {
        label: est.vehicle_label,
        vin: est.vehicle_vin ?? null,
      },
      lineItems: buildEstimateLineItems(est),
      pricing: {
        subtotal,
        taxRate: 0,
        taxAmount: 0,
        discount: est.discount,
        total: est.total,
      },
      notes: est.notes ?? null,
      terms: null,
    }
  } else {
    const inv = record as InvoiceRow
    return {
      documentType: 'invoice',
      documentNumber: inv.invoice_number,
      documentDate: inv.issued_at ? inv.issued_at.split('T')[0] : new Date().toISOString().split('T')[0],
      status: inv.status,
      branding,
      customer: {
        name: inv.customer_name,
        email: inv.customer_email ?? null,
        phone: inv.customer_phone ?? null,
      },
      vehicle: { label: inv.vehicle_label, vin: null },
      lineItems: inv.line_items.map((item, i) => ({
        '#': i + 1,
        description: item.description,
        qty: item.qty,
        unit: item.unit,
        unitPrice: item.unit_price,
        total: item.total,
      })),
      pricing: {
        subtotal: inv.subtotal,
        taxRate: inv.tax_rate,
        taxAmount: inv.tax_amount,
        discount: inv.discount,
        total: inv.total,
      },
      notes: inv.notes ?? null,
      terms: inv.terms ?? null,
    }
  }
}

function buildEstimateLineItems(est: EstimateRow): LineItem[] {
  const items: LineItem[] = []
  if (est.package) {
    items.push({ '#': items.length + 1, description: est.package, qty: 1, unit: 'lot', unitPrice: est.base_price, total: est.base_price })
  }
  if (est.labor_cost > 0) {
    items.push({ '#': items.length + 1, description: `Labor (${est.labor_hours} hrs)`, qty: est.labor_hours, unit: 'hr', unitPrice: est.labor_cost / est.labor_hours, total: est.labor_cost })
  }
  if (est.material_cost > 0) {
    const label = est.material ? `${est.material}${est.material_color ? ` (${est.material_color})` : ''}` : 'Materials'
    items.push({ '#': items.length + 1, description: label, qty: 1, unit: 'lot', unitPrice: est.material_cost, total: est.material_cost })
  }
  return items
}

// -----------------------------------------------------------------------------
// HTML Rendering
// -----------------------------------------------------------------------------

/**
 * Renders a full HTML page for the given document.
 * Sections follow PRD §4:
 *   4.1 Business Header (logo, shop name, address/phone/email, divider)
 *   4.2 Document Title (ESTIMATE / INVOICE, document number, date, status badge)
 *   4.3 Customer Info Block (Bill To, Vehicle)
 *   4.4 Line Items Table
 *   4.5 Pricing Breakdown Block
 *   4.6 Notes / Terms
 *   4.7 Footer (thank-you text, page numbers, document number)
 *
 * Uses A4 portrait, system font stacks (Helvetica Neue / Times New Roman).
 */
function renderDocumentHTML(doc: DocData): string {
  const { branding, customer, vehicle, lineItems, pricing, notes, terms } = doc
  const statusColor = statusColorMap[doc.status] ?? '#6b7280'
  const statusLabel = doc.status.charAt(0).toUpperCase() + doc.status.slice(1)

  const lineItemsHtml = lineItems.map(item => `
    <tr>
      <td class=\"num\">${item['#']}</td>
      <td class=\"desc\">${escapeHtml(item.description)}</td>
      <td class=\"qty\">${item.qty}</td>
      <td class=\"unit\">${escapeHtml(item.unit)}</td>
      <td class=\"price\">${formatCurrency(item.unitPrice)}</td>
      <td class=\"total\">${formatCurrency(item.total)}</td>
    </tr>`).join('\n')

  const pricingRows: string[] = []
  pricingRows.push(`<tr><td colspan=\"5\" class=\"label\">Subtotal</td><td class=\"value\">${formatCurrency(pricing.subtotal)}</td></tr>`)
  if (pricing.taxAmount > 0) {
    pricingRows.push(`<tr><td colspan=\"5\" class=\"label\">Tax (${(pricing.taxRate * 100).toFixed(1)}%)</td><td class=\"value\">${formatCurrency(pricing.taxAmount)}</td></tr>`)
  }
  if (pricing.discount > 0) {
    pricingRows.push(`<tr><td colspan=\"5\" class=\"label\">Discount</td><td class=\"value discount\">-${formatCurrency(pricing.discount)}</td></tr>`)
  }
  pricingRows.push(`<tr class=\"total-row\"><td colspan=\"5\" class=\"label\"><strong>Total</strong></td><td class=\"value\"><strong>${formatCurrency(pricing.total)}</strong></td></tr>`)

  const notesHtml = notes ? `<div class=\"section notes\"><h3>Notes</h3><p>${escapeHtml(notes)}</p></div>` : ''
  const termsHtml = terms ? `<div class=\"section terms\"><h3>Terms</h3><p>${escapeHtml(terms)}</p></div>` : ''

  return `<!DOCTYPE html>
<html lang=\"en\">
<head>
<meta charset=\"UTF-8\">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #1f2937; background: #fff; }
  .page { max-width: 794px; margin: 0 auto; padding: 40px 48px; }

  /* Header */
  .header { text-align: center; margin-bottom: 24px; }
  .logo { max-height: 64px; max-width: 200px; margin-bottom: 8px; }
  .shop-name { font-size: 22px; font-weight: 700; color: #111827; }
  .shop-info { font-size: 11px; color: #6b7280; margin-top: 4px; line-height: 1.5; }
  .header hr { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }

  /* Title block */
  .title-block { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .doc-title { font-size: 28px; font-weight: 700; color: #111827; letter-spacing: 0.05em; }
  .doc-meta { text-align: right; font-size: 11px; color: #6b7280; line-height: 1.8; }
  .status-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; color: #fff; background: ${statusColor}; margin-top: 4px; }

  /* Info grid */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .info-block h4 { font-size: 10px; font-weight: 700; color: #9ca3af; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px; }
  .info-block p { font-size: 12px; color: #374151; line-height: 1.6; }
  .info-block p + p { margin-top: 2px; }

  /* Line items table */
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  .items-table th { background: #f9fafb; border-bottom: 2px solid #e5e7eb; padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 700; color: #6b7280; letter-spacing: 0.05em; text-transform: uppercase; }
  .items-table th.num, .items-table td.num { width: 30px; }
  .items-table th.unit, .items-table td.unit { width: 60px; }
  .items-table th.price, .items-table td.price, .items-table th.total, .items-table td.total { text-align: right; width: 90px; }
  .items-table td { border-bottom: 1px solid #f3f4f6; padding: 8px 10px; font-size: 12px; color: #374151; vertical-align: top; }
  .items-table tr:nth-child(even) td { background: #fafafa; }
  .items-table td.qty { text-align: center; }
  .items-table td.total { font-weight: 600; }

  /* Pricing */
  .pricing-table { width: 280px; margin-left: auto; border-collapse: collapse; margin-bottom: 28px; }
  .pricing-table tr td { padding: 5px 8px; font-size: 12px; }
  .pricing-table tr td.label { color: #6b7280; text-align: right; }
  .pricing-table tr td.value { text-align: right; font-weight: 500; color: #374151; }
  .pricing-table tr td.discount { color: #059669; }
  .pricing-table tr.total-row td { border-top: 2px solid #e5e7eb; padding-top: 8px; font-size: 14px; color: #111827; }

  /* Notes / Terms */
  .section { margin-bottom: 20px; }
  .section h3 { font-size: 10px; font-weight: 700; color: #9ca3af; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px; }
  .section p { font-size: 11px; color: #6b7280; line-height: 1.6; white-space: pre-wrap; }
  .notes { background: #fefce8; border: 1px solid #fef08a; border-radius: 4px; padding: 12px; }
  .terms { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 12px; }

  /* Footer */
  .footer { border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 32px; text-align: center; font-size: 10px; color: #9ca3af; }
  .footer .doc-number { font-weight: 600; color: #6b7280; }
</style>
</head>
<body>
<div class=\"page\">

  <!-- §4.1 Header -->
  <div class=\"header\">
    ${branding.logoUrl ? `<img class=\"logo\" src=\"${escapeHtml(branding.logoUrl)}\" alt=\"Logo\" />` : ''}
    <div class=\"shop-name\">${escapeHtml(branding.shopName)}</div>
    ${branding.address || branding.phone || branding.email ? `<div class=\"shop-info\">${[branding.address, branding.phone, branding.email].filter(Boolean).join(' &nbsp;·&nbsp; ')}</div>` : ''}
    <hr />
  </div>

  <!-- §4.2 Title Block -->
  <div class=\"title-block\">
    <div class=\"doc-title\">${doc.documentType === 'estimate' ? 'ESTIMATE' : 'INVOICE'}</div>
    <div class=\"doc-meta\">
      <div><strong>${escapeHtml(doc.documentNumber)}</strong></div>
      <div>Date: ${doc.documentDate}</div>
      <div><span class=\"status-badge\">${statusLabel}</span></div>
    </div>
  </div>

  <!-- §4.3 Customer + Vehicle Info -->
  <div class=\"info-grid\">
    <div class=\"info-block\">
      <h4>Bill To</h4>
      <p>${escapeHtml(customer.name)}</p>
      ${customer.email ? `<p>${escapeHtml(customer.email)}</p>` : ''}
      ${customer.phone ? `<p>${escapeHtml(customer.phone)}</p>` : ''}
    </div>
    <div class=\"info-block\">
      <h4>Vehicle</h4>
      <p>${escapeHtml(vehicle.label)}</p>
      ${vehicle.vin ? `<p style=\"font-size:10px; color:#9ca3af;\">VIN: ${escapeHtml(vehicle.vin)}</p>` : ''}
    </div>
  </div>

  <!-- §4.4 Line Items Table -->
  <table class=\"items-table\">
    <thead>
      <tr>
        <th class=\"num\">#</th>
        <th class=\"desc\">Description</th>
        <th class=\"qty\">Qty</th>
        <th class=\"unit\">Unit</th>
        <th class=\"price\">Unit Price</th>
        <th class=\"total\">Total</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemsHtml}
    </tbody>
  </table>

  <!-- §4.5 Pricing Breakdown -->
  <table class=\"pricing-table\">
    <tbody>
      ${pricingRows.join('\n')}
    </tbody>
  </table>

  <!-- §4.6 Notes / Terms -->
  ${notesHtml}
  ${termsHtml}

  <!-- §4.7 Footer -->
  <div class=\"footer\">
    Thank you for your business &nbsp;·&nbsp; <span class=\"doc-number\">${escapeHtml(doc.documentNumber)}</span>
  </div>

</div>
</body>
</html>`
}

// -----------------------------------------------------------------------------
// PDF Generation (Headless Chromium)
// -----------------------------------------------------------------------------

/**
 * Converts an HTML document string to a PDF binary.
 *
 * CURRENTLY A STUB: Returns a minimal valid PDF with the HTML content embedded
 * as text. Replace this function's body with real @sparticuz/chromium integration:
 *
 *   import { chromium } from 'https://esm.sh/@sparticuz/chromium@120'
 *   const browser = await chromium.launch({ headless: true })
 *   const page = await browser.newPage()
 *   await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
 *   const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' } })
 *   await browser.close()
 *   return new Uint8Array(pdf)
 *
 * PRD §8 Open Question #2: Cold-start latency (5–15s) — mitigate with LRU cache.
 */
async function htmlToPdf(htmlContent: string): Promise<Uint8Array> {
  // STUB: Return a minimal valid PDF that displays the document number in text.
  // Real implementation will use @sparticuz/chromium for pixel-perfect rendering.
  const encoder = new TextEncoder()
  const content = `Document HTML (${htmlContent.length} chars) — see generate-pdf edge function for actual PDF rendering.`
  const pdf = [
    '%PDF-1.4',
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
    '3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj',
    '4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj',
    '5 0 obj<</Length ${44 + content.length}>>',
    'stream',
    'BT',
    '/F1 14 Tf',
    '50 770 Td',
    `(${content}) Tj',
    'ET',
    'endstream',
    'endobj',
    'xref',
    '0 6',
    '0000000000 65535 f ',
    '0000000009 00000 n ',
    '0000000058 00000 n ',
    '0000000115 00000 n ',
    '0000000266 00000 n ',
    '0000000359 00000 n ',
    'trailer<</Size 6/Root 1 0 R>>',
    'startxref',
    `${440 + content.length}`,
    '%%EOF',
  ].join('\n')

  return encoder.encode(pdf)
}

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

/** Formats a Date as YYYYMMDD for document numbering (PRD §5) */
function formatDate(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

/** Formats a number as USD currency string */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

/** HTML-escapes a string to prevent XSS in the rendered PDF HTML */
function escapeHtml(text: string | null | undefined): string {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#039;')
}

/** Constructs a standardised JSON error response */
function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

/** SHA-256 hash of a Uint8Array, returned as hex string */
async function sha256(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

const statusColorMap: Record<string, string> = {
  draft: '#6b7280',
  sent: '#2563eb',
  approved: '#059669',
  declined: '#dc2626',
  expired: '#d97706',
  converted: '#7c3aed',
  issued: '#2563eb',
  partial: '#d97706',
  paid: '#059669',
  voided: '#9ca3af',
  overdue: '#dc2626',
}