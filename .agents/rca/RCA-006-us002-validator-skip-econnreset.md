# RCA-006 · US-002 dev iter 3 已 commit 但 Validator 未跑 · 后续 ECONNRESET 5 retry 误 BLOCK

> **PRD** · PRD-9(P8 知识库 + pgvector RAG)
> **Story** · US-002(67 案例 + 23 公式 + 22→23 元素 seed ingest)
> **发生时间** · 2026-05-11 20:16 ~ 21:40(共 5 iter retry · ~1h25min · daemon 自然 exit)
> **影响** · daemon 自然退出 · PRD-9 1/5(US-001 通过)+ 4 stories cascade blocked · 用户必须 Opus 手动审 + 重启
> **关联 RCA** · RCA-003 (US-012 ECONNRESET 同 pattern) + RCA-001 (audit cycle 通知延迟)

---

## 1 · 现象

| 迭代 | 开始 | 耗时 | 结果 | git commit | dev log bytes |
|:-:|---|:-:|---|---|:-:|
| 3 | 20:16 | ~19 min | dev success(stdout 0 byte buffer 异常)| **792e5d2 + b1e3a44 落地** | **0** |
| 4 | 20:46 | 30 min | timeout 1802s | (无)| 0 |
| 5 | 21:16 | < 2 min | health check 2 次失败 → crashed | (无)| - |
| 6 | 21:18 | < 2 min | health check 2 次失败 → crashed | (无)| - |
| 7 | 21:20 | 4 min | ECONNRESET | (无)| ~49 |
| 8 | 21:25 | 7 min 20s | ECONNRESET | (无)| ~49 |
| 9 | 21:33 | 6 min 30s | ECONNRESET | (无)| ~49 |

**末态** · `[BLOCK] US-002 已达到最大重试次数 (5)` + US-003/004/005 cascade blocked → audit-gate.json
status=blocked_needs_attention → daemon 自然 exit。

**Opus 审计实测** · 实现 9/10 AC OK · 1 个 lint+typecheck 错(因 scripts/ 不在 include 静默漏)+
1 个 doc-only drift(22→23 元素 · 数据源 SoT 是 23)。Opus 直 fix lint + 手动 approve · 详
audit-log-QuanQn.jsonl + progress.txt。

---

## 2 · 根因(3 层叠加)

### 2.1 root cause 1 · `apps/api/tsconfig.json` include 漏 scripts/

`include: ["src"]` 只覆盖 src · 新建的 `apps/api/scripts/seed-knowledge-chunk.ts` 不在 typecheck +
lint 扫描范围 · 19 个 lint 错(1 unused import + 6 import/order + 12 no-console)+ 1 typecheck 错
(unused Decimal)全部静默漏 · Validator 即使跑了也 0 错通过。但 `pnpm lint` workspace 级跑时
ESLint 抓到 parserOptions.project 矛盾 fail.

**Validator 视角**: dev 跑完没问题 · typecheck pass · 但 lint 一跑就炸 · Validator 报"全套测试通过"
还是"lint fail blocker"取决于 Validator 命令顺序 · 这一次 Validator 根本没跑(详 2.2)。

### 2.2 root cause 2 · iter 3 Validator 没跑(stdout buffer + skip 逻辑过激)

`scripts/ralph/agent-logs/20260511-201638_开发迭代.log` 0 bytes — claude CLI subprocess 实际有 commit
但 stdout 没 flush 到 log file。ralph.py 检测 "Agent 已 5 分钟无新输出 (日志: 0 bytes)" + 1802s 超时
触发 timeout `[SKIP] 开发 Agent 超时，跳过验证`。

iter 4 (20:46) 检测时间是 iter 3 的 30 min 后 · 实际 iter 3 dev 在 20:16-20:35 commit · 之后 15 min
应该是 Validator 时间 · 但 Validator 输入 prompt 在 stdout buffer 异常下也无法触发。Validator 完全
没跑 · 仍把"超时跳过验证"判定。

### 2.3 root cause 3 · ECONNRESET 3× retry 误升 retryCount

iter 7/8/9 是 Claude API 网络故障 · ralph.py 标 `[NET-ERR]` `attempt 2/3` `attempt 3/3` 不算 retryCount ·
但 attempt 3 用完后退到 retryCount++ · 加上 iter 4 timeout 已 retryCount=2 · iter 5/6 crash 各 +1 ·
iter 7/8/9 ECONNRESET +1 = 5 触发 blocked。

实际 iter 3 已 commit · daemon 不应该把 US-002 标 blocked(应该 force Validator 重跑然后判 PASS)。

---

## 3 · 修复(已 apply)

### 3.1 Opus 直 fix(commit 3d26b92)

- `apps/api/tsconfig.json` · include: `["src"]` → `["src", "scripts"]`
- `apps/api/scripts/seed-knowledge-chunk.ts` · 删 Decimal · 重排 import · 加 `eslint-disable no-console` · 改 header 注释 22→23

### 3.2 prd.json 手动 reset

- US-002 passes=true · retryCount=0 · blocked=false · notes=audit decision
- US-003/004/005 cascade unblock · retryCount=0 · blocked=false

### 3.3 audit-gate 归档 · audit-gate.json.bak.blocked_state_pre_opus_approve_*

---

## 4 · 改进建议(post-PRD-9 待评估)

### 4.1 H · ralph.py Validator force-rerun 条件

每个 story 启动 Validator 前 · 检查 `git log --since='1 hour' --grep='[<story_id>]'` 是否有 commit ·
**有则 force run Validator 不跳过** · 即使 dev log 0 bytes / timeout / health check fail · 也至少
跑一次 Validator 才能 retryCount++。

实施: ralph.py `_run_validator()` 加 `_has_recent_commit_for_story()` 前置 check。

### 4.2 M · 跨 workspace 新建脚本目录的 tsconfig include 自动化

新建 `apps/<x>/scripts/` 时 · ralph Agent 自动改 `apps/<x>/tsconfig.json` include 加 "scripts" · 防
静默漏审。可写到 CLAUDE.md 工程规范 · 或写一个 audit pre-check 验证所有 .ts 文件都被某个 tsconfig
include 覆盖。

实施: `scripts/ralph/audit-artifacts.py` 加 check_lint_coverage() · grep .ts files not in any tsconfig
include · 报警。

### 4.3 L · stdout buffer flush 强制(Claude CLI 子进程)

Claude CLI 子进程在 macOS pipe 上偶发 stdout buffer 不 flush · 导致 log 0 bytes 但实际产出 commit。
可尝试在 ralph.py spawn claude 时设 `bufsize=0` 或 PYTHONUNBUFFERED=1 强制 line buffering(虽然
PYTHONUNBUFFERED 只影响 python · claude CLI 是 Node.js · 需 NODE_NO_WARNINGS=1 + stdout flush hack)。

实施: ralph.py `_run_developer()` subprocess kwargs 加 `stderr=STDOUT, bufsize=1, universal_newlines=True`。

### 4.4 M · audit-gate `blocked_needs_attention` → `pending` 手动转换工具

Opus 审完 blocked story 想 approve 时 · 现状 audit-gate.json 是 `blocked_needs_attention` · 无法直接
`ralph-tools.py approve`(只接受 `pending`)。需要走 prd.json 手动 update path · 容易出错。

实施: ralph-tools.py 加 `cmd_force_approve(story_id)` · 跳过 audit-gate status check · 直接走 prd.json
update + audit log + clear audit-gate · 给 Opus 用。

---

## 5 · 沉淀到 Playbook(待 PRD-9 收官 retro 提)

- **Playbook P-3-新建工具脚本目录** · 任何子 workspace `apps/<x>/` 下新建 `scripts/` 目录的 PRD ·
  prd skill / ralph skill 必须在 anti_patterns 字段提醒 "确保 apps/<x>/tsconfig.json include 加
  'scripts'" · 否则 typecheck/lint 静默漏 19 错。

- **Playbook P-4-Validator 强制运行** · ralph.py Validator skip 条件须配 "git log 无 commit" AND
  "dev log 实际无产出" 双重 check · 单 stdout buffer 异常不应该跳过 Validator。

---

## 6 · 时间线

| 时间 | 事件 |
|---|---|
| 20:16 | iter 3 dev 启 · stdout buffer 异常 log 0 bytes |
| 20:35 | git commit 792e5d2(dev 实际成功)|
| 20:46 | iter 4 timeout 1802s · [SKIP] Validator |
| 20:52 | git commit b1e3a44(re-verify chore)|
| 21:16-21:20 | iter 5/6 health check 双失败 |
| 21:20-21:40 | iter 7/8/9 ECONNRESET 累积 retryCount → 5 |
| 21:40 | daemon 写 audit-gate(blocked) · 自然 exit |
| 22:00 | 用户截图 handoff · Opus 新 session 接手 |
| 22:01 | Step 5.0 SOP · kill 3 stale 进程(61033/61035/66360)|
| 22:09 | §0 4 项实测 + pnpm lint 抓到 1 个 静默漏审错 |
| 22:11 | Opus 直 fix · commit 3d26b92 |
| 22:14 | prd.json 手动 reset + audit-gate 归档 + audit log + progress.txt + TD-033/034 + RCA-006 |
| 待办 | Monitor + daemon 重启 接 US-003 |

---

## 7 · 验证

```
[OK] pnpm typecheck      → 6 workspaces 0 errors
[OK] pnpm lint --max-warnings=0 → 0 errors (修后 · commit 3d26b92)
[OK] pnpm test           → 876 passed | 4 skipped (94 test files) · 0 regression
[OK] SQL 实测            → knowledge_chunk_type_title_key UNIQUE + HNSW + vector(1536)
[OK] AC 10/10 PASS       → 详 progress.txt 2026-05-11 22:14 entry
[OK] TD 登记             → TD-033 (doc-drift) + TD-034 (env-gap)
[OK] Audit log           → ~/.claude/audit-log-QuanQn.jsonl 第 2 行 US-002 approved
```
