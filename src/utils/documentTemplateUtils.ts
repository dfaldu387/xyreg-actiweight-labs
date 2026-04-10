export function getDefaultSectionsForType(docType: string, categoryPrefix?: string, isRecord?: boolean) {
  const makeSection = (id: string, title: string, order: number) => ({
    id,
    title,
    content: [{ id: `${id}-1`, type: 'paragraph' as const, content: '', isAIGenerated: false }],
    order,
  });

  // Record template takes priority when is_record flag is set
  if (isRecord) {
    return [
      makeSection('purpose', 'Purpose', 0),
      makeSection('scope', 'Scope', 1),
      makeSection('record-description', 'Record Description', 2),
      makeSection('data-entry', 'Data Entry Requirements', 3),
      makeSection('retention', 'Retention & Archival', 4),
      makeSection('references', 'References', 5),
      makeSection('revision-history', 'Revision History', 6),
    ];
  }

  // Category-prefix-based templates (from Document Category settings)
  if (categoryPrefix) {
    const prefix = categoryPrefix.toUpperCase();

    if (prefix === 'DD') {
      return [
        makeSection('purpose', 'Purpose', 0),
        makeSection('scope', 'Scope', 1),
        makeSection('design-inputs', 'Design Inputs', 2),
        makeSection('design-outputs', 'Design Outputs', 3),
        makeSection('design-review', 'Design Review', 4),
        makeSection('verification', 'Verification', 5),
        makeSection('validation', 'Validation', 6),
        makeSection('risk-considerations', 'Risk Considerations', 7),
        makeSection('records', 'Records & Attachments', 8),
        makeSection('revision-history', 'Revision History', 9),
      ];
    }

    if (prefix === 'RISK') {
      return [
        makeSection('purpose', 'Purpose', 0),
        makeSection('scope', 'Scope', 1),
        makeSection('risk-analysis', 'Risk Analysis', 2),
        makeSection('risk-evaluation', 'Risk Evaluation', 3),
        makeSection('risk-control', 'Risk Control', 4),
        makeSection('residual-risk', 'Residual Risk', 5),
        makeSection('risk-benefit', 'Risk-Benefit Analysis', 6),
        makeSection('risk-management-review', 'Risk Management Review', 7),
        makeSection('references', 'References', 8),
        makeSection('revision-history', 'Revision History', 9),
      ];
    }

    if (prefix === 'REG') {
      return [
        makeSection('purpose', 'Purpose', 0),
        makeSection('scope', 'Scope', 1),
        makeSection('regulatory-requirements', 'Regulatory Requirements', 2),
        makeSection('device-classification', 'Device Classification', 3),
        makeSection('essential-requirements', 'Essential Requirements / GSPR', 4),
        makeSection('clinical-evidence', 'Clinical Evidence Summary', 5),
        makeSection('post-market', 'Post-Market Plan', 6),
        makeSection('references', 'References', 7),
        makeSection('revision-history', 'Revision History', 8),
      ];
    }

    if (prefix === 'OPS') {
      return [
        makeSection('purpose', 'Purpose', 0),
        makeSection('scope', 'Scope', 1),
        makeSection('process-description', 'Process Description', 2),
        makeSection('equipment-materials', 'Equipment & Materials', 3),
        makeSection('process-controls', 'Process Controls', 4),
        makeSection('acceptance-criteria', 'Acceptance Criteria', 5),
        makeSection('nonconformance', 'Nonconformance Handling', 6),
        makeSection('records', 'Records & Attachments', 7),
        makeSection('revision-history', 'Revision History', 8),
      ];
    }

    if (prefix === 'FORM') {
      return [
        makeSection('purpose', 'Purpose', 0),
        makeSection('instructions', 'Instructions', 1),
        makeSection('form-fields', 'Form Fields / Log Entries', 2),
        makeSection('completion-criteria', 'Completion Criteria', 3),
        makeSection('references', 'References', 4),
        makeSection('revision-history', 'Revision History', 5),
      ];
    }

    if (prefix === 'TRN' || prefix === 'TRAINING') {
      return [
        makeSection('purpose', 'Purpose', 0),
        makeSection('scope', 'Scope', 1),
        makeSection('training-objectives', 'Training Objectives', 2),
        makeSection('target-audience', 'Target Audience', 3),
        makeSection('training-content', 'Training Content', 4),
        makeSection('assessment-criteria', 'Assessment Criteria', 5),
        makeSection('effectiveness', 'Effectiveness Evaluation', 6),
        makeSection('records', 'Records & Attachments', 7),
        makeSection('revision-history', 'Revision History', 8),
      ];
    }
  }

  // Existing docType-based matching (backward compatible)
  if (docType?.toLowerCase().includes('sop')) {
    return [
      makeSection('purpose', 'Purpose', 0),
      makeSection('scope', 'Scope', 1),
      makeSection('references', 'References', 2),
      makeSection('definitions', 'Definitions & Abbreviations', 3),
      makeSection('responsibilities', 'Responsibilities', 4),
      makeSection('procedure', 'Procedure', 5),
      makeSection('records', 'Records & Attachments', 6),
      makeSection('revision-history', 'Revision History', 7),
    ];
  }

  if (docType?.toLowerCase().includes('clinical')) {
    return [
      makeSection('purpose', 'Purpose', 0),
      makeSection('scope', 'Scope', 1),
      makeSection('background', 'Background', 2),
      makeSection('clinical-evidence', 'Clinical Evidence', 3),
      makeSection('risk-benefit', 'Risk-Benefit Analysis', 4),
      makeSection('conclusions', 'Conclusions', 5),
      makeSection('references', 'References', 6),
      makeSection('revision-history', 'Revision History', 7),
    ];
  }

  if (docType?.toLowerCase().includes('device-information') || docType?.toLowerCase().includes('device definition')) {
    return [
      makeSection('scope', '1. Scope & Purpose', 0),
      makeSection('device-description', '2. Device Description', 1),
      makeSection('intended-purpose', '3. Intended Purpose & Clinical Benefits', 2),
      makeSection('classification', '4. Device Classification & Characteristics', 3),
      makeSection('architecture', '5. Device Architecture & Components', 4),
      makeSection('udi', '6. Device Identification (UDI/EUDAMED)', 5),
      makeSection('reg-markets', '7. Regulatory & Market Information', 6),
      makeSection('manufacturer', '8. Manufacturer & Authorized Representative', 7),
      makeSection('variants-config', '9. Product Variants & Configurations', 8),
      makeSection('references', '10. References', 9),
    ];
  }

  // Standard / default
  return [
    makeSection('purpose', 'Purpose', 0),
    makeSection('scope', 'Scope', 1),
    makeSection('references', 'References', 2),
    makeSection('definitions', 'Definitions & Abbreviations', 3),
    makeSection('responsibilities', 'Responsibilities', 4),
    makeSection('procedure', 'Procedure / Content', 5),
    makeSection('risk-considerations', 'Risk Considerations', 6),
    makeSection('acceptance-criteria', 'Acceptance Criteria', 7),
    makeSection('records', 'Records & Attachments', 8),
    makeSection('revision-history', 'Revision History', 9),
  ];
}
