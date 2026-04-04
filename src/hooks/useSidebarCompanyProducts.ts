
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/client';
import { resolveCompanyToUuid } from '@/utils/simplifiedCompanyResolver';
import { useAuth } from '@/context/AuthContext';

export interface SidebarProduct {
  id: string;
  name: string;
  company_id: string;
  company: string; // Add required company property
  current_phase?: string;
  progress?: number;
  status?: "On Track" | "At Risk" | "Needs Attention";
  class?: string;
  created_at?: string;
  updated_at?: string;
  project_types?: string[]; // Add missing field
  is_line_extension?: boolean; // Add missing field
  parent_product_id?: string; // Add missing field
  device_category?: string; // Product category for sidebar grouping
  product_platform?: string; // Product platform for sidebar grouping
  model_reference?: string; // Model reference for sidebar grouping
  udi_suffix?: string; // Last 6 digits of primary UDI-DI variant
  module_id?: string | null; // Module ID - if set, product should be hidden from sidebar
}

export function useSidebarCompanyProducts(companyIdentifier: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['sidebarCompanyProducts', companyIdentifier, userId],
    queryFn: async (): Promise<SidebarProduct[]> => {
      if (!companyIdentifier) {
        return [];
      }

      // Resolve company name to UUID if needed
      let companyId: string;
      
      // Check if it's already a UUID (simple check for UUID format)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(companyIdentifier)) {
        companyId = companyIdentifier;
      } else {
        // Resolve company name to UUID
        const resolvedId = await resolveCompanyToUuid(companyIdentifier);
        if (!resolvedId) {
          console.error('[useSidebarCompanyProducts] Could not resolve company:', companyIdentifier);
          return [];
        }
        companyId = resolvedId;
      }

      // Get company name to check if it's Zimmer
      const { data: companyData } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();
      
      const companyName = companyData?.name || '';
      const isZimmer = companyName.toLowerCase().includes('zimmer');

      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          company_id,
          progress,
          status,
          class,
          device_category,
          product_platform,
          model_reference,
          inserted_at,
          updated_at,
          project_types,
          is_line_extension,
          parent_product_id,
          model_id,
          basic_udi_di,
          udi_di,
          companies!inner(name),
          lifecycle_phases(
            name,
            is_current_phase
          ),
          product_udi_di_variants(
            generated_udi_di
          )
        `)
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('inserted_at', { ascending: false });

      if (error) {
        console.error('Error fetching sidebar products:', error);
        throw error;
      }

      // Filter products by user's device access restrictions
      let accessFilteredData = data || [];
      let hasActiveMatrixRestriction = false;
      if (userId) {
        // Check if user is owner or admin — they always see all devices
        const { data: accessRows, error: accessError } = await supabase
          .from('user_company_access')
          .select('access_level, is_primary, is_invite_user')
          .eq('user_id', userId)
          .eq('company_id', companyId)
          .limit(1);

        if (accessError) {
          console.error('Error fetching user company access:', accessError);
        }

        const accessData = accessRows?.[0] || null;
        const isOwner = accessData?.is_primary === true && !accessData?.is_invite_user;
        const isOwnerOrAdmin = isOwner || accessData?.access_level === 'admin';

        console.log('Device access check:', { userId, companyId, accessLevel: accessData?.access_level, isOwnerOrAdmin });

        if (!isOwnerOrAdmin) {
          const { data: matrixRows, error: matrixError } = await supabase
            .from('user_product_matrix')
            .select('product_ids')
            .eq('user_id', userId)
            .eq('company_id', companyId)
            .eq('is_active', true)
            .limit(1);

          if (matrixError) {
            console.error('Error fetching user product matrix:', matrixError);
          }

          const matrixData = matrixRows?.[0] || null;
          console.log('Matrix data:', { matrixData, productIds: matrixData?.product_ids, allProducts: accessFilteredData.map((p: any) => p.id) });

          if (matrixData && matrixData.product_ids && matrixData.product_ids.length > 0) {
            // User has specific device access — filter to only those products
            const allowedProductIds = new Set<string>(matrixData.product_ids);
            accessFilteredData = accessFilteredData.filter((product: any) => allowedProductIds.has(product.id));
            hasActiveMatrixRestriction = true;
            console.log('Filtered products:', accessFilteredData.length);
          }
          // No active matrix record means no restriction — user can access all devices
        }
        // Owners/admins see all devices (no filtering)
      }

      // Return all products — L2ContextualBar handles family grouping via useProductsByBasicUDI
      const filteredData = accessFilteredData;
      
      // Type assertion needed because Supabase types may not include module_id yet
      return filteredData.map((product: any) => {
        // Find current phase - now handles products without phases
        const currentPhase = Array.isArray(product.lifecycle_phases) 
          ? product.lifecycle_phases.find(phase => phase.is_current_phase)
          : null;

        // Safely handle project_types JSONB field
        const safeProjectTypes = (() => {
          if (!product.project_types) return [];
          if (Array.isArray(product.project_types)) {
            return product.project_types.filter(type => typeof type === 'string') as string[];
          }
          return [];
        })();

        // Compute UDI-DI suffix (last 6 digits) from first variant if available
        const udiSuffix = (() => {
          const variants = Array.isArray(product.product_udi_di_variants) ? product.product_udi_di_variants : [];
          const first = variants[0]?.generated_udi_di;
          if (!first) return undefined;
          const digits = String(first).replace(/\D/g, '');
          const last6 = digits.slice(-6);
          return last6 || undefined;
        })();

        // Extract module_id from product data (using type assertion since TypeScript types may not be updated yet)
        const moduleId = (product as any).model_id || undefined;
        return {
          id: product.id,
          name: product.name,
          company_id: product.company_id,
          company: product.companies?.name || '', // Add company name
          current_phase: currentPhase?.name || undefined, // Show undefined if no phases
          progress: product.progress || 0,
          status: (product.status as "On Track" | "At Risk" | "Needs Attention") || "On Track",
          class: product.class,
          device_category: product.device_category || undefined,
          product_platform: product.product_platform || undefined,
          model_reference: product.model_reference || undefined,
          created_at: product.inserted_at,
          updated_at: product.updated_at,
          project_types: safeProjectTypes, // Include project_types
          is_line_extension: product.is_line_extension || false, // Include is_line_extension
          parent_product_id: product.parent_product_id || undefined, // Include parent_product_id
          module_id: moduleId, // Will be undefined until column exists in database
          udi_suffix: udiSuffix,
        } as SidebarProduct;
      });
    },
    enabled: Boolean(companyIdentifier),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
