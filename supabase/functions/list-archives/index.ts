// =============================================================================
// List Archives — Edge Function
// Endpoint: POST /functions/v1/list-archives
// PRD: docs/PRD-pdf-archive.md §5
//
// Returns a paginated list of archive records for an org,
// sorted by created_at DESC.
//
// Auth: Bearer token validated via supabase.auth.getUser()
//       org membership verified via RLS (pdf_archive_org_read policy)
// Request: { orgId: string, docType?: "estimate" | "invoice", limit?: number, offset?: number }
// Response: { data: PdfArchiveEntry[], hasMore: boolean, total: number, error?: string }
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { ListArchivesRequest, PdfArchiveEntry } from '../generate-pdf/archive-types.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

// -----------------------------------------------------------------------------
// Client Helpers
// -----------------------------------------------------------------------------

function getSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function getSupabaseUserClient(authToken: string): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  return createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${authToken}` } },
  })
}

// -----------------------------------------------------------------------------
// Signed URL Generation (1-hour expiry)
// -----------------------------------------------------------------------------

async function generateSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('pdfs')
    .createSignedUrl(storagePath, 3600) // 1 hour

  if (error || !data) {
    console.warn(`[list-archives] createSignedUrl failed for ${storagePath}: ${error?.message}`)
    return ''
  }

  return data.signedUrl
}

// -----------------------------------------------------------------------------
// Auth: Validate Bearer token
// -----------------------------------------------------------------------------

async function validateAuth(
  supabase: SupabaseClient,
  authToken: string,
): Promise<{ userId: string } | null> {
  const { data: { user }, error } = await supabase.auth.getUser(authToken)
  if (error || !user) {
    return null
  }
  return { userId: user.id }
}

// -----------------------------------------------------------------------------
// Entry Point
// -----------------------------------------------------------------------------

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    // -------------------------------------------------------------------------
    // Step 1 — Authenticate via Bearer token
    // -------------------------------------------------------------------------
    const authToken = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!authToken) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const userClient = getSupabaseUserClient(authToken)
    const auth = await validateAuth(userClient, authToken)
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // -------------------------------------------------------------------------
    // Step 2 — Parse and validate request body
    // -------------------------------------------------------------------------
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

    // Validate docType if provided
    if (docType && docType !== 'estimate' && docType !== 'invoice') {
      return new Response(JSON.stringify({ error: 'docType must be "estimate" or "invoice"' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // -------------------------------------------------------------------------
    // Step 3 — Query pdf_archive with pagination via admin client
    // RLS policy pdf_archive_org_read enforces org membership
    // -------------------------------------------------------------------------
    const adminClient = getSupabaseAdminClient()

    // Build query with optional docType filter
    let query = adminClient
      .from('pdf_archive')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
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

    // -------------------------------------------------------------------------
    // Step 4 — Generate signed URLs for records with storage_path
    // -------------------------------------------------------------------------
    const entries: PdfArchiveEntry[] = await Promise.all(
      (rows ?? []).map(async (row) => {
        const storageUrl = row.storage_path
          ? await generateSignedUrl(adminClient, row.storage_path)
          : null

        return {
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
          storageUrl,
        }
      }),
    )

    const total = count ?? 0
    const hasMore = offset + (rows?.length ?? 0) < total

    const response = { data: entries, hasMore, total }
    return new Response(JSON.stringify(response), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[/functions/v1/list-archives] Error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
