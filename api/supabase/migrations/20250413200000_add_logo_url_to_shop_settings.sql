-- Add logo_url column to shop_settings for storing shop logo URL/base64
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS logo_url text;
