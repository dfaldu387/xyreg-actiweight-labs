import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, FileText, Shield } from 'lucide-react';
import { EscalationResult } from '@/services/pmsEscalationService';
import { useNavigate } from 'react-router-dom';

interface PMSEscalationResultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: EscalationResult | null;
  linkedRequirements?: string[];
  linkedHazards?: string[];
}

export function PMSEscalationResult({
  open,
  onOpenChange,
  result,
  linkedRequirements = [],
  linkedHazards = [],
}: PMSEscalationResultProps) {
  const navigate = useNavigate();

  if (!result) return null;

  const tierConfig = {
    hard: {
      icon: <AlertTriangle className="h-5 w-5 text-destructive" />,
      label: 'Hard Escalation',
      variant: 'destructive' as const,
      color: 'text-destructive',
    },
    soft: {
      icon: <Shield className="h-5 w-5 text-yellow-500" />,
      label: 'Soft Escalation',
      variant: 'secondary' as const,
      color: 'text-yellow-600',
    },
    none: {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      label: 'No Escalation',
      variant: 'outline' as const,
      color: 'text-green-600',
    },
  };

  const config = tierConfig[result.tier];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {config.icon}
            PMS Event Escalation Result
          </DialogTitle>
          <DialogDescription>{result.message}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tier:</span>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>

          {result.capaDisplayId && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">CAPA: {result.capaDisplayId}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  navigate('/app/capa');
                }}
              >
                View
              </Button>
            </div>
          )}

          {result.ccrDisplayId && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">CCR: {result.ccrDisplayId}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  navigate('/app/change-control');
                }}
              >
                View
              </Button>
            </div>
          )}

          {(linkedRequirements.length > 0 || linkedHazards.length > 0) && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Linked Design Objects</span>
              <div className="flex flex-wrap gap-1">
                {linkedRequirements.map((id) => (
                  <Badge key={id} variant="outline" className="text-xs">{id}</Badge>
                ))}
                {linkedHazards.map((id) => (
                  <Badge key={id} variant="outline" className="text-xs">{id}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
