import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, Clock, CheckCircle, Users, Trash2, Send, XCircle, RotateCcw, Pencil, PlayCircle, ShieldCheck, Lock, Calendar as CalendarIcon, Check, X as XIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { CCRImpactAnalysis } from '@/components/change-control/CCRImpactAnalysis';
import { useCCRById, useCCRTransitions, useDeleteCCR, useTransitionCCRState, useUpdateCCR } from '@/hooks/useChangeControlData';
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog';
import { CCRTransitionDialog } from '@/components/change-control/CCRTransitionDialog';
import { CCRImpactEditDialog } from '@/components/change-control/CCRImpactEditDialog';
import { CCRSubmitForReviewDialog, type CCRSubmitForReviewPayload } from '@/components/change-control/CCRSubmitForReviewDialog';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { supabase } from '@/integrations/supabase/client';
import { 
  CCR_STATUS_LABELS, 
  CCR_STATUS_COLORS, 
  CHANGE_TYPE_LABELS, 
  CCR_SOURCE_LABELS,
  RISK_IMPACT_LABELS,
  CCRStatus,
  ChangeType
} from '@/types/changeControl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';
import { AiAssistPopover } from '@/components/change-control/AiAssistPopover';
import { CCRAuditLog } from '@/components/change-control/CCRAuditLog';
import { CCRLinkedDocuments } from '@/components/change-control/CCRLinkedDocuments';
import { useCCRLinkedDocsDedupedCount } from '@/hooks/useCCRLinkedDocsDedupedCount';
import { AppNotificationService } from '@/services/appNotificationService';
import { ESignPopup } from '@/components/esign/ESignPopup';

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

export default function ChangeControlDetailPage() {
  const { ccrId } = useParams<{ ccrId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { lang } = useTranslation();
  const { data: ccr, isLoading: ccrLoading } = useCCRById(ccrId);
  const { data: transitions = [], isLoading: transitionsLoading } = useCCRTransitions(ccrId);
  const deleteCCR = useDeleteCCR();
  const transitionState = useTransitionCCRState();
  const updateCCR = useUpdateCCR();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [impactEditOpen, setImpactEditOpen] = useState(false);
  const [submitForReviewOpen, setSubmitForReviewOpen] = useState(false);
  const [esignGate, setEsignGate] = useState<null | 'technical' | 'quality' | 'regulatory'>(null);
  const [visibleDocCount, setVisibleDocCount] = useState<number | null>(null);
  const dedupedDocsCount = useCCRLinkedDocsDedupedCount(
    ccr?.id ?? '',
    Array.isArray(ccr?.affected_documents) ? ccr.affected_documents : []
  );
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

  const activeTab = searchParams.get('tab') ?? 'details';
  const setActiveTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };

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

  const allThreeApproved =
    ccr.technical_approved && ccr.quality_approved && ccr.regulatory_approved;
  const isLockedFromEdit = ccr.status !== 'draft' && ccr.status !== 'under_review';
  const isTerminal = ccr.status === 'rejected' || ccr.status === 'closed';

  const openTransition = (config: {
    target: CCRStatus;
    title: string;
    description: string;
    confirmLabel: string;
    destructive?: boolean;
  }) => {
    setTransitionDialog({ open: true, ...config });
  };

  const handleTransitionConfirm = async (reason: string) => {
    if (!transitionDialog.target) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await transitionState.mutateAsync({
      ccrId: ccr.id,
      fromStatus: ccr.status,
      toStatus: transitionDialog.target,
      userId: user.id,
      reason,
    });
  };

  const handleApprovalToggle = async (
    field: 'technical' | 'quality' | 'regulatory'
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const currentlyApproved = ccr[`${field}_approved` as const];
    if (currentlyApproved) {
      // Un-approval (reversal) — no e-signature required, just clear the gate.
      await updateCCR.mutateAsync({
        id: ccr.id,
        [`${field}_approved`]: false,
        [`${field}_approved_by`]: null,
        [`${field}_approved_at`]: null,
      } as any);
      return;
    }
    // Granting approval → require 21 CFR Part 11 e-signature via the existing module.
    setEsignGate(field);
  };

  const handleGateSigned = async () => {
    if (!esignGate) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const nowIso = new Date().toISOString();
    await updateCCR.mutateAsync({
      id: ccr.id,
      [`${esignGate}_approved`]: true,
      [`${esignGate}_approved_by`]: user.id,
      [`${esignGate}_approved_at`]: nowIso,
    } as any);
    setEsignGate(null);
  };

  const handleSubmitForReview = async (payload: CCRSubmitForReviewPayload) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // 1. Persist reviewer assignments on the CCR
    await updateCCR.mutateAsync({
      id: ccr.id,
      technical_reviewer_id: payload.technical_reviewer_id,
      quality_reviewer_id: payload.quality_reviewer_id,
      regulatory_reviewer_id: payload.regulatory_reviewer_id,
    } as any);
    // 2. Build a richer audit-trail reason that names the assigned reviewers
    const namedReason = (() => {
      const t = companyUsers.find((u) => u.id === payload.technical_reviewer_id)?.name ?? payload.technical_reviewer_id;
      const q = companyUsers.find((u) => u.id === payload.quality_reviewer_id)?.name ?? payload.quality_reviewer_id;
      const r = companyUsers.find((u) => u.id === payload.regulatory_reviewer_id)?.name ?? payload.regulatory_reviewer_id;
      return `${payload.reason}\n\nAssigned reviewers — Technical: ${t}; Quality: ${q}; Regulatory: ${r}.`;
    })();
    // 3. Transition status
    await transitionState.mutateAsync({
      ccrId: ccr.id,
      fromStatus: ccr.status,
      toStatus: 'under_review',
      userId: user.id,
      reason: namedReason,
    });
    // 4. Notify the three assigned reviewers (in-app; surfaces in Mission Control)
    try {
      const actorName =
        companyUsers.find((u) => u.id === user.id)?.name ?? 'A teammate';
      const actionUrl = `/app/change-control/${ccr.id}`;
      const reviewers: Array<{ id: string; gate: string }> = [
        { id: payload.technical_reviewer_id, gate: 'Technical' },
        { id: payload.quality_reviewer_id, gate: 'Quality' },
        { id: payload.regulatory_reviewer_id, gate: 'Regulatory' },
      ];
      // Group by user so a reviewer assigned to multiple gates gets one notice
      const byUser = new Map<string, string[]>();
      reviewers.forEach((r) => {
        if (!r.id) return;
        const arr = byUser.get(r.id) ?? [];
        arr.push(r.gate);
        byUser.set(r.id, arr);
      });
      const notifications = Array.from(byUser.entries()).map(([userId, gates]) => ({
        user_id: userId,
        actor_id: user.id,
        actor_name: actorName,
        company_id: ccr.company_id,
        product_id: ccr.product_id ?? undefined,
        category: 'review' as const,
        action: 'ccr_review_assigned' as const,
        title: `Review requested: ${ccr.ccr_id}`,
        message: `${actorName} assigned you as ${gates.join(' & ')} reviewer on "${ccr.title}". Approve & e-sign in the CCR detail page.`,
        priority: 'high' as const,
        entity_type: 'change_control_request',
        entity_id: ccr.id,
        entity_name: ccr.ccr_id,
        action_url: actionUrl,
        metadata: { gates, reason: payload.reason },
      }));
      if (notifications.length > 0) {
        await new AppNotificationService().createBulkNotifications(notifications);
      }
    } catch (e) {
      console.error('Failed to notify CCR reviewers', e);
    }
  };

  const renderWorkflowActions = () => {
    if (isTerminal) return null;
    const actions: React.ReactNode[] = [];

    if (ccr.status === 'draft') {
      actions.push(
        <Button
          key="submit"
          size="sm"
          onClick={() => setSubmitForReviewOpen(true)}
        >
          <Send className="h-4 w-4 mr-2" />
          Submit for Review
        </Button>
      );
    }

    if (ccr.status === 'under_review') {
      actions.push(
        <Button
          key="approve"
          size="sm"
          disabled={!allThreeApproved}
          title={allThreeApproved ? '' : 'All three approvals (Technical, Quality, Regulatory) are required before the CCR can be approved.'}
          onClick={() =>
            openTransition({
              target: 'approved',
              title: 'Approve CCR',
              description:
                'This locks the CCR for implementation. All three approval gates have been signed.',
              confirmLabel: 'Approve CCR',
            })
          }
        >
          <ShieldCheck className="h-4 w-4 mr-2" />
          Approve CCR
        </Button>,
        <Button
          key="reject"
          variant="outline"
          size="sm"
          className="text-destructive"
          onClick={() =>
            openTransition({
              target: 'rejected',
              title: 'Reject CCR',
              description: 'Rejecting closes the CCR with a documented rationale. This cannot be undone.',
              confirmLabel: 'Reject',
              destructive: true,
            })
          }
        >
          <XCircle className="h-4 w-4 mr-2" />
          Reject
        </Button>,
        <Button
          key="return"
          variant="outline"
          size="sm"
          onClick={() =>
            openTransition({
              target: 'draft',
              title: 'Return to Draft',
              description: 'Send the CCR back to the author for further edits before review.',
              confirmLabel: 'Return to Draft',
            })
          }
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Return to Draft
        </Button>
      );
    }

    if (ccr.status === 'approved') {
      actions.push(
        <Button
          key="implement"
          size="sm"
          onClick={() =>
            openTransition({
              target: 'implemented',
              title: 'Mark as Implemented',
              description: 'Confirm that the change has been executed per the implementation plan.',
              confirmLabel: 'Mark Implemented',
            })
          }
        >
          <PlayCircle className="h-4 w-4 mr-2" />
          Mark Implemented
        </Button>
      );
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
            {ccr.status === 'draft' ? (
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
          <TabsList>
            <TabsTrigger value="details">{lang('changeControl.detailsTab')}</TabsTrigger>
            <TabsTrigger value="impact">{lang('changeControl.impactAssessmentTab')}</TabsTrigger>
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
            <TabsTrigger value="implementation">{lang('changeControl.implementationTab')}</TabsTrigger>
            <TabsTrigger value="history">{lang('changeControl.historyTab')}</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Basic Information */}
              <Card className="md:col-span-2">
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
                    editable={ccr.status === 'draft'}
                    saving={updateCCR.isPending}
                    onSave={(next) =>
                      updateCCR.mutate({ id: ccr.id, title: next || ccr.title })
                    }
                  />
                  <EditableText
                    label={lang('changeControl.descriptionLabel')}
                    value={ccr.description}
                    multiline
                    editable={ccr.status === 'draft'}
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
                  <EditableText
                    label={lang('changeControl.justificationLabel')}
                    value={ccr.justification}
                    multiline
                    editable={ccr.status === 'draft'}
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

              {/* Ownership & Dates */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {lang('changeControl.ownershipAndDates')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="group">
                    <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.ownerField')}</label>
                    {ccr.status === 'draft' ? (
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
                    ) : (
                      <p className="mt-1">
                        {ccr.owner?.full_name ||
                          reviewerName(ccr.owner_id) ||
                          lang('changeControl.notAssigned')}
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
                  {(ccr.status === 'draft' || ccr.target_implementation_date) && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{lang('changeControl.targetImplementation')}</label>
                      {ccr.status === 'draft' ? (
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
            </div>

            {/* Approvals */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    {lang('changeControl.approvals')}
                  </CardTitle>
                  {ccr.status === 'under_review' && (
                    <p className="text-xs text-muted-foreground">
                      Click a tile to record / revoke your approval
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {([
                    { key: 'technical', label: lang('changeControl.technical'), approved: ccr.technical_approved, at: ccr.technical_approved_at, reviewerId: ccr.technical_reviewer_id },
                    { key: 'quality', label: lang('changeControl.quality'), approved: ccr.quality_approved, at: ccr.quality_approved_at, reviewerId: ccr.quality_reviewer_id },
                    { key: 'regulatory', label: lang('changeControl.regulatory'), approved: ccr.regulatory_approved, at: ccr.regulatory_approved_at, reviewerId: ccr.regulatory_reviewer_id },
                  ] as const).map(({ key, label, approved, at, reviewerId }) => {
                    const assigneeName = reviewerName(reviewerId);
                    const interactive = ccr.status === 'under_review';
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={!interactive || updateCCR.isPending}
                        onClick={() => handleApprovalToggle(key)}
                        className={`flex items-center gap-3 p-3 border rounded-lg text-left transition ${
                          interactive ? 'hover:bg-muted/50 cursor-pointer' : 'cursor-default'
                        } ${approved ? 'border-green-300' : ''}`}
                      >
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${approved ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{label}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {approved
                              ? `${lang('changeControl.approved')}${at ? ' • ' + format(new Date(at), 'MMM d, HH:mm') : ''}`
                              : lang('changeControl.pending')}
                          </p>
                          {assigneeName && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              Assigned: {assigneeName}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {ccr.status === 'under_review' && !allThreeApproved && (
                  <p className="text-xs text-muted-foreground mt-3">
                    All three gates must be approved before the CCR can be moved to Approved (ISO 13485 §7.3.9 / 21 CFR 820.30(i)).
                  </p>
                )}
              </CardContent>
            </Card>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {lang('changeControl.stateTransitionHistory')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transitionsLoading ? (
                  <LoadingSpinner />
                ) : (
                  <div className="space-y-4">
                    {/* Synthetic creation entry — always shown as the origin of the audit trail */}
                    <div className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Created</Badge>
                          <span>→</span>
                          <Badge variant="outline">{CCR_STATUS_LABELS[ccr.status as keyof typeof CCR_STATUS_LABELS]}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {ccr.owner?.full_name || lang('changeControl.unknown')} • {format(new Date(ccr.created_at), 'MMM d, yyyy HH:mm')}
                        </p>
                        <p className="text-sm mt-2">CCR raised.</p>
                      </div>
                    </div>
                    {transitions.map((transition) => (
                      <div key={transition.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {transition.from_status && (
                              <>
                                <Badge variant="outline">{CCR_STATUS_LABELS[transition.from_status as keyof typeof CCR_STATUS_LABELS]}</Badge>
                                <span>→</span>
                              </>
                            )}
                            <Badge variant="outline">{CCR_STATUS_LABELS[transition.to_status as keyof typeof CCR_STATUS_LABELS]}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {transition.transitioner?.full_name || lang('changeControl.unknown')} • {format(new Date(transition.created_at), 'MMM d, yyyy HH:mm')}
                          </p>
                          {transition.transition_reason && (
                            <p className="text-sm mt-2">{transition.transition_reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
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

      {esignGate && (
        <ESignPopup
          open={!!esignGate}
          onOpenChange={(o) => { if (!o) setEsignGate(null); }}
          documentId={ccr.id}
          documentName={`${ccr.ccr_id} — ${esignGate[0].toUpperCase() + esignGate.slice(1)} Approval`}
          onComplete={handleGateSigned}
        />
      )}

      <CCRSubmitForReviewDialog
        open={submitForReviewOpen}
        onOpenChange={setSubmitForReviewOpen}
        companyId={ccr.company_id}
        initial={{
          technical_reviewer_id: ccr.technical_reviewer_id,
          quality_reviewer_id: ccr.quality_reviewer_id,
          regulatory_reviewer_id: ccr.regulatory_reviewer_id,
        }}
        onConfirm={handleSubmitForReview}
      />
    </div>
  );
}
