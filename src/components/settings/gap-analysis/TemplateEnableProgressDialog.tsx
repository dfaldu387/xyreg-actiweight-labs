import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, FileText, Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';

interface TemplateEnableProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: {
    name: string;
    framework: string;
    description?: string;
    requirementCount?: number;
    scope?: string;
  } | null;
  onConfirm: (onProgress?: (current: number, total: number, meta?: { devices: number; requirements: number }) => void) => Promise<void>;
}

export function TemplateEnableProgressDialog({
  open,
  onOpenChange,
  template,
  onConfirm
}: TemplateEnableProgressDialogProps) {
  const { lang } = useTranslation();
  const [isEnabling, setIsEnabling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [itemsInfo, setItemsInfo] = useState<{ current: number; total: number; devices?: number; requirements?: number } | null>(null);
  const [currentStep, setCurrentStep] = useState<'creating' | 'finalizing' | 'complete'>('creating');

  useEffect(() => {
    if (!open) {
      setIsEnabling(false);
      setProgress(0);
      setItemsInfo(null);
      setCurrentStep('creating');
    }
  }, [open]);

  const steps = [
    { id: 'creating', label: lang('companySettings.enableTemplateDialog.creatingInstances'), icon: Layers },
  ];

  const handleConfirm = async () => {
    setIsEnabling(true);
    setProgress(0);
    setCurrentStep('creating');

    try {
      // Real progress callback from the sync service
      const handleProgress = (current: number, total: number, meta?: { devices: number; requirements: number }) => {
        const pct = total > 0 ? Math.round((current / total) * 100) : 0;
        setProgress(pct);
        setItemsInfo({ current, total, devices: meta?.devices, requirements: meta?.requirements });
      };

      await onConfirm(handleProgress);

      // Sync done — show 100%
      setProgress(100);
      setCurrentStep('complete');
      await new Promise(resolve => setTimeout(resolve, 800));

      onOpenChange(false);
      toast.success('Template enabled and gap analysis items synchronized');
    } catch (error) {
      console.error('Error enabling template:', error);
      setIsEnabling(false);
      setProgress(0);
      setItemsInfo(null);
      setCurrentStep('creating');
    }
  };

  const handleCancel = () => {
    if (!isEnabling) {
      onOpenChange(false);
    }
  };

  const currentStepInfo = steps.find(s => s.id === currentStep);

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            {lang('companySettings.enableTemplateDialog.title')}
          </DialogTitle>
          <DialogDescription>
            {isEnabling
              ? lang('companySettings.enableTemplateDialog.settingUp', { name: template.name })
              : lang('companySettings.enableTemplateDialog.description', { name: template.name })
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="!p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{template.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {template.description || template.framework}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 ml-2 bg-primary/10 text-primary border-primary/50">
                  {template.framework}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-foreground/70">
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span>{lang('companySettings.enableTemplateDialog.requirements', { count: template.requirementCount || 0 })}</span>
                </div>
                {template.scope && (
                  <div className="flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    <span className="capitalize">{template.scope}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {isEnabling && (
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground">
                    {currentStep === 'complete'
                      ? 'Complete'
                      : currentStepInfo?.label}
                  </span>
                  <span className="text-xs font-semibold text-primary">
                    {progress}%
                    {/* {itemsInfo && currentStep === 'creating' && (
                      <span className="text-muted-foreground font-normal ml-1">
                        ({itemsInfo.current} of {itemsInfo.total})
                      </span>
                    )} */}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                {/* {itemsInfo && itemsInfo.devices && itemsInfo.requirements && currentStep === 'creating' && (
                  <p className="text-[10px] text-muted-foreground">
                    {itemsInfo.devices} device{itemsInfo.devices > 1 ? 's' : ''} × {itemsInfo.requirements} requirements = {itemsInfo.total} compliance instances
                  </p>
                )} */}
              </div>

              <div className="space-y-2">
                {steps.map((step) => {
                  const StepIcon = step.icon;
                  const isActive = step.id === currentStep || currentStep === 'finalizing';
                  const isComplete = currentStep === 'complete';

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-2 text-xs transition-all ${isComplete
                          ? 'text-green-600'
                          : isActive
                            ? 'text-primary font-medium'
                            : 'text-muted-foreground'
                        }`}
                    >
                      <div className={`rounded-full p-1 ${isComplete
                          ? 'bg-green-100'
                          : isActive
                            ? 'bg-primary/10'
                            : 'bg-muted'
                        }`}>
                        <StepIcon className="h-3 w-3" />
                      </div>
                      <span>{step.label}</span>
                      {isComplete && (
                        <CheckCircle2 className="h-3 w-3 text-green-600 ml-auto" />
                      )}
                      {isActive && !isComplete && (
                        <Loader2 className="h-3 w-3 animate-spin ml-auto" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!isEnabling && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                <strong>{lang('companySettings.enableTemplateDialog.whatHappens')}</strong>
              </p>
              <ul className="mt-2 space-y-1 text-xs text-blue-800">
                <li className="flex items-start gap-1">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{lang('companySettings.enableTemplateDialog.instancesCreated', { count: template.requirementCount || lang('companySettings.enableTemplateDialog.multiple') })}</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{lang('companySettings.enableTemplateDialog.availableAcrossProducts')}</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{lang('companySettings.enableTemplateDialog.configureAfter')}</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isEnabling}>
            {lang('common.cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={isEnabling}>
            {isEnabling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {lang('companySettings.enableTemplateDialog.enabling')}
              </>
            ) : (
              lang('companySettings.enableTemplateDialog.enableTemplate')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
