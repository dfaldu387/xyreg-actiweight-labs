import { useCallback, useEffect, useMemo, useRef, MutableRefObject } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ItemExclusionScope } from '@/hooks/useInheritanceExclusion';

interface ExclusionHook {
  setExclusionScope: (itemId: string, scope: ItemExclusionScope) => void;
  scopes: Record<string, ItemExclusionScope>;
  loaded: boolean;
}

interface FamilyProductData {
  id: string;
  primary_regulatory_type: string | null;
  device_type: any;
  key_technology_characteristics: any;
  trade_name: string | null;
  device_category: string | null;
  description: string | null;
  model_reference: string | null;
  intended_purpose_data: any;
  clinical_benefits: any;
  intended_users: any;
  contraindications: any;
  user_instructions: any;
  storage_sterility_handling: any;
  images: any;
  product_platform: string | null;
  trl_level: number | null;
}

/**
 * Resolves a field key to the raw stored value from a product row.
 * Exported for testing.
 */
export function resolveFieldValue(product: FamilyProductData, fieldKey: string): any {
  const ktc = product.key_technology_characteristics || {};
  const ipd = product.intended_purpose_data || {};
  const ui = product.user_instructions || {};

  // Parse device_type if string
  let dt = product.device_type;
  if (typeof dt === 'string') {
    try { dt = JSON.parse(dt); } catch { dt = {}; }
  }
  dt = dt || {};

  switch (fieldKey) {
    // Classification fields
    case 'classification_primaryRegulatoryType':
      return product.primary_regulatory_type;
    case 'classification_coreDeviceNature':
      return dt.invasivenessLevel ?? null;
    case 'classification_isActiveDevice':
      return ktc.isActive ?? null;
    case 'classification_systemProcedurePack':
      return ktc.isSystemOrProcedurePack ?? null;
    case 'classification_anatomicalLocation':
      return ktc.anatomicalLocation ?? null;

    // Definition fields
    case 'definition_tradeName':
      return product.trade_name;
    case 'definition_deviceCategory':
      return product.device_category;
    case 'definition_description':
      return product.description;
    case 'definition_modelReference':
      return product.model_reference;
    case 'definition_platform':
      return product.product_platform;

    // Technical
    case 'technical_trlLevel':
      return product.trl_level ?? null;

    // Grouped technical fields — compared as serialized sub-objects
    case 'technical_systemArchitecture':
      return {
        isSoftwareAsaMedicalDevice: ktc.isSoftwareAsaMedicalDevice ?? false,
        isSoftwareMobileApp: ktc.isSoftwareMobileApp ?? false,
        noSoftware: ktc.noSoftware ?? false,
      };
    case 'technical_keyTechCharacteristics':
      return {
        hasMeasuringFunction: ktc.hasMeasuringFunction ?? false,
        isReusable: ktc.isReusable ?? false,
        incorporatesMedicinalSubstance: ktc.incorporatesMedicinalSubstance ?? false,
        containsHumanAnimalMaterial: ktc.containsHumanAnimalMaterial ?? false,
        isSingleUse: ktc.isSingleUse ?? false,
        isCustomMade: ktc.isCustomMade ?? false,
        isAccessoryToMedicalDevice: ktc.isAccessoryToMedicalDevice ?? false,
      };
    case 'technical_sterility':
      return {
        isNonSterile: ktc.isNonSterile ?? false,
        isDeliveredSterile: ktc.isDeliveredSterile ?? false,
        canBeSterilized: ktc.canBeSterilized ?? false,
      };
    case 'technical_powerSource':
      return {
        isBatteryPowered: ktc.isBatteryPowered ?? false,
        isMainsPowered: ktc.isMainsPowered ?? false,
        isManualOperation: ktc.isManualOperation ?? false,
        isWirelessCharging: ktc.isWirelessCharging ?? false,
      };
    case 'technical_energyTransfer':
      return {
        energyTransferDirection: ktc.energyTransferDirection ?? null,
        energyTransferType: ktc.energyTransferType ?? null,
      };
    case 'technical_connectivity':
      return {
        hasBluetooth: ktc.hasBluetooth ?? false,
        hasWifi: ktc.hasWifi ?? false,
        hasCellular: ktc.hasCellular ?? false,
        hasNFC: ktc.hasNFC ?? false,
        hasUSB: ktc.hasUSB ?? false,
      };
    case 'technical_aiMl':
      return {
        hasImageAnalysis: ktc.hasImageAnalysis ?? false,
        hasPredictiveAnalytics: ktc.hasPredictiveAnalytics ?? false,
        hasNaturalLanguageProcessing: ktc.hasNaturalLanguageProcessing ?? false,
      };
    case 'technical_environmentalConditions':
      return {
        transportTempRange: ktc.transportTempRange ?? null,
        transportHumidity: ktc.transportHumidity ?? null,
        transportPressure: ktc.transportPressure ?? null,
        operatingTempRange: ktc.operatingTempRange ?? null,
        operatingHumidity: ktc.operatingHumidity ?? null,
        operatingPressure: ktc.operatingPressure ?? null,
      };
    case 'technical_electricalCharacteristics':
      return {
        ratedVoltage: ktc.ratedVoltage ?? null,
        ratedFrequency: ktc.ratedFrequency ?? null,
        ratedCurrentPower: ktc.ratedCurrentPower ?? null,
        protectionClass: ktc.protectionClass ?? null,
      };
    case 'technical_physicalClassification':
      return {
        appliedPartType: ktc.appliedPartType ?? null,
        ipWaterRating: ktc.ipWaterRating ?? null,
        portability: ktc.portability ?? null,
        modeOfOperation: ktc.modeOfOperation ?? null,
      };

    // Purpose / Statement of Use
    case 'intendedUse':
      return ipd.clinicalPurpose ?? null;
    case 'intendedFunction':
      return ipd.indications ?? null;
    case 'modeOfAction':
      return ipd.modeOfAction ?? null;
    case 'valueProposition':
      return ipd.valueProposition ?? null;
    case 'intendedUseCategory':
      return ipd.intended_use_category ?? null;
    case 'essentialPerformance':
      return ipd.essentialPerformance ?? null;

    // Context of Use
    case 'intendedPatientPopulation':
    case 'targetPopulation':
      return ipd.targetPopulation ?? null;
    case 'intendedUser':
    case 'userProfile':
      return ipd.userProfile ?? null;
    case 'durationOfUse':
      return ipd.durationOfUse ?? null;
    case 'environmentOfUse':
    case 'useEnvironment':
      return ipd.useEnvironment ?? null;
    case 'useTrigger':
      return ipd.useTrigger ?? null;

    // Safety
    case 'clinicalBenefits':
      return product.clinical_benefits;
    case 'contraindications':
      return product.contraindications;
    case 'warningsPrecautions':
      return ipd.warnings ?? null;
    case 'intendedUsers':
      return product.intended_users;
    case 'sideEffects':
      return ipd.side_effects ?? null;
    case 'residualRisks':
      return ipd.residual_risks ?? null;
    case 'interactions':
      return ipd.interactions ?? null;

    // Media
    case 'media_deviceMedia':
      return product.images ?? null;

    // Additional
    case 'disposalInstructions':
      return ipd.disposal_instructions ?? null;
    case 'userInstructions_howToUse':
      return ui.how_to_use ?? null;
    case 'userInstructions_charging':
      return ui.charging ?? null;
    case 'userInstructions_maintenance':
      return ui.maintenance ?? null;

    default:
      // Handle custom user instruction fields: userInstructions_custom_<uuid>
      if (fieldKey.startsWith('userInstructions_custom_')) {
        const customId = fieldKey.replace('userInstructions_custom_', '');
        const customFields = (ui as any).custom_fields || [];
        return customFields.find((f: any) => f.id === customId) || null;
      }
      return undefined;
  }
}

/** Exported for testing. */
export function normalizeScopeValue(fieldKey: string, value: any): any {
  if (fieldKey === 'classification_primaryRegulatoryType') {
    const raw = String(value ?? '').trim();
    if (!raw) return 'Medical Device (MDR)';

    const normalized = raw.toLowerCase();
    if (normalized === 'medical device' || normalized === 'medical device (mdr)' || normalized === 'mdr') {
      return 'Medical Device (MDR)';
    }
    if (
      normalized === 'in vitro diagnostic' ||
      normalized === 'in vitro diagnostic device' ||
      normalized === 'in vitro diagnostic (ivd)' ||
      normalized === 'ivd'
    ) {
      return 'In Vitro Diagnostic (IVD)';
    }

    return raw;
  }

  if (fieldKey === 'classification_coreDeviceNature') {
    const raw = String(value ?? '').trim();
    if (!raw) return 'Non-invasive';

    const normalized = raw.toLowerCase();
    if (normalized === 'non-invasive' || normalized === 'non invasive' || normalized === 'noninvasive') {
      return 'Non-invasive';
    }
    if (normalized === 'invasive') {
      return 'Invasive';
    }
    if (normalized === 'surgically invasive' || normalized === 'surgical invasive') {
      return 'Surgically invasive';
    }
    if (normalized === 'implantable' || normalized === 'implant') {
      return 'Implantable';
    }

    return raw;
  }

  if (fieldKey === 'classification_isActiveDevice' || fieldKey === 'classification_systemProcedurePack') {
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return value === true;
  }

  // Custom user instruction fields: compare by value content only (not id/label metadata)
  if (fieldKey.startsWith('userInstructions_custom_')) {
    if (value && typeof value === 'object' && 'value' in value) return value.value ?? null;
    return value ?? null;
  }

  return value;
}

/**
 * Maps a scope field key to the DB column to update.
 */
function getSimpleDbColumn(fieldKey: string): string | null {
  const map: Record<string, string> = {
    'definition_description': 'description',
    'definition_tradeName': 'trade_name',
    'definition_deviceCategory': 'device_category',
    'definition_modelReference': 'model_reference',
    'definition_platform': 'product_platform',
    'classification_primaryRegulatoryType': 'primary_regulatory_type',
    'clinicalBenefits': 'clinical_benefits',
    'contraindications': 'contraindications',
    'intendedUsers': 'intended_users',
    'media_deviceMedia': 'images',
    'technical_trlLevel': 'trl_level',
  };
  return map[fieldKey] || null;
}

/**
 * Maps field keys to intended_purpose_data JSON sub-keys.
 */
function getJsonSubKey(fieldKey: string): string | null {
  const map: Record<string, string> = {
    'intendedUse': 'clinicalPurpose',
    'intendedFunction': 'indications',
    'modeOfAction': 'modeOfAction',
    'valueProposition': 'valueProposition',
    'intendedUseCategory': 'intended_use_category',
    'essentialPerformance': 'essentialPerformance',
    'intendedPatientPopulation': 'targetPopulation',
    'targetPopulation': 'targetPopulation',
    'intendedUser': 'userProfile',
    'userProfile': 'userProfile',
    'durationOfUse': 'durationOfUse',
    'environmentOfUse': 'useEnvironment',
    'useEnvironment': 'useEnvironment',
    'useTrigger': 'useTrigger',
    'warningsPrecautions': 'warnings',
    'sideEffects': 'side_effects',
    'residualRisks': 'residual_risks',
    'interactions': 'interactions',
    'disposalInstructions': 'disposal_instructions',
  };
  return map[fieldKey] || null;
}

/**
 * Maps field keys to key_technology_characteristics sub-keys.
 * For grouped fields, returns an array of sub-keys whose values are in the value object.
 */
function getKtcSubKeys(fieldKey: string): string[] | null {
  const map: Record<string, string[]> = {
    'classification_isActiveDevice': ['isActive'],
    'classification_systemProcedurePack': ['isSystemOrProcedurePack'],
    'classification_anatomicalLocation': ['anatomicalLocation'],
    'technical_systemArchitecture': ['isSoftwareAsaMedicalDevice', 'isSoftwareMobileApp', 'noSoftware'],
    'technical_keyTechCharacteristics': ['hasMeasuringFunction', 'isReusable', 'incorporatesMedicinalSubstance', 'containsHumanAnimalMaterial', 'isSingleUse', 'isCustomMade', 'isAccessoryToMedicalDevice'],
    'technical_sterility': ['isNonSterile', 'isDeliveredSterile', 'canBeSterilized'],
    'technical_powerSource': ['isBatteryPowered', 'isMainsPowered', 'isManualOperation', 'isWirelessCharging'],
    'technical_energyTransfer': ['energyTransferDirection', 'energyTransferType'],
    'technical_connectivity': ['hasBluetooth', 'hasWifi', 'hasCellular', 'hasNFC', 'hasUSB'],
    'technical_aiMl': ['hasImageAnalysis', 'hasPredictiveAnalytics', 'hasNaturalLanguageProcessing'],
    'technical_environmentalConditions': ['transportTempRange', 'transportHumidity', 'transportPressure', 'operatingTempRange', 'operatingHumidity', 'operatingPressure'],
    'technical_electricalCharacteristics': ['ratedVoltage', 'ratedFrequency', 'ratedCurrentPower', 'protectionClass'],
    'technical_physicalClassification': ['appliedPartType', 'ipWaterRating', 'portability', 'modeOfOperation'],
  };
  return map[fieldKey] || null;
}

/**
 * Maps field keys to device_type JSON sub-keys.
 */
function getDeviceTypeSubKey(fieldKey: string): string | null {
  const map: Record<string, string> = {
    'classification_coreDeviceNature': 'invasivenessLevel',
  };
  return map[fieldKey] || null;
}

/**
 * Maps field keys to user_instructions JSON sub-keys.
 */
function getUserInstructionsSubKey(fieldKey: string): string | null {
  const map: Record<string, string> = {
    'userInstructions_howToUse': 'how_to_use',
    'userInstructions_charging': 'charging',
    'userInstructions_maintenance': 'maintenance',
  };
  return map[fieldKey] || null;
}

/**
 * Propagates a field value from the current product to a set of target products.
 * Handles simple columns, intended_purpose_data, key_technology_characteristics,
 * device_type, and user_instructions JSON sub-fields.
 */
async function propagateFieldToProducts(
  fieldKey: string,
  value: any,
  targetProductIds: string[]
): Promise<void> {
  if (targetProductIds.length === 0) return;

  // Try simple column first
  const column = getSimpleDbColumn(fieldKey);
  if (column) {
    const { error } = await supabase
      .from('products')
      .update({ [column]: value } as any)
      .in('id', targetProductIds);
    if (error) console.error('[propagateFieldToProducts] Error:', error);
    return;
  }

  // Try JSON sub-key in intended_purpose_data
  const ipdSubKey = getJsonSubKey(fieldKey);
  if (ipdSubKey) {
    const { data: products } = await supabase
      .from('products')
      .select('id, intended_purpose_data')
      .in('id', targetProductIds);
    if (!products) return;
    await Promise.all(products.map(async (p: any) => {
      const ipd = { ...(p.intended_purpose_data as Record<string, any>) || {} };
      ipd[ipdSubKey] = value;
      return supabase.from('products').update({ intended_purpose_data: ipd } as any).eq('id', p.id);
    }));
    return;
  }

  // Try key_technology_characteristics sub-keys
  const ktcKeys = getKtcSubKeys(fieldKey);
  if (ktcKeys) {
    const { data: products } = await supabase
      .from('products')
      .select('id, key_technology_characteristics')
      .in('id', targetProductIds);
    if (!products) return;
    await Promise.all(products.map(async (p: any) => {
      const ktc = { ...(p.key_technology_characteristics as Record<string, any>) || {} };
      if (ktcKeys.length === 1) {
        // Single sub-key (e.g. isActive, trlLevel)
        ktc[ktcKeys[0]] = value;
      } else {
        // Grouped sub-keys — value is an object with matching keys
        for (const key of ktcKeys) {
          ktc[key] = value?.[key] ?? ktc[key];
        }
      }
      return supabase.from('products').update({ key_technology_characteristics: ktc } as any).eq('id', p.id);
    }));
    return;
  }

  // Try device_type sub-key
  const dtSubKey = getDeviceTypeSubKey(fieldKey);
  if (dtSubKey) {
    const { data: products } = await supabase
      .from('products')
      .select('id, device_type')
      .in('id', targetProductIds);
    if (!products) return;
    await Promise.all(products.map(async (p: any) => {
      let dt = p.device_type;
      if (typeof dt === 'string') { try { dt = JSON.parse(dt); } catch { dt = {}; } }
      dt = { ...(dt || {}) };
      dt[dtSubKey] = value;
      return supabase.from('products').update({ device_type: dt } as any).eq('id', p.id);
    }));
    return;
  }

  // Try user_instructions sub-key
  const uiSubKey = getUserInstructionsSubKey(fieldKey);
  if (uiSubKey) {
    const { data: products } = await supabase
      .from('products')
      .select('id, user_instructions')
      .in('id', targetProductIds);
    if (!products) return;
    await Promise.all(products.map(async (p: any) => {
      const ui = { ...(p.user_instructions as Record<string, any>) || {} };
      ui[uiSubKey] = value;
      return supabase.from('products').update({ user_instructions: ui } as any).eq('id', p.id);
    }));
    return;
  }

  // Handle custom user instruction fields: userInstructions_custom_<uuid>
  if (fieldKey.startsWith('userInstructions_custom_')) {
    const customId = fieldKey.replace('userInstructions_custom_', '');
    const { data: products } = await supabase
      .from('products')
      .select('id, user_instructions')
      .in('id', targetProductIds);
    if (!products) return;
    await Promise.all(products.map(async (p: any) => {
      const ui = { ...(p.user_instructions as Record<string, any>) || {} };
      let customFields = [...(ui.custom_fields || [])];
      if (value === null) {
        // Deletion — remove the custom field
        customFields = customFields.filter((f: any) => f.id !== customId);
      } else {
        const existingIdx = customFields.findIndex((f: any) => f.id === customId);
        if (existingIdx >= 0) {
          customFields[existingIdx] = value;
        } else {
          customFields.push(value);
        }
      }
      ui.custom_fields = customFields;
      return supabase.from('products').update({ user_instructions: ui } as any).eq('id', p.id);
    }));
    return;
  }

  console.warn('[propagateFieldToProducts] No propagation handler for field:', fieldKey);
}

/**
 * Mirrors a scope entry to all family products so every device sees the same group membership.
 * This is the single source of truth for scope mirroring — all tabs should use this
 * instead of duplicating the mirror logic.
 *
 * @param itemId - The scoped item key (e.g. document ID, feature name, market code)
 * @param scope - The scope to mirror
 * @param storageKey - The key in field_scope_overrides (e.g. 'market_exclusion_scopes')
 * @param productId - Current product ID
 * @param companyId - Company ID to find family products
 * @param additionalQueryKeys - Extra query keys to invalidate beyond the standard product ones
 */
export async function mirrorScopeToFamilyProducts(
  itemId: string,
  scope: ItemExclusionScope,
  storageKey: string,
  productId: string,
  companyId: string,
  parentProductId?: string | null,
  additionalQueryKeys?: string[][]
): Promise<void> {
  const rootId = parentProductId || productId;
  const { data: allProducts } = await supabase
    .from('products')
    .select('id, field_scope_overrides')
    .eq('is_archived', false)
    .or(`id.eq.${rootId},and(parent_product_id.eq.${rootId},parent_relationship_type.eq.variant)`);

  if (!allProducts) return;

  const otherProducts = allProducts.filter(p => p.id !== productId);
  if (otherProducts.length === 0) return;

  await Promise.all(otherProducts.map(async (tp: any) => {
    const overrides = { ...((tp.field_scope_overrides as Record<string, any>) || {}) };
    const scopes = { ...(overrides[storageKey] || {}) };
    scopes[itemId] = scope;
    overrides[storageKey] = scopes;
    return supabase.from('products')
      .update({ field_scope_overrides: overrides } as any)
      .eq('id', tp.id);
  }));

  // Invalidate caches
  const { queryClient } = await import('@/lib/query-client');
  for (const tp of otherProducts) {
    queryClient.invalidateQueries({ queryKey: ['productDetails', tp.id] });
    queryClient.invalidateQueries({ queryKey: ['product', tp.id] });
  }
  if (additionalQueryKeys) {
    for (const key of additionalQueryKeys) {
      queryClient.invalidateQueries({ queryKey: key });
    }
  }
}

/**
 * Hook that wraps an exclusion hook's setExclusionScope with automatic scope mirroring.
 * Returns a drop-in replacement for the exclusion hook that mirrors on every scope change.
 *
 * Usage:
 *   const mirrored = useScopeMirroring(fieldExclusion, storageKey, productId, companyId, belongsToFamily);
 *   // Pass mirrored.setExclusionScope to InheritanceExclusionPopover's onScopeChange
 */
export function useScopeMirroring(
  exclusionHook: { getExclusionScope: (id: string) => ItemExclusionScope; setExclusionScope: (id: string, scope: ItemExclusionScope) => Promise<void> | void },
  storageKey: string,
  productId: string | undefined,
  companyId: string | undefined,
  belongsToFamily: boolean,
  additionalQueryKeys?: string[][],
  parentProductId?: string | null
) {
  const mirroredSetScope = useCallback(async (itemId: string, scope: ItemExclusionScope) => {
    const scopeWithFlag = { ...scope, isManualGroup: true };
    await exclusionHook.setExclusionScope(itemId, scopeWithFlag);

    if (!belongsToFamily || !productId || !companyId) return;
    await mirrorScopeToFamilyProducts(itemId, scopeWithFlag, storageKey, productId, companyId, parentProductId, additionalQueryKeys);
  }, [exclusionHook, storageKey, productId, companyId, belongsToFamily, additionalQueryKeys, parentProductId]);

  const mirrored = useMemo(() => ({
    getExclusionScope: exclusionHook.getExclusionScope,
    setExclusionScope: mirroredSetScope,
  }), [exclusionHook.getExclusionScope, mirroredSetScope]);

  return mirrored;
}

/**
 * Federal family auto-sync: when a field value changes, counts how many
 * family members share the same value and updates exclusion scopes accordingly.
 *
 * Badge shows "X/N" where X = products with matching value.
 */
export function useAutoSyncScope(
  productId: string | undefined,
  companyId: string | undefined,
  exclusionHook: ExclusionHook | undefined,
  belongsToFamily: boolean,
  parentProductId?: string | null
) {
  // Track latest edited values in-memory so propagation uses fresh content
  const latestEditedValuesRef = useRef<Record<string, any>>({});
  // Track fields manually changed by user via popover to prevent initial sync overwrite
  const manualOverrideKeysRef = useRef<Set<string>>(new Set());

  // Root of the device family: if current product is a variant use its parent, otherwise use itself
  const familyRootId = parentProductId || productId;

  const { data: familyProducts } = useQuery<FamilyProductData[]>({
    queryKey: ['family-products-scope-sync', familyRootId],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, primary_regulatory_type, device_type, key_technology_characteristics, trade_name, device_category, description, model_reference, intended_purpose_data, clinical_benefits, intended_users, contraindications, user_instructions, storage_sterility_handling, images, product_platform, trl_level, updated_at')
        .eq('is_archived', false)
        .or(`id.eq.${familyRootId},and(parent_product_id.eq.${familyRootId},parent_relationship_type.eq.variant)`);
      return (data || []) as FamilyProductData[];
    },
    enabled: !!familyRootId && belongsToFamily,
    staleTime: 30_000,
  });

  /**
   * Returns the persisted scope for a field. The scope is initially set by
   * the auto-sync effect based on value divergence, and then updated by
   * user manual selections via the popover.
   */
  const getComputedScope = useCallback(
    (fieldKey: string): ItemExclusionScope => {
      return exclusionHook?.scopes[fieldKey] || {};
    },
    [exclusionHook?.scopes]
  );

  // Debounce timers for value propagation to group members
  const propagationTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  /**
   * syncScope(fieldKey, newValue)
   * If a manual group exists for this field, propagates the value to group members (debounced).
   * Otherwise falls back to auto-detecting scope from value divergence.
   */
  const syncScope = useCallback(
    (fieldKey: string, newValue: any) => {
      // Always track latest value so handleScopeChangeWithPropagation can use it
      latestEditedValuesRef.current[fieldKey] = newValue;

      if (!exclusionHook || !productId || !familyProducts || !belongsToFamily) {
        return;
      }

      const existingScope = exclusionHook.scopes[fieldKey];
      // Treat scope as manual if flagged OR if it has explicit excludedProductIds (e.g. from migration sync)
      const isManualScope = existingScope?.isManualGroup === true ||
        (existingScope && Array.isArray(existingScope.excludedProductIds));
      const isInGroup = isManualScope &&
        !(existingScope.excludedProductIds || []).includes(productId);

      if (isInGroup) {
        // Current product is in a manual group — propagate to group members (debounced)
        if (propagationTimerRef.current[fieldKey]) {
          clearTimeout(propagationTimerRef.current[fieldKey]);
        }
        propagationTimerRef.current[fieldKey] = setTimeout(async () => {
          const excludedSet = new Set(existingScope!.excludedProductIds || []);
          const groupMemberIds = familyProducts
            .filter(p => p.id !== productId && !excludedSet.has(p.id))
            .map(p => p.id);

          if (groupMemberIds.length > 0) {
            const freshValue = latestEditedValuesRef.current[fieldKey] ?? newValue;
            await propagateFieldToProducts(fieldKey, freshValue, groupMemberIds);
            const { queryClient } = await import('@/lib/query-client');
            queryClient.invalidateQueries({ queryKey: ['family-products-scope-sync', familyRootId] });
            for (const targetId of groupMemberIds) {
              queryClient.invalidateQueries({ queryKey: ['productDetails', targetId] });
              queryClient.invalidateQueries({ queryKey: ['product', targetId] });
            }
          }
        }, 800);
        return;
      }

      if (isManualScope) {
        // Manual scope exists but current product is excluded — independent, don't touch scope
        return;
      }

      // No manual scope — auto-detect from value divergence
      const newValStr = JSON.stringify(normalizeScopeValue(fieldKey, newValue));
      const divergentIds = familyProducts
        .filter(p => {
          if (p.id === productId) return false;
          return JSON.stringify(normalizeScopeValue(fieldKey, resolveFieldValue(p, fieldKey))) !== newValStr;
        })
        .map(p => p.id);

      exclusionHook.setExclusionScope(fieldKey, {
        excludedProductIds: divergentIds,
      });
    },
    [exclusionHook, productId, familyProducts, belongsToFamily, companyId, familyRootId]
  );

  // Build a fingerprint of family data using updated_at for robust change detection
  const familyFingerprint = useMemo(() => {
    if (!familyProducts) return '';
    return familyProducts.map(p => `${p.id}:${(p as any).updated_at || ''}`).join('|');
  }, [familyProducts]);

  // Initial sync: when products load or productId/data changes, re-sync ALL scope keys
  // plus any keys with live divergence (even if not persisted)
  const lastSyncKey = useRef<string>('');
  useEffect(() => {
    if (!familyProducts || !exclusionHook || !productId || !belongsToFamily) return;
    if (!exclusionHook.loaded) return;

    const syncKey = `${productId}:${familyFingerprint}`;
    if (lastSyncKey.current === syncKey) return;

    const currentProduct = familyProducts.find(p => p.id === productId);
    if (!currentProduct) return;

    lastSyncKey.current = syncKey;

    // Collect all persisted scope keys
    const scopeKeys = new Set(Object.keys(exclusionHook.scopes));

    // Also check ALL known field keys for live divergence — this catches
    // fields that have divergent values but no persisted scope entry yet
    const ALL_FIELD_KEYS = [
      'classification_primaryRegulatoryType', 'classification_coreDeviceNature',
      'classification_isActiveDevice', 'classification_systemProcedurePack',
      'classification_anatomicalLocation',
      'definition_tradeName', 'definition_deviceCategory', 'definition_platform',
      'definition_description', 'definition_modelReference',
      'technical_trlLevel', 'technical_systemArchitecture',
      'technical_keyTechCharacteristics', 'technical_sterility',
      'technical_powerSource', 'technical_energyTransfer', 'technical_connectivity',
      'intendedUse', 'intendedFunction', 'modeOfAction', 'valueProposition', 'intendedUseCategory', 'essentialPerformance',
      'intendedPatientPopulation', 'targetPopulation', 'intendedUser', 'userProfile',
      'durationOfUse', 'environmentOfUse', 'useEnvironment', 'useTrigger',
      'clinicalBenefits', 'contraindications', 'warningsPrecautions',
      'intendedUsers', 'sideEffects', 'residualRisks', 'interactions',
      'disposalInstructions', 'userInstructions_howToUse',
      'userInstructions_charging', 'userInstructions_maintenance',
      'media_deviceMedia',
    ];

    for (const fk of ALL_FIELD_KEYS) scopeKeys.add(fk);

    for (const fieldKey of scopeKeys) {
      // Skip fields that were manually changed by the user via the popover
      if (manualOverrideKeysRef.current.has(fieldKey)) continue;
      // Skip fields with a persisted scope (manual group or migrated scope with explicit excludedProductIds)
      const persistedScope = exclusionHook.scopes[fieldKey];
      if (persistedScope?.isManualGroup || (persistedScope && Array.isArray(persistedScope.excludedProductIds))) continue;

      const currentValue = normalizeScopeValue(fieldKey, resolveFieldValue(currentProduct, fieldKey));
      const newValStr = JSON.stringify(currentValue);
      const divergentIds = familyProducts
        .filter(p => {
          if (p.id === productId) return false;
          return JSON.stringify(normalizeScopeValue(fieldKey, resolveFieldValue(p, fieldKey))) !== newValStr;
        })
        .map(p => p.id);

      // Only persist/update if there's actual divergence or an existing scope entry
      const hasDivergence = divergentIds.length > 0;
      const hadPersistedScope = !!exclusionHook.scopes[fieldKey];
      if (hasDivergence || hadPersistedScope) {
        exclusionHook.setExclusionScope(fieldKey, {
          excludedProductIds: divergentIds,
        });
      }
    }
  }, [familyProducts, familyFingerprint, exclusionHook, productId, belongsToFamily]);

  /**
   * Called when the user changes the scope via the popover.
   * Detects newly-included products and propagates the current product's value to them.
   * Uses the passed-in old scope for reliable target detection, and in-memory edited values for freshness.
   */
  const handleScopeChangeWithPropagation = useCallback(
    async (fieldKey: string, _oldScope: ItemExclusionScope, newScope: ItemExclusionScope) => {
      if (!exclusionHook || !productId) return;

      // Mark this field as manually overridden so initial sync won't overwrite it
      manualOverrideKeysRef.current.add(fieldKey);

      // Tag the scope as a manual group so auto-detect won't confuse it
      const scopeWithFlag: ItemExclusionScope = { ...newScope, isManualGroup: true };

      // Update the exclusion metadata and wait for DB persistence
      await exclusionHook.setExclusionScope(fieldKey, scopeWithFlag);

      // Mirror scope to all family products (reusable utility)
      if (companyId) {
        await mirrorScopeToFamilyProducts(fieldKey, scopeWithFlag, 'classification_exclusion_scopes', productId, companyId, parentProductId);
      }

      // Propagate values to newly included products
      const allProductIds = (familyProducts || []).map(p => p.id);
      const excludedSet = new Set(newScope.excludedProductIds || []);
      const otherProductIds = allProductIds.filter(id => id !== productId);

      if (otherProductIds.length > 0) {
        const { data: targetProducts } = await supabase
          .from('products')
          .select('id, field_scope_overrides')
          .in('id', otherProductIds);

        if (targetProducts) {
          await Promise.all(targetProducts.map(async (tp: any) => {
            const overrides = { ...(tp.field_scope_overrides as Record<string, any>) || {} };
            const scopes = { ...(overrides['classification_exclusion_scopes'] as Record<string, any>) || {} };

            // Every product gets the same scope — they all see the same group membership
            scopes[fieldKey] = scopeWithFlag;

            overrides['classification_exclusion_scopes'] = scopes;
            return supabase.from('products')
              .update({ field_scope_overrides: overrides } as any)
              .eq('id', tp.id);
          }));
        }
      }

      // Propagate values to newly included products
      // When old scope is empty (first-time setup), treat all other products as previously excluded.
      // This ensures newly checked devices in the popover receive the current value.
      const isFirstTimeScope = !_oldScope.excludedProductIds && !_oldScope.isManualGroup;
      const oldExcluded = new Set(
        isFirstTimeScope ? allProductIds.filter(id => id !== productId) : (_oldScope.excludedProductIds || [])
      );
      const newExcluded = new Set(newScope.excludedProductIds || []);
      const newlyIncludedOthers = [...oldExcluded].filter(id => !newExcluded.has(id) && id !== productId);
      const currentProductJoining = oldExcluded.has(productId) && !newExcluded.has(productId);

      // Find an existing group member to use as the value source
      const existingGroupMemberIds = allProductIds.filter(id =>
        id !== productId && !excludedSet.has(id) && !oldExcluded.has(id)
      );

      if (currentProductJoining && existingGroupMemberIds.length > 0) {
        // Current product is joining an existing group — pull value FROM a group member
        const sourceId = existingGroupMemberIds[0];
        const { data: sourceProduct } = await supabase
          .from('products')
          .select('id, primary_regulatory_type, device_type, key_technology_characteristics, trade_name, device_category, description, model_reference, intended_purpose_data, clinical_benefits, intended_users, contraindications, user_instructions, storage_sterility_handling, images, product_platform')
          .eq('id', sourceId)
          .single();

        if (sourceProduct) {
          const groupValue = resolveFieldValue(sourceProduct as FamilyProductData, fieldKey);
          // Apply group value to current product + any other newly included
          await propagateFieldToProducts(fieldKey, groupValue, [productId, ...newlyIncludedOthers]);
        }
      } else if (newlyIncludedOthers.length > 0) {
        // Other products joining — push current product's value to them
        let currentValue: any;
        if (latestEditedValuesRef.current[fieldKey] !== undefined) {
          currentValue = latestEditedValuesRef.current[fieldKey];
        } else {
          const { data: freshProduct, error: readError } = await supabase
            .from('products')
            .select('id, primary_regulatory_type, device_type, key_technology_characteristics, trade_name, device_category, description, model_reference, intended_purpose_data, clinical_benefits, intended_users, contraindications, user_instructions, storage_sterility_handling, images, product_platform, trl_level')
            .eq('id', productId)
            .single();
          if (readError || !freshProduct) {
            console.error('[handleScopeChangeWithPropagation] Failed to read source product:', readError);
            return;
          }
          currentValue = resolveFieldValue(freshProduct as FamilyProductData, fieldKey);
        }

        await propagateFieldToProducts(fieldKey, currentValue, newlyIncludedOthers);
      }

      // Refetch family products (await ensures fresh data before returning) + invalidate current product
      const { queryClient } = await import('@/lib/query-client');
      await queryClient.refetchQueries({ queryKey: ['family-products-scope-sync', familyRootId] });
      queryClient.invalidateQueries({ queryKey: ['productDetails', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
    [exclusionHook, productId, companyId, familyProducts, familyRootId]
  );

  return { syncScope, familyProducts, handleScopeChangeWithPropagation, getComputedScope };
}
