
import { supabase } from '@/integrations/supabase/client';
import { formatDateToLocalISO, testDateFormatting } from '@/lib/date';
import { toast } from 'sonner';
import { TimelineDriftService } from '@/services/timelineDriftService';

export class PhaseTimelineService {
  /**
   * Update phase start date with comprehensive logging and validation
   */
  static async updatePhaseStartDate(phaseId: string, startDate: Date | undefined): Promise<boolean> {
    

    try {
      // Validate input
      if (!phaseId) {
        console.error('[PhaseTimelineService] Phase ID is required');
        toast.error('Phase ID is required');
        return false;
      }

      let formattedDate: string | null = null;
      
      if (startDate) {
        // Test date formatting with debug output
        testDateFormatting(startDate);
        
        try {
          formattedDate = formatDateToLocalISO(startDate);
          // console.log(`[PhaseTimelineService] Formatted start date: ${formattedDate}`);
        } catch (error) {
          console.error('[PhaseTimelineService] Date formatting failed:', error);
          toast.error('Invalid date format');
          return false;
        }
      } else {
        // console.log('[PhaseTimelineService] Clearing start date (setting to null)');
      }

      // Get current phase data before update
      const { data: beforeData, error: beforeError } = await supabase
        .from('lifecycle_phases')
        .select('id, name, start_date, end_date, product_id')
        .eq('id', phaseId)
        .single();

      if (beforeError) {
        console.error('[PhaseTimelineService] Failed to fetch phase before update:', beforeError);
        toast.error('Failed to fetch phase data');
        return false;
      }

      // console.log('[PhaseTimelineService] Phase before update:', beforeData);

      // Perform the update
      const { data, error, count } = await supabase
        .from('lifecycle_phases')
        .update({ 
          start_date: formattedDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', phaseId)
        .select('id, name, start_date, end_date, product_id');

      

      if (error) {
        console.error('[PhaseTimelineService] Update failed:', error);
        toast.error(`Failed to update start date: ${error.message}`);
        return false;
      }

      if (!data || data.length === 0) {
        console.error('[PhaseTimelineService] No rows updated - phase may not exist');
        toast.error('Phase not found or no changes made');
        return false;
      }

      // Verify the update actually took effect
      const { data: afterData, error: afterError } = await supabase
        .from('lifecycle_phases')
        .select('id, name, start_date, end_date, product_id')
        .eq('id', phaseId)
        .single();

      if (afterError) {
        console.error('[PhaseTimelineService] Failed to verify update:', afterError);
        toast.warning('Update may not have been saved - please refresh');
        return false;
      }

     

      if (afterData.start_date !== formattedDate) {
        console.error('[PhaseTimelineService] Database value does not match expected value!');
        toast.error('Start date was not saved correctly');
        return false;
      }

      // console.log('[PhaseTimelineService] Start date updated successfully');
      toast.success(startDate ? 'Start date updated' : 'Start date cleared');

      // Snapshot baseline if not yet set
      if (data?.[0]?.product_id) {
        TimelineDriftService.snapshotBaseline(data[0].product_id).catch(() => {});
      }

      return true;

    } catch (error) {
      console.error('[PhaseTimelineService] Unexpected error in updatePhaseStartDate:', error);
      toast.error('An unexpected error occurred');
      return false;
    }
  }

  /**
   * Update phase end date with comprehensive logging and validation
   */
  static async updatePhaseEndDate(phaseId: string, endDate: Date | undefined): Promise<boolean> {
    

    try {
      // Validate input
      if (!phaseId) {
        console.error('[PhaseTimelineService] Phase ID is required');
        toast.error('Phase ID is required');
        return false;
      }

      let formattedDate: string | null = null;
      
      if (endDate) {
        // Test date formatting with debug output
        testDateFormatting(endDate);
        
        try {
          formattedDate = formatDateToLocalISO(endDate);
          // console.log(`[PhaseTimelineService] Formatted end date: ${formattedDate}`);
        } catch (error) {
          console.error('[PhaseTimelineService] Date formatting failed:', error);
          toast.error('Invalid date format');
          return false;
        }
      } else {
        // console.log('[PhaseTimelineService] Clearing end date (setting to null)');
      }

      // Get current phase data before update
      const { data: beforeData, error: beforeError } = await supabase
        .from('lifecycle_phases')
        .select('id, name, start_date, end_date, product_id')
        .eq('id', phaseId)
        .single();

      if (beforeError) {
        console.error('[PhaseTimelineService] Failed to fetch phase before update:', beforeError);
        toast.error('Failed to fetch phase data');
        return false;
      }

      // console.log('[PhaseTimelineService] Phase before update:', beforeData);

      // Perform the update
      const { data, error, count } = await supabase
        .from('lifecycle_phases')
        .update({ 
          end_date: formattedDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', phaseId)
        .select('id, name, start_date, end_date, product_id');

      

      if (error) {
        console.error('[PhaseTimelineService] Update failed:', error);
        toast.error(`Failed to update end date: ${error.message}`);
        return false;
      }

      if (!data || data.length === 0) {
        console.error('[PhaseTimelineService] No rows updated - phase may not exist');
        toast.error('Phase not found or no changes made');
        return false;
      }

      // Verify the update actually took effect
      const { data: afterData, error: afterError } = await supabase
        .from('lifecycle_phases')
        .select('id, name, start_date, end_date, product_id')
        .eq('id', phaseId)
        .single();

      if (afterError) {
        console.error('[PhaseTimelineService] Failed to verify update:', afterError);
        toast.warning('Update may not have been saved - please refresh');
        return false;
      }

      

      if (afterData.end_date !== formattedDate) {
        console.error('[PhaseTimelineService] Database value does not match expected value!');
        toast.error('End date was not saved correctly');
        return false;
      }

      // console.log('[PhaseTimelineService] End date updated successfully');
      toast.success(endDate ? 'End date updated' : 'End date cleared');

      // Snapshot baseline if not yet set
      if (data?.[0]?.product_id) {
        TimelineDriftService.snapshotBaseline(data[0].product_id).catch(() => {});
      }

      return true;

    } catch (error) {
      console.error('[PhaseTimelineService] Unexpected error in updatePhaseEndDate:', error);
      toast.error('An unexpected error occurred');
      return false;
    }
  }

  /**
   * Atomically update both start and end dates in a single query
   * to avoid violating the check_phase_date_order constraint
   */
  static async updatePhaseDates(phaseId: string, startDate: Date | undefined, endDate: Date | undefined): Promise<boolean> {
    try {
      if (!phaseId) {
        toast.error('Phase ID is required');
        return false;
      }

      const formattedStart = startDate ? formatDateToLocalISO(startDate) : null;
      const formattedEnd = endDate ? formatDateToLocalISO(endDate) : null;

      const { data, error } = await supabase
        .from('lifecycle_phases')
        .update({
          start_date: formattedStart,
          end_date: formattedEnd,
          updated_at: new Date().toISOString()
        })
        .eq('id', phaseId)
        .select('id, name, start_date, end_date, product_id');

      if (error) {
        console.error('[PhaseTimelineService] Atomic date update failed:', error);
        toast.error(`Failed to update dates: ${error.message}`);
        return false;
      }

      if (!data || data.length === 0) {
        toast.error('Phase not found or no changes made');
        return false;
      }

      toast.success('Dates updated');

      // Snapshot baseline if not yet set
      if (data?.[0]?.product_id) {
        TimelineDriftService.snapshotBaseline(data[0].product_id).catch(() => {});
      }

      return true;
    } catch (error) {
      console.error('[PhaseTimelineService] Unexpected error in updatePhaseDates:', error);
      toast.error('An unexpected error occurred');
      return false;
    }
  }

  /**
   * Update phase status with comprehensive logging and validation
   */
  static async updatePhaseStatus(phaseId: string, status: string): Promise<boolean> {
    

    try {
      // Validate input
      if (!phaseId) {
        console.error('[PhaseTimelineService] Phase ID is required');
        toast.error('Phase ID is required');
        return false;
      }

      if (!status) {
        console.error('[PhaseTimelineService] Status is required');
        toast.error('Status is required');
        return false;
      }

      // Get current phase data before update
      const { data: beforeData, error: beforeError } = await supabase
        .from('lifecycle_phases')
        .select('id, name, status, product_id')
        .eq('id', phaseId)
        .single();

      if (beforeError) {
        console.error('[PhaseTimelineService] Failed to fetch phase before update:', beforeError);
        toast.error('Failed to fetch phase data');
        return false;
      }

      // console.log('[PhaseTimelineService] Phase before status update:', beforeData);

      // Perform the update
      const { data, error } = await supabase
        .from('lifecycle_phases')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', phaseId)
        .select('id, name, status, product_id');

     

      if (error) {
        console.error('[PhaseTimelineService] Status update failed:', error);
        toast.error(`Failed to update phase status: ${error.message}`);
        return false;
      }

      if (!data || data.length === 0) {
        console.error('[PhaseTimelineService] No rows updated - phase may not exist');
        toast.error('Phase not found or no changes made');
        return false;
      }

      // console.log('[PhaseTimelineService] Phase status updated successfully');
      toast.success(`Phase status updated to: ${status}`);
      return true;

    } catch (error) {
      console.error('[PhaseTimelineService] Unexpected error in updatePhaseStatus:', error);
      toast.error('An unexpected error occurred');
      return false;
    }
  }

  /**
   * Update phase assigned user
   */
  static async updatePhaseAssignedTo(phaseId: string, assignedTo: string | null): Promise<boolean> {
    try {
      if (!phaseId) {
        console.error('[PhaseTimelineService] Phase ID is required');
        toast.error('Phase ID is required');
        return false;
      }

      const { data, error } = await supabase
        .from('company_phases')
        .update({
          assigned_to: assignedTo,
          updated_at: new Date().toISOString()
        })
        .eq('id', phaseId)
        .select();

      if (error) {
        console.error('[PhaseTimelineService] Error updating phase assigned user:', error);
        toast.error('Failed to update assigned user');
        return false;
      }

      if (!data || data.length === 0) {
        console.error('[PhaseTimelineService] Phase not found or no changes made');
        toast.error('Phase not found or no changes made');
        return false;
      }

      // console.log('[PhaseTimelineService] Phase assigned user updated successfully');
      toast.success(assignedTo ? 'Assigned user updated' : 'Assigned user cleared');
      return true;

    } catch (error) {
      console.error('[PhaseTimelineService] Unexpected error in updatePhaseAssignedTo:', error);
      toast.error('An unexpected error occurred');
      return false;
    }
  }

  /**
   * Update phase reviewer group and trigger CI review workflows
   */
  static async updatePhaseReviewerGroup(phaseId: string, reviewerGroupId: string | null): Promise<boolean> {
    try {
      if (!phaseId) {
        console.error('[PhaseTimelineService] Phase ID is required');
        toast.error('Phase ID is required');
        return false;
      }

      // Get current user for assignment tracking
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[PhaseTimelineService] User not authenticated');
        toast.error('User not authenticated');
        return false;
      }

      const { data, error } = await supabase
        .from('company_phases')
        .update({
          reviewer_group_id: reviewerGroupId,
          updated_at: new Date().toISOString()
        })
        .eq('id', phaseId)
        .select();

      if (error) {
        console.error('[PhaseTimelineService] Error updating phase reviewer group:', error);
        toast.error('Failed to update reviewer group');
        return false;
      }

      if (!data || data.length === 0) {
        console.error('[PhaseTimelineService] Phase not found or no changes made');
        toast.error('Phase not found or no changes made');
        return false;
      }

      // If a reviewer group is assigned, trigger CI review workflows
      if (reviewerGroupId) {
        await this.triggerCIReviewWorkflows(phaseId, reviewerGroupId, user.id);
      }

      // console.log('[PhaseTimelineService] Phase reviewer group updated successfully');
      toast.success(reviewerGroupId ? 'Reviewer group updated' : 'Reviewer group cleared');
      return true;

    } catch (error) {
      console.error('[PhaseTimelineService] Unexpected error in updatePhaseReviewerGroup:', error);
      toast.error('An unexpected error occurred');
      return false;
    }
  }

  /**
   * Trigger CI review workflows when reviewer group is assigned to a phase
   */
  private static async triggerCIReviewWorkflows(phaseId: string, reviewerGroupId: string, userId: string): Promise<void> {
    try {
      // console.log('[PhaseTimelineService] Triggering CI review workflows for phase:', phaseId);

      // Import CIReviewService dynamically to avoid circular dependencies
      const { CIReviewService } = await import('./ciReviewService');

      // Get CI instances associated with this phase
      const { data: ciInstances, error: ciError } = await supabase
        .from('ci_instances')
        .select('*')
        .eq('phase_id', phaseId)
        .in('status', ['pending', 'in_progress']); // Only trigger for active CIs

      if (ciError) {
        console.error('[PhaseTimelineService] Error fetching CI instances:', ciError);
        return;
      }

      if (!ciInstances || ciInstances.length === 0) {
        // console.log('[PhaseTimelineService] No CI instances found for phase');
        return;
      }

      // Create review workflows for each CI instance
      const workflowPromises = ciInstances.map(async (ciInstance) => {
        // console.log('[PhaseTimelineService] Creating review workflow for CI:', ciInstance.title);
        
        return await CIReviewService.createCIReviewWorkflow(
          ciInstance.id,
          reviewerGroupId,
          userId,
          ciInstance.due_date
        );
      });

      const results = await Promise.all(workflowPromises);
      const successCount = results.filter(Boolean).length;
      
      // console.log(`[PhaseTimelineService] Created ${successCount}/${ciInstances.length} CI review workflows`);
      
      if (successCount > 0) {
        toast.success(`Started review process for ${successCount} CI instance(s)`);
      }

    } catch (error) {
      console.error('[PhaseTimelineService] Error triggering CI review workflows:', error);
      // Don't throw error as this shouldn't block the main phase update
    }
  }
}
