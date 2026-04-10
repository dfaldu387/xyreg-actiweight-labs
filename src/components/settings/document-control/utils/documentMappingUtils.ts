
/**
 * Maps database status values to allowed PhaseDocument status types
 */
export const mapToAllowedStatus = (status: any): "Completed" | "In Progress" | "Not Started" | "Not Required" | "Pending" | "Overdue" => {
  if (typeof status !== 'string') {
    return "Not Started";
  }
  
  const normalizedStatus = status.trim();
  
  switch (normalizedStatus) {
    case "Completed":
      return "Completed";
    case "In Progress":
      return "In Progress";
    case "Not Required":
      return "Not Required";
    case "Pending":
      return "Pending";
    case "Overdue":
      return "Overdue";
    case "Not Started":
    default:
      return "Not Started";
  }
};

/**
 * Maps database document_type values to allowed types
 */
export const mapToAllowedType = (type: any): string => {
  if (typeof type !== 'string') {
    return "Standard";
  }
  
  const normalizedType = type.trim();
  
  // List of common document types
  // Backward compatibility: map legacy "Core" to "Governance"
  if (normalizedType.toLowerCase() === "core") {
    return "Governance";
  }

  const allowedTypes = [
    "Standard", 
    "Regulatory", 
    "Technical", 
    "Clinical",
    "Quality",
    "Manufacturing",
    "Design",
    "Governance"
  ];
  
  return allowedTypes.includes(normalizedType) ? normalizedType : "Standard";
};

/**
 * Maps database status to DocumentItem status type
 */
export const mapToDocumentItemStatus = (status: any): "Draft" | "Under Review" | "Approved" => {
  if (typeof status !== 'string') {
    return "Draft";
  }
  
  const normalizedStatus = status.trim();
  
  switch (normalizedStatus) {
    case "Approved":
      return "Approved";
    case "Under Review":
      return "Under Review";
    case "Rejected": // Map rejected to draft for compatibility
    case "Draft":
    default:
      return "Draft";
  }
};

/**
 * Safely processes array data from database
 */
export const safeArrayProcess = (arrayData: any): string[] => {
  if (!arrayData) {
    return [];
  }
  
  if (Array.isArray(arrayData)) {
    return arrayData.map(item => String(item));
  }
  
  if (typeof arrayData === 'string') {
    try {
      const parsed = JSON.parse(arrayData);
      return Array.isArray(parsed) ? parsed.map(item => String(item)) : [];
    } catch (error) {
      console.warn("Failed to parse array data:", arrayData, error);
      return [];
    }
  }
  
  return [];
};

/**
 * Valid document tabs for filtering
 */
export const VALID_TABS = [
  "all",
  "standard", 
  "regulatory", 
  "technical", 
  "clinical",
  "quality",
  "manufacturing",
  "design"
];

/**
 * Normalizes document type for filtering
 */
export const normalizeDocumentType = (type: string): string => {
  if (!type) return "standard";
  return type.toLowerCase().trim();
};
