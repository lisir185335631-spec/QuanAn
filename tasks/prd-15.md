# PRD-15 · 主应用前端完整化(A-Slim)· P9.5 frontend-completeness

> **版本** · v0.1(2026-05-15 创建 · Opus 4.7 主对话写)
> **范围** · A-Slim · 9 US · 主应用 web 6 stub 工具补完 + 2 衍生页新建 + mock data seed + 集成测试
> **基线** · PRD-14 收官后 · 14 PRD 主开发完结 · 进入 P9.5 UI 完整化阶段
> **目标** · 让 14 PRD 跑完的"代码可跑 + audit 全过"升级为"**本地 dev demo 可演示 + 用户能完整走完产品流程**"
> **预估** · 9 US · 2-2.5 周 wall time · 4 个 high + 4 个 medium + 1 个 foundation

---

## §0 引用清单(必读 · 启动 PRD-15 前)

### §0.1 上游文档(7 份核心)

| 文档 | 用途 | 重点章节 |
|---|---|---|
| `ARCHITECTURE.md` | 系统级架构 + 9 step + 14 工具 + 4 用户路径 | §1.4(服务对象 + 4 用户路径)· §6.4(9 step 契约表)· §2(14 工具入口)|
| `AGENTS.md` | 工程约束 + 18 LD + §11.6 PRD-4 + §11.7 PRD-14 沉淀 | §11.6.1 BaseSpecialist 模板 · §11.6.3 StepForm 抽象 · §11.6.6 stepData.save 9 step · §11.7 PRD-14 沉淀 |
| `DATA-MODEL.md` | 数据模型 · 主应用 18 表 | §3 ip_account / cost_log / topic / copywriting / etc |
| `tasks/prd-3.md` | P2 路由 + 首页(主应用骨架 · StepForm 抽象起源)| US-001~005 |
| `tasks/prd-4.md` | P3 IP 主流程 9 step(BaseSpecialist 14 Agent · StepForm 抽象沉淀)| §11.6 全 |
| `tasks/prd-5.md` | P4 创作模块(部分工具 page 实现)| Generate / Knowledge / VoiceChat 完整版本起源 |
| `tasks/prd-6.md` | P5 视频模块(VideoAnalysis / VideoProduction / AcquisitionVideo 简版来源)| 视频域 |

### §0.2 ui/ 设计稿(17 目录 · 本 PRD 7 个 stub/缺失对应)

| ui/ 目录 | 对应 PRD-15 US | 设计稿状态 |
|---|---|:-:|
| `ui/_1 + _5 + _7 + _14`(4 设计稿!)| US-005 PrivateDomain 完整化 | ✅ 4 屏完整(私域成交流程 6 阶段) |
| `ui/_8` | US-003 DeepLearning 完整化 | ✅ 文案深度学习中心 |
| `ui/_9` | US-006 Trending 完整化 | ✅ 全网爆款情报库 |
| `ui/_11 + _13` | US-007 /my-topics 衍生页 | ✅ 我的选题库(2 屏) |
| `ui/_12 + _15` | US-008 /history 衍生页 | ✅ 操作历史(2 屏) |
| `ui/ai_copywriting_studio_1` | US-002 Copywriting 完整化 | ✅ 文案工作室(独立大组件) |
| `ui/ai_storyboard` | (留 PRD-16 升 VideoProduction) | 🟡 暂不本 PRD 范围 |
| `ui/aiipznt_spec.md` | 原版完整 spec 索引 | ✅ §Ⅲ 14 router 实测 + §Ⅴ §Ⅵ UI 全屏 |

### §0.3 当前代码状态(本 PRD 起点)

| 类型 | 完整度 | 文件 |
|---|---|---|
| **6 stub 工具** | 🔴 18-43 行 stub | `apps/web/src/pages/tools/{Copywriting, DeepLearning, Monetization, PresentStyles, PrivateDomain, Trending}.tsx` |
| **2 衍生页缺失** | 🔴 page 完全不存在 | `apps/web/src/pages/MyTopics.tsx` + `apps/web/src/pages/History.tsx`(待新建)|
| **数据 seed 缺失** | 🔴 dev 数据库 0 industries + 0 IP 账号 | `prisma/seed.ts` 加 industries 56 + mock IP 账号 5 |
| **后端 router** | ✅ 已实现(PRD-3/4/5 沉淀)| `apps/api/src/trpc/routers/{copywriting, privateDomain, trending, deepLearning, monetization, presentStyles}.ts` |
| **Specialist** | ✅ 已实现(PRD-4 14 Agent)| `apps/api/src/specialists/*.ts` |
| **StepForm 抽象** | ✅ 已实现 | `apps/web/src/components/StepForm/StepForm.tsx`(各 step 复用)|

### §0.4 PRD-14 继承的 9 个 Codebase Patterns

PRD-15 强制继承(从 `scripts/ralph/progress.txt` 累积):

1. **StepForm + Schema 驱动模式**(PRD-4 §11.6.3)· 工具 page 也应用此模式 · 字段由 zod schema 定义
2. **BaseSpecialist 模板方法**(PRD-4 §11.6.1)· 后端已统一 · 前端调用直接走 tRPC
3. **lazy import + Suspense**(PRD-13 §11.6 + PRD-14 §11.7.1 Monaco)· 大组件懒加载
4. **useSearchParams URL state**(PRD-13 + PRD-14 §11.7.1 ConstantsPage)· 多 tab / 多维筛选 URL 持久化
5. **debounce 1s + localStorage draft**(PRD-13 + PRD-14)· 长表单防丢失
6. **agent-browser 实测 AC 闭环**(PRD-14 US-014 Validator playwright 实证)· 浏览器层硬验收
7. **跨 Story 函数路由 一致性**(PRD-14 TD-69 教训 + §11.7.2)· 表名 vs 函数路由严格区分
8. **emergency switch routing**(PRD-14 §11.7.2)· getSystemConfigValue vs getFeatureFlagValue 永不混用
9. **brownfield fallback**(PRD-13 US-003 ContextAssembler + PRD-14 US-008)· 新功能不破坏旧路径

### §0.5 跨 PRD 编号延续

- **Locked Decisions** · 本 PRD 从 **D-116** 起(继承 PRD-14 D-115)· 14 LDs(D-116~D-129)
- **TD 编号** · 本 PRD 新 TD 从 **TD-70** 起(继承 PRD-14 TD-69)
- **reject-examples.jsonl** · 累积 42 条(35 历史 + 7 PRD-13 + 5 PRD-14)· prd skill 注入新 US 自动检索

---

## §1 · 9 User Stories(分 3 子域 + 1 收官)

### §1.A 子域 ① 准备层(US-001 · foundation)

#### US-001 · industries 56 seed + 5 mock IP 账号 + dev OAuth mock(foundation)

**描述** · 作为 dev / demo 演示者 · 我需要本地数据库有完整 mock 数据 · 让所有 14 工具 + 9 step + 衍生页 demo 可演示 · 不需要真实 OAuth + 真实用户登录。

**risk_level**: foundation(下游 8 US 全依赖此 seed · 没数据所有 page 都空)
**size_hint**: medium

**Acceptance Criteria**:
1. `prisma/seed.ts` 加 `seedIndustries()` 函数 · 插入 **56 个行业**(参 `ui/aiipznt_spec.md §Ⅴ` 实测原版下拉数据 · 含"AIGC/教育/电商/餐饮/美业/医疗/法律/财税/IT/制造/服装/餐饮/旅游/婚庆/亲子/养生/宠物/汽车/房产/家居/装修/数码/家电/食品/饮料/酒类/茶艺/咖啡/护肤/彩妆/母婴/玩具/文具/书籍/体育/户外/健身/瑜伽/舞蹈/音乐/摄影/绘画/手工/收藏/古玩/珠宝/钟表/眼镜/箱包/鞋类/内衣/泳装/婚纱/礼服/西装/休闲" + 2 收尾)· 每条 `{key: string, label: string, category: string}` · INSERT 入 `industries` 表(若不存在则新建 prisma model)

   ```typescript
   // prisma/schema.prisma 加 model (若已有则验证 56 条 seed):
   model Industry {
     id        Int      @id @default(autoincrement())
     key       String   @unique  // 'aigc' / 'education' / etc
     label     String   // 显示名 'AIGC' / '教育'
     category  String   // 大类 'tech' / 'service' / 'retail' / etc
     order     Int      @default(0)
     createdAt DateTime @default(now()) @db.Timestamptz
   }
   ```

2. `seedMockIpAccounts()` 加 **5 个 mock IP 账号**(各覆盖 1 类用户路径 · ARCHITECTURE §1.4 提到的 4 类用户 + 1 demo)· 字段:
   - account 1: `{name: 'AI 创业者小张', primaryIdentity: 'ip-creator', industry: 'aigc', platform: 'xiaohongshu', followers: 850}` (个人 IP 起号者)
   - account 2: `{name: 'OPC 经营者老王', primaryIdentity: 'opc-founder', industry: 'consulting', platform: 'douyin', followers: 12000}` (OPC 创业者)
   - account 3: `{name: '实体店主陈姐', primaryIdentity: 'traditional-transform', industry: 'beauty', platform: 'wechat', followers: 320}` (传统行业转型者)
   - account 4: `{name: 'MCN 矩阵号', primaryIdentity: 'mcn-manager', industry: 'food', platform: 'multi', followers: 50000}` (MCN / 品牌方)
   - account 5: `{name: 'Demo 演示号', primaryIdentity: 'demo', industry: 'tech', platform: 'xiaohongshu', followers: 0}` (默认 demo)

3. `apps/api/src/middleware/auth.ts` 加 `DEV_OAUTH_MOCK` env flag · 若 `NODE_ENV=development && DEV_OAUTH_MOCK=true` · `auth.me` 返默认 mock user `{id: 1, email: 'dev@quanan.local', role: 'user'}` + 自动绑定 5 mock IP 账号 · 不走真 OAuth

4. `apps/api/src/trpc/routers/ipAccounts.ts` `list` procedure brownfield · NODE_ENV=development 时若 user 没账号 自动绑 5 mock 账号(seedMockIpAccounts 入库后)

5. `apps/web/src/components/AccountSwitcher.tsx` 头部账号切换器 · 列出 5 mock 账号 · 切换走 `useActiveAccount.switchTo(accountId)` 整页刷新(§11.5 PRD-3 沉淀)

6. `apps/web/src/components/IndustryDropdown.tsx` 56 行业下拉组件 · 复用到所有 9 step + 6 工具 page · 按 `category` 分组显示

7. `pnpm db:seed` 执行后 · 控制台输出 `✓ industries seeded · created=56` + `✓ mock_ip_accounts seeded · created=5` + 幂等(已存在 skip)

8. unit test `tests/unit/api/seed.test.ts` ≥ 4 it · seed industries 56 + seed mock_ip_accounts 5 + 幂等 re-seed + IndustryDropdown 渲染 56 项

9. agent-browser 打开 `http://localhost:5173/` · 头部账号下拉 5 mock 账号显示 · 切换"AI 创业者小张" · Step 1 行业 dropdown 显示 56 行业(分类展示) · `localStorage.aiip_active_account_id` 写入 mock 账号 id

10. pnpm vitest 1820+ pass / pnpm typecheck 3 workspace 全 PASS / Typecheck passes

**files_to_create**:
- `apps/web/src/components/AccountSwitcher.tsx`
- `apps/web/src/components/IndustryDropdown.tsx`
- `tests/unit/api/seed.test.ts`

**files_to_modify**:
- `prisma/schema.prisma`(加 Industry model · 若不存在)
- `prisma/seed.ts`(加 seedIndustries + seedMockIpAccounts)
- `apps/api/src/middleware/auth.ts`(加 DEV_OAUTH_MOCK)
- `apps/api/src/trpc/routers/ipAccounts.ts`(brownfield · NODE_ENV=development mock 绑账号)
- `apps/web/src/components/Header.tsx`(集成 AccountSwitcher + IndustryDropdown)

**anti_patterns**:
- ❌ 不删除真 OAuth 路径(brownfield 保留 · 仅 NODE_ENV=development + DEV_OAUTH_MOCK=true 才 mock)
- ❌ 不 hardcode mock 账号 id(用环境变量 + seed 时随机)
- ❌ 不在生产代码路径里走 mock OAuth(R-A3 红线 · 生产防护)

---

### §1.B 子域 ② 6 stub 工具补完(US-002~US-007)

#### US-002 · Copywriting 完整化(ui/ai_copywriting_studio_1)· high

**描述** · 作为内容创作者 · 我需要 `/tools/copywriting` 文案工作室页面 · 输入主题 + 平台 + 风格 → CopywritingAgent 生成 markdown 长文案 + SSE 流式 + 历史记录。1:1 实现 `ui/ai_copywriting_studio_1/screen.png` 视觉设计。

**risk_level**: high(独立大组件 1:1 fork + SSE 流式 + 历史持久化)
**size_hint**: large

**Acceptance Criteria**:
1. `apps/web/src/pages/tools/Copywriting.tsx` 完整化 · 替换 18 行 stub · 1:1 实现 `ui/ai_copywriting_studio_1/screen.png` 设计(2-column layout · 左 input form · 右 output preview)
2. 输入字段:
   - `topic` textarea(主题描述 · 必填 · ≥ 10 字)
   - `platform` select(平台 · `xiaohongshu` / `douyin` / `wechat` / `bilibili` / `kuaishou` / `weibo`)
   - `scriptType` select(脚本类型 · 20 选 1 · 复用 `lib/constants/scripts.ts` 20 类型 · PRD-7 沉淀)
   - `elements` checkbox group(22 元素 · N 选 · 复用 `lib/constants/elements.ts` · 用 IndustryDropdown 类似 grouped 显示)
   - `additionalContext` textarea(可选额外说明)
3. 提交按钮 "✨ 生成爆款文案" · 调 `trpc.copywriting.generate.useMutation()` · SSE 流式接 PRD-4 CopywritingAgent(已实现)· 流式渲染走 Streamdown 组件(参 PRD-4 §11.6.4)
4. 右侧 output preview 区:
   - 流式输出 markdown 文案(支持表格 + 代码块 + 列表 · 用 `react-markdown` 渲染)
   - 完成后显示 "复制全文" / "另存为模板" / "保存到历史" 三按钮
   - 失败显示明确错误(text · color=error · 含错误类型 + 重试按钮)
5. 历史 sidebar (左侧 collapse) · 列最近 10 个生成记录 · 点击恢复 input + output state · 走 `trpc.copywriting.history.useQuery()`
6. URL state `useSearchParams` · `?topic=xxx&platform=xxx&scriptType=xxx` 持久化 · 刷新恢复(PRD-13 SHIELD anti_pattern #2)
7. localStorage draft `copywriting_draft_${userId}` · debounce 1s 自动保存 input(PRD-13 SHIELD anti_pattern #3)
8. CopywritingAgent SSE meta chunk · 首 chunk `{type:'meta', meta:{model:actualModel}}` 显示在 UI("正在用 GPT-4 生成...")· cost_log 写入(PRD-4 §11.6.4)
9. lazy import + Suspense · `const StreamdownPreview = lazy(() => import('@/components/StreamdownPreview'))`
10. tests:
    - `tests/unit/web/pages/Copywriting.test.tsx` ≥ 8 it(form fields render + URL state + draft localStorage + submit mutation + SSE meta chunk + history sidebar + 失败状态 + 元素 multi-select)
11. agent-browser 打开 `http://localhost:5173/tools/copywriting?platform=xiaohongshu` · 填写 topic "如何起小红书号" · 选脚本类型 "深度科普" · 勾 3 元素 · 提交 · 流式渲染 markdown · 完成后 "复制全文" 可用
12. pnpm vitest pass / typecheck PASS / Typecheck passes

**files_to_create**:
- `apps/web/src/pages/tools/components/CopywritingForm.tsx`
- `apps/web/src/pages/tools/components/CopywritingPreview.tsx`
- `apps/web/src/pages/tools/components/CopywritingHistory.tsx`
- `apps/web/src/components/StreamdownPreview.tsx`(可复用 to 其他 SSE 工具)
- `tests/unit/web/pages/Copywriting.test.tsx`

**files_to_modify**:
- `apps/web/src/pages/tools/Copywriting.tsx`(替换 18 行 stub · 整个重写)
- `apps/web/src/router.tsx`(可能加 lazy import 守护)

**anti_patterns**:
- ❌ 不删除 PRD-7 `lib/constants/scripts.ts` + `lib/constants/elements.ts`(brownfield 复用 · 不重写)
- ❌ 不写非 SSE 同步调用(必走 SSE 流式 · 参 §11.6.4)
- ❌ 不 hardcode 平台 enum(用 zod enum + i18n)

---

#### US-003 · DeepLearning 完整化(ui/_8)· medium

**描述** · 作为内容创作者 · 我需要 `/tools/deep-learning` 文案深度学习中心页面 · 上传一段优秀文案 → DeepLearningAgent 解析公式 + 模式 + 风格 → 保存为我的"学习库" · 后续 Copywriting 时可调用。1:1 实现 `ui/_8/screen.png` 设计。

**risk_level**: medium
**size_hint**: medium

**Acceptance Criteria**:
1. `apps/web/src/pages/tools/DeepLearning.tsx` 完整化 · 替换 18 行 stub · 1:1 实现 `ui/_8/screen.png` 视觉(3-tab: 学习 / 我的库 / 公式应用)
2. **Tab 1: 学习** · textarea 粘贴优秀文案(≥ 100 字) · 选 source platform · 提交 → DeepLearningAgent 解析 → 显示 `{coreFormula, hookType, structurePattern, emotionalArc, keywords[]}` 结构化结果 · 操作: "保存到我的库" / "应用到文案生成"
3. **Tab 2: 我的库** · DenseTable 列我学的文案 · 列: 截取文案 80 字 / 公式名称 / 平台 / 学习时间 / 操作(应用 / 删除)
4. **Tab 3: 公式应用** · 选我的某个公式 → 输入新主题 → 用该公式生成新文案(走 CopywritingAgent + formula prompt 注入)
5. URL state 3 tab · `?tab=learn|library|apply`(PRD-13 SHIELD)
6. tRPC 调用:
   - `trpc.deepLearning.parse.useMutation()` · 解析
   - `trpc.deepLearning.list.useQuery()` · 学习库
   - `trpc.deepLearning.delete.useMutation()` · 删除
   - `trpc.deepLearning.applyFormula.useMutation()` · 应用公式
7. tests `tests/unit/web/pages/DeepLearning.test.tsx` ≥ 6 it(3 tab 切换 + parse 流式 + 我的库列表 + 删除 + 应用公式 + URL state)
8. agent-browser 打开 `/tools/deep-learning?tab=learn` · 粘文案 + 提交 · 解析结果显示 · "保存到我的库" 后切 Tab 2 见新记录
9. pnpm vitest pass / typecheck PASS / Typecheck passes

**files_to_create**:
- `apps/web/src/pages/tools/components/DeepLearningTabs.tsx`
- `tests/unit/web/pages/DeepLearning.test.tsx`

**files_to_modify**:
- `apps/web/src/pages/tools/DeepLearning.tsx`(替换 stub · 整个重写)

**anti_patterns**:
- ❌ 不破坏 PRD-8 DeepLearningAgent 后端实现(brownfield 复用)
- ❌ 不在前端 hardcode formula 类型(从后端 enum 拿)

---

#### US-004 · Monetization + PresentStyles 双 stub 补完(无专门设计稿 · 复用 StepForm 模式)· medium

**描述** · 作为创作者 · 我需要 `/tools/monetization` 变现模式生成 + `/tools/present-styles` 呈现风格选择两个工具页 · 复用 StepForm 抽象 · 调对应 Specialist(MonetizationAgent + PresentationAgent)。无专门 ui/ 设计稿 · 1:1 fork ARCHITECTURE 描述 + PRD-7 + StepForm 抽象。

**risk_level**: medium
**size_hint**: medium

**Acceptance Criteria**:
1. `apps/web/src/pages/tools/Monetization.tsx` 完整化 · 18 行 stub → 100+ 行实现:
   - 复用 `<StepForm stepKey="step4b" schema={MonetizationInputSchema}/>` 模式(StepForm 抽象 §11.6.3)
   - input 字段: `productDescription` textarea + `audienceProfile` textarea + `ipPositioning` select + `currentRevenue` number
   - 提交调 `trpc.monetization.generate.useMutation()` · 走 MonetizationAgent
   - output `<StepResult/>` 渲染 `{currentAnalysis, ladder[3 阶段], revenueStructure, successCases[2]}`(参 ARCHITECTURE §6.4 Step 4b 输出)
2. `apps/web/src/pages/tools/PresentStyles.tsx` 完整化 · 18 行 stub → 80+ 行实现:
   - 输入 textarea 文案 · 选 platform · 提交 → PresentationAgent 推荐 3-5 种呈现风格(图文 / 短视频 / 直播口播 / 长图文 / 漫画) · 每种含示例
   - tRPC `trpc.presentStyles.recommend.useMutation()`(后端可能需新建 · 若 PRD-7 已实现 复用)
3. URL state `useSearchParams` · 输入字段持久化
4. localStorage draft 各自 key
5. tests:
   - `tests/unit/web/pages/Monetization.test.tsx` ≥ 4 it
   - `tests/unit/web/pages/PresentStyles.test.tsx` ≥ 4 it
6. agent-browser:
   - 访问 `/tools/monetization` · 填表 · 提交 · 3 阶段 ladder 渲染
   - 访问 `/tools/present-styles` · 输入文案 + 选 platform · 提交 · 5 风格卡片显示
7. pnpm vitest pass / typecheck PASS / Typecheck passes

**files_to_create**:
- `tests/unit/web/pages/Monetization.test.tsx`
- `tests/unit/web/pages/PresentStyles.test.tsx`

**files_to_modify**:
- `apps/web/src/pages/tools/Monetization.tsx`(整个重写)
- `apps/web/src/pages/tools/PresentStyles.tsx`(整个重写)
- `packages/schemas/src/specialist-io/monetization.schema.ts`(若 schema 不够丰富 · 补字段)
- `packages/schemas/src/specialist-io/presentStyles.schema.ts`(若不存在 · 新建)

**anti_patterns**:
- ❌ 不脱离 StepForm 抽象(§11.6.3)· 必走 schema-driven
- ❌ 不重写 MonetizationAgent / PresentationAgent 后端(已 PRD-7 实现)

---

#### US-005 · PrivateDomain 完整化(ui/_1+_5+_7+_14 · 4 设计稿 · 私域 6 阶段流程)· high

**描述** · 作为 OPC 创业者 · 我需要 `/tools/private-domain` 私域成交流程工具 · 6 阶段流程(引流 → 加微 → 信任 → 朋友圈打造 → 成交 → 复购)· 输入产品 + IP 定位 + 受众 → PrivateDomainAgent 生成完整 6 阶段执行 SOP + 话术。1:1 实现 ui/_1+_5+_7+_14 4 设计稿(4 屏分别展示 6 阶段卡片 + 配置表单 + 生成结果 + 历史回看)。

**risk_level**: high(4 设计稿合并 · 复杂 UI · 6 阶段卡片视觉)
**size_hint**: large

**Acceptance Criteria**:
1. `apps/web/src/pages/tools/PrivateDomain.tsx` 完整化 · 18 行 stub → 400+ 行实现 · 1:1 实现 ui/_1/_5/_7/_14 设计(4 屏 = 4 view mode + URL state)
2. **View 1 (ui/_1 流程图)** · 6 阶段卡片(引流 / 加微 / 信任 / 朋友圈打造 / 成交 / 复购) · 每卡片显示阶段名 + 描述 + 状态(未生成/已生成) · 点击展开详情
3. **View 2 (ui/_5 配置参数)** · 配置表单:
   - `productDescription` textarea(产品描述)
   - `productPrice` number(客单价)
   - `targetAudience` textarea(受众画像)
   - `ipPositioning` textarea(IP 定位)
   - `currentChannel` select(当前主流量来源: 公众号 / 短视频 / 朋友圈 / 知识付费 / 其他)
   - `monthlyTraffic` number(月流量)
4. **View 3 (ui/_7 生成结果)** · 提交后调 `trpc.privateDomain.generate.useMutation()` · 渲染 6 阶段完整 SOP:
   - 每阶段含: `goal` / `tactics[]`(具体操作 5-10 条)/ `scripts[]`(话术示例 3-5 条)/ `metrics[]`(KPI)
   - 阶段间连线动画(用 framer-motion 或 CSS animation)
5. **View 4 (ui/_14 历史回看)** · DenseTable 列历史生成记录 · 点击恢复 View 1-3 状态
6. URL state `?view=flow|config|result|history` 切换(PRD-13 SHIELD anti_pattern #2)
7. localStorage draft `private_domain_draft_${userId}` debounce 1s 持久化
8. PrivateDomainAgent SSE 流式输出 · 每阶段独立流式 chunk · 6 阶段并行流式或顺序
9. 复用 PRD-4 §11.6.4 SSE meta chunk · cost_log 写入
10. tests `tests/unit/web/pages/PrivateDomain.test.tsx` ≥ 10 it:
    - 4 view 切换 + URL state
    - 6 阶段卡片渲染
    - 表单字段验证
    - 提交后流式渲染 6 阶段
    - 历史 view 恢复
    - draft localStorage
11. agent-browser 打开 `/tools/private-domain?view=config` · 填表 + 提交 · 跳 view=result · 6 阶段全渲染 · 切 view=history 见新记录
12. pnpm vitest pass / typecheck PASS / Typecheck passes

**files_to_create**:
- `apps/web/src/pages/tools/components/PrivateDomainFlowView.tsx`(View 1 6 阶段卡片)
- `apps/web/src/pages/tools/components/PrivateDomainConfigView.tsx`(View 2 配置表单)
- `apps/web/src/pages/tools/components/PrivateDomainResultView.tsx`(View 3 生成结果 · 6 阶段渲染)
- `apps/web/src/pages/tools/components/PrivateDomainHistoryView.tsx`(View 4 历史回看)
- `apps/web/src/pages/tools/components/PhaseCard.tsx`(共用阶段卡片组件)
- `tests/unit/web/pages/PrivateDomain.test.tsx`

**files_to_modify**:
- `apps/web/src/pages/tools/PrivateDomain.tsx`(整个重写 · 主控 view router)
- `packages/schemas/src/specialist-io/privateDomain.schema.ts`(若 schema 不够 · 加 currentChannel + monthlyTraffic)

**anti_patterns**:
- ❌ 不破坏 PRD-7 PrivateDomainAgent 后端实现
- ❌ 不在前端硬编码 6 阶段(从后端 schema 拿 · 后端 schema 定义 enum)
- ❌ 4 view 切换不允许 useState({view})· 必走 useSearchParams URL state(SHIELD #2)
- ❌ 不混用 SSE / sync 调用(必走 SSE 流式)

---

#### US-006 · Trending 完整化(ui/_9 · 全网爆款情报库)· high

**描述** · 作为内容创作者 · 我需要 `/tools/trending` 全网爆款情报库 · 显示最新爆款选题 + 多维筛选(平台 / 行业 / 时间) + 一键跳 Step 7 文案生成 + 我的收藏。1:1 实现 ui/_9/screen.png 设计。

**risk_level**: high(数据量大 · 多维筛选 + 实时更新 + 跨工具跳转)
**size_hint**: large

**Acceptance Criteria**:
1. `apps/web/src/pages/tools/Trending.tsx` 完整化 · 43 行 stub → 300+ 行实现 · 1:1 实现 ui/_9 设计
2. 顶部 KPI 卡片 · 总爆款数 + 本周新增 + 我收藏数 + 上次更新时间
3. 多维筛选 toolbar:
   - 平台 multi-select(xiaohongshu/douyin/wechat/bilibili/kuaishou/weibo)
   - 行业 IndustryDropdown(US-001 56 行业)
   - 时间范围 select(今日/本周/本月/最近 3 月)
   - 排序 select(点赞数/评论数/转发数/收藏数)
   - 搜索 input(关键词模糊匹配 title)
4. DenseTable 列爆款:
   - 列: 排名 / 平台 icon / title(截断 60 字)/ 行业 / 点赞 / 评论 / 转发 / 收藏 / 抓取时间 / 操作
   - 操作按钮: "查看详情" Drawer / "一键复制到 Step 7" / "收藏 ⭐" / "我的选题库 +"
5. 分页 · 每页 20 条 · 无限滚动 or 翻页(选择无限滚动 + 虚拟列表 react-virtualized)
6. URL state `?platform=xxx&industry=yyy&time=week&sort=likes&search=zzz&page=2`(深链支持)
7. 收藏功能 · 走 `trpc.trending.favorite.useMutation()` · 收藏的 trending item 同步进 `/my-topics`(US-007 衍生页消费)
8. 一键跳 Step 7 · 点 "一键复制到 Step 7" → 跳 `/step/7?topic=<title>&source=trending&trendingId=xxx`
9. 详情 Drawer · 点 "查看详情" 弹右侧 Drawer 显示:
   - 原文链接
   - 完整内容 markdown
   - "复制内容" / "保存到我的库" / "一键到 Step 7" 三按钮
10. 后端 API:
    - `trpc.trending.list.useQuery({platform, industry, timeRange, sort, search, page})` · PRD-6 已实现
    - `trpc.trending.favorite.useMutation({trendingId})` · 若不存在新建 procedure
    - `trpc.trending.detail.useQuery({trendingId})` · 详情
11. tests `tests/unit/web/pages/Trending.test.tsx` ≥ 12 it:
    - 4 KPI 渲染
    - 5 维筛选 toolbar
    - DenseTable + 分页
    - URL state(7 字段)
    - 收藏 mutation
    - 跳 Step 7
    - 详情 Drawer
    - 搜索关键词
    - 排序切换
12. agent-browser 打开 `/tools/trending?platform=xiaohongshu&sort=likes` · 看到爆款列表 · 收藏一条 · 跳 `/my-topics` 见收藏 · 一键到 Step 7 · 跳 `/step/7?topic=...&trendingId=xxx`
13. pnpm vitest pass / typecheck PASS / Typecheck passes

**files_to_create**:
- `apps/web/src/pages/tools/components/TrendingFilters.tsx`(多维筛选 toolbar)
- `apps/web/src/pages/tools/components/TrendingTable.tsx`(DenseTable + 虚拟列表)
- `apps/web/src/pages/tools/components/TrendingDetailDrawer.tsx`
- `tests/unit/web/pages/Trending.test.tsx`

**files_to_modify**:
- `apps/web/src/pages/tools/Trending.tsx`(整个重写)
- `apps/api/src/trpc/routers/trending.ts`(可能加 favorite + detail procedure)

**anti_patterns**:
- ❌ 不破坏 PRD-6 Trending 后端(brownfield 复用 list)
- ❌ 不在前端 fetch 所有数据排序(必走后端 query + 分页)
- ❌ 不混用 useState 和 useSearchParams(7 字段全走 URL state · SHIELD #2)
- ❌ 不重复 PRD-6 § 11.6.3 trending-scraper 流程(纯前端展示 + 收藏)

---

#### US-007 · /my-topics 衍生页(ui/_11+_13 · 我的选题库)· medium

**描述** · 作为内容创作者 · 我需要 `/my-topics` 我的选题库页面 · 聚合 step5(主题选择)+ trending(收藏)+ 手动添加的所有选题 · 多维筛选 + 一键跳 Step 7。1:1 实现 ui/_11 + ui/_13(2 屏视图)。

**risk_level**: medium
**size_hint**: medium

**Acceptance Criteria**:
1. `apps/web/src/pages/MyTopics.tsx` 新建 · 200+ 行实现 · 1:1 实现 ui/_11+_13 设计(2 view: 卡片视图 + 表格视图)
2. **View 1 (ui/_11 卡片视图 默认)** · 网格布局 · 每个选题卡片显示 title + source badge(step5 / trending / manual) + 行业 tag + 创建时间 + 操作(跳 Step 7 / 编辑 / 删除)
3. **View 2 (ui/_13 表格视图)** · DenseTable · 列: title / source / 行业 / 平台 / 创建时间 / 操作
4. View 切换按钮 · URL state `?view=card|table`
5. 数据源聚合 · 后端 `trpc.myTopics.list.useQuery({source, industry, page})` · 聚合 3 类数据源:
   - step5 输出的 topic(来自 `step_data` 表 stepKey='step5_topics_v2')
   - trending 收藏(来自 `trending_favorites` 表 · US-006 新建)
   - 手动添加(`trpc.myTopics.add.useMutation({title, industry, platform, note})`)
6. 多维筛选:
   - source: All / step5 / trending / manual
   - industry IndustryDropdown
   - search input(title 模糊)
7. "添加新选题" 按钮 + Modal · 手动添加表单
8. 一键跳 Step 7 · 点选题 "→ Step 7" 跳 `/step/7?topic=${title}&source=mytopics&topicId=xxx`
9. tests `tests/unit/web/pages/MyTopics.test.tsx` ≥ 8 it:
   - 2 view 切换 + URL state
   - 3 source 数据聚合
   - 筛选 + 搜索
   - 添加 Modal
   - 跳 Step 7
   - 编辑 + 删除
10. 后端 `apps/api/src/trpc/routers/myTopics.ts` 新建 · 5 procedure(list / add / update / delete / countBySource)· 聚合 3 数据源
11. agent-browser 打开 `/my-topics?view=card&source=trending` · 看到收藏的爆款 · 点 "→ Step 7" 跳 step 7
12. pnpm vitest pass / typecheck PASS / Typecheck passes

**files_to_create**:
- `apps/web/src/pages/MyTopics.tsx`
- `apps/web/src/pages/components/MyTopicsCard.tsx`
- `apps/web/src/pages/components/MyTopicsTable.tsx`
- `apps/web/src/pages/components/AddTopicModal.tsx`
- `apps/api/src/trpc/routers/myTopics.ts`(5 procedure)
- `tests/unit/web/pages/MyTopics.test.tsx`
- `tests/unit/api/myTopics.test.ts`

**files_to_modify**:
- `apps/api/src/trpc/routers/_app.ts`(挂 myTopics router)
- `apps/web/src/router.tsx`(加 `/my-topics` route)
- `apps/web/src/components/Header.tsx`(加 "我的选题库" 入口)

**anti_patterns**:
- ❌ 不破坏 step_data 表结构(brownfield 读)
- ❌ 不重复 trending_favorites 数据(去重逻辑 by source + sourceId)
- ❌ 不允许 myTopics router 直接读 admin 表(LD-A 红线)

---

### §1.C 子域 ③ 操作历史衍生页(US-008)

#### US-008 · /history 衍生页(ui/_12+_15 · 操作历史记录)· medium

**描述** · 作为内容创作者 · 我需要 `/history` 操作历史记录页面 · 聚合所有工具调用历史(Copywriting / VideoAnalysis / VideoProduction / DeepLearning / 等)· 按时间倒序 + 多工具筛选 + 一键恢复 input + 一键查看 output。1:1 实现 ui/_12 + ui/_15(2 屏: 时间线视图 + 工具统计 dashboard)。

**risk_level**: medium
**size_hint**: medium

**Acceptance Criteria**:
1. `apps/web/src/pages/History.tsx` 新建 · 200+ 行实现 · 1:1 实现 ui/_12+_15 设计(2 view: timeline + dashboard)
2. **View 1 (ui/_12 timeline 默认)** · 时间线视图 · 按天分组 · 每天显示当天的所有工具调用 · 每条:
   - 工具 icon + 工具名(Copywriting / VideoAnalysis / Step 7 / etc)
   - input 摘要(60 字截断)
   - output 摘要(60 字截断)
   - 时间(HH:MM)
   - 操作: "查看完整" Drawer / "恢复并重跑" / "删除"
3. **View 2 (ui/_15 dashboard)** · 工具使用统计 · 4 KPI 卡片:
   - 本周总调用数
   - 最常用工具 Top 5(柱状图)
   - 平均耗时 / 单次
   - 失败率
   + 4 chart(用 recharts 或 chartjs):
   - 每日调用趋势(7 天折线)
   - 工具分布(pie)
   - 耗时分布(histogram)
   - 模型分布(bar)
4. View 切换 URL state `?view=timeline|dashboard`
5. 多工具筛选 · 复选 14 工具 multi-select · URL state `?tools=copywriting,videoAnalysis`
6. 时间范围 · 今日 / 本周 / 本月 / 自定义日期
7. 后端 `trpc.history.list.useQuery({tools, dateRange, page})` · 聚合 14 工具的 `*_history` 或 `cost_log` 表 · 按 timestamp 倒序
8. "恢复并重跑" 功能 · 跳对应工具 page · URL params 携带 input(`?topic=xxx&restored=historyId`)· input 字段自动填充
9. tests `tests/unit/web/pages/History.test.tsx` ≥ 8 it:
   - 2 view 切换 + URL state
   - timeline 按天分组渲染
   - dashboard 4 KPI + 4 chart 渲染
   - 工具筛选
   - 时间范围筛选
   - 恢复并重跑跳转
   - 查看完整 Drawer
10. 后端 `apps/api/src/trpc/routers/history.ts` 新建 · 4 procedure(list / detail / delete / stats)
11. agent-browser 打开 `/history?view=timeline&tools=copywriting` · 看到时间线 · 切 view=dashboard 见 4 chart · 点 "恢复并重跑" 跳 `/tools/copywriting?topic=xxx&restored=...`
12. pnpm vitest pass / typecheck PASS / Typecheck passes

**files_to_create**:
- `apps/web/src/pages/History.tsx`
- `apps/web/src/pages/components/HistoryTimeline.tsx`
- `apps/web/src/pages/components/HistoryDashboard.tsx`
- `apps/web/src/pages/components/HistoryDetailDrawer.tsx`
- `apps/api/src/trpc/routers/history.ts`(4 procedure)
- `tests/unit/web/pages/History.test.tsx`
- `tests/unit/api/history.test.ts`

**files_to_modify**:
- `apps/api/src/trpc/routers/_app.ts`(挂 history router)
- `apps/web/src/router.tsx`(加 `/history` route)
- `apps/web/src/components/Header.tsx`(加 "操作历史" 入口)

**anti_patterns**:
- ❌ 不破坏 cost_log 表结构(brownfield 读)
- ❌ 不在前端 fetch 全 history 再筛选(必走后端 query + 分页)
- ❌ 不允许 history router 跨 admin 域读(只读 main 表)

---

### §1.D 子域 ④ 收官集成(US-009)

#### US-009 · verify-prd-15.sh + 4 E2E flows(收官)· high

**描述** · 作为发布工程师 · 我需要 `scripts/verify-prd-15.sh` 收官验收脚本 + 4 个 E2E flows · 验证 PRD-15 9 US 全部正确实施 + 跨工具流程跑得通。1:1 复用 PRD-14 US-015 verify-prd-14.sh 框架。

**risk_level**: high(收官 · 影响 PRD-15 整体放行)
**size_hint**: large

**Acceptance Criteria**:
1. `scripts/verify-prd-15.sh` 9 section · ≥ 50 checks:
   - §1 静态 audit-redlines + audit-redlines-admin(全 PASS · 11 LD-A + 6 R-A)
   - §2 静态 schema(industries 表 + 5 mock IP 账号 seed 验证)
   - §3 静态 6 工具 page 行数(每个 ≥ 100 行 · 不再 stub)
   - §4 静态 2 衍生页存在(`MyTopics.tsx` + `History.tsx` exists)
   - §5 静态 component 存在(`AccountSwitcher.tsx` + `IndustryDropdown.tsx` + `StreamdownPreview.tsx`)
   - §6 后端 router 存在(`myTopics.ts` + `history.ts`)
   - §7 admin router 全 PASS(继承 PRD-14)
   - §8 admin pages 全在(继承 PRD-14 · 不破坏)
   - §9 E2E · 4 flows + typecheck
2. **E2E Flow 1: 私域成交流程 E2E**(`tests/e2e/prd15-private-domain-e2e.test.ts` ≥ 8 step):
   - 登录 mock 账号 OPC 创业者
   - 打开 `/tools/private-domain?view=config`
   - 填写 6 字段 · 提交
   - 流式渲染 6 阶段
   - 切 view=history 见新记录
   - 验证 cost_log 写入
3. **E2E Flow 2: 文案工作室 + DeepLearning E2E**(`tests/e2e/prd15-copywriting-flow-e2e.test.ts` ≥ 8 step):
   - 登录个人 IP 起号者 mock 账号
   - 打开 `/tools/deep-learning` · 学一段文案 · 保存我的库
   - 打开 `/tools/copywriting` · 选脚本类型 + 元素 + 主题 · 提交
   - 验证 SSE 流式 markdown
   - 保存到历史
   - 切 `/history?tools=copywriting` 见新记录
   - 验证 cost_log 写入
4. **E2E Flow 3: Trending 收藏 → MyTopics → Step 7 跨工具流**(`tests/e2e/prd15-trending-to-step7-e2e.test.ts` ≥ 7 step):
   - 登录 mock 账号
   - 打开 `/tools/trending?platform=xiaohongshu` · 收藏一条
   - 跳 `/my-topics?view=card&source=trending` · 见收藏
   - 点 "→ Step 7" 跳 `/step/7?topic=...&trendingId=xxx`
   - Step 7 input 字段自动填充 · 提交生成文案
   - 验证 trending_favorites 表 + step_data 表写入
5. **E2E Flow 4: Mock OAuth + 5 账号切换 + 4 用户路径触发**(`tests/e2e/prd15-mock-auth-e2e.test.ts` ≥ 6 step):
   - DEV_OAUTH_MOCK=true · auth.me 返 mock user
   - Header 显示 5 mock 账号下拉
   - 切换 OPC 创业者 → localStorage.aiip_active_account_id 写入
   - reload · 仍登录 + 账号选中
   - 切换 MCN 矩阵号 → KPI 卡片显示 followers=50000
6. `pnpm audit:redlines / audit:ld / audit:redlines-admin / audit:admin-rls-tables / audit:admin-rls 5/5 ALL PASS`
7. `pnpm test ≥ 2050 pass`(基线 PRD-14 2012 + PRD-15 9 US 累计 ≥ 38 新 tests)· 0 fail
8. `pnpm typecheck 0 errors all 4 workspace packages`
9. `bash scripts/verify-prd-15.sh` 0 failures · 9 sections all PASS
10. Typecheck passes

**files_to_create**:
- `scripts/verify-prd-15.sh`
- `tests/e2e/prd15-private-domain-e2e.test.ts`
- `tests/e2e/prd15-copywriting-flow-e2e.test.ts`
- `tests/e2e/prd15-trending-to-step7-e2e.test.ts`
- `tests/e2e/prd15-mock-auth-e2e.test.ts`

**files_to_modify**:
- (无 · 纯新建脚本 + E2E 文件)

**anti_patterns**:
- ❌ E2E 不允许全 mock(必须真 Prisma + 真 DB · D-080 模式)
- ❌ 不破坏 PRD-14 收官 admin 测试(继承全 PASS)
- ❌ verify-prd-15.sh 不重复 verify-prd-14.sh 检查(只加 PRD-15 9 US 专项)

---

---

## §2 · Acceptance Criteria 4 类总览(强制)

继承 PRD-14 + ARCHITECTURE §6.5 · 本 PRD 所有 US 的 AC 必须覆盖以下 4 类:

### §2.1 视觉 AC(对照 ui/_X/screen.png 1:1)
- 必跑 agent-browser 实地访问 + 视觉比对
- 关键 brand color · CSS Var(`--bg-base`, `--accent-gold`, `--text-on-surface` 等)对齐 ui/_X
- 字体 / 间距 / Layout 跟 ui/_X 设计稿一致
- 失败显示明确 error(color=error · 含错误类型 + 重试按钮)
- 加载状态明确(Spinner / Skeleton · 不允许空白闪烁)

### §2.2 功能 AC(端到端流程闭环)
- agent-browser 真实流程闭环(填表 → 提交 → SSE 流式 → 结果渲染 → 操作 OK)
- localStorage / URL state / cookie 等持久化层可观察
- 刷新页面状态恢复(localStorage 持久化字段)
- 失败路径至少 1 条断言(网络 / Validator 错 / API 错)

### §2.3 数据 AC(后端 + DB 写入)
- tRPC mutation 真实写入 DB(cost_log / step_data / 工具历史表)
- 后端 schema 跟前端 zod schema 一致(packages/schemas/specialist-io/* 共享)
- 不跨 admin 域写(LD-A 红线)

### §2.4 测试 AC(unit + e2e + typecheck)
- unit test ≥ 4 it / US(覆盖 form render + 提交 + 失败 + URL state)
- typecheck 4 workspace 全 PASS
- audit:redlines + audit:redlines-admin + audit:admin-rls 全 PASS
- 收官 e2e flow 真实跑通(US-009)

---

## §3 · 范围排除(Non-Goals)

PRD-15 **不做**的事 · 留 PRD-16+ 或 PRR:

1. ❌ **4 简版工具升完整**(AcquisitionVideo / Analysis / BoomGenerate / VideoProduction)· 留 PRD-16
2. ❌ **9 step navigation 全局组件**(StepNav / Progress)· 留 PRD-16(用户感受层升级)
3. ❌ **4 用户路径引导**(/accounts dashboard 按 4 类用户推荐 next-step)· 留 PRD-16
4. ❌ **真 OAuth 配置**(Google / 微信)· 留 PRR
5. ❌ **真 Trending 第三方授权**(新榜 / 蝉妈妈 / 飞瓜)· 留 PRR
6. ❌ **支付集成**(微信支付 / Stripe)· 留 PRR
7. ❌ **域名 + ICP 备案 + 部署**(Vercel / Railway / 阿里云 RDS)· 留 PRR
8. ❌ **Sentry / OTel / Plausible 监控**· 留 PRR
9. ❌ **PRD-1~14 已完成功能的回归修改**(本 PRD 严格 brownfield · 不动 admin / specialists / step1~9)
10. ❌ **ui/_2/_3/_4/_6**(智能体进化中心仪表盘)· 已 admin PRD-13 实现 · 不重复

---

## §4 · 风险

| # | 风险 | 严重性 | 缓解 |
|:-:|---|:-:|---|
| R1 | **6 stub 工具 brownfield 后端 schema 不够丰富** · 前端补完时发现 schema 字段不够 · 需要扩 schema | 🟡 Medium | US-004 / US-005 AC 已预留 schema 补字段空间 · 必要时 backend brownfield 加字段 |
| R2 | **PRD-7 PrivateDomainAgent / DeepLearningAgent 实现简版** · 前端补完后发现 Agent 输出不够丰富 | 🟡 Medium | brownfield 复用 PRD-7 实现 · 若 Agent 输出不够 · 登记 TD 留 PRD-16 升 Agent |
| R3 | **ui/_X 设计稿过时**(2026-05 之前画 · 跟当前 ARCHITECTURE 不一致) | 🟢 Low | Opus audit 时跟 ARCHITECTURE §6 对齐优先 · ui/_X 作参考不死照搬 |
| R4 | **mock data seed 跟生产 OAuth 路径冲突** · 上线时忘记关 DEV_OAUTH_MOCK | 🟡 Medium | US-001 AC1.3 严格 NODE_ENV=development + DEV_OAUTH_MOCK 双 flag · R-A3 红线 audit 验证 |
| R5 | **跨工具跳转 URL state 命名漂移**(trending → my-topics → step 7 · 各自 URL params 不一致) | 🔴 High | §7.5 跨 Story 协议锁严格定义共享 URL params · plan-check 2.6.2 强制检查(继承 PRD-14 Diff-1)|
| R6 | **5 个 mock IP 账号导致 cost_log 写错账号**(seed 时 user.id=1 但 active_account_id 切换) | 🟡 Medium | brownfield 复用 useActiveAccount switchTo · § 11.5 PRD-3 沉淀 + clearLsNamespace + reload |
| R7 | **e2e flow 4 涉及 mock OAuth · 容易撞 OAuth 真路径**(staging 部署时) | 🟡 Medium | NODE_ENV=development 严格分离 · e2e 仅 dev 环境跑 |
| R8 | **Anthropic API rate limit**(daemon 长跑撞 5h 滚动窗口 · PRD-14 实证) | 🟢 Low | RCA-006 修复 + Step 4.5 路径已就位(PRD-14) · daemon 重启 SOP §9.1 严格 |

---

## §5 · 配额预计(Anthropic + DB)

| 资源 | 估算 |
|---|---|
| **PRD-15 总 LLM 调用** | 9 US × 平均 8 iter dev + 2 iter validator + 1 Opus audit = ~99 调用 |
| **Anthropic API token**(sonnet) | ~2.5M token(50% PRD-14 规模 · 9 US vs PRD-14 15 US)|
| **wall time 预估** | 13-18h(类似 PRD-13 9.4h / 12 US × 9/12 + UI 工程 + 1 Step 4.5 路径偶发缓冲) |
| **DB 写入** | industries 56 + mock_ip_accounts 5 + my_topics history schema · 估 100 row 增量 seed |
| **新 file 估算** | ~30 file(7 工具 component + 4 衍生页 component + 2 router + 7 test + 4 e2e + 9 SOP) |
| **代码行数** | +5000 / -200 lines(PRD-14 2216 +/- 21 · 类似规模 1.5-2x · UI 完整化工程量) |

---

## §6 · 退出条件

PRD-15 **必须满足**以下条件才算收官(类似 PRD-14):

1. ✅ 9/9 US passes=true(prd.json 状态)
2. ✅ `bash scripts/verify-prd-15.sh` 0 failures · ≥50 checks ALL PASS
3. ✅ `pnpm test ≥ 2050 passed`(基线 PRD-14 2012 + 38 新)· 0 fail
4. ✅ `pnpm typecheck` 4 workspace 0 errors
5. ✅ `pnpm audit:redlines / audit:ld / audit:redlines-admin / audit:admin-rls-tables / audit:admin-rls` 5/5 ALL PASS
6. ✅ Validator 跑 4 e2e flows 全 PASS(US-009)
7. ✅ Opus 走 OPUS-AUDIT-CHEATSHEET 5 步 audit 每 US PASS(含 foundation F1-F5 检查 US-001)
8. ✅ `.agents/goal-verify/prd-15-goal-verify.md` 产出 PASS or PASS-WITH-DEBT
9. ✅ `.agents/retros/prd-15-vs-prd-14-retrospective.md` 产出
10. ✅ progress.txt 累积 PRD-15 Codebase Patterns 回传

---

## §7 · Locked Decisions(D-116~D-129 · 14 LDs)

继承 PRD-14 D-102~D-115。

### D-116 · industries seed 56 行严格按 ui/aiipznt_spec.md §Ⅴ 实测原版数据
- **决策** · 不允许 ralph 自己脑补 56 行业列表 · 必须从 `ui/aiipznt_spec.md` §Ⅴ UI 实测下拉数据 1:1 抽取
- **理由** · 行业列表是产品定位的核心 · 漂移会导致下游 IndustryDropdown 跟设计稿不一致
- **影响** · US-001 AC1 必须 reference `ui/aiipznt_spec.md` 实测数据

### D-117 · DEV_OAUTH_MOCK 双 flag 严格分离
- **决策** · `NODE_ENV=development && DEV_OAUTH_MOCK=true` 才生效 mock OAuth · 任一 flag 缺则走真 OAuth
- **理由** · 防生产环境意外 mock 路径(R-A3 红线)
- **影响** · US-001 AC1.3 + audit script 加 grep 检测 production code 不应含 mock OAuth path

### D-118 · 5 mock IP 账号严格按 4 用户路径 + 1 demo 分配
- **决策** · 5 mock 账号必须分别覆盖个人 IP 起号者 / OPC 创业者 / 传统行业转型者 / MCN / Demo
- **理由** · 让 demo 演示 4 用户路径完整覆盖(虽然 4 路径引导留 PRD-16 · 但数据先就绪)
- **影响** · US-001 AC1.2 严格按 5 类型分配

### D-119 · 6 stub 工具补完严格走 StepForm 抽象(§11.6.3)
- **决策** · 不允许 ralph 重新发明 form 逻辑 · 必走 `<StepForm stepKey="xxx" schema={XxxSchema}>` 抽象
- **理由** · 9 step + 14 工具统一 form 模式 · 维护性 + 一致性
- **影响** · US-002~007 AC 严格用 StepForm

### D-120 · SSE 流式输出统一 Streamdown 组件
- **决策** · 所有 Specialist 流式输出 markdown(Copywriting / DeepLearning / PrivateDomain / Trending detail 等)必走统一 `<StreamdownPreview/>` 组件
- **理由** · 一致 UX + SSE meta chunk 处理统一(§11.6.4 PRD-4 沉淀)
- **影响** · US-002~006 SSE 流式 AC

### D-121 · 跨工具跳转 URL params 严格命名锁(§7.5)
- **决策** · 跨工具跳转的 URL params 必走 §7.5 命名锁 · 不允许漂移
- **理由** · PRD-14 TD-69 跨 story 协议漂移教训
- **影响** · US-006/007/008 跨工具跳转 + plan-check 2.6.2 检查

### D-122 · /my-topics 数据聚合严格 3 source(step5 + trending + manual)
- **决策** · `myTopics.list` 必须聚合 3 数据源 · 去重 by source + sourceId
- **理由** · 用户从不同入口加进的选题统一展示
- **影响** · US-007 AC + myTopics router 实现

### D-123 · /history 数据源严格读 cost_log 表
- **决策** · history 聚合的工具调用数据源是 `cost_log` 表(所有 LLM 调用统一记录处)· 不另建 history 表
- **理由** · 单一数据源 · 无双写不一致风险
- **影响** · US-008 AC + history router 实现

### D-124 · IndustryDropdown 56 行业 grouped 显示
- **决策** · 56 行业按 `category` 字段分组显示(tech / service / retail / ...)
- **理由** · 56 项扁平下拉用户找不到
- **影响** · US-001 AC + IndustryDropdown component 实现

### D-125 · AccountSwitcher 切换走 useActiveAccount.switchTo + reload(§11.5)
- **决策** · 账号切换必走 `useActiveAccount.switchTo(accountId)` + clearLsNamespace + window.location.reload
- **理由** · PRD-3 §11.5 沉淀 · 硬隔离不同账号 localStorage
- **影响** · US-001 AC5 + AccountSwitcher 实现

### D-126 · 工具 page 必走 lazy import + Suspense(§11.6 PRD-13 沉淀)
- **决策** · 6 stub 工具 + 2 衍生页全走 lazy import + Suspense fallback Spinner
- **理由** · 减小首屏 bundle 大小 · UI 响应快
- **影响** · US-002~008 router.tsx 加 lazy import

### D-127 · localStorage draft 严格 debounce 1s + 用户 id namespace
- **决策** · 所有长表单 draft localStorage key 必走 `<tool>_draft_${userId}_${activeAccountId}` namespace + debounce 1s
- **理由** · PRD-13 anti_pattern #3 沉淀 + 多账号隔离 + clearLsNamespace 切换账号清掉
- **影响** · US-002 / US-005 等长表单 AC

### D-128 · e2e flow 严格用 5 mock 账号身份(不允许自建 mock)
- **决策** · 所有 e2e flow 必须使用 US-001 seed 的 5 mock IP 账号 · 不允许 e2e 内 hardcode mock user
- **理由** · 单一 mock data source · 易维护
- **影响** · US-009 4 e2e flow AC

### D-129 · verify-prd-15.sh 9 section 严格继承 PRD-14 verify-prd-14.sh 结构
- **决策** · verify-prd-15.sh 9 section 顺序 + 命名跟 PRD-14 verify-prd-14.sh 一致 · 加 PRD-15 专项 ≥50 check
- **理由** · 工具一致性 + 可维护
- **影响** · US-009 AC1 verify-prd-15.sh 实现

---

## §7.5 · 跨 Story 协议锁(强制 · 9 US 跨 story 数据传递)

| 命名 | 类型 | 定义 story | 消费 story | 说明 |
|---|---|:-:|---|---|
| `industries` table | DB schema | US-001 | US-006(IndustryDropdown 复用)· US-007 | 56 行业 seed |
| `IndustryDropdown` component | React component | US-001 | US-006 / US-007 / US-002 / 各工具 page | 56 grouped 行业下拉 |
| `AccountSwitcher` component | React component | US-001 | 全 Header(Layout 集成) | 5 mock 账号切换 |
| `useActiveAccount.switchTo(accountId)` | hook method | PRD-3(brownfield) | US-001(集成 AccountSwitcher) | 已实现 · 复用 |
| `aiip_active_account_id` localStorage key | str | PRD-3(brownfield) | US-001 + 全工具 page | 已实现 · 不重命名 |
| `<StreamdownPreview/>` component | React component | US-002 | US-003 / US-005 / US-006 | SSE 流式 markdown 渲染 |
| `?topic=${title}&source=trending&trendingId=${id}` URL params | URL state | US-006 | step 7 + US-007 | trending → step 7 / my-topics 跳转 |
| `?topic=${title}&source=mytopics&topicId=${id}` URL params | URL state | US-007 | step 7 | my-topics → step 7 跳转 |
| `?restored=${historyId}` URL params | URL state | US-008 | 14 工具 page | history 恢复并重跑 |
| `cost_log` table | DB schema | PRD-3(brownfield) | US-008 history router 读 | 已实现 · brownfield 读 |
| `trending_favorites` table | DB schema | US-006 | US-007(my-topics 数据源) | 新建 · 标准化命名 |
| `my_topics` table OR derived view | DB schema OR aggregator logic | US-007 | (无 · 衍生数据 · 不另建表) | 聚合 step5_data + trending_favorites + manual |
| `DEV_OAUTH_MOCK` env flag | env var | US-001 | (无 · 启动时读) | dev 环境 mock 标记 |
| `mockMode: boolean` in auth.me response | API response field | US-001 | 全前端(Header 显示 mock badge) | 标识 mock 用户 |

定义 story 的 priority **必须**小于消费 story。每条被引用的 AC 必须显式写出此命名(不允许"存到合适字段"模糊表述)。

---

## §8 · 反例库注入(anti_patterns · 47+ entries)

### §8.1 反例库累积(继承 PRD-14)

- PRD-1~6 历史 35 条
- PRD-13 累积 7 条
- PRD-14 累积 5 条(含 emergency switch 路由漂移 reject)
- **PRD-15 启动注入** · 共 47 条 · prd skill 转 prd-15.json 时按关键词检索注入 each US

### §8.2 PRD-15 关键反例(prd skill 转 prd.json 注入)

每 US 注入 ≤ 3 条反例 · 高 risk 优先:

**US-001 foundation 反例**:
1. PRD-14 TD-69 跨 story 协议漂移(emergency switch · system_config vs feature_flag)· 教训:严格 §7.5 协议锁
2. PRD-3 §11.5 useActiveAccount.switchTo 必走 clearLsNamespace + reload(不允许 setState)· 防多账号 localStorage 污染
3. PRD-13 R-A3 mock OAuth 生产防护(DEV guard 双 flag 严格)· 防意外生产泄露

**US-002 / US-005 / US-006 high SSE 流式 反例**:
1. PRD-4 §11.6.4 SSE meta chunk 必首 chunk · cost_log.modelUsed 反映真 model
2. PRD-13 §11.6 lazy import + Suspense 必走 · 不允许 static import 大组件
3. PRD-13 anti_pattern #3 draft debounce 1s + localStorage · 长表单防丢失

**US-006 Trending 反例**:
1. PRD-6 trending-scraper 后端纯展示 · 前端不重复实现抓取
2. PRD-14 §11.7.2 路由统一 · 表名 vs 函数路由严格区分
3. PRD-13 useSearchParams URL state · 多维筛选必走 URL · 不 useState({...})

**US-007 / US-008 衍生页 反例**:
1. PRD-13 R-A5 衍生页不允许跨 admin 域读(LD-A 红线)
2. PRD-3 §11.5 跨账号数据隔离(my_topics 必带 accountId 筛选)
3. PRD-14 §11.7.1 admin page 入口 admin-routes 协议(主应用 page 走 web 路由 · 不混)

**US-009 e2e 反例**:
1. PRD-14 US-015 e2e 真 Prisma + 真 DB · D-080 模式
2. PRD-13 anti_pattern #1 5 档 enum 守护(若涉及 PrivateDomain 6 阶段 enum · 严格枚举)
3. PRD-14 US-014 Validator playwright + screenshot · agent-browser 实测必含视觉断言

---

## §9 · 修订记录

| 版本 | 日期 | 修订人 | 内容 |
|---|---|---|---|
| v0.1 | 2026-05-15 | Opus 4.7 主对话 | 初稿 · A-Slim 9 US · 6 stub 工具 + 2 衍生页 + mock data seed + 收官集成 · 派生自 PRD-14 收官后用户实测 · 14 PRD audit 全过但本地 dev 显示不完整 |

---

## §10 · Coding 3.0 协同

### §10.1 走标准流程(继承 PRD-14)

1. **prd skill** · 转 `scripts/ralph/prd-15.json`(注入 anti_patterns × 47 + risk_level 自动打标 + downstream 升档)
2. **/plan-check** · 强制跑 · 检查 2.6.2 跨 Story 命名 + 2.6.13 anti_patterns 覆盖率 + 2.6.X PRD-14 新加 4 检查(跨 Story 函数路由一致性)
3. **ralph daemon** · `python3.11 scripts/ralph/ralph.py --model sonnet --daemon`(用 RCA-006 修复后版本 · 不再 silent skip)
4. **/monitor-ralph** · 强制启 Monitor 守 ralph-output.log + audit-gate
5. **Opus audit** · 每 PENDING_DETECTED 走 OPUS-AUDIT-CHEATSHEET 5 步 + Foundation F1-F5(US-001 · 升 foundation · downstream 8 US)
6. **/goal-verify** · 收官跑 · 9/9 US PASSED 期望
7. **/prd-retro** · 跨 PRD 复盘 · 8 维度 + Playbook + 反例库累积

### §10.2 PRD-14 retro Playbook P-1~12 全继承

| P-N | 内容 | PRD-15 应用 |
|---|---|:-:|
| P-1 | 7 闸链 adminProcedure | 不涉及(本 PRD 主应用 · 不动 admin) |
| P-2 | DenseTable + Drawer | ✅ US-006 Trending + US-007 MyTopics + US-008 History |
| P-3 | LD-A 红线 + audit script | 不新加 LD-A(主应用红线只用 LD-1~17 · 17 LD 已严控) |
| P-4 | BullMQ cron | 不涉及(本 PRD 纯前端 + 衍生页 router) |
| P-5 | D-077 isMock=true | 不涉及(本 PRD 不调 LLM Judge) |
| P-6 | _xxxInTx 单点函数 | 不涉及(本 PRD 无写表跨多行) |
| P-7 | reject-examples.jsonl 注入 | ✅ §8.2 47 条注入 |
| P-8 | 大 UI Story 拆 · files ≤ 10 | ⚠️ US-005 PrivateDomain 4 设计稿 + US-006 Trending 多 component · 必拆 component / 控 files |
| P-9 | git stash double-validation | ✅ 留 Opus audit 时遇 pre-existing TD 用 |
| **P-10** | **强制跑 /plan-check** | ✅ 启动前必跑(PRD-14 教训 · 跳过导致 1 reject) |
| **P-11** | **Foundation F1-F5 必跑** | ✅ US-001 foundation 走 F1-F5 |
| **P-12** | **Step 4.5 直审路径就位** | ✅ Validator 撞 infra block 时 Opus 直审 commit |

### §10.3 PRD-14 retro N-1~7 不做项严守

| N-N | 内容 | PRD-15 严守 |
|---|---|:-:|
| N-1 | foundation 档 ≤ 3 个 | ✅ 仅 US-001 1 个 |
| N-2 | LD-A + audit script 双同步 | N/A(不新加 LD-A) |
| N-3 | large UI files_to_create > 12 | ⚠️ US-005 PrivateDomain 5 file + US-006 Trending 3 file · 均 ≤ 10 OK |
| N-4 | 4 个 high+large 同 PRD | ⚠️ 本 PRD 仅 US-002/005/006/009 4 个 high+large · 触上限 · 需控复杂度 |
| N-5 | self-fix > 3/US | ✅ Validator 跑 playwright 实测 + AC 嵌代码 · 减 drilling |
| N-6 | 跨 story 命名漂移 | ✅ §7.5 严格协议锁 + plan-check 2.6.2 检查 |
| N-7 | 不跑 /plan-check | ✅ 启动前必跑(P-10) |

### §10.4 PRD-14 retro E-1~4 实验项

- **E-1 Wave 内 audit pre-check** · 留 PRD-15 试(self-validation 增强)
- **E-2 RCA-006 watch-audit + 系统通知** · 已落地(本项目就位)
- **E-3 Foundation F2 下游 AC 跨 story 命名核对** · US-001 audit 时跑(catch 跨 story 漂移)
- **E-4 PRD seed 文档 §7.5 自动 grep 检查** · 留 plan-check 升级(本 PRD 暂不实施)

---

## §11 · PRD 后续接入预备(PRD-16 候选)

PRD-15 收官后 · PRD-16 应做(候选 · 留用户决定):

1. **4 简版工具升完整**(AcquisitionVideo / Analysis / BoomGenerate / VideoProduction)· 对照 ui/ai_storyboard 等
2. **9 step navigation 全局组件** · StepNav + Progress(用户感知层关键)
3. **4 用户路径引导** · /accounts dashboard 按 4 类用户推荐 next-step + onboarding 引导
4. **ui/_X 视觉精修**(对照 screen.png 严格 1:1 · CSS 微调)
5. **9 step e2e 流程实测**(目前只有 step 1 实际可填写 · step 3-8 跑通需要 mock 数据 · 留 PRD-16 e2e)

PRD-16 预估 12-15 US · 2-2.5 周。

---

> **本文档由 Opus 4.7 在 2026-05-15 BJT 完整生成 · 11 章节 · 9 US · D-116~D-129 14 LDs**
> **基线** · `tasks/prd-14.md` + `.agents/retros/prd-14-vs-prd-13-retrospective.md`
> **下一步** · 用户 review → ralph skill 转 `scripts/ralph/prd-15.json` → /plan-check → 启 ralph daemon
