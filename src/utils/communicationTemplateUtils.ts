export interface ThreadTemplate {
  id: string;
  label: string;
  description: string;
  messageTemplate: string;
}

export const THREAD_TEMPLATES: ThreadTemplate[] = [
  {
    id: 'general',
    label: 'General Discussion',
    description: 'Open conversation with no predefined structure',
    messageTemplate: '',
  },
  {
    id: 'issue',
    label: 'Issue Report',
    description: 'Report a problem or non-conformance',
    messageTemplate: `**Issue:** \n**Impact:** \n**Steps to Reproduce:** \n**Expected Behavior:** `,
  },
  {
    id: 'request',
    label: 'Request / Action Needed',
    description: 'Request an action or decision from participants',
    messageTemplate: `**Request:** \n**Deadline:** \n**Context:** \n**Required From:** `,
  },
  {
    id: 'announcement',
    label: 'Announcement',
    description: 'Share important information with the team',
    messageTemplate: `**Summary:** \n**Effective Date:** \n**Details:** \n**Action Required:** `,
  },
  {
    id: 'review',
    label: 'Review Request',
    description: 'Request a review of a document or deliverable',
    messageTemplate: `**Document/Item:** \n**Review Deadline:** \n**Key Areas to Review:** \n**Notes:** `,
  },
];

export function getThreadTemplate(threadType: string): ThreadTemplate | undefined {
  return THREAD_TEMPLATES.find(t => t.id === threadType);
}
