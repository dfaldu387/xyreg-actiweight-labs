import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/kpi/KPICard";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export function PortfolioOverview() {
  const { lang } = useTranslation();
  // Mock data - replace with real data integration
  const portfolioCompletion = 68.5;
  const totalRiskItems = 17;
  const riskValue = 4.1; // in millions

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{lang('portfolioHealth.overview.title')}</h2>
        <div className="text-sm text-muted-foreground">
          {lang('portfolioHealth.overview.executiveGlance')}
        </div>
      </div>

      {/* Critical KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-l-4 border-l-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              {lang('portfolioHealth.overview.overallCompletion')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {lang('portfolioHealth.overview.completionDescription')}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{portfolioCompletion}%</span>
              <div className="flex items-center gap-1 text-success">
                <span className="text-sm">↗ +2.3%</span>
                <span className="text-xs">{lang('portfolioHealth.overview.thisMonth')}</span>
              </div>
            </div>
            <Progress value={portfolioCompletion} className="h-3" />
            <div className="text-xs text-muted-foreground">
              {lang('portfolioHealth.overview.completionBasis')}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              {lang('portfolioHealth.overview.totalItemsAtRisk')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {lang('portfolioHealth.overview.riskDescription')}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{totalRiskItems}</div>
                <div className="text-sm text-muted-foreground">{lang('portfolioHealth.overview.highPriorityRisks')}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-warning">€{riskValue}M</div>
                <div className="text-xs text-muted-foreground">{lang('portfolioHealth.overview.potentialImpact')}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-warning">
              <span className="text-sm">↗ +3 {lang('portfolioHealth.overview.risks')}</span>
              <span className="text-xs">{lang('portfolioHealth.overview.sinceLastWeek')}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {lang('portfolioHealth.overview.scheduleImpactAnalysis')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supporting Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Projects: Count of all non-archived projects (regardless of health status) */}
        <KPICard
          title={lang('portfolioHealth.kpi.totalProjects')}
          value="23"
          subtitle={lang('portfolioHealth.kpi.currentlyActive')}
          trend={{
            direction: "up",
            percentage: 8.7,
            label: lang('portfolioHealth.kpi.newProjects')
          }}
          status="success"
          icon={<CheckCircle className="h-4 w-4" />}
          tooltipContent={{
            formula: lang('portfolioHealth.kpi.totalProjectsFormula'),
            description: lang('portfolioHealth.kpi.totalProjectsDescription')
          }}
        />

        <KPICard
          title={lang('portfolioHealth.kpi.criticalPathItems')}
          value="47"
          subtitle={lang('portfolioHealth.kpi.requiringAttention')}
          trend={{
            direction: "down",
            percentage: -12.5,
            label: lang('portfolioHealth.kpi.resolvedThisMonth')
          }}
          status="warning"
          icon={<Clock className="h-4 w-4" />}
          tooltipContent={{
            formula: lang('portfolioHealth.kpi.criticalPathFormula'),
            description: lang('portfolioHealth.kpi.criticalPathDescription')
          }}
        />

        <KPICard
          title={lang('portfolioHealth.kpi.complianceInstances')}
          value="1,247"
          subtitle={lang('portfolioHealth.kpi.totalTrackedItems')}
          trend={{
            direction: "up",
            percentage: 15.3,
            label: lang('portfolioHealth.kpi.completionRate')
          }}
          status="success"
          icon={<CheckCircle className="h-4 w-4" />}
          tooltipContent={{
            formula: lang('portfolioHealth.kpi.complianceFormula'),
            description: lang('portfolioHealth.kpi.complianceDescription')
          }}
        />
      </div>
    </div>
  );
}