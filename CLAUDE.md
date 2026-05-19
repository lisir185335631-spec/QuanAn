# QuanAn · 项目级 AI 协作约束(CLAUDE.md)

> **版本** · v0.1(2026-05-07)
> **范围** · 本文件是 QuanAn 项目内 AI 协作的"短指令" · 跟全局 `~/.claude/CLAUDE.md` 互补
> · 全局 · 给 Coding 3.0 流程 / Ralph 守则 / 反例库注入机制
> · 本文 · 给本项目特殊事实(文档地图 / 当前阶段 / 数据库 URL / 范围排除)

---

## 1 · 项目身份

QuanAn 是基于 **aiipznt 复刻 + 升级** 的 IP 起号 / 内容创作 SaaS · 1.0 中文版 · 邀请制内测。

- **战略骨架** · ARCHITECTURE.md(v0.4 · 199K · 9 章)+ ADMIN-ARCHITECTURE.md(v0.2 · 114K · admin 子系统)
- **复刻基线** · aiipznt-spec.md(322K · 完整复刻规格)
- **设计哲学** · Aurelian Dark 视觉 · 14 Specialist 显式拓扑 · 5 层记忆 · LLM Gateway 多供应商
- **当前阶段** · P0 启动准备(实施 0%) · 距开始 PRD-1 跑 ralph daemon ≈ 1.5 天

---

## 2 · 文档地图(读取顺序)

| # | 文档 | 何时读 |
|:-:|---|---|
| 1 | [HANDOFF.md](HANDOFF.md) | 新会话第 1 个 · 看上一会话工作交接 |
| 2 | [DEV-READINESS.md](DEV-READINESS.md) | 第 2 个 · 看开发就绪度 8 维度 |
| 3 | [PRD-MASTER.md](PRD-MASTER.md) | 第 3 个 · 14 PRD 总纲 + 写作模板 + 35 反例 |
| 4 | [ARCHITECTURE.md](ARCHITECTURE.md) | 实施期常驻参考 · 业务模型 + 接口契约 + 9 Phase 路线 |
| 5 | [ADMIN-ARCHITECTURE.md](ADMIN-ARCHITECTURE.md) | admin PRD-10/11/12/13/14 启动后常读 |
| 6 | [AGENTS.md](AGENTS.md) | Ralph + Opus audit 必读 · 18 LD + 17 R 红线 + §10 admin 5 LD-A |
| 7 | [ADR.md](ADR.md) | 决策追溯 · 21 ADR(含 ADR-019/020/021) |
| 8 | [DATA-MODEL.md](DATA-MODEL.md) | 改 prisma schema 前必读 · §13 admin 13 表 |
| 9 | [PROMPTS.md](PROMPTS.md) | Specialist 实施时必读 · 14 prompt 模板 |
| 10 | [SCAFFOLD.md](SCAFFOLD.md) | P0-3 拆 monorepo 时必读 · §A.3 10 步迁移 |

---

## 3 · 本地 dev 环境(2026-05-07 已就位)

- **PostgreSQL** · 16.13(brew · LaunchAgent 自启)· `postgresql@16` started
- **Redis** · 8.6.3(brew · LaunchAgent 自启)
- **pgvector** · 0.8.0(source build for PG 16 · 已 CREATE EXTENSION)
- **数据库** ·
  - 主开发库 · `quanan` · DATABASE_URL = `postgresql://return@localhost:5432/quanan`
  - 测试库 · `quanan_test` · DATABASE_URL_TEST = `postgresql://return@localhost:5432/quanan_test`
- **Redis** · `redis://localhost:6379`
- **Node** · v24.15.0 + pnpm 9.15.9(全局 ~/.npm-global/bin/pnpm · ~/.zshrc 已加 PATH)

> ⚠️ 本地 dev 不需要域名 / OAuth / Supabase / Upstash · 那些是上线前 PRR 的事(留待 14 PRD 跑完后单独评估)。

---

## 4 · Coding 3.0 流程(指向全局)

完整流程见 `~/.claude/CLAUDE.md` 12 步。本项目当前阶段(P0 准备)关键工具:

- **prd skill** · 写 tasks/prd-N.md(/tasks/ 目录待 P0 创建)
- **ralph skill** · PRD → prd.json(注入 anti_patterns)
- **/plan-check** · prd.json 7 项质量门禁
- **scripts/ralph/ralph.py** · daemon 自主执行(`--model sonnet --daemon` 启动)
- **/monitor-ralph** · session-only · 每次新对话启 ralph 后必跑
- **/goal-verify** · §0 跑 /gsd-map-codebase × N 同步事实层 + 对账 AGENTS.md
- **/prd-retro** · 反哺 ~/.claude/playbooks/reject-examples.jsonl

Ralph 套件未到位 · P0-2 跑 `~/.claude/scripts/ralph/sync-to-project.sh /Users/return/Desktop/QuanAn` 一键同步。

---

## 5 · 红线(必读 · 引用 AGENTS § + ARCHITECTURE §)

### 5.1 工程红线(AGENTS.md §1.4 + §3 18 LD)

- ❌ 不允许暴露 `BASE_LLM_URL` / `LLM_API_KEY` 给前端(R-001)
- ❌ 主应用代码不允许直接读 admin 表 / 反之亦然(LD-A-1 + AGENTS §10)
- ❌ 不允许在 audit 表 UPDATE / DELETE(LD-A-3 · admin 审计仅 append)
- ❌ 不允许跳过 Audit Gate(全局 CLAUDE.md 零容忍)· 仅 `--no-audit-gate` 调试用
- ❌ 不允许 Mock 数据库做集成测试(LD-009)

### 5.2 前后端边界(ADR-019 + ARCHITECTURE §1.4b)

- 主应用 · `apps/web`(前端)+ `apps/api`(后端)· 独立部署
- admin · `apps/admin`(前端)+ `apps/api/admin/*`(后端 router)· 独立 OAuth + WAF + 子域名
- 共享 · `packages/{schemas,ui,clients}`

### 5.3 数据库红线(DATA-MODEL §9 RLS + §13.8)

- 主应用 18 表 · RLS 强制开启(per-tenant 隔离)
- admin 13 表 · RLS DISABLE(super_admin 跨账号查看)· 仅靠 6 闸鉴权链保护
- 改 schema 必须按"DATA-MODEL → prisma → migration → 实测"4 步顺序

### 5.4 1.0 不做(AGENTS §1.4)

- 多租户 / 团队协作
- 用户自带 LLM API Key
- 移动端 App / Native(仅 Web 响应式)
- 海外版 / 多语言(仅中文)
- 公开 API 给第三方
- 支付集成(暂用邀请制 · P9.4 后再做)

---

## 6 · 当前阶段特殊事项(2026-05-07)

### 6.1 8 项 Step 1 修复进度(HANDOFF §3.2)

| # | 状态 |
|:-:|:-:|
| A · pnpm 已装 | ✅ |
| B · PG / Redis / pgvector | ✅(2026-05-07 全部装好) |
| C · docker-compose.yml | ⏭️ 跳过(本地 PG 不需要) |
| D · 6 文档版本号 | ✅(2026-05-07) |
| E · 项目级 CLAUDE.md | ✅(本文件) |
| F · .gitattributes / .nvmrc | ✅(2026-05-07) |
| G · DEV-READINESS §1 标题 | ✅(2026-05-07) |
| H · PRD-MASTER 24w 残留 | 🟢 故意保留(v0.1 历史标) |

### 6.2 P0 7 件工作进度(HANDOFF §3.2)

由 ralph daemon 接管之前 · 由 Opus 主对话 + 用户 review 完成。详 HANDOFF.md。

### 6.3 反例库(全局 ~/.claude/playbooks/reject-examples.jsonl)

35 条已 seed(`scripts/seed-reject-examples.sh` 已 chmod +x · 已跑过)· 跨 PRD 跨项目共享。

---

## 7 · 跨开发事项(留 PRR · 不在本阶段)

> **不在 14 PRD 范围** · 全部留待主开发完成后单独评估:
> - 域名 quanan.com · ICP 备案 · 增值电信经营许可证(ICP-VAS)
> - Google OAuth / 微信 OAuth 应用申请
> - Trending 第三方授权(新榜 / 蝉妈妈 / 飞瓜)· P5 启动前必签
> - Vercel / Railway / 阿里云 RDS 部署
> - Sentry / OTel / Plausible 监控接入
> - 隐私政策 / 用户协议 文案
> - 商标 / 版权
> - 内容审核员招聘(P9.2 启动前)
> - 客服 / 工单 / 支付集成
> - 应急 / 灾备 SOP

详见 DEV-READINESS.md §1.3 折叠记录。

---

## 8 · 给 AI 助手的硬规则

1. **不绕过 Audit Gate** · ralph 写完 story 必走 `audit-gate.json(pending) → Opus 审 → approve/reject`
2. **PRD-1 / PRD-2 是 foundation** · 任何 reject_reason 都升级 high · 不允许 rubber-stamp(参全局 CLAUDE.md OPUS-AUDIT-CHEATSHEET)
3. **Edit 3 类文档前必读对应章节** · ARCHITECTURE / ADMIN-ARCHITECTURE / AGENTS · 改它们走 PRD-MASTER §3.10 实施期改动协议
4. **不假设我清楚自己想要** · 模糊时停下问 · 关键决策 4 类(套餐 / Trending / 备案时机 / 审核员)实施期会问到
5. **不打补丁** · 遇 bug 追根因 · 每个决策能回答"为什么"

---

## 9 · Ralph daemon 启动 SOP + Audit Monitor 硬规则(★ RCA-001 配套)

> **派生** · [.agents/rca/RCA-001-audit-delay.md](.agents/rca/RCA-001-audit-delay.md)
> **背景** · 2026-05-07 US-001 audit 等了 **31 分钟空窗** · 因为没启 Monitor · 系统通知没到 Opus
> **历史** · 全局 CLAUDE.md 已警告 PRD-3 US-001(2026-04-20)同类问题 · 现写硬规则不再容忍

### 9.1 启动 5 步 SOP(顺序不可调)

```
1. 确认 prd.json 就位
   · ls scripts/ralph/prd.json
   · python3 scripts/ralph/ralph-tools.py status  # 看 N stories PENDING

2. ★ 先启 Monitor(persistent=true · 订阅 ralph-output.log 关键事件)
   · 必须在启 daemon 之前!
   · Monitor 命令(用 Monitor 工具 · 不是 Bash)·
     command = tail -n 0 -F scripts/ralph/ralph-output.log 2>/dev/null \
              | grep -E --line-buffered \
                "PENDING_DETECTED|审计门禁已激活|APPROVED|REJECTED|\
                 所有任务已完成|All stories resolved|非零退出码|\
                 最大重试次数|级联阻断|通过 Opus 质量审查|⛔|Traceback|Error:"
     persistent = true
     timeout_ms = 3600000(1 小时 · 长跑用)

3. 启 ralph daemon
   · /Users/return/.local/bin/python3.11 scripts/ralph/ralph.py --model sonnet --daemon
   · ⚠️ Python 3.9 不行 · dashboard.py 用 3.10+ syntax · 必须用 python3.11

4. 等 Monitor 通知 PENDING_DETECTED:US-XXX
   · 通常 ralph 一个 story 5-30 分钟出 audit-gate
   · Monitor 命中关键词后立即给我发 chat 通知 · 不靠系统通知

5. 审完 → ralph-tools.py approve / reject → ralph 自动继续下一 story
```

### 9.2 红线(违反 = workflow 失败 · 不是技术失败)

- ❌ **不允许启 daemon 后不启 Monitor** · RCA-001 根因 · 任何借口都不允许
- ❌ **不允许靠"系统通知 + 屏幕前用户转告"** · 这是 31 分钟空窗的来源 · 用户离屏 / 没注意 · 链路就断
- ❌ **不允许把"等用户输入"当成"等 audit"** · 两件事是分开的 · 我可以等用户的同时让 Monitor 守 audit
- ❌ **不允许 ralph daemon 多实例并发** · 启动前必 pgrep -f ralph · 有残留 kill -9 + rm 旧 lock
- ❌ **不允许 prd.json 没 cp 自 prd-N.json 就启 daemon** · prd.json 是运行时副本 · prd-N.json 才是稳定源

### 9.3 Audit cycle 时间预算(monitoring 改进后)

| 阶段 | 预算 | 实测(US-001 改进前)| 目标(US-002+ 改进后) |
|---|:-:|:-:|:-:|
| ralph dev + validator | 5-30 min | 18 min(2 iter)| 同 |
| audit-gate write → Opus 通知 | < 30s | **31 min** ❌ | **< 30s** ✅ |
| Opus 审 + approve | 5-15 min | 5 min | 5-15 min |
| **总 cycle** | 10-45 min | **34 min** | **10-30 min** |

### 9.4 Monitor 失效兜底

如果 Monitor 任务挂了(timeout / 误 TaskStop)·
- pgrep -fa ralph 看 daemon + watch-audit-gate 是否还活
- python3 scripts/ralph/ralph-tools.py audit-status 手动查 audit-gate 状态
- 必要时 TaskStop 现 Monitor + 重新启一个

### 9.5 跨项目应用

本 §9 适用于**本项目所有 PRD**(PRD-1 到 PRD-14)· 不是只 PRD-1。每次启 ralph daemon 都跑 5 步 SOP。

未来跨项目复用 · 把本 §9 抽成全局 SOP 写到 ~/.claude/CLAUDE.md(待 v3 评估 · 留 PRR)。

---

### 9.6 Large Story 拆分硬规则(★ RCA-002 配套)

> **派生** · [.agents/rca/RCA-002-developer-timeout.md](.agents/rca/RCA-002-developer-timeout.md)
> **背景** · 2026-05-07 US-005(size=large)Developer 超时 3 次 · 90 min 0 输出 · 任务粒度太大
> **配合** · 全局 CLAUDE.md "Story 大小:第一规则 · 必须能在一次 Ralph 迭代完成"

#### 9.6.1 size_hint 决策表(prd skill 转 prd.json 时强制)

| 指标 | small | medium | **large(★ 必拆)** |
|---|:-:|:-:|:-:|
| AC 条数 | ≤ 5 | 6-9 | > 10(警告) |
| files_to_create | ≤ 5 | 6-12 | **> 12 · 必拆** |
| 描述长度 | 1 句 | 2-3 句 | 难用 3 句描述 → 必拆 |
| 涉及"+ 多组件"/"+ 多文件" | 否 | 边缘 | **是 · 必拆** |
| 涉及 e2e + impl 同 story | 否 | 否 | **是 · e2e 拆为独立 story** |
| 涉及 schema + impl + UI 同 story | 否 | 否 | **是 · 必拆 ≥3 子 story** |

#### 9.6.2 large story 触发响应(本项目本 PRD 起强制)

**prd skill 输出** · `size_hint=large` 必带警告:
```
⚠️ US-XXX size_hint=large · 违反 Story 大小第一规则
建议拆为 ≥ 3 子 story · 否则 ralph daemon 90% 概率超时
```

**ralph skill 转 prd.json** · 拒绝输出 large story · 提示 prd skill 重写。

**Opus 主对话(我)** · 看见 large story 主动 push back 给用户 · 不让进 ralph。

#### 9.6.3 prompt 字节阈值(防 stuck)

| prompt 字节 | 行为 |
|:-:|---|
| < 7K | ✅ 正常(US-001~004 实测 6-7K · 全部通过) |
| 7-10K | 🟡 监控(可能边界) |
| 10-12K | 🟠 警告 · 大概率 single round 跑不完 |
| **> 12K** | 🔴 **拒启 daemon** · ralph.py warning + abort · 强制 prd skill 重 split |

实测对照 · US-005 失败时 prompt **11.6K** · US-001~004 成功时 6-7K · 11K+ 是危险区。

#### 9.6.4 失败响应 SOP

ralph round 出现以下任一信号 · **立即** kill + 拆 story:
- "Agent 已 5 分钟无新输出"(stdout block-buffer 嫌疑或 claude hang)
- dev log 0 bytes 持续 > 5 min
- retryCount ≥ 2 同 story Developer 超时
- 单 story round ≥ 6(异常)

**不要** 让 ralph 跑到 max retry(5)再 blocked · 浪费 30+ min/round。

#### 9.6.5 失败 → 拆分 → 重启 流程(20 min 内完成)

```
0. ★ 必先做 · git log --since='10 minutes ago' --oneline · 看 ralph 是否已 commit
   · 如果有"feat: [US-XXX]" commit · ralph 实际 OK · 跳过 kill · 直接审 audit
   · 如果没 · 才进 kill 流程
   (TD-006 教训 · 2026-05-07 · 我误判 stuck 时 ralph 已 commit · 二次 fail-over 浪费 5 min)
1. kill 所有 ralph 进程 · pkill -9 -f ralph.py · pkill -9 -f "claude --print" · pkill -9 -f watch-audit
2. rm lock · rm -f scripts/ralph/ralph-lock.json scripts/ralph/audit-gate.json
3. 备份 prd.json · cp prd.json prd.json.bak.before-rca-XXX
4. 改 prd.json · 拆 large story · size_hint=medium · retryCount=0 · notes 加 [RCA-XXX] 标记
5. 写 RCA-XXX 文档 · .agents/rca/
6. 重启 daemon · 按 §9.1 5 步 SOP
```

#### 9.6.6 跨 PRD 应用

本 §9.6 是 PRD-1 → PRD-14 共通规则。每次新 PRD 用 prd skill 时 · 必须自检 size_hint=large 不存在(或拆完)。

---

> **本文件由 Claude(Opus 4.7)在 P0 启动期写 · 2026-05-07 · 跟全局 CLAUDE.md 互补使用。**
