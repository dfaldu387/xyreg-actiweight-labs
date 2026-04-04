
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ProductGallery } from "@/components/product/ProductGallery";
import { Calendar, Tag, Activity, Clipboard, Building, Link2, Package } from "lucide-react";
import { sanitizeImageArray } from "@/utils/imageDataUtils";
import { MultiMarketStatusDisplay } from "@/components/product/MultiMarketStatusDisplay";
import { EnhancedProductMarket } from "@/types/client";
import { detectProductType } from "@/utils/productTypeDetection";

interface DeviceOverviewTabSectionProps {
  productName?: string;
  modelReference?: string;
  basicUdiDi?: string;
  udiDi?: string;
  deviceClass?: string;
  productClass?: string;
  intendedUse?: string;
  deviceCategory?: string;
  conformityAssessmentRoute?: string;
  notifiedBody?: string;
  designFreezeDate?: string | null;
  currentLifecyclePhase?: string;
  images?: string[];
  videos?: string[];
  markets?: EnhancedProductMarket[];
  // Add product type detection props
  project_types?: string[];
  is_line_extension?: boolean;
  parent_product_id?: string;
  base_product_name?: string;
  baseProductName?: string;
  productPlatform?: string;
}

export function DeviceOverviewTabSection({
  productName = "Product Name",
  modelReference,
  basicUdiDi,
  udiDi,
  intendedUse,
  deviceCategory,
  notifiedBody,
  designFreezeDate,
  currentLifecyclePhase,
  images = [],
  videos = [],
  markets = [],
  productClass,
  project_types,
  is_line_extension,
  parent_product_id,
  base_product_name,
  baseProductName,
  productPlatform
}: DeviceOverviewTabSectionProps) {
  console.log('🔧 [DeviceOverviewTabSection] Processing images:', images);
  
  // Process images using the enhanced utility with consistent error handling
  const processedImages = React.useMemo(() => {
    try {
      return sanitizeImageArray(images);
    } catch (error) {
      console.error('❌ [DeviceOverviewTabSection] Error processing images:', error);
      return [];
    }
  }, [images]);

  console.log('🔧 [DeviceOverviewTabSection] Processed images:', processedImages);

  // Detect product type
  const productType = detectProductType({
    project_types,
    is_line_extension,
    parent_product_id
  });

  // Use either baseProductName prop or base_product_name from parent
  const displayBaseProductName = baseProductName || base_product_name;
  
  // Determine what to show based on product type
  const shouldShowBaseProduct = productType === 'existing_product' && displayBaseProductName;
  const shouldShowPlatform = productType === 'line_extension' && productPlatform;

  return (
    <Card>
      <CardContent className="p-2 sm:p-3 lg:p-4">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Left side: Product Media Gallery */}
          <div className="flex flex-col space-y-2 sm:space-y-3">
            <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">Product Media</h3>
            <ProductGallery 
              images={processedImages} 
              videos={videos} 
              productName={productName} 
            />
          </div>

          {/* Right side: Device Info Table */}
          <div className="xl:col-span-2">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Device Overview</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-2 sm:gap-y-3 gap-x-3 sm:gap-x-4">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Product Name:</span>
                <span className="text-xs sm:text-sm truncate">{productName}</span>
              </div>
              
              {/* Display base product information for product upgrades */}
              {shouldShowBaseProduct && (
                <div className="flex items-center gap-2 lg:col-span-2">
                  <Link2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-blue-800">Base Product:</span>
                  <span className="text-xs sm:text-sm text-blue-700 truncate">{displayBaseProductName}</span>
                </div>
              )}
              
              {/* Display product platform for line extensions */}
              {shouldShowPlatform && (
                <div className="flex items-center gap-2 lg:col-span-2">
                  <Package className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-purple-800">Product Platform:</span>
                  <span className="text-xs sm:text-sm text-purple-700 truncate">{productPlatform}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Model / Reference:</span>
                <span className="text-xs sm:text-sm truncate">{modelReference || "Not specified"}</span>
              </div>
              {udiDi && (
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">UDI-DI:</span>
                  <span className="text-xs sm:text-sm truncate">{udiDi}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Basic UDI-DI:</span>
                <span className="text-xs sm:text-sm truncate">{basicUdiDi || "Not specified"}</span>
              </div>
              <div className="flex items-start gap-2 lg:col-span-2">
                <Clipboard className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Intended Purpose:</span>
                {intendedUse ? (
                  <span className="text-xs sm:text-sm break-words line-clamp-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: intendedUse }} />
                ) : (
                  <span className="text-xs sm:text-sm">Not specified</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Medical Device Type:</span>
                <span className="text-xs sm:text-sm truncate">{deviceCategory || "Not specified"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Notified Body:</span>
                <span className="text-xs sm:text-sm truncate">{notifiedBody || "Not specified"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Design Freeze Date:</span>
                <span className="text-xs sm:text-sm truncate">
                  {designFreezeDate ? new Date(designFreezeDate).toLocaleDateString() : "Not specified"}
                </span>
              </div>
              <div className="flex items-center gap-2 lg:col-span-2">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Current Lifecycle Phase:</span>
                <span className="text-xs sm:text-sm truncate">{currentLifecyclePhase || "Not specified"}</span>
              </div>
              
              {/* Multi-Market Regulatory Status Section */}
              <div className="lg:col-span-2 space-y-2 sm:space-y-3">
                <h4 className="text-sm sm:text-base font-medium">Regulatory Information</h4>
                <MultiMarketStatusDisplay markets={markets} productClass={productClass} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
