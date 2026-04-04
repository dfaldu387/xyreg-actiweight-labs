import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useInvestorProfile } from './useInvestorProfile';

export interface ApprovedMonitorAccess {
  id: string;
  share_settings_id: string;
  company_id: string;
  product_id: string | null;
  status: string;
  requested_at: string;
  responded_at: string | null;
  company_investor_share_settings: {
    public_slug: string;
    is_active: boolean;
    updated_at: string;
    show_viability_score?: boolean;
    show_burn_rate?: boolean;
    show_regulatory_status_map?: boolean;
    show_clinical_enrollment?: boolean;
    show_rnpv?: boolean;
  };
  companies: {
    id: string;
    name: string;
    logo_url: string | null;
  };
  products: {
    id: string;
    name: string;
    class: string | null;
    current_lifecycle_phase: string | null;
  } | null;
}

export interface MonitorAccessStatus {
  id: string;
  status: 'pending' | 'approved' | 'denied' | 'revoked';
  requested_at: string;
  responded_at: string | null;
}

export function useInvestorMonitorAccess() {
  const { profile } = useInvestorProfile();
  const queryClient = useQueryClient();

  // Fetch all approved monitor access for the current investor
  const { data: approvedAccess, isLoading } = useQuery({
    queryKey: ['investor-approved-monitors', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('investor_monitor_access')
        .select(`
          id,
          share_settings_id,
          company_id,
          product_id,
          status,
          requested_at,
          responded_at,
          company_investor_share_settings!inner (
            public_slug,
            is_active,
            updated_at,
            show_viability_score,
            show_burn_rate,
            show_regulatory_status_map,
            show_clinical_enrollment,
            show_rnpv
          ),
          companies!inner (
            id,
            name,
            logo_url
          ),
          products (
            id,
            name,
            class,
            current_lifecycle_phase
          )
        `)
        .eq('investor_profile_id', profile.id)
        .eq('status', 'approved')
        .eq('company_investor_share_settings.is_active', true);

      if (error) throw error;
      return data as unknown as ApprovedMonitorAccess[];
    },
    enabled: !!profile?.id,
  });

  // Check access status for a specific share settings ID
  const checkAccessStatus = async (shareSettingsId: string): Promise<MonitorAccessStatus | null> => {
    if (!profile?.id) return null;

    const { data, error } = await supabase
      .from('investor_monitor_access')
      .select('id, status, requested_at, responded_at')
      .eq('investor_profile_id', profile.id)
      .eq('share_settings_id', shareSettingsId)
      .maybeSingle();

    if (error) throw error;
    return data as MonitorAccessStatus | null;
  };

  // Request access mutation
  const requestAccessMutation = useMutation({
    mutationFn: async ({ 
      shareSettingsId, 
      companyId, 
      productId, 
      message 
    }: { 
      shareSettingsId: string; 
      companyId: string; 
      productId?: string;
      message?: string;
    }) => {
      if (!profile?.id) throw new Error('No investor profile');

      const { error } = await supabase
        .from('investor_monitor_access')
        .insert({
          investor_profile_id: profile.id,
          share_settings_id: shareSettingsId,
          company_id: companyId,
          product_id: productId || null,
          request_message: message || null,
          status: 'pending',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investor-approved-monitors'] });
      toast.success('Access request submitted');
    },
    onError: (error: any) => {
      if (error?.code === '23505') {
        toast.error('You have already requested access');
      } else {
        toast.error('Failed to submit request');
      }
    },
  });

  return {
    approvedAccess: approvedAccess || [],
    isLoading,
    checkAccessStatus,
    requestAccess: requestAccessMutation.mutate,
    isRequesting: requestAccessMutation.isPending,
  };
}

// Hook for checking access status on a specific share link
export function useMonitorAccessStatus(shareSettingsId: string | undefined) {
  const { profile } = useInvestorProfile();

  return useQuery({
    queryKey: ['monitor-access-status', shareSettingsId, profile?.id],
    queryFn: async (): Promise<MonitorAccessStatus | null> => {
      if (!profile?.id || !shareSettingsId) return null;

      const { data, error } = await supabase
        .from('investor_monitor_access')
        .select('id, status, requested_at, responded_at')
        .eq('investor_profile_id', profile.id)
        .eq('share_settings_id', shareSettingsId)
        .maybeSingle();

      if (error) throw error;
      return data as MonitorAccessStatus | null;
    },
    enabled: !!profile?.id && !!shareSettingsId,
  });
}
