
import { AuditStatus } from "@/types/audit";
import { CompanyAudit, ProductAudit } from "@/types/audit";

/**
 * Calculates the effective status of an audit, automatically setting it to "Overdue"
 * if the deadline has passed and the audit is still in "Planned" status
 */
export const calculateEffectiveAuditStatus = (
  audit: CompanyAudit | ProductAudit
): AuditStatus => {
  // If no deadline is set, return the current status
  if (!audit.deadline_date) {
    return audit.status;
  }

  const today = new Date();
  const deadline = new Date(audit.deadline_date);
  
  // Reset time to compare just dates
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);

  // If the deadline has passed and the audit is still "Planned", mark as "Overdue"
  if (deadline < today && audit.status === "Planned") {
    return "Overdue";
  }

  return audit.status;
};

/**
 * Updates an audit object with its effective status
 */
export const withEffectiveStatus = <T extends CompanyAudit | ProductAudit>(
  audit: T
): T => {
  return {
    ...audit,
    status: calculateEffectiveAuditStatus(audit)
  };
};
