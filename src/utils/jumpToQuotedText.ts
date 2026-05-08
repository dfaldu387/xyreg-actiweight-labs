/**
 * Locate `quotedText` inside `container` and select/scroll it into view using
 * the browser's native Selection API. Returns true when a match was found.
 *
 * Used to "connect" a comment card back to the corresponding passage in the
 * live editor surface. The matcher normalizes whitespace and progressively
 * shortens the needle so quotes still locate text after light edits.
 *
 * Same algorithm as the inline implementation in
 * `components/document-composer/RightPanel.tsx` — extracted so the
 * `DocumentDraftDrawer` can share it without duplicating ~80 lines.
 */
export function jumpToQuotedText(
  container: HTMLElement | null | undefined,
  quotedText: string | null | undefined,
  scrollContainerId = 'draft-editor-scroll-container',
): boolean {
  if (!container) return false;
  const quotedRaw = (quotedText || '').trim();
  if (!quotedRaw) return false;

  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
  const quoted = normalize(quotedRaw);

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  const textNodes: Text[] = [];
  const nodeStarts: number[] = [];
  let fullText = '';
  let tn: Text | null;
  while ((tn = walker.nextNode() as Text | null)) {
    nodeStarts.push(fullText.length);
    textNodes.push(tn);
    fullText += tn.nodeValue || '';
  }

  const normalizedFull = normalize(fullText);
  const normToOrig: number[] = [];
  for (let i = 0; i < fullText.length; i++) {
    const ch = fullText[i];
    if (/\s/.test(ch)) {
      if (i === 0 || !/\s/.test(fullText[i - 1])) normToOrig.push(i);
    } else {
      normToOrig.push(i);
    }
  }

  const tryLens = [quoted.length, 160, 120, 80, 60, 40].filter(
    (n) => n > 0 && n <= quoted.length,
  );
  let startOrig = -1;
  let endOrig = -1;
  for (const len of tryLens) {
    const needle = quoted.slice(0, len);
    const idx = normalizedFull.indexOf(needle);
    if (idx !== -1) {
      startOrig = normToOrig[idx] ?? idx;
      const lastNormIdx = idx + needle.length - 1;
      endOrig = (normToOrig[lastNormIdx] ?? (startOrig + len - 1)) + 1;
      break;
    }
  }
  if (startOrig === -1 || endOrig === -1) return false;

  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;
  for (let i = 0; i < textNodes.length; i++) {
    const nStart = nodeStarts[i];
    const nEnd = nStart + (textNodes[i].nodeValue?.length || 0);
    if (!startNode && startOrig < nEnd) {
      startNode = textNodes[i];
      startOffset = startOrig - nStart;
    }
    if (endOrig <= nEnd) {
      endNode = textNodes[i];
      endOffset = endOrig - nStart;
      break;
    }
  }
  if (!startNode || !endNode) return false;

  let range: Range;
  try {
    range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
  } catch {
    return false;
  }

  const scrollParent = document.getElementById(scrollContainerId);
  const rect = range.getBoundingClientRect();
  if (scrollParent && rect.height) {
    const parentRect = scrollParent.getBoundingClientRect();
    const offset = rect.top - parentRect.top + scrollParent.scrollTop - 100;
    scrollParent.scrollTo({ top: offset, behavior: 'smooth' });
  }

  const sel = window.getSelection();
  if (sel) {
    sel.removeAllRanges();
    sel.addRange(range);
  }
  return true;
}