import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { countries } from "@/data/countries";
import { CURRENCIES, getCurrencySymbol } from "@/utils/currencyUtils";
import { useTemplateSettings } from "@/hooks/useTemplateSettings";
import { ChevronDown, DollarSign, Building, Factory, LayoutGrid, Clock, FileText, Settings, Users, Layers, Calendar, ClipboardList, FolderOpen } from "lucide-react";
import { useCompanyDateFormat } from "@/hooks/useCompanyDateFormat";
import { DATE_FORMAT_OPTIONS, formatDisplayDate } from "@/lib/dateFormat";
import { ProductPortfolioStructureSettings } from "../ProductPortfolioStructureSettings";
import { CompanyDataUpdateService } from "@/services/companyDataUpdateService";
import { toast } from "sonner";
import { CompanyLogoUpload } from "@/components/company/CompanyLogoUpload";
import { useTranslation } from "@/hooks/useTranslation";

import { DocumentCategoryNumberingSystem } from "../DocumentCategoryNumberingSystem";

import { DocumentTypeSettings } from "../DocumentTypeSettings";


interface CompanyProfileTabProps {
  company: any;
  companyId: string;
  companyName: string;
  isSaving: boolean;
  onInputChange: (field: string, value: any) => void;
  onSave: (section: string) => void;
}

export function CompanyProfileTab({
  company,
  companyId,
  companyName,
  isSaving,
  onInputChange,
  onSave
}: CompanyProfileTabProps) {
  const { lang } = useTranslation();
  const [searchParams] = useSearchParams();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [retentionPeriodsOpen, setRetentionPeriodsOpen] = useState(false);
  const [edmSystemOpen, setEdmSystemOpen] = useState(false);
  const [manufacturerOpen, setManufacturerOpen] = useState(false);
  const [productionOpen, setProductionOpen] = useState(false);
  const [portfolioStructureOpen, setPortfolioStructureOpen] = useState(() => searchParams.get('section') === 'portfolio-structure');

  // Auto-scroll to variation dimensions when arriving from Company Dimensions button
  useEffect(() => {
    if (searchParams.get('section') === 'portfolio-structure' && searchParams.get('returnTo') === 'variants') {
      const timer = setTimeout(() => {
        const el = document.getElementById('variation-dimensions');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);
  
  
  const [documentDueDateOpen, setDocumentDueDateOpen] = useState(false);
  const [dateFormatOpen, setDateFormatOpen] = useState(false);
  

  // Date format hook
  const { dateFormat, updateDateFormat, isUpdating: isUpdatingDateFormat } = useCompanyDateFormat(companyId);

  // Retention periods state
  const [retentionPeriods, setRetentionPeriods] = useState({
    sops: '7 years',
    qualityRecords: '10 years',
    designFiles: 'Lifetime + 15 years',
    clinicalData: '25 years'
  });
  const [loadingRetentionPeriods, setLoadingRetentionPeriods] = useState(false);



  // EDM System state
  const [edmSystem, setEdmSystem] = useState({
    platform: 'SharePoint',
    validationStatus: 'Validated',
    accessControls: 'Role-based',
    backupSchedule: 'Daily',
    auditTrail: 'Enabled',
    electronicSignatures: 'Enabled',
    integrations: ''
  });
  const [loadingEdmSystem, setLoadingEdmSystem] = useState(false);

  // Document Due Date state
  const [documentDueDate, setDocumentDueDate] = useState({
    days: 0,
    timing: 'before' as 'before' | 'after',
    phaseDateType: 'phase_end_date' as 'phase_end_date' | 'phase_start_date'
  });
  const [loadingDocumentDueDate, setLoadingDocumentDueDate] = useState(false);

  const { settings, updateSetting, saveSettings } = useTemplateSettings(companyId);

  const handleCurrencyChange = async (currencyCode: string) => {
    try {
      updateSetting('default_currency', currencyCode);
      await saveSettings({ default_currency: currencyCode });
      toast.success(lang('settings.companyProfile.currency.updateSuccess'));
    } catch (error) {
      console.error('Error updating currency:', error);
      toast.error(lang('settings.companyProfile.currency.updateError', { error: error instanceof Error ? error.message : 'Unknown error' }));
    }
  };

  // Load existing retention periods and document numbering system
  React.useEffect(() => {
    const loadCompanyData = async () => {
      try {
        const orgData = await CompanyDataUpdateService.getCompanyOrganizationalData(companyId);

        // Load retention periods
        if (orgData.retentionPeriods) {
          setRetentionPeriods(orgData.retentionPeriods);
        }


        // Load EDM system
        if (orgData.edmSystem) {
          setEdmSystem(orgData.edmSystem);
        }


        // Load document due date configuration
        if (orgData.documentDueDate) {
          setDocumentDueDate(orgData.documentDueDate);
        }
      } catch (error) {
        console.error('Error loading company organizational data:', error);
      }
    };

    if (companyId) {
      loadCompanyData();
    }
  }, [companyId]);

  const handleRetentionPeriodsChange = (field: string, value: string) => {
    setRetentionPeriods(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveRetentionPeriods = async () => {
    setLoadingRetentionPeriods(true);
    try {
      await CompanyDataUpdateService.saveCompanyData(companyId, {
        type: 'retention_periods',
        data: retentionPeriods
      });
      toast.success(lang('settings.companyProfile.retentionPeriods.updateSuccess'));
    } catch (error) {
      console.error('Error saving retention periods:', error);
      toast.error(lang('settings.companyProfile.retentionPeriods.updateError'));
    } finally {
      setLoadingRetentionPeriods(false);
    }
  };


  const handleEdmSystemChange = (field: string, value: string) => {
    setEdmSystem(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveEdmSystem = async () => {
    setLoadingEdmSystem(true);
    try {
      await CompanyDataUpdateService.saveCompanyData(companyId, {
        type: 'edm_system',
        data: edmSystem
      });
      toast.success(lang('settings.companyProfile.edmSystem.updateSuccess'));
    } catch (error) {
      console.error('Error saving EDM system:', error);
      toast.error(lang('settings.companyProfile.edmSystem.updateError'));
    } finally {
      setLoadingEdmSystem(false);
    }
  };

  const handleDocumentDueDateChange = (field: 'days' | 'timing' | 'phaseDateType', value: any) => {
    setDocumentDueDate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveDocumentDueDate = async () => {
    setLoadingDocumentDueDate(true);
    try {
      await CompanyDataUpdateService.saveCompanyData(companyId, {
        type: 'document_due_date',
        data: documentDueDate
      });
      toast.success(lang('settings.companyProfile.documentDueDate.updateSuccess'));
    } catch (error) {
      console.error('Error saving document due date configuration:', error);
      toast.error(lang('settings.companyProfile.documentDueDate.updateError'));
    } finally {
      setLoadingDocumentDueDate(false);
    }
  };

  const copyManufacturerToProduction = () => {
    if (!company) return;

    onInputChange('production_site_name', company.name);
    onInputChange('production_site_address', company.address);
    onInputChange('production_site_city', company.city);
    onInputChange('production_site_postal_code', company.postal_code);
    onInputChange('production_site_country', company.country);

    toast.success(lang('settings.companyProfile.productionSite.copiedFromManufacturer'));
  };


  return (
    <div className="space-y-6">
      {/* GENERAL COMPANY SETTINGS */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          {lang('settings.companyProfile.sections.generalCompanySettings')}
        </h3>
        <Separator />
      </div>
      <CompanyLogoUpload
        companyId={companyId}
        currentLogoUrl={company?.logo_url}
      />


      {/* Currency & Financial Settings */}
      <Collapsible open={currencyOpen} onOpenChange={setCurrencyOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    {lang('settings.companyProfile.currency.title')}
                  </CardTitle>
                  <CardDescription>
                    {lang('settings.companyProfile.currency.description')}
                  </CardDescription>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${currencyOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default_currency">{lang('settings.companyProfile.currency.defaultCurrency')}</Label>
                  <Select
                    value={settings.default_currency || 'USD'}
                    onValueChange={handleCurrencyChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={lang('settings.companyProfile.currency.selectCurrency')} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(CURRENCIES).map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          <div className="flex items-center gap-2">
                            <span>{currency.symbol}</span>
                            <span>{currency.code}</span>
                            <span className="text-muted-foreground">- {currency.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {lang('settings.companyProfile.currency.usedFor')}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>{lang('settings.companyProfile.currency.selectedDetails')}</Label>
                  <div className="p-3 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{lang('settings.companyProfile.currency.symbol')}:</span>
                      <span>{getCurrencySymbol(settings.default_currency || 'USD')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{lang('settings.companyProfile.currency.code')}:</span>
                      <span>{settings.default_currency || 'USD'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{lang('settings.companyProfile.currency.name')}:</span>
                      <span>{CURRENCIES[settings.default_currency || 'USD']?.name || 'US Dollar'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Device Portfolio Structure */}
      <Collapsible open={portfolioStructureOpen} onOpenChange={setPortfolioStructureOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5" />
                    {lang('settings.companyProfile.devicePortfolio.title')}
                  </CardTitle>
                  <CardDescription>
                    {lang('settings.companyProfile.devicePortfolio.description')}
                  </CardDescription>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${portfolioStructureOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-6">
              <ProductPortfolioStructureSettings companyId={companyId} />

            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* DOCUMENT MANAGEMENT */}
      <div className="space-y-2 mt-12">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          {lang('settings.companyProfile.sections.documentManagement')}
        </h3>
        <Separator />
      </div>

      {/* Document Category & Numbering System */}
      <DocumentCategoryNumberingSystem companyId={companyId} />

      {/* Document Due Date Configuration */}
      <Collapsible open={documentDueDateOpen} onOpenChange={setDocumentDueDateOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {lang('settings.companyProfile.documentDueDate.title')}
                  </CardTitle>
                  <CardDescription>
                    {lang('settings.companyProfile.documentDueDate.description')}
                  </CardDescription>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${documentDueDateOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">{lang('settings.companyProfile.documentDueDate.defaultDueDate')}</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {lang('settings.companyProfile.documentDueDate.setDaysInfo')}
                </p>
              </div>

              <div className="space-y-6">
                {/* Formula Display */}
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={documentDueDate.days}
                      onChange={(e) => handleDocumentDueDateChange('days', parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                    <span className="text-sm font-medium">{lang('settings.companyProfile.documentDueDate.days')}</span>
                  </div>

                  <Select
                    value={documentDueDate.timing}
                    onValueChange={(value) => handleDocumentDueDateChange('timing', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before">{lang('settings.companyProfile.documentDueDate.before')}</SelectItem>
                      <SelectItem value="after">{lang('settings.companyProfile.documentDueDate.after')}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={documentDueDate.phaseDateType}
                    onValueChange={(value) => handleDocumentDueDateChange('phaseDateType', value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phase_end_date">{lang('settings.companyProfile.documentDueDate.phaseEndDate')}</SelectItem>
                      <SelectItem value="phase_start_date">{lang('settings.companyProfile.documentDueDate.phaseStartDate')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Examples */}
                {/* <div className="space-y-3">
                  <h5 className="text-sm font-medium">Examples:</h5>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <span className="font-medium min-w-[200px]">
                        {documentDueDate.days} days {documentDueDate.timing} {documentDueDate.phaseDateType === 'phase_end_date' ? 'phase end date' : 'phase start date'}
                      </span>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {documentDueDate.phaseDateType === 'phase_end_date' ? (
                          <>
                            <span>12/28</span>
                            <span>→</span>
                            <span className="font-medium text-foreground">
                              {(() => {
                                const phaseEnd = new Date(2024, 11, 28); // Dec 28, 2024
                                const days = documentDueDate.days;
                                const dueDate = documentDueDate.timing === 'before' 
                                  ? new Date(phaseEnd.getTime() - days * 24 * 60 * 60 * 1000)
                                  : new Date(phaseEnd.getTime() + days * 24 * 60 * 60 * 1000);
                                return `${dueDate.getMonth() + 1}/${dueDate.getDate()}`;
                              })()}
                            </span>
                          </>
                        ) : (
                          <>
                            <span>12/1</span>
                            <span>→</span>
                            <span className="font-medium text-foreground">
                              {(() => {
                                const phaseStart = new Date(2024, 11, 1); // Dec 1, 2024
                                const days = documentDueDate.days;
                                const dueDate = documentDueDate.timing === 'before' 
                                  ? new Date(phaseStart.getTime() - days * 24 * 60 * 60 * 1000)
                                  : new Date(phaseStart.getTime() + days * 24 * 60 * 60 * 1000);
                                return `${dueDate.getMonth() + 1}/${dueDate.getDate()}`;
                              })()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div> */}
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={saveDocumentDueDate}
                  disabled={loadingDocumentDueDate}
                >
                  {loadingDocumentDueDate ? lang('common.saving') : lang('settings.companyProfile.documentDueDate.saveButton')}
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Date Display Format - Admin Only */}
      <Collapsible open={dateFormatOpen} onOpenChange={setDateFormatOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {lang('settings.companyProfile.dateFormat.title')}
                  </CardTitle>
                  <CardDescription>
                    {lang('settings.companyProfile.dateFormat.description')}
                  </CardDescription>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${dateFormatOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">{lang('settings.companyProfile.dateFormat.configTitle')}</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {lang('settings.companyProfile.dateFormat.configDescription')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date-format">{lang('settings.companyProfile.dateFormat.label')}</Label>
                  <Select
                    value={dateFormat}
                    onValueChange={(value) => {
                      updateDateFormat(value);
                      toast.success(lang('settings.companyProfile.dateFormat.updateSuccess'));
                    }}
                    disabled={isUpdatingDateFormat}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={lang('settings.companyProfile.dateFormat.selectFormat')} />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_FORMAT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span>{option.label}</span>
                            <span className="text-xs text-muted-foreground">{option.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{lang('settings.companyProfile.dateFormat.preview')}</Label>
                  <div className="p-3 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{lang('settings.companyProfile.dateFormat.todaysDate')}:</span>
                      <span className="text-primary font-semibold">{formatDisplayDate(new Date(), dateFormat)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-2">
                      <span className="font-medium">{lang('settings.companyProfile.dateFormat.example')}:</span>
                      <span>{formatDisplayDate(new Date(), dateFormat)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>{lang('settings.companyProfile.dateFormat.appliesTo')}:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>{lang('settings.companyProfile.dateFormat.companyDocuments')}</li>
                  <li>{lang('settings.companyProfile.dateFormat.deviceDocuments')}</li>
                </ul>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Electronic Document Management System */}
      <Collapsible open={edmSystemOpen} onOpenChange={setEdmSystemOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {lang('settings.companyProfile.edmSystem.title')}
                  </CardTitle>
                  <CardDescription>
                    {lang('settings.companyProfile.edmSystem.description')}
                  </CardDescription>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${edmSystemOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edms-platform">{lang('settings.companyProfile.edmSystem.platform')}</Label>
                  <Select
                    value={edmSystem.platform}
                    onValueChange={(value) => handleEdmSystemChange('platform', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SharePoint">Microsoft SharePoint</SelectItem>
                      <SelectItem value="Documentum">OpenText Documentum</SelectItem>
                      <SelectItem value="Veeva Vault">Veeva Vault QualityDocs</SelectItem>
                      <SelectItem value="MasterControl">MasterControl</SelectItem>
                      <SelectItem value="Ennov Doc">Ennov Doc</SelectItem>
                      <SelectItem value="TrackWise">TrackWise Digital</SelectItem>
                      <SelectItem value="Custom">Custom/In-house System</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validation-status">{lang('settings.companyProfile.edmSystem.validationStatus')}</Label>
                  <Select
                    value={edmSystem.validationStatus}
                    onValueChange={(value) => handleEdmSystemChange('validationStatus', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Validated">Fully Validated</SelectItem>
                      <SelectItem value="In Progress">Validation in Progress</SelectItem>
                      <SelectItem value="Planned">Validation Planned</SelectItem>
                      <SelectItem value="Not Required">Not Required (Non-FDA)</SelectItem>
                      <SelectItem value="Legacy">Legacy System (Pre-validation)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="access-controls">{lang('settings.companyProfile.edmSystem.accessControls')}</Label>
                  <Select
                    value={edmSystem.accessControls}
                    onValueChange={(value) => handleEdmSystemChange('accessControls', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Role-based">Role-based Access Control (RBAC)</SelectItem>
                      <SelectItem value="User-based">User-based Permissions</SelectItem>
                      <SelectItem value="Department-based">Department-based Access</SelectItem>
                      <SelectItem value="Hybrid">Hybrid Approach</SelectItem>
                      <SelectItem value="Matrix">Permission Matrix</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backup-schedule">{lang('settings.companyProfile.edmSystem.backupSchedule')}</Label>
                  <Select
                    value={edmSystem.backupSchedule}
                    onValueChange={(value) => handleEdmSystemChange('backupSchedule', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Real-time">Real-time/Continuous</SelectItem>
                      <SelectItem value="Hourly">Every Hour</SelectItem>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="On-demand">On-demand Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audit-trail">{lang('settings.companyProfile.edmSystem.auditTrail')}</Label>
                  <Select
                    value={edmSystem.auditTrail}
                    onValueChange={(value) => handleEdmSystemChange('auditTrail', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Enabled">Fully Enabled</SelectItem>
                      <SelectItem value="Partial">Partially Enabled</SelectItem>
                      <SelectItem value="Manual">Manual Logging</SelectItem>
                      <SelectItem value="Disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="electronic-signatures">{lang('settings.companyProfile.edmSystem.electronicSignatures')}</Label>
                  <Select
                    value={edmSystem.electronicSignatures}
                    onValueChange={(value) => handleEdmSystemChange('electronicSignatures', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Enabled">Enabled (21 CFR Part 11)</SelectItem>
                      <SelectItem value="Basic">Basic Digital Signatures</SelectItem>
                      <SelectItem value="Planned">Planned Implementation</SelectItem>
                      <SelectItem value="Not Available">Not Available</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="integrations">{lang('settings.companyProfile.edmSystem.integrations')}</Label>
                <Textarea
                  id="integrations"
                  value={edmSystem.integrations}
                  onChange={(e) => handleEdmSystemChange('integrations', e.target.value)}
                  placeholder={lang('settings.companyProfile.edmSystem.integrationsPlaceholder')}
                  rows={3}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">{lang('settings.companyProfile.edmSystem.cfrRequirements')}</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• {lang('settings.companyProfile.edmSystem.cfrReq1')}</li>
                  <li>• {lang('settings.companyProfile.edmSystem.cfrReq2')}</li>
                  <li>• {lang('settings.companyProfile.edmSystem.cfrReq3')}</li>
                  <li>• {lang('settings.companyProfile.edmSystem.cfrReq4')}</li>
                  <li>• {lang('settings.companyProfile.edmSystem.cfrReq5')}</li>
                </ul>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={saveEdmSystem}
                  disabled={loadingEdmSystem}
                >
                  {loadingEdmSystem ? lang('common.saving') : lang('settings.companyProfile.edmSystem.saveButton')}
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Document Retention Periods */}
      <Collapsible open={retentionPeriodsOpen} onOpenChange={setRetentionPeriodsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {lang('settings.companyProfile.retentionPeriods.title')}
                  </CardTitle>
                  <CardDescription>
                    {lang('settings.companyProfile.retentionPeriods.description')}
                  </CardDescription>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${retentionPeriodsOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sops">{lang('settings.companyProfile.retentionPeriods.sops')}</Label>
                  <Input
                    id="sops"
                    value={retentionPeriods.sops}
                    onChange={(e) => handleRetentionPeriodsChange('sops', e.target.value)}
                    placeholder={lang('settings.companyProfile.retentionPeriods.sopsPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quality-records">{lang('settings.companyProfile.retentionPeriods.qualityRecords')}</Label>
                  <Input
                    id="quality-records"
                    value={retentionPeriods.qualityRecords}
                    onChange={(e) => handleRetentionPeriodsChange('qualityRecords', e.target.value)}
                    placeholder={lang('settings.companyProfile.retentionPeriods.qualityRecordsPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="design-files">{lang('settings.companyProfile.retentionPeriods.designFiles')}</Label>
                  <Input
                    id="design-files"
                    value={retentionPeriods.designFiles}
                    onChange={(e) => handleRetentionPeriodsChange('designFiles', e.target.value)}
                    placeholder={lang('settings.companyProfile.retentionPeriods.designFilesPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinical-data">{lang('settings.companyProfile.retentionPeriods.clinicalData')}</Label>
                  <Input
                    id="clinical-data"
                    value={retentionPeriods.clinicalData}
                    onChange={(e) => handleRetentionPeriodsChange('clinicalData', e.target.value)}
                    placeholder={lang('settings.companyProfile.retentionPeriods.clinicalDataPlaceholder')}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={saveRetentionPeriods}
                  disabled={loadingRetentionPeriods}
                >
                  {loadingRetentionPeriods ? lang('common.saving') : lang('settings.companyProfile.retentionPeriods.saveButton')}
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Document Types */}
      <DocumentTypeSettings companyId={companyId} />

      {/* ORGANIZATIONAL STRUCTURE */}
      <div className="space-y-2 mt-12">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" />
          {lang('settings.companyProfile.sections.organizationalStructure')}
        </h3>
        <Separator />
      </div>

      {/* Manufacturer Information */}
      <Collapsible open={manufacturerOpen} onOpenChange={setManufacturerOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {lang('settings.companyProfile.manufacturer.title')}
                  </CardTitle>
                  <CardDescription>
                    {lang('settings.companyProfile.manufacturer.description')}
                  </CardDescription>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${manufacturerOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{lang('settings.companyProfile.manufacturer.companyName')} *</Label>
                  <Input
                    id="name"
                    value={company.name || ""}
                    onChange={(e) => onInputChange("name", e.target.value)}
                    placeholder={lang('settings.companyProfile.manufacturer.companyNamePlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">{lang('settings.companyProfile.manufacturer.website')}</Label>
                  <Input
                    id="website"
                    value={company.website || ""}
                    onChange={(e) => onInputChange("website", e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{lang('settings.companyProfile.manufacturer.phone')}</Label>
                  <Input
                    id="phone"
                    value={company.phone || ""}
                    onChange={(e) => onInputChange("phone", e.target.value)}
                    placeholder={lang('settings.companyProfile.manufacturer.phonePlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{lang('settings.companyProfile.manufacturer.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={company.email || ""}
                    onChange={(e) => onInputChange("email", e.target.value)}
                    placeholder="contact@company.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{lang('settings.companyProfile.manufacturer.descriptionLabel')}</Label>
                <Textarea
                  id="description"
                  value={company.description || ""}
                  onChange={(e) => onInputChange("description", e.target.value)}
                  placeholder={lang('settings.companyProfile.manufacturer.descriptionPlaceholder')}
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">{lang('settings.companyProfile.manufacturer.address')}</Label>
                  <Input
                    id="address"
                    value={company.address || ""}
                    onChange={(e) => onInputChange("address", e.target.value)}
                    placeholder={lang('settings.companyProfile.manufacturer.addressPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">{lang('settings.companyProfile.manufacturer.city')}</Label>
                  <Input
                    id="city"
                    value={company.city || ""}
                    onChange={(e) => onInputChange("city", e.target.value)}
                    placeholder={lang('settings.companyProfile.manufacturer.cityPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postal_code">{lang('settings.companyProfile.manufacturer.postalCode')}</Label>
                  <Input
                    id="postal_code"
                    value={company.postal_code || ""}
                    onChange={(e) => onInputChange("postal_code", e.target.value)}
                    placeholder={lang('settings.companyProfile.manufacturer.postalCodePlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">{lang('settings.companyProfile.manufacturer.country')}</Label>
                  <Select
                    value={company.country || ""}
                    onValueChange={(value) => onInputChange("country", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={lang('settings.companyProfile.manufacturer.selectCountry')} />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_person">{lang('settings.companyProfile.manufacturer.contactPerson')}</Label>
                  <Input
                    id="contact_person"
                    value={company.contact_person || ""}
                    onChange={(e) => onInputChange("contact_person", e.target.value)}
                    placeholder={lang('settings.companyProfile.manufacturer.contactPersonPlaceholder')}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => onSave(lang('settings.companyProfile.manufacturer.title'))} disabled={isSaving}>
                  {isSaving ? lang('common.saving') : lang('settings.companyProfile.manufacturer.saveButton')}
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Production Site */}
      <Collapsible open={productionOpen} onOpenChange={setProductionOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Factory className="h-5 w-5" />
                    {lang('settings.companyProfile.productionSite.title')}
                  </CardTitle>
                  <CardDescription>
                    {lang('settings.companyProfile.productionSite.description')}
                  </CardDescription>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${productionOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="flex justify-end mb-4">
                <Button
                  variant="outline"
                  onClick={copyManufacturerToProduction}
                  type="button"
                >
                  {lang('settings.companyProfile.productionSite.sameAsManufacturer')}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="production_site_name">{lang('settings.companyProfile.productionSite.siteName')}</Label>
                  <Input
                    id="production_site_name"
                    value={company.production_site_name || ""}
                    onChange={(e) => onInputChange("production_site_name", e.target.value)}
                    placeholder={lang('settings.companyProfile.productionSite.siteNamePlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="production_site_address">{lang('settings.companyProfile.productionSite.siteAddress')}</Label>
                  <Input
                    id="production_site_address"
                    value={company.production_site_address || ""}
                    onChange={(e) => onInputChange("production_site_address", e.target.value)}
                    placeholder={lang('settings.companyProfile.productionSite.siteAddressPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="production_site_city">{lang('settings.companyProfile.productionSite.siteCity')}</Label>
                  <Input
                    id="production_site_city"
                    value={company.production_site_city || ""}
                    onChange={(e) => onInputChange("production_site_city", e.target.value)}
                    placeholder={lang('settings.companyProfile.productionSite.siteCityPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="production_site_postal_code">{lang('settings.companyProfile.productionSite.sitePostalCode')}</Label>
                  <Input
                    id="production_site_postal_code"
                    value={company.production_site_postal_code || ""}
                    onChange={(e) => onInputChange("production_site_postal_code", e.target.value)}
                    placeholder={lang('settings.companyProfile.productionSite.sitePostalCodePlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="production_site_country">{lang('settings.companyProfile.productionSite.siteCountry')}</Label>
                  <Select
                    value={company.production_site_country || ""}
                    onValueChange={(value) => onInputChange("production_site_country", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={lang('settings.companyProfile.manufacturer.selectCountry')} />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => onSave(lang('settings.companyProfile.productionSite.title'))} disabled={isSaving}>
                  {isSaving ? lang('common.saving') : lang('settings.companyProfile.productionSite.saveButton')}
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

    </div>
  );
}
