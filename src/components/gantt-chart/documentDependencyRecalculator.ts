import { MutableRefObject } from "react";
import { GanttLink, GanttTask } from "@/types/ganttChart";

type UpdateParentFn = (
    targetTaskId: string | number,
    ganttApi: any,
    recalcPhaseDependencies: (phaseId: string | number, ganttApi: any) => Promise<void>,
    tasks: GanttTask[]
) => Promise<void>;

type RecalcArgs = {
    linksRef: MutableRefObject<GanttLink[]>;
    tasksRef: MutableRefObject<GanttTask[]>;
    isDocumentTaskId: (id: string | number | undefined) => boolean;
    stripTaskPrefix: (id: string, prefix: string) => string;
    updateParentFn: UpdateParentFn;
    recalcPhaseDependencies: (phaseId: string | number, ganttApi: any) => Promise<void>;
};

type GenericRecalcArgs = {
    linksRef: MutableRefObject<GanttLink[]>;
    tasksRef: MutableRefObject<GanttTask[]>;
    updateParentFn: UpdateParentFn;
    recalcPhaseDependencies: (phaseId: string | number, ganttApi: any) => Promise<void>;
    isTargetTaskId: (id: string | number | undefined) => boolean;
    extractEntityId?: (id: string | number) => string | null;
    persistUpdates?: (entityId: string, newEnd: Date, newStart: Date) => Promise<void>;
};

export interface DocumentDependencyRecalculator {
    recalc: (sourceTaskId: string | number, ganttApi: any) => Promise<void>;
    isRunning: () => boolean;
}

export function createTaskDependencyRecalculator({
    linksRef,
    tasksRef,
    updateParentFn,
    recalcPhaseDependencies,
    isTargetTaskId,
    extractEntityId,
    persistUpdates
}: GenericRecalcArgs): DocumentDependencyRecalculator {
    let recursionDepth = 0;
    const dayMs = 24 * 60 * 60 * 1000;

    const recalcInternal = async (
        sourceTaskId: string | number,
        ganttApi: any,
        visited: Set<string>
    ) => {
        if (!ganttApi || sourceTaskId === null || sourceTaskId === undefined) {
            return;
        }

        const currentLinks = linksRef.current;

        if (!currentLinks || currentLinks.length === 0) {
            return;
        }

        const normalizedSourceId = sourceTaskId.toString();

        if (visited.has(normalizedSourceId)) {
            console.warn(
                "[GanttChart] Circular dependency detected among linked tasks:",
                Array.from(visited).concat(normalizedSourceId).join(" -> ")
            );
            return;
        }

        const updatedVisited = new Set(visited);
        updatedVisited.add(normalizedSourceId);

        const outgoingLinks = currentLinks.filter(
            (link: GanttLink) => link.source?.toString() === normalizedSourceId
        );

        if (outgoingLinks.length === 0) {
            return;
        }

        const sourceTask = ganttApi.getTask(sourceTaskId);
        if (!sourceTask) {
            return;
        }

        const sourceStart = sourceTask.start ? new Date(sourceTask.start) : null;
        const sourceEnd = sourceTask.end ? new Date(sourceTask.end) : null;

        if (!sourceStart || !sourceEnd) {
            return;
        }

        for (const link of outgoingLinks) {
            const targetTaskId = link.target;

            if (!isTargetTaskId(targetTaskId)) {
                continue;
            }

            const targetTask = ganttApi.getTask(targetTaskId);
            if (!targetTask) {
                continue;
            }

            const targetStart = targetTask.start ? new Date(targetTask.start) : null;
            const targetEnd = targetTask.end ? new Date(targetTask.end) : null;

            if (!targetStart || !targetEnd) {
                continue;
            }

            const durationDays = Math.max(
                1,
                Math.ceil((targetEnd.getTime() - targetStart.getTime()) / dayMs)
            );

            let newTargetStart = targetStart;
            let newTargetEnd = targetEnd;
            let needsUpdate = false;

            switch (link.type) {
                case "e2s": {
                    // FS: Target starts on source end date
                    if (targetStart.getTime() !== sourceEnd.getTime()) {
                        newTargetStart = new Date(sourceEnd);
                        newTargetEnd = new Date(newTargetStart.getTime() + durationDays * dayMs);
                        needsUpdate = true;
                    }
                    break;
                }
                case "s2s": {
                    if (targetStart.getTime() !== sourceStart.getTime()) {
                        newTargetStart = new Date(sourceStart);
                        newTargetEnd = new Date(newTargetStart.getTime() + durationDays * dayMs);
                        needsUpdate = true;
                    }
                    break;
                }
                case "e2e": {
                    if (targetEnd.getTime() !== sourceEnd.getTime()) {
                        newTargetEnd = new Date(sourceEnd);
                        newTargetStart = new Date(newTargetEnd.getTime() - durationDays * dayMs);
                        needsUpdate = true;
                    }
                    break;
                }
                case "s2e": {
                    if (targetEnd.getTime() !== sourceStart.getTime()) {
                        newTargetEnd = new Date(sourceStart);
                        newTargetStart = new Date(newTargetEnd.getTime() - durationDays * dayMs);
                        needsUpdate = true;
                    }
                    break;
                }
                default:
                    break;
            }

            if (!needsUpdate) {
                continue;
            }

            try {
                const updatedDuration = Math.max(
                    1,
                    Math.ceil((newTargetEnd.getTime() - newTargetStart.getTime()) / dayMs)
                );

                ganttApi.exec("update-task", {
                    id: targetTaskId,
                    task: {
                        ...targetTask,
                        start: newTargetStart,
                        end: newTargetEnd,
                        duration: updatedDuration
                    }
                });

                const targetTaskInRef = tasksRef.current.find((t: any) => t.id === targetTaskId);
                if (targetTaskInRef) {
                    targetTaskInRef.start = newTargetStart;
                    targetTaskInRef.end = newTargetEnd;
                    targetTaskInRef.duration = updatedDuration;
                }

                if (extractEntityId && persistUpdates) {
                    const entityId = extractEntityId(targetTaskId);
                    if (entityId) {
                        try {
                            await persistUpdates(entityId, newTargetEnd, newTargetStart);
                        } catch (entityUpdateError) {
                            console.error(
                                "[GanttChart] Failed updating dependent linked task:",
                                entityId,
                                entityUpdateError
                            );
                        }
                    }
                }

                try {
                    await updateParentFn(
                        targetTaskId,
                        ganttApi,
                        recalcPhaseDependencies,
                        tasksRef.current
                    );
                } catch (parentError) {
                    console.error(
                        "[GanttChart] Error updating parent after dependency recalculation:",
                        parentError
                    );
                }

                await recalcInternal(targetTaskId, ganttApi, updatedVisited);
            } catch (recalcError) {
                console.error(
                    "[GanttChart] Error recalculating dependent linked task:",
                    targetTaskId,
                    recalcError
                );
            }
        }
    };

    const recalc = async (sourceTaskId: string | number, ganttApi: any) => {
        if (!ganttApi || sourceTaskId === null || sourceTaskId === undefined) {
            return;
        }

        recursionDepth += 1;

        try {
            await recalcInternal(sourceTaskId, ganttApi, new Set());
        } finally {
            recursionDepth = Math.max(0, recursionDepth - 1);
        }
    };

    return {
        recalc,
        isRunning: () => recursionDepth > 0
    };
}

export function createDocumentDependencyRecalculator({
    linksRef,
    tasksRef,
    isDocumentTaskId,
    stripTaskPrefix,
    updateParentFn,
    recalcPhaseDependencies
}: RecalcArgs): DocumentDependencyRecalculator {
    return createTaskDependencyRecalculator({
        linksRef,
        tasksRef,
        updateParentFn,
        recalcPhaseDependencies,
        isTargetTaskId: isDocumentTaskId,
        extractEntityId: (taskId: string | number) => {
            if (typeof taskId !== "string") {
                return null;
            }
            return stripTaskPrefix(taskId, "doc");
        },
        persistUpdates: async (documentId: string, newEnd: Date, newStart: Date) => {
            const { GanttPhaseDocumentService } = await import(
                "@/services/ganttPhaseDocumentService"
            );
            await GanttPhaseDocumentService.updateDocumentDates(documentId, newEnd, newStart);
        }
    });
}

type GapAnalysisRecalcArgs = {
    linksRef: MutableRefObject<GanttLink[]>;
    tasksRef: MutableRefObject<GanttTask[]>;
    updateParentFn: UpdateParentFn;
    recalcPhaseDependencies: (phaseId: string | number, ganttApi: any) => Promise<void>;
    isGapAnalysisTaskId: (id: string | number | undefined) => boolean;
    stripTaskPrefix: (id: string, prefix: string) => string;
    resolveCompanyPhaseId: (identifier: string | number | null | undefined) => string | null;
};

export function createGapAnalysisDependencyRecalculator({
    linksRef,
    tasksRef,
    updateParentFn,
    recalcPhaseDependencies,
    isGapAnalysisTaskId,
    stripTaskPrefix,
    resolveCompanyPhaseId
}: GapAnalysisRecalcArgs): DocumentDependencyRecalculator {
    return createTaskDependencyRecalculator({
        linksRef,
        tasksRef,
        updateParentFn,
        recalcPhaseDependencies,
        isTargetTaskId: isGapAnalysisTaskId,
        extractEntityId: (taskId: string | number) => {
            if (typeof taskId !== "string") {
                return null;
            }
            // Extract gap item ID: gap_{uuid}_{index} -> {uuid}
            const fullId = stripTaskPrefix(taskId, "gap");
            // Remove the _XX suffix (phase_time_index)
            return fullId.replace(/_\d{2}$/, "");
        },
        persistUpdates: async (gapItemId: string, newEnd: Date, newStart: Date) => {
            const { GanttGapAnalysisService } = await import(
                "@/services/ganttGapAnalysisService"
            );
            // Get the task from tasksRef to find the phase identifier
            const gapTask = tasksRef.current.find((t: any) => {
                if (typeof t.id !== "string") return false;
                const taskGapId = stripTaskPrefix(t.id.toString(), "gap").replace(/_\d{2}$/, "");
                return taskGapId === gapItemId;
            });

            if (!gapTask) {
                console.warn("[GapAnalysisRecalculator] Gap task not found in tasksRef:", gapItemId);
                return;
            }

            // Get the phase identifier from the gap task
            const phaseIdentifier =
                (gapTask as any)?.companyPhaseId ??
                (gapTask as any)?.phase_identifier ??
                (gapTask as any)?.phase_id;

            const resolvedPhaseId = resolveCompanyPhaseId(phaseIdentifier);

            if (!resolvedPhaseId) {
                console.warn("[GapAnalysisRecalculator] Could not resolve phase ID for gap item:", gapItemId);
                return;
            }

            await GanttGapAnalysisService.updateGapItemDates(
                gapItemId,
                resolvedPhaseId,
                newEnd,
                newStart
            );
        }
    });
}

