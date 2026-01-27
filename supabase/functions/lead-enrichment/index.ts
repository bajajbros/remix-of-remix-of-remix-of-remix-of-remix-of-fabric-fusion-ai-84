import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface LeadData {
  company_name: string;
  business_type?: string;
  industry?: string;
  address?: string;
  city?: string;
  google_rating?: number;
  google_reviews_count?: number;
}

interface EnrichedData {
  potential_sticker_needs: string[];
  estimated_order_value: number;
  suggested_pitch: string;
  ai_insights: string;
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

    const { lead }: { lead: LeadData } = await req.json();

    const groqApiKey = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "groq_api_key")
      .maybeSingle();

    if (!groqApiKey?.data?.value) {
      return new Response(
        JSON.stringify({
          error: "Groq API key not configured",
          message: "Please add groq_api_key in app_settings table"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const apiKey = groqApiKey.data.value;

    const prompt = `You are a B2B sales analyst for a sticker printing factory. Analyze this business and provide insights for potential sticker needs.

Business Details:
- Company Name: ${lead.company_name}
- Business Type: ${lead.business_type || 'Unknown'}
- Industry: ${lead.industry || 'Unknown'}
- Location: ${lead.city || 'Unknown'}
- Google Rating: ${lead.google_rating || 'N/A'}
- Reviews Count: ${lead.google_reviews_count || 0}

Provide a JSON response with:
1. potential_sticker_needs: Array of 3-5 specific sticker types they might need (e.g., "Product labeling stickers", "Packaging stickers", "Branding stickers")
2. estimated_order_value: Estimated monthly order value in INR (number only, 5000-100000 range)
3. suggested_pitch: One compelling sentence pitch highlighting how stickers can benefit their business
4. ai_insights: 2-3 sentences about why this is a good lead and what to emphasize in conversation

Respond ONLY with valid JSON, no markdown or explanation.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          {
            role: "system",
            content: "You are a B2B sales analyst. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content in Groq response");
    }

    let enrichedData: EnrichedData;
    try {
      enrichedData = JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        enrichedData = JSON.parse(jsonMatch[0]);
      } else {
        enrichedData = {
          potential_sticker_needs: ["Product labels", "Branding stickers", "Packaging stickers"],
          estimated_order_value: 15000,
          suggested_pitch: "High-quality custom stickers for your business needs",
          ai_insights: "Potential customer based on business type and location."
        };
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        enriched_data: enrichedData,
        api_calls: 1,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Lead enrichment error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to enrich lead",
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
