import React, { useState, useEffect, useMemo } from 'react';
import { stripDocPrefix } from '@/utils/templateNameUtils';
import { Plus, FileText, Calendar, User, Download, Trash2, Brain, Eye, Edit, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { DocumentTemplateFileService } from '@/services/documentTemplateFileService';
import { TemplateFilters, TemplateUploadData } from '@/types/templateManagement';
import { TemplateManagementService } from '@/services/templateManagementService';
import { TemplateFilterControls } from './TemplateFilterControls';
import { EnhancedTemplateUploadDialog } from './EnhancedTemplateUploadDialog';
import { TemplateViewDialog } from './TemplateViewDialog';
import { TemplateEditDialog } from './TemplateEditDialog';
import { SOPTemplatePreviewDialog } from './SOPTemplatePreviewDialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface TemplateManagementTabProps {
  companyId: string;
  onOpenAiTemplateDialog: () => void;
  onOpenUploadDialog?: () => void;
}

export function TemplateManagementTab({ companyId, onOpenAiTemplateDialog, onOpenUploadDialog }: TemplateManagementTabProps) {
  const { lang } = useTranslation();
  const { activeCompanyRole } = useCompanyRole();
  const [filters, setFilters] = useState<TemplateFilters>({
    search: '',
  });
  const [companyTemplates, setCompanyTemplates] = useState<any[]>([]);
  const [saasTemplates, setSaasTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [sopPreviewOpen, setSopPreviewOpen] = useState(false);
  const [draftTemplateNames, setDraftTemplateNames] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, [companyId, filters]);

  // Load draft names to know which templates have CI docs
  const loadDraftNames = async () => {
    try {
      const { data } = await supabase
        .from('document_studio_templates')
        .select('name')
        .eq('company_id', companyId);
      if (data) {
        setDraftTemplateNames(new Set(data.map((d: any) => d.name)));
      }
    } catch (e) {
      console.error('Error loading draft names:', e);
    }
  };

  useEffect(() => {
    loadDraftNames();
  }, [companyId]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const { companyTemplates: company, saasTemplates: saas } = await TemplateManagementService.getAllTemplates(companyId, filters);
      setCompanyTemplates(company);
      setSaasTemplates(saas);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: lang('common.error'),
        description: lang('templates.library.loadFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (data: TemplateUploadData) => {
    try {
      setIsUploading(true);
      
      // Create template
      const template = await TemplateManagementService.createTemplate(companyId, data);
      
      // Upload file if provided
      if (data.file) {
        await TemplateManagementService.uploadTemplateFile(template.id, data.file);
      }
      
      toast({
        title: lang('common.success'),
        description: lang('templates.toast.uploadSuccess'),
      });

      await loadTemplates();
    } catch (error) {
      console.error('Error uploading template:', error);
      toast({
        title: lang('common.error'),
        description: lang('templates.toast.uploadFailed'),
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    try {
      await TemplateManagementService.deleteTemplate(templateId);
      toast({
        title: lang('common.success'),
        description: lang('templates.library.deleteSuccess'),
      });
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: lang('common.error'),
        description: lang('templates.library.deleteFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleView = (template: any) => {
    setSelectedTemplate(template);
    setViewDialogOpen(true);
  };

  const isSOP = (name: string) => /^SOP-\d{3}/.test(name);

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    if (isSOP(template.name)) {
      setSopPreviewOpen(true);
    } else {
      setEditDialogOpen(true);
    }
  };

  const handleUpdateTemplate = async (updatedTemplate: any) => {
    try {
      setIsUpdating(true);
      
      // Determine if this is a SaaS template or company template
      const isSaasTemplate = saasTemplates.some(t => t.id === updatedTemplate.id);
      
      // Prepare updates object
      const updates = {
        name: updatedTemplate.name,
        description: updatedTemplate.description,
        document_type: updatedTemplate.document_type,
        scope: updatedTemplate.scope
      };
      
      await TemplateManagementService.updateOrCreateTemplate(
        companyId, 
        updatedTemplate, 
        updates, 
        isSaasTemplate
      );
      
      toast({
        title: lang('common.success'),
        description: isSaasTemplate
          ? lang('templates.library.companyCopyCreated')
          : lang('templates.library.updateSuccess'),
      });

      await loadTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: lang('common.error'),
        description: lang('templates.library.updateFailed'),
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCleanupDuplicates = async () => {
    try {
      setIsLoading(true);
      const result = await TemplateManagementService.cleanupDuplicateTemplates(companyId);
      toast({
        title: lang('common.success'),
        description: lang('templates.library.cleanupSuccess').replace('{{count}}', String(result.cleaned)),
      });
      await loadTemplates();
    } catch (error) {
      console.error('Error cleaning up duplicates:', error);
      toast({
        title: lang('common.error'),
        description: lang('templates.library.cleanupFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (template: any) => {
    if (template.file_path) {
      try {
        const { SuperAdminTemplateManagementService } = await import('@/services/superAdminTemplateManagementService');
        await SuperAdminTemplateManagementService.downloadTemplateFile(template.file_path, template.file_name || 'template');
      } catch (error) {
        console.error('Download failed:', error);
        toast({
          title: lang('common.error'),
          description: lang('templates.library.downloadFailed'),
          variant: "destructive"
        });
      }
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" /> 
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const filteredTemplates = useMemo(() => {
    const companyTemplateNames = new Set(companyTemplates.map(t => t.name));
    const filteredSaasTemplates = saasTemplates.filter(t => !companyTemplateNames.has(t.name));
    
    let templates: any[] = [
      ...companyTemplates.map(t => ({ ...t, source: 'company' })),
      ...filteredSaasTemplates.map(t => ({ ...t, source: 'saas' })),
    ];
    
    if (filters.documentType && filters.documentType !== 'all') {
      templates = templates.filter(template => 
        template.document_type === filters.documentType
      );
    }

    // Apply sorting
    if (sortColumn) {
      templates.sort((a, b) => {
        let aVal = '';
        let bVal = '';
        
        switch (sortColumn) {
          case 'name': aVal = a.name || ''; bVal = b.name || ''; break;
          case 'description': aVal = a.description || ''; bVal = b.description || ''; break;
          case 'type': aVal = a.document_type || ''; bVal = b.document_type || ''; break;
          case 'category': aVal = a.category || ''; bVal = b.category || ''; break;
          case 'scope': aVal = a.scope || ''; bVal = b.scope || ''; break;
          case 'created': aVal = a.created_at || ''; bVal = b.created_at || ''; break;
        }
        
        const cmp = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' });
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }
    
    return templates;
  }, [companyTemplates, saasTemplates, filters, sortColumn, sortDirection]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">{lang('templates.library.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Cleanup Button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium">{lang('templates.library.title')}</h3>
          <p className="text-sm text-muted-foreground">{lang('templates.library.subtitle')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCleanupDuplicates}
          disabled={isLoading}
        >
          {lang('templates.library.cleanupDuplicates')}
        </Button>
      </div>

      {/* Filters */}
      <TemplateFilterControls
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Templates Table */}
      <div className="border rounded-lg">
        <Table>
           <TableHeader>
             <TableRow>
               <TableHead className="w-[40px]"></TableHead>
               <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                 <span className="flex items-center">{lang('templates.library.headers.templateName')}<SortIcon column="name" /></span>
               </TableHead>
               <TableHead className="cursor-pointer select-none" onClick={() => handleSort('description')}>
                 <span className="flex items-center">{lang('templates.library.headers.description')}<SortIcon column="description" /></span>
               </TableHead>
               <TableHead className="cursor-pointer select-none" onClick={() => handleSort('type')}>
                 <span className="flex items-center">{lang('templates.library.headers.type')}<SortIcon column="type" /></span>
               </TableHead>
               <TableHead className="cursor-pointer select-none" onClick={() => handleSort('category')}>
                 <span className="flex items-center">{lang('templates.library.headers.category')}<SortIcon column="category" /></span>
               </TableHead>
               <TableHead className="cursor-pointer select-none" onClick={() => handleSort('scope')}>
                 <span className="flex items-center">{lang('templates.library.headers.scope')}<SortIcon column="scope" /></span>
               </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('created')}>
                 <span className="flex items-center">{lang('templates.library.headers.created')}<SortIcon column="created" /></span>
               </TableHead>
               <TableHead className="text-right">{lang('templates.library.headers.actions')}</TableHead>
             </TableRow>
           </TableHeader>
          <TableBody>
             {filteredTemplates.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                   {lang('templates.library.noTemplates')}
                 </TableCell>
               </TableRow>
            ) : (
              filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell className="font-medium">
                    {stripDocPrefix(template.name)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {template.description || lang('templates.library.noDescription')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {template.document_type || '-'}
                    </Badge>
                  </TableCell>
                   <TableCell>
                     <Badge variant="outline" className="text-xs">
                       {template.category || lang('templates.library.general')}
                     </Badge>
                   </TableCell>
                   <TableCell>
                     <Badge
                       variant={template.scope === 'company' ? 'default' : template.scope === 'both' ? 'secondary' : 'outline'}
                       className="text-xs"
                     >
                       {template.scope === 'company' ? lang('templates.library.scopes.companyWide') :
                        template.scope === 'product' ? lang('templates.library.scopes.productSpecific') :
                        template.scope === 'both' ? lang('templates.library.scopes.both') : lang('templates.library.scopes.companyWide')}
                     </Badge>
                   </TableCell>
                   <TableCell className="text-muted-foreground text-sm">
                    {template.created_at ? 
                      new Date(template.created_at).toLocaleDateString() : 
                      'N/A'
                    }
                  </TableCell>
                   <TableCell className="text-right">
                     <div className="flex items-center justify-end gap-1">
                       {draftTemplateNames.has(template.name) && (
                         <Button
                           variant="ghost"
                           size="sm"
                           className="h-8 w-8 p-0"
                           onClick={() => handleView(template)}
                           title="View draft"
                         >
                           <Eye className="h-4 w-4" />
                         </Button>
                       )}
                       <Button
                         variant="ghost"
                         size="sm"
                         className="h-8 w-8 p-0"
                         onClick={() => handleEdit(template)}
                         title="Edit template"
                       >
                         <Edit className="h-4 w-4" />
                       </Button>
                       {template.file_path && (
                         <Button
                           variant="ghost"
                           size="sm"
                           className="h-8 w-8 p-0"
                           onClick={() => handleDownload(template)}
                           title="Download template"
                         >
                           <Download className="h-4 w-4" />
                         </Button>
                       )}
                       {template.source === 'company' && (
                         <Button
                           variant="ghost"
                           size="sm"
                           className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                           onClick={() => handleDelete(template.id)}
                           title="Delete template"
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       )}
                     </div>
                   </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Upload Dialog */}
      <EnhancedTemplateUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleUpload}
        isUploading={isUploading}
        companyId={companyId}
      />

      {/* View Dialog */}
      <TemplateViewDialog
        template={selectedTemplate}
        isOpen={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedTemplate(null);
        }}
      />

      {/* Edit Dialog */}
      <TemplateEditDialog
        template={selectedTemplate}
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedTemplate(null);
        }}
        onSave={handleUpdateTemplate}
        isLoading={isUpdating}
      />
      {/* SOP Preview Dialog */}
      <SOPTemplatePreviewDialog
        template={selectedTemplate}
        isOpen={sopPreviewOpen}
        onClose={() => {
          setSopPreviewOpen(false);
          setSelectedTemplate(null);
        }}
        onDraftCreated={() => loadDraftNames()}
        companyId={companyId}
        companyName={activeCompanyRole?.companyName || ''}
      />
    </div>
  );
}