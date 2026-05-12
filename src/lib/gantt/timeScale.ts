import {
    addDays,
    addMilliseconds,
    differenceInCalendarDays,
    eachDayOfInterval,
    eachMonthOfInterval,
    eachWeekOfInterval,
    eachYearOfInterval,
    startOfDay,
} from 'date-fns';

const MS_PER_DAY = 86_400_000;

export type TickGranularity = 'day' | 'week' | 'month' | 'year';

export interface TimeScale {
    readonly domain: readonly [Date, Date];
    readonly pxPerDay: number;
    readonly rangeWidth: number;
    dateToX(d: Date): number;
    xToDate(x: number): Date;
    snap(d: Date, snapMs: number): Date;
    pxToMs(px: number): number;
    msToPx(ms: number): number;
    ticks(g: TickGranularity): Date[];
}

// Build a calendar-day-anchored scale. The visual contract is:
// "one calendar day always renders as exactly `pxPerDay` pixels wide,
//  regardless of DST hour adjustments."
//
// This is the surgical fix for the @svar-ui year-drift bug: that library
// computed positions from raw `getTime()` deltas, which drift by an hour
// across each DST boundary. Over a year, two boundaries cancel — but inside
// a year, the 1-hour drift propagates through every zoom-level conversion.
export function makeTimeScale(domain: readonly [Date, Date], pxPerDay: number): TimeScale {
    const [start, end] = domain;
    const startMidnight = startOfDay(start);
    const totalDays = differenceInCalendarDays(end, start);
    const rangeWidth = totalDays * pxPerDay;

    const dateToX = (d: Date): number => {
        const dayBase = startOfDay(d);
        const days = differenceInCalendarDays(dayBase, startMidnight);
        // Sub-day position uses raw ms divided by a nominal 24h day. On DST
        // days this caps at 23/24 or 25/24 — acceptable for hour-zoom because
        // bars on those days occupy the same calendar-day cell either way.
        const subFraction = (d.getTime() - dayBase.getTime()) / MS_PER_DAY;
        return (days + subFraction) * pxPerDay;
    };

    const xToDate = (x: number): Date => {
        const fullDays = Math.floor(x / pxPerDay);
        const subFraction = x / pxPerDay - fullDays;
        const dayBase = addDays(startMidnight, fullDays);
        return addMilliseconds(dayBase, Math.round(subFraction * MS_PER_DAY));
    };

    const snap = (d: Date, snapMs: number): Date => {
        // Anchor at local midnight so DST never shifts the snap grid.
        const base = startOfDay(d).getTime();
        const rel = d.getTime() - base;
        const snapped = Math.round(rel / snapMs) * snapMs;
        return new Date(base + snapped);
    };

    const pxToMs = (px: number): number => (px / pxPerDay) * MS_PER_DAY;
    const msToPx = (ms: number): number => (ms / MS_PER_DAY) * pxPerDay;

    const ticks = (g: TickGranularity): Date[] => {
        const interval = { start, end };
        switch (g) {
            case 'day':
                return eachDayOfInterval(interval);
            case 'week':
                return eachWeekOfInterval(interval, { weekStartsOn: 1 });
            case 'month':
                return eachMonthOfInterval(interval);
            case 'year':
                return eachYearOfInterval(interval);
        }
    };

    return { domain, pxPerDay, rangeWidth, dateToX, xToDate, snap, pxToMs, msToPx, ticks };
}
