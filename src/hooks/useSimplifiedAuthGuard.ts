
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export interface SimplifiedAuthState {
  isReady: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export function useSimplifiedAuthGuard(): SimplifiedAuthState {
  const { user, isLoading } = useAuth();
  const [authState, setAuthState] = useState<SimplifiedAuthState>({
    isReady: false,
    isAuthenticated: false,
    error: null
  });

  useEffect(() => {
    if (isLoading) {
      return; // Still loading
    }

    if (user) {
      setAuthState({
        isReady: true,
        isAuthenticated: true,
        error: null
      });
    } else {
      setAuthState({
        isReady: true,
        isAuthenticated: false,
        error: 'Authentication required'
      });
    }
  }, [user, isLoading]);

  return authState;
}
