import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from "@/hooks/useTranslation";
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, ExternalLink } from 'lucide-react';
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
import { useStudyTypeConfigs } from '@/hooks/useStudyTypeConfigs';
import { useStandardEndpoints } from '@/hooks/useStandardEndpoints';
import { useCroPartners } from '@/hooks/useCroPartners';
import { useSiteRegistry } from '@/hooks/useSiteRegistry';
import { useCreateClinicalTrial } from '@/hooks/useCreateClinicalTrial';
import { useUpdateClinicalTrial } from '@/hooks/useUpdateClinicalTrial';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const formSchema = z.object({
  study_name: z.string().min(1, 'Study name is required'),
  protocol_id: z.string().min(1, 'Protocol ID is required'),
  study_type: z.enum(['feasibility', 'pivotal', 'pmcf', 'registry', 'other']),
  study_phase: z.enum(['protocol', 'ethics_review', 'enrollment', 'data_collection', 'analysis', 'reporting', 'completed']),
  status: z.enum(['pending', 'in_progress', 'completed', 'blocked', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  target_enrollment: z.number().min(0, 'Must be at least 0'),
  actual_enrollment: z.number().min(0, 'Must be at least 0').default(0),
  start_date: z.string().optional(),
  estimated_completion_date: z.string().optional(),
  ethics_approval_date: z.string().optional(),
  primary_endpoint: z.string().optional(),
  principal_investigator: z.string().optional(),
  cro_partner_id: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

interface ClinicalTrialFormProps {
  productId: string;
  companyId: string;
  companyName: string;
  existingTrial?: any;
  onSuccess: () => void;
}

export function ClinicalTrialForm({ productId, companyId, companyName, existingTrial, onSuccess }: ClinicalTrialFormProps) {
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const { configs, isLoading: loadingConfigs } = useStudyTypeConfigs(companyId);
  const { primaryEndpoints, isLoading: loadingEndpoints } = useStandardEndpoints(companyId);
  const { partners, isLoading: loadingPartners } = useCroPartners(companyId);
  const { activeSites, isLoading: loadingSites } = useSiteRegistry(companyId);
  const { createTrial, isCreating } = useCreateClinicalTrial();
  const { updateTrial, isUpdating } = useUpdateClinicalTrial();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: existingTrial ? {
      study_name: existingTrial.study_name || '',
      protocol_id: existingTrial.protocol_id || '',
      study_type: existingTrial.study_type || 'feasibility',
      study_phase: existingTrial.study_phase || 'protocol',
      status: existingTrial.status || 'pending',
      priority: existingTrial.priority || 'medium',
      target_enrollment: existingTrial.target_enrollment || 0,
      actual_enrollment: existingTrial.actual_enrollment || 0,
      start_date: existingTrial.start_date || undefined,
      estimated_completion_date: existingTrial.estimated_completion_date || undefined,
      ethics_approval_date: existingTrial.ethics_approval_date || undefined,
      primary_endpoint: existingTrial.primary_endpoint || '',
      principal_investigator: existingTrial.principal_investigator || '',
      cro_partner_id: existingTrial.cro_partner_id || undefined,
      description: existingTrial.description || '',
      notes: existingTrial.notes || '',
    } : {
      study_name: '',
      protocol_id: '',
      study_type: 'feasibility' as const,
      study_phase: 'protocol' as const,
      status: 'pending' as const,
      priority: 'medium' as const,
      target_enrollment: 0,
      actual_enrollment: 0,
    },
  });

  const selectedStudyType = form.watch('study_type');

  // Auto-populate enrollment based on study type config (only for new trials)
  useEffect(() => {
    if (!existingTrial) {
      const config = configs.find(c => c.study_type === selectedStudyType);
      if (config && config.default_min_enrollment) {
        form.setValue('target_enrollment', config.default_min_enrollment);
      }
    }
  }, [selectedStudyType, configs, existingTrial]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (existingTrial) {
      // Update existing trial
      await updateTrial(existingTrial.id, data);
    } else {
      // Create new trial
      await createTrial({
        ...data,
        product_id: productId,
        company_id: companyId,
      });
    }
    onSuccess();
  };

  const isLoading = loadingConfigs || loadingEndpoints || loadingPartners || loadingSites;
  const isSubmitting = isCreating || isUpdating;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const enabledConfigs = configs.filter(c => c.is_enabled);
  const endDate = form.watch("estimated_completion_date");

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{lang('clinicalTrials.form.settingsHint')}</span>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0"
            onClick={() => navigate(`/app/company/${encodeURIComponent(companyName)}/settings?tab=clinical-trials`)}
          >
            {lang('clinicalTrials.form.goToSettings')}
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </AlertDescription>
      </Alert>

      <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="study_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{lang('clinicalTrials.form.labels.studyName')}</FormLabel>
                <FormControl>
                  <Input placeholder={lang('clinicalTrials.form.placeholders.studyName')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="protocol_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{lang('clinicalTrials.form.labels.protocolId')}</FormLabel>
                <FormControl>
                  <Input placeholder={lang('clinicalTrials.form.placeholders.protocolId')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="study_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{lang('clinicalTrials.form.labels.studyType')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={lang('clinicalTrials.form.placeholders.studyType')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {enabledConfigs.map(config => (
                      <SelectItem key={config.study_type} value={config.study_type}>
                        {config.study_type.charAt(0).toUpperCase() + config.study_type.slice(1)}
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
            name="study_phase"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{lang('clinicalTrials.form.labels.studyPhase')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={lang('clinicalTrials.form.placeholders.studyPhase')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="protocol">{lang('clinicalTrials.form.phases.protocol')}</SelectItem>
                    <SelectItem value="ethics_review">{lang('clinicalTrials.form.phases.ethicsReview')}</SelectItem>
                    <SelectItem value="enrollment">{lang('clinicalTrials.form.phases.enrollment')}</SelectItem>
                    <SelectItem value="data_collection">{lang('clinicalTrials.form.phases.dataCollection')}</SelectItem>
                    <SelectItem value="analysis">{lang('clinicalTrials.form.phases.analysis')}</SelectItem>
                    <SelectItem value="reporting">{lang('clinicalTrials.form.phases.reporting')}</SelectItem>
                    <SelectItem value="completed">{lang('clinicalTrials.form.phases.completed')}</SelectItem>
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
                <FormLabel>{lang('clinicalTrials.form.labels.status')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={lang('clinicalTrials.form.placeholders.status')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">{lang('clinicalTrials.form.statuses.pending')}</SelectItem>
                    <SelectItem value="in_progress">{lang('clinicalTrials.form.statuses.inProgress')}</SelectItem>
                    <SelectItem value="completed">{lang('clinicalTrials.form.statuses.completed')}</SelectItem>
                    <SelectItem value="blocked">{lang('clinicalTrials.form.statuses.blocked')}</SelectItem>
                    <SelectItem value="cancelled">{lang('clinicalTrials.form.statuses.cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{lang('clinicalTrials.form.labels.priority')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={lang('clinicalTrials.form.placeholders.priority')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">{lang('clinicalTrials.form.priorities.low')}</SelectItem>
                    <SelectItem value="medium">{lang('clinicalTrials.form.priorities.medium')}</SelectItem>
                    <SelectItem value="high">{lang('clinicalTrials.form.priorities.high')}</SelectItem>
                    <SelectItem value="critical">{lang('clinicalTrials.form.priorities.critical')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="target_enrollment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{lang('clinicalTrials.form.labels.targetEnrollment')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="actual_enrollment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{lang('clinicalTrials.form.labels.actualEnrollment')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{lang('clinicalTrials.form.labels.startDate')}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} max={endDate || undefined} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estimated_completion_date"
            render={({ field }) => {
              const startDate = form.watch("start_date");

              return (
                <FormItem>
                  <FormLabel>{lang('clinicalTrials.form.labels.estCompletionDate')}</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      min={startDate || undefined}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="ethics_approval_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{lang('clinicalTrials.form.labels.ethicsApprovalDate')}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="principal_investigator"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{lang('clinicalTrials.form.labels.principalInvestigator')}</FormLabel>
                <FormControl>
                  <Input placeholder={lang('clinicalTrials.form.placeholders.piName')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="primary_endpoint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{lang('clinicalTrials.form.labels.primaryEndpoint')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={lang('clinicalTrials.form.placeholders.primaryEndpoint')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {primaryEndpoints.map(endpoint => (
                    <SelectItem key={endpoint.id} value={endpoint.name}>
                      {endpoint.name}
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
          name="cro_partner_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{lang('clinicalTrials.form.labels.croPartner')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={lang('clinicalTrials.form.placeholders.croPartner')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {partners.map(partner => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name}
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{lang('clinicalTrials.form.labels.description')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={lang('clinicalTrials.form.placeholders.description')}
                  className="min-h-[100px]"
                  {...field}
                />
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
              <FormLabel>{lang('clinicalTrials.form.labels.notes')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={lang('clinicalTrials.form.placeholders.notes')}
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? (existingTrial ? lang('clinicalTrials.form.buttons.updating') : lang('clinicalTrials.form.buttons.creating'))
              : (existingTrial ? lang('clinicalTrials.form.buttons.update') : lang('clinicalTrials.form.buttons.create'))
            }
          </Button>
        </div>
      </form>
    </Form>
    </div>
  );
}
