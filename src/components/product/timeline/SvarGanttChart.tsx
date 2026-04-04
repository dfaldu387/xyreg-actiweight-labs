import React, { useMemo, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Gantt, Willow } from "wx-react-gantt";
import "wx-react-gantt/dist/gantt.css";
import { getGanttChartStructuredData } from "@/services/ganttChartService";
import { GanttTask } from "@/types/ganttChart";
import { Loader2 } from "lucide-react";

// Zoom levels configuration (simplified from ProductGanttV3Page)
const zoomLevels = [
  {
    name: "Months",
    minCellWidth: 250,
    maxCellWidth: 400,
    scales: [
      { unit: "quarter", step: 1, format: "QQQQ" },
      { unit: "month", step: 1, format: "MMMM yyyy" },
    ],
  },
  {
    name: "Weeks",
    minCellWidth: 100,
    maxCellWidth: 400,
    scales: [
      { unit: "month", step: 1, format: "MMMM yyyy" },
      { unit: "week", step: 1, format: "'week' w" },
    ],
  },
  {
    name: "Days",
    minCellWidth: 50,
    maxCellWidth: 200,
    scales: [
      { unit: "month", step: 1, format: "MMMM yyyy" },
      { unit: "day", step: 1, format: "d" },
    ],
  },
];

// Columns configuration
const columns = [
  { id: "text", header: "Task name", width: 200 },
  { id: "start", header: "Start date", width: 100 },
  { id: "duration", header: "Duration", width: 80, align: "center" as const },
];

// Task types configuration
const taskTypes = [
  { id: "task", label: "Task" },
  { id: "summary", label: "Summary task" },
  { id: "milestone", label: "Milestone" },
];

export default function SvarGanttChart() {
  const { productId } = useParams<{ productId: string }>();
  const ganttRef = useRef<HTMLDivElement>(null);
  const [currentZoomLevel, setCurrentZoomLevel] = useState(0); // Default to Months view
  const [ganttData, setGanttData] = useState<{ tasks: GanttTask[]; links: any[] }>({
    tasks: [],
    links: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch Gantt chart data using the service
  useEffect(() => {
    if (!productId) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getGanttChartStructuredData(productId);
        setGanttData(data);
      } catch (err: any) {
        console.error("Error loading Gantt chart data:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  const { tasks: ganttTasks, links: ganttLinks } = ganttData;

  // Zoom configuration
  const zoomConfig = useMemo(
    () => ({
      maxCellWidth: 400,
      level: currentZoomLevel,
      levels: zoomLevels,
    }),
    [currentZoomLevel]
  );

  // Calculate date range from tasks
  const dateRange = useMemo(() => {
    if (ganttTasks.length === 0) {
      return {
        start: new Date(),
        end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days default
      };
    }

    const dates = ganttTasks.flatMap((task) => [task.start, task.end]);
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Add some padding
    const padding = 7 * 24 * 60 * 60 * 1000; // 7 days
    return {
      start: new Date(minDate.getTime() - padding),
      end: new Date(maxDate.getTime() + padding),
    };
  }, [ganttTasks]);

  // Force re-render after mount to ensure CSS is loaded
  useEffect(() => {
    if (ganttRef.current) {
      const ganttElement = ganttRef.current.querySelector(
        ".wx-gantt, .gantt"
      ) as HTMLElement;
      if (ganttElement) {
        // Force redraw
        ganttElement.style.display = "none";
        ganttElement.offsetHeight; // Trigger reflow
        ganttElement.style.display = "";
      }
    }
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div
        className="svar-gantt-container flex items-center justify-center"
        style={{
          width: "100%",
          height: "600px",
          minHeight: "400px",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
        }}
      >
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading Gantt Chart...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const errorMessage = error.message || "Unknown error";
    const isDetailedError = errorMessage.includes("API endpoint") || errorMessage.includes("Network error");
    
    return (
      <div
        className="svar-gantt-container flex items-center justify-center p-6"
        style={{
          width: "100%",
          height: "600px",
          minHeight: "400px",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
        }}
      >
        <div className="text-center text-destructive max-w-2xl">
          <p className="font-semibold mb-2">Error loading Gantt chart data</p>
          <div className="text-sm text-muted-foreground space-y-2">
            {isDetailedError ? (
              <pre className="text-left bg-muted p-4 rounded text-xs whitespace-pre-wrap break-words">
                {errorMessage}
              </pre>
            ) : (
              <p>{errorMessage}</p>
            )}
            {isDetailedError && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-left">
                <p className="font-medium mb-2">Troubleshooting:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Check if the backend API server is running</li>
                  <li>Verify VITE_BACKEND_API_URL environment variable is set</li>
                  <li>Ensure the endpoint /product/gantt-chart/[productId] exists on the backend</li>
                  <li>Check browser console for more details</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!ganttTasks || ganttTasks.length === 0) {
    return (
      <div
        className="svar-gantt-container flex items-center justify-center"
        style={{
          width: "100%",
          height: "600px",
          minHeight: "400px",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
        }}
      >
        <div className="text-center text-muted-foreground">
          <p>No phases available</p>
          <p className="text-sm">Add phases to see the Gantt chart</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ganttRef}
      className="svar-gantt-container"
      style={{
        width: "100%",
        height: "600px",
        minHeight: "400px",
        border: "1px solid #e5e7eb",
        borderRadius: "0.5rem",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Willow>
        <Gantt
          zoom={zoomConfig}
          tasks={ganttTasks}
          links={ganttLinks}
          columns={columns}
          taskTypes={taskTypes}
          start={dateRange.start}
          end={dateRange.end}
        />
      </Willow>
    </div>
  );
}