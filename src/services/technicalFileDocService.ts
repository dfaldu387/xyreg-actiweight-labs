/**
 * Lightweight helper for TF document creation.
 * Returns the templateKey and placeholder HTML content for the SaveContentAsDocCIDialog.
 * The actual CI creation and studio save is handled by the dialog.
 */

interface PrepareTFDocParams {
  substepDescription: string;
  sectionId: string;
  substepLetter: string;
}

export function prepareTFDocumentContent(params: PrepareTFDocParams): {
  templateKey: string;
  htmlContent: string;
} {
  const { substepDescription, sectionId, substepLetter } = params;
  const sectionNumber = sectionId.replace(/^TF-/, '');
  const templateKey = `TF-${sectionNumber}-${substepLetter}`;

  const htmlContent = `
    <h1>${substepDescription}</h1>
    <p><em>[To be completed]</em></p>
    <p>This document is part of the Technical File section <strong>${sectionId}</strong>.</p>
  `.trim();

  return { templateKey, htmlContent };
}
