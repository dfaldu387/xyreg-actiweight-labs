import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useCreatePMSEvent } from '@/hooks/usePMSData';
import { Loader2 } from 'lucide-react';
import { PMSEscalationResult } from './PMSEscalationResult';
import { EscalationResult } from '@/services/pmsEscalationService';

const eventSchema = z.object({
  event_type: z.enum(['complaint', 'adverse_event', 'device_malfunction', 'near_miss', 'literature_finding', 'customer_feedback', 'other']),
  event_date: z.string().min(1, 'Event date is required'),
  severity: z.enum(['minor', 'moderate', 'serious', 'critical']).optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  investigation_status: z.enum(['open', 'investigating', 'closed', 'escalated']),
  corrective_actions: z.string().max(1000).optional(),
  preventive_actions: z.string().max(1000).optional(),
  root_cause: z.string().max(500).optional(),
  reporter_name: z.string().max(255).optional(),
  reporter_contact: z.string().max(255).optional(),
  market_code: z.string().max(10).optional(),
  is_reportable: z.boolean(),
  reported_to_authority: z.boolean(),
  authority_reference: z.string().max(255).optional()
});

type EventFormData = z.infer<typeof eventSchema>;

interface PMSEventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  companyId: string;
}

export function PMSEventForm({ open, onOpenChange, productId, companyId }: PMSEventFormProps) {
  const createEvent = useCreatePMSEvent();
  const [escalationResult, setEscalationResult] = useState<EscalationResult | null>(null);
  const [showEscalation, setShowEscalation] = useState(false);
  
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      event_type: 'complaint',
      investigation_status: 'open',
      is_reportable: false,
      reported_to_authority: false,
      event_date: new Date().toISOString().split('T')[0]
    }
  });

  const onSubmit = async (data: EventFormData) => {
    const result = await createEvent.mutateAsync({
      ...data,
      product_id: productId,
      company_id: companyId
    });
    
    form.reset();
    onOpenChange(false);
    
    // Show escalation result
    setEscalationResult(result.escalation);
    setShowEscalation(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log PMS Event</DialogTitle>
            <DialogDescription>
              Record a post-market surveillance event (complaint, adverse event, malfunction, etc.)
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="event_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="complaint">Complaint</SelectItem>
                          <SelectItem value="adverse_event">Adverse Event</SelectItem>
                          <SelectItem value="device_malfunction">Device Malfunction</SelectItem>
                          <SelectItem value="near_miss">Near Miss</SelectItem>
                          <SelectItem value="literature_finding">Literature Finding</SelectItem>
                          <SelectItem value="customer_feedback">Customer Feedback</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select severity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="minor">Minor</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="serious">Serious</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
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
                  name="event_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="investigation_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Investigation Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="investigating">Investigating</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="escalated">Escalated</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the event in detail..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="reporter_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reporter Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reporter_contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reporter Contact (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Email or phone" {...field} />
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
                      <FormLabel>Market (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., EU, US" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="is_reportable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Reportable Event</FormLabel>
                        <FormDescription>
                          Must be reported to regulatory authority
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reported_to_authority"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Reported to Authority</FormLabel>
                        <FormDescription>
                          Has been reported to regulator
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="authority_reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Authority Reference (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Report ID, MDR number" {...field} />
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
                <Button type="submit" disabled={createEvent.isPending}>
                  {createEvent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Log Event
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <PMSEscalationResult
        open={showEscalation}
        onOpenChange={setShowEscalation}
        result={escalationResult}
      />
    </>
  );
}
