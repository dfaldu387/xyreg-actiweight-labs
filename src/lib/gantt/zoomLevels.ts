import { format, getISOWeek } from 'date-fns';
import type { ZoomGranularity, ZoomLevel } from '@/types/ganttChart';

const MS_MIN = 60_000;
const MS_HOUR = 60 * MS_MIN;
const MS_DAY = 24 * MS_HOUR;

export const ZOOM_LEVELS: Record<ZoomGranularity, ZoomLevel> = {
    hour: {
        id: 'hour',
        pxPerDay: 480,
        minorUnit: 'day',
        majorUnit: 'week',
        snapMs: 15 * MS_MIN,
        formatMinor: (d) => format(d, 'HH:mm'),
        formatMajor: (d) => format(d, 'EEE MMM d'),
    },
    day: {
        id: 'day',
        pxPerDay: 80,
        minorUnit: 'day',
        majorUnit: 'week',
        snapMs: MS_HOUR,
        formatMinor: (d) => format(d, 'd'),
        formatMajor: (d) => `W${getISOWeek(d)} ${format(d, 'MMM yyyy')}`,
    },
    week: {
        id: 'week',
        pxPerDay: 24,
        minorUnit: 'week',
        majorUnit: 'month',
        snapMs: MS_DAY,
        formatMinor: (d) => format(d, 'd'),
        formatMajor: (d) => format(d, 'MMM yyyy'),
    },
    month: {
        id: 'month',
        pxPerDay: 6,
        minorUnit: 'week',
        majorUnit: 'month',
        snapMs: MS_DAY,
        formatMinor: (d) => `W${getISOWeek(d)}`,
        formatMajor: (d) => format(d, 'MMM yyyy'),
    },
    quarter: {
        id: 'quarter',
        pxPerDay: 2,
        minorUnit: 'month',
        majorUnit: 'quarter',
        snapMs: 7 * MS_DAY,
        formatMinor: (d) => format(d, 'MMM'),
        formatMajor: (d) => `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`,
    },
    year: {
        id: 'year',
        pxPerDay: 0.7,
        minorUnit: 'month',
        majorUnit: 'year',
        snapMs: 7 * MS_DAY,
        formatMinor: (d) => format(d, 'MMM'),
        formatMajor: (d) => format(d, 'yyyy'),
    },
};

export const ZOOM_ORDER: ZoomGranularity[] = ['hour', 'day', 'week', 'month', 'quarter', 'year'];

export function nextZoomIn(level: ZoomGranularity): ZoomGranularity {
    const i = ZOOM_ORDER.indexOf(level);
    return ZOOM_ORDER[Math.max(0, i - 1)];
}

export function nextZoomOut(level: ZoomGranularity): ZoomGranularity {
    const i = ZOOM_ORDER.indexOf(level);
    return ZOOM_ORDER[Math.min(ZOOM_ORDER.length - 1, i + 1)];
}
