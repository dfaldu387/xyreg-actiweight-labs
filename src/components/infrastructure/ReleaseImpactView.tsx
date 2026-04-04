import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, AlertTriangle, CheckCircle2, Layers, Shield } from 'lucide-react';
import { XYREG_MODULE_GROUPS } from '@/data/xyregModuleGroups';
import { CORE_SERVICES, resolveAffectedModuleGroups, type CoreDependency } from '@/data/coreModuleDependencies';
import { useTranslation } from '@/hooks/useTranslation';

interface ReleaseImpactViewProps {
  version: string;
  coreServicesAffected: string[];
  moduleGroupsAffected: string[];
  dependencies: CoreDependency[];
}

export function ReleaseImpactView({
  version,
  coreServicesAffected,
  moduleGroupsAffected,
  dependencies,
}: ReleaseImpactViewProps) {
  const { lang } = useTranslation();
  const cascadedGroups = resolveAffectedModuleGroups(coreServicesAffected, dependencies);

  // Combine directly affected + cascaded
  const allAffectedIds = new Set([...moduleGroupsAffected, ...cascadedGroups.keys()]);
  const unaffectedGroups = XYREG_MODULE_GROUPS.filter(g => !allAffectedIds.has(g.id));
  const affectedGroups = XYREG_MODULE_GROUPS.filter(g => allAffectedIds.has(g.id));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{lang('infrastructure.releaseImpact.title', { version })}</h3>
        <p className="text-sm text-muted-foreground">
          {lang('infrastructure.releaseImpact.requireRevalidation', { count: affectedGroups.length })}
          {unaffectedGroups.length > 0 && ` ${lang('infrastructure.releaseImpact.unaffected', { count: unaffectedGroups.length })}`}
        </p>
      </div>

      {/* Core Engine Changes */}
      {coreServicesAffected.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-destructive" />
              {lang('infrastructure.releaseImpact.coreEngineChanges')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              {coreServicesAffected.map(svcId => {
                const svc = CORE_SERVICES.find(s => s.id === svcId);
                const impactedGroups = XYREG_MODULE_GROUPS.filter(
                  g => cascadedGroups.has(g.id) && cascadedGroups.get(g.id)?.coreServices.includes(svcId)
                );
                return (
                  <div key={svcId} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">{svc?.name || svcId}</Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {lang('infrastructure.releaseImpact.cascadesTo', { count: impactedGroups.length })}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 ml-4">
                      {impactedGroups.map(g => (
                        <Badge key={g.id} variant="outline" className="text-[10px] border-destructive/30 text-destructive">
                          {g.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Affected Groups */}
      {affectedGroups.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            {lang('infrastructure.releaseImpact.actionRequired', { count: affectedGroups.length })}
          </h4>
          <div className="space-y-2">
            {affectedGroups.map(g => {
              const cascadeInfo = cascadedGroups.get(g.id);
              const isDirect = moduleGroupsAffected.includes(g.id);
              return (
                <Card key={g.id} className="border-amber-200 bg-amber-50/30">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">{g.name}</span>
                        <div className="flex gap-1 mt-1">
                          {isDirect && <Badge className="text-[10px] bg-amber-100 text-amber-800 border-amber-200">{lang('infrastructure.releaseImpact.directChange')}</Badge>}
                          {cascadeInfo && (
                            <Badge className="text-[10px] bg-red-100 text-red-800 border-red-200">
                              {lang('infrastructure.releaseImpact.coreCascade', { services: cascadeInfo.coreServices.map(id => CORE_SERVICES.find(s => s.id === id)?.name || id).join(', ') })}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-destructive border-destructive/30">
                        {lang('infrastructure.releaseImpact.revalidate')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Unaffected Groups */}
      {unaffectedGroups.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {lang('infrastructure.releaseImpact.noActionRequired', { count: unaffectedGroups.length })}
          </h4>
          <div className="space-y-1">
            {unaffectedGroups.map(g => (
              <div key={g.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30">
                <span className="text-sm text-muted-foreground">{g.name}</span>
                <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200">{lang('infrastructure.releaseImpact.unaffectedBadge')}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
