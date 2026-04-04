import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarCheck, ClipboardList, Users } from 'lucide-react';

export function MeetingEnginePlaceholder() {
  const features = [
    { icon: ClipboardList, title: 'Agenda Builder', description: 'Auto-generate agendas from Live Pulse data with customizable sections per ISO 13485 §5.6.2 inputs.' },
    { icon: Users, title: 'Attendance Log', description: 'Record attendees, roles, and quorum validation for regulatory traceability.' },
    { icon: CalendarCheck, title: 'Minute Taker', description: 'Structured minutes with decisions, action items, and due dates linked to QMS records.' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {features.map((f) => (
        <Card key={f.title}>
          <CardContent className="pt-6 text-center space-y-3">
            <f.icon className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <h4 className="font-semibold">{f.title}</h4>
            <p className="text-sm text-muted-foreground">{f.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
