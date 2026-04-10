import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { Gantt, Willow } from "@/components/gantt-chart/src";
import "@svar-ui/react-gantt/all.css";
import "@/components/gantt-chart/GanttChartCustom.css";
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
  calculateTaskTypeFromDates,
} from "@/utils/ganttUtils";
import { taskTypes } from "@/components/gantt-chart/config/ganttChartConfig";
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

  .hide-link-delete .wx-link-delete-icon {
    display: none !important;
    pointer-events: none !important;
  }

  .hide-link-delete .wx-line.wx-dkx3NwEn {
    cursor: default !important;
  }

  .hide-link-delete .wx-line.wx-dkx3NwEn.wx-selected {
    stroke: #2196F3 !important;
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

interface EnterpriseAudit {
  id: string;
  audit_name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  deadline_date: string | null;
}

interface EnterpriseActivity {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
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

interface EnterpriseDocument {
  id: string;
  name: string;
  status: string;
  phase_id: string | null;
  phase_name: string | null;
  start_date: string | null;
  date: string | null;
  due_date: string | null;
  deadline: string | null;
  document_type: string | null;
}

export function CompanyMilestonesOfficial({ companyName }: CompanyMilestonesProps) {
  const { activeCompanyRole } = useCompanyRole();
  const { lang } = useTranslation();
  const navigate = useNavigate();
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
  const [enterpriseDocuments, setEnterpriseDocuments] = useState<EnterpriseDocument[]>([]);
  const [enterpriseAudits, setEnterpriseAudits] = useState<EnterpriseAudit[]>([]);
  const [enterpriseActivities, setEnterpriseActivities] = useState<EnterpriseActivity[]>([]);
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

        // Fetch enterprise-level documents (SOPs, etc.) — same query as company documents page
        const { data: enterpriseDocsData } = await supabase
          .from('phase_assigned_document_template')
          .select('id, name, status, phase_id, start_date, date, due_date, deadline, document_type')
          .eq('company_id', activeCompanyRole.companyId)
          .eq('document_scope', 'company_document')
          .order('created_at', { ascending: false });

        // Also fetch from document_studio_templates (same as company documents page)
        const { data: studioDocsData } = await supabase
          .from('document_studio_templates')
          .select('id, name, created_at, updated_at, metadata, type, template_id')
          .eq('company_id', activeCompanyRole.companyId)
          .is('product_id', null)
          .order('created_at', { ascending: false });

        // Fetch phase names for grouping
        const phaseIds = [...new Set((enterpriseDocsData || []).map((d: any) => d.phase_id).filter(Boolean))];
        let phaseNameMap = new Map<string, string>();
        if (phaseIds.length > 0) {
          const { data: cpData } = await supabase
            .from('company_phases')
            .select('id, name')
            .in('id', phaseIds);
          if (cpData) cpData.forEach((p: any) => phaseNameMap.set(p.id, p.name));

          const missingIds = phaseIds.filter(id => !phaseNameMap.has(id));
          if (missingIds.length > 0) {
            const { data: pData } = await supabase
              .from('phases')
              .select('id, name')
              .in('id', missingIds);
            if (pData) pData.forEach((p: any) => phaseNameMap.set(p.id, p.name));
          }
        }

        // Merge: keep all phase_assigned docs, add studio docs that aren't drafts of existing CI docs
        const ciDocIds = new Set((enterpriseDocsData || []).map((d: any) => d.id));
        const studioDocIds = new Set((studioDocsData || []).map((d: any) => d.id));
        const extraStudioDocs = (studioDocsData || [])
          .filter((doc: any) => !ciDocIds.has(doc.template_id) && !studioDocIds.has(doc.template_id))
          .map((doc: any) => {
            const meta = (doc.metadata as any) || {};
            return {
              id: doc.id,
              name: doc.name || 'Untitled Document',
              status: meta.status || 'Draft',
              phase_id: meta.phase_id || null,
              phase_name: null as string | null,
              start_date: meta.start_date || null,
              date: meta.date || doc.created_at || null,
              due_date: meta.due_date || null,
              deadline: null as string | null,
              document_type: doc.type || null,
            };
          });

        const allEnterpriseDocs: EnterpriseDocument[] = [
          ...((enterpriseDocsData || []).map((doc: any) => ({
            id: doc.id,
            name: doc.name || 'Untitled Document',
            status: doc.status || 'Not Started',
            phase_id: doc.phase_id || null,
            phase_name: doc.phase_id ? (phaseNameMap.get(doc.phase_id) || null) : null,
            start_date: doc.start_date || null,
            date: doc.date || null,
            due_date: doc.due_date || null,
            deadline: doc.deadline || null,
            document_type: doc.document_type || null,
          }))),
          ...extraStudioDocs,
        ];

        setEnterpriseDocuments(allEnterpriseDocs);

        // Fetch enterprise-level audits
        const { data: auditsData } = await supabase
          .from('company_audits')
          .select('id, audit_name, status, start_date, end_date, deadline_date')
          .eq('company_id', activeCompanyRole.companyId)
          .order('start_date', { ascending: true });

        setEnterpriseAudits((auditsData || []).map((a: any) => ({
          id: a.id,
          audit_name: a.audit_name || 'Untitled Audit',
          status: a.status || 'planned',
          start_date: a.start_date || null,
          end_date: a.end_date || null,
          deadline_date: a.deadline_date || null,
        })));

        // Fetch enterprise-level activities (all activities for this company's products)
        const { data: activitiesData } = await supabase
          .from('activities')
          .select('id, name, status, start_date, end_date, product_id')
          .in('product_id', (productsData || []).map((p: any) => p.id))
          .order('start_date', { ascending: true });

        setEnterpriseActivities((activitiesData || []).map((a: any) => ({
          id: a.id,
          name: a.name || 'Untitled Activity',
          status: a.status || 'not_started',
          start_date: a.start_date || null,
          end_date: a.end_date || null,
        })));
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

    // Click on device row → navigate to device Gantt
    const unsubscribeSelectTask = api.on("select-task", (ev: any) => {
      console.log('[Enterprise Gantt] select-task event:', ev);
      if (ev && ev.id) {
        const taskId = ev.id.toString();
        console.log('[Enterprise Gantt] Task clicked:', taskId);
        if (taskId.startsWith('product-')) {
          const productId = taskId.replace('product-', '');
          console.log('[Enterprise Gantt] Navigating to device Gantt:', productId);
          navigate(`/app/product/${productId}/milestones?tab=gantt`);
        }
      }
    });

    // Prevent link deletion and addition in company milestones
    const unsubscribeDeleteLink = api.intercept("delete-link", () => false);
    const unsubscribeAddLink = api.intercept("add-link", () => false);

    return () => {
      if (unsubscribeOpenTask) unsubscribeOpenTask();
      if (unsubscribeSelectTask) unsubscribeSelectTask();
      if (unsubscribeDeleteLink) unsubscribeDeleteLink();
      if (unsubscribeAddLink) unsubscribeAddLink();
    };
  }, [apiReady, navigate]);

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

    // Helper: resolve best start/end dates for an enterprise document
    const getEntDocDates = (doc: EnterpriseDocument, fallbackStart: Date) => {
      const docStart = doc.start_date ? new Date(doc.start_date)
        : doc.date ? new Date(doc.date)
        : fallbackStart;
      const docEnd = doc.due_date ? new Date(doc.due_date)
        : doc.deadline ? new Date(doc.deadline)
        : doc.date ? new Date(new Date(doc.date).getTime() + 30 * 24 * 60 * 60 * 1000) // 1 week from date
        : new Date(docStart.getTime() + 30 * 24 * 60 * 60 * 1000);
      return { docStart, docEnd };
    };

    // Company root summary
    tasks.push({
      id: "company",
      text: companyName,
      start: companyStart,
      end: companyEnd,
      type: "summary",
      open: true,
    });

    // === 1. DOCUMENTS ===
    if (enterpriseDocuments.length > 0) {
      const allEntDates = enterpriseDocuments.map(d => {
        const { docStart, docEnd } = getEntDocDates(d, companyStart);
        return { start: docStart, end: docEnd };
      });
      const entStart = new Date(Math.min(...allEntDates.map(d => d.start.getTime())));
      const entEnd = new Date(Math.max(...allEntDates.map(d => d.end.getTime())));

      tasks.push({
        id: 'enterprise-docs',
        text: `Documents (${enterpriseDocuments.length})`,
        start: entStart,
        end: entEnd,
        type: 'summary',
        parent: 'company',
        open: taskExpansionState['enterprise-docs'] === true,
      });

      enterpriseDocuments.forEach(doc => {
        const { docStart, docEnd } = getEntDocDates(doc, entStart);
        tasks.push({
          id: `ent-doc-${doc.id}`,
          text: doc.name,
          start: docStart,
          end: docEnd,
          type: calculateTaskTypeFromDates(docStart, docEnd, doc.status === 'Completed' ? 'completed' : 'running'),
          parent: 'enterprise-docs',
        });
      });
    }

    // === 2. AUDITS ===
    if (enterpriseAudits.length > 0) {
      const auditDates = enterpriseAudits.map(a => {
        const aStart = a.start_date ? new Date(a.start_date) : companyStart;
        const aEnd = a.end_date ? new Date(a.end_date)
          : a.deadline_date ? new Date(a.deadline_date)
          : new Date(aStart.getTime() + 30 * 24 * 60 * 60 * 1000);
        return { start: aStart, end: aEnd };
      });
      const auditsStart = new Date(Math.min(...auditDates.map(d => d.start.getTime())));
      const auditsEnd = new Date(Math.max(...auditDates.map(d => d.end.getTime())));

      tasks.push({
        id: 'enterprise-audits',
        text: `Audits (${enterpriseAudits.length})`,
        start: auditsStart,
        end: auditsEnd,
        type: 'summary',
        parent: 'company',
        open: taskExpansionState['enterprise-audits'] === true,
      });

      enterpriseAudits.forEach(audit => {
        const aStart = audit.start_date ? new Date(audit.start_date) : auditsStart;
        const aEnd = audit.end_date ? new Date(audit.end_date)
          : audit.deadline_date ? new Date(audit.deadline_date)
          : new Date(aStart.getTime() + 30 * 24 * 60 * 60 * 1000);
        tasks.push({
          id: `ent-audit-${audit.id}`,
          text: audit.audit_name,
          start: aStart,
          end: aEnd,
          type: calculateTaskTypeFromDates(aStart, aEnd, audit.status === 'completed' ? 'completed' : 'running'),
          parent: 'enterprise-audits',
        });
      });
    }

    // === 3. ACTIVITIES ===
    if (enterpriseActivities.length > 0) {
      const actDates = enterpriseActivities.map(a => {
        const aStart = a.start_date ? new Date(a.start_date) : companyStart;
        const aEnd = a.end_date ? new Date(a.end_date)
          : new Date(aStart.getTime() + 30 * 24 * 60 * 60 * 1000);
        return { start: aStart, end: aEnd };
      });
      const activitiesStart = new Date(Math.min(...actDates.map(d => d.start.getTime())));
      const activitiesEnd = new Date(Math.max(...actDates.map(d => d.end.getTime())));

      tasks.push({
        id: 'enterprise-activities',
        text: `Activities (${enterpriseActivities.length})`,
        start: activitiesStart,
        end: activitiesEnd,
        type: 'summary',
        parent: 'company',
        open: taskExpansionState['enterprise-activities'] === true,
      });

      enterpriseActivities.forEach(activity => {
        const aStart = activity.start_date ? new Date(activity.start_date) : activitiesStart;
        const aEnd = activity.end_date ? new Date(activity.end_date)
          : new Date(aStart.getTime() + 30 * 24 * 60 * 60 * 1000);
        tasks.push({
          id: `ent-activity-${activity.id}`,
          text: activity.name,
          start: aStart,
          end: aEnd,
          type: calculateTaskTypeFromDates(aStart, aEnd, activity.status === 'completed' ? 'completed' : 'running'),
          parent: 'enterprise-activities',
        });
      });
    }

    // === 4. DEVICES (collapsed, no expand on individual devices) ===
    tasks.push({
      id: 'devices-container',
      text: `Devices (${companyData.length})`,
      start: companyStart,
      end: companyEnd,
      type: 'summary',
      parent: 'company',
      open: taskExpansionState['devices-container'] === true,
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

      // Product level — non-expandable task (click to navigate to device Gantt)
      tasks.push({
        id: `product-${product.id}`,
        text: product.name,
        start: productStart,
        end: productEnd,
        type: "task",
        parent: "devices-container",
      });

      // No phase/sub-task children at enterprise level — click device to navigate to device Gantt
    });
    return tasks;
    } catch (error) {
      return [];
    }
  }, [companyData, companyName, documentCounts, taskExpansionState, enterpriseDocuments, enterpriseAudits, enterpriseActivities, lang]);

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

  // Today marker for the Gantt chart
  const ganttMarkers = useMemo(() => [
    {
      start: new Date(),
      text: "Today",
      css: "wx-today-marker",
    },
  ], [lang]);

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
            className="w-full border rounded-md overflow-hidden"
            style={{ maxHeight: "800px" }}
          >
            <div className="hide-progress hide-links hide-drag hide-link-delete h-full overflow-hidden">
              <Willow>
                <Gantt
                  init={(api: any) => handleGanttReady(api)}
                  zoom={zoomConfig}
                  tasks={ganttTasks}
                  links={ganttLinks}
                  taskTypes={taskTypes}
                  markers={ganttMarkers}
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
