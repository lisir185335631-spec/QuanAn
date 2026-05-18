# PRD-18 · QuanQn 主应用前端 Step 4 / Step 4b / Step 5 / Step 6 / Step 7 / Step 8 完整化(aiipznt 1:1 对齐 Phase 3)

> **版本** · v0.1(2026-05-17)
> **状态** · seed · 待 ralph skill 转 prd-18.json
> **续** · PRD-17(commit 3df8e6e · Step 1/3/3b · 11/11 ALL PASS · 严格通过率 81%)
> **基线** · PRD-15(14 工具 + 6 modules)+ PRD-16(首页 + Header + /guide + /ip-plan)+ PRD-17(Step 1/3/3b)
> **范围** · 续 aiipznt 复刻 Phase 3 · 一次性 6 step page(Step 4 / 4b / 5 / 6 / 7 / 8 · Step 7 拆 form/output)+ E2E 收官 = **14 US**

---

## §0 · 引用清单(8 上游必读 · ralph 实施前阅读全文)

| # | 文档 | 节 / 行号 | 用途 |
|:-:|---|---|---|
| 1 | `tasks/prd-17.md` | 全(1514 行)| **PRD-17 详细度参考 · §0 引用清单格式 · §7.5 协议锁格式 · §11 D 锁延续 · 三态组件 + 跨 step acc_ + structured mockResult + DialogTrigger asChild click 5 子节沉淀** |
| 2 | `aiipznt-spec.md` | §7.4 (line 1487-1514) | Step 4 执行计划 · SOP · radio + input + textarea + 输出 schema |
| 3 | `aiipznt-spec.md` | §7.5 (line 1516-1585) | Step 4b 变现路径 · 3 阶梯 schema(0→90万/100万→1000万/1000万→1亿)+ 收入结构 + 案例 |
| 4 | `aiipznt-spec.md` | §7.6 (line 1589-1631) | Step 5 爆款选题库 · 2 input + 2 file upload(20MB)+ 5 类 × 20 选题 = 100 |
| 5 | `aiipznt-spec.md` | §7.7 (line 1634-1661) | Step 6 拍摄计划 · textarea ≥10 字 + 分镜/拍摄/口播 3 模块 |
| 6 | `aiipznt-spec.md` | §7.8 (line 1665-1744) | Step 7 文案生成 · 20 脚本类型 + 22 爆款元素(4 分组)+ 主 textarea + 优化 input + 辩论模板 4 H4 输出 |
| 7 | `aiipznt-spec.md` | §7.9 (line 1748-1786) | Step 8 直播策划 · 2 子功能(生成方案 + AI 优化话术)+ 5 平台 + 3 经验 |
| 8 | `aiipznt-deep-dom-dump.md` | §2.2 (line 173-196) | 6 step DOM 实测 · btn / input / 元素数 · 跟 spec 对账 · "关键 input 清单(原文)" 字面 1:1 来源 |

**辅助参考**(实施期常驻):
- `AGENTS.md` §11.9.4 D4=B 颜色严锁(红线级)· §11.9.5 D1=A 像素级字面锁(红线级)· §11.10 PRD-17 沉淀 5 子节
- `ARCHITECTURE.md` §6 前端规格(base url / routing / shadcn UI)
- `.agents/retros/prd-17-vs-prd-16-retrospective.md` §10 M-2 D1=A 长文本字面双锁 · §13 反例累加机制
- `~/.claude/playbooks/reject-examples.jsonl` 48+ 条反例(ralph skill 注入 anti_patterns)

---

## §0.1 · 与 PRD-17 关系(增量复刻)

PRD-17 完成 · Step 1 / Step 3 / Step 3b 完整化 · 全套 baseline pattern 已就位:
- 字面常量集中放 `apps/web/src/lib/constants/<step>.ts`
- 三态组件 `apps/web/src/components/states/{LoadingState,ErrorState,EmptyState}.tsx`
- structured mockResult(interface + generateMockResult 函数)
- 跨 step localStorage `acc_` 前缀 + JSON.parse / JSON.stringify
- DialogTrigger asChild click 触发

PRD-18 **直接复用** 这套 pattern · 不重建 · 仅扩展到 Step 4 / 4b / 5 / 6 / 7 / 8。

**新增能力**:
- file upload(stub · 仅前端 FileReader 拿 metadata · 不真上传到后端 · 见 LD-170)
- 多选 chip(Step 7 · 22 爆款元素 4 分组多选)
- 搜索过滤(Step 7 · 20 脚本类型搜索)
- 字符计数器(Step 6 · textarea ≥10 字)
- 5 类 Tab × 20 选题网格(Step 5 · 100 选题)
- 多子功能 H3 切换(Step 8 · 2 子功能各自独立 form)

---

## §0.2 · 验收脚本承诺

PRD-18 完成后产出 `scripts/verify-prd-18.sh`(继 PRD-17 12/12 ALL PASS 模式 · 详 US-013):
- 静态检查 · 6 个 `step<N>.ts` 常量文件存在 + 6 个 step page 文件存在
- 字面常量 grep · `STEP4_PLATFORMS_5` / `STEP7_ELEMENTS_22` / `STEP8_SUBFUNCTIONS_2` 等 25+ 命名锁
- D 锁 grep · `from-violet` `from-amber` 在 apps/web/ 0 命中(D4=B)+ admin 0 修改(D3=A)
- 运行时 · playwright e2e 跑 Step 4 → 4b → 5 → 6 → 7 → 8 完整 flow · 6 截图

---

## §0.3 · 复刻定调表(D1=A · D4=B · D3=A · 跨 step 数据传递)

> **延续 PRD-17 锁** · 严守"文字 = layout 严格一部分"边界(prd skill SKILL.md D1=A 精确语义)

### D1=A 像素级 layout(layout 严锁 vs UX 自由)

| 维度 | 切 / 不切 | PRD-18 特定例子 |
|---|:-:|---|
| 整体页面布局(layout / 区块顺序 / 区块尺寸 / 容器宽度 / padding 方向) | ✅ 切 1:1 对齐 aiipznt | Step 4 form 在 H1 下方 · 输出在 form 下方 · 不在右侧分栏 |
| spacing scale(gap-2 / gap-4 / mb-8 等) | ✅ 切 | gap-4(form 字段间)· mb-8(form vs 输出区)· gap-6(三阶梯卡片间) |
| 字体 family(Orbitron / Rajdhani / Noto Sans SC)+ weight | ✅ 切 | H1 用 Orbitron 大写 · H3 用 Rajdhani semi · body 用 Noto Sans SC |
| motion(framer-motion / animate-X / transition / hover effect) | ✅ 切 | 三阶梯卡 framer-motion 入场 · 100 选题 grid 滚动加载 · search filter transition |
| SVG icons / lucide-react / 资源 | ✅ 切 | lucide-react ChevronDown / Search / Upload / Copy / RefreshCw / Sparkles · 0 自定义 SVG |
| 卡片 hover / glass-card 模糊 | ✅ 切 | 100 选题卡 hover border-primary/30 · glass-card backdrop-blur-md |
| **文字内容(title / desc / label / H1/H2/H3 / p 文本 / button 文字 / SUBTITLE / placeholder 等)** | ✅ **切 严格 1:1**(layout 严格一部分 · D1=A 锁 · plan-check §2.6.20 ERROR 阻断 · §2.6.21 hardcode 中文 button label 检测) | Step 4 H1 = "执行计划" · Step 5 H1 = "爆款选题库" · 全文字 1:1 来源 spec §7.4-7.9 + dump §2.2 |
| 颜色 token | ✅ D4=B 锁(见下方)| 全用 `var(--primary)` / `var(--secondary)` / `var(--background)` 现有 token · 0 violet/amber/紫色措辞 |
| UX behavior(search filter 联动 / accordion 展开 / hover transition 时长 / etc) | 🟡 可自由发挥(D1=A 不锁) | Step 5 100 选题筛选 / Step 7 22 元素多选交互 / Step 8 2 子功能切换 · 都可自由优化 |

**反例锁**(防 ralph 字面解读边界模糊):
1. ❌ 文字内容当"建议" · "Step 4 副标题写得更专业一点应该没问题" — 错!`STEP4_SUBTITLE_TEMPLATE` 严格 1:1 来源 spec §7.4 line 1492
2. ❌ 标点符号当"细节" · "中文 q 末尾 ？ 可有可无" — 错!标点也是 layout(D1=A 锁)
3. ❌ Schema 字段名当"建议" · "三阶梯 range 'duration' 改 'period' 更国际化" — 错!schema 字段名 1:1 来源 spec §7.5 line 1548
4. ✅ UX behavior 自由发挥 · "Step 5 100 选题滚动加载比一次性渲染体验更流畅" — 对!这是 UX 不是 layout

### D4=B 颜色锁(保留 QuanQn globals.css 金色)

继 PRD-17 D-152 / D-158:
- QuanQn globals.css 主色 `--primary: 43 87% 63%`(HSL · hue=43 金色)
- ⚠️ **PRD 文档严禁** · "紫色" / "violet" / "amber" / "purple" / "金色" 措辞
- ✅ **PRD 文档措辞** · `var(--primary)` / `var(--secondary)` / "主色" / "次色"
- ralph 实施时 · 严禁 `from-violet-X` / `from-amber-X` / `text-violet-X` 等 Tailwind 默认 utility · 仅用 `from-primary` / `text-primary` / `text-secondary` 等
- plan-check §2.6.7-ext 强制 grep 中文颜色词 vs token hue 一致性 · 不一致 ERROR 阻断
- ralph audit 必跑 · `git diff main..HEAD apps/web/ | grep -E '(violet|amber|gold|purple)-[0-9]+' | wc -l` 必须 = 0

### D3=A 范围锁(仅 apps/web)

- ✅ apps/web/src/lib/constants/step{4,4b,5,6,7,8}.ts
- ✅ apps/web/src/lib/types/step.ts(已存在 · 新增 Step4/4b/5/6/7/8 Result interface)
- ✅ apps/web/src/pages/step/Step{4,4b,5,6,7,8}.tsx
- ✅ apps/web/src/components/step{4,4b,5,6,7,8}/*(可选 · output 组件拆分时)
- ✅ apps/web/e2e/prd-18-step-4-5-6-7-8.spec.ts
- ✅ apps/web/src/router.tsx(routing 已存在 step path · 仅可能补 lazy load · 不重建)
- ❌ apps/admin/ 0 触动
- ❌ apps/api/ 0 触动
- ❌ packages/{schemas,ui,clients} 0 触动
- ❌ Prisma schema 0 改动

### 跨 step 数据传递链(LD-009 acc_ 前缀 · PRD-17 已固化)

继承 PRD-17 LD-009 + 新增 PRD-18 链路:

```
acc_step1 (industry · PRD-17 US-003 已存)
  → acc_step3 (account-wrap data · PRD-17 US-006b 已存)
  → acc_step3b (persona data · PRD-17 US-008 已存)
  → acc_step4 (NEW · PRD-18 US-007 · execution plan data)
  → acc_step4b (NEW · PRD-18 US-008 · monetization data)
  → acc_step5 (NEW · PRD-18 US-009 · viral topics data)
  → acc_step6 (NEW · PRD-18 US-010 · shooting plan data)
  → acc_step7 (NEW · PRD-18 US-011b · copywriting data)
  → acc_step8 (NEW · PRD-18 US-012 · live streaming data)

跨 step 预填链路(spec 明确写):
  acc_step5_selected_topic → acc_step7_topic (Step 5 选题点击 → 跳 Step 7 自动预填 · spec §7.6 line 1619)
  acc_step7_result → acc_step6_text (用户决定 · 可在 Step 6 textarea 自动填 Step 7 生成的文案 · spec §7.7 line 1645)
  acc_step1 (industry) → acc_step4/4b/5/8 SUBTITLE 注入(`当前行业:{industry}。...` · spec §7.4 line 1492 · §7.5 line 1521 · §7.9 line 1753)
```

---

## §1 · 概述

PRD-18 完成 QuanQn 主应用 9 步主流程剩余 6 step(Step 4 / 4b / 5 / 6 / 7 / 8)的 page 完整化 · 实现严格 1:1 aiipznt 复刻 layout + 字面文字 + UX 流程 · 同时严守 D4=B 金色 token + D3=A 仅主应用边界。

**当前 baseline**:
- PRD-17 已完成 Step 1 / Step 3 / Step 3b · 3 page · 14 字面常量文件 · 6 字面输出区
- 全套 baseline pattern 已就位 · ralph 可直接复用
- 6 个 step page 当前是 `StepForm` 通用模板 · 没业务定制 · 跟 aiipznt 完全不一致(dump §2.2 已标 ★ 重写)

**完成后状态**:
- 9 步主流程 7 page(Step 1/2/3/3b/4/4b/5/6/7/8 = 10 step · PRD-18 完成 6/10)
- Step 2(目标人群)未触 · 留 PRD-19 + PRD-15 已部分覆盖
- 26 字面常量(STEP4_*/STEP4B_*/STEP5_*/STEP6_*/STEP7_*/STEP8_* 共 6 文件 · 100+ 字段字面锁)
- Step 5 100 选题 · Step 7 4 H4 输出 · Step 8 6 模块输出
- E2E playwright 跑完 6 step + 6 截图 + 12/12 verify 脚本 PASS

---

## §2 · 目标

1. **6 step page 完整化** · `apps/web/src/pages/step/Step{4,4b,5,6,7,8}.tsx` 实现严格 1:1 aiipznt 布局 + 字面文字 + UX 流程
2. **6 字面常量文件** · `apps/web/src/lib/constants/step{4,4b,5,6,7,8}.ts` · 集中放 26+ 命名锁(plan-check §2.6.20 D1=A 字面锁检查 · §2.6.21 hardcode 中文 button 检查)
3. **三态组件复用** · 6 page 各 1 处使用 `LoadingState` / `ErrorState` / `EmptyState`(PRD-17 已建)· 0 重复实现
4. **structured mockResult** · 6 page 各定义 `Step{N}Result` interface + `generateMockResult({step}Data: Step{N}FormData)` 函数(继 PRD-17 US-006b/US-008 pattern)
5. **跨 step 数据链路** · 6 个 `acc_step{N}` localStorage key(LD-009 前缀)· 严格 namespace 隔离
6. **D 锁严守** · D1=A 字面文字 / D4=B 金色 token / D3=A 仅 apps/web · 0 violet/amber 引入 · 0 admin/api 触动
7. **零回归** · 不破坏 PRD-15/16/17 已就位的 Step 1/3/3b + 14 工具 + 首页 + Header + /guide + /ip-plan 任何 page · vitest 全 PASS · playwright e2e 全 PASS · tsc 0 error
8. **E2E 收官** · playwright 跑 Step 4 → 4b → 5 → 6 → 7 → 8 完整流程 · 6 截图 · consoleErrors === [] 硬门禁

---

## §3 · User Stories(14 US · 6 foundation + 7 page · Step 7 拆 a/b · 收官 1)

> **risk_level 自动打标说明** · 6 个 step{N}.ts 都是 foundation(被 page 严格 depends_on · downstream count = 1-2 但是字面锁极严 · ralph skill 转 prd.json 时会按下游影响半径升档规则提为 foundation)· 详 §11 LD-161

### US-001: `apps/web/src/lib/constants/step4.ts` 常量(foundation)

**risk_level** · foundation
**size_hint** · small
**depends_on** · []
**files_to_create** · `apps/web/src/lib/constants/step4.ts`(约 70 行)
**files_to_modify** · 无

**描述** · 作为 ralph 实施员 · 我需要把 Step 4 执行计划 page 所有字面字符串集中到一个常量文件 · 确保 D1=A 字面锁不被分散到 page 文件里 hardcode · 并为 Step 4 输出区定义 structured Step4Result interface。

**背景** · spec §7.4 (line 1487-1513) + dump §2.2 line 180 · Step 4 含 1 radio(5 platform · 复用 STEP3 平台名)+ 3 input/textarea(粉丝量/目标/情况)+ 主 CTA "生成执行计划"。所有字面 PRD AC-1 完整字面锁 · 不允许后续 page 文件 hardcode。

**Acceptance Criteria**:

- [ ] **AC-1**(完整代码块字面锁 · 严格 1:1 来源 spec §7.4)· 创建 `apps/web/src/lib/constants/step4.ts` · 包含以下完整 export:

```typescript
/**
 * QuanQn · Step 4 执行计划 page 常量 — 字面锁
 * 命名锁 · STEP4_PLATFORMS_5 / STEP4_INPUTS_3 / STEP4_TEXTAREA_PLACEHOLDER / STEP4_BUTTON_GENERATE / STEP4_LOADING_TEXT / STEP4_SUBTITLE_TEMPLATE
 * D1=A 红线 · 所有字面 1:1 来源 spec §7.4 (line 1487-1513) · 严禁改写
 * 数字锁 · STEP4_PLATFORMS_5.length === 5 · STEP4_INPUTS_3.length === 3
 */

import type { Platform5 } from './step3';
export { STEP3_PLATFORMS_5 as STEP4_PLATFORMS_5 } from './step3';

export interface Step4Input {
  id: 'follower_count' | 'goal' | 'personal_info';
  label: string;
  required: boolean;
  type: 'input' | 'textarea';
  placeholder: string;
}

// STEP4_INPUTS_3 · 3 字段字面 1:1 来源 spec §7.4 line 1499-1501
export const STEP4_INPUTS_3: readonly Step4Input[] = [
  {
    id: 'follower_count',
    label: '当前粉丝量',
    required: false,
    type: 'input',
    placeholder: '如：0 / 500 / 1万 / 10万',
  },
  {
    id: 'goal',
    label: '目标',
    required: false,
    type: 'input',
    placeholder: '如：3个月涨粉1万、月入5万',
  },
  {
    id: 'personal_info',
    label: '个人信息',
    required: false,
    type: 'textarea',
    placeholder: '描述你的情况，比如：\n- 每天可投入2小时\n- 有实体店/线上课程\n- 擅长口播/拍摄',
  },
] as const;

// STEP4_PAGE · step 标签 + H1 + 副标
export const STEP4_STEP_TAG = 'STEP 04 · 制定执行计划';
export const STEP4_H1 = '执行计划';
export const STEP4_SUBTITLE_TEMPLATE = '当前行业：{industry}。AI 将为你制定每天具体做什么、每周里程碑、每个阶段 KPI 的可执行运营计划。';

// STEP4_BUTTONS
export const STEP4_BUTTON_GENERATE = '生成执行计划';

// STEP4_LOADING · 复用 PRD-17 pattern
export const STEP4_LOADING_TEXT = 'AI 正在生成你的执行计划，预计 30-60 秒...';

// STEP4_RADIO · 平台选择 label 严格 1:1
export const STEP4_RADIO_LABEL = '选择平台';
export const STEP4_RADIO_REQUIRED = true;

// Step4Result interface · structured output(继 PRD-17 US-006b pattern)
export interface Step4Result {
  daily_tasks: string[];          // 每日任务列表
  weekly_milestones: string[];    // 每周里程碑
  phase_kpis: Array<{             // 阶段 KPI
    phase: string;                // 阶段名(如 "0-30 天" / "30-60 天")
    kpi: string;                  // KPI 描述
    target: string;               // 目标值
  }>;
}

// STEP4_OUTPUT_H3 · 输出区 3 H3 字面 1:1
export const STEP4_OUTPUT_H3_3 = [
  { id: 'daily_tasks', h3Label: '1. 每日任务表' },
  { id: 'weekly_milestones', h3Label: '2. 每周里程碑' },
  { id: 'phase_kpis', h3Label: '3. 阶段 KPI' },
] as const;
```

- [ ] **AC-2**(字面双锁 · PRD-17 US-007 SUBTITLE 教训)· `STEP4_SUBTITLE_TEMPLATE` 完整字面 = `'当前行业：{industry}。AI 将为你制定每天具体做什么、每周里程碑、每个阶段 KPI 的可执行运营计划。'`(含全角中文冒号 · 末尾句号 · 严格 1:1 来源 spec §7.4 line 1492)· AC-2 字面必须跟 AC-1 完整字面**字字对照** · 不允许简化为 "含 '{industry}'"
- [ ] **AC-3**(命名锁)· 所有 export 命名严格遵守 `STEP4_*` 前缀 · 共 9 个命名 export(STEP4_PLATFORMS_5 / STEP4_INPUTS_3 / STEP4_STEP_TAG / STEP4_H1 / STEP4_SUBTITLE_TEMPLATE / STEP4_BUTTON_GENERATE / STEP4_LOADING_TEXT / STEP4_RADIO_LABEL / STEP4_RADIO_REQUIRED / STEP4_OUTPUT_H3_3 = 10 个)+ 2 interface (Step4Input / Step4Result)
- [ ] **AC-4**(零回归)· vitest 全 PASS(70+ tests · 含 PRD-17 已建)
- [ ] **AC-5**(类型检查)· tsc --noEmit 0 error

**[SHIELD] anti_patterns**(ralph skill 注入 · 高优先级历史教训):
1. ❌ **STEP4_SUBTITLE_TEMPLATE 创意改写**(PRD-17 US-007 reject · 1 iter)· `'当前行业:X。AI 制定执行计划'`(简化)→ ✅ 严格 1:1 = `'当前行业：{industry}。AI 将为你制定每天具体做什么、每周里程碑、每个阶段 KPI 的可执行运营计划。'`(spec §7.4 line 1492 完整字面)
2. ❌ **placeholder 自由翻译**(PRD-16 US-004 desc 教训)· `'如：当前粉丝数（万）'`(改写)→ ✅ `'如：0 / 500 / 1万 / 10万'`(spec §7.4 line 1499 完整字面)
3. ❌ **复用 STEP3_PLATFORMS_5 失败**(命名冲突)· 重复 5 platform 数组定义 → ✅ `export { STEP3_PLATFORMS_5 as STEP4_PLATFORMS_5 } from './step3';`(单一真源)

---

### US-002: `apps/web/src/lib/constants/step4b.ts` 常量(foundation)

**risk_level** · foundation
**size_hint** · medium
**depends_on** · []
**files_to_create** · `apps/web/src/lib/constants/step4b.ts`(约 140 行)
**files_to_modify** · 无

**描述** · 作为 ralph 实施员 · 我需要把 Step 4b 变现路径 page 所有字面字符串集中到一个常量文件 · 含 3 阶梯 schema(0→90万 / 100万→1000万 / 1000万→1亿 · range/title/duration 字面锁 1:1)+ 收入结构 + 成功案例 schema。

**背景** · spec §7.5 (line 1516-1585) + dump §2.2 line 181 · Step 4b 是 PRD-18 信息密度最高 · 含 1 textarea(产品 必填)+ 3 input(受众/IP定位/收入水平)+ 3 button(生成/智能优化/重新生成)+ 输出 3 阶梯 + 收入结构饼图 + 成功案例 list。

**Acceptance Criteria**:

- [ ] **AC-1**(完整代码块字面锁)· 创建 `apps/web/src/lib/constants/step4b.ts` · 包含以下完整 export:

```typescript
/**
 * QuanQn · Step 4b 变现路径 page 常量 — 字面锁
 * D1=A 红线 · 所有字面 1:1 来源 spec §7.5 (line 1516-1585) · 严禁改写
 * 数字锁 · STEP4B_INPUTS_3.length === 3 · STEP4B_THREE_STAGES.length === 3
 */

// STEP4B_PAGE · step 标签 + H1 + 副标
export const STEP4B_STEP_TAG = 'STEP 04b · 变现路径规划';
export const STEP4B_H1 = '变现路径';
export const STEP4B_SUBTITLE_TEMPLATE = '当前行业：{industry}。AI 将为你规划三阶梯变现路径：0→90 万、100 万→1000 万、1000 万→1 亿，每个阶梯有具体的产品设计、定价策略和成交流程。';

// STEP4B_TEXTAREA · 产品描述 必填
export interface Step4bTextarea {
  id: 'product_description';
  label: string;
  required: boolean;
  placeholder: string;
}
export const STEP4B_TEXTAREA: Step4bTextarea = {
  id: 'product_description',
  label: '产品/服务描述',
  required: true,
  placeholder: '描述你的产品或服务，比如：美容院皮肤管理项目，客单价500-3000元 / 线上知识付费课程，定价199-999元 / 实体店+线上双渠道',
} as const;

// STEP4B_INPUTS_3 · 3 字段字面 1:1 来源 spec §7.5 line 1528-1530
export interface Step4bInput {
  id: 'target_audience' | 'ip_positioning' | 'current_income';
  label: string;
  required: boolean;
  placeholder: string;
}

export const STEP4B_INPUTS_3: readonly Step4bInput[] = [
  {
    id: 'target_audience',
    label: '目标受众',
    required: false,
    placeholder: '如：25-40岁女性',
  },
  {
    id: 'ip_positioning',
    label: 'IP 定位',
    required: false,
    placeholder: '如：专业皮肤管理师',
  },
  {
    id: 'current_income',
    label: '当前收入水平',
    required: false,
    placeholder: '如：月入3万 / 年收入50万',
  },
] as const;

// STEP4B_BUTTONS_3 · 3 按钮 · 严格 1:1 来源 spec §7.5 line 1532
export const STEP4B_BUTTON_GENERATE = '生成变现路径';
export const STEP4B_BUTTON_OPTIMIZE = '智能优化';
export const STEP4B_BUTTON_REGENERATE = '重新生成';

// STEP4B_LOADING · loading 文案
export const STEP4B_LOADING_TEXT = 'AI 正在规划你的变现路径，预计 60-120 秒...';

// STEP4B_THREE_STAGES · 3 阶梯字面锁 1:1 来源 spec §7.5 line 1546-1564
export interface Step4bStage {
  range: '0→90万' | '100万→1000万' | '1000万→1亿';
  title: string;
  duration: string;
}

export const STEP4B_THREE_STAGES: readonly Step4bStage[] = [
  {
    range: '0→90万',
    title: '积累案例与私域流量，验证培训模型',
    duration: '6-12个月',
  },
  {
    range: '100万→1000万',
    title: '扩张团队 + 标准化产品 + 多渠道引流',
    duration: '12-24个月',
  },
  {
    range: '1000万→1亿',
    title: '品牌化运营 + 资源整合 + 跨界合作',
    duration: '24-60个月',
  },
] as const;

// Step4bResult interface · structured output(继 PRD-17 US-006b pattern)
export interface Step4bResult {
  market_analysis: {
    industry: string;
    market_size: string;
    competition_level: string;
    monetization_potential: string;
  };
  three_stages: Array<{
    range: '0→90万' | '100万→1000万' | '1000万→1亿';
    title: string;
    duration: string;
    core_strategy: string;
    product_matrix: Array<{
      type: '引流品' | '信任品' | '利润品' | '后端产品';
      name: string;
      price_range: string;
      target_customer: string;
      monthly_target: string;
      monthly_revenue: string;
    }>;
    traffic_strategy: string;
    conversion_flow: string[];
    key_actions: string[];
    risks: string[];
  }>;
  revenue_structure: Array<{
    category: string;
    percent: number;
    description: string;
  }>;
  success_cases: Array<{
    name: string;
    type: string;
    journey: string;
    result: string;
    insight: string;
  }>;
}

// STEP4B_PRODUCT_TYPES_4 · 产品矩阵 4 类型字面锁
export const STEP4B_PRODUCT_TYPES_4 = ['引流品', '信任品', '利润品', '后端产品'] as const;

// STEP4B_OUTPUT_H3 · 输出区 5 H3
export const STEP4B_OUTPUT_H3_5 = [
  { id: 'market_analysis', h3Label: '1. 市场分析' },
  { id: 'three_stages', h3Label: '2. 三阶梯变现路径' },
  { id: 'revenue_structure', h3Label: '3. 收入结构' },
  { id: 'success_cases', h3Label: '4. 成功案例参考' },
  { id: 'feedback', h3Label: '5. 这个结果对你有帮助吗？' },
] as const;
```

- [ ] **AC-2**(字面双锁 · 3 阶梯 range)· `STEP4B_THREE_STAGES[0].range` 严格 1:1 = `'0→90万'`(含全角箭头 → · 中文"万"· 无空格)· `STEP4B_THREE_STAGES[1].range` = `'100万→1000万'` · `STEP4B_THREE_STAGES[2].range` = `'1000万→1亿'` · spec §7.5 line 1546/1563/1564
- [ ] **AC-3**(字面双锁 · SUBTITLE)· `STEP4B_SUBTITLE_TEMPLATE` 完整字面 = `'当前行业：{industry}。AI 将为你规划三阶梯变现路径：0→90 万、100 万→1000 万、1000 万→1 亿，每个阶梯有具体的产品设计、定价策略和成交流程。'`(spec §7.5 line 1521 严格 1:1)
- [ ] **AC-4**(命名锁)· 所有 export 命名 STEP4B_* 前缀(`B` 小写)· 共 15+ 命名 + 3 interface
- [ ] **AC-5**(类型检查)· tsc --noEmit 0 error · vitest 全 PASS

**[SHIELD] anti_patterns**:
1. ❌ **三阶梯 range 字面改写**(高风险 · D1=A 锁)· `'0万→90万'`(加了"0 万")→ ✅ `'0→90万'`(spec line 1546 严格 1:1)
2. ❌ **SUBTITLE 创意改写**(PRD-17 US-007 教训)· `'当前行业:X。AI 规划三阶梯变现'`(简化)→ ✅ `'当前行业：{industry}。AI 将为你规划三阶梯变现路径：0→90 万、100 万→1000 万、1000 万→1 亿，每个阶梯有具体的产品设计、定价策略和成交流程。'`(spec §7.5 line 1521 完整字面)
3. ❌ **产品矩阵字段名翻译**(D1=A schema 锁)· `type: 'lead'/'trust'/'profit'/'backend'`(英文)→ ✅ `type: '引流品' | '信任品' | '利润品' | '后端产品'`(spec §7.5 line 1551 中文字面)

---

### US-003: `apps/web/src/lib/constants/step5.ts` 常量(foundation)

**risk_level** · foundation
**size_hint** · medium
**depends_on** · []
**files_to_create** · `apps/web/src/lib/constants/step5.ts`(约 130 行)
**files_to_modify** · 无

**描述** · 作为 ralph 实施员 · 我需要把 Step 5 爆款选题库 page 所有字面字符串集中到一个常量文件 · 含 2 input + 2 file metadata + 5 类选题 schema(traffic/monetize/persona/cognition/case 各 20 = 100)+ structured Step5Result interface。

**背景** · spec §7.6 (line 1589-1631) + dump §2.2 line 182 · Step 5 是 PRD-18 数据密度最高 · 1 次性生成 100 选题(5 类 × 20)· 输出按 5 类 tab 展示 · 每选题卡含标题/钩子/结构/公式/平台/难度/爆款潜力星级。spec §7.6 line 1619 明确"用户点某选题 → 跳 step/7 文案生成(自动预填 lastTopic)"· 是跨 step 数据传递关键节点。

**Acceptance Criteria**:

- [ ] **AC-1**(完整代码块字面锁)· 创建 `apps/web/src/lib/constants/step5.ts`:

```typescript
/**
 * QuanQn · Step 5 爆款选题库 page 常量 — 字面锁
 * D1=A 红线 · 所有字面 1:1 来源 spec §7.6 (line 1589-1631) · 严禁改写
 * 数字锁 · STEP5_INPUTS_2.length === 2 · STEP5_FILE_UPLOADS_2.length === 2 · STEP5_CATEGORIES_5.length === 5 · STEP5_TOPICS_PER_CAT === 20
 */

// STEP5_PAGE
export const STEP5_STEP_TAG = 'STEP 05 · 爆款选题库';
export const STEP5_H1 = '爆款选题库';
export const STEP5_SUBTITLE = '输入你的行业和产品信息，还可以上传产品资料和人物介绍文档，AI 将结合这些素材一次性生成 5 大类爆款选题（流量型/变现型/人设型/认知型/案例型），每类 20 个选题，共 100 个。';

// STEP5_INPUTS_2 · 2 input 字面 1:1 来源 spec §7.6 line 1601-1602
export interface Step5Input {
  id: 'industry' | 'product';
  label: string;
  required: boolean;
  placeholder: string;
}

export const STEP5_INPUTS_2: readonly Step5Input[] = [
  {
    id: 'industry',
    label: '你的行业',
    required: true,
    placeholder: '例如：美业、餐饮、教育培训、服装...',
  },
  {
    id: 'product',
    label: '你的产品/服务',
    required: true,
    placeholder: '例如：皮肤管理项目、火锅加盟、英语培训课...',
  },
] as const;

// STEP5_FILE_UPLOADS_2 · 2 file upload 字面 1:1 来源 spec §7.6 line 1603-1604
export interface Step5FileUpload {
  id: 'product_doc' | 'persona_doc';
  label: string;
  required: boolean;
  placeholder: string;
}

export const STEP5_FILE_UPLOADS_2: readonly Step5FileUpload[] = [
  {
    id: 'product_doc',
    label: '上传产品资料',
    required: false,
    placeholder: '产品介绍、卖点、价格体系、客户案例等。支持 PDF、Word、TXT、Markdown、CSV（最大 20MB）',
  },
  {
    id: 'persona_doc',
    label: '上传人物介绍与行业',
    required: false,
    placeholder: '个人经历、行业背景、专业资质、从业故事等。支持 PDF、Word、TXT、Markdown、CSV（最大 20MB）',
  },
] as const;

// STEP5_FILE_CONFIG · 文件上传配置
export const STEP5_FILE_MAX_MB = 20;
export const STEP5_FILE_ACCEPT = '.pdf,.doc,.docx,.txt,.md,.csv';
export const STEP5_FILE_ACCEPT_LABEL = 'PDF、Word、TXT、Markdown、CSV';

// STEP5_BUTTONS
export const STEP5_BUTTON_GENERATE = '一键生成 5大类 爆款选题';
export const STEP5_BUTTON_GO_STEP7 = '生成爆款文案';

// STEP5_LOADING
export const STEP5_LOADING_TEXT = 'AI 正在生成 100 个爆款选题，预计 60-120 秒...';

// STEP5_CATEGORIES_5 · 5 类字面锁 1:1 来源 spec §7.6 line 1626-1630
export interface Step5Category {
  key: 'traffic' | 'monetize' | 'persona' | 'cognition' | 'case';
  label: string;
  description: string;
}

export const STEP5_CATEGORIES_5: readonly Step5Category[] = [
  { key: 'traffic',   label: '流量型', description: '快速获取大量流量' },
  { key: 'monetize',  label: '变现型', description: '直接转化下单' },
  { key: 'persona',   label: '人设型', description: '塑造个人 IP' },
  { key: 'cognition', label: '认知型', description: '提升用户认知' },
  { key: 'case',      label: '案例型', description: '真实成功故事' },
] as const;

export const STEP5_TOPICS_PER_CAT = 20;
export const STEP5_TOTAL_TOPICS = 100;  // 5 × 20

// Step5Topic interface · 每选题卡数据
export interface Step5Topic {
  id: string;
  category: 'traffic' | 'monetize' | 'persona' | 'cognition' | 'case';
  title: string;          // 选题标题
  hook: string;           // 钩子
  structure: string;      // 结构
  formula: string;        // 公式
  platform: '抖音' | '小红书' | '视频号' | '快手' | 'B站';
  difficulty: '简单' | '中等' | '困难';
  potential_stars: 1 | 2 | 3 | 4 | 5;  // 爆款潜力星级
}

// Step5Result interface
export interface Step5Result {
  topics: Step5Topic[];   // 100 selected topics
  generated_at: string;
}
```

- [ ] **AC-2**(字面双锁 · SUBTITLE 含完整 5 类列表)· `STEP5_SUBTITLE` 严格 1:1 = `'输入你的行业和产品信息，还可以上传产品资料和人物介绍文档，AI 将结合这些素材一次性生成 5 大类爆款选题（流量型/变现型/人设型/认知型/案例型），每类 20 个选题，共 100 个。'`(spec §7.6 line 1595 完整字面 · 全角括号)
- [ ] **AC-3**(file upload 字面双锁)· `STEP5_FILE_UPLOADS_2[0].placeholder` 严格 1:1 = `'产品介绍、卖点、价格体系、客户案例等。支持 PDF、Word、TXT、Markdown、CSV（最大 20MB）'`(spec §7.6 line 1603 完整字面 · 全角括号)
- [ ] **AC-4**(5 类 label 字面锁)· STEP5_CATEGORIES_5 5 个 label = `['流量型', '变现型', '人设型', '认知型', '案例型']` 严格 1:1(spec §7.6 line 1626-1630)
- [ ] **AC-5**(类型检查)· tsc --noEmit 0 error · vitest 全 PASS

**[SHIELD] anti_patterns**:
1. ❌ **SUBTITLE 简化为 "AI 生成爆款选题"** → ✅ 完整 1:1 spec line 1595 字面
2. ❌ **5 类 label 翻译** · `'traffic'/'monetize'/...`(英文)→ ✅ `'流量型'/'变现型'/...`(中文字面)
3. ❌ **STEP5_BUTTON_GENERATE 改写** · `'生成 100 个爆款选题'` → ✅ `'一键生成 5大类 爆款选题'`(spec line 1606 含 "一键" "5大类" 字面 · 含空格)

---

### US-004: `apps/web/src/lib/constants/step6.ts` 常量(foundation)

**risk_level** · foundation
**size_hint** · small
**depends_on** · []
**files_to_create** · `apps/web/src/lib/constants/step6.ts`(约 70 行)
**files_to_modify** · 无

**描述** · 作为 ralph 实施员 · 我需要把 Step 6 拍摄计划 page 字面字符串集中到常量文件 · 含 1 textarea(≥10 字 + 字符计数器)+ 输出 3 模块 schema(分镜/拍摄/口播)。

**背景** · spec §7.7 (line 1634-1661) + dump §2.2 line 183 · Step 6 是 PRD-18 简单单字段 page · 仅 1 textarea(必填 ≥10 字)+ 1 button + 输出 3 模块(分镜脚本 / 拍摄方案 / 口播提词器)。

**Acceptance Criteria**:

- [ ] **AC-1**(完整代码块字面锁)· 创建 `apps/web/src/lib/constants/step6.ts`:

```typescript
/**
 * QuanQn · Step 6 拍摄计划 page 常量 — 字面锁
 * D1=A 红线 · 所有字面 1:1 来源 spec §7.7 (line 1634-1661) · 严禁改写
 * 数字锁 · STEP6_TEXTAREA_MIN_CHARS === 10 · STEP6_OUTPUT_MODULES_3.length === 3
 */

// STEP6_PAGE
export const STEP6_STEP_TAG = 'STEP 06 · 生成拍摄计划';
export const STEP6_H1 = '拍摄计划';
export const STEP6_SUBTITLE = '输入你的文案内容，AI 将自动生成完整的分镜脚本、拍摄方案和口播提词器。';

// STEP6_TEXTAREA · 文案内容 必填
export interface Step6Textarea {
  id: 'copywriting_text';
  label: string;
  required: boolean;
  placeholder: string;
}
export const STEP6_TEXTAREA: Step6Textarea = {
  id: 'copywriting_text',
  label: '文案内容',
  required: true,
  placeholder: '粘贴你的短视频文案（至少 10 个字），AI 将基于文案生成完整的拍摄计划。\n\n你可以使用第七步「文案生成」功能先生成文案，再来这里生成拍摄计划。',
} as const;

// STEP6_TEXTAREA 配置
export const STEP6_TEXTAREA_MIN_CHARS = 10;
export const STEP6_CHAR_COUNTER_TEMPLATE = '已输入 {count} 字';

// STEP6_BUTTONS
export const STEP6_BUTTON_GENERATE = '生成拍摄计划';

// STEP6_LOADING
export const STEP6_LOADING_TEXT = 'AI 正在生成拍摄计划，预计 30-60 秒...';

// STEP6_OUTPUT_MODULES_3 · 输出 3 模块字面锁 1:1 来源 spec §7.7 line 1658-1660
export interface Step6OutputModule {
  id: 'storyboard' | 'shooting_plan' | 'teleprompter';
  h3Label: string;
}

export const STEP6_OUTPUT_MODULES_3: readonly Step6OutputModule[] = [
  { id: 'storyboard',     h3Label: '1. 分镜脚本' },
  { id: 'shooting_plan',  h3Label: '2. 拍摄方案' },
  { id: 'teleprompter',   h3Label: '3. 口播提词器' },
] as const;

// Step6Storyboard · 每分镜数据
export interface Step6StoryboardScene {
  shot_number: number;     // 镜头编号
  duration: string;        // 时长(如 "3-5 秒")
  scene: string;           // 场景
  framing: string;         // 景别(如 "中景" "近景")
  angle: string;           // 角度
  movement: string;        // 运镜
  emotion: string;         // 情绪
  dialogue: string;        // 台词
  action: string;          // 动作
}

// Step6Result interface
export interface Step6Result {
  storyboard: Step6StoryboardScene[];      // 分镜脚本
  shooting_plan: {                          // 拍摄方案
    props: string[];                        // 道具
    lighting: string[];                     // 灯光
    costume: string[];                      // 服装
    location: string[];                     // 场景
  };
  teleprompter: string;                     // 口播提词器(断句版文案)
}
```

- [ ] **AC-2**(字面双锁 · textarea placeholder)· `STEP6_TEXTAREA.placeholder` 严格 1:1 = `'粘贴你的短视频文案（至少 10 个字），AI 将基于文案生成完整的拍摄计划。\n\n你可以使用第七步「文案生成」功能先生成文案，再来这里生成拍摄计划。'`(spec §7.7 line 1645 完整字面 · 含 `\n\n` 换行)
- [ ] **AC-3**(字符计数 template)· `STEP6_CHAR_COUNTER_TEMPLATE` = `'已输入 {count} 字'`(spec §7.7 line 1647 完整字面)· `STEP6_TEXTAREA_MIN_CHARS = 10`
- [ ] **AC-4**(命名锁)· 共 10+ 命名 + 3 interface
- [ ] **AC-5**(类型检查)· tsc --noEmit 0 error · vitest 全 PASS

**[SHIELD] anti_patterns**:
1. ❌ **textarea placeholder 缩短** · `'粘贴文案(至少10字)'` → ✅ 完整 1:1 spec line 1645 字面(含「文案生成」「」全角引号 · 两段换行 · 句末句号)
2. ❌ **字符计数改写** · `'当前 N 字'` → ✅ `'已输入 {count} 字'`(spec line 1647)
3. ❌ **输出 3 模块 H3 改名** · `'1. 分镜表'` → ✅ `'1. 分镜脚本'`(spec line 1658 完整字面)

---

### US-005: `apps/web/src/lib/constants/step7.ts` 常量(foundation)

**risk_level** · foundation
**size_hint** · large
**depends_on** · []
**files_to_create** · `apps/web/src/lib/constants/step7.ts`(约 250 行)
**files_to_modify** · 无

**描述** · 作为 ralph 实施员 · 我需要把 Step 7 文案生成 page 字面字符串集中到常量文件 · 含 20 脚本类型(搜索过滤)+ 22 爆款元素(4 分组多选)+ 4 H4 输出 schema(辩论模板)+ 各脚本独立 schema。

**背景** · spec §7.8 (line 1665-1744) + dump §2.2 line 184(53 btn · 11 H · 333 els · PRD-18 最复杂 page)。20 脚本类型 1:1 复用 PRD-15 hotElementsZh.ts 已有的(若未含 · US-005 内补全)· 22 爆款元素分 4 组("内容钩子" / "情绪触发" / "结构强化" / "互动引导" 各 5-6 个)。辩论模板 4 H4 = `话题抛出` / `正方` / `反方` / `我的立场`(spec §7.8 line 1738-1740 字面锁)。

**Acceptance Criteria**:

- [ ] **AC-1**(完整代码块字面锁)· 创建 `apps/web/src/lib/constants/step7.ts`:

```typescript
/**
 * QuanQn · Step 7 文案生成 page 常量 — 字面锁
 * D1=A 红线 · 所有字面 1:1 来源 spec §7.8 (line 1665-1744) · 严禁改写
 * 数字锁 · STEP7_SCRIPT_TYPES_20.length === 20 · STEP7_ELEMENTS_22.length === 22 · STEP7_ELEMENT_GROUPS_4.length === 4
 */

// STEP7_PAGE
export const STEP7_STEP_TAG = 'STEP 07 · AI 智能文案生成';
export const STEP7_H1 = '文案生成';
export const STEP7_SUBTITLE = '选择脚本类型和爆款元素，输入主题，AI 将基于方法论生成深度爆款文案，支持 AI 智能修改优化。';

// STEP7_SCRIPT_TYPES_20 · 20 脚本类型字面锁
export interface Step7ScriptType {
  id: string;
  name: string;         // 脚本类型名(如 '搞辩论')
  positioning: string;  // 一句话定位
}

export const STEP7_SCRIPT_TYPES_20: readonly Step7ScriptType[] = [
  { id: 'debate',           name: '搞辩论',           positioning: '正反方激烈对撞，引发评论区站队，适合争议性话题' },
  { id: 'opinion',          name: '聊观点',           positioning: '表达个人观点，引发共鸣，适合知识分享类账号' },
  { id: 'story',            name: '讲故事',           positioning: '用真实故事打动人，情感共鸣，适合人物类账号' },
  { id: 'case_study',       name: '剖案例',           positioning: '深度拆解一个成功/失败案例，提炼可复用方法' },
  { id: 'tutorial',         name: '教方法',           positioning: '实操教学，步骤清晰，适合技能干货类' },
  { id: 'review',           name: '做测评',           positioning: '横向对比 N 个产品/方法，结论一目了然' },
  { id: 'industry_insight', name: '聊行业',           positioning: '行业内幕/趋势分析，适合 B 端/创业类' },
  { id: 'personal_growth',  name: '个人成长',         positioning: '从 0 到 1 的成长路径，激励同行人' },
  { id: 'product_intro',    name: '介绍产品',         positioning: '产品卖点 + 用户痛点 + 解决方案' },
  { id: 'live_promotion',   name: '直播预告',         positioning: '直播主题 + 福利 + 时间 + 入口' },
  { id: 'fact_check',       name: '辟谣',             positioning: '揭穿行业谣言，重塑认知' },
  { id: 'pain_point',       name: '戳痛点',           positioning: '直击用户痛点，引发"这就是我"共鸣' },
  { id: 'data_driven',      name: '用数据',           positioning: '数据图表 + 结论，专业感强' },
  { id: 'list',             name: '列清单',           positioning: 'N 个 XX 必备清单，便于收藏转发' },
  { id: 'before_after',     name: '前后对比',         positioning: '改造前/改造后强烈对比，视觉冲击大' },
  { id: 'qa',               name: '答疑',             positioning: '回答粉丝高频问题，建立专业形象' },
  { id: 'industry_secret',  name: '揭秘',             positioning: '行业内部黑幕/技巧，吸引好奇' },
  { id: 'milestone',        name: '里程碑',           positioning: '阶段性总结，强化个人 IP' },
  { id: 'behind_scenes',    name: '幕后花絮',         positioning: '展示真实工作过程，拉近距离' },
  { id: 'controversy',      name: '反常识',           positioning: '颠覆主流认知的观点，强吸睛' },
] as const;

// STEP7_ELEMENT_GROUPS_4 · 4 分组字面锁
export interface Step7ElementGroup {
  key: 'hook' | 'emotion' | 'structure' | 'interaction';
  label: string;
}

export const STEP7_ELEMENT_GROUPS_4: readonly Step7ElementGroup[] = [
  { key: 'hook',        label: '内容钩子' },
  { key: 'emotion',     label: '情绪触发' },
  { key: 'structure',   label: '结构强化' },
  { key: 'interaction', label: '互动引导' },
] as const;

// STEP7_ELEMENTS_22 · 22 爆款元素字面锁(4 组)
export interface Step7Element {
  id: string;
  group: 'hook' | 'emotion' | 'structure' | 'interaction';
  label: string;
}

export const STEP7_ELEMENTS_22: readonly Step7Element[] = [
  // 内容钩子(6)
  { id: 'question',         group: 'hook',        label: '提问开头' },
  { id: 'shock',            group: 'hook',        label: '震惊事实' },
  { id: 'contradiction',    group: 'hook',        label: '反差对比' },
  { id: 'character_quote',  group: 'hook',        label: '人物金句' },
  { id: 'data_hook',        group: 'hook',        label: '数据冲击' },
  { id: 'scenario',         group: 'hook',        label: '场景代入' },
  // 情绪触发(5)
  { id: 'anger',            group: 'emotion',     label: '愤怒共鸣' },
  { id: 'fear',             group: 'emotion',     label: '焦虑唤起' },
  { id: 'hope',             group: 'emotion',     label: '希望激励' },
  { id: 'surprise',         group: 'emotion',     label: '意外惊喜' },
  { id: 'nostalgia',        group: 'emotion',     label: '怀旧共鸣' },
  // 结构强化(6)
  { id: 'list_structure',   group: 'structure',   label: '清单结构' },
  { id: 'story_arc',        group: 'structure',   label: '故事弧线' },
  { id: 'pa_solution',      group: 'structure',   label: '问题-方案' },
  { id: 'before_after_s',   group: 'structure',   label: '前后对比' },
  { id: 'step_by_step',     group: 'structure',   label: '步骤分解' },
  { id: 'case_method',      group: 'structure',   label: '案例方法' },
  // 互动引导(5)
  { id: 'comment_question', group: 'interaction', label: '评论提问' },
  { id: 'choice_voting',    group: 'interaction', label: '选择投票' },
  { id: 'experience_share', group: 'interaction', label: '经验分享' },
  { id: 'opinion_invite',   group: 'interaction', label: '观点邀请' },
  { id: 'follow_action',    group: 'interaction', label: '行动召唤' },
] as const;

// STEP7_BUTTONS_4 · 4 按钮字面 1:1 来源 spec §7.8 line 1710-1712
export const STEP7_BUTTON_GENERATE = '生成爆款文案';
export const STEP7_BUTTON_OPTIMIZE = 'AI 优化文案';
export const STEP7_BUTTON_GO_MY_TOPICS = '我的选题库';
export const STEP7_BUTTON_GO_STEP5 = '爆款选题';

// STEP7_SEARCH · 脚本类型搜索 input
export const STEP7_SEARCH_PLACEHOLDER = '搜索脚本...';

// STEP7_TEXTAREA · 文案主题 必填
export interface Step7Textarea {
  id: 'topic';
  label: string;
  required: boolean;
  placeholder: string;
}
export const STEP7_TEXTAREA: Step7Textarea = {
  id: 'topic',
  label: '文案主题',
  required: true,
  placeholder: '输入你的文案主题，如：美容院如何用抖音获客100个精准客户...',
} as const;

// STEP7_OPTIMIZE_INPUT · 优化方向 可选
export const STEP7_OPTIMIZE_LABEL = '优化方向';
export const STEP7_OPTIMIZE_PLACEHOLDER = '输入优化方向（可选），如：更有吸引力、增加互动感、更口语化...';

// STEP7_LOADING
export const STEP7_LOADING_TEXT = 'AI 正在生成爆款文案，预计 30-60 秒...';
export const STEP7_OPTIMIZE_LOADING_TEXT = 'AI 正在优化文案，预计 20-40 秒...';

// STEP7_ELEMENT_COUNTER_TEMPLATE · 元素计数
export const STEP7_ELEMENT_COUNTER_TEMPLATE = '选择爆款元素（已选 {count} 个）';

// STEP7_SCRIPT_DISPLAY_TEMPLATE · 显示当前脚本
export const STEP7_SCRIPT_DISPLAY_TEMPLATE = '当前脚本：{name} - {positioning}';

// STEP7_SCRIPT_SCHEMA_DEBATE · 搞辩论模板 4 H4 字面锁 1:1 来源 spec §7.8 line 1738-1740
export interface Step7DebateResult {
  title: string;            // 【标题】
  topic_hook: string;       // 话题抛出
  pros_arguments: string;   // 正方
  cons_arguments: string;   // 反方
  my_stance: string;        // 我的立场
  comment_guide: string;    // 评论区引导
  topic_tags: string[];     // 话题标签 #xxx
}

export const STEP7_DEBATE_H4_4 = [
  { id: 'topic_hook',     h4Label: '话题抛出' },
  { id: 'pros_arguments', h4Label: '正方' },
  { id: 'cons_arguments', h4Label: '反方' },
  { id: 'my_stance',      h4Label: '我的立场' },
] as const;

// Step7Result · 各脚本独立 schema · 默认 debate 模板
export interface Step7Result {
  script_type: string;                  // 脚本类型 id
  title: string;                        // 文案标题
  body: Step7DebateResult | object;     // 各脚本类型独立 schema · default = debate
}
```

- [ ] **AC-2**(字面双锁 · 20 脚本类型 name)· STEP7_SCRIPT_TYPES_20 20 个 name 严格 1:1 来源 spec §7.8 line 1687(`'聊观点'` 示例)+ 推断完整 20 类(若 spec 未列全 · 用 dump §2.2 line 184 或推断业界主流)· 顺序锁:debate=第 1 个(因 spec line 1730 用辩论做示例 schema)
- [ ] **AC-3**(字面双锁 · 22 爆款元素 label)· STEP7_ELEMENTS_22 22 个 label 严格 1:1 + 4 分组拓扑(内容钩子 6 / 情绪触发 5 / 结构强化 6 / 互动引导 5 = 22)
- [ ] **AC-4**(辩论模板 4 H4 字面锁)· STEP7_DEBATE_H4_4 4 个 h4Label 严格 1:1 来源 spec §7.8 line 1738-1740 = `['话题抛出', '正方', '反方', '我的立场']` · 不允许加 "H4. " 前缀 · 不允许翻译
- [ ] **AC-5**(SUBTITLE 字面)· `STEP7_SUBTITLE` 严格 1:1 = `'选择脚本类型和爆款元素，输入主题，AI 将基于方法论生成深度爆款文案，支持 AI 智能修改优化。'`(spec §7.8 line 1671)
- [ ] **AC-6**(命名锁)· 共 20+ 命名 + 4 interface
- [ ] **AC-7**(类型检查)· tsc --noEmit 0 error · vitest 全 PASS

**[SHIELD] anti_patterns**:
1. ❌ **STEP7_SCRIPT_TYPES_20 数量不足 20**(简化为 10)→ ✅ 必须 20 个(spec line 1675 明确"20 选 1")· 若 spec 仅列示例 · 推断 20 类业界主流名
2. ❌ **辩论模板 4 H4 加前缀** · `'H4. 话题抛出'`(加 "H4. ")→ ✅ `'话题抛出'`(spec line 1738 严格 1:1)
3. ❌ **22 元素 label 英文** · `['Question', 'Shock', ...]`(英文)→ ✅ 中文 label(spec §7.8 line 1689 推断)
4. ❌ **元素计数 template 改写** · `'选择 N 个元素'` → ✅ `'选择爆款元素（已选 {count} 个）'`(spec line 1693 严格 1:1 + 全角括号)

---

### US-006: `apps/web/src/lib/constants/step8.ts` 常量(foundation)

**risk_level** · foundation
**size_hint** · small
**depends_on** · []
**files_to_create** · `apps/web/src/lib/constants/step8.ts`(约 100 行)
**files_to_modify** · 无

**描述** · 作为 ralph 实施员 · 我需要把 Step 8 直播策划 page 字面字符串集中到常量文件 · 含 2 子功能(生成方案 + AI 优化话术 · 各自独立 form)+ 5 平台 + 3 经验 + 6 输出模块。

**背景** · spec §7.9 (line 1748-1786) + dump §2.2 line 185 · Step 8 含 2 子功能 H3 切换 · 子功能 1 含 1 textarea(产品)+ 1 input(受众)+ 1 radio(平台 5 选 1)+ 1 radio(经验 3 选 1)+ 1 button 生成方案 · 子功能 2 含 1 textarea(话术 ≥10 字)+ 1 input(优化目标 可选)+ 1 button AI 优化。

**Acceptance Criteria**:

- [ ] **AC-1**(完整代码块字面锁)· 创建 `apps/web/src/lib/constants/step8.ts`:

```typescript
/**
 * QuanQn · Step 8 直播策划 page 常量 — 字面锁
 * D1=A 红线 · 所有字面 1:1 来源 spec §7.9 (line 1748-1786) · 严禁改写
 * 数字锁 · STEP8_SUBFUNCTIONS_2.length === 2 · STEP8_PLATFORMS_5.length === 5 · STEP8_EXPERIENCE_3.length === 3 · STEP8_OUTPUT_MODULES_6.length === 6
 */

// STEP8_PAGE
export const STEP8_STEP_TAG = 'STEP 08 · 直播策划';
export const STEP8_H1 = '直播策划';
export const STEP8_SUBTITLE_TEMPLATE = '当前行业：{industry}。AI 将生成完整的直播方案，包含详细话术、引流策略、互动设计，并支持 AI 优化直播脚本。';

// STEP8_SUBFUNCTIONS_2 · 2 子功能字面 1:1 来源 spec §7.9 line 1755 + 1766
export interface Step8SubFunction {
  key: 'generate_plan' | 'optimize_script';
  h3Label: string;
}

export const STEP8_SUBFUNCTIONS_2: readonly Step8SubFunction[] = [
  { key: 'generate_plan',     h3Label: '子功能 1：生成直播方案' },
  { key: 'optimize_script',   h3Label: '子功能 2：AI 优化直播话术' },
] as const;

// 子功能 1 · 生成直播方案
export interface Step8GeneratePlanInput {
  id: 'product_info' | 'target_audience';
  label: string;
  required: boolean;
  type: 'input' | 'textarea';
  placeholder: string;
}

export const STEP8_GENERATE_PLAN_TEXTAREA: Step8GeneratePlanInput = {
  id: 'product_info',
  label: '产品/服务信息',
  required: false,
  type: 'textarea',
  placeholder: '描述你要在直播中推广的产品或服务...',
} as const;

export const STEP8_GENERATE_PLAN_INPUT: Step8GeneratePlanInput = {
  id: 'target_audience',
  label: '目标受众',
  required: false,
  type: 'input',
  placeholder: '如：25-40岁女性...',
} as const;

// STEP8_PLATFORMS_5 · 5 平台字面 1:1 来源 spec §7.9 line 1761
// 复用 STEP3 platform · 但 Step 8 需要保留独立 label 引用以便测试隔离
import { STEP3_PLATFORMS_5 } from './step3';
export const STEP8_PLATFORMS_5 = STEP3_PLATFORMS_5;
export const STEP8_PLATFORM_RADIO_LABEL = '直播平台';

// STEP8_EXPERIENCE_3 · 3 经验字面 1:1 来源 spec §7.9 line 1762
export interface Step8Experience {
  key: 'novice' | 'experienced' | 'expert';
  label: string;
}

export const STEP8_EXPERIENCE_3: readonly Step8Experience[] = [
  { key: 'novice',      label: '新手 · 刚开始做直播' },
  { key: 'experienced', label: '有经验 · 有一定直播经验' },
  { key: 'expert',      label: '资深 · 直播经验丰富' },
] as const;
export const STEP8_EXPERIENCE_RADIO_LABEL = '直播经验';

// STEP8_BUTTON_GENERATE_PLAN
export const STEP8_BUTTON_GENERATE_PLAN = '生成直播方案';

// 子功能 2 · AI 优化直播话术
export const STEP8_OPTIMIZE_TEXTAREA: Step8GeneratePlanInput = {
  id: 'product_info',  // reuse id
  label: '直播话术脚本',
  required: true,
  type: 'textarea',
  placeholder: '粘贴你的直播话术脚本（至少 10 个字），AI 将深度优化话术表达、互动设计和转化逻辑...',
} as const;

export const STEP8_OPTIMIZE_INPUT: Step8GeneratePlanInput = {
  id: 'target_audience',  // reuse id
  label: '优化目标',
  required: false,
  type: 'input',
  placeholder: '优化目标（可选），如：提升互动率、增强转化、更有感染力...',
} as const;

export const STEP8_BUTTON_OPTIMIZE_SCRIPT = 'AI 优化话术';
export const STEP8_OPTIMIZE_MIN_CHARS = 10;
export const STEP8_OPTIMIZE_CHAR_COUNTER_TEMPLATE = '已输入 {count} 字';

// STEP8_LOADING
export const STEP8_GENERATE_LOADING_TEXT = 'AI 正在生成直播方案，预计 60-120 秒...';
export const STEP8_OPTIMIZE_LOADING_TEXT = 'AI 正在优化话术，预计 30-60 秒...';

// STEP8_OUTPUT_MODULES_6 · 子功能 1 输出 6 模块字面 1:1 来源 spec §7.9 line 1782
export interface Step8OutputModule {
  id: 'opening' | 'interaction' | 'deal' | 'closing' | 'traffic' | 'engagement';
  h3Label: string;
}

export const STEP8_OUTPUT_MODULES_6: readonly Step8OutputModule[] = [
  { id: 'opening',     h3Label: '1. 开场话术' },
  { id: 'interaction', h3Label: '2. 中场互动' },
  { id: 'deal',        h3Label: '3. 成交话术' },
  { id: 'closing',     h3Label: '4. 收尾' },
  { id: 'traffic',     h3Label: '5. 引流策略' },
  { id: 'engagement',  h3Label: '6. 互动设计' },
] as const;

// Step8Result interface
export interface Step8Result {
  sub_function: 'generate_plan' | 'optimize_script';
  generate_plan?: {
    opening: string;
    interaction: string;
    deal: string;
    closing: string;
    traffic: string;
    engagement: string;
  };
  optimize_script?: {
    optimized_text: string;       // 优化后文案
    optimization_notes: string;   // 优化说明
  };
}
```

- [ ] **AC-2**(字面双锁 · SUBTITLE)· `STEP8_SUBTITLE_TEMPLATE` 严格 1:1 = `'当前行业：{industry}。AI 将生成完整的直播方案，包含详细话术、引流策略、互动设计，并支持 AI 优化直播脚本。'`(spec §7.9 line 1753)
- [ ] **AC-3**(2 子功能 H3 字面双锁)· `STEP8_SUBFUNCTIONS_2[0].h3Label` = `'子功能 1：生成直播方案'`(全角冒号)· `STEP8_SUBFUNCTIONS_2[1].h3Label` = `'子功能 2：AI 优化直播话术'`(spec line 1755 + 1766 严格 1:1)
- [ ] **AC-4**(3 经验 label 字面双锁)· STEP8_EXPERIENCE_3 3 个 label 严格 1:1 = `['新手 · 刚开始做直播', '有经验 · 有一定直播经验', '资深 · 直播经验丰富']`(spec line 1762 含中点 · )
- [ ] **AC-5**(6 输出模块字面锁)· STEP8_OUTPUT_MODULES_6 6 个 h3Label 严格 1:1 来源 spec line 1782 = `['1. 开场话术', '2. 中场互动', '3. 成交话术', '4. 收尾', '5. 引流策略', '6. 互动设计']`
- [ ] **AC-6**(类型检查)· tsc --noEmit 0 error · vitest 全 PASS

**[SHIELD] anti_patterns**:
1. ❌ **SUBTITLE 创意改写**(PRD-17 US-007 教训)· `'当前行业:X。AI 生成直播方案'`(简化)→ ✅ `'当前行业：{industry}。AI 将生成完整的直播方案，包含详细话术、引流策略、互动设计，并支持 AI 优化直播脚本。'`(完整字面)
2. ❌ **3 经验 label 去中点** · `'新手, 刚开始做直播'`(逗号)→ ✅ `'新手 · 刚开始做直播'`(中点 · 含半角空格)
3. ❌ **6 输出模块 H3 改名** · `'1. 开场白'` → ✅ `'1. 开场话术'`(spec line 1782 严格 1:1)

---

### US-007: `apps/web/src/pages/step/Step4.tsx`(Step 4 page)

**risk_level** · medium
**size_hint** · medium
**depends_on** · [US-001]
**files_to_create** · `apps/web/src/pages/step/Step4.tsx`(约 280 行)
**files_to_modify** · `apps/web/src/router.tsx`(若需 lazy load · 否则无)

**描述** · 作为 IP 起号用户 · 我需要在 Step 4 page 选平台 + 填粉丝量/目标/情况 + 生成执行计划 · 输出含每日任务/每周里程碑/阶段 KPI · 让我清楚每天该做什么。

**背景** · spec §7.4 (line 1487-1513)· Step 4 是 PRD-18 简单 page · 1 form + 1 输出 · 数据从 acc_step1 读 industry · 写到 acc_step4。

**Acceptance Criteria**:

- [ ] **AC-1**(page 整体布局)· `apps/web/src/pages/step/Step4.tsx` 实现:
  - 顶部 `STEP4_STEP_TAG = 'STEP 04 · 制定执行计划'` step 标签(font-rajdhani)
  - H1 = `STEP4_H1 = '执行计划'`(font-orbitron 大写 · text-primary)
  - 副标 = `STEP4_SUBTITLE_TEMPLATE` 替换 `{industry}` 为 `acc_step1` industry(若无 fallback "你的行业")
  - form glass-card · 含:
    - radio 5 选 1(`STEP4_RADIO_LABEL` = '选择平台' · 必填)· options 来自 `STEP4_PLATFORMS_5`(emoji + 中文)
    - input × 2(粉丝量 + 目标 · 来自 `STEP4_INPUTS_3` 前 2 项)
    - textarea × 1(情况 · 来自 `STEP4_INPUTS_3` 第 3 项)
    - 主 CTA button = `STEP4_BUTTON_GENERATE = '生成执行计划'` · disabled 当 radio 未选
  - 输出区(generation 完成后显示)· 3 H3 = `STEP4_OUTPUT_H3_3` · 每 H3 内对应数据 + 复制按钮
- [ ] **AC-2**(三态组件)· 使用 PRD-17 已建 `LoadingState` / `ErrorState` / `EmptyState`:
  - mockResult 生成期间 `<LoadingState message={STEP4_LOADING_TEXT} />`
  - mockResult 报错 `<ErrorState message="生成失败 · 请重试" onRetry={...} />`
  - 表单未填或 generation 未启动 `<EmptyState />`
- [ ] **AC-3**(structured mockResult 模式)· 定义 `Step4Result` interface(from US-001 step4.ts)+ `generateMockResult(formData: Step4FormData): Step4Result` 函数 · 内置 setTimeout 2-3 秒模拟生成延迟 · 数据 = 3 H3 各 3-5 条 mock(每日任务 8 条 + 每周里程碑 4 周 + 阶段 KPI 3 阶段)
- [ ] **AC-4**(跨 step 数据传递)· 进入 page 时 `JSON.parse(localStorage.getItem('acc_step1') ?? '{}')` 读 industry 注入 SUBTITLE · 提交 form 后 `localStorage.setItem('acc_step4', JSON.stringify({formData, result}))` 写入(LD-009 acc_ namespace · 严格隔离)
- [ ] **AC-5**(零 hardcode 字面)· grep 验证 · `Step4.tsx` 中所有显示文字 1:1 来自 `step4.ts` import · 0 hardcode `'生成执行计划'` / `'执行计划'` / `'选择平台'` 等 · 全用 `{STEP4_BUTTON_GENERATE}` `{STEP4_H1}` `{STEP4_RADIO_LABEL}` 等(plan-check §2.6.21 检查)
- [ ] **AC-6**(零回归)· vitest 全 PASS(70+ tests · 含 PRD-17 已建)· tsc 0 error · agent-browser 打开 `/step/4` · 看到 H1 + form + button · 选平台 + 填字段 + 点 button + 等 2-3 秒看到输出 · localStorage 写入 acc_step4 · 无 console error
- [ ] **AC-7**(D4=B 颜色锁)· 0 `from-violet` / `text-violet` / `border-violet` / `from-amber` / `bg-amber` 引入 · 主色用 `from-primary` / `text-primary` / `border-primary` · 0 中文颜色措辞("紫色"/"金色"/"红色")在 Step4.tsx 注释或代码 hardcode

**[SHIELD] anti_patterns**:
1. ❌ **D4=B 紫色字面读**(PRD-16 US-003 reject · 1 reject + 1 iter · 80 min 损失)· `<Button className="bg-gradient-to-r from-violet-600 to-violet-400">` → ✅ `<Button className="bg-gradient-to-r from-primary to-primary/80">`
2. ❌ **hardcode 中文字面**(PRD-17 US-008 reject · 1 reject)· `<Button>生成执行计划</Button>`(hardcode)→ ✅ `<Button>{STEP4_BUTTON_GENERATE}</Button>`(常量 import)
3. ❌ **跨 step localStorage 没用 acc_ 前缀**(LD-009 红线)· `localStorage.setItem('step4', ...)` → ✅ `localStorage.setItem('acc_step4', ...)`

---

### US-008: `apps/web/src/pages/step/Step4b.tsx`(Step 4b page)

**risk_level** · high
**size_hint** · medium-large
**depends_on** · [US-002]
**files_to_create** · `apps/web/src/pages/step/Step4b.tsx`(约 480 行)+ `apps/web/src/components/step4b/Step4bOutputContent.tsx`(约 240 行 · 复用 PRD-17 US-006b pattern · 拆 page + output 组件)
**files_to_modify** · 无

**描述** · 作为 IP 起号用户 · 我需要在 Step 4b page 填产品描述 + 受众/IP 定位/收入 + 生成变现路径 · 输出 3 阶梯变现路径(0→90万/100万→1000万/1000万→1亿)+ 收入结构 + 成功案例 + 支持 [生成]/[智能优化]/[重新生成]。

**背景** · spec §7.5 (line 1516-1585)· Step 4b 是 PRD-18 信息密度最高 page · 输出含 3 阶梯卡(每张折叠展开)+ 4 类产品矩阵 + 收入结构 + 案例。

**Acceptance Criteria**:

- [ ] **AC-1**(page 整体布局)· `Step4b.tsx` 实现:
  - 顶部 `STEP4B_STEP_TAG` + H1 `STEP4B_H1` + SUBTITLE_TEMPLATE 替换 `{industry}`
  - form glass-card · 含:
    - textarea × 1 必填(产品描述 · `STEP4B_TEXTAREA`)
    - input × 3(受众/IP 定位/收入水平 · `STEP4B_INPUTS_3`)
    - 3 按钮(`STEP4B_BUTTON_GENERATE` / `STEP4B_BUTTON_OPTIMIZE` / `STEP4B_BUTTON_REGENERATE`)
  - 输出区(`Step4bOutputContent` 组件)· 5 H3 = `STEP4B_OUTPUT_H3_5`:
    - 1. 市场分析(4 字段 InfoCard 渲染)
    - 2. 三阶梯变现路径(3 折叠卡 + 每卡含产品矩阵 + 流量策略 + 转化流程 + 关键动作 + 风险)
    - 3. 收入结构(list 渲染 + percent · 简化为 list · 不引入 chart 库)
    - 4. 成功案例参考(list 渲染)
    - 5. 反馈区("这个结果对你有帮助吗？"+ 👍 👎 button · 仅 UI · 不实际反馈)
- [ ] **AC-2**(三态组件 + structured mockResult)· 同 US-007 pattern · 定义 `Step4bResult` interface(from US-002 step4b.ts)+ `generateMockResult(formData)` 函数 · 内置 setTimeout 3-5 秒 · mock 数据含 3 阶梯各完整字段
- [ ] **AC-3**(3 按钮交互)·
  - `STEP4B_BUTTON_GENERATE` · 仅在未生成时 enabled · 点击触发 mock
  - `STEP4B_BUTTON_OPTIMIZE` · 仅在已生成时 enabled · 点击触发 mock 优化(setTimeout 2-3 秒 · 修改 mock 数据)
  - `STEP4B_BUTTON_REGENERATE` · 仅在已生成时 enabled · 点击触发 mock 重新生成
- [ ] **AC-4**(三阶梯卡 framer-motion)· 3 卡入场动画 · `motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: i*0.1}}` · 折叠展开用 `<Collapsible>` shadcn
- [ ] **AC-5**(跨 step 数据传递)· 进入 page 时读 acc_step1 industry · 写 acc_step4b
- [ ] **AC-6**(零 hardcode + D4=B 锁 + 零回归)· grep 验证 0 hardcode 中文字面 · 0 violet/amber 引入 · vitest PASS · tsc 0 error · agent-browser /step/4b 完整 flow

**[SHIELD] anti_patterns**:
1. ❌ **3 阶梯 range 字面读错**(D1=A 字面锁)· `<h4>0万→90万</h4>`(加了"0 万")→ ✅ `<h4>{STEP4B_THREE_STAGES[0].range}</h4>`(常量 import · = `'0→90万'`)
2. ❌ **产品矩阵 4 类型翻译**(D1=A schema 锁)· `type === 'lead'` → ✅ `type === '引流品'`(中文字面 1:1)
3. ❌ **收入结构引入 chart 库**(scope creep · LD-170)· `import { PieChart } from 'recharts'` → ✅ 用 list 渲染 + percent 数字 + 简单 progress bar
4. ❌ **D4=B 紫色字面读** · `from-violet-600` → ✅ `from-primary`
5. ❌ **hardcode 中文字面** · `<Button>生成变现路径</Button>` → ✅ `<Button>{STEP4B_BUTTON_GENERATE}</Button>`

---

### US-009: `apps/web/src/pages/step/Step5.tsx`(Step 5 page)

**risk_level** · high
**size_hint** · medium-large
**depends_on** · [US-003]
**files_to_create** · `apps/web/src/pages/step/Step5.tsx`(约 450 行)+ `apps/web/src/components/step5/Step5TopicGrid.tsx`(约 180 行 · 100 选题 grid + 5 类 tab 切换)+ `apps/web/src/components/step5/Step5FileUpload.tsx`(约 100 行 · FileReader stub)
**files_to_modify** · 无

**描述** · 作为 IP 起号用户 · 我需要在 Step 5 page 填行业 + 产品 + 可选上传 2 个文档 · 一次性生成 5 类 × 20 = 100 个爆款选题 · 输出按 5 类 tab 展示 · 每选题卡含标题/钩子/结构/公式/平台/难度/星级 · 点击某选题跳 Step 7 自动预填 lastTopic。

**背景** · spec §7.6 (line 1589-1631)· Step 5 是 PRD-18 数据密度最高 · 1 次生成 100 选题 · file upload 当 FileReader stub(LD-170 · 不真上传)· 跳 step7 是关键跨 step 链路(spec line 1619)。

**Acceptance Criteria**:

- [ ] **AC-1**(page 布局 + form)· `Step5.tsx`:
  - 顶部 `STEP5_STEP_TAG` + H1 `STEP5_H1` + SUBTITLE `STEP5_SUBTITLE`
  - form glass-card 含:
    - input × 2 必填(行业/产品 · `STEP5_INPUTS_2`)
    - file upload × 2 可选(`STEP5_FILE_UPLOADS_2`)
    - 主 CTA `STEP5_BUTTON_GENERATE`
- [ ] **AC-2**(file upload stub)· `Step5FileUpload.tsx`:
  - `<Input type="file" accept={STEP5_FILE_ACCEPT}>` · 接受 PDF/Word/TXT/MD/CSV
  - 用户选文件后 · `FileReader.readAsText()` 拿 metadata(name/size/type)· 不上传到后端
  - 显示 "已选文件:{name} ({size}KB)" · size > 20MB 显示错误 + reject
  - 文件 metadata 存到 component state · 不持久化 · 不发请求
- [ ] **AC-3**(100 选题 grid)· `Step5TopicGrid.tsx`:
  - 5 类 Tab 切换(`STEP5_CATEGORIES_5` · label = '流量型' / '变现型' / '人设型' / '认知型' / '案例型')
  - 每 tab 内 grid 渲染 20 选题卡 · 共 100
  - 每卡显示:title / hook / structure / formula / platform emoji / difficulty / 星级(⭐ × N)
  - 点击某选题 · 写 `localStorage.setItem('acc_step5_selected_topic', JSON.stringify(topic))` + 跳转 `/step/7`(spec line 1619 关键链路)
- [ ] **AC-4**(structured mockResult)· `generateMockResult(formData): Step5Result` 内置 setTimeout 3-5 秒 · 生成 100 选题 mock(5 类 × 20 各异)
- [ ] **AC-5**(跨 step 数据传递)·
  - 读 acc_step1 industry 注入预填(input "你的行业")
  - 写 acc_step5(form + result)
  - 写 acc_step5_selected_topic(用户点击某选题时)
- [ ] **AC-6**(三态组件)· LoadingState / ErrorState / EmptyState 复用
- [ ] **AC-7**(零 hardcode + D4=B + 零回归)· vitest PASS · tsc 0 error · agent-browser /step/5 · 完整 flow

**[SHIELD] anti_patterns**:
1. ❌ **file upload 真上传后端**(LD-170 红线 · 1.0 不接后端 LLM)· `fetch('/api/upload', {body: file})` → ✅ `FileReader.readAsText(file)` · 不上传
2. ❌ **跳 step 7 没写 acc_step5_selected_topic**(跨 step 链路断)· 直接 `navigate('/step/7')` → ✅ 先 `localStorage.setItem('acc_step5_selected_topic', JSON.stringify(topic))` + 再 navigate
3. ❌ **5 类 label 翻译**(D1=A 字面锁)· `'Traffic'` → ✅ `'流量型'`(中文字面)
4. ❌ **D4=B 紫色字面读** · 同 US-007 反例
5. ❌ **hardcode 中文字面** · 同 US-007 反例

---

### US-010: `apps/web/src/pages/step/Step6.tsx`(Step 6 page)

**risk_level** · medium
**size_hint** · medium
**depends_on** · [US-004]
**files_to_create** · `apps/web/src/pages/step/Step6.tsx`(约 280 行)
**files_to_modify** · 无

**描述** · 作为 IP 起号用户 · 我需要在 Step 6 page 粘贴文案(≥10 字)· 生成拍摄计划 · 输出含分镜脚本 + 拍摄方案 + 口播提词器 · 让我可以直接按计划拍摄。

**背景** · spec §7.7 (line 1634-1661)· Step 6 简单 page · 1 textarea + 1 button + 3 模块输出 · 字符计数器关键 UX(≥10 字才能触发生成)。

**Acceptance Criteria**:

- [ ] **AC-1**(page 布局)· `Step6.tsx`:
  - 顶部 `STEP6_STEP_TAG` + H1 `STEP6_H1` + SUBTITLE `STEP6_SUBTITLE`
  - form glass-card · 1 textarea(`STEP6_TEXTAREA` · placeholder 含两段换行)
  - 字符计数器 · `'已输入 {count} 字'` 替换 count 为当前字符数 · text-secondary
  - 主 CTA `STEP6_BUTTON_GENERATE = '生成拍摄计划'` · disabled 当 textarea 字数 < `STEP6_TEXTAREA_MIN_CHARS = 10`
  - 输出区 3 H3 = `STEP6_OUTPUT_MODULES_3`:
    - 1. 分镜脚本(list of `Step6StoryboardScene` · 每镜头表格渲染)
    - 2. 拍摄方案(4 子项 list · 道具/灯光/服装/场景)
    - 3. 口播提词器(预格式化 text · 断句版)
- [ ] **AC-2**(字符计数器 + disabled 逻辑)· `<textarea onChange={(e) => setText(e.target.value)}>` + `<span>{STEP6_CHAR_COUNTER_TEMPLATE.replace('{count}', String(text.length))}</span>` + `<Button disabled={text.length < STEP6_TEXTAREA_MIN_CHARS}>`
- [ ] **AC-3**(可选预填)· 进入 page 时读 `acc_step7_result.body.text`(若存在)· 自动预填 textarea(spec §7.7 line 1645 明确"使用第七步生成文案再来这里")· 用户可手动改
- [ ] **AC-4**(structured mockResult + 跨 step 链)· `generateMockResult(text): Step6Result` 内置 setTimeout 2-3 秒 · mock 5 镜头 + 拍摄方案 + 口播 · 写 acc_step6
- [ ] **AC-5**(三态组件)· LoadingState / ErrorState / EmptyState 复用
- [ ] **AC-6**(零 hardcode + D4=B + 零回归)· vitest PASS · tsc 0 error · agent-browser /step/6 · 字数 < 10 时 button disabled · ≥ 10 后 enabled · 点击后看到 3 模块输出

**[SHIELD] anti_patterns**:
1. ❌ **字符计数 template 改写** · `'当前 {count} 字'` → ✅ `'已输入 {count} 字'`(常量 1:1)
2. ❌ **MIN_CHARS 写成 5 或其他** · `disabled={text.length < 5}` → ✅ `disabled={text.length < STEP6_TEXTAREA_MIN_CHARS}`(= 10 · 常量 import)
3. ❌ **3 输出模块 H3 改名** · `'1. 分镜表'` → ✅ `'1. 分镜脚本'`(`STEP6_OUTPUT_MODULES_3[0].h3Label` 1:1)
4. ❌ **textarea placeholder 缩短** · spec §7.7 line 1645 含两段换行 · 严禁去 `\n\n`
5. ❌ **D4=B 紫色字面 + hardcode 中文字面** · 同 US-007

---

### US-011a: `apps/web/src/pages/step/Step7.tsx` form(Step 7 form 部分)

**risk_level** · high
**size_hint** · medium
**depends_on** · [US-005]
**files_to_create** · `apps/web/src/pages/step/Step7.tsx`(约 350 行 form 部分 · output 部分留 US-011b)+ `apps/web/src/components/step7/Step7ScriptTypeSearch.tsx`(约 120 行 · 20 脚本搜索过滤)+ `apps/web/src/components/step7/Step7ElementMultiSelect.tsx`(约 130 行 · 22 元素 4 分组多选)
**files_to_modify** · 无

**描述** · 作为 IP 起号用户 · 我需要在 Step 7 page 选脚本类型(20 选 1 含搜索)+ 选爆款元素(22 选 N 含 4 分组)+ 输入主题 + 选优化方向 · 提交生成爆款文案 · 这是 form 部分(output 留 US-011b)。

**背景** · spec §7.8 (line 1665-1744)· Step 7 是 PRD-18 最复杂 page(53 btn / 333 els)· 拆为 form(US-011a)+ output(US-011b)防 large 风险。20 脚本类型搜索 + 22 元素多选是 UX 重点。

**Acceptance Criteria**:

- [ ] **AC-1**(page 布局)· `Step7.tsx`:
  - 顶部 `STEP7_STEP_TAG` + H1 `STEP7_H1` + SUBTITLE `STEP7_SUBTITLE`
  - form glass-card 4 主区:
    - 1. 选择脚本类型(20 选 1)· 上方 search input(`STEP7_SEARCH_PLACEHOLDER = '搜索脚本...'`)+ 下方 grid 20 卡(name + positioning)· 选中卡 border-primary/50
    - 2. 选择爆款元素(22 选 N · 4 分组)· 顶部计数 `STEP7_ELEMENT_COUNTER_TEMPLATE` 替换 `{count}` 为已选数 · 4 分组 H4 + 每组 chip multi-select
    - 3. 文案主题输入(textarea · `STEP7_TEXTAREA` · 必填)· 上方显示 `STEP7_SCRIPT_DISPLAY_TEMPLATE` 替换 `{name}` `{positioning}`
    - 4. AI 智能优化(input · `STEP7_OPTIMIZE_LABEL` + `STEP7_OPTIMIZE_PLACEHOLDER` · 可选)
  - 4 按钮:
    - 主 `STEP7_BUTTON_GENERATE = '生成爆款文案'`(主色 · disabled 当主题未填)
    - 优化 `STEP7_BUTTON_OPTIMIZE = 'AI 优化文案'`(次色 · disabled 当未生成)
    - 跳 `STEP7_BUTTON_GO_MY_TOPICS = '我的选题库'` · `STEP7_BUTTON_GO_STEP5 = '爆款选题'`(text-only)
- [ ] **AC-2**(脚本类型搜索)· `Step7ScriptTypeSearch.tsx`:
  - input filter 实时过滤 STEP7_SCRIPT_TYPES_20 by name + positioning(case-insensitive)
  - 20 卡 grid(2 列 mobile · 4 列 desktop)
  - 选中卡 +border-primary +shadow + 全局状态记 selected_script_id
  - 默认选中第 1 个(debate)
- [ ] **AC-3**(22 元素多选)· `Step7ElementMultiSelect.tsx`:
  - 按 `STEP7_ELEMENT_GROUPS_4` 4 组渲染 H4 + 每组下方 chip grid
  - 每 chip 点击切换 selected/unselected 状态(背景色变化)
  - 顶部 sticky 计数 `'选择爆款元素（已选 {count} 个）'`
  - 默认 0 选 · 用户可选 0-22 个
- [ ] **AC-4**(跨 step 预填)· 进入 page 时:
  - 读 `acc_step5_selected_topic`(若存在)· 预填主题 textarea(spec §7.6 line 1619)
  - 读 acc_step7(若存在)· 预填脚本类型/元素/主题/结果(spec §7.8 line 1717)
- [ ] **AC-5**(form 提交 → mockResult 占位)· 主 CTA click 触发 `setIsGenerating(true)` + 调 `generateMockResult(formData)` · 输出区由 US-011b 实现(本 US 只 form + 占位 button click handler)
- [ ] **AC-6**(零 hardcode + D4=B + 零回归)· vitest PASS · tsc 0 error · agent-browser /step/7 · 选脚本 + 选元素 + 填主题 + 看到 button enabled

**[SHIELD] anti_patterns**:
1. ❌ **20 脚本类型简化为 10** · STEP7_SCRIPT_TYPES_20 必须 20 个(spec line 1675)
2. ❌ **22 元素多选用 radio**(只能单选)· `<RadioGroup>` → ✅ chip click toggle(多选)
3. ❌ **元素计数 template 改写** · `'已选 N 个元素'` → ✅ `'选择爆款元素（已选 {count} 个）'`(spec line 1693 完整字面)
4. ❌ **搜索 placeholder 改写** · `'搜索脚本类型'` → ✅ `'搜索脚本...'`(spec line 1679 含 "..." 字面)
5. ❌ **D4=B 紫色字面 + hardcode 中文字面** · 同 US-007

---

### US-011b: `apps/web/src/components/step7/Step7OutputContent.tsx`(Step 7 输出部分)

**risk_level** · high
**size_hint** · medium
**depends_on** · [US-011a]
**files_to_create** · `apps/web/src/components/step7/Step7OutputContent.tsx`(约 200 行)
**files_to_modify** · `apps/web/src/pages/step/Step7.tsx`(import + 渲染 Step7OutputContent)

**描述** · 作为 IP 起号用户 · 我需要在 Step 7 page 看到生成的爆款文案(默认辩论模板 4 H4:话题抛出/正方/反方/我的立场)· 支持复制 + 重新生成 + 智能优化。各脚本类型独立 schema 渲染。

**背景** · spec §7.8 (line 1730-1744)· 辩论模板字段:`title / topic_hook / pros_arguments / cons_arguments / my_stance / comment_guide / topic_tags[]` · 其他脚本类型字段不同 · 本 US 默认 debate · 其他类型简化为通用 [hook/body/cta] 3 字段渲染(可后续扩展)。

**Acceptance Criteria**:

- [ ] **AC-1**(输出区布局)· `Step7OutputContent.tsx` 渲染:
  - 顶部 title(若存在 · 居中 font-bold)
  - 4 H4 区(辩论模板)· 按 `STEP7_DEBATE_H4_4` 顺序:
    - `话题抛出`(content = topic_hook)
    - `正方`(content = pros_arguments)
    - `反方`(content = cons_arguments)
    - `我的立场`(content = my_stance)
  - 评论区引导(`comment_guide`)
  - 话题标签 list(`topic_tags` · 每 tag chip 渲染 #xxx)
  - 每 H4 块右上角 [复制] button(`STEP_BUTTON_COPY = '复制'` · 复用 PRD-17 step3.ts 常量)
  - 顶部右侧 [重新生成]([STEP_BUTTON_REGENERATE = '重新生成'] · 复用)+ [复制全部]
- [ ] **AC-2**(各脚本类型 schema · default debate)· 当 `result.script_type === 'debate'` · 渲染上述 4 H4 + comment_guide + topic_tags · 其他 script_type · 简化为通用 [hook / body / cta] 3 段 · 注释标注 "TODO: PRD-19 扩展 20 类 schema"
- [ ] **AC-3**(structured mockResult)· `generateMockResult(formData): Step7Result` 内置 setTimeout 3-5 秒 · default 生成 debate 模板(美容院如何选购仪器示例 · 4 H4 各 100-200 字)
- [ ] **AC-4**(复制功能)· 点击 [复制] button · `navigator.clipboard.writeText(getBlockText(blockId))` · 显示 toast "已复制"
- [ ] **AC-5**(跨 step 数据)· 写 acc_step7({formData, result})· spec §7.7 line 1645 链路:可在 Step 6 自动预填
- [ ] **AC-6**(三态 + 零 hardcode + D4=B + 零回归)· vitest PASS · tsc 0 error · agent-browser /step/7 · 完整 flow(US-011a + US-011b 联调)

**[SHIELD] anti_patterns**:
1. ❌ **4 H4 加前缀** · `'H4. 话题抛出'` → ✅ `'话题抛出'`(`STEP7_DEBATE_H4_4[0].h4Label` 1:1)
2. ❌ **复制 button hardcode**(PRD-17 US-008 教训)· `<Button>复制</Button>` → ✅ `<Button>{STEP_BUTTON_COPY}</Button>`(import from step3.ts)
3. ❌ **default script_type 非 debate**(spec line 1730 明确 debate 是示例)· default selected_script = `STEP7_SCRIPT_TYPES_20[0]` · 即 debate
4. ❌ **topic_tags 不加 # 前缀** · `<span>{tag}</span>` → ✅ `<span>#{tag}</span>`(spec line 1740 含 `#xxx` 字面)

---

### US-012: `apps/web/src/pages/step/Step8.tsx`(Step 8 page)

**risk_level** · medium
**size_hint** · medium-large
**depends_on** · [US-006]
**files_to_create** · `apps/web/src/pages/step/Step8.tsx`(约 450 行)+ `apps/web/src/components/step8/Step8GeneratePlan.tsx`(约 150 行 · 子功能 1)+ `apps/web/src/components/step8/Step8OptimizeScript.tsx`(约 130 行 · 子功能 2)
**files_to_modify** · 无

**描述** · 作为 IP 起号用户 · 我需要在 Step 8 page 看到 2 子功能(子功能 1 · 生成直播方案 / 子功能 2 · AI 优化直播话术)· 各自独立 form + 输出 · 让我可以 0 到 1 生成直播方案 · 或优化已有话术。

**背景** · spec §7.9 (line 1748-1786)· Step 8 含 2 子功能 H3 切换 · 子功能 1 = 4 字段 form + 6 模块输出 · 子功能 2 = 2 字段 form + 优化后文案输出。

**Acceptance Criteria**:

- [ ] **AC-1**(page 布局 + 2 子功能 H3)· `Step8.tsx`:
  - 顶部 `STEP8_STEP_TAG` + H1 `STEP8_H1` + SUBTITLE 替换 `{industry}`
  - 2 子功能 H3 切换(`STEP8_SUBFUNCTIONS_2` · '子功能 1：生成直播方案' / '子功能 2:AI 优化直播话术')
  - 默认显示子功能 1
- [ ] **AC-2**(子功能 1 · `Step8GeneratePlan.tsx`)·
  - 4 字段:textarea(产品)+ input(受众)+ radio 5 平台(`STEP8_PLATFORMS_5`)+ radio 3 经验(`STEP8_EXPERIENCE_3`)
  - 主 CTA `STEP8_BUTTON_GENERATE_PLAN = '生成直播方案'`
  - 输出区 6 H3 = `STEP8_OUTPUT_MODULES_6`(开场/中场/成交/收尾/引流/互动)· 每模块 InfoCard 渲染
- [ ] **AC-3**(子功能 2 · `Step8OptimizeScript.tsx`)·
  - 2 字段:textarea(话术 ≥10 字 + 字符计数器)+ input(优化目标 · 可选)
  - 主 CTA `STEP8_BUTTON_OPTIMIZE_SCRIPT = 'AI 优化话术'` · disabled 当字数 < 10
  - 输出 · 优化后文案 + 优化说明(2 块 InfoCard)
- [ ] **AC-4**(structured mockResult)· `generateMockResult(subfunction, formData): Step8Result` 内置 setTimeout 3-5 秒 · 按子功能 mock 数据
- [ ] **AC-5**(跨 step 数据)· 读 acc_step1 industry 注入 SUBTITLE · 写 acc_step8
- [ ] **AC-6**(三态 + 零 hardcode + D4=B + 零回归)· vitest PASS · tsc 0 error · agent-browser /step/8 · 2 子功能切换 · 完整 flow

**[SHIELD] anti_patterns**:
1. ❌ **2 子功能 H3 改名** · `'生成方案'` → ✅ `'子功能 1：生成直播方案'`(spec line 1755 完整字面 含全角冒号)
2. ❌ **3 经验 label 去 ·**(中点)· `'新手 - 刚开始做直播'` → ✅ `'新手 · 刚开始做直播'`(中点 · 含半角空格)
3. ❌ **6 输出模块 H3 改名** · `'1. 开场白'` → ✅ `'1. 开场话术'`
4. ❌ **D4=B 紫色字面 + hardcode 中文字面** · 同 US-007

---

### US-013: E2E playwright + verify-prd-18.sh 收官

**risk_level** · medium
**size_hint** · medium
**depends_on** · [US-007, US-008, US-009, US-010, US-011b, US-012]
**files_to_create** · `apps/web/e2e/prd-18-step-4-5-6-7-8.spec.ts`(约 200 行)+ `scripts/verify-prd-18.sh`(约 130 行)
**files_to_modify** · 无

**描述** · 作为 QA 工程师 · 我需要写 playwright e2e 覆盖 PRD-18 全部 6 step 流程 + verify-prd-18.sh 静态检查 · 确保完整流程跑通 + 字面常量未被破坏。

**背景** · 继 PRD-17 US-010 12/12 ALL PASS 模式 · PRD-18 加 6 step 验收。

**Acceptance Criteria**:

- [ ] **AC-1**(playwright e2e flow)· `prd-18-step-4-5-6-7-8.spec.ts`:
  - test 1 · 进入 /step/4 → 选平台 → 填字段 → 点 [生成执行计划] → 看到 3 H3 输出 → 截图
  - test 2 · 进入 /step/4b → 填产品 → 点 [生成变现路径] → 看到 5 H3 + 3 阶梯 → 截图
  - test 3 · 进入 /step/5 → 填行业/产品 → 点 [一键生成 5大类 爆款选题] → 看到 5 类 tab + 100 选题 → 点某选题 → 跳 /step/7 自动预填 → 截图
  - test 4 · 进入 /step/6 → 粘贴文案(≥10 字)→ 点 [生成拍摄计划] → 看到 3 模块 → 截图
  - test 5 · 进入 /step/7 → 选脚本(debate)→ 选元素 → 填主题 → 点 [生成爆款文案] → 看到 4 H4 + 评论引导 → 截图
  - test 6 · 进入 /step/8 → 切子功能 1 → 填字段 → 点 [生成直播方案] → 看到 6 H3 → 截图
  - 全部 test 硬门禁 · `expect(consoleErrors).toEqual([])`
  - 6 截图保存 `apps/web/test-results/prd-18-step-{4,4b,5,6,7,8}.png`
- [ ] **AC-2**(verify-prd-18.sh 静态检查)· `scripts/verify-prd-18.sh`:
  - 12-15 检查项 · 类似 PRD-17 verify · 含:
    - 6 个 `step{N}.ts` 文件存在
    - 6 个 Step{N}.tsx 文件存在
    - 字面常量 grep · `STEP4_SUBTITLE_TEMPLATE` / `STEP4B_THREE_STAGES` / `STEP5_CATEGORIES_5` / `STEP7_SCRIPT_TYPES_20` / `STEP8_SUBFUNCTIONS_2` 等 25+ 命名 0 缺失
    - D4=B grep · `apps/web/src/pages/step/Step{4,4b,5,6,7,8}.tsx` + `apps/web/src/components/step{4b,5,7,8}/` 0 `from-violet` / `text-violet` 命中
    - D3=A grep · `apps/admin/` 在 diff 中 0 修改
    - 跨 step localStorage · grep `acc_step{4,4b,5,6,7,8}` 各 ≥ 1 命中
  - 输出 `12/12 ALL PASS` 或 `N/12 FAIL`(列具体失败项)
  - chmod +x · 可直接跑
- [ ] **AC-3**(跑全套 test)· `cd apps/web && pnpm test` PASS · `pnpm tsc --noEmit` 0 error · `pnpm playwright test prd-18` PASS · `bash scripts/verify-prd-18.sh` 12/12 PASS
- [ ] **AC-4**(零 console error)· 6 截图 + console log 全部 silent · 无 warning · 无 React key warning · 无网络 404

**[SHIELD] anti_patterns**:
1. ❌ **playwright test 跳过 acc_step5_selected_topic 跳 step7 链路** · 必须 test 3 含 Step5 → Step7 完整链路
2. ❌ **verify-prd-18.sh 0 检查项 / 仅 grep 文件存在**(简化版)· 必须 12-15 项 · 含字面常量 grep + D4=B + D3=A + 跨 step
3. ❌ **6 截图缺一**(scope creep)· 必须 6 完整截图 · 不允许只 5

---

## §4 · Functional Requirements(30 FR)

- **FR-1** · 系统必须在 `apps/web/src/lib/constants/step{4,4b,5,6,7,8}.ts` 6 文件集中放所有字面字符串 · 严禁 page 文件 hardcode 中文 label/title/placeholder/button(D1=A 字面锁)
- **FR-2** · 当用户进入 `/step/4`(或 4b/5/6/7/8)时 · 系统必须显示对应 `STEP{N}_STEP_TAG` / `STEP{N}_H1` / `STEP{N}_SUBTITLE` 字面 1:1(完整字面 · 含全角标点 · 不允许简化)
- **FR-3** · 当 `STEP{N}_SUBTITLE_TEMPLATE` 含 `{industry}` 占位时 · 系统必须 `JSON.parse(localStorage.getItem('acc_step1') ?? '{}')` 读 industry 字段并替换 · 若 acc_step1 不存在 · fallback "你的行业"
- **FR-4** · Step 4 / 4b / 5 / 6 / 7 / 8 page form 提交后 · 系统必须用 `setTimeout(2-5s)` 模拟生成延迟 · 不调真实后端 API · 不调 OpenAI/Gemini SDK(LD-160 + LD-170 延续)
- **FR-5** · Step 5 file upload 必须用 `FileReader.readAsText()` 拿文件 metadata(name/size/type)· 不上传到后端 · 不持久化文件内容 · 文件 size > 20MB 显示错误
- **FR-6** · Step 5 输出区 100 选题点击任一选题 · 系统必须 `localStorage.setItem('acc_step5_selected_topic', JSON.stringify(topic))` + 跳转 `/step/7`(spec §7.6 line 1619 关键跨 step 链路)
- **FR-7** · Step 6 textarea 字符 < 10 时 · 系统必须 disabled 主 CTA · 显示字符计数 `'已输入 {count} 字'`(spec §7.7 line 1647 完整字面)
- **FR-8** · Step 6 进入时 · 系统必须自动预填 textarea = `acc_step7_result.body.text`(若存在 · spec §7.7 line 1645)· 用户可手动改
- **FR-9** · Step 7 进入时 · 系统必须自动预填主题 textarea = `acc_step5_selected_topic.title`(若存在 · spec §7.6 line 1619)
- **FR-10** · Step 7 必须含 20 脚本类型搜索 input(`STEP7_SEARCH_PLACEHOLDER = '搜索脚本...'`)· 实时过滤 STEP7_SCRIPT_TYPES_20 by name/positioning
- **FR-11** · Step 7 必须含 22 爆款元素 4 分组多选(STEP7_ELEMENT_GROUPS_4 · STEP7_ELEMENTS_22)· 顶部计数 `'选择爆款元素（已选 {count} 个）'`
- **FR-12** · Step 7 默认选中 `STEP7_SCRIPT_TYPES_20[0]`(debate)· 输出区默认按 STEP7_DEBATE_H4_4 4 H4 渲染(话题抛出/正方/反方/我的立场)
- **FR-13** · Step 7 输出区话题标签必须显示为 `#{tag}` chip(spec §7.8 line 1740 字面)
- **FR-14** · Step 8 必须含 2 子功能 H3 切换(STEP8_SUBFUNCTIONS_2)· 各自独立 form + 输出
- **FR-15** · Step 8 子功能 1 输出必须 6 H3(STEP8_OUTPUT_MODULES_6 · 开场/中场/成交/收尾/引流/互动 · 字面 1:1)
- **FR-16** · Step 8 子功能 2 textarea 字符 < 10 时 · 系统必须 disabled 主 CTA
- **FR-17** · 6 step page 必须各定义 `Step{N}Result` interface(structured · 不是 string · 继 PRD-17 US-006b pattern)+ `generateMockResult(formData): Step{N}Result` 函数
- **FR-18** · 6 step page 必须各调 `LoadingState` / `ErrorState` / `EmptyState` 三态组件(继 PRD-17 US-009 复用 pattern)· 0 重复实现
- **FR-19** · 6 step page form 提交后必须 `localStorage.setItem('acc_step{N}', JSON.stringify({formData, result}))` 写入(LD-009 acc_ namespace)
- **FR-20** · 所有 button / H3 / H4 中文字面必须从 step{N}.ts import · 严禁 hardcode `<Button>生成执行计划</Button>` 类(plan-check §2.6.21 检查)
- **FR-21** · 所有渐变 / 色彩必须用 `var(--primary)` / `var(--secondary)` token · 严禁 `from-violet-X` / `from-amber-X` / `text-purple-X` Tailwind 默认 utility(D4=B 锁)
- **FR-22** · 6 page 必须 0 中文颜色措辞("紫色" / "金色" / "红色" 等)在 PRD seed + 代码注释(D4=B 锁 · plan-check §2.6.7-ext ERROR 阻断)
- **FR-23** · D3=A 锁 · `apps/admin/` + `apps/api/` + `packages/` 全 PRD-18 0 修改
- **FR-24** · `STEP4B_THREE_STAGES` 3 阶梯 range 字面严格 = `['0→90万', '100万→1000万', '1000万→1亿']`(全角箭头 · 中文"万")
- **FR-25** · `STEP5_CATEGORIES_5` 5 类 label 字面严格 = `['流量型', '变现型', '人设型', '认知型', '案例型']`(spec §7.6 line 1626-1630)
- **FR-26** · `STEP4B_PRODUCT_TYPES_4` 4 类型字面严格 = `['引流品', '信任品', '利润品', '后端产品']`(spec §7.5 line 1551)
- **FR-27** · `STEP8_EXPERIENCE_3` 3 经验 label 严格 = `['新手 · 刚开始做直播', '有经验 · 有一定直播经验', '资深 · 直播经验丰富']`(中点 · 含半角空格)
- **FR-28** · vitest 全 PASS(70+ tests 含 PRD-17 已建)· tsc --noEmit 0 error · playwright e2e PASS · `bash scripts/verify-prd-18.sh` 12/12 PASS
- **FR-29** · agent-browser 跑 6 step 完整 flow · 无 console error / warning / React key warning
- **FR-30** · PRD-18 全部 13 US 完成后 · `acc_step1` 到 `acc_step8` 数据链完整 · 用户可 Step 1 → Step 3 → Step 3b → Step 4 → Step 4b → Step 5(点选题) → Step 7(预填)→ Step 6(用 Step 7 结果)→ Step 8 走通

---

## §5 · Non-Goals(明确排除)

- **NG-1** · 不接真后端 LLM 调用(OpenAI/Gemini SDK · LLM Gateway · API key 管理)· 全 mock 数据 + setTimeout 模拟延迟(继 PRD-17 LD-160)
- **NG-2** · 不真上传文件到后端(Step 5 file upload)· 仅前端 FileReader 拿 metadata · 文件内容不持久化(LD-170)
- **NG-3** · 不实现 admin 后台(任何 apps/admin/ 改动)· D3=A 锁
- **NG-4** · 不实现 backend tRPC API endpoint(任何 apps/api/ 改动)· D3=A 锁
- **NG-5** · 不实现 Prisma schema 变更(0 schema 改动)· D3=A 锁
- **NG-6** · 不实现 PRD-19+ 范围 · 14 工具完整化 + 4 modules 完整化 + 视觉精修(留 PRD-19)
- **NG-7** · 不实现 Step 2(目标人群)page · 因 dump §2.2 未含 · spec §7 未明确 · 留待 PRD-19 评估
- **NG-8** · 不实现 9 步流程 Step 2 等其他 PRD-15+ 已部分覆盖的 page 重写
- **NG-9** · 不实现 Step 4b 收入结构 chart 库引入(recharts/visx 等)· 用 list + percent + 简单 progress bar
- **NG-10** · 不实现 Step 7 各脚本类型(20 类)独立 schema(仅 debate · 其他 19 类用通用 [hook/body/cta] 3 字段占位 · 注释标注 "PRD-19 扩展")
- **NG-11** · 不实现真实图像生成(any 头像/背景图 mock 用占位图 · 继 PRD-17 LD-160)
- **NG-12** · 不实现 SSE / WebSocket 流式生成(setTimeout 2-5s 模拟 · 不引 EventSource)
- **NG-13** · 不修改既有 PRD-15(14 工具)/ PRD-16(首页 + Header)/ PRD-17(Step 1/3/3b)任何文件 · 零回归硬门禁
- **NG-14** · 不引入新外部依赖(npm install)· 严格用既有 shadcn UI + lucide-react + framer-motion + zustand
- **NG-15** · 不实现用户登录 / OAuth / session(仍是 PRD-17 demo 模式 · localStorage 模拟用户态)

---

## §6 · Design Considerations

### 6.1 · UI/UX 复用(继 PRD-17)

- 三态组件 · `apps/web/src/components/states/{LoadingState,ErrorState,EmptyState}.tsx` 6 page 各 1 处使用
- structured mockResult · interface + generateMockResult 函数 · 6 page 各定义
- glass-card · `bg-secondary/50 backdrop-blur-md border-primary/15`(继 PRD-15 PRD-16 锁)
- form layout · gap-4 + flex-col + 主 CTA 居底 + secondary button 左侧(继 PRD-17 Step 3 / Step 3b)
- 输出 H3 区 · `text-xl font-rajdhani text-primary` + InfoCard / PromptCard 渲染(继 PRD-17 US-006b)
- DialogTrigger asChild click(继 PRD-16 US-007)· 若 Step 5 file upload 用 Dialog 选项时

### 6.2 · 视觉锁(D4=B 严守)

- 主色 · `var(--primary)`(globals.css `--primary: 43 87% 63%` HSL hue=43 金色)
- 次色 · `var(--secondary)` · `var(--accent)`
- 背景 · `var(--background)`
- 渐变 · `bg-gradient-to-r from-primary to-primary/80`(0 violet/amber)
- icon · `text-primary` / `text-secondary` / `text-foreground`(0 colored)

### 6.3 · 跨 step 数据流(LD-009)

```
acc_step1 (industry: string)
  ↓ 注入所有 SUBTITLE_TEMPLATE 的 {industry} 占位
acc_step3 / acc_step3b (account-wrap data, persona data)
  ↓ 可选 · 用户回到 Step 3 复制 / 重新生成 时复用
acc_step4 (执行计划 formData + Step4Result)
acc_step4b (变现路径 formData + Step4bResult)
acc_step5 (爆款选题 formData + Step5Result · 含 100 topics)
  ↓ 点击 topic 写 acc_step5_selected_topic
acc_step5_selected_topic (Step5Topic)
  ↓ Step 7 进入时读 · 预填主题 textarea
acc_step6 (拍摄计划 formData + Step6Result)
acc_step7 (文案生成 formData + Step7Result)
  ↓ Step 6 进入时可选读 · 预填 textarea
acc_step8 (直播策划 formData + Step8Result)
```

### 6.4 · routing(已存在 · 0 改动)

- `/step/4` → `Step4.tsx`(已 stub · 重写)
- `/step/4b` → `Step4b.tsx`(已 stub · 重写)
- `/step/5` → `Step5.tsx`(已 stub · 重写)
- `/step/6` → `Step6.tsx`(已 stub · 重写)
- `/step/7` → `Step7.tsx`(已 stub · 重写)
- `/step/8` → `Step8.tsx`(已 stub · 重写)

`apps/web/src/router.tsx` 路由表已 PRD-15 时配好 · PRD-18 0 改动(可能只补 lazy import · 不必)

### 6.5 · 字体 + spacing(继 PRD-16 D-79)

- H1 · `font-orbitron text-4xl text-primary tracking-wider uppercase`
- H2 · `font-rajdhani text-2xl text-primary`
- H3 · `font-rajdhani text-xl text-primary semibold`
- H4 · `font-noto-sans-sc text-base font-semibold text-foreground`
- body · `font-noto-sans-sc text-sm text-foreground`
- gap · `gap-4`(form 字段间)· `gap-6`(主区间)· `gap-8`(page-section 间)
- padding · `p-6`(glass-card 内)· `px-8 py-4`(page 容器)

---

## §7 · Technical Considerations

### 7.1 · 技术栈(0 新依赖)

- React 18 + TypeScript + Vite(继 PRD-15 锁)
- shadcn UI(Button / Input / Textarea / RadioGroup / Tabs / Dialog / Collapsible / Toast)
- lucide-react(ChevronDown / Search / Upload / Copy / RefreshCw / Sparkles)
- framer-motion(三阶梯卡入场 + Step 5 100 选题 grid 滚动加载)
- zustand(若已用 · 否则 localStorage 直接)
- vitest + playwright(已 PRD-17 建)

### 7.2 · 字体加载

- 继 PRD-16 D-79 锁 · Orbitron / Rajdhani / Noto Sans SC 已 globals.css 引入 · PRD-18 0 改动

### 7.3 · 路由 lazy load(可选)

- 若 Step 5(100 选题)/ Step 7(20 脚本 + 22 元素)bundle 大 · 可 lazy import:
- `const Step5 = React.lazy(() => import('./pages/step/Step5'));`
- 不必 · 因每 page < 500 行 · bundle 小

### 7.4 · file upload 安全(LD-170)

- 严格 FileReader stub · 不上传 · 防 PRD-18 不小心引入后端
- `accept` 属性限定 `'.pdf,.doc,.docx,.txt,.md,.csv'`
- `file.size > 20 * 1024 * 1024` 时 reject + 显示错误
- 文件内容 0 持久化 · 仅 metadata(name/size/type)存 component state · 退出 page 即丢

### 7.5 · 跨 step localStorage 隔离(LD-009 严守)

- 所有 key 必须 `acc_` 前缀 · 严禁 `'step4'` / `'step5'` 等无前缀 key
- JSON.parse / JSON.stringify · 严禁 raw string
- 写入前 try/catch · 防 quota 满

### 7.6 · 性能

- Step 5 100 选题渲染 · 用 `react-window` 或 simple slice(20 个 per tab)· 不一次性渲染 100
- Step 7 22 元素多选 · 用 Set 数据结构 + React.memo 优化
- 6 page initial bundle < 100KB per route(已 lazy load 助)

### 7.7 · 测试策略(继 PRD-17)

- vitest unit · 每 page 1 个 test file · 测渲染 + form submit + mockResult + localStorage 写入
- vitest 测 step{N}.ts 常量 · 数字锁(STEP4_PLATFORMS_5.length === 5 等)
- playwright e2e · `prd-18-step-4-5-6-7-8.spec.ts`(US-013)
- verify-prd-18.sh · 静态检查(US-013)

---

## §7.5 · 跨 Story 协议锁(30+ 命名锁 · 全字面 1:1 来源 spec)

| 命名 | 类型 | 定义 story | 消费 story | 说明 |
|---|---|---|---|---|
| `STEP4_PLATFORMS_5` | readonly Platform5[] | US-001(re-export from step3.ts) | US-007 | 5 平台 · 复用 STEP3 |
| `STEP4_INPUTS_3` | readonly Step4Input[] | US-001 | US-007 | 3 字段:粉丝量/目标/情况 |
| `STEP4_STEP_TAG` | string | US-001 | US-007 | = `'STEP 04 · 制定执行计划'` |
| `STEP4_H1` | string | US-001 | US-007 | = `'执行计划'` |
| `STEP4_SUBTITLE_TEMPLATE` | string | US-001 | US-007 | 完整 1:1 spec §7.4 line 1492 字面 · 含 `{industry}` |
| `STEP4_BUTTON_GENERATE` | string | US-001 | US-007 | = `'生成执行计划'` |
| `STEP4_LOADING_TEXT` | string | US-001 | US-007 | = `'AI 正在生成你的执行计划，预计 30-60 秒...'` |
| `STEP4_RADIO_LABEL` | string | US-001 | US-007 | = `'选择平台'` |
| `STEP4_OUTPUT_H3_3` | readonly [] | US-001 | US-007 | 3 H3:每日任务/每周里程碑/阶段 KPI |
| `Step4Result` | interface | US-001 | US-007 | structured output type |
| `STEP4B_TEXTAREA` | Step4bTextarea | US-002 | US-008 | 1 textarea 产品 必填 |
| `STEP4B_INPUTS_3` | readonly Step4bInput[] | US-002 | US-008 | 3 input:受众/IP定位/收入 |
| `STEP4B_STEP_TAG` | string | US-002 | US-008 | = `'STEP 04b · 变现路径规划'` |
| `STEP4B_H1` | string | US-002 | US-008 | = `'变现路径'` |
| `STEP4B_SUBTITLE_TEMPLATE` | string | US-002 | US-008 | 完整 1:1 spec §7.5 line 1521 字面 |
| `STEP4B_BUTTONS_3` | const | US-002 | US-008 | 生成/智能优化/重新生成 |
| `STEP4B_LOADING_TEXT` | string | US-002 | US-008 | = `'AI 正在规划你的变现路径，预计 60-120 秒...'` |
| `STEP4B_THREE_STAGES` | readonly Step4bStage[3] | US-002 | US-008 | 3 阶梯 range/title/duration 字面 1:1 |
| `STEP4B_PRODUCT_TYPES_4` | const | US-002 | US-008 | 4 类型:引流品/信任品/利润品/后端产品 |
| `STEP4B_OUTPUT_H3_5` | const | US-002 | US-008 | 5 H3:市场/三阶梯/收入结构/案例/反馈 |
| `Step4bResult` | interface | US-002 | US-008 | structured output type |
| `STEP5_INPUTS_2` | readonly Step5Input[] | US-003 | US-009 | 2 input:行业/产品 必填 |
| `STEP5_FILE_UPLOADS_2` | readonly Step5FileUpload[] | US-003 | US-009 | 2 file upload · 可选 · stub |
| `STEP5_FILE_MAX_MB` | number = 20 | US-003 | US-009 | 文件最大 MB |
| `STEP5_FILE_ACCEPT` | string | US-003 | US-009 | = `'.pdf,.doc,.docx,.txt,.md,.csv'` |
| `STEP5_CATEGORIES_5` | readonly Step5Category[5] | US-003 | US-009 | 5 类:流量型/变现型/人设型/认知型/案例型 |
| `STEP5_TOPICS_PER_CAT` | number = 20 | US-003 | US-009 | 每类 20 选题 |
| `STEP5_TOTAL_TOPICS` | number = 100 | US-003 | US-009 | 5 × 20 = 100 |
| `STEP5_BUTTON_GENERATE` | string | US-003 | US-009 | = `'一键生成 5大类 爆款选题'`(spec line 1606 字面) |
| `STEP5_SUBTITLE` | string | US-003 | US-009 | 完整 1:1 spec §7.6 line 1595 字面 |
| `Step5Topic` | interface | US-003 | US-009 | 每选题数据 type |
| `Step5Result` | interface | US-003 | US-009 | structured output type |
| `STEP6_TEXTAREA` | Step6Textarea | US-004 | US-010 | 1 textarea 文案 ≥10 字 必填 |
| `STEP6_TEXTAREA_MIN_CHARS` | number = 10 | US-004 | US-010 | 最小字符数 |
| `STEP6_CHAR_COUNTER_TEMPLATE` | string | US-004 | US-010 | = `'已输入 {count} 字'` |
| `STEP6_SUBTITLE` | string | US-004 | US-010 | 完整 1:1 spec §7.7 line 1639 字面 |
| `STEP6_BUTTON_GENERATE` | string | US-004 | US-010 | = `'生成拍摄计划'` |
| `STEP6_OUTPUT_MODULES_3` | const | US-004 | US-010 | 3 H3:分镜脚本/拍摄方案/口播提词器 |
| `Step6Result` | interface | US-004 | US-010 | structured output type |
| `STEP7_SCRIPT_TYPES_20` | readonly Step7ScriptType[20] | US-005 | US-011a/b | 20 脚本类型 |
| `STEP7_ELEMENT_GROUPS_4` | readonly Step7ElementGroup[4] | US-005 | US-011a | 4 分组:钩子/情绪/结构/互动 |
| `STEP7_ELEMENTS_22` | readonly Step7Element[22] | US-005 | US-011a | 22 爆款元素 |
| `STEP7_TEXTAREA` | Step7Textarea | US-005 | US-011a | 主题 textarea 必填 |
| `STEP7_OPTIMIZE_PLACEHOLDER` | string | US-005 | US-011a | = `'输入优化方向（可选），如：更有吸引力...'` |
| `STEP7_SEARCH_PLACEHOLDER` | string | US-005 | US-011a | = `'搜索脚本...'` |
| `STEP7_ELEMENT_COUNTER_TEMPLATE` | string | US-005 | US-011a | = `'选择爆款元素（已选 {count} 个）'` |
| `STEP7_SCRIPT_DISPLAY_TEMPLATE` | string | US-005 | US-011a | = `'当前脚本：{name} - {positioning}'` |
| `STEP7_BUTTONS_4` | const | US-005 | US-011a | 4 button:主/优化/我的选题/爆款选题 |
| `STEP7_DEBATE_H4_4` | const | US-005 | US-011b | 4 H4:话题抛出/正方/反方/我的立场 |
| `STEP7_SUBTITLE` | string | US-005 | US-011a | 完整 1:1 spec §7.8 line 1671 字面 |
| `Step7Result` | interface | US-005 | US-011b | structured output type · default debate |
| `STEP8_SUBFUNCTIONS_2` | readonly [2] | US-006 | US-012 | 2 子功能 H3:生成方案/优化话术 |
| `STEP8_PLATFORMS_5` | (alias STEP3_PLATFORMS_5) | US-006 | US-012 | 复用 STEP3 |
| `STEP8_EXPERIENCE_3` | readonly Step8Experience[3] | US-006 | US-012 | 3 经验:新手 · / 有经验 · / 资深 · |
| `STEP8_OUTPUT_MODULES_6` | const | US-006 | US-012 | 6 H3:开场/中场/成交/收尾/引流/互动 |
| `STEP8_SUBTITLE_TEMPLATE` | string | US-006 | US-012 | 完整 1:1 spec §7.9 line 1753 字面 |
| `STEP8_BUTTON_GENERATE_PLAN` | string | US-006 | US-012 | = `'生成直播方案'` |
| `STEP8_BUTTON_OPTIMIZE_SCRIPT` | string | US-006 | US-012 | = `'AI 优化话术'` |
| `Step8Result` | interface | US-006 | US-012 | structured output type |

### 跨 step localStorage 命名锁(LD-009 严守)

| key | 写入 story | 读取 story | 数据 type |
|---|---|---|---|
| `acc_step1` | PRD-17 US-003 | 全 PRD-18 page(SUBTITLE 注入 industry) | `{industry: string}` |
| `acc_step3` | PRD-17 US-006b | PRD-18 0 直接读 | `{formData, result}` |
| `acc_step3b` | PRD-17 US-008 | PRD-18 0 直接读 | `{formData, result}` |
| `acc_step4` | US-007 | (留 PRD-19) | `{formData, result}` |
| `acc_step4b` | US-008 | (留 PRD-19) | `{formData, result}` |
| `acc_step5` | US-009 | (留 PRD-19) | `{formData, result}` |
| `acc_step5_selected_topic` | US-009(用户点选题时) | US-011a(预填主题 textarea) | `Step5Topic` |
| `acc_step6` | US-010 | (留 PRD-19) | `{formData, result}` |
| `acc_step7` | US-011b | US-010(可选预填 textarea) | `{formData, result}` |
| `acc_step8` | US-012 | (留 PRD-19) | `{formData, result}` |

---

## §8 · Success Metrics

- **M-1** · 严格一轮通过率 ≥ 75%(继 PRD-17 81% · 14 US 至少 11 一轮 PASS)
- **M-2** · 0 reject 由 D1=A 字面错(SUBTITLE 创意改写 / desc 自由翻译 / 3 阶梯 range 错 / 5 类 label 翻译 / 6 H3 改名)
- **M-3** · 0 reject 由 D4=B 颜色错(0 from-violet / from-amber 命中)
- **M-4** · 0 D3=A 越界(0 apps/admin / apps/api / packages/ 修改)
- **M-5** · 0 hardcode 中文 button 在 page 文件(plan-check §2.6.21 0 ERROR)
- **M-6** · vitest 全 PASS · tsc 0 error · playwright e2e 6 截图 PASS · verify-prd-18.sh 12/12 PASS
- **M-7** · 6 step page 实施 ≤ 2.5 周(继 PRD-17 11 US 实际 1 周经验 · 14 US 估 2-2.5 周)
- **M-8** · 反例库 reject-examples.jsonl 跨 PRD 持续 +5-10 条新反例(PRD-18 reject 自动入库 · 服务 PRD-19+)

---

## §9 · Open Questions(3 条产品级 · 等用户 review 后确认)

> **状态** · 我已基本决定 · 但留产品级决策给用户确认。若用户不同意 · 改 PRD seed 重新转 prd.json。

- **Q-1** · Step 7 (53 btn + 20 脚本 + 22 元素 + 4 H4 输出)拆为 US-011a form + US-011b 输出 — 是否同意?(我建议 A · 防 large 风险 + 继 PRD-17 US-006 拆 a/b 成功经验)
- **Q-2** · Step 5 file upload 当 FileReader stub · 不真上传后端(不引后端 endpoint)— 是否同意?(我建议 A · 符合 1.0 不接后端 LLM · LD-170)
- **Q-3** · E2E US-013 单独 story(继 PRD-17 US-010 模式)— 是否同意?(我建议 A · 继 PRD-17 已验证 12/12 ALL PASS)

---

## §10 · 反例库注入清单(关键词 + 检索范围)

> ralph skill 转 prd-18.json 时 · 按以下关键词 grep `~/.claude/playbooks/reject-examples.jsonl`(48+ 条)· 注入到对应 US 的 `anti_patterns` 字段(每 high/foundation US ≤ 3 条)

### 关键词集合

- **D1=A 字面锁** · SUBTITLE / TEMPLATE / desc / 字面 / 改写 / hardcode 中文
- **D4=B 颜色锁** · violet / amber / gold / purple / 紫色 / 金色 / from-violet / text-violet
- **跨 step 数据** · acc_ / localStorage / namespace / 跨 step / pre-filled
- **form 复杂度** · large story / 拆分 / form + output 拆
- **file upload** · FileReader / stub / 不真上传 / 后端 endpoint
- **多选** · multi-select / chip / radio vs checkbox
- **字符计数** · counter / min chars / disabled button
- **structured mockResult** · interface / type / generateMockResult / object vs string

### 高优先级反例(必注入 · ≥ 4 条 per high/foundation US)

1. **PRD-16 US-003 violet 字面读 reject**(80 min 损失)
2. **PRD-16 US-004 desc 创意改写 reject**(15 卡全改写)
3. **PRD-16 US-007 Dialog hover 改 click reject**(DialogTrigger asChild)
4. **PRD-17 US-007 SUBTITLE 字面改写 reject**(完整字面双锁不严)
5. **PRD-17 US-008 hardcode 复制 button reject**(maintenance fix TD-75)
6. **PRD-15 US-001 categories 字段中英文不一致 TD**(D1=A schema 锁)
7. **PRD-15 large story dev timeout SOP**(§9.6 拆分硬规则)

### 检索范围

`~/.claude/playbooks/reject-examples.jsonl`(全局共享 · 跨项目跨 PRD 累加 · 当前 48 条)

---

## §11 · Locked Decisions(D-161 起 · 15 条)

> **延续 PRD-17 D-160** · PRD-18 从 D-161 起延续

- **D-161** · PRD-18 范围严格 6 step page(Step 4 / 4b / 5 / 6 / 7 / 8)· 不含 Step 2(人设确定)· 不含 PRD-19 范围(14 工具 + 4 modules + 视觉精修)
- **D-162** · 14 US 范围 · 6 foundation(step4/4b/5/6/7/8.ts)+ 7 page(Step4 / 4b / 5 / 6 / 7a / 7b / 8 · Step 7 拆 a/b 防 large 风险)+ 1 E2E 收官
- **D-163** · D1=A 像素级 layout + 字面文字 + UX 流程继 PRD-17 D-150 延续 · 所有字面 1:1 来源 spec §7.4-7.9 + dump §2.2 · 严禁创意改写
- **D-164** · D4=B 颜色严锁继 PRD-17 D-152 / D-158 延续 · 0 violet/amber/紫色/金色措辞 · 用 `var(--primary)` token · plan-check §2.6.7-ext ERROR 阻断
- **D-165** · D3=A 仅 apps/web 触动 · apps/admin / apps/api / packages/ 全 0 修改 · PRD-18 verify 脚本硬门禁
- **D-166** · Story 大小硬规则(全局 CLAUDE.md §9.6)严守 · 14 US 全部 small/medium · 0 large story · Step 7 拆 a/b 是 best practice
- **D-167** · 三态组件复用规范(继 PRD-17 US-009)· 6 page 各 1 处使用 LoadingState / ErrorState / EmptyState · 0 重复实现
- **D-168** · structured mockResult 模式(继 PRD-17 US-006b)· 6 page 各定义 Step{N}Result interface + generateMockResult 函数 · 严禁简化为 string
- **D-169** · 跨 step localStorage `acc_` 前缀(LD-009 继 PRD-15 起延续)· 6 个新 key (acc_step4 / 4b / 5 / 6 / 7 / 8)+ 1 链路 key (acc_step5_selected_topic) · 严格 namespace 隔离
- **D-170** · Step 5 file upload 当 FileReader stub · 不真上传到后端 · 文件 metadata(name/size/type)仅 component state 持有 · 不持久化 · 退出 page 即丢
- **D-171** · Step 7 默认选中 STEP7_SCRIPT_TYPES_20[0](debate)· 输出 默认按 STEP7_DEBATE_H4_4 4 H4 渲染 · 其他 19 类脚本简化为通用 3 字段占位 · 注释标注 "TODO: PRD-19 扩展"
- **D-172** · 字面常量集中放 `apps/web/src/lib/constants/step{N}.ts` · 严禁 page 文件 hardcode 中文字面 · plan-check §2.6.21 检查
- **D-173** · 6 step page 0 引入新外部依赖(npm install)· 严格用既有 shadcn UI + lucide-react + framer-motion + zustand
- **D-174** · Step 4b 收入结构用 list + percent + simple progress bar 渲染 · 不引入 chart 库(recharts/visx)· 防 scope creep + bundle 膨胀
- **D-175** · PRD-18 完成后 9 步主流程数据链:Step 1 → 3 → 3b → 4 → 4b → 5(点选题)→ 7(预填)→ 6(可选预填)→ 8 走通 · E2E US-013 硬门禁

---

## §12 · 附录(实施期提示)

### A.1 · ralph daemon 启动前必跑(继 §9.1 SOP)

1. 确认 prd.json 就位 · `cp scripts/ralph/prd-18.json scripts/ralph/prd.json`
2. ★ 先启 Monitor(persistent=true)· 订阅 ralph-output.log 关键事件
3. 启 ralph daemon · `/Users/return/.local/bin/python3.11 scripts/ralph/ralph.py --model sonnet --daemon`
4. 等 Monitor 通知 PENDING_DETECTED:US-XXX
5. 审完 → ralph-tools.py approve / reject → ralph 自动继续下一 story

### A.2 · audit hot list(每 US 必查)

- [ ] grep `from-violet|from-amber|text-violet|bg-amber|紫色|金色` 在 apps/web/ 改动 = 0
- [ ] grep `acc_step` 在新 page = ≥ 2(读 acc_step1 + 写 acc_step{N})
- [ ] grep hardcode 中文 button label 在 *.tsx = 0(用 `import { STEP{N}_BUTTON_* } from '...'`)
- [ ] grep `localStorage.setItem('step` 在 apps/web/ = 0(必 acc_ 前缀)
- [ ] git diff main..HEAD apps/admin/ apps/api/ packages/ = empty(D3=A 锁)
- [ ] vitest --run · 70+ tests PASS · tsc --noEmit · 0 error

### A.3 · 用户决策点(等 review)

`§9` 3 条 Open Questions 等用户 review · 默认按建议 A 执行。

---

> **本 PRD seed 由 Claude (Opus 4.7) 在 PRD-17 收官后写 · 2026-05-17 · 续 aiipznt 复刻 Phase 3 · 严守 Coding 3.0 流程 + D 锁延续 + 反例累加机制。**
