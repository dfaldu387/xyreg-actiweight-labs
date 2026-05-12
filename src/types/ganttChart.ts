import type React from 'react';

// Gantt task interface
export interface GanttTask {
    id: string | number;
    text: string;
    start: Date;
    end: Date;
    type: 'summary' | 'summarie' | 'task' | 'milestone' | 'overdue' | 'not-started' | 'running' | 'on-time' | 'category';
    parent?: string | number;
    open?: boolean | false;
    lazy?: boolean;
    phaseId?: string;
    subTaskType?: 'document' | 'gap-analysis' | 'activities' | 'audit' | 'clinical-trials';
    documentId?: string;
    isDocumentContainer?: boolean;
    dueDate?: string;
    assigned?: string | number;
    reviewers?: Array<{ id: string; name: string; label?: string }>; // Reviewer group details
    reviewer_names?: string[]; // Reviewer group names array
    author?: string; // Author name for document tasks
    authors_ids?: string[]; // Array of author user IDs
    authors?: Array<{ id: string; name: string; label?: string }>; // Author details
    progress?: number; // Progress percentage (0-100)
    progressStatus?: 'not-started' | 'in-progress' | 'completed';
    readonly?: boolean;
    duration?: number; // Duration in days
    clicked?: boolean; // Custom click state for task type
    companyPhaseId?: string;
}

// Gantt link interface for task dependencies
export interface GanttLink {
    id: string | number;
    source: string | number;
    target: string | number;
    type: 'e2s' | 's2s' | 'e2e' | 's2e';
    linkType?: 'phase' | 'task';
}

// Event payload interfaces
export interface UpdateTaskEvent {
    id: string | number;
    task: Partial<GanttTask>;
}

export interface MoveTaskEvent {
    id: string | number;
    parent?: string | number;
    targetId?: string | number;
    reverse?: boolean;
}

// Cascading update interface
export interface CascadingUpdate {
    phaseId: string;
    phaseName: string;
    newStartDate: Date;
    newEndDate: Date;
    linkType: string;
}

// Product phase interface (for cascading calculations)
export interface ProductPhase {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  baseline_start_date?: string;
  baseline_end_date?: string;
  duration_days?: number;
  position?: number;
  phase_id?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Gantt presentation types (Phase 1).
// Server contracts above (GanttTask, GanttLink) are unchanged.
// ─────────────────────────────────────────────────────────────────────────────

export type ZoomGranularity = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface ZoomLevel {
    id: ZoomGranularity;
    pxPerDay: number;
    minorUnit: 'day' | 'week' | 'month';
    majorUnit: 'week' | 'month' | 'quarter' | 'year';
    snapMs: number;
    formatMinor: (d: Date) => string;
    formatMajor: (d: Date) => string;
}

export type ProgressStatus = NonNullable<GanttTask['progressStatus']>;

export interface GanttFilters {
    search: string;
    statuses: ProgressStatus[];
    assigneeIds: string[];
    dateRange?: { from: Date; to: Date };
}

export interface GanttSelection {
    taskIds: Set<string | number>;
    linkId?: string | number;
    activeId?: string | number;
}

export type DragKind = 'idle' | 'move' | 'resize-start' | 'resize-end' | 'link-from';

export interface DragState {
    kind: DragKind;
    taskId?: string | number;
    originStart?: Date;
    originEnd?: Date;
    deltaMs: number;
    pointerX: number;
    pointerY: number;
}

export interface BarBox {
    taskId: string | number;
    x: number;
    y: number;
    width: number;
    height: number;
    rowIndex: number;
}

export interface GanttPlugin {
    id: string;
    renderBarOverlay?: (task: GanttTask, box: BarBox) => React.ReactNode;
    renderHeaderTier?: (range: { from: Date; to: Date }) => React.ReactNode;
    onTaskUpdate?: (next: GanttTask, prev: GanttTask) => void | Promise<void>;
}