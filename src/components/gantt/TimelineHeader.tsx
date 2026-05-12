import React, { useMemo } from 'react';
import { format } from 'date-fns';
import {
    eachDayOfInterval,
    eachMonthOfInterval,
    eachWeekOfInterval,
    eachYearOfInterval,
    startOfMonth,
    addMonths,
    differenceInCalendarDays,
} from 'date-fns';
import { cn } from '@/lib/utils';
import type { TimeScale } from '@/lib/gantt/timeScale';
import type { ZoomGranularity } from '@/types/ganttChart';

interface TimelineHeaderProps {
    scale: TimeScale;
    level: ZoomGranularity;
}

interface Tier {
    date: Date;
    width: number;
    label: string;
}

function buildTiers(scale: TimeScale, level: ZoomGranularity): { major: Tier[]; minor: Tier[] } {
    const [start, end] = scale.domain;

    const range = (units: Date[], formatLabel: (d: Date) => string): Tier[] => {
        return units.map((unit, i) => {
            const next = i < units.length - 1 ? units[i + 1] : end;
            const x = scale.dateToX(unit);
            const xNext = scale.dateToX(next);
            return { date: unit, width: xNext - x, label: formatLabel(unit) };
        });
    };

    switch (level) {
        case 'hour':
        case 'day': {
            // Major tier shows month context (not "Week of …"), so a Day-zoom
            // user doesn't read a "Week" label and assume columns are weekly.
            const major = range(eachMonthOfInterval({ start, end }), (d) =>
                format(d, 'MMMM yyyy'),
            );
            const minor = range(eachDayOfInterval({ start, end }), (d) => format(d, 'EEE d'));
            return { major, minor };
        }
        case 'week': {
            // Major tier shows quarter context (not month name), so a Week-zoom
            // user doesn't read a "June" label and assume columns are monthly.
            const quarters: Date[] = [];
            let q = startOfMonth(start);
            // Snap to the quarter start so the label spans the full quarter.
            q = addMonths(q, -(q.getMonth() % 3));
            while (q < end) {
                quarters.push(q);
                q = addMonths(q, 3);
            }
            const major = range(
                quarters,
                (d) => `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`,
            );
            const minor = range(eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }), (d) =>
                format(d, 'd'),
            );
            return { major, minor };
        }
        case 'month': {
            const major = range(eachYearOfInterval({ start, end }), (d) => format(d, 'yyyy'));
            const minor = range(eachMonthOfInterval({ start, end }), (d) => format(d, 'MMM'));
            return { major, minor };
        }
        case 'quarter': {
            const major = range(eachYearOfInterval({ start, end }), (d) => format(d, 'yyyy'));
            const quarters: Date[] = [];
            let q = startOfMonth(start);
            while (q < end) {
                quarters.push(q);
                q = addMonths(q, 3);
            }
            const minor = range(quarters, (d) => `Q${Math.floor(d.getMonth() / 3) + 1}`);
            return { major, minor };
        }
        case 'year': {
            const major = range(eachYearOfInterval({ start, end }), (d) => format(d, 'yyyy'));
            const minor = range(eachMonthOfInterval({ start, end }), (d) => format(d, 'MMM'));
            return { major, minor };
        }
    }
}

export function TimelineHeader({ scale, level }: TimelineHeaderProps) {
    const tiers = useMemo(() => buildTiers(scale, level), [scale, level]);

    // Tier cells are absolutely positioned at scale.dateToX(unit) so the
    // header shares the body's coordinate system. Flex layout from x=0 would
    // misalign whenever the first tick falls before the domain start (e.g.
    // eachWeekOfInterval can return a Monday before domain.start when the
    // domain starts mid-week), shifting every label to the right of its
    // gridline by the offset of that leading partial unit.
    return (
        <div
            className="relative flex flex-col bg-white border-b border-slate-200 select-none sticky top-0 z-30"
            style={{ width: scale.rangeWidth, height: 64 }}
        >
            {/* Major tier */}
            <div className="relative h-8 border-b border-slate-200 bg-slate-50">
                {tiers.major.map((t, i) => (
                    <div
                        key={`maj-${i}`}
                        className="absolute top-0 bottom-0 flex items-center justify-center text-xs font-semibold text-slate-700 border-r border-slate-200 truncate px-2"
                        style={{ left: scale.dateToX(t.date), width: t.width }}
                        title={t.label}
                    >
                        {t.label}
                    </div>
                ))}
            </div>
            {/* Minor tier */}
            <div className="relative h-8 bg-white">
                {tiers.minor.map((t, i) => (
                    <div
                        key={`min-${i}`}
                        className={cn(
                            'absolute top-0 bottom-0 flex items-center justify-center text-[11px] text-slate-500 border-r border-slate-100 truncate',
                            t.width >= 32 && 'px-1',
                        )}
                        style={{ left: scale.dateToX(t.date), width: t.width }}
                        title={t.label}
                    >
                        {t.width >= 18 ? t.label : ''}
                    </div>
                ))}
            </div>
        </div>
    );
}
