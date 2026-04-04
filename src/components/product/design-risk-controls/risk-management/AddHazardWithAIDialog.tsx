import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import { ComprehensiveHazardForm } from "./ComprehensiveHazardForm";
import { CreateHazardInput } from "./types";
import { HazardSuggestion } from "@/services/hazardAIService";
import { requirementSpecificationsService } from "@/services/requirementSpecificationsService";
import { useQuery } from "@tanstack/react-query";

interface AddHazardWithAIDialogProps {
  productId: string;
  companyId: string;
  onHazardAdded: (input: CreateHazardInput, requirementIds: string[]) => void;
  isLoading?: boolean;
  aiSuggestion?: HazardSuggestion;
}

export function AddHazardWithAIDialog({
  productId,
  companyId,
  onHazardAdded,
  isLoading,
  aiSuggestion,
}: AddHazardWithAIDialogProps) {
  const [open, setOpen] = useState(false);

  const { data: requirements = [], isLoading: requirementsLoading } = useQuery({
    queryKey: ["requirement-specifications", companyId],
    queryFn: () => requirementSpecificationsService.getByProductId(productId),
  });

  const handleSubmit = (input: CreateHazardInput, requirementIds: string[]) => {
    onHazardAdded(input, requirementIds);
    setOpen(false);
  };

  // Prepare AI data from suggestion
  const aiData = aiSuggestion ? {
    hazardous_situation: aiSuggestion.hazardous_situation,
    potential_harm: aiSuggestion.potential_harm,
    foreseeable_sequence_events: aiSuggestion.foreseeable_sequence_events,
    confidence: aiSuggestion.confidence,
  } : undefined;

  // Prepare initial data from AI suggestion
  const initialData = aiSuggestion ? {
    description: aiSuggestion.description,
    category: aiSuggestion.category,
  } : undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          {aiSuggestion ? (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Add with AI Content
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Hazard
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {aiSuggestion ? (
              <>
                <Sparkles className="h-5 w-5" />
                Add Hazard with AI Suggestions
              </>
            ) : (
              "Add New Hazard"
            )}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Complete ISO 14971 compliant hazard analysis and risk management documentation
            {aiSuggestion && " with AI-generated content that you can review and approve"}
          </p>
        </DialogHeader>
        <ComprehensiveHazardForm
          requirements={requirements}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          isLoading={isLoading || requirementsLoading}
          initialData={initialData}
          aiData={aiData}
          companyId={companyId}
          productId={productId}
        />
      </DialogContent>
    </Dialog>
  );
}