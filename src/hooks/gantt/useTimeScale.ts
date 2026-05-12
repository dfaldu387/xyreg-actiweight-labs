import { useMemo } from 'react';
import { useGanttStore } from '@/stores/ganttStore';
import { makeTimeScale, type TimeScale } from '@/lib/gantt/timeScale';

// Memoized time-scale tied to the store's pxPerDay.
//
// `minWidth` (optional) clamps the scale so the chart never renders narrower
// than the viewport — at coarse zoom levels (Year/Quarter) on short
// timelines, the natural rangeWidth can be smaller than the available area
// and would leave empty space on the right.  Passing the scrollable
// container's clientWidth keeps the chart filled edge-to-edge.
export function useTimeScale(
    domain: readonly [Date, Date],
    minWidth?: number,
): TimeScale {
    const pxPerDay = useGanttStore((s) => s.zoom.pxPerDay);
    const startMs = domain[0].getTime();
    const endMs = domain[1].getTime();
    return useMemo(() => {
        let effective = pxPerDay;
        if (minWidth && minWidth > 0) {
            const days = Math.max(1, (endMs - startMs) / 86_400_000);
            effective = Math.max(pxPerDay, minWidth / days);
        }
        return makeTimeScale([new Date(startMs), new Date(endMs)], effective);
    }, [startMs, endMs, pxPerDay, minWidth]);
}
