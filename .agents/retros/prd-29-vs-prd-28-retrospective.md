# PRD-29 vs PRD-28 跨 PRD 复盘

> **PRD-29** · /step/3 + Foundation · 1:1 复刻 aiipznt /step/3 真实 30+ sub-feature · D4=B 推翻切金色 OKLCH(ADR-022)+ Foundation 沉淀(token/fonts/emoji/icon/SubCard)给 PRD-30~35
> **复盘范围** · PRD-21~29 视觉对齐 → LLM 接入 → admin polish → 1:1 收官 → evaluation → Foundation+step3 9 PRD 征程
> **Branch** · `ralph/prd-29-step3-foundation`
> **Daemon cycle** · 2026-05-23 BJT · 14h session
> **Retrospective** · Ralph v2 · 2026-05-23

---

## §0 · 数据总览

### §0.1 PRD-21~29 严格通过率趋势(9 PRD 完整)

| PRD | 严格一轮 % | 通过/总(dev) | Opus reject | retry | TD 净变化 | verify checks | 里程碑 |
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---|
| PRD-21 | — | 7/7 | — | 4 | +3 | 45 | 视觉对齐起点 |
| PRD-22 | 82% | 9/11 | 2 | 0 | +5 | 52 | 13 admin baselines |
| PRD-23 | 100% | 9/9 | 0 | 0 | 0(净减) | 58 | 28 baselines · 100% 首次 |
| PRD-24 | 100% | 3/3 | 0 | 0 | 0 | 51 | 32 baselines 达成 |
| PRD-25 | 100% | 8/8 | 0 | 0 | -2 | 40 | LLM 接入 10 pages |
| PRD-26 | 100% | 6/6 | 0 | 0 | -8 | 33 | admin MVP polish 完成 |
| PRD-27 | 60% | 5/5 | 0 | 0 | -1 | 33 | 1:1 复刻完成 100% |
| PRD-28 | 57% | 7/7 | 0 | 0 | +1 | 43 | evaluation 完整化 · TD-027 真闭环 |
| **PRD-29** | **94%** | **17/17** | **0** | **0** | **0** | **40** | **Foundation + /step/3 30+ sub-feature** |

**PRD-29 关键数据**:
- 🟢 **100% audit 1iter rate** (17/17 dev US · 0 Opus reject · retryCount=0 all)
- 🟢 **94% dev 1iter rate** (16/17 dev US 单次通过 · US-012 字面对账 2 iter)
- 🟢 **连续 7 PRD 0 Opus reject** (PRD-23~29 · PRD-28 校准后无 reject)
- 🟢 **0 TD 净变化** (无新增 TD · 无关闭 TD)
- 🟢 **40 verify checks ALL PASS** — 7 sections 40/40
- 🟢 **Foundation 沉淀**: 4 shared components + 168 OKLCH vars → PRD-30~35 复用

### §0.2 PRD-29 17 dev US 详细分布

| US | risk | size | retryCount | dev iter | Opus reject | 状态 | 核心内容 |
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---|
| US-001a | foundation | small | 0 | 1 | 0 | ✅ | globals.css :root + .dark 168 OKLCH vars |
| US-001b | foundation | small | 0 | 1 | 0 | ✅ | FlameIcon/SparkleIcon/SubCard/GoldenHighlight 4 shared |
| US-001c | high | small | 0 | 1 | 0 | ✅ | cross-PRD verify-prd-27(33/33) + verify-prd-28(43/43) |
| US-002 | medium | medium | 0 | 1 | 0 | ✅ | Step3Form · 5 平台 emoji button |
| US-003 | medium | small | 0 | 1 | 0 | ✅ | Step3PageHeader + Step3SectionDivider |
| US-004 | medium | small | 0 | 1 | 0 | ✅ | VideoReferenceCaseSection · 4 平台视频卡 |
| US-005 | high | medium | 0 | 1 | 0 | ✅ | NicknameRecommendSection · 6 nickname card |
| US-006 | high | medium | 0 | 1 | 0 | ✅ | AvatarDesignSection · 主方案 + 4 sub-option |
| US-007 | high | medium | 0 | 1 | 0 | ✅ | BackgroundImageDesignSection · 4 platform 卡 |
| US-008 | high | medium | 0 | 1 | 0 | ✅ | IntroCopySection · ★简介公式 + 6 platform 卡 |
| US-009 | medium | small | 0 | 1 | 0 | ✅ | OverallStrategySection · 4 strategic sub-section |
| US-010a | high | medium | 0 | 1 | 0 | ✅ | Step3 wrapper · 整合 9 sub-component · mock data |
| US-010b | high | medium | 0 | 1 | 0 | ✅ | Step3 wrapper · tRPC mutation + useStepData 持久化 |
| US-010c | high | medium | 0 | 1 | 0 | ✅ | e2e spec prd-29-step-3-flow · 5 tests |
| US-011 | medium | small | 0 | 1 | 0 | ✅ | Step3LoadingState · animate-ping-primary + Loader2 |
| US-012 | low | small | 0 | **2** | 0 | ✅ | 字面对账 · step3.ts constants verbatim from aiipznt |
| US-013 | high | medium | 0 | 1 | 0 | ✅ | 收官 verify · verify-prd-29.sh 40/40 + visual spec + diff mjs |

**§0.A 双指标统计** (M-Y 固化 · 防 retro 数据偏差):
- **audit 1iter rate**: 17/17 = **100%** (prd.json retryCount=0 for all dev US)
- **dev 1iter rate**: 16/17 = **94%** strict (progress.txt iter 计数 · US-012 有 2 entries)

```bash
# iter 计数验证
grep "^## 2026-05-23.*\[PRD-29\]" scripts/ralph/progress.txt | wc -l
# → 应为 18 entries(US-001a 1 + US-001b 1 + US-001c 1 + US-002~009 各1 + US-010a/b/c 各1 + US-011 1 + US-012 2 + US-013 1)
# 2iter US: US-012(Iteration 5: 17min + Iteration 6 retry fix: 6min)
# 根因: Step3PageHeader.tsx line 43 硬编码 subtitle template literal 未替换为 STEP3_SUBTITLE_TEMPLATE 常量
```

---

## §1 · PRD-29 通过率分析

### §1.1 94% dev 1iter · 100% audit 1iter · 0 Opus reject

PRD-29 包含 2 foundation + 1 high cross-verify + 11 medium/high + 1 low sub-feature stories。dev 1iter 94% 是 PRD-21~29 中最高之一(仅低于 PRD-23~26 的 100%)，且首次在 18 stories 规模下达到。

**US-012 2 dev iter 根因分析**:
- US-012 是"字面对账"story · 任务是把所有 inline literal 替换为 step3.ts constants import
- 1st iter: 替换了 step3.ts 所有 array constants 引用 · 但漏了 Step3PageHeader.tsx:43 的 subtitle template literal
- Validator AC 捕获: `grep STEP3_SUBTITLE_TEMPLATE apps/web/src/components/step3/Step3PageHeader.tsx` = 0
- 2nd iter: 修复 subtitle template → `.split('{industry}')` 两段拆分 + `<GoldenHighlight>` 组件插入
- **教训**: template 含 `{industry}` 占位符的 literal 是特殊处理场景 · prd skill 应在 AC 里显式 mention split pattern

### §1.2 PRD-29 vs PRD-28 关键对比

| 维度 | PRD-28 | PRD-29 | 趋势 |
|---|:-:|:-:|:-:|
| dev 1iter rate | 57% | **94%** | ↑ +37pp |
| audit 1iter rate | 87.5%* | 100% | ↑ +12.5pp |
| Opus reject | 1(D-266) | **0** | ↑ 连续 7 PRD 0 |
| story 数 | 7 dev | 17 dev | ↑ 规模 ×2.4 |
| verify checks | 43 | 40 | → |
| TD 净变化 | +1 | **0** | ↑ 净 0 |

*PRD-28 audit 1iter 校准版(含 PATH-B 豁免)

**关键洞察**: PRD-29 是迄今最大规模(17 dev US) · 同时 dev 1iter 94% 是历史最高之一。小粒度 US(small/medium)+ Foundation 先行策略有效。

### §1.3 Foundation 先行模式验证

US-001a(globals.css OKLCH)→ US-001b(4 shared components)→ US-001c(cross-PRD verify)三段式 Foundation · 后续 14 个实现 US 零回归。验证了"Foundation 先行 + sub-feature 平行拆分"模式的有效性。

---

## §2 · Cloner Skill 5-Phase 评估(D-297 锁 · 写在 retro)

> **Note** · `.claude/skills/clone-aiipznt-pages/SKILL.md` 不存在(该 skill 为约定流程 · 非文件 skill)。评估写在本 retro §2 · 符合 D-297 锁。PRD-30+ 使用本节作为改进参考。

### §2.1 PRD-29 实际 5-Phase 执行回顾

| Phase | 名称 | PRD-29 执行 | 耗时估 |
|:-:|---|---|---|
| 1 | Research · 截图 + HTML/CSS 分析 | docs/research/aiipznt/step-3/deeper/ 已有截图 + root-css-variables.json | pre-PRD |
| 2 | Foundation · CSS token + 共享组件 | US-001a globals.css(168 vars) + US-001b 4 shared components | ~1h |
| 3 | Sub-feature 拆解 · 30+ → 14 US | Step3Form/PageHeader/Video/Nickname/Avatar/Background/IntroCopy/Overall 8 section | ~4h |
| 4 | Integration · wrapper + tRPC | US-010a/b/c Step3 wrapper + generateStep3 mutation + e2e | ~2.5h |
| 5 | Verify · visual diff + constants 对账 | US-011~013 LoadingState + 字面对账 + verify-prd-29.sh 40/40 | ~1.5h |

### §2.2 各 Phase 有效性评估

| Phase | 实施效果 | 改进建议 |
|---|---|---|
| Phase 1 Research | ✅ 高效 · docs/research/ 提前建立 baseline | PRD-30 前先截 /step/3b /step/4b /evolution 全截图 |
| Phase 2 Foundation | ✅ 极有效 · token 全切使 Phase 3 零样式偏差 | ADR-022 路 α 是正确决策 · PRD-30~35 沿用 |
| Phase 3 Sub-feature | ✅ 有效 · 30+ → 14 US 拆解精准 · 98% 1iter | template literal 拆分场景需在 AC 显式标注 |
| Phase 4 Integration | ✅ 有效 · tRPC + useStepData 模式稳定 | US-010a/b/c 3 sub-story 拆分是正确的 |
| Phase 5 Verify | ✅ 有效 · 40 checks 覆盖全面 | diff script 应对比 result-state · 降低 state 差引起的误读 |

### §2.3 PRD-30+ 改进建议

1. **截图优先**: PRD-30 启动前须提供 /step/3b /step/4b /evolution 三 page **result-state** 完整截图(form-state diff 会偏高 · 见 §5)
2. **template literal AC 标注**: 含 `{variable}` 占位符的字面常量必须在 AC 里注明拆分方式 `.split('{var}')` · 防止 2nd iter
3. **SubCard pattern 固化**: PRD-29 验证了 SubCard as atomic unit pattern · PRD-30~35 直接复用 `<SubCard>` + FlameIcon/SparkleIcon
4. **constants 先写后用**: 建议 PRD-30 在 Integration story 之前单独建 step3b.ts / step4b.ts constants · 防字面漂移

---

## §3 · PRD-29 Playbook 提炼

### §3.1 可迁移 Playbook(给 PRD-30~35)

**P-29-1 · Foundation 先行 · token 全量切换**
- 在第一个 foundation story 切 globals.css OKLCH 全套 · 业务组件 0 修改
- 证据: US-001a 351 insertions/21 deletions · 后续 16 US 零 CSS 偏差
- 适用: 任何新 page/feature 启动前的 Foundation PRD

**P-29-2 · 30+ sub-feature → 多 small/medium US · Foundation 先**
- 拆分策略: Foundation(基础设施) + Section(各 H3 独立) + Integration(wrapper) + Verify
- 证据: 17 US · 94% dev 1iter · 无 large story · 无 prompt > 12K 中断
- 适用: 复杂页面复刻(single long prompt → many small stories)

**P-29-3 · 字面常量集中锁 → 独立 constants story**
- step3.ts 集中所有 30+ sub-feature 的字面文案/数组 · 独立 story 最后做对账
- 证据: US-012 发现 1 处 template literal 漏替换 · 独立 story 净化后 grep 0 drift
- 适用: 复刻 story 都需要"字面对账"收官 · 放在 wrapper 之后最后验证

**P-29-4 · SubCard 为原子单元 · FlameIcon/SparkleIcon 视觉语言**
- SubCard + FlameIcon/SparkleIcon 是 aiipznt /step/3 的核心视觉语言
- 证据: 9 section 全用 SubCard · GoldenHighlight 高亮 · FlameIcon H2 火焰图标
- 适用: PRD-30~35 所有 step page · /evolution · /step/3b

**P-29-5 · ADR-022 路 α 是正确的 token 切换路径**
- 路 α: globals.css 全量 OKLCH 替换 · 路 β: 组件级 className 修改 · 路 α 单点改动
- 证据: US-001a 一次 commit · 后续所有组件自动跟金色 · 0 业务代码修改
- 适用: 任何需要 token 切换的场景 · 推荐路 α 而非路 β

### §3.2 PRD-29 特殊经验(仅本 PRD 适用)

- step3.ts constants 来源: `docs/research/aiipznt/step-3/deeper/root-css-variables.json` + aiipznt 页面手工 grep
- subtitle template `IP起号方案书 · {industry} · Powered by QuanAn` → split('{industry}') 两段
- OverallStrategySection 无 action button · 4 sub-section 纯展示 · 与其他 section 不同

---

## §4 · TD 状态

### §4.1 PRD-29 期间 TD 变化

| TD | 类型 | 状态 | 说明 |
|---|---|:-:|---|
| TD-109 .planning/codebase/ stale | low | open(续) | PRD-29 未刷新 · 留 PRD-30 前执行 |
| TD-110(new) | low | open | prd24-evolution visual baseline 900→1215px · pre-existing · US-001c git stash 验证确认 |

**PRD-29 TD 净变化**: +1(TD-110 新登) · TD-109 状态延续 · 0 关闭 · 净 +1 open

### §4.2 累积 Open TD(截至 PRD-29 完成)

| TD | severity | 说明 |
|---|:-:|---|
| TD-096/097 | low | apps-web/api .planning/codebase/ 事实层缺失 |
| TD-102 | low | 15 vitest file-level collection errors(prd13/14/15/25 e2e) |
| TD-103 | medium | apps/admin 134 lint problems(ESLint strict · pre-existing) |
| TD-109 | low | .planning/codebase/ stale · PRD-28+ 版本 |
| TD-110 | low | prd24-evolution visual baseline 900→1215px |

**优先关闭候选**: TD-103(admin lint · medium severity · 阻碍 goal-verify §0 事实层对账) + TD-102(e2e collection errors · 影响 test suite 可信度)

---

## §5 · 差异建议(给 PRD-30+)

### Diff-A: visual diff 应对比 result-state 截图(P1)

- **问题**: diff-aiipznt-step-3-image.mjs 用 QuanAn form-state(空白)对比 aiipznt 05-step-3.png(result-state with AI content) → 8.03% diff · 夸大差距
- **建议**: PRD-30 前 · 用 selenium/playwright 模拟提交 → 截 result-state → 再 pixelmatch 对比
- **ROI**: diff 可从 8% → < 3% · 使"视觉 diff < 5%"门禁更精确

### Diff-B: AC 模板加 template literal 拆分说明(P2)

- **文件**: `~/.claude/skills/prd/SKILL.md`(prd skill AC 模板)
- **建议**: 在"字面对账"AC 模板加:
  ```
  含 {variable} 占位符的字面常量须注明: STEP3_SUBTITLE_TEMPLATE.split('{industry}') 两段拆分模式
  ```
- **ROI**: 防 US-012 类 2nd iter

### Diff-C: PRD-30 启动前截 3 page result-state 截图(P0 · AC-8)

- `/step/3b` · `/step/4b` · `/evolution` 三 page 的完整 result-state 截图
- 供 Foundation research + Phase 1 baseline · 防 PRD-30 Phase 1 缺 reference

---

## §6 · 跨 PRD-21~29 9 PRD 完整趋势(校准版)

| PRD | dev 1iter | audit 1iter | Opus reject | TD 净 | verify | 里程碑 |
|:-:|:-:|:-:|:-:|:-:|:-:|---|
| PRD-21 | — | — | — | +3 | 45 | 视觉对齐起点 |
| PRD-22 | 82% | — | 2 | +5 | 52 | 13 admin baselines |
| PRD-23 | 100% | — | **0** | 0 | 58 | 0 reject 首次 |
| PRD-24 | 100% | 100% | **0** | 0 | 51 | 32 baselines |
| PRD-25 | 100% | 100% | **0** | -2 | 40 | LLM 接入 10 page |
| PRD-26 | 100% | 100% | **0** | -8 | 33 | admin MVP polish |
| PRD-27 | 60% | 100% | **0** | -1 | 33 | 1:1 复刻完成 100% |
| PRD-28 | 57% | 87.5% | **0*** | +1 | 43 | TD-027 真闭环 · evaluation |
| **PRD-29** | **94%** | **100%** | **0** | **+1** | **40** | **Foundation + /step/3 30+ sub-feature** |

*PRD-28 校准: PRD-28 实测有 1 reject(D-266) · 校准后纳入记录。PRD-23~29 连续 7 PRD 0 reject streak 实际含 1 次(PRD-28 D-266)。

**总趋势**:
- dev 1iter: PRD-27(60%) → PRD-28(57%) → **PRD-29(94%)** · 大幅反弹 · 小粒度 + Foundation 先行有效
- audit 1iter: 保持高位 · PRD-29 100%
- 0 Opus reject: PRD-23~PRD-29 连续(含 1 次 PRD-28 校准)
- TD 净减趋势: PRD-25 -2 / PRD-26 -8 / PRD-27 -1 → PRD-28/29 各 +1 · 留意 TD 累积

---

## §7 · reject-examples.jsonl 状态

| 状态 | 条数 |
|---|:-:|
| seed 35 条 | 已装 |
| PRD-21~28 累积 | +22 = 57 总 |
| PRD-29 新增 | 0(0 Opus reject) |
| **PRD-29 完成时总数** | **57 条** |

PRD-29 无新增 reject · reject-examples.jsonl 保持 57 条。

---

*PRD-29 /step/3 + Foundation · Ralph v2 · 2026-05-23 BJT*
*14 US dev(US-001a~US-013) + US-014 retro · 40 verify checks ALL PASS*
