import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Standards to check with their catalogue URLs
const STANDARDS_TO_CHECK = [
  { framework_key: "ISO_13485", standard_name: "ISO 13485:2016", url: "https://www.iso.org/standard/59752.html" },
  { framework_key: "ISO_14971", standard_name: "ISO 14971:2019", url: "https://www.iso.org/standard/72704.html" },
  { framework_key: "IEC_62304", standard_name: "IEC 62304:2006+AMD1:2015", url: "https://webstore.iec.ch/en/publication/22794" },
  { framework_key: "IEC_62366", standard_name: "IEC 62366-1:2015+AMD1:2020", url: "https://webstore.iec.ch/en/publication/67220" },
  { framework_key: "IEC_60601_1", standard_name: "IEC 60601-1:2005+AMD1:2012+AMD2:2020", url: "https://webstore.iec.ch/en/publication/67497" },
  { framework_key: "IEC_60601_1_2", standard_name: "IEC 60601-1-2:2014+AMD1:2020", url: "https://webstore.iec.ch/en/publication/67236" },
  { framework_key: "IEC_60601_1_6", standard_name: "IEC 60601-1-6:2010+AMD1:2013+AMD2:2020", url: "https://webstore.iec.ch/en/publication/67498" },
  { framework_key: "ISO_15223", standard_name: "ISO 15223-1:2021/Amd 1:2025", url: "https://www.iso.org/standard/77326.html" },
  { framework_key: "ISO_20417", standard_name: "ISO 20417:2021", url: "https://www.iso.org/standard/78122.html" },
  { framework_key: "ISO_10993", standard_name: "ISO 10993-1:2018", url: "https://www.iso.org/standard/68936.html" },
  { framework_key: "IEC_20957", standard_name: "IEC 20957-1:2013", url: "https://webstore.iec.ch/en/publication/6129" },
  // ASTM
  { framework_key: "ASTM_F1980", standard_name: "ASTM F1980-21", url: "https://www.astm.org/f1980-21.html" },
  { framework_key: "ASTM_F2100", standard_name: "ASTM F2100-23", url: "https://www.astm.org/f2100-23.html" },
  // AAMI
  { framework_key: "AAMI_TIR57", standard_name: "AAMI TIR57:2016/(R)2023", url: "https://www.aami.org/store/products/aami-tir57-2016-r-2023" },
  { framework_key: "AAMI_ST79", standard_name: "AAMI ST79:2017", url: "https://www.aami.org/store/products/ansi-aami-st79-2017" },
  // IEEE
  { framework_key: "IEEE_11073", standard_name: "IEEE 11073-10101:2020", url: "https://standards.ieee.org/ieee/11073-10101/10542/" },
  { framework_key: "IEEE_14971", standard_name: "IEEE 14971:2019", url: "https://standards.ieee.org/ieee/14971/7382/" },
  // CLSI
  { framework_key: "CLSI_EP05", standard_name: "CLSI EP05-A3:2014", url: "https://clsi.org/standards/products/method-evaluation/documents/ep05/" },
  { framework_key: "CLSI_EP17", standard_name: "CLSI EP17-A2:2012", url: "https://clsi.org/standards/products/method-evaluation/documents/ep17/" },
  // USP
  { framework_key: "USP_88", standard_name: "USP <88> In Vivo Biological Reactivity Tests", url: "https://www.usp.org/" },
  { framework_key: "USP_87", standard_name: "USP <87> Biological Reactivity Tests, In Vitro", url: "https://www.usp.org/" },
];

async function fetchPageContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; XyReg-StandardChecker/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) {
      return `[Error fetching page: HTTP ${response.status}]`;
    }
    const html = await response.text();
    // Strip HTML tags, keep text content (first 5000 chars to stay within token limits)
    const textContent = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return textContent.substring(0, 5000);
  } catch (error) {
    return `[Error fetching page: ${error instanceof Error ? error.message : "unknown"}]`;
  }
}

async function checkStandardWithAI(
  standardName: string,
  pageContent: string,
  apiKey: string
): Promise<{ status: string; successor_name: string | null }> {
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
          content: `You are a regulatory standards expert. Analyze the provided page content to determine if the standard "${standardName}" is currently published and in force, or if it has been withdrawn, superseded, or replaced. You must respond using the provided tool.`,
        },
        {
          role: "user",
          content: `Based on the following page content from the official catalogue, determine the status of "${standardName}":\n\n${pageContent}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "report_standard_status",
            description: "Report the current status of a regulatory standard",
            parameters: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  enum: ["In Force", "Superseded"],
                  description: "Whether the standard is currently in force or has been superseded/withdrawn",
                },
                successor_name: {
                  type: "string",
                  description: "If superseded, the name/number of the replacement standard. Null if still in force.",
                },
              },
              required: ["status"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "report_standard_status" } },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`AI Gateway error for ${standardName}: ${response.status} ${errText}`);
    // Default to "In Force" on AI errors to avoid false positives
    return { status: "In Force", successor_name: null };
  }

  const data = await response.json();
  try {
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return {
        status: parsed.status || "In Force",
        successor_name: parsed.successor_name || null,
      };
    }
  } catch (e) {
    console.error(`Failed to parse AI response for ${standardName}:`, e);
  }

  return { status: "In Force", successor_name: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: Array<{ framework_key: string; status: string; success: boolean }> = [];

    for (const standard of STANDARDS_TO_CHECK) {
      try {
        console.log(`Checking: ${standard.standard_name}`);

        // Fetch page content
        const pageContent = await fetchPageContent(standard.url);

        // Ask AI to determine status
        const { status, successor_name } = await checkStandardWithAI(
          standard.standard_name,
          pageContent,
          LOVABLE_API_KEY
        );

        // Update the database
        const { error } = await supabase
          .from("standard_version_status")
          .update({
            status,
            successor_name,
            last_checked_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("framework_key", standard.framework_key);

        if (error) {
          console.error(`DB update error for ${standard.framework_key}:`, error);
          results.push({ framework_key: standard.framework_key, status, success: false });
        } else {
          console.log(`✓ ${standard.framework_key}: ${status}`);
          results.push({ framework_key: standard.framework_key, status, success: true });
        }

        // Small delay between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (err) {
        console.error(`Error checking ${standard.framework_key}:`, err);
        results.push({ framework_key: standard.framework_key, status: "Error", success: false });
      }
    }

    return new Response(
      JSON.stringify({
        checked_at: new Date().toISOString(),
        total: results.length,
        successful: results.filter((r) => r.success).length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("check-standard-status error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
