import React from 'react';
import { DocumentComposer } from '@/components/document-composer/DocumentComposer';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { DRAFT_STUDIO_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { RestrictedFeatureProvider } from '@/contexts/RestrictedFeatureContext';
import { RestrictedPreviewBanner } from '@/components/subscription/RestrictedPreviewBanner';

export default function DocumentStudioPage() {
  // Check if Document Studio feature is enabled
  const { isMenuAccessKeyEnabled, isLoading: isLoadingPlanAccess, planName } = usePlanMenuAccess();
  const isFeatureEnabled = isMenuAccessKeyEnabled(DRAFT_STUDIO_MENU_ACCESS.DOCUMENT_STUDIO);
  const isRestricted = !isFeatureEnabled;

  if (isLoadingPlanAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <RestrictedFeatureProvider
      isRestricted={isRestricted}
      planName={planName}
      featureName="Document Studio"
    >
      <DocumentComposer disabled={isRestricted} />
    </RestrictedFeatureProvider>
  );
}