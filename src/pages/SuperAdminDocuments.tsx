import React, { useState, useMemo } from 'react';
import { standardDocData } from '@/data/standardDocData';
import { StandardDocType } from '@/types/standardDocType';
import { useDefaultDocumentTemplates } from '@/hooks/useDefaultDocumentTemplates';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { AddDefaultDocumentDialog } from '@/components/AddDefaultDocumentDialog';
import { DeleteConfirmationDialog } from '@/components/common/DeleteConfirmationDialog';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, Tags, Calendar, Link, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Utility function to get badge styling based on document type
const getDocumentTypeBadgeStyle = (documentType: string | null | undefined) => {
  const type = documentType?.toLowerCase();

  const styleMap: Record<string, string> = {
    'standard': 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    'regulatory': 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
    'technical': 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    'clinical': 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
    'quality': 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
    'design': 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
    'sop': 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
  };

  return styleMap[type || ''] || 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
};

function SuperAdminDocuments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Use standardDocData directly
  const documents: StandardDocType[] = standardDocData;

  // Fetch default document templates
  const {
    templates,
    isLoading: templatesLoading,
    stats,
    documentTypes,
    refetch,
    createTemplate,
    editTemplate,
    deleteTemplate
  } = useDefaultDocumentTemplates();

  // Get unique phases for filter dropdown
  const allPhases = useMemo(() => {
    const phaseSet = new Set<string>();
    documents.forEach(doc => {
      doc.phases.forEach(phase => phaseSet.add(phase));
    });
    // Add template phases
    templates.forEach(template => {
      if (template.phase_id) {
        template.phase_id.forEach(phaseId => phaseSet.add(phaseId));
      }
    });
    return Array.from(phaseSet).sort();
  }, [documents, templates]);

  // Combined document types for filter
  const allDocumentTypes = useMemo(() => {
    const types = ['Standard', ...documentTypes];
    return [...new Set(types)].sort();
  }, [documentTypes]);

  // Filter standard documents
  const filteredDocuments = useMemo(() => {
    if (selectedDocumentType !== 'all' && selectedDocumentType !== 'Standard') {
      return [];
    }

    return documents.filter(doc => {
      const matchesSearch = !searchTerm ||
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.example.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPhase = selectedPhase === 'all' || doc.phases.includes(selectedPhase);

      return matchesSearch && matchesPhase;
    });
  }, [documents, searchTerm, selectedPhase, selectedDocumentType]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    if (selectedDocumentType === 'Standard') {
      return [];
    }

    return templates.filter(template => {
      const matchesSearch = !searchTerm ||
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesPhase = selectedPhase === 'all' ||
        (template.phase_id && template.phase_id.includes(selectedPhase));

      const matchesDocType = selectedDocumentType === 'all' ||
        template.document_type === selectedDocumentType;

      return matchesSearch && matchesPhase && matchesDocType;
    });
  }, [templates, searchTerm, selectedPhase, selectedDocumentType]);

  // Get stats for standard documents
  const totalStandardDocuments = documents.length;
  const uniqueStandardPhases = allPhases.length;
  const documentsWithMultiplePhases = documents.filter(doc => doc.phases.length > 1).length;

  // Combined stats
  const combinedStats = {
    totalStandard: totalStandardDocuments,
    totalTemplates: stats.totalTemplates,
    totalCombined: totalStandardDocuments + stats.totalTemplates,
    uniquePhases: Math.max(uniqueStandardPhases, stats.uniquePhases),
    templatesWithFiles: stats.templatesWithFiles
  };

  // Handler functions
  const handleAddDocument = () => {
    setEditingTemplate(null);
    setIsAddDialogOpen(true);
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setIsAddDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (!open) {
      setEditingTemplate(null);
    }
  };

  const handleDeleteTemplate = (template: any) => {
    setTemplateToDelete(template);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;

    setIsDeleting(true);
    try {
      const success = await deleteTemplate(templateToDelete.id);
      if (success) {
        toast.success('Document template deleted successfully');
        setIsDeleteDialogOpen(false);
        setTemplateToDelete(null);
      } else {
        toast.error('Failed to delete document template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete document template');
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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ConsistentPageHeader
        breadcrumbs={[{ label: 'Documents' }]}
        title="Standard Document Templates"
        subtitle="Default document templates used across the system"
      />

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{combinedStats.totalCombined}</div>
                <p className="text-xs text-muted-foreground">
                  Standard document templates
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Phases</CardTitle>
                <Tags className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{combinedStats.uniquePhases}</div>
                <p className="text-xs text-muted-foreground">
                  Across all documents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Multi-Phase Docs</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documentsWithMultiplePhases}</div>
                <p className="text-xs text-muted-foreground">
                  Used in multiple phases
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
                    placeholder="Search documents..."
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
                    {allDocumentTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Phases" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Phases</SelectItem>
                    {allPhases.map(phase => (
                      <SelectItem key={phase} value={phase}>
                        {phase}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card>
            <CardHeader>
              <CardTitle>
                <div className='flex flex-col md:flex-row md:items-center md:justify-between justify-start gap-4'>
                  <div>
                    Standard Documents ({filteredDocuments.length + filteredTemplates.length})
                  </div>
                  <div>
                    <Button onClick={handleAddDocument} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Document
                    </Button>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading templates...
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDocuments.length === 0 && filteredTemplates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No documents found.
                    </div>
                  ) : (
                    <>
                      {/* Standard Documents */}
                      {filteredDocuments.map((doc, index) => (
                        <div
                          key={`standard-${doc.name}-${index}`}
                          className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-lg">{doc.name}</h3>
                                  <Badge
                                    variant="outline"
                                    className={cn("text-xs font-medium", getDocumentTypeBadgeStyle('Standard'))}
                                  >
                                    Standard
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {doc.description}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2 italic">
                                  Example: {doc.example}
                                </p>
                              </div>
                            </div>

                            <div className="ml-8">
                              <div className="flex items-center gap-2 mb-2">
                                <Tags className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">
                                  Applicable Phases ({doc.phases.length}):
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {doc.phases.map((phase, phaseIndex) => (
                                  <Badge
                                    key={`${phase}-${phaseIndex}`}
                                    variant="outline"
                                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                  >
                                    {phase}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Default Templates */}
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
                                    <Badge
                                      variant="outline"
                                      className={cn("text-xs font-medium", getDocumentTypeBadgeStyle(template.document_type))}
                                    >
                                      {template.document_type || 'Template'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleEditTemplate(template)}
                                    >
                                      <Edit className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleDeleteTemplate(template)}
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
                                </div>
                              </div>
                            </div>

                            {template.phase_id && template.phase_id.length > 0 && (
                              <div className="ml-8">
                                <div className="flex items-center gap-2 mb-2">
                                  <Tags className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs font-medium text-muted-foreground">
                                    Applicable Phases ({template.phase_id.length}):
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {template.phase_id.map((phaseId, phaseIndex) => (
                                    <Badge
                                      key={`${phaseId}-${phaseIndex}`}
                                      variant="outline"
                                      className="text-xs bg-green-50 text-green-700 border-green-200"
                                    >
                                      {phaseId}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AddDefaultDocumentDialog
        open={isAddDialogOpen}
        onOpenChange={handleDialogClose}
        onDocumentCreated={() => {
          refetch();
        }}
        createTemplate={createTemplate}
        editTemplate={editTemplate}
        editingTemplate={editingTemplate}
      />

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogClose}
        onConfirm={handleConfirmDelete}
        title="Delete Document Template"
        message="Are you sure you want to delete this document template?"
        itemName={templateToDelete?.name}
        itemType="document template"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default SuperAdminDocuments;