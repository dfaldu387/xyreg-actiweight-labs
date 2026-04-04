
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ComplianceInstanceWithDueDate {
  id: string;
  requirement: string;
  framework: string;
  status: string;
  assignedTo: string;
  dueDate?: string;
  isOverdue: boolean;
  priority: string;
  clauseId: string;
}

export class ComplianceInstanceDueDateService {
  /**
   * Fetches all compliance instances for a product with due date information
   */
  static async getComplianceInstancesWithDueDates(productId: string): Promise<ComplianceInstanceWithDueDate[]> {
    try {
      const { data, error } = await supabase
        .from("gap_analysis_items")
        .select("*")
        .eq("product_id", productId)
        .order("milestone_due_date", { ascending: true, nullsFirst: false });

      if (error) {
        console.error("Error fetching compliance instances:", error);
        throw error;
      }

      const today = new Date().toISOString().split('T')[0];

      return (data || []).map((item: any) => ({
        id: item.id,
        requirement: item.requirement || "No requirement specified",
        framework: item.framework || "Unknown",
        status: item.status || "not_applicable",
        assignedTo: item.assigned_to || "",
        dueDate: item.milestone_due_date,
        isOverdue: item.milestone_due_date ? item.milestone_due_date < today && item.status !== "compliant" : false,
        priority: item.priority || "medium",
        clauseId: item.clause_id || ""
      }));
    } catch (error) {
      console.error("Error in getComplianceInstancesWithDueDates:", error);
      toast.error("Failed to load compliance instances");
      return [];
    }
  }

  /**
   * Updates the due date for a specific compliance instance
   */
  static async updateComplianceInstanceDueDate(itemId: string, dueDate: string | null): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("gap_analysis_items")
        .update({ 
          milestone_due_date: dueDate,
          updated_at: new Date().toISOString()
        })
        .eq("id", itemId);

      if (error) {
        console.error("Error updating due date:", error);
        toast.error("Failed to update due date");
        return false;
      }

      toast.success("Due date updated successfully");
      return true;
    } catch (error) {
      console.error("Error in updateComplianceInstanceDueDate:", error);
      toast.error("Failed to update due date");
      return false;
    }
  }

  /**
   * Bulk update due dates for multiple compliance instances
   */
  static async bulkUpdateDueDates(updates: Array<{ id: string; dueDate: string | null }>): Promise<boolean> {
    try {
      const promises = updates.map(update => 
        supabase
          .from("gap_analysis_items")
          .update({ 
            milestone_due_date: update.dueDate,
            updated_at: new Date().toISOString()
          })
          .eq("id", update.id)
      );

      const results = await Promise.all(promises);
      const hasErrors = results.some(result => result.error);

      if (hasErrors) {
        toast.error("Some due dates failed to update");
        return false;
      }

      toast.success(`Updated ${updates.length} due dates successfully`);
      return true;
    } catch (error) {
      console.error("Error in bulkUpdateDueDates:", error);
      toast.error("Failed to bulk update due dates");
      return false;
    }
  }

  /**
   * Get overdue compliance instances for a product
   */
  static async getOverdueInstances(productId: string): Promise<ComplianceInstanceWithDueDate[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from("gap_analysis_items")
        .select("*")
        .eq("product_id", productId)
        .lt("milestone_due_date", today)
        .neq("status", "compliant")
        .not("milestone_due_date", "is", null);

      if (error) {
        console.error("Error fetching overdue instances:", error);
        throw error;
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        requirement: item.requirement || "No requirement specified",
        framework: item.framework || "Unknown",
        status: item.status || "not_applicable",
        assignedTo: item.assigned_to || "",
        dueDate: item.milestone_due_date,
        isOverdue: true,
        priority: item.priority || "medium",
        clauseId: item.clause_id || ""
      }));
    } catch (error) {
      console.error("Error in getOverdueInstances:", error);
      return [];
    }
  }
}
