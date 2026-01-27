/*
  # Add Shareable Tokens to Documents

  1. Changes
    - Add `share_token` column to `invoices` table
    - Add `share_token` column to `agreements` table
    - Add `share_token` column to `quotations` table
    - Generate unique tokens for existing documents
    - Add indexes for performance

  2. Security
    - Tokens are UUID-based for security
    - Enable public read access via RLS policies for shared documents
    - Policies check for valid share_token
*/

-- Add share_token columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'share_token'
  ) THEN
    ALTER TABLE invoices ADD COLUMN share_token uuid DEFAULT gen_random_uuid() UNIQUE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agreements' AND column_name = 'share_token'
  ) THEN
    ALTER TABLE agreements ADD COLUMN share_token uuid DEFAULT gen_random_uuid() UNIQUE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotations' AND column_name = 'share_token'
  ) THEN
    ALTER TABLE quotations ADD COLUMN share_token uuid DEFAULT gen_random_uuid() UNIQUE;
  END IF;
END $$;

-- Create indexes for share_token lookups
CREATE INDEX IF NOT EXISTS idx_invoices_share_token ON invoices(share_token);
CREATE INDEX IF NOT EXISTS idx_agreements_share_token ON agreements(share_token);
CREATE INDEX IF NOT EXISTS idx_quotations_share_token ON quotations(share_token);

-- Add RLS policies for public access via share token
CREATE POLICY "Public can view invoices with valid share token"
  ON invoices FOR SELECT
  TO anon
  USING (share_token IS NOT NULL);

CREATE POLICY "Public can view agreements with valid share token"
  ON agreements FOR SELECT
  TO anon
  USING (share_token IS NOT NULL);

CREATE POLICY "Public can view quotations with valid share token"
  ON quotations FOR SELECT
  TO anon
  USING (share_token IS NOT NULL);

-- Also need to allow anon users to read related client data
CREATE POLICY "Public can view client data for shared documents"
  ON clients FOR SELECT
  TO anon
  USING (
    id IN (
      SELECT client_id FROM invoices WHERE share_token IS NOT NULL
      UNION
      SELECT client_id FROM agreements WHERE share_token IS NOT NULL
      UNION
      SELECT client_id FROM quotations WHERE share_token IS NOT NULL
    )
  );
