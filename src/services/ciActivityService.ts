
import { supabase } from "@/integrations/supabase/client";
import { ActivityCI } from "@/types/ci";
import { CIInstanceService, CIInstance } from "./ciInstanceService";

export class CIActivityService {
  /**
   * Create a new activity CI instance
   */
  static async createActivity(activity: Omit<ActivityCI, "id" | "created_at" | "updated_at">): Promise<ActivityCI> {
    console.log("Creating activity CI instance:", activity);

    // If this is based on a template, create through the instance service
    if (activity.assigned_to || activity.due_date) {
      // This looks like a product-specific instance, not a template
      const instanceData = {
        template_id: "", // This would need to be provided or looked up
        company_id: activity.company_id,
        product_id: activity.product_id,
        title: activity.title,
        description: activity.description,
        status: activity.status === "completed" ? "completed" : 
               activity.status === "in_progress" ? "in_progress" : "pending",
        priority: activity.priority,
        assigned_to: activity.assigned_to,
        due_date: activity.due_date,
        instance_config: {
          activity_type: activity.activity_type,
          completion_percentage: activity.completion_percentage,
          certification_required: activity.certification_required,
          participants: activity.participants,
          location: activity.location,
          duration_hours: activity.duration_hours
        }
      };

      // This is a fallback for backward compatibility - ideally all activities should come from templates
      console.warn("Creating activity CI without template - consider using templates for better governance");
    }

    // Fallback to old behavior for backward compatibility
    const { data, error } = await supabase
      .from("ci_instances")
      .insert({
        company_id: activity.company_id,
        product_id: activity.product_id,
        type: "activity",
        title: activity.title,
        description: activity.description,
        status: activity.status === "completed" ? "completed" : 
               activity.status === "in_progress" ? "in_progress" : "pending",
        priority: activity.priority,
        assigned_to: activity.assigned_to,
        due_date: activity.due_date,
        instance_config: {
          activity_type: activity.activity_type,
          completion_percentage: activity.completion_percentage || 0,
          certification_required: activity.certification_required || false,
          participants: activity.participants || [],
          location: activity.location,
          duration_hours: activity.duration_hours
        },
        template_id: crypto.randomUUID(), // Generate a dummy template ID for now
        created_by: activity.created_by || ""
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating activity CI:", error);
      throw error;
    }

    // Transform CI instance to ActivityCI format
    return {
      id: data.id,
      type: "activity",
      title: data.title,
      description: data.description,
      status: data.status as any,
      priority: data.priority as any,
      company_id: data.company_id,
      product_id: data.product_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      created_by: data.created_by,
      due_date: data.due_date,
        assigned_to: data.assigned_to,
        activity_type: (data.instance_config as any)?.activity_type || "training",
        completion_percentage: (data.instance_config as any)?.completion_percentage || 0,
        certification_required: (data.instance_config as any)?.certification_required || false,
        participants: (data.instance_config as any)?.participants || [],
        location: (data.instance_config as any)?.location,
        duration_hours: (data.instance_config as any)?.duration_hours
    };
  }

  /**
   * Get activities for a company (all activity CI instances)
   */
  static async getCompanyActivities(companyId: string): Promise<ActivityCI[]> {
    console.log("Fetching company activity CIs:", companyId);

    try {
      const instances = await CIInstanceService.getCompanyInstances(companyId);
      const activityInstances = instances.filter(instance => instance.type === "activity");

      return activityInstances.map(instance => ({
        id: instance.id,
        type: "activity" as const,
        title: instance.title,
        description: instance.description,
        status: instance.status as any,
        priority: instance.priority as any,
        company_id: instance.company_id,
        product_id: instance.product_id,
        created_at: instance.created_at,
        updated_at: instance.updated_at,
        created_by: instance.created_by,
        due_date: instance.due_date,
        assigned_to: instance.assigned_to,
        activity_type: (instance.instance_config as any)?.activity_type || "training",
        completion_percentage: (instance.instance_config as any)?.completion_percentage || 0,
        certification_required: (instance.instance_config as any)?.certification_required || false,
        participants: (instance.instance_config as any)?.participants || [],
        location: (instance.instance_config as any)?.location,
        duration_hours: (instance.instance_config as any)?.duration_hours
      }));

    } catch (error) {
      console.error("Error fetching activity CIs:", error);
      throw error;
    }
  }

  /**
   * Get activities by type (training, testing, etc.)
   */
  static async getActivitiesByType(
    companyId: string, 
    activityType: "training" | "testing" | "validation" | "calibration" | "maintenance"
  ): Promise<ActivityCI[]> {
    // For now, get all activities and filter by description or name containing the type
    const activities = await this.getCompanyActivities(companyId);
    return activities.filter(activity => 
      activity.title.toLowerCase().includes(activityType) ||
      activity.description?.toLowerCase().includes(activityType)
    );
  }

  /**
   * Update activity completion percentage
   */
  static async updateActivityProgress(activityId: string, completionPercentage: number): Promise<void> {
    console.log("Updating activity progress:", { activityId, completionPercentage });

    const status = completionPercentage >= 100 ? "completed" : 
                  completionPercentage > 0 ? "in_progress" : "pending";
    
    // Get current instance to preserve other config
    const instances = await CIInstanceService.getCompanyInstances("");
    const instance = instances.find(i => i.id === activityId);
    
    if (!instance) {
      throw new Error("Activity CI instance not found");
    }

    const updatedConfig = {
      ...(typeof instance.instance_config === 'object' ? instance.instance_config as Record<string, any> : {}),
      completion_percentage: completionPercentage
    };

    const success = await CIInstanceService.updateInstance(activityId, {
      status,
      instance_config: updatedConfig
    });

    if (!success) {
      throw new Error("Failed to update activity progress");
    }
  }

  /**
   * Add participant to activity
   * Note: Using reviewers field to store participants for now
   */
  static async addParticipant(activityId: string, userId: string): Promise<void> {
    // Get current reviewers (acting as participants)
    const { data: activity, error: fetchError } = await supabase
      .from("documents")
      .select("reviewers")
      .eq("id", activityId)
      .eq("document_type", "Activity")
      .single();

    if (fetchError) {
      console.error("Error fetching activity participants:", fetchError);
      throw fetchError;
    }

    const currentParticipants = Array.isArray(activity?.reviewers) ? activity.reviewers : [];
    if (!currentParticipants.includes(userId)) {
      const updatedParticipants = [...currentParticipants, userId];

      const { error } = await supabase
        .from("documents")
        .update({ 
          reviewers: updatedParticipants,
          updated_at: new Date().toISOString()
        })
        .eq("id", activityId);

      if (error) {
        console.error("Error adding participant:", error);
        throw error;
      }
    }
  }

  /**
   * Remove participant from activity
   */
  static async removeParticipant(activityId: string, userId: string): Promise<void> {
    // Get current reviewers (acting as participants)
    const { data: activity, error: fetchError } = await supabase
      .from("documents")
      .select("reviewers")
      .eq("id", activityId)
      .eq("document_type", "Activity")
      .single();

    if (fetchError) {
      console.error("Error fetching activity participants:", fetchError);
      throw fetchError;
    }

    const currentParticipants = Array.isArray(activity?.reviewers) ? activity.reviewers : [];
    const updatedParticipants = currentParticipants.filter((id: string) => id !== userId);

    const { error } = await supabase
      .from("documents")
      .update({ 
        reviewers: updatedParticipants,
        updated_at: new Date().toISOString()
      })
      .eq("id", activityId);

    if (error) {
      console.error("Error removing participant:", error);
      throw error;
    }
  }

  /**
   * Schedule recurring activity
   */
  static async scheduleRecurringActivity(
    activityTemplate: Omit<ActivityCI, "id" | "created_at" | "updated_at">,
    recurringPattern: {
      frequency: "daily" | "weekly" | "monthly" | "quarterly" | "annually";
      interval: number;
      endDate?: string;
      occurrences?: number;
    }
  ): Promise<ActivityCI[]> {
    const activities: ActivityCI[] = [];
    const startDate = new Date(activityTemplate.due_date || new Date());
    
    let currentDate = new Date(startDate);
    let occurrenceCount = 0;
    const maxOccurrences = recurringPattern.occurrences || 12;
    const endDate = recurringPattern.endDate ? new Date(recurringPattern.endDate) : null;

    while (occurrenceCount < maxOccurrences && (!endDate || currentDate <= endDate)) {
      const activityData = {
        ...activityTemplate,
        title: `${activityTemplate.title} - ${currentDate.toLocaleDateString()}`,
        due_date: currentDate.toISOString().split('T')[0]
      };

      try {
        const activity = await this.createActivity(activityData);
        activities.push(activity);
        occurrenceCount++;
      } catch (error) {
        console.error("Error creating recurring activity:", error);
        break;
      }

      // Calculate next occurrence date
      switch (recurringPattern.frequency) {
        case "daily":
          currentDate.setDate(currentDate.getDate() + recurringPattern.interval);
          break;
        case "weekly":
          currentDate.setDate(currentDate.getDate() + (7 * recurringPattern.interval));
          break;
        case "monthly":
          currentDate.setMonth(currentDate.getMonth() + recurringPattern.interval);
          break;
        case "quarterly":
          currentDate.setMonth(currentDate.getMonth() + (3 * recurringPattern.interval));
          break;
        case "annually":
          currentDate.setFullYear(currentDate.getFullYear() + recurringPattern.interval);
          break;
      }
    }

    return activities;
  }

  /**
   * Get overdue activities
   */
  static async getOverdueActivities(companyId: string): Promise<ActivityCI[]> {
    const now = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("company_id", companyId)
      .eq("document_type", "Activity")
      .lt("due_date", now)
      .neq("status", "Completed")
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Error fetching overdue activities:", error);
      throw error;
    }

    return (data || []).map(doc => ({
      id: doc.id,
      type: "activity" as const,
      title: doc.name,
      description: doc.description,
      status: doc.status as any,
      priority: "high" as const, // Overdue activities are high priority
      company_id: doc.company_id!,
      product_id: doc.product_id,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      created_by: doc.uploaded_by || "",
      due_date: doc.due_date,
      activity_type: "training" as const,
      completion_percentage: 0,
      certification_required: false
    }));
  }
}
