# PRD: PDF Archive — Audit Trail + Storage

**Project:** wrapmind app
**Status:** Draft
**Parent:** Issue #93 (PDF Generation)
**Created:** 2026-04-24

---

## 1. Overview

Adds a `pdf_archive` table to store metadata about every generated PDF document, plus optional upload to Supabase Storage for long-term retention. This provides an audit trail and allows customers/admins to re-download previously generated PDFs.

This is a post-MVP addition to the PDF Generation PRD (`PRD-app.wrapmind-pdf-generation.md`). The core `generate-pdf` Edge Function works fine without it.

---

## 2. Motivation

**Audit trail:** Businesses need to prove what was sent to a customer and when. Storing metadata (who generated it, when, for whom, which version of the data) creates an immutable record even if the PDF binary is not stored.

**Re-download:** After an invoice/estimate PDF is emailed, the shop may need to resend it, print it, or attach it to a support ticket. Without archival, the PDF must be regenerated — which could produce different output if data changed since the original send.

**Compliance:** Some industries require document retention for 3–7 years. PDFs should be preserved as-delivered, not re-generated.

---

## 3. Database Schema

### Table: `pdf_archive`

```sql
CREATE TABLE pdf_archive (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID        NOT NULL REFERENCES organizations(id),
  location_id UUID        REFERENCES locations(id),

  -- Document identity
  doc_type    TEXT        NOT NULL CHECK (doc_type IN ('estimate', 'invoice')),
  doc_id      UUID        NOT NULL,  -- FK to estimates.id or invoices.id
  doc_number  TEXT        NOT NULL,  -- e.g. 'WM-20250424-0001', frozen at archive time

  -- Content fingerprint (SHA-256 of PDF binary at generation time)
  content_hash TEXT       NOT NULL,

  -- PDF metadata
  file_size   INTEGER,              -- bytes
  page_count  INTEGER,

  -- Who / when
  generated_by UUID       NOT NULL REFERENCES profiles(id),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Email record (if emailed at time of generation)
  emailed_to  TEXT,
  emailed_at  TIMESTAMPTZ,

  -- Storage reference (null = metadata only, no binary stored yet)
  storage_path TEXT,               -- e.g. 'pdfs/{org_id}/{year}/{doc_number}.pdf'
  storage_url  TEXT,               -- signed URL, refreshed on demand

  -- Soft delete for legal hold scenarios
  deleted_at   TIMESTAMPTZ,
  deleted_by   UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX pdf_archive_org_id_idx      ON pdf_archive(org_id);
CREATE INDEX pdf_archive_doc_idx         ON pdf_archive(doc_type, doc_id);
CREATE INDEX pdf_archive_generated_by_idx ON pdf_archive(generated_by);
CREATE INDEX pdf_archive_generated_at_idx ON pdf_archive(generated_at DESC);

-- RLS
ALTER TABLE pdf_archive ENABLE ROW LEVEL SECURITY;

-- Org members can read their org's archive
CREATE POLICY pdf_archive_org_read ON pdf_archive
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_active = true
    )
  );

-- Only system / admins can insert (Edge Function runs as service role)
CREATE POLICY pdf_archive_system_insert ON pdf_archive
  FOR INSERT WITH CHECK (true);

-- System can update (e.g., set storage_path after upload)
CREATE POLICY pdf_archive_system_update ON pdf_archive
  FOR UPDATE USING (true);
```

---

## 4. Storage Bucket

```
Bucket:  pdfs
Path:    {orgId}/{year}/{doc_type}/{doc_number}.pdf
ACL:     private (requires signed URL)
Max size: 10MB per PDF
```

### Signed URL behavior
- On archive read, generate a signed URL with 1-hour expiry.
- The URL is never stored — always regenerated on demand to avoid expiry issues.
- Signed URLs are generated server-side by the Edge Function and returned to the client.

---

## 5. Edge Function Changes

### `generate-pdf` — new flag

```json
{
  "type": "estimate",
  "id": "uuid",
  "orgId": "uuid",
  "archive": true   // default: false for MVP compat
}
```

When `archive: true`:
1. Generate PDF binary as normal.
2. Compute `SHA-256(content)`.
3. Check if a record with matching `doc_id` AND `content_hash` already exists.
   - If exists: return existing record's `storage_url` (generate fresh signed URL).
   - If not exists: insert `pdf_archive` row with metadata.
4. If Storage upload step succeeds: update `storage_path` on the record.
5. Return `{ pdf_base64, archive_id, storage_url }`.

### `get-archive` — new endpoint

```json
POST /functions/v1/get-archive
{
  "docType": "estimate" | "invoice",
  "docId": "uuid"
}
```

Returns all archive records for that document (newest first), with fresh signed URLs.

### `list-archives` — new endpoint

```json
POST /functions/v1/list-archives
{
  "orgId": "uuid",
  "docType": "estimate" | "invoice",
  "limit": 50,
  "offset": 0
}
```

Paginated list of archive records for the org, sorted by `generated_at DESC`.

---

## 6. UI Changes

### Admin / Settings — PDF Archive browser
- New "Document Archive" tab under Settings or Reports.
- Shows a table: Document #, Type, Customer, Generated By, Generated At, Emailed To, Actions.
- Actions: **Download PDF** (regenerates signed URL), **Resend Email**.
- Filter by: date range, doc type, customer, generated by.

### Estimate / Invoice view — archive indicator
- If a PDF was previously generated for this document, show a small "PDF archived" badge with timestamp.
- Link to download from archive.

---

## 7. Email Attachment Behavior

When `archive: true` is set and the email flow is triggered:
1. PDF is archived first (metadata + optional Storage upload).
2. The `pdf_archive.emailed_to` and `pdf_archive.emailed_at` fields are set.
3. Email is sent with the archived PDF attached (binary from memory, not re-fetched from Storage).
4. Subsequent "Resend" actions update `emailed_at` on the existing archive record.

---

## 8. Content Hash — Why It Matters

Two archive records with the same `doc_id` but different `content_hash` means the document was regenerated and the content changed between generations. This is valuable for:
- Proving which version was sent to the customer and when.
- Auditing whether a customer received the original quote or a revised one.
- Detecting unauthorized changes to historical documents.

---

## 9. Storage vs. Metadata-Only

**Metadata-only (no Storage upload):**
- Cheaper, simpler.
- PDF can be regenerated from DB data on demand.
- Risk: if DB data changes before regeneration, the regenerated PDF may differ from the original.
- Acceptable for: short-term retention, low-stakes documents.

**Full Storage (binary archived):**
- Stores the exact binary that was sent.
- Immune to subsequent data changes.
- Required for: compliance/audit, legal hold, long-term retention.
- Cost: Supabase Storage (~$0.021/GB/month).

**Recommendation for MVP:** Metadata-only for now. Offer Storage upload as an optional upsell or toggle per-org (`organizations.archive_pdfs_with_storage` boolean). This avoids the Storage cost and complexity until it's actually needed.

---

## 10. Open Questions (Resolved)

1. ~~Retention policy~~ → **Indefinite. No auto-delete. Archive system built later if needed.**
2. ~~Storage toggle~~ → **Global. WrapLabs controls whether PDFs are uploaded to Supabase Storage for all orgs.**
3. ~~Force re-archive~~ → **Upsert. Replace existing archive record with new `content_hash` when same doc is regenerated. Cleaner, no duplicates.**
4. ~~Delete behavior~~ → **Soft delete. Archive preserved with `deleted_at` timestamp. Full audit trail even if source doc is purged.**
5. ~~Large PDF handling~~ → **Fallback to metadata-only. Create record without binary, log warning. Don't block the user.**

Note: The acceptance criteria item "Duplicate generation... creates a new record (not an upsert)" conflicts with resolved decision #3. It should read: duplicate generation creates a new record only if `content_hash` differs; otherwise the existing record is updated in place.

---

## 11. Acceptance Criteria

- [x] `pdf_archive` table created with RLS policies.
- [x] `generate-pdf` accepts `archive: true` flag; inserts or updates record accordingly (upsert on `doc_type + doc_id`).
- [x] `content_hash` (SHA-256) computed and stored on every archive entry.
- [x] `get-archive` returns all archive entries for a document with fresh signed URLs.
- [x] `list-archives` returns paginated archive list for the org.
- [x] Archive indicator shown on Estimate/Invoice view when prior generation exists.
- [x] Settings UI shows Document Archive browser with Download/Resend actions.
- [x] Regeneration of the same document upserts the existing record with new `content_hash`.

---

## 11. Settings UI Decisions (Resolved)

| # | Question | Decision |
|---|----------|----------|
| 1 | Archive history display | **Drawer.** Opens alongside the detail view, not a separate page. |
| 2 | Archive list preview | **Metadata only.** No thumbnail. |
| 3 | Resend action | **Email body with PDF link.** PDF not pre-attached. |
| 4 | Delete confirmation | **Soft-delete only, no undo for MVP.** |

---

## 12. Out of Scope

- Automatic Storage upload (toggle deferred to future).
- Document signing / timestamp (external service like DocuSign).
- PDF comparison / diffing tool.
- Bulk export of archive to ZIP.
- Legal hold mode (hard delete prevention).
- Thumbnail previews in archive list.
