/**
 * Deduplication utility for AI suggestions.
 * Provides a client-side safety net to filter out suggestions
 * that are too similar to existing items in the database.
 */

/**
 * Normalize a string for comparison: lowercase, trim, remove punctuation
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Calculate simple similarity between two normalized strings.
 * Uses word overlap (Jaccard-like) for fast approximate matching.
 */
function similarity(a: string, b: string): number {
  const wordsA = new Set(normalize(a).split(' '));
  const wordsB = new Set(normalize(b).split(' '));
  
  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) intersection++;
  }

  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

/**
 * Filter out AI suggestions that are too similar to existing items.
 * 
 * @param suggestions - Array of AI suggestions
 * @param existingDescriptions - Descriptions of items already in the database
 * @param getDescription - Function to extract description from a suggestion
 * @param similarityThreshold - Minimum similarity to consider a duplicate (default 0.7)
 * @returns Filtered suggestions with duplicates removed
 */
export function deduplicateSuggestions<T>(
  suggestions: T[],
  existingDescriptions: string[],
  getDescription: (item: T) => string,
  similarityThreshold = 0.7
): { filtered: T[]; removedCount: number } {
  if (!existingDescriptions.length) {
    return { filtered: suggestions, removedCount: 0 };
  }

  const normalizedExisting = existingDescriptions.map(normalize);

  const filtered = suggestions.filter(suggestion => {
    const desc = normalize(getDescription(suggestion));
    
    // Check exact substring match
    for (const existing of normalizedExisting) {
      if (existing.includes(desc) || desc.includes(existing)) {
        return false;
      }
    }
    
    // Check word-overlap similarity
    for (const existing of normalizedExisting) {
      if (similarity(desc, existing) >= similarityThreshold) {
        return false;
      }
    }

    return true;
  });

  return {
    filtered,
    removedCount: suggestions.length - filtered.length
  };
}
