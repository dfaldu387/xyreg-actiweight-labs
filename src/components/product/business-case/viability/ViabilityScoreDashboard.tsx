import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SemiCircleGauge } from '@/components/ui/semi-circle-gauge';
import { RiskRadarChart } from './RiskRadarChart';
import { ViabilityScoreResult } from '@/services/calculateViabilityScore';
import { ViabilityScoreBreakdown } from '@/components/investor-view/ViabilityScoreBreakdown';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Shield,
  Stethoscope,
  DollarSign,
  Cpu,
  ArrowRight,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

interface ViabilityScoreDashboardProps {
  scoreResult: ViabilityScoreResult | null;
  isLoading: boolean;
  variant?: 'full' | 'compact';
  showNavigation?: boolean;
}

const CATEGORY_ICONS = {
  regulatory: Shield,
  clinical: Stethoscope,
  reimbursement: DollarSign,
  technical: Cpu,
};

const CATEGORY_COLORS = {
  regulatory: 'text-indigo-600',
  clinical: 'text-emerald-600',
  reimbursement: 'text-amber-600',
  technical: 'text-purple-600',
};

const CATEGORY_LINKS: Record<string, { path: string; label: string }> = {
  regulatory: { path: '/device-definition?tab=markets', label: 'Device Classification' },
  clinical: { path: '/business-case?tab=clinical-evidence', label: 'Clinical Evidence Plan' },
  reimbursement: { path: '/business-case?tab=reimbursement', label: 'Reimbursement Strategy' },
  technical: { path: '/design-risk-controls?tab=risk-management', label: 'Risk Analysis' },
};

export function ViabilityScoreDashboard({
  scoreResult,
  isLoading,
  variant = 'full',
  showNavigation = true
}: ViabilityScoreDashboardProps) {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();

  // Category name translations
  const getCategoryName = (key: string) => {
    const categoryMap: Record<string, string> = {
      regulatory: lang('viability.regulatory'),
      clinical: lang('viability.clinical'),
      reimbursement: lang('viability.reimbursement'),
      technical: lang('viability.technical'),
    };
    return categoryMap[key] || key;
  };

  // Missing field translations
  const getMissingFieldName = (field: string) => {
    const fieldMap: Record<string, string> = {
      'Device Classification': lang('viability.deviceClassification'),
      'Clinical Evidence Plan': lang('viability.clinicalEvidencePlan'),
      'Reimbursement Strategy': lang('viability.reimbursementStrategy'),
      'Risk Analysis': lang('viability.riskAnalysis'),
      'Device Type or Risk Analysis': lang('viability.deviceTypeOrRiskAnalysis'),
    };
    return fieldMap[field] || field;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!scoreResult) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">{lang('viability.unableToCalculate')}</p>
        </CardContent>
      </Card>
    );
  }
  
  const { totalScore, completionPercentage, categoryScores, missingInputs, recommendations } = scoreResult;
  
  // Debug: Log breakdown data in dashboard
  // console.log('[ViabilityScoreDashboard] Passing to breakdown modal:', {
  //   regulatory: { hasBreakdown: !!categoryScores.regulatory?.breakdown, length: categoryScores.regulatory?.breakdown?.length },
  //   clinical: { hasBreakdown: !!categoryScores.clinical?.breakdown, length: categoryScores.clinical?.breakdown?.length },
  //   reimbursement: { hasBreakdown: !!categoryScores.reimbursement?.breakdown, length: categoryScores.reimbursement?.breakdown?.length },
  //   technical: { hasBreakdown: !!categoryScores.technical?.breakdown, length: categoryScores.technical?.breakdown?.length },
  // });
  
  const handleNavigate = (category: string) => {
    if (!productId || !showNavigation) return;
    const link = CATEGORY_LINKS[category];
    if (link) {
      navigate(`/app/product/${productId}${link.path}`);
    }
  };
  
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-6">
        <div className="flex-shrink-0">
          <SemiCircleGauge score={totalScore} variant="investor" className="scale-75 -my-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-bold">{totalScore}</span>
            <span className="text-muted-foreground">/100</span>
            <Badge variant={completionPercentage === 100 ? 'default' : 'secondary'}>
              {lang('viability.percentComplete').replace('{{percent}}', String(completionPercentage))}
            </Badge>
          </div>
          {missingInputs.length > 0 && (
            <p className="text-sm text-muted-foreground truncate">
              <AlertTriangle className="h-3 w-3 inline mr-1 text-amber-500" />
              {lang('viability.missingColon')} {missingInputs.map(input => getMissingFieldName(input)).join(', ')}
            </p>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gauge Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{lang('viability.viabilityScore')}</CardTitle>
                <CardDescription>
                  {lang('viability.calculatedFromDeviceData')}
                </CardDescription>
              </div>
              <ViabilityScoreBreakdown
                totalScore={totalScore}
                regulatory={categoryScores.regulatory}
                clinical={categoryScores.clinical}
                reimbursement={categoryScores.reimbursement}
                technical={categoryScores.technical}
                missingInputs={missingInputs}
              >
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Button>
              </ViabilityScoreBreakdown>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <SemiCircleGauge score={totalScore} variant="investor" />
            
            {/* Completion Badge */}
            <div className="flex items-center gap-2 mt-2">
              <Progress value={completionPercentage} className="w-32 h-2" />
              <span className="text-sm text-muted-foreground">{lang('viability.percentComplete').replace('{{percent}}', String(completionPercentage))}</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Radar Chart Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{lang('viability.riskProfile')}</CardTitle>
            <CardDescription>
              {lang('viability.compareAgainstBenchmarks')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RiskRadarChart
              regulatoryScore={categoryScores.regulatory.percentage}
              clinicalScore={categoryScores.clinical.percentage}
              reimbursementScore={categoryScores.reimbursement.percentage}
              technicalScore={categoryScores.technical.percentage}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{lang('viability.scoreBreakdown')}</CardTitle>
          <CardDescription>
            {lang('viability.seeWhereScoreComes')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(categoryScores).map(([key, category]) => {
            const Icon = CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS];
            const colorClass = CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS];
            const link = CATEGORY_LINKS[key];
            
            return (
              <div 
                key={key}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-lg border transition-colors",
                  category.isMissing ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200" : "bg-secondary/30",
                  showNavigation && "cursor-pointer hover:bg-secondary/50"
                )}
                onClick={() => handleNavigate(key)}
              >
                <div className={cn("p-2 rounded-lg bg-background", colorClass)}>
                  <Icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{getCategoryName(key)}</span>
                    <span className="text-sm text-muted-foreground">
                      ({lang('viability.ptsMax').replace('{{max}}', String(category.maxScore))})
                    </span>
                    {category.isMissing && (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {lang('viability.missing')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {category.isMissing
                      ? lang('viability.completeField').replace('{{field}}', getMissingFieldName(category.missingField || ''))
                      : lang('viability.source').replace('{{source}}', category.source || '')}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {category.score}/{category.maxScore}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {category.percentage}%
                    </div>
                  </div>
                  
                  {showNavigation && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      
      {/* Missing Inputs & Recommendations */}
      {(missingInputs.length > 0 || recommendations.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {missingInputs.length > 0 ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  {lang('viability.actionRequired')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  {lang('viability.recommendations')}
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {missingInputs.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                  {lang('viability.completeInputsToImprove')}
                </p>
                <ul className="space-y-1">
                  {missingInputs.map((input, i) => (
                    <li key={i} className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {input}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {recommendations.length > 0 && (
              <div className="space-y-2">
                {recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {rec}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
