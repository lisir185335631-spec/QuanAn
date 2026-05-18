# PRD-21 · aiipznt 视觉对齐基础设施 + Header 精修 + 共享 utility + Home/Guide/IpPlan 视觉精修

> **版本** · v0.1(2026-05-18 BJT · Opus 4.7 主对话写)
> **范围** · 跟 aiipznt 1:1 视觉对齐 · 4 件事 ·
> 1. 视觉 diff 基础设施(playwright visual snapshot + 5% threshold + CI gate)
> 2. Header 精修(h-16 + 双行 logo stack + backdrop-blur-2xl + chevron rotate)
> 3. Mobile nav 重写(Sheet drawer → lg:hidden border-t 下方下拉面板)
> 4. 共享 utility 全局补齐 + Home/Guide/IpPlan 视觉精修
> **基线** · PRD-16~20 已 ship · 结构对齐 85%+ · 但 pixel-level visual diff 从未真正跑 · /tmp/aiipznt-clone-research/screenshots/ 32 PNG baseline 闲置
> **目标** · 让 3 公开 page (/, /guide, /ip-plan) + Header desktop/mobile 跟 aiipznt 实测 pixel-diff < 5% · 后续 PRD-22~24 复用本 infra 推进剩余 page
> **预估** · 8 US · 1 foundation + 2 high + 4 medium + 1 收官 · 1.5-2 周 wall time · 11-15h daemon · 20-25 commits

---

## §0 引用清单 + 元数据 + 复刻定调

### §0.1 上游文档(8 份核心)

| # | 文档 | 用途 | 重点章节 |
|:-:|---|---|---|
| 1 | [aiipznt-deep-dom-dump.md](../aiipznt-deep-dom-dump.md) | **32 page DOM 实测 + spec 校准 + 红线 5 条** · 当冲突时以 dump 为准 | §1 跨 page 共享 / §2 32 page DOM / §3 spec 校准 / §6 红线 |
| 2 | [aiipznt-spec.md](../aiipznt-spec.md) | 9192 行复刻基线 | §5 全局 UI(Header)/ §6 首页 / §9.1 /guide / §9.2 /ip-plan / §12 dropdown / §13 设计系统 / §29 每 page metadata |
| 3 | [aiipznt-clone-plan.md](../aiipznt-clone-plan.md) | 高层视觉总览 | §1 32 状态矩阵 / §2 波次甘特 / §3 共享组件清单 / §5 PRD-16 切入点 / §8 SOP |
| 4 | [.agents/diff-analysis/aiipznt-2026-05-18.md](../.agents/diff-analysis/aiipznt-2026-05-18.md) | **内部差距诊断** · 详细差距清单 + PRD-21~24 拆分 | §1 名义 ship vs 实际差距根因 / §3 已知差距 / §4 PRD-21~24 拆分 |
| 5 | [ARCHITECTURE.md](../ARCHITECTURE.md) | 主应用架构 | §2 14 工具 / §3 9 step / §6 UI/UX / §8 设计系统 |
| 6 | [AGENTS.md](../AGENTS.md) | 18 LD + 17 R 红线 + §11 PRD 沉淀 | §3 18 LD / §11.6 PRD-4 / §11.7 PRD-14 / §11.8 PRD-15 frontend-completeness |
| 7 | [tasks/prd-16.md](prd-16.md) | PRD-16 设计系统切换 + Home + Header + guide + ip-plan(已 ship · 仅参考) | §3 11 US 范围 + §0.3 D1=A + D4=B 决策 |
| 8 | `~/.claude/playbooks/reject-examples.jsonl` | 49 条跨 PRD 反例库 | 注入 high/foundation US 的 anti_patterns |

### §0.2 元数据

| 项 | 值 |
|---|---|
| **branchName** | `ralph/prd-21-visual-alignment-foundation` |
| **Locked Decisions** | D-206 起延续(PRD-20 收尾在 D-205 · 总 8 D · D-206~D-213) |
| **风险分档** | foundation × 1(US-001 visual-diff infra)+ high × 2(US-002/003)+ medium × 4(US-004/005/006/007)+ 收官 × 1(US-008) |
| **anti_patterns 注入** | foundation + 2 high US 必须从 reject-examples.jsonl 检索 ≤3 条注入 · 49 条库 · 5 条命中关键词 |
| **依赖前置 PRD** | PRD-16(Home/Header 结构) + PRD-19(8 stub baseline) + PRD-20(LLM 接入) · 严格保留不动 |
| **下游 PRD** | PRD-22(5 inline 重构 + step pages) · PRD-23(3 stub 完整化 + 14 工具) · PRD-24(6 modules + 全 32 visual diff 收官) |
| **baseline 抓取来源** | `/tmp/aiipznt-clone-research/{dump,screenshots}` 32 HTML + 32 PNG fullPage 1440px(2026-05-16 BJT 抓取 · sally zhao 登录态 · 不进 git) |
| **Cookie 安全** | 抓 aiipznt 用的 cookies 仅本机 `/tmp/aiipznt-cookies.json`(chmod 600 · /tmp 天然不进 git)· 用完建议用户登出 aiipznt 让 session 失效 |
| **失败回滚** | `git branch backup/before-prd-21 main` 已建(本会话 22:23)· 任意 US 累计 3 reject 强制 retro + 拆 story |

### §0.3 复刻定调(D1=A + D4=B 严锁 · 含 D1A-text-content-drift 防漏)

| 维度 | 切 / 不切 |
|---|:-:|
| 整体页面布局(layout / 区块顺序 / 区块尺寸 / 容器宽度 / padding 方向) | ✅ **切 1:1 对齐 aiipznt** |
| spacing scale(gap-2 / gap-4 / mb-8 / py-20 等) | ✅ 切(参 dump §1.4 / §2 各 page) |
| 字体 family + weight(Orbitron 大标 / Rajdhani 副标 / Noto Sans SC 中文 / ui-sans-serif 正文) | ✅ 切(已 PRD-16 US-001 完成 · 本 PRD 不重做 · 复核即可) |
| motion(framer-motion / animate-ping / transition / hover effect) | ✅ 切(`animate-ping-primary` 用 D-211 命名锁) |
| SVG icons / lucide-react | ✅ 切(已 95% 一致) |
| 卡片 hover 效果 + dropdown 浮层结构 + glass-card 模糊 | ✅ 切 |
| **文字内容(title / desc / H1 / H2 / H3 / p / button 文字 / FAQ q / a / placeholder)** | ✅ **严格 1:1**(plan-check 2.6.20 D1A-text-content-drift 检查) |
| 颜色 token(primary / accent / background / border / shadow / chart × 5) | ❌ **D4=B 锁 · 保留当前 HSL 43° 金色 token 不变** |
| OKLCH 任何 ref / `var(--gold)` / `border-gold/X` 字面 | ❌ **替换为 `var(--primary)` / `border-primary/X`** |
| UX behavior(search filter 联动 / accordion 展开 / hover transition 时长 …) | 🟡 可自由发挥(D1=A 不锁) |

**D4=B 反例锁**(防 ralph 字面解读紫色 → Tailwind 真紫色 utility · PRD-16 US-003 实证)·

- ❌ 描述写 "金色 gradient" / "紫色 gradient" 都不行 · 必须写 "`var(--primary)` 主色 gradient" 或 "`bg-gradient-to-r from-primary to-primary/60`"
- ❌ 不允许引入 `from-violet-X` `from-amber-X` 等具体颜色 utility
- ✅ 留 token 渲染决定 · `var(--primary)` 当前 HSL 43° 自动出金色调

**D1A 长文本字面双锁**(防 ralph 漏看 AC-1 → 创意改写 · PRD-17 US-007 实证)·

- AC-1 锁完整字面(完整代码块)
- AC-N 重复索引时必须复述完整字符 · 不允许 "含 'X'" 或 "含 {placeholder}" 模糊描述

---

## §1 介绍/概述

PRD-16~20 4 个 PRD 已 ship 入 main(commit `e28aff6 Merge: PRD-10~19 累积代码入 main` + `d31902a PRD-20 真 LLM 接入 9/9 PASSED A 级`)· 但 e2e 测试只验功能(H1 文字命中 / button click 跳转 / 25 二级 nav 链接存在)· **pixel-level visual diff 从未真正跑**。

**证据** · `tests/e2e/prd16-home-flow.spec.ts` AC-6 ·
```typescript
// AC-6: Visual diff · layout comparison with /tmp/aiipznt-clone-research/screenshots/
// → 实际只有 const ourCapture = await page.screenshot({...}) · 没跟 baseline 对比
```

`/tmp/aiipznt-clone-research/screenshots/` 32 PNG baseline 一直闲置。`verify-prd-19.sh` 最后一项只验 TypeScript test count 不验视觉。这是 PRD-16~20 "名义 ship 但视觉差距很大" 的根本原因。

**PRD-21 解决 4 件事** ·

1. **建立视觉 diff 基础设施** · playwright visual snapshot 配置(`maxDiffPixelRatio: 0.05`)+ `apps/web/scripts/visual-diff.ts` helper(`expectVisualMatch(page, options)`)+ `tests/e2e/prd21-visual-baseline.spec.ts` 4 test fixture + `verify-prd-21.sh §1` CI gate
2. **Header 视觉精修** · 严格按 dump §1.1 实测 · `h-12 → h-16` / `backdrop-blur-sm → backdrop-blur-2xl` / 单行 "QuanQn" → 双行 stack 占位(用 QuanQn 字)· 4 dropdown ChevronDown 加 `transition-transform data-[state=open]:rotate-180`
3. **Mobile nav 重写** · 删除 Sheet drawer 实现 · 新建 `MobileNavPanel` 组件(`lg:hidden border-t bg-background/95 backdrop-blur-2xl max-h-[70vh] overflow-y-auto`)· 严格按 dump §1.5 实测(4 大类 Rajdhani 分组 + 25 二级项 + 用户区固定底部)
4. **共享 utility 全局补齐 + Home/Guide/IpPlan 视觉精修** ·
   - `data-grid-bg` 用到全 32 page `<main>` wrapper(扫源码替换)
   - `animate-ping-primary` 视觉精修(D-211 锁紫色变体)
   - `Toaster` sonner position=bottom-right(D-212 锁 4000ms duration)
   - `<FadeInWrapper>` framer-motion 入场 utility(D-213 命名锁)
   - Home / Guide / IpPlan 3 公开 page pixel-level 精修

完成后 · 3 公开 page + Header(desktop + mobile)跟 aiipznt 实测 pixel-diff < 5%(threshold 锁 D-206)· 后续 PRD-22~24 复用本 infra 渐次推进 step pages + 14 工具 + 6 modules 视觉对齐。

---

## §2 目标

- ✅ 建立 playwright visual snapshot CI · 阻断未来视觉漂移 · 任何 PR 触发自动 pixel-diff 检查
- ✅ Header desktop 视觉对齐 aiipznt(高度 64px / 双行 logo / `backdrop-blur-2xl` / chevron `transition-transform rotate-180`)
- ✅ Header mobile nav 形态对齐 aiipznt(下方下拉面板 · 4 大类 Rajdhani 分组 · 25 二级项 · 用户区固定底部)
- ✅ Home(/) 视觉对齐(HeroSection / IpProgressSection / FunctionMatrixSection / WorkflowSection / ReadyToStartSection)
- ✅ /guide 视觉对齐(USER GUIDE H1 + 5 步推荐流程 + 系统概览 3 H4 + 13 模块卡 + FAQ 5 + 顶部 search input)
- ✅ /ip-plan 视觉对齐(返回首页 + 副标 N/9 + 刷新 button + glass-card 进度条 + 9 步卡片网格)
- ✅ 共享 utility 全局补齐(data-grid-bg / animate-ping-primary / Toaster bottom-right / `<FadeInWrapper>`)
- ✅ 8 US 全部 audit approved(Opus 4 维度 + risk_level 分档)· verify-prd-21.sh 通过 · pixel-diff < 5% threshold · 准备 PRD-22

---

## §3 User Stories(8)

### US-001 ★ foundation · 视觉 diff 基础设施

**风险分档** · ★ **foundation**(下游 7 US + PRD-22~24 全部复用此 infra · 失败影响全 4 PRD)

**Story 大小** · medium(单次 ralph 迭代可完成 · 5 文件创建 · ~250 LOC 新增)

**描述** · 作为开发者 · 我需要建立 playwright visual snapshot 基础设施 + `apps/web/scripts/visual-diff.ts` helper + `verify-prd-21.sh §1` CI gate · 以便后续 US-002~007 + PRD-22~24 全部 page 都能自动跟 `/tmp/aiipznt-clone-research/screenshots/` 32 PNG baseline 做 pixel-level 对比 · 阻断未来视觉漂移。

**Acceptance Criteria** ·

- [ ] **AC-1** · `apps/web/playwright.config.ts` 加 visual snapshot 配置 · 完整代码片段 ·
  ```typescript
  // 在 defineConfig 内 · 加在 use 字段同级(top-level)
  // PRD-21 D-206 · maxDiffPixelRatio 5% threshold
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,    // D-206: 5% pixel-diff threshold
      threshold: 0.2,             // per-pixel color tolerance (anti-aliasing)
      animations: 'disabled',     // 截图前 freeze animations
      caret: 'hide',              // 隐藏光标
    },
  },
  ```

- [ ] **AC-2** · 新建 `apps/web/scripts/visual-diff.ts` helper · 完整函数签名 + 实现 ·
  ```typescript
  // apps/web/scripts/visual-diff.ts — 视觉对齐 helper for playwright
  // PRD-21 D-207 · baseline 路径锁 /tmp/aiipznt-clone-research/screenshots/
  // PRD-21 D-208 · expectVisualMatch API 锁(后续 PRD-22~24 共用)
  
  import { type Page, expect } from '@playwright/test';
  import * as path from 'path';
  
  /** PRD-21 D-207 · baseline 抓取目录(/tmp 不进 git · 第三方产物) */
  export const AIIPZNT_BASELINE_DIR = '/tmp/aiipznt-clone-research/screenshots';
  
  /** PRD-21 D-208 · 视觉 diff helper · 让任意 test 一行调用 */
  export interface ExpectVisualMatchOptions {
    /** baseline 文件名(不含 .png · e.g. '00-home' / '01-guide') */
    baseline: string;
    /** viewport(默认 1440x900 跟 baseline 抓取一致) */
    viewport?: { width: number; height: number };
    /** fullPage 截图(默认 true 跟 baseline 一致) */
    fullPage?: boolean;
    /** 自定义 maxDiffPixelRatio(默认 0.05 from D-206) */
    maxDiffPixelRatio?: number;
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
    } = options;
    await page.setViewportSize(viewport);
    const baselinePath = path.join(AIIPZNT_BASELINE_DIR, `${baseline}.png`);
    await expect(page).toHaveScreenshot([baselinePath], { maxDiffPixelRatio, fullPage });
  }
  ```

- [ ] **AC-3** · 新建 `tests/e2e/prd21-visual-baseline.spec.ts` · 4 test fixture 跑 4 page visual diff · 完整代码 ·
  ```typescript
  // tests/e2e/prd21-visual-baseline.spec.ts — PRD-21 US-001 AC-3
  // 4 baseline test · home / guide / ip-plan / header-desktop
  import { test } from '@playwright/test';
  import { expectVisualMatch } from '../../apps/web/scripts/visual-diff';
  
  test.describe('PRD-21 visual baseline · 4 page pixel-diff < 5%', () => {
    test.beforeEach(async ({ page }) => {
      // disable animations + transitions 避免抓取时干扰
      await page.addStyleTag({
        content: '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
      });
    });
  
    test('home page / matches 00-home.png baseline', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await expectVisualMatch(page, { baseline: '00-home' });
    });
  
    test('guide page /guide matches 01-guide.png baseline', async ({ page }) => {
      await page.goto('/guide');
      await page.waitForLoadState('networkidle');
      await expectVisualMatch(page, { baseline: '01-guide' });
    });
  
    test('ip-plan page /ip-plan matches 02-ip-plan.png baseline', async ({ page }) => {
      await page.goto('/ip-plan');
      await page.waitForLoadState('networkidle');
      await expectVisualMatch(page, { baseline: '02-ip-plan' });
    });
  
    test('header desktop matches 00-home.png header crop', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const header = page.locator('header[data-testid="app-header"]');
      await header.waitFor();
      // crop 抓 header only · viewport 1440x120 · fullPage false
      await expectVisualMatch(page, {
        baseline: '00-home-header',
        viewport: { width: 1440, height: 120 },
        fullPage: false,
      });
    });
  });
  ```

- [ ] **AC-4** · 新建 `scripts/verify-prd-21.sh` · 含 §1 visual diff CI gate 完整代码片段 ·
  ```bash
  #!/usr/bin/env bash
  # verify-prd-21.sh — PRD-21 视觉对齐 + Header + Home/Guide/IpPlan 精修 交付验证
  # 35+ checks across 10 sections · 任一失败 exit non-zero
  set -euo pipefail
  PASS=0
  FAIL=0
  ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  cd "$ROOT"
  
  GREEN='\033[0;32m'
  RED='\033[0;31m'
  RESET='\033[0m'
  
  ok()   { echo -e "  ${GREEN}✓${RESET} $1"; PASS=$((PASS+1)); }
  fail() { echo -e "  ${RED}✗${RESET} $1"; FAIL=$((FAIL+1)); }
  sep()  { echo; echo "─── $1 ───────────────────────────────────"; }
  
  # ─────────────────────────────────────────────────────────────
  sep "§1 视觉对齐 baseline 4 page pixel-diff < 5%"
  # ─────────────────────────────────────────────────────────────
  
  # 1.1 visual-diff.ts helper 存在
  [ -f "apps/web/scripts/visual-diff.ts" ] && ok "1.1 visual-diff.ts helper 存在" || fail "1.1 visual-diff.ts 缺失"
  
  # 1.2 helper 导出 expectVisualMatch
  HIT=$(grep -E "export async function expectVisualMatch" apps/web/scripts/visual-diff.ts 2>/dev/null | grep -c "." || true)
  [ "$HIT" -ge 1 ] && ok "1.2 expectVisualMatch 函数导出 (hits=$HIT)" || fail "1.2 expectVisualMatch 未导出"
  
  # 1.3 4 baseline test 存在
  [ -f "tests/e2e/prd21-visual-baseline.spec.ts" ] && ok "1.3 prd21-visual-baseline.spec.ts 存在" || fail "1.3 spec 缺失"
  
  # 1.4 4 test 用 expectVisualMatch
  HIT=$(grep -c "expectVisualMatch(page" tests/e2e/prd21-visual-baseline.spec.ts 2>/dev/null || echo 0)
  [ "$HIT" -ge 4 ] && ok "1.4 4 test 全部用 expectVisualMatch ($HIT/4)" || fail "1.4 expectVisualMatch 调用 < 4 ($HIT)"
  
  # 1.5 maxDiffPixelRatio 5% 锁 D-206
  HIT=$(grep -E "maxDiffPixelRatio.*0\.05" apps/web/playwright.config.ts 2>/dev/null | grep -c "." || true)
  [ "$HIT" -ge 1 ] && ok "1.5 maxDiffPixelRatio 0.05 锁 D-206" || fail "1.5 maxDiffPixelRatio 0.05 未配置"
  
  # 1.6 baseline 目录存在
  [ -d "/tmp/aiipznt-clone-research/screenshots" ] && ok "1.6 baseline 目录存在" || fail "1.6 baseline 目录缺失"
  
  # 1.7 baseline PNG 数 ≥ 32
  COUNT=$(ls /tmp/aiipznt-clone-research/screenshots/*.png 2>/dev/null | wc -l | tr -d ' ' || echo 0)
  [ "$COUNT" -ge 32 ] && ok "1.7 baseline PNG ≥ 32 ($COUNT)" || fail "1.7 baseline 不全 ($COUNT/32)"
  
  # 1.8 playwright 配置 animations:disabled (避免动画干扰截图)
  HIT=$(grep -E "animations.*disabled" apps/web/playwright.config.ts 2>/dev/null | grep -c "." || true)
  [ "$HIT" -ge 1 ] && ok "1.8 animations:disabled 配置" || fail "1.8 animations:disabled 未配置"
  ```

- [ ] **AC-5** · `apps/web/package.json` scripts 加 `test:visual` 命令 ·
  ```json
  {
    "scripts": {
      "test:visual": "playwright test tests/e2e/prd21-visual-baseline.spec.ts --update-snapshots",
      "test:visual:check": "playwright test tests/e2e/prd21-visual-baseline.spec.ts"
    }
  }
  ```

- [ ] **AC-6** · TypeScript 编译通过 · `cd apps/web && pnpm typecheck` 0 error
- [ ] **AC-7** · 现有 e2e test 不破坏 · `pnpm test:e2e` 全绿(可能 first run visual diff 失败 expected · 需 `--update-snapshots` flag 重 baseline)
- [ ] **AC-8** · `scripts/verify-prd-21.sh` 可执行 · `chmod +x scripts/verify-prd-21.sh` · `bash scripts/verify-prd-21.sh` §1 部分全 pass
- [ ] **AC-9** · 不破坏 PRD-15/16/17/18/19/20 的 e2e fixture · `tests/e2e/*` 中已有的 prd15-* / prd16-* / etc 仍按原样跑

**Locked Decisions for US-001** ·
- **D-206** · `maxDiffPixelRatio: 0.05`(5% threshold)· 理由 · aiipznt baseline 是 2026-05-16 抓的 · 当前已 2 天 · 字号 / 间距 / antialias 微差预期 · 5% 给字体渲染容差 + 防 flaky · 太严会 false-positive · 太宽失去意义
- **D-207** · baseline 路径 = `/tmp/aiipznt-clone-research/screenshots/`(不进 git · 第三方产物 · cookie 安全已锁)
- **D-208** · `expectVisualMatch(page, ExpectVisualMatchOptions)` helper API 锁 · 后续 PRD-22~24 共用 · 参数名 / 类型 / 默认值不允许改

**Anti-patterns** · ralph skill 转 prd-21.json 时检索 reject-examples.jsonl 关键词 `visual-diff` / `snapshot` / `playwright` / `threshold` / `CI` 注入(预期注入 1-3 条 · 见 §11 anti_patterns 详细)。

---

### US-002 high · Header 视觉精修(h-16 + 双行 logo + backdrop-blur-2xl + chevron rotate)

**风险分档** · **high**(Header 是全 32 page 共享 · 影响面大 · 视觉漂移直接破坏首屏体验)

**Story 大小** · medium(单文件改 1 个 · `apps/web/src/components/Header.tsx` · ~50 LOC diff)

**描述** · 作为用户 · 我想要 Header 视觉跟 aiipznt 1:1 对齐 · 这样首屏体验跟参考站完全一致 · 包括高度(64px 不是 48px)/ 背景 backdrop-blur 强度 / Logo 形态(双行 stack 而非单行)/ 4 dropdown ChevronDown 展开旋转动画。

**Acceptance Criteria** ·

- [ ] **AC-1** · `apps/web/src/components/Header.tsx` 第 219 行 container 高度从 `h-12` 改为 `h-16` · 严格 1:1 对齐 aiipznt 实测 64px ·
  ```typescript
  // 改前 ·
  <div className="container flex h-12 items-center gap-2">
  // 改后(D-209 锁) ·
  <div className="container flex h-16 items-center gap-2">
  ```

- [ ] **AC-2** · `apps/web/src/components/Header.tsx` 第 216 行 backdrop-blur 从 `backdrop-blur-sm` 改为 `backdrop-blur-2xl` ·
  ```typescript
  // 改前 ·
  className="sticky top-0 z-40 w-full border-b border-border bg-surface-container-low/90 backdrop-blur-sm"
  // 改后(D-210 锁) ·
  className="sticky top-0 z-40 w-full border-b border-border bg-surface-container-low/90 backdrop-blur-2xl"
  ```

- [ ] **AC-3** · `apps/web/src/components/Header.tsx` 第 220-224 行 Logo 从单行 "QuanQn" 改为双行 stack 占位(用 QuanQn 字 · 不抄 aiipznt SVG · 严格 D-145 占位规则) · 完整改后代码 ·
  ```typescript
  // 改前 ·
  <div className="flex items-center gap-2 mr-3">
    <span className="text-body-md font-display font-semibold text-primary tracking-tight select-none">
      QuanQn
    </span>
  </div>
  // 改后(D-211 双行 stack 锁) ·
  <Link to="/" className="flex items-center gap-2 mr-3 select-none" aria-label="QuanQn home">
    {/* 金色方块 icon 占位(用 div + bg-primary 不抄 aiipznt SVG) */}
    <div className="h-8 w-8 rounded bg-primary flex items-center justify-center shrink-0">
      <span className="text-on-primary font-display font-black text-xs">Q</span>
    </div>
    {/* 双行 stack · Orbitron 金色 · 严格按 aiipznt 双行 layout */}
    <div className="flex flex-col leading-none">
      <span className="font-display font-bold text-primary text-sm tracking-tight">QUAN</span>
      <span className="font-display font-bold text-primary text-sm tracking-tight">QN</span>
    </div>
  </Link>
  ```

- [ ] **AC-4** · `apps/web/src/components/Header.tsx` HeaderNav 4 dropdown ChevronDown 加 `transition-transform data-[state=open]:rotate-180` · 严格按 dump §1.2 实测旋转动画 · 完整改后代码 ·
  ```typescript
  // HeaderNav 内 DropdownMenuTrigger asChild 内的 Button ·
  // 改前 ·
  <ChevronDown className="h-3 w-3 text-muted-foreground" />
  // 改后(D-212 chevron 旋转锁) ·
  <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
  ```
  注 · `data-[state=open]` 是 Radix DropdownMenu 自动加的 attribute · DropdownMenuTrigger 打开时 state=open · Tailwind data-attribute selector 触发 rotate-180。

- [ ] **AC-5** · `apps/web/src/components/Header.tsx` 严格保留 25 二级 nav 不动 · `HEADER_NAV` constant 引用从 `@/lib/constants/header-nav` import 不变 · 不允许改动 `lib/constants/header-nav.ts` 内容(4 一级 × 25 二级 严锁)

- [ ] **AC-6** · TypeScript 编译通过 · `cd apps/web && pnpm typecheck` 0 error
- [ ] **AC-7** · 现有 e2e test 全部仍 pass · `pnpm test:e2e tests/e2e/prd16-header-dropdown-flow.spec.ts` 4 dropdown test 全绿
- [ ] **AC-8** · 视觉对齐验证 · `pnpm test:visual:check` 中 `header desktop matches 00-home.png header crop` test pass · pixel-diff < 5%
- [ ] **AC-9** · 浏览器手动验证 · 用 agent-browser 打开 `http://localhost:5173/` · 确认 ·
  - Header 高度 64px(用 devtools 量)
  - Logo 显示金色方块 + QUAN/QN 双行
  - 点击 4 个 dropdown trigger(创作 / 策划 / 智能 / 更多)· ChevronDown 旋转 180°
  - dropdown 弹层背景 `backdrop-blur-2xl` 显著模糊
- [ ] **AC-10** · 无控制台错误 · 打开 devtools console 无红色 error / warning

**Locked Decisions for US-002** ·
- **D-209** · Header container 高度 `h-16`(64px)· 锁 dump §1.1 实测
- **D-210** · sticky element `backdrop-blur-2xl`(全局所有 sticky 元素 · 不只 Header · 后续 dropdown 弹层也用)
- **D-211** · Logo 双行 stack 占位规则 = 金色方块 div(8×8 rounded · bg-primary)+ 双行 `flex flex-col leading-none` text · 字 QUAN / QN(QuanQn 大写 split · 不抄 aiipznt AIP/AGENT)
- **D-212** · 4 dropdown ChevronDown 加 `transition-transform duration-200 data-[state=open]:rotate-180`

**Anti-patterns** · 检索关键词 `Header` / `sticky` / `backdrop` / `shadcn` / `dropdown` 注入(预期 1-2 条)。

---

### US-003 high · Mobile nav 重写(Sheet drawer → lg:hidden header 下方下拉面板)

**风险分档** · **high**(Mobile 体验影响 < 1024px 用户 · 形态切换大改 · 涉及组件删除 + 新建)

**Story 大小** · medium(改 Header.tsx + 新建 MobileNavPanel.tsx · ~150 LOC)

**描述** · 作为 mobile 用户(< 1024px 视口)· 我想要点击 hamburger menu 时看到 header 下方下拉面板 · 而非从左侧滑出的 drawer · 严格按 dump §1.5 实测 · 4 大类 Rajdhani 分组标题 + 25 二级项 + 用户区固定底部。

**Acceptance Criteria** ·

- [ ] **AC-1** · 新建 `apps/web/src/components/header/MobileNavPanel.tsx` · 完整代码 ·
  ```typescript
  // apps/web/src/components/header/MobileNavPanel.tsx — PRD-21 US-003
  // dump §1.5 实测 · lg:hidden border-t bg-background/95 backdrop-blur-2xl max-h-[70vh] overflow-y-auto
  // 4 大类 Rajdhani 分组 · 25 二级项 · 用户区固定底部
  
  import { LogOut, LogIn, Plus } from 'lucide-react';
  import { Link } from 'react-router-dom';
  
  import { Separator } from '@/components/ui/separator';
  import { useActiveAccount } from '@/hooks/useActiveAccount';
  import { useAuth } from '@/hooks/useAuth';
  import { HEADER_NAV } from '@/lib/constants/header-nav';
  import { trpc } from '@/lib/trpc';
  
  interface MobileNavPanelProps {
    open: boolean;
    onClose: () => void;
  }
  
  export function MobileNavPanel({ open, onClose }: MobileNavPanelProps) {
    const { user, login, logout } = useAuth();
    const { account: activeAccount, switchTo } = useActiveAccount();
    const { data: accounts = [] } = trpc.ipAccounts.list.useQuery(undefined, {
      staleTime: 30_000,
    });
  
    if (!open) return null;
  
    return (
      <div
        className="lg:hidden border-t border-primary/10 bg-background/95 backdrop-blur-2xl max-h-[70vh] overflow-y-auto"
        data-testid="header-mobile-panel"
        role="navigation"
        aria-label="移动端导航"
      >
        <div className="container py-4">
          {/* IP 账号区(顶部) */}
          {accounts.length > 0 && (
            <>
              <p className="font-label uppercase tracking-wider text-label-md text-muted-foreground mb-2">
                IP 账号
              </p>
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  className="w-full flex items-center gap-2.5 py-2 text-body-sm text-on-surface"
                  onClick={() => {
                    switchTo(acc.id);
                    onClose();
                  }}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${acc.id === activeAccount?.id ? 'bg-primary' : 'bg-border'}`}
                  />
                  {acc.name}
                  <span className="ml-auto text-label-md text-muted-foreground">{acc.platform}</span>
                </button>
              ))}
              <Link
                to="/accounts"
                onClick={onClose}
                className="w-full flex items-center gap-2.5 py-2 text-body-sm text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                新建账号
              </Link>
              <Separator className="my-3" />
            </>
          )}
  
          {/* 4 大类 Rajdhani 分组 + 25 二级项 */}
          {HEADER_NAV.map((group, gIdx) => (
            <div key={group.label} className={gIdx > 0 ? 'mt-3' : ''}>
              <p className="font-label uppercase tracking-wider text-label-md text-muted-foreground mb-2">
                {group.label}
              </p>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className="w-full flex items-center py-2 text-body-sm text-on-surface hover:text-primary"
                >
                  {item.label}
                </Link>
              ))}
              {gIdx < HEADER_NAV.length - 1 && <Separator className="my-3" />}
            </div>
          ))}
  
          {/* 用户区固定底部(sally zhao chip + 退出) */}
          {user && (
            <>
              <Separator className="my-3" />
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-body-sm font-medium text-on-surface">{user.name}</span>
                  <span className="text-label-md text-muted-foreground">{user.email}</span>
                </div>
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-body-sm text-destructive-foreground hover:bg-destructive/10"
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  aria-label="退出登录"
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </button>
              </div>
            </>
          )}
          {!user && (
            <>
              <Separator className="my-3" />
              <button
                className="flex items-center gap-2 py-2 text-body-sm text-primary"
                onClick={() => {
                  void login();
                  onClose();
                }}
              >
                <LogIn className="h-4 w-4" />
                登录
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
  ```

- [ ] **AC-2** · `apps/web/src/components/Header.tsx` 删除原 MobileNav (Sheet drawer 实现) · 行 113-209 完整删除

- [ ] **AC-3** · `apps/web/src/components/Header.tsx` 重写 Header export · 加 `useState` 控制 panel open + hamburger toggle · 完整改后代码 ·
  ```typescript
  // 改前 · Header.tsx end ·
  export function Header() {
    return (
      <header className="...">
        <div className="container flex h-12 items-center gap-2">
          <div className="flex items-center gap-2 mr-3">{/* logo */}</div>
          <div className="flex-1 flex justify-center"><HeaderNav /></div>
          <div className="ml-auto flex items-center gap-1">
            <div className="hidden sm:block"><HeaderRight /></div>
            <MobileNav />
          </div>
        </div>
      </header>
    );
  }
  
  // 改后 · Header.tsx end ·
  import { useState } from 'react';
  import { Menu, X } from 'lucide-react';
  import { MobileNavPanel } from '@/components/header/MobileNavPanel';
  
  export function Header() {
    const [mobileOpen, setMobileOpen] = useState(false);
    
    return (
      <header
        className="sticky top-0 z-40 w-full border-b border-border bg-surface-container-low/90 backdrop-blur-2xl"
        data-testid="app-header"
      >
        <div className="container flex h-16 items-center gap-2">
          {/* 双行 logo · US-002 AC-3 */}
          <Link to="/" className="flex items-center gap-2 mr-3 select-none" aria-label="QuanQn home">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center shrink-0">
              <span className="text-on-primary font-display font-black text-xs">Q</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-primary text-sm tracking-tight">QUAN</span>
              <span className="font-display font-bold text-primary text-sm tracking-tight">QN</span>
            </div>
          </Link>
          
          {/* desktop nav · US-002 AC-4 chevron rotate */}
          <div className="flex-1 flex justify-center">
            <HeaderNav />
          </div>
          
          {/* 右侧 · desktop HeaderRight + mobile hamburger */}
          <div className="ml-auto flex items-center gap-1">
            <div className="hidden lg:block"><HeaderRight /></div>
            
            {/* mobile hamburger toggle · D-213 */}
            <button
              className="h-8 w-8 lg:hidden flex items-center justify-center rounded-md hover:bg-accent"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
              data-testid="header-hamburger"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {/* mobile panel · header 下方下拉(不是从左侧 Sheet drawer) */}
        <MobileNavPanel open={mobileOpen} onClose={() => setMobileOpen(false)} />
      </header>
    );
  }
  ```

- [ ] **AC-4** · 删除 `Sheet` / `SheetContent` / `SheetHeader` / `SheetTitle` / `SheetTrigger` import 从 `Header.tsx`(不再用)· import 列表清理

- [ ] **AC-5** · TypeScript 编译通过 · `cd apps/web && pnpm typecheck` 0 error

- [ ] **AC-6** · 新建 `tests/e2e/prd21-mobile-nav.spec.ts` · mobile 视口下 4 test ·
  ```typescript
  import { test, expect } from '@playwright/test';
  
  test.describe('PRD-21 US-003 mobile nav · lg:hidden header 下方下拉面板', () => {
    test.use({ viewport: { width: 375, height: 667 } });
    
    test('hamburger menu visible on mobile', async ({ page }) => {
      await page.goto('/');
      const hamburger = page.locator('[data-testid="header-hamburger"]');
      await expect(hamburger).toBeVisible();
    });
    
    test('click hamburger opens MobileNavPanel below header', async ({ page }) => {
      await page.goto('/');
      await page.locator('[data-testid="header-hamburger"]').click();
      const panel = page.locator('[data-testid="header-mobile-panel"]');
      await expect(panel).toBeVisible();
    });
    
    test('panel shows 4 group labels (创作 / 策划 / 智能 / 更多)', async ({ page }) => {
      await page.goto('/');
      await page.locator('[data-testid="header-hamburger"]').click();
      for (const label of ['创作', '策划', '智能', '更多']) {
        await expect(page.getByText(label, { exact: true })).toBeVisible();
      }
    });
    
    test('panel shows all 25 nav items', async ({ page }) => {
      await page.goto('/');
      await page.locator('[data-testid="header-hamburger"]').click();
      const panel = page.locator('[data-testid="header-mobile-panel"]');
      // 25 二级项 (5 + 8 + 6 + 6)
      const items = panel.locator('a[href^="/"]').filter({ hasNotText: '账号' }); // exclude /accounts management link if needed
      expect(await items.count()).toBeGreaterThanOrEqual(25);
    });
  });
  ```

- [ ] **AC-7** · 旧的 `tests/e2e/header.spec.ts` 中如果有 Sheet drawer 相关 assertion · 必须更新为 `header-mobile-panel` data-testid 引用

- [ ] **AC-8** · 浏览器手动验证 · 用 agent-browser 设置 viewport 375x667 · 打开 `http://localhost:5173/` · 确认 ·
  - hamburger menu icon 可见
  - 点击 hamburger · 面板从 header 下方展开(不是从左侧滑入)
  - 面板背景 `backdrop-blur-2xl` 显著模糊
  - 4 分组标题(创作/策划/智能/更多)用 Rajdhani 字体 uppercase
  - 25 二级链接全显示
  - 用户区固定底部 + 退出按钮

- [ ] **AC-9** · 无控制台错误

**Locked Decisions for US-003** ·
- **D-213** · Mobile nav 形态 = `lg:hidden border-t bg-background/95 backdrop-blur-2xl max-h-[70vh] overflow-y-auto` header 下方下拉面板 · 不用 shadcn Sheet drawer

**Anti-patterns** · 检索 `mobile-nav` / `Sheet` / `drawer` / `responsive` 注入(预期 1-2 条)。

---

### US-004 medium · 共享 utility 全局补齐(data-grid-bg + animate-ping-primary + Toaster + FadeInWrapper)

**风险分档** · **medium**(单纯加 utility · 不破坏现有 page)

**Story 大小** · medium(改 globals.css + main.tsx + tailwind.config + 32 page <main> + 新建 FadeInWrapper · ~80 LOC)

**描述** · 作为开发者 · 我需要把 4 个共享 utility 全局补齐 · 以便后续 US-005~007 + PRD-22~24 page 直接套用 ·
1. `data-grid-bg` background utility 用到全 32 page `<main>` wrapper(目前只 Home.tsx 用了)
2. `animate-ping-primary` 视觉精修(确保 `bg-primary` opacity-75 跟 dump §1.6 一致)
3. `Toaster` sonner position 改 bottom-right(目前是 top-center 不符 aiipznt)· duration 4000ms
4. `<FadeInWrapper>` framer-motion 入场 wrapper utility(后续 FUNCTION MATRIX 卡 / Step 卡 / Dropdown 浮层用)

**Acceptance Criteria** ·

- [ ] **AC-1** · `apps/web/src/styles/globals.css` 加 `data-grid-bg` utility(若已有则复核)·
  ```css
  /* PRD-21 US-004 AC-1 · data-grid-bg 全局背景纹理(D-214) */
  .data-grid-bg {
    background-image:
      linear-gradient(rgba(var(--primary-rgb, 234, 188, 74), 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(var(--primary-rgb, 234, 188, 74), 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    background-position: 0 0, 0 0;
  }
  
  /* PRD-21 US-004 AC-2 · animate-ping-primary 锁紫色变体(实际 HSL 43° 金色 · D4=B) */
  @keyframes ping-primary {
    0% { transform: scale(1); opacity: 0.75; }
    75%, 100% { transform: scale(2); opacity: 0; }
  }
  .animate-ping-primary {
    animation: ping-primary 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
  ```

- [ ] **AC-2** · `apps/web/src/main.tsx` 中 Toaster 配置改 position=bottom-right + duration=4000ms · 完整改后代码 ·
  ```typescript
  // 改前 · main.tsx 中 ·
  <Toaster position="top-center" richColors />
  // 改后(D-215) ·
  <Toaster position="bottom-right" duration={4000} richColors />
  ```
  注 · 当前 main.tsx 第 12-18 行 import + 第 32 行使用(实际可能在 App.tsx · 看 src/App.tsx) · 找到唯一一处 Toaster 实例修改。

- [ ] **AC-3** · 新建 `apps/web/src/components/FadeInWrapper.tsx` · framer-motion 入场 wrapper utility · 完整代码 ·
  ```typescript
  // apps/web/src/components/FadeInWrapper.tsx — PRD-21 US-004 AC-3
  // framer-motion 入场 wrapper · D-216 锁 API
  // 用法 · <FadeInWrapper delay={0.1}><Card /></FadeInWrapper>
  
  import { motion, type MotionProps } from 'framer-motion';
  import { type PropsWithChildren } from 'react';
  
  export interface FadeInWrapperProps extends PropsWithChildren {
    /** 延迟(秒)· 用于错落 stagger 入场 */
    delay?: number;
    /** 持续时长(秒)· 默认 0.4 */
    duration?: number;
    /** 入场方向 · default 'up' */
    from?: 'up' | 'down' | 'left' | 'right' | 'none';
    /** 自定义 className 给 motion.div */
    className?: string;
  }
  
  const directionMap: Record<NonNullable<FadeInWrapperProps['from']>, MotionProps['initial']> = {
    up: { opacity: 0, y: 20 },
    down: { opacity: 0, y: -20 },
    left: { opacity: 0, x: 20 },
    right: { opacity: 0, x: -20 },
    none: { opacity: 0 },
  };
  
  export function FadeInWrapper({
    delay = 0,
    duration = 0.4,
    from = 'up',
    className,
    children,
  }: FadeInWrapperProps) {
    return (
      <motion.div
        initial={directionMap[from]}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay, duration, ease: 'easeOut' }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }
  ```

- [ ] **AC-4** · 验证 framer-motion 已在 `apps/web/package.json` 依赖 · 如果没有 · 加 ·
  ```bash
  cd apps/web && pnpm add framer-motion
  ```

- [ ] **AC-5** · 批量给全 32 page `<main>` wrapper 加 `data-grid-bg` class · 扫源码 grep `<main` 替换 · 涉及文件清单 ·
  ```
  apps/web/src/pages/Home.tsx (已有 ✓)
  apps/web/src/pages/Guide.tsx (US-006 重写时一起改)
  apps/web/src/pages/IpPlan.tsx (US-007 重写时一起改)
  apps/web/src/pages/Login.tsx (待加)
  apps/web/src/pages/Settings.tsx (待加)
  apps/web/src/pages/NotFound.tsx (待加)
  apps/web/src/pages/step/Step*.tsx (11 文件)
  apps/web/src/pages/tools/*.tsx (15 文件)
  apps/web/src/pages/modules/*.tsx (6 文件)
  apps/web/src/layouts/RootLayout.tsx 或 StepLayout.tsx(若 wrapper 在 layout 而不是 page · 改 1 处覆盖全 step)
  ```
  
  本 AC 只改 `RootLayout.tsx` + `StepLayout.tsx` 2 个共享 wrapper(确保所有 page 通过 layout 继承)· 若个 page 已有 `<main>` 自己渲染则 keep · 不破坏 PRD-15/16/17/18/19 沉淀。

- [ ] **AC-6** · TypeScript 编译通过 · 0 error
- [ ] **AC-7** · 现有 e2e test 不破坏 · 全绿
- [ ] **AC-8** · visual diff · `prd21-visual-baseline.spec.ts` 全 4 test 仍通过(home / guide / ip-plan / header)· pixel-diff < 5%
- [ ] **AC-9** · 浏览器手动验证 · 打开 `http://localhost:5173/` · 确认 ·
  - `data-grid-bg` 背景纹理可见(细线网格 · 不抢眼)
  - 任一 toast 弹出(可触发登录失败等)在 bottom-right
  - `animate-ping-primary` 跳动小圆点在 UserChip(已 Header.tsx 用了)
  - 控制台 0 error

**Locked Decisions for US-004** ·
- **D-214** · `data-grid-bg` utility 全 32 page <main> wrapper 用(优先通过 `RootLayout.tsx` / `StepLayout.tsx` 共享 wrapper 加)
- **D-215** · Toaster sonner `position="bottom-right" duration={4000}`(全局唯一 instance · main.tsx 或 App.tsx)
- **D-216** · `<FadeInWrapper delay duration from className>` API 锁(后续 US + PRD-22~24 不允许改 API)

---

### US-005 medium · Home 视觉精修(Hero / IpProgress / FunctionMatrix / Workflow / ReadyToStart 5 区精修)

**风险分档** · **medium**(单 page 改 · 不影响其他 page)

**Story 大小** · medium(改 `apps/web/src/pages/Home.tsx` + 可能新建 components/home/ 子组件 · ~150 LOC diff)

**描述** · 作为用户 · 访问 `/` 首页时 · 我想看到跟 aiipznt 首页 pixel-level 1:1 对齐的视觉 · 包括 HeroSection 字号精度 / IpProgressSection 9 step 横排卡密度 / FunctionMatrixSection 卡片 hover 过渡 + framer-motion 入场 / WorkflowSection 7 step 横向连线视觉 / ReadyToStartSection CTA。

**Acceptance Criteria** ·

- [ ] **AC-1** · `apps/web/src/pages/Home.tsx` Hero `<h1>` 字号 + 描边精度复核 · 当前 `text-7xl md:text-8xl` 字号是 5rem→8rem · 按 aiipznt baseline `00-home.png` 实测约 8rem(128px)· 改后代码 ·
  ```typescript
  // 改前(line 11-16) ·
  <h1
    className="font-display text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-primary via-primary to-primary/60 mb-6 tracking-tight"
    style={{ WebkitTextStroke: '1px var(--primary)' }}
  >
    AI+短视频+IP
  </h1>
  // 改后(D-217 锁) · text-8xl md:text-9xl + mb-8 ·
  <h1
    className="font-display text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-primary via-primary to-primary/60 mb-8 tracking-tight"
    style={{ WebkitTextStroke: '1px var(--primary)' }}
  >
    AI+短视频+IP
  </h1>
  ```

- [ ] **AC-2** · `apps/web/src/pages/Home.tsx` HeroSection 副标 3 行严格字面锁(D1=A 文字内容 1:1 · 不允许改) · 完整字面 ·
  ```typescript
  <p className="font-cn text-lg text-muted-foreground mb-2">OPC全案落地，从流量到成交</p>
  <p className="font-cn text-lg text-muted-foreground mb-2">AI+短视频+IP</p>
  <p className="font-cn text-lg text-muted-foreground mb-2">全链路变现</p>
  
  <p className="font-cn italic text-sm text-muted-foreground/70 mb-8">
    "重新构造一个人是怎样不变形的"
  </p>
  ```
  注 · 这 4 行已存在 · AC 只验证保留不改 · 不允许 ralph 创意改写。

- [ ] **AC-3** · Hero 2 CTA button 严格字面锁(D1=A) · `启动智能分析` / `使用说明`(都已存在 · 验证保留) ·

- [ ] **AC-4** · `IpProgressSection` 9 step 横排卡(StepProgress 组件)视觉密度调整 · 卡片之间 gap-3 → gap-2 + 卡片 height 自适应 · 跟 aiipznt baseline 一致 · 改后代码 ·
  ```typescript
  // 改 ·apps/web/src/components/StepProgress.tsx 的卡片网格
  // 改前(grep StepProgress.tsx 的 grid 部分) · grid-cols-9 gap-3
  // 改后(D-218) · grid grid-cols-9 gap-2
  ```

- [ ] **AC-5** · `FunctionMatrixSection` 卡片 hover 过渡时长统一 200ms + framer-motion 入场 stagger · 改后代码 ·
  ```typescript
  // 改前(Home.tsx line 106-114) ·
  {group.cards.map((card) => (
    <Link to={card.href} key={card.href}>
      <div className="glass-card rounded-xl p-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer h-full">
        <div className="text-3xl mb-3">{card.icon}</div>
        <div className="font-display text-base font-bold text-foreground mb-1">{card.title}</div>
        <div className="font-cn text-xs text-muted-foreground">{card.desc}</div>
      </div>
    </Link>
  ))}
  // 改后(D-219 框架 motion + 200ms transition 锁) · 用 FadeInWrapper stagger ·
  {group.cards.map((card, cIdx) => (
    <FadeInWrapper key={card.href} delay={0.05 * cIdx} from="up">
      <Link to={card.href}>
        <div className="glass-card rounded-xl p-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer h-full">
          <div className="text-3xl mb-3">{card.icon}</div>
          <div className="font-display text-base font-bold text-foreground mb-1">{card.title}</div>
          <div className="font-cn text-xs text-muted-foreground">{card.desc}</div>
        </div>
      </Link>
    </FadeInWrapper>
  ))}
  ```
  Footer 卡(使用说明)同样套 FadeInWrapper · `delay={0.3}` 错落入场。

- [ ] **AC-6** · `WorkflowSection` 7 step 横向连线视觉精修 · 当前用 `<div className="w-full h-px bg-primary/20" />`(line 154) · 严格保留 · 但 7 step 渲染时 step.num 加 framer-motion stagger · `<FadeInWrapper delay={0.1 * i}>`

- [ ] **AC-7** · `ReadyToStartSection` 视觉保留 + CTA button 字面锁 `立即启动 →`(已存在) · 不允许创意改写

- [ ] **AC-8** · TypeScript 编译通过 · 0 error
- [ ] **AC-9** · 现有 e2e test `tests/e2e/prd16-home-flow.spec.ts` 全 7 button 跳转 test 仍 pass
- [ ] **AC-10** · visual diff · `prd21-visual-baseline.spec.ts` 中 `home page / matches 00-home.png baseline` test pass · pixel-diff < 5%
- [ ] **AC-11** · 浏览器手动验证 · 打开 `http://localhost:5173/` 实地确认 ·
  - H1 "AI+短视频+IP" 字号显著放大(8rem→9rem)
  - FUNCTION MATRIX 15 卡 stagger 错落入场(framer-motion)
  - 卡片 hover 过渡 200ms 顺滑
  - 9 step 进度卡密度紧凑(gap-2)
  - 滚动到 WORKFLOW 时 7 step stagger 入场

**Locked Decisions for US-005** ·
- **D-217** · Home Hero H1 字号 `text-8xl md:text-9xl`(8rem→9rem)+ mb-8 锁
- **D-218** · StepProgress 9 step 横排卡 `gap-2`(紧凑密度)
- **D-219** · FUNCTION MATRIX 卡 hover 过渡 `duration-200` + framer-motion stagger `delay 0.05*idx`

---

### US-006 medium · /guide 视觉精修(USER GUIDE + 13 模块卡 + FAQ 5 + search input)

**风险分档** · **medium**(单 page 改)

**Story 大小** · medium(改 `apps/web/src/pages/Guide.tsx` · ~250 LOC 新增)

**描述** · 作为用户 · 访问 `/guide` 时 · 我想看到 USER GUIDE 完整 page · 包括 H1 + 副标 + 5 步推荐流程横排 + 系统概览 3 H4 + 13 模块详解卡 + FAQ 5 问 5 答 + 顶部 search input · 严格按 aiipznt baseline `01-guide.png` + spec §9.1。

**Acceptance Criteria** ·

- [ ] **AC-1** · `apps/web/src/pages/Guide.tsx` H1 字面锁 D1=A · `USER GUIDE`(Orbitron 大字)+ 副标 ·
  ```typescript
  <h1 className="font-display text-5xl md:text-6xl font-black text-primary tracking-widest text-center mb-3">
    USER GUIDE
  </h1>
  <p className="font-cn text-lg text-muted-foreground text-center mb-12">
    产品使用说明 · 功能详解 · 最佳实践
  </p>
  ```

- [ ] **AC-2** · 顶部 search input · 完整代码 ·
  ```typescript
  // 在 H1 + 副标后 · 完整代码 ·
  <div className="max-w-md mx-auto mb-12">
    <Input
      type="search"
      placeholder="搜索功能说明..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full"
    />
  </div>
  ```
  其中 `useState<string>('')` 控制 searchQuery · search input 用项目已有 `@/components/ui/input` 组件。

- [ ] **AC-3** · 推荐使用流程 5 step 横排 · 字面锁 D1=A · 严格按 aiipznt spec §9.1 ·
  ```typescript
  const RECOMMENDED_FLOW = [
    { num: '01', title: '深度学习', desc: '上传文档让 AI 学习你的行业知识' },
    { num: '02', title: '设计变现', desc: '定制变现路径和收入结构' },
    { num: '03', title: '创作内容', desc: '生成爆款文案和选题' },
    { num: '04', title: '制作视频', desc: '一键生成分镜表和拍摄计划' },
    { num: '05', title: '私域成交', desc: '完整成交话术和流程设计' },
  ] as const;
  
  // 渲染 ·
  <section className="mb-16">
    <h2 className="font-display text-2xl font-bold text-foreground mb-6 text-center">推荐使用流程</h2>
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {RECOMMENDED_FLOW.map((step, i) => (
        <FadeInWrapper key={step.num} delay={0.05 * i}>
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="font-display text-primary text-2xl font-black mb-2">{step.num}</div>
            <div className="font-cn font-bold text-foreground mb-1">{step.title}</div>
            <div className="font-cn text-xs text-muted-foreground">{step.desc}</div>
          </div>
        </FadeInWrapper>
      ))}
    </div>
  </section>
  ```

- [ ] **AC-4** · 系统概览 3 H4 卡 · 字面锁(spec §9.1) ·
  ```typescript
  const SYSTEM_OVERVIEW = [
    { title: '什么是AIP智能体', desc: '基于 AI 的 IP 起号 / 内容创作平台 · 9 步标准化向导' },
    { title: '核心定位', desc: 'OPC(One Person Company)创业者 + 个人 IP 起号者' },
    { title: '使用前准备', desc: '准备好账号信息 · 行业知识 · 目标受众画像' },
  ] as const;
  
  <section className="mb-16">
    <h2 className="font-display text-2xl font-bold text-foreground mb-6">系统概览</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {SYSTEM_OVERVIEW.map((card, i) => (
        <FadeInWrapper key={card.title} delay={0.05 * i}>
          <div className="glass-card rounded-xl p-5">
            <h4 className="font-display font-bold text-primary mb-2">{card.title}</h4>
            <p className="font-cn text-sm text-muted-foreground">{card.desc}</p>
          </div>
        </FadeInWrapper>
      ))}
    </div>
  </section>
  ```

- [ ] **AC-5** · 13 模块详解卡 · **复用 `FUNCTION_MATRIX`** + `FUNCTION_MATRIX_FOOTER` constants · 不重复定义 · 渲染时按 search filter ·
  ```typescript
  // 13 模块卡 = FUNCTION_MATRIX flat (3+2+5+4) - 1 (爆款元素生成是工具不是讲解) + 1 (使用说明 footer)
  // 实际 dump.md 说 13 模块卡 · spec §9.1 也说 13 · 我们用 FUNCTION_MATRIX flat + footer = 14 · 减去 1 实际有 13
  // D-220 锁 · 13 模块 = FUNCTION_MATRIX_FOOTER + FUNCTION_MATRIX flat 中 12 个工具(排除"使用说明")
  
  import { FUNCTION_MATRIX, FUNCTION_MATRIX_FOOTER } from '@/lib/constants/function-matrix';
  
  const ALL_MODULES = FUNCTION_MATRIX.flatMap((g) => g.cards);
  
  const filteredModules = searchQuery
    ? ALL_MODULES.filter((m) => m.title.includes(searchQuery) || m.desc.includes(searchQuery))
    : ALL_MODULES;
  
  <section className="mb-16">
    <h2 className="font-display text-2xl font-bold text-foreground mb-6">13 模块详解</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredModules.map((card, i) => (
        <FadeInWrapper key={card.href} delay={0.03 * i}>
          <Link to={card.href}>
            <div className="glass-card rounded-xl p-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer h-full">
              <div className="text-3xl mb-3">{card.icon}</div>
              <div className="font-display text-base font-bold text-foreground mb-1">{card.title}</div>
              <div className="font-cn text-xs text-muted-foreground">{card.desc}</div>
            </div>
          </Link>
        </FadeInWrapper>
      ))}
    </div>
    {/* footer 使用说明 单独一卡 */}
    <div className="mt-4 max-w-md mx-auto">
      <Link to={FUNCTION_MATRIX_FOOTER.href}>
        <div className="glass-card rounded-xl p-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer">
          <div className="text-3xl mb-3">{FUNCTION_MATRIX_FOOTER.icon}</div>
          <div className="font-display text-base font-bold text-foreground mb-1">{FUNCTION_MATRIX_FOOTER.title}</div>
          <div className="font-cn text-xs text-muted-foreground">{FUNCTION_MATRIX_FOOTER.desc}</div>
        </div>
      </Link>
    </div>
  </section>
  ```

- [ ] **AC-6** · FAQ 5 问 5 答(spec §9.1)· 字面锁 D1=A · 完整 constants ·
  ```typescript
  // apps/web/src/lib/constants/guide-faq.ts(新建)
  // PRD-21 D-221 · FAQ 5 问 5 答 字面 1:1 锁
  export const GUIDE_FAQ_5 = [
    {
      q: 'AI 生成的文案可以直接用吗？',
      a: '建议作为参考 · 结合自己的 IP 人设和真实经历微调 · 让内容更有人味更可信。',
    },
    {
      q: '需要付费吗？',
      a: '当前为邀请制内测 · 通过邀请码注册后可免费使用全部功能 · 后续会上线套餐 · 详见 /accounts。',
    },
    {
      q: '生成的内容质量怎么保证？',
      a: '基于多模型 LLM Gateway · 14 个专属 Specialist 经过 PRD-20 真 LLM 接入 + 7 Specialist tuning · 9/9 PASSED A 级。',
    },
    {
      q: '可以批量生成吗？',
      a: '部分模块支持(如选题库 5 大类一键生成 · boom-generate 多元素组合)· 部分模块按 IP 账号隔离一次一条避免污染。',
    },
    {
      q: '数据安全如何保证？',
      a: '本地优先(LS-first dual-write)· 服务端用 RLS per-tenant 隔离 · 不会跨 IP 账号泄露。',
    },
  ] as const;
  ```
  渲染 · accordion 形式(用项目已有 `@/components/ui/accordion` 或简易 details/summary)·
  ```typescript
  <section className="mb-16">
    <h2 className="font-display text-2xl font-bold text-foreground mb-6">FAQ 常见问题</h2>
    <div className="max-w-3xl mx-auto space-y-2">
      {GUIDE_FAQ_5.map((item, i) => (
        <details key={i} className="glass-card rounded-xl p-4 cursor-pointer">
          <summary className="font-cn font-bold text-foreground">{item.q}</summary>
          <p className="font-cn text-sm text-muted-foreground mt-2">{item.a}</p>
        </details>
      ))}
    </div>
  </section>
  ```

- [ ] **AC-7** · `<main>` wrapper 加 `data-grid-bg` · 完整 ·
  ```typescript
  export default function Guide() {
    const [searchQuery, setSearchQuery] = useState('');
    return (
      <main className="flex-1 container mx-auto px-4 py-8 data-grid-bg min-h-screen">
        {/* ... */}
      </main>
    );
  }
  ```

- [ ] **AC-8** · TypeScript 0 error · `cd apps/web && pnpm typecheck`
- [ ] **AC-9** · 现有 e2e test `tests/e2e/prd16-guide-flow.spec.ts` 仍 pass
- [ ] **AC-10** · visual diff · `prd21-visual-baseline.spec.ts` 中 `guide page /guide matches 01-guide.png baseline` test pass · pixel-diff < 5%
- [ ] **AC-11** · 浏览器手动验证 · 打开 `http://localhost:5173/guide` · 确认 ·
  - H1 USER GUIDE 大字 + 副标
  - search input 居中 + placeholder "搜索功能说明..."
  - 5 步推荐流程横排 5 卡 + stagger 入场
  - 系统概览 3 卡
  - 13 模块详解卡 + footer 使用说明
  - FAQ 5 accordion 可展开 / 收起
  - 输入 search query 时模块卡 filter

**Locked Decisions for US-006** ·
- **D-220** · 13 模块详解 = `FUNCTION_MATRIX.flatMap(g => g.cards)` 14 个 - 重复或不适用的 · 实际 14 个全保留(展示)+ FUNCTION_MATRIX_FOOTER 单独 footer 区
- **D-221** · `GUIDE_FAQ_5` 5 问 5 答 constants 字面锁 · 不允许 ralph 创意改写

---

### US-007 medium · /ip-plan 视觉精修(返回首页 + N/9 + 刷新 + glass-card 进度条 + 9 步卡片网格)

**风险分档** · **medium**(单 page 改)

**Story 大小** · medium(改 `apps/web/src/pages/IpPlan.tsx` · ~150 LOC 重写)

**描述** · 作为用户 · 访问 `/ip-plan` 时 · 我想看到完整 IP 方案进度 page · 包括顶部 [← 返回首页] button + H1 我的IP方案 + 副标 已完成 N/9 步 + [↻ 刷新] button + glass-card IP 打造进度条 + 9 步卡片网格(每卡 emoji + 步骤名 + 状态)· 严格按 dump §2.1 + spec §9.2。

**Acceptance Criteria** ·

- [ ] **AC-1** · `apps/web/src/pages/IpPlan.tsx` 整体结构 · 5 区块 ·
  - 顶部导航条(返回首页 + 标题 + 刷新)
  - H1 + 副标 N/9
  - glass-card 进度条
  - 9 步卡片网格
  - 数据已保存 hint(可选)

- [ ] **AC-2** · 顶部 [← 返回首页] button + H1 + [↻ 刷新] · 完整代码 ·
  ```typescript
  import { ArrowLeft, RefreshCw, FileText } from 'lucide-react';
  import { Link } from 'react-router-dom';
  import { useState } from 'react';
  
  import { Button } from '@/components/ui/button';
  import { trpc } from '@/lib/trpc';
  
  export default function IpPlan() {
    const { data: progress, isLoading, refetch } = trpc.stepData.progress.useQuery();
    const completed = progress?.completedSteps ?? [];
    const percent = Math.round((completed.length / 9) * 100);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const handleRefresh = async () => {
      setIsRefreshing(true);
      await refetch();
      setIsRefreshing(false);
    };
    
    return (
      <main className="flex-1 container mx-auto px-4 py-8 data-grid-bg min-h-screen">
        {/* 顶部导航条 */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
        
        {/* H1 + 副标 */}
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            我的IP方案
          </h1>
          <p className="font-cn text-muted-foreground">
            已完成 <span className="text-primary font-bold">{completed.length}</span> / 9 步
          </p>
        </div>
        
        {/* glass-card 进度条 */}
        <div className="glass-card rounded-xl p-6 mb-10 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="font-cn text-sm font-bold text-foreground">IP打造进度</span>
            <span className="text-primary font-bold text-lg">{percent}%</span>
          </div>
          <div className="w-full h-4 bg-muted/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        
        {/* 9 步卡片网格(US-007 AC-3) */}
        <IpPlanStepGrid completedSteps={completed} isLoading={isLoading} />
      </main>
    );
  }
  ```

- [ ] **AC-3** · 9 步卡片网格 · 新建 `apps/web/src/components/ip-plan/IpPlanStepGrid.tsx` · 字面锁 D1=A · 严格按 spec §9.2 + dump §2.1 的 9 步名称(已经在 lib/constants/stepConfig.ts 有定义 · 复用)·
  ```typescript
  // apps/web/src/components/ip-plan/IpPlanStepGrid.tsx
  import { Link } from 'react-router-dom';
  import { ChevronRight, CheckCircle2 } from 'lucide-react';
  
  import { FadeInWrapper } from '@/components/FadeInWrapper';
  import { Button } from '@/components/ui/button';
  
  // PRD-21 D-222 · 9 步卡片 emoji + 步骤名 · 严格按 dump §2.1 字面
  const IP_PLAN_STEPS = [
    { num: '01', stepKey: 'step1',  href: '/step/1',  emoji: '🏭', title: '行业选择' },
    { num: '02', stepKey: 'step3',  href: '/step/3',  emoji: '📦', title: '账号包装' },
    { num: '03', stepKey: 'step3b', href: '/step/3b', emoji: '🎭', title: '人设定制' },
    { num: '04', stepKey: 'step4',  href: '/step/4',  emoji: '📋', title: '执行计划' },
    { num: '05', stepKey: 'step4b', href: '/step/4b', emoji: '💰', title: '变现路径' },
    { num: '06', stepKey: 'step5',  href: '/step/5',  emoji: '🔥', title: '爆款选题' },
    { num: '07', stepKey: 'step6',  href: '/step/6',  emoji: '🎬', title: '拍摄计划' },
    { num: '08', stepKey: 'step7',  href: '/step/7',  emoji: '✍️', title: '文案生成' },
    { num: '09', stepKey: 'step8',  href: '/step/8',  emoji: '📡', title: '直播策划' },
  ] as const;
  
  interface IpPlanStepGridProps {
    completedSteps: string[];
    isLoading: boolean;
  }
  
  export function IpPlanStepGrid({ completedSteps, isLoading }: IpPlanStepGridProps) {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-4 h-40 animate-pulse bg-muted/20" />
          ))}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {IP_PLAN_STEPS.map((step, i) => {
          const isCompleted = completedSteps.includes(step.stepKey);
          return (
            <FadeInWrapper key={step.stepKey} delay={0.05 * i}>
              <Link to={step.href}>
                <div className="glass-card rounded-xl p-4 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer h-full flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{step.emoji}</div>
                    <span className="font-display text-primary text-xs font-bold">{step.num}</span>
                  </div>
                  <div className="font-cn font-bold text-foreground mb-1">{step.title}</div>
                  <div className="font-cn text-xs text-muted-foreground mb-3">
                    {isCompleted ? (
                      <span className="text-primary flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> 已完成 · 数据已保存
                      </span>
                    ) : (
                      <span>未完成</span>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="mt-auto gap-1 self-start text-primary hover:bg-primary/10">
                    查看详情
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </Link>
            </FadeInWrapper>
          );
        })}
      </div>
    );
  }
  ```

- [ ] **AC-4** · `<main>` wrapper 用 `data-grid-bg` class
- [ ] **AC-5** · TypeScript 0 error
- [ ] **AC-6** · 现有 e2e test `tests/e2e/prd16-ip-plan-flow.spec.ts` 仍 pass
- [ ] **AC-7** · visual diff · `prd21-visual-baseline.spec.ts` 中 `ip-plan page /ip-plan matches 02-ip-plan.png baseline` test pass · pixel-diff < 5%
- [ ] **AC-8** · 浏览器手动验证 · 打开 `http://localhost:5173/ip-plan` · 确认 ·
  - 顶部 [← 返回首页] button(点击跳 /)
  - H1 "我的IP方案" + FileText 金色 icon
  - 副标 已完成 N/9 步
  - [↻ 刷新] button(点击 trigger refetch + spin)
  - glass-card 进度条 + percent
  - 9 步卡片网格(5 列 lg / 3 列 md / 1 列 sm)
  - 每卡 emoji + num + 步骤名 + 完成状态 + 查看详情 button

**Locked Decisions for US-007** ·
- **D-222** · 9 步 emoji + 步骤名 字面锁 · `IP_PLAN_STEPS` constants 不允许 ralph 创意改写 emoji 或 title

---

### US-008 收官 · verify-prd-21.sh + 4 page visual diff baseline 通过

**风险分档** · 收官(综合验证 · 阻断 PRD-22 启动)

**Story 大小** · medium(完成 verify-prd-21.sh §2-§10 + visual diff 首跑 + commit baseline)

**描述** · 作为 release manager · 我需要 verify-prd-21.sh 完整覆盖 10 个 section · 4 page visual diff baseline 通过 · 全 TypeScript / vitest / playwright 绿 · 准备 PRD-22 切入。

**Acceptance Criteria** ·

- [ ] **AC-1** · `scripts/verify-prd-21.sh` 完整 10 section ·
  - §1 视觉对齐 baseline(US-001 完成)
  - §2 Header 视觉(US-002)
  - §3 Mobile nav(US-003)
  - §4 共享 utility(US-004)
  - §5 Home(US-005)
  - §6 /guide(US-006)
  - §7 /ip-plan(US-007)
  - §8 跨 PRD 一致性(不破坏 PRD-15/16/17/18/19/20 e2e fixture)
  - §9 TypeScript + vitest test count
  - §10 git branch / commit / progress.txt

- [ ] **AC-2** · `bash scripts/verify-prd-21.sh` 退出码 0 · 全 35+ check pass

- [ ] **AC-3** · 4 visual baseline test pass · `pnpm test:visual:check` 全绿 ·
  - home / matches 00-home.png · pixel-diff < 5%
  - guide / matches 01-guide.png · pixel-diff < 5%
  - ip-plan / matches 02-ip-plan.png · pixel-diff < 5%
  - header desktop crop matches 00-home-header crop · pixel-diff < 5%

- [ ] **AC-4** · TypeScript 全绿 · `cd apps/web && pnpm typecheck` · 0 error

- [ ] **AC-5** · vitest test count ≥ 119(PRD-19 baseline)+ 本 PRD 新增 ≥ 4(prd21-visual-baseline.spec.ts)= ≥ 123 · 全 pass

- [ ] **AC-6** · `pnpm test:e2e` 全 e2e test pass(预期 PRD-21 新增 prd21-visual-baseline.spec.ts + prd21-mobile-nav.spec.ts + 之前的 prd15-* / prd16-* / prd17-* 等 fixture 仍 pass)

- [ ] **AC-7** · `/goal-verify §0` 跑 `/gsd-map-codebase` 在 apps/web · 生成 `.planning/codebase/` 7 文件 · 与 AGENTS.md 设计约束对账(D1=A + D4=B 仍 honored)· 偏差登记 `.agents/tech-debt.json` category=design-drift

- [ ] **AC-8** · `/goal-verify §1+` Goal-backward 验证 · 8 US 完成 vs PRD-21 §2 目标 7 项 · 全勾

- [ ] **AC-9** · `/prd-retro` 跑 · 提炼可迁移 playbook(预期 · visual-diff 基础设施 / Header 双行 logo / MobileNavPanel pattern / FadeInWrapper API)· 回传 `~/.claude/playbooks/reject-examples.jsonl`(若有新 reject 反例)

- [ ] **AC-10** · `progress.txt` 追加 PRD-21 收官 entry · 含 ·
  - PRD-21 ship date + commit SHA
  - 8 US 全 audit approved
  - visual diff baseline 建立
  - 准备 PRD-22(5 inline 重构 + step pages 视觉精修)

- [ ] **AC-11** · 浏览器手动整体验证 · 用 agent-browser 跑 4 page(home / guide / ip-plan / header)· 确认 ·
  - 无控制台 error
  - 视觉跟 baseline 一致(手肉眼对比)
  - 4 dropdown / mobile panel / search input / accordion 全部交互正常
  - data-grid-bg 全 4 page 都有
  - toast 触发时在 bottom-right
  - 卡片 hover 200ms + framer-motion stagger 入场

---

## §4 Functional Requirements

- **FR-1** · 视觉对齐 baseline · 当前 5173 页面截图跟 `/tmp/aiipznt-clone-research/screenshots/{name}.png` baseline pixel-diff 必须 < 5%
- **FR-2** · Header 高度 64px(h-16) · 严格按 dump §1.1
- **FR-3** · Header 背景 `backdrop-blur-2xl` · 严格按 dump §1.6
- **FR-4** · Header logo 双行 stack + 金色方块 icon · 不抄 aiipznt SVG · 字 QUAN / QN
- **FR-5** · 4 dropdown ChevronDown 展开时 rotate-180 · `data-[state=open]:rotate-180 transition-transform`
- **FR-6** · Mobile nav 形态 = header 下方下拉面板(lg:hidden border-t · bg-background/95 · backdrop-blur-2xl · max-h-[70vh] overflow-y-auto)
- **FR-7** · Mobile panel 内容 = 4 大类 Rajdhani 分组 + 25 二级 + 用户区固定底部
- **FR-8** · `data-grid-bg` 必须用在全 32 page <main> wrapper(通过 RootLayout / StepLayout 共享 wrapper 加)
- **FR-9** · Toaster sonner `position="bottom-right" duration={4000}`
- **FR-10** · `<FadeInWrapper delay duration from className>` API 锁
- **FR-11** · Home Hero H1 字号 `text-8xl md:text-9xl`
- **FR-12** · /guide 含 search input + 5 步推荐流程 + 系统概览 3 卡 + 13 模块卡 + FAQ 5 + footer 使用说明
- **FR-13** · /ip-plan 含 返回首页 button + H1 + N/9 副标 + 刷新 button + glass-card 进度条 + 9 步卡片网格
- **FR-14** · 4 visual baseline test 跑 pixel-diff < 5%

---

## §5 Non-Goals(超出范围)

- ❌ **不动 admin** · `apps/admin/` 完全 0 触动
- ❌ **不重写 backend** · `apps/api/` tRPC routes + DB schema 全保留 · 仅 frontend 重构
- ❌ **不删 PRD-15 沉淀 8 page** · /trending / /copywriting / /deep-learning / /monetization / /present-styles / /private-domain / /my-topics / /history 仅视觉对齐验证 · 不重做内容
- ❌ **不切金色 token**(D4=B 锁)· 保留当前 HSL 43° 金色 token · OKLCH 任何 ref 替换为 `var(--primary)`
- ❌ **不实施 5 page inline 重构**(留给 PRD-22)· /generate / /boom-generate / /ai-video / /knowledge / /step/1 内部 inline cards 不在本 PRD 范围
- ❌ **不实施 step page 视觉精修**(留给 PRD-22)· Step 1/3/3b/4/4b/5/6/7/8 视觉精修不在本 PRD
- ❌ **不实施 3 stub 完整化**(留给 PRD-23)· /diagnosis / /accounts / /step/8 stub 不在本 PRD
- ❌ **不实施 14 工具 page 视觉收官**(留给 PRD-23)
- ❌ **不实施 6 modules 视觉精修**(留给 PRD-24)
- ❌ **不切 mobile 端 viewport baseline**(本 PRD 仅 desktop 1440x900 baseline · mobile baseline 留 PRD-24)
- ❌ **不抄 aiipznt 版权专属素材** · 不直接复制 logo svg / slogan / 品牌营销长文案 / 产品截图 · 用 QuanQn 占位
- ❌ **不去 Manus 依赖**(已 PRD-2 处理)
- ❌ **不绕过 Audit Gate** · 严格按 Coding 3.0 12 步走

---

## §6 Design Considerations

- **现有 UI 组件复用** · shadcn/ui (Button / DropdownMenu / Input / Separator / ScrollArea)· lucide-react icons · sonner Toaster
- **新增 component** · `MobileNavPanel` + `FadeInWrapper` + `IpPlanStepGrid` · 共 3 个 · 后续 PRD 复用
- **constants 复用** · `HEADER_NAV`(25 二级)/ `FUNCTION_MATRIX`(15 卡)/ `WORKFLOW_STEPS`(7 step)/ `STEP_ORDER_KEYS`(9 step)/ 新增 `GUIDE_FAQ_5`(5 问答)/ 新增 `IP_PLAN_STEPS`(9 步 emoji)
- **设计 token D4=B 严锁** · 保留当前 HSL 43° 金色 · 不切 OKLCH 金色 · 视觉天然接近 aiipznt
- **字体** · Orbitron(大标 H1/H2)/ Rajdhani(副标 / mobile 4 分组)/ Noto Sans SC(中文)/ ui-sans-serif(正文)· 已 PRD-16 加载 · 本 PRD 不重做
- **动效** · framer-motion(入场 stagger · 200-400ms ease-out)/ animate-ping-primary(UserChip)/ chevron rotate(dropdown trigger)/ accordion 展开 / hover transition
- **baseline 抓取** · `/tmp/aiipznt-clone-research/screenshots/` 32 PNG 1440x900 fullPage · sally zhao 登录态(2026-05-16 抓取)

---

## §7 Technical Considerations

- **playwright visual snapshot** · `toHaveScreenshot([baselinePath], { maxDiffPixelRatio, fullPage })` API · baseline 通过 `[absPath]` 元组而非 string · 这是 playwright 5.x 写法
- **首跑生成 baseline** · 第一次跑 `test:visual` 必须用 `--update-snapshots` flag 生成 baseline image(saved 到 `tests/e2e/prd21-visual-baseline.spec.ts-snapshots/`)· 后续 CI 跑 `test:visual:check` 不带 flag 时直接对比
- **依赖** · `framer-motion ^11` · 检查 `apps/web/package.json` 已有 / 若没有需 pnpm add
- **dev server 必须跑** · visual diff test 要求 5173 在 listen · CI 中需 `webServer` 配置自启 vite dev
- **headless chromium 字体** · playwright headless 用系统字体 · Google Fonts 通过 preconnect 异步加载 · 测试前 `await page.waitForLoadState('networkidle')` + 测试 fixture 中 add CSS disable animations
- **跨 viewport** · 本 PRD 锁 desktop 1440x900 · mobile baseline 留 PRD-24(viewport 375x667)
- **TypeScript 严格** · `MobileNavPanel` / `FadeInWrapper` / `IpPlanStepGrid` 全用 explicit interface props · 不允许 implicit any
- **R-4 audit-friendly** · 任何 LS 写入(无 · 本 PRD 不涉 LS)
- **R-5 LocalStorage acc_** · 不涉(本 PRD 仅前端视觉)

---

## §7.5 跨 Story 协议锁

本 PRD 8 US · 多 story 共享同一组符号 · 必须锁名 ·

| 命名 | 类型 | 定义 story | 消费 story | 说明 |
|---|---|---|---|---|
| `expectVisualMatch(page, options)` | async function | US-001 | US-002/003/004/005/006/007/008 + PRD-22~24 全部 | visual diff helper · API 锁 D-208 |
| `AIIPZNT_BASELINE_DIR` | const string | US-001 | US-001~008 visual test | `/tmp/aiipznt-clone-research/screenshots` |
| `ExpectVisualMatchOptions` | interface | US-001 | 同上 | `{ baseline, viewport, fullPage, maxDiffPixelRatio }` 4 字段 |
| `data-grid-bg` | CSS class | US-004 | US-005/006/007 + PRD-22~24 全 32 page | utility 全 32 page <main> 用 |
| `animate-ping-primary` | CSS class | US-004 | Header.tsx UserChip(已用)+ 未来 | keyframe + animation rule |
| `<FadeInWrapper>` | React component | US-004 | US-005/006/007 + 未来 | API `{ delay, duration, from, className, children }` |
| `<MobileNavPanel open onClose>` | React component | US-003 | Header.tsx(US-002 改后引用) | mobile nav 唯一实现 · 不用 Sheet |
| `MAX_DIFF_PIXEL_RATIO` | const number 0.05 | US-001 | 全 visual diff test | D-206 锁 5% |
| `header-mobile-panel` | data-testid | US-003 | tests/e2e/prd21-mobile-nav.spec.ts + 未来 mobile e2e | 唯一 testid · 不允许变 |
| `header-hamburger` | data-testid | US-003 | 同上 | hamburger button · 唯一 testid |
| `header-logout-icon` | data-testid | US-002(保留)| 同上 | 已存在 Header.tsx 不动 |

**定义 story 的 priority 必须严格小于消费 story** ·
- US-001 priority 1(foundation 最高)
- US-002/003 priority 2(high)
- US-004 priority 3
- US-005/006/007 priority 4
- US-008 priority 5(收官)

ralph daemon 按 priority 顺序串行执行 · 不允许并行(因为后续 US 依赖前序 helper API)。

---

## §8 Success Metrics

- ✅ **视觉对齐 baseline 通过** · 4 page(home / guide / ip-plan / header-desktop)pixel-diff < 5%
- ✅ **8 US 全 audit approved** · Opus 4 维度审 + risk_level 分档(foundation 全审 + high 重点 + medium 标准)
- ✅ **TypeScript 0 error** · `cd apps/web && pnpm typecheck`
- ✅ **vitest test count ≥ 123** · PRD-19 baseline 119 + 本 PRD 新增 ≥ 4
- ✅ **e2e test 0 regression** · `pnpm test:e2e` 全绿(包括 PRD-15/16/17/18/19/20 历史 fixture)
- ✅ **visual baseline infra 后续可复用** · PRD-22~24 直接 import `expectVisualMatch` 用
- ✅ **commit count 20-25 个**(预期 daemon 8 US × 2-3 commit/US)
- ✅ **daemon time 11-15h** · 8 US × 平均 80-120 min/US
- ✅ **wall time 1.5-2 周** · 含 daemon + audit + retro
- ✅ **0 TD 新增**(本 PRD 不引入设计偏差 · 若有 design-drift 需登记 `.agents/tech-debt.json` category=design-drift)

---

## §9 Open Questions

1. **playwright `webServer` 配置是否要自启 vite dev** · 本 PRD 默认要求 dev server 跑(local 5173 已在 listen)· 但 CI 需要 webServer 配置 · 当前 playwright.config 未确认 · 实施时 ralph 看现状决定是否补
2. **baseline 命名是否含 `-desktop` / `-mobile` 后缀** · 当前 baseline 是 1440 desktop · 后续 PRD-24 加 mobile baseline 时是否重命名为 `00-home-desktop.png` + `00-home-mobile.png` · 还是新建 mobile 目录 · 留 PRD-24 决定
3. **framer-motion 是否已在 apps/web package.json** · 实施时 ralph 先查 · 若没有需 pnpm add(可能要先确认 D4=B 视觉系统中 framer-motion 是否之前 PRD-16 已加)
4. **Guide.tsx 当前 189 LOC 是否完全重写还是增量改** · PRD 描述按完全重写写 · 实施时 ralph 看现状决定(目标 ~350 LOC)
5. **`/login` /  `/settings` /  `/404` 是否在本 PRD 加 data-grid-bg** · 是 · US-004 AC-5 覆盖

---

## §10 Locked Decisions

> **延续编号** · 从 D-206 起(PRD-20 收尾 D-205)· 本 PRD 共 17 D(D-206~D-222)

### US-001 视觉 diff 基础设施
- **D-206** · `maxDiffPixelRatio: 0.05` (5% pixel-diff threshold) · 理由 · aiipznt baseline 2 天前抓 · 字号 / antialias 微差预期 · 5% 给字体渲染容差 + 防 flaky
- **D-207** · baseline 路径 = `/tmp/aiipznt-clone-research/screenshots/` (不进 git · 第三方产物 · cookie 安全已锁)
- **D-208** · `expectVisualMatch(page, ExpectVisualMatchOptions)` helper API 锁 · 后续 PRD-22~24 共用 · 参数名 / 类型 / 默认值不允许改

### US-002 Header 视觉精修
- **D-209** · Header container 高度 `h-16` (64px) · 锁 dump §1.1 实测
- **D-210** · sticky element 全局用 `backdrop-blur-2xl`
- **D-211** · Logo 双行 stack 占位规则 · 金色方块 div(8×8 rounded · bg-primary)+ 双行 `flex flex-col leading-none` text · 字 QUAN / QN(不抄 aiipznt AIP/AGENT)
- **D-212** · 4 dropdown ChevronDown 加 `transition-transform duration-200 data-[state=open]:rotate-180`

### US-003 Mobile nav
- **D-213** · Mobile nav 形态 = `lg:hidden border-t bg-background/95 backdrop-blur-2xl max-h-[70vh] overflow-y-auto` header 下方下拉面板 · 不用 shadcn Sheet drawer

### US-004 共享 utility
- **D-214** · `data-grid-bg` utility 全 32 page <main> wrapper 用(优先通过 `RootLayout.tsx` / `StepLayout.tsx` 共享 wrapper 加)
- **D-215** · Toaster sonner `position="bottom-right" duration={4000}` (全局唯一 instance)
- **D-216** · `<FadeInWrapper>` API 锁 · `{ delay, duration, from, className, children }`

### US-005 Home 视觉精修
- **D-217** · Home Hero H1 字号 `text-8xl md:text-9xl` (8rem→9rem) + mb-8
- **D-218** · StepProgress 9 step 横排卡 `gap-2` (紧凑密度)
- **D-219** · FUNCTION MATRIX 卡 hover 过渡 `duration-200` + framer-motion stagger `delay 0.05*idx`

### US-006 /guide 视觉精修
- **D-220** · 13 模块详解 = `FUNCTION_MATRIX.flatMap(g => g.cards)` 14 个全保留 + footer 使用说明单独
- **D-221** · `GUIDE_FAQ_5` 5 问 5 答 constants 字面锁 · 不允许 ralph 创意改写

### US-007 /ip-plan 视觉精修
- **D-222** · 9 步 emoji + 步骤名 字面锁 · `IP_PLAN_STEPS` constants 不允许 ralph 创意改写

---

## §11 实施前置准备 + 风险分档预设

### §11.1 写 prd-21.json 前必做

1. **当前 branch** · `main`(刚 PRD-20 收尾)· PRD-21 启动前应新建 `ralph/prd-21-visual-alignment-foundation`
2. **prd-21.json 路径** · `scripts/ralph/prd-21.json` · 转完后 cp 到 `scripts/ralph/prd.json` (ralph daemon 默认读)
3. **/plan-check 必跑** · 转完后跑 `/plan-check` 验证 · 重点 ·
   - 2.6.13 anti_patterns 注入覆盖率(US-001 + US-002 + US-003 3 个 high/foundation 必注入)
   - 2.6.14 大 UI Story 拆分检查(本 PRD 无 large · 全 medium · 应 PASS)
   - 2.6.17 R-5 LocalStorage acc_(本 PRD 不触 LS · 应 PASS)
   - 2.6.18 R-4 stats audit-friendly(本 PRD 不触 stats · 应 PASS)
   - 2.6.7-ext D4=B 中文颜色词 vs token 一致性检查(本 PRD 没写"金色"或"紫色"具体字面 · 应 PASS)
   - 2.6.20 D1A-text-content-drift(本 PRD AC-2~3 锁了 Hero 副标 + Guide FAQ + IP plan steps 字面 · 应 PASS)
4. **ralph daemon 启动** · 严格按全局 CLAUDE.md §9.1 5 步 SOP ·
   - Step 1 · 确认 prd.json 就位
   - Step 2 · ★ Monitor 必先启(关键 · 不能在 daemon 之后启)
   - Step 3 · `python3 scripts/ralph/ralph.py --model sonnet --daemon`
   - Step 4 · 等 Monitor 通知 PENDING_DETECTED:US-XXX
   - Step 5 · Opus 5 步 Cheat Sheet audit

### §11.2 风险分档(写 prd-21.json 时 risk_level 字段)

| US | risk_level | 理由 |
|:-:|:-:|---|
| US-001 | **foundation** | 下游 7 US + PRD-22~24 全部复用 expectVisualMatch helper · 失败影响全 4 PRD |
| US-002 | **high** | Header 是全 32 page 共享 · 视觉漂移直接破坏首屏体验 |
| US-003 | **high** | Mobile nav 形态切换大改 · 涉及 component 删除 + 新建 |
| US-004 | medium | 单纯加 utility · 不破坏现有 page |
| US-005 | medium | 单 page 改 · 不影响其他 page |
| US-006 | medium | 单 page 改 |
| US-007 | medium | 单 page 改 |
| US-008 | medium | 收官 verify · 综合检查 |

### §11.3 anti_patterns 注入策略

ralph skill 转 prd-21.json 时按以下关键词检索 `~/.claude/playbooks/reject-examples.jsonl` 注入到对应 US ·

- **US-001 foundation**(必注 ≤ 3 条)·
  - 关键词 · `visual-diff` / `snapshot` / `playwright` / `threshold` / `CI`
  - 预期注入 · playwright snapshot baseline first-run / threshold 5% 容差边界 / CI 跑 dev server 启动

- **US-002 high**(必注 ≤ 3 条)·
  - 关键词 · `Header` / `sticky` / `backdrop` / `shadcn` / `dropdown`
  - 预期注入 · shadcn dropdown asChild 多重 ref 警告 / backdrop-blur safari hardware acceleration / sticky z-index 冲突

- **US-003 high**(必注 ≤ 3 条)·
  - 关键词 · `mobile-nav` / `Sheet` / `drawer` / `responsive` / `viewport`
  - 预期注入 · 删除组件后 import 清理 / lg:hidden vs hidden md:block 边界 / mobile menu state lift

- **US-004~007 medium**(可注 0-2 条)·
  - 关键词 · `framer-motion` / `Toaster position` / `LocalStorage migration`

### §11.4 Cheat Sheet Audit 5 步预演(Opus 审 PRD-21 US 用)

Opus 收到 PENDING_DETECTED:US-XXX 通知后必做 ·

1. **Step 1 · §0 4 项实测**(零回归 / 类型 / import / SQL)
   - `cd apps/web && pnpm typecheck`(必跑)
   - `pnpm test:e2e tests/e2e/prd21-*.spec.ts`(本 PRD 新增 e2e 必跑)
   - `pnpm test:visual:check`(visual baseline 必跑 · 1st iter 可能需 --update-snapshots 先建 baseline)
   - import 验证(MobileNavPanel / FadeInWrapper / expectVisualMatch 导出正确)

2. **Step 2 · risk_level 分档**
   - foundation US-001 · §0 + 通用 + 全部域 grep + line-by-line + 必读全部相关测试代码(深审 10-15 min)
   - high US-002/003 · §0 + 通用 + 5 条 grep + 关键函数阅读(标准审 5-8 min)
   - medium US-004~008 · §0 + 通用 + 2-3 条 grep(快审 2-3 min)

3. **Step 3 · 通用 4 维度**
   - AC 逐条 PASS/FAIL
   - AGENTS.md 技术约束(D4=B 紫色保留 / D1=A 字面锁 / R-4 audit-friendly / R-5 LS acc_)
   - 安全(无新 LS / 无新 cookie / 无 secret 写入)
   - PRD 一致性(US-XXX 实现 vs PRD §3 描述完全一致)

4. **Step 4 · 域 grep**(以下 5 条任选)
   - `grep -rE "h-12|h-14" apps/web/src/components/Header.tsx`(应为 0 · h-16 锁)
   - `grep -rE "from-violet|from-amber|金色|紫色" apps/web/src/`(应为 0 · D4=B 字面锁)
   - `grep -rE "import.*Sheet" apps/web/src/components/Header.tsx`(US-003 后应为 0)
   - `grep -rE "expectVisualMatch" tests/e2e/`(应 ≥ 4 个 occurrences)
   - `grep -rE "data-grid-bg" apps/web/src/layouts/`(US-004 后应 ≥ 1)

5. **Step 5 · approve 报告格式**
   - risk_level: <level>
   - 4 项实测结果(零回归 / 类型 / import / SQL)
   - 通用 4 维度结论
   - grep 结果(扫描的 5 条 grep + count)
   - TD 豁免(若有 · 引用 `.agents/tech-debt.json`)
   - 准予 approve / reject + reject feedback 反例(若 reject)

### §11.5 TD 免罪金牌规则

若实测报错但 Opus 判断是 pre-existing tech debt ·
- ✅ 必须在 approve 报告写 "TD-X 豁免 approve · <理由>, 证据: <file:line>"
- ✅ 必须登记到 `.agents/tech-debt.json`(若不存在则创建)
- ✅ 必须在 progress.txt 记录豁免
- ❌ 不允许口头说 "pre-existing 跳过" 就 approve

---

## §12 PRD-22~24 衔接说明

PRD-21 是 4 PRD 系列(主应用对齐 aiipznt)的第二阶段(PRD-16~20 完成结构对齐 · PRD-21~24 完成视觉对齐) · 负责 ·

- **视觉对齐 baseline infrastructure**(US-001)
- **Header + Mobile nav 视觉精修**(US-002/003)
- **共享 utility 全局补齐**(US-004)
- **3 公开 page 视觉精修**(US-005/006/007)
- **收官 verify**(US-008)

后续 ·

- **PRD-22** · 5 inline 重构 + 9 step pages 视觉精修(10-12 US · 2.5 周)
  - foundation · `ScriptTypeInlineCards` + `ElementsInlineMultiPicker` + `PlatformInlineRadio` 3 inline picker utility 抽象
  - high · /generate 重构 inline 20 脚本类型卡 + 22 元素 button(替换 ToolForm)
  - high · /boom-generate 重构 inline 22 元素 + 多脚本
  - medium · /ai-video 重构 inline 5 平台 + 6 视频类型 + 分镜表
  - medium · /knowledge 重构 30 button(3 toggle + 27 案例计数)+ 40 cards
  - medium × 6 · Step 1/3/3b/4/4b/5/6/7/8 视觉精修(按 dump §2 每 page Diff 点)
  - 收官 · verify-prd-22.sh + 13 page visual diff baseline

- **PRD-23** · 3 stub 完整化 + 14 工具视觉精修(8-10 US · 2 周)
  - high · /diagnosis 7 维度诊断报告完整化
  - high · /accounts IP 账号管理 + 新建账号 modal
  - high · /step/8 直播策划 2 子功能完整化
  - medium × 7 · 14 工具 page 视觉精修(PRD-15 已完成的 8 + 新加 inline 的 5 + /trending 验证)
  - 收官 · verify-prd-23.sh + 14 工具 visual diff

- **PRD-24** · 6 modules 视觉精修 + 全 32 page visual diff 收官 + mobile baseline(6-8 US · 1.5 周)
  - medium × 4 · /daily-tasks / /evolution / /my-topics / /history 视觉精修
  - medium · /voice-chat 视觉精修(612 LOC 大组件 · 需细查)
  - medium · mobile baseline 抓取(viewport 375x667 32 PNG)+ mobile visual diff test
  - high · 全 32 page visual diff 全通过(≤5% threshold)+ ALL CHECKS PASSED
  - 收官 · verify-prd-24.sh + retro + PRD-21~24 4 PRD 总收官

**总 4 PRD · 32-39 US · 7.5-9 周 wall time** · 完成后 main app `apps/web` 跟 aiipznt 视觉 pixel-diff < 5%(全 32 page · desktop + mobile)。

---

> **本 PRD 由 Opus 4.7 在 2026-05-18 BJT 写 · 跟 aiipznt-deep-dom-dump.md(382 行 32 page DOM 实测)+ aiipznt-spec.md(9192 行复刻基线)+ aiipznt-clone-plan.md(高层视觉总览)+ .agents/diff-analysis/aiipznt-2026-05-18.md(内部差距诊断)互补使用 · 严格遵守全局 CLAUDE.md "质量第一 · 上下文不是借口" + Coding 3.0 12 步流程**
