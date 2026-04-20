import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DocxComment } from "@/services/docxCommentService";

interface DocxCommentHighlighterProps {
  containerRef: React.RefObject<HTMLElement | null>;
  comments: DocxComment[];
  /** When false, skip inserting inline 💬 badges after each highlighted passage. */
  showBadges?: boolean;
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function findTextRange(
  container: HTMLElement,
  searchText: string
): Range | null {
  const normalized = normalizeText(searchText);
  if (!normalized) return null;

  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null
  );

  const textNodes: Text[] = [];
  const nodeStarts: number[] = [];
  let fullText = "";

  let n: Text | null;
  while ((n = walker.nextNode() as Text | null)) {
    nodeStarts.push(fullText.length);
    textNodes.push(n);
    fullText += n.textContent || "";
  }

  const normalizedFull = normalizeText(fullText);
  let matchIdx = normalizedFull.indexOf(normalized);
  let matchLen = normalized.length;

  if (matchIdx === -1 && normalized.length > 80) {
    matchIdx = normalizedFull.indexOf(normalized.slice(0, 80));
    matchLen = 80;
  }
  if (matchIdx === -1) return null;

  const normToOrig: number[] = [];
  for (let i = 0; i < fullText.length; i++) {
    if (/\s/.test(fullText[i])) {
      if (i === 0 || !/\s/.test(fullText[i - 1])) normToOrig.push(i);
    } else {
      normToOrig.push(i);
    }
  }

  const startOrig = normToOrig[matchIdx] ?? matchIdx;
  const endOrig =
    normToOrig[matchIdx + matchLen - 1] !== undefined
      ? normToOrig[matchIdx + matchLen - 1] + 1
      : startOrig + matchLen;

  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;

  for (let i = 0; i < textNodes.length; i++) {
    const nStart = nodeStarts[i];
    const nEnd = nStart + (textNodes[i].textContent?.length || 0);
    if (!startNode && startOrig < nEnd) {
      startNode = textNodes[i];
      startOffset = startOrig - nStart;
    }
    if (endOrig <= nEnd) {
      endNode = textNodes[i];
      endOffset = endOrig - nStart;
      break;
    }
  }

  if (!startNode || !endNode) return null;

  try {
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    return range;
  } catch {
    return null;
  }
}

/**
 * Wrap each text node within a Range individually with <mark> elements.
 * This works reliably even when the range spans across multiple HTML elements.
 * Returns all created mark elements.
 */
function highlightRange(range: Range, commentId: string): HTMLElement[] {
  const marks: HTMLElement[] = [];

  // Collect text nodes within the range
  const walker = document.createTreeWalker(
    range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentElement!
      : (range.commonAncestorContainer as HTMLElement),
    NodeFilter.SHOW_TEXT,
    null
  );

  const textNodesInRange: { node: Text; start: number; end: number }[] = [];
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    if (!range.intersectsNode(node)) continue;
    const nodeLen = node.textContent?.length || 0;
    let start = 0;
    let end = nodeLen;

    if (node === range.startContainer) start = range.startOffset;
    if (node === range.endContainer) end = range.endOffset;

    if (start < end) {
      textNodesInRange.push({ node, start, end });
    }
  }

  // Also handle single text node range
  if (
    textNodesInRange.length === 0 &&
    range.startContainer === range.endContainer &&
    range.startContainer.nodeType === Node.TEXT_NODE
  ) {
    textNodesInRange.push({
      node: range.startContainer as Text,
      start: range.startOffset,
      end: range.endOffset,
    });
  }

  // Wrap each text portion with a <mark>
  for (const { node: textNode, start, end } of textNodesInRange) {
    // Split the text node to isolate the matched portion
    const before = textNode.textContent?.slice(0, start) || "";
    const matched = textNode.textContent?.slice(start, end) || "";
    const after = textNode.textContent?.slice(end) || "";

    if (!matched) continue;

    const parent = textNode.parentNode;
    if (!parent) continue;

    const mark = document.createElement("mark");
    mark.className = "docx-comment-mark";
    mark.dataset.commentId = commentId;
    mark.style.cssText =
      "background-color: #FEF08A !important; color: #1F2937 !important; border-bottom: 2px solid #F59E0B !important; border-radius: 2px; cursor: pointer; padding: 0 2px; display: inline;";
    mark.textContent = matched;

    const frag = document.createDocumentFragment();
    if (before) frag.appendChild(document.createTextNode(before));
    frag.appendChild(mark);
    if (after) frag.appendChild(document.createTextNode(after));

    parent.replaceChild(frag, textNode);
    marks.push(mark);
  }

  return marks;
}

/**
 * Remove all highlight marks, restoring original text nodes.
 */
function removeHighlights(marks: HTMLElement[]) {
  for (const mark of marks) {
    const parent = mark.parentNode;
    if (!parent) continue;
    // Replace mark with its text content
    const text = document.createTextNode(mark.textContent || "");
    parent.replaceChild(text, mark);
    // Normalize to merge adjacent text nodes
    parent.normalize();
  }
}

function CommentPopover({
  comment,
  anchorEl,
  onClose,
}: {
  comment: DocxComment;
  anchorEl: HTMLElement;
  onClose: () => void;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const rect = anchorEl.getBoundingClientRect();
    setPos({
      top: rect.bottom + 6,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - 320)),
    });
  }, [anchorEl]);

  return createPortal(
    <div
      className="fixed z-[9999] w-[300px] bg-white border border-gray-200 rounded-lg shadow-xl p-3 space-y-2"
      style={{ top: pos.top, left: pos.left }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-medium">
            {comment.author || "Unknown"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      {comment.comment_date && (
        <p className="text-xs text-muted-foreground">
          {new Date(comment.comment_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
      {comment.quoted_text && (
        <div className="bg-yellow-50 border-l-2 border-yellow-300 px-2 py-1 rounded-r">
          <p className="text-xs text-yellow-800 italic line-clamp-2">
            &ldquo;{comment.quoted_text.slice(0, 120)}
            {comment.quoted_text.length > 120 ? "..." : ""}&rdquo;
          </p>
        </div>
      )}
      <p className="text-sm font-medium">{comment.content}</p>
      {comment.is_resolved && (
        <Badge
          variant="outline"
          className="text-green-600 border-green-200 text-xs"
        >
          Resolved
        </Badge>
      )}
    </div>,
    document.body
  );
}

export function DocxCommentHighlighter({
  containerRef,
  comments,
  showBadges = true,
}: DocxCommentHighlighterProps) {
  const allMarks = useRef<HTMLElement[]>([]);
  const badgeEls = useRef<HTMLElement[]>([]);
  const commentMap = useRef<Map<string, DocxComment>>(new Map());
  const [activeComment, setActiveComment] = useState<{
    comment: DocxComment;
    anchorEl: HTMLElement;
  } | null>(null);

  const applyHighlights = useCallback(() => {
    // Clean up previous
    removeHighlights(allMarks.current);
    allMarks.current = [];
    badgeEls.current.forEach((b) => b.remove());
    badgeEls.current = [];
    commentMap.current.clear();

    const container = containerRef.current;
    if (!container || comments.length === 0) return;

    const topLevel = comments.filter((c) => !c.parent_comment_docx_id);

    for (const comment of topLevel) {
      if (!comment.quoted_text) continue;

      const range = findTextRange(container, comment.quoted_text);
      if (!range) continue;

      const marks = highlightRange(range, comment.id);
      if (marks.length === 0) continue;

      allMarks.current.push(...marks);
      commentMap.current.set(comment.id, comment);

      // Add click handlers to all marks for this comment
      for (const mark of marks) {
        mark.addEventListener("click", (e) => {
          e.stopPropagation();
          setActiveComment({ comment, anchorEl: mark });
        });
      }

      if (showBadges) {
        // Add a small inline badge after the last mark
        const lastMark = marks[marks.length - 1];
        const badge = document.createElement("span");
        badge.className = "docx-comment-badge";
        badge.style.cssText =
          "display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; background: #f59e0b; color: white; border-radius: 50%; font-size: 10px; margin-left: 2px; cursor: pointer; vertical-align: text-top; line-height: 1; user-select: none;";
        badge.textContent = "💬";
        badge.addEventListener("click", (e) => {
          e.stopPropagation();
          setActiveComment({ comment, anchorEl: badge });
        });

        // Insert badge after the last mark
        if (lastMark.nextSibling) {
          lastMark.parentNode?.insertBefore(badge, lastMark.nextSibling);
        } else {
          lastMark.parentNode?.appendChild(badge);
        }
        badgeEls.current.push(badge);
      }
    }
  }, [containerRef, comments, showBadges]);

  useEffect(() => {
    // Inject a global stylesheet once so prose/typography defaults don't strip
    // our background color from <mark class="docx-comment-mark">.
    const styleId = "docx-comment-mark-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        mark.docx-comment-mark,
        .prose mark.docx-comment-mark,
        .prose-sm mark.docx-comment-mark {
          background-color: #FEF08A !important;
          color: #1F2937 !important;
          border-bottom: 2px solid #F59E0B !important;
          border-radius: 2px;
          padding: 0 2px;
        }
        mark.docx-comment-mark.docx-comment-mark--active {
          background-color: #FACC15 !important;
          box-shadow: 0 0 0 3px #F97316, 0 0 12px 2px rgba(249, 115, 22, 0.7);
        }
      `;
      document.head.appendChild(style);
    }

    const timer = setTimeout(applyHighlights, 400);
    return () => {
      clearTimeout(timer);
      removeHighlights(allMarks.current);
      allMarks.current = [];
      badgeEls.current.forEach((b) => b.remove());
      badgeEls.current = [];
    };
  }, [applyHighlights]);

  // Close popover on outside click
  useEffect(() => {
    if (!activeComment) return;
    const close = () => setActiveComment(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [activeComment]);

  if (!activeComment) return null;

  return (
    <CommentPopover
      comment={activeComment.comment}
      anchorEl={activeComment.anchorEl}
      onClose={() => setActiveComment(null)}
    />
  );
}
