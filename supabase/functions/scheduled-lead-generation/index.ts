import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { targetIndustry, targetLocation, limit = 7 } = await req.json().catch(() => ({}));

    const logEntry = await supabase
      .from("lead_generation_logs")
      .insert({
        status: "running",
        target_industry: targetIndustry,
        target_location: targetLocation,
      })
      .select()
      .single();

    const logId = logEntry.data?.id;

    let dayOfWeek = new Date().getDay();

    let leadSource;
    if (targetIndustry && targetLocation) {
      leadSource = await supabase
        .from("lead_sources")
        .select("*")
        .eq("industry_name", targetIndustry)
        .eq("is_active", true)
        .maybeSingle();
    } else {
      leadSource = await supabase
        .from("lead_sources")
        .select("*")
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true)
        .maybeSingle();

      if (!leadSource.data) {
        leadSource = await supabase
          .from("lead_sources")
          .select("*")
          .eq("is_active", true)
          .order("priority", { ascending: false })
          .limit(1)
          .maybeSingle();
      }
    }

    if (!leadSource.data) {
      throw new Error("No active lead source found");
    }

    const source = leadSource.data;
    const industry = targetIndustry || source.industry_name;
    const locations = targetLocation ? [targetLocation] : (source.target_locations || ["Mumbai"]);
    const location = locations[Math.floor(Math.random() * locations.length)];
    const searchKeywords = source.search_keywords || ["business"];

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
        searchKeywords: searchKeywords,
        limit: limit,
      }),
    });

    if (!scraperResponse.ok) {
      throw new Error(`Scraper failed: ${scraperResponse.status}`);
    }

    const scraperData = await scraperResponse.json();
    const scrapedLeads = scraperData.leads || [];

    let googleMapsCallsTotal = scraperData.api_calls || 0;
    let groqCallsTotal = 0;
    let geminiCallsTotal = 0;
    let successfulLeads = 0;

    console.log(`Scraped ${scrapedLeads.length} leads`);

    for (const scrapedLead of scrapedLeads) {
      try {
        const existingLead = await supabase
          .from("leads")
          .select("id")
          .eq("google_place_id", scrapedLead.google_place_id)
          .maybeSingle();

        if (existingLead.data) {
          console.log(`Skipping duplicate lead: ${scrapedLead.company_name}`);
          continue;
        }

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
          enrichedData = enrichmentResult.enriched_data || enrichedData;
          groqCallsTotal += enrichmentResult.api_calls || 0;
        }

        const leadWithEnrichment = {
          ...scrapedLead,
          ...enrichedData,
          industry: industry,
        };

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
          scoringData = scoringResult.scoring || scoringData;
          geminiCallsTotal += scoringResult.api_calls || 0;
        }

        const finalLead = {
          ...scrapedLead,
          industry: industry,
          phone: enrichedData.phone || scrapedLead.phone,
          email: enrichedData.email || scrapedLead.email,
          website: enrichedData.website,
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

        if (insertResult.data) {
          successfulLeads++;
          console.log(`Successfully saved lead: ${scrapedLead.company_name}`);
        }

      } catch (error) {
        console.error(`Error processing lead ${scrapedLead.company_name}:`, error);
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

    return new Response(
      JSON.stringify({
        success: true,
        leads_generated: successfulLeads,
        industry: industry,
        location: location,
        api_usage: {
          google_maps: googleMapsCallsTotal,
          groq: groqCallsTotal,
          gemini: geminiCallsTotal,
        },
        duration_seconds: durationSeconds,
        success_rate: successRate,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Scheduled lead generation error:", error);

    const durationSeconds = (Date.now() - startTime) / 1000;

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
