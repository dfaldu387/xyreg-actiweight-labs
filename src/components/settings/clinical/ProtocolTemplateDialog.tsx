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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { X, HelpCircle } from 'lucide-react';
import { useProtocolTemplates, ProtocolTemplate, StudyType } from '@/hooks/useProtocolTemplates';

interface ProtocolTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ProtocolTemplate | null;
  companyId: string;
}

const studyTypes: Array<{ value: StudyType | 'all'; label: string }> = [
  { value: 'all', label: 'All Study Types' },
  { value: 'feasibility', label: 'Feasibility' },
  { value: 'pivotal', label: 'Pivotal' },
  { value: 'pmcf', label: 'PMCF' },
  { value: 'registry', label: 'Registry' },
  { value: 'other', label: 'Other' },
];

const commonSections = [
  'Title Page',
  'Protocol Synopsis',
  'Background & Rationale',
  'Study Objectives',
  'Study Design',
  'Study Population',
  'Inclusion/Exclusion Criteria',
  'Study Procedures',
  'Safety Assessments',
  'Statistical Analysis',
  'Data Management',
  'Ethics & Regulatory'
];

export function ProtocolTemplateDialog({ open, onOpenChange, template, companyId }: ProtocolTemplateDialogProps) {
  const { createTemplate, updateTemplate } = useProtocolTemplates(companyId);
  const [formData, setFormData] = useState({
    template_name: '',
    study_type: 'all' as StudyType | 'all',
    version: '1.0',
    required_sections: [] as string[],
    file_path: '',
  });
  const [newSection, setNewSection] = useState('');

  useEffect(() => {
    if (template) {
      setFormData({
        template_name: template.template_name || '',
        study_type: template.study_type || 'all',
        version: template.version || '1.0',
        required_sections: template.required_sections || [],
        file_path: template.file_path || '',
      });
    } else {
      setFormData({
        template_name: '',
        study_type: 'all',
        version: '1.0',
        required_sections: [],
        file_path: '',
      });
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const templateData = {
        ...formData,
        study_type: formData.study_type === 'all' ? null : formData.study_type,
        approval_workflow: {},
        is_active: true,
      };

      if (template) {
        await updateTemplate(template.id, templateData);
      } else {
        await createTemplate(templateData);
      }
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving protocol template:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      template_name: '',
      study_type: 'all',
      version: '1.0',
      required_sections: [],
      file_path: '',
    });
    setNewSection('');
  };

  const addSection = (section: string) => {
    if (section.trim() && !formData.required_sections.includes(section.trim())) {
      setFormData(prev => ({
        ...prev,
        required_sections: [...prev.required_sections, section.trim()]
      }));
      setNewSection('');
    }
  };

  const removeSection = (index: number) => {
    setFormData(prev => ({
      ...prev,
      required_sections: prev.required_sections.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit' : 'Upload'} Protocol Template</DialogTitle>
          <DialogDescription>
            Upload a protocol template and specify required sections for clinical trials.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="template_name">Template Name *</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Descriptive name for this protocol template</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="template_name"
              value={formData.template_name}
              onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
              placeholder="e.g., Standard Clinical Trial Protocol"
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
                      <p>Select which type of clinical study this template applies to, or 'All Study Types' for universal templates</p>
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
                <Label htmlFor="version">Version</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Version number of this template (e.g., 1.0, 2.1)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="version"
                value={formData.version}
                onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                placeholder="1.0"
              />
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
                    <p>Enter the cloud storage URL or file path where the protocol template document is stored</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="file_path"
              value={formData.file_path}
              onChange={(e) => setFormData(prev => ({ ...prev, file_path: e.target.value }))}
              placeholder="https://storage.example.com/templates/protocol.docx"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the URL or storage path where the template file is stored
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Label>Required Sections</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Define the mandatory sections that must be included when using this protocol template</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 mb-3">
                {commonSections.map((section) => (
                  <Button
                    key={section}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addSection(section)}
                    disabled={formData.required_sections.includes(section)}
                  >
                    {section}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  placeholder="Add custom section"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSection(newSection))}
                />
                <Button type="button" onClick={() => addSection(newSection)}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.required_sections.map((section, index) => (
                  <Badge key={index} variant="secondary">
                    {section}
                    <button
                      type="button"
                      onClick={() => removeSection(index)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {template ? 'Update' : 'Upload'} Template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}