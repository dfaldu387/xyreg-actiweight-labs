import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sparkles,
  Database,
  FileText,
  Tag,
  Settings,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DeviceContext } from '@/services/productDefinitionAIService';
import { useLanguage } from '@/context/LanguageContext';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'fi', label: 'Suomi' },
];

interface ContextSource {
  label: string;
  value: string | undefined;
  icon: React.ReactNode;
  isAvailable: boolean;
}

interface AIExplainerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
  fieldName: string;
  fieldDescription?: string;
  deviceContext?: DeviceContext;
}

export function AIExplainerDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  fieldName,
  fieldDescription,
  deviceContext
}: AIExplainerDialogProps) {
  const { language: appLanguage } = useLanguage();
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [outputLanguage, setOutputLanguage] = useState<string>(appLanguage);
  const [selectedSources, setSelectedSources] = useState<Set<number>>(new Set());
  const [initialized, setInitialized] = useState(false);

  // Build context sources from device context
  const contextSources: ContextSource[] = [
    {
      label: 'Product Name',
      value: deviceContext?.productName,
      icon: <Tag className="h-4 w-4" />,
      isAvailable: !!deviceContext?.productName?.trim() &&
        !['new device', 'untitled', 'my device', 'current medical device'].includes(
          deviceContext.productName.toLowerCase().trim()
        )
    },
    {
      label: 'Device Category',
      value: deviceContext?.deviceCategory,
      icon: <Settings className="h-4 w-4" />,
      isAvailable: !!deviceContext?.deviceCategory?.trim() &&
        !['new device', 'device', 'product'].includes(
          deviceContext.deviceCategory.toLowerCase().trim()
        )
    },
    {
      label: 'Description',
      value: deviceContext?.deviceDescription,
      icon: <FileText className="h-4 w-4" />,
      isAvailable: !!deviceContext?.deviceDescription?.trim() &&
        deviceContext.deviceDescription.trim().length > 10
    },
    {
      label: 'EMDN Classification',
      value: deviceContext?.emdnDescription || deviceContext?.emdnCode,
      icon: <Database className="h-4 w-4" />,
      isAvailable: !!deviceContext?.emdnCode?.trim() || !!deviceContext?.emdnDescription?.trim()
    },
    {
      label: 'Regulatory Type',
      value: deviceContext?.primaryRegulatoryType,
      icon: <Settings className="h-4 w-4" />,
      isAvailable: !!deviceContext?.primaryRegulatoryType?.trim()
    },
    {
      label: 'Key Features',
      value: Array.isArray(deviceContext?.keyFeatures) ? deviceContext.keyFeatures.join(', ') : undefined,
      icon: <Tag className="h-4 w-4" />,
      isAvailable: Array.isArray(deviceContext?.keyFeatures) && deviceContext.keyFeatures.length > 0
    }
  ];

  const availableSources = contextSources.filter(s => s.isAvailable);
  const unavailableSources = contextSources.filter(s => !s.isAvailable);

  // Auto-select all available sources on first render
  React.useEffect(() => {
    if (!initialized && availableSources.length > 0) {
      setSelectedSources(new Set(availableSources.map((_, i) => i)));
      setInitialized(true);
    }
  }, [availableSources.length, initialized]);

  const toggleSource = (index: number) => {
    const next = new Set(selectedSources);
    next.has(index) ? next.delete(index) : next.add(index);
    setSelectedSources(next);
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            AI-Assisted Generation
          </DialogTitle>
          <DialogDescription>
            Generate a suggestion for <strong>{fieldName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[80vh] overflow-y-auto">
          {/* How it works section */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              How it works
            </h4>
            <p className="text-sm text-muted-foreground">
              The AI will analyze your device information and generate a regulatory-compliant
              suggestion for {fieldName}. The more context you provide, the better the suggestion.
            </p>
            {fieldDescription && (
              <p className="text-xs text-muted-foreground italic">
                {fieldDescription}
              </p>
            )}
          </div>

          {/* Context sources section with checkboxes */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Select context sources:</h4>

            {availableSources.length > 0 ? (
              <div className="divide-y divide-border rounded-md border bg-muted/20">
                {availableSources.map((source, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 px-3 py-2"
                  >
                    <Checkbox
                      checked={selectedSources.has(index)}
                      onCheckedChange={() => toggleSource(index)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {source.icon}
                        <span className="text-sm font-medium">
                          {source.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {source.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm text-amber-800 dark:text-amber-300">
                    Limited context available. Results may be generic.
                  </span>
                </div>
              </div>
            )}

            {/* Show what's missing for better results */}
            {unavailableSources.length > 0 && availableSources.length > 0 && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">
                  For better results, consider adding:
                </p>
                <div className="flex flex-wrap gap-1">
                  {unavailableSources.slice(0, 3).map((source, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {source.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Language selector */}
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              Output language
            </Label>
            <Select value={outputLanguage} onValueChange={setOutputLanguage}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional instructions */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Additional instructions (optional)</Label>
            <Textarea
              placeholder="Add specific instructions for the AI generation..."
              className="min-h-[60px] text-sm resize-y"
              value={additionalPrompt}
              onChange={(e) => setAdditionalPrompt(e.target.value)}
            />
          </div>

          {/* Disclaimer */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
            <strong>Note:</strong> AI-generated content should be reviewed and validated
            by qualified personnel before use in regulatory submissions.
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || selectedSources.size === 0}
            className="bg-amber-500 hover:bg-amber-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Suggestion
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
