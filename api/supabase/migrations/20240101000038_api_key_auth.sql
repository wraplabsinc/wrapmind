-- API Key Authentication Setup

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,           -- e.g., "WrapApp iOS", "Web Dashboard"
    key_hash VARCHAR(64) NOT NULL,       -- SHA256 hash of the API key
    key_prefix VARCHAR(8) NOT NULL,      -- First 8 chars for identification (not auth)
    is_active BOOLEAN DEFAULT true,
    rate_limit INTEGER DEFAULT 1000,    -- requests per hour
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- Create index for lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

-- Function to validate API key
CREATE OR REPLACE FUNCTION validate_api_key(p_key TEXT)
RETURNS api_keys AS $$
DECLARE
    v_key_record api_keys%ROWTYPE;
BEGIN
    -- Hash the provided key
    SELECT * INTO v_key_record 
    FROM api_keys 
    WHERE key_hash = encode(sha256(p_key::bytea), 'hex')
    AND is_active = true;
    
    IF FOUND THEN
        -- Update last used timestamp
        UPDATE api_keys SET last_used_at = NOW() WHERE id = v_key_record.id;
        RETURN v_key_record;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to check if request has valid API key
CREATE OR REPLACE FUNCTION has_valid_api_key()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check for x-api-key header (via request.headers() - Supabase specific)
    -- For REST API, we check a request header
    RETURN validate_api_key(current_setting('request.headers', true)::text) IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Add API key to request context (Postgres function)
CREATE OR REPLACE FUNCTION get_api_key_record()
RETURNS api_keys AS $$
DECLARE
    v_headers TEXT;
    v_key TEXT;
BEGIN
    -- Try to get from current_setting (works in some Supabase contexts)
    v_headers := current_setting('request.headers', true);
    
    -- Extract api key from headers JSON if present
    -- Pattern: "x-api-key":"your-key"
    IF v_headers LIKE '%x-api-key%' THEN
        v_key := SUBSTRING(v_headers FROM '"x-api-key"\s*:\s*"([^"]+)"');
        IF v_key IS NOT NULL THEN
            RETURN validate_api_key(v_key);
        END IF;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- For now, create a simple function that reads from request.jwt.claims or headers
-- Supabase passes headers in a special way
CREATE OR REPLACE FUNCTION current_api_key()
RETURNS TEXT AS $$
BEGIN
    -- This will be overridden by Supabase with actual header value
    -- For local development, check a request header variable
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies to require API key
-- First, drop the open "Allow all access" policy
DROP POLICY IF EXISTS "Allow all access during development" ON cars;

-- Create new policies requiring API key
CREATE POLICY "API key access to cars" ON cars
    FOR ALL USING (
        -- For development: allow if no API key required (check env var)
        -- In production: require valid API key
        current_setting('app.require_api_key', true) != 'true'
        OR 
        get_api_key_record() IS NOT NULL
    );

-- Same for wrap_packages, wrap_materials, etc.
CREATE POLICY "API key access to wrap_packages" ON wrap_packages
    FOR ALL USING (
        current_setting('app.require_api_key', true) != 'true'
        OR get_api_key_record() IS NOT NULL
    );

CREATE POLICY "API key access to wrap_materials" ON wrap_materials
    FOR ALL USING (
        current_setting('app.require_api_key', true) != 'true'
        OR get_api_key_record() IS NOT NULL
    );

CREATE POLICY "API key access to dimension_references" ON dimension_references
    FOR ALL USING (
        current_setting('app.require_api_key', true) != 'true'
        OR get_api_key_record() IS NOT NULL
    );

-- Helper function to generate a new API key (returns both hash for storage and raw for display)
CREATE OR REPLACE FUNCTION generate_api_key(p_name TEXT)
RETURNS TABLE(key_id UUID, raw_key TEXT, key_hash VARCHAR) AS $$
DECLARE
    v_raw_key TEXT;
    v_key_bytes BYTEA;
    v_hash VARCHAR;
    v_key_id UUID;
BEGIN
    -- Generate random 32-character key
    v_raw_key := encode(sha256(random()::text::bytea), 'hex');
    v_raw_key := substring(v_raw_key, 1, 8) || '-' || 
                 substring(v_raw_key, 9, 8) || '-' || 
                 substring(v_raw_key, 17, 8) || '-' || 
                 substring(v_raw_key, 25, 8);
    
    -- Hash for storage
    v_key_bytes := encode(v_raw_key::bytea, 'hex')::bytea;
    -- Actually hash with SHA256 for secure storage
    v_hash := encode(sha256(v_raw_key::bytea), 'hex');
    
    -- Insert and get ID
    INSERT INTO api_keys (name, key_hash, key_prefix)
    VALUES (p_name, v_hash, substring(v_raw_key, 1, 8))
    RETURNING id INTO v_key_id;
    
    RETURN QUERY SELECT v_key_id, v_raw_key, v_hash;
END;
$$ LANGUAGE plpgsql;

-- Create a sample API key for testing (WrapApp Development)
-- Key: wrap-dev-12345678-abcdefghijklmnop
INSERT INTO api_keys (name, key_hash, key_prefix)
VALUES (
    'WrapApp Development',
    encode(sha256('wrap-dev-12345678-abcdefghijklmnop'::bytea), 'hex'),
    'wrap-dev'
);

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM api_keys;
    RAISE NOTICE 'API keys created: %', v_count;
END $$;