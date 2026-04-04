
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedPhaseUpdateService } from '@/services/unifiedPhaseUpdateService';
import { resolveToCompanyUuid, isValidUuid } from '@/utils/companyIdResolver';

export interface PhaseProduct {
  id: string;
  name: string;
  status: "On Track" | "At Risk" | "Needs Attention";
  progress: number;
  phase: string;
  phaseId: string | null;
  company: string;
  company_id: string; // Add missing company_id property
  description?: string;
  class?: string;
  image?: string;
  targetDate?: string;
  isMoveBlocked?: boolean;
  is_archived?: boolean;
  project_types?: string[];
  is_line_extension?: boolean;
  parent_product_id?: string;
  regulatoryCompliance?: {
    mdr: number;
    iso: number;
    qsrPart820: number;
  };
}

interface Company {
  id: string;
  name: string;
}

interface CompanyStats {
  totalProducts: number;
  onTrack: number;
  atRisk: number;
  needsAttention: number;
}

interface PhaseHealth {
  healthScore: number;
  mappedProducts: number;
  unmappedProducts: number;
  totalProducts: number;
}

interface UseCompanyProductsOptions {
  enabled?: boolean;
}

export function useCompanyProducts(companyIdentifier: string, options: UseCompanyProductsOptions = {}) {
  const { enabled = true } = options;
  const [products, setProducts] = useState<PhaseProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedCompanyId, setResolvedCompanyId] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const resolveTimeoutRef = useRef<NodeJS.Timeout>();
  const queryClient = useQueryClient();
  const previousCompanyIdRef = useRef<string | null>(null);

  // Resolve company identifier to UUID with timeout
  useEffect(() => {
    const resolveCompany = async () => {
      if (!enabled || !companyIdentifier || companyIdentifier.trim() === '') {
        setError(null);
        setResolvedCompanyId(null);
        setProducts([]); // Clear products immediately when company changes
        return;
      }

      // Clear products immediately when company identifier changes
      if (previousCompanyIdRef.current && previousCompanyIdRef.current !== companyIdentifier) {
        setProducts([]);
        // Clear React Query cache for the previous company
        await queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return (
              queryKey.includes('company-products') ||
              queryKey.includes('products') ||
              queryKey.includes(previousCompanyIdRef.current)
            );
          }
        });
      }
      
      previousCompanyIdRef.current = companyIdentifier;

      // Clear any existing timeout
      if (resolveTimeoutRef.current) {
        clearTimeout(resolveTimeoutRef.current);
      }

      try {
        // If it's already a UUID, use it directly
        if (isValidUuid(companyIdentifier)) {
          setResolvedCompanyId(companyIdentifier);
          return;
        }

        // Set a timeout for company resolution
        const timeoutPromise = new Promise<never>((_, reject) => {
          resolveTimeoutRef.current = setTimeout(() => {
            reject(new Error('Company resolution timeout'));
          }, 10000); // 10 second timeout
        });

        const resolutionPromise = resolveToCompanyUuid(companyIdentifier);
        
        const resolved = await Promise.race([resolutionPromise, timeoutPromise]);
        
        // Clear timeout if resolution completed
        if (resolveTimeoutRef.current) {
          clearTimeout(resolveTimeoutRef.current);
        }

        if (!resolved) {
          const errorMsg = `Company "${companyIdentifier}" not found`;
          setError(errorMsg);
          return;
        }

        setResolvedCompanyId(resolved);
      } catch (error) {
        if (resolveTimeoutRef.current) {
          clearTimeout(resolveTimeoutRef.current);
        }
        
        const errorMsg = error instanceof Error ? error.message : 'Failed to resolve company';
        console.error('[useCompanyProducts] Failed to resolve company identifier:', error);
        setError(errorMsg);
      }
    };

    resolveCompany();

    // Cleanup timeout on unmount
    return () => {
      if (resolveTimeoutRef.current) {
        clearTimeout(resolveTimeoutRef.current);
      }
    };
  }, [companyIdentifier, enabled, queryClient]);

  // Validate resolved company ID before proceeding
  const isValidCompanyId = resolvedCompanyId && isValidUuid(resolvedCompanyId);

  const fetchProducts = useCallback(async (respectActiveUpdates: boolean = true) => {
    if (!enabled || !isValidCompanyId || fetchingRef.current) {
      return;
    }

    try {
      fetchingRef.current = true;
      setIsLoading(true);
      setError(null);

      // Add timeout to product fetching
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Product fetch timeout')), 15000);
      });

      const fetchPromise = supabase
        .from('products')
        .select(`
          *,
          lifecycle_phases(
            id,
            phase_id,
            name,
            is_current_phase,
            status,
            progress
          )
        `)
        .eq('company_id', resolvedCompanyId)
        .eq('is_archived', false);

      const { data: productsData, error: productsError } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]);

      if (productsError) {
        console.error('[useCompanyProducts] Supabase error:', productsError);
        throw new Error(`Failed to fetch products: ${productsError.message}`);
      }

      const processedProducts: PhaseProduct[] = (productsData || []).map(product => {
        // Find the current lifecycle phase from the array
        const currentLifecyclePhase = Array.isArray(product.lifecycle_phases) 
          ? product.lifecycle_phases.find(lp => lp.is_current_phase)
          : null;
        
        // Safely handle project_types JSONB field
        const safeProjectTypes = (() => {
          if (!product.project_types) return [];
          if (Array.isArray(product.project_types)) {
            return product.project_types.filter(type => typeof type === 'string') as string[];
          }
          return [];
        })();
        
        return {
          id: product.id,
          name: product.name,
          status: (product.status as "On Track" | "At Risk" | "Needs Attention") || "On Track",
          progress: product.progress || 0,
          phase: currentLifecyclePhase?.name || "",
          phaseId: currentLifecyclePhase?.phase_id || null,
          company: resolvedCompanyId,
          company_id: resolvedCompanyId, // Add the required company_id
          description: product.description,
          trade_name: product.trade_name,
          class: product.class,
          image: product.image,
          targetDate: product.projected_launch_date,
          isMoveBlocked: false,
          is_archived: product.is_archived || false,
          project_types: safeProjectTypes,
          is_line_extension: product.is_line_extension || false,
          parent_product_id: product.parent_product_id || null,
          regulatoryCompliance: {
            mdr: parseInt(product.id.substring(0, 8), 16) % 30 + 50,
            iso: parseInt(product.id.substring(8, 16), 16) % 25 + 55,
            qsrPart820: parseInt(product.id.substring(16, 24), 16) % 35 + 45
          }
        };
      });

      setProducts(processedProducts);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch products';
      console.error('[useCompanyProducts] Error fetching products:', error);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [resolvedCompanyId, isValidCompanyId, enabled]);

  // Set up real-time subscription only when enabled and we have valid UUID
  useEffect(() => {
    if (!enabled || !isValidCompanyId) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    const channel = supabase
      .channel(`company-products-${resolvedCompanyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `company_id=eq.${resolvedCompanyId}`
        },
        (payload) => {
          setTimeout(() => fetchProducts(false), 1500);
        }
      )
      // REMOVED: lifecycle_phases subscription without company filter was causing
      // continuous API calls. The products subscription already handles updates,
      // and lifecycle_phases data is fetched via the products join.
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [resolvedCompanyId, isValidCompanyId, enabled]); // Removed fetchProducts to prevent loops

  // Fetch products when enabled and we have valid company ID
  useEffect(() => {
    if (enabled && isValidCompanyId) {
      fetchProducts();
    }
  }, [resolvedCompanyId, isValidCompanyId, enabled]); // Removed fetchProducts to prevent loops

  // Calculate company stats
  const companyStats: CompanyStats = {
    totalProducts: products.length,
    onTrack: products.filter(p => p.status === "On Track").length,
    atRisk: products.filter(p => p.status === "At Risk").length,
    needsAttention: products.filter(p => p.status === "Needs Attention").length
  };

  // Calculate phase health
  const phaseHealth: PhaseHealth = {
    totalProducts: products.length,
    mappedProducts: products.filter(p => p.phaseId).length,
    unmappedProducts: products.filter(p => !p.phaseId).length,
    healthScore: products.length > 0 ? Math.round((products.filter(p => p.phaseId).length / products.length) * 100) : 100
  };

  return {
    products,
    isLoading,
    error,
    companyId: resolvedCompanyId,
    companyStats,
    phaseHealth,
    refetch: () => fetchProducts(false)
  };
}
