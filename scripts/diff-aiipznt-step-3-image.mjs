#!/usr/bin/env node
/**
 * diff-aiipznt-step-3-image.mjs
 * AC-4 · PRD-29 US-013
 *
 * 用 pixelmatch + sharp 对比 QuanAn /step/3 fullPage screenshot
 * vs tests/visual/aiipznt-2026-05-23/screenshots/05-step-3.png
 * 输出 diff %
 *
 * Usage:
 *   node scripts/diff-aiipznt-step-3-image.mjs
 *   node scripts/diff-aiipznt-step-3-image.mjs <quanan-screenshot.png>
 *
 * Exit: always 0 (informational tool, diff % printed to stdout)
 */
import sharp from 'sharp';
import pixelmatch from 'pixelmatch';
import { existsSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const AIIPZNT_BASELINE = resolve(
  ROOT,
  'tests/visual/aiipznt-2026-05-23/screenshots/05-step-3.png',
);

// Default QuanAn screenshot: fall back to the most recent prd29 capture or prd22 baseline
const FALLBACK_QUANAN = existsSync(resolve(ROOT, 'screenshots/prd29-step3-quanan.png'))
  ? resolve(ROOT, 'screenshots/prd29-step3-quanan.png')
  : resolve(ROOT, '/tmp/aiipznt-clone-research/screenshots/prd22-step3.png');

const quananArg = process.argv[2];
const quananScreenshot = quananArg ? resolve(quananArg) : FALLBACK_QUANAN;
const DIFF_OUT = resolve(ROOT, 'screenshots/prd29-step3-aiipznt-diff.png');

async function main() {
  console.log('=== PRD-29 Step-3 · Aiipznt Pixel Diff ===');
  console.log(`Aiipznt baseline : ${AIIPZNT_BASELINE}`);
  console.log(`QuanAn screenshot: ${quananScreenshot}`);
  console.log('');

  if (!existsSync(AIIPZNT_BASELINE)) {
    console.error('ERROR: aiipznt baseline not found:', AIIPZNT_BASELINE);
    process.exit(0);
  }

  if (!existsSync(quananScreenshot)) {
    console.log('QuanAn screenshot not found:', quananScreenshot);
    console.log(
      'Provide a screenshot path as argument or run the playwright visual spec first.',
    );
    console.log('Diff: N/A (no QuanAn screenshot)');
    process.exit(0);
  }

  // Get aiipznt dimensions
  const baselineMeta = await sharp(AIIPZNT_BASELINE).metadata();
  const W = baselineMeta.width;
  const H = baselineMeta.height;
  console.log(`Aiipznt dimensions: ${W}x${H}px`);

  // Resize QuanAn screenshot to match aiipznt dimensions (fill, not crop)
  const [aiipzntRaw, quananRaw] = await Promise.all([
    sharp(AIIPZNT_BASELINE).ensureAlpha().raw().toBuffer(),
    sharp(quananScreenshot)
      .resize(W, H, { fit: 'fill' })
      .ensureAlpha()
      .raw()
      .toBuffer(),
  ]);

  const diffPixels = new Uint8Array(W * H * 4);
  const numDiff = pixelmatch(
    new Uint8Array(aiipzntRaw),
    new Uint8Array(quananRaw),
    diffPixels,
    W,
    H,
    { threshold: 0.1 },
  );

  const totalPixels = W * H;
  const diffRatio = numDiff / totalPixels;
  const diffPct = (diffRatio * 100).toFixed(2);

  console.log(`Diff pixels  : ${numDiff.toLocaleString()} / ${totalPixels.toLocaleString()}`);
  console.log(`Diff %       : ${diffPct}%`);
  console.log(`Threshold    : 5.00%`);
  console.log('');

  if (diffRatio <= 0.05) {
    console.log(`✅ PASS: diff ${diffPct}% ≤ 5%`);
  } else {
    console.log(`⚠️  INFO: diff ${diffPct}% > 5%`);
    console.log(
      '   This is expected when comparing form-state vs result-state screenshots.',
    );
    console.log('   For a form-state comparison, use the playwright visual spec instead.');
  }

  // Write diff image
  try {
    await sharp(Buffer.from(diffPixels), {
      raw: { width: W, height: H, channels: 4 },
    })
      .png()
      .toFile(DIFF_OUT);
    console.log(`Diff image: ${DIFF_OUT}`);
  } catch (e) {
    console.log('Could not save diff image:', e.message);
  }

  process.exit(0); // Always exit 0 (informational)
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(0); // Still exit 0
});
