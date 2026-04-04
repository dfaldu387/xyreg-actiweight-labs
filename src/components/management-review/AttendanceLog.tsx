import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useAttendees } from '@/hooks/useManagementReviewMeetings';
import { useTranslation } from '@/hooks/useTranslation';

interface AttendanceLogProps {
  meetingId: string;
}

export function AttendanceLog({ meetingId }: AttendanceLogProps) {
  const { attendees, isLoading, addAttendee, toggleAttendance, removeAttendee } = useAttendees(meetingId);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const { lang } = useTranslation();

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addAttendee(newName.trim(), newRole.trim() || undefined);
    setNewName('');
    setNewRole('');
  };

  if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-3">
      {attendees.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">{lang('managementReview.noAttendees')}</p>
      ) : (
        attendees.map((a) => (
          <Card key={a.id}>
            <CardContent className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox checked={a.attended} onCheckedChange={(v) => toggleAttendance(a.id, !!v)} />
                <div>
                  <p className="font-medium text-sm">{a.name}</p>
                  {a.role && <p className="text-xs text-muted-foreground">{a.role}</p>}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeAttendee(a.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))
      )}

      <div className="flex gap-2">
        <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder={lang('managementReview.namePlaceholder')} className="flex-1" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <Input value={newRole} onChange={e => setNewRole(e.target.value)} placeholder={lang('managementReview.roleOptional')} className="w-40" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <Button size="sm" onClick={handleAdd} disabled={!newName.trim()}><Plus className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
