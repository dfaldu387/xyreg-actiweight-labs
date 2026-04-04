import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
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
  FormDescription,
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
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateSupplier, useUpdateSupplier } from '@/hooks/useSuppliers';
import { SupplierEvaluationWizard } from './SupplierEvaluationWizard';
import { ScopeOfSupplyField } from './ScopeOfSupplyField';
import { createScopeOfSupply } from '@/utils/scopeOfSupply';
import { CIInstanceService } from '@/services/ciInstanceService';
import { useTranslation } from '@/hooks/useTranslation';

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  status: z.enum(['Approved', 'Probationary', 'Disqualified']),
  criticality: z.enum(['Critical', 'Non-Critical']),
  supplier_type: z.enum(['Component Supplier', 'Raw Material Supplier', 'Service Provider', 'Consultant', 'CMO / CDMO', 'Other']),
  scope_category: z.string().optional(),
  scope_custom_description: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  contact_person: z.string().optional(),
  contact_address: z.string().optional(),
  schedule_audit: z.boolean(),
  audit_due_date: z.date().optional(),
  audit_interval: z.enum(['6 months', '1 year', '2 years', '3 years']),
  audit_type: z.enum(['Critical Supplier On-Site Audit', 'Non-Critical Supplier Evaluation']).optional(),
  probationary_reason: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface AddSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  userId?: string;
}

export function AddSupplierDialog({ open, onOpenChange, companyId, userId = '' }: AddSupplierDialogProps) {
  const { lang } = useTranslation();
  const [currentStep, setCurrentStep] = useState<'basic' | 'evaluation'>('basic');
  const [createdSupplierId, setCreatedSupplierId] = useState<string | null>(null);
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      status: 'Probationary' as const,
      criticality: 'Non-Critical' as const,
      supplier_type: 'Component Supplier' as const,
      scope_category: '',
      scope_custom_description: '',
      contact_email: '',
      contact_phone: '',
      contact_person: '',
      contact_address: '',
      schedule_audit: false,
      audit_due_date: undefined,
      audit_interval: '1 year' as const,
      audit_type: 'Non-Critical Supplier Evaluation' as const,
      probationary_reason: '',
    },
  });

  // Watch criticality and supplier type to auto-update audit scheduling
  const criticality = useWatch({
    control: form.control,
    name: 'criticality',
  });

  const supplierType = useWatch({
    control: form.control,
    name: 'supplier_type',
  });

  const scheduleAudit = useWatch({
    control: form.control,
    name: 'schedule_audit',
  });

  // Auto-set audit options based on criticality and supplier type
  React.useEffect(() => {
    // Auto-set criticality to Critical for CMO/CDMO suppliers
    if (supplierType === 'CMO / CDMO' && criticality !== 'Critical') {
      form.setValue('criticality', 'Critical');
    }
    
    if (criticality === 'Critical') {
      form.setValue('schedule_audit', true);
      form.setValue('audit_type', 'Critical Supplier On-Site Audit');
      form.setValue('audit_interval', '1 year');
      // Set default due date to 30 days from now for critical suppliers
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      form.setValue('audit_due_date', defaultDate);
    } else {
      form.setValue('audit_type', 'Non-Critical Supplier Evaluation');
      form.setValue('audit_interval', '2 years');
      // Set default due date to 90 days from now for non-critical suppliers
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 90);
      if (!form.getValues('audit_due_date')) {
        form.setValue('audit_due_date', defaultDate);
      }
    }
  }, [criticality, supplierType, form]);

  const onSubmit = async (data: SupplierFormData) => {
    const scopeOfSupply = data.scope_category 
      ? createScopeOfSupply(data.scope_category, data.scope_custom_description)
      : undefined;

    const supplier = {
      company_id: companyId,
      name: data.name,
      status: data.status,
      criticality: data.criticality,
      supplier_type: data.supplier_type,
      scope_of_supply: scopeOfSupply,
      contact_info: {
        email: data.contact_email || undefined,
        phone: data.contact_phone || undefined,
        contact_person: data.contact_person || undefined,
        address: data.contact_address || undefined,
      },
      probationary_reason: data.probationary_reason,
    };

    try {
      const newSupplier = await createMutation.mutateAsync(supplier);
      
      // Create supplier audit CI instance if requested or required for critical suppliers
      if (data.schedule_audit || data.criticality === 'Critical') {
        const auditDueDate = data.audit_due_date 
          ? format(data.audit_due_date, 'yyyy-MM-dd')
          : undefined;
        
        const scopeCategory = data.scope_category || 'Other';
        
        await CIInstanceService.createSupplierAuditCI(
          companyId,
          newSupplier.id,
          data.name,
          data.criticality,
          scopeCategory,
          userId,
          auditDueDate,
          data.audit_interval
        );

        // Update supplier with audit schedule
        if (auditDueDate && data.audit_interval) {
          await updateMutation.mutateAsync({
            id: newSupplier.id,
            updates: {
              next_scheduled_audit: auditDueDate,
              audit_interval: data.audit_interval
            }
          });
        }
      }
      
      setCreatedSupplierId(newSupplier.id);
      setCurrentStep('evaluation');
    } catch {
      // Failed to create supplier
    }
  };

  const handleClose = () => {
    setCurrentStep('basic');
    setCreatedSupplierId(null);
    form.reset();
    onOpenChange(false);
  };

  const handleEvaluationComplete = () => {
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        {currentStep === 'basic' && (
          <>
            <div className="flex-shrink-0">
              <DialogHeader>
                <DialogTitle>{lang('supplier.addNewSupplier')}</DialogTitle>
                <DialogDescription>
                  {lang('supplier.addSupplierDescription')}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-1 -mx-1">
              <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{lang('supplier.supplierName')} *</FormLabel>
                        <FormControl>
                          <Input placeholder={lang('supplier.enterSupplierName')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="criticality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{lang('supplier.criticalityLevel')} *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={supplierType === 'CMO / CDMO'}
                        >
                          <FormControl>
                            <SelectTrigger className={cn(
                              supplierType === 'CMO / CDMO' && "bg-muted text-muted-foreground cursor-not-allowed"
                            )}>
                              <SelectValue placeholder={lang('supplier.selectCriticality')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Non-Critical">{lang('supplier.nonCritical')}</SelectItem>
                            <SelectItem value="Critical">{lang('supplier.critical')}</SelectItem>
                          </SelectContent>
                        </Select>
                        {supplierType === 'CMO / CDMO' && (
                          <FormDescription className="text-amber-600">
                            {lang('supplier.cmoCdmoAutoClassified')}
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="supplier_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{lang('supplier.supplierType')} *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={lang('supplier.selectSupplierType')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Component Supplier">{lang('supplier.typeComponentSupplier')}</SelectItem>
                            <SelectItem value="Raw Material Supplier">{lang('supplier.typeRawMaterialSupplier')}</SelectItem>
                            <SelectItem value="Service Provider">{lang('supplier.typeServiceProvider')}</SelectItem>
                            <SelectItem value="Consultant">{lang('supplier.typeConsultant')}</SelectItem>
                            <SelectItem value="CMO / CDMO">{lang('supplier.typeCmoCdmo')}</SelectItem>
                            <SelectItem value="Other">{lang('supplier.typeOther')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {field.value === 'CMO / CDMO' && lang('supplier.cmoCdmoAutoClassifiedShort')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{lang('supplier.status')} *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={lang('supplier.selectStatus')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Probationary">{lang('supplier.statusProbationary')}</SelectItem>
                            <SelectItem value="Approved">{lang('supplier.statusApproved')}</SelectItem>
                            <SelectItem value="Disqualified">{lang('supplier.statusDisqualified')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Probationary Reason - Only show if status is Probationary */}
                {form.watch('status') === 'Probationary' && (
                  <FormField
                    control={form.control}
                    name="probationary_reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{lang('supplier.reasonForProbationary')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={lang('supplier.explainProbationaryStatus')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <ScopeOfSupplyField
                  control={form.control}
                  categoryName="scope_category"
                  customDescriptionName="scope_custom_description"
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact_person"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{lang('supplier.contactPerson')}</FormLabel>
                        <FormControl>
                          <Input placeholder={lang('supplier.contactPersonPlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{lang('supplier.email')}</FormLabel>
                        <FormControl>
                          <Input placeholder={lang('supplier.emailPlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{lang('supplier.phone')}</FormLabel>
                        <FormControl>
                          <Input placeholder={lang('supplier.phonePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="contact_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{lang('supplier.address')}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={lang('supplier.addressPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Supplier Audit Scheduling Section */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-medium">{lang('supplier.auditScheduling')}</h3>
                    {criticality === 'Critical' && (
                      <div className="flex items-center space-x-1 text-yellow-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">{lang('supplier.requiredForCritical')}</span>
                      </div>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="schedule_audit"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={criticality === 'Critical'}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className={cn(
                            criticality === 'Critical' && "text-muted-foreground"
                          )}>
                            {lang('supplier.scheduleSupplierAudit')}
                          </FormLabel>
                          <FormDescription>
                            {criticality === 'Critical'
                              ? lang('supplier.criticalAuditRequired')
                              : lang('supplier.optionalEvaluation')
                            }
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {scheduleAudit && (
                    <>
                      <FormField
                        control={form.control}
                        name="audit_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{lang('supplier.auditType')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Critical Supplier On-Site Audit">
                                  {lang('supplier.auditTypeCriticalOnSite')}
                                </SelectItem>
                                <SelectItem value="Non-Critical Supplier Evaluation">
                                  {lang('supplier.auditTypeNonCriticalEval')}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              {field.value === 'Critical Supplier On-Site Audit'
                                ? lang('supplier.auditDescCritical')
                                : lang('supplier.auditDescNonCritical')
                              }
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="audit_interval"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{lang('supplier.auditInterval')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="6 months">{lang('supplier.interval6Months')}</SelectItem>
                                <SelectItem value="1 year">{lang('supplier.interval1Year')}</SelectItem>
                                <SelectItem value="2 years">{lang('supplier.interval2Years')}</SelectItem>
                                <SelectItem value="3 years">{lang('supplier.interval3Years')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              {lang('supplier.auditIntervalDesc')}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="audit_due_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{lang('supplier.auditDueDate')}</FormLabel>
                            <FormControl>
                              <input
                                type="date"
                                value={field.value ? field.value.toISOString().split('T')[0] : ''}
                                onChange={(e) => {
                                  const dateValue = e.target.value ? new Date(e.target.value) : undefined;
                                  field.onChange(dateValue);
                                }}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full border border-foreground/15 rounded-md p-2"
                              />
                            </FormControl>
                            <FormDescription>
                              {criticality === 'Critical'
                                ? lang('supplier.auditDueDateCriticalDesc')
                                : lang('supplier.auditDueDateNonCriticalDesc')
                              }
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>

              </form>
              </Form>
            </div>

            <div className="flex-shrink-0 flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose}>
                {lang('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                onClick={form.handleSubmit(onSubmit)}
              >
                {createMutation.isPending ? lang('supplier.creating') : lang('supplier.createSupplier')}
              </Button>
            </div>
          </>
        )}

        {currentStep === 'evaluation' && createdSupplierId && (
          <SupplierEvaluationWizard
            supplierId={createdSupplierId}
            companyId={companyId}
            onComplete={handleEvaluationComplete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}