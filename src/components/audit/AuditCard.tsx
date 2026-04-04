import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, Clock, MoreVertical, Edit, Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { ProductAudit, CompanyAudit } from "@/types/audit";

interface AuditCardProps {
  audit: ProductAudit | CompanyAudit;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function AuditCard({ audit, onEdit, onDelete }: AuditCardProps) {
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
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1 line-clamp-2">
              {audit.audit_name}
            </h3>
            <Badge variant="outline" className="text-xs">
              {audit.audit_type}
            </Badge>
          </div>
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit} className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="gap-2 text-red-600">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge className={`text-xs ${getStatusColor(audit.status)}`}>
              {audit.status.replace('_', ' ')}
            </Badge>
            {urgencyInfo && (
              <div className={`flex items-center gap-1 ${urgencyInfo.color}`}>
                <urgencyInfo.icon className="h-3 w-3" />
                <span className="text-xs">{urgencyInfo.text}</span>
              </div>
            )}
          </div>

          {audit.deadline_date && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Due: {format(new Date(audit.deadline_date), 'MMM dd, yyyy')}</span>
            </div>
          )}

          {'lifecycle_phase' in audit && audit.lifecycle_phase && (
            <div className="text-xs text-muted-foreground">
              Phase: {audit.lifecycle_phase}
            </div>
          )}

          {audit.admin_approved && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-3 w-3" />
              <span className="text-xs">Admin Approved</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}