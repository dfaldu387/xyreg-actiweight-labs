import React, { useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskClassificationTable } from '@/components/product/definition/RiskClassificationTable';
import { EnhancedProductMarket } from '@/types/client';
import { TabHeader } from "./TabHeader";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedMarketsSection } from './EnhancedMarketsSection';
import { useToast } from "@/hooks/use-toast";
import { isValidUUID } from '@/utils/uuidValidation';
import { useTranslation } from '@/hooks/useTranslation';

interface RiskManagementTabProps {
  productId: string;
  companyId: string;
  selectedMarkets?: EnhancedProductMarket[];
  onMarketsChange?: (markets: EnhancedProductMarket[]) => void;
  disabled?: boolean;
}

// Type guard for EnhancedProductMarket array
const isEnhancedProductMarketArray = (arr: any[]): arr is EnhancedProductMarket[] =>
  arr.every(
    market =>
      typeof market === "object" &&
      market !== null &&
      "name" in market &&
      "code" in market &&
      "selected" in market
  );

export function RiskManagementTab({
  productId,
  companyId,
  selectedMarkets = [],
  onMarketsChange,
  disabled = false
}: RiskManagementTabProps) {
  const { lang } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const pendingMarketsRef = useRef<EnhancedProductMarket[] | null>(null);

  // Query product data - single source of truth
  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('class, eudamed_risk_class, basic_udi_di, markets')
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: isValidUUID(productId)
  });

  // Mutation to save markets
  const updateMarketsMutation = useMutation({
    mutationFn: async (updatedMarkets: EnhancedProductMarket[]) => {
      // Guard against undefined productId
      if (!isValidUUID(productId)) {
        console.error('[RiskManagementTab] Invalid productId:', productId);
        throw new Error('Invalid product ID');
      }
      
      const { error } = await supabase
        .from('products')
        .update({ markets: updatedMarkets })
        .eq('id', productId);

      if (error) throw error;
      return updatedMarkets;
    },
    onSuccess: (updatedMarkets) => {
      // Invalidate funnel progress so checklist updates immediately
      queryClient.invalidateQueries({ queryKey: ['funnel-product', productId] });
      // Invalidate productDetails cache for Evidence Plan and other pages
      queryClient.invalidateQueries({ queryKey: ['productDetails', productId] });

      toast({
        title: lang('risk.toast.marketsUpdated'),
        description: lang('risk.toast.marketsUpdatedDescription'),
      });
      onMarketsChange?.(updatedMarkets);
    },
    onError: () => {
      // Revert cache on error - refetch from server
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['funnel-product', productId] });
      queryClient.invalidateQueries({ queryKey: ['productDetails', productId] });

      toast({
        title: lang('risk.toast.error'),
        description: lang('risk.toast.errorDescription'),
        variant: "destructive",
      });
    }
  });

  // Cleanup debounce on unmount - flush any pending saves
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        // Flush pending save before unmount (only if valid productId)
        if (pendingMarketsRef.current && isValidUUID(productId)) {
          updateMarketsMutation.mutate(pendingMarketsRef.current);
          pendingMarketsRef.current = null;
        }
      }
    };
  }, [productId]);

  // Get markets from React Query cache (single source of truth)
  const currentMarkets: EnhancedProductMarket[] = useMemo(() => {
    return Array.isArray(product?.markets) && isEnhancedProductMarketArray(product.markets as any[])
      ? (product.markets as unknown as EnhancedProductMarket[])
      : selectedMarkets;
  }, [product?.markets, selectedMarkets]);

  // Handle market changes - update cache instantly, debounce save (500ms)
  const handleMarketsChange = (updated: EnhancedProductMarket[]) => {
    if (disabled) return;
    if (!isValidUUID(productId)) {
      console.error('[RiskManagementTab] Cannot save markets - invalid productId:', productId);
      return;
    }

    // Update React Query cache immediately (instant UI update)
    queryClient.setQueryData(['product', productId], (old: any) => ({
      ...old,
      markets: updated
    }));

    // Store pending data for flush on unmount
    pendingMarketsRef.current = updated;

    // Debounce database save - 500ms after user stops typing
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateMarketsMutation.mutate(updated);
      pendingMarketsRef.current = null; // Clear pending after save
    }, 500);
  };

  // Calculate completion percentage based on risk data
  const completionPercentage = useMemo(() => {
    const hasSelectedMarkets = currentMarkets.length > 0;
    const hasRiskClassifications = currentMarkets.some(market => market.riskClass) || product?.class;

    let score = 0;
    if (hasSelectedMarkets) score += 40;
    if (hasRiskClassifications) score += 60;

    return score;
  }, [currentMarkets, product?.class]);

  // Check if this is an EUDAMED product
  const hasEudamedData = !!(product?.eudamed_risk_class || product?.basic_udi_di);
  const productClass = product?.class || product?.eudamed_risk_class;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <TabHeader
            title={lang('risk.title')}
            subtitle={lang('risk.subtitle')}
            completionPercentage={completionPercentage}
            isEudamedTab={true}
            isProgress={false}
          />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Target Markets Section */}
          <EnhancedMarketsSection
            markets={currentMarkets}
            onMarketsChange={handleMarketsChange}
            companyId={companyId}
            hasEudamedData={hasEudamedData}
            disabled={disabled}
            isLoading={updateMarketsMutation.isPending}
          />

          {/* Risk Classification Section */}
          <Card className={disabled ? 'opacity-60 pointer-events-none' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                {lang('risk.classificationByMarket')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RiskClassificationTable
                selectedMarkets={currentMarkets}
                productClass={productClass}
                hasEudamedData={hasEudamedData}
                disabled={disabled}
                onRiskDataChange={(riskData) => {
                  if (disabled) return;
                  console.log('Risk data updated:', riskData);
                  // TODO: Save risk data to database
                }}
              />
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
