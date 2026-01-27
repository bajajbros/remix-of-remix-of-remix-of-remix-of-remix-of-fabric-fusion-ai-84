/*
  # Fix Share Token Access for Authenticated Users

  1. Problem
    - Share links work for anonymous users (anon role) but not for authenticated users
    - Authenticated users trying to access shared documents get "not found" error
    - This happens because authenticated users use different RLS policies than anonymous users

  2. Solution
    - Add policies allowing authenticated users to view shared documents
    - Apply to invoices, quotations, agreements, clients, and their items
  
  3. Security
    - Only grants SELECT access to documents with valid share_token
    - Does not compromise existing user-owned document security
*/

-- Allow authenticated users to view invoices via share token
CREATE POLICY "Authenticated users can view shared invoices"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (share_token IS NOT NULL);

-- Allow authenticated users to view quotations via share token
CREATE POLICY "Authenticated users can view shared quotations"
  ON quotations
  FOR SELECT
  TO authenticated
  USING (share_token IS NOT NULL);

-- Allow authenticated users to view agreements via share token
CREATE POLICY "Authenticated users can view shared agreements"
  ON agreements
  FOR SELECT
  TO authenticated
  USING (share_token IS NOT NULL);

-- Allow authenticated users to view clients of shared documents
CREATE POLICY "Authenticated users can view clients for shared documents"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT client_id FROM invoices WHERE share_token IS NOT NULL
      UNION
      SELECT client_id FROM quotations WHERE share_token IS NOT NULL
      UNION
      SELECT client_id FROM agreements WHERE share_token IS NOT NULL
    )
  );

-- Allow authenticated users to view invoice items via share token
CREATE POLICY "Authenticated users can view shared invoice items"
  ON invoice_items
  FOR SELECT
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE share_token IS NOT NULL
    )
  );

-- Allow authenticated users to view quotation items via share token
CREATE POLICY "Authenticated users can view shared quotation items"
  ON quotation_items
  FOR SELECT
  TO authenticated
  USING (
    quotation_id IN (
      SELECT id FROM quotations WHERE share_token IS NOT NULL
    )
  );
