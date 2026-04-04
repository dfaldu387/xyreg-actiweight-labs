
import { Progress } from "@/components/ui/progress";
import { BarChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDeviceClassLabel } from "@/utils/deviceClassUtils";

interface ProductOverviewProps {
  progress: number;
  deviceClass?: string;
}

export function ProductOverview({ progress, deviceClass }: ProductOverviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Development Progress</span>
          {deviceClass && (
            <Badge variant="outline" className="ml-2">
              {formatDeviceClassLabel(deviceClass)}
            </Badge>
          )}
        </div>
        <span className="text-sm font-semibold">{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
