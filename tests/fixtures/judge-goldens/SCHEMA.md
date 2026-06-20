# Judge Golden Dataset Schema

> **版本** · v1.0 · PRD-28 US-004 · D-266 字面锁
> **路径** · `tests/fixtures/judge-goldens/`
> **规模** · 102 条 · 双轨 sally-30 + custom-72

## 目录

- [GoldenSample TypeScript Interface](#goldensample-typescript-interface)
- [GoldenDataset TypeScript Interface](#goldendataset-typescript-interface)
- [字段说明](#字段说明)
- [14 Specialist ID 枚举](#14-specialist-id-枚举)
- [Custom-72 配额分布](#custom-72-配额分布)
- [JSON 示例](#json-示例)
- [Zod Schema 位置](#zod-schema-位置)
- [验证方法](#验证方法)

---

## GoldenSample TypeScript Interface

```typescript
export interface GoldenSample {
  /** 唯一标识符 · 格式 (sally|custom)-NNN · 如 sally-001 / custom-042 */
  id: string;

  /** 14 个 Specialist 之一 · 严守 ARCHITECTURE.md §7 拓扑 */
  specialistId:
    | 'PositioningAgent'
    | 'BrandingAgent'
    | 'MonetizationAgent'
    | 'TopicAgent'
    | 'CopywritingAgent'
    | 'VideoAgent'
    | 'LivestreamAgent'
    | 'PrivateDomainAgent'
    | 'AnalysisAgent'
    | 'DiagnosisAgent'
    | 'DeepLearnAgent'
    | 'PresentationAgent'
    | 'EvolutionAgent'
    | 'DailyTaskAgent';

  /** Specialist 操作模式 · 可选 · 如 'free' / 'boom' / 'packaging' / 'traffic' */
  mode?: string;

  /** 输入数据 · 对应 Specialist 的实际 input schema */
  input: Record<string, unknown>;

  /** 期望输出结构模式 · 可选 · 用于文档说明，非硬性验证 */
  expectedOutputPattern?: Record<string, unknown>;

  /** 评判标准 · 至少 2 条 · 必须可量化 */
  criteria: string[];

  /** 期望输出字段列表 · 至少 1 个 */
  expectedKeyFields: string[];

  /** 数据来源 · 'sally' = aiipznt 真实样本 · 'custom' = 人工构建 */
  source: 'sally' | 'custom';

  /** 可选标签 · 用于过滤和分组 */
  tags?: string[];
}
```

## GoldenDataset TypeScript Interface

```typescript
/** 整个数据集 = GoldenSample 数组 */
export type GoldenDataset = GoldenSample[];
```

---

## 字段说明

| 字段 | 类型 | 必填 | 说明 |
|---|---|:-:|---|
| `id` | `string` | ✅ | 正则 `/^(sally\|custom)-\d{3}$/` · 如 `sally-001` |
| `specialistId` | enum | ✅ | 14 个 Specialist 之一（见下方枚举） |
| `mode` | `string` | ❌ | Specialist 内部模式 · 如 `free` / `boom` / `packaging` |
| `input` | `Record<string, unknown>` | ✅ | 真实输入数据 |
| `expectedOutputPattern` | `Record<string, unknown>` | ❌ | 输出结构说明（非硬性约束） |
| `criteria` | `string[]` | ✅ | 至少 2 条可量化评判标准 |
| `expectedKeyFields` | `string[]` | ✅ | 至少 1 个期望输出字段名 |
| `source` | `'sally' \| 'custom'` | ✅ | 数据来源标记 |
| `tags` | `string[]` | ❌ | 可选标签，便于过滤 |

---

## 14 Specialist ID 枚举

严守 `AGENTS.md §3 LD-002` 规定的 14 个 Specialist，**不允许**缩写/大小写变体：

```
PositioningAgent    BrandingAgent       MonetizationAgent
TopicAgent          CopywritingAgent    VideoAgent
LivestreamAgent     PrivateDomainAgent  AnalysisAgent
DiagnosisAgent      DeepLearnAgent      PresentationAgent
EvolutionAgent      DailyTaskAgent
```

---

## Custom-72 配额分布

| Specialist | 配额 | ID 范围 |
|---|:-:|---|
| CopywritingAgent | 12 | custom-001 ~ custom-012 |
| BrandingAgent | 10 | custom-013 ~ custom-022 |
| VideoAgent | 8 | custom-023 ~ custom-030 |
| TopicAgent | 8 | custom-031 ~ custom-038 |
| PositioningAgent | 6 | custom-039 ~ custom-044 |
| MonetizationAgent | 6 | custom-045 ~ custom-050 |
| AnalysisAgent | 6 | custom-051 ~ custom-056 |
| LivestreamAgent | 2 | custom-057 ~ custom-058 |
| PrivateDomainAgent | 2 | custom-059 ~ custom-060 |
| PresentationAgent | 4 | custom-061, custom-065, custom-066, custom-071 |
| DiagnosisAgent | 2 | custom-062, custom-072 |
| DeepLearnAgent | 2 | custom-063 ~ custom-064 |
| EvolutionAgent | 2 | custom-067 ~ custom-068 |
| DailyTaskAgent | 2 | custom-069 ~ custom-070 |
| **总计** | **72** | |

---

## JSON 示例

### Sally 样本（source: 'sally'）

```json
{
  "id": "sally-001",
  "specialistId": "CopywritingAgent",
  "mode": "free",
  "input": {
    "scriptType": "tutorial",
    "elements": ["curiosity", "social_proof"],
    "topic": "护肤品正确使用顺序"
  },
  "expectedOutputPattern": {
    "markdown": "string",
    "metadata": "object"
  },
  "criteria": [
    "markdown 输出不少于 400 个字符",
    "metadata 对象包含 scriptType / elements / structureSummary / estimatedDuration 字段",
    "文案包含清晰的开头钩子句"
  ],
  "expectedKeyFields": ["markdown", "metadata"],
  "source": "sally",
  "tags": ["step4b", "beauty", "tutorial"]
}
```

### Custom 样本（source: 'custom'）

```json
{
  "id": "custom-013",
  "specialistId": "BrandingAgent",
  "mode": "packaging",
  "input": {
    "industry": "tech",
    "platform": "bilibili",
    "followerGoal": 100000
  },
  "criteria": [
    "nickname 恰好 5 个候选，体现科技/数码风格",
    "bio 包含 bilibili 平台版本",
    "overallStrategy 有明确内容差异化策略"
  ],
  "expectedKeyFields": ["nickname", "avatar", "bio", "overallStrategy"],
  "source": "custom",
  "tags": ["branding", "tech", "bilibili"]
}
```

---

## Zod Schema 位置

```
packages/schemas/src/judge-golden.schema.ts
  ├── SPECIALIST_IDS        → 14 个 Specialist ID as const 数组
  ├── goldenSampleSchema    → z.object({ id, specialistId, mode?, input, ... })
  ├── GoldenSample          → z.infer<typeof goldenSampleSchema>
  ├── goldenDatasetSchema   → z.array(goldenSampleSchema)
  └── GoldenDataset         → z.infer<typeof goldenDatasetSchema>
```

barrel export 路径：`packages/schemas/src/index.ts`（PRD-28 US-004 添加）

---

## 验证方法

```bash
# 验证 sally-30.json 条数
jq 'length' tests/fixtures/judge-goldens/sally-30.json
# → 30

# 验证 custom-70.json 条数
jq 'length' tests/fixtures/judge-goldens/custom-70.json
# → 72

# 验证 source 标记
jq '[.[] | .source] | unique' tests/fixtures/judge-goldens/sally-30.json
# → ["sally"]

# 验证 CopywritingAgent 配额
jq '[.[] | select(.specialistId == "CopywritingAgent")] | length' \
  tests/fixtures/judge-goldens/custom-70.json
# → 12

# 运行 schema 验证测试
pnpm test tests/fixtures/judge-goldens/__tests__/dataset-validation.test.ts
```
