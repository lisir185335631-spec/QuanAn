/**
 * PRD-28 US-004 · GoldenDataset schema + count validation
 * AC-8: ≥4 tests — schema / count / specialistId / source
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  goldenSampleSchema,
  goldenDatasetSchema,
  SPECIALIST_IDS,
} from '../../../../packages/schemas/src/judge-golden.schema';

// ── Load fixtures ─────────────────────────────────────────────────────────────

const FIXTURES_DIR = join(__dirname, '..');

function loadDataset(filename: string) {
  const raw = readFileSync(join(FIXTURES_DIR, filename), 'utf-8');
  return JSON.parse(raw) as unknown;
}

const sallyRaw = loadDataset('sally-30.json');
const customRaw = loadDataset('custom-70.json');

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GoldenSample schema validation', () => {
  it('all sally-30 entries pass goldenSampleSchema', () => {
    const dataset = goldenDatasetSchema.safeParse(sallyRaw);
    if (!dataset.success) {
      throw new Error(`sally-30.json schema errors:\n${JSON.stringify(dataset.error.issues.slice(0, 5), null, 2)}`);
    }
    expect(dataset.success).toBe(true);
  });

  it('all custom-70 entries pass goldenSampleSchema', () => {
    const dataset = goldenDatasetSchema.safeParse(customRaw);
    if (!dataset.success) {
      throw new Error(`custom-70.json schema errors:\n${JSON.stringify(dataset.error.issues.slice(0, 5), null, 2)}`);
    }
    expect(dataset.success).toBe(true);
  });
});

describe('Count validation', () => {
  it('sally-30.json has exactly 30 entries', () => {
    expect(Array.isArray(sallyRaw)).toBe(true);
    expect((sallyRaw as unknown[]).length).toBe(30);
  });

  it('custom-70.json has exactly 70 entries', () => {
    expect(Array.isArray(customRaw)).toBe(true);
    expect((customRaw as unknown[]).length).toBe(70);
  });

  it('combined dataset has exactly 100 entries', () => {
    const total = (sallyRaw as unknown[]).length + (customRaw as unknown[]).length;
    expect(total).toBe(100);
  });
});

describe('specialistId validity', () => {
  it('all sally entries have a valid specialistId from 14-specialist enum', () => {
    const parsed = goldenDatasetSchema.parse(sallyRaw);
    const validIds = new Set<string>(SPECIALIST_IDS);
    for (const entry of parsed) {
      expect(validIds.has(entry.specialistId)).toBe(true);
    }
  });

  it('all custom entries have a valid specialistId from 14-specialist enum', () => {
    const parsed = goldenDatasetSchema.parse(customRaw);
    const validIds = new Set<string>(SPECIALIST_IDS);
    for (const entry of parsed) {
      expect(validIds.has(entry.specialistId)).toBe(true);
    }
  });

  it('all specialist IDs are from the canonical 14-item list', () => {
    expect(SPECIALIST_IDS).toHaveLength(14);
    expect(SPECIALIST_IDS).toContain('CopywritingAgent');
    expect(SPECIALIST_IDS).toContain('BrandingAgent');
    expect(SPECIALIST_IDS).toContain('EvolutionAgent');
    expect(SPECIALIST_IDS).toContain('DailyTaskAgent');
  });
});

describe('source field marking', () => {
  it('all sally-30 entries have source=sally', () => {
    const parsed = goldenDatasetSchema.parse(sallyRaw);
    for (const entry of parsed) {
      expect(entry.source).toBe('sally');
    }
  });

  it('all custom-70 entries have source=custom', () => {
    const parsed = goldenDatasetSchema.parse(customRaw);
    for (const entry of parsed) {
      expect(entry.source).toBe('custom');
    }
  });

  it('custom-70 CopywritingAgent quota >= 12', () => {
    const parsed = goldenDatasetSchema.parse(customRaw);
    const count = parsed.filter(e => e.specialistId === 'CopywritingAgent').length;
    expect(count).toBeGreaterThanOrEqual(12);
  });

  it('custom-70 BrandingAgent quota >= 10', () => {
    const parsed = goldenDatasetSchema.parse(customRaw);
    const count = parsed.filter(e => e.specialistId === 'BrandingAgent').length;
    expect(count).toBeGreaterThanOrEqual(10);
  });

  it('custom-70 TopicAgent quota >= 8', () => {
    const parsed = goldenDatasetSchema.parse(customRaw);
    const count = parsed.filter(e => e.specialistId === 'TopicAgent').length;
    expect(count).toBeGreaterThanOrEqual(8);
  });

  it('id format matches (sally|custom)-NNN pattern', () => {
    const sallyParsed = goldenDatasetSchema.parse(sallyRaw);
    const customParsed = goldenDatasetSchema.parse(customRaw);
    const pattern = /^(sally|custom)-\d{3}$/;
    for (const entry of [...sallyParsed, ...customParsed]) {
      expect(pattern.test(entry.id)).toBe(true);
    }
  });

  it('criteria has at least 2 items per entry', () => {
    const sallyParsed = goldenDatasetSchema.parse(sallyRaw);
    const customParsed = goldenDatasetSchema.parse(customRaw);
    for (const entry of [...sallyParsed, ...customParsed]) {
      expect(entry.criteria.length).toBeGreaterThanOrEqual(2);
    }
  });
});
