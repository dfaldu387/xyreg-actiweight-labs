/**
 * useCurrentCompany - Single source of truth for company context
 *
 * This hook provides a consistent company context across the application,
 * preventing the "jumping company" issue caused by multiple conflicting sources.
 *
 * Usage:
 * ```tsx
 * const { companyId, companyName, isLoading } = useCurrentCompany();
 * ```
 *
 * Priority order:
 * 1. User's intentional selection (highest priority, persisted)
 * 2. Active company role from context
 * 3. Company from URL (if on company route)
 * 4. Fallback to first available company
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { CompanyContextService, StoredCompanyContext } from '@/services/companyContext';
import { UserRole } from '@/types/documentTypes';

export interface CurrentCompanyState {
  companyId: string | null;
  companyName: string | null;
  role: UserRole;
  isLoading: boolean;
  isIntentionalSelection: boolean;
  source: StoredCompanyContext['source'] | 'context' | null;
}

export interface UseCurrentCompanyReturn extends CurrentCompanyState {
  /**
   * Switch to a different company (intentional user selection)
   */
  switchCompany: (companyId: string) => Promise<void>;

  /**
   * Refresh the context (keep session alive)
   */
  refreshContext: () => void;

  /**
   * Check if a specific company is the current one
   */
  isCurrentCompany: (companyId: string) => boolean;
}

export function useCurrentCompany(): UseCurrentCompanyReturn {
  const {
    activeCompanyRole,
    companyRoles,
    isLoading: isCompanyRoleLoading,
    switchCompanyRole
  } = useCompanyRole();

  const [storedContext, setStoredContext] = useState<StoredCompanyContext | null>(
    () => CompanyContextService.get()
  );

  // Subscribe to context changes (from other tabs or service updates)
  useEffect(() => {
    const unsubscribe = CompanyContextService.subscribe((context) => {
      setStoredContext(context);
    });
    return unsubscribe;
  }, []);

  // Sync active company role to service when it changes
  useEffect(() => {
    if (activeCompanyRole && !isCompanyRoleLoading) {
      const currentStored = CompanyContextService.get();

      // If no stored context, or stored context doesn't match active role
      if (!currentStored || currentStored.companyId !== activeCompanyRole.companyId) {
        // Only update if there's no intentional selection, or if this is a new intentional selection
        if (!currentStored?.isIntentional) {
          CompanyContextService.set(
            activeCompanyRole.companyId,
            activeCompanyRole.companyName,
            'metadata',
            false
          );
        }
      } else if (currentStored.companyId === activeCompanyRole.companyId) {
        // Same company - just refresh timestamp
        CompanyContextService.touch();
      }
    }
  }, [activeCompanyRole, isCompanyRoleLoading]);

  // Determine the effective company ID
  const effectiveCompany = useMemo(() => {
    // Priority 1: Stored intentional selection
    if (storedContext?.isIntentional) {
      // Verify this company still exists in user's roles
      const matchingRole = companyRoles.find(r => r.companyId === storedContext.companyId);
      if (matchingRole) {
        return {
          companyId: storedContext.companyId,
          companyName: storedContext.companyName,
          role: matchingRole.role,
          source: storedContext.source,
          isIntentional: true
        };
      }
      // Company no longer accessible - clear the stored context
      
      CompanyContextService.clear();
    }

    // Priority 2: Active company role from context
    if (activeCompanyRole) {
      return {
        companyId: activeCompanyRole.companyId,
        companyName: activeCompanyRole.companyName,
        role: activeCompanyRole.role,
        source: 'context' as const,
        isIntentional: false
      };
    }

    // Priority 3: Stored non-intentional context
    if (storedContext) {
      const matchingRole = companyRoles.find(r => r.companyId === storedContext.companyId);
      if (matchingRole) {
        return {
          companyId: storedContext.companyId,
          companyName: storedContext.companyName,
          role: matchingRole.role,
          source: storedContext.source,
          isIntentional: false
        };
      }
    }

    // Priority 4: First available company
    if (companyRoles.length > 0) {
      const firstCompany = companyRoles[0];
      return {
        companyId: firstCompany.companyId,
        companyName: firstCompany.companyName,
        role: firstCompany.role,
        source: 'fallback' as const,
        isIntentional: false
      };
    }

    // No company available
    return null;
  }, [storedContext, activeCompanyRole, companyRoles]);

  // Switch to a different company (user intentional action)
  const switchCompany = useCallback(async (companyId: string) => {
    const targetRole = companyRoles.find(r => r.companyId === companyId);
    if (!targetRole) {
      console.error('[useCurrentCompany] Cannot switch to company not in user roles:', companyId);
      return;
    }
    // Update the service first (this marks it as intentional)
    CompanyContextService.setFromUserSelection(companyId, targetRole.companyName);

    // Then update the context
    await switchCompanyRole(companyId, {
      updateUserMetadata: true,
      navigateToCompany: false // Don't auto-navigate, let the caller decide
    });
  }, [companyRoles, effectiveCompany?.companyId, switchCompanyRole]);

  // Refresh context (keep session alive)
  const refreshContext = useCallback(() => {
    CompanyContextService.touch();
  }, []);

  // Check if a specific company is current
  const isCurrentCompany = useCallback((companyId: string) => {
    return effectiveCompany?.companyId === companyId;
  }, [effectiveCompany?.companyId]);

  return {
    companyId: effectiveCompany?.companyId || null,
    companyName: effectiveCompany?.companyName || null,
    role: effectiveCompany?.role || 'viewer',
    isLoading: isCompanyRoleLoading,
    isIntentionalSelection: effectiveCompany?.isIntentional || false,
    source: effectiveCompany?.source || null,
    switchCompany,
    refreshContext,
    isCurrentCompany
  };
}

/**
 * Hook to get just the company ID (for simpler use cases)
 */
export function useCurrentCompanyId(): string | null {
  const { companyId } = useCurrentCompany();
  return companyId;
}

/**
 * Hook to check if company context is ready
 */
export function useCompanyContextReady(): boolean {
  const { companyId, isLoading } = useCurrentCompany();
  return !isLoading && companyId !== null;
}
