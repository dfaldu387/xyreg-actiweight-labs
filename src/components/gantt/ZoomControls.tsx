import React from 'react';
import { Minus, Plus, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useGanttStore } from '@/stores/ganttStore';
import { ZOOM_ORDER } from '@/lib/gantt/zoomLevels';
import type { ZoomGranularity } from '@/types/ganttChart';

const LABELS: Record<ZoomGranularity, string> = {
    hour: 'Hour',
    day: 'Day',
    week: 'Week',
    month: 'Month',
    quarter: 'Quarter',
    year: 'Year',
};

interface ZoomControlsProps {
    onJumpToToday?: () => void;
}

export function ZoomControls({ onJumpToToday }: ZoomControlsProps) {
    const level = useGanttStore((s) => s.zoom.level);
    const zoomIn = useGanttStore((s) => s.zoomIn);
    const zoomOut = useGanttStore((s) => s.zoomOut);
    const setZoomLevel = useGanttStore((s) => s.setZoomLevel);

    return (
        <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-md border border-slate-200 bg-white shadow-sm">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={zoomIn}
                    className="h-8 w-8 p-0 rounded-r-none"
                    aria-label="Zoom in"
                >
                    <Plus className="h-4 w-4" />
                </Button>
                <div className="h-6 w-px bg-slate-200" />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={zoomOut}
                    className="h-8 w-8 p-0 rounded-l-none"
                    aria-label="Zoom out"
                >
                    <Minus className="h-4 w-4" />
                </Button>
            </div>
            <div className="inline-flex items-center rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
                {ZOOM_ORDER.filter((g) => g !== 'hour').map((g) => (
                    <button
                        key={g}
                        type="button"
                        onClick={() => setZoomLevel(g)}
                        className={cn(
                            'px-2.5 h-8 text-xs font-medium border-r border-slate-200 last:border-r-0 transition-colors',
                            level === g
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-600 hover:bg-slate-50',
                        )}
                    >
                        {LABELS[g]}
                    </button>
                ))}
            </div>
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={onJumpToToday}
            >
                <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                Today
            </Button>
        </div>
    );
}
