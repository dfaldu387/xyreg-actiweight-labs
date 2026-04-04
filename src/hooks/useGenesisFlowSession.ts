import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';

const GENESIS_SESSION_KEY = 'xyreg_genesis_session';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

interface GenesisSession {
  productId: string;
  timestamp: number;
}

export function useGenesisFlowSession() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const returnTo = searchParams.get('returnTo');
  const isInGenesisFlow = returnTo === 'investor-share' || returnTo === 'venture-blueprint' || returnTo === 'genesis';
  const isOnProductPage = location.pathname.includes('/app/product/');
  // Check if user is within the app (any authenticated page)
  const isInApp = location.pathname.startsWith('/app');
  // Check if we're on the Genesis landing page (Genesis or Venture Blueprint tab)
  const isOnGenesisLandingPage = location.pathname.includes('/app/product/') &&
    (searchParams.get('tab') === 'genesis' || searchParams.get('tab') === 'venture-blueprint' || location.pathname.endsWith('/business-case'));
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [sessionProductId, setSessionProductId] = useState<string | null>(null);

  // Check for active session on mount and when storage changes
  const checkSession = useCallback(() => {
    try {
      const stored = sessionStorage.getItem(GENESIS_SESSION_KEY);
      if (!stored) {
        setHasActiveSession(false);
        setSessionProductId(null);
        return;
      }
      
      const session: GenesisSession = JSON.parse(stored);
      const isExpired = Date.now() - session.timestamp > SESSION_TIMEOUT_MS;
      
      if (isExpired) {
        sessionStorage.removeItem(GENESIS_SESSION_KEY);
        setHasActiveSession(false);
        setSessionProductId(null);
      } else {
        setHasActiveSession(true);
        setSessionProductId(session.productId);
      }
    } catch {
      setHasActiveSession(false);
      setSessionProductId(null);
    }
  }, []);

  // Store session when entering Genesis flow
  const storeSession = useCallback((productId: string) => {
    const session: GenesisSession = {
      productId,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(GENESIS_SESSION_KEY, JSON.stringify(session));
    setHasActiveSession(true);
    setSessionProductId(productId);
  }, []);

  // Clear session explicitly
  const clearSession = useCallback(() => {
    sessionStorage.removeItem(GENESIS_SESSION_KEY);
    setHasActiveSession(false);
    setSessionProductId(null);
  }, []);

  // Refresh session timestamp (extend session while actively using)
  const refreshSession = useCallback(() => {
    try {
      const stored = sessionStorage.getItem(GENESIS_SESSION_KEY);
      if (stored) {
        const session: GenesisSession = JSON.parse(stored);
        session.timestamp = Date.now();
        sessionStorage.setItem(GENESIS_SESSION_KEY, JSON.stringify(session));
      }
    } catch {
      // Ignore errors
    }
  }, []);

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Clear session when navigating to any product page without the returnTo parameter
  // This indicates the user has navigated away from the guided flow via sidebar/normal navigation
  useEffect(() => {
    // If we're on a product page but NOT in the genesis flow (no returnTo param),
    // and we have an active session, clear it - the user has left the guided flow
    if (isOnProductPage && !isInGenesisFlow && hasActiveSession) {
      clearSession();
    }
  }, [isOnProductPage, isInGenesisFlow, hasActiveSession, clearSession]);

  // Listen for storage changes (in case of multi-tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === GENESIS_SESSION_KEY) {
        checkSession();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [checkSession]);

  return {
    isInGenesisFlow,
    hasActiveSession,
    sessionProductId,
    storeSession,
    clearSession,
    refreshSession,
    // Show button when: has session AND not currently in flow AND anywhere in the app
    shouldShowReturnButton: hasActiveSession && !isInGenesisFlow && isInApp,
  };
}
