/**
 * Lightweight Markdown → HTML converter for AI suggestions.
 * Handles bold, italic, numbered/bullet lists, and line breaks.
 *
 * Split into two passes:
 *  - Inline pass (bold, italic): always runs. Safe for strings that already
 *    contain HTML, e.g. `<p>**Bold** text</p>` → `<p><strong>Bold</strong> text</p>`.
 *  - Block pass (lists, line breaks): only runs when the input looks like
 *    plain markdown, not HTML.
 */
function applyInlineMarkdown(s: string): string {
  if (!s) return s;
  let out = s;
  // Bold: **text** or __text__ — intentionally runs inside HTML tags too, so
  // content like `<p>**Purpose**</p>` is healed to `<p><strong>Purpose</strong></p>`.
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/__(.+?)__/g, '<strong>$1</strong>');
  // Italic: *text* or _text_ (negative look-arounds to avoid nested matches)
  out = out.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  out = out.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>');
  return out;
}

export function markdownToHtml(md: string): string {
  if (!md) return md;

  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(md);

  // For HTML-wrapped content, only heal inline markdown. Block-level markdown
  // (- bullets, numbered lists) inside a <p> wrapper can't be safely restructured
  // without breaking tags, and usually the AI already emits proper <ul>/<ol>
  // when it emits HTML.
  if (looksLikeHtml) {
    return applyInlineMarkdown(md);
  }

  let html = applyInlineMarkdown(md);

  // Numbered lists: lines starting with "1. ", "2. ", etc.
  html = html.replace(/(^|\n)((?:\d+\.\s+.+(?:\n|$))+)/g, (_match, prefix, block) => {
    const items = block.trim().split('\n')
      .map((line: string) => line.replace(/^\d+\.\s+/, '').trim())
      .filter(Boolean)
      .map((item: string) => `<li>${item}</li>`)
      .join('');
    return `${prefix}<ol>${items}</ol>`;
  });

  // Bullet lists: lines starting with "- ", "• ", or "* "
  html = html.replace(/(^|\n)((?:[-•*]\s+.+(?:\n|$))+)/g, (_match, prefix, block) => {
    const items = block.trim().split('\n')
      .map((line: string) => line.replace(/^[-•*]\s+/, '').trim())
      .filter(Boolean)
      .map((item: string) => `<li>${item}</li>`)
      .join('');
    return `${prefix}<ul>${items}</ul>`;
  });

  // Convert remaining newlines to <br> (but not inside list tags)
  html = html.replace(/\n/g, '<br>');

  // Clean up double <br> after lists
  html = html.replace(/<\/(ol|ul)><br>/g, '</$1>');
  html = html.replace(/<br><(ol|ul)>/g, '<$1>');

  return html.trim();
}

/**
 * Repairs AI-generated prose that packed multiple bolded sub-headings + inline
 * dash-separated items into a single paragraph, e.g.:
 *
 *   <p><strong>Heading A</strong> intro text. <strong>Heading B</strong>
 *   - item one - item two - item three <strong>Heading C</strong> - ...</p>
 *
 * becomes:
 *
 *   <p><strong>Heading A</strong></p>
 *   <p>intro text.</p>
 *   <p><strong>Heading B</strong></p>
 *   <ul><li>item one</li><li>item two</li><li>item three</li></ul>
 *   <p><strong>Heading C</strong></p>
 *   <ul>...</ul>
 *
 * Runs a conservative heuristic — only triggers on content with ≥2 <strong>
 * tags AND ≥3 " - " separators, so normal paragraphs with inline bold are
 * left alone.
 */
export function restructureInlineAIProse(html: string): string {
  if (!html) return html;

  // Process each top-level <p>…</p> independently so existing structure
  // (multiple paragraphs, lists) is preserved.
  return html.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (full, inner: string) => {
    const strongCount = (inner.match(/<strong>[^<]+<\/strong>/g) || []).length;
    const dashCount = (inner.match(/\s-\s/g) || []).length;
    if (strongCount < 2 || dashCount < 3) return full;

    // Split on <strong> tags, keeping them as delimiters.
    const segments = inner.split(/(<strong>[^<]+<\/strong>)/g);
    const out: string[] = [];
    let pendingHeading: string | null = null;
    let body = '';

    const flush = () => {
      if (pendingHeading) {
        out.push(`<p>${pendingHeading}</p>`);
      }
      const bodyTrim = body.replace(/^\s*[-–—]\s*/, '').trim();
      if (bodyTrim) {
        const hasDashItems = /\s-\s/.test(bodyTrim);
        if (hasDashItems) {
          const parts = bodyTrim.split(/\s+-\s+/).map((s) => s.trim()).filter(Boolean);
          // If the first chunk looks like a finished sentence (ends in
          // punctuation), keep it as prose and list the rest; otherwise treat
          // every chunk as an item.
          if (parts.length >= 2) {
            const [first, ...rest] = parts;
            if (/[.!?]$/.test(first)) {
              out.push(`<p>${first}</p>`);
              out.push(`<ul>${rest.map((i) => `<li>${i}</li>`).join('')}</ul>`);
            } else {
              out.push(`<ul>${parts.map((i) => `<li>${i}</li>`).join('')}</ul>`);
            }
          } else {
            out.push(`<p>${bodyTrim}</p>`);
          }
        } else {
          out.push(`<p>${bodyTrim}</p>`);
        }
      }
      pendingHeading = null;
      body = '';
    };

    for (const seg of segments) {
      if (/^<strong>[^<]+<\/strong>$/.test(seg)) {
        flush();
        pendingHeading = seg;
      } else {
        body += seg;
      }
    }
    flush();

    return out.join('');
  });
}
