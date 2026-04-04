import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ClinicalBenefitsSectionProps {
  clinicalBenefits?: string[];
  onClinicalBenefitsChange?: (benefits: string[]) => void;
  isLoading?: boolean;
}

export function ClinicalBenefitsSection({
  clinicalBenefits = [],
  onClinicalBenefitsChange,
  isLoading = false
}: ClinicalBenefitsSectionProps) {
  const [newBenefit, setNewBenefit] = useState('');

  const handleAddBenefit = () => {
    if (newBenefit.trim() && !clinicalBenefits.includes(newBenefit.trim())) {
      onClinicalBenefitsChange?.([...clinicalBenefits, newBenefit.trim()]);
      setNewBenefit('');
    }
  };

  const handleRemoveBenefit = (index: number) => {
    const updated = clinicalBenefits.filter((_, i) => i !== index);
    onClinicalBenefitsChange?.(updated);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {clinicalBenefits.map((benefit, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-2">
              {benefit}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleRemoveBenefit(index)}
                disabled={isLoading}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={newBenefit}
            onChange={(e) => setNewBenefit(e.target.value)}
            placeholder="e.g., Improved Patient Outcomes, Reduced Recovery Time"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddBenefit();
              }
            }}
          />
          <Button 
            onClick={handleAddBenefit} 
            disabled={!newBenefit.trim() || isLoading}
            variant="secondary"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          List the key clinical benefits this device provides to patients and healthcare providers.
        </p>
      </CardContent>
    </Card>
  );
}
