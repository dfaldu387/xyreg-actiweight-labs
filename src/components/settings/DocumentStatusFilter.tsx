
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Document status options - updated to match DocumentFilters
const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "Open", label: "Open" },
  { value: "Closed", label: "Closed" },
  { value: "N/A", label: "N/A" }
];

interface DocumentStatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DocumentStatusFilter({
  value,
  onChange,
  className
}: DocumentStatusFilterProps) {
  return (
    <div className={className}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status-filter">Status</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id="status-filter" className="h-10">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
