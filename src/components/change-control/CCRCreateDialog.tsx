import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateCCR } from '@/hooks/useChangeControlData';
import { CCRSourceType, ChangeType } from '@/types/changeControl';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AiDraftAssistPopover } from './AiDraftAssistPopover';

const SOURCE_TYPE_OPTIONS: { value: CCRSourceType; label: string }[] = [
  { value: 'design_review', label: 'Design Review' },
  { value: 'capa', label: 'CAPA' },
  { value: 'regulatory', label: 'Regulatory' },
  { value: 'audit', label: 'Audit' },
  { value: 'other', label: 'Other' },
];

const CHANGE_TYPE_OPTIONS: { value: ChangeType; label: string }[] = [
  { value: 'design', label: 'Design' },
  { value: 'process', label: 'Process' },
  { value: 'document', label: 'Document' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'software', label: 'Software' },
  { value: 'labeling', label: 'Labeling' },
];

export interface CCRPrefill {
  targetObjectId?: string;
  targetObjectType?: string;
  title?: string;
  sourceType?: CCRSourceType;
  changeType?: ChangeType;
  /** Pre-populate the affected_documents array (bulk doc CCR creation). */
  affectedDocumentIds?: string[];
  /** Display-only names for the affected documents summary. */
  affectedDocumentNames?: string[];
}

interface CCRCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  productId?: string | null;
  prefill?: CCRPrefill;
}

export function CCRCreateDialog({ open, onOpenChange, companyId, productId, prefill }: CCRCreateDialogProps) {
  const createCCR = useCreateCCR();
  const { lang } = useTranslation();
  const preserveDialogForProfRef = useRef(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [changeType, setChangeType] = useState<ChangeType>('design');
  const [sourceType, setSourceType] = useState<CCRSourceType>('other');
  const [sourceCapaId, setSourceCapaId] = useState<string>('');
  const [sourceReference, setSourceReference] = useState('');
  const [justification, setJustification] = useState('');

  // Apply prefill when dialog opens
  useEffect(() => {
    if (open && prefill) {
      if (prefill.title) setTitle(prefill.title);
      if (prefill.sourceType) setSourceType(prefill.sourceType);
      if (prefill.changeType) setChangeType(prefill.changeType);
      if (prefill.affectedDocumentIds?.length && !prefill.title) {
        setTitle(`Bulk update: ${prefill.affectedDocumentIds.length} documents`);
      }
    }
  }, [open, prefill]);

  useEffect(() => {
    if (!open) return;

    const markProfIntent = () => {
      preserveDialogForProfRef.current = true;
    };

    window.addEventListener('prof-xyreg-launch-intent', markProfIntent);

    return () => {
      window.removeEventListener('prof-xyreg-launch-intent', markProfIntent);
      preserveDialogForProfRef.current = false;
    };
  }, [open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && preserveDialogForProfRef.current) {
      preserveDialogForProfRef.current = false;
      return;
    }

    if (!nextOpen) {
      preserveDialogForProfRef.current = false;
    }

    onOpenChange(nextOpen);
  };

  // Fetch CAPAs for the company when source type is CAPA
  const { data: capas } = useQuery({
    queryKey: ['capa-records-for-ccr', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('capa_records')
        .select('id, capa_id, problem_description, status')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: open && sourceType === 'capa',
  });

  // Fetch audits when source type is audit
  const { data: audits } = useQuery({
    queryKey: ['audits-for-ccr', companyId, productId],
    queryFn: async () => {
      let query = supabase
        .from('audits')
        .select('id, name, status')
        .order('inserted_at', { ascending: false });
      if (productId) query = query.eq('product_id', productId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: open && sourceType === 'audit',
  });

  // Fetch design reviews when source type is design_review
  const { data: designReviews } = useQuery({
    queryKey: ['design-reviews-for-ccr', companyId, productId],
    queryFn: async () => {
      let query = supabase
        .from('design_reviews')
        .select('id, dr_id, title, status')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (productId) query = query.eq('product_id', productId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: open && sourceType === 'design_review',
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setChangeType('design');
    setSourceType('other');
    setSourceCapaId('');
    setSourceReference('');
    setJustification('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      await createCCR.mutateAsync({
        company_id: companyId,
        product_id: productId || null,
        target_object_id: prefill?.targetObjectId || null,
        target_object_type: prefill?.targetObjectType || null,
        source_type: sourceType,
        change_type: changeType,
        title: title.trim(),
        description: description.trim(),
        justification: justification.trim() || null,
        source_capa_id: sourceType === 'capa' && sourceCapaId ? sourceCapaId : null,
        source_reference: sourceReference.trim() || null,
        affected_documents: prefill?.affectedDocumentIds && prefill.affectedDocumentIds.length > 0
          ? prefill.affectedDocumentIds
          : undefined,
      });
      resetForm();
      onOpenChange(false);
    } catch {
      // Error handled by hook
    }
  };

  return (
    <Dialog modal={false} open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{lang('changeControl.createDialogTitle')}</DialogTitle>
            <DialogDescription>
              {prefill?.targetObjectId
                ? lang('changeControl.createDialogDescriptionBaseline')
                : lang('changeControl.createDialogDescriptionGeneral')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {prefill?.affectedDocumentIds && prefill.affectedDocumentIds.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
                <div className="font-medium text-amber-900">
                  This CCR will affect {prefill.affectedDocumentIds.length} document{prefill.affectedDocumentIds.length === 1 ? '' : 's'}
                </div>
                {prefill.affectedDocumentNames && prefill.affectedDocumentNames.length > 0 && (
                  <ul className="mt-2 max-h-32 overflow-y-auto list-disc list-inside text-xs text-amber-800 space-y-0.5">
                    {prefill.affectedDocumentNames.slice(0, 50).map((name, i) => (
                      <li key={i} className="truncate">{name}</li>
                    ))}
                    {prefill.affectedDocumentNames.length > 50 && (
                      <li className="italic">…and {prefill.affectedDocumentNames.length - 50} more</li>
                    )}
                  </ul>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="ccr-title">{lang('changeControl.titleRequired')}</Label>
              <Input
                id="ccr-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={lang('changeControl.titlePlaceholder')}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{lang('changeControl.changeTypeRequired')}</Label>
                <Select value={changeType} onValueChange={(v) => setChangeType(v as ChangeType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANGE_TYPE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{lang('changeControl.sourceField')}</Label>
                <Select value={sourceType} onValueChange={(v) => {
                  setSourceType(v as CCRSourceType);
                  setSourceCapaId('');
                  setSourceReference('');
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {sourceType === 'capa' && (
              <div className="space-y-2">
                <Label>{lang('changeControl.sourceCAPA')}</Label>
                <Select value={sourceCapaId} onValueChange={setSourceCapaId}>
                  <SelectTrigger>
                    <SelectValue placeholder={lang('changeControl.selectCAPA')} />
                  </SelectTrigger>
                  <SelectContent>
                    {capas?.map(capa => (
                      <SelectItem key={capa.id} value={capa.id}>
                        {capa.capa_id} — {capa.problem_description?.substring(0, 60) || 'No description'}
                      </SelectItem>
                    ))
                    }
                    {(!capas || capas.length === 0) && (
                      <SelectItem value="__none" disabled>{lang('changeControl.noCAPAsFound')}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {sourceType === 'audit' && (
              <div className="space-y-2">
                <Label>{lang('changeControl.sourceAudit')}</Label>
                <Select value={sourceReference} onValueChange={setSourceReference}>
                  <SelectTrigger>
                    <SelectValue placeholder={lang('changeControl.selectAudit')} />
                  </SelectTrigger>
                  <SelectContent>
                    {audits?.map(audit => (
                      <SelectItem key={audit.id} value={audit.id}>
                        {audit.name}
                      </SelectItem>
                    ))}
                    {(!audits || audits.length === 0) && (
                      <SelectItem value="__none" disabled>{lang('changeControl.noAuditsFound')}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {sourceType === 'design_review' && (
              <div className="space-y-2">
                <Label>{lang('changeControl.sourceDesignReview')}</Label>
                <Select value={sourceReference} onValueChange={setSourceReference}>
                  <SelectTrigger>
                    <SelectValue placeholder={lang('changeControl.selectDesignReview')} />
                  </SelectTrigger>
                  <SelectContent>
                    {designReviews?.map(dr => (
                      <SelectItem key={dr.id} value={dr.id}>
                        {dr.dr_id} — {dr.title}
                      </SelectItem>
                    ))}
                    {(!designReviews || designReviews.length === 0) && (
                      <SelectItem value="__none" disabled>{lang('changeControl.noDesignReviewsFound')}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(sourceType === 'regulatory' || sourceType === 'pms_event') && (
              <div className="space-y-2">
                <Label htmlFor="ccr-source-ref">{lang('changeControl.sourceReference')}</Label>
                <Input
                  id="ccr-source-ref"
                  value={sourceReference}
                  onChange={(e) => setSourceReference(e.target.value)}
                  placeholder={sourceType === 'regulatory' ? lang('changeControl.sourceReferencePlaceholder') : lang('changeControl.referenceId')}
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="ccr-description">{lang('changeControl.descriptionRequired')}</Label>
                <AiDraftAssistPopover
                  field="description"
                  currentValue={description}
                  onInsert={setDescription}
                  companyId={companyId}
                  productId={productId}
                  title={title}
                  changeType={changeType}
                  sourceType={sourceType}
                  sourceReference={sourceReference}
                  affectedDocumentIds={prefill?.affectedDocumentIds}
                  affectedDocumentNames={prefill?.affectedDocumentNames}
                  targetObjectType={prefill?.targetObjectType}
                  targetObjectLabel={prefill?.title}
                />
              </div>
              <Textarea
                id="ccr-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={lang('changeControl.descriptionPlaceholder')}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="ccr-justification">{lang('changeControl.justificationField')}</Label>
                <AiDraftAssistPopover
                  field="justification"
                  currentValue={justification}
                  onInsert={setJustification}
                  companyId={companyId}
                  productId={productId}
                  title={title}
                  changeType={changeType}
                  sourceType={sourceType}
                  sourceReference={sourceReference}
                  affectedDocumentIds={prefill?.affectedDocumentIds}
                  affectedDocumentNames={prefill?.affectedDocumentNames}
                  targetObjectType={prefill?.targetObjectType}
                  targetObjectLabel={prefill?.title}
                />
              </div>
              <Textarea
                id="ccr-justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder={lang('changeControl.justificationPlaceholder')}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {lang('changeControl.cancel')}
            </Button>
            <Button type="submit" disabled={
              createCCR.isPending || !title.trim() || !description.trim() ||
              (sourceType === 'audit' && (!audits || audits.length === 0 || !sourceReference)) ||
              (sourceType === 'design_review' && (!designReviews || designReviews.length === 0 || !sourceReference)) ||
              (sourceType === 'capa' && !sourceCapaId)
            }>
              {createCCR.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {lang('changeControl.createCCR')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
