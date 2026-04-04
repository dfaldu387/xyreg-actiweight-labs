/**
 * Gantt Sub-Task Synchronization Service
 *
 * Handles synchronizing sub-task dates (documents, gap analysis, activities, audits)
 * when parent phase dates change due to drag/resize operations.
 */

import { supabase } from "@/integrations/supabase/client";
import { GanttTask } from "@/types/ganttChart";

export interface SubTaskUpdate {
  id: string;
  type: 'document' | 'gap-analysis' | 'activity' | 'audit';
  startDate: Date;
  endDate: Date;
}

export interface PhaseSyncResult {
  success: boolean;
  phaseId: string;
  updatedSubTasks: number;
  errors: string[];
}

/**
 * Service for synchronizing sub-task dates when phases change
 */
export class GanttSubTaskSyncService {
  /**
   * Calculate new sub-task dates when phase dates change
   *
   * Strategy:
   * 1. Preserve relative positions of sub-tasks within the phase
   * 2. If a sub-task extends beyond new phase boundaries, constrain it to fit
   */
  static calculateAdjustedSubTaskDates(
    subTask: GanttTask,
    oldPhaseStart: Date,
    oldPhaseEnd: Date,
    newPhaseStart: Date,
    newPhaseEnd: Date
  ): { startDate: Date; endDate: Date } {
    const subTaskStart = new Date(subTask.start);
    const subTaskEnd = new Date(subTask.end);

    // Calculate time delta (how much the phase moved)
    const phaseDelta = newPhaseStart.getTime() - oldPhaseStart.getTime();

    // Calculate new dates by shifting with the phase movement
    let newStart = new Date(subTaskStart.getTime() + phaseDelta);
    let newEnd = new Date(subTaskEnd.getTime() + phaseDelta);

    // Constrain to phase boundaries if needed
    // If new start is before phase start, move it to phase start
    if (newStart < newPhaseStart) {
      const duration = subTaskEnd.getTime() - subTaskStart.getTime();
      newStart = new Date(newPhaseStart);
      newEnd = new Date(newStart.getTime() + duration);
    }

    // If new end is after phase end, move it to phase end
    if (newEnd > newPhaseEnd) {
      const duration = subTaskEnd.getTime() - subTaskStart.getTime();
      newEnd = new Date(newPhaseEnd);
      // Try to preserve duration, but if it doesn't fit, start from phase start
      newStart = new Date(newEnd.getTime() - duration);
      if (newStart < newPhaseStart) {
        newStart = new Date(newPhaseStart);
      }
    }

    return { startDate: newStart, endDate: newEnd };
  }

  /**
   * Get all sub-tasks for a phase from the Gantt task list
   */
  static getPhaseSubTasks(
    allTasks: GanttTask[],
    phaseId: string | number
  ): GanttTask[] {
    const phaseTaskId = phaseId.toString();
    const subTasks: GanttTask[] = [];

    // Find container tasks (Documents, Gap Analysis, etc.) that are direct children of the phase
    const containerTasks = allTasks.filter(
      (task) => task.parent?.toString() === phaseTaskId && task.type === 'summary'
    );

    // For each container, find its child tasks
    containerTasks.forEach((container) => {
      const containerId = container.id.toString();
      const childTasks = allTasks.filter(
        (task) => task.parent?.toString() === containerId && task.type === 'task'
      );
      subTasks.push(...childTasks);
    });

    return subTasks;
  }

  /**
   * Update document dates in database
   */
  private static async updateDocumentDates(
    documentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData = {
        start_date: startDate.toISOString().split('T')[0],
        due_date: endDate.toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('phase_assigned_document_template')
        .update(updateData)
        .eq('id', documentId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update gap analysis item dates in database
   *
   * @deprecated This method is NO LONGER USED. Gap analysis dates are managed
   * exclusively through the phase_time array field by GanttGapAnalysisService.
   * The milestone_due_date and start_date fields should NOT be used for Gantt chart
   * date management as they conflict with the phase_time source of truth.
   *
   * This method is kept for reference but should not be called.
   */
  private static async updateGapAnalysisDates(
    gapAnalysisId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ success: boolean; error?: string }> {
    // DEPRECATED: Do not use this method
    // Gap analysis dates are managed via phase_time array only
    console.warn('[GanttSubTaskSyncService] updateGapAnalysisDates is deprecated and should not be called');
    return { success: true };

    /* OLD CODE - DO NOT USE
    try {
      const updateData = {
        milestone_due_date: endDate.toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('gap_analysis_items')
        .update(updateData)
        .eq('id', gapAnalysisId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    */
  }

  /**
   * Update activity dates in database
   */
  private static async updateActivityDates(
    activityId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData = {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('activities')
        .update(updateData)
        .eq('id', activityId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update audit dates in database
   */
  private static async updateAuditDates(
    auditId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData = {
        scheduled_date: startDate.toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('audits')
        .update(updateData)
        .eq('id', auditId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Determine sub-task type from task ID
   */
  private static getSubTaskType(
    task: GanttTask
  ): 'document' | 'gap-analysis' | 'activity' | 'audit' | null {
    const taskId = task.id.toString();

    if (taskId.startsWith('doc-') || taskId.startsWith('doc_')) {
      return 'document';
    } else if (taskId.startsWith('gap-')) {
      return 'gap-analysis';
    } else if (taskId.startsWith('activity-')) {
      return 'activity';
    } else if (taskId.startsWith('audit-')) {
      return 'audit';
    }

    return null;
  }

  /**
   * Extract entity ID from task ID
   */
  private static extractEntityId(taskId: string): string {
    // Remove prefix (doc-, gap-, activity-, audit-) or (doc_, gap_, etc.)
    return taskId.replace(/^(doc[-_]|gap[-_]|activity[-_]|audit[-_])/, '');
  }

  /**
   * Synchronize sub-task dates when a phase changes
   */
  static async syncSubTasksForPhase(
    phaseId: string | number,
    oldPhaseStart: Date,
    oldPhaseEnd: Date,
    newPhaseStart: Date,
    newPhaseEnd: Date,
    allTasks: GanttTask[]
  ): Promise<PhaseSyncResult> {
    const errors: string[] = [];
    let updatedCount = 0;

    try {
      // Get all sub-tasks for this phase
      const subTasks = this.getPhaseSubTasks(allTasks, phaseId);

      console.log(
        `[GanttSubTaskSyncService] Found ${subTasks.length} sub-tasks for phase ${phaseId}`
      );

      if (subTasks.length === 0) {
        return {
          success: true,
          phaseId: phaseId.toString(),
          updatedSubTasks: 0,
          errors: []
        };
      }

      // Process each sub-task
      const updatePromises = subTasks.map(async (subTask) => {
        const subTaskType = this.getSubTaskType(subTask);

        if (!subTaskType) {
          console.warn(
            `[GanttSubTaskSyncService] Unknown sub-task type for task ${subTask.id}`
          );
          return;
        }

        // Calculate adjusted dates
        const { startDate, endDate } = this.calculateAdjustedSubTaskDates(
          subTask,
          oldPhaseStart,
          oldPhaseEnd,
          newPhaseStart,
          newPhaseEnd
        );

        // Extract entity ID
        const entityId = this.extractEntityId(subTask.id.toString());

        // Update in database based on type
        let result: { success: boolean; error?: string };

        switch (subTaskType) {
          case 'document':
            result = await this.updateDocumentDates(entityId, startDate, endDate);
            break;
          case 'gap-analysis':
            // IMPORTANT: Gap analysis dates are managed through phase_time ONLY
            // Do NOT update milestone_due_date or start_date fields
            // The GanttGapAnalysisService handles phase_time updates separately
            console.log('[GanttSubTaskSyncService] Skipping gap analysis sync - managed via phase_time');
            result = { success: true }; // Skip but don't fail
            break;
          case 'activity':
            result = await this.updateActivityDates(entityId, startDate, endDate);
            break;
          case 'audit':
            result = await this.updateAuditDates(entityId, startDate, endDate);
            break;
          default:
            return;
        }

        if (result.success) {
          updatedCount++;
          console.log(
            `[GanttSubTaskSyncService] ✅ Updated ${subTaskType} ${entityId}`
          );
        } else {
          errors.push(`Failed to update ${subTaskType} ${entityId}: ${result.error}`);
          console.error(
            `[GanttSubTaskSyncService] ❌ Failed to update ${subTaskType} ${entityId}:`,
            result.error
          );
        }
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);

      console.log(
        `[GanttSubTaskSyncService] Sync complete for phase ${phaseId}: ${updatedCount} updated, ${errors.length} errors`
      );

      return {
        success: errors.length === 0,
        phaseId: phaseId.toString(),
        updatedSubTasks: updatedCount,
        errors
      };
    } catch (error) {
      console.error('[GanttSubTaskSyncService] Unexpected error:', error);
      return {
        success: false,
        phaseId: phaseId.toString(),
        updatedSubTasks: updatedCount,
        errors: [
          ...(errors || []),
          error instanceof Error ? error.message : 'Unknown error occurred'
        ]
      };
    }
  }

  /**
   * Batch sync multiple phases
   */
  static async batchSyncPhases(
    phaseUpdates: Array<{
      phaseId: string | number;
      oldStart: Date;
      oldEnd: Date;
      newStart: Date;
      newEnd: Date;
    }>,
    allTasks: GanttTask[]
  ): Promise<{
    successful: number;
    failed: number;
    totalSubTasksUpdated: number;
    results: PhaseSyncResult[];
  }> {
    const results = await Promise.all(
      phaseUpdates.map((update) =>
        this.syncSubTasksForPhase(
          update.phaseId,
          update.oldStart,
          update.oldEnd,
          update.newStart,
          update.newEnd,
          allTasks
        )
      )
    );

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const totalSubTasksUpdated = results.reduce(
      (sum, r) => sum + r.updatedSubTasks,
      0
    );

    return {
      successful,
      failed,
      totalSubTasksUpdated,
      results
    };
  }
}
