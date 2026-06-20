# PRD-29.6 · /step/3 全 button 真实可用 + admin LLM Config 模块

> **状态** · 待启动(2026-05-23 PRD-29 + PRD-29.5 ship 后接续)
> **branch** · `ralph/prd-29.6-step3-buttons-llm-config`
> **依赖** · PRD-29 commit a80475a + PRD-15 沉淀 step3 stepData + PRD-14 沉淀 SystemConfig
> **范围分档** · 7 US(1 high US-002 + 1 medium US-001 + 4 medium + 1 收官 US-007)
> **预期 daemon** · 5-8h wall time

---

## §0 引用清单 + 元数据 + 真实可用定调

### §0.1 上游沉淀

| 文档 / 代码 | 用途 |
|---|---|
| `apps/api/src/trpc/routers/admin/featureFlags.ts` | 已有 `listSystemConfig` + `updateSystemConfig` + `_updateSystemConfigInTx` + `emergencyToggleSystemConfig` · 直接复用 |
| `prisma/schema.prisma` `model SystemConfig` | configKey/configValue/isEmergency/updatedByAdminId · 已存在 · 加 2 keys 即可 |
| `apps/api/src/workers/llm-gateway/index.ts` | claude-sonnet-4-6 primary · gpt-4o fallback · LLM 调用入口 · 需改成读 SystemConfig fallback process.env |
| `apps/api/src/specialists/BrandingAgent.ts` | PRD-4 US-005 沉淀 · 'packaging' + 'persona' 2 mode · 加 'optimize' mode for 智能优化 |
| `apps/api/src/trpc/routers/app/step3.ts` | PRD-29 US-010b 沉淀 · generatePackage mutation · 加 optimize + regenerateAll |
| `apps/web/src/pages/step/Step3.tsx` | PRD-29 US-010a/b + PRD-29.5 mock fallback · 加 button wire |
| `apps/web/src/components/step3/*` | 14 sub-component · Copy/复制 button 需 wire clipboard |

### §0.2 元数据

| 项 | 值 |
|---|---|
| branchName | `ralph/prd-29.6-step3-buttons-llm-config` |
| Locked Decisions | D-298 起延续(PRD-29 收尾 D-297) |
| 风险分档 | high × 1(US-002 llm-gateway 改读 SystemConfig · 影响全 LLM 调用) · medium × 5 · low × 1 |
| 失败回滚 | `git branch backup/before-prd-29.6 main` |

### §0.3 真实可用定调(D-298)

| 维度 | 切 / 不切 |
|---|:-:|
| admin /admin/llm-config 页面(用户 UI 填 LLM key)| ✅ 切 |
| LLM key 加密存 SystemConfig(用 _updateSystemConfigInTx · 已加密)| ✅ 切 |
| llm-gateway 优先读 SystemConfig · fallback process.env | ✅ 切 |
| /step/3 智能优化 mutation 新建(step3.optimizeSection)| ✅ 切 |
| /step/3 一键重新生成 mutation(force flag)| ✅ 切 |
| /step/3 复制全部 + per-H3 复制(frontend clipboard + sonner toast)| ✅ 切 |
| /step/3 生成参考图 / 查看图标 button — VideoReferenceCaseSection + AvatarDesignSection(无 image gen)| 🟡 wire 但 toast "图片生成需 admin 配置 OpenAI key" · 不真接 DALL-E |
| canBulkActions 改 · mock data 时仍可 click(触发真 mutation)| ✅ 切(防 mock data block 所有交互) |

**D-298 反例锁** · NEVER mock data 时 button disabled(防"看似可用但不能点")

---

## §1 介绍/概述

PRD-29.6 是 **/step/3 全 button 真实可用 + admin LLM Config 模块** · 解决 PRD-29 + PRD-29.5 后用户 acceptance test 发现的"button 可点但功能不真用"问题。

**核心交付** ·

1. **admin /admin/llm-config 页面**(US-001 medium)· 表单 2 input(ANTHROPIC + OPENAI key · masked display)· Save + listSystemConfig + updateSystemConfig wire
2. **llm-gateway 读 SystemConfig 优先**(US-002 high)· startup 读 SystemConfig 2 keys · fallback process.env · 不破坏现有 LLM 调用
3. **/step/3 智能优化 mutation**(US-003 medium)· step3.optimizeSection · BrandingAgent 'optimize' mode 或 prompt-based · 修单个/全部 H3 内容
4. **/step/3 一键重新生成 mutation**(US-004 medium)· generatePackage 加 force flag · 重新跑 LLM(无 key 时 fallback 模板)
5. **/step/3 复制 button 全 wire**(US-005 medium)· 复制全部 toolbar · per-H3 Copy(NicknameCard / IntroCopyPlatformCard 等)· navigator.clipboard.writeText + sonner toast
6. **/step/3 生成参考图 / 查看图标 stub**(US-006 low)· VideoReferenceCaseSection + AvatarDesignSection wire onClick · toast "图片生成功能需 admin 配置 OpenAI DALL-E key · 当前请使用文字描述参考" [重构删: BackgroundImageDesignSection]
7. **收官 verify + git tag**(US-007 high)· verify-prd-29.6.sh + e2e + git tag prd-29.6-complete

---

## §3 User Stories(7)

### US-001 medium · admin /admin/llm-config page · 表单填 LLM key

**描述** · 在 admin 加 page /admin/llm-config · 表单 2 input(ANTHROPIC_API_KEY + OPENAI_API_KEY · masked 显示)· super_admin Save · 用现有 trpc.admin.featureFlags.listSystemConfig + updateSystemConfig wire。

**Acceptance Criteria** ·

- [ ] AC-1 · 新建 `apps/admin/src/pages/llmConfig/LlmConfigPage.tsx` · 表单含 2 个 Input(type=password masked)· 标签 `Anthropic API Key` + `OpenAI API Key` + 各 `Save` button
- [ ] AC-2 · 调 `trpc.admin.featureFlags.listSystemConfig` 拿 LLM_ANTHROPIC_API_KEY + LLM_OPENAI_API_KEY 当前值 · masked 显示(如 `sk-ant-***xxx`)
- [ ] AC-3 · Save 调 `trpc.admin.featureFlags.updateSystemConfig` 写入(双审批通过)· 用 _updateSystemConfigInTx(已加密)
- [ ] AC-4 · 加 admin router · `apps/admin/src/router.tsx` 加 `/admin/llm-config` 路由 + AdminLayout sidebar 链接 + permission='super_admin'
- [ ] AC-5 · admin audit log 自动写入(_updateSystemConfigInTx 内置)· 显示在 /admin/audit
- [ ] AC-6 · UI · `已设置`(value 非空) / `未设置`(value 空) 状态 indicator(绿点 / 灰点)
- [ ] AC-7 · cd apps/admin && pnpm typecheck 0 error
- [ ] AC-8 · 单元测试 LlmConfigPage.test.tsx render + Save + masked
- [ ] AC-9 · Typecheck passes
- [ ] AC-10 · Use agent-browser to open http://localhost:5174/admin/llm-config and verify form renders + 2 Save buttons + masked display

**files_to_create** · `apps/admin/src/pages/llmConfig/LlmConfigPage.tsx` + `apps/admin/src/pages/llmConfig/__tests__/LlmConfigPage.test.tsx`
**files_to_modify** · `apps/admin/src/router.tsx` + `apps/admin/src/layouts/AdminLayout.tsx`(sidebar 链接)
**risk_level** · medium

### US-002 high · llm-gateway 启动读 SystemConfig 优先(fallback process.env)

**描述** · llm-gateway 在初始化时优先读 SystemConfig 的 LLM_ANTHROPIC_API_KEY + LLM_OPENAI_API_KEY · 用作 API key · 找不到则 fallback process.env。不破坏现有 LLM 调用 · 也让 PRD-25/27 接的 LLM 仍 work。

**Acceptance Criteria** ·

- [ ] AC-1 · `apps/api/src/workers/llm-gateway/index.ts` 加 `loadLlmKey(provider: 'anthropic' | 'openai'): Promise<string | undefined>` · 先 prisma.systemConfig.findUnique({ where: { configKey: 'LLM_ANTHROPIC_API_KEY' } }) → decrypted value · fallback process.env.ANTHROPIC_API_KEY
- [ ] AC-2 · anthropic-provider.ts + openai-provider.ts 启动时调 loadLlmKey · 不再直接读 process.env
- [ ] AC-3 · 添加 cache 5 min(避免每次 LLM 调用都查数据库)· 加 invalidate hook · admin 改 key 后 immediate effect
- [ ] AC-4 · 加 unit test loadLlmKey + cache 行为
- [ ] AC-5 · 不破坏 PRD-25/27 LLM 接入(verify-prd-27.sh 跑通)· 跨 PRD 0 回归
- [ ] AC-6 · cd apps/api && pnpm typecheck 0 error
- [ ] AC-7 · Typecheck passes

**files_to_modify** · `apps/api/src/workers/llm-gateway/index.ts` + `apps/api/src/workers/llm-gateway/anthropic-provider.ts` + `apps/api/src/workers/llm-gateway/openai-provider.ts`
**files_to_create** · `apps/api/src/workers/llm-gateway/__tests__/load-llm-key.test.ts`
**risk_level** · high(影响所有 LLM 调用 · downstream count=14 specialists)

### US-003 medium · /step/3 智能优化 mutation 新建(step3.optimizeSection)

**描述** · 新建 trpc.step3.optimizeSection mutation · BrandingAgent 'optimize' mode(或新 prompt)· 接收 sectionKey + currentText · 返回优化后内容。前端 toolbar 智能优化 button 触发 · 实际优化全 6 H3 区。

**Acceptance Criteria** ·

- [ ] AC-1 · `apps/api/src/trpc/routers/app/step3.ts` 加 `optimizeSection` mutation · input { sectionKey: enum, currentResult: Step3Result } · output { optimized: Step3Result }
- [ ] AC-2 · 调 BrandingAgent.execute({ mode: 'packaging', userInput: { ...optimize prompt }, ... }) · 或新建 'optimize' mode
- [ ] AC-3 · 上游 SystemConfig LLM key 没设时 · 返 fallback 模板 + isFallback=true(不阻塞)
- [ ] AC-4 · Step3.tsx 智能优化 button onClick → trpc.step3.optimizeSection.useMutation · onSuccess 替换 stepData
- [ ] AC-5 · sonner toast '已智能优化' · 失败 toast 错误消息
- [ ] AC-6 · cd apps/api && pnpm typecheck 0 error · cd apps/web && pnpm typecheck 0 error
- [ ] AC-7 · 单元 + 集成测试 step3.optimizeSection mutation
- [ ] AC-8 · Typecheck passes

**files_to_modify** · `apps/api/src/trpc/routers/app/step3.ts` + `apps/web/src/pages/step/Step3.tsx`
**risk_level** · medium

### US-004 medium · /step/3 一键重新生成 mutation force flag

**描述** · trpc.step3.generatePackage mutation 加 `force?: boolean` input · 前端 toolbar 一键重新生成 button onClick → mutation({ force: true })· 等同于 form submit 但 reuse 现有 form data。

**Acceptance Criteria** ·

- [ ] AC-1 · `apps/api/src/trpc/routers/app/step3.ts` generatePackage input 加 `force: z.boolean().optional()` · force=true 时跳过 cache(若有)
- [ ] AC-2 · Step3.tsx 一键重新生成 button onClick → trpc.step3.generatePackage.useMutation({ personalInfo, platform, audience, accountStatus, force: true })
- [ ] AC-3 · 表单 right 副 button 重新生成 同样调 mutation({ force: true })· 跟 toolbar 一键重新生成共用 handler
- [ ] AC-4 · sonner toast '已重新生成全部'
- [ ] AC-5 · LLM key 没设时 fallback 模板 + isFallback=true 不阻塞
- [ ] AC-6 · cd apps/api && pnpm typecheck 0 error · cd apps/web && pnpm typecheck 0 error
- [ ] AC-7 · 集成测试 force flag 行为
- [ ] AC-8 · Typecheck passes

**files_to_modify** · `apps/api/src/trpc/routers/app/step3.ts` + `apps/web/src/pages/step/Step3.tsx`
**risk_level** · medium

### US-005 medium · /step/3 复制 button 全 wire(toolbar + per-H3)

**描述** · /step/3 各 Copy / 复制 button 全 wire frontend clipboard + sonner toast · 不依赖 LLM · 100% 真用。

**Acceptance Criteria** ·

- [ ] AC-1 · Step3.tsx toolbar 复制全部 button onClick → 拼接全 6 H3 内容(visual + 平台 + 各段)→ navigator.clipboard.writeText → sonner toast '已复制全部到剪贴板'
- [ ] AC-2 · NicknameCard 复制 button onClick → navigator.clipboard.writeText(nickname.name) → sonner '已复制昵称' · 已 wire 在 US-005 (PRD-29) · verify 仍 work
- [ ] AC-3 · IntroCopyPlatformCard 复制 button onClick → navigator.clipboard.writeText(entry.copy) → sonner '已复制 ${platformLabel} 简介文案' · 已 wire (PRD-29) · verify
- [ ] AC-4 · canBulkActions 改 · mock data 时仍 enabled(触发复制 mock 内容也合理 · 用户能预览)· 但 isLoading 时仍 disabled 防 race
- [ ] AC-5 · cd apps/web && pnpm typecheck 0 error
- [ ] AC-6 · e2e · agent-browser 打开 /step/3 · click 复制全部 → verify clipboard 有内容 + toast 出现
- [ ] AC-7 · Typecheck passes

**files_to_modify** · `apps/web/src/pages/step/Step3.tsx`
**risk_level** · medium

### US-006 low · /step/3 生成参考图 / 查看图标 stub

> ⚠️ US-006 部分作废(2026-06-18 重构)：**背景图参考图**(`BackgroundImageDesignSection` + `platformImages`/`referenceImage`)已删除。`VideoReferenceCaseSection` + `AvatarDesignSection` 部分仍有效。历史上已交付但功能本轮删。原内容见 git 历史。

**描述** · 视频参考案例 / 头像设计 H3 区的 [生成参考图] + [查看图标] button onClick wire · 暂无 image gen 接 · toast 提示用户 admin 后续配置 DALL-E key。 [重构删: BackgroundImageDesignSection 背景图设计 H3 区]

**Acceptance Criteria** ·

- [ ] AC-1 · VideoReferenceCaseSection / AvatarDesignSection 各 button onClick wire · 触发 toast '图片生成功能需 admin 配置 OpenAI DALL-E key · 当前请使用文字描述参考' · 用 sonner.info [重构删: BackgroundImageDesignSection 背景图参考图 不 wire]
- [ ] AC-2 · canGenerate 改 · mock data 时仍 enabled(用户能 click 看到 toast 提示)· 不再 require backend data
- [ ] AC-3 · cd apps/web && pnpm typecheck 0 error
- [ ] AC-4 · 单元测试 button onClick + toast 显示
- [ ] AC-5 · Typecheck passes

**files_to_modify** · `apps/web/src/pages/step/Step3.tsx`(传 onClick handler 下去)+ 各 Section component(若需改 prop · 估不需 · onGenerate prop 已存在)
**risk_level** · low

### US-007 high · 收官 verify + e2e + git tag prd-29.6-complete

**描述** · 跑全 typecheck + lint + unit + e2e + 字面对账 + 跨 PRD verify · 打 git tag prd-29.6-complete · 写 retro + ADR-022 补充 + ROADMAP 更新。

**Acceptance Criteria** ·

- [ ] AC-1 · `scripts/verify-prd-29.6.sh` 新建 · 跑 typecheck / lint / vitest(全栈) / playwright e2e(/step/3 flow) / verify-prd-27.sh(跨 PRD)
- [ ] AC-2 · 全 pass(0 fail · 0 typecheck error · 0 lint problem 不增)
- [ ] AC-3 · Audit Gate 通过 4 维度
- [ ] AC-4 · git tag prd-29.6-complete message "PRD-29.6 /step/3 全 button 真实可用 + admin LLM Config 模块"
- [ ] AC-5 · `.agents/retros/prd-29.6-vs-prd-29-retrospective.md` 写 retro · 跨 PRD 5 维度成绩(layout/字面/interaction/默认内容/真实可用)
- [ ] AC-6 · ADR.md ADR-022 补 PRD-29.6 实施完成标注
- [ ] AC-7 · ROADMAP-PRD-29-35.md 加 PRD-29.6 + 提示 PRD-30 每 page 同样要 "真实可用 + 默认内容" 双维度
- [ ] AC-8 · Typecheck passes
- [ ] AC-9 · Use agent-browser to open /step/3 and verify all buttons work (or toast appears for stub)

**files_to_create** · `scripts/verify-prd-29.6.sh` + `.agents/retros/prd-29.6-vs-prd-29-retrospective.md`
**files_to_modify** · `ADR.md` + `ROADMAP-PRD-29-35.md`
**risk_level** · high

---

## §10 Locked Decisions(D-298~D-302)

| D | 内容 |
|:-:|---|
| D-298 | admin LLM Config UI · 用现有 SystemConfig 后端 router · 不新建 model · 不新建加密 |
| D-299 | llm-gateway 读 SystemConfig fallback process.env(不破坏 PRD-25/27)· 5 min cache · admin 改 key invalidate |
| D-300 | /step/3 智能优化 / 一键重新生成 / 复制 全 wire 真用 · 无 LLM key 时返 fallback 模板 + isFallback=true |
| D-301 | /step/3 生成参考图 / 查看图标 stub toast · 不真接 DALL-E(PRR 阶段补) |
| D-302 | canBulkActions = !isLoading(去掉 hasRealData 限制 · mock data 时也可 click 复制等)· 防"看似可用但不能点"误体验 |

---

## §11 实施前置

1. `git branch backup/before-prd-29.6 main` 必跑
2. dev server 5173 / 5174 / 3000 healthy
3. SystemConfig 表 LLM_ANTHROPIC_API_KEY / LLM_OPENAI_API_KEY 不存在(US-001 + US-002 后默认空 = fallback process.env = undefined · LLM 走 fallback 模板)

---

## §12 PRD-30 衔接

PRD-29.6 ship 后 · 在 .claude/skills/clone-aiipznt-pages/SKILL.md 加 **第 6 phase · "真实可用 wire"** · PRD-30~35 每 page 都按此模式 ·
- layout / 字面 / interaction(Phase 3-4)
- 默认内容呈现(PRD-29.5 模式)
- **全 button 真实可用 + admin 联动**(PRD-29.6 模式)

每 page +3-5 US 真实可用 · 总 +72-120 US。

---

> **本 PRD-29.6 由 Opus 4.7 在 2026-05-23 BJT 写 · 7 US 真实可用 + admin LLM Config · 走 ralph daemon 跑 5-8h**
