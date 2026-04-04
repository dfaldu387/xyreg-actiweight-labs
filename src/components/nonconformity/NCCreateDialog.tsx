import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateNC } from '@/hooks/useNonconformityData';
import { useAuth } from '@/context/AuthContext';
import { NC_SOURCE_LABELS, NC_SEVERITY_LABELS, NCSourceType, NCSeverity } from '@/types/nonconformity';
import { useTranslation } from '@/hooks/useTranslation';

interface NCCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  productId?: string;
}

export function NCCreateDialog({ open, onOpenChange, companyId, productId }: NCCreateDialogProps) {
  const { user } = useAuth();
  const createMutation = useCreateNC();
  const { lang } = useTranslation();

  const [title, setTitle] = useState('');
  const [descriptionIs, setDescriptionIs] = useState('');
  const [descriptionShouldBe, setDescriptionShouldBe] = useState('');
  const [sourceType, setSourceType] = useState<NCSourceType>('internal');
  const [severity, setSeverity] = useState<NCSeverity | ''>('');
  const [batchLot, setBatchLot] = useState('');

  const handleSubmit = async () => {
    if (!user?.id || !title.trim()) return;

    await createMutation.mutateAsync({
      company_id: companyId,
      product_id: productId || null,
      source_type: sourceType,
      title: title.trim(),
      description_is: descriptionIs.trim(),
      description_should_be: descriptionShouldBe.trim(),
      severity: severity || null,
      batch_lot_number: batchLot.trim() || null,
      created_by: user.id,
    });

    setTitle('');
    setDescriptionIs('');
    setDescriptionShouldBe('');
    setSourceType('internal');
    setSeverity('');
    setBatchLot('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{lang('nonconformity.createTitle')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="nc-title">{lang('nonconformity.titleRequired')}</Label>
            <Input id="nc-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={lang('nonconformity.titlePlaceholder')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{lang('nonconformity.sourceLabel')}</Label>
              <Select value={sourceType} onValueChange={(v) => setSourceType(v as NCSourceType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(NC_SOURCE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{lang('nonconformity.severityLabel')}</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as NCSeverity)}>
                <SelectTrigger><SelectValue placeholder={lang('nonconformity.selectPlaceholder')} /></SelectTrigger>
                <SelectContent>
                  {Object.entries(NC_SEVERITY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="nc-batch">{lang('nonconformity.batchLot')}</Label>
            <Input id="nc-batch" value={batchLot} onChange={(e) => setBatchLot(e.target.value)} placeholder={lang('nonconformity.batchLotPlaceholder')} />
          </div>

          <div>
            <Label htmlFor="nc-is">{lang('nonconformity.descriptionIs')}</Label>
            <Textarea id="nc-is" value={descriptionIs} onChange={(e) => setDescriptionIs(e.target.value)} rows={3} placeholder={lang('nonconformity.descriptionIsPlaceholder')} />
          </div>

          <div>
            <Label htmlFor="nc-should">{lang('nonconformity.descriptionShouldBe')}</Label>
            <Textarea id="nc-should" value={descriptionShouldBe} onChange={(e) => setDescriptionShouldBe(e.target.value)} rows={3} placeholder={lang('nonconformity.descriptionShouldBePlaceholder')} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{lang('nonconformity.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || createMutation.isPending}>
            {createMutation.isPending ? lang('nonconformity.creating') : lang('nonconformity.createNC')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
