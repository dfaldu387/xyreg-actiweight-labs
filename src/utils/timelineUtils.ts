import { ProductPhase, AuditOrReview } from "@/types/client";

export interface TargetPhaseResult {
  targetPhaseId: string;
  position: "before" | "after";
}

export function findTargetPhaseForAudit(phases: ProductPhase[], auditDate: Date): TargetPhaseResult {
  let targetPhaseId = "";
  let position: "before" | "after" = "before";
  
  // Default to the first phase if no better match is found
  if (phases.length > 0) {
    targetPhaseId = phases[0].id;
  }
  
  // Try to find the appropriate phase based on the audit date
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    const nextPhase = phases[i + 1];
    
    if (phase.deadline && auditDate <= phase.deadline) {
      targetPhaseId = phase.id;
      position = "before";
      break;
    } else if (phase.deadline && nextPhase && nextPhase.deadline && 
              auditDate > phase.deadline && auditDate <= nextPhase.deadline) {
      targetPhaseId = nextPhase.id;
      position = "before";
      break;
    } else if (phase.deadline && auditDate > phase.deadline && !nextPhase) {
      targetPhaseId = phase.id;
      position = "after";
      break;
    }
  }
  
  return { targetPhaseId, position };
}

export function calculateOverallProgress(phases: ProductPhase[]): number {
  if (!phases.length) return 0;
  
  const progressPerPhase = phases.map(p =>
    p.status === "Completed" ? 100
    : p.status === "In Progress" ? 50
    : 0
  );
  
  const avg = progressPerPhase.reduce((a, b) => a + b, 0) / progressPerPhase.length;
  return Math.round(avg);
}

// Add findBestMatchIndex function to match phase names
export function findBestMatchIndex(phaseName: string, chosenPhases: any[]): number {
  if (!phaseName || !chosenPhases || chosenPhases.length === 0) return 999;
  
  const lowerPhaseName = phaseName.toLowerCase();
  
  // First try exact match
  const exactMatch = chosenPhases.findIndex(cp => 
    cp.phase && cp.phase.name && cp.phase.name.toLowerCase() === lowerPhaseName
  );
  
  if (exactMatch !== -1) return exactMatch;
  
  // Then try partial match
  for (let i = 0; i < chosenPhases.length; i++) {
    const cp = chosenPhases[i];
    if (cp.phase && cp.phase.name) {
      const cpName = cp.phase.name.toLowerCase();
      if (cpName.includes(lowerPhaseName) || lowerPhaseName.includes(cpName)) {
        return i;
      }
    }
  }
  
  // No match found
  return 999;
}
