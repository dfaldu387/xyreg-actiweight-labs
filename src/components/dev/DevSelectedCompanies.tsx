
import React from 'react';
import { useDevMode } from '@/context/DevModeContext';
import { Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function DevSelectedCompanies() {
  const { isDevMode, selectedCompanies } = useDevMode();
  
  // Only show this component in DevMode with multiple companies selected
  if (!isDevMode || process.env.NODE_ENV === 'production' || !selectedCompanies || selectedCompanies.length <= 1) {
    return null;
  }
  
  const companyCount = selectedCompanies.length;
  const companyNames = selectedCompanies.map(company => company.name);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="flex items-center gap-1 cursor-help">
            <Building className="h-3 w-3" />
            <span>{companyCount} Companies Selected</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <div className="py-1">
            <h4 className="text-sm font-medium mb-1">Selected Companies:</h4>
            <ul className="text-xs list-disc pl-4">
              {companyNames.map(name => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
