import React from 'react';
import { ProductionOrder, PRODUCTION_STATUS_LABELS, BATCH_DISPOSITION_LABELS } from '@/types/production';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';

interface ProductionOrderListProps {
  orders: ProductionOrder[];
  isLoading: boolean;
  onOrderClick?: (order: ProductionOrder) => void;
}

export function ProductionOrderList({ orders, isLoading, onOrderClick }: ProductionOrderListProps) {
  const { lang } = useTranslation();

  if (isLoading) {
    return <div className="flex justify-center py-8"><LoadingSpinner size="lg" /></div>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {lang('deviceOperations.production.emptyState')}
      </div>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'ready': return 'outline';
      case 'in_progress': return 'default';
      case 'pending_review': return 'outline';
      case 'released': return 'default';
      case 'rejected': return 'destructive';
      case 'on_hold': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getDispositionVariant = (disposition: string) => {
    switch (disposition) {
      case 'released': return 'default';
      case 'rejected': return 'destructive';
      case 'quarantined': return 'outline';
      case 'on_hold': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{lang('deviceOperations.production.tableHeaders.orderId')}</TableHead>
          <TableHead>{lang('deviceOperations.production.tableHeaders.batchLot')}</TableHead>
          <TableHead>{lang('deviceOperations.production.tableHeaders.status')}</TableHead>
          <TableHead>{lang('deviceOperations.production.tableHeaders.disposition')}</TableHead>
          <TableHead>{lang('deviceOperations.production.tableHeaders.qtyPlanned')}</TableHead>
          <TableHead>{lang('deviceOperations.production.tableHeaders.qtyProduced')}</TableHead>
          <TableHead>{lang('deviceOperations.production.tableHeaders.dhr')}</TableHead>
          <TableHead>{lang('deviceOperations.production.tableHeaders.age')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow
            key={order.id}
            className={onOrderClick ? 'cursor-pointer hover:bg-muted/50' : ''}
            onClick={() => onOrderClick?.(order)}
          >
            <TableCell className="font-mono text-sm">{order.order_id}</TableCell>
            <TableCell className="text-sm">
              {order.batch_number || order.lot_number || '—'}
            </TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(order.status) as any}>
                {PRODUCTION_STATUS_LABELS[order.status]}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={getDispositionVariant(order.disposition) as any}>
                {BATCH_DISPOSITION_LABELS[order.disposition]}
              </Badge>
            </TableCell>
            <TableCell className="text-sm">{order.quantity_planned ?? '—'}</TableCell>
            <TableCell className="text-sm">{order.quantity_produced}</TableCell>
            <TableCell className="text-sm">{order.dhr_generated ? '✓' : '—'}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
