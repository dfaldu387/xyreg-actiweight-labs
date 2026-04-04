import { GapAnalysisItem, LifecycleDocument } from "@/types/client";
import { mapGapStatusToUI, mapUIStatusToGap } from "./statusUtils";
import { updateGapItemStatus } from "@/services/gapAnalysisService";
import { supabase } from "@/integrations/supabase/client";

/**
 * Converts document status to gap analysis status
 */
export const documentStatusToGapStatus = (
  docStatus: LifecycleDocument["status"]
): GapAnalysisItem["status"] => {
  switch (docStatus) {
    case "Completed":
      return "compliant";
    case "In Progress":
      return "partially_compliant";
    case "Not Started":
      return "non_compliant";
    case "Not Required":
      return "not_applicable";
    default:
      return "non_compliant";
  }
};

/**
 * Converts gap analysis status to document status
 */
export const gapStatusToDocumentStatus = (
  gapStatus: GapAnalysisItem["status"]
): LifecycleDocument["status"] => {
  switch (gapStatus) {
    case "compliant":
      return "Completed";
    case "partially_compliant":
      return "In Progress";
    case "non_compliant":
      return "Not Started";
    case "not_applicable":
      return "Not Required";
    default:
      return "Not Started";
  }
};

/**
 * Calculates an overall compliance percentage from GapAnalysisItems
 */
export const calculateOverallCompliance = (items: GapAnalysisItem[]): number => {
  if (!items || items.length === 0) return 0;
  
  const totalRelevant = items.filter(
    item => item.status !== "not_applicable"
  ).length;
  
  if (totalRelevant === 0) return 100; // All items are N/A, so we're 100% compliant
  
  const compliant = items.filter(
    item => item.status === "compliant"
  ).length;
  
  const partiallyCompliant = items.filter(
    item => item.status === "partially_compliant"
  ).length;
  
  // Count partially compliant items as 50% complete
  return Math.round(((compliant + (partiallyCompliant * 0.5)) / totalRelevant) * 100);
};

/**
 * Syncs status between a document and related gap items
 */
export const syncDocumentToGapStatus = async (
  documentId: string,
  documentStatus: LifecycleDocument["status"]
): Promise<void> => {
  try {
    // Get all gap items linked to this document
    const { data: links, error } = await supabase
      .from("gap_document_links")
      .select("gap_item_id")
      .eq("document_id", documentId);
      
    if (error) {
      console.error("Error fetching document-gap links:", error);
      return;
    }
    
    // Convert document status to gap status
    const gapStatus = documentStatusToGapStatus(documentStatus);
    
    // Update all linked gap items
    for (const link of links) {
      await updateGapItemStatus(link.gap_item_id, gapStatus);
    }
  } catch (error) {
    console.error("Error syncing document status to gap items:", error);
  }
};

/**
 * Syncs status between an audit and related gap items
 */
export const syncAuditToGapStatus = async (
  auditId: string,
  auditType: 'product' | 'company',
  auditStatus: string
): Promise<void> => {
  try {
    // Get all gap items linked to this audit
    const { data: links, error } = await supabase
      .from("gap_audit_links")
      .select("gap_item_id")
      .eq("audit_id", auditId)
      .eq("audit_type", auditType);
      
    if (error) {
      console.error("Error fetching audit-gap links:", error);
      return;
    }
    
    // Map audit status to gap status
    let gapStatus: GapAnalysisItem["status"];
    switch (auditStatus.toLowerCase()) {
      case "completed":
        gapStatus = "compliant";
        break;
      case "scheduled":
        gapStatus = "partially_compliant";
        break;
      case "unscheduled":
      case "planned":
        gapStatus = "non_compliant";
        break;
      default:
        gapStatus = "partially_compliant";
    }
    
    // Update all linked gap items
    for (const link of links) {
      await updateGapItemStatus(link.gap_item_id, gapStatus);
    }
  } catch (error) {
    console.error("Error syncing audit status to gap items:", error);
  }
};
