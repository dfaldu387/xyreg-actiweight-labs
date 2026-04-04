
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { ActivityTemplate, ACTIVITY_TYPES, ACTIVITY_TYPE_DESCRIPTIONS } from '@/types/activities';
import { DocumentFileUpload } from '@/components/common/DocumentFileUpload';
import { getDigitalTemplatesForActivityType, DigitalTemplateOption } from '@/services/digitalTemplateRegistry';
import { DigitalTemplatePreview } from '@/components/digital-templates/DigitalTemplatePreview';
import { useTranslation } from '@/hooks/useTranslation';

interface ActivityTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: ActivityTemplate;
  companyId: string;
  onSave: (template: Omit<ActivityTemplate, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdate?: (id: string, updates: Partial<ActivityTemplate>) => Promise<void>;
}

export function ActivityTemplateDialog({
  open,
  onOpenChange,
  template,
  companyId,
  onSave,
  onUpdate
}: ActivityTemplateDialogProps) {
  const { lang } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    type: 'training_sessions' as ActivityTemplate['type'],
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPath, setDocumentPath] = useState<string | undefined>();
  const [selectedDigitalTemplate, setSelectedDigitalTemplate] = useState<DigitalTemplateOption | null>(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        type: template.type,
        description: template.description || ''
      });
    } else {
      setFormData({
        name: '',
        type: 'training_sessions',
        description: ''
      });
    }
    setDocumentFile(null);
    setDocumentPath(undefined);
    setSelectedDigitalTemplate(null);
    setShowTemplatePreview(false);
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const templateData = {
        ...formData,
        company_id: companyId
      };

      // Include file data if available
      if (documentFile || documentPath) {
        (templateData as any).document_file = documentFile;
        (templateData as any).document_path = documentPath;
      }

      if (template && onUpdate) {
        await onUpdate(template.id, templateData);
      } else {
        await onSave(templateData);
      }
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (file: File | null, filePath?: string) => {
    setDocumentFile(file);
    setDocumentPath(filePath);
  };

  // Group activity types to show "Other" at the end
  const orderedActivityTypes = Object.entries(ACTIVITY_TYPES).sort(([keyA], [keyB]) => {
    if (keyA === 'other') return 1;
    if (keyB === 'other') return -1;
    return 0;
  });

  // Get available digital templates for current activity type
  const availableDigitalTemplates = getDigitalTemplatesForActivityType(formData.type);

  const handleDigitalTemplateChange = (templateId: string) => {
    if (templateId === 'none') {
      setSelectedDigitalTemplate(null);
      setShowTemplatePreview(false);
    } else {
      const template = availableDigitalTemplates.find(t => t.id === templateId);
      setSelectedDigitalTemplate(template || null);
      setShowTemplatePreview(!!template);
    }
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {template ? lang('companySettings.activityTemplates.editTemplate') : lang('companySettings.activityTemplates.createTemplate')}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{lang('companySettings.activityTemplates.templateName')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={lang('companySettings.activityTemplates.enterTemplateName')}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="type">{lang('companySettings.activityTemplates.activityType')} *</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p className="text-sm">
                      {ACTIVITY_TYPE_DESCRIPTIONS[formData.type]}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as ActivityTemplate['type'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {orderedActivityTypes.map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span>{label}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                            <p className="text-xs">
                              {ACTIVITY_TYPE_DESCRIPTIONS[key as keyof typeof ACTIVITY_TYPE_DESCRIPTIONS]}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {availableDigitalTemplates.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="digitalTemplate">{lang('companySettings.activityTemplates.digitalTemplateOptional')}</Label>
                <Select
                  value={selectedDigitalTemplate?.id || 'none'}
                  onValueChange={handleDigitalTemplateChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={lang('companySettings.activityTemplates.chooseDigitalTemplate')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{lang('companySettings.activityTemplates.noDigitalTemplate')}</SelectItem>
                    {availableDigitalTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex flex-col">
                          <span>{template.name}</span>
                          <span className="text-xs text-muted-foreground">{template.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {showTemplatePreview && selectedDigitalTemplate && (
              <DigitalTemplatePreview
                templateData={selectedDigitalTemplate.preview()}
                templateName={selectedDigitalTemplate.name}
              />
            )}

            <div className="space-y-2">
              <Label htmlFor="description">{lang('companySettings.activityTemplates.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={lang('companySettings.activityTemplates.enterDescription')}
                rows={3}
              />
            </div>

            <DocumentFileUpload
              onFileChange={handleFileChange}
              disabled={isSubmitting}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {lang('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
                {isSubmitting ? lang('companySettings.activityTemplates.saving') : template ? lang('companySettings.activityTemplates.updateTemplate') : lang('companySettings.activityTemplates.createTemplate')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
