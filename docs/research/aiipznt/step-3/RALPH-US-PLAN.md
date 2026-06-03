# /step/3 · ralph US plan(spike outcome · 不真启 daemon)

> **派生** · `.claude/skills/clone-aiipznt-pages/SKILL.md` §Phase 3 Step 3 Dispatch Builders
> **基于** · PAGE_TOPOLOGY.md §3 + 1 sample spec(`step-3-account-package-output.spec.md`)
> **生成** · 2026-05-23 BJT spike
> **不真启** · ralph daemon · 等用户 review spike outcome 后启完整 PRD-29

---

## §1 US 拆分(9 US · 严格按 cloner "1 sub-component = 1 builder agent" 原则)

| US | Title | risk | files_to_create | depends_on | AC 数 | anti_patterns 注入 |
|:-:|---|:-:|---|---|:-:|---|
| **001** | `[PRD-29 Foundation]` Phase 1 重抓 aiipznt + globals.css 金色 OKLCH token 切换 + 5 平台 emoji 字段补齐 | **foundation** | scripts/spike-step3-recon.mjs(已有 · 升级为 all-page recon) + apps/web/src/styles/globals.css(改 token) + apps/web/src/lib/constants/platforms.ts(加 emoji 字段) | - | 12 | "不允许保留 D4=B 紫色 token" / "不允许漏抓 oklch / oklab 半透明 background" |
| **002** | `[PRD-29 /step/3]` AccountPackageOutput H3 输出区(spec sample · 见 step-3-account-package-output.spec.md) | medium | apps/web/src/components/step3/AccountPackageOutput.tsx + 测试 | US-001 | 8 | "默认渲染 H3 · 不 conditional · 1:1 aiipznt state A" / "button 字面不加 →" |
| **003** | `[PRD-29 /step/3]` VideoReferenceCaseOutput H3 输出区(同 002 模板 · 含 `生成参考图` 第 4 button) | medium | apps/web/src/components/step3/VideoReferenceCaseOutput.tsx + 测试 | US-002 | 9 | 同 002 |
| **004** | `[PRD-29 /step/3]` NicknameRecommendOutput H3 输出区 | medium | apps/web/src/components/step3/NicknameRecommendOutput.tsx | US-002 | 8 | 同 002 |
| **005** | `[PRD-29 /step/3]` AvatarDesignOutput H3 输出区(含 `生成参考图`) | medium | apps/web/src/components/step3/AvatarDesignOutput.tsx | US-002 | 9 | 同 002 |
| **006** | `[PRD-29 /step/3]` BackgroundImageDesignOutput H3 输出区(含 `生成参考图`) | medium | apps/web/src/components/step3/BackgroundImageDesignOutput.tsx | US-002 | 9 | 同 002 |
| **007** | `[PRD-29 /step/3]` IntroCopyOutput H3 输出区 | medium | apps/web/src/components/step3/IntroCopyOutput.tsx | US-002 | 8 | 同 002 |
| **008** | `[PRD-29 /step/3]` OverallStrategyOutput H3 输出区 | medium | apps/web/src/components/step3/OverallStrategyOutput.tsx | US-002 | 8 | 同 002 |
| **009** | `[PRD-29 /step/3]` PlatformRadioGroup + Step3 wrapper 重写 + 字面修正 + BulkActionsToolbar | **high** | apps/web/src/components/step3/PlatformRadioGroup.tsx + apps/web/src/pages/step/Step3.tsx(重写) + apps/web/src/components/step3/BulkActionsToolbar.tsx | US-002~US-008 | 14 | "PrimaryCTA 必须字面 `生成账号包装方案` · 不允许 `进入 IP 定位 →`" / "5 平台 emoji 必须显示 📱📕📺🎬📺 · 不允许漏" / "page 默认渲染 7 H3 placeholder · 跟 aiipznt state A 1:1" |

**总 9 US** · risk 分布 1 foundation + 7 medium + 1 high。

---

## §2 跨 page 复用价值

US-001 Foundation 是**全 PRD-29 ~ PRD-33 共享**(token 切金色 + 5 平台 emoji 一次性投入)· 不只 /step/3 用。

US-002 ~ US-008 输出区模板 · /step/3b /step/4b 等 page 也有类似 H3 输出区结构(spec template 可复用 · 仅文字 / mutation field name 替换)· 加速后续 page 实施。

---

## §3 验证手段(per US 通过 Audit Gate 必跑)

1. **Validator AC 跑过**(US 内置 AC · 含 pytest 单元 + RTL 测试 + visual diff < 5% 跟 aiipznt 截图)
2. **Opus Audit 4 维度** · spec 一致性 / AGENTS.md 约束 / 安全 / PRD 一致
3. **§0 必跑 4 项实测** · pytest-full.xml 零回归 / mypy / import 验证 / SQL 实测(本 PRD 不涉 SQL)
4. **per-page Visual QA Diff**(Phase 5) · 在 US-009 收官时跑 image pixel diff · 跟 aiipznt baseline 比 < 5%

---

## §4 spike outcome 评估

### §4.1 Pipeline 可行性 ✅

- Phase 1 Reconnaissance · 已实测可跑(spike-step3-recon.mjs 成功)· 拿到 3 viewport + multi-state + 38-prop CSS
- Phase 3 Step 2 spec file template · 已 demo(`step-3-account-package-output.spec.md` 120 行 · 符合 < 150 行规则)
- Phase 3 Step 3 转 ralph US · 已 outline 9 US · 符合 "1 sub-component = 1 US" 原则

### §4.2 关键风险识别

| 风险 | 缓解 |
|---|---|
| spec 数量大 · 全 17 page × 平均 6 sub-component = 100+ spec | spec template 高度复用 · 仅 H3 文字 + mutation field 替换 · 估单 spec 写作时间 15-30 min |
| token 切金色后视觉冲击 | git revert 一键回滚机制(ADR-022 §Consequences) · 用户最终 acceptance |
| ralph daemon 100+ US 长跑(5-6 周) | Coding 3.0 已有崩溃恢复 + audit-gate · 安全 |
| Phase 1 全 17 page recon 跑一次 | 写 `scripts/recon-all-aiipznt.mjs` · 类似 spike-step3-recon 但 loop 17 page · 估 1-2h |

### §4.3 spike 之外的开放问题

- ❓ aiipznt /step/3 实际 placeholder 文字(EmptyPlaceholder 内容)spike 没抓到 · 需 Phase 1 跑完整版 recon 时补
- ❓ submit 后 state C(183 els · 0 H3)是不是真"跳到 generation pending page"?spike 没深究 · 需手动看 desktop-1440-state-c-submitted.png 确认
- ❓ aiipznt /step/3 是否真的默认渲染 7 H3 占位 · 还是 Vite client-side render hydration race · spike 抓的是 hydration 后状态 · 需 Phase 1 加 wait + 多次抓验证

---

## §5 给用户的建议(spike 收尾)

| 选项 | 描述 |
|:-:|---|
| **a** | spike 验证通过 · 立启 PRD-29 完整版(9 US for /step/3 + foundation + 后续 page)· ralph daemon 跑 · 我先写 tasks/prd-29.md |
| **b** | spike 验证 OK 但先看 desktop-1440-state-c-submitted screenshot 理解 state C 行为 · 再启 PRD-29 |
| **c** | spike 暴露 spec template 还有 gap(EmptyPlaceholder 文字 / state C 行为)· 补完 Phase 1 recon 再启 |
| **d** | spike 演示足够 · PRD-29 改自动化执行 · /clone-aiipznt-pages /step/3 直接 invoke skill 跑(本 spike 是手工演示 · skill 实际能自动) |

---

> **spike outcome 由 Opus 4.7 在 2026-05-23 BJT 完成 · 验证了 .claude/skills/clone-aiipznt-pages/ skill 的可行性 + 5 phase pipeline 在 QuanAn 的适配落地 · 拿到 1 sample spec + 9 US 拆分演示 · 等用户在 §5 4 选 1 决定下一步**
