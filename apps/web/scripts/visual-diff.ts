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
  const {
    baseline,
    viewport = { width: 1440, height: 900 },
    fullPage = true,
    maxDiffPixelRatio = 0.05,
    clip,
  } = options;
  await page.setViewportSize(viewport);
  const filename = baseline.endsWith('.png') ? baseline : `${baseline}.png`;
  const baselinePath = path.join(AIIPZNT_BASELINE_DIR, filename);
  await expect(page).toHaveScreenshot([baselinePath], {
    maxDiffPixelRatio,
    fullPage,
    ...(clip != null ? { clip } : {}),
  });
}
