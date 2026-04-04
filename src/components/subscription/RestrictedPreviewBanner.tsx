import React from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams } from 'react-router-dom';
import { useRestrictedFeature } from '@/contexts/RestrictedFeatureContext';

interface RestrictedPreviewBannerProps {
  /** Custom class name */
  className?: string;
}

/**
 * Banner displayed at the top of a page when user is in preview/restricted mode.
 * Shows that they can view but not interact with the feature.
 */
export function RestrictedPreviewBanner({ className = '' }: RestrictedPreviewBannerProps) {
  const navigate = useNavigate();
  const { companyName } = useParams<{ companyName: string }>();
  const { isRestricted, featureName } = useRestrictedFeature();

  // Don't render if not in restricted mode
  if (!isRestricted) return null;

  const handleUpgradeClick = () => {
    if (companyName) {
      navigate(`/app/company/${encodeURIComponent(companyName)}/profile?tab=plan`);
    } else {
      navigate('/app/profile?tab=plan');
    }
  };

  return (
    <div
      className={`
        z-20
        bg-gradient-to-r from-amber-50 to-orange-50
        border border-amber-200
        rounded-lg
        p-4
        mt-2
        mb-6
        shadow-sm
        ${className}
      `}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100">
            <Lock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-amber-900">Locked Feature</h4>
            </div>
            <p className="text-sm text-amber-700">
              Upgrade your plan to access this <span className="font-medium">{featureName}</span> feature.
            </p>
          </div>
        </div>
        <Button
          onClick={handleUpgradeClick}
          size="sm"
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shrink-0"
        >
          Upgrade
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

export default RestrictedPreviewBanner;
