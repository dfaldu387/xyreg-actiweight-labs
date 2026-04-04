import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Circle, CheckCircle, X } from 'lucide-react';

interface GapAnalysisStatusFilterProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function GapAnalysisStatusFilter({ value, onValueChange }: GapAnalysisStatusFilterProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open':
        return <Circle className="h-3.5 w-3.5 text-blue-600" />;
      case 'Closed':
        return <CheckCircle className="h-3.5 w-3.5 text-green-600" />;
      case 'N/A':
        return <X className="h-3.5 w-3.5 text-gray-600" />;
      default:
        return null;
    }
  };

  const getDisplayValue = () => {
    if (value === 'all') return 'All Statuses';
    return value;
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Status:</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-[140px] h-8">
          <SelectValue>
            <div className="flex items-center gap-2">
              {value !== 'all' && getStatusIcon(value)}
              <span className="text-sm">{getDisplayValue()}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <span className="text-sm">All Statuses</span>
            </div>
          </SelectItem>
          <SelectItem value="Open">
            <div className="flex items-center gap-2">
              <Circle className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-sm">Open</span>
            </div>
          </SelectItem>
          <SelectItem value="Closed">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
              <span className="text-sm">Closed</span>
            </div>
          </SelectItem>
          <SelectItem value="N/A">
            <div className="flex items-center gap-2">
              <X className="h-3.5 w-3.5 text-gray-600" />
              <span className="text-sm">N/A</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}