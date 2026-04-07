import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TECHNICAL_FILE_SECTIONS } from '@/types/designReview';
import { TECHNICAL_FILE_GAP_LINKS } from '@/config/technicalFileGapMapping';
import { TECHNICAL_FILE_GUIDED_SECTIONS, TECHNICAL_FILE_GROUPS } from '@/config/technicalFileSections';
import type { TFSubItem } from '@/config/technicalFileSections';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { FileText, Globe, CheckCircle2, CheckCircle, Circle, Clock, AlertCircle, Upload, Save, Link2, Info, ShieldCheck, FolderOpen, ChevronRight, ChevronLeft, Home, Target, ArrowLeft, ArrowRight, BookOpen, Lightbulb, FileEdit, Unlink2, FilePlus2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { TechnicalFileDocumentPicker } from '@/components/technical-file/TechnicalFileDocumentPicker';
import { cn } from '@/lib/utils';
import { prepareTFDocumentContent } from '@/services/technicalFileDocService';
import { DocumentDraftDrawer } from '@/components/product/documents/DocumentDraftDrawer';
import { SaveContentAsDocCIDialog } from '@/components/shared/SaveContentAsDocCIDialog';
import { DocumentStudioPersistenceService } from '@/services/documentStudioPersistenceService';

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

// ─── Completion helpers ─────────────────────────────────────────────────────

interface SectionCompletion {
  hasDocuments: boolean;
  docCount: number;
  compliance: { compliant: number; total: number; percentage: number } | null;
  isComplete: boolean;
}

function computeSectionCompletion(
  sectionId: string,
  allLinks: Array<{ section_id: string; document_id: string }> | undefined,
  gapItems: Array<{ framework: string; clause_id: string; status: string }> | undefined,
  docMap?: Map<string, { id: string; status: string | null }>,
): SectionCompletion {
  // Filter out orphaned links (doc deleted from DB but link remains)
  const sectionLinks = (allLinks || []).filter(l => {
    if (l.section_id !== sectionId) return false;
    return !docMap || docMap.has(l.document_id);
  });
  const docCount = sectionLinks.length;
  const hasDocuments = docCount > 0;

  // Check if any linked doc is still in draft — if so, section is not complete
  const allDocsApproved = docMap
    ? sectionLinks.every(l => {
        const doc = docMap.get(l.document_id);
        return doc && doc.status !== 'draft';
      })
    : true;

  // Compliance from gap analysis
  const links = TECHNICAL_FILE_GAP_LINKS.filter(l => l.sectionId === sectionId);
  let compliance: SectionCompletion['compliance'] = null;

  if (gapItems && gapItems.length > 0 && links.length > 0) {
    const matchingItems = gapItems.filter(item =>
      links.some(link => {
        if (item.framework !== link.framework) return false;
        if (link.clausePrefix) return item.clause_id?.startsWith(link.clausePrefix);
        return true;
      })
    );
    if (matchingItems.length > 0) {
      const compliant = matchingItems.filter(i => i.status === 'compliant').length;
      const naCount = matchingItems.filter(i => i.status === 'n_a').length;
      const denominator = matchingItems.length - naCount;
      compliance = denominator === 0
        ? { compliant: 0, total: 0, percentage: 100 }
        : { compliant, total: denominator, percentage: Math.round((compliant / denominator) * 100) };
    }
  }

  // Complete = has docs AND all docs are not draft AND (no gap link OR 100% compliant)
  const gapOk = compliance === null || compliance.percentage === 100;
  const isComplete = hasDocuments && allDocsApproved && gapOk;

  return { hasDocuments, docCount, compliance, isComplete };
}

// ─── Guided Sections Tab ────────────────────────────────────────────────────

function TechnicalFileSectionsTab({ productId, companyId }: { productId: string; companyId?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pickerSection, setPickerSection] = useState<{ id: string; label: string } | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeSubStepIndex, setActiveSubStepIndex] = useState(0);
  const [draftDrawerDoc, setDraftDrawerDoc] = useState<{ id: string; name: string; type: string; documentReference?: string; isNewUnsavedDocument?: boolean; tfSectionId?: string } | null>(null);
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);

  // Fetch company data for Document Studio navigation + AI prompt enrichment
  const { data: company } = useQuery({
    queryKey: ['company-data-tf', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('name, address, city, postal_code, country, contact_person, ar_name, ar_address, ar_city, ar_country, ar_postal_code, srn')
        .eq('id', companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch product/device data for AI prompt enrichment
  const { data: productData } = useQuery({
    queryKey: ['product-data-tf', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('name, trade_name, description, device_summary, class, intended_use, intended_purpose_data, basic_udi_di, udi_di, device_category, conformity_assessment_route, notified_body, manufacturer, ec_certificate, article_number, version')
        .eq('id', productId)
        .single();
      if (error) throw error;
      return data;
    },
  });

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

  // Fetch gap analysis items for compliance badges
  const { data: gapItems } = useQuery({
    queryKey: ['tf-gap-compliance', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('gap_analysis_items')
        .select('framework, clause_id, status')
        .eq('product_id', companyId as any) as any;
      if (error) throw error;
      return (data || []) as Array<{ framework: string; clause_id: string; status: string }>;
    },
    enabled: !!companyId,
  });

  // Fetch document details for linked docs
  const linkedDocIds = [...new Set((allLinks || []).map(l => l.document_id))];
  const { data: documents } = useQuery({
    queryKey: ['tf-linked-doc-details', productId, linkedDocIds.join(',')],
    queryFn: async () => {
      if (linkedDocIds.length === 0) return [];
      const { data, error } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name, document_type, status, document_reference')
        .in('id', linkedDocIds);
      if (error) throw error;
      return data || [];
    },
    enabled: linkedDocIds.length > 0,
  });

  const docMap = new Map((documents || []).map(d => [d.id, d]));

  const getDocsForSection = (sectionId: string) => {
    const docIds = (allLinks || []).filter(l => {
      if (l.section_id === sectionId) return true;
      // Show legacy section-level links on the first sub-step (A)
      if (sectionId.endsWith('-A') && l.section_id === sectionId.slice(0, -2)) return true;
      return false;
    }).map(l => l.document_id);
    return docIds.map(id => docMap.get(id)).filter(Boolean) as Array<{ id: string; name: string; document_type: string | null; status: string | null; document_reference: string | null }>;
  };

  // Unlink a document from a section
  const handleUnlinkDoc = async (docId: string, sectionId: string) => {
    const { error } = await (supabase as any)
      .from('technical_file_document_links')
      .delete()
      .eq('product_id', productId)
      .eq('section_id', sectionId)
      .eq('document_id', docId);
    if (error) {
      toast.error('Failed to unlink document');
      return;
    }
    toast.success('Document unlinked');
    queryClient.invalidateQueries({ queryKey: ['tf-section-documents'] });
    queryClient.invalidateQueries({ queryKey: ['tf-linked-doc-details'] });
  };

  // Compute completion for all sections
  const completionData = useMemo(() => {
    const statusMap = new Map((documents || []).map(d => [d.id, d]));
    const map = new Map<string, SectionCompletion>();
    TECHNICAL_FILE_GUIDED_SECTIONS.forEach(s => {
      // For completion, check both section-level links AND sub-step-level links (e.g., TF-0-A, TF-0-B)
      const allSectionLinks = (allLinks || []).filter(l => 
        l.section_id === s.section || (s.subItems && s.subItems.some(sub => l.section_id === `${s.section}-${sub.letter}`))
      );
      map.set(s.section, computeSectionCompletion(s.section, allSectionLinks.length > 0 ? allSectionLinks.map(l => ({ ...l, section_id: s.section })) : undefined, gapItems, statusMap));
    });
    return map;
  }, [allLinks, gapItems, documents]);

  const totalSections = TECHNICAL_FILE_GUIDED_SECTIONS.length;
  const completedCount = TECHNICAL_FILE_GUIDED_SECTIONS.filter(s => completionData.get(s.section)?.isComplete).length;
  const progress = totalSections > 0 ? Math.round((completedCount / totalSections) * 100) : 0;
  const nextIncomplete = TECHNICAL_FILE_GUIDED_SECTIONS.find(s => !completionData.get(s.section)?.isComplete);

  // Get the matching TF section metadata for legal reference display
  const getTfMeta = (sectionId: string) => TECHNICAL_FILE_SECTIONS.find(s => s.id === sectionId);

  const handleRowClick = (sectionId: string) => {
    if (expandedSection === sectionId) {
      setExpandedSection(null);
      setActiveSubStepIndex(0);
    } else {
      setExpandedSection(sectionId);
      setActiveSubStepIndex(0);
    }
  };

  const handleBackToOverview = () => {
    setExpandedSection(null);
    setActiveSubStepIndex(0);
  };

  const activeConfig = expandedSection
    ? TECHNICAL_FILE_GUIDED_SECTIONS.find(s => s.section === expandedSection)
    : null;
  const activeCompletion = expandedSection ? completionData.get(expandedSection) : null;
  const activeTfMeta = expandedSection ? getTfMeta(expandedSection) : null;
  const activeSubStep: TFSubItem | null = activeConfig?.subItems?.[activeSubStepIndex] || null;

  // Derive sub-step-specific section ID for per-sub-step evidence scoping
  const activeSubStepSectionId = activeConfig && activeSubStep
    ? `${activeConfig.section}-${activeSubStep.letter}`
    : activeConfig?.section;

  const activeDocs = activeSubStepSectionId ? getDocsForSection(activeSubStepSectionId) : [];
  const totalSubSteps = activeConfig?.subItems?.length || 0;

  const goToSubStep = (index: number) => {
    if (index >= 0 && index < totalSubSteps) {
      setActiveSubStepIndex(index);
    } else if (index >= totalSubSteps) {
      handleBackToOverview();
    }
  };

  return (
    <TooltipProvider>
    <div className="relative">
      {/* Main content — leaves room for sidebar */}
      <div className="mr-[280px] lg:mr-[300px] xl:mr-[320px]">

        {/* ─── OVERVIEW MODE (no section selected) ─── */}
        {!expandedSection && (
          <>
            {/* Info Banner */}
            <div className="mb-6 rounded-xl border border-blue-200 dark:border-blue-800/50 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 p-5">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-lg bg-blue-200 dark:bg-blue-800 flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="h-5 w-5 text-blue-700 dark:text-blue-200" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold text-foreground">Technical File — MDR Dossier</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-600 text-white uppercase tracking-wider">EU MDR</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Auditor-ready technical dossier organized by MDR Annex II/III structure. Link your compliance documents to each section and track gap analysis completion.
                  </p>
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-blue-700 dark:text-blue-400">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-amber-400" />
                      <span>Amber = incomplete</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>Green = complete</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ChevronRight className="h-3 w-3" />
                      <span>Click any section to open</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Header */}
            <div className="mb-6 p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Overall Progress</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {completedCount}/{totalSections} sections complete
                    {nextIncomplete && !progress && ` · Next: ${nextIncomplete.title}`}
                    {progress >= 100 && ' · All sections addressed'}
                  </p>
                </div>
                <div className={cn(
                  "text-2xl font-bold tabular-nums",
                  progress >= 100 ? "text-emerald-600 dark:text-emerald-400"
                    : progress >= 50 ? "text-blue-600 dark:text-blue-400"
                      : "text-amber-600 dark:text-amber-400"
                )}>
                  {progress}%
                </div>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Section Groups */}
            <div className="space-y-6">
              {TECHNICAL_FILE_GROUPS.map(group => {
                const groupItems = TECHNICAL_FILE_GUIDED_SECTIONS.filter(s => s.sectionGroup === group.id);
                const groupCompleted = groupItems.filter(s => completionData.get(s.section)?.isComplete).length;

                return (
                  <div key={group.id}>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          {group.name}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {groupCompleted}/{groupItems.length}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {groupItems.map(config => {
                        const completion = completionData.get(config.section);
                        const isComplete = completion?.isComplete || false;

                        return (
                          <button
                            key={config.section}
                            onClick={() => handleRowClick(config.section)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all",
                              isComplete
                                ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
                                : "border-border bg-card hover:bg-muted/50"
                            )}
                          >
                            {isComplete ? (
                              <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground/40 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-muted-foreground">{config.section}</span>
                                <span className="text-sm font-medium text-foreground">{config.title}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{config.description}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant="secondary" className="text-[10px]">
                                {completion?.docCount || 0} doc{(completion?.docCount || 0) !== 1 ? 's' : ''}
                              </Badge>
                              {completion?.compliance && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge
                                      variant="outline"
                                      className={cn("text-[10px] gap-1",
                                        completion.compliance.percentage === 100
                                          ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400'
                                          : completion.compliance.percentage >= 50
                                          ? 'border-yellow-500 text-yellow-700 dark:text-yellow-400'
                                          : 'border-destructive text-destructive'
                                      )}
                                    >
                                      <ShieldCheck className="h-3 w-3" />
                                      {completion.compliance.compliant}/{completion.compliance.total}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" className="text-xs">
                                    Gap Analysis: {completion.compliance.compliant} of {completion.compliance.total} clauses compliant ({completion.compliance.percentage}%)
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ─── DETAIL MODE: Single Sub-Step View ─── */}
        {expandedSection && activeConfig && (
          <div className="space-y-5 pb-24">
            {/* Back + Step indicator */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleBackToOverview}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to overview
              </button>
              <div className="flex items-center gap-2">
                {activeTfMeta && (
                  <Badge variant="outline" className="text-xs">{activeTfMeta.legalReference}</Badge>
                )}
                {activeCompletion?.compliance && (
                  <Badge
                    variant="outline"
                    className={cn("text-xs gap-1",
                      activeCompletion.compliance.percentage === 100
                        ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400'
                        : 'border-amber-500 text-amber-700 dark:text-amber-400'
                    )}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {activeCompletion.compliance.compliant}/{activeCompletion.compliance.total}
                  </Badge>
                )}
              </div>
            </div>

            {/* Step Header */}
            <div className="p-5 rounded-xl border bg-card">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <span className="font-mono">{activeConfig.section}</span>
                <span>·</span>
                <span>{activeConfig.title}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary uppercase">{activeSubStep?.letter}</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Step {activeSubStepIndex + 1} of {totalSubSteps} — ({activeSubStep?.letter}) {activeSubStep?.description}
                  </h2>
                </div>
              </div>
            </div>

            {/* REQUIREMENT card */}
            {activeSubStep?.requirement && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Requirement</h3>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{activeSubStep.requirement}</p>
              </div>
            )}

            {/* GUIDANCE card */}
            {activeSubStep?.guidance && (
              <div className="rounded-lg border border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-950/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Guidance</h3>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{activeSubStep.guidance}</p>
              </div>
            )}

            {/* HELP / WHAT IS THIS card */}
            {activeSubStep?.helpText && (
              <div className="rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">What is this?</h3>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{activeSubStep.helpText}</p>
              </div>
            )}

            {/* Evidence & References */}
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Evidence & References</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {companyId && company?.name && (
                    <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          disabled={isCreatingDoc}
                          onClick={async () => {
                            if (!companyId || !company?.name || !activeSubStep || !activeConfig) return;
                            const { documentReference, htmlContent } = prepareTFDocumentContent({
                              substepDescription: activeSubStep.description,
                              sectionId: activeConfig.section,
                              substepLetter: activeSubStep.letter,
                            });

                            // Check for existing CI by document_reference before opening drawer
                            setIsCreatingDoc(true);
                            try {
                              const existingCIs = await DocumentStudioPersistenceService.getDocumentCIsByReference(
                                companyId, documentReference, productId
                              );
                              if (existingCIs.success && existingCIs.data && existingCIs.data.length > 0) {
                                const ciId = existingCIs.data[0].id;
                                const { data: ciDoc } = await supabase
                                  .from('phase_assigned_document_template')
                                  .select('id, name, document_type')
                                  .eq('id', ciId)
                                  .single();
                                setDraftDrawerDoc({
                                  id: ciDoc?.id || ciId,
                                  name: ciDoc?.name || activeSubStep.description,
                                  type: ciDoc?.document_type || 'technical-file',
                                  documentReference,
                                });
                                return;
                              }
                            } catch (err) {
                              console.warn('Error checking existing CI:', err);
                            } finally {
                              setIsCreatingDoc(false);
                            }

                            // No existing CI — open drawer with blank template, CI created on first save
                            setDraftDrawerDoc({
                              id: `new-tf-${activeConfig.section}-${activeSubStep.letter}`,
                              name: activeSubStep.description,
                              type: 'technical-file',
                              documentReference,
                              isNewUnsavedDocument: true,
                              tfSectionId: activeSubStepSectionId || activeConfig.section,
                            });
                          }}
                        >
                          <FileEdit className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Create Document</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          disabled={isCreatingDoc}
                          onClick={() => {
                            if (!companyId || !company?.name || !activeSubStep || !activeConfig) return;
                            const { documentReference } = prepareTFDocumentContent({
                              substepDescription: activeSubStep.description,
                              sectionId: activeConfig.section,
                              substepLetter: activeSubStep.letter,
                              isAdditional: true,
                            });
                            setDraftDrawerDoc({
                              id: `new-tf-add-${activeConfig.section}-${activeSubStep.letter}-${Date.now()}`,
                              name: `${activeSubStep.description} (Additional)`,
                              type: 'technical-file',
                              documentReference,
                              isNewUnsavedDocument: true,
                              tfSectionId: activeSubStepSectionId || activeConfig.section,
                            });
                          }}
                        >
                          <FilePlus2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Create Additional Document</TooltipContent>
                    </Tooltip>
                    </>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setPickerSection({ id: activeSubStepSectionId || activeConfig.section, label: activeSubStep ? `${activeSubStep.letter}. ${activeSubStep.description}` : `${activeConfig.section} — ${activeConfig.title}` })}
                      >
                        <Link2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Link Document</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              {activeDocs.length === 0 ? (
                <div className="text-sm text-muted-foreground italic py-4 text-center border rounded-lg bg-muted/10">
                  No documents linked yet. Link compliance documents to provide evidence for this sub-step.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {activeDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                        onClick={() => {
                          setDraftDrawerDoc({
                            id: doc.id,
                            name: doc.name,
                            type: doc.document_type || 'technical-file',
                            documentReference: doc.document_reference || undefined,
                          });
                        }}
                      >
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-primary underline underline-offset-2 truncate">{doc.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={doc.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                          {doc.status || 'draft'}
                        </Badge>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activeSubStepSectionId) handleUnlinkDoc(doc.id, activeSubStepSectionId);
                              }}
                            >
                              <Unlink2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Unlink document</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gap compliance summary */}
            {activeCompletion?.compliance && (
              <div className={cn(
                "flex items-center gap-2 p-4 rounded-lg text-sm",
                activeCompletion.compliance.percentage === 100
                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                  : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
              )}>
                <ShieldCheck className="h-5 w-5 flex-shrink-0" />
                <span>
                  Gap Analysis: {activeCompletion.compliance.compliant}/{activeCompletion.compliance.total} clauses compliant ({activeCompletion.compliance.percentage}%)
                </span>
              </div>
            )}

            {/* ─── Bottom Step Navigation Bar ─── */}
            {(() => {
              const prevItem = activeConfig?.subItems?.[activeSubStepIndex - 1];
              const nextItem = activeConfig?.subItems?.[activeSubStepIndex + 1];
              const prevLabel = prevItem?.description;
              const nextLabel = nextItem?.description;
              const currentLabel = activeSubStep?.description || '';
              const prevBtnLabel = prevLabel || (activeSubStepIndex > 0 ? 'Previous' : null);
              const nextBtnLabel = nextLabel || (activeSubStepIndex < totalSubSteps - 1 ? 'Next' : 'Back to overview');
              const btnBase = '!bg-slate-100 hover:!bg-slate-200 text-slate-700 border border-slate-500 shadow-sm';

              return (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm rounded-[28px] border shadow-xl px-3 py-1.5">
                    {prevBtnLabel && (
                      <Button onClick={() => goToSubStep(activeSubStepIndex - 1)} size="sm"
                        className={`gap-1.5 h-9 w-[180px] min-w-[180px] max-w-[180px] rounded-full justify-start ${btnBase}`}>
                        <ArrowLeft className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="h-2 w-2 rounded-full flex-shrink-0 bg-slate-500" />
                        <span className="text-xs font-medium truncate flex-1 text-left">{prevBtnLabel}</span>
                      </Button>
                    )}
                    <div className="flex flex-col items-center px-6 py-2 min-w-[220px] bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mx-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white truncate max-w-[180px]">{currentLabel}</span>
                      </div>
                      <span className="text-[10px] text-white/70">Step {activeSubStepIndex + 1}/{totalSubSteps}</span>
                    </div>
                    <Button onClick={() => {
                      if (activeSubStepIndex < totalSubSteps - 1) {
                        goToSubStep(activeSubStepIndex + 1);
                      } else {
                        handleBackToOverview();
                      }
                    }} size="sm"
                      className={`gap-1.5 h-9 w-[180px] min-w-[180px] max-w-[180px] rounded-full justify-end ${btnBase}`}>
                      <span className="text-xs font-medium truncate flex-1 text-right">{nextBtnLabel}</span>
                      <span className="h-2 w-2 rounded-full flex-shrink-0 bg-slate-500" />
                      <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* ─── Right Sidebar ─────────────────────────────────────────────── */}
      <div className="fixed right-0 top-16 w-[280px] lg:w-[300px] xl:w-[320px] bg-background border-l border-border flex flex-col h-[calc(100vh-64px)] z-30">
        {/* Header */}
        <div className="p-4 border-b bg-background/50">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Technical File
            </span>
          </div>
          <h3 className="font-semibold text-foreground text-sm truncate">
            {expandedSection
              ? `${expandedSection}: ${activeConfig?.title}`
              : nextIncomplete
              ? `Next: ${nextIncomplete.title}`
              : 'All sections complete'
            }
          </h3>
          <div className="flex items-center gap-2 mt-3">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  progress >= 100 ? "bg-emerald-500" : progress >= 50 ? "bg-blue-500" : "bg-amber-500"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground tabular-nums whitespace-nowrap">
              {completedCount}/{totalSections}
            </span>
          </div>
        </div>

        {/* "To Complete This Section" Panel — shows sub-items as checklist */}
        {expandedSection && activeConfig && (() => {
          const completion = activeCompletion;
          const subChecklist = activeConfig.subItems || [];

          return (
            <div className={cn(
              "p-4 border-b flex-shrink-0",
              completion?.isComplete
                ? "bg-emerald-50 dark:bg-emerald-950/20"
                : "bg-amber-50 dark:bg-amber-950/20"
            )}>
              <h4 className={cn(
                "text-sm font-medium flex items-center gap-2",
                completion?.isComplete
                  ? "text-emerald-800 dark:text-emerald-300"
                  : "text-amber-800 dark:text-amber-300"
              )}>
                <Target className="h-4 w-4" />
                {completion?.isComplete ? 'Section Complete ✓' : 'To Complete This Section'}
              </h4>
              <ul className="mt-2 space-y-1.5">
                {/* Document requirement */}
                <li className="flex items-start gap-2 text-xs">
                  {completion?.hasDocuments ? (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <span className={cn("text-foreground", completion?.hasDocuments && "line-through opacity-60")}>
                    Link at least 1 document
                  </span>
                </li>
                {/* Gap compliance */}
                {completion?.compliance && (
                  <li className="flex items-start gap-2 text-xs">
                    {completion.compliance.percentage === 100 ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    )}
                    <span className={cn("text-foreground", completion.compliance.percentage === 100 && "line-through opacity-60")}>
                      Gap analysis 100% compliant ({completion.compliance.percentage}%)
                    </span>
                  </li>
                )}
                {/* Sub-items as deliverable checklist */}
                {subChecklist.length > 0 && (
                  <>
                    <li className="pt-1.5 mt-1.5 border-t border-border/50">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Deliverables ({subChecklist.length} sub-steps)
                      </span>
                    </li>
                    {subChecklist.map((sub, idx) => (
                      <li
                        key={sub.letter}
                        className={cn(
                          "flex items-start gap-2 text-xs cursor-pointer rounded px-1 py-0.5 transition-colors",
                          idx === activeSubStepIndex ? "bg-blue-100 dark:bg-blue-900/30" : "hover:bg-muted/30"
                        )}
                        onClick={() => setActiveSubStepIndex(idx)}
                      >
                        <Circle className={cn(
                          "h-3.5 w-3.5 flex-shrink-0 mt-0.5",
                          idx === activeSubStepIndex ? "text-blue-500" : "text-muted-foreground/40"
                        )} />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={cn("text-foreground", idx === activeSubStepIndex && "font-medium")}>
                              <span className="font-semibold uppercase mr-1">{sub.letter}.</span>
                              {sub.description}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-[260px] text-xs">
                            {sub.helpText}
                          </TooltipContent>
                        </Tooltip>
                      </li>
                    ))}
                  </>
                )}
              </ul>
            </div>
          );
        })()}

        {/* All Sections list with nested sub-items for active section */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-16">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            All Sections
          </h4>

          <div className="space-y-4">
            {TECHNICAL_FILE_GROUPS.map(group => {
              const groupItems = TECHNICAL_FILE_GUIDED_SECTIONS.filter(s => s.sectionGroup === group.id);
              return (
                <div key={group.id}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {group.name}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {groupItems.map(config => {
                      const isComplete = completionData.get(config.section)?.isComplete || false;
                      const isActive = config.section === expandedSection;
                      return (
                        <div key={config.section}>
                          <button
                            onClick={() => handleRowClick(config.section)}
                            className={cn(
                              "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left",
                              isActive && "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-medium",
                              !isActive && isComplete && "text-emerald-600 dark:text-emerald-400",
                              !isActive && !isComplete && "text-muted-foreground hover:bg-muted/50"
                            )}
                          >
                            {isComplete ? (
                              <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                            ) : (
                              <Circle className={cn(
                                "h-3.5 w-3.5 flex-shrink-0",
                                isActive ? "text-blue-500" : "text-muted-foreground/50"
                              )} />
                            )}
                            <span className="truncate">{config.section} {config.title}</span>
                          </button>

                          {/* Nested sub-items when active — clickable */}
                          {isActive && config.subItems && config.subItems.length > 0 && (
                            <div className="ml-4 mt-0.5 mb-1 border-l-2 border-blue-300 dark:border-blue-700 pl-3 space-y-0.5">
                              {config.subItems.map((sub, idx) => (
                                <button
                                  key={sub.letter}
                                  onClick={() => setActiveSubStepIndex(idx)}
                                  className={cn(
                                    "w-full flex items-center gap-2 py-1 px-1 rounded text-[11px] text-left transition-colors",
                                    idx === activeSubStepIndex
                                      ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium"
                                      : "text-muted-foreground hover:bg-muted/50"
                                  )}
                                >
                                  <span className={cn(
                                    "font-semibold uppercase w-3",
                                    idx === activeSubStepIndex ? "text-blue-700 dark:text-blue-300" : "text-blue-600 dark:text-blue-400"
                                  )}>{sub.letter}</span>
                                  <span className="truncate">{sub.description}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Document Picker Dialog */}
      {pickerSection && (
        <TechnicalFileDocumentPicker
          open={!!pickerSection}
          onOpenChange={(open) => { if (!open) setPickerSection(null); }}
          productId={productId}
          sectionId={pickerSection.id}
          sectionLabel={pickerSection.label}
        />
      )}

      {/* Document Draft Side Drawer */}
      <DocumentDraftDrawer
        open={!!draftDrawerDoc}
        onOpenChange={(open) => { if (!open) setDraftDrawerDoc(null); }}
        documentId={draftDrawerDoc?.id || ''}
        documentName={draftDrawerDoc?.name || ''}
        documentType={draftDrawerDoc?.type || ''}
        productId={productId}
        companyId={companyId}
        documentReference={draftDrawerDoc?.documentReference}
        isNewUnsavedDocument={draftDrawerDoc?.isNewUnsavedDocument}
        onDocumentCreated={async (docId, docName, docType) => {
          // Link CI to TF section
          const tfSectionId = draftDrawerDoc?.tfSectionId;
          if (tfSectionId) {
            await supabase
              .from('technical_file_document_links')
              .upsert(
                { product_id: productId, section_id: tfSectionId, document_id: docId },
                { onConflict: 'product_id,section_id,document_id' }
              );
            await queryClient.invalidateQueries({ queryKey: ['tf-section-documents'] });
            await queryClient.invalidateQueries({ queryKey: ['tf-linked-doc-details'] });
            toast.success('Document created and linked to Technical File');
          }
          // Update drawer to point to real CI — preserve tfSectionId so context isn't lost
          setDraftDrawerDoc(prev => prev ? {
            ...prev,
            id: docId,
            name: docName,
            type: docType || 'technical-file',
            isNewUnsavedDocument: false,
          } : null);
        }}
      />
    </div>
    </TooltipProvider>
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
          <TechnicalFileSectionsTab productId={productId} companyId={product?.company_id} />
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
