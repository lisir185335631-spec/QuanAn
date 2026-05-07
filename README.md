# QuanQn · AI IP 孵化平台

> AI 驱动的"个人 IP 孵化 + 变现加速"工具集 · 复刻 [aiipznt.vip](https://aiipznt.vip) + 引入知识库 Agent 哲学 + Aurelian Dark 重塑视觉。
>
> **善用 AI · 你一个人就是千军万马。**

---

## 文档体系(进项目先读这里)

| 文档 | 角色 | 何时读 |
|---|---|---|
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | 架构骨架(9 章 · 3022 行) | 入仓必读 · 知道整体设计 |
| **[AGENTS.md](AGENTS.md)** | 代码层约束(18 LD · 17 红线 · 测试 · 审计) | 写代码前必读 |
| **[ADR.md](ADR.md)** | 18 个架构决策详细 | 想知道"为什么这么设计"时读 |
| **[DATA-MODEL.md](DATA-MODEL.md)** | 完整 Prisma schema · 18 实体 · RLS | 改 schema 前必读 |
| **[PROMPTS.md](PROMPTS.md)** | 14 Specialist system prompt 模板 | 改 prompt 前必读 |
| **[SCAFFOLD.md](SCAFFOLD.md)** | src/ 目录索引 + 80 文件清单 | 找文件位置时查 |

---

## 快速启动(P0 之后)

```bash
# 1. 安装依赖
pnpm install

# 2. 准备环境变量
cp .env.example .env
# 编辑 .env · 填 DATABASE_URL / API keys / OAuth

# 3. 启动 Postgres + Redis(本地 Docker)
docker compose up -d

# 4. 跑 prisma migration + seed
pnpm db:migrate
pnpm db:seed

# 5. 启动开发环境
pnpm dev          # 前端 · http://localhost:5173
pnpm server       # 后端 · http://localhost:3000

# 6. 跑测试 + 审计
pnpm test
pnpm audit:redlines
```

---

## 项目结构速览

```
QuanQn/
├── ARCHITECTURE.md / AGENTS.md / ADR.md / ...     # 文档体系
├── prisma/                                        # DB schema
├── src/
│   ├── server/agents/                             # 14 Specialist
│   ├── server/workers/llm-gateway/                # LLM 网关(ADR-013)
│   ├── server/trpc/                               # 13 router
│   ├── server/memory/                             # 5 层记忆
│   ├── lib/constants/                             # 9 类常量
│   ├── lib/schemas/                               # zod 真理来源
│   └── pages/                                     # 34 路由
├── tests/                                         # 测试金字塔
└── scripts/                                       # 审计 + 构建
```

> 完整目录树见 [SCAFFOLD.md](SCAFFOLD.md)。

---

## 核心架构(一图速览)

```
┌──────────────────────────────────────────────────┐
│  L1 UI · React + Aurelian Dark(60+ 设计稿)     │
├──────────────────────────────────────────────────┤
│  L2 Hooks + L3 tRPC client                       │
├══════════════════════════════════════════════════┤
│  L4 Workflow Command(13 router · 50+ procedure) │
├──────────────────────────────────────────────────┤
│  L5 Agent 自治(VoiceChat · Evolution · DailyTask)│
├──────────────────────────────────────────────────┤
│  L6 Specialist · 14 个能力域 Agent              │
│     ContextAssembler(隐形枢纽 · 注入 prompt)   │
├──────────────────────────────────────────────────┤
│  L7 Worker(LLM Gateway · ImageGen · STT/TTS · …)│
├──────────────────────────────────────────────────┤
│  L8 Postgres + pgvector + Redis + S3            │
├──────────────────────────────────────────────────┤
│  L9 反馈飞轮 · 进化档案 · 配额 · Trace          │
└──────────────────────────────────────────────────┘
```

---

## 18 条 Locked Decisions(简版 · 详 [AGENTS §3](AGENTS.md))

1. 95% Workflow + 5% Agent
2. 14 能力域 Specialist(不按 URL 一对一)
3. Centralized + 软 Supervisor
4. 3 L5 自治走外部 Orchestrator
5. BaseSpecialist 五层配置
6. 五层记忆(Buffer / Core / Recall / Profile / Trending)
7. ContextAssembler 唯一 prompt 注入入口
8. 反馈飞轮 5 阶段 · EvolutionProfile 账号级
9. 多账号隔离 3 道闸(ORM + RLS + 命名空间)
10. LS↔DB 双写 4 规则
11. RAG 边界 · 30KB 常量 + pgvector
12. LLM Gateway 唯一 LLM 调用入口
13. zod 全栈 + trace_id 贯穿 + 类型严格
14. 错误恢复 + 原子事务
15. Aurelian Dark · YAML 权威
16. 测试金字塔 + LLM Judge ≥4.0
17. trending 走第三方授权 · 严禁自建爬虫
18. 行业合规 + PII 脱敏

---

## Coding 3.0 协同

按 [ARCHITECTURE.md §9.12](ARCHITECTURE.md) 启动:

```
Step 1 · /prime          → 加载本仓库上下文
Step 2 · /create-rules   → AGENTS.md(已就绪)
Step 3 · prd skill       → 写 P0 PRD
Step 4 · ralph skill     → PRD → prd.json
Step 5 · ralph.py        → Ralph 自主执行
       /monitor-ralph    → Opus 审计
Step 7 · /goal-verify    → 对照退出条件
```

---

## License

Private · 内部项目

---

## 修订记录

- **2026-05-06 v0.1** · 创建项目骨架 · 5 文件文档体系完成 · src/ 脚手架就绪
