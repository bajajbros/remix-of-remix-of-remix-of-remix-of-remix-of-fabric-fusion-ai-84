import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
  address?: string;
  city?: string;
  state?: string;
  business_type?: string;
  industry?: string;
}

const cityCoordinates = {
  Mumbai: { lat: 19.0760, lon: 72.8777, state: "Maharashtra" },
  Delhi: { lat: 28.7041, lon: 77.1025, state: "Delhi" },
  Bangalore: { lat: 12.9716, lon: 77.5946, state: "Karnataka" },
  Pune: { lat: 18.5204, lon: 73.8567, state: "Maharashtra" },
  Hyderabad: { lat: 17.3850, lon: 78.4867, state: "Telangana" },
  Chennai: { lat: 13.0827, lon: 80.2707, state: "Tamil Nadu" },
  Kolkata: { lat: 22.5726, lon: 88.3639, state: "West Bengal" },
  Jaipur: { lat: 26.9124, lon: 75.7873, state: "Rajasthan" },
  Ahmedabad: { lat: 23.0225, lon: 72.5714, state: "Gujarat" },
  Lucknow: { lat: 26.8467, lon: 80.9462, state: "Uttar Pradesh" },
};

const industryToOSMTags = {
  retail: ["shop=supermarket", "shop=convenience", "shop=general", "shop=department_store", "shop=mall"],
  restaurant: ["amenity=restaurant", "amenity=fast_food", "amenity=cafe", "amenity=food_court"],
  education: ["amenity=school", "amenity=college", "amenity=university", "amenity=training"],
  healthcare: ["amenity=hospital", "amenity=clinic", "amenity=pharmacy", "amenity=doctors"],
  salon: ["shop=beauty", "shop=hairdresser", "amenity=spa"],
  gym: ["leisure=fitness_centre", "leisure=sports_centre", "amenity=gym"],
  hotel: ["tourism=hotel", "tourism=guest_house", "tourism=hostel"],
  cafe: ["amenity=cafe", "shop=coffee", "amenity=tea_house"],
  textile: ["shop=fabric", "shop=clothes", "shop=fashion", "craft=tailor"],
  manufacturing: ["man_made=works", "industrial=factory", "landuse=industrial"],
};

function buildOverpassQuery(industry: string, city: string, limit: number): string {
  const coords = cityCoordinates[city] || cityCoordinates.Mumbai;
  const tags = industryToOSMTags[industry.toLowerCase()] || ["shop"];

  const radius = 15000;

  const tagQueries = tags.map(tag => `node["${tag.split('=')[0]}"="${tag.split('=')[1]}"](around:${radius},${coords.lat},${coords.lon});`).join('\n  ');

  return `[out:json][timeout:25];
(
  ${tagQueries}
);
out body ${limit};`;
}

async function scrapeFromOverpass(industry: string, location: string, limit: number): Promise<ScrapedLead[]> {
  const query = buildOverpassQuery(industry, location, limit);

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.statusText}`);
  }

  const data = await response.json();
  const cityData = cityCoordinates[location] || cityCoordinates.Mumbai;

  const leads: ScrapedLead[] = [];

  for (const element of data.elements || []) {
    if (!element.tags) continue;

    const name = element.tags.name || element.tags.brand || element.tags.operator || "Unnamed Business";

    const streetParts = [];
    if (element.tags["addr:street"]) streetParts.push(element.tags["addr:street"]);
    if (element.tags["addr:housenumber"]) streetParts.push(element.tags["addr:housenumber"]);
    if (element.tags["addr:suburb"]) streetParts.push(element.tags["addr:suburb"]);

    const address = streetParts.length > 0
      ? streetParts.join(", ")
      : element.tags["addr:full"] || "Address not available";

    const lead: ScrapedLead = {
      name: name,
      company_name: name,
      phone: element.tags.phone || element.tags["contact:phone"] || undefined,
      email: element.tags.email || element.tags["contact:email"] || undefined,
      address: address,
      city: element.tags["addr:city"] || location,
      state: element.tags["addr:state"] || cityData.state,
      business_type: element.tags.amenity || element.tags.shop || element.tags.tourism || industry,
      industry: industry,
    };

    leads.push(lead);
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

    console.log(`Scraping ${limit} leads for ${industry} in ${targetCity}...`);

    const leads = await scrapeFromOverpass(industry, targetCity, limit);

    if (leads.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          leads: [],
          count: 0,
          industry: industry,
          location: targetCity,
          message: "No businesses found for this industry in the selected location. Try a different city or industry.",
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
        industry: industry,
        location: targetCity,
        source: "OpenStreetMap",
        message: `Found ${leads.length} real businesses from OpenStreetMap. These will be enriched with AI.`,
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
        details: "There was an error accessing OpenStreetMap data. Please try again.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
