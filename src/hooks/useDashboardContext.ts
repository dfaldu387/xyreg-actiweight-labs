import { useReducer, useEffect, useCallback } from 'react';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'react-router-dom';

// Note: isReviewer is now fetched from AuthContext (cached during login) to avoid duplicate API calls

export type DashboardType = 'multi-company' | 'single-company' | 'single-product' | 'reviewer';

interface DashboardContext {
  dashboardType: DashboardType;
  companyCount: number;
  productCount: number;
  isReviewer: boolean;
  activeCompanyId: string | null;
  activeProductId: string | null;
  isLoading: boolean;
  isMissionControlOverlay: boolean;
  originalContext: {
    companyName?: string;
    productId?: string;
    returnTo?: string;
  } | null;
}

type DashboardAction = 
  | { type: 'SET_BASIC_CONTEXT'; payload: Partial<DashboardContext> }
  | { type: 'SET_ENHANCED_DATA'; payload: { isReviewer: boolean; productCount: number; activeProductId: string | null; dashboardType: DashboardType } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_MISSION_CONTROL_OVERLAY'; payload: { originalContext: DashboardContext['originalContext'] } };

function dashboardReducer(state: DashboardContext, action: DashboardAction): DashboardContext {
  switch (action.type) {
    case 'SET_BASIC_CONTEXT':
      return { ...state, ...action.payload };
    case 'SET_ENHANCED_DATA':
      return { ...state, ...action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_MISSION_CONTROL_OVERLAY':
      return { ...state, isMissionControlOverlay: true, originalContext: action.payload.originalContext };
    default:
      return state;
  }
}

const initialState: DashboardContext = {
  dashboardType: 'multi-company',
  companyCount: 0,
  productCount: 0,
  isReviewer: false,
  activeCompanyId: null,
  activeProductId: null,
  isLoading: true,
  isMissionControlOverlay: false,
  originalContext: null,
};

export function useDashboardContext(): DashboardContext {
  const { companyRoles, activeCompanyRole } = useCompanyRole();
  const { user, isReviewer: cachedIsReviewer } = useAuth();
  const location = useLocation();
  
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  const initializeContext = useCallback(async () => {
    if (!user) return;

    // Check if we're in Mission Control and preserve original context
    const isMissionControl = location.pathname === '/app/mission-control' || 
                             location.pathname.includes('/mission-control');
    
    // If not on mission control, reset to basic state and exit early
    if (!isMissionControl) {
      dispatch({
        type: 'SET_BASIC_CONTEXT',
        payload: {
          dashboardType: 'multi-company',
          companyCount: Math.max(companyRoles.length, 1),
          productCount: 0,
          isReviewer: false,
          activeCompanyId: null,
          activeProductId: null,
          isLoading: false,
          isMissionControlOverlay: false,
          originalContext: null,
        }
      });
      return;
    }
    const searchParams = new URLSearchParams(location.search);
    const returnTo = searchParams.get('returnTo');
    const companyFromReturn = returnTo?.match(/\/app\/company\/([^\/]+)/)?.[1];
    const productFromReturn = returnTo?.match(/\/product\/([^\/\?]+)/)?.[1];
    
    // Also check if we're directly on a company-specific mission control route
    const companyFromUrl = location.pathname.match(/\/app\/company\/([^\/]+)(?:\/mission-control)?/)?.[1];
    
    // Immediate initialization with available data
    const companyCount = Math.max(companyRoles.length, 1);
    let activeCompanyId = activeCompanyRole?.companyId || null;
    
    // If coming from a company context or directly on company mission control, use that company
    const targetCompanyName = companyFromReturn || companyFromUrl;
    if (targetCompanyName) {
      const decodedCompanyName = decodeURIComponent(targetCompanyName);
      let targetCompanyRole = companyRoles.find(role => 
        role.companyName === decodedCompanyName
      );
      
      if (!targetCompanyRole) {
        targetCompanyRole = companyRoles.find(role => 
          role.companyName.toLowerCase() === decodedCompanyName.toLowerCase()
        );
      }
      
      if (!targetCompanyRole) {
        targetCompanyRole = companyRoles.find(role => 
          role.companyName.toLowerCase().includes(decodedCompanyName.toLowerCase()) ||
          decodedCompanyName.toLowerCase().includes(role.companyName.toLowerCase())
        );
      }
      
      if (targetCompanyRole) {
        activeCompanyId = targetCompanyRole.companyId;
      }
    }
    
    // If in Mission Control and have original context, set overlay mode
    if (isMissionControl && returnTo) {
      dispatch({
        type: 'SET_MISSION_CONTROL_OVERLAY',
        payload: {
          originalContext: {
            companyName: companyFromReturn ? decodeURIComponent(companyFromReturn) : undefined,
            productId: productFromReturn,
            returnTo,
          }
        }
      });
    }
    
    // Enhanced data loading with timeout protection
    const enhanceWithData = async () => {
      try {
        // Use cached isReviewer from AuthContext instead of making a separate API call
        const isReviewer = cachedIsReviewer;

        // Only fetch product count if we have an active company
        let products: any[] = [];
        if (activeCompanyId) {
          const { data: productsData } = await Promise.race([
            supabase
              .from('products')
              .select('id')
              .eq('company_id', activeCompanyId)
              .eq('is_archived', false),
            new Promise<{ data: null }>((resolve) => setTimeout(() => resolve({ data: null }), 1000))
          ]) as { data: any[] | null };

          products = productsData || [];
        }

        const productCount = products.length;
        const activeProductId = productCount === 1 ? products[0]?.id || null : null;

        // Determine dashboard type based on context
        let finalDashboardType: DashboardType;
        
        // SECURITY FIX: Prioritize URL-based company context to prevent wrong company data access
        if (companyFromUrl || (companyFromReturn && returnTo)) {
          finalDashboardType = 'single-company';
        }
        // If single company with single product, use single-product
        else if (companyCount === 1 && productCount === 1) {
          finalDashboardType = 'single-product';
        }
        // If user is a reviewer AND accessing mission control without specific context, use reviewer dashboard
        // BUT only if they don't have company access (pure reviewer role)
        else if (isReviewer && !companyFromReturn && !returnTo && companyCount === 0) {
          finalDashboardType = 'reviewer';
        }
        // Default to multi-company for all other cases (including reviewers with company access)
        else {
          finalDashboardType = 'multi-company';
        }

        // Clear activeCompanyId for multi-company and reviewer views
        const finalActiveCompanyId = (finalDashboardType === 'multi-company' || finalDashboardType === 'reviewer') ? null : activeCompanyId;
        
        // Set complete context with all data
        dispatch({
          type: 'SET_BASIC_CONTEXT',
          payload: {
            dashboardType: finalDashboardType,
            companyCount,
            productCount,
            isReviewer,
            activeCompanyId: finalActiveCompanyId,
            activeProductId,
            isLoading: false,
          }
        });

      } catch (error) {
        // Fallback: Set basic multi-company context
        const fallbackDashboardType = (companyFromReturn && returnTo) ? 'single-company' : 'multi-company';
        const fallbackActiveCompanyId = fallbackDashboardType === 'multi-company' ? null : activeCompanyId;
        
        dispatch({
          type: 'SET_BASIC_CONTEXT',
          payload: {
            dashboardType: fallbackDashboardType,
            companyCount,
            activeCompanyId: fallbackActiveCompanyId,
            isLoading: false,
          }
        });
      }
    };

    // Run enhancement immediately
    await enhanceWithData();
  }, [user, companyRoles, activeCompanyRole?.companyId, location.pathname, location.search, cachedIsReviewer]);

  useEffect(() => {
    initializeContext();
  }, [initializeContext]);

  return state;
}