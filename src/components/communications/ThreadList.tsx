
import React from 'react';
import { CommunicationThread } from '@/types/communications';
import { ThreadCard } from './ThreadCard';
import { MessageCircle, Search, Users, Clock } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface ThreadListProps {
  threads: CommunicationThread[];
  isLoading?: boolean;
  activeFilter?: string;
  searchQuery?: string;
}

export function ThreadList({ threads, isLoading = false, activeFilter = 'all', searchQuery = '' }: ThreadListProps) {
  const { lang } = useTranslation();

  const getEmptyStateContent = () => {
    if (searchQuery.trim()) {
      return {
        icon: <Search className="h-8 w-8 text-muted-foreground" />,
        title: lang('communications.emptyState.noResults.title'),
        description: lang('communications.emptyState.noResults.description').replace('{{query}}', searchQuery)
      };
    }

    switch (activeFilter) {
      case 'active':
        return {
          icon: <Users className="h-8 w-8 text-muted-foreground" />,
          title: lang('communications.emptyState.noActive.title'),
          description: lang('communications.emptyState.noActive.description')
        };
      case 'awaiting-response':
        return {
          icon: <Clock className="h-8 w-8 text-muted-foreground" />,
          title: lang('communications.emptyState.noAwaitingResponse.title'),
          description: lang('communications.emptyState.noAwaitingResponse.description')
        };
      case 'closed':
        return {
          icon: <MessageCircle className="h-8 w-8 text-muted-foreground" />,
          title: lang('communications.emptyState.noClosed.title'),
          description: lang('communications.emptyState.noClosed.description')
        };
      default:
        return {
          icon: <MessageCircle className="h-8 w-8 text-muted-foreground" />,
          title: lang('communications.emptyState.noThreads.title'),
          description: lang('communications.emptyState.noThreads.description')
        };
    }
  };

  if (threads.length === 0) {
    const emptyState = getEmptyStateContent();
    
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          {emptyState.icon}
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          {emptyState.title}
        </h3>
        <p className="text-muted-foreground max-w-md">
          {emptyState.description}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <ThreadCard key={thread.id} thread={thread} />
      ))}
    </div>
  );
}
