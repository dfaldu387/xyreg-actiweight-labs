
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { MessageTimeline } from "@/components/communications/MessageTimeline";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { useTranslation } from '@/hooks/useTranslation';
import { useCommunicationThreads, useThreadMessages, useTypingIndicator } from '@/hooks/useCommunicationThreads';
import { useCompanyId } from '@/hooks/useCompanyId';
import { getParticipantName, getParticipantInitials, getParticipantEmail, getParticipantOrg } from '@/utils/participantUtils';
import { Skeleton } from "@/components/ui/skeleton";

export default function CommunicationThreadPage() {
  const { lang } = useTranslation();
  const { threadId, companyName } = useParams<{ threadId: string; companyName?: string }>();
  const { activeCompanyRole, companyRoles } = useCompanyRole();
  const companyId = useCompanyId();
  
  const effectiveCompanyName = companyName 
    ? decodeURIComponent(companyName)
    : activeCompanyRole?.companyName 
    || (companyRoles.length > 0 ? companyRoles[0].companyName : null);
  
  const communicationsBasePath = effectiveCompanyName 
    ? `/app/company/${encodeURIComponent(effectiveCompanyName)}/communications`
    : '/app/communications';

  const { threads, sendMessage } = useCommunicationThreads({ companyId: companyId || undefined });
  const thread = threads.find(t => t.id === threadId);
  const { data: messages = [], isLoading: messagesLoading } = useThreadMessages(threadId || null);
  const { typingUsers, sendTyping } = useTypingIndicator(threadId || null);

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (threadId) {
      await sendMessage.mutateAsync({ threadId, content, files });
    }
  };

  if (!thread) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" className="gap-2">
            <Link to={communicationsBasePath}>
              <ArrowLeft className="h-4 w-4" />
              {lang('communications.threadPage.back')}
            </Link>
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <MessageCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {lang('communications.threadPage.notFound.title')}
          </h3>
          <p className="text-muted-foreground max-w-md">
            {lang('communications.threadPage.notFound.description')}
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200';
      case 'Awaiting Response': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const participants = thread.participants || [];

  return (
    <div className="flex-1 space-y-6 p-4 pt-6">
      {/* Header */}
      <div className="space-y-4">
        <Button asChild variant="ghost" className="gap-2">
          <Link to={communicationsBasePath}>
            <ArrowLeft className="h-4 w-4" />
            {lang('communications.threadPage.back')}
          </Link>
        </Button>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">{thread.title}</h1>
          <div className="flex items-center gap-4 mt-2">
            {thread.related_entity_name && (
              <p className="text-muted-foreground">
                {lang('communications.threadPage.relatedTo')} {thread.related_entity_name}
              </p>
            )}
            <Badge variant="outline" className={getStatusColor(thread.status || 'Active')}>
              {thread.status || 'Active'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Participants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{lang('communications.threadPage.participants.title')}</CardTitle>
          <CardDescription>
            {participants.length === 1
              ? lang('communications.threadPage.participants.countSingular').replace('{{count}}', '1')
              : lang('communications.threadPage.participants.count').replace('{{count}}', String(participants.length))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-muted">
                    {getParticipantInitials(participant)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{getParticipantName(participant)}</p>
                    <Badge variant="outline" className="text-xs">
                      {participant.is_internal ? lang('communications.threadPage.internal') : lang('communications.threadPage.external')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {getParticipantEmail(participant)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getParticipantOrg(participant)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Message Timeline and Input */}
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
  );
}
