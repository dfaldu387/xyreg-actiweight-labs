import { mdrAnnexIChecklist } from "@/data/mdrAnnexIChecklist";

export interface PredefinedQuestion {
  id: string;
  clause: string;
  requirement: string;
  category: "documentation" | "verification" | "compliance";
  description?: string;
}

/**
 * Extract predefined questions for a specific GSPR clause
 */
export function getPredefinedQuestions(clauseId: string): PredefinedQuestion[] {
  const gsprItem = mdrAnnexIChecklist.find(item => item.clauseId === clauseId);
  
  if (!gsprItem) {
    return [];
  }

  return gsprItem.checklist.map(item => ({
    id: item.id,
    clause: item.clause,
    requirement: item.requirement,
    category: item.category as "documentation" | "verification" | "compliance",
    description: item.description
  }));
}

/**
 * Get all available GSPR clauses
 */
export function getAvailableGSPRClauses(): Array<{ clauseId: string; summary: string }> {
  return mdrAnnexIChecklist.map(item => ({
    clauseId: item.clauseId,
    summary: item.summary
  }));
}

/**
 * Extract clause ID from a requirement string (e.g., "GSPR.1 - Document..." -> "GSPR.1")
 */
export function extractClauseId(requirement: string): string | null {
  const match = requirement.match(/^(GSPR\.\d+)/);
  return match ? match[1] : null;
}

/**
 * Generate smart suggestions based on evidence type and GSPR clause
 */
export function getSmartSuggestions(
  evidenceType: "Documentation" | "Verification" | "Compliance",
  clauseId?: string
): string[] {
  const predefinedQuestions = clauseId ? getPredefinedQuestions(clauseId) : [];
  
  // Filter questions by evidence type
  const relevantQuestions = predefinedQuestions
    .filter(q => q.category.toLowerCase() === evidenceType.toLowerCase())
    .map(q => q.requirement);

  // Generic fallback suggestions
  const genericSuggestions: Record<string, string[]> = {
    'Documentation': [
      'Technical documentation',
      'Design specifications',
      'User manual',
      'Risk management file',
      'Clinical evaluation report',
      'Post-market surveillance data',
      'Labeling and instructions',
      'Standards compliance documentation'
    ],
    'Verification': [
      'Test results',
      'Audit report',
      'Inspection findings',
      'Performance validation',
      'Clinical study results',
      'Post-market data analysis'
    ],
    'Compliance': [
      'Regulatory approval',
      'Certificate of conformity',
      'Declaration of conformity',
      'Standards compliance certificate',
      'Quality system certification'
    ]
  };

  // Combine predefined questions with generic suggestions
  const suggestions = [...relevantQuestions, ...genericSuggestions[evidenceType]];
  
  // Remove duplicates and return first 8
  return [...new Set(suggestions)].slice(0, 8);
}