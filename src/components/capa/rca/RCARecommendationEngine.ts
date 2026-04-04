// RCA Recommendation Engine - Risk-Proportional Method Selection
// Implements the Helix RCA Decision Tree for QMSR compliance

import { RCAMethodology, calculateRiskLevel } from '@/types/capa';
import { ProblemComplexity } from '@/types/rcaData';

export interface RCARecommendation {
  primary: RCAMethodology;
  secondary?: RCAMethodology;
  reason: string;
  qmsrJustification: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | null;
}

/**
 * The Helix RCA Decision Tree
 * 
 * | Problem Type                    | Risk Level     | Recommended Method              |
 * |---------------------------------|----------------|----------------------------------|
 * | Simple/Linear                   | Low            | 5 Whys                          |
 * | Multi-Variable                  | Medium         | Fishbone (Ishikawa)             |
 * | Complex System Failure          | High/Critical  | Fault Tree Analysis (FTA)       |
 * | Recurring Pattern               | Any            | Pareto Analysis                 |
 */
export function getRecommendedMethodologies(
  severity: number | null,
  probability: number | null,
  complexity: ProblemComplexity | null
): RCARecommendation {
  const riskLevel = calculateRiskLevel(severity, probability);
  
  // If no complexity is selected, provide a default recommendation based on risk alone
  if (!complexity) {
    return getDefaultRecommendation(riskLevel);
  }

  // Recurring Pattern - always recommend Pareto first
  if (complexity === 'recurring') {
    return {
      primary: 'pareto',
      secondary: '5_whys',
      reason: 'Recurring patterns require Pareto analysis to identify the 20% of causes creating 80% of issues, followed by 5 Whys to drill into each vital few.',
      qmsrJustification: 'Per QMSR/ISO 13485:2016, recurring non-conformances require systematic trending analysis. Pareto analysis provides documented evidence of pattern identification before root cause investigation.',
      riskLevel
    };
  }

  // Complex System Failure - recommend FTA for High/Critical risk
  if (complexity === 'complex') {
    if (riskLevel === 'critical' || riskLevel === 'high') {
      return {
        primary: 'fta',
        secondary: 'fishbone',
        reason: 'Complex system failures with high/critical risk require Fault Tree Analysis to map Boolean logic paths. Fishbone supports initial brainstorming.',
        qmsrJustification: 'Per QMSR/ISO 13485:2016 Clause 8.5.2, high-risk system failures require a systematic method to identify all possible failure paths. FTA provides the required Boolean logic analysis for life-critical failures.',
        riskLevel
      };
    }
    // Complex but Medium/Low risk
    return {
      primary: 'fishbone',
      secondary: 'fta',
      reason: 'Complex system issues at medium risk benefit from Fishbone for comprehensive cause categorization, with optional FTA for critical paths.',
      qmsrJustification: 'Per QMSR/ISO 13485:2016, system-level failures require multi-category analysis. Fishbone (Ishikawa) ensures all 6Ms are evaluated systematically.',
      riskLevel
    };
  }

  // Multi-Variable - recommend Fishbone
  if (complexity === 'multi') {
    return {
      primary: 'fishbone',
      secondary: '5_whys',
      reason: 'Multi-variable problems require Fishbone analysis to ensure no cause category is missed. 5 Whys can drill into specific branches.',
      qmsrJustification: 'Per QMSR/ISO 13485:2016, multi-factor non-conformances require structured analysis. Fishbone (Ishikawa) forces examination of all 6M categories to ensure comprehensive investigation.',
      riskLevel
    };
  }

  // Simple/Linear - recommend 5 Whys
  if (complexity === 'simple') {
    if (riskLevel === 'critical' || riskLevel === 'high') {
      // Even simple problems at high risk should consider additional methods
      return {
        primary: '5_whys',
        secondary: 'fishbone',
        reason: 'While the problem appears simple, high risk warrants additional validation. Start with 5 Whys, consider Fishbone to ensure nothing is missed.',
        qmsrJustification: 'Per QMSR/ISO 13485:2016, high-risk events require proportionate investigation. 5 Whys provides efficient root cause identification; secondary Fishbone ensures no contributing factors are overlooked.',
        riskLevel
      };
    }
    return {
      primary: '5_whys',
      reason: 'Simple, linear problems with low risk are efficiently addressed with 5 Whys methodology.',
      qmsrJustification: 'Per QMSR/ISO 13485:2016, investigation methods should be proportionate to risk. 5 Whys is an appropriate, efficient method for low-complexity, low-risk non-conformances.',
      riskLevel
    };
  }

  return getDefaultRecommendation(riskLevel);
}

function getDefaultRecommendation(riskLevel: 'critical' | 'high' | 'medium' | 'low' | null): RCARecommendation {
  if (riskLevel === 'critical' || riskLevel === 'high') {
    return {
      primary: 'fishbone',
      secondary: 'fta',
      reason: 'High/Critical risk detected. Fishbone recommended for comprehensive analysis with FTA available for complex paths.',
      qmsrJustification: 'Per QMSR/ISO 13485:2016, high-risk non-conformances require systematic investigation methods. Please classify the problem type for a more specific recommendation.',
      riskLevel
    };
  }
  if (riskLevel === 'medium') {
    return {
      primary: 'fishbone',
      reason: 'Medium risk detected. Fishbone analysis recommended to ensure all cause categories are examined.',
      qmsrJustification: 'Per QMSR/ISO 13485:2016, moderate risk requires structured analysis. Please classify the problem type for a more specific recommendation.',
      riskLevel
    };
  }
  return {
    primary: '5_whys',
    reason: 'Low risk or not yet assessed. 5 Whys provides efficient initial investigation.',
    qmsrJustification: 'Please complete risk assessment and problem classification for risk-proportionate RCA method recommendation per QMSR/ISO 13485:2016.',
    riskLevel
  };
}

/**
 * Check if user's selection matches or exceeds recommendation
 */
export function isRecommendationFollowed(
  selectedMethods: RCAMethodology[],
  recommendation: RCARecommendation
): { followed: boolean; reason?: string } {
  if (selectedMethods.length === 0) {
    return { followed: false, reason: 'No RCA methodology selected' };
  }

  if (selectedMethods.includes(recommendation.primary)) {
    return { followed: true };
  }

  // Check if a "stronger" method was selected (FTA > Fishbone > 5 Whys for complex issues)
  const methodStrength: Record<RCAMethodology, number> = {
    'fta': 4,
    'fishbone': 3,
    'pareto': 3,
    '5_whys': 2,
    'other': 1
  };

  const primaryStrength = methodStrength[recommendation.primary];
  const selectedStrengths = selectedMethods.map(m => methodStrength[m]);
  const maxSelectedStrength = Math.max(...selectedStrengths);

  if (maxSelectedStrength >= primaryStrength) {
    return { 
      followed: true, 
      reason: `Selected method(s) meet or exceed recommended rigor` 
    };
  }

  return { 
    followed: false, 
    reason: `Recommended: ${recommendation.primary}. Selected methods may be insufficient for this risk level.` 
  };
}

/**
 * Generate audit trail text for CAPA record
 */
export function generateRCASelectionAuditText(
  recommendation: RCARecommendation,
  selectedMethods: RCAMethodology[],
  overrideReason?: string
): string {
  const { followed, reason } = isRecommendationFollowed(selectedMethods, recommendation);
  
  const baseText = `Based on ${recommendation.riskLevel?.toUpperCase() || 'unknown'} risk level, Helix OS recommended ${recommendation.primary}${recommendation.secondary ? ` with optional ${recommendation.secondary}` : ''}.`;
  
  if (followed) {
    return `${baseText} The user accepted this recommendation by selecting: ${selectedMethods.join(', ')}. ${recommendation.qmsrJustification}`;
  }
  
  return `${baseText} The user overrode this recommendation by selecting: ${selectedMethods.join(', ')}. Override reason: ${overrideReason || 'Not provided'}. Original justification: ${recommendation.qmsrJustification}`;
}
