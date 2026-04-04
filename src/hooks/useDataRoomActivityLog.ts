import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DataRoomActivityLog, ActivityAction } from '@/types/dataRoom';

export function useDataRoomActivityLog(dataRoomId?: string) {
  const queryClient = useQueryClient();

  // Get activity logs with optional filters
  const { data: activityLogs = [], isLoading, error } = useQuery({
    queryKey: ['data-room-activity-log', dataRoomId],
    queryFn: async () => {
      if (!dataRoomId) return [];
      
      const { data, error } = await supabase
        .from('data_room_activity_log')
        .select('*')
        .eq('data_room_id', dataRoomId)
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;
      return data as DataRoomActivityLog[];
    },
    enabled: !!dataRoomId,
  });

  // Log activity
  const logActivityMutation = useMutation({
    mutationFn: async ({ 
      dataRoomId: drId, 
      investorEmail, 
      action, 
      metadata 
    }: { 
      dataRoomId: string; 
      investorEmail: string; 
      action: ActivityAction; 
      metadata?: {
        contentId?: string;
        contentTitle?: string;
        ipAddress?: string;
        userAgent?: string;
        additionalData?: Record<string, any>;
      }
    }) => {
      const { data, error } = await supabase
        .from('data_room_activity_log')
        .insert({
          data_room_id: drId,
          investor_email: investorEmail,
          action,
          content_id: metadata?.contentId,
          content_title: metadata?.contentTitle,
          ip_address: metadata?.ipAddress,
          user_agent: metadata?.userAgent,
          metadata: metadata?.additionalData || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data as DataRoomActivityLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-room-activity-log'] });
    },
  });

  // Get filtered logs
  const getFilteredLogs = (filters: {
    investorEmail?: string;
    action?: ActivityAction;
    startDate?: Date;
    endDate?: Date;
  }) => {
    let filtered = activityLogs;

    if (filters.investorEmail) {
      filtered = filtered.filter(log => 
        log.investor_email.toLowerCase().includes(filters.investorEmail!.toLowerCase())
      );
    }

    if (filters.action) {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    if (filters.startDate) {
      filtered = filtered.filter(log => 
        new Date(log.timestamp) >= filters.startDate!
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(log => 
        new Date(log.timestamp) <= filters.endDate!
      );
    }

    return filtered;
  };

  return {
    activityLogs,
    isLoading,
    error,
    logActivity: logActivityMutation.mutate,
    getFilteredLogs,
    isLogging: logActivityMutation.isPending,
  };
}
