/**
 * Lean Quality Manual structure — 8 sections instead of 23.
 * Maps to ISO 13485:2016 clause groups with a narrative process-mapping approach.
 */

export interface LeanQMSection {
  key: string;
  /** Display number (1–8) */
  number: number;
  title: string;
  /** ISO clause range covered */
  clauseRange: string;
  /** Individual sub-clauses this section covers */
  coveredClauses: string[];
  description: string;
}

export const LEAN_QM_SECTIONS: LeanQMSection[] = [
  {
    key: 'qm_ch_1',
    number: 1,
    title: 'Scope & Exclusions',
    clauseRange: '1',
    coveredClauses: [],
    description: 'Define the QMS scope, applicable products/markets, and list excluded clauses with justification per §4.2.2.',
  },
  {
    key: 'qm_ch_2',
    number: 2,
    title: 'Normative References',
    clauseRange: '2',
    coveredClauses: [],
    description: 'List applicable standards (ISO 13485, ISO 14971, IEC 62304, 21 CFR 820, MDR 2017/745, etc.).',
  },
  {
    key: 'qm_ch_3',
    number: 3,
    title: 'Terms & Definitions',
    clauseRange: '3',
    coveredClauses: [],
    description: 'Organisation-specific terms, acronyms, and definitions used throughout the QMS.',
  },
  {
    key: 'qm_ch_4',
    number: 4,
    title: 'Quality Management System',
    clauseRange: '4',
    coveredClauses: ['4.1', '4.2'],
    description: 'General QMS requirements, documentation hierarchy (4 levels), outsourced process control, and document/record management.',
  },
  {
    key: 'qm_ch_5',
    number: 5,
    title: 'Management Responsibility',
    clauseRange: '5',
    coveredClauses: ['5.1', '5.2', '5.3', '5.4', '5.5', '5.6'],
    description: 'Management commitment, customer focus, quality policy & objectives, responsibilities, management representative, and management review.',
  },
  {
    key: 'qm_ch_6',
    number: 6,
    title: 'Resource Management',
    clauseRange: '6',
    coveredClauses: ['6.1', '6.2', '6.3', '6.4'],
    description: 'Provision of resources, human resources & competence, infrastructure, work environment, and contamination control.',
  },
  {
    key: 'qm_ch_7',
    number: 7,
    title: 'Product Realization',
    clauseRange: '7',
    coveredClauses: ['7.1', '7.2', '7.3', '7.4', '7.5', '7.6'],
    description: 'Planning, design & development, purchasing & supplier control, production, traceability (UDI), process validation, and equipment control.',
  },
  {
    key: 'qm_ch_8',
    number: 8,
    title: 'Measurement & Improvement',
    clauseRange: '8',
    coveredClauses: ['8.1', '8.2', '8.3', '8.4', '8.5'],
    description: 'Monitoring & measurement, post-market surveillance, complaint handling, internal audits, nonconforming product, data analysis, and CAPA.',
  },
];

/** Map from old granular keys to the new lean chapter keys for migration */
export const OLD_KEY_TO_NEW_CHAPTER: Record<string, string> = {};
LEAN_QM_SECTIONS.forEach(ch => {
  ch.coveredClauses.forEach(clause => {
    const oldKey = `qm_section_${clause.replace('.', '_')}`;
    OLD_KEY_TO_NEW_CHAPTER[oldKey] = ch.key;
  });
});

/** Get the lean chapter that covers a given sub-clause */
export function getChapterForClause(clause: string): LeanQMSection | undefined {
  const majorClause = clause.split('.')[0];
  return LEAN_QM_SECTIONS.find(ch => ch.clauseRange === majorClause);
}
