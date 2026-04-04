import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit, Trash2, MoreHorizontal, Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import { CompanyDocumentTemplateService, type CompanyTemplate } from "@/services/companyDocumentTemplateService";
import { AITemplateImporterDialog } from "./AITemplateImporterDialog";
import { EditTemplateDialog } from "./EditTemplateDialog";

interface CompanyTemplatesListProps {
  companyId: string;
  companyName?: string;
}

export function CompanyTemplatesList({ companyId, companyName }: CompanyTemplatesListProps) {
  const [templates, setTemplates] = useState<CompanyTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CompanyTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<CompanyTemplate | null>(null);

  const loadTemplates = async () => {
    if (!companyId) return;
    
    setIsLoading(true);
    try {
      const fetchedTemplates = await CompanyDocumentTemplateService.getTemplates(companyId);
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [companyId]);

  const handleEdit = (template: CompanyTemplate) => {
    setSelectedTemplate(template);
    setShowEditDialog(true);
  };

  const handleDelete = (template: CompanyTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;
    
    try {
      const success = await CompanyDocumentTemplateService.deleteTemplate(templateToDelete.id);
      if (success) {
        await loadTemplates();
        setDeleteDialogOpen(false);
        setTemplateToDelete(null);
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleTemplateCreated = () => {
    loadTemplates();
  };

  const handleTemplateUpdated = () => {
    loadTemplates();
    setShowEditDialog(false);
    setSelectedTemplate(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'dhf': return 'bg-blue-100 text-blue-800';
      case 'dmr': return 'bg-green-100 text-green-800';
      case 'technical file': return 'bg-purple-100 text-purple-800';
      case 'standard': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Company Document Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading templates...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Company Document Templates
                {companyName && (
                  <Badge variant="outline" className="text-xs">
                    {companyName}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your company's document templates created through AI analysis
              </p>
            </div>
            <Button onClick={() => setShowAIDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-medium">No templates found</h3>
                <p className="text-muted-foreground">
                  Create your first template by uploading a document for AI analysis
                </p>
              </div>
              <Button onClick={() => setShowAIDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create First Template
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {templates.length} template{templates.length !== 1 ? 's' : ''} found
                </p>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead>Name</TableHead>
                     <TableHead>Document Type</TableHead>
                     <TableHead>Tech Applicability</TableHead>
                     <TableHead>Scope</TableHead>
                     <TableHead>Created</TableHead>
                     <TableHead>Updated</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{template.name}</div>
                          {template.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-xs">
                              {template.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={getDocumentTypeColor(template.document_type)}
                        >
                          {template.document_type}
                        </Badge>
                      </TableCell>
                       <TableCell>
                         <span className="text-sm text-muted-foreground">
                           {template.tech_applicability || 'All device types'}
                         </span>
                       </TableCell>
                       <TableCell>
                         <Badge 
                           variant={template.scope === 'company' ? 'default' : 'outline'}
                           className="text-xs"
                         >
                           {template.scope === 'company' ? 'Company-wide' : 
                            template.scope === 'product' ? 'Product-specific' : 'Company-wide'}
                         </Badge>
                       </TableCell>
                       <TableCell className="text-sm text-muted-foreground">
                         {formatDate(template.created_at)}
                       </TableCell>
                       <TableCell className="text-sm text-muted-foreground">
                         {formatDate(template.updated_at)}
                       </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(template)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(template)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Template Importer Dialog */}
      <AITemplateImporterDialog
        open={showAIDialog}
        onOpenChange={setShowAIDialog}
        companyId={companyId}
        onTemplateCreated={handleTemplateCreated}
      />

      {/* Edit Template Dialog */}
      {selectedTemplate && (
        <EditTemplateDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          template={selectedTemplate}
          onTemplateUpdated={handleTemplateUpdated}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}