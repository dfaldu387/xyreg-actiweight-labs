import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Settings, 
  Trash2, 
  AlertTriangle,
  TrendingDown
} from 'lucide-react';
import { MarketExtension } from '@/services/enhanced-rnpv/interfaces';
import { CannibalizationImpact } from '@/services/cannibalizationImpactService';

interface MarketExtensionCardProps {
  extension: MarketExtension;
  cannibalizationData?: {
    impacts: CannibalizationImpact[];
    netPortfolioImpact: number;
  };
  onToggle: (extensionId: string, isActive: boolean) => void;
  onEdit: (extensionId: string) => void;
  onDelete: (extensionId: string, marketName: string) => void;
}

export function MarketExtensionCard({
  extension,
  cannibalizationData,
  onToggle,
  onEdit,
  onDelete
}: MarketExtensionCardProps) {
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
            </div>
            <div>
              <h4 className="font-medium">{extension.marketName}</h4>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Launch: {extension.revenueForecast.launchDate.toLocaleDateString()}
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
      </CardContent>
    </Card>
  );
}