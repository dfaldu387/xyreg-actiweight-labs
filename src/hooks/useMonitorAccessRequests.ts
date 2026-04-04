import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MonitorAccessRequest {
  id: string;
  investor_profile_id: string;
  share_settings_id: string;
  company_id: string;
  product_id: string | null;
  status: 'pending' | 'approved' | 'denied' | 'revoked';
  request_message: string | null;
  founder_notes: string | null;
  requested_at: string;
  responded_at: string | null;
  responded_by: string | null;
  expires_at: string | null;
  investor_profiles: {
    id: string;
    full_name: string;
    email: string;
    company_name: string | null;
    linkedin_url: string;
    investment_focus: string[];
    typical_check_size: string | null;
    verification_tier: string;
  };
}

export function useMonitorAccessRequests(companyId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['monitor-access-requests', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('investor_monitor_access')
        .select(`
          *,
          investor_profiles (
            id,
            full_name,
            email,
            company_name,
            linkedin_url,
            investment_focus,
            typical_check_size,
            verification_tier
          )
        `)
        .eq('company_id', companyId)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data as MonitorAccessRequest[];
    },
    enabled: !!companyId,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('investor_monitor_access')
        .update({
          status: 'approved',
          responded_at: new Date().toISOString(),
          responded_by: user?.id,
          founder_notes: notes || null,
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitor-access-requests', companyId] });
      toast.success('Access approved successfully');
    },
    onError: () => {
      toast.error('Failed to approve access');
    },
  });

  const denyMutation = useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('investor_monitor_access')
        .update({
          status: 'denied',
          responded_at: new Date().toISOString(),
          responded_by: user?.id,
          founder_notes: notes || null,
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitor-access-requests', companyId] });
      toast.success('Access denied');
    },
    onError: () => {
      toast.error('Failed to deny access');
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('investor_monitor_access')
        .update({
          status: 'revoked',
          responded_at: new Date().toISOString(),
          responded_by: user?.id,
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitor-access-requests', companyId] });
      toast.success('Access revoked');
    },
    onError: () => {
      toast.error('Failed to revoke access');
    },
  });

  const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
  const approvedRequests = requests?.filter(r => r.status === 'approved') || [];
  const deniedRequests = requests?.filter(r => r.status === 'denied' || r.status === 'revoked') || [];

  return {
    requests,
    pendingRequests,
    approvedRequests,
    deniedRequests,
    isLoading,
    approve: approveMutation.mutate,
    deny: denyMutation.mutate,
    revoke: revokeMutation.mutate,
    isApproving: approveMutation.isPending,
    isDenying: denyMutation.isPending,
    isRevoking: revokeMutation.isPending,
  };
}
