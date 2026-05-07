# .agents/tech-debt.json Schema 规范

> **版本**: 2026-04-21 初版 (PRD-4 Wave 1 深审驱动)
> **适用范围**: 所有 Coding 3.0 项目 (全局生效)
> **引用位置**: `~/.claude/scripts/ralph/AUDIT-CHECKLIST-TEMPLATE.md §0 TD 免罪金牌规则` / `~/.claude/scripts/ralph/OPUS-AUDIT-CHEATSHEET.md Step 5 TD 留痕`

## 文件位置

每个项目根的 `.agents/tech-debt.json`。

## 完整 Schema

```json
{
  "schema_version": 1,
  "last_updated": "ISO 8601 UTC",
  "items": [
    {
      "id": "TD-N",
      "title": "简短描述",
      "description": "详细描述 (可选)",
      "scope": ["file.py:line", "另一个文件.py"],
      "impact": "不修会发生什么 (数据不一致 / 性能 / 安全 / 审计噪声)",
      "severity": "Critical|High|Medium|Low",
      "categories": ["type-safety", "regression-risk", "security", "performance", "tech-debt"],
      "created_in_prd": "detected 之前引入的 PRD (若未知写 pre-PRD-N)",
      "detected_in_prd": "首次被记录的 PRD slug",
      "detected_in_story": "US-NNN (首次发现的 story)",
      "fix_by": "建议修复时机 (具体 PRD slug / ASAP / 长期延后)",
      "status": "open|in_progress|resolved|wontfix",
      "fix_hint": "一两句话的修复方案草稿",
      "resolved_in_prd": null,
      "resolved_at": null,
      "resolution_notes": null
    }
  ]
}
```

## 字段详解

### 必填字段

| 字段 | 类型 | 规则 |
|------|------|------|
| `schema_version` | int | 固定 `1` (未来 breaking change 时递增) |
| `last_updated` | string | ISO 8601 UTC, 每次修改更新 |
| `items` | array | debt 列表, 按 id 升序 |
| `items[].id` | string | `TD-N` 格式, N 从 1 开始跨 PRD 累加, 不重置 |
| `items[].title` | string | 简短 (< 60 字符) |
| `items[].scope` | string[] | `file.py:line` 或 `file.py` 格式, 至少 1 条 |
| `items[].impact` | string | 具体影响, 避免空话 |
| `items[].severity` | enum | `Critical` (上线阻塞) / `High` (下 PRD 前必修) / `Medium` (本域相关 PRD 前修) / `Low` (长期延后可) |
| `items[].status` | enum | `open` (新发现) / `in_progress` (修复中) / `resolved` (已修) / `wontfix` (明确不修) |
| `items[].created_in_prd` | string | PRD slug (如 `prd-multi-channel-routing`); pre-existing 写 `pre-PRD-N` |
| `items[].detected_in_prd` | string | PRD slug (最早记录的 PRD) |

### 推荐字段 (对 /prd-retro 和 /prime 统计有用)

| 字段 | 类型 | 用途 |
|------|------|------|
| `description` | string | 详细描述 (> 60 字符场景) |
| `categories` | string[] | 分类 tag, 供 /prd-retro 做类型分布统计 |
| `detected_in_story` | string | `US-NNN` — 便于追溯到具体审计场景 |
| `fix_by` | string | 建议修复 PRD slug — /prime 时提醒"这个 PRD 应该吸收 TD-X" |
| `fix_hint` | string | 一两句话修复草稿 — 节省未来 Opus 重新分析时间 |

### 修复后填充字段

| 字段 | 类型 | 规则 |
|------|------|------|
| `resolved_in_prd` | string \| null | 实际修复的 PRD slug; 未修填 `null` |
| `resolved_at` | string \| null | ISO 8601 UTC; 未修填 `null` |
| `resolution_notes` | string \| null | 修复摘要 (+ 零回归验证) |

## severity 分级规则

| severity | 定义 | 示例 | 触发行为 |
|----------|------|------|---------|
| **Critical** | 上线前必须修, 否则会导致数据丢失/安全漏洞/不可逆错误 | 密钥明文存盘 / 金额 Float 计算 / SQL 注入 | /goal-verify 会 FAIL, 阻塞上线 |
| **High** | 下个 PRD 启动前必修, 否则影响后续开发 | auth middleware bug / Ledger drift / 核心 API 性能 | /prd-retro 会标"必修"; /prime 会警告 |
| **Medium** | 本域相关 PRD 前修, 可接受短期带病运行 | 类型提示缺失 / ruff 预存 / 非关键 linting | /prime 会提示; 不阻塞 |
| **Low** | 长期延后可, 仅作记录 | README 过时 / 注释 typo / 文档格式 | 仅存档 |

## categories 枚举 (可扩展)

- `type-safety` (mypy errors / 类型标注缺失)
- `regression-risk` (可能打破现有行为)
- `security` (密钥 / 权限 / 注入)
- `performance` (慢查询 / N+1 / 内存)
- `correctness` (逻辑错误但还没 bug)
- `tech-debt` (代码异味 / 耦合)
- `test-coverage` (测试缺失)
- `documentation` (文档不全)
- `dependency` (第三方依赖过期)
- `infra` (部署 / CI / 运维)

多个 tag 可叠加, 如 `["type-safety", "regression-risk"]`。

## id 规则

- 格式: `TD-N` (N 是正整数)
- **跨 PRD 累加, 不重置**: TD-1 (PRD-2), TD-2 (PRD-2), TD-3 (PRD-2), ..., TD-8 (PRD-4), TD-9 (PRD-4)
- 同一 PRD 内按发现顺序
- **不允许复用 id**: 即使老的 TD 已 resolved, 新 TD 必须用下一个未使用的 N

## 写入规则

### 新发现 TD

```python
# 读当前 tech-debt.json
data = json.load(open('.agents/tech-debt.json'))
max_id = max(int(item['id'].split('-')[1]) for item in data['items']) if data['items'] else 0
new_id = f"TD-{max_id + 1}"

data['items'].append({
    "id": new_id,
    "title": "...",
    "scope": [...],
    "impact": "...",
    "severity": "Low",
    "categories": [...],
    "created_in_prd": "pre-PRD-N",
    "detected_in_prd": "prd-current-slug",
    "detected_in_story": "US-NNN",
    "fix_by": "prd-next-slug",
    "status": "open",
    "fix_hint": "...",
    "resolved_in_prd": None,
    "resolved_at": None,
})
data['last_updated'] = datetime.now(UTC).isoformat()
json.dump(data, open('.agents/tech-debt.json', 'w'), ensure_ascii=False, indent=2)
```

### 修复 TD

```python
# 只改目标 item 的 3 个字段
for item in data['items']:
    if item['id'] == 'TD-3':
        item['status'] = 'resolved'
        item['resolved_in_prd'] = 'prd-multi-channel-routing'
        item['resolved_at'] = datetime.now(UTC).isoformat()
        item['resolution_notes'] = 'url_guard cast str + wsproxy type:ignore + ...'
        break
data['last_updated'] = datetime.now(UTC).isoformat()
```

## 验证命令

```bash
# 语法合法
python3 -c "import json; json.load(open('.agents/tech-debt.json'))"

# Schema 完整性 (至少 id/title/scope/severity/status/created_in_prd)
python3 -c "
import json
required = {'id','title','scope','severity','status','created_in_prd'}
for item in json.load(open('.agents/tech-debt.json'))['items']:
    missing = required - set(item.keys())
    assert not missing, f'{item[\"id\"]} 缺字段: {missing}'
print('OK')
"

# 统计 open / resolved 比例
python3 -c "
import json
items = json.load(open('.agents/tech-debt.json'))['items']
from collections import Counter
print(Counter(i['status'] for i in items))
"
```

## /prd-retro 集成

每次 /prd-retro 应读取 tech-debt.json 输出"TD 偿还率":
- 本 PRD 新增 N 条 (detected_in_prd == current)
- 本 PRD 修复 M 条 (resolved_in_prd == current)
- 偿还率 = M / (N + pre-existing open) 
- 趋势: 历次 PRD 偿还率曲线

## /prime 集成

每次 /prime 应扫描所有 open + severity=High/Critical 的 TD, 提醒用户在本 PRD 吸收。

## 版本历史

- **2026-04-21**: 初版, PRD-4 Wave 1 深审驱动, 背景是 TD-8 (317 pre-existing ruff errors) 被 Opus 当免罪金牌直接 approve 未留痕。
