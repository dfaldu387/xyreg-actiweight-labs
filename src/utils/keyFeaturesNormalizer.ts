export interface KeyFeature {
  /** Stable, persisted feature ID (e.g. FEAT-G660-001). Generated once at creation, never changes. */
  id?: string;
  name: string;
  isNovel: boolean;
  explanation?: string;
  description?: string;
  tag?: string;
  /** @deprecated Use linkedClinicalBenefits instead */
  clinicalBenefit?: string;
  /** @deprecated Use linkedHazardIds instead */
  associatedRisks?: string;
  linkedClinicalBenefits?: string[];
  /** @deprecated Use linkedUserNeedIds instead — hazard traceability flows through User Need → Requirement → Hazard */
  linkedHazardIds?: string[];
  linkedUserNeedIds?: string[];
  linkedComponentNames?: string[];
}

/**
 * Normalizes key_features from DB (which may be string[] or KeyFeature[])
 * into a consistent KeyFeature[] shape.
 */
export function normalizeKeyFeatures(raw: any): KeyFeature[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((item: any) => {
    if (typeof item === 'string') {
      return { name: item, isNovel: false, explanation: '' };
    }
    if (typeof item === 'object' && item !== null && typeof item.name === 'string') {
      return {
        id: item.id || undefined,
        name: item.name,
        isNovel: !!item.isNovel,
        explanation: item.explanation || '',
        description: item.description || '',
        tag: item.tag || '',
        clinicalBenefit: item.clinicalBenefit || '',
        associatedRisks: item.associatedRisks || '',
        linkedClinicalBenefits: Array.isArray(item.linkedClinicalBenefits) ? item.linkedClinicalBenefits : [],
        linkedHazardIds: Array.isArray(item.linkedHazardIds) ? item.linkedHazardIds : [],
        linkedUserNeedIds: Array.isArray(item.linkedUserNeedIds) ? item.linkedUserNeedIds : [],
        linkedComponentNames: Array.isArray(item.linkedComponentNames) ? item.linkedComponentNames : [],
      };
    }
    return null;
  }).filter(Boolean) as KeyFeature[];
}

/** Extract plain string names for display-only consumers */
export function keyFeatureNames(raw: any): string[] {
  return normalizeKeyFeatures(raw).map(f => f.name);
}
