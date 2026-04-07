import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdoptedRelease {
  id: string;
  release_id: string;
  version: string;
  release_date: string;
  adopted_at: string;
  status: string;
}

export function useCompanyAdoptedRelease(companyId: string) {
  return useQuery({
    queryKey: ['company-adopted-release', companyId],
    queryFn: async (): Promise<AdoptedRelease | null> => {
      if (!companyId) return null;

      const { data, error } = await (supabase as any)
        .from('company_release_adoptions')
        .select(`
          id,
          release_id,
          adopted_at,
          status,
          xyreg_releases (version, release_date)
        `)
        .eq('company_id', companyId)
        .in('status', ['active', 'pending'])
        .order('adopted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        release_id: data.release_id,
        version: data.xyreg_releases?.version ?? '',
        release_date: data.xyreg_releases?.release_date ?? '',
        adopted_at: data.adopted_at,
        status: data.status,
      };
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export interface AdoptReleaseParams {
  releaseId: string;
  preferredDate?: string;
  preferredTimeStart?: string;
  preferredTimeEnd?: string;
}

export function useAdoptRelease(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ releaseId, preferredDate, preferredTimeStart, preferredTimeEnd }: AdoptReleaseParams) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id ?? null;

      // Insert adoption record
      const { error } = await (supabase as any)
        .from('company_release_adoptions')
        .insert({
          company_id: companyId,
          release_id: releaseId,
          adopted_by: userId,
          status: 'pending',
          preferred_date: preferredDate ?? null,
          preferred_time_start: preferredTimeStart ?? null,
          preferred_time_end: preferredTimeEnd ?? null,
        });
      if (error) throw error;

      // Notify super admins that this company adopted a release
      try {
        // Get release version for the notification message
        const { data: release } = await (supabase as any)
          .from('xyreg_releases')
          .select('version')
          .eq('id', releaseId)
          .maybeSingle();

        // Get company name
        const { data: company } = await (supabase as any)
          .from('companies')
          .select('name')
          .eq('id', companyId)
          .maybeSingle();

        // Get super admin user IDs
        const { data: superAdmins } = await (supabase as any)
          .from('profiles')
          .select('id')
          .eq('role', 'super_admin');

        if (superAdmins && superAdmins.length > 0) {
          const companyName = company?.name ?? 'Unknown company';
          const releaseVersion = release?.version ?? 'unknown';
          const actorName = userData?.user?.email ?? 'A user';

          const notifications = superAdmins.map((admin: { id: string }) => ({
            user_id: admin.id,
            company_id: companyId,
            actor_id: userId,
            actor_name: actorName,
            category: 'system',
            action: 'release_adopted',
            title: `${companyName} adopted XYREG v${releaseVersion}`,
            message: preferredDate
              ? `${companyName} has started validation for v${releaseVersion}. Preferred update: ${preferredDate}${preferredTimeStart && preferredTimeEnd ? ` (${preferredTimeStart}–${preferredTimeEnd})` : ''}.`
              : `${companyName} has started validation for version v${releaseVersion}.`,
            priority: 'medium',
            entity_type: 'xyreg_release',
            entity_id: releaseId,
            action_url: '/super-admin/app/releases',
          }));

          await (supabase as any)
            .from('app_notifications')
            .insert(notifications);
        }

        // Send email notification to configured addresses (from DB)
        const { data: emailSetting } = await (supabase as any)
          .from('platform_settings')
          .select('value')
          .eq('key', 'adoption_notification_emails')
          .maybeSingle();
        const emailRecipients: string[] = emailSetting?.value || [];
        if (emailRecipients.length > 0) {
          const companyName = company?.name ?? 'Unknown company';
          const releaseVersion = release?.version ?? 'unknown';
          await supabase.functions.invoke('send-adoption-email', {
            body: {
              to: emailRecipients,
              companyName,
              releaseVersion,
              adoptedAt: new Date().toISOString(),
              preferredDate: preferredDate ?? null,
              preferredTimeStart: preferredTimeStart ?? null,
              preferredTimeEnd: preferredTimeEnd ?? null,
            },
          });
        }
      } catch {
        // Non-critical: don't fail adoption if notification fails
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-adopted-release', companyId] });
    },
  });
}
