import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles } from 'lucide-react';
import { hazardsService } from '@/services/hazardsService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AIRequirementHazardSuggestions,
  type HazardOption,
} from '@/components/product/design-risk-controls/requirement-specifications/AIRequirementHazardSuggestions';

interface AIUserNeedHazardSuggestionsProps {
  userNeedId: string; // e.g. "UN-QMS-01"
  userNeedDescription: string;
  productId: string;
  companyId: string;
  productName?: string;
  /** SYSR/SWR/HWR ids that this user need is linked to (downstream). */
  linkedReqIds: string[];
  /** Already-derived related hazard IDs (e.g. "HZ-007") to suppress duplicate links. */
  relatedHazardIds: string[];
}

/**
 * Thin wrapper around AIRequirementHazardSuggestions adapted for User Needs.
 *
 * Hazards live at product scope and trace to user needs *via* requirements.
 * Linking from a user need therefore appends the user need's downstream
 * requirement IDs to the hazard's `linked_requirements` field.
 */
export function AIUserNeedHazardSuggestions({
  userNeedId,
  userNeedDescription,
  productId,
  companyId,
  productName,
  linkedReqIds,
  relatedHazardIds,
}: AIUserNeedHazardSuggestionsProps) {
  const queryClient = useQueryClient();

  // Load all product hazards for fuzzy match + lookup by hazard_id.
  const { data: hazards = [] } = useQuery({
    queryKey: ['hazards-for-user-need-ai', productId],
    queryFn: () => hazardsService.getHazardsByProduct(productId),
    enabled: !!productId,
  });

  const hazardOptions: HazardOption[] = hazards.map((h) => ({
    id: h.id,
    hazard_id: h.hazard_id,
    description: h.description,
  }));

  const appendReqsToHazard = async (hazardRowId: string) => {
    const hazard = hazards.find((h) => h.id === hazardRowId);
    if (!hazard) return;
    const existing = hazard.linked_requirements
      ? String(hazard.linked_requirements).split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const merged = Array.from(new Set([...existing, ...linkedReqIds]));
    if (merged.length === existing.length) return; // nothing new
    const { error } = await supabase
      .from('hazards')
      .update({ linked_requirements: merged.join(',') })
      .eq('id', hazardRowId);
    if (error) {
      console.error('Failed to append requirements to hazard:', error);
      toast.error('Linked hazard but failed to attach requirement trace');
    }
  };

  const handleSelect = async (hazardPublicId: string) => {
    // hazardPublicId is the human "HZ-XXX" id; resolve to row id.
    const hz = hazards.find((h) => h.hazard_id === hazardPublicId);
    if (hz && linkedReqIds.length > 0) {
      await appendReqsToHazard(hz.id);
    }
    queryClient.invalidateQueries({ queryKey: ['related-risks-for-user-need', userNeedId] });
    queryClient.invalidateQueries({ queryKey: ['hazards', productId] });
    queryClient.invalidateQueries({ queryKey: ['hazards-for-user-need-ai', productId] });
  };

  const handleHazardCreated = async (newHazard: HazardOption) => {
    if (linkedReqIds.length > 0) {
      const merged = Array.from(new Set(linkedReqIds));
      const { error } = await supabase
        .from('hazards')
        .update({ linked_requirements: merged.join(',') })
        .eq('id', newHazard.id);
      if (error) {
        console.error('Failed to attach requirement trace to new hazard:', error);
      }
    }
    queryClient.invalidateQueries({ queryKey: ['related-risks-for-user-need', userNeedId] });
    queryClient.invalidateQueries({ queryKey: ['hazards', productId] });
    queryClient.invalidateQueries({ queryKey: ['hazards-for-user-need-ai', productId] });
  };

  // selectedIds: hazard_ids already related (so the inner UI shows "Linked").
  const selectedIds = relatedHazardIds;

  if (linkedReqIds.length === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled
                className="h-7 gap-1.5 text-amber-700 border-amber-300 opacity-60"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Suggest with AI</span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[260px]">
            <p className="text-xs">
              Add a linked requirement first — hazards trace via requirements,
              not directly to user needs.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <AIRequirementHazardSuggestions
      requirementDescription={userNeedDescription}
      requirementType="system"
      productId={productId}
      companyId={companyId}
      productName={productName}
      existingHazards={hazardOptions}
      selectedIds={selectedIds}
      onSelect={handleSelect}
      onHazardCreated={handleHazardCreated}
    />
  );
}