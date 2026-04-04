
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LIFECYCLE_PHASES } from "@/types/audit";

interface LifecyclePhaseFilterProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  phases?: string[]; // Optional prop for custom phases
}

export function LifecyclePhaseFilter({ 
  value, 
  onChange, 
  disabled = false, 
  className,
  phases // Use custom phases if provided
}: LifecyclePhaseFilterProps) {
  // Use provided phases or fall back to default LIFECYCLE_PHASES
  const phasesToUse = phases && phases.length > 0 ? phases : LIFECYCLE_PHASES;
  
  return (
    <div className={className}>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Lifecycle Phase</span>
        <Select 
          value={value} 
          onValueChange={onChange} 
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Product Phases" />
          </SelectTrigger>
          <SelectContent className="z-[100]">
            <SelectItem value="all">All Product Phases</SelectItem>
            {phasesToUse.map((phase) => (
              <SelectItem key={phase} value={phase}>
                {phase}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
