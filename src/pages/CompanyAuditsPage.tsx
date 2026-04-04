import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { AuditTable } from "@/components/audit/AuditTable";
import { useCompanyAudits } from "@/hooks/useCompanyAudits";
import { CompanyAudit } from "@/types/audit";
import { AuditFormData } from "@/components/audit/AuditForm";
import { AuditDialog } from "@/components/audit/AuditDialog";
import { AvailableAuditTemplates } from "@/components/audit-templates/AvailableAuditTemplates";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { ConsistentPageHeader } from "@/components/layout/ConsistentPageHeader";
import { buildCompanyBreadcrumbs } from "@/utils/breadcrumbUtils";
import { SupplierAuditService } from "@/services/supplierAuditService";
import { toast } from "sonner";
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { PORTFOLIO_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { RestrictedFeatureProvider } from '@/contexts/RestrictedFeatureContext';
import { RestrictedPreviewBanner } from '@/components/subscription/RestrictedPreviewBanner';
import { useTranslation } from "@/hooks/useTranslation";

export default function CompanyAuditsPage() {
  const navigate = useNavigate();
  const { companyName } = useParams<{ companyName: string }>();
  const [companyId, setCompanyId] = useState<string>("");
  const [currentAudit, setCurrentAudit] = useState<CompanyAudit | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isFixingSupplierAudits, setIsFixingSupplierAudits] = useState(false);
  const decodedCompanyName = companyName ? decodeURIComponent(companyName) : "";
  const { lang } = useTranslation();

  // Restriction check - double security pattern (hooks must be called before any conditional returns)
  const { isMenuAccessKeyEnabled, planName } = usePlanMenuAccess();
  const isFeatureEnabled = isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.COMPLIANCE_AUDITS);
  const isRestricted = !isFeatureEnabled;
  
  const handleNavigateToClients = () => {
    navigate('/app/clients');
  };

  const handleNavigateToCompany = () => {
    navigate(`/app/company/${encodeURIComponent(decodedCompanyName)}`);
  };

  const handleNavigateToComplianceInstances = () => {
    navigate(`/app/company/${encodeURIComponent(decodedCompanyName)}/compliance-instances`);
  };

  const breadcrumbs = [
    {
      label: lang('clients.clientCompass'),
      onClick: handleNavigateToClients
    },
    {
      label: decodedCompanyName,
      onClick: handleNavigateToCompany
    },
    {
      label: lang('sidebar.menuItems.complianceInstances'),
      onClick: handleNavigateToComplianceInstances
    },
    {
      label: lang('sidebar.menuItems.audits')
    }
  ];
  
  // Fetch company ID from company name
  useEffect(() => {
    const fetchCompanyId = async () => {
      if (!companyName) return;
      
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('id')
          .eq('name', decodeURIComponent(companyName))
          .single();
        
        if (error) {
          return;
        }
        
        if (data) {
          setCompanyId(data.id);
        }
      } catch {
        // Error fetching company ID
      }
    };
    
    fetchCompanyId();
  }, [companyName]);
  
  const { audits, loading, error, addAudit, updateAudit, removeAudit, refetch } = useCompanyAudits(companyId);

  const handleAddAudit = async (formData: AuditFormData) => {
    await addAudit(formData);
  };

  const handleEditAudit = (audit: CompanyAudit) => {
    setCurrentAudit(audit);
    setEditDialogOpen(true);
  };

  const handleUpdateAudit = async (formData: AuditFormData) => {
    if (!currentAudit) return;
    await updateAudit(currentAudit.id, formData);
    setCurrentAudit(null);
    setEditDialogOpen(false);
  };

  const handleDeleteAudit = async (id: string) => {
    await removeAudit(id);
  };

  const handleAuditUpdate = async (id: string, updates: Partial<CompanyAudit>) => {
    // Convert audit updates to form data format
    const formattedUpdates: AuditFormData = {
      auditName: updates.audit_name || "",
      auditType: updates.audit_type || "",
      deadlineDate: updates.deadline_date ? new Date(updates.deadline_date) : undefined,
      status: updates.status || "Planned",
      responsiblePersonId: updates.responsible_person_id,
      notes: updates.notes,
      // Add completion fields
      completionDate: updates.completion_date ? new Date(updates.completion_date) : undefined,
      leadAuditorName: updates.lead_auditor_name,
      actualAuditDuration: updates.actual_audit_duration,
      executiveSummary: updates.executive_summary,
      overallAssessment: updates.overall_assessment,
      closeOutActionsSummary: updates.close_out_actions_summary
    };
    
    await updateAudit(id, formattedUpdates);
  };

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold text-destructive">{lang('audits.page.errorTitle')}</h2>
            <p className="text-muted-foreground">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Filter audits based on active tab
  const getFilteredAudits = () => {
    if (activeTab === "all") return audits;
    return audits.filter(audit => audit.status.toLowerCase().replace(" ", "-") === activeTab);
  };

  const handleFixSupplierAudits = async () => {
    if (!companyId || isRestricted) return;

    setIsFixingSupplierAudits(true);
    try {
      const result = await SupplierAuditService.createMissingSupplierAudits(companyId);
      toast.success(result.message);
      // Refresh audits list
      await refetch();
    } catch {
      toast.error(lang('audits.toasts.fixSupplierAuditsFailed'));
    } finally {
      setIsFixingSupplierAudits(false);
    }
  };

  return (
    <RestrictedFeatureProvider
      isRestricted={isRestricted}
      planName={planName}
      featureName={lang('sidebar.menuItems.audits')}
    >
      <TooltipProvider>
        <div className="flex h-full min-h-0 flex-col">
          <ConsistentPageHeader
            breadcrumbs={breadcrumbs}
            title={lang('audits.page.titleCompany').replace('{{companyName}}', decodedCompanyName)}
            subtitle={lang('audits.page.subtitleCompany')}
          />

          {isRestricted && <RestrictedPreviewBanner className="mt-6 !mb-0" />}

          <div className="flex-1 overflow-y-auto">
            <div className="w-full pt-6">
              {/* Available Audit Templates Section */}
              {companyId && (
                <AvailableAuditTemplates
                  companyId={companyId}
                  scope="company"
                  title={lang('audits.templates.titleCompany').replace('{{companyName}}', decodedCompanyName)}
                  onCreateAuditInstance={handleAddAudit}
                  disabled={isRestricted}
                />
              )}

              {/* Company Audit Instances Section */}
              <div className="space-y-1">
                <Separator className="mb-4" />

                {/* Added headline for audit instances */}
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{lang('audits.instances.titleCompany')}</h2>
                    <p className="text-sm text-muted-foreground">
                      {lang('audits.instances.subtitleCompany')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFixSupplierAudits}
                    disabled={isFixingSupplierAudits || !companyId || isRestricted}
                    className="gap-2"
                  >
                    {isFixingSupplierAudits ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {isFixingSupplierAudits ? lang('audits.actions.creating') : lang('audits.actions.fixMissingSupplierAudits')}
                  </Button>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList>
                    <TabsTrigger value="all">
                      {lang('audits.tabs.allWithCount').replace('{{count}}', String(audits.length))}
                    </TabsTrigger>
                    <TabsTrigger value="planned">{lang('audits.tabs.planned')}</TabsTrigger>
                    <TabsTrigger value="in-progress">{lang('audits.tabs.inProgress')}</TabsTrigger>
                    <TabsTrigger value="completed">{lang('audits.tabs.completed')}</TabsTrigger>
                    <TabsTrigger value="overdue">{lang('audits.tabs.overdue')}</TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab} className="mt-4">
                    <Card>
                      <CardContent className="p-6">
                        <AuditTable
                          audits={getFilteredAudits()}
                          type="company"
                          onEdit={handleEditAudit}
                          onDelete={handleDeleteAudit}
                          onUpdate={handleAuditUpdate}
                          disabled={isRestricted}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Edit Audit Dialog */}
              <AuditDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onSubmit={handleUpdateAudit}
                initialData={currentAudit ? {
                  auditName: currentAudit.audit_name,
                  auditType: currentAudit.audit_type,
                  deadlineDate: currentAudit.deadline_date ? new Date(currentAudit.deadline_date) : undefined,
                  status: currentAudit.status,
                  responsiblePersonId: currentAudit.responsible_person_id,
                  notes: currentAudit.notes
                } : undefined}
                formType="company"
                title={lang('audits.dialogs.editTitleCompany')}
                description={lang('audits.dialogs.editDescCompany')}
                companyId={companyId}
              />
            </div>
          </div>
        </div>
      </TooltipProvider>
    </RestrictedFeatureProvider>
  );
}
