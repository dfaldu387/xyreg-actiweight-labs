import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Database, FileText, Settings, Tag, AlertCircle, Globe, Shield, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useLanguage, type Language } from '@/context/LanguageContext';

interface ContextSource {
  key: string;
  label: string;
  value: string | undefined;
  icon: React.ReactNode;
  isAvailable: boolean;
}

interface ContextSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  sources: ContextSource[];
  defaultOpen?: boolean;
}

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'fi', label: 'Suomi' },
];

/** Standards that should always be pre-checked */
const ALWAYS_PRECHECK = ['ISO 13485', 'ISO 14971', 'IEC 62366'];
/** Standards pre-checked for active/electrical devices */
const ACTIVE_DEVICE_STANDARDS = ['IEC 60601'];
/** Standards pre-checked for software devices */
const SOFTWARE_STANDARDS = ['IEC 62304'];
/** Standards pre-checked for non-software-only devices */
const NON_SOFTWARE_STANDARDS = ['ISO 10993'];

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
  /** Company ID – if not provided, derived from the product */
  companyId?: string;
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
  companyId: companyIdProp,
}: AIContextSourcesPanelProps) {
  const { language: appLanguage } = useLanguage();
  const effectiveShowPrompt = showPrompt ?? mode === 'select';
  const effectiveShowLanguage = showLanguage ?? mode === 'select';

  const [isOpen, setIsOpen] = React.useState(mode === 'select');
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set());
  const [initialized, setInitialized] = React.useState(false);
  const [outputLanguage, setOutputLanguage] = React.useState<string>(appLanguage);
  const [sectionOpen, setSectionOpen] = React.useState<Record<string, boolean>>({
    device: true,
    standards: mode === 'select',
    documents: mode === 'select',
    additional: true,
  });

  // ── Product query ──
  const { data: product } = useQuery({
    queryKey: ['ai-context-product', productId],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('name, class, description, intended_purpose_data, emdn_code, emdn_description, company_id, key_technology_characteristics, isActiveDevice, is_software_project')
        .eq('id', productId)
        .single();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const companyId = companyIdProp || (product as any)?.company_id;
  const purposeData = (product?.intended_purpose_data || {}) as any;
  const ktc = (product as any)?.key_technology_characteristics as Record<string, any> | null;
  const isActive = (product as any)?.isActiveDevice || ktc?.isActive;
  const isSoftware = (product as any)?.is_software_project || ktc?.isSoftwareAsaMedicalDevice || ktc?.isSoftwareMobileApp;
  const isPureSoftware = isSoftware && !isActive;

  // ── Standards query ──
  const { data: standards = [] } = useQuery({
    queryKey: ['ai-context-standards', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_gap_templates')
        .select('template_id, gap_analysis_templates!inner(id, framework, name, scope)')
        .eq('company_id', companyId!)
        .eq('is_enabled', true);
      if (error) throw error;

      // Also fetch always-on templates
      const { data: alwaysData } = await supabase
        .from('gap_analysis_templates')
        .select('id, framework, name, scope')
        .eq('auto_enable_condition', 'always')
        .eq('is_active', true);

      const seen = new Set<string>();
      const results: { id: string; framework: string; name: string }[] = [];
      const addFw = (fw: string, name: string, id: string) => {
        if (!seen.has(fw)) {
          seen.add(fw);
          results.push({ id, framework: fw, name });
        }
      };
      (data || []).forEach((t: any) => {
        const tpl = t.gap_analysis_templates;
        if (tpl?.framework) addFw(tpl.framework, tpl.name || tpl.framework, tpl.id);
      });
      (alwaysData || []).forEach((t: any) => {
        if (t.framework) addFw(t.framework, t.name || t.framework, t.id);
      });
      return results;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  // ── Documents query ──
  const { data: documents = [] } = useQuery({
    queryKey: ['ai-context-documents', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('id, name, status, document_type')
        .eq('product_id', productId)
        .in('status', ['approved', 'in_review', 'effective'])
        .order('name')
        .limit(15);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── Build sections ──
  const deviceSources: ContextSource[] = [
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

  const shouldPrecheckStandard = (framework: string): boolean => {
    const normalized = framework.replace(/_/g, ' ');
    if (ALWAYS_PRECHECK.some(s => normalized.includes(s))) return true;
    if (isActive && ACTIVE_DEVICE_STANDARDS.some(s => normalized.includes(s))) return true;
    if (isSoftware && SOFTWARE_STANDARDS.some(s => normalized.includes(s))) return true;
    if (!isPureSoftware && NON_SOFTWARE_STANDARDS.some(s => normalized.includes(s))) return true;
    return false;
  };

  const standardSources: ContextSource[] = standards.map(s => ({
    key: `std-${s.id}`,
    label: s.framework,
    value: s.name !== s.framework ? s.name : undefined,
    icon: <Shield className="h-4 w-4" />,
    isAvailable: true,
  }));

  const docSources: ContextSource[] = documents.map(d => ({
    key: `doc-${d.id}`,
    label: d.name,
    value: d.status === 'approved' ? 'Approved' : d.status === 'effective' ? 'Effective' : 'In Review',
    icon: <BookOpen className="h-4 w-4" />,
    isAvailable: true,
  }));

  // Additional sources from parent
  const additionalContextSources: ContextSource[] = [];
  if (additionalSources) {
    for (const label of additionalSources) {
      const key = label.replace(/\s*\(.*\)/, '').toLowerCase().replace(/\s+/g, '-');
      additionalContextSources.push({
        key,
        label,
        value: 'Available',
        icon: <CheckCircle className="h-4 w-4" />,
        isAvailable: true,
      });
    }
  }

  const sections: ContextSection[] = [
    {
      id: 'device',
      label: 'Device Information',
      icon: <Settings className="h-3.5 w-3.5" />,
      sources: deviceSources,
      defaultOpen: true,
    },
    ...(standardSources.length > 0 ? [{
      id: 'standards',
      label: 'Standards & Regulations',
      icon: <Shield className="h-3.5 w-3.5" />,
      sources: standardSources,
      defaultOpen: mode === 'select',
    }] : []),
    ...(docSources.length > 0 ? [{
      id: 'documents',
      label: 'Internal Documents',
      icon: <BookOpen className="h-3.5 w-3.5" />,
      sources: docSources,
      defaultOpen: mode === 'select',
    }] : []),
    ...(additionalContextSources.length > 0 ? [{
      id: 'additional',
      label: 'Additional Context',
      icon: <CheckCircle className="h-3.5 w-3.5" />,
      sources: additionalContextSources,
      defaultOpen: true,
    }] : []),
  ];

  const allSources = sections.flatMap(s => s.sources);
  const available = allSources.filter(s => s.isAvailable);
  const missingDevice = deviceSources.filter(s => !s.isAvailable);

  // Auto-select sources on first render
  React.useEffect(() => {
    if (mode === 'select' && !initialized && product) {
      const autoSelected = new Set<string>();
      // Device info: select available
      deviceSources.filter(s => s.isAvailable).forEach(s => autoSelected.add(s.key));
      // Standards: pre-check based on device characteristics
      standardSources.forEach(s => {
        if (shouldPrecheckStandard(s.label)) autoSelected.add(s.key);
      });
      // Documents: pre-check approved/effective
      documents.forEach(d => {
        if (d.status === 'approved' || d.status === 'effective') autoSelected.add(`doc-${d.id}`);
      });
      // Additional: all selected
      additionalContextSources.forEach(s => autoSelected.add(s.key));

      setSelectedKeys(autoSelected);
      onSelectionChange?.(Array.from(autoSelected));
      setInitialized(true);
    }
  }, [mode, product, standards.length, documents.length, initialized]);

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

  const toggleSection = (sectionId: string) => {
    setSectionOpen(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const handleLanguageChange = (lang: string) => {
    setOutputLanguage(lang);
    onLanguageChange?.(lang);
  };

  const renderSourceRow = (source: ContextSource) => (
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
  );

  const renderSection = (section: ContextSection) => {
    const sectionAvailable = section.sources.filter(s => s.isAvailable);
    if (sectionAvailable.length === 0 && section.id !== 'device') return null;
    const isExpanded = sectionOpen[section.id] ?? section.defaultOpen ?? false;
    const selectedInSection = sectionAvailable.filter(s => selectedKeys.has(s.key)).length;

    return (
      <div key={section.id} className="space-y-1">
        <button
          type="button"
          onClick={() => toggleSection(section.id)}
          className="flex w-full items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {section.icon}
          <span>{section.label}</span>
          {mode === 'select' && (
            <span className="font-normal normal-case ml-1">({selectedInSection}/{sectionAvailable.length})</span>
          )}
        </button>
        {isExpanded && (
          <div className="divide-y divide-border rounded-md border bg-muted/20">
            {sectionAvailable.map(renderSourceRow)}
            {section.id === 'device' && sectionAvailable.length === 0 && (
              <div className="flex items-center gap-2 px-2.5 py-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-xs text-amber-800 dark:text-amber-300">No device information available yet.</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
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

        <CollapsibleContent className="pt-3 space-y-3">
          {sections.map(renderSection)}

          {missingDevice.length > 0 && deviceSources.some(s => s.isAvailable) && (
            <div className="pt-1.5">
              <p className="text-xs text-muted-foreground mb-1">For better results, consider adding:</p>
              <div className="flex flex-wrap gap-1">
                {missingDevice.slice(0, 4).map((source) => (
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
