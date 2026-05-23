# QuanAn · PRD-29~35 前端页面复刻路线图

> **范围** · PRD-29~35 · aiipznt 剩余页面 1:1 复刻 · Foundation 沉淀 → 页面渐进实现
> **基线** · PRD-27(1:1 复刻完成度 100%) + PRD-29(Foundation + /step/3 30+ sub-feature)
> **更新** · 2026-05-24 · PRD-29.6 ship 后更新

---

## 路线图总览

| PRD | 页面 | 状态 | 核心内容 | 预估规模 |
|:-:|---|:-:|---|---|
| **PRD-29** | `/step/3` + Foundation | ✅ **SHIPPED** | 168 OKLCH token + 4 shared components + 30+ sub-feature | 17 dev US · 40 checks |
| **PRD-29.6** | `/step/3` button wiring + admin LLM Config | ✅ **SHIPPED** | 全 button 真实可用 + DB-first LLM key + stub toast | 6 dev US · 29 checks |
| **PRD-30** | `/step/3b` + `/step/4b` + `/evolution` | 🔵 **待启** | 3 page · step3 延伸 + evolution 展示 + **真实可用+默认内容双维度** | ~12-18 US |
| PRD-31 | TBD · 待截图分析 | ⬜ 规划中 | 待 PRD-30 完成后评估 | — |
| PRD-32 | TBD | ⬜ 规划中 | — | — |
| PRD-33 | TBD | ⬜ 规划中 | — | — |
| PRD-34 | TBD | ⬜ 规划中 | — | — |
| PRD-35 | TBD(收官) | ⬜ 规划中 | 全 site 收官 verify + 性能 + SEO | — |

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

## PRD-30 · 待启 🔵

> **Branch 待建** · `ralph/prd-30-step3b-step4b-evolution`(建议)
> **启动条件** · 用户提供 /step/3b · /step/4b · /evolution 三 page **result-state** 完整截图

### 启动前提供清单

- [ ] `/step/3b` page 完整截图(result-state with AI content · 1440px desktop)
- [ ] `/step/4b` page 完整截图(result-state · 1440px desktop)
- [ ] `/evolution` page 完整截图(result-state · 1440px desktop)
- [ ] 上述 3 page 的 mobile 截图(可选 · 375px)

> ⚠️ **AC-8 通知**: PRD-30 启动前需要以上截图！无截图无法准确评估复刻范围。

### PRD-30 预估范围(待截图确认)

| Phase | 内容 | US 数 |
|---|---|---|
| Foundation review | 确认 globals.css OKLCH + 共享 components 是否需要补充 | 0-1 |
| /step/3b 复刻 | step3 延伸页 · 具体待截图分析 | 4-8 |
| /step/4b 复刻 | step4 延伸页 · 具体待截图分析 | 4-8 |
| /evolution 复刻 | AI 推演展示页 · 具体待截图分析 | 4-6 |
| 收官 verify | verify-prd-30.sh + visual spec + retro | 1-2 |
| **总计** | | **~13-25 US** |

### PRD-30 Playbook 建议(来自 PRD-29 retro §3 + PRD-29.6 retro §3)

1. Foundation 先行 · 确认 token 系统无需调整
2. result-state 截图先建立 baseline · 不用 form-state 对比
3. template literal 含 `{variable}` 占位符的 AC 须标注 `.split()` 模式
4. constants 单独 story · 放在 wrapper 之前建立 · 集中管理字面锁
5. **★ PRD-29.6 新增**: 每 page 必须满足"真实可用 + 默认内容"双维度——layout 完成不等于 done，button onclick wire 和 mock data 渲染也是验收标准
6. **★ PRD-29.6 新增**: 需要 admin 配置才可用的功能用 stub toast 而非 disabled button · UX 更明确
7. **★ PRD-29.6 新增**: 如有新 LLM feature · 复用 `loadLlmKey(provider)` DB-first + 5min cache 模式 · 不要 hardcode env

---

## PRD-31~35 · 规划中 ⬜

待 PRD-30 完成后根据 aiipznt 剩余页面评估：
- 可能涵盖: 主页 hero 深度精修 · /step/1 /step/2 对应 3b/4b 延伸 · 性能优化 · SEO
- PRD-35 建议为收官 PRD · 全 site visual audit + Lighthouse 90+ + 上线前 PRR

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

*更新于 2026-05-23 · PRD-29 ship 后 · Ralph v2 US-014 收官*
