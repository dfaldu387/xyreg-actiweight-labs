import { AvatarCell } from "../common/AvatarCell";

// Zoom levels configuration — broadest to narrowest so zoom-in narrows, zoom-out broadens.
export const zoomLevels = [
    {
        name: "Quarters",
        minCellWidth: 220,
        maxCellWidth: 400,
        scales: [
            { unit: "quarter", step: 1, format: "QQQQ" },
            { unit: "month", step: 1, format: "MMMM yyyy" },
        ],
    },
    {
        name: "Months",
        minCellWidth: 250,
        maxCellWidth: 400,
        scales: [
            { unit: "month", step: 1, format: "MMMM yyyy" },
            { unit: "week", step: 1, format: "'week' w" },
        ],
    },
    {
        name: "Weeks",
        minCellWidth: 100,
        maxCellWidth: 400,
        scales: [
            { unit: "week", step: 1, format: "'week' w" },
            { unit: "day", step: 1, format: "MMM d" },
        ],
    },
    {
        name: "Days",
        minCellWidth: 50,
        maxCellWidth: 200,
        scales: [
            { unit: "day", step: 1, format: "MMM d" },
            { unit: "hour", step: 6, format: "ha" },
        ],
    },
    {
        name: "Hours",
        minCellWidth: 30,
        maxCellWidth: 120,
        scales: [
            { unit: "day", step: 1, format: "MMM d" },
            { unit: "hour", step: 1, format: "HH:mm" },
        ],
    },
];

const quartersLevelIndex = zoomLevels.findIndex(level => level.name === "Quarters");
export const DEFAULT_ZOOM_LEVEL = quartersLevelIndex >= 0 ? quartersLevelIndex : 0;

// Get columns with translations
export const getColumns = (lang: (key: string) => string) => [
    { id: "text", header: lang('gantt.taskName'), width: 200 },
    { id: "assigned", header: lang('gantt.assigned'), width: 160, cell: AvatarCell },
    { id: "start", header: lang('gantt.startDate'), width: 100 },
    { id: "duration", header: lang('gantt.duration'), width: 80, align: "center" as const },
];

// Default columns (for backward compatibility)
export const columns = [
    { id: "text", header: "Task name", width: 200 },
    { id: "assigned", header: "Assigned", width: 160, cell: AvatarCell },
    { id: "start", header: "Start date", width: 100 },
    { id: "duration", header: "Duration", width: 80, align: "center" as const },
];

// Task types configuration
export const taskTypes = [
    { id: "task", label: "Task" },
    { id: "summary", label: "Summary task" },
    { id: "milestone", label: "Milestone" },
    // Custom status-based task types for phases
    { id: "category", label: "Category" },
    { id: "subsection", label: "Sub-section" },
    { id: "not-started", label: "Not Started" },
    { id: "running", label: "Running" },
    { id: "overdue", label: "Overdue" },
    { id: "on-time", label: "On Time" },
];

