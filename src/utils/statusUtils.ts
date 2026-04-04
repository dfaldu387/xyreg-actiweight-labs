import { cn } from "@/lib/utils";
import { GapAnalysisItem, LifecycleDocument } from "@/types/client";

export type DocumentUIStatus = "Not Started" | "In Review" | "Approved" | "Rejected" | "N/A" | "Report";

export const mapDBStatusToUI = (status?: string): DocumentUIStatus => {
  if (!status) return "Not Started";
  switch (status) {
    case "Approved":
      return "Approved";
    case "Report":
      return "Report";
    case "Rejected":
      return "Rejected";
    case "Not Started":
      return "Not Started";
    case "In Review":
      return "In Review";
    case "N/A":
      return "N/A";
    default:
      return "Not Started";
  }
};

// Map UI status values back to database status values
export const mapUIStatusToDocument = (uiStatus: DocumentUIStatus): string => {
  switch (uiStatus) {
    case "Not Started":
      return "Not Started";
    case "In Review":
      return "In Review";
    case "Approved":
      return "Approved";
    case "Report":
      return "Report";
    case "Rejected":
      return "Rejected";
    case "N/A":
      return "Not Required";
    default:
      return "Not Started";
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "On Track":
    case "Valid":
    case "Approved":
    case "Completed":
      return "bg-success text-success-foreground";
    case "At Risk":
    case "Expired":
    case "Overdue":
      return "bg-destructive text-destructive-foreground";
    case "Needs Attention":
    case "Expiring":
    case "Pending":
    case "Scheduled":
    case "Unscheduled":
      return "bg-warning text-warning-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

export const getDocumentStatusColor = (status: LifecycleDocument["status"]) => {
  switch (status) {
    case "Completed":
      return "bg-success text-success-foreground";
    case "In Progress":
      return "bg-warning text-warning-foreground";
    case "Not Started":
      return "bg-muted text-muted-foreground";
    case "Not Required":
      return "bg-secondary text-secondary-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

export const getGapStatusColor = (status: GapAnalysisItem["status"]) => {
  switch (status) {
    case "compliant":
      return "bg-success text-success-foreground";
    case "partially_compliant":
      return "bg-warning text-warning-foreground";
    case "non_compliant":
      return "bg-destructive text-destructive-foreground";
    case "not_applicable":
      return "bg-secondary text-secondary-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

export const getPriorityColor = (priority: GapAnalysisItem["priority"]) => {
  switch (priority) {
    case "high":
      return "text-destructive";
    case "medium":
      return "text-warning";
    case "low":
      return "text-secondary-foreground";
    default:
      return "text-secondary-foreground";
  }
};

export const formatGapStatus = (status: GapAnalysisItem["status"]) => {
  switch (status) {
    case "compliant":
      return "Compliant";
    case "partially_compliant":
      return "Partially Compliant";
    case "non_compliant":
      return "Non-Compliant";
    case "not_applicable":
      return "Not Applicable";
    default:
      return status;
  }
};

// Map database status values to UI status values (exported to be used across components)
export const mapGapStatusToUI = (gapStatus: GapAnalysisItem["status"]): "Open" | "Closed" | "N/A" => {
  
  switch (gapStatus) {
    case "compliant":
      return "Closed";
    case "partially_compliant":
      return "Open"; // Partially compliant is now "Open"
    case "non_compliant":
      return "Open";
    case "not_applicable":
      return "N/A";
    default:
      return "Open";
  }
};

// Map UI status values to database status values (exported to be used across components)
export const mapUIStatusToGap = (uiStatus: "Open" | "Closed" | "N/A"): GapAnalysisItem["status"] => {
  
  switch (uiStatus) {
    case "Open":
      return "non_compliant";
    case "Closed":
      return "compliant";
    case "N/A":
      return "not_applicable";
    default:
      return "non_compliant";
  }
};

export const calculatePhaseProgress = (documents: LifecycleDocument[]): number => {
  if (documents.length === 0) return 0;
  
  const completedCount = documents.filter(doc => doc.status === "Completed").length;
  const inProgressCount = documents.filter(doc => doc.status === "In Progress").length;
  
  return Math.round((completedCount + inProgressCount * 0.5) / documents.length * 100);
};

export const calculateComplianceStats = (gapItems?: GapAnalysisItem[]) => {
  if (!gapItems || gapItems.length === 0) return { compliant: 0, partial: 0, nonCompliant: 0, notApplicable: 0, total: 0, totalCompleted: 0, totalExcludingNA: 0 };
  
  const compliant = gapItems.filter(item => item.status === "compliant").length;
  const partial = gapItems.filter(item => item.status === "partially_compliant").length;
  const nonCompliant = gapItems.filter(item => item.status === "non_compliant").length;
  const notApplicable = gapItems.filter(item => item.status === "not_applicable").length;
  
  // Calculate total excluding not applicable items
  const totalExcludingNA = gapItems.length - notApplicable;
  
  return {
    compliant,
    partial,
    nonCompliant,
    notApplicable,
    total: gapItems.length,
    totalCompleted: compliant,
    totalExcludingNA
  };
};

// Functions for UI display of gap status (compatible with UI display format)
export const getUIGapStatusColor = (status?: string): string => {
  if (!status) return "bg-muted text-muted-foreground border border-muted";
  
  switch (status) {
    case "Open":
      return "bg-destructive/10 text-destructive border border-destructive/20";
    case "In Progress":
      return "bg-warning/10 text-warning border border-warning/20";
    case "Closed":
      return "bg-success/10 text-success border border-success/20";
    default:
      return "bg-muted text-muted-foreground border border-muted";
  }
};

export const getUIPriorityColor = (priority?: string): string => {
  if (!priority) return "";
  
  switch (priority.toLowerCase()) {
    case "high":
      return "text-destructive";
    case "medium":
      return "text-warning";
    case "low":
      return "text-success";
    default:
      return "";
  }
};

export const formatUIGapStatus = (status?: string): string => {
  if (!status) return "Not Started";
  return status;
};

export const calculateUIComplianceStats = (items: any[]) => {
  if (!items || items.length === 0) {
    return { total: 0, compliant: 0, partial: 0, nonCompliant: 0 };
  }
  
  const total = items.length;
  const compliant = items.filter(item => item.status === "Closed").length;
  const partial = items.filter(item => item.status === "In Progress").length;
  const nonCompliant = items.filter(item => item.status === "Open").length;
  
  return { total, compliant, partial, nonCompliant };
};
