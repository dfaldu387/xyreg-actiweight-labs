import { describe, it, expect } from 'vitest';
import {
  documentStatusToGapStatus,
  gapStatusToDocumentStatus,
  calculateOverallCompliance
} from '@/utils/statusSyncUtils';

describe('statusSyncUtils', () => {
  describe('documentStatusToGapStatus', () => {
    it('maps Completed to compliant', () => {
      expect(documentStatusToGapStatus('Completed')).toBe('compliant');
    });

    it('maps In Progress to partially_compliant', () => {
      expect(documentStatusToGapStatus('In Progress')).toBe('partially_compliant');
    });

    it('maps Not Started to non_compliant', () => {
      expect(documentStatusToGapStatus('Not Started')).toBe('non_compliant');
    });

    it('maps Not Required to not_applicable', () => {
      expect(documentStatusToGapStatus('Not Required')).toBe('not_applicable');
    });

    it('maps unknown status to non_compliant', () => {
      expect(documentStatusToGapStatus('Draft' as any)).toBe('non_compliant');
    });
  });

  describe('gapStatusToDocumentStatus', () => {
    it('maps compliant to Completed', () => {
      expect(gapStatusToDocumentStatus('compliant')).toBe('Completed');
    });

    it('maps partially_compliant to In Progress', () => {
      expect(gapStatusToDocumentStatus('partially_compliant')).toBe('In Progress');
    });

    it('maps non_compliant to Not Started', () => {
      expect(gapStatusToDocumentStatus('non_compliant')).toBe('Not Started');
    });

    it('maps not_applicable to Not Required', () => {
      expect(gapStatusToDocumentStatus('not_applicable')).toBe('Not Required');
    });

    it('maps unknown status to Not Started', () => {
      expect(gapStatusToDocumentStatus('unknown' as any)).toBe('Not Started');
    });
  });

  describe('calculateOverallCompliance', () => {
    it('returns 0 for empty array', () => {
      expect(calculateOverallCompliance([])).toBe(0);
    });

    it('returns 0 for null/undefined', () => {
      expect(calculateOverallCompliance(null as any)).toBe(0);
      expect(calculateOverallCompliance(undefined as any)).toBe(0);
    });

    it('returns 100 when all items are compliant', () => {
      const items = [
        { status: 'compliant' },
        { status: 'compliant' },
        { status: 'compliant' },
      ] as any[];
      expect(calculateOverallCompliance(items)).toBe(100);
    });

    it('returns 0 when all items are non_compliant', () => {
      const items = [
        { status: 'non_compliant' },
        { status: 'non_compliant' },
      ] as any[];
      expect(calculateOverallCompliance(items)).toBe(0);
    });

    it('counts partially_compliant as 50%', () => {
      const items = [
        { status: 'partially_compliant' },
        { status: 'partially_compliant' },
      ] as any[];
      expect(calculateOverallCompliance(items)).toBe(50);
    });

    it('excludes not_applicable from calculation', () => {
      const items = [
        { status: 'compliant' },
        { status: 'not_applicable' },
        { status: 'not_applicable' },
      ] as any[];
      expect(calculateOverallCompliance(items)).toBe(100);
    });

    it('returns 100 when all items are not_applicable', () => {
      const items = [
        { status: 'not_applicable' },
        { status: 'not_applicable' },
      ] as any[];
      expect(calculateOverallCompliance(items)).toBe(100);
    });

    it('calculates mixed statuses correctly', () => {
      const items = [
        { status: 'compliant' },           // 1.0
        { status: 'partially_compliant' },  // 0.5
        { status: 'non_compliant' },        // 0.0
        { status: 'not_applicable' },       // excluded
      ] as any[];
      // (1 + 0.5) / 3 = 50%
      expect(calculateOverallCompliance(items)).toBe(50);
    });

    it('rounds to nearest integer', () => {
      const items = [
        { status: 'compliant' },
        { status: 'non_compliant' },
        { status: 'non_compliant' },
      ] as any[];
      // 1/3 = 33.33% → 33
      expect(calculateOverallCompliance(items)).toBe(33);
    });
  });
});
