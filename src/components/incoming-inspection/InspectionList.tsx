import React from 'react';
import { InspectionRecord, INSPECTION_STATUS_LABELS, INSPECTION_DISPOSITION_LABELS } from '@/types/incomingInspection';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';

interface InspectionListProps {
  inspections: InspectionRecord[];
  isLoading: boolean;
  onInspectionClick?: (inspection: InspectionRecord) => void;
}

export function InspectionList({ inspections, isLoading, onInspectionClick }: InspectionListProps) {
  const { lang } = useTranslation();

  if (isLoading) {
    return <div className="flex justify-center py-8"><LoadingSpinner size="lg" /></div>;
  }

  if (inspections.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {lang('deviceOperations.inspection.emptyState')}
      </div>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'in_progress': return 'default';
      case 'pending_review': return 'outline';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getDispositionVariant = (disposition: string) => {
    switch (disposition) {
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      case 'conditional_accept': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{lang('deviceOperations.inspection.tableHeaders.inspectionId')}</TableHead>
          <TableHead>{lang('deviceOperations.inspection.tableHeaders.material')}</TableHead>
          <TableHead>{lang('deviceOperations.inspection.tableHeaders.poNumber')}</TableHead>
          <TableHead>{lang('deviceOperations.inspection.tableHeaders.status')}</TableHead>
          <TableHead>{lang('deviceOperations.inspection.tableHeaders.disposition')}</TableHead>
          <TableHead>{lang('deviceOperations.inspection.tableHeaders.qtyReceived')}</TableHead>
          <TableHead>{lang('deviceOperations.inspection.tableHeaders.coc')}</TableHead>
          <TableHead>{lang('deviceOperations.inspection.tableHeaders.age')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inspections.map((ins) => (
          <TableRow
            key={ins.id}
            className={onInspectionClick ? 'cursor-pointer hover:bg-muted/50' : ''}
            onClick={() => onInspectionClick?.(ins)}
          >
            <TableCell className="font-mono text-sm">{ins.inspection_id}</TableCell>
            <TableCell className="max-w-[200px] truncate">{ins.material_description || '—'}</TableCell>
            <TableCell className="text-sm">{ins.purchase_order_number || '—'}</TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(ins.status) as any}>
                {INSPECTION_STATUS_LABELS[ins.status]}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={getDispositionVariant(ins.disposition) as any}>
                {INSPECTION_DISPOSITION_LABELS[ins.disposition]}
              </Badge>
            </TableCell>
            <TableCell className="text-sm">{ins.quantity_received ?? '—'}</TableCell>
            <TableCell className="text-sm">{ins.coc_received ? '✓' : '—'}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(ins.created_at), { addSuffix: true })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
