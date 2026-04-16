import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { XMLParser } from "https://esm.sh/fast-xml-parser@4.3.4";

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

// --- DOCX Comment Extraction ---

interface ExtractedComment {
  docx_comment_id: string;
  author: string | null;
  author_initials: string | null;
  comment_date: string | null;
  content: string;
  quoted_text: string | null;
  parent_comment_docx_id: string | null;
  is_resolved: boolean;
  metadata: Record<string, unknown>;
}

function extractTextFromNodes(node: unknown): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);

  const obj = node as Record<string, unknown>;

  // Direct text node — handles both "w:t" (raw) and "t" (namespace-stripped)
  const tVal = obj["t"] ?? obj["w:t"];
  if (tVal !== undefined) {
    if (typeof tVal === "string" || typeof tVal === "number") return String(tVal);
    if (typeof tVal === "object" && tVal !== null && "#text" in (tVal as Record<string, unknown>))
      return String((tVal as Record<string, unknown>)["#text"]);
    return "";
  }

  // Skip non-content nodes (run properties, paragraph properties, etc.)
  const skipKeys = new Set(["rPr", "pPr", "rFonts", "sz", "szCs", "color", "b", "i", "u",
    "w:rPr", "w:pPr", "@_id", "@_author", "@_date", "@_initials"]);

  // Recurse into runs and paragraphs
  let text = "";
  for (const key of Object.keys(obj)) {
    if (key.startsWith("@_")) continue; // skip all attributes
    if (skipKeys.has(key)) continue;
    const val = obj[key];
    if (Array.isArray(val)) {
      for (const item of val) text += extractTextFromNodes(item);
    } else if (typeof val === "object" && val !== null) {
      text += extractTextFromNodes(val);
    }
  }
  return text;
}

function parseCommentsXml(xmlString: string): ExtractedComment[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: true,
    isArray: (name: string) => ["comment", "p", "r"].includes(name),
  });
  const parsed = parser.parse(xmlString);
  const commentsRoot = parsed?.comments;
  if (!commentsRoot) return [];

  let commentNodes = commentsRoot.comment;
  if (!commentNodes) return [];
  if (!Array.isArray(commentNodes)) commentNodes = [commentNodes];

  const results: ExtractedComment[] = [];
  for (const c of commentNodes) {
    const id = c["@_id"] ?? c["@_w:id"] ?? "";
    const author = c["@_author"] ?? null;
    const initials = c["@_initials"] ?? null;
    const date = c["@_date"] ?? null;

    // Extract text from all paragraphs/runs inside the comment
    const content = extractTextFromNodes(c).trim();

    results.push({
      docx_comment_id: String(id),
      author,
      author_initials: initials,
      comment_date: date,
      content: content || "(empty comment)",
      quoted_text: null,
      parent_comment_docx_id: null,
      is_resolved: false,
      metadata: {},
    });
  }
  return results;
}

function extractQuotedText(documentXml: string, commentId: string): string | null {
  // Find text between commentRangeStart and commentRangeEnd for this comment ID
  // These markers can use w:id or id attribute
  const startPattern = new RegExp(
    `<[^>]*commentRangeStart[^>]*(?:w:id|id)=["']${commentId}["'][^>]*/?>`,
    "i"
  );
  const endPattern = new RegExp(
    `<[^>]*commentRangeEnd[^>]*(?:w:id|id)=["']${commentId}["'][^>]*/?>`,
    "i"
  );

  const startMatch = startPattern.exec(documentXml);
  const endMatch = endPattern.exec(documentXml);

  if (!startMatch || !endMatch || endMatch.index <= startMatch.index) return null;

  const between = documentXml.slice(
    startMatch.index + startMatch[0].length,
    endMatch.index
  );

  // Extract all <w:t> text content from the range
  const textPattern = /<w:t[^>]*>([^<]*)<\/w:t>/gi;
  const texts: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = textPattern.exec(between)) !== null) {
    if (m[1]) texts.push(m[1]);
  }

  return texts.length > 0 ? texts.join("") : null;
}

function enrichWithThreading(comments: ExtractedComment[], extXml: string): void {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      removeNSPrefix: true,
      isArray: (name: string) => ["commentEx"].includes(name),
    });
    const parsed = parser.parse(extXml);
    const root = parsed?.commentsExtended || parsed?.commentsEx;
    if (!root) return;

    let entries = root.commentEx;
    if (!entries) return;
    if (!Array.isArray(entries)) entries = [entries];

    // Build paraId → comment mapping
    const paraIdToComment = new Map<string, ExtractedComment>();
    // OnlyOffice stores paraId on comments; we map by index as fallback
    for (let i = 0; i < comments.length && i < entries.length; i++) {
      const paraId = entries[i]["@_paraId"];
      if (paraId) paraIdToComment.set(paraId, comments[i]);

      const done = entries[i]["@_done"];
      if (done === "1" || done === "true") {
        comments[i].is_resolved = true;
      }

      const parentParaId = entries[i]["@_paraIdParent"];
      if (parentParaId) {
        const parent = paraIdToComment.get(parentParaId);
        if (parent) {
          comments[i].parent_comment_docx_id = parent.docx_comment_id;
        }
      }
    }
  } catch (e) {
    console.warn("Failed to parse commentsExtended.xml:", e);
  }
}

async function extractAndStoreComments(
  uint8Array: Uint8Array,
  documentId: string,
  version: number,
  supabase: ReturnType<typeof createClient>
): Promise<void> {
  const zip = await JSZip.loadAsync(uint8Array);

  // Read comments.xml
  const commentsFile = zip.file("word/comments.xml");
  if (!commentsFile) {
    console.log(`No comments.xml found in document ${documentId} v${version}`);
    return;
  }

  const commentsXml = await commentsFile.async("text");
  const comments = parseCommentsXml(commentsXml);

  if (comments.length === 0) {
    // No comments — clean up any previously stored ones for this version
    await supabase
      .from("docx_comments")
      .delete()
      .eq("document_id", documentId)
      .eq("version", version);
    console.log(`No comments in document ${documentId} v${version}`);
    return;
  }

  // Extract quoted text from document.xml
  const docFile = zip.file("word/document.xml");
  if (docFile) {
    const documentXml = await docFile.async("text");
    for (const comment of comments) {
      comment.quoted_text = extractQuotedText(documentXml, comment.docx_comment_id);
    }
  }

  // Enrich with threading from commentsExtended.xml
  const extFile = zip.file("word/commentsExtended.xml");
  if (extFile) {
    const extXml = await extFile.async("text");
    enrichWithThreading(comments, extXml);
  }

  // Upsert: delete old rows for this version, insert new
  await supabase
    .from("docx_comments")
    .delete()
    .eq("document_id", documentId)
    .eq("version", version);

  const { error } = await supabase.from("docx_comments").insert(
    comments.map((c) => ({
      document_id: documentId,
      version,
      docx_comment_id: c.docx_comment_id,
      author: c.author,
      author_initials: c.author_initials,
      comment_date: c.comment_date,
      content: c.content,
      quoted_text: c.quoted_text,
      parent_comment_docx_id: c.parent_comment_docx_id,
      is_resolved: c.is_resolved,
      metadata: c.metadata,
    }))
  );

  if (error) {
    console.error("Failed to store docx comments:", error);
  } else {
    console.log(
      `Stored ${comments.length} comments for document ${documentId} v${version}`
    );
  }
}

// --- End DOCX Comment Extraction ---

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

  // Extract and store DOCX comments (non-blocking)
  try {
    let extractDocId: string | null = null;
    let extractVersion: number | null = null;

    // Match collab key format: collab-{docId}-v{version}
    const collabMatch = key.match(/^collab-(.+)-v(\d+)$/);
    if (collabMatch) {
      extractDocId = collabMatch[1];
      extractVersion = parseInt(collabMatch[2], 10);
    }

    // Match review key format: review-{docId}-{timestamp}
    if (!extractDocId) {
      const reviewMatch = key.match(/^review-(.+)-\d{10,}$/);
      if (reviewMatch) {
        extractDocId = reviewMatch[1];
        // Get version from DB for review keys
        const { data: session } = await supabase
          .from("document_editor_sessions")
          .select("version")
          .eq("document_id", extractDocId)
          .single();
        extractVersion = session?.version ?? 1;
      }
    }

    if (extractDocId && extractVersion !== null) {
      await extractAndStoreComments(
        uint8Array,
        extractDocId,
        extractVersion,
        supabase
      );
    }
  } catch (e) {
    console.warn("Comment extraction failed (non-fatal):", e);
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
