/**
 * Simple word-level diff utility for comparing original and suggested text.
 */

export interface DiffSegment {
  type: 'unchanged' | 'added' | 'removed';
  text: string;
}

/**
 * Compute a simple word-level diff between two strings.
 * Uses a basic longest-common-subsequence approach on words.
 */
export function computeWordDiff(original: string, suggested: string): DiffSegment[] {
  const origWords = original.split(/(\s+)/);
  const sugWords = suggested.split(/(\s+)/);

  // Build LCS table
  const m = origWords.length;
  const n = sugWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origWords[i - 1] === sugWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff
  const segments: DiffSegment[] = [];
  let i = m, j = n;

  const tempSegments: DiffSegment[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origWords[i - 1] === sugWords[j - 1]) {
      tempSegments.push({ type: 'unchanged', text: origWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      tempSegments.push({ type: 'added', text: sugWords[j - 1] });
      j--;
    } else {
      tempSegments.push({ type: 'removed', text: origWords[i - 1] });
      i--;
    }
  }

  tempSegments.reverse();

  // Merge consecutive segments of the same type
  for (const seg of tempSegments) {
    if (segments.length > 0 && segments[segments.length - 1].type === seg.type) {
      segments[segments.length - 1].text += seg.text;
    } else {
      segments.push({ ...seg });
    }
  }

  return segments;
}
