import type { CompanyDocument } from "@/hooks/useCompanyDocuments";
import { SOP_FUNCTIONAL_SUBPREFIX, parseSopNumber } from "@/constants/sopAutoSeedTiers";

export interface FunctionalCluster {
  key: string;
  label: string;
  /** Tailwind color tokens drawn from the existing 4-color domain system. */
  accentClass: string; // e.g. "border-l-emerald-500"
  badgeClass: string;  // e.g. "bg-emerald-100 text-emerald-900"
  order: number;
}

/**
 * Maps the `{SUB}` segment of `SOP-{SUB}-{NNN}` (and `WI-{SUB}-{NNN}-*`) to a
 * medtech functional cluster. Colors follow the canonical 5-color domain
 * system: Gold (Business), Blue (Operations execution), Teal (Design & Risk
 * "Science"), Green (Quality "Guardrail"), Purple (Clinical & Regulatory
 * "Evidence"). Order follows a stable workflow sequence:
 * Quality → Design → Software → Risk → Manufacturing → Supply Chain →
 * Clinical → Regulatory → Customer Service → Other.
 */
export const FUNCTIONAL_CLUSTERS: Record<string, FunctionalCluster> = {
  QA: { key: "QA", label: "Quality Assurance",     accentClass: "border-l-emerald-500", badgeClass: "bg-emerald-100 text-emerald-900", order: 10 },
  DE: { key: "DE", label: "Design & Development",  accentClass: "border-l-teal-500",    badgeClass: "bg-teal-100 text-teal-900",       order: 20 },
  SW: { key: "SW", label: "Software",              accentClass: "border-l-teal-500",    badgeClass: "bg-teal-100 text-teal-900",       order: 30 },
  RM: { key: "RM", label: "Risk Management",       accentClass: "border-l-teal-500",    badgeClass: "bg-teal-100 text-teal-900",       order: 35 },
  MF: { key: "MF", label: "Manufacturing",         accentClass: "border-l-blue-500",    badgeClass: "bg-blue-100 text-blue-900",       order: 40 },
  SC: { key: "SC", label: "Supply Chain",          accentClass: "border-l-blue-500",    badgeClass: "bg-blue-100 text-blue-900",       order: 50 },
  CL: { key: "CL", label: "Clinical",              accentClass: "border-l-purple-500",  badgeClass: "bg-purple-100 text-purple-900",   order: 60 },
  RA: { key: "RA", label: "Regulatory Affairs",    accentClass: "border-l-purple-500",  badgeClass: "bg-purple-100 text-purple-900",   order: 70 },
  CS: { key: "CS", label: "Customer Service",      accentClass: "border-l-emerald-500", badgeClass: "bg-emerald-100 text-emerald-900", order: 90 },
  XX: { key: "XX", label: "Uncategorized",         accentClass: "border-l-muted",       badgeClass: "bg-muted text-muted-foreground",  order: 990 },
};

export const OTHER_CLUSTER: FunctionalCluster = {
  key: "OTHER",
  label: "Other",
  accentClass: "border-l-muted",
  badgeClass: "bg-muted text-muted-foreground",
  order: 1000,
};

export interface DocClassification {
  clusterKey: string;
  isSOP: boolean;
  isWI: boolean;
  parentKey: string | null; // e.g. "QA-001" — shared between SOP and its WIs
}

export function classifyDocument(doc: Pick<CompanyDocument, "document_number">): DocClassification {
  const num = (doc.document_number || "").toUpperCase();
  const sopMatch = num.match(/^SOP-([A-Z]+)-(\d{3})$/);
  const wiMatch = num.match(/^WI-([A-Z]+)-(\d{3})-\d+$/);
  if (sopMatch) {
    const sub = sopMatch[1];
    return {
      clusterKey: FUNCTIONAL_CLUSTERS[sub]?.key ?? OTHER_CLUSTER.key,
      isSOP: true,
      isWI: false,
      parentKey: `${sub}-${sopMatch[2]}`,
    };
  }
  if (wiMatch) {
    const sub = wiMatch[1];
    return {
      clusterKey: FUNCTIONAL_CLUSTERS[sub]?.key ?? OTHER_CLUSTER.key,
      isSOP: false,
      isWI: true,
      parentKey: `${sub}-${wiMatch[2]}`,
    };
  }
  // Fallback: legacy two-part numbering ("SOP-048" / "WI-048-2") — resolve the
  // functional sub-prefix from the canonical SOP→cluster map so the Grouped
  // view doesn't dump every SOP into "Other".
  const legacySop = num.match(/^SOP-(\d{3})$/);
  if (legacySop) {
    const canonical = `SOP-${legacySop[1]}`;
    const sub = SOP_FUNCTIONAL_SUBPREFIX[canonical];
    return {
      clusterKey: sub ? (FUNCTIONAL_CLUSTERS[sub]?.key ?? OTHER_CLUSTER.key) : OTHER_CLUSTER.key,
      isSOP: true,
      isWI: false,
      parentKey: `${sub ?? "XX"}-${legacySop[1]}`,
    };
  }
  const legacyWi = num.match(/^WI-(\d{3})-\d+$/);
  if (legacyWi) {
    const canonical = `SOP-${legacyWi[1]}`;
    const sub = SOP_FUNCTIONAL_SUBPREFIX[canonical];
    return {
      clusterKey: sub ? (FUNCTIONAL_CLUSTERS[sub]?.key ?? OTHER_CLUSTER.key) : OTHER_CLUSTER.key,
      isSOP: false,
      isWI: true,
      parentKey: `${sub ?? "XX"}-${legacyWi[1]}`,
    };
  }
  // Last resort — try parsing the number out of the title (handles oddly
  // formatted ids like "SOP 048" or "sop_048").
  const fuzzy = parseSopNumber(doc.document_number);
  if (fuzzy) {
    const sub = SOP_FUNCTIONAL_SUBPREFIX[fuzzy];
    if (sub) {
      const numStr = fuzzy.replace(/^SOP-/, "");
      return {
        clusterKey: FUNCTIONAL_CLUSTERS[sub]?.key ?? OTHER_CLUSTER.key,
        isSOP: true,
        isWI: false,
        parentKey: `${sub}-${numStr}`,
      };
    }
  }
  return { clusterKey: OTHER_CLUSTER.key, isSOP: false, isWI: false, parentKey: null };
}

export function getCluster(key: string): FunctionalCluster {
  if (key === OTHER_CLUSTER.key) return OTHER_CLUSTER;
  return FUNCTIONAL_CLUSTERS[key] ?? OTHER_CLUSTER;
}
