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
    /**
     * Initial collapse state for every parent row.
     *  - false (default): all sub-trees expanded — user sees the full hierarchy.
     *  - true: every parent (anything with children) starts collapsed — only
     *    top-level rows are visible until the user clicks chevrons to expand.
     * After mount this is purely an initial value; the user's manual toggles
     * take over from there.
     */
    defaultCollapsed?: boolean;
    /**
     * Fine-grained alternative to `defaultCollapsed` — explicitly seed which
     * task IDs start collapsed. Useful when you want, say, every Documents
     * container collapsed but every phase expanded.
     */
    initialCollapsedIds?: ReadonlyArray<GanttTask['id']>;
    /**
     * Show the "time elapsed" / explicit-progress dark fill inside each bar.
     * Off by default so bars render as flat solid blocks (matches the look
     * of the production milestones page); turn on if you want the in-bar
     * progress indicator back.
     */
    showProgress?: boolean;
    /**
     * Which weekdays render as tinted weekend bands (Day/Week/Hour zoom).
     * 0 = Sunday … 6 = Saturday. Defaults to `[]` — no tinting. Pass
     * `[0, 6]` for the Western Sat+Sun convention, `[5, 6]` for Fri+Sat.
     */
    weekendDays?: readonly number[];
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

// ─── Dependency cascade (ported from src/components/gantt-chart/GanttChart.tsx) ─
// Given the freshly-dragged task's new dates, walk the dependency graph DFS
// from it and apply the four standard Gantt update rules to each downstream
// task — preserving each downstream task's original duration. After the
// initial cascade, parent/category bars are rolled up (start = min child
// start, end = max child end); if a parent's dates change, its own outgoing
// dependency links cascade too. The whole thing loops until no parent moves.
// A `visited` Set per cascade pass short-circuits cycles and diamonds.
function applyDragWithCascade(
    tasks: GanttTask[],
    links: GanttLink[],
    draggedId: GanttTask['id'],
    mode: DragMode,
    deltaMs: number,
    snapMs: number,
): GanttTask[] {
    const byId = new Map(tasks.map((t) => [t.id, t]));
    const dragged = byId.get(draggedId);
    if (!dragged) return tasks;

    // 1. Apply the drag delta to the dragged task itself.
    let nextDragged: GanttTask;
    if (mode === 'move') {
        nextDragged = {
            ...dragged,
            start: new Date(dragged.start.getTime() + deltaMs),
            end: new Date(dragged.end.getTime() + deltaMs),
        };
    } else if (mode === 'resize-start') {
        const ns = new Date(dragged.start.getTime() + deltaMs);
        if (ns.getTime() >= dragged.end.getTime() - snapMs) return tasks;
        nextDragged = { ...dragged, start: ns };
    } else if (mode === 'resize-end') {
        const ne = new Date(dragged.end.getTime() + deltaMs);
        if (ne.getTime() <= dragged.start.getTime() + snapMs) return tasks;
        nextDragged = { ...dragged, end: ne };
    } else {
        return tasks;
    }
    byId.set(nextDragged.id, nextDragged);

    // 2. Pre-index children by parent so roll-up later is O(parents) per pass.
    const childrenByParent = new Map<GanttTask['id'], GanttTask['id'][]>();
    for (const t of tasks) {
        if (t.parent === undefined || t.parent === null) continue;
        const arr = childrenByParent.get(t.parent) ?? [];
        arr.push(t.id);
        childrenByParent.set(t.parent, arr);
    }

    // Structural move: when a parent shifts (by drag or cascade), every
    // descendant shifts by the same delta. Without this, dragging anything
    // upstream of e.g. Firmware Implementation moves t4 forward via the
    // dependency graph but leaves its sub-tasks (t4-1…) behind — and the
    // roll-up step then snaps t4 back to fit them.
    const shiftDescendants = (taskId: GanttTask['id'], deltaMs: number) => {
        if (deltaMs === 0) return;
        const queue = [...(childrenByParent.get(taskId) ?? [])];
        while (queue.length > 0) {
            const cid = queue.shift()!;
            const child = byId.get(cid);
            if (child) {
                byId.set(cid, {
                    ...child,
                    start: new Date(child.start.getTime() + deltaMs),
                    end: new Date(child.end.getTime() + deltaMs),
                });
            }
            const grand = childrenByParent.get(cid);
            if (grand) queue.push(...grand);
        }
    };

    // If the user dragged a parent (or any node with descendants) in move
    // mode, the same delta applies to all descendants too.
    if (mode === 'move') {
        shiftDescendants(nextDragged.id, deltaMs);
    }

    // 3. DFS cascade routine — reused for the initial pass and for any
    //    parent whose dates change during roll-up. Each call takes its own
    //    `visited` Set so a parent's downstream chain can re-flow even when
    //    those targets were already touched by an earlier pass.
    const cascadeFrom = (seedId: GanttTask['id']) => {
        const visited = new Set<GanttTask['id']>([seedId]);
        const recurse = (sourceId: GanttTask['id']) => {
            for (const link of links) {
                if (link.source !== sourceId) continue;
                if (visited.has(link.target)) continue;
                const source = byId.get(sourceId);
                const target = byId.get(link.target);
                if (!source || !target) continue;

                const durationMs = target.end.getTime() - target.start.getTime();
                let nextStart: Date;
                let nextEnd: Date;
                switch (link.type) {
                    case 'e2s':
                        nextStart = new Date(source.end);
                        nextEnd = new Date(nextStart.getTime() + durationMs);
                        break;
                    case 's2s':
                        nextStart = new Date(source.start);
                        nextEnd = new Date(nextStart.getTime() + durationMs);
                        break;
                    case 'e2e':
                        nextEnd = new Date(source.end);
                        nextStart = new Date(nextEnd.getTime() - durationMs);
                        break;
                    case 's2e':
                        nextEnd = new Date(source.start);
                        nextStart = new Date(nextEnd.getTime() - durationMs);
                        break;
                    default:
                        continue;
                }

                // Mark visited even when unchanged, so a diamond doesn't re-enter.
                visited.add(target.id);
                if (
                    nextStart.getTime() === target.start.getTime() &&
                    nextEnd.getTime() === target.end.getTime()
                ) {
                    continue;
                }
                // All four link rules (e2s / s2s / e2e / s2e) preserve the
                // target's duration, so delta_start === delta_end — a pure
                // shift. Carry the target's descendants along by that delta
                // so a parent target doesn't "leave its children behind".
                const targetDelta = nextStart.getTime() - target.start.getTime();
                byId.set(target.id, { ...target, start: nextStart, end: nextEnd });
                shiftDescendants(target.id, targetDelta);
                recurse(target.id);
            }
        };
        recurse(seedId);
    };

    // 4. Initial cascade from the dragged task.
    cascadeFrom(nextDragged.id);

    // 5. Roll-up loop: parent.start = min(child.start), parent.end =
    //    max(child.end). Any parent whose dates change cascades from its
    //    own outgoing links too. Repeat until nothing changes. The
    //    iteration cap is purely defensive against pathological graphs.
    const MAX_ROLLUP_ITERATIONS = 16;
    for (let iter = 0; iter < MAX_ROLLUP_ITERATIONS; iter++) {
        const updatedParents: GanttTask['id'][] = [];
        for (const [parentId, childIds] of childrenByParent) {
            // The dragged task's position is user-intended. Skipping it from
            // roll-up means dragging a parent bar doesn't immediately reset
            // to fit its (unmoved) children.
            if (parentId === draggedId) continue;
            const parent = byId.get(parentId);
            if (!parent) continue;

            let minStart = Number.POSITIVE_INFINITY;
            let maxEnd = Number.NEGATIVE_INFINITY;
            for (const cid of childIds) {
                const child = byId.get(cid);
                if (!child) continue;
                const cs = child.start.getTime();
                const ce = child.end.getTime();
                if (cs < minStart) minStart = cs;
                if (ce > maxEnd) maxEnd = ce;
            }
            if (!Number.isFinite(minStart) || !Number.isFinite(maxEnd)) continue;

            if (
                parent.start.getTime() !== minStart ||
                parent.end.getTime() !== maxEnd
            ) {
                byId.set(parentId, {
                    ...parent,
                    start: new Date(minStart),
                    end: new Date(maxEnd),
                });
                updatedParents.push(parentId);
            }
        }
        if (updatedParents.length === 0) break;
        for (const pid of updatedParents) cascadeFrom(pid);
    }

    // 6. Rebuild the array preserving the original task order.
    return tasks.map((t) => byId.get(t.id) ?? t);
}

export function GanttContainer({
    tasks: initialTasks,
    links: initialLinks,
    domain,
    rowHeight = 40,
    defaultCollapsed = false,
    initialCollapsedIds,
    showProgress = false,
    weekendDays,
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
    // Seed once from props. `initialCollapsedIds` wins if both are passed.
    const [collapsedIds, setCollapsedIds] = useState<Set<GanttTask['id']>>(() => {
        if (initialCollapsedIds && initialCollapsedIds.length > 0) {
            return new Set(initialCollapsedIds);
        }
        if (defaultCollapsed) {
            // Collapse every parent EXCEPT root-level ones (parents that have
            // no parent themselves). This keeps top-level grouping bars like
            // "Product Realisation Lifecycle" expanded so the user always sees
            // their immediate children — phases, in our case. Going deeper
            // (Documents, Design Review) stays hidden until manually expanded.
            const taskById = new Map(initialTasks.map((t) => [t.id, t]));
            const collapsed = new Set<GanttTask['id']>();
            for (const t of initialTasks) {
                if (t.parent === undefined || t.parent === null) continue;
                const parent = taskById.get(t.parent);
                if (!parent) continue;
                // Only collapse the parent if it ITSELF has a parent (i.e. it's
                // not a root row).
                if (parent.parent !== undefined && parent.parent !== null) {
                    collapsed.add(parent.id);
                }
            }
            return collapsed;
        }
        return new Set();
    });
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
    // lines render off this so the drag updates everything in lockstep. The
    // cascade fires here too, so dependents shift live with the dragged bar.
    const visibleTasks = useMemo<GanttTask[]>(() => {
        if (!drag || drag.kind !== 'bar') return tasks;
        const rawDeltaMs = scale.pxToMs(drag.deltaPx);
        const deltaMs = Math.round(rawDeltaMs / snapMs) * snapMs;
        if (deltaMs === 0) return tasks;
        return applyDragWithCascade(tasks, links, drag.taskId, drag.mode, deltaMs, snapMs);
    }, [tasks, links, drag, scale, snapMs]);

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
                            applyDragWithCascade(
                                ts,
                                links,
                                current.taskId,
                                current.mode,
                                deltaMs,
                                snapMs,
                            ),
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
                            <TimelineGrid
                                scale={scale}
                                level={level}
                                height={totalHeight}
                                weekendDays={weekendDays}
                            />
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
                                        showProgress={showProgress}
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
