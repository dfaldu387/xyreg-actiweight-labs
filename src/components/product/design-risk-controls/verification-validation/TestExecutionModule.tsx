import React from "react";
import { TestExecutionDashboard } from "./TestExecutionDashboard";

interface TestExecutionModuleProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function TestExecutionModule({ productId, companyId, disabled = false }: TestExecutionModuleProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Test Execution</h3>
        <p className="text-sm text-muted-foreground">
          Execute test cases, record results, and capture regulatory evidence for IEC 62304, ISO 13485, and IEC 62366-1 compliance.
        </p>
      </div>
      <TestExecutionDashboard productId={productId} companyId={companyId} disabled={disabled} />
    </div>
  );
}
