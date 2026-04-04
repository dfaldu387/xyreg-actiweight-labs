import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { debounce } from '@/utils/debounce';
import { GapAnalysisItem } from '@/types/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Circle, CheckCircle, X, Flag, FileText, ExternalLink, Upload, Calendar, Activity, Plus, ChevronDown, ChevronUp, Users, UserCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryClient } from '@/lib/query-client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  getGapStatusColor,
  formatGapStatus,
  mapGapStatusToUI
} from '@/utils/statusUtils';
import { DocumentActionMenu } from '@/components/product/documents/DocumentActionMenu';
import { GapAnalysisReviewerDialog } from './GapAnalysisReviewerDialog';
import { ResponsiblePersonDialog } from './ResponsiblePersonDialog';
import { GapAnalysisEvidenceDialog } from './GapAnalysisEvidenceDialog';
import { GapItemExpandedEvidence } from './GapItemExpandedEvidence';
import { updateGapItemDueDate, updateGapItemPhases, getGapItemReviewerGroups, getResponsiblePersonDetails } from '@/services/gapAnalysisService';
import { PhaseSelector } from './PhaseSelector';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/useTranslation';

interface GapItemProps {
  item: GapAnalysisItem;
  onStatusChange?: (id: string, status: "Open" | "Closed" | "N/A") => void;
  onReviewerAssign?: (id: string, reviewerId: string) => void;
  companyId?: string;
  productId?: string;
  onRefresh?: () => void;
  disabled?: boolean;
}

export function GapItem({ item, onStatusChange, onReviewerAssign, companyId, productId, onRefresh, disabled = false }: GapItemProps) {
  // CRITICAL: ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // This ensures hooks are always called in the same order (Rules of Hooks)
  // NEVER add conditional hooks or early returns before all hooks are called!
  const { lang } = useTranslation();

  // Safe item check - use optional chaining for all accesses
  // These are NOT hooks - they're just variable assignments
  const isValidItem = Boolean(item && item.id);
  const safeItemId = item?.id || '';
  const safeItemStatus = item?.status;

  // All state hooks - must be called unconditionally
  const [showReviewerDialog, setShowReviewerDialog] = useState(false);
  const [showResponsiblePersonDialog, setShowResponsiblePersonDialog] = useState(false);
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false);
  const [evidenceExpanded, setEvidenceExpanded] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>(() => {
    if (!item) return undefined;
    const initialDueDate = item.dueDate || item.milestoneDate || (item as any).milestone_due_date;
    return initialDueDate ? new Date(initialDueDate) : undefined;
  });
  const [selectedPhases, setSelectedPhases] = useState<string[]>(
    item?.applicable_phases || item?.applicablePhases || []
  );

  // All refs - must be called unconditionally FIRST (before any state that depends on computed values)
  const itemIdRef = useRef(safeItemId);
  const userSelectedStatusRef = useRef<string | null>(null); // User's selected status - PERMANENT LOCK until DB confirms

  // Safe status mapping with fallback - compute AFTER refs
  const uiStatus = useMemo(() => {
    if (!safeItemStatus) return "Open" as const;
    return mapGapStatusToUI(safeItemStatus);
  }, [safeItemStatus]);

  // displayStatus is the SINGLE SOURCE OF TRUTH for the dropdown
  // It's either:
  // 1. User's selection (when userSelectedStatusRef is set) - NEVER changes until DB confirms
  // 2. uiStatus (when no user selection) - syncs with database
  const [displayStatus, setDisplayStatus] = useState<string>(() => {
    if (!safeItemStatus) return "Open";
    try {
      return mapGapStatusToUI(safeItemStatus);
    } catch {
      return "Open";
    }
  });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Calculate derived values safely
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = dueDate &&
    dueDate.toISOString().split('T')[0] < today &&
    safeItemStatus !== "compliant";

  // Reset state ONLY when item ID changes (different gap item)
  // CRITICAL: Do NOT reset when item prop changes but ID stays the same
  // This preserves locks when refetch updates the items array
  useEffect(() => {
    if (!isValidItem || !safeItemId) return;

    // ONLY reset if this is a completely different item (different ID)
    // This prevents locks from being cleared when refetch updates same item
    if (itemIdRef.current !== safeItemId) {
      itemIdRef.current = safeItemId;
      setDisplayStatus(uiStatus || "Open");
      userSelectedStatusRef.current = null; // Clear user selection for new item
    }
    // If same item ID, DO NOT reset - preserve user's lock even if item prop changes
  }, [safeItemId, isValidItem]); // Removed uiStatus dependency - only reset on ID change

  // REFACTORED: Simple and robust status sync logic
  // Rule: If user has selected a status, displayStatus NEVER changes from uiStatus
  // Only sync displayStatus when:
  // 1. No user selection exists (userSelectedStatusRef is null)
  // 2. Database confirmed user's selection (uiStatus matches userSelectedStatusRef)
  useEffect(() => {
    if (!uiStatus || !isValidItem || !safeItemId) return;

    // CRITICAL: Ensure this is still the same item (prevent cross-item interference)
    if (itemIdRef.current !== safeItemId) {
      return; // Different item - ignore
    }

    // CRITICAL: If user has selected a status, check if database confirmed it
    if (userSelectedStatusRef.current !== null) {
      const userSelected = userSelectedStatusRef.current;

      // User has made a selection - ONLY unlock if database confirms it
      if (uiStatus === userSelected) {
        // Database confirmed! Unlock and sync
        userSelectedStatusRef.current = null;
        if (displayStatus !== uiStatus) {
          setDisplayStatus(uiStatus);
        }
      }
      // If uiStatus doesn't match user's selection, DO NOTHING
      // displayStatus stays as user selected - PERMANENT LOCK
      // This prevents auto-switching when refetch returns old data
      return;
    }

    // No user selection - safe to sync displayStatus with uiStatus
    // But only if displayStatus is different (avoid unnecessary updates)
    if (uiStatus !== displayStatus && (uiStatus === "Open" || uiStatus === "Closed" || uiStatus === "N/A")) {
      setDisplayStatus(uiStatus);
    }
  }, [uiStatus, displayStatus, safeItemId, isValidItem]);

  // REFACTORED: Simple and robust status change handler
  // Allows multiple status changes - user can change status again even if previous change is pending
  const handleStatusChange = useCallback((value: string) => {
    // Guard checks
    if (disabled) return;
    if (!isValidItem || !safeItemId || !onStatusChange) return;
    if (value === displayStatus) return; // No change needed

    // CRITICAL: Ensure this is still the same item (prevent cross-item updates)
    if (itemIdRef.current !== safeItemId) {
      return; // Item ID changed - ignore
    }

    // IMMEDIATE: Update UI and lock it
    // This happens BEFORE database update to provide instant feedback
    setDisplayStatus(value);
    setIsUpdatingStatus(true);
    userSelectedStatusRef.current = value; // PERMANENT LOCK - prevents ALL updates from uiStatus

    // Update database (non-blocking)
    // The lock will be cleared when useEffect detects uiStatus matches userSelectedStatusRef
    Promise.resolve(onStatusChange(safeItemId, value as "Open" | "Closed" | "N/A"))
      .catch(() => {
        // On error, revert to uiStatus and unlock
        setDisplayStatus(uiStatus);
        userSelectedStatusRef.current = null;
      })
      .finally(() => {
        setIsUpdatingStatus(false);
      });
  }, [safeItemId, isValidItem, onStatusChange, displayStatus, uiStatus]);

  const handleDueDateChange = async (newDate: Date | undefined) => {
    if (!isValidItem) return;

    setDueDate(newDate);

    // Convert Date to ISO string or null for the service
    const dateString = newDate ? newDate.toISOString().split('T')[0] : null;
    const success = await updateGapItemDueDate(safeItemId || item?.clauseId || '', dateString);

    if (!success) {
      // Revert on failure
      const initialDueDate = item.dueDate || item.milestoneDate || (item as any).milestone_due_date;
      setDueDate(initialDueDate ? new Date(initialDueDate) : undefined);
    }
  };

  const handleAssignReviewers = () => {
    setShowReviewerDialog(true);
  };

  const handlePhasesChange = async (newPhases: string[]) => {
    if (!isValidItem) return;

    console.log(`[GapItem] Updating phases for item ${safeItemId}:`, newPhases);

    // Optimistically update the UI
    const previousPhases = selectedPhases;
    setSelectedPhases(newPhases);

    const success = await updateGapItemPhases(safeItemId, newPhases);

    if (success) {
      toast({
        title: lang('gapAnalysis.gapItem.phasesUpdated'),
        description: newPhases.length === 0 ?
          lang('gapAnalysis.gapItem.appliesToAllPhases') :
          (newPhases.length === 1 ? lang('gapAnalysis.gapItem.appliesToPhases').replace('{{count}}', String(newPhases.length)) : lang('gapAnalysis.gapItem.appliesToPhasesPlural').replace('{{count}}', String(newPhases.length))),
      });
    } else {
      // Revert on failure
      console.log(`[GapItem] Phase update failed, reverting to previous phases:`, previousPhases);
      setSelectedPhases(previousPhases);
      toast({
        title: lang('gapAnalysis.gapItem.errorUpdatingPhases'),
        description: lang('gapAnalysis.gapItem.noPermissionOrError'),
        variant: "destructive",
      });
    }
  };

  // Fetch CI counts - ALWAYS call useQuery (unconditional) but handle invalid items inside
  // This ensures hook count is always the same
  const { data: ciCounts = { documents: 0, audits: 0, activities: 0 }, refetch: refetchCounts } = useQuery({
    queryKey: ['gap-ci-counts', safeItemId || 'invalid'],
    queryFn: async () => {
      // Handle invalid items inside the query function, not via enabled prop
      if (!safeItemId || !isValidItem) {
        return { documents: 0, audits: 0, activities: 0 };
      }

      const [documentsResult, auditsResult, activitiesResult] = await Promise.all([
        supabase
          .from('gap_document_links')
          .select('id', { count: 'exact', head: true })
          .eq('gap_item_id', safeItemId),
        supabase
          .from('gap_audit_links')
          .select('id', { count: 'exact', head: true })
          .eq('gap_item_id', safeItemId),
        supabase
          .from('gap_activity_links')
          .select('id', { count: 'exact', head: true })
          .eq('gap_item_id', safeItemId)
      ]);

      return {
        documents: documentsResult.count || 0,
        audits: auditsResult.count || 0,
        activities: activitiesResult.count || 0
      };
    },
    // Always enabled - handle invalid items in queryFn to keep hook count consistent
    enabled: true,
    // Use stable staleTime to avoid conditional hook behavior
    staleTime: 30000 // 30 seconds - same for all renders
  });

  const { data: urlEvidenceData, refetch: refetchUrlEvidence } = useQuery({
    queryKey: ['gap-url-evidence', safeItemId || 'invalid'],
    queryFn: async () => {
      if (!safeItemId || !isValidItem) {
        return [];
      }

      const { data, error } = await supabase
        .from('gap_analysis_items')
        .select('evidence_links')
        .eq('id', safeItemId)
        .single();

      if (error) {
        console.error('[GapItem] Error fetching URL evidence:', error);
        return [];
      }

      const evidenceLinks = Array.isArray(data?.evidence_links) ? data.evidence_links : [];
      // Filter for URLs (strings starting with http or objects with url property)
      return evidenceLinks.filter((link: any) => {
        if (typeof link === 'string') return link.startsWith('http');
        return link && typeof link === 'object' && link.url;
      });
    },
    enabled: true,
    staleTime: 0, // Always refetch to get latest data
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  // Use fetched URL evidence if available, otherwise fall back to prop
  const urlCount = urlEvidenceData?.length ?? (Array.isArray(item.evidenceLinks)
    ? item.evidenceLinks.filter((link: any) => {
      if (typeof link === 'string') return link.startsWith('http');
      return link && typeof link === 'object' && link.url;
    }).length
    : 0);

  const hasUrls = urlCount > 0;

  const handleEvidenceAdded = useCallback(async () => {
    refetchCounts();

    await new Promise(resolve => setTimeout(resolve, 300));
    refetchUrlEvidence();

    if (productId) {
      await new Promise(resolve => setTimeout(resolve, 200));

      await queryClient.invalidateQueries({
        queryKey: ['productDetails', productId],
        exact: true
      });

      await queryClient.refetchQueries({
        queryKey: ['productDetails', productId],
        type: 'active'
      });

    } else if (onRefresh) {
      await new Promise(resolve => setTimeout(resolve, 200));
      onRefresh();
    }
  }, [productId, onRefresh, refetchCounts, refetchUrlEvidence]);

  // Fetch assigned reviewer groups
  const { data: assignedReviewerGroups = [], refetch: refetchReviewerGroups } = useQuery({
    queryKey: ['gap-item-reviewer-groups', safeItemId],
    queryFn: async () => {
      if (!safeItemId || !isValidItem) {
        return [];
      }
      return await getGapItemReviewerGroups(safeItemId);
    },
    enabled: isValidItem && !!safeItemId,
    staleTime: 30000 // 30 seconds
  });

  // Fetch responsible persons
  const { data: responsiblePersons = [], refetch: refetchResponsiblePersons } = useQuery({
    queryKey: ['gap-item-responsible-persons', safeItemId],
    queryFn: async () => {
      if (!safeItemId || !isValidItem) {
        return [];
      }
      return await getResponsiblePersonDetails(safeItemId);
    },
    enabled: isValidItem && !!safeItemId,
    staleTime: 30000 // 30 seconds
  });

  useEffect(() => {
    if (!showReviewerDialog) {
      refetchReviewerGroups();
    }
  }, [showReviewerDialog, refetchReviewerGroups]);

  useEffect(() => {
    if (!showResponsiblePersonDialog) {
      refetchResponsiblePersons();
    }
  }, [showResponsiblePersonDialog, refetchResponsiblePersons]);

  // Helper function to get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // CRITICAL: Early return AFTER all hooks are called
  // This ensures hooks are always called in the same order (Rules of Hooks)
  if (!isValidItem) {
    console.error('[GapItem] Invalid item prop:', item);
    return null;
  }

  const getStatusBadge = () => {
    const status = uiStatus;
    let icon;
    let className;

    switch (status) {
      case 'Open':
        icon = <Circle className="h-3.5 w-3.5" />;
        className = "bg-blue-50 text-blue-700 border-blue-200";
        break;
      case 'Closed':
        icon = <CheckCircle className="h-3.5 w-3.5" />;
        className = "bg-green-50 text-green-700 border-green-200";
        break;
      case 'N/A':
        icon = <X className="h-3.5 w-3.5" />;
        className = "bg-gray-50 text-gray-700 border-gray-200";
        break;
      default:
        icon = <Circle className="h-3.5 w-3.5" />;
        className = "bg-blue-50 text-blue-700 border-blue-200";
    }

    return (
      <Badge variant="outline" className={`flex items-center gap-1.5 px-2.5 py-1 ${className}`}>
        {icon}
        <span className="text-xs font-medium">{status}</span>
      </Badge>
    );
  };

  const getPriorityBadge = () => {
    if (!item.priority) return null;

    const priority = item.priority.toLowerCase();
    let className = '';
    let icon = <Flag className="h-3 w-3" />;

    switch (priority) {
      case 'high':
        className = "bg-red-50 text-red-700 border-red-200";
        break;
      case 'medium':
        className = "bg-orange-50 text-orange-700 border-orange-200";
        break;
      case 'low':
        className = "bg-yellow-50 text-yellow-700 border-yellow-200";
        break;
      default:
        className = "bg-gray-50 text-gray-700 border-gray-200";
    }

    return (
      <Badge variant="outline" className={`flex items-center gap-1 px-2 py-0.5 ${className}`}>
        {icon}
        <span className="text-xs font-medium capitalize">{lang('gapAnalysis.gapItem.priority').replace('{{priority}}', item.priority)}</span>
      </Badge>
    );
  };

  const getFrameworkBadge = () => {
    if (!item.framework) return null;

    return (
      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1 px-2 py-0.5">
        <FileText className="h-3 w-3" />
        <span className="text-xs font-medium">{item.framework}</span>
      </Badge>
    );
  };

  const getClauseIdBadge = () => {
    if (!item.clauseId) return null;

    return (
      <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 font-mono text-sm px-3 py-1">
        {item.clauseId}
      </Badge>
    );
  };

  return (
    <>
      <Card className="w-full overflow-hidden border-2 border-slate-300 hover:border-slate-400 shadow-md transition-colors">
        <CardContent className="!p-4">
          {/* Header Section */}
          <div className="flex flex-col gap-4">
            {/* Header with Clause ID and Status */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Clause ID and Section Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    {getClauseIdBadge()}
                    {/* Section Badge */}
                    <Badge variant="outline" className="bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-400 font-semibold flex items-center gap-1 px-2 py-0.5">
                      <span className="text-xs font-medium">{(item.section || (item as any).clause_id) || lang('gapAnalysis.gapItem.noSectionSpecified')}</span>
                    </Badge>

                    {/* Associated Standards Badge */}
                    {(() => {
                      const standards = (item as any).associated_standards;
                      if (!standards || standards === '[]' || standards.trim() === '') return null;

                      try {
                        const parsed = JSON.parse(standards);
                        if (Array.isArray(parsed)) {
                          if (parsed.length === 0) return null;
                          const display = parsed.join(', ');
                          return (
                            <Badge variant="outline" className="bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-400 font-semibold flex items-center gap-1 px-2 py-0.5">
                              <span className="text-xs font-medium">
                                {lang('gapAnalysis.gapItem.associatedStandards')} {display}
                              </span>
                            </Badge>
                          );
                        }
                      } catch {
                      }

                      return (
                        <Badge variant="outline" className="bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-400 font-semibold flex items-center gap-1 px-2 py-0.5">
                          <span className="text-xs font-medium">
                            {lang('gapAnalysis.gapItem.associatedStandards')} {standards}
                          </span>
                        </Badge>
                      );
                    })()}

                    {(() => {
                      const teams = (item as any).recommended_teams;
                      if (!teams || teams === '[]' || teams.trim() === '') return null;

                      try {
                        const parsed = JSON.parse(teams);
                        if (Array.isArray(parsed)) {
                          if (parsed.length === 0) return null;
                          const display = parsed.join(', ');
                          return (
                            <Badge variant="outline" className="bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-400 font-semibold flex items-center gap-1 px-2 py-0.5">
                              <span className="text-xs font-medium">
                                {lang('gapAnalysis.gapItem.recommendedTeams')} {display}
                              </span>
                            </Badge>
                          );
                        }
                      } catch {
                        // Not JSON, display as-is
                      }

                      return (
                        <Badge variant="outline" className="bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-400 font-semibold flex items-center gap-1 px-2 py-0.5">
                          <span className="text-xs font-medium">
                            {lang('gapAnalysis.gapItem.recommendedTeams')} {teams}
                          </span>
                        </Badge>
                      );
                    })()}
                  </div>

                  {/* Due Date - Aligned to the right */}
                  <div className="flex items-center gap-2">
                    <Select
                      value={displayStatus}
                      onValueChange={handleStatusChange}
                      disabled={isUpdatingStatus || disabled}
                    >
                      <SelectTrigger className="w-[100px] !h-10 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">{lang('gapAnalysis.gapItem.statusOpen')}</SelectItem>
                        <SelectItem value="Closed">{lang('gapAnalysis.gapItem.statusClosed')}</SelectItem>
                        <SelectItem value="N/A">{lang('gapAnalysis.gapItem.statusNA')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {dueDate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => !disabled && handleDueDateChange(undefined)}
                        className="h-auto p-1 text-muted-foreground hover:text-destructive"
                        disabled={disabled}
                      >
                        {lang('gapAnalysis.gapItem.clear')}
                      </Button>
                    )}
                  </div>
                </div>

                <div className='flex items-center justify-between gap-2'>
                  {/* Requirement Summary */}
                  <h3 className="text-lg font-semibold text-foreground mb-2 leading-tight max-w-[45rem] truncate">
                    {item.requirement}
                  </h3>
                  <Input
                    type="date"
                    value={dueDate ? dueDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => !disabled && handleDueDateChange(e.target.value ? new Date(e.target.value) : undefined)}
                    className="w-auto"
                    placeholder="Set due date"
                    disabled={disabled}
                  />
                </div>

                {/* Additional Context */}
                {item.clauseSummary && item.clauseSummary !== item.requirement && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 mb-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.clauseSummary}
                    </p>
                  </div>
                )}
              </div>

              {/* Overdue badge if applicable */}
              {isOverdue && (
                <Badge variant="destructive" className="flex items-center gap-1.5 px-2.5 py-1 flex-shrink-0">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">{lang('gapAnalysis.gapItem.overdue')}</span>
                </Badge>
              )}
            </div>

            {/* Content Grid - Simplified for consistency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Assigned To */}
              {item.assignedTo && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-foreground">{lang('gapAnalysis.gapItem.assignedTo')}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.assignedTo}
                  </div>
                </div>
              )}

              {/* Phases - Only show for product-specific context */}
              {productId && (
                <div className="space-y-1">
                  <PhaseSelector
                    selectedPhases={selectedPhases}
                    onPhasesChange={handlePhasesChange}
                    companyId={companyId}
                    disabled={disabled}
                  />
                </div>
              )}

              <div className='flex gap-2 flex-wrap'>
                {/* Responsible Person Button */}
                <div className='flex flex-col gap-2'>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => !disabled && setShowResponsiblePersonDialog(true)}
                    className="flex items-center gap-1 bg-green-50 border-green-200 hover:bg-green-100"
                    disabled={disabled}
                  >
                    <UserCheck className="h-3 w-3" />
                    {lang('gapAnalysis.gapItem.responsiblePerson')}
                  </Button>
                  {/* Assigned Responsible Persons Display */}
                  {responsiblePersons.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col justify-start items-start gap-1 cursor-pointer">
                              {responsiblePersons.slice(0, 2).map((person) => (
                                <Badge
                                  key={person.id}
                                  className="text-sm font-semibold bg-green-100 hover:bg-green-200 border-green-600 text-green-700"
                                >
                                  {person.name}
                                </Badge>
                              ))}
                              {responsiblePersons.length > 2 && (
                                <Badge className="text-sm font-semibold bg-green-100 hover:bg-green-200 border-green-600 text-green-700">
                                  +{responsiblePersons.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TooltipTrigger>
                          {responsiblePersons.length > 2 && (
                            <TooltipContent>
                              <div className="space-y-1">
                                <p className="font-medium text-xs">{lang('gapAnalysis.gapItem.allResponsiblePersons')}</p>
                                {responsiblePersons.map((person, index) => (
                                  <p key={person.id} className="text-xs">{index + 1}. {person.name}</p>
                                ))}
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>

                {/* Assign Reviewers Button */}
                <div className='flex flex-col gap-2'>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => !disabled && handleAssignReviewers()}
                    className="flex items-center gap-1"
                    disabled={disabled}
                  >
                    <Users className="h-3 w-3" />
                    {lang('gapAnalysis.gapItem.assignReviewers')}
                  </Button>
                  {/* Assigned Reviewer Groups Display */}
                  {assignedReviewerGroups.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col justify-start items-start gap-1 cursor-pointer">
                              {assignedReviewerGroups.slice(0, 2).map((group) => (
                                <Badge
                                  key={group.id}
                                  variant="outline"
                                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-600 flex items-center gap-1 px-2 py-0.5 text-sm font-semibold"
                                >
                                  {group.name}
                                </Badge>
                              ))}
                              {assignedReviewerGroups.length > 2 && (
                                <Badge className="text-sm font-semibold bg-blue-100 hover:bg-blue-200 border-blue-600 text-blue-700">
                                  +{assignedReviewerGroups.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TooltipTrigger>
                            {assignedReviewerGroups.length > 2 && (
                            <TooltipContent>
                              <div className="space-y-1">
                                <p className="font-medium text-xs">{lang('gapAnalysis.gapItem.allReviewerGroups')}</p>
                                {assignedReviewerGroups.map((group, index) => (
                                  <p key={group.id} className="text-xs">{index + 1}. {group.name}</p>
                                ))}
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              </div>

              {/* Status selector and actions */}
              <div className='flex justify-end items-center gap-2 relative'>
                <div className="space-y-1 flex items-center gap-2 justify-end md:col-span-1 lg:col-span-1">

                  {isUpdatingStatus && (
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  )}
                </div>
              </div>
            </div>

            {/* Overdue warning if applicable */}
            {isOverdue && (
              <div className="mt-2">
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {lang('gapAnalysis.gapItem.itemOverdue')}
                </p>
              </div>
            )}

            {/* Evidence & Verification Method - Show if available */}
            {(item as any).evidence_method && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">{lang('gapAnalysis.gapItem.evidenceMethod')}</div>
                <div className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                  {(item as any).evidence_method}
                </div>
              </div>
            )}

            {/* Evidence Section */}
            <div className="pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setEvidenceExpanded(!evidenceExpanded)}
                  title="Click to manage evidence"
                >
                  {/* Document CI Indicator */}
                  <div className="flex items-center gap-2">
                    <FileText className={`h-4 w-4 ${ciCounts.documents > 0 ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="text-sm text-muted-foreground">
                      {ciCounts.documents !== 1 ? lang('gapAnalysis.gapItem.docsPlural').replace('{{count}}', String(ciCounts.documents)) : lang('gapAnalysis.gapItem.docs').replace('{{count}}', String(ciCounts.documents))}
                    </span>
                  </div>

                  {/* Audit CI Indicator */}
                  <div className="flex items-center gap-2">
                    <Calendar className={`h-4 w-4 ${ciCounts.audits > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="text-sm text-muted-foreground">
                      {ciCounts.audits !== 1 ? lang('gapAnalysis.gapItem.auditsPlural').replace('{{count}}', String(ciCounts.audits)) : lang('gapAnalysis.gapItem.audits').replace('{{count}}', String(ciCounts.audits))}
                    </span>
                  </div>

                  {/* Activity CI Indicator */}
                  <div className="flex items-center gap-2">
                    <Activity className={`h-4 w-4 ${ciCounts.activities > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
                    <span className="text-sm text-muted-foreground">
                      {ciCounts.activities !== 1 ? lang('gapAnalysis.gapItem.activitiesPlural').replace('{{count}}', String(ciCounts.activities)) : lang('gapAnalysis.gapItem.activities').replace('{{count}}', String(ciCounts.activities))}
                    </span>
                  </div>

                  {/* URL Indicator */}
                  <div className="flex items-center gap-2">
                    <ExternalLink className={`h-4 w-4 ${hasUrls ? 'text-purple-600' : 'text-gray-400'}`} />
                    <span className="text-sm text-muted-foreground">
                      {urlCount !== 1 ? lang('gapAnalysis.gapItem.urlsPlural').replace('{{count}}', String(urlCount)) : lang('gapAnalysis.gapItem.urls').replace('{{count}}', String(urlCount))}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Add Evidence Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => !disabled && setShowEvidenceDialog(true)}
                    className="flex items-center gap-1"
                    disabled={disabled}
                  >
                    <Plus className="h-3 w-3" />
                    {lang('gapAnalysis.gapItem.addEvidence')}
                  </Button>

                  {/* Expand/Collapse Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEvidenceExpanded(!evidenceExpanded)}
                    className="flex items-center gap-1"
                  >
                    {evidenceExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Expanded Evidence Management - ALWAYS render to keep hooks consistent */}
              {/* Conditionally show/hide with CSS to prevent hook count changes */}
              <div className={`mt-4 ${evidenceExpanded ? 'block' : 'hidden'}`}>
                <GapItemExpandedEvidence
                  item={item}
                  companyId={companyId}
                  onEvidenceChange={handleEvidenceAdded}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <GapAnalysisReviewerDialog
        open={showReviewerDialog}
        onOpenChange={(open) => {
          setShowReviewerDialog(open);
          if (!open) {
            refetchReviewerGroups();
          }
        }}
        item={item}
        companyId={companyId}
        onReviewerGroupsChanged={() => {
          refetchReviewerGroups();
        }}
      />

      <ResponsiblePersonDialog
        open={showResponsiblePersonDialog}
        onOpenChange={(open) => {
          setShowResponsiblePersonDialog(open);
          if (!open) {
            refetchResponsiblePersons();
          }
        }}
        item={item}
        companyId={companyId}
        onResponsiblePersonsChanged={() => {
          refetchResponsiblePersons();
        }}
      />

      <GapAnalysisEvidenceDialog
        open={showEvidenceDialog}
        onOpenChange={setShowEvidenceDialog}
        itemId={safeItemId}
        productId={productId}
        companyId={companyId}
        onEvidenceAdded={handleEvidenceAdded}
      />
    </>
  );
}