import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { CompetencyEntry, StaffMember, CompetencyArea, PROFICIENCY_CONFIG } from './types';
import { FileText, GraduationCap, ClipboardCheck, Briefcase } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: CompetencyEntry | null;
  staff: StaffMember | null;
  area: CompetencyArea | null;
}

const iconMap = {
  certificate: FileText,
  training: GraduationCap,
  assessment: ClipboardCheck,
  experience: Briefcase,
};

export function CompetencyDetailPanel({ open, onOpenChange, entry, staff, area }: Props) {
  const { lang } = useTranslation();
  if (!entry || !staff || !area) return null;
  const config = PROFICIENCY_CONFIG[entry.level];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">{staff.name} — {area.name}</SheetTitle>
          <SheetDescription>{lang('training.competency.detailPanel.description')}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Proficiency */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">{lang('training.competency.detailPanel.proficiency')}</span>
            <Badge variant="outline" className={`${config.bgClass} ${config.colorClass} border-0`}>
              {lang('training.competency.detailPanel.levelLabel', { level: String(entry.level), name: lang(config.labelKey) })}
            </Badge>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{lang('training.competency.detailPanel.lastAssessed')}</p>
              <p className="font-medium">{new Date(entry.lastAssessed).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{lang('training.competency.detailPanel.isoReference')}</p>
              <p className="font-medium">{area.isoReference || '—'}</p>
            </div>
          </div>

          {/* Evidence */}
          <div>
            <h4 className="text-sm font-semibold mb-3">{lang('training.competency.detailPanel.evidenceRecords')}</h4>
            {entry.evidence.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">{lang('training.competency.detailPanel.noEvidence')}</p>
            ) : (
              <div className="space-y-3">
                {entry.evidence.map(ev => {
                  const Icon = iconMap[ev.type] || FileText;
                  return (
                    <div key={ev.id} className="flex items-start gap-3 rounded-md border p-3">
                      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">{ev.type} · {new Date(ev.date).toLocaleDateString()}</p>
                        {ev.details && <p className="text-xs text-muted-foreground mt-1">{ev.details}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Certifications from staff profile */}
          {staff.certifications.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3">{lang('training.competency.detailPanel.staffCertifications')}</h4>
              <div className="space-y-2">
                {staff.certifications.map(cert => (
                  <div key={cert.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="text-sm font-medium">{cert.name}</p>
                      <p className="text-xs text-muted-foreground">{cert.issuedBy}</p>
                    </div>
                    <Badge variant={cert.status === 'valid' ? 'default' : cert.status === 'expiring' ? 'secondary' : 'destructive'} className="text-xs">
                      {cert.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
