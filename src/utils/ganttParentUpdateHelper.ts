import { toast } from "sonner";

/**
 * Helper function to update parent phase/category dates when children extend beyond boundaries
 *
 * This function handles cascading date updates:
 * 1. Task → Container → Phase: Updates phase when documents/activities/audits/gap tasks extend beyond
 * 2. Phase → Sub-section → Category: Updates sub-section and category when child phases extend beyond boundaries
 * 3. Phase → Category: Updates category when child phases extend beyond category boundaries (no sub-section)
 *
 * @param childTaskId - ID of the child task/phase that was updated
 * @param ganttApi - Gantt API instance
 * @param recalculateDependentPhases - Function to recalculate dependent phases
 * @param allTasks - Array of all tasks from tasksRef.current
 */
export const updateParentPhaseDatesIfNeeded = async (
    childTaskId: string | number,
    ganttApi: any,
    recalculateDependentPhases: (phaseId: string | number, ganttApi: any) => Promise<void>,
    allTasks: any[]
) => {
    try {
        console.log('[updateParentPhaseDatesIfNeeded] Starting for child task:', childTaskId);

        const childTask = ganttApi.getTask(childTaskId);
        if (!childTask) {
            console.warn('[updateParentPhaseDatesIfNeeded] Child task not found:', childTaskId);
            return;
        }

        console.log('[updateParentPhaseDatesIfNeeded] Child task:', {
            id: childTask.id,
            type: childTask.type,
            start: childTask.start,
            end: childTask.end,
            parent: childTask.parent
        });

        // Check if the child is a phase task (to update category/sub-section parent)
        const childIdStr = childTaskId.toString();
        const isPhaseTask =
            (childTask.type === 'summary' ||
            childTask.type === 'running' ||
            childTask.type === 'overdue' ||
            childTask.type === 'on-time' ||
            childTask.type === 'not-started') &&
            !childIdStr.startsWith('subsection-') &&
            !childIdStr.startsWith('design_review_');

        if (isPhaseTask) {
            // Scenario 2: Phase → Sub-section → Category or Phase → Category
            return await updateCategoryDatesForPhase(childTaskId, childTask, ganttApi, allTasks);
        }

        // Scenario 1: Task → Container → Phase (original logic)
        // Get the container parent (Documents, Gap Analysis, Activities, or Audits)
        const containerTaskId = childTask.parent;
        if (!containerTaskId) {
            console.warn('[updateParentPhaseDatesIfNeeded] No container parent found');
            return;
        }

        const containerTask = ganttApi.getTask(containerTaskId);
        if (!containerTask) {
            console.warn('[updateParentPhaseDatesIfNeeded] Container task not found:', containerTaskId);
            return;
        }

        console.log('[updateParentPhaseDatesIfNeeded] Container task:', {
            id: containerTask.id,
            parent: containerTask.parent
        });

        // Get the phase parent
        const phaseTaskId = containerTask.parent;
        if (!phaseTaskId) {
            console.warn('[updateParentPhaseDatesIfNeeded] No phase parent found');
            return;
        }

        const phaseTask = ganttApi.getTask(phaseTaskId);
        if (!phaseTask) {
            console.warn('[updateParentPhaseDatesIfNeeded] Phase task not found:', phaseTaskId);
            return;
        }

        console.log('[updateParentPhaseDatesIfNeeded] Phase task:', {
            id: phaseTask.id,
            start: phaseTask.start,
            end: phaseTask.end,
            phaseId: phaseTask.phaseId
        });

        const currentPhaseStart = phaseTask.start ? new Date(phaseTask.start) : null;
        const currentPhaseEnd = phaseTask.end ? new Date(phaseTask.end) : null;

        if (!currentPhaseStart || !currentPhaseEnd) return;

        // ============================================
        // STEP 1: Update Container dates (Documents, Gap Analysis, etc.)
        // ============================================
        const currentContainerStart = containerTask.start ? new Date(containerTask.start) : null;
        const currentContainerEnd = containerTask.end ? new Date(containerTask.end) : null;

        let containerMinStart: Date | null = null;
        let containerMaxEnd: Date | null = null;

        // Find all children of THIS container only
        allTasks.forEach((task: any) => {
            // Read fresh dates from Gantt API
            const ganttTask = ganttApi.getTask(task.id);
            if (ganttTask && String(ganttTask.parent) === String(containerTaskId) && ganttTask.type === 'task') {
                const taskStart = ganttTask.start ? new Date(ganttTask.start) : null;
                const taskEnd = ganttTask.end ? new Date(ganttTask.end) : null;

                if (taskStart) {
                    if (!containerMinStart || taskStart < containerMinStart) {
                        containerMinStart = taskStart;
                    }
                }
                if (taskEnd) {
                    if (!containerMaxEnd || taskEnd > containerMaxEnd) {
                        containerMaxEnd = taskEnd;
                    }
                }
            }
        });

        // Update container if needed
        if (containerMinStart && containerMaxEnd && currentContainerStart && currentContainerEnd) {
            let containerNeedsUpdate = false;
            let newContainerStart = currentContainerStart;
            let newContainerEnd = currentContainerEnd;

            if (containerMinStart.getTime() !== currentContainerStart.getTime()) {
                newContainerStart = containerMinStart;
                containerNeedsUpdate = true;
            }
            if (containerMaxEnd.getTime() !== currentContainerEnd.getTime()) {
                newContainerEnd = containerMaxEnd;
                containerNeedsUpdate = true;
            }

            if (containerNeedsUpdate) {
                console.log('[updateParentPhaseDatesIfNeeded] Updating container:', {
                    containerId: containerTaskId,
                    oldStart: currentContainerStart,
                    oldEnd: currentContainerEnd,
                    newStart: newContainerStart,
                    newEnd: newContainerEnd
                });

                ganttApi.exec('update-task', {
                    id: containerTaskId,
                    task: {
                        start: newContainerStart,
                        end: newContainerEnd
                    }
                });
            }
        }

        // ============================================
        // STEP 2: Update Phase dates (collect from ALL containers)
        // ============================================
        let minStartDate: Date | null = null;
        let maxEndDate: Date | null = null;

        // Get all tasks and find those that belong to this phase
        // We need to traverse all containers under the phase and collect their children
        allTasks.forEach((task: any) => {
            // Check if this task is a child of the phase (container level)
            if (String(task.parent) === String(phaseTaskId)) {
                console.log('[updateParentPhaseDatesIfNeeded] Found container:', task.id);

                // Now get all children of this container - read fresh from Gantt API
                allTasks.forEach((childTask: any) => {
                    const ganttChildTask = ganttApi.getTask(childTask.id);
                    if (ganttChildTask && String(ganttChildTask.parent) === String(task.id) && ganttChildTask.type === 'task') {
                        const taskStart = ganttChildTask.start ? new Date(ganttChildTask.start) : null;
                        const taskEnd = ganttChildTask.end ? new Date(ganttChildTask.end) : null;

                        console.log('[updateParentPhaseDatesIfNeeded] Found child task:', {
                            id: ganttChildTask.id,
                            start: taskStart,
                            end: taskEnd
                        });

                        if (taskStart) {
                            if (!minStartDate || taskStart < minStartDate) {
                                minStartDate = taskStart;
                            }
                        }

                        if (taskEnd) {
                            if (!maxEndDate || taskEnd > maxEndDate) {
                                maxEndDate = taskEnd;
                            }
                        }
                    }
                });
            }
        });

        console.log('[updateParentPhaseDatesIfNeeded] All children dates:', {
            minStartDate,
            maxEndDate,
            currentPhaseStart,
            currentPhaseEnd
        });

        // Check if we need to update the phase (expand OR shrink)
        let needsUpdate = false;
        let newPhaseStart = currentPhaseStart;
        let newPhaseEnd = currentPhaseEnd;

        // Update phase start if children's earliest start is different
        if (minStartDate && minStartDate.getTime() !== currentPhaseStart.getTime()) {
            newPhaseStart = minStartDate;
            needsUpdate = true;
            if (minStartDate < currentPhaseStart) {
                console.log('[updateParentPhaseDatesIfNeeded] Child start date extends before phase start - expanding');
            } else {
                console.log('[updateParentPhaseDatesIfNeeded] Child start date is after phase start - shrinking');
            }
        }

        // Update phase end if children's latest end is different
        if (maxEndDate && maxEndDate.getTime() !== currentPhaseEnd.getTime()) {
            newPhaseEnd = maxEndDate;
            needsUpdate = true;
            if (maxEndDate > currentPhaseEnd) {
                console.log('[updateParentPhaseDatesIfNeeded] Child end date extends beyond phase end - expanding');
            } else {
                console.log('[updateParentPhaseDatesIfNeeded] Child end date is before phase end - shrinking');
            }
        }

        if (needsUpdate) {

            // Update in Gantt
            ganttApi.exec('update-task', {
                id: phaseTaskId,
                task: {
                    start: newPhaseStart,
                    end: newPhaseEnd
                }
            });

            // Update in database
            try {
                const { GanttPhaseUpdateService } = await import('@/services/ganttPhaseUpdateService');

                await GanttPhaseUpdateService.updatePhaseDates(
                    phaseTaskId,
                    newPhaseStart,
                    newPhaseEnd
                );

                // toast.success('Phase dates auto-adjusted to fit child tasks');
            } catch (error) {
                console.error('Error updating parent phase in database:', error);
                toast.error('Failed to update parent phase dates');
            }

            // Recalculate dependent phases if phase dates changed
            await recalculateDependentPhases(phaseTaskId, ganttApi);

            // Also update the category (parent of phase) to expand if needed
            const updatedPhaseTask = ganttApi.getTask(phaseTaskId);
            if (updatedPhaseTask) {
                await updateCategoryDatesForPhase(phaseTaskId, updatedPhaseTask, ganttApi, allTasks);
            }
        } else {
            console.log('[updateParentPhaseDatesIfNeeded] No update needed - phase already matches child tasks');
        }
    } catch (error) {
        console.error('[updateParentPhaseDatesIfNeeded] Error:', error);
    }
};

/**
 * Generic helper to recalculate a parent task's dates based on its direct children.
 * Works for categories (children = phases/sub-sections), sub-sections (children = phases), etc.
 * Returns true if the parent was updated.
 */
const recalculateParentDates = (
    parentTaskId: string | number,
    parentTask: any,
    ganttApi: any,
    allTasks: any[]
): boolean => {
    const currentStart = parentTask.start ? new Date(parentTask.start) : null;
    const currentEnd = parentTask.end ? new Date(parentTask.end) : null;

    if (!currentStart || !currentEnd) {
        console.warn('[recalculateParentDates] Parent has no dates:', parentTaskId);
        return false;
    }

    let minStartDate: Date | null = null;
    let maxEndDate: Date | null = null;
    const normalizedParentId = String(parentTaskId);

    // Find all direct children (phases, sub-sections, etc.)
    allTasks.forEach((task: any) => {
        const taskParentStr = String(task.parent);
        if (taskParentStr === normalizedParentId) {
            const isRelevantChild =
                task.type === 'summary' ||
                task.type === 'subsection' ||
                task.type === 'running' ||
                task.type === 'overdue' ||
                task.type === 'on-time' ||
                task.type === 'not-started';

            if (isRelevantChild) {
                // Read fresh dates from Gantt API (after update) instead of stale allTasks
                const ganttTask = ganttApi.getTask(task.id);
                const taskStart = ganttTask?.start ? new Date(ganttTask.start) : (task.start ? new Date(task.start) : null);
                const taskEnd = ganttTask?.end ? new Date(ganttTask.end) : (task.end ? new Date(task.end) : null);

                if (taskStart) {
                    if (!minStartDate || taskStart < minStartDate) {
                        minStartDate = taskStart;
                    }
                }
                if (taskEnd) {
                    if (!maxEndDate || taskEnd > maxEndDate) {
                        maxEndDate = taskEnd;
                    }
                }
            }
        }
    });

    let needsUpdate = false;
    let newStart = currentStart;
    let newEnd = currentEnd;

    if (minStartDate && minStartDate.getTime() !== currentStart.getTime()) {
        newStart = minStartDate;
        needsUpdate = true;
    }
    if (maxEndDate && maxEndDate.getTime() !== currentEnd.getTime()) {
        newEnd = maxEndDate;
        needsUpdate = true;
    }

    if (needsUpdate) {
        ganttApi.exec('update-task', {
            id: parentTaskId,
            task: { start: newStart, end: newEnd }
        });

        console.log('[recalculateParentDates] Updated:', {
            parentId: parentTaskId,
            parentName: parentTask.text,
            oldStart: currentStart.toISOString(),
            oldEnd: currentEnd.toISOString(),
            newStart: newStart.toISOString(),
            newEnd: newEnd.toISOString()
        });
    }

    return needsUpdate;
};

/**
 * Updates parent dates when a child phase extends beyond boundaries.
 * Handles both:
 *   - Phase → Sub-section → Category (sub-section cascade)
 *   - Phase → Category (direct cascade)
 */
const updateCategoryDatesForPhase = async (
    phaseTaskId: string | number,
    phaseTask: any,
    ganttApi: any,
    allTasks: any[]
) => {
    // Get the parent (could be category or sub-section)
    const parentTaskId = phaseTask.parent;
    if (!parentTaskId) return;

    const parentTask = ganttApi.getTask(parentTaskId);
    if (!parentTask) {
        console.warn('[updateCategoryDatesForPhase] Parent task not found:', parentTaskId);
        return;
    }

    // Check if parent is a sub-section
    const isSubSection = parentTaskId.toString().startsWith('subsection-');

    if (isSubSection) {
        // Phase → Sub-section: recalculate sub-section dates from child phases
        recalculateParentDates(parentTaskId, parentTask, ganttApi, allTasks);

        // Sub-section → Category: cascade up to category
        const categoryTaskId = parentTask.parent;
        if (categoryTaskId) {
            const categoryTask = ganttApi.getTask(categoryTaskId);
            if (categoryTask) {
                const isCat =
                    categoryTask.type === 'category' ||
                    categoryTaskId.toString().startsWith('category-');
                if (isCat) {
                    recalculateParentDates(categoryTaskId, categoryTask, ganttApi, allTasks);
                }
            }
        }
        return;
    }

    // Check if parent is actually a category
    const isCategoryTask =
        parentTask.type === 'category' ||
        parentTaskId.toString().startsWith('category-');

    if (!isCategoryTask) return;

    // Phase → Category: recalculate category dates
    recalculateParentDates(parentTaskId, parentTask, ganttApi, allTasks);
};
