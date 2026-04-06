/**
 * Maps each Technical File section to its corresponding gap analysis framework(s)
 * and the clause prefix used to filter items within that framework.
 */

export interface TechnicalFileGapLink {
  /** Technical File section ID (e.g. "TF-0") */
  sectionId: string;
  /** Gap analysis framework identifier */
  framework: string;
  /** Optional: filter clauses by prefix within the framework */
  clausePrefix?: string;
}

/**
 * Complete mapping from TF sections to gap analysis frameworks.
 * Used to:
 * 1. Show compliance badges on the Technical File page
 * 2. Cross-reference documents between TF and gap analysis
 */
export const TECHNICAL_FILE_GAP_LINKS: TechnicalFileGapLink[] = [
  { sectionId: 'TF-0', framework: 'MDR Art. 10 & 19' },
  { sectionId: 'TF-1', framework: 'MDR Annex II', clausePrefix: 'TD.1' },
  { sectionId: 'TF-2', framework: 'MDR Annex II', clausePrefix: 'TD.2' },
  { sectionId: 'TF-3', framework: 'MDR Annex II', clausePrefix: 'TD.3' },
  { sectionId: 'TF-4', framework: 'MDR Annex II', clausePrefix: 'TD.4' },
  { sectionId: 'TF-5', framework: 'MDR Annex II', clausePrefix: 'TD.5' },
  { sectionId: 'TF-6', framework: 'MDR Annex II', clausePrefix: 'TD.6' },
  { sectionId: 'TF-7', framework: 'MDR Annex I' },
  { sectionId: 'TF-8', framework: 'MDR Annex XIV' },
  { sectionId: 'TF-9', framework: 'MDR Annex III' },
];

/**
 * Get the gap analysis link(s) for a given TF section.
 */
export function getGapLinksForSection(sectionId: string): TechnicalFileGapLink[] {
  return TECHNICAL_FILE_GAP_LINKS.filter(l => l.sectionId === sectionId);
}

/**
 * Get the TF section ID for a given framework and clause.
 */
export function getTechnicalFileSectionForClause(framework: string, clause?: string): string | null {
  const links = TECHNICAL_FILE_GAP_LINKS.filter(l => l.framework === framework);
  if (links.length === 0) return null;
  
  // If there's a clause and links have prefixes, find the matching one
  if (clause) {
    const prefixMatch = links.find(l => l.clausePrefix && clause.startsWith(l.clausePrefix));
    if (prefixMatch) return prefixMatch.sectionId;
  }
  
  // Return the first matching link's section
  return links[0].sectionId;
}
