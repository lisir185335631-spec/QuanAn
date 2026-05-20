# PRD-23 · 3 stub 完整化 + 4 工具 stub 完整化 + 14 page visual baseline 验证

> **版本** · v0.1(2026-05-19 BJT · Opus 4.7 主对话写)
> **范围** · 跟 aiipznt 1:1 视觉对齐 · 3 件事 ·
> 1. 3 stub 完整化(/diagnosis 8 步问卷 + 7 维度报告 · /accounts IP 账号管理 + 新建账号 modal · /step/8 直播策划 2 子功能)
> 2. 4 内容创作工具 stub 完整化(/video-analysis 爆款文案解析 · /analysis 文案结构分析 · /video-production 短视频一键制作 · /acquisition-video 获客型视频)
> 3. 14 page visual baseline 验证 + TD 修复(PRD-15 沉淀 6 工具 + PRD-22 4 inline 工具 + 8 step page 总 18 page baseline 验证 · 修 TD-092/093)
> **基线** · PRD-21 + PRD-22 已 ship main(commit `c725cf4 Merge: PRD-21 + PRD-22 视觉对齐 ship`)· 13 visual baseline 建立 · 3 inline picker utility 跨 page 复用 · verify-prd-22.sh 52/52 PASSED
> **目标** · 7 stub page 完整化(3 模块 + 4 工具)· 18 page visual baseline 总计 · 修复 PRD AC 模板缺陷 · 准备 PRD-24 6 modules + 全 32 page visual diff 收官
> **预估** · 10 US · 3 high + 6 medium + 1 收官 · 2 周 wall time · 10-13h daemon · 22-28 commits

---

## §0 引用清单 + 元数据 + 复刻定调

### §0.1 上游文档(7 份核心)

| # | 文档 | 用途 | 重点章节 |
|:-:|---|---|---|
| 1 | [aiipznt-deep-dom-dump.md](../aiipznt-deep-dom-dump.md) | **32 page DOM 实测 + spec 校准 + 红线 5 条** · 当冲突时以 dump 为准 | §2.3 14 工具 / §2.4 6 modules + 1 衍生 page / §3 Diff 1-6 / §6 红线 |
| 2 | [aiipznt-spec.md](../aiipznt-spec.md) | 9192 行复刻基线 | §7.9 /step/8 直播策划 / §8.1.2 /video-analysis / §8.3.2-3.4 /analysis · /video-production · /acquisition-video / §8.5.1 /diagnosis / §8.5.4 /accounts |
| 3 | [.agents/verification/prd-22-visual-diff-vs-aiipznt.md](../.agents/verification/prd-22-visual-diff-vs-aiipznt.md) | **Step D Visual diff 真实对账数据** · QuanAn vs aiipznt 实拍尺寸差距 -83~-6% | §1 12 page 尺寸对账 / §2.3 D1A 字面锁 ≠ visual 1:1 复刻 / §3.3 PRD-23 范围建议 |
| 4 | [tasks/prd-22.md](prd-22.md) | PRD-22 5 inline 重构 + 8 step page 视觉精修(已 ship · 复用 + 反例累积) | §3 12 US 范围 · D-214~D-225 12 LD |
| 5 | [.agents/retros/prd-22-vs-prd-21-retrospective.md](../.agents/retros/prd-22-vs-prd-21-retrospective.md) | PRD-22 retro · 严格通过率 82% · 2 reject 根因(US-006/009 unit test 同步) | TD-093 modus + reject 反例累积 |
| 6 | [AGENTS.md](../AGENTS.md) | 18 LD + 17 R 红线 + §11 PRD 沉淀 | §3 18 LD / §11.13 PRD-22 沉淀(inline picker 抽象 + visual baseline infra) |
| 7 | `~/.claude/playbooks/reject-examples.jsonl` | 跨 PRD 反例库(PRD-22 后含 US-006/009 unit test 同步反例 · 跨 PRD 累积) | 注入 high US 的 anti_patterns(prd skill 自动检索 ≤3 条) |

### §0.2 元数据

| 项 | 值 |
|---|---|
| **branchName** | `ralph/prd-23-stubs-and-tools-polish` |
| **Locked Decisions** | D-226 起延续(PRD-22 收尾在 D-225 · 总 10 D · D-226~D-235) |
| **风险分档** | high × 3(US-001 /diagnosis 8 步 + US-002 /accounts modal + US-003 /step/8)+ medium × 6(US-004~009)+ 收官 × 1(US-010) |
| **anti_patterns 注入** | 3 high US 必须从 reject-examples.jsonl 检索 ≤ 3 条注入 · 高频关键词 · "stub 完整化" / "modal" / "8 步向导" / "stepData" / "unit test 同步"(PRD-22 教训) |
| **依赖前置 PRD** | PRD-15(/copywriting · /trending · /present-styles · /monetization · /private-domain · /my-topics · /history · /deep-learning 8 page 完整化基线) + PRD-16(D1=A + D4=B 设计系统) + PRD-19(8 stub baseline · 含本 PRD 要完整化的 stub) + PRD-21(visual-diff infra · expectVisualMatch helper) + PRD-22(inline picker utility 3 件套 + 13 visual baseline · TD-092/093 模板缺陷) · 严格保留不动 |
| **下游 PRD** | PRD-24(6 modules 视觉精修 · /daily-tasks · /evolution · /voice-chat 等 + 全 32 page visual diff 收官) |
| **baseline 抓取来源** | `/tmp/aiipznt-clone-research/{dump,screenshots}` 32 HTML + 32 PNG fullPage 1440px(2026-05-16 BJT 抓取) |
| **visual diff 配置** | 复用 PRD-21 D-206 maxDiffPixelRatio 0.05 + D-208 viewport 1440x900 + expectVisualMatch helper |
| **失败回滚** | `git branch backup/before-prd-23 main` 已建(本会话 21:00)· 任意 US 累计 3 reject 强制 retro + 拆 story |

### §0.3 复刻定调(D1=A + D4=B 严锁 · 继承 PRD-22)

| 维度 | 切 / 不切 |
|---|:-:|
| 整体页面布局(layout / 区块顺序 / 区块尺寸 / 容器宽度 / padding 方向) | ✅ **切 1:1 对齐 aiipznt** |
| spacing scale / 字体 / motion / hover effect / glass-card / inline picker | ✅ 切(继承 PRD-21/22 utility) |
| **文字内容(title / desc / H1 / H2 / H3 / H4 / p / button 文字 / FAQ q / a / placeholder)** | ✅ **严格 1:1**(D1A 字面锁) |
| **常量数据 1:1**(8 步问卷自评项 / 5 平台 / 4 阶段 / 3 直播经验等) | ✅ **严格 1:1**(constants 字面锁) |
| 颜色 token / D4=B | ❌ **D4=B 锁 · 保留当前 HSL 43° 金色 token 不变** |
| OKLCH 任何 ref / `var(--gold)` / `border-gold/X` 字面 | ❌ **替换为 `var(--primary)` / `border-primary/X`** |
| UX behavior(search filter / accordion 展开 / hover transition 时长 …) | 🟡 可自由发挥(D1=A 不锁) |
| **LLM 调用 + stub data**(基于 Step D 数据决策) | 🟡 **本 PRD 不接 LLM**(留 PRD-25+)· stub 完整化指 UI 骨架 + 表单 + 输出区结构 · 用静态 stub 数据示例 + 复用 PRD-22 inline picker · LLM 集成留 PRD-25+ |

**D4=B 反例锁**(继承 PRD-22) · 防 ralph 字面解读紫色 → Tailwind 真紫色 utility

**D1A 长文本字面双锁**(继承 PRD-22) · AC-1 锁完整字面 · AC-N 重复时复述完整字符

**unit test 同步规则**(PRD-22 TD-093 教训 · 本 PRD 必须严守) · 每个 US AC 必须显式列 "同步更新 apps/web/src/pages/**/__tests__/*.test.tsx unit test 期望对齐新字面 · vitest 全 pass"

### §0.4 D-226 ~ D-235 Locked Decisions(本 PRD 新建)

| ID | 决策 | Why |
|---|---|---|
| D-226 | /diagnosis 8 步问卷向导用通用 `DiagnosisStepCard` 组件驱动 · 路径 `apps/web/src/components/diagnosis/` · 8 step 共用 layout(顶部 "步骤 N / 8" + 大标题 + 副标 + checkbox 列 + 补充说明 textarea + 上/下一步 button) | spec §8.5.1 8 步 UI 模式相同 · 通用组件避免重复 |
| D-227 | /diagnosis 8 步自评项字面锁清单 · `DIAGNOSIS_DIMENSIONS_8` 常量 · 8 dimensions × 2-3 checkbox · 16 self-eval items 字面 1:1 spec §8.5.1 line 2392-2425 | D1A 严守 · 防 ralph 创意改写 checkbox 文字 |
| D-228 | /accounts IP 账号卡片用 `IpAccountCard` 组件 + 新建账号 modal 用 `CreateAccountModal` · 路径 `apps/web/src/components/accounts/` · ACTIVE 标 + 圆形头像首字符 + 行业/平台/粉丝量 + 业务描述 + [删除][编辑] button | spec §8.5.4 line 2518-2531 |
| D-229 | /step/8 2 子功能用 tabs 切换 · "生成直播方案" / "AI 优化话术" · 用 `<Tabs>` from shadcn · 每子功能独立表单 + CTA | spec §7.9 双子功能架构 |
| D-230 | /step/8 直播经验 radio 字面锁 · "新手 · 刚开始做直播" / "有经验 · 有一定直播经验" / "资深 · 直播经验丰富" · 完整字面 spec §7.9 line 1762 | D1A 严守 |
| D-231 | 4 stub 工具(/video-analysis · /analysis · /video-production · /acquisition-video)用 `ToolForm` 抽象(PRD-15 沉淀 · 跟 /generate inline 不同 · 因为这 4 page aiipznt 实测就是简单 form)· 表单字段从 constants import | spec §8.1.2 / §8.3.2-3.4 4 page 都是简单 textarea + CTA 模式 |
| D-232 | 14 page visual baseline 验证矩阵 · prd23-visual-baseline.spec.ts 14 fixture · `/diagnosis` `/accounts` `/step/8` + 4 stub 工具 + 6 PRD-15 沉淀工具 + 1 /step/6(PRD-22 已建) = 14 · baseline 名 prd23-XXX(本 PRD 内部 regression baseline · 不切 aiipznt 实拍 · TD-090 defer) | 继承 PRD-22 visual baseline 模式 · 不切 aiipznt 实拍(Step D 量化数据决策) |
| D-233 | unit test 同步硬规则 · 每个 US 重写 page/常量时 · 必须同步更新对应 `apps/web/src/pages/**/__tests__/*.test.tsx` 期望对齐新字面 · 不破 vitest 零回归 · PRD-22 TD-093 教训机制化 | 防 PRD-22 US-006/009 同模式 reject 重演 |
| D-234 | PRD-23 不接 LLM(D-225 同延续) · 4 工具 stub 完整化 = UI 骨架 + 表单 + stub 输出区(用静态示例数据) · LLM 集成留 PRD-25+ | 基于 Step D 数据 · LLM 接入是大工程 · 留独立 PRD |
| D-235 | TD-092 + TD-093 修复机制 · /step/3 PRD-22 AC 误算 H3 数 + PRD AC 模板漏写 unit test 同步 · 本 PRD US-010 收官时统一修复 PRD 文档 + plan-check 加规则 | 跨 PRD 改进 · 让 PRD-24 启动时 plan-check 自动 catch |

---

## §1 介绍/概述

PRD-21 + PRD-22 已 ship main(20 US · 55 commits · 13 visual baseline) · 5 inline 重构 + 8 step page 视觉精修完成。**Step D 量化数据**(.agents/verification/prd-22-visual-diff-vs-aiipznt.md)显示:

- ✅ 结构对齐 + D1A 字面锁严守(verify-prd-22.sh 52/52)
- 🔴 内容密度 vs aiipznt 实拍仍有 -30~-83% 差距(根因 · aiipznt 实拍含 LLM 内容 · QuanAn 是空骨架)
- 🟢 TD-090/091 已 defer 留 PRD-25+ 接 LLM 时再决策

**PRD-23 范围**(基于 Step D 数据收缩 · 不扩 LLM 接入):

### 1.1 3 stub 完整化(3 high US)

| Page | 当前状态 | aiipznt 实测 | PRD-23 目标 |
|---|---|---|---|
| /diagnosis | 33 LOC stub 占位 | 1 H1 + 12 button + 2 input + 8 步问卷向导 + 7 维度报告 | 8 步问卷向导(8 step common layout · 16 self-eval checkbox + 8 维度名 + 8 补充说明 textarea + 上/下一步)+ 第 8 步生成诊断报告(7 维度评分 stub + 改进建议 stub) |
| /accounts | 38 LOC stub | 2 H + 7 button + 当前账号卡 + 新建账号 modal | IP 账号列表(卡片 grid)+ ACTIVE 标 + 圆形头像首字符 + 新建账号 modal(4 字段:行业/平台/名字/业务描述) + 编辑/删除 button(stub action) |
| /step/8 | 69 LOC stub | 3 H + 2 子功能 + 16 button + 4 input | 2 子功能 tabs("生成直播方案" / "AI 优化话术") · 子功能 1 4 字段表单(产品描述 + 受众 + 5 平台 + 3 直播经验) · 子功能 2 textarea + 优化目标 + AI 优化 button |

### 1.2 4 内容创作工具 stub 完整化(4 medium US)

| Page | 当前状态 | aiipznt 实测 | PRD-23 目标 |
|---|---|---|---|
| /video-analysis | stub 未触 | 1 H1 + 7 button + 2 input · 简单 textarea | 真表单(视频标题 input + 视频文案 textarea ≥ 10 字)+ "开始深度解析" CTA + stub 输出区(钩子拆解 + 结构分析 + 爆款元素识别 + 评分 + 一键仿写) |
| /analysis | stub 未触 | 1 H1 + 7 button + 1 input · 简单 textarea | 真表单(文案 textarea ≥ 10 字 + 字符计数 0 字) + "开始分析" CTA + stub 输出区(结构拆解 + 节奏分析 + 爆款元素识别 + 多维评分 + 优化建议) |
| /video-production | stub 未触 | 1 H1 + 7 button + 1 input · 简单 textarea | 真表单(文案 textarea ≥ 10 字) + "生成制作方案" CTA + stub 输出区(分镜脚本 + 拍摄方案 + 口播提词器 + 剪辑指导) |
| /acquisition-video | stub 未触 | 1 H1 + 8 button + 2 input · 行业 dropdown + 客户画像 + 卖点 | 真表单(行业 dropdown + 目标客户画像 textarea + 产品/服务卖点 textarea) + "生成获客方案" CTA + stub 输出区(3 个方案 · 每方案含主题角度/钩子/内容结构/CTA) |

### 1.3 18 page visual baseline 验证(2 medium US)

US-008 + US-009 验证 18 page 已建 visual baseline + 修复 PRD-22 TD-092/093 PRD AC 模板缺陷:
- 6 PRD-15 沉淀工具 page(/trending · /present-styles · /monetization · /private-domain · /deep-learning · /copywriting)
- 4 PRD-22 inline 工具 page(/generate · /boom-generate · /ai-video · /knowledge)
- 8 PRD-22 step page(/step/1 · /step/3 · /step/3b · /step/4 · /step/4b · /step/5 · /step/6 · /step/7)
- 总 18 page + PRD-23 新加 7 page = 25 page visual baseline(为 PRD-24 全 32 page 收官打基础)

### 1.4 收官(1 medium US)

US-010 收官 · verify-prd-23.sh + /goal-verify §0 codebase 同步 + /prd-retro 跨 PRD-22 复盘 + AGENTS.md §11.14 PRD-23 沉淀 · 修 TD-092/093 PRD 模板缺陷 + plan-check 加 unit test 同步规则。

完成后 · 25 page visual baseline 建立 · 7 stub page 完整化 · PRD-23 ship · 准备 PRD-24 6 modules 视觉精修 + 全 32 page visual diff 收官。

---

## §2 目标

- ✅ /diagnosis 8 步问卷向导 + 16 自评项 + 7 维度诊断报告(stub 输出) · 跟 spec §8.5.1 1:1
- ✅ /accounts IP 账号列表 + 新建账号 modal(4 字段) + 编辑/删除 button · 跟 spec §8.5.4 1:1
- ✅ /step/8 2 子功能 tabs(生成直播方案 / AI 优化话术) · 4+2 字段表单 + stub 输出区 · 跟 spec §7.9 1:1
- ✅ /video-analysis 真表单(标题 + 文案) + stub 输出 5 区块 · 跟 spec §8.1.2 1:1
- ✅ /analysis 真表单(文案 ≥ 10 字 + 字符计数) + stub 输出 5 区块 · 跟 spec §8.3.2 1:1
- ✅ /video-production 真表单(文案 ≥ 10 字) + stub 输出 4 区块 · 跟 spec §8.3.3 1:1
- ✅ /acquisition-video 真表单(行业 + 客户画像 + 卖点) + stub 输出 3 方案 · 跟 spec §8.3.4 1:1
- ✅ 6 PRD-15 沉淀工具 + 4 PRD-22 inline 工具 visual baseline 验证 · 跑通 visual diff 5% threshold
- ✅ 修复 PRD AC 模板缺陷(TD-092/093) · plan-check 加 unit test 同步规则
- ✅ 10 US 全部 audit approved(Opus 4 维度 + risk_level 分档) · verify-prd-23.sh 通过 · 25 page visual baseline 建立 · 准备 PRD-24

---

## §3 User Stories(10)

### US-001 high · /diagnosis 8 步问卷向导 + 16 自评项 + 7 维度诊断报告

**风险分档** · 🔴 **high**(8 步问卷向导 + 通用 DiagnosisStepCard 组件 + 7 维度报告生成 · 跨 step 状态管理复杂 · spec §8.5.1 字面锁 16 self-eval items 严守)

**Story 大小** · medium(单次 ralph 迭代可完成 · 3 文件创建/修改 · ~450 LOC 新增)

**前置依赖** · spec §8.5.1 + 现有 /diagnosis 33 LOC stub(`apps/web/src/pages/Diagnosis.tsx`)

**用户故事** ·
作为 QuanAn 用户 · 当我访问 /diagnosis · 我看到 H1 "7 维度 IP 诊断报告" + 8 步问卷向导(每步通用 layout · 顶部"步骤 N / 8" + 维度名大标题 + 副标 + 自评 checkbox + 补充说明 textarea + 上/下一步 button) · 第 8 步生成"7 维度 IP 健康度报告"(每维度评分 + 改进建议 · stub data)。

**验收标准** ·

- **AC-1** · H1 字面锁 `7 维度 IP 诊断报告` · 副标题字面锁 `像老师一样诊断你的 IP，找出问题，给出具体可执行的改进方案`(spec §8.5.1 + D1A)
- **AC-2** · 新建 `apps/web/src/lib/constants/diagnosis.ts` · 导出 `DIAGNOSIS_DIMENSIONS_8` 数组 · 8 项 · 每项 `{ id, label, subtitle, checkboxes: string[] }` · 字面 1:1 spec §8.5.1 line 2392-2425 · 完整 16 self-eval checkbox 字面 ·
  ```typescript
  export const DIAGNOSIS_DIMENSIONS_8 = [
    { id: 'basic', label: '基本信息', subtitle: '行业 / 产品 / 阶段', checkboxes: [] },
    { id: 'positioning', label: '定位清晰度', subtitle: '赛道、产品、产品链条', checkboxes: [
      '已确定赛道方向',
      '产品定位明确，知道卖什么',
      '产品链条清晰（引流品→利润品→高端品）'
    ]},
    { id: 'branding', label: '账号包装', subtitle: '头像、昵称、简介', checkboxes: [
      '头像是生活化的真人照片',
      '昵称格式：小名/外号+行业（如：霖AIP·IP孵化）',
      '简介包含：我是谁+解决什么问题+提供什么价值+案例'
    ]},
    { id: 'traffic', label: '流量型内容', subtitle: '破圈引流，勾精准人群', checkboxes: [
      '有行业猎奇/奇葩/冷知识类选题',
      '有单条视频破10万播放'
    ]},
    { id: 'value', label: '价值型内容', subtitle: '干货教学，建立信任', checkboxes: [
      '有干货/教知识/痛点解决方案类内容',
      '有单条视频播放量超过20万'
    ]},
    { id: 'case', label: '案例型内容', subtitle: '展示结果，促进成交', checkboxes: [
      '有清晰的案例结果展示',
      '有详细的服务/合作过程记录',
      '有真实的用户评价/反馈'
    ]},
    { id: 'persona', label: '人设型内容', subtitle: '让人记住你这个人', checkboxes: [
      '有对人对事的态度/观点类内容',
      '有从业故事/创业故事类内容',
      '有做公益/体恤员工/孝顺父母等内容'
    ]},
    { id: 'authentic', label: '内容状态', subtitle: '真实、口语、有情绪', checkboxes: [
      '内容是真实的，不是演的',
      '说话是口语化的，不是念稿/播音腔',
      '内容有情绪感染力'
    ]},
  ] as const
  ```
- **AC-3** · 新建 `apps/web/src/components/diagnosis/DiagnosisStepCard.tsx` 通用 step 组件 · API ·
  ```typescript
  interface DiagnosisStepCardProps {
    stepIndex: number       // 1-8
    totalSteps: number      // 8
    dimension: DiagnosisDimension
    selectedCheckboxes: string[]
    onCheckboxToggle: (item: string) => void
    notes: string
    onNotesChange: (notes: string) => void
    onPrev: () => void
    onNext: () => void
    isFirst: boolean        // disabled 上一步
    isLast: boolean         // CTA 改 "生成诊断报告"
  }
  ```
  · 渲染 ·
  - 顶部 `步骤 {N} / 8 · {dimension.label}` font-display
  - H2 大标题 `{dimension.label}` text-h2 font-display
  - 副标 `{dimension.subtitle}` text-body-md muted
  - Step 1 special · 渲染 3 字段表单(行业 input + 产品 input + 阶段 radio 4 选 1 with description)
  - Step 2-8 · 渲染 checkbox 列(`dimension.checkboxes`) + "补充说明 (选填，越详细诊断越准)" textarea
  - 底部 `[上一步]` `[下一步]`(最后一步 `[生成诊断报告]`)
- **AC-4** · Step 1 阶段 radio 4 选 1 字面锁 · 完整 spec §8.5.1 line 2353-2359 字面 ·
  - `起步期 · 刚开始做 IP，还在摸索中`
  - `成长期 · 有一定内容了，但变现不稳定`
  - `爆发期 · 内容有爆款，正在放大变现`
  - `瓶颈期 · 遇到增长瓶颈，需要突破`
- **AC-5** · 重写 `apps/web/src/pages/Diagnosis.tsx` · useState 管理 8 step 状态(currentStep + selectedAnswers(Record<dimensionId, string[]>) + notesPerStep) · 渲染 `<DiagnosisStepCard {...props} />` 当前 step
- **AC-6** · Step 8 提交后 · 渲染 stub "7 维度 IP 健康度报告" · 7 维度评分(stub random 60-95) + 改进建议(stub 静态文本) + "导出诊断报告 PDF" button(stub onClick toast `导出功能 PRD-25+`)
- **AC-7** · 表单状态走 localStorage save(`diagnosis_progress_acc_{accountId}` key) · 用 ls-namespace helper(防 R-5 LD-009 多账号隔离)
- **AC-8** · DOM button 数 ≥ 12(8 步导航 button × 2 prev/next + 4 阶段 radio · 接近 aiipznt 12)
- **AC-9** · D-233 unit test 同步硬规则 · 新建 `apps/web/src/pages/__tests__/Diagnosis.test.tsx` · ≥ 5 test · 覆盖 H1 字面 / 8 step 切换 / checkbox 多选 / 报告显示 / localStorage save
- **AC-10** · 新建 `apps/web/src/components/diagnosis/__tests__/DiagnosisStepCard.test.tsx` · ≥ 5 test · 覆盖 props 渲染 / 上/下一步 click / 最后一步 CTA 变化
- **AC-11** · 新建 `apps/web/src/lib/constants/__tests__/diagnosis.test.ts` · ≥ 3 test · 覆盖 8 dimensions 数量 / 16 checkbox 总数 / 4 阶段字面
- **AC-12** · TypeScript 编译通过 · cd apps/web && pnpm typecheck → 0 error
- **AC-13** · vitest run 通过 · cd apps/web && pnpm exec vitest run → 总 ≥ 219 test pass(基线 PRD-22 206 + 新增 ≥ 13)
- **AC-14** · 新增 e2e tests/e2e/prd23-diagnosis-flow.spec.ts · ≥ 4 test(H1 / 8 step 切换 / Step 1 表单 / Step 8 报告显示)
- **AC-15** · 新增 visual baseline · tests/e2e/prd23-visual-baseline.spec.ts /diagnosis · baseline 'prd23-diagnosis.png' · viewport 1440x900 · 阈值 5% · 首跑 --update-snapshots + Read confirm
- **AC-16** · 用 agent-browser 打开 http://localhost:5173/diagnosis · 验证 (a) H1 + 副标 · (b) 8 step 切换流畅 · (c) Step 1 表单 + 4 阶段 radio · (d) Step 2-7 checkbox 多选 · (e) Step 8 报告显示 + 改进建议 · (f) console 无 error
- **Typecheck passes**

**测试范围** ·
- unit test · 13 new(5+5+3)
- e2e · 4 new
- visual diff · 1 new baseline

**文件 to create** ·
- `apps/web/src/lib/constants/diagnosis.ts`
- `apps/web/src/components/diagnosis/DiagnosisStepCard.tsx`
- `apps/web/src/pages/__tests__/Diagnosis.test.tsx`
- `apps/web/src/components/diagnosis/__tests__/DiagnosisStepCard.test.tsx`
- `apps/web/src/lib/constants/__tests__/diagnosis.test.ts`
- `tests/e2e/prd23-diagnosis-flow.spec.ts`
- `tests/e2e/prd23-visual-baseline.spec.ts`

**文件 to modify** ·
- `apps/web/src/pages/Diagnosis.tsx`(完整重写 · 替换 33 LOC stub)

**anti_patterns 注入** · prd skill 从 reject-examples.jsonl 检索 "stub 完整化" / "8 步向导" / "checkbox" / "unit test 同步" 关键词 · 注入 ≤ 3 条

---

### US-002 high · /accounts IP 账号管理 + 新建账号 modal

**风险分档** · 🔴 **high**(modal 新建账号流程 + tRPC ipAccounts.create 集成 + 当前 ACTIVE 切换 · 影响所有 page 全局 useActiveAccount hook)

**Story 大小** · medium(单次 ralph 迭代可完成 · 3 文件创建/修改 · ~380 LOC 新增)

**前置依赖** · spec §8.5.4 + 现有 /accounts 38 LOC stub + 现有 `useActiveAccount` hook + tRPC `ipAccounts.list` `.setActive` `.create` 已存在(PRD-1 沉淀)

**用户故事** ·
作为 QuanAn 用户 · 当我访问 /accounts · 我看到 H1 "IP 账号管理" + 副标 + "新建账号" button(顶部右侧) + IP 账号列表(卡片 grid · 每卡含 ACTIVE 标 + 圆形头像首字符 + 行业/平台 + 粉丝量 + 业务描述 + [删除][编辑] button) · 点其他账号切换 ACTIVE · 点"新建账号"弹 modal 填 4 字段后创建并跳 /step/1。

**验收标准** ·

- **AC-1** · H1 字面锁 `IP 账号管理` · 副标题字面锁 `管理多个 IP 账号，每个账号独立配置行业、定位和人设`(spec §8.5.4 + D1A)
- **AC-2** · 新建 `apps/web/src/components/accounts/IpAccountCard.tsx` · API ·
  ```typescript
  interface IpAccountCardProps {
    account: IpAccount
    isActive: boolean
    onActivate: () => void
    onEdit: () => void
    onDelete: () => void
  }
  ```
  · 渲染 ·
  - ACTIVE 标(若 isActive · 右上角 chip · `bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full`)
  - 圆形头像(d-12 · `rounded-full bg-primary/15 flex items-center justify-center` · 显示 `account.name[0]`)
  - H3 `{account.name}` font-display
  - text `{account.industry} · {account.platform}` muted
  - text `{account.followerCount} 粉` muted(stub `1-1000 粉` 若无数据)
  - text `{account.tagline}`(stub `从零开始做 IP` 若无)
  - text `{account.description}`(stub `定制智能体和 opc 培训` 若无)
  - 底部 `[删除]` `[编辑]` button(`stub onClick toast '功能 PRD-25+'` 占位)
- **AC-3** · 新建 `apps/web/src/components/accounts/CreateAccountModal.tsx` · 用 `<Dialog>` from shadcn · trigger button "新建账号"(顶部右侧 · `bg-gradient-to-r from-primary to-primary/60`) · modal 含 4 字段表单 ·
  - input `IP 账号名` 必填 placeholder `如：赵语AI`
  - input `行业` 必填 placeholder `如：企业服务`
  - radio 5 平台(复用 PlatformInlineRadio PRD-22 utility) `抖音/小红书/视频号/快手/B站`
  - textarea `业务描述`(选填) placeholder `如：定制智能体和 opc 培训`
  - 底部 `[取消]` `[创建并开始]` button(disabled if !name || !industry || !platform)
- **AC-4** · CreateAccountModal 保存 onClick · 调 `trpc.ipAccounts.create.useMutation()` · 成功 → toast "账号创建成功" + close modal + redirect `/step/1`(useNavigate)
- **AC-5** · 重写 `apps/web/src/pages/Accounts.tsx` · 渲染 grid `<IpAccountCard>` × N · `trpc.ipAccounts.list.useQuery()` 拉所有账号 · click 其他卡 → `trpc.ipAccounts.setActive.useMutation()` 切 active · 顶部右侧 `<CreateAccountModal trigger>`
- **AC-6** · DOM button 数 ≥ 7(2 button per account × 1 active + 2 button per inactive × N + 1 新建账号) · 接近 aiipznt 实测 7
- **AC-7** · D-233 unit test 同步 · 新建 `apps/web/src/pages/__tests__/Accounts.test.tsx` · ≥ 5 test(H1 / 账号列表 / ACTIVE 显示 / 切换 active / 新建账号 modal 弹)
- **AC-8** · 新建 `apps/web/src/components/accounts/__tests__/IpAccountCard.test.tsx` · ≥ 5 test
- **AC-9** · 新建 `apps/web/src/components/accounts/__tests__/CreateAccountModal.test.tsx` · ≥ 5 test(渲染 / 4 字段填写 / disabled 条件 / 取消关闭 / 创建成功跳转)
- **AC-10** · TypeScript 编译通过 · cd apps/web && pnpm typecheck → 0 error
- **AC-11** · vitest run 通过 · 总 ≥ 234 test(基线 219 + US-002 新增 ≥ 15)
- **AC-12** · 新增 e2e tests/e2e/prd23-accounts-flow.spec.ts · ≥ 5 test
- **AC-13** · visual baseline 加 /accounts · baseline 'prd23-accounts.png' · 阈值 5%
- **AC-14** · agent-browser 验证 · (a) H1 + 副标 · (b) 账号列表渲染 · (c) ACTIVE 标显示 · (d) 新建账号 modal 弹出 · (e) 4 字段填写 · (f) 创建成功跳 /step/1
- **Typecheck passes**

**文件 to create** ·
- `apps/web/src/components/accounts/IpAccountCard.tsx`
- `apps/web/src/components/accounts/CreateAccountModal.tsx`
- `apps/web/src/pages/__tests__/Accounts.test.tsx`
- `apps/web/src/components/accounts/__tests__/IpAccountCard.test.tsx`
- `apps/web/src/components/accounts/__tests__/CreateAccountModal.test.tsx`
- `tests/e2e/prd23-accounts-flow.spec.ts`

**文件 to modify** ·
- `apps/web/src/pages/Accounts.tsx`
- `tests/e2e/prd23-visual-baseline.spec.ts`

**anti_patterns 注入** · prd skill 检索 "modal" / "Dialog" / "tRPC mutation" / "unit test 同步" 关键词

---

### US-003 high · /step/8 直播策划 2 子功能 tabs

**风险分档** · 🔴 **high**(2 子功能 tabs 切换 · 状态独立 + stub 输出区结构复杂 · D-229/D-230 字面锁 spec §7.9)

**Story 大小** · medium(单次 ralph 迭代可完成 · 3 文件创建/修改 · ~400 LOC 新增)

**前置依赖** · spec §7.9 + 现有 /step/8 69 LOC stub + PRD-22 PlatformInlineRadio + useStepData hook

**用户故事** ·
作为 QuanAn 用户 · 当我访问 /step/8 · 我看到 H1 "直播策划" + 副标 + 2 子功能 tabs("生成直播方案" / "AI 优化话术") · 子功能 1 4 字段表单(产品描述 + 受众 + 5 平台 + 3 直播经验) + "生成直播方案" CTA + stub 输出 6 区块 · 子功能 2 textarea + 优化目标 + "AI 优化话术" CTA + stub 输出。

**验收标准** ·

- **AC-1** · H1 字面锁 `直播策划` · 副标题字面锁 spec §7.9 line 1753 `当前行业：{industry}。AI 将生成完整的直播方案，包含详细话术、引流策略、互动设计，并支持 AI 优化直播脚本。` · 顶部副标签 `STEP 08 · 直播策划`(D-224)
- **AC-2** · 2 子功能 tabs 用 `<Tabs>` from shadcn · TabsList + 2 TabsTrigger · 顺序固定 ·
  - tab 1 `生成直播方案`(默认 active)
  - tab 2 `AI 优化话术`
- **AC-3** · 新建 `apps/web/src/lib/constants/step8.ts` · 导出 `STEP8_PLATFORMS_5`(复用 PRD-22 PLATFORMS) + `STEP8_EXPERIENCES_3` 字面锁 · 完整 spec §7.9 line 1762 ·
  ```typescript
  export const STEP8_EXPERIENCES_3 = [
    { id: 'novice',       label: '新手',   subtitle: '刚开始做直播' },
    { id: 'experienced',  label: '有经验', subtitle: '有一定直播经验' },
    { id: 'senior',       label: '资深',   subtitle: '直播经验丰富' },
  ] as const
  ```
- **AC-4** · tab 1 "生成直播方案" 表单 ·
  - textarea `产品/服务信息` 必填 placeholder `描述你要在直播中推广的产品或服务...`
  - input `目标受众` placeholder `如：25-40岁女性...`
  - radio 5 平台(`<PlatformInlineRadio>` 复用 PRD-22)
  - radio 3 直播经验(自定义 3 button · 每 button label + subtitle 双行)
  - CTA button `生成直播方案`(disabled if !product || !platform || !experience)
- **AC-5** · tab 1 stub 输出 spec §7.9 line 1782 · 6 H3 区块 · 字面锁 ·
  - H3 `开场话术`
  - H3 `中场互动`
  - H3 `成交话术`
  - H3 `收尾`
  - H3 `引流策略`
  - H3 `互动设计`
  - 每 H3 块 glass-card + stub markdown 内容
- **AC-6** · tab 2 "AI 优化话术" 表单 ·
  - textarea `直播话术脚本` 必填 ≥ 10 字 · placeholder `粘贴你的直播话术脚本（至少 10 个字），AI 将深度优化话术表达、互动设计和转化逻辑...`
  - input `优化目标` placeholder `优化目标（可选），如：提升互动率、增强转化、更有感染力...`
  - CTA button `AI 优化话术`(disabled if text.length < 10)
- **AC-7** · tab 2 stub 输出 · 简单 markdown 渲染(`<ReactMarkdown>`)显示优化后话术 + 4 H3 区块(优化亮点 / 互动设计 / 转化关键 / 注意事项)
- **AC-8** · 表单状态 stepData.save(step8) · 用 useStepData hook
- **AC-9** · DOM button 数 ≥ 15(2 tabs + 5 平台 + 3 经验 + 2 CTA + 3 stub action button) · 接近 aiipznt 16
- **AC-10** · DOM H 标签 ≥ 7(H1 + 6 H3 tab 1 输出) · 接近 aiipznt 3 (但 stub 输出展开后更多)
- **AC-11** · D-233 unit test 同步 · 重写 `apps/web/src/pages/step/__tests__/Step8.test.tsx` 期望对齐新字面(2 tabs / 6 H3 输出 / 3 经验 radio) · ≥ 6 test
- **AC-12** · 新建 `apps/web/src/lib/constants/__tests__/step8.test.ts` · ≥ 3 test
- **AC-13** · TypeScript 编译通过
- **AC-14** · vitest run 通过 · 总 ≥ 243 test(基线 234 + 新增 ≥ 9)
- **AC-15** · 新增 e2e tests/e2e/prd18-step8-flow.spec.ts(更新现有 PRD-18 sub) · ≥ 5 test
- **AC-16** · visual baseline 加 /step/8 · baseline 'prd23-step8.png' · 阈值 5%
- **AC-17** · agent-browser 验证 · (a) H1 + 副标 · (b) 2 tabs 切换 · (c) tab 1 4 字段 + 3 经验 · (d) tab 2 textarea + 优化目标 · (e) CTA disabled 条件 · (f) stub 输出 6 H3 渲染
- **Typecheck passes**

**文件 to create** ·
- `apps/web/src/lib/constants/step8.ts`
- `apps/web/src/lib/constants/__tests__/step8.test.ts`

**文件 to modify** ·
- `apps/web/src/pages/step/Step8.tsx`(完整重写)
- `apps/web/src/pages/step/__tests__/Step8.test.tsx`
- `tests/e2e/prd18-step8-flow.spec.ts`(如不存在则新建)
- `tests/e2e/prd23-visual-baseline.spec.ts`

**anti_patterns 注入** · prd skill 检索 "tabs" / "子功能切换" / "stepData" / "unit test 同步"

---

### US-004 medium · /video-analysis 真表单 + stub 输出(爆款文案解析)

**风险分档** · 🟡 medium(简单 form 但 stub 输出 5 区块结构)

**Story 大小** · small(单次 ralph 迭代可完成 · 2 文件 · ~220 LOC)

**前置依赖** · spec §8.1.2 + 现有 /video-analysis stub + ToolForm 抽象(PRD-15)

**用户故事** ·
作为 QuanAn 用户 · 当我访问 /video-analysis · 我看到 H1 "爆款文案解析" + 副标 + 使用方法提示 + 真表单(视频标题 input 选填 + 视频文案 textarea ≥ 10 字) + "开始深度解析" CTA + stub 输出 5 区块(钩子拆解 + 结构分析 + 爆款元素识别 + 评分 + 一键仿写)。

**验收标准** ·

- **AC-1** · H1 字面锁 `爆款文案解析` · 副标题字面锁 `粘贴爆款视频的完整文案/口播稿，AI 将深度拆解爆款密码，支持一键仿写`(spec §8.1.2)
- **AC-2** · 使用方法提示 infobox · 字面 `打开抖音/小红书/快手等 APP → 找到爆款视频 → 复制视频的完整口播文案/文字内容 → 粘贴到下方输入框 → 点击「开始深度解析」`
- **AC-3** · 表单字段 ·
  - input `视频标题` 选填 placeholder `视频标题（选填）`
  - textarea `视频文案` 必填 ≥ 10 字 placeholder `粘贴爆款视频的完整文案/口播稿（至少 10 个字）...`
- **AC-4** · CTA button `开始深度解析`(disabled if text.length < 10)
- **AC-5** · stub 输出 5 H3 区块 ·
  - H3 `钩子拆解` desc `开头 3 秒为什么留人`
  - H3 `结构分析` desc `起承转合`
  - H3 `爆款元素识别` desc `用了贪念/恐惧/反差等中的哪几个`
  - H3 `多维评分`(10 维度 stub)
  - H3 `一键仿写` button → 跳 /generate(predfill scriptType)
- **AC-6** · D-233 unit test 同步 · 新建 `apps/web/src/pages/tools/__tests__/VideoAnalysis.test.tsx` · ≥ 4 test(H1 / 表单 / disabled / 输出 5 H3)
- **AC-7** · TypeScript + vitest 通过(总 ≥ 247)
- **AC-8** · 新增 e2e tests/e2e/prd23-video-analysis-flow.spec.ts · ≥ 3 test
- **AC-9** · visual baseline 加 /video-analysis · 'prd23-video-analysis.png' · 阈值 5%
- **AC-10** · agent-browser 验证 (a) H1 + 提示 · (b) 表单 disabled · (c) ≥ 10 字 enabled · (d) stub 5 H3 输出
- **Typecheck passes**

**文件 to create** ·
- `apps/web/src/pages/tools/__tests__/VideoAnalysis.test.tsx`
- `tests/e2e/prd23-video-analysis-flow.spec.ts`

**文件 to modify** ·
- `apps/web/src/pages/tools/VideoAnalysis.tsx`(完整重写 stub→真表单)
- `tests/e2e/prd23-visual-baseline.spec.ts`

---

### US-005 medium · /analysis 真表单 + stub 输出(文案结构分析)

**风险分档** · 🟡 medium(简单 form · 跟 /video-analysis 区别是分析自己写的文案不是仿写爆款)

**Story 大小** · small(单次 ralph 迭代可完成 · 2 文件 · ~200 LOC)

**前置依赖** · spec §8.3.2

**用户故事** ·
作为 QuanAn 用户 · 当我访问 /analysis · 我看到 H1 "文案结构分析" + 副标 + 真表单(文案 textarea ≥ 10 字 + 字符计数 `0 字`) + "开始分析" CTA + stub 输出 5 区块。

**验收标准** ·

- **AC-1** · H1 字面锁 `文案结构分析` · 副标题字面锁 `粘贴任意短视频文案，AI 将从结构、节奏、爆款元素等多维度深度分析`(spec §8.3.2)
- **AC-2** · 表单字段 ·
  - textarea `文案` 必填 ≥ 10 字 placeholder `粘贴需要分析的短视频文案（至少 10 个字）...`
  - 字符计数 `{text.length} 字`(右下角)
- **AC-3** · CTA button `开始分析`(disabled if text.length < 10)
- **AC-4** · stub 输出 5 H3 区块 ·
  - H3 `结构拆解` desc `起承转合 / 起转合 / hook-body-cta 等`
  - H3 `节奏分析` desc `每段时长 / 留人率预测`
  - H3 `爆款元素识别`
  - H3 `多维评分`
  - H3 `优化建议`
- **AC-5** · D-233 unit test 同步 · 新建 test · ≥ 4 test
- **AC-6** · TypeScript + vitest 通过(总 ≥ 251)
- **AC-7** · 新增 e2e tests/e2e/prd23-analysis-flow.spec.ts · ≥ 3 test
- **AC-8** · visual baseline 加 /analysis · 'prd23-analysis.png' · 阈值 5%
- **AC-9** · agent-browser 验证
- **Typecheck passes**

**文件 to create** ·
- `apps/web/src/pages/tools/__tests__/Analysis.test.tsx`
- `tests/e2e/prd23-analysis-flow.spec.ts`

**文件 to modify** ·
- `apps/web/src/pages/tools/Analysis.tsx`(完整重写)
- `tests/e2e/prd23-visual-baseline.spec.ts`

---

### US-006 medium · /video-production 真表单 + stub 输出(短视频一键制作)

**风险分档** · 🟡 medium(简单 form · 输出区比 /video-analysis 多 4 个 H3 块)

**Story 大小** · small(单次 ralph 迭代可完成 · 2 文件 · ~220 LOC)

**前置依赖** · spec §8.3.3

**用户故事** ·
作为 QuanAn 用户 · 当我访问 /video-production · 我看到 H1 "短视频一键制作" + 副标 + 真表单(文案 textarea ≥ 10 字) + "生成制作方案" CTA + stub 输出 4 H3 区块(分镜脚本 + 拍摄方案 + 口播提词器 + 剪辑指导)。

**验收标准** ·

- **AC-1** · H1 字面锁 `短视频一键制作` · 副标题字面锁 `输入文案，AI 自动生成分镜脚本、拍摄方案、口播提词器和剪辑指导`(spec §8.3.3)
- **AC-2** · 表单字段 ·
  - textarea `文案` 必填 ≥ 10 字 placeholder `粘贴你的短视频文案（至少 10 个字），AI 将为你生成完整的制作方案...`
- **AC-3** · CTA button `生成制作方案`(disabled if text.length < 10)
- **AC-4** · stub 输出 4 H3 区块 ·
  - H3 `分镜脚本` desc `同 step/6`
  - H3 `拍摄方案` desc `设备 / 灯光 / 服装`
  - H3 `口播提词器` desc `断句 / 重音`
  - H3 `剪辑指导` desc `卡点 / 特效 / 字幕样式`
- **AC-5** · D-233 unit test 同步 · ≥ 4 test
- **AC-6** · TypeScript + vitest 通过(总 ≥ 255)
- **AC-7** · 新增 e2e tests/e2e/prd23-video-production-flow.spec.ts · ≥ 3 test
- **AC-8** · visual baseline 加 /video-production · 'prd23-video-production.png' · 阈值 5%
- **AC-9** · agent-browser 验证
- **Typecheck passes**

**文件 to modify** · `apps/web/src/pages/tools/VideoProduction.tsx` + 对应 test + e2e

---

### US-007 medium · /acquisition-video 真表单 + stub 输出(获客型视频)

**风险分档** · 🟡 medium(form 含 dropdown + 2 textarea · stub 输出 3 方案 grid)

**Story 大小** · small-medium(单次 ralph 迭代可完成 · 2 文件 · ~260 LOC)

**前置依赖** · spec §8.3.4 + 现有 industries 常量(PRD-22 PlatformInlineRadio 不适用 · 这里是行业 dropdown 不是 platform)

**用户故事** ·
作为 QuanAn 用户 · 当我访问 /acquisition-video · 我看到 H1 "获客型视频制作" + 副标 + 真表单(行业 dropdown + 客户画像 textarea + 卖点 textarea) + "生成获客方案" CTA + stub 输出 3 方案 grid(每方案含主题角度/钩子/内容结构/CTA)。

**验收标准** ·

- **AC-1** · H1 字面锁 `获客型视频制作` · 副标题字面锁 `专为获客设计的短视频方案，让精准客户主动找上门`(spec §8.3.4)
- **AC-2** · 表单字段 ·
  - dropdown `选择行业` 必填 默认当前账号行业 placeholder `📲 自媒体运营`
  - textarea `目标客户画像` 必填 placeholder `描述您的理想客户，例如：想要创业的30-45岁宝妈群体，有一定积蓄但缺乏方向...`
  - textarea `产品/服务卖点` 必填 placeholder `描述您的核心卖点，例如：0基础可学、3个月回本、一对一指导...`
- **AC-3** · CTA button `生成获客方案`(disabled if !industry || !audience || !sellingPoints)
- **AC-4** · stub 输出 3 方案 grid · 每方案 glass-card · 含 4 H4 ·
  - H4 `主题角度`
  - H4 `钩子`
  - H4 `内容结构`
  - H4 `CTA`
- **AC-5** · D-233 unit test 同步 · ≥ 4 test
- **AC-6** · TypeScript + vitest 通过(总 ≥ 259)
- **AC-7** · 新增 e2e tests/e2e/prd23-acquisition-video-flow.spec.ts · ≥ 3 test
- **AC-8** · visual baseline 加 /acquisition-video · 'prd23-acquisition-video.png' · 阈值 5%
- **AC-9** · agent-browser 验证(行业 dropdown 默认值取当前账号 · 2 textarea 字面 placeholder · 3 方案 grid stub)
- **Typecheck passes**

**文件 to modify** · `apps/web/src/pages/tools/AcquisitionVideo.tsx` + 对应 test + e2e

---

### US-008 medium · 6 PRD-15 沉淀工具 page visual baseline 验证 + 修复

**风险分档** · 🟡 medium(纯验证 · 不重写代码 · 仅加 visual baseline + 修发现的小问题)

**Story 大小** · medium(单次 ralph 迭代可完成 · 6 fixture + 修小问题 · ~200 LOC)

**前置依赖** · PRD-15 沉淀 6 工具 page 已完整(/trending · /present-styles · /monetization · /private-domain · /deep-learning · /copywriting · /my-topics · /history)

**用户故事** ·
作为 QuanAn 视觉一致性 owner · 我需要把 PRD-15 沉淀的 8 工具 page 加入 visual baseline 体系(prd23-visual-baseline.spec.ts) · 这样跟 PRD-22 + PRD-23 新建 page 一致 · 跑 visual diff 5% threshold 检测 regression。

**验收标准** ·

- **AC-1** · prd23-visual-baseline.spec.ts 加 8 fixture ·
  - /trending · baseline 'prd23-trending.png'
  - /present-styles · baseline 'prd23-present-styles.png'
  - /monetization · baseline 'prd23-monetization.png'
  - /private-domain · baseline 'prd23-private-domain.png'
  - /deep-learning · baseline 'prd23-deep-learning.png'
  - /copywriting · baseline 'prd23-copywriting.png'
  - /my-topics · baseline 'prd23-my-topics.png'
  - /history · baseline 'prd23-history.png'
- **AC-2** · 每 fixture viewport 1440x900 + fullPage + 阈值 5% · 复用 PRD-21 expectVisualMatch helper
- **AC-3** · 首跑 `pnpm exec playwright test prd23-visual-baseline --update-snapshots` 生成 baseline · Read confirm 每张图肉眼无明显错误(无 broken page / 无 console error)
- **AC-4** · 如果 page 有视觉问题(font/spacing/color 偏差)· 修小问题(scope ≤ 50 LOC) · 不重写代码
- **AC-5** · D-233 unit test 同步(如有改动 page · 同步更新 tests)
- **AC-6** · TypeScript + vitest 通过 · 总 ≥ 259(不增加新 test · 仅验证 regression)
- **AC-7** · pnpm exec playwright test prd23-visual-baseline 全 pass · 阈值 5%
- **AC-8** · agent-browser 抽查 3 page(/trending · /copywriting · /my-topics) · 验证 (a) page 渲染正常 · (b) console 无 error · (c) 视觉跟 baseline 一致
- **Typecheck passes**

**文件 to modify** ·
- `tests/e2e/prd23-visual-baseline.spec.ts`(加 8 fixture)
- 视觉问题 page(scope ≤ 50 LOC 修补)

---

### US-009 medium · 4 PRD-22 inline 工具 + 8 step page visual baseline 验证

**风险分档** · 🟡 medium(纯验证 PRD-22 已建 13 baseline + 加额外 baseline · 跟 US-008 类似但 scope 不同)

**Story 大小** · small-medium(单次 ralph 迭代可完成 · ~150 LOC)

**前置依赖** · PRD-22 已建 13 visual baseline(prd22-visual-baseline.spec.ts)

**用户故事** ·
作为 QuanAn 视觉一致性 owner · 我需要验证 PRD-22 已建 13 baseline 在 main 上仍 pass · 并把 PRD-22 baseline 的命名标准化(若需要)。

**验收标准** ·

- **AC-1** · 跑 `pnpm exec playwright test prd22-visual-baseline` 13 fixture · 全 pass · 阈值 5%
- **AC-2** · 跑 `pnpm exec playwright test prd23-visual-baseline` 8+7 = 15 fixture · 全 pass(US-001~007 + US-008)
- **AC-3** · 总 visual baseline 数 · 13(PRD-22) + 15(PRD-23 US-001~008) = 28 baseline · 验证全 pass
- **AC-4** · 任一 fixture fail · 修复或登记 TD(scope ≤ 100 LOC)
- **AC-5** · D-233 unit test 同步(如有 page 改动)
- **AC-6** · TypeScript + vitest 通过 · 总 ≥ 259
- **AC-7** · agent-browser 抽查 2 PRD-22 inline page(/generate · /knowledge) · 验证渲染正常
- **Typecheck passes**

**文件 to modify** ·
- `tests/e2e/prd23-visual-baseline.spec.ts`(微调 if needed)
- 修发现的 regression(scope ≤ 100 LOC)

---

### US-010 收官 · verify-prd-23.sh + /goal-verify + /prd-retro + TD-092/093 修复

**风险分档** · 🟡 medium(收官 · 不写新代码 · 验证 + 文档 + 修 PRD AC 模板缺陷)

**Story 大小** · medium(scripts + docs · ~400 LOC)

**前置依赖** · US-001~009 全部完成

**用户故事** ·
作为 PRD-23 收官 owner · 我需要 verify-prd-23.sh 完整 10 section · 25+ checks + /goal-verify §0 跑 gsd-map-codebase + /prd-retro 反哺 reject-examples.jsonl + 修复 TD-092(PRD AC 误算 H3)+ TD-093(PRD AC 模板加 unit test 同步规则) · 这样 PRD-23 ship 后下游 PRD-24 能正确启动。

**验收标准** ·

- **AC-1** · 新建 `scripts/verify-prd-23.sh` · 复用 PRD-22 10 section 结构 · ≥ 60 checks · 关键检查 ·
  - §1 /diagnosis · grep `7 维度 IP 诊断报告` H1 + 16 self-eval checkbox 字面 + 8 step 通用组件
  - §2 /accounts · grep `IP 账号管理` H1 + IpAccountCard 组件存在 + CreateAccountModal 组件存在
  - §3 /step/8 · grep `直播策划` H1 + 2 tabs `生成直播方案` / `AI 优化话术` + 6 H3 输出区
  - §4 /video-analysis · grep `爆款文案解析` H1 + 5 H3 输出区
  - §5 /analysis · grep `文案结构分析` H1 + 5 H3 输出区
  - §6 /video-production · grep `短视频一键制作` H1 + 4 H3 输出区
  - §7 /acquisition-video · grep `获客型视频制作` H1 + 3 方案 + 4 H4
  - §8 跨 page · typecheck 0 errors + vitest ≥ 259 test pass
  - §9 visual baseline · prd23-visual-baseline 14 fixture + prd22 13 fixture 全 pass · 总 28 baseline
  - §10 unit test 同步规则验证 · D-233 锁 · 7 个 page (`Diagnosis/Accounts/Step8/VideoAnalysis/Analysis/VideoProduction/AcquisitionVideo`) 都有对应 __tests__/*.test.tsx
- **AC-2** · 修复 PRD AC 模板 · 新建 `~/.claude/playbooks/prd-template-unit-test-sync.md` · 写"D-233 unit test 同步硬规则" · 给下次 prd skill 写 PRD 时显式列必加
- **AC-3** · 更新 `~/.claude/skills/prd/SKILL.md` AC template · 加 "## 必加 unit test 同步 AC"(对应 TD-093 修复)
- **AC-4** · 更新 `~/.claude/skills/plan-check/SKILL.md` §2.6.X 加 "unit test 同步检测规则" · 对应 page 重写 + __tests__ 文件不同步 · WARN(对应 TD-093 自动 catch)
- **AC-5** · /goal-verify 跑 §0 · `apps/web/.planning/codebase/` 7 文件 gsd-map-codebase 重新生成 · D1=A 字面对账(7 new page H1/副标/H3/H4 + DIAGNOSIS_DIMENSIONS_8 + STEP8_EXPERIENCES_3 + 4 工具 placeholder)
- **AC-6** · /goal-verify §1+ · 对比 PRD-23 §2 目标 10 项 vs 10 US 交付 · 全 10 项 ✅
- **AC-7** · /prd-retro · 跨 PRD-22 vs PRD-23 复盘 · 反哺 ~/.claude/playbooks/reject-examples.jsonl · 输出 `.agents/retros/prd-23-vs-prd-22-retrospective.md`
- **AC-8** · 更新 `.agents/tech-debt.json` · 关 TD-092 + TD-093 (status=closed 因为 AC-2/3/4 修了 PRD 模板和 plan-check)
- **AC-9** · 更新 `AGENTS.md §11.14` · 加 PRD-23 沉淀(stub 完整化 pattern + DiagnosisStepCard 通用组件 + visual baseline 25 page · 准备 PRD-24 32 page 收官)
- **AC-10** · 更新 `scripts/ralph/progress.txt` · ship summary
- **AC-11** · TypeScript + vitest 通过
- **AC-12** · bash scripts/verify-prd-23.sh · 全 PASS · 退出码 0
- **Typecheck passes**

**文件 to create** ·
- `scripts/verify-prd-23.sh`
- `.agents/goal-verify/prd-23-goal-verify.md`
- `.agents/retros/prd-23-vs-prd-22-retrospective.md`
- `~/.claude/playbooks/prd-template-unit-test-sync.md`(全局 · TD-093 修复)

**文件 to modify** ·
- `apps/web/.planning/codebase/`(/gsd-map-codebase)
- `.agents/tech-debt.json`(关 TD-092/093)
- `AGENTS.md`(§11.14)
- `scripts/ralph/progress.txt`
- `~/.claude/skills/prd/SKILL.md`(全局 · TD-093 修复)
- `~/.claude/skills/plan-check/SKILL.md`(全局 · TD-093 自动 catch)

---

## §4 验收标准摘要(plan-check 友好格式)

### §4.1 7 stub page 完整化矩阵

| Page | US | 关键 AC 数 | DOM button 目标 | H 标签目标 | visual baseline |
|---|:-:|:-:|:-:|:-:|:-:|
| /diagnosis | US-001 | 16 | ≥ 12 | 9(H1 + 8 维度 H2) | prd23-diagnosis.png |
| /accounts | US-002 | 14 | ≥ 7 | 1 H1 + N H3 | prd23-accounts.png |
| /step/8 | US-003 | 17 | ≥ 15 | 1 H1 + 6+4 H3 | prd23-step8.png |
| /video-analysis | US-004 | 10 | ≥ 4 | 1 H1 + 5 H3 | prd23-video-analysis.png |
| /analysis | US-005 | 9 | ≥ 3 | 1 H1 + 5 H3 | prd23-analysis.png |
| /video-production | US-006 | 9 | ≥ 3 | 1 H1 + 4 H3 | prd23-video-production.png |
| /acquisition-video | US-007 | 9 | ≥ 4 | 1 H1 + 4 H4 × 3 方案 | prd23-acquisition-video.png |

### §4.2 共享 AC(全 10 US)

- **AC-X1** · typecheck 0 errors
- **AC-X2** · vitest 测试增量 ≥ 259(基线 PRD-22 206 + US-001~007 新增 ≥ 53)
- **AC-X3** · D1=A 字面锁严守(H1 / 副标 / H3 / H4 / placeholder / button name)
- **AC-X4** · D4=B 颜色严锁(无 `from-violet-X` / `from-amber-X`)
- **AC-X5** · **D-233 unit test 同步**(每 US 必须同步更新对应 __tests__/*.test.tsx)
- **AC-X6** · glass-card + FadeInWrapper 用到所有 H3 输出块(继承 PRD-22 polish)
- **AC-X7** · 已有 e2e 不破(PRD-15~22 所有 e2e fixture)

### §4.3 跨 US 集成 AC

- **AC-Y1** · 25 page visual baseline 全建立(prd22 13 + prd23 15)
- **AC-Y2** · stepData.save 集成 /step/8(useStepData hook)
- **AC-Y3** · verify-prd-23.sh 60+ checks 全 PASS
- **AC-Y4** · TD-092 + TD-093 在 US-010 收官时关闭 · 反哺 ~/.claude/ 全局 skill 模板

---

## §5 风险红线(自我把控)

### §5.1 不变红线(继承 PRD-15~22)

1. ❌ 不删 PRD-15 沉淀 8 page 代码 · 仅视觉验证 + 小修复
2. ❌ 不切金色 token(D4=B)
3. ❌ 不动 admin
4. ❌ 不重写 backend
5. ❌ 不直接 copy aiipznt 版权专属内容 · 用 QuanAn 占位
6. ❌ 不绕过 Audit Gate
7. 🛑 推送远程 / 删数据 / 改 schema 破坏 · 提前问

### §5.2 PRD-23 新加红线

8. ❌ **不接 LLM**(D-234 · 留 PRD-25+)· 4 工具 stub 完整化 = UI 骨架 + 真表单 + stub 输出 · 不调 trpc.XXX.generate 等
9. ❌ **不切 aiipznt 实拍 baseline**(TD-090 defer · 保持 prd23-XXX 自截图 · 内部 regression baseline)
10. ❌ DiagnosisStepCard 不能 hardcode 8 维度 · 必须接 props 接受 DIAGNOSIS_DIMENSIONS_8(每 step 不同)
11. ❌ /accounts CreateAccountModal 不能跳过 tRPC 调用 · 必须真调 `ipAccounts.create.useMutation()`
12. ❌ /step/8 2 子功能 tab 切换不允许丢状态 · 用 useState 独立 state(子功能 1 form + 子功能 2 form 独立)
13. ❌ **D-233 unit test 同步硬规则** · 任 US 重写 page 必须同步更新对应 __tests__/*.test.tsx · 否则 reject(继承 PRD-22 TD-093 教训)

---

## §6 失败回滚 + 拆 story 协议

### §6.1 backup branch

`git branch backup/before-prd-23 main`(本会话 21:00 已建)

### §6.2 拆 story 触发

按全局 CLAUDE.md §9.6 ·
- size_hint=large 必须拆 ≥ 3 子 story
- prompt > 11K 字节 → 拒启 daemon
- 单 story 累计 3 retry → 强制 retro

### §6.3 PRD-23 预测拆分点

| US | size_hint | 拆分预案 |
|---|---|---|
| US-001 | medium | 拆 US-001a(8 维度 constants + DiagnosisStepCard 通用组件)+ US-001b(Diagnosis.tsx page + 8 step 状态)+ US-001c(Step 8 报告 + localStorage) 如 ≥ 5 reject |
| US-002 | medium | 拆 US-002a(IpAccountCard + Accounts.tsx 列表)+ US-002b(CreateAccountModal + tRPC create)如 ≥ 3 reject |
| US-003 | medium | 拆 US-003a(/step/8 2 tabs + form 1)+ US-003b(form 2 + stub 输出)如 ≥ 3 reject |
| US-004~007 | small | 不拆(每 US 1 page · 简单 form) |
| US-008~009 | medium | 不拆(纯验证 · 不写新代码) |
| US-010 | medium | 不拆(收官 docs) |

---

## §7 依赖图谱

### §7.1 前置 PRD(严格保留不动)

- **PRD-15**(/copywriting / /trending / /present-styles / /monetization / /private-domain / /my-topics / /history / /deep-learning 8 page 完整化)
- **PRD-16~20**(设计系统 + 9 step page + 14 工具 + LLM Gateway 基础)
- **PRD-21**(visual-diff infra · expectVisualMatch helper)
- **PRD-22**(3 inline picker utility + 13 visual baseline + glass-card.tsx + FadeInWrapper polish)

### §7.2 US 依赖

```
US-001 (high) /diagnosis  ← 独立 · spec §8.5.1
US-002 (high) /accounts   ← 独立 · tRPC ipAccounts 已存在
US-003 (high) /step/8     ← PRD-22 PlatformInlineRadio + useStepData
US-004 (medium) /video-analysis  ← 独立 · 简单 form
US-005 (medium) /analysis        ← 独立 · 简单 form
US-006 (medium) /video-production ← 独立
US-007 (medium) /acquisition-video ← 独立
US-008 (medium) 6 PRD-15 工具 verify ← 不依赖
US-009 (medium) PRD-22 13 baseline verify ← US-001~007 完成后跑
US-010 (收官)              ← US-001~009 全部
```

### §7.3 下游 PRD

- **PRD-24** · 6 modules 视觉精修(/daily-tasks · /evolution · /my-topics · /history · /voice-chat · /accounts ?) + 全 32 page visual diff 收官
- **PRD-25+** · LLM 接入(/diagnosis 7 维度真评分 + /step/8 真直播方案 + 4 工具 LLM 输出) · 留独立大 PRD

---

## §8 进度跟踪

### §8.1 daemon 命令

```bash
cd /Users/return/Desktop/QuanAn
ls scripts/ralph/prd-23.json && cp scripts/ralph/prd-23.json scripts/ralph/prd.json
python3 scripts/ralph/ralph-tools.py status

# Monitor(必先于 daemon)
Monitor(command="tail -n 0 -F scripts/ralph/ralph-output.log 2>/dev/null | grep -E --line-buffered 'PENDING_DETECTED|审计门禁已激活|APPROVED|REJECTED|所有任务已完成|All stories resolved|非零退出码|最大重试次数|级联阻断|通过 Opus 质量审查|⛔|Traceback|Error:'", persistent=true, timeout_ms=3600000)

# Daemon
/Users/return/.local/bin/python3.11 scripts/ralph/ralph.py --model sonnet --daemon
```

### §8.2 预期时间线

| US | 预期 ralph 时间 | 累计 |
|---|:-:|:-:|
| US-001 high | 50-65 min(8 step + 组件) | 1h |
| US-002 high | 40-50 min(modal + tRPC) | 1.75h |
| US-003 high | 40-55 min(2 tabs + stub 输出) | 2.75h |
| US-004 medium | 20-30 min | 3.25h |
| US-005 medium | 20-30 min | 3.75h |
| US-006 medium | 20-30 min | 4.25h |
| US-007 medium | 25-35 min(dropdown + 3 方案) | 5h |
| US-008 medium | 35-45 min(8 baseline 首跑 + Read confirm) | 6h |
| US-009 medium | 15-25 min(13 baseline verify) | 6.5h |
| US-010 medium | 35-50 min(verify + retro + skill 更新) | 7.5h |
| **累计** | **7.5-9h daemon** | + Opus audit 10×3-15min/US ≈ 10-13h wall time |

### §8.3 跨 PRD-23 大门禁

1. ✅ US-001 完成 = /diagnosis 8 步问卷向导可用
2. ✅ US-002 完成 = /accounts 模块完整 · 影响 useActiveAccount hook 验证
3. ✅ US-003 完成 = 9 step 主流程全完整(/step/1~9 含 step8)
4. ✅ US-008 + US-009 完成 = 25 page visual baseline 验证通过 · PRD-24 收官准备就绪
5. ✅ US-010 完成 = PRD-23 ship · TD-092/093 关闭 · plan-check 自动 catch unit test 同步缺陷

---

> **本 PRD 由 Claude(Opus 4.7)在 PRD-23 启动期写 · 2026-05-19 · 跟 PRD-22 互补使用 · 待 prd skill 转 prd-23.json 后启 daemon。**
