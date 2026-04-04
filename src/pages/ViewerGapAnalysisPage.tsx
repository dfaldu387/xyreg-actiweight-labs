import React from 'react';
import { useParams } from 'react-router-dom';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { ViewerGapAnalysisSection } from '@/components/viewer/ViewerGapAnalysisSection';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ViewerGapAnalysisPage() {
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
          No company selected. Please select a company from the sidebar first.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Gap Analysis</h1>
        <p className="text-muted-foreground">
          View compliance gaps for company and product standards
        </p>
      </div>
      
      <ViewerGapAnalysisSection companyName={decodeURIComponent(displayCompanyName)} />
    </div>
  );
}