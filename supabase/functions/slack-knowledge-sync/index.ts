import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/slack/api";

console.log("slack-knowledge-sync function loaded");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const slackApiKey = Deno.env.get("SLACK_API_KEY");

    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY is not configured");
    if (!slackApiKey) throw new Error("SLACK_API_KEY is not configured — connect Slack connector first");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // For manual triggers, get companyId from body; for cron, use all companies
    let companyId: string | null = null;
    try {
      const body = await req.json();
      companyId = body.companyId || null;
    } catch {
      // Cron trigger — no body
    }

    // If manual trigger with auth, validate user
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader !== `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`) {
      const anonClient = createClient(
        supabaseUrl,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await anonClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Get user's company
      if (!companyId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", user.id)
          .single();
        companyId = profile?.company_id || null;
      }
    }

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: "companyId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch public channels from Slack
    const channelsRes = await fetch(`${GATEWAY_URL}/conversations.list?types=public_channel&limit=200`, {
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "X-Connection-Api-Key": slackApiKey,
      },
    });

    if (!channelsRes.ok) {
      const errText = await channelsRes.text();
      throw new Error(`Slack conversations.list failed [${channelsRes.status}]: ${errText}`);
    }

    const channelsData = await channelsRes.json();
    const channels = channelsData.channels || [];
    console.log(`Found ${channels.length} public channels`);

    let channelsSynced = 0;
    let messagesIngested = 0;

    for (const channel of channels) {
      try {
        // Get last sync timestamp for this channel
        const { data: syncRecord } = await supabase
          .from("slack_sync_state")
          .select("last_synced_at")
          .eq("company_id", companyId)
          .eq("channel_id", channel.id)
          .single();

        const oldest = syncRecord
          ? String(new Date(syncRecord.last_synced_at).getTime() / 1000)
          : "0";

        // Fetch messages since last sync
        const historyRes = await fetch(
          `${GATEWAY_URL}/conversations.history?channel=${channel.id}&oldest=${oldest}&limit=200`,
          {
            headers: {
              Authorization: `Bearer ${lovableApiKey}`,
              "X-Connection-Api-Key": slackApiKey,
            },
          }
        );

        if (!historyRes.ok) {
          console.error(`Failed to fetch history for #${channel.name}: ${historyRes.status}`);
          continue;
        }

        const historyData = await historyRes.json();
        const messages = historyData.messages || [];

        if (messages.length === 0) continue;

        // Group messages by date
        const messagesByDate: Record<string, any[]> = {};
        for (const msg of messages) {
          const date = msg.ts
            ? new Date(parseFloat(msg.ts) * 1000).toISOString().split("T")[0]
            : "unknown";
          if (!messagesByDate[date]) messagesByDate[date] = [];
          messagesByDate[date].push(msg);
        }

        // Ingest each day's messages
        for (const [date, dayMessages] of Object.entries(messagesByDate)) {
          // Dedup check
          const { data: existing } = await supabase
            .from("slack_knowledge_entries")
            .select("id")
            .eq("company_id", companyId)
            .eq("channel_name", channel.name)
            .eq("source_date", date)
            .limit(1);

          if (existing && existing.length > 0) continue;

          // Flatten messages
          const contentParts: string[] = [];
          for (const msg of dayMessages) {
            const userName = msg.user || "Unknown";
            const text = msg.text || "";
            if (text.trim()) {
              contentParts.push(`[${date}] ${userName}: ${text}`);
            }
          }

          if (contentParts.length === 0) continue;

          const contentText = contentParts.join("\n");

          // Classify topic
          let cluster = "General";
          try {
            const clusterRes = await fetch(
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
                        'You are a topic classifier for Slack messages in a medical device / medtech company. Respond with ONLY a single short topic label (2-4 words). No explanation.',
                    },
                    { role: "user", content: contentText.slice(0, 3000) },
                  ],
                }),
              }
            );
            if (clusterRes.ok) {
              const cd = await clusterRes.json();
              cluster = (cd.choices?.[0]?.message?.content?.trim() || "General").replace(/['"]/g, "").slice(0, 50);
            }
          } catch (e) {
            console.error("Cluster suggestion failed:", e);
          }

          await supabase.from("slack_knowledge_entries").insert({
            company_id: companyId,
            uploaded_by: null,
            source_date: date,
            channel_name: channel.name,
            cluster,
            raw_messages: dayMessages,
            content_text: contentText,
            message_count: dayMessages.length,
          });

          messagesIngested += dayMessages.length;
        }

        // Update sync state
        await supabase.from("slack_sync_state").upsert(
          {
            company_id: companyId,
            channel_id: channel.id,
            channel_name: channel.name,
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "company_id,channel_id" }
        );

        channelsSynced++;
      } catch (channelError) {
        console.error(`Error syncing #${channel.name}:`, channelError);
      }
    }

    console.log(`Sync complete: ${channelsSynced} channels, ${messagesIngested} messages`);

    return new Response(
      JSON.stringify({ success: true, channelsSynced, messagesIngested }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("slack-knowledge-sync error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
