
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Calendar, User } from "lucide-react";
import type { CommentThread } from "@/types/comments";

interface CommentThreadDialogProps {
  thread: CommentThread;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string | null;
}

export function CommentThreadDialog({
  thread,
  open,
  onOpenChange,
  documentId,
}: CommentThreadDialogProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get the first comment as the main thread content
  const mainComment = thread.comments?.[0];
  const replies = thread.comments?.slice(1) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comment Thread
          </DialogTitle>
          <DialogDescription>
            View and manage the comment thread discussion.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Thread Header */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">
                {mainComment?.user_profiles?.first_name || 'Unknown'} {mainComment?.user_profiles?.last_name || ''}
              </span>
              <Badge className={getStatusColor(mainComment?.comment_status || 'open')}>
                {mainComment?.comment_status || 'open'}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              {formatDate(thread.created_at)}
            </div>
          </div>

          {/* Original Comment */}
          {mainComment && (
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Original Comment</h4>
              <p className="text-gray-700">{mainComment.content}</p>
            </div>
          )}

          {/* Replies */}
          {replies.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Replies ({replies.length})</h4>
              {replies.map((reply) => (
                <div key={reply.id} className="ml-4 p-3 border-l-2 border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {reply.user_profiles?.first_name || 'Unknown'} {reply.user_profiles?.last_name || ''}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(reply.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{reply.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {mainComment?.comment_status !== "resolved" && (
              <Button>
                Mark as Resolved
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
