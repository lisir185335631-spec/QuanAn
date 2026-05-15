# RCA-006 · ralph.py AUDIT_TIMEOUT 自动跳过 audit · 永久最优方案

> **创建** · 2026-05-15 09:15 · Opus 深度分析 + 永久解决方案
> **触发事件** · PRD-14 US-003 + US-004 daemon 180 min audit timeout · 自动跳过 audit · status 标 passed 但 Opus 未真审
> **严重性** · ★★★ Critical(违反 CLAUDE.md "Audit Gate 零容忍"全局规约 · 跨所有项目跨所有 PRD 风险)

---

## §1 · 现象层

```
PRD-14 daemon (PID 54812) · 2026-05-14 22:23 启动
├─ 22:51 US-001 PENDING → 22:52 我 approve ✓
├─ 23:12 US-002 PENDING → 23:13 我 approve ✓
├─ 23:14 我 TaskStop Monitor · 建议新 session 接手(用户未立即开)
├─ ~23:35 US-003 PENDING → 等 180 min → ~02:35 自动跳过 ❌
├─ ~03:30 US-004 PENDING → 等 180 min → ~06:30 自动跳过 ❌(实际 7 iter · retry 3 · multiple self-fix)
├─ 07:07 US-005 PENDING → 09:08 我审 + approve ✓(挽救成功 · 距自动跳过 ~60 min)
└─ 09:10+ daemon 继续 US-006

dashboard 显示:
  US-003 ✅ 已通过 · [审计超时] 等待超过 180 分钟,自动跳过审计 (red text)
  US-004 ✅ 已通过 · [审计超时] 等待超过 180 分钟,自动跳过审计 (red text)
```

## §2 · Root Cause Analysis

### §2.1 代码层(ralph.py)

```python
# scripts/ralph/ralph.py
54:  AUDIT_TIMEOUT_SECONDS = 10800  # 3h · 2026-04-21 升级 "支持 high-risk 深审 + 中途修机制"

873: def wait_for_audit(story_id: str, timeout: int | None = None) -> str:
899:     # 超时保护:防止无限等待
900:     if elapsed >= max_wait:
901:         print(f"[WARN] 审计门禁等待超时 ({int(elapsed // 60)} 分钟),{story_id} 跳过审计继续执行")
902:         return "timeout"

948:     elif status == "pending":     # ★ ROOT CAUSE
949:         # wait_for_audit 返回 "timeout" 时,gate 仍为 pending
950:         # 记录超时事件,清除门禁,让 Ralph 继续(story 保持 passes=true)
951:         print(f"[ALARM] {story_id} 审计超时,保留当前状态继续执行")
...
957:         new_note = f"[审计超时] 等待超过 {AUDIT_TIMEOUT_SECONDS // 60} 分钟,自动跳过审计"
...
960:         clear_audit_gate()       # ★★ 关键 bug · clear pending · 强制 passes=true 继续
```

### §2.2 设计意图 vs 实际后果

| 维度 | 设计意图(2026-04-21 升级 commit message)| 实际后果 |
|---|---|---|
| 目标 | "支持 high-risk 深审 + 中途修机制" · escape hatch 防 daemon 永远卡死 | **silent skip audit** · status 标 passed · 跟 `--no-audit-gate` 调试模式等效 · 但 daemon 自动触发 |
| 显式 | `--no-audit-gate` 调试用 · 用户明确知道跳过 | timeout 用户不在场时自动触发 · 用户不知道 |
| 严格度 | 3h 设计为 Opus 充足审计时长 + retry buffer | 用户 离开后 3h 触发跳过 · 严格度 = 0 |

### §2.3 跟 CLAUDE.md 规约冲突(★ 核心问题)

**全局 CLAUDE.md §1.4 引文**(2026-04-13 配置):
> **零容忍原则**:没有一个 Story 可以跳过 Audit Gate。可用 `--no-audit-gate` 禁用(仅调试用)。

**ralph.py:899-902 + 948-960 实际行为**:
- timeout 触发 silent skip · 没有用 `--no-audit-gate` 显式标记
- 用户不知道发生 · audit-gate.json 被 clear · pending 状态丢失
- status 显示"已通过"误导(实际未真审)

**ralph SKILL.md / OPUS-AUDIT-CHEATSHEET 引文**(本 PRD 启动时):
> 不允许 rubber-stamp approve(PRD-4 Wave 1 实证: 7 rubber-stamp → 4 Warning + 5 Note)

ralph.py timeout 是"比 rubber-stamp 更糟"(rubber-stamp 至少 Opus 看过) · 这是 silent skip(完全不审)。

### §2.4 跨 PRD 风险评估(为什么 PRD-1~13 没发现)

- PRD-1~13 Opus 一直在场 audit · audit 都 ≤ 10 min · 远 < 3h
- PRD-13 retro F 后用户 close session · 不知道 daemon 还在跑
- PRD-14 是第一次 Opus session 真正离开 + daemon 长跑 · 触发 timeout
- **跨所有项目跨所有 PRD 都有此风险** · 只是触发概率低(Opus 通常在场)

---

## §3 · 5 个候选方案 · 优劣分析

| 方案 | 描述 | 优 | 劣 | 推荐 |
|:-:|---|---|---|:-:|
| **A** | 删除 AUDIT_TIMEOUT_SECONDS · 永远等 | 严格零容忍 · 不绕过 | daemon 死锁 · 占资源 · 无 escape | ❌ |
| **B** | timeout 后 daemon 退出 + audit-gate.json 保留 pending | 零容忍 + 不死锁 · 用户回来知道 stuck 在哪 | daemon 退出 · 用户必须手动重启 | ✅ 最优 |
| **C** | timeout 后狂发系统通知 · 持续 polling | daemon 不死 · 持续告警 | 仍依赖 Opus 主动 · 没解决根本 | ❌ |
| **D** | daemon 启动前校验 Opus session 在场 | 防"daemon 跑 Opus 不在"场景 | 不实用 · Opus session 不能 always 在场 | ❌ |
| **E** | 当前(silent skip · status passed) | escape hatch 防死锁 | **违反零容忍** · 跨 PRD 风险 | ❌ 现状 必修 |

---

## §4 · 最优方案 · 方案 B 详细设计

### §4.1 核心思想

> **timeout 行为从 "silent skip + 标 passed" 改为 "daemon 退出 + audit-gate.json 保留 pending"**

这样既能:
- ✅ 严格 Audit Gate 零容忍(不绕过)
- ✅ 不死锁(daemon 退出 · 不阻塞资源)
- ✅ 用户回来时知道 stuck 在 US-X(audit-gate.json 仍 pending · ralph-tools.py audit-status 显示)
- ✅ 用户介入选项:approve / reject / force-reject / 重启 daemon · 全自由

### §4.2 ralph.py 改动 diff

```diff
# ralph.py:54
- AUDIT_TIMEOUT_SECONDS = 10800      # 审计门禁超时:3 小时
+ AUDIT_TIMEOUT_SECONDS = 10800      # 审计门禁超时:3 小时(timeout 后 daemon 退出 · 不绕过)
+ # 2026-05-15 RCA-006 修复:timeout 不再 silent skip · daemon 退出 · audit-gate.json 保留 pending
+ # 用户介入后可 ralph-tools.py approve / reject / force-reject · 或重启 daemon

# ralph.py:873-902 wait_for_audit
  def wait_for_audit(story_id: str, timeout: int | None = None) -> str:
      """
-     轮询 audit-gate.json,等待 Opus 写入 approved 或 rejected。
-     返回 "approved"、"rejected" 或 "timeout"。
+     轮询 audit-gate.json,等待 Opus 写入 approved 或 rejected。
+     返回 "approved" 或 "rejected"。
+     timeout 触发 raise AuditTimeoutError · daemon 必须退出(不再 silent skip)
+     RCA-006 修复(2026-05-15):零容忍 · 不再返 "timeout"
      """
      ...
      # 超时保护
      if elapsed >= max_wait:
-         print(f"[WARN] 审计门禁等待超时 ({int(elapsed // 60)} 分钟),{story_id} 跳过审计继续执行")
-         return "timeout"
+         elapsed_min = int(elapsed // 60)
+         print(f"[CRITICAL] 审计门禁等待超时 ({elapsed_min} 分钟) · {story_id} 必须 manual review")
+         print(f"            audit-gate.json 保留 pending · 用户可:")
+         print(f"            1. python scripts/ralph/ralph-tools.py approve / reject 后重启 daemon")
+         print(f"            2. 或直接 force-reject 让 daemon retry")
+         raise AuditTimeoutError(
+             f"Audit timeout for {story_id} after {elapsed_min}min · daemon must exit (zero-tolerance)"
+         )

# ralph.py 新加 (file 顶部)
+ class AuditTimeoutError(Exception):
+     """RCA-006 修复 · daemon 必须退出 · 不绕过 audit"""
+     pass

# ralph.py:907-960 handle_audit_result
  def handle_audit_result(story_id: str) -> None:
      ...
-     elif status == "pending":
-         # wait_for_audit 返回 "timeout" 时,gate 仍为 pending
-         # 记录超时事件,清除门禁,让 Ralph 继续(story 保持 passes=true)
-         print(f"[ALARM] {story_id} 审计超时,保留当前状态继续执行")
-         prd = read_prd()
-         if prd:
-             s = get_story_by_id(prd, story_id)
-             if s:
-                 existing_notes = s.get("notes", "").strip()
-                 new_note = f"[审计超时] 等待超过 {AUDIT_TIMEOUT_SECONDS // 60} 分钟,自动跳过审计"
-                 s["notes"] = f"{existing_notes}\n{new_note}".strip() if existing_notes else new_note
-                 write_prd_safe(prd)
-         clear_audit_gate()
+     # RCA-006 修复:status='pending' 不再处理(daemon 已 raise AuditTimeoutError 退出)
+     # audit-gate.json 保留 pending · 用户介入后重启 daemon

# ralph.py 主流程 main 函数(找到 wait_for_audit 调用处)
  ...
- audit_result = wait_for_audit(story_id, timeout=AUDIT_TIMEOUT_SECONDS)
- handle_audit_result(story_id)
+ try:
+     audit_result = wait_for_audit(story_id, timeout=AUDIT_TIMEOUT_SECONDS)
+     handle_audit_result(story_id)
+ except AuditTimeoutError as e:
+     logger.critical(str(e))
+     # 写 progress.txt 记录退出原因
+     append_progress(f"\n## {now()} - {story_id} · [DAEMON EXIT] {e}\n")
+     # daemon 退出 · 用户必须介入(audit-gate.json 保留 pending)
+     sys.exit(2)  # exit code 2 表示 audit timeout 退出
```

### §4.3 dashboard.py 改动(避免误导显示)

```diff
# dashboard.py · 检测 status='pending' + (now - timestamp) > AUDIT_TIMEOUT
+ def is_audit_stuck(audit_gate):
+     """判断 audit-gate.json 是否 stuck(daemon 已退出)"""
+     if audit_gate.get('status') != 'pending':
+         return False
+     elapsed = time.time() - parse_iso(audit_gate['timestamp']).timestamp()
+     return elapsed > AUDIT_TIMEOUT_SECONDS

# UI 显示
- # 当前: status='passed' + [审计超时] 红字 (误导)
- # 改为:
+ "审计 stuck"  # 紫色 badge
+ subtitle: "daemon 已退出 · 用户必须 ralph-tools.py approve/reject 后重启 daemon"
```

### §4.4 CLAUDE.md §9 升级(全局 SOP)

```diff
# ~/.claude/CLAUDE.md §9.4 Monitor 失效兜底
+ ### 9.6 ★ Audit Timeout Recovery SOP(RCA-006 配套 · 2026-05-15 新增 · 全局永久生效)
+
+ ralph.py AUDIT_TIMEOUT_SECONDS=10800 (3h) timeout 后 daemon 退出(零容忍 · 不绕过 audit)。
+ 用户回到 stale daemon 看到 daemon 已退出 + audit-gate.json 保留 pending 时,3 选 1:
+
+ 1. Manual audit · 跑 OPUS-AUDIT-CHEATSHEET 5 步审 audit-gate.json 中 story_id · 然后:
+    - 通过 → ralph-tools.py approve · 重启 daemon
+    - 驳回 → ralph-tools.py reject "反馈" · 重启 daemon · daemon retry
+
+ 2. Force-reject(只验证代码大致 OK 但不想深审)· ralph-tools.py force-reject "RCA-006: 审计超时,重新审" · 重启 daemon
+
+ 3. 彻底放弃此 story · ralph-tools.py block US-N "原因" · 重启 daemon · 跳过此 story
+
+ ★ 不允许 · 直接重启 daemon 不审(等于继续 silent skip · 违反 RCA-006 修复初衷)
```

### §4.5 立即措施(PRD-14 当前状态修复)

**US-003 + US-004 处理**(daemon 已 silent skip · 必须补审):

```bash
# 立即(在新 session 接手时):
# 1. 补审 US-003 (commit f9efdee · 自动停损 cron · high 档)
#    - 跑 OPUS-AUDIT-CHEATSHEET 5 步
#    - 重点反例 #2 stop_loser 双条件 (pValue<0.05 AND effect<-30%)
#    - 重点 dedupe per experimentId per day
#    - 通过 → 在 progress.txt 写 "[RCA-006 补审] US-003 通过 · ralph-tools.py 无需 approve(audit-gate.json 已 cleared)"
#    - 不通过 → 登记 TD-XXX · evaluate 是否回滚 commit f9efdee
#
# 2. 补审 US-004 (commits 6db0a2b + 29007df · admin UI · high+large · retry 3)
#    - 跑 OPUS-AUDIT-CHEATSHEET 5 步
#    - 重点反例 #1 trafficAllocation sum=100 双校验
#    - 重点反例 #2 一键停损 super_admin only 双层守护
#    - 通过 → progress.txt 备注 补审
#    - 不通过 → 登记 TD-XXX
```

---

## §5 · 实施路径(3 阶段)

### §5.1 阶段 1 · 即时修复(本项目 · 1 commit)

```bash
# 1. 修 scripts/ralph/ralph.py · 按 §4.2 diff apply
# 2. 修 scripts/ralph/dashboard.py · 按 §4.3 diff apply
# 3. 跑 python3 scripts/ralph/ralph-tools.py validate · verify schema not break
# 4. git commit -m "fix: [RCA-006] audit timeout 不再 silent skip · daemon 退出零容忍

  - ralph.py · timeout 触发 AuditTimeoutError · daemon sys.exit(2)
  - audit-gate.json 保留 pending · 用户介入后重启 daemon
  - dashboard.py · 'audit stuck' 紫色 badge 代替 '已通过 + 红字 [审计超时]' 误导
  - 跟 CLAUDE.md §1.4 零容忍原则严格对齐

  PRD-14 US-003/004 silent skip 已发生 · 等用户开新 session 补审"
```

### §5.2 阶段 2 · 全局升级(`~/.claude/CLAUDE.md` · 1 commit)

```bash
# 1. 修 ~/.claude/CLAUDE.md · 加 §9.6 Audit Timeout Recovery SOP
# 2. 修 ~/.claude/scripts/ralph/ralph.py · 同 §4.2 diff(主源 · 后续 sync 到所有项目)
# 3. 修 ~/.claude/scripts/ralph/dashboard.py · 同 §4.3
# 4. 跑 ~/.claude/scripts/ralph/sync-to-project.sh <project>(其他存在的项目 sync 升级)
```

### §5.3 阶段 3 · 跨 PRD 追溯(PRD-14 当前补审 + 文档回流)

```bash
# 1. 新 session 补审 US-003 + US-004 (走 OPUS-AUDIT-CHEATSHEET 5 步)
# 2. 登记 TD-062 RCA-006 类 ralph.py 设计冲突 · status=resolved (本 fix 修了)
# 3. PRD-14 retro 时 · 加 §X 反向发现 · "RCA-006 daemon timeout silent skip"
# 4. PRD-14 commit message 加 [RCA-006 补审] tag for US-003/004
```

---

## §6 · 风险与权衡

| 风险 | 缓解 |
|---|---|
| daemon timeout 退出后用户回来 confused | dashboard 紫色 badge 明确 + ralph-tools.py audit-status 显示 + CLAUDE.md §9.6 SOP 清晰 |
| 用户故意 long-running daemon 但不想守 | 仍可用 `--no-audit-gate` 调试模式(原有 escape hatch · 用户显式启用) |
| 重启 daemon 后从哪开始 | ralph.py 内置崩溃恢复 · 读 ralph-lock.json + audit-gate.json · 自动从 stuck story 恢复 |
| sync-to-project.sh 是否覆盖其他项目 ralph.py 改动 | 跑前先 `git diff` 比对 · 决定是否 merge · sync 是 1-shot 安全操作 |

---

## §7 · 跨 PRD 复用价值

**本 RCA + 永久方案是跨所有项目跨所有 PRD 的元升级**:
- 影响范围 · 全 14 PRD 历史项目(任一 daemon 长跑都可能触发 timeout)
- 影响时长 · 永久(2026-04-21 升级以来一直存在 · 本次 RCA 是首次实证暴露)
- 复用价值 · 升级后所有 future PRD 都不再受 silent skip 风险

**类似过去 RCA 比较**:
- RCA-001(2026-05-07)· Monitor 没启 · 31 min 空窗 · 已修复 SOP §9.1
- RCA-002(2026-05-07)· Large story timeout · 已修复 SOP §9.6 拆分规则
- RCA-005(2026-05-11)· 跨 session race · 已修复 SOP §5.0.1 stale cleanup
- **RCA-006**(2026-05-15)· daemon timeout silent skip · 本方案 · 永久最优

---

## §8 · 结论

**最优方案 = §4.2 ralph.py + §4.3 dashboard.py + §4.4 CLAUDE.md §9.6**

```
代码 1 commit (本项目)+ 1 commit (~/.claude/ 全局)+ 文档回流
= 永久解决 silent skip 问题
+ 严格遵守 CLAUDE.md 零容忍原则
+ 不死锁(daemon 退出 · 用户自由介入)
+ 跨所有项目跨所有 PRD 一次性升级
```

**等用户授权后 · 我可直接 apply 阶段 1(本项目修复)+ 阶段 2(全局升级)+ 阶段 3(PRD-14 当前补审)**。

---

> **本 RCA 由 Opus 4.7 在 2026-05-15 09:15 写 · 完整分析 · 等用户决策 implement**
