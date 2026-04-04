/**
 * Maps database phase names to budget help data keys
 */
export function mapPhaseToBudgetKey(phaseName: string): string | null {
  const normalizedPhase = phaseName.toLowerCase().trim();
  
  // Handle numbered phases from database like "(01) Concept & Feasibility"
  if (normalizedPhase.includes('concept') && normalizedPhase.includes('feasibility')) {
    return "1. Concept & Feasibility";
  }
  
  if (normalizedPhase.includes('design') && normalizedPhase.includes('development')) {
    return "2. Design & Development";
  }
  
  if (normalizedPhase.includes('verification') && normalizedPhase.includes('validation')) {
    return "3. Verification & Validation";
  }
  
  if (normalizedPhase.includes('clinical') && normalizedPhase.includes('validation')) {
    return "4. Clinical Validation";
  }
  
  if (normalizedPhase.includes('regulatory') && normalizedPhase.includes('submission')) {
    return "5. Regulatory Submission";
  }
  
  if (normalizedPhase.includes('design transfer') || (normalizedPhase.includes('transfer') && normalizedPhase.includes('launch'))) {
    return "6. Design Transfer & Launch";
  }
  
  if (normalizedPhase.includes('post-market') || normalizedPhase.includes('surveillance')) {
    return "7. Post-Market Surveillance";
  }
  
  return null;
}