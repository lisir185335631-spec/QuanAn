# PRD-23 vs PRD-22 跨 PRD 复盘

> **PRD-23** · Stubs & Tools Polish · 3 stub 完整化 + 4 工具 stub + 28 page visual baseline · 10 US scope · D-226~D-235 · 10 Locked Decisions
> **PRD-22** · Inline Refactor + Step Pages Polish · 11 dev US · D-214~D-225 · 13 visual baselines · 82% 严格一轮通过率
> **Branch** · `ralph/prd-23-stubs-and-tools-polish`
> **Daemon cycle** · 2026-05-19~20 BJT
> **Retrospective** · Opus 4.7 · 2026-05-20

---

## §0 数据总览

### §0.1 PRD-15 → PRD-23 严格一轮通过率趋势

| PRD | 严格一轮 % | 通过/总 | reject | retry | TD 净增 | verify checks | visual baselines |
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| PRD-15 | 80% | 8/10 | 1 | 2 | +1 | 10 | 0 |
| PRD-16 | 73% | 8/11 | 1 | 3 | +2 | 14 | 0 |
| PRD-17 | 81% | 9/11 | 1 | 2 | +1 | 17 | 0 |
| PRD-18 | 93% | 13/14 | 0 | 1 | +2 | 26 | 0 |
| PRD-19 | 89% | 8/9 | 0 | 1 | +1 | 28 | 0 |
| PRD-20 | 78% | 9/9 | 0 | 14(audit retry) | +2 | 32 | 0 |
| PRD-21 | —(不计收官) | 7/7 dev | — | 4(US-002 daemon) | +3 | 45 | 4 |
| PRD-22 | 82% | 9/11 dev | 2 | 0 | +5 | 52 | 13 |
| **PRD-23** | **100%** | **9/9 dev** | **0** | **0** | **0**(净,TD-092/093 关闭) | **58** | **28** |

**PRD-23 关键跃迁**:
- 🟢 **严格一轮通过率 100%** — 9 dev US 全部 1 iter PASS · 0 Opus reject · 历史最高
- 🟢 visual baseline **13 → 28 pages**(+15) · 准备 PRD-24 32 page 收官
- 🟢 verify checks **52 → 58**(+6) · 10 sections · 首次含 unit test 同步规则验证
- 🟢 TD 净减少 · TD-092 + TD-093 在本 PRD 关闭 · 无新增
- 🟢 **stub 完整化范式建立** · DiagnosisStepCard(通用 8 步向导) · ToolForm stub(4 工具) · AcquisitionVideo 3 方案 grid

### §0.2 9 dev US 详细分布(PRD-23)

| US | risk | size | 状态 | Opus reject | Wave |
|:-:|:-:|:-:|:-:|:-:|:-:|
| US-001 | high | medium | ✅ 1iter PASS | 0 | 1 |
| US-002 | high | medium | ✅ 1iter PASS | 0 | 1 |
| US-003 | high | medium | ✅ 1iter PASS | 0 | 1 |
| US-004 | medium | medium | ✅ 1iter PASS | 0 | 2 |
| US-005 | medium | medium | ✅ 1iter PASS | 0 | 2 |
| US-006 | medium | medium | ✅ 1iter PASS | 0 | 2 |
| US-007 | medium | medium | ✅ 1iter PASS | 0 | 2 |
| US-008 | medium | medium | ✅ 1iter PASS | 0 | 3 |
| US-009 | medium | medium | ✅ 1iter PASS | 0 | 4 |
| US-010 | medium | small | 收官(本次 retro) | — | 5 |

**严格一轮通过率** · 9 dev US · 0 reject = **9/9 = 100%** — 历史最高记录

### §0.3 Why 100%？ — 根因分析

PRD-23 是 QuanAn 历史上首个 0 reject PRD · 关键因素：

| 因素 | 贡献 | 来源 |
|---|---|---|
| **TD-093 前置修复** · PRD-23 PRD AC 写作时已内化 unit test 同步要求 | ⭐ 高 | PRD-22 US-006/009 reject 教训 + reject-examples.jsonl 注入 |
| **stub 范式标准化** · 4 工具 stub 遵循相同 local-state 模式 · ralph 学习成本 0 | ⭐ 高 | US-004 VideoAnalysis 首建范式 · US-005/006/007 直接复用 |
| **medium US 粒度精准** · 7 dev US 全 medium · 无 large(RCA-002 规避) | ⭐ 中 | §9.6 size_hint 决策表 + plan-check §2.6.24 |
| **anti_patterns 注入有效** · reject-examples.jsonl 跨 PRD 累积 · ralph dev 主动规避 | ⭐ 中 | PRD-22 2 反例 + 全局 35 条反例注入 |
| **DiagnosisStepCard 设计前置** · D-226 LD 锁定通用组件架构 · ralph 不需要设计决策 | ⭐ 中 | CLAUDE.md §8 rule 3 "Edit 3 类文档前必读对应章节" |

---

## §1 PRD 文档质量

### §1.1 D-233 unit test 同步硬规则 — PRD-22 TD-093 教训内化

**PRD-22 问题** · US-006 + US-009 AC 漏写 unit test 同步要求 → 2 次 reject → ~80 min daemon 浪费

**PRD-23 改进** · 每个 page 重写 US 的 AC 明确写出：
```markdown
- AC-N · 新建/更新 apps/web/src/pages/**/__tests__/Page.test.tsx
  · ≥ 5 tests · H1字面/副标/CTA/disabled/stub输出 · pnpm test 全 pass
```

**结果** · PRD-23 所有 9 dev US **AC 完整包含 unit test 同步要求** · ralph dev 每次都新建或更新 __tests__ 文件 · Opus audit 0 unit test 相关 reject。

### §1.2 stub page AC 范式成熟

**新模式** · stub 完整化 US 的 AC 结构：
1. H1/副标题字面锁(D1A 严守)
2. 表单 disabled 条件(字符数 / 字段必填)
3. stub 输出区 H3 字面锁(N 个 H3)
4. unit test 新建(≥5 tests · 对应 AC)
5. e2e baseline 追加(visual baseline spec)
6. typecheck 0 errors

这个 6 项 AC 结构在 PRD-23 US-004~007 中标准化 · PRD-24+ 可直接复用。

---

## §2 Ralph 执行质量

### §2.1 stub 完整化范式 — 首次建立

**VideoAnalysis.tsx 首建模式** (US-004) → 后续 3 US 完全复用：

```typescript
// stub 工具页标准范式
const [submitted, setSubmitted] = useState(false);

// CTA disabled 条件
const isValid = copy.length >= 10;

// 表单提交后显示 stub 输出
{submitted && (
  <div data-testid="analysis-output">
    {OUTPUT_SECTIONS.map(({ h3 }) => (
      <h3>{h3}</h3>
    ))}
  </div>
)}
```

**优点**: 无 tRPC 依赖 · unit test 无需 mock · MemoryRouter 包裹即可测试 · local state 简单可靠

### §2.2 DiagnosisStepCard 通用组件 — 复杂向导的教科书

US-001(/diagnosis 8 步) 采用 data-driven 通用组件模式：
- `DIAGNOSIS_DIMENSIONS_8` 常量驱动 8 步 layout
- localStorage 持久化 · accountId 隔离
- stubScore 函数产生确定性分数(hash based · 避免随机 flicker)

**教训**: 复杂多步向导 → 单通用组件 + 常量数组 · 而非 8 个独立组件。

---

## §3 Opus 审计质量

### §3.1 risk_level 分档效果

| 档位 | US 数 | 平均 cycle | 结果 |
|---|:-:|:-:|---|
| high | 3(US-001/002/003) | 8-12 min | 全 1iter PASS · 深审验证 |
| medium | 6(US-004~009) | 5-8 min | 全 1iter PASS · 标准审 |
| 收官 | 1(US-010) | 当次 | 待审 |

### §3.2 审计 anti_patterns 反例注入有效性

PRD-22 注入的 2 条 unit test 反例(US-006/009 相关) · 在 PRD-23 所有 medium US prompt 中显示 · ralph dev 主动在 AC 完成前建对应 __tests__ 文件 · 0 unit test 相关 reject 验证注入有效。

---

## §4 可迁移 Playbook(PRD-24+ 直接用)

### M-1 · stub 工具页 6 项 AC 模板

适用于任何"新建 stub 工具页(无 LLM · 本地 state)"US：

```markdown
- AC-1 · H1 字面锁 `{H1}` · 副标题字面锁 `{subtitle}` · D1A 严守
- AC-2 · {N} 字段表单 · disabled 条件({field}.length < 10 / 必填字段检查)
- AC-3 · "生成{功能名}" CTA 按钮 · disabled 条件 / enabled 条件
- AC-4 · stub 输出区 {N} H3 字面锁({H3_1}/{H3_2}/.../{H3_N})
- AC-5 · 新建 apps/web/src/pages/tools/__tests__/{PageName}.test.tsx
  · ≥ 5 tests · H1字面/副标题/disabled/enabled/{N}H3 · pnpm test 全 pass
- AC-6 · typecheck 0 errors
```

### M-2 · DiagnosisStepCard 通用向导模式

适用于"多步问卷向导"US：
- 常量 `STEPS_N: { id, label, subtitle, items: [] }[]` 驱动
- 单个通用 `<StepCard>` 组件 · state index 切换
- localStorage 持久化 · `getLsKey(accountId, 'step_progress')`
- stub output 用 hash-based score · 避免随机

### M-3 · visual baseline 追加方式

每个新 page US 末尾追加到 prd{N}-visual-baseline.spec.ts：
```typescript
test('/new-page fullPage matches prd{N}-new-page.png', async ({ page }) => {
  await expectVisualMatch(page, {
    url: 'http://localhost:5173/new-page',
    baseline: 'prd{N}-new-page.png',
    ...
  });
});
```

### M-4 · unit test 同步硬规则(TD-093 永久生效)

**任何 page/component 新建或重写 US · AC 必须含**:
```markdown
- AC-N · 新建/更新 apps/web/src/pages/**/__tests__/PageName.test.tsx
  · ≥ 5 tests · pnpm test 全 pass
```

不含 = plan-check §2.6.25 WARN · Opus audit reject 概率 90%

---

## §5 Reject-examples.jsonl 反哺

本次 PRD-23 retro 无新 reject · 无需新增 reject-examples.jsonl 条目。

PRD-22 已注入的 2 条 unit test 相关反例在 PRD-23 验证有效 · 保持原条目不变。

---

## §6 PRD-23 → PRD-24 Handoff

### §6.1 PRD-23 交付状态

- ✅ 9 dev US 全 audit approved(100% 严格一轮通过率)
- ✅ verify-prd-23.sh 58/58 通过
- ✅ 28 visual baseline(prd22 13 + prd23 15+)
- ✅ TypeScript 0 errors · Vitest 287 tests passed
- ✅ TD-092 + TD-093 关闭 · 净 TD 增量 0

### §6.2 PRD-24 启动建议

| 项 | 建议 |
|---|---|
| **范围** | 6 modules 视觉精修(/daily-tasks · /evolution · /voice-chat 等)+ 全 32 page visual diff 收官 |
| **visual baseline 目标** | 32 total(PRD-23 28 + PRD-24 新增 4-6) |
| **unit test 要求** | 每个重写 page 必须在 AC 中写 __tests__ 同步 · plan-check §2.6.25 会 WARN |
| **size_hint** | 全 medium · 禁 large |
| **Locked Decisions** | 从 D-236 开始 |

### §6.3 进度.txt Ship Summary 模板(待 US-010 commit 后补全)

见 scripts/ralph/progress.txt 末尾 Ship Summary 章节。

---

> **生成时间** · 2026-05-20 07:3x BJT
> **Opus 审查** · 基于 prd.json + progress.txt + .agents/ 文档 + grep 实测
