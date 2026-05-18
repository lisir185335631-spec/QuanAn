import * as path from 'path';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export const AIIPZNT_BASELINE_DIR = '/tmp/aiipznt-clone-research/screenshots';

export interface ExpectVisualMatchOptions {
  baseline: string;
  viewport?: { width: number; height: number };
  fullPage?: boolean;
  maxDiffPixelRatio?: number;
  clip?: { x: number; y: number; width: number; height: number };
}

export async function expectVisualMatch(
  page: Page,
  options: ExpectVisualMatchOptions,
): Promise<void> {
  if (options.viewport) {
    await page.setViewportSize(options.viewport);
  }
  const baselinePath = path.join(AIIPZNT_BASELINE_DIR, options.baseline);
  await expect(page).toHaveScreenshot([baselinePath], {
    maxDiffPixelRatio: options.maxDiffPixelRatio ?? 0.05,
    fullPage: options.fullPage ?? false,
    ...(options.clip != null ? { clip: options.clip } : {}),
  });
}
