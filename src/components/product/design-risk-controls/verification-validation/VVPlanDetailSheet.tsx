import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, CheckCircle, Clock, User, Calendar, FileEdit, Pencil } from "lucide-react";
import type { VVPlan } from "@/services/vvService";
import { SaveContentAsDocCIDialog } from "@/components/shared/SaveContentAsDocCIDialog";
import { VVPlanStudioBridgeService } from "@/services/vvPlanStudioBridgeService";
import { toast } from "sonner";

interface VVPlanDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: VVPlan;
  productId?: string;
  companyId?: string;
  companyName?: string;
  onEdit?: (plan: VVPlan) => void;
}

function generateVVPlanHtml(plan: VVPlan): string {
  let html = `<h1>${plan.name} v${plan.version}</h1>`;

  if (plan.description) {
    html += `<p>${plan.description}</p>`;
  }

  if (plan.scope) {
    html += `<h2>1. Scope &amp; Boundaries</h2><p>${plan.scope}</p>`;
  }

  if (plan.methodology) {
    html += `<h2>2. Methodology</h2><p>${plan.methodology}</p>`;
  }

  if (plan.acceptance_criteria) {
    html += `<h2>3. Acceptance Criteria</h2><p>${plan.acceptance_criteria}</p>`;
  }

  const roles = plan.roles_responsibilities;
  const hasRoles = roles && typeof roles === 'object' && (Array.isArray(roles) ? roles.length > 0 : Object.keys(roles).length > 0);
  if (hasRoles) {
    html += `<h2>4. Roles &amp; Responsibilities</h2><table><thead><tr><th>Role</th><th>Responsibility</th></tr></thead><tbody>`;
    if (Array.isArray(roles)) {
      (roles as Array<{ role: string; responsibility: string }>).forEach((r) => {
        html += `<tr><td>${r.role}</td><td>${r.responsibility}</td></tr>`;
      });
    } else {
      Object.entries(roles).forEach(([role, responsibility]) => {
        html += `<tr><td>${role}</td><td>${String(responsibility)}</td></tr>`;
      });
    }
    html += `</tbody></table>`;
  }

  return html;
}

export function VVPlanDetailSheet({ open, onOpenChange, plan, productId, companyId, companyName, onEdit }: VVPlanDetailSheetProps) {
  const navigate = useNavigate();
  const [showCIDialog, setShowCIDialog] = useState(false);

  const handleOpenInStudio = async () => {
    if (!companyName || !companyId) return;
    try {
      await VVPlanStudioBridgeService.upsertTemplate(plan, companyId, productId);
      onOpenChange(false);
      const encodedCompanyName = encodeURIComponent(companyName);
      navigate(`/app/company/${encodedCompanyName}/document-studio?templateId=VV-PLAN-${plan.id}${productId ? `&productId=${productId}` : ''}`);
    } catch (error) {
      console.error('Error opening in studio:', error);
      toast.error('Failed to open in Document Studio');
    }
  };

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
  const hasRoles = roles && typeof roles === 'object' && (Array.isArray(roles) ? roles.length > 0 : Object.keys(roles).length > 0);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="sm:max-w-2xl w-full p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {plan.name}
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-5 pb-4">
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
                      {Array.isArray(roles)
                        ? (roles as Array<{ role: string; responsibility: string }>).map((r, i) => (
                            <div key={i} className="flex gap-2 text-sm">
                              <User className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                              <div>
                                <span className="font-medium text-foreground">{r.role}:</span>{' '}
                                <span className="text-muted-foreground">{r.responsibility}</span>
                              </div>
                            </div>
                          ))
                        : Object.entries(roles).map(([role, responsibility]) => (
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
          </ScrollArea>

          {/* Pinned footer */}
          <div className="flex justify-between gap-2 px-6 py-4 border-t">
            <div className="flex gap-2">
              {companyName && (
                <Button variant="default" size="sm" onClick={handleOpenInStudio}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Plan
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {companyId && companyName && (
                <Button variant="outline" size="sm" onClick={() => setShowCIDialog(true)}>
                  <FileEdit className="h-4 w-4 mr-2" />
                  Send to CI
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {companyId && companyName && (
        <SaveContentAsDocCIDialog
          open={showCIDialog}
          onOpenChange={setShowCIDialog}
          title={`V&V Plan: ${plan.name}`}
          htmlContent={generateVVPlanHtml(plan)}
          templateIdKey={`VV-PLAN-${plan.id}`}
          companyId={companyId}
          companyName={companyName}
          productId={productId}
          defaultScope="device"
        />
      )}
    </>
  );
}
