
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface AuthGuardState {
  isReady: boolean;
  isAuthenticated: boolean;
  hasValidSession: boolean;
  error: string | null;
}

export function useAuthGuard() {
  const { user, isLoading } = useAuth();
  const [authState, setAuthState] = useState<AuthGuardState>({
    isReady: false,
    isAuthenticated: false,
    hasValidSession: false,
    error: null
  });

  useEffect(() => {
    const checkAuthState = async () => {
      if (isLoading) {
        return; // Still loading, don't update state yet
      }

      try {
        // Check if we have a user from auth context
        if (!user) {
          setAuthState({
            isReady: true,
            isAuthenticated: false,
            hasValidSession: false,
            error: null
          });
          return;
        }

        // Quick session check with timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Session check timeout')), 5000);
        });

        const sessionPromise = supabase.auth.getSession();
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]);
        
        if (error || !session) {
          setAuthState({
            isReady: true,
            isAuthenticated: false,
            hasValidSession: false,
            error: error?.message || 'Session invalid'
          });
          return;
        }

        // Check if session is expired
        const now = Math.floor(Date.now() / 1000);
        const isExpired = session.expires_at ? session.expires_at <= now : false;

        if (isExpired) {
          // Don't attempt refresh automatically, just mark as expired
          setAuthState({
            isReady: true,
            isAuthenticated: false,
            hasValidSession: false,
            error: 'Session expired'
          });
          return;
        }

        // All checks passed
        setAuthState({
          isReady: true,
          isAuthenticated: true,
          hasValidSession: true,
          error: null
        });

      } catch (error) {
        console.error('[useAuthGuard] Auth state check failed:', error);
        setAuthState({
          isReady: true,
          isAuthenticated: false,
          hasValidSession: false,
          error: error instanceof Error ? error.message : 'Auth check failed'
        });
      }
    };

    checkAuthState();
  }, [user, isLoading]);

  return authState;
}
