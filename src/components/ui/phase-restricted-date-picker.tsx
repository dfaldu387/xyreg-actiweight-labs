
import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface PhaseRestrictedDatePickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  phaseStartDate?: Date;
  phaseEndDate?: Date;
  phaseName?: string;
  disabled?: boolean;
}

export function PhaseRestrictedDatePicker({ 
  date, 
  setDate,
  placeholder = "Select date",
  phaseStartDate,
  phaseEndDate,
  phaseName,
  disabled = false
}: PhaseRestrictedDatePickerProps) {
  const [showWarning, setShowWarning] = React.useState(false);
  const [warningMessage, setWarningMessage] = React.useState("");

  // Check if date is within phase timeline
  const isDateInPhaseTimeline = (selectedDate: Date) => {
    if (!phaseStartDate || !phaseEndDate) return true; // No restrictions if timeline not set
    return selectedDate >= phaseStartDate && selectedDate <= phaseEndDate;
  };

  // Format phase timeline for display
  const getPhaseTimelineText = () => {
    if (!phaseStartDate || !phaseEndDate) {
      return "Phase timeline not set - please define phase timeline";
    }
    return `Phase Timeline: ${format(phaseStartDate, "d MMM")} - ${format(phaseEndDate, "d MMM")}`;
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setDate(undefined);
      setShowWarning(false);
      return;
    }

    setDate(selectedDate);

    // Check if date is within phase timeline
    if (phaseStartDate && phaseEndDate && !isDateInPhaseTimeline(selectedDate)) {
      setShowWarning(true);
      setWarningMessage(
        `Warning: This date is outside the ${phaseName || 'phase'} timeline (${format(phaseStartDate, "d MMM")} - ${format(phaseEndDate, "d MMM")}). Consider selecting a date within the phase timeline.`
      );
    } else {
      setShowWarning(false);
      setWarningMessage("");
    }
  };

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 max-h-96 overflow-y-auto" 
          side="bottom" 
          align="start"
          sideOffset={4}
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      
      {showWarning && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            {warningMessage}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
