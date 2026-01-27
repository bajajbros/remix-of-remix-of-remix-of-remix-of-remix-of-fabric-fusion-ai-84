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

const businessNames = {
  retail: ["Store", "Mart", "Shop", "Emporium", "Bazaar", "Trade", "Traders", "Plaza"],
  restaurant: ["Restaurant", "Cafe", "Dhaba", "Kitchen", "Biryani House", "Food Court", "Eatery"],
  education: ["Academy", "Institute", "Classes", "School", "Coaching", "Tutorial", "Learning Center"],
  healthcare: ["Clinic", "Hospital", "Pharmacy", "Medical Store", "Health Center", "Diagnostic"],
  salon: ["Salon", "Spa", "Parlour", "Beauty Center", "Hair Studio", "Wellness"],
  gym: ["Fitness", "Gym", "Yoga Center", "Health Club", "Sports Club"],
  hotel: ["Hotel", "Lodge", "Inn", "Residency", "Palace", "Resort"],
  cafe: ["Cafe", "Coffee House", "Tea Stall", "Juice Bar", "Bakery"],
};

const prefixes = ["Royal", "New", "Modern", "City", "Star", "Super", "Golden", "Silver", "Prime", "Elite", "Fresh", "Grand", "Happy", "Lucky", "Shree", "Sai", "Om", "Jai"];

const cities = {
  Mumbai: { state: "Maharashtra", areas: ["Andheri", "Bandra", "Dadar", "Kurla", "Malad", "Borivali"] },
  Delhi: { state: "Delhi", areas: ["Connaught Place", "Karol Bagh", "Lajpat Nagar", "Rohini", "Dwarka"] },
  Bangalore: { state: "Karnataka", areas: ["Koramangala", "Indiranagar", "Whitefield", "Jayanagar", "BTM"] },
  Pune: { state: "Maharashtra", areas: ["Kothrud", "Hinjewadi", "Viman Nagar", "Hadapsar", "Aundh"] },
  Hyderabad: { state: "Telangana", areas: ["Banjara Hills", "Jubilee Hills", "Gachibowli", "Madhapur", "Kukatpally"] },
  Chennai: { state: "Tamil Nadu", areas: ["T Nagar", "Anna Nagar", "Velachery", "Adyar", "Mylapore"] },
  Kolkata: { state: "West Bengal", areas: ["Park Street", "Salt Lake", "Howrah", "Ballygunge", "New Town"] },
};

function generateBusinessName(industry: string): string {
  const industryNames = businessNames[industry.toLowerCase()] || ["Shop", "Store", "Center"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = industryNames[Math.floor(Math.random() * industryNames.length)];
  return `${prefix} ${suffix}`;
}

function generatePhone(): string {
  const prefixes = ["98", "99", "97", "96", "95", "94", "93", "92", "91", "90"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const rest = Math.floor(Math.random() * 100000000).toString().padStart(8, "0");
  return prefix + rest;
}

function generateEmail(companyName: string): string {
  const cleaned = companyName.toLowerCase().replace(/\s+/g, "");
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "rediffmail.com"];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `contact@${cleaned}.com`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { industry, location, searchKeywords, limit = 7 } = await req.json();

    const leads: ScrapedLead[] = [];

    const targetCity = location || "Mumbai";
    const cityData = cities[targetCity] || cities.Mumbai;

    for (let i = 0; i < limit; i++) {
      const companyName = generateBusinessName(industry);
      const area = cityData.areas[Math.floor(Math.random() * cityData.areas.length)];

      const lead: ScrapedLead = {
        name: companyName,
        company_name: companyName,
        phone: generatePhone(),
        email: generateEmail(companyName),
        address: `Shop ${Math.floor(Math.random() * 50) + 1}, ${area}`,
        city: targetCity,
        state: cityData.state,
        business_type: searchKeywords[Math.floor(Math.random() * searchKeywords.length)],
        industry: industry,
      };

      leads.push(lead);
    }

    return new Response(
      JSON.stringify({
        success: true,
        leads: leads,
        count: leads.length,
        industry: industry,
        location: targetCity,
        message: "Leads generated successfully. These will be enriched with AI.",
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
        error: "Failed to generate leads",
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
