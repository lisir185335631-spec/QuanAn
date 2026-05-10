# RCA-004 · ralph.py health-check timeout 5s 误杀健康 CLI

> **派生** · PRD-6 启动 · 2026-05-10 09:14
> **影响范围** · 跨 PRD(项目级 BUG · ralph.py 同步到所有项目)
> **关联 RCA** · RCA-001(audit-delay 31m)/ RCA-003(us012-econnreset claude hang)
> **状态** · ✅ 本项目 ralph.py 已修(timeout 5 → 20)· ⏭️ 全局 sync 留 PRR

---

## 1 · 现象

PRD-6 启动 daemon (5/10 09:11) → US-001 第 1 轮 retry 立即触发:

```
[WARN] claude CLI health check 失败 · sleep 60s 重试 1 次
[FAIL] claude CLI 2 次 health check 全失败 · 标记 crashed (避免 30 min hang)
[SKIP] 开发 Agent 崩溃,跳过验证,下一次迭代重试...
```

**5 次 retry 全部完全相同 fail pattern**(每次同 fail · 间隔 60s · 共 5 min 5 retry)→ 14 stories 级联 BLOCKED · audit-gate 写 needs_attention。

期初误判: 跟 PRD-5 RCA-003 同根因(claude --print 系统级 hang · 1-2h 内突变)。

---

## 2 · 根因(实证)

`ralph.py:119` 函数 `_check_claude_health(timeout: int = 5)`:

```python
def _check_claude_health(timeout: int = 5) -> bool:
    cmd = build_cmd()
    result = subprocess.run(
        cmd,
        input="Say only OK and nothing else.",
        text=True,
        timeout=timeout,        # ← 5 秒
        capture_output=True,
    )
    return result.returncode == 0 and "OK" in (result.stdout or "").upper()
```

**实测复现**(2026-05-10 09:13 · 同 Mac M3 + 同健康 CLI · perl alarm 模拟):

| Run | timeout | 结果 | 实际耗时 |
|:-:|:-:|:-:|:-:|
| 1 | 5s | **FAIL**(超时杀掉) | cpu 21% · 5.020s 被杀 |
| 2 | 5s warm | **FAIL**(超时杀掉) | cpu 21% · 5.016s 被杀 |
| 3 | 15s | **OK** | 10.730s 完整回 |
| 4 | 30s | **OK** | 10.011s 完整回 |

**根因 100% 明确**: claude --print "Say only OK and nothing else." cold start 真实需要 **~10 秒** 才回(Mac M3 健康 CLI),ralph.py 的 5s timeout **必然误杀**。

不是 claude CLI hang。不是 prompt 太大。不是任务复杂。**纯 ralph.py 配置错误**。

---

## 3 · 修复

`ralph.py:119` timeout 默认值 5 → **20**(2x 余量):

```diff
-def _check_claude_health(timeout: int = 5) -> bool:
-    """M-2 (PRD-5 RCA-003 教训): 5s 内 'say OK' 测试 · 防 claude --print 系统级 hang"""
+def _check_claude_health(timeout: int = 20) -> bool:
+    """M-2 + RCA-004 (PRD-6 2026-05-10): 20s 内 'say OK' 测试
+    · timeout 5s 在 PRD-6 实测会误杀 (claude --print cold start ≈ 10s)
+    · 20s 给 2x 余量 · 真 hang (>30 min) 仍能快速探测
+    """
```

**为什么 20s 不是 15 / 30**:
- 15s 仅 50% 余量(网络抖动可能 12-15s 边缘命中)
- 30s 太宽(真 hang 时探测变慢 · 30s × 2 retry = 60s 才 fail)
- **20s** = 真实 10s × 2 余量 · 真 hang 时 20s × 2 retry = 40s 探测完成 · 平衡点

---

## 4 · 跨 RCA 关联(教训对账)

| RCA | 现象 | 根因 | 修复 |
|---|---|---|---|
| RCA-001 | audit 31m 空窗 | Monitor 没启 + 系统通知没到 Opus | 项目 §9.1 SOP "先 Monitor · 后 daemon" |
| RCA-002 | US-005 large story 90m 0 输出 | size_hint=large 任务超粒度 | 项目 §9.6 拆分硬规则(AC>10 / files>12 必拆) |
| RCA-003 | US-012 claude --print 100% hang | 真 CLI 系统级 hang(1-2h 内突变) | M-2 health check 部署(本期暴露 5s 太紧) |
| **RCA-004** | **5 次 retry 全 fail · CLI 实际健康** | **timeout 5s 误杀 · 真实 10s** | **timeout 5 → 20** |

**关键发现**:RCA-003 的 M-2 修复(部署 health check)解决了真 hang 问题,**但 timeout 选 5s 又引入新 BUG** — RCA-004。这是典型的"修一个 bug 引入另一个"模式。

---

## 5 · 防再现

### 5.1 项目级(本次修)

- ralph.py timeout 5 → 20 ✅
- prd.json 14 stories reset(清 retry=5 残留)✅
- 重启 daemon 验证(5/10 09:14 daemon 正常进入 dev agent)✅

### 5.2 全局级(留 PRR · 跨项目)

- 同步本次 timeout fix 到 `~/.claude/scripts/ralph/ralph.py`(影响所有项目 · 同 BUG)
- 运行 `~/.claude/scripts/ralph/sync-to-project.sh <project>` 把改动推到现有项目
- **更新条件**: PRD-6 跑完 audit 验证修复有效 → 再 sync 全局(避免修复本身有 bug)

### 5.3 监控加固

- ralph.py 5 retry 全失败 + 全是 health-check fail 类型 → 应该自动 alert RCA-004(不是 RCA-003)
- 增加日志记录 health-check 实际耗时(if !pass) → 暴露 timeout 边缘
- ⏭️ 留 PRR(本期不动 ralph.py 内核)

---

## 6 · 复盘

**为什么 PRD-5 没踩到**:
- PRD-5 时 claude CLI 估计 ~3-5s cold start(系统状态轻 / 未 OAuth refresh / etc.)
- 5s timeout 边缘但没击穿
- PRD-6 时 cold start ~10s(可能 OAuth token refresh 慢 / 系统资源紧)
- 同 timeout 5s 击穿 → fail

**教训 · 配置默认值的"边缘安全"原则**:
- 任何 timeout / retry / 阈值配置 **必须 2x+ 余量**
- 5s 配 5s 真实耗时 = 0% 余量 = 必定边缘击穿
- 默认值 = 99% case 不触发 + 真异常时快速探测 — 不是为了"省时间"

**全局 CLAUDE.md 第 3 原则验证**: "遇到问题追根因,不打补丁。每个决策都要能回答'为什么'" — 本次根因找到 ralph.py 配置 BUG,fix 是改默认值不是加 try/except 兜底,符合原则。
