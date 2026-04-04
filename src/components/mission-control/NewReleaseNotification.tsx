import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpCircle, X, ArrowRight } from 'lucide-react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useCompanyAdoptedRelease } from '@/hooks/useCompanyAdoptedRelease';
import { useAvailableXyregReleases } from '@/hooks/useAvailableXyregReleases';

export function NewReleaseNotification() {
  const navigate = useNavigate();
  const { companyName } = useParams<{ companyName: string }>();
  const companyId = useCompanyId() || '';
  const { data: adoptedRelease } = useCompanyAdoptedRelease(companyId);
  const { data: availableReleases = [] } = useAvailableXyregReleases();
  const [dismissed, setDismissed] = React.useState(false);

  // Find latest published release
  const latestRelease = availableReleases.length > 0 ? availableReleases[0] : null;

  // Check if there's a newer version than what's adopted
  const hasNewerVersion = latestRelease && (
    !adoptedRelease || latestRelease.id !== adoptedRelease.release_id
  );

  if (!hasNewerVersion || dismissed || !latestRelease) return null;

  const currentVersion = adoptedRelease?.version ? `v${adoptedRelease.version}` : 'none';

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ArrowUpCircle className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                New XYREG version v{latestRelease.version} available
              </p>
              <p className="text-xs text-blue-700">
                Released {new Date(latestRelease.release_date).toLocaleDateString()}
                {adoptedRelease && (
                  <span> — Current: {currentVersion}</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100 text-xs"
              onClick={() => {
                const path = `/app/company/${encodeURIComponent(companyName || '')}/infrastructure`;
                navigate(path);
              }}
            >
              <ArrowRight className="h-3 w-3 mr-1" />
              View & Validate
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-blue-400 hover:text-blue-600"
              onClick={() => setDismissed(true)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
