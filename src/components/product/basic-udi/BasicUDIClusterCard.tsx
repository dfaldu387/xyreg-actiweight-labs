import React from "react";
import { Package2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import type { BasicUDICluster } from "@/hooks/useCompanyBasicUDIGroups";

interface BasicUDIClusterCardProps {
  cluster: BasicUDICluster;
  onClick: () => void;
}

export function BasicUDIClusterCard({ cluster, onClick }: BasicUDIClusterCardProps) {
  const { lang } = useTranslation();
  const allGrouped = cluster.ungroupedCount === 0 && cluster.totalCount > 0;
  const hasUngrouped = cluster.ungroupedCount > 0;

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Package2 className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
          {allGrouped && (
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          )}
          {hasUngrouped && (
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          )}
        </div>
        <CardTitle className="text-base font-semibold break-words">
          {cluster.groupName || cluster.basicUDI}
        </CardTitle>
        <p className="text-xs font-mono text-muted-foreground break-all mt-1">
          {cluster.basicUDI}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground">{lang('basicUdiOverview.card.products')}</div>
            <div className="font-semibold text-lg">{cluster.totalCount}</div>
          </div>
          <div>
            <div className="text-muted-foreground">{lang('basicUdiOverview.card.groups')}</div>
            <div className="font-semibold text-lg">{cluster.siblingGroups.length}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {allGrouped ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {lang('basicUdiOverview.card.allGrouped')}
            </Badge>
          ) : (
            <>
              {cluster.groupedCount > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                  {cluster.groupedCount} {lang('basicUdiOverview.card.grouped')}
                </Badge>
              )}
              {cluster.ungroupedCount > 0 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {cluster.ungroupedCount} {lang('basicUdiOverview.card.ungrouped')}
                </Badge>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
