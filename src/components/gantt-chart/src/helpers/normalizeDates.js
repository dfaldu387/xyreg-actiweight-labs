import * as ganttStore from '@svar-ui/gantt-store';

/**
 * Re-export normalizeDates from @svar-ui/gantt-store.
 */
export function normalizeDates(task, unit, recalc, key) {
  ganttStore.normalizeDates(task, unit, recalc, key);
}
