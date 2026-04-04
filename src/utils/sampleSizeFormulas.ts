/**
 * Sample Size Calculation Formulas for MedTech Clinical Studies
 * Based on standard statistical power analysis methods
 */

// Standard normal distribution quantile function (approximation)
function normalQuantile(p: number): number {
  // Approximation of the inverse standard normal distribution
  // Using Abramowitz and Stegun approximation
  const a1 = -3.969683028665376e+01;
  const a2 = 2.209460984245205e+02;
  const a3 = -2.759285104469687e+02;
  const a4 = 1.383577518672690e+02;
  const a5 = -3.066479806614716e+01;
  const a6 = 2.506628277459239e+00;

  const b1 = -5.447609879822406e+01;
  const b2 = 1.615858368580409e+02;
  const b3 = -1.556989798598866e+02;
  const b4 = 6.680131188771972e+01;
  const b5 = -1.328068155288572e+01;

  const c1 = -7.784894002430293e-03;
  const c2 = -3.223964580411365e-01;
  const c3 = -2.400758277161838e+00;
  const c4 = -2.549732539343734e+00;
  const c5 = 4.374664141464968e+00;
  const c6 = 2.938163982698783e+00;

  const d1 = 7.784695709041462e-03;
  const d2 = 3.224671290700398e-01;
  const d3 = 2.445134137142996e+00;
  const d4 = 3.754408661907416e+00;

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number, r: number;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
      ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
      (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
      ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  }
}

export interface BinaryOutcomeParams {
  p0: number;      // Control/baseline proportion (e.g., 0.20 for 20%)
  p1: number;      // Treatment/expected proportion (e.g., 0.10 for 10%)
  alpha: number;   // Significance level (e.g., 0.05)
  power: number;   // Statistical power (e.g., 0.80)
  twoSided?: boolean; // Two-sided test (default: true)
}

export interface ContinuousOutcomeParams {
  mu0: number;     // Control/baseline mean
  mu1: number;     // Treatment/expected mean
  sigma: number;   // Standard deviation
  alpha: number;   // Significance level (e.g., 0.05)
  power: number;   // Statistical power (e.g., 0.80)
  twoSided?: boolean; // Two-sided test (default: true)
}

/**
 * Calculate sample size for binary outcome (proportions)
 * Formula: n = [Z_{α/2} + Z_{β}]² × [p₀(1-p₀) + p₁(1-p₁)] / (p₁ - p₀)²
 * Returns sample size per arm
 */
export function calculateBinarySampleSize(params: BinaryOutcomeParams): number {
  const { p0, p1, alpha, power, twoSided = true } = params;
  
  // Z-values
  const zAlpha = normalQuantile(twoSided ? 1 - alpha / 2 : 1 - alpha);
  const zBeta = normalQuantile(power);
  
  // Calculate effect size denominator
  const effectSize = Math.abs(p1 - p0);
  if (effectSize === 0) return Infinity;
  
  // Variance components
  const var0 = p0 * (1 - p0);
  const var1 = p1 * (1 - p1);
  
  // Sample size per arm
  const n = Math.pow(zAlpha + zBeta, 2) * (var0 + var1) / Math.pow(effectSize, 2);
  
  return Math.ceil(n);
}

/**
 * Calculate sample size for continuous outcome (means)
 * Formula: n = 2 × [Z_{α/2} + Z_{β}]² × σ² / (μ₁ - μ₀)²
 * Returns sample size per arm
 */
export function calculateContinuousSampleSize(params: ContinuousOutcomeParams): number {
  const { mu0, mu1, sigma, alpha, power, twoSided = true } = params;
  
  // Z-values
  const zAlpha = normalQuantile(twoSided ? 1 - alpha / 2 : 1 - alpha);
  const zBeta = normalQuantile(power);
  
  // Calculate effect size
  const effectSize = Math.abs(mu1 - mu0);
  if (effectSize === 0) return Infinity;
  
  // Sample size per arm
  const n = 2 * Math.pow(zAlpha + zBeta, 2) * Math.pow(sigma, 2) / Math.pow(effectSize, 2);
  
  return Math.ceil(n);
}

export interface SampleSizeResult {
  perArm: number;
  total: number;
  formula: string;
  assumptions: string[];
}

export function calculateSampleSizeWithDetails(
  outcomeType: 'binary' | 'continuous',
  params: BinaryOutcomeParams | ContinuousOutcomeParams
): SampleSizeResult {
  if (outcomeType === 'binary') {
    const binaryParams = params as BinaryOutcomeParams;
    const perArm = calculateBinarySampleSize(binaryParams);
    return {
      perArm,
      total: perArm * 2,
      formula: 'n = [Z_{α/2} + Z_{β}]² × [p₀(1-p₀) + p₁(1-p₁)] / (p₁ - p₀)²',
      assumptions: [
        `Baseline rate (p₀): ${(binaryParams.p0 * 100).toFixed(1)}%`,
        `Expected rate (p₁): ${(binaryParams.p1 * 100).toFixed(1)}%`,
        `Significance level (α): ${binaryParams.alpha}`,
        `Power (1-β): ${(binaryParams.power * 100).toFixed(0)}%`,
        `Test: ${binaryParams.twoSided !== false ? 'Two-sided' : 'One-sided'}`,
      ],
    };
  } else {
    const contParams = params as ContinuousOutcomeParams;
    const perArm = calculateContinuousSampleSize(contParams);
    return {
      perArm,
      total: perArm * 2,
      formula: 'n = 2 × [Z_{α/2} + Z_{β}]² × σ² / (μ₁ - μ₀)²',
      assumptions: [
        `Baseline mean (μ₀): ${contParams.mu0}`,
        `Expected mean (μ₁): ${contParams.mu1}`,
        `Standard deviation (σ): ${contParams.sigma}`,
        `Significance level (α): ${contParams.alpha}`,
        `Power (1-β): ${(contParams.power * 100).toFixed(0)}%`,
        `Test: ${contParams.twoSided !== false ? 'Two-sided' : 'One-sided'}`,
      ],
    };
  }
}

// Preset scenarios for MedTech devices
export const PRESET_SCENARIOS = {
  adverseEventReduction: {
    name: 'Adverse Event Reduction',
    description: 'Testing if device reduces complication or adverse event rates',
    icon: 'TrendingDown',
    outcomeType: 'binary' as const,
    params: {
      p0: 0.20,  // 20% baseline adverse event rate
      p1: 0.10,  // 10% expected rate with device
      alpha: 0.05,
      power: 0.80,
      twoSided: true,
    },
  },
  successRateIncrease: {
    name: 'Success Rate Increase',
    description: 'Testing if device improves procedure success or efficacy rates',
    icon: 'TrendingUp',
    outcomeType: 'binary' as const,
    params: {
      p0: 0.60,  // 60% baseline success rate
      p1: 0.75,  // 75% expected rate with device
      alpha: 0.05,
      power: 0.80,
      twoSided: true,
    },
  },
  continuousImprovement: {
    name: 'Continuous Outcome Improvement',
    description: 'Testing improvement in a measured outcome (pain scores, recovery time, etc.)',
    icon: 'Activity',
    outcomeType: 'continuous' as const,
    params: {
      mu0: 50,    // Baseline mean score
      mu1: 40,    // Expected mean with device (lower is better in this example)
      sigma: 20,  // Standard deviation
      alpha: 0.05,
      power: 0.80,
      twoSided: true,
    },
  },
};
