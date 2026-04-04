import React from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate, useParams } from 'react-router-dom';

interface PlanUpgradeRequiredProps {
  /** Feature name that requires upgrade */
  featureName: string;
  /** Current plan name */
  planName?: string | null;
  /** Description of what this feature does */
  featureDescription?: string;
  /** Whether to show the upgrade button */
  showUpgradeButton?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Component displayed when a user tries to access a feature not available on their plan.
 * Shows a professional upgrade prompt with feature information.
 */
export function PlanUpgradeRequired({
  featureName,
  planName,
  featureDescription,
  showUpgradeButton = true,
  className = '',
}: PlanUpgradeRequiredProps) {
  const navigate = useNavigate();
  const { companyName } = useParams<{ companyName: string }>();

  const handleUpgradeClick = () => {
    // Navigate to pricing page
    if (companyName) {
      navigate(`/app/company/${encodeURIComponent(companyName)}/pricing?tab=plans`);
    } else {
      navigate('/app/pricing');
    }
  };

  return (
    <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
      <Card className="max-w-lg w-full border-dashed border-2 border-foreground/20 bg-slate-50/50">
        <CardContent className="pt-8 pb-8 px-8">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Lock Icon with gradient background */}
            <div>
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <Lock className="w-10 h-10 text-slate-400" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-800">
                Upgrade to Access {featureName}
              </h3>
              {planName && (
                <p className="text-sm text-slate-500">
                  This feature is not available on your current <span className="font-medium text-slate-700 underline">{planName}</span> plan.
                </p>
              )}
            </div>

            {/* Feature Description */}
            {featureDescription && (
              <p className="text-sm text-slate-600 max-w-md">
                {featureDescription}
              </p>
            )}

            {/* Upgrade Button */}
            {showUpgradeButton && (
              <Button
                onClick={handleUpgradeClick}
                className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white px-6"
              >
                View Upgrade Options
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            {/* Contact Support Link */}
            <p className="text-xs text-slate-400">
              Questions? <button className="text-teal-600 hover:underline">Contact support</button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PlanUpgradeRequired;
