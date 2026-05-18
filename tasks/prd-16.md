# PRD-16 · 主应用前端对齐 aiipznt(Phase 1)· 首页 + Header + 设计系统 + /guide + /ip-plan

> **版本** · v0.1(2026-05-16 创建 · Opus 4.7 主对话写)
> **范围** · 跟 aiipznt 对齐 · 4 件事 ·
> 1. 设计系统切 Orbitron / Rajdhani / Noto Sans SC 字体 + animate-ping 紫色变体 + spacing 校准(**颜色保留 Aurelian Dark 紫 · D4=B**)
> 2. 首页 / 全新建 · Hero "AI+短视频+IP" + 9 步进度 + FUNCTION MATRIX 15 卡 + WORKFLOW 7 步 + READY TO START? CTA
> 3. Header 重构 · 4 一级菜单 dropdown 25 二级项(创作 5 / 策划 8 / 智能 6 / 更多 6)+ 「赵语AI」IP 账号切换器 + sally zhao chip + 登出 icon-only
> 4. /guide 全新建 · USER GUIDE + 13 模块详解卡 + FAQ 5 + /ip-plan 重写(9 step 卡片网格 + glass-card 进度条)
> **基线** · PRD-15 收官后 · 14 PRD 主开发 + 6 stub 工具完整化 + 2 衍生页(MyTopics + History)已沉淀
> **目标** · 让用户访问 QuanQn 主应用看到的**功能模块 + 操作流程 + 整体页面布局**跟 aiipznt 1:1 对齐(颜色除外)
> **预估** · 11 US · 1.5-2 周 wall time · 1 foundation + 4 high + 6 medium · 25-30 commits · 9-13h daemon time

---

## §0 引用清单(必读 · 启动 PRD-16 前)

### §0.1 上游文档(8 份核心)

| # | 文档 | 用途 | 重点章节 |
|:-:|---|---|---|
| 1 | [aiipznt-deep-dom-dump.md](../aiipznt-deep-dom-dump.md) | **32 page DOM 实测 + 6 spec 校准 + PRD-16~19 拆分建议**(以 dump 为准当冲突) | §1 跨 page 共享 / §2 32 page DOM / §3 spec 校准 / §4 PRD 拆分 / §6 红线 |
| 2 | [aiipznt-spec.md](../aiipznt-spec.md) | 9192 行复刻基线(设计稿 / SOP / 字段 / 推测) | §5 全局 UI(Header) · §6 首页 · §7 9 step · §8 14 工具 · §9 IP方案 · §12 dropdown / 移动端 · §13 设计系统 |
| 3 | [ARCHITECTURE.md](../ARCHITECTURE.md) | 主应用架构 + 14 工具 + 9 step 契约表 | §2.4 14 工具 · §3.5 9 step Schema · §6 UI/UX 设计系统 · §8 设计系统 |
| 4 | [AGENTS.md](../AGENTS.md) | 18 LD + 17 R 红线 + §11.6/11.7/11.8 沉淀 | §3 18 LD · §11.6 PRD-4 BaseSpecialist · §11.7 PRD-14 · §11.8 PRD-15 frontend-completeness 沉淀(StepForm + ls-namespace + DEV_OAUTH_MOCK + R-4 audit-friendly + URL params 协议锁) |
| 5 | [DATA-MODEL.md](../DATA-MODEL.md) | 主应用 18 表 + 56 行业 schema | §3 ip_account / cost_log / topic / copywriting · §4 industry table |
| 6 | [tasks/prd-3.md](prd-3.md) | P2 路由 + StepForm 抽象起源(PRD-3 US-005)| US-001~005 |
| 7 | [tasks/prd-15.md](prd-15.md) | PRD-15 6 stub 完整化 + 2 衍生页 + ls-namespace.ts(D4=B 不切金色但保留 helper) | US-001~009 |
| 8 | `~/.claude/playbooks/reject-examples.jsonl` | 46 条跨 PRD 反例库(注入 high/foundation US 的 anti_patterns) | 关键词检索 design-system / tailwind / font / dropdown / hero / oauth / SPA / lazy-render |

### §0.2 元数据

| 项 | 值 |
|---|---|
| **branchName** | `ralph/prd-16-aiipznt-alignment` |
| **Locked Decisions** | D-130 起延续(PRD-15 收尾在 D-129) |
| **风险分档** | foundation × 1(US-001 设计系统)+ high × 4(US-002/004/007/009)+ medium × 6 |
| **anti_patterns 注入** | foundation + 4 high US 必须从 reject-examples.jsonl 检索 ≤3 条注入 |
| **依赖前置 PRD** | PRD-3(StepForm) + PRD-15(ls-namespace + DEV_OAUTH_MOCK + IndustryDropdown + AccountSwitcher 复用) |
| **下游 PRD** | PRD-17(Step 1/3/3b 完整化)· PRD-18(Step 4-8 完整化)· PRD-19(8 stub 工具 + 4 modules + 视觉精修)|
| **Cookie 安全提醒** | 抓 aiipznt 用的 sally zhao cookies 已抓完 · 仅 Playwright 运行时使用 · `/tmp/aiipznt-clone-research/` 第三方产物不进 git |

### §0.3 复刻定调(D1=A · D2=A · D3=A · D4=B 锁)

| 维度 | 切 / 不切 |
|---|:-:|
| 整体页面布局(layout / 区块顺序 / 区块尺寸 / 容器宽度 / padding 方向) | ✅ **切 1:1 对齐 aiipznt** |
| spacing scale(gap-2 / gap-4 / mb-8 等) | ✅ **切**(参 dump §1.4 / §2 各 page) |
| 字体 family(Orbitron 大标题 / Rajdhani 副标 / Noto Sans SC 中文 / ui-sans-serif 正文)+ weight | ✅ **切** |
| motion(framer-motion / animate-ping / transition / hover) | ✅ **切**(animate-ping 用紫色变体) |
| SVG icons / lucide-react | ✅ **切**(已 95% 一致 · 仅补缺) |
| 卡片 hover 效果 + dropdown 浮层结构 + glass-card 模糊 | ✅ **切** |
| **颜色 token**(primary / accent / background / border / shadow / chart × 5) | ❌ **不切 · 保留 Aurelian Dark 紫色系** |
| OKLCH 金色 `#eebc4a` `border-gold/15` `shadow-gold/5` 等 | ❌ **替换为 `var(--primary)` `border-primary/15` `shadow-primary/5`** |

---

## §1 User Stories(11 US)

### US-001 ★ foundation · 设计系统切换 · 字体 / spacing / motion(颜色 D4=B 严锁)

**描述** · 作为开发者,我需要把 aiipznt 的字体 / spacing / motion 设计系统切到 QuanQn 主应用,以便后续 US-002~011 直接套用 1:1 layout · 但**严格保留** Aurelian Dark 紫色 token 不变(D4=B)· 所有 aiipznt 的 `var(--gold)` `border-gold/X` `shadow-gold/X` 等映射到 `var(--primary)` `border-primary/X` `shadow-primary/X`。

**Acceptance Criteria** ·

- [ ] **AC-1** · `apps/web/index.html` head 加 Google Fonts preconnect + 3 字体导入 link · 完整代码片段 ·
  ```html
  <!-- 在 <head> 内 · 在已有 <link rel="icon"...> 之后 -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@500;600;700&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
  ```
- [ ] **AC-2** · `apps/web/tailwind.config.ts` 的 `theme.extend.fontFamily` 加 4 个 family(替换现有 fontFamily 字段)·
  ```typescript
  fontFamily: {
    display: ['Orbitron', 'Rajdhani', 'Noto Sans SC', 'system-ui', 'sans-serif'],
    label: ['Rajdhani', 'Noto Sans SC', 'system-ui', 'sans-serif'],
    cn: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
    sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
  }
  ```
- [ ] **AC-3** · `apps/web/src/styles/tokens.css` 的颜色 token **完全不动**(D4=B 严锁)· `var(--primary)` `var(--background)` `var(--accent)` 等保留 Aurelian Dark 紫色 OKLCH 值
- [ ] **AC-4** · 新建 `apps/web/src/styles/aiipznt-motion.css` · 加 motion 动画 + glass-card utility ·
  ```css
  /* PRD-16 US-001 · aiipznt motion 动画 + glass-card · 颜色用 var(--primary) D4=B */

  @keyframes ping-primary {
    75%, 100% { transform: scale(2); opacity: 0; }
  }

  .animate-ping-primary {
    animation: ping-primary 1s cubic-bezier(0, 0, 0.2, 1) infinite;
  }

  /* glass-card · 玻璃卡片 · 用紫色阴影 + 模糊背景 */
  .glass-card {
    background: color-mix(in oklch, var(--card) 80%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid color-mix(in oklch, var(--primary) 15%, transparent);
    box-shadow: 0 8px 32px color-mix(in oklch, var(--primary) 5%, transparent);
  }

  /* data-grid-bg · 数据网格背景 · aiipznt 全 page 共用 */
  .data-grid-bg {
    background-image:
      linear-gradient(color-mix(in oklch, var(--primary) 3%, transparent) 1px, transparent 1px),
      linear-gradient(90deg, color-mix(in oklch, var(--primary) 3%, transparent) 1px, transparent 1px);
    background-size: 24px 24px;
    background-position: -1px -1px;
  }
  ```
- [ ] **AC-5** · `apps/web/src/main.tsx` 引入新 css · 在已有 `import './styles/global.css'` 之后加 `import './styles/aiipznt-motion.css';`(若 main.tsx 已有 css import 顺序 · 必须在 tokens.css / global.css 之后)
- [ ] **AC-6** · 启动 dev `cd apps/web && pnpm dev` · agent-browser 访问 `http://localhost:5173` · 在 console 跑 ·
  ```javascript
  const cs = getComputedStyle(document.documentElement);
  console.log('font-family:', cs.fontFamily);
  // 期望 · 含 Orbitron / Rajdhani / Noto Sans SC 之一(取决于 root 元素 className)
  console.log('--primary:', cs.getPropertyValue('--primary'));
  // 期望 · 仍是 Aurelian Dark 紫色 OKLCH 值(不变 · D4=B 锁)
  ```
- [ ] **AC-7** · agent-browser 访问 `http://localhost:5173/step/1` · 截图保存到 `screenshots/prd16-us001-step1-baseline.png` · 跟 PRD-15 已存的 `screenshots/validator-us-001-pass-ac9-1.png` 视觉对比 · **要求** · layout 完全一致 · 仅字体可能微变(无视觉 regression)
- [ ] **AC-8** · `pnpm typecheck` pass · `pnpm test` pass · `pnpm audit:redlines` pass(R-1~17 全过)· `pnpm audit:redlines-admin` pass(LD-A 11 + R-A 6 全过 · admin 不动 D3=A)
- [ ] **AC-9** · grep `var\(--gold` `border-gold` `shadow-gold` `text-gold` `bg-gold` 在 `apps/web/src/` 内 · **0 命中**(D4=B 严锁 · 不允许金色 token)· OR 仅在 css 注释 / TODO 中
- [ ] **AC-10** · 反例预防 · 不允许在 tailwind.config.ts 加 `gold` color · 不允许在 tokens.css 新增 `--gold` 系列变量 · 仅可加 `Orbitron` `Rajdhani` `Noto Sans SC` 字体 + 上述 motion css

**depends_on** · []
**priority** · 1
**risk_level** · **foundation**(downstream count = 10 个 · US-002~011 全依赖此 US 字体 + glass-card + motion + data-grid-bg utility)
**size_hint** · medium
**files_to_create** · `['apps/web/src/styles/aiipznt-motion.css']`
**files_to_modify** · `['apps/web/index.html', 'apps/web/tailwind.config.ts', 'apps/web/src/main.tsx']`
**test_command** · `cd apps/web && pnpm typecheck && pnpm test && pnpm audit:redlines`
**anti_patterns** · 注入 reject-examples.jsonl 关键词检索 ·
- 来源 · `tailwind-config / design-token / font / oklch / color`
- 必拦截 · 改 `--primary` token 颜色值 · 加 `--gold` 变量 · 在 tailwind config 加 `gold: '#eebc4a'` · `gold-dark` `gold-dim` `gold-light` 任一

---

### US-002 high · 首页 / Hero 区(H1 "AI+短视频+IP" + 副标 + 2 CTA)

**描述** · 作为用户,我访问 QuanQn 主应用根 URL `/` 时,应该看到完整的 aiipznt 风格首页 Hero 区(不再 redirect 到 `/step/1`),含 H1 "AI+短视频+IP"(Orbitron 巨大紫色 outline)+ 3 副标题 + 引用副标 + 主 CTA "启动智能分析" + 次 CTA "使用说明"。

**Acceptance Criteria** ·

- [ ] **AC-1** · `apps/web/src/router.tsx` 改 ·
  ```typescript
  // 旧 · { index: true, element: <Navigate to="/step/1" replace /> }
  // 新 ·
  { index: true, element: <Home /> }
  ```
  + import `Home` from `@/pages/Home`
- [ ] **AC-2** · 新建 `apps/web/src/pages/Home.tsx` · 含 Hero 区(其他区 US-003~006 加)· 完整代码片段 ·
  ```tsx
  import { Link } from 'react-router-dom';
  import { Button } from '@/components/ui/button';

  export default function Home() {
    return (
      <main className="flex-1 container mx-auto px-4 py-8 data-grid-bg min-h-screen">
        <HeroSection />
        {/* US-003 加 IpProgressSection · US-004 加 FunctionMatrixSection · US-005 加 WorkflowSection · US-006 加 ReadyToStartSection */}
      </main>
    );
  }

  function HeroSection() {
    return (
      <section className="text-center py-16">
        <h1 className="font-display text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-primary via-primary to-primary/60 mb-6 tracking-tight" style={{ WebkitTextStroke: '1px var(--primary)' }}>
          AI+短视频+IP
        </h1>
        <p className="font-cn text-lg text-muted-foreground mb-2">OPC全案落地，从流量到成交</p>
        <p className="font-cn text-lg text-muted-foreground mb-2">AI+短视频+IP</p>
        <p className="font-cn text-lg text-muted-foreground mb-6">全链路变现</p>
        <p className="font-cn italic text-sm text-muted-foreground/70 mb-8">"重新构造一个人是怎样不变形的"</p>
        <p className="font-label text-xs tracking-widest text-primary/60 mb-4">POWERED BY ADVANCED AI · FULL-CHAIN INTELLIGENT BUSINESS ACCELERATION</p>
        <div className="flex gap-4 justify-center">
          <Link to="/step/1">
            <Button className="font-cn bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 text-base">
              启动智能分析
            </Button>
          </Link>
          <Link to="/guide">
            <Button variant="outline" className="font-cn border-primary/30 text-primary hover:bg-primary/10 px-6 py-3 text-base">
              使用说明
            </Button>
          </Link>
        </div>
      </section>
    );
  }
  ```
- [ ] **AC-3** · 启动 dev · agent-browser 访问 `http://localhost:5173/` · 验证 ·
  - 不再 redirect 到 `/step/1`(URL 保持 `/`)
  - H1 "AI+短视频+IP" 巨大紫色 outline 字体 Orbitron · 视觉跟 `/tmp/aiipznt-clone-research/screenshots/00-home.png` 顶部 hero 区 layout 1:1 对齐
  - 3 副标题 + 引用副标 中文字体 Noto Sans SC
  - "POWERED BY ADVANCED AI..." 全大写 Rajdhani 字体 紫色细体
  - 2 CTA button · 主 CTA 紫色 gradient · 次 CTA 紫色 outline · click "启动智能分析" 跳 `/step/1` · click "使用说明" 跳 `/guide`(若 /guide 未实现 · US-009 加)
- [ ] **AC-4** · agent-browser 截图 `screenshots/prd16-us002-home-hero.png` · fullPage 1440 宽 · 跟 aiipznt 实测对比 layout 1:1
- [ ] **AC-5** · `pnpm typecheck` pass · `pnpm test` pass · `pnpm audit:redlines` pass
- [ ] **AC-6** · 反例预防 · 不允许 `bg-yellow` `bg-amber` `text-gold` 等金色 utility(D4=B)· 不允许 `style={{ color: '#eebc4a' }}` 硬编码金色 · 必须用 `var(--primary)` / `text-primary` / `bg-primary`

**depends_on** · `["US-001"]`
**priority** · 2
**risk_level** · **high**(downstream count = 4 · US-003/004/005/006 都加在 Home.tsx 同 page)
**size_hint** · medium
**files_to_create** · `['apps/web/src/pages/Home.tsx']`
**files_to_modify** · `['apps/web/src/router.tsx']`
**test_command** · `cd apps/web && pnpm typecheck && pnpm test`
**anti_patterns** · `hero / hardcoded-color / route-redirect / oklch-mismatch`

---

### US-003 high · 首页 "我的IP打造进度" 9 步进度区

**描述** · 作为用户,我看完首页 Hero 后,应该看到我的 IP 打造进度区(`<H2>我的IP打造进度</H2>` + 9 步进度条 + 9 步导航 button + 「继续」动态跳第一未完成 step + "查看IP方案 → /ip-plan")· 复用 PRD-3 US-005 已建的 `<StepProgress>` component · 包在 `glass-card` 容器内。

**Acceptance Criteria** ·

- [ ] **AC-1** · `apps/web/src/pages/Home.tsx` 加 `<IpProgressSection>` · 在 `<HeroSection>` 之后 ·
  ```tsx
  function IpProgressSection() {
    const { data: progress, isLoading } = trpc.stepData.progress.useQuery();
    const completed = progress?.completedSteps ?? [];
    const total = 9;
    const completedCount = completed.length;
    const percent = Math.round((completedCount / total) * 100);
    const nextStep = ['1', '3', '3b', '4', '4b', '5', '6', '7', '8'].find(s => !completed.includes(s));

    return (
      <section className="mb-16">
        <h2 className="font-display text-2xl font-bold text-foreground mb-4">我的IP打造进度</h2>
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-cn text-sm text-muted-foreground">已完成 <span className="font-bold text-primary">{completedCount}</span> / {total} 步</span>
            <span className="font-label text-sm text-primary font-bold">{percent}%</span>
          </div>
          <div className="w-full h-3 bg-muted/20 rounded-full overflow-hidden mb-6">
            <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all" style={{ width: `${percent}%` }} />
          </div>
          <StepProgress completedSteps={completed} isLoading={isLoading} />
          <div className="flex gap-3 mt-6">
            <Link to="/ip-plan">
              <Button variant="outline" className="font-cn border-primary/30 text-primary hover:bg-primary/10">查看IP方案</Button>
            </Link>
            {nextStep && (
              <Link to={`/step/${nextStep}`}>
                <Button className="font-cn bg-primary text-primary-foreground hover:bg-primary/90">继续</Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }
  ```
- [ ] **AC-2** · 复用 PRD-3 US-005 已建的 `<StepProgress>` component(`apps/web/src/components/StepProgress.tsx`)· 不重写 · 仅传 `completedSteps` `isLoading` props
- [ ] **AC-3** · 调 `trpc.stepData.progress.useQuery()` 获取真实进度(已有 router · 不新建)· `completedSteps` 数组含已完成的 step key(`['1', '3', '3b', ...]`)
- [ ] **AC-4** · "继续" button 动态跳第一未完成 step · 用 `['1', '3', '3b', '4', '4b', '5', '6', '7', '8'].find(s => !completed.includes(s))` 算 · 9 步全完成时 button 不渲染
- [ ] **AC-5** · agent-browser 访问 `/` · 滚到进度区 · 验证 ·
  - 进度条紫色 gradient(D4=B · 不是金色)· 宽度 = 已完成 / 9 × 100%
  - 9 步进度图标 + 状态(已完成 / 进行中 / 未开始)· 复用 StepProgress 现样
  - "查看IP方案" 跳 `/ip-plan` · "继续" 跳第一未完成 step
- [ ] **AC-6** · 截图 `screenshots/prd16-us003-home-ipprogress.png`
- [ ] **AC-7** · `pnpm typecheck` pass · `pnpm test` pass

**depends_on** · `["US-001", "US-002"]`
**priority** · 3
**risk_level** · medium
**size_hint** · small
**files_to_modify** · `['apps/web/src/pages/Home.tsx']`
**test_command** · `cd apps/web && pnpm typecheck && pnpm test`

---

### US-004 high+large · 首页 FUNCTION MATRIX 4 H3 分组 15 工具卡

**描述** · 作为用户,我看完进度区后,应该看到 `<H2>FUNCTION MATRIX</H2>`(Orbitron 大标题)· 下含 4 H3 分组 + 15 工具卡(市场洞察 3 + 变现设计 2 + 内容创作 5 + 智能工具 4 + footer 使用说明 1 = 15)· 每卡含 emoji + 工具名 + 一句话描述 + hover 紫色描边 + 跳转。

**Acceptance Criteria** ·

- [ ] **AC-1** · 新建 `apps/web/src/lib/constants/function-matrix.ts` · 15 卡数据(严格按 dump §2.1 实测)·
  ```typescript
  export interface FunctionCard {
    icon: string; // emoji or lucide name
    title: string;
    desc: string;
    href: string;
  }

  export interface FunctionGroup {
    title: string; // H3 文字
    cards: FunctionCard[];
  }

  export const FUNCTION_MATRIX: FunctionGroup[] = [
    {
      title: '市场洞察',
      cards: [
        { icon: '🔥', title: '全网爆款库', desc: '一键抓取全平台爆款视频和文案', href: '/trending' },
        { icon: '🔍', title: '爆款文案解析', desc: '粘贴文案，AI深度拆解爆款密码+一键仿写', href: '/video-analysis' },
        { icon: '🎨', title: '爆款呈现形式', desc: '14种爆款呈现形式全解析', href: '/present-styles' },
      ],
    },
    {
      title: '变现设计',
      cards: [
        { icon: '💰', title: 'IP变现模型', desc: '定制清晰的IP变现路径和收入结构', href: '/monetization' },
        { icon: '🤝', title: '私域成交流程', desc: '全链路话术覆盖六大成交阶段', href: '/private-domain' },
      ],
    },
    {
      title: '内容创作',
      cards: [
        { icon: '✨', title: '爆款元素生成', desc: 'AI自动生成多角度爆款文案', href: '/boom-generate' },
        { icon: '🤖', title: 'AI智能生成', desc: '基于方法论一键生成爆款文案', href: '/generate' },
        { icon: '📊', title: '文案结构分析', desc: '多维度分析评分精准优化', href: '/analysis' },
        { icon: '🎬', title: '短视频制作', desc: '文案转分镜脚本和拍摄方案', href: '/video-production' },
        { icon: '🎯', title: '获客型视频', desc: '精准获客短视频方案', href: '/acquisition-video' },
      ],
    },
    {
      title: '智能工具',
      cards: [
        { icon: '🎥', title: '一键生成视频', desc: '文案自动转视频分镜+AI生成', href: '/ai-video' },
        { icon: '🎙️', title: '语音对话', desc: '语音交互AI智能对话助手', href: '/voice-chat' },
        { icon: '📚', title: '深度学习', desc: '批量添加文案，AI深度分析风格逻辑', href: '/deep-learning' },
        { icon: '📖', title: '方法论知识库', desc: '系统学习全网爆款创作技巧', href: '/knowledge' },
      ],
    },
  ];

  export const FUNCTION_MATRIX_FOOTER: FunctionCard = {
    icon: '📘',
    title: '使用说明',
    desc: '完整产品操作手册',
    href: '/guide',
  };
  ```
- [ ] **AC-2** · `apps/web/src/pages/Home.tsx` 加 `<FunctionMatrixSection>` ·
  ```tsx
  import { FUNCTION_MATRIX, FUNCTION_MATRIX_FOOTER } from '@/lib/constants/function-matrix';

  function FunctionMatrixSection() {
    return (
      <section className="mb-16">
        <h2 className="font-display text-4xl font-black text-center text-primary tracking-widest mb-12">FUNCTION MATRIX</h2>
        {FUNCTION_MATRIX.map(group => (
          <div key={group.title} className="mb-10">
            <h3 className="font-display text-xl font-bold text-foreground mb-4 flex items-center">
              <span className="inline-block w-1 h-6 bg-primary mr-3 rounded" />
              {group.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {group.cards.map(card => (
                <Link key={card.href} to={card.href}>
                  <div className="glass-card rounded-xl p-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer h-full">
                    <div className="text-3xl mb-2">{card.icon}</div>
                    <h4 className="font-display text-base font-bold text-foreground mb-1">{card.title}</h4>
                    <p className="font-cn text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
        {/* Footer 使用说明卡(15) · 单独 1 张 · 居中 */}
        <div className="mt-10 max-w-md mx-auto">
          <Link to={FUNCTION_MATRIX_FOOTER.href}>
            <div className="glass-card rounded-xl p-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer text-center">
              <div className="text-3xl mb-2">{FUNCTION_MATRIX_FOOTER.icon}</div>
              <h4 className="font-display text-base font-bold text-foreground mb-1">{FUNCTION_MATRIX_FOOTER.title}</h4>
              <p className="font-cn text-xs text-muted-foreground">{FUNCTION_MATRIX_FOOTER.desc}</p>
            </div>
          </Link>
        </div>
      </section>
    );
  }
  ```
- [ ] **AC-3** · agent-browser 访问 `/` · 滚到 FUNCTION MATRIX · 验证 ·
  - H2 "FUNCTION MATRIX" 紫色 Orbitron 大标题居中
  - 4 H3 分组(市场洞察 / 变现设计 / 内容创作 / 智能工具)按顺序 · 每 H3 前有紫色短竖线
  - 14 卡 + 1 footer 卡 = 15 卡 · grid 响应式(mobile 1 列 / md 2 列 / lg 3 列 / xl 4 列)
  - 每卡 hover · 紫色描边变深 + 紫色 shadow + 微浮起
  - click 任意卡 · 跳对应 href(/trending / /video-analysis / ... / /guide)
- [ ] **AC-4** · 截图 `screenshots/prd16-us004-home-matrix.png` fullPage
- [ ] **AC-5** · 反例预防 · 15 卡的 href 必须严格跟 dump §2.1 实测对齐 · 不允许漂移(reject 反例 · `/trending` ≠ `/全网爆款库` · `/voice-chat` ≠ `/voice` 等)· 必须从 `function-matrix.ts` 常量引 · 不在 jsx 内硬编码
- [ ] **AC-6** · 反例预防 · grid layout 用 Tailwind responsive(`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`)· 不允许写 inline style 控制宽度
- [ ] **AC-7** · `pnpm typecheck` pass · `pnpm test` pass

**depends_on** · `["US-001", "US-002"]`
**priority** · 4
**risk_level** · **high+large**(15 卡 + 4 H3 + 复杂 grid · 是 PRD-16 最大 US · large 触发 §9.6 拆分检查)
**size_hint** · large
**files_to_create** · `['apps/web/src/lib/constants/function-matrix.ts']`
**files_to_modify** · `['apps/web/src/pages/Home.tsx']`
**test_command** · `cd apps/web && pnpm typecheck && pnpm test`
**anti_patterns** · `hardcoded-href / inline-grid-style / function-card-data-drift`

---

### US-005 medium · 首页 WORKFLOW 7 步流程图

**描述** · 作为用户,我看完 FUNCTION MATRIX 后,应该看到 `<H2>WORKFLOW</H2>`(Orbitron 大标题)+ 7 步系统化流程图(选行业→变现设计→学爆款→生成文案→制作视频→私域转化)· 横排 7 步 · 每步圆形数字标 + step 名 + 描述 + 中间连接线。

**Acceptance Criteria** ·

- [ ] **AC-1** · 新建 `apps/web/src/lib/constants/workflow.ts` · 7 步数据 ·
  ```typescript
  export interface WorkflowStep {
    num: string; // '01' '02' ...
    title: string;
    desc: string;
  }

  export const WORKFLOW_STEPS: WorkflowStep[] = [
    { num: '01', title: '选择行业', desc: '56 行业精准匹配' },
    { num: '02', title: '账号包装', desc: 'AI 生成完整方案' },
    { num: '03', title: '变现设计', desc: '三阶梯路径规划' },
    { num: '04', title: '学爆款', desc: '全网爆款实时追踪' },
    { num: '05', title: '生成文案', desc: '22 元素一键创作' },
    { num: '06', title: '制作视频', desc: '分镜表自动生成' },
    { num: '07', title: '私域转化', desc: '六大阶段话术覆盖' },
  ];
  ```
- [ ] **AC-2** · `apps/web/src/pages/Home.tsx` 加 `<WorkflowSection>` ·
  ```tsx
  import { WORKFLOW_STEPS } from '@/lib/constants/workflow';

  function WorkflowSection() {
    return (
      <section className="mb-16 py-10">
        <h2 className="font-display text-4xl font-black text-center text-primary tracking-widest mb-4">WORKFLOW</h2>
        <p className="font-cn text-center text-sm text-muted-foreground mb-12">规范流程加上一站式短视频创作系统</p>
        <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 md:gap-2">
          {WORKFLOW_STEPS.map((step, i) => (
            <>
              <div key={step.num} className="flex-1 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/40 flex items-center justify-center mb-3">
                  <span className="font-display text-xl font-bold text-primary">{step.num}</span>
                </div>
                <h4 className="font-cn font-bold text-sm text-foreground mb-1">{step.title}</h4>
                <p className="font-cn text-xs text-muted-foreground">{step.desc}</p>
              </div>
              {i < WORKFLOW_STEPS.length - 1 && (
                <div className="hidden md:flex items-center self-center w-8">
                  <div className="w-full h-px bg-primary/20" />
                </div>
              )}
            </>
          ))}
        </div>
      </section>
    );
  }
  ```
- [ ] **AC-3** · agent-browser 访问 `/` · 滚到 WORKFLOW · 验证 ·
  - H2 "WORKFLOW" 紫色 Orbitron 大标题居中
  - 7 步 desktop 横排(md+ 显示 flex-row · mobile flex-col)
  - 每步圆形紫色 outline + 数字 01-07
  - 中间连接线(md+ 仅显示 · mobile 隐藏)
- [ ] **AC-4** · 截图 `screenshots/prd16-us005-home-workflow.png`
- [ ] **AC-5** · `pnpm typecheck` pass · `pnpm test` pass

**depends_on** · `["US-001", "US-002"]`
**priority** · 5
**risk_level** · medium
**size_hint** · small
**files_to_create** · `['apps/web/src/lib/constants/workflow.ts']`
**files_to_modify** · `['apps/web/src/pages/Home.tsx']`
**test_command** · `cd apps/web && pnpm typecheck && pnpm test`

---

### US-006 medium · 首页 "READY TO START?" CTA 区

**描述** · 作为用户,首页最后应该看到 `<H2>READY TO START?</H2>`(Orbitron 大标题)+ 一句鼓励语 + 主 CTA "立即启动"(跳 /step/1)。

**Acceptance Criteria** ·

- [ ] **AC-1** · `apps/web/src/pages/Home.tsx` 加 `<ReadyToStartSection>` ·
  ```tsx
  function ReadyToStartSection() {
    return (
      <section className="text-center py-16 mb-8">
        <h2 className="font-display text-4xl md:text-5xl font-black text-primary tracking-widest mb-4">READY TO START?</h2>
        <p className="font-cn text-lg text-muted-foreground mb-8">是时候开始了，IP 打造在等你</p>
        <Link to="/step/1">
          <Button className="font-cn bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-4 text-lg">
            立即启动 →
          </Button>
        </Link>
      </section>
    );
  }
  ```
- [ ] **AC-2** · agent-browser 访问 `/` · 滚到底 · 验证 H2 + 鼓励语 + 主 CTA · click "立即启动" 跳 `/step/1`
- [ ] **AC-3** · 截图 `screenshots/prd16-us006-home-cta.png`
- [ ] **AC-4** · `pnpm typecheck` pass · `pnpm test` pass

**depends_on** · `["US-001", "US-002"]`
**priority** · 6
**risk_level** · medium
**size_hint** · small
**files_to_modify** · `['apps/web/src/pages/Home.tsx']`
**test_command** · `cd apps/web && pnpm typecheck && pnpm test`

---

### US-007 ★ high · Header 重构 · 4 一级菜单 click dropdown(创作 5 / 策划 8 / 智能 6 / 更多 6 共 25 二级项)

**描述** · 作为用户,Header 中央应该看到 4 一级菜单(创作 / 策划 / 智能 / 更多)· 每个 click 触发(非 hover)弹 dropdown · 内含二级菜单跳转。当前 QuanQn Header 只有 1 个 "工具" dropdown(14 工具)+ 6 模块 list · 必须重构为 4 一级菜单严格按 dump §1.2 实测映射。

**Acceptance Criteria** ·

- [ ] **AC-1** · 新建 `apps/web/src/lib/constants/header-nav.ts` · 4 一级 + 25 二级数据 ·
  ```typescript
  export interface HeaderNavItem {
    label: string;
    href: string;
  }

  export interface HeaderNavGroup {
    label: string; // 一级菜单文字
    items: HeaderNavItem[];
  }

  export const HEADER_NAV: HeaderNavGroup[] = [
    {
      label: '创作',
      items: [
        { label: '爆款选题', href: '/step/5' },
        { label: '文案生成', href: '/step/7' },
        { label: '文案解析', href: '/video-analysis' },
        { label: '获客视频', href: '/acquisition-video' },
        { label: '呈现形式', href: '/present-styles' },
      ],
    },
    {
      label: '策划',
      items: [
        { label: '选择行业', href: '/step/1' },
        { label: '账号包装', href: '/step/3' },
        { label: '人设定制', href: '/step/3b' },
        { label: '执行计划', href: '/step/4' },
        { label: '变现路径', href: '/step/4b' },
        { label: '拍摄计划', href: '/step/6' },
        { label: '直播策划', href: '/step/8' },
        { label: '私域成交', href: '/private-domain' },
      ],
    },
    {
      label: '智能',
      items: [
        { label: 'IP诊断', href: '/diagnosis' },
        { label: '每日任务', href: '/daily-tasks' },
        { label: 'AI视频', href: '/ai-video' },
        { label: '语音对话', href: '/voice-chat' },
        { label: '深度学习', href: '/deep-learning' },
        { label: '进化仪表盘', href: '/evolution' },
      ],
    },
    {
      label: '更多',
      items: [
        { label: '账号管理', href: '/accounts' },
        { label: '方法论', href: '/knowledge' },
        { label: '使用说明', href: '/guide' },
        { label: '我的IP方案', href: '/ip-plan' },
        { label: '我的选题库', href: '/my-topics' },
        { label: '历史记录', href: '/history' },
      ],
    },
  ];
  ```
- [ ] **AC-2** · 重构 `apps/web/src/components/Header.tsx` · 删 `TOOLS_14` `NEW_MODULES_6` 数组 + 删 `<ToolsDropdown>` 函数 · 替换为 4 一级菜单 dropdown · 完整 jsx ·
  ```tsx
  function HeaderNav() {
    return (
      <nav className="hidden lg:flex items-center gap-1">
        {HEADER_NAV.map(group => (
          <DropdownMenu key={group.label}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="font-cn gap-1.5 h-8 px-3 text-foreground hover:text-primary hover:bg-primary/5"
                data-testid={`header-nav-${group.label}`}
              >
                <span className="text-sm font-medium">{group.label}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="min-w-[180px] rounded-xl border border-primary/15 bg-popover/95 backdrop-blur-xl shadow-lg shadow-primary/5 mt-1"
              data-testid={`header-nav-${group.label}-dropdown`}
            >
              {group.items.map(item => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link to={item.href} className="font-cn text-sm cursor-pointer">{item.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </nav>
    );
  }
  ```
  在 Header 主 jsx 内 · 替换原 `<ToolsDropdown />` 位置为 `<HeaderNav />`
- [ ] **AC-3** · MobileNav(`<Sheet>` 内)同步重构 · 删 14 工具 list + 6 新模块 list · 替换为 4 大类分组(每 group 用 `<p className="font-label uppercase tracking-wider">` 大类标题 + `items.map` 二级项 list) · 严格按 dump §1.5 实测 layout
- [ ] **AC-4** · agent-browser 访问 `/` · 验证 ·
  - Header 中央显示 "创作 ▾  策划 ▾  智能 ▾  更多 ▾" 4 一级菜单
  - click "创作" · 弹 dropdown 含 5 项(爆款选题 / 文案生成 / 文案解析 / 获客视频 / 呈现形式)· 紫色边框 + 模糊背景
  - click "策划" · 弹 8 项 dropdown
  - click "智能" · 弹 6 项 dropdown
  - click "更多" · 弹 6 项 dropdown
  - click 任意 dropdown 内 item · 跳对应 href · dropdown 自动收起
- [ ] **AC-5** · 移动端(viewport < 1024px)· 点 hamburger button 弹 sheet · 显示 4 大类分组 + 25 二级项
- [ ] **AC-6** · 截图 4 张 dropdown 展开状态 + 移动端 sheet · `screenshots/prd16-us007-header-{创作,策划,智能,更多,mobile}.png`
- [ ] **AC-7** · `pnpm typecheck` pass · `pnpm test` pass · `pnpm audit:redlines` pass
- [ ] **AC-8** · 反例预防 · header-nav.ts 25 二级项的 href 必须严格跟 dump §1.2 对齐 · 任一漂移触发 reject(`/voice-chat` ≠ `/voice` · `/ip-plan` ≠ `/my-ip-plan` 等)
- [ ] **AC-9** · 反例预防 · 不允许保留旧 TOOLS_14 / NEW_MODULES_6 数组(避免代码遗留)· grep `TOOLS_14` `NEW_MODULES_6` 在 apps/web/src/ 0 命中

**depends_on** · `["US-001"]`
**priority** · 7
**risk_level** · **high**(Header 是全局组件 · 影响 32 page · 改动 blast radius 大)
**size_hint** · medium
**files_to_create** · `['apps/web/src/lib/constants/header-nav.ts']`
**files_to_modify** · `['apps/web/src/components/Header.tsx']`
**test_command** · `cd apps/web && pnpm typecheck && pnpm test && pnpm audit:redlines`
**anti_patterns** · `header-href-drift / hover-trigger-instead-of-click / dropdown-style-mismatch / leftover-old-arrays`

---

### US-008 medium · 「赵语AI」IP 账号切换器 + sally zhao chip + 登出 icon-only

**描述** · 作为用户,Header 右侧应该看到 ·
1. 「赵语AI ▾」按钮(显示当前活跃 IP 账号名 · click 弹账号 dropdown)· 紫色描边 + 紫色 hover
2. 「sally zhao」chip(纯展示 div · 不可点 · 左边 animate-ping 紫色跳动小圆点)
3. 登出 icon-only button(`<LogOut>` 图标 · click 直接登出 · 无确认)

复用 PRD-15 已建的 `<AccountSwitcher>` component(`apps/web/src/components/AccountSwitcher.tsx`)· 改样式适配 · 不重写。

**Acceptance Criteria** ·

- [ ] **AC-1** · 改 `apps/web/src/components/AccountSwitcher.tsx` 样式 · button 加 `rounded-lg text-xs bg-secondary/50 border border-primary/15 hover:border-primary/30 px-2.5 py-1.5` · dropdown 浮层加 `rounded-xl border border-primary/15 bg-popover/95 backdrop-blur-xl shadow-lg shadow-primary/5`
- [ ] **AC-2** · `apps/web/src/components/Header.tsx` 右侧区域 · 替换原 UserDropdown(头像 + 用户菜单) · 改为 ·
  ```tsx
  function HeaderRight() {
    const { user, logout } = useAuth();
    if (!user) {
      return <LoginButton />;
    }
    return (
      <div className="flex items-center gap-3">
        <AccountSwitcher /> {/* PRD-15 已建 · US-008 改样式 */}
        <UserChip name={user.name} />
        <Button variant="ghost" size="icon" onClick={logout} aria-label="退出登录" data-testid="header-logout-icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  function UserChip({ name }: { name: string }) {
    return (
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping-primary absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
        <span className="font-cn text-sm font-medium text-foreground">{name}</span>
      </div>
    );
  }
  ```
- [ ] **AC-3** · agent-browser 访问 `/` · 验证 Header 右侧 ·
  - 「赵语AI ▾」按钮(紫色描边 · 显示当前账号名 · click 弹 IP 账号 dropdown · 内含其他账号 + "管理账号 → /accounts")
  - 「sally zhao」chip(紫色背景 · 跳动紫色圆点 in 在线状态)
  - 登出 icon-only(click 直接调 logout · 无确认 modal)
- [ ] **AC-4** · 截图 `screenshots/prd16-us008-header-right.png`(注意 dropdown 展开 + chip + icon 同框)
- [ ] **AC-5** · `pnpm typecheck` pass · `pnpm test` pass
- [ ] **AC-6** · 反例预防 · 不允许 chip 加 onclick / hover effect(纯展示)· 不允许登出 button 弹确认 modal(实测 aiipznt 是直接登出)

**depends_on** · `["US-001", "US-007"]`
**priority** · 8
**risk_level** · medium
**size_hint** · small
**files_to_modify** · `['apps/web/src/components/Header.tsx', 'apps/web/src/components/AccountSwitcher.tsx']`
**test_command** · `cd apps/web && pnpm typecheck && pnpm test`

---

### US-009 ★ high · /guide page 全新建 · USER GUIDE + 5 步推荐流程 + 13 模块详解卡 + FAQ 5

**描述** · 作为用户,我点 Header "更多→使用说明" 或首页 "使用说明" CTA 跳到 `/guide` · 应该看到完整 USER GUIDE page · 含 5 步推荐流程图 + 系统概览 3 卡 + 13 模块详解卡(可点击展开) + FAQ 5 问 5 答 + 顶部 search input。

**Acceptance Criteria** ·

- [ ] **AC-1** · `apps/web/src/router.tsx` 加路由 ·
  ```tsx
  { path: 'guide', element: <Guide /> },
  ```
  + import `Guide` from `@/pages/Guide`
- [ ] **AC-2** · 新建 `apps/web/src/pages/Guide.tsx` · 完整骨架 ·
  ```tsx
  import { useState } from 'react';
  import { GUIDE_MODULES, FAQS } from '@/lib/constants/guide';

  export default function Guide() {
    const [search, setSearch] = useState('');
    const filteredModules = search ? GUIDE_MODULES.filter(m => m.title.includes(search) || m.desc.includes(search)) : GUIDE_MODULES;

    return (
      <main className="flex-1 container mx-auto px-4 py-8 data-grid-bg min-h-screen">
        <header className="text-center mb-12">
          <h1 className="font-display text-5xl font-black text-primary tracking-widest mb-4">USER GUIDE</h1>
          <p className="font-cn text-base text-muted-foreground">产品使用说明 · 功能详解 · 最佳实践</p>
        </header>

        <SearchBox value={search} onChange={setSearch} />
        <RecommendedFlow />
        <SystemOverview />
        <ModuleCards modules={filteredModules} />
        <FAQSection />
      </main>
    );
  }

  function SearchBox({ value, onChange }) {
    return (
      <div className="max-w-md mx-auto mb-12">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="搜索功能说明..."
          className="font-cn w-full px-4 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
        />
      </div>
    );
  }

  function RecommendedFlow() {
    const flow = ['深度学习', '设计变现', '创作内容', '制作视频', '私域成交'];
    return (
      <section className="mb-12">
        <h2 className="font-display text-2xl font-bold text-foreground mb-6 text-center">推荐使用流程</h2>
        <div className="flex flex-col md:flex-row items-stretch justify-center gap-2 md:gap-0">
          {flow.map((step, i) => (
            <>
              <div key={step} className="glass-card rounded-xl px-4 py-3 text-center min-w-[120px]">
                <p className="font-cn text-sm font-bold text-primary">{step}</p>
              </div>
              {i < flow.length - 1 && (
                <div className="hidden md:flex items-center self-center mx-2"><span className="text-primary">→</span></div>
              )}
            </>
          ))}
        </div>
      </section>
    );
  }

  function SystemOverview() {
    const overview = [
      { title: '什么是AIP智能体？', desc: 'AI工具简介 · 集成全网爆款分析 + AI 内容创作 + 私域成交全链路' },
      { title: '核心定位', desc: '从行业洞察 → 内容创作 → 流量变现' },
      { title: '使用前准备', desc: '登录账号 / 选行业 / 选功能模块' },
    ];
    return (
      <section className="mb-12">
        <h2 className="font-display text-2xl font-bold text-foreground mb-6 text-center">系统概览</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {overview.map(item => (
            <div key={item.title} className="glass-card rounded-xl p-5">
              <h4 className="font-display text-base font-bold text-primary mb-2">{item.title}</h4>
              <p className="font-cn text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 max-w-2xl mx-auto p-4 rounded-lg bg-primary/5 border border-primary/15">
          <p className="font-cn text-sm text-foreground">💡 实用技巧 · 建议先完成行业选择,这样 AI 会根据你的行业提供更精准的建议。所有 AI 生成的内容都可以复制和导出。</p>
        </div>
      </section>
    );
  }

  function ModuleCards({ modules }) {
    return (
      <section className="mb-12">
        <h2 className="font-display text-2xl font-bold text-foreground mb-6 text-center">13 个功能模块详解</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map(m => <ModuleCard key={m.title} {...m} />)}
        </div>
      </section>
    );
  }

  function ModuleCard({ icon, title, desc, steps }) {
    const [expanded, setExpanded] = useState(false);
    return (
      <div className="glass-card rounded-xl p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{icon}</span>
          <h4 className="font-display text-base font-bold text-foreground">{title}</h4>
        </div>
        <p className="font-cn text-xs text-muted-foreground mb-2">{desc}</p>
        {expanded && steps && (
          <ol className="font-cn text-xs text-foreground/80 list-decimal list-inside space-y-1 mt-3 pl-2">
            {steps.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        )}
      </div>
    );
  }

  function FAQSection() {
    return (
      <section className="mb-8">
        <h2 className="font-display text-2xl font-bold text-foreground mb-6 text-center">常见问题(FAQ)</h2>
        <div className="space-y-3 max-w-3xl mx-auto">
          {FAQS.map(faq => <FAQItem key={faq.q} {...faq} />)}
        </div>
      </section>
    );
  }

  function FAQItem({ q, a }) {
    const [open, setOpen] = useState(false);
    return (
      <div className="glass-card rounded-xl p-4 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center justify-between">
          <p className="font-cn text-sm font-medium text-foreground">Q · {q}</p>
          <span className="text-primary">{open ? '−' : '+'}</span>
        </div>
        {open && <p className="font-cn text-sm text-muted-foreground mt-3 pl-3 border-l-2 border-primary/30">A · {a}</p>}
      </div>
    );
  }
  ```
- [ ] **AC-3** · 新建 `apps/web/src/lib/constants/guide.ts` · 13 模块 + 5 FAQ 数据(严格按 dump §2.1 + spec §9.1 实测)·
  ```typescript
  export interface GuideModule {
    icon: string;
    title: string;
    desc: string;
    steps?: string[]; // 可选 · 展开后显示
  }

  export const GUIDE_MODULES: GuideModule[] = [
    { icon: '🔥', title: '爆款库', desc: '全网爆款内容实时追踪', steps: ['1. 进入 /trending', '2. 选行业 + 平台筛选', '3. 浏览爆款卡 + 点击查看详情'] },
    { icon: '🔍', title: '爆款解析', desc: '拆解爆款视频的成功密码', steps: ['1. 进入 /video-analysis', '2. 粘贴文案(≥10 字)', '3. 一键 AI 拆解 + 仿写'] },
    { icon: '🎨', title: '呈现形式', desc: '多样化的内容呈现方式', steps: ['1. 进入 /present-styles', '2. 浏览 14 种呈现形式', '3. 点击查看示例'] },
    { icon: '💰', title: '变现模型', desc: '定制你的 IP 变现策略', steps: ['1. 进入 /monetization', '2. 输入产品 + 受众 + 人设', '3. 一键生成 IP 变现模型'] },
    { icon: '🤝', title: '私域成交', desc: '打造高转化的私域成交体系', steps: ['1. 进入 /private-domain', '2. 输入产品 + 受众 + 现状', '3. 6 阶段 SSE 流式生成话术'] },
    { icon: '✨', title: '爆款生成', desc: '融合爆款元素一键生成文案', steps: ['1. 进入 /boom-generate', '2. 选行业 + 22 元素多选', '3. 一键生成多角度文案'] },
    { icon: '🤖', title: '生成文案', desc: 'AI 智能文案创作与优化', steps: ['1. 进入 /generate', '2. 输入主题或关键词', '3. 选脚本类型 + 一键生成'] },
    { icon: '📊', title: '文案分析', desc: 'AI 分析文案结构和优化建议', steps: ['1. 进入 /analysis', '2. 粘贴文案(≥10 字)', '3. 多维度评分 + 优化建议'] },
    { icon: '🎥', title: 'AI 视频', desc: '文案一键转视频分镜', steps: ['1. 进入 /ai-video', '2. 粘贴文案', '3. AI 自动生成专业分镜表'] },
    { icon: '🎙️', title: '语音对话', desc: 'AI 语音智能助手', steps: ['1. 进入 /voice-chat', '2. 输入或语音问题', '3. 多轮对话 + 5 tools'] },
    { icon: '📚', title: '深度学习', desc: '批量添加文案,AI 深度分析风格逻辑', steps: ['1. 进入 /deep-learning', '2. 创建学习档案', '3. 粘贴文案 → AI 学习风格'] },
    { icon: '🎬', title: '视频制作', desc: 'AI 辅助视频脚本制作', steps: ['1. 进入 /video-production', '2. 粘贴文案', '3. 生成完整制作方案'] },
    { icon: '🎯', title: '获客视频', desc: '制作高转化获客视频方案', steps: ['1. 进入 /acquisition-video', '2. 输入客户画像 + 核心卖点', '3. AI 生成获客视频脚本'] },
  ];

  export const FAQS = [
    { q: 'AI 生成的内容可以直接使用吗？', a: 'AI 生成的内容是高质量的初稿,建议根据你的实际情况和个人风格进行适当调整后使用。' },
    { q: '语音对话支持哪些语言？', a: '目前主要支持中文语音识别和对话,AI 回答也以中文为主。' },
    { q: 'AI 视频功能可以直接生成视频吗？', a: '目前 AI 视频功能会生成详细的分镜脚本和场景图片,你可以根据这些素材在剪辑软件中快速制作视频。' },
    { q: '如何让 AI 更了解我的风格？', a: '使用「智能进化」功能(/evolution),上传你的代表作品,AI 会学习你的写作风格,后续生成的内容会更贴合你的特点。' },
    { q: '数据会被保存吗？', a: '你的所有生成记录都会保存在「历史记录」(/history)中,可以随时查看和复用。' },
  ];
  ```
- [ ] **AC-4** · agent-browser 访问 `/guide` · 验证 ·
  - H1 "USER GUIDE" 紫色 Orbitron 大标题
  - search input(可输入过滤 13 模块)
  - 5 步推荐流程图(横排卡片 + 紫色箭头连接)
  - 系统概览 3 H4 卡 + 实用技巧提示框(紫色背景)
  - 13 模块详解卡 grid(每卡 emoji + title + desc + click 展开 steps)
  - FAQ 5 项 accordion(click 展开 a)
- [ ] **AC-5** · 截图 `screenshots/prd16-us009-guide-{full,module-expand,faq-expand}.png` 3 张
- [ ] **AC-6** · `pnpm typecheck` pass · `pnpm test` pass
- [ ] **AC-7** · 反例预防 · 13 模块的 href 必须严格跟 dump §2.3 对齐 · 不允许漂移

**depends_on** · `["US-001", "US-007"]`
**priority** · 9
**risk_level** · **high**(全新 page · 13 模块卡 + FAQ accordion + filter · 完整闭环)
**size_hint** · large
**files_to_create** · `['apps/web/src/pages/Guide.tsx', 'apps/web/src/lib/constants/guide.ts']`
**files_to_modify** · `['apps/web/src/router.tsx']`
**test_command** · `cd apps/web && pnpm typecheck && pnpm test`
**anti_patterns** · `module-href-drift / guide-data-incomplete / accordion-state-bug`

---

### US-010 medium · /ip-plan page 重写 · `[← 返回首页]` + H1 + 进度条 + 9 step 卡片网格

**描述** · 作为用户,我访问 `/ip-plan` 应该看到完整的 IP 方案 page · 含 `[← 返回首页]` button + H1 "我的IP方案" + `已完成 N / 9 步` + `[↻ 刷新]` button + glass-card 进度条 + 9 step 卡片网格(每卡 emoji + step 名 + 状态 + `[查看详情 → /step/X]`)。当前 QuanQn IpPlan 只有 `<StepProgress>` + skeleton · 必须重写。

**Acceptance Criteria** ·

- [ ] **AC-1** · 改 `apps/web/src/pages/IpPlan.tsx` · 完整重写 ·
  ```tsx
  import { Link } from 'react-router-dom';
  import { ArrowLeft, RefreshCw, FileText } from 'lucide-react';
  import { Button } from '@/components/ui/button';
  import { trpc } from '@/lib/trpc';

  const STEP_CARDS = [
    { key: '1', emoji: '🎯', title: '行业选择', href: '/step/1' },
    { key: '3', emoji: '📦', title: '账号包装', href: '/step/3' },
    { key: '3b', emoji: '👤', title: '人设定制', href: '/step/3b' },
    { key: '4', emoji: '📋', title: '执行计划', href: '/step/4' },
    { key: '4b', emoji: '💰', title: '变现路径', href: '/step/4b' },
    { key: '5', emoji: '🔥', title: '爆款选题', href: '/step/5' },
    { key: '6', emoji: '🎬', title: '拍摄计划', href: '/step/6' },
    { key: '7', emoji: '✏️', title: '文案生成', href: '/step/7' },
    { key: '8', emoji: '🎙️', title: '直播策划', href: '/step/8' },
  ];

  export default function IpPlan() {
    const { data: progress, isLoading, refetch } = trpc.stepData.progress.useQuery(undefined, { retry: 1 });
    const completed = progress?.completedSteps ?? [];
    const completedCount = completed.length;
    const percent = Math.round((completedCount / 9) * 100);

    return (
      <main className="flex-1 container mx-auto px-4 py-8 data-grid-bg min-h-screen" data-testid="ip-plan-page">
        {/* 顶部 · 返回首页 + H1 + 副标 + 刷新 */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="font-cn h-8 mb-4 text-muted-foreground hover:text-foreground gap-1.5 px-3">
              <ArrowLeft className="h-4 w-4 mr-1" /> 返回首页
            </Button>
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground flex items-center">
                <FileText className="inline h-7 w-7 mr-2 text-primary" />
                我的IP方案
              </h1>
              <p className="font-cn text-muted-foreground mt-1">
                已完成 <span className="text-primary font-bold">{completedCount}</span> / 9 步
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="font-cn border-primary/30 text-primary hover:bg-primary/10">
              <RefreshCw className="h-4 w-4 mr-1" /> 刷新
            </Button>
          </div>
        </div>

        {/* 进度卡 · glass-card */}
        <div className="mb-8 glass-card rounded-xl p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-cn text-muted-foreground">IP打造进度</span>
            <span className="font-label text-primary font-bold">{percent}%</span>
          </div>
          <div className="w-full h-3 bg-muted/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>

        {/* 9 step 卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STEP_CARDS.map(card => {
            const isDone = completed.includes(card.key);
            return (
              <div key={card.key} className={`glass-card rounded-xl p-5 ${isDone ? 'border-primary/40' : 'border-muted/30'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{card.emoji}</span>
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground">{card.title}</h3>
                    <p className="font-cn text-xs text-muted-foreground">{isDone ? '已完成' : '未完成'}</p>
                  </div>
                </div>
                {isDone && <p className="font-cn text-xs text-primary mb-3">✓ 数据已保存</p>}
                <Link to={card.href}>
                  <Button variant="outline" size="sm" className="font-cn w-full border-primary/30 text-primary hover:bg-primary/10">
                    查看详情
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </main>
    );
  }
  ```
- [ ] **AC-2** · agent-browser 访问 `/ip-plan` · 验证 ·
  - 顶部 `[← 返回首页]` 灰色 button + H1 "我的IP方案" 紫色 Orbitron + `[↻ 刷新]` 紫色 outline
  - glass-card 进度条 紫色 gradient · 宽度 = 已完成 / 9 × 100%
  - 9 step 卡片网格(已完成卡 紫色边 + ✓ 数据已保存 hint)
  - click "查看详情" 跳对应 /step/X
  - click "返回首页" 跳 /
  - click "刷新" 重新查询 trpc.stepData.progress
- [ ] **AC-3** · 截图 `screenshots/prd16-us010-ip-plan.png` fullPage
- [ ] **AC-4** · `pnpm typecheck` pass · `pnpm test` pass
- [ ] **AC-5** · 反例预防 · 9 step 卡的 key 必须是 `['1','3','3b','4','4b','5','6','7','8']`(跳 step2)· 不允许 `['1','2','3',...]`

**depends_on** · `["US-001", "US-003"]`
**priority** · 10
**risk_level** · medium
**size_hint** · medium
**files_to_modify** · `['apps/web/src/pages/IpPlan.tsx']`
**test_command** · `cd apps/web && pnpm typecheck && pnpm test`

---

### US-011 收官 · verify-prd-16.sh + 4 e2e flows + visual diff

**描述** · 作为开发者,需要 1 个收官 US 把 PRD-16 整体验证 · 含 verify script + 4 e2e flows(home / guide / ip-plan / header-dropdown)+ visual diff with `/tmp/aiipznt-clone-research/screenshots/` 截图。

**Acceptance Criteria** ·

- [ ] **AC-1** · 新建 `scripts/verify-prd-16.sh` · 9 sections 类似 PRD-15 verify · 含 ·
  - section 1 · 字体 link 在 index.html(grep `Orbitron|Rajdhani|Noto Sans SC`)
  - section 2 · tailwind.config 含 `display` `label` `cn` font family
  - section 3 · `aiipznt-motion.css` 存在且引入 main.tsx
  - section 4 · grep `--gold` `border-gold` `bg-gold` `text-gold` 在 apps/web/src/ 0 命中(D4=B 严锁)
  - section 5 · `Home.tsx` 存在 + 含 `HeroSection` `IpProgressSection` `FunctionMatrixSection` `WorkflowSection` `ReadyToStartSection`
  - section 6 · `Header.tsx` 含 `HeaderNav` + `HEADER_NAV` import + 不含 `TOOLS_14` `NEW_MODULES_6`(旧数组已删)
  - section 7 · `Guide.tsx` 存在 + `GUIDE_MODULES` 长度 = 13 + `FAQS` 长度 = 5
  - section 8 · `IpPlan.tsx` 含 `STEP_CARDS` 长度 = 9 + 9 个 key 严格 `['1','3','3b','4','4b','5','6','7','8']`
  - section 9 · `pnpm typecheck && pnpm test && pnpm audit:redlines` 全 pass
- [ ] **AC-2** · 新建 4 e2e tests 在 `tests/e2e/prd16-*.test.ts` ·
  - `prd16-home-flow.test.ts` · 访问 / · 验证 H1 + 4 区 + 7 button click 跳转
  - `prd16-guide-flow.test.ts` · 访问 /guide · 验证 13 模块卡 + filter + FAQ accordion + 5 推荐流程
  - `prd16-ip-plan-flow.test.ts` · 访问 /ip-plan · 验证返回首页 + 进度条 + 9 step 卡
  - `prd16-header-dropdown-flow.test.ts` · 验证 4 一级菜单 click 触发 25 二级跳转 + 移动端 sheet
- [ ] **AC-3** · 跑 verify script · 9 sections ALL PASS · 0 FAIL
- [ ] **AC-4** · 跑 4 e2e · 全 PASS
- [ ] **AC-5** · agent-browser visual diff · 用 Playwright 对比 ·
  - `screenshots/prd16-us002-home-hero.png` vs `/tmp/aiipznt-clone-research/screenshots/00-home.png`(top 1/3 区域 · layout 1:1 对齐 · 颜色除外)
  - `screenshots/prd16-us010-ip-plan.png` vs `/tmp/aiipznt-clone-research/screenshots/02-ip-plan.png`(layout 1:1 对齐 · 颜色除外)
  - `screenshots/prd16-us009-guide-full.png` vs `/tmp/aiipznt-clone-research/screenshots/01-guide.png`(layout 1:1 对齐 · 颜色除外)
- [ ] **AC-6** · `pnpm typecheck && pnpm test && pnpm audit:redlines && pnpm audit:redlines-admin && pnpm audit:ld` 全 pass
- [ ] **AC-7** · 反例预防 · 不允许跳过任一 section / e2e · 不允许 visual diff "颜色不一致" 当 reject(D4=B 颜色保留 是预期)

**depends_on** · `["US-001", "US-002", "US-003", "US-004", "US-005", "US-006", "US-007", "US-008", "US-009", "US-010"]`
**priority** · 11
**risk_level** · medium
**size_hint** · medium
**files_to_create** · `['scripts/verify-prd-16.sh', 'tests/e2e/prd16-home-flow.test.ts', 'tests/e2e/prd16-guide-flow.test.ts', 'tests/e2e/prd16-ip-plan-flow.test.ts', 'tests/e2e/prd16-header-dropdown-flow.test.ts']`
**test_command** · `bash scripts/verify-prd-16.sh && cd apps/web && pnpm test:e2e -- prd16`

---

## §2 Functional Requirements(20 FR)

- **FR-1** · `/` 必须渲染完整 Home page(不再 redirect 到 /step/1)· 含 5 区(Hero / IpProgress / FunctionMatrix / Workflow / ReadyToStart)
- **FR-2** · Header 必须含 4 一级菜单(创作 / 策划 / 智能 / 更多)+ 25 二级项 · click 触发 dropdown(非 hover)
- **FR-3** · 「赵语AI」按钮显示当前活跃 IP 账号名(动态 · 不固定 "赵语AI")· click 弹账号 dropdown
- **FR-4** · 「sally zhao」chip 纯展示(不可点)· 左边 animate-ping 紫色跳动小圆点
- **FR-5** · 登出 icon-only button · click 直接登出 无确认 modal
- **FR-6** · `/guide` page 必须含 USER GUIDE H1 + 5 步推荐流程 + 3 系统概览卡 + 13 模块详解卡 + 5 FAQ + 顶部 search input
- **FR-7** · `/ip-plan` page 必须含 `[← 返回首页]` + H1 "我的IP方案" + 进度条(紫色 gradient) + 9 step 卡片网格
- **FR-8** · 首页 FUNCTION MATRIX 必须含 14 工具卡 + 1 footer 使用说明卡 = 15 卡 · 4 H3 分组(市场洞察 3 / 变现设计 2 / 内容创作 5 / 智能工具 4)
- **FR-9** · 首页 WORKFLOW 必须含 7 步圆形数字标(01-07 · 选行业→变现设计→学爆款→生成文案→制作视频→私域转化)
- **FR-10** · 首页 IP 进度区 「继续」 button 必须动态跳第一个未完成 step
- **FR-11** · `apps/web/index.html` 必须含 Google Fonts preconnect + 3 字体导入 link
- **FR-12** · `apps/web/tailwind.config.ts` 必须含 `display` `label` `cn` `sans` `mono` 5 font family
- **FR-13** · `apps/web/src/styles/aiipznt-motion.css` 必须含 `animate-ping-primary` `glass-card` `data-grid-bg` 3 utility class
- **FR-14** · 颜色 token D4=B 严锁 · grep `--gold` `border-gold` `bg-gold` `text-gold` `shadow-gold` 在 `apps/web/src/` 0 命中
- **FR-15** · 移动端(< 1024px)Header 必须用 sheet 显示 4 大类 + 25 二级 + 用户区固定底部
- **FR-16** · IP 账号切换 dropdown 必须含 "管理账号 → /accounts" entry
- **FR-17** · `/guide` 13 模块卡 click 展开 steps · 复杂 expand state 用 `useState`
- **FR-18** · `/guide` 5 FAQ accordion · click 展开 a · 简洁 + or − icon
- **FR-19** · 首页所有 button click 跳转必须严格按 dump §2.1 (启动智能分析→/step/1 / 使用说明→/guide / 查看IP方案→/ip-plan / 14 工具卡 → 各自 href)
- **FR-20** · /ip-plan 9 step key 严格 `['1','3','3b','4','4b','5','6','7','8']`(跳 step2)

---

## §3 Non-Goals(明确 6 项不做)

- ❌ **不切金色 OKLCH**(D4=B 严锁)· 颜色 token 全保留 Aurelian Dark 紫
- ❌ **不动 admin** (D3=A · `apps/admin/` 0 触动)
- ❌ **不重写 backend tRPC + DB schema** · 仅 frontend 重构
- ❌ **不删 PRD-15 已完成的 6 工具 + 2 衍生页**(Copywriting / DeepLearning / Monetization / PresentStyles / PrivateDomain / Trending / MyTopics / History)
- ❌ **不替换 StepForm + StepResult 通用模板**(PRD-3 沉淀)· Step 1/3/3b/4/4b/5/6/7/8 完整化在 PRD-17/18
- ❌ **不补 14 工具中 8 stub**(VideoAnalysis / Generate / Analysis / VideoProduction / AcquisitionVideo / AiVideo / VoiceChat / Knowledge / BoomGenerate)+ 4 modules stub(Diagnosis / DailyTasks / Evolution / Accounts)· 留 PRD-19

---

## §4 Technical Considerations

### §4.1 字体性能

- Google Fonts preconnect 加 `https://fonts.googleapis.com` + `https://fonts.gstatic.com` 2 个 hint · 减少 DNS lookup + TLS 握手延迟
- `display=swap` · 字体未加载完前用 fallback · 避免 FOIT(Flash of Invisible Text)
- 仅加载 Orbitron 500/700/900(3 weight)· Rajdhani 500/600/700 · Noto Sans SC 400/500/700 · 总 9 字重 · ~150 KB 增量 · acceptable

### §4.2 Header 全局组件 · blast radius 32 page

- US-007 改 Header 后 · 所有 32 page 都用新 Header(共享组件)· 必须严格回归测试
- `<HeaderNav>` 用 lazy 不必要(Header 是首屏关键路径)· 直接 import
- dropdown 状态用 shadcn `<DropdownMenu>` · 不自管 state(避免 race / focus trap bug)

### §4.3 SPA lazy render 校准

- aiipznt 实测 · /trending 934 els / /knowledge 647 els 大 page · 必须 IntersectionObserver lazy render(滚到位置才渲染)· 否则首屏 LCP 太慢
- US-004 FUNCTION MATRIX 15 卡 · 数据小 · 不需要 lazy
- US-009 /guide 13 模块 · 数据小 · 不需要 lazy(filter 用 memoized)

### §4.4 移动端 viewport 切换

- US-007 / US-009 / US-010 移动端布局必须用 Tailwind responsive(`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)· 不允许 inline media query
- mobile sheet 用 shadcn `<Sheet>` · 不自实现 drawer

### §4.5 路由切换 / `/` redirect 移除

- 旧 router · `{ index: true, element: <Navigate to="/step/1" replace /> }`
- 新 router · `{ index: true, element: <Home /> }`
- 必须验证 · 已登录用户访问 `/` 不再 auto-redirect 到 step1 · 也不破坏 PRD-3 步进流程

### §4.6 复用 PRD-3 / PRD-15 沉淀(0 重写)

- `<StepProgress>`(PRD-3 US-005) · 复用 · US-003 + US-010 用
- `<AccountSwitcher>`(PRD-15 US-001) · 复用 · US-008 改样式不改逻辑
- `<IndustryDropdown>`(PRD-15 US-001) · 不在 PRD-16 用 · 留 PRD-17 Step1
- `getLsKey` `getToolLsKey` · 不在 PRD-16 用 · 留 PRD-17/18/19
- `useActiveAccount` `useAuth` hooks · 复用

---

## §5 跨 Story 协议锁(避免命名漂移)

| 命名 | 类型 | 定义 US | 消费 US | 说明 |
|---|---|---|---|---|
| `HEADER_NAV` | 数组常量 | US-007 | US-007(Header.tsx) · US-009(若 Guide 复用 nav) | 4 一级菜单 + 25 二级项 · 严格按 dump §1.2 |
| `FUNCTION_MATRIX` | 数组常量 | US-004 | US-004 only | 4 H3 分组 + 14 工具卡(footer 1 卡分开为 `FUNCTION_MATRIX_FOOTER`) |
| `WORKFLOW_STEPS` | 数组常量 | US-005 | US-005 only | 7 步流程 |
| `GUIDE_MODULES` | 数组常量 | US-009 | US-009 only | 13 模块详解 |
| `FAQS` | 数组常量 | US-009 | US-009 only | 5 FAQ |
| `STEP_CARDS` | 数组常量 | US-010 | US-010 only | 9 step 卡 · key 严格 `['1','3','3b','4','4b','5','6','7','8']` |
| `glass-card` | css class | US-001 | US-002 / US-003 / US-004 / US-005 / US-009 / US-010 | 玻璃卡片 utility · 紫色边 + 模糊 + 紫色 shadow |
| `data-grid-bg` | css class | US-001 | US-002(Home main) · US-009(Guide main) · US-010(IpPlan main) | 紫色网格背景 utility |
| `animate-ping-primary` | css animation | US-001 | US-008(sally zhao chip 跳动小圆点) | ping 动画 · 紫色变体 · 不是金色 |
| `font-display` `font-label` `font-cn` | tailwind utility | US-001 | 全 11 US | 字体应用 · `font-display` 大标题 / `font-label` 副标 / `font-cn` 中文正文 |

---

## §6 Locked Decisions(D-130~D-145 · 16 条)

- **D-130** · 主应用 / 路由 不再 redirect /step/1 · 渲染完整 Home page(US-002 锁)
- **D-131** · 字体 family 切 Orbitron(大标题)+ Rajdhani(副标)+ Noto Sans SC(中文正文)+ ui-sans-serif(英文正文)· 通过 Google Fonts preconnect 加载 · `display=swap`
- **D-132** · D4=B 颜色 token 严锁 Aurelian Dark 紫色 · 不切金色 OKLCH · 所有 aiipznt 的 `var(--gold)` 系列映射到 `var(--primary)` 系列
- **D-133** · Header 4 一级菜单 click 触发(非 hover)dropdown · 严格按 dump §1.2 实测 25 二级项
- **D-134** · `<AccountSwitcher>` 复用 PRD-15 · 改样式不改逻辑 · button 加紫色描边 + 紫色 hover · dropdown 浮层加紫色边 + 模糊背景
- **D-135** · 「sally zhao」chip 纯展示(不可点)· `animate-ping-primary` 紫色跳动小圆点 · 不允许加 onclick / hover
- **D-136** · 登出 icon-only · click 直接 logout · 无确认 modal(实测 aiipznt 是直接登出 · 无 UX 确认)
- **D-137** · 首页 FUNCTION MATRIX 15 卡 · 4 H3 分组(市场洞察 3 / 变现设计 2 / 内容创作 5 / 智能工具 4)+ 1 footer 使用说明卡(在 4 H3 之外 · 居中)
- **D-138** · 首页 WORKFLOW 7 步 · 圆形数字 01-07 + 步骤名 + 描述 · md+ 横排 + mobile flex-col
- **D-139** · 首页 IP 进度区 「继续」 button 动态跳第一未完成 step · 9 步 key `['1','3','3b','4','4b','5','6','7','8']` 跳 step2
- **D-140** · /guide page · USER GUIDE H1 + 5 步推荐流程 + 3 系统概览卡 + 13 模块详解卡(可展开 steps)+ 5 FAQ accordion + 顶部 search input
- **D-141** · /ip-plan page · `[← 返回首页]` + H1 + 进度条(紫色 gradient) + 9 step 卡片网格 + 每卡含 emoji + 状态 + `[查看详情]` button
- **D-142** · `glass-card` utility · 用 `color-mix(in oklch, var(--primary) 15%, transparent)` 紫色边 + `backdrop-filter: blur(12px)` 模糊 + 紫色 shadow · 不允许硬编码紫色值
- **D-143** · `data-grid-bg` utility · 用 `linear-gradient` + `var(--primary)` 紫色网格 · 24px × 24px grid · 全 page main 容器加
- **D-144** · 移动端 Header sheet · 4 大类分组 + 25 二级项 + 用户区固定底部 · 用 shadcn `<Sheet>`
- **D-145** · 反例库 anti_patterns 必注入 foundation + 4 high US 的 `anti_patterns` 字段 · 关键词 `design-system / tailwind / font / dropdown / hero / oauth / SPA / lazy-render / hardcoded-color`

---

## §7 Success Metrics

- ✅ 用户访问 `/` 不再 redirect · 看到完整首页 Hero + 进度 + FUNCTION MATRIX + WORKFLOW + CTA
- ✅ Header 4 一级菜单 click 触发 25 二级项 · 跟 aiipznt 1:1 对齐
- ✅ /guide 13 模块详解卡 + 5 FAQ + 推荐流程 · 跟 aiipznt 1:1 对齐
- ✅ /ip-plan 9 step 卡片网格 · 跟 aiipznt 1:1 对齐
- ✅ 字体切 Orbitron / Rajdhani / Noto Sans SC · 视觉跟 aiipznt 一致
- ✅ 颜色保留 Aurelian Dark 紫(D4=B)· 0 金色 token 漏入
- ✅ verify-prd-16.sh 9 sections ALL PASS · 0 FAIL
- ✅ 4 e2e flows 全 PASS
- ✅ visual diff with /tmp/aiipznt-clone-research/screenshots/ layout 1:1(颜色除外)

---

## §8 Open Questions(待 PRD-16 实施期 Opus 主对话回答)

- **OQ-1** · `/guide` 13 模块详解卡的 `steps` 字段在 dump §2.1 中未实测(spec §9.1 仅列了"可点击展开详细使用步骤")· 我已基于 spec + 14 工具实际功能推断 · 实施期可调整(无需推翻)
- **OQ-2** · 首页 H1 "AI+短视频+IP" 是巨大金色 outline 字体 · D4=B 改紫色 outline · 视觉是否够震撼(可在 PRD-19 视觉精修时再调对比度)
- **OQ-3** · `<HeaderNav>` 是否要加 active state(当前页所属一级菜单高亮)· 实测 aiipznt 没有此 UX · 我们也不加(D1=A 像素级对齐)· 但 UX 上可能稍劣 · 留 PRD-19 评估
- **OQ-4** · /ip-plan 9 step 卡 emoji 选择是我推断 · 实测 aiipznt 截图未明示 · 实施期可调整

---

## §9 反例库注入清单(US-001 + US-002 + US-004 + US-007 + US-009 强制注入)

ralph skill 转 prd.json 时 · 从 `~/.claude/playbooks/reject-examples.jsonl` 检索关键词命中 ≤3 条注入到对应 US 的 `anti_patterns` 字段 ·

| US | 关键词 | 注入数 |
|:-:|---|:-:|
| US-001 | tailwind-config / design-token / font / oklch / color | ≤3 |
| US-002 | hero / hardcoded-color / route-redirect / oklch-mismatch | ≤3 |
| US-004 | hardcoded-href / inline-grid-style / function-card-data-drift | ≤3 |
| US-007 | header-href-drift / hover-trigger-instead-of-click / dropdown-style-mismatch / leftover-old-arrays | ≤3 |
| US-009 | module-href-drift / guide-data-incomplete / accordion-state-bug | ≤3 |

---

## §10 风险红线(PRD-16 实施期 5 条硬规则)

1. ❌ **不切金色 OKLCH**(D4=B 严锁) · 任一 PR 加 `--gold` `border-gold` `bg-gold` `text-gold` `shadow-gold` 立即 reject
2. ❌ **不删 PRD-15 已完成 page**(8 个 · /copywriting / /deep-learning / /monetization / /present-styles / /private-domain / /trending / /my-topics / /history)· grep `pages/` 必须含全部 8 个文件
3. ❌ **不动 admin** (D3=A) · grep `apps/admin/` diff 必须为 0
4. ❌ **不绕过 Audit Gate** · 全 11 US 严格走 ralph + 4 维度 audit · 不允许 `--no-audit-gate` 调试用
5. ❌ **不批量改 design token 不跑视觉回归** · US-001 字体切换必跑 visual regression(playwright screenshot diff)· 跟 PRD-15 已存的 baseline 对比 · 0 layout 改动

---

## §11 跟 Coding 3.0 + ralph + Opus audit 整合

### §11.1 Story 大小自检(全 11 US 评估)

| US | size_hint | files_to_create | files_to_modify | AC 条数 | 单 ralph 迭代可完成? |
|:-:|:-:|:-:|:-:|:-:|:-:|
| US-001 | medium | 1 | 3 | 10 | ✅ |
| US-002 | medium | 1 | 1 | 6 | ✅ |
| US-003 | small | 0 | 1 | 7 | ✅ |
| US-004 | **large** | 1 | 1 | 7 | ⚠️ 触发 §9.6 拆分检查 · 但单 ralph 应能完成(15 卡 + grid · 不算复杂) |
| US-005 | small | 1 | 1 | 5 | ✅ |
| US-006 | small | 0 | 1 | 4 | ✅ |
| US-007 | medium | 1 | 1 | 9 | ✅ |
| US-008 | small | 0 | 2 | 6 | ✅ |
| US-009 | **large** | 2 | 1 | 7 | ⚠️ 触发拆分 · 但单 ralph 应能完成(13 卡 + 5 FAQ accordion + filter · 不算复杂) |
| US-010 | medium | 0 | 1 | 5 | ✅ |
| US-011 | medium | 5 | 0 | 7 | ✅ |

**结论** · US-004 + US-009 触发 large 阈值 · 但 single page 实现 · 单 ralph 迭代应能完成(参 PRD-15 US-005 PrivateDomain 1215 行 + 40 it · 一次过)。如实施时撞 timeout · 按 §9.6 RCA-002 流程拆。

### §11.2 风险分档分布(给 Opus audit 强度参考)

- **foundation × 1**(US-001) · §0 4 项实测 + 通用 4 维度 + 全部域 grep + 跨 story 命名一致性逐字核对 + 下游 US AC 是否依赖本 US css class 语义 + 必读 tokens.css / aiipznt-motion.css
- **high × 4**(US-002 / US-004 / US-007 / US-009) · §0 + 通用 + 全部域 grep + line-by-line + 必读 e2e
- **medium × 6** · §0 + 通用 + 3-5 grep + 关键函数阅读

### §11.3 Audit Gate 强制(Step 5.5 全局 CLAUDE.md)

- 11 US 全严走 audit gate · 0 跳过
- US-001 + US-007 是基础设施 · 任一 reject 升 high · 不允许 rubber-stamp(参 OPUS-AUDIT-CHEATSHEET)

### §11.4 anti_patterns 注入(PRD-15 retro Diff-2 实证有效)

- 必注入 5 US(US-001 / US-002 / US-004 / US-007 / US-009)· 跨 PRD 反例累加防重蹈
- 注入流程 · ralph skill 转 prd.json 时 grep `~/.claude/playbooks/reject-examples.jsonl` 关键词 → 注入到 `anti_patterns` 字段(详 §9 清单)

---

## §12 实施前置准备(写 prd-16.json 前必做)

1. **当前 branch** · `ralph/prd-15-frontend-completeness` · PRD-15 已收官 · PRD-16 启动前应切回 `main` 或新建 `ralph/prd-16-aiipznt-alignment`
2. **prd-16.json 路径** · `scripts/ralph/prd-16.json` · 转完后 cp 到 `scripts/ralph/prd.json`(ralph daemon 默认读 prd.json)
3. **plan-check 必跑** · 转完后跑 `/plan-check` 验证 · 重点 ·
   - 2.6.13 anti_patterns 注入覆盖率(US-001 + US-002 + US-004 + US-007 + US-009 5 个 high/foundation 必注入)
   - 2.6.14 大 UI Story 拆分检查(US-004 + US-009 large · 评估是否拆)
   - 2.6.17 R-5 LocalStorage acc_(本 PRD 不触 LS · 应 PASS)
   - 2.6.18 R-4 stats audit-friendly(本 PRD 不触 stats · 应 PASS)
4. **ralph daemon 启动** · 严格按全局 CLAUDE.md §9.1 5 步 SOP · Monitor 必先启 · Stale session 必清理(参 §5.0)

---

## §13 PRD-17~19 衔接说明

PRD-16 是 4 PRD 系列(主应用对齐 aiipznt)的第一个 · 负责**基础设施 + 首页 + Header + /guide + /ip-plan**。

后续 ·
- **PRD-17** · Step 1/3/3b 完整化 · 8-10 US · 2 周 · 复用 PRD-16 的 Header / 字体 / glass-card
- **PRD-18** · Step 4/4b/5/6/7/8 完整化 · 10-12 US · 2.5 周
- **PRD-19** · 8 stub 工具 + 4 modules + 视觉精修 + 跨 PRD 全 32 page visual diff · 10-12 US · 2-2.5 周

总 4 PRD · 38-44 US · 8-10 周 wall time。

---

> **本 PRD seed 由 Opus 4.7 在 2026-05-16 BJT 写 · 跟 aiipznt-deep-dom-dump.md(382 行 32 page DOM 实测)+ aiipznt-spec.md(9192 行复刻基线)互补使用 · 严格遵守全局 CLAUDE.md "质量第一 · 上下文不是借口" + Coding 3.0 12 步流程**
