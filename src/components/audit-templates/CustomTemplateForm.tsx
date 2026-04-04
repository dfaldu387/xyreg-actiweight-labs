
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";

interface CustomTemplateFormProps {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateAdded: () => void;
  initialData?: any;
}

interface TemplateFormData {
  template_name: string;
  description: string;
  applicability: string;
  lifecycle_phase?: string;
  suggested_duration?: string;
  suggested_auditor_type?: string;
  suggested_documents?: string;
  audit_type_category?: string;
}

export function CustomTemplateForm({
  companyId,
  open,
  onOpenChange,
  onTemplateAdded,
  initialData
}: CustomTemplateFormProps) {
  const { lang } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<TemplateFormData>({
    defaultValues: initialData || {
      template_name: "",
      description: "",
      applicability: "",
      lifecycle_phase: "",
      suggested_duration: "",
      suggested_auditor_type: "",
      suggested_documents: "",
      audit_type_category: ""
    }
  });

  const watchApplicability = watch("applicability");

  const onSubmit = async (data: TemplateFormData) => {
    setIsSubmitting(true);
    
    try {
      // First create the custom template
      const { data: template, error: templateError } = await supabase
        .from('audit_templates')
        .insert({
          ...data,
          source: 'custom'
        })
        .select()
        .single();

      if (templateError) {
        // console.error('Error creating template:', templateError);
        toast.error(lang('companySettings.auditTemplates.failedToCreateTemplate'));
        return;
      }

      // Then add it to company templates
      const { error: companyError } = await supabase
        .from('company_audit_templates')
        .insert({
          company_id: companyId,
          audit_template_id: template.id,
          is_enabled: true
        });

      if (companyError) {
        console.error('Error adding template to company:', companyError);
        toast.error(lang('companySettings.auditTemplates.failedToAddToCompany'));
        return;
      }

      toast.success(lang('companySettings.auditTemplates.customTemplateCreated'));
      reset();
      onTemplateAdded();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error(lang('companySettings.auditTemplates.failedToCreateTemplate'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? lang('companySettings.auditTemplates.editCustomTemplate') : lang('companySettings.auditTemplates.createCustomTemplate')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template_name">{lang('companySettings.auditTemplates.templateName')} *</Label>
            <Input
              id="template_name"
              {...register("template_name", { required: lang('companySettings.auditTemplates.templateNameRequired') })}
              placeholder={lang('companySettings.auditTemplates.enterTemplateName')}
            />
            {errors.template_name && (
              <p className="text-sm text-destructive">{errors.template_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{lang('companySettings.auditTemplates.description')}</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder={lang('companySettings.auditTemplates.describeTemplate')}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicability">{lang('companySettings.auditTemplates.applicability')} *</Label>
            <input
              type="hidden"
              {...register("applicability", { required: lang('companySettings.auditTemplates.applicabilityRequired') })}
            />
            <Select
              value={watchApplicability}
              onValueChange={(value) => setValue("applicability", value, {shouldValidate: true})}
            >
              <SelectTrigger>
                <SelectValue placeholder={lang('companySettings.auditTemplates.selectApplicability')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company-wide">{lang('companySettings.auditTemplates.companyWide')}</SelectItem>
                <SelectItem value="product-applicable">{lang('companySettings.auditTemplates.productApplicable')}</SelectItem>
              </SelectContent>
            </Select>
            {errors.applicability && (
              <p className="text-sm text-destructive">{lang('companySettings.auditTemplates.applicabilityRequired')}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lifecycle_phase">{lang('companySettings.auditTemplates.lifecyclePhase')}</Label>
              <Input
                id="lifecycle_phase"
                {...register("lifecycle_phase")}
                placeholder={lang('companySettings.auditTemplates.lifecyclePhasePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suggested_duration">{lang('companySettings.auditTemplates.suggestedDuration')}</Label>
              <Input
                id="suggested_duration"
                {...register("suggested_duration")}
                placeholder={lang('companySettings.auditTemplates.suggestedDurationPlaceholder')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="suggested_auditor_type">{lang('companySettings.auditTemplates.suggestedAuditorType')}</Label>
              <input type="hidden" {...register("suggested_auditor_type")} />
              <Select
                value={watch("suggested_auditor_type") || ""}
                onValueChange={(value) => setValue("suggested_auditor_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={lang('companySettings.auditTemplates.suggestedAuditorTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Internal">Internal</SelectItem>
                  <SelectItem value="External">External</SelectItem>
                  <SelectItem value="Third Party">Third Party</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audit_type_category">{lang('companySettings.auditTemplates.category')}</Label>
              <Input
                id="audit_type_category"
                {...register("audit_type_category")}
                placeholder={lang('companySettings.auditTemplates.categoryPlaceholder')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="suggested_documents">{lang('companySettings.auditTemplates.suggestedDocuments')}</Label>
            <Textarea
              id="suggested_documents"
              {...register("suggested_documents")}
              placeholder={lang('companySettings.auditTemplates.suggestedDocumentsPlaceholder')}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {lang('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? lang('companySettings.auditTemplates.creating') : initialData ? lang('companySettings.auditTemplates.updateTemplate') : lang('companySettings.auditTemplates.createTemplate')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
