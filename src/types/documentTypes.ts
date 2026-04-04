
// Updated to match the standardized values
export type DocumentTechApplicability = "All device types" | "Software devices" | "Hardware devices" | "Combination devices" | "Implantable devices";

export type TechApplicability = DocumentTechApplicability;

// Add missing user role types
export type UserRole = "super_admin" | "admin" | "editor" | "viewer" | "reviewer" | "consultant" | "author";

// Add missing permission level type
export type PermissionLevel = "A" | "E" | "V";

// Add missing device class by market type
export type DeviceClassByMarket = {
  [market: string]: string[];
};

// Add missing reviewer type
export type ReviewerType = "internal" | "external" | "none";

/**
 * Note: The following legacy types are no longer used after Phase 2 migration:
 * - UserRoleTable (user_roles table removed)
 * - DocumentTechType (document_tech_types table removed)
 * - DachEntry (dach table removed)
 */
