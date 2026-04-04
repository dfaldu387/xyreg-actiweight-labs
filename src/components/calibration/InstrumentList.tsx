import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreHorizontal, ClipboardCheck, Eye, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { type InstrumentWithLatestRecord } from '@/hooks/useCalibrationSchedule';
import { AddInstrumentDialog } from './AddInstrumentDialog';
import { RecordCalibrationDialog } from './RecordCalibrationDialog';
import { InstrumentDetail } from './InstrumentDetail';
import type { NewInstrument, NewCalibrationRecord, CalibrationRecord } from '@/hooks/useCalibrationSchedule';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  instruments: InstrumentWithLatestRecord[];
  onAddInstrument: (data: NewInstrument) => void;
  onDeleteInstrument: (id: string) => void;
  onRecordCalibration: (data: NewCalibrationRecord) => void;
  getRecordsForInstrument: (id: string) => CalibrationRecord[];
}

export function InstrumentList({ instruments, onAddInstrument, onDeleteInstrument, onRecordCalibration, getRecordsForInstrument }: Props) {
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentWithLatestRecord | null>(null);
  const { lang } = useTranslation();

  const statusBadge = (status: InstrumentWithLatestRecord['calibration_status']) => {
    switch (status) {
      case 'current': return <Badge className="bg-green-600 text-white">{lang('calibrationSchedule.statusCurrent')}</Badge>;
      case 'due_soon': return <Badge className="bg-amber-500 text-white">{lang('calibrationSchedule.statusDueSoon')}</Badge>;
      case 'overdue': return <Badge variant="destructive">{lang('calibrationSchedule.statusOverdue')}</Badge>;
      case 'never_calibrated': return <Badge variant="outline">{lang('calibrationSchedule.statusNeverCalibrated')}</Badge>;
    }
  };

  const filtered = instruments.filter(i =>
    i.status === 'active' && (
      i.instrument_name.toLowerCase().includes(search.toLowerCase()) ||
      i.instrument_id_code.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase()) ||
      i.location.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={lang('calibrationSchedule.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> {lang('calibrationSchedule.addInstrument')}
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{lang('calibrationSchedule.idCode')}</TableHead>
              <TableHead>{lang('calibrationSchedule.name')}</TableHead>
              <TableHead>{lang('calibrationSchedule.category')}</TableHead>
              <TableHead>{lang('calibrationSchedule.location')}</TableHead>
              <TableHead>{lang('calibrationSchedule.status')}</TableHead>
              <TableHead>{lang('calibrationSchedule.lastCalibrated')}</TableHead>
              <TableHead>{lang('calibrationSchedule.nextDue')}</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {instruments.length === 0 ? lang('calibrationSchedule.noInstruments') : lang('calibrationSchedule.noMatching')}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(inst => (
                <TableRow key={inst.id}>
                  <TableCell className="font-mono text-sm">{inst.instrument_id_code}</TableCell>
                  <TableCell className="font-medium">{inst.instrument_name}</TableCell>
                  <TableCell>{inst.category}</TableCell>
                  <TableCell>{inst.location}</TableCell>
                  <TableCell>{statusBadge(inst.calibration_status)}</TableCell>
                  <TableCell className="text-sm">
                    {inst.latest_record ? format(new Date(inst.latest_record.calibration_date), 'MMM d, yyyy') : '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {inst.latest_record ? format(new Date(inst.latest_record.next_due_date), 'MMM d, yyyy') : '—'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedInstrument(inst); setRecordOpen(true); }}>
                          <ClipboardCheck className="h-4 w-4 mr-2" /> {lang('calibrationSchedule.recordCalibration')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedInstrument(inst); setDetailOpen(true); }}>
                          <Eye className="h-4 w-4 mr-2" /> {lang('calibrationSchedule.viewDetails')}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => onDeleteInstrument(inst.id)}>
                          <Trash2 className="h-4 w-4 mr-2" /> {lang('calibrationSchedule.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddInstrumentDialog open={addOpen} onOpenChange={setAddOpen} onSubmit={onAddInstrument} />
      <RecordCalibrationDialog open={recordOpen} onOpenChange={setRecordOpen} instrument={selectedInstrument} onSubmit={onRecordCalibration} />
      <InstrumentDetail open={detailOpen} onOpenChange={setDetailOpen} instrument={selectedInstrument} records={selectedInstrument ? getRecordsForInstrument(selectedInstrument.id) : []} />
    </>
  );
}
