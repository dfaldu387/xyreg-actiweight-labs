import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, CheckCircle, Clock, AlertCircle, User, Calendar } from "lucide-react";
import type { VVPlan } from "@/services/vvService";

interface VVPlanDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: VVPlan;
}

export function VVPlanDetailDialog({ open, onOpenChange, plan }: VVPlanDetailDialogProps) {
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <Badge><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'draft':
        return <Badge variant="secondary"><FileText className="h-3 w-3 mr-1" />Draft</Badge>;
      case 'under_review':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Under Review</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const roles = plan.roles_responsibilities;
  const hasRoles = roles && typeof roles === 'object' && Object.keys(roles).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {plan.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Status & Version & Scope */}
          <div className="flex items-center gap-4 flex-wrap">
            {getStatusBadge(plan.status)}
            <span className="text-sm text-muted-foreground">Version {plan.version}</span>
            {plan.scope_type === 'product_family' && (
              <Badge variant="outline" className="gap-1 text-xs">
                Product Family
                {plan.family_identifier && ` · ${plan.family_identifier}`}
              </Badge>
            )}
          </div>

          {/* Description */}
          {plan.description && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Description</h4>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </div>
          )}

          <Separator />

          {/* Scope */}
          {plan.scope && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Scope</h4>
              <p className="text-sm text-muted-foreground">{plan.scope}</p>
            </div>
          )}

          {/* Methodology */}
          {plan.methodology && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Methodology</h4>
              <p className="text-sm text-muted-foreground">{plan.methodology}</p>
            </div>
          )}

          {/* Acceptance Criteria */}
          {plan.acceptance_criteria && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Acceptance Criteria</h4>
              <p className="text-sm text-muted-foreground">{plan.acceptance_criteria}</p>
            </div>
          )}

          {/* Roles & Responsibilities */}
          {hasRoles && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Roles & Responsibilities</h4>
                <div className="space-y-2">
                  {Object.entries(roles).map(([role, responsibility]) => (
                    <div key={role} className="flex gap-2 text-sm">
                      <User className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <span className="font-medium text-foreground">{role}:</span>{' '}
                        <span className="text-muted-foreground">{String(responsibility)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Created: {new Date(plan.created_at).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Updated: {new Date(plan.updated_at).toLocaleDateString()}
            </div>
            {plan.approved_by && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                Approved by: {plan.approved_by}
              </div>
            )}
            {plan.approved_at && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Approved: {new Date(plan.approved_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
