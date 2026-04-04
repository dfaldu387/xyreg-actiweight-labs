import React from 'react';
import { ChevronRight, Building2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams } from 'react-router-dom';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useTranslation } from '@/hooks/useTranslation';
// Note: useCompanyContextValidation removed - CompanyRouteGuard already handles security validation

export function DocumentStudioBreadcrumbs() {
  const navigate = useNavigate();
  const { activeCompanyRole } = useCompanyRole();
  const { lang } = useTranslation();
  const { companyName: urlCompanyName } = useParams<{ companyName: string }>();

  // SECURITY FIX: Always prioritize URL context over stored context to prevent wrong company data access
  const displayCompanyName = urlCompanyName ? decodeURIComponent(urlCompanyName) : undefined;

  // If no URL company context, don't show breadcrumbs to prevent confusion
  if (!displayCompanyName) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          // SECURITY FIX: Navigate to company-specific Mission Control to preserve context
          if (displayCompanyName) {
            navigate(`/app/company/${encodeURIComponent(displayCompanyName)}/mission-control`);
          } else {
            navigate('/app/mission-control');
          }
        }}
        className="p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
      >
        {lang('navigation.missionControl')}
      </Button>

      <ChevronRight className="h-4 w-4" />

      <div className="flex items-center gap-1">
        <Building2 className="h-3 w-3" />
        <span className="font-medium text-foreground">
          {displayCompanyName}
        </span>
      </div>

      <ChevronRight className="h-4 w-4" />

      <div className="flex items-center gap-1">
        <FileText className="h-3 w-3" />
        <span className="text-primary font-medium">{lang('documentStudio.title')}</span>
      </div>
    </nav>
  );
}