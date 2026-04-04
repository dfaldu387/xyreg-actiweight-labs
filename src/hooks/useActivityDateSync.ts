import { useCallback } from 'react';

interface ActivityDateSyncParams {
  companyId: string;
  productId: string;
  phaseId: string;
  phases: any[];
  activities: any[];
  updateActivity: (id: string, updates: any) => Promise<any>;
}

export function useActivityDateSync() {
  const syncActivityDatesWithPhase = useCallback(async ({
    companyId,
    productId,
    phaseId,
    phases,
    activities,
    updateActivity
  }: ActivityDateSyncParams) => {
    console.log('[useActivityDateSync] Starting sync for phase:', phaseId);
    
    // Get the phase information
    const phase = phases.find(p => p.id === phaseId);
    if (!phase || !phase.startDate || !phase.endDate) {
      console.warn('[useActivityDateSync] Phase not found or missing dates:', { phaseId, phase });
      return;
    }
    
    // Get activities for this phase
    const phaseActivities = activities.filter(a => a.phase_id === phaseId);
    console.log('[useActivityDateSync] Found activities for phase:', phaseActivities.length);
    
    if (phaseActivities.length === 0) return;
    
    // Sync activities with reasonable defaults within the phase
    const phaseStart = new Date(phase.startDate);
    const phaseEnd = new Date(phase.endDate);
    const phaseDurationDays = Math.ceil((phaseEnd.getTime() - phaseStart.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < phaseActivities.length; i++) {
      const activity = phaseActivities[i];
      
      // Calculate reasonable dates within the phase
      const activityDurationDays = Math.min(5, Math.ceil(phaseDurationDays / phaseActivities.length)); // Max 5 days per activity
      const startOffset = Math.floor((phaseDurationDays / phaseActivities.length) * i);
      
      const activityStart = new Date(phaseStart);
      activityStart.setDate(phaseStart.getDate() + startOffset);
      
      const activityEnd = new Date(activityStart);
      activityEnd.setDate(activityStart.getDate() + activityDurationDays);
      
      // Ensure activity doesn't exceed phase bounds
      if (activityEnd > phaseEnd) {
        activityEnd.setTime(phaseEnd.getTime());
      }
      
      console.log('[useActivityDateSync] Updating activity:', {
        id: activity.id,
        name: activity.name,
        newStart: activityStart.toISOString().split('T')[0],
        newEnd: activityEnd.toISOString().split('T')[0]
      });
      
      try {
        await updateActivity(activity.id, {
          start_date: activityStart.toISOString().split('T')[0],
          end_date: activityEnd.toISOString().split('T')[0]
        });
      } catch (error) {
        console.error('[useActivityDateSync] Error updating activity:', error);
      }
    }
    
    console.log('[useActivityDateSync] Sync completed for phase:', phaseId);
  }, []);
  
  return {
    syncActivityDatesWithPhase
  };
}