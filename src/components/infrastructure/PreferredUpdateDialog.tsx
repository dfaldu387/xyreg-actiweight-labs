import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { CalendarClock, Clock } from 'lucide-react';
import { addDays } from 'date-fns';

interface PreferredUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  releaseVersion: string;
  onConfirm: (schedule: {
    preferredDate: string;
    preferredTimeStart: string;
    preferredTimeEnd: string;
  }) => void;
  isLoading?: boolean;
}

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  const label = i === 0 ? '12:00 AM'
    : i < 12 ? `${i}:00 AM`
    : i === 12 ? '12:00 PM'
    : `${i - 12}:00 PM`;
  return { value: `${hour}:00`, label };
});

export function PreferredUpdateDialog({
  open,
  onOpenChange,
  releaseVersion,
  onConfirm,
  isLoading,
}: PreferredUpdateDialogProps) {
  const [preferredDate, setPreferredDate] = useState<Date | undefined>();
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');

  const isValid = preferredDate && timeStart && timeEnd && timeStart < timeEnd;

  const handleConfirm = () => {
    if (!preferredDate || !timeStart || !timeEnd) return;
    onConfirm({
      preferredDate: preferredDate.toISOString().split('T')[0],
      preferredTimeStart: timeStart,
      preferredTimeEnd: timeEnd,
    });
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setPreferredDate(undefined);
      setTimeStart('');
      setTimeEnd('');
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-teal-600" />
            Schedule Update — v{releaseVersion}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Choose your preferred date and time window for the update. Our team will perform the upgrade during this window.
          </p>

          <div className="space-y-2">
            <Label>Preferred Date</Label>
            <DatePicker
              date={preferredDate}
              setDate={setPreferredDate}
              placeholder="Select update date"
              fromDate={addDays(new Date(), 1)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> From
              </Label>
              <Select value={timeStart} onValueChange={setTimeStart}>
                <SelectTrigger>
                  <SelectValue placeholder="Start time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> To
              </Label>
              <Select value={timeEnd} onValueChange={setTimeEnd}>
                <SelectTrigger>
                  <SelectValue placeholder="End time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {timeStart && timeEnd && timeStart >= timeEnd && (
            <p className="text-xs text-red-500">End time must be after start time.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid || isLoading}>
            {isLoading ? 'Requesting...' : 'Confirm & Request Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
