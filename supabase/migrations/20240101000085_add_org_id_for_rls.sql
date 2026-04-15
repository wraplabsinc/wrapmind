-- WrapOs Database Schema - Add org_id for RLS Policies (Issue #40)

-- Add org_id to tables that need multi-tenant RLS separation

-- estimates
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_estimates_org_id ON estimates(org_id);

-- clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_clients_org_id ON clients(org_id);

-- users
ALTER TABLE users ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);

-- estimates tables
ALTER TABLE estimate_upsells ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_estimate_upsells_org_id ON estimate_upsells(org_id);

ALTER TABLE estimate_notes ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_estimate_notes_org_id ON estimate_notes(org_id);

ALTER TABLE estimate_templates ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_estimate_templates_org_id ON estimate_templates(org_id);

ALTER TABLE estimate_versions ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_estimate_versions_org_id ON estimate_versions(org_id);

-- intake and notifications
ALTER TABLE intake_leads ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_intake_leads_org_id ON intake_leads(org_id);

ALTER TABLE notifications_log ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_notifications_log_org_id ON notifications_log(org_id);

-- film calculator
ALTER TABLE film_calculator_results ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_film_calculator_results_org_id ON film_calculator_results(org_id);

-- job tracking
ALTER TABLE photo_timeline ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_photo_timeline_org_id ON photo_timeline(org_id);

ALTER TABLE job_tracker_tokens ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_job_tracker_tokens_org_id ON job_tracker_tokens(org_id);

ALTER TABLE labor_logs ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_labor_logs_org_id ON labor_logs(org_id);

ALTER TABLE condition_reports ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_condition_reports_org_id ON condition_reports(org_id);

ALTER TABLE job_bookings ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_job_bookings_org_id ON job_bookings(org_id);

-- communication
ALTER TABLE sms_threads ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_sms_threads_org_id ON sms_threads(org_id);

ALTER TABLE review_requests ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_review_requests_org_id ON review_requests(org_id);

ALTER TABLE follow_up_log ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_follow_up_log_org_id ON follow_up_log(org_id);

-- warranty
ALTER TABLE warranty_referrals ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_warranty_referrals_org_id ON warranty_referrals(org_id);

-- audit and feedback
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_audit_log_org_id ON audit_log(org_id);

-- portfolio
ALTER TABLE portfolio_tags ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_portfolio_tags_org_id ON portfolio_tags(org_id);
