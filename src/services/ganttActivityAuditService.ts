import { supabase } from "@/integrations/supabase/client";

type UpdateResult = { success: boolean; error?: string };

const toDateOnlyString = (date?: Date) =>
  date ? date.toISOString().split("T")[0] : undefined;

export class GanttActivityAuditService {
  /**
   * Update activity start/end (and fallback due) dates.
   */
  static async updateActivityDates(
    activityId: string,
    endDate?: Date,
    startDate?: Date
  ): Promise<UpdateResult> {
    try {
      const updateData: Record<string, string | undefined> = {
        updated_at: new Date().toISOString(),
      };

      if (startDate) {
        updateData.start_date = toDateOnlyString(startDate);
      }

      if (endDate) {
        const formattedEnd = toDateOnlyString(endDate);
        updateData.end_date = formattedEnd;
        updateData.due_date = formattedEnd;
      }

      const { error } = await supabase
        .from("activities")
        .update(updateData)
        .eq("id", activityId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to update activity dates:", error);
      return { success: false, error: "Failed to update activity dates" };
    }
  }

  /**
   * Update audit start/end/deadline dates.
   */
  static async updateAuditDates(
    auditId: string,
    endDate?: Date,
    startDate?: Date,
    deadlineDate?: Date
  ): Promise<UpdateResult> {
    try {
      const updateData: Record<string, string | undefined> = {
        updated_at: new Date().toISOString(),
      };

      if (startDate) {
        updateData.start_date = toDateOnlyString(startDate);
      }

      if (endDate) {
        updateData.end_date = toDateOnlyString(endDate);
      }

      if (deadlineDate) {
        updateData.deadline_date = toDateOnlyString(deadlineDate);
      } else if (endDate) {
        // Keep deadline aligned with end if not explicitly provided
        updateData.deadline_date = toDateOnlyString(endDate);
      }

      const { error } = await supabase
        .from("product_audits")
        .update(updateData)
        .eq("id", auditId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to update audit dates:", error);
      return { success: false, error: "Failed to update audit dates" };
    }
  }
}


