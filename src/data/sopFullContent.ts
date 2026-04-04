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
 * Look up SOP content by extracting the SOP number from a document name.
 * Matches patterns like "SOP-001", "SOP-001 Quality Management System", etc.
 */
export function getSOPContentByName(docName: string): SOPFullContent | null {
  const match = docName.match(/SOP-(\d{3})/);
  if (!match) return null;
  const sopKey = `SOP-${match[1]}`;
  return SOP_FULL_CONTENT[sopKey] || null;
}

/**
 * Convert SOP content to DocumentSection format for the Document Studio editor.
 */
export function sopContentToSections(sopContent: SOPFullContent) {
  return sopContent.sections.map((section, index) => ({
    id: section.id,
    title: section.title,
    order: index,
    content: [{
      id: `${section.id}-1`,
      type: 'paragraph' as const,
      content: section.content,
      isAIGenerated: false,
      metadata: {
        confidence: 1.0,
        lastModified: new Date(),
        author: 'ai' as const,
        dataSource: 'auto-populated' as const,
        populatedFrom: 'Xyreg SOP Library',
      },
    }],
  }));
}
