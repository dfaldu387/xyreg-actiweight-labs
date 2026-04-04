
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { resolveCompanyToUuid } from '@/utils/simplifiedCompanyResolver';

export interface OptimizedProduct {
  id: string;
  name: string;
  company_id: string; // Required
  company: string; // Required - company name
  status: "On Track" | "At Risk" | "Needs Attention";
  progress: number;
  phase: string;
  phaseId: string | null;
  description?: string;
  class?: string;
  image?: string;
  images?: string | string[];
  targetDate?: string;
  launch_status?: 'pre_launch' | 'launched' | null;
  actual_launch_date?: string;
  post_market_surveillance_date?: string;
  project_types?: string[];
  is_line_extension?: boolean;
  parent_product_id?: string;
  product_platform?: string;
  model_reference?: string;
  product_category?: string;
  variant?: string; // Product variant display
  display_as_variant_group?: boolean;
  variant_group_summary?: any;
  variant_tags?: Record<string, string> | null;
  product_family_placeholder?: string | null;
  basic_udi_di?: string | null;
}

interface UseOptimizedCompanyProductsOptions {
  enabled?: boolean;
  platformFilter?: string; // New option to filter by platform
}

export function useOptimizedCompanyProducts(
  companyIdentifier: string,
  options: UseOptimizedCompanyProductsOptions = {}
) {
  const { enabled = true, platformFilter } = options;
  const [products, setProducts] = useState<OptimizedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!enabled || !companyIdentifier) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Resolve company ID
      const resolvedId = await resolveCompanyToUuid(companyIdentifier);

      if (!resolvedId) {
        const errorMsg = `Company "${companyIdentifier}" not found`;
        setError(errorMsg);
        setProducts([]);
        setIsLoading(false);
        return;
      }

      setCompanyId(resolvedId);

      // Fetch products in pages (PostgREST default max is ~1000 rows)
      const pageSize = 1000;
      let from = 0;
      let productsDataAll: any[] = [];
      while (true) {
        const to = from + pageSize - 1;
        // Enhanced query to include lifecycle phase information
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            name,
            company_id,
            status,
            progress,
            description,
            class,
            image,
            images,
            projected_launch_date,
            launch_status,
            actual_launch_date,
            post_market_surveillance_date,
            current_lifecycle_phase,
            project_types,
            is_line_extension,
            parent_product_id,
            product_platform,
            model_reference,
            device_category,
            eudamed_trade_names,
            trade_name,
            display_as_variant_group,
            variant_group_summary,
            variant_tags,
            product_family_placeholder,
            basic_udi_di,
            is_master_device,
            parent_relationship_type,
            companies!inner(name),
            lifecycle_phases(id, phase_id, is_current_phase, name, category_id, sub_section_id, company_phases(name))
          `)
          .eq('company_id', resolvedId)
          .eq('is_archived', false)
          .range(from, to);

        if (error) {
          throw new Error(`Failed to fetch products: ${error.message}`);
        }

        if (!data || data.length === 0) break;
        productsDataAll = productsDataAll.concat(data);
        if (data.length < pageSize) break;
        from += pageSize;
      }

      // Process products with proper type conversion and phase information
      let processedProducts: OptimizedProduct[] = (productsDataAll || []).map(product => {
        // Find current lifecycle phase
        const currentPhaseRecord = product.lifecycle_phases?.find(lp => lp.is_current_phase);
        const currentPhaseName = currentPhaseRecord?.company_phases?.name || currentPhaseRecord?.name || "Unassigned";
        
        return {
          id: product.id,
          name: product.name,
          company_id: product.company_id,
          company: product.companies?.name || companyIdentifier, // Add company name
          status: (product.status as "On Track" | "At Risk" | "Needs Attention") || "On Track",
          progress: product.progress || 0,
          phase: currentPhaseName, // Now shows actual lifecycle phase
          phaseId: currentPhaseRecord?.phase_id || null,
          description: product.description,
          class: product.class,
          image: product.image,
          images: product.images,
          targetDate: product.projected_launch_date,
          launch_status: product.launch_status,
          actual_launch_date: product.actual_launch_date,
          post_market_surveillance_date: product.post_market_surveillance_date,
          project_types: Array.isArray(product.project_types) ?
            product.project_types.filter(type => typeof type === 'string') as string[] :
            [],
          is_line_extension: product.is_line_extension || false,
          parent_product_id: product.parent_product_id,
          product_platform: product.product_platform, // Include product_platform
          model_reference: product.model_reference,
          product_category: product.device_category,
          eudamed_trade_names: (product as any).eudamed_trade_names, // Include EUDAMED trade names
          trade_name: (product as any).trade_name, // Include trade name
          variant: (() => {
            const tags = product.variant_tags;
            if (tags && typeof tags === 'object' && Object.keys(tags).length > 0) {
              return Object.values(tags).filter(Boolean).join(', ') || undefined;
            }
            if (product.parent_relationship_type === 'variant') return 'Variant';
            if (product.is_master_device) return 'Master';
            return undefined;
          })(),
          display_as_variant_group: product.display_as_variant_group,
          variant_group_summary: product.variant_group_summary
        };
      });

      // Enhanced platform filtering logic
      if (platformFilter) {
        // Get products that match the platform filter
        const directPlatformMatches = processedProducts.filter(product =>
          product.product_platform === platformFilter
        );

        // Get base products that are parents of line extensions in this platform
        const baseProductIds = new Set(
          directPlatformMatches
            .map(product => product.parent_product_id)
            .filter(Boolean)
        );

        // Include base products
        const baseProducts = processedProducts.filter(product =>
          baseProductIds.has(product.id)
        );

        // Combine and deduplicate
        const platformProducts = new Map();
        [...directPlatformMatches, ...baseProducts].forEach(product => {
          platformProducts.set(product.id, product);
        });

        processedProducts = Array.from(platformProducts.values());
      }

      setProducts(processedProducts);
      setError(null);

    } catch (error) {
      // More specific error handling
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch products';
      
      // Check if it's a network error and suggest retry
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network')) {
        setError(`Network error: ${errorMessage}. Please check your connection and try again.`);
      } else if (errorMessage.includes('timeout') || errorMessage.includes('too complex')) {
        setError(`Query timeout: The request took too long. This has been optimized, please retry.`);
      } else {
        setError(errorMessage);
      }
      
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [companyIdentifier, enabled, platformFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    isLoading,
    error,
    companyId,
    refetch: fetchProducts
  };
}
