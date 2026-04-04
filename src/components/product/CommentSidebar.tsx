
import React, { useState } from 'react';
import { X, Send, MessageCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DocumentAnnotation {
  id: string;
  document_id: string;
  user_id: string;
  type: 'highlight' | 'note';
  content: string;
  position: any;
  color?: string;
  created_at: string;
  updated_at: string;
}

interface CommentThread {
  id: string;
  annotation_id?: string;
  document_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  user_profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface CommentSidebarProps {
  documentId: string;
  annotations: DocumentAnnotation[];
  threads: CommentThread[];
  onAddComment: (content: string, highlightId?: string) => Promise<void>;
  onUpdateComment: (commentId: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onClose: () => void;
}

export function CommentSidebar({
  documentId,
  annotations,
  threads,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onClose
}: CommentSidebarProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserName = (thread: CommentThread) => {
    const profile = thread.user_profiles;
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile?.email || 'Anonymous User';
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Comments</h3>
          <span className="text-sm text-gray-500">({threads.length})</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Comments List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {annotations.map((annotation) => {
            const annotationThreads = threads.filter(t => t.annotation_id === annotation.id);
            
            return (
              <div key={annotation.id} className="border border-gray-200 rounded-lg p-3">
                {/* Highlight Info */}
                <div className="mb-2">
                  <div 
                    className="inline-block px-2 py-1 rounded text-xs font-medium text-white mb-2"
                    style={{ backgroundColor: annotation.color || '#FFD700' }}
                  >
                    Highlight
                  </div>
                  <p className="text-sm text-gray-700 italic">"{annotation.content}"</p>
                </div>

                {/* Comments for this highlight */}
                {annotationThreads.map((thread) => (
                  <div key={thread.id} className="border-t border-gray-100 pt-2 mt-2">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="h-3 w-3 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {getUserName(thread)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(thread.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{thread.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {/* General comments (not linked to highlights) */}
          {threads.filter(t => !t.annotation_id).map((thread) => (
            <div key={thread.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {getUserName(thread)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(thread.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{thread.content}</p>
                </div>
              </div>
            </div>
          ))}

          {threads.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No comments yet</p>
              <p className="text-xs">Add the first comment below</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Add Comment Form */}
      <div className="border-t border-gray-200 p-4">
        <div className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="resize-none"
            rows={3}
            disabled={isSubmitting}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
