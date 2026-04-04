
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductMarket, EnhancedProductMarket } from '@/types/client';
import { fetchProductGapItems } from '@/services/gapAnalysisService';
import { parseImagesFromStorage } from '@/utils/imageDataUtils';

interface UseProductDetailsOptions {
  enabled?: boolean;
  refetchOnMount?: boolean | 'always';
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
}

export function useProductDetails(productId: string | undefined, options: UseProductDetailsOptions = {}) {
  const {
    enabled = true,
    refetchOnMount = true, // Changed to true to ensure data loads on navigation
    refetchOnWindowFocus = false,
    staleTime = 0 // Always fetch fresh data to keep UI in sync
  } = options;

  return useQuery({
    queryKey: ['productDetails', productId],
    queryFn: async (): Promise<Product | null> => {
      if (!productId) {
        console.warn('[useProductDetails] No productId provided');
        return null;
      }

      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            companies(name),
            base_product:products!parent_product_id(id, name),
            lifecyclePhases:lifecycle_phases(
              id,
              name,
              description,
              status,
              progress,
              is_current_phase,
              deadline,
              phase_id,
              likelihood_of_success
            )
          `)
          .eq('id', productId)
          .eq('is_archived', false)
          .maybeSingle();

        if (error) {
          console.error('[useProductDetails] Supabase error:', error);
          throw new Error(`Failed to fetch product: ${error.message}`);
        }
        if (!data) {
          console.warn(`[useProductDetails] Product with ID ${productId} not found`);
          return null;
        }

        // Fetch gap analysis items from database
        let gapAnalysisItems = [];
        try {
          gapAnalysisItems = await fetchProductGapItems(productId);
        } catch (gapError) {
          console.warn('[useProductDetails] Failed to fetch gap analysis items:', gapError);
        }

        // Process and cast the markets data properly
        let processedMarkets: ProductMarket[] | EnhancedProductMarket[] = [];
        if (data.markets) {
          try {
            const marketsArray = Array.isArray(data.markets) ? data.markets : [];
            processedMarkets = marketsArray as unknown as ProductMarket[] | EnhancedProductMarket[];
          } catch (e) {
            console.warn('[useProductDetails] Failed to process markets data:', e);
            processedMarkets = [];
          }
        }

        // Process device components
        let processedDeviceComponents: { name: string; description: string; }[] = [];
        if (data.device_components) {
          try {
            const componentsArray = Array.isArray(data.device_components) ? data.device_components : [];
            processedDeviceComponents = componentsArray as unknown as { name: string; description: string; }[];
          } catch (e) {
            console.warn('[useProductDetails] Failed to process device_components data:', e);
            processedDeviceComponents = [];
          }
        }

        // Process videos field - convert string to array if needed
        let processedVideos: string[] = [];
        if (data.videos) {
          try {
            if (typeof data.videos === 'string') {
              try {
                const parsed = JSON.parse(data.videos);
                processedVideos = Array.isArray(parsed) ? parsed : [];
              } catch {
                processedVideos = [data.videos];
              }
            } else if (Array.isArray(data.videos)) {
              processedVideos = data.videos as string[];
            }
          } catch (e) {
            console.warn('[useProductDetails] Failed to process videos data:', e);
            processedVideos = [];
          }
        }

        // Process images field - ensure proper sanitization and array format
        let processedImages: string[] = [];
        if (data.images) {
          try {
            processedImages = parseImagesFromStorage(data.images);
          } catch (e) {
            console.warn('[useProductDetails] Failed to process images data:', e);
            processedImages = [];
          }
        }

        // Process lifecycle phases to ensure it's always an array
        let processedLifecyclePhases: any[] = [];
        if (data.lifecyclePhases) {
          try {
            processedLifecyclePhases = Array.isArray(data.lifecyclePhases) ? data.lifecyclePhases : [];
          } catch (e) {
            console.warn('[useProductDetails] Failed to process lifecyclePhases data:', e);
            processedLifecyclePhases = [];
          }
        }

        // Process other JSON fields safely
        const processedKeyFeatures = data.key_features || [];
        const processedClinicalBenefits = Array.isArray(data.clinical_benefits) ? data.clinical_benefits as unknown as string[] : [];
        const processedIntendedUsers = Array.isArray(data.intended_users) ? data.intended_users as unknown as string[] : [];
        const processedIsoCertifications = Array.isArray(data.iso_certifications) ? data.iso_certifications as unknown as string[] : [];
        const processedDeviceCompliance = Array.isArray(data.device_compliance) ? data.device_compliance as unknown as string[] : [];
        const processedUserInstructions = (data.user_instructions && typeof data.user_instructions === 'object')
          ? data.user_instructions as unknown as { how_to_use?: string; charging?: string; maintenance?: string; }
          : {};
        const processedIntendedPurposeData = (data.intended_purpose_data && typeof data.intended_purpose_data === 'object')
          ? data.intended_purpose_data as unknown as any
          : {};

        // Return the product with properly typed fields
        return {
          ...data,
          company: data.companies?.name,
          base_product_name: data.base_product?.name || null,
          markets: processedMarkets,
          device_components: processedDeviceComponents,
          key_features: processedKeyFeatures,
          clinical_benefits: processedClinicalBenefits,
          intended_users: processedIntendedUsers,
          iso_certifications: processedIsoCertifications,
          device_compliance: processedDeviceCompliance,
          user_instructions: processedUserInstructions,
          intended_purpose_data: processedIntendedPurposeData,
          videos: processedVideos,
          images: processedImages,
          lifecyclePhases: processedLifecyclePhases,
          gapAnalysis: gapAnalysisItems
        } as unknown as Product;

      } catch (error) {
        console.error('[useProductDetails] Error in queryFn:', error);
        throw error;
      }
    },
    enabled: Boolean(productId) && enabled,
    staleTime,
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount,
    refetchOnWindowFocus,
    retry: (failureCount, error) => {
      console.error(`[useProductDetails] Query failed (attempt ${failureCount + 1}):`, error);
      return failureCount < 2; // Retry up to 2 times
    },
    retryDelay: (attemptIndex) => {
      return Math.min(1000 * 2 ** attemptIndex, 30000);
    }
  });
}
