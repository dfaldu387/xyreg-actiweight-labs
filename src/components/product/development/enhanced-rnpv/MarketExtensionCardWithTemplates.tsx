import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Settings, 
  Trash2, 
  AlertTriangle,
  TrendingDown,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { MarketExtension } from '@/services/enhanced-rnpv/interfaces';
import { CannibalizationImpact } from '@/services/cannibalizationImpactService';
import { SmartCostTemplateSelector } from './SmartCostTemplateSelector';
import { MarketExtensionService } from '@/services/enhanced-rnpv/marketExtensionService';
import { useToast } from '@/hooks/use-toast';

interface MarketExtensionCardWithTemplatesProps {
  extension: MarketExtension;
  cannibalizationData?: {
    impacts: CannibalizationImpact[];
    netPortfolioImpact: number;
  };
  companyId: string;
  deviceClass?: string;
  onToggle: (extensionId: string, isActive: boolean) => void;
  onEdit: (extensionId: string) => void;
  onDelete: (extensionId: string, marketName: string) => void;
  onUpdate: (updatedExtension: MarketExtension) => void;
}

export function MarketExtensionCardWithTemplates({
  extension,
  cannibalizationData,
  companyId,
  deviceClass = 'Class II',
  onToggle,
  onEdit,
  onDelete,
  onUpdate
}: MarketExtensionCardWithTemplatesProps) {
  const [showCostTemplates, setShowCostTemplates] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const getMarketStatusColor = () => {
    if (!extension.isActive) return 'bg-muted';
    const hasRevenue = extension.revenueForecast.monthlyRevenue.length > 0;
    const hasRegulatory = extension.regulatoryPhases.length > 0;
    if (hasRevenue && hasRegulatory) return 'bg-green-100 border-green-300';
    if (hasRevenue || hasRegulatory) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  const marketCannibalizationImpacts = cannibalizationData?.impacts.filter(
    impact => impact.marketCode === extension.marketCode
  ) || [];

  const hasCannibarizationImpact = marketCannibalizationImpacts.length > 0;

  const handleCostsFromTemplate = async (costs: Record<string, number>) => {
    try {
      const updatedCosts = {
        ...extension.marketSpecificCosts,
        regulatorySubmissionFees: costs.regulatory || extension.marketSpecificCosts.regulatorySubmissionFees,
        clinicalTrialCosts: costs.clinical || extension.marketSpecificCosts.clinicalTrialCosts,
        marketingInvestment: costs.marketing || extension.marketSpecificCosts.marketingInvestment,
        distributionCosts: costs.distribution || extension.marketSpecificCosts.distributionCosts,
        maintenanceCosts: costs.maintenance || extension.marketSpecificCosts.maintenanceCosts,
        additionalCosts: [
          ...extension.marketSpecificCosts.additionalCosts,
          ...Object.entries(costs).filter(([key]) => 
            !['regulatory', 'clinical', 'marketing', 'distribution', 'maintenance'].includes(key)
          ).map(([name, amount]) => ({
            name,
            amount,
            timing: 'upfront' as const
          }))
        ]
      };

      const updatedExtension = await MarketExtensionService.updateMarketExtension(
        extension.id,
        { marketSpecificCosts: updatedCosts }
      );

      onUpdate(updatedExtension);
      
      toast({
        title: "Costs Updated",
        description: "Market costs have been updated from templates."
      });
    } catch (error) {
      console.error('Failed to update costs:', error);
      toast({
        title: "Error",
        description: "Failed to update market costs.",
        variant: "destructive"
      });
    }
  };

  const getTotalMarketCost = () => {
    const costs = extension.marketSpecificCosts;
    return costs.regulatorySubmissionFees + 
           costs.clinicalTrialCosts + 
           costs.marketingInvestment + 
           costs.distributionCosts + 
           costs.maintenanceCosts +
           costs.additionalCosts.reduce((sum, cost) => sum + cost.amount, 0);
  };

  const isConfigured = () => {
    return getTotalMarketCost() > 0 || extension.revenueForecast.monthlyRevenue.length > 0;
  };

  return (
    <Card className={`transition-colors ${getMarketStatusColor()}`}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={extension.isActive}
                onCheckedChange={(checked) => onToggle(extension.id, checked)}
              />
              <Badge variant={extension.isActive ? "default" : "secondary"}>
                {extension.marketCode}
              </Badge>
              {!isConfigured() && (
                <Badge variant="destructive" className="text-xs">
                  Not yet configured
                </Badge>
              )}
            </div>
            <div>
              <h4 className="font-medium">{extension.marketName}</h4>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Launch: {new Date(extension.revenueForecast.launchDate).toLocaleDateString()}
                </span>
                {extension.revenueForecast.peakRevenue && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Peak: {formatCurrency(extension.revenueForecast.peakRevenue)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {extension.regulatoryPhases.length} phases
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Cost: {formatCurrency(getTotalMarketCost())}
                </span>
                {hasCannibarizationImpact && (
                  <span className="flex items-center gap-1 text-orange-600">
                    <AlertTriangle className="h-3 w-3" />
                    Cannibalization
                  </span>
                )}
              </div>
              
              {/* Cannibalization Impact Summary */}
              {hasCannibarizationImpact && (
                <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
                  <div className="flex items-center gap-1 text-orange-800 font-medium mb-1">
                    <TrendingDown className="h-3 w-3" />
                    Portfolio Impact in {extension.marketCode}
                  </div>
                  {marketCannibalizationImpacts.map((impact, index) => (
                    <div key={index} className="text-orange-700">
                      Affects {impact.affectedProductName}: {formatCurrency(impact.totalEstimatedLoss)} loss
                    </div>
                  ))}
                  {cannibalizationData?.netPortfolioImpact !== undefined && (
                    <div className="mt-1 pt-1 border-t border-orange-300 font-medium">
                      Net Impact: {cannibalizationData.netPortfolioImpact >= 0 ? '+' : ''}{formatCurrency(cannibalizationData.netPortfolioImpact)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCostTemplates(!showCostTemplates)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Cost Templates
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(extension.id)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(extension.id, extension.marketName)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 space-y-3">
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium mb-2">Market Costs Breakdown</h5>
                <div className="space-y-1 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Regulatory:</span>
                    <span>{formatCurrency(extension.marketSpecificCosts.regulatorySubmissionFees)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Clinical:</span>
                    <span>{formatCurrency(extension.marketSpecificCosts.clinicalTrialCosts)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Marketing:</span>
                    <span>{formatCurrency(extension.marketSpecificCosts.marketingInvestment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distribution:</span>
                    <span>{formatCurrency(extension.marketSpecificCosts.distributionCosts)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Maintenance:</span>
                    <span>{formatCurrency(extension.marketSpecificCosts.maintenanceCosts)}</span>
                  </div>
                  {extension.marketSpecificCosts.additionalCosts.map((cost, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{cost.name}:</span>
                      <span>{formatCurrency(cost.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total:</span>
                    <span>{formatCurrency(getTotalMarketCost())}</span>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="font-medium mb-2">Revenue Forecast</h5>
                <div className="space-y-1 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Launch Date:</span>
                    <span>{new Date(extension.revenueForecast.launchDate).toLocaleDateString()}</span>
                  </div>
                  {extension.revenueForecast.peakRevenue && (
                    <div className="flex justify-between">
                      <span>Peak Revenue:</span>
                      <span>{formatCurrency(extension.revenueForecast.peakRevenue)}</span>
                    </div>
                  )}
                  {extension.revenueForecast.marketPenetration && (
                    <div className="flex justify-between">
                      <span>Market Penetration:</span>
                      <span>{extension.revenueForecast.marketPenetration}%</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Discount Rate:</span>
                    <span>{(extension.revenueForecast.discountRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Data Points:</span>
                    <span>{extension.revenueForecast.monthlyRevenue.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cost Templates */}
        {showCostTemplates && (
          <div className="mt-4">
            <Separator className="mb-4" />
            <SmartCostTemplateSelector
              marketCode={extension.marketCode}
              deviceClass={deviceClass}
              companyId={companyId}
              launchDate={new Date(extension.revenueForecast.launchDate)}
              onCostsSelected={handleCostsFromTemplate}
              initialCosts={{
                regulatory: extension.marketSpecificCosts.regulatorySubmissionFees,
                clinical: extension.marketSpecificCosts.clinicalTrialCosts,
                marketing: extension.marketSpecificCosts.marketingInvestment,
                distribution: extension.marketSpecificCosts.distributionCosts,
                maintenance: extension.marketSpecificCosts.maintenanceCosts
              }}
              targetCurrency={extension.marketSpecificCosts.currency}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}