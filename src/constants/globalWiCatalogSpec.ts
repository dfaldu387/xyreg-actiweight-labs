/**
 * Curated global Work Instruction (WI) catalog spec — v2.
 *
 * Replaces the previous "fixed quota of 3 WIs per SOP" approach with an
 * explicit, deterministic list of WIs per Tier-A foundational SOP. Each
 * entry pins a stable `slug` so re-generation keeps numbering, plus a
 * `focus` (the task name fed to the AI) and the primary `roles`.
 *
 * - The seed edge function uses ONLY the focuses listed here (no AI-
 *   proposed list). That makes coverage auditable.
 * - WI numbers are assigned by position within each SOP entry (1-based),
 *   so reordering this file = renumbering. Do not reorder once shipped.
 * - SOPs not present in this map default to zero WIs (e.g. a Quality
 *   Manual is a manual, not a procedure — no WIs).
 *
 * Numbering format follows the SOP's functional sub-prefix:
 *   SOP-002 (QA) → WI-QA-001, WI-QA-002, ...
 *   SOP-007 → WI-CAPA related, sub-prefix QA → WI-QA-...
 *
 * NOTE: WI numbers across multiple SOPs that share the same sub-prefix
 * (e.g. all QA SOPs) DO collide intentionally on a per-SOP basis (each
 * SOP gets its own WI-QA-001). That's fine because the global catalog
 * keys WIs by `(sop_template_key, wi_number)`. Per-company materialization
 * later assigns globally-unique numbers within the company.
 */

export interface GlobalWiSpecEntry {
  /** Stable identifier within the SOP. Never reuse. */
  slug: string;
  /** Short task description fed to the AI as the WI focus. */
  focus: string;
  /** Expected primary roles. AI may add more. */
  roles: string[];
}

/**
 * Per-SOP curated WI lists. Keys are canonical SOP identifiers (SOP-NNN).
 * Order within each array determines the WI number suffix (1-based).
 */
export const GLOBAL_WI_CATALOG_SPEC: Readonly<Record<string, readonly GlobalWiSpecEntry[]>> = {
  // ── QA — Quality Assurance ───────────────────────────────────────────
  'SOP-001': [
    { slug: 'activate-qms',     focus: 'Activating the QMS for a new company workspace', roles: ['Quality Manager'] },
    { slug: 'annual-qms-review', focus: 'Annual review of the QMS scope and process map', roles: ['Quality Manager', 'Top Management'] },
  ],
  'SOP-002': [
    { slug: 'create-doc',       focus: 'Creating a new controlled document in Document Studio', roles: ['Document Author'] },
    { slug: 'review-approve',   focus: 'Reviewing and approving a controlled document via Mission Control', roles: ['Reviewer', 'Approver'] },
    { slug: 'revise-doc',       focus: 'Revising an existing controlled document and incrementing the version', roles: ['Document Author', 'Document Owner'] },
    { slug: 'obsolete-doc',     focus: 'Obsoleting or superseding a controlled document', roles: ['Document Owner', 'Quality Manager'] },
    { slug: 'periodic-review',  focus: 'Performing the scheduled periodic review of a controlled document', roles: ['Document Owner'] },
    { slug: 'external-doc',     focus: 'Registering and controlling an external document (standard, regulation)', roles: ['Document Owner', 'Regulatory Affairs'] },
  ],
  'SOP-003': [
    { slug: 'schedule-mr',      focus: 'Scheduling a Management Review and assembling the agenda', roles: ['Quality Manager'] },
    { slug: 'capture-minutes',  focus: 'Capturing Management Review minutes, decisions and action items', roles: ['Quality Manager', 'Top Management'] },
  ],
  'SOP-004': [
    { slug: 'add-training-req', focus: 'Adding a training requirement for a controlled document or role', roles: ['Quality Manager', 'Department Head'] },
    { slug: 'record-completion', focus: 'Recording training completion for an employee', roles: ['Trainer', 'Quality Manager'] },
    { slug: 'reassign-on-revision', focus: 'Reassigning training when a controlled document is revised', roles: ['Quality Manager'] },
    { slug: 'effectiveness-check', focus: 'Performing a training effectiveness check', roles: ['Trainer', 'Department Head'] },
  ],
  'SOP-021': [
    { slug: 'intake-complaint', focus: 'Recording the intake of a new customer complaint', roles: ['Customer Service', 'Quality Manager'] },
    { slug: 'triage-vigilance', focus: 'Triaging a complaint for vigilance reportability', roles: ['Quality Manager', 'Regulatory Affairs'] },
    { slug: 'investigate',      focus: 'Investigating a complaint and recording findings', roles: ['Quality Manager', 'Engineer'] },
    { slug: 'close-complaint',  focus: 'Closing a complaint after corrective action', roles: ['Quality Manager'] },
  ],
  'SOP-022': [
    { slug: 'configure-pms',    focus: 'Configuring the Post-Market Surveillance plan and data sources', roles: ['Quality Manager', 'PMS Lead'] },
    { slug: 'log-pms-signal',   focus: 'Logging a PMS signal and routing it for analysis', roles: ['PMS Lead'] },
    { slug: 'generate-psur',    focus: 'Generating the periodic PMS report (PMSR / PSUR draft)', roles: ['PMS Lead', 'Regulatory Affairs'] },
  ],
  'SOP-023': [
    { slug: 'register-asset',   focus: 'Registering a new infrastructure asset (facility, utility, IT system)', roles: ['Facilities', 'Quality Manager'] },
    { slug: 'schedule-inspection', focus: 'Scheduling and recording an infrastructure inspection', roles: ['Facilities'] },
  ],
  'SOP-024': [
    { slug: 'register-equipment', focus: 'Registering a new piece of production or laboratory equipment', roles: ['Facilities', 'Production'] },
    { slug: 'log-maintenance',  focus: 'Logging a maintenance or calibration event for equipment', roles: ['Facilities'] },
    { slug: 'flag-out-of-service', focus: 'Flagging equipment as out of service after a failed calibration', roles: ['Facilities', 'Quality Manager'] },
  ],
  'SOP-025': [
    { slug: 'register-mme',     focus: 'Registering a monitoring and measurement instrument', roles: ['Quality Manager', 'Facilities'] },
    { slug: 'log-calibration',  focus: 'Logging a calibration result against an instrument', roles: ['Calibration Technician'] },
  ],
  'SOP-028': [
    { slug: 'open-capa',        focus: 'Opening a new CAPA from a complaint, audit finding, or NC', roles: ['Quality Manager'] },
    { slug: 'investigate-capa', focus: 'Performing the CAPA investigation and capturing evidence', roles: ['CAPA Owner'] },
    { slug: 'root-cause',       focus: 'Documenting the root-cause analysis for a CAPA', roles: ['CAPA Owner', 'Engineer'] },
    { slug: 'action-plan',      focus: 'Defining and assigning the CAPA corrective/preventive action plan', roles: ['CAPA Owner', 'Quality Manager'] },
    { slug: 'effectiveness-check', focus: 'Performing the CAPA effectiveness check', roles: ['Quality Manager'] },
    { slug: 'close-capa',       focus: 'Closing a CAPA after effectiveness verification', roles: ['Quality Manager'] },
    { slug: 'escalate-fsca',    focus: 'Escalating a CAPA to a Field Safety Corrective Action', roles: ['Quality Manager', 'Regulatory Affairs'] },
  ],
  'SOP-031': [
    { slug: 'create-baseline',  focus: 'Creating a configuration baseline for a design or product version', roles: ['Configuration Manager', 'Engineer'] },
    { slug: 'release-baseline', focus: 'Releasing and locking a configuration baseline after sign-off', roles: ['Configuration Manager'] },
  ],
  'SOP-032': [
    { slug: 'log-nc',           focus: 'Logging a nonconforming product or material', roles: ['Inspector', 'Quality Manager'] },
    { slug: 'disposition-nc',   focus: 'Dispositioning a nonconforming item (rework, scrap, use-as-is)', roles: ['Quality Manager', 'Engineer'] },
    { slug: 'close-nc',         focus: 'Closing a nonconformity after disposition is executed', roles: ['Quality Manager'] },
  ],
  'SOP-033': [
    { slug: 'define-storage',   focus: 'Defining storage and handling requirements for a product family', roles: ['Production', 'Quality Manager'] },
    { slug: 'log-deviation',    focus: 'Logging a storage or handling deviation', roles: ['Production'] },
  ],
  'SOP-042': [
    { slug: 'configure-trend',  focus: 'Configuring a trend analysis on PMS or complaint data', roles: ['PMS Lead', 'Quality Manager'] },
    { slug: 'review-signal',    focus: 'Reviewing a detected signal and deciding on action', roles: ['Quality Manager'] },
  ],
  'SOP-050': [
    { slug: 'plan-audit',       focus: 'Planning an internal audit and preparing the audit checklist', roles: ['Internal Auditor', 'Quality Manager'] },
    { slug: 'conduct-audit',    focus: 'Conducting an internal audit and recording observations', roles: ['Internal Auditor'] },
    { slug: 'report-findings',  focus: 'Reporting audit findings and assigning corrective actions', roles: ['Internal Auditor', 'Quality Manager'] },
    { slug: 'follow-up',        focus: 'Following up on audit findings until closure', roles: ['Quality Manager'] },
  ],

  // ── DE — Design / Engineering ────────────────────────────────────────
  'SOP-005': [
    { slug: 'create-dp',        focus: 'Creating a new Design & Development Plan for a project', roles: ['Project Manager', 'Engineer'] },
    { slug: 'update-dp-phase',  focus: 'Updating the Design Plan when a phase gate is reached', roles: ['Project Manager'] },
  ],
  'SOP-006': [
    { slug: 'capture-input',    focus: 'Capturing a new design input requirement', roles: ['Systems Engineer'] },
    { slug: 'trace-input',      focus: 'Linking a design input to a user need or regulatory requirement', roles: ['Systems Engineer'] },
    { slug: 'review-inputs',    focus: 'Performing the design input review at the planning gate', roles: ['Systems Engineer', 'Project Manager'] },
  ],
  'SOP-007': [
    { slug: 'capture-output',   focus: 'Capturing a new design output (specification, drawing, code)', roles: ['Engineer'] },
    { slug: 'link-output-input', focus: 'Linking a design output to its parent design input', roles: ['Engineer', 'Systems Engineer'] },
    { slug: 'release-output',   focus: 'Releasing a design output after review and approval', roles: ['Engineer', 'Approver'] },
  ],
  'SOP-008': [
    { slug: 'schedule-dr',      focus: 'Scheduling a formal design review and assembling participants', roles: ['Project Manager', 'Engineer'] },
    { slug: 'capture-dr-actions', focus: 'Capturing design review minutes, action items and decisions', roles: ['Project Manager'] },
  ],
  'SOP-009': [
    { slug: 'define-test-case', focus: 'Defining a verification or validation test case', roles: ['V&V Engineer'] },
    { slug: 'execute-test',     focus: 'Executing a V&V test and recording the result', roles: ['V&V Engineer'] },
    { slug: 'log-defect',       focus: 'Logging a defect found during V&V and routing it to engineering', roles: ['V&V Engineer', 'Engineer'] },
    { slug: 're-test',          focus: 'Re-testing after a defect fix and updating the test record', roles: ['V&V Engineer'] },
    { slug: 'approve-vv-report', focus: 'Approving the V&V report at the V&V gate', roles: ['V&V Lead', 'Approver'] },
  ],
  'SOP-011': [
    { slug: 'open-design-change', focus: 'Opening a Design Change Request (CCR)', roles: ['Engineer', 'Change Control Board'] },
    { slug: 'impact-analysis',  focus: 'Performing the impact analysis for a design change', roles: ['Change Control Board', 'Engineer'] },
    { slug: 'implement-change', focus: 'Implementing an approved design change and updating affected documents', roles: ['Engineer'] },
  ],
  'SOP-012': [
    { slug: 'index-dhf',        focus: 'Indexing a new artifact into the Design History File / Technical Documentation', roles: ['Document Controller'] },
    { slug: 'snapshot-dhf',     focus: 'Generating a snapshot of the DHF for a regulatory submission', roles: ['Regulatory Affairs', 'Quality Manager'] },
  ],

  // ── SC — Supply Chain ────────────────────────────────────────────────
  'SOP-016': [
    { slug: 'qualify-supplier', focus: 'Qualifying a new supplier and recording approval', roles: ['Supplier Quality', 'Purchasing'] },
    { slug: 'audit-supplier',   focus: 'Performing a supplier audit and recording the results', roles: ['Supplier Quality'] },
    { slug: 're-evaluate',      focus: 'Performing the periodic supplier re-evaluation', roles: ['Supplier Quality'] },
    { slug: 'disqualify',       focus: 'Disqualifying a supplier after performance issues', roles: ['Supplier Quality', 'Quality Manager'] },
    { slug: 'monitor-perf',     focus: 'Monitoring supplier performance KPIs', roles: ['Supplier Quality'] },
  ],
  'SOP-030': [
    { slug: 'raise-po',         focus: 'Raising a purchase order against an approved supplier', roles: ['Purchasing'] },
    { slug: 'verify-receipt',   focus: 'Verifying purchased product on receipt against purchase data', roles: ['Receiving', 'Purchasing'] },
  ],

  // ── RA — Regulatory Affairs ──────────────────────────────────────────
  'SOP-034': [
    { slug: 'open-submission',  focus: 'Opening a new regulatory submission file', roles: ['Regulatory Affairs'] },
    { slug: 'compile-dossier',  focus: 'Compiling submission documents from the QMS', roles: ['Regulatory Affairs'] },
    { slug: 'track-response',   focus: 'Tracking a regulator request for additional information', roles: ['Regulatory Affairs'] },
  ],
  'SOP-035': [
    { slug: 'open-tech-file',   focus: 'Opening a Technical File / Design Dossier for a device', roles: ['Regulatory Affairs', 'Quality Manager'] },
    { slug: 'update-tech-file', focus: 'Updating the Technical File after a design or labeling change', roles: ['Regulatory Affairs'] },
  ],
  'SOP-037': [
    { slug: 'initiate-fsca',    focus: 'Initiating a Field Safety Corrective Action (FSCA)', roles: ['Regulatory Affairs', 'Quality Manager'] },
    { slug: 'issue-fsn',        focus: 'Issuing the Field Safety Notice (FSN) to affected customers', roles: ['Regulatory Affairs'] },
    { slug: 'track-fsca',       focus: 'Tracking FSCA execution and effectiveness', roles: ['Regulatory Affairs', 'Quality Manager'] },
  ],
  'SOP-038': [
    { slug: 'evaluate-event',   focus: 'Evaluating an adverse event for vigilance reportability', roles: ['Regulatory Affairs', 'Quality Manager'] },
    { slug: 'submit-report',    focus: 'Submitting a vigilance report to the competent authority', roles: ['Regulatory Affairs'] },
  ],
};

/**
 * Total WI count across the curated catalog. Used by the UI status panel.
 */
export const GLOBAL_WI_CATALOG_TOTAL = Object.values(GLOBAL_WI_CATALOG_SPEC)
  .reduce((sum, list) => sum + list.length, 0);

/**
 * SOPs that intentionally have zero WIs (e.g. Quality Manual). Surfaced
 * in the UI so users understand why some SOPs are blank.
 */
export function isZeroWiSop(sopKey: string): boolean {
  const list = GLOBAL_WI_CATALOG_SPEC[sopKey];
  return !list || list.length === 0;
}

/**
 * Build the deterministic WI number for a slug within a SOP, based on the
 * SOP's functional sub-prefix and the slug's position in the spec list.
 */
export function wiNumberFor(sopKey: string, slug: string, subPrefix: string | null): string | null {
  const list = GLOBAL_WI_CATALOG_SPEC[sopKey];
  if (!list) return null;
  const idx = list.findIndex((e) => e.slug === slug);
  if (idx < 0) return null;
  const prefix = subPrefix ? `WI-${subPrefix.toUpperCase()}-` : 'WI-';
  return `${prefix}${String(idx + 1).padStart(3, '0')}`;
}