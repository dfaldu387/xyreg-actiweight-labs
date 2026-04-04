import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Gantt, Willow, Tooltip, Editor, registerEditorItem } from "@/components/gantt-chart/src";
import "@svar-ui/react-gantt/all.css";
import "./GanttChartCustom.css";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { EditDocumentDialog } from "@/components/product/documents/EditDocumentDialog";
import { GanttTask, GanttLink } from "@/types/ganttChart";
import { CircularProgress } from "@/components/common/CircularProgress";
import { zoomLevels, getColumns, taskTypes, DEFAULT_ZOOM_LEVEL } from "./config/ganttChartConfig";
import { GanttChartHeader } from "./GanttChartHeader";
import { GanttChartZoomControls } from "./GanttChartZoomControls";
import { ProductType } from "@/utils/productTypeDetection";
import { useTranslation } from "@/hooks/useTranslation";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";
import { EnhancedRecalculationService } from "@/services/enhancedRecalculationService";
import { ProductPhaseDependencyService } from "@/services/productPhaseDependencyService";
import GanttLinkService from "@/services/ganttLinkService";
import { detectCircularDependency, getTaskName, getLinkTypeText } from "@/utils/ganttLinkUtils";
import { getLinkEntityType, getLinkRestrictionMessage, isLinkRestricted } from "./utils/linkRestrictions";
import { supabase } from "@/integrations/supabase/client";
import { calculateTaskTypeFromDates } from "@/utils/ganttUtils";
import MyTooltipContent from "./MyTooltipContent";
import { GanttLoadingOverlay } from "./GanttLoadingOverlay";
import UsersCustomCombo from "./UsersCustomCombo";
import { updateParentPhaseDatesIfNeeded } from "@/utils/ganttParentUpdateHelper";
import { createDocumentDependencyRecalculator, createTaskDependencyRecalculator, createGapAnalysisDependencyRecalculator } from "./documentDependencyRecalculator";
// import CustomTaskContent from "./CustomTaskContent";

let isAssignedEditorRegistered = false;
const ensureAssignedEditorRegistered = () => {
    if (!isAssignedEditorRegistered) {
        registerEditorItem('assigned-combo', UsersCustomCombo);
        isAssignedEditorRegistered = true;
    }
};

ensureAssignedEditorRegistered();

export interface GanttChartV23Props {
    productId: string;
    tasks?: GanttTask[];
    links?: GanttLink[];
    currentZoomLevel?: number;
    dateRange?: { start: Date; end: Date };
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onResetZoom?: () => void;
    title?: string;
    emptyState?: React.ReactNode;
    productType?: ProductType | null;
    categoryMap?: Record<string, string>;
    readonly?: boolean;
}

export function GanttChartV23({
    productId,
    tasks: propsTasks,
    links: propsLinks,
    currentZoomLevel,
    dateRange: propsDateRange,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    title = "Timeline",
    emptyState,
    productType = null,
    categoryMap = {},
    readonly = false,
}: GanttChartV23Props) {
    const { lang } = useTranslation();
    const navigate = useNavigate();
    const [api, setApi] = useState<any>();
    const [apiReady, setApiReady] = useState(false);
    const apiRef = useRef<any>(null);
    const tasksRef = useRef<GanttTask[]>([]);
    const linksRef = useRef<GanttLink[]>([]);
    const phaseCompanyMapRef = useRef<Map<string, string>>(new Map());
    const completedPhasesRef = useRef<number>(0);
    const [internalZoomLevel, setInternalZoomLevel] = useState(DEFAULT_ZOOM_LEVEL);
    const [isSyncingSubTasks, setIsSyncingSubTasks] = useState(false);
    const [showDocumentEditor, setShowDocumentEditor] = useState(false);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [selectedDocumentTaskId, setSelectedDocumentTaskId] = useState<string | null>(null);
    const [selectedDocument, setSelectedDocument] = useState<any>(null);
    const [selectedDocumentType, setSelectedDocumentType] = useState<'product-specific' | 'template-instance'>('template-instance');

    const stripPhasePrefix = useCallback((value: string) => {
        if (!value) {
            return value;
        }
        if (value.startsWith('phase-')) {
            return value.slice('phase-'.length);
        }
        if (value.startsWith('phase_')) {
            return value.slice('phase_'.length);
        }
        return value;
    }, []);

    const resolveCompanyPhaseId = useCallback(
        (identifier: string | number | null | undefined): string | null => {
            if (identifier === null || identifier === undefined) {
                return null;
            }
            const idString = typeof identifier === 'number' ? String(identifier) : identifier;
            if (!idString) {
                return null;
            }

            const phaseMap = phaseCompanyMapRef.current;
            const directMatch = phaseMap.get(idString);
            if (directMatch) {
                return directMatch;
            }

            const normalized = stripPhasePrefix(idString);
            const normalizedMatch = phaseMap.get(normalized);
            if (normalizedMatch) {
                return normalizedMatch;
            }

            return normalized || null;
        },
        [stripPhasePrefix]
    );

    const clampZoomLevel = useCallback(
        (level: number) => Math.min(Math.max(level, 0), zoomLevels.length - 1),
        []
    );

    const isZoomControlled = typeof currentZoomLevel === 'number';
    const effectiveZoomLevel = isZoomControlled
        ? clampZoomLevel(currentZoomLevel as number)
        : internalZoomLevel;

    const handleZoomInInternal = useCallback(() => {
        console.log('[zoom-in-out-issue] Zoom IN clicked, current level:', effectiveZoomLevel, 'max:', zoomLevels.length - 1, 'name:', zoomLevels[effectiveZoomLevel]?.name);
        if (effectiveZoomLevel >= zoomLevels.length - 1) {
            console.log('[zoom-in-out-issue] Already at max zoom, skipping');
            return;
        }
        if (!isZoomControlled) {
            setInternalZoomLevel(prev => {
                const next = clampZoomLevel(prev + 1);
                console.log('[zoom-in-out-issue] Zoom IN: level', prev, '->', next, 'name:', zoomLevels[next]?.name);
                return next;
            });
        }

        onZoomIn?.();
    }, [clampZoomLevel, effectiveZoomLevel, isZoomControlled, onZoomIn]);

    const handleZoomOutInternal = useCallback(() => {
        console.log('[zoom-in-out-issue] Zoom OUT clicked, current level:', effectiveZoomLevel, 'min: 0', 'name:', zoomLevels[effectiveZoomLevel]?.name);
        if (effectiveZoomLevel <= 0) {
            console.log('[zoom-in-out-issue] Already at min zoom, skipping');
            return;
        }
        if (!isZoomControlled) {
            setInternalZoomLevel(prev => {
                const next = clampZoomLevel(prev - 1);
                console.log('[zoom-in-out-issue] Zoom OUT: level', prev, '->', next, 'name:', zoomLevels[next]?.name);
                return next;
            });
        }

        onZoomOut?.();
    }, [clampZoomLevel, effectiveZoomLevel, isZoomControlled, onZoomOut]);

    const handleResetZoomInternal = useCallback(() => {
        if (!isZoomControlled) {
            setInternalZoomLevel(DEFAULT_ZOOM_LEVEL);
        }

        onResetZoom?.();
    }, [isZoomControlled, onResetZoom]);

    const resolvedZoomMeta = zoomLevels[effectiveZoomLevel] ?? zoomLevels[DEFAULT_ZOOM_LEVEL];

    // Debug: log zoom state on every render
    console.log('[zoom-in-out-issue] Render state:', {
      effectiveZoomLevel,
      isZoomControlled,
      zoomName: resolvedZoomMeta?.name,
      scales: resolvedZoomMeta?.scales,
      minCellWidth: resolvedZoomMeta?.minCellWidth,
      maxCellWidth: resolvedZoomMeta?.maxCellWidth,
      totalZoomLevels: zoomLevels.length,
      DEFAULT_ZOOM_LEVEL,
    });

    // API-fetched state
    const [tasks, setTasks] = useState<GanttTask[]>(() => {
        if (propsTasks && propsTasks.length > 0) {
            const customTypes = ['category', 'subsection', 'not-started', 'running', 'overdue', 'on-time'];
            return propsTasks.map(task => ({
                ...task,
                start: task.start instanceof Date ? task.start : new Date(task.start),
                end: task.end instanceof Date ? task.end : (task.end ? new Date(task.end) : task.end),
                type: customTypes.includes(task.type)
                    ? task.type
                    : (task.phaseId || (task as any).phase_id) ? 'summary' : task.type,
            }));
        }
        return [];
    });
    const [links, setLinks] = useState<GanttLink[]>(propsLinks || []);
    const [isLoading, setIsLoading] = useState(() => !propsTasks || propsTasks.length === 0);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingStage, setLoadingStage] = useState('');
    const [error, setError] = useState<Error | null>(null);
    const [isRecalculating, setIsRecalculating] = useState(false);

    // Sync tasks and links from props when they change
    useEffect(() => {
        if (propsTasks && propsTasks.length > 0) {
            const customTypes = ['category', 'subsection', 'not-started', 'running', 'overdue', 'on-time'];
            const parsedTasks = propsTasks.map(task => ({
                ...task,
                start: task.start instanceof Date ? task.start : new Date(task.start),
                end: task.end instanceof Date ? task.end : (task.end ? new Date(task.end) : task.end),
                // Keep custom types (category, status-based), otherwise use summary for phase tasks or original type
                type: customTypes.includes(task.type)
                    ? task.type
                    : (task.phaseId || (task as any).phase_id) ? 'summary' : task.type,
            }));
            setTasks(parsedTasks);
        } else if (propsTasks !== undefined && propsTasks.length === 0) {
            // Explicitly empty array
            setTasks([]);
        }
    }, [propsTasks]);

    useEffect(() => {
        if (propsLinks !== undefined) {
            setLinks(propsLinks);
        }
    }, [propsLinks]);

    // Expansion state management (without localStorage)
    const [taskExpansionState, setTaskExpansionState] = useState<Record<string, boolean>>({});
    const tasksHashRef = useRef<string>('');
    const abortControllerRef = useRef<AbortController | null>(null);

    // Helper function to parse dates from API responses
    const ensureArray = useCallback(<T,>(value: T[] | { data?: T[] } | null | undefined, label: string): T[] => {
        if (Array.isArray(value)) {
            return value;
        }
        if (value && Array.isArray((value as any).data)) {
            console.warn(`[GanttChart] ${label} payload wrapped in 'data', flattening.`);
            return (value as any).data;
        }
        if (value !== undefined && value !== null) {
            console.warn(`[GanttChart] ${label} payload was not an array. Coercing to empty array.`);
        }
        return [];
    }, []);

    const parseDates = useCallback((data: any): any[] => {
        if (!Array.isArray(data)) {
            if (data !== undefined && data !== null) {
                console.warn('[GanttChart] parseDates received non-array payload. Ignoring.');
            }
            return [];
        }
        return data.map((item) => {
            const parsed = { ...item };
            if (item.start) {
                parsed.start = new Date(item.start);
            }
            if (item.end !== null && item.end !== undefined) {
                parsed.end = new Date(item.end);
            }
            return parsed;
        });
    }, []);

    // Fetch company ID for reviewer groups
    useEffect(() => {
        if (!productId) {
            setCompanyId(null);
            return;
        }

        let isMounted = true;

        const loadCompanyId = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('company_id')
                    .eq('id', productId)
                    .single();

                if (!error && data && isMounted) {
                    setCompanyId(data.company_id || null);
                }
            } catch (err) {
                console.error('[GanttChart] Failed to fetch company ID for reviewer groups:', err);
            }
        };

        loadCompanyId();

        return () => {
            isMounted = false;
        };
    }, [productId]);

    // Auto-recalculation function after link is added
    const autoRecalculateTimeline = useCallback(async (productId: string, ganttApi: any) => {
        try {
            const { data: productData, error: productError } = await supabase
                .from('products')
                .select('project_start_date, projected_launch_date, company_id')
                .eq('id', productId)
                .single();

            if (productError || !productData) {
                console.warn('[GanttChart] Could not fetch product data for recalculation:', productError);
                return; // Skip recalculation if product data unavailable
            }

            const dependenciesResult = await ProductPhaseDependencyService.getProductDependencies(productId);

            if (!dependenciesResult.success || !dependenciesResult.dependencies || dependenciesResult.dependencies.length === 0) {
                return;
            }

            const activeDependencies = dependenciesResult.dependencies.map(dep => ({
                id: dep.id,
                source_phase_id: dep.source_phase_id,
                target_phase_id: dep.target_phase_id,
                dependency_type: dep.dependency_type,
                lag_days: dep.lag_days,
                company_id: productData.company_id || '',
                created_at: dep.created_at,
                updated_at: dep.updated_at
            }));

            const timelineMode: 'forward' | 'backward' = productData.project_start_date ? 'forward' : 'backward';

            const recalculationOptions = {
                mode: 'preserve-manual' as const,
                timelineMode: timelineMode,
                projectStartDate: productData.project_start_date ? new Date(productData.project_start_date) : undefined,
                projectedLaunchDate: productData.projected_launch_date ? new Date(productData.projected_launch_date) : undefined,
                enforceConstraints: false
            };

            // Execute enhanced recalculation
            const result = await EnhancedRecalculationService.recalculateTimeline(
                productId,
                productData.company_id || '',
                recalculationOptions,
                activeDependencies
            );

            if (result.success && result.updatedPhases.length > 0) {
                setTasks(prevTasks => {
                    return prevTasks.map(task => {
                        let taskPhaseId: string | undefined;

                        if (task.phaseId) {
                            taskPhaseId = String(task.phaseId);
                        } else if (typeof task.id === 'string' && task.id.startsWith('phase-')) {
                            taskPhaseId = task.id.replace('phase-', '');
                        } else {
                            taskPhaseId = String(task.id);
                        }

                        if (taskPhaseId) {
                            const updatedPhase = result.updatedPhases.find(p => p.id === taskPhaseId);

                            if (updatedPhase && updatedPhase.startDate && updatedPhase.endDate) {
                                const newType = calculateTaskTypeFromDates(
                                    updatedPhase.startDate,
                                    updatedPhase.endDate,
                                    task.type
                                );

                                // Update task dates and type while preserving other properties
                                return {
                                    ...task,
                                    start: updatedPhase.startDate,
                                    end: updatedPhase.endDate,
                                    type: newType
                                };
                            }
                        }

                        return task;
                    });
                });

                // Use gantt API to update task bars smoothly if available
                if (ganttApi && apiReady) {
                    const updatedPhaseIds: (string | number)[] = [];

                    result.updatedPhases.forEach(phase => {
                        if (phase.startDate && phase.endDate) {
                            try {
                                let taskId: string = phase.id;
                                let task = ganttApi.getTask(taskId);

                                // If not found with plain UUID, try with phase- prefix
                                if (!task) {
                                    taskId = `phase-${phase.id}`;
                                    task = ganttApi.getTask(taskId);
                                }

                                if (task) {
                                    // Recalculate task type based on new dates
                                    const newType = calculateTaskTypeFromDates(
                                        phase.startDate,
                                        phase.endDate,
                                        task.type || 'summary'
                                    );

                                    ganttApi.exec('update-task', {
                                        id: taskId,
                                        task: {
                                            ...task,
                                            start: phase.startDate,
                                            end: phase.endDate,
                                            type: newType
                                        }
                                    });

                                    updatedPhaseIds.push(taskId);
                                }
                            } catch (err) {
                                console.debug('[GanttChart] Could not update task via API:', err);
                            }
                        }
                    });
                    
                    // Update categories after all phases are updated
                    if (updatedPhaseIds.length > 0) {
                        updatedPhaseIds.forEach(phaseId => {
                            const freshTask = ganttApi.getTask(phaseId);
                            if (freshTask) {
                                // Try to find task with exact ID or stripped ID (handle phase- prefix)
                                const strippedId = String(phaseId).replace(/^phase-/, '');
                                const taskInRef = tasksRef.current.find((t: any) =>
                                    String(t.id) === String(phaseId) || String(t.id) === strippedId
                                );
                                if (taskInRef) {
                                    taskInRef.start = freshTask.start ? new Date(freshTask.start) : taskInRef.start;
                                    taskInRef.end = freshTask.end ? new Date(freshTask.end) : taskInRef.end;
                                }
                            }
                        });

                        // Also update React state for UI consistency
                        setTasks(prevTasks => {
                            const updated = [...prevTasks];
                            updatedPhaseIds.forEach(phaseId => {
                                const task = ganttApi.getTask(phaseId);
                                if (task) {
                                    const strippedId = String(phaseId).replace(/^phase-/, '');
                                    const taskInRef = updated.find(t =>
                                        String(t.id) === String(phaseId) || String(t.id) === strippedId
                                    );
                                    if (taskInRef) {
                                        taskInRef.start = task.start ? new Date(task.start) : taskInRef.start;
                                        taskInRef.end = task.end ? new Date(task.end) : taskInRef.end;
                                    }
                                }
                            });
                            return updated;
                        });

                        // Trigger category updates for each updated phase
                        const noOpRecalculate = async () => {};
                        for (const phaseId of updatedPhaseIds) {
                            try {
                                await updateParentPhaseDatesIfNeeded(phaseId, ganttApi, noOpRecalculate, tasksRef.current);
                            } catch (error) {
                                console.error('[GanttChart] Error updating category after phase update:', error);
                            }
                        }
                    }
                }

                // Dismiss loading toast and show success
                toast.dismiss('recalculating-timeline');
                toast.success(`Timeline recalculated: ${result.updatedPhases.length} phases updated`);

                if (result.warnings.length > 0) {
                    console.warn('[GanttChart] Recalculation warnings:', result.warnings);
                }
            } else {
                if (result.errors.length > 0) {
                    console.error('[GanttChart] Recalculation errors:', result.errors);
                }
            }
        } catch (error) {
            console.error('[GanttChart] Error during auto-recalculation:', error);
        }
    }, [apiReady]);

    // Fetch initial tasks and links from API - OPTIMIZED VERSION
    useEffect(() => {
        if (propsTasks) {
            return;
        }

        if (!productId) {
            setIsLoading(false);
            return;
        }

        // Cancel any pending request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new AbortController for this request
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        const fetchData = async () => {
            try {
                setIsLoading(true);
                setLoadingProgress(0);
                setLoadingStage('Preparing...');
                setError(null);

                // Stage 1: Fetching data from server
                setLoadingProgress(10);
                setLoadingStage('Getting tasks and links...');

                const [tasksResponse, linksResponse] = await Promise.all([
                    apiClient.get(`/product/gantt-chart/${productId}/tasks?includeChildren=true`, {
                        signal: abortController.signal,
                    }),
                    apiClient.get(`/product/gantt-chart/${productId}/links`, {
                        signal: abortController.signal,
                    }),
                ]);

                // Check if request was aborted
                if (abortController.signal.aborted) {
                    return;
                }

                // Stage 2: Parsing and normalizing data
                setLoadingProgress(50);
                setLoadingStage('Parsing dates...');

                const normalizedTasks = ensureArray<GanttTask>(tasksResponse.data, 'tasks');
                const parsedTasks = parseDates(normalizedTasks);
                const parsedLinks = ensureArray<GanttLink>(linksResponse.data, 'links');

                // Stage 3: Processing task types
                setLoadingProgress(70);
                setLoadingStage('Processing task types...');

                const customTypes = ['category', 'subsection', 'not-started', 'running', 'overdue', 'on-time'];
                parsedTasks.forEach((task: any) => {
                    if (task.phase_id && typeof task.phase_id === 'string' && !customTypes.includes(task.type)) {
                        if (!customTypes.includes(task.type) && task.type !== 'summary') {
                            task.type = 'summary';
                        }
                    }
                });

                // Stage 4: Setting data
                setLoadingProgress(90);
                setLoadingStage('Rendering chart...');
                setTasks(parsedTasks);
                setLinks(parsedLinks);

                setLoadingProgress(100);
                setLoadingStage('Done');
            } catch (err: any) {
                // Ignore abort errors
                if (err.name === 'CanceledError' || err.name === 'AbortError' || abortController.signal.aborted) {
                    return;
                }
                console.error("[GanttChart] Error fetching Gantt chart data:", err);
                setError(err);
                setTasks([]);
                setLinks([]);
            } finally {
                if (!abortController.signal.aborted) {
                    setLoadingProgress(100);
                    setLoadingStage('Done');
                    // Small delay to show 100% before hiding
                    setTimeout(() => {
                        setIsLoading(false);
                        setLoadingProgress(0);
                        setLoadingStage('');
                    }, 300);
                }
            }
        };

        fetchData();

        // Cleanup function to abort request if component unmounts or dependencies change
        return () => {
            abortController.abort();
            abortControllerRef.current = null;
        };
    }, [productId, propsTasks]);

    // Build category map from tasks if not provided
    const effectiveCategoryMap = useMemo(() => {
        if (Object.keys(categoryMap).length > 0) {
            return categoryMap;
        }

        const taskCollection = Array.isArray(tasks) ? tasks : [];

        // Build category map from tasks
        const map: Record<string, string> = {};
        taskCollection.forEach((task) => {
            if (task.id.toString().startsWith('category-')) {
                const categoryId = task.id.toString().replace('category-', '');
                map[categoryId] = task.text;
            }
        });
        return map;
    }, [categoryMap, tasks]);

    // Calculate date range from tasks if not provided
    // Today marker for the Gantt chart
    const ganttMarkers = useMemo(() => [
        {
            start: new Date(),
            text: "Today",
            css: "wx-today-marker",
        },
    ], []);

    const dateRange = useMemo(() => {
        if (propsDateRange) {
            return propsDateRange;
        }

        const taskCollection = Array.isArray(tasks) ? tasks : [];

        if (taskCollection.length === 0) {
            const now = new Date();
            return {
                start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
                end: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
            };
        }

        // Filter tasks with valid dates
        const tasksWithDates = taskCollection.filter(t => t.start && t.end);
        if (tasksWithDates.length === 0) {
            const now = new Date();
            return {
                start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
                end: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
            };
        }

        let minDate = new Date(tasksWithDates[0].start);
        let maxDate = new Date(tasksWithDates[0].end);

        tasksWithDates.forEach((task) => {
            if (task.start && task.start < minDate) {
                minDate = new Date(task.start);
            }
            if (task.end && task.end > maxDate) {
                maxDate = new Date(task.end);
            }
        });

        // Add some padding
        const padding = 7 * 24 * 60 * 60 * 1000; // 7 days
        return {
            start: new Date(minDate.getTime() - padding),
            end: new Date(maxDate.getTime() + padding),
        };
    }, [tasks, propsDateRange]);

    // Helper function to find category ID by name with fuzzy matching
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

        for (const [categoryId, name] of Object.entries(effectiveCategoryMap)) {
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
    }, [effectiveCategoryMap]);

    // Get default expansion state based on product type and category map
    const getDefaultExpansionState = useCallback((): Record<string, boolean> => {
        const defaults: Record<string, boolean> = {};

        if (!productType || Object.keys(effectiveCategoryMap).length === 0) {
            return defaults;
        }

        const designControlId = findCategoryIdByName('Design Control Steps');
        const supplyChainId = findCategoryIdByName('Supply Chain & Quality Assurance');
        const pmsId = findCategoryIdByName('Post-Market & Lifecycle Management');

        if (productType === 'legacy_product') {
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
    }, [productType, effectiveCategoryMap, findCategoryIdByName]);

    // Apply default expansion state when productType and categoryMap are provided
    useEffect(() => {
        if (!productType || Object.keys(effectiveCategoryMap).length === 0) {
            return;
        }

        const defaultExpansionState = getDefaultExpansionState();

        setTaskExpansionState(prevState => {
            const mergedState = { ...prevState };

            Object.entries(defaultExpansionState).forEach(([taskId, isOpen]) => {
                // Only apply default if it's a category task and not already set by user
                if (taskId.startsWith('category-') && !(taskId in prevState)) {
                    mergedState[taskId] = isOpen;
                }
            });

            return mergedState;
        });
    }, [productType, effectiveCategoryMap, getDefaultExpansionState]);

    // Initialize expansion state from incoming tasks (only when tasks change)
    useEffect(() => {
        if (!Array.isArray(tasks) || tasks.length === 0) {
            setTaskExpansionState({});
            tasksHashRef.current = '';
            return;
        }

        // Create a hash of task IDs to detect if tasks actually changed
        const currentHash = tasks.map(t => `${t.id}:${t.open ?? false}`).join(',');
        if (currentHash === tasksHashRef.current) return;

        tasksHashRef.current = currentHash;

        const taskCollection = Array.isArray(tasks) ? tasks : [];

        setTaskExpansionState(prevState => {
            const newState = { ...prevState };

            taskCollection.forEach(task => {
                if (task.id !== undefined) {
                    const taskId = task.id.toString();
                    // Initialize from task.open if not already set by user interaction or default expansion state
                    if (!(taskId in prevState)) {
                        newState[taskId] = task.open ?? false;
                    }
                }
            });

            return newState;
        });
    }, [tasks]);

    // Handle task expansion toggle
    const handleTaskExpansion = useCallback((taskId: string, isExpanded: boolean) => {
        setTaskExpansionState(prev => ({
            ...prev,
            [taskId]: isExpanded
        }));
    }, []);

    const init = useCallback((ganttApi: any) => {
        setApi(ganttApi);
        apiRef.current = ganttApi;
        setApiReady(true);
    }, []);

    // Set up event listeners when API is ready
    useEffect(() => {
        if (!apiReady || !apiRef.current) return;

        const ganttApi = apiRef.current;

        const hasTaskPrefix = (id: string | number | undefined, prefix: string) => {
            if (typeof id !== 'string') {
                return false;
            }
            return id.startsWith(`${prefix}_`) || id.startsWith(`${prefix}-`);
        };

        const stripTaskPrefix = (id: string, prefix: string) => {
            if (id.startsWith(`${prefix}_`)) {
                return id.slice(prefix.length + 1);
            }
            if (id.startsWith(`${prefix}-`)) {
                return id.slice(prefix.length + 1);
            }
            return id;
        };

        const isDocumentTaskId = (id: string | number | undefined) => {
            if (typeof id !== 'string') {
                return false;
            }
            return id.startsWith('doc-') || id.startsWith('doc_');
        };

        const isActivityTaskId = (id: string | number | undefined) => hasTaskPrefix(id, 'activity');
        const isAuditTaskId = (id: string | number | undefined) => hasTaskPrefix(id, 'audit');
        const isGapAnalysisTaskId = (id: string | number | undefined) => hasTaskPrefix(id, 'gap');

        ganttApi.intercept('drag-task', ({ id, top }: any) => {
            try {
                const task = ganttApi.getTask(id);

                const isCategoryOrSubSection =
                    task?.type === 'category' ||
                    id.toString().startsWith('category-') ||
                    id.toString().startsWith('subsection-');

                if (isCategoryOrSubSection) {
                    if (typeof top === 'undefined') {
                        return false;
                    }
                }
                return true;
            } catch (err) {
                console.error('[GanttChart] Error checking task type for drag:', err);
                return true;
            }
        });

        const normalizeGapItemIdForUpdate = (id: string) => {
            if (!id) return id;
            return id.replace(/_[0-9]+$/, '');
        };

        // Debounce map to track pending updates for each document
        const updateDebounceTimers = new Map<string, NodeJS.Timeout>();

        const updateTaskCacheDates = (taskId: string, startDate?: Date, endDate?: Date) => {
            const taskInRef = tasksRef.current.find((t: any) => t.id === taskId);
            if (!taskInRef) return;

            taskInRef.start = startDate;
            taskInRef.end = endDate;

            if (startDate && endDate) {
                taskInRef.duration = Math.ceil(
                    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
                );
            }
        };

        const scheduleTaskDateUpdate = (
            timerKey: string,
            _loadingMessage: string,  // Commented out - no toast for date updates
            _successMessage: string,  // Commented out - no toast for date updates
            failureMessage: string,
            updateFn: () => Promise<{ success: boolean; error?: string }>,
            onSuccess?: () => Promise<void> | void
        ) => {
            if (updateDebounceTimers.has(timerKey)) {
                clearTimeout(updateDebounceTimers.get(timerKey)!);
            }

            const timerId = setTimeout(async () => {
                try {
                    const result = await updateFn();

                    if (result.success) {
                        // Success toast disabled - too many notifications
                        if (onSuccess) {
                            await onSuccess();
                        }
                    } else {
                        const { toast } = await import('sonner');
                        toast.error(`${failureMessage}: ${result.error}`);
                    }
                } catch (error) {
                    console.error(failureMessage, error);
                    const { toast } = await import('sonner');
                    toast.error(failureMessage);
                } finally {
                    updateDebounceTimers.delete(timerKey);
                }
            }, 1000);

            updateDebounceTimers.set(timerKey, timerId);
        };

        // Helper function to get phase ID from document task
        const getPhaseIdFromDocument = (task: any): string | number | null => {
            let currentParent = task.parent;
            let depth = 0;
            while (currentParent) {
                const parentTask = ganttApi.getTask(currentParent);
                if (!parentTask) break;

                if (parentTask.type && ['task', 'summary', 'milestone', 'running', 'overdue', 'on-time', 'not-started'].includes(parentTask.type) && !parentTask.subTaskType) {
                    return currentParent;
                }
                currentParent = parentTask.parent;
                depth++;
            }
            return null;
        };

        // Helper function to recalculate dependent phases based on links
        const recalculateDependentPhases = async (sourcePhaseId: string | number, ganttApi: any) => {
            const currentLinks = linksRef.current;
            
            if (!currentLinks || currentLinks.length === 0) {
                return;
            }

            // Normalize sourcePhaseId for comparison (could be string or number)
            const normalizedSourceId = sourcePhaseId.toString();

            // Find all links where this phase is the source
            const outgoingLinks = currentLinks.filter((link: any) => {
                const linkSource = link.source?.toString();
                const match = linkSource === normalizedSourceId;
                return match;
            });

            if (outgoingLinks.length === 0) {
                return;
            }

            const sourcePhase = ganttApi.getTask(sourcePhaseId);
            if (!sourcePhase) return;

            const sourceEnd = sourcePhase.end ? new Date(sourcePhase.end) : null;
            const sourceStart = sourcePhase.start ? new Date(sourcePhase.start) : null;

            if (!sourceEnd || !sourceStart) return;

            // Process each outgoing link
            for (const link of outgoingLinks) {
                const targetPhaseId = link.target;
                const linkType = link.type; // e2s, s2s, e2e, s2e

                const targetPhase = ganttApi.getTask(targetPhaseId);
                if (!targetPhase) continue;

                const targetStart = targetPhase.start ? new Date(targetPhase.start) : null;
                const targetEnd = targetPhase.end ? new Date(targetPhase.end) : null;

                if (!targetStart || !targetEnd) continue;

                const duration = Math.ceil((targetEnd.getTime() - targetStart.getTime()) / (24 * 60 * 60 * 1000));

                let newTargetStart = targetStart;
                let newTargetEnd = targetEnd;
                let needsUpdate = false;

                // Calculate new dates based on link type
                switch (linkType) {
                    case 'e2s': // End-to-Start (Finish-to-Start)
                        // FS: Target starts on source end date (no extra +1 day)
                        // Because end date is already calculated as start + duration (day after last working day)
                        if (targetStart.getTime() !== sourceEnd.getTime()) {
                            newTargetStart = new Date(sourceEnd);
                            newTargetEnd = new Date(newTargetStart.getTime() + duration * 24 * 60 * 60 * 1000);
                            needsUpdate = true;
                        }
                        break;

                    case 's2s': // Start-to-Start
                        // Target should start when source starts
                        if (targetStart.getTime() !== sourceStart.getTime()) {
                            newTargetStart = sourceStart;
                            newTargetEnd = new Date(newTargetStart.getTime() + duration * 24 * 60 * 60 * 1000);
                            needsUpdate = true;
                        }
                        break;

                    case 'e2e': // End-to-End
                        // Target should end when source ends
                        if (targetEnd.getTime() !== sourceEnd.getTime()) {
                            newTargetEnd = sourceEnd;
                            newTargetStart = new Date(newTargetEnd.getTime() - duration * 24 * 60 * 60 * 1000);
                            needsUpdate = true;
                        }
                        break;

                    case 's2e': // Start-to-End
                        // Target should end when source starts
                        if (targetEnd.getTime() !== sourceStart.getTime()) {
                            newTargetEnd = sourceStart;
                            newTargetStart = new Date(newTargetEnd.getTime() - duration * 24 * 60 * 60 * 1000);
                            needsUpdate = true;
                        }
                        break;
                }

                if (needsUpdate) {
                    // Set flag to indicate we're recalculating dependencies
                    isRecalculatingDependencies = true;

                    try {
                        // Update in Gantt
                        ganttApi.exec('update-task', {
                            id: targetPhaseId,
                            task: {
                                start: newTargetStart,
                                end: newTargetEnd
                            }
                        });

                        // Update in database
                        try {
                            const { GanttPhaseUpdateService } = await import('@/services/ganttPhaseUpdateService');

                            // IMPORTANT: Use targetPhaseId (lifecycle_phases.id), NOT phase_id (company phase UUID)
                            const databaseTargetPhaseId = String(targetPhaseId);
                            if (!databaseTargetPhaseId) {
                                console.error('❌ Cannot update dependent phase: database phase_id not found');
                            } else {
                                await GanttPhaseUpdateService.updatePhaseDates(
                                    databaseTargetPhaseId,
                                    newTargetStart,
                                    newTargetEnd
                                );
                            }
                        } catch (error) {
                            console.error('Error updating dependent phase in database:', error);
                        }

                        // Update tasksRef to keep state in sync
                        const targetTaskInRef = tasksRef.current.find((t: any) => t.id === targetPhaseId);
                        if (targetTaskInRef) {
                            targetTaskInRef.start = newTargetStart;
                            targetTaskInRef.end = newTargetEnd;
                            targetTaskInRef.duration = Math.ceil(
                                (newTargetEnd.getTime() - newTargetStart.getTime()) / (1000 * 60 * 60 * 24)
                            );
                        }

                        // Update parent category dates if target phase extends beyond category boundaries
                        try {
                            await updateParentPhaseDatesIfNeeded(targetPhaseId, ganttApi, recalculateDependentPhases, tasksRef.current);
                        } catch (error) {
                            console.error('[GanttChart] Error updating category after dependent phase update:', error);
                        }

                        // Recursively update phases that depend on this target (use Gantt task ID)
                        await recalculateDependentPhases(targetPhaseId, ganttApi);
                    } finally {
                        // Reset flag after recalculation is complete
                        isRecalculatingDependencies = false;
                    }
                }
            }
        };

        const {
            recalc: recalculateDocumentDependencies,
            isRunning: isDocumentDependencyRecalcRunning
        } = createDocumentDependencyRecalculator({
            linksRef,
            tasksRef,
            isDocumentTaskId,
            stripTaskPrefix,
            updateParentFn: updateParentPhaseDatesIfNeeded,
            recalcPhaseDependencies: recalculateDependentPhases
        });

        const {
            recalc: recalculateActivityDependencies,
            isRunning: isActivityDependencyRecalcRunning
        } = createTaskDependencyRecalculator({
            linksRef,
            tasksRef,
            updateParentFn: updateParentPhaseDatesIfNeeded,
            recalcPhaseDependencies: recalculateDependentPhases,
            isTargetTaskId: isActivityTaskId,
            extractEntityId: (taskId: string | number) => {
                if (typeof taskId !== 'string') {
                    return null;
                }
                return stripTaskPrefix(taskId, 'activity');
            },
            persistUpdates: async (activityId: string, newEnd: Date, newStart: Date) => {
                const { GanttActivityAuditService } = await import('@/services/ganttActivityAuditService');
                await GanttActivityAuditService.updateActivityDates(activityId, newEnd, newStart);
            }
        });

        const {
            recalc: recalculateAuditDependencies,
            isRunning: isAuditDependencyRecalcRunning
        } = createTaskDependencyRecalculator({
            linksRef,
            tasksRef,
            updateParentFn: updateParentPhaseDatesIfNeeded,
            recalcPhaseDependencies: recalculateDependentPhases,
            isTargetTaskId: isAuditTaskId,
            extractEntityId: (taskId: string | number) => {
                if (typeof taskId !== 'string') {
                    return null;
                }
                return stripTaskPrefix(taskId, 'audit');
            },
            persistUpdates: async (auditId: string, newEnd: Date, newStart: Date) => {
                const { GanttActivityAuditService } = await import('@/services/ganttActivityAuditService');
                await GanttActivityAuditService.updateAuditDates(auditId, newEnd, newStart, newEnd);
            }
        });

        const {
            recalc: recalculateGapAnalysisDependencies,
            isRunning: isGapAnalysisDependencyRecalcRunning
        } = createGapAnalysisDependencyRecalculator({
            linksRef,
            tasksRef,
            updateParentFn: updateParentPhaseDatesIfNeeded,
            recalcPhaseDependencies: recalculateDependentPhases,
            isGapAnalysisTaskId,
            stripTaskPrefix,
            resolveCompanyPhaseId
        });

        const isAnyDependencyRecalcRunning = () =>
            isDocumentDependencyRecalcRunning() ||
            isActivityDependencyRecalcRunning() ||
            isAuditDependencyRecalcRunning() ||
            isGapAnalysisDependencyRecalcRunning();

        const phaseStatesBeforeUpdate = new Map<string, { start: Date; end: Date }>();

        let isUpdatingChildTasks = false;
        let isRecalculatingDependencies = false;
        let isUpdatingParentCategory = false;

        ganttApi.intercept('update-task', (ev: any) => {
            if (!ev || !ev.id) return;

            const taskId = ev.id;
            const updatedTask = ev.task;

            try {
                const currentTask = ganttApi.getTask(taskId);

                const isPhaseTask = currentTask &&
                    (currentTask.type === 'summary' ||
                     currentTask.type === 'running' ||
                     currentTask.type === 'overdue' ||
                     currentTask.type === 'on-time' ||
                     currentTask.type === 'not-started') &&
                    !taskId.toString().startsWith('doc') &&
                    !taskId.toString().startsWith('activity') &&
                    !taskId.toString().startsWith('audit') &&
                    !taskId.toString().startsWith('gap') &&
                    !taskId.toString().startsWith('subsection-') &&
                    !taskId.toString().startsWith('design_review_');

                if (isPhaseTask && currentTask.start && currentTask.end) {
                    // Store old dates for comparison
                    phaseStatesBeforeUpdate.set(taskId.toString(), {
                        start: new Date(currentTask.start),
                        end: new Date(currentTask.end)
                    });
                }
            } catch (err) {
                console.error('[GanttChart] ❌ Error capturing phase state:', err);
            }
        });

        // Intercept update-task to save document dates to database with debounce
        ganttApi.on('update-task', async (ev: any) => {
            if (!ev || !ev.id) return;

            const taskId = ev.id;
            const updatedTask = ev.task;

            if (isUpdatingChildTasks) {
                return;
            }

            if (isRecalculatingDependencies) {
                return;
            }

            if (isUpdatingParentCategory) {
                return;
            }

            // When dependency recalculation is running, we need to:
            // 1. Clear any pending debounce timers for this task (to prevent stale data overwriting)
            // 2. Update the task cache with the new dates
            // 3. Return early (recalculator handles database updates)
            if (isAnyDependencyRecalcRunning()) {
                const taskIdStr = taskId.toString();
                // Clear pending debounce timers that might overwrite recalculator's changes
                if (taskIdStr.startsWith('doc')) {
                    const docId = stripTaskPrefix(taskIdStr, 'doc');
                    if (updateDebounceTimers.has(`doc-${docId}`)) {
                        clearTimeout(updateDebounceTimers.get(`doc-${docId}`)!);
                        updateDebounceTimers.delete(`doc-${docId}`);
                    }
                } else if (taskIdStr.startsWith('activity')) {
                    const activityId = stripTaskPrefix(taskIdStr, 'activity');
                    if (updateDebounceTimers.has(`activity-${activityId}`)) {
                        clearTimeout(updateDebounceTimers.get(`activity-${activityId}`)!);
                        updateDebounceTimers.delete(`activity-${activityId}`);
                    }
                } else if (taskIdStr.startsWith('audit')) {
                    const auditId = stripTaskPrefix(taskIdStr, 'audit');
                    if (updateDebounceTimers.has(`audit-${auditId}`)) {
                        clearTimeout(updateDebounceTimers.get(`audit-${auditId}`)!);
                        updateDebounceTimers.delete(`audit-${auditId}`);
                    }
                } else if (taskIdStr.startsWith('gap')) {
                    const gapId = stripTaskPrefix(taskIdStr, 'gap');
                    const normalizedGapId = gapId.replace(/_[0-9]+$/, '');
                    if (updateDebounceTimers.has(`gap-${normalizedGapId}`)) {
                        clearTimeout(updateDebounceTimers.get(`gap-${normalizedGapId}`)!);
                        updateDebounceTimers.delete(`gap-${normalizedGapId}`);
                    }
                    if (updateDebounceTimers.has(`gap-${gapId}`)) {
                        clearTimeout(updateDebounceTimers.get(`gap-${gapId}`)!);
                        updateDebounceTimers.delete(`gap-${gapId}`);
                    }
                }
                // Update task cache with recalculator's new dates
                if (updatedTask?.start && updatedTask?.end) {
                    updateTaskCacheDates(taskIdStr, updatedTask.start, updatedTask.end);
                }
                return;
            }

            const isPhaseTask =
                (updatedTask.type === 'summary' ||
                 updatedTask.type === 'running' ||
                 updatedTask.type === 'overdue' ||
                 updatedTask.type === 'on-time' ||
                 updatedTask.type === 'not-started') &&
                !taskId.toString().startsWith('doc') &&
                !taskId.toString().startsWith('activity') &&
                !taskId.toString().startsWith('audit') &&
                !taskId.toString().startsWith('gap') &&
                !taskId.toString().startsWith('subsection-') &&
                !taskId.toString().startsWith('design_review_');

            if (isPhaseTask && updatedTask.start && updatedTask.end) {

                const oldState = phaseStatesBeforeUpdate.get(taskId.toString());
                const newStart = new Date(updatedTask.start);
                const newEnd = new Date(updatedTask.end);

                // Check if dates actually changed
                const datesChanged = oldState &&
                    (oldState.start.getTime() !== newStart.getTime() ||
                     oldState.end.getTime() !== newEnd.getTime());

              
                if (datesChanged && oldState) {
                    // Set loading state
                    setIsSyncingSubTasks(true);

                    // Dynamically import required services
                    const [
                        { GanttSubTaskSyncService },
                        { GanttPhaseUpdateService },
                        { toast }
                    ] = await Promise.all([
                        import('@/services/ganttSubTaskSyncService'),
                        import('@/services/ganttPhaseUpdateService'),
                        import('sonner')
                    ]);

                    // Show loading toast (commented out)
                    // const toastId = toast.loading('Updating phase and sub-tasks...');
                    const toastId = undefined;
                    try {
                        // Step 1: Update phase dates in lifecycle_phases table
                        const phase = ganttApi.getTask(taskId);

                        // The Gantt chart task ID is the lifecycle_phases.id primary key
                        const databasePhaseId = taskId;

                        if (!databasePhaseId) {
                            console.error('[GanttChart] ❌ Cannot update phase: database phase_id not found');
                            toast.error('Cannot update phase: missing phase ID', { id: toastId });
                            return;
                        }

                        const phaseUpdateResult = await GanttPhaseUpdateService.updatePhaseDates(
                            databasePhaseId,
                            newStart,
                            newEnd
                        );

                        if (!phaseUpdateResult.success) {
                            console.error('[GanttChart] ❌ Phase update failed:', phaseUpdateResult.error);
                            toast.error(`Failed to update phase: ${phaseUpdateResult.error}`, { id: toastId });
                            return;
                        }

                        // This is needed for category auto-update to work correctly
                        const phaseTaskInRef = tasksRef.current.find((t: any) => t.id === taskId);
                        if (phaseTaskInRef) {
                            phaseTaskInRef.start = newStart;
                            phaseTaskInRef.end = newEnd;
                            phaseTaskInRef.duration = Math.ceil(
                                (newEnd.getTime() - newStart.getTime()) / (1000 * 60 * 60 * 24)
                            );
                        }

                        const syncResult = await GanttSubTaskSyncService.syncSubTasksForPhase(
                            taskId,
                            oldState.start,
                            oldState.end,
                            newStart,
                            newEnd,
                            tasksRef.current
                        );

                        // Track updated child phases for later dependency recalculation
                        const updatedChildPhaseIds: string[] = [];

                        if (syncResult.success && syncResult.updatedSubTasks > 0) {
                            // Set flag to prevent recursive updates
                            isUpdatingChildTasks = true;

                            try {
                                // Get all sub-tasks for this phase
                                const subTasks = GanttSubTaskSyncService.getPhaseSubTasks(
                                    tasksRef.current,
                                    taskId
                                );

                                // Update each sub-task's dates in the Gantt chart
                                subTasks.forEach((subTask) => {
                                const { startDate, endDate } = GanttSubTaskSyncService.calculateAdjustedSubTaskDates(
                                    subTask,
                                    oldState.start,
                                    oldState.end,
                                    newStart,
                                    newEnd
                                );

                                try {
                                    ganttApi.exec('update-task', {
                                        id: subTask.id,
                                        task: {
                                            start: startDate,
                                            end: endDate,
                                            duration: Math.ceil(
                                                (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                                            )
                                        }
                                    });

                                    // Also update in tasksRef to keep state in sync
                                    const taskInRef = tasksRef.current.find((t: any) => t.id === subTask.id);
                                    if (taskInRef) {
                                        taskInRef.start = startDate;
                                        taskInRef.end = endDate;
                                        taskInRef.duration = Math.ceil(
                                            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                                        );
                                    }

                                } catch (err) {
                                    console.error('[GanttChart] ❌ Failed to update sub-task in UI:', subTask.id, err);
                                }
                            });

                            // Also update child phases (sub-phases) if any
                            const childPhases = tasksRef.current.filter((t: any) => {
                                const isChildOfCurrentPhase = t.parent?.toString() === taskId.toString();
                                const isPhase = ['summary', 'running', 'overdue', 'on-time', 'not-started'].includes(t.type);

                                // Exclude container tasks - they're not actual phases
                                const taskIdStr = t.id?.toString() || '';
                                const isContainerTask = taskIdStr.startsWith('document-') ||
                                                       taskIdStr.startsWith('activity-') ||
                                                       taskIdStr.startsWith('audit-') ||
                                                       taskIdStr.startsWith('gap_analysis-') ||
                                                       taskIdStr.startsWith('design_review_');

                                return isChildOfCurrentPhase && isPhase && !isContainerTask;
                            });

                            if (childPhases.length > 0) {
                                // Calculate the delta (how much the phase moved)
                                const startDelta = newStart.getTime() - oldState.start.getTime();
                                const endDelta = newEnd.getTime() - oldState.end.getTime();

                                // Update each child phase
                                for (const childPhase of childPhases) {
                                    try {
                                        const childOldStart = new Date(childPhase.start);
                                        const childOldEnd = new Date(childPhase.end);
                                        const childNewStart = new Date(childOldStart.getTime() + startDelta);
                                        const childNewEnd = new Date(childOldEnd.getTime() + startDelta);

                                        // Update child phase in database
                                        const childPhaseDbId = childPhase.id;
                                        if (childPhaseDbId) {
                                            const childPhaseResult = await GanttPhaseUpdateService.updatePhaseDates(
                                                childPhaseDbId.toString(),
                                                childNewStart,
                                                childNewEnd
                                            );

                                            if (childPhaseResult.success) {
                                                updatedChildPhaseIds.push(childPhase.id.toString());
                                            } else {
                                                console.error('[GanttChart] ❌ Failed to update child phase in database:', childPhaseResult.error);
                                            }
                                        }

                                        // Update child phase in Gantt UI
                                        ganttApi.exec('update-task', {
                                            id: childPhase.id,
                                            task: {
                                                start: childNewStart,
                                                end: childNewEnd,
                                                duration: Math.ceil(
                                                    (childNewEnd.getTime() - childNewStart.getTime()) / (1000 * 60 * 60 * 24)
                                                )
                                            }
                                        });

                                        // Update in tasksRef
                                        const childInRef = tasksRef.current.find((t: any) => t.id === childPhase.id);
                                        if (childInRef) {
                                            childInRef.start = childNewStart;
                                            childInRef.end = childNewEnd;
                                            childInRef.duration = Math.ceil(
                                                (childNewEnd.getTime() - childNewStart.getTime()) / (1000 * 60 * 60 * 24)
                                            );
                                        }
                                    } catch (err) {
                                        console.error('[GanttChart] ❌ Failed to update child phase:', childPhase.id, err);
                                    }
                                }
                            }
                            } finally {
                                // Reset flag after all updates are done
                                isUpdatingChildTasks = false;

                                try {
                                    ganttApi.exec('refresh-data');
                                } catch (err) {
                                    setTasks([...tasksRef.current]);
                                }
                            }

                            toast.success(
                                `Phase updated successfully: ${syncResult.updatedSubTasks} sub-task${syncResult.updatedSubTasks > 1 ? 's' : ''} synchronized`,
                                { id: toastId }
                            );

                            // Automatically recalculate dependent phases after phase update
                            isUpdatingParentCategory = true;
                            try {
                                await recalculateDependentPhases(taskId, ganttApi);
                                if (updatedChildPhaseIds.length > 0) {
                                    for (const childPhaseId of updatedChildPhaseIds) {
                                        try {
                                            await recalculateDependentPhases(childPhaseId, ganttApi);
                                        } catch (childError) {
                                            console.error('[GanttChart] ❌ Error recalculating child phase dependencies:', childPhaseId, childError);
                                        }
                                    }
                                }
                            } catch (error) {
                                console.error('[GanttChart] ❌ Error recalculating dependent phases:', error);
                            }

                            // Update parent category dates if phase extends beyond category boundaries
                            try {
                                await updateParentPhaseDatesIfNeeded(taskId, ganttApi, recalculateDependentPhases, tasksRef.current);
                            } catch (error) {
                                console.error('[GanttChart] ❌ Error updating parent category:', error);
                            } finally {
                                isUpdatingParentCategory = false;
                            }

                        } else if (syncResult.success) {
                            // toast.success('Phase dates updated successfully', { id: toastId });

                            isUpdatingParentCategory = true;
                            try {
                                await recalculateDependentPhases(taskId, ganttApi);
                            } catch (error) {
                                console.error('[GanttChart] ❌ Error recalculating dependent phases:', error);
                            }

                            // Update parent category dates if phase extends beyond category boundaries
                            try {
                                await updateParentPhaseDatesIfNeeded(taskId, ganttApi, recalculateDependentPhases, tasksRef.current);
                            } catch (error) {
                                console.error('[GanttChart] ❌ Error updating parent category:', error);
                            } finally {
                                isUpdatingParentCategory = false;
                            }
                        } else {
                            toast.warning(
                                `Phase updated but some sub-tasks failed: ${syncResult.errors.join(', ')}`,
                                { id: toastId }
                            );
                        }
                    } catch (error) {
                        console.error('[GanttChart] Error updating phase:', error);
                        toast.error('Failed to update phase and sub-tasks', { id: toastId });
                    } finally {
                        // Clean up stored state
                        phaseStatesBeforeUpdate.delete(taskId.toString());
                        setIsSyncingSubTasks(false);
                        setIsRecalculating(false);

                    }
                }
            }

            // Check if this is a document task (blue task)
            if (updatedTask && updatedTask.type === 'task' && typeof taskId === 'string') {
                const isDocumentTask = hasTaskPrefix(taskId, 'doc');
                const isActivityTask = hasTaskPrefix(taskId, 'activity');
                const isAuditTask = hasTaskPrefix(taskId, 'audit');
                const isGapAnalysisTask = hasTaskPrefix(taskId, 'gap');

                if (!isDocumentTask && !isActivityTask && !isAuditTask && !isGapAnalysisTask) {
                    return;
                }

                const startDate = updatedTask.start;
                const endDate = updatedTask.end;
                const phaseId = getPhaseIdFromDocument(updatedTask);

                updateTaskCacheDates(taskId, startDate, endDate);

                if (isDocumentTask) {
                    const documentId = stripTaskPrefix(taskId, 'doc');

                    // Recalculate dependencies IMMEDIATELY (not debounced) for real-time UI updates
                    (async () => {
                        try {
                            await recalculateDocumentDependencies(taskId, ganttApi);
                        } catch (docRecalcError) {
                            console.error('[GanttChart] Error recalculating document dependencies:', docRecalcError);
                        }
                    })();

                    scheduleTaskDateUpdate(
                        `doc-${documentId}`,
                        'Updating document dates...',
                        'Document dates updated successfully',
                        'Failed to update document dates',
                        async () => {
                            const { GanttPhaseDocumentService } = await import('@/services/ganttPhaseDocumentService');

                            const result = await GanttPhaseDocumentService.updateDocumentDates(
                                documentId,
                                endDate ? new Date(endDate) : undefined,
                                startDate ? new Date(startDate) : undefined
                            );

                            // Update parent phase dates if child extends beyond boundaries
                            if (result.success) {
                                await updateParentPhaseDatesIfNeeded(taskId, ganttApi, recalculateDependentPhases, tasksRef.current);
                            }

                            return result;
                        }
                    );
                    return;
                }

                if (isActivityTask) {
                    const activityId = stripTaskPrefix(taskId, 'activity');

                    // Recalculate dependencies IMMEDIATELY for real-time UI updates
                    (async () => {
                        try {
                            await recalculateActivityDependencies(taskId, ganttApi);
                        } catch (activityRecalcError) {
                            console.error('[GanttChart] Error recalculating activity dependencies:', activityRecalcError);
                        }
                    })();

                    scheduleTaskDateUpdate(
                        `activity-${activityId}`,
                        'Updating activity dates...',
                        'Activity dates updated successfully',
                        'Failed to update activity dates',
                        async () => {
                            const { GanttActivityAuditService } = await import('@/services/ganttActivityAuditService');

                            const result = await GanttActivityAuditService.updateActivityDates(
                                activityId,
                                endDate ? new Date(endDate) : undefined,
                                startDate ? new Date(startDate) : undefined
                            );

                            // Update parent phase dates if child extends beyond boundaries
                            if (result.success) {
                                await updateParentPhaseDatesIfNeeded(taskId, ganttApi, recalculateDependentPhases, tasksRef.current);
                            }

                            return result;
                        }
                    );
                    return;
                }

                if (isAuditTask) {
                    const auditId = stripTaskPrefix(taskId, 'audit');

                    // Recalculate dependencies IMMEDIATELY for real-time UI updates
                    (async () => {
                        try {
                            await recalculateAuditDependencies(taskId, ganttApi);
                        } catch (auditRecalcError) {
                            console.error('[GanttChart] Error recalculating audit dependencies:', auditRecalcError);
                        }
                    })();

                    scheduleTaskDateUpdate(
                        `audit-${auditId}`,
                        'Updating audit dates...',
                        'Audit dates updated successfully',
                        'Failed to update audit dates',
                        async () => {
                            const { GanttActivityAuditService } = await import('@/services/ganttActivityAuditService');

                            const result = await GanttActivityAuditService.updateAuditDates(
                                auditId,
                                endDate ? new Date(endDate) : undefined,
                                startDate ? new Date(startDate) : undefined,
                                endDate ? new Date(endDate) : undefined
                            );

                            // Update parent phase dates if child extends beyond boundaries
                            if (result.success) {
                                await updateParentPhaseDatesIfNeeded(taskId, ganttApi, recalculateDependentPhases, tasksRef.current);
                            }

                            return result;
                        }
                    );
                    return;
                }

                if (isGapAnalysisTask) {
                    const gapItemId = stripTaskPrefix(taskId, 'gap');
                    const normalizedGapItemId = normalizeGapItemIdForUpdate(gapItemId);
                    const rawPhaseIdentifier =
                        (updatedTask as any)?.companyPhaseId ??
                        (updatedTask as any)?.phase_id ??
                        phaseId;
                    const gapPhaseIdForUpdate = resolveCompanyPhaseId(rawPhaseIdentifier);

                    // Recalculate dependencies IMMEDIATELY for real-time UI updates
                    (async () => {
                        try {
                            await recalculateGapAnalysisDependencies(taskId, ganttApi);
                        } catch (gapRecalcError) {
                            console.error('[GanttChart] Error recalculating gap analysis dependencies:', gapRecalcError);
                        }
                    })();

                    scheduleTaskDateUpdate(
                        `gap-${normalizedGapItemId || gapItemId}`,
                        'Updating gap analysis dates...',
                        'Gap analysis dates updated successfully',
                        'Failed to update gap analysis dates',
                        async () => {
                            const { GanttGapAnalysisService } = await import('@/services/ganttGapAnalysisService');

                            if (!gapPhaseIdForUpdate) {
                                console.warn('[GanttChart] Missing phase reference for gap update', {
                                    gapItemId,
                                    normalizedGapItemId,
                                    phaseId,
                                    taskId
                                });
                                return {
                                    success: false,
                                    error: 'Missing phase reference for gap analysis item'
                                };
                            }

                            const result = await GanttGapAnalysisService.updateGapItemDates(
                                normalizedGapItemId || gapItemId,
                                gapPhaseIdForUpdate,
                                endDate ? new Date(endDate) : undefined,
                                startDate ? new Date(startDate) : undefined
                            );

                            // Update parent phase dates if child extends beyond boundaries
                            if (result.success) {
                                await updateParentPhaseDatesIfNeeded(taskId, ganttApi, recalculateDependentPhases, tasksRef.current);
                            }

                            return result;
                        }
                    );
                    return;
                }
            }
        });

        // Handle delete-link event
        ganttApi.intercept('delete-link', async (ev: { id: string | number }) => {

            if (!productId || !ev?.id) {
                toast.error('Cannot delete link: missing product or link ID');
                return false;
            }

            const linkId = String(ev.id);

            try {
                // Find the link in local state
                const linkToDelete = linksRef.current.find(link => String(link.id) === linkId);

                if (!linkToDelete) {
                    toast.error('Link not found');
                    return false;
                }

                // Get source and target to find the dependency in database
                const sourcePhaseId = String(linkToDelete.source);
                const targetPhaseId = String(linkToDelete.target);

                // Only allow deletion for phase-to-phase links
                const sourceType = getLinkEntityType(sourcePhaseId);
                const targetType = getLinkEntityType(targetPhaseId);

                if (sourceType !== 'phase' || targetType !== 'phase') {
                    toast.info('Link deletion is only available for phase dependencies');
                    return false;
                }
                
                // Delete from database by source and target phase IDs
                const { data, error } = await supabase
                    .from('product_phase_dependencies')
                    .delete()
                    .eq('product_id', productId)
                    .eq('source_phase_id', sourcePhaseId)
                    .eq('target_phase_id', targetPhaseId);

                if (error) {
                    toast.error('Failed to delete dependency: ' + error.message);
                    return false;
                }

                // Update local state
                setLinks(prevLinks => prevLinks.filter(link => String(link.id) !== linkId));
                toast.success('Dependency deleted successfully');
                return true;
            } catch (err: any) {
                toast.error('Failed to delete dependency');
                return false;
            }
        });

        ganttApi.intercept('add-link', async (ev: {
            id?: string | number;
            link: {
                source: string | number;
                target: string | number;
                type: "e2s" | "s2s" | "e2e" | "s2e";
            };
        }) => {
            if (!productId) {
                toast.error('No productId available');
                return false;
            }
            const { source, target, type } = ev.link;

            // Get task names using imported utility
            const sourceName = getTaskName(source, ganttApi);
            const targetName = getTaskName(target, ganttApi);
            const linkTypeText = getLinkTypeText(type);

            const sourceEntityType = getLinkEntityType(source);
            const targetEntityType = getLinkEntityType(target);

            if (isLinkRestricted(sourceEntityType, targetEntityType)) {
                toast.info(getLinkRestrictionMessage(sourceEntityType, targetEntityType));
                return false;
            }

            // Check for circular dependencies before creating the link
            const currentLinks = linksRef.current || [];
            const wouldCreateCycle = detectCircularDependency(source, target, currentLinks);

            if (wouldCreateCycle) {
                toast.info(`Circular dependency detected: ${sourceName} ↔ ${targetName}`);
                return false;
            }

            try {
                // Use GanttLinkService to create the link
                const savedLink = await GanttLinkService.createGanttLink(productId, {
                    source,
                    target,
                    type
                });

                toast.success(`Dependency created: ${sourceName} → ${targetName} (${linkTypeText})`);
                setLinks(prevLinks => {
                    const filteredLinks = prevLinks.filter(
                        link => !(link.source === String(source) && link.target === String(target))
                    );
                    return [...filteredLinks, savedLink];
                });

                // Trigger auto-recalculation for PHASE links and DOCUMENT links
                // Document links should recalculate both documents and their parent phase
                const isPhaseLink = savedLink.linkType === 'phase' ||
                                   (!String(source).match(/^(doc|gap|activity|audit)[-_]/) &&
                                    !String(target).match(/^(doc|gap|activity|audit)[-_]/));

                const isDocumentLink = String(source).match(/^doc[-_]/) || String(target).match(/^doc[-_]/);
                const isActivityLink = String(source).match(/^activity[-_]/) || String(target).match(/^activity[-_]/);
                const isAuditLink = String(source).match(/^audit[-_]/) || String(target).match(/^audit[-_]/);
                const isGapAnalysisLink = String(source).match(/^gap[-_]/) || String(target).match(/^gap[-_]/);

                if (isPhaseLink || isDocumentLink) {
                    try {
                        setIsRecalculating(true);
                        await autoRecalculateTimeline(productId, ganttApi);

                        // If document link, also update parent phase dates
                        if (isDocumentLink) {
                            const sourceTask = ganttApi.getTask(source);
                            const targetTask = ganttApi.getTask(target);

                            // Update parent phase for source document
                            if (sourceTask && sourceTask.parent) {
                                await updateParentPhaseDatesIfNeeded(source, ganttApi, recalculateDependentPhases, tasksRef.current);
                            }

                            // Update parent phase for target document
                            if (targetTask && targetTask.parent) {
                                await updateParentPhaseDatesIfNeeded(target, ganttApi, recalculateDependentPhases, tasksRef.current);
                            }

                            try {
                                if (isDocumentTaskId(source)) {
                                    await recalculateDocumentDependencies(source, ganttApi);
                                }
                                if (isDocumentTaskId(target)) {
                                    await recalculateDocumentDependencies(target, ganttApi);
                                }
                            } catch (docDependencyError) {
                                console.error('[add-link] Error recalculating document dependencies:', docDependencyError);
                            }
                        }
                    } catch (recalcErr: any) {
                        console.error('[add-link] ❌ Error during auto-recalculation:', recalcErr);
                    } finally {
                        setIsRecalculating(false);
                    }
                }

                if (isActivityLink) {
                    try {
                        const sourceIsActivity = isActivityTaskId(source);
                        const targetIsActivity = isActivityTaskId(target);

                        if (sourceIsActivity) {
                            await updateParentPhaseDatesIfNeeded(source, ganttApi, recalculateDependentPhases, tasksRef.current);
                            await recalculateActivityDependencies(source, ganttApi);
                        }

                        if (targetIsActivity) {
                            await updateParentPhaseDatesIfNeeded(target, ganttApi, recalculateDependentPhases, tasksRef.current);
                            await recalculateActivityDependencies(target, ganttApi);
                        }
                    } catch (activityLinkError) {
                        console.error('[add-link] Error recalculating activity dependencies:', activityLinkError);
                    }
                }

                if (isAuditLink) {
                    try {
                        const sourceIsAudit = isAuditTaskId(source);
                        const targetIsAudit = isAuditTaskId(target);

                        if (sourceIsAudit) {
                            await updateParentPhaseDatesIfNeeded(source, ganttApi, recalculateDependentPhases, tasksRef.current);
                            await recalculateAuditDependencies(source, ganttApi);
                        }

                        if (targetIsAudit) {
                            await updateParentPhaseDatesIfNeeded(target, ganttApi, recalculateDependentPhases, tasksRef.current);
                            await recalculateAuditDependencies(target, ganttApi);
                        }
                    } catch (auditLinkError) {
                        console.error('[add-link] Error recalculating audit dependencies:', auditLinkError);
                    }
                }

                if (isGapAnalysisLink) {
                    try {
                        const sourceIsGapAnalysis = isGapAnalysisTaskId(source);
                        const targetIsGapAnalysis = isGapAnalysisTaskId(target);

                        if (sourceIsGapAnalysis) {
                            await updateParentPhaseDatesIfNeeded(source, ganttApi, recalculateDependentPhases, tasksRef.current);
                            await recalculateGapAnalysisDependencies(source, ganttApi);
                        }

                        if (targetIsGapAnalysis) {
                            await updateParentPhaseDatesIfNeeded(target, ganttApi, recalculateDependentPhases, tasksRef.current);
                            await recalculateGapAnalysisDependencies(target, ganttApi);
                        }
                    } catch (gapAnalysisLinkError) {
                        console.error('[add-link] Error recalculating gap analysis dependencies:', gapAnalysisLinkError);
                    }
                }
            } catch (err: any) {
                console.error('[add-link] Error saving link to database:', err);
                toast.error(`Failed to create dependency: ${sourceName} → ${targetName} (${linkTypeText})`);
            }
        });

        // Handle lazy loading for tasks with lazy: true
        // Only provide CHILDREN of the expanded branch, not all tasks
        ganttApi.on('request-data', async (ev: any) => {
            if (!ev || !ev.id || !productId) {
                return;
            }

            try {
                const [tasksResponse, linksResponse] = await Promise.all([
                    apiClient.get(`/product/gantt-chart/${productId}/tasks`),
                    apiClient.get(`/product/gantt-chart/${productId}/links`),
                ]);

                const allTasks = parseDates(tasksResponse.data);
                const allLinks = linksResponse.data || [];

                // Collect only descendants of the expanded task (not all tasks)
                const expandedId = String(ev.id);
                const getDescendants = (parentId: string): any[] => {
                    const children = allTasks.filter(t => String(t.parent) === parentId);
                    const descendants = [...children];
                    children.forEach(child => {
                        descendants.push(...getDescendants(String(child.id)));
                    });
                    return descendants;
                };

                const branchTasks = getDescendants(expandedId);
                const branchTaskIds = new Set(branchTasks.map(t => String(t.id)));

                // Filter links to only those connecting branch tasks
                const branchLinks = allLinks.filter((link: any) =>
                    branchTaskIds.has(String(link.source)) || branchTaskIds.has(String(link.target))
                );

                ganttApi.exec('provide-data', {
                    id: ev.id,
                    data: {
                        tasks: branchTasks,
                        links: branchLinks,
                    },
                });

                // Update React tasks state so re-renders don't re-trigger request-data.
                // Remove lazy flag from the parent and add children to the state.
                setTasks(prev => {
                    const existingIds = new Set(prev.map(t => String(t.id)));
                    const newChildren = branchTasks.filter(t => !existingIds.has(String(t.id)));
                    const updated = prev.map(t =>
                        String(t.id) === expandedId ? { ...t, lazy: false, open: true } : t
                    );
                    return [...updated, ...newChildren];
                });
            } catch (err: any) {
                ganttApi.exec('provide-data', {
                    id: ev.id,
                    data: {
                        tasks: [],
                        links: [],
                    },
                });
            }
        });

        // Cleanup function to remove all event listeners
        return () => {
            updateDebounceTimers.forEach((timer) => clearTimeout(timer));
            updateDebounceTimers.clear();
        };
    }, [apiReady, productId, resolveCompanyPhaseId]);

    // Subscribe to editor-action event to handle save
    useEffect(() => {
        if (!apiReady || !apiRef.current) return;

        const ganttApi = apiRef.current;
        const unsubscribeEditorAction = ganttApi.on('editor-action', async (ev: any) => {
            if (!ev || ev.action !== 'save' || !ev.id) return;

            const taskId = ev.id;
            const task = ev.task;
            if (!taskId.toString().startsWith('doc')) {
                return;
            }

            const documentId = taskId.toString().replace(/^doc[-_]/, '');
            const assignedAuthor = task.assigned;

            if (!assignedAuthor) {
                console.warn('[GanttChart] ⚠️ No author assigned');
                return;
            }

            try {
                const { toast } = await import('sonner');
                const toastId = toast.loading('Updating document author...');

                // The assigned value is the author name (from the combo selection)
                const authorName = typeof assignedAuthor === 'string' ? assignedAuthor : String(assignedAuthor);

                // Update author field in phase_assigned_document_template
                const { error } = await supabase
                    .from('phase_assigned_document_template')
                    .update({
                        author: authorName,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', documentId);

                if (error) {
                    console.error('[GanttChart] Failed to update document author:', error);
                    toast.error('Failed to update document author', { id: toastId });
                    return;
                }

                toast.success(`Document assigned to ${authorName}`, { id: toastId });

                // Update the task in tasksRef to keep state in sync
                const taskInRef = tasksRef.current.find((t: any) => t.id === taskId);
                if (taskInRef) {
                    taskInRef.assigned = authorName;
                    taskInRef.author = authorName;
                }

                // Update task in Gantt API to show name immediately in UI
                try {
                    const ganttTask = ganttApi.getTask(taskId);
                    if (ganttTask) {
                        ganttApi.exec('update-task', {
                            id: taskId,
                            task: {
                                ...ganttTask,
                                assigned: authorName,
                                author: authorName
                            }
                        });
                    }
                } catch (err) {
                    console.warn('[GanttChart] Could not update Gantt task in editor-action:', err);
                }

                // Update tasks state to keep React state in sync
                setTasks(prevTasks => {
                    return prevTasks.map(task => {
                        if (task.id.toString() === taskId.toString()) {
                            return {
                                ...task,
                                assigned: authorName,
                                author: authorName
                            };
                        }
                        return task;
                    });
                });

                // Close the editor automatically after author is updated
                setShowDocumentEditor(false);
                setSelectedDocumentTaskId(null);
                setSelectedDocument(null);

            } catch (error) {
                console.error('[GanttChart] Error updating document author:', error);
                const { toast } = await import('sonner');
                toast.error('Failed to update document author');
            }
        });

        return () => {
            if (unsubscribeEditorAction) unsubscribeEditorAction();
        };
    }, [apiReady]);

    // Helper function to save assigned field (multiple authors) - useCallback to make it accessible everywhere
    const saveAssignedField = useCallback(async (taskId: string, authors: { id: string; name: string }[]) => {
        if (!taskId || !taskId.toString().startsWith('doc')) {
            console.warn('[GanttChart] saveAssignedField: Invalid taskId', taskId);
            return;
        }
        if (!authors || authors.length === 0) {
            console.warn('[GanttChart] saveAssignedField: No authors provided');
            return;
        }

        const documentId = taskId.toString().replace(/^doc[-_]/, '');
        const authorIds = authors.map(a => a.id);
        const authorNames = authors.map(a => a.name).join(', ');

        console.log('[GanttChart] saveAssignedField: Saving authors', {
            taskId,
            documentId,
            authors,
            authorIds
        });

        try {
            const { toast } = await import('sonner');
            const toastId = toast.loading('Updating document authors...');

            // Update database with authors_ids array
            const { data, error } = await supabase
                .from('phase_assigned_document_template')
                .update({
                    authors_ids: authorIds,
                    updated_at: new Date().toISOString()
                })
                .eq('id', documentId)
                .select('id, authors_ids');

            if (error) {
                console.error('[GanttChart] Failed to update authors:', error);
                toast.error('Failed to update document authors', { id: toastId });
                return;
            }

            console.log('[GanttChart] saveAssignedField: Database update result:', data);

            if (!data || data.length === 0) {
                console.warn('[GanttChart] saveAssignedField: No rows updated - document ID may be incorrect:', documentId);
                toast.error('Document not found', { id: toastId });
                return;
            }

            toast.success(`Document assigned to ${authorNames}`, { id: toastId });

            // Update task in tasksRef to keep state in sync
            const taskInRef = tasksRef.current.find((t: any) => t.id === taskId);
            if (taskInRef) {
                taskInRef.assigned = authorNames;
                taskInRef.authors_ids = authorIds;
                taskInRef.authors = authors;
            }

            // Update task in Gantt API to show name immediately in UI
            if (apiRef.current) {
                try {
                    const ganttTask = apiRef.current.getTask(taskId);
                    if (ganttTask) {
                        apiRef.current.exec('update-task', {
                            id: taskId,
                            task: {
                                ...ganttTask,
                                assigned: authorNames,
                                authors_ids: authorIds,
                                authors: authors
                            }
                        });
                    }
                } catch (err) {
                    console.warn('[GanttChart] Could not update Gantt task:', err);
                }
            }

            // Update tasks state to keep React state in sync
            setTasks(prevTasks => {
                return prevTasks.map(task => {
                    if (task.id.toString() === taskId.toString()) {
                        return {
                            ...task,
                            assigned: authorNames,
                            authors_ids: authorIds,
                            authors: authors
                        };
                    }
                    return task;
                });
            });

            // Close the editor automatically after a successful update
            setShowDocumentEditor(false);
            setSelectedDocumentTaskId(null);
            setSelectedDocument(null);
        } catch (error) {
            console.error('[GanttChart] Error saving authors:', error);
            const { toast } = await import('sonner');
            toast.error('Failed to update document authors');
        }
    }, []);

    // Subscribe to open-task event for expansion state management
    useEffect(() => {
        if (!apiReady || !apiRef.current) return;

        const api = apiRef.current;
        const unsubscribeOpenTask = api.on('open-task', (ev: any) => {
            if (ev && ev.id) {
                const isExpanded = ev.mode === true;
                handleTaskExpansion(ev.id.toString(), isExpanded);
            }
        });

        return () => {
            if (unsubscribeOpenTask) unsubscribeOpenTask();
        };
    }, [apiReady, handleTaskExpansion]);

    useEffect(() => {
        if (!apiReady || !apiRef.current) return;

        const ganttApi = apiRef.current;
        const unsubscribeSelect = ganttApi.on('select-task', async (ev: any) => {

            if (!ev || !ev.id) {
                setShowDocumentEditor(false);
                setSelectedDocumentTaskId(null);
                setSelectedDocument(null);
                return;
            }

            // In readonly mode, do not open the document editor
            if (readonly) {
                return;
            }

            try {
                const selectedTask = ganttApi.getTask(ev.id);
                const isDocumentTask =
                    selectedTask &&
                    selectedTask.type === 'task' &&
                    selectedTask.subTaskType === 'document';

                if (isDocumentTask) {
                    setSelectedDocumentTaskId(ev.id);

                    // Extract document ID from task ID (doc-{uuid} or doc_{uuid})
                    const documentId = ev.id.toString().replace(/^doc[-_]/, '');

                    // Fetch full document data from database
                    const { data: docData, error } = await supabase
                        .from('phase_assigned_document_template')
                        .select('*')
                        .eq('id', documentId)
                        .single();

                    if (error) {
                        console.error('[GanttChart] Error fetching document:', error);
                        setShowDocumentEditor(false);
                        setSelectedDocument(null);
                        return;
                    }

                    if (docData) {
                        // Map to the format expected by EditDocumentDialog
                        const documentForEdit = {
                            ...docData,
                            phase_id: docData.phase_id || selectedTask.parent?.toString().replace(/^phase[-_]/, ''),
                            phaseId: docData.phase_id || selectedTask.parent?.toString().replace(/^phase[-_]/, ''),
                        };

                        setSelectedDocument(documentForEdit);
                        setSelectedDocumentType('template-instance');
                        setShowDocumentEditor(true);
                    }
                } else {
                    setSelectedDocumentTaskId(null);
                    setSelectedDocument(null);
                    setShowDocumentEditor(false);
                }
            } catch (error) {
                console.error('[GanttChart] Error determining selected task type:', error);
                setShowDocumentEditor(false);
                setSelectedDocumentTaskId(null);
                setSelectedDocument(null);
            }
        });

        return () => {
            if (unsubscribeSelect) {
                unsubscribeSelect();
            }
        };
    }, [apiReady, readonly]);
    // Apply expansion state to tasks
    // Only set open: true if the task actually has children (or is lazy),
    // otherwise the SVAR library crashes on null.forEach()
    const tasksWithExpansion = useMemo(() => {
        const parentIds = new Set(
            tasks.map(t => String(t.parent ?? '')).filter(Boolean)
        );
        return tasks.map(task => {
            const isOpen = taskExpansionState[task.id.toString()] ?? task.open ?? false;
            const hasChildren = parentIds.has(String(task.id));
            const isLazy = !!(task as any).lazy;
            return {
                ...task,
                open: isOpen && (hasChildren || isLazy),
            };
        });
    }, [tasks, taskExpansionState]);

    // Update tasksRef when tasks change
    useEffect(() => {
        tasksRef.current = tasksWithExpansion;

        const phaseMap = phaseCompanyMapRef.current;
        phaseMap.clear();

        tasksWithExpansion.forEach((task) => {
            const companyPhaseId =
                (task as any)?.companyPhaseId ||
                (task as any)?.phase_id ||
                (task as any)?.phaseId;

            if (!companyPhaseId) {
                return;
            }

            const companyPhaseIdStr = String(companyPhaseId);
            const normalizedCompanyPhaseId = stripPhasePrefix(companyPhaseIdStr);

            // Map both raw and normalized phase IDs to the normalized value
            phaseMap.set(companyPhaseIdStr, normalizedCompanyPhaseId);
            if (normalizedCompanyPhaseId !== companyPhaseIdStr) {
                phaseMap.set(normalizedCompanyPhaseId, normalizedCompanyPhaseId);
            }

            if (task?.id !== undefined && task?.id !== null) {
                const taskIdStr = task.id.toString();
                phaseMap.set(taskIdStr, normalizedCompanyPhaseId);

                const normalizedTaskId = stripPhasePrefix(taskIdStr);
                if (normalizedTaskId && normalizedTaskId !== taskIdStr) {
                    phaseMap.set(normalizedTaskId, normalizedCompanyPhaseId);
                }
            }
        });
    }, [tasksWithExpansion, stripPhasePrefix]);

    // Update linksRef when links change
    useEffect(() => {
        linksRef.current = links;
    }, [links]);

    const zoomConfig = useMemo(
        () => {
            const config = {
                maxCellWidth: resolvedZoomMeta?.maxCellWidth ?? 400,
                minCellWidth: resolvedZoomMeta?.minCellWidth,
                level: effectiveZoomLevel,
                levels: zoomLevels,
            };
            console.log('[zoom-in-out-issue] zoomConfig passed to Gantt:', JSON.stringify(config, null, 2));
            console.log('[zoom-in-out-issue] zoomLevels[' + effectiveZoomLevel + '].scales:', JSON.stringify(zoomLevels[effectiveZoomLevel]?.scales));
            return config;
        },
        [effectiveZoomLevel, resolvedZoomMeta]
    );

    // Get translated columns
    const translatedColumns = useMemo(() => {
        return getColumns(lang);
    }, [lang]);

    // Editor configuration
    const bottomBar = useMemo(
        () => ({
            items: [
                { comp: 'button', type: 'secondary', text: 'Close', id: 'close' },
                { comp: 'spacer' },
                { comp: 'button', type: 'primary', text: 'Save', id: 'save' },
            ],
        }),
        [],
    );

    const editorItems = useMemo(() => {
        // Get authors from selected document
        const authorsIds = selectedDocument?.authors_ids || [];
        return [
            {
                key: 'assigned',
                comp: 'assigned-combo',
                label: 'Authors',
                value: authorsIds[0] || '',
                config: {
                    placeholder: 'Select authors',
                    companyId,
                    currentValues: [], // Will be populated by the component
                    onSelectMultiple: async (authors: { id: string; name: string }[]) => {
                        // Use the stored selected task ID
                        if (selectedDocumentTaskId && authors.length > 0) {
                            await saveAssignedField(selectedDocumentTaskId, authors);
                        } else {
                            console.warn('[GanttChart] Cannot save - missing taskId or authors:', {
                                selectedDocumentTaskId,
                                authors
                            });
                        }
                    },
                },
            },
        ];
    }, [companyId, selectedDocumentTaskId, saveAssignedField, selectedDocument]);

    // Show recalculation loading toast
    useEffect(() => {
        if (isRecalculating) {
            toast.loading('Recalculating timeline with new dependency...', { id: 'recalculating-timeline' });
        } else {
            toast.dismiss('recalculating-timeline');
        }
    }, [isRecalculating]);

    // Loading state
    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center py-8">
                        <div className="flex justify-center mb-4">
                            <CircularProgress percentage={loadingProgress} size={60} />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Loading Gantt Chart...</h3>
                        {loadingStage && (
                            <p className="text-sm text-muted-foreground">{loadingStage}</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Error state
    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center py-8">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-destructive" />
                        <h3 className="text-lg font-medium mb-2">{lang('gantt.errorLoadingData')}</h3>
                        <p className="text-muted-foreground">{error.message || lang('gantt.errorLoadingData')}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if ((!tasks || tasks.length === 0) && emptyState) {
        return <>{emptyState}</>;
    }

    if (!tasks || tasks.length === 0) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center py-8">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">{lang('gantt.noTasksAvailable')}</h3>
                        <p className="text-muted-foreground">{lang('gantt.addTasksMessage')}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="relative">
            <GanttLoadingOverlay
                isLoading={isSyncingSubTasks}
                message="Synchronizing sub-tasks..."
            />
            <CardHeader>
                <div className="flex items-center justify-between">
                    <GanttChartHeader title={title} />
                    <div className="flex items-center gap-2">
                        <GanttChartZoomControls
                            currentZoomLevel={effectiveZoomLevel}
                            onZoomIn={handleZoomInInternal}
                            onZoomOut={handleZoomOutInternal}
                            onResetZoom={handleResetZoomInternal}
                        />
                        {readonly && (
                            <span className="text-sm bg-blue-500 text-white font-semibold px-2 py-1 rounded-full">
                                {lang('ganttChart.readOnly')}
                            </span>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="w-full border rounded-md">
                    <Willow>
                        <Tooltip api={api} content={MyTooltipContent}>
                            <Gantt
                                init={init}
                                zoom={zoomConfig}
                                tasks={tasksWithExpansion}
                                links={links}
                                columns={translatedColumns}
                                taskTypes={taskTypes}
                                markers={ganttMarkers}
                                start={dateRange.start}
                                end={dateRange.end}
                                readonly={readonly}
                            />
                        </Tooltip>
                    </Willow>
                </div>
            </CardContent>
            {/* Edit Document Dialog - Full document editing */}
            {selectedDocument && companyId && (
                <EditDocumentDialog
                    open={showDocumentEditor}
                    onOpenChange={(open) => {
                        if (!open) {
                            setShowDocumentEditor(false);
                            setSelectedDocumentTaskId(null);
                            setSelectedDocument(null);
                        }
                    }}
                    document={selectedDocument}
                    onDocumentUpdated={async (updatedDoc) => {
                        // Update the task in the Gantt chart
                        const taskId = selectedDocumentTaskId;

                        // Close dialog first to improve UX
                        setShowDocumentEditor(false);

                        if (taskId && apiRef.current) {
                            const ganttApi = apiRef.current;
                            try {
                                const existingTask = ganttApi.getTask(taskId);
                                if (existingTask) {
                                    // Get author names - fetch from database if authors_ids is provided
                                    let authorNames: string | undefined = undefined;
                                    let authorsData = existingTask.authors;

                                    if (updatedDoc.authors_ids && Array.isArray(updatedDoc.authors_ids) && updatedDoc.authors_ids.length > 0) {
                                        // Fetch author names from multiple sources (same as useDocumentAuthors hook)
                                        const authorIds = updatedDoc.authors_ids;
                                        const foundAuthors: Array<{id: string; name: string}> = [];

                                        // 1. Try user_profiles via user_company_access (active company users)
                                        const { data: companyUsers, error: usersError } = await supabase
                                            .from('user_company_access')
                                            .select(`
                                                user_id,
                                                user_profiles!inner(id, first_name, last_name, email)
                                            `)
                                            .eq('company_id', companyId)
                                            .in('user_id', authorIds);

                                        if (usersError) {
                                            console.error('[GanttChart] Error fetching company users:', usersError);
                                        }

                                        if (companyUsers && companyUsers.length > 0) {
                                            companyUsers.forEach(u => {
                                                const profile = u.user_profiles as any;
                                                if (profile) {
                                                    const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
                                                    foundAuthors.push({
                                                        id: u.user_id,
                                                        name: fullName || profile.email || u.user_id
                                                    });
                                                }
                                            });
                                        }

                                        // 2. Check for remaining IDs in user_invitations (pending invitations)
                                        const foundIds = foundAuthors.map(a => a.id);
                                        const remainingIds = authorIds.filter((id: string) => !foundIds.includes(id));

                                        if (remainingIds.length > 0) {
                                            const { data: invitations, error: invError } = await supabase
                                                .from('user_invitations')
                                                .select('id, email, first_name, last_name')
                                                .in('id', remainingIds);

                                            if (!invError && invitations && invitations.length > 0) {
                                                invitations.forEach(inv => {
                                                    const fullName = [inv.first_name, inv.last_name].filter(Boolean).join(' ').trim();
                                                    foundAuthors.push({
                                                        id: inv.id,
                                                        name: fullName || inv.email || inv.id
                                                    });
                                                });
                                            }
                                        }

                                        // 3. Check for remaining IDs in document_authors (custom authors)
                                        const foundIds2 = foundAuthors.map(a => a.id);
                                        const remainingIds2 = authorIds.filter((id: string) => !foundIds2.includes(id));

                                        if (remainingIds2.length > 0) {
                                            const { data: docAuthors, error: docError } = await supabase
                                                .from('document_authors')
                                                .select('id, name, last_name, email')
                                                .in('id', remainingIds2);

                                            if (!docError && docAuthors && docAuthors.length > 0) {
                                                docAuthors.forEach(a => {
                                                    const fullName = [a.name, a.last_name].filter(Boolean).join(' ').trim();
                                                    foundAuthors.push({
                                                        id: a.id,
                                                        name: fullName || a.email || a.id
                                                    });
                                                });
                                            }
                                        }

                                        if (foundAuthors.length > 0) {
                                            authorsData = foundAuthors;
                                            authorNames = foundAuthors.map(a => a.name).join(', ');
                                        } else {
                                            console.warn('[GanttChart] No authors found for authors_ids:', authorIds);
                                            // Use "Unassigned" if no authors found
                                            authorNames = undefined;
                                        }
                                    } else if (updatedDoc.authors && Array.isArray(updatedDoc.authors) && updatedDoc.authors.length > 0) {
                                        // Authors array contains objects with name property
                                        authorsData = updatedDoc.authors;
                                        authorNames = updatedDoc.authors.map((a: any) => a.name || a.label || a.id).join(', ');
                                    } else if (!updatedDoc.authors_ids || updatedDoc.authors_ids.length === 0) {
                                        // Authors were cleared
                                        authorNames = undefined;
                                        authorsData = undefined;
                                    }

                                    // If authorNames is still undefined, keep existing or set to undefined for "Unassigned"
                                    const finalAuthorNames = authorNames !== undefined ? authorNames : existingTask.assigned;

                                    // Handle date fields - due_date/deadline maps to end date
                                    const endDate = updatedDoc.due_date || updatedDoc.deadline;
                                    const newEndDate = endDate ? new Date(endDate) : existingTask.end;

                                    const updatedTaskData = {
                                        text: updatedDoc.name || existingTask.text,
                                        assigned: finalAuthorNames,
                                        authors_ids: updatedDoc.authors_ids || existingTask.authors_ids,
                                        authors: authorsData || existingTask.authors,
                                        start: existingTask.start,
                                        end: newEndDate,
                                    };

                                    // Update React state to trigger re-render - this is the primary update mechanism
                                    setTasks(prevTasks => {
                                        const newTasks = prevTasks.map(task => {
                                            if (task.id.toString() === taskId.toString()) {
                                                const updatedTask = {
                                                    ...task,
                                                    ...updatedTaskData,
                                                };
                                                return updatedTask;
                                            }
                                            return task;
                                        });
                                        // Also update tasksRef for consistency
                                        tasksRef.current = newTasks;
                                        return newTasks;
                                    });
                                }
                            } catch (err) {
                                console.error('[GanttChart] Error updating task after document edit:', err);
                            }
                        }

                        setSelectedDocumentTaskId(null);
                        setSelectedDocument(null);
                    }}
                    documentType={selectedDocumentType}
                    productId={productId}
                    companyId={companyId}
                    handleRefreshData={() => {
                        // Trigger a refresh of the Gantt chart data
                        // This will be handled by the parent component or we can emit an event
                        console.log('[GanttChart] Document updated, refresh requested');
                    }}
                    isFromGanttChart={true}
                />
            )}
        </Card>
    );
}

