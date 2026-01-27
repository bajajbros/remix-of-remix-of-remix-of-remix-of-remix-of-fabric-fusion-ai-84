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
  address?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  google_rating?: number;
  google_reviews_count?: number;
  google_place_id?: string;
  business_type?: string;
  website?: string;
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

    const { industry, location, searchKeywords, limit = 7 } = await req.json();

    const googleMapsApiKey = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "google_maps_api_key")
      .maybeSingle();

    if (!googleMapsApiKey?.data?.value) {
      return new Response(
        JSON.stringify({
          error: "Google Maps API key not configured",
          message: "Please add google_maps_api_key in app_settings table"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const apiKey = googleMapsApiKey.data.value;
    const leads: ScrapedLead[] = [];
    let apiCallCount = 0;

    for (const keyword of searchKeywords.slice(0, 3)) {
      const query = `${keyword} in ${location}`;
      const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

      apiCallCount++;
      const response = await fetch(textSearchUrl);
      const data = await response.json();

      if (data.status === "OK" && data.results) {
        for (const place of data.results.slice(0, Math.ceil(limit / searchKeywords.length))) {
          const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,geometry,rating,user_ratings_total,types,website&key=${apiKey}`;

          apiCallCount++;
          const detailsResponse = await fetch(placeDetailsUrl);
          const detailsData = await detailsResponse.json();

          if (detailsData.status === "OK" && detailsData.result) {
            const result = detailsData.result;

            const addressParts = result.formatted_address?.split(',') || [];
            const city = addressParts[addressParts.length - 3]?.trim() || location;
            const state = addressParts[addressParts.length - 2]?.trim() || '';

            const lead: ScrapedLead = {
              name: result.name,
              company_name: result.name,
              phone: result.formatted_phone_number?.replace(/\s/g, ''),
              address: result.formatted_address,
              city: city,
              state: state,
              latitude: result.geometry?.location?.lat,
              longitude: result.geometry?.location?.lng,
              google_rating: result.rating,
              google_reviews_count: result.user_ratings_total || 0,
              google_place_id: place.place_id,
              business_type: result.types?.[0] || keyword,
              website: result.website,
            };

            leads.push(lead);

            if (leads.length >= limit) break;
          }
        }
      }

      if (leads.length >= limit) break;
    }

    return new Response(
      JSON.stringify({
        success: true,
        leads: leads,
        count: leads.length,
        api_calls: apiCallCount,
        industry: industry,
        location: location,
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
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
