import React, { lazy, Suspense, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Grid3X3, BookOpen, Award, Sparkles } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useCompanyId } from '@/hooks/useCompanyId';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { PORTFOLIO_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { RestrictedFeatureProvider } from '@/contexts/RestrictedFeatureContext';
import { RestrictedPreviewBanner } from '@/components/subscription/RestrictedPreviewBanner';
import { useCompetencyData, COMPETENCY_AREAS } from '@/hooks/useCompetencyData';
import { MOCK_ROLE_REQUIREMENTS } from '@/components/competency-matrix/competencyMockData';

const TrainingModuleLibrary = lazy(() => 
  import('@/components/training/TrainingModuleLibrary').then(m => ({ default: m.TrainingModuleLibrary }))
);
const TrainingSetupWizard = lazy(() => 
  import('@/components/training/TrainingSetupWizard').then(m => ({ default: m.TrainingSetupWizard }))
);
const TeamCompetencyView = lazy(() => 
  import('@/components/training/TeamCompetencyView').then(m => ({ default: m.TeamCompetencyView }))
);
const TrainingMatrix = lazy(() => 
  import('@/components/training/TrainingMatrix').then(m => ({ default: m.TrainingMatrix }))
);
const RoleTrainingAssignment = lazy(() => 
  import('@/components/training/RoleTrainingAssignment').then(m => ({ default: m.RoleTrainingAssignment }))
);
const DirectUserAssignment = lazy(() => 
  import('@/components/training/DirectUserAssignment').then(m => ({ default: m.DirectUserAssignment }))
);
const CompetencyHeatmap = lazy(() => 
  import('@/components/competency-matrix/CompetencyHeatmap').then(m => ({ default: m.CompetencyHeatmap }))
);
const DepartmentReadinessChart = lazy(() => 
  import('@/components/competency-matrix/DepartmentReadinessChart').then(m => ({ default: m.DepartmentReadinessChart }))
);
const RoleCompetencyMapping = lazy(() => 
  import('@/components/competency-matrix/RoleCompetencyMapping').then(m => ({ default: m.RoleCompetencyMapping }))
);
const QPRegistryView = lazy(() => 
  import('@/components/competency-matrix/QPRegistryView').then(m => ({ default: m.QPRegistryView }))
);

export default function CompanyTrainingPage() {
  const { companyName } = useParams<{ companyName: string }>();
  const companyId = useCompanyId();
  const { lang } = useTranslation();
  const [roleAssignmentOpen, setRoleAssignmentOpen] = useState(false);
  const [directAssignmentOpen, setDirectAssignmentOpen] = useState(false);
  const { staff, entries, readiness, isLoading: competencyLoading } = useCompetencyData(companyId);
  // const [assignmentOpen, setAssignmentOpen] = useState(false);

  // Restriction check - double security pattern (hooks must be called before any conditional returns)
  const { isMenuAccessKeyEnabled, planName } = usePlanMenuAccess();
  const isFeatureEnabled = isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.TRAINING);
  const isRestricted = !isFeatureEnabled;

  const breadcrumbs = [
    { label: companyName || 'Company', href: `/app/company/${companyName}` },
    { label: lang('training.breadcrumbs.training') }
  ];

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-48">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleSwitchToDirectAssignment = () => {
    setRoleAssignmentOpen(false);
    setDirectAssignmentOpen(true);
  };

  return (
    <RestrictedFeatureProvider
      isRestricted={isRestricted}
      planName={planName}
      featureName={lang('training.featureName')}
    >
      <TooltipProvider>
        <div className="space-y-6">
          <ConsistentPageHeader
            title={lang('training.title')}
            subtitle={lang('training.subtitle')}
            breadcrumbs={breadcrumbs}
          />

          {isRestricted && <RestrictedPreviewBanner />}
          <Tabs defaultValue="setup" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="setup" className="flex items-center gap-2" disabled={isRestricted}>
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Setup</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2" disabled={isRestricted}>
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{lang('training.tabs.team')}</span>
            </TabsTrigger>
            <TabsTrigger value="matrix" className="flex items-center gap-2" disabled={isRestricted}>
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:inline">{lang('training.tabs.matrix')}</span>
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2" disabled={isRestricted}>
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">{lang('training.tabs.library')}</span>
            </TabsTrigger>
            <TabsTrigger value="competency" className="flex items-center gap-2" disabled={isRestricted}>
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">{lang('training.tabs.competency')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              One-click setup: apply Xyreg's recommended training set to every role defined
              in your company Settings.
            </p>
            <Suspense fallback={<LoadingSpinner />}>
              <TrainingSetupWizard companyId={companyId} disabled={isRestricted} />
            </Suspense>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {lang('training.tabDescriptions.team')}
            </p>
            <Suspense fallback={<LoadingSpinner />}>
              <TeamCompetencyView companyId={companyId} disabled={isRestricted} />
            </Suspense>
          </TabsContent>

          <TabsContent value="matrix" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {lang('training.tabDescriptions.matrix')}
            </p>
            <Suspense fallback={<LoadingSpinner />}>
              <TrainingMatrix
                  companyId={companyId}
                  onOpenRoleAssignment={() => !isRestricted && setRoleAssignmentOpen(true)}
                  onOpenDirectAssignment={() => !isRestricted && setDirectAssignmentOpen(true)}
                  disabled={isRestricted}
                />
            </Suspense>
          </TabsContent>
          <TabsContent value="library" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {lang('training.tabDescriptions.library')}
            </p>
            <Suspense fallback={<LoadingSpinner />}>
              <TrainingModuleLibrary companyId={companyId} disabled={isRestricted} />
            </Suspense>
          </TabsContent>

          <TabsContent value="competency" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {lang('training.tabDescriptions.competency')}
            </p>
            {competencyLoading ? (
              <LoadingSpinner />
            ) : (
              <Suspense fallback={<LoadingSpinner />}>
                <Tabs defaultValue="heatmap" className="w-full">
                  <TabsList>
                    <TabsTrigger value="heatmap">{lang('training.competencySubTabs.heatmap')}</TabsTrigger>
                    <TabsTrigger value="roles">{lang('training.competencySubTabs.roles')}</TabsTrigger>
                    <TabsTrigger value="registry">{lang('training.competencySubTabs.registry')}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="heatmap" className="space-y-4 mt-4">
                    <DepartmentReadinessChart data={readiness} />
                    <CompetencyHeatmap areas={COMPETENCY_AREAS} staff={staff} entries={entries} />
                  </TabsContent>
                  <TabsContent value="roles" className="mt-4">
                    <RoleCompetencyMapping requirements={MOCK_ROLE_REQUIREMENTS} areas={COMPETENCY_AREAS} />
                  </TabsContent>
                  <TabsContent value="registry" className="mt-4">
                    <QPRegistryView staff={staff} entries={entries} />
                  </TabsContent>
                </Tabs>
              </Suspense>
            )}
          </TabsContent>
        </Tabs>

        {/* Role Training Assignment Modal */}
        <Suspense fallback={null}>
          <RoleTrainingAssignment
            companyId={companyId}
            open={roleAssignmentOpen}
            onOpenChange={setRoleAssignmentOpen}
            onSwitchToDirectAssignment={handleSwitchToDirectAssignment}
          />
        </Suspense>

        {/* Direct User Assignment Modal */}
        <Suspense fallback={null}>
          <DirectUserAssignment
            companyId={companyId}
            open={directAssignmentOpen}
            onOpenChange={setDirectAssignmentOpen}
          />
        </Suspense>
        </div>
      </TooltipProvider>
    </RestrictedFeatureProvider>
  );
}