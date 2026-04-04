import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  CheckCircle,
  Settings,
  Search,
  Info,
  Save,
  X,
  HelpCircle,
  Book,
  Shield,
  TestTube,
  Edit,
  Plus,
  Trash2,
  Loader2
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CompanyGapTemplateService } from "@/services/CompanyGapTemplateService";
import { RequirementEditDialog } from "./gap-analysis/RequirementEditDialog";
import { AddRequirementDialog } from "./gap-analysis/AddRequirementDialog";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import type { Database } from "@/integrations/supabase/types";

type GapTemplate = Database["public"]["Tables"]["gap_analysis_templates"]["Row"];

interface CompanyPhase {
  id: string;
  name: string;
  company_id: string;
  position: number;
}

interface GapTemplateConfigurationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: GapTemplate | null;
  companyId: string;
  requirements?: Array<{
    id: string;
    requirement_text: string;
    item_number: string;
    category?: string;
    clause_reference?: string;
    guidance_text?: string;
  }>;
  onScopeUpdate?: (templateId: string, scope: 'company' | 'product') => Promise<void>;
  companyPhases?: CompanyPhase[];
  onPhasesUpdate?: (templateId: string, phaseIds: string[]) => Promise<void>;
  getTemplatePhases?: (template: any) => string[];
}

export function GapTemplateConfigurationDialog({
  open,
  onOpenChange,
  template,
  companyId,
  requirements = [],
  onScopeUpdate,
  companyPhases = [],
  onPhasesUpdate,
  getTemplatePhases
}: GapTemplateConfigurationDialogProps) {
  const { lang } = useTranslation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentScope, setCurrentScope] = useState<'company' | 'product'>(
    template?.scope as 'company' | 'product' || 'company'
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [templateRequirements, setTemplateRequirements] = useState<any[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Load template items from database when dialog opens
  useEffect(() => {
    const loadTemplateItems = async () => {
      if (!template?.id || !open) return;
      
      setIsLoading(true);
      try {
        const items = await CompanyGapTemplateService.getTemplateItems(template.id);
        setTemplateRequirements(items);
      } catch (error) {
        console.error('Failed to load template items:', error);
        toast({
          title: lang('common.error'),
          description: lang('companySettings.gapTemplateConfig.failedToLoadRequirements'),
          variant: "destructive",
        });
        // Fallback to prop requirements if loading fails
        setTemplateRequirements(requirements);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplateItems();
  }, [template?.id, open, requirements, toast]);

  // Update state when template changes
  useEffect(() => {
    if (template && open) {
      setCurrentScope(template.scope as 'company' | 'product' || 'company');
      setHasChanges(false);
    }
  }, [template, open]);

  if (!template) return null;

  // Filter and search requirements using templateRequirements state
  const filteredRequirements = templateRequirements.filter(req => {
    const matchesSearch = req.requirement_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.item_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.clause_reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || req.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group requirements by category using templateRequirements
  const requirementsByCategory = templateRequirements.reduce((acc, req) => {
    const category = req.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(req);
    return acc;
  }, {} as Record<string, typeof templateRequirements>);

  const categories = Object.keys(requirementsByCategory);
  const uniqueCategories = [...new Set(templateRequirements.map(r => r.category).filter(Boolean))];

  // Category explanations and icons
  const getCategoryInfo = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'documentation':
        return {
          icon: <Book className="h-4 w-4" />,
          description: lang('companySettings.gapTemplateConfig.categories.documentation.description'),
          examples: lang('companySettings.gapTemplateConfig.categories.documentation.examples')
        };
      case 'verification':
        return {
          icon: <TestTube className="h-4 w-4" />,
          description: lang('companySettings.gapTemplateConfig.categories.verification.description'),
          examples: lang('companySettings.gapTemplateConfig.categories.verification.examples')
        };
      case 'compliance':
        return {
          icon: <Shield className="h-4 w-4" />,
          description: lang('companySettings.gapTemplateConfig.categories.compliance.description'),
          examples: lang('companySettings.gapTemplateConfig.categories.compliance.examples')
        };
      default:
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          description: lang('companySettings.gapTemplateConfig.categories.default.description'),
          examples: lang('companySettings.gapTemplateConfig.categories.default.examples')
        };
    }
  };

  const handleScopeChange = (newScope: 'company' | 'product') => {
    setCurrentScope(newScope);
    setHasChanges(newScope !== template.scope);
  };

  const handleSave = async () => {
    if (!template.id || !onScopeUpdate || !hasChanges) return;
    
    setIsSaving(true);
    try {
      await onScopeUpdate(template.id, currentScope);
      setHasChanges(false);
      // Optimistically update the template prop locally
      template.scope = currentScope;
    } catch (error) {
      console.error('Failed to save changes:', error);
      // Revert on error
      setCurrentScope(template.scope as 'company' | 'product' || 'company');
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setCurrentScope(template.scope as 'company' | 'product' || 'company');
    setHasChanges(false);
  };

  const handleEditRequirement = async (requirementData: any) => {
    try {
      await CompanyGapTemplateService.updateTemplateItem(requirementData.id, requirementData);
      // Refresh requirements list
      const updatedRequirements = templateRequirements.map(req =>
        req.id === requirementData.id ? { ...req, ...requirementData } : req
      );
      setTemplateRequirements(updatedRequirements);
      setEditingRequirement(null);
      setIsEditDialogOpen(false);
      toast({
        title: lang('common.success'),
        description: lang('companySettings.gapTemplateConfig.requirementUpdated'),
      });
    } catch (error) {
      toast({
        title: lang('common.error'),
        description: lang('companySettings.gapTemplateConfig.failedToUpdateRequirement'),
        variant: "destructive",
      });
    }
  };

  const handleAddRequirement = async (requirementData: any) => {
    try {
      const newRequirement = await CompanyGapTemplateService.createTemplateItem(template.id, requirementData);
      setTemplateRequirements([...templateRequirements, newRequirement]);
      setIsAddDialogOpen(false);
      toast({
        title: lang('common.success'),
        description: lang('companySettings.gapTemplateConfig.requirementAdded'),
      });
    } catch (error) {
      toast({
        title: lang('common.error'),
        description: lang('companySettings.gapTemplateConfig.failedToAddRequirement'),
        variant: "destructive",
      });
    }
  };

  const handleDeleteRequirement = async (requirementId: string) => {
    if (!confirm(lang('companySettings.gapTemplateConfig.confirmDeleteRequirement'))) {
      return;
    }

    try {
      await CompanyGapTemplateService.deleteTemplateItem(requirementId);
      setTemplateRequirements(templateRequirements.filter(req => req.id !== requirementId));
      toast({
        title: lang('common.success'),
        description: lang('companySettings.gapTemplateConfig.requirementDeleted'),
      });
    } catch (error) {
      toast({
        title: lang('common.error'),
        description: lang('companySettings.gapTemplateConfig.failedToDeleteRequirement'),
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (requirement: any) => {
    setEditingRequirement(requirement);
    setIsEditDialogOpen(true);
  };

  const openAddDialog = () => {
    setIsAddDialogOpen(true);
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {lang('companySettings.gapTemplateConfig.configureTemplate')}: {template.name}
            </DialogTitle>
          </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              {lang('companySettings.gapTemplateConfig.tabs.overview')}
            </TabsTrigger>
            <TabsTrigger value="requirements" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {lang('companySettings.gapTemplateConfig.tabs.requirements')} ({isLoading ? "..." : templateRequirements.length})
            </TabsTrigger>
            <TabsTrigger value="configuration" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {lang('companySettings.gapTemplateConfig.tabs.configuration')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 mt-4">
            <div className="space-y-6">
              {/* Template Information */}
              <div>
                <h3 className="font-semibold text-lg mb-4">{lang('companySettings.gapTemplateConfig.templateDetails')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="font-medium">{lang('companySettings.gapTemplateConfig.framework')}</span>
                    </div>
                    <p className="text-lg font-semibold">{template.framework}</p>
                    <Badge variant="outline" className="mt-1">{template.regulatory_framework || lang('companySettings.gapTemplateConfig.general')}</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">{lang('companySettings.gapTemplateConfig.requirements')}</span>
                    </div>
                    <p className="text-lg font-semibold">{isLoading ? "..." : templateRequirements.length}</p>
                    <p className="text-xs text-muted-foreground">{lang('companySettings.gapTemplateConfig.totalItemsToReview')}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">{lang('companySettings.gapTemplateConfig.scope')}</span>
                    </div>
                    <p className="text-lg font-semibold capitalize">{template.scope === 'company' ? 'Enterprise' : 'Device'}</p>
                    <p className="text-xs text-muted-foreground">
                      {template.scope === 'product' ? lang('companySettings.gapTemplateConfig.appliedPerProduct') : lang('companySettings.gapTemplateConfig.appliedCompanyWide')}
                    </p>
                  </div>
                </div>
                {template.description && (
                  <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                    <p className="text-sm font-medium mb-1">{lang('companySettings.gapTemplateConfig.description')}</p>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                )}
              </div>

              {/* Requirements by Category */}
              <div>
                <h3 className="font-semibold text-lg mb-4">{lang('companySettings.gapTemplateConfig.requirementsByCategory')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {uniqueCategories.map(category => {
                    const categoryInfo = getCategoryInfo(category);
                    const count = templateRequirements.filter(r => r.category === category).length;
                    return (
                      <div key={category} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          {categoryInfo.icon}
                          <span className="font-medium capitalize">{category}</span>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-medium">{categoryInfo.description}</p>
                                <p className="text-xs text-muted-foreground">{lang('companySettings.gapTemplateConfig.examples')}: {categoryInfo.examples}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-2xl font-bold text-primary">{count}</p>
                        <p className="text-sm text-muted-foreground">{lang('companySettings.gapTemplateConfig.requirementsLabel')}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

           <TabsContent value="requirements" className="mt-4">
            {/* Fixed Header with Search and Filter */}
            <div className="space-y-4 pb-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={lang('companySettings.gapTemplateConfig.searchRequirements')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={lang('companySettings.gapTemplateConfig.category')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{lang('companySettings.gapTemplateConfig.allCategories')}</SelectItem>
                    {uniqueCategories.map(category => (
                      <SelectItem key={category} value={category} className="capitalize">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={openAddDialog}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {lang('companySettings.gapTemplateConfig.addRequirement')}
                </Button>
              </div>
            </div>

            {/* Scrollable Requirements List */}
            <div>
              {isLoading ? (
                <div className="h-[calc(90vh-280px)] border rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
                    <p className="text-lg font-medium">{lang('companySettings.gapTemplateConfig.loadingRequirements')}</p>
                    <p className="text-sm text-muted-foreground">{lang('companySettings.gapTemplateConfig.pleaseWait')}</p>
                  </div>
                </div>
              ) : filteredRequirements.length > 0 ? (
                <ScrollArea className="h-[calc(90vh-280px)] border rounded-lg">
                  <div className="p-4 space-y-4">
                    {filteredRequirements.map((req, index) => {
                      const categoryInfo = getCategoryInfo(req.category || '');
                      return (
                        <div key={index} className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs font-mono">
                                {req.item_number}
                              </Badge>
                              {req.category && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="secondary" className="text-xs capitalize flex items-center gap-1">
                                      {categoryInfo.icon}
                                      {req.category}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <div className="space-y-1">
                                      <p className="font-medium">{categoryInfo.description}</p>
                                      <p className="text-xs text-muted-foreground">Examples: {categoryInfo.examples}</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(req)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRequirement(req.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {req.clause_reference && (
                            <div className="flex items-center gap-1 mb-2">
                              <p className="text-sm font-medium text-blue-600">
                                {lang('companySettings.gapTemplateConfig.reference')}: {req.clause_reference}
                              </p>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="text-sm">
                                    {lang('companySettings.gapTemplateConfig.referenceTooltip', { framework: template.framework })}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          )}

                          <h4 className="font-medium text-base mb-2 leading-relaxed">
                            {req.requirement_text}
                          </h4>

                          {req.guidance_text && (
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded border-l-4 border-blue-200">
                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium">{lang('companySettings.gapTemplateConfig.guidance')}:</span> {req.guidance_text}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-full flex items-center justify-center border rounded-lg bg-muted/30">
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">{lang('companySettings.gapTemplateConfig.noRequirementsFound')}</p>
                    <p className="text-sm mt-1">
                      {searchTerm || selectedCategory !== "all"
                        ? lang('companySettings.gapTemplateConfig.tryAdjustingSearch')
                        : lang('companySettings.gapTemplateConfig.noRequirementsDefined')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="configuration" className="flex-1 mt-4">
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="font-semibold text-lg mb-4">{lang('companySettings.gapTemplateConfig.templateConfiguration')}</h3>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="scope">{lang('companySettings.gapTemplateConfig.templateScope')}</Label>
                    <Select value={currentScope} onValueChange={handleScopeChange}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="company">
                          <div>
                            <div className="font-medium">{lang('companySettings.gapTemplateConfig.companyWide')}</div>
                            <div className="text-xs text-muted-foreground">{lang('companySettings.gapTemplateConfig.companyWideDesc')}</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="product">
                          <div>
                            <div className="font-medium">{lang('companySettings.gapTemplateConfig.perProduct')}</div>
                            <div className="text-xs text-muted-foreground">{lang('companySettings.gapTemplateConfig.perProductDesc')}</div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {currentScope === 'company'
                        ? lang('companySettings.gapTemplateConfig.companyScopeHelp')
                        : lang('companySettings.gapTemplateConfig.productScopeHelp')
                      }
                    </p>
                  </div>

                  {hasChanges && (
                    <div className="p-4 border border-orange-200 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                      <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                        {lang('companySettings.gapTemplateConfig.unsavedChanges')}
                      </p>
                      <div className="flex gap-2">
                        <Button onClick={handleSave} disabled={isSaving} size="sm">
                          <Save className="h-4 w-4 mr-1" />
                          {isSaving ? lang('common.saving') : lang('companySettings.gapTemplateConfig.saveChanges')}
                        </Button>
                        <Button onClick={handleCancel} variant="outline" size="sm">
                          <X className="h-4 w-4 mr-1" />
                          {lang('common.cancel')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>
            {lang('common.close')}
          </Button>
          </div>

          {/* Edit Requirement Modal Dialog */}
          <RequirementEditDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            requirement={editingRequirement}
            onSave={handleEditRequirement}
            isLoading={isSaving}
          />

          {/* Add Requirement Modal Dialog */}
          <AddRequirementDialog
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            templateId={template.id}
            onSave={handleAddRequirement}
            isLoading={isSaving}
            nextSortOrder={templateRequirements.length}
          />
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}