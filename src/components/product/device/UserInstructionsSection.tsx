import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RichTextField } from "@/components/shared/RichTextField";
import { Loader2 } from "lucide-react";
import { GovernanceBookmark } from "@/components/ui/GovernanceBookmark";
import { GovernanceEditConfirmDialog } from "@/components/ui/GovernanceEditConfirmDialog";
import { useFieldGovernance } from "@/hooks/useFieldGovernance";
import { useGovernanceGuard } from "@/hooks/useGovernanceGuard";

interface UserInstructionsSectionProps {
  userInstructions?: {
    how_to_use?: string;
    charging?: string;
    maintenance?: string;
  };
  onUserInstructionsChange?: (instructions: {
    how_to_use?: string;
    charging?: string;
    maintenance?: string;
  }) => void;
  isLoading?: boolean;
  productId?: string;
}

export function UserInstructionsSection({
  userInstructions = {},
  onUserInstructionsChange,
  isLoading = false,
  productId,
}: UserInstructionsSectionProps) {
  const { getSection } = useFieldGovernance(productId);
  const gov = getSection('user_instructions');
  const { showDialog, setShowDialog, guardEdit, confirmEdit } = useGovernanceGuard(
    productId, 'user_instructions', gov?.status
  );

  const handleInstructionChange = guardEdit((field: string, value: string) => {
    onUserInstructionsChange?.({
      ...userInstructions,
      [field]: value
    });
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
                sectionLabel="User Instructions"
              />
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="how-to-use">How to Use</Label>
            <RichTextField
              value={userInstructions.how_to_use || ''}
              onChange={(html) => handleInstructionChange('how_to_use', html)}
              placeholder="Provide step-by-step instructions on how to use the device..."
              minHeight="100px"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="charging">Charging Instructions</Label>
            <RichTextField
              value={userInstructions.charging || ''}
              onChange={(html) => handleInstructionChange('charging', html)}
              placeholder="Provide instructions for charging the device (if applicable)..."
              minHeight="80px"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="maintenance">Maintenance Instructions</Label>
            <RichTextField
              value={userInstructions.maintenance || ''}
              onChange={(html) => handleInstructionChange('maintenance', html)}
              placeholder="Provide maintenance and care instructions..."
              minHeight="80px"
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <GovernanceEditConfirmDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onConfirm={confirmEdit}
        sectionLabel="User Instructions"
        designReviewId={gov?.design_review_id}
      />
    </>
  );
}
