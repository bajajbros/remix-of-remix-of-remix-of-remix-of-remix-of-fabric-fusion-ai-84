import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const type = url.searchParams.get("type");

    console.log("Request received - token:", token, "type:", type);

    if (!token || !type) {
      return new Response(
        JSON.stringify({ error: "Missing token or type", got: { token, type } }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing env vars");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let result;

    if (type === "invoice") {
      result = await supabase
        .from("invoices")
        .select("*, client:clients(*), invoice_items(*)")
        .eq("share_token", token)
        .maybeSingle();
    } else if (type === "quotation") {
      result = await supabase
        .from("quotations")
        .select("*, client:clients(*), quotation_items(*)")
        .eq("share_token", token)
        .maybeSingle();
    } else if (type === "agreement") {
      result = await supabase
        .from("agreements")
        .select("*, client:clients(*)")
        .eq("share_token", token)
        .maybeSingle();
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Query result:", { data: !!result.data, error: result.error });

    if (result.error) {
      console.error("Database error:", result.error);
      return new Response(
        JSON.stringify({ error: result.error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!result.data) {
      console.warn("No data found for token:", token);
      return new Response(
        JSON.stringify({ error: "Document not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = result.data as any;
    const responseData = {
      ...data,
      items: type === "invoice" ? data.invoice_items : type === "quotation" ? data.quotation_items : undefined,
    };

    if (type === "invoice") {
      delete responseData.invoice_items;
    } else if (type === "quotation") {
      delete responseData.quotation_items;
    }

    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Caught error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
