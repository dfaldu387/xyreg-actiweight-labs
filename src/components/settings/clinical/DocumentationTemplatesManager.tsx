import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';
import { useDocumentationTemplates, DocumentationTemplate, TemplateType } from '@/hooks/useDocumentationTemplates';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DocumentationTemplateDialog } from './DocumentationTemplateDialog';
import { useTranslation } from '@/hooks/useTranslation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';

interface DocumentationTemplatesManagerProps {
  companyId: string;
}

export function DocumentationTemplatesManager({ companyId }: DocumentationTemplatesManagerProps) {
  const { lang } = useTranslation();
  const { templates, isLoading, deleteTemplate, toggleActive, getTemplatesByType } = useDocumentationTemplates(companyId);
  const [dialogOpen, setDialogOpen] = useState(false);

  const templateTypes: Array<{ value: TemplateType; label: string }> = [
    { value: 'CEP', label: lang('companyClinical.docTemplates.types.cep') },
    { value: 'CER', label: lang('companyClinical.docTemplates.types.cer') },
    { value: 'consent_form', label: lang('companyClinical.docTemplates.types.consentForm') },
    { value: 'study_report', label: lang('companyClinical.docTemplates.types.studyReport') },
    { value: 'ethics_submission', label: lang('companyClinical.docTemplates.types.ethicsSubmission') },
  ];
  const [editingTemplate, setEditingTemplate] = useState<DocumentationTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<DocumentationTemplate | null>(null);
  const [selectedType, setSelectedType] = useState<TemplateType>('CEP');

  const handleEdit = (template: DocumentationTemplate) => {
    setEditingTemplate(template);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingTemplate({ template_type: selectedType } as DocumentationTemplate);
    setDialogOpen(true);
  };

  const handleDelete = (template: DocumentationTemplate) => {
    setDeletingTemplate(template);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingTemplate) {
      await deleteTemplate(deletingTemplate.id);
      setDeleteDialogOpen(false);
      setDeletingTemplate(null);
    }
  };

  const TemplateTable = ({ type }: { type: TemplateType }) => {
    const typeTemplates = getTemplatesByType(type);

    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (typeTemplates.length === 0) {
      return (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            {lang('companyClinical.docTemplates.noTemplates').replace('{{type}}', templateTypes.find(t => t.value === type)?.label || '')}
          </p>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            {lang('companyClinical.docTemplates.uploadTemplate')}
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            {lang('companyClinical.docTemplates.uploadTemplate')}
          </Button>
        </div>
        <div className="rounded-md border">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">{lang('companyClinical.docTemplates.headers.templateName')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{lang('companyClinical.docTemplates.headers.region')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{lang('companyClinical.docTemplates.headers.studyType')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{lang('companyClinical.docTemplates.headers.description')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{lang('companyClinical.docTemplates.headers.active')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium">{lang('companyClinical.docTemplates.headers.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {typeTemplates.map((template) => (
                <tr key={template.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <span className="font-medium">{template.template_name}</span>
                  </td>
                  <td className="px-4 py-3">
                    {template.region ? (
                      <Badge variant="outline">{template.region}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">{lang('companyClinical.docTemplates.global')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {template.study_type ? (
                      <Badge variant="secondary">{template.study_type}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">{lang('companyClinical.docTemplates.all')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                    {template.description || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={template.is_active}
                      onCheckedChange={(checked) => toggleActive(template.id, checked)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(template)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <>
      <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as TemplateType)}>
        <TabsList className="grid w-full grid-cols-5">
          {templateTypes.map((type) => (
            <TabsTrigger key={type.value} value={type.value} className="text-xs">
              {type.value}
            </TabsTrigger>
          ))}
        </TabsList>
        {templateTypes.map((type) => (
          <TabsContent key={type.value} value={type.value} className="mt-6">
            <TemplateTable type={type.value} />
          </TabsContent>
        ))}
      </Tabs>

      <DocumentationTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editingTemplate}
        companyId={companyId}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lang('companyClinical.docTemplates.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang('companyClinical.docTemplates.deleteDialog.description').replace('{{name}}', deletingTemplate?.template_name || '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{lang('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{lang('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
