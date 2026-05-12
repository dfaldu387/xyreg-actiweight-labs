import type { DocumentSection } from '@/types/documentComposer';

/**
 * Convert a .docx File to HTML using mammoth (preserves headings, lists, tables).
 */
export async function convertDocxToHtml(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const buffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
  return result.value || '';
}

function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Split HTML into chunks delimited by top-level headings (h1/h2/h3).
 * Anything before the first heading is returned with heading = ''.
 */
export function splitHtmlByHeadings(html: string): Array<{ heading: string; html: string }> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return [{ heading: '', html }];

  const chunks: Array<{ heading: string; html: string }> = [];
  let current: { heading: string; html: string } = { heading: '', html: '' };

  for (const node of Array.from(root.childNodes)) {
    if (node.nodeType === 1) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
        if (current.html.trim() || current.heading) chunks.push(current);
        current = { heading: el.textContent?.trim() || '', html: '' };
        continue;
      }
    }
    const tmp = doc.createElement('div');
    tmp.appendChild(node.cloneNode(true));
    current.html += tmp.innerHTML;
  }
  if (current.html.trim() || current.heading) chunks.push(current);

  return chunks.length ? chunks : [{ heading: '', html }];
}

/**
 * Match imported chunks to existing draft sections by fuzzy heading match.
 * Unmatched chunks are appended to a fallback section (Procedure / Content,
 * or the first section if that's not present).
 *
 * Returns a new sections array — does NOT mutate the input.
 */
export function mapDocxHtmlToSections(
  html: string,
  targetSections: DocumentSection[]
): DocumentSection[] {
  if (!targetSections?.length) return targetSections;

  const chunks = splitHtmlByHeadings(html);

  // Build a lookup: normalized title -> section index
  const titleIndex = new Map<string, number>();
  targetSections.forEach((s, i) => {
    titleIndex.set(normalize(s.title), i);
  });

  // Find fallback section ("Procedure / Content" or first)
  let fallbackIdx = targetSections.findIndex(s =>
    /procedure|content/i.test(s.title)
  );
  if (fallbackIdx < 0) fallbackIdx = 0;

  // Bucket html per section index
  const buckets: string[] = targetSections.map(() => '');

  for (const chunk of chunks) {
    const norm = normalize(chunk.heading);
    let idx = -1;

    if (norm) {
      // Exact match
      if (titleIndex.has(norm)) {
        idx = titleIndex.get(norm)!;
      } else {
        // Substring match either way
        for (const [k, v] of titleIndex.entries()) {
          if (k && (k.includes(norm) || norm.includes(k))) {
            idx = v;
            break;
          }
        }
      }
    }

    if (idx < 0) idx = fallbackIdx;

    let piece = '';
    if (chunk.heading && idx === fallbackIdx) {
      // Preserve unmatched headings inline so content isn't lost.
      piece += `<h3>${escapeHtml(chunk.heading)}</h3>`;
    }
    piece += chunk.html;
    if (piece.trim()) {
      buckets[idx] += (buckets[idx] ? '\n' : '') + piece;
    }
  }

  return targetSections.map((section, i) => {
    const importedHtml = buckets[i];
    if (!importedHtml || !importedHtml.trim()) return section;
    return {
      ...section,
      content: [
        {
          id: `${section.id}-imported-${Date.now()}`,
          type: 'paragraph',
          content: importedHtml,
          isAIGenerated: false,
          metadata: {
            confidence: 1,
            lastModified: new Date(),
            author: 'user',
            dataSource: 'manual',
          },
        },
      ],
    };
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
