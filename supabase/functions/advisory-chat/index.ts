import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Agents that should receive live regulatory intelligence
const REGULATORY_INTEL_AGENTS = new Set([
  "professor-xyreg",
  "dr-elena",
  "dr-suzi",
]);

async function fetchRegulatoryNews(agentId: string): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Filter by region for region-specific agents
    let query = supabase
      .from("regulatory_news_items")
      .select("title, summary, source_name, category, region, published_at, url")
      .order("scraped_at", { ascending: false })
      .limit(10);

    if (agentId === "dr-elena") {
      query = query.in("region", ["EU", "Global"]);
    } else if (agentId === "dr-suzi") {
      query = query.in("region", ["US", "Global"]);
    }

    const { data, error } = await query;
    if (error || !data?.length) return "";

    let block = "\n\n--- REGULATORY INTELLIGENCE (LIVE) ---\n";
    block += "The following are the most recent regulatory news items from your intelligence feed. Reference these when relevant to the user's question.\n\n";
    for (const item of data) {
      block += `• [${item.source_name}] ${item.title}`;
      if (item.published_at) block += ` (${item.published_at.slice(0, 10)})`;
      block += "\n";
      if (item.summary) block += `  ${item.summary}\n`;
      if (item.url) block += `  Link: ${item.url}\n`;
    }
    block += "--- END REGULATORY INTELLIGENCE ---";
    return block;
  } catch (e) {
    console.error("Failed to fetch regulatory news for context:", e);
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, systemPrompt, agentId } = await req.json();

    if (!messages || !Array.isArray(messages) || !systemPrompt) {
      return new Response(
        JSON.stringify({ error: "Missing messages or systemPrompt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch regulatory news in parallel with AI request preparation
    let enhancedPrompt = systemPrompt;
    const newsPromise = (agentId && REGULATORY_INTEL_AGENTS.has(agentId))
      ? fetchRegulatoryNews(agentId)
      : Promise.resolve("");

    const newsContext = await newsPromise;
    if (newsContext) {
      enhancedPrompt += newsContext;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        max_tokens: 1024,
        temperature: 0.7,
        messages: [
          { role: "system", content: enhancedPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("advisory-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
