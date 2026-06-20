// PRD-16 US-011 · prd16-header-dropdown-flow.spec.ts
// AC-3: Header dropdown e2e · 5 top-level menus + 22 sub-items
// Uses @playwright/test — requires dev server on http://localhost:5173
//
// 结构说明（来自 LiquidShell.tsx + header-nav.ts）:
// - 1级 button 渲染 {group.label} 纯文本，无 aria-label，无 data-testid
// - 选择器用 getByRole('button', { name }) 或 page.getByText()
// - 2级项是 DropdownMenuItem → Link，用 getByRole('menuitem')

import { test, expect } from '@playwright/test';

test.describe('PRD-16 Header dropdown flow', () => {
  // 5 menus / 22 items (商业定位5 + 内容创作4 + 变现执行2 + 智能助手5 + 更多6)

  test('5 top-level nav groups visible on desktop', async ({ page }) => {
    await page.goto('/');
    // 1级按钮用 text 匹配 — LiquidShell.tsx 中 button 无 aria-label
    for (const label of ['商业定位', '内容创作', '变现执行', '智能助手', '更多']) {
      await expect(page.getByRole('button', { name: label })).toBeVisible();
    }
  });

  test('商业定位 dropdown has 5 items', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '商业定位' }).click();
    const items = ['选择行业', '变现路径', '账号包装', '人设定制', '执行计划'];
    for (const item of items) {
      await expect(page.getByRole('menuitem', { name: item })).toBeVisible();
    }
    await page.keyboard.press('Escape');
  });

  test('内容创作 dropdown has 4 items', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '内容创作' }).click();
    const items = ['爆款选题', '文案生成', '呈现形式', '拍摄计划'];
    for (const item of items) {
      await expect(page.getByRole('menuitem', { name: item })).toBeVisible();
    }
    await page.keyboard.press('Escape');
  });

  test('变现执行 dropdown has 2 items', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '变现执行' }).click();
    const items = ['直播策划', '私域成交'];
    for (const item of items) {
      await expect(page.getByRole('menuitem', { name: item })).toBeVisible();
    }
    await page.keyboard.press('Escape');
  });

  test('智能助手 dropdown has 5 items', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '智能助手' }).click();
    const items = ['IP诊断', '每日任务', 'AI视频', '深度学习', '进化仪表盘'];
    for (const item of items) {
      await expect(page.getByRole('menuitem', { name: item })).toBeVisible();
    }
    await page.keyboard.press('Escape');
  });

  test('更多 dropdown has 6 items', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '更多' }).click();
    const items = ['账号管理', '方法论', '使用说明', '我的IP方案', '我的选题库', '历史记录'];
    for (const item of items) {
      await expect(page.getByRole('menuitem', { name: item })).toBeVisible();
    }
    await page.keyboard.press('Escape');
  });

  test('dropdown item click navigates correctly (内容创作→爆款选题→/step/5)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '内容创作' }).click();
    await page.getByRole('menuitem', { name: '爆款选题' }).click();
    await expect(page).toHaveURL(/\/step\/5/);
  });

  test('total 22 sub-items across all 5 groups (5+4+2+5+6)', async ({ page }) => {
    const groups: Array<{ label: string; expected: number }> = [
      { label: '商业定位', expected: 5 },
      { label: '内容创作', expected: 4 },
      { label: '变现执行', expected: 2 },
      { label: '智能助手', expected: 5 },
      { label: '更多', expected: 6 },
    ];
    let total = 0;
    for (const { label, expected } of groups) {
      await page.goto('/');
      await page.getByRole('button', { name: label }).click();
      const items = page.getByRole('menuitem');
      const count = await items.count();
      expect(count).toBe(expected);
      total += count;
      await page.keyboard.press('Escape');
    }
    expect(total).toBe(22);
  });

  test('desktop header is visible (header element exists)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
  });

  // NOTE: LiquidShell.tsx 没有实现 mobile hamburger / MobileNavPanel。
  // 在 desktop viewport 下，导航按钮正常显示。
  // 如需 mobile nav 测试，需先在 LiquidShell.tsx 中实现 hamburger+panel。
  test('desktop nav buttons NOT hidden on desktop viewport (1360px)', async ({ page }) => {
    await page.setViewportSize({ width: 1360, height: 768 });
    await page.goto('/');
    await expect(page.getByRole('button', { name: '商业定位' })).toBeVisible();
  });
});
