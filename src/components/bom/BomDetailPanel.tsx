import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, AlertTriangle, DollarSign, History, Shield, Package, Beaker, FileText, GitCompare, Link2, CheckCircle2, XCircle, Minus, ExternalLink, Upload, Wand2, Cpu, Code, Layers, ChevronRight, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useBomItems, useBomTransitions, useBomItemChanges, useCreateBomItem, useUpdateBomItem, useDeleteBomItem } from '@/hooks/useBom';
import { useApprovedSuppliers } from '@/hooks/useSuppliers';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { BomImportDialog } from './BomImportDialog';
import { BomTraceUpPanel } from './BomTraceUpPanel';
import { BomAutoLinkDialog } from './BomAutoLinkDialog';
import { BomService } from '@/services/bomService';
import { BomItemScopeService } from '@/services/bomItemScopeService';
import { BomItemScopePopover } from './BomItemScopePopover';
import { useQueryClient } from '@tanstack/react-query';

import { toast } from 'sonner';
import { format } from 'date-fns';
import type { BomRevision, BomItem, BomItemCategory, BomPatientContact, BomCertificateRequired } from '@/types/bom';
import { BomItemDocumentUpload, type StagedFile } from './BomItemDocumentUpload';
import { BomDocumentService } from '@/services/bomDocumentService';
import { useTranslation } from '@/hooks/useTranslation';

interface BomDetailPanelProps {
  revision: BomRevision;
  onBack: () => void;
  embedded?: boolean;
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  obsolete: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

const CATEGORY_OPTIONS: { value: BomItemCategory; label: string }[] = [
  { value: 'purchased_part', label: 'Purchased Part' },
  { value: 'manufactured_part', label: 'Manufactured Part' },
  { value: 'raw_material', label: 'Raw Material' },
  { value: 'sub_assembly', label: 'Sub-Assembly' },
  { value: 'consumable', label: 'Consumable' },
];

const PATIENT_CONTACT_OPTIONS: { value: BomPatientContact; label: string }[] = [
  { value: 'direct', label: 'Direct Contact' },
  { value: 'indirect', label: 'Indirect Contact' },
  { value: 'none', label: 'No Contact' },
];

const CERTIFICATE_OPTIONS: { value: BomCertificateRequired; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'coa', label: 'Certificate of Analysis (CoA)' },
  { value: 'coc', label: 'Certificate of Conformance (CoC)' },
  { value: 'both', label: 'Both CoA & CoC' },
];

const PATIENT_CONTACT_COLORS: Record<string, string> = {
  direct: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  indirect: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  none: 'bg-muted text-muted-foreground',
};

type ComplianceValue = 'not_assessed' | 'compliant' | 'non_compliant';

interface FormData {
  description: string;
  item_number: string;
  quantity: number;
  unit_of_measure: string;
  unit_cost: number;
  supplier_id: string;
  supplier_part_number: string;
  lead_time_days: number;
  is_critical: boolean;
  notes: string;
  category: BomItemCategory;
  material_name: string;
  material_specification: string;
  patient_contact: BomPatientContact;
  biocompatibility_notes: string;
  certificate_required: BomCertificateRequired;
  internal_part_number: string;
  reference_designator: string;
  sterilization_compatible: string;
  shelf_life_days: number;
  component_id: string;
  rohs_compliant: ComplianceValue;
  reach_compliant: ComplianceValue;
  drawing_url: string;
}

function boolToCompliance(val: boolean | null | undefined): ComplianceValue {
  if (val === true) return 'compliant';
  if (val === false) return 'non_compliant';
  return 'not_assessed';
}

function complianceToBool(val: ComplianceValue): boolean | null {
  if (val === 'compliant') return true;
  if (val === 'non_compliant') return false;
  return null;
}

const defaultFormData: FormData = {
  description: '',
  item_number: '',
  quantity: 1,
  unit_of_measure: 'ea',
  unit_cost: 0,
  supplier_id: '',
  supplier_part_number: '',
  lead_time_days: 0,
  is_critical: false,
  notes: '',
  category: 'purchased_part',
  material_name: '',
  material_specification: '',
  patient_contact: 'none',
  biocompatibility_notes: '',
  certificate_required: 'none',
  internal_part_number: '',
  reference_designator: '',
  sterilization_compatible: '',
  shelf_life_days: 0,
  component_id: '',
  rohs_compliant: 'not_assessed',
  reach_compliant: 'not_assessed',
  drawing_url: '',
};

function ComplianceBadge({ value }: { value: boolean | null | undefined }) {
  if (value === true) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (value === false) return <XCircle className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

export function BomDetailPanel({ revision, onBack, embedded = false }: BomDetailPanelProps) {
  const { lang } = useTranslation();
  const { data: items, isLoading: itemsLoading } = useBomItems(revision.id);
  const { data: transitions } = useBomTransitions(revision.id);
  const { data: itemChanges } = useBomItemChanges(revision.id);
  const { data: suppliers } = useApprovedSuppliers(revision.company_id);
  const createItem = useCreateBomItem(revision.id, revision.product_id);
  const updateItem = useUpdateBomItem(revision.id, revision.product_id);
  const deleteItem = useDeleteBomItem(revision.id);

  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<BomItem | null>(null);
  const [formData, setFormData] = useState<FormData>({ ...defaultFormData });
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [traceItem, setTraceItem] = useState<BomItem | null>(null);
  const [showAutoLink, setShowAutoLink] = useState(false);
  const [isAutoLinking, setIsAutoLinking] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const qc = useQueryClient();

  const unlinkedCount = useMemo(() => items?.filter(i => !i.component_id).length || 0, [items]);

  // Scope data for cross-device sharing
  const [scopeMap, setScopeMap] = useState<Record<string, string[]>>({});
  useEffect(() => {
    if (!items?.length) return;
    BomItemScopeService.getScopes(items.map(i => i.id)).then(setScopeMap).catch(() => {});
  }, [items]);

  const handleScopeChange = (bomItemId: string, productIds: string[]) => {
    setScopeMap(prev => ({ ...prev, [bomItemId]: productIds }));
  };

  const resetForm = () => { setFormData({ ...defaultFormData }); setStagedFiles([]); };
  const { productId } = useParams<{ productId: string }>();

  const { data: deviceComponents } = useQuery({
    queryKey: ['device-components-bom', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('device_components')
        .select('id, name, description, component_type')
        .eq('product_id', productId)
        .order('sort_order')
        .order('name');
      if (error) throw error;
      const comps = (data || []) as { id: string; name: string; description: string; component_type: string; parent_ids: string[] }[];

      // Fetch hierarchy links
      const compIds = comps.map(c => c.id);
      if (compIds.length > 0) {
        const { data: links } = await supabase
          .from('device_component_hierarchy')
          .select('parent_id, child_id')
          .in('child_id', compIds);
        const parentMap = new Map<string, string[]>();
        (links || []).forEach((link: any) => {
          const existing = parentMap.get(link.child_id) || [];
          existing.push(link.parent_id);
          parentMap.set(link.child_id, existing);
        });
        comps.forEach(c => { c.parent_ids = parentMap.get(c.id) || []; });
      } else {
        comps.forEach(c => { c.parent_ids = []; });
      }
      return comps;
    },
    enabled: !!productId,
  });

  const buildPayload = () => ({
    description: formData.description,
    item_number: formData.item_number,
    quantity: formData.quantity,
    unit_of_measure: formData.unit_of_measure,
    unit_cost: formData.unit_cost,
    supplier_id: formData.supplier_id || undefined,
    supplier_part_number: formData.supplier_part_number || undefined,
    lead_time_days: formData.lead_time_days || undefined,
    is_critical: formData.is_critical,
    notes: formData.notes || undefined,
    category: formData.category,
    material_name: formData.material_name || undefined,
    material_specification: formData.material_specification || undefined,
    patient_contact: formData.patient_contact,
    biocompatibility_notes: formData.biocompatibility_notes || undefined,
    certificate_required: formData.certificate_required,
    internal_part_number: formData.internal_part_number || undefined,
    reference_designator: formData.reference_designator || undefined,
    sterilization_compatible: formData.sterilization_compatible || undefined,
    shelf_life_days: formData.shelf_life_days || undefined,
    component_id: formData.component_id || undefined,
    rohs_compliant: complianceToBool(formData.rohs_compliant),
    reach_compliant: complianceToBool(formData.reach_compliant),
    drawing_url: formData.drawing_url || undefined,
  });

  const handleAdd = async () => {
    const nextNum = `${(items?.length || 0) + 1}.0`;
    const newItem = await createItem.mutateAsync({
      bom_revision_id: revision.id,
      ...buildPayload(),
      item_number: formData.item_number || nextNum,
      sort_order: items?.length || 0,
    });
    // Upload staged documents
    if (stagedFiles.length > 0 && newItem?.id) {
      for (const sf of stagedFiles) {
        try {
          await BomDocumentService.uploadDocument(sf.file, newItem.id, revision.company_id, sf.documentType);
        } catch (e) { console.error('Failed to upload staged doc', e); }
      }
    }
    setShowAddItem(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    await updateItem.mutateAsync({ id: editingItem.id, updates: buildPayload() });
    setEditingItem(null);
    resetForm();
  };

  const openEdit = (item: BomItem) => {
    setFormData({
      description: item.description,
      item_number: item.item_number,
      quantity: item.quantity,
      unit_of_measure: item.unit_of_measure,
      unit_cost: item.unit_cost,
      supplier_id: item.supplier_id || '',
      supplier_part_number: item.supplier_part_number || '',
      lead_time_days: item.lead_time_days || 0,
      is_critical: item.is_critical,
      notes: item.notes || '',
      category: item.category || 'purchased_part',
      material_name: item.material_name || '',
      material_specification: item.material_specification || '',
      patient_contact: item.patient_contact || 'none',
      biocompatibility_notes: item.biocompatibility_notes || '',
      certificate_required: item.certificate_required || 'none',
      internal_part_number: item.internal_part_number || '',
      reference_designator: item.reference_designator || '',
      sterilization_compatible: item.sterilization_compatible || '',
      shelf_life_days: item.shelf_life_days || 0,
      component_id: item.component_id || '',
      rohs_compliant: boolToCompliance(item.rohs_compliant),
      reach_compliant: boolToCompliance(item.reach_compliant),
      drawing_url: item.drawing_url || '',
    });
    setEditingItem(item);
  };

  const totalCost = items?.reduce((sum, i) => sum + Number(i.extended_cost || 0), 0) || 0;
  const criticalCount = items?.filter(i => i.is_critical).length || 0;
  const directContactCount = items?.filter(i => i.patient_contact === 'direct').length || 0;
  const nonCompliantCount = items?.filter(i => i.rohs_compliant === false || i.reach_compliant === false).length || 0;
  const isDraft = revision.status === 'draft';

  // Build hierarchical grouping of BOM items by device component
  const groupedItems = useMemo(() => {
    if (!items) return [];
    const comps = deviceComponents || [];
    
    type GroupNode = { component: typeof comps[0] | null; depth: number; items: BomItem[]; subtotal: number; label: string };
    
    // Build component tree using many-to-many parent_ids
    const childrenMap = new Map<string | null, typeof comps>();
    comps.forEach(c => {
      const pids = c.parent_ids || [];
      if (pids.length === 0) {
        // Root component
        if (!childrenMap.has(null)) childrenMap.set(null, []);
        childrenMap.get(null)!.push(c);
      } else {
        pids.forEach(pid => {
          if (!childrenMap.has(pid)) childrenMap.set(pid, []);
          childrenMap.get(pid)!.push(c);
        });
      }
    });
    
    // Map items by component_id
    const itemsByComponent = new Map<string, BomItem[]>();
    const unassigned: BomItem[] = [];
    items.forEach(item => {
      if (item.component_id) {
        if (!itemsByComponent.has(item.component_id)) itemsByComponent.set(item.component_id, []);
        itemsByComponent.get(item.component_id)!.push(item);
      } else {
        unassigned.push(item);
      }
    });
    
    // DFS walk
    const result: GroupNode[] = [];
    const walk = (parentId: string | null, depth: number) => {
      const children = childrenMap.get(parentId) || [];
      children.forEach(comp => {
        const compItems = itemsByComponent.get(comp.id) || [];
        const subtotal = compItems.reduce((s, i) => s + Number(i.extended_cost || 0), 0);
        result.push({ component: comp, depth, items: compItems, subtotal, label: comp.name });
        walk(comp.id, depth + 1);
      });
    };
    walk(null, 0);
    
    // Unassigned group
    if (unassigned.length > 0) {
      const subtotal = unassigned.reduce((s, i) => s + Number(i.extended_cost || 0), 0);
      result.push({ component: null, depth: 0, items: unassigned, subtotal, label: lang('bom.unassigned') });
    }
    
    // If no components exist, just return all items as one flat unassigned group
    if (comps.length === 0 && items.length > 0) {
      return [{ component: null, depth: 0, items, subtotal: totalCost, label: lang('bom.allItems') }];
    }
    
    return result;
  }, [items, deviceComponents, totalCost, lang]);

  const set = (field: keyof FormData, value: any) => setFormData(p => ({ ...p, [field]: value }));

  const colCount = isDraft ? 15 : 14;

  const componentIcon = (type: string) => {
    if (type === 'software') return <Code className="h-4 w-4" />;
    if (type === 'sub_assembly') return <Layers className="h-4 w-4" />;
    return <Cpu className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {!embedded && (
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Rev {revision.revision}</h2>
              <Badge className={statusColors[revision.status]}>{revision.status}</Badge>
            </div>
            {revision.description && <p className="text-muted-foreground mt-1">{revision.description}</p>}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" /> {lang('bom.totalCost')}
            </div>
            <div className="text-2xl font-bold font-mono">{revision.currency} {totalCost.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Package className="h-4 w-4" /> {lang('bom.items')}
            </div>
            <div className="text-2xl font-bold">{items?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <AlertTriangle className="h-4 w-4" /> {lang('bom.critical')}
            </div>
            <div className="text-2xl font-bold">{criticalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Shield className="h-4 w-4" /> {lang('bom.patientContact')}
            </div>
            <div className="text-2xl font-bold">{lang('bom.directCount', { count: directContactCount })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <XCircle className="h-4 w-4" /> {lang('bom.nonCompliant')}
            </div>
            <div className={`text-2xl font-bold ${nonCompliantCount > 0 ? 'text-destructive' : ''}`}>{nonCompliantCount}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">{lang('bom.itemsTab')}</TabsTrigger>
          <TabsTrigger value="cost">{lang('bom.costSummary')}</TabsTrigger>
          {revision.ccr_id && <TabsTrigger value="eco">{lang('bom.eco')}</TabsTrigger>}
          <TabsTrigger value="changes">{lang('bom.changes')}</TabsTrigger>
          <TabsTrigger value="history">{lang('bom.history')}</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <CardTitle className="text-base">{lang('bom.bomItems')}</CardTitle>
              {isDraft && (
                <div className="flex gap-2">
                  {unlinkedCount > 0 && deviceComponents && deviceComponents.length > 0 && (
                    <Button size="sm" variant="outline" onClick={() => setShowAutoLink(true)}>
                      <Wand2 className="h-4 w-4 mr-1" /> {lang('bom.autoLink')} ({unlinkedCount})
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>
                    <Upload className="h-4 w-4 mr-1" /> {lang('bom.import')}
                  </Button>
                  <Button size="sm" onClick={() => { resetForm(); setShowAddItem(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> {lang('bom.addItem')}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>{lang('bom.description')}</TableHead>
                    <TableHead>{lang('bom.category')}</TableHead>
                    <TableHead>{lang('bom.material')}</TableHead>
                    <TableHead>{lang('bom.patientContact')}</TableHead>
                    <TableHead className="text-center">{lang('bom.rohs')}</TableHead>
                    <TableHead className="text-center">{lang('bom.reach')}</TableHead>
                    <TableHead className="text-right">{lang('bom.qty')}</TableHead>
                    <TableHead className="text-right">{lang('bom.unitCost')}</TableHead>
                    <TableHead className="text-right">{lang('bom.extCost')}</TableHead>
                    <TableHead>{lang('bom.supplier')}</TableHead>
                     <TableHead>{lang('bom.critical')}</TableHead>
                      <TableHead className="w-12">{lang('bom.trace')}</TableHead>
                      <TableHead className="w-20">{lang('bom.scope')}</TableHead>
                      {isDraft && <TableHead className="w-16">{lang('bom.actions')}</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsLoading ? (
                    <TableRow><TableCell colSpan={colCount} className="text-center py-8 text-muted-foreground">{lang('bom.loading')}</TableCell></TableRow>
                  ) : !items?.length ? (
                    <TableRow><TableCell colSpan={colCount} className="text-center py-8 text-muted-foreground">{lang('bom.noItemsYet')}</TableCell></TableRow>
                  ) : (
                    groupedItems.map((group, gi) => (
                      <React.Fragment key={group.component?.id || `unassigned-${gi}`}>
                        {/* Component group header */}
                        <TableRow className="bg-muted/30 hover:bg-muted/40 border-t">
                          <TableCell colSpan={colCount - 1} className="py-2">
                            <div className="flex items-center gap-2" style={{ paddingLeft: `${group.depth * 20}px` }}>
                              {group.component ? (
                                <>
                                  {componentIcon(group.component.component_type)}
                                  <span className="font-semibold text-sm">{group.label}</span>
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {group.component.component_type.replace(/_/g, ' ')}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">({group.items.length} items)</span>
                                </>
                              ) : (
                                <>
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-semibold text-sm text-muted-foreground">{group.label}</span>
                                  <span className="text-xs text-muted-foreground">({group.items.length} items)</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-2">
                            <span className="font-mono text-sm font-semibold">{revision.currency} {group.subtotal.toFixed(2)}</span>
                          </TableCell>
                        </TableRow>
                        {/* Items in this group */}
                        {group.items.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={colCount} className="text-center py-3 text-muted-foreground text-xs italic">
                              {lang('bom.noBomItemsLinked')}
                            </TableCell>
                          </TableRow>
                        ) : (
                          group.items.map(item => (
                            <TableRow
                              key={item.id}
                              className={isDraft ? 'cursor-pointer hover:bg-muted/50' : ''}
                              onClick={() => isDraft && openEdit(item)}
                            >
                              <TableCell className="font-mono text-sm">{item.item_number}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1" style={{ paddingLeft: `${group.depth * 20}px` }}>
                                  <div>
                                    <span className="font-medium">{item.description}</span>
                                    {item.internal_part_number && (
                                      <span className="block text-xs text-muted-foreground">P/N: {item.internal_part_number}</span>
                                    )}
                                  </div>
                                  {item.drawing_url && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <a
                                            href={item.drawing_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={e => e.stopPropagation()}
                                            className="text-primary hover:text-primary/80"
                                          >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                          </a>
                                        </TooltipTrigger>
                                        <TooltipContent>{lang('bom.viewTechnicalDrawing')}</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm capitalize">{(item.category || 'purchased_part').replace(/_/g, ' ')}</span>
                              </TableCell>
                              <TableCell>
                                {item.material_name ? (
                                  <div>
                                    <span className="text-sm">{item.material_name}</span>
                                    {item.material_specification && (
                                      <span className="block text-xs text-muted-foreground">{item.material_specification}</span>
                                    )}
                                  </div>
                                ) : '—'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={PATIENT_CONTACT_COLORS[item.patient_contact || 'none']}>
                                  {(item.patient_contact || 'none').charAt(0).toUpperCase() + (item.patient_contact || 'none').slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <ComplianceBadge value={item.rohs_compliant} />
                              </TableCell>
                              <TableCell className="text-center">
                                <ComplianceBadge value={item.reach_compliant} />
                              </TableCell>
                              <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                              <TableCell className="text-right font-mono">{Number(item.unit_cost).toFixed(2)}</TableCell>
                              <TableCell className="text-right font-mono font-semibold">{Number(item.extended_cost).toFixed(2)}</TableCell>
                              <TableCell>
                                {item.supplier ? (
                                  <span className="text-sm">{item.supplier.name}</span>
                                ) : item.supplier_part_number ? (
                                  <span className="text-sm text-muted-foreground">{item.supplier_part_number}</span>
                                ) : '—'}
                              </TableCell>
                              <TableCell>
                                {item.is_critical && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost" size="icon"
                                  onClick={e => { e.stopPropagation(); setTraceItem(item); }}
                                >
                                  <Link2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </TableCell>
                              <TableCell>
                                <BomItemScopePopover
                                  bomItemId={item.id}
                                  currentProductId={productId || ''}
                                  companyId={revision.company_id}
                                  scopedProductIds={scopeMap[item.id] || [productId || '']}
                                  onScopeChange={handleScopeChange}
                                  readOnly={!isDraft}
                                />
                              </TableCell>
                              {isDraft && (
                                <TableCell>
                                  <Button
                                    variant="ghost" size="icon"
                                    onClick={e => {
                                      e.stopPropagation();
                                      setDeletingItemId(item.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          ))
                        )}
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {items?.map(item => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <span className="font-mono text-sm mr-2">{item.item_number}</span>
                      <span>{item.description}</span>
                      <span className="text-sm text-muted-foreground ml-2">× {item.quantity}</span>
                    </div>
                    <span className="font-mono font-semibold">{Number(item.extended_cost).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 border-t-2 font-bold text-lg">
                  <span>{lang('bom.total')}</span>
                  <span className="font-mono">{revision.currency} {totalCost.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ECO Tab */}
        {revision.ccr_id && revision.ccr && (
          <TabsContent value="eco">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-semibold text-lg">{revision.ccr.ccr_id}</h3>
                      <p className="text-muted-foreground">{revision.ccr.title}</p>
                    </div>
                    <Badge variant="outline" className="ml-auto capitalize">{revision.ccr.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {lang('bom.ecoLinkedInfo')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Changes Tab */}
        <TabsContent value="changes">
          <Card>
            <CardContent className="pt-6">
              {!itemChanges?.length ? (
                <div className="text-center py-8">
                  <GitCompare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">{lang('bom.noItemChanges')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {itemChanges.map(c => (
                    <div key={c.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                      <div className={`mt-1 w-2 h-2 rounded-full ${c.change_type === 'added' ? 'bg-green-500' : c.change_type === 'removed' ? 'bg-red-500' : 'bg-amber-500'}`} />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium capitalize">{c.change_type}</span>
                        {c.field_name && (
                          <span className="text-muted-foreground"> — {c.field_name}</span>
                        )}
                        {c.old_value && c.new_value && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            <span className="line-through text-red-500/70">{c.old_value}</span>
                            {' → '}
                            <span className="text-green-600">{c.new_value}</span>
                          </p>
                        )}
                        {c.change_type === 'added' && c.new_value && (
                          <p className="text-sm text-green-600 mt-0.5">{c.new_value}</p>
                        )}
                        {c.change_type === 'removed' && c.old_value && (
                          <p className="text-sm text-red-500/70 line-through mt-0.5">{c.old_value}</p>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(c.created_at), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
              {!transitions?.length ? (
                <p className="text-muted-foreground text-center py-4">{lang('bom.noTransitions')}</p>
              ) : (
                <div className="space-y-3">
                  {transitions.map(t => (
                    <div key={t.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                      <History className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <span className="font-medium">{t.from_status || 'created'} → {t.to_status}</span>
                        {t.reason && <p className="text-sm text-muted-foreground">{t.reason}</p>}
                      </div>
                      <span className="text-sm text-muted-foreground">{format(new Date(t.created_at), 'MMM d, yyyy HH:mm')}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Item Dialog */}
      <Dialog open={showAddItem || !!editingItem} onOpenChange={(open) => { if (!open) { setShowAddItem(false); setEditingItem(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingItem ? lang('bom.editBomItem') : lang('bom.addBomItem')}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-4">
            <div className="space-y-6">
              {/* Section: Basic Info */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{lang('bom.basicInfo')}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{lang('bom.itemNumberOptional')} <span className="text-xs font-normal text-muted-foreground">{lang('bom.itemNumberOptionalHint')}</span></Label>
                    <Input placeholder={`Auto: ${(items?.length || 0) + 1}.0`} value={formData.item_number} onChange={e => set('item_number', e.target.value)} />
                    <p className="text-xs text-muted-foreground mt-1">{lang('bom.autoAssignHint')}</p>
                  </div>
                  <div>
                    <Label>{lang('bom.category')}</Label>
                    <Select value={formData.category} onValueChange={v => set('category', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-3">
                  <Label>{lang('bom.descriptionRequired')}</Label>
                  <Input placeholder={lang('bom.componentDescription')} value={formData.description} onChange={e => set('description', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label>{lang('bom.internalPartNumber')}</Label>
                    <Input placeholder="e.g. XYR-001-A" value={formData.internal_part_number} onChange={e => set('internal_part_number', e.target.value)} />
                  </div>
                  <div>
                    <Label>{lang('bom.referenceDesignator')}</Label>
                    <Input placeholder="e.g. Housing, Electrode A" value={formData.reference_designator} onChange={e => set('reference_designator', e.target.value)} />
                  </div>
                </div>
                <div className="mt-3">
                  <Label>{lang('bom.technicalDrawingUrl')}</Label>
                  <Input placeholder={lang('bom.technicalDrawingPlaceholder')} value={formData.drawing_url} onChange={e => set('drawing_url', e.target.value)} />
                  <p className="text-xs text-muted-foreground mt-1">{lang('bom.technicalDrawingHint')}</p>
                </div>
              </div>

              <Separator />

              {/* Section: Device Component Link */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Link2 className="h-4 w-4" /> {lang('bom.deviceComponent')}
                </h4>
                <div>
                  <Label>{lang('bom.linkedComponent')}</Label>
                  <Select
                    value={formData.component_id || 'none'}
                    onValueChange={v => {
                      const id = v === 'none' ? '' : v;
                      set('component_id', id);
                      if (id && !formData.description) {
                        const comp = deviceComponents?.find(c => c.id === id);
                        if (comp) set('description', comp.name);
                      }
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder={lang('bom.selectComponent')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{lang('bom.noLinkedComponent')}</SelectItem>
                      {deviceComponents?.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                          <span className="ml-1 text-muted-foreground text-xs capitalize">({c.component_type === 'sub_assembly' ? 'Sub-Assembly' : c.component_type})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {lang('bom.linkComponentHint')}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Section: Material & Safety */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Beaker className="h-4 w-4" /> {lang('bom.materialAndSafety')}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{lang('bom.materialName')}</Label>
                    <Input placeholder="e.g. 316L Stainless Steel" value={formData.material_name} onChange={e => set('material_name', e.target.value)} />
                  </div>
                  <div>
                    <Label>{lang('bom.materialSpecification')}</Label>
                    <Input placeholder="e.g. ASTM F138" value={formData.material_specification} onChange={e => set('material_specification', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label>{lang('bom.patientContactIso')}</Label>
                    <Select value={formData.patient_contact} onValueChange={v => set('patient_contact', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PATIENT_CONTACT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{lang('bom.certificateRequired')}</Label>
                    <Select value={formData.certificate_required} onValueChange={v => set('certificate_required', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CERTIFICATE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label>{lang('bom.rohsCompliance')}</Label>
                    <Select value={formData.rohs_compliant} onValueChange={v => set('rohs_compliant', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_assessed">{lang('bom.notAssessed')}</SelectItem>
                        <SelectItem value="compliant">{lang('bom.compliant')}</SelectItem>
                        <SelectItem value="non_compliant">{lang('bom.nonCompliantStatus')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{lang('bom.reachCompliance')}</Label>
                    <Select value={formData.reach_compliant} onValueChange={v => set('reach_compliant', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_assessed">{lang('bom.notAssessed')}</SelectItem>
                        <SelectItem value="compliant">{lang('bom.compliant')}</SelectItem>
                        <SelectItem value="non_compliant">{lang('bom.nonCompliantStatus')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-3">
                  <Label>{lang('bom.sterilizationCompatibility')}</Label>
                  <Input placeholder="e.g. EtO, Gamma, Autoclave" value={formData.sterilization_compatible} onChange={e => set('sterilization_compatible', e.target.value)} />
                </div>
                <div className="mt-3">
                  <Label>{lang('bom.biocompatibilityNotes')}</Label>
                  <Textarea placeholder={lang('bom.biocompatibilityPlaceholder')} value={formData.biocompatibility_notes} onChange={e => set('biocompatibility_notes', e.target.value)} rows={2} />
                </div>
              </div>

              <Separator />

              {/* Section: Supplier & Cost */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> {lang('bom.supplierAndCost')}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{lang('bom.supplier')}</Label>
                    <Select value={formData.supplier_id} onValueChange={v => set('supplier_id', v === 'none' ? '' : v)}>
                      <SelectTrigger><SelectValue placeholder={lang('bom.selectSupplier')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{lang('bom.noSupplier')}</SelectItem>
                        {suppliers?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{lang('bom.supplierPartNumber')}</Label>
                    <Input value={formData.supplier_part_number} onChange={e => set('supplier_part_number', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div>
                    <Label>{lang('bom.quantity')}</Label>
                    <Input type="number" min={0} value={formData.quantity} onChange={e => set('quantity', Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>{lang('bom.unitOfMeasure')}</Label>
                    <Input placeholder="ea" value={formData.unit_of_measure} onChange={e => set('unit_of_measure', e.target.value)} />
                  </div>
                  <div>
                    <Label>{lang('bom.unitCost')}</Label>
                    <Input type="number" step="0.01" min={0} value={formData.unit_cost} onChange={e => set('unit_cost', Number(e.target.value))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label>{lang('bom.leadTimeDays')}</Label>
                    <Input type="number" min={0} value={formData.lead_time_days} onChange={e => set('lead_time_days', Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>{lang('bom.shelfLifeDays')}</Label>
                    <Input type="number" min={0} value={formData.shelf_life_days} onChange={e => set('shelf_life_days', Number(e.target.value))} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section: Additional */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{lang('bom.additional')}</h4>
                <div className="flex items-center gap-2 mb-3">
                  <Checkbox checked={formData.is_critical} onCheckedChange={c => set('is_critical', !!c)} />
                  <Label className="cursor-pointer">{lang('bom.criticalComponent')}</Label>
                </div>
                <div>
                  <Label>{lang('bom.notes')}</Label>
                  <Textarea value={formData.notes} onChange={e => set('notes', e.target.value)} rows={2} />
                </div>
              </div>

              <Separator />

              {/* Section: Documents */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Paperclip className="h-4 w-4" /> {lang('bom.documents')}
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  {lang('bom.documentsHint')}
                </p>
                <BomItemDocumentUpload
                  bomItemId={editingItem?.id}
                  companyId={revision.company_id}
                  stagedFiles={stagedFiles}
                  onStagedFilesChange={setStagedFiles}
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddItem(false); setEditingItem(null); resetForm(); }}>{lang('common.cancel')}</Button>
            <Button onClick={editingItem ? handleUpdate : handleAdd} disabled={!formData.description || createItem.isPending || updateItem.isPending}>
              {editingItem ? lang('bom.update') : lang('bom.addItem')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item delete confirmation */}
      <AlertDialog open={!!deletingItemId} onOpenChange={() => setDeletingItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lang('bom.deleteBomItem')}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang('bom.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{lang('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingItemId) {
                  deleteItem.mutate(deletingItemId);
                  setDeletingItemId(null);
                }
              }}
            >
              {lang('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CSV/Excel Import Dialog */}
      <BomImportDialog
        open={showImport}
        onOpenChange={setShowImport}
        revisionId={revision.id}
        productId={productId || ''}
      />

      {/* Trace-Up Panel */}
      <BomTraceUpPanel
        open={!!traceItem}
        onOpenChange={open => { if (!open) setTraceItem(null); }}
        bomItem={traceItem}
        productId={productId || ''}
      />

      {/* Auto-Link Dialog */}
      <BomAutoLinkDialog
        open={showAutoLink}
        onOpenChange={setShowAutoLink}
        items={items || []}
        components={deviceComponents || []}
        isApplying={isAutoLinking}
        onApply={async (links) => {
          setIsAutoLinking(true);
          try {
            await BomService.batchUpdateComponentLinks(links);
            qc.invalidateQueries({ queryKey: ['bom-items', revision.id] });
            toast.success(lang('bom.linkedItems', { count: links.length }));
            setShowAutoLink(false);
          } catch {
            toast.error(lang('bom.failedLinkItems'));
          } finally {
            setIsAutoLinking(false);
          }
        }}
      />
    </div>
  );
}
