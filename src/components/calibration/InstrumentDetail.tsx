import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { type CalibrationRecord, type InstrumentWithLatestRecord } from '@/hooks/useCalibrationSchedule';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instrument: InstrumentWithLatestRecord | null;
  records: CalibrationRecord[];
}

export function InstrumentDetail({ open, onOpenChange, instrument, records }: Props) {
  const { lang } = useTranslation();

  const resultBadge = (result: string) => {
    switch (result) {
      case 'pass': return <Badge className="bg-green-600 text-white">{lang('calibrationSchedule.resultPass')}</Badge>;
      case 'fail': return <Badge variant="destructive">{lang('calibrationSchedule.resultFail')}</Badge>;
      case 'limited_use': return <Badge className="bg-amber-500 text-white">{lang('calibrationSchedule.resultLimitedUse')}</Badge>;
      default: return <Badge variant="secondary">{result}</Badge>;
    }
  };

  if (!instrument) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{instrument.instrument_name}</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">{lang('calibrationSchedule.idCode')}:</span> {instrument.instrument_id_code}</div>
            <div><span className="text-muted-foreground">{lang('calibrationSchedule.category')}:</span> {instrument.category}</div>
            <div><span className="text-muted-foreground">{lang('calibrationSchedule.location')}:</span> {instrument.location}</div>
            <div><span className="text-muted-foreground">{lang('calibrationSchedule.interval')}:</span> {instrument.calibration_interval_months} {lang('calibrationSchedule.months')}</div>
            {instrument.manufacturer && <div><span className="text-muted-foreground">{lang('calibrationSchedule.manufacturer')}:</span> {instrument.manufacturer}</div>}
            {instrument.model && <div><span className="text-muted-foreground">{lang('calibrationSchedule.model')}:</span> {instrument.model}</div>}
            {instrument.serial_number && <div><span className="text-muted-foreground">{lang('calibrationSchedule.serial')}:</span> {instrument.serial_number}</div>}
            <div><span className="text-muted-foreground">{lang('calibrationSchedule.status')}:</span> {instrument.status.replace(/_/g, ' ')}</div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">{lang('calibrationSchedule.calibrationHistory')} ({records.length})</h4>
            {records.length === 0 ? (
              <p className="text-sm text-muted-foreground">{lang('calibrationSchedule.noRecords')}</p>
            ) : (
              <div className="space-y-3">
                {records.map(rec => (
                  <div key={rec.id} className="border rounded-lg p-3 text-sm space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{format(new Date(rec.calibration_date), 'MMM d, yyyy')}</span>
                      {resultBadge(rec.result)}
                    </div>
                    <div className="text-muted-foreground">{lang('calibrationSchedule.by')}: {rec.performed_by}</div>
                    <div className="text-muted-foreground">{lang('calibrationSchedule.nextDueLabel')}: {format(new Date(rec.next_due_date), 'MMM d, yyyy')}</div>
                    {rec.certificate_number && <div className="text-muted-foreground">{lang('calibrationSchedule.cert')}: {rec.certificate_number}</div>}
                    {rec.notes && <div className="text-muted-foreground italic">{rec.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
