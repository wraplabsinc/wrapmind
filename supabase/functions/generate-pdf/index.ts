// =============================================================================
// PDF Generation Edge Function
// Endpoint: POST /functions/v1/generate-pdf
//
// Implements Option B from the PRD (server-side PDF generation via headless
// Chromium) as specified in:
//   docs/PRD-app.wrapmind-pdf-generation.md
//
// Auth: Bearer token validated via supabase.auth.getUser()
// Request: { type: "estimate" | "invoice", id: string, orgId: string }
// Response: Content-Type: application/pdf binary on success
//          { error: string } JSON on failure
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// -----------------------------------------------------------------------------
// Local Types (keeps this file self-contained)
// -----------------------------------------------------------------------------

interface PdfGenerateRequest {
  type: 'estimate' | 'invoice'
  id: string
  orgId: string
}

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

// -----------------------------------------------------------------------------
// Deno.serve Entry Point
// -----------------------------------------------------------------------------

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    // -------------------------------------------------------------------------
    // Step 1 — Authenticate the caller via session token
    // PRD §2: "The Edge Function verifies the user's Supabase session token
    //         via supabase.auth.getUser(token)."
    // -------------------------------------------------------------------------
    const authToken = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!authToken) {
      return errorResponse(401, 'Missing Authorization header')
    }

    // TODO: Instantiate the Supabase client and call getUser(authToken)
    // const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    // const { data: { user }, error: authError } = await supabase.auth.getUser(authToken)
    // if (authError || !user) { return errorResponse(401, 'Unauthorized') }

    // -------------------------------------------------------------------------
    // Step 2 — Parse and validate request body
    // PRD §3: POST body { type, id, orgId }
    // -------------------------------------------------------------------------
    let body: PdfGenerateRequest
    try {
      body = await req.json()
    } catch {
      return errorResponse(400, 'Invalid JSON body')
    }

    const { type, id, orgId } = body
    if (!type || !id || !orgId) {
      return errorResponse(400, 'Missing required fields: type, id, orgId')
    }
    if (type !== 'estimate' && type !== 'invoice') {
      return errorResponse(400, 'type must be "estimate" or "invoice"')
    }

    // -------------------------------------------------------------------------
    // Step 3 — Fetch the document record and verify orgId + access
    // PRD §3 flow step 2: "Fetches the estimate or invoice record from Supabase
    //         (using the user's org membership to verify access)."
    // -------------------------------------------------------------------------
    // TODO: Fetch estimate or invoice from Supabase
    // - Verify the record belongs to orgId (or the user's org membership)
    // - Return 404 if not found
    // - Return 403 if the user/org does not have access

    // -------------------------------------------------------------------------
    // Step 4 — Fetch branding data (logo, shop name, address, phone)
    // PRD §3 flow step 3: "Fetches org/location branding data"
    // PRD §4: "Logo — centered at top; sourced from location/org logo URL"
    // -------------------------------------------------------------------------
    // TODO: Fetch location-level branding (falls back to org-level)
    // const branding = await fetchBranding(supabase, record.locationId, orgId)

    // -------------------------------------------------------------------------
    // Step 5 — Build the normalised PdfDocumentData object
    // This feeds the HTML rendering layer and maps to PRD §4 layout sections
    // -------------------------------------------------------------------------
    // TODO: Normalise the database record into PdfDocumentData shape
    // const docData = normaliseDocument(type, record, branding)

    // -------------------------------------------------------------------------
    // Step 6 — Render HTML page for the document
    // PRD §3 flow step 4: "Renders a full HTML page with the document layout"
    // PRD §4: Sections 4.1 (Business Header) → 4.7 (Footer)
    // -------------------------------------------------------------------------
    // TODO: Call renderDocumentHTML(docData) — returns a full HTML string
    // const htmlContent = renderDocumentHTML(docData)

    // -------------------------------------------------------------------------
    // Step 7 — Convert HTML to PDF using headless Chromium
    // PRD §3 flow step 5: "Converts the rendered HTML to PDF using headless
    //         Chromium."
    // PRD §2 Option B: Use chrome-aws-lambda or @sparticuz/chromium to avoid
    //         bundling full Puppeteer in the Edge Function.
    // Note: Edge Functions have 512MB RAM / 60s max; cold starts apply.
    // -------------------------------------------------------------------------
    // TODO: Launch headless Chromium and convert htmlContent → PDF binary
    // const pdfBuffer = await htmlToPdf(htmlContent)

    // -------------------------------------------------------------------------
    // Step 8 — Return PDF binary response
    // PRD §3 Response: "Content-Type: application/pdf" + Content-Disposition
    //         attachment with filename in WM-YYYYMMDD-XXXX or INV-... format
    // -------------------------------------------------------------------------
    // Placeholder PDF for scaffolding — replace with real pdfBuffer
    const pdfBuffer = new Uint8Array()

    const docNumber = type === 'estimate'
      ? `WM-${formatDate(new Date())}-0001`
      : `INV-${formatDate(new Date())}-0001`

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${docNumber}.pdf"`,
        ...CORS_HEADERS,
      },
    })
  } catch (err: any) {
    console.error('[/functions/v1/generate-pdf] Error:', err)
    return errorResponse(500, err.message || 'Internal server error')
  }
})

// -----------------------------------------------------------------------------
// Authentication
// -----------------------------------------------------------------------------

/**
 * Validates the Bearer token and returns the authenticated user.
 * Throws if the token is invalid or expired.
 */
// TODO: Implement — calls supabase.auth.getUser(token)
async function validateSession(
  _supabase: ReturnType<typeof createClient>,
  _token: string
): Promise<{ userId: string; orgId: string }> {
  throw new Error('Not implemented')
}

// -----------------------------------------------------------------------------
// Data Fetching
// -----------------------------------------------------------------------------

/**
 * Fetches an estimate record by ID, including related customer + vehicle.
 * Returns null if not found or not accessible by the user.
 */
// TODO: Implement
async function fetchEstimate(
  _supabase: ReturnType<typeof createClient>,
  _id: string,
  _orgId: string
): Promise<any | null> {
  // TODO: Supabase query — SELECT * FROM estimates ... .eq('id', id) .single()
  throw new Error('Not implemented')
}

/**
 * Fetches an invoice record by ID, including related customer + line items.
 * Returns null if not found or not accessible by the user.
 */
// TODO: Implement
async function fetchInvoice(
  _supabase: ReturnType<typeof createClient>,
  _id: string,
  _orgId: string
): Promise<any | null> {
  // TODO: Supabase query — SELECT * FROM invoices ... .eq('id', id) .single()
  throw new Error('Not implemented')
}

// -----------------------------------------------------------------------------
// Branding
// -----------------------------------------------------------------------------

/**
 * Fetches location-level branding (logo, shop name, address, phone, email).
 * Falls back to org-level defaults if the location has no overrides.
 * PRD §4.1: "Logo — sourced from the location/org logo URL"
 * PRD §8 Open Question #4: "Should the PDF generation pull location-level
 *         branding or fall back to org-level branding?"
 */
// TODO: Implement
async function fetchBranding(
  _supabase: ReturnType<typeof createClient>,
  _locationId: string,
  _orgId: string
): Promise<any> {
  // TODO: Query locations table for branding fields, join with orgs table
  throw new Error('Not implemented')
}

// -----------------------------------------------------------------------------
// Normalisation
// -----------------------------------------------------------------------------

/**
 * Normalises an estimate or invoice DB record into the intermediate
 * PdfDocumentData shape used by the HTML rendering layer.
 * Handles date formatting, currency, line-item transformation, etc.
 */
// TODO: Implement
function normaliseDocument(
  _type: 'estimate' | 'invoice',
  _record: any,
  _branding: any
): any {
  // TODO:
  // - Map createdAt → documentDate (YYYY-MM-DD)
  // - Build lineItems array with sequential #, description, qty, unit, unitPrice, total
  // - Build pricing block { subtotal, taxRate, taxAmount, discount, total }
  // - Map customer: { name, email, phone }
  // - Map vehicle: { label, vin }
  throw new Error('Not implemented')
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
 * Uses A4/Letter portrait, embedded fonts for consistency.
 * PRD §8 Open Question #1: "Should we use a safe default font stack
 *         (Helvetica, Times) for PDFs instead?"
 */
// TODO: Implement — returns a complete HTML string
function renderDocumentHTML(_docData: any): string {
  // TODO:
  // - Build header HTML (logo img, shop name, address line, hr)
  // - Build document title block (ESTIMATE/INVOICE h1, doc number, date, status)
  // - Build customer block (Bill To, Vehicle)
  // - Build line-items table with alternating row shading
  // - Build pricing block (subtotal, tax, discount, total rows)
  // - Conditionally add notes/terms box
  // - Add footer with page-number script
  throw new Error('Not implemented')
}

// -----------------------------------------------------------------------------
// PDF Generation (Headless Chromium)
// -----------------------------------------------------------------------------

/**
 * Converts a full HTML document string to a PDF binary using headless Chromium.
 * Uses @sparticuz/chromium or chrome-aws-lambda for the Edge Function runtime.
 *
 * PRD §2 Option B: "the Edge Function will render a styled HTML page and
 *         convert it to PDF using a headless browser utility
 *         (e.g., chrome-aws-lambda or @sparticuz/chromium)"
 * PRD §8 Open Question #2: Cold-start latency (5–15s) — consider caching or
 *         pre-warming strategies for production.
 */
// TODO: Implement — returns Uint8Array PDF buffer
async function htmlToPdf(_htmlContent: string): Promise<Uint8Array> {
  // TODO:
  // - Launch @sparticuz/chromium with headless: true
  // - Set viewport (A4: 794px × 1123px or Letter)
  // - Set extraHTTPHeaders if needed for fonts/assets
  // - await page.setContent(htmlContent)
  // - await page.pdf({ format: 'A4', printBackground: true, ... })
  // - Return Buffer.from(pdf)
  throw new Error('Not implemented')
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
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/** Constructs a standardised JSON error response */
function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}
