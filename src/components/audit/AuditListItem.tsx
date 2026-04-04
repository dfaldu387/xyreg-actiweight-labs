import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, MoreVertical, Edit, Trash2, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { ProductAudit, CompanyAudit } from "@/types/audit";

interface AuditListItemProps {
  audit: ProductAudit | CompanyAudit;
  onEdit?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
}

export function AuditListItem({ audit, onEdit, onDelete, disabled = false }: AuditListItemProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
      case 'in progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planned':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyInfo = () => {
    if (!audit.deadline_date) return null;
    
    const deadline = new Date(audit.deadline_date);
    const now = new Date();
    const oneWeekFromNow = addDays(now, 7);

    if (isBefore(deadline, now)) {
      return { icon: AlertTriangle, text: 'Overdue', color: 'text-red-500' };
    } else if (isBefore(deadline, oneWeekFromNow)) {
      return { icon: Clock, text: 'Due Soon', color: 'text-orange-500' };
    }
    return null;
  };

  const urgencyInfo = getUrgencyInfo();

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-background/55 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Status Badge */}
        <Badge className={`text-xs ${getStatusColor(audit.status)} flex-shrink-0`}>
          {audit.status.replace('_', ' ')}
        </Badge>

        {/* Audit Name and Type */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {audit.audit_name}
          </div>
          <div className="text-xs text-muted-foreground">
            {audit.audit_type}
          </div>
        </div>

        {/* Phase Information (for product audits) */}
        {'lifecycle_phase' in audit && audit.lifecycle_phase && (
          <div className="flex-shrink-0">
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              Phase: {audit.lifecycle_phase}
            </Badge>
          </div>
        )}

        {/* Date Information */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
          {audit.start_date && audit.end_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(audit.start_date), 'MMM dd')} - {format(new Date(audit.end_date), 'MMM dd, yyyy')}</span>
            </div>
          )}
          {audit.deadline_date && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Due: {format(new Date(audit.deadline_date), 'MMM dd, yyyy')}</span>
            </div>
          )}
        </div>

        {/* Urgency Indicator */}
        {urgencyInfo && (
          <div className={`flex items-center gap-1 ${urgencyInfo.color} flex-shrink-0`}>
            <urgencyInfo.icon className="h-3 w-3" />
            <span className="text-xs">{urgencyInfo.text}</span>
          </div>
        )}

        {/* Admin Approval */}
        {audit.admin_approved && (
          <div className="flex items-center gap-1 text-green-600 flex-shrink-0">
            <CheckCircle className="h-3 w-3" />
            <span className="text-xs">Approved</span>
          </div>
        )}
      </div>

      {/* Actions Menu */}
      {(onEdit || onDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0" disabled={disabled}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={onEdit} className="gap-2" disabled={disabled}>
                <Edit className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem onClick={onDelete} className="gap-2 text-red-600" disabled={disabled}>
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}