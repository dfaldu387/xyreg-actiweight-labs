import { GanttTask } from "@/types/ganttChart";

/**
 * Calculates the date range from an array of Gantt tasks
 * @param tasks - Array of Gantt tasks
 * @param paddingDays - Number of days to add as padding (default: 7 days)
 * @returns Object with start and end dates
 */
export function calculateDateRange(
    tasks: GanttTask[],
    paddingDays: number = 7
): { start: Date; end: Date } {
    if (!tasks || tasks.length === 0) {
        // Default to current date + 90 days if no tasks
        return {
            start: new Date(),
            end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        };
    }

    // Extract all dates from tasks
    const dates = tasks.flatMap((task) => [task.start, task.end]);
    
    // Find min and max dates
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Add padding
    const padding = paddingDays * 24 * 60 * 60 * 1000;
    return {
        start: new Date(minDate.getTime() - padding),
        end: new Date(maxDate.getTime() + padding),
    };
}

