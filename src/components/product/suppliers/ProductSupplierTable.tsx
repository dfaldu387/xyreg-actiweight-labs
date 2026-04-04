import React from 'react';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Eye, Unlink } from 'lucide-react';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupplierService } from '@/services/supplierService';
import { useCompanyMaterialSuppliers } from '@/hooks/useMaterialSuppliers';
import { useCompanyId } from '@/hooks/useCompanyId';
import { toast } from 'sonner';
import type { ProductSupplier } from '@/types/supplier';

interface ProductSupplierTableProps {
  productSuppliers: ProductSupplier[];
  productId: string;
}

export function ProductSupplierTable({ productSuppliers, productId }: ProductSupplierTableProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const companyId = useCompanyId();
  const { data: materialSuppliers = [] } = useCompanyMaterialSuppliers(companyId || '');

  const unlinkMutation = useMutation({
    mutationFn: (id: string) => SupplierService.unlinkSupplierFromProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-suppliers', productId] });
      toast.success('Supplier unlinked successfully');
    },
    onError: (error) => {
      console.error('Error unlinking supplier:', error);
      toast.error('Failed to unlink supplier');
    },
  });

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

  const handleViewSupplier = (supplierId: string) => {
    navigate(`/app/supplier/${supplierId}`);
  };

  const confirmAction = useConfirm();
  const handleUnlink = async (productSupplierId: string) => {
    if (await confirmAction({ title: 'Unlink supplier', description: 'Are you sure you want to unlink this supplier from the product?', confirmLabel: 'Unlink', variant: 'destructive' })) {
      await unlinkMutation.mutateAsync(productSupplierId);
    }
  };

  if (productSuppliers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No suppliers linked to this product.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Link suppliers to track component sources and inspection requirements.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Component/Service</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criticality</TableHead>
            <TableHead>Inspection Requirements</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {productSuppliers.map((productSupplier) => (
            <TableRow key={productSupplier.id}>
              <TableCell className="font-medium">
                {productSupplier.component_name}
              </TableCell>
              <TableCell>
                <button
                  onClick={() => handleViewSupplier(productSupplier.supplier_id)}
                  className="text-left hover:underline focus:outline-none"
                >
                  {productSupplier.supplier?.name || 'Unknown Supplier'}
                </button>
              </TableCell>
              <TableCell>
                {productSupplier.supplier && (
                  <Badge variant={getStatusBadgeVariant(productSupplier.supplier.status)}>
                    {productSupplier.supplier.status}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {productSupplier.supplier && (
                  <Badge variant={getCriticalityBadgeVariant(productSupplier.supplier.criticality)}>
                    {productSupplier.supplier.criticality}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {productSupplier.inspection_requirements || '-'}
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
                    <DropdownMenuItem onClick={() => handleViewSupplier(productSupplier.supplier_id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Supplier
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleUnlink(productSupplier.id)}
                      className="text-destructive"
                    >
                      <Unlink className="mr-2 h-4 w-4" />
                      Unlink
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