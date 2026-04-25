// =============================================================================
// PDF Archive — Client Helper (used by generate-pdf Edge Function)
// PRD: docs/PRD-pdf-archive.md
// Table: pdf_archive (supabase/migrations/YYYYMMDDHHMMSS_create_pdf_archive.sql)
// =============================================================================

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { UpsertArchiveInput, UpsertArchiveResult } from './archive-types.ts'

// -----------------------------------------------------------------------------
// Supabase Admin Client (service role — bypasses RLS)
// Required for Edge Functions that run with service_role key
// -----------------------------------------------------------------------------

function getSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// -----------------------------------------------------------------------------
// Upsert Archive Record
//
// Behavior (per PRD §10 Open Questions #3):
//   - If a record with matching (doc_type, doc_id, content_hash) already exists:
//       returns existing record, isNew = false
//   - Otherwise: inserts a new record, isNew = true
//
// This means duplicate generations of the same content produce no new record,
// but regenerating the same doc with changed content creates a new archive entry.
// -----------------------------------------------------------------------------

export async function upsertPdfArchive(
  input: UpsertArchiveInput,
): Promise<UpsertArchiveResult> {
  const supabase = getSupabaseAdminClient()

  // Check for existing record with same doc identity + content hash
  const { data: existing, error: selectError } = await supabase
    .from('pdf_archive')
    .select('id, storage_path')
    .eq('org_id', input.orgId)
    .eq('doc_type', input.docType)
    .eq('doc_id', input.docId)
    .eq('content_hash', input.contentHash)
    .is('deleted_at', null)
    .maybeSingle()

  if (selectError) {
    throw new Error(`[pdf_archive] select failed: ${selectError.message}`)
  }

  if (existing) {
    // Content already archived — return existing record (idempotent)
    return {
      id: existing.id,
      isNew: false,
      storageUrl: existing.storage_path
        ? await generateSignedUrl(existing.storage_path)
        : null,
    }
  }

  // Insert new archive record
  const { data: inserted, error: insertError } = await supabase
    .from('pdf_archive')
    .insert({
      org_id: input.orgId,
      doc_type: input.docType,
      doc_id: input.docId,
      doc_number: input.docNumber,
      content_hash: input.contentHash,
      generated_by: input.generatedBy,
      emailed_to: input.emailedTo ?? null,
      emailed_at: input.emailedAt ?? null,
      storage_path: input.storagePath ?? null,
    })
    .select('id, storage_path')
    .single()

  if (insertError) {
    throw new Error(`[pdf_archive] insert failed: ${insertError.message}`)
  }

  return {
    id: inserted.id,
    isNew: true,
    storageUrl: inserted.storage_path
      ? await generateSignedUrl(inserted.storage_path)
      : null,
  }
}

// -----------------------------------------------------------------------------
// Update archive record (e.g., set storage_path after upload, update emailed_at)
// -----------------------------------------------------------------------------

export async function updatePdfArchive(
  id: string,
  updates: {
    storagePath?: string | null
    emailedTo?: string | null
    emailedAt?: string | null
    deletedAt?: string | null
    deletedBy?: string | null
  },
): Promise<void> {
  const supabase = getSupabaseAdminClient()

  const set: Record<string, unknown> = {}
  if (updates.storagePath !== undefined) set.storage_path = updates.storagePath
  if (updates.emailedTo !== undefined) set.emailed_to = updates.emailedTo
  if (updates.emailedAt !== undefined) set.emailed_at = updates.emailedAt
  if (updates.deletedAt !== undefined) set.deleted_at = updates.deletedAt
  if (updates.deletedBy !== undefined) set.deleted_by = updates.deletedBy

  const { error } = await supabase
    .from('pdf_archive')
    .update(set)
    .eq('id', id)

  if (error) {
    throw new Error(`[pdf_archive] update failed: ${error.message}`)
  }
}

// -----------------------------------------------------------------------------
// Soft-delete an archive record
// -----------------------------------------------------------------------------

export async function softDeletePdfArchive(
  id: string,
  deletedBy: string,
): Promise<void> {
  await updatePdfArchive(id, {
    deletedAt: new Date().toISOString(),
    deletedBy,
  })
}

// -----------------------------------------------------------------------------
// Generate a signed URL for a stored PDF (1-hour expiry)
// Signed URLs are always regenerated on demand — never stored in the DB.
// -----------------------------------------------------------------------------

async function generateSignedUrl(storagePath: string): Promise<string> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.storage
    .from('pdfs')
    .createSignedUrl(storagePath, 3600) // 1 hour

  if (error || !data) {
    console.warn(`[pdf_archive] createSignedUrl failed for ${storagePath}: ${error?.message}`)
    return ''
  }

  return data.signedUrl
}

// -----------------------------------------------------------------------------
// Fetch a single archive record by ID (service role)
// -----------------------------------------------------------------------------

export async function getArchiveById(
  id: string,
): Promise<{ record: Record<string, unknown>; storageUrl: string | null } | null> {
  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase
    .from('pdf_archive')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null

  const storageUrl = data.storage_path
    ? await generateSignedUrl(data.storage_path as string)
    : null

  return { record: data as Record<string, unknown>, storageUrl }
}
