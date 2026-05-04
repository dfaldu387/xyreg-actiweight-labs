/**
 * NodeSOPRequirementsDialog - Popup showing required SOPs for a QMS node
 * 
 * Displays:
 * 1. Required SOPs from the static mapping with track badges
 * 2. Status of each SOP in the company's document system
 * 3. Actions to create missing SOPs or view existing ones
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Plus, 
  ExternalLink,
  FileText,
  BookOpen,
  CircleSlash,
  Link2,
  Link2Off,
  Check,
  ChevronRight,
  Loader2,
  ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { 
  NODE_SOP_RECOMMENDATIONS, 
  TRACK_BADGE_STYLES,
  type SOPRecommendation,
  type SOPTrack 
} from '@/data/nodeSOPRecommendations';
import {
  useNodeSOPRequirements,
  useAvailableSOPs,
  useManualSopLinkMutations,
  type SOPRequirementStatus,
} from '@/hooks/useQmsNodeProcess';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DocumentDraftDrawer } from '@/components/product/documents/DocumentDraftDrawer';
import { formatSopDisplayId } from '@/constants/sopAutoSeedTiers';
import { SOP_FULL_CONTENT } from '@/data/sopFullContent';
import {
  listGlobalWIsForSop,
  materializeGlobalWIForCompany,
  type GlobalWI,
} from '@/services/globalWorkInstructionsService';

interface NodeSOPRequirementsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string;
  nodeLabel: string;
  isoClause?: string;
  companyId?: string;
  onCreateSOP?: (sopNumber: string, sopName: string) => void;
  onViewSOP?: (documentId: string) => void;
  /**
   * When provided, the dialog auto-opens the DocumentDraftDrawer for that
   * SOP as soon as it has resolved status (View if linked, Create if missing).
   * Used by chip clicks on the helix node so users skip the list view.
   */
  autoOpenSop?: { sopNumber: string; documentId?: string };
}

function TrackBadge({ track }: { track: SOPTrack }) {
  const styles = TRACK_BADGE_STYLES[track];
  return (
    <Badge 
      variant="outline" 
      className={cn(
        'text-[10px] font-bold px-1.5 py-0 h-5',
        styles.bg, 
        styles.text,
        'border-transparent'
      )}
    >
      {track}
    </Badge>
  );
}

function StatusBadge({ status }: { status: SOPRequirementStatus['status'] }) {
  switch (status) {
    case 'approved':
      return (
        <div className="flex items-center gap-1 text-emerald-600">
          <CheckCircle className="h-3.5 w-3.5" />
          <span className="text-[11px] font-medium">Approved</span>
        </div>
      );
    case 'draft':
    case 'in-review':
      return (
        <div className="flex items-center gap-1 text-amber-600">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-[11px] font-medium">
            {status === 'draft' ? 'Draft' : 'In Review'}
          </span>
        </div>
      );
    case 'missing':
      return (
        <div className="flex items-center gap-1 text-red-500">
          <AlertCircle className="h-3.5 w-3.5 animate-pulse" />
          <span className="text-[11px] font-medium">Not Created</span>
        </div>
      );
    case 'not-applicable':
      return (
        <div className="flex items-center gap-1 text-slate-400">
          <CircleSlash className="h-3.5 w-3.5" />
          <span className="text-[11px] font-medium">Not in scope</span>
        </div>
      );
    default:
      return null;
  }
}

function SOPRow({ 
  sop, 
  status,
  onCreateSOP,
  onViewSOP,
  companyId,
}: { 
  sop: SOPRecommendation;
  status: SOPRequirementStatus;
  onCreateSOP?: (sopNumber: string, sopName: string) => void;
  onViewSOP?: (documentId: string) => void;
  companyId?: string;
}) {
  const isMissing = status.status === 'missing';
  const isNotApplicable = status.status === 'not-applicable';
  const [linkOpen, setLinkOpen] = useState(false);
  const { data: availableSOPs, isLoading: loadingAvailable } = useAvailableSOPs(
    linkOpen ? companyId : undefined,
  );
  const { setLink, clearLink } = useManualSopLinkMutations(companyId);

  // ── Work Instruction sub-list ─────────────────────────────────────────
  const [wiOpen, setWiOpen] = useState(false);
  const [wis, setWis] = useState<GlobalWI[] | null>(null);
  const [wisLoading, setWisLoading] = useState(false);
  const [wiBusyId, setWiBusyId] = useState<string | null>(null);

  // Lazy-load WIs the first time the row is expanded.
  useEffect(() => {
    if (!wiOpen || wis !== null) return;
    let cancelled = false;
    setWisLoading(true);
    listGlobalWIsForSop(sop.sopNumber)
      .then((rows) => {
        if (!cancelled) setWis(rows);
      })
      .finally(() => {
        if (!cancelled) setWisLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [wiOpen, wis, sop.sopNumber]);

  // Pre-fetch the count once so we can show a badge without expanding.
  const [wiCount, setWiCount] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    listGlobalWIsForSop(sop.sopNumber).then((rows) => {
      if (!cancelled) {
        setWiCount(rows.length);
        // Cache rows so expand is instant on the first click.
        if (rows.length > 0) setWis(rows);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [sop.sopNumber]);

  const handleOpenWI = async (wi: GlobalWI) => {
    if (!companyId) {
      toast.error('Cannot open WI — missing company context');
      return;
    }
    // Resolve the phase id from any existing CI in this company. Foundation
    // SOPs all share the same company-level phase, so any one works.
    setWiBusyId(wi.id);
    try {
      const { data: anyCI } = await supabase
        .from('phase_assigned_document_template')
        .select('phase_id')
        .eq('company_id', companyId)
        .not('phase_id', 'is', null)
        .limit(1)
        .maybeSingle();
      const phaseId = (anyCI as { phase_id?: string } | null)?.phase_id;
      if (!phaseId) {
        toast.error('No company phase found to anchor the WI');
        return;
      }
      const ciId = await materializeGlobalWIForCompany({
        globalWiId: wi.id,
        companyId,
        phaseId,
      });
      if (!ciId) {
        toast.error('Failed to open Work Instruction');
        return;
      }
      onViewSOP?.(ciId);
    } finally {
      setWiBusyId(null);
    }
  };

  const hasWIs = (wiCount ?? 0) > 0;

  return (
    <div
      className={cn(
        'rounded-lg border',
        isMissing && 'border-red-200 bg-red-50/50',
        isNotApplicable && 'border-slate-200 bg-slate-50/60 opacity-75',
        !isMissing && !isNotApplicable && 'border-slate-200 bg-white',
      )}
    >
      <div className="flex items-center justify-between p-3">
      <div className="flex-1 min-w-0 flex items-start gap-1">
        {hasWIs ? (
          <button
            type="button"
            onClick={() => setWiOpen((v) => !v)}
            className="mt-0.5 p-0.5 rounded hover:bg-slate-100 text-slate-500 flex-shrink-0"
            aria-label={wiOpen ? 'Hide Work Instructions' : 'Show Work Instructions'}
          >
            <ChevronRight
              className={cn('h-3.5 w-3.5 transition-transform', wiOpen && 'rotate-90')}
            />
          </button>
        ) : (
          <span className="w-[18px] flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="h-4 w-4 text-slate-500 flex-shrink-0" />
          <span className="font-mono text-sm font-semibold text-slate-700">
            {status.displayId || formatSopDisplayId(sop.sopNumber)}
          </span>
          <TrackBadge track={sop.track} />
          {status.tier === 'A' && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-slate-200 text-slate-400">
              Tier A
            </Badge>
          )}
          {status.tier === 'B' && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-slate-300 text-slate-500">
              Tier B
            </Badge>
          )}
          {status.manuallyLinked && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-blue-200 bg-blue-50 text-blue-600">
              Linked
            </Badge>
          )}
          {hasWIs && (
            <Badge
              variant="outline"
              className="text-[9px] px-1 py-0 h-4 border-purple-200 bg-purple-50 text-purple-600 font-normal"
            >
              <ListChecks className="h-2.5 w-2.5 mr-0.5" />
              {wiCount} WI{wiCount === 1 ? '' : 's'}
            </Badge>
          )}
        </div>
        <p className="text-sm font-medium text-slate-900 truncate">
          {status.documentName}
        </p>
        <p className="text-xs text-slate-500 line-clamp-1">
          {sop.clauseDescription}
        </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
        <StatusBadge status={status.status} />
        
        {isNotApplicable ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[11px] text-slate-400 italic px-1">
                  optional
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px] text-xs">
                Tier B SOP — only auto-seeded when the
                <span className="font-mono mx-1">{status.trigger}</span>
                pathway is enabled for this company.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <>
            {!isMissing && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-slate-600 hover:text-slate-900"
                onClick={() => status.documentId && onViewSOP?.(status.documentId)}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View
              </Button>
            )}

            {companyId && (
              <Popover open={linkOpen} onOpenChange={setLinkOpen}>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-slate-500 hover:text-slate-900"
                    title={status.manuallyLinked ? 'Change linked document' : 'Link an existing document'}
                  >
                    <Link2 className="h-3 w-3 mr-1" />
                    {status.manuallyLinked ? 'Change' : 'Link'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0 z-[80]" align="end">
                  <Command>
                    <CommandInput placeholder="Search documents..." />
                    <CommandList>
                      {loadingAvailable ? (
                        <div className="py-4 text-center text-xs text-slate-500">Loading…</div>
                      ) : (
                        <>
                          <CommandEmpty>No SOP-style documents found.</CommandEmpty>
                          <CommandGroup heading="Attach an existing document">
                            {(availableSOPs || []).map((doc) => {
                              const isCurrent = doc.id === status.documentId;
                              return (
                                <CommandItem
                                  key={doc.id}
                                  value={`${doc.name} ${doc.id}`}
                                  onSelect={async () => {
                                    setLinkOpen(false);
                                    try {
                                      await setLink.mutateAsync({
                                        sopNumber: sop.sopNumber,
                                        documentId: doc.id,
                                      });
                                      toast.success(`Linked ${sop.sopNumber} → ${doc.name}`);
                                    } catch {
                                      /* error toast handled in service */
                                    }
                                  }}
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <FileText className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                    <span className="truncate text-xs">{doc.name}</span>
                                  </div>
                                  {isCurrent && <Check className="h-3.5 w-3.5 text-emerald-600 ml-2" />}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                          {status.manuallyLinked && (
                            <CommandGroup>
                              <CommandItem
                                value="__unlink__"
                                onSelect={async () => {
                                  setLinkOpen(false);
                                  try {
                                    await clearLink.mutateAsync(sop.sopNumber);
                                    toast.success(`Unlinked ${sop.sopNumber}`);
                                  } catch {
                                    /* error toast handled in service */
                                  }
                                }}
                                className="text-red-600"
                              >
                                <Link2Off className="h-3.5 w-3.5 mr-2" />
                                <span className="text-xs">Remove manual link</span>
                              </CommandItem>
                            </CommandGroup>
                          )}
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}

            {isMissing && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => onCreateSOP?.(sop.sopNumber, status.documentName)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Create
              </Button>
            )}
          </>
        )}
      </div>
      </div>

      {hasWIs && wiOpen && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-3 py-2">
          {wisLoading && !wis ? (
            <div className="flex items-center text-[11px] text-slate-500 py-1">
              <Loader2 className="h-3 w-3 animate-spin mr-2" /> Loading Work Instructions…
            </div>
          ) : (
            <ul className="space-y-1 ml-5">
              {(wis || []).map((wi) => (
                <li
                  key={wi.id}
                  className="flex items-center justify-between gap-2 px-2 py-1 rounded border border-slate-200 bg-white text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate">
                      <span className="font-mono text-slate-500 mr-1.5">
                        {wi.wi_number}
                      </span>
                      <span className="font-medium text-slate-800">{wi.title}</span>
                    </div>
                    {wi.focus && (
                      <div className="text-[10px] text-slate-500 truncate">
                        {wi.focus}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[11px] shrink-0"
                    onClick={() => handleOpenWI(wi)}
                    disabled={wiBusyId === wi.id}
                  >
                    {wiBusyId === wi.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <ExternalLink className="h-3 w-3 mr-1" /> View
                      </>
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function NodeSOPRequirementsDialog({
  open,
  onOpenChange,
  nodeId,
  nodeLabel,
  isoClause,
  companyId,
  onCreateSOP,
  onViewSOP,
  autoOpenSop,
}: NodeSOPRequirementsDialogProps) {
  const recommendations = NODE_SOP_RECOMMENDATIONS[nodeId] || [];
  const { data: sopStatuses, isLoading } = useNodeSOPRequirements(companyId, nodeId);
  const { companyName } = useParams<{ companyName?: string }>();

  // In-place drawer state — keeps the user on QMS Foundation instead of
  // navigating to the Documents page.
  const [drawerDoc, setDrawerDoc] = useState<{
    id: string;
    name: string;
    type: string;
    isNew?: boolean;
  } | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Open existing document in-place — fetch metadata, then mount the drawer.
  const handleViewInPlace = async (documentId: string) => {
    if (!documentId) return;
    setDrawerLoading(true);
    try {
      const { data, error } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name, document_type')
        .eq('id', documentId)
        .maybeSingle();
      if (error || !data) {
        toast.error('Could not load document');
        return;
      }
      setDrawerDoc({
        id: data.id,
        name: data.name || 'Document',
        type: data.document_type || 'SOP',
      });
    } catch {
      toast.error('Could not load document');
    } finally {
      setDrawerLoading(false);
    }
  };

  // Create a missing SOP in-place — open a fresh, unsaved drawer.
  const handleCreateInPlace = (sopNumber: string, sopName: string) => {
    setDrawerDoc({
      id: crypto.randomUUID(),
      name: `${sopNumber} ${sopName}`.trim(),
      type: 'SOP',
      isNew: true,
    });
  };

  // Count statistics
  const totalRequired = recommendations.length;
  const approvedCount = sopStatuses?.filter(s => s.status === 'approved').length ?? 0;
  const missingCount = sopStatuses?.filter(s => s.status === 'missing').length ?? 0;

  // Auto-open the drawer for a specific SOP when requested via chip click.
  // Runs once per open+autoOpenSop combo. Chip launches should go straight
  // into Document Studio without first showing the SOP requirements popup.
  const autoOpenedRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (!open) {
      autoOpenedRef.current = null;
      return;
    }
    if (!autoOpenSop) return;
    const key = `${autoOpenSop.sopNumber}:${autoOpenSop.documentId || ''}`;
    if (autoOpenedRef.current === key) return;
    if (drawerDoc || drawerLoading) return;
    autoOpenedRef.current = key;

    // If status is already resolved and linked, prefer opening the existing
    // document even when the chip payload did not include the CI id yet.
    const resolvedStatus = sopStatuses?.find((s) => s.sopNumber === autoOpenSop.sopNumber);
    const resolvedDocumentId = autoOpenSop.documentId || resolvedStatus?.documentId;

    if (autoOpenSop.documentId) {
      handleViewInPlace(autoOpenSop.documentId);
      return;
    }
    if (resolvedDocumentId) {
      handleViewInPlace(resolvedDocumentId);
    } else {
      const rec = recommendations.find((r) => r.sopNumber === autoOpenSop.sopNumber);
      handleCreateInPlace(
        autoOpenSop.sopNumber,
        resolvedStatus?.documentName || rec?.clauseDescription || autoOpenSop.sopNumber,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoOpenSop, sopStatuses, drawerDoc, drawerLoading, recommendations]);

  const shouldShowRequirementsDialog = open && !drawerDoc && !drawerLoading && !autoOpenSop;

  return (
    <Dialog open={shouldShowRequirementsDialog} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'transition-all duration-200',
          'max-w-3xl w-[92vw]',
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Required SOPs for: {nodeLabel}
          </DialogTitle>
          {isoClause && (
            <DialogDescription className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              ISO 13485 Clause {isoClause}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Stats summary */}
        <div className="flex items-center gap-4 py-2 px-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Required:</span>
            <span className="text-sm font-semibold text-slate-900">{totalRequired}</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-600">{approvedCount}</span>
          </div>
          {missingCount > 0 && (
            <>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                <span className="text-sm font-medium text-red-600">{missingCount} missing</span>
              </div>
            </>
          )}
        </div>

        {/* SOP list */}
        <ScrollArea className="max-h-[400px] pr-2">
          <div className="space-y-2">
            {isLoading ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Loading SOP status...
              </div>
            ) : recommendations.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No SOP requirements defined for this node.
              </div>
            ) : (
              recommendations.map((sop) => {
                const status: SOPRequirementStatus =
                  sopStatuses?.find((s) => s.sopNumber === sop.sopNumber) ?? {
                    sopNumber: sop.sopNumber,
                    displayId: formatSopDisplayId(sop.sopNumber),
                    documentName: SOP_FULL_CONTENT[sop.sopNumber]?.title || sop.sopNumber,
                    status: 'missing',
                  };
                return (
                  <SOPRow
                    key={sop.sopNumber}
                    sop={sop}
                    status={status}
                    onCreateSOP={handleCreateInPlace}
                    onViewSOP={handleViewInPlace}
                    companyId={companyId}
                  />
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Footer hint */}
        {missingCount > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500 text-center">
              Create missing SOPs to achieve full compliance for this process area.
            </p>
          </div>
        )}
      </DialogContent>

      {/* In-place document drawer — when it opens, the SOP popup is hidden so
          closing the drawer is a single-step exit back to the map. */}
      {drawerDoc && (
          <DocumentDraftDrawer
            open={true}
            onOpenChange={(o) => {
              if (!o) {
                // Close the document drawer AND the SOP requirements dialog
                // in one action — otherwise closing the drawer would leave
                // the SOP popup visible underneath, requiring a second close.
                setDrawerDoc(null);
                onOpenChange(false);
              }
            }}
            documentId={drawerDoc.id}
            documentName={drawerDoc.name}
            documentType={drawerDoc.type}
            companyId={companyId}
            companyName={companyName}
            isNewUnsavedDocument={drawerDoc.isNew}
            onDocumentSaved={() => {
              setDrawerDoc(null);
              onOpenChange(false);
            }}
            onDocumentCreated={() => {
              setDrawerDoc(null);
              onOpenChange(false);
            }}
            disableSopMentions
          />
      )}
    </Dialog>
  );
}
