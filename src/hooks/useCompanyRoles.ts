import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { UserRole } from '@/types/documentTypes';
import { CompanyRole, RoleSwitchResult, CompanyRoleContextOptions } from '@/types/companyRole';
import { toast } from 'sonner';
import { getCurrentCompanyId } from '@/utils/companyIdResolver';
import { useAuth } from '@/context/AuthContext';
// Conditional DevMode import to avoid circular dependencies

export function useCompanyRoles() {
  const [companyRoles, setCompanyRoles] = useState<CompanyRole[]>([]);
  const [activeCompanyRole, setActiveCompanyRole] = useState<CompanyRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  // Track previous user ID to detect login/logout transitions
  const previousUserIdRef = useRef<string | null>(null);
  // Use location for reading URL state, but navigate imperatively to avoid hook issues
  const location = useLocation();
  const queryClient = useQueryClient();
  // Get user from AuthContext to avoid duplicate auth.getUser() calls
  const { user: authUser, session } = useAuth();

  // Conditionally access DevMode to prevent circular dependency
  let devModeContext: any = null;
  try {
    // Only import and use DevMode if we're not in a loading state
    const { useDevMode: useDevModeHook } = require('@/context/DevModeContext');
    devModeContext = useDevModeHook();
  } catch {
    // DevMode context unavailable - continue without it
  }

  // Circuit breaker - force loading to false after 2 seconds for better UX
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setHasInitialized(true);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  // CRITICAL: Reset initialization when user ID changes (login/logout transition)
  // This ensures company roles are re-fetched after login
  useEffect(() => {
    const currentUserId = authUser?.id || null;
    const previousUserId = previousUserIdRef.current;

    // Detect user change (login after logout, or different user login)
    if (currentUserId !== previousUserId) {
      previousUserIdRef.current = currentUserId;

      // If user logged in (null -> userId), reset initialization to trigger fetch
      if (currentUserId && !previousUserId) {
        setHasInitialized(false);
        setIsLoading(true);
      }
      // If user logged out (userId -> null), clear company roles
      else if (!currentUserId && previousUserId) {
        setCompanyRoles([]);
        setActiveCompanyRole(null);
        setHasInitialized(false);
      }
      // If different user logged in, reset and re-fetch
      else if (currentUserId && previousUserId && currentUserId !== previousUserId) {
        setCompanyRoles([]);
        setActiveCompanyRole(null);
        setHasInitialized(false);
        setIsLoading(true);
      }
    }
  }, [authUser?.id]);

  // Fetch all company roles for the current user
  const fetchCompanyRoles = useCallback(async () => {
    try {
      // Prevent multiple simultaneous calls
      if (isLoading && hasInitialized) {
        return;
      }

      setIsLoading(true);

      // Use user from AuthContext instead of calling auth.getUser()
      if (!authUser?.id) {
        setCompanyRoles([]);
        setActiveCompanyRole(null);
        setIsLoading(false);
        setHasInitialized(true);
        return;
      }

      // Special case for super admin users - skip company role loading
      if (authUser.user_metadata?.role === 'super_admin') {
        setCompanyRoles([]);
        setActiveCompanyRole(null);
        setIsLoading(false);
        setHasInitialized(true);
        return;
      }

      // Fetch user's company access records
      const { data: accessData, error: accessError } = await supabase
        .from('user_company_access')
        .select(`
          company_id,
          access_level,
          is_primary,
          is_internal,
          companies(name, is_archived)
        `)
        .eq('user_id', authUser.id);

      if (accessError) {
        console.error('Error fetching company roles:', accessError);
        setIsLoading(false);
        setHasInitialized(true);
        return;
      }
      const filgterData = accessData.filter((record: any) => !record.companies?.is_archived);

      // PRIORITY: URL > sessionStorage > metadata > primary > first
      // URL takes highest priority because it's the user's explicit navigation
      let urlCompanyId: string | null = null;

      // Check URL for company context first - URL should be the source of truth
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        const match = pathname.match(/\/app\/company\/([^\/]+)/);
        if (match) {
          const urlCompanyName = decodeURIComponent(match[1]);
          // Find matching company in filtered access data
          const urlCompanyRecord = filgterData.find((record: any) => {
            const companyName = record.companies?.name;
            return companyName === urlCompanyName ||
                   companyName?.toLowerCase() === urlCompanyName?.toLowerCase();
          });
          if (urlCompanyRecord) {
            urlCompanyId = urlCompanyRecord.company_id;

            // Update sessionStorage to match URL (keep context in sync)
            try {
              sessionStorage.setItem('xyreg_company_context', JSON.stringify({
                companyId: urlCompanyRecord.company_id,
                companyName: urlCompanyRecord.companies?.name,
                productId: null,
                lastUpdated: Date.now()
              }));
            } catch {
              // Ignore sessionStorage errors
            }
          }
        }
      }

      // Check CompanyContextService for persisted company context (uses 24-hour expiration)
      let persistedCompanyId: string | null = null;
      let isIntentionalSelection = false;
      if (!urlCompanyId) {
        try {
          // Import dynamically to avoid circular dependency
          const { CompanyContextService } = await import('@/services/companyContext');
          const storedContext = CompanyContextService.get();
          if (storedContext) {
            persistedCompanyId = storedContext.companyId;
            isIntentionalSelection = storedContext.isIntentional;
          }
        } catch {
          // Continue if service not available
        }
      }

      // IMPORTANT: If user has made an intentional selection, don't override with URL
      // This prevents "jumping" when navigating between pages
      if (isIntentionalSelection && persistedCompanyId && urlCompanyId && urlCompanyId !== persistedCompanyId) {
        urlCompanyId = null; // Don't use URL company
      }

      // Get the active company ID from user metadata if available
      // If metadata contains "Heena Test" ID and there are other options, ignore it
      const metadataCompanyId = authUser.user_metadata?.activeCompany;
      const heenaTestId = '2a5ddc71-2254-4daa-801f-678ab2c8be18';

      // Priority: URL > sessionStorage > metadata > primary > first
      let activeCompanyId = urlCompanyId || persistedCompanyId || metadataCompanyId;

      // If the metadata points to "Heena Test" and there are other companies, clear it
      if (metadataCompanyId === heenaTestId && filgterData.length > 1) {
        activeCompanyId = null;
      }

      // Transform the data to CompanyRole objects
      const roles: CompanyRole[] = (filgterData || []).map(record => ({
        companyId: record.company_id,
        companyName: record.companies?.name ||"Unknown Company",
        role: record.access_level as UserRole,
        isActive: record.company_id === activeCompanyId,
        isPrimary: record.is_primary,
        isInternal: record.is_internal
      }));

      // Sort roles with primary first
      roles.sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return a.companyName.localeCompare(b.companyName);
      });

      setCompanyRoles(roles);

      // Set active company role with improved fallback logic
      // Priority: 1) Active from metadata, 2) Primary from DB, 3) First alphabetically (not "Heena Test")
      let active = roles.find(r => r.isActive);

      if (!active) {
        // Find primary company, but avoid "Heena Test" unless it's the only option
        const primaryRoles = roles.filter(r => r.isPrimary);
        if (primaryRoles.length === 1) {
          active = primaryRoles[0];
        } else if (primaryRoles.length > 1) {
          // Multiple primaries (database inconsistency), choose the first non-"Heena Test"
          active = primaryRoles.find(r => r.companyName !== "Heena Test") || primaryRoles[0];
        } else {
          // No primary set, choose first alphabetically (excluding "Heena Test" if possible)
          const nonHeenaRoles = roles.filter(r => r.companyName !== "Heena Test");
          active = nonHeenaRoles.length > 0 ? nonHeenaRoles[0] : roles[0];
        }
      }

      if (active) {
        setActiveCompanyRole(active);

        // Update the active status for all roles
        const updatedRoles = roles.map(role => ({
          ...role,
          isActive: role.companyId === active.companyId
        }));

        setCompanyRoles(updatedRoles);
      }
    } catch (error) {
      console.error('[useCompanyRoles] Error in fetchCompanyRoles:', error);
    } finally {
      setIsLoading(false);
      setHasInitialized(true);
    }
  }, [hasInitialized, isLoading, authUser]);

  // Initialize when user becomes available - single execution to prevent loops
  useEffect(() => {
    if (!hasInitialized && authUser?.id) {
      fetchCompanyRoles();
    }
  }, [fetchCompanyRoles, hasInitialized, authUser?.id]);

  // Listen for realtime changes to the current user's company access (e.g. role changed by admin)
  useEffect(() => {
    if (!authUser?.id) return;

    const channel = supabase
      .channel(`user-company-access-${authUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_company_access',
          filter: `user_id=eq.${authUser.id}`,
        },
        () => {
          // Role or access changed — refetch company roles
          setHasInitialized(false);
          setIsLoading(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authUser?.id]);

  // CRITICAL FIX: Listen for company creation completion and refresh roles
  useEffect(() => {
    const handleCompanyCreation = () => {
      const status = sessionStorage.getItem('company-creation-complete');
      if (status === 'success') {
        // Reset initialization flag to allow re-fetch
        setHasInitialized(false);
        setIsLoading(true);
        // Clear the session storage to prevent repeated refreshes
        sessionStorage.removeItem('company-creation-complete');
      }
    };

    // Check immediately
    handleCompanyCreation();

    // Listen for storage changes (company creation from other tabs)
    window.addEventListener('storage', handleCompanyCreation);

    return () => {
      window.removeEventListener('storage', handleCompanyCreation);
    };
  }, []);

  // Handle DevMode synchronization (only if DevMode is available and auto-sync is enabled)
  // IMPORTANT: This is now OPT-IN - won't override user's intentional selection
  useEffect(() => {
    const syncDevMode = async () => {
      if (devModeContext?.isDevMode && devModeContext?.selectedCompanies?.length > 0 && companyRoles.length > 0) {
        // Check if user has made an intentional selection - don't override it
        try {
          const { CompanyContextService } = await import('@/services/companyContext');
          const storedContext = CompanyContextService.get();
          if (storedContext?.isIntentional) {
            return;
          }
        } catch {
          // Continue if service not available
        }

        // Find a company that exists in both selected companies and user's company roles
        const matchingCompany = devModeContext.selectedCompanies.find(
          (devCompany: any) => companyRoles.some(role => role.companyId === devCompany.id)
        );

        if (matchingCompany) {
          const matchingRole = companyRoles.find(role => role.companyId === matchingCompany.id);

          if (matchingRole && !matchingRole.isActive && devModeContext.setPrimaryCompany) {
            // Set this company as active in DevMode
            devModeContext.setPrimaryCompany(matchingCompany);

            // Update active status for roles
            const updatedRoles = companyRoles.map(role => ({
              ...role,
              isActive: role.companyId === matchingCompany.id
            }));

            setCompanyRoles(updatedRoles);
            setActiveCompanyRole(matchingRole);
          }
        }
      }
    };
    syncDevMode();
  }, [devModeContext, companyRoles]);

  // Switch company and role
  const switchCompanyRole = useCallback(async (
    companyId: string,
    options: CompanyRoleContextOptions = {}
  ): Promise<RoleSwitchResult> => {
    try {
      const { updateUserMetadata = true, navigateToCompany = true } = options;

      const targetRole = companyRoles.find(role => role.companyId === companyId);

      if (!targetRole) {
        console.error('[switchCompanyRole] SECURITY BREACH PREVENTED: Invalid company switch attempt:', {
          requestedCompanyId: companyId,
          userCompanies: companyRoles.map(r => r.companyName)
        });
        return {
          success: false,
          message: "Company not found in user's access list"
        };
      }

      // Update user metadata if needed
      if (updateUserMetadata) {
        const { error } = await supabase.auth.updateUser({
          data: {
            activeCompany: companyId,
            role: targetRole.role,
            lastSelectedCompany: targetRole.companyName // Track the last selected company name for login redirect
          }
        });

        if (error) {
          console.error('Error updating user metadata:', error);
          return {
            success: false,
            message: 'Failed to update user data',
            error
          };
        }
      }

      // Update active state for all roles
      const updatedRoles = companyRoles.map(role => ({
        ...role,
        isActive: role.companyId === companyId
      }));

      setCompanyRoles(updatedRoles);
      setActiveCompanyRole(targetRole);

      // Save to CompanyContextService for persistence across page refresh
      // This marks it as an intentional user selection (won't be overridden by URL navigation)
      try {
        const { CompanyContextService } = await import('@/services/companyContext');
        CompanyContextService.setFromUserSelection(targetRole.companyId, targetRole.companyName);
      } catch {
        // Continue if service not available
      }

      // Invalidate React Query cache for company-related data
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          // Invalidate any query that might contain company-specific data
          return (
            queryKey.includes('company-products') ||
            queryKey.includes('company-products-selection') ||
            queryKey.includes('products') ||
            queryKey.includes('phases') ||
            queryKey.includes('documents') ||
            queryKey.includes('lifecycle') ||
            queryKey.includes(companyId) ||
            (activeCompanyRole && queryKey.includes(activeCompanyRole.companyId))
          );
        }
      });

      // Navigate to company dashboard if requested
      if (navigateToCompany) {
        // Use window.location for navigation to avoid useNavigate hook issues
        window.location.href = `/app/company/${encodeURIComponent(targetRole.companyName)}`;
      }

      toast.success(`Switched to ${targetRole.companyName} as ${targetRole.role}`);

      return {
        success: true,
        message: `Switched to ${targetRole.companyName}`
      };
    } catch (error: any) {
      console.error('Error in switchCompanyRole:', error);
      return {
        success: false,
        message: error.message || 'Failed to switch company',
        error
      };
    }
  }, [companyRoles, queryClient, activeCompanyRole]);

  // Update role for specific company
  const updateCompanyRole = useCallback(async (
    companyId: string,
    newRole: UserRole
  ): Promise<RoleSwitchResult> => {
    try {
      // Use authUser from AuthContext instead of calling auth.getUser()
      if (!authUser?.id) {
        return {
          success: false,
          message: "User not authenticated"
        };
      }

      // Map role for database compatibility (reviewer -> viewer)
      const dbRole = newRole === "reviewer" ? "viewer" : newRole as "admin" | "editor" | "viewer" | "consultant";

      // Update the role in the database
      const { error } = await supabase
        .from('user_company_access')
        .update({ access_level: dbRole })
        .eq('user_id', authUser.id)
        .eq('company_id', companyId);

      if (error) {
        console.error('Error updating company role:', error);
        return {
          success: false,
          message: 'Failed to update role',
          error
        };
      }

      // Update local state
      const updatedRoles = companyRoles.map(role =>
        role.companyId === companyId
          ? { ...role, role: newRole }
          : role
      );

      setCompanyRoles(updatedRoles);

      // Update active role if this is the active company
      if (activeCompanyRole && activeCompanyRole.companyId === companyId) {
        setActiveCompanyRole({ ...activeCompanyRole, role: newRole });

        // Also update user metadata
        await supabase.auth.updateUser({
          data: { role: newRole }
        });
      }

      toast.success(`Role updated to ${newRole}`);

      return {
        success: true,
        message: `Role updated to ${newRole}`
      };
    } catch (error: any) {
      console.error('Error in updateCompanyRole:', error);
      return {
        success: false,
        message: error.message || 'Failed to update role',
        error
      };
    }
  }, [companyRoles, activeCompanyRole, authUser]);

  // CRITICAL FIX: Manual refresh function for after company creation
  const refreshCompanyRoles = useCallback(async () => {
    setHasInitialized(false);
    setIsLoading(true);
    await fetchCompanyRoles();
  }, [fetchCompanyRoles]);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => {
    return {
      companyRoles,
      activeCompanyRole,
      isLoading,
      fetchCompanyRoles,
      switchCompanyRole,
      updateCompanyRole,
      refreshCompanyRoles,
      activeCompanyId: activeCompanyRole?.companyId || null,
      activeRole: activeCompanyRole?.role || "viewer" as UserRole
    };
  }, [companyRoles, activeCompanyRole, isLoading, fetchCompanyRoles, switchCompanyRole, updateCompanyRole, refreshCompanyRoles]);
}
