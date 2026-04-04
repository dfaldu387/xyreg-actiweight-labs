
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useActivityTemplates } from '@/hooks/useActivityTemplates';
import { ActivityTemplate } from '@/types/activities';
import { ActivityTemplateDialog } from './ActivityTemplateDialog';
import { ActivityTemplatesTable } from './ActivityTemplatesTable';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { useConfirm } from '@/components/ui/confirm-dialog';

export function ActivityLibraryTab() {
  const companyId = useCompanyId();
  const { lang } = useTranslation();
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate } = useActivityTemplates(companyId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ActivityTemplate | undefined>();

  const handleCreateTemplate = async (templateData: Omit<ActivityTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    await createTemplate(templateData);
  };

  const handleUpdateTemplate = async (id: string, updates: Partial<ActivityTemplate>) => {
    await updateTemplate(id, updates);
  };

  const handleEdit = (template: ActivityTemplate) => {
    setEditingTemplate(template);
    setIsDialogOpen(true);
  };

  const confirmAction = useConfirm();

  const handleDelete = async (id: string) => {
    if (await confirmAction({ title: lang('companySettings.activityTemplates.confirmDelete'), description: 'This action cannot be undone.', confirmLabel: 'Delete', variant: 'destructive' })) {
      await deleteTemplate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTemplate(undefined);
  };

  if (!companyId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {lang('companySettings.activityTemplates.noCompanyContext')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{lang('companySettings.activityTemplates.activityLibrary')}</h2>
          <p className="text-muted-foreground">
            {lang('companySettings.activityTemplates.activityLibraryDesc')}
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {lang('companySettings.activityTemplates.newTemplate')}
        </Button>
      </div>

      <ActivityTemplatesTable
        templates={templates}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ActivityTemplateDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        template={editingTemplate}
        companyId={companyId}
        onSave={handleCreateTemplate}
        onUpdate={handleUpdateTemplate}
      />
    </div>
  );
}
