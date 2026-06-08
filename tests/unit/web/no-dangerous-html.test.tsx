/**
 * no-dangerous-html.test.tsx — XSS safety scan
 *
 * Replaces the per-component safety assertions formerly in:
 *   - ToolResult.test.tsx (PRD-5 US-001 AC-20) — deleted: components/ToolResult/ no longer exists
 *   - StepResult.test.tsx (PRD-4 US-012 AC-10) — deleted: components/StepResult/ no longer exists
 *
 * Scans ALL .tsx files under apps/web/src to assert:
 *   1. No file uses dangerouslySetInnerHTML (XSS injection vector)
 *
 * Node environment — readFileSync + glob pattern, no React render.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';

const ROOT = resolve(__dirname, '../../../');
const WEB_SRC = join(ROOT, 'apps/web/src');

/** Recursively collect all .tsx files under a directory */
function collectTsxFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...collectTsxFiles(full));
    } else if (entry.endsWith('.tsx')) {
      results.push(full);
    }
  }
  return results;
}

describe('XSS safety: no dangerouslySetInnerHTML in apps/web/src', () => {
  it('no .tsx file uses dangerouslySetInnerHTML', () => {
    const files = collectTsxFiles(WEB_SRC);
    expect(files.length).toBeGreaterThan(0);

    const violations: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, 'utf-8');
      if (src.includes('dangerouslySetInnerHTML')) {
        violations.push(file.replace(ROOT + '/', ''));
      }
    }

    expect(
      violations,
      `dangerouslySetInnerHTML found in: ${violations.join(', ')}`,
    ).toHaveLength(0);
  });
});
