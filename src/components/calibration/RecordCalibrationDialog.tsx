import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CALIBRATION_RESULTS, type InstrumentWithLatestRecord, type NewCalibrationRecord } from '@/hooks/useCalibrationSchedule';
import { format, addMonths } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instrument: InstrumentWithLatestRecord | null;
  onSubmit: (data: NewCalibrationRecord) => void;
}

export function RecordCalibrationDialog({ open, onOpenChange, instrument, onSubmit }: Props) {
  const { lang } = useTranslation();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [calibrationDate, setCalibrationDate] = React.useState(today);
  const [performedBy, setPerformedBy] = React.useState('');
  const [certificateNumber, setCertificateNumber] = React.useState('');
  const [result, setResult] = React.useState<string>('pass');
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setCalibrationDate(today);
      setPerformedBy('');
      setCertificateNumber('');
      setResult('pass');
      setNotes('');
    }
  }, [open, today]);

  const computedNextDue = React.useMemo(() => {
    if (!instrument || !calibrationDate) return '';
    const calDate = new Date(calibrationDate);
    return format(addMonths(calDate, instrument.calibration_interval_months), 'yyyy-MM-dd');
  }, [calibrationDate, instrument]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instrument) return;
    onSubmit({
      instrument_id: instrument.id,
      calibration_date: calibrationDate,
      next_due_date: computedNextDue,
      performed_by: performedBy,
      certificate_number: certificateNumber || null,
      result,
      notes: notes || null,
    });
    onOpenChange(false);
  };

  if (!instrument) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{lang('calibrationSchedule.recordCalibrationTitle')} — {instrument.instrument_id_code}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{lang('calibrationSchedule.calibrationDate')} *</Label>
            <Input type="date" required value={calibrationDate} onChange={e => setCalibrationDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{lang('calibrationSchedule.nextDueDate')}</Label>
            <Input type="date" value={computedNextDue} readOnly className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>{lang('calibrationSchedule.performedBy')} *</Label>
            <Input required value={performedBy} onChange={e => setPerformedBy(e.target.value)} placeholder={lang('calibrationSchedule.performedByPlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label>{lang('calibrationSchedule.certificateNumber')}</Label>
            <Input value={certificateNumber} onChange={e => setCertificateNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{lang('calibrationSchedule.result')} *</Label>
            <Select value={result} onValueChange={setResult}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CALIBRATION_RESULTS.map(r => (
                  <SelectItem key={r} value={r}>{r.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{lang('calibrationSchedule.notes')}</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{lang('calibrationSchedule.cancel')}</Button>
            <Button type="submit">{lang('calibrationSchedule.saveRecord')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
