import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Package, TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react';
import { ProductWithBasicUDI } from '@/hooks/useProductsByBasicUDI';
import { useFamilyMetrics } from '@/hooks/useFamilyMetrics';

interface FamilyMetricCardsProps {
  products: ProductWithBasicUDI[];
}

export function FamilyMetricCards({ products }: FamilyMetricCardsProps) {
  const {
    calculateFamilyPortfolioStatus,
    calculatePipelineHealth,
    calculateComplianceMetrics,
    calculateActionItems
  } = useFamilyMetrics();

  const portfolioStatus = calculateFamilyPortfolioStatus(products);
  const pipelineHealth = calculatePipelineHealth(products);
  const compliance = calculateComplianceMetrics(products);
  const actionItems = calculateActionItems(products);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1 - Blue - Portfolio Status */}
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-500" />
            FAMILY PORTFOLIO STATUS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold mb-4 text-blue-500">{portfolioStatus.total}</div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>{portfolioStatus.launched} Launched</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <span>{portfolioStatus.inDevelopment} In Development</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-muted"></div>
              <span>{portfolioStatus.retired} Retired</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2 - Green - Pipeline Health */}
      <Card className="bg-green-500/10 border-green-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            PIPELINE HEALTH
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2 text-green-500">
            Active Development: {pipelineHealth.activeDevCount}
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {pipelineHealth.summary}
          </p>
          <Progress value={pipelineHealth.progressPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {pipelineHealth.progressPercentage}% family completion
          </p>
        </CardContent>
      </Card>

      {/* Card 3 - Purple - Post-Market Compliance */}
      <Card className="bg-purple-500/10 border-purple-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-purple-500" />
            POST-MARKET COMPLIANCE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2 text-purple-500">
            {compliance.onMarket} On Market
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {compliance.activeCAPAs} Active CAPAs total. {compliance.criticalHolds} Critical Holds.
          </p>
          <div className="flex justify-center">
            <ShieldCheck className="h-12 w-12 text-green-500" />
          </div>
        </CardContent>
      </Card>

      {/* Card 4 - Red - Family Action Items */}
      <Card className="bg-red-500/10 border-red-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            FAMILY ACTION ITEMS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold mb-2 text-red-500">
            {actionItems.overdueCount}
          </div>
          <p className="text-sm font-medium mb-1">Overdue Total</p>
          <p className="text-sm text-muted-foreground mb-4">
            {actionItems.criticalCount} require immediate sign-off.
          </p>
          <div className="flex justify-center">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
