import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Shield, User, Calendar } from "lucide-react";
import { toast } from "sonner";
import { GapAnalysisItem } from "@/types/client";
import { approveGapAnalysis } from "@/services/gapAnalysisApprovalService";
import { useTranslation } from "@/hooks/useTranslation";

interface AdminApprovalSectionProps {
  items: GapAnalysisItem[];
  productId?: string;
  onApprovalChange: () => void;
  disabled?: boolean;
}

export function AdminApprovalSection({
  items,
  productId,
  onApprovalChange,
  disabled = false
}: AdminApprovalSectionProps) {
  const { lang } = useTranslation();
  const [isApproving, setIsApproving] = useState(false);
  const [comments, setComments] = useState("");

  // Check if gap analysis is completed (all items are "Closed" or "N/A")
  const isCompleted = items.length > 0 && items.every(item => 
    item.status === "Closed" || item.status === "not_applicable"
  );

  // Check if already approved (any item has admin_approved = true)
  const isApproved = items.some(item => item.admin_approved === true);
  const approvedItem = items.find(item => item.admin_approved === true);

  const handleApprove = async () => {
    if (disabled) return;
    if (!productId) {
      toast.error("Product ID is required for approval");
      return;
    }

    setIsApproving(true);
    try {
      const result = await approveGapAnalysis({
        productId,
        comments: comments.trim() || undefined
      });

      if (result.success) {
        toast.success("Gap analysis approved successfully");
        onApprovalChange();
      } else {
        toast.error(result.error || "Failed to approve gap analysis");
      }
    } catch (error) {
      console.error("Error approving gap analysis:", error);
      toast.error("Failed to approve gap analysis");
    } finally {
      setIsApproving(false);
    }
  };

  // Don't show if gap analysis is not completed
  if (!isCompleted) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-primary" />
          {lang('gapAnalysis.adminApproval.title')}
          {isApproved && <CheckCircle2 className="h-5 w-5 text-green-600" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isApproved ? (
          // Show approval status
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">{lang('gapAnalysis.adminApproval.gapAnalysisApproved')}</span>
            </div>

            {approvedItem?.admin_approved_by && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{lang('gapAnalysis.adminApproval.approvedBy').replace('{{name}}', approvedItem.admin_approved_by)}</span>
              </div>
            )}

            {approvedItem?.admin_approved_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{lang('gapAnalysis.adminApproval.approvedOn').replace('{{date}}', new Date(approvedItem.admin_approved_at).toLocaleDateString())}</span>
              </div>
            )}

            {approvedItem?.admin_comments && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium mb-1">{lang('gapAnalysis.adminApproval.comments')}</p>
                <p className="text-sm text-muted-foreground">{approvedItem.admin_comments}</p>
              </div>
            )}
          </div>
        ) : (
          // Show approval form
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Checkbox
                id="admin-approve"
                checked={false}
                onCheckedChange={handleApprove}
                disabled={isApproving || disabled}
              />
              <label
                htmlFor="admin-approve"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {lang('gapAnalysis.adminApproval.approvalCheckbox')}
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{lang('gapAnalysis.adminApproval.commentsOptional')}</label>
              <Textarea
                value={comments}
                onChange={(e) => !disabled && setComments(e.target.value)}
                placeholder={lang('gapAnalysis.adminApproval.commentsPlaceholder')}
                className="min-h-[80px]"
                disabled={isApproving || disabled}
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>{lang('gapAnalysis.adminApproval.note')}</strong> {lang('gapAnalysis.adminApproval.approvalNote')}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}