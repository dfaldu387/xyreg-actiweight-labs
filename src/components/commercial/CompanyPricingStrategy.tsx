import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, DollarSign, RefreshCw } from "lucide-react";
import { useRestrictedFeature } from '@/contexts/RestrictedFeatureContext';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { PORTFOLIO_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PricingTree } from "../pricing/PricingTree";
import { RuleEditor } from "../pricing/RuleEditor";
import { PricingService } from "@/services/pricingService";
import { HierarchyService } from "@/services/hierarchyService";
import { MARKET_CURRENCIES } from "@/utils/marketCurrencyUtils";


interface CompanyPricingStrategyProps {
  companyId: string;
}

export const CompanyPricingStrategy: React.FC<CompanyPricingStrategyProps> = ({
  companyId,
}) => {
  // Restriction check - double security pattern
  const { isRestricted: contextRestricted } = useRestrictedFeature();
  const { isMenuAccessKeyEnabled } = usePlanMenuAccess();
  const isFeatureEnabled = isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.COMMERCIAL_PRICING_STRATEGY);
  const isRestricted = contextRestricted || !isFeatureEnabled;

  const { lang } = useTranslation();
  const [selectedMarket, setSelectedMarket] = useState<string>('US');
  const [ruleEditorOpen, setRuleEditorOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string>('');
  const [editingProductName, setEditingProductName] = useState<string>('');
  const [editingRule, setEditingRule] = useState<any>(null);

  const queryClient = useQueryClient();

  // Fetch product hierarchy
  const { data: hierarchy = [], isLoading: hierarchyLoading } = useQuery({
    queryKey: ['product-hierarchy', companyId],
    queryFn: () => HierarchyService.getCompanyProductHierarchy(companyId),
  });

  // Fetch company markets
  const { data: markets = [] } = useQuery({
    queryKey: ['company-markets', companyId],
    queryFn: () => PricingService.getCompanyMarkets(companyId),
    initialData: ['US'], // Default to US market
  });

  // Fetch pricing rules
  const { data: pricingRules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['pricing-rules', companyId, selectedMarket],
    queryFn: () => PricingService.getCompanyPricingRules(companyId),
  });

  // Fetch effective pricing
  const { data: effectivePricing = [], isLoading: pricingLoading } = useQuery({
    queryKey: ['effective-pricing', companyId, selectedMarket],
    queryFn: () => PricingService.getEffectivePricing(companyId, selectedMarket),
  });

  // Create pricing rule mutation
  const createRuleMutation = useMutation({
    mutationFn: PricingService.createPricingRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      queryClient.invalidateQueries({ queryKey: ['effective-pricing'] });
      toast.success(lang('commercial.pricingStrategy.ruleCreatedSuccess'));
    },
    onError: (error) => {
      toast.error(lang('commercial.pricingStrategy.ruleCreatedError') + ': ' + error.message);
    },
  });

  // Update pricing rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      PricingService.updatePricingRule(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      queryClient.invalidateQueries({ queryKey: ['effective-pricing'] });
      toast.success(lang('commercial.pricingStrategy.ruleUpdatedSuccess'));
    },
    onError: (error) => {
      toast.error(lang('commercial.pricingStrategy.ruleUpdatedError') + ': ' + error.message);
    },
  });

  // Recompute pricing mutation
  const recomputeMutation = useMutation({
    mutationFn: () => PricingService.recomputeCompanyPricing(companyId, selectedMarket),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['effective-pricing'] });
      toast.success(lang('commercial.pricingStrategy.recomputeSuccess'));
    },
    onError: (error) => {
      toast.error(lang('commercial.pricingStrategy.recomputeError') + ': ' + error.message);
    },
  });

  const handleEditRule = (productId: string, rule?: any) => {
    if (isRestricted) return;
    // Find product name
    const findProductName = (nodes: any[], id: string): string => {
      for (const node of nodes) {
        if (node.id === id) return node.name;
        const childResult = findProductName(node.children, id);
        if (childResult) return childResult;
      }
      return lang('commercial.pricingStrategy.unknownDevice');
    };

    setEditingProductId(productId);
    setEditingProductName(findProductName(hierarchy, productId));
    setEditingRule(rule);
    setRuleEditorOpen(true);
  };

  const handleCreateRule = (productId: string) => {
    if (isRestricted) return;
    handleEditRule(productId, null);
  };

  const handleSaveRule = async (ruleData: any) => {
    if (isRestricted) return;
    if (editingRule) {
      await updateRuleMutation.mutateAsync({
        id: editingRule.id,
        updates: ruleData,
      });
    } else {
      await createRuleMutation.mutateAsync(ruleData);
    }
  };

  const availableMarkets = [
    ...new Set([
      ...markets,
      ...Object.keys(MARKET_CURRENCIES)
    ])
  ].map(code => ({
    code,
    name: MARKET_CURRENCIES[code]?.name || code,
  }));

  const isLoading = hierarchyLoading || rulesLoading || pricingLoading;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">{lang('commercial.pricingStrategy.title')}</h2>

        </div>
        <p className="text-muted-foreground">
          {lang('commercial.pricingStrategy.subtitle')}
        </p>
      </div>

      {/* Header with Market Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              <span className="text-foreground font-semibold">{lang('commercial.pricingStrategy.pricingConfiguration')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => !isRestricted && recomputeMutation.mutate()}
                disabled={recomputeMutation.isPending || isRestricted}
                className="flex items-center gap-2"
              >
                {recomputeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {lang('commercial.pricingStrategy.recomputePricing')}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">{lang('commercial.pricingStrategy.market')}</label>
              <Select value={selectedMarket} onValueChange={setSelectedMarket} disabled={isRestricted}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableMarkets.map((market) => (
                    <SelectItem key={market.code} value={market.code}>
                      <div className="flex items-center justify-between w-full">
                        <span>{market.name} ({market.code})</span>
                        <Badge variant="outline" className="ml-2">
                          {MARKET_CURRENCIES[market.code]?.symbol || market.code}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground">
              {lang('commercial.pricingStrategy.marketDescription')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Tree */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">{lang('commercial.pricingStrategy.loadingPricingData')}</p>
          </CardContent>
        </Card>
      ) : (
        <PricingTree
          hierarchy={hierarchy}
          effectivePricing={effectivePricing}
          pricingRules={pricingRules}
          selectedMarket={selectedMarket}
          onEditRule={handleEditRule}
          onCreateRule={handleCreateRule}
          disabled={isRestricted}
        />
      )}

      {/* Rule Editor Dialog */}
      <RuleEditor
        open={ruleEditorOpen}
        onOpenChange={setRuleEditorOpen}
        productId={editingProductId}
        productName={editingProductName}
        companyId={companyId}
        existingRule={editingRule}
        onSave={handleSaveRule}
      />
    </div>
  );
};