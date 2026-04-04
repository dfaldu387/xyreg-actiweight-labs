/**
 * Viability Score Calculation Service
 * 
 * Derives viability score from existing module data:
 * - Regulatory: Device class, target markets, competitor regulatory status
 * - Clinical: Clinical evidence plan, clinical need strength, competitor clinical data
 * - Reimbursement: Reimbursement strategy, value proposition, market size
 * - Technical: Device type, risk analysis, solution concept, team profile
 */

export interface ViabilityScoreInputs {
  // From products table
  deviceClass: string | null;
  deviceType: string | null;
  targetMarkets: string[];
  hasPredicate?: boolean; // US FDA only
  intendedUse: string | null; // Step 1 - Clinical Need
  
  // From product_clinical_evidence_plan
  studyDesign: string | null;
  sampleSize: number | null;
  pmcfRequired: boolean;
  hasLiterature: boolean;
  
  // From product_reimbursement_strategy
  reimbursementCodeStatus: 'existing' | 'new_needed' | 'bundled' | 'partial' | null;
  hasCoverageStrategy: boolean;
  
  // From hazards table (Risk Analysis)
  hazardCount: number;
  hasRiskAnalysis: boolean;
  
  // NEW: Enrichment inputs from other Blueprint steps
  // Step 2: Competitor Analysis
  competitorApproved: boolean; // Any competitor has regulatory approval
  
  // Step 17: Supporting Literature (replaces competitorHasClinicalData)
  literatureScore: number; // Weighted score: Direct=3, Analogous=2, Supportive=1
  literatureCount: number; // Total number of citations
  
  // Step 2: Market Sizing
  somValue: number | null; // SOM in currency
  livesImpacted: number | null; // Clinical impact metric
  
  // Step 3: Core Solution
  hasSolutionConcept: boolean; // Has description in products table
  
  // Step 5: Value Proposition
  hasValueProposition: boolean; // business_canvas.value_propositions filled
  
  // Step 8C: Team Composition
  teamMemberCount: number; // Number of team profiles
  
  // Step 16: High-Level Risk Assessment
  categoriesAssessed: string[]; // Categories with risk entries or 'None known'
  totalRiskCount: number; // Number of identified risks (excluding 'None known')
  mitigatedRiskCount: number; // Number of 'Mitigated' status risks
  noneKnownCount: number; // Number of 'None known' entries
  risksWithMitigation: number; // Number of risks with mitigation plan filled
  categoriesWithRealRisks: number; // Number of categories with at least one real risk (not 'None known')
}

export interface ScoreBreakdownItem {
  factor: string;
  currentValue: string;
  points: number;
  maxPoints: number;
  status: 'complete' | 'partial' | 'missing';
  improvement?: string;
}

export interface CategoryScore {
  score: number;
  maxScore: number;
  percentage: number;
  source: string;
  isMissing: boolean;
  missingField?: string;
  breakdown: ScoreBreakdownItem[];
}

export interface ViabilityScoreResult {
  totalScore: number;
  completionPercentage: number;
  categoryScores: {
    regulatory: CategoryScore;
    clinical: CategoryScore;
    reimbursement: CategoryScore;
    technical: CategoryScore;
  };
  missingInputs: string[];
  recommendations: string[];
}

// Score weights (total = 100)
const WEIGHTS = {
  regulatory: 30,
  clinical: 30,
  reimbursement: 20,
  technical: 20,
};

/**
 * Helper to format device class for display
 */
function formatDeviceClass(deviceClass: string): string {
  // Convert "class-iia" to "Class IIa"
  return deviceClass
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/Ii/g, 'II')
    .replace(/Iii/g, 'III');
}

/**
 * Calculate regulatory score (30 points max)
 * Inputs: Device class, target markets, predicate, competitor regulatory status
 */
function calculateRegulatoryScore(inputs: ViabilityScoreInputs): CategoryScore {
  const maxScore = WEIGHTS.regulatory;
  const breakdown: ScoreBreakdownItem[] = [];
  
  if (!inputs.deviceClass) {
    breakdown.push({
      factor: 'Device Class',
      currentValue: 'Not set',
      points: 0,
      maxPoints: 25,
      status: 'missing',
      improvement: 'Complete device classification in Step 7',
    });
    
    return {
      score: 0,
      maxScore,
      percentage: 0,
      source: 'Device Definition → Classification',
      isMissing: true,
      missingField: 'Device Classification',
      breakdown,
    };
  }
  
  const deviceClass = inputs.deviceClass.toLowerCase();
  let classScore = 0;
  let classStatus: 'complete' | 'partial' = 'complete';
  
  // Low risk classes (highest viability) - 27 pts (max)
  if (
    (deviceClass.includes('class-i') && !deviceClass.includes('ii') && !deviceClass.includes('iii')) ||
    deviceClass.includes('class-a') ||
    deviceClass.includes('510k-exempt')
  ) {
    classScore = 27;
  }
  // Medium-low risk - 20 pts
  else if (
    deviceClass.includes('class-iia') ||
    deviceClass.includes('class-b') ||
    deviceClass.includes('510k') ||
    deviceClass.includes('ca-class-ii') ||
    deviceClass.includes('jp-class-ii') ||
    deviceClass.includes('kr-class-ii') ||
    deviceClass.includes('br-class-ii') ||
    deviceClass.includes('cn-class-ii')
  ) {
    classScore = 20;
    classStatus = 'partial';
  }
  // Medium-high risk - 14 pts
  else if (
    deviceClass.includes('class-iib') ||
    deviceClass.includes('class-c') ||
    deviceClass.includes('ca-class-iii') ||
    deviceClass.includes('jp-class-iii') ||
    deviceClass.includes('kr-class-iii') ||
    deviceClass.includes('cn-class-iii') ||
    deviceClass.includes('br-class-iii')
  ) {
    classScore = 14;
    classStatus = 'partial';
  }
  // High risk (lowest viability, but still viable) - 10 pts
  else if (
    deviceClass.includes('eu-class-iii') ||
    deviceClass.includes('uk-class-iii') ||
    deviceClass.includes('au-class-iii') ||
    deviceClass.includes('class-d') ||
    deviceClass.includes('pma') ||
    deviceClass.includes('ca-class-iv') ||
    deviceClass.includes('jp-class-iv') ||
    deviceClass.includes('kr-class-iv') ||
    deviceClass.includes('br-class-iv')
  ) {
    classScore = 10;
    classStatus = 'partial';
  }
  // Default for unrecognized class - 14 pts (middle ground)
  else {
    classScore = 14;
    classStatus = 'partial';
  }
  
  breakdown.push({
    factor: 'Device Class',
    currentValue: formatDeviceClass(inputs.deviceClass),
    points: classScore,
    maxPoints: 27,
    status: classStatus,
    improvement: classScore < 27 ? 'Lower risk class = higher score' : undefined,
  });
  
  let score = classScore;
  
  // Bonus for predicate device (US FDA pathway) - +3 pts
  const predicateApplies = inputs.targetMarkets.includes('US');
  const predicatePoints = inputs.hasPredicate && predicateApplies ? 3 : 0;
  if (predicateApplies) {
    breakdown.push({
      factor: 'Predicate Device',
      currentValue: inputs.hasPredicate ? 'Yes' : 'Not set',
      points: predicatePoints,
      maxPoints: 3,
      status: inputs.hasPredicate ? 'complete' : 'missing',
      improvement: !inputs.hasPredicate ? 'Add predicate in Classification step' : undefined,
    });
    if (inputs.hasPredicate) {
      score = Math.min(maxScore, score + 3);
    }
  }
  
  // Bonus if competitors already approved (validates pathway) - +3 pts
  breakdown.push({
    factor: 'Competitor Regulatory Approved',
    currentValue: inputs.competitorApproved ? 'Yes' : 'None found',
    points: inputs.competitorApproved ? 3 : 0,
    maxPoints: 3,
    status: inputs.competitorApproved ? 'complete' : 'missing',
    improvement: !inputs.competitorApproved ? 'Add competitor data in Competitor Analysis' : undefined,
  });
  if (inputs.competitorApproved) {
    score = Math.min(maxScore, score + 3);
  }
  
  // Multi-market complexity - tiered penalty based on market count
  // 1-2 markets: 0pts, 3-5 markets: -1pt, 6-8 markets: -2pts, 9+ markets: -3pts
  const marketCount = inputs.targetMarkets.length;
  if (marketCount > 0) {
    let penalty = 0;
    if (marketCount >= 9) {
      penalty = 3;
    } else if (marketCount >= 6) {
      penalty = 2;
    } else if (marketCount >= 3) {
      penalty = 1;
    }
    
    breakdown.push({
      factor: 'Multi-Market Complexity',
      currentValue: marketCount === 1 ? '1 market' : `${marketCount} markets`,
      points: -penalty,
      maxPoints: 0,
      status: penalty === 0 ? 'complete' : 'partial',
      improvement: penalty > 0 ? 'Consider phased market entry' : undefined,
    });
    if (penalty > 0) {
      score = Math.max(0, score - penalty);
    }
  }
  
  return {
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    source: 'Device Definition + Competitor Analysis',
    isMissing: false,
    breakdown,
  };
}

/**
 * Calculate clinical score (30 points max)
 * Inputs: Clinical evidence plan, intended use strength, competitor clinical data
 */
function calculateClinicalScore(inputs: ViabilityScoreInputs): CategoryScore {
  const maxScore = WEIGHTS.clinical;
  const breakdown: ScoreBreakdownItem[] = [];
  
  // Check if clinical evidence plan exists
  if (!inputs.studyDesign && !inputs.hasLiterature && !inputs.pmcfRequired) {
    breakdown.push({
      factor: 'Evidence Strategy',
      currentValue: 'Not set',
      points: 0,
      maxPoints: 18,
      status: 'missing',
      improvement: 'Complete Clinical Evidence Plan in Step 12',
    });
    
    return {
      score: 0,
      maxScore,
      percentage: 0,
      source: 'Clinical Evidence Plan',
      isMissing: true,
      missingField: 'Clinical Evidence Plan',
      breakdown,
    };
  }
  
  let score = 0;
  const studyDesign = (inputs.studyDesign || '').toLowerCase();
  let strategyPoints = 0;
  let strategyValue = 'Defined';
  let strategyStatus: 'complete' | 'partial' = 'complete';
  
  // Literature-only approach (least burden = highest viability) - max 18 pts
  if (inputs.hasLiterature && !studyDesign.includes('trial') && !studyDesign.includes('study')) {
    strategyPoints = 18;
    strategyValue = 'Literature-based';
  }
  // Has literature but nothing else
  else if (inputs.hasLiterature) {
    strategyPoints = 15;
    strategyValue = 'Literature available';
  }
  // Post-market focused
  else if (inputs.pmcfRequired || studyDesign.includes('pmcf') || studyDesign.includes('post-market')) {
    strategyPoints = 14;
    strategyValue = 'PMCF/Post-market';
    strategyStatus = 'partial';
  }
  // Some clinical strategy defined
  else if (inputs.studyDesign) {
    strategyPoints = 11;
    strategyValue = 'Clinical study';
    strategyStatus = 'partial';
  }
  // Pre-market clinical study required (most burden)
  else if (studyDesign.includes('pre-market') || studyDesign.includes('pivotal') || studyDesign.includes('rct')) {
    strategyPoints = 7;
    strategyValue = 'Pre-market study';
    strategyStatus = 'partial';
  }
  
  breakdown.push({
    factor: 'Evidence Strategy',
    currentValue: strategyValue,
    points: strategyPoints,
    maxPoints: 18,
    status: strategyStatus,
    improvement: strategyPoints < 18 ? 'Literature-only approach scores highest' : undefined,
  });
  score = strategyPoints;
  
  // Adjust for sample size (smaller = better viability)
  if (inputs.sampleSize) {
    let samplePoints = 0;
    let sampleStatus: 'complete' | 'partial' = 'complete';
    
    if (inputs.sampleSize <= 30) {
      samplePoints = 2;
    } else if (inputs.sampleSize <= 100) {
      samplePoints = 0;
      sampleStatus = 'partial';
    } else if (inputs.sampleSize <= 300) {
      samplePoints = -2;
      sampleStatus = 'partial';
    } else {
      samplePoints = -4;
      sampleStatus = 'partial';
    }
    
    breakdown.push({
      factor: 'Sample Size',
      currentValue: `${inputs.sampleSize} subjects`,
      points: samplePoints,
      maxPoints: 2,
      status: sampleStatus,
      improvement: inputs.sampleSize > 30 ? 'Smaller studies score higher' : undefined,
    });
    score = samplePoints > 0 ? Math.min(maxScore, score + samplePoints) : Math.max(0, score + samplePoints);
  }
  
  // Clinical Need - tiered scoring (max 6 pts)
  const intendedUseLength = (inputs.intendedUse || '').trim().length;
  let needPoints = 0;
  let needValue = 'Not set';
  let needStatus: 'complete' | 'partial' | 'missing' = 'missing';

  if (intendedUseLength > 50) {
    needPoints = 6;
    needValue = 'Well defined';
    needStatus = 'complete';
  } else if (intendedUseLength > 20) {
    needPoints = 4;
    needValue = 'Defined';
    needStatus = 'partial';
  } else if (intendedUseLength > 0) {
    needPoints = 2;
    needValue = 'Minimal';
    needStatus = 'partial';
  }

  breakdown.push({
    factor: 'Clinical Need',
    currentValue: needValue,
    points: needPoints,
    maxPoints: 6,
    status: needStatus,
    improvement: needPoints < 6 ? 'Add detailed intended use (>50 chars) in Step 1' : undefined,
  });
  score = Math.min(maxScore, score + needPoints);
  
  // Supporting Literature - weighted by relevance (max 6 pts)
  const litScore = Math.min(6, inputs.literatureScore);
  const litCount = inputs.literatureCount;
  
  let litStatus: 'complete' | 'partial' | 'missing' = 'missing';
  let litValue = 'None';
  
  if (litScore >= 6) {
    litStatus = 'complete';
    litValue = `${litCount} citation(s), high relevance`;
  } else if (litScore > 0) {
    litStatus = 'partial';
    litValue = `${litCount} citation(s), ${litScore} pts`;
  }
  
  breakdown.push({
    factor: 'Supporting Literature',
    currentValue: litValue,
    points: litScore,
    maxPoints: 6,
    status: litStatus,
    improvement: litScore < 6 ? 'Add more direct/analogous literature' : undefined,
  });
  score = Math.min(maxScore, score + litScore);
  
  return {
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    source: 'Clinical Evidence Plan + Market Analysis',
    isMissing: false,
    breakdown,
  };
}

/**
 * Calculate reimbursement score (20 points max)
 * Inputs: Reimbursement strategy, value proposition, market size
 */
function calculateReimbursementScore(inputs: ViabilityScoreInputs): CategoryScore {
  const maxScore = WEIGHTS.reimbursement;
  const breakdown: ScoreBreakdownItem[] = [];
  
  if (!inputs.reimbursementCodeStatus && !inputs.hasCoverageStrategy) {
    breakdown.push({
      factor: 'Code Status',
      currentValue: 'Not set',
      points: 0,
      maxPoints: 14,
      status: 'missing',
      improvement: 'Complete Reimbursement Strategy in Step 12',
    });
    
    return {
      score: 0,
      maxScore,
      percentage: 0,
      source: 'Reimbursement Strategy',
      isMissing: true,
      missingField: 'Reimbursement Strategy',
      breakdown,
    };
  }
  
  let score = 0;
  let codePoints = 0;
  let codeValue = 'Strategy only';
  let codeStatus: 'complete' | 'partial' = 'partial';
  
  // Existing codes = highest viability
  if (inputs.reimbursementCodeStatus === 'existing') {
    codePoints = 14;
    codeValue = 'Existing code';
    codeStatus = 'complete';
  }
  // Partial match
  else if (inputs.reimbursementCodeStatus === 'partial' || inputs.reimbursementCodeStatus === 'bundled') {
    codePoints = 10;
    codeValue = inputs.reimbursementCodeStatus === 'partial' ? 'Partial match' : 'Bundled';
  }
  // New code needed (most burden)
  else if (inputs.reimbursementCodeStatus === 'new_needed') {
    codePoints = 4;
    codeValue = 'New code needed';
  }
  // Has some strategy but no code status
  else if (inputs.hasCoverageStrategy) {
    codePoints = 7;
    codeValue = 'Strategy defined';
  }
  
  breakdown.push({
    factor: 'Code Status',
    currentValue: codeValue,
    points: codePoints,
    maxPoints: 14,
    status: codeStatus,
    improvement: codePoints < 14 ? 'Existing reimbursement codes score highest' : undefined,
  });
  score = codePoints;
  
  // Bonus for having value proposition defined - +3 pts
  breakdown.push({
    factor: 'Value Proposition',
    currentValue: inputs.hasValueProposition ? 'Defined' : 'Not set',
    points: inputs.hasValueProposition ? 3 : 0,
    maxPoints: 3,
    status: inputs.hasValueProposition ? 'complete' : 'missing',
    improvement: !inputs.hasValueProposition ? 'Complete Business Canvas in Step 5' : undefined,
  });
  if (inputs.hasValueProposition) {
    score = Math.min(maxScore, score + 3);
  }
  
  // Tiered market size scoring based on SOM:
  // +1 ≥ $1M, +2 ≥ $10M, +3 ≥ $100M
  let marketPoints = 0;
  let marketValue = 'Not set';
  let marketStatus: 'complete' | 'partial' | 'missing' = 'missing';
  
  if (inputs.somValue) {
    marketValue = `$${(inputs.somValue / 1000000).toFixed(1)}M SOM`;
    
    if (inputs.somValue >= 100_000_000) {
      marketPoints = 3;
      marketStatus = 'complete';
    } else if (inputs.somValue >= 10_000_000) {
      marketPoints = 2;
      marketStatus = 'partial';
    } else if (inputs.somValue >= 1_000_000) {
      marketPoints = 1;
      marketStatus = 'partial';
    } else {
      marketStatus = 'partial'; // Has value but below $1M
    }
  }
  
  let improvementHint: string | undefined;
  if (marketPoints === 0) {
    improvementHint = 'SOM ≥ $1M for +1pt, ≥ $10M for +2pts, ≥ $100M for +3pts';
  } else if (marketPoints === 1) {
    improvementHint = 'SOM ≥ $10M for +2pts, ≥ $100M for +3pts';
  } else if (marketPoints === 2) {
    improvementHint = 'SOM ≥ $100M for +3pts';
  }
  
  breakdown.push({
    factor: 'Market Size',
    currentValue: marketValue,
    points: marketPoints,
    maxPoints: 3,
    status: marketStatus,
    improvement: improvementHint,
  });
  score = Math.min(maxScore, score + marketPoints);
  
  return {
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    source: 'Reimbursement Strategy + Value Proposition',
    isMissing: false,
    breakdown,
  };
}

/**
 * Calculate technical score (20 points max)
 * Inputs: Device type, risk analysis, solution concept, team profile, and high-level risk assessment
 */
function calculateTechnicalScore(inputs: ViabilityScoreInputs): CategoryScore {
  const maxScore = WEIGHTS.technical;
  const breakdown: ScoreBreakdownItem[] = [];
  
  // Check if we have any technical data
  if (!inputs.deviceType && !inputs.hasRiskAnalysis && inputs.categoriesAssessed.length === 0) {
    breakdown.push({
      factor: 'Risk Analysis',
      currentValue: 'Not started',
      points: 0,
      maxPoints: 4,
      status: 'missing',
      improvement: 'Complete High-Level Risk Assessment in Step 16',
    });
    
    return {
      score: 0,
      maxScore,
      percentage: 0,
      source: 'Device Definition & Risk Analysis',
      isMissing: true,
      missingField: 'Device Type or Risk Analysis',
      breakdown,
    };
  }
  
  let score = 8; // Base score for having some data
  const deviceType = (inputs.deviceType || '').toLowerCase();
  let typePoints = 8;
  let typeValue = 'Defined';
  let typeStatus: 'complete' | 'partial' = 'partial';
  
  // Standard hardware (highest viability)
  if (deviceType.includes('standard') || deviceType.includes('mechanical') || deviceType === 'hardware') {
    typePoints = 14;
    typeValue = 'Standard hardware';
    typeStatus = 'complete';
  }
  // Software as Medical Device (standalone)
  else if (deviceType.includes('samd') || deviceType === 'software') {
    typePoints = 12;
    typeValue = 'SaMD (standalone)';
  }
  // Software in Medical Device (embedded)
  else if (deviceType.includes('simd') || deviceType.includes('embedded') || deviceType.includes('software in')) {
    typePoints = 8;
    typeValue = 'SiMD (embedded)';
  }
  // Combination product (drug-device, biologic)
  else if (deviceType.includes('combo') || deviceType.includes('combination') || deviceType.includes('biologic')) {
    typePoints = 5;
    typeValue = 'Combination product';
  }
  // Has risk analysis completed
  else if (inputs.hasRiskAnalysis) {
    typePoints = 10;
    typeValue = 'Risk analysis done';
  }
  
  breakdown.push({
    factor: 'Device Type',
    currentValue: typeValue,
    points: typePoints,
    maxPoints: 14,
    status: typeStatus,
    improvement: typePoints < 14 ? 'Standard hardware scores highest' : undefined,
  });
  score = typePoints;
  
  // HIGH-LEVEL RISK ASSESSMENT SCORING (max 4 pts)
  // New logic: Focus on coverage and mitigation PLANNING (not actual mitigation status)
  // +3 pts: All 4 categories have at least one real risk (not "None known")
  // +1 pt: All risks have a mitigation plan defined
  let riskPoints = 0;
  let riskValue = 'Not assessed';
  let riskStatus: 'complete' | 'partial' | 'missing' = 'missing';
  
  const categoriesWithRealRisks = inputs.categoriesWithRealRisks;
  const totalRisks = inputs.totalRiskCount;
  const risksWithMitigation = inputs.risksWithMitigation;
  
  // +3 pts: All 4 categories have at least one real risk (not "None known")
  if (categoriesWithRealRisks >= 4) {
    riskPoints = 3;
    riskStatus = 'partial';
    riskValue = '4/4 categories with risks';
    
    // +1 pt bonus: All risks have a mitigation plan
    if (totalRisks > 0 && risksWithMitigation === totalRisks) {
      riskPoints = 4;
      riskStatus = 'complete';
      riskValue = 'All risks have mitigation plans';
    } else if (totalRisks > 0 && risksWithMitigation > 0) {
      riskValue = `${risksWithMitigation}/${totalRisks} with mitigation plans`;
    }
  } else if (categoriesWithRealRisks > 0) {
    // Partial points for partial coverage
    riskPoints = Math.floor(categoriesWithRealRisks * 0.75); // ~0.75 pts per category
    riskValue = `${categoriesWithRealRisks}/4 categories with risks`;
    riskStatus = 'partial';
  } else if (inputs.categoriesAssessed.length > 0) {
    // At least some assessment done (possibly all "None known")
    riskValue = `${inputs.categoriesAssessed.length}/4 assessed (no risks identified)`;
    riskStatus = 'partial';
  }
  
  breakdown.push({
    factor: 'Risk Analysis',
    currentValue: riskValue,
    points: riskPoints,
    maxPoints: 4,
    status: riskStatus,
    improvement: riskPoints < 4 ? 'Identify risks in all 4 categories and add mitigation plans' : undefined,
  });
  score = Math.min(maxScore, score + riskPoints);
  
  // Bonus for having solution concept defined - +2 pts
  breakdown.push({
    factor: 'Solution Concept',
    currentValue: inputs.hasSolutionConcept ? 'Defined' : 'Not set',
    points: inputs.hasSolutionConcept ? 2 : 0,
    maxPoints: 2,
    status: inputs.hasSolutionConcept ? 'complete' : 'missing',
    improvement: !inputs.hasSolutionConcept ? 'Add device description (>20 characters) in Device Definition' : undefined,
  });
  if (inputs.hasSolutionConcept) {
    score = Math.min(maxScore, score + 2);
  }
  
  // Bonus for having team profiles (execution capability) - +3 pts
  let teamPoints = 0;
  let teamValue = 'No members';
  let teamStatus: 'complete' | 'partial' | 'missing' = 'missing';
  
  if (inputs.teamMemberCount >= 2) {
    teamPoints = 3;
    teamValue = `${inputs.teamMemberCount} members`;
    teamStatus = 'complete';
  } else if (inputs.teamMemberCount === 1) {
    teamPoints = 1;
    teamValue = '1 member';
    teamStatus = 'partial';
  }
  
  breakdown.push({
    factor: 'Team Profile',
    currentValue: teamValue,
    points: teamPoints,
    maxPoints: 3,
    status: teamStatus,
    improvement: inputs.teamMemberCount < 2 ? 'Add 2+ team members in Step 8C' : undefined,
  });
  if (teamPoints > 0) {
    score = Math.min(maxScore, score + teamPoints);
  }
  
  return {
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    source: 'Device Definition + Risk Analysis + Team',
    isMissing: false,
    breakdown,
  };
}

/**
 * Generate recommendations based on scores
 */
function generateRecommendations(
  totalScore: number,
  categoryScores: ViabilityScoreResult['categoryScores'],
  missingInputs: string[]
): string[] {
  const recommendations: string[] = [];
  
  // High priority: Missing inputs
  if (missingInputs.length > 0) {
    recommendations.push(`Complete missing inputs: ${missingInputs.join(', ')}`);
  }
  
  // Score-based recommendations
  if (totalScore >= 71) {
    recommendations.push('Strong viability profile - proceed to detailed planning');
    if (categoryScores.clinical.percentage < 60) {
      recommendations.push('Consider strengthening clinical evidence strategy');
    }
  } else if (totalScore >= 41) {
    recommendations.push('Moderate viability - review risk factors before proceeding');
    
    // Find lowest scoring category
    const scores = [
      { name: 'regulatory', score: categoryScores.regulatory },
      { name: 'clinical', score: categoryScores.clinical },
      { name: 'reimbursement', score: categoryScores.reimbursement },
      { name: 'technical', score: categoryScores.technical },
    ];
    const lowest = scores.reduce((min, curr) => 
      curr.score.percentage < min.score.percentage ? curr : min
    );
    
    if (lowest.score.percentage < 50) {
      recommendations.push(`Focus on improving ${lowest.name} strategy`);
    }
  } else {
    recommendations.push('Consider design modifications to improve viability');
    recommendations.push('Explore alternative regulatory pathways');
    recommendations.push('Consult with regulatory experts');
  }
  
  return recommendations;
}

/**
 * Main calculation function
 */
export function calculateViabilityScore(inputs: ViabilityScoreInputs): ViabilityScoreResult {
  const regulatory = calculateRegulatoryScore(inputs);
  const clinical = calculateClinicalScore(inputs);
  const reimbursement = calculateReimbursementScore(inputs);
  const technical = calculateTechnicalScore(inputs);
  
  const categoryScores = { regulatory, clinical, reimbursement, technical };
  
  // Calculate total score
  const totalScore = regulatory.score + clinical.score + reimbursement.score + technical.score;
  
  // Calculate completion percentage (how many categories have data)
  const categoriesWithData = [regulatory, clinical, reimbursement, technical]
    .filter(c => !c.isMissing).length;
  const completionPercentage = Math.round((categoriesWithData / 4) * 100);
  
  // Collect missing inputs
  const missingInputs: string[] = [];
  if (regulatory.isMissing && regulatory.missingField) missingInputs.push(regulatory.missingField);
  if (clinical.isMissing && clinical.missingField) missingInputs.push(clinical.missingField);
  if (reimbursement.isMissing && reimbursement.missingField) missingInputs.push(reimbursement.missingField);
  if (technical.isMissing && technical.missingField) missingInputs.push(technical.missingField);
  
  const recommendations = generateRecommendations(totalScore, categoryScores, missingInputs);
  
  return {
    totalScore,
    completionPercentage,
    categoryScores,
    missingInputs,
    recommendations,
  };
}
