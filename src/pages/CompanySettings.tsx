import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConsistentPageHeader } from "@/components/layout/ConsistentPageHeader";
import { Button } from "@/components/ui/button";
import { Archive, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Workflow,
  FileText,
  BarChart3,
  ClipboardCheck,
  Users,
  UserCheck,
  Activity,
  Settings,
  Building2,
  
  Microscope,
  Contact,
  
} from "lucide-react";
import { hasAdminPrivileges } from "@/utils/roleUtils";
import { useAuth } from "@/context/AuthContext";
import { useReviewerGroups } from "@/hooks/useReviewerGroups";
import { useTranslation } from "@/hooks/useTranslation";

// Lazy load components to prevent build issues
const GeneralSettings = React.lazy(() => import("@/components/settings/GeneralSettings").then(m => ({ default: m.GeneralSettings })));
const LifecyclePhasesSettings = React.lazy(() => import("@/components/settings/LifecyclePhasesSettings").then(m => ({ default: m.LifecyclePhasesSettings })));
const DocumentControlSettings = React.lazy(() => import("@/components/settings/document-control/DocumentControlSettings").then(m => ({ default: m.DocumentControlSettings })));
const UserManagement = React.lazy(() => import("@/components/settings/UserManagement").then(m => ({ default: m.UserManagement })));
const StakeholdersTab = React.lazy(() => import("@/components/settings/StakeholdersTab").then(m => ({ default: m.StakeholdersTab })));
const GapAnalysisSettings = React.lazy(() => import("@/components/settings/GapAnalysisSettings").then(m => ({ default: m.GapAnalysisSettings })));
const ActivitySettings = React.lazy(() => import("@/components/settings/ActivitySettings").then(m => ({ default: m.ActivitySettings })));
const EmdnDataImporter = React.lazy(() => import("@/components/settings/EmdnDataImporter").then(m => ({ default: m.EmdnDataImporter })));

const CompanyEudamedImporter = React.lazy(() => import("@/components/settings/CompanyEudamedImporter").then(m => ({ default: m.CompanyEudamedImporter })));


const CIManagementSettings = React.lazy(() => import("@/components/settings/CIManagementSettings").then(m => ({ default: m.CIManagementSettings })));
const AuditTemplateConfiguration = React.lazy(() => import("@/components/audit-templates/AuditTemplateConfiguration").then(m => ({ default: m.AuditTemplateConfiguration })));
const ReviewGroupManager = React.lazy(() => import("@/components/product/ReviewGroupManager").then(m => ({ default: m.ReviewGroupManager })));

const ClinicalTrialsSettings = React.lazy(() => import("@/components/settings/ClinicalTrialsSettings").then(m => ({ default: m.ClinicalTrialsSettings })));


export default function CompanySettings() {
  const { companyName } = useParams<{ companyName: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("lifecycle-phases"); // Default to lifecycle phases tab
  const [nestedTab, setNestedTab] = useState("documents"); // Default nested tab for compliance-instances
  const [companyId, setCompanyId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const { reviewerGroups, isLoading: isReviewerGroupsLoading, refetch } = useReviewerGroups(companyId);
  const { lang } = useTranslation();
  // Get return path from URL parameters
  const returnPath = searchParams.get('returnTo');
  const hasReturnContext = Boolean(returnPath);
  const { userRole } = useAuth();
  // Set active tab from URL parameter - react to URL changes from L2 sidebar
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const submenuParam = searchParams.get('submenu');

    if (tabParam) {
      setActiveTab(tabParam);
    }
    if (submenuParam) {
      setNestedTab(submenuParam);
    }
  }, [searchParams]); // React to URL parameter changes

  // Handler for main tab change - updates URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', value);
    // Clear submenu when switching main tabs (except compliance-instances)
    if (value !== 'compliance-instances') {
      newParams.delete('submenu');
    } else {
      newParams.set('submenu', nestedTab);
    }
    setSearchParams(newParams, { replace: true });
  };

  // Handler for nested tab change - updates URL
  const handleNestedTabChange = (value: string) => {
    setNestedTab(value);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('submenu', value);
    setSearchParams(newParams, { replace: true });
  };

  useEffect(() => {
    const fetchCompanyId = async () => {
      if (!companyName) {
        toast.error("No company specified");
        navigate("/app");
        return;
      }

      try {
        const decodedCompanyName = decodeURIComponent(companyName);

        // Get current user to filter by access
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;

        // Look up company filtered by user's access to avoid duplicate name issues
        let { data, error } = await supabase
          .from("companies")
          .select("id, name, user_company_access!inner(user_id)")
          .eq("name", decodedCompanyName)
          .eq("user_company_access.user_id", userId || "")
          .limit(1)
          .single();

        // If exact match fails, try case-insensitive search
        if (error) {
          const { data: caseInsensitiveData, error: caseError } = await supabase
            .from("companies")
            .select("id, name, user_company_access!inner(user_id)")
            .ilike("name", decodedCompanyName)
            .eq("user_company_access.user_id", userId || "")
            .limit(1)
            .single();
          
          if (caseError) {
            // Try partial match as last resort
            const { data: partialData, error: partialError } = await supabase
              .from("companies")
              .select("id, name, user_company_access!inner(user_id)")
              .ilike("name", `%${decodedCompanyName}%`)
              .eq("user_company_access.user_id", userId || "")
              .limit(1)
              .single();
            
            if (partialError) {
              console.error("All company lookup methods failed:", {
                exact: error,
                caseInsensitive: caseError,
                partial: partialError
              });
              toast.error("Company not found");
              navigate("/app");
              return;
            }
            
            data = partialData;
          } else {
            data = caseInsensitiveData;
          }
        }

        setCompanyId(data.id);
        
      } catch (error) {
        console.error("Error in fetchCompanyId:", error);
        toast.error("Error loading company data");
        navigate("/app");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyId();
  }, [companyName, navigate]);

  const handleBackNavigation = () => {
    if (returnPath) {
      navigate(decodeURIComponent(returnPath));
    } else {
      navigate(`/app/company/${encodeURIComponent(companyName || "")}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">{lang('companySettings.loading')}</p>
        </div>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">{lang('companySettings.companyNotFound')}</h2>
          <p className="text-muted-foreground">{lang('companySettings.companyNotFoundDesc')}</p>
        </div>
      </div>
    );
  }

  // Build dynamic breadcrumbs based on context
  const breadcrumbs = [];

  // Always add company breadcrumb
  breadcrumbs.push({
    label: companyName || "",
    onClick: () => navigate(`/app/company/${encodeURIComponent(companyName || "")}`)
  });

  // Always add settings breadcrumb (non-clickable)
  breadcrumbs.push({
    label: lang('companySettings.title')
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ConsistentPageHeader
        breadcrumbs={breadcrumbs}
        title={`${companyName} ${lang('companySettings.title')}`}
        subtitle={lang('companySettings.subtitle')}
        actions={
          hasReturnContext ? (
            <>
              <Button
                variant="outline"
                onClick={handleBackNavigation}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {lang('companySettings.returnToProduct')}
              </Button>
              {hasAdminPrivileges(userRole) && (
                <Button asChild variant="outline">
                  <Link to="/app/archives">
                    <Archive className="h-4 w-4" />
                    <span>{lang('companySettings.archives')}</span>
                  </Link>
                </Button>
              )}
            </>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-y-auto" data-tour="company-settings">
        <div className="w-full py-2 pt-8">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-4 sm:space-y-6">
            <div className="w-full overflow-x-auto">
              <TabsList className="inline-flex h-auto bg-muted p-1 text-muted-foreground w-full min-w-max">
                <TabsTrigger value="lifecycle-phases" className="flex-shrink-0 px-3 py-1.5 text-sm whitespace-nowrap flex items-center gap-2">
                  <Workflow className="h-4 w-4" />
                  {lang('companySettings.tabs.lifecyclePhases')}
                </TabsTrigger>
                <TabsTrigger value="compliance-instances" className="flex-shrink-0 px-3 py-1.5 text-sm whitespace-nowrap flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  {lang('companySettings.tabs.complianceInstances')}
                </TabsTrigger>
                <TabsTrigger value="clinical-trials" className="flex-shrink-0 px-3 py-1.5 text-sm whitespace-nowrap flex items-center gap-2">
                  <Microscope className="h-4 w-4" />
                  {lang('companySettings.tabs.clinicalTrials')}
                </TabsTrigger>
                <TabsTrigger value="users" className="flex-shrink-0 px-3 py-1.5 text-sm whitespace-nowrap flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {lang('companySettings.tabs.users')}
                </TabsTrigger>
                <TabsTrigger value="stakeholders" className="flex-shrink-0 px-3 py-1.5 text-sm whitespace-nowrap flex items-center gap-2">
                  <Contact className="h-4 w-4" />
                  {lang('companySettings.tabs.stakeholders')}
                </TabsTrigger>
                <TabsTrigger value="reviewers" className="flex-shrink-0 px-3 py-1.5 text-sm whitespace-nowrap flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  {lang('companySettings.tabs.reviewers')}
                </TabsTrigger>
                <TabsTrigger value="general" className="flex-shrink-0 px-3 py-1.5 text-sm whitespace-nowrap flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {lang('companySettings.tabs.general')}
                </TabsTrigger>
              </TabsList>
            </div>

            <React.Suspense fallback={<div className="text-center py-8">{lang('common.loading')}</div>}>
              <TabsContent value="lifecycle-phases" className="space-y-6">
                <LifecyclePhasesSettings companyId={companyId} />
              </TabsContent>

              <TabsContent value="compliance-instances" className="space-y-6">
                <Tabs value={nestedTab} onValueChange={handleNestedTabChange} className="w-full">
                  <TabsList className="inline-flex h-auto bg-muted p-1 text-muted-foreground w-full">
                    <TabsTrigger value="documents" className="flex-shrink-0 px-3 py-1.5 text-sm whitespace-nowrap flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {lang('companySettings.complianceTabs.documentCIs')}
                    </TabsTrigger>
                    <TabsTrigger value="gap-analysis" className="flex-shrink-0 px-3 py-1.5 text-sm whitespace-nowrap flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      {lang('companySettings.complianceTabs.gapAnalysis')}
                    </TabsTrigger>
                    <TabsTrigger value="activities" className="flex-shrink-0 px-3 py-1.5 text-sm whitespace-nowrap flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      {lang('companySettings.complianceTabs.activities')}
                    </TabsTrigger>
                    <TabsTrigger value="audits" className="flex-shrink-0 px-3 py-1.5 text-sm whitespace-nowrap flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4" />
                      {lang('companySettings.complianceTabs.audits')}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="documents" className="space-y-6 mt-6">
                    <DocumentControlSettings />
                  </TabsContent>

                  <TabsContent value="gap-analysis" className="space-y-6 mt-6">
                    <GapAnalysisSettings companyId={companyId} />
                  </TabsContent>

                  <TabsContent value="activities" className="space-y-6 mt-6">
                    <ActivitySettings companyId={companyId} />
                  </TabsContent>

                  <TabsContent value="audits" className="space-y-6 mt-6">
                    <AuditTemplateConfiguration companyId={companyId} />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="clinical-trials" className="space-y-6">
                <ClinicalTrialsSettings companyId={companyId} />
              </TabsContent>



              <TabsContent value="users" className="space-y-6">
                <UserManagement companyId={companyId} />
              </TabsContent>

              <TabsContent value="stakeholders" className="space-y-6">
                <StakeholdersTab companyId={companyId} companyName={companyName ? decodeURIComponent(companyName) : undefined} />
              </TabsContent>

              <TabsContent value="reviewers" className="space-y-6">
                {companyId && (
                  <ReviewGroupManager
                    groups={reviewerGroups}
                    onGroupUpdate={async (group) => {
                      // The hook will handle the update automatically
                      await refetch();
                    }}
                    onGroupCreate={async (group) => {
                      // The hook will handle the creation automatically
                      await refetch();
                    }}
                    onGroupDelete={async (groupId) => {
                      // The hook will handle the deletion automatically
                      await refetch();
                    }}
                    showPermissions={true}
                    companyId={companyId}
                  />
                )}
              </TabsContent>


              <TabsContent value="general" className="space-y-6">
                <GeneralSettings
                  companyId={companyId}
                  companyName={companyName || ""}
                />
              </TabsContent>

            </React.Suspense>
          </Tabs>
        </div>
      </div>
    </div>
  );
}