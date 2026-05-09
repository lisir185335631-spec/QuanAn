# RCA-003 · US-012 收官 ECONNRESET 自动 BLOCK 事故

> **PRD** · PRD-5(P4 创作模块)
> **Story** · US-012(收官 · LLM Judge 4 mode + 4 工具 e2e + lint clean + typecheck)
> **发生时间** · 2026-05-09 17:47 ~ 18:59(共 5 次 retry · 73 分钟)
> **影响** · daemon 自然退出 · PRD-5 11/12 完成 · 收官 story BLOCKED · 用户必须人工介入恢复

---

## 1 · 现象

ralph daemon 跑到 US-012(收官)时 · 5 次 Developer 调用全部失败 · retryCount=5 触发自动 BLOCKED · daemon 退出。

| 迭代 | 开始 | 耗时 | 结果 | 输出 bytes |
|:-:|---|:-:|---|:-:|
| 15 | 17:47:20 | 30 min | 超时(1802s 强制 kill) | 0 |
| 16 | 18:17:25 | 30 min | 超时(1802s 强制 kill) | 0 |
| 17 | 18:47:31 | 4 min | ECONNRESET | 49 |
| 18 | 18:51:33 | 4 min | ECONNRESET | 49 |
| 19 | 18:55:36 | 4 min 10s | ECONNRESET | 49 |

**末态** · `[BLOCK] US-012 已达到最大重试次数 (5)，自动标记 blocked` → `[OK] 所有任务已完成（部分可能 BLOCKED）!` → daemon 自然 exit。

---

## 2 · 根因分析

**根因 = Claude API 网络 ECONNRESET 抖动**(集中发生在 18:47-18:55 · 8 分钟内连崩 3 次)

证据 ·
- 后 3 次日志尾部明确写：`API Error: Unable to connect to API (ECONNRESET)`
- 前 2 次 30 min 超时 + 0 bytes 输出 · 模式跟 ECONNRESET 一致(API 第一次握手就卡死 · agent 等待无响应直到 watchdog 强 kill)
- US-012 prompt 字节 10,722 ~ 10,949 字符 · **没超 12K 红线**(项目 §9.6.3)· 不是 large story 问题
- US-012 size_hint=medium · risk_level=medium · 5 files_to_create · 1 modify · **不是大任务**
- 11 个前置 stories 全部 PASSED · 代码栈本身没问题
- 排查时 18:59 后 curl `api.anthropic.com` HTTP 405 / DNS 解析正常 · **网络已恢复**

**非根因排除** ·
- ❌ RCA-002 large story 问题(prompt 10K · 安全区)
- ❌ prd.json schema 问题(11 个 PASS 都用同 schema)
- ❌ Ralph Agent 代码问题(11 次成功)
- ❌ 30 min watchdog 误杀(后 3 次 4 min 就 ECONNRESET 退出 · watchdog 没起作用)

---

## 3 · 修复

### 3.1 立即修(本会话)

1. ✅ 备份 prd.json → `backups/prd.json.bak.022.before-rca003-recovery`
2. ✅ kill 孤儿 watch-audit-gate.py(PID 55957)
3. ✅ unblock US-012 · 改 prd.json:
   - `blocked: true → false`
   - `retryCount: 5 → 0`
   - `passes: true → false`(保持 false · 等 ralph 重跑后 validator 设)
   - `notes` append `[2026-05-09 RCA-003 恢复]` 标记
4. ⏭️ 启 Monitor(项目 §9.1 5 步 SOP)
5. ⏭️ 启 ralph daemon(`--model sonnet --daemon`)
6. ⏭️ 等 PENDING_DETECTED:US-012 → Opus 5 步审 → approve → COMPLETE

### 3.2 中期改(后续 PRD 沉淀)

- **建议** · ralph.py 增加 ECONNRESET 错误码识别 · 不计入 retryCount(仅计入"网络重试")· 单独阈值(比如网络重试 max=10 不触 BLOCK · 普通失败 max=5)
- **建议** · 30 min Developer 超时若 0 bytes 输出 · 提前 5 min kill + 不计 retryCount(一样判定为网络/启动问题 · 单独重试)
- **建议** · daemon 检测 max retry 触发 BLOCKED 时 · **不要**自然退出 · 而是写 audit-gate.json(status=needs_attention) · 让 Monitor 通知用户 · 避免静默退出

---

## 4 · 跨 PRD 教训

| 教训 | 应用范围 |
|---|---|
| Claude API 偶发 ECONNRESET 集中爆发(8 min 内 3 次) · 不是 ralph bug · 是 Anthropic 后端抖动 | 所有 PRD |
| daemon "自然退出"(BLOCKED stories 后 exit COMPLETE)的提示文案误导 · 实际是失败 · Monitor 应该响铃而不是静默 | ralph.py 升级建议 |
| 0 bytes + 30 min 超时模式 = 几乎 100% 是网络问题 · 不是任务太大 | 监控规则 |
| 5 次 retry 都是同根因(网络) · 等于零有效重试 · MAX_RETRIES=5 在网络问题下没意义 | 上面"3.2 中期改" |

---

## 5 · 验证 / 闭环

恢复后跑通 US-012 audit approved → PRD-5 COMPLETE 即闭环。

如果重启后 US-012 第一次又 ECONNRESET · 等 5 min 再启(给 Anthropic 后端缓冲)· 不要用 --no-audit-gate 绕过。

---

> **作者** · Claude(Opus 4.7)on 2026-05-09 19:35
> **关联** · 项目 CLAUDE.md §9.1 SOP / §9.6 RCA-002 / 全局 CLAUDE.md OPUS-AUDIT-CHEATSHEET
