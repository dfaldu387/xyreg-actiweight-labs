
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Building, Users, Shield } from "lucide-react";

interface CompanyPhaseIndicatorProps {
  companyName: string;
  isCustom?: boolean;
  variant?: "phase" | "category";
  showCompanyName?: boolean;
}

export function CompanyPhaseIndicator({
  companyName,
  isCustom = true,
  variant = "phase",
  showCompanyName = true
}: CompanyPhaseIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex items-center gap-1">
        <Building className="h-3 w-3 text-blue-600" />
        {showCompanyName && (
          <span className="text-muted-foreground">
            {companyName}
          </span>
        )}
      </div>
      
      {isCustom ? (
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          <Users className="h-3 w-3 mr-1" />
          Company {variant === "phase" ? "Phase" : "Category"}
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          <Shield className="h-3 w-3 mr-1" />
          System {variant === "phase" ? "Phase" : "Category"}
        </Badge>
      )}
    </div>
  );
}
