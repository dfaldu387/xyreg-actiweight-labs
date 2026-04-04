import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCompanyBundles } from '@/hooks/useCompanyBundles';
import { useFeasibilityPortfolio, useCreateFeasibilityPortfolio } from '@/hooks/useFeasibilityPortfolio';
import { BundleRNPVAdapter } from '@/components/bundle-rnpv/BundleRNPVAdapter';
import { FeasibilityStudiesList } from './feasibility-studies/FeasibilityStudiesList';
import { FeasibilityConfigDialog } from './feasibility-studies/FeasibilityConfigDialog';
import { Button } from '@/components/ui/button';
import { useRestrictedFeature } from '@/contexts/RestrictedFeatureContext';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { PORTFOLIO_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { useTranslation } from '@/hooks/useTranslation';

interface FeasibilityStudiesPageProps {
  companyId: string;
}

export function FeasibilityStudiesPage({ companyId }: FeasibilityStudiesPageProps) {
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { lang } = useTranslation();

  // Restriction check - double security pattern
  const { isRestricted: contextRestricted } = useRestrictedFeature();
  const { isMenuAccessKeyEnabled } = usePlanMenuAccess();
  const isFeatureEnabled = isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.COMMERCIAL_FEASIBILITY_STUDIES);
  const isRestricted = contextRestricted || !isFeatureEnabled;

  const { data: allBundles, isLoading: bundlesLoading } = useCompanyBundles(companyId);
  const { data: portfolio } = useFeasibilityPortfolio(selectedBundleId || undefined);
  const createPortfolio = useCreateFeasibilityPortfolio();

  // Filter only feasibility study bundles
  const feasibilityBundles = allBundles?.filter(b => b.is_feasibility_study) || [];

  // Auto-select bundle from URL parameter
  useEffect(() => {
    const bundleParam = searchParams.get('bundle');
    if (bundleParam && feasibilityBundles) {
      const bundleExists = feasibilityBundles.some(b => b.id === bundleParam);
      if (bundleExists) {
        setSelectedBundleId(bundleParam);
      } else {
        setSelectedBundleId(null);
        setSearchParams({ tab: 'feasibility-studies' });
      }
    } else if (!bundleParam) {
      setSelectedBundleId(null);
    }
  }, [searchParams, feasibilityBundles]);

  const handleCreateStudy = async (config: {
    name: string;
    description: string;
    sourceBundleId?: string;
    sourceProductId?: string;
  }) => {
    if (isRestricted) return;
    if (config.sourceBundleId) {
      await createPortfolio.mutateAsync({
        bundleId: config.sourceBundleId,
        companyId
      });
    }
    // TODO: Handle individual product creation
  };

  const handleSelectBundle = (bundleId: string) => {
    setSelectedBundleId(bundleId);
    setSearchParams({ tab: 'feasibility-studies', bundle: bundleId });
  };

  const handleBackToList = () => {
    setSelectedBundleId(null);
    setSearchParams({ tab: 'feasibility-studies' });
  };

  return (
    <>
      <div className="space-y-6">
        {!selectedBundleId ? (
          <FeasibilityStudiesList
            feasibilityBundles={feasibilityBundles}
            isLoading={bundlesLoading}
            onSelectBundle={handleSelectBundle}
            onCreateNew={() => setShowCreateDialog(true)}
            disabled={isRestricted}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{lang('commercial.feasibilityStudies.title')}</h2>
                <p className="text-muted-foreground">
                  {lang('commercial.feasibilityStudies.subtitle')}
                </p>
              </div>
              <Button variant="ghost" onClick={handleBackToList}>
                {lang('commercial.feasibilityStudies.backToAllStudies')}
              </Button>
            </div>

            <div className="space-y-6">
              <BundleRNPVAdapter bundleId={selectedBundleId} disabled={isRestricted} />
            </div>
          </div>
        )}
      </div>

      <FeasibilityConfigDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        companyId={companyId}
        onSubmit={handleCreateStudy}
      />
    </>
  );
}
