import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { SAMPLING_PLAN_LABELS, SamplingPlanType } from '@/types/incomingInspection';
import { useCreateInspection } from '@/hooks/useIncomingInspection';
import { Supplier } from '@/types/supplier';
import { useTranslation } from '@/hooks/useTranslation';

interface InspectionCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  productId?: string;
  userId: string;
  suppliers?: Supplier[];
}

export function InspectionCreateDialog({
  open,
  onOpenChange,
  companyId,
  productId,
  userId,
  suppliers = [],
}: InspectionCreateDialogProps) {
  const createMutation = useCreateInspection();
  const { lang } = useTranslation();

  const [form, setForm] = useState({
    supplier_id: '',
    purchase_order_number: '',
    lot_batch_number: '',
    material_description: '',
    quantity_received: '',
    sampling_plan_type: 'hundred_percent' as SamplingPlanType,
    aql_level: '',
    coc_received: false,
    coc_reference: '',
  });

  const handleSubmit = async () => {
    await createMutation.mutateAsync({
      company_id: companyId,
      product_id: productId || null,
      supplier_id: form.supplier_id || null,
      purchase_order_number: form.purchase_order_number || null,
      lot_batch_number: form.lot_batch_number || null,
      material_description: form.material_description || null,
      quantity_received: form.quantity_received ? Number(form.quantity_received) : null,
      sampling_plan_type: form.sampling_plan_type,
      aql_level: form.aql_level || null,
      coc_received: form.coc_received,
      coc_reference: form.coc_reference || null,
      inspector_id: userId,
      created_by: userId,
    });
    onOpenChange(false);
    setForm({
      supplier_id: '',
      purchase_order_number: '',
      lot_batch_number: '',
      material_description: '',
      quantity_received: '',
      sampling_plan_type: 'hundred_percent',
      aql_level: '',
      coc_received: false,
      coc_reference: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{lang('deviceOperations.inspection.createDialog.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{lang('deviceOperations.inspection.createDialog.supplier')}</Label>
            <Select value={form.supplier_id} onValueChange={(v) => setForm(prev => ({ ...prev, supplier_id: v }))}>
              <SelectTrigger><SelectValue placeholder={lang('deviceOperations.inspection.createDialog.supplierPlaceholder')} /></SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{lang('deviceOperations.inspection.createDialog.purchaseOrder')}</Label>
              <Input value={form.purchase_order_number} onChange={(e) => setForm(prev => ({ ...prev, purchase_order_number: e.target.value }))} placeholder={lang('deviceOperations.inspection.createDialog.purchaseOrderPlaceholder')} />
            </div>
            <div>
              <Label>{lang('deviceOperations.inspection.createDialog.lotBatch')}</Label>
              <Input value={form.lot_batch_number} onChange={(e) => setForm(prev => ({ ...prev, lot_batch_number: e.target.value }))} placeholder={lang('deviceOperations.inspection.createDialog.lotBatchPlaceholder')} />
            </div>
          </div>

          <div>
            <Label>{lang('deviceOperations.inspection.createDialog.materialDescription')}</Label>
            <Textarea value={form.material_description} onChange={(e) => setForm(prev => ({ ...prev, material_description: e.target.value }))} placeholder={lang('deviceOperations.inspection.createDialog.materialDescriptionPlaceholder')} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{lang('deviceOperations.inspection.createDialog.quantityReceived')}</Label>
              <Input type="number" value={form.quantity_received} onChange={(e) => setForm(prev => ({ ...prev, quantity_received: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <Label>{lang('deviceOperations.inspection.createDialog.samplingPlan')}</Label>
              <Select value={form.sampling_plan_type} onValueChange={(v) => setForm(prev => ({ ...prev, sampling_plan_type: v as SamplingPlanType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SAMPLING_PLAN_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.sampling_plan_type === 'aql' && (
            <div>
              <Label>{lang('deviceOperations.inspection.createDialog.aqlLevel')}</Label>
              <Input value={form.aql_level} onChange={(e) => setForm(prev => ({ ...prev, aql_level: e.target.value }))} placeholder={lang('deviceOperations.inspection.createDialog.aqlLevelPlaceholder')} />
            </div>
          )}

          <div className="flex items-center gap-3">
            <Switch checked={form.coc_received} onCheckedChange={(v) => setForm(prev => ({ ...prev, coc_received: v }))} />
            <Label>{lang('deviceOperations.inspection.createDialog.cocReceived')}</Label>
          </div>

          {form.coc_received && (
            <div>
              <Label>{lang('deviceOperations.inspection.createDialog.cocReference')}</Label>
              <Input value={form.coc_reference} onChange={(e) => setForm(prev => ({ ...prev, coc_reference: e.target.value }))} placeholder={lang('deviceOperations.inspection.createDialog.cocReferencePlaceholder')} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{lang('deviceOperations.inspection.createDialog.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? lang('deviceOperations.inspection.createDialog.creating') : lang('deviceOperations.inspection.createDialog.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
