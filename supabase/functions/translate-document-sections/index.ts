// Translate document sections into a target language using Lovable AI.
// Supports two section content formats:
//   1. HTML strings (TipTap output)
//   2. Structured block arrays: [{ id, type, content, metadata, ... }]
// Returns the same shape with translated content while preserving structure.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LANGUAGE_NAMES: Record<string, string> = {
  FI: "Finnish",
  SV: "Swedish",
  NO: "Norwegian (Bokmål)",
  DA: "Danish",
  DE: "German",
  FR: "French",
  ES: "Spanish",
  IT: "Italian",
};

interface Section {
  id: string;
  title?: string;
  // Either an HTML string or an array of structured blocks (TipTap-like).
  content: any;
}

async function translateText(text: string, title: string | undefined, targetName: string, sourceName: string, apiKey: string, asHtml: boolean): Promise<string> {
  if (!text || !String(text).trim()) return text;

  const system = asHtml
    ? `You are a professional medical-device regulatory translator.
Translate the user's HTML content from ${sourceName} into ${targetName}.
RULES:
1. Preserve the EXACT HTML structure: all tags, attributes, IDs, classes, and ordering must be identical.
2. Translate ONLY the visible text nodes. Do NOT translate tag names, attribute names, or attribute values.
3. Do NOT add any new text, headings, prefaces, labels, or parent-section context. No "Section:", "Chapter:", parent titles, etc.
4. Translate the input verbatim — same number of paragraphs, same order, same length scale. Do not summarise or expand.
5. Keep regulatory terminology accurate (ISO 13485, ISO 14971, MDR, FDA, CAPA, NCR, SOP, QMS — these acronyms stay in English).
6. Keep document numbers, dates, and names of standards (e.g. "EN ISO 13485:2016") unchanged.
7. Return ONLY the translated HTML. No commentary, no code fences, no explanations.`
    : `You are a professional medical-device regulatory translator.
Translate the user's text from ${sourceName} into ${targetName}.
RULES:
1. Translate the prose verbatim. Preserve line breaks, bullet markers (•, -, *), numbering, and table-like structures (| ... |).
2. Do NOT add any new text, headings, prefaces, labels, or parent-section context. No "Section:", "Chapter:", parent titles, etc.
3. Same number of lines, same order, same length scale. Do not summarise or expand.
4. Keep regulatory acronyms in English (ISO 13485, ISO 14971, MDR, FDA, CAPA, NCR, SOP, QMS, DCO, CFR).
5. Keep document numbers, dates, and standard names (e.g. "EN ISO 13485:2016") unchanged.
6. Return ONLY the translated text. No commentary, no code fences, no explanations.`;

  // IMPORTANT: never inject the section title into the user message — the model
  // would translate that label too and emit it as part of the output (e.g.
  // "Seksjon: 6.0 Prosedyre" prepended to every block). Pass the raw text only.
  const user = text;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 8192,
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    const err: any = new Error(`AI gateway ${resp.status}: ${txt}`);
    err.status = resp.status;
    throw err;
  }

  const data = await resp.json();
  let out = data?.choices?.[0]?.message?.content ?? "";
  // Strip accidental code fences
  out = String(out).replace(/^```(?:html|markdown|md)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return out || text;
}

function looksLikeHtml(s: string): boolean {
  return /<\/?[a-zA-Z][^>]*>/.test(s);
}

async function translateBlocks(blocks: any[], sectionTitle: string | undefined, targetName: string, sourceName: string, apiKey: string): Promise<any[]> {
  const out: any[] = [];
  for (const b of blocks) {
    if (!b || typeof b !== "object") { out.push(b); continue; }
    const text = typeof b.content === "string" ? b.content : "";
    if (!text.trim()) { out.push(b); continue; }
    const asHtml = looksLikeHtml(text);
    try {
      const translated = await translateText(text, sectionTitle, targetName, sourceName, apiKey, asHtml);
      out.push({ ...b, content: translated });
    } catch (e: any) {
      if (e?.status === 429 || e?.status === 402) throw e;
      console.error("translate block failed", b?.id, e);
      out.push(b);
    }
  }
  return out;
}

async function translateSectionContent(content: any, title: string | undefined, targetName: string, sourceName: string, apiKey: string): Promise<any> {
  if (Array.isArray(content)) {
    return await translateBlocks(content, title, targetName, sourceName, apiKey);
  }
  if (typeof content === "string") {
    const asHtml = looksLikeHtml(content);
    return await translateText(content, title, targetName, sourceName, apiKey, asHtml);
  }
  return content;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const sections: Section[] = Array.isArray(body?.sections) ? body.sections : [];
    const targetCode: string = String(body?.targetLanguage || "").toUpperCase();
    const sourceCode: string = String(body?.sourceLanguage || "EN").toUpperCase();

    const targetName = LANGUAGE_NAMES[targetCode];
    if (!targetName) {
      return new Response(JSON.stringify({ error: `Unsupported target language: ${targetCode}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sourceName = LANGUAGE_NAMES[sourceCode] || "English";

    if (sections.length === 0) {
      return new Response(JSON.stringify({ sections: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const translated: Section[] = [];
    for (const sec of sections) {
      try {
        // Backward compatibility: accept either { content } or { html }.
        const incoming = (sec as any).content ?? (sec as any).html;
        const translatedContent = await translateSectionContent(incoming, sec.title, targetName, sourceName, apiKey);
        translated.push({ ...sec, content: translatedContent });
      } catch (e: any) {
        if (e?.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit reached, please try again shortly." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (e?.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits to continue." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.error("translate section failed", sec.id, e);
        // Fall back to original to keep the document usable
        translated.push(sec);
      }
    }

    return new Response(JSON.stringify({ sections: translated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("translate-document-sections error", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});