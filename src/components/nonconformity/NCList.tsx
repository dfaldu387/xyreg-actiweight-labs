import React from 'react';
import { NCRecord, NC_STATUS_LABELS, NC_SEVERITY_LABELS, NC_SOURCE_LABELS } from '@/types/nonconformity';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';

interface NCListProps {
  ncs: NCRecord[];
  isLoading: boolean;
  onNCClick?: (nc: NCRecord) => void;
}

export function NCList({ ncs, isLoading, onNCClick }: NCListProps) {
  const { lang } = useTranslation();

  if (isLoading) {
    return <div className="flex justify-center py-8"><LoadingSpinner size="lg" /></div>;
  }

  if (ncs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {lang('nonconformity.noRecords')}
      </div>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'investigation': return 'default';
      case 'disposition': return 'secondary';
      case 'verification': return 'outline';
      case 'closed': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{lang('nonconformity.ncId')}</TableHead>
          <TableHead>{lang('nonconformity.titleLabel')}</TableHead>
          <TableHead>{lang('nonconformity.status')}</TableHead>
          <TableHead>{lang('nonconformity.severity')}</TableHead>
          <TableHead>{lang('nonconformity.source')}</TableHead>
          <TableHead>{lang('nonconformity.age')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ncs.map((nc) => (
          <TableRow
            key={nc.id}
            className={onNCClick ? 'cursor-pointer hover:bg-muted/50' : ''}
            onClick={() => onNCClick?.(nc)}
          >
            <TableCell className="font-mono text-sm">{nc.nc_id}</TableCell>
            <TableCell className="max-w-[300px] truncate">{nc.title}</TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(nc.status) as any}>
                {NC_STATUS_LABELS[nc.status]}
              </Badge>
            </TableCell>
            <TableCell>
              {nc.severity ? (
                <Badge variant={nc.severity === 'critical' ? 'destructive' : 'secondary'}>
                  {NC_SEVERITY_LABELS[nc.severity]}
                </Badge>
              ) : '—'}
            </TableCell>
            <TableCell className="text-sm">{NC_SOURCE_LABELS[nc.source_type]}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(nc.created_at), { addSuffix: true })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
