import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { Gantt, Willow } from "wx-react-gantt";
import "wx-react-gantt/dist/gantt.css";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  calculateDuration,
  calculateDocumentEndDate,
  calculateDocumentsSummaryDuration,
  calculateDocumentStartDate,
  mapProductDependenciesToPhases,
  mapCompanyDependenciesToProduct,
} from "@/utils/ganttUtils";
import { GanttTask } from "@/types/ganttChart";
import {
  GanttPhaseDocumentService,
  IndividualDocument,
} from "@/services/ganttPhaseDocumentService";
import { Badge } from "../ui/badge";

// Add CSS for smooth Gantt chart animations
const ganttAnimationStyles = `
  .wx-gantt .wx-task-bar {
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
  
  .wx-gantt .wx-task-bar:hover {
    filter: brightness(1.1);
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

interface CompanyMilestonesProps {
  companyName: string;
}

interface ProductPhaseData {
  id: string;
  name: string;
  inserted_at: string;
  projected_launch_date: string;
  phases: {
    id: string;
    name: string;
    start_date?: string;
    end_date?: string;
    status: string;
    position: number;
    phase_id?: string;
  }[];
  documents: {
    id: string;
    name: string;
    document_type: string;
    phase_id: string;
  }[];
  activities: {
    id: string;
    name: string;
    status: string;
    phase_id: string;
  }[];
  audits: {
    id: string;
    name: string;
    status: string;
    phase_id: string;
  }[];
  gapAnalysis: {
    id: string;
    name: string;
    status: string;
    priority: string;
    type: string;
  }[];
}

export function CompanyMilestones({ companyName }: CompanyMilestonesProps) {
  const { activeCompanyRole } = useCompanyRole();
  const { lang } = useTranslation();
  const [companyData, setCompanyData] = useState<ProductPhaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ganttApiRef = useRef<any>(null);
  const [apiReady, setApiReady] = useState(false);
  const [currentZoomLevel, setCurrentZoomLevel] = useState(1); // Default to Months
  const [ganttLinks, setGanttLinks] = useState<any[]>([]);
  const [individualDocuments, setIndividualDocuments] = useState<
    Record<string, IndividualDocument[]>
  >({});
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentCounts, setDocumentCounts] = useState<Record<string, number>>({});
  const [taskExpansionState, setTaskExpansionState] = useState<
    Record<string, boolean>
  >({});
  const [companyDependencies, setCompanyDependencies] = useState<any[]>([]);
  const [productDependencies, setProductDependencies] = useState<any[]>([]);
  const dependenciesFetchedRef = useRef<string | null>(null);

  // Translated zoom level names
  const translatedZoomLevelNames = useMemo(() => ({
    'Years': lang('milestones.zoom.levels.years'),
    '3 Months': lang('milestones.zoom.levels.threeMonths'),
    'Months': lang('milestones.zoom.levels.months'),
    'Weeks': lang('milestones.zoom.levels.weeks'),
    'Days': lang('milestones.zoom.levels.days'),
    'Hours (6h)': lang('milestones.zoom.levels.hoursSix'),
    'Hours (1h)': lang('milestones.zoom.levels.hoursOne'),
  }), [lang]);

  // Zoom configuration
  const zoomConfig = useMemo(
    () => ({ maxCellWidth: 400, level: currentZoomLevel, levels: zoomLevels }),
    [currentZoomLevel]
  );

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!activeCompanyRole?.companyId) {
        setError(lang('milestones.noActiveCompany'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch products for the company
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("id, name, inserted_at, projected_launch_date")
          .eq("company_id", activeCompanyRole.companyId)
          .eq("is_archived", false);

        if (productsError) {
          throw new Error(`Failed to fetch products: ${productsError.message}`);
        }

        if (!productsData || productsData.length === 0) {
          setCompanyData([]);
          setLoading(false);
          return;
        }

        // For each product, fetch related data
        const enrichedProducts = await Promise.all(
          (productsData || []).map(async (product) => {
            // Fetch phases for this product using lifecycle_phases table
            const { data: lifecyclePhases } = await supabase
              .from("lifecycle_phases")
              .select("id, name, start_date, end_date, status, position, phase_id")
              .eq("product_id", product.id)
              .order("position", { ascending: true });

            // Fetch documents for this product
            const { data: documents } = await supabase
              .from("documents")
              .select("id, name, document_type, phase_id")
              .eq("product_id", product.id);

            // Fetch activities for this product
            const { data: activities } = await supabase
              .from("activities")
              .select("id, name, status, phase_id")
              .eq("product_id", product.id);

            // Fetch audits for this product
            const { data: audits } = await supabase
              .from("audits")
              .select("id, name, status, phase_id")
              .eq("product_id", product.id);

            // Fetch gap analysis (CI instances) for this product
            const { data: gapAnalysis } = await supabase
              .from("ci_instances")
              .select("id, title, status, priority, type")
              .eq("product_id", product.id);

            return {
              ...product,
              phases: lifecyclePhases || [],
              documents: documents || [],
              activities: activities || [],
              audits: audits || [],
              gapAnalysis: (gapAnalysis || []).map((gap) => ({
                id: gap.id,
                name: gap.title || "Unnamed Gap Analysis",
                status: gap.status,
                priority: gap.priority,
                type: gap.type,
              })),
            };
          })
        );

        setCompanyData(enrichedProducts);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch company data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [activeCompanyRole?.companyId]);

  // Document fetching logic
  useEffect(() => {
    const fetchDocumentCounts = async () => {
      if (!companyData || companyData.length === 0 || !activeCompanyRole?.companyId) return;

      try {
        setDocumentsLoading(true);
        
        const documentCounts: Record<string, number> = {};
        
        await Promise.all(
          companyData.map(async (product) => {
            const productPhases = product.phases || [];
            // Use phase.phase_id (company_phases.id) to query documents, not phase.id (lifecycle_phases.id)
            const phaseIds = productPhases.map((phase) => phase.phase_id).filter(Boolean);

            if (phaseIds.length === 0) {
              return;
            }

            const documentsMap = await GanttPhaseDocumentService.getBatchPhaseIndividualDocuments(
              phaseIds,
              activeCompanyRole.companyId,
              product.id
            ) || {};

            // Store counts by both lifecycle phase ID and company phase ID for lookup flexibility
            productPhases.forEach((phase) => {
              const companyPhaseId = phase?.phase_id;
              const lifecyclePhaseId = phase?.id;
              const docs = companyPhaseId ? (documentsMap[companyPhaseId] || []) : [];

              // Store by both IDs so we can lookup by either
              if (companyPhaseId) {
                documentCounts[companyPhaseId] = docs.length;
              }
              if (lifecyclePhaseId) {
                documentCounts[lifecyclePhaseId] = docs.length;
              }
            });
          })
        );

        // Set empty individual documents but keep counts
        setIndividualDocuments({});
        // Store counts in a way that can be accessed by phase
        setDocumentCounts(documentCounts);
      } catch (error) {
        // Error fetching document counts
      } finally {
        setDocumentsLoading(false);
      }
    };

    fetchDocumentCounts();
  }, [companyData, activeCompanyRole?.companyId]);

  // Fetch dependencies for all products
  useEffect(() => {
    const fetchAllDependencies = async () => {
      if (!activeCompanyRole?.companyId || !companyData || companyData.length === 0) {
        dependenciesFetchedRef.current = null;
        return;
      }

      // Prevent duplicate fetches for the same company
      const fetchKey = activeCompanyRole.companyId;
      if (dependenciesFetchedRef.current === fetchKey) {
        return;
      }

      dependenciesFetchedRef.current = fetchKey;

      try {
        // 1. Fetch company-level dependencies (from Company Settings)
        const { data: companyDeps, error: companyError } = await supabase
          .from("phase_dependencies")
          .select("*")
          .eq("company_id", activeCompanyRole.companyId);

        if (companyError) {
          // Error fetching company dependencies
        }

        // 2. Fetch product-specific dependency overrides for all products
        const productIds = companyData.map(p => p.id);
        const { data: productDeps, error: productError } = await supabase
          .from("product_phase_dependencies")
          .select("*")
          .in("product_id", productIds);

        if (productError) {
          // Error fetching product dependencies
        }

        setCompanyDependencies(companyDeps || []);
        setProductDependencies(productDeps || []);
      } catch (error) {
        dependenciesFetchedRef.current = null;
        setCompanyDependencies([]);
        setProductDependencies([]);
      }
    };

    fetchAllDependencies();
  }, [activeCompanyRole?.companyId, companyData]);

  // Gantt API initialization
  const handleGanttReady = useCallback((api: any) => {
    ganttApiRef.current = api;
    setApiReady(true);
  }, []);

  useEffect(() => {
    if (!apiReady || !ganttApiRef.current) return;

    const api = ganttApiRef.current;

    // Subscribe to expansion events
    const unsubscribeOpenTask = api.on("open-task", (ev: any) => {
      if (ev && ev.id) {
        const isExpanded = ev.mode === true;
        setTaskExpansionState((prev) => ({
          ...prev,
          [ev.id.toString()]: isExpanded,
        }));
      }
    });

    return () => {
      if (unsubscribeOpenTask) unsubscribeOpenTask();
    };
  }, [apiReady]);

  // Transform data for Gantt chart - wx-react-gantt expects GanttTask objects
  const ganttTasks = useMemo((): GanttTask[] => {
    try {
      if (!companyData || companyData.length === 0) return [];

    const tasks: GanttTask[] = [];
    const today = new Date();
    const defaultStart = today;
    const defaultEnd = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Calculate company-level start and end dates based on product durations
    let companyStart = defaultStart;
    let companyEnd = defaultEnd;

    if (companyData.length > 0) {
      // Calculate actual product durations (based on phases if available)
      const productDurations = companyData.map((product) => {
        let productStart = product.inserted_at
          ? new Date(product.inserted_at)
          : defaultStart;
        let productEnd = product.projected_launch_date
          ? new Date(product.projected_launch_date)
          : defaultEnd;

        // If product has phases, calculate duration from phase spans (exclude "No Phase")
        const phases = (product.phases || []).filter(
          (phase) => phase?.name?.toLowerCase() !== 'no phase'
        );
        if (phases.length > 0) {
          const phaseStartDates = phases
            .map((phase) => phase.start_date ? new Date(phase.start_date) : null)
            .filter(Boolean) as Date[];
          const phaseEndDates = phases
            .map((phase) => phase.end_date ? new Date(phase.end_date) : null)
            .filter(Boolean) as Date[];

          if (phaseStartDates.length > 0) {
            productStart = new Date(Math.min(...phaseStartDates.map(d => d.getTime())));
          }
          if (phaseEndDates.length > 0) {
            productEnd = new Date(Math.max(...phaseEndDates.map(d => d.getTime())));
          }
        }

        return { start: productStart, end: productEnd };
      });

      const allStartDates = productDurations.map(p => p.start);
      const allEndDates = productDurations.map(p => p.end);

      if (allStartDates.length > 0) {
        companyStart = new Date(
          Math.min(...allStartDates.map((d) => d.getTime()))
        );
      }
      if (allEndDates.length > 0) {
        companyEnd = new Date(Math.max(...allEndDates.map((d) => d.getTime())));
      }
    }

    // Company root summary
    tasks.push({
      id: "company",
      text: companyName,
      start: companyStart,
      end: companyEnd,
      type: "summary",
      open: true,
    });

    companyData.forEach((product) => {
      // Skip if product is null/undefined or has no ID
      if (!product || !product.id) return;

      // Calculate product duration based on actual phase durations
      let productStart = product.inserted_at
        ? new Date(product.inserted_at)
        : defaultStart;
      let productEnd = product.projected_launch_date
        ? new Date(product.projected_launch_date)
        : defaultEnd;

      // If product has phases, calculate duration from phase spans (exclude "No Phase")
      const productPhases = (product.phases || []).filter(
        (phase) => phase?.name?.toLowerCase() !== 'no phase'
      );
      if (productPhases.length > 0) {
        const phaseStartDates = productPhases
          .map((phase) => phase.start_date ? new Date(phase.start_date) : null)
          .filter(Boolean) as Date[];
        const phaseEndDates = productPhases
          .map((phase) => phase.end_date ? new Date(phase.end_date) : null)
          .filter(Boolean) as Date[];

        if (phaseStartDates.length > 0) {
          productStart = new Date(Math.min(...phaseStartDates.map(d => d.getTime())));
        }
        if (phaseEndDates.length > 0) {
          productEnd = new Date(Math.max(...phaseEndDates.map(d => d.getTime())));
        }
      }

      // Product level summary
      tasks.push({
        id: `product-${product.id}`,
        text: product.name,
        start: productStart,
        end: productEnd,
        type: "summary",
        parent: "company",
        open: taskExpansionState[`product-${product.id}`] === true,
      });

      // Phase level tasks — filter out "No Phase" placeholder phases
      const visiblePhases = productPhases.filter(
        (phase) => phase?.name?.toLowerCase() !== 'no phase'
      );
      if (visiblePhases.length > 0) {
        visiblePhases.forEach((phase) => {
          // Skip if phase is null/undefined
          if (!phase || !phase.id) return;

          const phaseStart = phase.start_date
            ? new Date(phase.start_date)
            : productStart;
          const phaseEnd = phase.end_date
            ? new Date(phase.end_date)
            : productEnd;
          // Use document counts instead of individual documents
          const documentCount = documentCounts[phase.phase_id || phase.id] || 0;
          const phaseName = phase.name || 'Unnamed Phase';

          tasks.push({
            id: `phase-${phase.id}`,
            text: `${phaseName} (📄${documentCount} 📊${(product.gapAnalysis || []).length} ⚡${(product.activities || []).filter((a) => a.phase_id === phase.id).length} 🔍${(product.audits || []).filter((a) => a.phase_id === phase.id).length})`,
            start: phaseStart,
            end: phaseEnd,
            type: "summary",
            parent: `product-${product.id}`,
            open: taskExpansionState[`phase-${phase.id}`] === true,
          });

          // Sub-tasks: Documents, Gap Analysis, Activities, Audits
          const subTasks = [
            {
              type: "document" as const,
              name: lang('milestones.subTasks.documents').replace('{{count}}', String(documentCount)),
              duration: 3,
              hasNested: false, // No nested documents - just show count
            },
            {
              type: "gap-analysis" as const,
              name: lang('milestones.subTasks.gapAnalysis'),
              duration: 5,
              hasNested: false,
            },
            {
              type: "activities" as const,
              name: lang('milestones.subTasks.activities'),
              duration: 4,
              hasNested: false,
            },
            {
              type: "audit" as const,
              name: lang('milestones.subTasks.audit'),
              duration: 4,
              hasNested: false,
            },
          ];

          let currentDate = new Date(phaseStart);

          subTasks.forEach((subTask) => {
            const subTaskEndDate = new Date(
              currentDate.getTime() + subTask.duration * 24 * 60 * 60 * 1000
            );
            if (subTaskEndDate > phaseEnd) {
              subTaskEndDate.setTime(phaseEnd.getTime());
            }

            if (subTask.type === "document" && subTask.hasNested) {
              // Create document container task - SIMPLIFIED (no nested documents)
              const documentContainerTask: GanttTask = {
                id: `documents-${phase.id}`,
                text: subTask.name,
                start: new Date(currentDate),
                end: subTaskEndDate,
                type: "summary",
                parent: `phase-${phase.id}`,
                open: taskExpansionState[`documents-${phase.id}`] === true,
              };

              tasks.push(documentContainerTask);
              // No individual document tasks - just show count
            } else {
              const subTaskItem: GanttTask = {
                id: `${subTask.type}-${phase.id}`,
                text: subTask.name,
                start: new Date(currentDate),
                end: subTaskEndDate,
                type: "summary",
                parent: `phase-${phase.id}`,
                open:
                  taskExpansionState[`${subTask.type}-${phase.id}`] === true,
              };

              tasks.push(subTaskItem);
            }

            currentDate = new Date(
              subTaskEndDate.getTime() + 24 * 60 * 60 * 1000
            );
          });
        });
      } else {
        // Placeholder task if no phases
        tasks.push({
          id: `${product.id}_placeholder`,
          text: lang('milestones.noPhaseDefined'),
          start: productStart,
          end: productEnd,
          parent: `product-${product.id}`,
          type: "task",
        });
      }
    });

    return tasks;
    } catch (error) {
      return [];
    }
  }, [companyData, companyName, documentCounts, taskExpansionState, lang]);

  // Generate task links for dependencies
  const generateTaskLinks = useMemo(() => {
    try {
      if (!companyData || companyData.length === 0) return [];

      const links: any[] = [];

    // Process each product separately
    companyData.forEach((product) => {
      const productPhases = product.phases || [];
      if (productPhases.length === 0) return;

      // Get product-specific dependencies for this product
      const productSpecificDeps = (productDependencies || []).filter(
        dep => dep.product_id === product.id
      );

      // Get company-level dependencies that match this product's phases
      const companyDepsForProduct = (companyDependencies || []).filter(dep => {
        // Check if both source and target phases exist in this product
        const sourceExists = productPhases.some(phase => phase.phase_id === dep.source_phase_id);
        const targetExists = productPhases.some(phase => phase.phase_id === dep.target_phase_id);
        return sourceExists && targetExists;
      });

      // PRIORITY 1: Use product-specific dependency overrides (highest priority)
      if (productSpecificDeps.length > 0) {
        const productLinks = mapProductDependenciesToPhases(
          productSpecificDeps,
          productPhases
        );
        links.push(...productLinks);
      } else {
        // PRIORITY 2: Use company-level dependencies only as fallback when no product dependencies
        if (companyDepsForProduct.length > 0) {
          const companyLinks = mapCompanyDependenciesToProduct(
            companyDepsForProduct,
            productPhases
          );
          links.push(...companyLinks);
        }
      }

      // PRIORITY 3: Fallback to sequential links only if no dependencies exist
      if (
        productSpecificDeps.length === 0 &&
        companyDepsForProduct.length === 0
      ) {
        // Fallback: Sequential finish-to-start (for products without defined dependencies)
        for (let i = 0; i < productPhases.length - 1; i++) {
          const currentPhase = productPhases[i];
          const nextPhase = productPhases[i + 1];

          links.push({
            id: `link-${currentPhase.id}-${nextPhase.id}`,
            source: `phase-${currentPhase.id}`,
            target: `phase-${nextPhase.id}`,
            type: "e2s",
          });
        }
      }
    });

      return links;
    } catch (error) {
      return [];
    }
  }, [companyData, productDependencies, companyDependencies]);

  useEffect(() => {
    setGanttLinks(generateTaskLinks);
  }, [generateTaskLinks]);

  // Zoom functionality
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
    setCurrentZoomLevel(1); // Months view
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (companyData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{lang('milestones.companyMilestones')}</CardTitle>
          <CardDescription>
            {lang('milestones.noProductsFound').replace('{{companyName}}', companyName)}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <style>{ganttAnimationStyles}</style>
      <Card>
        <CardHeader className="flex flex-row justify-between">
          <div>
            <CardTitle>
              <div className="flex flex-row items-center">
                {lang('milestones.companyMilestonesWithName').replace('{{companyName}}', companyName)}
                {documentsLoading && (
                  <div className="flex flex-row items-center ml-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground ml-1">
                      {lang('milestones.loading')}
                    </span>
                  </div>
                )}
              </div>
            </CardTitle>
            <CardDescription>
              {lang('milestones.subtitle')}
            </CardDescription>
          </div>
          <div className="w-52 flex items-center justify-end gap-2">
            <span className="text-sm font-medium">{lang('milestones.zoom.label')}</span>
            <span className="text-sm text-muted-foreground ml-2 min-w-fit">
              {translatedZoomLevelNames[zoomLevels[currentZoomLevel]?.name as keyof typeof translatedZoomLevelNames] || zoomLevels[currentZoomLevel]?.name}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={currentZoomLevel === 0}
                title={lang('milestones.zoom.zoomOut')}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetZoom}
                title={lang('milestones.zoom.resetZoom')}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={currentZoomLevel === zoomLevels.length - 1}
                title={lang('milestones.zoom.zoomIn')}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            <Badge className="min-w-fit bg-blue-500 hover:bg-blue-600 text-sm text-white font-semibold ml-2">{lang('milestones.readOnly')}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="w-full h-[600px] border rounded-md overflow-hidden"
            style={{ minHeight: "500px", maxHeight: "800px" }}
          >
            <div className="hide-progress hide-links hide-drag h-full overflow-hidden">
              <Willow>
                <Gantt
                  api={(api: any) => handleGanttReady(api)}
                  zoom={zoomConfig}
                  tasks={ganttTasks}
                  links={ganttLinks}
                  readonly={true}
                />
              </Willow>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
