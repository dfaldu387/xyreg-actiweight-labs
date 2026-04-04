import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useMinutes, useAgendaItems } from '@/hooks/useManagementReviewMeetings';
import { useTranslation } from '@/hooks/useTranslation';

interface MinuteTakerProps {
  meetingId: string;
}

export function MinuteTaker({ meetingId }: MinuteTakerProps) {
  const { minutes, isLoading, addMinute, deleteMinute } = useMinutes(meetingId);
  const { items: agendaItems } = useAgendaItems(meetingId);
  const { lang } = useTranslation();

  const [content, setContent] = useState('');
  const [agendaItemId, setAgendaItemId] = useState<string>('');
  const [decision, setDecision] = useState('');
  const [actionItem, setActionItem] = useState('');
  const [actionOwner, setActionOwner] = useState('');
  const [actionDueDate, setActionDueDate] = useState('');

  const handleAdd = async () => {
    if (!content.trim()) return;
    await addMinute(content.trim(), agendaItemId || undefined, decision || undefined, actionItem || undefined, actionOwner || undefined, actionDueDate || undefined);
    setContent(''); setDecision(''); setActionItem(''); setActionOwner(''); setActionDueDate(''); setAgendaItemId('');
  };

  const getAgendaTitle = (id: string | null) => {
    if (!id) return null;
    return agendaItems.find(a => a.id === id)?.title;
  };

  if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {minutes.map((m) => (
        <Card key={m.id}>
          <CardContent className="py-3 space-y-1">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                {m.agenda_item_id && (
                  <p className="text-xs font-medium text-primary">{getAgendaTitle(m.agenda_item_id)}</p>
                )}
                <p className="text-sm">{m.content}</p>
                {m.decision && <p className="text-sm"><span className="font-medium">{lang('managementReview.decision')}:</span> {m.decision}</p>}
                {m.action_item && (
                  <p className="text-sm">
                    <span className="font-medium">{lang('managementReview.action')}:</span> {m.action_item}
                    {m.action_owner && <span className="text-muted-foreground"> → {m.action_owner}</span>}
                    {m.action_due_date && <span className="text-muted-foreground"> ({lang('managementReview.due')} {m.action_due_date})</span>}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => deleteMinute(m.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="py-4 space-y-3">
          <div>
            <Label className="text-xs">{lang('managementReview.agendaItemOptional')}</Label>
            <Select value={agendaItemId} onValueChange={setAgendaItemId}>
              <SelectTrigger><SelectValue placeholder={lang('managementReview.selectAgendaItem')} /></SelectTrigger>
              <SelectContent>
                {agendaItems.map(a => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{lang('managementReview.discussionNotes')}</Label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder={lang('managementReview.discussionPlaceholder')} rows={2} />
          </div>
          <div>
            <Label className="text-xs">{lang('managementReview.decisionOptional')}</Label>
            <Input value={decision} onChange={e => setDecision(e.target.value)} placeholder={lang('managementReview.decisionPlaceholder')} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">{lang('managementReview.actionItem')}</Label>
              <Input value={actionItem} onChange={e => setActionItem(e.target.value)} placeholder={lang('managementReview.actionPlaceholder')} />
            </div>
            <div>
              <Label className="text-xs">{lang('managementReview.owner')}</Label>
              <Input value={actionOwner} onChange={e => setActionOwner(e.target.value)} placeholder={lang('managementReview.ownerPlaceholder')} />
            </div>
            <div>
              <Label className="text-xs">{lang('managementReview.dueDate')}</Label>
              <Input type="date" value={actionDueDate} onChange={e => setActionDueDate(e.target.value)} />
            </div>
          </div>
          <Button size="sm" onClick={handleAdd} disabled={!content.trim()}>
            <Plus className="h-4 w-4 mr-1" /> {lang('managementReview.addMinute')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
