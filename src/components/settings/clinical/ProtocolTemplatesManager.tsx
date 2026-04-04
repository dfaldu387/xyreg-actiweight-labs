import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';
import { useProtocolTemplates, ProtocolTemplate } from '@/hooks/useProtocolTemplates';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ProtocolTemplateDialog } from './ProtocolTemplateDialog';
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

interface ProtocolTemplatesManagerProps {
  companyId: string;
}

export function ProtocolTemplatesManager({ companyId }: ProtocolTemplatesManagerProps) {
  const { lang } = useTranslation();
  const { templates, isLoading, deleteTemplate, toggleActive } = useProtocolTemplates(companyId);
  const [dialogOpen, setDialogOpen] = useState(false);

  const studyTypeLabels: Record<string, string> = {
    feasibility: lang('companyClinical.studyTypes.feasibility'),
    pivotal: lang('companyClinical.studyTypes.pivotal'),
    pmcf: lang('companyClinical.studyTypes.pmcf'),
    registry: lang('companyClinical.studyTypes.registry'),
    other: lang('companyClinical.studyTypes.other')
  };
  const [editingTemplate, setEditingTemplate] = useState<ProtocolTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<ProtocolTemplate | null>(null);

  const handleEdit = (template: ProtocolTemplate) => {
    setEditingTemplate(template);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingTemplate(null);
    setDialogOpen(true);
  };

  const handleDelete = (template: ProtocolTemplate) => {
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">
          {lang('companyClinical.protocolTemplates.noTemplates')}
        </p>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {lang('companyClinical.protocolTemplates.uploadTemplate')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {lang('companyClinical.protocolTemplates.uploadTemplate')}
        </Button>
      </div>
      <div className="rounded-md border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">{lang('companyClinical.protocolTemplates.headers.templateName')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{lang('companyClinical.protocolTemplates.headers.studyType')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{lang('companyClinical.protocolTemplates.headers.version')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{lang('companyClinical.protocolTemplates.headers.requiredSections')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{lang('companyClinical.protocolTemplates.headers.active')}</th>
              <th className="px-4 py-3 text-right text-sm font-medium">{lang('companyClinical.protocolTemplates.headers.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {templates.map((template) => (
              <tr key={template.id} className="hover:bg-muted/50">
                <td className="px-4 py-3">
                  <span className="font-medium">{template.template_name}</span>
                </td>
                <td className="px-4 py-3">
                  {template.study_type ? (
                    <Badge variant="outline">
                      {studyTypeLabels[template.study_type]}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">{lang('companyClinical.protocolTemplates.allTypes')}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  v{template.version}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="secondary">
                    {lang('companyClinical.protocolTemplates.sections').replace('{{count}}', String(template.required_sections.length))}
                  </Badge>
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

      <ProtocolTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editingTemplate}
        companyId={companyId}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lang('companyClinical.protocolTemplates.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang('companyClinical.protocolTemplates.deleteDialog.description').replace('{{name}}', deletingTemplate?.template_name || '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{lang('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{lang('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
