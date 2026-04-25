// =============================================================================
// PDF Generation Edge Function — Shared Types
// =============================================================================
// These types mirror the data shapes defined in the PRD:
//   docs/PRD-app.wrapmind-pdf-generation.md
// =============================================================================

// -----------------------------------------------------------------------------
// Request Types
// -----------------------------------------------------------------------------

/** POST /functions/v1/generate-pdf — request body */
export interface PdfGenerateRequest {
  type: 'estimate' | 'invoice'
  id: string
  orgId: string
}

// -----------------------------------------------------------------------------
// Estimate Record
// -----------------------------------------------------------------------------

export interface EstimateRecord {
  id: string
  estimateNumber: string
  status: EstimateStatus
  locationId: string
  customerId: string
  customerName: string
  customerPhone: string | null
  customerEmail: string | null
  vehicleId: string
  vehicleLabel: string
  vehicleVin: string | null
  package: string | null
  material: string | null
  materialColor: string | null
  laborHours: number
  basePrice: number
  laborCost: number
  materialCost: number
  discount: number
  total: number
  notes: string | null
  createdBy: string
  assignedTo: string | null
  createdAt: string
  sentAt: string | null
  expiresAt: string | null
  approvedAt: string | null
  declinedAt: string | null
  convertedToInvoice: boolean
  invoiceId: string | null
}

export type EstimateStatus =
  | 'draft'
  | 'sent'
  | 'approved'
  | 'declined'
  | 'expired'
  | 'converted'

// -----------------------------------------------------------------------------
// Invoice Record
// -----------------------------------------------------------------------------

export interface InvoiceRecord {
  id: string
  invoiceNumber: string
  estimateId: string | null
  estimateNumber: string | null
  status: InvoiceStatus
  locationId: string
  customerId: string
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  vehicleLabel: string
  lineItems: InvoiceLineItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  discount: number
  total: number
  amountPaid: number
  amountDue: number
  payments: PaymentRecord[]
  notes: string | null
  terms: string | null
  issuedAt: string | null
  dueAt: string | null
  paidAt: string | null
  voidedAt: string | null
  createdBy: string
}

export type InvoiceStatus =
  | 'draft'
  | 'issued'
  | 'sent'
  | 'partial'
  | 'paid'
  | 'voided'
  | 'overdue'

export interface InvoiceLineItem {
  id: string
  description: string
  qty: number
  unit: string
  unitPrice: number
  total: number
}

export interface PaymentRecord {
  id: string
  method: string
  amount: number
  note: string | null
  recordedAt: string
  recordedBy: string
}

// -----------------------------------------------------------------------------
// Organization / Branding
// -----------------------------------------------------------------------------

export interface OrgBranding {
  orgId: string
  shopName: string
  logoUrl: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
}

export interface LocationBranding {
  locationId: string
  shopName: string
  logoUrl: string | null
  address: string | null
  phone: string | null
  email: string | null
}

// -----------------------------------------------------------------------------
// Response Types
// -----------------------------------------------------------------------------

/** Successful PDF generation — binary PDF returned directly */
export interface PdfGenerateSuccess {
  // (PDF binary is the response body; no JSON wrapper)
}

/** Error response shape */
export interface PdfGenerateError {
  error: string
  code?: string
}

// -----------------------------------------------------------------------------
// Internal / Helper Types
// -----------------------------------------------------------------------------

/** Normalised document data used by the HTML rendering layer */
export interface PdfDocumentData {
  documentType: 'estimate' | 'invoice'
  documentNumber: string
  documentDate: string
  status: string
  branding: LocationBranding
  customer: {
    name: string
    email: string | null
    phone: string | null
  }
  vehicle: {
    label: string
    vin: string | null
  }
  lineItems: PdfLineItem[]
  pricing: PdfPricingBlock
  notes: string | null
  terms: string | null
}

export interface PdfLineItem {
  #: number
  description: string
  qty: number
  unit: string
  unitPrice: number
  total: number
}

export interface PdfPricingBlock {
  subtotal: number
  taxRate: number
  taxAmount: number
  discount: number
  total: number
}
