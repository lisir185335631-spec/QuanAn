# Opus Audit Cheat Sheet — 照步骤跑, 不用记

> **版本**: 2026-04-21 (PRD-4 Wave 1 深审驱动)
> **目的**: 把 AUDIT-CHECKLIST-TEMPLATE 的 40+ 条规则折叠成 5 个 Step, Opus 照着跑, 认知负担 40+ → 5。
> **哲学基础**: Atul Gawande *The Checklist Manifesto* — 把专家知识固化成 linear sequence, 消除"漏项"。
> **触发**: 每次收到 `PENDING_DETECTED: US-XXX` 通知, 从 Step 1 开始。

---

## ⚡ TL;DR (3 秒版)

```
Step 1:    跑 audit-artifacts.py <US-XXX>              (~ 5s)
Step 2:    查 risk_level                                (~ 1s)
Step 3:    按档跑 grep 清单 (low 2条/medium 5条/high 全量) (~ 1-8 min)
Step 4:    读实现文件 + 跨 story 协议核对                 (~ 1-10 min)
Step 4.5:  Opus 直 fix mechanical 错路径 (5 条件全满足 · 详 §Step 4.5 · 2026-05-12 加)
Step 5:    approve 或 reject (TD 豁免必须留痕)           (~ 30s)
```

---

## Step 1 — 产物校验 (5 秒, 不跑测试)

```bash
cd <project-root>
python3 ~/.claude/scripts/ralph/audit-artifacts.py US-XXX
```

**判决表**:

| 输出 | 动作 |
|------|------|
| `ARTIFACTS VALID` + `pytest-full: N passed, 0 failed` | ✅ 零回归 OK, 跳 Step 1.5, 进 Step 2 |
| `ARTIFACTS VALID` + `[SKIP] pytest-full: no artifact` | ⚠️ Validator 未产物化, 去 **Step 1.5 补跑** |
| `ARTIFACTS FAKE or INVALID: ['pytest-full']` | 🔴 回归失败 → 直接 Step 5 reject |
| `ARTIFACTS FAKE or INVALID: ['mypy']` | 🟡 检查是否本 story 引入 (下面 Step 1.6 判断) |
| `ARTIFACTS FAKE or INVALID: ['ruff']` | 🟡 同上 |
| `ARTIFACTS MISSING` | 🔴 Validator 没落产物 → **直接 reject** |
| `ARTIFACTS FAKE` (时间戳异常) | 🔴 Sonnet 偷懒 → **直接 reject** |
| `ARTIFACTS FAKE or INVALID: ['manifest']` (partial — pytest-full.xml 仍在, 仅 manifest 缺) | 🟡 补跑 live `ruff check app tests` + `mypy app`, 0 error → approve + 登记 Validator 产物流程 TD; 有 error → reject. 详见 Step 1.7 |

### Step 1.5 — 补跑零回归 (30-60s, 仅 Validator 未产物时)

```bash
cd backend && .venv/Scripts/pytest -q 2>&1 | tail -5
```
- `X passed, 0 failed, 0 errors` → 继续
- 任何 fail/error → **直接 reject**, notes 写 "零回归门禁失败: N tests failed"

### Step 1.6 — mypy/ruff 错误判断

pre-existing vs 本 story 引入?
```bash
# 查看错误文件是否在本 story files_to_create/modify 列表
python3 scripts/ralph/ralph-tools.py story US-XXX | grep -E "files_to_create|files_to_modify"

# 对比 ruff.json 或 mypy.txt 错误位置
grep filename scripts/ralph/verify-artifacts/US-XXX/ruff.json | head -5
```

- 错误在本 story 文件 → **reject** (本 story 引入的问题)
- 错误在其他文件 → **pre-existing TD**, 登记到 tech-debt.json 后继续 (见 Step 5 TD 留痕)

### Step 1.7 — Partial FAKE 补跑实测 (60-90s, 仅 manifest 缺但 pytest-full 存在)

**触发场景**: `audit-artifacts.py` 报 `ARTIFACTS FAKE or INVALID: ['manifest']`, 但 `pytest-full.xml` 实际存在且 550+ passed. 这是 Validator 流程残缺 (meta-story / 零回归 story 常见), 不是核心 artifact 伪造.

**补跑流程**:
```bash
cd backend
.venv/Scripts/ruff check app tests 2>&1 | tail -5
.venv/Scripts/mypy app 2>&1 | tail -5
```

**判决**:
- 两者均 `exit 0` + `no issues` → ✅ approve + **必须**登记 TD: `Validator 产物流程残缺 (未落 manifest.json)` 到 `.agents/tech-debt.json` + approve 报告里说明
- 任一有 error → 🔴 **直接 reject**, notes 写 "manifest 缺且 live ruff/mypy 有 N errors, 补不上"

**TD 登记模板** (粘贴到 `.agents/tech-debt.json` items 数组):
```json
{
  "id": "TD-XX",
  "title": "Validator 在 US-XXX 未产物化 manifest.json (partial FAKE)",
  "description": "Validator 跑完 pytest-full + mypy + ruff 后仅留 pytest-full.xml, 缺 manifest.json 凭证. Opus 亲跑 live ruff/mypy 补产物 0 error 后 approve.",
  "scope": ["scripts/ralph/verify-artifacts/US-XXX/", "~/.claude/scripts/ralph/VALIDATOR.md"],
  "impact": "Medium: Opus audit 需亲跑补产物凭证; 未来零回归 / meta-story 可能继续遗漏",
  "severity": "Medium",
  "categories": ["tooling", "audit-integrity"],
  "created_in_prd": "<当前 PRD>",
  "detected_in_prd": "<当前 PRD>",
  "detected_in_story": "US-XXX (Opus audit)",
  "fix_by": "下一 PRD 启动前",
  "status": "open",
  "fix_hint": "VALIDATOR.md 明确: meta-story / 零回归 story 必落 manifest.json; audit-artifacts.py 对 partial FAKE 降级为 WARN 而非 FAKE",
  "resolved_in_prd": null,
  "resolved_at": null
}
```

**来源**: PRD-5 US-030 首次触发 (2026-04-22), 详见 `.agents/retros/prd-5-vs-prd-4-retrospective.md §12 M-1`.

---

## Step 2 — 查 risk_level (1 秒)

```bash
cd <project-root>
python3 scripts/ralph/ralph-tools.py story US-XXX | grep -E "risk_level|size_hint"
```

如果 prd.json 没 risk_level 字段 (老 PRD 或 ralph skill 未打标), 按 **size_hint + 关键词人工推断**:

| story 特征 | risk_level | 原因 |
|-----------|-----------|------|
| 包含 proxy.py / gateway / forward / middleware / 热路径 | **high** | blast radius 大 |
| 包含金额: amount / balance / credit_ / refund / pricing / payment | **high** | 财务事故 |
| 包含并发: asyncio.Lock / atomic / concurrent / 并发 / race | **high** | 难复现 |
| 包含安全: auth / credential / Fernet / RSA / encrypt / decrypt | **high** | 密钥泄露 |
| 包含破坏性: drop_table / drop_column / destructive | **high** | 数据丢失 |
| 包含 test + regression / 全量 / suite | **high** | 关键验证 |
| 改 AGENTS.md / 红线 / 全局配置 | **high** | 元文档影响所有后续审计 |
| **被 ≥3 个下游 story `depends_on` 的 model / schema / protocol / 协议锁 / shared / `__init__` / conftest** (2026-05-04 新增) | **foundation** | 影响半径大,下游全靠它的语义 |
| service / 业务逻辑 / admin CRUD / portal API | **medium** | 业务正确性 |
| scheduler / job / cron / lifespan (不叠加其他 high 关键词) | **medium** | 幂等 |
| 纯 model / 字段 / schema / 常量 / 配置 / README (downstream <3) | **low** | 结构性 |

**downstream count 升档** (2026-05-04 新增 — 防 low 档 rubber-stamp 污染下游): 用 `python3 scripts/ralph/ralph-tools.py check-risk` 一键扫描. 规则: low + downstream≥3 + 关键词命中 → foundation; low + downstream≥5 → medium 起步; medium + downstream≥5 + 关键词 → foundation.

**多关键词叠加规则**: 命中多条时**取最高档** (high > medium > low). 例: "gateway scheduler atomic" → high (gateway + atomic).

---

## Step 3 — 按档跑 grep 清单

### 🟢 Low (~2 min, 2 条 grep)

必跑:
```bash
# A1 FK ondelete 覆盖
grep -rn "ForeignKey" backend/app/models/<story 新建 model>.py | grep -v "ondelete"
# 应 0 行

# A2 UTC datetime
grep -rn "timezone.utc" backend/app/<story touched>
# 应 0 行
```

### 🟡 Medium (~5 min, 3-5 条 grep)

Low 2 条 + 按域挑 3 条 (A/B/C/D/E/F/G 参考 AUDIT-CHECKLIST-TEMPLATE §按域专项):

| story 域 | 推荐 grep (挑 3 条) |
|---------|--------------------|
| 数据 | A3 __init__.py re-export · A4 非破坏迁移 · A5 partial unique 双参数 |
| 金额 | B1 money-critical 覆盖 · B2 禁 Float · B3 原子 UPDATE |
| 认证 | C1 password NOT NULL · C2 JWT typ · C3 bcrypt rounds |
| 支付 | D1 验签 · D2 幂等键 · D5 日志脱敏 |
| Gateway | E3 request.state 协议锁 · E4 零新依赖 |
| 并发 | F1 per-user Lock · F2 app.state 挂载 |

### 🔴 High (~10-15 min, 全量 grep + line-by-line + 必读测试代码)

执行**全部**域专项 grep (A1-A5 + 对应域 B/C/D/E/F/G 全部) + :

```bash
# 1. 读全部相关测试代码 (不只看 pytest.xml passed)
cat backend/tests/test_<相关文件>.py

# 2. SQL 约束实测 (若新建 partial unique / check)
python3 -c "
from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError
engine = create_engine('sqlite:///backend/data/test.db')
with engine.begin() as c:
    c.execute(text('INSERT <冲突场景 1>'))
    try:
        c.execute(text('INSERT <冲突场景 2>'))
        print('FAIL: 约束未生效')
    except IntegrityError:
        print('PASS: 约束生效')
"

# 3. line-by-line 读主文件 (每一行都对照 AC 和协议锁)
cat backend/app/<主文件>.py | less

# 4. 跨 story 协议一致性 (检查 PRD §7.5 协议锁所有命名在代码里逐字出现)
grep -rn "<协议锁名 1>" backend/app/
grep -rn "<协议锁名 2>" backend/app/
# 应全部命中, 命名一致
```

### 🟣 Foundation (~12-18 min, 跨 story 一致性核心 — 2026-05-04 新增)

**触发**: ralph-tools.py check-risk 报告升档, 或 prd.json risk_level=foundation, 或 story 改的是 model/schema/protocol/`__init__`/conftest 且 ≥3 个下游 story `depends_on`.

执行 high 档全部 grep + 以下 foundation 档独有检查:

```bash
# F1. 跨 story 命名逐字核对 (对照 PRD §7.5 协议锁)
# 列出本 story 改的所有公开符号 (类名/函数名/字段名/常量名)
python3 scripts/ralph/ralph-tools.py story US-XXX | grep -E "files_to_create|files_to_modify"
# 然后逐个 grep, 确保所有下游 story 都用相同名字
grep -rn "<本 story 定义的符号 1>" backend/app/
grep -rn "<本 story 定义的符号 2>" backend/app/

# F2. 下游 story AC 是否依赖本 story 字段语义
python3 scripts/ralph/ralph-tools.py deps | grep US-XXX
# 列出反向依赖, 逐个读 AC, 看是否依赖本 story 的字段含义
for downstream in <反向依赖列表>; do
  python3 scripts/ralph/ralph-tools.py story $downstream | grep -A 5 "acceptanceCriteria"
done

# F3. shared 文件读全
cat backend/tests/conftest.py
cat backend/app/<本 story 改动的 __init__.py>

# F4. SQL schema 完整审 (若是 schema/model story)
sqlite3 backend/data/test.db ".schema <table_name>"
# 对照 prd 定义, 字段类型 / NOT NULL / FK ondelete / 索引 全部核对

# F5. 协议锁与既有代码现状双对账 (2026-05-09 · QuanQn PRD-4 TD-012 经验)
# 防止 PRD 协议锁锁定新路径 · 但既有代码已有 stub 在旧路径 · 双路径并存
# 提取 PRD §1.5 / §7.5 协议锁锁定的所有新文件路径
grep -E "^\| .*\.(ts|tsx|py|sql|prisma|json)" tasks/prd-N.md | head -20
# 对每个锁定路径 · grep 既有代码看是否已存在同名/同 dir
for path in <锁定路径列表>; do
  basename=$(basename "$path")
  find apps packages backend -name "$basename" -type f 2>/dev/null | grep -v "$path"
done
```

**判决标准 (foundation 档独有)**:
- 任一下游 story 用了和本 story **不一致的命名** → reject (跨 story 协议漂移)
- 本 story 字段语义与下游 AC 假设**不符** → reject (下游会构建错误)
- shared 文件 (conftest / `__init__.py`) **未同步更新** → reject 或 TD 登记
- 下游 story 数 ≥5 但本 story 测试覆盖 <80% → 至少加 SHIELD 等级 TD
- **F5 命中既有 stub** (协议锁路径与既有代码冲突) → **reject 给 prd skill 修锁**, feedback 模板:
  > "PRD §1.5 协议锁路径 `<新锁定路径>` 与既有代码 `<既有 stub 路径>` 冲突 · 选 A 复用既有 / B 改协议锁文件名 / C 删旧 stub · 修后重提"
  >
  > **实证** (QuanQn PRD-4 US-001) · 协议锁锁 `apps/api/src/specialists/base/BaseSpecialist.ts` · 但 PRD-2 stub 在 `apps/api/src/agents/base/BaseSpecialist.ts` · ralph 选 import 既有 stub 产生 TD-012 · US-002 retry 1 才闭环。**F5 在 audit US-001 时跑会一次拦下,省 1 retry (~30 min)**。

---

## Step 4 — 读实现文件 + 协议核对 (low 跳, medium 1-3 min, high 5-10 min)

### 通用 4 维度快速自问

| # | 问题 | 怎么查 |
|---|------|-------|
| 1 | AC 逐条对上了吗? | `python3 scripts/ralph/ralph-tools.py story US-XXX` 对照实现文件 |
| 2 | AGENTS.md 红线违反? | Step 3 grep 清单结果 |
| 3 | 安全隐患? | Opus 直觉审: 密钥明文 / SQL 注入 / 权限绕过 / 回调重放 |
| 4 | PRD 一致性? | Locked Decisions D-XX 都落实了吗 |

### high 档额外

- **反例 clauses 真落地**: grep 对应 story AC 里的 "**绝不** X", 代码里真的没做 X
- **跨 story 协议锁逐字**: 定义 story + 消费 story 的命名一致 (看 PRD §7.5 表)
- **流式/并发的时序细节**: 读 `asyncio.Lock` / `await` / `atomic SQL` 位置, 想 race condition
- **Opus 盲点防御**: Ralph 可能"语义等价但非预期"(如双 unique 冗余, seed 无 audit log, SQLite NULL 陷阱)

---

## Step 4.5 — Opus 直 fix mechanical 错路径(2026-05-12 · QuanQn PRD-9 US-002 新增)

> **来源** · QuanQn PRD-9 US-002 (commit 3d26b92) · 19 lint+typecheck 错全 mechanical · ralph 已 5 retry + 3 ECONNRESET 死锁 · Opus 直 fix 5 min vs reject 让 ralph 又一轮 30 min retry hell
> **哲学** · 当错误是 mechanical 且 ralph 已陷入 infrastructure 死锁 · Opus 直 fix 比 reject 更经济 · 但**必须严守边界**防越界

### 触发条件(必须全部满足)

| # | 条件 | 验证方式 |
|:-:|---|---|
| 1 | 错误是 mechanical | import 排序 / 未用 import / 静默 lint 错 / tsconfig include 缺路径 / 拼写错 |
| 2 | 错误总数 < 20 lines | `git diff --shortstat` 看 +/- 行数 |
| 3 | 无逻辑改 | 不涉及 if / for / 算法 / 业务规则 / SQL where / API contract |
| 4 | ralph 已多 retry 或死锁 | retryCount ≥ 3 或 daemon 已写 audit-gate.json blocked_needs_attention 或 dev 连续 ECONNRESET ≥ 2 |
| 5 | reject 再让 ralph 跑 · 预计 ≥ 50% 撞 infra 失败 | 近期 ralph-output.log grep `ECONNRESET\|timeout\|health check fail` 高频命中 |

**任一条件不满足** → **必须 reject** · 走 Step 5 normal path

### 流程

```bash
# 1. Opus 直 Edit 修复 (用 Edit/Write 工具)

# 2. 验证 (跑全套硬门禁)
cd <project-root>
pnpm typecheck   # 或 .venv/Scripts/mypy app
pnpm lint        # 或 .venv/Scripts/ruff check app tests
pnpm test        # 或 .venv/Scripts/pytest -q
# 全 0 错 / 0 fail · 进 3

# 3. 提 chore commit (明确标"Opus audit fix")
git add <fixed files>
git commit -m "chore: [US-XXX] Opus audit fix · <一句话描述> + lint clean

<具体 fix 列表>

零行为变化 · pnpm typecheck/lint/test 全过 · 详 audit log
"

# 4. 走 Step 5 approve 路径 (ralph-tools.py approve)
python3 scripts/ralph/ralph-tools.py approve

# 5. Approve 报告显式标 (必做)
# "Opus 直 fix mechanical 错 commit XXXXXXX 避免 ralph 又一轮 retry · 详 Step 4.5 路径"
```

### 禁止滥用(严守边界)

- ❌ 错误 ≥ 20 lines · 必须 reject 让 ralph 修(避免越界)
- ❌ 涉及逻辑改(if / for / 算法 / SQL where / API contract)· 必须 reject(产品决策)
- ❌ ralph retryCount < 3 · 应让 ralph 自己学(防过度保护)
- ❌ 跨 story 协议改 · 必须 reject(可能影响下游 story)
- ❌ 涉及 anti_patterns / 红线 / 安全 · 必须 reject(防 Opus 漏审)

### 实证案例

**QuanQn PRD-9 US-002 (2026-05-11 commit 3d26b92)**:
- 触发 · scripts/ 目录不在 apps/api/tsconfig.json include · seed-knowledge-chunk.ts 静默漏审
- Fix · 改 include 加 "scripts" + 删未用 Decimal import + import order 重排 + 顶部加 `/* eslint-disable no-console */`
- 体量 · 2 files · +7/-6 lines · 0 逻辑改
- ralph 状态 · 5 retry + 3 ECONNRESET 死锁 · audit-gate blocked_needs_attention
- ROI · 5 min Opus 直 fix vs 预估 30+ min reject + 又一轮 retry(撞 ECONNRESET 概率高)
- 结果 · approve · 详 audit-log-QuanQn.jsonl US-002

---

## Step 5 — approve / reject (30 秒)

### Approve 路径

```bash
cd <project-root>
python3 scripts/ralph/ralph-tools.py approve
```

### Approve 报告模板 (必须输出给用户)

```markdown
## US-XXX Audit 通过 ✅

**risk_level**: low/medium/high
**审计耗时**: X min
**艺术**: 快审 / 标审 / 深审

### 通用 4 维度
- 验收标准: AC N/N PASS (file:line)
- AGENTS.md: 红线 X 条全扫通过
- 安全: 无 Blocker
- PRD 一致性: D-XX..D-YY 全落实

### Step 3 grep 结果
- A1 FK ondelete: PASS (0 违规)
- A2 UTC: PASS
- (更多条目)

### TD 豁免 (若有)
- TD-X 豁免 approve: <具体理由>, 证据: <file:line>, 不影响本 story 功能
  (已登记 tech-debt.json + 已写入 progress.txt)

### 实测证据 (仅 high 档)
- pytest -q: N passed / 0 failed (读自 pytest-full.xml)
- SQL 约束实测: partial unique 生效 / FK CASCADE 确认
```

### Reject 路径

```bash
cd <project-root>
python3 scripts/ralph/ralph-tools.py reject "$(cat <<'EOF'
**Blocker**: <具体问题>

**当前代码** (file:line):
```python
<当前错误代码>
```

**目标代码**:
```python
<期望代码>
```

**绝对不能**:
- <反例 1>
- <反例 2>
- <反例 3>

**验证方式**:
- <如何验证修复生效>
EOF
)"
```

### TD 免罪留痕三联动 (必做, 缺一不可)

若 approve 路径 + 豁免某个 tech debt:

**1. Approve 报告里写**:
```
TD-X 豁免 approve: <理由>, 证据: <file:line>, 不影响本 story 功能
```

**2. 登记或更新 `.agents/tech-debt.json`**:
```bash
# 若新发现 TD
# 在 items 数组加一条 (见 tech-debt schema)

# 若已有 TD, 更新 detected_in_prd / detected_in_story
```

**3. progress.txt 记录**:
```markdown
## YYYY-MM-DD HH:mm - US-XXX (Opus audit)
- TD-X 豁免: <理由>
- 证据: <file:line>
- 影响评估: <本 story 功能不受影响>
---
```

**缺一不可**: 任何一项没做 = 偷懒, 未来 /prd-retro 会标"审查偷懒"。

---

## ⚠️ 常见陷阱 (Opus 易踩)

1. **只读主文件就 approve**: 必须检查 __init__.py 同步 / test 配套 / 跨文件命名一致
2. **信 Validator 文字声明**: 读产物 (pytest-full.xml / ruff.json 实际内容), 不信 "N passed" 文字段落
3. **pre-existing 当免罪金牌**: 必须登记 TD, 否则污染下一个 PRD
4. **跳 Step 1.5 补跑**: Validator 未产物化时, Opus **必须亲跑 pytest**, 否则零回归门禁形同虚设
5. **high 档不读测试代码**: pytest.xml 显示 "passed" 不等于测试覆盖 AC 原意, 必须读 test 函数
6. **SQL 约束跳过实测**: partial unique / check constraint 可能写对了 SQL 但 SQLite NULL 语义陷阱 (见 TD-9)
7. **跨 story 协议命名漂移**: US-022 定义 `request.state.chosen_channel_id`, US-024 消费必须逐字一致, 不是"类似名字"

---

## 🔄 反馈机制

本 Cheat Sheet 是**活文档**。每次 /prd-retro 发现 Opus 漏项, 追加到"常见陷阱"。

---

## 版本

- 2026-04-21: 初版, PRD-4 Wave 1 深审驱动
