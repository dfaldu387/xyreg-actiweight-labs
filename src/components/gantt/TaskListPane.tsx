import React from 'react';
import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GanttTask } from '@/types/ganttChart';

interface TaskListPaneProps {
    tasks: GanttTask[];
    rowHeight: number;
    headerHeight: number;
    selectedId?: GanttTask['id'];
    onSelect?: (id: GanttTask['id']) => void;
    innerRef?: React.Ref<HTMLDivElement>;
    onWheel?: React.WheelEventHandler<HTMLDivElement>;
    collapsedIds?: Set<GanttTask['id']>;
    hasChildrenSet?: Set<GanttTask['id']>;
    depthById?: Map<GanttTask['id'], number>;
    onToggleCollapse?: (id: GanttTask['id']) => void;
}

// Per-level indent step. A row's text starts at depth*INDENT_STEP + 28px,
// so a leaf and a parent-with-chevron at the same depth align horizontally.
const INDENT_STEP = 20;

const COL_DATE_W = 84; // width of each date column

export function TaskListPane({
    tasks,
    rowHeight,
    headerHeight,
    selectedId,
    onSelect,
    innerRef,
    onWheel,
    collapsedIds,
    hasChildrenSet,
    depthById,
    onToggleCollapse,
}: TaskListPaneProps) {
    const totalWidth = 200 + COL_DATE_W * 2; // 200px task col + 2 date cols

    return (
        <div
            className="flex flex-col shrink-0 border-r border-slate-200 bg-white"
            style={{ width: totalWidth }}
        >
            {/* Sticky header row */}
            <div
                className="flex items-stretch bg-slate-50 border-b border-slate-200 sticky top-0 z-30 text-[10px] font-semibold text-slate-500 uppercase tracking-wider"
                style={{ height: headerHeight }}
            >
                <div className="flex-1 flex items-center px-3">Task</div>
                <div
                    className="flex items-center px-2 border-l border-slate-200"
                    style={{ width: COL_DATE_W }}
                >
                    Start
                </div>
                <div
                    className="flex items-center px-2 border-l border-slate-200"
                    style={{ width: COL_DATE_W }}
                >
                    End
                </div>
            </div>

            {/* Body — overflow-hidden + translateY mirrors the timeline's vertical scroll */}
            <div className="flex-1 overflow-hidden" onWheel={onWheel}>
                <div ref={innerRef} style={{ willChange: 'transform' }}>
                {tasks.map((t) => {
                    const isCategory =
                        t.type === 'category' ||
                        t.type === 'summary' ||
                        t.type === 'summarie';
                    const isMilestone = t.type === 'milestone';
                    const hasChildren = hasChildrenSet?.has(t.id) ?? false;
                    const isCollapsed = collapsedIds?.has(t.id) ?? false;
                    const depth = depthById?.get(t.id) ?? 0;
                    // Parents place the chevron in the indent slot (paddingLeft 4);
                    // leaves push their text to the same x as a sibling parent's
                    // text (chevron 20px + 4px gap = 24px past the parent's pad).
                    const paddingLeft = depth * INDENT_STEP + (hasChildren ? 4 : 28);
                    return (
                        <div
                            key={t.id}
                            onClick={() => onSelect?.(t.id)}
                            className={cn(
                                'flex items-stretch cursor-pointer transition-colors border-b border-slate-100 last:border-b-0',
                                isCategory
                                    ? 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                                    : 'hover:bg-blue-50 text-slate-700',
                                selectedId === t.id && '!bg-blue-50',
                            )}
                            style={{ height: rowHeight }}
                        >
                            {/* Task name */}
                            <div
                                className="flex-1 flex items-center gap-1 min-w-0 pr-2"
                                style={{ paddingLeft }}
                            >
                                {hasChildren ? (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleCollapse?.(t.id);
                                        }}
                                        className="shrink-0 inline-flex items-center justify-center h-5 w-5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                                        aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                                        aria-expanded={!isCollapsed}
                                    >
                                        <ChevronRight
                                            className={cn(
                                                'h-3.5 w-3.5 transition-transform duration-150',
                                                !isCollapsed && 'rotate-90',
                                            )}
                                        />
                                    </button>
                                ) : null}
                                {isMilestone && (
                                    <span className="text-amber-500 text-[10px] shrink-0">◆</span>
                                )}
                                <span
                                    className={cn(
                                        'truncate text-[13px]',
                                        isCategory ? 'font-bold' : 'font-medium',
                                    )}
                                    title={t.text}
                                >
                                    {t.text}
                                </span>
                                {t.assigned && !isCategory && !isMilestone && (
                                    <span className="ml-auto shrink-0 text-[10px] text-slate-400 truncate max-w-[70px]">
                                        {t.assigned}
                                    </span>
                                )}
                            </div>
                            {/* Start date */}
                            <div
                                className="flex items-center px-2 text-[11px] text-slate-600 border-l border-slate-100 tabular-nums"
                                style={{ width: COL_DATE_W }}
                            >
                                {format(t.start, 'MMM d, yyyy')}
                            </div>
                            {/* End date */}
                            <div
                                className="flex items-center px-2 text-[11px] text-slate-600 border-l border-slate-100 tabular-nums"
                                style={{ width: COL_DATE_W }}
                            >
                                {isMilestone ? (
                                    <span className="text-slate-300">—</span>
                                ) : (
                                    format(t.end, 'MMM d, yyyy')
                                )}
                            </div>
                        </div>
                    );
                })}
                </div>
            </div>
        </div>
    );
}
