import { useCallback, useEffect, useState } from "react";
import { UserCommentService, type UserComment } from "@/services/userCommentService";
import { supabase } from "@/integrations/supabase/client";

export function useUserComments(documentId?: string) {
  const [comments, setComments] = useState<UserComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!documentId) {
      setComments([]);
      return;
    }
    setIsLoading(true);
    try {
      setComments(await UserCommentService.list(documentId));
    } catch (e) {
      console.error("[useUserComments] list failed", e);
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => { void refresh(); }, [refresh]);

  // Realtime subscription
  useEffect(() => {
    if (!documentId) return;
    const channel = supabase
      .channel(`duc:${documentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "document_user_comments", filter: `document_id=eq.${documentId}` },
        () => { void refresh(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [documentId, refresh]);

  return { comments, isLoading, refresh };
}
