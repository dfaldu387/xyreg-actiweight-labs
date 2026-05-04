import { supabase } from "@/integrations/supabase/client";

export interface UserComment {
  id: string;
  document_id: string;
  company_id: string;
  author_id: string;
  author_name: string | null;
  content: string;
  quoted_text: string | null;
  anchor: { from?: number; to?: number } | null;
  parent_id: string | null;
  is_resolved: boolean;
  mentioned_user_ids: string[];
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
}

export const UserCommentService = {
  async list(documentId: string): Promise<UserComment[]> {
    const { data, error } = await supabase
      .from("document_user_comments" as any)
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as UserComment[];
  },

  async create(input: {
    documentId: string;
    companyId: string;
    content: string;
    quotedText?: string | null;
    anchor?: { from: number; to: number } | null;
    parentId?: string | null;
    mentionedUserIds?: string[];
    assigneeId?: string | null;
  }): Promise<UserComment> {
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;
    if (!user) throw new Error("Not authenticated");
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const author_name =
      (meta.full_name as string) ||
      [meta.first_name, meta.last_name].filter(Boolean).join(" ").trim() ||
      user.email ||
      null;

    const { data, error } = await supabase
      .from("document_user_comments" as any)
      .insert({
        document_id: input.documentId,
        company_id: input.companyId,
        author_id: user.id,
        author_name,
        content: input.content,
        quoted_text: input.quotedText ?? null,
        anchor: input.anchor ?? null,
        parent_id: input.parentId ?? null,
        mentioned_user_ids: input.mentionedUserIds ?? [],
        assignee_id: input.assigneeId ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;

    // Fanout notifications to assignee + mentioned users (excluding self)
    try {
      const recipients = new Set<string>();
      if (input.assigneeId && input.assigneeId !== user.id) recipients.add(input.assigneeId);
      (input.mentionedUserIds ?? []).forEach((uid) => { if (uid && uid !== user.id) recipients.add(uid); });
      if (recipients.size > 0) {
        const rows = Array.from(recipients).map((uid) => ({
          user_id: uid,
          actor_id: user.id,
          actor_name: author_name,
          company_id: input.companyId,
          category: "review",
          action: input.assigneeId === uid ? "comment_assigned" : "comment_mentioned",
          title: input.assigneeId === uid ? "Comment assigned to you" : "You were mentioned in a comment",
          message: (input.content || "").slice(0, 200),
          priority: input.assigneeId === uid ? "high" : "normal",
          entity_type: "document_comment",
          entity_id: (data as any).id,
          metadata: { document_id: input.documentId },
        }));
        await supabase.from("app_notifications").insert(rows);
      }
    } catch (e) { console.error("[UserCommentService] notify failed", e); }

    return data as unknown as UserComment;
  },

  async setAssignee(id: string, assigneeId: string | null): Promise<void> {
    const { data: existing } = await supabase
      .from("document_user_comments" as any)
      .select("id, company_id, document_id, content, author_id, author_name")
      .eq("id", id)
      .single();
    const { error } = await supabase
      .from("document_user_comments" as any)
      .update({ assignee_id: assigneeId })
      .eq("id", id);
    if (error) throw error;
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const actor = userRes?.user;
      const ex: any = existing;
      if (assigneeId && ex && actor && assigneeId !== actor.id) {
        await supabase.from("app_notifications").insert({
          user_id: assigneeId,
          actor_id: actor.id,
          actor_name: ex.author_name ?? null,
          company_id: ex.company_id,
          category: "review",
          action: "comment_assigned",
          title: "Comment assigned to you",
          message: (ex.content || "").slice(0, 200),
          priority: "high",
          entity_type: "document_comment",
          entity_id: id,
          metadata: { document_id: ex.document_id },
        });
      }
    } catch (e) { console.error("[UserCommentService] assign notify failed", e); }
  },

  async resolve(id: string, resolved = true): Promise<void> {
    const { error } = await supabase
      .from("document_user_comments" as any)
      .update({ is_resolved: resolved })
      .eq("id", id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from("document_user_comments" as any)
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};
