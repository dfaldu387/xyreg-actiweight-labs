import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MoreVertical, 
  Pencil, 
  Trash2,
  User,
  Calendar,
} from 'lucide-react';
import { 
  getRiskLevelColor, 
  LIKELIHOOD_OPTIONS, 
  IMPACT_OPTIONS,
  STATUS_OPTIONS,
} from '@/constants/highLevelRiskOptions';
import type { HighLevelRisk } from '@/hooks/useHighLevelRisks';

interface HighLevelRiskCardProps {
  risk: HighLevelRisk;
  onEdit: (risk: HighLevelRisk) => void;
  onDelete: (id: string) => void;
  onStatusChange: (params: { id: string; status: 'Open' | 'In Progress' | 'Mitigated' }) => void;
}

export function HighLevelRiskCard({
  risk,
  onEdit,
  onDelete,
  onStatusChange
}: HighLevelRiskCardProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const statusConfig = STATUS_OPTIONS.find(s => s.value === risk.status);
  const likelihoodLabel = LIKELIHOOD_OPTIONS.find(l => l.value === risk.likelihood)?.label || '';
  const impactLabel = IMPACT_OPTIONS.find(i => i.value === risk.impact)?.label || '';

  const StatusIcon = risk.status === 'Mitigated' 
    ? CheckCircle2 
    : risk.status === 'In Progress' 
      ? Clock 
      : AlertTriangle;

  const statusIconColor = risk.status === 'Mitigated' 
    ? 'text-green-500' 
    : risk.status === 'In Progress' 
      ? 'text-amber-500' 
      : 'text-red-500';

  return (
    <Card className="bg-card hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Status Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <StatusIcon className={`h-5 w-5 ${statusIconColor}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header row with badges */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge 
                variant="outline" 
                className={`text-xs font-medium ${getRiskLevelColor(risk.risk_level)}`}
              >
                {risk.risk_level}
              </Badge>
              <Badge variant="secondary" className={`text-xs ${statusConfig?.color || ''}`}>
                {risk.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Score: {risk.risk_score}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm font-medium text-foreground mb-2 line-clamp-2">
              {risk.description}
            </p>

            {/* Risk metrics */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
              <span>Likelihood: <strong>{likelihoodLabel}</strong></span>
              <span>Impact: <strong>{impactLabel}</strong></span>
            </div>

            {/* Mitigation */}
            {risk.mitigation && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mt-2">
                <span className="font-medium">Mitigation:</span> {risk.mitigation}
              </div>
            )}

            {/* Owner and Due Date */}
            {(risk.owner || risk.due_date) && (
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                {risk.owner && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {risk.owner}
                  </span>
                )}
                {risk.due_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(risk.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => {
                setDropdownOpen(false);
                setTimeout(() => onEdit(risk), 0);
              }}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => onStatusChange({ id: risk.id, status: 'Open' })}
                disabled={risk.status === 'Open'}
              >
                <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />
                Mark as Open
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onStatusChange({ id: risk.id, status: 'In Progress' })}
                disabled={risk.status === 'In Progress'}
              >
                <Clock className="h-4 w-4 mr-2 text-amber-500" />
                Mark as In Progress
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onStatusChange({ id: risk.id, status: 'Mitigated' })}
                disabled={risk.status === 'Mitigated'}
              >
                <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                Mark as Mitigated
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  setDropdownOpen(false);
                  setTimeout(() => onDelete(risk.id), 0);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
