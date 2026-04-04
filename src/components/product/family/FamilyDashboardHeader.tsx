import React from 'react';
import { Building2 } from 'lucide-react';

interface FamilyDashboardHeaderProps {
  familyName: string;
  variantCount: number;
  primaryClass: string;
  lifecycleStatus: string;
}

export function FamilyDashboardHeader({ 
  familyName, 
  variantCount, 
  primaryClass, 
  lifecycleStatus 
}: FamilyDashboardHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <Building2 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Device Family: {familyName}</h1>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="font-medium">{variantCount} Variants Total</span>
        <span className="text-muted-foreground">•</span>
        <span>Primary Class: <span className="font-medium text-foreground">{primaryClass}</span></span>
        <span className="text-muted-foreground">•</span>
        <span>Lifecycle: <span className="font-medium text-foreground">{lifecycleStatus}</span></span>
      </div>
    </div>
  );
}
