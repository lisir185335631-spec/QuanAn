// PRD-11 US-018 stub — real implementation in US-018 (pdf-forensic PDF generation)
// This file provides the interface contract; US-018 will replace the body.

export interface ForensicPdfInput {
  traceId: string;
  caseNumber: string;
  reason: string;
  timeline: unknown[];
  generatedByAdminId: number;
  generatedByRole: string;
}

export async function generateForensicPdf(input: ForensicPdfInput): Promise<string> {
  // US-018 will provide the real @react-pdf/renderer implementation.
  // For now: base64-encode a plain-text placeholder so the audit chain is exercised.
  const placeholder = JSON.stringify({
    type: 'forensic_pdf_placeholder',
    traceId: input.traceId,
    caseNumber: input.caseNumber,
    eventCount: input.timeline.length,
    generatedByAdminId: input.generatedByAdminId,
  });
  return Buffer.from(placeholder).toString('base64');
}
