import apiClient from "@/lib/apiClient";
import { supabase } from "@/integrations/supabase/client";
import { GanttTask, GanttLink } from "@/types/ganttChart";
import { ProductType, detectProductType } from "@/utils/productTypeDetection";
import { calculateDocumentStartDate, calculateDocumentEndDate } from "@/utils/ganttUtils";

/**
 * Interface for Gantt chart task as returned from API
 * Dates are expected to be ISO strings that will be converted to Date objects
 */
export interface GanttTaskApiResponse {
  id: number | string;
  text: string;
  start: string | Date; // ISO date string
  end: string | Date; // ISO date string
  duration?: number;
  progress?: number;
  type: "task" | "summary" | "milestone" | "overdue";
  parent?: number | string;
  lazy?: boolean;
  open?: boolean;
}

/**
 * Interface for Gantt chart link as returned from API
 */
export interface GanttLinkApiResponse {
  id: number | string;
  source: number | string;
  target: number | string;
  type: "e2s" | "s2s" | "e2e" | "s2e";
}

/**
 * Interface for Gantt chart API response
 */
export interface GanttChartApiResponse {
  tasks: GanttTaskApiResponse[];
  links?: GanttLinkApiResponse[];
}

/**
 * Transformed response with Date objects
 */
export interface GanttChartData {
  tasks: GanttTask[];
  links: GanttLink[];
}

/**
 * Converts date string to Date object
 */
function parseDate(date: string | Date): Date {
  if (date instanceof Date) {
    return date;
  }
  return new Date(date);
}

/**
 * Fetches gantt chart data for a specific product
 * @param productId - The product ID to fetch gantt chart data for
 * @returns Promise with transformed gantt chart data (dates as Date objects)
 * @throws Error if the API request fails
 */
export async function getGanttChartData(
  productId: string
): Promise<GanttChartData> {
  try {
    const response = await apiClient.get<GanttChartApiResponse>(
      `/product/gantt-chart/${productId}`
    );

    const { tasks = [], links = [] } = response.data;

    // Transform tasks: convert date strings to Date objects and preserve open state
    const transformedTasks: GanttTask[] = tasks.map((task) => ({
      ...task,
      start: parseDate(task.start),
      end: parseDate(task.end),
      open: task.open ?? false, // Default to false if not specified
    }));

    // Transform links: ensure proper types
    const transformedLinks: GanttLink[] = links.map((link) => ({
      id: String(link.id),
      source: String(link.source),
      target: String(link.target),
      type: link.type,
    }));

    return {
      tasks: transformedTasks,
      links: transformedLinks,
    };
  } catch (error: any) {
    console.error("Error fetching gantt chart data:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch gantt chart data"
    );
  }
}

/**
 * Interface for API phase data
 */
export interface ApiPhase {
  id: string;
  phase_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  documents?: Array<{
    id: string;
    name: string;
    phase_id: string;
    start_date: string | null;
    due_date: string | null;
  }>;
  gap_analysis_items?: Array<{
    id: string;
    requirement?: string;
    title?: string;
    milestone_due_date?: string | null;
    due_date?: string | null;
    status?: string;
    phase_id?: string;
    phase_time?: string[] | null;
  }>;
}

/**
 * Interface for API category data
 */
export interface ApiCategory {
  category_id: string;
  category_name: string;
  phases: ApiPhase[];
}

/**
 * Interface for the new API response structure
 */
export interface GanttChartStructuredApiResponse {
  success: boolean;
  count: number;
  product_id: string;
  data: ApiCategory[];
}

/**
 * Helper function to get a random user ID (1-5)
 * Returns undefined sometimes to show unassigned state
 */
function getRandomAssignee(): number | undefined {
  const userIds = [1, 2, 3, 4, 5];
  // 80% chance of being assigned, 20% chance of unassigned
  if (Math.random() < 0.2) {
    return undefined;
  }
  return userIds[Math.floor(Math.random() * userIds.length)];
}

/**
 * Helper function to find category ID by name with fuzzy matching
 */
function findCategoryIdByName(
  categoryName: string,
  categoryMap: Record<string, string>
): string | null {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");

  const target = normalize(categoryName);

  // Aliases we accept for key categories
  const aliases: Record<string, string[]> = {
    "design control steps": [
      "design control steps",
      "design & risk controls",
      "design controls",
    ],
    "supply chain & quality assurance": [
      "supply chain & quality assurance",
      "supply chain and quality assurance",
      "supply chain quality assurance",
      "supplier management",
      "supply chain",
    ],
    "post-market & lifecycle management": [
      "post-market & lifecycle management",
      "post markets & lifecycle management",
      "post markets and lifecycle management",
      "post-market and lifecycle management",
      "post market & lifecycle management",
      "post markets",
      "post-market",
    ],
  };

  // Expand the requested category name to its alias set if known
  const acceptableTargets = new Set<string>([target]);
  for (const [canonical, list] of Object.entries(aliases)) {
    if (list.some((a) => normalize(a) === target) || normalize(canonical) === target) {
      list.forEach((a) => acceptableTargets.add(normalize(a)));
      acceptableTargets.add(normalize(canonical));
      break;
    }
  }

  // Keyword fallback matchers for robustness
  const isSupplyChainLike = (n: string) =>
    n.includes("supply") && (n.includes("quality") || n.includes("supplier"));
  const isPostMarketLifecycleLike = (n: string) =>
    n.includes("post") && n.includes("lifecycle");

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
    if (
      target.includes("supply chain & quality assurance") &&
      isSupplyChainLike(normalizedName)
    ) {
      return categoryId;
    }
    if (
      target.includes("post market") &&
      target.includes("lifecycle") &&
      isPostMarketLifecycleLike(normalizedName)
    ) {
      return categoryId;
    }
  }
  return null;
}

/**
 * Get default expansion state based on product type and category map
 */
function getDefaultExpansionState(
  type: ProductType | null,
  categoryMap: Record<string, string>
): Record<string, boolean> {
  const defaults: Record<string, boolean> = {};

  if (!type || Object.keys(categoryMap).length === 0) {
    return defaults;
  }

  const designControlId = findCategoryIdByName("Design Control Steps", categoryMap);
  const supplyChainId = findCategoryIdByName(
    "Supply Chain & Quality Assurance",
    categoryMap
  );
  const pmsId = findCategoryIdByName(
    "Post-Market & Lifecycle Management",
    categoryMap
  );

  if (type === "legacy_product") {
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
}

/**
 * Fetches gantt chart data with hierarchical structure (categories and phases)
 * @param productId - The product ID to fetch gantt chart data for
 * @param product - Optional product object for determining product type and expansion state
 * @returns Promise with transformed gantt chart data (dates as Date objects)
 * @throws Error if the API request fails
 */
export async function getGanttChartStructuredData(
  productId: string,
  product?: any
): Promise<GanttChartData> {
  try {
    const response = await apiClient.get<GanttChartStructuredApiResponse>(
      `/product/gantt-chart/${productId}`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error("Invalid API response structure");
    }

    const tasks: GanttTask[] = [];
    const links: GanttLink[] = [];

    // Build category map from API response
    const categoryMap: Record<string, string> = {};
    response.data.data.forEach((category) => {
      categoryMap[category.category_id] = category.category_name;
    });

    // Note: "Uncategorized" categories are handled below by skipping the parent task row

    // Detect product type if product is provided
    let productType: ProductType | null = null;
    if (product) {
      // Prefer explicit project type if provided on the product
      const hasLegacyProjectType =
        Array.isArray(product.project_types) &&
        product.project_types.some(
          (t: string) => (t || "").toLowerCase() === "legacy product"
        );

      if (hasLegacyProjectType) {
        productType = "legacy_product";
      } else {
        productType = detectProductType(product);
      }
    }

    // Get default expansion state based on product type
    const defaultExpansionState = getDefaultExpansionState(productType, categoryMap);

    const getGapPhaseTimeDates = (
      phaseIdentifier: string | number | undefined,
      phaseTime?: string[] | null
    ): { start?: Date; end?: Date } => {
      if (!phaseIdentifier || !phaseTime || !Array.isArray(phaseTime)) {
        return {};
      }

      // Normalize phase ID by stripping 'phase-' or 'phase_' prefix to match save logic
      let phaseIdStr = String(phaseIdentifier);
      if (phaseIdStr.startsWith("phase-") || phaseIdStr.startsWith("phase_")) {
        phaseIdStr = phaseIdStr.slice("phase-".length);
      }

      const entry = phaseTime.find((value) => {
        if (typeof value !== "string") return false;
        return value.startsWith(`${phaseIdStr}||`);
      });

      if (!entry) {
        return {};
      }

      const [, startValue = "", endValue = ""] = entry.split("||");
      return {
        start: startValue ? new Date(startValue) : undefined,
        end: endValue ? new Date(endValue) : undefined,
      };
    };

    // Transform categories and phases into Gantt tasks
    response.data.data.forEach((category) => {
      const categoryTaskId = `category-${category.category_id}`;
      const isUncategorized = category.category_name === 'Uncategorized' || category.category_id === 'uncategorized';
      
      if (!isUncategorized) {
        // Calculate category date range from phases
        let categoryStartDate: Date | null = null;
        let categoryEndDate: Date | null = null;
        
        category.phases.forEach((phase) => {
          if (phase.start_date && phase.end_date) {
            const startDate = parseDate(phase.start_date);
            const endDate = parseDate(phase.end_date);
            
            if (!categoryStartDate || startDate < categoryStartDate) {
              categoryStartDate = startDate;
            }
            if (!categoryEndDate || endDate > categoryEndDate) {
              categoryEndDate = endDate;
            }
          }
        });

        // Use fallback dates if no phase dates found
        if (!categoryStartDate || !categoryEndDate) {
          categoryStartDate = new Date();
          categoryEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }

        // Determine open state from default expansion state, defaulting to false
        const categoryOpenState =
          defaultExpansionState[categoryTaskId] ?? false;

        tasks.push({
          id: categoryTaskId,
          text: category.category_name,
          start: categoryStartDate,
          end: categoryEndDate,
          type: "category",
          open: categoryOpenState,
        });
      }

      // Create phase tasks (as children of category, or top-level if uncategorized)
      category.phases.forEach((phase) => {
        const phaseStartDate = phase.start_date
          ? parseDate(phase.start_date)
          : new Date();
        const phaseEndDate = phase.end_date
          ? parseDate(phase.end_date)
          : new Date(phaseStartDate.getTime() + 14 * 24 * 60 * 60 * 1000);

        const phaseTaskId = `phase-${phase.id}`;

        // Check if phase has status-based type from backend
        const statusTypes = ['not-started', 'running', 'overdue', 'on-time'];
        const phaseType = (phase as any).status && statusTypes.includes((phase as any).status)
          ? (phase as any).status
          : "summary";

        tasks.push({
          id: phaseTaskId,
          text: phase.name,
          start: phaseStartDate,
          end: phaseEndDate,
          type: phaseType,
          ...(isUncategorized ? {} : { parent: categoryTaskId }),
          open: false,
          companyPhaseId: phase.phase_id,
        });

        // Process documents for this phase
        const documentCount = phase.documents?.length || 0;
        if (documentCount > 0) {
          // Create document container task
          const documentsContainerTask: GanttTask = {
            id: `documents-${phase.id}`,
            text: `Documents (${documentCount})`,
            start: phaseStartDate, // Use phase start
            end: phaseEndDate, // Use phase end (will be adjusted by children)
            type: "summary",
            parent: phaseTaskId,
            open: false, // Default closed for performance
            lazy: true, // Enable lazy loading for performance optimization
            isDocumentContainer: true,
            phaseId: phase.id,
            subTaskType: "document",
            companyPhaseId: phase.phase_id,
          };
          tasks.push(documentsContainerTask);

          // Sort documents by created_at (ascending) if available
          const sortedDocuments = [...phase.documents].sort((a, b) => {
            const aCreated = (a as any).created_at;
            const bCreated = (b as any).created_at;
            if (!aCreated && !bCreated) return 0;
            if (!aCreated) return 1;
            if (!bCreated) return -1;
            return new Date(aCreated).getTime() - new Date(bCreated).getTime();
          });

          // Create individual document tasks
          sortedDocuments.forEach((doc) => {
            // Calculate document start date (clamped to phase boundaries)
            const docStartDate = calculateDocumentStartDate(
              doc.start_date || undefined,
              phaseStartDate,
              phaseStartDate,
              phaseEndDate
            );

            // Calculate document end date - pass phaseStartDate for proper boundary checking
            let docEndDate = calculateDocumentEndDate(
              doc.due_date || undefined,
              phaseStartDate, // Use phaseStartDate for boundary check, not docStartDate
              phaseEndDate,
              3 // fallback duration in days
            );

            // Safeguard: ensure end date is never before start date
            if (docEndDate < docStartDate) {
              // Set end date to start + 3 days (default duration)
              docEndDate = new Date(docStartDate.getTime() + 3 * 24 * 60 * 60 * 1000);
            }

            // Calculate actual duration from dates (minimum 1 day)
            const calculatedDuration = Math.max(
              1,
              Math.ceil((docEndDate.getTime() - docStartDate.getTime()) / (1000 * 60 * 60 * 24))
            );

            tasks.push({
              id: `doc-${doc.id}`,
              text: doc.name,
              start: docStartDate,
              end: docEndDate,
              type: "task",
              parent: `documents-${phase.id}`,
              documentId: doc.id,
              phaseId: phase.id,
              subTaskType: "document",
              dueDate: doc.due_date || undefined,
              assigned: getRandomAssignee(),
              duration: calculatedDuration,
              companyPhaseId: phase.phase_id,
            });
          });
        }

        // Process gap analysis items for this phase
        const gapAnalysisCount = phase.gap_analysis_items?.length || 0;
        if (gapAnalysisCount > 0) {
          // Create gap analysis container task
          const gapAnalysisContainerTask: GanttTask = {
            id: `gap-analysis-${phase.id}`,
            text: `Gap Analysis (${gapAnalysisCount})`,
            start: phaseStartDate, // Use phase start
            end: phaseEndDate, // Use phase end (will be adjusted by children)
            type: "summary",
            parent: phaseTaskId,
            open: false, // Default closed for performance
            lazy: true, // Enable lazy loading for performance optimization
            phaseId: phase.id,
            subTaskType: "gap-analysis",
            companyPhaseId: phase.phase_id,
          };
          tasks.push(gapAnalysisContainerTask);

          // Create individual gap analysis item tasks
          phase.gap_analysis_items.forEach((item) => {
            const phaseTimeIdentifier =
              phase.phase_id ||
              item.phase_id ||
              phase.id;

            const phaseTimeDates = getGapPhaseTimeDates(
              phaseTimeIdentifier,
              item.phase_time
            );

            // IMPORTANT: For gap analysis, ONLY use phase_time dates
            // Never fallback to milestone_due_date or start_date as these are not Gantt-specific
            const itemStartDate = phaseTimeDates.start || phaseStartDate;
            let itemEndDate = phaseTimeDates.end || phaseEndDate;

            // Safeguard: ensure end date is never before start date
            if (itemEndDate < itemStartDate) {
              // Set end date to start + 3 days (default duration)
              itemEndDate = new Date(itemStartDate.getTime() + 3 * 24 * 60 * 60 * 1000);
            }


            // Use requirement or title as display name
            const itemName = item.requirement || item.title || `Gap Analysis Item ${item.id.substring(0, 8)}`;

            // Calculate duration ensuring it's always positive (minimum 1 day)
            const gapDuration = Math.max(
              1,
              Math.ceil((itemEndDate.getTime() - itemStartDate.getTime()) / (1000 * 60 * 60 * 24))
            );

            tasks.push({
              id: `gap-${item.id}`,
              text: itemName,
              start: itemStartDate,
              end: itemEndDate,
              type: "task",
              parent: `gap-analysis-${phase.id}`,
              phaseId: phase.id,
              subTaskType: "gap-analysis",
              // Note: dueDate removed - gap analysis dates come ONLY from phase_time
              duration: gapDuration,
              companyPhaseId: phaseTimeIdentifier ? String(phaseTimeIdentifier) : undefined,
            });
          });
        }
      });

      // Create sequential links between phases within the same category
      for (let i = 0; i < category.phases.length - 1; i++) {
        links.push({
          id: `link-${category.phases[i].id}-${category.phases[i + 1].id}`,
          source: `phase-${category.phases[i].id}`,
          target: `phase-${category.phases[i + 1].id}`,
          type: "e2s" as const, // End-to-Start dependency
        });
      }
    });

    return {
      tasks,
      links,
    };
  } catch (error: any) {
    console.error("Error fetching gantt chart structured data:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch gantt chart data"
    );
  }
}

// Creates a new link between tasks in the Gantt chart
export async function createGanttLink(
  productId: string,
  source: string | number,
  target: string | number,
  type: "e2s" | "s2s" | "e2e" | "s2e"
): Promise<GanttLink> {
  try {
    const response = await apiClient.post<GanttLinkApiResponse>(
      `/product/gantt-chart/${productId}/links`,
      {
        source: String(source),
        target: String(target),
        type: type,
      }
    );

    // Transform the API response to match GanttLink interface
    return {
      id: String(response.data.id),
      source: String(response.data.source),
      target: String(response.data.target),
      type: response.data.type,
    };
  } catch (error: any) {
    console.error("Error creating gantt link:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to create gantt link"
    );
  }
}

