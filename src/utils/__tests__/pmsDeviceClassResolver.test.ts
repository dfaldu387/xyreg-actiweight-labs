import { describe, it, expect } from 'vitest';
import { resolveHighestRiskClass } from '../pmsDeviceClassResolver';

describe('resolveHighestRiskClass', () => {
  it('returns undefined for empty/missing markets', () => {
    expect(resolveHighestRiskClass(undefined)).toBeUndefined();
    expect(resolveHighestRiskClass([])).toBeUndefined();
  });

  it('prefers component-level IIb over stale overallRiskClass IIa', () => {
    const markets = [{
      selected: true,
      riskClass: 'IIa',
      componentClassification: {
        overallRiskClass: 'IIa', // stale
        components: [
          { riskClass: 'IIa', isSelected: true },
          { riskClass: 'IIb', isSelected: true }, // software component
        ],
      },
    }];
    expect(resolveHighestRiskClass(markets)).toBe('IIb');
  });

  it('uses market.riskClass when no components exist', () => {
    const markets = [{
      selected: true,
      riskClass: 'class-iii',
    }];
    expect(resolveHighestRiskClass(markets)).toBe('III');
  });

  it('picks highest across multiple markets', () => {
    const markets = [
      { selected: true, riskClass: 'IIa' },
      { selected: true, riskClass: 'IIb' },
      { selected: false, riskClass: 'III' }, // not selected
    ];
    expect(resolveHighestRiskClass(markets)).toBe('IIb');
  });

  it('handles Class I correctly', () => {
    const markets = [{ selected: true, riskClass: 'I' }];
    expect(resolveHighestRiskClass(markets)).toBe('I');
  });

  it('ignores deselected components', () => {
    const markets = [{
      selected: true,
      componentClassification: {
        components: [
          { riskClass: 'IIa', isSelected: true },
          { riskClass: 'III', isSelected: false },
        ],
      },
    }];
    expect(resolveHighestRiskClass(markets)).toBe('IIa');
  });
});
