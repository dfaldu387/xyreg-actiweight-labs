import React, { useEffect, useRef, useState } from "react";
import {
  X, MessageSquare, User, CheckCircle, Copy, ChevronDown, Loader2,
  MessageCircle, Plus, Send, Trash2, RotateCcw, UserPlus, AtSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useDocxComments } from "@/hooks/useDocxComments";
import { useUserComments } from "@/hooks/useUserComments";
import { UserCommentService, type UserComment } from "@/services/userCommentService";
import { useCompanyMembers, type CompanyMember } from "@/hooks/useCompanyMembers";
import { MentionTextarea } from "./MentionTextarea";
import { useAuth } from "@/context/AuthContext";
import type { DocxComment } from "@/services/docxCommentService";

interface DocxCommentSidebarProps {
  documentId: string;
  companyId?: string;
  onClose?: () => void;
  onCommentClick?: (comment: DocxComment) => void;
  initialVersion?: number;
  fullWidth?: boolean;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return dateStr; }
}

function renderContentWithMentions(text: string) {
  // Highlight @Name tokens
  const parts = text.split(/(@[\w][\w .-]{0,40})/g);
  return parts.map((p, i) =>
    p.startsWith("@")
      ? <span key={i} className="text-primary font-medium bg-primary/10 rounded px-0.5">{p}</span>
      : <span key={i}>{p}</span>
  );
}

function ImportedCard({
  comment, replies, onCommentClick,
}: { comment: DocxComment; replies: DocxComment[]; onCommentClick?: (c: DocxComment) => void }) {
  const handleCopyQuoted = () => {
    if (comment.quoted_text) {
      navigator.clipboard.writeText(comment.quoted_text);
      toast.success("Quoted text copied — use Ctrl+F to find in document");
    }
  };
  return (
    <div className="border rounded-lg p-3 space-y-2 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => onCommentClick?.(comment)}>
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium truncate block">
            {comment.author || "Unknown"}
            {comment.author_initials && (
              <span className="text-muted-foreground ml-1">({comment.author_initials})</span>
            )}
          </span>
        </div>
        <Badge variant="outline" className="text-[10px]">Imported</Badge>
        {comment.is_resolved && (
          <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />Resolved
          </Badge>
        )}
      </div>
      {comment.comment_date && (
        <p className="text-xs text-muted-foreground">{formatDate(comment.comment_date)}</p>
      )}
      {comment.quoted_text && (
        <div className="flex items-start gap-1">
          <div className="flex-1 bg-yellow-50 border-l-2 border-yellow-300 px-2 py-1 rounded-r">
            <p className="text-xs text-yellow-800 italic line-clamp-3">"{comment.quoted_text}"</p>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0"
            onClick={(e) => { e.stopPropagation(); handleCopyQuoted(); }} title="Copy quoted text">
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      )}
      <p className="text-sm">{comment.content}</p>
      {replies.length > 0 && (
        <div className="ml-4 space-y-2 border-l-2 border-gray-200 pl-3">
          {replies.map((reply) => (
            <div key={reply.id} className="space-y-1">
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="h-3 w-3 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium">{reply.author || "Unknown"}</span>
                {reply.comment_date && (
                  <span className="text-xs text-muted-foreground">{formatDate(reply.comment_date)}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{reply.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UserCard({
  comment, replies, onResolve, onDelete, onReply, onJump, onAssign, members, currentUserId,
}: {
  comment: UserComment; replies: UserComment[];
  onResolve: (id: string, resolved: boolean) => void;
  onDelete: (id: string) => void;
  onReply: (parentId: string, text: string) => Promise<void>;
  onJump?: (quotedText: string) => void;
  onAssign: (id: string, assigneeId: string | null) => void;
  members: CompanyMember[];
  currentUserId?: string | null;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const assignee = members.find((m) => m.id === comment.assignee_id) ?? null;

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await onReply(comment.id, replyText.trim());
      setReplyText(""); setShowReply(false);
    } finally { setSubmitting(false); }
  };

  return (
    <div
      className={`border rounded-lg p-3 space-y-2 bg-background ${comment.quoted_text ? "cursor-pointer hover:bg-muted/40 transition-colors" : ""}`}
      onClick={() => { if (comment.quoted_text) onJump?.(comment.quoted_text); }}
    >
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-sm font-medium truncate flex-1">{comment.author_name || "Unknown"}</span>
        {assignee && (
          <Badge variant="outline" className="text-[10px]">
            <UserPlus className="h-3 w-3 mr-1" />{assignee.name}
          </Badge>
        )}
        {comment.is_resolved && (
          <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />Resolved
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</p>
      {comment.quoted_text && (
        <div
          className="bg-yellow-50 border-l-2 border-yellow-300 px-2 py-1 rounded-r hover:bg-yellow-100"
          title="Click to jump to this passage in the document"
          onClick={(e) => { e.stopPropagation(); onJump?.(comment.quoted_text!); }}
        >
          <p className="text-xs text-yellow-800 italic line-clamp-3">"{comment.quoted_text}"</p>
        </div>
      )}
      <p className="text-sm whitespace-pre-wrap">{renderContentWithMentions(comment.content)}</p>

      {replies.length > 0 && (
        <div className="ml-4 space-y-2 border-l-2 border-gray-200 pl-3">
          {replies.map((r) => (
            <div key={r.id} className="space-y-1">
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="h-3 w-3 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium">{r.author_name || "Unknown"}</span>
                <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.content}</p>
            </div>
          ))}
        </div>
      )}

      {showReply ? (
        <div className="space-y-2">
          <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply…" rows={2} className="text-sm" />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => { setShowReply(false); setReplyText(""); }}>Cancel</Button>
            <Button size="sm" onClick={submitReply} disabled={!replyText.trim() || submitting}>
              <Send className="h-3 w-3 mr-1" />Reply
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-1 justify-end pt-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowReply(true)}>Reply</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 text-xs">
                <UserPlus className="h-3 w-3 mr-1" />{assignee ? "Reassign" : "Assign"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-60 overflow-auto">
              {currentUserId && comment.assignee_id !== currentUserId && (
                <DropdownMenuItem onClick={() => onAssign(comment.id, currentUserId)}>
                  Assign to me
                </DropdownMenuItem>
              )}
              {assignee && (
                <DropdownMenuItem onClick={() => onAssign(comment.id, null)}>
                  Clear assignee
                </DropdownMenuItem>
              )}
              {members.map((m) => (
                <DropdownMenuItem key={m.id} onClick={() => onAssign(comment.id, m.id)}>
                  {m.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="ghost" className="h-7 text-xs"
            onClick={() => onResolve(comment.id, !comment.is_resolved)}>
            {comment.is_resolved ? (<><RotateCcw className="h-3 w-3 mr-1" />Reopen</>) : (<><CheckCircle className="h-3 w-3 mr-1" />Resolve</>)}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive"
            onClick={() => onDelete(comment.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function DocxCommentSidebar({
  documentId, companyId, onClose, onCommentClick, initialVersion, fullWidth = false,
}: DocxCommentSidebarProps) {
  const {
    threadedComments, versions, selectedVersion, setSelectedVersion, isLoading,
  } = useDocxComments(documentId, initialVersion);
  const { comments: userComments, isLoading: userLoading, refresh: refreshUser } = useUserComments(documentId);
  const { members } = useCompanyMembers(companyId);
  const { user } = useAuth();
  const [filter, setFilter] = useState<"open" | "all" | "resolved" | "assigned" | "mentioning">("open");

  // Composer state
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [pendingAnchor, setPendingAnchor] = useState<{ from: number; to: number } | null>(null);
  const [pendingQuoted, setPendingQuoted] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const composerRef = useRef<{ focus: () => void } | null>(null);
  const [draftMentions, setDraftMentions] = useState<CompanyMember[]>([]);

  // Listen for selection-anchored comment requests dispatched by the editor
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { docId?: string; quotedText?: string; anchor?: { from: number; to: number } } | undefined;
      if (!detail) return;
      // Accept the event regardless of docId mismatch (the parent right-panel
      // is already scoped to the current draft; ids may differ between the
      // editor's draft id and the CI/source id used by the sidebar).
      setPendingQuoted(detail.quotedText ?? null);
      setPendingAnchor(detail.anchor ?? null);
      setComposerOpen(true);
      setTimeout(() => composerRef.current?.focus(), 50);
    };
    window.addEventListener("xyreg:add-document-comment", handler as EventListener);
    return () => window.removeEventListener("xyreg:add-document-comment", handler as EventListener);
  }, [documentId]);

  const allTopLevel = userComments.filter((c) => !c.parent_id);
  const userTopLevel = allTopLevel.filter((c) => {
    if (filter === "all") return true;
    if (filter === "open") return !c.is_resolved;
    if (filter === "resolved") return c.is_resolved;
    if (filter === "assigned") return !!user?.id && (
      c.assignee_id === user.id ||
      (!c.assignee_id && (c.mentioned_user_ids ?? []).includes(user.id))
    );
    if (filter === "mentioning") return user?.id && (c.mentioned_user_ids ?? []).includes(user.id);
    return true;
  });
  const userRepliesByParent = new Map<string, UserComment[]>();
  for (const c of userComments) {
    if (c.parent_id) {
      const arr = userRepliesByParent.get(c.parent_id) ?? [];
      arr.push(c);
      userRepliesByParent.set(c.parent_id, arr);
    }
  }

  const totalImported = threadedComments.reduce((s, t) => s + 1 + t.replies.length, 0);
  const totalCount = totalImported + userComments.length;

  const submitNew = async () => {
    if (!draft.trim()) return;
    if (!companyId) {
      toast.error("Cannot add comment: company context missing");
      return;
    }
    setSubmitting(true);
    try {
      await UserCommentService.create({
        documentId,
        companyId,
        content: draft.trim(),
        quotedText: pendingQuoted,
        anchor: pendingAnchor,
        mentionedUserIds: draftMentions.map((m) => m.id),
        assigneeId: draftMentions[0]?.id ?? null,
      });
      setDraft(""); setPendingAnchor(null); setPendingQuoted(null); setComposerOpen(false); setDraftMentions([]);
      await refreshUser();
      toast.success("Comment added");
    } catch (e: any) {
      toast.error(e?.message || "Failed to add comment");
    } finally { setSubmitting(false); }
  };

  const handleReply = async (parentId: string, text: string) => {
    if (!companyId) { toast.error("Cannot reply: company context missing"); return; }
    try {
      await UserCommentService.create({ documentId, companyId, content: text, parentId });
      await refreshUser();
    } catch (e: any) {
      toast.error(e?.message || "Failed to reply");
    }
  };

  const handleResolve = async (id: string, resolved: boolean) => {
    try { await UserCommentService.resolve(id, resolved); await refreshUser(); }
    catch (e: any) { toast.error(e?.message || "Failed to update"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this comment?")) return;
    try { await UserCommentService.remove(id); await refreshUser(); }
    catch (e: any) { toast.error(e?.message || "Failed to delete"); }
  };

  const handleAssign = async (id: string, assigneeId: string | null) => {
    try {
      await UserCommentService.setAssignee(id, assigneeId);
      await refreshUser();
      toast.success(assigneeId ? "Assigned" : "Assignee cleared");
    } catch (e: any) { toast.error(e?.message || "Failed to assign"); }
  };

  return (
    <div className={`${fullWidth ? "w-full" : "w-80 border-l"} bg-background flex flex-col h-full`}>
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Document Comments</span>
          {totalCount > 0 && <Badge variant="secondary" className="text-xs">{totalCount}</Badge>}
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Composer */}
      <div className="p-3 border-b bg-muted/30">
        {!composerOpen ? (
          <Button variant="outline" size="sm" className="w-full justify-start text-muted-foreground"
            onClick={() => { setComposerOpen(true); setTimeout(() => composerRef.current?.focus(), 50); }}>
            <Plus className="h-3.5 w-3.5 mr-2" />Add a comment…
          </Button>
        ) : (
          <div className="space-y-2">
            {pendingQuoted && (
              <div className="flex items-start gap-1">
                <div className="flex-1 bg-yellow-50 border-l-2 border-yellow-300 px-2 py-1 rounded-r">
                  <p className="text-xs text-yellow-800 italic line-clamp-2">"{pendingQuoted}"</p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0"
                  title="Remove anchor — post as general comment"
                  onClick={() => { setPendingQuoted(null); setPendingAnchor(null); }}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            <MentionTextarea
              ref={composerRef as any}
              value={draft}
              onChange={(v, mentions) => { setDraft(v); setDraftMentions(mentions); }}
              members={members}
              placeholder={pendingQuoted ? "Comment — type @ to mention someone" : "Write a comment — type @ to mention someone"}
              rows={3}
            />
            {draftMentions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {draftMentions.map((m) => (
                  <Badge key={m.id} variant="secondary" className="text-[10px]">
                    <AtSign className="h-2.5 w-2.5 mr-0.5" />{m.name}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost"
                onClick={() => { setComposerOpen(false); setDraft(""); setPendingAnchor(null); setPendingQuoted(null); setDraftMentions([]); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={submitNew} disabled={!draft.trim() || submitting || !companyId}>
                <Send className="h-3 w-3 mr-1" />{submitting ? "Commenting…" : "Comment"}
              </Button>
            </div>
            {!companyId && (
              <p className="text-[11px] text-destructive">Company context unavailable — cannot comment.</p>
            )}
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="px-3 py-2 border-b flex gap-1 flex-wrap">
        {([
          ["open", "Open"], ["all", "All"], ["assigned", "Assigned to me"],
          ["mentioning", "Mentioning me"], ["resolved", "Resolved"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`text-[11px] px-2 py-0.5 rounded-full border ${filter === k ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Version selector */}
      {versions.length > 1 && (
        <div className="px-3 py-2 border-b">
          <Select value={selectedVersion?.toString() ?? ""} onValueChange={(v) => setSelectedVersion(Number(v))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select version" /></SelectTrigger>
            <SelectContent>
              {versions.map((v) => (
                <SelectItem key={v} value={v.toString()}>
                  Version {v}{v === versions[0] ? " (latest)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {(isLoading || userLoading) ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mb-2" />
              <p className="text-sm">Loading comments…</p>
            </div>
          ) : (threadedComments.length === 0 && userTopLevel.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No comments yet</p>
              <p className="text-xs mt-1">Add one above, or select text in the document and click Comment.</p>
            </div>
          ) : (
            <>
              {userTopLevel.map((c) => (
                <UserCard key={c.id} comment={c}
                  replies={userRepliesByParent.get(c.id) ?? []}
                  onResolve={handleResolve} onDelete={handleDelete} onReply={handleReply}
                  onJump={(qt) => onCommentClick?.({ quoted_text: qt } as any)}
                  onAssign={handleAssign}
                  members={members} currentUserId={user?.id ?? null} />
              ))}
              {threadedComments.map((thread) => (
                <ImportedCard key={thread.id} comment={thread} replies={thread.replies} onCommentClick={onCommentClick} />
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
