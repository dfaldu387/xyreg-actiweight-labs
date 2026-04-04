/**
 * RBR (Risk-Based Rationale) Recommendation Engine
 * 
 * Centralized logic for generating risk-proportionate recommendations
 * across all 9 RBR node types as required by FDA QMSR (effective Feb 2, 2026).
 */

import type { SeverityOfHarm } from '@/types/riskBasedRationale';

// ============= Sample Size Recommendations =============

export interface SampleSizeRecommendation {
  recommendedN: number;
  confidenceLevel: string;
  statisticalMethod: string;
  rationale: string;
  qmsrJustification: string;
}

/**
 * Get recommended sample size based on failure mode severity.
 * Uses binomial sampling tables for zero-defect acceptance.
 */
export function getSampleSizeRecommendation(
  severity: SeverityOfHarm,
  failureMode: string
): SampleSizeRecommendation {
  // Sample size table based on confidence/reliability and severity
  const recommendations: Record<SeverityOfHarm, SampleSizeRecommendation> = {
    Critical: {
      recommendedN: 59,
      confidenceLevel: '95/95',
      statisticalMethod: 'Binomial (Zero Defects)',
      rationale: `For a Critical failure mode ("${failureMode}"), a 95% confidence / 95% reliability level is required to ensure patient safety. Using binomial sampling with zero acceptance criteria, n=59 units must pass testing.`,
      qmsrJustification: 'Per QMSR Clause 7.3.6, statistical techniques shall be proportionate to the risk. Critical severity mandates maximum statistical rigor.',
    },
    Major: {
      recommendedN: 32,
      confidenceLevel: '90/90',
      statisticalMethod: 'Binomial (Zero Defects)',
      rationale: `For a Major failure mode ("${failureMode}"), a 90% confidence / 90% reliability level is appropriate. This balances verification rigor with practical sample availability.`,
      qmsrJustification: 'Per QMSR Clause 7.3.6, Major severity justifies 90/90 confidence/reliability using recognized statistical sampling methods.',
    },
    Minor: {
      recommendedN: 15,
      confidenceLevel: '80/80',
      statisticalMethod: 'Binomial (Zero Defects)',
      rationale: `For a Minor failure mode ("${failureMode}"), an 80% confidence / 80% reliability level is sufficient. The lower risk justifies reduced sample size while maintaining statistical validity.`,
      qmsrJustification: 'Per QMSR Clause 7.3.6, Minor severity allows proportionately reduced verification effort per risk-based thinking principles.',
    },
  };

  return recommendations[severity];
}

// ============= Design Change Classification =============

export interface DesignChangeRecommendation {
  classification: 'Minor' | 'Major';
  clinicalDataRequired: boolean;
  regulatorySubmissionRequired: boolean;
  rationale: string;
  qmsrJustification: string;
}

/**
 * Get recommended design change classification based on affected outputs and risk.
 */
export function getDesignChangeClassification(
  affectedOutputs: string[],
  riskImpact: 'critical' | 'high' | 'medium' | 'low',
  changesIntendedUse: boolean = false,
  affectsPerformance: boolean = false
): DesignChangeRecommendation {
  const outputCount = affectedOutputs.length;
  const isMajor = 
    riskImpact === 'critical' || 
    riskImpact === 'high' || 
    outputCount > 3 ||
    changesIntendedUse ||
    affectsPerformance;

  const clinicalDataRequired = changesIntendedUse || (isMajor && riskImpact === 'critical');
  const regulatorySubmissionRequired = changesIntendedUse || clinicalDataRequired;

  if (isMajor) {
    return {
      classification: 'Major',
      clinicalDataRequired,
      regulatorySubmissionRequired,
      rationale: `This change is classified as Major because it ${riskImpact === 'critical' || riskImpact === 'high' ? 'has significant risk impact' : ''}${outputCount > 3 ? 'affects multiple design outputs (' + outputCount + ')' : ''}${changesIntendedUse ? 'changes the intended use' : ''}${affectsPerformance ? 'affects device performance characteristics' : ''}. Full re-validation is required.`,
      qmsrJustification: 'Per QMSR Clause 7.3.9, design changes affecting safety/performance require full evaluation and re-verification.',
    };
  }

  return {
    classification: 'Minor',
    clinicalDataRequired: false,
    regulatorySubmissionRequired: false,
    rationale: `This change is classified as Minor because it affects ${outputCount} design output(s) with ${riskImpact} risk impact, does not change intended use, and does not affect device performance. Standard change control documentation is sufficient.`,
    qmsrJustification: 'Per QMSR Clause 7.3.9, changes not affecting safety, intended use, or performance may be processed as minor changes with appropriate documentation.',
  };
}

// ============= Training Method Recommendations =============

export interface TrainingMethodRecommendation {
  recommendedMethod: 'Written Quiz' | 'Practical Demonstration' | 'On-the-Job Observation';
  rationale: string;
  qmsrJustification: string;
}

/**
 * Get recommended training effectiveness verification method based on quality risk.
 */
export function getTrainingMethodRecommendation(
  riskToQuality: 'High' | 'Medium' | 'Low',
  isManualProcess: boolean = false,
  requiresSpecialEquipment: boolean = false
): TrainingMethodRecommendation {
  // Practical demonstration required for high risk or manual/equipment-dependent tasks
  if (riskToQuality === 'High' || isManualProcess || requiresSpecialEquipment) {
    return {
      recommendedMethod: 'Practical Demonstration',
      rationale: `${riskToQuality} risk to product quality${isManualProcess ? ', manual process involvement' : ''}${requiresSpecialEquipment ? ', specialized equipment usage' : ''} requires observable competency verification through practical demonstration.`,
      qmsrJustification: 'Per QMSR Clause 6.2, competence for quality-critical activities must be demonstrated through appropriate means proportionate to the risk.',
    };
  }

  if (riskToQuality === 'Medium') {
    return {
      recommendedMethod: 'On-the-Job Observation',
      rationale: 'Medium risk to product quality allows for supervised on-the-job observation as the competency verification method, balancing thoroughness with practical implementation.',
      qmsrJustification: 'Per QMSR Clause 6.2, observed performance in the work environment provides adequate evidence of competence for medium-risk activities.',
    };
  }

  return {
    recommendedMethod: 'Written Quiz',
    rationale: 'Low risk to product quality allows for written knowledge assessment as the competency verification method. Cognitive understanding is sufficient for this activity.',
    qmsrJustification: 'Per QMSR Clause 6.2, knowledge-based verification is appropriate for low-risk activities where procedural understanding is the primary competency requirement.',
  };
}

// ============= CAPA Promotion Recommendations =============

export interface CAPAPromotionRecommendation {
  shouldPromote: boolean;
  rationale: string;
  qmsrJustification: string;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
}

/**
 * Get recommendation on whether to promote an NCR/event to full CAPA.
 * This is a HIGH-SCRUTINY node for FDA inspectors.
 */
export function getCAPAPromotionRecommendation(
  severity: number,
  probability: number,
  isRecurring: boolean,
  similarEventsCount: number = 0
): CAPAPromotionRecommendation {
  const rpn = severity * probability;
  
  // Calculate risk level
  let riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  if (rpn >= 20 || severity >= 5) riskLevel = 'Critical';
  else if (rpn >= 15 || severity >= 4) riskLevel = 'High';
  else if (rpn >= 10) riskLevel = 'Medium';
  else riskLevel = 'Low';

  // Decision logic - these conditions REQUIRE CAPA
  const mustPromote = 
    rpn >= 15 ||           // High RPN
    severity >= 4 ||       // Critical/Catastrophic severity
    isRecurring ||         // Recurring issue
    similarEventsCount >= 3; // Pattern of similar events

  if (mustPromote) {
    let reason = '';
    if (rpn >= 15) reason = `Risk Priority Number (${rpn}) exceeds threshold of 15`;
    else if (severity >= 4) reason = `Severity level (${severity}) indicates potential for serious patient harm`;
    else if (isRecurring) reason = 'This is a recurring issue requiring systemic correction';
    else if (similarEventsCount >= 3) reason = `Pattern detected: ${similarEventsCount} similar events indicate systemic issue`;

    return {
      shouldPromote: true,
      rationale: `CAPA initiation is REQUIRED. ${reason}. A correction-only response is not sufficient to address the root cause and prevent recurrence.`,
      qmsrJustification: 'Per QMSR Clause 8.5.2, corrective action shall be taken to eliminate the cause of nonconformities. The risk level and/or recurrence pattern mandates full CAPA investigation.',
      riskLevel,
    };
  }

  // Can use correction only
  return {
    shouldPromote: false,
    rationale: `CAPA NOT required. Risk Priority Number (${rpn}) is below threshold, severity is non-critical, and this is not a recurring issue. Immediate correction with documentation is sufficient.`,
    qmsrJustification: 'Per QMSR Clause 8.3, nonconforming product control through correction is appropriate when risk is low and the issue is isolated. Documented justification supports this risk-proportionate response.',
    riskLevel,
  };
}

// ============= Regulatory Pathway Recommendations =============

export interface PathwayRecommendation {
  recommendedPathway: '510(k)' | 'De Novo' | 'PMA';
  rationale: string;
  qmsrJustification: string;
}

export function getPathwayRecommendation(
  hasPredicateDevice: boolean,
  deviceClass: 'I' | 'II' | 'III',
  isNovelTechnology: boolean
): PathwayRecommendation {
  if (deviceClass === 'III') {
    return {
      recommendedPathway: 'PMA',
      rationale: 'Class III device requires Premarket Approval (PMA) submission with clinical data demonstrating reasonable assurance of safety and effectiveness.',
      qmsrJustification: 'Per 21 CFR 814, Class III devices require PMA unless exempt or subject to 515(b) order.',
    };
  }

  if (!hasPredicateDevice && isNovelTechnology) {
    return {
      recommendedPathway: 'De Novo',
      rationale: 'Novel technology without a legally marketed predicate device. De Novo pathway allows classification for low-to-moderate risk devices with no predicate.',
      qmsrJustification: 'Per 21 CFR 860.260, De Novo classification is appropriate for novel devices that are low-to-moderate risk.',
    };
  }

  return {
    recommendedPathway: '510(k)',
    rationale: 'Device with identified predicate(s) demonstrating substantial equivalence. Traditional or Special 510(k) pathway is appropriate.',
    qmsrJustification: 'Per 21 CFR 807 Subpart E, devices with substantially equivalent predicates qualify for 510(k) premarket notification.',
  };
}

// ============= Software Validation Level Recommendations =============

export interface SoftwareValidationRecommendation {
  validationLevel: 'Full IQ/OQ/PQ' | 'Documented Evaluation' | 'Vendor Audit Only';
  rationale: string;
  qmsrJustification: string;
}

export function getSoftwareValidationRecommendation(
  safetyImpact: 'Direct Impact' | 'Indirect Impact' | 'No Impact',
  softwareType: 'OTS' | 'SOUP' | 'Custom',
  isQMSSoftware: boolean = false
): SoftwareValidationRecommendation {
  if (safetyImpact === 'Direct Impact' || softwareType === 'Custom') {
    return {
      validationLevel: 'Full IQ/OQ/PQ',
      rationale: `${safetyImpact === 'Direct Impact' ? 'Direct safety impact' : 'Custom software'} requires full validation protocol including Installation Qualification (IQ), Operational Qualification (OQ), and Performance Qualification (PQ).`,
      qmsrJustification: 'Per QMSR Clause 7.6 and FDA Guidance on Software Validation, software with direct safety impact requires complete validation lifecycle.',
    };
  }

  if (safetyImpact === 'Indirect Impact' || isQMSSoftware) {
    return {
      validationLevel: 'Documented Evaluation',
      rationale: 'Indirect safety impact or QMS support software requires documented evaluation of vendor claims, version control, and user acceptance testing.',
      qmsrJustification: 'Per QMSR Clause 7.6, COTS/OTS software used in the QMS requires documented evidence of suitability for intended use.',
    };
  }

  return {
    validationLevel: 'Vendor Audit Only',
    rationale: 'No safety impact and general-purpose OTS software. Vendor certification review and periodic audit is sufficient.',
    qmsrJustification: 'Per QMSR risk-based principles, low-risk OTS software validation effort should be proportionate to the risk.',
  };
}

// ============= Clinical Evidence Sufficiency =============

export interface ClinicalEvidenceRecommendation {
  isSufficient: boolean;
  rationale: string;
  qmsrJustification: string;
  additionalDataNeeded?: string;
}

export function getClinicalEvidenceRecommendation(
  deviceClass: 'I' | 'II' | 'III',
  hasEquivalentDeviceData: boolean,
  clinicalDataYears: number,
  isWellEstablishedTechnology: boolean
): ClinicalEvidenceRecommendation {
  if (deviceClass === 'III' && !hasEquivalentDeviceData) {
    return {
      isSufficient: false,
      rationale: 'Class III device without equivalent device clinical data requires new clinical investigation to demonstrate safety and effectiveness.',
      qmsrJustification: 'Per 21 CFR 814.20, PMA applications must contain valid scientific evidence of safety and effectiveness.',
      additionalDataNeeded: 'Clinical investigation with primary endpoints for safety and effectiveness',
    };
  }

  if (deviceClass === 'II' && hasEquivalentDeviceData && isWellEstablishedTechnology) {
    return {
      isSufficient: true,
      rationale: 'Class II device with equivalent device data and well-established technology. Existing clinical evidence from predicate devices and literature is sufficient.',
      qmsrJustification: 'Per FDA Guidance on Clinical Data, Class II devices with substantial equivalence and established clinical use may rely on existing evidence.',
    };
  }

  if (clinicalDataYears > 5 && !isWellEstablishedTechnology) {
    return {
      isSufficient: false,
      rationale: 'Clinical data is over 5 years old and technology is not well-established. Updated clinical evidence or post-market data review is recommended.',
      qmsrJustification: 'Per QMSR Clause 7.3.7, design validation should include clinical evaluation with current evidence.',
      additionalDataNeeded: 'Updated literature review or post-market clinical follow-up data',
    };
  }

  return {
    isSufficient: true,
    rationale: 'Current clinical evidence adequately supports device safety and effectiveness for the intended use.',
    qmsrJustification: 'Per QMSR Clause 7.3.7, clinical evaluation demonstrates device meets user needs and intended uses.',
  };
}
