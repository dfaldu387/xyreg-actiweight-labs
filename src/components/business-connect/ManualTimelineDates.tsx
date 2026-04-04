import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ISO_13485_PHASES } from "@/data/iso13485Phases";
import { Sparkles } from "lucide-react";

export interface PhaseDateEntry {
  phaseId: string;
  startDate: string;
  endDate: string;
}

interface ManualTimelineDatesProps {
  phaseDates: PhaseDateEntry[];
  onChange: (dates: PhaseDateEntry[]) => void;
}

export function ManualTimelineDates({ phaseDates, onChange }: ManualTimelineDatesProps) {
  const handleDateChange = (phaseId: string, field: 'startDate' | 'endDate', value: string) => {
    const existingIndex = phaseDates.findIndex(pd => pd.phaseId === phaseId);
    
    if (existingIndex >= 0) {
      const updated = [...phaseDates];
      updated[existingIndex] = { ...updated[existingIndex], [field]: value };
      onChange(updated);
    } else {
      onChange([...phaseDates, { phaseId, startDate: '', endDate: '', [field]: value }]);
    }
  };

  const getPhaseDate = (phaseId: string): PhaseDateEntry => {
    return phaseDates.find(pd => pd.phaseId === phaseId) || { phaseId, startDate: '', endDate: '' };
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base">Timeline Dates</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Set expected dates for each development phase
        </p>
        <div className="bg-primary/5 border border-primary/20 rounded-md p-3 mt-2">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-primary">
              <span className="font-medium">Unlock Advanced Analysis</span> to auto-sync timeline dates from your project Milestones.
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {ISO_13485_PHASES.map((phase) => {
          const phaseData = getPhaseDate(phase.id);
          return (
            <div key={phase.id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{phase.name}</p>
                <p className="text-xs text-muted-foreground">{phase.isoReference}</p>
              </div>
              <div>
                <Input
                  type="date"
                  value={phaseData.startDate}
                  onChange={(e) => handleDateChange(phase.id, 'startDate', e.target.value)}
                  className="w-36 text-sm"
                  placeholder="Start"
                />
              </div>
              <div>
                <Input
                  type="date"
                  value={phaseData.endDate}
                  onChange={(e) => handleDateChange(phase.id, 'endDate', e.target.value)}
                  className="w-36 text-sm"
                  placeholder="End"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
