import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, isToday, isYesterday } from 'date-fns';
import { CommunicationThread } from '@/types/communications';
import { Users } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/context/AuthContext';
import { getParticipantInitials } from '@/utils/participantUtils';

interface ThreadCardClickableProps {
  thread: CommunicationThread;
  onClick: (thread: CommunicationThread) => void;
}

export function ThreadCardClickable({ thread, onClick }: ThreadCardClickableProps) {
  const { lang } = useTranslation();
  const { user } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200';
      case 'Awaiting Response': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatLastActivity = (timestamp: string | null) => {
    if (!timestamp) return lang('communications.threadCard.unknown');
    try {
      // Supabase may return timestamps without timezone suffix — append Z to ensure UTC parsing
      const raw = timestamp.endsWith('Z') || timestamp.includes('+') || /\d{2}:\d{2}$/.test(timestamp.slice(-6))
        ? timestamp
        : timestamp + 'Z';
      const date = new Date(raw);
      if (isToday(date)) {
        return format(date, 'h:mm a');
      }
      if (isYesterday(date)) {
        return `Yesterday ${format(date, 'h:mm a')}`;
      }
      return format(date, 'MMM d, yyyy');
    } catch {
      return lang('communications.threadCard.unknown');
    }
  };

  const participants = thread.participants || [];
  const unreadCount = thread.my_unread_count || 0;

  return (
    <div onClick={() => onClick(thread)} className="cursor-pointer">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm leading-tight mb-1 truncate">{thread.title}</h3>
              {thread.latest_message && (
                <p className="text-xs text-muted-foreground truncate">
                  <span className="font-medium">
                    {thread.latest_message.sender_user_id === user?.id
                      ? 'You'
                      : thread.latest_message.sender_profile
                        ? [thread.latest_message.sender_profile.first_name, thread.latest_message.sender_profile.last_name].filter(Boolean).join(' ') || thread.latest_message.sender_profile.email
                        : 'Unknown'}
                    :
                  </span>{' '}
                  {thread.latest_message.content || 'Attachment'}
                </p>
              )}
              {!thread.latest_message && thread.related_entity_name && (
                <p className="text-xs text-muted-foreground">
                  {lang('communications.threadCard.relatedTo')} {thread.related_entity_name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" className={`text-xs ${getStatusColor(thread.status || 'Active')}`}>
                {thread.status || 'Active'}
              </Badge>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">{unreadCount}</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2 gap-2">
                {participants.slice(0, 3).map((p) => (
                  <Avatar key={p.id} className="h-6 w-6 border-2 border-background">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs bg-muted">{getParticipantInitials(p)}</AvatarFallback>
                  </Avatar>
                ))}
                {participants.length > 3 && (
                  <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">+{participants.length - 3}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{participants.length}</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">{formatLastActivity(thread.last_activity_at)}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
