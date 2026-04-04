import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileText, Save, Plus, Edit, Trash2, ChevronDown } from 'lucide-react';
import { TEMPLATE_CATEGORIES } from '@/types/templateManagement';
import { CategoryNumberingConfig, DEFAULT_NUMBERING_CONFIG, NUMBER_FORMATS, VERSION_FORMATS } from '@/types/documentCategories';
import { CategoryEditDialog } from './CategoryEditDialog';
import { fetchTemplateSettings, saveTemplateSettings } from '@/utils/templateSettingsQueries';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';

interface DocumentCategoryNumberingSystemProps {
  companyId: string;
}

export function DocumentCategoryNumberingSystem({ companyId }: DocumentCategoryNumberingSystemProps) {
  const { lang } = useTranslation();
  const [configs, setConfigs] = useState<CategoryNumberingConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryNumberingConfig | undefined>();
  const [deleteCategory, setDeleteCategory] = useState<CategoryNumberingConfig | undefined>();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { user, session } = useAuth();

  useEffect(() => {
    loadConfigurations();
  }, [companyId]);

  const loadConfigurations = async () => {
    try {
      setIsLoading(true);
      const settings = await fetchTemplateSettings(companyId);
      
      // Get predefined categories
      const predefinedConfigs: CategoryNumberingConfig[] = Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => {
        const existingSetting = settings.find(s => 
          s.category === 'defaults' && 
          s.setting_key === `document_numbering_${key}`
        );

        if (existingSetting && existingSetting.setting_value && typeof existingSetting.setting_value === 'object') {
          return {
            categoryKey: key,
            categoryName: category.label,
            description: category.description,
            isCustom: false,
            prefix: existingSetting.setting_value.prefix || getDefaultPrefix(key, category.label),
            numberFormat: existingSetting.setting_value.numberFormat || DEFAULT_NUMBERING_CONFIG.numberFormat,
            startingNumber: existingSetting.setting_value.startingNumber || DEFAULT_NUMBERING_CONFIG.startingNumber,
            versionFormat: existingSetting.setting_value.versionFormat || DEFAULT_NUMBERING_CONFIG.versionFormat,
          };
        }

        return {
          categoryKey: key,
          categoryName: category.label,
          description: category.description,
          isCustom: false,
          prefix: getDefaultPrefix(key, category.label),
          numberFormat: DEFAULT_NUMBERING_CONFIG.numberFormat,
          startingNumber: DEFAULT_NUMBERING_CONFIG.startingNumber,
          versionFormat: DEFAULT_NUMBERING_CONFIG.versionFormat,
        };
      });

      // Get custom categories
      const customCategories = settings.filter(s => 
        s.category === 'defaults' && 
        s.setting_key.startsWith('custom_category_')
      ).map(setting => {
        const value = setting.setting_value as any;
        return {
          categoryKey: setting.setting_key.replace('custom_category_', ''),
          categoryName: value?.categoryName || '',
          description: value?.description || '',
          isCustom: true,
          prefix: value?.prefix || 'DOC',
          numberFormat: value?.numberFormat || DEFAULT_NUMBERING_CONFIG.numberFormat,
          startingNumber: value?.startingNumber || DEFAULT_NUMBERING_CONFIG.startingNumber,
          versionFormat: value?.versionFormat || DEFAULT_NUMBERING_CONFIG.versionFormat,
        };
      });

      setConfigs([...predefinedConfigs, ...customCategories]);
    } catch (error) {
      console.error('Error loading category configurations:', error);
      toast.error(lang('settings.documentNumbering.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultPrefix = (categoryKey: string, categoryLabel: string): string => {
    const prefixMap: Record<string, string> = {
      'quality-system-procedures': 'SOP',
      'design-development': 'DD',
      'safety-risk-management': 'RISK',
      'regulatory-clinical': 'REG',
      'operations-production': 'OPS',
      'forms-logs': 'FORM',
    };

    return prefixMap[categoryKey] || categoryLabel.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  const handleConfigChange = (categoryKey: string, field: keyof CategoryNumberingConfig, value: string) => {
    setConfigs(prev => prev.map(config => 
      config.categoryKey === categoryKey 
        ? { ...config, [field]: value }
        : config
    ));
    setHasUnsavedChanges(true);
  };

  const generatePreview = (config: CategoryNumberingConfig): string => {
    const numberExample = config.numberFormat === 'XXX' ? '001' : 
                         config.numberFormat === 'XXXX' ? '0001' : 
                         config.numberFormat === 'XX-XX' ? '01-01' : '001';
    
    return `${config.prefix}-${numberExample} ${config.versionFormat}`;
  };

  const handleAddCategory = () => {
    setEditingCategory(undefined);
    setEditDialogOpen(true);
  };

  const handleEditCategory = (category: CategoryNumberingConfig) => {
    setEditingCategory(category);
    setEditDialogOpen(true);
  };

  const handleSaveCategory = (category: CategoryNumberingConfig) => {
    setConfigs(prev => {
      const existing = prev.find(c => c.categoryKey === category.categoryKey);
      if (existing) {
        // Update existing
        return prev.map(c => c.categoryKey === category.categoryKey ? category : c);
      } else {
        // Add new
        return [...prev, category];
      }
    });
    setHasUnsavedChanges(true);
    toast.success(lang('settings.documentNumbering.categoryAddedSuccess'));
  };

  const handleDeleteCategory = (category: CategoryNumberingConfig) => {
    setConfigs(prev => prev.filter(c => c.categoryKey !== category.categoryKey));
    setDeleteCategory(undefined);
    setHasUnsavedChanges(true);
    toast.success(lang('settings.documentNumbering.categoryDeletedSuccess'));
  };

  const saveConfigurations = async () => {
    try {
      setIsSaving(true);
      console.log('=== Save Configurations Started ===');
      console.log('Current configs to save:', configs);
      console.log('Company ID:', companyId);
      console.log('User object:', user);
      console.log('Session object:', session);
      
      // Convert configurations to template settings format
      const settingsToSave = configs.map(config => {
        const settingKey = config.isCustom 
          ? `custom_category_${config.categoryKey}`
          : `document_numbering_${config.categoryKey}`;
          
        const settingValue = config.isCustom
          ? {
              categoryName: config.categoryName,
              description: config.description,
              prefix: config.prefix,
              numberFormat: config.numberFormat,
              startingNumber: config.startingNumber,
              versionFormat: config.versionFormat,
            }
          : {
              prefix: config.prefix,
              numberFormat: config.numberFormat,
              startingNumber: config.startingNumber,
              versionFormat: config.versionFormat,
            };

        return {
          company_id: companyId,
          setting_key: settingKey,
          setting_value: settingValue,
          setting_type: 'object' as const,
          category: 'defaults' as const,
        };
      });

      console.log('Settings to save:', settingsToSave);
      console.log('About to call saveTemplateSettings with auth context...');
      
      await saveTemplateSettings(companyId, settingsToSave, user, session);
      console.log('saveTemplateSettings completed successfully');
      toast.success(lang('settings.documentNumbering.saveSuccess'));
      setHasUnsavedChanges(false);
      
      // Dispatch event for other components to react to changes
      window.dispatchEvent(new CustomEvent('company-data-updated', { 
        detail: { companyId, type: 'document_category_numbering', data: configs } 
      }));
      
    } catch (error) {
      console.error('Error saving category configurations:', error);
      toast.error(lang('settings.documentNumbering.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {lang('settings.documentNumbering.title')}
                  </CardTitle>
                  <CardDescription>
                    {lang('settings.documentNumbering.description')}
                  </CardDescription>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">{lang('settings.documentNumbering.loading')}</div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {lang('settings.documentNumbering.title')}
                </CardTitle>
                <CardDescription>
                  {lang('settings.documentNumbering.description')}
                </CardDescription>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">{lang('settings.documentNumbering.sectionTitle')}</h3>
                <p className="text-sm text-muted-foreground">
                  {lang('settings.documentNumbering.sectionDescription')}
                </p>
              </div>
              <Button onClick={handleAddCategory} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {lang('settings.documentNumbering.addCategory')}
              </Button>
            </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang('settings.documentNumbering.table.category')}</TableHead>
                <TableHead>{lang('settings.documentNumbering.table.prefix')}</TableHead>
                <TableHead>{lang('settings.documentNumbering.table.numberFormat')}</TableHead>
                <TableHead>{lang('settings.documentNumbering.table.startingNumber')}</TableHead>
                <TableHead>{lang('settings.documentNumbering.table.versionFormat')}</TableHead>
                <TableHead>{lang('settings.documentNumbering.table.preview')}</TableHead>
                <TableHead className="w-24">{lang('settings.documentNumbering.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.map((config) => (
                <TableRow key={config.categoryKey}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{config.categoryName}</span>
                        {config.isCustom && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{lang('settings.documentNumbering.custom')}</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {config.description || 
                         TEMPLATE_CATEGORIES[config.categoryKey as keyof typeof TEMPLATE_CATEGORIES]?.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={config.prefix}
                      onChange={(e) => handleConfigChange(config.categoryKey, 'prefix', e.target.value)}
                      className="w-20"
                      placeholder="SOP"
                    />
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={config.numberFormat}
                      onValueChange={(value) => handleConfigChange(config.categoryKey, 'numberFormat', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NUMBER_FORMATS.map(format => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={config.startingNumber}
                      onChange={(e) => handleConfigChange(config.categoryKey, 'startingNumber', e.target.value)}
                      className="w-20"
                      placeholder="001"
                    />
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={config.versionFormat}
                      onValueChange={(value) => handleConfigChange(config.categoryKey, 'versionFormat', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VERSION_FORMATS.map(format => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {generatePreview(config)}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(config)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{lang('settings.documentNumbering.deleteTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {config.isCustom
                                ? lang('settings.documentNumbering.deleteCustomConfirm', { name: config.categoryName })
                                : lang('settings.documentNumbering.deleteSystemConfirm', { name: config.categoryName })
                              }
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{lang('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCategory(config)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {lang('common.delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">{lang('settings.documentNumbering.standards.title')}</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• {lang('settings.documentNumbering.standards.iso13485')}</li>
            <li>• {lang('settings.documentNumbering.standards.cfr820')}</li>
            <li>• {lang('settings.documentNumbering.standards.euMdr')}</li>
            <li>• {lang('settings.documentNumbering.standards.categoryPrefixes')}</li>
          </ul>
        </div>

            <div className="flex justify-end">
              <Button
                onClick={saveConfigurations}
                disabled={isSaving}
                className={`flex items-center gap-2 ${hasUnsavedChanges ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
              >
                <Save className="h-4 w-4" />
                {isSaving ? lang('common.saving') : hasUnsavedChanges ? lang('settings.documentNumbering.saveChangesUnsaved') : lang('settings.documentNumbering.saveButton')}
              </Button>
            </div>

            <CategoryEditDialog
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              category={editingCategory}
              onSave={handleSaveCategory}
              isEdit={!!editingCategory}
            />
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}