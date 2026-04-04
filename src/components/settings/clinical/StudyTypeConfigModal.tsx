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
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { useStudyTypeConfigs, StudyTypeConfig } from '@/hooks/useStudyTypeConfigs';

interface StudyTypeConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: StudyTypeConfig | null;
}

const studyTypeLabels: Record<string, string> = {
  feasibility: 'Feasibility Study',
  pivotal: 'Pivotal Study',
  pmcf: 'PMCF Study',
  registry: 'Registry Study',
  other: 'Other Study'
};

const commonDocuments = [
  'Protocol',
  'Informed Consent Form',
  'Ethics Approval',
  'Statistical Analysis Plan',
  'Data Collection Forms',
  'CER (Clinical Evaluation Report)',
  'CEP (Clinical Evaluation Plan)',
  'Investigator Brochure',
  'PMCF Plan',
  'Registry Protocol'
];

export function StudyTypeConfigModal({ open, onOpenChange, config }: StudyTypeConfigModalProps) {
  const { updateConfig } = useStudyTypeConfigs(config?.company_id || '');
  const [formData, setFormData] = useState({
    default_min_enrollment: 0,
    default_max_enrollment: 0,
    typical_timeline_months: 0,
    required_documents: [] as string[],
  });
  const [initialFormData, setInitialFormData] = useState(formData);

  useEffect(() => {
    if (config) {
      const data = {
        default_min_enrollment: config.default_min_enrollment || 0,
        default_max_enrollment: config.default_max_enrollment || 0,
        typical_timeline_months: config.typical_timeline_months || 0,
        required_documents: config.required_documents || [],
      };
      setFormData(data);
      setInitialFormData(data);
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (config) {
      await updateConfig(config.id, formData);
      onOpenChange(false);
    }
  };

  const toggleDocument = (doc: string) => {
    setFormData(prev => ({
      ...prev,
      required_documents: prev.required_documents.includes(doc)
        ? prev.required_documents.filter(d => d !== doc)
        : [...prev.required_documents, doc]
    }));
  };

  if (!config) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure {studyTypeLabels[config.study_type]}</DialogTitle>
          <DialogDescription>
            Set default enrollment targets, timelines, and required documentation for this study type.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium">Enrollment Targets</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="min_enrollment">Minimum Enrollment</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>The minimum number of participants typically required for this type of study</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="min_enrollment"
                  type="number"
                  value={formData.default_min_enrollment}
                  onChange={(e) => setFormData(prev => ({ ...prev, default_min_enrollment: parseInt(e.target.value) || 0 }))}
                  placeholder="e.g., 10"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="max_enrollment">Maximum Enrollment</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>The maximum number of participants typically enrolled in this type of study</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="max_enrollment"
                  type="number"
                  value={formData.default_max_enrollment}
                  onChange={(e) => setFormData(prev => ({ ...prev, default_max_enrollment: parseInt(e.target.value) || 0 }))}
                  placeholder="e.g., 50"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="timeline">Typical Timeline (months)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Average duration from study start to completion for this study type</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="timeline"
              type="number"
              value={formData.typical_timeline_months}
              onChange={(e) => setFormData(prev => ({ ...prev, typical_timeline_months: parseInt(e.target.value) || 0 }))}
              placeholder="e.g., 12"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">Required Documentation</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Select all mandatory documents needed for this type of clinical trial</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {commonDocuments.map((doc) => (
                <div key={doc} className="flex items-center space-x-2">
                  <Checkbox
                    id={doc}
                    checked={formData.required_documents.includes(doc)}
                    onCheckedChange={() => toggleDocument(doc)}
                  />
                  <Label htmlFor={doc} className="text-sm cursor-pointer">
                    {doc}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData(initialFormData);
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Save Configuration</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
