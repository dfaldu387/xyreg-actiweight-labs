import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Info, AlertTriangle, AlertCircle, ShieldAlert, ShieldCheck } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CAPASourceType, CAPAType, CAPA_SOURCE_LABELS } from '@/types/capa';
import { useCreateCAPA } from '@/hooks/useCAPAData';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

// RPN (Risk Priority Number) calculation and display
function getRPNInfo(severity: string, probability: string, lang: (key: string) => string) {
  const s = parseInt(severity) || 0;
  const p = parseInt(probability) || 0;
  if (s === 0 || p === 0) return null;

  const rpn = s * p;

  if (rpn >= 15) return { rpn, level: lang('capa.critical'), color: 'text-red-600 bg-red-50', icon: ShieldAlert, description: lang('capa.immediateActionRequired') };
  if (rpn >= 10) return { rpn, level: lang('capa.highPriority').split(' ')[0], color: 'text-orange-600 bg-orange-50', icon: AlertCircle, description: lang('capa.highPriority') };
  if (rpn >= 5) return { rpn, level: lang('capa.mediumPriority').split(' ')[0], color: 'text-yellow-600 bg-yellow-50', icon: AlertTriangle, description: lang('capa.mediumPriority') };
  return { rpn, level: lang('capa.lowPriority').split(' ')[0], color: 'text-green-600 bg-green-50', icon: ShieldCheck, description: lang('capa.lowPriority') };
}

// Extracted component for risk priority with RPN display
function RiskPrioritySection({ control }: { control: any }) {
  const { lang } = useTranslation();
  const severity = useWatch({ control, name: 'severity' });
  const probability = useWatch({ control, name: 'probability' });
  const rpnInfo = getRPNInfo(severity, probability, lang);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="severity"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-1.5">
                <FormLabel>{lang('capa.severity')}</FormLabel>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="font-medium mb-1">{lang('capa.severityRating')}</p>
                      <p className="text-xs">{lang('capa.severityDescription')}</p>
                      <ul className="text-xs mt-1 space-y-0.5">
                        <li>1 = {lang('capa.negligible')}</li>
                        <li>3 = {lang('capa.moderate')}</li>
                        <li>5 = {lang('capa.critical')}</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">1 - {lang('capa.negligible')}</SelectItem>
                  <SelectItem value="2">2 - {lang('capa.minor')}</SelectItem>
                  <SelectItem value="3">3 - {lang('capa.moderate')}</SelectItem>
                  <SelectItem value="4">4 - {lang('capa.serious')}</SelectItem>
                  <SelectItem value="5">5 - {lang('capa.critical')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="probability"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-1.5">
                <FormLabel>{lang('capa.probability')}</FormLabel>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="font-medium mb-1">{lang('capa.recurrenceProbability')}</p>
                      <p className="text-xs">{lang('capa.probabilityDescription')}</p>
                      <ul className="text-xs mt-1 space-y-0.5">
                        <li>1 = {lang('capa.remote')}</li>
                        <li>3 = {lang('capa.possible')}</li>
                        <li>5 = {lang('capa.almostCertain')}</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select probability" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">1 - {lang('capa.remote')}</SelectItem>
                  <SelectItem value="2">2 - {lang('capa.unlikely')}</SelectItem>
                  <SelectItem value="3">3 - {lang('capa.possible')}</SelectItem>
                  <SelectItem value="4">4 - {lang('capa.likely')}</SelectItem>
                  <SelectItem value="5">5 - {lang('capa.almostCertain')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* RPN Display */}
      {rpnInfo && (
        <div className={cn(
          "flex items-center gap-2 p-2.5 rounded-md border",
          rpnInfo.color
        )}>
          <rpnInfo.icon className="h-4 w-4" />
          <span className="text-sm font-medium">
            {lang('capa.riskPriority')}: {rpnInfo.level} (RPN = {rpnInfo.rpn})
          </span>
          <span className="text-xs opacity-75">— {rpnInfo.description}</span>
        </div>
      )}
    </div>
  );
}

const capaFormSchema = z.object({
  source_type: z.string().min(1, { message: 'Source type is required' }),
  capa_type: z.string().min(1, { message: 'CAPA type is required' }),
  problem_description: z.string().min(10, { message: 'Problem description must be at least 10 characters' }),
  immediate_correction: z.string().optional(),
  severity: z.string().optional(),
  probability: z.string().optional(),
});

type CAPAFormValues = z.infer<typeof capaFormSchema>;

interface CAPACreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  productId?: string;
  defaultSourceType?: CAPASourceType;
  defaultSourceId?: string;
}

const SOURCE_TYPES: { value: CAPASourceType; label: string }[] = [
  { value: 'internal', label: 'Internal Observation' },
  { value: 'complaint', label: 'Customer Complaint' },
  { value: 'audit', label: 'Audit Finding' },
  { value: 'ncr', label: 'Non-Conformance Report' },
  { value: 'pms_event', label: 'PMS Event' },
  { value: 'defect', label: 'V&V Defect' },
  { value: 'supplier', label: 'Supplier Issue' },
];

const CAPA_TYPES: { value: CAPAType; label: string }[] = [
  { value: 'correction', label: 'Correction Only' },
  { value: 'corrective', label: 'Corrective Action' },
  { value: 'preventive', label: 'Preventive Action' },
  { value: 'both', label: 'Corrective & Preventive' },
];

export function CAPACreateDialog({
  open,
  onOpenChange,
  companyId,
  productId,
  defaultSourceType,
  defaultSourceId,
}: CAPACreateDialogProps) {
  const { user } = useAuth();
  const createCAPA = useCreateCAPA();
  const { lang } = useTranslation();

  const form = useForm<CAPAFormValues>({
    resolver: zodResolver(capaFormSchema),
    defaultValues: {
      source_type: defaultSourceType || '',
      capa_type: '',
      problem_description: '',
      immediate_correction: '',
      severity: '',
      probability: '',
    },
  });

  const onSubmit = async (values: CAPAFormValues) => {
    if (!user?.id) return;

    await createCAPA.mutateAsync({
      company_id: companyId,
      product_id: productId || null,
      source_type: values.source_type as CAPASourceType,
      source_id: defaultSourceId || null,
      capa_type: values.capa_type as CAPAType,
      problem_description: values.problem_description,
      immediate_correction: values.immediate_correction || null,
      severity: values.severity ? parseInt(values.severity) : null,
      probability: values.probability ? parseInt(values.probability) : null,
      created_by: user.id,
    });

    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{lang('capa.createNewCapa')}</DialogTitle>
          <DialogDescription>
            {lang('capa.createDialogDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="source_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{lang('capa.sourceTypeRequired')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={lang('capa.selectSource')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SOURCE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
                name="capa_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{lang('capa.capaTypeRequired')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={lang('capa.selectType')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CAPA_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="problem_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang('capa.problemDescriptionRequired')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={lang('capa.describeProblem')}
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {lang('capa.beSpecific')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="immediate_correction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang('capa.immediateCorrectionOptional')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={lang('capa.describeImmediateActions')}
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <RiskPrioritySection control={form.control} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {lang('capa.cancel')}
              </Button>
              <Button type="submit" disabled={createCAPA.isPending}>
                {createCAPA.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {lang('capa.createCapa')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
