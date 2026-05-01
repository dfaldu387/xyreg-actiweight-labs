/**
 * Curated map of XyReg modules and their concrete UI actions.
 * Used to ground AI-generated Work Instructions so that "press this button,
 * then enter that" steps reference real XyReg navigation paths instead of
 * hallucinated ones.
 *
 * Keep entries short and observable — each step should describe something a
 * user can literally do in the running app.
 */
export interface XyRegAction {
  id: string;
  label: string;
  steps: string[];
}

export interface XyRegModule {
  key: string;
  label: string;
  path: string;
  actions: XyRegAction[];
}

export const XYREG_FEATURE_MAP: Record<string, XyRegModule> = {
  documents: {
    key: 'documents',
    label: 'Document Studio',
    path: 'Company → Documents tab',
    actions: [
      {
        id: 'open-draft',
        label: 'Open a draft for editing',
        steps: [
          'Navigate to Company → Documents.',
          'Use the filter bar (top of the list) to locate the document by ID, name, tier, or owner.',
          'Click the row — the Edit Draft drawer opens on the right with the live preview alongside.',
        ],
      },
      {
        id: 'edit-section',
        label: 'Edit a document section inline',
        steps: [
          'With the drawer open, scroll the right-hand preview to the section to change.',
          'Click directly on the text — the inline TipTap editor activates.',
          'Use the toolbar (Bold, H1/H2/H3, lists, links) at the top of the preview pane.',
          'Changes auto-save; the green "Saved" badge confirms persistence.',
        ],
      },
      {
        id: 'send-for-review',
        label: 'Send a draft for review',
        steps: [
          'Open the draft.',
          'Click the eye icon (Send for Review) in the drawer header.',
          'Pick reviewers or a reviewer group; add an optional note.',
          'Click Send — reviewers receive an action item in their Mission Control.',
        ],
      },
      {
        id: 'approve',
        label: 'Approve and sign a document',
        steps: [
          'Open the draft.',
          'Click the shield (Approve) icon in the drawer header — only visible when reviews are complete.',
          'Run the e-signature flow: confirm intent and enter the signing PIN.',
          'The document moves to Effective; a new content snapshot is recorded.',
        ],
      },
      {
        id: 'translate',
        label: 'Create a translated copy',
        steps: [
          'Open the source draft.',
          'In the Configure panel (left rail, gear-document icon), expand "Translate this document".',
          'Pick a target language and click Translate.',
          'A new linked CI is created with suffix -<LANG>; open it from the toast.',
        ],
      },
    ],
  },
  risk: {
    key: 'risk',
    label: 'Risk Management',
    path: 'Product → Design Risk',
    actions: [
      {
        id: 'add-hazard',
        label: 'Add a hazard',
        steps: [
          'Open Product → Design Risk → Hazards tab.',
          'Click "Add Hazard" (top right).',
          'Pick the ISO 14971 category, severity, probability and product applicability.',
          'Save — the hazard appears in the Hazards table and the traceability matrix once linked.',
        ],
      },
      {
        id: 'link-control',
        label: 'Link a risk control to a requirement',
        steps: [
          'Open the hazard in Design Risk.',
          'Switch to the Linked Requirements panel.',
          'Use the search box to find the design input/output.',
          'Click + to attach it; the hazard is now visible in the traceability matrix.',
        ],
      },
    ],
  },
  vv: {
    key: 'vv',
    label: 'Verification & Validation',
    path: 'Product → V&V',
    actions: [
      {
        id: 'create-protocol',
        label: 'Create a V&V protocol',
        steps: [
          'Open Product → V&V → Plans tab.',
          'Click "New Plan" and pick the protocol type.',
          'Add environment metadata (sample, equipment, standard).',
          'Use the auto-generate button to scaffold test cases from linked requirements.',
        ],
      },
      {
        id: 'execute-test',
        label: 'Execute a test case',
        steps: [
          'Open V&V → Test Cases.',
          'Select the case and click Run.',
          'Enter results, attach evidence, mark Pass/Fail.',
          'Failures auto-route to the closed-loop defect queue.',
        ],
      },
    ],
  },
  capa: {
    key: 'capa',
    label: 'CAPA',
    path: 'QMS → CAPA',
    actions: [
      {
        id: 'open-capa',
        label: 'Open a new CAPA',
        steps: [
          'Navigate to QMS → CAPA.',
          'Click "New CAPA"; pick the source (Complaint, Audit, Non-conformance).',
          'Fill in problem statement, immediate containment, root cause method.',
          'Save; the CAPA enters the Investigation phase.',
        ],
      },
      {
        id: 'close-capa',
        label: 'Close a CAPA with effectiveness check',
        steps: [
          'Open the CAPA.',
          'Confirm all corrective and preventive actions are marked Done.',
          'Run the Effectiveness Check — record metric and verdict.',
          'Click Close; signature flow runs.',
        ],
      },
    ],
  },
  training: {
    key: 'training',
    label: 'Training',
    path: 'QMS → Training',
    actions: [
      {
        id: 'assign-training',
        label: 'Assign training to staff',
        steps: [
          'Open QMS → Training → Assignments.',
          'Click "Assign training" and pick the document or curriculum.',
          'Select users or roles; set due date.',
          'Save — assignees are notified in Mission Control.',
        ],
      },
    ],
  },
  suppliers: {
    key: 'suppliers',
    label: 'Suppliers',
    path: 'QMS → Suppliers',
    actions: [
      {
        id: 'add-supplier',
        label: 'Onboard a new supplier',
        steps: [
          'Open QMS → Suppliers; click "Add Supplier".',
          'Enter name, scope of supply, criticality.',
          'Attach supplier qualification questionnaire.',
          'Save — supplier moves to "Pending Qualification".',
        ],
      },
    ],
  },
  missionControl: {
    key: 'missionControl',
    label: 'Mission Control',
    path: 'Top of every workspace',
    actions: [
      {
        id: 'review-action-items',
        label: 'Action your daily items',
        steps: [
          'Open Mission Control (default landing screen).',
          'Scan the My Action Items list at the top — Approvals (shield), Reviews (eye), Deadlines (calendar).',
          'Click any item to deep-link directly to the originating drawer.',
        ],
      },
    ],
  },
  gapAnalysis: {
    key: 'gapAnalysis',
    label: 'Gap Analysis',
    path: 'QMS → Gap Analysis',
    actions: [
      {
        id: 'run-assessment',
        label: 'Run a gap assessment for a standard',
        steps: [
          'Open QMS → Gap Analysis; pick the standard (e.g. ISO 13485, MDR).',
          'Step through each clause: mark Compliant / Partial / Gap and link evidence documents.',
          'Save — overall compliance % updates and feeds the dossier readiness widget.',
        ],
      },
    ],
  },
};

export const ALL_MODULE_KEYS = Object.keys(XYREG_FEATURE_MAP);

/**
 * Best-effort guess of relevant modules from a SOP title.
 * Used to pre-check the multi-select.
 */
export function guessModulesFromTitle(title: string): string[] {
  const t = (title || '').toLowerCase();
  const hits: string[] = [];
  if (/document|control of documents|sop|record/.test(t)) hits.push('documents');
  if (/risk|hazard|14971/.test(t)) hits.push('risk');
  if (/verification|validation|v&v|test/.test(t)) hits.push('vv');
  if (/capa|corrective|preventive|complaint|nonconform/.test(t)) hits.push('capa');
  if (/training|competen/.test(t)) hits.push('training');
  if (/supplier|purchasing|outsourc/.test(t)) hits.push('suppliers');
  if (/management review|mission|kpi/.test(t)) hits.push('missionControl');
  if (/gap|assessment|13485|mdr|fda|iso/.test(t)) hits.push('gapAnalysis');
  // No fallback — let the user pick. A misleading default pre-check (e.g. Document
  // Studio for "Design and Development Planning") confuses authors.
  return hits;
}

/**
 * Translation targets keyed by ISO 3166-1 alpha-2 COUNTRY codes (e.g. FI for
 * Finland, SE for Sweden). The dropdown shows only the 2-letter code; the full
 * country name is shown as a secondary label inside the menu.
 *
 * `language` is the ISO 639-1 language code we send to the AI translator.
 */
export const TRANSLATION_LANGUAGES: {
  code: string; // ISO 3166-1 alpha-2 country code (used as document-number suffix)
  country: string; // full country name shown in dropdown menu
  language: string; // ISO 639-1 language code passed to the translator
  flag: string;
}[] = [
  { code: 'GB', country: 'United Kingdom', language: 'en', flag: '🇬🇧' },
  { code: 'US', country: 'United States', language: 'en', flag: '🇺🇸' },
  { code: 'FR', country: 'France', language: 'fr', flag: '🇫🇷' },
  { code: 'DE', country: 'Germany', language: 'de', flag: '🇩🇪' },
  { code: 'ES', country: 'Spain', language: 'es', flag: '🇪🇸' },
  { code: 'IT', country: 'Italy', language: 'it', flag: '🇮🇹' },
  { code: 'PT', country: 'Portugal', language: 'pt', flag: '🇵🇹' },
  { code: 'NL', country: 'Netherlands', language: 'nl', flag: '🇳🇱' },
  { code: 'SE', country: 'Sweden', language: 'sv', flag: '🇸🇪' },
  { code: 'DK', country: 'Denmark', language: 'da', flag: '🇩🇰' },
  { code: 'FI', country: 'Finland', language: 'fi', flag: '🇫🇮' },
  { code: 'NO', country: 'Norway', language: 'no', flag: '🇳🇴' },
  { code: 'PL', country: 'Poland', language: 'pl', flag: '🇵🇱' },
  { code: 'CZ', country: 'Czech Republic', language: 'cs', flag: '🇨🇿' },
  { code: 'GR', country: 'Greece', language: 'el', flag: '🇬🇷' },
  { code: 'RO', country: 'Romania', language: 'ro', flag: '🇷🇴' },
  { code: 'HU', country: 'Hungary', language: 'hu', flag: '🇭🇺' },
  { code: 'SK', country: 'Slovakia', language: 'sk', flag: '🇸🇰' },
  { code: 'SI', country: 'Slovenia', language: 'sl', flag: '🇸🇮' },
  { code: 'HR', country: 'Croatia', language: 'hr', flag: '🇭🇷' },
  { code: 'BG', country: 'Bulgaria', language: 'bg', flag: '🇧🇬' },
  { code: 'LT', country: 'Lithuania', language: 'lt', flag: '🇱🇹' },
  { code: 'LV', country: 'Latvia', language: 'lv', flag: '🇱🇻' },
  { code: 'EE', country: 'Estonia', language: 'et', flag: '🇪🇪' },
  { code: 'MT', country: 'Malta', language: 'mt', flag: '🇲🇹' },
  { code: 'IE', country: 'Ireland', language: 'ga', flag: '🇮🇪' },
];