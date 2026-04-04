import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { toast } from 'sonner';

export interface CalibrationInstrument {
  id: string;
  company_id: string;
  instrument_name: string;
  instrument_id_code: string;
  category: string;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  location: string;
  calibration_interval_months: number;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalibrationRecord {
  id: string;
  instrument_id: string;
  calibration_date: string;
  next_due_date: string;
  performed_by: string;
  certificate_number: string | null;
  result: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface InstrumentWithLatestRecord extends CalibrationInstrument {
  latest_record: CalibrationRecord | null;
  calibration_status: 'current' | 'due_soon' | 'overdue' | 'never_calibrated';
}

export const INSTRUMENT_CATEGORIES = [
  'Dimensional', 'Electrical', 'Temperature', 'Pressure',
  'Weight', 'Flow', 'Optical', 'Other',
] as const;

export const INSTRUMENT_STATUSES = ['active', 'inactive', 'out_of_service', 'retired'] as const;
export const CALIBRATION_RESULTS = ['pass', 'fail', 'limited_use'] as const;

export type NewInstrument = Omit<CalibrationInstrument, 'id' | 'company_id' | 'created_by' | 'created_at' | 'updated_at'>;
export type NewCalibrationRecord = Omit<CalibrationRecord, 'id' | 'created_by' | 'created_at'>;

export function useCalibrationSchedule() {
  const companyId = useCompanyId();
  const [instruments, setInstruments] = useState<CalibrationInstrument[]>([]);
  const [records, setRecords] = useState<CalibrationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const [instrRes, recRes] = await Promise.all([
        supabase
          .from('calibration_instruments')
          .select('*')
          .eq('company_id', companyId)
          .order('instrument_id_code'),
        supabase
          .from('calibration_records')
          .select('*')
          .in('instrument_id', 
            (await supabase
              .from('calibration_instruments')
              .select('id')
              .eq('company_id', companyId)
            ).data?.map(i => i.id) || []
          )
          .order('calibration_date', { ascending: false }),
      ]);

      if (instrRes.error) throw instrRes.error;
      if (recRes.error) throw recRes.error;

      setInstruments((instrRes.data || []) as CalibrationInstrument[]);
      setRecords((recRes.data || []) as CalibrationRecord[]);
    } catch (err: any) {
      toast.error('Failed to load calibration data');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const instrumentsWithStatus = useMemo((): InstrumentWithLatestRecord[] => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return instruments.map(inst => {
      const instRecords = records.filter(r => r.instrument_id === inst.id);
      const latest = instRecords.length > 0 ? instRecords[0] : null;

      let calibration_status: InstrumentWithLatestRecord['calibration_status'] = 'never_calibrated';
      if (latest) {
        const nextDue = new Date(latest.next_due_date);
        if (nextDue < today) {
          calibration_status = 'overdue';
        } else if (nextDue <= thirtyDaysFromNow) {
          calibration_status = 'due_soon';
        } else {
          calibration_status = 'current';
        }
      }

      return { ...inst, latest_record: latest, calibration_status };
    });
  }, [instruments, records]);

  const stats = useMemo(() => {
    const active = instrumentsWithStatus.filter(i => i.status === 'active');
    return {
      totalActive: active.length,
      dueThisMonth: active.filter(i => i.calibration_status === 'due_soon').length,
      overdue: active.filter(i => i.calibration_status === 'overdue' || i.calibration_status === 'never_calibrated').length,
    };
  }, [instrumentsWithStatus]);

  const addInstrument = useCallback(async (data: NewInstrument) => {
    if (!companyId) return;
    const { data: user } = await supabase.auth.getUser();
    const { error } = await supabase.from('calibration_instruments').insert({
      ...data,
      company_id: companyId,
      created_by: user.user?.id || null,
    });
    if (error) { toast.error('Failed to add instrument'); return; }
    toast.success('Instrument added');
    fetchData();
  }, [companyId, fetchData]);

  const updateInstrument = useCallback(async (id: string, data: Partial<NewInstrument>) => {
    const { error } = await supabase.from('calibration_instruments').update(data).eq('id', id);
    if (error) { toast.error('Failed to update instrument'); return; }
    toast.success('Instrument updated');
    fetchData();
  }, [fetchData]);

  const deleteInstrument = useCallback(async (id: string) => {
    const { error } = await supabase.from('calibration_instruments').delete().eq('id', id);
    if (error) { toast.error('Failed to delete instrument'); return; }
    toast.success('Instrument deleted');
    fetchData();
  }, [fetchData]);

  const addCalibrationRecord = useCallback(async (data: NewCalibrationRecord) => {
    const { data: user } = await supabase.auth.getUser();
    const { error } = await supabase.from('calibration_records').insert({
      ...data,
      created_by: user.user?.id || null,
    });
    if (error) { toast.error('Failed to record calibration'); return; }
    toast.success('Calibration recorded');
    fetchData();
  }, [fetchData]);

  const getRecordsForInstrument = useCallback((instrumentId: string) => {
    return records.filter(r => r.instrument_id === instrumentId);
  }, [records]);

  return {
    instruments: instrumentsWithStatus,
    records,
    stats,
    isLoading,
    addInstrument,
    updateInstrument,
    deleteInstrument,
    addCalibrationRecord,
    getRecordsForInstrument,
    refetch: fetchData,
  };
}
