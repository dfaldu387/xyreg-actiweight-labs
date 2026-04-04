import type { VVPlan } from '@/services/vvService';
import type { DocumentTemplate, DocumentSection, DocumentContent } from '@/types/documentComposer';

function makeContent(id: string, text: string, isAI = false): DocumentContent {
  return {
    id,
    type: 'paragraph',
    content: text,
    isAIGenerated: isAI,
    metadata: {
      confidence: 1,
      lastModified: new Date(),
      author: 'user',
      dataSource: text ? 'auto-populated' : 'missing',
      populatedFrom: text ? 'V&V Plan' : undefined,
    },
  };
}

function makeSection(id: string, title: string, order: number, contentText: string): DocumentSection {
  return {
    id,
    title,
    order,
    content: [makeContent(`${id}-1`, contentText)],
  };
}

/**
 * Converts a VVPlan into a DocumentTemplate that can be loaded in Document Studio.
 * Includes source metadata so the Studio sidebar can show V&V-specific details.
 */
export function convertVVPlanToDocumentTemplate(plan: VVPlan): DocumentTemplate {
  const sections: DocumentSection[] = [];

  // 1. Plan Information
  sections.push(
    makeSection('plan-info', 'Plan Information', 0,
      `<strong>Name:</strong> ${plan.name}<br/><strong>Version:</strong> ${plan.version}${plan.description ? `<br/><strong>Description:</strong> ${plan.description}` : ''}`)
  );

  // 2. Scope & Boundaries
  sections.push(makeSection('scope', 'Scope & Boundaries', 1, plan.scope || ''));

  // 3. Methodology
  sections.push(makeSection('methodology', 'Methodology', 2, plan.methodology || ''));

  // 4. Test Strategy
  const testStrategyParts: string[] = [];
  if (plan.methodology) {
    const methods = plan.methodology.split(', ');
    methods.forEach(m => testStrategyParts.push(`<li>${m}</li>`));
  }
  sections.push(
    makeSection('test-strategy', 'Test Strategy', 3,
      testStrategyParts.length > 0 ? `<ul>${testStrategyParts.join('')}</ul>` : '')
  );

  // 5. Acceptance Criteria
  sections.push(makeSection('acceptance-criteria', 'Acceptance Criteria', 4, plan.acceptance_criteria || ''));

  // 6. Roles & Responsibilities
  let rolesHtml = '';
  const roles = plan.roles_responsibilities;
  if (roles && typeof roles === 'object') {
    rolesHtml = '<table><thead><tr><th>Role</th><th>Responsibility</th></tr></thead><tbody>';
    if (Array.isArray(roles)) {
      (roles as Array<{ role: string; responsibility: string }>).forEach(r => {
        rolesHtml += `<tr><td>${r.role}</td><td>${r.responsibility}</td></tr>`;
      });
    } else {
      Object.entries(roles).forEach(([role, resp]) => {
        rolesHtml += `<tr><td>${role}</td><td>${String(resp)}</td></tr>`;
      });
    }
    rolesHtml += '</tbody></table>';
  }
  sections.push(makeSection('roles', 'Roles & Responsibilities', 5, rolesHtml));

  // 7. Revision History (empty, for user to fill)
  sections.push(makeSection('revision-history', 'Revision History', 6, ''));

  return {
    id: `VV-PLAN-${plan.id}`,
    name: plan.name,
    type: 'V&V Plan',
    sections,
    productContext: {
      id: plan.product_id,
      name: plan.name,
      riskClass: '',
      phase: '',
      regulatoryRequirements: [],
    },
    metadata: {
      version: plan.version,
      lastUpdated: new Date(),
      estimatedCompletionTime: '30 minutes',
      // V&V source metadata so Document Studio knows this is a V&V Plan
      source: 'vv-plan',
      vvPlanId: plan.id,
      vvPlanStatus: plan.status,
      vvScopeType: plan.scope_type || 'individual',
      vvFamilyIdentifier: plan.family_identifier || undefined,
      vvMethodology: plan.methodology || '',
      vvAcceptanceCriteria: plan.acceptance_criteria || '',
    } as any,
  };
}
