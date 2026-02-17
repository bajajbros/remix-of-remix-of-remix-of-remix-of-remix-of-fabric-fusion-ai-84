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
  state?: string;
  phone?: string;
  email?: string;
  website?: string;
  google_rating?: number;
  google_reviews_count?: number;
}

interface EnrichedData {
  potential_sticker_needs: string[];
  estimated_order_value: number;
  suggested_pitch: string;
  ai_insights: string;
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
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
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
          success: false,
          enriched_data: {
            potential_sticker_needs: ["Product labels", "Branding stickers", "Packaging stickers"],
            estimated_order_value: 15000,
            suggested_pitch: "High-quality custom stickers for your business needs",
            ai_insights: "Groq API key not configured. Using default values.",
          },
          api_calls: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const apiKey = groqApiKey.data.value;

    const prompt = `You are a B2B sales analyst for a sticker printing factory in India. Analyze this business and provide insights for potential sticker needs.

Business Details:
- Company Name: ${lead.company_name}
- Business Type: ${lead.business_type || 'Unknown'}
- Industry: ${lead.industry || 'Unknown'}
- Location: ${lead.city || 'Unknown'}, ${lead.state || 'India'}
- Google Rating: ${lead.google_rating || 'N/A'}
- Reviews Count: ${lead.google_reviews_count || 0}
- Website: ${lead.website || 'Not available'}

Provide a JSON response with:
1. potential_sticker_needs: Array of 3-5 specific sticker types they might need (e.g., "Product labeling stickers", "Packaging stickers", "Branding stickers", "Safety labels", "QR code stickers")
2. estimated_order_value: Estimated monthly order value in INR (number only, realistic range: 5000-100000 based on business size)
3. suggested_pitch: One compelling sentence pitch (max 100 chars) highlighting how stickers can benefit their specific business
4. ai_insights: 2-3 sentences about why this is a good lead, what products they might need, and what to emphasize in sales conversation

Be specific to the industry. For example:
- Restaurants need menu stickers, delivery packaging labels, hygiene certificates
- Retail stores need product labels, price stickers, branding labels
- Manufacturing needs safety labels, product identifiers, shipping labels
- Healthcare needs patient labels, medicine labels, equipment tags

Respond ONLY with valid JSON, no markdown or explanation.`;

    const enrichedData = await retryWithBackoff(async () => {
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
              content: "You are a B2B sales analyst for sticker manufacturing. Always respond with valid JSON only."
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

      try {
        return JSON.parse(content);
      } catch (e) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw new Error("Failed to parse JSON from Groq response");
      }
    });

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

    const fallbackData: EnrichedData = {
      potential_sticker_needs: ["Product labels", "Branding stickers", "Packaging stickers"],
      estimated_order_value: 15000,
      suggested_pitch: "High-quality custom stickers for your business needs",
      ai_insights: "Potential customer based on business type and location. AI enrichment failed, using fallback values.",
    };

    return new Response(
      JSON.stringify({
        success: false,
        enriched_data: fallbackData,
        error: error.message,
        api_calls: 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
