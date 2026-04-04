import React from "react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";
import { TestExecution } from "@/services/vvService";
import { format } from "date-fns";

interface TestExecutionHistoryProps {
  executions: TestExecution[];
  isLoading?: boolean;
}

const statusConfig: Record<string, { icon: React.ElementType; variant: "default" | "destructive" | "outline" | "secondary"; label: string }> = {
  pass: { icon: CheckCircle2, variant: "default", label: "Pass" },
  fail: { icon: XCircle, variant: "destructive", label: "Fail" },
  blocked: { icon: AlertTriangle, variant: "outline", label: "Blocked" },
};

export function TestExecutionHistory({ executions, isLoading }: TestExecutionHistoryProps) {
  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Loading history...</p>;
  }

  if (!executions || executions.length === 0) {
    return <p className="text-xs text-muted-foreground">No executions recorded yet.</p>;
  }

  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ChevronDown className="h-3 w-3" />
        {executions.length} execution{executions.length !== 1 ? 's' : ''} recorded
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {executions.map((exec) => {
          const config = statusConfig[exec.status] || { icon: Clock, variant: "secondary" as const, label: exec.status };
          const StatusIcon = config.icon;
          return (
            <div key={exec.id} className="flex items-center justify-between text-xs border rounded px-3 py-2 bg-muted/30">
              <div className="flex items-center gap-2">
                <Badge variant={config.variant} className="gap-1 text-xs">
                  <StatusIcon className="h-3 w-3" />
                  {config.label}
                </Badge>
                <span className="text-muted-foreground">{exec.execution_id}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                {exec.software_version && <span>SW: {exec.software_version}</span>}
                <span>{format(new Date(exec.execution_date), 'yyyy-MM-dd HH:mm')}</span>
              </div>
            </div>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}
