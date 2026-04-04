import React from 'react';
import {
  Target,
  Users,
  ShieldCheck,
  MousePointer,
  CheckCircle2,
  TrendingUp,
  Layers,
  Link2,
  Globe,
  BookOpen
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export function XyregGenesisIntroduction() {
  const { lang } = useTranslation();

  return (
    <div className="space-y-8">
      {/* Section A: Why This Matters */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-amber-600" />
          <h3 className="text-lg font-semibold text-foreground">{lang('help.genesisIntro.whyInvestors.title')}</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {lang('help.genesisIntro.whyInvestors.description')}
        </p>

        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm text-blue-800 dark:text-blue-200">{lang('help.genesisIntro.marketOpportunity.title')}</span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {lang('help.genesisIntro.marketOpportunity.description')}
            </p>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-emerald-600" />
              <span className="font-medium text-sm text-emerald-800 dark:text-emerald-200">{lang('help.genesisIntro.executionCapability.title')}</span>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              {lang('help.genesisIntro.executionCapability.description')}
            </p>
          </div>

          <div className="bg-violet-50 dark:bg-violet-950/30 rounded-lg p-4 border border-violet-200 dark:border-violet-800/50">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-violet-600" />
              <span className="font-medium text-sm text-violet-800 dark:text-violet-200">{lang('help.genesisIntro.riskProfile.title')}</span>
            </div>
            <p className="text-xs text-violet-600 dark:text-violet-400">
              {lang('help.genesisIntro.riskProfile.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Section B: How the Process Works */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MousePointer className="h-5 w-5 text-amber-600" />
          <h3 className="text-lg font-semibold text-foreground">{lang('help.genesisIntro.guidedJourney.title')}</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {lang('help.genesisIntro.guidedJourney.description')}
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="h-6 w-6 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-200 shrink-0">1</div>
            <div>
              <p className="text-sm font-medium">{lang('help.genesisIntro.step1.title')}</p>
              <p className="text-xs text-muted-foreground">{lang('help.genesisIntro.step1.description')}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="h-6 w-6 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-200 shrink-0">2</div>
            <div>
              <p className="text-sm font-medium">{lang('help.genesisIntro.step2.title')}</p>
              <p className="text-xs text-muted-foreground">{lang('help.genesisIntro.step2.description')}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="h-6 w-6 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-200 shrink-0">3</div>
            <div>
              <p className="text-sm font-medium">{lang('help.genesisIntro.step3.title')}</p>
              <p className="text-xs text-muted-foreground">{lang('help.genesisIntro.step3.description')}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="h-6 w-6 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-200 shrink-0">4</div>
            <div>
              <p className="text-sm font-medium">{lang('help.genesisIntro.step4.title')}</p>
              <p className="text-xs text-muted-foreground">{lang('help.genesisIntro.step4.description')}</p>
            </div>
          </div>
        </div>

        {/* Callout */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{lang('help.genesisIntro.amberPanel.title')}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {lang('help.genesisIntro.amberPanel.description')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section C: Leveraging XyReg's Infrastructure */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-amber-600" />
          <h3 className="text-lg font-semibold text-foreground">{lang('help.genesisIntro.builtOnWork.title')}</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {lang('help.genesisIntro.builtOnWork.description')}
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>{lang('help.genesisIntro.integration.deviceDefinition')}</span>
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>{lang('help.genesisIntro.integration.riskManagement')}</span>
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>{lang('help.genesisIntro.integration.clinicalEvidence')}</span>
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>{lang('help.genesisIntro.integration.marketAnalysis')}</span>
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>{lang('help.genesisIntro.integration.teamProfiles')}</span>
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>{lang('help.genesisIntro.integration.reimbursement')}</span>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 mt-4">
          <p className="text-sm text-foreground">
            <span className="font-medium">{lang('help.genesisIntro.everyFieldContributes')}</span>
            <span className="text-muted-foreground ml-1">
              {lang('help.genesisIntro.doesntDuplicate')}
            </span>
          </p>
        </div>
      </div>

      {/* Section D: After Completion */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-amber-600" />
          <h3 className="text-lg font-semibold text-foreground">{lang('help.genesisIntro.afterCompletion.title')}</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {lang('help.genesisIntro.afterCompletion.description')}
        </p>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="bg-background border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="h-4 w-4 text-indigo-600" />
              <span className="font-medium text-sm">{lang('help.genesisIntro.directSharing.title')}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {lang('help.genesisIntro.directSharing.description')}
            </p>
          </div>

          <div className="bg-background border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-emerald-600" />
              <span className="font-medium text-sm">{lang('help.genesisIntro.marketplace.title')}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {lang('help.genesisIntro.marketplace.description')}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground italic mt-2">
          {lang('help.genesisIntro.previewNote')}
        </p>
      </div>
    </div>
  );
}
