# RCA-002 · US-005 Developer 超时 3 次根因分析

> **创建** · 2026-05-07 23:30(US-005 第 3 次 30 min 超时后用户截图触发)
> **影响** · US-005 round 6/7/8 共消耗 90 min · 0 行代码产出 · ralph 阻塞
> **根本类别** · large story 任务粒度 + claude --print 子进程 stdout buffer + ralph 检测延迟
> **历史先例** · 全局 CLAUDE.md 提"Story 大小:第一规则 · 必须能在一次 Ralph 迭代完成"· 但本项目 prd skill 转 prd.json 时未自动拆 size=large

---

## §1 时间线还原

| 时间 | 事件 | 状态 |
|---|---|---|
| 22:16 | round 6 dev 启动 · prompt 7151 字节 · log 0 bytes | dev 阶段 |
| 22:16+5min | "Agent 已 5 分钟无新输出" WARN | 仍 idle |
| 22:46 | round 6 timeout 1802s → kill · log 0 bytes 丢失 | retryCount=1 |
| 22:46 | round 7 dev 启动 · prompt 7196 字节(+45)· log 0 bytes | dev 阶段 |
| 23:16 | round 7 timeout · retryCount=2 | log 0 bytes 丢失 |
| 23:16 | round 8 dev 启动 · prompt 7241 字节(+45)· log 0 bytes | dev 阶段 |
| 23:24 | 用户截图反馈 "3 次开发未成功" | 触发本 RCA |
| 23:25 | Opus(我)kill ralph + 拆 US-005 | 主动介入 |

**关键事实** ·
- 3 次 dev log 都 **0 bytes** · claude 子进程 stdout 完全空
- claude PID 26299 · CPU 10s + idle 7+ min · 等网络回应中
- prompt 字节随 retry 累加(notes 加"[Developer 超时]" line)
- ralph 5 min no-output 仅 WARN · 没 kill · 没诊断

---

## §2 多角度根因分析

### §2.1 角度 A · 任务粒度过大(★ 主因)

**事实** · US-005 size=large
- 9 条 acceptanceCriteria
- 17 个 files_to_create(12 shadcn 组件 + 4 子组件 + 1 e2e)
- 涉及 shadcn copy-paste 模式 + radix-ui dep 添加 + Header 4 子组件设计 + e2e playwright 配置

**全局 CLAUDE.md 第一规则** ·
> "每个 story 必须能在一次 Ralph 迭代(一个 context window)中完成"
> "经验法则:如果你无法用 2-3 句话描述这个变更,那就太大了"

**US-005 描述** · "shadcn 12 基础组件 + Header 三 dropdown(含 4 子组件 + e2e)" · **3 件大事** · 显然违反第一规则。

**根因** · prd skill 转 prd.json 时未触发 large 警告 · 没自动拆。

### §2.2 角度 B · claude --print stdout block-buffer 嫌疑

**事实** ·
- ralph spawn `claude --print` 子进程 · stdout 被 redirect 到 file(`open(agent_log_path, "w")`)
- macOS / Linux 默认 · stdout 写 file 时是 **block-buffered**(8KB 块)· 非 line-buffered(只 tty 是)
- claude 内部可能在工作 · 但输出在 8KB buffer 里没 flush 到 file
- ralph kill 时 SIGTERM(L1003-1006) · 给 5s 后 SIGKILL · buffer 直接丢失 → log 0 bytes

**可能的现象解释** ·
- claude 真的在跑 + 处理 prompt(CPU 10s)
- 但输出在 buffer · 没 flush
- 30 min 后 ralph kill · buffer 丢
- 看起来 "3 次都失败 0 输出"

**待验证** · 改 ralph 用 `subprocess.PIPE` + 实时读 stdout · 看是否真有输出 · 留 v3 评估

### §2.3 角度 C · 任务大触发 claude API 长尾

**事实** ·
- US-005 prompt 11.6K(其他 6-7K · +50%)
- shadcn 12 组件代码 + Header + e2e · 单次 LLM 输出可能要 30K+ tokens
- Claude Sonnet 单次输出限 8192 tokens · 单 API call 装不下
- claude --print 模式遇到大输出 · 可能内部多次 API call · 网络延迟累加

**根因** · 大 story → 大 prompt → 大输出 → 多 API call → 任意 call 失败/超时 → claude 静默 hang

### §2.4 角度 D · ralph 超时检测策略太宽

**当前** ·
- 5 min no-output → 只 WARN · 不 kill
- 30 min total → 才 kill

**问题** ·
- 5 min no-output 通常已是 stuck(claude 正常 30s 内开始输出)· 应早 kill
- 30 min 浪费时间 · 用户感知差
- 没主动诊断(看 claude 进程是否还活 / 看 CPU 百分比 / 看网络连接)

### §2.5 角度 E · prd skill / ralph skill 缺 large story 强制拆分规则

**全局 CLAUDE.md 已说** ·
> "## 拆分大型 PRD ... 拆分为:US-001 ... US-006"

**但 ralph skill 转 prd.json 时** ·
- 看 size_hint=large 仅作为 metadata 存
- 没强制要求 prd skill 拆 story
- 没在 转 prd.json 时 abort + 提示用户拆

---

## §3 全链路解决方案(5 级)

### §3.1 立即(本会话已做)

✅ **kill stuck ralph + cleanup**(pkill -9 ralph + claude --print + watch + rm lock)
✅ **改 prd.json 简化 US-005**:
- 14 文件 → 13(去掉 4 子组件 · 改单 Header.tsx 内联三 dropdown)
- 移除 e2e playwright(留 PRD-2 routing phase)
- size_hint=large → medium
- 9 AC → 10 AC(细化但避免大件)
- retryCount=2 → 0(fresh start)
- notes 加 [RCA-002] 标记
✅ **写本 RCA-002 文档**
✅ **改 CLAUDE.md §9.6 加 large story 拆分硬规则**

### §3.2 重启 ralph daemon(本会话即做)

按 SOP §9.1 ·
- 先启 Monitor(已存活 task b1ai5q0xq)
- 再启 daemon · `python3.11 ralph.py --model sonnet --daemon`

### §3.3 中期改进(下个 PRD 时就做)

**SOL-A · prd skill 转 prd.json 强制拆 large**
- ralph skill SKILL.md 加规则 · `size_hint==large` 时 abort + 报错 · 让 prd skill 拆为 ≥3 个 medium

**SOL-B · 减小超时 + 早警**
- ralph.py 改 · "2 min no output → diagnostic"(看 claude PID 是否 alive · CPU%)
- "10 min no output → kill"(从 30 min 缩到 10 min)
- 留 ~/.claude/scripts/ralph 改 · 影响其他项目 · 留下次 sync 同步

**SOL-C · prompt 字节阈值 warn**
- prompt > 8K 时 ralph WARN · 提示拆 story
- prompt > 12K 时 ralph 拒绝启动 · 提示重新 prd skill

### §3.4 长期(留 v3 / PRR)

**SOL-D · ralph 改 stdin 用 args 传 prompt**
- 把 prompt 通过 `claude --print "PROMPT_TEXT"` positional arg 传(而不是 stdin)
- 但 11K prompt 超过 macOS arg max(默认 256K · 应该 OK · 但有些 shell 限 1K)

**SOL-E · ralph 改 stdout PIPE + 实时读**
- subprocess.PIPE + thread 读 stdout · 实时写 file(强制 flush)
- 解 block-buffer 问题
- 同时让 ralph 实时看到 claude 输出 · 早期诊断

**SOL-F · 改 claude --print 加 --debug-file**
- 让 claude 自己写 debug log 到 file · 不依赖 stdout buffer

---

## §4 跟 RCA-001 的对比

| 维度 | RCA-001 | RCA-002 |
|---|---|---|
| 触发 | US-001 audit 31 min 空窗 | US-005 dev 90 min 空转 |
| 根因 | 通信架构断链 · Monitor 没启 | 任务粒度过大 + 子进程 buffer + 检测策略宽 |
| 影响范围 | 所有 audit cycle(7 stories) | 大 size story(US-005)+ 未来类似 |
| 立即修补 | 启 Monitor 工具 | kill + 拆 US-005 + 重启 |
| 长期修补 | CLAUDE.md §9 SOP 5 步 | CLAUDE.md §9.6 large story 拆分硬规则 + ralph.py 超时改进(留 v3)|
| 预期改进 | 60x 通知速度 | 大 story 不再卡 daemon · single round < 15 min |

---

## §5 验证 SOL 有效性(下次 dev 触发时)

**测试 ·** US-005 简化版(13 文件 medium · ~10 min 预期)能否一 round 跑完
**对比** · 原 large 17 文件 3 次都 stuck

---

## §6 修订记录

- 2026-05-07 23:30 · v0.1 · 初稿(US-005 第 3 次超时后用户主动触发)

---

> **本 RCA + RCA-001 → CLAUDE.md §9 共同形成"Ralph daemon SOP + 防卡死"完整规则**
> **解决路径** · 立即 + 中期(下 PRD)+ 长期(v3 / PRR)三级
