import React, { useMemo } from 'react';
import { eachDayOfInterval, getDay, isSameDay, startOfDay } from 'date-fns';
import type { TimeScale } from '@/lib/gantt/timeScale';
import type { ZoomGranularity } from '@/types/ganttChart';

interface TimelineGridProps {
    scale: TimeScale;
    level: ZoomGranularity;
    height: number;
    /**
     * Which weekdays to render as tinted weekend bands. Values are
     * `getDay()` indices: 0 = Sunday, 1 = Monday … 6 = Saturday. Defaults
     * to `[]` (no weekend tinting). Pass `[0, 6]` for the Western
     * convention or `[5, 6]` for Friday + Saturday.
     */
    weekendDays?: readonly number[];
}

interface TodayMarkerProps {
    scale: TimeScale;
    height: number;
}

// Rendered as a separate SVG layer so it can sit above task bars,
// dependency arrows, and the interaction overlay. TimelineGrid itself
// stays at the bottom of the z-stack (gridlines/weekend bands belong there).
// Intentionally no explicit z-index: DOM order alone places this above the
// in-row layers, while TimelineHeader's z-30 keeps the sticky header on top
// so the today line doesn't bleed across the month/year labels while scrolling.
export function TodayMarker({ scale, height }: TodayMarkerProps) {
    const today = startOfDay(new Date());
    if (today < scale.domain[0] || today > scale.domain[1]) return null;
    const todayX = scale.dateToX(today);

    return (
        <svg
            width={scale.rangeWidth}
            height={height}
            className="absolute top-0 left-0 pointer-events-none"
            style={{ width: scale.rangeWidth, height }}
        >
            <line
                x1={todayX}
                x2={todayX}
                y1={0}
                y2={height}
                stroke="rgb(239 68 68)"
                strokeWidth={1.5}
                shapeRendering="crispEdges"
            />
            <rect
                x={todayX - 28}
                y={2}
                width={56}
                height={18}
                rx={3}
                fill="rgb(239 68 68)"
            />
            <text
                x={todayX}
                y={15}
                textAnchor="middle"
                className="fill-white"
                style={{ font: '600 11px Inter, system-ui, sans-serif' }}
            >
                Today
            </text>
        </svg>
    );
}

export function TimelineGrid({
    scale,
    level,
    height,
    weekendDays = [],
}: TimelineGridProps) {
    const showWeekends =
        weekendDays.length > 0 && (level === 'hour' || level === 'day' || level === 'week');
    const weekendSet = useMemo(() => new Set(weekendDays), [weekendDays]);

    // Gridlines align with the TimelineHeader's minor tier so the visual
    // rhythm stays consistent: header label → gridline below it.
    const verticalLines = useMemo(() => {
        switch (level) {
            case 'hour':
            case 'day':
                return scale.ticks('day').map((d) => scale.dateToX(d));
            case 'week':
                return scale.ticks('week').map((d) => scale.dateToX(d));
            case 'month':
                return scale.ticks('month').map((d) => scale.dateToX(d));
            case 'quarter':
            case 'year':
                return scale.ticks('month').map((d) => scale.dateToX(d));
        }
    }, [scale, level]);

    const weekendBands = useMemo(() => {
        if (!showWeekends) return [];
        return scale
            .ticks('day')
            .filter((d) => weekendSet.has(getDay(d)))
            .map((d) => ({
                x: scale.dateToX(d),
                width: scale.pxPerDay,
            }));
    }, [scale, showWeekends, weekendSet]);

    return (
        <svg
            width={scale.rangeWidth}
            height={height}
            className="absolute top-0 left-0 pointer-events-none"
            style={{ width: scale.rangeWidth, height }}
        >
            {/* Weekend bands */}
            {weekendBands.map((b, i) => (
                <rect
                    key={`wk-${i}`}
                    x={b.x}
                    y={0}
                    width={b.width}
                    height={height}
                    fill="rgb(248 250 252)"
                />
            ))}

            {/* Vertical gridlines */}
            {verticalLines.map((x, i) => (
                <line
                    key={`g-${i}`}
                    x1={x}
                    x2={x}
                    y1={0}
                    y2={height}
                    stroke="rgb(226 232 240)"
                    strokeWidth={1}
                    shapeRendering="crispEdges"
                />
            ))}
        </svg>
    );
}
