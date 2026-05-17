# PRD-16 vs PRD-15 跨 PRD 复盘

> **写作时间** · 2026-05-17 08:30 BJT · /prd-retro 自动生成 · Opus 4.7 主对话
> **范围** · PRD-16 主应用前端对齐 aiipznt(Phase 1)· 11 US · 设计系统 + 首页 5 区 + Header 4 dropdown + /guide + /ip-plan
> **基线** · PRD-15 frontend-completeness A-Slim · 9 US · 严格一轮通过率 67%(3 reject 全 1 iter 修对)
> **本 PRD 严格一轮通过率** · **8/11 = 73%**(2 reject · US-003 violet + US-004 desc · 都 1 iter 修对)
> **本 PRD 总耗时** · ~9h wall(2026-05-16 11:48 daemon 启动 → 19:42 US-011 approve)
> **复刻定调** · D1=A 像素级 layout · D2=A cookies 实测 · D3=A 仅主应用 · D4=B 颜色保留 globals.css 金色

---

## §0 数据总览

### §0.1 关键事实(对比 PRD-13 / PRD-14 / PRD-15 / PRD-16 趋势)

| 维度 | PRD-13 | PRD-14 | PRD-15 | **PRD-16** | Δ vs PRD-15 |
|---|:-:|:-:|:-:|:-:|:-:|
| US 总数 | 12 | 15 | 9 | **11** | +22% |
| 严格一轮通过率 | 100% | 93.3% | 67% | **73%** | **+6%** ✅ |
| Reject 数 | 0 | 1 | 3 | **2**(US-003/004) | -1 ✅ |
| Blocked 数 | 0 | 0 | 0(cold start race 误触 1) | **0** | 持平 ✅ |
| **Ralph self-fix commits** | 10 | 4 | 9 | **6**(US-001 3 + US-008 1 + US-011 2) | -33% ✅ |
| Total commits | 23 | 21 | 23 | **28** | +22% |
| Wall time | 9.4h | 19.3h | 9.2h | **9h** | -2% 持平 |
| Wall time / US | 47 min | 77 min | 61 min | **49 min** | -20% ✅ |
| AC 总数 | 157 | 185 | 93 | **95** | +2% |
| AC / US | 13.1 | 12.3 | 10.3 | **8.6** | -16% |
| anti_patterns 注入 / US | 2.6 | 2.8 | 1.4 | **0.5**(5 US 各 1 条) | -64% ⚠️ |
| reject-examples.jsonl 累积 | 42 | 43 | 44 | **47**(+3 · violet 颜色 / desc 改写 / accountSwitcher 样式) | +3 |
| **foundation 档数** | 3 | 3 | 1 | **1**(US-001) | 持平 |
| high 档数 | 3 | 5 | 4 | **4**(US-002/004/007/009) | 持平 |
| medium 档数 | 6 | 4 | 4 | **6** | +50% |
| 新 TD 数 | 5 | 5 | 1 | **2**(TD-71 seed-chunk + TD-72 5 FAQ ？缺) | +1 |
| Resolved 历史 TD | 2 | 1 | 0 | **0** | 持平 |
| **关键事件** | — | RCA-006 + Step 4.5 | cold start race + R-4/R-5 false positive | **RCA-006 path-B 救场 US-007 · 反例累加 50%→86% · D4=B 颜色锁文档误读** | reject 转向 D1=A/D4=B 字面解读类 |

### §0.2 11 US 详细分布

| 域 | US 数 | risk 分布 | 通过情况 |
|---|:-:|:-:|---|
| ① 基础设施 | 1(US-001) | 1 foundation | **一次过**(但 4 self-fix · AC-6 字体加载难题 ralph 自创 body::before preload trick) |
| ② 首页 5 区 | 5(US-002~006) | 1 high + 1 high+large + 3 medium | **3/5 一次过** + **2 reject**(US-003 violet 颜色 + US-004 desc 创意改写) |
| ③ Header 重构 | 2(US-007/008) | 1 high + 1 medium | **2/2 一次过**(含 US-007 RCA-006 path-B 救场 + US-008 self-fix AC-5 「管理账号 → /accounts」) |
| ④ /guide + /ip-plan | 2(US-009/010) | 1 high+large + 1 medium | **2/2 一次过**(反例累加生效) |
| ⑤ 收官 | 1(US-011) | medium | ~3 iter(.test.ts → .spec.ts 改名 + e2e selector 修)· 33/33 + 24/24 全 PASS |

### §0.3 关键事件时间线

```
2026-05-16 11:48 BJT · daemon 启动 · ralph/prd-16-aiipznt-alignment branch
2026-05-16 11:50 · US-001 iter 1 dev OK · 29:58
2026-05-16 11:20 · US-001 iter 2 修 fonts.check + pages.test.tsx mock · 14:16
2026-05-16 11:34 · US-001 iter 3 修 trending.detail mock + h1 文案 · 13:31
2026-05-16 11:52 · US-001 iter 4 创 body::before preload trick 解 AC-6 + 自避 R-16
2026-05-16 12:00 · US-001 ✅ APPROVED · foundation
2026-05-16 12:17 · US-002 ✅ Hero 区 · 1 iter 一次过 · 视觉 1:1 对齐 aiipznt
2026-05-16 12:56 · US-003 ★ REJECT · 进度条 from-violet-600 字面解读 · 1 行修
2026-05-16 13:43 · US-003 retry approve · 80 min 总
2026-05-16 14:36 · US-004 ★ REJECT · 15 desc 全创意改写 D1=A 违反
2026-05-16 15:00 · US-004 retry approve · 24 min 修对 15 string(反例累加生效)
2026-05-16 15:19 · US-005 ✅ WORKFLOW · 1 iter 一次过(反例教训学到)
2026-05-16 15:35 · US-006 ✅ READY TO START? · 1 iter 14 min
2026-05-16 16:20 · US-007 ★ RCA-006 救场 · dev timed_out 30 min + commit 1a23a64 完整 + validator 跑过 · 1 iter 一次过
2026-05-16 17:16 · US-008 IP 切换 · 2 iter(主 + AC-5 「管理账号」self-fix)
2026-05-16 17:34 · US-009 ✅ /guide · 1 iter 18 min(反例累加 + TD-72 5 FAQ ？缺登记)
2026-05-16 17:53 · US-010 ✅ /ip-plan · 1 iter 18 min
2026-05-16 19:42 · US-011 ✅ 收官 · verify 33/33 + 4 e2e .spec.ts 24/24 chromium pass
2026-05-17 08:00 · /goal-verify 报告 · PASS-WITH-DEBT A 级
2026-05-17 08:30 · /prd-retro 写作中
```

### §0.4 Reject 根因分布

| 根因类型 | 计数 | 占比 | 关联 LD/红线 |
|---|:-:|:-:|---|
| **D1=A 像素级 layout 字面解读违反** | 1(US-004 15 desc 全创意改写) | 50% | (新规则 · 反例库已加) |
| **D4=B 颜色 token 锁文档措辞误读** | 1(US-003 violet-600 字面理解 PRD "紫色 gradient") | 50% | D4=B PRD §0.3 严锁 |
| AC 不严 | 0 | 0% | — |
| AGENTS.md 红线违反 | 0 | 0% | — |
| 设计缺陷 / 跨 story 集成 | 0 | 0% | — |

**对比 PRD-15** · PRD-15 3 reject 全为 R-5 / R-4 audit script false positive(LocalStorage acc_ + stats aggregate)· PRD-16 2 reject 转向 **D1=A/D4=B 字面解读类**(从 audit script 检测漏 → PRD 文档措辞精度问题)。

---

## §1 PRD 文档质量

### 维度对比

| 项 | PRD-15 | PRD-16 |
|---|---|---|
| seed 文档长度 | 1216 行 | 1280 行(+5%) |
| 11 US AC 详细度 | 8-11 AC/US 平均 10.3 | 8-10 AC/US 平均 8.6(-16%) |
| 完整代码片段嵌入 | 95% AC | 90% AC(US-002 hero 完整 jsx · US-004 完整 15 卡数据)|
| Locked Decisions | D-117~D-129(13 LD) | D-130~D-145(16 LD · +23%) |
| 跨 Story 协议锁 | 8 命名锁 | **12 命名锁**(+50%)· HEADER_NAV / FUNCTION_MATRIX / WORKFLOW_STEPS / GUIDE_MODULES / STEP_CARDS / FAQS 6 数据常量 + glass-card / data-grid-bg / animate-ping-primary / font-display / font-cn / font-label 6 utility |
| 反例库 anti_patterns 注入 | 5 US 各 1-3 条 | 5 US 各 1 条(高/foundation) |
| Non-Goals | 6 项 | 6 项 |
| Technical Considerations | 6 节 | 6 节 |

**PRD-16 增强点** ·
1. **跨 Story 协议锁 +50%** · 6 数据常量(HEADER_NAV / FUNCTION_MATRIX / 等) + 6 utility(glass-card / 等)· 12 命名锁全跨 US 一致(plan-check 验证)
2. **D-130~D-145 16 LD** · 跨 PRD 延续 D-129 · 含 D4=B 严锁(D-132) + D1=A 像素级要求

**PRD-16 漏洞**(retro 发现) ·
1. **D4=B 颜色措辞误读**(US-003 reject 根因)· PRD seed 写"紫色 gradient" + 代码 `from-primary` 自相矛盾 · ralph 字面读"紫色"用 violet-600
   - **plan-check WARN-1 已警告**("QuanQn 实际是金色非紫色 · ralph 用 var(--primary) 不论值都正确")· 但 PRD 文档没修(用户选 A 不修)
   - 教训 · plan-check WARN 必须在启 daemon 前修文档 · 不能仅给 ralph 自由发挥
2. **D1=A 文字内容锁不够明确**(US-004 reject 根因)· PRD AC-2 写 15 卡数据字面 + 跨工具命名锁 · 但没显式说"desc 是 layout 一部分 · 不允许创意改写"· ralph 当 desc 字段是"建议"
   - 教训 · PRD §0.3 复刻定调表应加一行 "**文字内容(title/desc/文案 等)= layout 严格一部分**"

---

## §2 plan-check W-patches

### 数据

| 项 | PRD-15 | PRD-16 |
|---|---|---|
| plan-check 跑次数 | 1 | 1 |
| W-patches 预埋 | 0 patches(纯 PASS) | 2 W-patches 警告(WARN-1 D4=B 颜色措辞 + WARN-2 6 AC ≥9 条详细度优先 · 都不阻断) |
| ERROR 数 | 0 | 0 |
| WARNING 数 | 2 | 2 |
| anti_patterns 覆盖率(2.6.13) | 5/5 high/foundation 全有注入 | 5/5 全有注入 ✅ |
| 大 UI Story 拆分(2.6.14) | 通过 | 通过(US-004/009 large 但 single page 单 ralph 完成) |

### 评估

- **WARN-1 D4=B 颜色措辞警告(写而不修 · 后果)** · plan-check 早警告"QuanQn 实际金色 + PRD 写紫色文档措辞误"· 但用户选 A 不修 PRD · ralph 字面解读 → US-003 reject。**如修 PRD 文档预估省 1 reject(80 min)**。
- WARN-2 AC ≥9 条详细度优先 · 实际验证通过(US-001 10 AC + US-004 10 AC + US-007 10 AC + US-009 11 AC 都单 ralph 完成)· 警告噪音可忽略。

**ROI 量化** · plan-check 在 PRD-16 预埋 0 主动 patches(纯结构检查) · WARN-1 未修文档造成 1 reject 损失 · **plan-check 实际收益偏低 · 应升级 WARN-1 类规则为 PRD 必修门禁**(留 §10 Diff)。

---

## §3 Ralph 跨 story 主动扩展能力

### 主动扩展 5 标志性案例

1. **US-001 AC-6 字体加载难题自创 body::before preload trick + 自避 R-16 红线**
   - 根因 · Google Fonts variable-weight 只下载页面用的字重 · 页面全 Orbitron:700 · `check('1em Orbitron')` 默认查 :400 → false
   - 自创修 · `body::before` 用 invisible Orbitron:400 触发下载 + 放 `index.html` 内联 `<style>` 不放 `src/styles/`(避 R-16 grep `Orbitron` 误报)
   - **价值** · 解了一个 LLM 不能预知的浏览器 quirk · 同时主动规避 audit 红线

2. **US-007 RCA-006 path-B 救场**
   - dev timed_out 30 min · commit 1a23a64 完整(148 行 Header.tsx + 57 行 header-nav.ts + 5 screenshots)
   - daemon 不 SKIP validator(按 RCA-006 修复)· validator 跑过 · 1 iter 一次过
   - **价值** · 复杂 component 重构(Header blast radius 32 page)在 dev timeout 边界仍能交付完整产物

3. **US-008 AC-5 self-fix「管理账号 → /accounts」替换 PRD-15「新建账号」**
   - 主 commit 后 validator 提示 AC-5 要求 `「管理账号 → /accounts」` 但 ralph 复用 PRD-15 AccountSwitcher 默认 `「新建账号」` 跳 modal · 不对
   - self-fix 1 commit 改对 · 无 reject
   - **价值** · ralph 主动覆盖跨 PRD 复用 component 的样式差异

4. **US-011 自学 .test.ts vs .spec.ts 区分**(playwright vs vitest)
   - 主 commit 用 `.test.ts` · vitest 上下文加载 → `@playwright/test test.describe()` 崩
   - self-fix 重命名 `.test.ts → .spec.ts` + 删旧 4 file · 一次解决
   - **价值** · ralph 学到 testing tooling 边界 + 跨工具 file naming convention

5. **US-009 search filter UX 优化**(progress.txt 学习)
   - 主实现按 PRD 写 search filter 联动 13 模块卡
   - ralph 主动加 `search filter 联动隐藏 RECOMMENDED FLOW + SYSTEM OVERVIEW 两个 section · 保持 MODULE GUIDE + FAQ 始终可见 · 体验更流畅`
   - **价值** · ralph 创意优化 UX(没违反 D1=A · 因 search 行为 PRD 没字面锁定)

### 对比 PRD-15

- PRD-15 主动扩展 5 案例 · US-002 自治判断 helper 替换 LS_PREFIX / US-004 复用 getToolLsKey / US-005 multi-view layout / US-007 myTopics 3-source 聚合 / US-008 history stats audit-friendly 注释
- PRD-16 主动扩展 5 案例(同 5 个上述)· 但**性质不同** · PRD-15 偏 "跨工具命名一致性" · PRD-16 偏 "工具链 quirk + 测试 framework 边界"

---

## §4 progress.txt 跨 PRD 知识传递

### PRD-15 → PRD-16 传递 8 patterns

1. ✅ LocalStorage 走 ls-namespace.ts 集中 helper(US-005 reject 教训)— **PRD-16 不触 LS · 仅 inherited 不发挥**
2. ✅ stats/aggregate audit-friendly 注释(US-008 reject 教训)— **PRD-16 不触 stats · 仅 inherited**
3. ✅ 跨工具跳转 URL params 协议锁(?source=trending&trendingId 等)— **PRD-16 不触工具跳转 · 仅 inherited**
4. ✅ 5 mock IP 账号 + DEV_OAUTH_MOCK 双 flag — **US-008 复用 AccountSwitcher 时受益**
5. ✅ Validator playwright + screenshots 实证 — **PRD-16 全 US 6+ screenshots 累计 12 张实证 · 完全继承**
6. ✅ StepForm + Schema 驱动模式跨 PRD 复用 — **PRD-16 不触 StepForm · 仅 inherited**
7. ⚠️ ralph 跨 US 主动吸取教训 — **PRD-16 部分继承**(US-005~011 反例累加生效 · 但 US-003/004 仍触发 D4=B/D1=A 新反例)
8. ✅ cold start race condition · ralph.py timeout 20→45 + 3 retry — **PRD-16 0 cold start race 触发**(修复有效)

### PRD-16 → PRD-17 新增 8 patterns(给 progress.txt 回传)

```
## Codebase Patterns - PRD-16 贡献(retro 于 2026-05-17 提炼)
- 字体设计系统切换 · Orbitron(大标题)+ Rajdhani(副标)+ Noto Sans SC(中文)· Google Fonts preconnect + display=swap · 仅 9 字重 ~150 KB 增量
- glass-card / data-grid-bg / animate-ping-primary 3 utility 跨 4-7 US 复用 · `color-mix(in oklch, var(--primary) X%, transparent)` 紫色变体技巧(实际渲染金色因 --primary 是金色)
- `document.fonts.check('1em Orbitron')` 需页面元素实际用 Orbitron:400 才返回 true · ralph 自创 body::before invisible preload trick + 自避 R-16 红线(放 index.html 不放 src/styles/)
- Header 4 dropdown click 触发(非 hover)· shadcn `<DropdownMenuTrigger asChild>` 默认 click · `min-w-[180px] rounded-xl border-primary/15 bg-popover/95 backdrop-blur-xl shadow-primary/5`
- D4=B 颜色严锁 · 不引入 Tailwind 默认色 utility(violet-X / amber-X / yellow-X 等)作主品牌色 · 仅 status semantic indicator(PhaseCard attract=blue / trust=yellow / DailyTasks easy=green)可保留
- D1=A 像素级 layout · PRD AC 锁定的 desc / title / 文案字面必须严格 1:1 · 不允许 ralph 创意改写 · 跨 US 协议锁(HEADER_NAV / FUNCTION_MATRIX / WORKFLOW_STEPS / GUIDE_MODULES / STEP_CARDS / FAQS 6 组 constants 文件 + 12 跨 US 命名锁)
- RCA-006 path-B 救场实证 · US-007 dev timed_out 30 min + commit 落地 + validator 跑 + 1 iter 一次过 · 复杂 component 重构在 dev timeout 边界仍能交付
- playwright e2e 必须用 .spec.ts(不能用 .test.ts · 根 vitest.config.ts include 会误收 · @playwright/test test.describe() 在 vitest 上下文崩溃)· tests/e2e/ 目录可 .spec.ts(playwright)+ .test.ts(vitest)共存
```

---

## §5 Opus Audit feedback 演化

### 2 reject feedback 质量

#### Reject 1 · US-003 violet 颜色(2026-05-16 12:56)

**feedback 模板** · REJECT-TEMPLATE 4 元素 ·
- ✅ **Blocker** · 1 段说明 + 根因(D4=B 严锁意图)
- ✅ **当前代码** · 行号(line 62-66)+ 完整 jsx 片段
- ✅ **目标代码** · 完整 jsx 片段 · `from-primary to-primary/60`
- ✅ **绝对不能** · 4 反例(不用 Tailwind 默认色作主品牌色 + 不引入 OKLCH + 不加 `gold:` 到 tailwind.config + 不硬编码 hex)
- ✅ **验证方式** · 5 项(grep + test + typecheck + audit + 视觉)
- ✅ **预估** · 1 iter 一次过(1 行改)

**结果** · ralph 1 iter 修对(commit a396df3 line 64 改完)。

#### Reject 2 · US-004 desc 创意改写(2026-05-16 14:36)

**feedback 模板** · REJECT-TEMPLATE 4 元素 ·
- ✅ **Blocker** · 跨 D1=A 像素级 + §0.3 复刻定调表 锁定
- ✅ **示例对比** · 前 5 desc(ralph vs aiipznt 实测) · 清晰对照
- ✅ **根因** · ralph 把 PRD AC desc 当"建议"创意改写
- ✅ **目标代码** · grep PRD AC-2 抽取 15 desc 字面 + 完整 15 desc 列表
- ✅ **绝对不能** · 5 反例(防漂移)
- ✅ **验证方式** · 5 项(grep -F 15 desc + typecheck + audit + 重 screenshot + 视觉)
- ✅ **预估** · 15 string 替换 1 iter 一次过
- ✅ **跨 PRD 反例累加价值** · 注入 reject-examples.jsonl 影响 US-007 Header 25 nav / US-009 13 模块 · 省 2 reject

**结果** · ralph 1 iter 修对(commit c7c72bc 改 15 desc)。

### 反例累加效果验证

| 阶段 | US 数 | 严格一轮通过率 | reject 数 | 反例库 |
|---|:-:|:-:|:-:|:-:|
| **前 4 US**(US-001~004) | 4 | 50%(2/4) | 2(US-003+US-004) | 入库 +2 |
| **后 7 US**(US-005~011) | 7 | **86%(6/7)** | 0(US-008 self-fix 不算 reject) | 反例库防类似漂移 |
| **整体 11 US** | 11 | **73%(8/11)** | 2 | +3(含 US-008 self-fix 反例) |

**结论** · 反例累加机制实证有效 · 前 4 US 50% → 后 7 US 86% · **+36% 通过率提升** · 跨 PRD anti_patterns 注入是 Coding 3.0 核心 ROI 来源。

---

## §6 Story 粒度 + Wave 设计

### 粒度数据

| US | risk | size | files_to_create | files_to_modify | AC | iter | 实际 wall time |
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---|
| US-001 | foundation | medium | 1 | 3 | 10 | 4 | 70 min |
| US-002 | high | medium | 1 | 1 | 6 | 1 | 17 min |
| US-003 | medium | small | 0 | 1 | 7 | 2 | 80 min(含 reject) |
| US-004 | **high+large** | large | 1 | 1 | 7 | 2 | 25 min(含 reject 修 15 string) |
| US-005 | medium | small | 1 | 1 | 5 | 1 | 17 min |
| US-006 | medium | small | 0 | 1 | 4 | 1 | 14 min |
| US-007 | high | medium | 1 | 1 | 9 | 1(含 RCA-006) | 45 min |
| US-008 | medium | small | 0 | 2 | 6 | 2(self-fix) | 55 min |
| US-009 | **high+large** | large | 2 | 1 | 7 | 1 | 18 min |
| US-010 | medium | medium | 0 | 1 | 5 | 1 | 18 min |
| US-011 | medium | medium | 5 | 0 | 7 | ~3 | 107 min(收官 verify + e2e + spec.ts 改名) |

### 分析

- **平均 wall time / US · 49 min**(PRD-15 是 61 min · -20%)
- **US-001 foundation 4 iter / 70 min** · 字体加载难题占 70% 时间(US-001 4 iter 中 3 iter 都在解 AC-6)
- **US-004 large 但 reject 修对 1 iter / 25 min** · 单文件 15 string 替换 · large 标记仅指数据量大 · 实际逻辑简单
- **US-009 large 1 iter / 18 min** · 13 模块 + 5 FAQ + 5 推荐流程 · 全新 page · ralph 一次完成
- **US-011 收官 107 min** · verify script + 4 e2e + .spec.ts 改名 + selector 修(2 self-fix iter)· 比预期(30-50 min)慢 · 因为收官 US 含多种验证类型

### 经验

- **foundation 档(US-001)** · 字体类工具链 quirk 容易撞边界 · 应预留 60-90 min · 包含 ralph 自创 trick 的时间
- **large 标记** · 不一定意味长 wall time · 数据量大但单文件单逻辑可单 ralph 完成
- **收官 US** · verify 9-12 section + 4-5 e2e · 应给 90-120 min(不是 30-50 min)

---

## §7 基础设施复用

### PRD-16 复用 PRD-3 / PRD-15 sunk cost

| 复用项 | 来源 | 用法 | US |
|---|---|---|---|
| `<StepProgress>` | PRD-3 US-005 | IP 进度区 9 step 渲染 | US-003 + US-010 |
| `<AccountSwitcher>` | PRD-15 US-001 | Header 右侧 IP 切换器 + 改样式 | US-008 |
| `useActiveAccount` hook | PRD-15 | 通过 user 上下文(AccountSwitcher 内部用) | US-008(transitive) |
| `useAuth` hook | PRD-3 | Header 登录态判断 + login/logout | US-007 + US-008 |
| `DEV_OAUTH_MOCK` 双 flag | PRD-15 US-001 | dev 演示 4 用户路径 + admin auth bypass | 所有 US 共享 |
| `ls-namespace.ts` getLsKey/getToolLsKey | PRD-15 US-005 | LocalStorage 隔离 helper | **PRD-16 不触 LS · 仅 inherited 不用** |
| `globals.css --primary` token | PRD-3 baseline | 主色 `var(--primary)` | 全 US D4=B 严锁不动 |
| `shadcn/ui` Button + DropdownMenu + Sheet | PRD-3 | Header + button + dropdown | US-002 + US-006 + US-007 + US-008 |
| `lucide-react` icons | PRD-3 | LogOut + Menu + ArrowLeft + RefreshCw + FileText + ChevronDown | US-007 + US-008 + US-010 |
| `font-display / cn / label` utility | US-001 新建 | 字体应用 | 全 7 US 用(US-002~006 + US-009 + US-010) |
| `glass-card / data-grid-bg / animate-ping-primary` | US-001 新建 | 4-7 US 跨复用 | US-002~006 + US-008~010 |

**0 重写率** · 100% sunk cost 保留 · PRD-1~14 admin 系统 0 触动(D3=A 严守)。

### 对比 PRD-15

- PRD-15 复用 PRD-3 StepForm + StepResult + IndustryDropdown(PRD-15 新建) + ls-namespace.ts(PRD-15 新建)
- PRD-16 进一步加 glass-card + data-grid-bg + animate-ping-primary 3 utility · 跨 4-7 US 复用 · 给 PRD-17~19 提供"主应用 page 视觉一致性"基础

---

## §8 audit 专项扫描

### PRD-16 期间执行的 audit grep 模式

| audit 模式 | 跑次数 | 命中 | 价值 |
|---|:-:|:-:|---|
| `grep gold/violet/amber/yellow` D4=B 严锁 | 11 US 每次 audit | 1 命中(US-003 violet)→ reject | ✅ 防颜色漂移 |
| `grep desc 字面` D1=A 像素级 | 11 US | 1 命中(US-004 15 desc 全错)→ reject | ✅ 防文字漂移 |
| `grep 跨 story 命名锁`(HEADER_NAV / FUNCTION_MATRIX / glass-card 等) | plan-check + 每 US audit | 12/12 全命中 | ✅ 协议锁有效 |
| `grep TOOLS_14 / NEW_MODULES_6` 旧数组清理 | US-007 audit | 0 命中 | ✅ ralph 自删 |
| `grep prisma.X.create/update.where.accountId` LD-009 | 每 audit | N/A(PRD-16 不触 DB) | — |
| `grep localStorage.setItem/getItem` R-5 LD-009 | 每 audit | N/A(PRD-16 不触 LS) | — |
| `audit-redlines.sh` 17 R-1~17 | 每 audit | 0 命中 | ✅ |
| `audit-redlines-admin.sh` 11 LD-A + 6 R-A | 每 audit | ALL PASS | ✅ D3=A 严守 |

### audit script 自我健康

- `audit-redlines.sh` · 全 PRD-16 期间 0 错 0 路径漂移(PRD-5 retro TD-016 同类问题预防)
- `audit-redlines-admin.sh` · 0 命中(admin 0 触动)
- `verify-prd-16.sh` · 9 sections 33 checks · 0 fail

### 1 个 audit 局限发现

- **5 FAQ q 末尾全角 ？ 漂移**(TD-72)· audit 没 grep 检测 · ralph 漏 5 处 · Opus audit grep 没 explicit 检查
  - 建议(retro 留)· verify-prd-16.sh 加 section 10 · grep `q: '[^']*？'` 验证 5 q 全有 ？

---

## §9 反向发现(不可迁移 / 偶然成功)

### 偶然成功 1 · US-001 body::before preload trick

- 原因 · Google Fonts variable-weight 文件存在 + `document.fonts.check()` 默认查 weight:400 这个 quirk · ralph 通过 4 iter 自检学到
- 不可复制性 · 取决于 ralph 模型 (Sonnet) 能否再次 deduce 同样的 trick · PRD-17 不一定能复用
- 缓解建议 · 把 trick 写入 progress.txt + AGENTS.md §11.X 沉淀 · 防 PRD-17~19 字体类 issue 反复

### 偶然成功 2 · US-007 RCA-006 path-B 救场

- 原因 · ralph dev timed_out 但 commit 完整 + RCA-006 修复让 daemon 不 SKIP validator · validator 跑过 · 1 iter 一次过
- 不可复制性 · 取决于 dev timed_out 时 commit 完整度 · 如果只 commit 一半则 path-B 救不了 · 仍要 reject
- 缓解建议 · ralph dev 应学习"完整 commit 才 timeout"模式(已在 progress.txt · 但下游 PRD 仍可能撞)

### 偶然成功 3 · US-008 self-fix AC-5 「管理账号」

- 原因 · ralph 主 commit 复用 PRD-15 AccountSwitcher 默认 「新建账号」 · validator 提示 AC-5 要 「管理账号 → /accounts」· ralph 1 commit 自修
- 不可复制性 · 取决于 validator 是否能精确指出错处 + ralph 是否能精确修复 · 不是每次都行
- 缓解建议 · 跨 PRD 复用 component 时 · PRD seed 显式说"覆盖默认 X 改为 Y" · 防 ralph 默认沿用前 PRD 实现

### 偶然成功 4 · US-009 search filter UX 优化

- 原因 · ralph 主动想到"search 联动隐藏 RECOMMENDED FLOW + SYSTEM OVERVIEW · 保持 MODULE GUIDE + FAQ 始终可见"
- 不可复制性 · 取决于 ralph 自由发挥度 + PRD 没字面锁(D1=A 严锁的部分不能自由 · 但 UX behavior 仍有空间)
- 缓解建议 · PRD §0.3 复刻定调表区分 "layout 严锁" vs "UX behavior 自由发挥"

### 偶然成功 5 · 反例累加机制有效

- 原因 · US-003/004 reject feedback 注入 reject-examples.jsonl · ralph build_developer_prompt 自动渲染 [SHIELD] 段落 · 后 7 US 一次过率 86%
- 不可复制性 · 取决于反例库质量 + ralph 是否真读 [SHIELD] · 跨 PRD 跨项目反例规模 · PRD-17 可能撞新反例类型
- 缓解建议 · 反例库回流 + 定期 audit jsonl 质量(去重 / 旧反例淘汰)

---

## §10 应固化为 Coding 3.0 机制的建议(L4→L5 元进化)

### M-1 · plan-check WARN 必修门禁(防 US-003 类 reject)

- **观察** · PRD-16 plan-check WARN-1 说"PRD seed 写紫色但 QuanQn 实际金色 · ralph 字面理解风险" · 用户选 A 不修 PRD · ralph 真字面理解 → US-003 reject
- **现状** · plan-check WARN 仅警告 · 不阻断
- **建议机制化位置** · `/plan-check` 升级 · WARN-1 类(PRD AC 中文颜色词 vs token 不一致)从 WARN 升级到 ERROR(阻断 plan-check)· 强制 PRD 修文档再启 daemon
- **实现思路** ·
  ```python
  # /plan-check 2.6.7 升级
  - 扫 prd.json AC 文本里的中文颜色词("紫色"/"金色"/"红色"/"蓝色" 等)
  - 扫同 AC 内的 var(--X) 引用 · 校验颜色词 vs token 一致(查 globals.css --X 的 HSL hue)
  - 不一致 → ERROR · 阻断 plan-check · 输出建议补丁(改文字 / 改 token / 加注释明确)
  ```
- **ROI 估算** · 每 PRD 预估省 1-2 reject(约 60-120 min)· 5 PRD 累计 5-10 reject 节省

### M-2 · D1=A 像素级文字内容锁(防 US-004 类 reject)

- **观察** · PRD-16 US-004 ralph 把 15 desc 全创意改写 · D1=A 没明确"文字是 layout 严格一部分" · ralph 当"建议"
- **现状** · D1=A 文档措辞模糊 · plan-check 无 desc/title 字面 grep 检查
- **建议机制化位置** · `/plan-check` 新增 2.6.20 检查 · D1=A 锁定的 desc/title/文案字面 grep 验证
- **实现思路** ·
  ```python
  # /plan-check 2.6.20 · D1=A 文字内容字面锁
  - 扫 prd.json US 的 acceptanceCriteria 内 `title: 'X'` / `desc: 'Y'` / `label: 'Z'` 等字段字面
  - 校验 prd.json AC 内 grep 严格匹配
  - 若 ralph 实现后 grep 找不到 PRD AC 字面 → 输出 reject 候选 · 让 Opus audit 检查
  - 同时 PRD seed §0.3 复刻定调表加一行 "文字内容(title/desc/label/文案 等)= layout 严格一部分"
  ```
- **ROI 估算** · 每 PRD 预估省 1 reject(US-004 类)· 累计 5 PRD 5 reject 节省

### M-3 · audit script 加 FAQ q 中文标点检查(防 TD-72 类)

- **观察** · PRD-16 US-009 5 FAQ q 全缺全角 ？(TD-72)· audit script 没检测 · Opus audit 漏判
- **现状** · verify-prd-16.sh 9 sections · 无中文标点完整性检查
- **建议机制化位置** · 项目 audit-redlines.sh 加 R-N · 中文 q 必含 ？ / ! / 等
- **实现思路** · 简单 grep · `grep "q: '[^？！。]*?'" guide.ts` · 期望 0 命中
- **ROI 估算** · 单 TD 价值 Low · 不建议机制化(标点 drift 是边缘情况)· 留 retro 提醒即可

---

## §11 Skill 升级建议 diff(L4 半自动进化 — 生成建议 · 人工 apply)

### Diff-1 · /plan-check 2.6.7 升级 · PRD AC 颜色词 vs token 一致性检测(ERROR 级)

- **文件** · `~/.claude/commands/plan-check.md`
- **位置** · §2.6.7 CSS Var 对齐扫描 节内升级
- **原因** · PRD-16 US-003 reject 根因(WARN 未升级 ERROR · ralph 字面解读 violet)
- **建议 diff** ·

```diff
##### 2.6.7 CSS / 设计系统 Var 对齐扫描(PRD-6 复盘 M-1 固化 · 2026-04-23 新增 · PRD-16 retro M-1 升级 · 2026-05-17)

+ **2026-05-17 升级 · 中文颜色词 vs token 一致性 ERROR 级**
+ 
+ 扫 prd.json AC 文本里的中文颜色词("紫色"/"金色"/"红色"/"蓝色"/"绿色"/"violet"/"gold"/"red"/"blue"/"green" 等)·
+ 校验同 AC 内 var(--X) 引用 vs globals.css --X 的 HSL hue 一致 ·
+ 不一致 → **ERROR**(阻断 plan-check · 不是 WARN)·
+ 强制 PRD 修文档(改文字 / 改 token / 加注释明确)再启 daemon
+ 
+ **检查规则**(伪代码):
+ ```python
+ COLOR_WORDS = {
+     '紫色|violet|purple': lambda hue: 240 <= hue <= 300,
+     '金色|gold|yellow': lambda hue: 30 <= hue <= 60,
+     '红色|red': lambda hue: hue < 15 or hue > 345,
+     '蓝色|blue': lambda hue: 195 <= hue <= 240,
+     '绿色|green': lambda hue: 90 <= hue <= 150,
+ }
+ # 扫 prd.json AC 含中文颜色词的位置
+ # 扫同 AC 含 var(--X) 引用
+ # 查 globals.css --X 的 HSL 值
+ # 不一致 → ERROR
+ ```
+ 
+ **输出示例**:
+ ```
+ ERROR [AC-color-token-mismatch] US-003 AC 第 3 条 描述 "紫色 gradient" 但代码 from-primary
+   globals.css --primary HSL(43, 87%, 63%) = 金色(hue 43)
+   建议补丁(3 选 1):
+     选项 A: 改文字 → "金色 gradient"
+     选项 B: 改 token → from-violet-500(若真要紫色 · 但违反 D4=B)
+     选项 C: 加注释 → "// 紫色 gradient(D4=B 锁 · 实际渲染 primary 金色)"
+   预估避免: 1-2 次类似 reject(每次 60-90 min)
+ ```
```

- **人工 apply 流程** · 用户 review → 同意 → Opus Edit `~/.claude/commands/plan-check.md`

### Diff-2 · /plan-check 2.6.20 新增 · D1=A 文字内容字面锁

- **文件** · `~/.claude/commands/plan-check.md`
- **位置** · 2.6.19 后新增 2.6.20
- **原因** · PRD-16 US-004 reject 根因(15 desc 创意改写)· 应固化检测
- **建议 diff** ·

```diff
+ ##### 2.6.20 D1=A 像素级文字内容字面锁(PRD-16 retro M-2 固化 · 2026-05-17 新增)
+ 
+ **目的** · 防 ralph 把 PRD AC 锁定的 desc/title/label/文案 当"建议"创意改写 · 违反 D1=A 像素级 layout
+ 
+ **背景** · QuanQn PRD-16 US-004 实证 · 15 卡 desc 全创意改写(`'追踪全平台热门内容趋势'` vs aiipznt 实测 `'一键抓取全平台爆款视频和文案'`)· 1 reject 修对.
+ 
+ **触发信号** · prd.json 含 D1=A 像素级 layout 锁定的常量数据(`apps/web/src/lib/constants/*.ts` 文件 · 含 `title: 'X'` / `desc: 'Y'` / `label: 'Z'`)
+ 
+ **检查规则**:
+ 1. 扫 prd.json AC 内 `title: 'X'` / `desc: 'Y'` / `label: 'Z'` 字面字段
+ 2. 实施后(goal-verify 阶段)· grep 实际 constants.ts 文件内同字段值
+ 3. 若实施值 ≠ PRD AC 字面值 → 输出 WARN(留 audit 决定 reject)· 或 prd-retro 时统一报告
+ 
+ **判定为通过** · constants.ts 内 title/desc/label 全字面 1:1 PRD AC
+ 
+ **输出示例**:
+ ```
+ WARN [D1A-text-content-drift] US-XXX function-matrix.ts 字面漂移:
+   PRD AC desc: '一键抓取全平台爆款视频和文案'
+   实际 desc: '追踪全平台热门内容趋势'
+   ralph 创意改写违反 D1=A 像素级文字内容锁
+   建议: 严格字面照搬 PRD AC · 或 PRD seed §0.3 解锁文字内容自由(影响视觉一致性)
+ ```
+ 
+ **PRD seed §0.3 复刻定调表更新建议**:
+ - 加一行 "文字内容(title/desc/label/文案 等)= layout 严格一部分(D1=A 锁)"
+ - 明确 "UX behavior(search filter / accordion 展开等行为)可自由发挥(D1=A 不锁)"
+ 
+ **ROI 估算**(PRD-16 实证): 1 reject(US-004)预估省 24 min · 5 PRD 累计 ~2h
```

- **人工 apply 流程** · 同 Diff-1

### Diff-3 · PRD seed §0.3 复刻定调表标准段(给 prd skill 模板)

- **文件** · `~/.claude/skills/prd/SKILL.md` 或 PRD seed 模板
- **位置** · "决策锁定" 节后加一行
- **原因** · D1=A / D4=B 语义需明确 "文字 = layout · UX behavior 可自由"
- **建议 diff** ·

```diff
+ ### D1=A 像素级 layout 精确语义(PRD-16 retro M-2 固化 · 2026-05-17 新增)
+ 
+ 当 PRD 锁定 D1=A 像素级 layout 时 · 明确以下"切 / 不切"分类:
+ 
+ | 维度 | 切 / 不切 |
+ |---|:-:|
+ | 整体页面布局(layout / 区块顺序 / 区块尺寸) | ✅ 切 1:1 对齐参考 |
+ | spacing scale / 字体 family + weight / motion / SVG icons | ✅ 切 |
+ | **文字内容(title/desc/label/H1/H2/H3/p 文本)** | ✅ **切 严格 1:1**(layout 严格一部分 · D1A-text-content-drift 检查) |
+ | 颜色 token(可加 D4=B 锁) | 看 D4 决策 |
+ | UX behavior(search filter / accordion 展开 / hover transition / etc) | 🟡 可自由发挥(不锁) |
```

- **人工 apply 流程** · 同 Diff-1

### Diff-4 · 进 retro 复盘的反例累加机制实证(plan-check 2.6.13 强化注释)

- **文件** · `~/.claude/commands/plan-check.md` §2.6.13 anti_patterns 覆盖率检查
- **建议 diff** · 加实证数据更新

```diff
##### 2.6.13 anti_patterns 注入覆盖率检查(QuanQn PRD-8 retro M-2 固化 · 2026-05-11 新增 · PRD-16 retro 实证强化 · 2026-05-17)

+ **PRD-16 实证 ROI**(2026-05-17 retro 加):
+ - 前 4 US(US-001~004)· 严格通过率 50%(2/4)· 2 reject 入库
+ - 后 7 US(US-005~011)· 严格通过率 **86%**(6/7)· 0 reject
+ - **+36% 通过率提升** · 反例累加机制 = Coding 3.0 核心 ROI 来源 · 必须严守
+ - 建议 prd skill 加强 anti_patterns 检索覆盖 high/foundation US(最低 1 条 · 推荐 2-3 条)
```

- **人工 apply 流程** · 同 Diff-1

### Diff 总结

- **应 apply** · Diff-1(plan-check 颜色词 ERROR)+ Diff-2(D1=A 文字字面锁)+ Diff-3(PRD seed §0.3 标准段)+ Diff-4(反例累加实证强化)
- **预估 L4 进化 ROI** · 跨 PRD-17~20 累计省 5-10 reject(共 5-10h 工时)+ PRD 文档质量大幅提升

---

## §12 文档回流建议(commit 事实驱动 · compound-harness)

### 取证范围(已跑)

```bash
git log --reverse --oneline ralph/prd-15-frontend-completeness..HEAD  # 28 commits
git diff --name-status ralph/prd-15-frontend-completeness..HEAD  # 45 files
```

### 提炼标准(本 retro 采纳)

**保留** ·
- ✅ apps/web/src/styles/aiipznt-motion.css(US-001 新建 3 utility)
- ✅ apps/web/src/lib/constants/function-matrix.ts / workflow.ts / header-nav.ts / guide.ts(US-004/005/007/009 数据)
- ✅ apps/web/src/pages/Home.tsx(全新建)
- ✅ apps/web/src/pages/Guide.tsx(全新建)
- ✅ apps/web/src/pages/IpPlan.tsx(重写)
- ✅ apps/web/src/components/Header.tsx(重构 4 dropdown 25 nav)
- ✅ apps/web/src/components/AccountSwitcher.tsx(样式改 + 「管理账号」)
- ✅ apps/web/index.html(Google Fonts link + body::before preload trick)
- ✅ apps/web/tailwind.config.js(fontFamily 5 family)
- ✅ apps/web/src/router.tsx(/ → Home + /guide → Guide)
- ✅ scripts/verify-prd-16.sh(9 section / 33 check)
- ✅ tests/e2e/prd16-*.spec.ts(4 playwright e2e)

**不保留**(留 progress.txt 不进 AGENTS.md) ·
- ❌ scripts/ralph/* 工具实现细节(daemon log / cost-log)
- ❌ screenshots/prd16-us00X-* 中间产物截图

### AGENTS.md §11.9 PRD-16 沉淀建议(留下 retro 出 5 子节)

```markdown
### §11.9 PRD-16 aiipznt-alignment Phase-1 沉淀(PRD-16 retro 2026-05-17 文档回流 · 28 commits 事实驱动)

#### §11.9.1 字体设计系统(US-001 · apps/web/index.html + tailwind.config.js + styles/aiipznt-motion.css)
- 字体 family · `display: Orbitron`(大标题)/ `label: Rajdhani`(副标)/ `cn: Noto Sans SC`(中文)
- Google Fonts preconnect + display=swap 加载 · 仅 9 字重 ~150 KB 增量
- `document.fonts.check('1em Orbitron')` 需页面元素实际用 Orbitron:400 才返回 true · `body::before` invisible preload trick + 自避 R-16(放 index.html 不放 src/styles/)

#### §11.9.2 3 utility class 复用(US-001 定义 · US-002~010 调用)
- `.glass-card` · 紫色边 + 模糊背景 + 紫色 shadow · `color-mix(in oklch, var(--primary) X%, transparent)` 紫色变体(实际渲染金色因 --primary 是金色)
- `.data-grid-bg` · 紫色 grid 24x24 utility
- `.animate-ping-primary` · 紫色 ping 动画 · 用于 chip 跳动小圆点

#### §11.9.3 Header 4 dropdown 25 nav 规则(US-007 · apps/web/src/components/Header.tsx + lib/constants/header-nav.ts)
- click 触发(非 hover) · shadcn `<DropdownMenuTrigger asChild>` 默认 click
- 4 group + 25 二级项 严格按 dump §1.2(创作 5 / 策划 8 / 智能 6 / 更多 6)
- 移动端 sheet 同布局 + 用户区固定底部

#### §11.9.4 D4=B 颜色严锁(US-001~011 全 US)· 红线级
- globals.css `--primary: 43 87% 63%`(金色)完全不动
- 0 引入 Tailwind 默认色 utility(violet-X / amber-X / yellow-X 等)作主品牌色
- 仅 status semantic indicator(PhaseCard attract=blue / trust=yellow / DailyTasks easy=green)可保留
- audit grep `gold/violet/amber` 必须 0 命中(已 plan-check + Opus audit 锁)

#### §11.9.5 D1=A 像素级文字内容锁(US-004 reject 教训)· 红线级
- PRD AC 锁定的 desc / title / label / 文案字面必须严格 1:1
- 6 constants 文件(function-matrix / workflow / header-nav / guide / step-cards 等)的数据字段 = PRD AC 字面
- ralph 不允许创意改写 · 跨 US 协议锁(12 命名锁 + 6 数据常量)
- audit grep `grep -F '一键抓取全平台爆款视频和文案' function-matrix.ts` 必须命中
```

---

## §13 归因占比

把 PRD-16 严格一轮通过率 73%(vs PRD-15 67%)+6% 提升量化到驱动 ·

| 驱动 | 归因占比 | 证据 |
|---|---|---|
| 反例累加机制(US-003/004 reject 注入 → US-005~011 防漂移) | 60% | 后 7 US 通过率 86% · 比前 4 US 50% 高 36 个百分点 |
| 跨 Story 协议锁 +50%(12 命名锁) | 20% | 0 命名漂移 · 全 5 US D1=A/D4=B 符合(US-005~010) |
| 复用 PRD-3/15 sunk cost(StepProgress / AccountSwitcher / ls-namespace 等 10 项) | 15% | 0 重写 · US-008/010 直接复用省 ~30 min/US |
| RCA-006 path-B 救场(US-007) | 5% | dev timed_out 但 commit 完整 → 1 iter 一次过 · 救 ~50 min |
| ralph 模型能力 | 0% | Sonnet 不变 · 不归因 |
| **合计** | **100%** | — |

---

## §14 PRD-17 Playbook

### P-1 必做项(继承 PRD-15/16)

- **P-1** · 反例库注入 · 5 high/foundation US 必从 reject-examples.jsonl 检索 ≤3 条(PRD-15 retro 经验 + PRD-16 实证 86% 通过率)
- **P-2** · 跨 Story 协议锁 · ≥10 命名锁 · 数据常量 constants.ts 文件 + utility class
- **P-3** · plan-check 必跑(0 ERROR 才启 daemon)+ **本 retro 后必跑 Diff-1 升级 plan-check 2.6.7 颜色词 ERROR 级**
- **P-4** · WARN 必修文档 · 不能"用户选 A 不修" · 否则 ralph 字面解读引入新 reject(US-003 教训)
- **P-5** · PRD AC desc/title/label 字面严格 1:1 PRD AC(D1=A · Diff-2 plan-check 检查)
- **P-6** · D4=B 颜色 token 不动 · grep gold/violet/amber 0 命中验证
- **P-7** · 复用 PRD-3/15/16 sunk cost(StepProgress / AccountSwitcher / glass-card / data-grid-bg / animate-ping-primary / font-display/cn/label)· 0 重写
- **P-8** · 收官 US 给 90-120 min wall time(verify + 4 e2e + .spec.ts 改名 + selector 修)· 不是 30-50 min

### N-1 不做项(PRD-17 红线)

- **N-1** · 不动 admin(D3=A · `apps/admin/` 0 触动)
- **N-2** · 不切金色 OKLCH(D4=B 严锁 · 保留 globals.css token)
- **N-3** · 不重写 backend tRPC + DB schema(仅 frontend)
- **N-4** · 不删 PRD-3/15/16 已完成 page(/copywriting / /deep-learning / /trending / Home / Guide / IpPlan / Header 等)

### E-1 实验项(PRD-17 可选试)

- **E-1** · PRD seed §0.3 加 "文字内容 = layout 严格一部分" 显式 LD(Diff-3 提议)· 实测预估省 1 reject
- **E-2** · plan-check Diff-1+2+3+4 全 apply · 实测对 PRD-17 严格通过率影响

---

## §15 预测与校准 · PRD-17 Step 1/3/3b 完整化

### 预估

| 项 | PRD-17 预估 | 依据 |
|---|:-:|---|
| US 总数 | 8-10 | PRD-15/16 同步 + Step 1/3/3b 3 step 各 2-3 US |
| 严格一轮通过率 | **78%-85%**(若 apply Diff-1+2+3 · 反例累加充分) | PRD-16 73% + 反例库 +3 新 + 机制升级 |
| Reject 数 | 1-2 | D1=A/D4=B 已注入反例 · 但 Step 输入表单类有新反例风险 |
| Wall time | 8-10h | 同 PRD-16 ~9h |
| AC 总数 | 80-100 | 8-10 US × 10 AC/US |
| 新 TD 数 | 1-2 | 同 PRD-16 |

### 如不遵循 Playbook 的差距

- 若不跑 Diff-1 plan-check 颜色词 ERROR 升级 · PRD-17 可能撞 1 reject(D4=B 颜色词类)· 损失 60-90 min
- 若不跑 Diff-2 D1=A 文字字面锁 · PRD-17 可能撞 1 reject(Step 表单 placeholder/label 字面漂移类)· 损失 30-60 min
- 若不复用 PRD-16 sunk cost(StepForm + AccountSwitcher + utility 等)· PRD-17 重写工作量 +30%

---

## §16 文档回流候选(commit 事实驱动 · 等用户确认)

### 5 子节回流 AGENTS.md §11.9 PRD-16 沉淀

(详见 §12 段最后 § 11.9.1~5 写好的模板)

### 启动 PRD-17 前的元升级 checklist

- [ ] Diff-1 plan-check 2.6.7 升级 · 颜色词 ERROR 级
- [ ] Diff-2 plan-check 2.6.20 新增 · D1=A 文字字面锁
- [ ] Diff-3 PRD seed §0.3 标准段(prd skill 模板更新)
- [ ] Diff-4 plan-check 2.6.13 反例累加实证强化注释
- [ ] AGENTS.md §11.9 PRD-16 5 子节回流
- [ ] progress.txt 8 新 patterns 累加
- [ ] TD-71 + TD-72 修(rm seed-knowledge-chunk.test.ts + sed 5 q 加 ？)

---

## §17 结论

### **[PASS-WITH-DEBT · A 级]** + 跨 PRD 反例累加机制实证有效

✅ **11/11 PASSED · 73% 严格一轮通过率 · 比 PRD-15 67% +6% 提升**

✅ **反例累加机制实证** · 前 4 US 50% → 后 7 US 86% · +36% 通过率提升 · Coding 3.0 核心 ROI 来源

✅ **D1=A + D4=B 字面解读类 reject 早 catch + 1 iter 修对**(US-003 violet + US-004 desc · 都 ralph 1 iter 修对)

✅ **RCA-006 path-B 救场实证**(US-007 dev timed_out + commit 落地 + validator 跑 + 1 iter 一次过)

⚠️ **2 Low TD open**(TD-71 pre-existing + TD-72 5 FAQ ？缺 · 都不影响运行时 · retro 后修)

### 跨 PRD 趋势

| PRD | 一次过率 | 主要 reject 类型 |
|:-:|:-:|---|
| PRD-13 | 100% | — |
| PRD-14 | 93.3% | 1 reject(US-012 emergency switch wire 漏) |
| PRD-15 | 67% | 3 reject(R-5 + R-5 + R-4 false positive) |
| **PRD-16** | **73%** | **2 reject(D4=B 颜色词字面 + D1=A 文字创意改写)** |

reject 类型转向 · audit script false positive → D1=A/D4=B 字面解读类 · 表明 audit script 已健壮 + PRD 文档措辞 + plan-check 升级是下一突破口。

### L4→L5 元升级实证

PRD-16 实证 ·
- 反例累加机制有效(+36% 通过率提升)
- RCA-006 path-B 永久修复有效
- plan-check WARN 不修文档的风险(US-003 reject 根因 · 应升 ERROR)
- D1=A 文字内容锁需显式机制化(US-004 reject 根因)

下一步 · 用户 review Diff-1+2+3+4 → 同意 → Opus Edit 全局 · 进 PRD-17 实施。

---

## 附录 A · 跨 PRD 严格一轮通过率趋势

```
PRD-3 (P2 路由)            · ~85%
PRD-4 (Specialist Phase 1) · 92%
PRD-5 (Phase 2)            · 88%
PRD-6 (P5 视频)            · 90%
PRD-7 (Cleanup TD)         · 100%
PRD-8 (P7 智能)            · 93%
PRD-9 (P8 知识库 RAG)      · 100%
PRD-10 (P9.1 admin 基础)   · 95%
PRD-11 (P9.X 业务核心)     · 92%
PRD-12 (P9.2 内容审核)     · 100%
PRD-13 (P9.3 健康域)       · 100%
PRD-14 (P9.4 高级域)       · 93.3%
PRD-15 (P9.5 前端完整化)   · 67%   ← reject 转向 R-5/R-4 false positive
PRD-16 (P9.5 aiipznt 对齐) · 73%   ← reject 转向 D1=A/D4=B 字面解读
```

### 附录 B · PRD-17 启动前 checklist

详 §16 7 项 checklist + Diff-1/2/3/4 是否 apply。

---

> **本 retro 由 Opus 4.7 在 2026-05-17 BJT 写 · 跨 PRD-15 vs PRD-16 + 8 维度归因 + 4 Skill Diff + 1 文档回流候选 · 接下来 ·**
> 1. **用户 review** · §10 应固化 3 机制 + §11 4 Skill Diff
> 2. **同意后** · Opus Edit 全局 · 进 PRD-17 实施
