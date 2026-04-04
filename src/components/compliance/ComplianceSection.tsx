import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { DocumentScopeManager } from "@/components/documents/DocumentScopeManager";

interface ComplianceSectionProps {
  companyId: string;
  companyName?: string;
  disabled?: boolean;
}

export function ComplianceSection({ companyId, disabled = false }: ComplianceSectionProps) {

  return (
    <Card>
      {/* <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Compliance Management
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Access compliance tools and manage regulatory requirements
        </p>
      </CardHeader> */}
      <CardContent>
        <DocumentScopeManager
          companyId={companyId}
          scope="company"
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
}