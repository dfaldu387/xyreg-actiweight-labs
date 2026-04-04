import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCreateIPAsset, useUpdateIPAsset, IPAsset, IPAssetFormData } from '@/hooks/useIPAssets';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { useTranslation } from '@/hooks/useTranslation';

type IPAssetType = Database['public']['Enums']['ip_asset_type'];
type IPAssetStatus = Database['public']['Enums']['ip_asset_status'];

const ipAssetSchema = z.object({
  ip_type: z.enum(['patent', 'trademark', 'copyright', 'trade_secret', 'design_right'] as const),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  status: z.enum(['idea', 'disclosure', 'filing_prep', 'pending', 'granted', 'abandoned', 'expired'] as const),
  inventors: z.string().optional(),
  owner_assignee: z.string().optional().nullable(),
  priority_date: z.string().optional().nullable(),
  abstract: z.string().optional().nullable(),
  patent_family_id: z.string().optional().nullable(),
  internal_reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof ipAssetSchema>;

interface IPAssetFormProps {
  companyId: string;
  asset?: IPAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  disabled?: boolean;
}

export function IPAssetForm({ companyId, asset, open, onOpenChange, onSuccess, disabled }: IPAssetFormProps) {
  const createAsset = useCreateIPAsset(companyId);
  const updateAsset = useUpdateIPAsset();
  const isEditing = !!asset;
  const { lang } = useTranslation();

  // Parse inventors from JSON array to comma-separated string
  const parseInventors = (inventors: any): string => {
    if (!inventors) return '';
    if (Array.isArray(inventors)) return inventors.join(', ');
    return String(inventors);
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(ipAssetSchema),
    defaultValues: {
      ip_type: asset?.ip_type || 'patent',
      title: asset?.title || '',
      description: asset?.description || '',
      status: asset?.status || 'idea',
      inventors: parseInventors(asset?.inventors),
      owner_assignee: asset?.owner_assignee || '',
      priority_date: asset?.priority_date || '',
      abstract: asset?.abstract || '',
      patent_family_id: asset?.patent_family_id || '',
      internal_reference: asset?.internal_reference || '',
      notes: asset?.notes || '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (disabled) return;
    try {
      const formData: IPAssetFormData = {
        ip_type: values.ip_type as IPAssetType,
        title: values.title,
        description: values.description || null,
        status: values.status as IPAssetStatus,
        inventors: values.inventors ? values.inventors.split(',').map(s => s.trim()) : null,
        owner_assignee: values.owner_assignee || null,
        priority_date: values.priority_date || null,
        abstract: values.abstract || null,
        patent_family_id: values.patent_family_id || null,
        internal_reference: values.internal_reference || null,
        notes: values.notes || null,
      };

      if (isEditing && asset) {
        await updateAsset.mutateAsync({ id: asset.id, ...formData });
        toast.success(lang('ipPortfolio.assetForm.updateSuccess'));
      } else {
        await createAsset.mutateAsync(formData);
        toast.success(lang('ipPortfolio.assetForm.createSuccess'));
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(isEditing ? lang('ipPortfolio.assetForm.updateError') : lang('ipPortfolio.assetForm.createError'));
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (disabled && newOpen) return;
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? lang('ipPortfolio.assetForm.editTitle') : lang('ipPortfolio.assetForm.createTitle')}</DialogTitle>
          <DialogDescription>
            {isEditing ? lang('ipPortfolio.assetForm.editDescription') : lang('ipPortfolio.assetForm.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ip_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{lang('ipPortfolio.assetForm.ipType')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={lang('ipPortfolio.assetForm.selectIpType')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="patent">{lang('ipPortfolio.ipTypes.patent')}</SelectItem>
                        <SelectItem value="trademark">{lang('ipPortfolio.ipTypes.trademark')}</SelectItem>
                        <SelectItem value="copyright">{lang('ipPortfolio.ipTypes.copyright')}</SelectItem>
                        <SelectItem value="trade_secret">{lang('ipPortfolio.ipTypes.tradeSecret')}</SelectItem>
                        <SelectItem value="design_right">{lang('ipPortfolio.ipTypes.designRight')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{lang('ipPortfolio.assetForm.status')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={lang('ipPortfolio.assetForm.selectStatus')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="idea">{lang('ipPortfolio.statuses.idea')}</SelectItem>
                        <SelectItem value="disclosure">{lang('ipPortfolio.statuses.disclosure')}</SelectItem>
                        <SelectItem value="filing_prep">{lang('ipPortfolio.statuses.filingPrep')}</SelectItem>
                        <SelectItem value="pending">{lang('ipPortfolio.statuses.pending')}</SelectItem>
                        <SelectItem value="granted">{lang('ipPortfolio.statuses.granted')}</SelectItem>
                        <SelectItem value="abandoned">{lang('ipPortfolio.statuses.abandoned')}</SelectItem>
                        <SelectItem value="expired">{lang('ipPortfolio.statuses.expired')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang('ipPortfolio.assetForm.title')}</FormLabel>
                  <FormControl>
                    <Input placeholder={lang('ipPortfolio.assetForm.titlePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang('ipPortfolio.assetForm.description')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={lang('ipPortfolio.assetForm.descriptionPlaceholder')} {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="internal_reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{lang('ipPortfolio.assetForm.internalReference')}</FormLabel>
                    <FormControl>
                      <Input placeholder={lang('ipPortfolio.assetForm.internalReferencePlaceholder')} {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{lang('ipPortfolio.assetForm.priorityDate')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="inventors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang('ipPortfolio.assetForm.inventors')}</FormLabel>
                  <FormControl>
                    <Input placeholder={lang('ipPortfolio.assetForm.inventorsPlaceholder')} {...field} />
                  </FormControl>
                  <FormDescription>{lang('ipPortfolio.assetForm.inventorsDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="owner_assignee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang('ipPortfolio.assetForm.ownerAssignee')}</FormLabel>
                  <FormControl>
                    <Input placeholder={lang('ipPortfolio.assetForm.ownerAssigneePlaceholder')} {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="patent_family_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang('ipPortfolio.assetForm.patentFamilyId')}</FormLabel>
                  <FormControl>
                    <Input placeholder={lang('ipPortfolio.assetForm.patentFamilyIdPlaceholder')} {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="abstract"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang('ipPortfolio.assetForm.abstract')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={lang('ipPortfolio.assetForm.abstractPlaceholder')} rows={4} {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang('ipPortfolio.assetForm.notes')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={lang('ipPortfolio.assetForm.notesPlaceholder')} {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {lang('ipPortfolio.assetForm.cancel')}
              </Button>
              <Button type="submit" disabled={disabled || createAsset.isPending || updateAsset.isPending}>
                {createAsset.isPending || updateAsset.isPending ? lang('ipPortfolio.assetForm.saving') : isEditing ? lang('ipPortfolio.assetForm.updateAsset') : lang('ipPortfolio.assetForm.createAsset')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
