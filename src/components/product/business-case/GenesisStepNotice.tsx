import { Info } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface GenesisStepNoticeProps {
  stepNumber: number | number[];
  stepName?: string;
  className?: string;
}

/**
 * Shows which Genesis step(s) a business case section's data originates from.
 * Hidden in investor view (detected via URL or context).
 */
export function GenesisStepNotice({ stepNumber, stepName, className }: GenesisStepNoticeProps) {
  const { lang } = useTranslation();
  
  // Format step numbers for display
  const steps = Array.isArray(stepNumber) ? stepNumber : [stepNumber];
  const stepText = steps.length === 1 
    ? `Step ${steps[0]}`
    : `Steps ${steps.join(', ')}`;
  
  return (
    <></>
    // <div 
    //   className={cn(
    //     "flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md border border-dashed border-muted-foreground/30",
    //     className
    //   )}
    //   data-testid="genesis-step-notice"
    // >
    //   <Info className="h-3.5 w-3.5 flex-shrink-0" />
    //   <span>
    //     <span className="font-medium">{stepText}</span>
    //     {stepName && <span className="text-muted-foreground"> — {stepName}</span>}
    //   </span>
    // </div>
  );
}
