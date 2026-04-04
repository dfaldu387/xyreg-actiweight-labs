import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useCompanyRole } from '@/context/CompanyRoleContext';

interface CompanyContextState {
  companyId: string | null;
  companyName: string | null;
  productId: string | null;
  lastUpdated: number;
}

const COMPANY_CONTEXT_KEY = 'xyreg_company_context';
const CONTEXT_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Hook to persist and recover company context across navigation
 * This solves the core issue of losing company context when navigating from product pages
 */
export function useCompanyContextPersistence() {
  const location = useLocation();
  const { companyRoles, activeCompanyRole, switchCompanyRole } = useCompanyRole();
  const [persistedContext, setPersistedContext] = useState<CompanyContextState | null>(null);

  // Load persisted context from session storage
  const loadPersistedContext = useCallback((): CompanyContextState | null => {
    try {
      const stored = sessionStorage.getItem(COMPANY_CONTEXT_KEY);
      if (!stored) return null;

      const context: CompanyContextState = JSON.parse(stored);
      
      // Check if context is expired
      if (Date.now() - context.lastUpdated > CONTEXT_EXPIRY_MS) {
        sessionStorage.removeItem(COMPANY_CONTEXT_KEY);
        return null;
      }

      return context;
    } catch (error) {
      console.error('[CompanyContextPersistence] Error loading persisted context:', error);
      return null;
    }
  }, []);

  // Save context to session storage
  const saveContext = useCallback((context: Partial<CompanyContextState>) => {
    try {
      const currentContext = loadPersistedContext() || {
        companyId: null,
        companyName: null,
        productId: null,
        lastUpdated: Date.now()
      };

      const updatedContext: CompanyContextState = {
        ...currentContext,
        ...context,
        lastUpdated: Date.now()
      };

      sessionStorage.setItem(COMPANY_CONTEXT_KEY, JSON.stringify(updatedContext));
      setPersistedContext(updatedContext);
      
      // console.log('[CompanyContextPersistence] Context saved:', updatedContext);
    } catch (error) {
      console.error('[CompanyContextPersistence] Error saving context:', error);
    }
  }, [loadPersistedContext]);

  // Clear persisted context
  const clearContext = useCallback(() => {
    sessionStorage.removeItem(COMPANY_CONTEXT_KEY);
    setPersistedContext(null);
  }, []);

  // Derive company context from current URL and state
  const deriveCompanyContext = useCallback(() => {
    const pathname = location.pathname;
    
    // Extract company from URL
    const companyMatch = pathname.match(/\/app\/company\/([^\/]+)/);
    if (companyMatch) {
      const companyName = decodeURIComponent(companyMatch[1]);
      const companyRole = companyRoles.find(role => 
        role.companyName.toLowerCase() === companyName.toLowerCase()
      );
      
      if (companyRole) {
        return {
          companyId: companyRole.companyId,
          companyName: companyRole.companyName
        };
      }
    }

    // Extract product ID and derive company
    const productMatch = pathname.match(/\/app\/product\/([^\/]+)/);
    if (productMatch) {
      const productId = productMatch[1];
      
      if (activeCompanyRole) {
        return {
          companyId: activeCompanyRole.companyId,
          companyName: activeCompanyRole.companyName,
          productId
        };
      }
    }

    return null;
  }, [location.pathname, companyRoles, activeCompanyRole]);

  // Auto-save context when it changes
  useEffect(() => {
    const derivedContext = deriveCompanyContext();
    if (derivedContext) {
      saveContext(derivedContext);
    }
  }, [deriveCompanyContext, saveContext]);

  // Load persisted context on mount
  useEffect(() => {
    const loaded = loadPersistedContext();
    if (loaded) {
      setPersistedContext(loaded);
    }
  }, [loadPersistedContext]);

  // DISABLED: This function was causing race conditions by overriding URL-based context
  // useCompanyRoles.ts already handles sessionStorage recovery during initialization
  // Keeping the function signature for backwards compatibility but making it a no-op
  const recoverCompanyContext = useCallback(async () => {
    // console.log('[company-context-issue] recoverCompanyContext - DISABLED (redundant with useCompanyRoles.ts)');
    return false;
  }, []);

  const getEffectiveCompanyContext = useCallback(() => {
    
    if (activeCompanyRole) {
      return {
        companyId: activeCompanyRole.companyId,
        companyName: activeCompanyRole.companyName
      };
    }

    if (persistedContext && persistedContext.companyId) {
      return {
        companyId: persistedContext.companyId,
        companyName: persistedContext.companyName
      };
    }

    const derived = deriveCompanyContext();
    return derived;
  }, [activeCompanyRole, persistedContext, deriveCompanyContext]);

  return {
    persistedContext,
    saveContext,
    clearContext,
    recoverCompanyContext,
    getEffectiveCompanyContext,
    deriveCompanyContext
  };
}
