import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
};

const DocumentStatus = {
  EDITING: 1,
  SAVE: 2,
  SAVE_CORRUPTED: 3,
  CLOSED_NO_CHANGES: 4,
  FORCE_SAVE: 6,
  FORCE_SAVE_ERROR: 7,
};

interface OnlyOfficeCallback {
  key: string;
  status: number;
  url?: string;
  changesurl?: string;
  history?: object;
  users?: string[];
  actions?: Array<{ type: number; userid: string }>;
  lastsave?: string;
  notmodified?: boolean;
  forcesavetype?: number;
  filetype?: string;
}

async function processSave(
  callbackData: OnlyOfficeCallback,
  requestUrl: string
) {
  const { key, status, url } = callbackData;
  if (!url) return;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log(`Saving document ${key} from URL: ${url}`);

  const documentResponse = await fetch(url);
  if (!documentResponse.ok) {
    console.error(`Failed to download document: ${documentResponse.statusText}`);
    return;
  }

  const documentBlob = await documentResponse.blob();
  const arrayBuffer = await documentBlob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const parsedUrl = new URL(requestUrl);
  const originalPath = parsedUrl.searchParams.get("path");

  if (originalPath) {
    const cleanPath = originalPath.startsWith("/") ? originalPath.slice(1) : originalPath;
    const { error: uploadError } = await supabase.storage
      .from("document-templates")
      .upload(cleanPath, uint8Array, {
        contentType: documentBlob.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return;
    }
    console.log(`Document saved to document-templates/${cleanPath}`);
  } else {
    const keyParts = key.split("-");
    const documentId = keyParts.slice(1, -1).join("-");
    const fileExtension = callbackData.filetype || "docx";
    const fileName = `edited_${Date.now()}.${fileExtension}`;
    const storagePath = `documents/${documentId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("document-templates")
      .upload(storagePath, uint8Array, {
        contentType: documentBlob.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return;
    }
    console.log(`Document saved to document-templates/${storagePath}`);
  }

  // Rotate editor key on final save (status 2 = all users closed)
  if (status === DocumentStatus.SAVE) {
    const match = key.match(/^collab-(.+)-v(\d+)$/);
    if (match) {
      const docId = match[1];
      const currentVersion = parseInt(match[2], 10);
      const newVersion = currentVersion + 1;
      const newKey = `collab-${docId}-v${newVersion}`;

      const { error: updateError } = await supabase
        .from("document_editor_sessions")
        .update({
          editor_key: newKey,
          version: newVersion,
          updated_at: new Date().toISOString(),
        })
        .eq("document_id", docId);

      if (updateError) {
        console.warn("Could not rotate editor key:", updateError);
      } else {
        console.log(`Editor key rotated: v${currentVersion} -> v${newVersion}`);
      }
    }
  }
}

const successResponse = JSON.stringify({ error: 0 });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const callbackData: OnlyOfficeCallback = await req.json();
    const { key, status } = callbackData;
    console.log(`ONLYOFFICE Callback: key=${key}, status=${status}`);

    if (status === DocumentStatus.SAVE || status === DocumentStatus.FORCE_SAVE) {
      // Respond to OnlyOffice IMMEDIATELY, save in background
      const savePromise = processSave(callbackData, req.url);
      savePromise.catch((e) => console.error("Background save error:", e));

      return new Response(successResponse, {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (status === DocumentStatus.EDITING) {
      console.log(`Document ${key} is being edited`);
    } else if (status === DocumentStatus.CLOSED_NO_CHANGES) {
      console.log(`Document ${key} closed without changes`);
    } else if (status === DocumentStatus.SAVE_CORRUPTED) {
      console.error(`Document ${key} save corrupted`);
    }

    return new Response(successResponse, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Callback error:", error);
    return new Response(
      JSON.stringify({ error: 1 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
