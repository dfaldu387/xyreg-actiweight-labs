/**
 * Translation staleness helpers.
 *
 * A translated document is considered "out of date" when its source (English
 * master) was updated after the translation was last synced.
 *
 * Source-of-truth columns on `phase_assigned_document_template`:
 *  - `language_code`         marks the row as a translation (e.g. "NO")
 *  - `source_document_id`    points to the master CI
 *  - `translation_synced_at` set when the translation is created and bumped
 *                            whenever the user clicks "Mark re-translated".
 */

export interface TranslationStaleInputs {
  language_code?: string | null;
  source_document_id?: string | null;
  translation_synced_at?: string | null;
}

/**
 * Returns true when the translation needs to be re-synced because its
 * master document was updated more recently than the last sync timestamp.
 */
export function isTranslationStale(
  translation: TranslationStaleInputs | null | undefined,
  sourceUpdatedAt: string | null | undefined,
): boolean {
  if (!translation) return false;
  if (!translation.language_code || !translation.source_document_id) return false;
  if (!sourceUpdatedAt) return false;
  // If the translation has never been marked synced, treat it as stale so the
  // user is prompted to confirm it is in sync.
  if (!translation.translation_synced_at) return true;
  const synced = new Date(translation.translation_synced_at).getTime();
  const source = new Date(sourceUpdatedAt).getTime();
  if (Number.isNaN(synced) || Number.isNaN(source)) return false;
  // Allow a 2-second skew so that the timestamp set immediately after a
  // create/sync is never considered stale due to clock jitter.
  return source - synced > 2000;
}
