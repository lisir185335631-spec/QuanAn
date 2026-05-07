# RCA-001 · US-001 audit-gate 等待 31 分钟根因分析

> **创建** · 2026-05-07 21:15(US-001 approve 后用户反馈触发)
> **影响** · US-001 audit-gate.json(pending) 在 20:35 写入 · 直到 21:06 才被 Opus approve · **空窗 31 分钟**
> **根本类别** · 通信架构断链 · 跨 process 通知接收方错位
> **历史先例** · 全局 CLAUDE.md "PRD-3 US-001 案例教训(2026-04-20)" 已警告同类问题 · 本次再犯说明规则未硬化

---

## §1 时间线还原(精确证据)

| 时间(2026-05-07) | 事件 | 来源 |
|---|---|---|
| 20:13 | ralph daemon 第 1 次启动(异常 · 被我 kill) | ralph-output.log |
| 20:16 | ralph daemon 第 2 次启动(并发冲突) | ralph-output.log |
| 20:17 | ralph daemon 第 3 次启动(干净 · PID 14032)| stdout |
| 20:17 | watch-audit-gate.py 启动(PID 14034 · interval=15s)| ~/.claude/watch-audit.log |
| 20:17 | iter 1 prompt 6604 字符写入 agent-logs | ralph-output.log |
| 20:22:11 | iter 1 commit 3c392dc(主修复 · @/server→@/workers + tsconfig + bug 修)| git log |
| 20:26 | iter 2 started | ralph-output.log |
| 20:30:02 | iter 2 commit 7bc096b(vitest passWithNoTests + tests/setup.ts)| git log |
| **20:35:24** | **ralph 写 audit-gate.json(status=pending)** | jq audit-gate |
| **20:35:24** | **watch-audit-gate.py 在 5s 内检测到 PENDING + 发系统通知**(macOS osascript notification + say "Glass")| ~/.claude/watch-audit.log |
| 20:35-21:03 | **🔴 28 分钟空窗 · audit-gate 持续 pending · 无任何响应** | — |
| 21:03:29 | 用户截图 dashboard 显示 "等待 Opus 质量审查 · US-001 · Round 2 · 28m" | 用户反馈 |
| 21:04:00 | Opus(我)开始 audit · 跑 §0 实测 · 5 步 Cheat Sheet | 当前会话 |
| 21:06:54 | Opus approve · ralph-tools.py approve | watch-audit log |
| 21:07:17 | git commit cc00de3(audit 报告)| git log |

**实审耗时** · 5 分钟(21:04 → 21:09)
**等待空窗** · 28-31 分钟(20:35 → 21:04)
**完整 audit cycle** · 33-34 分钟(本应 5-10 分钟)

---

## §2 多角度根因分析

### §2.1 角度 A · 通信架构断链(★ 根本原因)

设计意图的通信链路 ·
```
ralph.py daemon
    ↓ 写文件
audit-gate.json (status=pending)
    ↓ 5-15s 轮询
watch-audit-gate.py
    ↓ 系统调用
macOS osascript / Linux notify-send / Windows beep
    ↓ 显示给
[屏幕前的用户]
    ↓ 用户必须主动转告
Claude Code 主对话(Opus)
    ↓ 审 + approve
ralph-tools.py approve
    ↓ 写文件
audit-gate.json (status=approved)
    ↓ 30s 轮询
ralph.py daemon
    → 进入下个 story
```

**断链点** · "屏幕前的用户必须主动转告 Opus"
- 用户离开屏幕 / 没注意通知 / 没意识到要主动报 → 链路断
- 即便用户在 · 中间多了 1-2 步人工干预 · 增加 5-30 分钟延迟
- 这是 **同步阻塞型架构** · 但人是 async resource

### §2.2 角度 B · Opus 主对话无 background poll 能力

**事实** · Claude Code 主对话(我)是 reactive 模式
- 我做完一个任务 · 等用户输入 · 不会自己 idle poll
- 我没有"持续 background 进程" · 不像 ralph daemon 能后台跑
- 我能 Bash --background · 但单次任务 · 完成才发 task-completion notification

**结论** · 我没法主动 poll audit-gate.json · 必须依赖外部触发

### §2.3 角度 C · Monitor 工具未启动(★ 直接原因)

全局 CLAUDE.md 已明文强制 ·
> "Step 5.1 · `/monitor-ralph` → **立即启动自动审查监测(强制,session 级)**"
> "⚠️ Monitor 是 session-only · **每次新对话 session 启动 Ralph 后必须重跑 /monitor-ralph**"
> "否则 Opus 会被动等待, 浪费 1 小时(**PRD-3 US-001 案例教训 — 2026-04-20**)"

**我犯了什么错** ·
- 启 ralph daemon 后 · **没启 Monitor**
- /monitor-ralph 是 user-invocable skill · 我作为 AI 不能主动 invoke
- 但我可以**直接用 Monitor 工具**(等价于 /monitor-ralph 的核心命令)
- 我没用 · 因为 Monitor 是 deferred 工具 · 需 ToolSearch 加载 · 我没主动加载

**根本原因** · 我把"系统通知"当成了通信链路的最后一环 · 但其实它是给"用户"的 · 不是给"Opus 主对话"的

### §2.4 角度 D · 通知机制设计缺陷

watch-audit-gate.py 只发**系统通知**(macOS osascript / Linux notify-send / Windows beep) ·
- 这些通知都到 OS Notification Center · 屏幕前才能看到
- AI 主对话(在 Claude Code CLI 里)不接收 OS 级通知
- 缺少"AI agent-readable" 的事件流

**修补方案** ·
- ralph-output.log 已经写 PENDING_DETECTED 字符串(grep 实测确认)
- Monitor 工具能 stream 这个 log · 检测到关键词立即给我发通知
- **链路应该是 · ralph 写 log → Monitor 流监 → Opus(我) 主对话收到 → 立刻审**

### §2.5 角度 E · 项目级 CLAUDE.md 缺硬规则

**事实** · 项目级 CLAUDE.md(我之前写的)只在 §4 提了一句 ·
> "/monitor-ralph · session-only · 每次新对话启 ralph 后必跑"

但没硬性写成红线 · 没说"必须在启 daemon 后 30 秒内启 Monitor"。

**修补** · 加专门的 §9 章节 · audit-monitor 硬规则 + 启动 SOP。

### §2.6 角度 F · 启动 SOP 顺序错误

**正确 SOP**(应该的) ·
```
1. cp prd-N.json prd.json
2. 启 Monitor(订阅 ralph-output.log PENDING_DETECTED)★ 必须先于 daemon
3. python ralph.py --model sonnet --daemon
4. 等 ralph 自动跑 → Monitor 自动检测 → Opus 自动审
```

**实际 SOP**(我做的) ·
```
1. cp prd-1.json prd.json ✅
2. python ralph.py --model sonnet --daemon ✅
3. 报告状态 + 等用户输入 🔴 ← 这里错了
4. 应该先启 Monitor!
```

### §2.7 历史先例(2026-04-20 PRD-3 US-001)

全局 CLAUDE.md 引用 ·
> "PRD-3 US-001 案例教训 — 2026-04-20"
> "Opus 会被动等待, 浪费 1 小时"

这次 31 分钟空窗 · **同类问题第 2 次发生**。说明:
- 现有"提醒型规则"不够硬 · 没有"启 daemon 不启 Monitor 就 fail" 的 enforce 机制
- 跨项目的教训没有跨项目机制传承 · 每个项目都得"自己再学一次"

---

## §3 全链路解决方案(分级)

### §3.1 立即可做(本会话剩余 6 个 US 全用)

**SOL-A · Monitor 工具持续监控 ralph-output.log(★ 已做)**
- 启 Monitor `tail -n 0 -F scripts/ralph/ralph-output.log | grep -E --line-buffered "PENDING_DETECTED|审计门禁已激活|APPROVED|REJECTED|所有任务已完成|非零退出码|最大重试次数|级联阻断|⛔|Traceback|Error:"`
- persistent=true · 持续到会话结束 / TaskStop
- 每次匹配行进来 · 我**立即**收到通知 · 立即审

**实施记录** · 21:13 启 Monitor task b1ai5q0xq

**SOL-B · 项目 CLAUDE.md 加硬规则(★ 本 RCA 配套做)**
- 加 §9 "Ralph daemon 启动 SOP + Audit Monitor 硬规则"
- 列入红线级别 · 启 daemon 不启 Monitor = workflow 违例

### §3.2 中期改进(下个 PRD 或 Coding 3.0 升级时)

**SOL-C · 改 watch-audit-gate.py 增强 ralph-output.log 输出**
- 当前 watch-audit-gate.py 检测到 PENDING 时只发系统通知 + 写 ~/.claude/watch-audit.log
- 改 · **同时把 PENDING_DETECTED 行 echo 到 ralph-output.log**(已发现 ralph.py 自己已 echo · 实测 grep 命中)
- 已就位 · 不需要改

**SOL-D · 改 ralph.py 启动时打印强制提示**
- 启 daemon 后输出 "⚠️ MUST RUN /monitor-ralph IN OPUS SESSION NOW · OTHERWISE 1HR DELAY"
- 让用户/Opus 看到立刻反应
- 已部分就位(全局 CLAUDE.md 提示)· 但项目级补强

**SOL-E · ralph-tools.py 加新命令 wait-audit**
- 提供"阻塞式等 audit-gate pending → exit 0" 的便捷命令
- AI 主对话用 Bash --background 跑 · 触发时收 task notification
- 比 Monitor 更轻量(单次任务)· 但只能用一次 · 每次 audit 后要重启
- 暂不实施 · Monitor 已够

### §3.3 长期架构(留 PRR / Coding 3.0 v3 评估)

**SOL-F · ralph.py 内嵌 Sonnet audit(去掉 Opus 中间环节)**
- ralph daemon 自己调 Anthropic API 用 Sonnet 做 audit
- 不依赖外部 Opus 主对话
- **代价** · 失去"Sonnet 写 + Opus 审" 双层架构 + 失去人工 review 机会
- ❌ 不推荐 · 违反 Coding 3.0 哲学

**SOL-G · audit-gate 走 named pipe / Unix socket / WebSocket**
- 让 ralph 写 socket · Opus 主对话连 socket 实时读
- **代价** · 重构 · 跨平台兼容性
- 暂不评估

**SOL-H · 跨项目教训库 enforce 机制**
- 全局 reject-examples.jsonl 已有 · 但只是注入 prompt
- 加 ~/.claude/playbooks/workflow-violations.jsonl · 每次 RCA 跨项目沉淀
- 启 daemon 时 · 自动 grep 这个库 · 强制执行 SOP
- **暂不实施** · 跨项目改造大 · 留 v3

---

## §4 给本项目的硬规则(★ 写到项目 CLAUDE.md §9)

```
启 ralph daemon 的 5 步 SOP(顺序不可调)·
  1. 确认 prd.json 就位 · 跑 ralph-tools.py status 看 7 stories pending
  2. ★ 先启 Monitor(persistent=true · 订阅 ralph-output.log)
     · 命令 · Monitor tail -n 0 -F scripts/ralph/ralph-output.log | grep -E --line-buffered "PENDING_DETECTED|审计门禁已激活|APPROVED|REJECTED|所有任务已完成|非零退出码|最大重试次数|级联阻断|⛔|Traceback|Error:"
     · 必须在启 daemon 之前!
  3. python3.11 scripts/ralph/ralph.py --model sonnet --daemon
  4. 等 Monitor 通知 PENDING_DETECTED:US-XXX · 立即审
  5. 审完 ralph-tools.py approve / reject · ralph 自动继续

红线 ·
  ❌ 不允许启 daemon 后不启 Monitor(本 RCA-001 直接根因)
  ❌ 不允许靠"屏幕通知" + 用户主动转告 · 这是 28+ 分钟空窗的来源
  ❌ 不允许把"等用户输入"当成"等 audit" · 两件事是分开的
```

---

## §5 验证 SOL 有效性(下个 audit 触发时验证)

**测试条件** · ralph 在跑 US-002 · 完成后会写 audit-gate.json(pending)
**预期** · Monitor 在 < 30s 内通知我 PENDING_DETECTED · 我立刻审
**对比目标** · vs US-001 的 31 分钟空窗 · 改进 60x

---

## §6 修订记录

- 2026-05-07 21:15 · v0.1 · 初稿(US-001 approve 后用户触发深入排查)

---

> **本 RCA 跟 .agents/tech-debt.json TD-001 是不同性质** ·
> · TD-001 是代码层 tech debt(LD-015 hardcode color)
> · 本 RCA 是 process / workflow 层缺陷 · 影响所有未来 audit cycle
> · 解决方案要写到 CLAUDE.md 红线 · 跨 PRD 持久生效
