import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ScrapedLead {
  name: string;
  company_name: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  business_type?: string;
  industry?: string;
  google_place_id?: string;
  latitude?: number;
  longitude?: number;
  google_rating?: number;
  google_reviews_count?: number;
  formatted_address?: string;
}

const indianCities = {
  Mumbai: { lat: 19.0760, lng: 72.8777, state: "Maharashtra", radius: 30000 },
  Delhi: { lat: 28.7041, lng: 77.1025, state: "Delhi", radius: 35000 },
  Bangalore: { lat: 12.9716, lng: 77.5946, state: "Karnataka", radius: 30000 },
  Pune: { lat: 18.5204, lng: 73.8567, state: "Maharashtra", radius: 25000 },
  Hyderabad: { lat: 17.3850, lng: 78.4867, state: "Telangana", radius: 30000 },
  Chennai: { lat: 13.0827, lng: 80.2707, state: "Tamil Nadu", radius: 30000 },
  Kolkata: { lat: 22.5726, lng: 88.3639, state: "West Bengal", radius: 30000 },
  Jaipur: { lat: 26.9124, lng: 75.7873, state: "Rajasthan", radius: 20000 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714, state: "Gujarat", radius: 25000 },
  Lucknow: { lat: 26.8467, lng: 80.9462, state: "Uttar Pradesh", radius: 20000 },
  Surat: { lat: 21.1702, lng: 72.8311, state: "Gujarat", radius: 20000 },
  Nagpur: { lat: 21.1458, lng: 79.0882, state: "Maharashtra", radius: 20000 },
  Indore: { lat: 22.7196, lng: 75.8577, state: "Madhya Pradesh", radius: 20000 },
  Bhopal: { lat: 23.2599, lng: 77.4126, state: "Madhya Pradesh", radius: 20000 },
  Chandigarh: { lat: 30.7333, lng: 76.7794, state: "Chandigarh", radius: 15000 },
  Gurgaon: { lat: 28.4595, lng: 77.0266, state: "Haryana", radius: 20000 },
  Noida: { lat: 28.5355, lng: 77.3910, state: "Uttar Pradesh", radius: 20000 },
  Ghaziabad: { lat: 28.6692, lng: 77.4538, state: "Uttar Pradesh", radius: 15000 },
  Faridabad: { lat: 28.4089, lng: 77.3178, state: "Haryana", radius: 15000 },
  Vishakhapatnam: { lat: 17.6868, lng: 83.2185, state: "Andhra Pradesh", radius: 20000 },
};

const industryToPlaceTypes = {
  retail: ["supermarket", "convenience_store", "department_store", "shopping_mall", "store"],
  restaurant: ["restaurant", "meal_takeaway", "meal_delivery", "food"],
  education: ["school", "university", "secondary_school", "primary_school"],
  healthcare: ["hospital", "doctor", "pharmacy", "physiotherapist", "dentist"],
  salon: ["beauty_salon", "hair_care", "spa"],
  gym: ["gym"],
  hotel: ["lodging", "hotel"],
  cafe: ["cafe", "bakery"],
  textile: ["clothing_store", "shoe_store"],
  manufacturing: ["general_contractor", "electrician", "plumber"],
  events: ["event_planner", "banquet_hall"],
  "e-commerce": ["store", "electronics_store"],
  default: ["store", "restaurant", "cafe"],
};

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
      await sleep(delay);
    }
  }
  throw new Error("Max retries exceeded");
}

async function getPlaceDetails(placeId: string, apiKey: string): Promise<any> {
  const fields = [
    "place_id",
    "name",
    "formatted_address",
    "formatted_phone_number",
    "international_phone_number",
    "website",
    "rating",
    "user_ratings_total",
    "geometry",
    "types",
    "business_status",
    "opening_hours",
  ].join(",");

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;

  return retryWithBackoff(async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Place Details API error: ${response.status}`);
    }
    const data = await response.json();
    if (data.status !== "OK") {
      throw new Error(`Place Details API status: ${data.status}`);
    }
    return data.result;
  });
}

async function searchNearbyPlaces(
  industry: string,
  location: string,
  apiKey: string,
  limit: number
): Promise<ScrapedLead[]> {
  const cityData = indianCities[location] || indianCities.Mumbai;
  const placeTypes = industryToPlaceTypes[industry.toLowerCase()] || industryToPlaceTypes.default;

  const leads: ScrapedLead[] = [];
  const seenPlaceIds = new Set<string>();
  let apiCallCount = 0;

  for (const placeType of placeTypes) {
    if (leads.length >= limit) break;

    try {
      const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${cityData.lat},${cityData.lng}&radius=${cityData.radius}&type=${placeType}&key=${apiKey}`;

      const searchData = await retryWithBackoff(async () => {
        const response = await fetch(searchUrl);
        apiCallCount++;

        if (!response.ok) {
          throw new Error(`Nearby Search API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === "ZERO_RESULTS") {
          console.log(`No results for ${placeType} in ${location}`);
          return { results: [] };
        }

        if (data.status !== "OK") {
          throw new Error(`Nearby Search API status: ${data.status}`);
        }

        return data;
      });

      if (!searchData.results || searchData.results.length === 0) {
        continue;
      }

      console.log(`Found ${searchData.results.length} places for ${placeType}`);

      for (const place of searchData.results) {
        if (leads.length >= limit) break;
        if (seenPlaceIds.has(place.place_id)) continue;

        if (place.business_status !== "OPERATIONAL") continue;

        seenPlaceIds.add(place.place_id);

        try {
          await sleep(100);

          const details = await getPlaceDetails(place.place_id, apiKey);
          apiCallCount++;

          const phone = details.formatted_phone_number || details.international_phone_number;

          if (!phone) {
            console.log(`Skipping ${place.name} - no phone number`);
            continue;
          }

          const lead: ScrapedLead = {
            name: details.name || place.name,
            company_name: details.name || place.name,
            phone: phone,
            email: undefined,
            website: details.website,
            address: details.formatted_address,
            formatted_address: details.formatted_address,
            city: location,
            state: cityData.state,
            business_type: place.types?.[0] || placeType,
            industry: industry,
            google_place_id: place.place_id,
            latitude: details.geometry?.location?.lat || place.geometry?.location?.lat,
            longitude: details.geometry?.location?.lng || place.geometry?.location?.lng,
            google_rating: details.rating,
            google_reviews_count: details.user_ratings_total || 0,
          };

          leads.push(lead);
          console.log(`Added: ${lead.company_name} (${lead.phone})`);

        } catch (detailError) {
          console.error(`Error getting details for ${place.name}:`, detailError.message);
          continue;
        }
      }

    } catch (error) {
      console.error(`Error searching ${placeType}:`, error.message);
      continue;
    }
  }

  return leads;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const googleMapsApiKey = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "google_maps_api_key")
      .maybeSingle();

    if (!googleMapsApiKey?.data?.value) {
      return new Response(
        JSON.stringify({
          error: "Google Maps API key not configured",
          message: "Please add google_maps_api_key in app_settings table",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const apiKey = googleMapsApiKey.data.value;

    const { industry, location, limit = 10 } = await req.json();

    if (!industry) {
      return new Response(
        JSON.stringify({
          error: "Industry is required",
          message: "Please provide an industry type",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const targetCity = location || "Mumbai";

    console.log(`Searching ${limit} leads for ${industry} in ${targetCity}...`);

    const leads = await searchNearbyPlaces(industry, targetCity, apiKey, limit);

    if (leads.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          leads: [],
          count: 0,
          industry: industry,
          location: targetCity,
          message: "No businesses found with valid phone numbers for this industry in the selected location. Try a different city or industry.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        leads: leads,
        count: leads.length,
        api_calls: leads.length * 2,
        industry: industry,
        location: targetCity,
        source: "Google Places API",
        message: `Found ${leads.length} verified businesses with real phone numbers from Google Maps.`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Lead scraper error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to scrape leads",
        message: error.message,
        details: "There was an error accessing Google Places API. Please check your API key and try again.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
