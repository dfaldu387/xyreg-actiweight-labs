
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useCompanyId } from "@/hooks/useCompanyId";
import { AdvancedDocumentManager } from "./AdvancedDocumentManager";

export function DocumentControlSettings() {
  const companyId = useCompanyId();

  if (!companyId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">Loading company data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <AdvancedDocumentManager companyId={companyId} onDocumentUpdated={() => {}} />
    </div>
  );
}
