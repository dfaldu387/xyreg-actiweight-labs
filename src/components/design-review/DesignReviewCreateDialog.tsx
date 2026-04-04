import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDesignReviews } from '@/hooks/useDesignReviews';
import { supabase } from '@/integrations/supabase/client';
import { DesignReviewType, REVIEW_TYPE_LABELS, TECHNICAL_FILE_SECTIONS, BASELINE_DEFINITIONS } from '@/types/designReview';
import { useCompanyActivePhases } from '@/hooks/useCompanyActivePhases';
import { useQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  productId: string;
}

export function DesignReviewCreateDialog({ open, onOpenChange, companyId, productId }: Props) {
  const { lang } = useTranslation();
  const [title, setTitle] = useState('');
  const [reviewType, setReviewType] = useState<DesignReviewType>('phase_end');
  const [phaseSelection, setPhaseSelection] = useState('');
  const [baselineSelection, setBaselineSelection] = useState('');
  const [adHocScope, setAdHocScope] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [sourceCcrId, setSourceCcrId] = useState('');
  const [tfSection, setTfSection] = useState('');

  const { activePhases, loading: phasesLoading } = useCompanyActivePhases(companyId);

  const { createReview } = useDesignReviews(companyId, productId);

  // Fetch CCRs for post-market type
  const { data: ccrs } = useQuery({
    queryKey: ['ccrs-for-dr', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('change_control_requests')
        .select('id, ccr_id, title')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: open && reviewType === 'post_market',
  });

  const selectedBaseline = BASELINE_DEFINITIONS.find(b => b.id === baselineSelection);

  const selectedTfSection = TECHNICAL_FILE_SECTIONS.find(s => s.id === tfSection);

  // Resolve phase_name from selection
  const resolvedPhaseName = (() => {
    if (reviewType === 'phase_end') return phaseSelection || null;
    if (reviewType === 'baseline') return selectedBaseline?.phase || null;
    if (reviewType === 'ad_hoc') return adHocScope || null;
    if (reviewType === 'technical_file') return tfSection || null;
    return null;
  })();
  const resolvedBaselineLabel = reviewType === 'baseline' ? (baselineSelection || null) : null;

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await createReview.mutateAsync({
      company_id: companyId,
      product_id: productId,
      title,
      review_type: reviewType,
      phase_name: resolvedPhaseName || null,
      baseline_label: resolvedBaselineLabel || null,
      description: description || null,
      due_date: dueDate || null,
      source_ccr_id: sourceCcrId || null,
      owner_id: user.id,
      created_by: user.id,
      status: 'draft',
    } as any);

    // Reset
    setTitle('');
    setReviewType('phase_end');
    setPhaseSelection('');
    setBaselineSelection('');
    setAdHocScope('');
    setTfSection('');
    setDescription('');
    setDueDate('');
    setSourceCcrId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{lang('designReview.newDesignReview')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{lang('designReview.titleLabel')}</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={lang('designReview.titlePlaceholder')} />
          </div>

          <div className="space-y-2">
            <Label>{lang('designReview.reviewTypeLabel')}</Label>
            <Select value={reviewType} onValueChange={v => setReviewType(v as DesignReviewType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(REVIEW_TYPE_LABELS) as DesignReviewType[]).map(k => (
                  <SelectItem key={k} value={k}>{REVIEW_TYPE_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reviewType === 'phase_end' && (
            <div className="space-y-2">
              <Label>{lang('designReview.phase')}</Label>
              <Select value={phaseSelection} onValueChange={setPhaseSelection}>
                <SelectTrigger><SelectValue placeholder={lang('designReview.selectPhase')} /></SelectTrigger>
                <SelectContent>
                  {phasesLoading ? (
                    <SelectItem value="_loading" disabled>{lang('designReview.loadingPhases')}</SelectItem>
                  ) : activePhases.length === 0 ? (
                    <SelectItem value="_empty" disabled>{lang('designReview.noPhasesConfigured')}</SelectItem>
                  ) : (
                    activePhases.filter(p => p.name !== 'No Phase').map(p => (
                      <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {reviewType === 'baseline' && (
            <div className="space-y-2">
              <Label>{lang('designReview.baselineGate')}</Label>
              <Select value={baselineSelection} onValueChange={setBaselineSelection}>
                <SelectTrigger><SelectValue placeholder={lang('designReview.selectBaseline')} /></SelectTrigger>
                <SelectContent>
                  {BASELINE_DEFINITIONS.map(bl => (
                    <SelectItem key={bl.id} value={bl.id}>
                      {bl.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedBaseline && (
                <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                  <p className="flex items-start gap-1.5">
                    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span><strong>{selectedBaseline.subtitle}</strong> — {selectedBaseline.focus}</span>
                  </p>
                  <p className="pl-5 text-muted-foreground/70">{selectedBaseline.prerequisite}</p>
                </div>
              )}
            </div>
          )}

          {reviewType === 'ad_hoc' && (
            <div className="space-y-2">
              <Label>{lang('designReview.reviewScope')}</Label>
              <Select value={adHocScope} onValueChange={setAdHocScope}>
                <SelectTrigger><SelectValue placeholder={lang('designReview.selectScope')} /></SelectTrigger>
                <SelectContent>
                  {/* Active phases group */}
                  {!phasesLoading && activePhases.filter(p => p.name !== 'No Phase').length > 0 && (
                    <>
                      <SelectItem value="_phases_header" disabled className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {lang('designReview.developmentPhasesHeader')}
                      </SelectItem>
                      {activePhases.filter(p => p.name !== 'No Phase').map(p => (
                        <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                      ))}
                    </>
                  )}
                  {/* Technical file sections group */}
                  <SelectItem value="_tf_header" disabled className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {lang('designReview.technicalFileSectionsHeader')}
                  </SelectItem>
                  {TECHNICAL_FILE_SECTIONS.map(tf => (
                    <SelectItem key={tf.id} value={tf.id}>
                      <span className="flex flex-col">
                        <span className="font-medium">§{tf.section} {tf.label}</span>
                        <span className="text-xs text-muted-foreground">{tf.focus} — {tf.legalReference}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {reviewType === 'technical_file' && (
            <div className="space-y-2">
              <Label>{lang('designReview.technicalFileSection')}</Label>
              <Select value={tfSection} onValueChange={setTfSection}>
                <SelectTrigger><SelectValue placeholder={lang('designReview.selectSection')} /></SelectTrigger>
                <SelectContent>
                  {TECHNICAL_FILE_SECTIONS.map(tf => (
                    <SelectItem key={tf.id} value={tf.id}>
                      <span className="flex flex-col">
                        <span className="font-medium">§{tf.section} {tf.label}</span>
                        <span className="text-xs text-muted-foreground">{tf.focus} — {tf.legalReference}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTfSection && (
                <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                  <p className="flex items-start gap-1.5">
                    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span><strong>{selectedTfSection.focus}</strong></span>
                  </p>
                  <p className="pl-5 text-muted-foreground/70">{lang('designReview.legalRef')} {selectedTfSection.legalReference}</p>
                </div>
              )}
            </div>
          )}

          {reviewType === 'post_market' && (
            <div className="space-y-2">
              <Label>{lang('designReview.sourceCCRLabel')}</Label>
              <Select value={sourceCcrId} onValueChange={setSourceCcrId}>
                <SelectTrigger><SelectValue placeholder={lang('designReview.selectCCR')} /></SelectTrigger>
                <SelectContent>
                  {ccrs?.map(ccr => (
                    <SelectItem key={ccr.id} value={ccr.id}>
                      {ccr.ccr_id} — {ccr.title?.substring(0, 50)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>{lang('designReview.descriptionLabel')}</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={lang('designReview.descriptionPlaceholder')} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>{lang('designReview.dueDateLabel')}</Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{lang('designReview.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={!title || createReview.isPending}>
            {createReview.isPending ? lang('designReview.creating') : lang('designReview.createReview')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
