import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhaseProduct } from "@/hooks/useCompanyProductPhases";
import { FileText, ExternalLink, Package, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { detectProductType } from "@/utils/productTypeDetection";
import { formatDeviceClassLabel } from "@/utils/deviceClassUtils";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeImageArray } from "@/utils/imageDataUtils";

interface ProductCardProps {
  product: PhaseProduct;
  isBlocked?: boolean;
  isMoving?: boolean;
  isDraggable?: boolean;
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onClick?: () => void;
}

export function ProductCard({ 
  product, 
  isBlocked = false, 
  isMoving = false,
  isDraggable = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onClick
}: ProductCardProps) {
  const navigate = useNavigate();
  const [storageImage, setStorageImage] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  // Get images from database field first
  const databaseImages = React.useMemo(() => {
    return sanitizeImageArray(product.image);
  }, [product.image]);

  // Fetch first image from storage if no database image exists
  useEffect(() => {
    const fetchStorageImage = async () => {
      if (databaseImages.length > 0) {
        // We have database images, no need to fetch from storage
        console.log(`[ProductCard] ${product.name}: Using database image`);
        return;
      }

      console.log(`[ProductCard] ${product.name}: No database image, fetching from storage for ID: ${product.id}`);
      setIsLoadingImage(true);
      try {
        const { data, error } = await supabase.storage
          .from('product-images')
          .list('', {
            search: `${product.id}-`,
            limit: 1,
            offset: 0,
          });

        console.log(`[ProductCard] ${product.name}: Storage query result:`, { data, error });

        if (error || !data || data.length === 0) {
          console.log(`[ProductCard] ${product.name}: No storage images found`);
          setStorageImage(null);
          setIsLoadingImage(false);
          return;
        }

        // Get public URL for the first image
        const imageUrl = supabase.storage
          .from('product-images')
          .getPublicUrl(data[0].name).data.publicUrl;
        
        console.log(`[ProductCard] ${product.name}: Found storage image:`, imageUrl);
        setStorageImage(imageUrl);
      } catch (fetchError) {
        console.error(`[ProductCard] ${product.name}: Error fetching storage image:`, fetchError);
        setStorageImage(null);
      } finally {
        setIsLoadingImage(false);
      }
    };

    fetchStorageImage();
  }, [product.id, product.name, databaseImages.length]);

  // Determine which image to show
  const displayImage = databaseImages.length > 0 ? databaseImages[0] : storageImage;

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if dragging is active or if this is a draggable card
    if (isDragging || isDraggable) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    if (onClick) {
      onClick();
    }
  };

  const handleNavigateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/app/product/${product.id}/device-information`);
  };

  // Get status color class for the top strip
  const getStatusStripColor = (status: string) => {
    switch (status) {
      case "On Track":
        return "bg-green-500";
      case "At Risk":
        return "bg-red-500";
      case "Needs Attention":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  // Enhanced product type label to include platform name for line extensions
  const getProductTypeLabel = (productType: string, productPlatform?: string) => {
    switch (productType) {
      case 'new_product':
        return 'New Product';
      case 'existing_product':
        return 'Product Upgrade';
      case 'line_extension':
        return productPlatform ? `Line Extension (${productPlatform})` : 'Line Extension';
      case 'legacy_product':
        return 'Legacy Device';
      default:
        return 'Device';
    }
  };

  // Detect product type for this product
  const productType = detectProductType(product);
  const productTypeLabel = getProductTypeLabel(productType, product.product_platform);

  return (
    <Card 
      className={`overflow-hidden shadow-md transition-all duration-200 ${
        isMoving ? 'rotate-2 shadow-lg' : ''
      } ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
      onClick={handleCardClick}
    >
      {/* Status strip at the top */}
      <div className={`h-2 w-full ${getStatusStripColor(product.status)}`} />
      
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">
              {product.name}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              {product.class && (
                <Badge variant="outline" className="text-xs">
                  {formatDeviceClassLabel(product.class)}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {productTypeLabel}
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <Badge
              variant={product.status === "On Track" ? "default" : 
                      product.status === "At Risk" ? "destructive" : "secondary"}
              className="text-xs font-medium"
            >
              {product.status}
            </Badge>
            
            {displayImage ? (
              <div className="w-16 h-16 rounded overflow-hidden border shadow-sm bg-muted flex items-center justify-center">
                <img 
                  src={displayImage} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : isLoadingImage ? (
              <div className="w-16 h-16 rounded overflow-hidden border shadow-sm bg-muted flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded overflow-hidden border shadow-sm bg-muted flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Progress:</span>
            <span className="font-medium">{product.progress}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                productType === 'legacy_product' ? 'bg-gray-500' : 'bg-blue-600'
              }`} 
              style={{ width: `${product.progress}%` }}
            />
          </div>

          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Navigation button - always visible and clickable */}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3"
            onClick={handleNavigateClick}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Device Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}