import React from 'react';
import { ReimbursementInfoHub } from '@/components/product/reimbursement/ReimbursementInfoHub';
import { DynamicMilestonesHelp } from '@/components/help/DynamicMilestonesHelp';
import { XyregGenesisIntroduction } from '@/components/investor-share/XyregGenesisIntroduction';
import { useTranslation } from '@/hooks/useTranslation';
import { XyregArchitectureHelp } from '@/components/help/XyregArchitectureHelp';
import {
  NCTrendsHelp,
  CAPATrendsHelp,
  GlobalChangeControlHelp,
  ManagementReviewHelp,
  EnterpriseDesignReviewHelp,
  InfrastructureHelp,
  CalibrationScheduleHelp,
  CompetencyMatrixHelp,
  QMSGapAnalysisHelp,
  ComplianceActivitiesHelp,
  GlobalQualityManualHelp,
  IPManagementHelp,
  AuditLogHelp,
  CommercialIntelligenceHelp,
  StrategicBlueprintHelp,
  EnterpriseMarketAnalysisHelp,
  CommercialPerformanceHelp,
  EnterprisePricingStrategyHelp,
  GlobalMarketAccessHelp,
} from '@/components/help/EnterpriseHelpContent';
import {
  DeviceOverviewHelp,
  DevicePurposeHelp,
  DeviceGeneralHelp,
  DeviceGeneralDeviceIdHelp,
  DeviceGeneralClassificationHelp,
  DeviceGeneralTechSpecsHelp,
  DeviceGeneralDefinitionHelp,
  DeviceGeneralMediaHelp,
  DeviceGeneralStorageHelp,
  DeviceGeneralVariantsHelp,
  DeviceMarketsHelp,
  DeviceBundlesHelp,
  DeviceAuditLogHelp,
} from '@/components/help/DeviceInformationHelpContent';
import { 
  QMSFoundationHelp, 
  DeviceProcessEngineHelp, 
  QMSArchitectureHelp 
} from '@/components/help/QMSArchitectureHelpContent';
import {
  PortfolioOverviewHelp,
  ProjectHealthMetricsHelp,
  OperationalHealthHelp,
  AdvancedFinancialHelp,
} from '@/components/help/PortfolioHealthHelpContent';
import { Badge } from '@/components/ui/badge';
import { GapAnalysisContextualHelp } from './GapAnalysisHelpContent';
import {
  EHDSDataVaultHelp,
  EHDSDatasetsHelp,
  EHDSTranslationHelp,
  EHDSSecondaryUseHelp,
  EHDSAnonymizationHelp,
  EHDSSelfDeclarationHelp,
} from './EHDSDataVaultHelpContent';
import {
  BOMHelp,
  GanttChartHelp,
  EssentialGatesHelp,
  InvestorShareHelp,
  NPVAnalysisHelp,
  ComplianceInstancesHelp,
  ProductDefinitionPageHelp,
  ProductAuditLogHelp,
} from './ProductPagesHelpContent';
import {
  CompanyPermissionsHelp,
  CompanyProductsHelp,
  CompanyPortfolioLandingHelp,
  CompanyBudgetHelp,
  CompanyUserProductMatrixHelp,
  CompanyBasicUDIHelp,
  CompanyRoleAccessHelp,
  CompanyReviewerAnalyticsHelp,
  CompanyPlatformsHelp,
  CompanyMarketplaceHelp,
} from './CompanyPagesHelpContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle2, 
  AlertCircle, 
  Lightbulb, 
  FileText, 
  Target, 
  TrendingUp,
  Users,
  Building2,
  Globe,
  Shield,
  Package,
  Barcode,
  Calendar,
  ClipboardCheck,
  BookOpen,
  ArrowRight,
  Info
} from 'lucide-react';

// Reusable components for help content
const HelpSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-2">
    <h4 className="font-semibold text-sm flex items-center gap-2">
      {title}
    </h4>
    {children}
  </div>
);

const TipCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex gap-2">
    <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
    <p className="text-xs text-muted-foreground">{children}</p>
  </div>
);

const WarningCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-2">
    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
    <p className="text-xs text-muted-foreground">{children}</p>
  </div>
);

const InfoCard: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="p-3 bg-muted/50 rounded-lg border">
    <h5 className="font-medium text-sm mb-1">{title}</h5>
    <p className="text-xs text-muted-foreground">{description}</p>
  </div>
);

// Navigable InfoCard - clicking navigates to a detail screen
interface NavigableInfoCardProps {
  title: string;
  description: string;
  detailId: string;
  onNavigate?: (detailId: string) => void;
}

const NavigableInfoCard: React.FC<NavigableInfoCardProps> = ({ title, description, detailId, onNavigate }) => (
  <div 
    className="p-3 bg-muted/50 rounded-lg border hover:bg-muted/70 hover:border-primary/20 cursor-pointer transition-all group"
    onClick={() => onNavigate?.(detailId)}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1">
        <h5 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">{title}</h5>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
    </div>
  </div>
);

// Expandable InfoCard for interactive help content
interface ExpandableInfoCardProps {
  title: string;
  description: string;
  expandedContent?: React.ReactNode;
}

const ExpandableInfoCard: React.FC<ExpandableInfoCardProps> = ({ title, description, expandedContent }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  if (!expandedContent) {
    return <InfoCard title={title} description={description} />;
  }
  
  return (
    <div 
      className={`rounded-lg border transition-all duration-200 ${
        isExpanded 
          ? 'bg-primary/5 border-primary/30 shadow-sm' 
          : 'bg-muted/50 hover:bg-muted/70 hover:border-primary/20 cursor-pointer'
      }`}
      onClick={() => !isExpanded && setIsExpanded(true)}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h5 className={`font-medium text-sm mb-1 ${isExpanded ? 'text-primary' : ''}`}>{title}</h5>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex-shrink-0 p-1 rounded hover:bg-primary/10 transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <ArrowRight 
              className={`h-4 w-4 text-primary transition-transform duration-200 ${
                isExpanded ? 'rotate-90' : ''
              }`} 
            />
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-primary/20 mt-2 pt-3">
          <div className="text-sm text-muted-foreground space-y-3">
            {expandedContent}
          </div>
        </div>
      )}
    </div>
  );
};

const GenesisBadge: React.FC = () => (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
    ✦ Needed for Genesis
  </span>
);

const StepList: React.FC<{ steps: string[] }> = ({ steps }) => (
  <ol className="space-y-2 text-sm text-muted-foreground">
    {steps.map((step, idx) => (
      <li key={idx} className="flex gap-2">
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
          {idx + 1}
        </span>
        <span>{step}</span>
      </li>
    ))}
  </ol>
);

// ============ MISSION CONTROL ============
const MissionControlHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">
      {lang('help.contextual.missionControl.description')}
    </p>

    <HelpSection title={lang('help.contextual.missionControl.actionItems.title')}>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {lang('help.contextual.missionControl.actionItems.subtitle')}
        </p>
        <InfoCard
          title={lang('help.contextual.missionControl.actionItems.approvals.title')}
          description={lang('help.contextual.missionControl.actionItems.approvals.description')}
        />
        <InfoCard
          title={lang('help.contextual.missionControl.actionItems.deadlines.title')}
          description={lang('help.contextual.missionControl.actionItems.deadlines.description')}
        />
      </div>
      <TipCard>{lang('help.contextual.missionControl.actionItems.tip')}</TipCard>
    </HelpSection>

    <HelpSection title={lang('help.contextual.missionControl.activityStream.title')}>
      <p className="text-sm text-muted-foreground">
        {lang('help.contextual.missionControl.activityStream.description')}
      </p>
      <TipCard>{lang('help.contextual.missionControl.activityStream.tip')}</TipCard>
    </HelpSection>

    <HelpSection title={lang('help.contextual.missionControl.competencyRadar.title')}>
      <p className="text-sm text-muted-foreground">
        {lang('help.contextual.missionControl.competencyRadar.description')}
      </p>
      <TipCard>{lang('help.contextual.missionControl.competencyRadar.tip')}</TipCard>
    </HelpSection>

    <HelpSection title={lang('help.contextual.missionControl.communicationHub.title')}>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {lang('help.contextual.missionControl.communicationHub.subtitle')}
        </p>
        <InfoCard
          title={lang('help.contextual.missionControl.communicationHub.unread.title')}
          description={lang('help.contextual.missionControl.communicationHub.unread.description')}
        />
        <InfoCard
          title={lang('help.contextual.missionControl.communicationHub.composer.title')}
          description={lang('help.contextual.missionControl.communicationHub.composer.description')}
        />
      </div>
      <TipCard>{lang('help.contextual.missionControl.communicationHub.tip')}</TipCard>
    </HelpSection>
  </div>
  );
};

// ============ GENESIS OVERVIEW ============
const GenesisOverviewHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {lang('help.contextual.genesisOverview.description')}
      </p>
      <XyregGenesisIntroduction />
    </div>
  );
};

// ============ VIABILITY SCORECARD ============
const ViabilityScoreCardHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.viabilityScorecard.description')}
      </p>

      <HelpSection title={lang('help.content.viabilityScorecard.threePillars')}>
        <div className="space-y-3">
          <InfoCard
            title={lang('help.content.viabilityScorecard.technical.title')}
            description={lang('help.content.viabilityScorecard.technical.description')}
          />
          <InfoCard
            title={lang('help.content.viabilityScorecard.regulatory.title')}
            description={lang('help.content.viabilityScorecard.regulatory.description')}
          />
          <InfoCard
            title={lang('help.content.viabilityScorecard.commercial.title')}
            description={lang('help.content.viabilityScorecard.commercial.description')}
          />
        </div>
      </HelpSection>

      <HelpSection title={lang('help.content.viabilityScorecard.howToScore')}>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><strong>90-100%:</strong> {lang('help.content.viabilityScorecard.score90')}</p>
          <p><strong>70-89%:</strong> {lang('help.content.viabilityScorecard.score70')}</p>
          <p><strong>50-69%:</strong> {lang('help.content.viabilityScorecard.score50')}</p>
          <p><strong>{lang('help.content.viabilityScorecard.below50')}:</strong> {lang('help.content.viabilityScorecard.score0')}</p>
        </div>
      </HelpSection>

      <TipCard>
        {lang('help.content.viabilityScorecard.tip')}
      </TipCard>
    </div>
  );
};

// ============ VENTURE BLUEPRINT ============
const VentureBlueprintHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.ventureBlueprint.description')}
      </p>

      <HelpSection title={lang('help.content.ventureBlueprint.phase1')}>
        <StepList steps={[
          lang('help.content.ventureBlueprint.phase1Steps.step1'),
          lang('help.content.ventureBlueprint.phase1Steps.step2'),
          lang('help.content.ventureBlueprint.phase1Steps.step3'),
          lang('help.content.ventureBlueprint.phase1Steps.step4')
        ]} />
      </HelpSection>

      <HelpSection title={lang('help.content.ventureBlueprint.phase2')}>
        <StepList steps={[
          lang('help.content.ventureBlueprint.phase2Steps.step1'),
          lang('help.content.ventureBlueprint.phase2Steps.step2'),
          lang('help.content.ventureBlueprint.phase2Steps.step3'),
          lang('help.content.ventureBlueprint.phase2Steps.step4')
        ]} />
      </HelpSection>

      <TipCard>
        {lang('help.content.ventureBlueprint.tip')}
      </TipCard>
    </div>
  );
};

// ============ BUSINESS CANVAS ============
const BusinessCanvasHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.businessCanvas.description')}
      </p>

      <HelpSection title={lang('help.content.businessCanvas.buildingBlocks')}>
        <div className="grid grid-cols-1 gap-2">
          <InfoCard
            title={lang('help.content.businessCanvas.valuePropositions.title')}
            description={lang('help.content.businessCanvas.valuePropositions.description')}
          />
          <InfoCard
            title={lang('help.content.businessCanvas.customerSegments.title')}
            description={lang('help.content.businessCanvas.customerSegments.description')}
          />
          <InfoCard
            title={lang('help.content.businessCanvas.channels.title')}
            description={lang('help.content.businessCanvas.channels.description')}
          />
          <InfoCard
            title={lang('help.content.businessCanvas.customerRelationships.title')}
            description={lang('help.content.businessCanvas.customerRelationships.description')}
          />
          <InfoCard
            title={lang('help.content.businessCanvas.revenueStreams.title')}
            description={lang('help.content.businessCanvas.revenueStreams.description')}
          />
          <InfoCard
            title={lang('help.content.businessCanvas.keyResources.title')}
            description={lang('help.content.businessCanvas.keyResources.description')}
          />
          <InfoCard
            title={lang('help.content.businessCanvas.keyActivities.title')}
            description={lang('help.content.businessCanvas.keyActivities.description')}
          />
          <InfoCard
            title={lang('help.content.businessCanvas.keyPartners.title')}
            description={lang('help.content.businessCanvas.keyPartners.description')}
          />
          <InfoCard
            title={lang('help.content.businessCanvas.costStructure.title')}
            description={lang('help.content.businessCanvas.costStructure.description')}
          />
        </div>
      </HelpSection>

      <TipCard>
        {lang('help.content.businessCanvas.tip')}
      </TipCard>
    </div>
  );
};

// ============ TEAM PROFILE ============
const TeamProfileHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.teamProfile.description')}
      </p>

      <HelpSection title={lang('help.content.teamProfile.keyRoles')}>
        <div className="space-y-2">
          <InfoCard
            title={lang('help.content.teamProfile.technical.title')}
            description={lang('help.content.teamProfile.technical.description')}
          />
          <InfoCard
            title={lang('help.content.teamProfile.regulatory.title')}
            description={lang('help.content.teamProfile.regulatory.description')}
          />
          <InfoCard
            title={lang('help.content.teamProfile.clinical.title')}
            description={lang('help.content.teamProfile.clinical.description')}
          />
          <InfoCard
            title={lang('help.content.teamProfile.commercial.title')}
            description={lang('help.content.teamProfile.commercial.description')}
          />
        </div>
      </HelpSection>

      <HelpSection title={lang('help.content.teamProfile.gapAnalysis')}>
        <p className="text-sm text-muted-foreground">
          {lang('help.content.teamProfile.gapAnalysisDescription')}
        </p>
      </HelpSection>

      <TipCard>
        {lang('help.content.teamProfile.tip')}
      </TipCard>
    </div>
  );
};

// ============ MARKET SIZING ============
const MarketSizingHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.marketSizing.description')}
      </p>

      <HelpSection title={lang('help.content.marketSizing.framework')}>
        <div className="space-y-3">
          <InfoCard
            title={lang('help.content.marketSizing.tam.title')}
            description={lang('help.content.marketSizing.tam.description')}
          />
          <InfoCard
            title={lang('help.content.marketSizing.sam.title')}
            description={lang('help.content.marketSizing.sam.description')}
          />
          <InfoCard
            title={lang('help.content.marketSizing.som.title')}
            description={lang('help.content.marketSizing.som.description')}
          />
        </div>
      </HelpSection>

      <HelpSection title={lang('help.content.marketSizing.bestPractices')}>
        <StepList steps={[
          lang('help.content.marketSizing.practices.step1'),
          lang('help.content.marketSizing.practices.step2'),
          lang('help.content.marketSizing.practices.step3'),
          lang('help.content.marketSizing.practices.step4')
        ]} />
      </HelpSection>

      <TipCard>
        {lang('help.content.marketSizing.tip')}
      </TipCard>
    </div>
  );
};

// ============ COMPETITION ============
const CompetitionHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.competition.description')}
      </p>

      <HelpSection title={lang('help.content.competition.dataSources')}>
        <div className="space-y-2">
          <InfoCard
            title={lang('help.content.competition.manual.title')}
            description={lang('help.content.competition.manual.description')}
          />
          <InfoCard
            title={lang('help.content.competition.eudamed.title')}
            description={lang('help.content.competition.eudamed.description')}
          />
          <InfoCard
            title={lang('help.content.competition.fda.title')}
            description={lang('help.content.competition.fda.description')}
          />
          <InfoCard
            title={lang('help.content.competition.global.title')}
            description={lang('help.content.competition.global.description')}
          />
        </div>
      </HelpSection>

      <HelpSection title={lang('help.content.competition.howToUse')}>
        <StepList steps={[
          lang('help.content.competition.steps.step1'),
          lang('help.content.competition.steps.step2'),
          lang('help.content.competition.steps.step3'),
          lang('help.content.competition.steps.step4'),
          lang('help.content.competition.steps.step5')
        ]} />
      </HelpSection>

      <HelpSection title={lang('help.content.competition.bestPractices')}>
        <div className="space-y-2">
          <InfoCard
            title={lang('help.content.competition.direct.title')}
            description={lang('help.content.competition.direct.description')}
          />
          <InfoCard
            title={lang('help.content.competition.indirect.title')}
            description={lang('help.content.competition.indirect.description')}
          />
          <InfoCard
            title={lang('help.content.competition.emerging.title')}
            description={lang('help.content.competition.emerging.description')}
          />
        </div>
      </HelpSection>

      <TipCard>
        {lang('help.content.competition.tip')}
      </TipCard>
    </div>
  );
};

// ============ REIMBURSEMENT ============
const ReimbursementHelp: React.FC<{ targetMarkets?: string[] }> = ({ targetMarkets = [] }) => (
  <ReimbursementInfoHub targetMarkets={targetMarkets} disabled={false} />
);

// ============ CLINICAL TRIALS ============
const ClinicalTrialsHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.clinicalTrials.description')}
      </p>

      <HelpSection title={lang('help.content.clinicalTrials.typesOfEvidence')}>
        <div className="space-y-2">
          <InfoCard
            title={lang('help.content.clinicalTrials.pivotal.title')}
            description={lang('help.content.clinicalTrials.pivotal.description')}
          />
          <InfoCard
            title={lang('help.content.clinicalTrials.firstInHuman.title')}
            description={lang('help.content.clinicalTrials.firstInHuman.description')}
          />
          <InfoCard
            title={lang('help.content.clinicalTrials.pmcf.title')}
            description={lang('help.content.clinicalTrials.pmcf.description')}
          />
          <InfoCard
            title={lang('help.content.clinicalTrials.rwe.title')}
            description={lang('help.content.clinicalTrials.rwe.description')}
          />
        </div>
      </HelpSection>

      <HelpSection title={lang('help.content.clinicalTrials.planning')}>
        <StepList steps={[
          lang('help.content.clinicalTrials.planningSteps.step1'),
          lang('help.content.clinicalTrials.planningSteps.step2'),
          lang('help.content.clinicalTrials.planningSteps.step3'),
          lang('help.content.clinicalTrials.planningSteps.step4'),
          lang('help.content.clinicalTrials.planningSteps.step5')
        ]} />
      </HelpSection>

      <TipCard>
        {lang('help.content.clinicalTrials.tip')}
      </TipCard>
    </div>
  );
};

// ============ READINESS GATES ============
const ReadinessGatesHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.readinessGates.description')}
      </p>

      <HelpSection title={lang('help.content.readinessGates.developmentGates')}>
        <div className="space-y-2">
          <InfoCard
            title={lang('help.content.readinessGates.gate1.title')}
            description={lang('help.content.readinessGates.gate1.description')}
          />
          <InfoCard
            title={lang('help.content.readinessGates.gate2.title')}
            description={lang('help.content.readinessGates.gate2.description')}
          />
          <InfoCard
            title={lang('help.content.readinessGates.gate3.title')}
            description={lang('help.content.readinessGates.gate3.description')}
          />
          <InfoCard
            title={lang('help.content.readinessGates.gate4.title')}
            description={lang('help.content.readinessGates.gate4.description')}
          />
          <InfoCard
            title={lang('help.content.readinessGates.gate5.title')}
            description={lang('help.content.readinessGates.gate5.description')}
          />
          <InfoCard
            title={lang('help.content.readinessGates.gate6.title')}
            description={lang('help.content.readinessGates.gate6.description')}
          />
        </div>
      </HelpSection>

      <TipCard>
        {lang('help.content.readinessGates.tip')}
      </TipCard>
    </div>
  );
};

// ============ UDI MANAGEMENT ============
const UDIManagementHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.udiManagement.description')}
      </p>

      <HelpSection title={lang('help.content.udiManagement.structure')}>
        <div className="space-y-3">
          <InfoCard
            title={lang('help.content.udiManagement.basicUdiDi.title')}
            description={lang('help.content.udiManagement.basicUdiDi.description')}
          />
          <InfoCard
            title={lang('help.content.udiManagement.udiDi.title')}
            description={lang('help.content.udiManagement.udiDi.description')}
          />
          <InfoCard
            title={lang('help.content.udiManagement.udiPi.title')}
            description={lang('help.content.udiManagement.udiPi.description')}
          />
        </div>
      </HelpSection>

      <HelpSection title={lang('help.content.udiManagement.gtinStructure')}>
        <div className="p-3 bg-muted/50 rounded-lg border font-mono text-xs">
          <p>[1] {lang('help.content.udiManagement.gtin.packagingLevel')}</p>
          <p>[6-12] {lang('help.content.udiManagement.gtin.companyPrefix')}</p>
          <p>[0-6] {lang('help.content.udiManagement.gtin.itemReference')}</p>
          <p>[1] {lang('help.content.udiManagement.gtin.checkDigit')}</p>
          <p className="mt-2 text-muted-foreground">= {lang('help.content.udiManagement.gtin.totalDigits')}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {lang('help.content.udiManagement.gtinNote')}
        </p>
      </HelpSection>

      <HelpSection title={lang('help.content.udiManagement.regulatoryRequirements')}>
        <StepList steps={[
          lang('help.content.udiManagement.requirements.step1'),
          lang('help.content.udiManagement.requirements.step2'),
          lang('help.content.udiManagement.requirements.step3'),
          lang('help.content.udiManagement.requirements.step4')
        ]} />
      </HelpSection>

      <TipCard>
        {lang('help.content.udiManagement.tip')}
      </TipCard>
    </div>
  );
};

// ============ MILESTONES ============
const MilestonesHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.milestones.description')}
      </p>

      <HelpSection title={lang('help.content.milestones.lifecycle')}>
        <div className="space-y-2">
          <InfoCard
            title={lang('help.content.milestones.phase1.title')}
            description={lang('help.content.milestones.phase1.description')}
          />
          <InfoCard
            title={lang('help.content.milestones.phase2.title')}
            description={lang('help.content.milestones.phase2.description')}
          />
          <InfoCard
            title={lang('help.content.milestones.phase3.title')}
            description={lang('help.content.milestones.phase3.description')}
          />
          <InfoCard
            title={lang('help.content.milestones.phase4.title')}
            description={lang('help.content.milestones.phase4.description')}
          />
          <InfoCard
            title={lang('help.content.milestones.phase5.title')}
            description={lang('help.content.milestones.phase5.description')}
          />
        </div>
      </HelpSection>

      <HelpSection title={lang('help.content.milestones.bestPractices')}>
        <StepList steps={[
          lang('help.content.milestones.practices.step1'),
          lang('help.content.milestones.practices.step2'),
          lang('help.content.milestones.practices.step3'),
          lang('help.content.milestones.practices.step4')
        ]} />
      </HelpSection>

      <TipCard>
        {lang('help.content.milestones.tip')}
      </TipCard>
    </div>
  );
};

// ============ DOCUMENTS ============
const DocumentsHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.documents.description')}
      </p>

      <HelpSection title={lang('help.content.documents.categories')}>
        <div className="space-y-2">
          <InfoCard
            title={lang('help.content.documents.dhf.title')}
            description={lang('help.content.documents.dhf.description')}
          />
          <InfoCard
            title={lang('help.content.documents.dmr.title')}
            description={lang('help.content.documents.dmr.description')}
          />
          <InfoCard
            title={lang('help.content.documents.technical.title')}
            description={lang('help.content.documents.technical.description')}
          />
          <InfoCard
            title={lang('help.content.documents.quality.title')}
            description={lang('help.content.documents.quality.description')}
          />
        </div>
      </HelpSection>

      <HelpSection title={lang('help.content.documents.controlRequirements')}>
        <StepList steps={[
          lang('help.content.documents.requirements.step1'),
          lang('help.content.documents.requirements.step2'),
          lang('help.content.documents.requirements.step3'),
          lang('help.content.documents.requirements.step4')
        ]} />
      </HelpSection>

      <TipCard>
        {lang('help.content.documents.tip')}
      </TipCard>
    </div>
  );
};

// ============ REGULATORY ============
const RegulatoryHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.regulatory.description')}
      </p>

      <HelpSection title={lang('help.content.regulatory.frameworks')}>
        <div className="space-y-2">
          <InfoCard
            title={lang('help.content.regulatory.euMdr.title')}
            description={lang('help.content.regulatory.euMdr.description')}
          />
          <InfoCard
            title={lang('help.content.regulatory.fda.title')}
            description={lang('help.content.regulatory.fda.description')}
          />
          <InfoCard
            title={lang('help.content.regulatory.healthCanada.title')}
            description={lang('help.content.regulatory.healthCanada.description')}
          />
          <InfoCard
            title={lang('help.content.regulatory.tga.title')}
            description={lang('help.content.regulatory.tga.description')}
          />
        </div>
      </HelpSection>

      <HelpSection title={lang('help.content.regulatory.strategyConsiderations')}>
        <StepList steps={[
          lang('help.content.regulatory.strategy.step1'),
          lang('help.content.regulatory.strategy.step2'),
          lang('help.content.regulatory.strategy.step3'),
          lang('help.content.regulatory.strategy.step4')
        ]} />
      </HelpSection>

      <TipCard>
        {lang('help.content.regulatory.tip')}
      </TipCard>
    </div>
  );
};

// ============ DEVICE DEFINITION ============
const DeviceDefinitionHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.deviceDefinition.description')}
      </p>

      <HelpSection title={lang('help.content.deviceDefinition.purposeTab')}>
        <div className="space-y-2">
          <InfoCard
            title={lang('help.content.deviceDefinition.intendedUse.title')}
            description={lang('help.content.deviceDefinition.intendedUse.description')}
          />
          <InfoCard
            title={lang('help.content.deviceDefinition.patientPopulation.title')}
            description={lang('help.content.deviceDefinition.patientPopulation.description')}
          />
          <InfoCard
            title={lang('help.content.deviceDefinition.intendedUsers.title')}
            description={lang('help.content.deviceDefinition.intendedUsers.description')}
          />
          <InfoCard
            title={lang('help.content.deviceDefinition.clinicalBenefits.title')}
            description={lang('help.content.deviceDefinition.clinicalBenefits.description')}
          />
        </div>
      </HelpSection>

      <HelpSection title={lang('help.content.deviceDefinition.generalTab')}>
        <div className="space-y-2">
          <InfoCard
            title={lang('help.content.deviceDefinition.deviceDescription.title')}
            description={lang('help.content.deviceDefinition.deviceDescription.description')}
          />
          <InfoCard
            title={lang('help.content.deviceDefinition.keyFeatures.title')}
            description={lang('help.content.deviceDefinition.keyFeatures.description')}
          />
          <InfoCard
            title={lang('help.content.deviceDefinition.components.title')}
            description={lang('help.content.deviceDefinition.components.description')}
          />
        </div>
      </HelpSection>

      <TipCard>
        {lang('help.content.deviceDefinition.tip')}
      </TipCard>
    </div>
  );
};

// ============ QMS ============
const QMSHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.qms.description')}
      </p>

      <HelpSection title={lang('help.content.qms.coreProcesses')}>
        <div className="space-y-2">
          <InfoCard
            title={lang('help.content.qms.managementResponsibility.title')}
            description={lang('help.content.qms.managementResponsibility.description')}
          />
          <InfoCard
            title={lang('help.content.qms.documentControl.title')}
            description={lang('help.content.qms.documentControl.description')}
          />
          <InfoCard
            title={lang('help.content.qms.designControls.title')}
            description={lang('help.content.qms.designControls.description')}
          />
          <InfoCard
            title={lang('help.content.qms.purchasing.title')}
            description={lang('help.content.qms.purchasing.description')}
          />
          <InfoCard
            title={lang('help.content.qms.production.title')}
            description={lang('help.content.qms.production.description')}
          />
          <InfoCard
            title={lang('help.content.qms.capa.title')}
            description={lang('help.content.qms.capa.description')}
          />
        </div>
      </HelpSection>

      <HelpSection title={lang('help.content.qms.certificationPath')}>
        <StepList steps={[
          lang('help.content.qms.steps.implement'),
          lang('help.content.qms.steps.audit'),
          lang('help.content.qms.steps.selectBody'),
          lang('help.content.qms.steps.passStages'),
          lang('help.content.qms.steps.maintain')
        ]} />
      </HelpSection>

      <TipCard>
        {lang('help.content.qms.tip')}
      </TipCard>
    </div>
  );
};

// ============ VERIFICATION & VALIDATION ============
// V&V Survival Guide data
type VnVPitfallTheme = 'neutral' | 'ai' | 'security';

interface VnVPitfall {
  id: number;
  title: string;
  problem: string;
  fix: string;
  xyregTip?: string;
  theme: VnVPitfallTheme;
}

const VNV_PITFALLS: VnVPitfall[] = [
  {
    id: 1,
    title: "Inadequate Design Inputs",
    problem: "Vague requirements like 'easy to use'.",
    fix: "Write unambiguous, measurable specs.",
    xyregTip: "Use the Requirements Module to flag unverifiable words.",
    theme: "neutral",
  },
  {
    id: 2,
    title: "Uncontrolled Test Articles",
    problem: "Testing a prototype version that doesn't match the BOM.",
    fix: "Lock the BOM Snapshot before testing.",
    xyregTip: "Link Protocol to a specific BOM Version.",
    theme: "neutral",
  },
  {
    id: 3,
    title: "Testing the 'Wrong' Design",
    problem: "Using V&V for debugging/exploratory work.",
    fix: "Finish engineering 'Sandbox' tests before formal V&V.",
    xyregTip: "Use 'Draft' state for exploration.",
    theme: "neutral",
  },
  {
    id: 4,
    title: "Insufficient Sample Size",
    problem: "Testing n=1 and assuming reliability.",
    fix: "Calculate sample size based on Risk (90/95 confidence).",
    xyregTip: "Check the Risk Matrix for 'High Risk' items requiring n=30+.",
    theme: "neutral",
  },
  {
    id: 5,
    title: "Unvalidated Test Tools",
    problem: "Using a custom script that hasn't been validated (IQ/OQ).",
    fix: "Validate the tool before validating the device.",
    xyregTip: "Attach 'Tool Validation Report' as a dependency.",
    theme: "neutral",
  },
  {
    id: 6,
    title: "Poor Protocol Management",
    problem: "Moving the goalposts (changing criteria after testing).",
    fix: "Approve Protocol BEFORE execution.",
    xyregTip: "System enforces 'Lock before Run' logic.",
    theme: "neutral",
  },
  {
    id: 7,
    title: "Poor Test Methods",
    problem: "Tests rely on operator skill/subjectivity.",
    fix: "Invest in robust fixtures and automated hooks.",
    theme: "neutral",
  },
  {
    id: 8,
    title: "Inadequate Software Testing",
    problem: "Testing only 'Happy Paths' (ignoring failure modes).",
    fix: "Test SOUP, Boundary Values (-1), and Fault Injection.",
    xyregTip: "Link specific 'Software Failure Risks' to Test Cases.",
    theme: "neutral",
  },
  {
    id: 9,
    title: "Poor Test Planning",
    problem: "Rushing to the lab without a Master Plan.",
    fix: "Create MVP (Master Validation Plan) months ahead.",
    theme: "neutral",
  },
  {
    id: 10,
    title: "Not Comprehensive",
    problem: "Forgetting Packaging, Labeling, and Shelf-Life.",
    fix: "Traceability Matrix must show 100% coverage.",
    theme: "neutral",
  },
  {
    id: 11,
    title: "Neglecting AI/ML Validation",
    problem: "Testing on training data (Data Leakage) or ignoring Bias.",
    fix: "Strict separation of Train/Test data & Stratified Testing (demographics).",
    xyregTip: "Use the 'AI Model Card' snapshot feature.",
    theme: "ai",
  },
  {
    id: 12,
    title: "Overlooking Cybersecurity",
    problem: "Testing for function, not vulnerability (Pen-Testing).",
    fix: "Fuzz testing, CVE scanning, and 'Assume Breach' testing.",
    xyregTip: "Link Pen-Test Reports to the 'Threat Analysis' (STRIDE).",
    theme: "security",
  },
];

const getVnVThemeIcon = (theme: VnVPitfallTheme) => {
  switch (theme) {
    case 'ai':
      return <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center"><span className="text-indigo-600 text-xs">🧠</span></div>;
    case 'security':
      return <Shield className="h-5 w-5 text-red-600" />;
    default:
      return <AlertCircle className="h-5 w-5 text-amber-600" />;
  }
};

const getVnVThemeClasses = (theme: VnVPitfallTheme) => {
  switch (theme) {
    case 'ai':
      return 'border-indigo-200 bg-indigo-50/50 dark:bg-indigo-900/20 dark:border-indigo-700';
    case 'security':
      return 'border-red-200 bg-red-50/50 dark:bg-red-900/20 dark:border-red-700';
    default:
      return 'border-border bg-muted/30';
  }
};

const getVnVThemeTitleClasses = (theme: VnVPitfallTheme) => {
  switch (theme) {
    case 'ai':
      return 'text-indigo-900 dark:text-indigo-300';
    case 'security':
      return 'text-red-900 dark:text-red-300';
    default:
      return 'text-foreground';
  }
};

// Requirements Management Help
const RequirementsHelp: React.FC<{ onNavigateToDetail?: (id: string) => void }> = ({ onNavigateToDetail }) => (
  <div className="space-y-6">
    <p className="text-muted-foreground">
      Requirements management is fundamental to medical device development. This module captures and traces 
      User Needs, System Requirements, Software Requirements, and Hardware Requirements per IEC 62304, 
      ISO 13485, and 21 CFR 820.
    </p>

    <HelpSection title="Requirements Hierarchy">
      <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
        <Info className="h-3 w-3" /> Understanding the cascading structure of requirements
      </p>
      <div className="space-y-2">
        <NavigableInfoCard
          title="User Needs (UNs)"
          description="High-level statements of what users require from the device. Derived from market research, clinical needs, and user interviews. These form the foundation of your design inputs."
          detailId="req-user-needs"
          onNavigate={onNavigateToDetail}
        />
        <NavigableInfoCard
          title="System Requirements (SRs)"
          description="Technical specifications that address user needs at the system level. These define what the complete device must do, including performance, safety, and regulatory requirements."
          detailId="req-system"
          onNavigate={onNavigateToDetail}
        />
        <NavigableInfoCard
          title="Software Requirements (SWRs)"
          description="Per IEC 62304, software requirements decompose system requirements into specific software functions, interfaces, and performance criteria."
          detailId="req-software"
          onNavigate={onNavigateToDetail}
        />
        <NavigableInfoCard
          title="Hardware Requirements (HWRs)"
          description="Technical specifications for physical components, materials, mechanical properties, and electrical characteristics of the device."
          detailId="req-hardware"
          onNavigate={onNavigateToDetail}
        />
      </div>
    </HelpSection>

    <HelpSection title="Best Practices">
      <div className="space-y-2">
        <InfoCard
          title="SMART Requirements"
          description="Each requirement should be Specific, Measurable, Achievable, Relevant, and Testable. Avoid vague language like 'fast' or 'reliable' without quantification."
        />
        <InfoCard
          title="Unique IDs"
          description="Use consistent ID prefixes (UN-, SR-, SWR-, HWR-) for traceability. XyReg auto-generates these IDs for you."
        />
        <InfoCard
          title="Bidirectional Traceability"
          description="Link requirements both upstream (to user needs/regulations) and downstream (to design outputs and V&V tests)."
        />
      </div>
    </HelpSection>

    <HelpSection title="Regulatory Context">
      <div className="p-3 bg-muted/50 rounded-lg border space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Key Standards</span>
        </div>
        <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
          <li><strong>IEC 62304:</strong> Software lifecycle requirements, including SWR decomposition</li>
          <li><strong>ISO 13485 §7.3:</strong> Design and development controls, design inputs</li>
          <li><strong>21 CFR 820.30:</strong> FDA design controls, design input requirements</li>
          <li><strong>EU MDR Annex II:</strong> Technical documentation requirements</li>
        </ul>
      </div>
    </HelpSection>

    <TipCard>
      <strong>Xyreg Tip:</strong> Link each User Need to at least one System Requirement, and each SR to V&V test cases. 
      The Traceability Matrix will highlight gaps automatically.
    </TipCard>

    <WarningCard>
      <strong>Common Pitfall:</strong> Incomplete or ambiguous requirements are the #1 cause of late-stage design changes 
      and regulatory delays. Take time to get requirements right early—it saves significant rework.
    </WarningCard>
  </div>
);

import vvDesignControlDiagram from '@/assets/vv-design-control-diagram.png';

const VerificationValidationHelp: React.FC<{ onNavigateToDetail?: (id: string) => void }> = ({ onNavigateToDetail }) => (
  <div className="space-y-6">
    <div className="rounded-lg border bg-muted/30 p-4 flex flex-col items-center">
      <img 
        src={vvDesignControlDiagram} 
        alt="Design Control V-Model showing User Needs, Design Input, Design Process, Design Output, Medical Device with Verification and Validation loops" 
        className="w-1/2 h-auto"
      />
      <p className="text-xs text-muted-foreground text-center mt-2">
        Design Control V-Model: The foundation of medical device V&V
      </p>
    </div>
    
    <p className="text-muted-foreground">
      Comprehensive V&V management for medical device development, ensuring both verification 
      ("Did we build the product right?") and validation ("Did we build the right product?") 
      are thoroughly documented and executed.
    </p>

    <HelpSection title="V&V Fundamentals">
      <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
        <Info className="h-3 w-3" /> Click any topic below for detailed guidance
      </p>
      <div className="space-y-2">
        <NavigableInfoCard
          title="Verification"
          description="Confirmation through objective evidence that specified requirements have been fulfilled. Tests design outputs against design inputs."
          detailId="vv-verification"
          onNavigate={onNavigateToDetail}
        />
        <NavigableInfoCard
          title="Validation"
          description="Confirmation through objective evidence that requirements for a specific intended use are consistently fulfilled."
          detailId="vv-validation"
          onNavigate={onNavigateToDetail}
        />
        <NavigableInfoCard
          title="Design Transfer"
          description="The bridge between Design & Development and Production. Ensures the device can be reliably manufactured to specification."
          detailId="vv-design-transfer"
          onNavigate={onNavigateToDetail}
        />
      </div>
    </HelpSection>

    <HelpSection title="Key V&V Components">
      <div className="space-y-2">
        <NavigableInfoCard
          title="V&V Plans"
          description="Master documents defining the overall strategy, scope, methodology, acceptance criteria, and roles."
          detailId="vv-plans"
          onNavigate={onNavigateToDetail}
        />
        <NavigableInfoCard
          title="V&V Protocols"
          description="Detailed test scripts specifying exact procedures, equipment, acceptance criteria, and data collection."
          detailId="vv-protocols"
          onNavigate={onNavigateToDetail}
        />
        <NavigableInfoCard
          title="Traceability Matrix"
          description="A living document mapping user needs → design inputs → V&V activities → production specifications."
          detailId="vv-traceability"
          onNavigate={onNavigateToDetail}
        />
      </div>
    </HelpSection>

    <HelpSection title="Regulatory Framework">
      <NavigableInfoCard
        title="Standards & Regulations"
        description="IEC 62304, ISO 13485, 21 CFR 820, EU MDR 2017/745 - Key requirements for V&V activities."
        detailId="vv-regulatory"
        onNavigate={onNavigateToDetail}
      />
    </HelpSection>

    {/* V&V Survival Guide */}
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-amber-600" />
        <h4 className="font-semibold">V&V Survival Guide</h4>
        <Badge variant="outline" className="ml-auto text-xs bg-primary/10 border-primary/20">
          12 Pitfalls
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Avoid the most common pitfalls in Medical Device Validation:
      </p>
      <div className="space-y-2">
        {VNV_PITFALLS.slice(0, 4).map((item) => (
          <div
            key={item.id}
            className={`p-3 rounded-lg border ${getVnVThemeClasses(item.theme)}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getVnVThemeIcon(item.theme)}</div>
              <div className="flex-1 space-y-1">
                <h5 className={`font-medium text-sm ${getVnVThemeTitleClasses(item.theme)}`}>
                  {item.id}. {item.title}
                </h5>
                <div className="text-xs space-y-1">
                  <div className="flex gap-2">
                    <span className="font-semibold text-red-600 dark:text-red-400 shrink-0">Problem:</span>
                    <span className="text-muted-foreground">{item.problem}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-green-600 dark:text-green-400 shrink-0">Fix:</span>
                    <span className="text-muted-foreground">{item.fix}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <NavigableInfoCard
        title="View All 12 V&V Pitfalls →"
        description="See the complete survival guide with XyReg tips for avoiding validation failures."
        detailId="vv-survival-guide"
        onNavigate={onNavigateToDetail}
      />
    </div>

    <TipCard>
      The golden rule: Test Protocols must be locked (Approved) before Test Runs can be executed. 
      Every Requirement must have a Test. Every Risk must have a Verification.
    </TipCard>
  </div>
);

// ============ QMSR PROCESS VALIDATION RATIONALE ============
const QMSRRationaleHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-muted-foreground">
      Document risk-based justification for validation rigor per QMSR Clause 7.1. Link hazards from your 
      Risk Management File to justify testing sample sizes and confidence intervals.
    </p>

    <HelpSection title="Why Create a Rationale?">
      <div className="space-y-3">
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Regulatory Requirement:</strong> Under QMSR (21 CFR 820 aligned with ISO 13485:2016), 
            manufacturers must provide documented justification for their validation approach. 
            The FDA expects you to answer: <em>"Why did you test this many samples with these acceptance criteria?"</em>
          </p>
        </div>
        <InfoCard
          title="Risk-Based Sample Sizing"
          description="Higher-risk processes require larger sample sizes and tighter confidence intervals. Your rationale links specific hazards to validation stringency."
        />
        <InfoCard
          title="Audit Defense"
          description="A well-documented rationale prevents 483 observations. Auditors will ask 'How did you determine your sample size?' — your rationale provides the answer."
        />
        <InfoCard
          title="Process Efficiency"
          description="Avoid over-validation (wasted resources) or under-validation (regulatory risk) by matching validation rigor to actual process risk."
        />
      </div>
    </HelpSection>

    <HelpSection title="What Goes Into a Rationale?">
      <div className="space-y-2">
        <InfoCard
          title="Process Description"
          description="Clearly define the process being validated — sterilization, packaging, assembly, software, etc."
        />
        <InfoCard
          title="Risk Assessment Link"
          description="Reference specific hazards from your Risk Management File (ISO 14971). Higher severity/probability = more rigorous validation."
        />
        <InfoCard
          title="Statistical Justification"
          description="Document your sample size calculation method (e.g., confidence/reliability approach, ANSI Z1.4, historical data)."
        />
        <InfoCard
          title="Acceptance Criteria"
          description="Define pass/fail thresholds with rationale for why they're appropriate for the identified risks."
        />
      </div>
    </HelpSection>

    <HelpSection title="Regulatory Context">
      <div className="p-3 bg-muted/50 rounded-lg border space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Applicable Standards</span>
        </div>
        <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
          <li><strong>21 CFR 820.75:</strong> Process Validation requirements (now aligned with ISO 13485)</li>
          <li><strong>ISO 13485:2016 §7.5.6:</strong> Validation of processes for production and service provision</li>
          <li><strong>GHTF/SG3/N99-10:</strong> Quality Management Systems – Process Validation Guidance</li>
          <li><strong>ISO 14971:</strong> Risk Management linkage for validation scope</li>
        </ul>
      </div>
    </HelpSection>

    <WarningCard>
      <strong>Common Gap:</strong> Many 483 observations cite "inadequate process validation rationale." 
      Simply stating "validated per SOP" is insufficient — you must document WHY your approach is appropriate 
      for the specific risks involved.
    </WarningCard>

    <TipCard>
      <strong>XyReg Tip:</strong> Link each Rationale to hazards in your Risk Management File. 
      This creates automatic traceability from risk to validation, ready for auditor review.
    </TipCard>
  </div>
);


const UsabilityEngineeringHelp: React.FC<{ onNavigateToDetail?: (id: string) => void }> = ({ onNavigateToDetail }) => (
  <div className="space-y-6">
    <p className="text-muted-foreground">
      Usability Engineering per IEC 62366-1 ensures your medical device can be used safely and effectively 
      by the intended users in the intended use environment. This module integrates with Device Definition 
      and Risk Management for comprehensive human factors documentation.
    </p>

    <HelpSection title="IEC 62366-1 Process">
      <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
        <Info className="h-3 w-3" /> Click any topic below for detailed guidance
      </p>
      <div className="space-y-2">
        <NavigableInfoCard
          title="5.1 - Use Specification"
          description="Define intended users, use environments, and user interface characteristics. Synced from Device Definition."
          detailId="uef-use-specification"
          onNavigate={onNavigateToDetail}
        />
        <NavigableInfoCard
          title="5.2 - UI Characteristics"
          description="Identify user interface features (displays, controls, alarms) and assess their safety relevance."
          detailId="uef-ui-characteristics"
          onNavigate={onNavigateToDetail}
        />
        <NavigableInfoCard
          title="5.3-5.4 - Usability Hazards"
          description="Identify use-related hazards, hazardous situations, and user interface elements that could contribute to harm."
          detailId="uef-usability-hazards"
          onNavigate={onNavigateToDetail}
        />
        <NavigableInfoCard
          title="5.5 - Evaluation Plan"
          description="Plan formative and summative usability evaluations with clear objectives, methods, and acceptance criteria."
          detailId="uef-evaluation-plan"
          onNavigate={onNavigateToDetail}
        />
        <NavigableInfoCard
          title="5.7/5.9 - Validation Results"
          description="Document usability testing results, including participant demographics, task performance, and critical task analysis."
          detailId="uef-validation-results"
          onNavigate={onNavigateToDetail}
        />
      </div>
    </HelpSection>

    <HelpSection title="Key Concepts">
      <div className="space-y-2">
        <NavigableInfoCard
          title="Formative Evaluation"
          description="Iterative testing during development to identify usability issues early. Low participant numbers (3-5) are acceptable."
          detailId="uef-formative-evaluation"
          onNavigate={onNavigateToDetail}
        />
        <NavigableInfoCard
          title="Summative Evaluation"
          description="Final validation testing with statistically appropriate sample sizes (15+ typical). Demonstrates safe and effective use."
          detailId="uef-summative-evaluation"
          onNavigate={onNavigateToDetail}
        />
        <NavigableInfoCard
          title="Hazard-Related Use Scenarios"
          description="Critical tasks where use errors could lead to harm. Per IEC 62366-1 Clause 5.6."
          detailId="uef-hazard-scenarios"
          onNavigate={onNavigateToDetail}
        />
      </div>
    </HelpSection>

    <HelpSection title="Integration Points">
      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><strong className="text-foreground">→ Device Definition:</strong> Use Specification data syncs automatically</p>
          <p><strong className="text-foreground">→ Risk Management:</strong> Usability hazards link to the Hazard Traceability Matrix</p>
          <p><strong className="text-foreground">→ V&V Module:</strong> Usability test results integrate with validation testing</p>
        </div>
      </div>
    </HelpSection>

    <TipCard>
      <strong>XyReg Tip:</strong> The Use Specification tab is read-only and syncs from Device Definition. 
      Click "Edit" to navigate directly to the source fields with a quick return button.
    </TipCard>
  </div>
);

// ============ SYSTEM ARCHITECTURE ============
const SystemArchitectureHelp: React.FC<{ onNavigateToDetail?: (id: string) => void }> = ({ onNavigateToDetail }) => (
  <div className="space-y-6">
    <p className="text-muted-foreground">
      System Architecture defines the high-level structure of your medical device, including hardware, 
      software, and connectivity components. This documentation supports IEC 62304 software lifecycle 
      and EU MDR technical documentation requirements.
    </p>

    <HelpSection title="Architecture Types">
      <div className="space-y-2">
        <NavigableInfoCard
          title="Pure Hardware Device"
          description="No embedded software. Traditional mechanical/electrical medical devices. Focus on materials, manufacturing, and physical specifications."
          detailId="arch-pure-hardware"
          onNavigate={onNavigateToDetail}
        />
        <NavigableInfoCard
          title="Software in Medical Device (SiMD)"
          description="Software embedded in a hardware device. Subject to IEC 62304. Examples: infusion pump firmware, patient monitor software, diagnostic equipment controllers."
          detailId="arch-simd"
          onNavigate={onNavigateToDetail}
        />
        <NavigableInfoCard
          title="Software as Medical Device (SaMD)"
          description="Standalone software intended for medical purposes. No dedicated hardware. Subject to IMDRF SaMD framework and AI/ML guidance if applicable."
          detailId="arch-samd"
          onNavigate={onNavigateToDetail}
        />
      </div>
    </HelpSection>

    <HelpSection title="Documentation Components">
      <div className="space-y-2">
        <NavigableInfoCard
          title="Block Diagrams"
          description="Visual representation of system components, data flows, and interfaces between subsystems."
          detailId="arch-block-diagrams"
          onNavigate={onNavigateToDetail}
        />
        <NavigableInfoCard
          title="Software Architecture"
          description="SOUP/OTS components, software items, safety classification per IEC 62304, and cybersecurity boundaries."
          detailId="arch-software"
          onNavigate={onNavigateToDetail}
        />
        <NavigableInfoCard
          title="Hardware Architecture"
          description="PCB layouts, component specifications, power systems, and mechanical interfaces."
          detailId="arch-hardware"
          onNavigate={onNavigateToDetail}
        />
        <InfoCard
          title="Connectivity"
          description="Network interfaces, protocols, cloud services, and data exchange mechanisms."
        />
      </div>
    </HelpSection>

    <HelpSection title="Regulatory Context">
      <div className="p-3 bg-muted/50 rounded-lg border space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Key Standards</span>
        </div>
        <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
          <li><strong>IEC 62304:</strong> Software lifecycle - architecture decomposition</li>
          <li><strong>IEC 81001-5-1:</strong> Cybersecurity architecture requirements</li>
          <li><strong>EU MDR Annex II §4:</strong> Design and manufacturing information</li>
          <li><strong>21 CFR 820.30:</strong> Design controls - design output</li>
        </ul>
      </div>
    </HelpSection>

    <TipCard>
      <strong>XyReg Tip:</strong> Use the Architecture tab to upload block diagrams and define component 
      relationships. Architecture decisions should trace to requirements and risk controls.
    </TipCard>
  </div>
);

// ============ AI ASSURANCE LAB ============
const AIAssuranceLabHelp: React.FC<{ onNavigateToDetail?: (id: string) => void }> = ({ onNavigateToDetail }) => (
  <div className="space-y-6">
    <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="h-5 w-5 text-indigo-500" />
        <span className="font-semibold text-indigo-600 dark:text-indigo-400">EU AI Act Compliance</span>
      </div>
      <p className="text-sm text-muted-foreground">
        This lab provides tools for documenting AI/ML model development, bias testing, and regulatory compliance 
        under the EU AI Act (Regulation 2024/1689) and FDA's AI/ML guidance.
      </p>
    </div>

    <p className="text-muted-foreground">
      The AI Assurance Lab is a specialized verification environment for AI-enabled medical devices. 
      It ensures algorithmic transparency, fairness across demographic groups, and reproducibility of 
      model behavior—critical requirements for high-risk AI systems under EU AI Act Article 9-15.
    </p>

    <HelpSection title="Lab Components">
      <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
        <Info className="h-3 w-3" /> Click any topic below for detailed guidance
      </p>
      <div className="space-y-2">
        <NavigableInfoCard
          title="Controlled Datasets (Data Vault)"
          description="Lock and hash training/testing datasets to ensure immutability and prevent data leakage between sets."
          detailId="ai-data-vault"
          onNavigate={onNavigateToDetail}
        />
        <NavigableInfoCard
          title="Model Registry (DUT)"
          description="Track model versions with SHA-256 hashes. Freeze models before validation to ensure reproducibility."
          detailId="ai-model-registry"
          onNavigate={onNavigateToDetail}
        />
        <NavigableInfoCard
          title="Bias Matrix (Stratification)"
          description="Evaluate model performance across demographic subgroups: Precision, Recall, F1-Score by gender and age."
          detailId="ai-bias-matrix"
          onNavigate={onNavigateToDetail}
        />
      </div>
    </HelpSection>

    <HelpSection title="EU AI Act Requirements">
      <div className="space-y-2">
        <NavigableInfoCard
          title="Article 9: Risk Management"
          description="Continuous iterative risk management for AI systems. Identify and mitigate risks to health, safety, and fundamental rights."
          detailId="ai-act-article9"
          onNavigate={onNavigateToDetail}
        />
        <NavigableInfoCard
          title="Article 10: Data Governance"
          description="Training, validation, and testing datasets must be relevant, representative, and free of errors. Documented data lineage required."
          detailId="ai-act-article10"
          onNavigate={onNavigateToDetail}
        />
        <NavigableInfoCard
          title="Article 11: Technical Documentation"
          description="Comprehensive documentation of design, development, and validation. Must be updated throughout the AI system lifecycle."
          detailId="ai-act-article11"
          onNavigate={onNavigateToDetail}
        />
        <NavigableInfoCard
          title="Article 15: Accuracy & Robustness"
          description="AI systems must achieve appropriate levels of accuracy, robustness, and cybersecurity. Performance metrics must be declared."
          detailId="ai-act-article15"
          onNavigate={onNavigateToDetail}
        />
      </div>
    </HelpSection>

    <HelpSection title="Verification Workflow">
      <div className="p-3 bg-muted/50 rounded-lg border">
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-mono">1</span>
            <span><strong>Lock Datasets:</strong> Hash training and testing sets to prevent modifications</span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-mono">2</span>
            <span><strong>Freeze Model:</strong> Record SHA-256 hash of the model under test (DUT)</span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-mono">3</span>
            <span><strong>Run Verification:</strong> Execute stratified performance testing across subgroups</span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-mono">4</span>
            <span><strong>Review Bias Matrix:</strong> Analyze Precision/Recall/F1 by demographic</span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center font-mono">5</span>
            <span><strong>Assess Status:</strong> PASS if all subgroups meet thresholds (≥80%); FAIL otherwise</span>
          </li>
        </ol>
      </div>
    </HelpSection>

    <HelpSection title="Key Metrics Explained">
      <div className="space-y-2">
        <InfoCard
          title="Precision"
          description="Of all positive predictions, how many were correct? High precision = few false positives. Critical for screening tests."
        />
        <InfoCard
          title="Recall (Sensitivity)"
          description="Of all actual positives, how many did we catch? High recall = few false negatives. Critical for diagnosis."
        />
        <InfoCard
          title="F1-Score"
          description="Harmonic mean of Precision and Recall. Balances both metrics. Use when both false positives and negatives matter."
        />
      </div>
    </HelpSection>

    <HelpSection title="Bias Thresholds">
      <div className="p-3 bg-muted/50 rounded-lg border space-y-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500/70" />
            <span className="text-xs text-muted-foreground">≥95%: Excellent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500/70" />
            <span className="text-xs text-muted-foreground">80-94%: Acceptable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500/70" />
            <span className="text-xs text-muted-foreground">&lt;80%: Fail</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Any demographic subgroup scoring below 80% in any metric triggers a FAIL status. 
          Investigate root causes: insufficient training data, label bias, or model architecture issues.
        </p>
      </div>
    </HelpSection>

    <HelpSection title="Regulatory Context">
      <div className="p-3 bg-muted/50 rounded-lg border space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Applicable Standards</span>
        </div>
        <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
          <li><strong>EU AI Act 2024/1689:</strong> High-risk AI systems (including medical devices)</li>
          <li><strong>FDA AI/ML Guidance:</strong> GMLP (Good Machine Learning Practice) principles</li>
          <li><strong>IEC 62304:</strong> Software lifecycle for AI/ML components</li>
          <li><strong>ISO 13485:</strong> QMS requirements for AI documentation</li>
          <li><strong>IEC 81001-5-1:</strong> Cybersecurity for AI-enabled devices</li>
        </ul>
      </div>
    </HelpSection>

    <WarningCard>
      <strong>Critical:</strong> Models must be "Frozen" (immutable) before running verification tests. 
      Never validate a model that is still being trained—this violates EU AI Act Article 10 data governance requirements.
    </WarningCard>

    <TipCard>
      <strong>XyReg Tip:</strong> The AI Assurance Lab generates audit-ready evidence for Notified Body review. 
      Export the stratification heatmap and model hashes for your Technical Documentation (Annex II §4).
    </TipCard>
  </div>
);

// ============ COMPANY SETTINGS ============
const CompanySettingsHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.companySettings.description')}
      </p>

      <HelpSection title={lang('help.content.companySettings.companyProfile')}>
        <div className="space-y-2">
          <InfoCard
            title={lang('help.content.companySettings.companyInfo.title')}
            description={lang('help.content.companySettings.companyInfo.description')}
          />
          <InfoCard
            title={lang('help.content.companySettings.authorizedRep.title')}
            description={lang('help.content.companySettings.authorizedRep.description')}
          />
          <InfoCard
            title={lang('help.content.companySettings.notifiedBody.title')}
            description={lang('help.content.companySettings.notifiedBody.description')}
          />
        </div>
      </HelpSection>

      <HelpSection title={lang('help.content.companySettings.teamManagement')}>
        <div className="space-y-2">
          <InfoCard
            title={lang('help.content.companySettings.userRoles.title')}
            description={lang('help.content.companySettings.userRoles.description')}
          />
          <InfoCard
            title={lang('help.content.companySettings.departments.title')}
            description={lang('help.content.companySettings.departments.description')}
          />
          <InfoCard
            title={lang('help.content.companySettings.trainingRecords.title')}
            description={lang('help.content.companySettings.trainingRecords.description')}
          />
        </div>
      </HelpSection>
    </div>
  );
};

// ============ DESIGN REVIEW ============
const DesignReviewHelp: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <h3 className="font-semibold flex items-center gap-2 mb-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          Design Review — Regulatory Baselining
        </h3>
        <p className="text-sm text-muted-foreground">
          The Design Review module is the system orchestrator for formal regulatory compliance.
          It enforces ISO 13485 §7.3.5 and FDA 21 CFR 820.30(e) through structured review sessions,
          independent reviewer verification, and evidence baselining.
        </p>
      </div>

      <HelpSection title="What is a Design Review?">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            A Design Review is a formal, documented examination of a design stage to evaluate its adequacy,
            identify problems, and propose corrective actions. In XyReg, design reviews act as <strong>hard gates</strong> that
            freeze (baseline) all reviewed objects, creating an immutable audit trail.
          </p>
        </div>
      </HelpSection>

      <HelpSection title="Review Types">
        <div className="space-y-2">
          <InfoCard title="Phase-End Review (Hard Gate)" description="Required at the end of each development phase (Concept → Design Input → Design Output → Verification → Validation → Transfer). All phase deliverables must be reviewed and baselined before proceeding." />
          <InfoCard title="Ad-Hoc Review" description="Triggered by significant design changes, CAPA actions, or risk-level escalations. Not tied to a specific phase gate but follows the same review rigor." />
          <InfoCard title="Post-Market / Change Control" description="Reviews triggered by post-market surveillance findings, customer complaints, or change control requests (CCRs). Links back to source CAPA or CCR." />
        </div>
      </HelpSection>

      <HelpSection title="Review Workflow">
        <StepList steps={[
          'Create a new Design Review — select type, phase, and baseline label',
          'Scoping — The Smart Manifest Discovery Service auto-discovers changed, new, and at-risk objects',
          'Review session — Complete the 6-section template: General Info, Attendees, Review Scope / Artifacts, Gate Criteria Checklist, Decision, Approvals',
          'Findings — Log minor or major findings; major findings block finalization',
          'Signatures — Collect Engineering Lead, Quality Manager, and Independent Reviewer signatures',
          'Finalize & Baseline — All manifest objects transition from DRAFT to BASELINED status',
        ]} />
      </HelpSection>

      <HelpSection title="Smart Manifest Discovery">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            The discovery engine uses a <strong>3-layer scan</strong> to automatically identify what needs review:
          </p>
          <div className="space-y-2 ml-2">
            <div className="p-2 bg-muted/30 rounded">
              <strong>Layer 1 — Temporal Scan:</strong> All objects updated since the last completed baseline
            </div>
            <div className="p-2 bg-muted/30 rounded">
              <strong>Layer 2 — State Inclusion:</strong> Draft objects within the current phase's module scope
            </div>
            <div className="p-2 bg-muted/30 rounded">
              <strong>Layer 3 — Traceability Crawl:</strong> Connected parent/child objects discovered via traceability links
            </div>
          </div>
          <p className="mt-2">
            Results are grouped into 4 regulatory categories: <strong>New Evidence</strong>, <strong>Modified Objects</strong>,
            <strong> Risk Delta</strong> (hazards with changed risk levels), and <strong>Compliance Gaps</strong> (missing mandatory links).
          </p>
        </div>
      </HelpSection>

      <HelpSection title="Compliance Gap Detection">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>The system automatically flags objects with missing mandatory traceability:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>User Needs</strong> without linked System Requirements</li>
            <li><strong>System Requirements</strong> without linked Test Cases</li>
            <li><strong>Hazards</strong> without risk control measures or verification tests</li>
            <li><strong>Test Cases</strong> without linked requirements or hazards</li>
          </ul>
          <p className="mt-2">Compliance gaps are mandatory discussion items and cannot be unchecked from the manifest.</p>
        </div>
      </HelpSection>

      <HelpSection title="Findings & Gate Control">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Findings are categorized by severity:</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 border rounded">
              <strong className="text-amber-600">Minor</strong>
              <p className="text-xs">Editorial or clarification issues. Do not block finalization.</p>
            </div>
            <div className="p-2 border rounded">
              <strong className="text-destructive">Major</strong>
              <p className="text-xs">Safety or compliance gaps. <strong>Block finalization</strong> until closed.</p>
            </div>
          </div>
        </div>
      </HelpSection>

      <HelpSection title="Signature Requirements">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Three signatures are required to finalize a design review:</p>
          <div className="space-y-2">
            <div className="p-2 bg-muted/30 rounded flex items-start gap-2">
              <Users className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <strong>Engineering Lead</strong>
                <p className="text-xs">Confirms design outputs meet design inputs. Direct involvement expected.</p>
              </div>
            </div>
            <div className="p-2 bg-muted/30 rounded flex items-start gap-2">
              <Shield className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <strong>Quality Manager</strong>
                <p className="text-xs">Validates QMS compliance. May have edited Quality Plan but not Design Inputs.</p>
              </div>
            </div>
            <div className="p-2 bg-muted/30 rounded flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <strong>Independent Reviewer</strong>
                <p className="text-xs">Must have <strong>zero involvement</strong> with manifest objects. Enforced by the "Clean Hands" algorithm.</p>
              </div>
            </div>
          </div>
        </div>
      </HelpSection>

      <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
        <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          "Clean Hands" — Independent Reviewer Eligibility (SWR-C-13)
        </h4>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Per FDA 21 CFR 820.30(e) and ISO 13485 §7.3.5, the independent reviewer must have had
            <strong> no direct involvement</strong> in the design stage under review. XyReg enforces this programmatically:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>The system scans <code className="text-xs bg-muted px-1 rounded">created_by</code> fields for every object in the review manifest</li>
            <li>Any user who authored ANY manifest object is flagged <strong>INELIGIBLE</strong> for the Independent Reviewer role</li>
            <li>If an ineligible user selects "Independent Reviewer", the Sign button is disabled with a regulatory conflict warning</li>
            <li>A server-side guard in <code className="text-xs bg-muted px-1 rounded">canFinalize()</code> rejects conflicted signatures as a backup</li>
          </ul>
          <p className="mt-2 text-xs">
            This means during an audit, you can demonstrate that "self-grading" was <strong>blocked by the system</strong>,
            proving your State of Control is absolute.
          </p>
        </div>
      </div>

      <HelpSection title="Baselining (Legal Handshake)">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            When a review is finalized, the system executes a <strong>"Legal Handshake"</strong>:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>All manifest objects transition from <strong>INCLUDED → BASELINED</strong></li>
            <li>Review status changes to <strong>COMPLETED</strong> with a timestamp</li>
            <li>Snapshot data is preserved in immutable JSONB for audit trail</li>
            <li>Baselined objects become the reference point for future change detection</li>
          </ul>
        </div>
      </HelpSection>

      <HelpSection title="Gate Criteria Checklist">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Each development phase has specific review criteria and checklists:</p>
          <div className="space-y-1">
            <div className="p-2 bg-muted/20 rounded text-xs"><strong>Concept:</strong> User needs defined, initial risk analysis, feasibility assessment</div>
            <div className="p-2 bg-muted/20 rounded text-xs"><strong>Design Input:</strong> Requirements complete, traceability established, risk controls identified</div>
            <div className="p-2 bg-muted/20 rounded text-xs"><strong>Design Output:</strong> Specifications verified, architecture reviewed, FMEA updated</div>
            <div className="p-2 bg-muted/20 rounded text-xs"><strong>Verification:</strong> Test cases executed, results documented, non-conformances resolved</div>
            <div className="p-2 bg-muted/20 rounded text-xs"><strong>Validation:</strong> Clinical evaluation, usability testing, labeling review</div>
            <div className="p-2 bg-muted/20 rounded text-xs"><strong>Transfer:</strong> Manufacturing readiness, DHF complete, regulatory submission ready</div>
          </div>
        </div>
      </HelpSection>

      <HelpSection title="Regulatory References">
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex gap-2 p-2 bg-muted/20 rounded">
            <Badge variant="outline" className="text-xs shrink-0">ISO 13485</Badge>
            <span>§7.3.5 — Design and development review</span>
          </div>
          <div className="flex gap-2 p-2 bg-muted/20 rounded">
            <Badge variant="outline" className="text-xs shrink-0">21 CFR 820</Badge>
            <span>§820.30(e) — Design review requirements</span>
          </div>
          <div className="flex gap-2 p-2 bg-muted/20 rounded">
            <Badge variant="outline" className="text-xs shrink-0">IEC 62304</Badge>
            <span>§5.6 — Software verification (for SaMD components)</span>
          </div>
          <div className="flex gap-2 p-2 bg-muted/20 rounded">
            <Badge variant="outline" className="text-xs shrink-0">ISO 14971</Badge>
            <span>§7 — Evaluation of overall residual risk</span>
          </div>
        </div>
      </HelpSection>

      <TipCard>
        The Design Review module auto-populates discussion items based on what changed since your last baseline.
        Use the "By Discovery Type" view to see New Evidence, Modified Objects, Risk Deltas, and Compliance Gaps at a glance.
      </TipCard>
    </div>
  );
};

// Design Review Detail (session-level) help
const DesignReviewDetailHelp: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <h3 className="font-semibold flex items-center gap-2 mb-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          Design Review Session
        </h3>
        <p className="text-sm text-muted-foreground">
          You are inside a live review session. This workspace follows a 6-section template
          aligned with ISO 13485 §7.3.5 requirements for formal design review documentation.
        </p>
      </div>

      <HelpSection title="Session Sections">
        <StepList steps={[
          'General Information — Review metadata, type, phase, baseline label, and due date',
          'Attendees & Roles — Participants with assigned roles (Chair, Reviewer, Independent Reviewer, Observer, Scribe)',
          'Review Scope / Artifacts — Auto-discovered OIDs from the Manifest Discovery Service, grouped by module or discovery type',
          'Gate Criteria Checklist — Interactive checklists and forms specific to the current development phase',
          'Review Decision — Approved / Approved with Conditions / Not Approved, plus action items (findings)',
          'Approvals — Signature blocks for Review Chair and Quality Assurance',
        ]} />
      </HelpSection>

      <HelpSection title="Tabs">
        <div className="space-y-2">
          <InfoCard title="Overview" description="The live review workspace with all 6 interactive sections. Checklist responses, form inputs, and the review decision are persisted automatically." />
          <InfoCard title="Manifest" description="All Object IDs (OIDs) included in this review. Run a Gaps Check to verify traceability completeness. Items show INCLUDED or BASELINED status." />
          <InfoCard title="Findings" description="Log minor or major findings. Major findings block the Finalize & Baseline button until they are closed." />
          <InfoCard title="Signatures" description="Collect the three required signatures: Engineering Lead, Quality Manager, and Independent Reviewer. The system enforces Clean Hands eligibility for the Independent Reviewer role." />
        </div>
      </HelpSection>

      <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
        <h4 className="font-semibold text-sm flex items-center gap-2 mb-1">
          <AlertCircle className="h-4 w-4 text-destructive" />
          Independent Reviewer — "Clean Hands" Check
        </h4>
        <p className="text-sm text-muted-foreground">
          When signing as Independent Reviewer, the system automatically verifies you have not authored any object
          in the manifest. If you are flagged as ineligible, the Sign button will be disabled and you'll see the
          specific objects causing the conflict. Delegate the review to an uninvolved team member.
        </p>
      </div>

      <HelpSection title="Finalization Gate">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>The <strong>Finalize & Baseline</strong> button is disabled until:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>All major findings are closed</li>
            <li>Engineering Lead has signed</li>
            <li>Quality Manager has signed</li>
            <li>At least one Independent Reviewer has signed (with Clean Hands verified)</li>
            <li>No compliance gap blockers remain (unassessed hazards, missing risk controls)</li>
          </ul>
        </div>
      </HelpSection>

      <TipCard>
        Use the "By Discovery Type" toggle in Review Scope / Artifacts to quickly identify Risk Deltas and Compliance Gaps
        that require immediate attention during your review session.
      </TipCard>
    </div>
  );
};

// ============ GENERAL/DEFAULT ============
const GeneralHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <h3 className="font-semibold flex items-center gap-2 mb-2">
          <BookOpen className="h-5 w-5 text-primary" />
          {lang('help.content.general.welcome')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {lang('help.content.general.welcomeDescription')}
        </p>
      </div>

      <HelpSection title={lang('help.content.general.quickStart')}>
        <StepList steps={[
          lang('help.content.general.steps.step1'),
          lang('help.content.general.steps.step2'),
          lang('help.content.general.steps.step3'),
          lang('help.content.general.steps.step4'),
          lang('help.content.general.steps.step5'),
          lang('help.content.general.steps.step6'),
          lang('help.content.general.steps.step7')
        ]} />
      </HelpSection>

      <HelpSection title={lang('help.content.general.keySections')}>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 border rounded text-xs">
            <strong>{lang('help.content.general.businessCase.title')}</strong>
            <p className="text-muted-foreground">{lang('help.content.general.businessCase.description')}</p>
          </div>
          <div className="p-2 border rounded text-xs">
            <strong>{lang('help.content.general.deviceDef.title')}</strong>
            <p className="text-muted-foreground">{lang('help.content.general.deviceDef.description')}</p>
          </div>
          <div className="p-2 border rounded text-xs">
            <strong>{lang('help.content.general.udiMgmt.title')}</strong>
            <p className="text-muted-foreground">{lang('help.content.general.udiMgmt.description')}</p>
          </div>
          <div className="p-2 border rounded text-xs">
            <strong>{lang('help.content.general.docs.title')}</strong>
            <p className="text-muted-foreground">{lang('help.content.general.docs.description')}</p>
          </div>
        </div>
      </HelpSection>

      <TipCard>
        {lang('help.content.general.tip')}
      </TipCard>
    </div>
  );
};

// ============ EUDAMED REGISTRATION ============
const EudamedHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.eudamed.description')}
      </p>

      <HelpSection title={lang('help.content.eudamed.whatIs')}>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>{lang('help.content.eudamed.whatIsDescription')}</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>{lang('help.content.eudamed.features.deviceRegistration')}</li>
            <li>{lang('help.content.eudamed.features.operatorRegistration')}</li>
            <li>{lang('help.content.eudamed.features.certificateTracking')}</li>
            <li>{lang('help.content.eudamed.features.vigilance')}</li>
            <li>{lang('help.content.eudamed.features.clinicalInvestigation')}</li>
          </ul>
        </div>
      </HelpSection>

      <HelpSection title={lang('help.content.eudamed.deadlines')}>
        <div className="space-y-3">
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="font-medium text-sm">{lang('help.content.eudamed.mandatoryRegistration')}</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-2 ml-6">
              <li><strong>{lang('help.content.eudamed.timeline.may2021')}:</strong> {lang('help.content.eudamed.timeline.may2021Desc')}</li>
              <li><strong>{lang('help.content.eudamed.timeline.oct2021')}:</strong> {lang('help.content.eudamed.timeline.oct2021Desc')}</li>
              <li><strong>{lang('help.content.eudamed.timeline.nov2025')}:</strong> {lang('help.content.eudamed.timeline.nov2025Desc')}</li>
              <li className="text-destructive font-medium"><strong>{lang('help.content.eudamed.timeline.may2026')}:</strong> {lang('help.content.eudamed.timeline.may2026Desc')}</li>
              <li><strong>{lang('help.content.eudamed.timeline.nov2026')}:</strong> {lang('help.content.eudamed.timeline.nov2026Desc')}</li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground italic">
            {lang('help.content.eudamed.regulationNote')}
          </p>
        </div>
      </HelpSection>

      <HelpSection title={lang('help.content.eudamed.mdrDeadlines')}>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-2">
            {lang('help.content.eudamed.mdrDeadlinesDescription')}
          </p>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <ul className="text-xs text-muted-foreground space-y-2">
              <li><strong>{lang('help.content.eudamed.mdr.may2024')}:</strong> {lang('help.content.eudamed.mdr.may2024Desc')}</li>
              <li><strong>{lang('help.content.eudamed.mdr.dec2027')}:</strong> {lang('help.content.eudamed.mdr.dec2027Desc')}</li>
              <li><strong>{lang('help.content.eudamed.mdr.dec2028')}:</strong> {lang('help.content.eudamed.mdr.dec2028Desc')}</li>
            </ul>
          </div>
        </div>
      </HelpSection>

      <HelpSection title={lang('help.content.eudamed.immediateActions')}>
        <div className="space-y-3">
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm font-medium mb-2">{lang('help.content.eudamed.actNow')}</p>
            <ul className="text-xs text-muted-foreground space-y-2 ml-2">
              <li><strong>{lang('help.content.eudamed.actions.getSrn')}</strong> - {lang('help.content.eudamed.actions.getSrnDesc')}</li>
              <li><strong>{lang('help.content.eudamed.actions.assignUdi')}</strong> - {lang('help.content.eudamed.actions.assignUdiDesc')}</li>
              <li><strong>{lang('help.content.eudamed.actions.prepareData')}</strong> - {lang('help.content.eudamed.actions.prepareDataDesc')}</li>
            </ul>
          </div>
        </div>
      </HelpSection>

      <HelpSection title={lang('help.content.eudamed.actorRegistration')}>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {lang('help.content.eudamed.actorRegistrationDesc')}
          </p>
          <div className="space-y-2">
            <InfoCard
              title={lang('help.content.eudamed.euLogin.title')}
              description={lang('help.content.eudamed.euLogin.description')}
            />
            <InfoCard
              title={lang('help.content.eudamed.prrc.title')}
              description={lang('help.content.eudamed.prrc.description')}
            />
            <InfoCard
              title={lang('help.content.eudamed.legalEntity.title')}
              description={lang('help.content.eudamed.legalEntity.description')}
            />
            <InfoCard
              title={lang('help.content.eudamed.authRep.title')}
              description={lang('help.content.eudamed.authRep.description')}
            />
          </div>
          <p className="text-xs text-muted-foreground italic mt-2">
            {lang('help.content.eudamed.actorTimeline')}
          </p>
        </div>
      </HelpSection>

      <HelpSection title={lang('help.content.eudamed.registrationSteps')}>
        <StepList steps={[
          lang('help.content.eudamed.steps.step1'),
          lang('help.content.eudamed.steps.step2'),
          lang('help.content.eudamed.steps.step3'),
          lang('help.content.eudamed.steps.step4'),
          lang('help.content.eudamed.steps.step5'),
          lang('help.content.eudamed.steps.step6'),
          lang('help.content.eudamed.steps.step7'),
          lang('help.content.eudamed.steps.step8')
        ]} />
      </HelpSection>

      <HelpSection title={lang('help.content.eudamed.dataRequirements')}>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><strong>{lang('help.content.eudamed.mandatoryFields')}:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>{lang('help.content.eudamed.fields.deviceName')}</li>
            <li>{lang('help.content.eudamed.fields.udiCodes')}</li>
            <li>{lang('help.content.eudamed.fields.riskClass')}</li>
            <li>{lang('help.content.eudamed.fields.intendedPurpose')}</li>
            <li>{lang('help.content.eudamed.fields.manufacturer')}</li>
            <li>{lang('help.content.eudamed.fields.authRepInfo')}</li>
            <li>{lang('help.content.eudamed.fields.emdnCodes')}</li>
            <li>{lang('help.content.eudamed.fields.deviceAttributes')}</li>
          </ul>
        </div>
      </HelpSection>

      <HelpSection title={lang('help.content.eudamed.quickReference')}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-2 font-medium">{lang('help.content.eudamed.table.milestone')}</th>
                <th className="text-left py-2 pr-2 font-medium">{lang('help.content.eudamed.table.eudamedReg')}</th>
                <th className="text-left py-2 font-medium">{lang('help.content.eudamed.table.mdrCert')}</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/50">
                <td className="py-2 pr-2">{lang('help.content.eudamed.table.classIII')}</td>
                <td className="py-2 pr-2 text-destructive font-medium">{lang('help.content.eudamed.table.may2026')}</td>
                <td className="py-2">{lang('help.content.eudamed.table.dec2027')}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-2">{lang('help.content.eudamed.table.classIIbImplant')}</td>
                <td className="py-2 pr-2 text-destructive font-medium">{lang('help.content.eudamed.table.may2026')}</td>
                <td className="py-2">{lang('help.content.eudamed.table.dec2027')}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-2">{lang('help.content.eudamed.table.classIIbIIa')}</td>
                <td className="py-2 pr-2 text-destructive font-medium">{lang('help.content.eudamed.table.may2026')}</td>
                <td className="py-2">{lang('help.content.eudamed.table.dec2028')}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-2">{lang('help.content.eudamed.table.classISpecial')}</td>
                <td className="py-2 pr-2 text-destructive font-medium">{lang('help.content.eudamed.table.may2026')}</td>
                <td className="py-2">{lang('help.content.eudamed.table.dec2028')}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2">{lang('help.content.eudamed.table.legacy')}</td>
                <td className="py-2 pr-2">{lang('help.content.eudamed.table.nov2026')}</td>
                <td className="py-2">{lang('help.content.eudamed.table.perOriginal')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </HelpSection>

      <TipCard>
        {lang('help.content.eudamed.tip')}
      </TipCard>
    </div>
  );
};

// ============ COMPANY DASHBOARD ============
const CompanyDashboardHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.companyDashboard.description')}
      </p>

      <HelpSection title={lang('help.content.companyDashboard.overview')}>
        <div className="space-y-2">
          <InfoCard
            title={lang('help.content.companyDashboard.portfolioHealth.title')}
            description={lang('help.content.companyDashboard.portfolioHealth.description')}
          />
          <InfoCard
            title={lang('help.content.companyDashboard.qmsMetrics.title')}
            description={lang('help.content.companyDashboard.qmsMetrics.description')}
          />
          <InfoCard
            title={lang('help.content.companyDashboard.deadlines.title')}
            description={lang('help.content.companyDashboard.deadlines.description')}
          />
        </div>
      </HelpSection>

      <TipCard>
        {lang('help.content.companyDashboard.tip')}
      </TipCard>
    </div>
  );
};

// ============ COMPANY MILESTONES ============
const CompanyMilestonesHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.companyMilestones.description')}
      </p>

      <HelpSection title={lang('help.content.companyMilestones.categories')}>
        <div className="space-y-2">
          <InfoCard
            title={lang('help.content.companyMilestones.productMilestones.title')}
            description={lang('help.content.companyMilestones.productMilestones.description')}
          />
          <InfoCard
            title={lang('help.content.companyMilestones.companyMilestones.title')}
            description={lang('help.content.companyMilestones.companyMilestones.description')}
          />
          <InfoCard
            title={lang('help.content.companyMilestones.regulatoryDeadlines.title')}
            description={lang('help.content.companyMilestones.regulatoryDeadlines.description')}
          />
        </div>
      </HelpSection>

      <HelpSection title={lang('help.content.companyMilestones.timelineManagement')}>
        <StepList steps={[
          lang('help.content.companyMilestones.timelineSteps.step1'),
          lang('help.content.companyMilestones.timelineSteps.step2'),
          lang('help.content.companyMilestones.timelineSteps.step3'),
          lang('help.content.companyMilestones.timelineSteps.step4')
        ]} />
      </HelpSection>

      <TipCard>
        {lang('help.content.companyMilestones.tip')}
      </TipCard>
    </div>
  );
};

// ============ COMPANY DOCUMENTS ============
const CompanyDocumentsHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.companyDocuments.description')}
      </p>

      <HelpSection title={lang('help.content.companyDocuments.documentTypes')}>
        <div className="space-y-2">
          <InfoCard
            title={lang('help.content.companyDocuments.sops.title')}
            description={lang('help.content.companyDocuments.sops.description')}
          />
          <InfoCard
            title={lang('help.content.companyDocuments.policies.title')}
            description={lang('help.content.companyDocuments.policies.description')}
          />
          <InfoCard
            title={lang('help.content.companyDocuments.templates.title')}
            description={lang('help.content.companyDocuments.templates.description')}
          />
          <InfoCard
            title={lang('help.content.companyDocuments.records.title')}
            description={lang('help.content.companyDocuments.records.description')}
          />
        </div>
      </HelpSection>

      <HelpSection title={lang('help.content.companyDocuments.documentControl')}>
        <StepList steps={[
          lang('help.content.companyDocuments.controlSteps.step1'),
          lang('help.content.companyDocuments.controlSteps.step2'),
          lang('help.content.companyDocuments.controlSteps.step3'),
          lang('help.content.companyDocuments.controlSteps.step4'),
          lang('help.content.companyDocuments.controlSteps.step5')
        ]} />
      </HelpSection>

      <TipCard>
        {lang('help.content.companyDocuments.tip')}
      </TipCard>
    </div>
  );
};

// ============ COMPANY AUDITS ============
const CompanyAuditsHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.companyAudits.description')}
      </p>

      <HelpSection title={lang('help.content.companyAudits.auditTypes')}>
        <div className="space-y-2">
          <InfoCard
            title={lang('help.content.companyAudits.internal.title')}
            description={lang('help.content.companyAudits.internal.description')}
          />
          <InfoCard
            title={lang('help.content.companyAudits.supplier.title')}
            description={lang('help.content.companyAudits.supplier.description')}
          />
          <InfoCard
            title={lang('help.content.companyAudits.notifiedBody.title')}
            description={lang('help.content.companyAudits.notifiedBody.description')}
          />
          <InfoCard
            title={lang('help.content.companyAudits.regulatory.title')}
            description={lang('help.content.companyAudits.regulatory.description')}
          />
        </div>
      </HelpSection>

      <HelpSection title={lang('help.content.companyAudits.workflow')}>
        <StepList steps={[
          lang('help.content.companyAudits.workflowSteps.step1'),
          lang('help.content.companyAudits.workflowSteps.step2'),
          lang('help.content.companyAudits.workflowSteps.step3'),
          lang('help.content.companyAudits.workflowSteps.step4'),
          lang('help.content.companyAudits.workflowSteps.step5'),
          lang('help.content.companyAudits.workflowSteps.step6')
        ]} />
      </HelpSection>

      <TipCard>
        {lang('help.content.companyAudits.tip')}
      </TipCard>
    </div>
  );
};

// ============ COMPANY TRAINING ============
const CompanyTrainingHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.companyTraining.description')}
      </p>

      <HelpSection title={lang('help.content.companyTraining.trainingSystem')}>
        <div className="space-y-2">
          <InfoCard
            title={lang('help.content.companyTraining.modules.title')}
            description={lang('help.content.companyTraining.modules.description')}
          />
          <InfoCard
            title={lang('help.content.companyTraining.roleBased.title')}
            description={lang('help.content.companyTraining.roleBased.description')}
          />
          <InfoCard
            title={lang('help.content.companyTraining.competency.title')}
            description={lang('help.content.companyTraining.competency.description')}
          />
        </div>
      </HelpSection>

      <HelpSection title={lang('help.content.companyTraining.keyFeatures')}>
        <StepList steps={[
          lang('help.content.companyTraining.features.step1'),
          lang('help.content.companyTraining.features.step2'),
          lang('help.content.companyTraining.features.step3'),
          lang('help.content.companyTraining.features.step4'),
          lang('help.content.companyTraining.features.step5')
        ]} />
      </HelpSection>

      <TipCard>
        {lang('help.content.companyTraining.tip')}
      </TipCard>
    </div>
  );
};

// ============ COMPANY SUPPLIERS ============
const CompanySuppliersHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.companySuppliers.description')}
      </p>

      <HelpSection title={lang('help.content.companySuppliers.controls')}>
        <div className="space-y-2">
          <InfoCard
            title={lang('help.content.companySuppliers.qualification.title')}
            description={lang('help.content.companySuppliers.qualification.description')}
          />
          <InfoCard
            title={lang('help.content.companySuppliers.approvedList.title')}
            description={lang('help.content.companySuppliers.approvedList.description')}
          />
          <InfoCard
            title={lang('help.content.companySuppliers.performance.title')}
            description={lang('help.content.companySuppliers.performance.description')}
          />
          <InfoCard
            title={lang('help.content.companySuppliers.risk.title')}
            description={lang('help.content.companySuppliers.risk.description')}
          />
        </div>
      </HelpSection>

      <TipCard>
        {lang('help.content.companySuppliers.tip')}
      </TipCard>
    </div>
  );
};

// ============ COMPANY PMS ============
const CompanyPMSHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.companyPMS.description')}
      </p>

      <HelpSection title={lang('help.content.companyPMS.activities')}>
        <div className="space-y-2">
          <InfoCard
            title={lang('help.content.companyPMS.complaints.title')}
            description={lang('help.content.companyPMS.complaints.description')}
          />
          <InfoCard
            title={lang('help.content.companyPMS.vigilance.title')}
            description={lang('help.content.companyPMS.vigilance.description')}
          />
          <InfoCard
            title={lang('help.content.companyPMS.psur.title')}
            description={lang('help.content.companyPMS.psur.description')}
          />
          <InfoCard
            title={lang('help.content.companyPMS.pmcf.title')}
            description={lang('help.content.companyPMS.pmcf.description')}
          />
        </div>
      </HelpSection>

      <HelpSection title={lang('help.content.companyPMS.mdrRequirements')}>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><strong>{lang('help.content.companyPMS.psurFrequency')}:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>{lang('help.content.companyPMS.classIII')}</li>
            <li>{lang('help.content.companyPMS.classII')}</li>
            <li>{lang('help.content.companyPMS.classI')}</li>
          </ul>
        </div>
      </HelpSection>

      <TipCard>
        {lang('help.content.companyPMS.tip')}
      </TipCard>
    </div>
  );
};

// ============ COMPANY PORTFOLIO ============
const CompanyPortfolioHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.companyPortfolio.description')}
      </p>

      <HelpSection title={lang('help.content.companyPortfolio.views')}>
        <div className="space-y-2">
          <InfoCard
            title={lang('help.content.companyPortfolio.pipeline.title')}
            description={lang('help.content.companyPortfolio.pipeline.description')}
          />
          <InfoCard
            title={lang('help.content.companyPortfolio.market.title')}
            description={lang('help.content.companyPortfolio.market.description')}
          />
          <InfoCard
            title={lang('help.content.companyPortfolio.financial.title')}
            description={lang('help.content.companyPortfolio.financial.description')}
          />
        </div>
      </HelpSection>

      <TipCard>
        {lang('help.content.companyPortfolio.tip')}
      </TipCard>
    </div>
  );
};

// Registry mapping topic keys to components
// ============ RISK MANAGEMENT ============
const RiskManagementHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.riskManagement.description')}
      </p>

      <HelpSection title={lang('help.content.riskManagement.isoProcess')}>
        <div className="space-y-3">
          <InfoCard
            title={lang('help.content.riskManagement.hazardId.title')}
            description={lang('help.content.riskManagement.hazardId.description')}
          />
          <InfoCard
            title={lang('help.content.riskManagement.riskEstimation.title')}
            description={lang('help.content.riskManagement.riskEstimation.description')}
          />
          <InfoCard
            title={lang('help.content.riskManagement.riskEvaluation.title')}
            description={lang('help.content.riskManagement.riskEvaluation.description')}
          />
          <InfoCard
            title={lang('help.content.riskManagement.riskControl.title')}
            description={lang('help.content.riskManagement.riskControl.description')}
          />
          <InfoCard
            title={lang('help.content.riskManagement.residualRisk.title')}
            description={lang('help.content.riskManagement.residualRisk.description')}
          />
        </div>
      </HelpSection>

      <HelpSection title={lang('help.content.riskManagement.matrixCategories')}>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><strong className="text-red-600">{lang('help.content.riskManagement.unacceptable')}:</strong> {lang('help.content.riskManagement.unacceptableDesc')}</p>
          <p><strong className="text-amber-600">{lang('help.content.riskManagement.alarp')}:</strong> {lang('help.content.riskManagement.alarpDesc')}</p>
          <p><strong className="text-green-600">{lang('help.content.riskManagement.acceptable')}:</strong> {lang('help.content.riskManagement.acceptableDesc')}</p>
        </div>
      </HelpSection>

      <HelpSection title={lang('help.content.riskManagement.investorRelevance')}>
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong className="text-indigo-600">{lang('help.content.riskManagement.whyInvestorsCare')}:</strong> {lang('help.content.riskManagement.investorDescription')}
          </p>
        </div>
      </HelpSection>

      <TipCard>
        {lang('help.content.riskManagement.tip')}
      </TipCard>
    </div>
  );
};

// ============ TARGET MARKETS ============
const TargetMarketsHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
  <div className="space-y-6">
    <p className="text-muted-foreground">
      {lang('help.contextual.targetMarkets.description')}
    </p>
    <HelpSection title={lang('help.contextual.targetMarkets.keyMarkets.title')}>
      <div className="space-y-2">
        <InfoCard title={lang('help.contextual.targetMarkets.keyMarkets.euMdr.title')} description={lang('help.contextual.targetMarkets.keyMarkets.euMdr.description')} />
        <InfoCard title={lang('help.contextual.targetMarkets.keyMarkets.fda.title')} description={lang('help.contextual.targetMarkets.keyMarkets.fda.description')} />
        <InfoCard title={lang('help.contextual.targetMarkets.keyMarkets.ukca.title')} description={lang('help.contextual.targetMarkets.keyMarkets.ukca.description')} />
      </div>
    </HelpSection>
    <TipCard>{lang('help.contextual.targetMarkets.tip')}</TipCard>
  </div>
  );
};

// ============ ECONOMIC BUYER ============
const EconomicBuyerHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
  <div className="space-y-6">
    <p className="text-muted-foreground">
      {lang('help.contextual.economicBuyer.description')}
    </p>
    <HelpSection title={lang('help.contextual.economicBuyer.keyQuestions.title')}>
      <div className="space-y-2">
        <InfoCard title={lang('help.contextual.economicBuyer.keyQuestions.budget.title')} description={lang('help.contextual.economicBuyer.keyQuestions.budget.description')} />
        <InfoCard title={lang('help.contextual.economicBuyer.keyQuestions.procurement.title')} description={lang('help.contextual.economicBuyer.keyQuestions.procurement.description')} />
        <InfoCard title={lang('help.contextual.economicBuyer.keyQuestions.budgetCycle.title')} description={lang('help.contextual.economicBuyer.keyQuestions.budgetCycle.description')} />
      </div>
    </HelpSection>
    <TipCard>{lang('help.contextual.economicBuyer.tip')}</TipCard>
  </div>
  );
};

// ============ USER PROFILE ============
const UserProfileHelp: React.FC = () => {
  const { lang } = useTranslation();
  return (
  <div className="space-y-6">
    <p className="text-muted-foreground">
      {lang('help.contextual.userProfile.description')}
    </p>
    <HelpSection title={lang('help.contextual.userProfile.elements.title')}>
      <div className="space-y-2">
        <InfoCard title={lang('help.contextual.userProfile.elements.patient.title')} description={lang('help.contextual.userProfile.elements.patient.description')} />
        <InfoCard title={lang('help.contextual.userProfile.elements.operators.title')} description={lang('help.contextual.userProfile.elements.operators.description')} />
        <InfoCard title={lang('help.contextual.userProfile.elements.environment.title')} description={lang('help.contextual.userProfile.elements.environment.description')} />
        <InfoCard title={lang('help.contextual.userProfile.elements.duration.title')} description={lang('help.contextual.userProfile.elements.duration.description')} />
      </div>
    </HelpSection>
    <TipCard>{lang('help.contextual.userProfile.tip')}</TipCard>
  </div>
  );
};

// ============ VALUE PROPOSITION ============
const ValuePropositionHelp: React.FC = () => {
  const { lang } = useTranslation();
  const k = 'help.contextual.valueProposition';
  return (
  <div className="space-y-6">
    <p className="text-muted-foreground">{lang(`${k}.description`)}</p>
    <HelpSection title={lang(`${k}.framework.title`)}>
      <div className="space-y-2">
        <InfoCard title={lang(`${k}.framework.clinical.title`)} description={lang(`${k}.framework.clinical.description`)} />
        <InfoCard title={lang(`${k}.framework.economic.title`)} description={lang(`${k}.framework.economic.description`)} />
        <InfoCard title={lang(`${k}.framework.operational.title`)} description={lang(`${k}.framework.operational.description`)} />
      </div>
    </HelpSection>
    <TipCard>{lang(`${k}.tip`)}</TipCard>
  </div>
  );
};

// ============ IP STRATEGY ============
const IPStrategyHelp: React.FC = () => {
  const { lang } = useTranslation();
  const k = 'help.contextual.ipStrategy';
  return (
  <div className="space-y-6">
    <p className="text-muted-foreground">{lang(`${k}.description`)}</p>
    <HelpSection title={lang(`${k}.proprietaryIp.title`)}>
      <div className="space-y-2">
        <InfoCard title={lang(`${k}.proprietaryIp.patents.title`)} description={lang(`${k}.proprietaryIp.patents.description`)} />
        <InfoCard title={lang(`${k}.proprietaryIp.tradeSecrets.title`)} description={lang(`${k}.proprietaryIp.tradeSecrets.description`)} />
        <InfoCard title={lang(`${k}.proprietaryIp.trademarks.title`)} description={lang(`${k}.proprietaryIp.trademarks.description`)} />
        <InfoCard title={lang(`${k}.proprietaryIp.designRights.title`)} description={lang(`${k}.proprietaryIp.designRights.description`)} />
        <InfoCard title={lang(`${k}.proprietaryIp.copyrights.title`)} description={lang(`${k}.proprietaryIp.copyrights.description`)} />
      </div>
    </HelpSection>
    <HelpSection title={lang(`${k}.fto.title`)}>
      <p className="text-sm text-muted-foreground mb-3">{lang(`${k}.fto.description`)}</p>
      <div className="space-y-2">
        <InfoCard title={lang(`${k}.fto.certainty.title`)} description={lang(`${k}.fto.certainty.description`)} />
        <InfoCard title={lang(`${k}.fto.status.title`)} description={lang(`${k}.fto.status.description`)} />
        <InfoCard title={lang(`${k}.fto.mitigation.title`)} description={lang(`${k}.fto.mitigation.description`)} />
      </div>
    </HelpSection>
    <HelpSection title={lang(`${k}.ownership.title`)}>
      <p className="text-sm text-muted-foreground">{lang(`${k}.ownership.description`)}</p>
    </HelpSection>
    <WarningCard>{lang(`${k}.warning`)}</WarningCard>
    <TipCard>{lang(`${k}.tip`)}</TipCard>
  </div>
  );
};

// ============ USE OF PROCEEDS ============
const UseOfProceedsHelp: React.FC = () => {
  const { lang } = useTranslation();
  const k = 'help.contextual.useOfProceeds';
  return (
  <div className="space-y-6">
    <p className="text-muted-foreground">{lang(`${k}.description`)}</p>
    <HelpSection title={lang(`${k}.categories.title`)}>
      <div className="space-y-2">
        <InfoCard title={lang(`${k}.categories.rd.title`)} description={lang(`${k}.categories.rd.description`)} />
        <InfoCard title={lang(`${k}.categories.regulatory.title`)} description={lang(`${k}.categories.regulatory.description`)} />
        <InfoCard title={lang(`${k}.categories.operations.title`)} description={lang(`${k}.categories.operations.description`)} />
        <InfoCard title={lang(`${k}.categories.commercial.title`)} description={lang(`${k}.categories.commercial.description`)} />
      </div>
    </HelpSection>
    <TipCard>{lang(`${k}.tip`)}</TipCard>
  </div>
  );
};

// ============ GTM STRATEGY ============
const GTMStrategyHelp: React.FC = () => {
  const { lang } = useTranslation();
  const k = 'help.contextual.gtmStrategy';
  return (
  <div className="space-y-6">
    <p className="text-muted-foreground">{lang(`${k}.description`)}</p>
    <HelpSection title={lang(`${k}.components.title`)}>
      <div className="space-y-2">
        <InfoCard title={lang(`${k}.components.sales.title`)} description={lang(`${k}.components.sales.description`)} />
        <InfoCard title={lang(`${k}.components.pricing.title`)} description={lang(`${k}.components.pricing.description`)} />
        <InfoCard title={lang(`${k}.components.launch.title`)} description={lang(`${k}.components.launch.description`)} />
        <InfoCard title={lang(`${k}.components.acquisition.title`)} description={lang(`${k}.components.acquisition.description`)} />
      </div>
    </HelpSection>
    <TipCard>{lang(`${k}.tip`)}</TipCard>
  </div>
  );
};

// ============ MANUFACTURING ============
const ManufacturingHelp: React.FC = () => {
  const { lang } = useTranslation();
  const k = 'help.contextual.manufacturing';
  return (
  <div className="space-y-6">
    <p className="text-muted-foreground">{lang(`${k}.description`)}</p>
    <HelpSection title={lang(`${k}.decisions.title`)}>
      <div className="space-y-2">
        <InfoCard title={lang(`${k}.decisions.makeVsBuy.title`)} description={lang(`${k}.decisions.makeVsBuy.description`)} />
        <InfoCard title={lang(`${k}.decisions.supplier.title`)} description={lang(`${k}.decisions.supplier.description`)} />
        <InfoCard title={lang(`${k}.decisions.quality.title`)} description={lang(`${k}.decisions.quality.description`)} />
        <InfoCard title={lang(`${k}.decisions.scaleUp.title`)} description={lang(`${k}.decisions.scaleUp.description`)} />
      </div>
    </HelpSection>
    <TipCard>{lang(`${k}.tip`)}</TipCard>
  </div>
  );
};

// ============ EXIT STRATEGY ============
const ExitStrategyHelp: React.FC = () => {
  const { lang } = useTranslation();
  const k = 'help.contextual.exitStrategy';
  return (
  <div className="space-y-6">
    <p className="text-muted-foreground">{lang(`${k}.description`)}</p>
    <HelpSection title={lang(`${k}.components.title`)}>
      <div className="space-y-2">
        <InfoCard title={lang(`${k}.components.acquirers.title`)} description={lang(`${k}.components.acquirers.description`)} />
        <InfoCard title={lang(`${k}.components.comparables.title`)} description={lang(`${k}.components.comparables.description`)} />
        <InfoCard title={lang(`${k}.components.valueDrivers.title`)} description={lang(`${k}.components.valueDrivers.description`)} />
        <InfoCard title={lang(`${k}.components.timeline.title`)} description={lang(`${k}.components.timeline.description`)} />
      </div>
    </HelpSection>
    <TipCard>{lang(`${k}.tip`)}</TipCard>
  </div>
  );
};

// ============ TECHNICAL FILE ============
const TechnicalFileHelp: React.FC = () => (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">
      The Technical File is your auditor-ready dossier structured per MDR Annex II and III. It contains all documentation proving your device meets EU MDR requirements.
    </p>

    <HelpSection title="Structure Overview">
      <div className="space-y-2">
        <InfoCard
          title="TF-0: Administrative"
          description="EU Declaration of Conformity, Notified Body certificates, Basic UDI-DI registration, economic operator details, and PRRC designation."
        />
        <InfoCard
          title="TF-1 to TF-6: Technical Documentation (Annex II)"
          description="Device description, labelling/IFU, design & manufacturing, GSPRs, risk management, and verification & validation evidence."
        />
        <InfoCard
          title="TF-7 to TF-9: Supporting Evidence"
          description="Risk management file (ISO 14971), clinical evaluation (Annex XIV), and post-market surveillance (Annex III)."
        />
      </div>
    </HelpSection>

    <HelpSection title="Auditor Expectations">
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>• <strong>Traceability:</strong> Every GSPR must link to supporting evidence (test reports, clinical data, risk analysis).</p>
        <p>• <strong>Completeness:</strong> All sections must be addressed — even if "not applicable", provide justification.</p>
        <p>• <strong>Currency:</strong> Documents must reflect the current device design. Outdated evidence is a common finding.</p>
        <p>• <strong>Cross-referencing:</strong> Gap Analysis completion feeds into compliance badges on each section.</p>
      </div>
    </HelpSection>

    <HelpSection title="Tips for Success">
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>• Start with TF-1 (Device Description) — it drives classification, clinical evaluation scope, and risk analysis.</p>
        <p>• Complete the GSPR checklist (TF-4) early — it reveals which supporting evidence you need.</p>
        <p>• Link documents as you create them — don't leave document linking to the end.</p>
        <p>• Use the Gap Analysis module to track clause-level compliance per section.</p>
      </div>
    </HelpSection>

    <TipCard>
      Click any section to open its step-by-step workflow. Each sub-step shows the regulatory requirement, guidance, and a dedicated area to link supporting documents.
    </TipCard>

    <HelpSection title="Key MDR References">
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>• <strong>MDR Annex II:</strong> Technical documentation structure (§1–§6)</p>
        <p>• <strong>MDR Annex III:</strong> Post-market surveillance documentation</p>
        <p>• <strong>MDR Annex XIV:</strong> Clinical evaluation and PMCF</p>
        <p>• <strong>MDR Art. 10:</strong> General obligations of manufacturers</p>
        <p>• <strong>MDR Art. 15:</strong> Person Responsible for Regulatory Compliance (PRRC)</p>
        <p>• <strong>MDR Art. 19:</strong> EU Declaration of Conformity</p>
      </div>
    </HelpSection>
  </div>
);

export interface HelpContentProps {
  targetMarkets?: string[];
  onNavigateToDetail?: (detailId: string) => void;
}

export const helpContentRegistry: Record<string, React.FC<HelpContentProps>> = {
  'genesis-overview': GenesisOverviewHelp,
  'viability-scorecard': ViabilityScoreCardHelp,
  'venture-blueprint': VentureBlueprintHelp,
  'business-canvas': BusinessCanvasHelp,
  'team-profile': TeamProfileHelp,
  'market-sizing': MarketSizingHelp,
  'competition': CompetitionHelp,
  'reimbursement': ReimbursementHelp,
  'clinical-trials': ClinicalTrialsHelp,
  'readiness-gates': ReadinessGatesHelp,
  'udi-management': UDIManagementHelp,
  'eudamed': EudamedHelp,
  'milestones': DynamicMilestonesHelp,
  'documents': DocumentsHelp,
  'regulatory': RegulatoryHelp,
  'device-definition': DeviceDefinitionHelp,
  // Device Information tab-specific help
  'device-overview': DeviceOverviewHelp,
  'device-purpose': DevicePurposeHelp,
  'device-general': DeviceGeneralHelp,
  'device-general-deviceid': DeviceGeneralDeviceIdHelp,
  'device-general-classification': DeviceGeneralClassificationHelp,
  'device-general-techspecs': DeviceGeneralTechSpecsHelp,
  'device-general-definition': DeviceGeneralDefinitionHelp,
  'device-general-media': DeviceGeneralMediaHelp,
  'device-general-storage': DeviceGeneralStorageHelp,
  'device-general-variants': DeviceGeneralVariantsHelp,
  'device-markets': DeviceMarketsHelp,
  'device-bundles': DeviceBundlesHelp,
  'device-auditlog': DeviceAuditLogHelp,
  'qms': QMSHelp,
  'company-settings': CompanySettingsHelp,
  // Company-level help
  'company-dashboard': CompanyDashboardHelp,
  'company-milestones': CompanyMilestonesHelp,
  'company-documents': CompanyDocumentsHelp,
  'company-audits': CompanyAuditsHelp,
  'company-training': CompanyTrainingHelp,
  'company-suppliers': CompanySuppliersHelp,
  'company-pms': CompanyPMSHelp,
  'company-portfolio': CompanyPortfolioHelp,
  'risk-management': RiskManagementHelp,
  'requirements-specifications': RequirementsHelp,
  'usability-engineering': UsabilityEngineeringHelp,
  'system-architecture': SystemArchitectureHelp,
  'verification-validation': VerificationValidationHelp,
  'qmsr-rationale': QMSRRationaleHelp,
  'ai-assurance-lab': AIAssuranceLabHelp,
  // Genesis-specific help
  'target-markets': TargetMarketsHelp,
  'economic-buyer': EconomicBuyerHelp,
  'user-profile': UserProfileHelp,
  'value-proposition': ValuePropositionHelp,
  'ip-strategy': IPStrategyHelp,
  'use-of-proceeds': UseOfProceedsHelp,
  'gtm-strategy': GTMStrategyHelp,
  'manufacturing': ManufacturingHelp,
  'exit-strategy': ExitStrategyHelp,
  'general': GeneralHelp,
  'design-review': DesignReviewHelp,
  'design-review-detail': DesignReviewDetailHelp,
  // QMS Architecture help
  'qms-foundation': QMSFoundationHelp,
  'device-process-engine': DeviceProcessEngineHelp,
  'qms-architecture': QMSArchitectureHelp,
  // Portfolio Health help
  'portfolio-overview': PortfolioOverviewHelp,
  'project-health-metrics': ProjectHealthMetricsHelp,
  'operational-health': OperationalHealthHelp,
   'advanced-financial': AdvancedFinancialHelp,
  'xyreg-architecture': XyregArchitectureHelp,
  'mission-control': MissionControlHelp,
  // Enterprise module help
  'company-nc-trends': NCTrendsHelp,
  'company-capa-trends': CAPATrendsHelp,
  'company-change-control': GlobalChangeControlHelp,
  'company-management-review': ManagementReviewHelp,
  'company-design-review': EnterpriseDesignReviewHelp,
  'company-infrastructure': InfrastructureHelp,
  'company-calibration': CalibrationScheduleHelp,
  'company-competency-matrix': CompetencyMatrixHelp,
  'company-gap-analysis': QMSGapAnalysisHelp,
  'company-activities': ComplianceActivitiesHelp,
  'company-quality-manual': GlobalQualityManualHelp,
  'company-ip-management': IPManagementHelp,
  'company-audit-log': AuditLogHelp,
  'company-commercial-landing': CommercialIntelligenceHelp,
  'company-strategic-blueprint': StrategicBlueprintHelp,
  'company-market-analysis': EnterpriseMarketAnalysisHelp,
  'company-commercial-performance': CommercialPerformanceHelp,
  'company-pricing-strategy': EnterprisePricingStrategyHelp,
  'company-market-access': GlobalMarketAccessHelp,
  // Gap Analysis contextual help
  'gap-analysis-detail': GapAnalysisContextualHelp,
  // Technical File help
  'technical-file': TechnicalFileHelp,
  // EHDS Data Vault help
  'ehds-data-vault': EHDSDataVaultHelp,
  'ehds-datasets': EHDSDatasetsHelp,
  'ehds-translation': EHDSTranslationHelp,
  'ehds-secondary-use': EHDSSecondaryUseHelp,
  'ehds-anonymization': EHDSAnonymizationHelp,
  'ehds-self-declaration': EHDSSelfDeclarationHelp,
  // Product page help
  'bom': BOMHelp,
  'gantt-chart': GanttChartHelp,
  'essential-gates': EssentialGatesHelp,
  'investor-share': InvestorShareHelp,
  'npv-analysis': NPVAnalysisHelp,
  'compliance-instances': ComplianceInstancesHelp,
  'product-definition-page': ProductDefinitionPageHelp,
  'product-audit-log': ProductAuditLogHelp,
  // Company page help
  'company-permissions': CompanyPermissionsHelp,
  'company-products': CompanyProductsHelp,
  'company-portfolio-landing': CompanyPortfolioLandingHelp,
  'company-budget': CompanyBudgetHelp,
  'company-user-product-matrix': CompanyUserProductMatrixHelp,
  'company-basic-udi': CompanyBasicUDIHelp,
  'company-role-access': CompanyRoleAccessHelp,
  'company-reviewer-analytics': CompanyReviewerAnalyticsHelp,
  'company-platforms': CompanyPlatformsHelp,
  'company-marketplace': CompanyMarketplaceHelp,
};

export function getHelpContent(topicKey: string): React.FC<HelpContentProps> {
  return helpContentRegistry[topicKey] || GeneralHelp;
}
