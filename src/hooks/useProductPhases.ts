
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DefaultPhaseDatingService } from '@/services/defaultPhaseDatingService';
import { toast } from 'sonner';
import { calculateDaysFromPercentage } from '@/utils/phaseCalculations';

export interface ProductPhase {
  id: string;
  name: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  is_current_phase?: boolean;
  isCurrentPhase?: boolean;
  is_overdue?: boolean;
  position: number;
  phase_id?: string;
  likelihood_of_success?: number;
  // Template information
  template_start_date?: string;
  duration_days?: number;
  is_continuous_process?: boolean;

  start_percentage?: number;
  end_percentage?: number;
}

export interface PhaseUpdate {
  phaseId: string;
  startDate: Date;
  endDate: Date;
  position?: number;
}

export function useProductPhases(productId?: string, companyId?: string, product?: any) {
  const queryClient = useQueryClient();
  const [phases, setPhases] = useState<ProductPhase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [timelineAdvisories, setTimelineAdvisories] = useState<string[]>([]);
  const [timelineConfig, setTimelineConfig] = useState({ sequencePhases: false });
  const [hasUnscheduledPhases, setHasUnscheduledPhases] = useState(false);

  // Recursion prevention ref
  const isFetchingRef = useRef(false);

  const fetchPhases = useCallback(async () => {
    if (!productId || !companyId) return;

    // Prevent concurrent fetch operations
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // STEP 1: Fetch from lifecycle_phases table (product-specific phases)
      const { data: existingPhases, error: phasesError } = await supabase
        .from('lifecycle_phases')
        .select('*, likelihood_of_success, category_id, sub_section_id')
        .eq('product_id', productId);

      if (phasesError) {
        throw phasesError;
      }

      let lifecyclePhases = existingPhases;

      // STEP 2: Fetch from company_chosen_phases table (company activated phases)
      const { data: chosenPhases, error: chosenError } = await supabase
        .from('company_chosen_phases')
        .select(`
          phase_id,
          position,
          company_phases!inner(
            start_date,
            duration_days,
            is_continuous_process,
            start_percentage,
            end_percentage,
            name,
            description,
            assigned_to,
            reviewer_group_id
          )
        `)
        .eq('company_id', companyId);

      if (chosenError) {
        throw chosenError;
      }

      // If company has no active phases, return empty array
      if (!chosenPhases || chosenPhases.length === 0) {
        setPhases([]);
        setHasUnscheduledPhases(false);
        setTimelineAdvisories(['No phases configured for this company']);
        return;
      }

      // STEP 3: Create lookup maps for merging data
      const positionMap = new Map();
      const templateMap = new Map();
      (chosenPhases || []).forEach(cp => {
        positionMap.set(cp.phase_id, cp.position);
        templateMap.set(cp.phase_id, {
          start_date: cp.company_phases?.start_date,
          duration_days: cp.company_phases?.duration_days,
          is_continuous_process: cp.company_phases?.is_continuous_process,
          start_percentage: cp.company_phases?.start_percentage,
          end_percentage: cp.company_phases?.end_percentage,
          assigned_to: cp.company_phases?.assigned_to,
          reviewer_group_id: cp.company_phases?.reviewer_group_id
        });
      });

      // STEP 4: Transform and merge lifecycle_phases with template data
      const transformedPhases = (lifecyclePhases || []).map(phase => {
        const templateInfo = templateMap.get(phase.phase_id) || {};
        const position = positionMap.get(phase.phase_id);
        const transformed = {
          id: phase.id,
          name: phase.name,
          description: phase.description,
          position: position || 0,
          status: phase.status,
          start_date: phase.start_date,
          end_date: phase.end_date,
          phase_id: phase.phase_id,
          is_current_phase: phase.is_current_phase,
          is_overdue: phase.is_overdue,
          isCurrentPhase: phase.is_current_phase,
          likelihood_of_success: phase.likelihood_of_success || 100,
          template_start_date: templateInfo.start_date,
          duration_days: templateInfo.duration_days,
          is_continuous_process: templateInfo.is_continuous_process,
          start_percentage: templateInfo.start_percentage,
          end_percentage: templateInfo.end_percentage,
          assigned_to: templateInfo.assigned_to,
          reviewer_group_id: templateInfo.reviewer_group_id,
          category_id: phase.category_id,
          sub_section_id: phase.sub_section_id
        };
        return transformed;
      }).sort((a, b) => a.position - b.position);

      setPhases(transformedPhases);

      // Check for unscheduled phases from already-fetched data (no extra DB call)
      const hasUnscheduled = transformedPhases.length > 0 &&
        transformedPhases.some(p => !p.start_date || !p.end_date);
      setHasUnscheduledPhases(hasUnscheduled);

      // Clear advisories immediately for fast render
      setTimelineAdvisories([]);

      // NOTE: Auto-initialization removed. The UI will show a banner prompting
      // user to initialize timeline via "Settings Sync" button when hasUnscheduledPhases is true.
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Unknown error'));
      toast.error('Failed to load product phases');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [productId, companyId, product]);

  const refetch = useCallback(() => {
    return fetchPhases();
  }, [fetchPhases]);

  const handleBatchPhaseUpdates = useCallback(async (updates: PhaseUpdate[]): Promise<boolean> => {
    if (!updates.length) {
      return true;
    }

    try {
      // Validate update data
      const validUpdates = updates.filter(update => {
        if (!update.phaseId || !update.startDate || !update.endDate) {
          return false;
        }
        if (update.startDate >= update.endDate) {
          return false;
        }
        return true;
      });

      if (validUpdates.length === 0) {
        toast.error('No valid phase updates to process');
        return false;
      }

      // Prepare batch updates for lifecycle_phases
      const lifecycleUpdates = validUpdates.map(update => ({
        id: update.phaseId,
        start_date: update.startDate.toISOString().split('T')[0],
        end_date: update.endDate.toISOString().split('T')[0]
      }));

      // Prepare batch updates for positions if needed
      const positionUpdates = validUpdates
        .filter(update => update.position !== undefined)
        .map(update => ({
          phaseId: update.phaseId,
          position: update.position!
        }));

      // Execute lifecycle_phases updates in parallel
      const lifecycleUpdatePromises = lifecycleUpdates.map(async (update) => {
        try {
          const result = await supabase
            .from('lifecycle_phases')
            .update({
              start_date: update.start_date,
              end_date: update.end_date
            })
            .eq('id', update.id);

          if (result.error) {
            return { success: false, error: result.error, phaseId: update.id };
          }

          return { success: true, phaseId: update.id };
        } catch (error) {
          return { success: false, error, phaseId: update.id };
        }
      });

      // Execute position updates if any
      const positionUpdatePromises = positionUpdates.map(async (update) => {
        try {
          // Get the phase_id for the lifecycle phase
          const { data: lifecyclePhase } = await supabase
            .from('lifecycle_phases')
            .select('phase_id')
            .eq('id', update.phaseId)
            .single();

          if (!lifecyclePhase?.phase_id) {
            return { success: false, error: 'Phase ID not found', phaseId: update.phaseId };
          }

          // Update the position in company_chosen_phases
          if (companyId) {
            const result = await supabase
              .from('company_chosen_phases')
              .update({ position: update.position })
              .eq('company_id', companyId)
              .eq('phase_id', lifecyclePhase.phase_id);

            if (result.error) {
              return { success: false, error: result.error, phaseId: update.phaseId };
            }
          }

          return { success: true, phaseId: update.phaseId };
        } catch (error) {
          return { success: false, error, phaseId: update.phaseId };
        }
      });

      // Wait for all updates to complete
      const allUpdatePromises = [...lifecycleUpdatePromises, ...positionUpdatePromises];

      const results = await Promise.all(allUpdatePromises);

      // Analyze results
      const successfulUpdates = results.filter(r => r.success);
      const failedUpdates = results.filter(r => !r.success);

      if (failedUpdates.length > 0) {
        const errorMessages = failedUpdates.map(f => f.error?.message || 'Unknown error').join(', ');
        toast.error(`Failed to update ${failedUpdates.length} phases: ${errorMessages}`);

        // Still return true if some updates succeeded
        if (successfulUpdates.length > 0) {
          toast.success(`Successfully updated ${successfulUpdates.length} phases`);
        }

        return successfulUpdates.length > 0;
      }

      toast.success(`Updated ${successfulUpdates.length} phases successfully`);

      // Schedule a controlled refetch to get the latest data
      setTimeout(() => {
        if (!isFetchingRef.current) {
          fetchPhases();
        }
      }, 500);
      return true;
    } catch (error) {
      toast.error(`Failed to update phases: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }, [fetchPhases, companyId]);

  const handleSetCurrentPhase = useCallback(async (phaseId: string) => {
    if (!productId) return;

    try {
      // Clear all current phases for this product
      const { error: clearError } = await supabase
        .from('lifecycle_phases')
        .update({ is_current_phase: false })
        .eq('product_id', productId);

      if (clearError) throw clearError;

      // Set the specified phase as current
      const { error: setError } = await supabase
        .from('lifecycle_phases')
        .update({ is_current_phase: true })
        .eq('id', phaseId);

      if (setError) throw setError;

      toast.success('Current phase updated');
      await fetchPhases();
    } catch (error) {
      toast.error('Failed to set current phase');
    }
  }, [productId, fetchPhases]);

  const handlePhaseStatusChange = useCallback(async (phaseId: string, status: string) => {
    try {
      // If trying to close a phase, validate completion requirements
      if (status === 'Closed' && productId) {
        const { validatePhaseCompletionRequirements } = await import('@/utils/phaseClosureValidation');
        const validation = await validatePhaseCompletionRequirements(phaseId, productId);

        if (!validation.canClose) {
          toast.error(validation.message);
          return false;
        }
      }

      const { error } = await supabase
        .from('lifecycle_phases')
        .update({ status })
        .eq('id', phaseId);

      if (error) throw error;

      toast.success('Phase status updated');
      await fetchPhases();

      // Trigger phase synchronization across the application
      if (productId) {
        const event = new CustomEvent('productPhaseChanged', {
          detail: { productId, newPhase: status }
        });
        window.dispatchEvent(event);
      }

      return true;
    } catch (error) {
      toast.error('Failed to update phase status');
      return false;
    }
  }, [fetchPhases, productId]);

  const handleLikelihoodOfApprovalChange = useCallback(async (phaseId: string, likelihood: number) => {
    try {
      // Validate the value is between 0 and 100
      const validatedLikelihood = Math.max(0, Math.min(100, likelihood));

      const { error } = await supabase
        .from('lifecycle_phases')
        .update({ likelihood_of_success: validatedLikelihood })
        .eq('id', phaseId);

      if (error) throw error;

      toast.success('Likelihood of success updated');
      await fetchPhases();
    } catch (error) {
      toast.error('Failed to update likelihood of success');
    }
  }, [fetchPhases]);

  const updateTimelineMode = useCallback((sequencePhases: boolean) => {
    setTimelineConfig({ sequencePhases });
  }, []);

  const handlePhaseStartDateChange = useCallback(async (phaseId: string, startDate: Date | undefined) => {
    try {
      const dateString = startDate ? startDate.toISOString().split('T')[0] : null;

      // Check if new start date would conflict with existing end date
      const currentPhase = phases?.find(p => p.id === phaseId);
      if (startDate && currentPhase?.end_date) {
        const existingEndDate = new Date(currentPhase.end_date);
        if (startDate >= existingEndDate) {
          // Clear the end_date first to avoid constraint violation
          const { error: clearError } = await supabase
            .from('lifecycle_phases')
            .update({ end_date: null })
            .eq('id', phaseId);

          if (clearError) {
            toast.error(`Failed to update date: ${clearError.message}`);
            return;
          }
          toast.info('End date cleared. Please set a new end date.');
        }
      }

      const { data: updatedData, error } = await supabase
        .from('lifecycle_phases')
        .update({ start_date: dateString })
        .eq('id', phaseId)
        .select('id, start_date');

      if (error) {
        toast.error(`Failed to update start date: ${error.message}`);
        return;
      }

      // Check if any rows were actually updated
      if (!updatedData || updatedData.length === 0) {
        toast.error('Failed to update start date - no rows affected');
        return;
      }

      toast.success('Phase start date updated');

      await fetchPhases();
      // Force refetch sidebar query to update Genesis step completion
      await queryClient.refetchQueries({ queryKey: ['funnel-phases', productId], type: 'all' });
    } catch (error) {
      toast.error('Failed to update phase start date');
    }
  }, [fetchPhases, phases, queryClient, productId]);

  const handlePhaseEndDateChange = useCallback(async (phaseId: string, endDate: Date | undefined) => {
    try {
      const dateString = endDate ? endDate.toISOString().split('T')[0] : null;

      const { error } = await supabase
        .from('lifecycle_phases')
        .update({ end_date: dateString })
        .eq('id', phaseId);

      if (error) {
        // Handle specific constraint violations
        if (error.message?.includes('check_phase_date_order')) {
          toast.error('End date must be after start date. Please set the start date first or choose a later end date.');
        } else {
          toast.error(`Failed to update end date: ${error.message}`);
        }
        return;
      }

      // Update document due dates based on the new phase end date
      if (productId && dateString) {
        const { ProductDocumentDueDateService } = await import('@/services/productDocumentDueDateService');
        await ProductDocumentDueDateService.onPhaseEndDateChange(productId, phaseId, dateString);
      }

      toast.success('Phase end date updated');

      await fetchPhases();
      // Force refetch sidebar query to update Genesis step completion
      await queryClient.refetchQueries({ queryKey: ['funnel-phases', productId], type: 'all' });
    } catch (error) {
      toast.error('Failed to update phase end date');
    }
  }, [fetchPhases, productId, queryClient]);

  const initializeDefaultTimeline = useCallback(async () => {
    if (!productId) return;

    try {
      const result = await DefaultPhaseDatingService.initializeDefaultTimeline(productId);

      if (result.success) {
        toast.success(`Default 2-week timeline applied to ${result.updatedCount} phases`);
        await fetchPhases();
      } else {
        toast.error(`Failed to initialize timeline: ${result.error}`);
      }
    } catch (error) {
      toast.error('Failed to initialize default timeline');
    }
  }, [productId, fetchPhases]);

  const initializeTemplateTimeline = useCallback(async (startDate: Date = new Date()) => {
    if (!productId || !phases.length) {
      return;
    }

    // Get the product's launch date for post-launch phase calculations
    const { data: productData } = await supabase
      .from('products')
      .select('projected_launch_date, actual_launch_date')
      .eq('id', productId)
      .single();

    const actualLaunchDate = productData?.actual_launch_date ? new Date(productData.actual_launch_date) : null;
    const projectedLaunchDate = productData?.projected_launch_date ? new Date(productData.projected_launch_date) : null;
    const launchDate = actualLaunchDate || projectedLaunchDate;

    try {
      const templateUpdates: PhaseUpdate[] = [];
      let currentSequentialDate = new Date(startDate);

      // Helper function to normalize duration values
      const getNormalizedDuration = (duration: number | null | undefined, phaseName: string, isContinuous: boolean): number => {
        if (isContinuous && (phaseName === "(08) Launch & Post-Launch" || phaseName === "(C4) Post-Market Surveillance (PMS)")) {
          return 30;
        }

        if (duration === null || duration === undefined || duration === -1) {
          return 14; // Default duration
        }
        return Math.max(1, duration);
      };

      // Helper function to normalize start day values
      const getNormalizedStartDay = (startDay: number | null | undefined): number => {
        if (startDay === null || startDay === undefined || startDay === -1) {
          return 0;
        }
        return Math.max(0, startDay);
      };

      // Sort all phases by position for sequential processing
      const sortedPhases = [...phases].sort((a, b) => a.position - b.position);

      // Separate unlimited duration phases from regular phases
      const unlimitedPhases = sortedPhases.filter(p =>
        p.is_continuous_process && (p.name === "(08) Launch & Post-Launch" || p.name === "(C4) Post-Market Surveillance (PMS)")
      );
      const regularPhases = sortedPhases.filter(p => !unlimitedPhases.includes(p));

      // Process regular phases first to determine main project timeline
      let mainProjectEndDate = new Date(startDate);

      for (const phase of regularPhases) {
        let phaseStartDate: Date;
        let phaseEndDate: Date;

        if (phase.is_continuous_process) {
          phaseStartDate = new Date(startDate);

          if (phase.start_percentage !== undefined && phase.end_percentage !== undefined) {
            let cumulativeDay = 0;
            let maxEndDay = 0;
            for (const linearPhase of regularPhases.filter(p => !p.is_continuous_process).sort((a, b) => a.position - b.position)) {
              if (linearPhase.duration_days !== undefined) {
                const phaseEndDay = cumulativeDay + linearPhase.duration_days;
                maxEndDay = Math.max(maxEndDay, phaseEndDay);
                cumulativeDay = phaseEndDay;
              }
            }
            const totalProjectDays = maxEndDay > 0 ? maxEndDay : 180;

            const { endDay } = calculateDaysFromPercentage(
              phase.start_percentage,
              phase.end_percentage,
              totalProjectDays
            );

            phaseEndDate = new Date(startDate.getTime() + (endDay * 24 * 60 * 60 * 1000));
          } else {
            let cumulativeDay = 0;
            let maxEndDay = 0;
            for (const linearPhase of regularPhases.filter(p => !p.is_continuous_process).sort((a, b) => a.position - b.position)) {
              if (linearPhase.duration_days !== undefined) {
                const phaseEndDay = cumulativeDay + linearPhase.duration_days;
                maxEndDay = Math.max(maxEndDay, phaseEndDay);
                cumulativeDay = phaseEndDay;
              }
            }
            const totalProjectDays = maxEndDay > 0 ? maxEndDay : 180;
            phaseEndDate = new Date(startDate.getTime() + (totalProjectDays * 24 * 60 * 60 * 1000));
          }
        } else {
          const normalizedStartDay = getNormalizedStartDay(0);
          const normalizedDuration = getNormalizedDuration(phase.duration_days, phase.name, phase.is_continuous_process || false);
          if (normalizedStartDay === 0) {
            phaseStartDate = new Date(currentSequentialDate);
          } else {
            phaseStartDate = new Date(startDate.getTime() + (normalizedStartDay * 24 * 60 * 60 * 1000));
          }

          phaseEndDate = new Date(phaseStartDate.getTime() + (normalizedDuration * 24 * 60 * 60 * 1000));

          currentSequentialDate = new Date(phaseEndDate);
          currentSequentialDate.setDate(currentSequentialDate.getDate() + 1);
        }

        if (phaseEndDate > mainProjectEndDate) {
          mainProjectEndDate = phaseEndDate;
        }

        templateUpdates.push({
          phaseId: phase.id,
          startDate: phaseStartDate,
          endDate: phaseEndDate
        });
      }

      // Process remaining concurrent phases that may need special handling
      const remainingConcurrentPhases = regularPhases.filter(p =>
        p.is_continuous_process &&
        p.start_percentage !== undefined && p.end_percentage !== undefined
      );

      if (remainingConcurrentPhases.length > 0 && launchDate) {
        for (const phase of remainingConcurrentPhases) {
          const startDayAfterLaunch = phase.start_percentage!;
          const endDayAfterLaunch = phase.end_percentage!;

          const phaseStartDate = new Date(launchDate.getTime() + (startDayAfterLaunch * 24 * 60 * 60 * 1000));
          const phaseEndDate = endDayAfterLaunch > 0 ?
            new Date(launchDate.getTime() + (endDayAfterLaunch * 24 * 60 * 60 * 1000)) :
            new Date(launchDate.getTime() + (365 * 5 * 24 * 60 * 60 * 1000));

          templateUpdates.push({
            phaseId: phase.id,
            startDate: phaseStartDate,
            endDate: phaseEndDate
          });
        }
      }

      // Calculate extended end date for unlimited phases (105% of main project duration)
      const projectDurationMs = mainProjectEndDate.getTime() - startDate.getTime();
      const extendedEndDate = new Date(startDate.getTime() + (projectDurationMs * 1.05));

      // Process unlimited duration phases
      for (const phase of unlimitedPhases) {
        const normalizedStartDay = getNormalizedStartDay(0);
        const phaseStartDate = new Date(startDate.getTime() + (normalizedStartDay * 24 * 60 * 60 * 1000));
        const phaseEndDate = new Date(extendedEndDate);

        templateUpdates.push({
          phaseId: phase.id,
          startDate: phaseStartDate,
          endDate: phaseEndDate
        });
      }

      if (templateUpdates.length > 0) {
        const success = await handleBatchPhaseUpdates(templateUpdates);
        if (success) {
          toast.success(`Template timeline applied to ${templateUpdates.length} phases`);
        } else {
          toast.error('Failed to apply template timeline');
        }
      } else {
        toast.warning('No phases available for timeline initialization');
      }
    } catch (error) {
      toast.error(`Failed to initialize template timeline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [productId, phases, handleBatchPhaseUpdates]);

  const getPhaseLoadingState = useCallback((phaseId: string) => {
    return false;
  }, []);

  useEffect(() => {
    fetchPhases();

    // Cleanup function to reset ref on unmount
    return () => {
      isFetchingRef.current = false;
    };
  }, [fetchPhases]);

  return {
    phases,
    isLoading,
    error,
    timelineAdvisories,
    timelineConfig,
    hasUnscheduledPhases,
    fetchPhases,
    refetch,
    handleSetCurrentPhase,
    handlePhaseStatusChange,
    handleLikelihoodOfApprovalChange,
    updateTimelineMode,
    handlePhaseStartDateChange,
    handlePhaseEndDateChange,
    handleBatchPhaseUpdates,
    initializeDefaultTimeline,
    initializeTemplateTimeline,
    getPhaseLoadingState
  };
}
