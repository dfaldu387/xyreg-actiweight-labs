
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Activity } from '@/types/activities';
import { toast } from 'sonner';
import { getCompanyPhaseMapping } from '@/utils/enhancedPhaseMapping';

export function useActivities(companyId: string | null, productId?: string | null, productPhases?: any[]) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use ref to track if we're currently fetching to prevent duplicate fetches
  const isFetchingRef = useRef(false);
  
  // Store latest productPhases in a ref to access without causing re-renders
  const productPhasesRef = useRef(productPhases);
  useEffect(() => {
    productPhasesRef.current = productPhases;
  }, [productPhases]);
  
  // Memoize phase IDs to detect actual changes, not just reference changes
  const phaseIds = useMemo(() => {
    if (!productPhases || productPhases.length === 0) return '';
    return productPhases.map(p => p.id).sort().join(',');
  }, [productPhases]);

  // Helper function to enrich activities with phase data
  const enrichActivities = useCallback((data: any[], phases?: any[]) => {
    return (data || []).map(activity => {
      const phaseInfo = phases?.find(phase => phase.id === activity.phase_id);
      
      // Log activity date information for debugging
      if (activity.name === 'Design Review') {
        console.log('🔍 Design Review activity details:', {
          id: activity.id,
          name: activity.name,
          start_date: activity.start_date,
          due_date: activity.due_date,
          end_date: activity.end_date,
          phase_id: activity.phase_id,
          phase_name: phaseInfo?.name
        });
      }
      
      // CRITICAL FIX: Ensure BOTH end_date AND due_date are properly set for UI consistency
      return {
        ...activity,
        end_date: activity.end_date || activity.due_date, // Map due_date to end_date if missing
        due_date: activity.due_date || activity.end_date, // Ensure due_date is also set
        phases: phaseInfo ? {
          id: phaseInfo.id,
          name: phaseInfo.name,
          start_date: phaseInfo.start_date,
          end_date: phaseInfo.end_date
        } : null
      };
    });
  }, []);

  const fetchActivities = useCallback(async () => {
    if (!companyId || isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    setIsLoading(true);
    try {
      let query = supabase
        .from('activities')
        .select('*')
        .eq('company_id', companyId);

      if (productId) {
        // Product context: show only product-specific activities
        query = query.eq('product_id', productId);
      } else {
        // Company context: show only company-level activities (product_id is null)
        query = query.is('product_id', null);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      // Enrich activities with phase information from ref (latest value)
      const enrichedActivities = enrichActivities(data, productPhasesRef.current);
      
      setActivities(enrichedActivities as any);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activities');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [companyId, productId, enrichActivities]); // Removed productPhases from deps to prevent re-fetches

  // Re-enrich activities when phases become available (only if phases actually changed)
  useEffect(() => {
    // Use ref to get latest phases without causing re-runs
    const currentPhases = productPhasesRef.current;
    
    // Only run if we have activities and phases, and phases have actually changed
    if (activities.length > 0 && currentPhases && currentPhases.length > 0 && phaseIds) {
      // Check if any activity needs enrichment (has phase_id but no phases object)
      const needsEnrichment = activities.some(activity => 
        activity.phase_id && !activity.phases
      );
      
      if (needsEnrichment) {
        console.log('🔄 Re-enriching activities with newly loaded phases');
        const enrichedActivities = enrichActivities(activities, currentPhases);
        setActivities(enrichedActivities as any);
      }
    }
    // Only depend on phaseIds (actual phase changes) and activities.length (new activities added)
    // enrichActivities is stable (no deps), so it won't cause re-runs
  }, [phaseIds, activities.length, enrichActivities]); // phaseIds changes only when phase IDs actually change

  const createActivity = async (activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert({
          ...activity,
          product_id: activity.product_id || null
        } as any)
        .select()
        .single();

      if (error) throw error;
      
      setActivities(prev => [data as Activity, ...prev]);
      toast.success('Activity created successfully');
      return data as Activity;
    } catch (error) {
      console.error('Error creating activity:', error);
      toast.error('Failed to create activity');
      throw error;
    }
  };

  const updateActivity = async (id: string, updates: Partial<Activity>) => {
    try {
      console.log('🚀 [useActivities] STARTING activity update:', { 
        id, 
        updates,
        currentActivity: activities.find(a => a.id === id)
      });
      
      // CRITICAL FIX: Update BOTH end_date AND due_date since both exist in database
      const { data: rawData, error: rawError } = await supabase
        .from('activities')
        .update({
          start_date: updates.start_date,
          end_date: updates.end_date, // Update end_date directly
          due_date: updates.end_date || updates.due_date, // Also update due_date for backward compatibility
          name: updates.name,
          type: updates.type,
          status: updates.status,
          phase_id: updates.phase_id,
          product_id: updates.product_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

      if (rawError) {
        console.error('❌ [useActivities] Database error:', rawError);
        throw rawError;
      }
      
      console.log('📀 [useActivities] Database update successful:', rawData);
      
      // CRITICAL FIX: No need to map due_date to end_date since we're updating both fields
      const phaseInfo = productPhasesRef.current?.find(phase => phase.id === rawData.phase_id);
      const enrichedActivity = {
        ...rawData,
        phases: phaseInfo ? {
          id: phaseInfo.id,
          name: phaseInfo.name,
          start_date: phaseInfo.start_date,
          end_date: phaseInfo.end_date
        } : null
      };
      
      console.log('🔧 [useActivities] Database update completed:', {
        activityId: id,
        updates: updates,
        dbResponse: { start_date: rawData.start_date, end_date: rawData.end_date, due_date: rawData.due_date }
      });
      
      console.log('🔄 [useActivities] Updating local state with enriched activity:', enrichedActivity);
      
      setActivities(prev => {
        const updated = prev.map(a => a.id === id ? enrichedActivity as Activity : a);
        console.log('🎯 [useActivities] Local state updated. New activities array:', 
          updated.map(a => ({ id: a.id, name: a.name, start_date: a.start_date, end_date: a.end_date }))
        );
        return updated;
      });
      
      toast.success('Activity updated successfully');
      return enrichedActivity as Activity;
    } catch (error) {
      console.error('❌ [useActivities] Error updating activity:', error);
      toast.error('Failed to update activity');
      throw error;
    }
  };

  const deleteActivity = async (id: string) => {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setActivities(prev => prev.filter(a => a.id !== id));
      toast.success('Activity deleted successfully');
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('Failed to delete activity');
      throw error;
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]); // Now properly depends on the memoized function

  return {
    activities,
    isLoading,
    createActivity,
    updateActivity,
    deleteActivity,
    refetch: fetchActivities
  };
}
