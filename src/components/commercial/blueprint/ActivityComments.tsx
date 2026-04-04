import { useState } from 'react';
import { BlueprintComment } from '@/types/blueprint';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/context/LanguageContext';

interface ActivityCommentsProps {
  activityId: number;
  comments: BlueprintComment[];
  onAddComment: (activityId: number, content: string) => void;
  onDeleteComment: (activityId: number, commentId: string) => void;
  currentUserName: string;
  disabled?: boolean;
}

export function ActivityComments({
  activityId,
  comments,
  onAddComment,
  onDeleteComment,
  currentUserName,
  disabled = false
}: ActivityCommentsProps) {
  const { lang } = useTranslation();
  const { language } = useLanguage();
  const [newComment, setNewComment] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Get date-fns locale based on current language
  const dateLocale = language === 'de' ? { locale: de } : undefined;

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error(lang('commercial.comments.commentCannotBeEmpty'));
      return;
    }

    onAddComment(activityId, newComment.trim());
    setNewComment('');
    toast.success(lang('commercial.comments.commentAdded'));
  };

  const handleDeleteComment = (commentId: string) => {
    onDeleteComment(activityId, commentId);
    toast.success(lang('commercial.comments.commentDeleted'));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sortedComments = [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-3">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors w-full"
      >
        <MessageSquare className="h-4 w-4" />
        <span>{lang('commercial.comments.title')}</span>
        {comments.length > 0 && (
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-semibold">
            {comments.length}
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="space-y-4 pl-6 border-l-2 border-border">
          {/* Add Comment */}
          {!disabled && (
            <div className="space-y-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={lang('commercial.comments.addComment')}
                className="min-h-[80px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {lang('commercial.comments.submitHint')}
                </span>
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  <Send className="h-3 w-3 mr-1" />
                  {lang('commercial.comments.submitButton')}
                </Button>
              </div>
            </div>
          )}

          {/* Comments List */}
          {sortedComments.length > 0 ? (
            <div className="space-y-3">
              {sortedComments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-muted/30 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(comment.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium text-sm">{comment.userName}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, ...dateLocale })}
                          </span>
                        </div>
                        <p className="text-sm mt-1 whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                    {comment.userName === currentUserName && !disabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="h-8 w-8 p-0 flex-shrink-0"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              {disabled ? lang('commercial.comments.noCommentsYet') : lang('commercial.comments.beFirstToComment')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
