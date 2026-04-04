import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateProductionOrder } from '@/hooks/useProduction';
import { useBomRevisions } from '@/hooks/useBom';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';

interface ProductionOrderCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  productId?: string;
  userId: string;
}

export function ProductionOrderCreateDialog({ open, onOpenChange, companyId, productId, userId }: ProductionOrderCreateDialogProps) {
  const createMutation = useCreateProductionOrder();
  const { lang } = useTranslation();
  const { data: bomRevisions = [] } = useBomRevisions(productId);
  const activeRevisions = bomRevisions.filter(r => r.status === 'active');

  const [form, setForm] = useState({
    batch_number: '',
    lot_number: '',
    quantity_planned: '',
    planned_start_date: '',
    planned_end_date: '',
    notes: '',
    bom_revision_id: '',
  });

  const handleSubmit = async () => {
    await createMutation.mutateAsync({
      company_id: companyId,
      product_id: productId || null,
      batch_number: form.batch_number || null,
      lot_number: form.lot_number || null,
      quantity_planned: form.quantity_planned ? Number(form.quantity_planned) : null,
      planned_start_date: form.planned_start_date || null,
      planned_end_date: form.planned_end_date || null,
      notes: form.notes || null,
      created_by: userId,
      bom_revision_id: form.bom_revision_id || null,
    });
    onOpenChange(false);
    setForm({ batch_number: '', lot_number: '', quantity_planned: '', planned_start_date: '', planned_end_date: '', notes: '', bom_revision_id: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{lang('deviceOperations.production.createDialog.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* BOM Revision Selector */}
          <div>
            <Label>{lang('deviceOperations.production.createDialog.bomRevision')}</Label>
            {activeRevisions.length > 0 ? (
              <Select value={form.bom_revision_id} onValueChange={(v) => setForm(p => ({ ...p, bom_revision_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={lang('deviceOperations.production.createDialog.bomRevisionPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {activeRevisions.map(rev => (
                    <SelectItem key={rev.id} value={rev.id}>
                      Rev {rev.revision} — {rev.currency} {rev.total_cost.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">{lang('deviceOperations.production.createDialog.noBomRevision')}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{lang('deviceOperations.production.createDialog.batchNumber')}</Label>
              <Input value={form.batch_number} onChange={(e) => setForm(p => ({ ...p, batch_number: e.target.value }))} placeholder={lang('deviceOperations.production.createDialog.batchNumberPlaceholder')} />
            </div>
            <div>
              <Label>{lang('deviceOperations.production.createDialog.lotNumber')}</Label>
              <Input value={form.lot_number} onChange={(e) => setForm(p => ({ ...p, lot_number: e.target.value }))} placeholder={lang('deviceOperations.production.createDialog.lotNumberPlaceholder')} />
            </div>
          </div>
          <div>
            <Label>{lang('deviceOperations.production.createDialog.quantityPlanned')}</Label>
            <Input type="number" value={form.quantity_planned} onChange={(e) => setForm(p => ({ ...p, quantity_planned: e.target.value }))} placeholder="0" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{lang('deviceOperations.production.createDialog.plannedStart')}</Label>
              <Input type="date" value={form.planned_start_date} onChange={(e) => setForm(p => ({ ...p, planned_start_date: e.target.value }))} />
            </div>
            <div>
              <Label>{lang('deviceOperations.production.createDialog.plannedEnd')}</Label>
              <Input type="date" value={form.planned_end_date} onChange={(e) => setForm(p => ({ ...p, planned_end_date: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>{lang('deviceOperations.production.createDialog.notes')}</Label>
            <Textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} placeholder={lang('deviceOperations.production.createDialog.notesPlaceholder')} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{lang('deviceOperations.production.createDialog.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? lang('deviceOperations.production.createDialog.creating') : lang('deviceOperations.production.createDialog.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
