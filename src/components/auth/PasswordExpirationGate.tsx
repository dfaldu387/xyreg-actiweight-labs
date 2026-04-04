import React, { useEffect } from 'react';
import { usePasswordExpiration } from '@/hooks/usePasswordExpiration';
import { ForcePasswordChange } from './ForcePasswordChange';
import { FullPageLoader } from '@/components/ui/loading-spinner';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface PasswordExpirationGateProps {
  children: React.ReactNode;
}

export function PasswordExpirationGate({ children }: PasswordExpirationGateProps) {
  const { user } = useAuth();
  const { isExpired, isLoading } = usePasswordExpiration();

  // Check if user has a requires_password_change flag in metadata
  const requiresPasswordChange = (user?.user_metadata as any)?.requires_password_change === true;

  // Auto-clear stale requires_password_change flag when password is not expired
  // This handles users who changed their password before the flag-clearing fix was deployed
  useEffect(() => {
    if (!isLoading && !isExpired && requiresPasswordChange) {
      supabase.auth.updateUser({ data: { requires_password_change: false } });
    }
  }, [isLoading, isExpired, requiresPasswordChange]);

  if (isLoading) {
    return <FullPageLoader />;
  }

  // Only block if the password expiration check says expired
  // The requires_password_change flag is auto-cleared above if stale
  if (isExpired) {
    return <ForcePasswordChange />;
  }

  return <>{children}</>;
}
