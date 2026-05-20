# PRD-24 vs PRD-21~23 跨 PRD 复盘

> **PRD-24** · Modules Final Polish · 3 module 完整化 + 32 page visual baseline 收官 · 4 dev US + 1 收官 · D-237/D-238/D-239 字面锁
> **复盘范围** · PRD-21~24 视觉对齐征程(4 PRD · 累计目标: 1:1 视觉复刻达成)
> **Branch** · `ralph/prd-24-modules-final-polish`
> **Daemon cycle** · 2026-05-20 BJT
> **Retrospective** · Opus 4.7 · 2026-05-20

---

## §0 数据总览

### §0.1 PRD-21~24 严格一轮通过率趋势(视觉对齐征程)

| PRD | 严格一轮 % | 通过/总(dev) | Opus reject | retry | TD 净增 | verify checks | visual baselines |
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| PRD-21 | —(不计收官) | 7/7 dev | — | 4(US-002 daemon) | +3 | 45 | 4 |
| PRD-22 | 82% | 9/11 dev | 2 | 0 | +5 | 52 | 13 |
| PRD-23 | 100% | 9/9 dev | 0 | 0 | 0(净减) | 58 | 28 |
| **PRD-24** | **100%** | **3/3 dev** | **0** | **0** | **0** | **51** | **32** |

**视觉对齐征程关键数据**:
- 🟢 **累计 visual baseline**: 4 → 13 → 28 → **32**(目标达成 · 1:1 视觉复刻)
- 🟢 **连续 2 PRD 100% 严格一轮通过率**(PRD-23 + PRD-24)
- 🟢 **PRD-24 3 dev US 全部 1 iter PASS · 0 reject · 0 retry**
- 🟢 **verify checks 52 → 58 → 51**(PRD-24 精简 · 专注 PRD-24 内检查 · 前 PRD 由各自 verify.sh 覆盖)

### §0.2 PRD-24 4 dev US + 1 收官 US 详细分布

| US | risk | size | 状态 | Opus reject | Wave |
|:-:|:-:|:-:|:-:|:-:|:-:|
| US-001 | high | medium | ✅ 1iter PASS | 0 | 1 |
| US-002 | high | medium | ✅ 1iter PASS | 0 | 1 |
| US-003 | high | medium | ✅ 1iter PASS | 0 | 1 |
| US-004 | medium | medium | ✅ 1iter PASS | 0 | 2 |
| US-005 | medium | medium | 收官(本次 retro) | — | 3 |

**严格一轮通过率**: 3 dev US(US-001~003) + US-004 = **4/4 = 100%** — 与 PRD-23 并列历史最高

### §0.3 视觉 baseline 增长曲线

```
PRD-21:  4 baselines  ████
PRD-22: 13 baselines  █████████████
PRD-23: 28 baselines  ████████████████████████████
PRD-24: 32 baselines  ████████████████████████████████  ← 目标 32 达成 ✅
```

每轮增长: +4 → +9 → +15 → +4(PRD-24 仅 3 new pages + 累计稳定)

---

## §1 PRD-24 为什么能 100% 一轮通过？

### §1.1 stub 完整化范式已成熟

PRD-23 建立的 stub 范式在 PRD-24 直接复用:

| 范式要素 | PRD-23 建立 | PRD-24 复用情况 |
|---|---|---|
| constants 文件(literal lock) | VideoAnalysis 首建 | daily-tasks.ts / evolution.ts / voice-chat.ts 3 个全建 |
| local state · 无 tRPC mutation | 4 工具 page | DailyTasks/Evolution/VoiceChat 3 pages 全严守 D-234 |
| __tests__ 同步硬规则 | TD-093 修复 | 3 new pages 全有 __tests__ · 每个 ≥5 tests |
| constant unit tests | 部分建立 | daily-tasks.test.ts(5) + voice-chat.test.ts(8) 两套 |
| e2e flow spec + visual baseline | 15 pages 建立 | prd24-{page}-flow.spec.ts × 3 + prd24-visual-baseline.spec.ts |

**结论**: 范式熟练度 → ralph dev 实现成本低 → 0 reject 概率高

### §1.2 D-237/D-238/D-239 字面锁的作用

PRD-24 引入 3 个 Locked Decisions(字面锁):
- D-237: EVOLUTION_LEVELS_5 + EVOLUTION_MODULES_5
- D-238: EVOLUTION_DIRECTIONS_4
- D-239: VOICE CHAT H1 + VOICE_CHAT_QUICK_PROMPTS_6 + VOICE_CHAT_INTRO

**效果**: ralph dev 实现时直接从 constants 文件读 — 零自由发挥空间 — Opus audit 字面对账 D1=A 100%
**教训延伸**: 字面锁 LD 应该在 PRD 写作时就确定 · 不是在 Opus audit 时才检查

### §1.3 anti_patterns 注入持续有效

reject-examples.jsonl 全局 35 条反例 + PRD-23 沉淀的 pattern:
- `getLsKey` 代替 bare localStorage string key → PRD-24 3 pages 全自动用 getLsKey
- unit test 同步 → 3 pages 全自动建 __tests__ · ralph 不需要 Opus remind
- stub page 无 useMutation → 3 pages 0 mutation

**结论**: 历史反例注入 SHIELD 段正在从"需要 Opus remind"变成"ralph 默认行为"

---

## §2 PRD-21~24 视觉对齐征程总结

### §2.1 里程碑: 1:1 视觉复刻达成

**PRD-21**(起点): aiipznt 克隆启动 · 导航/页面壳 · 4 visual baselines
**PRD-22**(发展): 21 page inline refactor + step pages polish · 13 baselines
**PRD-23**(冲刺): 3 stub 完整化 + 4 工具 stub · 28 baselines · 100% 通过率首次
**PRD-24**(收官): 3 module 完整化 · 32 baselines **目标达成** · 连续 100%

**1:1 视觉复刻的定义**:
- ≥32 pages 有 visual baseline 锁定(1440×900 · threshold 0.05)
- 所有 spec §8.4/§8.5 字面 D1=A 严守
- TypeScript 0 error · Vitest 334 tests full pass
- verify-prd-24.sh 51/51 · exit 0

**状态**: ✅ 已达成(2026-05-20)

### §2.2 LLM 接入 handoff to PRD-25+

PRD-24 明确的下一阶段边界:
- **当前**: 所有 AI 功能 stub(本地 state · 无真实 LLM 调用)
- **PRD-25+**: 逐步接入 LLM · 用已建立的 Specialist architecture(PRD-4)
- DailyTasks: AI 根据用户账号数据生成个性化任务(PRD-25 候选)
- Evolution: 真实反馈收集 + 智能体学习循环(PRD-26+ 候选)
- VoiceChat: 接入 LLM Gateway · 多供应商(PRD-27+ 候选)

### §2.3 留 PRD-25+ 的 TD

| TD | 描述 | 优先级 |
|---|---|---|
| TD-086 | apps/web/src/App.tsx 死代码 · 老 Toaster | P3 · 清理 |
| TD-087 | MyTopics.tsx text-amber-400 hardcode | P3 · 颜色 token |
| TD-088 | apps/web/src/App.tsx stale 嵌套 apps/ | P3 · 清理 |

---

## §3 可迁移 Playbook(回传 progress.txt)

### Playbook-1: visual baseline 目标设定

**规则**: 每 PRD 在 §2 目标中写明 baseline 增量目标 · 不写"尽量多"
**实证**: PRD-21 "4 页" · PRD-22 "13 页" · PRD-23 "28 页" · PRD-24 "32 页" — 每个都精确达成
**原因**: 模糊目标导致验收模糊 · 精确数字让 ralph dev 知道何时停

### Playbook-2: D=字面锁 LD 在 PRD 写作时确定

**规则**: 涉及 H1/H3 文案字面 + 常量数组的 AC · 必须同时写对应 D=字面锁 LD
**实证**: D-237/238/239 在 PRD-24 AC 写作时就锁好 → Opus audit D1=A 100% · 0 字面偏差
**反例**: PRD-22 US-006 没预先锁 step 页字面 → reject → replay → 80 min 浪费

### Playbook-3: stub 完整化顺序(constants → page → test × 3件套)

**规则**: stub page 实现标准 3 件套 · 顺序不可调:
1. `lib/constants/{page}.ts` — 字面锁 + 常量 (constants first)
2. `pages/{dir}/{Page}.tsx` — import from constants · no inline strings
3. `pages/{dir}/__tests__/{Page}.test.tsx` — H1/H3/click/LS/EmptyState

**实证**: PRD-24 US-001/002/003 全严守 · 3 pages 全 1 iter PASS
**原因**: constants 先写迫使 developer 先思考字面 → 页面实现时零字面选择 → Opus audit 零字面偏差

### Playbook-4: evolution/direction localStorage 可选

**规则**: 选择类 stub(radio/select)用 useState 足够 · 不强制 localStorage · 除非 PRD AC 明确要求 LS 持久化
**实证**: Evolution.tsx direction 用 useState · Opus audit 未对此 reject · 简洁 > 过度工程
**原因**: LD-009 规定 LS key 格式 · 不规定什么都必须存 LS

---

## §4 反例库统计

| 指标 | 数值 |
|---|---|
| 全局 reject-examples.jsonl 条数 | ≥35(seed) |
| PRD-24 新增 reject | 0 |
| SHIELD 注入有效率(PRD-24) | 100% — 3 注入模式全自动执行 |

**结论**: 反例库处于"自我强化"阶段 — PRD-24 0 reject 意味着 0 新 reject 入库 · 但历史 35 条仍有效防御

---

## §5 PRD-24 严格一轮通过率

**3 dev US = 3/3 = 100%** (与 PRD-23 并列历史最高)

**连续 100% 的意义**:
- PRD-23 首次 100% → 验证 stub 范式 + anti_patterns 注入有效
- PRD-24 再次 100% → 证明不是偶然 · 范式已稳固
- PRD-25+ LLM 接入 PRD 挑战更高(真实 API 调用) · 历史最高通过率是最好的起点
