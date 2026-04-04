import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { toast } from 'sonner';

export interface CommunicationMessage {
  id: string;
  from: string;
  subject: string;
  preview: string;
  timestamp: string;
  isUnread: boolean;
  priority: 'high' | 'medium' | 'low';
  type: 'notification' | 'message' | 'alert';
  companyId?: string;
  productId?: string;
}

interface CommunicationsData {
  messages: CommunicationMessage[];
  unreadCount: number;
  highPriorityCount: number;
  activeThreadsCount: number;
}

interface CommunicationsOptions {
  scope: 'multi-company' | 'company' | 'product' | 'reviewer';
  companyId?: string;
  productId?: string;
}

export function useCommunications(options: CommunicationsOptions) {
  const { user } = useAuth();
  const { companyRoles } = useCompanyRole();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['communications', user?.id, options.scope, options.companyId, options.productId],
    queryFn: async (): Promise<CommunicationsData> => {
      if (!user) {
        throw new Error('No authenticated user');
      }

      const userCompanyIds = companyRoles.map(role => role.companyId).filter(Boolean);
      
      let messagesQuery = supabase
        .from('activities')
        .select(`
          id,
          name,
          type,
          status,
          created_at,
          updated_at,
          due_date,
          products!inner(
            id,
            name,
            company_id,
            companies!inner(
              id,
              name
            )
          )
        `)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (options.scope === 'product' && options.productId) {
        messagesQuery = messagesQuery.eq('products.id', options.productId);
      } else if (options.scope === 'company' && options.companyId) {
        messagesQuery = messagesQuery.eq('products.company_id', options.companyId);
      } else if (options.scope === 'multi-company' && userCompanyIds.length > 0) {
        messagesQuery = messagesQuery.in('products.company_id', userCompanyIds);
      }

      const { data: activities, error: activitiesError } = await messagesQuery;

      if (activitiesError) {
        console.error('Error fetching communications:', activitiesError);
        throw activitiesError;
      }

      let documentsQuery = supabase
        .from('documents')
        .select(`
          id,
          name,
          status,
          updated_at,
          due_date,
          products!inner(
            id,
            name,
            company_id,
            companies!inner(
              id,
              name
            )
          )
        `)
        .order('updated_at', { ascending: false })
        .limit(25);

      if (options.scope === 'product' && options.productId) {
        documentsQuery = documentsQuery.eq('products.id', options.productId);
      } else if (options.scope === 'company' && options.companyId) {
        documentsQuery = documentsQuery.eq('products.company_id', options.companyId);
      } else if (options.scope === 'multi-company' && userCompanyIds.length > 0) {
        documentsQuery = documentsQuery.in('products.company_id', userCompanyIds);
      }

      const { data: documents } = await documentsQuery;

      const messages: CommunicationMessage[] = [];

      activities?.forEach((activity: any) => {
        const isOverdue = activity.due_date && new Date(activity.due_date) < new Date();
        const isPending = activity.status === 'planned' || activity.status === 'in_progress';
        const isUrgent = isOverdue || (isPending && activity.due_date && new Date(activity.due_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        const isStale = activity.status === 'planned' && new Date(activity.updated_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        let priority: 'high' | 'medium' | 'low' = 'medium';
        if (isOverdue) {
          priority = 'high';
        } else if (isUrgent || isStale) {
          priority = 'high';
        } else if (activity.status === 'completed') {
          priority = 'low';
        }
        
        messages.push({
          id: `activity-${activity.id}`,
          from: `${activity.products?.companies?.name} Team`,
          subject: `${activity.type}: ${activity.name}`,
          preview: isOverdue
            ? `${activity.name} is overdue`
            : isStale
            ? `${activity.name} - Status: ${activity.status} (needs attention)`
            : `${activity.name} - Status: ${activity.status}`,
          timestamp: formatTimeAgo(new Date(activity.updated_at)),
          isUnread: isOverdue || isStale || isPending,
          priority: priority,
          type: (isOverdue || isStale) ? 'alert' : 'notification',
          companyId: activity.products?.company_id,
          productId: activity.products?.id
        });
      });

      documents?.forEach((doc: any) => {
        const isOverdue = doc.due_date && new Date(doc.due_date) < new Date();
        const needsReview = doc.status === 'Pending' || doc.status === 'In Review';
        
        messages.push({
          id: `doc-${doc.id}`,
          from: 'Document System',
          subject: `Document Update: ${doc.name}`,
          preview: isOverdue 
            ? `Document "${doc.name}" is past due date`
            : `Document status updated to ${doc.status}`,
          timestamp: formatTimeAgo(new Date(doc.updated_at)),
          isUnread: isOverdue || needsReview,
          priority: isOverdue ? 'high' : 'medium',
          type: isOverdue ? 'alert' : 'notification',
          companyId: doc.products?.company_id,
          productId: doc.products?.id
        });
      });

      messages.sort((a, b) => {
        const timeA = parseTimeAgo(a.timestamp);
        const timeB = parseTimeAgo(b.timestamp);
        return timeB - timeA;
      });

      const unreadCount = messages.filter(m => m.isUnread).length;
      const highPriorityCount = messages.filter(m => m.priority === 'high').length;
      
      const uniqueThreads = new Set(
        messages.map(m => `${m.companyId}-${m.productId}`)
      ).size;

      return {
        messages: messages.slice(0, 20),
        unreadCount,
        highPriorityCount,
        activeThreadsCount: Math.min(uniqueThreads, 15)
      };
    },
    enabled: !!user,
    staleTime: 1 * 60 * 1000,
    gcTime: 3 * 60 * 1000
  });

  const markAsRead = async (messageId: string) => {
    console.log('Marking message as read:', messageId);
    refetch();
  };

  const sendMessage = async (recipientId: string, message: string) => {
    if (!user) throw new Error('Not authenticated');

    const companyId = options.companyId;

    if (!companyId) {
      toast.error('No company context available');
      throw new Error('No explicit company context');
    }

    const { data: activityData, error: insertError } = await supabase
      .from('activities')
      .insert({
        company_id: companyId,
        name: `Message: ${message.substring(0, 80)}`,
        type: 'other',
        status: 'completed',
        assignee_ids: JSON.stringify([recipientId]),
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error sending message:', insertError);
      toast.error('Failed to send message');
      throw insertError;
    }

    // Create targeted notification for recipient
    const { NotificationService } = await import('@/services/notificationService');
    const notificationService = new NotificationService();
    const { error: notifError } = await notificationService.addNotification({
      title: `New Communication: ${message.substring(0, 60)}`,
      message: message,
      type: 'communication',
      company_id: companyId,
      user_id: recipientId,
      data: {
        activity_id: activityData?.id,
        communication_title: message.substring(0, 80),
        sender_id: user.id,
      },
    });

    if (notifError) {
      console.error('Failed to create notification for quick message:', notifError);
    }

    toast.success('Message sent successfully');
    refetch();
  };

  return {
    data: data || {
      messages: [],
      unreadCount: 0,
      highPriorityCount: 0,
      activeThreadsCount: 0
    },
    isLoading,
    error,
    refetch,
    markAsRead,
    sendMessage
  };
}

// Helper functions
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else {
    return `${diffDays} days ago`;
  }
}

function parseTimeAgo(timeStr: string): number {
  const now = Date.now();
  const match = timeStr.match(/(\d+)\s+(minute|hour|day)s?\s+ago/);
  
  if (!match) return now;
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 'minute':
      return now - (value * 60 * 1000);
    case 'hour':
      return now - (value * 60 * 60 * 1000);
    case 'day':
      return now - (value * 24 * 60 * 60 * 1000);
    default:
      return now;
  }
}