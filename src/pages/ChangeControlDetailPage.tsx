import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { fetchLinkedDocs, decorateLinkedDoc } from '@/services/ccrLinkedDocsService';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, Clock, CheckCircle, Users, Trash2, Send, XCircle, RotateCcw, Pencil, PlayCircle, ShieldCheck, ShieldAlert, Lock, Calendar as CalendarIcon, Check, X as XIcon, Mail, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { CCRImpactAnalysis } from '@/components/change-control/CCRImpactAnalysis';
import {
  useCCRById,
  useCCRTransitions,
  useDeleteCCR,
  useTransitionCCRState,
  useUpdateCCR,
  resolveCurrentCCRProfileId,
  useRequestCCRExemption,
  useReviewCCRExemption,
} from '@/hooks/useChangeControlData';
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog';
import { CCRTransitionDialog } from '@/components/change-control/CCRTransitionDialog';
import { CCRImpactEditDialog } from '@/components/change-control/CCRImpactEditDialog';
import { CCRImplementationEditDialog } from '@/components/change-control/CCRImplementationEditDialog';
import { CCRSubmitForReviewDialog, type CCRSubmitForReviewPayload } from '@/components/change-control/CCRSubmitForReviewDialog';
import { CCRExemptionRequestDialog } from '@/components/change-control/CCRExemptionRequestDialog';
import { CCRExemptionReviewDialog } from '@/components/change-control/CCRExemptionReviewDialog';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { supabase } from '@/integrations/supabase/client';
import { 
  CCR_STATUS_LABELS, 
  CCR_STATUS_COLORS, 
  CHANGE_TYPE_LABELS, 
  CCR_SOURCE_LABELS,
  RISK_IMPACT_LABELS,
  CCRStatus,
  ChangeType,
  CCR_PERSPECTIVE_LABELS,
  CCR_PERSPECTIVE_ORDER,
  suggestCCRPerspectives,
  type CCRPerspective,
} from '@/types/changeControl';
import {
  useCCRReviewerAssignments,
  useReplaceCCRReviewers,
  useApproveCCRPerspectives,
  isCCRFullyApproved,
  pendingPerspectivesForUser,
} from '@/hooks/useCCRReviewerAssignments';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';
import { AiAssistPopover } from '@/components/change-control/AiAssistPopover';
import { CCRAuditLog } from '@/components/change-control/CCRAuditLog';
import { CCRLinkedDocuments } from '@/components/change-control/CCRLinkedDocuments';
import { useCCRLinkedDocsDedupedCount } from '@/hooks/useCCRLinkedDocsDedupedCount';
import { useCCRDescriptionDrift } from '@/hooks/useCCRDescriptionDrift';
import { AppNotificationService } from '@/services/appNotificationService';
import { postmarkService } from '@/services/resendMailService';
import { ESignPopup } from '@/components/esign/ESignPopup';
import { useAuth } from '@/context/AuthContext';
import { hasAdminPrivileges } from '@/utils/roleUtils';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Inline edit helpers (Draft-only)
// ---------------------------------------------------------------------------

type EditableTextProps = {
  label: string;
  value: string | null | undefined;
  placeholder?: string;
  multiline?: boolean;
  editable: boolean;
  saving?: boolean;
  onSave: (next: string) => void;
  emptyText?: string;
  aiAssist?: React.ReactNode;
};

function EditableText({
  label,
  value,
  placeholder,
  multiline,
  editable,
  saving,
  onSave,
  emptyText,
  aiAssist,
}: EditableTextProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value ?? '');

  React.useEffect(() => {
    if (!editing) setDraft(value ?? '');
  }, [value, editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed !== (value ?? '').trim()) {
      onSave(trimmed);
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value ?? '');
    setEditing(false);
  };

  return (
    <div className="group">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <div className="flex items-center gap-1">
          {editable && aiAssist}
          {editable && !editing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setEditing(true)}
              aria-label={`Edit ${label}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
      {editing ? (
        <div className="mt-1 space-y-2">
          {multiline ? (
            <Textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              rows={4}
              onKeyDown={(e) => {
                if (e.key === 'Escape') cancel();
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') commit();
              }}
            />
          ) : (
            <Input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              onKeyDown={(e) => {
                if (e.key === 'Escape') cancel();
                if (e.key === 'Enter') commit();
              }}
            />
          )}
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={commit} disabled={saving}>
              <Check className="h-3.5 w-3.5 mr-1" /> Save
            </Button>
            <Button size="sm" variant="ghost" onClick={cancel} disabled={saving}>
              <XIcon className="h-3.5 w-3.5 mr-1" /> Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className={cn('mt-1', multiline && 'whitespace-pre-wrap')}>
          {value && value.trim().length > 0 ? (
            value
          ) : (
            <span className="text-muted-foreground italic">
              {emptyText ?? `No ${label.toLowerCase()} yet`}
            </span>
          )}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// State Transition Timeline — shared between Details and History tabs.
// ---------------------------------------------------------------------------

type TimelineCcr = {
  id: string;
  created_at: string;
  owner?: { full_name?: string } | null;
  creator?: { full_name?: string } | null;
};

type TimelineTransition = {
  id: string;
  to_status: string;
  transition_reason: string | null;
  created_at: string;
  transitioner?: { full_name?: string } | null;
};

function StateTransitionTimeline({
  ccr,
  transitions,
  loading,
  unknownLabel,
}: {
  ccr: TimelineCcr;
  transitions: TimelineTransition[];
  loading: boolean;
  unknownLabel: string;
}) {
  if (loading) return <LoadingSpinner />;

  type StatusKey = keyof typeof CCR_STATUS_LABELS | 'created';
  const meta: Record<string, { ring: string; bg: string; iconColor: string; Icon: React.ComponentType<{ className?: string }> }> = {
    draft: { ring: 'border-slate-400', bg: 'bg-slate-50', iconColor: 'text-slate-500', Icon: FileText },
    under_review: { ring: 'border-amber-400', bg: 'bg-amber-50', iconColor: 'text-amber-600', Icon: Clock },
    approved: { ring: 'border-blue-500', bg: 'bg-blue-50', iconColor: 'text-blue-600', Icon: ShieldCheck },
    rejected: { ring: 'border-red-500', bg: 'bg-red-50', iconColor: 'text-red-600', Icon: XCircle },
    implemented: { ring: 'border-orange-500', bg: 'bg-orange-50', iconColor: 'text-orange-600', Icon: PlayCircle },
    verified: { ring: 'border-violet-500', bg: 'bg-violet-50', iconColor: 'text-violet-600', Icon: CheckCircle },
    closed: { ring: 'border-slate-900', bg: 'bg-slate-100', iconColor: 'text-slate-800', Icon: Lock },
    created: { ring: 'border-cyan-400', bg: 'bg-cyan-50', iconColor: 'text-cyan-600', Icon: FileText },
  };

  const stripReviewerSuffix = (raw: string | null | undefined) => {
    if (!raw) return '';
    const idx = raw.indexOf('\n\nAssigned reviewers — ');
    return (idx >= 0 ? raw.slice(0, idx) : raw).trim();
  };

  type Item = {
    id: string;
    status: StatusKey;
    title: string;
    actor: string;
    description: string;
    timestamp: string;
  };

  // Chronological order: Created first, then transitions ascending
  // (transitions arrive DESC from the hook).
  const items: Item[] = [
    {
      id: `created-${ccr.id}`,
      status: 'created',
      title: 'CCR Created',
      actor: ccr.creator?.full_name || ccr.owner?.full_name || unknownLabel,
      description: 'CCR raised.',
      timestamp: ccr.created_at,
    },
    ...[...transitions]
      .reverse()
      .map((t) => ({
        id: t.id,
        status: t.to_status as keyof typeof CCR_STATUS_LABELS,
        title: CCR_STATUS_LABELS[t.to_status as keyof typeof CCR_STATUS_LABELS] ?? t.to_status,
        actor: t.transitioner?.full_name || unknownLabel,
        description: stripReviewerSuffix(t.transition_reason),
        timestamp: t.created_at,
      })),
  ];

  return (
    <ol className="relative">
      {items.map((item, i) => {
        const m = meta[item.status as string] ?? meta.draft;
        const Icon = m.Icon;
        const isLast = i === items.length - 1;
        return (
          <li key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className="absolute left-[15px] top-8 bottom-0 w-px bg-border"
              />
            )}
            <span
              className={`relative z-10 mt-0.5 h-8 w-8 shrink-0 rounded-full border-2 ${m.ring} ${m.bg} flex items-center justify-center shadow-sm`}
            >
              <Icon className={`h-4 w-4 ${m.iconColor}`} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight text-foreground">
                {item.title}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                <span className="font-medium text-foreground/80">{item.actor}</span>
                <span className="mx-1.5">•</span>
                <span className="font-mono">
                  {format(new Date(item.timestamp), 'MMM d, HH:mm')}
                </span>
              </p>
              {item.description && item.description !== '—' && (
                <p
                  className="text-xs text-muted-foreground mt-1.5 break-words line-clamp-3"
                  title={item.description}
                >
                  {item.description}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function ChangeControlDetailPage() {
  const { ccrId } = useParams<{ ccrId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { lang } = useTranslation();
  const { user: currentUser } = useAuth();
  const { data: ccr, isLoading: ccrLoading } = useCCRById(ccrId);
  const { data: transitions = [], isLoading: transitionsLoading } = useCCRTransitions(ccrId);
  const deleteCCR = useDeleteCCR();
  const transitionState = useTransitionCCRState();
  const updateCCR = useUpdateCCR();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [impactEditOpen, setImpactEditOpen] = useState(false);
  const [implementationEditOpen, setImplementationEditOpen] = useState(false);
  const [submitForReviewOpen, setSubmitForReviewOpen] = useState(false);
  const [exemptionRequestOpen, setExemptionRequestOpen] = useState(false);
  const [exemptionReviewOpen, setExemptionReviewOpen] = useState(false);
  const requestExemption = useRequestCCRExemption();
  const reviewExemption = useReviewCCRExemption();
  // null | assignment-id (sign just my pending perspectives for that assignment)
  const [esignAssignmentId, setEsignAssignmentId] = useState<string | null>(null);
  const [visibleDocCount, setVisibleDocCount] = useState<number | null>(null);
  // Resend review request state — must live above the !ccr early return
  // to keep hook order stable.
  const [resendingForId, setResendingForId] = useState<string | null>(null);
  const [lastResendAt, setLastResendAt] = useState<number>(0);
  const dedupedDocsCount = useCCRLinkedDocsDedupedCount(
    ccr?.id ?? '',
    Array.isArray(ccr?.affected_documents) ? ccr.affected_documents : []
  );
  const linkedDocIds = Array.isArray(ccr?.affected_documents)
    ? (ccr!.affected_documents as string[])
    : [];
  const { data: linkedDocsForGate = [] } = useQuery({
    queryKey: ['ccr-linked-docs', ccr?.id ?? '', linkedDocIds.join(',')],
    queryFn: () => fetchLinkedDocs(linkedDocIds),
    enabled: linkedDocIds.length > 0,
  });
  const unapprovedLinkedDocs = linkedDocsForGate.filter(
    (d) => (d.status || '').toLowerCase() !== 'approved'
  );
  // No docs → nothing to gate on. Docs present → all must be approved.
  // While the query is loading, treat as not-approved so the button stays
  // locked rather than briefly enabling.
  const allLinkedDocsApproved =
    linkedDocIds.length === 0 ||
    (linkedDocsForGate.length > 0 && unapprovedLinkedDocs.length === 0);
  // Implementation exemption — applies only to the document IDs the author
  // selected at request time. An approved exemption excuses *only* those
  // documents; any other unapproved linked doc still locks Mark Implemented.
  const exemptionApproved = ccr?.exemption_status === 'approved';
  const exemptionRequested = ccr?.exemption_status === 'requested';
  const exemptionRejected = ccr?.exemption_status === 'rejected';
  const exemptionDocIds: string[] = Array.isArray(ccr?.exemption_document_ids)
    ? ccr!.exemption_document_ids
    : [];
  const exemptedDocSet = new Set(exemptionApproved ? exemptionDocIds : []);
  const unapprovedAfterExemption = unapprovedLinkedDocs.filter(
    (d) => !exemptedDocSet.has(d.id),
  );
  const canMarkImplemented =
    allLinkedDocsApproved ||
    (exemptionApproved && unapprovedAfterExemption.length === 0);
  // Resolve the docs that the active request/decision covers, for display.
  const exemptionDocList = (() => {
    if (exemptionDocIds.length === 0) return [];
    const byId = new Map(linkedDocsForGate.map((d) => [d.id, d]));
    return exemptionDocIds
      .map((id) => byId.get(id))
      .filter((d): d is NonNullable<typeof d> => !!d);
  })();
  const descriptionDrift = useCCRDescriptionDrift(ccr?.description, linkedDocsForGate);
  const [transitionDialog, setTransitionDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    destructive?: boolean;
    target: CCRStatus | null;
  }>({ open: false, title: '', description: '', confirmLabel: '', target: null });

  // Resolve reviewer names for the Approvals tiles
  const { users: companyUsers } = useCompanyUsers(ccr?.company_id);
  const reviewerName = (id?: string | null) =>
    id ? companyUsers.find((u) => u.id === id)?.name ?? 'Assigned reviewer' : null;
  // Eligibility to review an exemption. We accept any of:
  //   1. Per-company admin row in user_company_access for THIS company.
  //   2. Privileged platform role on the auth user (super_admin, admin,
  //      business, consultant) via hasAdminPrivileges — covers super-admins
  //      reaching the CCR through the global /app/change-control/<id> route.
  // (We do NOT mount useCompanyRoles here — it owns a single realtime
  // channel keyed on the user id and the layout already subscribes; adding
  // another subscriber throws "cannot add postgres_changes after subscribe".)
  const companyAdmins = companyUsers.filter((u) => u.access_level === 'admin');
  const userMetaRole =
    (currentUser?.user_metadata as Record<string, unknown> | undefined)?.role;
  const isPrivilegedByRole =
    typeof userMetaRole === 'string' && hasAdminPrivileges(userMetaRole);
  const isCompanyAdminMember =
    !!currentUser?.id && companyAdmins.some((u) => u.id === currentUser.id);
  const isCurrentUserAdmin = isPrivilegedByRole || isCompanyAdminMember;

  const { data: assignments = [] } = useCCRReviewerAssignments(ccrId);
  const replaceReviewers = useReplaceCCRReviewers();
  const approvePerspectives = useApproveCCRPerspectives();

  const activeTab = searchParams.get('tab') ?? 'details';
  const setActiveTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };

  // Auto-open the exemption review dialog when an admin lands on this page
  // through the in-app/email notification (?review=exemption). If the
  // exemption is no longer pending (already approved/rejected, or the row
  // was never in 'requested'), surface a toast so the click doesn't appear
  // to do nothing. Strip the query param afterwards so a refresh doesn't
  // keep re-opening it.
  const reviewParam = searchParams.get('review');
  const autoOpenedReviewRef = React.useRef(false);
  React.useEffect(() => {
    if (autoOpenedReviewRef.current) return;
    if (reviewParam !== 'exemption') return;
    if (!ccr) return;
    autoOpenedReviewRef.current = true;
    if (!isCurrentUserAdmin) {
      toast('Admin only', {
        description: 'Only company admins can review exemption requests.',
      });
    } else if (ccr.exemption_status === 'requested') {
      setExemptionReviewOpen(true);
    } else if (ccr.exemption_status === 'approved' || ccr.exemption_status === 'rejected') {
      toast(`Exemption already ${ccr.exemption_status}`, {
        description: 'This exemption was reviewed by another admin. See the Implementation Exemption card for details.',
      });
    } else {
      toast('No pending exemption', {
        description: 'There is no exemption request to review on this CCR — it may have been cleared.',
      });
    }
    const next = new URLSearchParams(searchParams);
    next.delete('review');
    setSearchParams(next, { replace: true });
  }, [reviewParam, ccr, isCurrentUserAdmin, searchParams, setSearchParams]);

  if (ccrLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <ConsistentPageHeader
          breadcrumbs={[
            { label: lang('changeControl.title'), onClick: () => navigate(-1) },
            { label: lang('common.loading') }
          ]}
          title={lang('common.loading')}
          subtitle={lang('changeControl.loadingDetails')}
        />
        <div className="flex-1 flex items-center justify-center">
           <LoadingSpinner size="lg" />
         </div>
       </div>
     );
   }

   if (!ccr) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center">
        <h2 className="text-xl font-semibold mb-2">{lang('changeControl.ccrNotFound')}</h2>
        <p className="text-muted-foreground mb-4">{lang('changeControl.ccrNotFoundDescription')}</p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {lang('changeControl.goBack')}
        </Button>
      </div>
    );
  }

  const breadcrumbs = [
    { label: "Client Compass", onClick: () => navigate('/app/clients') },
    { 
      label: ccr.company?.name || "Company", 
      onClick: () => navigate(`/app/company/${encodeURIComponent(ccr.company?.name || '')}`) 
    },
    { 
      label: lang('changeControl.title'),
      onClick: () => navigate(`/app/company/${encodeURIComponent(ccr.company?.name || '')}/change-control`) 
    },
    { label: ccr.ccr_id }
  ];

  const allApproved = isCCRFullyApproved(assignments);
  const isEditable = ccr.status === 'draft' || ccr.status === 'rejected';
  const isLockedFromEdit = ccr.status !== 'draft' && ccr.status !== 'under_review' && ccr.status !== 'rejected';
  const isTerminal = ccr.status === 'closed';
  const myPending = currentUser?.id
    ? pendingPerspectivesForUser(assignments, currentUser.id)
    : null;

  const openTransition = (config: {
    target: CCRStatus;
    title: string;
    description: string;
    confirmLabel: string;
    destructive?: boolean;
  }) => {
    setTransitionDialog({ open: true, ...config });
  };

  const notifyCCRStatusChange = async (
    kind: 'approved' | 'rejected',
    actorUserId: string,
    reason: string,
  ) => {
    let company: { name: string | null; app_url: string | null } | null = null;
    let recipientUserIds: string[] = [];
    try {
      const { data } = await supabase
        .from('companies')
        .select('name, app_url')
        .eq('id', ccr.company_id)
        .single();
      company = data as any;

      const ownerOrCreatorId = ccr.owner_id ?? ccr.created_by;
      const recipientIdSet = new Set<string>();
      if (ownerOrCreatorId) recipientIdSet.add(ownerOrCreatorId);
      if (kind === 'approved') {
        for (const a of assignments) recipientIdSet.add(a.user_id);
      }
      recipientUserIds = Array.from(recipientIdSet);

      if (recipientUserIds.length === 0) {
        console.warn('CCR status notify: no resolvable recipients', { kind, ccrId: ccr.id });
        return;
      }
    } catch (e) {
      console.error('Failed to load company / recipients for CCR status notify', e);
      return;
    }

    const baseUrl = company?.app_url || window.location.origin || 'https://app.xyreg.com';
    const actionUrlAbsolute = `${baseUrl}/app/change-control/${ccr.id}`;
    const actionUrlRelative = `/app/change-control/${ccr.id}`;
    const companyName = company?.name || 'your company';
    const actorName =
      companyUsers.find((u) => u.id === actorUserId)?.name ?? 'A teammate';
    const reasonExcerpt = reason.length > 200 ? `${reason.slice(0, 200)}…` : reason;

    // 1. Email
    try {
      const emailRecipients = recipientUserIds
        .map((id) => companyUsers.find((u) => u.id === id))
        .filter((u): u is NonNullable<typeof u> => !!u && !!u.email && u.email !== 'No email');
      await Promise.all(
        emailRecipients.map(async (r) => {
          const result = await postmarkService.sendCCRStatusEmail({
            kind,
            recipientEmail: r.email,
            recipientName: r.name,
            actorName,
            companyName,
            ccrId: ccr.ccr_id,
            ccrTitle: ccr.title,
            reason,
            actionUrl: actionUrlAbsolute,
          });
          if (!result.success) {
            console.warn('CCR status email failed for', r.email, result.error);
          }
        }),
      );
    } catch (e) {
      console.error('Failed to email CCR status update', e);
    }

    // 2. In-app notification
    try {
      const isApproved = kind === 'approved';
      const title = isApproved
        ? `Approved: ${ccr.ccr_id}`
        : `Rejected: ${ccr.ccr_id}`;
      const message = isApproved
        ? `${actorName} approved "${ccr.title}".`
        : `${actorName} rejected "${ccr.title}".${reasonExcerpt ? ` Reason: ${reasonExcerpt}` : ''}`;
      const notifications = recipientUserIds.map((uid) => ({
        user_id: uid,
        actor_id: actorUserId,
        actor_name: actorName,
        company_id: ccr.company_id,
        product_id: ccr.product_id ?? undefined,
        category: 'change_control' as const,
        action: (isApproved ? 'ccr_approved' : 'ccr_rejected') as 'ccr_approved' | 'ccr_rejected',
        title,
        message,
        priority: (isApproved ? 'normal' : 'high') as 'normal' | 'high',
        entity_type: 'change_control_request',
        entity_id: ccr.id,
        entity_name: ccr.ccr_id,
        action_url: actionUrlRelative,
        metadata: { reason },
      }));
      if (notifications.length > 0) {
        await new AppNotificationService().createBulkNotifications(notifications);
      }
    } catch (e) {
      console.error('Failed to create CCR status app notifications', e);
    }
  };

  const handleTransitionConfirm = async (reason: string) => {
    if (!transitionDialog.target) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const target = transitionDialog.target;
    await transitionState.mutateAsync({
      ccrId: ccr.id,
      fromStatus: ccr.status,
      toStatus: target,
      userId: user.id,
      reason,
    });
    if (target === 'approved' || target === 'rejected') {
      await notifyCCRStatusChange(target, user.id, reason);
    }
  };

  const handleSignMyPerspectives = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Your session has expired — please sign in again.');
    if (!esignAssignmentId) throw new Error('No assignment to sign.');
    const a = assignments.find((x) => x.id === esignAssignmentId);
    if (!a) throw new Error('Assignment not found.');
    if (a.user_id !== user.id) {
      throw new Error(
        `You're signed in as ${user.email}, but this review is assigned to a different reviewer.`,
      );
    }
    await resolveCurrentCCRProfileId();
    const pending = a.perspectives.filter((p) => !a.approved_perspectives.includes(p));
    await approvePerspectives.mutateAsync({
      assignment_id: a.id,
      ccr_id: ccr.id,
      user_id: user.id,
      perspectives: pending,
    });
    // If this signature completed the CCR, auto-transition to approved.
    const updated = assignments.map((x) =>
      x.id === a.id
        ? { ...x, approved_perspectives: a.perspectives, approved_at: new Date().toISOString() }
        : x,
    );
    if (isCCRFullyApproved(updated as any)) {
      const autoReason = 'All assigned reviewers have signed off on every perspective.';
      await transitionState.mutateAsync({
        ccrId: ccr.id,
        fromStatus: ccr.status,
        toStatus: 'approved',
        userId: user.id,
        reason: autoReason,
      });
      await notifyCCRStatusChange('approved', user.id, autoReason);
    }
    setEsignAssignmentId(null);
  };

  const openRejectDialog = () =>
    openTransition({
      target: 'rejected',
      title: 'Reject CCR',
      description:
        'Rejecting sends the CCR back to the author with a documented rationale. They can revise and resubmit.',
      confirmLabel: 'Reject',
      destructive: true,
    });

  const handleSubmitForReview = async (payload: CCRSubmitForReviewPayload) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const resubmittingFromRejected = ccr.status === 'rejected';
    // 1. Persist reviewer assignments
    await replaceReviewers.mutateAsync({
      ccr_id: ccr.id,
      reviewers: payload.reviewers,
      resetApprovals: resubmittingFromRejected,
    });
    // 2. Build a richer audit-trail reason that names assigned reviewers + perspectives
    const namedReason = (() => {
      const lines = payload.reviewers.map((r) => {
        const name = companyUsers.find((u) => u.id === r.user_id)?.name ?? r.user_id;
        const persps = r.perspectives.map((p) => CCR_PERSPECTIVE_LABELS[p]).join(', ');
        return `• ${name} — ${persps}`;
      });
      return `${payload.reason}\n\nAssigned reviewers:\n${lines.join('\n')}`;
    })();
    // 3. Transition status
    await transitionState.mutateAsync({
      ccrId: ccr.id,
      fromStatus: ccr.status,
      toStatus: 'under_review',
      userId: user.id,
      reason: namedReason,
    });
    // 4 + 5. Notify + email assigned reviewers (bell + email)
    await notifyAndEmailReviewers(
      payload.reviewers,
      { reason: payload.reason, actorUserId: user.id },
    );
  };

  // ---- Reusable notify+email pipeline ------------------------------------
  // Used by both initial Submit-for-Review and the "Resend review request"
  // action so reviewers always get the same in-app + email ping.
  const notifyAndEmailReviewers = async (
    reviewers: Array<{ user_id: string; perspectives: CCRPerspective[] }>,
    opts: { reason: string; actorUserId: string; isResend?: boolean },
  ): Promise<{ emailedCount: number; missingEmails: string[] }> => {
    let emailedCount = 0;
    const missingEmails: string[] = [];
    const actorName =
      companyUsers.find((u) => u.id === opts.actorUserId)?.name ?? 'A teammate';
    // In-app notifications (bell + Mission Control)
    try {
      const actionUrl = `/app/change-control/${ccr.id}`;
      const notifications = reviewers.map((r) => {
        const persps = r.perspectives.map((p) => CCR_PERSPECTIVE_LABELS[p]).join(' & ');
        const verb = opts.isResend ? 'is reminding you that you are assigned as' : 'assigned you as';
        return {
          user_id: r.user_id,
          actor_id: opts.actorUserId,
          actor_name: actorName,
          company_id: ccr.company_id,
          product_id: ccr.product_id ?? undefined,
          category: 'review' as const,
          action: 'ccr_review_assigned' as const,
          title: opts.isResend
            ? `Reminder — review requested: ${ccr.ccr_id}`
            : `Review requested: ${ccr.ccr_id}`,
          message: `${actorName} ${verb} ${persps} reviewer on "${ccr.title}". Approve & e-sign in the CCR detail page.`,
          priority: 'high' as const,
          entity_type: 'change_control_request',
          entity_id: ccr.id,
          entity_name: ccr.ccr_id,
          action_url: actionUrl,
          metadata: { perspectives: r.perspectives, reason: opts.reason, resend: !!opts.isResend },
        };
      });
      if (notifications.length > 0) {
        await new AppNotificationService().createBulkNotifications(notifications);
      }
    } catch (e) {
      console.error('Failed to notify CCR reviewers', e);
    }
    // Email
    try {
      const { data: company } = await supabase
        .from('companies')
        .select('name, app_url')
        .eq('id', ccr.company_id)
        .single();
      const baseUrl = company?.app_url || window.location.origin || 'https://app.xyreg.com';
      const actionUrl = `${baseUrl}/app/change-control/${ccr.id}`;
      const companyName = company?.name || 'your company';
      const reasonForEmail = opts.isResend
        ? `${opts.reason}\n\n(This is a reminder — the original review request was not received or actioned.)`
        : opts.reason;
      await Promise.all(
        reviewers.map(async (r) => {
          const reviewer = companyUsers.find((u) => u.id === r.user_id);
          if (!reviewer?.email || reviewer.email === 'No email') {
            missingEmails.push(reviewer?.name ?? 'reviewer');
            return;
          }
          const result = await postmarkService.sendCCRReviewEmail({
            recipientEmail: reviewer.email,
            recipientName: reviewer.name,
            inviterName: actorName,
            companyName,
            ccrId: ccr.ccr_id,
            ccrTitle: ccr.title,
            perspectives: r.perspectives.map((p) => CCR_PERSPECTIVE_LABELS[p]),
            reason: reasonForEmail,
            actionUrl,
          });
          if (!result.success) {
            console.warn('CCR review email failed for', reviewer.email, result.error);
          } else {
            emailedCount += 1;
          }
        }),
      );
    } catch (e) {
      console.error('Failed to email CCR reviewers', e);
    }
    return { emailedCount, missingEmails };
  };

  // ---- Resend review request ---------------------------------------------
  // Re-fires the notify+email pipeline for currently assigned reviewers.
  // Does NOT change reviewer assignments or CCR status.
  // (state hooks moved above the !ccr early return to keep hook order stable)
  const resendThrottleMs = 60_000;

  const handleResendReviewRequest = async (
    targetUserId?: string, // omit = all assigned reviewers
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const reviewers = (targetUserId
      ? assignments.filter((a) => a.user_id === targetUserId)
      : assignments
    ).map((a) => ({ user_id: a.user_id, perspectives: a.perspectives as CCRPerspective[] }));
    if (reviewers.length === 0) {
      toast.error('No reviewers assigned to resend to.');
      return;
    }
    setResendingForId(targetUserId ?? '__all__');
    try {
      const { emailedCount, missingEmails } = await notifyAndEmailReviewers(
        reviewers,
        {
          reason: 'Resending review request — please action when you can.',
          actorUserId: user.id,
          isResend: true,
        },
      );
      // Lightweight audit-trail row (no status change) so the History tab
      // shows the resend event. Inserted directly to avoid the hook's
      // "Status Updated" side-effects.
      try {
        const names = reviewers
          .map((r) => companyUsers.find((u) => u.id === r.user_id)?.name ?? r.user_id)
          .join(', ');
        const actorName =
          companyUsers.find((u) => u.id === user.id)?.name ?? 'A teammate';
        await resolveCurrentCCRProfileId();
        await supabase.from('change_control_state_transitions').insert({
          ccr_id: ccr.id,
          from_status: ccr.status,
          to_status: ccr.status,
          transitioned_by: user.id,
          transition_reason: `Review request resent to ${names} by ${actorName}.`,
        });
      } catch (e) {
        console.warn('Resend audit log failed (non-blocking)', e);
      }
      setLastResendAt(Date.now());
      const recipients = reviewers
        .map((r) => companyUsers.find((u) => u.id === r.user_id)?.name ?? 'reviewer')
        .join(', ');
      if (missingEmails.length > 0) {
        toast.warning(
          `Notification sent to ${recipients}. No email on file for: ${missingEmails.join(', ')}.`,
        );
      } else {
        toast.success(
          `Review request resent to ${recipients} (email + in-app notification).`,
          { description: emailedCount === 0 ? 'In-app only — no emails delivered.' : undefined },
        );
      }
    } finally {
      setResendingForId(null);
    }
  };

  // ---- Implementation Exemption handlers ---------------------------------
  // Author asks an admin to bypass the linked-docs gate; admins decide.

  const handleRequestExemption = async (input: {
    documentIds: string[];
    notes: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await requestExemption.mutateAsync({
      ccrId: ccr.id,
      description: input.notes,
      documentIds: input.documentIds,
      userId: user.id,
    });
    // Notify all company admins so any of them can act on the request.
    try {
      const actorName =
        companyUsers.find((u) => u.id === user.id)?.name ?? 'A teammate';
      // ?review=exemption tells the detail page to auto-open the review
      // dialog so admins land directly on the Approve/Reject surface.
      const actionUrl = `/app/change-control/${ccr.id}?review=exemption`;
      const docCount = input.documentIds.length;
      const adminRecipients = companyAdmins.filter((u) => u.id !== user.id);
      if (adminRecipients.length > 0) {
        const notifications = adminRecipients.map((adm) => ({
          user_id: adm.id,
          actor_id: user.id,
          actor_name: actorName,
          company_id: ccr.company_id,
          product_id: ccr.product_id ?? undefined,
          category: 'change_control' as const,
          action: 'ccr_exemption_requested' as const,
          title: `Exemption requested: ${ccr.ccr_id}`,
          message: `${actorName} is requesting an implementation exemption on "${ccr.title}" covering ${docCount} document${docCount === 1 ? '' : 's'}.`,
          priority: 'high' as const,
          entity_type: 'change_control_request',
          entity_id: ccr.id,
          entity_name: ccr.ccr_id,
          action_url: actionUrl,
          metadata: {
            notes: input.notes,
            documentIds: input.documentIds,
          },
        }));
        await new AppNotificationService().createBulkNotifications(notifications);
      }
    } catch (e) {
      console.error('Failed to notify admins of exemption request', e);
    }
  };

  const handleReviewExemption = async (
    decision: 'approved' | 'rejected',
    reason: string,
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await reviewExemption.mutateAsync({
      ccrId: ccr.id,
      decision,
      reviewerId: user.id,
      reason,
    });
    // Notify the author (who raised the exemption) of the decision.
    try {
      const actorName =
        companyUsers.find((u) => u.id === user.id)?.name ?? 'An admin';
      const actionUrl = `/app/change-control/${ccr.id}`;
      const requesterId = ccr.exemption_requested_by ?? ccr.owner_id ?? ccr.created_by;
      if (requesterId && requesterId !== user.id) {
        const isApproved = decision === 'approved';
        await new AppNotificationService().createNotification({
          user_id: requesterId,
          actor_id: user.id,
          actor_name: actorName,
          company_id: ccr.company_id,
          product_id: ccr.product_id ?? undefined,
          category: 'change_control',
          action: isApproved ? 'ccr_exemption_approved' : 'ccr_exemption_rejected',
          title: isApproved
            ? `Exemption approved: ${ccr.ccr_id}`
            : `Exemption rejected: ${ccr.ccr_id}`,
          message: isApproved
            ? `${actorName} approved your exemption for "${ccr.title}". You can now Mark Implemented.`
            : `${actorName} rejected your exemption for "${ccr.title}". Reason: ${reason}`,
          priority: 'high',
          entity_type: 'change_control_request',
          entity_id: ccr.id,
          entity_name: ccr.ccr_id,
          action_url: actionUrl,
          metadata: { decision, reason },
        });
      }
    } catch (e) {
      console.error('Failed to notify author of exemption decision', e);
    }
  };

  const renderWorkflowActions = () => {
    if (isTerminal) return null;
    const actions: React.ReactNode[] = [];

    // Pending exemption is reviewable regardless of CCR status — if the CCR
    // bounced back from Approved to Under Review, admins still need a way
    // to clear the orphan request. We prepend it so it stays prominent.
    if (exemptionRequested) {
      if (isCurrentUserAdmin) {
        actions.push(
          <Button
            key="exemption-review-top"
            size="sm"
            variant="outline"
            onClick={() => setExemptionReviewOpen(true)}
          >
            <ShieldAlert className="h-4 w-4 mr-2" />
            Review Exemption
          </Button>
        );
      } else {
        actions.push(
          <Badge
            key="exemption-pending-top"
            variant="outline"
            className="border-amber-300 bg-amber-50 text-amber-800 gap-1"
          >
            <Clock className="h-3.5 w-3.5" />
            Exemption pending admin
          </Badge>
        );
      }
    }

    if (ccr.status === 'draft' || ccr.status === 'rejected') {
      actions.push(
        <Button
          key="submit"
          size="sm"
          onClick={() => setSubmitForReviewOpen(true)}
        >
          <Send className="h-4 w-4 mr-2" />
          {ccr.status === 'rejected' ? 'Resubmit for Review' : 'Submit for Review'}
        </Button>
      );
    }

    if (ccr.status === 'under_review') {
      // Final approve button — only if there are multiple reviewers AND
      // every assigned reviewer has signed off on every perspective.
      const multiReviewer = assignments.length > 1;
      if (multiReviewer) {
        actions.push(
          <Button
            key="approve"
            size="sm"
            disabled={!allApproved}
            title={allApproved ? '' : 'Every assigned reviewer must sign off on every perspective before the CCR can be approved.'}
            onClick={() =>
              openTransition({
                target: 'approved',
                title: 'Approve CCR',
                description: 'This locks the CCR for implementation. All assigned reviewers have signed off.',
                confirmLabel: 'Approve CCR',
              })
            }
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Approve CCR
          </Button>
        );
      }
    }

    if (ccr.status === 'approved') {
      const implementBtn = (
        <Button
          key="implement"
          size="sm"
          disabled={!canMarkImplemented}
          onClick={() =>
            openTransition({
              target: 'implemented',
              title: 'Mark as Implemented',
              description: exemptionApproved && !allLinkedDocsApproved
                ? 'An admin-approved exemption is on file. Confirm the change has been executed per the implementation plan.'
                : 'Confirm that the change has been executed per the implementation plan.',
              confirmLabel: 'Mark Implemented',
            })
          }
        >
          {canMarkImplemented ? (
            <PlayCircle className="h-4 w-4 mr-2" />
          ) : (
            <Lock className="h-4 w-4 mr-2" />
          )}
          Mark Implemented
        </Button>
      );

      if (!canMarkImplemented) {
        const total = linkedDocIds.length;
        const pending = total > 0 ? unapprovedLinkedDocs.length : 0;
        actions.push(
          <TooltipProvider key="implement" delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                {/* span wrapper lets the tooltip show even when the button is disabled */}
                <span tabIndex={0} className="inline-flex">
                  {implementBtn}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="font-medium mb-1">Locked — connected documents pending approval</p>
                <p className="text-xs leading-relaxed">
                  {linkedDocsForGate.length === 0
                    ? `Loading the ${total} connected document${total === 1 ? '' : 's'}…`
                    : `${pending} of ${linkedDocsForGate.length} connected document${linkedDocsForGate.length === 1 ? ' is' : 's are'} not yet approved.`}
                  {' '}Open the <span className="font-medium">Documents</span> tab and move every linked document to <span className="font-medium">Approved</span> — or request an admin exemption.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );

        // Exemption flow: locked → offer Request / show Pending / re-request
        // after rejection. Admins also see a Review button when a request is
        // pending.
        // Pending exemption is rendered globally above — only the
        // "Request" / "Re-request" button belongs to the approved-state
        // path here, since requesting only makes sense once the CCR is
        // Approved and the linked-docs gate is locked.
        if (!exemptionRequested) {
          actions.push(
            <Button
              key="exemption-request"
              size="sm"
              variant="outline"
              disabled={requestExemption.isPending}
              onClick={() => setExemptionRequestOpen(true)}
            >
              <ShieldAlert className="h-4 w-4 mr-2" />
              {exemptionRejected ? 'Re-request Exemption' : 'Request Exemption'}
            </Button>
          );
        }
      } else {
        actions.push(implementBtn);
      }
    }

    if (ccr.status === 'implemented') {
      actions.push(
        <Button
          key="verify"
          size="sm"
          onClick={() =>
            openTransition({
              target: 'verified',
              title: 'Mark as Verified',
              description:
                'Confirm that the change has been verified against the verification plan and evidence is on file.',
              confirmLabel: 'Mark Verified',
            })
          }
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark Verified
        </Button>
      );
    }

    if (ccr.status === 'verified') {
      actions.push(
        <Button
          key="close"
          size="sm"
          onClick={() =>
            openTransition({
              target: 'closed',
              title: 'Close CCR',
              description: 'Closing the CCR finalises the change record. No further actions can be taken.',
              confirmLabel: 'Close CCR',
            })
          }
        >
          <Lock className="h-4 w-4 mr-2" />
          Close CCR
        </Button>
      );
    }

    return actions;
  };

  return (
    <div className="space-y-6">
      <ConsistentPageHeader
        breadcrumbs={breadcrumbs}
        title={ccr.ccr_id}
        subtitle={ccr.title}
        actions={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Badge variant="outline" className={`text-${CCR_STATUS_COLORS[ccr.status]}-600`}>
              {CCR_STATUS_LABELS[ccr.status]}
            </Badge>
            {isEditable ? (
              <Select
                value={ccr.change_type}
                onValueChange={(v) =>
                  updateCCR.mutate({ id: ccr.id, change_type: v as ChangeType } as any)
                }
              >
                <SelectTrigger className="h-8 w-auto gap-2 px-3 text-xs font-medium bg-secondary border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CHANGE_TYPE_LABELS) as ChangeType[]).map((t) => (
                    <SelectItem key={t} value={t}>{CHANGE_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="secondary">
                {CHANGE_TYPE_LABELS[ccr.change_type]}
              </Badge>
            )}
            {renderWorkflowActions()}
            {ccr.status === 'draft' && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        }
      />

      <div className="px-2 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <TabsList>
              <TabsTrigger value="details">{lang('changeControl.detailsTab')}</TabsTrigger>
              <TabsTrigger value="impact">{lang('changeControl.impactAssessmentTab')}</TabsTrigger>
              <TabsTrigger value="implementation">{lang('changeControl.implementationTab')}</TabsTrigger>
              <TabsTrigger value="documents">
                Documents
                {(() => {
                  const count = dedupedDocsCount;
                  return count > 0 ? (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                      {count}
                    </Badge>
                  ) : null;
                })()}
              </TabsTrigger>
              <TabsTrigger value="history">{lang('changeControl.historyTab')}</TabsTrigger>
            </TabsList>

            {/* Reviewer-side quick actions, aligned with the tabs row.
                Sole reviewer → one Accept&Sign covering all gates.
                Multi-gate reviewer → one Approve button per pending gate.
                Reject is shown for any user with at least one pending gate. */}
            {ccr.status === 'under_review' && currentUser?.id && myPending && (
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  disabled={approvePerspectives.isPending || transitionState.isPending}
                  onClick={() => setEsignAssignmentId(myPending.assignment.id)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve &amp; Sign
                  <span className="ml-1 text-xs opacity-80">
                    ({myPending.pending.map((p) => CCR_PERSPECTIVE_LABELS[p]).join(', ')})
                  </span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  disabled={approvePerspectives.isPending || transitionState.isPending}
                  onClick={openRejectDialog}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Left column — primary content (Basic Info + Reviewer Approvals) */}
              <div className="md:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {lang('changeControl.basicInformation')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <EditableText
                    label={lang('changeControl.titleLabel')}
                    value={ccr.title}
                    editable={isEditable}
                    saving={updateCCR.isPending}
                    onSave={(next) =>
                      updateCCR.mutate({ id: ccr.id, title: next || ccr.title })
                    }
                  />
                  <EditableText
                    label={lang('changeControl.descriptionLabel')}
                    value={ccr.description}
                    multiline
                    editable={isEditable}
                    saving={updateCCR.isPending}
                    onSave={(next) =>
                      updateCCR.mutate({ id: ccr.id, description: next || ccr.description })
                    }
                    aiAssist={
                      <AiAssistPopover
                        ccrId={ccr.id}
                        field="description"
                        currentValue={ccr.description ?? ''}
                        onInsert={(merged) =>
                          updateCCR.mutate({ id: ccr.id, description: merged })
                        }
                      />
                    }
                  />
                  {descriptionDrift.hasDrift && (
                    <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                      <div className="font-medium">Description out of sync with linked documents</div>
                      {descriptionDrift.stale.length > 0 && (
                        <div className="mt-1">
                          Mentioned but not linked:{' '}
                          <span className="font-mono">{descriptionDrift.stale.join(', ')}</span>
                        </div>
                      )}
                      {descriptionDrift.missing.length > 0 && (
                        <div className="mt-1">
                          Linked but not mentioned:{' '}
                          <span className="font-mono">{descriptionDrift.missing.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <EditableText
                    label={lang('changeControl.justificationLabel')}
                    value={ccr.justification}
                    multiline
                    editable={isEditable}
                    saving={updateCCR.isPending}
                    emptyText="No justification provided"
                    onSave={(next) =>
                      updateCCR.mutate({ id: ccr.id, justification: next.length ? next : null })
                    }
                    aiAssist={
                      <AiAssistPopover
                        ccrId={ccr.id}
                        field="justification"
                        currentValue={ccr.justification ?? ''}
                        onInsert={(merged) =>
                          updateCCR.mutate({ id: ccr.id, justification: merged })
                        }
                      />
                    }
                  />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.sourceLabel')}</label>
                    <p className="mt-1">{CCR_SOURCE_LABELS[ccr.source_type]}</p>
                  </div>
                  {ccr.source_capa && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.linkedCAPA')}</label>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto mt-1"
                        onClick={() => navigate(`/app/capa/${ccr.source_capa_id}`)}
                      >
                        {ccr.source_capa.capa_id}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Implementation Exemption summary — visible whenever a request
                  has been raised, regardless of decision, so the rationale
                  remains discoverable in the audit trail. */}
              {ccr.exemption_status && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5" />
                      Implementation Exemption
                      {exemptionRequested && (
                        <Badge variant="outline" className="ml-1 border-amber-300 bg-amber-50 text-amber-800">
                          Pending admin
                        </Badge>
                      )}
                      {exemptionApproved && (
                        <Badge variant="outline" className="ml-1 border-emerald-300 bg-emerald-50 text-emerald-800">
                          Approved
                        </Badge>
                      )}
                      {exemptionRejected && (
                        <Badge variant="outline" className="ml-1 border-red-300 bg-red-50 text-red-700">
                          Rejected
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {exemptionApproved
                        ? 'An admin granted an exemption from the linked-document approval gate. Mark Implemented is unlocked.'
                        : exemptionRejected
                        ? 'The admin rejected this exemption. Resolve the linked documents or re-request with new context.'
                        : 'Awaiting admin decision. Mark Implemented stays locked until approved or all linked documents are approved.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Documents covered ({exemptionDocList.length})
                      </p>
                      {exemptionDocList.length === 0 ? (
                        <p className="mt-1 text-muted-foreground italic">
                          No documents recorded on this request.
                        </p>
                      ) : (
                        <ul className="mt-1 space-y-1">
                          {exemptionDocList.map((d) => {
                            const { displayRef, displayTitle } = decorateLinkedDoc(d);
                            return (
                              <li
                                key={d.id}
                                className="flex items-center gap-2 rounded border bg-background px-2 py-1.5"
                              >
                                {displayRef && (
                                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-muted border shrink-0">
                                    {displayRef}
                                  </span>
                                )}
                                <span
                                  className="text-sm font-medium truncate flex-1 min-w-0"
                                  title={displayTitle}
                                >
                                  {displayTitle}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Notes</p>
                      <p className="mt-1 whitespace-pre-wrap">
                        {ccr.exemption_description?.trim() || (
                          <span className="text-muted-foreground italic">No notes provided.</span>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                      {ccr.exemption_requested_by && (
                        <span>
                          Requested by{' '}
                          <span className="font-medium text-foreground">
                            {reviewerName(ccr.exemption_requested_by) ?? 'Author'}
                          </span>
                          {ccr.exemption_requested_at && (
                            <> · {format(new Date(ccr.exemption_requested_at), 'MMM d, HH:mm')}</>
                          )}
                        </span>
                      )}
                      {ccr.exemption_reviewed_by && (
                        <span>
                          {exemptionApproved ? 'Approved by' : 'Rejected by'}{' '}
                          <span className="font-medium text-foreground">
                            {reviewerName(ccr.exemption_reviewed_by) ?? 'Admin'}
                          </span>
                          {ccr.exemption_reviewed_at && (
                            <> · {format(new Date(ccr.exemption_reviewed_at), 'MMM d, HH:mm')}</>
                          )}
                        </span>
                      )}
                    </div>
                    {ccr.exemption_review_reason && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Decision reason</p>
                        <p className="mt-1 whitespace-pre-wrap">{ccr.exemption_review_reason}</p>
                      </div>
                    )}
                    {exemptionRequested && isCurrentUserAdmin && ccr.status === 'approved' && (
                      <div className="pt-1">
                        <Button size="sm" onClick={() => setExemptionReviewOpen(true)}>
                          <ShieldAlert className="h-4 w-4 mr-2" />
                          Review Exemption
                        </Button>
                      </div>
                    )}

                    {Array.isArray(ccr.exemption_history) && ccr.exemption_history.length > 0 && (
                      <div className="pt-3 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Previous attempts ({ccr.exemption_history.length})
                        </p>
                        <ul className="space-y-2">
                          {ccr.exemption_history.map((h, idx) => {
                            const docNames = (h.document_ids ?? [])
                              .map((id) => {
                                const d = linkedDocsForGate.find((x) => x.id === id);
                                if (!d) return null;
                                const { displayRef, displayTitle } = decorateLinkedDoc(d);
                                return displayRef ? `${displayRef} — ${displayTitle}` : displayTitle;
                              })
                              .filter((n): n is string => !!n);
                            const decisionLabel = h.status === 'approved'
                              ? 'Approved'
                              : h.status === 'rejected'
                              ? 'Rejected'
                              : 'Pending';
                            const badgeCls = h.status === 'approved'
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                              : h.status === 'rejected'
                              ? 'border-red-300 bg-red-50 text-red-700'
                              : 'border-amber-300 bg-amber-50 text-amber-800';
                            return (
                              <li key={idx} className="rounded-md border bg-muted/30 p-3 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <Badge variant="outline" className={badgeCls}>
                                    {decisionLabel}
                                  </Badge>
                                  <span className="text-[11px] text-muted-foreground">
                                    {h.requested_at
                                      ? format(new Date(h.requested_at), 'MMM d, yyyy HH:mm')
                                      : '—'}
                                  </span>
                                </div>
                                {docNames.length > 0 && (
                                  <div>
                                    <p className="text-[11px] font-medium text-muted-foreground">
                                      Documents covered
                                    </p>
                                    <p className="mt-0.5 text-xs">{docNames.join(' · ')}</p>
                                  </div>
                                )}
                                {h.description && h.description.trim().length > 0 && (
                                  <div>
                                    <p className="text-[11px] font-medium text-muted-foreground">Notes</p>
                                    <p className="mt-0.5 whitespace-pre-wrap text-xs">
                                      {h.description}
                                    </p>
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground">
                                  {h.requested_by && (
                                    <span>
                                      Requested by{' '}
                                      <span className="font-medium text-foreground">
                                        {reviewerName(h.requested_by) ?? 'Author'}
                                      </span>
                                    </span>
                                  )}
                                  {h.reviewed_by && (
                                    <span>
                                      {h.status === 'approved' ? 'Approved by' : 'Rejected by'}{' '}
                                      <span className="font-medium text-foreground">
                                        {reviewerName(h.reviewed_by) ?? 'Admin'}
                                      </span>
                                      {h.reviewed_at && (
                                        <> · {format(new Date(h.reviewed_at), 'MMM d, HH:mm')}</>
                                      )}
                                    </span>
                                  )}
                                </div>
                                {h.review_reason && h.review_reason.trim().length > 0 && (
                                  <div>
                                    <p className="text-[11px] font-medium text-muted-foreground">
                                      Decision reason
                                    </p>
                                    <p className="mt-0.5 whitespace-pre-wrap text-xs">
                                      {h.review_reason}
                                    </p>
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Reviewer Approvals — narrowed to fit alongside the right column */}
              {(ccr.status === 'under_review' || ccr.status === 'approved' || ccr.status === 'implemented' || ccr.status === 'verified' || ccr.status === 'closed') && (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />
                        Reviewer Approvals
                      </CardTitle>
                      {ccr.status === 'under_review' && assignments.length > 0 && (() => {
                        const throttled = Date.now() - lastResendAt < resendThrottleMs;
                        const isResending = resendingForId !== null;
                        const disabled = throttled || isResending;
                        return (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={disabled}
                                title={
                                  throttled
                                    ? 'Please wait a minute before resending again.'
                                    : 'Resend the review request to assigned reviewers (email + bell + Mission Control).'
                                }
                              >
                                <Mail className="h-3.5 w-3.5 mr-1.5" />
                                {isResending ? 'Sending…' : 'Resend review request'}
                                <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-60" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64">
                              <DropdownMenuLabel>Resend to</DropdownMenuLabel>
                              <DropdownMenuItem onSelect={() => handleResendReviewRequest()}>
                                All assigned reviewers ({assignments.length})
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {assignments.map((a) => (
                                <DropdownMenuItem
                                  key={a.id}
                                  onSelect={() => handleResendReviewRequest(a.user_id)}
                                >
                                  {reviewerName(a.user_id) ?? 'Reviewer'}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        );
                      })()}
                    </div>
                    <CardDescription>
                      Each assigned reviewer e-signs the perspectives they own (21 CFR Part 11).
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {assignments.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No reviewers assigned.</p>
                    ) : (
                      <div className="space-y-2">
                        {assignments.map((a) => {
                          const fullySigned = a.perspectives.every((p) => a.approved_perspectives.includes(p));
                          return (
                            <div
                              key={a.id}
                              className={`rounded-lg border p-3 ${fullySigned ? 'border-green-300 bg-green-50' : 'bg-muted/30'}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-medium text-sm">{reviewerName(a.user_id) ?? 'Reviewer'}</p>
                                {fullySigned ? (
                                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                                ) : (
                                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                                )}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {a.perspectives.map((p) => {
                                  const ok = a.approved_perspectives.includes(p);
                                  return (
                                    <Badge
                                      key={p}
                                      variant={ok ? 'default' : 'secondary'}
                                      className={ok ? 'bg-emerald-600' : ''}
                                    >
                                      {ok ? '✓ ' : ''}{CCR_PERSPECTIVE_LABELS[p]}
                                    </Badge>
                                  );
                                })}
                              </div>
                              {a.approved_at && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Signed {format(new Date(a.approved_at), 'MMM d, HH:mm')}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              </div>
              {/* Right column — secondary content (Ownership & Dates + State Transition History) */}
              <div className="md:col-span-1 space-y-6">
              {/* Ownership & Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {lang('changeControl.ownershipAndDates')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="group">
                    <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.ownerField')}</label>
                    {isEditable ? (
                      <Select
                        value={ccr.owner_id ?? '__unassigned__'}
                        onValueChange={(v) =>
                          updateCCR.mutate({
                            id: ccr.id,
                            owner_id: v === '__unassigned__' ? null : v,
                          })
                        }
                        disabled={updateCCR.isPending}
                      >
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue placeholder={lang('changeControl.notAssigned')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__unassigned__">
                            {lang('changeControl.notAssigned')}
                          </SelectItem>
                          {companyUsers.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : ccr.owner_id ? (
                      <p className="mt-1">
                        {ccr.owner?.full_name ||
                          reviewerName(ccr.owner_id) ||
                          lang('changeControl.notAssigned')}
                      </p>
                    ) : ccr.creator?.full_name ? (
                      <p className="mt-1">
                        {ccr.creator.full_name}{' '}
                        <span className="text-xs text-muted-foreground">(creator)</span>
                      </p>
                    ) : (
                      <p className="mt-1 text-muted-foreground">
                        {lang('changeControl.notAssigned')}
                      </p>
                    )}
                  </div>
                  {ccr.product && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.productField')}</label>
                      <p className="mt-1">{ccr.product.name}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.createdField')}</label>
                    <p className="mt-1">{format(new Date(ccr.created_at), 'MMM d, yyyy HH:mm')}</p>
                  </div>
                  {(isEditable || ccr.target_implementation_date) && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.targetImplementation')}</label>
                      {isEditable ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'mt-1 w-full justify-start text-left font-normal h-9',
                                !ccr.target_implementation_date && 'text-muted-foreground'
                              )}
                              disabled={updateCCR.isPending}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {ccr.target_implementation_date
                                ? format(new Date(ccr.target_implementation_date), 'MMM d, yyyy')
                                : 'Select a date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={
                                ccr.target_implementation_date
                                  ? new Date(ccr.target_implementation_date)
                                  : undefined
                              }
                              onSelect={(date) =>
                                updateCCR.mutate({
                                  id: ccr.id,
                                  target_implementation_date: date
                                    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                                    : null,
                                })
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <p className="mt-1">
                          {format(new Date(ccr.target_implementation_date!), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  )}
                  {ccr.implemented_date && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.implemented')}</label>
                      <p className="mt-1">{format(new Date(ccr.implemented_date), 'MMM d, yyyy')}</p>
                    </div>
                  )}
                  {ccr.verified_date && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.verified')}</label>
                      <p className="mt-1">{format(new Date(ccr.verified_date), 'MMM d, yyyy')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* State Transition History — compact timeline beneath Ownership & Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {lang('changeControl.stateTransitionHistory')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <StateTransitionTimeline
                    ccr={ccr}
                    transitions={transitions}
                    loading={transitionsLoading}
                    unknownLabel={lang('changeControl.unknown')}
                  />
                </CardContent>
              </Card>
              </div>
            </div>

          </TabsContent>

          <TabsContent value="impact" className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                disabled={isLockedFromEdit}
                onClick={() => setImpactEditOpen(true)}
                title={isLockedFromEdit ? 'Impact assessment is locked once the CCR is approved.' : ''}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Impact
              </Button>
            </div>
            {ccr.target_object_id && ccr.product_id ? (
              <CCRImpactAnalysis
                targetObjectId={ccr.target_object_id}
                targetObjectType={ccr.target_object_type || ''}
                productId={ccr.product_id}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>{lang('changeControl.impactAssessmentTab')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.riskImpact')}</label>
                      <p className="mt-1">
                        <Badge variant={ccr.risk_impact === 'high' ? 'destructive' : 'secondary'}>
                          {RISK_IMPACT_LABELS[ccr.risk_impact]}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.regulatoryImpact')}</label>
                      <p className="mt-1">{ccr.regulatory_impact ? lang('changeControl.yes') : lang('changeControl.no')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.costImpact')}</label>
                      <p className="mt-1">
                        {ccr.cost_impact !== null && ccr.cost_impact !== undefined
                          ? `$${ccr.cost_impact.toLocaleString()}`
                          : <span className="text-muted-foreground italic">Not specified</span>}
                      </p>
                    </div>
                  </div>
                  {ccr.regulatory_impact_description && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.regulatoryImpactDescription')}</label>
                      <p className="mt-1 whitespace-pre-wrap">{ccr.regulatory_impact_description}</p>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground italic">
                    {lang('changeControl.automatedImpactNote')}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <CCRLinkedDocuments ccr={ccr} onVisibleCountChange={setVisibleDocCount} />
          </TabsContent>

          <TabsContent value="implementation" className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                disabled={isLockedFromEdit}
                onClick={() => setImplementationEditOpen(true)}
                title={isLockedFromEdit ? 'Implementation details are locked once the CCR is approved.' : ''}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Implementation
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>{lang('changeControl.implementationDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ccr.implementation_plan ? (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.implementationPlan')}</label>
                    <p className="mt-1 whitespace-pre-wrap">{ccr.implementation_plan}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">{lang('changeControl.noImplementationPlan')}</p>
                )}
                {ccr.implementation_notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.implementationNotes')}</label>
                    <p className="mt-1 whitespace-pre-wrap">{ccr.implementation_notes}</p>
                  </div>
                )}
                {ccr.verification_plan && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.verificationPlan')}</label>
                    <p className="mt-1 whitespace-pre-wrap">{ccr.verification_plan}</p>
                  </div>
                )}
                {ccr.verification_evidence && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.verificationEvidence')}</label>
                    <p className="mt-1 whitespace-pre-wrap">{ccr.verification_evidence}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
              {/* Audit log — 70% */}
              <Card className="lg:col-span-7">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Audit log
                  </CardTitle>
                  <CardDescription>
                    Every create, update, and delete on this CCR — captured automatically at the database level.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CCRAuditLog ccrId={ccr.id} />
                </CardContent>
              </Card>

              {/* Right column — Reviewers card + State Transition History */}
              <div className="lg:col-span-3 space-y-4">
                {/* Assigned reviewers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Reviewers
                    </CardTitle>
                    <CardDescription>
                      Assigned approvers for this CCR.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {assignments.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No reviewers assigned.</p>
                    ) : (
                      assignments.map((a) => {
                        const fully = a.perspectives.every((p) => a.approved_perspectives.includes(p));
                        return (
                          <div
                            key={a.id}
                            className={`rounded-md border px-3 py-2 ${fully ? 'bg-emerald-50 border-emerald-200' : 'bg-muted/30'}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium truncate">{reviewerName(a.user_id) ?? 'Reviewer'}</p>
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  fully
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}
                              >
                                {fully ? <><Check className="h-3 w-3" />Signed</> : <><Clock className="h-3 w-3" />Pending</>}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {a.perspectives.map((p) => (
                                <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-background border">
                                  {a.approved_perspectives.includes(p) ? '✓ ' : ''}{CCR_PERSPECTIVE_LABELS[p]}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>

                {/* State transition history — activity-timeline style */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      {lang('changeControl.stateTransitionHistory')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StateTransitionTimeline
                      ccr={ccr}
                      transitions={transitions}
                      loading={transitionsLoading}
                      unknownLabel={lang('changeControl.unknown')}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <DeleteConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Change Control Request"
        description="This Draft CCR will be permanently removed. Per ISO 13485 §4.2.5, only unapproved drafts may be deleted; submitted/approved CCRs must be cancelled instead. The reason below is captured for the audit trail."
        itemName={ccr.ccr_id}
        isLoading={deleteCCR.isPending}
        onConfirm={async (reason) => {
          await deleteCCR.mutateAsync(ccr.id);
          setDeleteOpen(false);
          navigate(`/app/company/${encodeURIComponent(ccr.company?.name || '')}/change-control`);
        }}
      />

      <CCRTransitionDialog
        open={transitionDialog.open}
        onOpenChange={(open) => setTransitionDialog((prev) => ({ ...prev, open }))}
        title={transitionDialog.title}
        description={transitionDialog.description}
        confirmLabel={transitionDialog.confirmLabel}
        destructive={transitionDialog.destructive}
        onConfirm={handleTransitionConfirm}
      />

      <CCRImpactEditDialog
        open={impactEditOpen}
        onOpenChange={setImpactEditOpen}
        ccr={ccr}
      />

      <CCRImplementationEditDialog
        open={implementationEditOpen}
        onOpenChange={setImplementationEditOpen}
        ccr={ccr}
      />

      {esignAssignmentId && currentUser?.id && (() => {
        const a = assignments.find((x) => x.id === esignAssignmentId);
        const persps = (a?.perspectives ?? [])
          .filter((p) => !(a?.approved_perspectives ?? []).includes(p))
          .map((p) => CCR_PERSPECTIVE_LABELS[p])
          .join(', ');
        return (
          <ESignPopup
            open={!!esignAssignmentId}
            onOpenChange={(o) => { if (!o) setEsignAssignmentId(null); }}
            documentId={ccr.id}
            documentName={`${ccr.ccr_id} — Approve: ${persps || 'Reviewer'}`}
            onComplete={handleSignMyPerspectives}
            selfSigner={{
              userId: currentUser.id,
              displayName:
                companyUsers.find((u) => u.id === currentUser.id)?.name ??
                currentUser.email ??
                'Reviewer',
              meaning: 'approver',
            }}
          />
        );
      })()}

      <CCRSubmitForReviewDialog
        open={submitForReviewOpen}
        onOpenChange={setSubmitForReviewOpen}
        companyId={ccr.company_id}
        initial={assignments.map((a) => ({ user_id: a.user_id, perspectives: a.perspectives }))}
        suggestedPerspectives={suggestCCRPerspectives({
          change_type: ccr.change_type,
          regulatory_impact: ccr.regulatory_impact,
        })}
        onConfirm={handleSubmitForReview}
      />

      <CCRExemptionRequestDialog
        open={exemptionRequestOpen}
        onOpenChange={setExemptionRequestOpen}
        unapprovedDocs={unapprovedLinkedDocs}
        totalDocCount={linkedDocsForGate.length || linkedDocIds.length}
        onConfirm={handleRequestExemption}
      />

      <CCRExemptionReviewDialog
        open={exemptionReviewOpen}
        onOpenChange={setExemptionReviewOpen}
        notes={ccr.exemption_description}
        exemptedDocs={exemptionDocList}
        requestedByName={reviewerName(ccr.exemption_requested_by)}
        requestedAtISO={ccr.exemption_requested_at}
        pendingDocCount={unapprovedLinkedDocs.length}
        totalDocCount={linkedDocsForGate.length || linkedDocIds.length}
        onConfirm={handleReviewExemption}
      />
    </div>
  );
}
