import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { useSingleSourceDetection } from "@/hooks/useSingleSourceDetection";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

interface SingleSourceDetectionCardProps {
  productId: string;
  companyId: string;
}

export function SingleSourceDetectionCard({ productId, companyId }: SingleSourceDetectionCardProps) {
  const { data, isLoading, error } = useSingleSourceDetection(productId, companyId);
  const navigate = useNavigate();
  const { companyName } = useParams();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const { lang } = useTranslation();

  const handleNavigateToDefinition = () => {
    const returnParam = returnTo ? `&returnTo=${returnTo}` : '';
    navigate(`/app/product/${productId}/device-information?tab=basics&subtab=definition${returnParam}`);
  };

  if (isLoading) {
    return (
      <Card className="bg-amber-500/10 border-amber-500/20">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600 mr-2" />
          <span className="text-sm text-muted-foreground">{lang('manufacturing.singleSource.analyzing')}</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-destructive/10 border-destructive/20">
        <CardContent className="py-4">
          <p className="text-sm text-destructive">{lang('manufacturing.singleSource.errorAnalyzing')}</p>
        </CardContent>
      </Card>
    );
  }

  const { singleSourceMaterials = [], materialsWithNoSupplier = [], totalMaterials = 0 } = data || {};
  const hasRisks = singleSourceMaterials.length > 0 || materialsWithNoSupplier.length > 0;

  return (
    <Card className={hasRisks ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20"}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasRisks ? (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            )}
            <CardTitle className="text-base">{lang('manufacturing.singleSource.title')}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {lang('manufacturing.singleSource.autoDetected')}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={handleNavigateToDefinition} className="text-xs">
            <ExternalLink className="h-3 w-3 mr-1" />
            {lang('manufacturing.singleSource.manageButton')}
          </Button>
        </div>
        <CardDescription>
          {totalMaterials === 0
            ? lang('manufacturing.singleSource.noMaterialsDefined')
            : (totalMaterials === 1
              ? lang('manufacturing.singleSource.analyzingCount', { count: totalMaterials })
              : lang('manufacturing.singleSource.analyzingCountPlural', { count: totalMaterials }))
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Single-Source Materials */}
        {singleSourceMaterials.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-amber-700">
              ⚠️ {singleSourceMaterials.length === 1
                ? lang('manufacturing.singleSource.singleSourceWarning', { count: singleSourceMaterials.length })
                : lang('manufacturing.singleSource.singleSourceWarningPlural', { count: singleSourceMaterials.length })}
            </p>
            <div className="space-y-2">
              {singleSourceMaterials.map((item) => (
                <div
                  key={item.materialId}
                  className="flex items-center gap-2 p-2 bg-background rounded-md border"
                >
                  <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-sm">
                      <span className="font-medium truncate">{item.componentName}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="truncate">{item.materialName}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.supplierName
                        ? lang('manufacturing.singleSource.supplier', { name: item.supplierName })
                        : lang('manufacturing.singleSource.supplierUnknown')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.leadTimeDays && (
                      <Badge variant="outline" className="text-xs">
                        {lang('manufacturing.singleSource.leadTime', { days: item.leadTimeDays })}
                      </Badge>
                    )}
                    <Badge
                      className={`text-xs ${
                        item.riskLevel === 'high'
                          ? 'bg-red-500/20 text-red-700 hover:bg-red-500/30'
                          : item.riskLevel === 'medium'
                          ? 'bg-amber-500/20 text-amber-700 hover:bg-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/30'
                      }`}
                    >
                      {item.riskLevel}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Materials with No Supplier */}
        {materialsWithNoSupplier.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-red-700">
              🚨 {materialsWithNoSupplier.length === 1
                ? lang('manufacturing.singleSource.noSupplierWarning', { count: materialsWithNoSupplier.length })
                : lang('manufacturing.singleSource.noSupplierWarningPlural', { count: materialsWithNoSupplier.length })}
            </p>
            <div className="space-y-2">
              {materialsWithNoSupplier.map((item) => (
                <div
                  key={item.materialId}
                  className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-900"
                >
                  <Package className="h-4 w-4 text-red-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-sm">
                      <span className="font-medium truncate">{item.componentName}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="truncate">{item.materialName}</span>
                    </div>
                    <div className="text-xs text-red-600">
                      {lang('manufacturing.singleSource.noSupplierAssigned')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Clear State */}
        {!hasRisks && totalMaterials > 0 && (
          <div className="text-center py-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-emerald-700">{lang('manufacturing.singleSource.noRisks')}</p>
            <p className="text-xs text-muted-foreground">
              {lang('manufacturing.singleSource.noRisksHint')}
            </p>
          </div>
        )}

        {/* No Materials State */}
        {totalMaterials === 0 && (
          <div className="text-center py-4">
            <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{lang('manufacturing.singleSource.noMaterials')}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNavigateToDefinition}
              className="mt-2"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              {lang('manufacturing.singleSource.defineComponents')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
