import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GapAnalysisRecommendedTeamsFilterProps {
  value: string;
  onValueChange: (value: string) => void;
  availableTeams: string[];
}

export function GapAnalysisRecommendedTeamsFilter({ 
  value, 
  onValueChange,
  availableTeams 
}: GapAnalysisRecommendedTeamsFilterProps) {
  const getDisplayValue = () => {
    if (value === 'all') return 'All Teams';
    return value;
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Recommended Teams:</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-[180px] h-8">
          <SelectValue>
            <span className="text-sm">{getDisplayValue()}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <span className="text-sm">All Teams</span>
          </SelectItem>
          {availableTeams.map((team) => (
            <SelectItem key={team} value={team}>
              <span className="text-sm">{team}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

