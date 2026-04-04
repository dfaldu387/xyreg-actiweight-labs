import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';

interface RelationshipOverviewTableProps {
  productRelationships: any[];
  productSiblingGroupRelationships: any[];
  siblingGroupProductRelationships: any[];
  siblingGroupRelationships: any[];
  siblingGroups: any[];
  products: any[];
}

export function RelationshipOverviewTable({
  productRelationships,
  productSiblingGroupRelationships,
  siblingGroupProductRelationships,
  siblingGroupRelationships,
  siblingGroups,
  products,
}: RelationshipOverviewTableProps) {
  const { lang } = useTranslation();
  
  // Combine all relationships into a unified format
  const allRelationships = useMemo(() => {
    const relationships: any[] = [];

    // Product to Product relationships
    productRelationships.forEach((rel) => {
      const mainProduct = products.find(p => p.id === rel.main_product_id);
      const accessoryProduct = products.find(p => p.id === rel.accessory_product_id);
      
      relationships.push({
        id: rel.id,
        mainType: lang('commercialPerformance.relationshipOverview.product'),
        mainName: mainProduct?.name || 'Unknown',
        accessoryType: lang('commercialPerformance.relationshipOverview.product'),
        accessoryName: accessoryProduct?.name || 'Unknown',
        relationshipType: rel.relationship_type,
        revenueAttribution: rel.revenue_attribution_percentage,
        initialMultiplier: rel.initial_multiplier,
        recurringMultiplier: rel.recurring_multiplier,
        recurringPeriod: rel.recurring_period,
        lifecycleDuration: rel.lifecycle_duration_months,
        isRequired: rel.is_required,
      });
    });

    // Product to Sibling Group relationships
    productSiblingGroupRelationships.forEach((rel) => {
      const mainProduct = products.find(p => p.id === rel.main_product_id);
      const accessoryGroup = siblingGroups.find(g => g.id === rel.accessory_sibling_group_id);
      
      relationships.push({
        id: rel.id,
        mainType: lang('commercialPerformance.relationshipOverview.product'),
        mainName: mainProduct?.name || 'Unknown',
        accessoryType: lang('commercialPerformance.relationshipOverview.siblingGroup'),
        accessoryName: accessoryGroup?.name || 'Unknown',
        relationshipType: rel.relationship_type,
        revenueAttribution: rel.revenue_attribution_percentage,
        initialMultiplier: rel.initial_multiplier,
        recurringMultiplier: rel.recurring_multiplier,
        recurringPeriod: rel.recurring_period,
        lifecycleDuration: rel.lifecycle_duration_months,
        isRequired: rel.is_required,
      });
    });

    // Sibling Group to Product relationships
    siblingGroupProductRelationships.forEach((rel) => {
      const mainGroup = siblingGroups.find(g => g.id === rel.main_sibling_group_id);
      const accessoryProduct = products.find(p => p.id === rel.accessory_product_id);
      
      relationships.push({
        id: rel.id,
        mainType: lang('commercialPerformance.relationshipOverview.siblingGroup'),
        mainName: mainGroup?.name || 'Unknown',
        accessoryType: lang('commercialPerformance.relationshipOverview.product'),
        accessoryName: accessoryProduct?.name || 'Unknown',
        relationshipType: rel.relationship_type,
        revenueAttribution: rel.revenue_attribution_percentage,
        initialMultiplier: rel.initial_multiplier,
        recurringMultiplier: rel.recurring_multiplier,
        recurringPeriod: rel.recurring_period,
        lifecycleDuration: rel.lifecycle_duration_months,
        isRequired: rel.is_required,
      });
    });

    // Sibling Group to Sibling Group relationships
    siblingGroupRelationships.forEach((rel) => {
      const mainGroup = siblingGroups.find(g => g.id === rel.main_sibling_group_id);
      const accessoryGroup = siblingGroups.find(g => g.id === rel.accessory_sibling_group_id);
      
      relationships.push({
        id: rel.id,
        mainType: lang('commercialPerformance.relationshipOverview.siblingGroup'),
        mainName: mainGroup?.name || 'Unknown',
        accessoryType: lang('commercialPerformance.relationshipOverview.siblingGroup'),
        accessoryName: accessoryGroup?.name || 'Unknown',
        relationshipType: rel.relationship_type,
        revenueAttribution: rel.revenue_attribution_percentage,
        initialMultiplier: rel.initial_multiplier,
        recurringMultiplier: rel.recurring_multiplier,
        recurringPeriod: rel.recurring_period,
        lifecycleDuration: rel.lifecycle_duration_months,
        isRequired: rel.is_required,
      });
    });

    return relationships;
  }, [productRelationships, productSiblingGroupRelationships, siblingGroupProductRelationships, siblingGroupRelationships, siblingGroups, products, lang]);

  const getRelationshipTypeColor = (type: string) => {
    switch (type) {
      case 'accessory': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'bundle_item': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'cross_sell': return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
      case 'upsell': return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  if (allRelationships.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          {lang('commercialPerformance.relationshipOverview.noRelationships')}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{lang('commercialPerformance.relationshipOverview.title')}</h3>
          <p className="text-sm text-muted-foreground">
            {lang('commercialPerformance.relationshipOverview.subtitle').replace('{{count}}', String(allRelationships.length))}
          </p>
        </div>

        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang('commercialPerformance.relationshipOverview.mainItem')}</TableHead>
                <TableHead>{lang('commercialPerformance.relationshipOverview.type')}</TableHead>
                <TableHead className="text-center">→</TableHead>
                <TableHead>{lang('commercialPerformance.relationshipOverview.accessoryItem')}</TableHead>
                <TableHead>{lang('commercialPerformance.relationshipOverview.type')}</TableHead>
                <TableHead>{lang('commercialPerformance.relationshipOverview.relationship')}</TableHead>
                <TableHead className="text-right">{lang('commercialPerformance.relationshipOverview.revenuePercent')}</TableHead>
                <TableHead className="text-right">{lang('commercialPerformance.relationshipOverview.initial')}</TableHead>
                <TableHead className="text-right">{lang('commercialPerformance.relationshipOverview.recurring')}</TableHead>
                <TableHead>{lang('commercialPerformance.relationshipOverview.period')}</TableHead>
                <TableHead className="text-right">{lang('commercialPerformance.relationshipOverview.duration')}</TableHead>
                <TableHead className="text-center">{lang('commercialPerformance.relationshipOverview.required')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allRelationships.map((rel) => (
                <TableRow key={rel.id}>
                  <TableCell className="font-medium">{rel.mainName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {rel.mainType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">→</TableCell>
                  <TableCell className="font-medium">{rel.accessoryName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {rel.accessoryType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRelationshipTypeColor(rel.relationshipType)}>
                      {rel.relationshipType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {rel.revenueAttribution}%
                  </TableCell>
                  <TableCell className="text-right">{rel.initialMultiplier}x</TableCell>
                  <TableCell className="text-right">{rel.recurringMultiplier}x</TableCell>
                  <TableCell className="capitalize">{rel.recurringPeriod}</TableCell>
                  <TableCell className="text-right">{rel.lifecycleDuration} mo</TableCell>
                  <TableCell className="text-center">
                    {rel.isRequired ? (
                      <Badge variant="secondary" className="text-xs">{lang('commercialPerformance.relationshipOverview.yes')}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">{lang('commercialPerformance.relationshipOverview.no')}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </Card>
  );
}
