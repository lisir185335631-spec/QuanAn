/**
 * QuanAn 全站验收 smoke — 遍历全部 32 真实路由 + 4 故意 404
 * 每页：goto → 等渲染 → 渲染健康度检查 → 1440px 全页截图
 * 产出：/tmp/quanan-smoke/summary.json + shots/*.png
 * 用法：node scripts/site-smoke.mjs   (需 web dev server 在 :5173)
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const BASE = process.env.SMOKE_BASE || 'http://localhost:5173';
const OUT = '/tmp/quanan-smoke';
fs.mkdirSync(OUT + '/shots', { recursive: true });

const realRoutes = [
  ['home', '/'], ['guide', '/guide'],
  ['step-1', '/step/1'], ['step-3', '/step/3'], ['step-3b', '/step/3b'],
  ['step-4', '/step/4'], ['step-4b', '/step/4b'], ['step-5', '/step/5'],
  ['step-6', '/step/6'], ['step-7', '/step/7'], ['step-8', '/step/8'],
  ['trending', '/trending'], ['present-styles', '/present-styles'],
  ['monetization', '/monetization'], ['private-domain', '/private-domain'],
  ['boom-generate', '/boom-generate'], ['generate', '/generate'],
  ['analysis', '/analysis'], ['video-analysis', '/video-analysis'],
  ['video-production', '/video-production'], ['acquisition-video', '/acquisition-video'],
  ['ai-video', '/ai-video'], ['voice-chat', '/voice-chat'],
  ['deep-learning', '/deep-learning'], ['knowledge', '/knowledge'],
  ['diagnosis', '/diagnosis'], ['daily-tasks', '/daily-tasks'],
  ['evolution', '/evolution'], ['accounts', '/accounts'],
  ['my-topics', '/my-topics'], ['history', '/history'], ['ip-plan', '/ip-plan'],
];
const intended404 = [
  ['404-step-2', '/step/2'], ['404-step-9', '/step/9'],
  ['404-copywriting', '/copywriting'], ['404-random', '/zzz-does-not-exist'],
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const results = [];

async function visit(name, path, expect404) {
  const page = await ctx.newPage();
  const consoleErrors = [], pageErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 200)));
  let status = null;
  try {
    const resp = await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 20000 });
    status = resp ? resp.status() : null;
  } catch (e) { pageErrors.push('GOTO_FAIL: ' + String(e).slice(0, 120)); }
  await page.waitForTimeout(1500);
  const bodyText = (await page.locator('body').innerText().catch(() => '')) || '';
  const textLen = bodyText.trim().length;
  const hasErrorBoundary = /something went wrong|出错了|render error|ErrorBoundary|Application error/i.test(bodyText);
  const is404 = /404|not found|页面不存在|找不到页面|页面走丢/i.test(bodyText);
  const rootHtml = await page.locator('#root').innerHTML().catch(() => '');
  const blank = rootHtml.trim().length < 60;
  await page.screenshot({ path: `${OUT}/shots/${name}.png`, fullPage: true }).catch(() => {});
  const ok = expect404
    ? (is404 && pageErrors.length === 0)
    : (!blank && !hasErrorBoundary && !is404 && textLen > 80 && pageErrors.length === 0);
  results.push({ name, path, expect404, status, textLen, blank, hasErrorBoundary, is404, consoleErrors: consoleErrors.length, pageErrors, ok });
  process.stdout.write(ok ? '.' : 'X');
  await page.close();
}

for (const [n, p] of realRoutes) await visit(n, p, false);
for (const [n, p] of intended404) await visit(n, p, true);
await browser.close();

fs.writeFileSync(OUT + '/summary.json', JSON.stringify(results, null, 2));
const pass = results.filter((r) => r.ok).length;
console.log(`\n\nSMOKE DONE: ${pass}/${results.length} ok  (real ${results.filter(r=>!r.expect404&&r.ok).length}/${realRoutes.length}, 404 ${results.filter(r=>r.expect404&&r.ok).length}/${intended404.length})`);
for (const r of results.filter((r) => !r.ok)) {
  console.log(`  X ${r.path}  ` + JSON.stringify({ status: r.status, blank: r.blank, errBoundary: r.hasErrorBoundary, is404: r.is404, textLen: r.textLen, pageErrors: r.pageErrors.slice(0, 1) }));
}
