import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ClipboardList, Users, FileText, Trash2 } from 'lucide-react';
import { Meeting } from '@/hooks/useManagementReviewMeetings';
import { AgendaBuilder } from './AgendaBuilder';
import { AttendanceLog } from './AttendanceLog';
import { MinuteTaker } from './MinuteTaker';
import { formatDate } from '@/lib/date';
import { useTranslation } from '@/hooks/useTranslation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface MeetingDetailProps {
  meeting: Meeting;
  onBack: () => void;
  onUpdate: (updates: Partial<Pick<Meeting, 'title' | 'meeting_date' | 'status' | 'location'>>) => Promise<void>;
  onDelete: () => Promise<void>;
}

const STATUSES = ['draft', 'scheduled', 'in_progress', 'completed'];

export function MeetingDetail({ meeting, onBack, onUpdate, onDelete }: MeetingDetailProps) {
  const { lang } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h3 className="text-lg font-semibold">{meeting.title}</h3>
            <p className="text-sm text-muted-foreground">{formatDate(meeting.meeting_date)}{meeting.location ? ` · ${meeting.location}` : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={meeting.status} onValueChange={(v) => onUpdate({ status: v })}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{lang('managementReview.deleteMeetingTitle')}</AlertDialogTitle>
                <AlertDialogDescription>{lang('managementReview.deleteMeetingDescription')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{lang('managementReview.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>{lang('managementReview.delete')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="agenda" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="agenda" className="flex items-center gap-1.5"><ClipboardList className="h-4 w-4" />{lang('managementReview.agenda')}</TabsTrigger>
          <TabsTrigger value="attendees" className="flex items-center gap-1.5"><Users className="h-4 w-4" />{lang('managementReview.attendees')}</TabsTrigger>
          <TabsTrigger value="minutes" className="flex items-center gap-1.5"><FileText className="h-4 w-4" />{lang('managementReview.minutes')}</TabsTrigger>
        </TabsList>
        <TabsContent value="agenda" className="mt-4"><AgendaBuilder meetingId={meeting.id} /></TabsContent>
        <TabsContent value="attendees" className="mt-4"><AttendanceLog meetingId={meeting.id} /></TabsContent>
        <TabsContent value="minutes" className="mt-4"><MinuteTaker meetingId={meeting.id} /></TabsContent>
      </Tabs>
    </div>
  );
}
