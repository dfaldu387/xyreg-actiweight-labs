import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, DollarSign, RefreshCw } from "lucide-react";
// Force rebuild to resolve timeout issue
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
import { PricingTree } from "./PricingTree";
import { RuleEditor } from "./RuleEditor";
import { PricingService } from "@/services/pricingService";
import { HierarchyService } from "@/services/hierarchyService";
import { MARKET_CURRENCIES } from "@/utils/marketCurrencyUtils";
import { useTranslation } from "@/hooks/useTranslation";

interface PricingStrategyProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export const PricingStrategy: React.FC<PricingStrategyProps> = ({
  productId,
  companyId,
  disabled = false,
}) => {
  const { lang } = useTranslation();
  const [selectedMarket, setSelectedMarket] = useState<string>('US');
  const [ruleEditorOpen, setRuleEditorOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string>('');
  const [editingProductName, setEditingProductName] = useState<string>('');
  const [editingRule, setEditingRule] = useState<any>(null);

  const queryClient = useQueryClient();

  // Fetch product hierarchy - filter to specific product for product-specific pricing
  const { data: fullHierarchy = [], isLoading: hierarchyLoading } = useQuery({
    queryKey: ['product-hierarchy', companyId],
    queryFn: () => HierarchyService.getCompanyProductHierarchy(companyId),
  });

  // Filter hierarchy to only include the specific product when in product context
  const hierarchy = React.useMemo(() => {
    if (!productId) return fullHierarchy;
    
    const findProductInHierarchy = (nodes: any[], targetId: string): any[] => {
      for (const node of nodes) {
        if (node.id === targetId) {
          return [{ ...node, children: [] }]; // Return just this product without children
        }
        const found = findProductInHierarchy(node.children, targetId);
        if (found.length > 0) return found;
      }
      return [];
    };
    
    return findProductInHierarchy(fullHierarchy, productId);
  }, [fullHierarchy, productId]);

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
      toast.success('Pricing rule created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create pricing rule: ' + error.message);
    },
  });

  // Update pricing rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      PricingService.updatePricingRule(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      queryClient.invalidateQueries({ queryKey: ['effective-pricing'] });
      toast.success('Pricing rule updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update pricing rule: ' + error.message);
    },
  });

  // Recompute pricing mutation
  const recomputeMutation = useMutation({
    mutationFn: () => PricingService.recomputeCompanyPricing(companyId, selectedMarket),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['effective-pricing'] });
      toast.success('Pricing recomputed successfully');
    },
    onError: (error) => {
      toast.error('Failed to recompute pricing: ' + error.message);
    },
  });

  const handleEditRule = (productId: string, rule?: any) => {
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
    handleEditRule(productId, null);
  };

  const handleSaveRule = async (ruleData: any) => {
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
      {/* Header with Market Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              <span className="text-foreground font-semibold">{lang('commercial.pricingStrategy.productTitle')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => recomputeMutation.mutate()}
                disabled={disabled || recomputeMutation.isPending}
                className="flex items-center gap-2"
              >
                {recomputeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {lang('commercial.pricingStrategy.recompute')}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">{lang('commercial.pricingStrategy.market')}</label>
              <Select value={selectedMarket} onValueChange={setSelectedMarket}>
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
              {productId ?
                lang('commercial.pricingStrategy.productDescription') :
                lang('commercial.pricingStrategy.marketDescription')
              }
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
          disabled={disabled}
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