# RCA-007 · PRD-28 US-001 dev stuck · prompt 19.4K 超 §9.6.3 abort 阈值

> **派生** · 项目级 CLAUDE.md §9.6.3 prompt 字节阈值规则
> **发生时间** · 2026-05-23 00:00 ± · ralph daemon 启动 12 min 后
> **症状** · ralph daemon iter 1/50 跑 US-001 · dev iter 12 min 0 bytes 输出 · [WARN] Agent 已 5 分钟无新输出
> **影响** · 浪费 12 min daemon 时间 · 必须 kill + 重启

---

## §1 时间线

| 时间(2026-05-23) | 事件 |
|---|---|
| 23:54:57(2026-05-22) | ralph daemon PID 5186 启动 · iter 1/50 跑 US-001 |
| 23:54:57 | prompt 写入 agent-logs/20260522-235457_开发迭代_prompt.md(13820 字符 初始 + 含 SHIELD/TD-HINT 渲染后 19415 字符) |
| 23:55:00 ± | claude --print PID 5269 fork · stdin 收 19.4K prompt |
| 23:59:57 ± | ralph daemon 日志写 `[WARN] Agent 已 5 分钟无新输出 (日志: 0 bytes)` |
| 00:06 ± | dev log 仍 0 bytes(12 min) · ralph daemon 没自动 abort |
| 00:09 | Opus 主对话发现 · 按 §9.6.4 立即 kill + 拆 story |

---

## §2 根因分析

### §2.1 直接原因

ralph daemon build_developer_prompt 渲染后 prompt **19415 字符** · 严重超过 CLAUDE.md §9.6.3 abort 阈值 **12K** · 但 ralph.py 没实施 prompt 大小预检 · 直接写到 claude --print stdin · 大 prompt 处理慢 / 网络 hang / API 等待 · 12 min 0 bytes 输出。

### §2.2 根因(prompt 膨胀来源)

PRD-28 US-001 设计本身复杂度高:
- **files_to_modify 21 个 judge file 路径**(每条 ~50 chars · 总 ~1K · 不可压缩 · 必须列出)
- **acceptanceCriteria 12 条**(每条 ~200 chars · 总 ~2.5K)
- **anti_patterns 3 条**(每条 ~300 chars · 总 ~1K · 含完整 antipattern/correct code 对照)
- **description 长 + risk-upgrade 注释**(~500 chars)
- **ralph daemon append [SHIELD] anti_patterns 段 + [TD-HINT] tech-debt 段 + CLAUDE.md 上下文**(~3-5K · 不可控)

实际渲染后 prompt 19.4K · 不在 ralph.py 检查范围 · 无自动 abort。

### §2.3 系统性 gap

CLAUDE.md §9.6.3 规定:
> | > 12K | 🔴 **拒启 daemon** · ralph.py warning + abort · 强制 prd skill 重 split |

但 ralph.py 实际**没实施这个检查** · 仅在 [WARN] 阶段告警 5 min 无输出。这是 ralph.py 自身的 TD · 不在 PRD-28 范围 · 留 PRD-29+ 修。

短期 mitigation: PRD 设计阶段就保证单 US prompt 预估 < 10K · 通过拆 story 防 prompt 膨胀。

---

## §3 处理方案

按 §9.6.5 失败 → 拆分 → 重启 流程:

### §3.1 已执行

1. ✅ git log --since='10 minutes ago' 确认 ralph 无 commit (0 ralph commit · 仅 plan commit f17f6ca)
2. ✅ pkill -9 ralph processes (ralph.py + claude --print + watch-audit-gate)
3. ✅ rm scripts/ralph/ralph-lock.json (audit-gate.json 还未生成)
4. ✅ backup prd.json → prd.json.bak.before-rca-007

### §3.2 拆 US-001 → US-001/002/003 (3 batch · 各 7 file)

| 新 ID | priority | risk_level | 范围 |
|:-:|:-:|:-:|---|
| **US-001** | 1 | **foundation**(downstream=8 升档) | 基础设施 + 7 judge file batch 1(analysis-structural · analysis-viral · branding · copywriting · copywriting-acquisition · copywriting-boom · copywriting-free)+ tests/setup.ts + .env.example + vitest.judge.config.ts |
| **US-002** | 2 | medium | 7 judge file batch 2(daily-task-agent · evolution-agent · feedback-evolution-loop · insight-injection · livestream · monetization · positioning) |
| **US-003** | 3 | medium | 7 judge file batch 3(rag-injection · topic · video · video-acquisition · video-production · video-storyboard · voice-chat)+ ROOT scope 测试验证 |

### §3.3 后续 stories priority +2 偏移

| 原 ID | 新 ID | priority | 用途 |
|:-:|:-:|:-:|---|
| US-002 | US-004 | 4 | 100 金标准 dataset 准备(双轨)|
| US-003 | US-005 | 5 | evaluation pipeline · prisma + CLI(high)|
| US-004 | US-006 | 6 | admin /admin/evaluation UI(medium)|
| US-005 | US-007 | 7 | inter-rater agreement subset(medium)|
| US-006 | US-008 | 8 | /goal-verify §evaluation 集成 + 收官(medium) |

总 8 stories · 比原 6 stories 多 2 个 · 估时 +1-2 day · 总 16-22h。

### §3.4 anti_patterns 精简(每 US ≤ 2 条)

避免 prompt 再次膨胀:
- US-001 foundation: 2 条(PRD-25 US-008 假闭环 + PRD-27 US-005 M-2 ROOT vitest)
- US-002/003 medium batch: 1 条(M-2 ROOT vitest)
- US-004 dataset: 1 条(M-2 ROOT vitest)
- US-005 high evaluation pipeline: 2 条(REJ-001 LLMGateway + REJ-008 account_id 双层)
- US-006 admin UI: 1 条(REJ-019 admin/app 分离)
- US-007 inter-rater: 1 条(REJ-019 admin/app 分离)
- US-008 收官: 1 条(PRD-27 US-006 5 件套)

### §3.5 文件路径精简(prompt 减小)

US-001 files_to_modify 7 file path 改成 string 列表 · 每条简洁 · 不重复 path prefix。

---

## §4 重启 daemon 后预期

| 指标 | 旧 PRD-28 (6 US 原版) | 新 PRD-28 (8 US 拆分版) |
|:-:|:-:|:-:|
| total stories | 6 | 8 |
| 单 US 平均 prompt | 9-19K(变化大)| 6-10K(均匀)|
| 总 daemon time | 14-20h | 16-22h |
| US-001 prompt | 19.4K(STUCK)| ~8-10K(安全)|
| 失败概率 | high(prompt 膨胀)| low(可控范围)|

---

## §5 跨 PRD 应用(留 PRD-29+ 修)

**ralph.py 自身 gap** · §9.6.3 prompt > 12K abort 规则没实施 · 留 PRD-29+ 修 · 加 `_check_prompt_size(prompt: str) -> bool` 在 build_developer_prompt 后预检 · > 12K 自动 abort + 写 path_b audit-gate · 不进 dev iter。

**prd skill 自检** · skill 内部 risk_level 检查时同步预估 prompt 大小 · > 10K 警告 · > 12K block。

---

## §6 ROI

- **避免** 浪费 30 min × 5 重试 = 2.5h(US-001 retry 5 次 daemon 跑)
- **避免** RCA-007 重现(下次 prd skill 写 large prompt story 不直接进 daemon)
- **改动小** · 仅 prd.json + 写 RCA · 8 stories 串行跑通后 PRD-28 闭环
- **跨 PRD 教训** · prompt 大小是 PRD 设计阶段就要考虑的硬约束 · 不是 daemon 跑起来再发现

---

> **本 RCA 由 Opus 主对话写 · 2026-05-23 00:09 · 触发自动化失败 → 主动 SOP 处理 · 用户授权"实施监控 6 stories · 异常及时解决"**
