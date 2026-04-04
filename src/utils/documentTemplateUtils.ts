export function getDefaultSectionsForType(docType: string) {
  const makeSection = (id: string, title: string, order: number) => ({
    id,
    title,
    content: [{ id: `${id}-1`, type: 'paragraph' as const, content: '', isAIGenerated: false }],
    order,
  });

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
