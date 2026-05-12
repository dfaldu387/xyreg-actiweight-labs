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
}

interface BarStyle {
    base: string;
    fill: string;
    dot: string;
}

const STATUS_FILL: Record<string, BarStyle> = {
    completed: {
        base: 'bg-emerald-500 border-emerald-700',
        fill: 'bg-emerald-700',
        dot: 'bg-emerald-700',
    },
    'in-progress': {
        base: 'bg-blue-500 border-blue-700',
        fill: 'bg-blue-700',
        dot: 'bg-blue-700',
    },
    'not-started': {
        base: 'bg-slate-400 border-slate-600',
        fill: 'bg-slate-600',
        dot: 'bg-slate-600',
    },
};

const CATEGORY_STYLE: BarStyle = {
    base: 'bg-violet-600 border-violet-800',
    fill: 'bg-violet-800',
    dot: 'bg-violet-800',
};

function statusOf(task: GanttTask): BarStyle {
    if (task.type === 'category' || task.type === 'summary' || task.type === 'summarie') {
        return CATEGORY_STYLE;
    }
    return STATUS_FILL[task.progressStatus ?? 'not-started'] ?? STATUS_FILL['not-started'];
}

const BAR_HEIGHT = 22;
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
}: TaskBarProps) {
    const isMilestone = task.type === 'milestone';
    const x = scale.dateToX(task.start);
    const xEnd = scale.dateToX(task.end);
    const width = Math.max(2, xEnd - x);
    const progress = Math.min(100, Math.max(0, task.progress ?? 0));
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
                        <div className="font-semibold">◆ {task.text}</div>
                        <div className="text-[11px] opacity-80">{format(task.start, 'PP')}</div>
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
                                'pointer-events-auto group absolute flex items-center rounded-md border overflow-hidden transition-shadow text-left',
                                'hover:shadow-md cursor-grab active:cursor-grabbing',
                                style.base,
                                selected && 'ring-2 ring-blue-400 ring-offset-1',
                            )}
                            style={{ left: x, top, width, height: BAR_HEIGHT }}
                            aria-label={`${task.text}, ${progress}%`}
                        >
                            {/* Progress overlay */}
                            <div
                                className={cn('absolute inset-y-0 left-0', style.fill)}
                                style={{ width: `${progress}%` }}
                            />
                            {/* Bar label */}
                            <span
                                className="relative px-2.5 text-[11px] font-bold whitespace-nowrap truncate text-white pointer-events-none"
                                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
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
                        <div className="font-semibold">{task.text}</div>
                        <div className="text-[11px] opacity-80">
                            {format(task.start, 'PP')} → {format(task.end, 'PP')}
                        </div>
                        <div className="text-[11px] mt-1">
                            Progress: <span className="font-semibold">{progress}%</span>
                            {task.assigned && (
                                <>
                                    {' · '}Assigned:{' '}
                                    <span className="font-semibold">{task.assigned}</span>
                                </>
                            )}
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {/* Connector dots — drag from these to create dependencies */}
            <span
                data-task-id={task.id}
                data-task-edge="s"
                onPointerDown={handleDotPointerDown('s')}
                className={cn(
                    'pointer-events-auto absolute z-20 rounded-full ring-2 ring-white shadow-sm cursor-crosshair',
                    'transition-[transform,box-shadow] duration-150 ease-out',
                    'hover:scale-[1.6] hover:ring-blue-500 hover:shadow-md hover:z-30',
                    style.dot,
                )}
                style={{
                    left: x - DOT_SIZE / 2,
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
                    'transition-[transform,box-shadow] duration-150 ease-out',
                    'hover:scale-[1.6] hover:ring-blue-500 hover:shadow-md hover:z-30',
                    style.dot,
                )}
                style={{
                    left: x + width - DOT_SIZE / 2,
                    top: dotY,
                    width: DOT_SIZE,
                    height: DOT_SIZE,
                }}
                title="Drag to create a dependency from this task's end"
            />
        </>
    );
}
