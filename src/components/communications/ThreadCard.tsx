
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { CommunicationThread } from '@/types/communications';
import { Users } from 'lucide-react';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useTranslation } from '@/hooks/useTranslation';
import { getParticipantName, getParticipantInitials } from '@/utils/participantUtils';

interface ThreadCardProps {
  thread: CommunicationThread;
}

export function ThreadCard({ thread }: ThreadCardProps) {
  const { lang } = useTranslation();
  const { companyName } = useParams<{ companyName?: string }>();
  const { activeCompanyRole, companyRoles } = useCompanyRole();
  
  const effectiveCompanyName = companyName 
    ? decodeURIComponent(companyName)
    : activeCompanyRole?.companyName 
    || (companyRoles.length > 0 ? companyRoles[0].companyName : null);
  
  const threadRoute = effectiveCompanyName 
    ? `/app/company/${encodeURIComponent(effectiveCompanyName)}/communications/${thread.id}`
    : `/app/communications/${thread.id}`;

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
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return lang('communications.threadCard.unknown');
    }
  };

  const participants = thread.participants || [];
  const unreadCount = thread.my_unread_count || 0;

  return (
    <Link to={threadRoute} className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm leading-tight mb-1 truncate">
                {thread.title}
              </h3>
              {thread.related_entity_name && (
                <p className="text-xs text-muted-foreground">
                  {lang('communications.threadCard.relatedTo')} {thread.related_entity_name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge 
                variant="outline" 
                className={`text-xs ${getStatusColor(thread.status || 'Active')}`}
              >
                {thread.status || 'Active'}
              </Badge>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2 gap-2">
                {participants.slice(0, 3).map((participant) => (
                  <Avatar key={participant.id} className="h-6 w-6 border-2 border-background">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs bg-muted">
                      {getParticipantInitials(participant)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {participants.length > 3 && (
                  <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">
                      +{participants.length - 3}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{participants.length}</span>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {formatLastActivity(thread.last_activity_at)}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
