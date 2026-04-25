// =============================================================================
// PDF Archive — Shared Types
// Mirrors: supabase/migrations/YYYYMMDDHHMMSS_create_pdf_archive.sql
// PRD: docs/PRD-pdf-archive.md
// =============================================================================

/** Supported document types that can be archived */
export type DocType = 'estimate' | 'invoice'

// -----------------------------------------------------------------------------
// Core Archive Record
// -----------------------------------------------------------------------------

export interface PdfArchiveRecord {
  id: string
  orgId: string
  docType: DocType
  docId: string
  docNumber: string
  contentHash: string
  generatedBy: string
  generatedAt: string
  emailedTo: string | null
  emailedAt: string | null
  storagePath: string | null
  deletedAt: string | null
  deletedBy: string | null
  createdAt: string
  updatedAt: string
}

// -----------------------------------------------------------------------------
// Request / Response Types
// -----------------------------------------------------------------------------

/** POST /functions/v1/get-archive — request body */
export interface GetArchiveRequest {
  docType: DocType
  docId: string
}

/** One entry returned by get-archive or list-archives */
export interface PdfArchiveEntry extends PdfArchiveRecord {
  /** Signed URL to the PDF binary, regenerated on demand (never stored) */
  storageUrl: string | null
}

/** POST /functions/v1/get-archive — response */
export interface GetArchiveResponse {
  archives: PdfArchiveEntry[]
}

/** POST /functions/v1/list-archives — request body */
export interface ListArchivesRequest {
  orgId: string
  docType?: DocType
  limit?: number
  offset?: number
}

/** POST /functions/v1/list-archives — response */
export interface ListArchivesResponse {
  archives: PdfArchiveEntry[]
  total: number
  limit: number
  offset: number
}

// -----------------------------------------------------------------------------
// Upsert / Archive Helpers (used by generate-pdf)
// -----------------------------------------------------------------------------

/** Input for upserting a new archive record from generate-pdf */
export interface UpsertArchiveInput {
  orgId: string
  docType: DocType
  docId: string
  docNumber: string
  contentHash: string
  generatedBy: string
  emailedTo?: string | null
  emailedAt?: string | null
  storagePath?: string | null
}

/** Result returned after an upsert archive operation */
export interface UpsertArchiveResult {
  id: string
  isNew: boolean        // true = inserted, false = matched existing content_hash
  storageUrl: string | null
}
