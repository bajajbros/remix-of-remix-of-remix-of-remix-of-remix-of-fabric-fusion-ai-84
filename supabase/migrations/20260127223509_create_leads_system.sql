/*
  # Lead Generation System for Sticker Printing Factory

  ## Overview
  Complete lead management system with AI-powered enrichment and scoring
  for generating daily B2B leads for sticker printing business.

  ## New Tables

  ### 1. `leads`
  Main table storing all lead information with AI enrichment
  - `id` (uuid, primary key)
  - Contact Info: name, company_name, phone, email, location details
  - Business Details: industry, business_type, company_size, website, google_rating
  - AI Enrichment: ai_insights, potential_sticker_needs, estimated_order_value
  - Lead Scoring: score (0-100), confidence_level, priority (hot/warm/cold)
  - Status Tracking: status, assigned_to_user_id, converted_to_client_id
  - Source: source, search_query, google_place_id
  - Engagement: notes, last_contact_date, follow_up_date
  - Timestamps: created_at, updated_at

  ### 2. `lead_generation_logs`
  Tracks all lead generation runs and API usage
  - `id` (uuid, primary key)
  - Execution details: run_date, status, leads_generated, search_query
  - API Usage: google_maps_calls, groq_calls, gemini_calls
  - Performance: duration_seconds, error_message
  - Timestamps: created_at

  ### 3. `lead_sources`
  Configuration table for lead generation targeting
  - `id` (uuid, primary key)
  - Targeting: industry_name, search_keywords, target_locations
  - Settings: is_active, priority, day_of_week
  - Stats: total_leads_generated, last_used_date
  - Timestamps: created_at, updated_at

  ### 4. `lead_activities`
  Tracks all interactions and activities with leads
  - `id` (uuid, primary key)
  - Reference: lead_id, user_id
  - Activity: activity_type, notes, outcome
  - Timestamps: created_at

  ## Security
  - Enable RLS on all tables
  - Authenticated users can read/write their organization's leads
  - Lead activities tracked per user

  ## Indexes
  - Index on lead status and score for filtering
  - Index on company_name and phone for duplicate detection
  - Index on created_at for recent leads queries
*/

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  
  -- Contact Information
  name text,
  company_name text NOT NULL,
  phone text,
  email text,
  
  -- Location Details
  address text,
  city text,
  state text,
  pincode text,
  country text DEFAULT 'India',
  latitude numeric,
  longitude numeric,
  
  -- Business Details
  industry text,
  business_type text,
  company_size text,
  website text,
  google_rating numeric,
  google_reviews_count integer DEFAULT 0,
  google_place_id text UNIQUE,
  
  -- AI Enrichment
  ai_insights text,
  potential_sticker_needs text[],
  estimated_order_value numeric,
  suggested_pitch text,
  
  -- Lead Scoring
  score integer DEFAULT 0,
  confidence_level text DEFAULT 'medium',
  priority text DEFAULT 'warm',
  
  -- Status Tracking
  status text DEFAULT 'new',
  assigned_to_user_id uuid REFERENCES auth.users(id),
  converted_to_client_id uuid REFERENCES clients(id),
  
  -- Source Tracking
  source text DEFAULT 'google_maps',
  search_query text,
  source_url text,
  
  -- Engagement
  notes text,
  last_contact_date timestamptz,
  follow_up_date timestamptz,
  contact_attempts integer DEFAULT 0,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_priority CHECK (priority IN ('hot', 'warm', 'cold')),
  CONSTRAINT valid_status CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'rejected', 'invalid')),
  CONSTRAINT valid_confidence CHECK (confidence_level IN ('low', 'medium', 'high')),
  CONSTRAINT valid_score CHECK (score >= 0 AND score <= 100)
);

-- Create lead_generation_logs table
CREATE TABLE IF NOT EXISTS lead_generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Execution Details
  run_date timestamptz DEFAULT now(),
  status text DEFAULT 'running',
  leads_generated integer DEFAULT 0,
  search_query text,
  target_industry text,
  target_location text,
  
  -- API Usage Stats
  google_maps_calls integer DEFAULT 0,
  groq_calls integer DEFAULT 0,
  gemini_calls integer DEFAULT 0,
  
  -- Performance Metrics
  duration_seconds numeric,
  success_rate numeric,
  error_message text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('running', 'completed', 'failed', 'partial'))
);

-- Create lead_sources table
CREATE TABLE IF NOT EXISTS lead_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Targeting Configuration
  industry_name text NOT NULL,
  search_keywords text[] NOT NULL,
  target_locations text[] DEFAULT ARRAY['Mumbai', 'Delhi', 'Bangalore'],
  
  -- Settings
  is_active boolean DEFAULT true,
  priority integer DEFAULT 5,
  day_of_week integer,
  description text,
  
  -- Statistics
  total_leads_generated integer DEFAULT 0,
  last_used_date timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_day_of_week CHECK (day_of_week >= 0 AND day_of_week <= 6),
  CONSTRAINT valid_priority CHECK (priority >= 1 AND priority <= 10)
);

-- Create lead_activities table
CREATE TABLE IF NOT EXISTS lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  
  -- Activity Details
  activity_type text NOT NULL,
  notes text,
  outcome text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_activity_type CHECK (activity_type IN ('call', 'email', 'meeting', 'note', 'status_change', 'converted'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_company_name ON leads(company_name);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_generation_logs_run_date ON lead_generation_logs(run_date DESC);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads table
CREATE POLICY "Users can view leads"
  ON leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete leads"
  ON leads FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for lead_generation_logs table
CREATE POLICY "Users can view lead generation logs"
  ON lead_generation_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert lead generation logs"
  ON lead_generation_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for lead_sources table
CREATE POLICY "Users can view lead sources"
  ON lead_sources FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage lead sources"
  ON lead_sources FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for lead_activities table
CREATE POLICY "Users can view lead activities"
  ON lead_activities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert lead activities"
  ON lead_activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities"
  ON lead_activities FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert default lead sources for sticker printing business
INSERT INTO lead_sources (industry_name, search_keywords, target_locations, day_of_week, priority, description) VALUES
  ('Retail & Product Stores', ARRAY['retail store', 'product shop', 'gift shop', 'convenience store'], ARRAY['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad'], 1, 9, 'Retail businesses need product labeling stickers'),
  ('Restaurants & Cafes', ARRAY['restaurant', 'cafe', 'food joint', 'bakery', 'sweet shop'], ARRAY['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Chennai'], 2, 8, 'Food businesses need packaging and branding stickers'),
  ('Manufacturing Companies', ARRAY['manufacturing company', 'factory', 'production unit', 'FMCG company'], ARRAY['Mumbai', 'Ahmedabad', 'Surat', 'Delhi', 'Bangalore'], 3, 10, 'Manufacturers need product labels and safety stickers'),
  ('E-commerce Sellers', ARRAY['ecommerce', 'online store', 'warehouse', 'logistics'], ARRAY['Mumbai', 'Delhi', 'Bangalore', 'Gurgaon', 'Noida'], 4, 9, 'E-commerce needs shipping labels and branding stickers'),
  ('Educational Institutions', ARRAY['school', 'college', 'university', 'training center'], ARRAY['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Kolkata'], 5, 6, 'Educational institutions need ID cards and certificates'),
  ('Healthcare & Pharmacy', ARRAY['pharmacy', 'medical store', 'clinic', 'hospital'], ARRAY['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad'], 6, 8, 'Healthcare needs medicine labels and safety stickers'),
  ('Event Companies', ARRAY['event management', 'wedding planner', 'exhibition', 'marketing agency'], ARRAY['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Jaipur'], 0, 7, 'Event companies need promotional stickers and branding')
ON CONFLICT DO NOTHING;