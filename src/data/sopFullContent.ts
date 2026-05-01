import { SOPFullContent, SOPSectionContent } from './sopContent/types';
import { SOP_001_TO_010 } from './sopContent/sop001to010';
import { SOP_011_TO_020 } from './sopContent/sop011to020';
import { SOP_021_TO_030 } from './sopContent/sop021to030';
import { SOP_031_TO_040 } from './sopContent/sop031to040';
import { SOP_041_TO_051 } from './sopContent/sop041to051';

export type { SOPFullContent, SOPSectionContent };

/**
 * Complete SOP content library for all 51 Xyreg SOPs.
 * Each SOP contains full section content describing how the company
 * manages that process using the Xyreg platform.
 */
export const SOP_FULL_CONTENT: Record<string, SOPFullContent> = {
  ...SOP_001_TO_010,
  ...SOP_011_TO_020,
  ...SOP_021_TO_030,
  ...SOP_031_TO_040,
  ...SOP_041_TO_051,
};

/**
 * Look up SOP content by extracting the SOP number from a document name or document_number.
 * Matches patterns like "SOP-001", "SOP-001 Quality Management System", etc.
 * Also accepts a documentNumber parameter (e.g., "SOP-001") as a direct lookup key.
 */
export function getSOPContentByName(docName: string, documentNumber?: string): SOPFullContent | null {
  // Try documentNumber first (e.g., "SOP-001")
  if (documentNumber) {
    const numMatch = documentNumber.match(/SOP-(\d{3})/);
    if (numMatch) {
      const sopKey = `SOP-${numMatch[1]}`;
      if (SOP_FULL_CONTENT[sopKey]) return SOP_FULL_CONTENT[sopKey];
    }
  }
  // Fallback: extract from doc name
  const match = docName.match(/SOP-(\d{3})/);
  if (!match) return null;
  const sopKey = `SOP-${match[1]}`;
  return SOP_FULL_CONTENT[sopKey] || null;
}

/**
 * Convert SOP content to DocumentSection format for the Document Studio editor.
 *
 * If a section's body contains lines that begin with `N.M ` (e.g.
 * `6.1 Trend Reporting`), each such line is split out as its own H3 heading
 * block, with the prose between two sub-headings becoming a paragraph block.
 * Sections without `N.M` sub-headings (1.0 Purpose, 8.0 Revision History,
 * etc.) keep the existing single-paragraph behaviour.
 */
export function sopContentToSections(sopContent: SOPFullContent) {
  const baseMeta = {
    confidence: 1.0,
    author: 'ai' as const,
    dataSource: 'auto-populated' as const,
    populatedFrom: 'Xyreg SOP Library',
  };

  return sopContent.sections.map((section, index) => {
    const raw = section.content || '';
    // Match lines like "6.1 Trend Reporting" at the start of a line.
    const subHeadingRe = /^\s*\d+\.\d+\s+.+$/gm;
    const hasSubHeadings = subHeadingRe.test(raw);
    subHeadingRe.lastIndex = 0;

    const blocks: Array<{
      id: string;
      type: 'paragraph' | 'heading';
      content: string;
      isAIGenerated: boolean;
      metadata: typeof baseMeta & { lastModified: Date };
    }> = [];

    const push = (type: 'paragraph' | 'heading', content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      blocks.push({
        id: `${section.id}-${blocks.length + 1}`,
        type,
        content: trimmed,
        isAIGenerated: false,
        metadata: { ...baseMeta, lastModified: new Date() },
      });
    };

    if (!hasSubHeadings) {
      push('paragraph', raw);
    } else {
      // Walk lines, accumulating paragraph buffers between sub-headings.
      const lines = raw.split('\n');
      let buffer: string[] = [];
      const flushBuffer = () => {
        if (buffer.length === 0) return;
        push('paragraph', buffer.join('\n'));
        buffer = [];
      };
      for (const line of lines) {
        if (/^\s*\d+\.\d+\s+\S/.test(line)) {
          flushBuffer();
          push('heading', line);
        } else {
          buffer.push(line);
        }
      }
      flushBuffer();
    }

    return {
      id: section.id,
      title: section.title,
      order: index,
      content: blocks.length > 0
        ? blocks
        : [{
            id: `${section.id}-1`,
            type: 'paragraph' as const,
            content: raw,
            isAIGenerated: false,
            metadata: { ...baseMeta, lastModified: new Date() },
          }],
    };
  });
}
