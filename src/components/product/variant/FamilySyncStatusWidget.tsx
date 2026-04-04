import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, ChevronDown, ChevronRight, Pencil, FileText, Link2 } from 'lucide-react';
import { useVariantInheritance, InheritableField } from '@/hooks/useVariantInheritance';
import { useVariantDocuments } from '@/hooks/useVariantDocuments';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Fields tracked by has_*_override boolean flags (useVariantInheritance)
const OVERRIDE_FLAG_FIELDS: { key: InheritableField; label: string }[] = [
  { key: 'intended_use', label: 'Intended Use' },
  { key: 'intended_users', label: 'Intended Users' },
  { key: 'clinical_benefits', label: 'Clinical Benefits' },
  { key: 'contraindications', label: 'Contraindications' },
  { key: 'device_components', label: 'Device Components' },
  { key: 'classification', label: 'Classification' },
  { key: 'technical_specs', label: 'Technical Specs' },
  { key: 'definition', label: 'Description' },
];

// Fields tracked by field_scope_overrides JSONB (camelCase keys used by CompactScopeToggle)
const SCOPE_OVERRIDE_FIELDS: { key: string; label: string }[] = [
  // Purpose tab fields
  { key: 'intendedUse', label: 'Intended Use' },
  { key: 'intendedFunction', label: 'Intended Function' },
  { key: 'modeOfAction', label: 'Mode of Action' },
  { key: 'valueProposition', label: 'Value Proposition' },
  { key: 'clinicalBenefits', label: 'Clinical Benefits' },
  { key: 'contraindications', label: 'Contraindications' },
  { key: 'warningsPrecautions', label: 'Warnings & Precautions' },
  { key: 'sideEffects', label: 'Side Effects' },
  { key: 'residualRisks', label: 'Residual Risks' },
  { key: 'disposalInstructions', label: 'Disposal / End-of-Life' },
  { key: 'interactions', label: 'Interactions & Incompatibilities' },
  { key: 'intendedPatientPopulation', label: 'Patient Population' },
  { key: 'intendedUser', label: 'Intended User' },
  { key: 'durationOfUse', label: 'Duration of Use' },
  { key: 'environmentOfUse', label: 'Environment of Use' },
  { key: 'useTrigger', label: 'Trigger for Use' },
  { key: 'userInstructions_howToUse', label: 'How to Use' },
  { key: 'userInstructions_charging', label: 'Charging Instructions' },
  { key: 'userInstructions_maintenance', label: 'Maintenance Instructions' },
  // General > Definition tab fields
  { key: 'definition_tradeName', label: 'Trade Name' },
  { key: 'definition_deviceCategory', label: 'Device Category' },
  { key: 'definition_modelReference', label: 'Device Model/Reference' },
  { key: 'definition_description', label: 'Device Description' },
  // General > Classification tab fields
  { key: 'classification_primaryRegulatoryType', label: 'Primary Regulatory Type' },
  { key: 'classification_systemProcedurePack', label: 'System or Procedure Pack' },
  { key: 'classification_coreDeviceNature', label: 'Core Device Nature' },
  { key: 'classification_anatomicalLocation', label: 'Anatomical Location' },
  { key: 'classification_isActiveDevice', label: 'Active Device' },
  // General > Technical Specs tab fields
  { key: 'technical_trlLevel', label: 'TRL Level' },
  { key: 'technical_systemArchitecture', label: 'System Architecture' },
  { key: 'technical_keyTechCharacteristics', label: 'Key Technology Characteristics' },
  { key: 'technical_sterility', label: 'Sterility Requirements' },
  { key: 'technical_powerSource', label: 'Power Source' },
  { key: 'technical_connectivity', label: 'Connectivity Features' },
  { key: 'technical_aiMl', label: 'AI/ML Features' },
];

interface FamilySyncStatusWidgetProps {
  productId: string;
}

export function FamilySyncStatusWidget({ productId }: FamilySyncStatusWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const inheritance = useVariantInheritance(productId);
  const variantDocs = useVariantDocuments(productId);

  // Fetch field_scope_overrides JSONB from products table
  const { data: scopeOverrides } = useQuery({
    queryKey: ['field-scope-overrides', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('field_scope_overrides')
        .eq('id', productId)
        .single();
      if (error) throw error;
      return (data?.field_scope_overrides as Record<string, string>) || {};
    },
    enabled: !!productId && inheritance.isVariant,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const fieldStats = useMemo(() => {
    const overridden: { key: string; label: string }[] = [];
    const inherited: { key: string; label: string }[] = [];

    // Deduplicate: scope overrides (camelCase) take precedence, skip flag-based fields that overlap
    const scopeKeys = new Set(SCOPE_OVERRIDE_FIELDS.map(f => f.key));
    const countedLabels = new Set<string>();

    // First count scope-based overrides (these are the actual toggles the user interacts with)
    SCOPE_OVERRIDE_FIELDS.forEach(f => {
      const isIndividual = scopeOverrides?.[f.key] === 'individual';
      if (isIndividual) {
        overridden.push(f);
      } else {
        inherited.push(f);
      }
      countedLabels.add(f.label);
    });

    // Then count flag-based overrides for fields not already covered by scope overrides
    OVERRIDE_FLAG_FIELDS.forEach(f => {
      if (countedLabels.has(f.label)) return; // already counted via scope overrides
      const flagOverridden = !inheritance.isFieldInherited(f.key);
      if (flagOverridden) {
        overridden.push(f);
      } else {
        inherited.push(f);
      }
    });

    return { inherited, overridden };
  }, [inheritance, scopeOverrides]);

  const docStats = useMemo(() => {
    const total = variantDocs.links.length;
    const overridden = variantDocs.links.filter(l => l.is_overridden).length;
    const inherited = total - overridden;
    return { total, inherited, overridden };
  }, [variantDocs.links]);

  if (!inheritance.isVariant || !inheritance.masterDevice) return null;

  const totalFields = fieldStats.inherited.length + fieldStats.overridden.length;
  const totalItems = totalFields + docStats.total;
  const inheritedItems = fieldStats.inherited.length + docStats.inherited;
  const customItems = totalItems - inheritedItems;
  const syncPercent = totalItems > 0 ? Math.round((inheritedItems / totalItems) * 100) : 100;
  const hasOverrides = fieldStats.overridden.length > 0 || docStats.overridden > 0;

  return (
    <div className="rounded-lg border bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
      {/* Compact single-line banner */}
      <div
        className={`flex items-center justify-between px-3 py-2 ${hasOverrides ? 'cursor-pointer' : ''}`}
        onClick={() => hasOverrides && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 text-sm">
          <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-muted-foreground">
            Product Family
          </span>
          <span className="text-xs text-muted-foreground">
            {inheritedItems} inherited · {customItems} custom
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-xs font-semibold ${
              syncPercent === 100
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-700'
                : syncPercent >= 70
                ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-700'
                : 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-700'
            }`}
          >
            {syncPercent}%
          </Badge>
          {hasOverrides && (
            expanded
              ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expandable detail section */}
      {expanded && hasOverrides && (
        <div className="border-t border-blue-200 dark:border-blue-800 px-3 py-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Overridden Items</p>
          <div className="space-y-1">
            {fieldStats.overridden.map(f => (
              <div key={f.key} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Pencil className="h-3 w-3 text-orange-500" />
                <span>{f.label}</span>
              </div>
            ))}
            {docStats.overridden > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3 w-3 text-orange-500" />
                <span>{docStats.overridden} Document{docStats.overridden !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
