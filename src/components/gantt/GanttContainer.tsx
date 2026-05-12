import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGanttStore } from '@/stores/ganttStore';
import { useTimeScale } from '@/hooks/gantt/useTimeScale';
import { ZOOM_LEVELS } from '@/lib/gantt/zoomLevels';
import { TimelineHeader } from './TimelineHeader';
import { TimelineGrid, TodayMarker } from './TimelineGrid';
import { TaskBar, type DragMode, type LinkEdge } from './TaskBar';
import { DependencyLayer, computeLinkPaths } from './DependencyLayer';
import { TaskListPane } from './TaskListPane';
import { ZoomControls } from './ZoomControls';
import { InteractionLayer, type LinkDraft } from './InteractionLayer';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { GanttTask, GanttLink } from '@/types/ganttChart';

interface GanttContainerProps {
    tasks: GanttTask[];
    links: GanttLink[];
    domain: readonly [Date, Date];
    rowHeight?: number;
}

interface BarDrag {
    kind: 'bar';
    taskId: GanttTask['id'];
    mode: DragMode;
    startX: number;
    deltaPx: number;
}

interface LinkDrag {
    kind: 'link';
    sourceId: GanttTask['id'];
    sourceEdge: LinkEdge;
    pointerX: number;
    pointerY: number;
    overTaskId?: GanttTask['id'];
}

type DragInfo = BarDrag | LinkDrag | null;

const HEADER_HEIGHT = 64;

export function GanttContainer({
    tasks: initialTasks,
    links: initialLinks,
    domain,
    rowHeight = 34,
}: GanttContainerProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const taskListInnerRef = useRef<HTMLDivElement>(null);
    const level = useGanttStore((s) => s.zoom.level);
    const filters = useGanttStore((s) => s.filters);
    const setFilters = useGanttStore((s) => s.setFilters);

    const [tasks, setTasks] = useState<GanttTask[]>(initialTasks);
    const [links, setLinks] = useState<GanttLink[]>(initialLinks);
    const [selectedId, setSelectedId] = useState<GanttTask['id'] | undefined>();
    const [selectedLinkId, setSelectedLinkId] = useState<GanttLink['id'] | undefined>();
    const [collapsedIds, setCollapsedIds] = useState<Set<GanttTask['id']>>(
        () => new Set(),
    );
    const [drag, setDrag] = useState<DragInfo>(null);

    // Selecting a task bar dismisses the dependency-delete affordance so the
    // two selection states don't visually compete.
    const handleSelectTask = useCallback((id: GanttTask['id'] | undefined) => {
        setSelectedId(id);
        setSelectedLinkId(undefined);
    }, []);

    const handleSelectLink = useCallback((id: GanttLink['id']) => {
        setSelectedLinkId(id);
        setSelectedId(undefined);
    }, []);

    const handleDeleteLink = useCallback((id: GanttLink['id']) => {
        setLinks((prev) => prev.filter((l) => l.id !== id));
        setSelectedLinkId(undefined);
    }, []);

    // Escape clears any active link selection.
    useEffect(() => {
        if (selectedLinkId === undefined) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedLinkId(undefined);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [selectedLinkId]);
    const [viewportWidth, setViewportWidth] = useState(
        typeof window !== 'undefined' ? Math.max(800, window.innerWidth - 420) : 1000,
    );
    const dragRef = useRef<DragInfo>(null);
    dragRef.current = drag;

    // Track the scrollable area's width so the time scale can clamp its
    // pxPerDay to never render narrower than the viewport.
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const update = () => setViewportWidth(el.clientWidth);
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const scale = useTimeScale(domain, viewportWidth);
    const snapMs = ZOOM_LEVELS[level].snapMs;

    // Apply current drag to produce visible (in-flight) tasks. Bars and dependency
    // lines render off this so the drag updates everything in lockstep.
    const visibleTasks = useMemo<GanttTask[]>(() => {
        if (!drag || drag.kind !== 'bar') return tasks;
        const rawDeltaMs = scale.pxToMs(drag.deltaPx);
        const deltaMs = Math.round(rawDeltaMs / snapMs) * snapMs;
        return tasks.map((t) => {
            if (t.id !== drag.taskId) return t;
            if (drag.mode === 'move') {
                return {
                    ...t,
                    start: new Date(t.start.getTime() + deltaMs),
                    end: new Date(t.end.getTime() + deltaMs),
                };
            }
            if (drag.mode === 'resize-start') {
                const newStart = new Date(t.start.getTime() + deltaMs);
                if (newStart.getTime() >= t.end.getTime() - snapMs) return t;
                return { ...t, start: newStart };
            }
            if (drag.mode === 'resize-end') {
                const newEnd = new Date(t.end.getTime() + deltaMs);
                if (newEnd.getTime() <= t.start.getTime() + snapMs) return t;
                return { ...t, end: newEnd };
            }
            return t;
        });
    }, [tasks, drag, scale, snapMs]);

    // hasChildren is derived from the full task set (not the filtered list)
    // so a parent keeps its chevron even when its children are filtered out.
    const hasChildrenSet = useMemo(() => {
        const set = new Set<GanttTask['id']>();
        for (const t of visibleTasks) {
            if (t.parent !== undefined && t.parent !== null) set.add(t.parent);
        }
        return set;
    }, [visibleTasks]);

    // Depth of each task in the hierarchy (0 = root). Used by the task list
    // to compute per-level indentation for arbitrarily-deep sub-task trees.
    const depthById = useMemo(() => {
        const byId = new Map<GanttTask['id'], GanttTask>();
        for (const t of visibleTasks) byId.set(t.id, t);
        const depths = new Map<GanttTask['id'], number>();
        const depthOf = (id: GanttTask['id']): number => {
            const cached = depths.get(id);
            if (cached !== undefined) return cached;
            const task = byId.get(id);
            if (!task || task.parent === undefined || task.parent === null) {
                depths.set(id, 0);
                return 0;
            }
            const d = depthOf(task.parent) + 1;
            depths.set(id, d);
            return d;
        };
        for (const t of visibleTasks) depthOf(t.id);
        return depths;
    }, [visibleTasks]);

    const filteredTasks = useMemo(() => {
        const q = filters.search.trim().toLowerCase();
        let result = visibleTasks;
        if (q) {
            result = result.filter(
                (t) =>
                    t.text.toLowerCase().includes(q) ||
                    (t.assigned ?? '').toString().toLowerCase().includes(q),
            );
        }
        if (collapsedIds.size > 0) {
            // Walk up each task's parent chain; hide if any ancestor is collapsed.
            const byId = new Map(result.map((t) => [t.id, t] as const));
            const isHiddenById = new Map<GanttTask['id'], boolean>();
            const isHidden = (id: GanttTask['id']): boolean => {
                const cached = isHiddenById.get(id);
                if (cached !== undefined) return cached;
                const task = byId.get(id);
                if (!task || task.parent === undefined || task.parent === null) {
                    isHiddenById.set(id, false);
                    return false;
                }
                const hidden = collapsedIds.has(task.parent) || isHidden(task.parent);
                isHiddenById.set(id, hidden);
                return hidden;
            };
            result = result.filter((t) => !isHidden(t.id));
        }
        return result;
    }, [visibleTasks, filters.search, collapsedIds]);

    const handleToggleCollapse = useCallback((id: GanttTask['id']) => {
        setCollapsedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const rowIndexById = useMemo(() => {
        const m = new Map<GanttTask['id'], number>();
        filteredTasks.forEach((t, i) => m.set(t.id, i));
        return m;
    }, [filteredTasks]);

    const totalHeight = filteredTasks.length * rowHeight;

    // Compute path geometry once per render — shared by DependencyLayer (for
    // drawing) and the delete button overlay (for midpoint positioning).
    const linkPaths = useMemo(
        () => computeLinkPaths(filteredTasks, links, scale, rowHeight, rowIndexById),
        [filteredTasks, links, scale, rowHeight, rowIndexById],
    );

    const selectedLinkPath = useMemo(
        () =>
            selectedLinkId !== undefined
                ? linkPaths.find((p) => p.id === selectedLinkId)
                : undefined,
        [linkPaths, selectedLinkId],
    );

    // Mirror right-pane vertical scroll onto the task list via transform.
    // Direct DOM mutation avoids a React re-render on every scroll frame.
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const inner = taskListInnerRef.current;
        if (inner) inner.style.transform = `translateY(${-e.currentTarget.scrollTop}px)`;
    }, []);

    // When the row count shrinks (e.g., a parent is collapsed), the browser
    // may silently clamp the right pane's scrollTop without firing a scroll
    // event. Re-mirror manually so the task list stays aligned.
    useEffect(() => {
        const el = scrollRef.current;
        const inner = taskListInnerRef.current;
        if (el && inner) {
            inner.style.transform = `translateY(${-el.scrollTop}px)`;
        }
    }, [filteredTasks.length]);

    // Forward wheel events over the task list back to the timeline scroller,
    // so the mouse wheel feels native even though the left pane doesn't scroll.
    const handleTaskListWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTop += e.deltaY;
        el.scrollLeft += e.deltaX;
    }, []);

    const jumpToToday = useCallback(() => {
        const today = new Date();
        if (today < domain[0] || today > domain[1]) return;
        const x = scale.dateToX(today);
        const el = scrollRef.current;
        if (el) {
            el.scrollTo({ left: Math.max(0, x - el.clientWidth / 2), behavior: 'smooth' });
        }
    }, [domain, scale]);

    useEffect(() => {
        jumpToToday();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Drag handlers (TaskBar callbacks) ───────────────────────────────
    const handleBarDragStart = useCallback(
        (taskId: GanttTask['id'], mode: DragMode, startX: number) => {
            setDrag({ kind: 'bar', taskId, mode, startX, deltaPx: 0 });
        },
        [],
    );

    const handleLinkDragStart = useCallback(
        (taskId: GanttTask['id'], edge: LinkEdge, clientX: number, clientY: number) => {
            const el = scrollRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const px = clientX - rect.left + el.scrollLeft;
            const py = clientY - rect.top + el.scrollTop - HEADER_HEIGHT;
            setDrag({ kind: 'link', sourceId: taskId, sourceEdge: edge, pointerX: px, pointerY: py });
        },
        [],
    );

    // ─── Global pointer handlers (active during drag) ────────────────────
    useEffect(() => {
        if (!drag) return;

        const onMove = (e: PointerEvent) => {
            const current = dragRef.current;
            if (!current) return;
            if (current.kind === 'bar') {
                setDrag({ ...current, deltaPx: e.clientX - current.startX });
            } else if (current.kind === 'link') {
                const el = scrollRef.current;
                if (!el) return;
                const rect = el.getBoundingClientRect();
                const px = e.clientX - rect.left + el.scrollLeft;
                const py = e.clientY - rect.top + el.scrollTop - HEADER_HEIGHT;

                // Hit-test: which task is the pointer over?
                const hit = document.elementFromPoint(e.clientX, e.clientY);
                const taskEl = hit?.closest('[data-task-id]') as HTMLElement | null;
                const taskId = taskEl?.dataset.taskId;
                const overTaskId =
                    taskId && taskId !== current.sourceId ? taskId : undefined;

                setDrag({ ...current, pointerX: px, pointerY: py, overTaskId });
            }
        };

        const onUp = (e: PointerEvent) => {
            const current = dragRef.current;
            if (!current) {
                setDrag(null);
                return;
            }
            if (current.kind === 'bar') {
                const deltaPx = e.clientX - current.startX;
                if (Math.abs(deltaPx) >= 3) {
                    const rawDeltaMs = scale.pxToMs(deltaPx);
                    const deltaMs = Math.round(rawDeltaMs / snapMs) * snapMs;
                    if (deltaMs !== 0) {
                        setTasks((ts) =>
                            ts.map((t) => {
                                if (t.id !== current.taskId) return t;
                                if (current.mode === 'move') {
                                    return {
                                        ...t,
                                        start: new Date(t.start.getTime() + deltaMs),
                                        end: new Date(t.end.getTime() + deltaMs),
                                    };
                                }
                                if (current.mode === 'resize-start') {
                                    const newStart = new Date(t.start.getTime() + deltaMs);
                                    if (newStart.getTime() >= t.end.getTime() - snapMs) return t;
                                    return { ...t, start: newStart };
                                }
                                if (current.mode === 'resize-end') {
                                    const newEnd = new Date(t.end.getTime() + deltaMs);
                                    if (newEnd.getTime() <= t.start.getTime() + snapMs) return t;
                                    return { ...t, end: newEnd };
                                }
                                return t;
                            }),
                        );
                    }
                }
            } else if (current.kind === 'link') {
                const hit = document.elementFromPoint(e.clientX, e.clientY);
                const taskEl = hit?.closest('[data-task-id]') as HTMLElement | null;
                const targetId = taskEl?.dataset.taskId;
                const targetEdge = taskEl?.dataset.taskEdge as LinkEdge | undefined;

                if (targetId && targetId !== current.sourceId) {
                    const linkType =
                        `${current.sourceEdge}2${targetEdge ?? 's'}` as GanttLink['type'];
                    // Avoid duplicate links
                    setLinks((ls) => {
                        const exists = ls.some(
                            (l) =>
                                l.source === current.sourceId &&
                                l.target === targetId &&
                                l.type === linkType,
                        );
                        if (exists) return ls;
                        return [
                            ...ls,
                            {
                                id: `new-${Date.now()}`,
                                source: current.sourceId,
                                target: targetId,
                                type: linkType,
                            },
                        ];
                    });
                }
            }
            setDrag(null);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
        return () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
        };
    }, [drag, scale, snapMs]);

    const linkDraft: LinkDraft | null =
        drag && drag.kind === 'link'
            ? {
                  sourceId: drag.sourceId,
                  sourceEdge: drag.sourceEdge,
                  pointerX: drag.pointerX,
                  pointerY: drag.pointerY,
                  overTaskId: drag.overTaskId,
              }
            : null;

    const isDragging = drag !== null;

    return (
        <div className="flex flex-col h-full w-full bg-slate-50">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 px-4 h-12 bg-white border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                    <h2 className="text-sm font-semibold text-slate-900 truncate">
                        Project Timeline
                    </h2>
                    <span className="text-[11px] text-slate-500 px-2 py-0.5 rounded-full bg-slate-100 font-medium">
                        {filteredTasks.length} tasks · {links.length} dependencies
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                            placeholder="Search tasks…"
                            value={filters.search}
                            onChange={(e) => setFilters({ search: e.target.value })}
                            className="h-8 pl-8 w-56 text-sm"
                        />
                    </div>
                    <ZoomControls onJumpToToday={jumpToToday} />
                </div>
            </div>

            {/* Body */}
            <div
                className={`flex flex-1 min-h-0 overflow-hidden ${
                    isDragging ? 'select-none cursor-grabbing' : ''
                }`}
            >
                <TaskListPane
                    tasks={filteredTasks}
                    rowHeight={rowHeight}
                    headerHeight={HEADER_HEIGHT}
                    selectedId={selectedId}
                    onSelect={handleSelectTask}
                    innerRef={taskListInnerRef}
                    onWheel={handleTaskListWheel}
                    collapsedIds={collapsedIds}
                    hasChildrenSet={hasChildrenSet}
                    depthById={depthById}
                    onToggleCollapse={handleToggleCollapse}
                />
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-auto bg-white relative"
                >
                    <div
                        className="relative"
                        style={{ width: scale.rangeWidth, minHeight: totalHeight + HEADER_HEIGHT }}
                    >
                        <TimelineHeader scale={scale} level={level} />
                        <div
                            className="relative"
                            style={{ width: scale.rangeWidth, height: totalHeight }}
                        >
                            <TimelineGrid scale={scale} level={level} height={totalHeight} />
                            {/* Row separators with subtle alternation */}
                            {filteredTasks.map((t, i) => (
                                <div
                                    key={`row-${t.id}`}
                                    className={`absolute left-0 right-0 ${
                                        t.type === 'category' ? 'bg-slate-50/60' : ''
                                    }`}
                                    style={{
                                        top: i * rowHeight,
                                        height: rowHeight,
                                        borderBottom:
                                            i < filteredTasks.length - 1
                                                ? '1px solid rgb(241 245 249)'
                                                : 'none',
                                    }}
                                />
                            ))}
                            {/* Dependency lines — under bars */}
                            <DependencyLayer
                                paths={linkPaths}
                                rangeWidth={scale.rangeWidth}
                                height={totalHeight}
                                selectedLinkId={selectedLinkId}
                                onSelectLink={handleSelectLink}
                            />
                            {/* Task bars — wrapper is pointer-events-none so
                                clicks in the gutter pass through to the
                                DependencyLayer below; the bar button and dots
                                inside TaskBar re-enable events explicitly. */}
                            {filteredTasks.map((t, i) => (
                                <div
                                    key={`bar-${t.id}`}
                                    className="absolute left-0 right-0 pointer-events-none"
                                    style={{ top: i * rowHeight, height: rowHeight }}
                                >
                                    <TaskBar
                                        task={t}
                                        scale={scale}
                                        rowHeight={rowHeight}
                                        selected={selectedId === t.id}
                                        onSelect={handleSelectTask}
                                        onBarDragStart={handleBarDragStart}
                                        onLinkDragStart={handleLinkDragStart}
                                    />
                                </div>
                            ))}
                            {/* Drag preview overlay (rubber-band link line) */}
                            <InteractionLayer
                                draft={linkDraft}
                                tasks={filteredTasks}
                                scale={scale}
                                rowHeight={rowHeight}
                                rowIndexById={rowIndexById}
                                height={totalHeight}
                            />
                            {/* Delete-link affordance — shown at the midpoint
                                of the selected dependency's gutter segment. */}
                            {selectedLinkPath && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteLink(selectedLinkPath.id);
                                    }}
                                    className="absolute inline-flex items-center justify-center rounded-full bg-red-500 text-white shadow-md ring-2 ring-white hover:bg-red-600 transition-colors"
                                    style={{
                                        left: selectedLinkPath.midX - 11,
                                        top: selectedLinkPath.midY - 11,
                                        width: 22,
                                        height: 22,
                                        zIndex: 35,
                                    }}
                                    aria-label="Delete dependency"
                                    title="Delete dependency (Esc to cancel)"
                                >
                                    <X className="h-3.5 w-3.5" strokeWidth={3} />
                                </button>
                            )}
                            {/* Today marker — rendered last so it floats above bars and arrows */}
                            <TodayMarker scale={scale} height={totalHeight} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 px-4 h-8 bg-white border-t border-slate-200 text-[11px] text-slate-600 shrink-0">
                <span className="font-semibold text-slate-500 uppercase tracking-wide text-[10px]">
                    Legend
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-5 rounded-sm bg-violet-600" /> Phase
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-5 rounded-sm bg-emerald-500" /> Completed
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-5 rounded-sm bg-blue-500" /> In progress
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-5 rounded-sm bg-slate-400" /> Not started
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span
                        className="h-3 w-3 bg-amber-500 border border-amber-700"
                        style={{ transform: 'rotate(45deg)' }}
                    />{' '}
                    Milestone
                </span>
                <span className="inline-flex items-center gap-1.5 ml-auto">
                    <span className="h-3 w-0.5 bg-red-500" /> Today
                </span>
                <span className="text-slate-400">
                    Drag bars to move · drag edges to resize · drag dots to link
                </span>
            </div>
        </div>
    );
}
