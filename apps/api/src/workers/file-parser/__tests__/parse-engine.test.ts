/**
 * PRD-37 US-P07 · parse-engine unit tests
 *
 * Each format: construct small fixture buffer or mock library → assert parsedText non-empty.
 * Libraries are mocked to avoid binary test fixtures and JVM/native deps.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock parse libraries before importing parse-engine
// ---------------------------------------------------------------------------

const mockGetText = vi.fn();
const mockPDFParseCtor = vi.fn().mockImplementation(() => ({
  getText: mockGetText,
}));

vi.mock('pdf-parse', () => ({
  PDFParse: mockPDFParseCtor,
}));

const mockMammothExtract = vi.fn();
vi.mock('mammoth', () => ({
  default: { extractRawText: mockMammothExtract },
}));

const mockXLSXRead = vi.fn();
const mockSheetToCsv = vi.fn();
vi.mock('xlsx', () => ({
  read: mockXLSXRead,
  utils: { sheet_to_csv: mockSheetToCsv },
}));

const { parseFileBuffer } = await import('@/workers/file-parser/parse-engine');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('parseFileBuffer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- PDF ---

  it('PDF: routes to pdf-parse · returns text from getText()', async () => {
    mockGetText.mockResolvedValue({ text: 'PDF content extracted' });

    const buf = Buffer.from('%PDF-1.4 fake');
    const result = await parseFileBuffer(buf, 'application/pdf', 'doc.pdf');

    expect(mockPDFParseCtor).toHaveBeenCalledOnce();
    expect(mockGetText).toHaveBeenCalledOnce();
    expect(result).toBe('PDF content extracted');
  });

  it('PDF: parsedText 非空 (basic assertion)', async () => {
    mockGetText.mockResolvedValue({ text: 'some text' });
    const result = await parseFileBuffer(Buffer.from('x'), 'application/pdf', 'a.pdf');
    expect(result.length).toBeGreaterThan(0);
  });

  // --- Word (.docx) ---

  it('Word DOCX: routes to mammoth · returns value from extractRawText()', async () => {
    mockMammothExtract.mockResolvedValue({ value: 'Word document text', messages: [] });

    const buf = Buffer.from('PK fake docx bytes');
    const mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const result = await parseFileBuffer(buf, mime, 'doc.docx');

    expect(mockMammothExtract).toHaveBeenCalledOnce();
    const callArg = (mockMammothExtract.mock.calls[0] as [{ buffer: Buffer }])[0];
    expect(callArg.buffer).toBeInstanceOf(Buffer);
    expect(result).toBe('Word document text');
  });

  it('Word .doc (legacy MIME) → mammoth', async () => {
    mockMammothExtract.mockResolvedValue({ value: 'legacy doc text', messages: [] });
    const result = await parseFileBuffer(Buffer.from('x'), 'application/msword', 'file.doc');
    expect(result).toBe('legacy doc text');
  });

  // --- Excel (.xlsx) ---

  it('Excel XLSX: routes to xlsx · sheet_to_csv · 非空内容', () => {
    const fakeSheet = {};
    mockXLSXRead.mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: { Sheet1: fakeSheet },
    });
    mockSheetToCsv.mockReturnValue('col1,col2\nval1,val2');

    const buf = Buffer.from('PK fake xlsx');
    const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const result = parseFileBuffer(buf, mime, 'data.xlsx');

    expect(mockXLSXRead).toHaveBeenCalledOnce();
    expect(mockSheetToCsv).toHaveBeenCalledOnce();
    return result.then((text) => {
      expect(text).toContain('col1,col2');
      expect(text).toContain('Sheet1');
    });
  });

  it('Excel: multiple sheets → both included in output', async () => {
    mockXLSXRead.mockReturnValue({
      SheetNames: ['Alpha', 'Beta'],
      Sheets: { Alpha: {}, Beta: {} },
    });
    mockSheetToCsv
      .mockReturnValueOnce('a,b\n1,2')
      .mockReturnValueOnce('c,d\n3,4');

    const result = await parseFileBuffer(Buffer.from('x'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'wb.xlsx');
    expect(result).toContain('Alpha');
    expect(result).toContain('Beta');
    expect(result).toContain('a,b');
    expect(result).toContain('c,d');
  });

  it('Excel .xls (legacy MIME) → xlsx router', async () => {
    mockXLSXRead.mockReturnValue({ SheetNames: ['S1'], Sheets: { S1: {} } });
    mockSheetToCsv.mockReturnValue('x,y\n1,2');
    const result = await parseFileBuffer(Buffer.from('x'), 'application/vnd.ms-excel', 'old.xls');
    expect(result).toContain('x,y');
  });

  // --- CSV / MD / TXT (utf-8 direct read) ---

  it('CSV: direct utf-8 read · content matches', async () => {
    const content = 'name,age\nalice,30\nbob,25';
    const buf = Buffer.from(content, 'utf-8');
    const result = await parseFileBuffer(buf, 'text/csv', 'data.csv');
    expect(result).toBe(content);
    // parse-engine 不应调用任何 library mock
    expect(mockPDFParseCtor).not.toHaveBeenCalled();
    expect(mockMammothExtract).not.toHaveBeenCalled();
    expect(mockXLSXRead).not.toHaveBeenCalled();
  });

  it('Markdown: direct utf-8 read', async () => {
    const content = '# Title\n\nSome **bold** text.';
    const result = await parseFileBuffer(Buffer.from(content, 'utf-8'), 'text/markdown', 'README.md');
    expect(result).toBe(content);
  });

  it('TXT: direct utf-8 read', async () => {
    const content = 'plain text file\nline two';
    const result = await parseFileBuffer(Buffer.from(content, 'utf-8'), 'text/plain', 'notes.txt');
    expect(result).toBe(content);
  });

  // --- unknown MIME fallback ---

  it('unknown MIME → returns empty string', async () => {
    const result = await parseFileBuffer(Buffer.from('binary'), 'image/png', 'photo.png');
    expect(result).toBe('');
  });
});
