import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Building2, 
  Cpu, 
  Layers,
  ArrowRight,
  CheckCircle2,
  Info,
  AlertCircle,
  Lightbulb,
  Shield,
  ClipboardList,
  Users,
  Package,
  Target,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Reusable components
const HelpSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-3">
    <h4 className="font-semibold text-base flex items-center gap-2 text-foreground">
      {title}
    </h4>
    {children}
  </div>
);

const TipCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex gap-2">
    <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
    <p className="text-sm text-muted-foreground">{children}</p>
  </div>
);

const InfoCard: React.FC<{ title: string; description: string; icon?: React.ReactNode }> = ({ title, description, icon }) => (
  <div className="p-3 bg-muted/50 rounded-lg border">
    <div className="flex items-start gap-2">
      {icon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
      <div>
        <h5 className="font-medium text-sm mb-1">{title}</h5>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  </div>
);

const RungCard: React.FC<{
  rungNumber: number;
  name: string;
  regNode: string;
  engNode: string;
  busNode: string;
  level: 'company' | 'device';
  rungLabel?: string;
  companyLabel?: string;
  deviceLabel?: string;
}> = ({ rungNumber, name, regNode, engNode, busNode, level, rungLabel = 'Rung', companyLabel = 'Company', deviceLabel = 'Device' }) => (
  <div className={`p-4 rounded-lg border ${level === 'company' ? 'bg-slate-50 dark:bg-slate-900/50' : 'bg-background'}`}>
    <div className="flex items-center gap-2 mb-3">
      <Badge variant={level === 'company' ? 'secondary' : 'default'} className="text-xs">
        {rungLabel} {rungNumber}
      </Badge>
      <span className="font-medium text-sm">{name}</span>
      <Badge variant="outline" className="text-xs ml-auto">
        {level === 'company' ? companyLabel : deviceLabel}
      </Badge>
    </div>
    <div className="grid grid-cols-3 gap-2 text-xs">
      <div className="p-2 rounded bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
        <span className="font-medium text-purple-700 dark:text-purple-300">REG</span>
        <p className="text-purple-600 dark:text-purple-400 mt-1">{regNode}</p>
      </div>
      <div className="p-2 rounded bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
        <span className="font-medium text-cyan-700 dark:text-cyan-300">ENG</span>
        <p className="text-cyan-600 dark:text-cyan-400 mt-1">{engNode}</p>
      </div>
      <div className="p-2 rounded bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
        <span className="font-medium text-orange-700 dark:text-orange-300">BUS</span>
        <p className="text-orange-600 dark:text-orange-400 mt-1">{busNode}</p>
      </div>
    </div>
  </div>
);

const PhaseToRungMapping: React.FC<{ lang: (key: string) => string }> = ({ lang }) => {
  const k = 'qmsArchitectureHelp.phaseMapping';
  return (
  <div className="space-y-2">
    <div className="grid grid-cols-2 gap-2 text-sm">
      <div className="p-2 rounded bg-muted/50 border">
        <span className="font-medium">{lang(`${k}.phase12`)}:</span> {lang(`${k}.phase12Desc`)}
        <ArrowRight className="inline h-3 w-3 mx-1" />
        <Badge variant="outline" className="text-xs">{lang(`${k}.rung2`)}</Badge>
      </div>
      <div className="p-2 rounded bg-muted/50 border">
        <span className="font-medium">{lang(`${k}.phase3`)}:</span> {lang(`${k}.phase3Desc`)}
        <ArrowRight className="inline h-3 w-3 mx-1" />
        <Badge variant="outline" className="text-xs">{lang(`${k}.rung3`)}</Badge>
      </div>
      <div className="p-2 rounded bg-muted/50 border">
        <span className="font-medium">{lang(`${k}.phase45`)}:</span> {lang(`${k}.phase45Desc`)}
        <ArrowRight className="inline h-3 w-3 mx-1" />
        <Badge variant="outline" className="text-xs">{lang(`${k}.rung4`)}</Badge>
      </div>
      <div className="p-2 rounded bg-muted/50 border">
        <span className="font-medium">{lang(`${k}.phase6`)}:</span> {lang(`${k}.phase6Desc`)}
        <ArrowRight className="inline h-3 w-3 mx-1" />
        <Badge variant="outline" className="text-xs">{lang(`${k}.rung5`)}</Badge>
      </div>
    </div>
  </div>
  );
};

// ============ QMS FOUNDATION HELP ============
interface HelpContentProps {
  targetMarkets?: string[];
  onNavigateToDetail?: (detailId: string) => void;
}

export const QMSFoundationHelp: React.FC<HelpContentProps> = ({ onNavigateToDetail }) => {
  const { lang } = useTranslation();
  const k = 'qmsArchitectureHelp.foundation';
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 rounded-lg border">
        <Building2 className="h-6 w-6 text-primary flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-lg mb-1">{lang(`${k}.title`)}</h3>
          <p className="text-sm text-muted-foreground">
            {lang(`${k}.description`)}
          </p>
        </div>
      </div>

      {/* How to Read the Map */}
      <HelpSection title={lang(`${k}.readingMap.title`)}>
        <p className="text-sm text-muted-foreground mb-3">
          {lang(`${k}.readingMap.description`)}
        </p>

        {/* Status Colors */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{lang(`${k}.statusColors.label`)}</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border">
              <div className="h-6 w-6 rounded-full bg-slate-400 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
              <div>
                <p className="text-xs font-medium">{lang(`${k}.statusColors.dormant`)}</p>
                <p className="text-[10px] text-muted-foreground">{lang(`${k}.statusColors.dormantDesc`)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300">{lang(`${k}.statusColors.active`)}</p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400">{lang(`${k}.statusColors.activeDesc`)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="h-3 w-3 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{lang(`${k}.statusColors.validated`)}</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">{lang(`${k}.statusColors.validatedDesc`)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center">
                <AlertCircle className="h-3 w-3 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-red-700 dark:text-red-300">{lang(`${k}.statusColors.critical`)}</p>
                <p className="text-[10px] text-red-600 dark:text-red-400">{lang(`${k}.statusColors.criticalDesc`)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Lines */}
        <div className="space-y-2 mt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{lang(`${k}.connectionLines.label`)}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-3 p-2 rounded bg-muted/30">
              <div className="w-10 h-1 bg-amber-500 rounded" />
              <span className="text-xs">{lang(`${k}.connectionLines.amber`)}</span>
            </div>
            <div className="flex items-center gap-3 p-2 rounded bg-muted/30">
              <div className="w-10 h-1 bg-slate-400 rounded" />
              <span className="text-xs">{lang(`${k}.connectionLines.grey`)}</span>
            </div>
            <div className="flex items-center gap-3 p-2 rounded bg-muted/30">
              <div className="w-10 h-1 rounded" style={{ background: 'repeating-linear-gradient(90deg, hsl(280,60%,50%) 0px, hsl(280,60%,50%) 2px, transparent 2px, transparent 4px)' }} />
              <span className="text-xs">{lang(`${k}.connectionLines.purple`)}</span>
            </div>
          </div>
        </div>
      </HelpSection>

      <HelpSection title={lang(`${k}.twoFoundationRungs.title`)}>
        <div className="space-y-4">
          <RungCard
            rungNumber={1}
            name={lang(`${k}.twoFoundationRungs.rung1Name`)}
            regNode={lang(`${k}.twoFoundationRungs.rung1Reg`)}
            engNode={lang(`${k}.twoFoundationRungs.rung1Eng`)}
            busNode={lang(`${k}.twoFoundationRungs.rung1Bus`)}
            level="company"
            rungLabel={lang('qmsArchitectureHelp.common.rung')}
            companyLabel={lang('qmsArchitectureHelp.common.company')}
            deviceLabel={lang('qmsArchitectureHelp.common.device')}
          />

          <div className="p-3 bg-muted/30 rounded-lg border-l-4 border-primary">
            <p className="text-sm text-muted-foreground">
              {lang(`${k}.twoFoundationRungs.rung1Description`)}
            </p>
          </div>

          <RungCard
            rungNumber={5}
            name={lang(`${k}.twoFoundationRungs.rung5Name`)}
            regNode={lang(`${k}.twoFoundationRungs.rung5Reg`)}
            engNode={lang(`${k}.twoFoundationRungs.rung5Eng`)}
            busNode="—"
            level="company"
            rungLabel={lang('qmsArchitectureHelp.common.rung')}
            companyLabel={lang('qmsArchitectureHelp.common.company')}
            deviceLabel={lang('qmsArchitectureHelp.common.device')}
          />

          <div className="p-3 bg-muted/30 rounded-lg border-l-4 border-primary">
            <p className="text-sm text-muted-foreground">
              {lang(`${k}.twoFoundationRungs.rung5Description`)}
            </p>
          </div>
        </div>
      </HelpSection>

      <HelpSection title={lang(`${k}.threeParallelTracks.title`)}>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300 border border-purple-400 dark:border-purple-600 px-2 py-0.5 rounded">REG</span>
            <div>
              <p className="text-sm font-medium text-purple-800 dark:text-purple-200">{lang(`${k}.threeParallelTracks.regTitle`)}</p>
              <p className="text-xs text-purple-600 dark:text-purple-400">{lang(`${k}.threeParallelTracks.regDesc`)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
            <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300 border border-cyan-400 dark:border-cyan-600 px-2 py-0.5 rounded">ENG</span>
            <div>
              <p className="text-sm font-medium text-cyan-800 dark:text-cyan-200">{lang(`${k}.threeParallelTracks.engTitle`)}</p>
              <p className="text-xs text-cyan-600 dark:text-cyan-400">{lang(`${k}.threeParallelTracks.engDesc`)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <span className="text-xs font-bold text-orange-700 dark:text-orange-300 border border-orange-400 dark:border-orange-600 px-2 py-0.5 rounded">BUS</span>
            <div>
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">{lang(`${k}.threeParallelTracks.busTitle`)}</p>
              <p className="text-xs text-orange-600 dark:text-orange-400">{lang(`${k}.threeParallelTracks.busDesc`)}</p>
            </div>
          </div>
        </div>
      </HelpSection>

      <HelpSection title={lang(`${k}.isoClauseMapping.title`)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoCard
            title={lang(`${k}.isoClauseMapping.managementTitle`)}
            description={lang(`${k}.isoClauseMapping.managementDesc`)}
            icon={<Shield className="h-4 w-4 text-primary" />}
          />
          <InfoCard
            title={lang(`${k}.isoClauseMapping.resourceTitle`)}
            description={lang(`${k}.isoClauseMapping.resourceDesc`)}
            icon={<Users className="h-4 w-4 text-primary" />}
          />
          <InfoCard
            title={lang(`${k}.isoClauseMapping.infrastructureTitle`)}
            description={lang(`${k}.isoClauseMapping.infrastructureDesc`)}
            icon={<Package className="h-4 w-4 text-primary" />}
          />
          <InfoCard
            title={lang(`${k}.isoClauseMapping.measurementTitle`)}
            description={lang(`${k}.isoClauseMapping.measurementDesc`)}
            icon={<BarChart3 className="h-4 w-4 text-primary" />}
          />
        </div>
      </HelpSection>

      <HelpSection title={lang(`${k}.deviceEngine.title`)}>
        <Card className="bg-gradient-to-r from-cyan-50/50 to-purple-50/50 dark:from-cyan-900/10 dark:to-purple-900/10">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground mb-3">
              {lang(`${k}.deviceEngine.description`)}
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-slate-600" />
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Cpu className="h-6 w-6 text-cyan-600" />
                <span className="text-xs text-muted-foreground">{lang(`${k}.deviceEngine.foundationToEngine`)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Cpu className="h-6 w-6 text-cyan-600" />
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Building2 className="h-6 w-6 text-slate-600" />
                <span className="text-xs text-muted-foreground">{lang(`${k}.deviceEngine.engineToFoundation`)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </HelpSection>

      <TipCard>
        {lang(`${k}.tip`)}
      </TipCard>
    </div>
  );
};

// ============ DEVICE PROCESS ENGINE HELP ============
export const DeviceProcessEngineHelp: React.FC<HelpContentProps> = ({ onNavigateToDetail }) => {
  const { lang } = useTranslation();
  const k = 'qmsArchitectureHelp.engine';
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg border">
        <Cpu className="h-6 w-6 text-cyan-600 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-lg mb-1">{lang(`${k}.title`)}</h3>
          <p className="text-sm text-muted-foreground">
            {lang(`${k}.description`)}
          </p>
        </div>
      </div>

      <HelpSection title={lang(`${k}.fourEngineRungs.title`)}>
        <div className="space-y-3">
          <RungCard
            rungNumber={2}
            name={lang(`${k}.fourEngineRungs.rung2Name`)}
            regNode={lang(`${k}.fourEngineRungs.rung2Reg`)}
            engNode={lang(`${k}.fourEngineRungs.rung2Eng`)}
            busNode={lang(`${k}.fourEngineRungs.rung2Bus`)}
            level="device"
            rungLabel={lang('qmsArchitectureHelp.common.rung')}
            companyLabel={lang('qmsArchitectureHelp.common.company')}
            deviceLabel={lang('qmsArchitectureHelp.common.device')}
          />
          <RungCard
            rungNumber={3}
            name={lang(`${k}.fourEngineRungs.rung3Name`)}
            regNode={lang(`${k}.fourEngineRungs.rung3Reg`)}
            engNode={lang(`${k}.fourEngineRungs.rung3Eng`)}
            busNode={lang(`${k}.fourEngineRungs.rung3Bus`)}
            level="device"
            rungLabel={lang('qmsArchitectureHelp.common.rung')}
            companyLabel={lang('qmsArchitectureHelp.common.company')}
            deviceLabel={lang('qmsArchitectureHelp.common.device')}
          />
          <RungCard
            rungNumber={4}
            name={lang(`${k}.fourEngineRungs.rung4Name`)}
            regNode={lang(`${k}.fourEngineRungs.rung4Reg`)}
            engNode={lang(`${k}.fourEngineRungs.rung4Eng`)}
            busNode={lang(`${k}.fourEngineRungs.rung4Bus`)}
            level="device"
            rungLabel={lang('qmsArchitectureHelp.common.rung')}
            companyLabel={lang('qmsArchitectureHelp.common.company')}
            deviceLabel={lang('qmsArchitectureHelp.common.device')}
          />
          <RungCard
            rungNumber={5}
            name={lang(`${k}.fourEngineRungs.rung5Name`)}
            regNode={lang(`${k}.fourEngineRungs.rung5Reg`)}
            engNode={lang(`${k}.fourEngineRungs.rung5Eng`)}
            busNode="—"
            level="device"
            rungLabel={lang('qmsArchitectureHelp.common.rung')}
            companyLabel={lang('qmsArchitectureHelp.common.company')}
            deviceLabel={lang('qmsArchitectureHelp.common.device')}
          />
        </div>
      </HelpSection>

      <HelpSection title={lang(`${k}.threeParallelTracks.title`)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {lang(`${k}.threeParallelTracks.regTitle`)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-purple-600 dark:text-purple-400">
              {lang(`${k}.threeParallelTracks.regDesc`)}
            </CardContent>
          </Card>

          <Card className="bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                {lang(`${k}.threeParallelTracks.engTitle`)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-cyan-600 dark:text-cyan-400">
              {lang(`${k}.threeParallelTracks.engDesc`)}
            </CardContent>
          </Card>

          <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-orange-700 dark:text-orange-300 flex items-center gap-2">
                <Package className="h-4 w-4" />
                {lang(`${k}.threeParallelTracks.busTitle`)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-orange-600 dark:text-orange-400">
              {lang(`${k}.threeParallelTracks.busDesc`)}
            </CardContent>
          </Card>
        </div>
      </HelpSection>

      <HelpSection title={lang(`${k}.phasesMapToRungs.title`)}>
        <p className="text-sm text-muted-foreground mb-3">
          {lang(`${k}.phasesMapToRungs.description`)}
        </p>
        <PhaseToRungMapping lang={lang} />
      </HelpSection>

      <HelpSection title={lang(`${k}.companyContextToggle.title`)}>
        <div className="p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-2">{lang(`${k}.companyContextToggle.enableLabel`)}</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>{lang(`${k}.companyContextToggle.rung1Item`)}</li>
                <li>{lang(`${k}.companyContextToggle.rung5Item`)}</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2 italic">
                {lang(`${k}.companyContextToggle.note`)}
              </p>
            </div>
          </div>
        </div>
      </HelpSection>

      <HelpSection title={lang(`${k}.deviceCapa.title`)}>
        <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive mb-2">{lang(`${k}.deviceCapa.whenToExpedite`)}</p>
              <p className="text-xs text-muted-foreground mb-3">
                {lang(`${k}.deviceCapa.isoRequirement`)}
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">•</span>
                  <span>{lang(`${k}.deviceCapa.patientSafety`)}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">•</span>
                  <span>{lang(`${k}.deviceCapa.recurringPattern`)}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">•</span>
                  <span>{lang(`${k}.deviceCapa.regulatoryTrigger`)}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">•</span>
                  <span>{lang(`${k}.deviceCapa.productionBlock`)}</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-2 p-2 bg-muted rounded text-xs text-muted-foreground">
            {lang(`${k}.deviceCapa.note`)}
          </div>
        </div>
      </HelpSection>

      <TipCard>
        {lang(`${k}.tip`)}
      </TipCard>
    </div>
  );
};

// ============ QMS ARCHITECTURE OVERVIEW HELP ============
export const QMSArchitectureHelp: React.FC<HelpContentProps> = ({ onNavigateToDetail }) => {
  const { lang } = useTranslation();
  const k = 'qmsArchitectureHelp.overview';
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border">
        <Layers className="h-6 w-6 text-indigo-600 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-lg mb-1">{lang(`${k}.title`)}</h3>
          <p className="text-sm text-muted-foreground">
            {lang(`${k}.description`)}
          </p>
        </div>
      </div>

      <HelpSection title={lang(`${k}.architecturalOverview.title`)}>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {lang(`${k}.architecturalOverview.foundationTitle`)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {lang(`${k}.architecturalOverview.foundationDesc`)}
            </CardContent>
          </Card>

          <div className="flex items-center justify-center">
            <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                {lang(`${k}.architecturalOverview.engineTitle`)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {lang(`${k}.architecturalOverview.engineDesc`)}
            </CardContent>
          </Card>
        </div>
      </HelpSection>

      <HelpSection title={lang(`${k}.completeRungStructure.title`)}>
        <div className="space-y-2">
          <RungCard
            rungNumber={1}
            name={lang(`${k}.completeRungStructure.rung1Name`)}
            regNode={lang(`${k}.completeRungStructure.rung1Reg`)}
            engNode={lang(`${k}.completeRungStructure.rung1Eng`)}
            busNode={lang(`${k}.completeRungStructure.rung1Bus`)}
            level="company"
            rungLabel={lang('qmsArchitectureHelp.common.rung')}
            companyLabel={lang('qmsArchitectureHelp.common.company')}
            deviceLabel={lang('qmsArchitectureHelp.common.device')}
          />
          <RungCard
            rungNumber={2}
            name={lang(`${k}.completeRungStructure.rung2Name`)}
            regNode={lang(`${k}.completeRungStructure.rung2Reg`)}
            engNode={lang(`${k}.completeRungStructure.rung2Eng`)}
            busNode={lang(`${k}.completeRungStructure.rung2Bus`)}
            level="device"
            rungLabel={lang('qmsArchitectureHelp.common.rung')}
            companyLabel={lang('qmsArchitectureHelp.common.company')}
            deviceLabel={lang('qmsArchitectureHelp.common.device')}
          />
          <RungCard
            rungNumber={3}
            name={lang(`${k}.completeRungStructure.rung3Name`)}
            regNode={lang(`${k}.completeRungStructure.rung3Reg`)}
            engNode={lang(`${k}.completeRungStructure.rung3Eng`)}
            busNode={lang(`${k}.completeRungStructure.rung3Bus`)}
            level="device"
            rungLabel={lang('qmsArchitectureHelp.common.rung')}
            companyLabel={lang('qmsArchitectureHelp.common.company')}
            deviceLabel={lang('qmsArchitectureHelp.common.device')}
          />
          <RungCard
            rungNumber={4}
            name={lang(`${k}.completeRungStructure.rung4Name`)}
            regNode={lang(`${k}.completeRungStructure.rung4Reg`)}
            engNode={lang(`${k}.completeRungStructure.rung4Eng`)}
            busNode={lang(`${k}.completeRungStructure.rung4Bus`)}
            level="device"
            rungLabel={lang('qmsArchitectureHelp.common.rung')}
            companyLabel={lang('qmsArchitectureHelp.common.company')}
            deviceLabel={lang('qmsArchitectureHelp.common.device')}
          />
          <RungCard
            rungNumber={5}
            name={lang(`${k}.completeRungStructure.rung5Name`)}
            regNode={lang(`${k}.completeRungStructure.rung5Reg`)}
            engNode={lang(`${k}.completeRungStructure.rung5Eng`)}
            busNode="—"
            level="company"
            rungLabel={lang('qmsArchitectureHelp.common.rung')}
            companyLabel={lang('qmsArchitectureHelp.common.company')}
            deviceLabel={lang('qmsArchitectureHelp.common.device')}
          />
        </div>
      </HelpSection>

      <HelpSection title={lang(`${k}.phasesVsProcessMap.title`)}>
        <div className="p-4 bg-muted/50 rounded-lg border">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                {lang(`${k}.phasesVsProcessMap.lifecycleTitle`)}
              </h5>
              <p className="text-xs text-muted-foreground">
                {lang(`${k}.phasesVsProcessMap.lifecycleDesc`)}
              </p>
            </div>
            <div>
              <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                {lang(`${k}.phasesVsProcessMap.processMapTitle`)}
              </h5>
              <p className="text-xs text-muted-foreground">
                {lang(`${k}.phasesVsProcessMap.processMapDesc`)}
              </p>
            </div>
          </div>
        </div>
        <PhaseToRungMapping lang={lang} />
      </HelpSection>

      <HelpSection title={lang(`${k}.crossTrackDependencies.title`)}>
        <p className="text-sm text-muted-foreground mb-3">
          {lang(`${k}.crossTrackDependencies.description`)}
        </p>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <ArrowRight className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{lang(`${k}.crossTrackDependencies.regToEng`)}</p>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight className="h-4 w-4 text-cyan-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{lang(`${k}.crossTrackDependencies.engToBus`)}</p>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{lang(`${k}.crossTrackDependencies.busToReg`)}</p>
          </div>
        </div>
      </HelpSection>

      <TipCard>
        {lang(`${k}.tip`)}
      </TipCard>
    </div>
  );
};
