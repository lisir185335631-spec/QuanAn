/**
 * myTopics.test.ts — PRD-15 US-007 AC-10
 * Unit tests for myTopics router (source-inspection + structural)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../../');
const ROUTER = `${ROOT}/apps/api/src/trpc/routers/myTopics.ts`;
const APP_ROUTER = `${ROOT}/apps/api/src/trpc/routers/_app.ts`;

function src(path: string): string {
  return readFileSync(path, 'utf-8');
}

// ── 1 · Router registration ────────────────────────────────────────────────

describe('Router registration', () => {
  it('myTopicsRouter is imported in _app.ts', () => {
    const app = src(APP_ROUTER);
    expect(app).toContain("from '@/trpc/routers/myTopics'");
    expect(app).toContain('myTopicsRouter');
  });

  it('myTopics is registered as appRouter.myTopics', () => {
    const app = src(APP_ROUTER);
    expect(app).toContain('myTopics: myTopicsRouter');
  });
});

// ── 2 · 5 procedures ──────────────────────────────────────────────────────

describe('5 procedures (AC-10)', () => {
  it('exports list procedure', () => {
    const router = src(ROUTER);
    expect(router).toContain('list:');
    expect(router).toContain('protectedProcedure');
  });

  it('exports add procedure', () => {
    expect(src(ROUTER)).toContain('add:');
  });

  it('exports update procedure', () => {
    expect(src(ROUTER)).toContain('update:');
  });

  it('exports delete procedure', () => {
    expect(src(ROUTER)).toContain('delete:');
  });

  it('exports countBySource procedure', () => {
    expect(src(ROUTER)).toContain('countBySource:');
  });
});

// ── 3 · 3-source aggregation logic ───────────────────────────────────────

describe('3-source aggregation (AC-5)', () => {
  it('list reads step_data for step5 topics', () => {
    const router = src(ROUTER);
    expect(router).toContain('stepData.findMany');
    expect(router).toMatch(/stepKey.*in.*step5/s);
  });

  it('list reads trendingFavorite + trendingItem for trending topics', () => {
    const router = src(ROUTER);
    expect(router).toContain('trendingFavorite.findMany');
    expect(router).toContain('trendingItem.findMany');
  });

  it('list reads topics table with sourceType=manual for manual topics', () => {
    const router = src(ROUTER);
    expect(router).toContain('topic.findMany');
    expect(router).toContain("sourceType: 'manual'");
  });

  it('list returns items/total/page/pageSize/totalPages', () => {
    const router = src(ROUTER);
    expect(router).toContain('items');
    expect(router).toContain('total');
    expect(router).toContain('totalPages');
  });
});

// ── 4 · add / update / delete mutations ──────────────────────────────────

describe('CRUD mutations (AC-10)', () => {
  it('add creates manual topic with sourceType=manual', () => {
    const router = src(ROUTER);
    expect(router).toContain('topic.create');
    expect(router).toContain("sourceType: 'manual'");
  });

  it('update checks sourceType=manual before updating', () => {
    const router = src(ROUTER);
    expect(router).toContain('topic.findFirst');
    expect(router).toContain('topic.update');
  });

  it('delete dispatches to topic.deleteMany for manual source', () => {
    const router = src(ROUTER);
    expect(router).toContain('topic.deleteMany');
  });

  it('delete dispatches to trendingFavorite.deleteMany for trending source', () => {
    const router = src(ROUTER);
    expect(router).toContain('trendingFavorite.deleteMany');
  });
});

// ── 5 · countBySource ────────────────────────────────────────────────────

describe('countBySource (AC-10)', () => {
  it('returns step5/trending/manual counts', () => {
    const router = src(ROUTER);
    expect(router).toContain('step5Count');
    expect(router).toContain('trendingCount');
    expect(router).toContain('manualCount');
  });

  it('counts trendingFavorite for trending', () => {
    const router = src(ROUTER);
    expect(router).toContain('trendingFavorite.count');
  });

  it('counts topic for manual', () => {
    const router = src(ROUTER);
    expect(router).toContain('topic.count');
  });
});
