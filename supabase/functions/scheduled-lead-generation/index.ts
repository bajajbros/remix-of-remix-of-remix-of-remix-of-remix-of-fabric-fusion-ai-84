import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizePhone(phone: string): string {
  if (!phone) return "";
  return phone.replace(/[^0-9+]/g, '');
}

async function checkForDuplicate(supabase: any, lead: any, userId: string): Promise<boolean> {
  const normalizedPhone = normalizePhone(lead.phone || "");

  const checks = [];

  if (lead.google_place_id) {
    checks.push(
      supabase
        .from("leads")
        .select("id")
        .eq("user_id", userId)
        .eq("google_place_id", lead.google_place_id)
        .maybeSingle()
    );
  }

  if (normalizedPhone) {
    checks.push(
      supabase
        .from("leads")
        .select("id")
        .eq("user_id", userId)
        .eq("normalized_phone", normalizedPhone)
        .maybeSingle()
    );
  }

  if (lead.company_name) {
    checks.push(
      supabase
        .from("leads")
        .select("id")
        .eq("user_id", userId)
        .ilike("company_name", lead.company_name)
        .maybeSingle()
    );
  }

  const results = await Promise.all(checks);

  for (const result of results) {
    if (result.data) {
      return true;
    }
  }

  return false;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const startTime = Date.now();
  let logId: string | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized: Invalid token");
    }

    const userId = user.id;

    const { targetIndustry, targetLocation, limit = 7 } = await req.json().catch(() => ({}));

    const logEntry = await supabase
      .from("lead_generation_logs")
      .insert({
        user_id: userId,
        status: "running",
        target_industry: targetIndustry,
        target_location: targetLocation,
      })
      .select()
      .single();

    logId = logEntry.data?.id;

    let dayOfWeek = new Date().getDay();

    let leadSource;
    if (targetIndustry && targetLocation) {
      leadSource = await supabase
        .from("lead_sources")
        .select("*")
        .eq("user_id", userId)
        .eq("industry_name", targetIndustry)
        .eq("is_active", true)
        .maybeSingle();
    } else {
      leadSource = await supabase
        .from("lead_sources")
        .select("*")
        .eq("user_id", userId)
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true)
        .maybeSingle();

      if (!leadSource.data) {
        leadSource = await supabase
          .from("lead_sources")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("priority", { ascending: false })
          .limit(1)
          .maybeSingle();
      }
    }

    if (!leadSource.data) {
      throw new Error("No active lead source found. Please configure lead sources in settings.");
    }

    const source = leadSource.data;
    const industry = targetIndustry || source.industry_name;
    const locations = targetLocation ? [targetLocation] : (source.target_locations || ["Mumbai"]);
    const location = locations[Math.floor(Math.random() * locations.length)];

    console.log(`Generating leads for ${industry} in ${location}`);

    const scraperResponse = await fetch(`${supabaseUrl}/functions/v1/lead-scraper`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        industry: industry,
        location: location,
        limit: limit,
      }),
    });

    if (!scraperResponse.ok) {
      const errorData = await scraperResponse.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(`Scraper failed: ${errorData.message || scraperResponse.status}`);
    }

    const scraperData = await scraperResponse.json();
    const scrapedLeads = scraperData.leads || [];

    let googleMapsCallsTotal = scraperData.api_calls || 0;
    let groqCallsTotal = 0;
    let geminiCallsTotal = 0;
    let successfulLeads = 0;
    let skippedDuplicates = 0;
    let failedLeads = 0;

    console.log(`Scraped ${scrapedLeads.length} leads from Google Maps`);

    for (const scrapedLead of scrapedLeads) {
      try {
        const isDuplicate = await checkForDuplicate(supabase, scrapedLead, userId);

        if (isDuplicate) {
          console.log(`Skipping duplicate lead: ${scrapedLead.company_name}`);
          skippedDuplicates++;
          continue;
        }

        await sleep(500);

        const enrichmentResponse = await fetch(`${supabaseUrl}/functions/v1/lead-enrichment`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lead: scrapedLead,
          }),
        });

        let enrichedData = {
          potential_sticker_needs: ["Product labels", "Branding stickers"],
          estimated_order_value: 15000,
          suggested_pitch: "Custom stickers for your business",
          ai_insights: "Potential customer based on industry",
        };

        if (enrichmentResponse.ok) {
          const enrichmentResult = await enrichmentResponse.json();
          if (enrichmentResult.success && enrichmentResult.enriched_data) {
            enrichedData = enrichmentResult.enriched_data;
            groqCallsTotal += enrichmentResult.api_calls || 0;
          }
        } else {
          console.warn(`Enrichment failed for ${scrapedLead.company_name}, using defaults`);
        }

        const leadWithEnrichment = {
          ...scrapedLead,
          ...enrichedData,
          industry: industry,
        };

        await sleep(500);

        const scoringResponse = await fetch(`${supabaseUrl}/functions/v1/lead-scoring`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lead: leadWithEnrichment,
          }),
        });

        let scoringData = {
          score: 50,
          priority: "warm",
          confidence_level: "medium",
          scoring_rationale: "Default scoring applied",
        };

        if (scoringResponse.ok) {
          const scoringResult = await scoringResponse.json();
          if (scoringResult.success && scoringResult.scoring) {
            scoringData = scoringResult.scoring;
            geminiCallsTotal += scoringResult.api_calls || 0;
          }
        } else {
          console.warn(`Scoring failed for ${scrapedLead.company_name}, using defaults`);
        }

        const finalLead = {
          user_id: userId,
          company_name: scrapedLead.company_name,
          name: scrapedLead.name,
          industry: industry,
          phone: scrapedLead.phone,
          email: scrapedLead.email,
          website: scrapedLead.website,
          address: scrapedLead.address,
          city: scrapedLead.city || location,
          state: scrapedLead.state,
          latitude: scrapedLead.latitude,
          longitude: scrapedLead.longitude,
          google_place_id: scrapedLead.google_place_id,
          google_rating: scrapedLead.google_rating,
          google_reviews_count: scrapedLead.google_reviews_count,
          business_type: scrapedLead.business_type,
          potential_sticker_needs: enrichedData.potential_sticker_needs,
          estimated_order_value: enrichedData.estimated_order_value,
          suggested_pitch: enrichedData.suggested_pitch,
          ai_insights: enrichedData.ai_insights,
          score: scoringData.score,
          priority: scoringData.priority,
          confidence_level: scoringData.confidence_level,
          source: "google_maps",
          search_query: `${industry} in ${location}`,
          status: "new",
        };

        const insertResult = await supabase
          .from("leads")
          .insert(finalLead)
          .select()
          .single();

        if (insertResult.error) {
          console.error(`Failed to insert lead ${scrapedLead.company_name}:`, insertResult.error);
          failedLeads++;
        } else if (insertResult.data) {
          successfulLeads++;
          console.log(`Successfully saved lead: ${scrapedLead.company_name}`);
        }

      } catch (error) {
        console.error(`Error processing lead ${scrapedLead.company_name}:`, error);
        failedLeads++;
      }
    }

    await supabase
      .from("lead_sources")
      .update({
        total_leads_generated: source.total_leads_generated + successfulLeads,
        last_used_date: new Date().toISOString(),
      })
      .eq("id", source.id);

    const durationSeconds = (Date.now() - startTime) / 1000;
    const successRate = scrapedLeads.length > 0 ? (successfulLeads / scrapedLeads.length) * 100 : 0;

    if (logId) {
      await supabase
        .from("lead_generation_logs")
        .update({
          status: "completed",
          leads_generated: successfulLeads,
          search_query: `${industry} in ${location}`,
          google_maps_calls: googleMapsCallsTotal,
          groq_calls: groqCallsTotal,
          gemini_calls: geminiCallsTotal,
          duration_seconds: durationSeconds,
          success_rate: successRate,
        })
        .eq("id", logId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        leads_generated: successfulLeads,
        skipped_duplicates: skippedDuplicates,
        failed_leads: failedLeads,
        total_processed: scrapedLeads.length,
        industry: industry,
        location: location,
        api_usage: {
          google_maps: googleMapsCallsTotal,
          groq: groqCallsTotal,
          gemini: geminiCallsTotal,
        },
        duration_seconds: durationSeconds,
        success_rate: successRate,
        message: `Successfully generated ${successfulLeads} new leads. Skipped ${skippedDuplicates} duplicates.`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Scheduled lead generation error:", error);

    const durationSeconds = (Date.now() - startTime) / 1000;

    if (logId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from("lead_generation_logs")
        .update({
          status: "failed",
          error_message: error.message,
          duration_seconds: durationSeconds,
        })
        .eq("id", logId);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to generate leads",
        message: error.message,
        duration_seconds: durationSeconds,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
