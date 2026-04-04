import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Database, FileText, Settings, Tag, AlertCircle, Globe } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage, type Language } from '@/context/LanguageContext';

interface ContextSource {
  key: string;
  label: string;
  value: string | undefined;
  icon: React.ReactNode;
  isAvailable: boolean;
}

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'fi', label: 'Suomi' },
];

interface AIContextSourcesPanelProps {
  productId: string;
  /** Extra context labels to show as available (e.g. "Existing Hazards", "User Needs") */
  additionalSources?: string[];
  className?: string;
  /** 'display' = read-only (default), 'select' = checkboxes for toggling sources */
  mode?: 'display' | 'select';
  /** Called when selection changes in 'select' mode. Emits array of selected source keys. */
  onSelectionChange?: (selectedKeys: string[]) => void;
  /** Show additional instructions textarea. Defaults to true in select mode. */
  showPrompt?: boolean;
  /** Called when the additional instructions text changes */
  onPromptChange?: (prompt: string) => void;
  /** Show output language selector. Defaults to true in select mode. */
  showLanguage?: boolean;
  /** Called when output language changes */
  onLanguageChange?: (language: string) => void;
}

export function AIContextSourcesPanel({
  productId,
  additionalSources,
  className,
  mode = 'display',
  onSelectionChange,
  showPrompt,
  onPromptChange,
  showLanguage,
  onLanguageChange,
}: AIContextSourcesPanelProps) {
  const { language: appLanguage } = useLanguage();
  const effectiveShowPrompt = showPrompt ?? mode === 'select';
  const effectiveShowLanguage = showLanguage ?? mode === 'select';

  const [isOpen, setIsOpen] = React.useState(mode === 'select');
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set());
  const [initialized, setInitialized] = React.useState(false);
  const [outputLanguage, setOutputLanguage] = React.useState<string>(appLanguage);

  const { data: product } = useQuery({
    queryKey: ['ai-context-product', productId],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('name, class, description, intended_purpose_data, emdn_code, emdn_description')
        .eq('id', productId)
        .single();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const purposeData = (product?.intended_purpose_data || {}) as any;

  const contextSources: ContextSource[] = [
    {
      key: 'product-name',
      label: 'Product Name',
      value: product?.name,
      icon: <Tag className="h-4 w-4" />,
      isAvailable: !!product?.name?.trim() &&
        !['new device', 'untitled', 'my device'].includes(product.name.toLowerCase().trim()),
    },
    {
      key: 'device-class',
      label: 'Device Class',
      value: product?.class,
      icon: <Settings className="h-4 w-4" />,
      isAvailable: !!product?.class?.trim(),
    },
    {
      key: 'description',
      label: 'Description',
      value: product?.description,
      icon: <FileText className="h-4 w-4" />,
      isAvailable: !!product?.description?.trim() && product.description.trim().length > 10,
    },
    {
      key: 'intended-purpose',
      label: 'Intended Purpose',
      value: purposeData?.clinicalPurpose || purposeData?.indications,
      icon: <FileText className="h-4 w-4" />,
      isAvailable: !!(purposeData?.clinicalPurpose?.trim() || purposeData?.indications?.trim()),
    },
    {
      key: 'emdn',
      label: 'EMDN Classification',
      value: product?.emdn_description || product?.emdn_code,
      icon: <Database className="h-4 w-4" />,
      isAvailable: !!product?.emdn_code?.trim() || !!product?.emdn_description?.trim(),
    },
    {
      key: 'target-population',
      label: 'Target Population',
      value: Array.isArray(purposeData?.targetPopulation)
        ? purposeData.targetPopulation.join(', ')
        : purposeData?.targetPopulation,
      icon: <Tag className="h-4 w-4" />,
      isAvailable: !!(Array.isArray(purposeData?.targetPopulation)
        ? purposeData.targetPopulation.length > 0
        : purposeData?.targetPopulation?.trim()),
    },
  ];

  // Add extra sources passed by the parent dialog
  if (additionalSources) {
    for (const label of additionalSources) {
      const key = label.replace(/\s*\(.*\)/, '').toLowerCase().replace(/\s+/g, '-');
      contextSources.push({
        key,
        label,
        value: 'Available',
        icon: <CheckCircle className="h-4 w-4" />,
        isAvailable: true,
      });
    }
  }

  const available = contextSources.filter(s => s.isAvailable);
  const missing = contextSources.filter(s => !s.isAvailable);

  // Auto-select all available sources on first render in select mode
  React.useEffect(() => {
    if (mode === 'select' && !initialized && available.length > 0) {
      const allKeys = new Set(available.map(s => s.key));
      setSelectedKeys(allKeys);
      onSelectionChange?.(Array.from(allKeys));
      setInitialized(true);
    }
  }, [mode, available.length, initialized]);

  // Emit initial language
  React.useEffect(() => {
    if (effectiveShowLanguage) {
      onLanguageChange?.(outputLanguage);
    }
  }, []);

  const toggleSource = (key: string) => {
    const newKeys = new Set(selectedKeys);
    if (newKeys.has(key)) {
      newKeys.delete(key);
    } else {
      newKeys.add(key);
    }
    setSelectedKeys(newKeys);
    onSelectionChange?.(Array.from(newKeys));
  };

  const handleLanguageChange = (lang: string) => {
    setOutputLanguage(lang);
    onLanguageChange?.(lang);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="rounded-lg border bg-muted/30 p-3">
        <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            {mode === 'select' ? 'Select context sources' : 'Context being used'}
            <Badge variant="secondary" className="text-xs">
              {mode === 'select' ? `${selectedKeys.size}/${available.length} selected` : `${available.length} source${available.length !== 1 ? 's' : ''}`}
            </Badge>
          </span>
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-2">
          {available.length > 0 ? (
            <div className="divide-y divide-border rounded-md border bg-muted/20">
              {available.map((source) => (
                <div key={source.key} className="flex items-center gap-2 px-2.5 py-1.5 text-xs">
                  {mode === 'select' ? (
                    <Checkbox
                      checked={selectedKeys.has(source.key)}
                      onCheckedChange={() => toggleSource(source.key)}
                      className="h-3.5 w-3.5"
                    />
                  ) : (
                    <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400 shrink-0" />
                  )}
                  <span className="font-medium whitespace-nowrap">{source.label}</span>
                  {source.value && source.value !== 'Available' && (
                    <span className="text-muted-foreground truncate max-w-[300px]">{source.value}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs text-amber-800 dark:text-amber-300">Limited context available. Results may be generic.</span>
            </div>
          )}

          {missing.length > 0 && available.length > 0 && (
            <div className="pt-1.5">
              <p className="text-xs text-muted-foreground mb-1">For better results, consider adding:</p>
              <div className="flex flex-wrap gap-1">
                {missing.slice(0, 4).map((source) => (
                  <Badge key={source.key} variant="outline" className="text-xs">{source.label}</Badge>
                ))}
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {effectiveShowLanguage && (
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            Output language
          </Label>
          <Select value={outputLanguage} onValueChange={handleLanguageChange}>
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
      )}

      {effectiveShowPrompt && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Additional instructions (optional)</Label>
          <Textarea
            placeholder="Add specific instructions for the AI generation..."
            className="min-h-[60px] text-sm resize-y"
            onChange={(e) => onPromptChange?.(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
