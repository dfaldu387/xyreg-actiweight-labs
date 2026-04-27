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
import { Gantt, Willow, Tooltip } from "@/components/gantt-chart/src";
import MyTooltipContent from "@/components/gantt-chart/MyTooltipContent";
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
import { toast } from "sonner";
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
import { taskTypes as baseTaskTypes } from "@/components/gantt-chart/config/ganttChartConfig";
import { detectCircularDependency, getLinkTypeText } from "@/utils/ganttLinkUtils";

const taskTypes = [...baseTaskTypes, { id: "device", label: "Device" }];
import { GanttTask } from "@/types/ganttChart";
import {
  GanttPhaseDocumentService,
  IndividualDocument,
} from "@/services/ganttPhaseDocumentService";
import { Badge } from "../ui/badge";
import { DocumentDraftDrawer } from "@/components/product/documents/DocumentDraftDrawer";

// Add CSS for smooth Gantt chart animations
const ganttAnimationStyles = `
  .wx-gantt .wx-task-bar.wx-summary {
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }

  .wx-gantt .wx-task-bar:hover {
    filter: brightness(1.1);
  }

  .wx-gantt .wx-task-bar.wx-task {
    cursor: grab;
  }
  .wx-gantt .wx-task-bar.wx-task:active {
    cursor: grabbing;
  }

  /* Hide dependency link dots and resize handles on device bars only */
  .wx-gantt .wx-bar.wx-task.device .wx-link,
  .wx-gantt .wx-bar.wx-summary .wx-link {
    display: none !important;
    pointer-events: none !important;
  }
  .wx-gantt .wx-bar.wx-task.device {
    cursor: pointer !important;
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

// Parse date string as UTC midnight (Gantt displays in UTC, so avoid timezone offset)
const parseLocalDate = (val: string | Date): Date => {
  if (val instanceof Date) return val;
  // "2026-04-03" (10 chars, no T) → treat as UTC midnight
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return new Date(val + 'T00:00:00Z');
  }
  return new Date(val);
};

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
  source_table?: 'phase_assigned_document_template' | 'document_studio_templates';
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
  // Refs to track dragged dates — prevents useMemo recompute snap-back
  const draggedDocDatesRef = useRef<Record<string, { start_date: string; due_date: string }>>({});
  const draggedAuditDatesRef = useRef<Record<string, { start_date: string; end_date: string }>>({});
  const draggedActivityDatesRef = useRef<Record<string, { start_date: string; end_date: string }>>({});
  const [enterpriseLinks, setEnterpriseLinks] = useState<any[]>([]);
  const enterpriseLinksRef = useRef<any[]>([]);

  // Enterprise document draft drawer state
  const [draftDrawerDocument, setDraftDrawerDocument] = useState<EnterpriseDocument | null>(null);
  // Ref to always access latest enterpriseDocuments in Gantt event handlers (avoids stale closure)
  const enterpriseDocumentsRef = useRef<EnterpriseDocument[]>([]);

  // Refresh enterprise documents from DB (called after edit dialog save)
  const refreshEnterpriseDocuments = useCallback(async (editedDocId?: string) => {
    if (!activeCompanyRole?.companyId) return;
    
    const { data: enterpriseDocsData } = await supabase
      .from('phase_assigned_document_template')
      .select('id, name, status, phase_id, start_date, date, due_date, deadline, document_type')
      .eq('company_id', activeCompanyRole.companyId)
      .eq('document_scope', 'company_document')
      .order('created_at', { ascending: false });

    const { data: studioDocsData } = await supabase
      .from('document_studio_templates')
      .select('id, name, created_at, updated_at, metadata, type, template_id')
      .eq('company_id', activeCompanyRole.companyId)
      .is('product_id', null)
      .order('created_at', { ascending: false });

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
        source_table: 'phase_assigned_document_template' as const,
      }))),
      ...extraStudioDocs.map(doc => ({ ...doc, source_table: 'document_studio_templates' as const })),
    ];

    setEnterpriseDocuments(allEnterpriseDocs);
    enterpriseDocumentsRef.current = allEnterpriseDocs;

    // Update only the edited doc via Gantt API (SVAR Gantt doesn't react to React state)
    const api = ganttApiRef.current;
    if (api && editedDocId) {
      const editedDoc = allEnterpriseDocs.find(d => d.id === editedDocId);
      if (editedDoc) {
        const today = new Date();
        const docStart = editedDoc.start_date ? parseLocalDate(editedDoc.start_date)
          : editedDoc.date ? parseLocalDate(editedDoc.date) : today;
        const docEnd = editedDoc.due_date ? parseLocalDate(editedDoc.due_date)
          : editedDoc.deadline ? parseLocalDate(editedDoc.deadline)
          : new Date(docStart.getTime() + 30 * 86400000);

        const taskId = `ent-doc-${editedDocId}`;
        try {
          if (api.getTask(taskId)) {
            api.exec('update-task', { id: taskId, task: { start: docStart, end: docEnd } });
          }
        } catch (err) {
          console.warn('[Enterprise Gantt] Failed to update Gantt bar for:', editedDoc.name, err);
        }
      }
    }
  }, [activeCompanyRole?.companyId]);

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
            source_table: 'phase_assigned_document_template' as const,
          }))),
          ...extraStudioDocs.map(doc => ({ ...doc, source_table: 'document_studio_templates' as const })),
        ];

        setEnterpriseDocuments(allEnterpriseDocs);
        enterpriseDocumentsRef.current = allEnterpriseDocs;

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

        // Fetch enterprise-level activities (company-level — no product_id, or product-level)
        const productIds = (productsData || []).map((p: any) => p.id);
        const { data: activitiesData } = await supabase
          .from('activities')
          .select('id, name, status, start_date, end_date, product_id, company_id')
          .eq('company_id', activeCompanyRole.companyId)
          .order('start_date', { ascending: true });

        setEnterpriseActivities((activitiesData || []).map((a: any) => ({
          id: a.id,
          name: a.name || 'Untitled Activity',
          status: a.status || 'not_started',
          start_date: a.start_date || null,
          end_date: a.end_date || null,
        })));

        // Fetch enterprise task dependency links
        const { data: entLinksData } = await supabase
          .from('enterprise_task_dependencies')
          .select('id, source_task_id, target_task_id, type, task_type')
          .eq('company_id', activeCompanyRole.companyId);

        const links = (entLinksData || []).map((l: any) => ({
          id: l.id,
          source: l.source_task_id,
          target: l.target_task_id,
          type: l.type || 'e2s',
        }));
        setEnterpriseLinks(links);
        enterpriseLinksRef.current = links;
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
      if (ev && ev.id) {
        const taskId = ev.id.toString();

        // Device click → navigate to device Gantt
        if (taskId.startsWith('product-')) {
          const productId = taskId.replace('product-', '');
          navigate(`/app/product/${productId}/milestones?tab=gantt`);
        }

        // Document click → open draft drawer (use ref to get latest data)
        if (taskId.startsWith('ent-doc-')) {
          const docId = taskId.replace('ent-doc-', '');
          const doc = enterpriseDocumentsRef.current.find(d => d.id === docId);
          if (doc) {
            setDraftDrawerDocument(doc);
          } else {
            console.warn('[Enterprise Gantt] Document not found in state for id:', docId);
          }
        }

      }
    });

    // --- Enterprise dependency recalculation (DFS, same pattern as GanttChart.tsx) ---
    const DAY_MS = 24 * 60 * 60 * 1000;

    const recalcEnterpriseDependenciesInternal = async (
      sourceTaskId: string,
      ganttApi: any,
      visited: Set<string>,
    ) => {
      if (!ganttApi) return;
      if (visited.has(sourceTaskId)) {
        console.warn('[Enterprise Gantt] Circular dependency during recalc:', Array.from(visited).concat(sourceTaskId).join(' → '));
        return;
      }

      const updatedVisited = new Set(visited);
      updatedVisited.add(sourceTaskId);

      const currentLinks = enterpriseLinksRef.current;
      const outgoingLinks = currentLinks.filter((l: any) => String(l.source) === sourceTaskId);
      if (outgoingLinks.length === 0) return;

      const sourceTask = ganttApi.getTask(sourceTaskId);
      if (!sourceTask) return;

      const sourceStart = sourceTask.start ? new Date(sourceTask.start) : null;
      const sourceEnd = sourceTask.end ? new Date(sourceTask.end) : null;
      if (!sourceStart || !sourceEnd) return;

      for (const link of outgoingLinks) {
        const targetId = String(link.target);
        const targetTask = ganttApi.getTask(targetId);
        if (!targetTask) continue;

        const targetStart = targetTask.start ? new Date(targetTask.start) : null;
        const targetEnd = targetTask.end ? new Date(targetTask.end) : null;
        if (!targetStart || !targetEnd) continue;

        const durationDays = Math.max(1, Math.ceil((targetEnd.getTime() - targetStart.getTime()) / DAY_MS));

        let newTargetStart = targetStart;
        let newTargetEnd = targetEnd;
        let needsUpdate = false;

        switch (link.type) {
          case 'e2s':
            if (targetStart.getTime() !== sourceEnd.getTime()) {
              newTargetStart = new Date(sourceEnd);
              newTargetEnd = new Date(newTargetStart.getTime() + durationDays * DAY_MS);
              needsUpdate = true;
            }
            break;
          case 's2s':
            if (targetStart.getTime() !== sourceStart.getTime()) {
              newTargetStart = new Date(sourceStart);
              newTargetEnd = new Date(newTargetStart.getTime() + durationDays * DAY_MS);
              needsUpdate = true;
            }
            break;
          case 'e2e':
            if (targetEnd.getTime() !== sourceEnd.getTime()) {
              newTargetEnd = new Date(sourceEnd);
              newTargetStart = new Date(newTargetEnd.getTime() - durationDays * DAY_MS);
              needsUpdate = true;
            }
            break;
          case 's2e':
            if (targetEnd.getTime() !== sourceStart.getTime()) {
              newTargetEnd = new Date(sourceStart);
              newTargetStart = new Date(newTargetEnd.getTime() - durationDays * DAY_MS);
              needsUpdate = true;
            }
            break;
        }

        if (!needsUpdate) continue;

        try {
          const updatedDuration = Math.max(1, Math.ceil((newTargetEnd.getTime() - newTargetStart.getTime()) / DAY_MS));

          // Update bar in Gantt (fires on-update-task which saves to DB)
          ganttApi.exec('update-task', {
            id: targetId,
            task: { ...targetTask, start: newTargetStart, end: newTargetEnd, duration: updatedDuration },
          });
    
          // Update dragged dates ref + recalculate parent summary
          const dbStart = newTargetStart.toISOString().split('T')[0];
          const dbEnd = newTargetEnd.toISOString().split('T')[0];

          if (targetId.startsWith('ent-doc-')) {
            const id = targetId.replace('ent-doc-', '');
            draggedDocDatesRef.current[id] = { start_date: dbStart, due_date: dbEnd };
            recalcParentSummary('enterprise-docs', 'ent-doc-', enterpriseDocuments, draggedDocDatesRef.current, id, newTargetStart, newTargetEnd, { start: 'start_date', end: 'due_date' });
          } else if (targetId.startsWith('ent-audit-')) {
            const id = targetId.replace('ent-audit-', '');
            draggedAuditDatesRef.current[id] = { start_date: dbStart, end_date: dbEnd };
            recalcParentSummary('enterprise-audits', 'ent-audit-', enterpriseAudits, draggedAuditDatesRef.current, id, newTargetStart, newTargetEnd, { start: 'start_date', end: 'end_date' });
          } else if (targetId.startsWith('ent-activity-')) {
            const id = targetId.replace('ent-activity-', '');
            draggedActivityDatesRef.current[id] = { start_date: dbStart, end_date: dbEnd };
            recalcParentSummary('enterprise-activities', 'ent-activity-', enterpriseActivities, draggedActivityDatesRef.current, id, newTargetStart, newTargetEnd, { start: 'start_date', end: 'end_date' });
          }

          // Recursively follow the chain
          await recalcEnterpriseDependenciesInternal(targetId, ganttApi, updatedVisited);
        } catch (err) {
          console.error('[Enterprise Gantt] Error recalculating:', targetId, err);
        }
      }
    };

    const recalcEnterpriseDependencies = async (sourceTaskId: string, ganttApi: any) => {
      await recalcEnterpriseDependenciesInternal(sourceTaskId, ganttApi, new Set());
    };

    // --- Enterprise dependency link support ---
    // Helper: get task type prefix
    const getTaskTypePrefix = (taskId: string): string | null => {
      if (taskId.startsWith('ent-doc-')) return 'document';
      if (taskId.startsWith('ent-audit-')) return 'audit';
      if (taskId.startsWith('ent-activity-')) return 'activity';
      return null;
    };

    // Add link — only same-type connections, with circular dependency check
    const unsubscribeAddLink = api.intercept("add-link", async (ev: any) => {
      const source = String(ev.link?.source || '');
      const target = String(ev.link?.target || '');
      const linkType = ev.link?.type || 'e2s';

      const sourceType = getTaskTypePrefix(source);
      const targetType = getTaskTypePrefix(target);

      // Block if either end is not a doc/audit/activity
      if (!sourceType || !targetType) {
        toast.info('Dependencies can only be created between documents, audits, or activities');
        return false;
      }

      // Block cross-type links
      if (sourceType !== targetType) {
        toast.info(`Cannot link ${sourceType} to ${targetType}. Only same-type connections allowed.`);
        return false;
      }

      // Self-reference check
      if (source === target) {
        toast.info('Cannot create dependency to itself');
        return false;
      }

      // Circular dependency check
      const wouldCreateCycle = detectCircularDependency(source, target, enterpriseLinksRef.current);
      if (wouldCreateCycle) {
        const sourceName = api.getTask(source)?.text || source;
        const targetName = api.getTask(target)?.text || target;
        toast.info(`Circular dependency detected: ${sourceName} ↔ ${targetName}`);
        return false;
      }

      // Save to DB
      const companyId = activeCompanyRole?.companyId;
      if (!companyId) return false;

      try {
        const { data, error } = await supabase.from('enterprise_task_dependencies').insert({
          company_id: companyId,
          source_task_id: source,
          target_task_id: target,
          type: linkType,
          task_type: sourceType,
        }).select('id').single();

        if (error) {
          if (error.code === '23505') {
            toast.info('This dependency already exists');
          } else {
            toast.error('Failed to create dependency');
            console.error('[Enterprise Gantt] Link create error:', error);
          }
          return false;
        }

        // Update local state
        const newLink = { id: data.id, source, target, type: linkType };
        setEnterpriseLinks(prev => [...prev, newLink]);
        enterpriseLinksRef.current = [...enterpriseLinksRef.current, newLink];

        const sourceName = api.getTask(source)?.text || source;
        const targetName = api.getTask(target)?.text || target;
        const linkTypeLabel = getLinkTypeText(linkType);
        toast.success(`Dependency: ${sourceName} → ${targetName} (${linkTypeLabel})`);

        // Auto-recalculate dependencies (same DFS pattern as GanttChart.tsx)
        try {
          await recalcEnterpriseDependencies(source, api);
        } catch (err) {
          console.error('[Enterprise Gantt] Error during auto-recalculation:', err);
        }

        return true;
      } catch (err) {
        console.error('[Enterprise Gantt] Link create exception:', err);
        toast.error('Failed to create dependency');
        return false;
      }
    });

    // Delete link
    const unsubscribeDeleteLink = api.intercept("delete-link", async (ev: any) => {
      const linkId = String(ev?.id || '');
      if (!linkId) return false;

      // Only allow deleting enterprise links
      const link = enterpriseLinksRef.current.find(l => String(l.id) === linkId);
      if (!link) return false;

      try {
        const { error } = await supabase.from('enterprise_task_dependencies')
          .delete().eq('id', linkId);

        if (error) {
          toast.error('Failed to delete dependency');
          return false;
        }

        setEnterpriseLinks(prev => prev.filter(l => String(l.id) !== linkId));
        enterpriseLinksRef.current = enterpriseLinksRef.current.filter(l => String(l.id) !== linkId);
        toast.success('Dependency removed');
        return true;
      } catch {
        toast.error('Failed to delete dependency');
        return false;
      }
    });

    // --- Document drag/resize support ---
    // Debounce map for saving document date changes
    const updateTimers = new Map<string, NodeJS.Timeout>();

    const isChildTask = (taskId: string) =>
      taskId.startsWith('ent-doc-') || taskId.startsWith('ent-audit-') || taskId.startsWith('ent-activity-');

    const isSummaryParent = (taskId: string) =>
      taskId === 'company' || taskId === 'enterprise-docs' || taskId === 'enterprise-audits' || taskId === 'enterprise-activities';

    // Block drag — only child items (doc/audit/activity bars), NOT summary parents or devices
    const unsubscribeDragTask = api.intercept("drag-task", (ev: any) => {
      const id = ev?.id?.toString() || '';
      const allowed = isChildTask(id);
      if (!allowed && id) console.log('[Enterprise Gantt] BLOCKED drag on:', id);
      return allowed;
    });

    // Block update — allow child items + summary parents (for programmatic auto-extend)
    const unsubscribeInterceptUpdate = api.intercept("update-task", (ev: any) => {
      const taskId = ev?.id?.toString() || '';
      return isChildTask(taskId) || isSummaryParent(taskId);
    });

    // Helper: recalculate parent summary bar from children min/max
    const recalcParentSummary = (parentId: string, childPrefix: string, items: any[], datesRef: Record<string, any>, currentId: string, currentStart: Date, currentEnd: Date, dateFields: { start: string; end: string }) => {
      try {
        const parentTask = api.getTask(parentId);
        if (!parentTask) return;

        let minStart = currentStart;
        let maxEnd = currentEnd;

        for (const item of items) {
          let dStart: Date, dEnd: Date;
          if (item.id === currentId) {
            dStart = currentStart;
            dEnd = currentEnd;
          } else if (datesRef[item.id]) {
            dStart = new Date(datesRef[item.id][dateFields.start]);
            dEnd = new Date(datesRef[item.id][dateFields.end]);
          } else {
            const taskInGantt = api.getTask(`${childPrefix}${item.id}`);
            if (taskInGantt) {
              dStart = taskInGantt.start instanceof Date ? taskInGantt.start : new Date(taskInGantt.start);
              dEnd = taskInGantt.end instanceof Date ? taskInGantt.end : new Date(taskInGantt.end);
            } else continue;
          }
          if (dStart < minStart) minStart = dStart;
          if (dEnd > maxEnd) maxEnd = dEnd;
        }

        const pStart = parentTask.start instanceof Date ? parentTask.start : new Date(parentTask.start);
        const pEnd = parentTask.end instanceof Date ? parentTask.end : new Date(parentTask.end);
        const needsExtend = minStart.getTime() !== pStart.getTime() || maxEnd.getTime() !== pEnd.getTime();
        console.log('[Enterprise Gantt] recalcParentSummary | parent:', parentId, '| needsExtend:', needsExtend,
          '| parent start:', pStart.toISOString(), '→', minStart.toISOString(),
          '| parent end:', pEnd.toISOString(), '→', maxEnd.toISOString());
        if (needsExtend) {
          api.exec('update-task', { id: parentId, task: { start: minStart, end: maxEnd } });
          console.log('[Enterprise Gantt] Parent extended:', parentId);
        }
      } catch (err) {
        console.warn('[Enterprise Gantt] Failed to recalculate parent:', parentId, err);
      }
    };

    // Recalc company bar when any section summary changes (same pattern as recalcParentSummary for docs)
    const recalcCompanyBar = () => {
      try {
        const sectionIds = ['enterprise-docs', 'enterprise-audits', 'enterprise-activities', 'devices-container'];
        let minStart: Date | null = null;
        let maxEnd: Date | null = null;
        for (const sid of sectionIds) {
          const section = api.getTask(sid);
          if (!section) continue;
          const s = section.start instanceof Date ? section.start : new Date(section.start);
          const e = section.end instanceof Date ? section.end : new Date(section.end);
          if (!minStart || s < minStart) minStart = s;
          if (!maxEnd || e > maxEnd) maxEnd = e;
        }
        if (!minStart || !maxEnd) return;
        const companyTask = api.getTask('company');
        if (!companyTask) return;
        const cs = companyTask.start instanceof Date ? companyTask.start : new Date(companyTask.start);
        const ce = companyTask.end instanceof Date ? companyTask.end : new Date(companyTask.end);
        if (minStart.getTime() !== cs.getTime() || maxEnd.getTime() !== ce.getTime()) {
          api.exec('update-task', { id: 'company', task: { start: minStart, end: maxEnd } });
        }
      } catch (err) {
        console.warn('[Enterprise Gantt] recalcCompanyBar error:', err);
      }
    };

    // Save dates after drag/resize (on runs AFTER update — ev.task has NEW dates)
    const unsubscribeOnUpdate = api.on("update-task", (ev: any) => {
      const taskId = ev?.id?.toString() || '';
      const newStart = ev.task?.start;
      const newEnd = ev.task?.end;
      if (!newStart || !newEnd) return;

      // When a section summary bar changes, update the company bar
      if (['enterprise-docs', 'enterprise-audits', 'enterprise-activities', 'devices-container'].includes(taskId)) {
        recalcCompanyBar();
        return;
      }

      const startDate = newStart instanceof Date ? new Date(newStart.getTime()) : new Date(newStart);
      const endDate = newEnd instanceof Date ? new Date(newEnd.getTime()) : new Date(newEnd);
      const dbStartStr = startDate.toISOString().split('T')[0];
      const dbEndStr = endDate.toISOString().split('T')[0];

      // === DOCUMENTS ===
      if (taskId.startsWith('ent-doc-')) {
        const docId = taskId.replace('ent-doc-', '');
        draggedDocDatesRef.current[docId] = { start_date: dbStartStr, due_date: dbEndStr };

        // Recalculate parent summary
        recalcParentSummary('enterprise-docs', 'ent-doc-', enterpriseDocuments, draggedDocDatesRef.current, docId, startDate, endDate, { start: 'start_date', end: 'due_date' });

        // Auto-recalculate dependent tasks
        recalcEnterpriseDependencies(taskId, api).catch(err =>
          console.error('[Enterprise Gantt] Dependency recalc error:', err));

        toast.loading('Saving document dates...', { id: `save-${docId}` });
        if (updateTimers.has(docId)) clearTimeout(updateTimers.get(docId)!);

        const timerId = setTimeout(async () => {
          try {
            const { GanttPhaseDocumentService } = await import('@/services/ganttPhaseDocumentService');
            const result = await GanttPhaseDocumentService.updateDocumentDates(docId, endDate, startDate);
            if (result.success) {
              toast.success('Document dates updated', { id: `save-${docId}` });
            } else {
              toast.error(`Failed: ${result.error}`, { id: `save-${docId}` });
            }
          } catch {
            const { error: err1 } = await supabase.from('phase_assigned_document_template')
              .update({ start_date: dbStartStr, due_date: dbEndStr }).eq('id', docId);
            if (err1) {
              // document_studio_templates has no date columns; nothing to do as fallback
              console.warn('Could not persist dates for', docId);
            }
            toast.success('Document dates updated', { id: `save-${docId}` });
          } finally { updateTimers.delete(docId); }
        }, 1000);
        updateTimers.set(docId, timerId);
      }

      // === AUDITS ===
      if (taskId.startsWith('ent-audit-')) {
        const auditId = taskId.replace('ent-audit-', '');
        draggedAuditDatesRef.current[auditId] = { start_date: dbStartStr, end_date: dbEndStr };

        // Recalculate parent summary
        recalcParentSummary('enterprise-audits', 'ent-audit-', enterpriseAudits, draggedAuditDatesRef.current, auditId, startDate, endDate, { start: 'start_date', end: 'end_date' });

        // Auto-recalculate dependent tasks
        recalcEnterpriseDependencies(taskId, api).catch(err =>
          console.error('[Enterprise Gantt] Dependency recalc error:', err));

        toast.loading('Saving audit dates...', { id: `save-${auditId}` });
        if (updateTimers.has(auditId)) clearTimeout(updateTimers.get(auditId)!);

        const timerId = setTimeout(async () => {
          try {
            const { error } = await supabase.from('company_audits')
              .update({ start_date: dbStartStr, end_date: dbEndStr })
              .eq('id', auditId);
            if (error) {
              toast.error('Failed to save audit dates', { id: `save-${auditId}` });
            } else {
              toast.success('Audit dates updated', { id: `save-${auditId}` });
            }
          } catch {
            toast.error('Failed to save audit dates', { id: `save-${auditId}` });
          } finally { updateTimers.delete(auditId); }
        }, 1000);
        updateTimers.set(auditId, timerId);
      }

      // === ACTIVITIES ===
      if (taskId.startsWith('ent-activity-')) {
        const activityId = taskId.replace('ent-activity-', '');
        draggedActivityDatesRef.current[activityId] = { start_date: dbStartStr, end_date: dbEndStr };

        // Recalculate parent summary
        recalcParentSummary('enterprise-activities', 'ent-activity-', enterpriseActivities, draggedActivityDatesRef.current, activityId, startDate, endDate, { start: 'start_date', end: 'end_date' });

        // Auto-recalculate dependent tasks
        recalcEnterpriseDependencies(taskId, api).catch(err =>
          console.error('[Enterprise Gantt] Dependency recalc error:', err));

        toast.loading('Saving activity dates...', { id: `save-${activityId}` });
        if (updateTimers.has(activityId)) clearTimeout(updateTimers.get(activityId)!);

        const timerId = setTimeout(async () => {
          try {
            const { error } = await supabase.from('activities')
              .update({ start_date: dbStartStr, end_date: dbEndStr })
              .eq('id', activityId);
            if (error) {
              toast.error('Failed to save activity dates', { id: `save-${activityId}` });
            } else {
              toast.success('Activity dates updated', { id: `save-${activityId}` });
            }
          } catch {
            toast.error('Failed to save activity dates', { id: `save-${activityId}` });
          } finally { updateTimers.delete(activityId); }
        }, 1000);
        updateTimers.set(activityId, timerId);
      }
    });

    // Block inline editor and task deletion
    const unsubscribeShowEditor = api.intercept("show-editor", () => false);
    const unsubscribeDeleteTask = api.intercept("delete-task", () => false);

    return () => {
      if (unsubscribeOpenTask) unsubscribeOpenTask();
      if (unsubscribeSelectTask) unsubscribeSelectTask();
      if (unsubscribeDeleteLink) unsubscribeDeleteLink();
      if (unsubscribeAddLink) unsubscribeAddLink();
      if (unsubscribeDragTask) unsubscribeDragTask();
      if (unsubscribeInterceptUpdate) unsubscribeInterceptUpdate();
      if (unsubscribeOnUpdate) unsubscribeOnUpdate();
      if (unsubscribeShowEditor) unsubscribeShowEditor();
      if (unsubscribeDeleteTask) unsubscribeDeleteTask();
      // Clear pending timers
      updateTimers.forEach(t => clearTimeout(t));
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
      // Check if this doc was dragged — use dragged dates (ref, no re-render)
      const dragged = draggedDocDatesRef.current[doc.id];
      const startSrc = dragged?.start_date || doc.start_date;
      const dueSrc = dragged?.due_date || doc.due_date;

      const docStart = startSrc ? parseLocalDate(startSrc)
        : doc.date ? parseLocalDate(doc.date)
        : fallbackStart;
      const docEnd = dueSrc ? parseLocalDate(dueSrc)
        : doc.deadline ? parseLocalDate(doc.deadline)
        : doc.date ? new Date(parseLocalDate(doc.date).getTime() + 30 * 24 * 60 * 60 * 1000)
        : new Date(docStart.getTime() + 30 * 24 * 60 * 60 * 1000);
      return { docStart, docEnd };
    };

    // === 1. DOCUMENTS ===
    let entStart = companyStart;
    let entEnd = companyEnd;
    if (enterpriseDocuments.length > 0) {
      const allEntDates = enterpriseDocuments.map(d => {
        const { docStart, docEnd } = getEntDocDates(d, companyStart);
        return { start: docStart, end: docEnd };
      });
      entStart = new Date(Math.min(...allEntDates.map(d => d.start.getTime())));
      entEnd = new Date(Math.max(...allEntDates.map(d => d.end.getTime())));

      tasks.push({
        id: 'enterprise-docs',
        text: `Documents (${enterpriseDocuments.length})`,
        start: entStart,
        end: entEnd,
        type: 'summary',
        parent: 'company',
        open: taskExpansionState['enterprise-docs'] === true,
      });

      [...enterpriseDocuments].sort((a, b) => a.name.localeCompare(b.name)).forEach(doc => {
        const { docStart, docEnd } = getEntDocDates(doc, entStart);
        tasks.push({
          id: `ent-doc-${doc.id}`,
          text: doc.name,
          start: docStart,
          end: docEnd,
          type: 'task',
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

      [...enterpriseAudits].sort((a, b) => a.audit_name.localeCompare(b.audit_name)).forEach(audit => {
        const dragged = draggedAuditDatesRef.current[audit.id];
        const aStart = dragged ? new Date(dragged.start_date)
          : audit.start_date ? new Date(audit.start_date) : auditsStart;
        const aEnd = dragged ? new Date(dragged.end_date)
          : audit.end_date ? new Date(audit.end_date)
          : audit.deadline_date ? new Date(audit.deadline_date)
          : new Date(aStart.getTime() + 30 * 24 * 60 * 60 * 1000);
        tasks.push({
          id: `ent-audit-${audit.id}`,
          text: audit.audit_name,
          start: aStart,
          end: aEnd,
          type: 'task',
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

      [...enterpriseActivities].sort((a, b) => a.name.localeCompare(b.name)).forEach(activity => {
        const dragged = draggedActivityDatesRef.current[activity.id];
        const aStart = dragged ? new Date(dragged.start_date)
          : activity.start_date ? new Date(activity.start_date) : activitiesStart;
        const aEnd = dragged ? new Date(dragged.end_date)
          : activity.end_date ? new Date(activity.end_date)
          : new Date(aStart.getTime() + 30 * 24 * 60 * 60 * 1000);
        tasks.push({
          id: `ent-activity-${activity.id}`,
          text: activity.name,
          start: aStart,
          end: aEnd,
          type: 'task',
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

    [...companyData].sort((a, b) => (a.name || '').localeCompare(b.name || '')).forEach((product) => {
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

      // Product level — non-expandable, non-draggable device bar
      tasks.push({
        id: `product-${product.id}`,
        text: product.name,
        start: productStart,
        end: productEnd,
        type: "summary",
        parent: "devices-container",
      });

      // No phase/sub-task children at enterprise level — click device to navigate to device Gantt
    });

    // Company root summary — compute from all section ranges
    const allRangeStarts = [companyStart, entStart];
    const allRangeEnds = [companyEnd, entEnd];
    if (enterpriseAudits.length > 0) {
      const asDates = enterpriseAudits.map(a => a.start_date ? new Date(a.start_date) : companyStart);
      const aeDates = enterpriseAudits.map(a => a.end_date ? new Date(a.end_date) : a.deadline_date ? new Date(a.deadline_date) : companyEnd);
      allRangeStarts.push(new Date(Math.min(...asDates.map(d => d.getTime()))));
      allRangeEnds.push(new Date(Math.max(...aeDates.map(d => d.getTime()))));
    }
    if (enterpriseActivities.length > 0) {
      const asDates = enterpriseActivities.map(a => a.start_date ? new Date(a.start_date) : companyStart);
      const aeDates = enterpriseActivities.map(a => a.end_date ? new Date(a.end_date) : companyEnd);
      allRangeStarts.push(new Date(Math.min(...asDates.map(d => d.getTime()))));
      allRangeEnds.push(new Date(Math.max(...aeDates.map(d => d.getTime()))));
    }
    const finalStart = new Date(Math.min(...allRangeStarts.map(d => d.getTime())));
    const finalEnd = new Date(Math.max(...allRangeEnds.map(d => d.getTime())));

    tasks.unshift({
      id: "company",
      text: companyName,
      start: finalStart,
      end: finalEnd,
      type: "summary",
      open: true,
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
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="w-full border rounded-md overflow-hidden"
            style={{ maxHeight: "800px" }}
          >
            <div className="hide-progress h-full overflow-hidden">
              <Willow>
                <Tooltip api={ganttApiRef.current} content={MyTooltipContent}>
                  <Gantt
                    init={(api: any) => handleGanttReady(api)}
                    zoom={zoomConfig}
                    tasks={ganttTasks}
                    links={[...ganttLinks, ...enterpriseLinks]}
                    taskTypes={taskTypes}
                    markers={ganttMarkers}
                    columns={[
                      { id: "text", header: lang('gantt.taskName'), width: 200 },
                      { id: "start", header: lang('gantt.startDate'), width: 100 },
                      { id: "end", header: "End Date", width: 100 },
                      { id: "duration", header: lang('gantt.duration'), width: 80, align: "center" as const },
                    ]}
                    readonly={false}
                  />
                </Tooltip>
              </Willow>
            </div>
          </div>
        </CardContent>
      </Card>

      <DocumentDraftDrawer
        open={!!draftDrawerDocument}
        onOpenChange={(open) => {
          if (!open) {
            // Clear cached drag dates so fresh DB values are used
            if (draftDrawerDocument) {
              delete draggedDocDatesRef.current[draftDrawerDocument.id];
              refreshEnterpriseDocuments(draftDrawerDocument.id);
            }
            setDraftDrawerDocument(null);
          }
        }}
        documentId={draftDrawerDocument?.id || ''}
        documentName={draftDrawerDocument?.name || ''}
        documentType={draftDrawerDocument?.document_type || ''}
        companyId={activeCompanyRole?.companyId || ''}
        onDocumentSaved={() => {
          if (draftDrawerDocument) {
            delete draggedDocDatesRef.current[draftDrawerDocument.id];
            refreshEnterpriseDocuments(draftDrawerDocument.id);
          }
          setDraftDrawerDocument(null);
        }}
        disableSopMentions
      />
    </div>
  );
}
