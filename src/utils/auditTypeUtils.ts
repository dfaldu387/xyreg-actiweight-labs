
export type AuditorType = "internal" | "external" | "third-party" | "all";
export type AuditCategoryType = "qms" | "product" | "supply-chain" | "regulatory" | "post-market" | "all";

/** @deprecated Use AuditCategoryType instead */
export type ScopeType = AuditCategoryType;

// Cache for audit metadata
let auditMetadataCache: any[] = [];

export const setAuditMetadataCache = (metadata: any[]) => {
  auditMetadataCache = metadata;
};

export const matchesAuditorTypeFilter = (auditType: string, filter: AuditorType): boolean => {
  if (filter === "all") return true;
  
  // Try metadata cache first
  const metadata = auditMetadataCache.find(
    (m: any) => m.audit_type?.toLowerCase() === auditType.toLowerCase()
  );
  
  if (metadata?.auditor_type) {
    const auditorType = metadata.auditor_type.toLowerCase();
    switch (filter) {
      case "internal":
        return auditorType.includes("internal");
      case "external":
        return auditorType.includes("external");
      case "third-party":
        return auditorType.includes("nb") || auditorType.includes("third");
      default:
        return false;
    }
  }
  
  // Fallback to keyword matching
  const lowerAuditType = auditType.toLowerCase();
  
  switch (filter) {
    case "internal":
      return lowerAuditType.includes("internal");
    case "external":
      return lowerAuditType.includes("external") && !lowerAuditType.includes("internal");
    case "third-party":
      return lowerAuditType.includes("third") || lowerAuditType.includes("3rd") || lowerAuditType.includes("notified");
    default:
      return false;
  }
};

const CATEGORY_KEYWORDS: Record<Exclude<AuditCategoryType, "all">, string[]> = {
  "qms": ["management", "system", "document", "training", "equipment", "facility", "calibration", "iso"],
  "product": ["design", "risk", "technical", "software", "sterilization", "packaging", "labeling"],
  "supply-chain": ["supplier"],
  "regulatory": ["regulatory", "notified", "fda", "ce marking", "compliance", "certification", "inspection"],
  "post-market": ["post-market", "surveillance", "clinical", "corrective", "capa", "pms"],
};

const CATEGORY_METADATA_KEYWORDS: Record<Exclude<AuditCategoryType, "all">, string[]> = {
  "qms": ["qms", "management", "organization", "org"],
  "product": ["product", "design"],
  "supply-chain": ["supply", "supplier"],
  "regulatory": ["regulatory", "compliance"],
  "post-market": ["post-market", "surveillance"],
};

export const matchesCategoryFilter = (auditType: string, filter: AuditCategoryType): boolean => {
  if (filter === "all") return true;
  
  // Try metadata cache first (applies_to field)
  const metadata = auditMetadataCache.find(
    (m: any) => m.audit_type?.toLowerCase() === auditType.toLowerCase()
  );
  
  if (metadata?.applies_to) {
    const appliesTo = metadata.applies_to.toLowerCase();
    const metaKeywords = CATEGORY_METADATA_KEYWORDS[filter];
    if (metaKeywords?.some(kw => appliesTo.includes(kw))) {
      return true;
    }
  }
  
  // Fallback to keyword matching on audit type name
  const lowerAuditType = auditType.toLowerCase();
  const keywords = CATEGORY_KEYWORDS[filter];
  return keywords?.some(kw => lowerAuditType.includes(kw)) ?? false;
};

/** @deprecated Use matchesCategoryFilter instead */
export const matchesScopeFilter = matchesCategoryFilter;

export const matchesLifecyclePhaseFilter = (auditType: string, phase: string): boolean => {
  if (phase === "all") return true;
  
  const lowerAuditType = auditType.toLowerCase();
  const lowerPhase = phase.toLowerCase();
  
  // Map common audit types to lifecycle phases
  const phaseMapping: Record<string, string[]> = {
    "design": ["design", "development"],
    "development": ["design", "development"],
    "testing": ["verification", "validation", "testing"],
    "validation": ["verification", "validation", "testing"],
    "production": ["production", "manufacturing"],
    "manufacturing": ["production", "manufacturing"],
    "post-market": ["post-market", "surveillance"],
    "surveillance": ["post-market", "surveillance"]
  };
  
  const relevantPhases = phaseMapping[lowerPhase] || [lowerPhase];
  
  return relevantPhases.some(p => lowerAuditType.includes(p));
};

export const filterAuditTypes = (
  auditTypes: string[], 
  categoryFilter: AuditCategoryType, 
  lifecyclePhaseFilter: string, 
  auditorTypeFilter: AuditorType
): string[] => {
  return auditTypes.filter(auditType => {
    // Apply category filter
    if (categoryFilter !== "all" && !matchesCategoryFilter(auditType, categoryFilter)) {
      return false;
    }
    
    // Apply lifecycle phase filter
    if (lifecyclePhaseFilter !== "all" && !matchesLifecyclePhaseFilter(auditType, lifecyclePhaseFilter)) {
      return false;
    }
    
    // Apply auditor type filter
    if (auditorTypeFilter !== "all" && !matchesAuditorTypeFilter(auditType, auditorTypeFilter)) {
      return false;
    }
    
    return true;
  });
};

export const getAuditorTypeForAudit = (auditType: string): "internal" | "external" | "both" => {
  const lowerAuditType = auditType.toLowerCase();
  
  if (lowerAuditType.includes("internal")) {
    return "internal";
  } else if (lowerAuditType.includes("external") || lowerAuditType.includes("third") || lowerAuditType.includes("3rd")) {
    return "external";
  } else {
    return "both";
  }
};

/** @deprecated Use category filter instead */
export const getAuditScope = (auditType: string): "company" | "product" | "both" => {
  const lowerAuditType = auditType.toLowerCase();
  
  if (lowerAuditType.includes("company") || 
      lowerAuditType.includes("organization") || 
      lowerAuditType.includes("management") ||
      lowerAuditType.includes("system")) {
    return "company";
  } else if (lowerAuditType.includes("product") || 
             lowerAuditType.includes("design") ||
             lowerAuditType.includes("technical")) {
    return "product";
  } else {
    return "both";
  }
};
