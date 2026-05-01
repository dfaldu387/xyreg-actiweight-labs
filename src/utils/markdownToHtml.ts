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

  // Ensure lists are isolated as their own blocks even when adjacent text
  // didn't have a blank line around them.
  html = html.replace(/(<\/(?:ul|ol)>)(?!\n\n)/g, '$1\n\n');
  html = html.replace(/(?<!\n\n)(<(?:ul|ol)>)/g, '\n\n$1');

  // Split on blank lines into separate paragraphs so each block becomes its
  // own editor node. Without this, a multi-paragraph string ends up as one
  // paragraph with <br>s, which makes block-level toggles (e.g. H3) act on
  // the entire run instead of just the targeted line.
  const blocks = html
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  const wrapped = blocks
    .map((block) => {
      // Don't double-wrap things that already start with a block-level tag.
      if (/^<(p|ul|ol|h[1-6]|table|blockquote|pre|div)\b/i.test(block)) {
        // Convert remaining single newlines inside the block to <br>.
        return block.replace(/\n/g, '<br>');
      }
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    })
    .join('');

  // Clean up stray <br>s adjacent to lists.
  let result = wrapped;
  result = result.replace(/<\/(ol|ul)><br>/g, '</$1>');
  result = result.replace(/<br><(ol|ul)>/g, '<$1>');

  return result.trim();
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
