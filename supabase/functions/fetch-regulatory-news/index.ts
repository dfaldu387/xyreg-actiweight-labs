import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Regulatory authority news sources
const NEWS_SOURCES = [
  // EU
  { source: "EU_MDR", source_name: "European Commission (MDR)", region: "EU", url: "https://health.ec.europa.eu/medical-devices-sector/new-regulations_en" },
  { source: "MDCG", source_name: "MDCG Guidance", region: "EU", url: "https://health.ec.europa.eu/medical-devices-sector/new-regulations/guidance-mdcg-endorsed-documents-and-other-guidance_en" },
  { source: "EU_IVDR", source_name: "European Commission (IVDR)", region: "EU", url: "https://health.ec.europa.eu/medical-devices-sector/in-vitro-diagnostic-medical-devices_en" },
  { source: "EUDAMED", source_name: "EUDAMED", region: "EU", url: "https://ec.europa.eu/tools/eudamed/" },
  { source: "MDR_IMPL", source_name: "MDR Implementing Acts", region: "EU", url: "https://health.ec.europa.eu/medical-devices-sector/new-regulations/implementation_en" },
  // US
  { source: "FDA_CDRH", source_name: "FDA CDRH", region: "US", url: "https://www.fda.gov/medical-devices/medical-devices-news-and-events" },
  { source: "FDA_GUIDANCE", source_name: "FDA Guidance", region: "US", url: "https://www.fda.gov/medical-devices/device-advice-comprehensive-regulatory-assistance/guidance-documents-medical-devices-and-radiation-emitting-products" },
  // UK
  { source: "MHRA", source_name: "MHRA", region: "UK", url: "https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency" },
  // Australia
  { source: "TGA", source_name: "TGA Australia", region: "APAC", url: "https://www.tga.gov.au/safety" },
  // Japan
  { source: "PMDA", source_name: "PMDA Japan", region: "APAC", url: "https://www.pmda.go.jp/english/about-pmda/outline/0002.html" },
  // Canada
  { source: "HEALTH_CANADA", source_name: "Health Canada", region: "Global", url: "https://www.canada.ca/en/health-canada/services/drugs-health-products/medical-devices.html" },
  // China
  { source: "NMPA", source_name: "NMPA China", region: "APAC", url: "https://english.nmpa.gov.cn/" },
  // Brazil
  { source: "ANVISA", source_name: "ANVISA Brazil", region: "LATAM", url: "https://www.gov.br/anvisa/pt-br" },
  // Standards bodies
  { source: "ISO_NEWS", source_name: "ISO Standards", region: "Global", url: "https://www.iso.org/sectors/medical-devices" },
  { source: "IEC_NEWS", source_name: "IEC Standards", region: "Global", url: "https://www.iec.ch/medical-equipment" },
];

async function fetchPageContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; XyReg-NewsChecker/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) return `[Error: HTTP ${response.status}]`;
    const html = await response.text();
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().substring(0, 6000);
  } catch (error) {
    return `[Error: ${error instanceof Error ? error.message : "unknown"}]`;
  }
}

async function extractNewsWithAI(
  sourceName: string,
  pageContent: string,
  apiKey: string
): Promise<Array<{ title: string; summary: string; category: string; url?: string; published_at?: string }>> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `You are a regulatory intelligence analyst for medical devices. Extract the most recent and relevant news items from the provided page content of "${sourceName}". Focus on: new standards, guidance documents, regulation updates, safety alerts, and recalls. You must respond using the provided tool.`,
        },
        {
          role: "user",
          content: `Extract up to 5 recent regulatory news items from this page content:\n\n${pageContent}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "report_news_items",
            description: "Report extracted news items from a regulatory authority page",
            parameters: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "News item title" },
                      summary: { type: "string", description: "Brief summary (1-2 sentences)" },
                      category: {
                        type: "string",
                        enum: ["new_standard", "guidance", "regulation_update", "recall", "general"],
                      },
                      url: { type: "string", description: "Direct link if available" },
                      published_at: { type: "string", description: "ISO date if available" },
                    },
                    required: ["title", "summary", "category"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["items"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "report_news_items" } },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`AI error for ${sourceName}: ${response.status} ${errText}`);
    return [];
  }

  const data = await response.json();
  try {
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return parsed.items || [];
    }
  } catch (e) {
    console.error(`Failed to parse AI response for ${sourceName}:`, e);
  }
  return [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: Array<{ source: string; items_count: number; success: boolean }> = [];

    for (const source of NEWS_SOURCES) {
      try {
        console.log(`Fetching news from: ${source.source_name}`);
        const pageContent = await fetchPageContent(source.url);

        if (pageContent.startsWith("[Error")) {
          console.warn(`Skipping ${source.source}: ${pageContent}`);
          results.push({ source: source.source, items_count: 0, success: false });
          continue;
        }

        const items = await extractNewsWithAI(source.source_name, pageContent, LOVABLE_API_KEY);

        for (const item of items) {
          const { error } = await supabase.from("regulatory_news_items").upsert(
            {
              source: source.source,
              source_name: source.source_name,
              title: item.title,
              summary: item.summary,
              url: item.url || source.url,
              published_at: item.published_at || null,
              category: item.category,
              region: source.region,
              scraped_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );
          if (error) console.error(`Insert error for ${source.source}:`, error);
        }

        results.push({ source: source.source, items_count: items.length, success: true });
        // Rate limit between sources
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (err) {
        console.error(`Error processing ${source.source}:`, err);
        results.push({ source: source.source, items_count: 0, success: false });
      }
    }

    // Prune items older than 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    await supabase
      .from("regulatory_news_items")
      .delete()
      .lt("scraped_at", ninetyDaysAgo.toISOString());

    return new Response(
      JSON.stringify({
        scraped_at: new Date().toISOString(),
        total_sources: results.length,
        successful: results.filter((r) => r.success).length,
        total_items: results.reduce((sum, r) => sum + r.items_count, 0),
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("fetch-regulatory-news error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
