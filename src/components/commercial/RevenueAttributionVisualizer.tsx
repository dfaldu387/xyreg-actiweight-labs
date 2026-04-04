import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, Package, DollarSign, RefreshCw } from "lucide-react";
import { useProductAccessoryRelationships } from "@/hooks/useProductRelationships";

interface RevenueAttributionVisualizerProps {
  companyId: string;
}

export function RevenueAttributionVisualizer({ companyId }: RevenueAttributionVisualizerProps) {
  const { data: relationships, isLoading } = useProductAccessoryRelationships(companyId);

  const attributionStats = useMemo(() => {
    if (!relationships) return null;

    const activeAttributions = relationships.filter(r => r.revenue_attribution_percentage > 0);
    const totalAttributionFlow = activeAttributions.reduce((sum, r) => sum + r.revenue_attribution_percentage, 0);
    const smartMultiplierCount = relationships.filter(r => 
      (r.initial_multiplier && r.initial_multiplier > 0) || 
      (r.recurring_multiplier && r.recurring_multiplier > 0)
    ).length;

    return {
      totalAttributions: activeAttributions.length,
      averageAttribution: activeAttributions.length > 0 
        ? (totalAttributionFlow / activeAttributions.length).toFixed(1)
        : '0',
      smartMultipliers: smartMultiplierCount,
      highImpact: activeAttributions.filter(r => r.revenue_attribution_percentage >= 50).length,
    };
  }, [relationships]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-pulse text-muted-foreground">Loading attribution data...</div>
      </div>
    );
  }

  const activeAttributions = relationships?.filter(r => r.revenue_attribution_percentage > 0) || [];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Active Attributions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{attributionStats?.totalAttributions || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Avg. Attribution %</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{attributionStats?.averageAttribution}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Smart Multipliers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{attributionStats?.smartMultipliers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">High Impact (≥50%)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{attributionStats?.highImpact || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Attribution Flow Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Attribution Flow
          </CardTitle>
          <CardDescription>Visual representation of how revenue flows between products</CardDescription>
        </CardHeader>
        <CardContent>
          {activeAttributions.length > 0 ? (
            <div className="space-y-3">
              {activeAttributions.map((relationship: any) => (
                <div key={relationship.id} className="relative">
                  {/* Attribution Flow Card */}
                  <div className="flex items-center gap-4 p-4 rounded-lg border bg-gradient-to-r from-background via-muted/30 to-background">
                    {/* Source Product */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-semibold text-sm truncate">
                          {relationship.accessory_product?.name}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {relationship.accessory_product?.model_reference}
                      </div>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {relationship.relationship_type.replace('_', ' ')}
                      </Badge>
                    </div>

                    {/* Attribution Percentage & Arrow */}
                    <div className="flex flex-col items-center gap-1 px-6">
                      <ArrowRight className="h-6 w-6 text-primary" />
                      <div className="flex flex-col items-center bg-primary/10 rounded-full px-3 py-1">
                        <span className="text-lg font-bold text-primary">
                          {relationship.revenue_attribution_percentage}%
                        </span>
                        <span className="text-[10px] text-muted-foreground">attribution</span>
                      </div>
                      {(relationship.initial_multiplier > 0 || relationship.recurring_multiplier > 0) && (
                        <div className="flex items-center gap-1 mt-1">
                          <RefreshCw className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">Smart</span>
                        </div>
                      )}
                    </div>

                    {/* Target Product */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="font-semibold text-sm truncate">
                          {relationship.main_product?.name}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {relationship.main_product?.model_reference}
                      </div>
                      {relationship.initial_multiplier > 0 && (
                        <Badge variant="secondary" className="mt-2 text-xs bg-green-100 text-green-800">
                          {relationship.initial_multiplier}x initial
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Smart Multiplier Details */}
                  {(relationship.initial_multiplier > 0 || relationship.recurring_multiplier > 0) && (
                    <div className="mt-2 ml-4 p-3 rounded-md bg-green-50 border border-green-200">
                      <div className="text-xs font-medium text-green-900 mb-1">Smart Revenue Multipliers</div>
                      <div className="flex gap-4 text-xs text-green-700">
                        {relationship.initial_multiplier > 0 && (
                          <div>
                            <span className="font-semibold">{relationship.initial_multiplier}x</span> on initial sale
                          </div>
                        )}
                        {relationship.recurring_multiplier > 0 && (
                          <div>
                            <span className="font-semibold">{relationship.recurring_multiplier}x</span> {relationship.recurring_period || 'monthly'}
                          </div>
                        )}
                        {relationship.lifecycle_duration_months && (
                          <div>
                            over <span className="font-semibold">{relationship.lifecycle_duration_months}</span> months
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No revenue attribution configured</p>
              <p className="text-sm">Create product relationships with attribution percentages to see the flow</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
