// PDF generation for estimates, invoices, etc.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PDFGenerateRequest {
  type: 'estimate' | 'invoice' | 'receipt' | 'service_report'
  documentId: string
  options?: {
    includeLogo?: boolean
    includeQRCode?: boolean
    paperSize?: 'letter' | 'a4'
    locale?: string
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body: PDFGenerateRequest = await req.json()

    if (!body.type || !body.documentId) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: type and documentId are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const options = body.options || {}
    const paperSize = options.paperSize || 'letter'

    let documentData: any = null
    let htmlContent = ''

    // Fetch document data based on type
    switch (body.type) {
      case 'estimate': {
        const { data, error } = await supabase
          .from('estimates')
          .select(`
            *,
            customer:customers(*),
            vehicle:vehicles(*),
            line_items:estimate_line_items(*)
          `)
          .eq('id', body.documentId)
          .single()

        if (error) throw new Error(`Estimate not found: ${error.message}`)
        documentData = data
        htmlContent = generateEstimateHTML(documentData, options)
        break
      }

      case 'invoice': {
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            customer:customers(*),
            estimate:estimates(*),
            line_items:invoice_line_items(*)
          `)
          .eq('id', body.documentId)
          .single()

        if (error) throw new Error(`Invoice not found: ${error.message}`)
        documentData = data
        htmlContent = generateInvoiceHTML(documentData, options)
        break
      }

      case 'receipt': {
        const { data, error } = await supabase
          .from('payments')
          .select(`
            *,
            customer:customers(*)
          `)
          .eq('id', body.documentId)
          .single()

        if (error) throw new Error(`Payment not found: ${error.message}`)
        documentData = data
        htmlContent = generateReceiptHTML(documentData, options)
        break
      }

      case 'service_report': {
        const { data, error } = await supabase
          .from('service_reports')
          .select(`
            *,
            customer:customers(*),
            vehicle:vehicles(*),
            estimate:estimates(*)
          `)
          .eq('id', body.documentId)
          .single()

        if (error) throw new Error(`Service report not found: ${error.message}`)
        documentData = data
        htmlContent = generateServiceReportHTML(documentData, options)
        break
      }

      default:
        throw new Error(`Unknown document type: ${body.type}`)
    }

    // Store generated PDF reference
    const { data: pdfRecord, error: pdfError } = await supabase
      .from('generated_pdfs')
      .insert({
        document_type: body.type,
        document_id: body.documentId,
        generated_at: new Date().toISOString(),
        paper_size: paperSize,
        content_snapshot: htmlContent.substring(0, 1000), // Store preview
      })
      .select()
      .single()

    if (pdfError) {
      console.error('Failed to create PDF record:', pdfError)
    }

    // Return the HTML content for client-side PDF generation
    // In production, you'd use a headless browser service here
    return new Response(JSON.stringify({
      success: true,
      pdf: {
        id: pdfRecord?.id,
        documentType: body.type,
        documentId: body.documentId,
        htmlContent,
        paperSize,
        generatedAt: pdfRecord?.generated_at || new Date().toISOString(),
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Error generating PDF:', error)
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function generateEstimateHTML(data: any, options: any): string {
  const customer = data.customer || {}
  const vehicle = data.vehicle || {}
  const lineItems = data.line_items || []
  const locale = options.locale || 'en-US'
  const date = new Date().toLocaleDateString(locale, { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  const lineItemsHTML = lineItems.map((item: any, index: number) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(item.description)}</td>
      <td class="text-right">${item.quantity || 1}</td>
      <td class="text-right">${formatCurrency(item.unit_price, locale)}</td>
      <td class="text-right">${formatCurrency((item.quantity || 1) * item.unit_price, locale)}</td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Estimate #${escapeHtml(data.id)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; }
    .title { font-size: 28px; color: #2563eb; margin-bottom: 5px; }
    .meta { color: #666; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f8f9fa; }
    .text-right { text-align: right; }
    .total-row { font-weight: bold; font-size: 18px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">ESTIMATE</div>
      <div class="meta">#${escapeHtml(data.id)}</div>
    </div>
    <div class="text-right">
      <div class="logo">WrapMind</div>
      <div class="meta">Date: ${date}</div>
      <div class="meta">Status: ${escapeHtml(data.status || 'draft')}</div>
    </div>
  </div>

  <div class="section">
    <h3>Customer Information</h3>
    <p><strong>${escapeHtml(customer.name || 'N/A')}</strong></p>
    <p>${escapeHtml(customer.email || '')}</p>
    <p>${escapeHtml(customer.phone || '')}</p>
  </div>

  <div class="section">
    <h3>Vehicle Information</h3>
    <p>${escapeHtml(vehicle.year || '')} ${escapeHtml(vehicle.make || '')} ${escapeHtml(vehicle.model || '')}</p>
    <p>VIN: ${escapeHtml(vehicle.vin || 'N/A')}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Unit Price</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemsHTML}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="4" class="text-right">Total:</td>
        <td class="text-right">${formatCurrency(data.total_amount || 0, locale)}</td>
      </tr>
    </tfoot>
  </table>

  ${data.notes ? `<div class="footer"><strong>Notes:</strong><br>${escapeHtml(data.notes)}</div>` : ''}

  <div class="footer">
    <p>Thank you for your business!</p>
  </div>
</body>
</html>
  `.trim()
}

function generateInvoiceHTML(data: any, options: any): string {
  // Similar structure to estimate but with invoice-specific fields
  const customer = data.customer || {}
  const locale = options.locale || 'en-US'
  const date = new Date().toLocaleDateString(locale)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice #${escapeHtml(data.id)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .title { font-size: 28px; color: #059669; margin-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    .text-right { text-align: right; }
    .total-row { font-weight: bold; font-size: 18px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">INVOICE</div>
      <div>#${escapeHtml(data.id)}</div>
    </div>
    <div class="text-right">
      <div>Date: ${date}</div>
      <div>Due: ${data.due_date ? new Date(data.due_date).toLocaleDateString(locale) : 'Due on Receipt'}</div>
    </div>
  </div>
  <p><strong>Bill To:</strong> ${escapeHtml(customer.name || 'N/A')}</p>
  <p>${escapeHtml(customer.email || '')}</p>
  <p><strong>Amount Due:</strong> ${formatCurrency(data.total_amount || data.amount || 0, locale)}</p>
  <div class="footer"><p>Thank you for your business!</p></div>
</body>
</html>
  `.trim()
}

function generateReceiptHTML(data: any, options: any): string {
  const customer = data.customer || {}
  const locale = options.locale || 'en-US'
  const date = new Date().toLocaleDateString(locale, { 
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  })

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt #${escapeHtml(data.id)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .title { font-size: 28px; color: #059669; text-align: center; }
    .receipt-box { border: 2px solid #ddd; padding: 20px; margin: 20px auto; max-width: 400px; }
    .total { font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="title">RECEIPT</div>
  <div class="receipt-box">
    <p><strong>Receipt #:</strong> ${escapeHtml(data.id)}</p>
    <p><strong>Date:</strong> ${date}</p>
    <p><strong>Customer:</strong> ${escapeHtml(customer.name || 'N/A')}</p>
    <hr>
    <p><strong>Amount Paid:</strong></p>
    <div class="total">${formatCurrency(data.amount, locale)}</div>
    <hr>
    <p><strong>Payment Method:</strong> ${escapeHtml(data.payment_method || 'Card')}</p>
    <p><strong>Status:</strong> ${escapeHtml(data.status || 'paid')}</p>
  </div>
</body>
</html>
  `.trim()
}

function generateServiceReportHTML(data: any, options: any): string {
  const customer = data.customer || {}
  const vehicle = data.vehicle || {}

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Service Report #${escapeHtml(data.id)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .title { font-size: 28px; color: #2563eb; }
  </style>
</head>
<body>
  <div class="title">SERVICE REPORT</div>
  <p><strong>Report #:</strong> ${escapeHtml(data.id)}</p>
  <p><strong>Customer:</strong> ${escapeHtml(customer.name || 'N/A')}</p>
  <p><strong>Vehicle:</strong> ${escapeHtml(vehicle.year || '')} ${escapeHtml(vehicle.make || '')} ${escapeHtml(vehicle.model || '')}</p>
  <p><strong>Summary:</strong> ${escapeHtml(data.summary || 'N/A')}</p>
  <div class="footer"><p>Thank you for your business!</p></div>
</body>
</html>
  `.trim()
}

function escapeHtml(text: string | null | undefined): string {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatCurrency(amount: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
