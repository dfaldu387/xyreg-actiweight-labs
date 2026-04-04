import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Calendar, MapPin, Loader2 } from 'lucide-react';
import { useManagementReviewMeetings, Meeting } from '@/hooks/useManagementReviewMeetings';
import { MeetingDetail } from './MeetingDetail';
import { formatDate } from '@/lib/date';
import { useTranslation } from '@/hooks/useTranslation';

interface MeetingEngineProps {
  companyId: string | undefined;
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export function MeetingEngine({ companyId }: MeetingEngineProps) {
  const { meetings, isLoading, createMeeting, updateMeeting, deleteMeeting } = useManagementReviewMeetings(companyId);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [creating, setCreating] = useState(false);
  const { lang } = useTranslation();

  const handleCreate = async () => {
    if (!newTitle || !newDate) return;
    setCreating(true);
    const meeting = await createMeeting(newTitle, new Date(newDate).toISOString(), newLocation);
    setCreating(false);
    if (meeting) {
      setShowCreate(false);
      setNewTitle('');
      setNewDate('');
      setNewLocation('');
      setSelectedMeeting(meeting);
    }
  };

  if (selectedMeeting) {
    return (
      <MeetingDetail
        meeting={selectedMeeting}
        onBack={() => setSelectedMeeting(null)}
        onUpdate={async (updates) => {
          const ok = await updateMeeting(selectedMeeting.id, updates);
          if (ok) setSelectedMeeting({ ...selectedMeeting, ...updates });
        }}
        onDelete={async () => {
          await deleteMeeting(selectedMeeting.id);
          setSelectedMeeting(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{lang('managementReview.reviewMeetings')}</h3>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> {lang('managementReview.newMeeting')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : meetings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {lang('managementReview.noMeetings')}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {meetings.map((m) => (
            <Card key={m.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedMeeting(m)}>
              <CardContent className="py-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{m.title}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(m.meeting_date)}</span>
                    {m.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{m.location}</span>}
                  </div>
                </div>
                <Badge className={statusColors[m.status] || ''} variant="secondary">
                  {m.status.replace('_', ' ')}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>{lang('managementReview.newMeetingTitle')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{lang('managementReview.meetingTitleLabel')}</Label><Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder={lang('managementReview.meetingTitlePlaceholder')} /></div>
            <div><Label>{lang('managementReview.dateLabel')}</Label><Input type="datetime-local" value={newDate} onChange={e => setNewDate(e.target.value)} /></div>
            <div><Label>{lang('managementReview.locationOptional')}</Label><Input value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder={lang('managementReview.locationPlaceholder')} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{lang('managementReview.cancel')}</Button>
            <Button onClick={handleCreate} disabled={!newTitle || !newDate || creating}>
              {creating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} {lang('managementReview.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
