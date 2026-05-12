import { create } from 'zustand';
import type {
    DragState,
    GanttFilters,
    GanttSelection,
    ZoomGranularity,
} from '@/types/ganttChart';
import { ZOOM_LEVELS, nextZoomIn, nextZoomOut } from '@/lib/gantt/zoomLevels';

interface GanttUIState {
    zoom: { level: ZoomGranularity; pxPerDay: number };
    scroll: { left: number; top: number };
    selection: GanttSelection;
    drag: DragState;
    filters: GanttFilters;
    expandedGroups: Set<string>;

    setZoomLevel: (level: ZoomGranularity) => void;
    setPxPerDay: (px: number) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    setScroll: (left: number, top: number) => void;

    beginDrag: (s: Partial<DragState> & Pick<DragState, 'kind'>) => void;
    updateDrag: (deltaMs: number, pointerX: number, pointerY: number) => void;
    endDrag: () => DragState;
    resetDrag: () => void;

    setFilters: (patch: Partial<GanttFilters>) => void;
    toggleGroup: (id: string) => void;
    setSelection: (sel: Partial<GanttSelection>) => void;
    clearSelection: () => void;
}

const idleDrag: DragState = {
    kind: 'idle',
    deltaMs: 0,
    pointerX: 0,
    pointerY: 0,
};

const initialFilters: GanttFilters = {
    search: '',
    statuses: [],
    assigneeIds: [],
};

const initialSelection: GanttSelection = {
    taskIds: new Set(),
};

export const useGanttStore = create<GanttUIState>((set, get) => ({
    zoom: { level: 'week', pxPerDay: ZOOM_LEVELS.week.pxPerDay },
    scroll: { left: 0, top: 0 },
    selection: initialSelection,
    drag: idleDrag,
    filters: initialFilters,
    expandedGroups: new Set<string>(),

    setZoomLevel: (level) =>
        set({ zoom: { level, pxPerDay: ZOOM_LEVELS[level].pxPerDay } }),

    setPxPerDay: (px) =>
        set((s) => ({ zoom: { ...s.zoom, pxPerDay: px } })),

    zoomIn: () => {
        const lvl = nextZoomIn(get().zoom.level);
        set({ zoom: { level: lvl, pxPerDay: ZOOM_LEVELS[lvl].pxPerDay } });
    },

    zoomOut: () => {
        const lvl = nextZoomOut(get().zoom.level);
        set({ zoom: { level: lvl, pxPerDay: ZOOM_LEVELS[lvl].pxPerDay } });
    },

    setScroll: (left, top) => set({ scroll: { left, top } }),

    beginDrag: (s) => set({ drag: { ...idleDrag, ...s } }),

    updateDrag: (deltaMs, pointerX, pointerY) =>
        set((state) => ({ drag: { ...state.drag, deltaMs, pointerX, pointerY } })),

    endDrag: () => {
        const final = get().drag;
        set({ drag: idleDrag });
        return final;
    },

    resetDrag: () => set({ drag: idleDrag }),

    setFilters: (patch) =>
        set((state) => ({ filters: { ...state.filters, ...patch } })),

    toggleGroup: (id) =>
        set((state) => {
            const next = new Set(state.expandedGroups);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return { expandedGroups: next };
        }),

    setSelection: (sel) =>
        set((state) => ({ selection: { ...state.selection, ...sel } })),

    clearSelection: () => set({ selection: { taskIds: new Set() } }),
}));
