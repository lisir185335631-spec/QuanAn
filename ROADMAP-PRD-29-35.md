# QuanAn · PRD-29~35 前端页面复刻路线图

> **范围** · PRD-29~35 · aiipznt 剩余页面 1:1 复刻 · Foundation 沉淀 → 页面渐进实现
> **基线** · PRD-27(1:1 复刻完成度 100%) + PRD-29(Foundation + /step/3 30+ sub-feature)
> **更新** · 2026-06-01 · PRD-30 三页(/step/3b · /step/4b · /evolution)复刻完成 · **aiipznt 全站页面复刻收官**(34 路由)

---

## 路线图总览

| PRD | 页面 | 状态 | 核心内容 | 预估规模 |
|:-:|---|:-:|---|---|
| **PRD-29** | `/step/3` + Foundation | ✅ **SHIPPED** | 168 OKLCH token + 4 shared components + 30+ sub-feature | 17 dev US · 40 checks |
| **PRD-29.6** | `/step/3` button wiring + admin LLM Config | ✅ **SHIPPED** | 全 button 真实可用 + DB-first LLM key + stub toast | 6 dev US · 29 checks |
| **PRD-30** | `/step/3b` + `/step/4b` + `/evolution` | ✅ **SHIPPED** | 3 page 1:1 复刻完成 · step3/4 延伸 + evolution 进化中心 · 真实可用+默认内容双维度 | team-mode 逐页交付 |
| ~~PRD-31~34~~ | 剩余页面复刻 | ✅ **已收口** | aiipznt **全部页面复刻完成**(34 路由)· 无剩余待复刻页面 | — |
| PRD-35 | 全站收官 | ⬜ **待启** | 收官 verify + 性能(Lighthouse)+ SEO + 上线前 PRR · **非页面工作** | 收官 PRD |

---

## PRD-29.6 · SHIPPED ✅

> **Branch** · `ralph/prd-29.6-step3-buttons-llm-config` · **Tag** · `prd-29.6-complete`
> **Ship 日期** · 2026-05-24
> **核心** · /step/3 全 button 真实可用 + admin LLM Config 模块(DB-first + 5min cache)
> **复盘** · [.agents/retros/prd-29.6-vs-prd-29-retrospective.md](.agents/retros/prd-29.6-vs-prd-29-retrospective.md)

### 核心交付

| 交付项 | 状态 |
|---|:-:|
| admin /admin/llm-config page · LLM key 管理(US-001) | ✅ |
| llm-gateway DB-first + 5min cache + invalidate hook(US-002) | ✅ |
| step3.optimizeSection mutation + onClick wire(US-003) | ✅ |
| 一键重新生成 force flag + Step3 double button wire(US-004) | ✅ |
| 复制全部 toolbar + per-H3 复制 verify(US-005) | ✅ |
| 生成参考图/查看图标 stub toast(US-006) | ✅ |
| verify-prd-29.6.sh 29 checks + e2e 5 tests + prd-29.6-complete tag | ✅ |

### 数据摘要

| 指标 | 值 |
|---|:-:|
| dev 1iter rate | **100%**(6/6) |
| audit 1iter rate | 100%(6/6) |
| Opus reject | 0 |
| verify checks | 29/29 |

---

## PRD-29 · SHIPPED ✅

> **Branch** · `ralph/prd-29-step3-foundation` · **Tag** · `prd-29-complete`
> **Ship 日期** · 2026-05-23
> **Commit** · `d863b77`(progress.txt update · 收官 verify complete)
> **ADR-022** · globals.css 全量 OKLCH token 切换路 α · commit `4dc30f2` · 实施完成

### 核心交付

| 交付项 | 状态 |
|---|:-:|
| globals.css :root + .dark · 168 OKLCH vars | ✅ |
| 4 共享 Foundation 组件(FlameIcon/SparkleIcon/SubCard/GoldenHighlight) | ✅ |
| cross-PRD 零回归 verify(PRD-27 33/33 + PRD-28 43/43) | ✅ |
| /step/3 Step3Form · 5 平台 emoji button | ✅ |
| Step3PageHeader · breadcrumb + ★H1 + FlameIcon H2 + 3 toolbar | ✅ |
| VideoReferenceCaseSection · 4 platform 视频卡 | ✅ |
| NicknameRecommendSection · 6 nickname card | ✅ |
| AvatarDesignSection · 主方案 + 4 sub-option | ✅ |
| BackgroundImageDesignSection · 4 platform 卡 | ✅ |
| IntroCopySection · ★简介公式 SubCard + 6 platform 卡 | ✅ |
| OverallStrategySection · 4 strategic sub-section | ✅ |
| Step3 wrapper · 整合 9 section + tRPC generateStep3 + useStepData | ✅ |
| Step3LoadingState · animate-ping-primary + Loader2 | ✅ |
| step3.ts constants verbatim from aiipznt(字面对账 · grep 0 drift) | ✅ |
| e2e prd-29-step-3-flow.spec.ts · 5 tests | ✅ |
| verify-prd-29.sh · 40/40 ALL PASS | ✅ |
| visual regression guard · maxDiffPixelRatio 0.05 self-baseline | ✅ |
| git tag prd-29-complete | ✅ |

### 数据摘要

| 指标 | 值 |
|---|:-:|
| dev 1iter rate | 94%(16/17) |
| audit 1iter rate | 100%(17/17) |
| Opus reject | 0 |
| verify checks | 40/40 |
| TD 净变化 | +1(TD-110 visual baseline pre-existing) |
| 工期 | 2026-05-23 · ~10h BJT session |

---

## PRD-30 · SHIPPED ✅

> **交付方式** · team-mode 逐页 1:1 复刻(未走原计划的独立 `ralph/prd-30-*` branch)· 随 PRD-29.8 / 29.10 + sally 真实页克隆批次落地
> **完成日期** · 2026-06-01
> **核心** · `/step/3b` · `/step/4b` · `/evolution` 三页 1:1 复刻完成 · 真实可用 + 默认内容双维度

### 核心交付

| 交付项 | 状态 | 来源提交 |
|---|:-:|---|
| `/step/3b` 1:1 复刻(3 textarea + 5 platform radio + 6 H3 输出区) | ✅ | `8398ab5`(PRD-29.8) |
| `/step/3b` 真接 stepData router(Branding packaging/persona) | ✅ | `fbb2f6d` / `af17aae` |
| `/step/4b` 1:1 复刻(1 textarea + 3 input + 3 阶梯 + 收入结构 + 成功案例) | ✅ | `163d6ae`(PRD-29.10) |
| `/step/4b` 真接 stepData router(Positioning + Monetization) | ✅ | `5e2984c` / `cf75399` |
| `/evolution` 1:1 复刻(智能体进化中心 · 5 级 badge + 4 指标仪表盘 + 5 H3 模块 + 进化方向 radio) | ✅ | `7bae35f` / `a4d88cc` |
| `/evolution` 接 trpc.evolution 全套(getProfile + evolve + updateConfig · D-237/D-238 字面锁) | ✅ | `8acca53` |

> 注:三页未单独建 PRD-30 branch · 而是在 PRD-29.x team-mode 批次中逐页交付完成 · 含组件 + constants 字面锁 + 单测 + 路由注册 + 真实 router 接线 · 全 web 套件 **940/940 全绿**。

### Playbook 经验(来自 PRD-29 retro §3 + PRD-29.6 retro §3 · 已应用于 PRD-30 三页交付)

1. Foundation 先行 · 确认 token 系统无需调整
2. result-state 截图先建立 baseline · 不用 form-state 对比
3. template literal 含 `{variable}` 占位符的 AC 须标注 `.split()` 模式
4. constants 单独 story · 放在 wrapper 之前建立 · 集中管理字面锁
5. **★ PRD-29.6 新增**: 每 page 必须满足"真实可用 + 默认内容"双维度——layout 完成不等于 done，button onclick wire 和 mock data 渲染也是验收标准
6. **★ PRD-29.6 新增**: 需要 admin 配置才可用的功能用 stub toast 而非 disabled button · UX 更明确
7. **★ PRD-29.6 新增**: 如有新 LLM feature · 复用 `loadLlmKey(provider)` DB-first + 5min cache 模式 · 不要 hardcode env

---

## PRD-31~35 · 页面复刻已收口 → 仅余收官 ⬜

> aiipznt **全部页面复刻完成**(34 路由)· 原 PRD-31~34"剩余页面"占位已无对象 · 后续仅余 **非页面** 收官工作,统一归入 PRD-35。

### PRD-35 收官范围(待启)

- [ ] 全站 visual audit · quanan vs aiipznt 像素对账(34 路由)
- [ ] 性能优化 · Lighthouse 90+ · bundle 体积审查
- [ ] SEO · meta / sitemap / OG / 结构化数据
- [ ] 上线前 PRR(production readiness review)· 真实数据流端到端
- [ ] branch 收尾 · 本分支领先 main **70 提交**(0 落后 · 0 冲突 · 可直接 merge)· 待全套 verify + merge

---

## 关联资产

| 资产 | 路径 |
|---|---|
| PRD-29 goal-verify | `.agents/verification/prd-29-step-3-foundation.md` |
| PRD-29 retro | `.agents/retros/prd-29-vs-prd-28-retrospective.md` |
| verify script | `scripts/verify-prd-29.sh` |
| visual diff script | `scripts/diff-aiipznt-step-3-image.mjs` |
| Foundation shared components | `apps/web/src/components/shared/` |
| step3 constants | `apps/web/src/lib/step3.ts` |
| ADR-022 | `ADR.md §ADR-022` |
| git tag | `prd-29-complete` |

---

*更新于 2026-06-01 · PRD-30 三页复刻完成 · aiipznt 全站页面复刻收官(34 路由)· 仅余 PRD-35 收官工作*
