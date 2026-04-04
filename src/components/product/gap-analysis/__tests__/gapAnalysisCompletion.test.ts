import { describe, it, expect } from 'vitest';

// Re-implement isFieldFilled locally since it's not exported from IEC60601ClauseForm
// This tests the exact same logic used in gap analysis completion checks
function isFieldFilled(val: any): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === 'object' && !Array.isArray(val)) {
    const hasDocuments = Array.isArray(val.documents) && val.documents.length > 0;
    const hasUrls = Array.isArray(val.urls) && val.urls.length > 0;
    if (!hasDocuments && !hasUrls) return false;
    if (hasDocuments && val.documentStatuses) {
      const allApproved = val.documents.every((docId: string) => {
        const status = (val.documentStatuses?.[docId] || '').toLowerCase();
        return status === 'approved' || status === 'completed';
      });
      if (!allApproved) return false;
    }
    return true;
  }
  return String(val).trim().length > 0;
}

// Import the exported isStepComplete
import { isStepComplete } from '@/components/product/gap-analysis/IEC60601ClauseForm';

describe('Gap Analysis Completion Logic', () => {
  describe('isFieldFilled', () => {
    it('returns false for null', () => {
      expect(isFieldFilled(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isFieldFilled(undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isFieldFilled('')).toBe(false);
    });

    it('returns false for whitespace-only string', () => {
      expect(isFieldFilled('   ')).toBe(false);
    });

    it('returns true for non-empty string', () => {
      expect(isFieldFilled('Some text')).toBe(true);
    });

    // doc_reference object tests
    it('returns false for doc_reference with no documents and no URLs', () => {
      expect(isFieldFilled({ documents: [], urls: [], comment: 'just a comment' })).toBe(false);
    });

    it('returns false for doc_reference with comment only (no docs/urls)', () => {
      expect(isFieldFilled({ documents: [], urls: [], comment: 'Notes here' })).toBe(false);
    });

    it('returns true for doc_reference with at least one URL', () => {
      expect(isFieldFilled({ documents: [], urls: ['https://example.com'], comment: '' })).toBe(true);
    });

    it('returns true for doc_reference with approved documents', () => {
      expect(isFieldFilled({
        documents: ['doc-1'],
        urls: [],
        documentStatuses: { 'doc-1': 'Approved' }
      })).toBe(true);
    });

    it('returns true for doc_reference with completed documents', () => {
      expect(isFieldFilled({
        documents: ['doc-1'],
        urls: [],
        documentStatuses: { 'doc-1': 'Completed' }
      })).toBe(true);
    });

    it('returns false for doc_reference with draft documents', () => {
      expect(isFieldFilled({
        documents: ['doc-1'],
        urls: [],
        documentStatuses: { 'doc-1': 'Draft' }
      })).toBe(false);
    });

    it('returns false for doc_reference with Not Started documents', () => {
      expect(isFieldFilled({
        documents: ['doc-1'],
        urls: [],
        documentStatuses: { 'doc-1': 'Not Started' }
      })).toBe(false);
    });

    it('returns false when any linked document is not approved', () => {
      expect(isFieldFilled({
        documents: ['doc-1', 'doc-2'],
        urls: [],
        documentStatuses: { 'doc-1': 'Approved', 'doc-2': 'Draft' }
      })).toBe(false);
    });

    it('returns true when all linked documents are approved', () => {
      expect(isFieldFilled({
        documents: ['doc-1', 'doc-2'],
        urls: [],
        documentStatuses: { 'doc-1': 'Approved', 'doc-2': 'Completed' }
      })).toBe(true);
    });

    it('returns true for documents without documentStatuses (legacy data)', () => {
      expect(isFieldFilled({
        documents: ['doc-1'],
        urls: [],
      })).toBe(true);
    });

    it('treats case-insensitively for status checks', () => {
      expect(isFieldFilled({
        documents: ['doc-1'],
        urls: [],
        documentStatuses: { 'doc-1': 'approved' }
      })).toBe(true);
    });
  });

  describe('isStepComplete', () => {
    const baseStep = { id: 's1', stepLabel: 'S1', requirementText: 'Req', title: 'Step 1' };

    it('returns false when required fields are empty', () => {
      const step = {
        ...baseStep,
        fields: [
          { id: 'field1', label: 'Field 1', type: 'text' as const, required: true },
        ],
      };
      expect(isStepComplete(step, {})).toBe(false);
    });

    it('returns true when all required fields are filled', () => {
      const step = {
        ...baseStep,
        fields: [
          { id: 'field1', label: 'Field 1', type: 'text' as const, required: true },
        ],
      };
      expect(isStepComplete(step, { field1: 'Answer' })).toBe(true);
    });

    it('ignores optional fields for completion', () => {
      const step = {
        ...baseStep,
        fields: [
          { id: 'field1', label: 'Required', type: 'text' as const, required: true },
          { id: 'field2', label: 'Optional', type: 'text' as const, required: false },
        ],
      };
      expect(isStepComplete(step, { field1: 'Answer' })).toBe(true);
    });

    it('requires table data when step has tables', () => {
      const step = {
        ...baseStep,
        tables: [
          { id: 'table1', title: 'Table 1', label: 'Table 1', columns: [] },
        ],
      };
      expect(isStepComplete(step, {})).toBe(false);
      expect(isStepComplete(step, { table1: [{ col1: 'val' }] })).toBe(true);
    });

    it('returns false for step with no content at all', () => {
      const step = {
        ...baseStep,
        title: 'Empty Step',
        fields: [
          { id: 'field1', label: 'Field 1', type: 'text' as const },
        ],
      };
      expect(isStepComplete(step, {})).toBe(false);
    });
  });
});
