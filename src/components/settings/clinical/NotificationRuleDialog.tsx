import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { useNotificationRules, NotificationRule, TriggerEvent } from '@/hooks/useNotificationRules';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NotificationRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: NotificationRule;
  companyId: string;
}

interface RuleFormData {
  rule_name: string;
  trigger_event: TriggerEvent;
  notification_message?: string;
  notification_recipients?: string;
}

export function NotificationRuleDialog({ open, onOpenChange, rule, companyId }: NotificationRuleDialogProps) {
  const { createRule, updateRule } = useNotificationRules(companyId);
  const { register, handleSubmit, reset, setValue, watch } = useForm<RuleFormData>({
    defaultValues: rule ? {
      ...rule,
      notification_recipients: rule.notification_recipients?.join(', '),
    } : undefined,
  });

  const triggerEvent = watch('trigger_event');

  const onSubmit = async (data: RuleFormData) => {
    try {
      const ruleData = {
        ...data,
        notification_recipients: data.notification_recipients?.split(',').map(r => r.trim()).filter(Boolean),
        is_active: true,
        trigger_conditions: {},
      };

      if (rule) {
        await updateRule(rule.id, ruleData);
      } else {
        await createRule(ruleData);
      }
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving notification rule:', error);
    }
  };

  const triggerEvents: { value: TriggerEvent; label: string }[] = [
    { value: 'enrollment_milestone', label: 'Enrollment Milestone' },
    { value: 'ethics_approval', label: 'Ethics Approval' },
    { value: 'regulatory_deadline', label: 'Regulatory Deadline' },
    { value: 'safety_report_due', label: 'Safety Report Due' },
    { value: 'behind_schedule', label: 'Behind Schedule' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit Notification Rule' : 'Add Notification Rule'}</DialogTitle>
          <DialogDescription>
            {rule ? 'Update notification rule settings' : 'Create a new automated notification rule'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="rule_name">Rule Name *</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Descriptive name for this notification rule</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input id="rule_name" {...register('rule_name', { required: true })} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="trigger_event">Trigger Event *</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Select the event that will trigger this notification (enrollment milestones, approvals, deadlines, etc.)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={triggerEvent}
              onValueChange={(value) => setValue('trigger_event', value as TriggerEvent)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select trigger event" />
              </SelectTrigger>
              <SelectContent>
                {triggerEvents.map((event) => (
                  <SelectItem key={event.value} value={event.value}>
                    {event.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="notification_recipients">
                Notification Recipients (comma-separated emails)
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Enter email addresses separated by commas for users who should receive these notifications</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="notification_recipients"
              {...register('notification_recipients')}
              placeholder="user1@example.com, user2@example.com"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="notification_message">Notification Message</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Customize the message that will be sent when this rule is triggered</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="notification_message"
              {...register('notification_message')}
              rows={4}
              placeholder="Enter the message to send when this rule is triggered..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{rule ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
