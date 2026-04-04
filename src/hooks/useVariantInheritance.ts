import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Map field keys to their override flag column names and data column names on the products table
const FIELD_MAP: Record<string, { overrideFlag: string; dataColumn: string }> = {
  intended_use: { overrideFlag: 'has_intended_use_override', dataColumn: 'intended_use' },
  intended_users: { overrideFlag: 'has_intended_users_override', dataColumn: 'intended_users' },
  clinical_benefits: { overrideFlag: 'has_clinical_benefits_override', dataColumn: 'clinical_benefits' },
  contraindications: { overrideFlag: 'has_contraindications_override', dataColumn: 'contraindications' },
  device_components: { overrideFlag: 'has_device_components_override', dataColumn: 'device_components' },
  classification: { overrideFlag: 'has_classification_override', dataColumn: 'device_category' },
  technical_specs: { overrideFlag: 'has_technical_specs_override', dataColumn: 'key_technology_characteristics' },
  definition: { overrideFlag: 'has_definition_override', dataColumn: 'description' },
};

// These override flags exist on products but their data columns are stored elsewhere (e.g. intended_purpose_data JSON)
// They are tracked for override status only — effective value resolution happens at the component level
const METADATA_ONLY_OVERRIDES = [
  'has_warnings_override',
  'has_duration_of_use_override',
  'has_environment_of_use_override',
  'has_storage_sterility_override',
  'has_shelf_life_override',
];

export type InheritableField = keyof typeof FIELD_MAP;

interface VariantInheritanceResult {
  isVariant: boolean;
  belongsToFamily: boolean;
  isLoading: boolean;
  parentDevice: { id: string; name: string } | null;
  parentProductData: Record<string, any> | null;
  getEffectiveValue: (fieldKey: InheritableField, localValue: any) => any;
  isFieldInherited: (fieldKey: InheritableField) => boolean;
  /** @deprecated Use parentDevice instead */
  masterDevice: { id: string; name: string } | null;
  /** @deprecated Use parentProductData instead */
  masterProductData: Record<string, any> | null;
  /** @deprecated Use belongsToFamily instead */
  isMaster: boolean;
}

export function useVariantInheritance(productId: string | undefined): VariantInheritanceResult {
  const queryClient = useQueryClient();

  // Fetch current product's variant info and override flags
  const { data: variantInfo, isLoading } = useQuery({
    queryKey: ['variant-inheritance', productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data, error } = await supabase
        .from('products')
        .select(`
          parent_product_id,
          parent_relationship_type,
          is_master_device,
          has_intended_use_override,
          has_intended_users_override,
          has_clinical_benefits_override,
          has_contraindications_override,
          has_warnings_override,
          has_device_components_override,
          has_classification_override,
          has_duration_of_use_override,
          has_environment_of_use_override,
          has_storage_sterility_override,
          has_shelf_life_override,
          has_technical_specs_override,
          has_definition_override
        `)
        .eq('id', productId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const isVariant = !!(
    variantInfo?.parent_product_id &&
    variantInfo?.parent_relationship_type === 'variant'
  );

  const parentId = isVariant ? variantInfo?.parent_product_id : null;

  // Fetch master device data only if this is a variant
  const { data: masterDevice } = useQuery({
    queryKey: ['master-device-data', parentId],
    queryFn: async () => {
      if (!parentId) return null;
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, trade_name, model_reference,
          intended_use, intended_users, clinical_benefits, contraindications,
          device_components, device_category, key_features,
          key_technology_characteristics, description,
          primary_regulatory_type, device_type,
          intended_purpose_data, user_instructions
        `)
        .eq('id', parentId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!parentId,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const getEffectiveValue = (fieldKey: InheritableField, localValue: any): any => {
    if (!isVariant || !masterDevice || !variantInfo) return localValue;
    const mapping = FIELD_MAP[fieldKey];
    if (!mapping) return localValue;
    const hasOverride = (variantInfo as any)[mapping.overrideFlag] === true;
    if (hasOverride) return localValue;
    return (masterDevice as any)[mapping.dataColumn] ?? localValue;
  };

  const isFieldInherited = (fieldKey: InheritableField): boolean => {
    if (!isVariant || !variantInfo) return false;
    const mapping = FIELD_MAP[fieldKey];
    if (!mapping) return false;
    return (variantInfo as any)[mapping.overrideFlag] !== true;
  };

  const parentDeviceInfo = masterDevice ? { id: masterDevice.id, name: masterDevice.name } : null;

  return {
    isVariant,
    belongsToFamily: isVariant || !!(variantInfo as any)?.is_master_device,
    isLoading,
    parentDevice: parentDeviceInfo,
    parentProductData: masterDevice || null,
    getEffectiveValue,
    isFieldInherited,
    // Deprecated aliases for backward compatibility
    masterDevice: parentDeviceInfo,
    masterProductData: masterDevice || null,
    isMaster: !!(variantInfo as any)?.is_master_device,
  };
}
