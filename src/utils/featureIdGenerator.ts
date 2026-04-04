import type { KeyFeature } from './keyFeaturesNormalizer';

/**
 * Derives a short product code from model_reference (or product name fallback).
 * Takes first 4 alphanumeric chars, uppercased. Strips hyphens/spaces.
 * Example: "G660" → "G660", "G660-S" → "G660S", "My Device" → "MYDE"
 */
function deriveShortCode(reference: string): string {
  const alphanum = reference.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return alphanum.slice(0, 5) || 'FEAT';
}

/**
 * Extracts the numeric sequence from an existing feature ID.
 * e.g. "FEAT-G660-003" → 3, "FEAT-G660S-012" → 12
 */
function extractSequence(id: string): number {
  const match = id.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Generates the next stable feature ID for a product.
 * Format: FEAT-{shortCode}-{sequence}
 */
export function generateFeatureId(
  existingFeatures: KeyFeature[],
  modelReference?: string,
  productName?: string,
): string {
  const ref = modelReference || productName || 'DEVICE';
  const shortCode = deriveShortCode(ref);

  // Find highest existing sequence for this product's short code
  let maxSeq = 0;
  for (const f of existingFeatures) {
    if (f.id) {
      const seq = extractSequence(f.id);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `FEAT-${shortCode}-${nextSeq}`;
}

/**
 * Ensures all features in the array have a stable ID.
 * Returns [updatedFeatures, didChange] so callers can persist if needed.
 */
export function ensureFeatureIds(
  features: KeyFeature[],
  modelReference?: string,
  productName?: string,
): [KeyFeature[], boolean] {
  let changed = false;
  const ref = modelReference || productName || 'DEVICE';
  const shortCode = deriveShortCode(ref);

  // Find max existing sequence
  let maxSeq = 0;
  for (const f of features) {
    if (f.id) {
      const seq = extractSequence(f.id);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  const result = features.map(f => {
    if (f.id) return f;
    changed = true;
    maxSeq++;
    return { ...f, id: `FEAT-${shortCode}-${String(maxSeq).padStart(3, '0')}` };
  });

  return [result, changed];
}
