import React from 'react';
import { useParams } from 'react-router-dom';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { ViewerDocumentsSection } from '@/components/viewer/ViewerDocumentsSection';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from '@/hooks/useTranslation';

export default function ViewerDocumentsPage() {
  const { lang } = useTranslation();
  const { companyName } = useParams<{ companyName: string }>();
  const { activeCompanyRole, isLoading } = useCompanyRole();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Use companyName from URL params if available, otherwise use active company name
  const displayCompanyName = companyName || activeCompanyRole?.companyName;

  if (!displayCompanyName) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {lang('viewerDocuments.noCompanySelected')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{lang('viewerDocuments.title')}</h1>
        <p className="text-muted-foreground">
          {lang('viewerDocuments.subtitle')}
        </p>
      </div>

      <ViewerDocumentsSection companyName={decodeURIComponent(displayCompanyName)} />
    </div>
  );
}