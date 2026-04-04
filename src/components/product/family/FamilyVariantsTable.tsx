import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleDataTable } from '@/components/ui/data-table/SimpleDataTable';
import { Badge } from '@/components/ui/badge';
import { ProductWithBasicUDI } from '@/hooks/useProductsByBasicUDI';
import { ColumnDef } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface FamilyVariantsTableProps {
  products: ProductWithBasicUDI[];
  companyId: string;
}

export function FamilyVariantsTable({ products, companyId }: FamilyVariantsTableProps) {
  const navigate = useNavigate();

  const getVariantType = (product: ProductWithBasicUDI): string => {
    // Determine variant type based on model_id or sibling_group_id
    if (product.model_id) return 'Main';
    if (product.status?.toLowerCase().includes('development')) return 'New R&D';
    return 'Variant';
  };

  const getStatusBadge = (status: string | null) => {
    const statusLower = status?.toLowerCase() || '';
    
    if (statusLower.includes('launched') || statusLower === 'active') {
      return <Badge className="bg-green-500 hover:bg-green-600">Launched</Badge>;
    }
    if (statusLower.includes('development')) {
      return <Badge className="bg-blue-500 hover:bg-blue-600">In Dev</Badge>;
    }
    if (statusLower === 'retired' || statusLower === 'archived') {
      return <Badge variant="secondary">Retired</Badge>;
    }
    return <Badge variant="outline">{status || 'Unknown'}</Badge>;
  };

  const getHealthActions = (): string => {
    // TODO: Replace with real CAPA/overdue data
    const random = Math.random();
    if (random < 0.3) return '1 Open CAPA';
    if (random < 0.5) return '🔴 3 Overdue';
    if (random < 0.7) return '2 Pending Reviews';
    return '✓ All Clear';
  };

  const columns: ColumnDef<ProductWithBasicUDI>[] = [
    {
      accessorKey: 'name',
      header: 'Device Name/SKU',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.trade_name || row.original.name}</div>
          {row.original.udi_di && (
            <div className="text-xs text-muted-foreground">{row.original.udi_di}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'variant_type',
      header: 'Variant Type',
      cell: ({ row }) => {
        const type = getVariantType(row.original);
        const variant = type === 'Main' ? 'default' : type === 'New R&D' ? 'destructive' : 'secondary';
        return <Badge variant={variant as any}>{type}</Badge>;
      },
    },
    {
      accessorKey: 'current_lifecycle_phase',
      header: 'Current Specific Phase',
      cell: ({ row }) => row.original.current_lifecycle_phase || 'Not Set',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: 'health',
      header: 'Health/Actions',
      cell: () => {
        const health = getHealthActions();
        const isIssue = health.includes('🔴') || health.includes('CAPA') || health.includes('Overdue');
        return (
          <span className={isIssue ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
            {health}
          </span>
        );
      },
    },
    {
      accessorKey: 'updated_at',
      header: 'Last Updated',
      cell: ({ row }) => {
        if (!row.original.updated_at) return 'Unknown';
        try {
          return formatDistanceToNow(new Date(row.original.updated_at), { addSuffix: true });
        } catch {
          return 'Unknown';
        }
      },
    },
  ];

  const handleRowClick = (product: ProductWithBasicUDI) => {
    navigate(`/app/product/${product.id}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Variant List</CardTitle>
      </CardHeader>
      <CardContent>
        <SimpleDataTable
          columns={columns}
          data={products}
          enableSearch={true}
          searchPlaceholder="Search variants..."
          onRowClick={handleRowClick}
        />
      </CardContent>
    </Card>
  );
}
