# Opus Audit Gate — Reject Feedback 标准模板

> 当 Opus 审计一个 Story 发现不合格时,**必须**用此模板写 reject 反馈,避免 Ralph 误解或修错方向。
>
> **背景**:PRD-2 US-012 第一次 reject 因 feedback 不够精确,Ralph 用 ORM assignment 替代 raw SQL UPDATE(语义等价),仍然 reject。第二次 reject 加了"**绝对不能**"反例列表后一次通过。此模板是该经验的固化。

---

## 使用方法

```bash
python scripts/ralph/ralph-tools.py reject "<按下方模板组织的 feedback 字符串>"
```

或者(推荐)先把 feedback 写在本地文件里,再粘贴到命令:

```bash
FB=$(cat <<'EOF'
Blocker: <简述>
...(按模板填充)
EOF
)
python scripts/ralph/ralph-tools.py reject "$FB"
```

---

## 模板

```markdown
Blocker: [1 句话问题简述]

## 背景
[1-2 句说明为什么这是个 blocker,引用 PRD / AGENTS.md / Locked Decision 编号]

## 当前实现(第 X-Y 行,文件相对路径)
```[语言]
[粘贴当前有问题的代码原文]
```

## 改为
```[语言]
[粘贴目标代码]
```

## 关键约束(**绝对不能**)
1. **绝对不能** [反例 A,必须具体到做法,不能说"不要做错的事"]
2. **绝对不能** [反例 B,例如"不能用 ORM attribute assignment 达到等价效果"]
3. **绝对不能** [反例 C,例如"不能调 db.flush() / db.commit() 持久化"]

## 兼容性要求(保留但改语义)
- [字段/接口 X] **保留不动**,但 [行为 Y 改为 Z]
- [函数 F 的签名] **保留**,内部实现改为...

## 验证方式
- 运行:`[具体命令,如 pytest tests/test_xxx.py::test_name]`
- 检查:[具体字段值 / 文件存在 / grep 模式命中 0 次]
- 失败判据:[何时算没修好]
```

---

## 关键要素解读

### 1. "绝对不能" 反例列表是**必填项**

- **为什么**:Ralph 是 Sonnet,会寻找"另一条语义等价的实现路径"。如果只说"改掉 X",Ralph 可能用 Y 达到等价效果,仍然不符合审计意图。
- **如何写好**:反例必须具体到"动作/API/写法",不能抽象。
- **反例的反例**(错误写法):
  - ❌ "不要破坏 ledger 一致性"(抽象)
  - ❌ "不要写错"(空洞)
- **正面例子**(PRD-2 US-012 第二次 reject):
  - ✅ "绝对不能用 `row.balance = expected` 之类 ORM 赋值(效果和 raw SQL UPDATE 一样)"
  - ✅ "绝对不能调 `db.flush()` 或 `db.commit()`"

### 2. 当前实现代码必须**贴原文**

- **不要**只说"第 37 行那个 if 块"。Ralph 下一轮的 dev 上下文可能读不到上次的代码,给它现成片段确保零歧义。
- 用 markdown code fence 贴,保留格式和缩进。

### 3. "改为"代码也要具体

- 不是"改成 log-only",而是贴出完整的目标代码:
  ```python
  if expected != row.balance:
      mismatched += 1
      logger.warning(...)
  ```

### 4. "验证方式" 是 Ralph 自查 + Validator 二次核验

- 给命令 + 判据,Ralph 改完可以自己跑一遍。
- 避免"回去再审一次"的返工。

---

## 常见反例 feedback(不要这样写)

### ❌ 反例 1:只描述问题,没给路径

```
Blocker: ledger 一致性没做好,balance 和 events 不一致。
请修复。
```

**问题**:Ralph 不知道改哪、不知道怎么改、不知道什么算"做好"。

### ❌ 反例 2:只给正例,没给反例

```
Blocker: reconcile 要 log-only。
请改为:
  if expected != row.balance:
      mismatched += 1
      logger.warning(...)
```

**问题**:Ralph 可能保留 `fixed += 1` 和 `db.flush()`(没说不能),认为只是"也加了 log"。

### ❌ 反例 3:反例太抽象

```
Blocker: 不要破坏 money-critical 红线。
请检查所有金额操作。
```

**问题**:"破坏红线"不可执行,Ralph 不知从何下手。

---

## PRD-2 US-012 第二次 reject 原文(可迁移参考)

```
Blocker 仍未修复:虽然删了 raw SQL UPDATE,但改用了 ORM attribute assignment 做 auto-fix
(效果一样)。

当前 reconciliation.py 第 37-41 行:
    row.balance = expected
    row.balance_version = row.balance_version + 1
    db.flush()
    fixed += 1

要把这 5 行完全删除。行 37-41 整体删除...

修改后的 if 块应该只剩:
    if expected != row.balance:
        mismatched += 1
        logger.warning(...)

关键:
1. 绝对不能修改 row.balance(不管用 raw SQL 还是 ORM)
2. 绝对不能调 db.flush() 做持久化
3. fixed 变量永远保持 0
4. docstring 改成:'Detect credit_balance drift...'
5. 返回值的 fixed 字段保留但永远 0
```

结果:Ralph 一次过。归因 §5 把此模板化为 PRD-3+ 可迁移方法。
