import React from 'react';
import { Building, Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CompanySelector } from '@/components/mission-control/CompanySelector';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface CompanyContextBannerProps {
  className?: string;
}

export function CompanyContextBanner({ className }: CompanyContextBannerProps) {
  const { activeCompanyRole } = useCompanyRole();
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const { companyName: urlCompanyName } = useParams<{ companyName: string }>();

  // Use URL company name if available, otherwise fall back to active role
  const displayCompanyName = urlCompanyName ? decodeURIComponent(urlCompanyName) : activeCompanyRole?.companyName;
  const displayRole = activeCompanyRole?.role;

  if (!displayCompanyName) {
    return null;
  }

  return (
    <Card className={cn("border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/mission-control')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {lang('navigation.missionControl')}
            </Button>

            <div className="h-4 w-px bg-border" />

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">
                    {displayCompanyName}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {displayRole ? lang('documentStudio.roleAccess', { role: displayRole.charAt(0).toUpperCase() + displayRole.slice(1) }) : lang('documentStudio.access')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{lang('documentStudio.switchCompany')}:</span>
            <CompanySelector
              variant="outline"
              className="min-w-[180px]"
              showAllOption={false}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}