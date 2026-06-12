---
# 从 AGENTS.md §8 下沉（R7 2026-06-12），按需加载
# 触发场景：Opus 审计 · Ralph 提 PR 前 · 自检
# 命令对齐基准：scripts/audit-ld.sh + scripts/audit-redlines.sh 是权威
# 本文件内命令以实际脚本内容为准（见下方"R7 命令对齐比对"节）
---

## §8.1 审计流程（5 步）

```
Step 1 · 读 audit-gate.json + ralph 提交的代码 diff
Step 2 · 跑 §8.3 必跑 5 项（零回归硬门禁）
Step 3 · 跑 LD 检测（bash scripts/audit-ld.sh）按 risk_level 选条数
Step 4 · 跑 §8.5 红线 grep（pnpm audit:redlines）全部 17 条
Step 5 · approve（附 4 维度报告）or reject（附反例·用§8.7 模板）
```

## §8.2 风险分档

| risk_level | 触发条件 | 审计强度 | 时长 |
|:-:|---|---|:-:|
| **🟢 low** | 纯常量/小工具/UI 文案 | §8.3 + 通用 4 维度 + 1-2 LD grep | 2-3 min |
| **🟡 medium** | service/CRUD API/单 Specialist | §8.3 + 通用 + 3-5 LD grep + 关键函数阅读 | 5-8 min |
| **🔴 high** | gateway 热路径/反馈飞轮/多账号边界/安全 | §8.3 + 全部 LD + line-by-line + SQL 实测 + 必读测试 | 10-15 min |
| **🟣 foundation** | 被 ≥3 下游 story depends_on 的 model/schema/__init__/conftest | high 全部 + 升档（防 rubber-stamp 污染） | 15+ min |

Opus 先判断 risk_level·再选检测条数·不允许"全部跳过快审"。

Foundation 档必须跑 F2（下游 N+1/N+2 story AC 文本字面核对·高频陷阱 F2 实证：PRD-14 US-011 提前 catch TD-69）：

```bash
python3 scripts/ralph/ralph-tools.py deps | grep US-XXX     # 反向依赖
for downstream in <反向依赖列表>; do
  python3 scripts/ralph/ralph-tools.py story $downstream | grep -E "<本story符号/表名/函数名>"
  # 若下游 AC 用错函数/错表名 → 审计报告中必须提及 + 登记 TD
done
```

## §8.3 必跑 5 项（零回归硬门禁·任一失败 reject）

```bash
# ① TypeScript 0 error
pnpm typecheck
# expected: "Found 0 errors."

# ② ESLint 0 error · 0 warning
pnpm lint --max-warnings=0
# expected: 退出码 0 · 无输出

# ③ 全量单元 + 集成测试
pnpm test:unit && pnpm test:integration
# expected: 全过 · 覆盖率达标（整体≥80% · 核心≥90%）

# ④ Schema 一致性
pnpm schema:diff
# expected: prisma schema = DATA-MODEL.md = zod schema · 无 diff

# ⑤ 红线 17 条
pnpm audit:redlines
# expected: 0 命中
```

## §8.4 LD 检测命令（以 scripts/audit-ld.sh 为权威）

```bash
bash scripts/audit-ld.sh        # 18 LD + 5 复杂红线一键运行
```

关键 LD 单项检测（已与 audit-ld.sh 对齐，R7 2026-06-12 核对）：

```bash
# LD-001 · Specialist 内多轮 LLM（已对齐脚本第 29-33 行）
grep -rE "(for|while)\s*\(" apps/api/src/specialists/ --include="*.ts" 2>/dev/null \
  | grep -v "/__tests__/" | grep -vE "^\s*(\*|//)" \
  | grep -iE "llm|invoke|complete|stream" | wc -l
# 期望: 0

# LD-002 · Specialist 数量（已对齐脚本第 36-39 行）
ls apps/api/src/specialists/*.ts 2>/dev/null \
  | grep -v "\.test\." | grep -v "/base/" | wc -l
# 期望: ≤14

# LD-004 · L5 Agent 自循环检测（已对齐 TD-052 修复版·脚本第 46-60 行）
L5_NAMES=(VoiceChatAgent EvolutionAgent DailyTaskAgent)
for name in "${L5_NAMES[@]}"; do
  f="apps/api/src/specialists/${name}.ts"
  [ -f "$f" ] || continue
  grep -A 10 -E "^\s*(for|while)\s*\(" "$f" 2>/dev/null \
    | grep -iE "llm|invoke|complete|stream\.read" \
    | grep -vE "^\s*(\*|//|/\*)" | head -1 | grep -q . && echo "FAIL: ${name}.ts self-loop"
done

# LD-005 · BaseSpecialist 继承（re-export stub 豁免 D-007+TD-024）（脚本第 65-80 行）
for f in apps/api/src/specialists/*.ts; do
  [[ "$f" == *base* ]] && continue
  [[ "$f" == *.test.ts ]] && continue
  grep -qE "from\s*['\"]@/agents/" "$f" 2>/dev/null && continue  # re-export stub 豁免
  grep -q "extends BaseSpecialist" "$f" || echo "FAIL: $f 未继承"
done
```

> **R7 命令对齐比对**（LD-002·R-1 重点核对）：
> - **LD-002** §8 原文用 `src/server/agents/specialists/*.ts`；audit-ld.sh 实际用 `apps/api/src/specialists/*.ts`。以脚本路径为准（monorepo 结构）。
> - **R-1** audit-redlines.sh 豁免了 image-gen/embedding/rag/tts/stt 目录（非 LLM chat workers·设计意图）；§5.6 原文未提此豁免。以脚本为准（redlines.sh 第 30-42 行）。
> - **LD-004** 原文用"文件名匹配"检测；audit-ld.sh TD-052 修复版改为"检测文件内自循环"（不再 grep enqueue）。以脚本为准。

完整 18 LD 检测见 `scripts/audit-ld.sh`（2026-05-09 新建·TD-018 修·2026-06-12 R7 核实）。

## §8.5 红线 17 条（以 scripts/audit-redlines.sh 为权威）

```bash
pnpm audit:redlines     # 调 scripts/audit-redlines.sh
bash scripts/audit-redlines-admin.sh  # admin 专属 6 R-A 红线（如涉及 admin）
```

redlines.sh 覆盖 12 条 grep 红线（R-1/2/3/4/5/9/10/11/15/16/17 + LD-011 + console 禁用）。
5 条复杂红线（R-6 新表 RLS · R-7 schema 漂移 · R-8 zod 缺失 · R-12 transaction · R-13 乐观锁 · R-14 PII/免责）由 audit-ld.sh 检测。

## §8.6 4 维度 approve 报告模板（Opus 通过时必出）

```markdown
# Approve · Story <ID> · risk_level: <low|medium|high|foundation>

## ① 验收标准合规（AC by AC）
- [✓] AC-1 · ${AC1 描述} · 验证：${file:line / test name}
- [✓] AC-2 · ...

## ② AGENTS.md 技术约束（LD 检测）
- [✓] LD-001 · 95/5 范式 · 无 Specialist 内多轮 · grep 0 命中
- [✓] LD-009 · 多账号隔离 · 全部查询带 accountId · RLS 策略全
- [✓] LD-013 · trace_id 贯穿 · 类型严格 0 any
- [✓] ${其他相关 LD}

## ③ 安全审查
- [✓] 无 PII 入 prompt · pii-mask 测试通过
- [✓] 无注入风险 · 用户输入走 zod 校验
- [✓] 无敏感日志泄漏

## ④ PRD 一致性
- [✓] 实现跟 PRD §<x.y> 完全一致
- [⚠️] （如有偏差）偏差：${描述} · 已登记 TD-${id}

## TD 豁免（若有）
- TD-X 豁免 approve · 理由：${pre-existing tech debt} · 证据：${file:line}

## 测试覆盖
- 单元：全过 · 覆盖率 ${X%}
- 集成：全过
- LLM Judge（若改 prompt）：评分 ${X}/5.0 · 不下降

## 命令实测
- pnpm typecheck · 0 error
- pnpm lint · 0 warning
- pnpm test:unit · ${X} 通过
- pnpm audit:redlines · 0 命中
```

## §8.7 reject 反例模板（Opus 拒绝时必出·feedback < 200 字符会自动报错）

```markdown
# Reject · Story <ID>

## Blocker · ${一句话总结}

## 触犯
- AGENTS.md ${LD-XXX} · ${LD 标题}
- 红线 ${R-X} · ${红线描述}

## 当前代码（行号）
\`\`\`typescript
// src/server/agents/specialists/CopywritingAgent.ts:42
const r = await openai.chat.completions.create({...});  // ❌ 直接调 SDK · 触犯 R-1
\`\`\`

## 目标代码
\`\`\`typescript
const r = await llmGateway.complete({ model_tier: 'reasoning', ... });
\`\`\`

## 绝对不能（反例列表）
- ❌ 不能直接 `import OpenAI`
- ❌ 不能跳过 metadata.trace_id
- ❌ 不能让 timeout/retry 在 Specialist 内部处理（LLMGateway 已做）

## 验证方式
\`\`\`bash
grep -rn "new OpenAI\|new Anthropic" src/ --exclude-dir=lib/llm-gateway
# expected: 0 行输出
\`\`\`

## 参考
- AGENTS.md §3.5 LD-012（详细决策）
- AGENTS.md §5.1 R-1（红线）
- ARCHITECTURE.md §6.5（LLMGateway 接口契约）
```

## §8.8 一键审计脚本

```bash
#!/bin/bash
# scripts/audit-all.sh · Opus 审计入口

set -e
echo "════════ Opus Audit · QuanAn ════════"

# Step 1 · 必跑 5 项
pnpm typecheck
pnpm lint --max-warnings=0
pnpm test:unit && pnpm test:integration
pnpm schema:diff
pnpm audit:redlines

# Step 2 · LD 18 条
bash scripts/audit-ld.sh

# Step 3 · 红线 17 条
bash scripts/audit-redlines.sh

# Step 4 · 输出 audit-gate.json
echo '{"status":"ready_for_opus","timestamp":"'$(date -Iseconds)'"}' > scripts/ralph/audit-gate.json

echo "✅ 自动检查全过 · 等待 Opus 4 维度审查 + approve"
```

## §8.9 audit-gate.json 通信契约

```typescript
interface AuditGate {
  status: 'pending' | 'approved' | 'rejected';
  story_id: string;
  risk_level: 'low' | 'medium' | 'high' | 'foundation';
  ralph_finished_at: string;
  opus_started_at?: string;
  opus_finished_at?: string;
  approve_report?: string;
  reject_feedback?: string;
  auto_checks: {
    typecheck: boolean; lint: boolean; test_unit: boolean;
    test_integration: boolean; schema_diff: boolean; redlines: boolean;
  };
}
```

完整 ralph 协议见全局 `~/.claude/scripts/ralph/CLAUDE.md`。

## §8.10 Step 4.5 直审路径（Validator 撞 infra block 但代码已 commit）

触发条件（全部满足）：
1. Validator 异常退出但代码已 commit
2. 错误是 infra（Anthropic rate limit/网络 timeout/health check fail）非 code bug
3. ralph 进 retry hell 概率 ≥50%

Opus 走流程：
1. kill daemon + clear lock + 备份 prd.json
2. Opus 5 步 Cheat Sheet **深审 commit**（不简化）
3. 通过 → 手 patch prd.json `passes=true retryCount=0 notes 标 [Step 4.5 路径]` + 登 TD（若有 deferred AC）
4. 重启 daemon · 跳到下一 story

实证：PRD-14 US-009（Validator 41min 撞 rate limit·Opus 直审 commit 759a611 PASS）
