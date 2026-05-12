import React from 'react';
import type { GanttTask, GanttLink, BarBox } from '@/types/ganttChart';
import type { TimeScale } from '@/lib/gantt/timeScale';

const BAR_HEIGHT = 28;
const DOT_R = 4.5; // half of TaskBar's connector-dot diameter (9px)
// Elbow must be ≥ marker base (8.1px = markerWidth×refX/viewBox) + DOT_R so
// the final L-bend sits outside the arrowhead's footprint — otherwise the
// line appears to enter the back of the arrowhead instead of approaching
// it cleanly from the side.
const ELBOW = 20;
// A milestone diamond is a 22×22 square rotated 45° — its visual bounding box
// is BAR_HEIGHT × √2 wide. Use this for line-connection geometry so arrows
// terminate at the diamond's actual visible vertex, not at the un-rotated box.
const MILESTONE_VISUAL = BAR_HEIGHT * Math.SQRT2;

// Half-pixel offset → SVG strokes render on the device pixel grid (no
// sub-pixel blur on 1–2 px lines).
const r = (v: number): number => Math.round(v) + 0.5;

export interface LinkPath {
    id: GanttLink['id'];
    d: string;
    midX: number;
    midY: number;
}

function makeBarBox(
    task: GanttTask,
    scale: TimeScale,
    rowIndex: number,
    rowHeight: number,
): BarBox {
    const x = scale.dateToX(task.start);
    const xEnd = scale.dateToX(task.end);

    if (task.type === 'milestone') {
        return {
            taskId: task.id,
            x: x - MILESTONE_VISUAL / 2,
            y: rowIndex * rowHeight + (rowHeight - MILESTONE_VISUAL) / 2,
            width: MILESTONE_VISUAL,
            height: MILESTONE_VISUAL,
            rowIndex,
        };
    }

    return {
        taskId: task.id,
        x,
        y: rowIndex * rowHeight + (rowHeight - BAR_HEIGHT) / 2,
        width: Math.max(2, xEnd - x),
        height: BAR_HEIGHT,
        rowIndex,
    };
}

function routePath(
    src: BarBox,
    tgt: BarBox,
    type: GanttLink['type'],
    rowHeight: number,
): { d: string; midX: number; midY: number } {
    const fromStart = type[0] === 's';
    const toStart = type[2] === 's';

    const sxRaw = fromStart ? src.x : src.x + src.width;
    const txRaw = toStart ? tgt.x : tgt.x + tgt.width;
    const syRaw = src.y + src.height / 2;
    const tyRaw = tgt.y + tgt.height / 2;

    // Stop the arrow tip just before the target's connector dot so it sits
    // flush with the dot edge instead of being half-hidden behind it.
    const targetEndXRaw = txRaw + (toStart ? -DOT_R : DOT_R);
    const stubOutRaw = sxRaw + (fromStart ? -ELBOW : ELBOW);
    const stubInRaw = txRaw + (toStart ? -ELBOW : ELBOW);

    const sx = r(sxRaw);
    const sy = r(syRaw);
    const ty = r(tyRaw);
    const targetEndX = r(targetEndXRaw);
    const stubOut = r(stubOutRaw);
    const stubIn = r(stubInRaw);

    let gutterY: number;
    if (src.rowIndex === tgt.rowIndex) {
        gutterY = r((src.rowIndex + 1) * rowHeight);
    } else {
        const downward = tgt.rowIndex > src.rowIndex;
        gutterY = r(downward ? tgt.rowIndex * rowHeight : (tgt.rowIndex + 1) * rowHeight);
    }

    const d = `M ${sx} ${sy} L ${stubOut} ${sy} L ${stubOut} ${gutterY} L ${stubIn} ${gutterY} L ${stubIn} ${ty} L ${targetEndX} ${ty}`;
    // Anchor the delete affordance at the middle of the gutter horizontal —
    // that segment is guaranteed to sit between rows, never over a bar.
    const midX = (stubOut + stubIn) / 2;
    const midY = gutterY;

    return { d, midX, midY };
}

export function computeLinkPaths(
    tasks: GanttTask[],
    links: GanttLink[],
    scale: TimeScale,
    rowHeight: number,
    rowIndexById: Map<GanttTask['id'], number>,
): LinkPath[] {
    const boxes = new Map<GanttTask['id'], BarBox>();
    for (const task of tasks) {
        const rowIndex = rowIndexById.get(task.id);
        if (rowIndex === undefined) continue;
        boxes.set(task.id, makeBarBox(task, scale, rowIndex, rowHeight));
    }

    const result: LinkPath[] = [];
    for (const link of links) {
        const src = boxes.get(link.source);
        const tgt = boxes.get(link.target);
        if (!src || !tgt) continue;
        const path = routePath(src, tgt, link.type, rowHeight);
        result.push({ id: link.id, ...path });
    }
    return result;
}

interface DependencyLayerProps {
    paths: LinkPath[];
    rangeWidth: number;
    height: number;
    selectedLinkId?: GanttLink['id'];
    onSelectLink?: (id: GanttLink['id']) => void;
}

export function DependencyLayer({
    paths,
    rangeWidth,
    height,
    selectedLinkId,
    onSelectLink,
}: DependencyLayerProps) {
    return (
        <svg
            className="absolute top-0 left-0"
            width={rangeWidth}
            height={height}
            style={{ width: rangeWidth, height }}
        >
            <defs>
                <marker
                    id="gantt-arrow"
                    viewBox="0 0 10 10"
                    markerWidth="6"
                    markerHeight="6"
                    refX="9"
                    refY="5"
                    orient="auto"
                >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="rgb(71 85 105)" />
                </marker>
                <marker
                    id="gantt-arrow-selected"
                    viewBox="0 0 10 10"
                    markerWidth="6"
                    markerHeight="6"
                    refX="9"
                    refY="5"
                    orient="auto"
                >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="rgb(239 68 68)" />
                </marker>
            </defs>
            {paths.map((p) => {
                const isSelected = p.id === selectedLinkId;
                return (
                    <g key={p.id}>
                        {/* Wide invisible hit area — a 2.25px stroke is too thin
                            to click reliably, so duplicate the path at 14px and
                            capture pointer events on the stroke. */}
                        <path
                            d={p.d}
                            fill="none"
                            stroke="transparent"
                            strokeWidth={14}
                            style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectLink?.(p.id);
                            }}
                        />
                        {/* Visible path */}
                        <path
                            d={p.d}
                            fill="none"
                            stroke={isSelected ? 'rgb(239 68 68)' : 'rgb(71 85 105)'}
                            strokeWidth={isSelected ? 3 : 2.25}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            markerEnd={
                                isSelected
                                    ? 'url(#gantt-arrow-selected)'
                                    : 'url(#gantt-arrow)'
                            }
                            style={{ pointerEvents: 'none' }}
                        />
                    </g>
                );
            })}
        </svg>
    );
}
