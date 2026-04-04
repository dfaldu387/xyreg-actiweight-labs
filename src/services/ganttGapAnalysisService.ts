import { supabase } from "@/integrations/supabase/client";

type UpdateResult = { success: boolean; error?: string };

const normalizePhaseId = (phaseId?: string | number | null): string | null => {
  if (phaseId === null || phaseId === undefined) {
    return null;
  }

  const value = typeof phaseId === "number" ? String(phaseId) : phaseId;
  if (!value) {
    return null;
  }

  if (value.startsWith("phase-") || value.startsWith("phase_")) {
    return value.slice("phase-".length);
  }

  return value;
};

const parsePhaseTime = (phaseTime: unknown): string[] => {
  if (!Array.isArray(phaseTime)) {
    return [];
  }

  return phaseTime
    .map((entry) => (typeof entry === "string" ? entry : String(entry ?? "")))
    .filter((entry) => entry.length > 0);
};

const buildPhaseTimeEntry = (
  phaseId: string,
  startDate?: Date,
  endDate?: Date,
  existingEntry?: string
) => {
  let currentStart = "";
  let currentEnd = "";

  if (existingEntry) {
    const [, existingStart = "", existingEnd = ""] = existingEntry.split("||");
    currentStart = existingStart;
    currentEnd = existingEnd;
  }

  const startValue = startDate ? startDate.toISOString() : currentStart;
  const endValue = endDate ? endDate.toISOString() : currentEnd;
  return `${phaseId}||${startValue}||${endValue}`;
};

export class GanttGapAnalysisService {
  static async updateGapItemDates(
    gapItemId: string,
    phaseId?: string | number | null,
    endDate?: Date,
    startDate?: Date
  ): Promise<UpdateResult> {
    try {
      const normalizedPhaseId = normalizePhaseId(phaseId);
      if (!normalizedPhaseId) {
        return { success: false, error: "Missing phase reference for gap item" };
      }

      const { data: gapItem, error: fetchError } = await supabase
        .from("gap_analysis_items")
        .select("phase_time")
        .eq("id", gapItemId)
        .single();

      if (fetchError) {
        console.error("[GanttGapAnalysisService] Failed fetching gap item:", fetchError);
        return { success: false, error: fetchError.message };
      }

      const existingPhaseTime = parsePhaseTime(gapItem?.phase_time);
      const entryIndex = existingPhaseTime.findIndex((entry) => {
        const [entryPhaseId] = entry.split("||");
        return entryPhaseId === normalizedPhaseId;
      });

      const updatedPhaseTime = [...existingPhaseTime];
      if (entryIndex >= 0) {
        updatedPhaseTime[entryIndex] = buildPhaseTimeEntry(
          normalizedPhaseId,
          startDate,
          endDate,
          existingPhaseTime[entryIndex]
        );
      } else {
        console.warn(
          "[GanttGapAnalysisService] Phase entry missing, creating new entry for gap item",
          gapItemId,
          normalizedPhaseId
        );
        updatedPhaseTime.push(
          buildPhaseTimeEntry(normalizedPhaseId, startDate, endDate)
        );
      }

      const { error: updateError } = await supabase
        .from("gap_analysis_items")
        .update({
          phase_time: updatedPhaseTime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", gapItemId);

      if (updateError) {
        console.error("[GanttGapAnalysisService] Failed updating phase_time:", updateError);
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to update gap analysis item phase_time:", error);
      return {
        success: false,
        error: "Failed to update gap analysis item phase_time",
      };
    }
  }
}


