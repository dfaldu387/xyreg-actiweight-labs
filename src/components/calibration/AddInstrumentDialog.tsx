import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { INSTRUMENT_CATEGORIES, INSTRUMENT_STATUSES, type NewInstrument } from '@/hooks/useCalibrationSchedule';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NewInstrument) => void;
}

export function AddInstrumentDialog({ open, onOpenChange, onSubmit }: Props) {
  const { lang } = useTranslation();
  const [form, setForm] = React.useState<NewInstrument>({
    instrument_name: '',
    instrument_id_code: '',
    category: 'Other',
    manufacturer: '',
    model: '',
    serial_number: '',
    location: '',
    calibration_interval_months: 12,
    status: 'active',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      manufacturer: form.manufacturer || null,
      model: form.model || null,
      serial_number: form.serial_number || null,
      notes: form.notes || null,
    });
    onOpenChange(false);
    setForm({
      instrument_name: '', instrument_id_code: '', category: 'Other',
      manufacturer: '', model: '', serial_number: '', location: '',
      calibration_interval_months: 12, status: 'active', notes: '',
    });
  };

  const update = (field: keyof NewInstrument, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lang('calibrationSchedule.addInstrument')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{lang('calibrationSchedule.instrumentName')} *</Label>
              <Input required value={form.instrument_name} onChange={e => update('instrument_name', e.target.value)} placeholder={lang('calibrationSchedule.instrumentNamePlaceholder')} />
            </div>
            <div className="space-y-2">
              <Label>{lang('calibrationSchedule.idCode')} *</Label>
              <Input required value={form.instrument_id_code} onChange={e => update('instrument_id_code', e.target.value)} placeholder={lang('calibrationSchedule.idCodePlaceholder')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{lang('calibrationSchedule.category')}</Label>
              <Select value={form.category} onValueChange={v => update('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INSTRUMENT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{lang('calibrationSchedule.location')} *</Label>
              <Input required value={form.location} onChange={e => update('location', e.target.value)} placeholder={lang('calibrationSchedule.locationPlaceholder')} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{lang('calibrationSchedule.manufacturer')}</Label>
              <Input value={form.manufacturer || ''} onChange={e => update('manufacturer', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{lang('calibrationSchedule.model')}</Label>
              <Input value={form.model || ''} onChange={e => update('model', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{lang('calibrationSchedule.serialNumber')}</Label>
              <Input value={form.serial_number || ''} onChange={e => update('serial_number', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{lang('calibrationSchedule.calibrationInterval')}</Label>
              <Input type="number" min={1} value={form.calibration_interval_months} onChange={e => update('calibration_interval_months', parseInt(e.target.value) || 12)} />
            </div>
            <div className="space-y-2">
              <Label>{lang('calibrationSchedule.status')}</Label>
              <Select value={form.status} onValueChange={v => update('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INSTRUMENT_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{lang('calibrationSchedule.notes')}</Label>
            <Textarea value={form.notes || ''} onChange={e => update('notes', e.target.value)} rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{lang('calibrationSchedule.cancel')}</Button>
            <Button type="submit">{lang('calibrationSchedule.addInstrument')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
