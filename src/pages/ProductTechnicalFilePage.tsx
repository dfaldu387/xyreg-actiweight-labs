import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TECHNICAL_FILE_SECTIONS } from '@/types/designReview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FileText, Globe, CheckCircle2, Clock, AlertCircle, Upload, Save, Link2, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { TechnicalFileDocumentPicker } from '@/components/technical-file/TechnicalFileDocumentPicker';

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned', icon: Clock, color: 'bg-muted text-muted-foreground' },
  { value: 'submitted', label: 'Submitted', icon: Upload, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'approved', label: 'Approved', icon: CheckCircle2, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'rejected', label: 'Rejected', icon: AlertCircle, color: 'bg-destructive/10 text-destructive' },
];

interface MarketApproval {
  id?: string;
  market_code: string;
  status: string;
  certificate_number: string;
  approval_date: string;
  notes: string;
}

/** Parse product.markets JSON into an array of market code strings */
function parseProductMarkets(markets: any): string[] {
  if (!markets) return [];
  let arr: any[] = [];
  if (Array.isArray(markets)) {
    arr = markets;
  } else if (typeof markets === 'string') {
    try { arr = JSON.parse(markets); } catch { arr = markets.split(',').map((m: string) => m.trim()); }
  } else if (typeof markets === 'object') {
    arr = [markets];
  }
  const result = new Set<string>();
  arr.forEach((m: any) => {
    if (typeof m === 'string') result.add(m.toUpperCase());
    else if (m?.code) result.add(m.code.toUpperCase());
    else if (m?.name) result.add(m.name.toUpperCase());
    else if (m?.market) result.add(m.market.toUpperCase());
  });
  return Array.from(result).sort();
}

function TechnicalFileSectionsTab({ productId }: { productId: string }) {
  const [pickerSection, setPickerSection] = useState<{ id: string; label: string } | null>(null);

  // Fetch linked document IDs per section
  const { data: allLinks } = useQuery({
    queryKey: ['tf-section-documents', productId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('technical_file_document_links')
        .select('section_id, document_id')
        .eq('product_id', productId);
      if (error) throw error;
      return (data || []) as Array<{ section_id: string; document_id: string }>;
    },
  });

  // Fetch document details for linked docs
  const linkedDocIds = [...new Set((allLinks || []).map(l => l.document_id))];
  const { data: documents } = useQuery({
    queryKey: ['tf-linked-doc-details', productId, linkedDocIds.join(',')],
    queryFn: async () => {
      if (linkedDocIds.length === 0) return [];
      const { data, error } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name, document_type, status')
        .in('id', linkedDocIds);
      if (error) throw error;
      return data || [];
    },
    enabled: linkedDocIds.length > 0,
  });

  const docMap = new Map((documents || []).map(d => [d.id, d]));

  const getDocsForSection = (sectionId: string) => {
    const docIds = (allLinks || []).filter(l => l.section_id === sectionId).map(l => l.document_id);
    return docIds.map(id => docMap.get(id)).filter(Boolean) as Array<{ id: string; name: string; document_type: string | null; status: string | null }>;
  };

  return (
    <>
      <Accordion type="multiple" className="space-y-2">
        {TECHNICAL_FILE_SECTIONS.map((section) => {
          const sectionDocs = getDocsForSection(section.id);
          return (
            <AccordionItem key={section.id} value={section.id} className="border rounded-lg bg-card">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="font-mono text-xs shrink-0 cursor-help">
                          §{section.section}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs text-xs">
                        {section.description}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div>
                    <div className="font-semibold text-sm">{section.label}</div>
                    <div className="text-xs text-muted-foreground">{section.focus}</div>
                  </div>
                  <Badge variant="secondary" className="ml-auto text-xs shrink-0">
                    {sectionDocs.length} doc{sectionDocs.length !== 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {section.legalReference}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="flex justify-end mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPickerSection({ id: section.id, label: `${section.id} — ${section.label}` })}
                  >
                    <Link2 className="h-3.5 w-3.5 mr-1.5" />
                    Link Documents
                  </Button>
                </div>
                {sectionDocs.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic py-4 text-center">
                    No documents linked to this section yet. Click "Link Documents" to assign compliance documents.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sectionDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{doc.name}</span>
                        </div>
                        <Badge variant={doc.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                          {doc.status || 'draft'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {pickerSection && (
        <TechnicalFileDocumentPicker
          open={!!pickerSection}
          onOpenChange={(open) => { if (!open) setPickerSection(null); }}
          productId={productId}
          sectionId={pickerSection.id}
          sectionLabel={pickerSection.label}
        />
      )}
    </>
  );
}

function MarketApprovalsTab({ productId, companyId, productMarkets }: { productId: string; companyId: string; productMarkets: string[] }) {
  const queryClient = useQueryClient();
  const [editState, setEditState] = useState<Record<string, MarketApproval>>({});

  const { data: approvals, isLoading } = useQuery({
    queryKey: ['market-approvals', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_market_approvals' as any)
        .select('*')
        .eq('product_id', productId) as any;
      if (error) throw error;
      return (data || []) as Array<{ id: string; market_code: string; status: string; certificate_number: string | null; approval_date: string | null; notes: string | null }>;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (approval: MarketApproval) => {
      const payload = {
        product_id: productId,
        company_id: companyId,
        market_code: approval.market_code,
        status: approval.status,
        certificate_number: approval.certificate_number || null,
        approval_date: approval.approval_date || null,
        notes: approval.notes || null,
        updated_at: new Date().toISOString(),
      };
      const existing = approvals?.find((a: any) => a.market_code === approval.market_code);
      if (existing) {
        const { error } = await supabase.from('product_market_approvals' as any).update(payload as any).eq('id', existing.id) as any;
        if (error) throw error;
      } else {
        const { error } = await supabase.from('product_market_approvals' as any).insert(payload as any) as any;
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-approvals', productId] });
      toast.success('Market approval saved');
    },
    onError: () => toast.error('Failed to save market approval'),
  });

  const getApprovalForMarket = (marketCode: string): MarketApproval => {
    if (editState[marketCode]) return editState[marketCode];
    const existing = approvals?.find(a => a.market_code === marketCode);
    return {
      id: existing?.id,
      market_code: marketCode,
      status: existing?.status || 'planned',
      certificate_number: existing?.certificate_number || '',
      approval_date: existing?.approval_date || '',
      notes: existing?.notes || '',
    };
  };

  const updateField = (marketCode: string, field: keyof MarketApproval, value: string) => {
    const current = getApprovalForMarket(marketCode);
    setEditState(prev => ({ ...prev, [marketCode]: { ...current, [field]: value } }));
  };

  const saveMarket = (marketCode: string) => {
    const approval = getApprovalForMarket(marketCode);
    upsertMutation.mutate(approval);
    setEditState(prev => { const next = { ...prev }; delete next[marketCode]; return next; });
  };

  if (productMarkets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <Info className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="font-medium">No target markets configured</p>
          <p className="text-sm text-muted-foreground mt-1">
            Set target markets in the Device Definition to track market approvals here.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Loading market approvals...</div>;
  }

  return (
    <div className="space-y-4">
      {productMarkets.map((market) => {
        const approval = getApprovalForMarket(market);
        const statusConfig = STATUS_OPTIONS.find(s => s.value === approval.status) || STATUS_OPTIONS[0];
        const StatusIcon = statusConfig.icon;
        const isDirty = !!editState[market];

        return (
          <Card key={market} className="border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">{market}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusConfig.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                  {isDirty && (
                    <Button size="sm" variant="default" onClick={() => saveMarket(market)} disabled={upsertMutation.isPending}>
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                <Select value={approval.status} onValueChange={(v) => updateField(market, 'status', v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Certificate Number</label>
                <Input className="h-9" placeholder="e.g. CE-2025-001" value={approval.certificate_number} onChange={(e) => updateField(market, 'certificate_number', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Approval Date</label>
                <Input type="date" className="h-9" value={approval.approval_date} onChange={(e) => updateField(market, 'approval_date', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
                <Input className="h-9" placeholder="Optional notes..." value={approval.notes} onChange={(e) => updateField(market, 'notes', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function ProductTechnicalFilePage() {
  const { productId } = useParams<{ productId: string }>();

  const { data: product } = useQuery({
    queryKey: ['product-basic-tf', productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data, error } = await supabase
        .from('products')
        .select('id, name, company_id, markets')
        .eq('id', productId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const productMarkets = parseProductMarkets(product?.markets);

  if (!productId) return null;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Technical File</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Auditor-ready view of the complete technical dossier organized by MDR Annex II/III structure, with market approval status.
        </p>
      </div>

      <Tabs defaultValue="file-sections">
        <TabsList>
          <TabsTrigger value="file-sections" className="gap-2">
            <FileText className="h-4 w-4" />
            File Sections
          </TabsTrigger>
          <TabsTrigger value="market-approvals" className="gap-2">
            <Globe className="h-4 w-4" />
            Market Approvals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file-sections" className="mt-4">
          <TechnicalFileSectionsTab productId={productId} />
        </TabsContent>

        <TabsContent value="market-approvals" className="mt-4">
          {product?.company_id ? (
            <MarketApprovalsTab productId={productId} companyId={product.company_id} productMarkets={productMarkets} />
          ) : (
            <div className="text-muted-foreground text-center py-8">Loading...</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
