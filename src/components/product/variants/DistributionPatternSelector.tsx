import { BarChart3, TrendingUp, Edit3 } from "lucide-react";
import { DistributionPattern } from "@/types/variantGroup";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  value: DistributionPattern;
  onChange: (pattern: DistributionPattern) => void;
  disabled?: boolean;
}

const patterns = [
  {
    value: 'even' as const,
    label: 'Even Distribution',
    icon: BarChart3,
    description: 'Equal percentages across all variants',
  },
  {
    value: 'gaussian_curve' as const,
    label: 'Normal Distribution',
    icon: TrendingUp,
    description: 'Bell curve with peak in the middle',
  },
  {
    value: 'empirical_data' as const,
    label: 'Custom (Empirical)',
    icon: Edit3,
    description: 'Manually set individual percentages',
  },
];

export function DistributionPatternSelector({ value, onChange, disabled }: Props) {
  const selectedPattern = patterns.find(p => p.value === value);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Distribution Pattern</label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue>
            {selectedPattern && (
              <div className="flex items-center gap-2">
                <selectedPattern.icon className="h-4 w-4" />
                <span>{selectedPattern.label}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {patterns.map((pattern) => (
            <SelectItem key={pattern.value} value={pattern.value}>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <pattern.icon className="h-4 w-4" />
                  <span className="font-medium">{pattern.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {pattern.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
