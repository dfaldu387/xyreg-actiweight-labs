import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useAgendaItems, AgendaItem } from '@/hooks/useManagementReviewMeetings';
import { useTranslation } from '@/hooks/useTranslation';

interface AgendaBuilderProps {
  meetingId: string;
}

export function AgendaBuilder({ meetingId }: AgendaBuilderProps) {
  const { items, isLoading, addItem, updateItem, deleteItem } = useAgendaItems(meetingId);
  const [newTitle, setNewTitle] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { lang } = useTranslation();

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await addItem(newTitle.trim(), items.length + 1);
    setNewTitle('');
  };

  if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <Card key={item.id}>
          <CardContent className="py-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm font-medium text-muted-foreground w-6 shrink-0">{idx + 1}.</span>
                <span className="font-medium truncate">{item.title}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {item.duration_minutes && <span className="text-xs text-muted-foreground">{item.duration_minutes}min</span>}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                  {expandedId === item.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteItem(item.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {expandedId === item.id && (
              <div className="pl-8 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder={lang('managementReview.presenter')} defaultValue={item.presenter || ''} onBlur={e => updateItem(item.id, { presenter: e.target.value || null })} />
                  <Input type="number" placeholder={lang('managementReview.durationMin')} defaultValue={item.duration_minutes || ''} onBlur={e => updateItem(item.id, { duration_minutes: e.target.value ? parseInt(e.target.value) : null })} />
                </div>
                <Textarea placeholder={lang('managementReview.notesPlaceholder')} defaultValue={item.notes || ''} rows={2} onBlur={e => updateItem(item.id, { notes: e.target.value || null })} />
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <div className="flex gap-2">
        <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder={lang('managementReview.addAgendaPlaceholder')} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <Button size="sm" onClick={handleAdd} disabled={!newTitle.trim()}><Plus className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
