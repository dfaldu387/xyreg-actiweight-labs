import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { companyTimeTrackingService } from "@/services/companyTimeTrackingService";

const IDLE_TIMEOUT_MS = 60_000; // 1 minute
import { supabase } from "@/integrations/supabase/client";

/**
 * Global hook that tracks time spent on company/product routes.
 * Mount once in AppLayout.
 */
export function useCompanyTimeTracker() {
  const location = useLocation();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolvedCompanyId = useRef<string | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isIdle = useRef(false);

  const resolveCompanyFromRoute = useCallback(async (pathname: string): Promise<string | null> => {
    // Match /app/company/:name routes
    const companyMatch = pathname.match(/\/app\/company\/([^/]+)/);
    if (companyMatch) {
      const companyName = decodeURIComponent(companyMatch[1]);
      // Resolve name to ID
      const { data } = await supabase
        .from('companies')
        .select('id')
        .eq('name', companyName)
        .maybeSingle();
      return data?.id || null;
    }

    // Match /app/product/:id routes
    const productMatch = pathname.match(/\/app\/product\/([^/]+)/);
    if (productMatch) {
      const productId = decodeURIComponent(productMatch[1]);
      const { data } = await supabase
        .from('products')
        .select('company_id')
        .eq('id', productId)
        .maybeSingle();
      return data?.company_id || null;
    }

    return null;
  }, []);

  const handleRouteChange = useCallback(async (pathname: string) => {
    const companyId = await resolveCompanyFromRoute(pathname);

    if (companyId) {
      // Same company — no change needed
      if (resolvedCompanyId.current === companyId) return;
      resolvedCompanyId.current = companyId;
      await companyTimeTrackingService.startSession(companyId);
    } else {
      // Left company routes
      if (resolvedCompanyId.current) {
        resolvedCompanyId.current = null;
        await companyTimeTrackingService.endSession();
      }
    }
  }, [resolveCompanyFromRoute]);

  // Debounced route change handler
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      handleRouteChange(location.pathname);
    }, 500);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [location.pathname, handleRouteChange]);

  // Handle tab visibility changes
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        companyTimeTrackingService.endSession();
      } else if (resolvedCompanyId.current) {
        companyTimeTrackingService.startSession(resolvedCompanyId.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Idle detection — pause after 1 minute of no activity
  useEffect(() => {
    const resetIdleTimer = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);

      // If resuming from idle, restart the session
      if (isIdle.current && resolvedCompanyId.current) {
        isIdle.current = false;
        companyTimeTrackingService.startSession(resolvedCompanyId.current);
      }

      idleTimer.current = setTimeout(() => {
        isIdle.current = true;
        companyTimeTrackingService.endSession();
      }, IDLE_TIMEOUT_MS);
    };

    const events = ['mousemove', 'keydown', 'scroll', 'mousedown', 'touchstart'] as const;
    events.forEach(e => document.addEventListener(e, resetIdleTimer));
    resetIdleTimer(); // start the timer

    return () => {
      events.forEach(e => document.removeEventListener(e, resetIdleTimer));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);


  useEffect(() => {
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable close-time tracking
      if (companyTimeTrackingService.isTracking()) {
        companyTimeTrackingService.endSession();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      companyTimeTrackingService.endSession();
    };
  }, []);
}
