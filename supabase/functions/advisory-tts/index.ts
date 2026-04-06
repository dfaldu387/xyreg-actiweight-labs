import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function decryptApiKey(encryptedKey: string): string {
  const ENCRYPTION_KEY = 'medtech-api-key-2024';
  if (encryptedKey.startsWith('AIza') || encryptedKey.startsWith('sk-')) {
    return encryptedKey;
  }
  try {
    const base64Decoded = atob(encryptedKey);
    return Array.from(base64Decoded)
      .map((char, i) =>
        String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length))
      )
      .join('');
  } catch {
    return encryptedKey;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId, companyId } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: "Missing text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Try company-specific key from company_api_keys table
    let companyElevenLabsKey: string | null = null;

    if (companyId) {
      try {
        console.log("Looking up ElevenLabs key for company:", companyId);
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        const { data, error: keyError } = await supabase
          .from("company_api_keys")
          .select("encrypted_key")
          .eq("company_id", companyId)
          .eq("key_type", "elevenlabs")
          .maybeSingle();

        if (keyError) {
          console.error("DB error fetching key:", keyError);
        }

        if (data?.encrypted_key) {
          console.log("Found company ElevenLabs key, decrypting...");
          companyElevenLabsKey = decryptApiKey(data.encrypted_key);
          console.log("Decrypted key prefix:", companyElevenLabsKey.substring(0, 4));
        } else {
          console.log("No company ElevenLabs key found, data:", JSON.stringify(data));
        }
      } catch (err) {
        console.error("Error fetching company ElevenLabs key:", err);
      }
    } else {
      console.log("No companyId provided in request");
    }

    const fallbackEnvKey = Deno.env.get("ELEVENLABS_API_KEY") || null;
    console.log("ENV ELEVENLABS_API_KEY exists:", !!fallbackEnvKey);
    if (fallbackEnvKey) console.log("ENV key prefix:", fallbackEnvKey.substring(0, 6));

    // Prioritize env key over potentially broken company key
    const candidateKeys = [fallbackEnvKey, companyElevenLabsKey].filter(
      (key, index, array): key is string => Boolean(key) && array.indexOf(key) === index
    );

    const DEFAULT_VOICE = "ErXwobaYiN019PkySvjV"; // Antoni — clean, clear male voice
    const voice = voiceId || DEFAULT_VOICE;

    console.log("=== TTS REQUEST ===");
    console.log("voiceId from request:", voiceId);
    console.log("Using voice:", voice);
    console.log("Text length:", text.length);
    console.log("Text preview:", text.slice(0, 100));
    console.log("companyId:", companyId);
    console.log("Candidate keys count:", candidateKeys.length);

    // Pre-process text for natural speech pauses
    const processedText = text
      .replace(/\. /g, '.\n\n')     // Add pause after sentences
      .replace(/\? /g, '?\n\n')     // Add pause after questions
      .replace(/! /g, '!\n\n')      // Add pause after exclamations
      .replace(/: /g, ':\n')        // Slight pause after colons
      .slice(0, 5000);

    if (candidateKeys.length === 0) {
      console.error("NO API KEYS AVAILABLE — falling back to browser TTS");
      return new Response(JSON.stringify({ fallback: true, reason: "no_api_keys" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (let i = 0; i < candidateKeys.length; i++) {
      const elevenLabsKey = candidateKeys[i];
      console.log(`Trying key ${i + 1}/${candidateKeys.length}, prefix: ${elevenLabsKey.substring(0, 6)}...`);

      const requestBody = {
        text: processedText,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.8,
          style: 0.35,
          use_speaker_boost: true,
        },
      };
      console.log("ElevenLabs request — model:", requestBody.model_id, "voice:", voice, "settings:", JSON.stringify(requestBody.voice_settings));

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: {
            "xi-api-key": elevenLabsKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log("ElevenLabs response status:", response.status);
      console.log("ElevenLabs response content-type:", response.headers.get("content-type"));

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        console.log("SUCCESS — audio size:", audioBuffer.byteLength, "bytes");
        return new Response(audioBuffer, {
          headers: { ...corsHeaders, "Content-Type": "audio/mpeg" },
        });
      }

      const errorText = await response.text();
      console.error(`ElevenLabs TTS error (key ${i + 1}):`, response.status, errorText);
    }

    // No working key — signal browser TTS fallback
    console.error("ALL KEYS FAILED — falling back to browser TTS");
    return new Response(JSON.stringify({ fallback: true, reason: "all_keys_failed" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("advisory-tts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
