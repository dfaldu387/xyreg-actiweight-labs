import React from "react";
import { Product } from "@/types/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Tag, Activity, Clipboard, Building } from "lucide-react";
import { repairImageData } from "@/utils/imageDataUtils";
import { ProductGallery } from "@/components/product/ProductGallery";
import { MediaHeader } from "@/components/product/MediaHeader";
import { MultiMarketStatusDisplay } from "@/components/product/MultiMarketStatusDisplay";
import { EnhancedProductMarket } from "@/types/client";
import { useQuery } from '@tanstack/react-query';
import { HierarchicalMarketService } from "@/services/hierarchicalMarketService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
interface ProductOverviewSectionProps {
  product: Product | null | undefined;
}

interface CompanyData {
  website?: string;
}
export function ProductOverviewSection({
  product
}: ProductOverviewSectionProps) {
  const { toast } = useToast();
  
  if (!product) return null;

  // Use hierarchical market inheritance to get effective markets
  const { data: marketChain } = useQuery({
    queryKey: ['effective-markets', product.id],
    queryFn: () => HierarchicalMarketService.resolveEffectiveMarkets(product.id),
    enabled: !!product.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch company data for manufacturer website and name
  const { data: companyData } = useQuery<CompanyData & { name?: string }>({
    queryKey: ['company', product.company_id],
    queryFn: async () => {
      if (!product.company_id) return {};
      
      const { data, error } = await supabase
        .from('companies')
        .select('website, name')
        .eq('id', product.company_id)
        .single();
      
      if (error) {
        console.error('Error fetching company data:', error);
        return {};
      }
      
      return data || {};
    },
    enabled: !!product.company_id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Process images and videos
  console.log('🎯 [ProductOverview] Starting media processing for product:', product.name);
  const images = repairImageData(product.image);

  // Parse videos from the new videos field
  const videos: string[] = (() => {
    if (!product.videos) return [];
    try {
      // If it's already an array, return it
      if (Array.isArray(product.videos)) return product.videos;

      // If it's a string, try to parse as JSON
      if (typeof product.videos === 'string') {
        const parsed = JSON.parse(product.videos);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch (error) {
      console.warn('⚠️ [ProductOverview] Failed to parse videos:', error);
      return [];
    }
  })();
  console.log('🎯 [ProductOverview] Final processed media - Images:', images.length, 'Videos:', videos.length);

  // Get current lifecycle phase with proper array validation
  const lifecyclePhases = Array.isArray(product.lifecyclePhases) ? product.lifecyclePhases : [];
  const currentPhase = lifecyclePhases.find(phase => phase.isCurrentPhase);

  // Use effective markets from hierarchical inheritance instead of product.markets
  const enhancedMarkets: EnhancedProductMarket[] = marketChain?.effectiveMarkets || [];
  
  // Handle image selection from search
  const handleImageSelect = async (imageUrl: string) => {
    // Here you would typically save the image to your product
    // For now, we'll just show a success message
    toast({
      title: "Image selected",
      description: "The image has been added to your product media.",
    });
  };

  // Debug logging
  // Extract trade name from product data
  const tradeName = (() => {
    const rawTradeName = product.trade_name ||
                        (product as any).eudamed_trade_names ||
                        (product.key_features as any)?.eudamed_data?.trade_names;

    if (!rawTradeName) return undefined;

    // Handle different data types
    if (typeof rawTradeName === 'string') {
      return rawTradeName.split(',')[0]?.trim() || rawTradeName;
    } else if (Array.isArray(rawTradeName)) {
      return rawTradeName[0];
    } else if (typeof rawTradeName === 'object' && rawTradeName !== null) {
      return (rawTradeName as any).trade_names || undefined;
    }
    return String(rawTradeName);
  })();

  console.log('[ProductOverviewSection] Product:', product.name);
  console.log('[ProductOverviewSection] Trade name:', tradeName);
  console.log('[ProductOverviewSection] Market chain:', marketChain);
  console.log('[ProductOverviewSection] Effective markets:', enhancedMarkets);
  return <Card>
      <CardContent className="p-2 sm:p-3 lg:p-4">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Left side: Product Media Gallery */}
          <div className="flex flex-col space-y-2 sm:space-y-3">
            <MediaHeader
              productName={product.name}
              tradeName={tradeName}
              companyWebsite={companyData?.website}
              companyName={companyData?.name}
              companyId={product.company_id}
              onImageSelect={handleImageSelect}
              onImagesSelect={(imageUrls) => {
                console.log('🔄 [ProductOverviewSection] onImagesSelect called with:', imageUrls);
                imageUrls.forEach(url => handleImageSelect(url));
              }}
            />
            <ProductGallery images={images} videos={videos} productName={product.name} />
          </div>

          {/* Right side: Device Info Table */}
          <div className="xl:col-span-2">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Device Overview</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-2 sm:gap-y-3 gap-x-3 sm:gap-x-4">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Product Name:</span>
                <span className="text-xs sm:text-sm truncate">{product.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Model / Reference:</span>
                <span className="text-xs sm:text-sm truncate">{product.model_reference || product.model_version || "Not specified"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Basic UDI-DI:</span>
                <span className="text-xs sm:text-sm truncate">{product.basic_udi_di || "Not specified"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Risk Class (EU MDR):</span>
                <span className="text-xs sm:text-sm">{product.class || "Not specified"}</span>
              </div>
              <div className="flex items-start gap-2 lg:col-span-2">
                <Clipboard className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Intended Purpose:</span>
                {product.intended_use ? (
                  <span className="text-xs sm:text-sm break-words line-clamp-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: product.intended_use }} />
                ) : (
                  <span className="text-xs sm:text-sm">Not specified</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Medical Device Type:</span>
                <span className="text-xs sm:text-sm truncate">{product.device_category || "Not specified"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Conformity Route:</span>
                <span className="text-xs sm:text-sm truncate">{product.conformity_assessment_route || product.conformity_route || "Not specified"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Notified Body:</span>
                <span className="text-xs sm:text-sm truncate">{product.notified_body || "Not specified"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Design Freeze Date:</span>
                <span className="text-xs sm:text-sm truncate">{product.design_freeze_date ? new Date(product.design_freeze_date).toLocaleDateString() : "Not specified"}</span>
              </div>
              <div className="flex items-center gap-2 lg:col-span-2">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Current Lifecycle Phase:</span>
                <span className="text-xs sm:text-sm truncate">{product.current_lifecycle_phase || currentPhase?.name || "Not specified"}</span>
              </div>
              
              {/* Multi-Market Regulatory Status Section - replaces single CE mark status */}
              <div className="lg:col-span-2 space-y-2 sm:space-y-3">
                <h4 className="text-sm sm:text-base font-medium">Regulatory Information</h4>
                <MultiMarketStatusDisplay markets={enhancedMarkets} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
}