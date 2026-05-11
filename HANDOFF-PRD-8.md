# PRD-8 P7 智能模块 · HANDOFF(新会话接力)

> **创建** · 2026-05-11 ~02:50 · 当前 session context 66% · 不足以跑完 PRD-8(预估 10-14 days · 13 stories audit)
> **状态** · ✅ PRD-8 spec 已完整就位 · branch + prd.json + commit 4aaf235
> **下一步** · 用户在**新 session** 启 Monitor + daemon + 接 13 stories Opus audit

---

## 1 · 当前状态(快照)

| 项 | 状态 |
|---|---|
| **branch** | `ralph/prd-8-p7-intelligent-modules`(已切换 · 不需 checkout)|
| **prd.json** | scripts/ralph/prd-8.json (13 stories · 169 AC · 12 anti_patterns) 已 cp 到 prd.json |
| **commit** | 4aaf235 chore(prd): PRD-8 P7 智能模块 · 13 US · 3 L5 自治 + 5 层记忆 + 反馈飞轮闭环 |
| **progress.txt** | 已追加 [PRD-8 START] header |
| **plan-check** | 0 errors / 12 warnings(全 AC>8 提示 · 接受)|
| **PRD-7 retro** | .agents/retros/prd-7-vs-prd-6-retrospective.md(387 行 · P-1~P-7 Playbook 已内化到 PRD-8)|
| **0 open TD** | tech-debt.json 0 open · 干净基础 |

---

## 2 · 新 session 启动指令(★ 直接粘贴给 Claude)

```
我是 QuanQn 项目 · /Users/return/Desktop/QuanQn · 用户名 return。

PRD-8 P7 智能模块已 spec 就位(commit 4aaf235 · branch ralph/prd-8-p7-intelligent-modules)·
13 stories · 4 wave · 预估 10-14 days · 一轮通过率 75-85%(per PRD-7 retro §7 prediction)。

请按以下 6 步走:

第 1 步 · /prime 加载项目上下文

第 2 步 · 必读:
- .agents/HANDOFF-PRD-8.md(本文件 · 完整接力指南)
- .agents/retros/prd-7-vs-prd-6-retrospective.md(§6 PRD-8 Playbook P-1~P-7 必做项)
- tasks/prd-8.md(PRD-8 完整 spec · §1.0 SoT 表 + §7 Locked Decisions D-050~055)
- scripts/ralph/prd-8.json(13 stories prd.json 副本)

第 3 步 · 启 Monitor(★ 必先于 daemon · 项目 §9.1 SOP 红线):
用 Monitor 工具 · persistent=true · timeout_ms=3600000 · command:
  tail -n 0 -F /Users/return/Desktop/QuanQn/scripts/ralph/ralph-output.log 2>/dev/null \
  | grep -E --line-buffered "PENDING_DETECTED|审计门禁已激活|APPROVED|REJECTED|所有任务已完成|All stories resolved|非零退出码|最大重试次数|级联阻断|通过 Opus 质量审查|⛔|Traceback|Error:|Coding 3.0 下一步建议|claude CLI 2 次 health|crashed|exit code [^0]"

第 4 步 · 启 ralph daemon(per PRD-7 retro P-2 健康检查 + P-7 双联动):
  # health check
  perl -e 'alarm 25; exec @ARGV' claude --print "Say only OK and nothing else."
  # 启 daemon(若 health check 通过)
  /Users/return/.local/bin/python3.11 scripts/ralph/ralph.py --model sonnet --daemon

第 5 步 · 每个 PENDING_DETECTED 接 Opus 5 步 Cheat Sheet:
- 必读 ~/.claude/scripts/ralph/OPUS-AUDIT-CHEATSHEET.md
- foundation 档(US-001/002): 12-18 min 深审 + 跨 story 命名逐字核对 + 必读 conftest + L1 Buffer 实测
- high 档(US-003/004/007/009/010/011/012 · 7 个): 10-15 min · 全部域 grep + line-by-line
- medium 档(US-005/008/013): 5-8 min 标审
- low 档(US-006): 2-3 min 快审
- approve 时 update tech-debt.json + progress.txt audit log + cost_log eventType grep 验证

第 6 步 · 13 stories 全 PASS 后:
- /goal-verify(§0 跑 /gsd-map-codebase × apps/api · /apps/web · /packages/schemas + AGENTS.md 对账)
- /prd-retro(PRD-8 vs PRD-7 跨 PRD 复盘 · 反例库自动回灌 reject-examples.jsonl · 生成 PRD-9 Playbook)

★ 关键提醒(per PRD-7 retro §9 应固化为机制):
- M-1 type alias chain · 所有 schema 类 story(US-001/002/003/004/009/010)anti_patterns 已注入此教训 · ralph 实施时主动避开
- LD-001 95/5 · 严禁 3 L5 Specialist 内 while/for 循环 · 必须 ADR-018 外部 orchestrator
- LD-007 ContextAssembler 唯一入口 · US-004 注入 EvolutionInsight 时 grep apps/api/src/specialists/ 应 0 命中
- R-12 原子事务 · US-003 EvolutionAgent level 升级 + insight 写入同 prisma.$transaction

预估完成时间 · 10-14 days · 跨多个 session(每 session 5-15 stories audit · 视 context 容量)
```

---

## 3 · 13 Stories 总览(by Wave)

### Wave 0 Foundation(2 stories · risk=foundation · 严审)

| US | size | 关键 | downstream count |
|:-:|:-:|---|:-:|
| US-001 | large | 5 层记忆 schema + types + ContextAssembler 协议升级 | 11 |
| US-002 | large | 3 L5 Specialist 骨架 + ADR-018 外部 orchestrator 协议 | 10 |

### Wave 1 反馈飞轮(4 stories)

| US | size | risk | 关键 |
|:-:|:-:|:-:|---|
| US-003 | medium | high | EvolutionAgent 真接 + 累计反馈阈值触发器(BullMQ + 原子事务)|
| US-004 | medium | high | ContextAssembler 注 EvolutionInsight 到全 11 Specialist |
| US-005 | small | medium | evolution router + /evolution 前端 |
| US-006 | small | low | e2e 闭环验证 |

### Wave 2 DailyTask(2 stories)

| US | size | risk | 关键 |
|:-:|:-:|:-:|---|
| US-007 | medium | high | DailyTaskAgent + node-cron 0 点 + per-account fan-out |
| US-008 | small | medium | dailyTasks router + /daily-tasks 前端 |

### Wave 3 VoiceChat(4 stories)

| US | size | risk | 关键 |
|:-:|:-:|:-:|---|
| US-009 | medium | high | STT Worker · OpenAI Whisper-1 |
| US-010 | medium | high | TTS Worker · OpenAI TTS-1 |
| US-011 | large | high | VoiceChatAgent + 5 tools function calling + L1 Buffer |
| US-012 | large | high | /voice-chat 前端 WebRTC + audio player + 多轮 UI |

### 收官(1 story)

| US | size | risk | 关键 |
|:-:|:-:|:-:|---|
| US-013 | medium | medium | LLM Judge +11 + 3 e2e + lint clean + 6 eventType grep |

---

## 4 · 产品决策记录(per AskUserQuestion 2026-05-11)

1. **VoiceChatAgent 范围** · STT/TTS 真接(OpenAI Whisper-1 + TTS-1)· 全栈 MVP · L1 Buffer 必需
2. **EvolutionAgent 触发器** · 仅累计反馈阈值 {5,20,50,100}(D-050 · 不实施 user-manual/cron/deepLearn 触发)
3. **DailyTaskAgent 推送** · 仅 /daily-tasks 页面 + 0 点 cron 预生成(D-051 · 不推送站内通知/email)
4. **ContextAssembler 接通 EvolutionInsight** · 本期全接通 11 Specialist(D-054 · 闭合飞轮 Phase 5)

---

## 5 · 关键风险预警(per PRD-7 retro §7)

- ⚠️ **L5 Agent 是新领域** · reject-examples.jsonl 没有 L5 相关历史教训 · ralph 可能踩新坑(BullMQ 幂等 / cron 重复 / tools dispatch race)· 留 ralph 探索空间 · 别期待 0 reject
- ⚠️ **VoiceChat WebRTC 浏览器兼容** · US-012 可能需 manual visual verify(agent-browser mock mic 复杂)
- ⚠️ **OpenAI API rate limit** · STT/TTS 真接时若 daemon 跑得快可能触发 OpenAI per-org RPM 限流 · 留意 ECONNRESET 类
- ⚠️ **claude CLI 1-2h hang** · PRD-5/6 历史教训 · daemon 跑 10-14 days 必有 hang · US-007 path B 自动触发应对(已 PRD-7 实施 + 全局 sync)

---

## 6 · 跨 session 上下文管理建议

由于 PRD-8 复杂度 · 1 个 session 跑不完。建议 session 切换策略:

- **Session 1**(本 session)· spec 创建完毕(本文件)
- **Session 2** · 启 Monitor + daemon · audit Wave 0 Foundation(US-001/002 · 占 context 30-40%)
- **Session 3** · audit Wave 1 反馈飞轮(US-003~006)
- **Session 4** · audit Wave 2 DailyTask + Wave 3 STT/TTS(US-007~010)
- **Session 5** · audit Wave 3 VoiceChat + 收官(US-011~013)
- **Session 6** · /goal-verify + /prd-retro(可能合并到 Session 5)

每 session 前先 /prime + 读本 HANDOFF + 读最新 progress.txt 末尾 audit log。

---

## 7 · 当前 commit 链(PRD-8 期)

```
4aaf235 chore(prd): PRD-8 P7 智能模块 · 13 US · 3 L5 自治 + 5 层记忆 + 反馈飞轮闭环
ab7a054 docs(retro): PRD-7 vs PRD-6 跨 PRD 复盘
f0a9410 docs(verify): PRD-7 /goal-verify · 8/8 PASS · 0 open TD
f5d695a chore(audit): PRD-7 Opus audit final state · 7 TD resolved
```

---

> **本文件由 Claude(Opus 4.7)在 PRD-8 spec 完整就位后写 · 2026-05-11 02:50 · context 66% 触顶前的最后产出。**
> **PRD-8 实施工作量远超单 session 容量 · 必须新 session 接力。**
