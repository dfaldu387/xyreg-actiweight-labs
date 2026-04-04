import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { UserNeedsService } from '@/services/userNeedsService';
import { CreateUserNeedRequest } from './types';
import { CATEGORY_PREFIX_MAP } from './types';
import { requirementSpecificationsService } from '@/services/requirementSpecificationsService';
import { resolveCategory, resolveLineageBase } from '@/utils/traceabilityIdUtils';

import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  status: z.enum(['Met', 'Not Met']),
  category: z.string().min(1, 'Category is required'),
});

type FormData = z.infer<typeof formSchema>;

interface AddUserNeedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  companyId: string;
  onUserNeedAdded: () => void;
  disabled?: boolean;
}

export function AddUserNeedDialog({
  open,
  onOpenChange,
  productId,
  companyId,
  onUserNeedAdded,
  disabled = false,
}: AddUserNeedDialogProps) {
  const { lang } = useTranslation();
  const categoryOptions = Object.keys(CATEGORY_PREFIX_MAP);
  const handleOpenChange = (newOpen: boolean) => {
    if (disabled && newOpen) return;
    onOpenChange(newOpen);
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      status: 'Not Met',
      category: 'General',
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

  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true);
    try {
      const request: CreateUserNeedRequest & { basePrefix?: string } = {
        product_id: productId,
        company_id: companyId,
        description: values.description,
        status: values.status,
        category: values.category,
        basePrefix: undefined,
      };

      const createdUN = await UserNeedsService.createUserNeed(request);

      // Auto-create a draft System Requirement linked to this User Need
      try {
        const userNeedId = createdUN.user_need_id;
        const catSuffix = resolveCategory([userNeedId]);
        const lineage = resolveLineageBase([userNeedId], catSuffix);

        await requirementSpecificationsService.create(
          productId,
          companyId,
          {
            description: `Draft — define system requirement for ${userNeedId}`,
            category: values.category || 'General',
            traces_to: userNeedId,
            linked_risks: '',
            verification_status: 'Not Started'
          },
          'system',
          catSuffix,
          lineage
        );
      } catch (draftError) {
        console.error('Failed to auto-create draft SYSR:', draftError);
        toast({
          title: 'Draft SYSR not created',
          description: `User Need was saved, but the auto-draft SYSR failed: ${draftError instanceof Error ? draftError.message : 'Unknown error'}`,
          variant: 'destructive',
        });
      }

      toast({
        title: lang('userNeeds.dialog.add.successTitle'),
        description: lang('userNeeds.dialog.add.successDesc'),
      });

      form.reset();
      setAiSuggested(false);
      
      onOpenChange(false);
      onUserNeedAdded();
    } catch (error) {
      console.error('Error creating user need:', error);
      toast({
        title: lang('common.error'),
        description: lang('userNeeds.dialog.add.errorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{lang('userNeeds.dialog.add.title')}</DialogTitle>
          <DialogDescription>
            {lang('userNeeds.dialog.add.description')}
          </DialogDescription>
        </DialogHeader>

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
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      disabled={isSuggesting}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                      title="AI suggest category"
                    >
                      {isSuggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      {aiSuggested ? 'AI suggested' : 'AI suggest'}
                    </button>
                  </FormLabel>
                  <Select onValueChange={(val) => { field.onChange(val); setAiSuggested(false); }} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
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
                  <FormLabel>{lang('userNeeds.form.status')} *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={lang('userNeeds.form.selectStatus')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Not Met">{lang('userNeeds.status.notMet')}</SelectItem>
                      <SelectItem value="Met">{lang('userNeeds.status.met')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {lang('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? lang('userNeeds.dialog.add.creating') : lang('userNeeds.dialog.add.create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}