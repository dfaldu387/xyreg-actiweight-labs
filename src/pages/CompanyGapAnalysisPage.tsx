import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Filter, BarChart2, Shield, Globe } from "lucide-react";
import { GapAnalysis } from "@/components/product/GapAnalysis";
import { supabase } from "@/integrations/supabase/client";
import { GapAnalysisItem } from "@/types/client";
import { iso13485 } from "@/data/gapAnalysisItems";
import { GapISO13485LaunchView } from "@/components/company/gap-analysis/GapISO13485LaunchView";
import { GapISO13485Sidebar } from "@/components/company/gap-analysis/GapISO13485Sidebar";
import { GenericGapLaunchView } from "@/components/company/gap-analysis/GenericGapLaunchView";
import { GenericGapSidebar } from "@/components/company/gap-analysis/GenericGapSidebar";
import { ISO_14971_ENTERPRISE_SECTIONS, ISO_14971_ENTERPRISE_GROUPS } from "@/config/gapISO14971Sections";
import { CMDR_SECTIONS, CMDR_GROUPS } from "@/config/gapCMDRSections";
import { TGA_SECTIONS, TGA_GROUPS } from "@/config/gapTGASections";
import { PMDA_SECTIONS, PMDA_GROUPS } from "@/config/gapPMDASections";
import { NMPA_SECTIONS, NMPA_GROUPS } from "@/config/gapNMPASections";
import { ANVISA_SECTIONS, ANVISA_GROUPS } from "@/config/gapANVISASections";
import { CDSCO_SECTIONS, CDSCO_GROUPS } from "@/config/gapCDSCOSections";
import { UKCA_MDR_SECTIONS, UKCA_MDR_GROUPS } from "@/config/gapUKCAMDRSections";
import { MEPSW_SECTIONS, MEPSW_GROUPS } from "@/config/gapMEPSWSections";
import { KFDA_SECTIONS, KFDA_GROUPS } from "@/config/gapKFDASections";
import { ConsistentPageHeader } from "@/components/layout/ConsistentPageHeader";
import { buildCompanyBreadcrumbs } from "@/utils/breadcrumbUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { fetchCompanyGapItems } from "@/services/gapAnalysisService";
import { useRestrictedFeature } from '@/contexts/RestrictedFeatureContext';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { PORTFOLIO_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { RestrictedFeatureProvider } from '@/contexts/RestrictedFeatureContext';
import { RestrictedPreviewBanner } from '@/components/subscription/RestrictedPreviewBanner';
import { useTranslation } from '@/hooks/useTranslation';
import { useStandardVersionStatus } from '@/hooks/useStandardVersionStatus';
export default function CompanyGapAnalysisPage() {
  const { companyName } = useParams<{ companyName: string }>();
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gapItems, setGapItems] = useState<GapAnalysisItem[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>(["compliant", "partially_compliant", "non_compliant", "not_applicable"]);
  const [activeTab, setActiveTab] = useState("iso-13485");
  const decodedCompanyName = companyName ? decodeURIComponent(companyName) : "";
  const { data: standardStatuses } = useStandardVersionStatus();
  const getStatus = (key: string) => standardStatuses?.find(s => s.framework_key === key);

  // Restriction check
  const { isMenuAccessKeyEnabled, planName } = usePlanMenuAccess();
  const isFeatureEnabled = isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.COMPLIANCE_GAP_ANALYSIS);
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
      label: lang('gapAnalysis.breadcrumbs.clientCompass'),
      onClick: handleNavigateToClients
    },
    {
      label: decodedCompanyName,
      onClick: handleNavigateToCompany
    },
    {
      label: lang('gapAnalysis.breadcrumbs.complianceInstances'),
      onClick: handleNavigateToComplianceInstances
    },
    {
      label: lang('gapAnalysis.breadcrumbs.gapAnalysis')
    }
  ];

  // Handle status filter changes
  const handleStatusFilterChange = (status: string) => {
    if (statusFilter.includes(status)) {
      setStatusFilter(statusFilter.filter(s => s !== status));
    } else {
      setStatusFilter([...statusFilter, status]);
    }
  };

  // Filter items by selected status
  const filteredGapItems = gapItems.filter(item => 
    !item.status || statusFilter.includes(item.status)
  );

  const fetchCompanyGapItemsData = async () => {
    if (!companyName) {
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('name', decodedCompanyName)
        .single();

      if (companyError) {
        throw new Error('Company not found');
      }

      const companyId = companyData.id;
      setCompanyId(companyId);

      const companyGapItems = await fetchCompanyGapItems(companyId);
      setGapItems(companyGapItems);
    } catch {
      setError(lang('gapAnalysis.failedToLoad'));
      setGapItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCompanyGapItemsData();
  }, [companyName, decodedCompanyName]);

  const headerActions = (
    <>
      <Button
        variant="outline"
        onClick={() => !isRestricted && navigate(`/app/company/${encodeURIComponent(decodedCompanyName)}/mdr-annex-i`)}
        className="flex gap-2"
        disabled={isRestricted}
      >
        <BarChart2 className="size-4" />
        <span>{lang('gapAnalysis.actions.viewMdrAnnexI')}</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex gap-2" disabled={isRestricted}>
            <Filter className="size-4" />
            <span>{lang('gapAnalysis.actions.filter')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{lang('gapAnalysis.filter.status')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={statusFilter.includes("compliant")}
            onCheckedChange={() => !isRestricted && handleStatusFilterChange("compliant")}
          >
            {lang('gapAnalysis.filter.closed')}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={statusFilter.includes("non_compliant") || statusFilter.includes("partially_compliant")}
            onCheckedChange={() => {
              if (isRestricted) return;
              handleStatusFilterChange("non_compliant");
              handleStatusFilterChange("partially_compliant");
            }}
          >
            {lang('gapAnalysis.filter.open')}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={statusFilter.includes("not_applicable")}
            onCheckedChange={() => !isRestricted && handleStatusFilterChange("not_applicable")}
          >
            {lang('gapAnalysis.filter.notApplicable')}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <RestrictedFeatureProvider
      isRestricted={isRestricted}
      planName={planName}
      featureName={lang('gapAnalysis.featureName')}
    >
      <div className="flex h-full min-h-0 flex-col">
        <ConsistentPageHeader
          breadcrumbs={breadcrumbs}
          title={lang('gapAnalysis.pageTitle').replace('{{companyName}}', decodedCompanyName)}
          subtitle={lang('gapAnalysis.subtitle')}
          actions={headerActions}
        />

        {isRestricted && <RestrictedPreviewBanner className="mt-6 !mb-0" />}

        <div className="flex-1 overflow-y-auto">
          <div className="w-full pt-4" data-tour="gap-analysis">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 flex-wrap h-auto gap-1">
                <TabsTrigger value="iso-13485">ISO 13485</TabsTrigger>
                <TabsTrigger value="iso-14971">ISO 14971</TabsTrigger>
                <TabsTrigger value="cmdr">CMDR (Canada)</TabsTrigger>
                <TabsTrigger value="tga">TGA (Australia)</TabsTrigger>
                <TabsTrigger value="pmda">PMDA (Japan)</TabsTrigger>
                <TabsTrigger value="nmpa">NMPA (China)</TabsTrigger>
                <TabsTrigger value="anvisa">ANVISA (Brazil)</TabsTrigger>
                <TabsTrigger value="cdsco">CDSCO (India)</TabsTrigger>
                <TabsTrigger value="ukca">UKCA (UK)</TabsTrigger>
                <TabsTrigger value="mepsw">MepV (Switzerland)</TabsTrigger>
                <TabsTrigger value="kfda">KFDA (S. Korea)</TabsTrigger>
              </TabsList>

              <TabsContent value="iso-13485">
                <div className="relative">
                  <GapISO13485LaunchView items={filteredGapItems} disabled={isRestricted} companyId={companyId || undefined} companyName={decodedCompanyName} standardStatus={getStatus('ISO_13485')} />
                  <GapISO13485Sidebar items={filteredGapItems} disabled={isRestricted} />
                </div>
              </TabsContent>

              <TabsContent value="iso-14971">
                <div className="relative">
                  <GenericGapLaunchView
                    sections={ISO_14971_ENTERPRISE_SECTIONS}
                    groups={ISO_14971_ENTERPRISE_GROUPS}
                    items={filteredGapItems}
                    standardName="ISO 14971:2019 — Risk Management Process"
                    standardTag="ISO 14971"
                    standardIcon={Shield}
                    bannerDescription="Enterprise-level risk management process requirements: defining the organizational risk management process, management responsibilities, and personnel qualification."
                    disabled={isRestricted}
                    standardStatus={getStatus('ISO_14971')}
                  />
                  <GenericGapSidebar
                    sections={ISO_14971_ENTERPRISE_SECTIONS}
                    groups={ISO_14971_ENTERPRISE_GROUPS}
                    items={filteredGapItems}
                    standardLabel="ISO 14971 Process"
                    standardIcon={Shield}
                    disabled={isRestricted}
                    framework="ISO 14971"
                  />
                </div>
              </TabsContent>

              <TabsContent value="cmdr">
                <div className="relative">
                  <GenericGapLaunchView sections={CMDR_SECTIONS} groups={CMDR_GROUPS} items={filteredGapItems} standardName="CMDR — Canadian Medical Device Regulations" standardTag="CMDR" standardIcon={Globe} bannerDescription="Canadian medical device regulatory requirements: device classification, licensing, establishment licensing, labelling, mandatory problem reporting, and MDSAP." disabled={isRestricted} />
                  <GenericGapSidebar sections={CMDR_SECTIONS} groups={CMDR_GROUPS} items={filteredGapItems} standardLabel="CMDR Canada" standardIcon={Globe} disabled={isRestricted} framework="CMDR" />
                </div>
              </TabsContent>

              <TabsContent value="tga">
                <div className="relative">
                  <GenericGapLaunchView sections={TGA_SECTIONS} groups={TGA_GROUPS} items={filteredGapItems} standardName="TGA — Australian Therapeutic Goods Act" standardTag="TGA" standardIcon={Globe} bannerDescription="Australian regulatory requirements: device classification, sponsor registration, ARTG inclusion, conformity assessment, essential principles, and post-market obligations." disabled={isRestricted} />
                  <GenericGapSidebar sections={TGA_SECTIONS} groups={TGA_GROUPS} items={filteredGapItems} standardLabel="TGA Australia" standardIcon={Globe} disabled={isRestricted} framework="TGA" />
                </div>
              </TabsContent>

              <TabsContent value="pmda">
                <div className="relative">
                  <GenericGapLaunchView sections={PMDA_SECTIONS} groups={PMDA_GROUPS} items={filteredGapItems} standardName="PMDA — Japan PMD Act" standardTag="PMDA" standardIcon={Globe} bannerDescription="Japanese regulatory requirements: device classification, MAH designation, QMS compliance, clinical evaluation, labelling, and post-market surveillance." disabled={isRestricted} />
                  <GenericGapSidebar sections={PMDA_SECTIONS} groups={PMDA_GROUPS} items={filteredGapItems} standardLabel="PMDA Japan" standardIcon={Globe} disabled={isRestricted} framework="PMDA" />
                </div>
              </TabsContent>

              <TabsContent value="nmpa">
                <div className="relative">
                  <GenericGapLaunchView sections={NMPA_SECTIONS} groups={NMPA_GROUPS} items={filteredGapItems} standardName="NMPA — China Medical Device Regulations" standardTag="NMPA" standardIcon={Globe} bannerDescription="Chinese regulatory requirements: device classification, registration dossier, GMP compliance, clinical evaluation, Chinese labelling, and type testing." disabled={isRestricted} />
                  <GenericGapSidebar sections={NMPA_SECTIONS} groups={NMPA_GROUPS} items={filteredGapItems} standardLabel="NMPA China" standardIcon={Globe} disabled={isRestricted} framework="NMPA" />
                </div>
              </TabsContent>

              <TabsContent value="anvisa">
                <div className="relative">
                  <GenericGapLaunchView sections={ANVISA_SECTIONS} groups={ANVISA_GROUPS} items={filteredGapItems} standardName="ANVISA — Brazil RDC 751/2022" standardTag="ANVISA" standardIcon={Globe} bannerDescription="Brazilian regulatory requirements: device classification, ANVISA registration, GMP compliance, clinical evidence, Portuguese labelling, and tecnovigilância." disabled={isRestricted} />
                  <GenericGapSidebar sections={ANVISA_SECTIONS} groups={ANVISA_GROUPS} items={filteredGapItems} standardLabel="ANVISA Brazil" standardIcon={Globe} disabled={isRestricted} framework="ANVISA" />
                </div>
              </TabsContent>

              <TabsContent value="cdsco">
                <div className="relative">
                  <GenericGapLaunchView sections={CDSCO_SECTIONS} groups={CDSCO_GROUPS} items={filteredGapItems} standardName="CDSCO — India Medical Device Rules 2017" standardTag="CDSCO" standardIcon={Globe} bannerDescription="Indian regulatory requirements: device classification, registration, QMS compliance, clinical investigation, labelling, and post-market vigilance." disabled={isRestricted} />
                  <GenericGapSidebar sections={CDSCO_SECTIONS} groups={CDSCO_GROUPS} items={filteredGapItems} standardLabel="CDSCO India" standardIcon={Globe} disabled={isRestricted} framework="CDSCO" />
                </div>
              </TabsContent>

              <TabsContent value="ukca">
                <div className="relative">
                  <GenericGapLaunchView sections={UKCA_MDR_SECTIONS} groups={UKCA_MDR_GROUPS} items={filteredGapItems} standardName="UKCA — UK MDR 2002 (MHRA)" standardTag="UKCA" standardIcon={Globe} bannerDescription="UK regulatory requirements: device classification, UKCA marking, UK Responsible Person, MHRA registration, Approved Body assessment, and essential requirements." disabled={isRestricted} />
                  <GenericGapSidebar sections={UKCA_MDR_SECTIONS} groups={UKCA_MDR_GROUPS} items={filteredGapItems} standardLabel="UKCA UK" standardIcon={Globe} disabled={isRestricted} framework="UKCA" />
                </div>
              </TabsContent>

              <TabsContent value="mepsw">
                <div className="relative">
                  <GenericGapLaunchView sections={MEPSW_SECTIONS} groups={MEPSW_GROUPS} items={filteredGapItems} standardName="MepV — Swiss Medical Device Ordinance" standardTag="MepV" standardIcon={Globe} bannerDescription="Swiss regulatory requirements: device classification, CH-REP, Swissmedic registration, conformity assessment, essential requirements, and post-market surveillance." disabled={isRestricted} />
                  <GenericGapSidebar sections={MEPSW_SECTIONS} groups={MEPSW_GROUPS} items={filteredGapItems} standardLabel="MepV Switzerland" standardIcon={Globe} disabled={isRestricted} framework="MepV" />
                </div>
              </TabsContent>

              <TabsContent value="kfda">
                <div className="relative">
                  <GenericGapLaunchView sections={KFDA_SECTIONS} groups={KFDA_GROUPS} items={filteredGapItems} standardName="KFDA — South Korea MFDS" standardTag="KFDA" standardIcon={Globe} bannerDescription="South Korean regulatory requirements: device classification, MFDS approval pathway, KGMP compliance, product testing, clinical evaluation, and Korean labelling." disabled={isRestricted} />
                  <GenericGapSidebar sections={KFDA_SECTIONS} groups={KFDA_GROUPS} items={filteredGapItems} standardLabel="KFDA South Korea" standardIcon={Globe} disabled={isRestricted} framework="KFDA" />
                </div>
              </TabsContent>

            </Tabs>
          </div>
        </div>
      </div>
    </RestrictedFeatureProvider>
  );
}
