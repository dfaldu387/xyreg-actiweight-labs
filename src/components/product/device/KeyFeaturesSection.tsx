import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GovernanceBookmark } from "@/components/ui/GovernanceBookmark";
import { GovernanceEditConfirmDialog } from "@/components/ui/GovernanceEditConfirmDialog";
import { useFieldGovernance } from "@/hooks/useFieldGovernance";
import { useGovernanceGuard } from "@/hooks/useGovernanceGuard";

interface KeyFeaturesSectionProps {
  keyFeatures: string[];
  onKeyFeaturesChange: (features: string[]) => void;
  isLoading?: boolean;
  productId?: string;
}

export function KeyFeaturesSection({
  keyFeatures,
  onKeyFeaturesChange,
  isLoading = false,
  productId,
}: KeyFeaturesSectionProps) {
  const [newFeature, setNewFeature] = useState('');

  const { getSection } = useFieldGovernance(productId);
  const gov = getSection('key_features');
  const { showDialog, setShowDialog, guardEdit, confirmEdit } = useGovernanceGuard(
    productId, 'key_features', gov?.status
  );

  const handleAddFeature = guardEdit(() => {
    if (newFeature.trim() && !keyFeatures.includes(newFeature.trim())) {
      onKeyFeaturesChange([...keyFeatures, newFeature.trim()]);
      setNewFeature('');
    }
  });

  const handleRemoveFeature = (index: number) => {
    guardEdit(() => {
      const updated = keyFeatures.filter((_, i) => i !== index);
      onKeyFeaturesChange(updated);
    })();
  };

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
                sectionLabel="Key Features"
              />
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {keyFeatures.map((feature, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-2">
                {feature}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleRemoveFeature(index)}
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="e.g., Combined electronic and mechanical safety stops for immediate resistance drop"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddFeature();
                }
              }}
            />
            <Button 
              onClick={handleAddFeature} 
              disabled={!newFeature.trim() || isLoading}
              variant="secondary"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Add core functionalities like Continuous Glucose Monitoring, Smartphone Integration, Cloud-Based Analytics, etc.
          </p>
        </CardContent>
      </Card>

      <GovernanceEditConfirmDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onConfirm={confirmEdit}
        sectionLabel="Key Features"
        designReviewId={gov?.design_review_id}
      />
    </>
  );
}
