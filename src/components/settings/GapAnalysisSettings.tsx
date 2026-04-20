import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, BarChart3, Info, Settings, Loader2, FileText, Download, Search, Globe, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCompanyGapTemplates } from "@/hooks/useCompanyGapTemplates";
import { GapTemplateConfigurationDialog } from "./GapTemplateConfigurationDialog";
import { TemplateEnableProgressDialog } from "./gap-analysis/TemplateEnableProgressDialog";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useStandardVersionStatus } from "@/hooks/useStandardVersionStatus";
import { StandardStatusBadge } from "@/components/company/gap-analysis/StandardStatusBadge";
import { RecheckStandardButton } from "@/components/company/gap-analysis/RecheckStandardButton";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  DialogContentText,
  Typography,
  Box
} from '@mui/material';
interface GapAnalysisSettingsProps {
  companyId: string;
}
export function GapAnalysisSettings({
  companyId
}: GapAnalysisSettingsProps) {
  const { lang } = useTranslation();
  const { data: standardStatuses } = useStandardVersionStatus();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [templateRequirements, setTemplateRequirements] = useState<any[]>([]);
  const [importing, setImporting] = useState<string | null>(null);
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [templateToDeactivate, setTemplateToDeactivate] = useState<any>(null);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [templateToEnable, setTemplateToEnable] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [marketFilter, setMarketFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const {
    availableTemplates,
    companyPhases,
    isLoading,
    enableTemplate,
    disableTemplate,
    updateTemplateScope,
    updateTemplatePhases,
    getTemplateStatus,
    getTemplateRequirementCount,
    getTemplatePhaseDisplay,
    getTemplatePhases,
    companyTemplates,
    loadTemplates
  } = useCompanyGapTemplates(companyId);
  const filteredTemplates = useMemo(() => {
    // Sort: always (core) first, then conditional, then manual — then alphabetically
    const conditionOrder = (t: any) => {
      if (t.auto_enable_condition === 'always') return 0;
      if (t.auto_enable_condition) return 1;
      return 2;
    };
    const sorted = [...availableTemplates].sort((a, b) => {
      const aOrder = conditionOrder(a);
      const bOrder = conditionOrder(b);
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.name.localeCompare(b.name);
    });

    return sorted.filter(t => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!t.name.toLowerCase().includes(q) &&
            !t.framework?.toLowerCase().includes(q) &&
            !t.description?.toLowerCase().includes(q)) {
          return false;
        }
      }

      // Market filter: non-market conditions (null, always, device_*) always pass
      if (marketFilter !== 'all') {
        const cond = (t as any).auto_enable_condition;
        const isMarketCondition = cond && cond.startsWith('market_');
        if (isMarketCondition && cond !== `market_${marketFilter}`) {
          return false;
        }
      }

      // Level filter
      if (levelFilter !== 'all') {
        const scope = t.scope;
        if (levelFilter === 'enterprise' && scope !== 'company') return false;
        if (levelFilter === 'device' && scope !== 'product') return false;
      }

      return true;
    });
  }, [availableTemplates, searchQuery, marketFilter, levelFilter]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>;
  }
  const enabledTemplateCount = availableTemplates.filter(t => getTemplateStatus(t.id)).length;
  const totalRequirements = availableTemplates.reduce((total, template) => total + (getTemplateStatus(template.id) ? getTemplateRequirementCount(template.id) : 0), 0);
  const handleToggleTemplate = async (templateId: string, enabled: boolean) => {
    if (enabled) {
      // Show progress dialog when enabling a template
      const template = availableTemplates.find(t => t.id === templateId);
      if (template) {
        setTemplateToEnable({
          ...template,
          requirementCount: getTemplateRequirementCount(templateId),
        });
        setProgressDialogOpen(true);
      }
    } else {
      // Show warning dialog when trying to deactivate an active template
      const template = availableTemplates.find(t => t.id === templateId);
      if (template && getTemplateStatus(templateId)) {
        setTemplateToDeactivate(template);
        setWarningDialogOpen(true);
      } else {
        await disableTemplate(templateId);
      }
    }
  };

  const handleConfirmEnable = async (onProgress?: (current: number, total: number, meta?: { devices: number; requirements: number }) => void) => {
    if (templateToEnable) {
      await enableTemplate(templateToEnable.id, onProgress);
    }
  };

  const handleConfirmDeactivation = async () => {
    if (templateToDeactivate) {
      await disableTemplate(templateToDeactivate.id);
      setWarningDialogOpen(false);
      setTemplateToDeactivate(null);
      toast.success(`Template "${templateToDeactivate.name}" has been deactivated`);
    }
  };

  const handleCancelDeactivation = () => {
    setWarningDialogOpen(false);
    setTemplateToDeactivate(null);
  };
  const handleConfigureTemplate = async (template: any) => {
    try {
      // Get template requirements from gap_template_items (template structure, not instances)
      const {
        data: templateItems
      } = await supabase.from('gap_template_items').select('*').eq('template_id', template.id).order('sort_order', {
        ascending: true
      });
      setSelectedTemplate(template);
      setTemplateRequirements(templateItems || []);
      setConfigDialogOpen(true);
    } catch (error) {
      toast.error(lang('companySettings.gapAnalysis.failedToLoad'));
    }
  };
  const handleImportRequirements = async (templateId: string) => {
    if (templateId !== '8b1ac5c4-28f0-4a5d-97ff-6bd093565e75') return; // Only for MDR Annex I

    setImporting(templateId);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('bulk-import-mdr-requirements', {
        body: {
          templateId
        }
      });
      if (error) throw error;
      toast(`Successfully imported ${data.itemsImported} MDR Annex I requirements!`);
      await loadTemplates(); // Refresh the template data
    } catch (error) {
      console.error('Import error:', error);
      toast('Failed to import requirements. Please try again.');
    } finally {
      setImporting(null);
    }
  };
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{lang('companySettings.gapAnalysis.title')}</h2>
          <p className="text-muted-foreground">
            {lang('companySettings.gapAnalysis.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {lang('companySettings.gapAnalysis.activeOf', { active: enabledTemplateCount, total: availableTemplates.length })}
          </Badge>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {lang('companySettings.gapAnalysis.createCustomTemplate')}
          </Button>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {lang('companySettings.gapAnalysis.alertInfo')}
        </AlertDescription>
      </Alert>

      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5" />
            <h3 className="text-lg font-semibold">{lang('companySettings.gapAnalysis.regulatoryFrameworkTemplates')}</h3>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={marketFilter} onValueChange={setMarketFilter}>
              <SelectTrigger className="w-[180px]">
                <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Target Market" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Markets</SelectItem>
                <SelectItem value="eu">🇪🇺 EU</SelectItem>
                <SelectItem value="us">🇺🇸 US</SelectItem>
                <SelectItem value="ca">🇨🇦 Canada</SelectItem>
                <SelectItem value="uk">🇬🇧 UK</SelectItem>
                <SelectItem value="au">🇦🇺 Australia</SelectItem>
                <SelectItem value="jp">🇯🇵 Japan</SelectItem>
                <SelectItem value="cn">🇨🇳 China</SelectItem>
                <SelectItem value="br">🇧🇷 Brazil</SelectItem>
                <SelectItem value="in">🇮🇳 India</SelectItem>
                <SelectItem value="ch">🇨🇭 Switzerland</SelectItem>
                <SelectItem value="kr">🇰🇷 South Korea</SelectItem>
              </SelectContent>
            </Select>

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[160px]">
                <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="device">Device</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">{lang('companySettings.gapAnalysis.status')}</TableHead>
                  <TableHead>{lang('companySettings.gapAnalysis.templateName')}</TableHead>
                  <TableHead>{lang('companySettings.gapAnalysis.framework')}</TableHead>
                  <TableHead>{lang('companySettings.gapAnalysis.description')}</TableHead>
                  <TableHead className="text-center w-[100px]">{lang('companySettings.gapAnalysis.requirements')}</TableHead>
                  <TableHead className="w-[150px]">{lang('companySettings.gapAnalysis.phases')}</TableHead>
                  <TableHead className="text-center w-[100px]">Level</TableHead>
                  <TableHead className="w-[100px]">{lang('companySettings.gapAnalysis.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map(template => {
                  const autoCondition = (template as any).auto_enable_condition;
                  const isAlways = autoCondition === 'always';
                  const conditionBadge: Record<string, string> = {
                    'market_eu': 'Auto: EU Market',
                    'market_us': 'Auto: US Market',
                    'market_ca': 'Auto: Canada',
                    'market_au': 'Auto: Australia',
                    'market_jp': 'Auto: Japan',
                    'market_cn': 'Auto: China',
                    'market_br': 'Auto: Brazil',
                    'market_in': 'Auto: India',
                    'market_uk': 'Auto: UK',
                    'market_ch': 'Auto: Switzerland',
                    'market_kr': 'Auto: South Korea',
                    'device_samd': 'Auto: Software',
                    'device_active': 'Auto: Active Device',
                    'device_patient_contact': 'Auto: Patient Contact',
                  };
                  return <TableRow key={template.id}>
                    <TableCell>
                      <Switch 
                        checked={isAlways || getTemplateStatus(template.id)} 
                        disabled={isAlways}
                        onCheckedChange={checked => handleToggleTemplate(template.id, checked)} 
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        {template.name}
                        {isAlways && <Badge variant="secondary" className="text-xs">Core</Badge>}
                        {!isAlways && autoCondition && conditionBadge[autoCondition] && (
                          <Badge variant="outline" className="text-xs">{conditionBadge[autoCondition]}</Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const matchedStatus = standardStatuses?.find(s => s.standard_name?.includes(template.framework) || s.framework_key === template.framework?.replace(/[\s\-:]/g, '_'));
                        return (
                          <span className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-xs">
                              {template.framework}
                            </Badge>
                            <StandardStatusBadge status={matchedStatus} compact />
                            {matchedStatus?.framework_key && (
                              <RecheckStandardButton frameworkKey={matchedStatus.framework_key} />
                            )}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[280px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="line-clamp-3 cursor-default">{template.description}</span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-sm">
                            <p>{template.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        {getTemplateRequirementCount(template.id)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">
                        {getTemplatePhaseDisplay(template)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {template.scope === 'company' ? 'Enterprise' : 'Device'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleConfigureTemplate(template)}>
                          <Settings className="h-4 w-4 mr-1" />
                          {lang('companySettings.gapAnalysis.configure')}
                        </Button>
                        {template.id === '8b1ac5c4-28f0-4a5d-97ff-6bd093565e75'}
                      </div>
                    </TableCell>
                  </TableRow>})}
              </TableBody>
            </Table>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{lang('companySettings.gapAnalysis.templateManagement')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>
                  <strong>{lang('companySettings.gapAnalysis.activeTemplates')}</strong> {lang('companySettings.gapAnalysis.activeTemplatesDesc', { count: enabledTemplateCount })}
                </p>
                <p className="mt-2">
                  <strong>{lang('companySettings.gapAnalysis.coverage')}</strong> {lang('companySettings.gapAnalysis.coverageDesc')}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{totalRequirements}</div>
                  <div className="text-sm text-muted-foreground">{lang('companySettings.gapAnalysis.totalRequirements')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{availableTemplates.length}</div>
                  <div className="text-sm text-muted-foreground">{lang('companySettings.gapAnalysis.availableTemplates')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{enabledTemplateCount}</div>
                  <div className="text-sm text-muted-foreground">{lang('companySettings.gapAnalysis.enabledTemplates')}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <GapTemplateConfigurationDialog open={configDialogOpen} onOpenChange={setConfigDialogOpen} template={selectedTemplate} companyId={companyId} requirements={templateRequirements} onScopeUpdate={updateTemplateScope} companyPhases={companyPhases} onPhasesUpdate={updateTemplatePhases} getTemplatePhases={getTemplatePhases} />

      {/* Warning Dialog for Template Deactivation */}
      <Dialog
        open={warningDialogOpen}
        onClose={handleCancelDeactivation}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 2,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <DialogTitle sx={{
          backgroundColor: '#fef3c7',
          color: '#92400e',
          fontWeight: 'bold',
          borderBottom: '1px solid #fbbf24'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Info className="h-5 w-5" />
            {lang('companySettings.gapAnalysis.confirmDeactivation')}
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText sx={{ mb: 2, color: '#374151' }}>
            <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
              {lang('companySettings.gapAnalysis.deactivateQuestion', { templateName: templateToDeactivate?.name })}
            </Typography>
          </DialogContentText>

          <Box sx={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 1,
            p: 2,
            mb: 2
          }}>
            <Typography variant="body2" sx={{ color: '#dc2626', fontWeight: 'medium', mb: 1 }}>
              ⚠️ {lang('companySettings.gapAnalysis.deactivateWarning')}
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0, color: '#7f1d1d' }}>
              <Typography component="li" variant="body2">
                {lang('companySettings.gapAnalysis.deactivateEffect1')}
              </Typography>
              <Typography component="li" variant="body2">
                {lang('companySettings.gapAnalysis.deactivateEffect2')}
              </Typography>
              <Typography component="li" variant="body2">
                {lang('companySettings.gapAnalysis.deactivateEffect3')}
              </Typography>
            </Box>
          </Box>

          <Typography variant="body2" sx={{ color: '#6b7280', fontStyle: 'italic' }}>
            {lang('companySettings.gapAnalysis.reactivateNote')}
          </Typography>
        </DialogContent>

        <DialogActions sx={{
          p: 3,
          backgroundColor: '#f9fafb',
          borderTop: '1px solid #e5e7eb'
        }}>
          <Button
            onClick={handleCancelDeactivation}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
          >
            {lang('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirmDeactivation}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
          >
            {lang('companySettings.gapAnalysis.yesDeactivate')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Enable Progress Dialog */}
      <TemplateEnableProgressDialog
        open={progressDialogOpen}
        onOpenChange={setProgressDialogOpen}
        template={templateToEnable}
        onConfirm={handleConfirmEnable}
      />
    </div>;
}