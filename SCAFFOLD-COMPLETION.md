# QuanAn · src/ 脚手架完成报告 + 剩余 TODO 清单

> **版本** · v0.1(2026-05-06)
> **状态** · 关键骨架已就位 · 剩余文件按 Coding 3.0 P0-P8 各阶段填充

---

## ✅ 已完成(批 1-3 · 26 文件 / 关键基础设施)

### A · 根配置(13 文件)

| 文件 | 行数 | 状态 |
|---|:-:|:-:|
| `package.json` | 110 | ✅ 完整 · 17 scripts · 依赖锁定 §2.1-2.6 |
| `tsconfig.json` | 35 | ✅ strict + 13 严格选项(LD-013) |
| `tailwind.config.js` | 165 | ✅ DESIGN.md YAML 派生 · 7 surface + 4 primary + 5 动效 |
| `vite.config.ts` | 27 | ✅ alias + tRPC proxy |
| `vitest.config.ts` | 33 | ✅ 80/90/95% 覆盖率门禁 |
| `playwright.config.ts` | 26 | ✅ E2E + mobile |
| `.eslintrc.cjs` | 60 | ✅ LD-013 + R-9 |
| `.prettierrc` · `.gitignore` · `.env.example` · `postcss.config.js` | 110 | ✅ |
| `README.md` · `SCAFFOLD.md` | 240 | ✅ 项目入口 + 80 文件清单 |

### B · Prisma + DB(4 文件 · 1006 行)

| 文件 | 行数 | 状态 |
|---|:-:|:-:|
| `prisma/schema.prisma` | 622 | ✅ **18 实体完整** · 60+ 索引 · pgvector |
| `prisma/migrations/manual_rls.sql` | 140 | ✅ 12 表 RLS + admin bypass + worker 写权限 |
| `prisma/migrations/manual_vector_indexes.sql` | 56 | ✅ ivfflat 索引 |
| `prisma/seed.ts` | 188 | ✅ 测试用户 + 100 邀请码(RAG 占位) |

### C · 9 类常量(10 文件)

| 文件 | 内容 | 自检 |
|---|---|:-:|
| `platforms.ts` | 5 平台 | ✅ |
| `industries.ts` | 56 行业(5 大类)+ 敏感行业判断 | ✅ |
| `hotElements.ts` | 22 元素(4 组)+ 心理学解释 | ✅ |
| `scriptTypes.ts` | 20 脚本 + methodology | ✅ |
| `presentStyles.ts` | 14 形式 | ✅ |
| `privateDomain.ts` | 6 阶段 | ✅ |
| `steps.ts` | 9 步 + LS key 工厂 | ✅ |
| `evolution.ts` | 5 等级 + 阈值 + inferLevel() | ✅ |
| `diagnosis.ts` | 7 维度 + 自评项 | ✅ |
| `index.ts` | barrel export | ✅ |

### D · Agent 抽象层(4 文件 · 关键)

| 文件 | 行数 | 状态 |
|---|:-:|:-:|
| `src/server/agents/base/types.ts` | 90 | ✅ SpecialistInput/Output/Config 接口 |
| `src/server/agents/base/BaseSpecialist.ts` | 60 | ✅ 模板方法 · run() 自动 trace + 错误捕获 |
| `src/server/agents/base/ContextAssembler.ts` | 100 | 🟡 6 路并行框架(P3 填真实加载) |
| `src/server/agents/base/IPProgressService.ts` | 35 | 🟡 进度算法(P1 填 prisma 调用) |

### E · LLM Gateway(1 文件 · 关键)

| 文件 | 行数 | 状态 |
|---|:-:|:-:|
| `src/server/workers/llm-gateway/index.ts` | 150 | 🟡 5 大职责框架 + 类型签名(P3 填真实 SDK 调用) |

### F · 合规 + 日志(3 文件)

| 文件 | 行数 | 状态 |
|---|:-:|:-:|
| `src/lib/logger.ts` | 17 | ✅ pino + dev pretty |
| `src/lib/compliance/pii-mask.ts` | 60 | ✅ 5 类 PII(邮箱/手机/身份证/银行卡)+ 递归对象 |
| `src/lib/compliance/disclaimer.ts` | 35 | ✅ 医疗/法律/金融自动免责 |

### G · CopywritingAgent ★ 完整示例(1 文件)

| 文件 | 行数 | 状态 |
|---|:-:|:-:|
| `src/server/agents/specialists/CopywritingAgent.ts` | 145 | ✅ 4 mode + zod schema + fallback · 是其他 13 个 Specialist 的模板 |

### H · scripts(1 文件)

| 文件 | 行数 | 状态 |
|---|:-:|:-:|
| `scripts/audit-redlines.sh` | 95 | ✅ **17 红线 grep · 一键检测** · CI 入口 |

---

## ⏳ 待 Ralph 在 P0-P8 各 Phase 填充(50+ 文件)

### P1 · 数据底座(2 周)

> Ralph 在 P1 阶段填充以下 · 退出条件 · 13 router 全跑通 mock + 多账号 RLS 测试通过

#### zod schemas(18+ 文件 · `src/lib/schemas/entities/*.ts`)

按 [DATA-MODEL §11.2](DATA-MODEL.md) 文件组织 · 每个 prisma model 1 个 zod schema:
- `entities/user.schema.ts` · `ip-account.schema.ts` · `step-data.schema.ts` · `history.schema.ts`
- `entities/topic.schema.ts` · `asset.schema.ts` · `diagnosis-report.schema.ts` · `feedback-log.schema.ts`
- `entities/evolution-profile.schema.ts` · `evolution-insight.schema.ts` · `deep-learning-archive.schema.ts`
- `entities/knowledge.schema.ts` · `trending-item.schema.ts` · `invite-code.schema.ts`
- `entities/cost-log.schema.ts` · `audit-log.schema.ts` · `daily-task.schema.ts`
- `step-results/step1.schema.ts` ~ `step8.schema.ts`(9 个 · 详 [DATA-MODEL §4.4](DATA-MODEL.md))
- `index.ts` barrel

**模板** · 见 [DATA-MODEL §11.3 实体 schema 模板](DATA-MODEL.md)

#### tRPC routers(14 文件 · `src/server/trpc/routers/*.ts`)

13 router(详 [DATA-MODEL §3.2](DATA-MODEL.md)) + 1 聚合 `_app.ts`:
- `auth.ts` · `ipAccounts.ts` · `stepData.ts` · `copywriting.ts` · `videoAnalysis.ts`
- `videoProduction.ts` · `boomGenerate.ts` · `monetization.ts` · `privateDomain.ts`
- `diagnosis.ts` · `evolution.ts` · `deepLearning.ts` · `knowledge.ts`
- 加 `trending.ts`(辅助)+ `invite.ts`(辅助)
- 中间件 · `middleware/account-isolation.ts`(详 ARCHITECTURE §6.2 + AGENTS §4.3)

#### 5 层记忆模块(5 文件 · `src/server/memory/*.ts`)

- `l1-buffer.ts`(Redis VoiceChat)
- `l2-core.ts`(stepData CRUD)
- `l3-recall.ts`(history 检索)
- `l4-profile.ts`(EvolutionProfile + DeepLearning)
- `l5-trending.ts`(TrendingItem 全局)

### P3 · IP 主流程 9 步(3 周)

> 填充 · 13 Specialist 实现 · ContextAssembler 完整版 · LLMGateway 真实调用

#### 13 个 Specialist(参考 CopywritingAgent.ts 模板)

| Specialist | 文件 | 优先级 |
|---|---|:-:|
| PositioningAgent.ts | step1 + step4 | P3 |
| BrandingAgent.ts | step3 + step3b | P3 |
| MonetizationAgent.ts | step4b | P3 |
| TopicAgent.ts | step5 | P3 |
| VideoAgent.ts | step6 + ai-video | P5 |
| LivestreamAgent.ts | step8 | P3 |
| PrivateDomainAgent.ts | /private-domain | P6 |
| AnalysisAgent.ts | /video-analysis · /analysis | P4 |
| DiagnosisAgent.ts | /diagnosis | P3 |
| DeepLearnAgent.ts | /deep-learning | P7 |
| VoiceChatAgent.ts ★L5 | /voice-chat | P7 |
| EvolutionAgent.ts ★L5 | Heartbeat 跑批 | P7 |
| DailyTaskAgent.ts ★L5 | 0 点 Cron | P7 |

每个文件按 `CopywritingAgent.ts` 模板:
1. 输入 + 输出 zod schema
2. SpecialistConfig 五层(persona / memory / knowledge / tools / execution)
3. extends BaseSpecialist + 实现 execute()
4. fallback 路径

**system prompt 详细模板** · 见 [PROMPTS.md §1-§14](PROMPTS.md)

#### LLMGateway 真实实现(`src/server/workers/llm-gateway/`)

填充 stub:
- `rate-limit.ts` · token bucket on Redis
- `circuit-breaker.ts` · opossum 状态机
- `cost-tracker.ts` · prisma.costLog.create
- `model-router.ts` · 主 / 备模型切换

#### ContextAssembler 真实实现(`src/server/agents/base/ContextAssembler.ts`)

填充 6 路并行加载 · prompt 拼接 · §0.4 飞轮注入 · §4.4-D 6 冷启动场景。

### P5 · 视频模块(2 周)

#### Workers 完整实现(6 文件)

- `image-gen/index.ts` · DALL-E 3 / 文心一格(异步队列)
- `file-parser/index.ts` · pdf-parse + mammoth + fast-csv
- `stt/index.ts` · Whisper 流式
- `tts/index.ts` · OpenAI TTS / 火山引擎
- `trending-scraper/index.ts` · 第三方授权 vendor(LD-017 · 严禁 puppeteer)
- `methodology-query/index.ts` · 30KB 常量 in-memory

### P7 · Heartbeat Agent(2 周)

- `src/server/cron/evolution-runner.ts`(bullmq queue · 触发条件 ∈ {5,20,50,100})
- `src/server/cron/daily-task-runner.ts`(node-cron 0 0 * * *)
- 详 [ARCHITECTURE §4.4](ARCHITECTURE.md) + [PROMPTS §13/§14](PROMPTS.md)

### P0-P8 全期 · 测试(渐进填充)

- `tests/setup.ts` · vitest 全局 setup(testcontainers PG/Redis)
- `tests/unit/specialists/*.test.ts` · 14 文件 · 每个 14 用例(总 196)
- `tests/unit/context-assembler.test.ts` · 8 用例(冷启动 6 + 完整 + 边界)
- `tests/integration/multi-account-isolation.test.ts` · 5 用例
- `tests/integration/rls.test.ts` · 4 用例
- `tests/integration/feedback-flywheel.test.ts` · 4 用例
- `tests/e2e/*.spec.ts` · 8 关键旅程(playwright)
- `tests/llm-judge/{config,golden-dataset,runner}.ts` · 100 金标准

详 [AGENTS §7](AGENTS.md)。

### P2 · 前端 UI(34 路由 · 2-3 周)

`src/pages/` + `src/components/` + `src/hooks/`

- 9 step 页 · 14 工具页 · 6 新模块页 · 3 辅助 + admin
- shadcn/ui 12 基础组件
- 业务组件 · `PlatformPicker` · `IndustryPicker` · `HotElementsPicker` · `ResultCard` · `StepHeader`
- 4 hooks · `useStepData` · `useActiveAccount` · `useEvolution` · `useFeedback`

详 [ARCHITECTURE §2.4](ARCHITECTURE.md) + [SCAFFOLD §A 完整目录树](SCAFFOLD.md)

### Scripts 剩余(`scripts/`)

- `scripts/audit-ld.sh` · 18 LD 检测(详 [AGENTS §8.4](AGENTS.md))
- `scripts/audit-all.sh` · 一键审计(详 [AGENTS §8.8](AGENTS.md))
- `scripts/schema-diff.ts` · prisma + zod + DATA-MODEL.md 三方对比

---

## 📊 总进度

| 文件类别 | 已完成 | 待 Ralph 填 | 总计 |
|---|:-:|:-:|:-:|
| 根配置 | 13 | 0 | 13 |
| Prisma | 4 | 0 | 4 |
| 常量库 | 10 | 0 | 10 |
| zod schemas | 0 | 18+ | 18+ |
| Agent base | 4 | 0 | 4 |
| 14 Specialists | 1 ★ | 13 | 14 |
| 7 Workers | 1 框架 | 6 | 7 |
| 13 tRPC routers | 0 | 14 | 14 |
| 5 层记忆 | 0 | 5 | 5 |
| 2 Cron | 0 | 2 | 2 |
| 合规 | 2 | 0 | 2 |
| Scripts | 1 | 3 | 4 |
| 测试 | 0 | 30+ | 30+ |
| 前端 UI | 0 | 50+ | 50+ |
| **合计** | **36** | **141+** | **177+** |

> 已完成 36 关键文件占总量约 20% · 但**覆盖了 100% 的"基础设施 + 设计契约"**:
> - 所有 18 实体 schema(prisma + RLS + 索引)
> - 所有 9 类常量(完整数据)
> - Agent 抽象层(BaseSpecialist + ContextAssembler + LLMGateway 框架)
> - 1 个 Specialist 完整示例(CopywritingAgent)
> - 合规模块(PII mask + disclaimer)
> - 17 红线一键检测
>
> Ralph 在 P0-P8 各阶段按本清单填 141+ 文件 · 每个 Phase 有明确退出条件(详 [ARCHITECTURE §9](ARCHITECTURE.md))。

---

## 🚀 Ralph P0 立即可做(0.5 天)

```bash
cd /Users/return/Desktop/QuanAn

# 1. 安装依赖(已锁定 · 不需选)
pnpm install

# 2. 准备 .env(从 .env.example 复制 · 填 LLM keys)
cp .env.example .env

# 3. 启动 Postgres + Redis(本地 docker compose · P0 期间补 docker-compose.yml)
# 暂时:用 Supabase 远程 + Upstash Redis

# 4. 跑 prisma migration
pnpm db:generate
pnpm db:migrate

# 5. 应用 RLS + pgvector 索引
psql $DATABASE_URL -f prisma/migrations/manual_rls.sql
psql $DATABASE_URL -f prisma/migrations/manual_vector_indexes.sql

# 6. seed
pnpm db:seed

# 7. 跑红线检测(应该全过)
pnpm audit:redlines

# 8. 启动 Coding 3.0
/prime
/create-rules           # 用现有 AGENTS.md(已就绪)
prd                     # 写 P0 PRD
ralph                   # PRD → prd.json
ralph.py --daemon       # 启动自主执行
/monitor-ralph          # Opus 审计监测
```

---

## 修订记录

- **2026-05-06 v0.1** · 关键 36 文件就位 · 141+ TODO 清单 · 给 Ralph 在 P0-P8 各阶段填充
