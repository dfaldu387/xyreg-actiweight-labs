import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductGallery } from "@/components/product/ProductGallery";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RichTextField } from "@/components/shared/RichTextField";
import { Badge } from "@/components/ui/badge";
import { Package, Tag, Building, Activity, Link2, Calendar } from "lucide-react";
import { sanitizeImageArray, parseImagesFromStorage } from "@/utils/imageDataUtils";
import { detectProductType } from "@/utils/productTypeDetection";
import { Loader2 } from "lucide-react";

interface GeneralInformationTabProps {
  productName?: string;
  modelReference?: string;
  description?: string;
  deviceCategory?: string;
  deviceType?: string;
  keyFeatures?: string[];
  deviceComponents?: string[];
  images?: string[];
  videos?: string[];
  basicUdiDi?: string;
  udiDi?: string;
  udiPi?: string;
  gtin?: string;
  baseProductName?: string;
  productPlatform?: string;
  project_types?: string[];
  is_line_extension?: boolean;
  parent_product_id?: string;
  hasLineExtensions?: boolean;
  isLoading?: boolean;
  onProductNameChange?: (value: string) => void;
  onModelReferenceChange?: (value: string) => void;
  onDescriptionChange?: (value: string) => void;
  onDeviceCategoryChange?: (value: string) => void;
  onDeviceTypeChange?: (value: string) => void;
}

export function GeneralInformationTab({
  productName = "",
  modelReference = "",
  description = "",
  deviceCategory = "",
  deviceType = "",
  keyFeatures = [],
  deviceComponents = [],
  images = [],
  videos = [],
  basicUdiDi = "",
  udiDi = "",
  udiPi = "",
  gtin = "",
  baseProductName,
  productPlatform,
  project_types,
  is_line_extension,
  parent_product_id,
  hasLineExtensions,
  isLoading = false,
  onProductNameChange,
  onModelReferenceChange,
  onDescriptionChange,
  onDeviceCategoryChange,
  onDeviceTypeChange
}: GeneralInformationTabProps) {
  
  // Process images with enhanced error handling
  const processedImages = React.useMemo(() => {
    try {
      return parseImagesFromStorage(images);
    } catch (error) {
      console.error('Error processing images:', error);
      return sanitizeImageArray(images);
    }
  }, [images]);

  // Detect product type
  const productType = detectProductType({
    project_types,
    is_line_extension,
    parent_product_id
  });

  // Get platform display text
  const getProductPlatformDisplay = (): string => {
    switch (productType) {
      case 'new_product':
        if (hasLineExtensions) {
          return productPlatform ? `${productPlatform} (Original)` : 'Required (used as platform)';
        }
        return productPlatform || 'N/A';
      case 'line_extension':
        return productPlatform || 'Not specified';
      case 'existing_product':
        return 'N/A';
      default:
        return 'N/A';
    }
  };

  const platformDisplayText = getProductPlatformDisplay();
  const shouldShowBaseProduct = productType === 'existing_product' && baseProductName;
  const shouldShowPlatform = (productType === 'line_extension' || (productType === 'new_product' && hasLineExtensions)) && platformDisplayText !== 'N/A';

  return (
    <div className="space-y-6">
      {/* Product Media Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Media
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductGallery 
            images={processedImages} 
            videos={sanitizeImageArray(videos)} 
            productName={productName} 
          />
        </CardContent>
      </Card>

      {/* Basic Product Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Basic Product Information
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Product Name</Label>
               <Input
                id="product-name"
                value={productName}
                onChange={(e) => onProductNameChange?.(e.target.value)}
                placeholder="Enter product name..."
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                data-form-type="other"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="model-reference">Model / Reference</Label>
              <Input
                id="model-reference"
                value={modelReference}
                onChange={(e) => onModelReferenceChange?.(e.target.value)}
                placeholder="Enter model reference..."
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Device Description</Label>
            <RichTextField
              value={description || ''}
              onChange={(html) => onDescriptionChange?.(html)}
              placeholder="Provide a detailed description of the device..."
              minHeight="100px"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="device-category">Device Category</Label>
              <Input
                id="device-category"
                value={deviceCategory}
                onChange={(e) => onDeviceCategoryChange?.(e.target.value)}
                placeholder="Enter device category..."
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="device-type">Device Type</Label>
              <Input
                id="device-type"
                value={deviceType}
                onChange={(e) => onDeviceTypeChange?.(e.target.value)}
                placeholder="Enter device type..."
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Relationships */}
      {(shouldShowBaseProduct || shouldShowPlatform) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Product Relationships
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {shouldShowBaseProduct && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Building className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium text-blue-800">Base Product:</span>
                <span className="text-sm text-blue-700">{baseProductName}</span>
                <Badge variant="outline" className="text-blue-700 border-blue-300">Product Upgrade</Badge>
              </div>
            )}
            
            {shouldShowPlatform && (
              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <Package className="h-4 w-4 text-purple-600 flex-shrink-0" />
                <span className="text-sm font-medium text-purple-800">Product Platform:</span>
                <span className="text-sm text-purple-700">{platformDisplayText}</span>
                <Badge variant="outline" className="text-purple-700 border-purple-300">
                  {productType === 'line_extension' ? 'Line Extension' : 'Platform Product'}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Key Features & Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            {keyFeatures.length > 0 ? (
              <div className="space-y-2">
                {keyFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No key features specified</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Device Components</CardTitle>
          </CardHeader>
          <CardContent>
            {deviceComponents.length > 0 ? (
              <div className="space-y-2">
                {deviceComponents.map((component, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Package className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{component}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No components specified</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* UDI Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            UDI Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium min-w-[100px]">Basic UDI-DI:</span>
                <span className="text-sm text-muted-foreground">{basicUdiDi || "Not specified"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium min-w-[100px]">UDI-DI:</span>
                <span className="text-sm text-muted-foreground">{udiDi || "Not specified"}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium min-w-[100px]">UDI-PI:</span>
                <span className="text-sm text-muted-foreground">{udiPi || "Not specified"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium min-w-[100px]">GTIN:</span>
                <span className="text-sm text-muted-foreground">{gtin || "Not specified"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}