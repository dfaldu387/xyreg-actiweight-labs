import React from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { GanttTask } from '@/types/ganttChart';
import type { TimeScale } from '@/lib/gantt/timeScale';

export type DragMode = 'move' | 'resize-start' | 'resize-end';
export type LinkEdge = 's' | 'e';

interface TaskBarProps {
    task: GanttTask;
    scale: TimeScale;
    rowHeight: number;
    selected?: boolean;
    onSelect?: (id: GanttTask['id']) => void;
    onBarDragStart?: (taskId: GanttTask['id'], mode: DragMode, startX: number) => void;
    onLinkDragStart?: (
        taskId: GanttTask['id'],
        edge: LinkEdge,
        startX: number,
        startY: number,
    ) => void;
    /** Render the dark progress-fill overlay inside the bar. Default false. */
    showProgress?: boolean;
}

interface BarStyle {
    base: string;
    fill: string;
    dot: string;
    label?: string; // optional text color override
}

// Palette mirrors src/components/gantt-chart/GanttChartCustom.css so the
// prototype matches the production milestones page visually.
const STATUS_FILL: Record<string, BarStyle> = {
    // Completed / on-time → green
    completed: {
        base: 'bg-emerald-600 border-emerald-800',
        fill: 'bg-emerald-800',
        dot: 'bg-emerald-700',
    },
    // Bar straddles today → yellow
    running: {
        base: 'bg-amber-400 border-amber-600',
        fill: 'bg-amber-600',
        dot: 'bg-amber-600',
        label: 'text-slate-900',
    },
    // Ended before today → red
    overdue: {
        base: 'bg-red-500 border-red-700',
        fill: 'bg-red-700',
        dot: 'bg-red-700',
    },
    // Future → gray
    'not-started': {
        base: 'bg-slate-500 border-slate-700',
        fill: 'bg-slate-700',
        dot: 'bg-slate-700',
    },
};

// Top-level grouping bars ("Product Realisation Lifecycle").
const CATEGORY_STYLE: BarStyle = {
    base: 'bg-orange-500 border-orange-700',
    fill: 'bg-orange-700',
    dot: 'bg-orange-700',
};

// Mid-level grouping bars ("Documents (N)" container).
const SUMMARY_STYLE: BarStyle = {
    base: 'bg-slate-600 border-slate-800',
    fill: 'bg-slate-800',
    dot: 'bg-slate-700',
};

// Date-driven status — same rule production uses (ganttUtils.calculateTaskTypeFromDates):
//   end < today      → overdue
//   start ≤ today    → running
//   start > today    → not-started
// Explicit progressStatus === 'completed' (or 100% progress) overrides to green.
type ComputedStatus = 'completed' | 'overdue' | 'running' | 'not-started';

function computeStatus(task: GanttTask): ComputedStatus {
    if (task.progressStatus === 'completed' || (task.progress ?? 0) >= 100) {
        return 'completed';
    }
    const now = Date.now();
    if (task.end.getTime() < now) return 'overdue';
    if (task.start.getTime() <= now) return 'running';
    return 'not-started';
}

const STATUS_LABEL: Record<ComputedStatus, string> = {
    completed: 'Completed',
    overdue: 'Overdue',
    running: 'Running',
    'not-started': 'Not Started',
};

function statusOf(task: GanttTask): BarStyle {
    if (task.type === 'category') return CATEGORY_STYLE;
    if (task.type === 'summary' || task.type === 'summarie') return SUMMARY_STYLE;
    return STATUS_FILL[computeStatus(task)];
}

const MS_PER_DAY = 86_400_000;
const dot2 = (n: number) => String(n).padStart(2, '0');
const formatDateDots = (d: Date) =>
    `${d.getFullYear()}.${dot2(d.getMonth() + 1)}.${dot2(d.getDate())}`;

const BAR_HEIGHT = 28;
const DOT_SIZE = 9;
const RESIZE_HANDLE_W = 6;

export function TaskBar({
    task,
    scale,
    rowHeight,
    selected,
    onSelect,
    onBarDragStart,
    onLinkDragStart,
    showProgress = false,
}: TaskBarProps) {
    const isMilestone = task.type === 'milestone';
    const x = scale.dateToX(task.start);
    const xEnd = scale.dateToX(task.end);
    const width = Math.max(2, xEnd - x);
    // If the data carries an explicit progress value, use it. Otherwise derive
    // a visual progress from "time elapsed" so running bars fill toward their
    // end-date, overdue bars are 100% full, and future bars are 0%.
    const progress = (() => {
        const explicit = task.progress;
        if (typeof explicit === 'number' && explicit > 0) {
            return Math.min(100, Math.max(0, explicit));
        }
        if (task.progressStatus === 'completed') return 100;
        if (task.type === 'category' || task.type === 'summary' || task.type === 'summarie') {
            return 0;
        }
        const now = Date.now();
        const startMs = task.start.getTime();
        const endMs = task.end.getTime();
        if (endMs <= startMs) return 0;
        if (now <= startMs) return 0;
        if (now >= endMs) return 100;
        return Math.round(((now - startMs) / (endMs - startMs)) * 100);
    })();
    const style = statusOf(task);
    const top = (rowHeight - BAR_HEIGHT) / 2;
    const dotY = top + BAR_HEIGHT / 2 - DOT_SIZE / 2;

    const handleBodyPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
        if (e.button !== 0) return;
        e.preventDefault();
        onBarDragStart?.(task.id, 'move', e.clientX);
    };

    const handleResizePointerDown =
        (mode: 'resize-start' | 'resize-end') =>
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            onBarDragStart?.(task.id, mode, e.clientX);
        };

    const handleDotPointerDown =
        (edge: LinkEdge) => (e: React.PointerEvent<HTMLSpanElement>) => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            onLinkDragStart?.(task.id, edge, e.clientX, e.clientY);
        };

    if (isMilestone) {
        const size = BAR_HEIGHT;
        const milestoneTop = (rowHeight - size) / 2;
        return (
            <TooltipProvider delayDuration={150}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            data-task-id={task.id}
                            onClick={() => onSelect?.(task.id)}
                            onPointerDown={handleBodyPointerDown}
                            className={cn(
                                'pointer-events-auto absolute flex items-center justify-center rounded-sm bg-amber-500 border-2 border-amber-700 hover:bg-amber-400 transition-colors cursor-grab active:cursor-grabbing',
                                selected && 'ring-2 ring-amber-400 ring-offset-1',
                            )}
                            style={{
                                left: x - size / 2,
                                top: milestoneTop,
                                width: size,
                                height: size,
                                transform: 'rotate(45deg)',
                            }}
                            aria-label={`Milestone: ${task.text}`}
                        />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                        <div className="space-y-0.5">
                            <div>
                                <span className="opacity-70">Milestone:</span>{' '}
                                <span className="font-semibold">{task.text}</span>
                            </div>
                            <div>
                                <span className="opacity-70">Date:</span>{' '}
                                <span className="font-semibold">{formatDateDots(task.start)}</span>
                            </div>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <>
            <TooltipProvider delayDuration={250}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            data-task-id={task.id}
                            onClick={() => onSelect?.(task.id)}
                            onPointerDown={handleBodyPointerDown}
                            className={cn(
                                // `peer` lets the connector-dot siblings react to
                                // this button's hover state (peer-hover:opacity-100).
                                'peer pointer-events-auto group absolute flex items-center rounded-sm border overflow-hidden transition-shadow text-left',
                                'hover:shadow-md cursor-grab active:cursor-grabbing',
                                style.base,
                                selected && 'ring-2 ring-blue-400 ring-offset-1',
                            )}
                            style={{ left: x, top, width, height: BAR_HEIGHT }}
                            aria-label={`${task.text}, ${progress}%`}
                        >
                            {/* Progress overlay — gated behind the
                                `showProgress` prop so the default look is a
                                flat solid bar matching production. */}
                            {showProgress && (
                                <div
                                    className={cn('absolute inset-y-0 left-0', style.fill)}
                                    style={{ width: `${progress}%` }}
                                />
                            )}
                            {/* Bar label */}
                            <span
                                className={cn(
                                    'relative px-2.5 text-[11px] font-bold whitespace-nowrap truncate pointer-events-none',
                                    style.label ?? 'text-white',
                                )}
                                style={
                                    style.label
                                        ? undefined
                                        : { textShadow: '0 1px 2px rgba(0,0,0,0.5)' }
                                }
                            >
                                {task.text}
                            </span>
                            {/* Resize handles */}
                            <div
                                className="absolute left-0 top-0 bottom-0 cursor-ew-resize hover:bg-white/30 z-10"
                                style={{ width: RESIZE_HANDLE_W }}
                                onPointerDown={handleResizePointerDown('resize-start')}
                            />
                            <div
                                className="absolute right-0 top-0 bottom-0 cursor-ew-resize hover:bg-white/30 z-10"
                                style={{ width: RESIZE_HANDLE_W }}
                                onPointerDown={handleResizePointerDown('resize-end')}
                            />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                        {(() => {
                            const status = computeStatus(task);
                            const durationDays = Math.max(
                                1,
                                Math.round(
                                    (task.end.getTime() - task.start.getTime()) / MS_PER_DAY,
                                ),
                            );
                            return (
                                <div className="space-y-0.5">
                                    <div>
                                        <span className="opacity-70">Task:</span>{' '}
                                        <span className="font-semibold">{task.text}</span>
                                    </div>
                                    <div>
                                        <span className="opacity-70">Status:</span>{' '}
                                        <span className="font-semibold">
                                            {STATUS_LABEL[status]}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="opacity-70">Start:</span>{' '}
                                        <span className="font-semibold">
                                            {formatDateDots(task.start)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="opacity-70">End:</span>{' '}
                                        <span className="font-semibold">
                                            {formatDateDots(task.end)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="opacity-70">Duration:</span>{' '}
                                        <span className="font-semibold">
                                            {durationDays} Days
                                        </span>
                                    </div>
                                    {task.assigned && (
                                        <div>
                                            <span className="opacity-70">Assigned:</span>{' '}
                                            <span className="font-semibold">
                                                {task.assigned}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {/* Connector dots — drag from these to create dependencies.
                Positioned fully OUTSIDE the bar's box (touching its edges)
                and hidden by default; revealed when the bar (peer) or the
                dot itself is hovered. */}
            <span
                data-task-id={task.id}
                data-task-edge="s"
                onPointerDown={handleDotPointerDown('s')}
                className={cn(
                    'pointer-events-auto absolute z-20 rounded-full ring-2 ring-white shadow-sm cursor-crosshair',
                    'opacity-0 peer-hover:opacity-100 hover:opacity-100',
                    'transition-[opacity,transform,box-shadow] duration-150 ease-out',
                    'hover:scale-[1.4] hover:ring-blue-500 hover:shadow-md hover:z-30',
                    style.dot,
                )}
                style={{
                    left: x - DOT_SIZE,
                    top: dotY,
                    width: DOT_SIZE,
                    height: DOT_SIZE,
                }}
                title="Drag to create a dependency from this task's start"
            />
            <span
                data-task-id={task.id}
                data-task-edge="e"
                onPointerDown={handleDotPointerDown('e')}
                className={cn(
                    'pointer-events-auto absolute z-20 rounded-full ring-2 ring-white shadow-sm cursor-crosshair',
                    'opacity-0 peer-hover:opacity-100 hover:opacity-100',
                    'transition-[opacity,transform,box-shadow] duration-150 ease-out',
                    'hover:scale-[1.4] hover:ring-blue-500 hover:shadow-md hover:z-30',
                    style.dot,
                )}
                style={{
                    left: x + width,
                    top: dotY,
                    width: DOT_SIZE,
                    height: DOT_SIZE,
                }}
                title="Drag to create a dependency from this task's end"
            />
        </>
    );
}
