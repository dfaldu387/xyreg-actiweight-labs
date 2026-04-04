
import { Product } from "@/types/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, ChevronRight, CheckCircle2, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { toast } from "sonner";
import { approveAudit } from "@/services/auditApprovalService";
import { useTranslation } from "@/hooks/useTranslation";

interface ProductAuditsSectionProps {
  product: Product | null | undefined;
}

export function ProductAuditsSection({ product }: ProductAuditsSectionProps) {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const { activeRole } = useCompanyRole();
  const isAdmin = activeRole === 'admin';

  const [approvingAudits, setApprovingAudits] = useState<Set<string>>(new Set());
  const [headerApprovalChecked, setHeaderApprovalChecked] = useState(false);

  if (!product) return null;

  // In a real implementation, we would get audit data from the product
  // For now, we'll create mock data based on the product ID
  const audits = product?.audits || [];

  // Create placeholder data if no audits exist
  const hasRealAudits = audits && audits.length > 0;

  // Get current date for comparisons
  const now = new Date();

  // Sort audits by date (if they have dates)
  const sortedAudits = [...audits].sort((a, b) => {
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  // Get upcoming audits (dates in the future)
  const upcomingAudits = sortedAudits.filter(audit => {
    if (!audit.date) return false;
    const auditDate = new Date(audit.date);
    return auditDate > now;
  });

  // Get completed audits (dates in the past)
  const completedAudits = sortedAudits.filter(audit => {
    if (!audit.date) return false;
    const auditDate = new Date(audit.date);
    return auditDate <= now;
  });

  // Get next upcoming audit
  const nextUpcomingAudit = upcomingAudits.length > 0 ? upcomingAudits[0] : null;

  // Get most recent completed audit
  const lastCompletedAudit = completedAudits.length > 0 ? completedAudits[0] : null;

  // Calculate audit completion percentage
  // Use completed audits vs total scheduled audits for a meaningful percentage
  const auditCompletionRate = sortedAudits.length > 0
    ? Math.round((completedAudits.length / sortedAudits.length) * 100)
    : 0;

  const handleViewAudits = () => {
    if (product?.id) {
      navigate(`/app/product/${product.id}/audits`);
    }
  };

  const handleAdminApproval = async (auditId: string, approved: boolean) => {
    if (!isAdmin) {
      toast.error(lang('productAudits.adminRequired'));
      return;
    }

    if (!approved) {
      toast.error(lang('productAudits.checkToApprove'));
      return;
    }

    setApprovingAudits(prev => new Set(prev).add(auditId));

    try {
      const result = await approveAudit({
        auditId,
        auditType: 'product' // Since this is in ProductAuditsSection, it's a product audit
      });

      if (result.success) {
        toast.success(lang('productAudits.auditApproved'));
        // Refresh the page to show updated approval status
        window.location.reload();
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Error approving audit:', error);
      toast.error(lang('productAudits.approvalFailed'));
    } finally {
      setApprovingAudits(prev => {
        const newSet = new Set(prev);
        newSet.delete(auditId);
        return newSet;
      });
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return lang('productAudits.notScheduled');
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <Card>
      <CardContent className="p-2 sm:p-3 lg:p-4">
        <div className="space-y-2 sm:space-y-3">
          {/* Updated header to match Device Information Completion format */}
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              {lang('productAudits.audits')}
              {isAdmin && (
                <div className="flex items-center gap-2" title="Admin Mode">
                  <Shield className="h-4 w-4 text-blue-600" />
                                     <Checkbox
                     checked={headerApprovalChecked}
                     onCheckedChange={(checked) => {
                       setHeaderApprovalChecked(checked as boolean);
                       if (checked) {
                         toast.success("Approved");
                       }
                     }}
                     className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                   />
                </div>
              )}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-medium">{auditCompletionRate}%</span>
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <Progress value={auditCompletionRate} className="h-2 sm:h-2.5" />
          </div>

          <div className="space-y-2 sm:space-y-3">
            {/* Next Upcoming Audit */}
            <div className="space-y-1">
              <div className="text-xs sm:text-sm font-medium">{lang('productAudits.nextAudit')}</div>
              {nextUpcomingAudit ? (
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <div className="flex items-center">
                        {nextUpcomingAudit.admin_approved ? (
                          <div className="flex items-center gap-1 text-green-600" title={lang('productAudits.approved')}>
                            <CheckCircle2 className="h-3 w-3" />
                            <span className="text-xs">{lang('productAudits.approved')}</span>
                          </div>
                        ) : (
                          <Checkbox
                            checked={false}
                            onCheckedChange={(checked) => handleAdminApproval(nextUpcomingAudit.id, checked as boolean)}
                            disabled={approvingAudits.has(nextUpcomingAudit.id)}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                        )}
                      </div>
                    )}
                    <span className="truncate">{nextUpcomingAudit.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {formatDate(nextUpcomingAudit.date || "")}
                  </Badge>
                </div>
              ) : (
                <div className="text-xs sm:text-sm text-muted-foreground">{lang('productAudits.noUpcomingAudits')}</div>
              )}
            </div>

            {/* Last Completed Audit */}
            <div className="space-y-1">
              <div className="text-xs sm:text-sm font-medium">{lang('productAudits.lastCompleted')}</div>
              {lastCompletedAudit ? (
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <div className="flex items-center">
                        {lastCompletedAudit.admin_approved ? (
                          <div className="flex items-center gap-1 text-green-600" title={lang('productAudits.approved')}>
                            <CheckCircle2 className="h-3 w-3" />
                            <span className="text-xs">{lang('productAudits.approved')}</span>
                          </div>
                        ) : (
                          <Checkbox
                            checked={false}
                            onCheckedChange={(checked) => handleAdminApproval(lastCompletedAudit.id, checked as boolean)}
                            disabled={approvingAudits.has(lastCompletedAudit.id)}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                        )}
                      </div>
                    )}
                    <span className="truncate">{lastCompletedAudit.name}</span>
                  </div>
                  <Badge className="bg-green-500 text-xs">
                    {formatDate(lastCompletedAudit.date || "")}
                  </Badge>
                </div>
              ) : (
                <div className="text-xs sm:text-sm text-muted-foreground">{lang('productAudits.noCompletedAudits')}</div>
              )}
            </div>

            {/* Timeline dots (optional) */}
            {sortedAudits.length > 0 && (
              <div className="flex justify-center gap-1 py-1">
                {sortedAudits.slice(0, 5).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${i === 0 ? "bg-primary" : "bg-gray-200"
                      }`}
                  ></div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-1">
            <Button
              variant="outline"
              className="w-full flex justify-center items-center gap-2 text-xs sm:text-sm"
              onClick={handleViewAudits}
            >
              <span>{lang('productAudits.viewAllAudits')}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
