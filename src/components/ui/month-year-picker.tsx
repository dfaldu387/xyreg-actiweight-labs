import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface MonthYearPickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  fromYear?: number;
  toYear?: number;
  disabled?: boolean;
}

export function MonthYearPicker({ 
  date, 
  setDate,
  placeholder = "Select month/year",
  fromYear = new Date().getFullYear() - 10,
  toYear = new Date().getFullYear() + 10,
  disabled = false
}: MonthYearPickerProps) {
  const [selectedMonth, setSelectedMonth] = React.useState<string>(
    date ? date.getMonth().toString() : ""
  );
  const [selectedYear, setSelectedYear] = React.useState<string>(
    date ? date.getFullYear().toString() : ""
  );

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from(
    { length: toYear - fromYear + 1 }, 
    (_, i) => fromYear + i
  );

  const handleMonthYearChange = () => {
    if (selectedMonth !== "" && selectedYear !== "") {
      const newDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 1);
      setDate(newDate);
    }
  };

  React.useEffect(() => {
    handleMonthYearChange();
  }, [selectedMonth, selectedYear]);

  const clearDate = () => {
    setSelectedMonth("");
    setSelectedYear("");
    setDate(undefined);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[180px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "MMM yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-3" 
        side="bottom" 
        align="start"
        sideOffset={4}
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Month</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Year</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {date && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearDate}
              className="w-full text-xs"
            >
              Clear Date
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}