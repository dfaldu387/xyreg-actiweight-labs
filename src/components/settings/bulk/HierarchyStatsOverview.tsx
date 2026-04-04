import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HierarchyStats } from "@/services/hierarchicalBulkService";
import { Package, CheckCircle, Settings, TrendingUp } from 'lucide-react';

interface HierarchyStatsOverviewProps {
  stats: HierarchyStats;
}

export function HierarchyStatsOverview({ stats }: HierarchyStatsOverviewProps) {
  const configurationPercentage = stats.totalProducts > 0 
    ? (stats.configuredProducts / stats.totalProducts) * 100 
    : 0;
    
  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
              <p className="text-sm text-muted-foreground">Total Device</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className={`h-8 w-8 ${getStatusColor(configurationPercentage)}`} />
            <div>
              <p className="text-2xl font-bold">{stats.configuredProducts}</p>
              <p className="text-sm text-muted-foreground">Configured</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Configuration Coverage</span>
              <span className={`text-sm font-bold ${getStatusColor(configurationPercentage)}`}>
                {Math.round(configurationPercentage)}%
              </span>
            </div>
            <Progress value={configurationPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Hierarchy Items</p>
              <div className="flex gap-1">
                <Badge variant="outline" className="text-xs">
                  {stats.categoriesConfigured} Cat
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {stats.platformsConfigured} Plat
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {stats.modelsConfigured} Mod
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}