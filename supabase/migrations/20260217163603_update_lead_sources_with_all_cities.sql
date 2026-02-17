/*
  # Update Lead Sources with Comprehensive City Coverage
  
  1. Changes
    - Update all existing lead sources with expanded target locations
    - Add all major Indian cities (20 cities) to target_locations array
    - Cities include: Mumbai, Delhi, Bangalore, Pune, Hyderabad, Chennai, Kolkata, 
      Jaipur, Ahmedabad, Lucknow, Surat, Nagpur, Indore, Bhopal, Chandigarh,
      Gurgaon, Noida, Ghaziabad, Faridabad, Vishakhapatnam
  
  2. Security
    - No changes to RLS policies
*/

-- Update all existing lead sources with comprehensive city list
UPDATE lead_sources 
SET target_locations = ARRAY[
  'Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 
  'Kolkata', 'Jaipur', 'Ahmedabad', 'Lucknow', 'Surat', 'Nagpur', 
  'Indore', 'Bhopal', 'Chandigarh', 'Gurgaon', 'Noida', 
  'Ghaziabad', 'Faridabad', 'Vishakhapatnam'
]
WHERE target_locations IS NULL OR array_length(target_locations, 1) < 5;

-- Update specific industries with additional relevant keywords
UPDATE lead_sources 
SET search_keywords = ARRAY['restaurant', 'food', 'dining', 'cafe', 'eatery', 'kitchen']
WHERE industry_name = 'Restaurant' AND array_length(search_keywords, 1) < 3;

UPDATE lead_sources 
SET search_keywords = ARRAY['retail', 'store', 'shop', 'supermarket', 'mall', 'outlet']
WHERE industry_name = 'Retail' AND array_length(search_keywords, 1) < 3;

UPDATE lead_sources 
SET search_keywords = ARRAY['manufacturing', 'factory', 'industry', 'production', 'plant']
WHERE industry_name = 'Manufacturing' AND array_length(search_keywords, 1) < 3;

UPDATE lead_sources 
SET search_keywords = ARRAY['ecommerce', 'online store', 'shopping', 'marketplace']
WHERE industry_name = 'E-commerce' AND array_length(search_keywords, 1) < 3;

UPDATE lead_sources 
SET search_keywords = ARRAY['school', 'college', 'university', 'education', 'training', 'institute']
WHERE industry_name = 'Education' AND array_length(search_keywords, 1) < 3;

UPDATE lead_sources 
SET search_keywords = ARRAY['hospital', 'clinic', 'healthcare', 'medical', 'pharmacy', 'doctor']
WHERE industry_name = 'Healthcare' AND array_length(search_keywords, 1) < 3;

UPDATE lead_sources 
SET search_keywords = ARRAY['event', 'wedding', 'banquet', 'conference', 'party', 'celebration']
WHERE industry_name = 'Events' AND array_length(search_keywords, 1) < 3;
