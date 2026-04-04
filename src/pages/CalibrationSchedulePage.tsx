import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Wrench, AlertTriangle, Loader2 } from 'lucide-react';
import { useCalibrationSchedule } from '@/hooks/useCalibrationSchedule';
import { InstrumentList } from '@/components/calibration/InstrumentList';
import { useTranslation } from '@/hooks/useTranslation';

export default function CalibrationSchedulePage() {
  const { companyName } = useParams<{ companyName: string }>();
  const navigate = useNavigate();
  const decodedCompanyName = companyName ? decodeURIComponent(companyName) : "";
  const { lang } = useTranslation();

  const {
    instruments, stats, isLoading,
    addInstrument, deleteInstrument, addCalibrationRecord, getRecordsForInstrument,
  } = useCalibrationSchedule();

  const breadcrumbs = [
    { label: "Client Compass", onClick: () => navigate('/app/clients') },
    { label: decodedCompanyName, onClick: () => navigate(`/app/company/${encodeURIComponent(decodedCompanyName)}`) },
    { label: lang('calibrationSchedule.title') }
  ];

  return (
    <div className="space-y-6">
      <ConsistentPageHeader
        breadcrumbs={breadcrumbs}
        title={`${decodedCompanyName} ${lang('calibrationSchedule.title')}`}
        subtitle={lang('calibrationSchedule.subtitle')}
      />
      <div className="px-2 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                {lang('calibrationSchedule.totalInstruments')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '—' : stats.totalActive}</div>
              <p className="text-xs text-muted-foreground">{lang('calibrationSchedule.activeTracked')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {lang('calibrationSchedule.dueSoon')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '—' : stats.dueThisMonth}</div>
              <p className="text-xs text-muted-foreground">{lang('calibrationSchedule.dueWithin30')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                {lang('calibrationSchedule.overdue')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '—' : stats.overdue}</div>
              <p className="text-xs text-muted-foreground">{lang('calibrationSchedule.requireImmediate')}</p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <InstrumentList
            instruments={instruments}
            onAddInstrument={addInstrument}
            onDeleteInstrument={deleteInstrument}
            onRecordCalibration={addCalibrationRecord}
            getRecordsForInstrument={getRecordsForInstrument}
          />
        )}
      </div>
    </div>
  );
}
