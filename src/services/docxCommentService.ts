import { supabase } from "@/integrations/supabase/client";

export interface DocxComment {
  id: string;
  document_id: string;
  version: number;
  docx_comment_id: string;
  author: string | null;
  author_initials: string | null;
  comment_date: string | null;
  content: string;
  quoted_text: string | null;
  parent_comment_docx_id: string | null;
  is_resolved: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const DocxCommentService = {
  async getCommentsByDocumentAndVersion(
    documentId: string,
    version: number
  ): Promise<DocxComment[]> {
    const { data, error } = await supabase
      .from("docx_comments")
      .select("*")
      .eq("document_id", documentId)
      .eq("version", version)
      .order("docx_comment_id", { ascending: true });

    if (error) throw error;
    return (data ?? []) as DocxComment[];
  },

  async getLatestComments(documentId: string): Promise<DocxComment[]> {
    // Get latest version from editor sessions
    const { data: session } = await supabase
      .from("document_editor_sessions")
      .select("version")
      .eq("document_id", documentId)
      .single();

    if (!session) return [];

    return this.getCommentsByDocumentAndVersion(documentId, session.version);
  },

  async getAllVersionsWithComments(
    documentId: string
  ): Promise<number[]> {
    const { data, error } = await supabase
      .from("docx_comments")
      .select("version")
      .eq("document_id", documentId)
      .order("version", { ascending: false });

    if (error) throw error;

    // Deduplicate versions
    const versions = [...new Set((data ?? []).map((r) => r.version))];
    return versions;
  },

  async getCommentsByDocument(documentId: string): Promise<DocxComment[]> {
    const { data, error } = await supabase
      .from("docx_comments")
      .select("*")
      .eq("document_id", documentId)
      .order("version", { ascending: false })
      .order("docx_comment_id", { ascending: true });

    if (error) throw error;
    return (data ?? []) as DocxComment[];
  },
};
