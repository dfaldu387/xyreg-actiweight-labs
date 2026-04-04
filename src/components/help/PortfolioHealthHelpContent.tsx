import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Target,
  Activity,
  Shield,
  Lightbulb,
  PieChart,
  Users,
  ClipboardCheck,
  Calculator,
  Info,
  Gauge,
  Package
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { HelpContentProps } from './helpContentRegistry';

// Reusable components
const HelpSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-2">
    <h4 className="font-semibold text-sm flex items-center gap-2">{title}</h4>
    {children}
  </div>
);

const TipCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex gap-2">
    <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
    <p className="text-xs text-muted-foreground">{children}</p>
  </div>
);

const MetricCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="p-3 bg-muted/50 rounded-lg border">
    <div className="flex items-start gap-2">
      <div className="text-primary">{icon}</div>
      <div>
        <h5 className="font-medium text-sm mb-1">{title}</h5>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  </div>
);

const FormulaCard: React.FC<{ title: string; formula: string; explanation: string }> = ({ title, formula, explanation }) => (
  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
    <div className="flex items-start gap-2">
      <Calculator className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h5 className="font-medium text-sm mb-1">{title}</h5>
        <code className="text-xs bg-muted px-2 py-1 rounded block mb-2 font-mono">{formula}</code>
        <p className="text-xs text-muted-foreground">{explanation}</p>
      </div>
    </div>
  </div>
);

// Portfolio Overview Help (R&D Portfolio tab)
export const PortfolioOverviewHelp: React.FC<HelpContentProps> = () => {
  const { lang } = useTranslation();
  const k = 'help.contextual.portfolioOverview';
  return (
  <div className="space-y-6">
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{lang(`${k}.description`)}</p>
    </div>
    <HelpSection title={lang(`${k}.keyMetrics.title`)}>
      <div className="space-y-2">
        <MetricCard icon={<DollarSign className="h-4 w-4" />} title={lang(`${k}.keyMetrics.rnpv.title`)} description={lang(`${k}.keyMetrics.rnpv.description`)} />
        <MetricCard icon={<AlertTriangle className="h-4 w-4" />} title={lang(`${k}.keyMetrics.valueAtRisk.title`)} description={lang(`${k}.keyMetrics.valueAtRisk.description`)} />
        <MetricCard icon={<TrendingUp className="h-4 w-4" />} title={lang(`${k}.keyMetrics.riskScore.title`)} description={lang(`${k}.keyMetrics.riskScore.description`)} />
      </div>
    </HelpSection>
    <HelpSection title={lang(`${k}.calculations.title`)}>
      <div className="space-y-2">
        <FormulaCard title={lang(`${k}.calculations.rnpvFormula.title`)} formula={lang(`${k}.calculations.rnpvFormula.formula`)} explanation={lang(`${k}.calculations.rnpvFormula.explanation`)} />
        <FormulaCard title={lang(`${k}.calculations.riskFormula.title`)} formula={lang(`${k}.calculations.riskFormula.formula`)} explanation={lang(`${k}.calculations.riskFormula.explanation`)} />
      </div>
    </HelpSection>
    <HelpSection title={lang(`${k}.navigation.title`)}>
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer">
          <Badge variant="outline" className="text-[10px]">Tab</Badge>
          <span className="text-muted-foreground">{lang(`${k}.navigation.projectHealth`)}</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer">
          <Badge variant="outline" className="text-[10px]">Tab</Badge>
          <span className="text-muted-foreground">{lang(`${k}.navigation.operational`)}</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer">
          <Badge variant="outline" className="text-[10px]">Tab</Badge>
          <span className="text-muted-foreground">{lang(`${k}.navigation.financial`)}</span>
        </div>
      </div>
    </HelpSection>
    <TipCard>{lang(`${k}.tip`)}</TipCard>
  </div>
  );
};

// Project Health Metrics Help
export const ProjectHealthMetricsHelp: React.FC<HelpContentProps> = () => {
  const { lang } = useTranslation();
  const k = 'help.contextual.projectHealth';
  return (
  <div className="space-y-6">
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{lang(`${k}.description`)}</p>
    </div>
    <HelpSection title={lang(`${k}.developmentMetrics.title`)}>
      <div className="space-y-2">
        <MetricCard icon={<Activity className="h-4 w-4" />} title={lang(`${k}.developmentMetrics.testVelocity.title`)} description={lang(`${k}.developmentMetrics.testVelocity.description`)} />
        <MetricCard icon={<ClipboardCheck className="h-4 w-4" />} title={lang(`${k}.developmentMetrics.reqVolatility.title`)} description={lang(`${k}.developmentMetrics.reqVolatility.description`)} />
        <MetricCard icon={<Users className="h-4 w-4" />} title={lang(`${k}.developmentMetrics.approvalTime.title`)} description={lang(`${k}.developmentMetrics.approvalTime.description`)} />
        <MetricCard icon={<AlertTriangle className="h-4 w-4" />} title={lang(`${k}.developmentMetrics.activeRisks.title`)} description={lang(`${k}.developmentMetrics.activeRisks.description`)} />
      </div>
    </HelpSection>
    <HelpSection title={lang(`${k}.calculations.title`)}>
      <div className="space-y-2">
        <FormulaCard title={lang(`${k}.calculations.velocity.title`)} formula={lang(`${k}.calculations.velocity.formula`)} explanation={lang(`${k}.calculations.velocity.explanation`)} />
        <FormulaCard title={lang(`${k}.calculations.volatility.title`)} formula={lang(`${k}.calculations.volatility.formula`)} explanation={lang(`${k}.calculations.volatility.explanation`)} />
        <FormulaCard title={lang(`${k}.calculations.approvalCycle.title`)} formula={lang(`${k}.calculations.approvalCycle.formula`)} explanation={lang(`${k}.calculations.approvalCycle.explanation`)} />
      </div>
    </HelpSection>
    <HelpSection title={lang(`${k}.statusIndicators.title`)}>
      <div className="space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/20 text-primary text-[10px]">On Target</Badge>
          <span>{lang(`${k}.statusIndicators.onTarget`)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-accent text-accent-foreground text-[10px]">Monitoring</Badge>
          <span>{lang(`${k}.statusIndicators.monitoring`)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-[10px]">At Risk</Badge>
          <span>{lang(`${k}.statusIndicators.atRisk`)}</span>
        </div>
      </div>
    </HelpSection>
    <TipCard>{lang(`${k}.tip`)}</TipCard>
  </div>
  );
};

// Operational Health (QMS) Help
export const OperationalHealthHelp: React.FC<HelpContentProps> = () => {
  const { lang } = useTranslation();
  const k = 'help.contextual.operationalHealth';
  return (
  <div className="space-y-6">
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{lang(`${k}.description`)}</p>
    </div>
    <HelpSection title={lang(`${k}.qmsMetrics.title`)}>
      <div className="space-y-2">
        <MetricCard icon={<Gauge className="h-4 w-4" />} title={lang(`${k}.qmsMetrics.healthIndex.title`)} description={lang(`${k}.qmsMetrics.healthIndex.description`)} />
        <MetricCard icon={<Package className="h-4 w-4" />} title={lang(`${k}.qmsMetrics.supplierRisk.title`)} description={lang(`${k}.qmsMetrics.supplierRisk.description`)} />
        <MetricCard icon={<Users className="h-4 w-4" />} title={lang(`${k}.qmsMetrics.reviewerBottleneck.title`)} description={lang(`${k}.qmsMetrics.reviewerBottleneck.description`)} />
        <MetricCard icon={<AlertTriangle className="h-4 w-4" />} title={lang(`${k}.qmsMetrics.criticalComplaints.title`)} description={lang(`${k}.qmsMetrics.criticalComplaints.description`)} />
      </div>
    </HelpSection>
    <HelpSection title={lang(`${k}.calculations.title`)}>
      <div className="space-y-2">
        <FormulaCard title={lang(`${k}.calculations.healthIndexFormula.title`)} formula={lang(`${k}.calculations.healthIndexFormula.formula`)} explanation={lang(`${k}.calculations.healthIndexFormula.explanation`)} />
        <div className="p-3 bg-muted/50 rounded-lg border text-xs space-y-2">
          <p className="font-medium">{lang(`${k}.calculations.components`)}</p>
          <div className="space-y-1 text-muted-foreground pl-2">
            <p>• <strong>CAPA:</strong> {lang(`${k}.calculations.capaScore`)}</p>
            <p>• <strong>NCR:</strong> {lang(`${k}.calculations.ncrScore`)}</p>
            <p>• <strong>Audit:</strong> {lang(`${k}.calculations.auditScore`)}</p>
          </div>
        </div>
        <FormulaCard title={lang(`${k}.calculations.supplierFormula.title`)} formula={lang(`${k}.calculations.supplierFormula.formula`)} explanation={lang(`${k}.calculations.supplierFormula.explanation`)} />
        <FormulaCard title={lang(`${k}.calculations.bottleneckFormula.title`)} formula={lang(`${k}.calculations.bottleneckFormula.formula`)} explanation={lang(`${k}.calculations.bottleneckFormula.explanation`)} />
      </div>
    </HelpSection>
    <HelpSection title={lang(`${k}.trendInterpretation.title`)}>
      <div className="space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/20 text-primary text-[10px]">≥75%</Badge>
          <span>{lang(`${k}.trendInterpretation.healthy`)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-accent text-accent-foreground text-[10px]">50-74%</Badge>
          <span>{lang(`${k}.trendInterpretation.atRisk`)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-[10px]">&lt;50%</Badge>
          <span>{lang(`${k}.trendInterpretation.critical`)}</span>
        </div>
      </div>
    </HelpSection>
    <HelpSection title={lang(`${k}.regulatoryContext.title`)}>
      <div className="p-3 bg-muted/50 rounded-lg border text-xs text-muted-foreground space-y-2">
        <p><strong>ISO 13485:2016</strong> {lang(`${k}.regulatoryContext.iso13485`)}</p>
        <p><strong>QMSR (21 CFR 820)</strong> {lang(`${k}.regulatoryContext.qmsr`)}</p>
        <p><strong>EU MDR</strong> {lang(`${k}.regulatoryContext.euMdr`)}</p>
      </div>
    </HelpSection>
    <TipCard>{lang(`${k}.tip`)}</TipCard>
  </div>
  );
};

// Advanced Financial Help (Operational Efficiency)
export const AdvancedFinancialHelp: React.FC<HelpContentProps> = () => {
  const { lang } = useTranslation();
  const k = 'help.contextual.advancedFinancial';
  return (
  <div className="space-y-6">
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{lang(`${k}.description`)}</p>
    </div>
    <HelpSection title={lang(`${k}.efficiencyMetrics.title`)}>
      <div className="space-y-2">
        <MetricCard icon={<TrendingUp className="h-4 w-4" />} title={lang(`${k}.efficiencyMetrics.throughput.title`)} description={lang(`${k}.efficiencyMetrics.throughput.description`)} />
        <MetricCard icon={<PieChart className="h-4 w-4" />} title={lang(`${k}.efficiencyMetrics.utilization.title`)} description={lang(`${k}.efficiencyMetrics.utilization.description`)} />
        <MetricCard icon={<DollarSign className="h-4 w-4" />} title={lang(`${k}.efficiencyMetrics.costPerMilestone.title`)} description={lang(`${k}.efficiencyMetrics.costPerMilestone.description`)} />
        <MetricCard icon={<Target className="h-4 w-4" />} title={lang(`${k}.efficiencyMetrics.onTimeDelivery.title`)} description={lang(`${k}.efficiencyMetrics.onTimeDelivery.description`)} />
      </div>
    </HelpSection>
    <HelpSection title={lang(`${k}.calculations.title`)}>
      <div className="space-y-2">
        <FormulaCard title={lang(`${k}.calculations.throughputFormula.title`)} formula={lang(`${k}.calculations.throughputFormula.formula`)} explanation={lang(`${k}.calculations.throughputFormula.explanation`)} />
        <FormulaCard title={lang(`${k}.calculations.utilizationFormula.title`)} formula={lang(`${k}.calculations.utilizationFormula.formula`)} explanation={lang(`${k}.calculations.utilizationFormula.explanation`)} />
        <FormulaCard title={lang(`${k}.calculations.efficiencyFormula.title`)} formula={lang(`${k}.calculations.efficiencyFormula.formula`)} explanation={lang(`${k}.calculations.efficiencyFormula.explanation`)} />
      </div>
    </HelpSection>
    <HelpSection title={lang(`${k}.scenarioPlanning.title`)}>
      <div className="space-y-2 text-xs text-muted-foreground">
        <p>{lang(`${k}.scenarioPlanning.description`)}</p>
        <div className="pl-3 space-y-1">
          <p>• {lang(`${k}.scenarioPlanning.baseCase`)}</p>
          <p>• {lang(`${k}.scenarioPlanning.optimistic`)}</p>
          <p>• {lang(`${k}.scenarioPlanning.conservative`)}</p>
        </div>
      </div>
    </HelpSection>
    <TipCard>{lang(`${k}.tip`)}</TipCard>
  </div>
  );
};
