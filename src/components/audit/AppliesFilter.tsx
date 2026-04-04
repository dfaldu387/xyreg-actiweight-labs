
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AppliesType = "all" | "All" | "IIa, IIb, III" | "IIb, III" | "Entire Org" | "All departments" | "Critical suppliers" | "All staff" | "All records" | "Infrastructure" | "Vigilance personnel" | "Organization" | "Quality teams";

interface AppliesFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function AppliesFilter({ value, onChange, className }: AppliesFilterProps) {
  return (
    <div className={className}>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Applies To</span>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select device class" />
          </SelectTrigger>
          <SelectContent className="z-50">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="IIa, IIb, III">Classes IIa, IIb, III</SelectItem>
            <SelectItem value="IIb, III">Classes IIb, III</SelectItem>
            <SelectItem value="Entire Org">Entire Organization</SelectItem>
            <SelectItem value="All departments">All Departments</SelectItem>
            <SelectItem value="Critical suppliers">Critical Suppliers</SelectItem>
            <SelectItem value="All staff">All Staff</SelectItem>
            <SelectItem value="All records">All Records</SelectItem>
            <SelectItem value="Infrastructure">Infrastructure</SelectItem>
            <SelectItem value="Vigilance personnel">Vigilance Personnel</SelectItem>
            <SelectItem value="Organization">Organization</SelectItem>
            <SelectItem value="Quality teams">Quality Teams</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
