import React from 'react';
import { NCRecord, NC_SOURCE_LABELS, NC_SEVERITY_LABELS } from '@/types/nonconformity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUpdateNC } from '@/hooks/useNonconformityData';
import { useTranslation } from '@/hooks/useTranslation';

interface NCDetailsTabProps {
  nc: NCRecord;
}

export function NCDetailsTab({ nc }: NCDetailsTabProps) {
  const { lang } = useTranslation();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>{lang('nonconformity.ncDetails')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{lang('nonconformity.ncId')}</p>
              <p className="font-mono">{nc.nc_id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{lang('nonconformity.source')}</p>
              <p>{NC_SOURCE_LABELS[nc.source_type]}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{lang('nonconformity.severity')}</p>
              <p>{nc.severity ? <Badge variant={nc.severity === 'critical' ? 'destructive' : 'secondary'}>{NC_SEVERITY_LABELS[nc.severity]}</Badge> : '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{lang('nonconformity.batchLotLabel')}</p>
              <p>{nc.batch_lot_number || '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{lang('nonconformity.isVsShouldBe')}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-destructive mb-2">{lang('nonconformity.whatActuallyHappened')}</p>
            <p className="text-sm whitespace-pre-wrap">{nc.description_is || '—'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-primary mb-2">{lang('nonconformity.expectedSpecification')}</p>
            <p className="text-sm whitespace-pre-wrap">{nc.description_should_be || '—'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
