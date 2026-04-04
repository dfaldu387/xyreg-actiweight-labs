import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { PasswordExpirationService } from '@/services/passwordExpirationService';
import { supabase } from '@/integrations/supabase/client';

export function usePasswordExpiration() {
  const { user, session } = useAuth();

  const isOAuthUser = (() => {
    // Check the raw Supabase session for provider info
    const provider = session?.user?.app_metadata?.provider;
    return provider === 'google' || provider === 'github' || provider === 'azure';
  })();

  const { data, isLoading } = useQuery({
    queryKey: ['password-expiration', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return { isExpired: false, daysUntilExpiry: null, lastChanged: null, policyDays: null };
      }
      return PasswordExpirationService.isPasswordExpired(user.id);
    },
    enabled: !!user?.id && !isOAuthUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // OAuth users are never expired
  if (isOAuthUser) {
    return {
      isExpired: false,
      isLoading: false,
      daysUntilExpiry: null,
    };
  }

  return {
    isExpired: data?.isExpired ?? false,
    isLoading,
    daysUntilExpiry: data?.daysUntilExpiry ?? null,
  };
}
