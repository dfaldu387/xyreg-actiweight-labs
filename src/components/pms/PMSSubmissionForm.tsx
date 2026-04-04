import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePMSReport } from '@/hooks/usePMSData';
import { Loader2 } from 'lucide-react';

const submissionSchema = z.object({
  report_type: z.enum(['PSUR', 'PMSR', 'On-Demand', 'Other']),
  submission_date: z.string().min(1, 'Submission date is required'),
  reporting_period_start: z.string().optional(),
  reporting_period_end: z.string().optional(),
  regulatory_body: z.string().max(255).optional(),
  market_code: z.string().max(10).optional(),
  submission_status: z.enum(['draft', 'submitted', 'accepted', 'rejected', 'under_review']),
  notes: z.string().max(1000).optional(),
  next_due_date: z.string().optional()
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

interface PMSSubmissionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  companyId: string;
}

export function PMSSubmissionForm({ open, onOpenChange, productId, companyId }: PMSSubmissionFormProps) {
  const createReport = useCreatePMSReport();
  
  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      report_type: 'PSUR',
      submission_status: 'submitted',
      submission_date: new Date().toISOString().split('T')[0]
    }
  });

  const onSubmit = async (data: SubmissionFormData) => {
    await createReport.mutateAsync({
      ...data,
      product_id: productId,
      company_id: companyId
    });
    
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log PMS Report Submission</DialogTitle>
          <DialogDescription>
            Record a new PMS report submission (PSUR, PMSR, or other regulatory report)
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="report_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PSUR">PSUR</SelectItem>
                        <SelectItem value="PMSR">PMSR</SelectItem>
                        <SelectItem value="On-Demand">On-Demand</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="submission_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Submission Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="submission_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Submission Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="next_due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Due Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reporting_period_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reporting Period Start (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reporting_period_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reporting Period End (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="regulatory_body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regulatory Body (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., FDA, EMA, Health Canada" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="market_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Market Code (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., EU, US, CA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about this submission..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createReport.isPending}>
                {createReport.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log Submission
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
