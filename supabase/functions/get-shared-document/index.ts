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
    const type = url.searchParams.get("type"); // 'invoice', 'quotation', 'agreement'

    if (!token || !type) {
      return new Response(
        JSON.stringify({ error: "Missing token or type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    let data;
    let error;

    if (type === "invoice") {
      const result = await supabase
        .from("invoices")
        .select("*, client:clients(*), invoice_items(*)")
        .eq("share_token", token)
        .maybeSingle();
      data = result.data;
      error = result.error;
    } else if (type === "quotation") {
      const result = await supabase
        .from("quotations")
        .select("*, client:clients(*), quotation_items(*)")
        .eq("share_token", token)
        .maybeSingle();
      data = result.data;
      error = result.error;
    } else if (type === "agreement") {
      const result = await supabase
        .from("agreements")
        .select("*, client:clients(*)")
        .eq("share_token", token)
        .maybeSingle();
      data = result.data;
      error = result.error;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: "Document not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
