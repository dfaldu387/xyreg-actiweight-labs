import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalendarIcon, TrendingUp, Upload, Plus } from "lucide-react";
import { useRestrictedFeature } from '@/contexts/RestrictedFeatureContext';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { PORTFOLIO_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { format } from "date-fns";
import { useTranslation } from '@/hooks/useTranslation';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CommercialDataUploader } from './CommercialDataUploader';
import { AddCommercialEntryDialog } from './AddCommercialEntryDialog';
import { FinancialDataTable } from './FinancialDataTable';
import { ForecastingWidget } from './ForecastingWidget';
import { SmartForecastingWidget } from './SmartForecastingWidget';
import { AIPrognosisFactors } from './AIPrognosisFactors';
import { ProductLifecycleBanner } from './ProductLifecycleBanner';


import { ProductCascadeForecastTable } from './ProductCascadeForecastTable';
import { RelationshipOverviewTable } from './RelationshipOverviewTable';
import { useCompanyProductLifecycle } from '@/hooks/useProductLifecycle';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProductAccessoryRelationships } from '@/hooks/useProductRelationships';
import { useProductSiblingGroupRelationships } from '@/hooks/useProductSiblingGroupRelationships';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CommercialPerformancePageProps {
  companyId: string;
}

export function CommercialPerformancePage({ companyId }: CommercialPerformancePageProps) {
  // Restriction check - double security pattern
  const { isRestricted: contextRestricted } = useRestrictedFeature();
  const { isMenuAccessKeyEnabled } = usePlanMenuAccess();
  const isFeatureEnabled = isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.COMMERCIAL_COMMERCIAL_PERFORMANCE);
  const isRestricted = contextRestricted || !isFeatureEnabled;
  const { lang } = useTranslation();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showUploader, setShowUploader] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [selectedProductForCascade, setSelectedProductForCascade] = useState<string>('');
  
  // Use the new hook for lifecycle management
  const { portfolioSummary, loading, error, refetch: refetchPortfolioSummary } = useCompanyProductLifecycle(companyId);
  
  // Fetch all products for relationship architecture
  const { data: productsData = [] } = useQuery({
    queryKey: ['company-products', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, model_reference, trade_name, parent_product_id, company_id, is_archived')
        .eq('company_id', companyId)
        .eq('is_archived', false);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch product-to-product relationships WITH variant data
  const { data: productRelationships = [], refetch: refetchProductRels } = useQuery({
    queryKey: ['product-accessory-relationships-with-variants', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_accessory_relationships')
        .select(`
          *,
          accessory_product:products!accessory_product_id(
            id,
            name,
            trade_name,
            product_variants(id, name, product_id)
          )
        `)
        .eq('company_id', companyId);
      if (error) throw error;
      return data || [];
    },
  });
  
  const { data: productSiblingGroupRelationships = [], refetch: refetchProdToGroup } = useProductSiblingGroupRelationships(companyId);
  
  // Fetch group-to-product relationships WITH variant data
  const { data: siblingGroupProductRelationships = [], refetch: refetchGroupToProd } = useQuery({
    queryKey: ['sibling-group-product-relationships-with-variants', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sibling_group_product_relationships')
        .select(`
          *,
          accessory_product:products(
            id,
            name,
            trade_name,
            product_variants(id, name, product_id)
          )
        `)
        .eq('company_id', companyId);
      if (error) throw error;
      return data || [];
    },
  });
  
  const { data: siblingGroupRelationships = [], refetch: refetchGroupToGroup } = useQuery({
    queryKey: ['sibling-group-relationships', companyId],
    queryFn: async () => {
      const { data: relationships, error: relError } = await supabase
        .from('sibling_group_relationships' as any)
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (relError) throw relError;
      if (!relationships || relationships.length === 0) return [];

      // Get all unique group IDs
      const groupIds = new Set<string>();
      relationships.forEach((rel: any) => {
        if (rel.main_sibling_group_id) groupIds.add(rel.main_sibling_group_id);
        if (rel.accessory_sibling_group_id) groupIds.add(rel.accessory_sibling_group_id);
      });

      // Fetch all groups in one query
      const { data: groups, error: groupError } = await supabase
        .from('product_sibling_groups')
        .select('id, name, basic_udi_di, distribution_pattern')
        .in('id', Array.from(groupIds));

      if (groupError) throw groupError;

      // Create a map for quick lookup
      const groupMap = new Map(groups?.map(g => [g.id, g]) || []);

      // Enrich relationships with group data
      return relationships.map((rel: any) => ({
        ...rel,
        main_group: groupMap.get(rel.main_sibling_group_id) || null,
        accessory_group: groupMap.get(rel.accessory_sibling_group_id) || null,
      }));
    },
  });
  
  // Force refresh all relationship data on mount to clear cache
  useEffect(() => {
    refetchProductRels();
    refetchProdToGroup();
    refetchGroupToProd();
    refetchGroupToGroup();
  }, [refetchProductRels, refetchProdToGroup, refetchGroupToProd, refetchGroupToGroup]);
  
  // Fetch sibling groups
  const { data: siblingGroups = [] } = useQuery({
    queryKey: ['sibling-groups', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_sibling_groups')
        .select(`
          *,
          product_sibling_assignments (
            id,
            product_id,
            percentage,
            position,
            products (
              id,
              name,
              model_reference,
              trade_name,
              product_variants(id, name, product_id)
            )
          )
        `)
        .eq('company_id', companyId)
        .order('position', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const selectedProduct = productsData.find(p => p.id === selectedProductForCascade);

  const handleUpdateRNPV = () => {
    if (isRestricted) return;
    // TODO: Implement rNPV model update logic
  };

  const handleNavigateToRNPV = () => {
    if (isRestricted) return;
    // Navigate to rNPV analysis page for development products
    if (portfolioSummary?.developmentProducts?.products?.length > 0) {
      const firstDevProduct = portfolioSummary.developmentProducts.products[0];
      window.location.href = `/app/product/${firstDevProduct.productId}/business-case?tab=rnpv`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{lang('commercialPerformance.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{lang('commercialPerformance.error')}: {error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            {lang('commercialPerformance.retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-tour="commercial-performance-page">
      {/* Product Lifecycle Banner - Key differentiator for development vs. commercial */}
      {portfolioSummary && (
        <ProductLifecycleBanner
          portfolioSummary={portfolioSummary}
          companyId={companyId}
          onNavigateToRNPV={handleNavigateToRNPV}
          onRefresh={refetchPortfolioSummary}
          disabled={isRestricted}
        />
      )}

      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">{lang('commercialPerformance.title')}</h1>
            <p className="text-muted-foreground mt-2">
              {lang('commercialPerformance.subtitle')}
            </p>
          </div>

        </div>
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
                data-tour="date-picker"
                disabled={isRestricted}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "MMMM yyyy") : <span>{lang('commercialPerformance.pickMonth')}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && !isRestricted && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button
            onClick={handleUpdateRNPV}
            className="bg-primary text-primary-foreground"
            data-tour="update-rnpv-button"
            disabled={isRestricted}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            {lang('commercialPerformance.updateRnpvModel')}
          </Button>
        </div>
      </div>

      {/* Data Input & Management */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{lang('commercialPerformance.financialDataManagement')}</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => !isRestricted && setShowUploader(true)}
              variant="outline"
              className="bg-accent text-accent-foreground"
              data-tour="upload-csv-button"
              disabled={isRestricted}
            >
              <Upload className="h-4 w-4 mr-2" />
              {lang('commercialPerformance.uploadCsv')}
            </Button>
            <Button
              variant="outline"
              onClick={() => !isRestricted && setShowAddEntry(true)}
              data-tour="add-entry-button"
              disabled={isRestricted}
            >
              <Plus className="h-4 w-4 mr-2" />
              {lang('commercialPerformance.addEntry')}
            </Button>
          </div>
        </div>

        <div data-tour="financial-data-table">
          <FinancialDataTable
            companyId={companyId}
            selectedMonth={selectedDate}
            disabled={isRestricted}
          />
        </div>
      </div>

      {/* Product Relationships Overview */}
      <div data-tour="product-architecture" className="space-y-6">
        <RelationshipOverviewTable
          productRelationships={productRelationships}
          productSiblingGroupRelationships={productSiblingGroupRelationships}
          siblingGroupProductRelationships={siblingGroupProductRelationships}
          siblingGroupRelationships={siblingGroupRelationships}
          siblingGroups={siblingGroups}
          products={productsData}
        />
      </div>

      {/* Sales Impact Analysis */}
      <div data-tour="sales-impact" className="space-y-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{lang('commercialPerformance.salesImpact.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {lang('commercialPerformance.salesImpact.subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">{lang('commercialPerformance.salesImpact.selectDevice')}</label>
              <Select value={selectedProductForCascade} onValueChange={setSelectedProductForCascade} disabled={isRestricted}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder={lang('commercialPerformance.salesImpact.chooseDevice')} />
                </SelectTrigger>
                <SelectContent>
                  {productsData
                    .filter(p => !p.parent_product_id)
                    .map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
        
        <ProductCascadeForecastTable
          companyId={companyId}
          mainProduct={selectedProduct}
          productRelationships={productRelationships}
          productSiblingGroupRelationships={productSiblingGroupRelationships}
          siblingGroupProductRelationships={siblingGroupProductRelationships}
          siblingGroupRelationships={siblingGroupRelationships}
          siblingGroups={siblingGroups}
        />
      </div>

      {/* Forecasting Section */}
      <div className="grid grid-cols-1 gap-6" data-tour="forecasting-widgets">
        <div data-tour="basic-forecasting-widget">
          <ForecastingWidget companyId={companyId} disabled={isRestricted} />
        </div>
        <div data-tour="smart-forecasting-widget">
          <SmartForecastingWidget companyId={companyId} disabled={isRestricted} />
        </div>
        <div data-tour="ai-prognosis-factors">
          <AIPrognosisFactors companyId={companyId} disabled={isRestricted} />
        </div>
      </div>

      {/* Upload Dialog */}
      <CommercialDataUploader
        companyId={companyId}
        open={showUploader}
        onOpenChange={setShowUploader}
      />
      
      {/* Add Entry Dialog */}
      <AddCommercialEntryDialog
        companyId={companyId}
        open={showAddEntry}
        onOpenChange={setShowAddEntry}
      />
    </div>
  );
}