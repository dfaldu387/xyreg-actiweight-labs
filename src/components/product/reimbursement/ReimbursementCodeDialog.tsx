import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getReimbursementSystem } from '@/utils/marketReimbursementSystems';
import { useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface ReimbursementCodeFormData {
  market_code: string;
  code_type: string;
  code_value: string;
  code_description: string;
  coverage_status: string;
  application_date: string;
  approval_date: string;
  notes: string;
}

interface ReimbursementCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  companyId: string;
  targetMarkets: string[];
  editingCode?: any;
}

export function ReimbursementCodeDialog({
  open,
  onOpenChange,
  productId,
  companyId,
  targetMarkets,
  editingCode
}: ReimbursementCodeDialogProps) {
  const { lang } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, setValue, reset } = useForm<ReimbursementCodeFormData>({
    defaultValues: {
      market_code: targetMarkets[0] || '',
      code_type: '',
      code_value: '',
      code_description: '',
      coverage_status: 'pending',
      application_date: '',
      approval_date: '',
      notes: ''
    }
  });

  const selectedMarket = watch('market_code');
  const marketSystem = getReimbursementSystem(selectedMarket);

  const saveMutation = useMutation({
    mutationFn: async (data: ReimbursementCodeFormData) => {
      const payload = {
        ...data,
        product_id: productId,
        company_id: companyId,
        application_date: data.application_date || null,
        approval_date: data.approval_date || null,
      };

      if (editingCode) {
        const { error } = await supabase
          .from('product_reimbursement_codes')
          .update(payload)
          .eq('id', editingCode.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('product_reimbursement_codes')
          .insert(payload);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reimbursement-codes', productId] });
      toast({ title: editingCode ? lang('reimbursementCode.codeUpdated') : lang('reimbursementCode.codeAdded') });
      reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({ title: lang('reimbursementCode.saveFailed'), description: error.message, variant: 'destructive' });
    },
  });

  useEffect(() => {
    if (editingCode) {
      reset({
        market_code: editingCode.market_code,
        code_type: editingCode.code_type,
        code_value: editingCode.code_value,
        code_description: editingCode.code_description,
        coverage_status: editingCode.coverage_status,
        application_date: editingCode.application_date,
        approval_date: editingCode.approval_date,
        notes: editingCode.notes
      });
    } else {
      reset({
        market_code: targetMarkets[0] || '',
        code_type: '',
        code_value: '',
        code_description: '',
        coverage_status: 'pending',
        application_date: '',
        approval_date: '',
        notes: ''
      });
    }
  }, [editingCode, reset]);


  const onSubmit = (data: ReimbursementCodeFormData) => {
    saveMutation.mutate(data);
  };

  const applicationDate = watch("application_date");
  const approvalDate = watch("approval_date");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingCode ? lang('reimbursementCode.editCode') : lang('reimbursementCode.addCode')}</DialogTitle>
          <DialogDescription>
            {lang('reimbursementCode.dialogDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="market_code">{lang('reimbursementCode.market')}</Label>
              <Select
                value={watch('market_code')}
                onValueChange={(value) => setValue('market_code', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={lang('reimbursementCode.selectMarket')} />
                </SelectTrigger>
                <SelectContent>
                  {targetMarkets.map((market) => (
                    <SelectItem key={market} value={market}>
                      {market}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code_type">{lang('reimbursementCode.codeType')}</Label>
              <Select
                value={watch('code_type')}
                onValueChange={(value) => setValue('code_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={lang('reimbursementCode.selectCodeType')} />
                </SelectTrigger>
                <SelectContent>
                  {marketSystem?.codeTypes.map((codeType) => (
                    <SelectItem key={codeType.code} value={codeType.code}>
                      {codeType.code} - {codeType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code_value">{lang('reimbursementCode.codeValue')}</Label>
              <Input id="code_value" {...register('code_value')} placeholder={lang('reimbursementCode.codeValuePlaceholder')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverage_status">{lang('reimbursementCode.coverageStatus')}</Label>
              <Select
                value={watch('coverage_status')}
                onValueChange={(value) => setValue('coverage_status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exact_match">{lang('reimbursementCode.statusExactMatch')}</SelectItem>
                  <SelectItem value="partial_match">{lang('reimbursementCode.statusPartialMatch')}</SelectItem>
                  <SelectItem value="pending">{lang('reimbursementCode.statusPending')}</SelectItem>
                  <SelectItem value="new_needed">{lang('reimbursementCode.statusNewNeeded')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code_description">{lang('reimbursementCode.codeDescriptionOptional')}</Label>
            <Input id="code_description" {...register('code_description')} placeholder={lang('reimbursementCode.codeDescriptionPlaceholder')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="application_date">{lang('reimbursementCode.applicationDateOptional')}</Label>
              <Input
                id="application_date"
                type="date"
                max={approvalDate || undefined}
                {...register("application_date", {
                  validate: (value) => {
                    if (approvalDate && value && value > approvalDate) {
                      return lang('reimbursementCode.applicationDateError');
                    }
                    return true;
                  }
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="approval_date">{lang('reimbursementCode.approvalDateOptional')}</Label>
              <Input
                id="approval_date"
                type="date"
                min={applicationDate || undefined}
                {...register("approval_date", {
                  validate: (value) => {
                    if (applicationDate && value && value < applicationDate) {
                      return lang('reimbursementCode.approvalDateError');
                    }
                    return true;
                  }
                })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{lang('reimbursementCode.notesOptional')}</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder={lang('reimbursementCode.notesPlaceholder')}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {lang('common.cancel')}
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? lang('reimbursementCode.saving') : lang('reimbursementCode.saveCode')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
