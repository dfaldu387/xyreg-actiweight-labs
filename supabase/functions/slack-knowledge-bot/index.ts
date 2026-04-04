import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

console.log("slack-knowledge-bot function loaded");

serve(async (req) => {
  console.log("slack-knowledge-bot request:", req.method);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const authHeader = req.headers.get("Authorization");
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );

    const {
      data: { user },
    } = await anonClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "ingest") {
      return await handleIngest(supabaseClient, lovableApiKey, user.id, body);
    } else if (action === "query") {
      return await handleQuery(supabaseClient, lovableApiKey, user.id, body);
    } else {
      return new Response(
        JSON.stringify({ error: "Unknown action: " + action }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("slack-knowledge-bot error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleIngest(
  supabase: any,
  lovableApiKey: string,
  userId: string,
  body: any
) {
  const { companyId, slackData, sourceDate, channelName } = body;

  if (!companyId || !slackData) {
    return new Response(
      JSON.stringify({ error: "companyId and slackData are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Deduplication: check if entry already exists for this company + channel + date
  if (sourceDate && channelName) {
    const { data: existing } = await supabase
      .from("slack_knowledge_entries")
      .select("id")
      .eq("company_id", companyId)
      .eq("channel_name", channelName)
      .eq("source_date", sourceDate)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`Skipping duplicate: ${channelName}/${sourceDate}`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "duplicate" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // Flatten messages into text
  const messages = Array.isArray(slackData) ? slackData : slackData.messages || [];
  const contentParts: string[] = [];

  for (const msg of messages) {
    const user = msg.user_profile?.real_name || msg.user_profile?.name || msg.user || "Unknown";
    const text = msg.text || "";
    const ts = msg.ts
      ? new Date(parseFloat(msg.ts) * 1000).toISOString().split("T")[0]
      : "";

    if (text.trim()) {
      contentParts.push(`[${ts}] ${user}: ${text}`);
    }

    if (msg.replies && Array.isArray(msg.replies)) {
      for (const reply of msg.replies) {
        const replyUser = reply.user || "Unknown";
        const replyText = reply.text || "";
        if (replyText.trim()) {
          contentParts.push(`  ↳ ${replyUser}: ${replyText}`);
        }
      }
    }
  }

  const contentText = contentParts.join("\n");

  // Skip empty files
  if (contentParts.length === 0) {
    return new Response(
      JSON.stringify({ success: true, skipped: true, reason: "empty" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Ask AI to suggest a cluster label
  let cluster = "General";
  try {
    const clusterResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                'You are a topic classifier for Slack messages in a medical device / medtech company. Given the messages, respond with ONLY a single short topic label (2-4 words) such as: "Development Status", "Test Results", "Regulatory Discussion", "Design Review", "Bug Reports", "Project Planning", "Quality Issues", "Team Updates". No explanation, just the label.',
            },
            { role: "user", content: contentText.slice(0, 3000) },
          ],
        }),
      }
    );

    if (clusterResponse.ok) {
      const clusterData = await clusterResponse.json();
      const suggested = clusterData.choices?.[0]?.message?.content?.trim() || "General";
      cluster = suggested.replace(/['"]/g, "").slice(0, 50);
    }
  } catch (e) {
    console.error("Cluster suggestion failed:", e);
  }

  // Store in DB
  const { data, error } = await supabase
    .from("slack_knowledge_entries")
    .insert({
      company_id: companyId,
      uploaded_by: userId,
      source_date: sourceDate || null,
      channel_name: channelName || null,
      cluster,
      raw_messages: messages,
      content_text: contentText,
      message_count: messages.length,
    })
    .select()
    .single();

  if (error) {
    console.error("Insert error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, entry: data }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleQuery(
  supabase: any,
  lovableApiKey: string,
  userId: string,
  body: any
) {
  const { companyId, question, clusterFilter } = body;

  if (!companyId || !question) {
    return new Response(
      JSON.stringify({ error: "companyId and question are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let query = supabase
    .from("slack_knowledge_entries")
    .select("content_text, source_date, cluster, channel_name")
    .eq("company_id", companyId)
    .order("source_date", { ascending: false })
    .limit(20);

  if (clusterFilter && clusterFilter !== "all") {
    query = query.eq("cluster", clusterFilter);
  }

  const { data: entries, error } = await query;

  if (error) {
    console.error("Query error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let context = "";
  let charCount = 0;
  for (const entry of entries || []) {
    const chunk = `\n--- ${entry.source_date || "Unknown date"} | ${entry.cluster || "General"} | ${entry.channel_name || "Unknown channel"} ---\n${entry.content_text}\n`;
    if (charCount + chunk.length > 30000) break;
    context += chunk;
    charCount += chunk.length;
  }

  const aiResponse = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a knowledge assistant for a medical device / medtech company. You have access to Slack conversation history. Answer questions based ONLY on the provided context. If the information isn't in the context, say so. Be concise and reference specific dates or people when relevant.

Context from Slack conversations:
${context}`,
          },
          { role: "user", content: question },
        ],
      }),
    }
  );

  if (!aiResponse.ok) {
    if (aiResponse.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (aiResponse.status === 402) {
      return new Response(
        JSON.stringify({ error: "Payment required, please add credits." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const errText = await aiResponse.text();
    console.error("AI error:", aiResponse.status, errText);
    throw new Error("AI query failed");
  }

  const aiData = await aiResponse.json();
  const answer = aiData.choices?.[0]?.message?.content || "No response generated.";

  await supabase.from("slack_knowledge_chats").insert({
    company_id: companyId,
    user_id: userId,
    query_text: question,
    ai_response: answer,
    cluster_filter: clusterFilter || null,
  });

  return new Response(JSON.stringify({ success: true, answer }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
