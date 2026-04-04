// Platform overview dashboard component
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package2, Layers, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CompanyPlatformService } from "@/services/companyPlatformService";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/useTranslation";

interface PlatformOverviewProps {
  companyId: string;
}

export function PlatformOverview({ companyId }: PlatformOverviewProps) {
  const { lang } = useTranslation();
  const { data: platforms = [], isLoading } = useQuery({
    queryKey: ['company-platforms', companyId],
    queryFn: () => CompanyPlatformService.getDistinctPlatforms(companyId),
    enabled: !!companyId,
  });

  const totalPlatforms = platforms.length;
  const totalProducts = platforms.reduce((sum, platform) => sum + platform.productCount, 0);
  const standalonePlatforms = platforms.filter(p => p.isStandalone).length;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{lang('platform.overview.totalPlatforms')}</CardTitle>
          <Layers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPlatforms}</div>
          <p className="text-xs text-muted-foreground">
            {lang('platform.overview.standalonePlatforms', { count: standalonePlatforms })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{lang('platform.overview.productsUsingPlatforms')}</CardTitle>
          <Package2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProducts}</div>
          <p className="text-xs text-muted-foreground">
            {lang('platform.overview.acrossAllPlatforms')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{lang('platform.overview.averageProducts')}</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalPlatforms > 0 ? Math.round(totalProducts / totalPlatforms * 10) / 10 : 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {lang('platform.overview.perPlatform')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}