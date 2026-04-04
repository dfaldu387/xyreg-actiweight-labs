import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { DeviceComponentsService } from '@/services/deviceComponentsService';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, X, Sparkles, Pencil, Search, Package, ShieldCheck, ChevronRight, ChevronDown, Cpu, Code, Layers, Edit, Loader2, Upload, GripVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { KeyFeature, normalizeKeyFeatures } from '@/utils/keyFeaturesNormalizer';
import { ensureFeatureIds, generateFeatureId } from '@/utils/featureIdGenerator';
import { AddKeyFeatureDialog } from '../../AddKeyFeatureDialog';
import { DeviceComponentsSection } from '../../DeviceComponentsSection';
import { FeatureImportDialog } from '../../FeatureImportDialog';
import { ComponentImportDialog } from '../../ComponentImportDialog';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

import { useTranslation } from '@/hooks/useTranslation';
import { useBomRevisions, useBomItems } from '@/hooks/useBom';

import { GovernanceBookmark } from '@/components/ui/GovernanceBookmark';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { mirrorScopeToFamilyProducts } from '@/hooks/useAutoSyncScope';
import { useInheritanceExclusion } from '@/hooks/useInheritanceExclusion';
import { InheritanceExclusionPopover } from '@/components/shared/InheritanceExclusionPopover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from 'react-router-dom';
import {
  useDeviceComponentTree,
  useCreateDeviceComponent,
  useUpdateDeviceComponent,
  useDeleteDeviceComponent,
  useSetComponentFeatures,
  useDeviceComponents,
} from '@/hooks/useDeviceComponents';
import type { DbDeviceComponent } from '@/services/deviceComponentsService';
import { toast } from 'sonner';

interface ProductHazard {
  id: string;
  hazard_id: string;
  description: string;
  category?: string;
}

interface DeviceComponent {
  name: string;
  description: string;
  linkedFeatureNames?: string[];
  linkedBomItemIds?: string[];
}

interface FeaturesTabProps {
  keyFeatures?: KeyFeature[];
  deviceComponents?: DeviceComponent[];
  onKeyFeaturesChange?: (value: KeyFeature[]) => void;
  onDeviceComponentsChange?: (value: DeviceComponent[]) => void;
  isLoading?: boolean;
  productId?: string;
  company_id?: string;
  clinicalBenefits?: string[];
  onClinicalBenefitsChange?: (value: string[]) => void;
  productHazards?: ProductHazard[]; // deprecated — kept for interface compat
  onAddHazard?: (input: any, requirementIds: string[]) => void; // deprecated
  // Governance & scope
  belongsToFamily?: boolean;
  isMaster?: boolean;
  isVariant?: boolean;
  getFieldScope?: (key: string) => 'individual' | 'product_family';
  onFieldScopeChange?: (key: string, scope: 'individual' | 'product_family') => void;
  getGovernanceSection?: (key: string) => any;
  masterDeviceId?: string;
  masterDeviceName?: string;
  // Master data for selective inheritance
  masterKeyFeatures?: KeyFeature[];
  masterDeviceComponents?: DeviceComponent[];
  // Product identification for stable Feature IDs
  model_reference?: string;
  productName?: string;
  familyProductIds?: string[];
  parentProductId?: string | null;
}

export function FeaturesTab({
  keyFeatures = [],
  deviceComponents = [],
  onKeyFeaturesChange,
  onDeviceComponentsChange,
  isLoading,
  productId,
  company_id,
  clinicalBenefits = [],
  onClinicalBenefitsChange,
  productHazards = [],  // unused — kept for interface compat
  onAddHazard,          // unused — kept for interface compat
  belongsToFamily = false,
  isMaster = false,
  isVariant = false,
  getFieldScope,
  onFieldScopeChange,
  getGovernanceSection,
  masterDeviceId,
  masterDeviceName = 'Master Device',
  masterKeyFeatures = [],
  masterDeviceComponents = [],
  model_reference,
  productName,
  familyProductIds,
  parentProductId,
}: FeaturesTabProps) {
  const { lang } = useTranslation();
  const queryClient = useQueryClient();
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [featureImportOpen, setFeatureImportOpen] = useState(false);
  const [componentImportOpen, setComponentImportOpen] = useState(false);
  const [editingFeatureIndex, setEditingFeatureIndex] = useState<number | null>(null);
  const [componentAddDialogOpen, setComponentAddDialogOpen] = useState(false);

  // Auto-assign stable IDs to features that lack them (migration)
  useEffect(() => {
    if (!onKeyFeaturesChange || keyFeatures.length === 0) return;
    const [updated, changed] = ensureFeatureIds(keyFeatures, model_reference, productName);
    if (changed) {
      onKeyFeaturesChange(updated);
    }
  }, [keyFeatures, model_reference, productName]); // eslint-disable-line react-hooks/exhaustive-deps


  // Fetch DB-backed device components for feature linking
  const { data: dbComponents = [] } = useDeviceComponents(productId);
  const { data: masterDbComponents = [] } = useDeviceComponents(masterDeviceId || undefined);
  const availableDbComponents = useMemo(() => {
    const masterComps = masterDbComponents.map(c => ({ name: c.name, description: c.description }));
    const localComps = dbComponents
      .filter(c => !masterDbComponents.some(mc => mc.name === c.name))
      .map(c => ({ name: c.name, description: c.description }));
    return [...masterComps, ...localComps];
  }, [dbComponents, masterDbComponents]);

  const { data: bomRevisions } = useBomRevisions(productId);
  const activeRevision = useMemo(
    () => bomRevisions?.find(r => r.status === 'active'),
    [bomRevisions]
  );
  const { data: bomItems } = useBomItems(activeRevision?.id);
  // bomItems used for explicit linking in DeviceComponentsSection

  // Fetch user needs for this product (for linking in AddKeyFeatureDialog)
  const { data: productUserNeeds = [] } = useQuery({
    queryKey: ['product-user-needs-for-features', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('user_needs')
        .select('id, user_need_id, description')
        .eq('product_id', productId)
        .order('user_need_id', { ascending: true });
      if (error) return [];
      return data || [];
    },
    enabled: !!productId,
    staleTime: 30_000,
  });

  // Granular feature exclusion scopes (same pattern as hazards & doc CIs)
  const {
    getExclusionScope: getFeatureExclusionScope,
    setExclusionScope: setFeatureExclusionScope,
    isFullyExcluded: isFeatureExcluded,
    getExclusionSummary: getFeatureExclusionSummary,
    loaded: featureExclusionsLoaded,
  } = useInheritanceExclusion(masterDeviceId || productId, true, 'feature_exclusion_scopes');

  // Granular component exclusion scopes
  const {
    getExclusionScope: getComponentExclusionScope,
    setExclusionScope: setComponentExclusionScope,
    isFullyExcluded: isComponentExcluded,
    getExclusionSummary: getComponentExclusionSummary,
    loaded: componentExclusionsLoaded,
  } = useInheritanceExclusion(masterDeviceId || productId, true, 'component_exclusion_scopes');

  // Wrap feature scope change with propagation: copy feature to included devices & mirror scope
  const handleFeatureScopeChange = useCallback(async (itemId: string, newScope: import('@/hooks/useInheritanceExclusion').ItemExclusionScope) => {
    const scopeWithFlag = { ...newScope, isManualGroup: true };
    await setFeatureExclusionScope(itemId, scopeWithFlag);

    if (!company_id || !productId) return;

    // Copy feature to all included family products that don't have it yet
    const feature = keyFeatures.find(f => f.name === itemId);
    if (feature) {
      const newExcluded = new Set(newScope.excludedProductIds || []);
      const targetIds = (familyProductIds || []).filter(id => id !== productId && !newExcluded.has(id));
      const { data: allProducts } = targetIds.length > 0
        ? await supabase
            .from('products')
            .select('id, key_features')
            .in('id', targetIds)
        : { data: [] };

      if (allProducts) {
        const includedOthers = allProducts;
        await Promise.all(includedOthers.map(async (tp) => {
          const existing = normalizeKeyFeatures(tp.key_features);
          if (existing.some(f => f.name === itemId)) return;
          const updated = [...existing, feature];
          return supabase.from('products').update({ key_features: updated } as any).eq('id', tp.id);
        }));
      }
    }

    // Mirror scope to family products (reusable utility)
    await mirrorScopeToFamilyProducts(itemId, scopeWithFlag, 'feature_exclusion_scopes', productId, company_id, parentProductId);
  }, [productId, company_id, keyFeatures, setFeatureExclusionScope, parentProductId, familyProductIds]);

  // Wrap component scope change with propagation: copy component to included devices & mirror scope
  // itemId is now the component's database ID (not name) for unique scope per component
  const handleComponentScopeChange = useCallback(async (itemId: string, newScope: import('@/hooks/useInheritanceExclusion').ItemExclusionScope) => {
    const scopeWithFlag = { ...newScope, isManualGroup: true };
    await setComponentExclusionScope(itemId, scopeWithFlag);

    // Look up the component name for cross-product operations
    const sourceComp = dbComponents.find(c => c.id === itemId);
    const compName = sourceComp?.name || itemId;

    // Cascade exclusions to descendant components by ID (children can't have wider scope than parent)
    const parentExcludedIds = newScope.excludedProductIds || [];
    const cascadedScopes: Array<{ id: string; name: string; scope: import('@/hooks/useInheritanceExclusion').ItemExclusionScope }> = [];
    if (parentExcludedIds.length > 0 && dbComponents.length > 0) {
      const findDescendantIds = (parentId: string): string[] => {
        const children = dbComponents.filter(c => c.parent_ids?.includes(parentId));
        const ids: string[] = [];
        for (const child of children) {
          ids.push(child.id);
          ids.push(...findDescendantIds(child.id));
        }
        return ids;
      };

      for (const descId of findDescendantIds(itemId)) {
        // Check scope by ID first, fall back to name (backward compat)
        const descComp = dbComponents.find(c => c.id === descId);
        let childScope = getComponentExclusionScope(descId);
        if (!childScope.excludedProductIds?.length && !(childScope as any).isManualGroup && descComp) {
          childScope = getComponentExclusionScope(descComp.name);
        }
        const childExcluded = childScope.excludedProductIds || [];
        const missingIds = parentExcludedIds.filter(id => !childExcluded.includes(id));
        if (missingIds.length > 0) {
          const updatedChildScope = {
            ...childScope,
            excludedProductIds: [...childExcluded, ...missingIds],
            isManualGroup: true,
          };
          await setComponentExclusionScope(descId, updatedChildScope);
          cascadedScopes.push({ id: descId, name: descComp?.name || descId, scope: updatedChildScope });
        }
      }
    }

    if (!company_id || !productId) return;

    const newExcluded = new Set(newScope.excludedProductIds || []);

    // Copy component to included family products that don't have it yet, including hierarchy
    const includedOtherIds = (familyProductIds || []).filter(id => id !== productId && !newExcluded.has(id));
    if (includedOtherIds.length > 0) {
      // Get ALL source components and hierarchy for this product
      const { data: allSourceComps } = await supabase
        .from('device_components')
        .select('*')
        .eq('product_id', productId);
      const sourceCompIds = (allSourceComps || []).map(c => c.id);
      const { data: sourceHierarchy } = sourceCompIds.length > 0
        ? await supabase.from('device_component_hierarchy').select('parent_id, child_id').in('child_id', sourceCompIds)
        : { data: [] };

      // Fetch master device's component names to avoid duplicating "Shared" components
      const masterCompNames = new Set<string>();
      if (masterDeviceId) {
        const { data: masterComps } = await supabase
          .from('device_components')
          .select('name')
          .eq('product_id', masterDeviceId);
        for (const mc of (masterComps || [])) masterCompNames.add(mc.name);
      }

      for (const targetId of includedOtherIds) {
        // Get existing components on target (local + check master names)
        const { data: targetComps } = await supabase
          .from('device_components')
          .select('id, name')
          .eq('product_id', targetId);
        const targetByName = new Map((targetComps || []).map(c => [c.name, c]));

        // Create missing components (skip ones that exist locally OR on master as "Shared")
        const sourceIdToTargetId = new Map<string, string>();
        for (const sc of (allSourceComps || [])) {
          if (targetByName.has(sc.name) || masterCompNames.has(sc.name)) {
            const existing = targetByName.get(sc.name);
            if (existing) sourceIdToTargetId.set(sc.id, existing.id);
            continue;
          } else {
            const { data: newComp } = await supabase.from('device_components').insert({
              product_id: targetId,
              company_id: company_id,
              name: sc.name,
              description: sc.description,
              component_type: sc.component_type,
              sort_order: sc.sort_order,
              part_number: sc.part_number,
              is_root_level: sc.is_root_level,
            }).select('id').single();
            if (newComp) {
              sourceIdToTargetId.set(sc.id, newComp.id);
            }
          }
        }

        // Copy hierarchy relationships
        if (sourceHierarchy && sourceHierarchy.length > 0) {
          const targetCompIds = [...sourceIdToTargetId.values()];
          const { data: existingHierarchy } = targetCompIds.length > 0
            ? await supabase.from('device_component_hierarchy').select('parent_id, child_id').in('child_id', targetCompIds)
            : { data: [] };
          const existingSet = new Set((existingHierarchy || []).map((h: any) => `${h.parent_id}:${h.child_id}`));

          for (const link of sourceHierarchy) {
            const targetParentId = sourceIdToTargetId.get((link as any).parent_id);
            const targetChildId = sourceIdToTargetId.get((link as any).child_id);
            if (targetParentId && targetChildId && !existingSet.has(`${targetParentId}:${targetChildId}`)) {
              await supabase.from('device_component_hierarchy').insert({
                parent_id: targetParentId,
                child_id: targetChildId,
              });
            }
          }
        }
      }
    }

    // Mirror scope to family products using component IDs (not names)
    // Each family product has its own component IDs, so we map source→target by name
    const otherFamilyIds = (familyProductIds || []).filter(id => id !== productId);
    if (otherFamilyIds.length > 0) {
      // Fetch components for all family products to find matching ones by name
      const { data: familyComps } = await supabase
        .from('device_components')
        .select('id, product_id, name')
        .in('product_id', otherFamilyIds);

      // Build name→id mapping per product
      const compsByProduct = new Map<string, Map<string, string>>();
      for (const fc of (familyComps || [])) {
        if (!compsByProduct.has(fc.product_id)) compsByProduct.set(fc.product_id, new Map());
        if (!compsByProduct.get(fc.product_id)!.has(fc.name)) {
          compsByProduct.get(fc.product_id)!.set(fc.name, fc.id);
        }
      }

      // Fetch scope overrides for all family products
      const { data: familyProductRows } = await supabase
        .from('products')
        .select('id, field_scope_overrides')
        .in('id', otherFamilyIds);

      await Promise.all((familyProductRows || []).map(async (tp: any) => {
        const overrides = { ...((tp.field_scope_overrides as Record<string, any>) || {}) };
        const scopes = { ...(overrides['component_exclusion_scopes'] || {}) };
        const targetNameToId = compsByProduct.get(tp.id) || new Map();

        // Mirror main component scope under target's component ID
        const targetCompId = targetNameToId.get(compName);
        if (targetCompId) {
          scopes[targetCompId] = scopeWithFlag;
          // Clean up old name-based entry
          if (scopes[compName]) delete scopes[compName];
        } else {
          scopes[compName] = scopeWithFlag; // fallback if component not yet on target
        }

        // Mirror cascaded child scopes
        for (const cs of cascadedScopes) {
          const targetChildId = targetNameToId.get(cs.name);
          if (targetChildId) {
            scopes[targetChildId] = cs.scope;
            if (scopes[cs.name]) delete scopes[cs.name];
          } else {
            scopes[cs.name] = cs.scope;
          }
        }

        overrides['component_exclusion_scopes'] = scopes;
        return supabase.from('products')
          .update({ field_scope_overrides: overrides } as any)
          .eq('id', tp.id);
      }));
    }
  }, [productId, company_id, setComponentExclusionScope, getComponentExclusionScope, dbComponents, parentProductId, familyProductIds, masterDeviceId]);

  // Backward compat: derive simple excluded arrays for rendering
  const excludedFeatures = useMemo(() => {
    return keyFeatures.filter(f => isFeatureExcluded(f.name, productId)).map(f => f.name);
  }, [keyFeatures, isFeatureExcluded]);

  const excludedComponents: string[] = []; // now managed per-item via scope

  // --- Feature CRUD (local only) ---
  const handleRemoveFeature = (index: number) => {
    if (onKeyFeaturesChange) {
      onKeyFeaturesChange(keyFeatures.filter((_, i) => i !== index));
    }
  };

  const handleSaveFeature = (feature: KeyFeature) => {
    if (!onKeyFeaturesChange) return;
    let updatedFeatures: KeyFeature[];
    if (editingFeatureIndex !== null) {
      // Preserve existing ID on edit
      const existingId = keyFeatures[editingFeatureIndex]?.id;
      updatedFeatures = keyFeatures.map((f, i) => i === editingFeatureIndex ? { ...feature, id: existingId || feature.id } : f);
      setEditingFeatureIndex(null);
    } else {
      // Assign a new stable ID
      const newId = generateFeatureId(keyFeatures, model_reference, productName);
      updatedFeatures = [...keyFeatures, { ...feature, id: newId }];
    }
    onKeyFeaturesChange(updatedFeatures);

    // Sync feature_user_needs junction table
    if (productId && feature.linkedUserNeedIds) {
      const featureName = feature.name;
      (async () => {
        // Delete existing links for this feature
        await supabase
          .from('feature_user_needs')
          .delete()
          .match({ product_id: productId, feature_name: featureName });
        // Insert new links
        if (feature.linkedUserNeedIds!.length > 0) {
          await supabase.from('feature_user_needs').insert(
            feature.linkedUserNeedIds!.map(unId => ({
              product_id: productId,
              feature_name: featureName,
              user_need_id: unId,
            }))
          );
        }
      })();
    }

    // Sync device_component_features junction table
    syncComponentFeaturesJunction(updatedFeatures, dbComponents, productId);


    // Bidirectional sync: update components' linkedFeatureNames to match
    if (onDeviceComponentsChange) {
      const featureName = feature.name;
      const linkedComps = feature.linkedComponentNames || [];
      const updatedComponents = deviceComponents.map(comp => {
        const currentLinks = comp.linkedFeatureNames || [];
        const shouldBeLinked = linkedComps.includes(comp.name);
        const isLinked = currentLinks.includes(featureName);
        if (shouldBeLinked && !isLinked) {
          return { ...comp, linkedFeatureNames: [...currentLinks, featureName] };
        } else if (!shouldBeLinked && isLinked) {
          return { ...comp, linkedFeatureNames: currentLinks.filter(n => n !== featureName) };
        }
        return comp;
      });
      if (JSON.stringify(updatedComponents) !== JSON.stringify(deviceComponents)) {
        onDeviceComponentsChange(updatedComponents);
      }
    }
  };

  const handleEditFeature = (index: number) => {
    setEditingFeatureIndex(index);
    setFeatureDialogOpen(true);
  };

  // --- Governance helpers ---
  const getGovIcon = (sectionKey: string) => {
    const gov = getGovernanceSection?.(sectionKey);
    if (gov && gov.status !== 'draft') {
      return (
        <GovernanceBookmark
          status={gov.status}
          designReviewId={gov.design_review_id}
          verdictComment={gov.verdict_comment}
          approvedAt={gov.approved_at}
          productId={productId}
          sectionLabel={sectionKey}
        />
      );
    }
    return <GovernanceBookmark status={null} />;
  };



  const isFieldLinkedOnVariant = (fieldKey: string) =>
    isVariant && getFieldScope?.(fieldKey) === 'product_family' && !!masterDeviceId;

  const isLinkedFeatures = isFieldLinkedOnVariant('features_keyFeatures');
  const isLinkedComponents = isFieldLinkedOnVariant('features_deviceComponents');

  // --- Render a feature row ---
  const renderFeatureRow = (feature: KeyFeature, featureIndex: number, opts: {
    isMasterItem: boolean;
    isExcluded?: boolean;
    scopePopover?: React.ReactNode;
    onEdit?: () => void;
    onRemove?: () => void;
    disabled?: boolean;
  }) => {
    const content = (
      <div
        key={`${opts.isMasterItem ? 'master' : 'local'}-${feature.name}`}
        className={`border rounded-md p-3 ${opts.isExcluded ? 'opacity-40' : 'bg-muted/50'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Badge variant="outline" className="text-xs font-mono shrink-0">
              {feature.id || `FEAT-${String(featureIndex + 1).padStart(3, '0')}`}
            </Badge>
            <span className={`text-sm font-medium truncate ${opts.isExcluded ? 'line-through' : ''}`}>{feature.name}</span>
            {opts.isMasterItem && (
              <Badge variant="outline" className="text-xs shrink-0 w-16 justify-center border-blue-500/40 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30">
                Shared
              </Badge>
            )}
            {!opts.isMasterItem && isLinkedFeatures && (
              <Badge variant="outline" className="text-xs shrink-0 w-16 justify-center border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30">
                Local
              </Badge>
            )}
            {feature.tag && !opts.isExcluded && (
              <Badge variant="outline" className="text-xs shrink-0 border-accent text-accent-foreground bg-accent/20">
                {feature.tag}
              </Badge>
            )}
            {feature.isNovel && !opts.isExcluded && (
              <Badge variant="secondary" className="text-xs shrink-0">
                <Sparkles className="h-3 w-3 mr-0.5" />
                Novel
              </Badge>
            )}
            {!opts.isExcluded && (feature.linkedClinicalBenefits?.length ?? 0) > 0 && (
              <Badge variant="outline" className="text-xs shrink-0">
                {feature.linkedClinicalBenefits!.length} benefit{feature.linkedClinicalBenefits!.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {!opts.isExcluded && (feature.linkedUserNeedIds?.length ?? 0) > 0 && (
              <Badge variant="outline" className="text-xs shrink-0">
                {feature.linkedUserNeedIds!.length} user need{feature.linkedUserNeedIds!.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {!opts.isExcluded && (feature.linkedComponentNames?.length ?? 0) > 0 && (
              <Badge variant="outline" className="text-xs shrink-0">
                {feature.linkedComponentNames!.length} component{feature.linkedComponentNames!.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {opts.scopePopover}
            {!opts.isMasterItem && !opts.disabled && opts.onEdit && (
              <Button variant="ghost" size="sm" onClick={opts.onEdit} className="h-7 w-7 p-0">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {!opts.isMasterItem && !opts.disabled && opts.onRemove && (
              <Button variant="ghost" size="sm" onClick={opts.onRemove} disabled={isLoading} className="h-7 w-7 p-0">
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        {feature.description && !opts.isExcluded && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{feature.description}</p>
        )}
      </div>
    );

    return content;
  };

  // --- Render a component row (DB-backed) ---
  const renderDbComponentRow = (comp: DbDeviceComponent, opts: {
    isMasterItem: boolean;
    isExcluded?: boolean;
    scopePopover?: React.ReactNode;
    onEdit?: () => void;
    onRemove?: () => void;
    disabled?: boolean;
    depth?: number;
    componentIndex?: number;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
  }) => {
    const depth = opts.depth || 0;
    const hasChildren = comp.children && comp.children.length > 0;
    const bomCount = bomItems?.filter(item => item.component_id === comp.id).length || 0;
    const TypeIcon = comp.component_type === 'software' ? Code : comp.component_type === 'sub_assembly' ? Layers : Cpu;
    const typeColors: Record<string, string> = {
      hardware: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800',
      software: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800',
      sub_assembly: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
    };

    const content = (
      <div
        key={`${opts.isMasterItem ? 'master' : 'local'}-${comp.id}`}
        className={`border rounded-lg p-4 ${opts.isExcluded ? 'opacity-40' : ''}`}
        style={{ marginLeft: depth * 24 }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {hasChildren && opts.onToggleExpand && (
                <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={opts.onToggleExpand}>
                  {opts.isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </Button>
              )}
              {!hasChildren && depth > 0 && <div className="w-5" />}
              <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              {opts.componentIndex != null && (
                <Badge variant="outline" className="text-xs font-mono shrink-0">
                  COMP-{String(opts.componentIndex + 1).padStart(3, '0')}
                </Badge>
              )}
              <h4 className={`font-medium ${opts.isExcluded ? 'line-through' : ''}`}>{comp.name}</h4>
              <Badge variant="outline" className={`text-xs ${typeColors[comp.component_type]}`}>
                {comp.component_type === 'sub_assembly' ? 'Sub-Assembly' : comp.component_type.charAt(0).toUpperCase() + comp.component_type.slice(1)}
              </Badge>
              {opts.isMasterItem && (
                <Badge variant="outline" className="text-xs shrink-0 w-16 justify-center border-blue-500/40 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30">
                  Shared
                </Badge>
              )}
              {!opts.isMasterItem && isLinkedComponents && (
                <Badge variant="outline" className="text-xs shrink-0 w-16 justify-center border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30">
                  Local
                </Badge>
              )}
            </div>
            {comp.description && !opts.isExcluded && (
              <p className="text-sm text-muted-foreground mt-1">{comp.description}</p>
            )}
            {!opts.isExcluded && (
              <div className="flex flex-wrap gap-1 mt-2">
                {comp.linked_features?.map(f => (
                  <Badge key={f.id} variant="outline" className="text-xs">{f.feature_name}</Badge>
                ))}
                {bomCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-xs cursor-pointer bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
                    onClick={() => productId && navigate(`/app/product/${productId}/bom`)}
                  >
                    <Package className="h-3 w-3 mr-0.5" />
                    BOM ({bomCount})
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {opts.scopePopover}
            {!opts.isMasterItem && !opts.disabled && opts.onEdit && (
              <Button variant="ghost" size="icon" onClick={opts.onEdit} disabled={isLoading} className="h-8 w-8">
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {!opts.isMasterItem && !opts.disabled && opts.onRemove && (
              <Button variant="ghost" size="icon" onClick={opts.onRemove} disabled={isLoading} className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );

    return content;
  };

  const navigate = useNavigate();

  const syncComponentFeaturesJunction = useCallback((features: KeyFeature[], components: any[], prodId?: string) => {
    if (!prodId || components.length === 0) return;
    (async () => {
      const compToFeatures = new Map<string, string[]>();
      features.forEach(f => {
        (f.linkedComponentNames || []).forEach(cName => {
          if (!compToFeatures.has(cName)) compToFeatures.set(cName, []);
          compToFeatures.get(cName)!.push(f.name);
        });
      });
      let changed = false;
      for (const dbComp of components) {
        const featureNames = compToFeatures.get(dbComp.name) || [];
        const currentFeatures = (dbComp.linked_features || []).map((lf: any) => lf.feature_name).sort();
        const newFeatures = [...featureNames].sort();
        if (JSON.stringify(currentFeatures) !== JSON.stringify(newFeatures)) {
          await DeviceComponentsService.setLinkedFeatures(dbComp.id, featureNames);
          changed = true;
        }
      }
      if (changed) {
        queryClient.invalidateQueries({ queryKey: ['device-components', prodId] });
      }
    })();
  }, [queryClient]);

  const reparentMutation = useUpdateDeviceComponent(productId || '');

  const handleComponentDrop = useCallback(async (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    const enhancedDragMatch = draggableId.match(/^drag-comp-id__(.+?)__node__.+?(?:__name__(.+))?$/);
    const draggedCompId = enhancedDragMatch?.[1] ?? (
      draggableId.startsWith('drag-comp-id-') ? draggableId.replace('drag-comp-id-', '') : null
    );
    const parsedComponentName = enhancedDragMatch?.[2] ? decodeURIComponent(enhancedDragMatch[2]) : null;

    const draggedComp = draggedCompId
      ? dbComponents.find(c => c.id === draggedCompId)
      : undefined;
    const componentName = parsedComponentName ?? draggedComp?.name ?? (draggableId.startsWith('drag-comp-') ? draggableId.replace('drag-comp-', '') : '');
    if (!componentName) return;

    const enhancedTargetMatch = destination.droppableId.match(/^comp-drop-id__(.+?)__node__/);
    const targetCompId = enhancedTargetMatch?.[1] ?? (
      destination.droppableId.startsWith('comp-drop-') ? destination.droppableId.replace('comp-drop-', '') : null
    );

    // Handle drop on another component (move component under the target parent)
    if (targetCompId) {
      if (!draggedComp) {
        toast.error('Could not identify dragged component');
        return;
      }

      const targetComp = dbComponents.find(c => c.id === targetCompId);
      if (draggedComp.id === targetCompId) return;

      const currentParentIds = draggedComp.parent_ids || [];
      if (currentParentIds.length === 1 && currentParentIds[0] === targetCompId) {
        toast.info(`${draggedComp.name} is already under ${targetComp?.name || 'this parent'}`);
        return;
      }

      const nextParentIds = [targetCompId];

      // Move immediately in UI, then persist
      queryClient.setQueryData(['device-components', productId], (prev: any) => {
        if (!Array.isArray(prev)) return prev;
        return prev.map((component: any) =>
          component.id === draggedComp.id
            ? {
                ...component,
                parent_ids: nextParentIds,
                parent_id: targetCompId,
                is_root_level: false,
              }
            : component
        );
      });

      try {
        await DeviceComponentsService.update(draggedComp.id, { parent_ids: nextParentIds });
        queryClient.invalidateQueries({ queryKey: ['device-components', productId] });
        toast.success(`Moved ${draggedComp.name} under ${targetComp?.name || 'parent'}`);
      } catch {
        queryClient.invalidateQueries({ queryKey: ['device-components', productId] });
        toast.error('Failed to move component');
      }
      return;
    }

    if (!destination.droppableId.startsWith('feature-drop-')) return;

    if (isLinkedFeatures) {
      // Check if dropped on a local feature (droppableId = "feature-drop-local-{index}")
      if (destination.droppableId.startsWith('feature-drop-local-')) {
        const localIndex = parseInt(destination.droppableId.replace('feature-drop-local-', ''), 10);
        const feature = keyFeatures[localIndex];
        if (!feature) return;
        const existing = feature.linkedComponentNames || [];
        if (existing.includes(componentName)) return;
        const updated = keyFeatures.map((f, i) =>
          i === localIndex ? { ...f, linkedComponentNames: [...existing, componentName] } : f
        );
        onKeyFeaturesChange?.(updated);
        syncComponentFeaturesJunction(updated, dbComponents, productId);
        return;
      }
      // Dropped on a master feature (droppableId = "feature-drop-{masterIdx}")
      const masterIdx = parseInt(destination.droppableId.replace('feature-drop-', ''), 10);
      const masterFeature = masterKeyFeatures[masterIdx];
      if (!masterFeature) return;
      const localIdx = keyFeatures.findIndex(f => f.name === masterFeature.name);
      if (localIdx >= 0) {
        const existing = keyFeatures[localIdx].linkedComponentNames || [];
        if (existing.includes(componentName)) return;
        const updated = keyFeatures.map((f, i) =>
          i === localIdx ? { ...f, linkedComponentNames: [...existing, componentName] } : f
        );
        onKeyFeaturesChange?.(updated);
        syncComponentFeaturesJunction(updated, dbComponents, productId);
      }
      return;
    } else {
      // Non-variant path: index maps directly to keyFeatures
      const dropIndex = parseInt(destination.droppableId.replace('feature-drop-', ''), 10);
      const feature = keyFeatures[dropIndex];
      if (!feature) return;
      const existing = feature.linkedComponentNames || [];
      if (existing.includes(componentName)) return;
      const updated = keyFeatures.map((f, i) =>
        i === dropIndex ? { ...f, linkedComponentNames: [...existing, componentName] } : f
      );
      onKeyFeaturesChange?.(updated);
      syncComponentFeaturesJunction(updated, dbComponents, productId);
    }
  }, [keyFeatures, masterKeyFeatures, isLinkedFeatures, onKeyFeaturesChange, dbComponents, productId, syncComponentFeaturesJunction, reparentMutation]);

  const [panelLayout, setPanelLayout] = useState<'features' | 'even' | 'components'>('even');
  const featuresPanelRef = React.useRef<any>(null);
  const componentsPanelRef = React.useRef<any>(null);

  const applyLayout = useCallback((layout: 'features' | 'even' | 'components') => {
    setPanelLayout(layout);
    if (layout === 'features') {
      featuresPanelRef.current?.resize(65);
    } else if (layout === 'components') {
      featuresPanelRef.current?.resize(35);
    } else {
      featuresPanelRef.current?.resize(50);
    }
  }, []);

  return (
    <DragDropContext onDragEnd={handleComponentDrop}>
    <div className="space-y-2">
      {/* Preset layout buttons */}
      <div className="flex items-center justify-end gap-1">
        <span className="text-xs text-muted-foreground mr-1">Layout:</span>
        {([
          { key: 'features' as const, label: 'Features ↔' },
          { key: 'even' as const, label: '50 / 50' },
          { key: 'components' as const, label: '↔ Components' },
        ]).map(({ key, label }) => (
          <Button
            key={key}
            variant={panelLayout === key ? 'default' : 'outline'}
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => applyLayout(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[400px] rounded-lg"
        onLayout={(sizes: number[]) => {
          if (sizes[0] > 55) setPanelLayout('features');
          else if (sizes[1] > 55) setPanelLayout('components');
          else setPanelLayout('even');
        }}
      >
      <ResizablePanel ref={featuresPanelRef} defaultSize={50} minSize={25}>
      <div className="space-y-4 pr-3">
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm font-medium">{lang('deviceBasics.definition.keyFeaturesLabel')}</Label>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFeatureImportOpen(true)}
              disabled={isLoading}
            >
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setEditingFeatureIndex(null); setFeatureDialogOpen(true); }}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Feature
            </Button>
            {getGovIcon('features_keyFeatures')}
          </div>
        </div>

        <div className="space-y-2">
          {!featureExclusionsLoaded ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Master features (shown on variant in linked mode) */}
              {isLinkedFeatures && masterKeyFeatures.filter(f => !isFeatureExcluded(f.name, productId)).map((feature, masterIdx) => (
                <Droppable key={`master-drop-${masterIdx}`} droppableId={`feature-drop-${masterIdx}`}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`transition-colors rounded-md ${snapshot.isDraggingOver ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}
                    >
                      {renderFeatureRow(feature, masterIdx, {
                        isMasterItem: true,
                        isExcluded: false,
                        scopePopover: company_id ? (
                          <InheritanceExclusionPopover
                            companyId={company_id}
                            currentProductId={productId!}
                            itemId={feature.name}
                            exclusionScope={getFeatureExclusionScope(feature.name)}
                            onScopeChange={handleFeatureScopeChange}
                            defaultCurrentDeviceOnly
                            familyProductIds={familyProductIds}
                          />
                        ) : undefined,
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}

              {/* Local features */}
              {keyFeatures.map((feature, index) => {
                if (isLinkedFeatures && masterKeyFeatures.some(mf => mf.name === feature.name)) return null;
                if (isFeatureExcluded(feature.name, productId)) return null;
                const displayIndex = isLinkedFeatures ? masterKeyFeatures.length + index : index;
                return (
                  <Droppable key={`local-drop-${index}`} droppableId={`feature-drop-local-${index}`}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`transition-colors rounded-md ${snapshot.isDraggingOver ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}
                      >
                        {renderFeatureRow(feature, displayIndex, {
                          isMasterItem: false,
                          isExcluded: false,
                          scopePopover: company_id && productId ? (
                            <InheritanceExclusionPopover
                              companyId={company_id}
                              currentProductId={productId}
                              itemId={feature.name}
                              exclusionScope={getFeatureExclusionScope(feature.name)}
                              onScopeChange={handleFeatureScopeChange}
                              defaultCurrentDeviceOnly
                              familyProductIds={familyProductIds}
                            />
                          ) : undefined,
                          onEdit: () => handleEditFeature(index),
                          onRemove: () => handleRemoveFeature(index),
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                );
              })}

              {keyFeatures.length === 0 && (!isLinkedFeatures || masterKeyFeatures.length === 0) && (
                <p className="text-muted-foreground text-center py-8">
                  No key features defined yet. Click "Add Feature" to define the key features of your device.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <AddKeyFeatureDialog
        open={featureDialogOpen}
        onOpenChange={(open) => { setFeatureDialogOpen(open); if (!open) setEditingFeatureIndex(null); }}
        onSave={handleSaveFeature}
        clinicalBenefits={clinicalBenefits}
        onAddClinicalBenefit={onClinicalBenefitsChange ? (benefit) => {
          if (!clinicalBenefits.includes(benefit)) {
            onClinicalBenefitsChange([...clinicalBenefits, benefit]);
          }
        } : undefined}
        userNeeds={productUserNeeds}
        editingFeature={editingFeatureIndex !== null ? keyFeatures[editingFeatureIndex] : null}
        productId={productId}
        companyId={company_id}
        availableComponents={availableDbComponents}
      />

      <FeatureImportDialog
        open={featureImportOpen}
        onOpenChange={setFeatureImportOpen}
        existingFeatures={keyFeatures}
        onImport={(features) => onKeyFeaturesChange?.(features)}
      />

      </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={50} minSize={25}>
      {/* === Right Column: Device Components === */}
      <div className="space-y-4 pl-3">
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm font-medium">{lang('deviceBasics.definition.componentsLabel')}</Label>
          <div className="flex items-center gap-1">
            {!isLinkedComponents && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setComponentImportOpen(true)}
                  disabled={isLoading || !productId || !company_id}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Import
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setComponentAddDialogOpen(true)}
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Component
                </Button>
              </>
            )}
            {isLinkedComponents && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setComponentAddDialogOpen(true)}
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Component
              </Button>
            )}
            {getGovIcon('features_deviceComponents')}
          </div>
        </div>




        {isLinkedComponents ? (
          <SelectiveComponentsSectionDb
            productId={productId}
            companyId={company_id}
            masterProductId={masterDeviceId}
            getComponentExclusionScope={getComponentExclusionScope}
            setComponentExclusionScope={handleComponentScopeChange}
            isComponentExcluded={isComponentExcluded}
            isLoading={isLoading}
            exclusionsLoaded={componentExclusionsLoaded}
            renderComponentRow={renderDbComponentRow}
            addDialogOpen={componentAddDialogOpen}
            onAddDialogOpenChange={setComponentAddDialogOpen}
            availableFeatures={[
              ...masterKeyFeatures.map(f => ({ name: f.name })),
              ...keyFeatures.filter(f => !masterKeyFeatures.some(mf => mf.name === f.name)).map(f => ({ name: f.name })),
            ]}
            bomItems={bomItems || []}
            familyProductIds={familyProductIds}
          />
        ) : (
          <DeviceComponentsSection
            productId={productId}
            companyId={company_id}
            isLoading={isLoading || !componentExclusionsLoaded}
            availableFeatures={keyFeatures.map(f => ({ name: f.name }))}
            bomItems={bomItems || []}
            hideCardHeader
            enableDragToLink
            addDialogOpen={componentAddDialogOpen}
            onAddDialogOpenChange={setComponentAddDialogOpen}
            getComponentExclusionScope={getComponentExclusionScope}
            setComponentExclusionScope={handleComponentScopeChange}
            isComponentExcluded={isComponentExcluded}
            familyProductIds={familyProductIds}
          />
        )}
      </div>

      </div>
      </ResizablePanel>
      </ResizablePanelGroup>

      {productId && company_id && (
        <ComponentImportDialog
          open={componentImportOpen}
          onOpenChange={setComponentImportOpen}
          productId={productId}
          companyId={company_id}
        />
      )}
    </div>
    </DragDropContext>
  );
}

// =====================================================================
// DB-backed SelectiveComponentsSection for variant products
// =====================================================================

const COMPONENT_TYPE_OPTIONS = [
  { value: 'hardware', label: 'Hardware', icon: Cpu },
  { value: 'software', label: 'Software', icon: Code },
  { value: 'sub_assembly', label: 'Sub-Assembly', icon: Layers },
] as const;

function SelectiveComponentsSectionDb({
  productId,
  companyId,
  masterProductId,
  getComponentExclusionScope,
  setComponentExclusionScope,
  isComponentExcluded,
  isLoading: externalLoading,
  exclusionsLoaded = true,
  renderComponentRow,
  addDialogOpen,
  onAddDialogOpenChange,
  availableFeatures = [],
  bomItems = [],
  familyProductIds,
}: {
  productId?: string;
  companyId?: string;
  masterProductId?: string;
  getComponentExclusionScope: (itemId: string) => import('@/hooks/useInheritanceExclusion').ItemExclusionScope;
  setComponentExclusionScope: (itemId: string, scope: import('@/hooks/useInheritanceExclusion').ItemExclusionScope) => void;
  isComponentExcluded: (itemId: string, targetProductId?: string) => boolean;
  isLoading?: boolean;
  exclusionsLoaded?: boolean;
  renderComponentRow: (comp: DbDeviceComponent, opts: any) => React.ReactNode;
  addDialogOpen: boolean;
  onAddDialogOpenChange: (open: boolean) => void;
  availableFeatures?: { name: string }[];
  bomItems?: import('@/types/bom').BomItem[];
  familyProductIds?: string[];
}) {
  // Fetch master components
  const { tree: masterTree, isLoading: masterLoading } = useDeviceComponentTree(masterProductId);
  // Fetch variant-local components
  const { data: localFlat, tree: localTree, isLoading: localLoading } = useDeviceComponentTree(productId);

  const createComponent = useCreateDeviceComponent(productId || '');
  const updateComponent = useUpdateDeviceComponent(productId || '');
  const deleteComponent = useDeleteDeviceComponent(productId || '');
  const setFeatures = useSetComponentFeatures(productId || '');

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) => setExpandedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // Auto-expand all components that have children on first load
  useEffect(() => {
    const idsWithChildren = new Set<string>();
    const collect = (nodes: DbDeviceComponent[]) => {
      nodes.forEach(n => {
        if (n.children?.length) {
          idsWithChildren.add(n.id);
          collect(n.children);
        }
      });
    };
    collect(masterTree);
    collect(localTree);
    if (idsWithChildren.size > 0) {
      setExpandedIds(prev => prev.size === 0 ? idsWithChildren : prev);
    }
  }, [masterTree, localTree]);

  const [editingComponent, setEditingComponent] = useState<DbDeviceComponent | null>(null);
  const [componentName, setComponentName] = useState('');
  const [componentDescription, setComponentDescription] = useState('');
  const [componentType, setComponentType] = useState<'hardware' | 'software' | 'sub_assembly'>('hardware');
  const [parentId, setParentId] = useState<string | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [partNumber, setPartNumber] = useState('');
  

  const dialogOpen = addDialogOpen || editingComponent !== null;
  const loading = externalLoading || masterLoading || localLoading || !exclusionsLoaded;

  const potentialParents = useMemo(() => {
    if (!localFlat) return [];
    if (!editingComponent) return localFlat;
    const excludeIds = new Set<string>();
    const collectDescendants = (id: string) => {
      excludeIds.add(id);
      localFlat.filter(c => c.parent_id === id).forEach(c => collectDescendants(c.id));
    };
    collectDescendants(editingComponent.id);
    return localFlat.filter(c => !excludeIds.has(c.id));
  }, [localFlat, editingComponent]);

  const handleAddOrUpdate = async () => {
    if (!componentName.trim() || !productId || !companyId) return;

    if (editingComponent) {
      await updateComponent.mutateAsync({
        id: editingComponent.id,
        updates: {
          name: componentName.trim(),
          description: componentDescription.trim(),
          component_type: componentType,
          parent_id: parentId,
          part_number: partNumber.trim() || null,
        },
      });
      await setFeatures.mutateAsync({ componentId: editingComponent.id, featureNames: selectedFeatures });
    } else {
      const newComp = await createComponent.mutateAsync({
        product_id: productId,
        company_id: companyId,
        name: componentName.trim(),
        description: componentDescription.trim(),
        component_type: componentType,
        parent_id: parentId,
        part_number: partNumber.trim() || null,
        
      });
      if (selectedFeatures.length > 0) {
        await setFeatures.mutateAsync({ componentId: newComp.id, featureNames: selectedFeatures });
      }
    }
    resetForm();
  };

  const handleEdit = (comp: DbDeviceComponent) => {
    setComponentName(comp.name);
    setComponentDescription(comp.description || '');
    setComponentType(comp.component_type);
    setParentId(comp.parent_id);
    setSelectedFeatures(comp.linked_features?.map(f => f.feature_name) || []);
    setPartNumber((comp as any).part_number || '');
    
    setEditingComponent(comp);
  };

  const confirmAction = useConfirm();

  const handleRemove = async (id: string) => {
    const confirmed = await confirmAction({ title: 'Remove component', description: 'Are you sure you want to remove this component? This action cannot be undone.', confirmLabel: 'Remove', variant: 'destructive' });
    if (!confirmed) return;
    await deleteComponent.mutateAsync(id);
  };

  const resetForm = () => {
    setComponentName('');
    setComponentDescription('');
    setComponentType('hardware');
    setParentId(null);
    setSelectedFeatures([]);
    setPartNumber('');
    
    setEditingComponent(null);
    onAddDialogOpenChange(false);
  };

  // Flatten tree fully for COMP-XXX IDs (stable, all components)
  const flattenTree = (nodes: DbDeviceComponent[]): DbDeviceComponent[] => {
    const result: DbDeviceComponent[] = [];
    const walk = (items: DbDeviceComponent[]) => {
      items.forEach(c => { result.push(c); if (c.children?.length) walk(c.children); });
    };
    walk(nodes);
    return result;
  };

  const allFlatComponents = useMemo(() => [
    ...flattenTree(masterTree),
    ...flattenTree(localTree),
  ], [masterTree, localTree]);

  // Build stable index map for COMP-XXX IDs
  const componentIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    allFlatComponents.forEach((c, i) => map.set(c.id, i));
    return map;
  }, [allFlatComponents]);

  // Flatten tree respecting expansion state for sequential drag indices
  const visibleFlatComponents = useMemo(() => {
    const result: DbDeviceComponent[] = [];
    const walk = (items: DbDeviceComponent[]) => {
      items.forEach(c => {
        result.push(c);
        if (c.children?.length && expandedIds.has(c.id)) walk(c.children);
      });
    };
    walk(masterTree);
    walk(localTree);
    return result;
  }, [masterTree, localTree, expandedIds]);

  // Render tree recursively with Draggable wrappers
  const renderTree = (nodes: DbDeviceComponent[], isMaster: boolean, depth = 0, pathPrefix = 'root') => {
    return nodes.map((comp, nodeIndex) => {
      const nodePath = `${pathPrefix}-${nodeIndex}`;
      const dragIndex = visibleFlatComponents.indexOf(comp);
      // Hide components excluded from this device's scope
      if (isComponentExcluded(comp.name, productId)) return null;
      return (
        <React.Fragment key={`${comp.id}-${nodePath}`}>
          <Draggable draggableId={`drag-comp-id__${comp.id}__node__${nodePath}__name__${encodeURIComponent(comp.name)}`} index={dragIndex}>
            {(dragProvided) => (
              <div
                ref={dragProvided.innerRef}
                {...dragProvided.draggableProps}
              >
                <div className="flex items-center gap-1">
                  <div {...dragProvided.dragHandleProps} className="cursor-grab shrink-0 py-2 px-0.5 text-muted-foreground hover:text-foreground">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {renderComponentRow(comp, {
                      isMasterItem: isMaster,
                      isExcluded: false,
                      componentIndex: componentIndexMap.get(comp.id),
                      isExpanded: expandedIds.has(comp.id),
                      onToggleExpand: (comp.children && comp.children.length > 0) ? () => toggleExpand(comp.id) : undefined,
                      scopePopover: companyId && productId ? (
                        <InheritanceExclusionPopover
                          companyId={companyId}
                          currentProductId={productId}
                          itemId={comp.name}
                          exclusionScope={getComponentExclusionScope(comp.name)}
                          onScopeChange={setComponentExclusionScope}
                          defaultCurrentDeviceOnly
                          familyProductIds={familyProductIds}
                        />
                      ) : undefined,
                      onEdit: !isMaster ? () => handleEdit(comp) : undefined,
                      onRemove: !isMaster ? () => handleRemove(comp.id) : undefined,
                      depth,
                    })}
                  </div>
                </div>
              </div>
            )}
          </Draggable>
          {comp.children && comp.children.length > 0 && expandedIds.has(comp.id) && renderTree(comp.children, isMaster, depth + 1, nodePath)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <Droppable droppableId="components-source" isDropDisabled>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {/* Master components with toggle */}
                {renderTree(masterTree, true, 0, 'master')}

                {/* Local-only components */}
                {renderTree(localTree, false, 0, 'local')}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {masterTree.length === 0 && localTree.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              No components added yet. Click "Add Component" to define the physical or software components of your device.
            </p>
          )}
        </>
      )}

      <p className="text-xs text-muted-foreground">
        Materials, costs, and supplier details are managed in the Bill of Materials (BOM) module.
      </p>

      {/* Dialog for adding/editing local components */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingComponent ? 'Edit Component' : 'Add New Component'}
              {editingComponent && (
                <Badge variant="outline" className="text-xs font-mono">
                  COMP-{String((componentIndexMap.get(editingComponent.id) ?? 0) + 1).padStart(3, '0')}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sel-comp-name">Component Name</Label>
              <Input id="sel-comp-name" value={componentName} onChange={(e) => setComponentName(e.target.value)} placeholder="e.g., Outer Casing, Sensor Unit" />
            </div>
            <div>
              <Label htmlFor="sel-comp-desc">Description</Label>
              <Textarea id="sel-comp-desc" value={componentDescription} onChange={(e) => setComponentDescription(e.target.value)} placeholder="Describe the component's function" className="min-h-[80px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Component Type</Label>
                <Select value={componentType} onValueChange={v => setComponentType(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMPONENT_TYPE_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Parent Component</Label>
                <Select value={parentId || 'none'} onValueChange={v => setParentId(v === 'none' ? null : v)}>
                  <SelectTrigger><SelectValue placeholder="None (top-level)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (top-level)</SelectItem>
                    {potentialParents.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sel-part-number">BOM Part Number</Label>
                <Select value={partNumber || 'none'} onValueChange={v => setPartNumber(v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Select BOM item..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(bomItems || []).map(item => (
                      <SelectItem key={item.id} value={item.internal_part_number || item.item_number}>
                        {item.internal_part_number || item.item_number} — {item.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sm">
                Linked Features
                <span className="ml-1 text-muted-foreground text-xs">(ISO 13485 §7.3)</span>
              </Label>
              {availableFeatures.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {availableFeatures.map(feat => (
                    <Badge
                      key={feat.name}
                      variant={selectedFeatures.includes(feat.name) ? 'default' : 'outline'}
                      className="cursor-pointer select-none"
                      onClick={() => setSelectedFeatures(prev =>
                        prev.includes(feat.name) ? prev.filter(n => n !== feat.name) : [...prev, feat.name]
                      )}
                    >
                      {feat.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">No features defined yet.</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleAddOrUpdate} disabled={!componentName.trim() || createComponent.isPending || updateComponent.isPending}>
                {editingComponent ? 'Update' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
