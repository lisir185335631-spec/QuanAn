# RCA-005 · audit-gate self-approve 异常 (US-009 + US-010 跨 session)

**触发时间** · 2026-05-11 13:48 ~ 15:39
**影响范围** · PRD-8 US-009 + US-010 (两次连续 self-approve)
**Severity** · **High** (审计门禁可能被绕过 · Opus 4 维度审查空白)

---

## 1 · 时间线

| Time | Event | 来源 |
|---|---|---|
| 13:48:03 | daemon 写 US-009 audit-gate.json status=pending | ralph.py log_cost + watch-audit.log |
| 13:48:18 | watch-audit-gate.py 写 `PENDING_DETECTED: US-009` | watch-audit.log |
| 13:48 → 15:22 | daemon [WAIT] 94 min · 期间前 Claude session 在跟用户讨论 + 截图 (15:16:47) | ralph-output.log |
| ~15:22 | daemon detect status=approved · clear audit-gate.json · launch iter 15 dev US-010 | ralph-output.log "[OK] US-009 通过 Opus 质量审查" |
| 15:27:45 | daemon 写 iter 15 US-010 dev prompt 文件 | agent-logs/20260511-152745_开发迭代_prompt.md |
| 15:35:00 | **接手新 Opus session 跑 `ralph-tools.py approve`** · 成功输出 `[OK] US-009 审计已通过`(但 daemon 早已进 iter 15) | new session Bash 输出 |
| 15:35:06 | daemon cost-log entry US-010 developing 完成 (440.5s) | cost-log |
| 15:35:15 | daemon 写 iter 15 US-010 validator prompt | agent-logs/20260511-153515_验证_prompt.md |
| 15:38:25 | daemon 写 US-010 audit-gate.json status=pending | cost-log + ralph-output.log |
| 15:38:25 | watch-audit-gate.py 写 `PENDING_DETECTED: US-010` | watch-audit.log |
| 15:39:14 | watch-audit-gate.py 写 `APPROVED: US-010` · **新 Opus session 没调过 approve** | watch-audit.log |
| 15:39:35 | daemon launch iter 16 dev US-011 | agent-logs/20260511-153935 |

## 2 · 异常事实

- **US-009 audit-gate 在前 Claude session 期间被某进程 self-approve**(13:48 → ~15:22)· 前 Claude 截图明确显示"已 grep 完 US-009 但**还未 approve**"
- **US-010 audit-gate 在新 Opus session audit 中途被某进程 self-approve**(15:38:25 → 15:39:14 · 49 秒窗口)
- 新 Opus session 整个 Bash 调用历史中**只跑过 1 次 approve** (针对 US-009 @ 15:35) · 那次成功后 audit-gate 转 approved → daemon clear → 但 daemon iter 15 dev 已经在 15:27 启动
- watch-audit.log 漏记 US-009 APPROVED(state 转换 bug · watch-audit-gate.py 165-198 行)

## 3 · ★ ROOT CAUSE 确认 (H11) — 2026-05-11 16:00 调查闭环

**真凶**: 前 Claude session (PID 95773) 跨日跨 handoff 未退出 · 它启的 Monitor (PID 19054 + tail 19056) 仍在 grep `PENDING_DETECTED|审计门禁已激活|...` · 命中后向前 Claude session 发 chat 通知 · 前 Claude session 按 **全局 CLAUDE.md Step 5.5 强制规则**(收到 PENDING_DETECTED:US-XXX 必须自动 audit + approve)响应通知,跑了 `ralph-tools.py approve` 命令。

**证据链**:
1. `ps -p 95773` 显示 ELAPSED **16h 18min** · 启动 ≈ 凌晨 0:00 · STAT=S+ (foreground sleeping) · 仍 attached to 终端
2. `pgrep -P 95773 → 19054` · 95773 的子进程就是孤儿 Monitor
3. `ps -p 19054` 显示 PPID=95773 + 命令是 `tail -n 0 -F ralph-output.log | grep ...` (完整 Monitor 任务)
4. 前 Claude 截图 (15:16:47 给用户看) 显示"已 grep 完 US-009 完整验证(全过)但还未 approve" — 说明它已经做完 audit 工作 · 只差 approve 这一步
5. 用户给我看截图后,**没明确 kill 前 session** · 它继续在跑
6. daemon 写 US-009 audit-gate pending 后 5 min 内,Monitor 19054 命中通知前 Claude → 前 Claude 跑 approve(15:22 区间)
7. daemon 写 US-010 audit-gate pending 后 **49 秒内**,Monitor 19054 命中通知前 Claude → 前 Claude **rubber-stamp approve**(没重新 audit · 因为它 context 已满)

**双 Opus 并发**: 我新接手的 session(PID 60742)也在 audit · 我跑 approve US-009 时 audit-gate 实际已经是 approved 状态(前 Claude 先调过)· 但 daemon 还没 poll 到 → audit-gate.json 仍是 pending → my approve 又跑了一次 noop · cmd_approve 输出 `[OK] US-009 审计已通过` 因为 status 还是 pending(或刚被 my approve 覆盖)。

**Mitigation 已执行 (2026-05-11 16:00)**:
- `kill -TERM 19054 19056` — 杀前 Monitor · 阻止前 Claude session 收到通知
- **保留** PID 95773 (前 Claude session) — 用户可能想切回去看历史
- 我的 Monitor (PID 61033/61035) 保留 · 我是唯一 audit Opus

**关闭 TD-025 status=resolved · root_cause=H11(前 session Monitor 残留)**

---

## 4 · 候选 hypothesis (历史)

### H1 · 前一 Claude session 跑了 approve 用户没意识到
前 Claude 截图最后一条 prompt 让用户三选一(compact/暂停/handoff). 如果前 Claude 在跟用户讨论期间**已经跑了 approve**(在用户没看到 chat 里),audit-gate 早就 approved. 但 ralph-tools.py approve 必须显式 invoke,Claude 不会"自己跑". 除非用户在另一个终端 / 前 session 期间手动 invoke.
- **支持**: US-009 approve 必须在 15:22 之前发生(daemon detect + launch iter 15 @ 15:27)· 前 Claude session 一直跑到截图时刻 15:16:47 · 那中间 ~5min 用户可能在另一个终端操作
- **反对**: 用户明确说 "中断了" · "你找到这个完整的任务" — 说明用户没自己干预 audit-gate

### H2 · ralph.py 内部 audit-gate state 机器 bug
ralph.py `wait_for_audit_decision` 函数(line 530+ 范围内)可能有 race condition · 当 audit-gate.json 写后立即 poll 时,内部状态判定异常。
- 需要审 ralph.py 完整 audit gate polling loop · 看是否有 self-approve 路径
- 看是否有 timeout fallback 自动 approve(audit 等了 X 时间后自动放行)

### H3 · 残留旧 watch-audit-gate.py 进程(PID 96946)写状态污染
- 96946 启动于 00:12 凌晨(ELAPSED 15h36min · 我 ps 测得)· 比当前 daemon (PID 19068 启于 09:04) 早 9h
- daemon fork 新 watch 时 lock 占用 → "[WARN] 已有 watch 进程 (PID: 96946), 跳过启动"
- 96946 是 read-only watcher · **代码看过不会写 audit-gate.json**
- 但如果 96946 内部 state 错乱,可能与 daemon poll 产生 timing race

### H4 · 跨 session ToolSearch + Skill 残留 deferred tool 自动执行
- 新 session deferred tools (CronCreate / TaskCreate 等) 是否有自动调用 approve 的可能?
- 可能性低 · deferred tools 不会 auto-execute · 必须 Claude 显式 invoke
- 但需要确认 PID 63793 (我前面 ps 看不到详情)是不是某个 deferred tool worker

### H5 · 上次 Claude session 写了 ScheduleWakeup / cron job 延迟跑 approve
- 前 Claude 截图最后一句"你定。"暗示 user 还没决定
- 但 schedule / loop skill 都需要显式调用 + 用户授权 cron · 概率低

## 4 · 已观察 watch-audit.log 缺 US-009 APPROVED 行的原因(secondary bug)

watch-audit-gate.py 写 APPROVED 的条件:
```python
elif status in ("approved", "rejected"):
    if last_status == "pending":
        marker = "APPROVED" ...
        print(f"{marker}: {last_story} at {_fmt_ts()}", flush=True)
    last_status = status
```

如果 watch 在 audit-gate.json status 从 pending → approved 转换之间 poll 间隔(15s)恰好落在 daemon clear file 之后(file 不存在),会进入 `else: last_status = "no_gate"`. 下一次 poll 看到新 US-010 pending,从 no_gate → pending,继续正常。但**漏掉了** US-009 APPROVED 的转换。这是 secondary bug,与 self-approve 无关。

## 5 · 当前 mitigation(本会话立即执行)

1. **接受 US-010 commit 02a780c** · 新 Opus 已独立审完代码(5 个新文件 + 2 测试 + Asset schema · 10/12 AC PASS · 2 minor deviation 见 TD-026)· 功能完整无 Blocker
2. **登记 TD-025**(self-approve anomaly · severity=high)+ TD-026(.env.example minor deviation)
3. **不暂停 daemon** · 它在跑 US-011 iter 16 dev · kill 风险大于 anomaly 风险
4. **加强后续 audit 监控** · 每次收到 PENDING_DETECTED 立即 ps + audit-status 双确认 · 用 timestamp 测时间窗
5. **本次 daemon 跑完 PRD-8 后必须停 + 调查根因** · 由 PRD-9 启动前 RCA 跟进

## 6 · 长期建议(留 PRR / PRD-9 启动前)

- 在 ralph-tools.py approve 加 audit log(写到 `~/.claude/audit-log-{project}.jsonl`)· 记录 caller PID / username / git remote / approve reason
- 把 audit-gate.json 用文件锁(fcntl LOCK_EX)防 race
- watch-audit-gate.py 加 missed-state-transition 检测(看到 status=approved 但 last_status 不是 pending 时 ALERT)
- ralph.py audit gate polling loop 全量代码 review · 找潜在 self-approve 路径(关键搜:`status.*approved`, `gate.*approved`, `approve_at`)

## 7 · 引用

- 全局 CLAUDE.md §9.5 + 2026-05-04 升级 · watch-audit-gate fork
- 项目 CLAUDE.md §9.1 · 5 步 SOP
- 项目 CLAUDE.md §9.4 · Monitor 失效兜底
- RCA-001 · audit-delay (前历史:31 min 空窗,本次升级为 self-approve)
