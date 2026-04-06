/**
 * Lightweight Markdown → HTML converter for AI suggestions.
 * Handles bold, italic, numbered/bullet lists, and line breaks.
 */
export function markdownToHtml(md: string): string {
  if (!md) return md;

  // If it already looks like HTML, return as-is
  if (/<[a-z][\s\S]*>/i.test(md)) return md;

  let html = md;

  // Bold: **text** or __text__
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_ (but not inside strong tags)
  html = html.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/(?<!_)_(?!_)(.*?)(?<!_)_(?!_)/g, '<em>$1</em>');

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
