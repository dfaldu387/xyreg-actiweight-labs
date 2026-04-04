import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from '@/hooks/useTranslation';

interface ProductCascadeForecastTableProps {
  companyId: string;
  mainProduct: any;
  productRelationships: any[];
  productSiblingGroupRelationships: any[];
  siblingGroupProductRelationships: any[];
  siblingGroupRelationships: any[];
  siblingGroups: any[];
}

export function ProductCascadeForecastTable({
  mainProduct,
  productRelationships,
  productSiblingGroupRelationships,
  siblingGroupProductRelationships,
  siblingGroupRelationships,
  siblingGroups,
}: ProductCascadeForecastTableProps) {
  const { lang } = useTranslation();
  
  // Get all products from sibling groups for lookups
  const products = useMemo(() => {
    const productMap = new Map();
    siblingGroups.forEach((group: any) => {
      group.product_sibling_assignments?.forEach((assignment: any) => {
        if (assignment.products) {
          productMap.set(assignment.products.id, assignment.products);
        }
      });
    });
    return Array.from(productMap.values());
  }, [siblingGroups]);

  // Calculate the cascade effect over time
  const forecastData = useMemo(() => {
    if (!mainProduct) return [];

    const months = 12;
    const data: any[] = [];

    // Check if the main product has ANY relationships defined
    const hasProductToGroupRels = productSiblingGroupRelationships.some(
      (rel: any) => rel.main_product_id === mainProduct.id
    );
    const hasProductToProductRels = productRelationships.some(
      (rel: any) => rel.main_product_id === mainProduct.id
    );
    const hasGroupToProductRels = siblingGroupProductRelationships.some(
      (rel: any) => {
        const group = siblingGroups.find((g: any) => g.id === rel.main_sibling_group_id);
        return group?.product_sibling_assignments?.some((a: any) => a.product_id === mainProduct.id);
      }
    );

    // If no relationships exist, return empty data - don't show the main product
    if (!hasProductToGroupRels && !hasProductToProductRels && !hasGroupToProductRels) {
      return [];
    }

    // Add main product row (only if it has relationships)
    for (let month = 0; month < months; month++) {
      data.push({
        month: month + 1,
        level: 0,
        type: 'product',
        id: mainProduct.id,
        name: mainProduct.name,
        tradeName: mainProduct.trade_name,
        quantity: month === 0 ? 1 : 0, // Initial sale only
        isMainProduct: true,
      });
    }

    // Find relationships from main product to sibling groups
    const mainProductToGroupRels = productSiblingGroupRelationships.filter(
      (rel: any) => rel.main_product_id === mainProduct.id
    );

    mainProductToGroupRels.forEach((rel: any) => {
      const siblingGroup = siblingGroups.find((g: any) => g.id === rel.accessory_sibling_group_id);
      if (!siblingGroup) return;

      // Calculate quantities for each month based on relationship parameters
      for (let month = 0; month < months; month++) {
        let quantity = 0;

        if (month === 0) {
          // Initial purchase
          quantity = rel.initial_multiplier * rel.typical_quantity;
        } else if (month < rel.lifecycle_duration_months) {
          // Recurring purchases
          const period = rel.recurring_period || 'monthly';
          const shouldRecur = period === 'monthly' || 
                            (period === 'quarterly' && month % 3 === 0) ||
                            (period === 'yearly' && month === 12);
          
          if (shouldRecur) {
            quantity = rel.recurring_multiplier * rel.typical_quantity;
          }
        }

        // Apply seasonality if exists
        if (rel.seasonality_factors && Object.keys(rel.seasonality_factors).length > 0) {
          const seasonalityFactor = rel.seasonality_factors[month.toString()] || 1;
          quantity *= seasonalityFactor;
        }

        if (quantity > 0) {
          // Add sibling group summary row
          data.push({
            month: month + 1,
            level: 1,
            type: 'sibling_group',
            id: siblingGroup.id,
            name: siblingGroup.name,
            quantity: quantity,
            relationshipType: rel.relationship_type,
            attribution: rel.revenue_attribution_percentage,
          });

          // Distribute among products in the sibling group
          siblingGroup.product_sibling_assignments?.forEach((assignment: any) => {
            const productQuantity = (quantity * (assignment.percentage / 100));
            
            data.push({
              month: month + 1,
              level: 2,
              type: 'product',
              id: assignment.product_id,
              name: assignment.products?.name || 'Unknown Product',
              tradeName: assignment.products?.trade_name,
              quantity: productQuantity,
              percentage: assignment.percentage,
              parentGroup: siblingGroup.name,
            });
          });
        }
      }
    });

    // Also check for direct product-to-product relationships
    const directProductRels = productRelationships.filter(
      (rel: any) => rel.main_product_id === mainProduct.id
    );

    directProductRels.forEach((rel: any) => {
      for (let month = 0; month < months; month++) {
        let quantity = 0;

        if (month === 0) {
          quantity = rel.initial_multiplier * rel.typical_quantity;
        } else if (month < rel.lifecycle_duration_months) {
          const period = rel.recurring_period || 'monthly';
          const shouldRecur = period === 'monthly' || 
                            (period === 'quarterly' && month % 3 === 0) ||
                            (period === 'yearly' && month === 12);
          
          if (shouldRecur) {
            quantity = rel.recurring_multiplier * rel.typical_quantity;
          }
        }

        if (quantity > 0) {
          // Check if relationship has variant distribution
          const hasVariantDist = rel.has_variant_distribution === true;
          const accessoryProduct = rel.accessory_product;
          
          if (hasVariantDist && accessoryProduct?.product_variants && accessoryProduct.product_variants.length > 0) {
            // Split quantity across variants
            const variantCount = accessoryProduct.product_variants.length;
            const splitQuantity = quantity / variantCount;
            
            accessoryProduct.product_variants.forEach((variant: any) => {
              data.push({
                month: month + 1,
                level: 1,
                type: 'variant',
                id: `${rel.accessory_product_id}-${variant.id}`,
                productId: rel.accessory_product_id,
                variantId: variant.id,
                name: `${accessoryProduct.name} - ${variant.name}`,
                tradeName: accessoryProduct.trade_name,
                variantName: variant.name,
                quantity: splitQuantity,
                relationshipType: rel.relationship_type,
                attribution: rel.revenue_attribution_percentage,
              });
            });
          } else {
            // No variant distribution - show product as a single line
            data.push({
              month: month + 1,
              level: 1,
              type: 'product',
              id: rel.accessory_product_id,
              name: accessoryProduct?.name || 'Unknown Product',
              tradeName: accessoryProduct?.trade_name,
              quantity: quantity,
              relationshipType: rel.relationship_type,
              attribution: rel.revenue_attribution_percentage,
            });
          }
        }
      }
    });

    // Check if main product is in a sibling group - if so, process group→product and group→group relationships
    const mainProductGroup = siblingGroups.find((g: any) =>
      g.product_sibling_assignments?.some((a: any) => a.product_id === mainProduct.id)
    );

    if (mainProductGroup) {
      // Process group→product relationships
      const groupToProductRels = siblingGroupProductRelationships.filter(
        (rel: any) => rel.main_sibling_group_id === mainProductGroup.id
      );

      groupToProductRels.forEach((rel: any) => {
        for (let month = 0; month < months; month++) {
          let quantity = 0;

          if (month === 0) {
            quantity = rel.initial_multiplier * rel.typical_quantity;
          } else if (month < rel.lifecycle_duration_months) {
            const period = rel.recurring_period || 'monthly';
            const shouldRecur = period === 'monthly' ||
              (period === 'quarterly' && month % 3 === 0) ||
              (period === 'yearly' && month === 12);

            if (shouldRecur) {
              quantity = rel.recurring_multiplier * rel.typical_quantity;
            }
          }

          if (quantity > 0) {
            // Find product info
            const product = products.find((p: any) => p.id === rel.accessory_product_id);
            
            // Check if relationship has variant distribution
            const hasVariantDist = rel.has_variant_distribution === true;
            
            if (hasVariantDist && product?.product_variants && product.product_variants.length > 0) {
              // Split quantity across variants
              const variantCount = product.product_variants.length;
              const splitQuantity = quantity / variantCount;
              
              product.product_variants.forEach((variant: any) => {
                data.push({
                  month: month + 1,
                  level: 1,
                  type: 'variant',
                  id: `${rel.accessory_product_id}-${variant.id}`,
                  productId: rel.accessory_product_id,
                  variantId: variant.id,
                  name: `${product.name} - ${variant.name}`,
                  tradeName: product.trade_name,
                  variantName: variant.name,
                  quantity: splitQuantity,
                  relationshipType: rel.relationship_type,
                  attribution: rel.revenue_attribution_percentage,
                });
              });
            } else {
              data.push({
                month: month + 1,
                level: 1,
                type: 'product',
                id: rel.accessory_product_id,
                name: product?.name || 'Unknown Product',
                tradeName: product?.trade_name,
                quantity: quantity,
                relationshipType: rel.relationship_type,
                attribution: rel.revenue_attribution_percentage,
              });
            }
          }
        }
      });

      // Process group→group relationships
      const groupToGroupRels = siblingGroupRelationships.filter(
        (rel: any) => rel.main_sibling_group_id === mainProductGroup.id
      );

      groupToGroupRels.forEach((rel: any) => {
        const accessoryGroup = siblingGroups.find((g: any) => g.id === rel.accessory_sibling_group_id);
        if (!accessoryGroup) return;

        for (let month = 0; month < months; month++) {
          let quantity = 0;

          if (month === 0) {
            quantity = rel.initial_multiplier * (rel.typical_quantity || 1);
          } else if (month < rel.lifecycle_duration_months) {
            const period = rel.recurring_period || 'monthly';
            const shouldRecur = period === 'monthly' ||
              (period === 'quarterly' && month % 3 === 0) ||
              (period === 'yearly' && month === 12);

            if (shouldRecur) {
              quantity = rel.recurring_multiplier * (rel.typical_quantity || 1);
            }
          }

          if (rel.seasonality_factors && Object.keys(rel.seasonality_factors).length > 0) {
            const seasonalityFactor = rel.seasonality_factors[month.toString()] || 1;
            quantity *= seasonalityFactor;
          }

          if (quantity > 0) {
            // Add group summary row
            data.push({
              month: month + 1,
              level: 1,
              type: 'sibling_group',
              id: accessoryGroup.id,
              name: accessoryGroup.name,
              quantity: quantity,
              relationshipType: rel.relationship_type,
              attribution: rel.revenue_attribution_percentage,
            });

            // Distribute among products in the accessory group
            accessoryGroup.product_sibling_assignments?.forEach((assignment: any) => {
              const productQuantity = quantity * (assignment.percentage / 100);

              data.push({
                month: month + 1,
                level: 2,
                type: 'product',
                id: assignment.product_id,
                name: assignment.products?.name || 'Unknown Product',
                tradeName: assignment.products?.trade_name,
                quantity: productQuantity,
                percentage: assignment.percentage,
                parentGroup: accessoryGroup.name,
              });
            });
          }
        }
      });
    }

    return data;
  }, [mainProduct, productRelationships, productSiblingGroupRelationships, siblingGroupProductRelationships, siblingGroupRelationships, siblingGroups, products]);

  // Group data by month for pivot table
  const pivotData = useMemo(() => {
    const uniqueItems = new Map<string, any>();
    
    forecastData.forEach(d => {
      const key = `${d.type}|||${d.id}`;
      if (!uniqueItems.has(key)) {
        uniqueItems.set(key, {
          type: d.type,
          id: d.id,
          name: d.name,
          tradeName: d.tradeName,
          variantName: d.variantName,
          level: d.level || 0,
          parentGroup: d.parentGroup
        });
      }
    });
    
    const items = Array.from(uniqueItems.values()).sort((a, b) => a.level - b.level);

    return items.map(item => {
      const monthlyData: any = { 
        name: item.name,
        tradeName: item.tradeName,
        variantName: item.variantName,
        level: item.level,
        type: item.type,
        parentGroup: item.parentGroup,
      };
      
      for (let month = 1; month <= 12; month++) {
        const dataPoint = forecastData.find(
          d => d.month === month && d.type === item.type && d.id === item.id
        );
        monthlyData[`month${month}`] = dataPoint?.quantity || 0;
      }

      // Calculate total
      monthlyData.total = Object.keys(monthlyData)
        .filter(k => k.startsWith('month'))
        .reduce((sum, key) => sum + monthlyData[key], 0);

      return monthlyData;
    });
  }, [forecastData]);

  if (!mainProduct) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">
          {lang('commercialPerformance.cascadeForecast.selectDevice')}
        </p>
      </Card>
    );
  }

  // Check if the product has no relationships
  if (forecastData.length === 0) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{lang('commercialPerformance.cascadeForecast.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {mainProduct.name}
            </p>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg font-medium mb-2">{lang('commercialPerformance.cascadeForecast.noRelationships')}</p>
            <p className="text-sm">
              {lang('commercialPerformance.cascadeForecast.noRelationshipsDesc')}
              <br />
              {lang('commercialPerformance.cascadeForecast.noRelationshipsHint')}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{lang('commercialPerformance.cascadeForecast.title')}</h3>
          <p className="text-sm text-muted-foreground">
            {lang('commercialPerformance.cascadeForecast.showingEffect').replace('{{name}}', mainProduct.name)}
          </p>
        </div>

        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background z-10 min-w-[200px]">
                  {lang('commercialPerformance.cascadeForecast.deviceGroup')}
                </TableHead>
                {Array.from({ length: 12 }, (_, i) => (
                  <TableHead key={i} className="text-right min-w-[80px]">
                    M{i + 1}
                  </TableHead>
                ))}
                <TableHead className="text-right font-semibold min-w-[80px]">
                  {lang('commercialPerformance.cascadeForecast.total')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pivotData.map((row, idx) => (
                <TableRow key={idx} className={
                  row.level === 0 ? 'bg-primary/5 font-semibold' :
                  row.level === 1 ? 'bg-accent/20' :
                  'bg-muted/30'
                }>
                  <TableCell className="sticky left-0 bg-background z-10">
                    <div style={{ paddingLeft: `${row.level * 20}px` }}>
                      <div>
                        {row.level === 2 && '↳ '}
                        {row.name}
                        {row.parentGroup && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({row.parentGroup})
                          </span>
                        )}
                      </div>
                      {row.tradeName && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {row.tradeName}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  {Array.from({ length: 12 }, (_, i) => {
                    const value = row[`month${i + 1}`];
                    return (
                      <TableCell key={i} className="text-right tabular-nums">
                        {value > 0 ? value.toFixed(2) : '-'}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right font-semibold tabular-nums">
                    {row.total.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• <strong>{lang('commercialPerformance.cascadeForecast.legend.boldRow')}</strong></p>
          <p>• <strong>{lang('commercialPerformance.cascadeForecast.legend.shadedRows')}</strong></p>
          <p>• <strong>{lang('commercialPerformance.cascadeForecast.legend.indentedRows')}</strong></p>
        </div>
      </div>
    </Card>
  );
}
