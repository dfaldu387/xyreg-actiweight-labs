import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Building, Settings, FileText } from 'lucide-react';

interface CompanyDataSourceIndicatorProps {
  dataType: string;
  className?: string;
}

export function CompanyDataSourceIndicator({ dataType, className = "" }: CompanyDataSourceIndicatorProps) {
  const getSourceInfo = (type: string) => {
    switch (type) {
      case 'retention_periods':
      case 'edm_system':
      case 'document_numbering':
        return {
          icon: <Building className="w-3 h-3" />,
          label: 'Company Settings',
          variant: 'secondary' as const,
          description: 'Managed in Company Settings'
        };
      case 'head_of_qa':
        return {
          icon: <Settings className="w-3 h-3" />,
          label: 'Manual Entry',
          variant: 'outline' as const,
          description: 'Requires manual configuration'
        };
      case 'department_structure':
        return {
          icon: <Building className="w-3 h-3" />,
          label: 'Role Management',
          variant: 'secondary' as const,
          description: 'Managed in Company Settings with smart role selection'
        };
      default:
        return {
          icon: <FileText className="w-3 h-3" />,
          label: 'Document Data',
          variant: 'outline' as const,
          description: 'Document-specific information'
        };
    }
  };

  const sourceInfo = getSourceInfo(dataType);

  return (
    <Badge 
      variant={sourceInfo.variant} 
      className={`text-xs flex items-center gap-1 ${className}`}
      title={sourceInfo.description}
    >
      {sourceInfo.icon}
      {sourceInfo.label}
    </Badge>
  );
}