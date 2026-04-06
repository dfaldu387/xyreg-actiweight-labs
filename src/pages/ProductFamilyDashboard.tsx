import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProductNavigationTracker } from '@/components/product/ProductNavigationTracker';
import { ProductPageHeader } from "@/components/product/layout/ProductPageHeader";
import { useDeviceFamily, DeviceFamilyProduct } from '@/hooks/useDeviceFamilies';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X, Sparkles, Loader2 } from "lucide-react";
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mapDBStatusToUI } from "@/utils/statusUtils";
import { useVariationDimensions, ProductVariantOptionEntry } from "@/hooks/useVariationDimensions";
import { useProductMarketStatus } from "@/hooks/useProductMarketStatus";
import { useBasicUDIAliases } from "@/hooks/useBasicUDIAliases";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";
import { RichTextField } from "@/components/shared/RichTextField";
import { AIContextSourcesPanel } from "@/components/product/ai-assistant/AIContextSourcesPanel";
import { SaveDescriptionAsDocCIDialog } from "@/components/product/family/SaveDescriptionAsDocCIDialog";
import { DocumentDraftDrawer } from "@/components/product/documents/DocumentDraftDrawer";

export default function ProductFamilyDashboard() {
  const { masterProductId } = useParams<{ masterProductId: string }>();
  const navigate = useNavigate();

  const { companyId, companyName, isLoading: isCompanyLoading, refreshContext } =  useCurrentCompany();

  const [searchQuery, setSearchQuery] = useState('');
  const [variantOptionFilter, setVariantOptionFilter] = useState<string | null>(null);
  const [showSaveDocDialogFromHeader, setShowSaveDocDialogFromHeader] = useState(false);

  useEffect(() => {
    refreshContext();
  }, [refreshContext]);

  // Fetch the device family (master + variants)
  const { data: family, isLoading, error, refetch, isFetching } = useDeviceFamily(masterProductId, companyId || undefined);

  // Combine master + variants into a single list for display
  const allFamilyDevices = useMemo(() => {
    if (!family) return [];
    return [family.master, ...family.variants];
  }, [family]);

  const mainDevice = family?.master || null;
  // Resolve basicUdiDi: check master first, then scan all variants for a shared value
  const basicUdiDi = useMemo(() => {
    if (mainDevice?.basic_udi_di) return mainDevice.basic_udi_di;
    const fromVariant = allFamilyDevices.find(d => d.basic_udi_di)?.basic_udi_di;
    return fromVariant || '';
  }, [mainDevice, allFamilyDevices]);
  
  const { getAlias, getDescription, saveDescription } = useBasicUDIAliases(companyId || null);
  // Look up alias: try actual Basic UDI-DI first, then master product ID (sidebar saves aliases keyed by master ID)
  // Skip aliases that are identical to the key (not a real rename)
  const udiAlias = basicUdiDi ? getAlias(basicUdiDi) : null;
  const masterIdAlias = masterProductId ? getAlias(masterProductId) : null;
  const familyAlias = (udiAlias && udiAlias !== basicUdiDi ? udiAlias : null) || masterIdAlias || null;
  const familyDescription = (basicUdiDi ? getDescription(basicUdiDi) : null) || (masterProductId ? getDescription(masterProductId) : null);
  const displayName = familyAlias || mainDevice?.trade_name || mainDevice?.name || 'Unknown Device Family';

  const marketStatus = useProductMarketStatus((mainDevice as any)?.markets);

  const statusCategory = (status?: string) => {
    const normalized = (status || '').toLowerCase();
    if (normalized.includes('launch') || normalized.includes('market')) return 'launched';
    
    if (normalized.includes('regulatory')) return 'regulatory';
    if (normalized.includes('retire') || normalized.includes('inactive')) return 'retired';
    if (normalized.includes('v&v') || normalized.includes('validation')) return 'designvv';
    return 'development';
  };

  const portfolioCounts = useMemo(() => {
    if (!allFamilyDevices.length) return { total: 0, launched: 0, development: 0, concept: 0, regulatory: 0, designvv: 0, retired: 0 };
    return allFamilyDevices.reduce(
      (acc, device) => {
        const category = statusCategory(device.status || undefined);
        acc.total += 1;
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      { total: 0, launched: 0, development: 0, concept: 0, regulatory: 0, designvv: 0, retired: 0 } as Record<string, number>
    );
  }, [allFamilyDevices]);

  const actionItems = useMemo(() => {
    return allFamilyDevices.filter((device) => {
      const normalized = (device.status || '').toLowerCase();
      return normalized.includes('overdue') || normalized.includes('hold') || normalized.includes('risk');
    }).length;
  }, [allFamilyDevices]);

  const getVariantType = useCallback((device: DeviceFamilyProduct) => {
    return 'Family Member';
  }, []);

  const familyDeviceIds = useMemo(
    () => allFamilyDevices.map((device) => device.id),
    [allFamilyDevices]
  );

  const {
    dimensions: variantDimensions,
    productVariantOptions
  } = useVariationDimensions(companyId || '', { productIds: familyDeviceIds });

  const filteredVariantRows = useMemo(() => {
    if (!allFamilyDevices.length) return [];
    let filtered = [...allFamilyDevices];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((device) => {
        const name = (device.trade_name || device.name || '').toLowerCase();
        const udiDi = (device.udi_di || '').toLowerCase();
        return name.includes(query) || udiDi.includes(query);
      });
    }

    if (variantOptionFilter) {
      filtered = filtered.filter((device) => {
        const options = productVariantOptions?.[device.id] || [];
        return options.some((option) => {
          const optionKey = `${option.dimensionId}:${option.optionId || ''}`;
          return optionKey === variantOptionFilter;
        });
      });
    }

    // Sort: master first, then variants
    return filtered.sort((a, b) => {
      if (a.is_master_device && !b.is_master_device) return -1;
      if (!a.is_master_device && b.is_master_device) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [allFamilyDevices, searchQuery, variantOptionFilter, productVariantOptions]);

  const pipelineSegments = [
    { label: 'Concept', value: portfolioCounts.concept || 0, color: '#1D4ED8' },
    { label: 'Design & V&V', value: portfolioCounts.designvv || 0, color: '#2563EB' },
    { label: 'Regulatory', value: portfolioCounts.regulatory || 0, color: '#0EA5E9' },
    { label: 'In Development', value: portfolioCounts.development || 0, color: '#22C55E' },
    { label: 'Launched', value: portfolioCounts.launched || 0, color: '#0F9D58' },
  ];

  const pipelineTotal = pipelineSegments.reduce((sum, seg) => sum + seg.value, 0) || 1;

  const handleRefreshData = useCallback(() => {
    refetch();
  }, [refetch]);

  const isWaitingForData = isLoading || isCompanyLoading || !companyId;

  if (isWaitingForData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading device family...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-destructive">Error loading device family</h2>
          <p className="text-muted-foreground">Failed to load the device family.</p>
        </div>
      </div>
    );
  }

  if (!family || allFamilyDevices.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">No devices found</h2>
          <p className="text-muted-foreground">No device family found for this master device.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ProductNavigationTracker />
      <div className="flex h-full min-h-0 flex-col">
        {mainDevice && (
          <ProductPageHeader
            product={mainDevice as any}
            subsection="Device Family Overview"
            onRefresh={handleRefreshData}
            isRefreshing={isFetching}
            marketStatus={marketStatus}
            displayNameOverride={displayName}
            onCreateDocument={() => setShowSaveDocDialogFromHeader(true)}
          />
        )}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full py-2 sm:py-3 lg:py-4">
            <FamilyDeviceDashboard
              masterDevice={mainDevice!}
              allFamilyDevices={allFamilyDevices}
              portfolioCounts={portfolioCounts}
              actionItems={actionItems}
              pipelineSegments={pipelineSegments}
              pipelineTotal={pipelineTotal}
              filteredVariantRows={filteredVariantRows}
              variantDimensions={variantDimensions}
              productVariantOptions={productVariantOptions}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              variantOptionFilter={variantOptionFilter}
              setVariantOptionFilter={setVariantOptionFilter}
              getVariantType={getVariantType}
              familyAlias={familyAlias}
              familyDescription={familyDescription}
              onSaveDescription={(desc) => {
                if (basicUdiDi) saveDescription({ basicUdiDi, description: desc });
              }}
              companyId={companyId || ''}
              companyName={companyName || ''}
              externalShowSaveDocDialog={showSaveDocDialogFromHeader}
              onExternalShowSaveDocDialogChange={setShowSaveDocDialogFromHeader}
            />
          </div>
        </div>
      </div>
    </>
  );
}

interface FamilyDeviceDashboardProps {
  masterDevice: DeviceFamilyProduct;
  allFamilyDevices: DeviceFamilyProduct[];
  portfolioCounts: Record<string, number>;
  actionItems: number;
  pipelineSegments: Array<{ label: string; value: number; color: string }>;
  pipelineTotal: number;
  filteredVariantRows: DeviceFamilyProduct[];
  variantDimensions: { id: string; name: string; is_active: boolean }[];
  productVariantOptions: Record<string, ProductVariantOptionEntry[]>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  variantOptionFilter: string | null;
  setVariantOptionFilter: (filter: string | null) => void;
  getVariantType: (device: DeviceFamilyProduct) => string;
  familyAlias: string | null;
  familyDescription: string | null;
  onSaveDescription: (description: string) => void;
  companyId: string;
  companyName: string;
  externalShowSaveDocDialog?: boolean;
  onExternalShowSaveDocDialogChange?: (open: boolean) => void;
}

function FamilyDeviceDashboard({
  masterDevice,
  allFamilyDevices,
  portfolioCounts,
  actionItems,
  pipelineSegments,
  pipelineTotal,
  filteredVariantRows,
  variantDimensions,
  productVariantOptions,
  searchQuery,
  setSearchQuery,
  variantOptionFilter,
  setVariantOptionFilter,
  getVariantType,
  familyAlias,
  familyDescription,
  onSaveDescription,
  companyId,
  companyName,
  externalShowSaveDocDialog,
  onExternalShowSaveDocDialogChange,
}: FamilyDeviceDashboardProps) {
  const navigate = useNavigate();
  const displayName = familyAlias || masterDevice.trade_name || masterDevice.name || 'Unknown';
  const variantCount = allFamilyDevices.length - 1;
  const familyDeviceIds = allFamilyDevices.map((device) => device.id);

  const [localDescription, setLocalDescription] = useState(familyDescription || '');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPreviewContent, setAiPreviewContent] = useState('');
  const [showSaveDocDialog, setShowSaveDocDialog] = useState(false);
  const [draftDrawerDoc, setDraftDrawerDoc] = useState<{ id: string; name: string; type: string } | null>(null);
  const debouncedDescription = useDebounce(localDescription, 1500);

  // Sync external "Create Document" trigger from header
  useEffect(() => {
    if (externalShowSaveDocDialog) {
      setShowSaveDocDialog(true);
      onExternalShowSaveDocDialogChange?.(false);
    }
  }, [externalShowSaveDocDialog, onExternalShowSaveDocDialogChange]);

  useEffect(() => {
    if (familyDescription !== null && familyDescription !== localDescription) {
      setLocalDescription(familyDescription);
    }
  }, [familyDescription]);

  // Auto-save on debounce
  useEffect(() => {
    if (debouncedDescription !== (familyDescription || '')) {
      onSaveDescription(debouncedDescription);
    }
  }, [debouncedDescription]);

  const handleGenerateAIDescription = useCallback(async (): Promise<string | null> => {
    try {
      const variantSummaries = allFamilyDevices.map(d => ({
        name: d.trade_name || d.name,
        status: d.status || 'Unknown',
        isFamilyMember: true,
        lifecycle: d.current_lifecycle_phase || 'Unknown',
      }));

      const prompt = `You are writing a product family description for a medical device Technical File.

Family Name: ${displayName}
Total Devices: ${allFamilyDevices.length}

Devices in this family:
${variantSummaries.map(v => `- ${v.name} (Status: ${v.status}, Phase: ${v.lifecycle})`).join('\n')}

Write a comprehensive, professional product family description that:
1. Opens with a clear statement of the family's shared therapeutic/clinical purpose
2. Describes the common design characteristics and technology platform
3. Explains how variants differ (sizes, configurations, intended patient populations)
4. Covers target markets and clinical positioning
5. Notes the regulatory grouping rationale for this device family

Use formal medical device industry language suitable for a Technical File or Design History File. Be specific and authoritative. Format with HTML paragraphs and lists.`;

      const { data, error } = await supabase.functions.invoke('ai-content-generator', {
        body: { prompt, sectionTitle: 'Product Family Description', companyId },
      });

      if (error) throw error;
      return data?.content || null;
    } catch (err) {
      console.error('[AI Family Description] Error:', err);
      return null;
    }
  }, [allFamilyDevices, displayName, companyId]);

  return (
    <div className="space-y-6">
      {/* AI Generation Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate Family Description
            </DialogTitle>
            <DialogDescription>
              AI will use the following context to generate a professional product family description.
            </DialogDescription>
          </DialogHeader>

          <AIContextSourcesPanel
            productId={masterDevice.id}
            additionalSources={[
              `${allFamilyDevices.length} Family Devices`,
              ...allFamilyDevices.slice(0, 3).map(d => d.trade_name || d.name),
            ]}
            mode="select"
            onPromptChange={() => {}}
            onLanguageChange={() => {}}
          />

          <div className="text-xs text-muted-foreground space-y-1 border rounded-md p-3 bg-muted/20 max-h-[20vh] overflow-y-auto">
            <p className="font-medium text-foreground mb-1">Variant data included:</p>
            {allFamilyDevices.map(d => (
              <p key={d.id}>• {d.trade_name || d.name} — {d.status || 'No status'} ({d.current_lifecycle_phase || 'N/A'})</p>
            ))}
          </div>

          {aiPreviewContent && (
            <div className="border rounded-md p-3 max-h-[30vh] overflow-y-auto prose prose-sm">
              <p className="text-xs font-medium text-muted-foreground mb-1">Preview:</p>
              <div dangerouslySetInnerHTML={{ __html: aiPreviewContent }} />
            </div>
          )}

          <DialogFooter className="gap-2">
            {aiPreviewContent ? (
              <>
                <Button variant="outline" size="sm" onClick={() => { setAiPreviewContent(''); }}>
                  Regenerate
                </Button>
                <Button size="sm" onClick={() => {
                  setLocalDescription(aiPreviewContent);
                  onSaveDescription(aiPreviewContent);
                  setShowAIDialog(false);
                  setAiPreviewContent('');
                }}>
                  Apply Description
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={async () => {
                  setIsGeneratingAI(true);
                  try {
                    const result = await handleGenerateAIDescription();
                    if (result) setAiPreviewContent(result);
                  } finally {
                    setIsGeneratingAI(false);
                  }
                }}
                disabled={isGeneratingAI}
                className="gap-1.5"
              >
                {isGeneratingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isGeneratingAI ? 'Generating...' : 'Generate'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Document Dialog */}
      <SaveDescriptionAsDocCIDialog
        open={showSaveDocDialog}
        onOpenChange={setShowSaveDocDialog}
        description={localDescription}
        familyName={displayName}
        companyId={masterDevice.company_id || companyId}
        companyName={companyName || ''}
        
        masterDeviceId={masterDevice.id}
        devices={allFamilyDevices.map(d => ({ id: d.id, name: d.trade_name || d.name || d.id }))}
        onDocumentCreated={(docId, docName, docType) => setDraftDrawerDoc({ id: docId, name: docName, type: docType })}
      />
      <DocumentDraftDrawer
        open={!!draftDrawerDoc}
        onOpenChange={(open) => { if (!open) setDraftDrawerDoc(null); }}
        documentId={draftDrawerDoc?.id || ''}
        documentName={draftDrawerDoc?.name || ''}
        documentType={draftDrawerDoc?.type || ''}
        companyId={masterDevice.company_id || companyId}
      />

      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="pb-4">
          {/* Compact info line */}
          <p className="text-muted-foreground text-sm">
            {allFamilyDevices.length} Device{allFamilyDevices.length !== 1 ? 's' : ''} in Family
          </p>
          {/* Family Description - Rich Text */}
          <div className="mt-3">
            <div className="flex items-center gap-1.5 mb-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Family Description
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setAiPreviewContent(''); setShowAIDialog(true); }}
                      className="h-5 w-5"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>AI Generate</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <RichTextField
              value={localDescription}
              onChange={setLocalDescription}
              placeholder="Describe the complete device family — intended purpose, shared characteristics, market positioning..."
              minHeight="80px"
              maxHeight="25vh"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-4 md:grid-cols-2">
            <div className="rounded-2xl p-4 text-white bg-gradient-to-br from-[#1E3A8A] to-[#1D4ED8] shadow-lg">
              <p className="text-xs uppercase tracking-wide">Family Portfolio Status</p>
              <div className="text-4xl font-bold mt-2">{portfolioCounts.total}</div>
              <ul className="mt-3 space-y-1 text-sm text-white/90">
                <li>• {portfolioCounts.launched} Launched</li>
                <li>• {portfolioCounts.development} In Development</li>
                <li>• {portfolioCounts.retired} Retired</li>
              </ul>
            </div>
            <div className="rounded-2xl p-4 bg-gradient-to-br from-[#0F9D58] to-[#22C55E] text-white shadow-lg">
              <p className="text-xs uppercase tracking-wide">Pipeline Health</p>
              <div className="text-2xl font-semibold mt-2">
                Active Development: {portfolioCounts.development}
              </div>
              <p className="text-sm text-white/80 mt-1">
                {portfolioCounts.development} variants approaching key gates
              </p>
              <div className="mt-3 h-2 rounded-full bg-white/30 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${Math.min(100, (portfolioCounts.development / portfolioCounts.total) * 100)}%` }}
                />
              </div>
            </div>
            <div className="rounded-2xl p-4 bg-gradient-to-br from-[#312E81] to-[#4338CA] text-white shadow-lg">
              <p className="text-xs uppercase tracking-wide">Post-Market Compliance</p>
              <div className="text-2xl font-semibold mt-2">{portfolioCounts.launched} On Market</div>
              <p className="text-sm text-white/80 mt-1">
                {actionItems} CAPAs active • No critical holds detected
              </p>
            </div>
            <div className="rounded-2xl p-4 bg-gradient-to-br from-[#991B1B] to-[#DC2626] text-white shadow-lg">
              <p className="text-xs uppercase tracking-wide">Family Action Items</p>
              <div className="text-2xl font-semibold mt-2">{actionItems}</div>
              <p className="text-sm text-white/80 mt-1">Require immediate follow-up</p>
            </div>
          </div>

          <div className="rounded-2xl border bg-card shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Family Pipeline Distribution</h3>
                <p className="text-sm text-muted-foreground">Across all variants in the device family</p>
              </div>
              <Badge variant="outline" className="text-sm">
                {pipelineTotal} Total
              </Badge>
            </div>
            <div className="flex items-stretch rounded-xl overflow-hidden border">
              {pipelineSegments.map((segment) => (
                <div
                  key={segment.label}
                  className="h-10 flex items-center justify-center text-xs font-semibold text-white"
                  style={{
                    width: `${(segment.value / pipelineTotal) * 100}%`,
                    backgroundColor: segment.color
                  }}
                >
                  {segment.value > 0 && (
                    <span className="px-2 text-white/90">
                      {segment.label} ({segment.value})
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {pipelineSegments.map((segment) => (
                <div key={segment.label} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: segment.color }} />
                  <span>{segment.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-card shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Detailed Variant List</h3>
                <p className="text-sm text-muted-foreground">
                  All variants in the {displayName} family
                </p>
              </div>
              <Badge variant="secondary">Master + {variantCount} Variants</Badge>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search variants by name or UDI-DI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Variant Options
                    {variantOptionFilter && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        1
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 max-h-[400px] overflow-y-auto">
                  <DropdownMenuLabel>Filter by Variant Option</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setVariantOptionFilter(null)}
                    className={!variantOptionFilter ? 'bg-accent' : ''}
                  >
                    All Options
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {(() => {
                    const allOptions = new Map<string, { dimensionName: string; optionName: string; key: string }>();
                    familyDeviceIds.forEach((deviceId) => {
                      const options = productVariantOptions?.[deviceId] || [];
                      options.forEach((option) => {
                        const key = `${option.dimensionId}:${option.optionId || ''}`;
                        if (!allOptions.has(key)) {
                          allOptions.set(key, {
                            dimensionName: option.dimensionName || 'Unknown',
                            optionName: option.optionName || option.valueText || 'Unknown',
                            key,
                          });
                        }
                      });
                    });
                    const groupedByDimension = new Map<string, Array<{ dimensionName: string; optionName: string; key: string }>>();
                    allOptions.forEach((option) => {
                      if (!groupedByDimension.has(option.dimensionName)) {
                        groupedByDimension.set(option.dimensionName, []);
                      }
                      groupedByDimension.get(option.dimensionName)!.push(option);
                    });
                    return Array.from(groupedByDimension.entries()).map(([dimensionName, options]) => (
                      <div key={dimensionName}>
                        <DropdownMenuLabel className="text-xs text-muted-foreground mt-2">{dimensionName}</DropdownMenuLabel>
                        {options.map((option) => (
                          <DropdownMenuItem
                            key={option.key}
                            onClick={() => setVariantOptionFilter(variantOptionFilter === option.key ? null : option.key)}
                            className={variantOptionFilter === option.key ? 'bg-accent' : ''}
                          >
                            {option.optionName}
                          </DropdownMenuItem>
                        ))}
                      </div>
                    ));
                  })()}
                  {variantOptionFilter && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setVariantOptionFilter(null)} className="text-destructive">
                        Clear Filter
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="pb-3">Device Name/SKU</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Variant Options</th>
                    <th className="pb-3">Current Phase</th>
                    <th className="pb-3">Status Tag</th>
                    <th className="pb-3">Health / Actions</th>
                    <th className="pb-3">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredVariantRows.map((device) => {
                    const statusLabel = String(mapDBStatusToUI(device.status || 'Not Started'));
                    const updatedAt = device.updated_at
                      ? new Date(device.updated_at).toLocaleDateString()
                      : '—';
                    const deviceUrl = `/app/product/${device.id}`;
                    const role = getVariantType(device);
                    return (
                      <tr
                        key={device.id}
                        onClick={() => navigate(deviceUrl)}
                        className="group cursor-pointer transition-all bg-transparent hover:bg-accent/40"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            navigate(deviceUrl);
                          }
                        }}
                      >
                        <td className="py-3 font-medium">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="group-hover:text-primary group-hover:underline transition-colors">
                                {device.trade_name || device.name || 'Unnamed Device'}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">{device.udi_di || 'No UDI-DI'}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge variant={role === 'Master' ? 'default' : 'secondary'} className="text-xs">
                            {role}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <VariantOptionBadges
                            deviceId={device.id}
                            variantDimensions={variantDimensions}
                            productVariantOptions={productVariantOptions}
                          />
                        </td>
                        <td className="py-3 group-hover:text-primary transition-colors">
                          {device.current_lifecycle_phase || 'Not Assigned'}
                        </td>
                        <td className="py-3">
                          <Badge variant={statusLabel === 'Launched' ? 'default' : 'outline'} className="capitalize">
                            {statusLabel}
                          </Badge>
                        </td>
                        <td className="py-3 text-muted-foreground group-hover:text-primary transition-colors">
                          {statusLabel === 'Launched' ? 'On Track' : 'Needs Attention'}
                        </td>
                        <td className="py-3 text-muted-foreground group-hover:text-primary transition-colors">
                          {updatedAt}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface VariantOptionBadgesProps {
  deviceId: string;
  variantDimensions: { id: string; name: string; is_active: boolean }[];
  productVariantOptions: Record<string, ProductVariantOptionEntry[]>;
}

function VariantOptionBadges({ deviceId, variantDimensions, productVariantOptions }: VariantOptionBadgesProps) {
  const options = productVariantOptions?.[deviceId] || [];

  if (!options.length) {
    return <span className="text-muted-foreground">No options tracked</span>;
  }

  const optionMap = new Map(options.map((entry) => [entry.dimensionId, entry]));

  const orderedEntries =
    (variantDimensions || []).length > 0
      ? variantDimensions
        .filter((dimension) => optionMap.has(dimension.id))
        .map((dimension) => {
          const entry = optionMap.get(dimension.id)!;
          return { ...entry, dimensionName: entry.dimensionName || dimension.name };
        })
      : options;

  if (!orderedEntries.length) {
    return <span className="text-muted-foreground">No options tracked</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {orderedEntries.map((entry) => (
        <Badge
          key={`${deviceId}-${entry.dimensionId}`}
          variant="outline"
          className="text-xs font-medium"
        >
          <span className="text-muted-foreground">{entry.dimensionName || 'Option'}:</span>
          <span className="ml-1">{entry.optionName || entry.valueText || '—'}</span>
        </Badge>
      ))}
    </div>
  );
}
