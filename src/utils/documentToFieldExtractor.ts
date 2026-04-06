import { DocumentSection } from '@/types/documentComposer';

export interface FieldExtraction {
  fieldKey: string;
  fieldLabel: string;
  suggestedValue: string;
}

/** Map of document bold labels → product field keys */
const LABEL_TO_FIELD: Record<string, { fieldKey: string; fieldLabel: string }> = {
  'Device Name': { fieldKey: 'name', fieldLabel: 'Device Name' },
  'Trade Name': { fieldKey: 'trade_name', fieldLabel: 'Trade Name' },
  'Description': { fieldKey: 'description', fieldLabel: 'Description' },
  'Device Summary': { fieldKey: 'device_summary', fieldLabel: 'Device Summary' },
  'Device Category': { fieldKey: 'device_category', fieldLabel: 'Device Category' },
  'Risk Class': { fieldKey: 'class', fieldLabel: 'Risk Class' },
  'Intended Use': { fieldKey: 'intended_use', fieldLabel: 'Intended Use' },
  'Clinical Purpose': { fieldKey: 'intended_purpose_data.clinicalPurpose', fieldLabel: 'Clinical Purpose' },
  'Indications': { fieldKey: 'intended_purpose_data.indications', fieldLabel: 'Indications' },
  'Intended Function': { fieldKey: 'intended_purpose_data.indications', fieldLabel: 'Intended Function' },
  'Target Population': { fieldKey: 'intended_purpose_data.targetPopulation', fieldLabel: 'Target Population' },
  'User Profile': { fieldKey: 'intended_purpose_data.userProfile', fieldLabel: 'User Profile' },
  'Use Environment': { fieldKey: 'intended_purpose_data.useEnvironment', fieldLabel: 'Use Environment' },
  'Duration of Use': { fieldKey: 'intended_purpose_data.durationOfUse', fieldLabel: 'Duration of Use' },
  'Mode of Action': { fieldKey: 'intended_purpose_data.modeOfAction', fieldLabel: 'Mode of Action' },
  'Value Proposition': { fieldKey: 'intended_purpose_data.valueProposition', fieldLabel: 'Value Proposition' },
  'Contraindications': { fieldKey: 'intended_purpose_data.contraindications', fieldLabel: 'Contraindications' },
  'Version': { fieldKey: 'version', fieldLabel: 'Version' },
  'Product Platform': { fieldKey: 'product_platform', fieldLabel: 'Product Platform' },
  'Intended Use Category': { fieldKey: 'intended_purpose_data.intendedUseCategory', fieldLabel: 'Intended Use Category' },
  'Use Trigger': { fieldKey: 'intended_purpose_data.useTrigger', fieldLabel: 'Use Trigger' },
  'Disposal Instructions': { fieldKey: 'intended_purpose_data.disposalInstructions', fieldLabel: 'Disposal Instructions' },
};

/**
 * Normalize HTML/rich-text content into plain text lines for parsing.
 * Converts <p>, <br>, <li> etc. into newline-separated plain text,
 * preserves **bold:** markdown patterns that may exist inside HTML.
 */
function normalizeContentToPlainText(raw: string): string {
  let text = raw;

  // Convert <strong>Label:</strong> to **Label:** for consistent parsing
  text = text.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');

  // Convert <b>Label:</b> to **Label:**
  text = text.replace(/<b>(.*?)<\/b>/gi, '**$1**');

  // Block-level breaks: </p>, <br>, </li>, </div> → newlines
  text = text.replace(/<\/p>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/tr>/gi, '\n');

  // Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, ' ');

  return text;
}

/** Check if a value is a placeholder or effectively empty */
function isPlaceholderOrEmpty(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed === '*[To be completed]*') return true;
  if (trimmed === '[To be completed]') return true;
  // After HTML stripping, check if only whitespace/empty tags remain
  const stripped = trimmed.replace(/\*+/g, '').replace(/\[.*?\]/g, '').trim();
  if (!stripped) return true;
  return false;
}

/**
 * Extract field values from document sections by parsing **Label:** value patterns.
 * Handles both raw markdown and HTML/rich-text content from the Tiptap editor.
 */
export function extractFieldsFromSections(sections: DocumentSection[]): FieldExtraction[] {
  const results: FieldExtraction[] = [];
  const seenKeys = new Set<string>();

  for (const section of sections) {
    for (const content of section.content) {
      if (!content.content) continue;

      // Normalize HTML to plain text before parsing
      const normalized = normalizeContentToPlainText(content.content);

      // Parse **Label:** value patterns, supporting multi-line values
      const lines = normalized.split('\n');
      let currentLabel: string | null = null;
      let currentValue: string[] = [];

      const flushCurrent = () => {
        if (currentLabel && currentValue.length > 0) {
          const joined = currentValue.join('\n').trim();
          if (!isPlaceholderOrEmpty(joined)) {
            const mapping = LABEL_TO_FIELD[currentLabel];
            if (mapping && !seenKeys.has(mapping.fieldKey)) {
              seenKeys.add(mapping.fieldKey);
              results.push({
                fieldKey: mapping.fieldKey,
                fieldLabel: mapping.fieldLabel,
                suggestedValue: joined,
              });
            }
          }
        }
        currentLabel = null;
        currentValue = [];
      };

      for (const line of lines) {
        const match = line.match(/^\*\*(.+?):\*\*\s*(.*)$/);
        if (match) {
          // Flush previous label's accumulated value
          flushCurrent();
          const [, label, value] = match;
          currentLabel = label.trim();
          if (value.trim()) {
            currentValue.push(value.trim());
          }
        } else if (currentLabel && line.trim()) {
          // Continuation line for the current label
          currentValue.push(line.trim());
        }
      }
      // Flush last label
      flushCurrent();
    }
  }

  return results;
}
