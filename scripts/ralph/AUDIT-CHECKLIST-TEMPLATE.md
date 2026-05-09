# Opus Audit Gate — 审计清单模板(按域专项)

> Step 5.5 Opus 质量审查使用。每次新 PRD 启动前,Opus 基于本模板定制项目专属 audit 清单;审计每个 Story 时按清单执行,不要裸审。
>
> **背景**:复盘 §8 指出,PRD-2 在通用 4 维度基础上引入的"专项 grep 扫描"使 audit 速度从 5-10 min 降到 3-8 min 且覆盖更深。本模板固化此方法。
>
> **2026-04-21 升级 (PRD-4 Wave 1 深度审计驱动)**: 新增 §0 审前必跑 4 项实测 (硬门禁), 新增 §Z 风险分档 (risk_level 决定审计强度)。

---

## §0 Opus 审前必跑 4 项实测(硬门禁 — 2026-04-21 新增)

### 为什么

PRD-4 Wave 1 深度审计发现: Opus approve 前**只读代码不跑测试**是系统性偷懒。US-001..US-007 全部 rubber-stamp, 事后才发现 4 个 Warning + 5 个 Note + TD-8 (317 pre-existing ruff)。"看起来对"不等于"实际对"。

### 硬门禁 4 项(data/service/api/gateway 全类 story 都跑)

Opus 发 `ralph-tools.py approve` 之前, **必须在本机亲跑**以下 4 项, 任一失败 → 转 reject 或登记 tech-debt 后才 approve:

#### 1. pytest -q 零回归(全量)
```bash
cd backend && .venv/Scripts/pytest -q 2>&1 | tail -5
```
- 判决: `X passed, 0 failed, 0 errors` → 通过; 否则 **reject** (零回归硬门禁)
- 成本: 30-60s. 值得。
- **豁免**: Validator 已产物 `pytest-full.xml` 且 0 fail → 可信, 不必重跑 (X-6 产物等价)

#### 2. mypy app 全扫
```bash
cd backend && .venv/Scripts/mypy app 2>&1 | tail -3
```
- 判决: `Success: no issues found in X source files` → 通过; 否则看是否本 story 引入 (是则 reject, pre-existing 则登记 TD-N 后 approve)
- 成本: 5-15s

#### 3. 新模型 import 自检(仅 data 域 story)
```bash
cd backend && .venv/Scripts/python -c "from app.models import <story 新增 models>; print('IMPORT OK')"
```
- 判决: 打印 `IMPORT OK` → 通过; 否则说明 `models/__init__.py` 漏改 → **reject**
- **触发条件**: story 新建了 models/*.py

#### 4. SQL 约束实测(仅新建 partial unique / check 约束的 story)
```bash
# 示例: 验证 partial unique 真生效
python3 -c "
from sqlalchemy import create_engine, text
engine = create_engine('sqlite:///backend/data/test.db')
with engine.connect() as c:
    c.execute(text('INSERT INTO channel_credentials ... is_active=1')); c.commit()
    try:
        c.execute(text('INSERT INTO channel_credentials <相同 channel_id + credential_type> is_active=1')); c.commit()
        print('FAIL: partial unique 未生效')
    except IntegrityError:
        print('PASS: partial unique 生效')
"
```
- 判决: 按 AC 预期 IntegrityError → 通过
- **触发条件**: migration 新增 partial unique 或 check constraint

### 豁免情况(留痕要求)

以下 3 类 story 可豁免某些实测, 但**必须在 approve 报告里明写**:

| 情况 | 可豁免 | 不可豁免 |
|------|--------|----------|
| 纯文档/配置 story (无 Python 代码改动) | pytest, mypy, import, SQL | — |
| 纯常量定义 story (如 EVT_* 字符串) | import, SQL | pytest, mypy |
| 非 data 域 story | SQL | pytest, mypy, import (若有 models) |

### TD 免罪金牌规则(2026-04-21 新增)

当 pytest-full / mypy / ruff 报错但 Opus 判断是**pre-existing tech debt 非本 story 引入**时:
- ✅ **必须**在 approve 报告里写: `TD-X 豁免 approve: <具体理由>, 证据: <file:line>, 不影响本 story 功能`
- ✅ **必须**登记或更新 `.agents/tech-debt.json` (加 detected_in_prd 字段)
- ✅ **必须**在 progress.txt 记录这次豁免
- ❌ **不允许**口头说"pre-existing 跳过"就 approve, 那会污染未来 PRD

### 审前 4 项实测 OK 才能进"设计审查"

流程重排:
```
旧流程: 读产物 → 读代码 → approve
新流程: 审前 4 项实测 → 读产物 → 读代码 + 跨 story 一致性 → 安全 grep → approve
```

---

## 通用 4 维度(必审,每个 Story 都过)

| # | 维度 | 检查点 |
|---|---|---|
| 1 | **验收标准合规** | AC 逐条对照代码实现,每条给 PASS/FAIL + 证据(file:line) |
| 2 | **AGENTS.md 技术约束** | 红线清单每条扫一遍(NOT NULL / FK ondelete / UTC / money-critical / 目录分层 等) |
| 3 | **安全** | 密钥管理、SQL 注入、XSS、权限隔离、JWT 校验、回调验签 |
| 4 | **PRD 一致性** | 实现是否与 PRD 描述一致,Locked Decisions 是否被遵守 |

---

## 🚨 Opus 审查新流程(2026-04-20 X-all 升级 — 读产物不重跑,重分职责)

### 为什么存在

**V-a/V-b 旧方案的失败**: 让 Opus 多跑命令 / 让 Validator 粘贴 stdout, 都是"**让不同角色重复做同样的事**"或"**可伪造的主观声明**". US-008 事故证明:Validator 粘贴 "1 passed" 但 AC 指定的测试文件根本不存在 — 捏造的 stdout.

**X-all 新方案**: 改**证据形态**而非增加重复劳动:
- 测试命令**必须落盘结构化产物**到 `scripts/ralph/verify-artifacts/<story-id>/`
- Opus **读产物**(文件存在 + OS 时间戳 + 内容 hash + JUnit XML schema),不跑测试
- Sonnet 无法伪造 OS 时间戳和合法 JUnit schema, 产物 = 不可伪造证据

### Opus 新审查流程(4 步)

#### Step 1: 产物校验(核心,不跑测试)

```bash
# Opus 跑产物验证脚本, 1 秒出结果
python ~/.claude/scripts/ralph/audit-artifacts.py <story-id>
```

输出:
```
✓ 产物齐全: pytest.xml / mypy.txt / ruff.json / manifest.json
✓ 时间戳在 Validator 运行窗口内(21:12-21:15 ∈ validator_start_ts..end_ts)
✓ pytest.xml: <N> tests, <N> passed, 0 failed (schema valid)
✓ mypy.txt: Success: no issues found in X source files
✓ ruff.json: 0 errors
✓ manifest.exit_code=0

→ ARTIFACTS VALID (可进语义审查)
```

如果 `ARTIFACTS MISSING` 或 `ARTIFACTS FAKE`(时间戳异常/schema 错误) → **直接 reject**, 不用语义审查.

#### Step 2: 读代码做"设计审查"(Sonnet 做不到)

- AC 的**意图**(非语法)是否被满足?
- 代码逻辑是否符合 AGENTS.md 的架构(router/service/models 分层)?
- 是否有隐藏的副作用 / 时序 bug?

#### Step 3: 跨 story 协议一致性(只有 Opus 有全景视野)

- `request.state.xxx` / `app.state.xxx` 命名是否和 PRD §7.5 协议锁一致?
- 事件常量 `EVT_*` / `ACTION_*` 是否和定义 story 一致?
- FK ondelete 方向是否合理?

#### Step 4: 安全 + 红线 grep(Opus 高阶直觉 + 机械扫描)

```bash
# AGENTS.md 红线 grep 必扫
grep -rn "money-critical" <涉及金额文件>   # 覆盖金额字段
grep -rn "Float\|float" <services>         # 0 出现
grep -rn "timezone.utc" <app>              # 0 出现(应 UTC)
grep -rn "ondelete" <models>               # FK 显式
```

+ Opus 直觉审查:
- 并发重入 / 签名时序 / 信息泄露 / 密钥明文 / 回调重放

### Opus 不再做的事(X-all 升级后)

- ❌ 跑 pytest / mypy / ruff(已产物化)
- ❌ 粘贴 stdout(机械重复)
- ❌ 重复 Validator 的工作

### Opus 专属价值

- ✅ 读产物 + 时间戳交叉校验
- ✅ 设计审查(语义层)
- ✅ 跨 story 协议一致性(全景视野)
- ✅ 安全直觉(模型盲点防御)
- ✅ AGENTS.md 红线 grep(机械 + 精准)
- ✅ 反例审核("绝对不能"语义守护)

### 硬约束规则

Opus 审查时, 对以下**运行时验证**类 AC, **必须亲跑**命令并记录 stdout 摘要, 不能仅依赖 Validator 文字声明:

| AC 类型关键词 | Opus 亲跑命令(必做) |
|---|---|
| `alembic downgrade / upgrade cycle` / 迁移可逆 | `backend/.venv/Scripts/python -m alembic downgrade -1 && alembic upgrade head`(先 `cp data/*.db` 备份) |
| `pytest -v` / `Tests pass` / 单元/集成测试 | `backend/.venv/Scripts/pytest tests/test_xxx.py -v` 亲跑, 看输出 `X passed` |
| `mock 篡改 / 并发测试` / race condition | `pytest -k "tampered or concurrent" -v` 亲跑 |
| `mypy` / `ruff check` | 亲跑, 确认 `Success` / `All checks passed` |
| 涉及**外部 API 联调**(哪怕 mock) | 至少 pytest 跑一次 mock 测试 |

### 不需要亲跑(grep + 代码审查足够)

- 纯模型定义(字段类型 / FK / index)— 读代码足够
- 常量 / 枚举定义 — 读代码足够
- AGENTS.md 红线 grep(`money-critical` 注释 / `Float/float` 零出现 / `timezone.utc` 零出现)
- AC 仅要求"代码里出现某字符串" — grep 即可

### 亲跑结果记录

审查完成、`ralph-tools.py approve` 前,Opus 发给用户的审查报告**必须包含** "Opus 亲跑命令" 段, 形如:

```
## Opus 亲跑证据
- alembic cycle: upgrade OK → downgrade -1 OK (4 表全 drop) → upgrade head OK (4 表重建 + partial unique 索引回来). cycle 可逆 ✓
- pytest: test_payments_alipay.py 11 passed in 0.28s ✓
- mypy: Success no issues ✓
```

无运行证据的 approve **不算合格审查**, /prd-retro 时会被标"审查偷懒"。

---

## §Z 风险分档(2026-04-21 新增 — 审计强度差异化)

每个 story 在 prd.json 生成时标 `risk_level: "low" | "medium" | "high"`。ralph skill 按下列规则打标,Opus 审计按分档分配强度:

### 分档标准

| risk_level | 典型 story | 审计强度 |
|------------|-----------|----------|
| **low** | 纯 model 字段 / 常量定义 / 小迁移 / 文档 / scheduler 简单 job | §0 4 项实测 + 通用 4 维度 + 域专项 grep 1-2 条 |
| **medium** | service 层业务逻辑 / admin CRUD API / portal 只读 API / 简单 event handler | §0 4 项实测 + 通用 4 维度 + 域专项 grep 3-5 条 + 关键函数代码阅读 |
| **high** | gateway 热路径 (proxy.py) / 金额变更 (credit/refund/pricing) / 并发 (Lock/Pool) / 安全敏感 (auth/credential/payment) / 破坏性变更 (drop_table/drop_column) | §0 4 项实测 + 通用 4 维度 + **全部**域专项 grep + 手工代码 line-by-line 审 + SQL 约束实测 + **必读全部相关测试代码** (不只看 pytest.xml) |
| **foundation** (2026-05-04 新增) | 被 ≥3 个下游 story `depends_on` 的 model / schema / protocol / 共享 type / 跨 story 协议锁 / shared fixture / `__init__` re-export | §0 4 项实测 + 通用 4 维度 + **全部**域专项 grep + **跨 story 命名一致性逐字核对** (对照 PRD §7.5 协议锁) + **下游 story AC 是否依赖本 story 字段语义** + 必读 conftest.py / `__init__.py` / shared schemas |

### 打标规则(ralph skill 自动, Opus 可调整)

ralph skill 转 prd.json 时按关键词自动打 risk_level。**多关键词命中时取最高档** (high > medium > low)。

| 关键词 | risk_level | 备注 |
|--------|-----------|------|
| `proxy.py` / `forward` / `gateway` / `middleware` / `热路径` | **high** | blast radius 大 |
| `amount` / `balance` / `credit_` / `refund` / `pricing` / `payment` / `money` / `金额` / `余额` / `积分` | **high** | 财务事故 |
| `asyncio.Lock` / `atomic` / `concurrent` / `并发` / `race` / `信号量` / `乐观锁` | **high** | 难复现 |
| `auth` / `credential` / `secret` / `Fernet` / `RSA` / `encrypt` / `decrypt` | **high** | 安全敏感 |
| `drop_table` / `drop_column` / `destructive` / `破坏性` | **high** | 不可逆 |
| `test` + `regression` / `全量` / `suite` / `zero-regression` / `e2e` | **high** | 关键验证 (2026-04-21 新增) |
| `AGENTS.md` / `红线` / `审计规则` / `元文档` / `global config` | **high** | 元文档影响所有后续审计 (2026-04-21 新增) |
| `service` / `business logic` / `admin CRUD` / `portal API` | **medium** | 业务正确性 |
| `scheduler` / `job` / `cron` / `lifespan` (不叠加其他 high 关键词) | **medium** | 幂等 |
| `model` / `字段` / `schema` / `常量` / `配置` | **low** | 结构性 |
| `README` / `CHANGELOG` / 代码注释 | **low** | 非规则性文档 |

**叠加规则** (2026-04-21 新增):
- 多个关键词命中时取**最高档**
  - 例 1: "gateway scheduler atomic SQL" → **high** (gateway + atomic 都命中)
  - 例 2: "scheduler cron lifespan" → **medium** (只命中 medium)
  - 例 3: "test regression" → **high** (关键验证)
- 特殊叠加:
  - `scheduler + atomic / lock` → **high** (调度 + 并发)
  - `lifespan + seed / migrate` → **medium+** (启动副作用)
  - `api + admin + credential` → **high** (管理端 + 凭证)

**downstream count 升档规则** (2026-05-04 新增 — 防 low 档 rubber-stamp 污染下游):

不只看 story 内容关键词, 还要看**下游 story 数** (反向 `depends_on` 计数). 一个 5 行 SQLAlchemy model 可能比 200 行 service 影响半径大. 计算每个 story 的下游数后, 按下表自动建议升档:

| 当前档 | downstream count | 关键词命中 | 自动建议升档 |
|--------|------------------|-----------|--------------|
| low | ≥3 | model / schema / protocol / `__init__` / 协议锁 / shared / conftest | → **foundation** |
| low | ≥5 | 任意 | → **medium 起步** |
| medium | ≥5 | model / schema / protocol / 协议锁 | → **foundation** |

**自动化命令**: `python3 scripts/ralph/ralph-tools.py check-risk` (CI 友好, 非零退出表示有需要升档的 story)

升档了的 story 在 notes 字段加: `[risk-upgrade] low → foundation due to downstream=N + <关键词>`

Opus 可在 plan-check 时手工调整。手工调整必须在 story notes 字段记录原因。

### 实战示例 (PRD-4 分档)

| Wave | Stories | 主风险 | risk_level |
|------|---------|--------|-----------|
| Wave 1 数据层 | US-001..US-007 | Alembic 破坏性 / models/__init__ 同步 | low (大部分) / medium (US-007 迁移) |
| Wave 2 Service | US-008..US-013 | Fernet / routing 策略 / compute_cost 破坏 | medium (US-008/013) / high (US-010 Fernet, US-012 routing) |
| Wave 3 Admin API | US-014..US-018 | CRUD + credential 脱敏 | medium (US-014/015/017/018) / high (US-016 credential) |
| Wave 4 Portal API | US-019/020 | 只读 + 偏好写 | low (US-019) / medium (US-020) |
| Wave 5 Gateway | US-021..US-024 | proxy.py 热路径 + failover | **high (全部)** |
| Wave 6 Scheduler | US-025/026 | health check + auto_degrade | medium (US-025) / high (US-026 atomic SQL) |
| Wave 7 Tests | US-027 | 全量 + 回归硬门禁 | **high** (关键验证) |

---

## 按域专项清单(按 PRD 性质挑相关几节用)

### A. 数据层 PRD(新表/新字段/新迁移)

```bash
# A1: 外键 ondelete 覆盖
grep -rn "ForeignKey" backend/app/models/ | grep -v "ondelete"
# 应该 0 行(所有 FK 都显式写了 ondelete)

# A2: datetime UTC 规范
grep -rn "timezone.utc" backend/app/
# 应该 0 行(ruff UP017)
grep -rn "datetime.now(UTC)" backend/app/
# 应该命中所有时间字段

# A3: 新模型 re-export
grep -l "class.*Base.*:" backend/app/models/*.py | while read f; do
  name=$(basename "$f" .py)
  grep -q "from .$name" backend/app/models/__init__.py || echo "FAIL: $f 未 re-export"
done

# A4: Alembic 迁移非破坏性
grep -rn "op.drop_table\|op.drop_column" backend/alembic/versions/<new_migration>.py
# 应该 0 行(除非明确批准破坏既有表)

# A5: 部分唯一索引双参数
grep -rn "op.create_index" backend/alembic/versions/<new>.py | grep -v "postgresql_where\|sqlite_where"
# 所有 partial unique 都应同时有 sqlite_where 和 postgresql_where
```

### B. 金额/财务 PRD(credit_*、payment、balance 类)

```bash
# B1: money-critical 注释覆盖
grep -c "money-critical" backend/app/models/<金额模型>.py
# 每个金额字段必须有

# B2: 金额类型全 Integer(禁 Float)
grep -rn "Float\|float" backend/app/models/<金额模型>.py backend/app/services/<金额 service>/
# 应该 0 行(金额路径禁 Float)

# B3: 原子更新(不允许先读后写)
grep -rn "SELECT.*WHERE.*balance\|row.balance.*=" backend/app/services/<金额 service>/
# 检查是否所有变更都用 UPDATE ... WHERE version=?

# B4: 乐观锁 version 字段
grep -rn "balance_version\|version_snapshot" backend/app/services/<金额 service>/
# 应该在所有 atomic_debit/credit 里用

# B5: append-only 流水
grep -rn "UPDATE credit_events\|credit_events.*UPDATE" backend/app/
# 应该 0 行(流水只追加不修改)
```

### C. 认证/鉴权 PRD(users、JWT、session)

```bash
# C1: password_hash NOT NULL
grep -n "password_hash" backend/app/models/user.py
# 应该是 Mapped[str] 不是 Mapped[str | None]

# C2: JWT typ claim 区分
grep -rn 'typ.*user\|typ.*admin' backend/app/services/security.py backend/app/api/deps.py
# admin 和 user 的 JWT 不能混

# C3: bcrypt rounds >= 12
grep -rn "bcrypt.*rounds\|bcrypt.hashpw" backend/app/services/security.py

# C4: IP 限流
grep -rn "IPLoginLimiter\|rate_limit" backend/app/api/portal/auth.py

# C5: 登录失败不暴露账号存在性
# 人工审:错误文案是否都是"邮箱或密码错误",不是"邮箱不存在"
```

### D. 支付回调 PRD(PRD-3 专用)

```bash
# D1: 回调必验签
grep -rn "verify_signature" backend/app/services/payments/
# 每个回调 handler 必须调用

# D2: 幂等键
grep -rn "unique.*gateway.*out_trade_no\|UniqueConstraint" backend/app/models/payment.py
# payments 表必须有 unique (gateway, out_trade_no)

# D3: 金额验证
grep -rn "float" backend/app/services/payments/
# 应该 0 行

# D4: 私钥加密存储
grep -rn "Fernet\|ENCRYPTED_" backend/app/services/payments/
# 支付私钥必须加密,不能明文

# D5: 回调日志脱敏
grep -rn "audit.log.*body\|audit.log.*signature" backend/app/services/payments/
# 敏感字段不能进 audit_logs
```

### E. Gateway / 反代 PRD(proxy.py 改动)

```bash
# E1: /admin/* 路由未受影响
grep -n "^@app.*admin\|admin_router" backend/app/api/admin/
# 人工核对:本 PRD 不应修改 admin 路由的业务语义

# E2: health 端点可达
curl -s localhost:8000/healthz 2>/dev/null | grep -q "ok"

# E3: request.state 命名按协议锁
grep -rn "request.state\." backend/app/gateway/
# 每个属性都应在 PRD §7.5 跨 Story 协议锁中登记

# E4: 无新增 Python 依赖
diff backend/requirements.txt <(git show HEAD:backend/requirements.txt)
# 应该 0 差异
```

### F. 并发/异步 PRD(Lock、Pool、asyncio)

```bash
# F1: per-user Lock
grep -rn "asyncio.Lock\|_user_locks" backend/app/services/
# 并发敏感 service 应该用 per-user Lock

# F2: app.state 挂载点
grep -rn "app.state\." backend/app/main.py
# 所有共享资源(ReservationPool 等)应在 lifespan 注册

# F3: await 覆盖
# 人工审:async def 内所有 IO(db / http / file)都要 await
```

### G. 测试 PRD(新测试 story)

```bash
# G1: fixture 注入
grep -rn "autouse=True\|@pytest.fixture" backend/tests/conftest.py

# G2: 并发测试
grep -rn "asyncio.gather\|asyncio.wait" backend/tests/

# G3: 回归测试数不减少
pytest --collect-only -q backend/tests/ | tail -1
# 跟上一个 PRD 结束时比,不能降(除非明确移除了废弃功能)
```

---

### H. Frontend list/dropdown PRD(2026-05-08 · QuanQn PRD-3 US-006 经验)

> **背景**: PRD-3 US-006 实证 — `AccountDropdown` 漏写 `<ScrollArea>`,DB 累积 30+ accounts 时新建 item 在 dropdown viewport 外,playwright click 56 × retry 30s timeout。**ralph 12 iter blocked,Opus 接管 30min 才发现真根因**。`ToolsDropdown` 同 codebase 内有正确模式(`<ScrollArea className="h-52">`),但被遗漏。
>
> **触发条件**: PRD 含**任何 list/dropdown/select/combobox/grid 类组件**(Radix DropdownMenu / Select / Command / 自实现 list)— 不分前端/全栈 PRD。

```bash
# H1: list 类组件套 ScrollArea 检查
# 找 .map(...) 直接渲染 list items 的 dropdown/menu/select(没套 ScrollArea)
grep -rB2 -A3 "DropdownMenuContent\|SelectContent\|CommandList\|PopoverContent" \
  apps/web/src apps/admin/src --include='*.tsx' 2>/dev/null \
  | grep -E "\.map\(" \
  | grep -v "ScrollArea"
# 命中后人工看是否真的需要 ScrollArea(N>8 必须 · N≤8 推荐)

# H2: ScrollArea 必带显式高度(ScrollArea 没 h-N 不工作)
grep -rE "<ScrollArea\s" apps/web/src apps/admin/src --include='*.tsx' \
  | grep -v -E "h-\d+|max-h-\d+|h-\[\d+|className=\".*h-"
# 命中说明 ScrollArea 没高度 · 视觉无 scroll(Radix viewport 会按 children height 撑开)

# H3: e2e 测试是否覆盖大 N 数据场景
grep -rE "(beforeAll|test\.beforeAll)" tests/e2e --include='*.spec.ts' \
  | grep -v "cleanup\|reset\|truncate"
# 命中说明 e2e 没 beforeAll cleanup · DB 累积可能让 list 测试 flaky

# H4: shared dev user e2e workers=1 配置(防 active_account_id race)
grep -E "workers" playwright.config.ts apps/web/playwright.config.ts 2>/dev/null
# fullyParallel=true 时 · 共享 user 的 list e2e 必须明确 workers=1 或 use isolation
```

**判决标准**:
- H1 命中 + N 可能 > 8(账号 / 工具 / 任务列表等)→ **必须**修(套 ScrollArea + h-N)· 阻断 audit
- H1 命中但 N ≤ 8 固定数(如 14 工具 · 5 状态)→ 推荐套 · 不阻断
- H2 命中 → 必须修(给 ScrollArea 加高度)
- H3 命中 + e2e 用共享 dev user → 推荐加 beforeAll cleanup · 不阻断 · TD 留下个 PRD
- H4 命中 → 推荐 · 不阻断

**反例库链接**: `~/.claude/playbooks/reject-examples.jsonl` 关键词 `viewport overflow / ScrollArea / dropdown click timeout` 可检索 PRD-3 US-006 实证。

---

### I. Multi-mode Specialist race window(2026-05-09 · QuanQn PRD-4 TD-014 经验)

> **背景**: PRD-4 7 Specialist 中 4 个用 multi-mode(`PositioningAgent` industry/execution · `BrandingAgent` packaging/persona · `VideoAgent` 4 mode · `CopywritingAgent` 4 mode)。ralph 用 `private _mode` instance state + `outputSchema` getter 按 mode 返回 schema · `invokeLLM` 改 _mode → BaseSpecialist safeParse 读 _mode · **await 间隙其他 execute() 切入 race window**。P3 单 user 串行不触发 · 但**架构层 design smell**。
>
> **触发条件**: PRD 含**多 mode Specialist** 类组件(同一 class 按 req.mode 输出不同 schema)。

```bash
# I1: instance state `_mode` race 检查
grep -B2 "_mode" apps/api/src/specialists/<Agent>.ts \
  | grep -E "private\s+_mode|this\._mode\s*="
# 命中说明用 instance state · 高并发场景 race 风险

# I2: outputSchema 是 getter 还是 method?
grep -E "outputSchema" apps/api/src/specialists/<Agent>.ts \
  | grep -E "get\s+outputSchema|outputSchema\s*\("
# getter + instance state → race 风险(approve · 文档化 TD-014)
# method (req) => schema → 安全(approve)

# I3: 单例 export(REJ-004) + multi-mode 是否文档化 race window
grep -E "export const \w+Agent" apps/api/src/specialists/<Agent>.ts
# 命中 + multi-mode → 必须文档化"P3 单 user 串行场景安全 · 高并发治理留 PRD-7+"
```

**判决标准**:
- I1 命中 + I2 getter + I3 单例 → **approve · 必须**在 audit notes 写 "⚠️ TD-014 模式继承 · 高并发治理留 PRD-7+"
- I1 命中 + I2 method → **approve**(stateless 安全)
- I1 不命中 + I2 getter(outputSchema 是常量属性 · 单 mode)→ **approve · 单 mode 模板**

**反例库链接**: `~/.claude/playbooks/reject-examples.jsonl` 关键词 `multi-mode race / instance state / outputSchema getter` 可检索 PRD-4 TD-014 实证。

**TD-014 文档化模板**:
```
⚠️ Multi-mode Specialist · _mode race window
- 当前实施 · _mode instance state + outputSchema getter
- P3 单 user 串行安全 · race window 短(BaseSpecialist execute 内 invokeLLM → safeParse 同 await chain)
- 高并发治理 · 留 PRD-7+(选项 A · outputSchema 改 method · 选项 B · AsyncLocalStorage 隔离)
```

---

### J. Cross-cut router coverage(2026-05-09 · QuanQn PRD-4 US-017 经验)

> **背景**: PRD-4 US-017 9 步 e2e 才发现 stepData.save handler 漏 step5/7 · UI skeleton 永挂 · 浪费 1 次 e2e 跑(~30 min)。原因是 Specialist Wave 4 时各 US 只加自己的 step branch · **没人负责"全 N step coverage"的 cross-cut audit**。
>
> **触发条件**: PRD 含**N-step / N-route / N-mode router**(stepData.save / 9 step / 14 工具 / 多 mode 调度)。

```bash
# J1: router handler 全 N coverage 检查
grep -E "case '(step|route|mode)\w+'" apps/api/src/trpc/routers/<router>.ts
# 输出全部 case · 与 PRD §1 列出的 N 项对账(数量 + 命名一致)

# J2: e2e spec 全 N 路径覆盖
grep -rE "await page\.goto\('/(step|tool|module)/" tests/e2e --include='*.spec.ts' \
  | sort -u | wc -l
# 与 PRD §1 列出的全 N 路径数量对账

# J3: handler 漏 step → save 返回 null → UI skeleton 永挂
# 检查 router save 默认分支
grep -A3 "default:" apps/api/src/trpc/routers/<router>.ts \
  | grep -E "return null|return undefined|throw"
# 默认 throw 比 return null 安全(漏 step 立刻报错而非静默失败)
```

**判决标准**:
- J1 case 数 < PRD §1 列表数 → **reject · 必须**补全所有 case
- J2 e2e 覆盖 < PRD §1 列表数(如 9 步全 e2e)→ **TD 登记**(本期不阻断 · 留下 PRD 收尾补)
- J3 默认分支 return null → **approve · 必须**在 audit notes 写 "建议改 throw('Unsupported X') 防漏 case 静默失败"

**反例库链接**: `~/.claude/playbooks/reject-examples.jsonl` 关键词 `router cross-cut / handler missing case / save return null` 可检索 PRD-4 US-017 实证。

---

## Audit 记录格式(每个 Story 审完写 notes)

```
[Opus Audit] YYYY-MM-DD HH:mm - Story X

✅ 维度 1 验收标准: PASS (AC 1-N 全部对上 file:line)
✅ 维度 2 AGENTS.md: PASS (红线 A1-A5 全通过)
✅ 维度 3 安全: PASS (C1-C3 通过,无 SQL 注入风险)
✅ 维度 4 PRD 一致: PASS

专项扫描:
- A1 FK ondelete: PASS (grep 0)
- A2 UTC: PASS
- B1 money-critical: PASS (3/3 字段覆盖)

→ approve
```

或:

```
[Opus Audit] YYYY-MM-DD HH:mm - Story X

❌ 维度 2 AGENTS.md 未通过:
  - B1 money-critical: credit_balance.total_consumed 缺注释(models/credit.py:87)
  
→ reject(用 REJECT-TEMPLATE.md 模板)
```

---

## 使用流程

1. 新 PRD 启动时,Opus 基于本模板 + PRD 内容写一份项目专属 checklist(保存到 `.agents/audit-checklist-prd-N.md`)
2. 每个 Story 的 Step 5.5 审查时,按 checklist 执行,最后输出 approve 或 reject
3. 发现新类型问题(比如 PRD-3 支付发现新检查点),追加到本模板或项目 checklist 里作为知识积累

---

## 版本历史

- **2026-04-13**: 初版 (Coding 3.0 通用 4 维度 + 按域专项 grep)
- **2026-04-20**: X-all 升级 — 产物化审查, Opus 读产物不重跑
- **2026-04-21**: PRD-4 Wave 1 深审驱动
  - 新增 §0 审前必跑 4 项实测 (pytest -q / mypy / import / SQL 约束)
  - 新增 TD 免罪金牌规则 (禁口头豁免, 必须登记留痕)
  - 新增 §Z 风险分档 (risk_level low/medium/high 决定审查强度)
  - 背景: PRD-4 Wave 1 7 story 全部 rubber-stamp, 事后深审发现 4 Warning + 5 Note + TD-8 (317 pre-existing ruff), 说明"只读代码不实测"的 audit 不可靠
