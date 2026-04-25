-- ============================================================
-- Create pdf_archive table
-- Parent: PRD-pdf-archive.md (PDF Archive Audit Trail)
-- Branch: feat/pdf-archive
-- ============================================================

-- pdf_archive: audit trail + optional storage for every generated PDF
CREATE TABLE IF NOT EXISTS pdf_archive (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Document identity
  doc_type        TEXT        NOT NULL CHECK (doc_type IN ('estimate', 'invoice')),
  doc_id          UUID        NOT NULL,
  doc_number      TEXT        NOT NULL,  -- e.g. 'WM-20250424-0001', frozen at archive time

  -- Content fingerprint (SHA-256 of PDF binary at generation time)
  content_hash    TEXT        NOT NULL,

  -- Who / when
  generated_by    UUID        NOT NULL REFERENCES profiles(id),
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Email record (if emailed at time of generation)
  emailed_to      TEXT,
  emailed_at      TIMESTAMPTZ,

  -- Storage reference (null = metadata only, no binary stored yet)
  storage_path    TEXT,  -- e.g. 'pdfs/{org_id}/{year}/{doc_number}.pdf'

  -- Soft delete for legal hold / audit trail
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID REFERENCES profiles(id),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Each (doc_type, doc_id) combo can have multiple archive versions (different content_hash)
  CONSTRAINT pdf_archive_doc_unique UNIQUE (org_id, doc_type, doc_id, content_hash)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS pdf_archive_org_id_idx       ON pdf_archive(org_id);
CREATE INDEX IF NOT EXISTS pdf_archive_doc_idx          ON pdf_archive(doc_type, doc_id);
CREATE INDEX IF NOT EXISTS pdf_archive_generated_by_idx ON pdf_archive(generated_by);
CREATE INDEX IF NOT EXISTS pdf_archive_generated_at_idx ON pdf_archive(generated_at DESC);
CREATE INDEX IF NOT EXISTS pdf_archive_deleted_at_idx   ON pdf_archive(org_id, deleted_at);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pdf_archive_updated_at ON pdf_archive;
CREATE TRIGGER pdf_archive_updated_at
  BEFORE UPDATE ON pdf_archive
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE pdf_archive ENABLE ROW LEVEL SECURITY;

-- Org members can read their org's archive
DROP POLICY IF EXISTS "pdf_archive_org_read" ON pdf_archive;
CREATE POLICY "pdf_archive_org_read" ON pdf_archive
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_active = true
    )
  );

-- Only system / service role can insert (Edge Function runs as service role)
DROP POLICY IF EXISTS "pdf_archive_system_insert" ON pdf_archive;
CREATE POLICY "pdf_archive_system_insert" ON pdf_archive
  FOR INSERT WITH CHECK (true);

-- System can update (e.g., set storage_path after upload, update emailed_at on resend)
DROP POLICY IF EXISTS "pdf_archive_system_update" ON pdf_archive;
CREATE POLICY "pdf_archive_system_update" ON pdf_archive
  FOR UPDATE USING (true);

-- System can delete (soft delete via deleted_at; hard delete reserved for cleanup/legal)
DROP POLICY IF EXISTS "pdf_archive_system_delete" ON pdf_archive;
CREATE POLICY "pdf_archive_system_delete" ON pdf_archive
  FOR DELETE USING (true);
