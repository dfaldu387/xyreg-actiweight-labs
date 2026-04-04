import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Bell, AlertCircle } from 'lucide-react';
import { useNotificationRules, NotificationRule } from '@/hooks/useNotificationRules';
import { NotificationRuleDialog } from './NotificationRuleDialog';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface NotificationRulesManagerProps {
  companyId: string;
}

export function NotificationRulesManager({ companyId }: NotificationRulesManagerProps) {
  const { lang } = useTranslation();
  const { rules, isLoading, toggleActive, deleteRule } = useNotificationRules(companyId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<NotificationRule | undefined>();

  const handleEdit = (rule: NotificationRule) => {
    setSelectedRule(rule);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedRule(undefined);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(lang('companyClinical.notifications.confirmDelete'))) {
      await deleteRule(id);
    }
  };

  const getTriggerEventLabel = (event: string) => {
    const labels: Record<string, string> = {
      enrollment_milestone: lang('companyClinical.notifications.triggerEvents.enrollmentMilestone'),
      adverse_event: lang('companyClinical.notifications.triggerEvents.adverseEvent'),
      protocol_deviation: lang('companyClinical.notifications.triggerEvents.protocolDeviation'),
      data_query: lang('companyClinical.notifications.triggerEvents.dataQuery'),
      site_activation: lang('companyClinical.notifications.triggerEvents.siteActivation'),
      ethics_expiry: lang('companyClinical.notifications.triggerEvents.ethicsExpiry'),
      custom: lang('companyClinical.notifications.triggerEvents.custom'),
    };
    return labels[event] || event;
  };

  if (isLoading) {
    return <div>{lang('companyClinical.notifications.loading')}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {rules.length === 1
            ? lang('companyClinical.notifications.ruleCountSingular')
            : lang('companyClinical.notifications.ruleCount').replace('{{count}}', String(rules.length))}
        </p>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {lang('companyClinical.notifications.addRule')}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{lang('companyClinical.notifications.headers.ruleName')}</TableHead>
            <TableHead>{lang('companyClinical.notifications.headers.triggerEvent')}</TableHead>
            <TableHead>{lang('companyClinical.notifications.headers.recipients')}</TableHead>
            <TableHead>{lang('companyClinical.notifications.headers.active')}</TableHead>
            <TableHead className="text-right">{lang('companyClinical.notifications.headers.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {lang('companyClinical.notifications.noRules')}
              </TableCell>
            </TableRow>
          ) : (
            rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    {rule.rule_name}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getTriggerEventLabel(rule.trigger_event)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {rule.notification_recipients && Array.isArray(rule.notification_recipients) ? (
                    <span>{rule.notification_recipients.length === 1
                      ? lang('companyClinical.notifications.recipientSingular')
                      : lang('companyClinical.notifications.recipients').replace('{{count}}', String(rule.notification_recipients.length))}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={(checked) => toggleActive(rule.id, checked)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(rule)}>
                      {lang('common.edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(rule.id)}
                    >
                      {lang('common.delete')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <NotificationRuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rule={selectedRule}
        companyId={companyId}
      />
    </div>
  );
}
