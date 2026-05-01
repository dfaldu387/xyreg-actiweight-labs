import React, { useState, useMemo, useEffect } from 'react';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { SuperAdminEnhancedTemplateUploadDialog } from '@/components/super-admin/SuperAdminEnhancedTemplateUploadDialog';
import { SuperAdminBulkTemplateUploadDialog } from '@/components/super-admin/SuperAdminBulkTemplateUploadDialog';
import { TemplateViewerDialog } from '@/components/super-admin/TemplateViewerDialog';
import { DeleteConfirmationDialog } from '@/components/common/DeleteConfirmationDialog';
import { SuperAdminTemplateManagementService, SuperAdminTemplate } from '@/services/superAdminTemplateManagementService';
import { TemplateUploadData } from '@/types/templateManagement';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, Tags, Calendar, Link, Plus, Edit, Trash2, Eye, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WICatalogSection } from '@/components/super-admin/WICatalogSection';
import { FpdCatalogSection } from '@/components/super-admin/FpdCatalogSection';
import { TIER_LABELS, TIER_BADGE_CLASSES, type FpdTier } from '@/services/fpdSopCatalogService';

// Utility function to get badge styling based on document type
const getScopeBadgeStyle = (scope: string | null | undefined) => {
  const type = scope?.toLowerCase();

  const styleMap: Record<string, string> = {
    'company': 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    'product': 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
    'both': 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  };

  return styleMap[type || ''] || 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
};

const getDocumentTypeBadgeStyle = (documentType: string | null | undefined) => {
  const type = documentType?.toLowerCase();

  const styleMap: Record<string, string> = {
    'sop': 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
    'form': 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
    'list': 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    'certificate': 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
  };

  return styleMap[type || ''] || 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
};

function SuperAdminTemplates() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SuperAdminTemplate | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<SuperAdminTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState<SuperAdminTemplate | null>(null);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkUploadProgress, setBulkUploadProgress] = useState(0);

  // State for templates and stats
  const [templates, setTemplates] = useState<SuperAdminTemplate[]>([]);
  const [stats, setStats] = useState({
    totalTemplates: 0,
    uniqueScopes: 0,
    templatesWithFiles: 0,
    documentTypes: [] as string[],
    templateCategories: [] as string[]
  });

  // Load templates and stats on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const [templatesData, statsData] = await Promise.all([
        SuperAdminTemplateManagementService.getAllTemplates(),
        SuperAdminTemplateManagementService.getTemplateStats()
      ]);
      setTemplates(templatesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique scopes for filter dropdown
  const allScopes = useMemo(() => {
    const scopeSet = new Set<string>();
    templates.forEach(template => {
      if (template.scope) {
        scopeSet.add(template.scope);
      }
    });
    return Array.from(scopeSet).sort();
  }, [templates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = !searchTerm ||
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesScope = selectedPhase === 'all' ||
        template.scope === selectedPhase;

      const matchesDocType = selectedDocumentType === 'all' ||
        template.document_type === selectedDocumentType;

      return matchesSearch && matchesScope && matchesDocType;
    });
  }, [templates, searchTerm, selectedPhase, selectedDocumentType]);

  // Handler functions
  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setIsAddDialogOpen(true);
  };

  const handleEditTemplate = (template: SuperAdminTemplate) => {
    setEditingTemplate(template);
    setIsAddDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (!open) {
      setEditingTemplate(null);
    }
  };

  const handleUpload = async (data: TemplateUploadData) => {
    try {
      setIsUploading(true);

      if (editingTemplate) {
        // Update existing template
        await SuperAdminTemplateManagementService.updateTemplate(editingTemplate.id, data);

        // Upload new file if provided
        if (data.file) {
          await SuperAdminTemplateManagementService.uploadTemplateFile(editingTemplate.id, data.file);
        }

        toast.success('Template updated successfully');
      } else {
        // Create new template
        const template = await SuperAdminTemplateManagementService.createTemplate(data);

        // Upload file if provided
        if (data.file) {
          await SuperAdminTemplateManagementService.uploadTemplateFile(template.id, data.file);
        }

        toast.success('Template created successfully');
      }

      await loadTemplates();
    } catch (error) {
      console.error('Error uploading template:', error);
      toast.error('Failed to upload template');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteTemplate = (template: SuperAdminTemplate) => {
    setTemplateToDelete(template);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;

    setIsDeleting(true);
    try {
      await SuperAdminTemplateManagementService.deleteTemplate(templateToDelete.id);
      toast.success('Template deleted successfully');
      setIsDeleteDialogOpen(false);
      setTemplateToDelete(null);
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteDialogClose = (open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
      setTemplateToDelete(null);
    }
  };

  const handleViewTemplate = (template: SuperAdminTemplate) => {
    setViewingTemplate(template);
    setIsViewerOpen(true);
  };

  const handleViewerClose = (open: boolean) => {
    setIsViewerOpen(open);
    if (!open) {
      setViewingTemplate(null);
    }
  };

  const handleBulkUpload = () => {
    setIsBulkDialogOpen(true);
  };

  const handleBulkDialogClose = (open: boolean) => {
    setIsBulkDialogOpen(open);
  };

  const handleBulkUploadSubmit = async (files: any[]) => {
    try {
      setIsBulkUploading(true);
      setBulkUploadProgress(0);
      
      // Sequential create + upload with progress updates
      const createdTemplates: SuperAdminTemplate[] = [];
      for (let i = 0; i < files.length; i++) {
        const fileData = files[i];
        const templateData: TemplateUploadData = {
          name: fileData.name,
          description: fileData.description,
          template_scope: fileData.template_scope,
          document_type: fileData.document_type,
          file: fileData.file
        };

        const created = await SuperAdminTemplateManagementService.createTemplate(templateData);
        createdTemplates.push(created);

        if (fileData.file) {
          await SuperAdminTemplateManagementService.uploadTemplateFile(created.id, fileData.file);
        }

        const progress = Math.round(((i + 1) / files.length) * 100);
        setBulkUploadProgress(progress);
      }

      toast.success(`Successfully uploaded ${createdTemplates.length} template${createdTemplates.length !== 1 ? 's' : ''}`);
      await loadTemplates();
    } catch (error) {
      console.error('Error in bulk upload:', error);
      toast.error('Failed to upload some templates');
      throw error;
    } finally {
      setIsBulkUploading(false);
      setBulkUploadProgress(0);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ConsistentPageHeader
        breadcrumbs={[{ label: 'Templates' }]}
        title="Document Templates"
        subtitle="Manage document templates used across the system"
      />

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 space-y-6">
          <Tabs defaultValue="templates" className="space-y-6">
            <TabsList>
              <TabsTrigger value="templates">Document Templates</TabsTrigger>
              <TabsTrigger value="fpd-catalog">FPD Catalog</TabsTrigger>
              <TabsTrigger value="wi-catalog">WI Catalog</TabsTrigger>
            </TabsList>
            <TabsContent value="templates" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTemplates}</div>
                <p className="text-xs text-muted-foreground">
                  Document templates available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Scopes</CardTitle>
                <Tags className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.uniqueScopes}</div>
                <p className="text-xs text-muted-foreground">
                  Across all templates
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Templates with Files</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.templatesWithFiles}</div>
                <p className="text-xs text-muted-foreground">
                  Have attached files
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Document Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Document Types</SelectItem>
                    {stats.documentTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Scopes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Scopes</SelectItem>
                    {allScopes.map(scope => (
                      <SelectItem key={scope} value={scope}>
                        {scope === 'company' ? 'Company-wide' :
                          scope === 'product' ? 'Product-specific' :
                            scope === 'both' ? 'Both' : scope}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Templates List */}
          <Card>
            <CardHeader>
              <CardTitle>
                <div className='flex flex-col md:flex-row md:items-center md:justify-between justify-start gap-4'>
                  <div>
                    Templates ({filteredTemplates.length})
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleBulkUpload} variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Bulk Upload
                    </Button>
                    <Button onClick={handleAddTemplate} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Template
                    </Button>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading templates...
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTemplates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No templates found.
                    </div>
                  ) : (
                    <>
                      {/* Templates */}
                      {filteredTemplates.map((template) => (
                        <div
                          key={`template-${template.id}`}
                          className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-lg">{template.name}</h3>
                                    {(template.file_path || template.public_url) && (
                                      <Link className="h-4 w-4 text-green-600" />
                                    )}
                                    {template.document_type && (
                                      <Badge
                                        variant="outline"
                                        className={cn("text-xs font-medium", getDocumentTypeBadgeStyle(template.document_type))}
                                      >
                                        {template.document_type}
                                      </Badge>
                                    )}
                                    {template.scope && (
                                      <Badge
                                        variant="outline"
                                        className={cn("text-xs font-medium", getScopeBadgeStyle(template.scope))}
                                      >
                                        {template.scope === 'company' ? 'Company-wide' :
                                          template.scope === 'product' ? 'Product-specific' :
                                            template.scope === 'both' ? 'Both' : template.scope}
                                      </Badge>
                                    )}
                                    {template.fpd_sop_key && (
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          'text-xs font-medium',
                                          template.fpd_tier
                                            ? TIER_BADGE_CLASSES[template.fpd_tier as FpdTier]
                                            : '',
                                        )}
                                        title="Linked to FPD catalog entry"
                                      >
                                        → {template.fpd_sop_key}
                                        {template.fpd_tier && (
                                          <span className="ml-1 opacity-75">
                                            · {TIER_LABELS[template.fpd_tier as FpdTier]}
                                          </span>
                                        )}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {template.file_path && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewTemplate(template)}
                                        title="View template"
                                      >
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditTemplate(template)}
                                      title="Edit template"
                                    >
                                      <Edit className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteTemplate(template)}
                                      title="Delete template"
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                                {template.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {template.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  {template.file_name && (
                                    <span>File: {template.file_name}</span>
                                  )}
                                  {template.file_size && (
                                    <span>Size: {(template.file_size / 1024).toFixed(1)} KB</span>
                                  )}
                                  {template.template_category && (
                                    <span>Category: {template.template_category}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
            </TabsContent>
            <TabsContent value="fpd-catalog">
              <FpdCatalogSection />
            </TabsContent>
            <TabsContent value="wi-catalog">
              <WICatalogSection />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <SuperAdminEnhancedTemplateUploadDialog
        open={isAddDialogOpen}
        onOpenChange={handleDialogClose}
        onUpload={handleUpload}
        isUploading={isUploading}
        editingTemplate={editingTemplate}
      />

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogClose}
        onConfirm={handleConfirmDelete}
        title="Delete Template"
        message="Are you sure you want to delete this template?"
        itemName={templateToDelete?.name}
        itemType="template"
        isLoading={isDeleting}
      />

      {/* Template Viewer Dialog */}
      {viewingTemplate && (
        <TemplateViewerDialog
          template={viewingTemplate}
          open={isViewerOpen}
          onOpenChange={handleViewerClose}
        />
      )}

      {/* Bulk Upload Dialog */}
      <SuperAdminBulkTemplateUploadDialog
        open={isBulkDialogOpen}
        onOpenChange={handleBulkDialogClose}
        onBulkUpload={handleBulkUploadSubmit}
        isUploading={isBulkUploading}
        uploadProgress={bulkUploadProgress}
      />
    </div>
  );
}

export default SuperAdminTemplates;
