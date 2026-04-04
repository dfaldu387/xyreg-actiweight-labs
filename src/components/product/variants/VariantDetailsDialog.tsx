import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useNavigate, useLocation } from 'react-router-dom';
import { ProductWithBasicUDI } from '@/hooks/useProductsByBasicUDI';
import { useProductDetails } from '@/hooks/useProductDetails';
import { Loader2, ExternalLink, Tag, Package, Info, ImageIcon, Check, X, Table } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageDisplayItem } from '@/components/product/ImageDisplayItem';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeImageArray } from '@/utils/imageDataUtils';

interface VariantDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: ProductWithBasicUDI | null;
  companyId: string;
}

export function VariantDetailsDialog({
  open,
  onOpenChange,
  variant,
  companyId,
}: VariantDetailsDialogProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [supabaseImages, setSupabaseImages] = useState<string[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [variantTypeTags, setVariantTypeTags] = useState<{ dimensionName: string; optionName: string }[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductWithBasicUDI | null>(variant);
  const [availableVariants, setAvailableVariants] = useState<ProductWithBasicUDI[]>([]);
  const [variantOptions, setVariantOptions] = useState<Record<string, { dimensionId: string; dimensionName: string; options: { optionId: string; optionName: string }[] }>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [allVariantsWithOptions, setAllVariantsWithOptions] = useState<Array<{
    productId: string;
    productName: string;
    options: Record<string, string>; // dimensionId -> optionId
  }>>([]);

  // Update selected variant when prop changes
  useEffect(() => {
    setSelectedVariant(variant);
  }, [variant]);

  // Fetch full variant details for the selected variant
  const { data: variantDetails, isLoading } = useProductDetails(selectedVariant?.id, {
    enabled: !!selectedVariant?.id && open,
  });

  // Update variant type tags based on selected options (only show selected ones)
  useEffect(() => {
    if (!open || Object.keys(selectedOptions).length === 0 || Object.keys(variantOptions).length === 0) {
      setVariantTypeTags([]);
      return;
    }

    // Build tags from selectedOptions and variantOptions
    const dimensionOptionPairs: { dimensionName: string; optionName: string }[] = [];

    Object.entries(selectedOptions).forEach(([dimensionId, optionId]) => {
      const dimension = variantOptions[dimensionId];
      if (dimension && optionId) {
        const option = dimension.options.find(opt => opt.optionId === optionId);
        if (option) {
          dimensionOptionPairs.push({
            dimensionName: dimension.dimensionName,
            optionName: option.optionName
          });
        }
      }
    });

    // Sort by dimension name, then by option name
    dimensionOptionPairs.sort((a, b) => {
      if (a.dimensionName !== b.dimensionName) {
        return a.dimensionName.localeCompare(b.dimensionName);
      }
      return a.optionName.localeCompare(b.optionName);
    });

    setVariantTypeTags(dimensionOptionPairs);
  }, [selectedOptions, variantOptions, open]);

  // Fetch all variants and their options for the product
  useEffect(() => {
    const fetchAvailableVariants = async () => {
      // if (!variant?.id || !open) return;

      try {
        // Find sibling products (products with the same basic_udi_di)
        const basicUDI = variant?.basic_udi_di;
        if (!basicUDI) {
          const { data: productVariants, error: variantsErr } = await supabase
            .from('product_variants')
            .select('id, product_id')
            .eq('product_id', variant?.id);
          // If no basic_udi_di, check if this product has product_variants
          if (!variantsErr && productVariants && productVariants.length > 0) {
            // Get variant values for this product's variants
            const variantIds = productVariants.map(pv => pv.id);
            const { data: variantValues, error: valuesErr } = await supabase
              .from('product_variant_values')
              .select(`
                product_variant_id,
                dimension_id,
                option_id,
                product_variation_dimensions!inner(name),
                product_variation_options!inner(name)
              `)
              .in('product_variant_id', variantIds)
              .not('option_id', 'is', null);

            if (!valuesErr && variantValues && variantValues.length > 0) {
              // Build options for each dimension
              const optionsByDimension: Record<string, { dimensionId: string; dimensionName: string; options: Map<string, string> }> = {};

              variantValues.forEach((vv: any) => {
                const dimensionId = vv.dimension_id;
                const dimensionName = vv.product_variation_dimensions?.name;
                const optionId = vv.option_id;
                const optionName = vv.product_variation_options?.name;

                if (!optionsByDimension[dimensionId]) {
                  optionsByDimension[dimensionId] = {
                    dimensionId,
                    dimensionName,
                    options: new Map()
                  };
                }
                optionsByDimension[dimensionId].options.set(optionId, optionName);
              });

              // Include ALL dimensions (for testing - show even if only one option)
              const allDimensions: Record<string, { dimensionId: string; dimensionName: string; options: { optionId: string; optionName: string }[] }> = {};

              Object.values(optionsByDimension).forEach(dim => {
                // Show all dimensions, not just those with multiple options
                allDimensions[dim.dimensionId] = {
                  dimensionId: dim.dimensionId,
                  dimensionName: dim.dimensionName,
                  options: Array.from(dim.options.entries()).map(([optionId, optionName]) => ({
                    optionId,
                    optionName
                  })).sort((a, b) => a.optionName.localeCompare(b.optionName))
                };
              });

              setVariantOptions(allDimensions);

              // Build variants with options for comparison table
              const variantsWithOptions: Array<{
                productId: string;
                productName: string;
                options: Record<string, string>;
              }> = [];

              productVariants.forEach((pv: any) => {
                const productValues = variantValues.filter((vv: any) => vv.product_variant_id === pv.id);
                const optionMap: Record<string, string> = {};
                productValues.forEach((vv: any) => {
                  optionMap[vv.dimension_id] = vv.option_id;
                });
                variantsWithOptions.push({
                  productId: pv.product_id,
                  productName: variant.name || `Variant ${pv.product_id.slice(0, 8)}`,
                  options: optionMap
                });
              });

              setAllVariantsWithOptions(variantsWithOptions);

              // Initialize selected options based on current variant
              const currentVariant = productVariants.find(pv => pv.product_id === variant.id);
              if (currentVariant) {
                const currentValues = variantValues.filter((vv: any) => vv.product_variant_id === currentVariant.id);
                const initialSelections: Record<string, string> = {};
                currentValues.forEach((vv: any) => {
                  initialSelections[vv.dimension_id] = vv.option_id;
                });
                setSelectedOptions(initialSelections);
              }
            }
          }
          return;
        }

        // Get all sibling products (same basic_udi_di)
        const { data: siblingProducts, error: siblingsErr } = await supabase
          .from('products')
          .select('id, name, trade_name, udi_di, basic_udi_di, model_reference, device_category, status, sibling_group_id')
          .eq('basic_udi_di', basicUDI)
          .eq('is_archived', false);

        if (siblingsErr) {
          console.error('Error fetching sibling products:', siblingsErr);
          return;
        }

        if (!siblingProducts || siblingProducts.length <= 1) {
          // No siblings, check product_variants for this product
          const { data: productVariants, error: variantsErr } = await supabase
            .from('product_variants')
            .select('id, product_id')
            .eq('product_id', variant.id);

          if (!variantsErr && productVariants && productVariants.length > 0) {
            const variantIds = productVariants.map(pv => pv.id);
            const { data: variantValues, error: valuesErr } = await supabase
              .from('product_variant_values')
              .select(`
                product_variant_id,
                dimension_id,
                option_id,
                product_variation_dimensions!inner(name),
                product_variation_options!inner(name)
              `)
              .in('product_variant_id', variantIds)
              .not('option_id', 'is', null);

            if (!valuesErr && variantValues && variantValues.length > 0) {
              const optionsByDimension: Record<string, { dimensionId: string; dimensionName: string; options: Map<string, string> }> = {};

              variantValues.forEach((vv: any) => {
                const dimensionId = vv.dimension_id;
                const dimensionName = vv.product_variation_dimensions?.name;
                const optionId = vv.option_id;
                const optionName = vv.product_variation_options?.name;

                if (!optionsByDimension[dimensionId]) {
                  optionsByDimension[dimensionId] = {
                    dimensionId,
                    dimensionName,
                    options: new Map()
                  };
                }
                optionsByDimension[dimensionId].options.set(optionId, optionName);
              });

              // Include ALL dimensions (for testing - show even if only one option)
              const allDimensions: Record<string, { dimensionId: string; dimensionName: string; options: { optionId: string; optionName: string }[] }> = {};

              Object.values(optionsByDimension).forEach(dim => {
                // Show all dimensions, not just those with multiple options
                allDimensions[dim.dimensionId] = {
                  dimensionId: dim.dimensionId,
                  dimensionName: dim.dimensionName,
                  options: Array.from(dim.options.entries()).map(([optionId, optionName]) => ({
                    optionId,
                    optionName
                  })).sort((a, b) => a.optionName.localeCompare(b.optionName))
                };
              });
              setVariantOptions(allDimensions);

              // Build variants with options for comparison table
              const variantsWithOptions: Array<{
                productId: string;
                productName: string;
                options: Record<string, string>;
              }> = [];

              productVariants.forEach((pv: any) => {
                const productValues = variantValues.filter((vv: any) => vv.product_variant_id === pv.id);
                const optionMap: Record<string, string> = {};
                productValues.forEach((vv: any) => {
                  optionMap[vv.dimension_id] = vv.option_id;
                });
                variantsWithOptions.push({
                  productId: pv.product_id,
                  productName: variant.name || `Variant ${pv.product_id.slice(0, 8)}`,
                  options: optionMap
                });
              });

              setAllVariantsWithOptions(variantsWithOptions);
            }
          }
          return;
        }

        setAvailableVariants(siblingProducts as ProductWithBasicUDI[]);

        // Get product_variants for all sibling products
        const siblingProductIds = siblingProducts.map(p => p.id);
        const { data: productVariants, error: variantsErr } = await supabase
          .from('product_variants')
          .select('id, product_id')
          .in('product_id', siblingProductIds);

        if (variantsErr) {
          console.error('Error fetching product variants:', variantsErr);
          return;
        }

        if (!productVariants || productVariants.length === 0) {
          return;
        }

        // Get all variant values with dimensions and options
        const variantIds = productVariants.map(pv => pv.id);
        const { data: variantValues, error: valuesErr } = await supabase
          .from('product_variant_values')
          .select(`
            product_variant_id,
            dimension_id,
            option_id,
            product_variation_dimensions!inner(name),
            product_variation_options!inner(name)
          `)
          .in('product_variant_id', variantIds)
          .not('option_id', 'is', null);

        if (valuesErr) {
          console.error('Error fetching variant values:', valuesErr);
          return;
        }

        if (!variantValues || variantValues.length === 0) {
          return;
        }

        // Build options for each dimension across all variants
        const optionsByDimension: Record<string, { dimensionId: string; dimensionName: string; options: Map<string, string> }> = {};

        variantValues.forEach((vv: any) => {
          const dimensionId = vv.dimension_id;
          const dimensionName = vv.product_variation_dimensions?.name;
          const optionId = vv.option_id;
          const optionName = vv.product_variation_options?.name;

          if (!optionsByDimension[dimensionId]) {
            optionsByDimension[dimensionId] = {
              dimensionId,
              dimensionName,
              options: new Map()
            };
          }
          optionsByDimension[dimensionId].options.set(optionId, optionName);
        });

        // Include ALL dimensions (for testing - show even if only one option)
        const allDimensions: Record<string, { dimensionId: string; dimensionName: string; options: { optionId: string; optionName: string }[] }> = {};

        Object.values(optionsByDimension).forEach(dim => {
          // Show all dimensions, not just those with multiple options
          allDimensions[dim.dimensionId] = {
            dimensionId: dim.dimensionId,
            dimensionName: dim.dimensionName,
            options: Array.from(dim.options.entries()).map(([optionId, optionName]) => ({
              optionId,
              optionName
            })).sort((a, b) => a.optionName.localeCompare(b.optionName))
          };
        });

        setVariantOptions(allDimensions);

        // Build all variants with their options for comparison table
        const variantsWithOptions: Array<{
          productId: string;
          productName: string;
          options: Record<string, string>;
        }> = [];

        siblingProducts.forEach((product: any) => {
          const productVariant = productVariants.find(pv => pv.product_id === product.id);
          if (productVariant) {
            const productValues = variantValues.filter((vv: any) => vv.product_variant_id === productVariant.id);
            const optionMap: Record<string, string> = {};
            productValues.forEach((vv: any) => {
              optionMap[vv.dimension_id] = vv.option_id;
            });
            variantsWithOptions.push({
              productId: product.id,
              productName: product.name || `Variant ${product.id.slice(0, 8)}`,
              options: optionMap
            });
          }
        });

        setAllVariantsWithOptions(variantsWithOptions);

        // Initialize selected options based on current variant
        const currentVariant = productVariants.find(pv => pv.product_id === variant.id);
        if (currentVariant) {
          const currentValues = variantValues.filter((vv: any) => vv.product_variant_id === currentVariant.id);
          const initialSelections: Record<string, string> = {};
          currentValues.forEach((vv: any) => {
            initialSelections[vv.dimension_id] = vv.option_id;
          });
          setSelectedOptions(initialSelections);
        }
      } catch (error) {
        console.error('Error fetching available variants:', error);
      }
    };

    fetchAvailableVariants();
  }, [open, variant?.id, variant?.basic_udi_di]);

  // Fallback: If we have selectedOptions but no variantOptions, fetch dimension/option names
  useEffect(() => {
    const fetchDimensionAndOptionNames = async () => {
      if (Object.keys(variantOptions).length > 0) return; // Already have options
      if (Object.keys(selectedOptions).length === 0) return; // No selected options

      try {
        const dimensionIds = Object.keys(selectedOptions);
        const optionIds = Object.values(selectedOptions).filter(Boolean);

        // Fetch dimension names
        const { data: dimensions, error: dimErr } = await supabase
          .from('product_variation_dimensions')
          .select('id, name')
          .in('id', dimensionIds);

        if (dimErr) {
          console.error('Error fetching dimensions:', dimErr);
          return;
        }

        // Fetch ALL options for each dimension (not just the selected one)
        const { data: allOptions, error: optErr } = await supabase
          .from('product_variation_options')
          .select('id, dimension_id, name')
          .in('dimension_id', dimensionIds);

        if (optErr) {
          console.error('Error fetching options:', optErr);
          return;
        }

        // Build variantOptions from the fetched data
        const builtOptions: Record<string, { dimensionId: string; dimensionName: string; options: { optionId: string; optionName: string }[] }> = {};

        dimensions?.forEach((dim: any) => {
          const dimOptions = allOptions?.filter((opt: any) => opt.dimension_id === dim.id) || [];
          if (dimOptions.length > 0) {
            builtOptions[dim.id] = {
              dimensionId: dim.id,
              dimensionName: dim.name,
              options: dimOptions.map((opt: any) => ({
                optionId: opt.id,
                optionName: opt.name
              })).sort((a, b) => a.optionName.localeCompare(b.optionName))
            };
          }
        });

        if (Object.keys(builtOptions).length > 0) {
          setVariantOptions(builtOptions);
        }
      } catch (error) {
        console.error('Error fetching dimension/option names:', error);
      }
    };

    if (open && Object.keys(selectedOptions).length > 0 && Object.keys(variantOptions).length === 0) {
      fetchDimensionAndOptionNames();
    }
  }, [selectedOptions, variantOptions, open]);

  // Find matching variant when options change
  useEffect(() => {
    const findMatchingVariant = async () => {
      if (!variant?.id || !variant?.basic_udi_di || Object.keys(selectedOptions).length === 0) return;

      try {
        // Get all sibling products
        const { data: siblingProducts, error: siblingsErr } = await supabase
          .from('products')
          .select('id')
          .eq('basic_udi_di', variant.basic_udi_di)
          .eq('is_archived', false);

        if (siblingsErr || !siblingProducts || siblingProducts.length <= 1) {
          // No siblings, check product_variants for this product
          const { data: productVariants, error: variantsErr } = await supabase
            .from('product_variants')
            .select('id, product_id')
            .eq('product_id', variant.id);

          if (variantsErr || !productVariants) return;

          const variantIds = productVariants.map(pv => pv.id);
          const { data: variantValues, error: valuesErr } = await supabase
            .from('product_variant_values')
            .select('product_variant_id, dimension_id, option_id')
            .in('product_variant_id', variantIds)
            .not('option_id', 'is', null);

          if (valuesErr || !variantValues) return;

          const matchingVariant = productVariants.find(pv => {
            const values = variantValues.filter((vv: any) => vv.product_variant_id === pv.id);
            const valueMap: Record<string, string> = {};
            values.forEach((vv: any) => {
              valueMap[vv.dimension_id] = vv.option_id;
            });

            return Object.keys(selectedOptions).every(dimId => {
              return valueMap[dimId] === selectedOptions[dimId];
            });
          });

          if (matchingVariant && matchingVariant.product_id !== selectedVariant?.id) {
            const { data: product, error: productErr } = await supabase
              .from('products')
              .select('id, name, trade_name, udi_di, basic_udi_di, model_reference, device_category, status, sibling_group_id')
              .eq('id', matchingVariant.product_id)
              .eq('is_archived', false)
              .maybeSingle();

            if (!productErr && product) {
              setSelectedVariant(product as ProductWithBasicUDI);
            }
          }
          return;
        }

        // Get product_variants for all siblings
        const siblingProductIds = siblingProducts.map(p => p.id);
        const { data: productVariants, error: variantsErr } = await supabase
          .from('product_variants')
          .select('id, product_id')
          .in('product_id', siblingProductIds);

        if (variantsErr || !productVariants) return;

        const variantIds = productVariants.map(pv => pv.id);
        const { data: variantValues, error: valuesErr } = await supabase
          .from('product_variant_values')
          .select('product_variant_id, dimension_id, option_id')
          .in('product_variant_id', variantIds)
          .not('option_id', 'is', null);

        if (valuesErr || !variantValues) return;

        // Find variant that matches all selected options
        const matchingVariant = productVariants.find(pv => {
          const values = variantValues.filter((vv: any) => vv.product_variant_id === pv.id);
          const valueMap: Record<string, string> = {};
          values.forEach((vv: any) => {
            valueMap[vv.dimension_id] = vv.option_id;
          });

          return Object.keys(selectedOptions).every(dimId => {
            return valueMap[dimId] === selectedOptions[dimId];
          });
        });

        if (matchingVariant && matchingVariant.product_id !== selectedVariant?.id) {
          const { data: product, error: productErr } = await supabase
            .from('products')
            .select('id, name, trade_name, udi_di, basic_udi_di, model_reference, device_category, status, sibling_group_id')
            .eq('id', matchingVariant.product_id)
            .eq('is_archived', false)
            .maybeSingle();

          if (!productErr && product) {
            setSelectedVariant(product as ProductWithBasicUDI);
          }
        }
      } catch (error) {
        console.error('Error finding matching variant:', error);
      }
    };

    if (open && Object.keys(selectedOptions).length > 0) {
      findMatchingVariant();
    }
  }, [selectedOptions, variant?.id, variant?.basic_udi_di, selectedVariant?.id, open]);

  // Fetch Supabase images for the selected variant
  useEffect(() => {
    const fetchSupabaseImages = async () => {
      if (!selectedVariant?.id || !open) return;

      try {
        setImageLoading(true);
        const { data, error } = await supabase.storage
          .from('product-images')
          .list('', {
            search: `${selectedVariant.id}-`,
            limit: 100,
            offset: 0,
          });

        if (error) {
          console.error('Error fetching Supabase images:', error.message);
          setImageLoading(false);
          return;
        }

        const imageUrls = data?.map(file => {
          return supabase.storage.from('product-images').getPublicUrl(file.name).data.publicUrl;
        }) || [];

        setSupabaseImages(imageUrls);
        setImageLoading(false);
      } catch (fetchError) {
        console.error('Error fetching Supabase images:', fetchError);
        setImageLoading(false);
      }
    };

    if (open && selectedVariant?.id) {
      fetchSupabaseImages();
    }
  }, [selectedVariant?.id, open]);

  // Process and combine images
  const allImages = useMemo(() => {
    if (!variantDetails) return [];

    // Get images from variantDetails.images (plural) - this is the processed images array from useProductDetails
    // The hook returns 'images' field even though Product type has 'image'
    const variantImages = Array.isArray((variantDetails as any).images)
      ? (variantDetails as any).images
      : variantDetails.image
        ? sanitizeImageArray(Array.isArray(variantDetails.image) ? variantDetails.image : [variantDetails.image])
        : [];

    // Get external images (non-Supabase URLs)
    const externalImages = variantImages.filter(
      url => url && typeof url === 'string' && !url.includes('supabase.co')
    );

    // Combine Supabase images with external images
    const supabaseUrls = supabaseImages.filter(url => url.includes('supabase.co'));
    const combined = [...supabaseUrls, ...externalImages].filter(Boolean);

    return combined;
  }, [(variantDetails as any)?.images, variantDetails?.image, supabaseImages]);

  const handleNavigateToVariant = () => {
    if (!selectedVariant?.id) return;

    // Preserve the current route path when navigating to variant
    const currentPath = location.pathname;
    const pathMatch = currentPath.match(/\/app\/product\/[^\/]+(\/.*)?$/);

    if (pathMatch && pathMatch[1]) {
      // Preserve the subsection path (e.g., /device-information?tab=overview)
      navigate(`/app/product/${selectedVariant.id}${pathMatch[1]}${location.search}`);
    } else {
      // Just navigate to variant dashboard
      navigate(`/app/product/${selectedVariant.id}${location.search}`);
    }

    onOpenChange(false);
  };

  if (!variant) return null;

  const handleOptionChange = (dimensionId: string, optionId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [dimensionId]: optionId
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-600" />
            Variant Details
          </DialogTitle>
          <DialogDescription>
            View detailed information about this device variant
          </DialogDescription>
        </DialogHeader>

        {/* Variant Selector Checkboxes */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm">Select Variant Options</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(variantOptions).length > 0 ? (
              <div className="space-y-6">
                {Object.values(variantOptions).map((dim) => (
                  <div key={dim.dimensionId} className="space-y-3">
                    <Label className="text-sm font-semibold">{dim.dimensionName}</Label>
                    <div className="flex flex-wrap gap-2">
                      {dim.options.map((opt) => {
                        const isSelected = selectedOptions[dim.dimensionId] === opt.optionId;
                        return (
                          <label
                            key={opt.optionId}
                            className={`
                              flex items-center gap-2 px-4 py-2 rounded-md border-2 cursor-pointer transition-all
                              ${isSelected
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300'
                                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                              }
                            `}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleOptionChange(dim.dimensionId, opt.optionId);
                                }
                              }}
                              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <span className="text-sm font-medium select-none">{opt.optionName}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-4">
                <p>No variant options available. Debug info:</p>
                <p className="mt-2 text-xs">Variant Options Count: {Object.keys(variantOptions).length}</p>
                <p className="text-xs">Selected Options: {JSON.stringify(selectedOptions)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Variant Comparison Table */}


        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  {/* <div>
                    <label className="text-sm font-medium text-muted-foreground">Variant Name</label>
                    <p className="text-sm font-semibold mt-1">{variant.name}</p>
                  </div> */}
                  {selectedVariant?.trade_name && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Trade Name</label>
                      <p className="text-sm font-semibold mt-1">{selectedVariant.trade_name}</p>
                    </div>
                  )}
                  {selectedVariant?.model_reference && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Model Reference</label>
                      <p className="text-sm font-semibold mt-1">{selectedVariant.model_reference}</p>
                    </div>
                  )}
                  {selectedVariant?.device_category && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Device Category</label>
                      <p className="text-sm font-semibold mt-1">{selectedVariant.device_category}</p>
                    </div>
                  )}
                  {selectedVariant?.status && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">
                        <Badge variant="outline">{selectedVariant.status}</Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* UDI Information */}
            {/* {(variant.basic_udi_di || variant.udi_di) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">UDI Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    {variant.basic_udi_di && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Basic UDI-DI</label>
                        <p className="text-sm font-mono mt-1 break-all">{variant.basic_udi_di}</p>
                      </div>
                    )}
                    {variant.udi_di && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">UDI-DI</label>
                        <p className="text-sm font-mono mt-1 break-all">{variant.udi_di}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )} */}

            {/* Extended Details from Full Product */}
            {variantDetails && (
              <>
                {/* Variant Type Tags (Size, Color, Packaging, etc.) */}
                {variantTypeTags.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Variant Type
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {variantTypeTags.map((item, index) => (
                          <Badge key={`${item.dimensionName}-${item.optionName}-${index}`} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">
                            <span className="font-medium">{item.dimensionName}:</span> {item.optionName}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Variant Tags (Key-Value pairs) */}
                {(variantDetails as any).variant_tags && Object.keys((variantDetails as any).variant_tags).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Variant Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries((variantDetails as any).variant_tags as Record<string, string>).map(([key, value]) => (
                          <Badge key={key} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                            <span className="font-medium">{key}:</span> {String(value)}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Description */}
                {variantDetails.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{variantDetails.description}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Intended Use */}
                {variantDetails.intended_use && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Intended Use</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{variantDetails.intended_use}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Key Features */}
                {variantDetails.key_features && Array.isArray(variantDetails.key_features) && variantDetails.key_features.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Key Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1">
                        {variantDetails.key_features.map((feature, index) => (
                          <li key={index} className="text-sm text-muted-foreground">{feature}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Regulatory Information */}
                {(variantDetails.regulatory_status || variantDetails.ce_mark_status || variantDetails.notified_body) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Regulatory Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        {variantDetails.regulatory_status && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Regulatory Status</label>
                            <p className="text-sm font-semibold mt-1">{variantDetails.regulatory_status}</p>
                          </div>
                        )}
                        {variantDetails.ce_mark_status && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">CE Mark Status</label>
                            <p className="text-sm font-semibold mt-1">{variantDetails.ce_mark_status}</p>
                          </div>
                        )}
                        {variantDetails.notified_body && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Notified Body</label>
                            <p className="text-sm font-semibold mt-1">{variantDetails.notified_body}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Lifecycle Information */}
                {(variantDetails.current_lifecycle_phase || variantDetails.projected_launch_date) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Lifecycle Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        {variantDetails.current_lifecycle_phase && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Current Phase</label>
                            <p className="text-sm font-semibold mt-1">{variantDetails.current_lifecycle_phase}</p>
                          </div>
                        )}
                        {variantDetails.projected_launch_date && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Projected Launch Date</label>
                            <p className="text-sm font-semibold mt-1">
                              {new Date(variantDetails.projected_launch_date).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Variant Images */}
                {(allImages.length > 0 || imageLoading) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Variant Images
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {imageLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : allImages.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {allImages.map((imageUrl, index) => (
                            <div key={index} className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                              <ImageDisplayItem
                                imageUrl={imageUrl}
                                alt={`${selectedVariant?.name || 'Variant'} - Image ${index + 1}`}
                                className="w-full h-full"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">No images available for this variant</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
            {allVariantsWithOptions.length > 0 && Object.keys(variantOptions).length > 0 && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    Variant Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 text-sm font-semibold text-muted-foreground sticky left-0 bg-background z-10">
                            Variant Name
                          </th>
                          {Object.values(variantOptions).map((dim) => (
                            <th key={dim.dimensionId} className="text-center p-2 text-sm font-semibold text-muted-foreground min-w-[120px]">
                              {dim.dimensionName}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {allVariantsWithOptions.map((variantItem) => {
                          const isCurrentVariant = variantItem.productId === selectedVariant?.id;
                          return (
                            <tr
                              key={variantItem.productId}
                              className={`border-b hover:bg-muted/50 transition-colors ${isCurrentVariant ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                                }`}
                            >
                              <td className={`p-2 text-sm font-medium sticky left-0 bg-inherit z-10 ${isCurrentVariant ? 'text-blue-700 dark:text-blue-300' : ''
                                }`}>
                                {variantItem.productName}
                                {isCurrentVariant && (
                                  <Badge variant="outline" className="ml-2 text-xs">Current</Badge>
                                )}
                              </td>
                              {Object.values(variantOptions).map((dim) => {
                                const variantOptionId = variantItem.options[dim.dimensionId];
                                const selectedOptionId = selectedOptions[dim.dimensionId];
                                const isMatch = variantOptionId === selectedOptionId;
                                const optionName = dim.options.find(opt => opt.optionId === variantOptionId)?.optionName || '-';

                                return (
                                  <td key={dim.dimensionId} className="p-2 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                      {variantOptionId ? (
                                        <>
                                          <div className={`flex items-center justify-center w-6 h-6 rounded-full ${isMatch
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                            }`}>
                                            {isMatch ? (
                                              <Check className="h-4 w-4" />
                                            ) : (
                                              <X className="h-4 w-4" />
                                            )}
                                          </div>
                                          <span className="text-xs text-muted-foreground">{optionName}</span>
                                        </>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">-</span>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Info Message */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Click "View Full Details" to navigate to the complete variant page with all information and editing capabilities.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleNavigateToVariant} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            View Full Details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


