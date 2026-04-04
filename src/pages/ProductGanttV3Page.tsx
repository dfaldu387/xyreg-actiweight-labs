import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Gantt, Willow } from "wx-react-gantt";
import "wx-react-gantt/dist/gantt.css";
import { useProductPhases } from "@/hooks/useProductPhases";
import { useProductDetails } from "@/hooks/useProductDetails";
import { useGanttPhaseUpdate } from "@/hooks/useGanttPhaseUpdate";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { useProductCompanyGuard } from "@/hooks/useProductCompanyGuard";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, AlertCircle, ZoomIn, ZoomOut, RotateCcw, Loader2 } from "lucide-react";
import { PhaseDocumentDialog } from "@/components/product/timeline/PhaseDocumentDialog";
import { toast } from 'sonner';
import { parsePhaseIdFromTaskId, parseDocumentIdFromTaskId, isDocumentTask, calculateDuration, mapCompanyDependenciesToProduct, mapProductDependenciesToPhases, calculateDocumentEndDate, calculateDocumentsSummaryDuration, createDocumentUpdateDebouncer, calculateDocumentStartDate } from "@/utils/ganttUtils";
import { UpdateTaskEvent, MoveTaskEvent, GanttTask } from "@/types/ganttChart";
import { GanttPhaseDocumentService, IndividualDocument } from "@/services/ganttPhaseDocumentService";
import { PhaseDocumentCountService } from "@/services/phaseDocumentCountService";
import { detectProductType, ProductType } from "@/utils/productTypeDetection";
import { PhaseMetricsService } from "@/services/phaseMetricsService";

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
    opacity: 0.95;
  }
  
  /* Enable task movement handles */
  .wx-gantt .wx-task-handle {
    cursor: move !important;
    pointer-events: auto !important;
  }
  
  .wx-gantt .wx-task-resize-handle {
    cursor: ew-resize !important;
    pointer-events: auto !important;
  }
  
  /* Ensure task bars are draggable */
  .wx-gantt .wx-task-bar {
    cursor: move !important;
    pointer-events: auto !important;
  }
  
  /* Progress indicator styles */
  .wx-gantt .wx-task-progress {
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 500;
    z-index: 10;
    pointer-events: none;
  }
  
  /* Progress bar overlay */
  .wx-gantt .wx-task-bar::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: rgba(255, 255, 255, 0.3);
    border-radius: inherit;
    transition: width 0.3s ease;
  }

  /* Custom task type styles */
  
  /* Overdue task styling - RED */
  .wx-gantt .wx-bar.wx-task.overdue {
    background-color: #dc2626 !important;
    border: 2px solid #b91c1c !important;
    color: white !important;
  }
  .wx-gantt .wx-bar.wx-task.overdue .wx-progress-percent {
    background-color: #991b1b !important;
  }
  .wx-gantt .wx-bar.wx-task.overdue .wx-link {
    background-color: #7f1d1d !important;
  }
  .wx-gantt .wx-bar.wx-task.overdue .wx-link .wx-inner {
    background-color: #7f1d1d !important;
  }
`;

const dayStyle = {
    backgroundColor: "#e8e8e8",
};

const hoursTemplate = (date: Date) => {
    return `${date.getHours()}:${date.getMinutes()}`;
};

// Dummy assignment data for demonstration
const dummyAssignees = [
    { name: "John Smith" },
    { name: "Sarah Johnson" },
    { name: "Mike Wilson" },
    { name: "David Brown" },
    { name: "Lisa Anderson" },
    { name: "Tom Miller" },
    { name: "Anna Taylor" }
];

// Helper function to get random assignee
const getRandomAssignee = () => {
    return dummyAssignees[Math.floor(Math.random() * dummyAssignees.length)];
};

// Custom task types configuration
const taskTypes = [
    { id: "task", label: "Task" },
    { id: "summary", label: "Summary task" },
    { id: "milestone", label: "Milestone" },
    { id: "overdue", label: "Overdue" },
];

// Helper function to determine if a task is overdue
const isTaskOverdue = (endDate: Date, progress: number): boolean => {
    const now = new Date();
    return endDate < now && progress < 100;
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
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();
    const { activeCompanyRole } = useCompanyRole();
    const ganttApiRef = useRef<any>(null); // Gantt API reference
    const [apiReady, setApiReady] = useState(false); // Track if API is ready
    const [currentZoomLevel, setCurrentZoomLevel] = useState(3); // Zoom state management
    const [ganttLinks, setGanttLinks] = useState<any[]>([]); // Task links state management
    const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
    const [selectedPhaseName, setSelectedPhaseName] = useState<string>('');
    const [showDocumentDialog, setShowDocumentDialog] = useState(false);
    const [documentCounts, setDocumentCounts] = useState<Record<string, number>>({}); // Document counts state management
    const [individualDocuments, setIndividualDocuments] = useState<Record<string, IndividualDocument[]>>({}); // Individual documents per phase
    const [documentCompletionPercentages, setDocumentCompletionPercentages] = useState<Record<string, number>>({}); // Document completion percentages per phase
    const [documentsLoading, setDocumentsLoading] = useState(false); // Track document loading state
    const [isUpdating, setIsUpdating] = useState(false); // Track if cascading update is in progress
    const [documentUpdating, setDocumentUpdating] = useState<Record<string, boolean>>({}); // Track individual document updates
    const [optimisticDocumentUpdates, setOptimisticDocumentUpdates] = useState<Record<string, { start?: Date; end?: Date }>>({}); // Track optimistic document date updates
    const [companyDependencies, setCompanyDependencies] = useState<any[]>([]); // Company-level dependencies from database
    const [productDependencies, setProductDependencies] = useState<any[]>([]); // Product-specific dependency overrides
    const [taskProgressData, setTaskProgressData] = useState<Record<string, { progress: number; status: string }>>({}); // Task progress data
    const dependenciesFetchedRef = useRef<string | null>(null); // Prevent duplicate dependency fetches
    const documentsLoadedRef = useRef<string | null>(null); // Prevent duplicate document fetches
    const documentUpdateDebouncersRef = useRef<Record<string, ReturnType<typeof createDocumentUpdateDebouncer>>>({}); // Document update debouncers
    const [categoryMap, setCategoryMap] = useState<Record<string, string>>({}); // Category ID to name mapping
    const [productType, setProductType] = useState<ProductType | null>(null); // Track current product type
    const [gapAnalysisCounts, setGapAnalysisCounts] = useState<Record<string, number>>({});
    const [gapAnalysisPercentages, setGapAnalysisPercentages] = useState<Record<string, number>>({});
    
    // Expansion state management with localStorage persistence
    const [taskExpansionState, setTaskExpansionState] = useState<Record<string, boolean>>({});
    const EXPANSION_STORAGE_KEY = `gantt-expansion-${productId}`;
    const PRODUCT_TYPE_STORAGE_KEY = `gantt-product-type-${productId}`; // Track saved product type for comparison

    // Helper function to find category ID by name
    const findCategoryIdByName = useCallback((categoryName: string): string | null => {
        const normalize = (s: string) => s
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim()
            .replace(/\s+/g, ' ');

        const target = normalize(categoryName);

        // Aliases we accept for key categories
        const aliases: Record<string, string[]> = {
            'design control steps': ['design control steps', 'design & risk controls', 'design controls'],
            'supply chain & quality assurance': ['supply chain & quality assurance', 'supply chain and quality assurance', 'supply chain quality assurance', 'supplier management', 'supply chain'],
            'post-market & lifecycle management': ['post-market & lifecycle management', 'post markets & lifecycle management', 'post markets and lifecycle management', 'post-market and lifecycle management', 'post market & lifecycle management', 'post markets', 'post-market'],
        };

        // Expand the requested category name to its alias set if known
        const acceptableTargets = new Set<string>([target]);
        for (const [canonical, list] of Object.entries(aliases)) {
            if (list.some(a => normalize(a) === target) || normalize(canonical) === target) {
                list.forEach(a => acceptableTargets.add(normalize(a)));
                acceptableTargets.add(normalize(canonical));
                break;
            }
        }

        // Keyword fallback matchers for robustness
        const isSupplyChainLike = (n: string) => n.includes('supply') && (n.includes('quality') || n.includes('supplier'));
        const isPostMarketLifecycleLike = (n: string) => n.includes('post') && n.includes('lifecycle');

        for (const [categoryId, name] of Object.entries(categoryMap)) {
            const normalizedName = normalize(name);
            if (acceptableTargets.has(normalizedName)) {
                return categoryId;
            }
            // Also allow contains match for slight wording differences
            for (const t of acceptableTargets) {
                if (normalizedName.includes(t) || t.includes(normalizedName)) {
                    return categoryId;
                }
            }
            // Fallback by intent-based keywords
            if (target.includes('supply chain & quality assurance') && isSupplyChainLike(normalizedName)) {
                return categoryId;
            }
            if (target.includes('post market') && target.includes('lifecycle') && isPostMarketLifecycleLike(normalizedName)) {
                return categoryId;
            }
        }
        return null;
    }, [categoryMap]);

    const getDefaultExpansionState = useCallback((type: ProductType | null, categoryMap: Record<string, string>): Record<string, boolean> => {
        const defaults: Record<string, boolean> = {};
        
        if (!type || Object.keys(categoryMap).length === 0) {
            return defaults;
        }

        const designControlId = findCategoryIdByName('Design Control Steps');
        const supplyChainId = findCategoryIdByName('Supply Chain & Quality Assurance');
        const pmsId = findCategoryIdByName('Post-Market & Lifecycle Management');

        if (type === 'legacy_product') {
            if (designControlId) {
                defaults[`category-${designControlId}`] = false;
            }
            if (supplyChainId) {
                defaults[`category-${supplyChainId}`] = true;
            }
            if (pmsId) {
                defaults[`category-${pmsId}`] = true;
            }
        } else {
            if (designControlId) {
                defaults[`category-${designControlId}`] = true;
            }
            if (supplyChainId) {
                defaults[`category-${supplyChainId}`] = true;
            }
            if (pmsId) {
                defaults[`category-${pmsId}`] = false;
            }
        }

        return defaults;
    }, [findCategoryIdByName]);

    useEffect(() => {
        if (!productId || !productType || Object.keys(categoryMap).length === 0) return;
        
        const savedState = localStorage.getItem(EXPANSION_STORAGE_KEY);
        const savedProductType = localStorage.getItem(PRODUCT_TYPE_STORAGE_KEY);
        const categoryDefaults = getDefaultExpansionState(productType, categoryMap);
        const productTypeChanged = savedProductType !== productType;
        
        // For legacy products, enforce defaults and do not merge saved expansion
        if (productType === 'legacy_product') {
            try {
                console.log('[check-product-type]: applying legacy defaults', {
                    categoryMap,
                    defaults: categoryDefaults
                });
            } catch {}
            setTaskExpansionState(categoryDefaults);
            localStorage.setItem(EXPANSION_STORAGE_KEY, JSON.stringify(categoryDefaults));
            localStorage.setItem(PRODUCT_TYPE_STORAGE_KEY, productType);
            return;
        }

        if (savedState && !productTypeChanged) {
            try {
                const parsedState = JSON.parse(savedState);
                const mergedState = {
                    ...parsedState,
                    ...categoryDefaults
                };
                setTaskExpansionState(mergedState);
                localStorage.setItem(EXPANSION_STORAGE_KEY, JSON.stringify(mergedState));
            } catch (error) {
                setTaskExpansionState(categoryDefaults);
                localStorage.setItem(EXPANSION_STORAGE_KEY, JSON.stringify(categoryDefaults));
                localStorage.setItem(PRODUCT_TYPE_STORAGE_KEY, productType);
            }
        } else {
            if (savedState && productTypeChanged) {
                try {
                    const parsedState = JSON.parse(savedState);
                    const updatedState = { ...parsedState };
                    Object.keys(categoryDefaults).forEach(categoryTaskId => {
                        updatedState[categoryTaskId] = categoryDefaults[categoryTaskId];
                    });
                    
                    setTaskExpansionState(updatedState);
                    localStorage.setItem(EXPANSION_STORAGE_KEY, JSON.stringify(updatedState));
                    localStorage.setItem(PRODUCT_TYPE_STORAGE_KEY, productType);
                } catch (error) {
                    setTaskExpansionState(categoryDefaults);
                    localStorage.setItem(EXPANSION_STORAGE_KEY, JSON.stringify(categoryDefaults));
                    localStorage.setItem(PRODUCT_TYPE_STORAGE_KEY, productType);
                }
            } else {
                setTaskExpansionState(categoryDefaults);
                localStorage.setItem(EXPANSION_STORAGE_KEY, JSON.stringify(categoryDefaults));
                localStorage.setItem(PRODUCT_TYPE_STORAGE_KEY, productType);
            }
        }
    }, [productId, productType, categoryMap, EXPANSION_STORAGE_KEY, PRODUCT_TYPE_STORAGE_KEY, getDefaultExpansionState]);

    // Save expansion state to localStorage
    const saveExpansionState = useCallback((newState: Record<string, boolean>) => {
        setTaskExpansionState(newState);
        localStorage.setItem(EXPANSION_STORAGE_KEY, JSON.stringify(newState));
        if (productType) {
            localStorage.setItem(PRODUCT_TYPE_STORAGE_KEY, productType);
        }
    }, [EXPANSION_STORAGE_KEY, productType, PRODUCT_TYPE_STORAGE_KEY]);

    // Handle task expansion toggle
    const handleTaskExpansion = useCallback((taskId: string, isExpanded: boolean) => {
        const newState = {
            ...taskExpansionState,
            [taskId]: isExpanded
        };
        saveExpansionState(newState);
    }, [taskExpansionState, saveExpansionState]);

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

    // Validate user has access to product's company (auto-switches context if needed)
    const { isValidating } = useProductCompanyGuard(product, productLoading);

    useEffect(() => {
        if (product) {
            // Prefer explicit project type if provided on the product
            const hasLegacyProjectType = Array.isArray((product as any).project_types)
                && (product as any).project_types.some((t: string) => (t || '').toLowerCase() === 'legacy product');

            if (hasLegacyProjectType) {
                setProductType('legacy_product' as ProductType);
                return;
            }

            const detectedType = detectProductType(product);
            setProductType(detectedType);
        }
    }, [product]);

    // Debug: log detected product type on load and when it changes
    useEffect(() => {
        if (!productType) return;
        try {
            console.log('[check-product-type]:', {
                productId,
                productName: product?.name,
                productType,
                project_types: (product as any)?.project_types || null
            });
        } catch {}
    }, [productType, productId, product?.name, (product as any)?.project_types]);

    // Handle document task update events (resize, drag, date change)
    const handleDocumentUpdate = useCallback(async (event: UpdateTaskEvent) => {
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
            .find(doc => doc.id === documentId);
        
        if (!document) {
            return;
        }

        const phase = phases?.find(p => p.phase_id === document.phaseId);
        if (!phase) {
            return;
        }

        const phaseStartDate = phase.start_date ? new Date(phase.start_date) : undefined;
        const phaseEndDate = phase.end_date ? new Date(phase.end_date) : undefined;
        
        // Validate both start and end dates if provided
        if (start) {
            const startValidation = GanttPhaseDocumentService.validateDocumentDueDate(start, phaseStartDate, phaseEndDate);
            if (!startValidation.isValid) {
                toast.error(startValidation.error || 'Invalid start date');
                return;
            }
        }
        
        if (end) {
            const endValidation = GanttPhaseDocumentService.validateDocumentDueDate(end, phaseStartDate, phaseEndDate);
            if (!endValidation.isValid) {
                toast.error(endValidation.error || 'Invalid due date');
                return;
            }
        }

        // Apply optimistic update immediately
        setOptimisticDocumentUpdates(prev => ({
            ...prev,
            [documentId]: {
                ...prev[documentId],
                ...(start && { start }),
                ...(end && { end })
            }
        }));
        setDocumentUpdating(prev => ({ ...prev, [documentId]: true }));

        if (!documentUpdateDebouncersRef.current[documentId]) {
            documentUpdateDebouncersRef.current[documentId] = createDocumentUpdateDebouncer(
                async (dates: { startDate?: Date; dueDate?: Date }) => {
                    try {
                        const result = await GanttPhaseDocumentService.updateDocumentDates(
                            documentId,
                            dates.dueDate,
                            dates.startDate
                        );

                        if (result.success) {
                            toast.success(`Updated ${document.name} dates`);
                            
                            // Update the local document state immediately with the new dates
                            setIndividualDocuments(prev => {
                                const newState = { ...prev };
                                Object.keys(newState).forEach(phaseId => {
                                    newState[phaseId] = newState[phaseId].map(doc => 
                                        doc.id === documentId 
                                            ? { 
                                                ...doc, 
                                                ...(dates.dueDate && { due_date: dates.dueDate.toISOString().split('T')[0] }),
                                                ...(dates.startDate && { start_date: dates.startDate.toISOString().split('T')[0] })
                                            }
                                            : doc
                                    );
                                });
                                return newState;
                            });
                            
                            // Clear optimistic update immediately since we've updated local state
                            setOptimisticDocumentUpdates(prev => {
                                const newState = { ...prev };
                                delete newState[documentId];
                                return newState;
                            });
                            
                        } else {
                            toast.error(result.error || 'Failed to update document dates');
                            // Revert optimistic update on error
                            setOptimisticDocumentUpdates(prev => {
                                const newState = { ...prev };
                                delete newState[documentId];
                                return newState;
                            });
                        }
                    } catch (error) {
                        toast.error('Failed to update document dates');
                        // Revert optimistic update on error
                        setOptimisticDocumentUpdates(prev => {
                            const newState = { ...prev };
                            delete newState[documentId];
                            return newState;
                        });
                    } finally {
                        setDocumentUpdating(prev => ({ ...prev, [documentId]: false }));
                    }
                },
                500
            );
        }

        // Execute the debounced update
        documentUpdateDebouncersRef.current[documentId].execute({ 
            startDate: start, 
            dueDate: end 
        });
    }, [individualDocuments, phases, product?.company_id]);

    // Handle task update events (resize, drag, date change)
    const handleTaskUpdate = useCallback(async (event: UpdateTaskEvent) => {
        const taskId = event.id.toString();

        // Check if this is a document task
        if (isDocumentTask(taskId)) {
            await handleDocumentUpdate(event);
            return;
        }

        const phaseId = parsePhaseIdFromTaskId(taskId);
        if (!phaseId) return;

        const phase = phases?.find(p => p.id === phaseId); // Find the corresponding phase
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
                        .from('lifecycle_phases')
                        .select('*, likelihood_of_success')
                        .eq('product_id', productId);

                    if (updatedPhases) {
                        // Get company chosen phases for additional data
                        const { data: chosenPhases } = await supabase
                            .from('company_chosen_phases')
                            .select(`
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
                            `)
                            .eq('company_id', product?.company_id);

                        refetchPhases();
                    }
                } catch (error) {
                    console.error('[ProductGanttV3Page] Error during silent refresh:', error);
                    refetchPhases();
                }

                setTimeout(() => {
                    setIsUpdating(false);
                }, 600);
            }
        );
    }, [phases, ganttLinks, initializePhaseDuration, schedulePhaseUpdateWithCascading, refetchPhases, productId, product?.company_id, handleDocumentUpdate]);


    // Handle task move events
    const handleTaskMove = useCallback(async (event: MoveTaskEvent) => {
        console.log('[gantt-chart-event-capture] Task Move Event');
    }, []);


    // Handle task drag events
    const handleTaskDrag = useCallback((event: any) => {
        console.log('[gantt-chart-event-capture] Task Drag Event');
    }, []);


    // Handle link creation/update events
    const handleLinkUpdate = useCallback((event: any) => {
        console.log('[gantt-chart-event-capture] Link Update Event');
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

        // Subscribe to update-task event
        const unsubscribeUpdate = api.on('update-task', (ev: any) => {
            handleTaskUpdate(ev);
        });

        // Subscribe to move-task event
        const unsubscribeMove = api.on('move-task', (ev: any) => {
            handleTaskMove(ev);
        });

        // Subscribe to drag-task event
        const unsubscribeDrag = api.on('drag-task', (ev: any) => {
            handleTaskDrag(ev);
        });

        // Subscribe to update-link event
        const unsubscribeLink = api.on('update-link', (ev: any) => {
            handleLinkUpdate(ev);
        });

        // Subscribe to the correct open-task event
        const unsubscribeOpenTask = api.on('open-task', (ev: any) => {
            if (ev && ev.id) {
                const isExpanded = ev.mode === true;
                handleTaskExpansion(ev.id.toString(), isExpanded);
            }
        });

        // Additional events to try for debugging
        const unsubscribeTaskDrag = api.on('task-drag', (ev: any) => {
            console.log('[gantt-chart-event-capture] Raw task-drag event received:', ev);
        });

        const unsubscribeAfterUpdate = api.on('after-update', (ev: any) => {
            console.log('[gantt-chart-event-capture] Raw after-update event received:', ev);
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
    }, [apiReady, handleTaskUpdate, handleTaskMove, handleTaskDrag, handleLinkUpdate, handleTaskExpansion]);

    // Zoom configuration & handlers
    const zoomConfig = useMemo(() => ({
        maxCellWidth: 400,
        level: currentZoomLevel,
        levels: zoomLevels,
    }), [currentZoomLevel]);

    const handleZoomIn = () => {
        if (currentZoomLevel < zoomLevels.length - 1) {
            setCurrentZoomLevel(prev => prev + 1);
        }
    };

    const handleZoomOut = () => {
        if (currentZoomLevel > 0) {
            setCurrentZoomLevel(prev => prev - 1);
        }
    };

    const handleResetZoom = () => {
        setCurrentZoomLevel(3);
    };

    const handleSubTaskClick = (task: GanttTask) => {

        if (task.documentId) {
            toast.info(`Opening document: ${task.text}`);
        } else if (task.isDocumentContainer && task.phaseId) {
            // Document container clicked - show phase document dialog
            const phase = phases?.find(p => p.id === task.phaseId);
            if (phase) {
                setSelectedPhaseId(task.phaseId);
                setSelectedPhaseName(phase.name);
                setShowDocumentDialog(true);
            }
        } else if (task.subTaskType === 'document' && task.phaseId) {
            // Legacy document task clicked (fallback)
            const phase = phases?.find(p => p.id === task.phaseId);
            if (phase) {
                setSelectedPhaseId(task.phaseId);
                setSelectedPhaseName(phase.name);
                setShowDocumentDialog(true);
            }
        } else {
            toast.info(`${task.text} functionality coming soon!`);
        }
    };

    // Columns configuration for Gantt chart
    const columns = useMemo(() => [
        { id: "text", header: "Task name", width: 160 },
        { id: "start", header: "Start date", width: 80 },
        { 
            id: "assigned", 
            header: "Assigned", 
            width: 90,
            template: (assignedName: string) => {
                if (!assignedName || assignedName.trim() === '') {
                    return '-';
                }
                return assignedName;
            }
        },
        { id: "duration", header: "Duration", width: 60, align: "center" },
        { id: "action", header: "", width: 40, align: "center" }
    ], []);

    // Gantt tasks transformation - PRODUCT-SPECIFIC DATA FIRST
    const ganttTasks = useMemo((): GanttTask[] => {
        if (!phases || phases.length === 0) {
            return [];
        }

        const tasks: GanttTask[] = [];
        let taskIdCounter = 1;

        // Group phases by category
        const phasesByCategory: Record<string, typeof phases> = {};
        phases.forEach(phase => {
            const categoryId = (phase as any).category_id || 'loading...';
            if (!phasesByCategory[categoryId]) {
                phasesByCategory[categoryId] = [];
            }
            phasesByCategory[categoryId].push(phase);
        });

        // Create tasks for each category
        Object.entries(phasesByCategory).forEach(([categoryId, categoryPhases]) => {
            // Get category name
            const categoryName = categoryId === 'loading...' 
                ? 'loading...' 
                : categoryMap[categoryId] || 'loading...';
            
            // Calculate category dates (earliest start, latest end)
            let categoryStartDate: Date | null = null;
            let categoryEndDate: Date | null = null;

            // First pass: collect all phase dates to calculate category range
            categoryPhases.forEach((phase, phaseIndex) => {
                const phaseStartDate = phase.start_date ? new Date(phase.start_date) : null;
                const phaseEndDate = phase.end_date ? new Date(phase.end_date) : null;
                
                if (phaseStartDate && phaseEndDate) {
                    if (!categoryStartDate || phaseStartDate < categoryStartDate) {
                        categoryStartDate = phaseStartDate;
                    }
                    if (!categoryEndDate || phaseEndDate > categoryEndDate) {
                        categoryEndDate = phaseEndDate;
                    }
                }
            });

            // If no dates found, use fallback
            if (!categoryStartDate || !categoryEndDate) {
                categoryStartDate = new Date();
                categoryEndDate = new Date(categoryStartDate.getTime() + categoryPhases.length * 30 * 24 * 60 * 60 * 1000); // 30 days per phase
            }

            // Create category parent task
            const categoryTask: GanttTask = {
                id: `category-${categoryId}`,
                text: `${categoryName} (${categoryPhases.length} Phase${categoryPhases.length !== 1 ? 's' : ''})`,
                start: categoryStartDate,
                end: categoryEndDate,
                type: 'summary',
                open: taskExpansionState[`category-${categoryId}`] === true,
            };
            tasks.push(categoryTask);

            // Create phase tasks as children of category
            categoryPhases.forEach((phase, phaseIndex) => {
                const phaseStartDate = phase.start_date ? new Date(phase.start_date) : null;
                const phaseEndDate = phase.end_date ? new Date(phase.end_date) : null;

                // Use actual product dates if available, otherwise use intelligent defaults
                let displayStartDate: Date;
                let displayEndDate: Date;

                if (phaseStartDate && phaseEndDate) {
                    displayStartDate = phaseStartDate;
                    displayEndDate = phaseEndDate;
                } else {
                    // Fallback to calculated dates based on project timeline
                    const projectStart = new Date();
                    const dayOffset = phaseIndex * 7; // 7 days per phase spacing
                    displayStartDate = new Date(projectStart.getTime() + dayOffset * 24 * 60 * 60 * 1000);
                    displayEndDate = new Date(displayStartDate.getTime() + (phase.duration_days || 14) * 24 * 60 * 60 * 1000);
                }

                // Main phase task based on product-specific data
                const phaseProgress = taskProgressData[`phase-${phase.id}`]?.progress || 0;
                
                const phaseTask: GanttTask = {
                    id: `phase-${phase.id}`,
                    text: phase.name,
                    start: displayStartDate,
                    end: displayEndDate,
                    type: isTaskOverdue(displayEndDate, phaseProgress) ? 'overdue' : 'summary',
                    parent: `category-${categoryId}`, // Set parent to category
                    open: taskExpansionState[`phase-${phase.id}`] === true,
                    phaseId: phase.id,
                    progress: phaseProgress,
                    progressStatus: taskProgressData[`phase-${phase.id}`]?.status as any || 'not-started'
                };
                tasks.push(phaseTask);

                // Sub-tasks with nested document structure
                const documentCount = documentCounts[phase.phase_id] || 0;
                const phaseIndividualDocs = individualDocuments[phase.phase_id] || [];
                const completionPercentage = documentCompletionPercentages[phase.id] ?? 0;

                // Calculate dynamic duration for Documents summary based on individual document due dates
                const documentsSummaryDuration = calculateDocumentsSummaryDuration(
                    phaseIndividualDocs,
                    phaseStartDate,
                    phaseEndDate,
                    3
                );

                // Format document container name with percentage
                const documentsContainerName = documentCount > 0
                    ? `Documents (${documentCount}) ${completionPercentage}%`
                    : `Documents (${documentCount})`;

                const gaCount = gapAnalysisCounts[phase.id] || 0;
                const gaPct = gapAnalysisPercentages[phase.id] ?? 0;
                const gaName = gaCount > 0 ? `Gap Analysis (${gaCount}) ${gaPct}%` : 'Gap Analysis';

                const subTasks = [
                    { type: 'document' as const, name: documentsContainerName, duration: documentsSummaryDuration.maxDuration, hasNested: true, childCount: documentCount },
                    { type: 'gap-analysis' as const, name: gaName, duration: 5, hasNested: false, childCount: gaCount },
                    { type: 'activities' as const, name: 'Activities', duration: 4, hasNested: false, childCount: 0 },
                    { type: 'audit' as const, name: 'Audit', duration: 4, hasNested: false, childCount: 0 },
                    { type: 'clinical-trials' as const, name: 'Clinical Trials', duration: 5, hasNested: false, childCount: 0 }
                ];

                // Filter out sub-tasks with 0 children
                const subTasksWithChildren = subTasks.filter(subTask => subTask.childCount > 0);

                // ALL sub-tasks now use the same dates as the main phase
                subTasksWithChildren.forEach((subTask) => {
                    if (subTask.type === 'document' && subTask.hasNested) {
                        // Create document container task with phase dates
                        const documentContainerTask: GanttTask = {
                            id: `documents-${phase.id}`,
                            text: subTask.name,
                            start: new Date(displayStartDate),
                            end: new Date(displayEndDate),
                            type: 'summary',
                            parent: `phase-${phase.id}`,
                            open: taskExpansionState[`documents-${phase.id}`] === true,
                            phaseId: phase.id,
                            subTaskType: subTask.type,
                            isDocumentContainer: true,
                            progress: taskProgressData[`documents-${phase.id}`]?.progress || 0,
                            progressStatus: taskProgressData[`documents-${phase.id}`]?.status as any || 'not-started'
                        };

                        tasks.push(documentContainerTask);

                        // Add individual document tasks as nested sub-items
                        phaseIndividualDocs.forEach((doc, docIndex) => {
                            // Use optimistic update if available, otherwise use calculated dates
                            const optimisticUpdate = optimisticDocumentUpdates[doc.id];
                            let docStartDate: Date;
                            let docEndDate: Date;
                            
                            if (optimisticUpdate?.start) {
                                docStartDate = optimisticUpdate.start;
                            } else {
                                docStartDate = calculateDocumentStartDate(
                                    doc.start_date,
                                    new Date(displayStartDate),
                                    phaseStartDate,
                                    phaseEndDate
                                );
                            }
                            
                            if (optimisticUpdate?.end) {
                                docEndDate = optimisticUpdate.end;
                            } else {
                                docEndDate = calculateDocumentEndDate(
                                    doc.due_date,
                                    docStartDate,
                                    phaseEndDate,
                                    3
                                );
                            }

                            const docAssignee = getRandomAssignee();
                            const docTask: GanttTask = {
                                id: `doc-${doc.id}`,
                                text: doc.name,
                                start: docStartDate,
                                end: docEndDate,
                                type: 'task',
                                parent: `documents-${phase.id}`,
                                open: taskExpansionState[`doc-${doc.id}`] === true,
                                phaseId: phase.id,
                                subTaskType: 'document',
                                documentId: doc.id,
                                dueDate: doc.due_date,
                                assigned: docAssignee?.name,
                                progress: taskProgressData[`doc-${doc.id}`]?.progress || 0,
                                progressStatus: taskProgressData[`doc-${doc.id}`]?.status as any || 'not-started'
                            };
                            tasks.push(docTask);
                        });

                    } else {
                        // Create sub-task with phase dates (Gap Analysis, Activities, Audit, Clinical Trials)
                        const subTaskItem: GanttTask = {
                            id: taskIdCounter++,
                            text: subTask.name,
                            start: new Date(displayStartDate),
                            end: new Date(displayEndDate),
                            type: 'summary',
                            parent: `phase-${phase.id}`,
                            open: taskExpansionState[`subtask-${taskIdCounter}`] === true,
                            phaseId: phase.id,
                            subTaskType: subTask.type,
                            progress: taskProgressData[`subtask-${phase.id}-${subTask.type}`]?.progress || 0,
                            progressStatus: taskProgressData[`subtask-${phase.id}-${subTask.type}`]?.status as any || 'not-started'
                        };

                        tasks.push(subTaskItem);
                    }
                });
            });
        });

        return tasks;
    }, [phases, documentCounts, individualDocuments, documentUpdating, taskExpansionState, optimisticDocumentUpdates, taskProgressData, categoryMap, productId, documentCompletionPercentages]);

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
        if ((!productDependencies || productDependencies.length === 0) &&
            (!companyDependencies || companyDependencies.length === 0)) {

            // Fallback: Sequential finish-to-start (for products without defined dependencies)
            for (let i = 0; i < phases.length - 1; i++) {
                const currentPhase = phases[i];
                const nextPhase = phases[i + 1];

                links.push({
                    id: `link-${currentPhase.id}-${nextPhase.id}`,
                    source: `phase-${currentPhase.id}`,
                    target: `phase-${nextPhase.id}`,
                    type: 'e2s'
                });
            }
        }

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
                    .from('phase_dependencies')
                    .select('*')
                    .eq('company_id', product.company_id);

                if (companyError) {
                    console.error('[ProductGanttV3Page] Error fetching company dependencies:', companyError);
                }

                // 2. Fetch product-specific dependency overrides
                const { data: productDeps, error: productError } = await supabase
                    .from('product_phase_dependencies')
                    .select('*')
                    .eq('product_id', productId);

                if (productError) {
                    console.error('[ProductGanttV3Page] Error fetching product dependencies:', productError);
                }

                setCompanyDependencies(companyDeps || []);
                setProductDependencies(productDeps || []);
            } catch (error) {
                console.error('[ProductGanttV3Page] Unexpected error fetching dependencies:', error);
                dependenciesFetchedRef.current = null;
                setCompanyDependencies([]);
                setProductDependencies([]);
            }
        };

        fetchAllDependencies();
    }, [product?.company_id, productId]);

    // Fetch phase categories
    useEffect(() => {
        const fetchCategories = async () => {
            if (!product?.company_id || !phases || phases.length === 0) {
                setCategoryMap({});
                return;
            }

            try {
                // Get unique category IDs from phases
                const categoryIds = phases
                    .map(p => (p as any).category_id)
                    .filter(Boolean);
                
                if (categoryIds.length === 0) {
                    setCategoryMap({});
                    return;
                }

                // Fetch category names
                const { data: categories, error: categoryError } = await supabase
                    .from('phase_categories')
                    .select('id, name')
                    .in('id', categoryIds)
                    .eq('company_id', product.company_id);

                if (categoryError) {
                    console.error('[ProductGanttV3Page] Error fetching categories:', categoryError);
                    setCategoryMap({});
                    return;
                }

                // Create map of category_id -> category_name
                const map: Record<string, string> = {};
                categories?.forEach(cat => {
                    map[cat.id] = cat.name;
                });

                setCategoryMap(map);
            } catch (error) {
                console.error('[ProductGanttV3Page] Error fetching categories:', error);
                setCategoryMap({});
            }
        };

        fetchCategories();
    }, [product?.company_id, phases]);

    // Initialize phase durations when phases load
    useEffect(() => {
        if (phases && phases.length > 0) {
            phases.forEach(phase => {
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

    // Generate progress data for all tasks when phases load
    useEffect(() => {
        if (phases && phases.length > 0) {
            const progressData: Record<string, { progress: number; status: string }> = {};
            
            phases.forEach(phase => {
                // Set default progress for main phase
                progressData[`phase-${phase.id}`] = {
                    progress: 0,
                    status: 'not-started'
                };

                // Set default progress for document container
                progressData[`documents-${phase.id}`] = {
                    progress: 0,
                    status: 'not-started'
                };

                // Set default progress for individual documents
                const phaseIndividualDocs = individualDocuments[phase.phase_id] || [];
                phaseIndividualDocs.forEach((doc) => {
                    progressData[`doc-${doc.id}`] = {
                        progress: 0,
                        status: 'not-started'
                    };
                });

                // Set default progress for sub-tasks
                const subTaskTypes = ['gap-analysis', 'activities', 'audit', 'clinical-trials'];
                subTaskTypes.forEach((subTaskType) => {
                    progressData[`subtask-${phase.id}-${subTaskType}`] = {
                        progress: 0,
                        status: 'not-started'
                    };
                });
            });

            setTaskProgressData(progressData);
        }
    }, [phases, individualDocuments]);

    // Fetch Gap Analysis metrics per phase and wire counts/percentages and progress
    useEffect(() => {
        const fetchGapMetrics = async () => {
            if (!productId || !phases || phases.length === 0) return;

            try {
                const lifecyclePhaseIds = phases.map(p => p.id);
                const metricsData = await PhaseMetricsService.getMultiplePhaseMetrics(productId, lifecyclePhaseIds);

                const countsMap: Record<string, number> = {};
                const percentageMap: Record<string, number> = {};
                const updatedProgress: Record<string, { progress: number; status: string }> = {};

                phases.forEach(phase => {
                    const phaseId = phase.id;
                    const metrics = metricsData[phaseId];
                    const total = metrics?.gapAnalysis?.total ?? 0;
                    const pct = metrics?.gapAnalysis?.percentage ?? 0;
                    countsMap[phaseId] = total;
                    percentageMap[phaseId] = pct;

                    const key = `subtask-${phase.id}-gap-analysis`;
                    const status = pct >= 100 ? 'completed' : pct > 0 ? 'in-progress' : 'not-started';
                    updatedProgress[key] = { progress: pct, status };
                });

                setGapAnalysisCounts(countsMap);
                setGapAnalysisPercentages(percentageMap);

                // Merge progress into existing task progress map
                setTaskProgressData(prev => ({ ...prev, ...updatedProgress }));
            } catch (e) {
                // On failure, default to empty maps and leave progress as-is
                setGapAnalysisCounts({});
                setGapAnalysisPercentages({});
            }
        };

        fetchGapMetrics();
    }, [productId, phases]);

    // Document counts fetching
    useEffect(() => {
        const fetchDocumentData = async () => {
            if (!phases || phases.length === 0 || !product?.company_id) {
                return;
            }

            // Prevent duplicate fetches for the same company/phases combination
            const fetchKey = `${product.company_id}-${phases.length}-${phases.map(p => p.phase_id).join(',')}`;
            if (documentsLoadedRef.current === fetchKey) {
                return;
            }

            try {
                setDocumentsLoading(true);
                documentsLoadedRef.current = fetchKey;

                const phaseIds = phases.map(phase => phase.phase_id).filter(Boolean);

                if (phaseIds.length === 0) {
                    setDocumentsLoading(false);
                    return;
                }

                // Batch fetch individual documents for all phases
                const documentsMap = await GanttPhaseDocumentService.getBatchPhaseIndividualDocuments(
                    phaseIds,
                    product.company_id,
                    productId
                );

                // Calculate document counts from individual documents
                const counts: Record<string, number> = {};
                Object.entries(documentsMap).forEach(([phaseId, docs]) => {
                    counts[phaseId] = docs.length;
                });

                setIndividualDocuments(documentsMap);
                setDocumentCounts(counts);

                // Fetch document completion percentages using PhaseDocumentCountService
                try {
                    const documentCountsData = await PhaseDocumentCountService.getPhaseDocumentCounts(
                        productId!,
                        product.company_id
                    );
                    
                    // Create a map of lifecycle_phases.id -> completionPercentage
                    const percentagesMap: Record<string, number> = {};
                    documentCountsData.forEach(count => {
                        percentagesMap[count.phaseId] = count.completionPercentage;
                    });
                    
                    setDocumentCompletionPercentages(percentagesMap);
                } catch (error) {
                    console.error('[ProductGanttV3Page] Error fetching document completion percentages:', error);
                    // Set default percentages to 0 if fetch fails
                    const defaultPercentages: Record<string, number> = {};
                    phases?.forEach(phase => {
                        defaultPercentages[phase.id] = 0;
                    });
                    setDocumentCompletionPercentages(defaultPercentages);
                }
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
            
            Object.values(documentUpdateDebouncersRef.current).forEach(debouncer => {
                debouncer.cancel();
            });
            documentUpdateDebouncersRef.current = {};
            
            // Clear optimistic updates on unmount
            setOptimisticDocumentUpdates({});
        };
    }, [cancelAllUpdates]);

    // Only show loading on initial load, not during cascading updates
    if ((productLoading || phasesLoading || documentsLoading) && !isUpdating && phases.length === 0) {
        return (
            <div>
                <Card>
                    <CardContent className="!p-6">
                        <div className="flex items-center justify-center">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                            <span className="ml-2">
                                {documentsLoading ? 'Loading data...' : 'Loading Gantt Chart...'}
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
                            <h3 className="text-lg font-medium mb-2">Error Loading Data</h3>
                            <p className="text-muted-foreground">
                                {productError?.message || phasesError?.message || 'Failed to load product data'}
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
                        <h3 className="text-lg font-medium mb-2">No Phases Available</h3>
                        <p className="text-muted-foreground">Add phases to see the Gantt chart.</p>
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
                            Gantt Chart Timeline
                            {(isUpdating || documentsLoading || Object.values(documentUpdating).some(Boolean)) && (
                                <div className="text-xs flex items-center gap-2 text-foreground/45 ml-4">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {isUpdating && 'Updating phases...' || 
                                     documentsLoading && 'Loading data...' || 
                                     Object.values(documentUpdating).some(Boolean) && 'Updating documents...' ||
                                     'Loading...'}
                                </div>
                            )}
                        </CardTitle>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Zoom: {zoomLevels[currentZoomLevel]?.name}
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
                                    disabled={currentZoomLevel === zoomLevels.length - 1 || isUpdating}
                                    title="Zoom In"
                                >
                                    <ZoomIn className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div
                        className={`w-full h-[600px] border rounded-md overflow-hidden ${isUpdating || Object.values(documentUpdating).some(Boolean) ? 'wx-gantt-updating' : ''}`}
                        onClick={(e) => {
                            try {
                                const target = e.target as HTMLElement;
                                if (!target || !productId || isUpdating || documentsLoading || Object.values(documentUpdating).some(Boolean)) {
                                    return;
                                }
                                if (target.classList.contains('wx-toggle-icon') ||
                                    target.closest('.wx-toggle-icon')) {
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
                                                let navigationUrl = '';
                                                let pageName = '';
                                                const trimmedText = taskText.trim();
                                                
                                                const getMainTaskName = (subTaskText: string): string | null => {
                                                    const clickedTask = ganttTasks.find(task => task.text === subTaskText);
                                                    if (!clickedTask) return null;
                                                    
                                                    if (clickedTask.parent) {
                                                        const parentTask = ganttTasks.find(task => task.id === clickedTask.parent);
                                                        return parentTask ? parentTask.text : null;
                                                    }
                                                    return clickedTask.text;
                                                };
                                                
                                                const mainTaskName = getMainTaskName(trimmedText);
                                                
                                                if (trimmedText.match(/^Documents\s*\(\d+\)$/)) {
                                                    navigationUrl = `/app/product/${productId}/documents`;
                                                    pageName = 'Documents';
                                                } else if (trimmedText === 'Gap Analysis') {
                                                    navigationUrl = `/app/product/${productId}/gap-analysis`;
                                                    pageName = 'Gap Analysis';
                                                } else if (trimmedText === 'Activities') {
                                                    navigationUrl = `/app/product/${productId}/activities`;
                                                    pageName = 'Activities';
                                                } else if (trimmedText === 'Audit') {
                                                    navigationUrl = `/app/product/${productId}/audit`;
                                                    pageName = 'Audit';
                                                } else if (trimmedText === 'Clinical Trials') {
                                                    navigationUrl = `/app/product/${productId}/clinical-trials`;
                                                    pageName = 'Clinical Trials';
                                                }
                                                
                                                if (navigationUrl && pageName) {
                                                    if (mainTaskName) {
                                                        const encodedMainTaskName = encodeURIComponent(mainTaskName);
                                                        navigationUrl += `?filter=${encodedMainTaskName}`;
                                                    }
                                                    
                                                    if (window.location.pathname === navigationUrl.split('?')[0]) {
                                                        return;
                                                    }
                                                    navigate(navigationUrl);
                                                    toast.success(`Redirecting to ${pageName} page...`);
                                                } else {
                                                    console.log(`[ProductGanttV3Page] No navigation defined for task: "${trimmedText}"`);
                                                }
                                            } catch (navError) {
                                                toast.error('Navigation failed. Please try again.');
                                            }
                                        }, 150);
                                    };
                                })();

                                if (target.classList.contains('wx-content') && target.classList.contains('x2-1qryx5p')) {
                                    const taskText = target.textContent || '';
                                    if (taskText.trim()) {
                                        handleTaskNavigation(taskText, 'direct-click');
                                    }
                                    return;
                                }

                                const contentParent = target.closest('.wx-content.x2-1qryx5p');
                                if (contentParent && contentParent instanceof HTMLElement) {
                                    const taskText = contentParent.textContent || '';
                                    if (taskText.trim()) {
                                        handleTaskNavigation(taskText, 'parent-click');
                                    }
                                    return;
                                }

                            } catch (error) {
                                console.error('[ProductGanttV3Page] Click handler error:', error);
                            }
                        }}
                    >
                        <Willow>
                            <Gantt
                                api={(api: any) => handleGanttReady(api)}
                                zoom={zoomConfig}
                                tasks={ganttTasks}
                                links={ganttLinks}
                                columns={columns}
                                taskTypes={taskTypes}
                                onTaskClick={(task: any) => handleSubTaskClick(task)}
                                movement={{
                                    allowMove: true,
                                    allowResize: true,
                                    allowDrag: true
                                }}
                                dragMove={true}
                                dragResize={true}
                                dragLinks={true}
                            />
                        </Willow>
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
                    companyId={product?.company_id || ''}
                />
            )}
        </div>
    );
}