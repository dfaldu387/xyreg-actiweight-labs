import React from 'react';
import type { GanttTask } from '@/types/ganttChart';
import type { TimeScale } from '@/lib/gantt/timeScale';
import type { LinkEdge } from './TaskBar';

export interface LinkDraft {
    sourceId: GanttTask['id'];
    sourceEdge: LinkEdge;
    pointerX: number; // in scrollable content coords
    pointerY: number;
    overTaskId?: GanttTask['id'];
}

interface InteractionLayerProps {
    draft: LinkDraft | null;
    tasks: GanttTask[];
    scale: TimeScale;
    rowHeight: number;
    rowIndexById: Map<GanttTask['id'], number>;
    height: number;
}

const BAR_HEIGHT = 28;

export function InteractionLayer({
    draft,
    tasks,
    scale,
    rowHeight,
    rowIndexById,
    height,
}: InteractionLayerProps) {
    if (!draft) return null;

    const sourceTask = tasks.find((t) => t.id === draft.sourceId);
    if (!sourceTask) return null;

    const rowIndex = rowIndexById.get(draft.sourceId);
    if (rowIndex === undefined) return null;

    const x = scale.dateToX(sourceTask.start);
    const xEnd = scale.dateToX(sourceTask.end);
    const sx = draft.sourceEdge === 's' ? x : xEnd;
    const sy = rowIndex * rowHeight + rowHeight / 2;

    const tx = draft.pointerX;
    const ty = draft.pointerY;
    const elbow = 14;
    const stubX = sx + (draft.sourceEdge === 's' ? -elbow : elbow);
    const path = `M ${sx} ${sy} L ${stubX} ${sy} L ${stubX} ${ty} L ${tx} ${ty}`;

    return (
        <svg
            className="absolute top-0 left-0 pointer-events-none z-40"
            width={scale.rangeWidth}
            height={height}
            style={{ width: scale.rangeWidth, height }}
        >
            <defs>
                <marker
                    id="gantt-draft-arrow"
                    viewBox="0 0 10 10"
                    markerWidth="6"
                    markerHeight="6"
                    refX="9"
                    refY="5"
                    orient="auto"
                >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="rgb(59 130 246)" />
                </marker>
            </defs>
            <path
                d={path}
                fill="none"
                stroke="rgb(59 130 246)"
                strokeWidth={2.5}
                strokeDasharray="6 4"
                strokeLinejoin="round"
                strokeLinecap="round"
                markerEnd="url(#gantt-draft-arrow)"
            />
            <circle cx={sx} cy={sy} r={5} fill="rgb(59 130 246)" stroke="white" strokeWidth={2} />
            {draft.overTaskId && (
                <circle
                    cx={tx}
                    cy={ty}
                    r={6}
                    fill="rgb(34 197 94)"
                    stroke="white"
                    strokeWidth={2}
                />
            )}
        </svg>
    );
}
