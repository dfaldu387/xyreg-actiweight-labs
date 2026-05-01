import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageTimeline } from "@/components/communications/MessageTimeline";
import { ThreadDocumentPicker } from "@/components/communications/ThreadDocumentPicker";
import { CommunicationThread } from '@/types/communications';
import { useTranslation } from '@/hooks/useTranslation';
import { useThreadMessages, useCommunicationThreads, useTypingIndicator } from '@/hooks/useCommunicationThreads';
import { getParticipantName, getParticipantInitials } from '@/utils/participantUtils';
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, X, Link as LinkIcon, CheckCircle2, RotateCcw, UserPlus } from 'lucide-react';
import { InviteParticipantDialog } from './InviteParticipantDialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ThreadDetailSheetProps {
  thread: CommunicationThread | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ThreadDetailSheet({ thread, open, onOpenChange }: ThreadDetailSheetProps) {
  const { lang } = useTranslation();
  const queryClient = useQueryClient();
  const { data: messages = [], isLoading: messagesLoading } = useThreadMessages(open ? thread?.id ?? null : null);
  const { markThreadRead, sendMessage } = useCommunicationThreads();
  const { typingUsers, sendTyping } = useTypingIndicator(open ? thread?.id ?? null : null);
  const [markedRead, setMarkedRead] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  // Fetch linked documents
  const { data: linkedDocs = [] } = useQuery({
    queryKey: ['thread-doc-links', thread?.id],
    queryFn: async () => {
      const { data: links, error } = await (supabase as any)
        .from('thread_document_links')
        .select('id, document_id')
        .eq('thread_id', thread!.id);
      if (error) throw error;
      if (!links || links.length === 0) return [];

      const docIds = links.map((l: any) => l.document_id);
      const { data: docs } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name')
        .in('id', docIds);

      return (docs || []).map(doc => ({
        ...doc,
        linkId: links.find((l: any) => l.document_id === doc.id)?.id,
      }));
    },
    enabled: open && !!thread?.id,
  });

  const unlinkDocument = async (linkId: string) => {
    const { error } = await (supabase as any)
      .from('thread_document_links')
      .delete()
      .eq('id', linkId);
    if (error) {
      toast.error('Failed to unlink document');
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['thread-doc-links', thread?.id] });
  };

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

  const isClosed = thread.status === 'Closed';

  const handleClose = async () => {
    const { error } = await supabase
      .from('communication_threads')
      .update({ status: 'Closed' })
      .eq('id', thread.id);
    if (error) {
      toast.error('Failed to close thread');
      return;
    }
    toast.success('Thread closed');
    queryClient.invalidateQueries({ queryKey: ['communication-threads'] });
    queryClient.invalidateQueries({ queryKey: ['communication-threads-stats'] });
    onOpenChange(false);
  };

  const handleReopen = async () => {
    const { error } = await supabase
      .from('communication_threads')
      .update({ status: 'Active' })
      .eq('id', thread.id);
    if (error) {
      toast.error('Failed to reopen thread');
      return;
    }
    toast.success('Thread reopened');
    queryClient.invalidateQueries({ queryKey: ['communication-threads'] });
    queryClient.invalidateQueries({ queryKey: ['communication-threads-stats'] });
    onOpenChange(false);
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
            {!isClosed && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleClose}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Close thread
              </Button>
            )}
            {isClosed && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleReopen}>
                <RotateCcw className="h-3.5 w-3.5" />
                Reopen
              </Button>
            )}
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
            {!isClosed && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setInviteOpen(true)}>
                <UserPlus className="h-3.5 w-3.5" />
                Invite
              </Button>
            )}
          </div>
          {/* Linked Documents */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setPickerOpen(true)}
            >
              <LinkIcon className="h-3 w-3" />
              Link Document
            </Button>
            {linkedDocs.map((doc: any) => (
              <Badge key={doc.id} variant="secondary" className="gap-1 pr-1">
                <FileText className="h-3 w-3" />
                <span className="max-w-[160px] truncate">{doc.name}</span>
                <button
                  onClick={() => unlinkDocument(doc.linkId)}
                  className="ml-1 rounded-full hover:bg-muted p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
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
              disabled={isClosed}
            />
          )}
        </div>
      </SheetContent>

      {thread.company_id && (
        <ThreadDocumentPicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          threadId={thread.id}
          companyId={thread.company_id}
        />
      )}
      {thread.company_id && (
        <InviteParticipantDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          threadId={thread.id}
          companyId={thread.company_id}
          existingUserIds={participants.map(p => p.user_id).filter(Boolean) as string[]}
        />
      )}
    </Sheet>
  );
}
