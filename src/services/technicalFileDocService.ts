/**
 * Lightweight helper for TF document creation.
 * Returns placeholder HTML content for the SaveContentAsDocCIDialog.
 * The CI UUID is the single identity — no deterministic templateKey needed.
 */

interface PrepareTFDocParams {
  substepDescription: string;
  sectionId: string;
  substepLetter: string;
  /** When true, generates a unique reference for additional evidence documents */
  isAdditional?: boolean;
}

export function prepareTFDocumentContent(params: PrepareTFDocParams): {
  documentReference: string;
  htmlContent: string;
} {
  const { substepDescription, sectionId, substepLetter, isAdditional } = params;
  const sectionNumber = sectionId.replace(/^TF-/, '');
  const baseRef = `TF-${sectionNumber}-${substepLetter}`;
  const documentReference = isAdditional
    ? `${baseRef}-ATT-${Date.now()}`
    : baseRef;

  const htmlContent = `
    <h1>${substepDescription}</h1>
    <p><em>[To be completed]</em></p>
    <p>This document is part of the Technical File section <strong>${sectionId}</strong>.</p>
  `.trim();

  return { documentReference, htmlContent };
}
