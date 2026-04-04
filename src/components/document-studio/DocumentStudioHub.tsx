import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Package } from 'lucide-react';
import { DocumentTypeCard } from './DocumentTypeCard';
import { CompanyContextBanner } from './CompanyContextBanner';
import { DocumentStudioBreadcrumbs } from './DocumentStudioBreadcrumbs';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useTranslation } from '@/hooks/useTranslation';

export function DocumentStudioHub() {
  const navigate = useNavigate();
  const { activeCompanyRole } = useCompanyRole();
  const { lang } = useTranslation();

  const handleCompanyWideDocument = () => {
    if (!activeCompanyRole) return;
    // Navigate to document composer for company-wide documents
    navigate('/app/document-composer');
  };

  const handleProductSpecificDocument = () => {
    if (!activeCompanyRole) return;
    // Navigate to document composer for product-specific documents
    navigate('/app/document-composer');
  };

  if (!activeCompanyRole) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <DocumentStudioBreadcrumbs />
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            {lang('documentStudio.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {lang('documentStudio.selectCompanyPrompt')}
          </p>
          <div className="mt-8">
            <CompanyContextBanner />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Breadcrumbs */}
      <DocumentStudioBreadcrumbs />

      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          {lang('documentStudio.title')}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {lang('documentStudio.createForCompanyPrefix')} <span className="font-semibold text-primary">{activeCompanyRole.companyName}</span>{lang('documentStudio.createForCompanySuffix')}
        </p>
      </div>

      {/* Document Type Cards */}
      <div className="grid md:grid-cols-2 gap-6 mt-12">
        <DocumentTypeCard
          title={lang('documentStudio.companyWideDocument')}
          subtitle={lang('documentStudio.companyWideDescription')}
          icon={Building2}
          onClick={handleCompanyWideDocument}
          gradientFrom="from-primary/10"
          gradientTo="to-primary/5"
          iconColor="text-primary"
          borderColor="border-primary/20"
          hoverBorderColor="hover:border-primary/40"
        />

        <DocumentTypeCard
          title={lang('documentStudio.productSpecificDocument')}
          subtitle={lang('documentStudio.productSpecificDescription')}
          icon={Package}
          onClick={handleProductSpecificDocument}
          gradientFrom="from-accent/10"
          gradientTo="to-accent/5"
          iconColor="text-accent"
          borderColor="border-accent/20"
          hoverBorderColor="hover:border-accent/40"
        />
      </div>
    </div>
  );
}