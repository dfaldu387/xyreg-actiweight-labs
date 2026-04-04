import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Gantt, Willow } from "@/components/gantt-chart/src";
import "@/components/gantt-chart/GanttChartCustom.css";
import { useProductPhases } from "@/hooks/useProductPhases";
import { useProductDetails } from "@/hooks/useProductDetails";
import { useGanttPhaseUpdate } from "@/hooks/useGanttPhaseUpdate";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { PhaseDocumentDialog } from "@/components/product/timeline/PhaseDocumentDialog";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import {
  parsePhaseIdFromTaskId,
  parseDocumentIdFromTaskId,
  isDocumentTask,
  calculateDuration,
  mapCompanyDependenciesToProduct,
  mapProductDependenciesToPhases,
  calculateDocumentEndDate,
  calculateDocumentsSummaryDuration,
  createDocumentUpdateDebouncer,
  calculateDocumentStartDate,
} from "@/utils/ganttUtils";
import { UpdateTaskEvent, MoveTaskEvent, GanttTask } from "@/types/ganttChart";
import {
  GanttPhaseDocumentService,
  IndividualDocument,
} from "@/services/ganttPhaseDocumentService";

// Add CSS for smooth Gantt chart animations
const ganttAnimationStyles = `
  .wx-gantt .wx-task-bar {
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
  
  .wx-gantt .wx-task-bar.updating {
    opacity: 0.7;
  }
  
  .wx-gantt .wx-task-bar:hover {
    filter: brightness(1.1);
  }
  
  .wx-gantt-updating {
    pointer-events: none;
    opacity: 0.95;
  }
`;

const dayStyle = {
  backgroundColor: "#e8e8e8",
};

const hoursTemplate = (date: Date) => {
  return `${date.getHours()}:${date.getMinutes()}`;
};

// Zoom levels configuration
const zoomLevels = [
  {
    name: "Years",
    minCellWidth: 200,
    scales: [{ unit: "year", step: 1, format: "yyyy" }],
  },
  {
    name: "3 Months",
    minCellWidth: 150,
    scales: [
      { unit: "year", step: 1, format: "yyyy" },
      { unit: "quarter", step: 1, format: "QQQQ" },
    ],
  },
  {
    name: "Months",
    minCellWidth: 250,
    scales: [
      { unit: "quarter", step: 1, format: "QQQQ" },
      { unit: "month", step: 1, format: "MMMM yyyy" },
    ],
  },
  {
    name: "Weeks",
    minCellWidth: 100,
    scales: [
      { unit: "month", step: 1, format: "MMMM yyyy" },
      { unit: "week", step: 1, format: "'week' w" },
    ],
  },
  {
    name: "Days",
    maxCellWidth: 200,
    scales: [
      { unit: "month", step: 1, format: "MMMM yyyy" },
      { unit: "day", step: 1, format: "d", css: dayStyle },
    ],
  },
  {
    name: "Hours (6h)",
    minCellWidth: 25,
    scales: [
      { unit: "day", step: 1, format: "MMM d", css: dayStyle },
      { unit: "hour", step: 6, format: hoursTemplate },
    ],
  },
  {
    name: "Hours (1h)",
    scales: [
      { unit: "day", step: 1, format: "MMM d", css: dayStyle },
      { unit: "hour", step: 1, format: "HH:mm" },
    ],
  },
];

export default function ProductGanttV3Page() {
  const { lang } = useTranslation();
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const ganttApiRef = useRef<any>(null); // Gantt API reference
  const [apiReady, setApiReady] = useState(false); // Track if API is ready
  const [currentZoomLevel, setCurrentZoomLevel] = useState(2); // Zoom state management
  const [ganttLinks, setGanttLinks] = useState<any[]>([]); // Task links state management
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [selectedPhaseName, setSelectedPhaseName] = useState<string>("");
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [documentCounts, setDocumentCounts] = useState<Record<string, number>>(
    {}
  ); // Document counts state management
  const [individualDocuments, setIndividualDocuments] = useState<
    Record<string, IndividualDocument[]>
  >({}); // Individual documents per phase
  const [documentsLoading, setDocumentsLoading] = useState(false); // Track document loading state
  const [isUpdating, setIsUpdating] = useState(false); // Track if cascading update is in progress
  const [documentUpdating, setDocumentUpdating] = useState<
    Record<string, boolean>
  >({}); // Track individual document updates
  const [optimisticDocumentUpdates, setOptimisticDocumentUpdates] = useState<
    Record<string, { start?: Date; end?: Date }>
  >({}); // Track optimistic document date updates
  const [companyDependencies, setCompanyDependencies] = useState<any[]>([]); // Company-level dependencies from database
  const [productDependencies, setProductDependencies] = useState<any[]>([]); // Product-specific dependency overrides
  const dependenciesFetchedRef = useRef<string | null>(null); // Prevent duplicate dependency fetches
  const documentsLoadedRef = useRef<string | null>(null); // Prevent duplicate document fetches
  const documentUpdateDebouncersRef = useRef<
    Record<string, ReturnType<typeof createDocumentUpdateDebouncer>>
  >({}); // Document update debouncers

  // Expansion state management with localStorage persistence
  const [taskExpansionState, setTaskExpansionState] = useState<
    Record<string, boolean>
  >({});
  const EXPANSION_STORAGE_KEY = `gantt-expansion-${productId}`;

  // Load expansion state from localStorage on mount
  useEffect(() => {
    if (!productId) return;

    const savedState = localStorage.getItem(EXPANSION_STORAGE_KEY);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        // Convert all true values to false (collapse all tasks on load)
        const collapsedState: Record<string, boolean> = {};
        Object.keys(parsedState).forEach((taskId) => {
          collapsedState[taskId] = false;
        });
        setTaskExpansionState(collapsedState);
        // Save the collapsed state back to localStorage
        localStorage.setItem(
          EXPANSION_STORAGE_KEY,
          JSON.stringify(collapsedState)
        );
      } catch (error) {
        console.error(
          "[ProductGanttV3Page] Failed to parse saved expansion state:",
          error
        );
        // If parsing fails, start with empty state (all collapsed)
        setTaskExpansionState({});
      }
    } else {
      // No saved state found, start with empty state (all collapsed by default)
      setTaskExpansionState({});
    }
  }, [productId, EXPANSION_STORAGE_KEY]);

  // Save expansion state to localStorage
  const saveExpansionState = useCallback(
    (newState: Record<string, boolean>) => {
      setTaskExpansionState(newState);
      localStorage.setItem(EXPANSION_STORAGE_KEY, JSON.stringify(newState));
    },
    [EXPANSION_STORAGE_KEY]
  );

  // Handle task expansion toggle
  const handleTaskExpansion = useCallback(
    (taskId: string, isExpanded: boolean) => {
      const newState = {
        ...taskExpansionState,
        [taskId]: isExpanded,
      };
      saveExpansionState(newState);
    },
    [taskExpansionState, saveExpansionState]
  );

  // Use the custom hook for phase updates
  const {
    initializePhaseDuration,
    schedulePhaseUpdate,
    schedulePhaseUpdateWithCascading,
    cancelAllUpdates,
  } = useGanttPhaseUpdate();

  // Fetch product details
  const {
    data: product,
    isLoading: productLoading,
    error: productError,
  } = useProductDetails(productId);

  // Fetch phases with the enhanced hook
  const {
    phases,
    isLoading: phasesLoading,
    error: phasesError,
    refetch: refetchPhases,
  } = useProductPhases(productId, product?.company_id, product);

  // Handle document task update events (resize, drag, date change)
  const handleDocumentUpdate = useCallback(
    async (event: UpdateTaskEvent) => {
      const documentId = parseDocumentIdFromTaskId(event.id.toString());

      if (!documentId || !event.task) {
        return;
      }

      const { start, end } = event.task;
      if (!start && !end) {
        return;
      }

      const document = Object.values(individualDocuments)
        .flat()
        .find((doc) => doc.id === documentId);

      if (!document) {
        return;
      }

      const phase = phases?.find((p) => p.phase_id === document.phaseId);
      if (!phase) {
        return;
      }

      const phaseStartDate = phase.start_date
        ? new Date(phase.start_date)
        : undefined;
      const phaseEndDate = phase.end_date
        ? new Date(phase.end_date)
        : undefined;

      // Validate both start and end dates if provided
      if (start) {
        const startValidation =
          GanttPhaseDocumentService.validateDocumentDueDate(
            start,
            phaseStartDate,
            phaseEndDate
          );
        if (!startValidation.isValid) {
          toast.error(startValidation.error || lang('ganttChart.invalidStartDate'));
          return;
        }
      }

      if (end) {
        const endValidation = GanttPhaseDocumentService.validateDocumentDueDate(
          end,
          phaseStartDate,
          phaseEndDate
        );
        if (!endValidation.isValid) {
          toast.error(endValidation.error || lang('ganttChart.invalidDueDate'));
          return;
        }
      }

      // Apply optimistic update immediately
      setOptimisticDocumentUpdates((prev) => ({
        ...prev,
        [documentId]: {
          ...prev[documentId],
          ...(start && { start }),
          ...(end && { end }),
        },
      }));
      setDocumentUpdating((prev) => ({ ...prev, [documentId]: true }));

      if (!documentUpdateDebouncersRef.current[documentId]) {
        documentUpdateDebouncersRef.current[documentId] =
          createDocumentUpdateDebouncer(
            async (dates: { startDate?: Date; dueDate?: Date }) => {
              try {
                const result =
                  await GanttPhaseDocumentService.updateDocumentDates(
                    documentId,
                    dates.dueDate,
                    dates.startDate
                  );

                if (result.success) {
                  toast.success(lang('ganttChart.updatedDocumentDates').replace('{{name}}', document.name));

                  // Update the local document state immediately with the new dates
                  setIndividualDocuments((prev) => {
                    const newState = { ...prev };
                    Object.keys(newState).forEach((phaseId) => {
                      newState[phaseId] = newState[phaseId].map((doc) =>
                        doc.id === documentId
                          ? {
                              ...doc,
                              ...(dates.dueDate && {
                                due_date: dates.dueDate
                                  .toISOString()
                                  .split("T")[0],
                              }),
                              ...(dates.startDate && {
                                start_date: dates.startDate
                                  .toISOString()
                                  .split("T")[0],
                              }),
                            }
                          : doc
                      );
                    });
                    return newState;
                  });

                  // Clear optimistic update immediately since we've updated local state
                  setOptimisticDocumentUpdates((prev) => {
                    const newState = { ...prev };
                    delete newState[documentId];
                    return newState;
                  });
                } else {
                  toast.error(
                    result.error || lang('ganttChart.failedToUpdateDocumentDates')
                  );
                  // Revert optimistic update on error
                  setOptimisticDocumentUpdates((prev) => {
                    const newState = { ...prev };
                    delete newState[documentId];
                    return newState;
                  });
                }
              } catch (error) {
                toast.error(lang('ganttChart.failedToUpdateDocumentDates'));
                // Revert optimistic update on error
                setOptimisticDocumentUpdates((prev) => {
                  const newState = { ...prev };
                  delete newState[documentId];
                  return newState;
                });
              } finally {
                setDocumentUpdating((prev) => ({
                  ...prev,
                  [documentId]: false,
                }));
              }
            },
            500
          );
      }

      // Execute the debounced update
      documentUpdateDebouncersRef.current[documentId].execute({
        startDate: start,
        dueDate: end,
      });
    },
    [individualDocuments, phases, product?.company_id]
  );

  // Handle task update events (resize, drag, date change)
  const handleTaskUpdate = useCallback(
    async (event: UpdateTaskEvent) => {
      const taskId = event.id.toString();

      // Check if this is a document task
      if (isDocumentTask(taskId)) {
        await handleDocumentUpdate(event);
        return;
      }

      const phaseId = parsePhaseIdFromTaskId(taskId);
      if (!phaseId) return;

      const phase = phases?.find((p) => p.id === phaseId); // Find the corresponding phase
      if (!phase || !event.task) return;

      const { start, end } = event.task;
      if (!start && !end) return;

      // Calculate new dates
      const newStartDate = start || new Date(phase.start_date);
      const newEndDate = end || new Date(phase.end_date);
      const duration = calculateDuration(newStartDate, newEndDate);

      // Initialize phase duration if not tracked
      if (phase.start_date && phase.end_date) {
        const originalDuration = calculateDuration(
          new Date(phase.start_date),
          new Date(phase.end_date)
        );
        initializePhaseDuration(phaseId, originalDuration);
      }

      // Set updating state to show visual feedback
      setIsUpdating(true);

      // Schedule the debounced update WITH CASCADING
      schedulePhaseUpdateWithCascading(
        phaseId,
        phase.name,
        newStartDate,
        newEndDate,
        ganttLinks,
        phases || [],
        async () => {
          // Updated phases without triggering loading state
          try {
            const { data: updatedPhases } = await supabase
              .from("lifecycle_phases")
              .select("*, likelihood_of_success")
              .eq("product_id", productId);

            if (updatedPhases) {
              // Get company chosen phases for additional data
              const { data: chosenPhases } = await supabase
                .from("company_chosen_phases")
                .select(
                  `
                                phase_id, 
  position, 
                                company_phases!inner(
                                    start_date, 
                                    duration_days,
                                    is_continuous_process,
                                    start_percentage,
                                    end_percentage,
                                    name,
                                    description,
                                    assigned_to,
                                    reviewer_group_id
                                )
                            `
                )
                .eq("company_id", product?.company_id);

              refetchPhases();
            }
          } catch (error) {
            console.error(
              "[ProductGanttV3Page] Error during silent refresh:",
              error
            );
            refetchPhases();
          }

          setTimeout(() => {
            setIsUpdating(false);
          }, 600);
        }
      );
    },
    [
      phases,
      ganttLinks,
      initializePhaseDuration,
      schedulePhaseUpdateWithCascading,
      refetchPhases,
      productId,
      product?.company_id,
      handleDocumentUpdate,
    ]
  );

  // Handle task move events (drag to different position)
  const handleTaskMove = useCallback((event: MoveTaskEvent) => {
    console.log("[gantt-chart-event-capture] Task Move Event:", {
      taskId: event.id,
      newParent: event.parent,
      targetId: event.targetId,
      reverse: event.reverse,
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Handle task drag events (while dragging)
  const handleTaskDrag = useCallback((event: any) => {
    console.log("[gantt-chart-event-capture] Task Drag Event:", {
      taskId: event.id,
      x: event.x,
      y: event.y,
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Handle link creation/update events
  const handleLinkUpdate = useCallback((event: any) => {
    console.log("[gantt-chart-event-capture] Link Update Event:", {
      linkId: event.id,
      source: event.source,
      target: event.target,
      type: event.type,
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Callback when Gantt component mounts and API is ready
  const handleGanttReady = useCallback((api: any) => {
    ganttApiRef.current = api;
    setApiReady(true);
  }, []);

  // Initialize Gantt API and attach event listeners
  useEffect(() => {
    if (!apiReady || !ganttApiRef.current) {
      return;
    }

    const api = ganttApiRef.current;

    // Subscribe to update-task event (fired on resize, drag, date change)
    const unsubscribeUpdate = api.on("update-task", (ev: any) => {
      handleTaskUpdate(ev);
    });

    // Subscribe to move-task event (fired when task is moved to different position)
    const unsubscribeMove = api.on("move-task", (ev: any) => {
      handleTaskMove(ev);
    });

    // Subscribe to drag-task event (fired while dragging)
    const unsubscribeDrag = api.on("drag-task", (ev: any) => {
      handleTaskDrag(ev);
    });

    // Subscribe to update-link event (fired when dependency changes)
    const unsubscribeLink = api.on("update-link", (ev: any) => {
      handleLinkUpdate(ev);
    });

    // Subscribe to the correct open-task event (handles both expand and collapse)
    const unsubscribeOpenTask = api.on("open-task", (ev: any) => {
      if (ev && ev.id) {
        // mode: true = expanded, mode: false = collapsed
        const isExpanded = ev.mode === true;
        handleTaskExpansion(ev.id.toString(), isExpanded);
      }
    });

    // Additional events to try for debugging
    const unsubscribeTaskDrag = api.on("task-drag", (ev: any) => {
      console.log(
        "[gantt-chart-event-capture] Raw task-drag event received:",
        ev
      );
    });

    const unsubscribeAfterUpdate = api.on("after-update", (ev: any) => {
      console.log(
        "[gantt-chart-event-capture] Raw after-update event received:",
        ev
      );
    });

    // Cleanup function to remove event listeners
    return () => {
      if (unsubscribeUpdate) unsubscribeUpdate();
      if (unsubscribeMove) unsubscribeMove();
      if (unsubscribeDrag) unsubscribeDrag();
      if (unsubscribeLink) unsubscribeLink();
      if (unsubscribeOpenTask) unsubscribeOpenTask();

      if (unsubscribeTaskDrag) unsubscribeTaskDrag();
      if (unsubscribeAfterUpdate) unsubscribeAfterUpdate();
      // if (unsubscribeAnyEvent) unsubscribeAnyEvent();
    };
  }, [
    apiReady,
    handleTaskUpdate,
    handleTaskMove,
    handleTaskDrag,
    handleLinkUpdate,
    handleTaskExpansion,
  ]);

  // Zoom configuration & handlers
  const zoomConfig = useMemo(
    () => ({
      maxCellWidth: 400,
      level: currentZoomLevel,
      levels: zoomLevels,
    }),
    [currentZoomLevel]
  );

  // Today marker for the Gantt chart
  const ganttMarkers = useMemo(() => [
    {
      start: new Date(),
      text: "Today",
      css: "wx-today-marker",
    },
  ], []);

  const handleZoomIn = () => {
    if (currentZoomLevel < zoomLevels.length - 1) {
      setCurrentZoomLevel((prev) => prev + 1);
    }
  };

  const handleZoomOut = () => {
    if (currentZoomLevel > 0) {
      setCurrentZoomLevel((prev) => prev - 1);
    }
  };

  const handleResetZoom = () => {
    setCurrentZoomLevel(2);
  };

  // Task click handler
  const handleSubTaskClick = (task: GanttTask) => {
    if (task.documentId) {
      toast.info(lang('ganttChart.openingDocument').replace('{{name}}', task.text));
    } else if (task.isDocumentContainer && task.phaseId) {
      // Document container clicked - show phase document dialog
      const phase = phases?.find((p) => p.id === task.phaseId);
      if (phase) {
        setSelectedPhaseId(task.phaseId);
        setSelectedPhaseName(phase.name);
        setShowDocumentDialog(true);
      }
    } else if (task.subTaskType === "document" && task.phaseId) {
      // Legacy document task clicked (fallback)
      const phase = phases?.find((p) => p.id === task.phaseId);
      if (phase) {
        setSelectedPhaseId(task.phaseId);
        setSelectedPhaseName(phase.name);
        setShowDocumentDialog(true);
      }
    } else {
      toast.info(lang('ganttChart.functionalityComing').replace('{{name}}', task.text));
    }
  };

  // Gantt tasks transformation - PRODUCT-SPECIFIC DATA FIRST
  const ganttTasks = useMemo((): GanttTask[] => {
    if (!phases || phases.length === 0) {
      return [];
    }

    const tasks: GanttTask[] = [];
    let taskIdCounter = 1;

    // Filter out "No Phase" placeholder phases
    const visiblePhases = phases.filter(
      (phase) => phase?.name?.toLowerCase() !== 'no phase'
    );

    visiblePhases.forEach((phase, index) => {
      // PRIORITIZE PRODUCT-SPECIFIC DATES over company template defaults
      const phaseStartDate = phase.start_date
        ? new Date(phase.start_date)
        : null;
      const phaseEndDate = phase.end_date ? new Date(phase.end_date) : null;

      // Use actual product dates if available, otherwise use intelligent defaults
      let displayStartDate: Date;
      let displayEndDate: Date;

      if (phaseStartDate && phaseEndDate) {
        // Product has actual dates set - use them directly
        displayStartDate = phaseStartDate;
        displayEndDate = phaseEndDate;
      } else {
        // Fallback to calculated dates based on project timeline
        const projectStart = new Date();
        const dayOffset = index * 7; // 7 days per phase spacing
        displayStartDate = new Date(
          projectStart?.getTime() || 0 + dayOffset * 24 * 60 * 60 * 1000
        );
        displayEndDate = new Date(
          displayStartDate?.getTime() || 0 +
            (phase.duration_days || 14) * 24 * 60 * 60 * 1000
        );
      }

      // Main phase task based on product-specific data
      const phaseTask: GanttTask = {
        id: `phase-${phase.id}`, // lifecycle_phases.id (product instance)
        text: phase.name, // Product-specific phase name
        start: displayStartDate, // Product-specific start date
        end: displayEndDate, // Product-specific end date
        type: "summary",
        open: taskExpansionState[`phase-${phase.id}`] === true, // Dynamic expansion state (default false)
        phaseId: phase.id, // lifecycle_phases.id for consistency
      };
      tasks.push(phaseTask);

      // Sub-tasks with nested document structure
      const documentCount = documentCounts[phase.phase_id] || 0;
      const phaseIndividualDocs = individualDocuments[phase.phase_id] || [];

      // Calculate dynamic duration for Documents summary based on individual document due dates
      const documentsSummaryDuration = calculateDocumentsSummaryDuration(
        phaseIndividualDocs,
        displayStartDate,
        displayEndDate,
        3
      );

      const subTasks = [
        {
          type: "document" as const,
          name: `${lang('ganttChart.documents')} (${documentCount})`,
          duration: documentsSummaryDuration.maxDuration,
          hasNested: true,
        },
        {
          type: "gap-analysis" as const,
          name: lang('ganttChart.gapAnalysis'),
          duration: 5,
          hasNested: false,
        },
        {
          type: "activities" as const,
          name: lang('ganttChart.activities'),
          duration: 4,
          hasNested: false,
        },
        {
          type: "audit" as const,
          name: lang('ganttChart.audit'),
          duration: 4,
          hasNested: false,
        },
        {
          type: "clinical-trials" as const,
          name: lang('ganttChart.clinicalTrials'),
          duration: 5,
          hasNested: false,
        },
      ];

      let currentDate = new Date(phaseStartDate);

      subTasks.forEach((subTask) => {
        let subTaskEndDate: Date;

        if (subTask.type === "document" && subTask.hasNested) {
          // Use calculated max end date for Documents summary
          subTaskEndDate = documentsSummaryDuration.maxEndDate;
        } else {
          // Calculate normal end date for other sub-tasks
          subTaskEndDate = new Date(
            currentDate?.getTime() || 0 + subTask.duration * 24 * 60 * 60 * 1000
          );
          if (subTaskEndDate > phaseEndDate) {
            subTaskEndDate.setTime(phaseEndDate?.getTime() || 0);
          }
        }

        if (subTask.type === "document" && subTask.hasNested) {
          // Create document container task with dynamic duration 
          const documentContainerTask: GanttTask = {
            id: `documents-${phase.id}`,
            text: subTask.name,
            start: new Date(currentDate),
            end: subTaskEndDate,
            type: "summary",
            parent: `phase-${phase.id}`,
            open: taskExpansionState[`documents-${phase.id}`] === true, // Dynamic expansion state (default false)
            phaseId: phase.id,
            subTaskType: subTask.type,
            isDocumentContainer: true,
          };

          tasks.push(documentContainerTask);

          // Add individual document tasks as nested sub-items
          phaseIndividualDocs.forEach((doc, docIndex) => {
            // Use optimistic update if available, otherwise use calculated dates
            const optimisticUpdate = optimisticDocumentUpdates[doc.id];
            let docStartDate: Date;
            let docEndDate: Date;

            if (optimisticUpdate?.start) {
              // Use optimistic start date (user's dragged position)
              docStartDate = optimisticUpdate.start;
            } else {
              // Calculate from database data using the new utility function
              docStartDate = calculateDocumentStartDate(
                doc.start_date,
                new Date(currentDate), // Documents summary start date
                phaseStartDate,
                phaseEndDate
              );
            }

            if (optimisticUpdate?.end) {
              // Use optimistic end date (user's dragged position)
              docEndDate = optimisticUpdate.end;
            } else {
              // Calculate from database data
              docEndDate = calculateDocumentEndDate(
                doc.due_date,
                docStartDate, // Use calculated start date
                phaseEndDate,
                3
              );
            }

            const docTask: GanttTask = {
              id: `doc-${doc.id}`,
              text: doc.name,
              start: docStartDate,
              end: docEndDate,
              type: "task",
              parent: `documents-${phase.id}`,
              open: taskExpansionState[`doc-${doc.id}`] === true, // Dynamic expansion state (default false)
              phaseId: phase.id,
              subTaskType: "document",
              documentId: doc.id,
              dueDate: doc.due_date,
            };
            tasks.push(docTask);
          });
        } else {
          const subTaskItem: GanttTask = {
            id: taskIdCounter++,
            text: subTask.name,
            start: new Date(currentDate),
            end: subTaskEndDate,
            type: "summary",
            parent: `phase-${phase.id}`,
            open: taskExpansionState[`subtask-${taskIdCounter}`] === true, // Dynamic expansion state (default false)
            phaseId: phase.id,
            subTaskType: subTask.type,
          };

          tasks.push(subTaskItem);
        }

        currentDate = new Date(subTaskEndDate?.getTime() || 0 + 24 * 60 * 60 * 1000);
      });
    });

    return tasks;
  }, [
    phases,
    documentCounts,
    individualDocuments,
    documentUpdating,
    taskExpansionState,
    optimisticDocumentUpdates,
  ]);

  // Task links generation - NOW USING REAL DEPENDENCIES FROM DATABASE
  const generateTaskLinks = useMemo(() => {
    if (!phases || phases.length === 0) {
      return [];
    }

    const links: any[] = [];

    // PRIORITY 1: Use product-specific dependency overrides (highest priority)
    if (productDependencies && productDependencies.length > 0) {
      const productLinks = mapProductDependenciesToPhases(
        productDependencies,
        phases
      );

      links.push(...productLinks);
    } else {
      // PRIORITY 2: Use company-level dependencies only as fallback when no product dependencies
      if (companyDependencies && companyDependencies.length > 0) {
        const companyLinks = mapCompanyDependenciesToProduct(
          companyDependencies,
          phases
        );

        links.push(...companyLinks);
      }
    }

    // PRIORITY 3: Fallback to sequential links only if no dependencies exist
    if (
      (!productDependencies || productDependencies.length === 0) &&
      (!companyDependencies || companyDependencies.length === 0)
    ) {
      // Fallback: Sequential finish-to-start (for products without defined dependencies)
      for (let i = 0; i < phases.length - 1; i++) {
        const currentPhase = phases[i];
        const nextPhase = phases[i + 1];

        links.push({
          id: `link-${currentPhase.id}-${nextPhase.id}`,
          source: `phase-${currentPhase.id}`,
          target: `phase-${nextPhase.id}`,
          type: "e2s",
        });
      }
    }

    // Add sub-task dependencies within each phase (preserve existing functionality)
    phases.forEach((phase) => {
      const phaseTasks = ganttTasks.filter(
        (task) =>
          task.phaseId === phase.id &&
          task.type === "summary" &&
          !task.documentId
      );

      if (phaseTasks.length > 1) {
        const firstTask = phaseTasks[0];
        const secondTask = phaseTasks[1];

        if (firstTask && secondTask) {
          links.push({
            id: `link-${firstTask.id}-${secondTask.id}-ss`,
            source: firstTask.id.toString(),
            target: secondTask.id.toString(),
            type: "s2s",
          });
        }

        const lastTask = phaseTasks[phaseTasks.length - 1];
        const secondLastTask = phaseTasks[phaseTasks.length - 2];

        if (lastTask && secondLastTask) {
          links.push({
            id: `link-${secondLastTask.id}-${lastTask.id}-ff`,
            source: secondLastTask.id.toString(),
            target: lastTask.id.toString(),
            type: "e2e",
          });
        }
      }
    });

    return links;
  }, [phases, ganttTasks, companyDependencies, productDependencies]); // ✅ Added both dependency sources

  useEffect(() => {
    setGanttLinks(generateTaskLinks);
  }, [generateTaskLinks]);

  // Load dependencies from BOTH company-level AND product-specific tables (with infinite loop protection)
  useEffect(() => {
    const fetchAllDependencies = async () => {
      if (!product?.company_id || !productId) {
        dependenciesFetchedRef.current = null;
        return;
      }

      // Prevent duplicate fetches for the same company/product combination
      const fetchKey = `${product.company_id}-${productId}`;
      if (dependenciesFetchedRef.current === fetchKey) {
        return;
      }

      dependenciesFetchedRef.current = fetchKey;

      try {
        // 1. Fetch company-level dependencies (from Company Settings)
        const { data: companyDeps, error: companyError } = await supabase
          .from("phase_dependencies")
          .select("*")
          .eq("company_id", product.company_id);

        if (companyError) {
          console.error(
            "[ProductGanttV3Page] Error fetching company dependencies:",
            companyError
          );
        }

        // 2. Fetch product-specific dependency overrides
        const { data: productDeps, error: productError } = await supabase
          .from("product_phase_dependencies")
          .select("*")
          .eq("product_id", productId);

        if (productError) {
          console.error(
            "[ProductGanttV3Page] Error fetching product dependencies:",
            productError
          );
        }

        setCompanyDependencies(companyDeps || []);
        setProductDependencies(productDeps || []);
      } catch (error) {
        console.error(
          "[ProductGanttV3Page] Unexpected error fetching dependencies:",
          error
        );
        dependenciesFetchedRef.current = null;
        setCompanyDependencies([]);
        setProductDependencies([]);
      }
    };

    fetchAllDependencies();
  }, [product?.company_id, productId]);

  // Initialize phase durations when phases load
  useEffect(() => {
    if (phases && phases.length > 0) {
      phases.forEach((phase) => {
        if (phase.start_date && phase.end_date) {
          const duration = calculateDuration(
            new Date(phase.start_date),
            new Date(phase.end_date)
          );
          initializePhaseDuration(phase.id, duration);
        }
      });
    }
  }, [phases, initializePhaseDuration]);

  // Document counts fetching
  useEffect(() => {
    const fetchDocumentData = async () => {
      if (!phases || phases.length === 0 || !product?.company_id) {
        return;
      }

      // Prevent duplicate fetches for the same company/phases combination
      const fetchKey = `${product.company_id}-${phases.length}-${phases.map((p) => p.phase_id).join(",")}`;
      if (documentsLoadedRef.current === fetchKey) {
        return;
      }

      try {
        setDocumentsLoading(true);
        documentsLoadedRef.current = fetchKey;

        const phaseIds = phases.map((phase) => phase.phase_id).filter(Boolean);

        if (phaseIds.length === 0) {
          setDocumentsLoading(false);
          return;
        }

        // Batch fetch individual documents for all phases
        const documentsMap =
          await GanttPhaseDocumentService.getBatchPhaseIndividualDocuments(
            phaseIds,
            product.company_id,
            product.id
          );

        // Calculate document counts from individual documents
        const counts: Record<string, number> = {};
        Object.entries(documentsMap).forEach(([phaseId, docs]) => {
          counts[phaseId] = docs.length;
        });

        setIndividualDocuments(documentsMap);
        setDocumentCounts(counts);
      } catch (error) {
        documentsLoadedRef.current = null;
      } finally {
        setDocumentsLoading(false);
      }
    };

    fetchDocumentData();
  }, [phases, product?.company_id]);

  // Cleanup pending updates on unmount
  useEffect(() => {
    return () => {
      cancelAllUpdates();

      Object.values(documentUpdateDebouncersRef.current).forEach(
        (debouncer) => {
          debouncer.cancel();
        }
      );
      documentUpdateDebouncersRef.current = {};

      // Clear optimistic updates on unmount
      setOptimisticDocumentUpdates({});
    };
  }, [cancelAllUpdates]);

  // Only show loading on initial load, not during cascading updates
  if (
    (productLoading || phasesLoading || documentsLoading) &&
    !isUpdating &&
    phases.length === 0
  ) {
    return (
      <div>
        <Card>
          <CardContent className="!p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              <span className="ml-2">
                {documentsLoading
                  ? lang('ganttChart.loadingData')
                  : lang('ganttChart.loadingGanttChart')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (productError || phasesError) {
    return (
      <div>
        <Card>
          <CardContent className="!p-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h3 className="text-lg font-medium mb-2">{lang('ganttChart.errorLoadingData')}</h3>
              <p className="text-muted-foreground">
                {productError?.message ||
                  phasesError?.message ||
                  lang('ganttChart.failedToLoadProductData')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!phases || phases.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">{lang('ganttChart.noPhasesAvailable')}</h3>
            <p className="text-muted-foreground">
              {lang('ganttChart.addPhasesToSeeGanttChart')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render the Gantt chart
  return (
    <div>
      <style>{ganttAnimationStyles}</style>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {lang('ganttChart.ganttChartTimeline')}
              {(isUpdating ||
                documentsLoading ||
                Object.values(documentUpdating).some(Boolean)) && (
                <div className="text-xs flex items-center gap-2 text-foreground/45 ml-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {(isUpdating && lang('ganttChart.updatingPhases')) ||
                    (documentsLoading && lang('ganttChart.loadingData')) ||
                    (Object.values(documentUpdating).some(Boolean) &&
                      lang('ganttChart.updatingDocuments')) ||
                    lang('ganttChart.loading')}
                </div>
              )}
            </CardTitle>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {lang('ganttChart.zoom')}: {zoomLevels[currentZoomLevel]?.name}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={currentZoomLevel === 0 || isUpdating}
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetZoom}
                  disabled={isUpdating}
                  title="Reset Zoom"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={
                    currentZoomLevel === zoomLevels.length - 1 || isUpdating
                  }
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm bg-blue-500 text-white font-semibold px-2 py-1 rounded-full">
                {lang('ganttChart.readOnly')}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`w-full max-h-[800px] border rounded-md overflow-hidden ${isUpdating || Object.values(documentUpdating).some(Boolean) ? "wx-gantt-updating" : ""}`}
            onClick={(e) => {
              try {
                const target = e.target as HTMLElement;
                if (
                  !target ||
                  !productId ||
                  isUpdating ||
                  documentsLoading ||
                  Object.values(documentUpdating).some(Boolean)
                ) {
                  return;
                }
                if (
                  target.classList.contains("wx-toggle-icon") ||
                  target.closest(".wx-toggle-icon")
                ) {
                  return;
                }

                const handleTaskNavigation = (() => {
                  let navigationTimeout: NodeJS.Timeout | null = null;

                  return (taskText: string, taskType: string) => {
                    if (navigationTimeout) {
                      clearTimeout(navigationTimeout);
                    }
                    if (!taskText || !taskText.trim() || !productId) {
                      return;
                    }
                    navigationTimeout = setTimeout(() => {
                      try {
                        let navigationUrl = "";
                        let pageName = "";
                        const trimmedText = taskText.trim();

                        const getMainTaskName = (
                          subTaskText: string
                        ): string | null => {
                          const clickedTask = ganttTasks.find(
                            (task) => task.text === subTaskText
                          );
                          if (!clickedTask) return null;

                          if (clickedTask.parent) {
                            const parentTask = ganttTasks.find(
                              (task) => task.id === clickedTask.parent
                            );
                            return parentTask ? parentTask.text : null;
                          }
                          return clickedTask.text;
                        };

                        const mainTaskName = getMainTaskName(trimmedText);

                        if (trimmedText.match(/^Documents\s*\(\d+\)$/)) {
                          navigationUrl = `/app/product/${productId}/documents`;
                          pageName = "Documents";
                        } else if (trimmedText === "Gap Analysis") {
                          navigationUrl = `/app/product/${productId}/gap-analysis`;
                          pageName = "Gap Analysis";
                        } else if (trimmedText === "Activities") {
                          navigationUrl = `/app/product/${productId}/activities`;
                          pageName = "Activities";
                        } else if (trimmedText === "Audit") {
                          navigationUrl = `/app/product/${productId}/audit`;
                          pageName = "Audit";
                        } else if (trimmedText === "Clinical Trials") {
                          navigationUrl = `/app/product/${productId}/clinical-trials`;
                          pageName = "Clinical Trials";
                        }

                        if (navigationUrl && pageName) {
                          if (mainTaskName) {
                            const encodedMainTaskName =
                              encodeURIComponent(mainTaskName);
                            navigationUrl += `?filter=${encodedMainTaskName}`;
                          }

                          if (
                            window.location.pathname ===
                            navigationUrl.split("?")[0]
                          ) {
                            return;
                          }
                          navigate(navigationUrl);
                          toast.success(lang('ganttChart.redirectingToPage').replace('{{page}}', pageName));
                        } else {
                          console.log(
                            `[ProductGanttV3Page] No navigation defined for task: "${trimmedText}"`
                          );
                        }
                      } catch (navError) {
                        toast.error(lang('ganttChart.navigationFailed'));
                      }
                    }, 150);
                  };
                })();

                if (
                  target.classList.contains("wx-content") &&
                  target.classList.contains("x2-1qryx5p")
                ) {
                  const taskText = target.textContent || "";
                  if (taskText.trim()) {
                    handleTaskNavigation(taskText, "direct-click");
                  }
                  return;
                }

                const contentParent = target.closest(".wx-content.x2-1qryx5p");
                if (contentParent && contentParent instanceof HTMLElement) {
                  const taskText = contentParent.textContent || "";
                  if (taskText.trim()) {
                    handleTaskNavigation(taskText, "parent-click");
                  }
                  return;
                }
              } catch (error) {
                console.error(
                  "[ProductGanttV3Page] Click handler error:",
                  error
                );
              }
            }}
          >
            <div className="hide-progress hide-links hide-drag h-full overflow-hidden">
              <Willow>
                <Gantt
                  api={(api: any) => handleGanttReady(api)}
                  zoom={zoomConfig}
                  tasks={ganttTasks}
                  links={ganttLinks}
                  markers={ganttMarkers}
                  onTaskClick={(task: any) => handleSubTaskClick(task)}
                  readonly={true}
                />
              </Willow>
            </div>
          </div>
        </CardContent>
      </Card>

      {showDocumentDialog && selectedPhaseId && (
        <PhaseDocumentDialog
          open={showDocumentDialog}
          onClose={() => setShowDocumentDialog(false)}
          phaseId={selectedPhaseId}
          phaseName={selectedPhaseName}
          productId={productId!}
          companyId={product?.company_id || ""}
        />
      )}
    </div>
  );
}
