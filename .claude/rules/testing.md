---
# 从 AGENTS.md §7 下沉（R7 2026-06-12），按需加载
# 触发场景：写测试、配置 CI、改 prompt 后跑回归时加载
---

## §7.1 测试金字塔（5 层）

```
                   ┌────────────────────┐
                   │ ⑤ LLM Judge        │   100 金标准 · 评分 ≥ 4.0
                   │   (夜跑 · 30 min)  │
                   └────────────────────┘
              ┌────────────────────────────┐
              │ ④ E2E（8-10 用例）         │   主链路 · playwright
              │   (15 min)                 │
              └────────────────────────────┘
          ┌────────────────────────────────────┐
          │ ③ 集成（40-60 用例）               │   tRPC + DB · supertest
          │   (10 min)                          │
          └────────────────────────────────────┘
    ┌────────────────────────────────────────────────┐
    │ ② 单元（200+ 用例）                             │   vitest
    │   (5 min)                                       │
    └────────────────────────────────────────────────┘
 ┌──────────────────────────────────────────────────────────────┐
 │ ① 静态（类型 + lint + zod schema 一致性）                    │   tsc · eslint · CI
 │   (1 min)                                                     │
 └──────────────────────────────────────────────────────────────┘
```

## §7.2 ① 静态测试（CI 自动）

```bash
pnpm typecheck      # tsc --strict --noUncheckedIndexedAccess · 0 error
pnpm lint           # eslint + plugin-react-hooks + plugin-jsx-a11y · 0 error/0 warning
pnpm format:check   # prettier --check
pnpm schema:diff    # 自定义脚本·比对 prisma schema vs DATA-MODEL.md vs zod schema
```

| 检查项 | 失败处理 |
|---|---|
| tsc 0 error | hard fail |
| eslint 0 warning（`--max-warnings=0`） | hard fail |
| 三个 schema（prisma/DATA-MODEL.md/zod）不一致 | hard fail |

## §7.3 ② 单元测试（200+ 用例 · vitest）

**14 Specialist 各 14 用例 = 196 用例**（模板）：

```typescript
// src/server/agents/specialists/CopywritingAgent.test.ts
describe('CopywritingAgent', () => {
  // 5 happy path（每 mode 1）
  it('step7 mode · 完整输入 · 输出含 hook/structure/cta', ...);
  it('free mode · 自由文案 · 5 元素 · 1500 字以内', ...);
  it('boom mode · 5 元素融合 · 5 篇候选', ...);
  it('acquisition mode · 含 CTA · 转化导向', ...);
  it('long output · 16KB 不截断 · 流式正确', ...);

  // 3 mode 分支边界
  it('mode 切换 · prompt 模板正确加载', ...);
  it('mode 不存在 · 抛 BAD_REQUEST', ...);
  it('mode + scriptType 组合非法 · 报错', ...);

  // 3 fallback / cold start
  it('cold start · evolution profile 空 · 走基础 prompt', ...);
  it('LLM timeout · 重试 1 次 · 降级 lightweight', ...);
  it('zod 校验失败 · is_fallback=true · 不抛错', ...);

  // 3 边界
  it('空输入 · 返回 BAD_REQUEST', ...);
  it('超长 topic(>200 字) · 截断到 200', ...);
  it('prompt 注入（用户输入含恶意 instruction）· 检测 + reject', ...);
});
```

其他单元（50+ 用例）：

| 模块 | 用例数 |
|---|:-:|
| ContextAssembler | 8 |
| LLMGateway（限流/熔断/降级/计费/重试） | 12 |
| 5 层记忆模块（L1~L5） | 10 |
| 工具函数（`src/lib/utils/`） | 20+ |
| zod schema（15 实体校验） | 15 |

**覆盖率门槛**：
- `src/server/agents/`：**≥90%**（核心）
- `src/server/workers/`：**≥85%**
- `src/lib/`：**≥95%**（工具函数）
- `src/hooks/`：**≥80%**
- 整体：**≥80%**

## §7.4 ③ 集成测试（40-60 用例 · vitest + supertest + 测试 DB）

| 测试对象 | 策略 | 数量 |
|---|---|:-:|
| 每个 tRPC procedure 端到端 | （成功+鉴权失败+限流+zod 错）×抽样 1/4 | 50+ |
| 5 条数据流 | 每条 1 happy + 1 错误恢复 | 10 |
| 多账号隔离 | 用户 A 不能读 B·切账号清缓存·RLS 强制 | 5 |
| LS↔DB 双写一致性 | 离线写·网络抖动·切账号·多 tab 冲突·乐观锁 | 6 |
| EvolutionAgent 飞轮 | 5+ 反馈触发·L1→L2·prompt 注入生效 | 4 |
| DailyTaskAgent Heartbeat | 0 点跑·冷启动模板·完整账号生成 | 3 |
| VoiceChatAgent 多轮 | 3 轮对话·L1 Buffer 写读·工具调用 | 3 |

测试 DB 策略：

```typescript
beforeAll(async () => {
  pgContainer = await new PostgreSqlContainer('postgres:16').start();
  await prisma.$migrateDeploy();
  await seed();  // 创 test user · test ip account
});
afterEach(async () => {
  await prisma.feedbackLog.deleteMany();
  await redis.flushdb();
});
```

## §7.5 ④ E2E 测试（8-10 用例 · playwright）

| 旅程 | 验证点 |
|---|---|
| 新用户 5 步主线：注册 → step1 → step3 → step3b → step4b → step7 | 5 步全跑·共享上下文正确 |
| 反馈飞轮闭环：5 次 👍 → 升 L2 → 重新 step7 含 evolution | LD-008 验证 |
| VoiceChat 多轮：3 句 → 挂断 → L1 Buffer 清空 | LD-006 L1 验证 |
| 8 步诊断：走完 → 7 维度报告 → 跳推荐 step | DiagnosisAgent 端到端 |
| 多账号切换：2 账号·切换·数据隔离+reload+预热 | LD-009+LD-010 |
| 设计还原：主页/step1/step3 截图 vs 设计稿 ≥80% 像素相似 | LD-015 |
| 降级路径：模拟 LLM timeout·降级到 lightweight+fallback 正确 | LD-014 |
| 多 tab 并发：同时改 step3 → 第二次 save 失败 + toast 提示 | R-13 验证 |

E2E 注意：
- admin spec 必加 `testIgnore` 或 `test.use({ baseURL: 'http://localhost:5174' })`（高频陷阱 #10）
- 默认走 fallback 路径（无真实 API key）·必须考虑 SSE chunks 模拟（高频陷阱·TD-82）

## §7.6 ⑤ LLM-as-Judge（质量评测层）

```typescript
// tests/judge/judge-runner.ts 共享 runner
export const JUDGE_CONFIG = {
  judgeModel: 'gpt-4o',  // 不同模型 judge·避免自我验证
  passThreshold: 4.0,    // 任一 Specialist < 4.0 → CI fail
  // 5 维度：结构完整性·内容相关性·风格一致性·实用价值·安全合规
};
```

**真闭环模式**（PRD-28 确立·TD-027 关闭）：

```typescript
// ✅ 真闭环（删 vi.mock·describe.skipIf 优雅 skip）
describe.skipIf(!process.env.ANTHROPIC_API_KEY)('XAgent LLM Judge', () => {
  it('judge 真调', async () => {
    const result = await runJudge(case_);
    expect(result.pass).toBeDefined();
  });
});

// ❌ 假闭环（vi.hoisted + beforeEach 固定值·永远 PASS 失效）
vi.mock('@/workers/llm-gateway', () => ({ llmGateway: { complete: vi.fn() } }));
```

100 金标准 dataset：
- `sally-30.json`：30 条·source='sally'·从 aiipznt 实测样本提取
- `custom-70.json`：70 条·14 specialist 按比例分布（CopywritingAgent=12, BrandingAgent=10 等）

跑频：
| 跑频 | 时机 |
|---|---|
| 完整 100 金标准 | 夜跑（每天）+ prompt 改动 PR |
| 抽样 20（快验） | 每个 PR（只跑改动相关 Specialist） |

命令：`pnpm test:llm-judge`·`pnpm test:llm-judge:diff`（改 prompt 后回归）

## §7.7 覆盖率配置（vitest.config.ts）

```typescript
coverage: {
  provider: 'v8',
  thresholds: {
    global: { lines: 80, functions: 80, branches: 75, statements: 80 },
    'src/server/agents/**': { lines: 90, functions: 90 },
    'src/lib/**': { lines: 95 },
  },
  exclude: ['**/*.test.ts', 'src/lib/constants/**']  // 常量不测覆盖
}
```

## §7.8 CI/CD 集成（GitHub Actions）

```yaml
# .github/workflows/ci.yml（节选）
on: [push, pull_request]
jobs:
  test:
    steps:
      - name: ① 静态
        run: pnpm typecheck && pnpm lint && pnpm schema:diff
      - name: ② 单元
        run: pnpm test:unit --coverage
      - name: ③ 集成
        run: pnpm test:integration
      - name: ⑥ 红线检测
        run: pnpm audit:redlines
      - name: ④ E2E
        run: pnpm test:e2e
      - name: ⑤ LLM Judge（只 PR·抽样 20）
        if: github.event_name == 'pull_request'
        run: pnpm test:llm-judge -- --sample 20

  llm-judge-full:
    if: github.event.schedule  # 夜跑
    steps:
      - run: pnpm test:llm-judge -- --full   # 跑 100 金标准
```

## §7.9 测试数据策略

| 数据类型 | 来源 |
|---|---|
| 测试用户 | `prisma/seed.ts` 创 3 个：`test_starter` · `test_opc` · `test_mcn` |
| 测试 IP 账号 | 每用户 1-3 个 fixture account（行业·平台·阶段不同） |
| 金标准 stepData | aiipznt 实测数据（脱敏后）+ 5 类生成场景 |
| PII 测试用例 | 故意带邮箱/手机/真实姓名·验证 mask 正确 |

## §7.10 step page unit test 必含要求（TD-093·红线级）

任何 step page 完整重写 US（Step{N}.tsx + OutputContent + constants）的 AC 中**必须**明确写 unit test 要求：

```
AC-x: TypeScript typecheck → 0 errors
AC-y: e2e tests · N tests PASS
AC-z: unit tests for [具体 component 名] → N tests PASS
```

admin page 单测：`vi.hoisted` + `adminTrpc mock` + `MemoryRouter` wrap·每 page 3 test minimum（①渲染不崩溃②loading state③onSuccess 数据渲染）。

## §7.11 测试金字塔"经济学"(为什么这样分配)

| 层 | 用例数 | 跑时 | 单用例发现 bug 价值 | 维护成本 |
|---|:-:|:-:|:-:|:-:|
| ① 静态 | 0(自动) | 1 min | 极高(类型 / lint) | 0 |
| ② 单元 | 200+ | 5 min | 高(覆盖最广) | 中 |
| ③ 集成 | 40-60 | 10 min | 中(组件交互) | 中高 |
| ④ E2E | 8-10 | 15 min | 高(真实路径) | 高(脆弱) |
| ⑤ LLM Judge | 100 | 30 min | 中(质量保证) | 中(prompt 改动维护) |

> 加起来 ~1 小时 CI · 跑完才合并 · 是产品质量基线。
