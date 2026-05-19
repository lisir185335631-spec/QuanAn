# QuanAn · Coding 3.0 启动前 HANDOFF 状态

> **创建** · 2026-05-07 · 上一会话 context 75% 触顶 · 写本文件给下一会话接续
> **当前阶段** · 开发就绪度 ≈ 50%(从全周期 PRR 20% 收窄到 DEV-READINESS 8 维度)
> **目标** · 跑完 8 项修复 + 7 件 P0 · 启动 PRD-1(P0 基础设施 · ralph daemon)
> **新会话操作** · `/prime` 加载本文件 + 9 文档体系 · 按 §3 顺序继续

---

## §1 当前状态(已完成的工作)

### 1.1 文档体系已就位(11 文档)

| 文档 | 行数 | 版本 | 关键修订 |
|---|:-:|:-:|---|
| ARCHITECTURE.md | 3257 | v0.4(头部仍写 v0.1 · 待修)| §1.4b 边界 + §2.5b 跳转 + §6.7 时序 6 + §9.X P9 25w 串行 |
| ADMIN-ARCHITECTURE.md | 1776 | v0.2(头部仍写 v0.1 · 待修)| §8.7 + §9.3 改单 daemon 串行 |
| AGENTS.md | 2591 | v0.2(头部仍写 v0.1 · 待修)| §10 admin 5 LD-A + 6 R-A + 14 高风险 + 5 audit_commands |
| ADR.md | 1779 | v0.2(头部仍写 v0.1 · 待修)| 加 ADR-019/020/021 |
| DATA-MODEL.md | 3579 | v0.2(头部仍写 v0.1 · 待修)| §13 admin 13 表 schema + RLS + 索引 |
| PROMPTS.md | 2340 | v0.1 | 14 Specialist prompt(未修改)|
| SCAFFOLD.md | 535 | v0.2(头部仍写 v0.1 · 待修)| §A monorepo 强制改造 |
| PRD-MASTER.md | 1827 | v0.2(头部 v0.1 · 待修)| 全链路 11 项修(35 反例 + 4 类 AC + 失败回滚 + 状态协议 + ownership 等) |
| ARCHITECTURE-REVIEW.md | 1223 | v0.1 | 上一轮诊断(已废弃部分结论)|
| DEV-READINESS.md | 701 | v0.2 | 从 PRR 收窄 · 只看开发期 · 8 维度 |
| README.md | ~140 | v0.1 | 项目入口 |

### 1.2 工具链 / 基础设施

- ✅ `~/.claude/playbooks/reject-examples.jsonl` · 35 条反例已写入(本会话跑 seed-reject-examples.sh)
- ✅ `pnpm 9.15.9` 已装(在 `~/.npm-global/bin/pnpm` · ~/.zshrc 已加 PATH)
- ✅ Node v24.15.0 · git 2.50 · jq 1.7 · Python 3.9 都装了
- ✅ **Homebrew 5.1.9 已装**(cunkai 清华大学源 · 2026-05-07 13:06)
- ✅ **PostgreSQL 16.13 已装 + 已启动**(`brew services list` 显示 started · LaunchAgent 自动启动)
  - 默认数据库 cluster · `/opt/homebrew/var/postgresql@16`
  - 默认 user 是 `return`(macOS 用户名)· 无密码 · 数据库名 `postgres`
  - DATABASE_URL 形如 · `postgresql://return@localhost:5432/quanan`(后续要 createdb quanan)
- ✅ **Redis 8.6.3 已装 + 已启动**(LaunchAgent 自动启动)
  - REDIS_URL · `redis://localhost:6379`
- ✅ `~/.claude/scripts/ralph/sync-to-project.sh` 真存在(供 P0-2 用)

### 1.3 项目内代码状态

- ✅ src/ 单包骨架(20 个文件 · 主要是占位)· 未拆 monorepo
- ✅ prisma/schema.prisma · 18 主应用 model · **缺 admin 13 表**
- ✅ tests/ 4 子目录占位(unit/integration/e2e/llm-judge)· 0 个 .test.ts
- ✅ vitest.config.ts + playwright.config.ts + tailwind.config.js + vite.config.ts 全配
- ✅ package.json 依赖 109 个 + 完整 scripts
- ✅ scripts/seed-reject-examples.sh 已 chmod +x · 已跑过
- 🔴 **没有 git 仓库(.git 不存在)**
- 🔴 **没有 docker-compose.yml**(README 提到 docker compose 但文件无)
- 🔴 **没有 .nvmrc / .gitattributes**
- 🔴 **没有项目级 CLAUDE.md**(只有 ~/.claude/CLAUDE.md 全局 + Ai_Agent/CLAUDE.md 桌面级)

---

## §2 9 角度排查发现的 8 个问题(未修)

| # | 优先级 | 问题 | 解决方 | 时长 |
|:-:|:-:|---|---|:-:|
| **A** | 🔴 P0 | pnpm 已装 ✅ — 这条已解决 | — | 0 |
| **B** | 🔴 P0 | **PG/Redis 装不上**(Homebrew 国内被墙)| 改用 Supabase + Upstash 远程(用户做)| 5-10 分钟 |
| **C** | 🔴 P0 | docker-compose.yml 不存在 | 我能 Write(但 Supabase 路线下不需要)| 0 / 5 分钟 |
| **D** | 🔴 P0 | 6 份文档头部版本号没改 | 我能 Edit | 10 分钟 |
| **E** | 🟠 P1 | 项目内没 CLAUDE.md | 我能 Write | 10 分钟 |
| **F** | 🟠 P1 | 没 .gitattributes / .nvmrc | 我能 Write | 5 分钟 |
| **G** | 🟡 P2 | DEV-READINESS §1 标题"16 维度" | 我能 Edit · 应改"8 维度" | 1 分钟 |
| **H** | 🟡 P2 | PRD-MASTER 24w 残留 | 都是 v0.1 历史标 · **故意保留** | 0 |

---

## §3 下一会话执行清单(顺序)

### 3.1 用户先做(★ 2026-05-07 v0.2 更新 · 已完成大部分)

```
✅ 已完成(无需重复)·
  · Homebrew 装好(清华源)
  · PostgreSQL 16.13 装好 + 启动
  · Redis 8.6.3 装好 + 启动
  · pnpm 9.15.9 装好

⏳ 仍需做(只剩 1 件 · 1 分钟)·
  · 创建项目数据库 ·
    createdb quanan        # 主开发库
    createdb quanan_test   # 测试库
    
  · 启用 pgvector 扩展 ·
    psql quanan -c "CREATE EXTENSION IF NOT EXISTS vector;"
    psql quanan_test -c "CREATE EXTENSION IF NOT EXISTS vector;"

(新会话可以用 Bash 跑这两步 · 不需要用户做 · 已纳入 §3.2 Step 0)
```

### 3.2 新会话做(8 项修复 + 7 件 P0)

按这个顺序:

```
Step 1 · 修 8 项问题(我做 · 30 分钟)
  D · 6 份文档头部版本号同步(ARCHITECTURE v0.1→v0.4 · ADMIN v0.1→v0.2 · AGENTS v0.1→v0.2 · ADR v0.1→v0.2 · DATA-MODEL v0.1→v0.2 · PRD-MASTER v0.1→v0.2 · SCAFFOLD v0.1→v0.2)
  E · 写项目级 CLAUDE.md(指向 Coding 3.0 + 知识库 + 项目特殊规则)
  F · 写 .gitattributes(LF 强制)+ .nvmrc(20)
  G · DEV-READINESS §1 标题"16 维度"→"8 维度"
  C · docker-compose.yml(若用户用 Supabase 路线 · 跳过)

Step 2 · 跑 7 件 P0(我做 · 1.5 天)
  P0-1 · git init + .gitignore(已有 .gitignore · 加 git init)
  P0-2 · sync ralph 工具链 · bash ~/.claude/scripts/ralph/sync-to-project.sh /Users/return/Desktop/QuanAn
  P0-3 · 拆 monorepo workspace(SCAFFOLD §A.3 10 步迁移)
  P0-4 · prisma schema 加 admin 13 表(从 DATA-MODEL §13 复制)
  P0-5 · prisma/migrations/manual_admin_rls.sql 创建
  P0-6 · scripts/ralph/switch-prd.sh 落地
  P0-7 · 写 tasks/prd-1.md(prd skill · P0 基础设施)

Step 3 · 启动 ralph daemon(我做)
  cp scripts/ralph/prd-1.json scripts/ralph/prd.json(prd skill 输出后)
  python scripts/ralph/ralph.py --model sonnet --daemon
  → 进入 PRD-1 实施(2 周本地 dev)

总时间 · 修 + 7 件 = ~2 天 · 然后开始 14 PRD 实施(25 周)
```

### 3.3 新会话启动指令(★ 2026-05-07 v0.2 更新)

新会话用这个指令开:

```
我是 QuanAn 项目的开发者 · 用户名 return · 项目在 /Users/return/Desktop/QuanAn

请按以下顺序工作:
1. 读 /Users/return/Desktop/QuanAn/HANDOFF.md 了解上一会话工作交接
2. 读 /Users/return/Desktop/QuanAn/DEV-READINESS.md 了解开发就绪度
3. 读 /Users/return/Desktop/QuanAn/PRD-MASTER.md 了解 PRD 体系
4. 按 HANDOFF.md §3.2 顺序 · 跑 Step 0(createdb)+ Step 1(8 项修复)+ Step 2(7 件 P0)+ Step 3(启动 ralph daemon)

环境状态(上一会话已就位)·
· pnpm 9.15.9 已装
· Homebrew 5.1.9 已装(清华源)
· PostgreSQL 16.13 已装 + 已启动(LaunchAgent 自动)
· Redis 8.6.3 已装 + 已启动
· reject-examples.jsonl 35 条已就位

你需要做什么(全部你能做 · 不需要我介入)·
· Step 0 · createdb quanan + quanan_test + 启 pgvector(2 分钟)
· Step 1 · 修 D/E/F/G 4 项文档(30 分钟 · C 跳过 · 本地 PG 不需 docker-compose)
· Step 2 · 跑 7 件 P0(1.5 天)
· Step 3 · 启动 ralph daemon
· 全程在场 review · 关键决策点拍板
```

---

## §4 用户方面要记住的事

### 4.1 决策已锁定的(不要改)

- 双 daemon 选 **方案 A 严格串行**(总 25w 而非并行 24w)
- ARCHITECTURE-driven PRD 模式(派生 + 4 类 AC 必含)
- 14 PRD 分配(主 9 + admin 5)
- 默认决策 5 项(admin 后续 / 重运营 / 三档角色 / super_admin MFA / 复用 Aurelian)

### 4.2 待你拍板的产品决策(实施期会问到)

- 套餐定价(Free 配额 / Pro 月费 / Enterprise 月费)
- Trending 抓取选哪家授权(P5 启动前)
- ICP 备案启动时机(上线前)
- 内容审核员招聘时机(P9.2 启动前)

### 4.3 全周期成本(开发期)

- LLM 成本 · ¥30-100K(主开支 · Ralph + Opus + LLM Judge)
- Supabase Free + Upstash Free · 0 元
- 其他 · 0 元(开发期不需要域名/商标/法务)
- 上线前另算(留 PRR)

---

## §5 关键文件位置

```
/Users/return/Desktop/QuanAn/
├── ARCHITECTURE.md       v0.4(主架构骨架)
├── ADMIN-ARCHITECTURE.md v0.2(admin 子系统)
├── AGENTS.md             v0.2(代码层约束)
├── ADR.md                v0.2(21 ADR)
├── DATA-MODEL.md         v0.2(31 实体)
├── PRD-MASTER.md         v0.2(PRD 总纲)
├── DEV-READINESS.md      v0.2(开发就绪度)
├── HANDOFF.md            ★ 本文件 · 接续指南
├── prisma/schema.prisma  18 model(待加 admin 13)
├── src/                  20 文件骨架(待拆 monorepo)
├── tests/                4 子目录(待写 .test.ts)
├── scripts/seed-reject-examples.sh  已 chmod +x · 已跑过
├── package.json          109 deps · pnpm@9 锁定
└── .env.example          模板(待填 Supabase + Upstash URL)

~/.claude/
├── scripts/ralph/sync-to-project.sh  ★ P0-2 用
├── scripts/ralph/ralph.py            ★ daemon 主体
├── playbooks/reject-examples.jsonl   ★ 35 条已就位
├── skills/prd/SKILL.md
├── skills/ralph/SKILL.md
└── commands/{prime,create-rules,goal-verify,prd-retro,monitor-ralph,plan-check}.md
```

---

> **本文件由 Claude(Opus 4.7)在 context 75% 触顶时写 · 用于无缝接续到下一会话 · 2026-05-07。**
