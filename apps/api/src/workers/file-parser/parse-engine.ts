/**
 * FileParser Parse Engine — PRD-37 US-P07
 *
 * Routing: MIME/extension → parser library → plain text.
 * S3 status: TRUE S3 upload awaiting credentials; currently mock/local only.
 * All parse functions accept a Node.js Buffer and return plain text.
 */

import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export type SupportedMime =
  | 'application/pdf'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'text/csv'
  | 'text/markdown'
  | 'text/x-markdown'
  | 'text/plain'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'application/vnd.ms-excel';

/**
 * Parse a file buffer into plain text based on MIME type.
 *
 * @param buffer  - File bytes
 * @param mime    - MIME type string
 * @param fileName - Original filename (used as fallback for extension routing)
 * @returns Extracted plain text, or empty string on parse failure
 */
export async function parseFileBuffer(
  buffer: Buffer,
  mime: string,
  fileName: string,
): Promise<string> {
  const lowerMime = mime.toLowerCase();
  const lowerName = fileName.toLowerCase();

  // PDF → pdf-parse
  // file:parse-engine.ts:38
  if (lowerMime === 'application/pdf' || lowerName.endsWith('.pdf')) {
    return parsePdf(buffer);
  }

  // Word (.docx / .doc) → mammoth extractRawText
  // file:parse-engine.ts:44
  if (
    lowerMime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lowerMime === 'application/msword' ||
    lowerName.endsWith('.docx') ||
    lowerName.endsWith('.doc')
  ) {
    return parseWord(buffer);
  }

  // Excel (.xlsx / .xls) → xlsx sheet_to_csv
  // file:parse-engine.ts:56
  if (
    lowerMime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    lowerMime === 'application/vnd.ms-excel' ||
    lowerName.endsWith('.xlsx') ||
    lowerName.endsWith('.xls')
  ) {
    return parseExcel(buffer);
  }

  // CSV / MD / TXT → utf-8 direct read
  // file:parse-engine.ts:65
  if (
    lowerMime.startsWith('text/') ||
    lowerName.endsWith('.csv') ||
    lowerName.endsWith('.md') ||
    lowerName.endsWith('.txt')
  ) {
    return buffer.toString('utf-8');
  }

  return '';
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Extract text from PDF buffer using pdf-parse v2 PDFParse class */
async function parsePdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  return result.text;
}

/** Extract raw text from Word (.docx) buffer using mammoth */
async function parseWord(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Convert Excel (.xlsx) workbook to text via xlsx.
 * Each sheet is rendered as CSV, sheets separated by double newline.
 * S3 status: mock/local only — real S3 upload awaiting credentials.
 */
function parseExcel(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const parts: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (sheet === undefined) continue;
    const csv = XLSX.utils.sheet_to_csv(sheet);
    if (csv.trim()) {
      parts.push(`Sheet: ${sheetName}\n${csv}`);
    }
  }
  return parts.join('\n\n');
}
