import React from 'react';
import { useCompanyPhases } from '@/hooks/useCompanyPhases';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Loader2 } from 'lucide-react';
import { GlobalPhaseNumberingService } from '@/services/globalPhaseNumberingService';

const HelpSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-3">
    <h3 className="font-semibold text-foreground">{title}</h3>
    {children}
  </div>
);

const InfoCard: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
    <h4 className="font-medium text-sm text-foreground">{title}</h4>
    <p className="text-xs text-muted-foreground mt-1">{description}</p>
  </div>
);

const StepList: React.FC<{ steps: string[] }> = ({ steps }) => (
  <ol className="space-y-2">
    {steps.map((step, index) => (
      <li key={index} className="flex gap-3 text-sm">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
          {index + 1}
        </span>
        <span className="text-muted-foreground pt-0.5">{step}</span>
      </li>
    ))}
  </ol>
);

const TipCard: React.FC<{ tipLabel: string; children: React.ReactNode }> = ({ tipLabel, children }) => (
  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
    <p className="text-sm text-amber-700 dark:text-amber-400">
      💡 <strong>{tipLabel}:</strong> {children}
    </p>
  </div>
);

export const DynamicMilestonesHelp: React.FC = () => {
  const { activeCompanyRole } = useCompanyRole();
  const { phases, isLoading } = useCompanyPhases(activeCompanyRole?.companyId);
  const { lang } = useTranslation();

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {lang('help.content.dynamicMilestones.description')}
      </p>

      <HelpSection title={lang('help.content.dynamicMilestones.yourLifecyclePhases')}>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">{lang('help.content.dynamicMilestones.loadingPhases')}</span>
          </div>
        ) : (() => {
          // Filter out "No Phase" phase
          const filteredPhases = phases.filter(phase => {
            const cleanedName = GlobalPhaseNumberingService.cleanPhaseName(phase.name);
            return cleanedName.toLowerCase() !== 'no phase';
          });
          
          return filteredPhases.length > 0 ? (
            <div className="space-y-2">
              {filteredPhases.map((phase, index) => (
                <InfoCard
                  key={phase.id}
                  title={`${index + 1}. ${phase.name.replace(/^\(\d+\)\s*/, '')}`}
                  description={phase.description || lang('help.content.dynamicMilestones.phaseActivities')}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              {lang('help.content.dynamicMilestones.noPhasesConfigured')}
            </p>
          );
        })()}
      </HelpSection>

      <HelpSection title={lang('help.content.dynamicMilestones.timelineBestPractices')}>
        <StepList steps={[
          lang('help.content.dynamicMilestones.practices.step1'),
          lang('help.content.dynamicMilestones.practices.step2'),
          lang('help.content.dynamicMilestones.practices.step3'),
          lang('help.content.dynamicMilestones.practices.step4')
        ]} />
      </HelpSection>

      <TipCard tipLabel={lang('help.content.dynamicMilestones.tipLabel')}>
        {lang('help.content.dynamicMilestones.tip')}
      </TipCard>
    </div>
  );
};
