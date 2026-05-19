# PRD-17 Goal-backward 验证报告

> **日期** · 2026-05-17
> **branch** · `ralph/prd-17-step1-3-3b`
> **commits** · 12 个(11 feat + 1 chore retry log · cebdcc2..3df8e6e)
> **范围** · Step 1 行业选择 + Step 3 账号包装方案 + Step 3b 人设定制方案 三 page 完整化 + 三态组件 + E2E 收官

---

## §0 代码事实层同步

### §0.1 子项目结构检测

| 子项目 | package.json | 本 PRD 是否触动 | GSD 事实层状态 |
|---|:-:|:-:|:-:|
| apps/web | ✅ | ✅ **主要触动** (29 files) | ⚠️ 缺(本次跳过 GSD 跑 · 见 §0.2 决策) |
| apps/api | ✅ | ❌ 0 touch (D3=A) | ✅ PRD-16 已跑(`.planning/codebase/apps-api/`) |
| apps/admin | ✅ | ❌ 0 touch (D3=A) | ✅ PRD-16 已跑(`.planning/codebase/apps-admin/`) |
| packages/clients | ✅ | ❌ 0 touch | N/A |
| packages/schemas | ✅ | ❌ 0 touch | N/A |
| packages/ui | ✅ | ❌ 0 touch | N/A |
| 根 monorepo | ✅ | ❌ 0 touch | N/A |

**D3=A 验证** · `git diff cebdcc2..HEAD --stat apps/admin/ apps/api/ packages/` = **空输出** · ✅ admin/api/packages 0 触动严守。

### §0.2 本次 GSD 跑策略 · 跳过 + 充分 audit 兜底

**决策** · 跳过 `/gsd-map-codebase apps/web` · 原因:
1. 本 PRD audit 已逐 US 深审完所有 11 个代码改动 · 我对 apps/web 当前状态完全掌握
2. PRD-17 仅动 apps/web/src/ 子目录(constants/states/step3/step3b/pages/step) · 不涉及 apps/web 整体架构变更
3. /gsd-map-codebase 是 sub-agent · 占 ~5-10K context · 当前 context 紧张 · ROI 不匹配
4. PRD-16 已为 apps-admin / apps-api 跑过 GSD · 跟本 PRD 0 重叠 · 可复用

**质量保障兜底** · §0.4 对账继续严格执行 · 用 audit log + git diff + grep 替代 GSD 7 文件输出。

### §0.3 多子项目汇总 · 跳过

无需汇总(本 PRD 单子项目 apps/web 改动)。

### §0.4 AGENTS.md 设计约束 vs 代码事实对账

| 对账项 | AGENTS.md 写的 | 代码事实 | 状态 |
|---|---|---|:-:|
| **D3=A · 仅主应用 apps/web** | §11.9 + 全局红线 | git diff apps/admin/api/packages 全空 | ✅ |
| **D4=B · 颜色保留 `--primary: 43 87% 63%` 金色** | §11.9.4 PRD-16 沉淀 | grep `from-violet/amber/gold/purple` = 0 (跨 11 US) | ✅ |
| **D1=A · 文字内容 = layout 严格一部分** | §11.9.5 PRD-16 沉淀 | 字面 grep 100% hit · 1 reject (US-007 SUBTITLE) 1 iter 修对 | ✅ |
| **R-5 LD-009 · localStorage `acc_` 前缀** | §1.4 项目级 + PRD-15 retro M-1 | acc_step1/acc_step3/acc_step3b 严守 | ✅ |
| **字体设计系统 font-display/cn/label** | §11.9.1 PRD-16 沉淀 | 11 US 全用 className 复用(Step1/3/3b page) | ✅ |
| **glass-card / data-grid-bg / animate-ping-primary** | §11.9.2 PRD-16 沉淀 | Step1/3/3b page + states 组件复用 glass-card | ✅ |
| **不引 react-hook-form / zod 库** | (隐式 · 简单 useState) | useState + 原生 required + JSX `*` 视觉 | ✅ |
| **shadcn DropdownMenu / Dialog asChild click 触发** | PRD-16 US-007 反例延续 | US-004 `<DialogTrigger asChild>` 严守 | ✅ |
| **TypeScript readonly + as const 双锁** | (隐式 · constants 模式) | industries.ts / step3.ts / step3b.ts 严守 | ✅ |

**对账结论** · ✅ **0 偏差** · 设计约束与代码事实完全一致 · 无 design-drift 类 TD。

**输出小结** ·
```
代码事实层同步完成:
  - 子项目数: 7 (1 触动 · 6 锁定 0 触动)
  - .planning/codebase/ 状态: apps/web 缺(本次跳 · 见 §0.2)· apps/admin/api 复用 PRD-16
  - AGENTS.md 对账: 9/9 PASS · 0 偏差
  - 严重偏差(High): 0 · 不阻塞 §1+
```

---

## §1 Goal-backward 验证

### §1.1 总览

| 指标 | 数据 |
|---|:-:|
| **PRD 需求总数** | 11 US + 25 FR + 15 LD + 6 Non-Goals = 57 |
| **已覆盖且通过** | 11 US · 25 FR · 15 LD · 6 Non-Goals = **57** |
| **已覆盖但 blocked** | 0 |
| **未覆盖(MISSING)** | 0 |
| **意图偏差(DRIFT)** | 0 |
| **决策违反(VIOLATION)** | 0 |
| **覆盖率** | **57/57 = 100%** |

### §1.2 11 US 状态(全 PASS)

| US | risk | size | 状态 | TD | 备注 |
|:-:|:-:|:-:|:-:|---|---|
| US-001 industries.ts 56 行业 | foundation | medium | ✅ | TD-73 resolved | 2 偏差(category 中文 + emoji '🌐')· US-002 自然解 |
| US-005 step3.ts 常量 | foundation | medium | ✅ | 0 | 0 偏差 · 反例累加机制兑现 |
| US-007 step3b.ts 常量 | foundation | medium | ✅ | 0 | **1 reject** (SUBTITLE 字面) · 1 iter 修对 |
| US-009 三态组件 | foundation | medium | ✅ | 0 | 跨 step 复用基石 |
| US-002 Step1 page Tab+grid | medium | medium | ✅ | 0 | TD-73 妙手 resolved (`category === activeTab.label`) |
| US-003 Step1 状态卡+CTA | medium | small | ✅ | 0 | LD-009 acc_step1 严守 |
| US-004 Step1 自定义 Dialog | medium | small | ✅ | 0 | PRD-16 US-007 反例延续生效(asChild click) |
| US-006a Step3 form | high | medium-large | ✅ | TD-74 resolved | mockResult string → US-006b structured 自然解 |
| US-006b Step3 6 H3 输出 | high | medium-large | ✅ | 0 | **1 retry** (Validator socket 断 · daemon 自动 retry) |
| US-008 Step3b 完整 | high | medium-large | ✅ | TD-75 open | hardcode '复制' 偏离统一模式 |
| US-010 E2E 收官 | medium | medium | ✅ | 0 | 12/12 verify-prd-17.sh PASS · 3 截图齐全 |

### §1.3 25 FR 覆盖验证(100%)

| FR 范围 | US 实施 | 状态 |
|---|---|:-:|
| FR-1~8 (Step1 industries + 6 tab + 56 grid + 搜索 + 状态卡 + CTA + 自定义 modal + var(--primary) gradient) | US-001/002/003/004 | ✅ |
| FR-9~14 (Step3 step3.ts + 5 platform + 6 H3 + 三按钮 + 顶部 2 按钮) | US-005/006a/006b | ✅ |
| FR-15~19 (Step3b step3b.ts + 3 textarea + 5 H3 + 跨 step 预填) | US-007/008 | ✅ |
| FR-20 (三态组件 + Step1/3/3b 各引用 ≥1 处) | US-009 | ✅ |
| FR-21 (stepData acc_ 前缀) | US-003/006a/008 | ✅ |
| FR-22 (D4=B 颜色严锁) | 全 11 US · grep 0 violet/amber/gold | ✅ |
| FR-23~25 (E2E + verify-prd-17.sh + 零回归) | US-010 | ✅ |

### §1.4 15 Locked Decisions 落实验证(全 PASS)

| LD | 内容 | 实测 | 状态 |
|:-:|---|---|:-:|
| D-146 | 56 行业 5 大类(18+13+7+14+4)严锁 | industries.ts category count 精确 | ✅ |
| D-147 | 6 tab 顺序固定(全部/生活服务/电商零售/内容创作/专业服务/产业制造) | STEP1_TABS 严格 | ✅ |
| D-148 | Step3 form 4 字段(1 textarea + 5 radio + 2 input) | STEP3_FORM + STEP3_PLATFORMS_5 严格 | ✅ |
| D-149 | Step3 6 H3 不是 7(H1 不进 H3 数组) | STEP3_OUTPUT_H3_6.length === 6 | ✅ |
| D-150 | Step3b form 5 字段(3 textarea + 1 radio + 1 input) | STEP3B_TEXTAREAS_3 + STEP3_PLATFORMS_5 复用 | ✅ |
| D-151 | Step3b 5 H3 不是 6 | STEP3B_OUTPUT_H3_5.length === 5 | ✅ |
| D-152 | 三态组件单独 US-009 foundation · 跨 step 复用 | LoadingState/ErrorState/EmptyState + Step1/3/3b 各 1 处 | ✅ |
| D-153 | E2E US-010 + agent-browser + 3 截图 + 0 console error | playwright spec + screenshots/*.png + consoleErrors 硬门禁 | ✅ |
| D-154 | LD 继承 PRD-16 D-130~D-145 全部红线 | 字体 + utility + Header + D4=B 全延续 | ✅ |
| D-155 | 5 大类内行业数严锁 | grep category count 精确 | ✅ |
| D-156 | Step3/3b 输出 H3 文字 1:1(防 US-004 类创意改写) | US-007 reject 教训 · 1 iter 修对 | ✅ |
| D-157 | 5 platform 含 emoji 字面(📱 抖音 等) | STEP3_PLATFORMS_5.label emoji prefix 严守 | ✅ |
| D-158 | 主 CTA var(--primary) gradient · 0 紫色/金色 措辞 | grep 0 violet/amber/gold + PRD 文档无颜色措辞 | ✅ |
| D-159 | 头像/背景图 [生成参考图] + 顶部 [一键重新生成]/[复制全部] | US-006b Step3 输出区严守 | ✅ |
| D-160 | 不实现 backend AI 生成 API(纯前端 mock) | mockResult structured object + 1.5s setTimeout 模拟 | ✅ |

### §1.5 6 Non-Goals 验证(全严守)

| N | 内容 | 实测 | 状态 |
|:-:|---|---|:-:|
| N-1 | 不实现 backend tRPC AI 生成 API | mockResult + setTimeout · 0 trpc.mutation | ✅ |
| N-2 | 不实现 [生成参考图] 真实图像生成 | button placeholder · onClick 未实现 | ✅ |
| N-3 | 不实现 Step 2/4/4b/5/6/7/8 page | git diff Step{2,4,4b,5,6,7,8}.tsx 空 | ✅ |
| N-4 | 不实现 8 stub 工具完整化 | git diff apps/web/src/pages/tools/ 空 | ✅ |
| N-5 | 不动 apps/admin/ | git diff apps/admin/ 空 | ✅ |
| N-6 | 不切 QuanAn `--primary` 金色 | globals.css HSL(43, 87%, 63%) 不变 + 0 violet/amber/gold | ✅ |

### §1.6 已满足的需求清单(精选)

- ✅ Step 1 行业选择完整流程 · 6 tab + 56 行业 emoji 双行卡 + 搜索 + 已选卡 + 自定义 modal + CTA 跳转
- ✅ Step 3 账号包装方案完整流程 · form (1 textarea + 5 radio + 2 input) + 主 CTA + 6 H3 输出区 + 每 H3 三按钮 + 头像/背景图 [生成参考图] + 顶部 [一键重新生成]/[复制全部]
- ✅ Step 3b 人设定制方案完整流程 · form (3 textarea + 5 radio + 1 input) + 主 CTA + 5 H3 输出区 + 三按钮(无 [生成参考图]) + personalInfo 跨 step 自动预填
- ✅ 三态组件跨 step 复用规范 · LoadingState/ErrorState/EmptyState + Step1/3/3b 各 ≥1 处使用
- ✅ E2E 集成验收 · playwright spec + 3 截图 (step1/3/3b) + verify-prd-17.sh 12 项检查 + zero-regression 70/70 PASS

### §1.7 被阻断的需求 · 0 个

### §1.8 未覆盖的需求 · 0 个

### §1.9 意图偏差 · 0 个

### §1.10 决策违反 · 0 个

---

## §2 Tech Debt Register(PRD-17 净 +1)

### §2.1 PRD-17 新增 TD(3 条)

| TD | severity | 状态 | 内容 |
|:-:|:-:|:-:|---|
| TD-73 | Medium | ✅ resolved | STEP1_TABS.id (英文) vs Industry.category (中文) 跨字段类型不一致 · US-002 ralph 妙手用 `category === activeTab.label` 中文匹配解决 |
| TD-74 | Low | ✅ resolved | US-006a mockResult 简化为 string · US-006b 在 Step3OutputContent 定义 structured Step3Result interface 自然解决 |
| TD-75 | Low | 🟡 open | US-008 Step3b.tsx hardcode '复制'/'重新生成' + STEP3B_STEP_TAG_LITERAL · 跟 US-006b 用常量模式不一致 |

### §2.2 PRD-17 净 TD 变化

- **新增** · 3 (TD-73/74/75)
- **resolved** · 2 (TD-73 + TD-74)
- **净增长** · **+1** (TD-75 open)
- 跟 PRD-16 持平(+2 后修 1)· 反映 ralph 自检主动度持续

### §2.3 TD-75 建议修复时机

- **fix_by** · PRD-18 启动前 maintenance commit 统一(同 PRD-17 收尾时一并修)· 或 PRD-18 Step{2,4,4b...} page 实施时一并修
- **fix_hint** · step3b.ts 新建 STEP3B_BUTTON_COPY/REGENERATE export · 或 Step3b.tsx import STEP3_BUTTON_COPY/REGENERATE from step3.ts 复用 · 同时删 STEP3B_*_LITERAL 改用 STEP3B_STEP_TAG/STEP3B_H1

### §2.4 跨 PRD 累积 TD 状态

- 总 items · 74(PRD-1 至 PRD-17 累计)
- Open · 27(本次 +1)
- Resolved · 47(本次 +2)
- High severity open · 0(无新 critical TD)

---

## §3 新 Codebase Patterns(待回传 progress.txt)

```
## Codebase Patterns - PRD-17 贡献(goal-verify 于 2026-05-17 提炼)

- **字面常量集中文件模式** · apps/web/src/lib/constants/{industries,step3,step3b}.ts 模式 · readonly Type[] + as const 双锁 + 字面 1:1 来源 spec + __tests__/*.test.ts 数字锁 · 下游 PRD-18/19 各 step page 复用模板
- **三态组件复用规范** · apps/web/src/components/states/{LoadingState,ErrorState,EmptyState}.tsx + index.ts barrel · 跨 PRD 跨 step 复用基石 · PRD-18/19 严禁重造轮子
- **structured mockResult 模式** · Step3OutputContent + Step3bOutputContent 定义 Step3Result/Step3bResult interface(嵌套 object/array)+ generateMockResult() function 返回真实示例数据(皮肤管理师 100+ 字)· 后续 step page mockResult 必走 structured 不允许 string
- **跨 step 数据传递链** · acc_step1.industryLabel → Step3/3b 副标 {industry} 替换 · acc_step3.input.personalInfo → Step3b 自动预填 · 全 localStorage `acc_` 前缀(继承 PRD-15 ls-namespace)
- **D1=A 字面锁完整链路** · spec §7.x 实测 → tasks/prd-N.md AC-1 完整代码块 → constants/*.ts 字段字面 → page 渲染 · 4 层链路保证 · plan-check §2.6.20 + Opus audit grep 双重验证 · US-007 SUBTITLE reject 教训巩固
- **D4=B 颜色严锁** · 主 CTA 全用 `bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70` · 0 from-violet/amber/gold · plan-check §2.6.7-ext 颜色词 ERROR 级阻断 · 11/11 US grep 0 命中
- **DialogTrigger asChild click 触发延续** · 继承 PRD-16 US-007 反例 · US-004 严守 + reject-examples.jsonl 入库 · 所有 shadcn Dialog/DropdownMenu 必带 asChild
- **跨字段类型不一致 ralph 妙手 fix 模式** · TD-73 STEP1_TABS.id 英文 vs Industry.category 中文不一致 · US-002 ralph 用 `category === activeTab.label`(中文 vs 中文)bypass mapping · 留 forward-looking pattern · PRD-18 类似跨字段问题可学
- **反例累加机制持续验证** · PRD-15→16 +23% · PRD-16→17 +8% · L4 升级 (plan-check §2.6.7-ext / §2.6.20 / §2.6.13) + 反例库 47→48 条 · 跨 PRD 持续兑现
```

---

## §4 RCA / 关键事件

### §4.1 US-007 reject (SUBTITLE 字面)

- **现象** · STEP3B_SUBTITLE_TEMPLATE 字面被 ralph 创意改写为不同表述 · 违反 D1=A 字面锁
- **根因** · ralph 漏看 PRD AC-1 完整代码块 line 784 字面锁定 subtitle
- **修复** · REJECT-TEMPLATE 4 元素(Blocker + 当前/目标代码 + 5 反例 + 4 验证)· 1 iter 修对
- **教训** · D1=A 字面锁不只锁 H3/label · 副标 + 长文本同样锁 · 已入 reject-examples.jsonl 第 48 条

### §4.2 US-006b retry (Validator socket 断 · 60 min 浪费)

- **现象** · ralph 已 commit 6ec676b · Validator 10 min timeout · daemon 自动 retry · 60 min 后才闭环
- **根因** · prompt 12.2K 超 §9.6.3 红区 + anthropic API gateway 不稳
- **缓解** · §9.6.4 SOP 第 0 步生效(我先 check 已 commit · 没 kill daemon · 让自然 retry)· 但浪费时间
- **forward-looking** · 后续 large UI story 考虑 §9.6 拆分 · 但 PRD-17 已收官 · PRD-18 学

---

## §5 结论

🎯 **[PASS-WITH-DEBT] PRD-17 收官 · 11/11 ALL PASSED · 57/57 100% 覆盖率 · 1 Low TD 留 PRD-18 修**

| 维度 | 评分 |
|---|:-:|
| 功能完整度 | 100% (11/11 PASS · 57/57 需求覆盖) |
| 严格质量 | 81% 严格一轮通过率(9/11 · 对标 PRD-16 73% +8%) |
| 设计一致性 | 100% AGENTS.md 对账 · 0 design-drift |
| 安全/红线 | 100% (D1=A + D3=A + D4=B + R-5 LD-009 全严守) |
| 文档同步 | progress.txt + tech-debt.json + verify-prd-17.sh 齐全 |
| 上线就绪 | ✅ 可直接进 PRD-18 · TD-75 (Low) 不阻断 |

**评级 · A**(PRD-15: A · PRD-16: A · 持续 A 级稳定)

---

## §6 后续行动

### §6.1 立即可做(本会话)
- ✅ progress.txt 已追加(15 个 audit log + 1 收官 log)
- ✅ tech-debt.json 已更新(TD-73 resolved · TD-74 resolved · TD-75 open)
- ⏭️ git commit 当前 audit + TD 变更 + goal-verify 报告(用户确认)
- ⏭️ Step 8 /prd-retro(跨 PRD 复盘 + 8 patterns 回传 + Skill 升级 diff)

### §6.2 PRD-18 启动前必做
- TD-75 修(maintenance commit · 5 min)
- AGENTS.md §11.10 PRD-17 沉淀回流(prd-retro §11 文档回流建议会出 diff)
- 反例库 reject-examples.jsonl 确认有 SUBTITLE 字面 reject(自动入库 · 第 48 条)

### §6.3 长期(留 PRR / PRD-AI 专项)
- N-1/N-2 backend AI 生成 + 真实图像生成(待 PRD-AI · 14 PRD 跑完后评估)
- TD-75 同模式可能在 PRD-18 Step 2/4/4b... 复发 · 考虑 plan-check 加 §2.6.21 hardcode 中文按钮检测

---

## §7 可重复验收脚本

✅ **已产出** · `scripts/verify-prd-17.sh` (81 lines · executable · 12/12 PASS) · ralph US-010 创建。

跳过 §7 询问(已存在)。

---

**End of PRD-17 Goal-backward 验证报告**
