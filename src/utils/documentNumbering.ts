/**
 * Document number helpers for translation lineage.
 * A translated copy gets the source's number with an ISO 3166-1 alpha-2 suffix,
 * e.g. SOP-QA-004 -> SOP-QA-004-FI.
 */

export function appendLanguageSuffix(baseNumber: string | null | undefined, langCode: string): string {
  const base = (baseNumber || "").trim();
  const code = (langCode || "").trim().toUpperCase();
  if (!code) return base;
  if (!base) return `-${code}`;
  // Avoid double-suffixing if already ends with -XX
  if (/-[A-Z]{2}$/.test(base)) return base.replace(/-[A-Z]{2}$/, `-${code}`);
  return `${base}-${code}`;
}

export const TRANSLATION_LANGUAGES: { code: string; label: string }[] = [
  { code: "FI", label: "Finnish (Suomi)" },
  { code: "SV", label: "Swedish (Svenska)" },
  { code: "NO", label: "Norwegian (Norsk)" },
  { code: "DA", label: "Danish (Dansk)" },
  { code: "DE", label: "German (Deutsch)" },
  { code: "FR", label: "French (Français)" },
  { code: "ES", label: "Spanish (Español)" },
  { code: "IT", label: "Italian (Italiano)" },
];