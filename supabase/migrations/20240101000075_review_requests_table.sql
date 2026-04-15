-- WrapOs Database Schema - Review Requests Table (Issue #58)

CREATE TABLE IF NOT EXISTS review_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID REFERENCES estimates(id),
    client_id UUID REFERENCES clients(id),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    clicked_at TIMESTAMPTZ,
    reviewed BOOLEAN DEFAULT false,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_requests_estimate_id ON review_requests(estimate_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_client_id ON review_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_reviewed ON review_requests(reviewed);
CREATE INDEX IF NOT EXISTS idx_review_requests_sent_at ON review_requests(sent_at);

ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access during development" ON review_requests
    FOR ALL USING (true) WITH CHECK (true);
