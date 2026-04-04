import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { useDocumentationTemplates, DocumentationTemplate, TemplateType, StudyType } from '@/hooks/useDocumentationTemplates';

interface DocumentationTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: DocumentationTemplate | null;
  companyId: string;
}

const templateTypes: Array<{ value: TemplateType; label: string }> = [
  { value: 'CEP', label: 'Clinical Evaluation Plan (CEP)' },
  { value: 'CER', label: 'Clinical Evaluation Report (CER)' },
  { value: 'consent_form', label: 'Informed Consent Form' },
  { value: 'study_report', label: 'Study Report' },
  { value: 'ethics_submission', label: 'Ethics Submission' },
];

const studyTypes: Array<{ value: StudyType | 'all'; label: string }> = [
  { value: 'all', label: 'All Study Types' },
  { value: 'feasibility', label: 'Feasibility' },
  { value: 'pivotal', label: 'Pivotal' },
  { value: 'pmcf', label: 'PMCF' },
  { value: 'registry', label: 'Registry' },
  { value: 'other', label: 'Other' },
];

const regions = [
  { value: 'global', label: 'Global' },
  { value: 'EU', label: 'European Union (EU)' },
  { value: 'US', label: 'United States (US)' },
  { value: 'UK', label: 'United Kingdom (UK)' },
  { value: 'CA', label: 'Canada (CA)' },
  { value: 'AU', label: 'Australia (AU)' },
  { value: 'JP', label: 'Japan (JP)' },
];

export function DocumentationTemplateDialog({ open, onOpenChange, template, companyId }: DocumentationTemplateDialogProps) {
  const { createTemplate, updateTemplate } = useDocumentationTemplates(companyId);
  const [formData, setFormData] = useState({
    template_type: 'CEP' as TemplateType,
    template_name: '',
    study_type: 'all' as StudyType | 'all',
    region: 'global',
    file_path: '',
    description: '',
  });

  useEffect(() => {
    if (template) {
      setFormData({
        template_type: template.template_type || 'CEP',
        template_name: template.template_name || '',
        study_type: template.study_type || 'all',
        region: template.region || 'global',
        file_path: template.file_path || '',
        description: template.description || '',
      });
    } else if (template && template.template_type) {
      // New template with pre-set type
      setFormData({
        template_type: template.template_type,
        template_name: '',
        study_type: 'all',
        region: 'global',
        file_path: '',
        description: '',
      });
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const templateData = {
        ...formData,
        study_type: formData.study_type === 'all' ? null : formData.study_type,
        region: formData.region === 'global' ? null : formData.region,
        is_active: true,
      };

      if (template?.id) {
        await updateTemplate(template.id, templateData);
      } else {
        await createTemplate(templateData);
      }
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving documentation template:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      template_type: 'CEP',
      template_name: '',
      study_type: 'all',
      region: 'global',
      file_path: '',
      description: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template?.id ? 'Edit' : 'Upload'} Documentation Template</DialogTitle>
          <DialogDescription>
            Upload a documentation template for clinical trials.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="template_type">Template Type *</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Select the type of clinical documentation (CEP, CER, Consent Form, etc.)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={formData.template_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, template_type: value as TemplateType }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templateTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="template_name">Template Name *</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Descriptive name for this documentation template</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="template_name"
              value={formData.template_name}
              onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
              placeholder="e.g., Standard CEP Template - EU MDR"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="study_type">Study Type</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Select which clinical study type this template is designed for</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={formData.study_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, study_type: value as StudyType | 'all' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {studyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="region">Region</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Select the regulatory region this template complies with (or Global for universal use)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={formData.region}
                onValueChange={(value) => setFormData(prev => ({ ...prev, region: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.value} value={region.value}>
                      {region.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="file_path">File Path/URL *</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Enter the cloud storage URL or file path where the template document is stored</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="file_path"
              value={formData.file_path}
              onChange={(e) => setFormData(prev => ({ ...prev, file_path: e.target.value }))}
              placeholder="https://storage.example.com/templates/cep-template.docx"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the URL or storage path where the template file is stored
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="description">Description</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Explain when and how to use this template, including any specific regulatory requirements</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe when and how to use this template"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {template?.id ? 'Update' : 'Upload'} Template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}