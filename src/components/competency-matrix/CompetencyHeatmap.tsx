import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Star, Search } from 'lucide-react';
import { CompetencyArea, StaffMember, CompetencyEntry, ProficiencyLevel, PROFICIENCY_CONFIG } from './types';
import { CompetencyDetailPanel } from './CompetencyDetailPanel';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  areas: CompetencyArea[];
  staff: StaffMember[];
  entries: CompetencyEntry[];
}

function ProficiencyDot({ level }: { level: ProficiencyLevel }) {
  const config = PROFICIENCY_CONFIG[level];
  if (level === 4) {
    return <Star className="h-4 w-4 fill-amber-500 text-amber-500" />;
  }
  const sizeMap: Record<ProficiencyLevel, string> = { 0: 'h-3 w-3', 1: 'h-3.5 w-3.5', 2: 'h-3.5 w-3.5', 3: 'h-4 w-4', 4: '' };
  return <div className={`rounded-full ${sizeMap[level]} ${config.bgClass} border ${level === 0 ? 'border-muted-foreground/30' : 'border-current'} ${config.colorClass}`} />;
}

export function CompetencyHeatmap({ areas, staff, entries }: Props) {
  const [search, setSearch] = useState('');
  const [selectedCell, setSelectedCell] = useState<{ staffId: string; areaId: string } | null>(null);
  const { lang } = useTranslation();

  const filteredStaff = useMemo(() => {
    if (!search) return staff;
    const q = search.toLowerCase();
    return staff.filter(s => s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q) || s.department.toLowerCase().includes(q));
  }, [staff, search]);

  const getEntry = (staffId: string, areaId: string) =>
    entries.find(e => e.staffId === staffId && e.areaId === areaId);

  const selectedEntry = selectedCell ? getEntry(selectedCell.staffId, selectedCell.areaId) : null;
  const selectedStaff = selectedCell ? staff.find(s => s.id === selectedCell.staffId) : null;
  const selectedArea = selectedCell ? areas.find(a => a.id === selectedCell.areaId) : null;

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">{lang('training.competency.heatmap.title')}</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder={lang('training.competency.heatmap.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
            </div>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
            {([0, 1, 2, 3, 4] as ProficiencyLevel[]).map(level => (
              <span key={level} className="flex items-center gap-1.5">
                <ProficiencyDot level={level} />
                {lang(PROFICIENCY_CONFIG[level].labelKey)}
              </span>
            ))}
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <TooltipProvider delayDuration={200}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="sticky left-0 bg-muted/30 text-left px-3 py-2 font-medium text-muted-foreground min-w-[180px]">{lang('training.competency.heatmap.employee')}</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground min-w-[80px]">{lang('training.competency.heatmap.role')}</th>
                  {areas.map(area => (
                    <th key={area.id} className="text-center px-2 py-2 font-medium text-muted-foreground min-w-[70px]">
                      <Tooltip>
                        <TooltipTrigger asChild><span className="cursor-help">{area.shortName}</span></TooltipTrigger>
                        <TooltipContent><p>{area.name}</p>{area.isoReference && <p className="text-xs opacity-70">{area.isoReference}</p>}</TooltipContent>
                      </Tooltip>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map(s => (
                  <tr key={s.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="sticky left-0 bg-background px-3 py-1.5 font-medium">{s.name}</td>
                    <td className="px-3 py-1.5 text-muted-foreground text-xs">{s.role}</td>
                    {areas.map(area => {
                      const entry = getEntry(s.id, area.id);
                      const level = entry?.level ?? 0;
                      return (
                        <td key={area.id} className="text-center px-2 py-1.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="inline-flex items-center justify-center p-1 rounded hover:bg-muted/50 transition-colors"
                                onClick={() => setSelectedCell({ staffId: s.id, areaId: area.id })}
                              >
                                <ProficiencyDot level={level} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">{lang(PROFICIENCY_CONFIG[level].labelKey)}</p>
                              <p className="text-xs opacity-70">{lang('training.competency.heatmap.clickForEvidence')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </TooltipProvider>
        </CardContent>
      </Card>

      <CompetencyDetailPanel
        open={!!selectedCell}
        onOpenChange={open => { if (!open) setSelectedCell(null); }}
        entry={selectedEntry ?? null}
        staff={selectedStaff ?? null}
        area={selectedArea ?? null}
      />
    </>
  );
}
