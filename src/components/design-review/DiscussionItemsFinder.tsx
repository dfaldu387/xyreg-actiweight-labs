import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight, ChevronDown, ExternalLink, FolderOpen, Folder, CheckSquare, Square, RefreshCw, AlertTriangle, TrendingUp, FilePlus, FileEdit, ToggleLeft, ToggleRight, Snowflake } from 'lucide-react';
import { formatBaselineLabel } from '@/types/designReview';
import { useNavigate } from 'react-router-dom';
import { discoverManifest, ReviewManifest, ManifestEntry, RiskDeltaEntry, ComplianceGapEntry } from '@/services/manifestDiscoveryService';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

// ---------- types ----------
interface DiscussionItem {
  object_type: string;
  object_id: string;
  display_id: string;
  title: string;
}

interface FinderProps {
  productId: string;
  reviewId: string;
  reviewMetadata: Record<string, any>;
  isCompleted: boolean;
  phaseName?: string | null;
  baselineLabel?: string | null;
  onManifestReady?: (manifest: ReviewManifest) => void;
}

interface CategoryDef {
  key: string;
  label: string;
  table: string;
  idField: string;
  titleField: string;
  objectType: string;
  route: (pid: string) => string;
  children?: CategoryDef[];
  prefixFilter?: string;
}

// ---------- Discovery type categories ----------
type ViewMode = 'module' | 'discovery';

interface DiscoveryCategoryDef {
  key: 'new_evidence' | 'modified_objects' | 'risk_delta' | 'compliance_gaps';
  label: string;
  icon: React.ReactNode;
  badgeClass: string;
}

const DISCOVERY_CATEGORIES: DiscoveryCategoryDef[] = [
  { key: 'new_evidence', label: 'New Evidence', icon: <FilePlus className="h-3.5 w-3.5" />, badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  { key: 'modified_objects', label: 'Modified Objects', icon: <FileEdit className="h-3.5 w-3.5" />, badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { key: 'risk_delta', label: 'Risk Delta', icon: <TrendingUp className="h-3.5 w-3.5" />, badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  { key: 'compliance_gaps', label: 'Compliance Gaps', icon: <AlertTriangle className="h-3.5 w-3.5" />, badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
];

// ---------- module category tree ----------
const buildCategories = (): CategoryDef[] => [
  {
    key: 'device_definition',
    label: 'Device Definition',
    table: '', idField: '', titleField: '', objectType: '',
    route: () => '',
    children: [
      { key: 'device_def_purpose', label: 'Purpose', table: '__device_definition__', idField: 'purpose', titleField: 'Intended Purpose & Clinical Context', objectType: 'device_definition', route: (pid) => `/app/product/${pid}/device-information?tab=purpose` },
      { key: 'device_def_basics', label: 'General', table: '__device_definition__', idField: 'basics', titleField: 'General Device Information', objectType: 'device_definition', route: (pid) => `/app/product/${pid}/device-information?tab=basics` },
      { key: 'device_def_markets', label: 'Markets & Regulatory', table: '__device_definition__', idField: 'markets-regulatory', titleField: 'Market Registrations & Regulatory Pathway', objectType: 'device_definition', route: (pid) => `/app/product/${pid}/device-information?tab=markets-regulatory` },
      { key: 'device_def_identification', label: 'Identification', table: '__device_definition__', idField: 'identification', titleField: 'Device Identification & UDI', objectType: 'device_definition', route: (pid) => `/app/product/${pid}/device-information?tab=identification` },
      { key: 'device_def_bundles', label: 'Bundles', table: '__device_definition__', idField: 'bundles', titleField: 'Product Bundles & Accessories', objectType: 'device_definition', route: (pid) => `/app/product/${pid}/device-information?tab=bundles` },
    ],
  },
  {
    key: 'compliance',
    label: 'Compliance Instances',
    table: '', idField: '', titleField: '', objectType: '',
    route: () => '',
    children: [
      {
        key: 'documents',
        label: 'Documents',
        table: '', idField: '', titleField: '', objectType: '',
        route: () => '',
        children: [
          {
            key: 'company_documents', label: 'Company-Wide Documents', table: 'phase_assigned_document_template', idField: 'name', titleField: 'name', objectType: 'document',
            route: (pid) => `/app/product/${pid}/documents`,
          },
          {
            key: 'device_core_documents', label: 'Device Core Documents', table: 'phase_assigned_document_template', idField: 'name', titleField: 'name', objectType: 'document',
            route: (pid) => `/app/product/${pid}/documents`,
          },
          {
            key: 'device_phase_documents', label: 'Device Phase Documents', table: 'phase_assigned_document_template', idField: 'name', titleField: 'name', objectType: 'document',
            route: (pid) => `/app/product/${pid}/documents`,
          },
        ],
      },
      {
        key: 'gap_analysis', label: 'Gap Analysis', table: 'gap_analysis_items', idField: 'requirement', titleField: 'requirement', objectType: 'gap_analysis_item',
        route: (pid) => `/app/product/${pid}/gap-analysis`,
      },
      {
        key: 'activities', label: 'Activities', table: 'activities', idField: 'name', titleField: 'name', objectType: 'activity',
        route: (pid) => `/app/product/${pid}/activities`,
      },
      {
        key: 'audits', label: 'Audits', table: 'product_audits', idField: 'audit_name', titleField: 'audit_name', objectType: 'product_audit',
        route: (pid) => `/app/product/${pid}/audits`,
      },
    ],
  },
  {
    key: 'design_risk',
    label: 'Design & Risk Controls',
    table: '', idField: '', titleField: '', objectType: '',
    route: () => '',
    children: [
      { key: 'user_needs', label: 'User Needs', table: 'user_needs', idField: 'need_id', titleField: 'description', objectType: 'user_need', route: (pid) => `/app/product/${pid}/design-risk-controls?tab=requirements&sub=user-needs` },
      { key: 'system_requirements', label: 'System Requirements', table: 'system_requirements', idField: 'requirement_id', titleField: 'description', objectType: 'system_requirement', route: (pid) => `/app/product/${pid}/design-risk-controls?tab=requirements&sub=system-requirements` },
      { key: 'software_requirements', label: 'Software Requirements', table: 'requirement_specifications', idField: 'requirement_id', titleField: 'description', objectType: 'software_requirement', prefixFilter: 'SWR-', route: (pid) => `/app/product/${pid}/design-risk-controls?tab=requirements&sub=software-requirements` },
      { key: 'hardware_requirements', label: 'Hardware Requirements', table: 'requirement_specifications', idField: 'requirement_id', titleField: 'description', objectType: 'hardware_requirement', prefixFilter: 'HWR-', route: (pid) => `/app/product/${pid}/design-risk-controls?tab=requirements&sub=hardware-requirements` },
      { key: 'hazards', label: 'Hazards', table: 'hazards', idField: 'hazard_id', titleField: 'hazardous_situation', objectType: 'hazard', route: (pid) => `/app/product/${pid}/design-risk-controls?tab=risk-management` },
      { key: 'test_cases', label: 'Test Cases', table: 'test_cases', idField: 'test_id', titleField: 'title', objectType: 'test_case', route: (pid) => `/app/product/${pid}/design-risk-controls?tab=verification-validation` },
    ],
  },
  { key: 'capa', label: 'CAPA', table: 'capa_records', idField: 'capa_id', titleField: 'problem_description', objectType: 'capa', route: (pid) => `/app/product/${pid}/capa` },
];

const CATEGORIES = buildCategories();

function flattenLeaves(cats: CategoryDef[]): CategoryDef[] {
  const result: CategoryDef[] = [];
  for (const c of cats) {
    if (c.children) result.push(...flattenLeaves(c.children));
    else if (c.table) result.push(c);
  }
  return result;
}

// ---------- data fetching ----------
interface FetchedItem {
  id: string;
  display_id: string;
  title: string;
}

async function fetchCategoryItems(cat: CategoryDef, productId: string): Promise<FetchedItem[]> {
  if (!cat.table) return [];

  // Synthetic items for device definition tabs (no real DB table)
  if (cat.table === '__device_definition__') {
    return [{
      id: cat.idField, // tab key e.g. 'purpose'
      display_id: cat.label,
      title: cat.titleField,
    }];
  }

  // Special handling for document sub-categories
  if (cat.key === 'company_documents') {
    // First get the product's company_id
    const { data: product } = await supabase.from('products').select('company_id').eq('id', productId).single();
    if (!product?.company_id) return [];
    const { data } = await supabase
      .from('phase_assigned_document_template' as any)
      .select('id, name, updated_at')
      .eq('company_id', product.company_id)
      .eq('document_scope', 'company_document')
      .order('name');
    return ((data || []) as any[]).map(row => ({
      id: row.id,
      display_id: row.name || row.id.slice(0, 8),
      title: row.name || '—',
    }));
  }

  if (cat.key === 'device_core_documents') {
    const { data } = await supabase
      .from('phase_assigned_document_template' as any)
      .select('id, name, updated_at')
      .eq('product_id', productId)
      .is('phase_id', null)
      .order('name');
    // Deduplicate by name
    const seen = new Set<string>();
    return ((data || []) as any[]).filter(row => {
      if (seen.has(row.name)) return false;
      seen.add(row.name);
      return true;
    }).map(row => ({
      id: row.id,
      display_id: row.name || row.id.slice(0, 8),
      title: row.name || '—',
    }));
  }

  if (cat.key === 'device_phase_documents') {
    // Fetch documents with phase info
    const { data } = await supabase
      .from('phase_assigned_document_template' as any)
      .select('id, name, phase_id, updated_at')
      .eq('product_id', productId)
      .not('phase_id', 'is', null)
      .order('name');
    // Fetch phase names
    const phaseIds = [...new Set(((data || []) as any[]).map(r => r.phase_id).filter(Boolean))];
    let phaseMap: Record<string, string> = {};
    if (phaseIds.length > 0) {
      const { data: phases } = await supabase
        .from('lifecycle_phases' as any)
        .select('id, name')
        .in('id', phaseIds);
      phaseMap = Object.fromEntries(((phases || []) as any[]).map(p => [p.id, p.name]));
    }
    return ((data || []) as any[]).map(row => ({
      id: row.id,
      display_id: row.name || row.id.slice(0, 8),
      title: `${row.name || '—'} — ${phaseMap[row.phase_id] || 'Unknown Phase'}`,
    }));
  }

  // Default handling for other categories
  let query = supabase
    .from(cat.table as any)
    .select(`id, ${cat.idField}, ${cat.titleField}, updated_at`)
    .eq('product_id', productId);
  if (cat.prefixFilter) query = query.like(cat.idField, `${cat.prefixFilter}%`);
  const { data } = await query;
  return ((data || []) as any[]).map(row => ({
    id: row.id,
    display_id: row[cat.idField] || row.id.slice(0, 8),
    title: row[cat.titleField] || '—',
  }));
}

// ---------- Route resolver for object types ----------
function getRouteForType(objectType: string, productId: string): string {
  const routeMap: Record<string, string> = {
    user_need: `/app/product/${productId}/design-risk-controls?tab=requirements&sub=user-needs`,
    system_requirement: `/app/product/${productId}/design-risk-controls?tab=requirements&sub=system-requirements`,
    requirement_specification: `/app/product/${productId}/design-risk-controls?tab=requirements&sub=software-requirements`,
    software_requirement: `/app/product/${productId}/design-risk-controls?tab=requirements&sub=software-requirements`,
    hardware_requirement: `/app/product/${productId}/design-risk-controls?tab=requirements&sub=hardware-requirements`,
    hazard: `/app/product/${productId}/design-risk-controls?tab=risk-management`,
    test_case: `/app/product/${productId}/design-risk-controls?tab=verification-validation`,
    document: `/app/product/${productId}/documents`,
    gap_analysis_item: `/app/product/${productId}/gap-analysis`,
    activity: `/app/product/${productId}/activities`,
    product_audit: `/app/product/${productId}/audits`,
  };
  return routeMap[objectType] || `/app/product/${productId}`;
}

// ---------- component ----------
export default function DiscussionItemsFinder({ productId, reviewId, reviewMetadata, isCompleted, phaseName, baselineLabel, onManifestReady }: FinderProps) {
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<ViewMode>('module');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDiscoveryCategory, setSelectedDiscoveryCategory] = useState<DiscoveryCategoryDef['key'] | null>(null);
  const [categoryItems, setCategoryItems] = useState<FetchedItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Manifest from discovery service
  const [manifest, setManifest] = useState<ReviewManifest | null>(null);
  const [loadingManifest, setLoadingManifest] = useState(false);

  // Discussion items from metadata
  const discussionItems: DiscussionItem[] = useMemo(
    () => (reviewMetadata?.discussion_items as DiscussionItem[]) || [],
    [reviewMetadata?.discussion_items]
  );

  const selectedSet = useMemo(
    () => new Set(discussionItems.map(d => d.object_id)),
    [discussionItems]
  );

  const allLeaves = useMemo(() => flattenLeaves(CATEGORIES), []);
  const activeCat = allLeaves.find(c => c.key === selectedCategory);

  // Load item counts on mount
  useEffect(() => {
    const loadCounts = async () => {
      const counts: Record<string, number> = {};
      await Promise.all(
        allLeaves.map(async (cat) => {
          const items = await fetchCategoryItems(cat, productId);
          counts[cat.key] = items.length;
        })
      );
      setItemCounts(counts);
    };
    loadCounts();
  }, [productId]);

  // Run manifest discovery on mount
  useEffect(() => {
    runDiscovery();
  }, [productId, reviewId]);

  const runDiscovery = async () => {
    setLoadingManifest(true);
    try {
      const result = await discoverManifest(productId, reviewId, phaseName || null, baselineLabel || null);
      setManifest(result);
      onManifestReady?.(result);

      // Auto-populate on first load if no items selected
      if (discussionItems.length === 0 && !isCompleted) {
        const items: DiscussionItem[] = [];
        for (const entry of [...result.new_evidence, ...result.modified_objects]) {
          items.push({ object_type: entry.object_type, object_id: entry.object_id, display_id: entry.display_id, title: entry.title });
        }
        // Add compliance gaps as mandatory
        for (const gap of result.compliance_gaps) {
          if (!items.some(i => i.object_id === gap.object_id)) {
            items.push({ object_type: gap.object_type, object_id: gap.object_id, display_id: gap.display_id, title: gap.title });
          }
        }
        // Add risk delta items
        for (const rd of result.risk_delta) {
          if (!items.some(i => i.object_id === rd.object_id)) {
            items.push({ object_type: rd.object_type, object_id: rd.object_id, display_id: rd.display_id, title: rd.title });
          }
        }
        if (items.length > 0) await persistItems(items);
      }
    } catch (err) {
      console.error('Manifest discovery failed:', err);
    } finally {
      setLoadingManifest(false);
    }
  };

  // Load items when module category changes
  useEffect(() => {
    if (viewMode !== 'module' || !activeCat) { setCategoryItems([]); return; }
    setLoadingItems(true);
    fetchCategoryItems(activeCat, productId).then(items => {
      setCategoryItems(items);
      setLoadingItems(false);
    });
  }, [selectedCategory, productId, viewMode]);

  // Persist to metadata
  const persistItems = useCallback(async (items: DiscussionItem[]) => {
    const newMeta = { ...reviewMetadata, discussion_items: items };
    await supabase.from('design_reviews' as any).update({ metadata: newMeta } as any).eq('id', reviewId);
    queryClient.invalidateQueries({ queryKey: ['design-review', reviewId] });
  }, [reviewMetadata, reviewId, queryClient]);

  const toggleItem = useCallback((id: string, objectType: string, displayId: string, title: string, isMandatory = false) => {
    if (isCompleted || isMandatory) return;
    const exists = selectedSet.has(id);
    let next: DiscussionItem[];
    if (exists) {
      next = discussionItems.filter(d => d.object_id !== id);
    } else {
      next = [...discussionItems, { object_type: objectType, object_id: id, display_id: displayId, title }];
    }
    persistItems(next);
  }, [discussionItems, selectedSet, isCompleted, persistItems]);

  const selectAllInCategory = useCallback(() => {
    if (isCompleted || !activeCat) return;
    const toAdd = categoryItems
      .filter(i => !selectedSet.has(i.id))
      .map(i => ({ object_type: activeCat.objectType, object_id: i.id, display_id: i.display_id, title: i.title }));
    persistItems([...discussionItems, ...toAdd]);
  }, [categoryItems, discussionItems, selectedSet, activeCat, isCompleted, persistItems]);

  const deselectAllInCategory = useCallback(() => {
    if (isCompleted || !activeCat) return;
    const catIds = new Set(categoryItems.map(i => i.id));
    persistItems(discussionItems.filter(d => !catIds.has(d.object_id)));
  }, [categoryItems, discussionItems, activeCat, isCompleted, persistItems]);

  const selectedInCategory = categoryItems.filter(i => selectedSet.has(i.id)).length;
  const totalItems = Object.values(itemCounts).reduce((a, b) => a + b, 0);

  // Get discovery items for the selected discovery category
  const discoveryItems = useMemo(() => {
    if (!manifest || !selectedDiscoveryCategory) return [];
    return manifest[selectedDiscoveryCategory] || [];
  }, [manifest, selectedDiscoveryCategory]);

  // Compliance gap IDs (mandatory, cannot uncheck)
  const mandatoryIds = useMemo(() => {
    if (!manifest) return new Set<string>();
    return new Set(manifest.compliance_gaps.map(g => g.object_id));
  }, [manifest]);

  // ---------- render helpers ----------
  const renderCategoryNode = (cat: CategoryDef, depth = 0) => {
    const isLeaf = !cat.children && cat.table;
    const isActive = selectedCategory === cat.key;
    const count = itemCounts[cat.key];
    const hasSelectedItems = isLeaf && discussionItems.some(d => d.object_type === cat.objectType);

    if (cat.children) {
      const isOpen = openGroups[cat.key] ?? false;
      return (
        <Collapsible key={cat.key} open={isOpen} onOpenChange={(v) => setOpenGroups(prev => ({ ...prev, [cat.key]: v }))}>
          <CollapsibleTrigger className="flex items-center gap-1.5 w-full px-2 py-1.5 text-sm hover:bg-muted/50 rounded transition-colors">
            {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            {isOpen ? <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" /> : <Folder className="h-3.5 w-3.5 text-muted-foreground" />}
            <span className="font-medium">{cat.label}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="ml-4">
            {cat.children.map(child => renderCategoryNode(child, depth + 1))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <button
        key={cat.key}
        onClick={() => { setSelectedCategory(cat.key); setSelectedDiscoveryCategory(null); }}
        className={cn(
          'flex items-center justify-between w-full px-2 py-1.5 text-sm rounded transition-colors text-left',
          isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50',
        )}
      >
        <span className="flex items-center gap-1.5">
          {hasSelectedItems && <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />}
          {cat.label}
        </span>
        {count !== undefined && count > 0 && (
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{count}</Badge>
        )}
      </button>
    );
  };

  const renderDiscoveryCategory = (cat: DiscoveryCategoryDef) => {
    const isActive = selectedDiscoveryCategory === cat.key;
    const count = manifest ? (manifest[cat.key] as any[])?.length || 0 : 0;

    return (
      <button
        key={cat.key}
        onClick={() => { setSelectedDiscoveryCategory(cat.key); setSelectedCategory(null); }}
        className={cn(
          'flex items-center justify-between w-full px-2 py-1.5 text-sm rounded transition-colors text-left',
          isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50',
        )}
      >
        <span className="flex items-center gap-1.5">
          {cat.icon}
          {cat.label}
        </span>
        {count > 0 && (
          <Badge className={cn('text-[10px] h-5 px-1.5', cat.badgeClass)}>{count}</Badge>
        )}
      </button>
    );
  };

  // Render right panel for discovery mode
  const renderDiscoveryItems = () => {
    if (!selectedDiscoveryCategory || !manifest) {
      return <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">{lang('designReview.selectDiscoveryCategory')}</div>;
    }

    const items = discoveryItems as any[];
    if (items.length === 0) {
      return <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">{lang('designReview.noItemsInCategory')}</div>;
    }

    const isGapCategory = selectedDiscoveryCategory === 'compliance_gaps';
    const isRiskCategory = selectedDiscoveryCategory === 'risk_delta';

    return (
      <>
        <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/10 text-xs">
          <span className="font-medium">{DISCOVERY_CATEGORIES.find(c => c.key === selectedDiscoveryCategory)?.label}</span>
          <span className="ml-auto text-muted-foreground">{lang('designReview.itemsCount', { count: items.length })}</span>
        </div>
        <ScrollArea className="flex-1 h-[300px]">
          <div className="divide-y">
            {items.map((item: any) => {
              const isMandatory = isGapCategory || mandatoryIds.has(item.object_id);
              const isSelected = selectedSet.has(item.object_id);

              return (
                <div
                  key={item.object_id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/30 transition-colors',
                    isSelected && 'bg-primary/5',
                    isMandatory && 'bg-red-50/50 dark:bg-red-950/10',
                  )}
                >
                  <Checkbox
                    checked={isSelected || isMandatory}
                    disabled={isCompleted || isMandatory}
                    onCheckedChange={() => toggleItem(item.object_id, item.object_type, item.display_id, item.title, isMandatory)}
                  />
                  {isMandatory && <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />}
                  <span className="font-mono text-xs text-muted-foreground w-24 flex-shrink-0">{item.display_id}</span>
                  <span className="flex-1 truncate">{item.title}</span>

                  {/* Risk delta badges */}
                  {isRiskCategory && (item as RiskDeltaEntry).previous_risk_level && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Badge variant="outline" className="text-[10px] h-5">{(item as RiskDeltaEntry).previous_risk_level}</Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge className="text-[10px] h-5 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                        {(item as RiskDeltaEntry).current_risk_level}
                      </Badge>
                    </div>
                  )}

                  {/* Compliance gap description */}
                  {isGapCategory && (
                    <span className="text-xs text-destructive flex-shrink-0 max-w-[160px] truncate">
                      {(item as ComplianceGapEntry).gap_description}
                    </span>
                  )}

                  <button
                    onClick={() => navigate(getRouteForType(item.object_type, productId))}
                    className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                    title={lang('designReview.openInModule')}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          {lang('designReview.reviewScopeArtifacts')}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'module' ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setViewMode('module')}
          >
            {lang('designReview.byModule')}
          </Button>
          <Button
            variant={viewMode === 'discovery' ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setViewMode('discovery')}
          >
            {lang('designReview.byDiscoveryType')}
          </Button>
          {loadingManifest && <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {viewMode === 'module'
          ? lang('designReview.browseCategories')
          : lang('designReview.viewByDiscovery')}
      </p>

      <div className="border rounded-lg overflow-hidden flex" style={{ height: 400 }}>
        {/* Left Panel */}
        <div className="w-56 border-r bg-muted/20 flex-shrink-0">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-0.5">
              {/* Baseline Freeze pinned entry */}
              {viewMode === 'module' && baselineLabel && (
                <button
                  onClick={() => {
                    const el = document.getElementById('gate-criteria');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 w-full px-2 py-2 text-sm rounded transition-colors hover:bg-primary/10 text-primary font-semibold border border-primary/20 bg-primary/5 mb-1"
                >
                  <Snowflake className="h-3.5 w-3.5" />
                  {formatBaselineLabel(baselineLabel)} {lang('designReview.freeze')}
                </button>
              )}
              {viewMode === 'module'
                ? CATEGORIES.map(cat => renderCategoryNode(cat))
                : DISCOVERY_CATEGORIES.map(cat => renderDiscoveryCategory(cat))
              }
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col">
          {viewMode === 'module' ? (
            // Module mode — existing behavior
            !selectedCategory ? (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                {lang('designReview.selectCategory')}
              </div>
            ) : loadingItems ? (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">{lang('designReview.loading')}</div>
            ) : categoryItems.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">{lang('designReview.noItemsInCategory')}</div>
            ) : (
              <>
                {!isCompleted && (
                  <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/10 text-xs">
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={selectAllInCategory}>
                      <CheckSquare className="h-3 w-3 mr-1" /> {lang('designReview.selectAll')}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={deselectAllInCategory}>
                      <Square className="h-3 w-3 mr-1" /> {lang('designReview.deselectAll')}
                    </Button>
                    <span className="ml-auto text-muted-foreground">{lang('designReview.selectedOfTotal', { selected: selectedInCategory, total: categoryItems.length })}</span>
                  </div>
                )}
                <ScrollArea className="flex-1 h-[300px]">
                  <div className="divide-y">
                    {categoryItems.map(item => (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/30 transition-colors',
                          selectedSet.has(item.id) && 'bg-primary/5',
                        )}
                      >
                        <Checkbox
                          checked={selectedSet.has(item.id)}
                          disabled={isCompleted}
                          onCheckedChange={() => activeCat && toggleItem(item.id, activeCat.objectType, item.display_id, item.title)}
                        />
                        <span className="font-mono text-xs text-muted-foreground w-24 flex-shrink-0">{item.display_id}</span>
                        <span className="flex-1 truncate">{item.title}</span>
                        {activeCat && (
                          <button
                            onClick={() => navigate(activeCat.route(productId))}
                            className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                            title={lang('designReview.openInModule')}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )
          ) : (
            // Discovery mode
            renderDiscoveryItems()
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground px-1">
        <span>{lang('designReview.totalItemsAcrossCategories', { count: totalItems })}</span>
        <div className="flex items-center gap-3">
          {manifest && manifest.compliance_gaps.length > 0 && (
            <span className="text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {lang('designReview.complianceGapsCount', { count: manifest.compliance_gaps.length })}
            </span>
          )}
          <span>{lang('designReview.selectedForDiscussion', { count: discussionItems.length })}</span>
        </div>
      </div>
    </div>
  );
}
