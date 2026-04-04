/**
 * Gantt Phase Update Service
 * 
 * Handles all database operations for phase updates from the Gantt chart.
 * Separates business logic from UI components for better maintainability.
 */

import { supabase } from "@/integrations/supabase/client";

export interface PhaseUpdateData {
  phaseId: string;
  startDate: Date;
  endDate: Date;
}

export interface PhaseUpdateResult {
  success: boolean;
  error?: string;
  data?: {
    phaseId: string;
    startDate: string;
    endDate: string;
  };
}

/**
 * Service class for managing Gantt phase updates
 */
export class GanttPhaseUpdateService {
  /**
   * Normalize a date to UTC midnight (preserves calendar date, removes timezone offset)
   * Example: Nov 16 2025 00:00:00 GMT+0530 → 2025-11-16T00:00:00.000Z
   */
  private static normalizeDateToUTC(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00.000Z`;
  }

  /**
   * Update phase dates in the database
   */
  static async updatePhaseDates(
    phaseId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PhaseUpdateResult> {
    try {
      const updateData = {
        start_date: this.normalizeDateToUTC(startDate),
        end_date: this.normalizeDateToUTC(endDate),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('lifecycle_phases')
        .update(updateData)
        .eq('id', phaseId);

      if (error) {
        console.error('[GanttPhaseUpdateService] Database update failed:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('[GanttPhaseUpdateService] ✅ Database update successful');
      return {
        success: true,
        data: {
          phaseId,
          startDate: updateData.start_date,
          endDate: updateData.end_date,
        },
      };
    } catch (error) {
      console.error('[GanttPhaseUpdateService] Unexpected error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Batch update multiple phases at once
   */
  static async batchUpdatePhases(
    updates: PhaseUpdateData[]
  ): Promise<{ successful: number; failed: number; errors: string[] }> {
    const results = await Promise.all(
      updates.map((update) =>
        this.updatePhaseDates(update.phaseId, update.startDate, update.endDate)
      )
    );

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const errors = results
      .filter((r) => !r.success)
      .map((r) => r.error || 'Unknown error');

    return { successful, failed, errors };
  }

  /**
   * Batch update multiple phases with cascading changes
   * Returns detailed results for each phase update
   * Uses parallel updates for better performance
   */
  static async batchUpdatePhasesWithCascading(
    updates: PhaseUpdateData[]
  ): Promise<{
    successful: number;
    failed: number;
    errors: string[];
    updatedPhases: string[];
  }> {
    const updatedPhases: string[] = [];
    const errors: string[] = [];
    
    console.log(`[GanttPhaseUpdateService] Starting batch update for ${updates.length} phases`);
    
    // Execute all updates in parallel for better performance
    // This is safe because each update is independent and atomic
    const results = await Promise.all(
      updates.map(async (update, index) => {
        console.log(`[GanttPhaseUpdateService] Updating phase ${index + 1}/${updates.length}: ${update.phaseId}`);
        
        const result = await this.updatePhaseDates(
          update.phaseId,
          update.startDate,
          update.endDate
        );
        
        if (result.success) {
          updatedPhases.push(update.phaseId);
          console.log(`[GanttPhaseUpdateService] ✅ Phase ${update.phaseId} updated successfully`);
        } else {
          const errorMsg = `Phase ${update.phaseId}: ${result.error}`;
          errors.push(errorMsg);
          console.error(`[GanttPhaseUpdateService] ❌ ${errorMsg}`);
        }
        
        return result;
      })
    );
    
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    
    console.log(`[GanttPhaseUpdateService] Batch update complete: ${successful} successful, ${failed} failed`);
    
    return { successful, failed, errors, updatedPhases };
  }

  /**
   * Validate phase date ranges before update
   */
  static validatePhaseDates(startDate: Date, endDate: Date): {
    valid: boolean;
    error?: string;
  } {
    if (startDate >= endDate) {
      return {
        valid: false,
        error: 'Start date must be before end date',
      };
    }

    // Check if dates are in reasonable range (not too far in past/future)
    const now = new Date();
    const tenYearsAgo = new Date(now.getFullYear() - 10, 0, 1);
    const tenYearsAhead = new Date(now.getFullYear() + 10, 11, 31);

    if (startDate < tenYearsAgo || endDate > tenYearsAhead) {
      return {
        valid: false,
        error: 'Dates must be within reasonable range (10 years)',
      };
    }

    return { valid: true };
  }
}

