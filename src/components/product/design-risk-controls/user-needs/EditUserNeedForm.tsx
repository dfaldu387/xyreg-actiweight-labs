import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Sparkles, Loader2 } from "lucide-react";

import { useTranslation } from "@/hooks/useTranslation";
import type { UserNeed, UpdateUserNeedRequest } from "./types";
import { CATEGORY_PREFIX_MAP as categoryMap } from "./types";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  description: z.string().min(1, "User need description is required"),
  status: z.enum(['Met', 'Not Met']),
  category: z.string().min(1, "Category is required"),
});

interface EditUserNeedFormProps {
  userNeed: UserNeed;
  onSave: (data: UpdateUserNeedRequest) => Promise<void>;
  onDelete: () => void;
  onCancel: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function EditUserNeedForm({
  userNeed,
  onSave,
  onDelete,
  onCancel,
  isLoading,
  disabled = false,
}: EditUserNeedFormProps) {
  const categoryOptions = Object.keys(categoryMap);
  const { lang } = useTranslation();

  // Auto-fetch linked requirements from requirement_specifications
  const { data: linkedReqs = [] } = useQuery({
    queryKey: ['linked-requirements-for-user-need', userNeed.user_need_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requirement_specifications')
        .select('requirement_id, requirement_type')
        .like('traces_to', `%${userNeed.user_need_id}%`);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userNeed.user_need_id,
  });

  // Collect SYSR IDs from linkedReqs for hazard reverse lookup
  const linkedReqIds = linkedReqs.map((r) => r.requirement_id);

  // Auto-fetch related risks (hazards linked to downstream SYSRs)
  const { data: relatedRisks = [] } = useQuery({
    queryKey: ['related-risks-for-user-need', userNeed.user_need_id, linkedReqIds],
    queryFn: async () => {
      // Build OR filter: linked_requirements ilike any of the SYSR IDs
      const orFilter = linkedReqIds.map((id) => `linked_requirements.ilike.%${id}%`).join(',');
      const { data, error } = await supabase
        .from('hazards')
        .select('hazard_id')
        .or(orFilter);
      if (error) throw error;
      return data || [];
    },
    enabled: linkedReqIds.length > 0,
  });

  const [aiSuggested, setAiSuggested] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: userNeed.description,
      status: userNeed.status,
      category: userNeed.category || "General",
    },
  });

  const triggerAiSuggestion = async () => {
    const desc = form.getValues('description');
    if (!desc || desc.length < 15) return;
    setIsSuggesting(true);
    setAiSuggested(false);
    try {
      const categoryDescriptions: Record<string, string> = {
        General: 'General product needs, data integrity, core functionality',
        Safety: 'Patient/user safety, hazard prevention, protective measures',
        Performance: 'Device performance, accuracy, reliability, speed',
        Usability: 'User interface, ease of use, ergonomics, accessibility',
        Interface: 'System interfaces, connectivity, interoperability',
        Design: 'Design constraints, architecture, mechanical/electrical design',
        Regulatory: 'Regulatory compliance, standards, labeling, classification',
        Genesis: 'Product genesis, concept development, innovation',
        'Document Management': 'Document control workflows, version control, approval processes',
        Supplier: 'Supplier management, procurement, incoming inspection',
        Training: 'Training requirements, competency, user education',
      };
      const categories = categoryOptions.map(cat => ({
        id: cat, label: cat, description: categoryDescriptions[cat] || cat
      }));
      const { data, error } = await supabase.functions.invoke('ai-category-suggester', {
        body: { description: desc, categories, context: 'user-need' }
      });
      if (!error && data?.categoryId && categoryOptions.includes(data.categoryId)) {
        form.setValue('category', data.categoryId);
        setAiSuggested(true);
      }
    } catch (e) {
      console.error('AI category suggestion error:', e);
    } finally {
      setIsSuggesting(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (disabled) return;
    try {
      await onSave({
        description: values.description,
        status: values.status,
        category: values.category,
      });
    } catch (error) {
      console.error('Failed to update user need:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{lang('userNeeds.form.description')} *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={lang('userNeeds.form.descriptionPlaceholder')}
                  className="min-h-[100px]"
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>{lang('userNeeds.form.linkedRequirements')}</FormLabel>
          <div className="mt-1.5 min-h-[36px] flex flex-wrap gap-1 items-center rounded-md border border-input bg-muted/50 px-3 py-2">
            {linkedReqs.length === 0 ? (
              <span className="text-sm text-muted-foreground">—</span>
            ) : (
              linkedReqs.map((req) => (
                <Badge key={req.requirement_id} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {req.requirement_id}
                </Badge>
              ))
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Auto-populated from linked system/software/hardware requirements</p>
        </div>

        <div>
          <FormLabel>Related Risks</FormLabel>
          <div className="mt-1.5 min-h-[36px] flex flex-wrap gap-1 items-center rounded-md border border-input bg-muted/50 px-3 py-2">
            {relatedRisks.length === 0 ? (
              <span className="text-sm text-muted-foreground">—</span>
            ) : (
              relatedRisks.map((haz) => (
                <Badge key={haz.hazard_id} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  {haz.hazard_id}
                </Badge>
              ))
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Auto-populated from hazards linked to downstream requirements</p>
        </div>

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                {lang('userNeeds.form.category')} *
                <button
                  type="button"
                  onClick={triggerAiSuggestion}
                  disabled={isSuggesting || disabled}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                  title="AI suggest category"
                >
                  {isSuggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  {aiSuggested ? 'AI suggested' : 'AI suggest'}
                </button>
              </FormLabel>
              <Select onValueChange={(val) => { field.onChange(val); setAiSuggested(false); }} value={field.value} disabled={disabled}>
                <FormControl>
                  <SelectTrigger disabled={disabled}>
                    <SelectValue placeholder={lang('userNeeds.form.selectCategory')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
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
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{lang('userNeeds.form.status')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
                <FormControl>
                  <SelectTrigger disabled={disabled}>
                    <SelectValue placeholder={lang('userNeeds.form.selectStatus')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Met">{lang('userNeeds.status.met')}</SelectItem>
                  <SelectItem value="Not Met">{lang('userNeeds.status.notMet')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
            disabled={disabled || isLoading}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {lang('userNeeds.dialog.edit.deleteButton')}
          </Button>

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={disabled || isLoading}
            >
              {lang('common.cancel')}
            </Button>
            <Button type="submit" disabled={disabled || isLoading}>
              {isLoading ? lang('common.saving') : lang('userNeeds.dialog.edit.saveChanges')}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}