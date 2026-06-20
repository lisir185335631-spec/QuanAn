# PRD-22 · 5 inline 重构 + 8 step pages 视觉精修 + 13 page visual diff

> **版本** · v0.1(2026-05-19 BJT · Opus 4.7 主对话写)
> **范围** · 跟 aiipznt 1:1 视觉对齐 · 2 件事 ·
> 1. 5 page inline 重构(/generate · /boom-generate · /ai-video · /knowledge · /step/7)— 替换 ToolForm 抽象 · 主区直接 inline 渲染所有 button 选项
> 2. 8 step pages 视觉精修(/step/1 · /step/3 · /step/3b · /step/4 · /step/4b · /step/5 · /step/6 · /step/7)— 按 dump §2.2 实测 DOM 数对齐
> **基线** · PRD-21 已 ship(commit `0a27285`)· 4 公开 page(home/guide/ip-plan/header)visual diff 已通过 5% threshold · 但 step pages 用 ToolForm 通用抽象 · 跟 aiipznt 实测多 H3/H4 输出区 + inline 多 button 选择器形态偏差大 · /generate 等 5 page 主区只 2-6 button 远低于 aiipznt 18-50 button
> **目标** · 让 13 page(5 inline + 8 step)visual diff < 5% threshold · 3 inline picker utility 抽象 + 复用 PRD-21 visual-diff infra + FadeInWrapper / glass-card / IpPlanStepGrid pattern
> **预估** · 12 US · 1 foundation + 1 high + 9 medium + 1 收官 · 2.5 周 wall time · 14-18h daemon · 25-32 commits

---

## §0 引用清单 + 元数据 + 复刻定调

### §0.1 上游文档(8 份核心)

| # | 文档 | 用途 | 重点章节 |
|:-:|---|---|---|
| 1 | [aiipznt-deep-dom-dump.md](../aiipznt-deep-dom-dump.md) | **32 page DOM 实测 + spec 校准 + 红线 5 条** · 当冲突时以 dump 为准 | §1 跨 page 共享 / §2.2 9 step / §2.3 14 工具 / §3 Diff 1-6 / §6 红线 |
| 2 | [aiipznt-spec.md](../aiipznt-spec.md) | 9192 行复刻基线 | §7.1~7.9 9 step / §8.2.3 /boom-generate / §8.3.1 /generate / §8.4.1 /ai-video / §8.4.4 /knowledge / §Ⅹ.1~Ⅹ.4 常量数据 |
| 3 | [.agents/diff-analysis/aiipznt-2026-05-18.md](../.agents/diff-analysis/aiipznt-2026-05-18.md) | **内部差距诊断** · 详细差距清单 + PRD-21~24 拆分 | §3.2 5 page inline 缺失表 / §4 PRD-22 12 US 拆分 |
| 4 | [tasks/prd-21.md](prd-21.md) | PRD-21 visual-diff infra(已 ship · 复用) | §3 US-001 visual-diff config + expectVisualMatch helper / US-004 FadeInWrapper / US-007 IpPlanStepGrid |
| 5 | [ARCHITECTURE.md](../ARCHITECTURE.md) | 主应用架构 | §3 9 step 工作流 / §2 14 工具 / §6.5 LLM Gateway / §8 设计系统 |
| 6 | [AGENTS.md](../AGENTS.md) | 18 LD + 17 R 红线 + §11 PRD 沉淀 | §3 18 LD / §11.6 PRD-4 / §11.8 PRD-15 / §11.9 PRD-16 D1A-text-content-drift / §11.10 PRD-21 visual-diff |
| 7 | [scripts/verify-prd-21.sh](../scripts/verify-prd-21.sh) | PRD-21 10 section 45 checks(模板) | §0 10 section 框架 · PRD-22 verify 复用结构 |
| 8 | `~/.claude/playbooks/reject-examples.jsonl` | 跨 PRD 反例库 | 注入 foundation + 2 high US 的 anti_patterns(prd skill 自动检索 ≤3 条) |

### §0.2 元数据

| 项 | 值 |
|---|---|
| **branchName** | `ralph/prd-22-inline-refactor-step-pages` |
| **Locked Decisions** | D-214 起延续(PRD-21 收尾在 D-213 · 总 12 D · D-214~D-225) |
| **风险分档** | foundation × 1(US-001 3 inline picker utility)+ high × 1(US-002 /generate 重构 · 下游 US-003/010 复用)+ medium × 9(US-003~011)+ 收官 × 1(US-012) |
| **anti_patterns 注入** | foundation + 1 high US 必须从 reject-examples.jsonl 检索 ≤3 条注入 · 高频关键词 · "ToolForm" / "inline picker" / "D1A 字面" / "visual diff" |
| **依赖前置 PRD** | PRD-15(/copywriting 等 8 page 完整化基线) + PRD-16(设计系统 D1=A + D4=B + Home/Header/guide/ip-plan 结构) + PRD-19(8 stub baseline) + PRD-20(LLM 接入) + PRD-21(visual-diff infra + Header 精修 + 共享 utility) · 严格保留不动 |
| **下游 PRD** | PRD-23(3 stub 完整化 · /diagnosis · /accounts · /step/8 + 14 工具视觉精修) · PRD-24(6 modules 视觉精修 + 全 32 visual diff 收官) |
| **baseline 抓取来源** | `/tmp/aiipznt-clone-research/{dump,screenshots}` 32 HTML + 32 PNG fullPage 1440px(2026-05-16 BJT 抓取 · sally zhao 登录态 · 不进 git) |
| **visual diff 配置** | playwright.config.ts `snapshotDir` 指向 `/tmp/aiipznt-clone-research/screenshots/` · `snapshotPathTemplate` `{snapshotDir}/{arg}{ext}` · `maxDiffPixelRatio: 0.05` (D-206 锁) |
| **失败回滚** | `git branch backup/before-prd-22 ralph/prd-21-visual-alignment-foundation` 已建(本会话 10:59)· 任意 US 累计 3 reject 强制 retro + 拆 story |

### §0.3 复刻定调(D1=A + D4=B 严锁 · 继承 PRD-21)

| 维度 | 切 / 不切 |
|---|:-:|
| 整体页面布局(layout / 区块顺序 / 区块尺寸 / 容器宽度 / padding 方向) | ✅ **切 1:1 对齐 aiipznt** |
| spacing scale(gap-2 / gap-4 / mb-8 / py-20 等) | ✅ 切(参 dump §1.4 / §2 各 page) |
| 字体 family + weight(Orbitron 大标 / Rajdhani 副标 / Noto Sans SC 中文 / ui-sans-serif 正文) | ✅ 切(已 PRD-16 US-001 完成 · 本 PRD 不重做 · 复核即可) |
| motion(framer-motion FadeInWrapper / animate-ping-primary / transition / hover effect) | ✅ 切(继承 PRD-21 D-211/213) |
| 卡片 hover 效果 + dropdown 浮层结构 + glass-card 模糊 | ✅ 切 |
| **常量数据 1:1**(20 脚本类型 / 22 爆款元素 / 5 平台 / 56 行业 / 6 视频类型 / 4 knowledge tab) | ✅ **严格 1:1**(constants 字面锁 · plan-check D1A-text-content-drift) |
| **文字内容(title / desc / H1 / H2 / H3 / p / button 文字 / FAQ q / a / placeholder)** | ✅ **严格 1:1**(plan-check 2.6.20) |
| 颜色 token(primary / accent / background / border / shadow / chart × 5) | ❌ **D4=B 锁 · 保留当前 HSL 43° 金色 token 不变** |
| OKLCH 任何 ref / `var(--gold)` / `border-gold/X` 字面 | ❌ **替换为 `var(--primary)` / `border-primary/X`** |
| UX behavior(search filter 联动 / accordion 展开 / hover transition 时长 …) | 🟡 可自由发挥(D1=A 不锁) |

**D4=B 反例锁**(防 ralph 字面解读紫色 → Tailwind 真紫色 utility · PRD-16 US-003 实证)·

- ❌ 描述写 "金色 gradient" / "紫色 gradient" 都不行 · 必须写 "`var(--primary)` 主色 gradient" 或 "`bg-gradient-to-r from-primary to-primary/60`"
- ❌ 不允许引入 `from-violet-X` `from-amber-X` 等具体颜色 utility
- ✅ 留 token 渲染决定 · `var(--primary)` 当前 HSL 43° 自动出金色调

**D1A 长文本字面双锁**(防 ralph 漏看 AC-1 → 创意改写 · PRD-17 US-007 实证)·

- AC-1 锁完整字面(完整代码块)
- AC-N 重复索引时必须复述完整字符 · 不允许 "含 'X'" 或 "含 {placeholder}" 模糊描述

### §0.4 D-214 ~ D-225 Locked Decisions(本 PRD 新建)

| ID | 决策 | Why |
|---|---|---|
| D-214 | inline picker utility 3 件套 · `<ScriptTypeInlineCards>` / `<ElementsInlineMultiPicker>` / `<PlatformInlineRadio>` · 路径 `apps/web/src/components/inline-pickers/` | aiipznt 5 page 主区直接 inline 渲染所有 button 选项 · 不用 form 抽象 |
| D-215 | inline picker API 设计 · `value` / `onChange` / `disabled` 标准 React controlled component · 不接 form state | 与现有 ToolForm 解耦 · 各 page 自行管理选中态 |
| D-216 | /generate 重构后保留 ToolForm import 但不用 · 不删除(防 PRD-19 沉淀回滚)· 跨 PRD 兼容 | PRD-15 沉淀的 ToolForm 仍被 /analysis / /video-production 用[重构删:`/acquisition-video`已删,不再是ToolForm用户] · 本 PRD 不动 ToolForm 本身 |
| D-217 | /knowledge 4 tab 字面锁 · `"20 类脚本"` / `"20 大爆款"` / `"开头公式"` / `"核心公式"` · 即使内部数据是 22 元素也要展示 "20 大爆款" | dump §3 Diff 6 + spec §8.4.4 实测确认 |
| D-218 | /step/1 6 tab 字面锁 · `"全部行业 (56)"` / `"🏠 生活服务 (18)"` / `"🛒 电商零售 (13)"` / `"✍️ 内容创作 (7)"` / `"💼 专业服务 (14)"` / `"🏭 产业制造 (4)"` · 第一 tab 必须是"全部行业 (56)"且默认选中 | dump §3 Diff 3 实测 · 跟 spec §7.1 line 1235 写法不同 · 以 dump 为准 |
| D-219 | /step/7 与 /generate 共享 inline picker 但状态独立 · /step/7 stepData.save · /generate 不读 step 数据 | spec §8.3.1 写 "step/7 强调与 IP 流程串联(自动复用 step3/3b 的人设、step5 的选题), /generate 是独立调用版本(不读 step 数据)" |
| D-220 | step pages 输出区 D1A 字面锁清单(H3 标题)· /step/3 6 H3:`视频参考案例` / `昵称推荐` / `头像设计方案` / `简介文案方案` / `整体包装策略`[重构删:`背景图设计方案`已删,7→6 H3] · /step/3b 6 H3 / /step/4b 3 阶梯 H3 / /step/7 4 H4(`话题抛出` / `正方` / `反方` / `我的立场`) | dump §2.2 多 H 实测 + spec §7.2/7.3/7.5/7.8 字段名 |
| D-221 | /ai-video 分镜表 13 列字面锁 · `["镜号", "景别", "角度", "运镜", "时长", "画面描述", "台词/解说", "字幕", "背景音乐", "音效", "情绪", "拍摄要点", "剪辑建议"]` · 表头 Orbitron 大写 · 行数据按 spec §8.4.1 输出 6-12 分镜 | spec §8.4.1 写 "每个分镜包含：景别、角度、运镜、情绪、台词" · 实际表格 13 列扩展 |
| D-222 | visual diff 13 page 覆盖矩阵 · /generate / /boom-generate / /ai-video / /knowledge / /step/1 / /step/3 / /step/3b / /step/4 / /step/4b / /step/5 / /step/6 / /step/7 + /knowledge mobile 视图 = 13 baseline · 全部用 prd21-visual-baseline 同套 expectVisualMatch helper | 复用 PRD-21 infra · 13 page 是 PRD-22 范围 |
| D-223 | inline picker emoji 渲染锁 · 用 emoji 字符直接渲染 · 不用 `<Emoji />` 组件 · 不用 svg icon 替代 | spec §Ⅹ.2/Ⅹ.3 数据本身就是 emoji 字符 · 直接渲染对齐 aiipznt DOM |
| D-224 | step pages 用 `<StepLayout>` 包裹 + `<StepHeader>` 顶部副标签字面锁 `STEP 0N · {label}` · 例 `STEP 01 · 选择行业赛道` | spec §7.1~7.9 每 step 都有此 STEP 0N 副标签 · 跨 step 一致性 |
| D-225 | /step/7 stepData 复用 step3/3b 的 personalInfo · step5 的选题(spec §8.3.1 明示)· 但本 PRD 不实现 LLM 调用 · 只搭 UI 骨架 + 跑通 stepData.save / get | PRD-22 范围只视觉精修 · LLM 集成留 PRD-23+ |

---

## §1 介绍/概述

PRD-15~21 累计 ship 后 · 主应用结构对齐 85%+(28/32 page 有 baseline 实现)· PRD-21 建立了 visual-diff infra 4 公开 page pixel-diff < 5%。但实际打开应用对照 aiipznt 仍有 **2 大类视觉差距**:

**差距 1 · 5 page 主区 inline button 缺失(ToolForm 抽象隐藏)**

| Page | aiipznt buttons | QuanAn 实测 | 差距点 | 严重度 |
|---|:-:|:-:|---|:-:|
| /generate | 50 | 2 | 20 脚本类型卡 + 22 爆款元素 button 没 inline 渲染 | 🔴 |
| /boom-generate | 30 | 0 | 22 爆款元素 button 4 组分类未 inline | 🔴 |
| /ai-video | 18 | 0 | 5 平台 + 6 视频类型 button 未 inline | 🔴 |
| /knowledge | 30 | 1 | 3 toggle (脚本/爆款/公式) + 27 实战案例计数 button + 40 cards 未 inline | 🔴 |
| /step/7 | 53 | ~6 | 20 脚本类型搜索 + 22 元素多选 + 4 H4 输出 未 inline | 🔴 |

**差距 2 · 8 step page 视觉密度低(ToolForm 通用抽象 → 区块结构缺失)**

| Step | aiipznt H数 | QuanAn H数 | 差距点 | 严重度 |
|---|:-:|:-:|---|:-:|
| /step/1 | 1 | 1 | 56 emoji 卡 5 列网格 + 6 tab + 自定义 modal 缺失 | 🔴 |
| /step/3 | 7 | ~2 | 6 H3 输出区(视频参考案例 / 昵称推荐 / 头像设计方案 / 简介文案方案 / 整体包装策略)缺失[重构删:背景图设计方案已删,H1+6H3=7] | 🔴 |
| /step/3b | 7 | ~2 | 6 H3 输出区 + 多 textarea 缺失 | 🔴 |
| /step/4 | 1 | ~1 | 3 input/textarea(粉丝量/目标/情况)+ 输出对齐 spec §7.4 | 🟡 |
| /step/4b | 8 | ~2 | 3 阶梯输出(初阶/中阶/高阶)+ 收入结构 + 成功案例 缺失 | 🔴 |
| /step/5 | 1 | ~1 | input × 2 + file upload × 2 缺失 | 🟡 |
| /step/6 | 1 | ~1 | textarea 粘贴文案至少 10 字 + 跳 step7 提示 缺失 | 🟡 |
| /step/7 | 11 | ~2 | 4 H4(话题抛出/正方/反方/我的立场)+ 22 元素多选 缺失 | 🔴 |

**PRD-22 解决 5 件事** ·

1. **3 inline picker utility 抽象** · `<ScriptTypeInlineCards>`(20 卡 emoji+desc 网格)+ `<ElementsInlineMultiPicker>`(22 button 4 组 + 选中计数)+ `<PlatformInlineRadio>`(5 button radio + emoji)· 路径 `apps/web/src/components/inline-pickers/`(D-214)
2. **5 page inline 重构** · /generate(US-002 high)+ /boom-generate / /ai-video / /knowledge(US-003~005 medium)· 主区直接 inline 渲染 button(替换 ToolForm 提交流程)· 字符计数 / loading state / 结果区 1:1 对齐 aiipznt
3. **8 step page 视觉精修** · /step/1 56 emoji 卡 5 列网格 + 6 tab + 自定义 modal(US-006)· /step/3 + /step/3b 多 H3 输出区(US-007)· /step/4 + /step/4b 阶梯输出 + 收入结构(US-008)· /step/5 + /step/6 file upload + textarea(US-009)· /step/7 4 H4 输出 + 22 元素多选(US-010)
4. **跨 page 视觉一致性 + framer-motion polish**(US-011)· FadeInWrapper stagger 用到 13 page · glass-card 用到 step pages 输出区 · hover transition 时长统一 200ms
5. **verify-prd-22.sh + 13 page visual diff 收官**(US-012)· 复用 PRD-21 verify-prd-21.sh 10 section 框架 + §1~§10 跨 5 inline + 8 step + visual baseline

完成后 · 13 page(5 inline + 8 step)visual diff < 5% threshold · 后续 PRD-23 处理 3 stub 完整化 + 14 工具视觉精修 · PRD-24 处理 6 modules + 全 32 visual diff 收官。

---

## §2 目标

- ✅ 建立 3 inline picker utility 抽象(`<ScriptTypeInlineCards>` · `<ElementsInlineMultiPicker>` · `<PlatformInlineRadio>`)· 单元测试覆盖 > 90% · 5 page 复用
- ✅ /generate 主区 inline 渲染 20 脚本类型 + 22 爆款元素 button · 字符计数 0/500 · 跟 spec §8.3.1 1:1
- ✅ /boom-generate 主区 inline 22 元素 4 组 + 行业/主题 input · 一键生成 5 篇 button · 跟 spec §8.2.3 1:1
- ✅ /ai-video 主区 inline 5 平台 + 6 视频类型 + 文案 textarea 0/5000 + 分镜表 13 列 · 跟 spec §8.4.1 1:1
- ✅ /knowledge 主区 inline 4 tab(20 类脚本 / 20 大爆款 / 开头公式 / 核心公式)+ 20 卡 emoji + 案例计数 button + 搜索 input · 跟 spec §8.4.4 1:1
- ✅ /step/1 56 emoji 卡 5 列网格 + 6 tab(全部行业 56 + 5 大类)+ 自定义 modal + 已选状态卡 · 跟 spec §7.1 + dump §3 Diff 3 1:1
- ✅ /step/3 + /step/3b 多 textarea + 5 平台 radio + 5-6 H3 输出区 · 跟 spec §7.2 + §7.3 1:1[重构删:step/3 背景图设计方案已删,7→6 H3;第一项H3"账号包装方案"算顶部总览,纯内容H3=5]
- ✅ /step/4 + /step/4b 3 input/textarea + 3 阶梯输出(初阶/中阶/高阶)+ 收入结构 + 成功案例 · 跟 spec §7.4 + §7.5 1:1
- ✅ /step/5 + /step/6 行业 input × 2 + file upload × 2 + 粘贴文案 textarea + 跳 step7 提示 · 跟 spec §7.6 + §7.7 1:1
- ✅ /step/7 20 脚本搜索 input + 22 元素多选 + 4 H4 输出(话题抛出 / 正方 / 反方 / 我的立场)· 跟 spec §7.8 1:1
- ✅ 跨 page FadeInWrapper / glass-card / hover transition 200ms 一致 · 13 page visual diff baseline 通过 5% threshold
- ✅ 12 US 全部 audit approved(Opus 4 维度 + risk_level 分档)· verify-prd-22.sh 通过 · pixel-diff < 5% threshold · 准备 PRD-23

---

## §3 User Stories(12)

### US-001 ★ foundation · 3 inline picker utility 抽象

**风险分档** · ★ **foundation**(下游 5 US · US-002/003/004/010 全部复用此 3 utility · 失败影响 PRD-22 + PRD-23 inline 重构所有 page)

**Story 大小** · medium(单次 ralph 迭代可完成 · 6 文件创建 · ~400 LOC 新增)

**前置依赖** · PRD-15 ScriptType + Elements + Platforms 常量已存在(`apps/web/src/lib/constants/`)· 不再重新定义

**用户故事** ·
作为 QuanAn 前端开发者 · 我需要 3 个 inline picker utility 组件 · 这样 /generate /boom-generate /ai-video /knowledge /step/7 5 个 page 就能主区直接渲染所有选项 button · 跟 aiipznt 1:1 对齐(50 button / 30 button / 18 button / 30 button / 53 button)· 而不是用 ToolForm 抽象隐藏在 form 后(目前只有 2-6 button)。

**验收标准** ·

- **AC-1** · 新建 `apps/web/src/components/inline-pickers/ScriptTypeInlineCards.tsx` · 渲染 20 脚本类型(`SCRIPT_TYPES` from `apps/web/src/lib/constants/scripts.ts`)· 网格布局 `grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3` · 每卡含 emoji + 名称 + 一句话定位 · 选中态 `border-primary bg-primary/10` · API ·
  ```typescript
  interface ScriptTypeInlineCardsProps {
    value: string | null
    onChange: (key: string) => void
    disabled?: boolean
    showSearch?: boolean      // 顶部搜索 input "搜索脚本..."
    showMethodology?: boolean // hover 展开 methodology 字段(D-214)
  }
  ```
- **AC-2** · 新建 `apps/web/src/components/inline-pickers/ElementsInlineMultiPicker.tsx` · 渲染 22 爆款元素 4 组(`HOT_ELEMENTS` from `apps/web/src/lib/constants/elements.ts`)· 4 组 = classic(11) / emotion(2) / content(6) / conversion(4)· 每组用 H4 Rajdhani 标题(`经典元素` / `情绪驱动` / `内容策略` / `转化驱动`)· 选中按钮 `bg-primary text-primary-foreground` · 未选 `border-border bg-card hover:border-primary/40` · 顶部计数 `选择爆款元素（已选 N 个）` · API ·
  ```typescript
  interface ElementsInlineMultiPickerProps {
    value: string[]                    // selected element keys
    onChange: (keys: string[]) => void
    disabled?: boolean
    showCount?: boolean                // 顶部计数 "已选 N 个"
    layout?: 'compact' | 'grouped'     // grouped = 4 组分块 · compact = 单行
  }
  ```
- **AC-3** · 新建 `apps/web/src/components/inline-pickers/PlatformInlineRadio.tsx` · 渲染 5 平台 radio(`PLATFORMS` from `apps/web/src/lib/constants/platforms.ts`)· 5 button 横向布局 `flex gap-3` · 每 button 含 emoji + 名称 · 选中态 `border-primary bg-primary/10 ring-1 ring-primary` · API ·
  ```typescript
  interface PlatformInlineRadioProps {
    value: string | null
    onChange: (key: string) => void
    disabled?: boolean
    size?: 'sm' | 'md' | 'lg'          // 控制 button 大小
  }
  ```
- **AC-4** · 5 平台 + 22 元素 + 20 脚本字面 D1A 锁(`apps/web/src/lib/constants/platforms.ts` / `elements.ts` / `scripts.ts` 必须导出这些常量名 + 完整数据)·
  ```typescript
  // platforms.ts
  export const PLATFORMS = [
    { key: 'douyin',       label: '抖音',      emoji: '📱', icon: 'douyin' },
    { key: 'xiaohongshu',  label: '小红书',    emoji: '📕', icon: 'xiaohongshu' },
    { key: 'shipinhao',    label: '视频号',    emoji: '📺', icon: 'shipinhao' },
    { key: 'kuaishou',     label: '快手',      emoji: '🎬', icon: 'kuaishou' },
    { key: 'bilibili',     label: 'B站',       emoji: '📺', icon: 'bilibili' }
  ]
  // elements.ts(全 22 元素 keys 字面 + label + emoji 见 §0.4 D-220 + spec §Ⅹ.2)
  // scripts.ts(全 20 脚本类型 keys + emoji + label + desc + methodology 见 spec §Ⅹ.3)
  ```
- **AC-5** · 新建 `apps/web/src/components/inline-pickers/__tests__/` 单元测试 · 3 文件 · 每文件 ≥ 5 test case · 总 ≥ 15 test · vitest run 通过 · 覆盖 ·
  - 渲染所有选项数量(20 / 22 / 5)
  - value/onChange controlled component 行为
  - disabled 状态
  - showSearch filter 联动(ScriptTypeInlineCards)
  - selected count 计数(ElementsInlineMultiPicker)
- **AC-6** · 新建 `apps/web/src/components/inline-pickers/index.ts` barrel export · 导出 3 utility + props 类型
- **AC-7** · typecheck 0 errors(`pnpm typecheck`)
- **AC-8** · vitest run 通过(`pnpm test` · 不破 PRD-21 已有 181 test)· 新增 ≥ 15 test → 总 ≥ 196 test

**测试范围** ·
- unit test · 3 utility 各 ≥ 5 test
- 视觉准备 · 不跑 visual diff(下游 US-002~005/010 用到时 diff)

**文件 to create** ·
- `apps/web/src/components/inline-pickers/ScriptTypeInlineCards.tsx`
- `apps/web/src/components/inline-pickers/ElementsInlineMultiPicker.tsx`
- `apps/web/src/components/inline-pickers/PlatformInlineRadio.tsx`
- `apps/web/src/components/inline-pickers/index.ts`
- `apps/web/src/components/inline-pickers/__tests__/ScriptTypeInlineCards.test.tsx`
- `apps/web/src/components/inline-pickers/__tests__/ElementsInlineMultiPicker.test.tsx`
- `apps/web/src/components/inline-pickers/__tests__/PlatformInlineRadio.test.tsx`

**文件 to modify** ·
- `apps/web/src/lib/constants/scripts.ts`(补全 20 脚本 methodology · 如已存在则 D1A 字面对照)
- `apps/web/src/lib/constants/elements.ts`(补全 22 元素 4 组分类 · 如已存在则 D1A 字面对照)
- `apps/web/src/lib/constants/platforms.ts`(D1A 字面对照)

**anti_patterns 注入** · prd skill 从 reject-examples.jsonl 检索 "inline picker" / "controlled component" / "D1A 字面" 关键词 · 注入 ≤ 3 条

---

### US-002 high · /generate 重构 inline(20 脚本 + 22 元素 + textarea)

**风险分档** · 🔴 **high**(/generate 是用户访问最高的工具 page · spec §8.3.1 跟 /step/7 共享 SOP · 下游 US-010 /step/7 复用相同 picker · 失败影响视觉对齐感知)

**Story 大小** · medium(单次 ralph 迭代可完成 · 1 文件 rewrite · ~280 LOC 重构)

**前置依赖** · US-001 3 inline picker utility 已完成

**用户故事** ·
作为 QuanAn 用户 · 当我访问 /generate · 我看到主区直接 inline 渲染 20 脚本类型卡(可点选 1)+ 22 爆款元素 button(可多选 N)+ 文案主题 textarea(max 500 字 · 字符计数 0/500)+ 一键生成 button · 而不是被 ToolForm 抽象隐藏在 form 后只有 2 button 可见。

**验收标准** ·

- **AC-1** · /generate H1 字面锁 `生成爆款文案` · 副标题字面锁 `选择脚本类型和爆款元素，输入主题，AI 为你生成 AIP 风格的短视频文案`(spec §8.3.1 + D1A 字面)
- **AC-2** · 主区结构(从上到下)·
  1. PageHeader + H1 `生成爆款文案`
  2. `<ScriptTypeInlineCards value={scriptType} onChange={setScriptType} showSearch />` — 20 卡 + 搜索 input
  3. `<ElementsInlineMultiPicker value={elements} onChange={setElements} showCount layout="grouped" />` — 22 元素 4 组 + 计数
  4. textarea `文案主题` max 500 字 · placeholder `输入你的文案主题，如：美容院如何用抖音获客100个精准客户...`(D1A 字面)· 字符计数 `0/500` 右下角
  5. 主 CTA button `生成文案`(`bg-gradient-to-r from-primary to-primary/60`)
  6. 结果区(loading 时 skeleton · 有 result 时按 AIP 起承转合 4 区块展示)
- **AC-3** · 表单状态本地 useState 管理(`scriptType` / `elements` / `topic`)· **不读 stepData**(D-219 锁 · /generate 独立调用版本)
- **AC-4** · 主 CTA disabled 条件 · `!scriptType || elements.length === 0 || topic.length < 10` · disabled 时 `opacity-50 cursor-not-allowed`
- **AC-5** · 字符计数当前/最大 `{topic.length}/500` · 超过 500 时 `text-destructive` 且 textarea border red
- **AC-6** · DOM button 数 ≥ 45(20 脚本卡 + 22 元素 + 1 CTA + 2 二级 button) → 接近 aiipznt 实测 50 · 比 PRD-15/19 baseline 2 button 大幅提升
- **AC-7** · typecheck 0 errors(`pnpm typecheck`)
- **AC-8** · 已有 e2e test `tests/e2e/prd15-tools-flow.spec.ts` /generate 关键 assertion 不破(button click / H1 命中)· 如有需要更新断言用 ` page.getByRole('button', { name: /生成文案/ })` 正则
- **AC-9** · 新增 visual diff fixture `tests/e2e/prd22-visual-baseline.spec.ts` /generate · 阈值 5% · `pnpm test:visual:check` 通过

**测试范围** ·
- e2e test · /generate · 20 脚本卡 click · 22 元素 multi-select · textarea 字符计数 · button disabled 条件
- visual diff · 1 baseline image
- typecheck + vitest 不破

**文件 to modify** ·
- `apps/web/src/pages/Generate.tsx`(完整重写 · 替换 ToolForm 为 inline 结构)
- `tests/e2e/prd22-visual-baseline.spec.ts`(新建 · 加 /generate fixture)

**anti_patterns 注入** · prd skill 检索 "ToolForm" / "D1A 字面" / "inline picker" / "visual diff" 关键词 · 注入 ≤ 3 条

---

### US-003 medium · /boom-generate 重构 inline(22 元素 + 行业 input + 主题 input)

**风险分档** · 🟡 medium(用户访问中等的工具 page · spec §8.2.3 跟 /step/7 共享 22 元素但 SOP 不同 · 复用 US-001 ElementsInlineMultiPicker)

**Story 大小** · small-medium(单次 ralph 迭代可完成 · 1 文件 rewrite · ~180 LOC 重构)

**前置依赖** · US-001 ElementsInlineMultiPicker · US-002 实施模式参考

**用户故事** ·
作为 QuanAn 用户 · 当我访问 /boom-generate · 我看到主区直接 inline 渲染 22 爆款元素 button(4 组)+ 行业 input + 主题 input + 一键生成 5 篇 button · 而不是被 ToolForm 抽象隐藏只有 0 button 可见。

**验收标准** ·

- **AC-1** · /boom-generate H1 字面锁 `爆款元素自动生成` · 副标题字面锁 `选择爆款元素组合，AI 自动生成 5 篇深度爆款文案，每篇至少 300 字，拒绝表面化`(spec §8.2.3 + D1A)
- **AC-2** · 主区结构 ·
  1. PageHeader + H1
  2. `<ElementsInlineMultiPicker value={elements} onChange={setElements} showCount layout="grouped" />`
  3. input `行业领域` · placeholder `当前：{industry}（可手动输入覆盖）` · 默认值取 `ipPlanContext.industry || ''`
  4. input `主题方向` · placeholder `如：减肥、理财、育儿...`
  5. 主 CTA button `一键生成爆款文案`
  6. 结果区(loading 时 skeleton · 有 result 时 5 篇 card 网格)
- **AC-3** · 主 CTA disabled 条件 · `elements.length === 0` · 不强制 industry / topic(可选)
- **AC-4** · DOM button 数 ≥ 25(22 元素 + 1 CTA + 2 二级)→ 接近 aiipznt 30
- **AC-5** · typecheck + vitest 不破 · e2e /boom-generate 不破(目前 stub 无 e2e · 加 1 e2e fixture)
- **AC-6** · 新增 e2e `tests/e2e/prd22-boom-generate.spec.ts` · 4 test(H1 存在 / 22 元素渲染 / 多选行为 / disabled 条件)
- **AC-7** · visual diff fixture 加 /boom-generate · 阈值 5% · `pnpm test:visual:check` 通过

**文件 to modify** ·
- `apps/web/src/pages/BoomGenerate.tsx`
- `tests/e2e/prd22-boom-generate.spec.ts`(新建)
- `tests/e2e/prd22-visual-baseline.spec.ts`(加 fixture)

---

### US-004 medium · /ai-video 重构 inline(5 平台 + 6 视频类型 + 分镜表 13 列)

**风险分档** · 🟡 medium(STORYBOARD 是 14 工具中视觉最重的之一 · 13 列分镜表布局复杂 · 但不影响下游 US)

**Story 大小** · medium(单次 ralph 迭代可完成 · 2 文件创建/修改 · ~320 LOC)

**前置依赖** · US-001 PlatformInlineRadio · 6 视频类型常量本 US 内新建

**用户故事** ·
作为 QuanAn 用户 · 当我访问 /ai-video · 我看到 H1 `STORYBOARD`(Orbitron 大字)+ 主区 inline 5 平台 radio + 6 视频类型 button + 文案 textarea(0/5000)+ 分镜表 13 列输出 · 而不是被 ToolForm 抽象隐藏只有 0 button 可见。

**验收标准** ·

- **AC-1** · /ai-video H1 字面锁 `STORYBOARD`(Orbitron 大写)· 副标题字面锁 `专业分镜表生成器 · 文案一键转拍摄方案`(spec §8.4.1 + D1A)· 模块标题 `专业分镜表生成器`
- **AC-2** · 新建 `apps/web/src/lib/constants/video-types.ts` · 6 视频类型字面锁 ·
  ```typescript
  export const VIDEO_TYPES = [
    { key: 'monologue',   emoji: '🗣',  label: '口播',     desc: '真人出镜讲述' },
    { key: 'plot',        emoji: '🎬',  label: '剧情',     desc: '故事情节演绎' },
    { key: 'vlog',        emoji: '📹',  label: 'Vlog',     desc: '生活记录风格' },
    { key: 'product',     emoji: '🛍',  label: '产品展示', desc: '商品种草带货' },
    { key: 'interview',   emoji: '🎤',  label: '街头采访', desc: '随机路人互动' },
    { key: 'tutorial',    emoji: '📚',  label: '教程',     desc: '知识技能教学' }
  ]
  ```
- **AC-3** · 主区结构 ·
  1. PageHeader + H1 `STORYBOARD`(Orbitron)+ 模块标题 `专业分镜表生成器`(H3)
  2. textarea `文案内容` max 5000 字 · placeholder `粘贴你的短视频文案，AI 将自动生成专业分镜表，可直接交给摄影师执行...` · 字符计数 `0/5000`
  3. `<PlatformInlineRadio value={platform} onChange={setPlatform} size="lg" />` — 5 平台 radio
  4. 6 视频类型 button(2 行 × 3 列)· 每 button emoji + label + desc
  5. 主 CTA button `一键生成专业分镜表`
  6. 输出 · 分镜表 13 列 table(D-221 锁列名 `["镜号", "景别", "角度", "运镜", "时长", "画面描述", "台词/解说", "字幕", "背景音乐", "音效", "情绪", "拍摄要点", "剪辑建议"]`)· 加 `[一键导出 CSV]` button
- **AC-4** · 表头 Orbitron + uppercase · 横向滚动支持(`overflow-x-auto`)
- **AC-5** · DOM button 数 ≥ 14(5 平台 + 6 视频类型 + 1 CTA + 2 二级)→ 接近 aiipznt 18
- **AC-6** · typecheck + vitest 不破
- **AC-7** · 新增 e2e `tests/e2e/prd22-ai-video.spec.ts` · 5 test(H1 STORYBOARD / 5 平台 / 6 视频类型 / 分镜表 13 列 / 导出 CSV button)
- **AC-8** · visual diff fixture 加 /ai-video · 阈值 5% · `pnpm test:visual:check` 通过

**文件 to create** ·
- `apps/web/src/lib/constants/video-types.ts`
- `tests/e2e/prd22-ai-video.spec.ts`

**文件 to modify** ·
- `apps/web/src/pages/AiVideo.tsx`
- `tests/e2e/prd22-visual-baseline.spec.ts`

---

### US-005 medium · /knowledge 重构(4 tab + 20 卡 + 案例计数 + 搜索)

**风险分档** · 🟡 medium(知识库视觉精修 · 30 button 布局 · /knowledge 是公开页之一 · 视觉密度对感知影响大)

**Story 大小** · medium(单次 ralph 迭代可完成 · 1 文件 rewrite + 1 常量补全 · ~360 LOC)

**前置依赖** · US-001 ScriptTypeInlineCards · spec §8.4.4 4 tab 字面锁(D-217)

**用户故事** ·
作为 QuanAn 用户 · 当我访问 /knowledge · 我看到 H1 `AIP 文案方法论` + 4 tab(20 类脚本 / 20 大爆款 / 开头公式 / 核心公式)· tab 1 默认展示 20 脚本类型卡(每卡含 emoji + label + desc + methodology + 实战案例计数 button)· 主区直接 inline 渲染 30 button · 而不是被 stub 占位只有 1 button 可见。

**验收标准** ·

- **AC-1** · /knowledge H1 字面锁 `AIP 文案方法论` · 副标题字面锁 `系统学习 AIP 的短视频文案创作方法论，掌握爆款文案的核心技巧`(spec §8.4.4 + D1A)
- **AC-2** · 4 tab 字面锁(D-217)· 顺序固定 ·
  - tab 1 `20 类脚本`(默认 active · 渲染 20 脚本卡)
  - tab 2 `20 大爆款`(渲染 22 爆款元素 4 组)
  - tab 3 `开头公式`(stub placeholder "5 类开头公式 · PRD-23 完整化")
  - tab 4 `核心公式`(stub placeholder "AIP 起承转合公式 · PRD-23 完整化")
- **AC-3** · tab 1 实现 · 顶部 search input `搜索脚本类型...` + 20 脚本卡 5 列网格(`grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4`)· 每卡含 ·
  - emoji(大字)
  - label(H3 Rajdhani)
  - desc(text-sm muted-foreground)
  - methodology(text-xs · 可 `<details>` 折叠)
  - `[实战案例 ({N})]` button(N=随机 1-9 用于 visual 一致 · stub 数据)
- **AC-4** · tab 2 实现 · 复用 `<ElementsInlineMultiPicker layout="grouped" />` 但 value 设 `[]` + onChange disabled(纯展示)· 4 组 H4 + 22 元素 button(纯展示态)
- **AC-5** · 主区 button 数 ≥ 30(20 脚本卡 + 20 实战案例计数 button + 4 tab)= 64 但视觉感知 30(因为 tab 切换隐藏其他)
- **AC-6** · DOM 总 button 数(无隐藏)≥ 47(4 tab + 20 脚本 + 22 元素 + 1 search)
- **AC-7** · typecheck + vitest 不破
- **AC-8** · 新增 e2e `tests/e2e/prd22-knowledge.spec.ts` · 6 test(H1 / 4 tab 切换 / 20 脚本卡 / search filter / 实战案例 button / 22 元素展示)
- **AC-9** · visual diff fixture 加 /knowledge · 阈值 5% · `pnpm test:visual:check` 通过

**文件 to modify** ·
- `apps/web/src/pages/Knowledge.tsx`
- `tests/e2e/prd22-knowledge.spec.ts`(新建)
- `tests/e2e/prd22-visual-baseline.spec.ts`

---

### US-006 medium · /step/1 视觉精修(56 emoji 卡 + 6 tab + 自定义 modal)

**风险分档** · 🟡 medium(/step/1 是 9 step 主流程入口 · 56 行业卡视觉密度高 · 但不影响下游 step pages)

**Story 大小** · medium-large(单次 ralph 迭代可完成 · 1 文件 rewrite + 56 数据补全 · ~450 LOC 边界 · 检查 size_hint)

**前置依赖** · `apps/web/src/lib/constants/industries.ts` 56 行业常量(PRD-17 已建)

**用户故事** ·
作为 QuanAn 用户 · 当我访问 /step/1 · 我看到 H1 `选择你的行业赛道` + 6 tab(全部行业 56 + 5 大类)+ 56 行业 emoji 卡 5 列网格 + 自定义输入行业 button(弹 modal)· 而不是 IndustryDropdown 单选下拉(6 button 极简实现)。

**验收标准** ·

- **AC-1** · /step/1 H1 字面锁 `选择你的行业赛道` · 副标题字面锁 `覆盖抖音、视频号等主流平台的 56+ 个细分行业。你也可以自定义输入行业。`(spec §7.1)
- **AC-2** · 顶部副标签字面锁 `STEP 01 · 选择行业赛道`(D-224)
- **AC-3** · 6 tab 字面锁(D-218)· 横向滚动 ·
  - tab 1 `全部行业 (56)`(默认 active · 显示全 56)
  - tab 2 `🏠 生活服务 (18)`
  - tab 3 `🛒 电商零售 (13)`
  - tab 4 `✍️ 内容创作 (7)`
  - tab 5 `💼 专业服务 (14)`
  - tab 6 `🏭 产业制造 (4)`
- **AC-4** · 搜索 input `搜索行业名称或关键词（如：美容院、餐饮、教育...）` · 实时按 label + keywords 模糊匹配
- **AC-5** · 56 行业卡 5 列网格(`grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3`)· 每卡含 emoji + label · 选中态 `bg-primary/10 border-primary` · 已选时顶部显示已选状态卡(emoji + name + keywords)
- **AC-6** · `自定义输入行业` button(link 风格 · 卡片网格下方)· click 弹 modal(`<Dialog>` from shadcn)· modal 含 input + 保存 button · 保存后顶部已选状态卡显示 `customIndustry`
- **AC-7** · 主 CTA button `确认并进入下一步`(`bg-gradient-to-r from-primary to-primary/60`)· disabled 条件 · `!industry && !customIndustry`
- **AC-8** · DOM button 数 ≥ 65(56 行业卡 + 6 tab + 1 search + 1 自定义 + 1 CTA)→ 接近 aiipznt 71
- **AC-9** · 表单状态走 stepData.save(step1 · `{ industry, industryLabel, customIndustry? }`)
- **AC-10** · typecheck + vitest 不破
- **AC-11** · 已有 e2e `tests/e2e/prd17-step1-flow.spec.ts` 更新断言对齐新结构(56 卡 / 6 tab / modal)
- **AC-12** · visual diff fixture 加 /step/1 · 阈值 5% · `pnpm test:visual:check` 通过

**文件 to modify** ·
- `apps/web/src/pages/steps/Step1.tsx`
- `apps/web/src/components/industry/`(可能新建 `IndustryEmojiGrid.tsx` + `CustomIndustryModal.tsx` 拆组件)
- `tests/e2e/prd17-step1-flow.spec.ts`(更新断言)
- `tests/e2e/prd22-visual-baseline.spec.ts`

**size_hint** · medium-large 边界 · ralph daemon 启动前 prd skill 必须自检 · 若实际 prompt > 11K 字节 → 拆 2 US(US-006a 56 卡网格 + 6 tab · US-006b 自定义 modal + 状态卡)

---

### US-007 medium · /step/3 + /step/3b 视觉精修(7+6 H3 + textarea + 5 平台 radio)

**风险分档** · 🟡 medium(2 个 step page 同 US · 共享 5 平台 radio + 多 textarea 输入模式)

**Story 大小** · medium-large(2 page rewrite · ~600 LOC 边界 · 检查 size_hint)

**前置依赖** · US-001 PlatformInlineRadio

**用户故事** ·
作为 QuanAn 用户 · 当我访问 /step/3 · 我看到 H1 `账号包装方案` + 个人信息 textarea + 5 平台 radio(PlatformInlineRadio)+ 目标受众 input + 现有账号情况 input + 主 CTA · 输出区 6 H3 块(视频参考案例 / 昵称推荐 / 头像设计方案 / 简介文案方案 / 整体包装策略 + 顶部"账号包装方案"H3)[重构删:背景图设计方案已删,7→6 H3] · 每块独立"复制" + "重新生成" button · 而不是 ToolForm 通用抽象只有 2 H 标签。/step/3b 类似 6 H3 块。

**验收标准** ·

- **AC-1** · /step/3 H1 `账号包装方案` · 副标题 `当前行业：{industry}。输入你的个人信息，AI 将为你生成极其详细的账号包装方案，包含昵称、头像参考图、背景图参考、简介等全方位深度解析。`[重构删:背景图参考图已删](spec §7.2)· 顶部副标签 `STEP 03 · 账号包装方案`
- **AC-2** · /step/3 输入表单 ·
  - textarea `你的个人信息`(必填)placeholder spec §7.2 line 1289 完整字面
  - `<PlatformInlineRadio value={platform} onChange={setPlatform} />`(5 平台 radio)
  - input `目标受众`(可选)placeholder `你想吸引什么样的粉丝？`
  - input `现有账号情况`(可选)placeholder `新账号/已有账号的粉丝量等`
  - 主 CTA `生成账号包装方案` · 次级 `[重新生成]` `[智能优化]`(已有结果时)
- **AC-3** · /step/3 输出区 6 H3(D-220 字面锁)[重构删:原7 H3,背景图设计方案已删] ·
  - H3 `账号包装方案`(顶部总览)
  - H3 `视频参考案例`(3 个 list)
  - H3 `昵称推荐`(5 备选)
  - H3 `头像设计方案`(style/colorScheme/expression/mustHave/avoid/aiPrompt)
  - [重构删:背景图参考图功能已删: H3 背景图设计方案]
  - H3 `简介文案方案`(formula + 6 versions)
  - H3 `整体包装策略`(visualConsistency/firstImpression/conversionPath/platformPriority)
  - 每 H3 块右侧 `[复制]` + `[重新生成]` button
  - 顶部右侧 `[一键重新生成]` `[复制全部]` button
- **AC-4** · /step/3b H1 `人设定制方案` · 输入 ·
  - textarea `你的个人信息`(必填)
  - textarea `你的独特优势`(可选)placeholder spec §7.3
  - textarea `你的个人故事`(可选)
  - input `目标受众`(可选)
- **AC-5** · /step/3b 输出区 6 H3(D-220 字面锁) ·
  - H3 `人设定位`
  - H3 `人设标签`
  - H3 `内容方向`
  - H3 `差异化策略`
  - H3 `内容方向建议`
  - H3 `IP 故事框架`
- **AC-6** · 表单状态走 stepData.save(step3 / step3b)
- **AC-7** · 加 `<glass-card>` wrapper 用到所有 H3 输出块 · framer-motion FadeInWrapper stagger 0.05 * idx
- **AC-8** · DOM H 标签数(/step/3)= 7(H1 + 6 H3)[重构删:原8=H1+7H3,背景图设计方案已删,现7=H1+6H3]
- **AC-9** · DOM H 标签数(/step/3b)= 7(H1 + 6 H3)对齐 aiipznt
- **AC-10** · typecheck + vitest 不破
- **AC-11** · 已有 e2e `tests/e2e/prd17-step3-flow.spec.ts` + `prd17-step3b-flow.spec.ts` 更新断言对齐新结构(7+6 H3)
- **AC-12** · visual diff fixture 加 /step/3 + /step/3b · 阈值 5% · `pnpm test:visual:check` 通过

**文件 to modify** ·
- `apps/web/src/pages/steps/Step3.tsx`
- `apps/web/src/pages/steps/Step3b.tsx`
- `tests/e2e/prd17-step3-flow.spec.ts`
- `tests/e2e/prd17-step3b-flow.spec.ts`
- `tests/e2e/prd22-visual-baseline.spec.ts`

**size_hint** · medium-large 边界 · 拆分 trigger · 若 prompt > 11K → US-007a /step/3 · US-007b /step/3b

---

### US-008 medium · /step/4 + /step/4b 视觉精修(3 阶梯输出 + 收入结构 + 成功案例)

**风险分档** · 🟡 medium(2 个 step page · /step/4 简单 input · /step/4b 复杂 3 阶梯输出)

**Story 大小** · medium-large(2 page rewrite · ~500 LOC · 检查 size_hint)

**前置依赖** · 无 inline picker 依赖(纯输入 + 输出)

**用户故事** ·
作为 QuanAn 用户 · 当我访问 /step/4 · 我看到 H1 `执行计划` + 3 输入(粉丝量 input · 目标 input · 情况 textarea)+ 主 CTA · 输出区按 spec §7.4 5 大模块。访问 /step/4b · H1 `变现路径规划` + 多输入(产品/服务描述 textarea · 行业 input)+ 输出区 3 阶梯 H3(初阶/中阶/高阶)+ 收入结构 H3 + 成功案例 H3 · 而不是 ToolForm 通用抽象。

**验收标准** ·

- **AC-1** · /step/4 H1 `执行计划` · 副标题字面锁 spec §7.4 · 顶部副标签 `STEP 04 · 执行计划`
- **AC-2** · /step/4 输入 ·
  - input `当前粉丝量`(可选)
  - input `目标(如：6个月做到5万粉)`(可选)
  - textarea `详细描述你的情况`(可选)placeholder spec §7.4 完整字面
  - 主 CTA `生成执行计划`
- **AC-3** · /step/4 输出 spec §7.4 line 1494-1505 ·
  - 每日 KPI H3
  - 每周 KPI H3
  - 阶段 KPI H3
- **AC-4** · /step/4b H1 `变现路径规划` · 副标题字面锁 spec §7.5 · 顶部副标签 `STEP 04B · 变现路径规划`
- **AC-5** · /step/4b 输入 ·
  - textarea `产品/服务描述`(必填)placeholder spec §7.5 完整字面
  - input `行业领域`(可选)
  - radio `5 平台`(可选 · 用 PlatformInlineRadio)
- **AC-6** · /step/4b 输出 D-220 阶梯锁 · 3 阶梯 H3 ·
  - H3 `初阶变现路径`(粉丝量级 + 月收入预估 + 具体方式)
  - H3 `中阶变现路径`(同上 · 进阶)
  - H3 `高阶变现路径`(同上 · 顶级)
  - H3 `收入结构分析`
  - H3 `成功案例参考`(行业典型案例)
- **AC-7** · glass-card + FadeInWrapper 用到所有 H3 输出块
- **AC-8** · DOM H 标签数(/step/4)= 4(H1 + 3 KPI H3) · (/step/4b)= 8(H1 + 7 H3 含 3 阶梯 + 收入 + 案例 + 总览)
- **AC-9** · 表单状态 stepData.save(step4 / step4b)
- **AC-10** · typecheck + vitest 不破
- **AC-11** · 已有 e2e `tests/e2e/prd18-step4-flow.spec.ts` + `prd18-step4b-flow.spec.ts` 更新断言
- **AC-12** · visual diff fixture 加 /step/4 + /step/4b · 阈值 5% · `pnpm test:visual:check` 通过

**文件 to modify** ·
- `apps/web/src/pages/steps/Step4.tsx`
- `apps/web/src/pages/steps/Step4b.tsx`
- `tests/e2e/prd18-step4-flow.spec.ts`
- `tests/e2e/prd18-step4b-flow.spec.ts`
- `tests/e2e/prd22-visual-baseline.spec.ts`

**size_hint** · medium-large 边界 · 拆分 trigger 同 US-007

---

### US-009 medium · /step/5 + /step/6 视觉精修(file upload + 粘贴文案 textarea)

**风险分档** · 🟡 medium(2 个 step page · 含 file upload 组件需要细致处理)

**Story 大小** · medium(2 page rewrite · ~350 LOC)

**前置依赖** · 无 inline picker 依赖

**用户故事** ·
作为 QuanAn 用户 · 当我访问 /step/5 · 我看到 H1 `爆款选题库` + 行业 input × 2 + file upload × 2(产品图 / 案例图)+ 主 CTA · 访问 /step/6 · H1 `拍摄计划` + 粘贴文案 textarea(至少 10 字)+ 跳 step7 提示 + 主 CTA。

**验收标准** ·

- **AC-1** · /step/5 H1 `爆款选题库` · 副标题字面锁 spec §7.6 · 顶部副标签 `STEP 05 · 爆款选题库`
- **AC-2** · /step/5 输入 ·
  - input × 2 ·
    - `行业领域` placeholder `例如：美业、餐饮、教育培训、服装...`
    - `产品/服务` placeholder `例如：皮肤管理项目、火锅加盟、英语培训课...`
  - file upload × 2(用 `<FileUpload />` 复用 PRD-19 沉淀 · 如不存在则新建)·
    - 产品图(可选 · 多张)
    - 案例图(可选 · 多张)
  - 主 CTA `生成爆款选题库`
- **AC-3** · /step/5 输出 spec §7.6 5 大选题类别 H3 ·
  - H3 `知识科普类选题`
  - H3 `产品种草类选题`
  - H3 `情感共鸣类选题`
  - H3 `争议讨论类选题`
  - H3 `干货实操类选题`
- **AC-4** · /step/6 H1 `拍摄计划` · 副标题字面锁 spec §7.7 · 顶部副标签 `STEP 06 · 拍摄计划`
- **AC-5** · /step/6 输入 ·
  - textarea `短视频文案` 必填 · 字符 ≥ 10 · placeholder `粘贴你的短视频文案（至少10个字），AI 将基于文案生成完整的拍摄计划。\n\n你可以使用第七步「文案生成」功能先生成文案，再来这里生成拍摄计划。`
  - 提示卡(infobox)· "你可以先去第七步「文案生成」生成文案 · 再回这里" + 跳 /step/7 button
  - 主 CTA `生成拍摄计划` · disabled · 文案 < 10 字时
- **AC-6** · /step/6 输出 spec §7.7 拍摄计划结构 · 分镜表 + 拍摄要点 H3 ·
- **AC-7** · glass-card + FadeInWrapper
- **AC-8** · DOM H 标签数(/step/5)= 6(H1 + 5 H3)· (/step/6)= 3(H1 + 2 H3)对齐 aiipznt
- **AC-9** · 表单状态 stepData.save(step5 / step6)
- **AC-10** · typecheck + vitest 不破
- **AC-11** · 已有 e2e `tests/e2e/prd18-step5-flow.spec.ts` + `prd18-step6-flow.spec.ts` 更新断言
- **AC-12** · visual diff fixture 加 /step/5 + /step/6 · 阈值 5% · `pnpm test:visual:check` 通过

**文件 to modify** ·
- `apps/web/src/pages/steps/Step5.tsx`
- `apps/web/src/pages/steps/Step6.tsx`
- `apps/web/src/components/file-upload/FileUpload.tsx`(如不存在则新建)
- `tests/e2e/prd18-step5-flow.spec.ts`
- `tests/e2e/prd18-step6-flow.spec.ts`
- `tests/e2e/prd22-visual-baseline.spec.ts`

---

### US-010 medium · /step/7 视觉精修(20 脚本 + 22 元素 + 4 H4 输出)

**风险分档** · 🟡 medium(/step/7 跟 /generate 共享 inline picker · 但 stepData 集成 + 4 H4 输出区(辩论类型)是独有 · 复用 US-001 + US-002 模式)

**Story 大小** · medium(1 page rewrite · ~380 LOC)

**前置依赖** · US-001 ScriptTypeInlineCards + ElementsInlineMultiPicker · US-002 /generate 实施模式

**用户故事** ·
作为 QuanAn 用户 · 当我访问 /step/7 · 我看到 H1 `文案生成` + ScriptTypeInlineCards(20 卡 + 搜索)+ ElementsInlineMultiPicker(22 元素 + 计数)+ 主题 textarea + 优化方向 input + 主 CTA + 次级 button(AI 优化 / 跳我的选题库 / 跳爆款选题)· 输出区按 spec §7.8 文案结果结构(以"搞辩论"为例 4 H4:话题抛出 / 正方 / 反方 / 我的立场)。

**验收标准** ·

- **AC-1** · /step/7 H1 `文案生成` · 副标题字面锁 `选择脚本类型和爆款元素，输入主题，AI 将基于方法论生成深度爆款文案，支持 AI 智能修改优化。`(spec §7.8 + D1A)· 顶部副标签 `STEP 07 · AI 智能文案生成`
- **AC-2** · 主区结构 ·
  1. PageHeader + H1
  2. `<ScriptTypeInlineCards value={scriptType} onChange={setScriptType} showSearch />` — 20 卡 + 搜索
  3. `<ElementsInlineMultiPicker value={elements} onChange={setElements} showCount layout="grouped" />` — 22 元素 4 组
  4. textarea `文案主题` 必填 · placeholder `输入你的文案主题，如：美容院如何用抖音获客100个精准客户...`(D1A)
  5. 显示 `当前脚本：{label} - {desc}`(spec §7.8 line 1701)
  6. input `优化方向`(可选)· placeholder `输入优化方向（可选），如：更有吸引力、增加互动感、更口语化...`
  7. 主 CTA · `[生成爆款文案]`
  8. 次级 button · `[AI 优化文案]` · `[我的选题库]` · `[爆款选题]`(跳 step/5)
- **AC-3** · 表单状态走 stepData.save(step7 · `{ scriptType, elements, topic, optimizeDirection, result }`)· **读** stepData(D-219 锁 · 跟 /generate 独立调用不同)
- **AC-4** · 输出区(以"搞辩论"为例)4 H4(D-220 锁) ·
  - H4 `话题抛出`
  - H4 `正方`
  - H4 `反方`
  - H4 `我的立场`
  - 加 评论区引导 / 话题标签 显示
- **AC-5** · 其他脚本类型输出区按 stub schema 渲染(本 PRD 仅"搞辩论"完整化 4 H4 · 其他类型 stub)
- **AC-6** · DOM button 数 ≥ 50(20 脚本 + 22 元素 + 1 CTA + 5 次级)→ 接近 aiipznt 53
- **AC-7** · DOM H 标签数 ≥ 11(H1 + 10 H4 含 4 + 输出区其他)对齐 aiipznt
- **AC-8** · typecheck + vitest 不破
- **AC-9** · 已有 e2e `tests/e2e/prd18-step7-flow.spec.ts` 更新断言对齐新结构
- **AC-10** · visual diff fixture 加 /step/7 · 阈值 5% · `pnpm test:visual:check` 通过

**文件 to modify** ·
- `apps/web/src/pages/steps/Step7.tsx`
- `tests/e2e/prd18-step7-flow.spec.ts`
- `tests/e2e/prd22-visual-baseline.spec.ts`

---

### US-011 medium · 跨 page polish(FadeInWrapper + glass-card + hover transition 200ms)

**风险分档** · 🟡 medium(纯视觉一致性 polish · 不重写功能)

**Story 大小** · small-medium(扫 13 page 替换 · ~150 LOC 修改)

**前置依赖** · US-002~010 全部完成

**用户故事** ·
作为 QuanAn 视觉一致性 owner · 我需要扫 13 page 把 framer-motion FadeInWrapper / glass-card / hover transition 时长 / Toaster sonner duration 统一 · 这样 PRD-21 D-211/213 命名锁能完整覆盖 PRD-22 范围 · pixel-diff 减少视觉抖动。

**验收标准** ·

- **AC-1** · 13 page 主区结构都用 `<FadeInWrapper delay={0.05 * idx} from="up">` 包裹 · 替换 raw `<div>` (5 inline + 8 step page)
- **AC-2** · 8 step page H3 输出块都用 `<glass-card>` wrapper · `bg-card/40 backdrop-blur-md border-border/40`
- **AC-3** · 所有 button hover transition 统一 `transition-all duration-200`(扫 `transition-` 替换)
- **AC-4** · Toaster sonner position=bottom-right duration=4000ms(继承 PRD-21 US-004 配置 · 验证 13 page 都生效)
- **AC-5** · DOM `<FadeInWrapper>` 数量 13 page 总 ≥ 60(每 page ≥ 3 stagger)
- **AC-6** · typecheck + vitest 不破
- **AC-7** · 已有 e2e 不破
- **AC-8** · visual diff 13 baseline 全跑 · 阈值 5% · `pnpm test:visual:check` 通过(可能因为 polish 微调有 pixel diff · 需要 update-snapshots 重新确认 baseline)

**文件 to modify** ·
- 13 page tsx 扫替换(`apps/web/src/pages/{Generate,BoomGenerate,AiVideo,Knowledge}.tsx` + `apps/web/src/pages/steps/{Step1,Step3,Step3b,Step4,Step4b,Step5,Step6,Step7}.tsx`)
- `apps/web/src/components/ui/glass-card.tsx`(如不存在则新建)

---

### US-012 收官 · verify-prd-22.sh + 13 page visual diff + /goal-verify + /prd-retro

**风险分档** · 🟡 medium(收官 · 不写新代码 · 验证 + 文档)

**Story 大小** · small-medium(scripts + docs · ~300 LOC)

**前置依赖** · US-001~011 全部完成

**用户故事** ·
作为 PRD-22 收官 owner · 我需要 verify-prd-22.sh 完整 10 section + 13 page visual diff 全 PASS + /goal-verify §0 跑 gsd-map-codebase 同步事实层 + /prd-retro 反哺 reject-examples.jsonl · 这样 PRD-22 ship 后下游 PRD-23 能正确启动。

**验收标准** ·

- **AC-1** · 新建 `scripts/verify-prd-22.sh` · 复用 PRD-21 10 section 结构 · 50+ checks · 关键检查 ·
  - §1 5 inline picker utility · grep 3 utility 文件存在 + barrel export + 单元测试存在
  - §2 /generate inline · grep `ScriptTypeInlineCards` + `ElementsInlineMultiPicker` import + main 区结构
  - §3 /boom-generate · grep `ElementsInlineMultiPicker` + 行业/主题 input
  - §4 /ai-video · grep `PlatformInlineRadio` + `VIDEO_TYPES` import + 分镜表 13 列
  - §5 /knowledge · grep 4 tab `"20 类脚本"` `"20 大爆款"` `"开头公式"` `"核心公式"` 字面 + 20 卡 + search input
  - §6 /step/1 · grep 6 tab `"全部行业 (56)"` 字面 + 56 卡 + 自定义 modal
  - §7 /step/3 + /step/3b · grep 6+6 H3 字面(D-220 锁)[重构删:step/3原7 H3→6 H3,背景图设计方案已删]+ PlatformInlineRadio
  - §8 /step/4 + /step/4b · grep 3 阶梯 H3 `"初阶变现路径"` `"中阶变现路径"` `"高阶变现路径"` 字面
  - §9 /step/5 + /step/6 + /step/7 · grep file upload + textarea + 20 脚本 + 22 元素 + 4 H4 输出
  - §10 跨 page · typecheck 0 errors + vitest > 196 test pass + 13 page visual diff pass + 13 visual baseline 文件存在
- **AC-2** · `pnpm test:visual:check` 13 page 全 PASS · 阈值 5% · 如有 fail 用 `--update-snapshots` 重 baseline 然后 Read 肉眼 confirm
- **AC-3** · `/goal-verify` 跑 §0 ·
  - `apps/web/.planning/codebase/` 7 文件 gsd-map-codebase 重新生成(/gsd-map-codebase)
  - D1=A 文字字面对账(13 page H1/副标/H3/H4 + 常量 SCRIPT_TYPES + HOT_ELEMENTS + PLATFORMS + INDUSTRIES + VIDEO_TYPES)
  - D4=B 颜色严锁(不引入 `from-violet-X` / `from-amber-X` · grep red flag)
- **AC-4** · `/goal-verify` 跑 §1+ · 对比 PRD-22 §2 目标 11 项 vs 12 US 交付 · 全 11 项 ✅ 才算 PASS
- **AC-5** · `/prd-retro` · 跨 PRD-21 vs PRD-22 复盘 · 提炼可迁移 Playbook(inline picker pattern + step page H3 输出锁 + visual diff 13 page extend)· 反哺 `~/.claude/playbooks/reject-examples.jsonl`(US-002 high audit 反例 + US-010 大 size 拆分反例)
- **AC-6** · 更新 `.agents/tech-debt.json` · 登记 PRD-22 内偏差(预期 ≤ 3 TD)
- **AC-7** · 更新 `AGENTS.md §11` · 加 PRD-22 沉淀(inline picker 抽象 + 13 page visual diff baseline)
- **AC-8** · 更新 `progress.txt` · ship summary 模板 ·
  ```
  ## YYYY-MM-DD HH:MM - US-012 [PRD-22] 收官 · verify-prd-22.sh + /goal-verify + /prd-retro
  ### PRD-22 Ship Summary
  - Ship date: YYYY-MM-DD
  - Branch: ralph/prd-22-inline-refactor-step-pages
  - Final commit: <hash>
  - 12 US 全 audit approved: US-001 ~ US-012 ✅
  - 13 page visual diff baseline 建立: <13 page list>
  - Vitest: > 196 tests pass (> 181 baseline)
  - TypeScript: 0 errors
  - verify-prd-22.sh: ≥ 50/50 checks pass (10 sections)
  ### PRD-22 → PRD-23 Handoff
  PRD-23 目标: 3 stub 完整化(/diagnosis · /accounts · /step/8) + 14 工具视觉精修
  - 继承 PRD-22 inline picker (3 utility)
  - 继承 PRD-21 visual baseline
  - 修复 TD-XXX (PRD-22 内登记)
  ```

**文件 to create** ·
- `scripts/verify-prd-22.sh`
- `.agents/goal-verify/prd-22-goal-verify.md`(/goal-verify 输出)
- `.agents/retros/prd-22-vs-prd-21-retrospective.md`(/prd-retro 输出)

**文件 to modify** ·
- `apps/web/.planning/codebase/` 7 文件(/gsd-map-codebase 自动生成)
- `.agents/tech-debt.json`
- `AGENTS.md`(§11 加 PRD-22 沉淀)
- `scripts/ralph/progress.txt`

---

## §4 验收标准摘要(plan-check 友好格式)

### §4.1 13 page 改造矩阵

| Page | US | 关键 AC 数 | inline button 目标 | H 标签目标 | visual diff baseline |
|---|:-:|:-:|:-:|:-:|:-:|
| /generate | US-002 | 9 | ≥ 45 | 1 | prd22-generate.png |
| /boom-generate | US-003 | 7 | ≥ 25 | 1 | prd22-boom-generate.png |
| /ai-video | US-004 | 8 | ≥ 14 | 2 | prd22-ai-video.png |
| /knowledge | US-005 | 9 | ≥ 47 | 1 | prd22-knowledge.png |
| /step/1 | US-006 | 12 | ≥ 65 | 1 | prd22-step1.png |
| /step/3 | US-007 | 12(共享) | ≥ 5 | 7[重构删:原8=H1+7H3→7=H1+6H3] | prd22-step3.png |
| /step/3b | US-007 | 12(共享) | ≥ 5 | 7 | prd22-step3b.png |
| /step/4 | US-008 | 12(共享) | ≥ 4 | 4 | prd22-step4.png |
| /step/4b | US-008 | 12(共享) | ≥ 8 | 8 | prd22-step4b.png |
| /step/5 | US-009 | 12(共享) | ≥ 5 | 6 | prd22-step5.png |
| /step/6 | US-009 | 12(共享) | ≥ 3 | 3 | prd22-step6.png |
| /step/7 | US-010 | 10 | ≥ 50 | 11 | prd22-step7.png |
| /knowledge mobile | US-005 | (共享) | ≥ 30 | 1 | prd22-knowledge-mobile.png |

### §4.2 共享 AC(全 12 US)

- **AC-X1** · typecheck 0 errors(`pnpm typecheck` · 每个 US 都验)
- **AC-X2** · vitest > 196 test pass(基线 PRD-21 181 + US-001 新增 ≥ 15)
- **AC-X3** · 已有 e2e 不破(PRD-15~21 所有 e2e fixture)
- **AC-X4** · D1=A 字面锁严守(H1 / 副标 / H3 / H4 / placeholder / button name)
- **AC-X5** · D4=B 颜色严锁(无 `from-violet-X` / `from-amber-X` 等具体颜色 utility)

### §4.3 跨 US 集成 AC

- **AC-Y1** · 5 inline picker utility 复用率 ≥ 80%(/generate + /boom-generate + /ai-video + /knowledge + /step/7 各复用至少 1 utility)
- **AC-Y2** · stepData.save 集成 8 step page 全部正确(/step/1 ~ /step/7 · 不含 /step/2 · /step/2 复刻 PRD-17 已 ship)
- **AC-Y3** · 13 page visual baseline 全建立(prd22-visual-baseline.spec.ts 13 fixture)
- **AC-Y4** · verify-prd-22.sh 50+ checks 全 PASS

---

## §5 风险红线(自我把控)

### §5.1 不变红线(继承 PRD-15~21)

1. ❌ 不删 PRD-15 沉淀 8 page 代码 · 仅视觉精修(US-002~005 重写 4 page · 但 PRD-15 的 ToolForm import 保留 D-216)
2. ❌ 不切金色 token(D4=B · 当前 HSL 43° 已是金色 · 视觉天然接近)
3. ❌ 不动 admin
4. ❌ 不重写 backend
5. ❌ 不直接 copy aiipznt 版权专属内容 · 用 QuanAn 占位
6. ❌ 不绕过 Audit Gate · 严格按全局 CLAUDE.md Coding 3.0 12 步
7. 🛑 推送远程 / 删数据 / 改 schema 破坏 · 提前问

### §5.2 PRD-22 新加红线

8. ❌ 不删除 ToolForm 组件(D-216 · 其他 page 还在用)
9. ❌ 不复用 PRD-15 的 IndustryDropdown(US-006 改用 56 卡 inline · 但 IndustryDropdown 保留供其他 page)
10. ❌ 不在 inline picker utility 里硬编码常量(全部走 `apps/web/src/lib/constants/`)
11. ❌ /generate 不读 stepData(D-219 · 跟 /step/7 区分)
12. ❌ /knowledge 4 tab 顺序不允许调整(D-217 字面锁)
13. ❌ /step/1 第一 tab 必须是 `全部行业 (56)`(D-218 · 即使 spec §7.1 line 1235 写法不同也以 dump §3 Diff 3 为准)

---

## §6 失败回滚 + 拆 story 协议

### §6.1 backup branch

`git branch backup/before-prd-22 ralph/prd-21-visual-alignment-foundation`(本会话 10:59 已建)

### §6.2 拆 story 触发

按全局 CLAUDE.md §9.6 ·
- size_hint=large 必须拆 ≥ 3 子 story
- prompt > 11K 字节 → 拒启 daemon · prd skill 重 split
- 单 story round ≥ 3 retry → 强制 retro + 拆

### §6.3 PRD-22 预测拆分点

| US | size_hint | 拆分预案 |
|---|---|---|
| US-001 | medium | 可拆 3 子(ScriptType / Elements / Platform 各一)如 ≥ 5 实测 reject |
| US-006 | medium-large | 拆 US-006a(56 卡 + 6 tab)+ US-006b(自定义 modal + 已选状态卡) |
| US-007 | medium-large | 拆 US-007a(/step/3 7 H3)+ US-007b(/step/3b 6 H3) |
| US-008 | medium-large | 拆 US-008a(/step/4 3 KPI H3)+ US-008b(/step/4b 3 阶梯 + 收入 + 案例) |
| US-009 | medium | 不拆 |
| US-010 | medium | 不拆(复用 US-001 + US-002 模式 · 内容相对集中) |

---

## §7 依赖图谱

### §7.1 前置 PRD(严格保留不动)

- **PRD-15**(/copywriting / /trending / /present-styles / /monetization / /private-domain / /my-topics / /history / /deep-learning 8 page 完整化 · ToolForm 抽象)
- **PRD-16**(设计系统 D1=A + D4=B + Home/Header/guide/ip-plan 结构 · animate-ping/data-grid-bg/glass-card 基础 utility)
- **PRD-17**(/step/1 IndustryDropdown 简版 + /step/3 + /step/3b 表单基础)
- **PRD-18**(/step/4 + /step/4b + /step/5 + /step/6 + /step/7 表单基础)
- **PRD-19**(8 stub /diagnosis / /accounts / /daily-tasks / /evolution / /step/8 / /generate / /boom-generate / /ai-video / /knowledge / /analysis / /video-production 基础占位[重构删:`/acquisition-video`获客视频功能已删,stub不再存在])
- **PRD-20**(LLM Gateway 真接入 · 9/9 PASSED)
- **PRD-21**(visual-diff infra + Header 精修 + Mobile nav + 共享 utility · 13 page baseline 可复用)

### §7.2 US 依赖

```
US-001 (foundation)
  ↓ ScriptTypeInlineCards + ElementsInlineMultiPicker + PlatformInlineRadio
  ├→ US-002 (/generate high)
  ├→ US-003 (/boom-generate)
  ├→ US-004 (/ai-video)
  ├→ US-005 (/knowledge)
  └→ US-010 (/step/7)

US-006 (/step/1)        ← 独立 · 无 inline picker 依赖
US-007 (/step/3 + 3b)   ← PlatformInlineRadio (US-001)
US-008 (/step/4 + 4b)   ← PlatformInlineRadio (US-001 · 可选)
US-009 (/step/5 + 6)    ← 独立 · file upload 组件(本 PRD 新建)

US-011 (跨 page polish) ← US-002~010 全部
US-012 (收官)           ← US-001~011 全部
```

### §7.3 下游 PRD

- **PRD-23** · 3 stub 完整化(/diagnosis · /accounts · /step/8)+ 14 工具视觉精修(已 inline 重构的 5 + 已 PRD-15 完整化的 8 + /trending 验证)
- **PRD-24** · 5 modules 视觉精修(/daily-tasks · /evolution · /my-topics · /history)+ 全 32 page visual diff 收官[重构删:`/voice-chat`语音对话功能已删,6→5 modules]

---

## §8 进度跟踪

### §8.1 daemon 命令

```bash
# 启动前必跑(§9.1 5 步 SOP)
cd /Users/return/Desktop/QuanAn
ls scripts/ralph/prd.json && python3 scripts/ralph/ralph-tools.py status

# 启 Monitor(必先于 daemon)
Monitor(command="tail -n 0 -F scripts/ralph/ralph-output.log 2>/dev/null | grep -E --line-buffered 'PENDING_DETECTED|审计门禁已激活|APPROVED|REJECTED|所有任务已完成|All stories resolved|非零退出码|最大重试次数|级联阻断|通过 Opus 质量审查|⛔|Traceback|Error:'", persistent=true, timeout_ms=3600000)

# 启 daemon
/Users/return/.local/bin/python3.11 scripts/ralph/ralph.py --model sonnet --daemon
```

### §8.2 预期时间线

| US | 预期 ralph 时间 | 累计 |
|---|:-:|:-:|
| US-001 | 30-45 min | 45 min |
| US-002 | 30-45 min(high · 可能 1-2 retry) | 1.5h |
| US-003 | 15-25 min | 2h |
| US-004 | 25-35 min(13 列表格复杂) | 2.5h |
| US-005 | 30-40 min | 3.5h |
| US-006 | 35-50 min(medium-large 边界) | 4.5h |
| US-007 | 40-55 min(2 page) | 5.5h |
| US-008 | 35-50 min(2 page) | 6.5h |
| US-009 | 25-35 min(2 page + file upload) | 7.5h |
| US-010 | 25-35 min | 8h |
| US-011 | 15-25 min(polish) | 8.5h |
| US-012 | 30-45 min(verify + retro) | 9.5h |
| **累计** | **9.5-11h daemon** | + Opus audit 5×2-15min/US ≈ 14-18h wall time |

### §8.3 跨 PRD-22 大门禁

1. ✅ US-001 完成 = 3 inline picker utility 可复用
2. ✅ US-002 + US-010 完成 = 高复用度验证(/generate vs /step/7 一致性)
3. ✅ US-005 完成 = /knowledge 4 tab D-217 字面锁实证
4. ✅ US-011 完成 = 13 page 视觉一致性 polish 通过
5. ✅ US-012 完成 = PRD-22 ship · 准备 PRD-23

---

> **本 PRD 由 Claude(Opus 4.7)在 PRD-22 启动期写 · 2026-05-19 · 跟 PRD-21 互补使用 · 待 prd skill 转 prd-22.json 后启 daemon。**
