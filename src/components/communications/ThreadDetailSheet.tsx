import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageTimeline } from "@/components/communications/MessageTimeline";
import { CommunicationThread } from '@/types/communications';
import { useTranslation } from '@/hooks/useTranslation';
import { useThreadMessages, useCommunicationThreads, useTypingIndicator } from '@/hooks/useCommunicationThreads';
import { getParticipantName, getParticipantInitials } from '@/utils/participantUtils';
import { Skeleton } from "@/components/ui/skeleton";

interface ThreadDetailSheetProps {
  thread: CommunicationThread | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ThreadDetailSheet({ thread, open, onOpenChange }: ThreadDetailSheetProps) {
  const { lang } = useTranslation();
  const { data: messages = [], isLoading: messagesLoading } = useThreadMessages(open ? thread?.id ?? null : null);
  const { markThreadRead, sendMessage } = useCommunicationThreads();
  const { typingUsers, sendTyping } = useTypingIndicator(open ? thread?.id ?? null : null);
  const [markedRead, setMarkedRead] = useState(false);

  // Mark thread as read when opened or when new unread messages arrive while open
  useEffect(() => {
    if (open && thread?.id && (thread.my_unread_count || 0) > 0) {
      markThreadRead.mutate(thread.id, {
        onSuccess: () => setMarkedRead(true),
      });
    }
  }, [open, thread?.id, thread?.my_unread_count]);

  // Reset when thread changes or sheet closes
  useEffect(() => {
    if (!open) setMarkedRead(false);
  }, [open, thread?.id]);

  if (!thread) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200';
      case 'Awaiting Response': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const participants = thread.participants || [];
  const unreadCount = markedRead ? 0 : (thread.my_unread_count || 0);

  const handleSendMessage = async (content: string, files?: File[]) => {
    await sendMessage.mutateAsync({ threadId: thread.id, content, files });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl flex flex-col overflow-hidden">
        <SheetHeader className="space-y-3 pb-4 border-b">
          <SheetTitle className="text-xl">{thread.title}</SheetTitle>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className={getStatusColor(thread.status || 'Active')}>
              {thread.status || 'Active'}
            </Badge>
            {thread.related_entity_name && (
              <span className="text-sm text-muted-foreground">
                {lang('communications.threadPage.relatedTo')} {thread.related_entity_name}
              </span>
            )}
            {unreadCount > 0 && (
              <Badge variant="destructive">
                {lang('communications.threadPage.unread').replace('{{count}}', String(unreadCount))}
              </Badge>
            )}
          </div>
          {/* Participants row */}
          <div className="flex items-center gap-2 pt-1">
            <div className="flex -space-x-2">
              {participants.slice(0, 4).map((p) => (
                <Avatar key={p.id} className="h-7 w-7 border-2 border-background">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-xs bg-muted">
                    {getParticipantInitials(p)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {participants.length === 1
                ? lang('communications.threadPage.participants.countSingular').replace('{{count}}', '1')
                : lang('communications.threadPage.participants.count').replace('{{count}}', String(participants.length))}
            </span>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden pt-4">
          {messagesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : (
            <MessageTimeline
              messages={messages}
              threadId={thread.id}
              onSendMessage={handleSendMessage}
              typingUsers={typingUsers}
              onTyping={sendTyping}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
