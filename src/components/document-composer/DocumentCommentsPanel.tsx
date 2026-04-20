import React, { useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface DocumentCommentsPanelProps {
  documentId?: string | null;
  className?: string;
}

interface LocalComment {
  id: string;
  author: string;
  initials: string;
  text: string;
  createdAt: string;
  sectionAnchor?: string;
}

export function DocumentCommentsPanel({ documentId, className }: DocumentCommentsPanelProps) {
  const [comments, setComments] = useState<LocalComment[]>([]);
  const [draft, setDraft] = useState('');

  const handleSubmit = () => {
    const text = draft.trim();
    if (!text) return;
    setComments((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        author: 'You',
        initials: 'YO',
        text,
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {comments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="w-8 h-8 mx-auto mb-3" style={{ color: '#BA7517', opacity: 0.45 }} />
            <p className="text-sm font-medium text-foreground">No comments yet</p>
            <p className="text-xs mt-1">Select text in the document or post a general comment below.</p>
          </div>
        )}

        {comments.map((c) => (
          <div key={c.id} className="rounded-md border p-2.5" style={{ borderColor: '#F2D8B4', background: '#FFF8ED' }}>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white"
                style={{ background: '#BA7517' }}
              >
                {c.initials}
              </div>
              <span className="text-xs font-medium text-foreground">{c.author}</span>
              <span className="text-[10px] text-muted-foreground ml-auto">
                {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-snug">{c.text}</p>
          </div>
        ))}
      </div>

      <div className="border-t p-3">
        <div className="flex gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment..."
            className="min-h-[40px] max-h-[120px] resize-none text-sm"
            rows={1}
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!draft.trim()}
            className="h-10 w-10 p-0 shrink-0 text-white"
            style={{ background: '#BA7517' }}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
