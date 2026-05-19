# PRD-22 vs PRD-21 跨 PRD 复盘

> **PRD-22** · 5 inline 重构 + 8 step pages 视觉精修 + 13 page visual diff · 12 US scope · D-214~D-225 · 12 Locked Decisions
> **PRD-21** · Visual Alignment Foundation · 8 US scope · D-206~D-213 · 8 Locked Decisions · visual-diff 基础设施首建
> **Branch** · `ralph/prd-22-inline-refactor-step-pages`
> **Daemon cycle** · 2026-05-19 BJT
> **Retrospective** · Opus 4.7 · 2026-05-19

---

## §0 数据总览

### §0.1 PRD-15 → PRD-22 严格一轮通过率趋势

| PRD | 严格一轮 % | 通过/总 | reject | retry | TD 净增 | verify checks | visual baselines |
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| PRD-15 | 80% | 8/10 | 1 | 2 | +1 | 10 | 0 |
| PRD-16 | 73% | 8/11 | 1 | 3 | +2 | 14 | 0 |
| PRD-17 | 81% | 9/11 | 1 | 2 | +1 | 17 | 0 |
| PRD-18 | 93% | 13/14 | 0 | 1 | +2 | 26 | 0 |
| PRD-19 | 89% | 8/9 | 0 | 1 | +1 | 28 | 0 |
| PRD-20 | 78% | 9/9 | 0 | 14(audit retry) | +2 | 32 | 0 |
| **PRD-21** | **—**(不计收官) | 7/7 dev | — | 4(US-002 daemon) | +3 | 45 | 4 |
| **PRD-22** | **82%** | **9/11 dev** | **2** | 0 | +5 | **52** | **13** |

**PRD-22 关键跃迁** · visual baseline 从 4 → **13 pages**(+9) · verify checks 从 45 → **52**(+7) · inline picker utility 3 件套首次建立跨 page 复用基础设施 · 但严格一轮通过率 82% 低于 PRD-18/19(93%/89%)· 原因是 2 次 Opus reject(D-218 tab 字面 + TD-093 unit test 漏写)

### §0.2 12 US 详细分布(PRD-22)

| US | risk | size | 状态 | Opus reject | TD | Wave |
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| US-001 | foundation | medium | ✅ 1iter PASS | 0 | 0 | 1 |
| US-002 | high | medium | ✅ 1iter PASS | 0 | TD-089/090/091 | 1 |
| US-003 | medium | medium | ✅ 1iter PASS | 0 | 0 | 2 |
| US-004 | medium | medium | ✅ 1iter PASS | 0 | 0 | 2 |
| US-005 | medium | medium | ✅ 1iter PASS | 0 | 0 | 2 |
| US-006 | medium | medium | **❌→✅** | **1** | 0 | 2 |
| US-007 | medium | medium | ✅ 1iter PASS | 0 | TD-092 | 2 |
| US-008 | medium | medium | ✅ 1iter PASS | 0 | 0 | 3 |
| US-009 | medium | medium | **❌→✅** | **1** | TD-093 | 3 |
| US-010 | medium | medium | ✅ 1iter PASS | 0 | 0 | 3 |
| US-011 | medium | medium | ✅ 1iter PASS | 0 | 0 | 4 |
| US-012 | medium | small | 收官(本次 retro) | — | — | 4 |

**严格一轮通过率** · 11 dev US - 2 reject = **9/11 = 81.8% ≈ 82%**

### §0.3 2 Reject 根因

| US | 根因 | 性质 | 反例入库 |
|:-:|---|:-:|:-:|
| US-006 | D-218 tab 字面锁: tab 5 字面不完整(缺 "🏭 产业制造 (4)") | AC 遗漏执行 | ✅ |
| US-009 | TD-093: step page 重写 AC 漏写 unit test 同步 · 加 FileUpload 单测后 PASS | AC 规范漏洞 | ✅ |

**PRD-22 唯一新 root cause** · TD-093 揭示"step page 重写 AC 模板缺少 unit test 要求" · 已加入 reject-examples.jsonl · PRD-23+ step page 务必在 AC 中明确 unit test 要求。

---

## §1 PRD 文档质量

### PRD-21 vs PRD-22

| 维度 | PRD-21 | PRD-22 | Δ |
|---|:-:|:-:|:-:|
| seed 行数 | 1622 | 907 | -715(-44%) |
| US 数 | 8 | 12 | +4 |
| per-US 行数 | ~200 | ~76 | -62% |
| Locked Decisions 数 | 8 | 12 | +4 |
| AC 条数(估) | ~55 | ~110 | +2x |

**insight** · PRD-22 文档精简但 AC 密度更高(AC/行 比 PRD-21 高 ~3x)· inline picker utility AC + D-220 字面锁 + D-221 13 列锁的出现使 AC 质量更高 · 但精简导致 US-006/US-009 AC 模板中 unit test 要求不明确(TD-093 根因)

---

## §2 Inline Picker Pattern 可迁移 Playbook

### P-01 · Inline Picker Utility 抽象化路径(★ PRD-22 首建 · PRD-23+ 复用)

**模式** · 跨多 page 共用的 UI 选择器应首先抽象为 `components/inline-pickers/` utility：
1. Controlled component API(`value` / `onChange` / `disabled`)
2. 单元测试 ≥5 per picker
3. barrel export `index.ts`
4. 各 page import 同一组件 · 状态各自管理(D-215)

**Why** · US-001 定义后 US-002/003/004/007/008/010/011 全部复用 · 0 重复实现。同类 pattern 可扩展至未来 CategoryPicker / DateRangePicker 等。

**How to apply** · 新 page 需要一个选项组时 → 先检查 `components/inline-pickers/` 是否已有匹配 · 无则新建并加入 barrel + 单测 ≥5。

---

### P-02 · Step Page 重写 AC 模板(TD-093 根因 · PRD-23+ 强制)

**模式** · 任何 step page 完整重写(Step{N}.tsx + 关联 OutputContent + constants)的 US · AC 必须包含：
- `ACx: TypeScript typecheck → 0 errors`
- `ACy: e2e tests (prd{N}-step{M}-flow.spec.ts) · N tests PASS`
- `ACz: unit tests → XX test files pass`(⚠️ 如果新增 component 如 FileUpload · 必须在 AC 中明确写出)

**Why** · US-009 AC 没写 FileUpload 单测要求 → Opus reject · 加写后 1st-pass。跨 US-006(D-218 tab 字面 AC 不完整)也是同类问题。

**How to apply** · prd skill 写 step page 重写 US 时 · 强制检查 AC 是否包含上述 3 项 · 特别是 AC-z unit tests 要列出具体新建组件名。

---

### P-03 · Visual Diff Baseline 扩展模式(13 page · PRD-23+ 可继续扩展)

**模式** · 新增 visual baseline 时：
1. 在 `tests/e2e/prd{N}-visual-baseline.spec.ts` 中追加 `expectVisualMatch` 调用
2. 首跑用 `--update-snapshots` 写入 `/tmp/aiipznt-clone-research/screenshots/`
3. 命名约定 `prd{N}-{page-slug}.png`
4. 后续 CI 用 `pnpm test:visual:prd{N}:check`

**Why** · PRD-22 把 visual baseline 从 4 扩到 13 pages(+9) · 覆盖所有已重构 page · PRD-23+ 继续扩展到 32 pages(目标)。

**How to apply** · 每个改变 UI 的 step page / 工具 page · 完成后追加 visual baseline · 不要推迟到 收官 US 批量做。

---

### P-04 · D-220 字面锁 + D-221 13 列分镜表(严锁范本 · PRD-23+ 继承)

**模式** · step page 输出区 H3/H4 字面锁使用专用常量文件：
- `constants/step{N}.ts` 中定义 `STEP{N}_OUTPUT_H3_N: readonly Block[]`
- h3Label 字面 1:1 来源 spec §7.X · 禁止在 JSX 直接写字面
- 13 列分镜表 `STORYBOARD_COLUMNS` 同理

**Why** · D-220 锁住 /step/3(7H3)+ /step/3b(6H3)+ /step/4b(3阶梯)+ /step/7(4H4) · 0 字面漂移在所有 11 dev US 中 · 效果显著。

---

## §3 Patterns Forward Delivery(PRD-23 注入)

### §3.1 已注入 reject-examples.jsonl 的反例(PRD-22 净增)

| 反例 | US | 关键词 | PRD-23 触发场景 |
|---|:-:|---|---|
| D-218 tab 字面不完整 | US-006 | step1 tab 字面 行业分类 | /step/1 任何改动 |
| AC 漏写 unit test | US-009 | step page AC unit test | 任何 step page 重写 |

**reject-examples.jsonl** · 当前 52 条(PRD-22 净增 2 · 从 50 → 52)

### §3.2 PRD-23 启动前强制 checklist

1. **P-01** · inline picker 3 件套已在 `components/inline-pickers/` · 直接 import · 0 重新实现
2. **P-02** · step page 重写 AC 必须含 unit test 明确列名要求
3. **P-03** · 新 page 完成后追加 `tests/e2e/prd23-visual-baseline.spec.ts` baseline
4. **TD-091** · /generate 单列 layout vs aiipznt 双栏 · PRD-23 可选择修复
5. **TD-093** · step page AC 模板已注入 reject-examples · prd skill 自动 inject

---

## §4 Daemon 运行质量

| 指标 | PRD-21 | PRD-22 | 备注 |
|---|:-:|:-:|---|
| Total US | 8 | 12 | +4 |
| Blocked | 0 | 0 | 连续 8 PRD 0 blocked |
| Wall time(估) | ~8h | ~9h | 含 monitor gap · 13 page 更多 |
| commits | ~18 | 34 | +16 · 含 audit chore |
| Monitor 启动 | ✅ | ✅ | RCA-001 SOP 严守 |
| Stale session 检查 | N/A | ✅ | RCA-005 SOP 严守 |

---

## §5 小结

**PRD-22 核心成果** · 3 inline picker utility(跨 10 page 复用) + 13 page visual diff(从 4→13) + 0 Blocked + 206 vitest tests + 0 typecheck errors。

**主要缺陷** · 严格一轮通过率 82% 低于 PRD-18 最高点 93% · 原因是 AC 模板中 unit test 要求不明确(TD-093) · 这是系统性问题 · 已注入 reject-examples · PRD-23+ 期望回升到 90%+。

**下游 PRD-23 核心目标** · 3 stub 完整化(/diagnosis · /accounts · /step/8) + 14 工具视觉精修 + 继续扩展 visual baseline → 22 pages。
