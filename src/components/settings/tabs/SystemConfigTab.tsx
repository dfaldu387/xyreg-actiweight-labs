import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Monitor, Key, LayoutGrid, Building2, Sparkles, Save, RotateCcw, Loader2, Tags, Plus, Trash2 } from "lucide-react";
import { useTraceabilityPrefixes, DEFAULT_TRACEABILITY_ENTRIES, type TraceabilityPrefixEntry } from "@/hooks/useTraceabilityPrefixes";
import { useTemplateSettings } from "@/hooks/useTemplateSettings";
import { useCompanyApiKeys } from "@/hooks/useCompanyApiKeys";
import { useUserPreferences, type PortfolioViewType, type MilestonesViewType } from "@/hooks/useUserPreferences";
import { toast } from "sonner";
import { CompanyEudamedImporter } from "@/components/settings/CompanyEudamedImporter";
import { EudamedSyncSection } from "@/components/eudamed/EudamedSyncSection";
import { useTranslation } from "@/hooks/useTranslation";
import apiClient from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";


interface SystemConfigTabProps {
  companyId: string;
  companyName?: string;
}

export function SystemConfigTab({ companyId, companyName }: SystemConfigTabProps) {
  const { lang } = useTranslation();
  const { user } = useAuth();
  const [sidebarOptionsOpen, setSidebarOptionsOpen] = useState(false);
  const [traceabilityOpen, setTraceabilityOpen] = useState(false);
  const [localEntries, setLocalEntries] = useState<TraceabilityPrefixEntry[] | null>(null);
  const [isSavingPrefixes, setIsSavingPrefixes] = useState(false);
  const [apiKeysOpen, setApiKeysOpen] = useState(false);
  const [uiPreferencesOpen, setUiPreferencesOpen] = useState(false);
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [localApiKeys, setLocalApiKeys] = useState<Record<string, string>>({
    openai: '',
    anthropic: '',
    gemini: '',
    // serpapi: '',
    google_vertex: ''
  });
  const [isSavingApiKeys, setIsSavingApiKeys] = useState(false);

  // AI Prompt Settings state
  const [aiPromptId, setAiPromptId] = useState<string | null>(null);
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [originalInstructions, setOriginalInstructions] = useState('');
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

  const { settings, updateSetting, saveSettings } = useTemplateSettings(companyId);
  const { apiKeys, getApiKey, createApiKey, updateApiKey } = useCompanyApiKeys(companyId);
  const { defaultPortfolioView, defaultMilestonesView, showPhaseCategories, isSaving: isSavingPreferences, savePortfolioViewPreference, saveMilestonesViewPreference, saveShowPhaseCategoriesPreference } = useUserPreferences();
  const { entries, saveEntries, isLoading: isPrefixesLoading } = useTraceabilityPrefixes(companyId);

  // Initialize local entries when loaded
  React.useEffect(() => {
    if (!isPrefixesLoading && !localEntries) {
      setLocalEntries(entries);
    }
  }, [isPrefixesLoading, entries]);

  const handleEntryChange = (index: number, field: keyof TraceabilityPrefixEntry, value: string) => {
    setLocalEntries(prev => {
      if (!prev) return prev;
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddEntry = () => {
    setLocalEntries(prev => [
      ...(prev || []),
      { key: `custom_${Date.now()}`, label: '', prefix: '', scope: '', isDefault: false },
    ]);
  };

  const handleRemoveEntry = (index: number) => {
    setLocalEntries(prev => prev ? prev.filter((_, i) => i !== index) : prev);
  };

  const handleSavePrefixes = async () => {
    if (!localEntries) return;
    setIsSavingPrefixes(true);
    try {
      await saveEntries(localEntries);
      toast.success(lang('settings.systemConfig.traceability.saveSuccess'));
    } catch {
      toast.error(lang('settings.systemConfig.traceability.saveError'));
    } finally {
      setIsSavingPrefixes(false);
    }
  };

  const handleResetPrefixes = () => {
    setLocalEntries([...DEFAULT_TRACEABILITY_ENTRIES]);
    toast.info('Prefixes reset to defaults');
  };

  // Load API keys into local state
  React.useEffect(() => {
    if (!apiKeys.isLoading) {
      setLocalApiKeys({
        openai: getApiKey('openai')?.encrypted_key || '',
        anthropic: getApiKey('anthropic')?.encrypted_key || '',
        gemini: getApiKey('gemini')?.encrypted_key || '',
        // serpapi: getApiKey('serpapi')?.encrypted_key || '',
        google_vertex: getApiKey('google_vertex' as any)?.encrypted_key || ''
      });
    }
  }, [apiKeys.isLoading, apiKeys.keys]);

  // Load AI prompt when section opens
  useEffect(() => {
    if (aiPromptOpen && companyId) {
      loadAiPrompt();
    }
  }, [aiPromptOpen, companyId]);

  const loadAiPrompt = async () => {
    setIsLoadingPrompt(true);
    try {
      const response = await apiClient.get<{ success: boolean; data: { id: string; additional_instructions: string } }>(
        `/ai/prompts/${companyId}/active?prompt_type=rag_summary`
      );
      if (response.data.success && response.data.data) {
        setAiPromptId(response.data.data.id);
        const additional = response.data.data.additional_instructions || '';
        setAdditionalInstructions(additional);
        setOriginalInstructions(additional);
      } else {
        setAiPromptId(null);
        setAdditionalInstructions('');
        setOriginalInstructions('');
      }
    } catch (error) {
      console.error('Failed to load AI prompt:', error);
      setAiPromptId(null);
      setAdditionalInstructions('');
      setOriginalInstructions('');
    } finally {
      setIsLoadingPrompt(false);
    }
  };

  const handleSaveAiPrompt = async () => {
    setIsSavingPrompt(true);
    try {
      if (!aiPromptId) {
        // Create new prompt
        const response = await apiClient.post<{ success: boolean; data: { id: string } }>('/ai/prompts', {
          company_id: companyId,
          user_id: user?.id,
          name: 'Custom RAG Summary',
          description: 'Additional instructions for document summarization',
          prompt_type: 'rag_summary',
          additional_instructions: additionalInstructions,
          default_temperature: 0.2,
          default_max_tokens: 2500,
          is_default: true,
        });
        if (response.data.success) {
          toast.success(lang('settings.systemConfig.aiPrompt.saveSuccess'));
          setAiPromptId(response.data.data.id);
          setOriginalInstructions(additionalInstructions);
        }
      } else {
        // Update existing prompt
        const response = await apiClient.put<{ success: boolean }>(`/ai/prompts/${aiPromptId}`, {
          additional_instructions: additionalInstructions,
          user_id: user?.id
        });
        if (response.data.success) {
          toast.success(lang('settings.systemConfig.aiPrompt.updateSuccess'));
          setOriginalInstructions(additionalInstructions);
        }
      }
    } catch (error: any) {
      toast.error(error.message || lang('settings.systemConfig.aiPrompt.saveError'));
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleClearAiPrompt = () => {
    setAdditionalInstructions('');
    toast.info(lang('settings.systemConfig.aiPrompt.cleared'));
  };

  const handleSidebarSettingChange = async (key: string, value: boolean | string) => {
    try {
      updateSetting(key, value);
      await saveSettings({ [key]: value });
      toast.success(lang('settings.systemConfig.sidebar.updateSuccess'));
    } catch (error) {
      console.error('Error updating sidebar setting:', error);
      toast.error(lang('settings.systemConfig.sidebar.updateError'));
    }
  };

  const handleApiKeyChange = (keyName: string, value: string) => {
    setLocalApiKeys(prev => ({ ...prev, [keyName]: value }));
  };

  const handleSaveApiKeys = async () => {
    try {
      setIsSavingApiKeys(true);
      const keyTypes: Array<'openai' | 'anthropic' | 'gemini' | 'google_vertex'> = ['openai', 'anthropic', 'gemini', 'google_vertex'];

      for (const keyType of keyTypes) {
        const keyValue = localApiKeys[keyType];
        const existingKey = getApiKey(keyType);

        if (keyValue && keyValue.trim()) {
          if (existingKey) {
            await updateApiKey(existingKey.id, keyValue);
          } else {
            await createApiKey(keyType, keyValue);
          }
        }
      }

      toast.success(lang('settings.systemConfig.apiKeys.saveSuccess'));
    } catch (error) {
      console.error('Error saving API keys:', error);
      toast.error(lang('settings.systemConfig.apiKeys.saveError'));
    } finally {
      setIsSavingApiKeys(false);
    }
  };

  const handlePortfolioViewChange = async (view: PortfolioViewType) => {
    const success = await savePortfolioViewPreference(view);
    if (success) {
      toast.success(lang('settings.systemConfig.uiPreferences.portfolioViewSuccess'));
    } else {
      toast.error(lang('settings.systemConfig.uiPreferences.portfolioViewError'));
    }
  };

  const handleMilestonesViewChange = async (view: MilestonesViewType) => {
    const success = await saveMilestonesViewPreference(view);
    if (success) {
      toast.success(lang('settings.systemConfig.uiPreferences.milestonesViewSuccess'));
    } else {
      toast.error(lang('settings.systemConfig.uiPreferences.milestonesViewError'));
    }
  };

  return (
    <div className="space-y-6">
      {/* UI Preferences */}
      <Collapsible open={uiPreferencesOpen} onOpenChange={setUiPreferencesOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5" />
                    {lang('settings.systemConfig.uiPreferences.title')}
                  </CardTitle>
                  <CardDescription>
                    {lang('settings.systemConfig.uiPreferences.description')}
                  </CardDescription>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${uiPreferencesOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="default_portfolio_view">{lang('settings.systemConfig.uiPreferences.defaultPortfolioView')}</Label>
                  <Select
                    value={defaultPortfolioView}
                    onValueChange={handlePortfolioViewChange}
                    disabled={isSavingPreferences}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={lang('settings.systemConfig.uiPreferences.selectDefaultView')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunburst">{lang('settings.systemConfig.uiPreferences.views.sunburst')}</SelectItem>
                      <SelectItem value="phases-chart">{lang('settings.systemConfig.uiPreferences.views.phasesChart')}</SelectItem>
                      <SelectItem value="cards">{lang('settings.systemConfig.uiPreferences.views.productCards')}</SelectItem>
                      <SelectItem value="phases">{lang('settings.systemConfig.uiPreferences.views.phasesBoard')}</SelectItem>
                      <SelectItem value="timeline">{lang('settings.systemConfig.uiPreferences.views.timeline')}</SelectItem>
                      <SelectItem value="list">{lang('settings.systemConfig.uiPreferences.views.dataTable')}</SelectItem>
                      <SelectItem value="categorisation">{lang('settings.systemConfig.uiPreferences.views.categorisation')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {lang('settings.systemConfig.uiPreferences.portfolioViewDescription')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_milestones_view">{lang('settings.systemConfig.uiPreferences.defaultMilestonesView')}</Label>
                  <Select
                    value={defaultMilestonesView}
                    onValueChange={handleMilestonesViewChange}
                    disabled={isSavingPreferences}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={lang('settings.systemConfig.uiPreferences.selectDefaultView')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="milestones">{lang('settings.systemConfig.uiPreferences.views.milestones')}</SelectItem>
                      <SelectItem value="gantt">{lang('settings.systemConfig.uiPreferences.views.ganttChart')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {lang('settings.systemConfig.uiPreferences.milestonesViewDescription')}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="show_phase_categories">Show Phase Categories</Label>
                    <p className="text-sm text-muted-foreground">
                      Group phases by category with collapsible sections in the Phase Timeline. When disabled, phases display as a flat list.
                    </p>
                  </div>
                  <Switch
                    id="show_phase_categories"
                    checked={showPhaseCategories}
                    onCheckedChange={async (checked) => {
                      const success = await saveShowPhaseCategoriesPreference(checked);
                      if (success) {
                        toast.success('Phase categories preference updated');
                      } else {
                        toast.error('Failed to update preference');
                      }
                    }}
                    disabled={isSavingPreferences}
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Sidebar Options */}
      {/* <Collapsible open={sidebarOptionsOpen} onOpenChange={setSidebarOptionsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Sidebar Options
                  </CardTitle>
                  <CardDescription>
                    Configure the sidebar display and navigation options
                  </CardDescription>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${sidebarOptionsOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="show_company_budget">Show Company Budget in Sidebar</Label>
                    <p className="text-sm text-muted-foreground">
                      Display the company's total budget in the sidebar navigation
                    </p>
                  </div>
                  <Switch
                    id="show_company_budget"
                    checked={settings.show_company_budget || false}
                    onCheckedChange={(checked) => handleSidebarSettingChange('show_company_budget', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="show_projects_in_sidebar">Show Projects in Sidebar</Label>
                    <p className="text-sm text-muted-foreground">
                      Display a list of projects in the sidebar for quick access
                    </p>
                  </div>
                  <Switch
                    id="show_projects_in_sidebar"
                    checked={settings.show_projects_in_sidebar || false}
                    onCheckedChange={(checked) => handleSidebarSettingChange('show_projects_in_sidebar', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="show_recent_products">Show Recent Products in Sidebar</Label>
                    <p className="text-sm text-muted-foreground">
                      Display recently accessed products in the sidebar
                    </p>
                  </div>
                  <Switch
                    id="show_recent_products"
                    checked={settings.show_recent_products || false}
                    onCheckedChange={(checked) => handleSidebarSettingChange('show_recent_products', checked)}
                  />
                </div>

                
                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium mb-4">Product Display Options</h4>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="sidebar_product_display_mode">Show Products in Hierarchy</Label>
                        <p className="text-sm text-muted-foreground">
                          Display products in hierarchical groups or as a flat list
                        </p>
                      </div>
                      <Switch
                        id="sidebar_product_display_mode"
                        checked={settings.sidebar_product_display_mode !== 'flat'}
                        onCheckedChange={(checked) => handleSidebarSettingChange('sidebar_product_display_mode', checked ? 'hierarchy' : 'flat')}
                      />
                    </div>

                    {(settings.sidebar_product_display_mode !== 'flat') && (
                      <div className="space-y-2 ml-4">
                        <Label htmlFor="sidebar_product_grouping_field">Group Products By</Label>
                        <Select
                          value={settings.sidebar_product_grouping_field || 'category'}
                          onValueChange={(value) => handleSidebarSettingChange('sidebar_product_grouping_field', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select grouping field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="category">Device Category</SelectItem>
                            <SelectItem value="platform">Product Platform</SelectItem>
                            <SelectItem value="model">Model Reference</SelectItem>
                            <SelectItem value="variant">Variant/UDI Suffix</SelectItem>
                            <SelectItem value="basic_udi_di">Basic UDI-DI</SelectItem>
                            <SelectItem value="bundles">Bundles</SelectItem>
                            <SelectItem value="stacked_cards">Stacked cards</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          Choose which field to use for grouping products in the sidebar hierarchy
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="sidebar_product_sort_order">Product Sort Order</Label>
                      <Select
                        value={settings.sidebar_product_sort_order || 'type_then_name'}
                        onValueChange={(value) => handleSidebarSettingChange('sidebar_product_sort_order', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select sort order" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="type_then_name">Product Type, then Name</SelectItem>
                          <SelectItem value="name">Name (Alphabetical)</SelectItem>
                          <SelectItem value="newest_first">Newest First</SelectItem>
                          <SelectItem value="oldest_first">Oldest First</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Choose how products should be sorted within each group
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible> */}

      {/* Traceability Prefixes */}
      <Collapsible open={traceabilityOpen} onOpenChange={setTraceabilityOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Tags className="h-5 w-5" />
                    Traceability Prefixes
                  </CardTitle>
                  <CardDescription>
                    Define ID prefixes used across the V-model traceability chain (User Needs → System Req → SW/HW Req → Risk Measures)
                  </CardDescription>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${traceabilityOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {isPrefixesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-2 text-left font-medium">Category</th>
                          <th className="px-4 py-2 text-left font-medium">Prefix</th>
                          <th className="px-4 py-2 text-left font-medium">Scope</th>
                          <th className="px-4 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(localEntries || []).map((entry, index) => (
                          <tr key={entry.key} className="border-b last:border-0">
                            <td className="px-4 py-2">
                              {entry.isDefault ? (
                                <span className="font-medium">{entry.label}</span>
                              ) : (
                                <Input
                                  value={entry.label}
                                  onChange={(e) => handleEntryChange(index, 'label', e.target.value)}
                                  className="h-8"
                                  placeholder="Category name"
                                />
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <Input
                                value={entry.prefix}
                                onChange={(e) => handleEntryChange(index, 'prefix', e.target.value)}
                                className="h-8 w-24"
                              />
                            </td>
                            <td className="px-4 py-2">
                              {entry.isDefault ? (
                                <span className="text-muted-foreground">{entry.scope}</span>
                              ) : (
                                <Input
                                  value={entry.scope}
                                  onChange={(e) => handleEntryChange(index, 'scope', e.target.value)}
                                  className="h-8"
                                  placeholder="Scope description"
                                />
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {!entry.isDefault && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveEntry(index)}>
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleAddEntry}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Category
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    These prefixes are inherited by all devices in this company. For example, User Need IDs will be generated as <code className="bg-muted px-1 rounded">{(localEntries || [])[0]?.prefix || 'UN-'}DR-01</code>.
                  </p>
                  <div className="flex justify-between pt-2">
                    <Button variant="ghost" size="sm" onClick={handleResetPrefixes}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset to Defaults
                    </Button>
                    <Button size="sm" onClick={handleSavePrefixes} disabled={isSavingPrefixes}>
                      {isSavingPrefixes ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Prefixes
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* API Keys */}
      <Collapsible open={apiKeysOpen} onOpenChange={setApiKeysOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    {lang('settings.systemConfig.apiKeys.title')}
                  </CardTitle>
                  <CardDescription>
                    {lang('settings.systemConfig.apiKeys.description')}
                  </CardDescription>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${apiKeysOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {apiKeys.isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="openai_api_key">{lang('settings.systemConfig.apiKeys.openai')}</Label>
                    <Input
                      id="openai_api_key"
                      type="password"
                      value={localApiKeys.openai || ""}
                      onChange={(e) => handleApiKeyChange("openai", e.target.value)}
                      placeholder="ABC..."
                    />
                    <p className="text-sm text-muted-foreground">
                      {lang('settings.systemConfig.apiKeys.openaiDescription')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="anthropic_api_key">{lang('settings.systemConfig.apiKeys.anthropic')}</Label>
                    <Input
                      id="anthropic_api_key"
                      type="password"
                      value={localApiKeys.anthropic || ""}
                      onChange={(e) => handleApiKeyChange("anthropic", e.target.value)}
                      placeholder="sk-ant-..."
                    />
                    <p className="text-sm text-muted-foreground">
                      {lang('settings.systemConfig.apiKeys.anthropicDescription')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gemini_api_key">{lang('settings.systemConfig.apiKeys.gemini')}</Label>
                    <Input
                      id="gemini_api_key"
                      type="password"
                      value={localApiKeys.gemini || ""}
                      onChange={(e) => handleApiKeyChange("gemini", e.target.value)}
                      placeholder="AI..."
                    />
                    <p className="text-sm text-muted-foreground">
                      {lang('settings.systemConfig.apiKeys.geminiDescription')}
                    </p>
                  </div>

                  {/* <div className="space-y-2">
                    <Label htmlFor="serpapi_api_key">SerpAPI Key</Label>
                    <Input
                      id="serpapi_api_key"
                      type="password"
                      value={localApiKeys.serpapi || ""}
                      onChange={(e) => handleApiKeyChange("serpapi", e.target.value)}
                      placeholder="Enter your SerpAPI key..."
                    />
                    <p className="text-sm text-muted-foreground">
                      Used for Google Image Search functionality in product media
                    </p>
                  </div> */}

                  <div className="space-y-2">
                    <Label htmlFor="google_vertex_api_key">{lang('settings.systemConfig.apiKeys.googleVertex')}</Label>
                    <Input
                      id="google_vertex_api_key"
                      type="password"
                      value={localApiKeys.google_vertex || ""}
                      onChange={(e) => handleApiKeyChange("google_vertex", e.target.value)}
                      placeholder={lang('settings.systemConfig.apiKeys.googleVertexPlaceholder')}
                    />
                    <p className="text-sm text-muted-foreground">
                      {lang('settings.systemConfig.apiKeys.googleVertexDescription')}
                    </p>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleSaveApiKeys}
                      disabled={isSavingApiKeys}
                    >
                      {isSavingApiKeys ? lang('common.saving') : lang('settings.systemConfig.apiKeys.saveButton')}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* AI Prompt Settings */}
      <Collapsible open={aiPromptOpen} onOpenChange={setAiPromptOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    {lang('settings.systemConfig.aiPrompt.title')}
                  </CardTitle>
                  <CardDescription>
                    {lang('settings.systemConfig.aiPrompt.description')}
                  </CardDescription>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${aiPromptOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {isLoadingPrompt ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="additional-instructions">{lang('settings.systemConfig.aiPrompt.instructionsLabel')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {lang('settings.systemConfig.aiPrompt.instructionsDescription')}
                    </p>
                    <Textarea
                      id="additional-instructions"
                      value={additionalInstructions}
                      onChange={(e) => setAdditionalInstructions(e.target.value)}
                      placeholder={lang('settings.systemConfig.aiPrompt.placeholder')}
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="ghost"
                      onClick={handleClearAiPrompt}
                      disabled={!additionalInstructions.trim()}
                      size="sm"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {lang('common.clear')}
                    </Button>
                    <div className="flex-1" />
                    <Button
                      onClick={handleSaveAiPrompt}
                      disabled={isSavingPrompt || additionalInstructions === originalInstructions}
                      size="sm"
                    >
                      {isSavingPrompt ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {lang('common.save')}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* EUDAMED Integration */}
      <EudamedSyncSection
        companyId={companyId}
        companyName={companyName || ''}
        onSyncComplete={() => { }}
      />

      {/* EUDAMED Product Import */}
      <CompanyEudamedImporter companyId={companyId} companyName={companyName || ''} />
    </div>
  );
}