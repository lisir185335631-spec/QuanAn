/**
 * 管理后台模块自动化验收(冒烟)脚本
 * 用法: pnpm test:admin-smoke   (或 node scripts/admin-acceptance.mjs)
 * 前置: admin :5174 / api :3000 / Postgres :5432 在跑
 * 登录: dev mock-OAuth(super_admin email · 无密码/MFA)
 * 输出: 逐模块 PASS/FAIL + 截图 /tmp/admin-<mod>.png + 汇总表;退出码 0=全过 / 1=登录失败 / 2=有 FAIL
 */
import { chromium } from '@playwright/test';

const BASE = process.env.ADMIN_URL ?? 'http://localhost:5174';
// dev mock-OAuth 超管邮箱(按需改;脚本会依次尝试直到登录成功)
const LOGIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'super@quanan.com,super@quanqn.com,browser-test@quanqn.com').split(',');

const MODULES = [
  // 阶段2 本会话新增的 5 个
  { key: 'diagnosis',      path: '/admin/diagnosis',        label: '诊断报告',     group: '新增' },
  { key: 'step-data',      path: '/admin/step-data',        label: '用户内容',     group: '新增' },
  { key: 'history',        path: '/admin/history',          label: '生成历史',     group: '新增' },
  { key: 'topics',         path: '/admin/topics',           label: '选题库',       group: '新增' },
  { key: 'daily-tasks',    path: '/admin/daily-tasks',      label: '每日任务',     group: '新增' },
  // 复用/已存的 4 个
  { key: 'accounts',       path: '/admin/accounts',         label: 'IP账号管理',   group: '复用' },
  { key: 'evolution',      path: '/admin/evolution-health', label: '演化健康',     group: '复用' },
  { key: 'reviewTrending', path: '/admin/reviewTrending',   label: 'Trending审核', group: '复用' },
  { key: 'reviewDeepLearn',path: '/admin/reviewDeepLearn',  label: 'DeepLearn审核',group: '复用' },
];

const ERR_MARKERS = ['数据加载失败', '加载失败', '出错了', '无权访问', 'Forbidden', '403', 'UNAUTHORIZED', 'Something went wrong'];

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

// ── 1. 登录 ──────────────────────────────────────────────
let loggedInAs = null;
for (const email of LOGIN_EMAILS) {
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const input = await page.$('#admin-email');
  if (!input) break;
  await input.fill(email.trim());
  for (const b of await page.$$('button')) {
    const t = (await b.innerText().catch(() => '')) || '';
    if (/登录|OAuth|login/i.test(t) && (await b.isEnabled().catch(() => false))) { await b.click(); break; }
  }
  await page.waitForTimeout(2500);
  if (!page.url().includes('/login')) { loggedInAs = email.trim(); break; }
}
console.log(loggedInAs ? `✅ 登录成功: ${loggedInAs} → ${page.url()}` : '❌ 登录失败(检查 admin email / 服务在跑)');
if (!loggedInAs) { await browser.close(); process.exit(1); }

// ── 2. 逐模块验收 ────────────────────────────────────────
const results = [];
for (const m of MODULES) {
  const errs = [];
  const onConsole = (msg) => { if (msg.type() === 'error') errs.push(msg.text()); };
  const onPageErr = (e) => errs.push(String(e.message ?? e));
  page.on('console', onConsole);
  page.on('pageerror', onPageErr);
  await page.goto(BASE + m.path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  const probe = await page.evaluate((markers) => {
    const t = document.body.innerText;
    return {
      url: location.pathname,
      errText: markers.find((mk) => t.includes(mk)) ?? null,
      hasTable: !!document.querySelector('table') || /共\s*\d+\s*条|暂无/.test(t),
      kpiish: /\d/.test(t) && t.length > 200,
    };
  }, ERR_MARKERS);
  let shot = '';
  try { await page.screenshot({ path: `/tmp/admin-${m.key}.png`, fullPage: true, timeout: 7000 }); shot = `/tmp/admin-${m.key}.png`; }
  catch { shot = '(截图超时)'; }
  page.removeListener('console', onConsole);
  page.removeListener('pageerror', onPageErr);
  const redirected = probe.url.includes('/login');
  const pass = !redirected && !probe.errText && (probe.hasTable || probe.kpiish);
  results.push({ ...m, pass, redirected, errText: probe.errText, render: probe.hasTable ? 'table' : (probe.kpiish ? 'content' : 'sparse'), errs: errs.length, shot });
}

// ── 3. 汇总 ──────────────────────────────────────────────
console.log('\n=== 验收汇总 ===');
for (const r of results) {
  console.log(`${r.pass ? '✅PASS' : '❌FAIL'} [${r.group}] ${r.label.padEnd(12)} ${r.path}` +
    `  render=${r.render} consoleErr=${r.errs}` +
    (r.redirected ? ' ⚠被踢回登录' : '') + (r.errText ? ` ⚠"${r.errText}"` : ''));
}
const passed = results.filter((r) => r.pass).length;
console.log(`\n总计: ${passed}/${results.length} PASS · 登录=${loggedInAs} · 截图在 /tmp/admin-*.png`);
await browser.close();
process.exit(passed === results.length ? 0 : 2);
