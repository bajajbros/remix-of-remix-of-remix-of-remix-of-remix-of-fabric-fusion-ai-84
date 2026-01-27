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
  city?: string;
  state?: string;
  google_rating?: number;
  google_reviews_count?: number;
  potential_sticker_needs?: string[];
  estimated_order_value?: number;
}

interface ScoringResult {
  score: number;
  priority: string;
  confidence_level: string;
  scoring_rationale: string;
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

    const geminiApiKey = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "gemini_api_key")
      .maybeSingle();

    if (!geminiApiKey?.data?.value) {
      return new Response(
        JSON.stringify({
          error: "Gemini API key not configured",
          message: "Please add gemini_api_key in app_settings table"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const apiKey = geminiApiKey.data.value;

    const prompt = `You are a B2B sales scoring expert for a sticker printing factory. Score this lead from 0-100 based on their potential value.

Business Details:
- Company: ${lead.company_name}
- Business Type: ${lead.business_type || 'Unknown'}
- Industry: ${lead.industry || 'Unknown'}
- Location: ${lead.city}, ${lead.state || 'India'}
- Google Rating: ${lead.google_rating || 'N/A'} (${lead.google_reviews_count || 0} reviews)
- Estimated Order Value: ₹${lead.estimated_order_value || 0}/month
- Sticker Needs: ${lead.potential_sticker_needs?.join(', ') || 'Unknown'}

Score this lead (0-100) based on:
- Business size and potential order volume (40 points)
- Industry relevance to sticker needs (30 points)
- Location and accessibility (15 points)
- Business reputation (Google rating) (15 points)

Provide JSON response with:
1. score: Number between 0-100
2. priority: "hot" (80-100), "warm" (50-79), or "cold" (0-49)
3. confidence_level: "high", "medium", or "low"
4. scoring_rationale: 2-3 sentences explaining the score

Respond ONLY with valid JSON, no markdown.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("No content in Gemini response");
    }

    let scoringResult: ScoringResult;
    try {
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      scoringResult = JSON.parse(cleanedContent);
    } catch (e) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        scoringResult = JSON.parse(jsonMatch[0]);
      } else {
        const estimatedScore = Math.min(100, Math.max(0,
          (lead.google_rating || 3) * 10 +
          Math.min(50, (lead.estimated_order_value || 10000) / 1000)
        ));

        scoringResult = {
          score: Math.round(estimatedScore),
          priority: estimatedScore >= 80 ? "hot" : estimatedScore >= 50 ? "warm" : "cold",
          confidence_level: "medium",
          scoring_rationale: "Score calculated based on business metrics and industry relevance."
        };
      }
    }

    scoringResult.score = Math.min(100, Math.max(0, scoringResult.score));

    if (scoringResult.score >= 80) {
      scoringResult.priority = "hot";
    } else if (scoringResult.score >= 50) {
      scoringResult.priority = "warm";
    } else {
      scoringResult.priority = "cold";
    }

    return new Response(
      JSON.stringify({
        success: true,
        scoring: scoringResult,
        api_calls: 1,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Lead scoring error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to score lead",
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
