import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { GovernanceBookmark } from "@/components/ui/GovernanceBookmark";
import { GovernanceEditConfirmDialog } from "@/components/ui/GovernanceEditConfirmDialog";
import { useFieldGovernance } from "@/hooks/useFieldGovernance";
import { useGovernanceGuard } from "@/hooks/useGovernanceGuard";

interface DeviceSummarySectionProps {
  deviceSummary?: string;
  onDeviceSummaryChange?: (value: string) => void;
  isLoading?: boolean;
  productId?: string;
}

export function DeviceSummarySection({
  deviceSummary = '',
  onDeviceSummaryChange,
  isLoading = false,
  productId,
}: DeviceSummarySectionProps) {
  const { getSection } = useFieldGovernance(productId);
  const gov = getSection('device_summary');
  const { showDialog, setShowDialog, guardEdit, confirmEdit } = useGovernanceGuard(
    productId, 'device_summary', gov?.status
  );

  const handleChange = guardEdit((value: string) => {
    onDeviceSummaryChange?.(value);
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <span />
            <div className="flex items-center gap-1">
              <GovernanceBookmark
                status={gov?.status}
                designReviewId={gov?.design_review_id}
                verdictComment={gov?.verdict_comment}
                approvedAt={gov?.approved_at}
                productId={productId}
                sectionLabel="Executive Summary"
              />
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="device-summary">Executive Summary</Label>
            <Textarea
              id="device-summary"
              value={deviceSummary}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Provide a comprehensive summary of the device, including its purpose, key features, intended use, target users, and expected benefits..."
              className="mt-2 min-h-[150px]"
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground mt-2">
              This summary should provide a complete overview of your medical device that can be used for regulatory submissions and stakeholder communications.
            </p>
          </div>
        </CardContent>
      </Card>

      <GovernanceEditConfirmDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onConfirm={confirmEdit}
        sectionLabel="Executive Summary"
        designReviewId={gov?.design_review_id}
      />
    </>
  );
}
