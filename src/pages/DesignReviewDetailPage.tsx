import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDesignReviewDetail } from '@/hooks/useDesignReviews';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, AlertTriangle, CheckCircle2, Lock, PenTool, Plus, Users, FileText, Calendar, GitBranch, RefreshCw, Target, ClipboardCheck, ClipboardList, Save, Shield, Trash2, ExternalLink } from 'lucide-react';
import { STATUS_LABELS, REVIEW_TYPE_LABELS, SIGNER_ROLE_LABELS, PARTICIPANT_ROLE_LABELS, formatBaselineLabel, TECHNICAL_FILE_SECTIONS } from '@/types/designReview';
import { canFinalize, finalizeReview, runGapsCheck } from '@/services/designReviewService';
import { getBaselinedObjectIds } from '@/services/baselineLockService';
import { checkIndependentEligibility, EligibilityResult } from '@/services/reviewerEligibilityService';
import { getBlockers, ReviewManifest } from '@/services/manifestDiscoveryService';
import DiscussionItemsFinder from '@/components/design-review/DiscussionItemsFinder';
import AddParticipantDialog from '@/components/design-review/AddParticipantDialog';
import { DesignReviewTemplateService } from '@/services/designReviewTemplateService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/hooks/useTranslation';

export default function DesignReviewDetailPage() {
  const { productId, reviewId } = useParams<{ productId: string; reviewId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { lang } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [findingDialogOpen, setFindingDialogOpen] = useState(false);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [addParticipantOpen, setAddParticipantOpen] = useState(false);
  const [gapsWarnings, setGapsWarnings] = useState<string[] | null>(null);
  const [manifestBlockers, setManifestBlockers] = useState<string[]>([]);

  // Fetch baselined OIDs for this product
  const { data: baselinedIds } = useQuery({
    queryKey: ['baselined-oids', productId],
    queryFn: () => getBaselinedObjectIds(productId!),
    enabled: !!productId,
  });

  const {
    reviewQuery,
    manifestQuery,
    findingsQuery,
    signaturesQuery,
    participantsQuery,
    addFinding,
    updateFinding,
    addSignature,
    addParticipant,
    removeParticipant,
  } = useDesignReviewDetail(reviewId);

  const review = reviewQuery.data;
  const manifest = manifestQuery.data || [];
  const findings = findingsQuery.data || [];
  const signatures = signaturesQuery.data || [];
  const participants = participantsQuery.data || [];

  const openMajorFindings = findings.filter(f => f.severity === 'major' && f.status !== 'closed');
  const isCompleted = review?.status === 'completed';

  // (changed-objects loading moved into DiscussionItemsFinder)

  // Finding form state
  const [fTitle, setFTitle] = useState('');
  const [fDescription, setFDescription] = useState('');
  const [fSeverity, setFSeverity] = useState<'minor' | 'major'>('minor');

  // Signature form state
  const [sigRole, setSigRole] = useState<string>('engineering_lead');
  const [sigMeaning, setSigMeaning] = useState<string>('approval');
  const [sigIsIndependent, setSigIsIndependent] = useState(false);
  const [sigComments, setSigComments] = useState('');
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);

  // Run eligibility check when sign dialog opens
  useEffect(() => {
    if (!signDialogOpen || !reviewId) {
      setEligibility(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setEligibilityLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const result = await checkIndependentEligibility(reviewId, user.id);
      if (!cancelled) {
        setEligibility(result);
        setEligibilityLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [signDialogOpen, reviewId]);

  const isIndependentBlocked = sigRole === 'independent_reviewer' && eligibility && !eligibility.eligible;

  const handleRunGapsCheck = async () => {
    if (!review?.product_id) return;
    const warnings = await runGapsCheck(review.product_id);
    setGapsWarnings(warnings);
    if (warnings.length === 0) toast.success(lang('designReview.gapsCheckPassed'));
  };

  const handleFinalize = async () => {
    if (!reviewId) return;
    try {
      await finalizeReview(reviewId);
      queryClient.invalidateQueries({ queryKey: ['design-review', reviewId] });
      queryClient.invalidateQueries({ queryKey: ['design-review-manifest', reviewId] });
      toast.success(lang('designReview.reviewFinalizedBaseline'));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddFinding = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await addFinding.mutateAsync({
      design_review_id: reviewId,
      title: fTitle,
      description: fDescription,
      severity: fSeverity,
      created_by: user.id,
    } as any);
    setFTitle('');
    setFDescription('');
    setFSeverity('minor');
    setFindingDialogOpen(false);
  };

  const handleCloseFinding = async (findingId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await updateFinding.mutateAsync({
      id: findingId,
      status: 'closed',
      closed_at: new Date().toISOString(),
      closed_by: user?.id,
    } as any);
  };

  const handleSign = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await addSignature.mutateAsync({
      design_review_id: reviewId,
      signer_id: user.id,
      signer_role: sigRole,
      signature_meaning: sigMeaning,
      is_independent: sigIsIndependent,
      comments: sigComments || null,
    } as any);
    setSigComments('');
    setSignDialogOpen(false);
  };

  if (!review) return <div className="p-6 text-muted-foreground">{lang('designReview.loading')}</div>;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/app/product/${productId}/design-review`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{review.title}</h1>
              <Badge variant="outline" className="font-mono">{review.dr_id}</Badge>
              <Badge className={review.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                {STATUS_LABELS[review.status]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {REVIEW_TYPE_LABELS[review.review_type]}
              {review.phase_name ? ` — ${review.phase_name}` : ''}
              {review.baseline_label ? ` — ${formatBaselineLabel(review.baseline_label)}` : ''}
            </p>
          </div>
        </div>
        {!isCompleted && (
          <Button onClick={handleFinalize} disabled={openMajorFindings.length > 0 || manifestBlockers.length > 0}>
            <Lock className="h-4 w-4 mr-2" /> {lang('designReview.finalizeAndBaseline')}
          </Button>
        )}
      </div>

      {/* Gate blocker warning */}
      {(openMajorFindings.length > 0 || manifestBlockers.length > 0) && !isCompleted && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="py-3 space-y-1">
            {openMajorFindings.length > 0 && (
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-sm text-red-800 dark:text-red-300">
                  {lang('designReview.openMajorFindingsBlocked', { count: openMajorFindings.length })}
                </span>
              </div>
            )}
            {manifestBlockers.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-sm text-red-800 dark:text-red-300">{b}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Baseline Lock Status Card */}
      {isCompleted && (review.metadata as any)?.baseline_hash && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
                  <Lock className="h-4 w-4" /> {lang('designReview.baselineLocked')}
                </p>
                <p className="text-sm text-green-700 dark:text-green-400">
                  {lang('designReview.objectsFrozenOn', { count: (review.metadata as any)?.baseline_item_count || 0, date: review.completed_at ? format(new Date(review.completed_at), 'MMM d, yyyy HH:mm') : '—' })}
                </p>
                <p className="text-xs font-mono text-green-600 dark:text-green-500 mt-1">
                  SHA-256: {((review.metadata as any)?.baseline_hash as string)?.slice(0, 16)}…
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">{lang('designReview.overviewTab')}</TabsTrigger>
          <TabsTrigger value="manifest">{lang('designReview.manifestTab')} ({manifest.length})</TabsTrigger>
          <TabsTrigger value="findings">{lang('designReview.findingsTab')} ({findings.length})</TabsTrigger>
          <TabsTrigger value="signatures">{lang('designReview.signaturesTab')} ({signatures.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Section 1: General Information */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {lang('designReview.generalInformation')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
              <div>
                <label className="font-medium">{lang('designReview.reviewType')}</label>
                <p className="text-muted-foreground">{REVIEW_TYPE_LABELS[review.review_type]}</p>
              </div>
              <div>
                <label className="font-medium">{lang('designReview.statusLabel')}</label>
                <p><Badge className={review.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>{STATUS_LABELS[review.status]}</Badge></p>
              </div>
              <div>
                <label className="font-medium">{lang('designReview.developmentPhase')}</label>
                <p className="text-muted-foreground capitalize">{review.phase_name || '—'}</p>
              </div>
              <div>
                <label className="font-medium">{lang('designReview.baselineLabel')}</label>
                <p className="text-muted-foreground">{formatBaselineLabel(review.baseline_label)}</p>
              </div>
              <div>
                <label className="font-medium">{lang('designReview.dueDate')}</label>
                <p className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {review.due_date ? format(new Date(review.due_date), 'MMM d, yyyy') : '—'}
                </p>
              </div>
              <div>
                <label className="font-medium">{lang('designReview.sourceCCR')}</label>
                <p className="text-muted-foreground flex items-center gap-1">
                  <GitBranch className="h-3 w-3" />
                  {review.source_ccr_id || '—'}
                </p>
              </div>
              <div>
                <label className="font-medium">{lang('designReview.created')}</label>
                <p className="text-muted-foreground">{format(new Date(review.created_at), 'MMM d, yyyy')}</p>
              </div>
              {review.completed_at && (
                <div>
                  <label className="font-medium">{lang('designReview.completedLabel')}</label>
                  <p className="text-muted-foreground">{format(new Date(review.completed_at), 'MMM d, yyyy')}</p>
                </div>
              )}
            </div>
            {review.description && (
              <p className="mt-3 text-sm text-muted-foreground">{review.description}</p>
            )}
          </div>

          <Separator />

          {/* Section 2: Attendees & Roles */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                {lang('designReview.attendeesAndRoles')}
              </h3>
              {!isCompleted && (
                <Button size="sm" variant="outline" onClick={() => setAddParticipantOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> {lang('designReview.addParticipant')}
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {participants.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center bg-muted/30 rounded-lg">{lang('designReview.noParticipantsYet')}</p>
              ) : (
                participants.map(p => {
                  const profile = (p as any).user_profiles;
                  const displayName = profile
                    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email
                    : p.user_id.slice(0, 8) + '…';
                  return (
                    <div key={p.id} className="flex justify-between items-center p-3 bg-muted/30 rounded">
                      <span className="text-sm font-medium">{displayName}</span>
                      <span className="text-sm">
                        <Badge variant="outline">{PARTICIPANT_ROLE_LABELS[p.role]}</Badge>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {p.attended ? (
                            <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-600" /> {lang('designReview.attended')}</span>
                          ) : (
                            lang('designReview.signatureDate')
                          )}
                        </span>
                        {!isCompleted && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => removeParticipant.mutate(p.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {review.company_id && reviewId && (
              <AddParticipantDialog
                reviewId={reviewId}
                companyId={review.company_id}
                isOpen={addParticipantOpen}
                onClose={() => setAddParticipantOpen(false)}
                existingParticipantIds={participants.map(p => p.user_id)}
                onAdd={async (userId, role) => {
                  await addParticipant.mutateAsync({
                    design_review_id: reviewId,
                    user_id: userId,
                    role,
                  } as any);
                }}
              />
            )}
          </div>

          <Separator />

          {/* Section 3: Items to Discuss — Finder */}
          {review.product_id && reviewId && (
            <DiscussionItemsFinder
              productId={review.product_id}
              reviewId={reviewId}
              reviewMetadata={(review.metadata || {}) as Record<string, any>}
              isCompleted={isCompleted}
              phaseName={review.phase_name}
              baselineLabel={review.baseline_label}
              onManifestReady={(m: ReviewManifest) => setManifestBlockers(getBlockers(m))}
            />
          )}

          <Separator />

          {/* Section 4: Gate Criteria Checklist */}
          <div id="gate-criteria">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              4. {review.review_type === 'technical_file' && review.phase_name
                ? (() => {
                    const tf = TECHNICAL_FILE_SECTIONS.find(s => s.id === review.phase_name);
                    return tf ? `§${tf.section} ${tf.label} — ${tf.legalReference}` : review.phase_name;
                  })()
                : review.review_type === 'baseline' && review.baseline_label
                  ? `${formatBaselineLabel(review.baseline_label)} — ${lang('designReview.gateCriteriaChecklist')}`
                  : review.phase_name
                    ? `${review.phase_name} — ${lang('designReview.gateCriteriaChecklist')}`
                    : lang('designReview.generalGateCriteriaChecklist')}
            </h3>
            {/* Live artifact summary */}
            {(() => {
              const meta = (review.metadata || {}) as Record<string, any>;
              const discussionItems = (meta.discussion_items as any[]) || [];
              const artifactCount = discussionItems.length;
              const openFindings = findings.filter(f => f.status !== 'closed').length;
              const pendingDocs = manifest.filter(m => m.object_type === 'document' && m.status !== 'baselined').length;
              return (
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 p-2 bg-muted/30 rounded">
                  <span>{lang('designReview.artifactsInScope', { count: artifactCount })}</span>
                  <span className="text-border">|</span>
                  <span>{lang('designReview.findingsOpen', { count: openFindings })}</span>
                  <span className="text-border">|</span>
                  <span>{lang('designReview.documentsPending', { count: pendingDocs })}</span>
                </div>
              );
            })()}
            <div className="space-y-4">
              {DesignReviewTemplateService.getPhaseSpecificContent(
                review.review_type === 'baseline' && review.baseline_label
                  ? review.baseline_label.toLowerCase()
                  : (review.phase_name || 'general')
              ).map((section) => {
                const metadata = (review.metadata || {}) as Record<string, any>;
                const checklistResponses = metadata.checklist_responses || {};
                const formResponses = metadata.form_responses || {};

                return (
                  <div key={section.id} className="border rounded-lg p-4 bg-background">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4" />
                      {section.title}
                      {section.required && <Badge variant="outline" className="text-xs">{lang('designReview.required')}</Badge>}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">{section.content}</p>

                    {section.section_type === 'checklist' && section.phase_specific_data?.items && (
                      <div className="space-y-2">
                        {section.phase_specific_data.items.map((item: string, itemIndex: number) => {
                          const checked = checklistResponses[section.id]?.[itemIndex] || false;
                          return (
                            <div key={itemIndex} className="flex items-start gap-2 p-2 bg-muted/20 rounded">
                              <Checkbox
                                checked={checked}
                                disabled={isCompleted}
                                onCheckedChange={async (val) => {
                                  const newMeta = { ...metadata };
                                  if (!newMeta.checklist_responses) newMeta.checklist_responses = {};
                                  if (!newMeta.checklist_responses[section.id]) newMeta.checklist_responses[section.id] = {};
                                  newMeta.checklist_responses[section.id][itemIndex] = !!val;
                                  await supabase.from('design_reviews' as any).update({ metadata: newMeta } as any).eq('id', reviewId);
                                  queryClient.invalidateQueries({ queryKey: ['design-review', reviewId] });
                                }}
                                className="mt-0.5"
                              />
                              <span className="text-sm">{item}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Comment field for checklist sections (e.g. BL assessment confirmations) */}
                    {section.section_type === 'checklist' && section.phase_specific_data?.comment_field && (
                      <div className="mt-3 space-y-1">
                        <label className="text-sm font-medium">{section.phase_specific_data.comment_field.label}:</label>
                        <textarea
                          className="w-full p-2 border rounded bg-muted/10 text-sm min-h-[60px] resize-y"
                          placeholder="e.g. Looks good, Update section 2.3 wording…"
                          disabled={isCompleted}
                          defaultValue={formResponses[section.id]?.[section.phase_specific_data.comment_field.label] || ''}
                          onBlur={async (e) => {
                            const newMeta = { ...metadata };
                            if (!newMeta.form_responses) newMeta.form_responses = {};
                            if (!newMeta.form_responses[section.id]) newMeta.form_responses[section.id] = {};
                            newMeta.form_responses[section.id][section.phase_specific_data!.comment_field.label] = e.target.value;
                            await supabase.from('design_reviews' as any).update({ metadata: newMeta } as any).eq('id', reviewId);
                            queryClient.invalidateQueries({ queryKey: ['design-review', reviewId] });
                          }}
                        />
                      </div>
                    )}

                    {section.section_type === 'form' && section.phase_specific_data?.fields && (
                      <div className="space-y-3">
                        {section.phase_specific_data.fields.map((field: any, fieldIndex: number) => (
                          <div key={fieldIndex} className="space-y-1">
                            <label className="text-sm font-medium">{field.label}:</label>
                            <textarea
                              className="w-full p-2 border rounded bg-muted/10 text-sm min-h-[60px] resize-y"
                              placeholder={lang('designReview.toBeCompleted')}
                              disabled={isCompleted}
                              defaultValue={formResponses[section.id]?.[field.label] || ''}
                              onBlur={async (e) => {
                                const newMeta = { ...metadata };
                                if (!newMeta.form_responses) newMeta.form_responses = {};
                                if (!newMeta.form_responses[section.id]) newMeta.form_responses[section.id] = {};
                                newMeta.form_responses[section.id][field.label] = e.target.value;
                                await supabase.from('design_reviews' as any).update({ metadata: newMeta } as any).eq('id', reviewId);
                                queryClient.invalidateQueries({ queryKey: ['design-review', reviewId] });
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Device Definition Review Items */}
            {(() => {
              const meta = (review.metadata || {}) as Record<string, any>;
              const allItems: Array<{ object_type: string; object_id: string; display_id: string; title: string }> = meta.discussion_items || [];
              const deviceDefItems = allItems.filter(i => i.object_type === 'device_definition');
              if (deviceDefItems.length === 0) return null;

              const checklistResponses = meta.checklist_responses || {};

              return (
                <div className="border rounded-lg p-4 bg-background mt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4" />
                    {lang('designReview.deviceDefinitionReview')}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {lang('designReview.deviceDefInstructions')}
                  </p>
                  <div className="space-y-2">
                    {deviceDefItems.map(item => {
                      const key = `device_def_${item.object_id}`;
                      const checked = checklistResponses[key] || false;
                      return (
                        <div key={item.object_id} className="flex items-center gap-3 p-3 bg-muted/20 rounded">
                          <Checkbox
                            checked={checked}
                            disabled={isCompleted}
                            onCheckedChange={async (val) => {
                              const newMeta = { ...meta };
                              if (!newMeta.checklist_responses) newMeta.checklist_responses = {};
                              newMeta.checklist_responses[key] = !!val;
                              await supabase.from('design_reviews' as any).update({ metadata: newMeta } as any).eq('id', reviewId);
                              queryClient.invalidateQueries({ queryKey: ['design-review', reviewId] });
                            }}
                          />
                          <span className="text-sm font-medium flex-1">{item.display_id}</span>
                          <span className="text-xs text-muted-foreground flex-1">{item.title}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-primary"
                            onClick={() => navigate(`/app/product/${productId}/device-information?tab=${item.object_id}&returnTo=design-review&drId=${reviewId}`)}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {lang('designReview.open')}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

              {/* Scoped Artifacts for Discussion */}
              {(() => {
                const meta = (review.metadata || {}) as Record<string, any>;
                const discussionItems: Array<{ id: string; object_id: string; object_type: string; display_id: string; displayId: string; title: string; type?: string }> = meta.discussion_items || [];
                const discussionReviewed: Record<string, boolean> = meta.discussion_reviewed || {};
                const discussionComments: Record<string, string> = meta.discussion_comments || {};

                if (discussionItems.length === 0) return (
                  <p className="text-sm text-muted-foreground mt-4 p-3 bg-muted/20 rounded-lg">
                    {lang('designReview.noArtifactsSelected')}
                  </p>
                );

                const TYPE_LABELS: Record<string, string> = {
                  hazard: 'Hazards',
                  user_need: 'User Needs',
                  system_requirement: 'System Requirements',
                  software_requirement: 'Software Requirements',
                  hardware_requirement: 'Hardware Requirements',
                  test_case: 'Test Cases',
                  document: 'Documents',
                  gap_analysis_item: 'Gap Analysis',
                  activity: 'Activities',
                  product_audit: 'Audits',
                  capa: 'CAPA',
                };
                // Group items by object_type
                const groupedItems: Record<string, typeof discussionItems> = {};
                for (const item of discussionItems) {
                  const key = item.object_type || item.type || 'other';
                  if (!groupedItems[key]) groupedItems[key] = [];
                  groupedItems[key].push(item);
                }

                return (
                  <div className="border rounded-lg p-4 bg-background mt-4">
                    <h4 className="font-medium mb-3">{lang('designReview.scopedArtifacts')}</h4>
                    <div className="space-y-4">
                      {Object.entries(groupedItems).map(([type, items]) => (
                        <div key={type}>
                          <h5 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                            {TYPE_LABELS[type] || type.replace(/_/g, ' ')} ({items.length})
                          </h5>
                          <div className="space-y-2">
                      {items.map(item => {
                        const verdict = (meta.discussion_verdicts as Record<string, string> || {})[item.object_id] || '';
                        const verdictColors: Record<string, string> = {
                          approved: 'bg-green-100 border-green-300 text-green-800',
                          conditions: 'bg-amber-50 border-amber-300 text-amber-800',
                          not_approved: 'bg-red-50 border-red-300 text-red-800',
                        };
                        return (
                        <div key={item.object_id} className={`flex items-start gap-3 p-3 rounded border ${verdict ? verdictColors[verdict] || 'bg-muted/20 border-transparent' : 'bg-muted/20 border-transparent'}`}>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-muted-foreground">{item.display_id || item.displayId}</span>
                                <span className="text-sm">{item.title}</span>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {baselinedIds?.has(item.object_id) ? (
                                  <Badge variant="outline" className="text-blue-600 border-blue-300 text-[10px] px-1.5 py-0"><Lock className="h-3 w-3 mr-0.5" />{lang('designReview.baselined')}</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground border-muted text-[10px] px-1.5 py-0">{lang('designReview.draft')}</Badge>
                                )}
                              <Select
                                value={verdict}
                                disabled={isCompleted}
                                onValueChange={async (val) => {
                                  const newMeta = { ...meta };
                                  if (!newMeta.discussion_verdicts) newMeta.discussion_verdicts = {};
                                  (newMeta.discussion_verdicts as Record<string, string>)[item.object_id] = val;
                                  await supabase.from('design_reviews' as any).update({ metadata: newMeta } as any).eq('id', reviewId);
                                  queryClient.invalidateQueries({ queryKey: ['design-review', reviewId] });
                                }}
                              >
                                <SelectTrigger className="w-[200px] h-8 text-xs">
                                  <SelectValue placeholder={lang('designReview.selectVerdict')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="approved">✅ {lang('designReview.verdictApproved')}</SelectItem>
                                  <SelectItem value="conditions">⚠️ {lang('designReview.verdictConditions')}</SelectItem>
                                  <SelectItem value="not_approved">❌ {lang('designReview.verdictNotApproved')}</SelectItem>
                                </SelectContent>
                              </Select>
                              </div>
                            </div>
                            <textarea
                              className="w-full p-2 border rounded bg-background/50 text-sm min-h-[40px] resize-y"
                              placeholder={lang('designReview.comments')}
                              disabled={isCompleted}
                              defaultValue={discussionComments[item.object_id] || ''}
                              onBlur={async (e) => {
                                const newMeta = { ...(review.metadata || {}) } as Record<string, any>;
                                if (!newMeta.discussion_comments) newMeta.discussion_comments = {};
                                newMeta.discussion_comments[item.object_id] = e.target.value;
                                await supabase.from('design_reviews' as any).update({ metadata: newMeta } as any).eq('id', reviewId);
                                queryClient.invalidateQueries({ queryKey: ['design-review', reviewId] });
                              }}
                            />
                          </div>
                        </div>
                        );
                      })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
          </div>

          <Separator />

          {/* Section 5: Review Decision & Action Items */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {lang('designReview.reviewDecisionAndActions')}
            </h3>
            <div className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <label className="font-medium">{lang('designReview.reviewDecision')}</label>
                <RadioGroup
                  className="mt-2 space-y-2"
                  value={((review.metadata as any)?.decision) || ''}
                  disabled={isCompleted}
                  onValueChange={async (val) => {
                    const newMeta = { ...(review.metadata || {}), decision: val };
                    await supabase.from('design_reviews' as any).update({ metadata: newMeta } as any).eq('id', reviewId);
                    queryClient.invalidateQueries({ queryKey: ['design-review', reviewId] });
                  }}
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="approved" id="decision-approved" />
                    <label htmlFor="decision-approved" className="text-sm">✅ <strong>{lang('designReview.decisionApproved')}</strong></label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="approved_with_conditions" id="decision-conditions" />
                    <label htmlFor="decision-conditions" className="text-sm">⚠️ <strong>{lang('designReview.decisionConditions')}</strong></label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="not_approved" id="decision-rejected" />
                    <label htmlFor="decision-rejected" className="text-sm">❌ <strong>{lang('designReview.decisionNotApproved')}</strong></label>
                  </div>
                </RadioGroup>
              </div>

              <div className="border rounded-lg p-4">
                <label className="font-medium">{lang('designReview.actionItemsFindings')}</label>
                <div className="mt-2">
                  <div className="grid grid-cols-4 gap-2 p-2 bg-muted/20 rounded font-medium text-sm">
                    <div>{lang('designReview.finding')}</div>
                    <div>{lang('designReview.severity')}</div>
                    <div>{lang('designReview.status')}</div>
                    <div>{lang('designReview.dueDateColumn')}</div>
                  </div>
                  {findings.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center border-t mt-2">
                      {lang('designReview.noFindingsRecordedYet')}
                    </div>
                  ) : (
                    findings.map(f => (
                      <div key={f.id} className="grid grid-cols-4 gap-2 p-2 text-sm border-t">
                        <div>{f.title}</div>
                        <div>
                          <Badge className={f.severity === 'major' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                            {f.severity}
                          </Badge>
                        </div>
                        <div><Badge variant={f.status === 'closed' ? 'default' : 'secondary'}>{f.status}</Badge></div>
                        <div className="text-muted-foreground">{f.due_date ? format(new Date(f.due_date), 'MMM d, yyyy') : '—'}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Artifact Review Summary */}
          {(() => {
            const discussionItems = ((review.metadata as any)?.discussion_items || []) as any[];
            const verdicts = ((review.metadata as any)?.discussion_verdicts || {}) as Record<string, string>;
            const comments = ((review.metadata as any)?.discussion_comments || {}) as Record<string, string>;
            if (discussionItems.length === 0) return null;

            const TYPE_LABELS: Record<string, string> = {
              hazard: 'Hazards', user_need: 'User Needs', system_requirement: 'System Requirements',
              software_requirement: 'Software Requirements', hardware_requirement: 'Hardware Requirements',
              test_case: 'Test Cases', document: 'Documents', gap_analysis_item: 'Gap Analysis',
              activity: 'Activities', product_audit: 'Audits', capa: 'CAPA',
            };

            const approved = discussionItems.filter(i => verdicts[i.object_id] === 'approved').length;
            const conditions = discussionItems.filter(i => verdicts[i.object_id] === 'conditions').length;
            const notApproved = discussionItems.filter(i => verdicts[i.object_id] === 'not_approved').length;
            const pending = discussionItems.length - approved - conditions - notApproved;
            const total = discussionItems.length;

            // Group by type for mini bars
            const grouped: Record<string, any[]> = {};
            for (const item of discussionItems) {
              const key = item.object_type || item.type || 'other';
              if (!grouped[key]) grouped[key] = [];
              grouped[key].push(item);
            }

            const flaggedItems = discussionItems.filter(i => verdicts[i.object_id] === 'conditions' || verdicts[i.object_id] === 'not_approved');

            return (
              <div className="border rounded-lg p-4 bg-background">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  {lang('designReview.artifactReviewSummary')}
                </h3>

                {/* Overall counts */}
                <div className="flex flex-wrap gap-3 mb-4 text-sm">
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-100 text-green-800">✅ {lang('designReview.approvedCount', { count: approved })}</span>
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-100 text-amber-800">⚠️ {lang('designReview.conditionsCount', { count: conditions })}</span>
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-100 text-red-800">❌ {lang('designReview.notApprovedCount', { count: notApproved })}</span>
                  {pending > 0 && <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted text-muted-foreground">⏳ {lang('designReview.pendingCount', { count: pending })}</span>}
                </div>

                {/* Progress bar */}
                <div className="flex w-full h-3 rounded-full overflow-hidden mb-4">
                  {approved > 0 && <div className="bg-green-500" style={{ width: `${(approved / total) * 100}%` }} />}
                  {conditions > 0 && <div className="bg-amber-400" style={{ width: `${(conditions / total) * 100}%` }} />}
                  {notApproved > 0 && <div className="bg-red-500" style={{ width: `${(notApproved / total) * 100}%` }} />}
                  {pending > 0 && <div className="bg-muted" style={{ width: `${(pending / total) * 100}%` }} />}
                </div>

                {/* Per-type mini bars */}
                <div className="space-y-2 mb-4">
                  {Object.entries(grouped).map(([type, items]) => {
                    const a = items.filter(i => verdicts[i.object_id] === 'approved').length;
                    const c = items.filter(i => verdicts[i.object_id] === 'conditions').length;
                    const n = items.filter(i => verdicts[i.object_id] === 'not_approved').length;
                    const p = items.length - a - c - n;
                    return (
                      <div key={type} className="flex items-center gap-3 text-sm">
                        <span className="w-48 text-muted-foreground truncate">{TYPE_LABELS[type] || type.replace(/_/g, ' ')} ({items.length})</span>
                        <div className="flex flex-1 h-2 rounded-full overflow-hidden">
                          {a > 0 && <div className="bg-green-500" style={{ width: `${(a / items.length) * 100}%` }} />}
                          {c > 0 && <div className="bg-amber-400" style={{ width: `${(c / items.length) * 100}%` }} />}
                          {n > 0 && <div className="bg-red-500" style={{ width: `${(n / items.length) * 100}%` }} />}
                          {p > 0 && <div className="bg-muted" style={{ width: `${(p / items.length) * 100}%` }} />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Flagged items table */}
                {flaggedItems.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-[100px_1fr_150px_1fr] gap-2 p-2 bg-muted/30 font-medium text-xs uppercase tracking-wide">
                      <div>{lang('designReview.id')}</div><div>{lang('designReview.title')}</div><div>{lang('designReview.verdict')}</div><div>{lang('designReview.comment')}</div>
                    </div>
                    {flaggedItems.map(item => (
                      <div key={item.object_id} className="grid grid-cols-[100px_1fr_150px_1fr] gap-2 p-2 text-sm border-t">
                        <div className="font-mono text-xs">{item.display_id || item.displayId}</div>
                        <div className="truncate">{item.title}</div>
                        <div>{verdicts[item.object_id] === 'conditions' ? `⚠️ ${lang('designReview.verdictConditions')}` : `❌ ${lang('designReview.verdictNotApproved')}`}</div>
                        <div className="text-muted-foreground truncate">{comments[item.object_id] || '—'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          <Separator />

          {/* Section 6: Approvals */}
          <div>
            <h3 className="font-semibold text-lg mb-3">{lang('designReview.approvals')}</h3>
            <div className="grid grid-cols-2 gap-4">
              {['Review Chair', 'Quality Assurance'].map(role => {
                const matchingSig = signatures.find(s =>
                  (role === 'Review Chair' && s.signer_role === 'engineering_lead') ||
                  (role === 'Quality Assurance' && s.signer_role === 'quality_manager')
                );
                return (
                  <div key={role} className="space-y-2">
                    <label className="font-medium">{role === 'Review Chair' ? lang('designReview.reviewChair') : lang('designReview.qualityAssurance')}</label>
                    <div className="p-3 border rounded bg-muted/20">
                      {matchingSig ? (
                        <>
                          <div className="text-sm flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            {lang('designReview.signed')} — {matchingSig.signature_meaning}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {lang('designReview.date')}: {format(new Date(matchingSig.signed_at), 'MMM d, yyyy HH:mm')}
                          </div>
                          {matchingSig.comments && (
                            <div className="text-xs text-muted-foreground mt-1">{matchingSig.comments}</div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="text-sm text-muted-foreground">{lang('designReview.signature')}</div>
                          <div className="text-sm text-muted-foreground">{lang('designReview.dateSignature')}</div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Manifest Tab */}
        <TabsContent value="manifest" className="space-y-4">
          {/* Gaps Check */}
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleRunGapsCheck}>{lang('designReview.runGapsCheck')}</Button>
            {gapsWarnings !== null && (
              gapsWarnings.length === 0 ? (
                <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" /> {lang('designReview.auditorReady')}</Badge>
              ) : (
                <div className="space-y-1">
                  {gapsWarnings.map((w, i) => (
                    <Badge key={i} className="bg-amber-100 text-amber-800 mr-2"><AlertTriangle className="h-3 w-3 mr-1" /> {w}</Badge>
                  ))}
                </div>
              )
            )}
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{lang('designReview.displayId')}</TableHead>
                    <TableHead>{lang('designReview.objectType')}</TableHead>
                    <TableHead>{lang('designReview.status')}</TableHead>
                    <TableHead>{lang('designReview.added')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manifest.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">{lang('designReview.noManifestItems')}</TableCell></TableRow>
                  ) : manifest.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.object_display_id || item.object_id.slice(0, 8)}</TableCell>
                      <TableCell><Badge variant="outline">{item.object_type}</Badge></TableCell>
                      <TableCell>
                        {item.status === 'baselined' ? (
                          <Badge className="bg-green-100 text-green-800"><Lock className="h-3 w-3 mr-1" /> {lang('designReview.baselined')}</Badge>
                        ) : (
                          <Badge variant="secondary">{item.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(item.created_at), 'MMM d')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Findings Tab */}
        <TabsContent value="findings" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setFindingDialogOpen(true)} disabled={isCompleted}>
              <Plus className="h-4 w-4 mr-2" /> {lang('designReview.addFinding')}
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{lang('designReview.findingId')}</TableHead>
                    <TableHead>{lang('designReview.findingTitle')}</TableHead>
                    <TableHead>{lang('designReview.findingSeverity')}</TableHead>
                    <TableHead>{lang('designReview.findingStatus')}</TableHead>
                    <TableHead>{lang('designReview.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {findings.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{lang('designReview.noFindingsRecorded')}</TableCell></TableRow>
                  ) : findings.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-sm">{f.finding_id}</TableCell>
                      <TableCell>{f.title}</TableCell>
                      <TableCell>
                        <Badge className={f.severity === 'major' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                          {f.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={f.status === 'closed' ? 'default' : 'secondary'}>{f.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {f.status !== 'closed' && !isCompleted && (
                          <Button size="sm" variant="outline" onClick={() => handleCloseFinding(f.id)}>
                            {lang('designReview.close')}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Signatures Tab */}
        <TabsContent value="signatures" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {signatures.some(s => s.is_independent) ? (
                <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" /> {lang('designReview.independentReviewerCheck')} ✓</Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-800"><AlertTriangle className="h-3 w-3 mr-1" /> {lang('designReview.independentReviewerRequired')}</Badge>
              )}
            </div>
            <Button onClick={() => setSignDialogOpen(true)} disabled={isCompleted || openMajorFindings.length > 0}>
              <PenTool className="h-4 w-4 mr-2" /> {lang('designReview.signReview')}
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{lang('designReview.role')}</TableHead>
                    <TableHead>{lang('designReview.meaning')}</TableHead>
                    <TableHead>{lang('designReview.independent')}</TableHead>
                    <TableHead>{lang('designReview.signedAt')}</TableHead>
                    <TableHead>{lang('designReview.comments')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signatures.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{lang('designReview.noSignaturesYet')}</TableCell></TableRow>
                  ) : signatures.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>{SIGNER_ROLE_LABELS[s.signer_role] || s.signer_role}</TableCell>
                      <TableCell className="capitalize">{s.signature_meaning}</TableCell>
                      <TableCell>{s.is_independent ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : '—'}</TableCell>
                      <TableCell className="text-sm">{format(new Date(s.signed_at), 'MMM d, yyyy HH:mm')}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.comments || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Finding Dialog */}
      <Dialog open={findingDialogOpen} onOpenChange={setFindingDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{lang('designReview.addFindingDialog')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{lang('designReview.findingTitleLabel')}</Label>
              <Input value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder={lang('designReview.findingTitlePlaceholder')} />
            </div>
            <div className="space-y-2">
              <Label>{lang('designReview.severityLabel')}</Label>
              <Select value={fSeverity} onValueChange={v => setFSeverity(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">{lang('designReview.severityMinor')}</SelectItem>
                  <SelectItem value="major">{lang('designReview.severityMajor')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{lang('designReview.description')}</Label>
              <Textarea value={fDescription} onChange={e => setFDescription(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFindingDialogOpen(false)}>{lang('designReview.cancel')}</Button>
            <Button onClick={handleAddFinding} disabled={!fTitle}>{lang('designReview.addFinding')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sign Dialog */}
      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{lang('designReview.signDesignReview')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{lang('designReview.signerRole')}</Label>
              <Select value={sigRole} onValueChange={setSigRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="engineering_lead">{lang('designReview.engineeringLead')}</SelectItem>
                  <SelectItem value="quality_manager">{lang('designReview.qualityManager')}</SelectItem>
                  <SelectItem value="independent_reviewer">{lang('designReview.independentReviewer')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{lang('designReview.meaningOfSignature')}</Label>
              <Select value={sigMeaning} onValueChange={setSigMeaning}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="approval">{lang('designReview.approval')}</SelectItem>
                  <SelectItem value="review">{lang('designReview.review')}</SelectItem>
                  <SelectItem value="authorization">{lang('designReview.authorization')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Eligibility indicator for Independent Reviewer */}
            {sigRole === 'independent_reviewer' && (
              eligibilityLoading ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  {lang('designReview.checkingEligibility')}
                </div>
              ) : eligibility && !eligibility.eligible ? (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-destructive">{lang('designReview.regulatoryConflict')}</p>
                    <p className="text-destructive/80">
                      {lang('designReview.regulatoryConflictMessage', { count: eligibility.conflictCount })}
                    </p>
                    <p className="text-xs text-destructive/60 mt-1 font-mono">
                      {lang('designReview.conflicts')} {eligibility.conflictDetails.join(', ')}
                    </p>
                  </div>
                </div>
              ) : eligibility && eligibility.eligible ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800 dark:text-green-300">{lang('designReview.cleanHandsVerified')}</span>
                </div>
              ) : null
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={sigIsIndependent || sigRole === 'independent_reviewer'}
                onChange={e => setSigIsIndependent(e.target.checked)}
                disabled={sigRole === 'independent_reviewer'}
                className="rounded"
              />
              <Label className="text-sm">{lang('designReview.independentReviewerCheckbox')}</Label>
            </div>
            <div className="space-y-2">
              <Label>{lang('designReview.commentsOptional')}</Label>
              <Textarea value={sigComments} onChange={e => setSigComments(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignDialogOpen(false)}>{lang('designReview.cancel')}</Button>
            <Button onClick={handleSign} disabled={!!isIndependentBlocked}>
              <PenTool className="h-4 w-4 mr-2" /> {lang('designReview.sign')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
