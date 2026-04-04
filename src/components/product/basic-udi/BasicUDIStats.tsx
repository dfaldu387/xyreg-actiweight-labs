import React from "react";
import { Package2, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { BasicUDICluster } from "@/hooks/useCompanyBasicUDIGroups";

interface BasicUDIStatsProps {
  cluster: BasicUDICluster;
}

export function BasicUDIStats({ cluster }: BasicUDIStatsProps) {
  const groupedPercentage = cluster.totalCount > 0 
    ? Math.round((cluster.groupedCount / cluster.totalCount) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Package2 className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{cluster.totalCount}</div>
              <div className="text-sm text-muted-foreground">Product Variants</div>
              <div className="text-xs text-muted-foreground opacity-70">Sizes/configs</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold">{cluster.siblingGroups.length}</div>
              <div className="text-sm text-muted-foreground">Sibling Groups</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold">{cluster.groupedCount}</div>
              <div className="text-sm text-muted-foreground">Grouped ({groupedPercentage}%)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className={`h-8 w-8 ${cluster.ungroupedCount > 0 ? 'text-amber-600' : 'text-muted-foreground'}`} />
            <div>
              <div className="text-2xl font-bold">{cluster.ungroupedCount}</div>
              <div className="text-sm text-muted-foreground">Ungrouped</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
