# PRD-27 · 1:1 复刻完成 · 3 工具 page LLM 真接入 + /deep-learning + mobile baseline 修

> **状态** · 待启动(2026-05-21 PRD-26 ship 后立即接续)
> **branch** · `ralph/prd-27-clone-completion`(待 daemon 启动时建)
> **依赖** · PRD-26 已 merge main(commit `76c1dca Merge: PRD-26 admin UI MVP polish`)
> **范围分档** · 6 US(1 high PresentationAgent 新建 · 4 medium · 1 medium 收官)
> **预期 daemon** · 12-18h · Opus audit cycle 1-2h/US × 5 dev US ≈ 12-15h wall time · ≈ 1.5-2 天
> **关键意义** · **完成 1:1 复刻 aiipznt** · 94.3% → **100%**

---

## §0 引用清单 + 元数据 + 复刻定调

### §0.1 上游文档(8 份核心)

| # | 文档 | 用途 | 重点章节 |
|:-:|---|---|---|
| 1 | [aiipznt-spec.md](../aiipznt-spec.md) | 9192 行复刻基线 · 3 工具 page 完整 schema + 14 呈现形式 + 私域 6 阶段 | §8.2.1 /monetization · §8.2.2 /private-domain · §8.1.3 + §27.5 /present-styles 14 形式 · §8.4.3 /deep-learning · §26.1 phase key · §27.7 私域 4 字段 |
| 2 | [tasks/prd-25.md](prd-25.md) | PRD-25 LLM 接入征程模板 · 10 page useMutation 替换 + DiagnosisAgent 真启用 | §3 US-001~007 接 specialist 模式 · D-242 D1=LLM-A · 反例锁 R-001 |
| 3 | [tasks/prd-26.md](prd-26.md) | PRD-26 admin polish · routers/app vs admin 对称 + L4 进化 M-X/M-Y/M-Z | §11.17 PRD-26 沉淀 · TD-100 e2e config drift |
| 4 | [.agents/retros/prd-26-vs-prd-25-retrospective.md](../.agents/retros/prd-26-vs-prd-25-retrospective.md) | PRD-26 retro · 647 lines · §9 数据校准 · §11 TD-100 跨 PRD 模式 · §13 L4 进化 3 diff(M-X/M-Y/M-Z 已 apply) | §16 PRD-27 执行预测 · §17 1:1 复刻完成度 94.3% |
| 5 | [AGENTS.md](../AGENTS.md) | 18 LD + 17 R 红线 + §11 PRD 沉淀 · §11.7 真 LLM 接入(PRD-20)+ §11.16 PRD-25 LLM 接入沉淀 · §11.17 PRD-26 admin polish 沉淀 | §11.7.1 ENV validation + LLM client init · §11.6 BaseSpecialist 模板方法 · §11.6.4 SSE Specialist 模式 · §11.17.5 e2e config drift 必加 project filter |
| 6 | [.agents/tech-debt.json](../.agents/tech-debt.json) | TD 池 99 items · TD-100 e2e config drift(PRD-26 audit_exemption) · TD-005 12 shadcn 路径漂移 · TD-049 已 closed | TD-100 修复(US-005 配套)· TD-027 evaluation 失效(留 PRD-28 evaluation 完整化) |
| 7 | `~/.claude/playbooks/reject-examples.jsonl` | 跨 PRD 反例库 · 52+ 条(seed 35 + PRD-21~26 累积) · LLM 接入相关 + admin lift 模式 | anti_patterns 注入(每 high US ≤ 3 条 · medium 2 条 · M-1 SHIELD 跨 PRD 沉淀) |
| 8 | `~/.claude/commands/plan-check.md` | §2.6.26 LLM 接入 AC 双 review(M-3 PRD-25)+ §2.6.27 e2e config drift(M-X PRD-26) | 本 PRD plan-check 必跑双重检查(LLM 后端 P1 mock + e2e admin spec project filter) |

### §0.2 元数据

| 项 | 值 |
|---|---|
| **branchName** | `ralph/prd-27-clone-completion` |
| **Locked Decisions** | D-259 起延续(PRD-26 收尾在 D-258 · 总 6 D · D-259~D-264) |
| **风险分档** | **high × 1**(US-003 PresentationAgent 新建 · BaseSpecialist 子类 · 14 presentation_style + invokeLLM 完整实施) + **medium × 4**(US-001 /monetization router 真接 · US-002 /private-domain router 真接 · US-004 /deep-learning learn mutation 新增 · US-005 mobile baseline 修 + TD-100 fix) + **medium × 1**(US-006 收官) |
| **anti_patterns 注入** | 1 high US 必须从 reject-examples.jsonl 检索 ≤ 3 条 · 关键词: `'BaseSpecialist 子类 invokeLLM'` / `'API_KEY 暴露 R-001'` / `'LLMGateway model_tier'` / `'specialist execute 模板方法'` / `'14 enum key 完整 1:1'` / `'unit test 同步'` / `'e2e config drift'`(TD-100 防再犯) |
| **依赖前置 PRD** | PRD-1~26 全部已 ship · 严格保留不动 · 重点:PRD-2 LLM Gateway · PRD-4 13 Specialist 骨架 · PRD-15 US-004/005 stub router 建立 · PRD-25 LLM 接入征程模式 · PRD-26 admin polish + L4 进化 |
| **下游 PRD** | PRD-28+ · evaluation 完整化(TD-027 解决)· 多用户压测 · 移动端 polish · 海外版 · PRR(production readiness review) |
| **失败回滚** | `git branch backup/before-prd-27 main` 待建(daemon 启动前) |
| **dev server 配套** | TD-095 已在 PRD-25 落地 · ralph.py `--daemon` 自动 fork pnpm dev · Validator e2e/browse 自动健康检查(继承) |
| **PresentationAgent 状态** | apps/api/src/specialists/PresentationAgent.ts **不存在** · PRD-27 US-003 新建 · 参 BrandingAgent 294 lines 模板 + spec §27.5 14 style enum |
| **MonetizationAgent 状态** | apps/api/src/specialists/MonetizationAgent.ts 213 lines 已建 · step4b mode 已有 · PRD-27 US-001 加 'monetization-tool' mode(简化版 · 输入 4 字段 · 输出变现模型 3 字段) |
| **PrivateDomainAgent 状态** | apps/api/src/specialists/PrivateDomainAgent.ts 82 lines 已建 · invokeLLM 1 call · PRD-27 US-002 接 router · 删除 buildPhases() 伪 LLM · 改真调 |
| **DeepLearnAgent 状态** | apps/api/src/specialists/DeepLearnAgent.ts 76 lines 已建 · invokeLLM 1 call · PRD-27 US-004 加 deepLearning.learn mutation · file upload + 拆段 |
| **TD-100 修复策略** | playwright.config.ts chromium/mobile project 加 `testIgnore: ['**/tests/e2e/admin/**', '**/tests/e2e/prd*-admin-*.spec.ts']` · 跟 §11.17.5 一致 |
| **1:1 复刻完成度** | PRD-26 后 **94.3%** · 缺 3 工具 page LLM(/monetization /private-domain /present-styles)+ /deep-learning + mobile baseline · PRD-27 收官达 **100%** |

### §0.3 复刻定调(D1=A + D4=B 严锁 · 继承 PRD-21~26 · 延续 D-242 LLM-A)

| 维度 | 切 / 不切 |
|---|:-:|
| 整体页面布局(layout / 区块顺序 / padding 方向) | ✅ **切 1:1 对齐 aiipznt**(继承 PRD-21~26) |
| spacing scale / 字体 / motion / hover effect / glass-card | ✅ 切(继承 PRD-22/23/24 utility) |
| **文字内容(title / 副标 / H1 / H2 / button)** | ✅ **严格 1:1**(D1A 字面锁 · 继承 D-220/226/237/238/239/253) |
| **常量数据 1:1**(14 呈现形式 key + label + desc + tips · 私域 6 阶段 4 字段 value/label/icon/desc) | ✅ **严格 1:1**(constants 字面锁 · spec §27.5 + §27.7 权威) |
| 颜色 token / D4=B | ❌ **D4=B 锁 · 保留当前 HSL/OKLCH token 不变**(继承) |
| **LLM 调用(D1=LLM-A · PRD-25 解锁延续)** | ✅ **接真 LLM** · 3 stub router → router 内接 specialist.execute · PresentationAgent 新建 · DeepLearnAgent 真触发 |
| **streaming(SSE)** | 🟡 **/private-domain generateStream subscription 保留**(spec §8.2.2 6 phase 独立 SSE)· /monetization /present-styles 单 mutation 即可 · /deep-learning 不 streaming(后端任务) |
| **错误处理统一**(network error + LLM timeout + isFallback) | ✅ tRPC onError → toast.error 提示重试 · isFallback=true 时显示 fallback marker(灰色 hint 告知用户) · 继承 PRD-25 模式 |
| **visual baseline 重审** | 🟡 **US-006 收官跑 prd27-vs-aiipznt-diff** · 4 新接入 page (/monetization /private-domain /present-styles /deep-learning)更新 baseline · mobile 4 page baseline 修 |

**D1=LLM-A 反例锁** · 继承 PRD-25 + 强化:
- ❌ NEVER `import OpenAI from 'openai'` in frontend
- ❌ NEVER `apiKey` in `apps/web/` · 仅 worker 层(R-001 红线)
- ✅ frontend 100% 通过 `trpc.{router}.{procedure}.useMutation()` / `useQuery()` / `useSubscription()` 调用
- ✅ backend specialist 通过 `this.llmGateway.complete()` / `.completeStream()` · 不直接 import SDK(继承 §11.7 沉淀)
- ✅ 新建 PresentationAgent 必须 extends BaseSpecialist(参 BrandingAgent.ts L145 模板)

---

## §1 介绍/概述

### §1.1 范围(scope)

PRD-27 是**1:1 复刻 aiipznt 的收官 PRD**。基于 PRD-26 retro §17 实测 · QuanAn 当前完成度 94.3% · 剩余 5.7% 主要在 3 工具 page 还是 stub mock + /deep-learning router 缺 learn mutation + mobile visual baseline 4 page fail。

**核心交付**:
1. **3 工具 page LLM 真接入**(/monetization · /private-domain · /present-styles)从 router stub 到接 specialist.execute
2. **PresentationAgent 新建**(填 13 → 14 个 specialist · spec §7 完整对齐)
3. **/deep-learning learn mutation 真触发** DeepLearnAgent
4. **mobile visual baseline 修**(4 fail + TD-100 playwright config drift)
5. **收官 verify-prd-27.sh** + /goal-verify(达 100% 1:1 复刻验证)+ /prd-retro 跨 PRD-21~27 7 PRD

### §1.2 不在范围(out of scope · D-263 字面锁)

- ❌ admin 后台改动(PRD-26 已 polish 完成 · 本 PRD 不动)
- ❌ /trending 第三方授权对接(新榜/蝉妈妈/飞瓜 · 留 PRR)
- ❌ evaluation 完整化 / LLM Judge mock 失效修复(TD-027 留 PRD-28)
- ❌ 多用户压测 / 性能 baseline(留 PRD-29)
- ❌ 移动端 Native App / 响应式 polish 全面(PRD-27 US-005 仅修 mobile baseline 4 page · 不全 polish · 全 polish 留 PRD-30)
- ❌ 海外版 / i18n(留 PRD-31)
- ❌ OAuth + Streamdown AI 流式完整化(对齐 spec §XLIII · 留 PRD-32)
- ❌ 域名 / ICP / 法务 / 部署(全留 PRR)

### §1.3 关键决策(D-259 ~ D-264 · 6 锁)

| Decision | 内容 | 反例 |
|:-:|---|---|
| **D-259** | **3 工具 router 真接 specialist 模式锁** · 删除 `[mock]` content + History row stub · 改 `await specialist.execute({mode:'<mode>', activeAccountId, traceId, input})` → 返 history row with real content + tokensUsed · `isFallback` 字段透传给前端 | ralph 字面解读 "接 LLM" 为 "import openai/anthropic SDK 直接调"(R-001 红线) · 必须 `this.llmGateway.complete()` 走 LLM Gateway 抽象层 |
| **D-260** | **PresentationAgent 新建模板锁** · `extends BaseSpecialist<PresentationInput, PresentationOutput>` · `agentId: 'PresentationAgent'` · persona/goal/system prompt 参 BrandingAgent.ts L145-200 · invokeLLM 1 call · model_tier='balanced' timeout=30s retry=1 · 输入 `{text, platform}` · 输出 `{recommendedStyles: PresentationStyle[]}` 3-5 推荐 · `PresentationStyle = {id:14key之一, label, description, tips, matchScore:0-100, rationale:string}` | ralph 误把 14 呈现形式 key 改成 EN/中英混用 · 必须严格按 spec §27.5 14 key 全 lowercase + underscore(talking_head/drama/tutorial/vlog/street_interview/comparison/list_style/mashup/screen_record/animation/reaction/before_after/pov/qa)|
| **D-261** | **私域 6 phase 字面锁** · `PRIVATE_DOMAIN_STAGES` 严守 6 value(welcome/warmup/trust/discover/close/follow · 不是 icebreak · 不是 build_trust)· 跟 spec §26.1 + §27.7 一致 · 4 字段(value/label/icon/desc) | ralph 字面误用 icebreak / buildTrust / find / sell · 必须 grep-friendly 严守 6 value |
| **D-262** | **/deep-learning learn 模式锁** · `trpc.deepLearning.learn.useMutation({input: {samples: [{text, source}]}})` · 后端 enqueue file 处理 + 拆段 + DeepLearnAgent.execute · 异步轮询 status(类似 /daily-tasks BullMQ) · file upload 暂 P1(text input 直接传 · 不 file blob · file upload infra 留 PRR) | ralph 误实现成同步 mutation · 长任务必须异步 BullMQ + status polling(继承 PRD-25 dailyTasks 模式) |
| **D-263** | **mobile baseline 修策略锁** · playwright.config.ts chromium/mobile project 加 `testIgnore: ['**/tests/e2e/admin/**', '**/tests/e2e/prd*-admin-*.spec.ts']`(选项 A · TD-100 §11.17.5 字面)· 不改各 spec 头 test.skip(选项 B · 不在本 PRD 范围) · 修后 chromium-only 跑 visual baseline 17 admin page · mobile 不跑 admin spec | ralph 误改 spec 头加 test.skip · 必须 config-level fix · 更彻底 |
| **D-264** | **PRD-27 收官达 1:1 复刻 100% 验证锁** · /goal-verify §0 跑 /gsd-map-codebase × 4(apps/web · apps/api · apps/admin · packages) · §1+ Goal-backward 对照 aiipznt-spec.md 32 page 全实现 + 全 LLM 真接 · `1:1 完成度 = 100%` 写入 verification.md · retro 跨 PRD-21~27 7 PRD 复盘 · 1:1 复刻征程完结 | ralph 误把 verify-prd-27.sh §X 只查 spec 文件存在 · 必须 grep specialist 真调用 + grep trpc useMutation · 实测 4 新接入 page 真接 LLM(不只是 spec 文件存在) |

---

## §2 目标

### §2.1 主要目标

**完成 1:1 复刻 aiipznt** · 从 94.3% → **100%** · 标志着 QuanAn 准备进入 PRR(production readiness review)阶段。

### §2.2 量化指标

| 指标 | 当前 | 目标 |
|---|:-:|:-:|
| 1:1 复刻完成度 | 94.3% | **100%** |
| 20 模块 LLM 真接入 | 15/20(75%) | **18/18 需 LLM 模块全接**(100% · 不计 my-topics/history/knowledge 3 个静态) |
| 13 Specialist 全建 | 13/14(缺 PresentationAgent) | **14/14** |
| visual baseline pass | 33/(34-4=30) mobile chromium fail | **34/34**(含 mobile 修) |
| TD 净变化 | TD-100 open | **TD-100 closed**(+ 不引入新 TD) |
| 累积成功率 | PRD-23~26 4 PRD audit 维度 100% | **PRD-23~27 5 PRD audit 维度 100%** |

### §2.3 验收锚点(Goal-Backward 验证 · /goal-verify §1+ 必查)

1. ✅ /monetization 真接 MonetizationAgent.execute 'monetization-tool' mode · LLM 真调 · isFallback 透传
2. ✅ /private-domain 真接 PrivateDomainAgent.execute · 6 phase 触发 LLM · streaming 保留
3. ✅ /present-styles 真接 PresentationAgent.execute · 14 enum 完整 · 3-5 推荐
4. ✅ /deep-learning learn mutation 真触发 DeepLearnAgent · BullMQ + status polling
5. ✅ playwright.config testIgnore 加 + TD-100 close
6. ✅ mobile visual baseline 4 page 修 PASS · admin SPA mobile 已 testIgnore
7. ✅ verify-prd-27.sh ≥ 30 checks ALL PASS
8. ✅ /goal-verify §0 + §1+ 全跑 · 1:1 完成度 100% 验证
9. ✅ /prd-retro 跨 PRD-21~27 7 PRD 复盘 + handoff PRD-28+
10. ✅ AGENTS.md §11.18 PRD-27 沉淀(1:1 复刻完成 + 14 specialist 完整 + 反例库 SHIELD 注入有效率)

---

## §3 User Stories(6)

> **总计** · 6 US · 1 high(US-003 PresentationAgent 新建)+ 4 medium dev · 1 medium 收官

### US-001 medium · /monetization router 真接 MonetizationAgent.execute(D-259 字面锁)

**As** 用户在 /monetization 工具 page · **I want** 填行业 + 产品描述 + 受众 + IP 定位 → 点"生成变现模型" · **so that** 后端真调 MonetizationAgent.execute 'monetization-tool' mode → 输出变现模型(产品矩阵 + 定价 + 转化路径)· 不是 `[mock]` 占位 · isFallback 透传给前端 fallback marker。

**files_to_modify**:
- `apps/api/src/trpc/routers/app/monetization.ts` (L1-50 删 stub · 改真接 specialist)
- `apps/api/src/specialists/MonetizationAgent.ts` (加 'monetization-tool' mode + Step4bOutputSchema 复用 / 简化版)
- `apps/web/src/pages/tools/Monetization.tsx` (P1 stub setSubmitted 改 trpc.monetization.generate.useMutation + isFallback hint)
- `apps/web/src/pages/tools/__tests__/Monetization.test.tsx` (新建或更新 ≥ 3 unit test)
- `packages/clients/src/router-types.ts` (`MonetizationOutput` shadow type 加)

**Acceptance Criteria**:
- **AC-1**: `apps/api/src/trpc/routers/app/monetization.ts` generate procedure 改写 · 删除 `[mock]` content + History row stub · 改 `const agentRes = await monetizationAgent.execute({mode: 'monetization-tool', activeAccountId, traceId, stepKey: 'tool-monetization', userInput: input})` · 返 history row with real content (JSON.stringify(agentRes.result)) + tokensUsed
- **AC-2**: `MonetizationAgent.ts` 加 'monetization-tool' mode · system prompt 含 spec §8.2.1 4 字段(industry/productDescription/audience/ipPositioning)→ 输出 3 字段 schema(`productMatrix: string[]` + `pricingStrategy: string` + `conversionFunnel: string[]`)· model_tier='balanced' timeout_ms=30_000 retry=1
- **AC-3**: `apps/web/src/pages/tools/Monetization.tsx` 删除 P1 stub setSubmitted · 改 `const generateMutation = trpc.monetization.generate.useMutation({onError, onSuccess})` · onClick 调 generateMutation.mutate({stepKey: 'tool-monetization', industryContext, audienceProfile, ipPositioning}) · 渲染 generateMutation.data.content (JSON parse)
- **AC-4**: isFallback 处理 · `agentRes.isFallback === true` 时前端显示灰色 `<FallbackHint />` 提示 · network error 时 toast.error('生成失败 · 请重试')
- **AC-5**: cost_log 写入(继承 §11.16 PRD-25 cost.png D-241)· `eventType: 'specialist_call'` · streaming=false
- **AC-6**: Unit test ≥ 3 · mock monetizationAgent.execute → 返 success/fallback/error 3 场景 · vi.hoisted 模式
- **AC-7**: Visual baseline 不破坏 · `pnpm test:visual:prd23:check --grep monetization` PASS(因 page UI 不变 · 仅功能改)
- **AC-8**: TypeScript typecheck 5 ws 0 errors · vitest tests pass(含 monetization router test)
- **AC-COMMON**: typecheck + tests pass + lint 0 errors in 引入 files(ROOT 跑)

**anti_patterns 注入**(SHIELD · ≤ 2 条 · medium 风险):
1. `R-001 API_KEY 暴露 in apps/web/` (frontend 不允许 import OpenAI/Anthropic · 必须走 trpc)
2. `LLMGateway model_tier 不硬编码` (config 用 model_tier 不是 model name · 继承 §11.7)

---

### US-002 medium · /private-domain router 真接 PrivateDomainAgent.execute(D-259 + D-261)

**As** 用户在 /private-domain 工具 page · **I want** 选 6 phase 中 1 个(welcome/warmup/trust/discover/close/follow)+ 填产品/用户/场景 → 点"生成话术" · **so that** 后端真调 PrivateDomainAgent.execute → 输出当前 phase 话术全文 + 多种风格变体 · 不是 buildPhases() 伪 LLM 字符串拼接。

**files_to_modify**:
- `apps/api/src/trpc/routers/app/privateDomain.ts` (L1-100 删除 buildPhases() · 改真接 PrivateDomainAgent.execute · streaming 保留)
- `apps/api/src/specialists/PrivateDomainAgent.ts` (加 phase parameter + invokeLLM 完整 system prompt · 6 phase 各 prompt template)
- `apps/web/src/pages/tools/PrivateDomain.tsx` (确认接 trpc.privateDomain.generate · 6 phase tab UI · 字面锁 D-261)
- `apps/web/src/lib/constants/private-domain.ts` (新建 · PRIVATE_DOMAIN_STAGES 6 value 字面锁 + 4 字段 icon + desc · 跟 spec §27.7 1:1)
- `apps/web/src/pages/tools/__tests__/PrivateDomain.test.tsx` (≥ 3 unit test · 6 phase tab + mutation mock)

**Acceptance Criteria**:
- **AC-1**: `apps/api/src/trpc/routers/app/privateDomain.ts` 删 buildPhases() 函数(完全删除 · 0 残留) + delete 6-phase mock array · `generate` mutation 改 `await privateDomainAgent.execute({mode: 'phase-generate', phase: input.phase, ...})` · 返 history row · 单 phase 单 call(LLM 调用按 phase 分散)
- **AC-2**: `generateStream` subscription 保留 · phase 内逐 chunk yield(meta + delta + done)· 不再 phase-level yield(改为 chunk-level)
- **AC-3**: `PrivateDomainAgent.ts` 加 phase parameter(z.enum 6 value) + 6 phase 各 prompt template · system prompt 含目标 + 提示策略 + 期望输出格式
- **AC-4**: 输出 schema · `{phaseScript: string, variants: {professional: string, friendly: string, sales: string}}` · 3 风格变体(spec §8.2.2 SOP 第 4 步)
- **AC-5**: `apps/web/src/lib/constants/private-domain.ts` 新建 · `export const PRIVATE_DOMAIN_STAGES: readonly Stage[] = [{value:'welcome', label:'欢迎话术', icon:'Send', desc:'新好友添加后的第一印象话术'}, ...] as const` · 6 项严格按 spec §27.7 + §26.1
- **AC-6**: PrivateDomain.tsx 引 PRIVATE_DOMAIN_STAGES · 6 tab UI · tab click → onPhaseChange → state · generate button → trpc.privateDomain.generate.useMutation({phase, ...})
- **AC-7**: isFallback hint + cost_log + error handle 同 US-001 AC-4/AC-5
- **AC-8**: Unit test ≥ 3 · mock privateDomainAgent.execute · 验 phase enum + 输出 schema
- **AC-9**: TypeScript typecheck 5 ws 0 errors · vitest pass · lint clean(ROOT)
- **AC-COMMON**: typecheck + tests pass + lint 0 errors

**anti_patterns 注入**(SHIELD · ≤ 2 条):
1. `private domain 6 phase key 命名严守(welcome/warmup/trust/discover/close/follow · 不是 icebreak/build_trust)`(D-261 反例)
2. `BaseSpecialist 子类 invokeLLM 模板方法`(继承 §11.6)

---

### US-003 high · PresentationAgent 新建 + /present-styles 真接(D-259 + D-260)

**As** 用户在 /present-styles 工具 page · **I want** 输入文案 + 选平台 → 点"推荐呈现形式" · **so that** 后端调用**新建的 PresentationAgent** → 从 14 呈现形式中推荐 3-5 个最匹配 · 每个含 matchScore + rationale · 不是 `[mock]` 占位。

**files_to_create**:
- `apps/api/src/specialists/PresentationAgent.ts` (新建 · ≥ 150 lines · 参 BrandingAgent.ts L145-200 模板)
- `apps/web/src/lib/constants/present-styles.ts` (新建 · PRESENT_STYLES 14 项字面锁 · spec §27.5)
- `apps/web/src/pages/tools/__tests__/PresentStyles.test.tsx` (≥ 5 unit test · 高风险)

**files_to_modify**:
- `apps/api/src/trpc/routers/app/presentStyles.ts` (L1-40 删 stub · 改真接 PresentationAgent.execute)
- `apps/api/src/specialists/registry.ts` 或类似(注册新 specialist)
- `apps/web/src/pages/tools/PresentStyles.tsx` (接 trpc.presentStyles.recommend · 14 style 展示 + 推荐高亮)
- `packages/schemas/src/specialist-io/index.ts` (PresentationInput + PresentationOutput zod schema)
- `packages/clients/src/router-types.ts` (`PresentationRecommendOutput` shadow type 加)

**Acceptance Criteria**:
- **AC-1**: `apps/api/src/specialists/PresentationAgent.ts` 新建 · `class PresentationAgent extends BaseSpecialist<PresentationInput, PresentationOutput>` · `agentId: 'PresentationAgent'` · persona 含 "你是内容呈现形式推荐专家 · 根据用户文案 + 平台 · 从 14 种呈现形式中推荐 3-5 个最匹配的" · invokeLLM 完整实施(this.llmGateway.complete · model_tier='balanced' timeout=30s retry=1)· responseFormat zod schema validation
- **AC-2**: `PresentationOutput` zod schema · `recommendedStyles: array(z.object({id: z.enum(14key), label, description, tips, matchScore: z.number().min(0).max(100), rationale: z.string()})).min(3).max(5)`
- **AC-3**: 14 enum key 严守 spec §27.5(talking_head/drama/tutorial/vlog/street_interview/comparison/list_style/mashup/screen_record/animation/reaction/before_after/pov/qa · 14 项 lowercase + underscore · 0 字面漂移)
- **AC-4**: `apps/web/src/lib/constants/present-styles.ts` 新建 · `export const PRESENT_STYLES: readonly Style[] = [{id:'talking_head', label:'口播', description:'真人出镜直接讲述...', tips:'注意表情管理...'}, ...] as const` · 14 项严格 spec §27.5 1:1
- **AC-5**: `apps/api/src/trpc/routers/app/presentStyles.ts` 删 stub · `recommend` mutation 改 `await presentationAgent.execute({...})` · 返 history row with JSON.stringify(agentRes.result)
- **AC-6**: `apps/web/src/pages/tools/PresentStyles.tsx` 接 trpc.presentStyles.recommend.useMutation · 14 style card 显示 · 推荐 3-5 高亮(matchScore + rationale 显示)
- **AC-7**: PresentationAgent 注册到 specialist registry / index(若有 registry · 否则跳过)
- **AC-8**: PresentationInput + PresentationOutput zod schema 加到 `packages/schemas/src/specialist-io/index.ts` · 前后端共享
- **AC-9**: shadow type 加到 `packages/clients/src/router-types.ts` · `PresentationRecommendOutput` 类型可被前端 inference
- **AC-10**: Unit test ≥ 5(high 风险)· mock presentationAgent.execute → 验 success(3-5 推荐) + fallback + 14 enum + matchScore 范围 + rationale 非空
- **AC-11**: isFallback hint + cost_log + error handle 同 US-001
- **AC-12**: TypeScript typecheck 5 ws 0 errors · vitest pass · lint clean(ROOT)
- **AC-13**: Visual baseline · `pnpm test:visual:prd23:check --grep present-styles` PASS(若 UI 改 · 重 baseline)
- **AC-COMMON**: typecheck + tests pass + lint 0 errors

**anti_patterns 注入**(SHIELD · ≤ 3 条 · **high 风险**):
1. `BaseSpecialist 子类 invokeLLM 模板方法严守`(继承 §11.6 · 参 BrandingAgent.ts L145+)
2. `14 enum key 严格按 spec §27.5 字面 1:1(talking_head 不是 talkingHead · screen_record 不是 screenrecord)`(D-260 反例)
3. `R-001 API_KEY 不暴露 in apps/web/`(继承 PRD-25)

---

### US-004 medium · /deep-learning learn mutation 真触发 DeepLearnAgent(D-262)

**As** 用户在 /deep-learning 工具 page · **I want** 添加 ≥ 1 文案样本(text input · 不 file upload P1)→ 点"开始深度学习" · **so that** 后端 enqueue BullMQ job → DeepLearnAgent.execute 异步分析 → 前端轮询 status → 完成后显示学习结果。

**files_to_modify**:
- `apps/api/src/trpc/routers/app/deepLearning.ts` (L1-X 加 `learn` mutation + `learnStatus` query)
- `apps/api/src/specialists/DeepLearnAgent.ts` (76 lines · 加 execute method 或确认 BaseSpecialist 继承)
- `apps/api/src/jobs/deep-learning.job.ts` (新建 · BullMQ worker · enqueue + process)
- `apps/web/src/pages/tools/DeepLearning.tsx` (接 trpc.deepLearning.learn + .learnStatus 轮询)
- `apps/web/src/pages/tools/__tests__/DeepLearning.test.tsx` (≥ 3 unit test)
- `apps/api/src/trpc/routers/app/deepLearning.ts` (router-types shadow + List 已有)

**Acceptance Criteria**:
- **AC-1**: `apps/api/src/trpc/routers/app/deepLearning.ts` 加 `learn` mutation · 输入 `{samples: array(z.object({text: z.string().min(10).max(20000), source: z.string().min(1).max(200)})).min(1).max(20)}` · 返 `{jobId: string, status: 'queued'}`
- **AC-2**: `learnStatus` query · 输入 `{jobId}` · 返 `{status: 'queued' | 'processing' | 'completed' | 'failed', result: DeepLearnResult | null}` · 用于前端轮询
- **AC-3**: BullMQ job `deep-learning.job.ts` 新建 · worker.process → DeepLearnAgent.execute → 写 history row + 更新 job status
- **AC-4**: `DeepLearnAgent.ts` 确认 execute method 实现(继承 BaseSpecialist) · system prompt 含 "你是文案深度学习专家 · 用户提供 N 篇文案 · 拆段分析共性 + 总结 5 维度(语气/结构/钩子/转折/收尾)" · invokeLLM model_tier='reasoning' timeout=60s
- **AC-5**: `apps/web/src/pages/tools/DeepLearning.tsx` UI · textarea 添加文案 + "添加这篇" button → samples state · "开始深度学习" button → trpc.deepLearning.learn.useMutation · 触发后改 jobId state · `useQuery(trpc.deepLearning.learnStatus, {jobId}, {refetchInterval: jobId && status !== 'completed' ? 3000 : false})`
- **AC-6**: 完成后渲染 result.summary + 5 维度展示 · status='processing' 时 spinner · 'failed' 时 error toast
- **AC-7**: file upload **不在 P1 范围**(spec §8.4.3 提到 PDF/Word/TXT/Markdown/CSV 20MB · 留 PRR)· P1 仅 text input + source name · `note` 字段记录"file upload 延后"
- **AC-8**: isFallback hint + cost_log + error handle 同 US-001
- **AC-9**: Unit test ≥ 3 · mock deepLearningAgent.execute + BullMQ enqueue + query polling
- **AC-10**: TypeScript typecheck 5 ws 0 errors · vitest pass · lint clean(ROOT)
- **AC-COMMON**: typecheck + tests pass + lint 0 errors

**anti_patterns 注入**(SHIELD · ≤ 2 条):
1. `BullMQ + status polling 模式严守`(继承 PRD-25 dailyTasks · D-245)· 不允许同步 mutation
2. `file upload 延后到 PRR`(D-262 字面)· 不允许 P1 引入 file blob

---

### US-005 medium · mobile visual baseline 修 + TD-100 fix(D-263)

**As** 项目维护者 · **I want** playwright.config.ts chromium/mobile project 加 testIgnore 排除 admin specs + 修 4 mobile fail baseline · **so that** mobile project 不再撞 admin baseURL=5174 + viewport 错位 · TD-100 close · e2e CI gate 全 PASS。

**files_to_modify**:
- `playwright.config.ts` (chromium + mobile project 加 testIgnore)
- `tests/e2e/prd26-admin-visual-baseline.spec.ts`(确认 spec 自己 override baseURL=5174 不变 · 不动)
- `.agents/tech-debt.json` (TD-100 status=resolved + resolved_in_prd=PRD-27 + closed_at)

**Acceptance Criteria**:
- **AC-1**: `playwright.config.ts` chromium project 加 `testIgnore: ['**/tests/e2e/admin/**', '**/tests/e2e/prd*-admin-*.spec.ts']` · mobile project 同
- **AC-2**: admin project testMatch 保留 `'**/tests/e2e/admin/**'` · 不动 · prd26-admin-* spec 仍跑 admin project + 单独跑 chromium project(spec 自己 override baseURL=5174)
- **AC-3**: 验证 · `pnpm playwright test --project=chromium --list` 不包含 tests/e2e/admin/ 或 prd*-admin-* spec
- **AC-4**: 验证 · `pnpm playwright test admin-foundation-loop` chromium 不跑(只 admin project 跑 1 个 spec) · admin-foundation-loop PASS
- **AC-5**: 验证 · `pnpm playwright test prd26-admin-role-matrix` chromium 不跑 · admin project 跑 8 PASS
- **AC-6**: 验证 · `pnpm playwright test prd26-admin-visual-baseline --project=chromium` 17 PASS (不变)· mobile project 不跑(因 testIgnore)
- **AC-7**: `.agents/tech-debt.json` TD-100 status=resolved · resolved_in_prd='PRD-27' · resolved_at='2026-05-21' · resolution_notes 含修复 evidence
- **AC-8**: e2e 全套跑 · `pnpm playwright test --reporter=line` exit 0(若除 admin 外其他 spec 有 historical fail · 不阻塞 · 但 TD 标记)
- **AC-COMMON**: typecheck + tests pass + lint 0 errors

**anti_patterns 注入**(SHIELD · ≤ 1 条):
1. `e2e admin spec 必加 project filter`(继承 §11.17.5 + plan-check §2.6.27 自动检测)

---

### US-006 medium · 收官 verify-prd-27.sh + /goal-verify + /prd-retro 7 PRD + handoff PRD-28+(D-264)

**As** 项目维护者 · **I want** 跑 verify-prd-27.sh ≥ 30 checks + /goal-verify §0 4 sub-project 事实层同步 + §1+ Goal-backward 验证 **1:1 复刻完成度 100%** · **so that** PRD-27 ship 后立刻 PRR-ready · 收官产物 5(verify + goal-verify + retro + handoff + progress)。

**files_to_create**:
- `scripts/verify-prd-27.sh` (≥ 30 checks · 7 sections · ALL CHECKS PASSED)
- `.agents/verification/prd-27-goal-backward.md` (≥ 5 段 · 1:1 复刻 100% 验证)
- `.agents/retros/prd-27-vs-prd-26-retrospective.md` (≥ 8 sections · 跨 PRD-21~27 7 PRD)

**files_to_modify**:
- `tasks/prd-27.md` (§9 PRD-28+ Handoff section)
- `scripts/ralph/progress.txt` (PRD-27 retro 摘要追加)
- `AGENTS.md` (§11.18 PRD-27 1:1 复刻完成沉淀)

**Acceptance Criteria**:
- **AC-1**: `scripts/verify-prd-27.sh` 创建 · ≥ 30 checks 跨 7 sections(3 工具 page LLM 接入 verification 8 + PresentationAgent 新建 5 + /deep-learning learn 5 + mobile baseline + TD-100 5 + visual diff vs aiipznt 4 + admin sealed 3 + 1:1 100% 验证 3)· chmod +x
- **AC-2**: verify-prd-27.sh 跑通 exit 0 · echo 'PRD-27 RESULT: 30+ 通过 · 0 失败 · 1:1 复刻完成 100% · ALL CHECKS PASSED'
- **AC-3**: /goal-verify §0 跑 · 4 sub-project 事实层同步(apps/web · apps/api · apps/admin · packages 精简版)· /gsd-map-codebase × 3(packages 精简版不跑)· 偏差登记 TD
- **AC-4**: /goal-verify §1+ Goal-backward 验证 · 写入 `.agents/verification/prd-27-goal-backward.md` · ≥ 5 段(6 US 目标 vs 实际 · 1:1 复刻完成度 100% verification · 14 specialist 全建 + 4 新接入 page LLM 真调 · 反例库 SHIELD 注入有效率 · VERDICT)
- **AC-5**: /prd-retro 跨 PRD-21~27 7 PRD 复盘 · 写入 `.agents/retros/prd-27-vs-prd-26-retrospective.md` · ≥ 8 sections(数据 + 严格通过率 + 7 PRD 趋势 + TD 净变化 + 反例库 + Playbook + 反向发现 + Skill 升级 diff)
- **AC-6**: progress.txt 追加 PRD-27 retro 摘要 · `[PRD-27 retro] 1:1 复刻完成 · 4 新接入 page LLM · PresentationAgent 新建 · TD-100 close · 7 PRD 连续 audit 维度 100%`
- **AC-7**: `tasks/prd-27.md` §9 PRD-28+ Handoff section 写明 PRD-28 evaluation 完整化(TD-027) · PRD-29 多用户压测 · PRD-30 移动端 polish · PRD-31 海外版 · PRR 法务/部署
- **AC-8**: `AGENTS.md` §11.18 PRD-27 沉淀(1:1 复刻完成 + 14 specialist · 4 新接入 page LLM · PresentationAgent 模板继承 BrandingAgent · TD-100 e2e config drift close)
- **AC-9**: TypeScript typecheck 5 ws 0 errors · vitest tests pass(含 LLM Judge 4 PASS · 56/56)· pnpm lint 0 errors in PRD-27 files(M-2 ROOT 跑)
- **AC-10**: admin-foundation-loop e2e 仍 pass(admin project)· admin role matrix e2e pass · 17 admin visual baseline regression pass(chromium project)
- **AC-11**: 4 新接入 page visual baseline(/monetization /private-domain /present-styles /deep-learning)更新或建立(用 --update-snapshots 重生成 · PRD-23 baseline 命名延续)
- **AC-12**: git 状态干净 · 仅本 US 改 5-6 files + retro · 不动业务代码
- **AC-COMMON**: Typecheck passes · Tests pass

**anti_patterns 注入**(SHIELD · ≤ 2 条):
1. `收官不跳 /goal-verify §0`(继承 PRD-25/26)· §0 事实层同步 + §1+ Goal-backward 全跑
2. `retro 数据校准必跑 §2.A iter 计数`(继承 M-Y PRD-26 prd-retro skill 升级)· 区分 audit 1iter vs dev 1iter

---

## §4 验收标准摘要(plan-check 友好格式)

| US | risk | AC 数 | files | 接 specialist | 关键反例 |
|:-:|:-:|:-:|:-:|---|---|
| US-001 | medium | 8 | 5 | MonetizationAgent.execute 'monetization-tool' mode | R-001 / LLMGateway model_tier |
| US-002 | medium | 9 | 5 | PrivateDomainAgent.execute · 6 phase | 6 phase key 严守 / BaseSpecialist 模板 |
| **US-003** | **high** | **13** | **8** | **PresentationAgent.execute(新建!)** | BaseSpecialist 子类 / 14 enum key / R-001 |
| US-004 | medium | 10 | 5 | DeepLearnAgent.execute via BullMQ + status polling | BullMQ + polling 模式 / file upload 延后 |
| US-005 | medium | 8 | 3 | playwright.config testIgnore + TD-100 close | e2e admin spec project filter |
| US-006 | medium | 12 | 5-6 | (收官 · 不接 specialist) | 收官不跳 §0 / retro 数据校准 |

**total AC**: 60 · **total files**: 25-30 modified + 4-5 created

---

## §5 风险红线(自我把控)

### §5.1 R-001(全 US)· LLM API_KEY 不暴露前端
- ❌ NEVER `import OpenAI from 'openai'` in `apps/web/`
- ❌ NEVER `import Anthropic from '@anthropic-ai/sdk'` in `apps/web/`
- ❌ NEVER `apiKey:` 字面 in apps/web/
- ✅ frontend 100% 通过 `trpc.{router}.{procedure}.useMutation/useQuery/useSubscription` 走 specialist 抽象层

### §5.2 LD-A(US-001/002/003)· admin/web 隔离
- ❌ admin router 不可调 specialist · admin 是后台管理 · 不出 LLM
- ❌ packages/ui/admin/* 不引 trpc(继承 §11.17.1)
- ✅ 3 工具 page 改动只动 apps/web + apps/api/src/trpc/routers/app/* + specialists/

### §5.3 LD-009(US-001/002/003/004)· 数据库 mock 禁
- ❌ specialist test 不 mock 数据库(走 in-memory schema 或 SQLite test DB)
- ❌ integration test 必须真实数据库(继承 PRD-5)
- ✅ unit test 可 mock specialist.execute 返值 · 不 mock DB(specialist 内部 mock 是 OK)

### §5.4 D-261(US-002)· 私域 6 phase 字面锁
- ❌ 不允许 icebreak / build_trust / find_need / sell · 必须 welcome/warmup/trust/discover/close/follow
- ✅ grep -E "icebreak|build_trust|find_need" → 0 命中 · plan-check 自动验

### §5.5 D-260(US-003)· 14 呈现形式 key 字面锁
- ❌ 不允许 talkingHead / screenrecord / videoMix(应是 talking_head / screen_record / mashup)
- ✅ 严格 spec §27.5 14 key 全 lowercase + underscore
- ✅ grep "talking_head\|drama\|tutorial\|vlog\|street_interview\|comparison\|list_style\|mashup\|screen_record\|animation\|reaction\|before_after\|pov\|qa" 14 命中

### §5.6 D-262(US-004)· BullMQ + polling 模式
- ❌ deepLearning.learn 不允许同步返结果(长任务超时风险)
- ✅ enqueue + status polling 模式 · 继承 PRD-25 dailyTasks(D-245)

### §5.7 D-263(US-005)· playwright config testIgnore 必加
- ❌ 改 spec 头 test.skip 不在本 PRD 范围 · 必须 config-level fix
- ✅ chromium/mobile project 同时加 testIgnore 2 路径

---

## §6 失败回滚 + 拆 story 协议

### §6.1 启动前备份
```bash
git branch backup/before-prd-27 main
```

### §6.2 大 story 拆分硬规则(继承 §9.6)

| US | size_hint 检查 | 触发拆分? |
|:-:|---|:-:|
| US-001 | 5 files · 8 AC · medium · 0.5 day | ❌ 不拆 |
| US-002 | 5 files · 9 AC · medium · 0.5 day | ❌ 不拆 |
| **US-003** | **8 files · 13 AC · high · 0.8 day** | ⚠️ 边界 · 若 prompt > 12K 拆为 US-003a(PresentationAgent specialist) + US-003b(router + UI) |
| US-004 | 5 files · 10 AC · medium · 0.5 day | ❌ 不拆 |
| US-005 | 3 files · 8 AC · medium · 0.5 day | ❌ 不拆 |
| US-006 | 5-6 files · 12 AC · medium 收官 · 0.5 day | ❌ 不拆 |

### §6.3 失败 → 拆分 SOP(继承 PRD-26 §9.6.5)

若 daemon round 出现:
- Agent 5 min 无新输出 → kill + 拆 story
- retryCount ≥ 2 同 story Developer 超时 → kill + 拆 story
- 单 story round ≥ 6 → kill + 拆 story

20 min 内完成: kill → rm lock + audit-gate → backup prd.json → 拆 large story → 写 RCA → 重启 daemon。

### §6.4 Audit timeout 兜底(继承 RCA-006)

若 audit pending 180 min Opus 未响应:
- daemon 自动 `sys.exit(2)` + audit-gate 保留 pending
- 用户回来 → 4 选项介入(approve / reject / force-reject / block)
- 重启 daemon → crash recovery 自动接

---

## §7 依赖图谱

```
US-001 (/monetization) ────┐
US-002 (/private-domain) ──┤
US-003 (/present-styles · PresentationAgent 新建 · high) ┤
US-004 (/deep-learning) ───┤
US-005 (mobile baseline 修 · TD-100) ─┤
                                       └── US-006 (收官 verify + goal-verify + retro)
```

US-001 ~ US-005 并行可能 · 但 ralph daemon 默认串行 · 按 priority 跑(US-001 → US-002 → US-003 → US-004 → US-005 → US-006)。

US-006 必须等 US-001~005 全完成。

---

## §8 进度跟踪

(由 ralph daemon 自动写入 progress.txt · /monitor-ralph Monitor 订阅 PENDING_DETECTED 推送)

---

## §9 PRD-27 → PRD-28+ Handoff(US-006 收官填写 · 2026-05-21+)

### §9.1 PRD-28 · evaluation 完整化(TD-027 解决)
- LLM Judge mock 失效修复(TD-027 跨 PRD 历史)
- staging 真调 ≥ 100 sample · inter-rater agreement
- admin evaluation UI(查 LLM Judge 评分历史 + 多 agent 跨场景对比)
- /goal-verify 加 evaluation 维度

### §9.2 PRD-29 · 多用户压测 + 性能 baseline
- 100/1k 并发 · LLM Gateway 限流测试 · BullMQ 饱和
- DB 连接池 · Redis 容量
- Sentry + OTel 接入(用于压测期间监控)
- 性能 baseline · FCP / LCP / TTI 数据 · 跟 spec §42 对照

### §9.3 PRD-30 · 移动端响应式 polish
- apps/web 全 32 page 响应式 audit
- 移动端 touch interaction polish
- TD-099 web tools unit test
- mobile 视觉 baseline(US-005 已修 mobile config · 全 mobile baseline 留 PRD-30)

### §9.4 PRD-31 · 海外版 / i18n(可选)
- 英文版切换框架(react-i18next vs vue-i18n 选型 · D 已用 react · 用 react-i18next)
- 多供应商海外节点(Anthropic + OpenAI + Google)
- aiipznt 中文文案 → EN 翻译 + 校对
- 14 specialist 多语言 prompt template

### §9.5 PRD-32 · OAuth + Streamdown AI 流式完整化
- OAuth 流程对齐 spec §XLIII(wouter → react-router 已切 · 但 OAuth callback 流程待 audit)
- Streamdown(spec 实测是前端打字机模拟)· 评估 SSE 流式 vs 模拟切换

### §9.6 PRR · 法务 / 部署 prep
- 域名 quanan.com · ICP 备案 · 增值电信经营许可证(ICP-VAS)
- Google OAuth / 微信 OAuth 应用申请
- Trending 第三方授权(新榜 / 蝉妈妈 / 飞瓜)
- Vercel / Railway / 阿里云 RDS 部署
- Sentry / OTel / Plausible 监控接入
- 隐私政策 / 用户协议 文案
- 商标 / 版权
- 内容审核员招聘
- 客服 / 工单 / 支付集成
- 应急 / 灾备 SOP

### §9.7 路线图总览

| PRD | 主题 | 优先级 | 估时 | 1:1 复刻贡献 |
|:-:|---|:-:|:-:|:-:|
| **PRD-27** | **3 工具 page LLM + /deep-learning + mobile baseline 修** | **P0** | 1.5-2 day | **+5.7% → 100%(完成)** |
| PRD-28 | evaluation 完整化 | P1 | 2 day | 质量门禁 |
| PRD-29 | 多用户压测 | P2 | 1 day | 容量规划 |
| PRD-30 | 移动端 polish | P2 | 1 day | 移动覆盖 |
| PRD-31 | 海外版 / i18n | P3 | 2 day | 国际化 |
| PRD-32 | OAuth + AI 流式 | P3 | 1.5 day | 体验 |
| PRR | 法务 + 部署 | P3 | 等 | 上线 |

---

> **本 PRD 由 Opus 4.7 在 PRD-26 retro 后写 · 2026-05-21 · 完整版 700+ lines · 跟 PRD-25 同质量水平 · 反例库 SHIELD 注入 ≤ 3 条 high · ≤ 2 条 medium · 严守"质量第一·上下文不是借口"原则。**
