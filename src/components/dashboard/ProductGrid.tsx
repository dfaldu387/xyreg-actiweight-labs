import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Info, FileX, Clock, ShieldAlert, CircleCheck, Package } from "lucide-react";
import { getStatusColor } from "@/utils/statusUtils";
import { detectProductType, getProductTypeLabel } from "@/utils/productTypeDetection";
import { sanitizeImageArray } from "@/utils/imageDataUtils";
import { formatDeviceClassLabel } from "@/utils/deviceClassUtils";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useMemo } from "react";
import { VariantStackedCard } from "@/components/product/portfolio/VariantStackedCard";
import { ModelCard } from "@/components/product/ModelCard";
import { VariantGroupSummary } from "@/services/variantGroupService";
import { groupProductsByFamily, computeFamilySummary, getFamilyKey, ProductWithFamily } from "@/services/productFamilyService";

interface ProductGridProps {
  products: any[];
  getProductCardBg: (status: string) => string;
  cardsPerRow?: number;
  showModels?: boolean;
  companyId?: string;
  companyName?: string;
}

// Component to handle product images with Supabase fetching
function ProductImage({ product, selectedImage }: { product: any; selectedImage: string | null }) {
  const [supabaseImages, setSupabaseImages] = useState<string[]>([]);
  const [imageLoading, setImageLoading] = useState(true);

  // Fetch Supabase images for this product
  useEffect(() => {
    const fetchSupabaseImages = async () => {
      try {
        setImageLoading(true);
        
        const { data, error } = await supabase.storage
          .from('Device-images')
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

  // Process external images (same logic as DeviceInformationContainer)
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
            <p className="text-xs text-gray-500">No Image Available</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProductGrid({ products, getProductCardBg, cardsPerRow = 3, showModels = true, companyId, companyName }: ProductGridProps) {
  const navigate = useNavigate();

  const getProductAlerts = (product: any) => {
    const alerts = [];
    if (product.documents && Array.isArray(product.documents)) {
      if (product.documents.some(doc => doc.status === "Overdue")) {
        alerts.push({ icon: FileX, label: "Overdue documents", color: "text-destructive" });
      }
    }
    if (product.audits && Array.isArray(product.audits)) {
      if (product.audits.some(audit => audit.status === "Unscheduled")) {
        alerts.push({ icon: Clock, label: "Unscheduled audit", color: "text-warning" });
      }
    }
    if (product.certifications && Array.isArray(product.certifications)) {
      if (product.certifications.some(cert => cert.status === "Expiring")) {
        alerts.push({ icon: ShieldAlert, label: "Expiring certification", color: "text-warning" });
      }
    }
    if (alerts.length === 0) {
      alerts.push({ icon: CircleCheck, label: "All good", color: "text-success" });
    }
    return alerts;
  };

  const getProductTypeBorder = (product: any) => {
    const productType = detectProductType(product);
    switch (productType) {
      case 'new_Device': return 'border-l-blue-500 border-l-4';
      case 'existing_Device': return 'border-l-green-500 border-l-4';
      case 'line_extension': return 'border-l-orange-500 border-l-4';
      default: return 'border-l-gray-300 border-l-4';
    }
  };

  const getProductTypeBackground = (product: any) => {
    const productType = detectProductType(product);
    switch (productType) {
      case 'new_Device': return 'bg-gradient-to-br from-blue-50 to-white';
      case 'existing_Device': return 'bg-gradient-to-br from-green-50 to-white';
      case 'line_extension': return 'bg-gradient-to-br from-orange-50 to-white';
      default: return 'bg-gradient-to-br from-gray-50 to-white';
    }
  };

  const getProductTypeLabel = (productType: string, productPlatform?: string) => {
    switch (productType) {
      case 'new_Device': return 'New Device';
      case 'existing_Device': return 'Device Upgrade';
      case 'line_extension': return productPlatform ? `Line Extension (${productPlatform})` : 'Line Extension';
      default: return 'Device';
    }
  };

  const getGridColsClass = () => {
    switch (cardsPerRow) {
      case 1: return "grid-cols-1";
      case 2: return "grid-cols-1 md:grid-cols-2";
      case 3: return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      case 4: return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
      case 5: return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";
      case 6: return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6";
      default: return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    }
  };

  // Group products into families by master-variant relationship
  const { familyCards, individualProducts } = useMemo(() => {
    if (!showModels) {
      return { familyCards: [], individualProducts: products };
    }

    const families: any[] = [];
    const groupedProductIds = new Set<string>();

    // Find master devices and their variants
    const masterProducts = products.filter(p => p.is_master_device);
    
    masterProducts.forEach(master => {
      // Find variants linked to this master
      const variants = products.filter(p => 
        p.parent_product_id === master.id && p.parent_relationship_type === 'variant'
      );
      
      // Only create a family card if there are variants (2+ products total)
      if (variants.length > 0) {
        groupedProductIds.add(master.id);
        variants.forEach(v => groupedProductIds.add(v.id));
        
        const allFamilyProducts = [master, ...variants];
        
        // Check if there's a saved family image
        const savedFamilyImage = localStorage.getItem(`selectedFamilyImage_${master.id}`);
        
        // Collect all images from all products in the family
        const allProductImages: string[] = [];
        allFamilyProducts.forEach(product => {
          const selectedImage = localStorage.getItem(`selectedImage_${product.id}`);
          if (selectedImage) allProductImages.push(selectedImage);
          if ((product as any).images) {
            if (Array.isArray((product as any).images)) {
              allProductImages.push(...(product as any).images.filter(Boolean));
            } else if (typeof (product as any).images === 'string') {
              allProductImages.push(...(product as any).images.split(',').map((url: string) => url.trim()).filter(Boolean));
            }
          }
          if ((product as any).image) {
            if (Array.isArray((product as any).image)) {
              allProductImages.push(...(product as any).image.filter(Boolean));
            } else if (typeof (product as any).image === 'string') {
              allProductImages.push(...(product as any).image.split(',').map((url: string) => url.trim()).filter(Boolean));
            }
          }
        });
        
        const firstProductImage = savedFamilyImage || (allProductImages.length > 0 
          ? allProductImages[Math.floor(Math.random() * allProductImages.length)]
          : undefined);
        
        // Build variant summary
        const variantSummary: VariantGroupSummary = {};
        allFamilyProducts.forEach(product => {
          const variantTags = (product as any).variant_tags;
          if (variantTags && typeof variantTags === 'object') {
            Object.entries(variantTags as Record<string, string>).forEach(([dim, value]) => {
              if (!variantSummary[dim]) {
                variantSummary[dim] = { count: 0, values: [], value: undefined };
              }
              if (!variantSummary[dim].values?.includes(value)) {
                variantSummary[dim].values?.push(value);
                variantSummary[dim].count++;
              }
            });
          }
        });

        families.push({
          familyKey: master.id,
          familyName: master.name || master.trade_name || 'Unknown Family',
          productCount: allFamilyProducts.length,
          variantSummary,
          isPlaceholder: false,
          basicUdiDi: master.basic_udi_di,
          groupedCount: allFamilyProducts.length,
          ungroupedCount: 0,
          imageUrl: firstProductImage,
          products: allFamilyProducts,
          displayAsMerged: false,
        });
      }
    });

    // Filter out products that are part of families
    const ungrouped = products.filter(p => !groupedProductIds.has(p.id));

    return { familyCards: families, individualProducts: ungrouped };
  }, [products, showModels]);

  return (
    <div className={`grid ${getGridColsClass()} gap-6`}>
      {/* Render family cards first */}
      {familyCards.map(family => {
        // Show merged card view if displayAsMerged is true
        if (family.displayAsMerged) {
          return (
            <ModelCard
              key={family.familyKey}
              model={{
                name: family.familyName,
                basicUdiDi: family.basicUdiDi,
                productCount: family.productCount,
                variantSummary: family.variantSummary,
                products: family.products,
                imageUrl: family.imageUrl,
              }}
              onEdit={() => navigate(`/app/device-family/${family.familyKey}`)}
            />
          );
        }
        
        // Otherwise show stacked card
        return (
          <VariantStackedCard
            key={family.familyKey}
            productName={family.familyName}
            variantCount={family.productCount}
            variantSummary={family.variantSummary}
            onClick={() => navigate(`/app/device-family/${family.familyKey}`)}
            imageUrl={family.imageUrl}
            basicUdiDi={family.basicUdiDi}
            groupedCount={family.groupedCount}
            ungroupedCount={family.ungroupedCount}
            products={family.products}
          />
        );
      })}
      
      {/* Render individual products */}
      {individualProducts.map(product => {
        
        const selectedImage = localStorage.getItem(`selectedImage_${product.id}`);
        const alerts = getProductAlerts(product);
        const productType = detectProductType(product);
        const productTypeLabel = getProductTypeLabel(productType, product.product_platform);

        // Check if this product should be displayed as a variant group (only if toggle is enabled)
        if (showModels && (product as any).display_as_variant_group && (product as any).variant_group_summary) {
          const variantCount = Object.keys((product as any).variant_group_summary || {}).length;
          return (
            <VariantStackedCard
              key={product.id}
              productName={product.name}
              variantCount={variantCount}
              variantSummary={(product as any).variant_group_summary as VariantGroupSummary}
              onClick={() => navigate(`/app/product/${product.id}/device-information`)}
            >
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={`${getStatusColor(product.status)} text-xs`}>
                    {product.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Phase:</span>
                  <span className="font-medium">{product.phase}</span>
                </div>
              </div>
            </VariantStackedCard>
          );
        }

        return (
          <Card
            key={product.id}
            className={`hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:scale-[1.02] ${getProductTypeBorder(product)} ${getProductTypeBackground(product)} rounded-lg overflow-hidden`}
            onClick={() => navigate(`/app/product/${product.id}/device-information`)}
          >
            {/* Product Image Header */}
            <div className="relative">
              <ProductImage product={product} selectedImage={selectedImage} />
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
                </div>
              </div>
            </CardHeader>

            <CardContent className="pb-3">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span className="font-medium">Progress</span>
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
                  {(() => {
                    if (product.launch_status === 'launched') {
                      return (
                        <>
                          <span className="text-gray-600 font-medium">Next PMS Date:</span>
                          <span className="text-gray-900 font-semibold">
                            {product.post_market_surveillance_date 
                              ? new Date(product.post_market_surveillance_date).toLocaleDateString()
                              : 'Not set'
                            }
                          </span>
                        </>
                      );
                    } else {
                      return (
                        <>
                          <span className="text-gray-600 font-medium">Target Launch Date:</span>
                          <span className="text-gray-900 font-semibold">{product.targetDate}</span>
                        </>
                      );
                    }
                  })()}
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
      })}
    </div>
  );
}
