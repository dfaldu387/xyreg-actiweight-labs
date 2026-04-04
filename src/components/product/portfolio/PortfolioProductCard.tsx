import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Info, FileX, Clock, ShieldAlert, CircleCheck, Package } from 'lucide-react';
import { getStatusColor } from '@/utils/statusUtils';
import { detectProductType } from '@/utils/productTypeDetection';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';

interface PortfolioProductCardProps {
  product: any;
  isSelected?: boolean;
  onSelectionChange?: (productId: string, selected: boolean) => void;
}

// Component to handle product images with Supabase fetching
function ProductImage({ product, selectedImage, noImageText }: { product: any; selectedImage: string | null; noImageText: string }) {
  const [supabaseImages, setSupabaseImages] = useState<string[]>([]);
  const [imageLoading, setImageLoading] = useState(true);

  // Fetch Supabase images for this product
  useEffect(() => {
    const fetchSupabaseImages = async () => {
      try {
        setImageLoading(true);
        
        const { data, error } = await supabase.storage
          .from('product-images')
          .list('', {
            search: `${product.id}-`,
            limit: 100,
            offset: 0,
          });

        if (error) {
          setImageLoading(false);
          return;
        }

        const imageUrls = data?.map(file => {
          return supabase.storage.from('product-images').getPublicUrl(file.name).data.publicUrl;
        }) || [];

        setSupabaseImages(imageUrls);
        setImageLoading(false);
      } catch (fetchError) {
        setImageLoading(false);
      }
    };

    if (product.id) {
      fetchSupabaseImages();
    }
  }, [product.id]);

  // Process external images (same logic as ProductGrid)
  const processExternalImages = () => {
    // Check for images in product.images field (the field we're saving to)
    if ((product as any).images) {
      if (Array.isArray((product as any).images)) {
        return (product as any).images.filter(Boolean);
      } else if (typeof (product as any).images === 'string') {
        // Handle comma-separated image URLs
        const imageUrls = (product as any).images.split(',').map(url => url.trim()).filter(Boolean);
        return imageUrls;
      }
    }
    
    // Fallback to product.image field (legacy support)
    if (product.image) {
      if (Array.isArray(product.image)) {
        return product.image.filter(Boolean);
      } else if (typeof product.image === 'string') {
        // Handle comma-separated image URLs
        const imageUrls = product.image.split(',').map(url => url.trim()).filter(Boolean);
        return imageUrls;
      }
    }
    
    return [];
  };

  const externalImages = processExternalImages();
  const supabaseUrls = supabaseImages.filter(url => url.includes('supabase.co'));
  const externalUrls = externalImages.filter(url => !url.includes('supabase.co'));
  
  // Remove any external URLs that match deleted Supabase images
  const filteredExternalUrls = externalUrls.filter(externalUrl => {
    if (externalUrl.includes('supabase.co') && externalUrl.includes(`${product.id}-`)) {
      return supabaseUrls.includes(externalUrl);
    }
    return true;
  });
  
  const allImages = [...supabaseUrls, ...filteredExternalUrls];
  const combinedImages = [...new Set(allImages)]; // Remove duplicates
  const primaryImage = selectedImage || (combinedImages.length > 0 ? combinedImages[0] : undefined);

  return (
    <div className="relative h-48 overflow-hidden bg-gray-100">
      {primaryImage ? (
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-contain transition-transform duration-300 hover:scale-110"
          onError={(e) => {
            e.currentTarget.src = "https://placehold.co/400x400?text=Image+Not+Found";
          }}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
          <div className="text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">{noImageText}</p>
          </div>
        </div>
      )}
    </div>
  );
}

const formatDeviceClassLabel = (deviceClass: string) => {
  const classMap: Record<string, string> = {
    'class-i': 'Class I',
    'class-iia': 'Class IIa',
    'class-iib': 'Class IIb',
    'class-iii': 'Class III',
    'class-is': 'Class Is',
    'class-im': 'Class Im',
    'class-ir': 'Class Ir'
  };
  
  return classMap[deviceClass] || deviceClass;
};

export function PortfolioProductCard({
  product,
  isSelected = false,
  onSelectionChange
}: PortfolioProductCardProps) {
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const selectedImage = localStorage.getItem(`selectedImage_${product.id}`);
  const [isHovered, setIsHovered] = React.useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on checkbox
    const target = e.target as HTMLElement;
    if (target.closest('[role="checkbox"]')) {
      return;
    }
    navigate(`/app/product/${product.id}/device-information`);
  };

  const handleCheckboxChange = (checked: boolean) => {
    onSelectionChange?.(product.id, checked as boolean);
  };

  const productType = detectProductType(product);

  const getProductTypeLabel = (productType: string, productPlatform?: string) => {
    switch (productType) {
      case 'new_product':
        return lang('productCard.newDevice');
      case 'existing_product':
        return lang('productCard.deviceUpgrade');
      case 'line_extension':
        return productPlatform ? `${lang('productCard.lineExtension')} (${productPlatform})` : lang('productCard.lineExtension');
      default:
        return lang('productCard.device');
    }
  };

  const productTypeLabel = getProductTypeLabel(productType, product.product_platform);

  const getProductTypeBorder = (product: any) => {
    const productType = detectProductType(product);
    switch (productType) {
      case 'new_product':
        return 'border-l-blue-500 border-l-4';
      case 'existing_product':
        return 'border-l-green-500 border-l-4';
      case 'line_extension':
        return 'border-l-orange-500 border-l-4';
      default:
        return 'border-l-gray-300 border-l-4';
    }
  };

  const getProductTypeBackground = (product: any) => {
    const productType = detectProductType(product);
    switch (productType) {
      case 'new_product':
        return 'bg-gradient-to-br from-blue-50 to-white';
      case 'existing_product':
        return 'bg-gradient-to-br from-green-50 to-white';
      case 'line_extension':
        return 'bg-gradient-to-br from-orange-50 to-white';
      default:
        return 'bg-gradient-to-br from-gray-50 to-white';
    }
  };

  const getProductAlerts = (product: any) => {
    const alerts = [];

    if (product.documents && Array.isArray(product.documents)) {
      if (product.documents.some((doc: any) => doc.status === "Overdue")) {
        alerts.push({ icon: FileX, label: lang('productCard.overdueDocuments'), color: "text-destructive" });
      }
    }

    if (product.audits && Array.isArray(product.audits)) {
      if (product.audits.some((audit: any) => audit.status === "Unscheduled")) {
        alerts.push({ icon: Clock, label: lang('productCard.unscheduledAudit'), color: "text-warning" });
      }
    }

    if (product.certifications && Array.isArray(product.certifications)) {
      if (product.certifications.some((cert: any) => cert.status === "Expiring")) {
        alerts.push({ icon: ShieldAlert, label: lang('productCard.expiringCertification'), color: "text-warning" });
      }
    }

    if (alerts.length === 0) {
      alerts.push({ icon: CircleCheck, label: lang('productCard.allGood'), color: "text-success" });
    }

    return alerts;
  };

  const alerts = getProductAlerts(product);

  return (
    <Card
      className={`transition-all duration-300 cursor-pointer border-2 rounded-lg overflow-hidden ${
        isSelected 
          ? 'border-primary shadow-lg ring-2 ring-primary/20' 
          : 'border-border hover:border-primary/50 hover:shadow-xl hover:scale-[1.02]'
      } ${getProductTypeBorder(product)} ${getProductTypeBackground(product)}`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Header */}
      <div className="relative">
        <ProductImage product={product} selectedImage={selectedImage} noImageText={lang('productCard.noImageAvailable')} />
        
        {/* Checkbox overlay - show on hover or when selected */}
        {(isHovered || isSelected) && onSelectionChange && (
          <div className="absolute top-3 left-3 z-10">
            <div className="bg-white rounded-md p-1.5 shadow-lg">
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleCheckboxChange}
              />
            </div>
          </div>
        )}
        
        {/* Status badge overlay */}
        <div className="absolute top-3 right-3">
          <Badge className={`${getStatusColor(product.status)} shadow-md`}>
            {product.status}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 leading-tight">{product.name}</h3>
              {(product.trade_name || product.eudamed_trade_names) && (
                <p className="text-sm text-muted-foreground mt-1 font-medium">
                  {(() => {
                    const tradeName = product.trade_name || product.eudamed_trade_names;
                    if (typeof tradeName === 'string') {
                      return tradeName.split(',')[0]?.trim() || tradeName;
                    } else if (Array.isArray(tradeName)) {
                      return tradeName[0];
                    } else if (typeof tradeName === 'object' && tradeName?.trade_names) {
                      return tradeName.trade_names;
                    }
                    return tradeName;
                  })()}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs font-medium">
              {productTypeLabel}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {product.phase}
            </Badge>
            {product.class && (
              <Badge variant="secondary" className="text-xs">
                {formatDeviceClassLabel(product.class)}
              </Badge>
            )}
            {/* Variant Tags */}
            {product.variant_tags && Object.keys(product.variant_tags).length > 0 && (
              <>
                {Object.entries(product.variant_tags).map(([key, value]) => (
                  <Badge key={key} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    {String(value)}
                  </Badge>
                ))}
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span className="font-medium">{lang('productCard.progress')}</span>
              <span className="font-semibold">{product.progress}%</span>
            </div>
            <Progress
              value={product.progress}
              className={`h-2 ${product.progress < 60 ? "bg-yellow-100" :
                product.progress > 85 ? "bg-green-100" : "bg-blue-100"
                }`}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            {product.launch_status === 'launched' ? (
              <>
                <span className="text-gray-600 font-medium">{lang('productCard.nextPmsDate')}</span>
                <span className="text-gray-900 font-semibold">
                  {product.post_market_surveillance_date
                    ? new Date(product.post_market_surveillance_date).toLocaleDateString()
                    : lang('productCard.notSet')
                  }
                </span>
              </>
            ) : (
              <>
                <span className="text-gray-600 font-medium">{lang('productCard.targetLaunchDate')}</span>
                <span className="text-gray-900 font-semibold">{product.targetDate}</span>
              </>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t bg-white/50 pt-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            {alerts.slice(0, 3).map((alert, idx) => (
              <div key={idx} className="flex items-center gap-1" title={alert.label}>
                <alert.icon className={`h-5 w-5 ${alert.color}`} />
              </div>
            ))}
          </div>
          <div className="ml-auto">
            <Info className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
