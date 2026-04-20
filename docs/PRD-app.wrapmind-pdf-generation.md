# PRD: PDF Generation for Estimates and Invoices

**Project:** wrapmind app
**Status:** Draft
**Created:** 2026-04-20

---

## 1. Overview

This document outlines the approach for generating PDF documents for estimates and invoices within the wrapmind app. PDFs are needed at two key moments:

- **Estimate PDF** — generated and emailed to the customer when an estimate is sent (status transitions to `sent`).
- **Invoice PDF** — generated when an invoice is created or finalized (status transitions to `issued` or `paid`), and optionally attached when emailed to the customer.

Both documents share a common layout and are driven by the same data structures already present in `EstimateContext.jsx` and `InvoiceContext.jsx`.

### Relevant Data Shapes

**Estimate record (key fields):**
```
id, estimateNumber, status, locationId,
customerId, customerName, customerPhone, customerEmail,
vehicleId, vehicleLabel, vehicleVin,
package, material, materialColor,
laborHours, basePrice, laborCost, materialCost, discount, total,
notes, createdBy, assignedTo,
createdAt, sentAt, expiresAt, approvedAt, declinedAt,
convertedToInvoice, invoiceId
```

**Invoice record (key fields):**
```
id, invoiceNumber, estimateId, estimateNumber, status, locationId,
customerId, customerName, customerEmail, customerPhone,
vehicleLabel,
lineItems: [{ id, description, qty, unit, unitPrice, total }, ...],
subtotal, taxRate, taxAmount, discount, total,
amountPaid, amountDue,
payments: [{ id, method, amount, note, recordedAt, recordedBy }, ...],
notes, terms,
issuedAt, dueAt, paidAt, voidedAt, createdBy
```

---

## 2. Approach Options

### Option A — Client-side Generation (jsPDF / @react-pdf/renderer)

Generate the PDF directly in the browser using a JavaScript library.

**Pros:**
- No server infrastructure needed beyond the existing app hosting.
- Fast, no network round-trip for the document itself.
- Session token is naturally available in the browser.

**Cons:**
- PDF layout is harder to control with programmatic APIs — achieving pixel-perfect business documents is tedious.
- Embedding fonts, logos, and complex table layouts is fragile across browsers.
- Client performance varies; large line-item tables can be slow on lower-end devices.
- Does not support future server-side needs (e.g., batch emailing, scheduled generation).

### Option B — Server-side Generation (Supabase Edge Function + Puppeteer)

Render the PDF on the server using a headless Chromium browser via Puppeteer running in a Supabase Edge Function.

**Pros:**
- Pixel-perfect, HTML/CSS-based layout — same as the on-screen views.
- Centralized; PDF generation works for emails, webhooks, and future admin features without client involvement.
- Logo, fonts, and layout are consistent regardless of the client's browser/device.
- Edge Functions run in Deno with native HTTP clients — easy to call Supabase Storage and Resend API.

**Cons:**
- Edge Functions have memory and execution time limits (512MB RAM, 10s default, up to 60s); Puppeteer is heavy. Requires careful PDF rendering strategy (e.g., pre-rendered HTML returned as PDF).
- Cold starts add latency on first invocation.

### Recommendation: **Option B — Server-side generation via Edge Function + Puppeteer**

The consistency and layout quality of server-side rendering outweighs the operational complexity. Specifically, the Edge Function will render a styled HTML page and convert it to PDF using a headless browser utility (e.g., `chrome-aws-lambda` or `@sparticuz/chromium`). This avoids bundling a full Puppeteer install in the Edge Function — only the browser binary is needed.

---

## 3. Edge Function Design

### Endpoint

```
POST /functions/v1/generate-pdf
```

### Authentication

The Edge Function verifies the user's Supabase session token via `supabase.auth.getUser(token)`. The token is passed in the `Authorization: Bearer <session_token>` header from the client.

### Request Body

```json
{
  "type": "estimate" | "invoice",
  "id": "<record id>",
  "orgId": "<organization id>"
}
```

### Response

On success:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="WM-20250420-0001.pdf"` (or `INV-...`)
- PDF binary body

On error:
- `{ "error": "<message>" }` with appropriate HTTP status code.

### Flow

1. Edge Function validates the session token.
2. Fetches the estimate or invoice record from Supabase (using the user's org membership to verify access).
3. Fetches org/location branding data (logo URL, shop name, address, phone).
4. Renders a full HTML page with the document layout (see Section 4).
5. Converts the rendered HTML to PDF using headless Chromium.
6. Returns the PDF binary.

---

## 4. PDF Layout

The PDF is a standard business document formatted for A4 (or Letter) page size, portrait orientation.

### 4.1 Business Header
- **Logo** — centered at top; sourced from the location/org logo URL stored in Supabase.
- **Shop Name** — bold, large text below logo.
- **Shop Address / Phone / Email** — single line or two lines below shop name.
- Divider line separating header from body.

### 4.2 Document Title
- "ESTIMATE" or "INVOICE" in large uppercase text, left-aligned.
- Document number below title in format:
  - Estimate: `WM-YYYYMMDD-XXXX` (e.g., `WM-20250420-0001`)
  - Invoice: `INV-YYYYMMDD-XXXX` (e.g., `INV-20250420-0001`)
- Date and (for invoices) due date below the number.
- Status badge (e.g., "SENT", "PAID") as text label.

### 4.3 Customer Info Block
- **Bill To:** [Customer Name], [Email], [Phone]
- **Vehicle:** [vehicleLabel] — VIN: [vehicleVin]

### 4.4 Line Items Table

| # | Description | Qty | Unit | Unit Price | Total |
|---|-------------|-----|------|-----------|-------|
| 1 | Full Body Wrap – 3M 1080 Matte Charcoal | 1 | job | $2,800.00 | $2,800.00 |
| 2 | Labor – Installation (18 hrs @ $50/hr) | 18 | hr | $50.00 | $900.00 |
| ... | ... | ... | ... | ... | ... |

- Right-aligned numeric columns.
- Alternating row shading for readability.
- Bold border-bottom on the last row before totals.

### 4.5 Pricing Breakdown Block

```
  Subtotal:   $4,050.00
  Tax (8.75%): $  354.38
  Discount:   -$  150.00
  ─────────────────────
  TOTAL:      $4,204.38
```

### 4.6 Notes / Terms

- **Notes** (estimate/invoice notes) in a light background box if present.
- **Payment Terms** — e.g., "Net 15" — for invoices.

### 4.7 Footer

- Footer text: "Thank you for your business!" or org tagline.
- Page number in format "Page X of Y" centered at bottom.
- Document number repeated in small text at bottom-left.

---

## 5. Number Format

| Document | Format | Example |
|----------|--------|---------|
| Estimate | `WM-YYYYMMDD-XXXX` | `WM-20250420-0001` |
| Invoice | `INV-YYYYMMDD-XXXX` | `INV-20250420-0001` |

- `YYYYMMDD` is the date the document was created (not today's date — the createdAt timestamp).
- `XXXX` is a zero-padded 4-digit sequence number that resets daily per organization.
- Sequence numbers are derived from the existing `estimateNumber` / `invoiceNumber` fields in the database, or managed via a dedicated `doc_sequences` table in Supabase if needed.

---

## 6. Storage Strategy

### On-Demand Generation (Recommended for MVP)

PDFs are generated fresh at request time. No Storage bucket needed initially. The client receives the PDF binary directly from the Edge Function and can:
- Display in-browser PDF viewer (`<iframe>` or `blob:` URL).
- Trigger browser download.
- Attach to an email via Resend API (Edge Function forwards PDF bytes directly).

### Supabase Storage (Future Enhancement)

If signed/short-lived PDF URLs are needed (e.g., email links that remain valid for 7 days, or customer portal access), PDFs can be uploaded to a private `pdfs` bucket in Supabase Storage:

```
Bucket: pdfs
Path:   {orgId}/{year}/{estimateNumber}.pdf
ACL:    private (requires signed URL)
```

Signed URLs are generated by the Edge Function with a configurable expiry (default: 7 days).

---

## 7. Email Integration

### SMTP / Email Sending Solution: Resend

Use [Resend](https://resend.com) for transactional email sending. The wrapmind app already uses Supabase; Resend integrates cleanly via an Edge Function or server-side API call.

**Flow:**
1. User clicks "Email Estimate" / "Email Invoice" in the app.
2. Frontend calls the existing email Edge Function (or a new one) passing `type`, `id`, and recipient info.
3. Edge Function calls `generate-pdf` internally (or re-uses the same logic) to get the PDF binary.
4. Edge Function calls Resend API to send the email with the PDF as an attachment.

**Email template fields:**
- **From:** `{shopName} <no-reply@{domain}>`
- **To:** `{customerEmail}`
- **Subject:**
  - Estimate: `Your Estimate from {shopName} – {estimateNumber}`
  - Invoice: `Invoice {invoiceNumber} from {shopName}`
- **Body:** HTML email body (styled, mobile-friendly) with the PDF attached.

---

## 8. Open Questions

1. **Font and logo licensing for PDFs:** Are the shop's logo and any custom fonts (e.g., Google Fonts used in the on-screen UI) available for embedding in server-side rendered PDFs? Some font licenses do not allow server-side embedding or PDF export. Should we use a safe default font stack (e.g., Helvetica, Times) for PDFs instead?

2. **Cold start latency:** Edge Functions using Puppeteer/Chromium have significant cold start times (5–15s). For a better UX, should we pre-warm the function daily, or implement a caching layer (e.g., Cloudflare KV) to store recently generated PDFs? Or should we use a lighter-weight HTML-to-PDF library like `pdf-lib` combined with template-based layout instead of a full browser?

3. **Estimate to Invoice conversion flow:** When an estimate is approved and converted to an invoice, should the PDF be re-generated automatically from the invoice record, or is it sufficient for the user to manually click "Email Invoice" after conversion? This affects whether the conversion trigger needs to call the PDF generation flow.

4. **Branding customization per location:** Multi-location shops may want different logos/addresses on PDFs for each location. Should the PDF generation pull location-level branding (logo, address, phone) or fall back to org-level branding? Currently the data model supports `locationId` on both estimates and invoices.

5. **PDF archival and record retention:** Should generated PDFs be stored in Supabase Storage automatically for audit/inrecord purposes, even in the MVP on-demand approach? If so, this adds complexity to the Edge Function (generate PDF → return to client → also upload to Storage).

---

## 9. Acceptance Criteria (MVP)

- [ ] Edge Function `generate-pdf` returns a valid PDF binary for a given estimate or invoice ID, authenticated via session token.
- [ ] PDF layout matches the specification in Section 4.
- [ ] Estimate PDF uses `WM-YYYYMMDD-XXXX` numbering; Invoice PDF uses `INV-YYYYMMDD-XXXX` numbering.
- [ ] "Email Estimate" and "Email Invoice" actions in the app attach the correct PDF and send via Resend.
- [ ] Error responses are meaningful (404 if record not found, 401 if unauthorized).
- [ ] Edge Function handles cold starts gracefully (timeout and retry guidance in error messages).

---

## 10. Out of Scope (MVP)

- Customer self-service portal with PDF download links.
- PDF editing/overwriting after documents are emailed.
- Batch PDF generation for reporting.
- Multi-page PDFs with complex table overflow handling (keep to one page for MVP).
