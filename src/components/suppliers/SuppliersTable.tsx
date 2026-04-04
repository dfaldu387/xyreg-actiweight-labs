import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDeleteSupplier } from '@/hooks/useSuppliers';
import type { Supplier } from '@/types/supplier';
import { formatScopeOfSupply } from '@/utils/scopeOfSupply';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { Package } from 'lucide-react';

interface SuppliersTableProps {
  suppliers: Supplier[];
  disabled?: boolean;
  materialCounts?: Record<string, number>;
}

export function SuppliersTable({ suppliers, disabled = false, materialCounts = {} }: SuppliersTableProps) {
  const navigate = useNavigate();
  const { companyName } = useParams<{ companyName: string }>();
  const deleteMutation = useDeleteSupplier();
  const { lang } = useTranslation();
  const confirmAction = useConfirm();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'default';
      case 'Probationary':
        return 'secondary';
      case 'Disqualified':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getCriticalityBadgeVariant = (criticality: string) => {
    return criticality === 'Critical' ? 'destructive' : 'outline';
  };

  const handleView = (supplierId: string) => {
    navigate(`/app/company/${companyName}/suppliers/${supplierId}`);
  };

  const handleEdit = (supplierId: string) => {
    if (disabled) return;
    navigate(`/app/company/${companyName}/suppliers/${supplierId}/edit`);
  };

  const handleDelete = async (supplierId: string) => {
    if (disabled) return;
    if (await confirmAction({ title: lang('suppliers.table.deleteConfirm'), description: 'This action cannot be undone.', confirmLabel: 'Delete', variant: 'destructive' })) {
      await deleteMutation.mutateAsync(supplierId);
    }
  };

  if (suppliers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{lang('suppliers.table.emptyState.title')}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {lang('suppliers.table.emptyState.description')}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{lang('suppliers.table.columns.name')}</TableHead>
            <TableHead>{lang('suppliers.table.columns.status')}</TableHead>
            <TableHead>{lang('suppliers.table.columns.type')}</TableHead>
            <TableHead>{lang('suppliers.table.columns.criticality')}</TableHead>
            <TableHead>{lang('suppliers.table.columns.scopeOfSupply')}</TableHead>
            <TableHead>{lang('suppliers.table.columns.materialsLinked')}</TableHead>
            <TableHead>{lang('suppliers.table.columns.nextAuditDate')}</TableHead>
            <TableHead>{lang('suppliers.table.columns.contact')}</TableHead>
            <TableHead className="text-right">{lang('suppliers.table.columns.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow key={supplier.id}>
              <TableCell className="font-medium">
                <button
                  onClick={() => handleView(supplier.id)}
                  className="text-left hover:underline focus:outline-none"
                >
                  {supplier.name}
                </button>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(supplier.status)}>
                  {supplier.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {supplier.supplier_type || lang('suppliers.table.defaultType')}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getCriticalityBadgeVariant(supplier.criticality)}>
                  {supplier.criticality}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {formatScopeOfSupply(supplier.scope_of_supply)}
              </TableCell>
              <TableCell>
                {materialCounts[supplier.id] ? (
                  <Badge variant="secondary" className="gap-1">
                    <Package className="h-3 w-3" />
                    {materialCounts[supplier.id]}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              <TableCell>
                {supplier.next_scheduled_audit ? (
                  <div className="text-sm">
                    <div className="font-medium">
                      {new Date(supplier.next_scheduled_audit).toLocaleDateString()}
                    </div>
                    {supplier.audit_interval && (
                      <div className="text-xs text-muted-foreground">
                        {lang('suppliers.table.auditInterval').replace('{{interval}}', supplier.audit_interval)}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">{lang('suppliers.table.notScheduled')}</span>
                )}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {supplier.contact_info?.contact_person && (
                    <div className="font-medium">{supplier.contact_info.contact_person}</div>
                  )}
                  {supplier.contact_info?.position && (
                    <div className="text-muted-foreground text-xs">
                      {supplier.contact_info.position}
                    </div>
                  )}
                  {supplier.contact_info?.email && (
                    <div>{supplier.contact_info.email}</div>
                  )}
                  {supplier.contact_info?.phone && (
                    <div className="text-muted-foreground">
                      {supplier.contact_info.phone}
                    </div>
                  )}
                  {!supplier.contact_info?.contact_person && !supplier.contact_info?.position && !supplier.contact_info?.email && !supplier.contact_info?.phone && '-'}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleView(supplier.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      {lang('suppliers.table.actions.viewDetails')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(supplier.id)} disabled={disabled}>
                      <Edit className="mr-2 h-4 w-4" />
                      {lang('suppliers.table.actions.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(supplier.id)}
                      className="text-destructive"
                      disabled={disabled}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {lang('suppliers.table.actions.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}