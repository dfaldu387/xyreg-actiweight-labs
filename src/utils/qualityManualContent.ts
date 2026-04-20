/**
 * Strips redundant leading "Chapter N" headings from Quality Manual section content.
 * Used to clean both newly assembled and legacy saved content.
 */
export function stripLeadingChapterHeading(content: string): string {
  if (!content) return content;
  return content.replace(
    /^\s*<(h[1-3]|p)>\s*(<strong>)?\s*(Chapter|Ch\.?)\s*\d+[^<]*(<\/strong>)?\s*<\/(h[1-3]|p)>\s*/i,
    ''
  );
}

/**
 * Cleans all sections of a Quality Manual draft by stripping redundant chapter headings.
 * Only processes sections whose content starts with a "Chapter N" pattern.
 */
export function cleanQualityManualSections(sections: any[]): any[] {
  if (!Array.isArray(sections)) return sections;
  return sections.map(section => {
    if (section?.content && typeof section.content === 'string') {
      return { ...section, content: stripLeadingChapterHeading(section.content) };
    }
    return section;
  });
}
