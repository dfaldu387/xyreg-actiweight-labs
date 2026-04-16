import React from "react";
import {
  X,
  MessageSquare,
  User,
  CheckCircle,
  Copy,
  ChevronDown,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useDocxComments, type ThreadedComment } from "@/hooks/useDocxComments";
import type { DocxComment } from "@/services/docxCommentService";

interface DocxCommentSidebarProps {
  documentId: string;
  onClose?: () => void;
  onCommentClick?: (comment: DocxComment) => void;
  initialVersion?: number;
  fullWidth?: boolean;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function CommentCard({
  comment,
  replies,
  onCommentClick,
}: {
  comment: DocxComment;
  replies: DocxComment[];
  onCommentClick?: (comment: DocxComment) => void;
}) {
  const handleCopyQuoted = () => {
    if (comment.quoted_text) {
      navigator.clipboard.writeText(comment.quoted_text);
      toast.success("Quoted text copied — use Ctrl+F to find in document");
    }
  };

  return (
    <div
      className="border rounded-lg p-3 space-y-2 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => onCommentClick?.(comment)}
    >
      {/* Author and date */}
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium truncate block">
            {comment.author || "Unknown"}
            {comment.author_initials && (
              <span className="text-muted-foreground ml-1">
                ({comment.author_initials})
              </span>
            )}
          </span>
        </div>
        {comment.is_resolved && (
          <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Resolved
          </Badge>
        )}
      </div>

      {comment.comment_date && (
        <p className="text-xs text-muted-foreground">
          {formatDate(comment.comment_date)}
        </p>
      )}

      {/* Quoted text */}
      {comment.quoted_text && (
        <div className="flex items-start gap-1">
          <div className="flex-1 bg-yellow-50 border-l-2 border-yellow-300 px-2 py-1 rounded-r">
            <p className="text-xs text-yellow-800 italic line-clamp-3">
              "{comment.quoted_text}"
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyQuoted();
            }}
            title="Copy quoted text"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Comment content */}
      <p className="text-sm">{comment.content}</p>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="ml-4 space-y-2 border-l-2 border-gray-200 pl-3">
          {replies.map((reply) => (
            <div key={reply.id} className="space-y-1">
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="h-3 w-3 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium">
                  {reply.author || "Unknown"}
                </span>
                {reply.comment_date && (
                  <span className="text-xs text-muted-foreground">
                    {formatDate(reply.comment_date)}
                  </span>
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

export function DocxCommentSidebar({
  documentId,
  onClose,
  onCommentClick,
  initialVersion,
  fullWidth = false,
}: DocxCommentSidebarProps) {
  const {
    threadedComments,
    versions,
    selectedVersion,
    setSelectedVersion,
    isLoading,
  } = useDocxComments(documentId, initialVersion);

  const totalCount = threadedComments.reduce(
    (sum, t) => sum + 1 + t.replies.length,
    0
  );

  return (
    <div className={`${fullWidth ? 'w-full' : 'w-80 border-l'} bg-background flex flex-col h-full`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Document Comments</span>
          {totalCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalCount}
            </Badge>
          )}
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Version selector */}
      {versions.length > 1 && (
        <div className="px-3 py-2 border-b">
          <Select
            value={selectedVersion?.toString() ?? ""}
            onValueChange={(v) => setSelectedVersion(Number(v))}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              {versions.map((v) => (
                <SelectItem key={v} value={v.toString()}>
                  Version {v}
                  {v === versions[0] ? " (latest)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mb-2" />
              <p className="text-sm">Loading comments...</p>
            </div>
          ) : threadedComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No comments found</p>
              {selectedVersion && (
                <p className="text-xs mt-1">Version {selectedVersion}</p>
              )}
            </div>
          ) : (
            threadedComments.map((thread) => (
              <CommentCard
                key={thread.id}
                comment={thread}
                replies={thread.replies}
                onCommentClick={onCommentClick}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
