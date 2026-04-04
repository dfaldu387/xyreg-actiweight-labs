import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { generateImpactAnalysis, ImpactAnalysisReport } from '@/services/changeControlImpactService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertTriangle, ArrowDown, Lock, Network } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface CCRImpactAnalysisProps {
  targetObjectId: string;
  targetObjectType: string;
  productId: string;
}

const TYPE_LABELS: Record<string, string> = {
  user_need: 'User Need',
  system_requirement: 'System Req',
  software_requirement: 'Software Req',
  hardware_requirement: 'Hardware Req',
  hazard: 'Hazard',
  test_case: 'Test Case',
  verification_test: 'Verification',
};

export function CCRImpactAnalysis({ targetObjectId, targetObjectType, productId }: CCRImpactAnalysisProps) {
  const { lang } = useTranslation();
  const { data: report, isLoading, error } = useQuery<ImpactAnalysisReport>({
    queryKey: ['ccr-impact', targetObjectId, productId],
    queryFn: () => generateImpactAnalysis(targetObjectId, targetObjectType, productId),
    enabled: !!targetObjectId && !!productId,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <p className="text-sm text-destructive">{lang('changeControl.failedToLoadImpact')}</p>;
  if (!report) return null;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <ArrowDown className="h-6 w-6 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{report.downstream.length}</p>
            <p className="text-sm text-muted-foreground">{lang('changeControl.downstream')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-6 w-6 mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-bold">{report.riskImpacts.length}</p>
            <p className="text-sm text-muted-foreground">{lang('changeControl.riskImpacts')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Lock className="h-6 w-6 mx-auto text-red-500 mb-2" />
            <p className="text-2xl font-bold">{report.baselineImpacts.length}</p>
            <p className="text-sm text-muted-foreground">{lang('changeControl.alsoBaselined')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Downstream */}
      {report.downstream.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowDown className="h-4 w-4" />
              {lang('changeControl.downstreamImpact')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {lang('changeControl.downstreamImpactDescription', { count: report.downstream.length })}
            </p>
            <div className="flex flex-wrap gap-2">
              {report.downstream.map((item) => (
                <Badge key={item.objectId} variant={item.isBaselined ? 'destructive' : 'secondary'}>
                  {item.isBaselined && <Lock className="h-3 w-3 mr-1" />}
                  {TYPE_LABELS[item.objectType] || item.objectType}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk */}
      {report.riskImpacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {lang('changeControl.riskImpactTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {lang('changeControl.riskImpactDescription', { count: report.riskImpacts.length })}
            </p>
            <div className="flex flex-wrap gap-2">
              {report.riskImpacts.map((item) => (
                <Badge key={item.objectId} variant="outline" className="border-amber-300 text-amber-700">
                  {item.isBaselined && <Lock className="h-3 w-3 mr-1" />}
                  {lang('changeControl.hazard')}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No impacts */}
      {report.totalAffected === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Network className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">{lang('changeControl.noLinkedObjects')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
