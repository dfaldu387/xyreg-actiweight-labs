import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApprovedSuppliers } from '@/hooks/useSuppliers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupplierService } from '@/services/supplierService';
import { toast } from 'sonner';

const linkSupplierSchema = z.object({
  supplier_id: z.string().min(1, 'Please select a supplier'),
  component_name: z.string().min(1, 'Component/service name is required'),
  inspection_requirements: z.string().optional(),
});

type LinkSupplierFormData = z.infer<typeof linkSupplierSchema>;

interface LinkSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  companyId: string;
}

export function LinkSupplierDialog({ open, onOpenChange, productId, companyId }: LinkSupplierDialogProps) {
  const queryClient = useQueryClient();
  const { data: approvedSuppliers = [] } = useApprovedSuppliers(companyId);

  const form = useForm<LinkSupplierFormData>({
    resolver: zodResolver(linkSupplierSchema),
    defaultValues: {
      supplier_id: '',
      component_name: '',
      inspection_requirements: '',
    },
  });

  const linkMutation = useMutation({
    mutationFn: (data: LinkSupplierFormData) => 
      SupplierService.linkSupplierToProduct({
        product_id: productId,
        supplier_id: data.supplier_id,
        component_name: data.component_name,
        inspection_requirements: data.inspection_requirements,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-suppliers', productId] });
      toast.success('Supplier linked successfully');
      handleClose();
    },
    onError: (error) => {
      console.error('Error linking supplier:', error);
      toast.error('Failed to link supplier');
    },
  });

  const onSubmit = async (data: LinkSupplierFormData) => {
    await linkMutation.mutateAsync(data);
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Link Supplier to Product</DialogTitle>
          <DialogDescription>
            Link an approved supplier to this product for a specific component or service.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="supplier_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an approved supplier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {approvedSuppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                          {supplier.criticality === 'Critical' && (
                            <span className="ml-2 text-xs text-destructive">(Critical)</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="component_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Component/Service Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Titanium screws, Software development, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="inspection_requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incoming Inspection Requirements</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe any specific inspection requirements for this component..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={linkMutation.isPending}>
                {linkMutation.isPending ? 'Linking...' : 'Link Supplier'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}