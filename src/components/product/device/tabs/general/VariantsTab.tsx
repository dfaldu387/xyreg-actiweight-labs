import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, ExternalLink, GitBranch, FileText, Shield, Link2, Unlink, Plus, Settings, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useCompanyProductSelection } from '@/hooks/useCompanyProductSelection';
interface VariantsTabProps {
  productId: string;
  companyId: string;
  is_master_device?: boolean;
  parent_product_id?: string | null;
}

const OVERRIDE_FLAGS = [
  { flag: 'has_intended_use_override', label: 'Intended Use' },
  { flag: 'has_intended_users_override', label: 'Intended Users' },
  { flag: 'has_clinical_benefits_override', label: 'Clinical Benefits' },
  { flag: 'has_contraindications_override', label: 'Contraindications' },
  { flag: 'has_device_components_override', label: 'Device Components' },
  { flag: 'has_classification_override', label: 'Classification' },
  { flag: 'has_technical_specs_override', label: 'Technical Specs' },
  { flag: 'has_definition_override', label: 'Description' },
  { flag: 'has_duration_of_use_override', label: 'Duration of Use' },
  { flag: 'has_environment_of_use_override', label: 'Environment of Use' },
  { flag: 'has_shelf_life_override', label: 'Shelf Life' },
  { flag: 'has_storage_sterility_override', label: 'Storage/Sterility' },
  { flag: 'has_warnings_override', label: 'Warnings' },
] as const;

// Map field_scope_overrides keys (camelCase) to human-readable labels
const SCOPE_OVERRIDE_KEYS: { key: string; label: string }[] = [
  // Purpose tab
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
  // General > Definition
  { key: 'definition_tradeName', label: 'Trade Name' },
  { key: 'definition_deviceCategory', label: 'Device Category' },
  { key: 'definition_modelReference', label: 'Device Model/Reference' },
  { key: 'definition_description', label: 'Device Description' },
  // General > Classification
  { key: 'classification_primaryRegulatoryType', label: 'Primary Regulatory Type' },
  { key: 'classification_systemProcedurePack', label: 'System or Procedure Pack' },
  { key: 'classification_coreDeviceNature', label: 'Core Device Nature' },
  { key: 'classification_anatomicalLocation', label: 'Anatomical Location' },
  { key: 'classification_isActiveDevice', label: 'Active Device' },
  // General > Technical Specs
  { key: 'technical_trlLevel', label: 'TRL Level' },
  { key: 'technical_systemArchitecture', label: 'System Architecture' },
  { key: 'technical_keyTechCharacteristics', label: 'Key Technology Characteristics' },
  { key: 'technical_sterility', label: 'Sterility Requirements' },
  { key: 'technical_powerSource', label: 'Power Source' },
  { key: 'technical_connectivity', label: 'Connectivity Features' },
  { key: 'technical_aiMl', label: 'AI/ML Features' },
];

interface FamilyProduct {
  id: string;
  name: string;
  trade_name: string | null;
  status: string | null;
  is_master_device: boolean;
  company_id?: string;
  overrideCount: number;
  overriddenFields: string[];
}

interface DimensionColumn {
  id: string;
  name: string;
  product_id?: string | null;
}

interface DimensionOption {
  id: string;
  name: string;
  dimension_id: string;
}

// Map: productId -> dimensionId -> { optionName, optionId }
type DimensionValueMap = Record<string, Record<string, { name: string; optionId: string }>>;

// Map: productId -> { total, overridden }
type DocStatsMap = Record<string, { total: number; overridden: number }>;

// Map: productId -> product_variant_id (for upsert)
type ProductVariantIdMap = Record<string, string>;

export function VariantsTab({ productId, companyId, is_master_device, parent_product_id }: VariantsTabProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [master, setMaster] = useState<FamilyProduct | null>(null);
  const [variants, setVariants] = useState<FamilyProduct[]>([]);
  const [dimensions, setDimensions] = useState<DimensionColumn[]>([]);
  const [dimensionOptions, setDimensionOptions] = useState<DimensionOption[]>([]);
  const [valueMap, setValueMap] = useState<DimensionValueMap>({});
  const [docStats, setDocStats] = useState<DocStatsMap>({});
  const [pvIdMap, setPvIdMap] = useState<ProductVariantIdMap>({});
  const [loading, setLoading] = useState(true);
  const [newDimensionName, setNewDimensionName] = useState('');
  const [addingDimension, setAddingDimension] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);

  // Fetch company name for settings navigation
  useEffect(() => {
    if (!companyId) return;
    supabase.from('companies').select('name').eq('id', companyId).single().then(({ data }) => {
      if (data?.name) setCompanyName(data.name);
    });
  }, [companyId]);

  // Link/Unlink state
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [selectedMasterId, setSelectedMasterId] = useState<string>('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [addingOptionDimId, setAddingOptionDimId] = useState<string | null>(null);
  const [newOptionName, setNewOptionName] = useState('');

  const { products: companyProducts, isLoading: productsLoading } = useCompanyProductSelection(companyId);

  const isPartOfFamily = is_master_device || !!parent_product_id;

  const load = useCallback(async () => {
    if (!isPartOfFamily) { setLoading(false); return; }
    try {
      setLoading(true);
      const masterId = is_master_device ? productId : parent_product_id!;

      // Fetch master with override flags
      const { data: masterData, error: masterErr } = await supabase
        .from('products')
        .select('id, name, trade_name, status, is_master_device, company_id, field_scope_overrides, has_intended_use_override, has_intended_users_override, has_clinical_benefits_override, has_contraindications_override, has_device_components_override, has_classification_override, has_technical_specs_override, has_definition_override, has_duration_of_use_override, has_environment_of_use_override, has_shelf_life_override, has_storage_sterility_override, has_warnings_override')
        .eq('id', masterId)
        .single();
      if (masterErr) throw masterErr;

      const parseOverrides = (row: any): { count: number; fields: string[] } => {
        const fields: string[] = [];
        // Check has_*_override boolean flags
        OVERRIDE_FLAGS.forEach(f => { if (row[f.flag]) fields.push(f.label); });
        // Check field_scope_overrides JSONB for 'individual' scoped fields
        const scopeOverrides = row.field_scope_overrides;
        if (scopeOverrides && typeof scopeOverrides === 'object') {
          SCOPE_OVERRIDE_KEYS.forEach(s => {
            if (scopeOverrides[s.key] === 'individual' && !fields.includes(s.label)) {
              fields.push(s.label);
            }
          });
        }
        return { count: fields.length, fields };
      };

      const masterOverrides = parseOverrides(masterData);
      setMaster({ ...masterData, overrideCount: masterOverrides.count, overriddenFields: masterOverrides.fields });

      // Fetch variants with override flags
      const { data: variantData, error: varErr } = await supabase
        .from('products')
        .select('id, name, trade_name, status, is_master_device, field_scope_overrides, has_intended_use_override, has_intended_users_override, has_clinical_benefits_override, has_contraindications_override, has_device_components_override, has_classification_override, has_technical_specs_override, has_definition_override, has_duration_of_use_override, has_environment_of_use_override, has_shelf_life_override, has_storage_sterility_override, has_warnings_override')
        .eq('parent_product_id', masterId)
        .eq('is_archived', false)
        .order('name');
      if (varErr) throw varErr;

      const mappedVariants = (variantData || []).map((v: any) => {
        const o = parseOverrides(v);
        return { ...v, overrideCount: o.count, overriddenFields: o.fields };
      });
      setVariants(mappedVariants);

      const allIds = [masterId, ...mappedVariants.map((v: any) => v.id)];

      // Fetch product_variants rows
      const { data: pvRows } = await supabase
        .from('product_variants')
        .select('id, product_id')
        .in('product_id', allIds);

      const pvMap: ProductVariantIdMap = {};
      (pvRows || []).forEach((r: any) => { pvMap[r.product_id] = r.id; });
      setPvIdMap(pvMap);

      // Fetch company dimensions + product-specific dimensions
      const masterId2 = masterId;
      const { data: companyDims } = await supabase
        .from('product_variation_dimensions')
        .select('id, name, product_id')
        .eq('company_id', masterData.company_id)
        .or(`product_id.is.null,product_id.eq.${masterId2}`)
        .order('name');

      const dimMap = new Map<string, string>();
      (companyDims || []).forEach((d: any) => dimMap.set(d.id, d.name));

      // Fetch all options for dropdowns
      const dimIds = Array.from(dimMap.keys());
      let allOptions: DimensionOption[] = [];
      if (dimIds.length > 0) {
        const { data: opts } = await supabase
          .from('product_variation_options')
          .select('id, name, dimension_id')
          .in('dimension_id', dimIds)
          .order('name');
        allOptions = opts || [];
      }
      setDimensionOptions(allOptions);

      // Fetch variant values
      const vMap: DimensionValueMap = {};
      if (pvRows && pvRows.length > 0) {
        const pvIds = pvRows.map((r: any) => r.id);
        const pvIdToProductId: Record<string, string> = {};
        pvRows.forEach((r: any) => { pvIdToProductId[r.id] = r.product_id; });

        const { data: valRows } = await supabase
          .from('product_variant_values')
          .select(`
            product_variant_id, dimension_id, option_id,
            product_variation_options!inner(name),
            product_variation_dimensions!inner(name)
          `)
          .in('product_variant_id', pvIds);

        (valRows || []).forEach((row: any) => {
          const dimId = row.dimension_id;
          const optName = row.product_variation_options?.name;
          const prodId = pvIdToProductId[row.product_variant_id];
          if (prodId && dimId && optName) {
            if (!vMap[prodId]) vMap[prodId] = {};
            vMap[prodId][dimId] = { name: optName, optionId: row.option_id };
          }
        });
      }

      setDimensions(Array.from(dimMap.entries()).map(([id, name]) => {
        const dimRow = (companyDims || []).find((d: any) => d.id === id);
        return { id, name, product_id: dimRow?.product_id || null };
      }).sort((a, b) => a.name.localeCompare(b.name)));
      setValueMap(vMap);

      // Fetch document override stats
      const variantIds = mappedVariants.map((v: any) => v.id);
      if (variantIds.length > 0) {
        const { data: docLinks } = await supabase
          .from('variant_document_links')
          .select('variant_product_id, is_overridden')
          .in('variant_product_id', variantIds);

        const dStats: DocStatsMap = {};
        (docLinks || []).forEach((l: any) => {
          if (!dStats[l.variant_product_id]) dStats[l.variant_product_id] = { total: 0, overridden: 0 };
          dStats[l.variant_product_id].total++;
          if (l.is_overridden) dStats[l.variant_product_id].overridden++;
        });
        setDocStats(dStats);
      }
    } catch (error: any) {
      console.error('Error loading variant family:', error);
      toast.error('Failed to load product variants');
    } finally {
      setLoading(false);
    }
  }, [productId, is_master_device, parent_product_id, isPartOfFamily]);

  useEffect(() => { load(); }, [load]);

  const handleDimensionChange = async (dimensionId: string, optionId: string | null) => {
    try {
      let pvId = pvIdMap[productId];
      // Create product_variant row if missing
      if (!pvId) {
        const { data: newPv, error } = await supabase
          .from('product_variants')
          .insert({ product_id: productId, name: 'Default' })
          .select('id')
          .single();
        if (error) throw error;
        pvId = newPv.id;
        setPvIdMap(prev => ({ ...prev, [productId]: pvId }));
      }

      // Find existing value
      const existing = valueMap[productId]?.[dimensionId];
      if (existing) {
        // Find the variant_value row to update
        const { data: existingRow } = await supabase
          .from('product_variant_values')
          .select('id')
          .eq('product_variant_id', pvId)
          .eq('dimension_id', dimensionId)
          .single();

        if (existingRow) {
          await supabase
            .from('product_variant_values')
            .update({ option_id: optionId })
            .eq('id', existingRow.id);
        }
      } else {
        await supabase
          .from('product_variant_values')
          .insert({ product_variant_id: pvId, dimension_id: dimensionId, option_id: optionId });
      }

      // Reload to refresh
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to update dimension value');
    }
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['variant-inheritance'] });
    queryClient.invalidateQueries({ queryKey: ['device-family'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['company-products-selection'] });
    queryClient.invalidateQueries({ queryKey: ['master-device-data'] });
  };

  const handleLinkToMaster = async () => {
    if (!selectedMasterId) return;
    setLinkLoading(true);
    try {
      // Set this product as a variant of the selected master
      const { error: linkErr } = await supabase
        .from('products')
        .update({ parent_product_id: selectedMasterId, parent_relationship_type: 'variant' })
        .eq('id', productId);
      if (linkErr) throw linkErr;

      // Ensure the target is flagged as master
      const { error: masterErr } = await supabase
        .from('products')
        .update({ is_master_device: true })
        .eq('id', selectedMasterId);
      if (masterErr) throw masterErr;

      toast.success('Product linked as variant successfully');
      invalidateAll();
      setShowLinkDialog(false);
      // Reload page to reflect new state
      navigate(0);
    } catch (e: any) {
      console.error('Link error:', e);
      toast.error('Failed to link product');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleUnlinkFromFamily = async () => {
    if (!parent_product_id) return;
    setLinkLoading(true);
    try {
      const formerMasterId = parent_product_id;

      // Clear variant relationship
      const { error: unlinkErr } = await supabase
        .from('products')
        .update({ parent_product_id: null, parent_relationship_type: null })
        .eq('id', productId);
      if (unlinkErr) throw unlinkErr;

      // Check if the former master still has variants
      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('parent_product_id', formerMasterId)
        .eq('parent_relationship_type', 'variant')
        .eq('is_archived', false);

      if (count === 0) {
        // No more variants — reset master flag
        await supabase
          .from('products')
          .update({ is_master_device: false })
          .eq('id', formerMasterId);
      }

      toast.success('Product unlinked — now standalone');
      invalidateAll();
      setShowUnlinkDialog(false);
      navigate(0);
    } catch (e: any) {
      console.error('Unlink error:', e);
      toast.error('Failed to unlink product');
    } finally {
      setLinkLoading(false);
    }
  };

  // Filter products eligible to be a master (exclude self, exclude products that are variants of something else)
  const eligibleMasters = companyProducts.filter(p =>
    p.id !== productId && !p.parent_product_id
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isPartOfFamily) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">This device is a standalone product.</p>
        <p className="text-sm text-muted-foreground">
          Link it to an existing master device to make it a variant and activate field inheritance.
        </p>
        <Button variant="outline" onClick={() => { setSelectedMasterId(''); setShowLinkDialog(true); }}>
          <Link2 className="w-4 h-4 mr-2" />
          Link to Master Device
        </Button>

        {/* Link Dialog */}
        <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Link to Master Device</DialogTitle>
              <DialogDescription>
                Select an existing product to become this device's master. Field inheritance will activate automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select value={selectedMasterId} onValueChange={setSelectedMasterId}>
                <SelectTrigger>
                  <SelectValue placeholder={productsLoading ? 'Loading products…' : 'Select a master device…'} />
                </SelectTrigger>
                <SelectContent>
                  {eligibleMasters.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                  {eligibleMasters.length === 0 && !productsLoading && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No eligible products found</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLinkDialog(false)} disabled={linkLoading}>
                Cancel
              </Button>
              <Button onClick={handleLinkToMaster} disabled={!selectedMasterId || linkLoading}>
                {linkLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Link as Variant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const allRows: (FamilyProduct & { isMaster: boolean })[] = [];
  if (master) allRows.push({ ...master, isMaster: true });
  variants.forEach(v => allRows.push({ ...v, isMaster: false }));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold mb-1">
            {master?.trade_name || master?.name} — Variant Family
          </h3>
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">
              {variants.length} variant{variants.length !== 1 ? 's' : ''} in this family
            </p>
            {master && (
              <div className="flex items-center gap-1">
                {addingDimension ? (
                  <div className="flex items-center gap-1">
                    <Input
                      className="h-6 text-xs w-[140px]"
                      placeholder="Dimension name…"
                      value={newDimensionName}
                      onChange={(e) => setNewDimensionName(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && newDimensionName.trim()) {
                          e.preventDefault();
                          try {
                            const masterId = is_master_device ? productId : parent_product_id!;
                            const { error } = await supabase
                              .from('product_variation_dimensions')
                              .insert({ company_id: companyId, name: newDimensionName.trim(), product_id: masterId });
                            if (error) throw error;
                            toast.success(`Dimension "${newDimensionName.trim()}" added`);
                            setNewDimensionName('');
                            setAddingDimension(false);
                            await load();
                          } catch (err: any) {
                            toast.error(err.message || 'Failed to add dimension');
                          }
                        }
                        if (e.key === 'Escape') {
                          setAddingDimension(false);
                          setNewDimensionName('');
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1"
                      onClick={() => { setAddingDimension(false); setNewDimensionName(''); }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
                    onClick={() => setAddingDimension(true)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Dimension
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
                  onClick={() => companyName ? navigate(`/app/company/${encodeURIComponent(companyName)}/settings?tab=general&submenu=profile&section=portfolio-structure&returnTo=variants&productId=${productId}`) : toast.error('Company not found')}
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Company Dimensions
                </Button>
              </div>
            )}
          </div>
        </div>
        {/* Unlink button — only for variants (not the master) */}
        {!is_master_device && parent_product_id && (
          <Button variant="outline" size="sm" onClick={() => setShowUnlinkDialog(true)}>
            <Unlink className="w-3.5 h-3.5 mr-1.5" />
            Unlink from Family
          </Button>
        )}
        {/* Master with variants cannot unlink */}
        {is_master_device && variants.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button variant="outline" size="sm" disabled>
                    <Unlink className="w-3.5 h-3.5 mr-1.5" />
                    Unlink
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Remove all variants first before unlinking the master</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Unlink confirmation dialog */}
      <Dialog open={showUnlinkDialog} onOpenChange={setShowUnlinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unlink from Product Family</DialogTitle>
            <DialogDescription>
              This will convert this variant back to a standalone product. Field inheritance will be deactivated — the product will keep its current individual values.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnlinkDialog(false)} disabled={linkLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleUnlinkFromFamily} disabled={linkLoading}>
              {linkLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Unlink Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-3 py-2 font-medium">Name</th>
              <th className="text-left px-3 py-2 font-medium">Status</th>
              {dimensions.map(dim => (
                <th key={dim.id} className="text-left px-3 py-2 font-medium">
                  <div className="flex items-center gap-1">
                    {dim.name}
                    {dim.product_id && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal">Local</Badge>
                    )}
                  </div>
                </th>
              ))}
              <th className="text-left px-3 py-2 font-medium">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Overrides
                </div>
              </th>
              <th className="text-left px-3 py-2 font-medium">
                <div className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Docs
                </div>
              </th>
              <th className="px-3 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {allRows.map((row) => {
              const isCurrent = row.id === productId;
              const prodValues = valueMap[row.id] || {};
              const ds = docStats[row.id];

              return (
                <tr
                  key={row.id}
                  className={`border-b last:border-b-0 transition-colors ${
                    isCurrent ? 'bg-primary/5' : 'hover:bg-muted/30'
                  }`}
                >
                  {/* Name */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      {row.isMaster && <GitBranch className="w-3.5 h-3.5 text-primary shrink-0" />}
                      <span className="font-medium truncate max-w-[200px]">
                        {row.trade_name || row.name}
                      </span>
                      {isCurrent && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Current</Badge>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {row.status || 'draft'}
                    </Badge>
                  </td>

                  {/* Dimension columns */}
                  {dimensions.map(dim => {
                    const val = prodValues[dim.id];
                    // Editable select for current product
                    if (isCurrent) {
                      const opts = dimensionOptions.filter(o => o.dimension_id === dim.id);
                      return (
                        <td key={dim.id} className="px-3 py-2">
                          <Select
                            value={val?.optionId || ''}
                            onValueChange={(v) => handleDimensionChange(dim.id, v || null)}
                          >
                            <SelectTrigger className="h-7 text-xs w-[120px]">
                              <SelectValue placeholder="Select…" />
                            </SelectTrigger>
                            <SelectContent>
                              {opts.map(opt => (
                                <SelectItem key={opt.id} value={opt.id} className="text-xs">
                                  {opt.name}
                                </SelectItem>
                              ))}
                              <div className="border-t px-2 py-1.5">
                                {addingOptionDimId === dim.id ? (
                                  <div className="flex items-center gap-1">
                                    <Input
                                      className="h-6 text-xs"
                                      placeholder="New option…"
                                      value={newOptionName}
                                      onChange={(e) => setNewOptionName(e.target.value)}
                                      onKeyDown={async (e) => {
                                        if (e.key === 'Enter' && newOptionName.trim()) {
                                          e.preventDefault();
                                          try {
                                            const { error } = await supabase
                                              .from('product_variation_options')
                                              .insert({ dimension_id: dim.id, name: newOptionName.trim(), company_id: companyId });
                                            if (error) throw error;
                                            toast.success(`Option "${newOptionName.trim()}" added`);
                                            setNewOptionName('');
                                            setAddingOptionDimId(null);
                                            await load();
                                          } catch (err: any) {
                                            toast.error(err.message || 'Failed to add option');
                                          }
                                        }
                                        if (e.key === 'Escape') {
                                          setAddingOptionDimId(null);
                                          setNewOptionName('');
                                        }
                                      }}
                                      autoFocus
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                ) : (
                                  <button
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-full"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setAddingOptionDimId(dim.id);
                                      setNewOptionName('');
                                    }}
                                  >
                                    <Plus className="w-3 h-3" />
                                    Add option
                                  </button>
                                )}
                              </div>
                            </SelectContent>
                          </Select>
                        </td>
                      );
                    }
                    return (
                      <td key={dim.id} className="px-3 py-2 text-muted-foreground">
                        {val?.name || '—'}
                      </td>
                    );
                  })}

                  {/* Overrides column */}
                  <td className="px-3 py-2">
                    {row.isMaster ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : row.overrideCount === 0 ? (
                      <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800">
                        All inherited
                      </Badge>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-800">
                              {row.overrideCount} field{row.overrideCount !== 1 ? 's' : ''}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[200px]">
                            <p className="text-xs font-medium mb-1">Overridden fields:</p>
                            <ul className="text-xs space-y-0.5">
                              {row.overriddenFields.map(f => (
                                <li key={f}>• {f}</li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </td>

                  {/* Docs column */}
                  <td className="px-3 py-2">
                    {row.isMaster ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : !ds || ds.total === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : ds.overridden === 0 ? (
                      <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800">
                        All inherited
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-800">
                        {ds.overridden}/{ds.total} custom
                      </Badge>
                    )}
                  </td>

                  {/* Navigate */}
                  <td className="px-3 py-2">
                    {!isCurrent && (
                      <Link to={`/app/product/${row.id}/device-information?tab=general&subtab=variants`}>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
