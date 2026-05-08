/**
 * Unified rich-framework gap-analysis content schema.
 *
 * Any framework (MDR Annex I, IEC 62304, GDPR, …) can be expressed as a flat
 * list of `RichFrameworkClause` rows persisted in `gap_template_items`. The
 * generic renderer (`GenericGapLaunchView`) and applicability engine
 * (`src/utils/applicabilityEngine.ts`) consume this shape — no per-framework
 * code required.
 *
 * This replaces the per-framework patterns of:
 *   - bespoke TS data files (e.g. comprehensiveMdrAnnexI.ts)
 *   - bespoke services (e.g. mdrAnnexIService.ts)
 *   - bespoke context-rule modules (e.g. annexIContextRules.ts)
 */

export type ClauseCategory = "documentation" | "verification" | "compliance";
export type ClausePriority = "low" | "medium" | "high";
export type OwnerLevel = "primary" | "secondary" | "none";

export interface OwnerMatrix {
  qaRa?: OwnerLevel;
  rd?: OwnerLevel;
  mfgOps?: OwnerLevel;
  labeling?: OwnerLevel;
  clinical?: OwnerLevel;
  other?: OwnerLevel;
}

/**
 * Declarative applicability rule. Persisted as JSONB in
 * `gap_template_items.applicability_rule` and interpreted by
 * `applicabilityEngine.evaluate()`.
 *
 * Semantics:
 *   - `requires`        — list of context fields that must be answered (truthy or explicitly false) for the rule to fire
 *   - `naIf`            — clause becomes suggested-N/A when ALL listed key/value pairs match
 *   - `appliesIf`       — clause is in scope when ALL listed key/value pairs match
 *   - `reason`          — human-readable explanation surfaced in the UI
 *   - `contextDeepLink` — where to send the user to fill the missing context
 */
export interface ApplicabilityRule {
  requires?: string[];
  naIf?: Record<string, unknown>;
  appliesIf?: Record<string, unknown>;
  reason?: string;
  contextDeepLink?: {
    tab: string;
    subtab?: string;
    anchor?: string;
    label: string;
  };
}

/** A regulatory-attribute badge displayed at the top of a launch view. */
export interface RegulatoryDnaAttribute {
  id: string;
  label: string;
  description: string;
  icon?: string;
  details?: {
    type?: string;
    implications?: string;
    requirements?: string[];
    standards?: string[];
  };
}

export interface RichFrameworkClause {
  /** DB row id (uuid). */
  id: string;
  /** Optional parent clause id for nested chapter → clause → sub-clause. */
  parentId?: string | null;
  chapter: string;
  section: string;
  subsection?: string | null;
  clauseRef: string;
  summary: string;
  requirement: string;
  evidenceMethod?: string | null;
  auditGuidance?: string | null;
  keyStandards?: string[];
  excludesIf?: string | null;
  applicability?: ApplicabilityRule | null;
  owners?: OwnerMatrix;
  priority: ClausePriority;
  category: ClauseCategory;
  sortOrder: number;
}

/**
 * Hydrate a rich clause from a raw `gap_template_items` row.
 * Tolerant of missing fields so legacy rows still load.
 */
export function hydrateRichClause(row: any): RichFrameworkClause {
  return {
    id: row.id,
    parentId: row.parent_item_id ?? null,
    chapter: row.chapter ?? "",
    section: row.section ?? row.subsection ?? "",
    subsection: row.subsection ?? null,
    clauseRef: row.clause_reference ?? row.clause_number ?? row.item_number ?? "",
    summary: row.requirement_summary ?? row.clause_description ?? "",
    requirement: row.requirement_text ?? "",
    evidenceMethod: row.evidence_method ?? null,
    auditGuidance: row.audit_guidance ?? null,
    keyStandards: Array.isArray(row.key_standards)
      ? row.key_standards
      : typeof row.key_standards === "string" && row.key_standards
        ? row.key_standards.split(/\s*,\s*/)
        : [],
    excludesIf: row.excludes_if ?? null,
    applicability: (row.applicability_rule as ApplicabilityRule | null) ?? null,
    owners: {
      qaRa: row.qa_ra_owner ?? undefined,
      rd: row.rd_owner ?? undefined,
      mfgOps: row.mfg_ops_owner ?? undefined,
      labeling: row.labeling_owner ?? undefined,
      clinical: row.clinical_owner ?? undefined,
      other: row.other_owner ?? undefined,
    },
    priority: (row.priority as ClausePriority) ?? "medium",
    category: (row.category as ClauseCategory) ?? "compliance",
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
  };
}

/** Group a flat list by `chapter`, preserving sort order. */
export function groupByChapter(
  clauses: RichFrameworkClause[]
): Array<{ chapter: string; clauses: RichFrameworkClause[] }> {
  const order: string[] = [];
  const map = new Map<string, RichFrameworkClause[]>();
  for (const c of [...clauses].sort((a, b) => a.sortOrder - b.sortOrder)) {
    if (!map.has(c.chapter)) {
      map.set(c.chapter, []);
      order.push(c.chapter);
    }
    map.get(c.chapter)!.push(c);
  }
  return order.map((chapter) => ({ chapter, clauses: map.get(chapter)! }));
}