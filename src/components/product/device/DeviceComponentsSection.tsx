import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { InheritanceExclusionPopover } from '@/components/shared/InheritanceExclusionPopover';
import { ItemExclusionScope } from '@/hooks/useInheritanceExclusion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Loader2, Pencil, Package, Search, ShieldCheck, ChevronRight, ChevronDown, Cpu, Code, Layers, Upload, GripVertical } from "lucide-react";
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/confirm-dialog';
import type { BomItem } from '@/types/bom';
import {
  useDeviceComponents,
  useDeviceComponentTree,
  useCreateDeviceComponent,
  useUpdateDeviceComponent,
  useDeleteDeviceComponent,
  useSetComponentFeatures,
} from '@/hooks/useDeviceComponents';
import type { DbDeviceComponent } from '@/services/deviceComponentsService';
import { ComponentImportDialog } from './ComponentImportDialog';

interface AvailableFeature {
  name: string;
}

interface DeviceComponentsSectionProps {
  productId?: string;
  companyId?: string;
  isLoading?: boolean;
  availableFeatures?: AvailableFeature[];
  bomItems?: BomItem[];
  hideCardHeader?: boolean;
  onImportOpen?: () => void;
  onAddOpen?: () => void;
  addDialogOpen?: boolean;
  onAddDialogOpenChange?: (open: boolean) => void;
  enableDragToLink?: boolean;
  onReparentComponent?: (componentId: string, newParentId: string | null) => void;
  // Scope popover support
  getComponentExclusionScope?: (itemId: string) => ItemExclusionScope;
  setComponentExclusionScope?: (itemId: string, scope: ItemExclusionScope) => void;
  isComponentExcluded?: (itemId: string, targetProductId?: string) => boolean;
  // Legacy props kept for backward compat but ignored
  deviceComponents?: any[];
  onDeviceComponentsChange?: (components: any[]) => void;
  familyProductIds?: string[];
}

const COMPONENT_TYPE_OPTIONS = [
  { value: 'hardware', label: 'Hardware', icon: Cpu },
  { value: 'software', label: 'Software', icon: Code },
  { value: 'sub_assembly', label: 'Sub-Assembly', icon: Layers },
] as const;

const COMPONENT_TYPE_COLORS: Record<string, string> = {
  hardware: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800',
  software: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800',
  sub_assembly: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
};

export function DeviceComponentsSection({
  productId,
  companyId,
  isLoading: externalLoading = false,
  availableFeatures = [],
  bomItems = [],
  hideCardHeader = false,
  onImportOpen,
  onAddOpen,
  enableDragToLink = false,
  getComponentExclusionScope,
  setComponentExclusionScope,
  isComponentExcluded,
  addDialogOpen: externalAddOpen,
  onAddDialogOpenChange: externalOnAddDialogOpenChange,
  onReparentComponent,
  familyProductIds,
}: DeviceComponentsSectionProps) {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<DbDeviceComponent | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Form state
  const [componentName, setComponentName] = useState('');
  const [componentDescription, setComponentDescription] = useState('');
  const [componentType, setComponentType] = useState<'hardware' | 'software' | 'sub_assembly'>('hardware');
  const [parentIds, setParentIds] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [partNumber, setPartNumber] = useState('');
  

  // DB hooks
  const { data: flatComponents, isLoading: dbLoading, tree } = useDeviceComponentTree(productId);
console.log("[sdv vg] ", flatComponents);
  // Auto-flag sub_assembly when component has both parents and children
  useEffect(() => {
    if (editingComponent && parentIds.length > 0 && flatComponents) {
      const hasChildren = flatComponents.some(c => c.parent_ids?.includes(editingComponent.id));
      if (hasChildren) setComponentType('sub_assembly');
    }
  }, [parentIds, editingComponent, flatComponents]);
  const createComponent = useCreateDeviceComponent(productId || '');
  const updateComponent = useUpdateDeviceComponent(productId || '');
  const deleteComponent = useDeleteDeviceComponent(productId || '');
  const setFeatures = useSetComponentFeatures(productId || '');

  const loading = externalLoading || dbLoading;

  // Sync external add dialog open state
  useEffect(() => {
    if (externalAddOpen && !isDialogOpen) {
      setIsDialogOpen(true);
    }
  }, [externalAddOpen]);

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
    collect(tree);
    if (idsWithChildren.size > 0) {
      setExpandedIds(prev => prev.size === 0 ? idsWithChildren : prev);
    }
  }, [tree]);

  // Build a stable index map and depth map from tree-traversal order for COMP-XXX IDs
  const { componentIndexMap, componentDepthMap } = useMemo(() => {
    const indexMap = new Map<string, number>();
    const depthMap = new Map<string, number>();
    const walk = (nodes: DbDeviceComponent[], depth: number) => {
      for (const node of nodes) {
        indexMap.set(node.id, indexMap.size);
        depthMap.set(node.id, depth);
        if (node.children) walk(node.children, depth + 1);
      }
    };
    walk(tree, 0);
    return { componentIndexMap: indexMap, componentDepthMap: depthMap };
  }, [tree]);

  const potentialParents = useMemo(() => {
    if (!flatComponents) return [];
    let candidates = flatComponents;
    if (editingComponent) {
      // Exclude self and all descendants (walk many-to-many hierarchy)
      const excludeIds = new Set<string>();
      const collectDescendants = (id: string) => {
        excludeIds.add(id);
        flatComponents.filter(c => (c.parent_ids || []).includes(id)).forEach(c => collectDescendants(c.id));
      };
      collectDescendants(editingComponent.id);
      candidates = flatComponents.filter(c => !excludeIds.has(c.id));
    }
    // Sort by componentIndexMap order so COMP-XXX IDs are sequential
    return [...candidates].sort((a, b) => {
      const ai = componentIndexMap.get(a.id) ?? 999;
      const bi = componentIndexMap.get(b.id) ?? 999;
      return ai - bi;
    });
  }, [flatComponents, editingComponent, componentIndexMap]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleFeature = (featureName: string) => {
    setSelectedFeatures(prev =>
      prev.includes(featureName) ? prev.filter(n => n !== featureName) : [...prev, featureName]
    );
  };

  const handleAddOrUpdate = async () => {
    if (!componentName.trim() || !productId || !companyId) return;

    // Prevent duplicate component names within the same product
    const trimmedName = componentName.trim();
    const duplicate = flatComponents?.find(
      c => c.name === trimmedName && c.id !== editingComponent?.id
    );
    if (duplicate) {
      toast.error(`A component named "${trimmedName}" already exists. Please use a unique name.`);
      return;
    }

    if (editingComponent) {
      await updateComponent.mutateAsync({
        id: editingComponent.id,
        updates: {
          name: componentName.trim(),
          description: componentDescription.trim(),
          component_type: componentType,
          parent_ids: parentIds,
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
        parent_ids: parentIds,
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
    setParentIds(comp.parent_ids || []);
    setSelectedFeatures(comp.linked_features?.map(f => f.feature_name) || []);
    setPartNumber((comp as any).part_number || '');
    setEditingComponent(comp);
    setIsDialogOpen(true);
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
    setParentIds([]);
    setSelectedFeatures([]);
    setPartNumber('');
    setEditingComponent(null);
    setIsDialogOpen(false);
    externalOnAddDialogOpenChange?.(false);
  };

  // Check if any BOM item is linked to this component
  const getLinkedBomCount = (componentId: string): number => {
    return bomItems.filter(item => item.component_id === componentId).length;
  };

  const hasPatientContact = (componentId: string): boolean => {
    return bomItems.some(item =>
      item.component_id === componentId && item.patient_contact && item.patient_contact !== 'none'
    );
  };


  const createNodeDraggableId = (component: DbDeviceComponent, nodePath: string): string =>
    `drag-comp-id__${component.id}__node__${nodePath}__name__${encodeURIComponent(component.name)}`;

  const createNodeDroppableId = (component: DbDeviceComponent, nodePath: string): string =>
    `comp-drop-id__${component.id}__node__${nodePath}`;

  // Resolve scope by component ID, falling back to component name (backward compat with old data)
  const resolveComponentScope = useCallback((comp: DbDeviceComponent): ItemExclusionScope => {
    if (!getComponentExclusionScope) return {} as ItemExclusionScope;
    const byId = getComponentExclusionScope(comp.id);
    if (byId.excludedProductIds?.length || byId.excludedCategories?.length || (byId as any).isManualGroup) return byId;
    return getComponentExclusionScope(comp.name);
  }, [getComponentExclusionScope]);

  // Get parent's excluded product IDs for constraining child component scope
  const getParentExcludedIds = useCallback((comp: DbDeviceComponent): string[] | undefined => {
    if (!getComponentExclusionScope || !flatComponents) return undefined;
    if (!comp.parent_ids || comp.parent_ids.length === 0) return undefined; // root — no constraint
    const allExcluded = new Set<string>();
    for (const pid of comp.parent_ids) {
      const parentComp = flatComponents.find(c => c.id === pid);
      if (!parentComp) continue;
      const pScope = resolveComponentScope(parentComp);
      for (const id of (pScope.excludedProductIds || [])) {
        allExcluded.add(id);
      }
    }
    return allExcluded.size > 0 ? [...allExcluded] : undefined;
  }, [getComponentExclusionScope, flatComponents, resolveComponentScope]);

  // Render a single component row with indentation
  const renderComponent = (comp: DbDeviceComponent, depth: number = 0, nodePath: string = 'root-0') => {
    const hasChildren = comp.children && comp.children.length > 0;
    const isExpanded = expandedIds.has(comp.id);
    const bomCount = getLinkedBomCount(comp.id);
    const TypeIcon = COMPONENT_TYPE_OPTIONS.find(o => o.value === comp.component_type)?.icon || Cpu;
    const compDisplayId = `COMP-${String((componentIndexMap.get(comp.id) ?? 0) + 1).padStart(3, '0')}`;
    const excludedById = isComponentExcluded?.(comp.id, productId) ?? false;
    const excluded = excludedById || (isComponentExcluded?.(comp.name, productId) ?? false);

    // Option A: hide excluded components entirely on devices that don't have access
    if (excluded) return null;

    const draggableId = createNodeDraggableId(comp, nodePath);
    const droppableId = createNodeDroppableId(comp, nodePath);

    const rowContent = (dragHandleProps?: any) => (
      <div
        className={`border rounded-lg p-4 transition-colors hover:bg-muted/30 ${excluded ? 'opacity-40' : ''}`}
        style={{ marginLeft: depth * 24 }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {enableDragToLink && (
                <div {...(dragHandleProps || {})} className="cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              {hasChildren && (
                <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={() => toggleExpand(comp.id)}>
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </Button>
              )}
              {!hasChildren && depth > 0 && <div className="w-5" />}
              <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <Badge variant="outline" className="text-xs font-mono shrink-0">
                {compDisplayId}
              </Badge>
              <h4 className="font-medium">{comp.name}</h4>
              <Badge variant="outline" className={`text-xs ${COMPONENT_TYPE_COLORS[comp.component_type]}`}>
                {comp.component_type === 'sub_assembly' ? 'Sub-Assembly' : comp.component_type.charAt(0).toUpperCase() + comp.component_type.slice(1)}
              </Badge>
            </div>
            {comp.description && (
              <p className="text-sm text-muted-foreground mt-1" style={{ marginLeft: hasChildren || depth > 0 ? 28 : 0 }}>
                {comp.description}
              </p>
            )}
            <div className="flex flex-wrap gap-1 mt-2" style={{ marginLeft: hasChildren || depth > 0 ? 28 : 0 }}>
              {comp.linked_features?.map(f => (
                <Badge key={f.id} variant="outline" className="text-xs">
                  {f.feature_name}
                </Badge>
              ))}
              {bomCount > 0 && (
                <Badge
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-primary/20 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
                  onClick={() => productId && navigate(`/app/product/${productId}/bom`)}
                >
                  <Package className="h-3 w-3 mr-0.5" />
                  BOM Linked ({bomCount})
                </Badge>
              )}
              {hasPatientContact(comp.id) && (
                <Badge variant="outline" className="text-xs border-orange-400 text-orange-600 dark:text-orange-400 dark:border-orange-600">
                  <ShieldCheck className="h-3 w-3 mr-0.5" />
                  ISO 10993 Contact
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 ml-2">
            {getComponentExclusionScope && setComponentExclusionScope && companyId && productId && (
              <InheritanceExclusionPopover
                companyId={companyId}
                currentProductId={productId}
                itemId={comp.id}
                exclusionScope={resolveComponentScope(comp)}
                onScopeChange={setComponentExclusionScope}
                parentExcludedProductIds={getParentExcludedIds(comp)}
                defaultCurrentDeviceOnly
                familyProductIds={familyProductIds}
              />
            )}
            <Button variant="ghost" size="icon" onClick={() => handleEdit(comp)} disabled={loading} className="h-7 w-7">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleRemove(comp.id)} disabled={loading} className="h-7 w-7 hover:bg-destructive hover:text-destructive-foreground">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );

    return (
      <React.Fragment key={`${comp.id}-${nodePath}`}>
        {enableDragToLink ? (
          <Droppable droppableId={droppableId} isDropDisabled={false}>
            {(dropProvided, dropSnapshot) => (
              <div ref={dropProvided.innerRef} {...dropProvided.droppableProps} style={{ minHeight: 0 }}>
                <Draggable draggableId={draggableId} index={0}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`transition-all duration-150 ${snapshot.isDragging ? 'opacity-80 shadow-lg rounded-lg' : ''} ${dropSnapshot.isDraggingOver && !snapshot.isDragging ? 'bg-primary/10 border-l-4 border-primary rounded-r-lg' : ''}`}
                    >
                      {rowContent(provided.dragHandleProps)}
                      {dropSnapshot.isDraggingOver && !snapshot.isDragging && (
                        <div className="text-xs text-primary font-medium pl-8 pb-1">↳ Drop to link under {compDisplayId}</div>
                      )}
                    </div>
                  )}
                </Draggable>
                <div style={{ display: 'none' }}>{dropProvided.placeholder}</div>
              </div>
            )}
          </Droppable>
        ) : (
          rowContent()
        )}
        {hasChildren && isExpanded && comp.children!.map((child, childIndex) => renderComponent(child, depth + 1, `${nodePath}-${childIndex}`))}
      </React.Fragment>
    );
  };

  return (
    <Card>
      {!hideCardHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onImportOpen ? onImportOpen() : setIsImportOpen(true)} disabled={loading || !productId || !companyId}>
                <Upload className="h-4 w-4 mr-1" /> Import
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={loading} onClick={() => onAddOpen ? onAddOpen() : undefined}>
                    <Plus className="h-4 w-4 mr-1" /> Add Component
                  </Button>
                </DialogTrigger>
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
                    <Label htmlFor="component-name">Component Name</Label>
                    <Input id="component-name" value={componentName} onChange={(e) => setComponentName(e.target.value)} placeholder="e.g., Outer Casing, Sensor Unit" />
                  </div>
                  <div>
                    <Label htmlFor="component-description">Description</Label>
                    <Textarea id="component-description" value={componentDescription} onChange={(e) => setComponentDescription(e.target.value)} placeholder="Describe the component's function" className="min-h-[80px]" />
                  </div>

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
                    <Label>Parent Components</Label>
                    <div className="border rounded-md p-2 max-h-32 overflow-y-auto space-y-1 mt-1">
                      {potentialParents.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No other components available</p>
                      ) : (
                        potentialParents.map(p => {
                          const depth = componentDepthMap.get(p.id) || 0;
                          return (
                            <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5" style={{ paddingLeft: `${depth * 16 + 4}px` }}>
                              {depth > 0 && <span className="text-muted-foreground text-xs">└</span>}
                              <input
                                type="checkbox"
                                checked={parentIds.includes(p.id)}
                                onChange={() => setParentIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                                className="rounded"
                              />
                              <span className="text-muted-foreground font-mono text-xs mr-1">COMP-{String((componentIndexMap.get(p.id) ?? 0) + 1).padStart(3, '0')}</span>{p.name}
                            </label>
                          );
                        }))
                      }
                    </div>
                    {parentIds.length === 0 && <p className="text-xs text-muted-foreground mt-0.5">None selected = top-level component</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="part-number">BOM Part Number</Label>
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
                            onClick={() => toggleFeature(feat.name)}
                          >
                            {feat.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        No features defined yet. Add features in the Key Features section above.
                      </p>
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
          </div>
        </CardHeader>
      )}
      {/* Dialog for when hideCardHeader is true — still need the dialog */}
      {hideCardHeader && (
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
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
                <Label htmlFor="component-name">Component Name</Label>
                <Input id="component-name" value={componentName} onChange={(e) => setComponentName(e.target.value)} placeholder="e.g., Outer Casing, Sensor Unit" />
              </div>
              <div>
                <Label htmlFor="component-description">Description</Label>
                <Textarea id="component-description" value={componentDescription} onChange={(e) => setComponentDescription(e.target.value)} placeholder="Describe the component's function" className="min-h-[80px]" />
              </div>
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
                <Label>Parent Components</Label>
                <div className="border rounded-md p-2 max-h-32 overflow-y-auto space-y-1 mt-1">
                  {potentialParents.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No other components available</p>
                  ) : (
                    potentialParents.map(p => {
                      const depth = componentDepthMap.get(p.id) || 0;
                      return (
                        <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5" style={{ paddingLeft: `${depth * 16 + 4}px` }}>
                          {depth > 0 && <span className="text-muted-foreground text-xs">└</span>}
                          <input
                            type="checkbox"
                            checked={parentIds.includes(p.id)}
                            onChange={() => setParentIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                            className="rounded"
                          />
                          <span className="text-muted-foreground font-mono text-xs mr-1">COMP-{String((componentIndexMap.get(p.id) ?? 0) + 1).padStart(3, '0')}</span>{p.name}
                        </label>
                      );
                    }))
                  }
                </div>
                {parentIds.length === 0 && <p className="text-xs text-muted-foreground mt-0.5">None selected = top-level component</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="part-number">BOM Part Number</Label>
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
                        onClick={() => toggleFeature(feat.name)}
                      >
                        {feat.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    No features defined yet. Add features in the Key Features section above.
                  </p>
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
      )}
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !tree.length ? (
          <p className="text-muted-foreground text-center py-8">
            No components added yet. Click "Add Component" to define the physical or software components of your device.
          </p>
        ) : enableDragToLink ? (
          <div className="space-y-3">
            {tree.map((comp, rootIndex) => renderComponent(comp, 0, `root-${rootIndex}`))}
          </div>
        ) : (
          tree.map((comp, rootIndex) => renderComponent(comp, 0, `root-${rootIndex}`))
        )}
        <p className="text-xs text-muted-foreground">
          Materials, costs, and supplier details are managed in the Bill of Materials (BOM) module.
        </p>
      </CardContent>
      {productId && companyId && (
        <ComponentImportDialog
          open={isImportOpen}
          onOpenChange={setIsImportOpen}
          productId={productId}
          companyId={companyId}
        />
      )}
    </Card>
  );
}
