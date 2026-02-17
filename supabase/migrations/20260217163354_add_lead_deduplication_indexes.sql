/*
  # Add Lead Deduplication Indexes and Constraints
  
  1. Changes
    - Add unique constraint on google_place_id to prevent duplicate Google Places
    - Add indexes on phone and company_name for faster duplicate detection
    - Add normalized phone column for better phone number matching
    - Add function to normalize phone numbers (remove spaces, special chars)
  
  2. Security
    - No changes to RLS policies
*/

-- Add normalized phone function for better duplicate detection
CREATE OR REPLACE FUNCTION normalize_phone(phone_input text)
RETURNS text AS $$
BEGIN
  -- Remove all non-digit characters except +
  RETURN regexp_replace(phone_input, '[^0-9+]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add normalized_phone column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'normalized_phone'
  ) THEN
    ALTER TABLE leads ADD COLUMN normalized_phone text GENERATED ALWAYS AS (normalize_phone(phone)) STORED;
  END IF;
END $$;

-- Create index on normalized phone for fast duplicate detection
CREATE INDEX IF NOT EXISTS idx_leads_normalized_phone ON leads(normalized_phone) WHERE normalized_phone IS NOT NULL;

-- Create index on company name (case-insensitive) for duplicate detection
CREATE INDEX IF NOT EXISTS idx_leads_company_name_lower ON leads(LOWER(company_name));

-- Create index on google_place_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_leads_google_place_id ON leads(google_place_id) WHERE google_place_id IS NOT NULL;

-- Add unique constraint on google_place_id per user to prevent exact duplicates
CREATE UNIQUE INDEX IF NOT EXISTS unique_google_place_id_per_user 
  ON leads(google_place_id, user_id) 
  WHERE google_place_id IS NOT NULL;

-- Create index on email for duplicate detection
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email) WHERE email IS NOT NULL;

-- Create composite index for faster status and priority queries
CREATE INDEX IF NOT EXISTS idx_leads_status_priority ON leads(status, priority, created_at DESC);
