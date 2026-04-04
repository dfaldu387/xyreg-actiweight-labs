
import React from "react";
import { PhaseRepairDashboard } from "@/components/phase/PhaseRepairDashboard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface UnmappedProductsHelperProps {
  companyId: string;
  onRepairComplete: () => void;
}

export function UnmappedProductsHelper({ companyId, onRepairComplete }: UnmappedProductsHelperProps) {
  return (
    <div className="space-y-4">
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          Products in the "Unmapped" section have phase assignments that don't match your company's configuration. 
          Use the repair tool below to automatically fix these issues.
        </AlertDescription>
      </Alert>
      
      <PhaseRepairDashboard 
        companyId={companyId} 
        onRepairComplete={onRepairComplete} 
      />
    </div>
  );
}
