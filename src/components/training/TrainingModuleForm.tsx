import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrainingModule, TrainingModuleFormData, TrainingModuleType, DeliveryMethod } from '@/types/training';
import { useCreateTrainingModule, useUpdateTrainingModule } from '@/hooks/useTrainingModules';
import { useCompanyDocuments } from '@/hooks/useCompanyDocuments';
import { FileText, Lock } from 'lucide-react';

const DEFAULT_ATTESTATION_TEXT =
  'I attest that I have read, understood, and will comply with the procedure referenced above. I understand my electronic signature is the legally binding equivalent of my handwritten signature (21 CFR Part 11 / EU Annex 11).';

interface Props {
  companyId: string;
  module?: TrainingModule | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TrainingModuleForm({ companyId, module, onSuccess, onCancel }: Props) {
  const createModule = useCreateTrainingModule(companyId);
  const updateModule = useUpdateTrainingModule(companyId);
  const { documents: companyDocuments, isLoading: documentsLoading } = useCompanyDocuments(companyId);
  const { lang } = useTranslation();
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TrainingModuleFormData>({
    defaultValues: {
      name: module?.name || '',
      description: module?.description || '',
      type: module?.type || 'sop',
      document_id: module?.document_id || null,
      external_url: module?.external_url || '',
      delivery_method: module?.delivery_method || 'self_paced',
      requires_signature: module?.requires_signature ?? true,
      estimated_minutes: module?.estimated_minutes || null,
      validity_days: module?.validity_days || null,
      version: module?.version || '1.0',
      requires_quiz: module?.requires_quiz ?? false,
      minimum_read_seconds: module?.minimum_read_seconds ?? 180,
      attestation_text: module?.attestation_text ?? DEFAULT_ATTESTATION_TEXT,
      max_attempts: module?.max_attempts ?? 3,
    },
  });

  const type = watch('type');
  const deliveryMethod = watch('delivery_method');
  const requiresSignature = watch('requires_signature');
  const documentId = watch('document_id');
  const requiresQuiz = watch('requires_quiz');
  const minReadSeconds = watch('minimum_read_seconds');

  const onSubmit = async (data: TrainingModuleFormData) => {
    try {
      if (module) {
        await updateModule.mutateAsync({ id: module.id, ...data });
      } else {
        await createModule.mutateAsync(data);
      }
      onSuccess();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = createModule.isPending || updateModule.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{lang('training.moduleForm.moduleName')}</Label>
        <Input
          id="name"
          {...register('name', { required: lang('training.moduleForm.nameRequired') })}
          placeholder={lang('training.moduleForm.moduleNamePlaceholder')}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{lang('training.moduleForm.description')}</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder={lang('training.moduleForm.descriptionPlaceholder')}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{lang('training.moduleForm.type')}</Label>
          <Select
            value={type}
            onValueChange={(value: TrainingModuleType) => setValue('type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sop">{lang('training.moduleForm.typeOptions.sop')}</SelectItem>
              <SelectItem value="video">{lang('training.moduleForm.typeOptions.video')}</SelectItem>
              <SelectItem value="workshop">{lang('training.moduleForm.typeOptions.workshop')}</SelectItem>
              <SelectItem value="course">{lang('training.moduleForm.typeOptions.course')}</SelectItem>
              <SelectItem value="external">{lang('training.moduleForm.typeOptions.external')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{lang('training.moduleForm.deliveryMethod')}</Label>
          <Select
            value={deliveryMethod}
            onValueChange={(value: DeliveryMethod) => setValue('delivery_method', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="self_paced">{lang('training.moduleForm.deliveryOptions.selfPaced')}</SelectItem>
              <SelectItem value="live_session">{lang('training.moduleForm.deliveryOptions.liveSession')}</SelectItem>
              <SelectItem value="blended">{lang('training.moduleForm.deliveryOptions.blended')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {(type === 'sop' || type === 'video') && (
        <div className="space-y-2">
          <Label>{lang('training.moduleForm.linkedDocument')}</Label>
          <Select
            value={documentId || ''}
            onValueChange={(value) => setValue('document_id', value || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder={documentsLoading ? lang('training.moduleForm.loadingDocuments') : lang('training.moduleForm.selectDocument')} />
            </SelectTrigger>
            <SelectContent>
              {companyDocuments.map((doc) => (
                <SelectItem key={doc.id} value={doc.id}>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span>{doc.name}</span>
                    <span className="text-muted-foreground">({doc.document_type})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {lang('training.moduleForm.selectDocumentHint')}
          </p>
        </div>
      )}

      {type === 'external' && (
        <div className="space-y-2">
          <Label htmlFor="external_url">{lang('training.moduleForm.externalUrl')}</Label>
          <Input
            id="external_url"
            {...register('external_url')}
            placeholder="https://..."
            type="url"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estimated_minutes">{lang('training.moduleForm.duration')}</Label>
          <Input
            id="estimated_minutes"
            type="number"
            {...register('estimated_minutes', { valueAsNumber: true })}
            placeholder={lang('training.moduleForm.durationPlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="validity_days">{lang('training.moduleForm.validityDays')}</Label>
          <Input
            id="validity_days"
            type="number"
            {...register('validity_days', { valueAsNumber: true })}
            placeholder={lang('training.moduleForm.validityPlaceholder')}
          />
          <p className="text-xs text-muted-foreground">{lang('training.moduleForm.validityHint')}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="version">{lang('training.moduleForm.version')}</Label>
        <Input
          id="version"
          {...register('version')}
          placeholder={lang('training.moduleForm.versionPlaceholder')}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label htmlFor="requires_signature" className="font-medium">
            {lang('training.moduleForm.requiresSignature')}
          </Label>
          <p className="text-sm text-muted-foreground">
            {lang('training.moduleForm.requiresSignatureDesc')}
          </p>
        </div>
        <Switch
          id="requires_signature"
          checked={requiresSignature}
          onCheckedChange={(checked) => setValue('requires_signature', checked)}
        />
      </div>

      <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-teal-600" />
          <h4 className="font-semibold text-sm">Locked Workflow (Read → Quiz → Sign)</h4>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Enforces a strict, audit-defensible sequence. The Sign button stays disabled until the user has spent the minimum read time and (optionally) passed the quiz.
        </p>

        <div className="flex items-center justify-between rounded-md bg-background border p-3">
          <div>
            <Label htmlFor="requires_quiz" className="font-medium">Require quiz before signature</Label>
            <p className="text-xs text-muted-foreground">AI-generated multiple-choice based on the linked document.</p>
          </div>
          <Switch
            id="requires_quiz"
            checked={requiresQuiz}
            onCheckedChange={(checked) => setValue('requires_quiz', checked)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minimum_read_seconds">Minimum read time (seconds)</Label>
            <Input
              id="minimum_read_seconds"
              type="number"
              min={0}
              {...register('minimum_read_seconds', { valueAsNumber: true })}
              placeholder="180"
            />
            <p className="text-xs text-muted-foreground">
              ≈ {Math.max(0, Math.round((Number(minReadSeconds) || 0) / 60))} min. Sign button stays locked until elapsed.
            </p>
          </div>

          {requiresQuiz && (
            <div className="space-y-2">
              <Label htmlFor="max_attempts">Max quiz attempts</Label>
              <Input
                id="max_attempts"
                type="number"
                min={1}
                max={10}
                {...register('max_attempts', { valueAsNumber: true })}
                placeholder="3"
              />
              <p className="text-xs text-muted-foreground">After max failed attempts, requires manager re-assignment.</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="attestation_text">Attestation statement</Label>
          <Textarea
            id="attestation_text"
            {...register('attestation_text')}
            rows={3}
            placeholder={DEFAULT_ATTESTATION_TEXT}
          />
          <p className="text-xs text-muted-foreground">Shown verbatim at the signature step. 21 CFR Part 11 compliant text recommended.</p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {lang('training.moduleForm.cancel')}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? lang('training.moduleForm.saving') : module ? lang('training.moduleForm.updateModule') : lang('training.moduleForm.createModule')}
        </Button>
      </div>
    </form>
  );
}
