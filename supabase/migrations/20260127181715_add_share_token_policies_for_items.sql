/*
  # Add Share Token Policies for Invoice and Quotation Items

  1. New Policies
    - Allow anonymous users to read invoice_items via share_token
    - Allow anonymous users to read quotation_items via share_token
  
  2. Security
    - Policies check that the parent invoice/quotation has a valid share_token
    - Only SELECT access is granted to anonymous users
    - Existing policies remain unchanged
*/

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'invoice_items' 
    AND policyname = 'Allow public read for shared invoice items'
  ) THEN
    DROP POLICY "Allow public read for shared invoice items" ON invoice_items;
  END IF;
END $$;

-- Policy for invoice_items accessed via share_token
CREATE POLICY "Allow public read for shared invoice items"
  ON invoice_items
  FOR SELECT
  TO anon
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE share_token IS NOT NULL
    )
  );

-- Drop existing quotation policy if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quotation_items' 
    AND policyname = 'Allow public read for shared quotation items'
  ) THEN
    DROP POLICY "Allow public read for shared quotation items" ON quotation_items;
  END IF;
END $$;

-- Policy for quotation_items accessed via share_token
CREATE POLICY "Allow public read for shared quotation items"
  ON quotation_items
  FOR SELECT
  TO anon
  USING (
    quotation_id IN (
      SELECT id FROM quotations WHERE share_token IS NOT NULL
    )
  );
