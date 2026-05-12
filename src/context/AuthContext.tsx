
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { UserRole } from '@/types/documentTypes';
import { Session } from '@supabase/supabase-js';
import { useDevMode } from '@/context/DevModeContext';
import { toast } from 'sonner';
import { authService, AuthUser } from '@/services/authService';
import { supabase } from '@/integrations/supabase/client';
import { clearAllUserPreferences } from '@/services/devicePreferenceService';
import { queryClient } from '@/lib/query-client';
import { activeTenant } from '@/config/tenants';

const TENANT_ALLOWED_STORAGE_KEY = 'xyreg_tenant_allowed_companies';
const TENANT_PRIMARY_STORAGE_KEY = 'xyreg_tenant_primary_company';

type PersistedTenantAllowed = { tenantKey: string; ids: string[] };

// Returns null when no cache exists for the current tenant key — distinct
// from [] which is a valid "allow all" value (mockup). Lets consumers tell
// "still loading" apart from "allow all".
const readPersistedTenantAllowed = (): string[] | null => {
  try {
    const raw = sessionStorage.getItem(TENANT_ALLOWED_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedTenantAllowed;
    if (parsed?.tenantKey === activeTenant.key && Array.isArray(parsed?.ids)) {
      return parsed.ids;
    }
  } catch {
    // fall through to null
  }
  return null;
};

const writePersistedTenantAllowed = (ids: string[]) => {
  try {
    sessionStorage.setItem(
      TENANT_ALLOWED_STORAGE_KEY,
      JSON.stringify({ tenantKey: activeTenant.key, ids } satisfies PersistedTenantAllowed)
    );
  } catch {
    // ignore quota errors
  }
};

export interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: any, success: boolean, user?: any, isReviewer?: boolean, isInvestor?: boolean, tenantAllowedCompanyIds?: string[], tenantPrimaryCompanyId?: string | null }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, role: string) => Promise<void>;
  isLoading: boolean;
  userRole: UserRole;
  isReviewer: boolean; // Cached reviewer status from user_profiles
  isInvestor: boolean; // Cached investor status
  /**
   * Company UUIDs the active tenant deployment grants visibility to.
   * - `null` — not yet loaded (e.g., page reload before AuthContext has refetched).
   * - `[]`   — "allow all" (mockup) — fall back to user_company_access.
   * - non-empty — filter the company switcher to these IDs only (genish, arnar, etc.).
   */
  tenantAllowedCompanyIds: string[] | null;
  /**
   * Tenant-configured "primary company" UUID — the dashboard a user should
   * land on by default when logging in via the tenant URL. `null` when the
   * tenant has no primary configured (e.g., mockup) or while still loading.
   */
  tenantPrimaryCompanyId: string | null;
  refreshSession: () => Promise<void>;
  setDevUserRole?: (role: UserRole) => void;
  clearDevMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// LocalStorage keys for DevMode
const USER_STORAGE_KEY = 'mock_user';
const USER_ROLE_STORAGE_KEY = 'mock_user_role';

// Use a valid UUID format for the mock user in DevMode
const DEV_MODE_USER_ID = '00000000-0000-0000-0000-000000000001';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>("viewer");
  const [isReviewer, setIsReviewer] = useState(false);
  const [isInvestor, setIsInvestor] = useState(false);
  const [tenantAllowedCompanyIds, setTenantAllowedCompanyIds] = useState<string[] | null>(readPersistedTenantAllowed);
  const [tenantPrimaryCompanyId, setTenantPrimaryCompanyIdState] = useState<string | null>(() => {
    try {
      const raw = sessionStorage.getItem(TENANT_PRIMARY_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { tenantKey: string; id: string | null };
      if (parsed?.tenantKey === activeTenant.key) return parsed.id ?? null;
    } catch {}
    return null;
  });
  const { isDevMode, selectedRole, resetDevMode } = useDevMode();

  // Update both state and sessionStorage in lockstep so a page reload keeps the
  // tenant allow list available without a refetch — login already fetched it.
  const updateTenantAllowedCompanyIds = useCallback((ids: string[]) => {
    setTenantAllowedCompanyIds(ids);
    writePersistedTenantAllowed(ids);
  }, []);

  const updateTenantPrimaryCompanyId = useCallback((id: string | null) => {
    setTenantPrimaryCompanyIdState(id);
    try {
      sessionStorage.setItem(
        TENANT_PRIMARY_STORAGE_KEY,
        JSON.stringify({ tenantKey: activeTenant.key, id })
      );
    } catch {}
  }, []);

  // Page-reload recovery: if a session is restored but we have no cached
  // allow list for the current tenant key, fetch it once via the RPC.
  // Cached hits skip this entirely.
  useEffect(() => {
    if (isDevMode) return;
    if (!user?.id || tenantAllowedCompanyIds !== null) return;

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await (supabase as any).rpc(
          'get_tenant_allow_company_ids',
          { tenant_key: activeTenant.key }
        );
        if (cancelled) return;
        if (error) {
          console.error('Error refetching tenant allow list:', error);
          return;
        }
        updateTenantAllowedCompanyIds(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) console.error('Tenant allow list refetch failed:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, tenantAllowedCompanyIds, isDevMode, updateTenantAllowedCompanyIds]);

  // Page-reload recovery for tenantPrimaryCompanyId — fetched once when missing.
  useEffect(() => {
    if (isDevMode) return;
    if (!user?.id) return;
    // Already loaded for this tenant key (sessionStorage init or signIn).
    const cached = sessionStorage.getItem(TENANT_PRIMARY_STORAGE_KEY);
    if (cached) return;

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('tenant_configs')
          .select('company_id')
          .eq('key', activeTenant.key)
          .maybeSingle();
        if (cancelled) return;
        if (error) {
          console.error('Error refetching tenant primary company:', error);
          return;
        }
        updateTenantPrimaryCompanyId(data?.company_id ?? null);
      } catch (err) {
        if (!cancelled) console.error('Tenant primary company refetch failed:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, isDevMode, updateTenantPrimaryCompanyId]);

  // Memoize user object to prevent unnecessary re-renders
  const stableUser = useMemo(() => user, [user?.id, user?.email, user?.user_metadata?.role]);

  // Clear DevMode function
  const clearDevMode = useCallback(() => {
    // Clear localStorage
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(USER_ROLE_STORAGE_KEY);

    // Clear auth state
    setUser(null);
    setSession(null);
    setUserRole("viewer");

    // Clear company context to prevent context bleeding
    sessionStorage.removeItem('xyreg_company_context');

    // Reset DevMode
    resetDevMode();

    toast.success("DevMode cleared successfully");
  }, [resetDevMode]);

  // Set up auth state listener
  useEffect(() => {
    let mounted = true;

    // Only set up real auth listener if not in dev mode
    if (!isDevMode) {
      const { data: { subscription } } = authService.onAuthStateChange(
        (event, newSession) => {
          if (!mounted) return;

          // Handle password recovery event — flag it so Landing page
          // redirects to /reset-password instead of /app (dashboard)
          if (event === 'PASSWORD_RECOVERY') {
            sessionStorage.setItem('pending_password_recovery', 'true');
          }

          setSession(newSession);

          if (newSession?.user) {
            const userData: AuthUser = {
              id: newSession.user.id,
              email: newSession.user.email || '',
              created_at: newSession.user.created_at,
              user_metadata: newSession.user.user_metadata,
              success: true
            };

            setUser(userData);

            const role = authService.extractUserRole(userData);
            setUserRole(role);
          } else {
            setUser(null);
            setUserRole("viewer");
          }

          setIsLoading(false);
        }
      );

      // Initial session check
      const initializeAuth = async () => {
        try {
          const { user: currentUser, session: currentSession } = await authService.getCurrentSession();

          if (!mounted) return;

          if (currentUser && currentSession) {
            setUser(currentUser);
            setSession(currentSession);
            setUserRole(authService.extractUserRole(currentUser));
          }

          setIsLoading(false);
        } catch (error) {
          console.error("Error during auth initialization:", error);
          if (mounted) {
            setIsLoading(false);
          }
        }
      };

      // Timeout protection
      const timeoutId = setTimeout(() => {
        if (mounted && isLoading) {
          console.warn("Auth initialization timeout - forcing loading to false");
          setIsLoading(false);
        }
      }, 5000);

      initializeAuth();

      return () => {
        mounted = false;
        clearTimeout(timeoutId);
        subscription.unsubscribe();
      };
    } else {
      // In DevMode, just stop loading
      setIsLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [isDevMode]);

  // Handle DevMode integration separately
  useEffect(() => {
    if (isDevMode) {
      const mockUser: AuthUser = {
        id: DEV_MODE_USER_ID,
        email: 'dev@example.com',
        user_metadata: {
          role: selectedRole,
          first_name: 'Dev',
          last_name: 'User'
        },
        success: true
      };

      setUser(mockUser);
      setUserRole(selectedRole);
      setSession(null); // Clear real session in dev mode
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));
      localStorage.setItem(USER_ROLE_STORAGE_KEY, selectedRole);
      setIsLoading(false);
    } else {
      // Clear DevMode data when exiting dev mode
      const hasMockUser = localStorage.getItem(USER_STORAGE_KEY);
      if (hasMockUser) {
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(USER_ROLE_STORAGE_KEY);
        setUser(null);
        setUserRole("viewer");
      }
    }
  }, [isDevMode, selectedRole]);

  // Fetch user status (reviewer + investor) once when user changes (cached globally)
  useEffect(() => {
    const fetchUserStatus = async () => {
      if (!user?.id || user.id === DEV_MODE_USER_ID) {
        setIsReviewer(false);
        setIsInvestor(false);
        return;
      }

      try {
        // Fetch both statuses in parallel to reduce API calls
        const [reviewerResult, investorResult] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('is_reviewer')
            .eq('id', user.id)
            .maybeSingle(),
          supabase
            .from('investor_profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle()
        ]);

        // Set reviewer status
        if (!reviewerResult.error && reviewerResult.data) {
          setIsReviewer(reviewerResult.data.is_reviewer || false);
        } else {
          setIsReviewer(false);
        }

        // Set investor status
        setIsInvestor(!!investorResult.data);
      } catch (err) {
        console.error('[AuthContext] Error fetching user status:', err);
        setIsReviewer(false);
        setIsInvestor(false);
      }
    };

    fetchUserStatus();
  }, [user?.id]);

  const signIn = async (email: string, password: string): Promise<{ error: any, success: boolean, user?: any, isReviewer?: boolean, isInvestor?: boolean, tenantAllowedCompanyIds?: string[], tenantPrimaryCompanyId?: string | null }> => {
    if (isDevMode) {
      throw new Error("Cannot sign in while DevMode is active. Please disable DevMode first.");
    }

    try {
      const { user: authUser, error, success, tenantAllowedCompanyIds: allowedIds, tenantPrimaryCompanyId: primaryId } = await authService.signIn(email, password);
      if (error) throw error;
      if (!success) {
        setUser(null);
        return { error: error, success: success };
      }

      // authService already fetched the tenant allow list as part of the login
      // gate — reuse it instead of refetching to keep total login under 2s.
      updateTenantAllowedCompanyIds(allowedIds ?? []);
      updateTenantPrimaryCompanyId(primaryId ?? null);

      // Fetch reviewer and investor status immediately during sign-in
      // This ensures the status is available before navigation
      let reviewerStatus = false;
      let investorStatus = false;

      if (authUser?.id) {
        try {
          const [reviewerResult, investorResult] = await Promise.all([
            supabase
              .from('user_profiles')
              .select('is_reviewer')
              .eq('id', authUser.id)
              .maybeSingle(),
            supabase
              .from('investor_profiles')
              .select('id')
              .eq('user_id', authUser.id)
              .maybeSingle()
          ]);

          reviewerStatus = reviewerResult.data?.is_reviewer || false;
          investorStatus = !!investorResult.data;

          // Set the states immediately
          setIsReviewer(reviewerStatus);
          setIsInvestor(investorStatus);
        } catch (statusError) {
          console.error('[AuthContext] Error fetching user status during sign-in:', statusError);
        }
      }

      return { error: null, success: true, user: authUser, isReviewer: reviewerStatus, isInvestor: investorStatus, tenantAllowedCompanyIds: allowedIds ?? [], tenantPrimaryCompanyId: primaryId ?? null };

    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);

    // Get user ID before clearing state (needed for preference cleanup)
    const currentUserId = user?.id;

    try {
      if (isDevMode) {
        // In DevMode, just clear the mock user
        clearDevMode();
      } else {
        // Real logout
        const { error } = await authService.signOut();
        if (error) throw error;
      }

      // Clear all auth state
      setUser(null);
      setSession(null);
      setUserRole("viewer");

      // Clear impersonation data on sign out
      localStorage.removeItem('impersonation_data');

      // Clear company context on sign out to prevent context bleeding between users
      sessionStorage.removeItem('xyreg_company_context');
      sessionStorage.removeItem(TENANT_ALLOWED_STORAGE_KEY);
      sessionStorage.removeItem(TENANT_PRIMARY_STORAGE_KEY);
      setTenantAllowedCompanyIds(null);
      setTenantPrimaryCompanyIdState(null);

      // Clear React Query cache to prevent data bleeding between users
      queryClient.clear();

      // Clear all device/menu preferences for this user (CRITICAL for security)
      if (currentUserId) {
        clearAllUserPreferences(currentUserId);
      }

    } catch (error: any) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, role: string): Promise<void> => {
    if (isDevMode) {
      throw new Error("Cannot sign up while DevMode is active. Please disable DevMode first.");
    }

    setIsLoading(true);

    try {
      const { error } = await authService.signUp(email, password, role);
      if (error) throw error;
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async (): Promise<void> => {
    if (isDevMode) {
      return;
    }

    try {
      // Force refresh the session
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error("Error refreshing session:", error);
        throw error;
      }

      if (refreshedSession) {
        setSession(refreshedSession);

        if (refreshedSession.user) {
          const userData: AuthUser = {
            id: refreshedSession.user.id,
            email: refreshedSession.user.email || '',
            created_at: refreshedSession.user.created_at,
            user_metadata: refreshedSession.user.user_metadata,
            success: true
          };

          setUser(userData);
          setUserRole(authService.extractUserRole(userData));
        }
      } else {
        // Clear auth state if refresh fails
        setUser(null);
        setSession(null);
        setUserRole("viewer");
      }
    } catch (error: any) {
      console.error("Error refreshing session:", error);
      // Clear auth state on error
      setUser(null);
      setSession(null);
      setUserRole("viewer");
      throw error;
    }
  };

  // Development mode role switcher
  const setDevUserRole = (role: UserRole) => {
    if (isDevMode) {
      setUserRole(role);
      localStorage.setItem(USER_ROLE_STORAGE_KEY, role);

      if (user) {
        const updatedUser = {
          ...user,
          user_metadata: {
            ...user.user_metadata,
            role: role,
          },
        };

        setUser(updatedUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      }

      toast.success(`Role changed to ${role}`);
    } else {
      // Only update in Supabase if we have a real session
      if (session && authService.isRealAuthentication()) {
        authService.updateUserRole(role);
      }

      toast.success(`Role changed to ${role}`);
    }
  };

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user: stableUser,
    session,
    signIn,
    signOut,
    signUp,
    isLoading,
    userRole,
    isReviewer,
    isInvestor,
    tenantAllowedCompanyIds,
    tenantPrimaryCompanyId,
    refreshSession,
    setDevUserRole,
    clearDevMode,
  }), [stableUser, session, isLoading, userRole, isReviewer, isInvestor, tenantAllowedCompanyIds, tenantPrimaryCompanyId, clearDevMode]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
