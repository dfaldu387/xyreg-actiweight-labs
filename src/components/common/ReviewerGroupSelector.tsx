
import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ReviewerGroup {
  id: string;
  name: string;
  description?: string;
}

interface ReviewerGroupSelectorProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  reviewerGroups: ReviewerGroup[];
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  allowClear?: boolean;
  className?: string;
}

export function ReviewerGroupSelector({
  value,
  onValueChange,
  reviewerGroups = [],
  isLoading = false,
  disabled = false,
  placeholder = "Select reviewer group",
  label = "Reviewer Group",
  allowClear = false,
  className = ""
}: ReviewerGroupSelectorProps) {
  const handleValueChange = (selectedValue: string) => {
    if (selectedValue === "none") {
      onValueChange(undefined);
    } else {
      onValueChange(selectedValue);
    }
  };

  const handleClear = () => {
    onValueChange(undefined);
  };

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label>{label}</Label>
        <div className="h-10 w-full animate-pulse bg-gray-200 rounded-md" />
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Select
          value={value || "none"}
          onValueChange={handleValueChange}
          disabled={disabled}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No reviewer group</SelectItem>
            {reviewerGroups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
                {group.description && (
                  <span className="text-xs text-muted-foreground ml-2">
                    - {group.description}
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {allowClear && value && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleClear}
            disabled={disabled}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
