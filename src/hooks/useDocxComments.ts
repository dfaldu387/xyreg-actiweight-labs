import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DocxCommentService,
  type DocxComment,
} from "@/services/docxCommentService";

export interface ThreadedComment extends DocxComment {
  replies: DocxComment[];
}

export function useDocxComments(documentId?: string, initialVersion?: number) {
  const [comments, setComments] = useState<DocxComment[]>([]);
  const [versions, setVersions] = useState<number[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(
    initialVersion ?? null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch available versions
  useEffect(() => {
    if (!documentId) {
      setVersions([]);
      return;
    }
    DocxCommentService.getAllVersionsWithComments(documentId)
      .then((v) => {
        setVersions(v);
        // Default to latest version if none selected
        if (selectedVersion === null && v.length > 0) {
          setSelectedVersion(v[0]); // v is sorted desc
        }
      })
      .catch(console.error);
  }, [documentId]);

  // Fetch comments for selected version
  const fetchComments = useCallback(async () => {
    if (!documentId || selectedVersion === null) {
      setComments([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await DocxCommentService.getCommentsByDocumentAndVersion(
        documentId,
        selectedVersion
      );
      setComments(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  }, [documentId, selectedVersion]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Build threaded structure: top-level comments with their replies
  const threadedComments = useMemo<ThreadedComment[]>(() => {
    const topLevel = comments.filter((c) => !c.parent_comment_docx_id);
    const replyMap = new Map<string, DocxComment[]>();

    for (const c of comments) {
      if (c.parent_comment_docx_id) {
        const existing = replyMap.get(c.parent_comment_docx_id) ?? [];
        existing.push(c);
        replyMap.set(c.parent_comment_docx_id, existing);
      }
    }

    return topLevel.map((c) => ({
      ...c,
      replies: replyMap.get(c.docx_comment_id) ?? [],
    }));
  }, [comments]);

  return {
    comments,
    threadedComments,
    versions,
    selectedVersion,
    setSelectedVersion,
    isLoading,
    error,
    refresh: fetchComments,
  };
}
