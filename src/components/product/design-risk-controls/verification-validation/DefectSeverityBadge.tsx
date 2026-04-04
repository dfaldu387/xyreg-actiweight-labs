import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, XCircle, Clock, CheckCircle2 } from 'lucide-react';
import { DefectSeverity, DEFECT_SEVERITY_LABELS } from '@/types/defect';

interface DefectSeverityBadgeProps {
  severity: DefectSeverity;
  className?: string;
}

const severityConfig: Record<DefectSeverity, { variant: 'destructive' | 'outline' | 'secondary' | 'default'; icon: React.ReactNode }> = {
  critical: { variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" /> },
  high: { variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
  medium: { variant: 'outline', icon: <Clock className="h-3 w-3" /> },
  low: { variant: 'secondary', icon: <CheckCircle2 className="h-3 w-3" /> },
};

export function DefectSeverityBadge({ severity, className }: DefectSeverityBadgeProps) {
  const config = severityConfig[severity] || severityConfig.medium;
  return (
    <Badge variant={config.variant} className={`gap-1 ${className || ''}`}>
      {config.icon}
      {DEFECT_SEVERITY_LABELS[severity] || severity}
    </Badge>
  );
}

interface DefectStatusBadgeProps {
  status: string;
  className?: string;
}

const statusVariants: Record<string, 'secondary' | 'outline' | 'default'> = {
  open: 'secondary',
  in_progress: 'outline',
  resolved: 'default',
  closed: 'default',
};

const statusLabels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export function DefectStatusBadge({ status, className }: DefectStatusBadgeProps) {
  return (
    <Badge variant={statusVariants[status] || 'secondary'} className={className}>
      {statusLabels[status] || status}
    </Badge>
  );
}
