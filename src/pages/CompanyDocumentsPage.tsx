
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { DocumentScopeManager } from "@/components/documents/DocumentScopeManager";
import { ConsistentPageHeader } from "@/components/layout/ConsistentPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ComplianceSection } from "@/components/compliance/ComplianceSection";
import { CompanyDocumentSyncPage } from "@/components/documents/CompanyDocumentSyncPage";
import { ReferenceDocumentsTab } from "@/components/document-composer/ReferenceDocumentsTab";
import { TemplatesSettings } from "@/components/settings/TemplatesSettings";
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { PORTFOLIO_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { RestrictedFeatureProvider } from '@/contexts/RestrictedFeatureContext';
import { RestrictedPreviewBanner } from '@/components/subscription/RestrictedPreviewBanner';

function CompanyDocumentsPage() {
  const { companyName } = useParams<{ companyName: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const activeTab = searchParams.get('tab') || 'documents';
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { companyRoles, isLoading: rolesLoading } = useCompanyRole();

  // Restriction check - double security pattern (hooks must be called before any conditional returns)
  const { isMenuAccessKeyEnabled, planName } = usePlanMenuAccess();
  const isFeatureEnabled = isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.COMPLIANCE_DOCUMENTS);
  const isRestricted = !isFeatureEnabled;

  // Navigation handler for company breadcrumb
  const navigateToCompanyDashboard = () => {
    if (companyName) {
      navigate(`/app/company/${encodeURIComponent(companyName)}`);
    }
  };

  // Navigation handler for compliance instances
  const navigateToComplianceInstances = () => {
    if (companyName) {
      navigate(`/app/company/${encodeURIComponent(companyName)}/compliance-instances`);
    }
  };

  // Resolve company ID from roles first, then fallback to user-scoped DB query
  useEffect(() => {
    const resolveCompanyId = async () => {
      if (!companyName || rolesLoading) return;

      try {
        setIsLoading(true);
        const decodedName = decodeURIComponent(companyName);

        // Check user's roles first (same pattern as useCompanyId)
        const matchingRole = companyRoles.find(
          (role) => role.companyName.toLowerCase() === decodedName.toLowerCase()
        );

        if (matchingRole) {
          setCompanyId(matchingRole.companyId);
          return;
        }

        // Fallback: user-scoped DB query
        const { data: { user } } = await supabase.auth.getUser();
        const { data: companies, error } = await supabase
          .from("companies")
          .select("id, user_company_access!inner(user_id)")
          .eq("name", decodedName)
          .eq("user_company_access.user_id", user?.id || "")
          .limit(1);

        if (!error && companies && companies.length > 0) {
          setCompanyId(companies[0].id);
        } else {
          setCompanyId(null);
        }
      } catch {
        setCompanyId(null);
      } finally {
        setIsLoading(false);
      }
    };

    resolveCompanyId();
  }, [companyName, companyRoles, rolesLoading]);

  if (isLoading) {
    return (
      <div className="w-full max-w-full">
        <ConsistentPageHeader
          breadcrumbs={[
            { label: decodeURIComponent(companyName || ""), onClick: navigateToCompanyDashboard },
            { label: 'Compliance Instances', onClick: navigateToComplianceInstances },
            { label: 'Documents' }
          ]}
          title={`${decodeURIComponent(companyName || "")} Documents`}
          subtitle="Manage company-level documentation"
        />
        <div className="px-6 py-6">
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="w-full max-w-full">
        <ConsistentPageHeader
          breadcrumbs={[
            { label: decodeURIComponent(companyName || ""), onClick: navigateToCompanyDashboard },
            { label: 'Compliance Instances', onClick: navigateToComplianceInstances },
            { label: 'Documents' }
          ]}
          title={`${decodeURIComponent(companyName || "")} Documents`}
          subtitle="Manage company-level documentation"
        />
        <div className="px-6 py-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-destructive">Company Not Found</h1>
            <p className="text-muted-foreground mt-2">
              The company "{decodeURIComponent(companyName || "")}" could not be found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbs = [
    {
      label: decodeURIComponent(companyName || ""),
      onClick: navigateToCompanyDashboard
    },
    {
      label: 'Compliance Instances',
      onClick: navigateToComplianceInstances
    },
    {
      label: 'Documents'
    }
  ];

  // If mode=sync, show the sync page
  if (mode === 'dev') {
    return (
      <RestrictedFeatureProvider
        isRestricted={isRestricted}
        planName={planName}
        featureName="Documents"
      >
        <div className="flex h-full min-h-0 flex-col">
          {/* Sticky Header */}
          <ConsistentPageHeader
            breadcrumbs={[
              ...breadcrumbs.slice(0, -1),
              { label: 'Documents', onClick: () => navigate(`/app/company/${encodeURIComponent(companyName || '')}/documents`) },
              { label: 'Sync Info' }
            ]}
            title="Document Sync Info"
            subtitle={`Sync statistics for ${decodeURIComponent(companyName || "")}`}
          />

          {isRestricted && <RestrictedPreviewBanner className="mt-6 !mb-0" />}

          {/* Sync Page Content */}
          <div className="flex-1 overflow-y-auto">
            <CompanyDocumentSyncPage
              companyId={companyId}
              companyName={decodeURIComponent(companyName || "")}
            />
          </div>
        </div>
      </RestrictedFeatureProvider>
    );
  }

  return (
    <RestrictedFeatureProvider
      isRestricted={isRestricted}
      planName={planName}
      featureName="Documents"
    >
      <div className="flex h-full min-h-0 flex-col">
        {/* Sticky Header */}
        <ConsistentPageHeader
          breadcrumbs={breadcrumbs}
          title={`${decodeURIComponent(companyName || "")} Documents`}
          subtitle="Manage company-level documentation"
        />

        {isRestricted && <RestrictedPreviewBanner className="mt-6 !mb-0" />}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full flex flex-col gap-6 pt-6" data-tour="documents">
            <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })} className="w-full">
              <div className="px-6">
                <TabsList>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="reference">Reference Documents</TabsTrigger>
                  <TabsTrigger value="templates">Enterprise Templates</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="documents">
                <ComplianceSection companyId={companyId} companyName={companyName} disabled={isRestricted} />
              </TabsContent>
              <TabsContent value="reference" className="px-6">
                <ReferenceDocumentsTab companyId={companyId} disabled={isRestricted} />
              </TabsContent>
              <TabsContent value="templates" className="px-6">
                <TemplatesSettings companyId={companyId} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </RestrictedFeatureProvider>
  );
}

export default CompanyDocumentsPage;
