# PRD-7 · Cleanup PRD · 7 open TD + RCA-004 全局 sync(8 stories)

> **版本** · v0.1(2026-05-10 · prd skill Questions 模式 · Opus 主对话)
> **PRD** · PRD-7 · 8 stories · 计划 1-2 天 · risk=foundation+low(无新功能 · 治理债 + 工具改进)
> **依赖** · PRD-6(P5 视频模块 · 14/14 PASS · 已完成 ✓)
> **战略地位** · ARCHITECTURE 路线外的 cleanup PRD · 为后续 PRD-8 智能模块清债 · 让 design-drift 类 TD 跨 PRD 累积归零
> **预估** · 一轮通过率 90-95% · reject 1-2 · 总耗时 6-8h

---

## §0 引用清单(必读 · 实施前 5 min 全部过一遍)

### §0.1 上游 PRD 决策继承

- **D-001 ~ D-045**(PRD-1~6 累计)· 全部继承 · 不重复
- 关键继承:
  - **D-009** · RLS + LD-009 双层防护(本期不动 router · 不影响)
  - **D-013** · zod schema · `as const satisfies`(本期 §1.0 schema SoT 表是核心)
  - **D-016** · 测试金字塔 vitest 722 + judge 39 + e2e 142(本期不破)
  - **D-026** · 不动既有 procedure · 新建变体(本期 schema 重构是字段对齐 · 不改 procedure 名)
  - **D-028** · 多 mode Specialist `_mode + outputSchema getter`(本期 schema 字段对齐时不动 getter · 仅改 schema 内容)
  - **D-038** · ImageGen Worker 独立 · 不走 LLMGateway(本期 US-004 改 worker types import · 不改 D-038 边界)
  - **D-040** · cost_log eventType 3 类(本期不动)
  - **D-041 ~ D-045** · DALL-E 3 / IMAGE_GEN_ENABLED / quality / rate-limit · 本期不动

### §0.2 ARCHITECTURE.md 引用

- §6.6 VideoAgent 4 mode 完整定义(SOT for production/acquisition/storyboard mode 字段)
- §7 ImageGenWorker(本期 US-004 改 type import 路径 · 不改边界)

### §0.3 PROMPTS.md 引用

- **§6.2 13 列分镜表**(★ shooting / production mode shotList SOT · TD-022 字段集真理源)
- §6.3 storyboard mode imagePromptEn 协同(本期不动 prompt 内容 · 仅 schema 字段对齐)
- §5.4 acquisition mode CTA 必含(本期 acquisition 字段对齐时遵守)

### §0.4 DATA-MODEL.md 引用

- §3 主应用 18 表(本期不动 schema)
- §3.4.5 cost_log 表 · eventType('specialist_call' | 'judge_call' | 'image_gen')(本期不动)

### §0.5 AGENTS.md 引用

- §3 LD-005(BaseSpecialist 抽象 · 本期 schema 字段对齐时不动)
- §3 LD-009(RLS 双层防护 · 本期 router 不动)
- **§3 LD-013**(zod schema · 全栈唯一真理 · ★ 本期 §1.0 SoT 表是 LD-013 的实施细则)
- §3 LD-016(测试金字塔 · 本期 vitest 722 + judge 39 + e2e 142 不破)
- §3 R-001(LLM API key 不暴露前端 · 本期不动)

### §0.6 PRD-6 retro 教训(P-1~P-7 Playbook · 已注入本 PRD)

- **P-1 TD-022 必修(★ 本 PRD 核心)** · §1.0 schema 字段 SoT 表 · 5 schema input + output 字段全部锁字段名 + 类型 + boundary + enum + regex · 跨 packages/schemas + apps/api specialists inline + apps/api routers inline 三处 1:1 一致
- **P-2 plan-check W-patch 注入** · foundation story 自动 grep PRD AC vs 既有 schema 字段对应(本 PRD 跑 /plan-check 时验证)
- **P-3 RCA-004 同步全局**(本期 US-005 落地)
- **P-4 verify-artifacts cleanup**(本期 US-002 落地)
- **P-5 reject feedback 限长** · < 3K 字符避免 prompt 膨胀 stuck(实施期 Opus reject 时遵守)
- **P-6 Opus 路径 B 标准化**(本期 US-007 落地)
- **P-7 audit-artifacts.py 改进** · 仅看本 story 文件 + manifest.zero_regression 跳 timestamps(本期 US-003/006 落地)

### §0.7 PRD-6 反例库回灌(自动注入 anti_patterns)

`~/.claude/playbooks/reject-examples.jsonl` 已含 2 条 PRD-6 reject(关键词 schema/storyboard/字段/header/key/13 列):

1. **PRD-6 US-002 storyboard schema 字段不一致** · 关键词 schema/字段/boundary/regex
2. **PRD-6 US-004 VideoProductionResult.tsx header→key 错位映射** · 关键词 header/key/错位/13 列/固定列名

ralph skill 转 prd.json 时按关键词检索 · 注入对应 story 的 `anti_patterns` 字段。

### §0.8 本 PRD 暂不做(详 §3 范围排除)

- 任何**新功能 / 新 Specialist / 新 router / 新 schema / 新工具页**(本 PRD 仅 cleanup)
- VideoAgent / CopywritingAgent prompt 模板修改(只改 schema 字段表)
- ContextAssembler / LLMGateway / BullMQ / Redis 等基础设施改动
- admin 任何代码(留 PRD-10~14)
- DALL-E 3 / OpenAI image API 实际调用(US-009 已落 · 本期不改)

---

## §1 用户故事(US-001 ~ US-008)

### §1.0 ★★★ Schema 字段 SoT 表(US-001 核心 · TD-022 5 次显现治本)

> **背景** · TD-022 在 PRD-6 5 次显现(US-002 / US-004 / US-005 / US-006 / US-007)· packages/schemas + apps/api specialists inline + apps/api routers inline 三处对同一逻辑 schema 字段集**完全不同** · 现 PRD-7 US-001 一次性对齐。
>
> **方法** · 选定 canonical(权威源)→ 改 packages/schemas 跟 canonical 100% 一致 → 改 router inline 删除独立定义 + import 自 packages/schemas → specialists inline 保留(BaseSpecialist 用)但字段表 100% 跟 packages/schemas 一致(允许 fallback fields 为 optional · 但 required 字段名 + 类型 + boundary + enum 完全相同)。
>
> **canonical 选择原则** · 与 LLM 实际 output 对齐(prompt §6.2 13 列分镜表 等)· 与现有 history JSON 渲染(VideoProductionResult.tsx 13 列)对齐 · 不破坏 PRD-6 已落地的功能。

#### §1.0.1 Schema 1 · videoProductionInput / Output(锁 SoT)

**canonical 选择**: `apps/api/src/specialists/VideoAgent.ts` ProductionOutputSchema(13+7 字段 · matches PROMPTS §6.2 + VideoProductionResult.tsx 渲染)

##### videoProductionInput(三处必须一致)

| 字段 | 类型 | boundary / enum / regex | 必填 |
|---|---|---|:-:|
| `sourceCopy` | `string` | `.min(10).max(3000)` · message:'原始文案至少 10 字符' / '原始文案不能超过3000字符' | ✓ |
| `videoType` | `enum` | `['short_form', 'long_form']` | ✗ |
| `duration` | `enum` | `['15s', '30s', '60s', '180s']` | ✗ |
| `additionalContext` | `string` | (无 boundary) | ✗ |

##### videoProductionOutput(三处必须一致)

```typescript
// canonical: apps/api/src/specialists/VideoAgent.ts ProductionOutputSchema
// packages/schemas/src/specialist-io/videoProduction.schema.ts 重写为下面这版
// apps/api/src/trpc/routers/videoProduction.ts 不再 inline · 改用 packages/schemas import

const ShotItemSchema = z.object({
  // 13 列必填(对齐 PROMPTS §6.2 + VideoProductionResult.tsx 13 列渲染)
  scene: z.string(),
  duration: z.string(),
  action: z.string(),
  dialogue: z.string(),
  cameraAngle: z.string(),
  prop: z.string(),
  lighting: z.string(),
  transition: z.string(),
  sfx: z.string(),
  voiceover: z.string(),
  subtitle: z.string(),
  costume: z.string(),
  location: z.string(),
  // 7 字段 production mode 扩展(向后兼容 · optional)
  index: z.number().int().positive().optional(),
  angle: z.string().optional(),
  movement: z.string().optional(),
  description: z.string().optional(),
  bgm: z.string().optional(),
  reference: z.string().optional(),
  note: z.string().optional(),
});

export const videoProductionOutput = z.object({
  shotList: z.array(ShotItemSchema).min(1), // 沿用 VideoAgent.ts canonical (LLM fallback 容许 1 镜头)
  equipment: z.array(z.string()),
  schedule: z.string(),
});
```

**变更**: packages/schemas 旧版 4 字段(shotList/equipment/schedule/totalDuration · shotList 6 子字段)→ 新版 3 字段(shotList/equipment/schedule · shotList 13+7 子字段)。删除 `totalDuration`(LLM 实际 output 没有)。

#### §1.0.2 Schema 2 · acquisitionVideoInput / Output(锁 SoT)

**canonical 选择**: `apps/api/src/specialists/VideoAgent.ts` VideoAcquisitionOutputSchema(script/cta/conversionPath/keyMessages · matches LLM acquisition prompt + AcquisitionVideoResult.tsx 4 卡片渲染)

##### acquisitionVideoInput(三处必须一致)

| 字段 | 类型 | boundary / enum | 必填 |
|---|---|---|:-:|
| `sourceCopy` | `string` | `.min(10).max(3000)` · message:'原始文案至少 10 字符' / '原始文案不能超过3000字符' | ✓ |
| `conversionGoal` | **`string`** ★ | `.min(1)` message:'转化目标必填' (★ 改 enum→string · 沿 router/copywriting 模式 · 让 LLM 自由表达转化路径) | ✓ |
| `platform` | `string` | (无 boundary) | ✗ |
| `duration` | `enum` | `['15s', '30s', '60s', '180s']` | ✗ |

**变更**: packages/schemas 旧 enum `['wechat','comment','private_msg']` + `ctaText/additionalContext` 字段 → 新 `string.min(1)` + 新增 `platform/duration`(对齐 router 实际 input)。删除 `ctaText`(LLM acquisition prompt 不接此字段)+ `additionalContext`(沿用 router 不传)。

##### acquisitionVideoOutput(三处必须一致)

```typescript
// canonical: apps/api/src/specialists/VideoAgent.ts VideoAcquisitionOutputSchema
// 字段语义对齐 LLM 实际输出 + AcquisitionVideoResult.tsx 4 卡片渲染

export const acquisitionVideoOutput = z.object({
  script: z.string().min(100),     // 完整脚本文案(钩子+价值+CTA)
  cta: z.string().min(10),          // 行动号召 · 必含「关注/私信/点击/获取/领取」
  conversionPath: z.string(),       // 转化路径(视频→CTA→落地→成交)
  keyMessages: z.array(z.string()).min(1), // 核心卖点
});
```

**变更**: packages/schemas 旧版 4 字段(`shotList/ctaSuggestion/equipment/totalDuration`)→ 新版 4 字段(`script/cta/conversionPath/keyMessages`)。**字段集完全替换**(旧版是分镜导向 · 新版是脚本导向)。

#### §1.0.3 Schema 3 · aiVideoInput / Output(锁 SoT)

**canonical 选择**: `apps/api/src/specialists/VideoAgent.ts` StoryboardOutputSchema(scenes/title/totalDuration · matches LLM storyboard prompt + AiVideo.tsx 渲染)

##### aiVideoInput(三处必须一致)

| 字段 | 类型 | boundary / enum / regex | 必填 |
|---|---|---|:-:|
| `sourceCopy` | `string` | `.min(10).max(3000)` · message:'原始文案至少 10 字符' / '原始文案不超过3000字符' | ✓ |
| `scenesCount` | **`union<5\|6\|7\|8>`** ★ | `z.union([z.literal(5), z.literal(6), z.literal(7), z.literal(8)])` errorMap:'镜头数应在 5-8 之间' | ✓ |
| `imageStyle` | `enum` | `['vivid', 'natural']` · default('vivid') | ✓(default 后等价必填) |

**变更**: router inline 旧版 `z.number().int().min(5).max(8).default(5)` → 改用 packages/schemas import · 严格 literal union(TypeScript 类型从 `number` 收窄到 `5|6|7|8`)。删除 router inline 的 `.default(5)`(改写在 packages/schemas 上 · 三处一致)。

##### aiVideoOutput(三处必须一致)

```typescript
// canonical: apps/api/src/specialists/VideoAgent.ts StoryboardOutputSchema
// 多 title 字段 vs packages/schemas 没 title — 对齐 specialists 真 LLM output

const aiVideoSceneSchema = z.object({
  index: z.number().int().positive(),
  description: z.string().min(20).max(500),
  imagePromptEn: z
    .string()
    .min(20)
    .regex(/^[\x00-\x7F]+$/, 'imagePromptEn 必须是英文 ASCII'), // 严格 ASCII · 不容忍 \t\n\r 例外
  duration: z.string(),
});

export const aiVideoOutput = z.object({
  scenes: z.array(aiVideoSceneSchema).min(5).max(8),
  title: z.string(), // ★ packages/schemas 旧版 missing · 新版补齐
  totalDuration: z.string(),
});
```

**变更**: packages/schemas 加 `title: z.string()`(对齐 specialists)+ regex 收紧到 `[\x00-\x7F]+`(packages/schemas 已是这样 · specialists inline 改对齐)。VideoAgent.ts StoryboardSceneSchema 的 regex `/^[ -~\t\n\r]+$/` 改为 `/^[\x00-\x7F]+$/` 跟 packages/schemas 完全一致。

#### §1.0.4 Schema 4 · acquisitionCopywritingInput / Output(锁 SoT)

**canonical 选择**:
- Input: `acquisitionCopywritingInputSchema`(US-012 新版 · scriptType/elements/conversionGoal/topic · matches /generate UI)
- Output: `apps/api/src/specialists/CopywritingAgent.ts` CopywritingAcquisitionOutputSchema(markdown/metadata.{ctaPosition,conversionGoal} · matches LLM streaming output)

##### acquisitionCopywritingInputSchema(三处必须一致)

| 字段 | 类型 | boundary / enum | 必填 |
|---|---|---|:-:|
| `scriptType` | `enum` | `SCRIPT_TYPE_KEYS_20`(20 项 · constants.ts canonical) | ✓ |
| `elements` | `array<enum>` | `array(z.enum(HOT_ELEMENT_KEYS_22)).min(1).max(8)` | ✓ |
| `conversionGoal` | `string` | `.min(1)` message:'转化目标必填' | ✓ |
| `topic` | `string` | `.min(1).max(500)` | ✓ |

**变更**: packages/schemas 同时存在 legacy `acquisitionCopywritingInput`(productInfo/conversionGoal:enum/ctaText/additionalContext)和新版 `acquisitionCopywritingInputSchema` · **删除 legacy** · 仅保留新版(US-012 落地版)。router inline 已对齐新版 · 删除 router inline 后 import 自 packages/schemas。

##### acquisitionCopywritingOutput(三处必须一致)

```typescript
// canonical: apps/api/src/specialists/CopywritingAgent.ts CopywritingAcquisitionOutputSchema
// 字段集完全替换 packages/schemas 旧版

export const acquisitionCopywritingOutput = z
  .object({
    markdown: z.string().min(200).max(500),
    metadata: z.object({
      ctaPosition: z.string(),
      conversionGoal: z.string(),
    }),
  })
  .refine((v) => v.metadata.ctaPosition.length > 0, {
    message: 'acquisition mode 必含 CTA · ctaPosition 不能为空',
  });
```

**变更**: packages/schemas 旧版 `result/metadata{conversionGoal/ctaIncluded:bool/estimatedDuration}` → 新版 `markdown/metadata{ctaPosition/conversionGoal}`。**字段名完全替换**(旧版命名跟 free mode 对齐 · 新版跟 acquisition LLM 实际 output 对齐)。

#### §1.0.5 Schema 5 · imageGenJobPayload / Result(锁 SoT)

**canonical 选择**: `packages/schemas/src/specialist-io/imageGen.schema.ts`(已是 zod canonical · 含 boundary/regex)

##### imageGenJobPayload(三处必须一致)

| 字段 | 类型 | boundary | 必填 |
|---|---|---|:-:|
| `sceneIndex` | `number` | `.int().nonnegative()` | ✓ |
| `imagePromptEn` | `string` | `.min(1).max(1000)` | ✓ |
| `accountId` | `number` | `.int().positive()` | ✓ |
| `traceId` | `string` | (无 boundary) | ✓ |
| `historyId` | `number` | `.int().positive()` | ✓ |
| `imageStyle` | `enum` | `['vivid', 'natural']` | ✓ |

##### imageGenJobResult(三处必须一致)

```typescript
// canonical: packages/schemas/src/specialist-io/imageGen.schema.ts (已 zod 完整)

const imageGenJobResultSuccess = z.object({
  sceneImageUrl: z.string().url(),
  costUsd: z.number().nonnegative(),
  durationMs: z.number().int().nonnegative(),
});

const imageGenJobResultError = z.object({
  error: z.string(),
  sceneImageUrl: z.string(), // placeholder URL on failure
});

export const imageGenJobResult = z.union([imageGenJobResultSuccess, imageGenJobResultError]);
```

**变更**: `apps/api/src/workers/image-gen/index.ts` 删除 inline TS interface(line 14-26)· 改 import { ImageGenJobPayload, ImageGenJobResult } from '@quanan/schemas/specialist-io'(US-004 落地)。worker 内部仍用 z.infer 推导类型 · 但 runtime 校验走 packages/schemas 的 zod schema(if needed)。

#### §1.0.6 SoT 一致性验证规则(US-001 验收硬要求)

ralph 实施 US-001 后 · Opus audit 必跑 5 项 grep:

```bash
# 验 1: packages/schemas 字段表跟 specialists inline 字段名一致(逐字 diff)
diff <(grep -oE "z\.(string|number|enum|array|object|union|literal|boolean)\(" packages/schemas/src/specialist-io/videoProduction.schema.ts) \
     <(grep -oE "z\.(string|number|enum|array|object|union|literal|boolean)\(" apps/api/src/specialists/VideoAgent.ts | grep -A 50 "ProductionOutputSchema")
# 期望: 字段类型序列完全一致(Output 部分 · Input 字段映射规则同)

# 验 2: router inline 不再独立定义 output schema · 改 import
grep -E "z\.object\(\{.*shotList" apps/api/src/trpc/routers/videoProduction.ts
# 期望: 0 命中(已删除 inline output · 透传 specialists 类型)

# 验 3: router inline import 自 packages/schemas
grep "from '@quanan/schemas/specialist-io'" apps/api/src/trpc/routers/{videoProduction,acquisitionVideo,aiVideo,copywriting}.ts
# 期望: 4 处全命中

# 验 4: packages/schemas 删除 legacy acquisitionCopywritingInput
grep -E "^export const acquisitionCopywritingInput\b" packages/schemas/src/specialist-io/acquisitionCopywriting.schema.ts
# 期望: 0 命中(legacy 已删除 · 仅保留 acquisitionCopywritingInputSchema 新版)

# 验 5: 5 schema input/output 总字段数一致
node -e "const s = require('@quanan/schemas/specialist-io'); console.log(Object.keys(s.videoProductionOutput.shape))" \
  && grep -c "^\s*\(scene\|duration\|action\|dialogue\|cameraAngle\|prop\|lighting\|transition\|sfx\|voiceover\|subtitle\|costume\|location\):" \
     apps/api/src/specialists/VideoAgent.ts
# 期望: 13 字段必填一一对应
```

---

### **US-001 · ★★★ Critical · TD-022 5 schema 字段 SoT 锁定**(risk_level=foundation)

> **risk_level** · `foundation`(downstream 0 stories · 但跨 PRD 后续所有 PRD 必引此 SoT 表)
> **priority** · 1
> **depends_on** · []

**描述** · TD-022(Critical · 5 次显现)治本 · 修 5 schema 跨 packages/schemas + apps/api specialists + apps/api routers inline 三处不一致问题。

详 §1.0 5 schema SoT 表:
- §1.0.1 videoProductionInput/Output
- §1.0.2 acquisitionVideoInput/Output
- §1.0.3 aiVideoInput/Output
- §1.0.4 acquisitionCopywritingInputSchema/Output
- §1.0.5 imageGenJobPayload/Result

实施步骤:
1. **改 packages/schemas 5 文件** · 字段名 + 类型 + boundary + enum + regex 对齐 §1.0 SoT 表
2. **改 apps/api specialists 2 文件**(VideoAgent.ts + CopywritingAgent.ts)· inline schema 字段 100% 跟 packages/schemas 一致(允许 .min/.max 跟 LLM fallback 兼容 · 但字段名 + 字段集 100% 一致)
3. **改 apps/api routers 4 文件**(videoProduction/acquisitionVideo/aiVideo/copywriting)· 删除 inline input/output schema · 改 import 自 packages/schemas
4. **改既有 unit test** · 适配新字段表(删除引用 legacy 字段名的 assertion)
5. **history 渲染验证** · VideoProductionResult.tsx / AcquisitionVideoResult.tsx / AiVideo.tsx / Generate.tsx 不动逻辑 · 但实测 history.detail 数据流通过 § 1.0 验证 4 项

**触发场景** · ralph 跑 US-001 第一步 · 后续 PRD-7 stories(US-002~008)以及未来 PRD-8+ 写新 schema 时强制对照 §1.0 SoT 表。

**Acceptance Criteria** ·

- [ ] **AC-1** · packages/schemas/src/specialist-io/videoProduction.schema.ts 字段表跟 §1.0.1 ProductionOutputSchema 100% 一致 · 13 必填 + 7 optional 字段名逐字相同 · `.min(1)` 不变
- [ ] **AC-2** · packages/schemas/src/specialist-io/acquisitionVideo.schema.ts 字段表跟 §1.0.2 100% 一致 · output 4 字段(script/cta/conversionPath/keyMessages)替换旧 4 字段(shotList/ctaSuggestion/equipment/totalDuration)· input conversionGoal 改 string.min(1)
- [ ] **AC-3** · packages/schemas/src/specialist-io/aiVideo.schema.ts 字段表跟 §1.0.3 100% 一致 · output 加 `title: z.string()` · scenesCount 严格 union<5|6|7|8>
- [ ] **AC-4** · packages/schemas/src/specialist-io/acquisitionCopywriting.schema.ts:
  - 删除 legacy `acquisitionCopywritingInput`(line 13-18)
  - 保留新版 `acquisitionCopywritingInputSchema`(line 22-27)
  - output 改 `markdown/metadata{ctaPosition/conversionGoal}`(替换旧 `result/metadata{conversionGoal/ctaIncluded/estimatedDuration}`)
  - 加 `.refine` ctaPosition 非空(沿用 specialists)
- [ ] **AC-5** · packages/schemas/src/specialist-io/imageGen.schema.ts 字段表保持现状(已 canonical · 不动)
- [ ] **AC-6** · apps/api/src/specialists/VideoAgent.ts:
  - StoryboardSceneSchema regex 从 `/^[ -~\t\n\r]+$/` 改为 `/^[\x00-\x7F]+$/`(跟 packages/schemas aiVideoSceneSchema 100% 一致)
  - 其他 schema 字段表已 canonical · 不改字段集 · 仅改 import 路径(从 packages/schemas 导出 type 复用)
- [ ] **AC-7** · apps/api/src/specialists/CopywritingAgent.ts CopywritingAcquisitionOutputSchema 字段已 canonical · 不动字段集 · 但 `import { acquisitionCopywritingOutput } from '@quanan/schemas/specialist-io'` 后 type 复用
- [ ] **AC-8** · apps/api/src/trpc/routers/videoProduction.ts:
  - 删除 inline `videoProductionInputSchema`(line 27-32)
  - 改 `import { videoProductionInput } from '@quanan/schemas/specialist-io'`
  - 用 `videoProductionInput` 替代 inline schema
  - generateStoryboardInput / generateSceneImageInput stub 保留(legacy)
- [ ] **AC-9** · apps/api/src/trpc/routers/acquisitionVideo.ts:
  - 删除 inline `acquisitionVideoInputSchema`(line 22-27)
  - 改 `import { acquisitionVideoInput } from '@quanan/schemas/specialist-io'`
- [ ] **AC-10** · apps/api/src/trpc/routers/aiVideo.ts:
  - 删除 inline `generateStoryboardInputSchema`(line 22-31)
  - 改 `import { aiVideoInput } from '@quanan/schemas/specialist-io'`
- [ ] **AC-11** · apps/api/src/trpc/routers/copywriting.ts:
  - 删除 inline `acquisitionCopywritingInputSchema`(line 45-50)
  - 改 `import { acquisitionCopywritingInputSchema } from '@quanan/schemas/specialist-io'`(canonical)
  - SCRIPT_TYPE_ENUM / HOT_ELEMENT_ENUM 删除(改用 packages/schemas 的 SCRIPT_TYPE_KEYS_20 + HOT_ELEMENT_KEYS_22)
  - copywritingFreeGenerateInput 同样改 import canonical 版
- [ ] **AC-12** · 既有 unit test 全过 · 调整 assertion 适配新字段名(如 video-schemas.test.ts / VideoAgent.test.ts / CopywritingAgent.test.ts)
- [ ] **AC-13** · §1.0.6 5 项 grep 验证全过(diff packages/schemas vs specialists / router inline output 0 命中 / 4 router import 全命中 / legacy schema 已删 / 13 字段必填一一对应)
- [ ] **AC-14** · `pnpm test` 722 vitest 全过 · `pnpm typecheck` 6 ws 0 error · `pnpm lint --max-warnings=0` 全过
- [ ] **AC-15** · `pnpm prisma generate` 不需(本 PRD 不动 prisma schema)
- [ ] **AC-16** · 4 工具页 e2e 不破(history.detail 数据流通过 · sceneImage 渲染 OK · 13 列分镜表渲染 OK)— manifest 验证

**files_to_modify**:
- `packages/schemas/src/specialist-io/videoProduction.schema.ts`(~+15 行 · 字段集 4→3 · shotList 子字段 6→13+7)
- `packages/schemas/src/specialist-io/acquisitionVideo.schema.ts`(~+10 行 · output 4 字段替换 / input enum→string)
- `packages/schemas/src/specialist-io/aiVideo.schema.ts`(~+5 行 · output 加 title)
- `packages/schemas/src/specialist-io/acquisitionCopywriting.schema.ts`(~+15 行 · 删 legacy + output 字段集替换)
- `apps/api/src/specialists/VideoAgent.ts`(StoryboardSceneSchema regex 改 + 引入 packages/schemas type)
- `apps/api/src/specialists/CopywritingAgent.ts`(引入 packages/schemas type · 不改字段)
- `apps/api/src/trpc/routers/videoProduction.ts`(删 inline + import packages/schemas)
- `apps/api/src/trpc/routers/acquisitionVideo.ts`(同上)
- `apps/api/src/trpc/routers/aiVideo.ts`(同上)
- `apps/api/src/trpc/routers/copywriting.ts`(同上 · SCRIPT_TYPE_ENUM / HOT_ELEMENT_ENUM 删 · canonical)
- `tests/unit/api/schemas/video-schemas.test.ts`(适配新字段表 · ~+30 行)
- `tests/unit/specialists/VideoAgent.test.ts`(适配 regex 改动 · ~+5 行)
- `tests/unit/specialists/CopywritingAgent.test.ts`(适配字段名变化 · ~+10 行)
- `tests/unit/api/copywriting-acquisition.test.ts`(适配 input schema canonical 变化 · ~+5 行)

**files_to_create**: 无

**test_command** · `pnpm typecheck && pnpm test && pnpm lint --max-warnings=0`

**anti_patterns 注入(reject-examples.jsonl 自动)**:
- PRD-6 US-002 storyboard schema 字段不一致(关键词 schema/字段/boundary/regex)
- PRD-6 US-004 VideoProductionResult.tsx header→key 错位映射(关键词 header/key/错位/13 列)

**risk_level=foundation 升档原因(参 OPUS-AUDIT-CHEATSHEET §Z)**:
- PRD-7 后续 7 stories 不直接 depends_on US-001 · 但后续 PRD-8+ 任何写新 schema 的 story 都必读本 SoT 表
- design-drift 5 次显现 · 历史教训沉重 · rubber-stamp 风险高
- 改 4 router + 2 specialist + 5 packages/schemas · 影响面大 · 必须严审

---

### **US-002 · TD-020 ralph.py daemon 启动期清 verify-artifacts 残留**(risk_level=low)

> **risk_level** · `low`
> **priority** · 2
> **depends_on** · []

**描述** · ralph.py daemon 启动期清 verify-artifacts/<US-XXX>/ 跨 PRD 残留 · 防 audit-artifacts.py 误报 timestamps FAKE 60h 跨度。

实施步骤:
1. **scripts/ralph/ralph.py**(本项目副本)加 `_cleanup_stale_verify_artifacts()` 函数 · daemon 启动时调
2. 按 mtime 检查 · `> 24h` 删除 · 保留 24h 内的(本 PRD 新产物)
3. 仅扫 `scripts/ralph/verify-artifacts/US-*` 目录 · 不扫其他
4. 加日志 `[CLEANUP] Removed N stale files in verify-artifacts/`

**Acceptance Criteria** ·

- [ ] **AC-1** · scripts/ralph/ralph.py 加 `_cleanup_stale_verify_artifacts(threshold_hours: int = 24) -> int` 函数 · 返回删除的文件数
- [ ] **AC-2** · daemon 启动时(`_daemon_relaunch` 或 main 入口前)调用一次 · 通过 `if __name__ == '__main__':` 后立即调
- [ ] **AC-3** · 扫描 `scripts/ralph/verify-artifacts/US-*/` glob · 检查每文件 mtime · `now - mtime > threshold_hours` 时 unlink
- [ ] **AC-4** · 不删除 24h 内文件(本 PRD 新产物保留)
- [ ] **AC-5** · 日志输出 `[CLEANUP] Removed N stale files (>{threshold}h) in verify-artifacts/` · 跟 ralph-output.log 风格一致
- [ ] **AC-6** · 用 mocking 模拟 verify-artifacts/ 目录 · pytest unit 验证 cleanup 逻辑
- [ ] **AC-7** · 实测 · `cd /Users/return/Desktop/QuanAn && find scripts/ralph/verify-artifacts -type f | wc -l` PRD-7 启动后输出文件数 << 启动前(假设有残留)
- [ ] **AC-8** · audit-artifacts.py timestamps 检查不再误报 60h+ 跨度(US-001 audit 时验证)

**files_to_modify**:
- `scripts/ralph/ralph.py`(本项目副本 · 加函数 + 启动调用)

**files_to_create**:
- `tests/unit/scripts/ralph-cleanup.test.py` 或类似(若适合)— 或在 ralph-tools.py 加 sub-command `cleanup-artifacts` 让外部脚本测试

**test_command** · `python3 scripts/ralph/ralph.py --help && python3 -c "import sys; sys.path.insert(0, 'scripts/ralph'); from ralph import _cleanup_stale_verify_artifacts; print(_cleanup_stale_verify_artifacts(threshold_hours=24))"`

**anti_patterns**: 无相关 reject 历史

---

### **US-003 · TD-023 VALIDATOR.md 产物清单 + audit-artifacts.py 改进**(risk_level=low)

> **risk_level** · `low`
> **priority** · 3
> **depends_on** · []

**描述** · VALIDATOR.md 明确产物清单(含 pytest-full.xml 必落)+ audit-artifacts.py 改进。

**Note**: 本 PRD US-003 / US-005 / US-006 / US-007 涉及修改 `~/.claude/scripts/ralph/` 全局 ralph 套件 · ralph 跑代码时**直接改全局文件**(用户对 `~/.claude/` 已授权)+ 同步 `scripts/ralph/` 项目副本(让本 PRD 立即受益)。

实施步骤:
1. **~/.claude/scripts/ralph/VALIDATOR.md** 加产物清单章节 · 列每个 story 必落产物:
   - `manifest.json`(含 zero_regression 字段 · exit_code)
   - `pytest-full.xml`(JUnit 格式 · 零回归凭证)
   - `pytest-full.stdout.txt`(human-readable)
   - `typecheck.stdout.txt` · `lint.stdout.txt`(可选 · 收官 story 必落)
2. **~/.claude/scripts/ralph/audit-artifacts.py** 改进:
   - **manifest.zero_regression 显式字段时跳 timestamps 检查**(不再误报 FAKE 60h)
   - **partial FAKE 降级为 INFO**(只 manifest 缺 pytest-full.xml 时不报 WARN)
3. 同步项目副本 `scripts/ralph/audit-artifacts.py`(若有)

**Acceptance Criteria** ·

- [ ] **AC-1** · `~/.claude/scripts/ralph/VALIDATOR.md` 新增 `### §X · 产物清单(必落)` 章节 · 列 4 个产物文件 + 字段示例
- [ ] **AC-2** · `~/.claude/scripts/ralph/audit-artifacts.py` 在 `check_timestamps()` 函数加判断:
  ```python
  manifest = load_manifest()
  if manifest.get('zero_regression') in (True, 'PASS', 'passed'):
      print('[INFO] timestamps check skipped: manifest.zero_regression=PASS')
      return True  # 跳过
  ```
- [ ] **AC-3** · `audit-artifacts.py` partial FAKE 改判 · 只 manifest 缺 pytest-full.xml(不缺其他)时报 INFO(非 WARN)· 仍允许 audit pass
- [ ] **AC-4** · 跑 PRD-7 US-001 audit 时 · audit-artifacts.py 不再报 timestamps FAKE
- [ ] **AC-5** · scripts/ralph/audit-artifacts.py 项目副本同步
- [ ] **AC-6** · python audit-artifacts.py --story US-001 实测输出 · 0 false positive

**files_to_modify**:
- `~/.claude/scripts/ralph/VALIDATOR.md`(全局 · 加产物清单)
- `~/.claude/scripts/ralph/audit-artifacts.py`(全局 · 加 zero_regression skip 逻辑)
- `scripts/ralph/audit-artifacts.py`(项目副本同步 · 若已有副本)

**test_command** · `python3 ~/.claude/scripts/ralph/audit-artifacts.py --story US-001 --quiet`

**anti_patterns**: 无相关 reject 历史

---

### **US-004 · TD-021 ImageGen Worker types 改 import @quanan/schemas**(risk_level=low)

> **risk_level** · `low`
> **priority** · 4
> **depends_on** · [US-001](因 US-001 改 packages/schemas imageGen.schema.ts · 但本期不改字段 · 顺序 OK)

**描述** · `apps/api/src/workers/image-gen/index.ts` 改 import { ImageGenJobPayload, ImageGenJobResult } from '@quanan/schemas/specialist-io' · 删 inline TS interface · 仅保留 IImageGenWorker interface。

实施步骤:
1. **apps/api/src/workers/image-gen/index.ts** 删 inline `ImageGenJobPayload` interface(line 13-20)+ inline `ImageGenJobResult` type(line 22-24)
2. 顶部 `import { ImageGenJobPayload, ImageGenJobResult } from '@quanan/schemas/specialist-io'`
3. 保留 `IImageGenWorker` interface(line 28-30)— 这不在 packages/schemas
4. 保留 `export { DallE3ImageGenWorker, imageGenQueue }`(line 34-35)
5. 改 dependent 文件 import(若 dall-e-3.ts / queue.ts 内 import 自 ./index 取 ImageGenJobPayload · 改 import 自 @quanan/schemas/specialist-io)

**Acceptance Criteria** ·

- [ ] **AC-1** · apps/api/src/workers/image-gen/index.ts 删 inline `interface ImageGenJobPayload`(原 line 13-20)+ `type ImageGenJobResult`(原 line 22-24)
- [ ] **AC-2** · index.ts 顶部加 `import type { ImageGenJobPayload, ImageGenJobResult } from '@quanan/schemas/specialist-io';`
- [ ] **AC-3** · 保留 `export interface IImageGenWorker { ... }`(line 28-30)— 不在 packages/schemas
- [ ] **AC-4** · re-export type for backward compat: `export type { ImageGenJobPayload, ImageGenJobResult };`(让 dall-e-3.ts / queue.ts 仍可 import 自 ./index)
- [ ] **AC-5** · grep 验证 · `grep -E "^export (interface|type) ImageGenJob" apps/api/src/workers/image-gen/index.ts` 命中 0(只有 IImageGenWorker)
- [ ] **AC-6** · grep 验证 · `grep -rn "ImageGenJobPayload\|ImageGenJobResult" apps/api/src/workers/` 所有用法仍 OK · typescript 推断 type 来自 packages/schemas
- [ ] **AC-7** · `pnpm typecheck` 6 ws 0 error
- [ ] **AC-8** · `pnpm test` 722 vitest 全过(image-gen worker 既有 unit/integration test 不破)

**files_to_modify**:
- `apps/api/src/workers/image-gen/index.ts`(删 inline · import packages/schemas · re-export)

**files_to_create**: 无

**test_command** · `pnpm typecheck && pnpm test`

**anti_patterns**: 无相关 reject 历史

---

### **US-005 · RCA-004 timeout 5→20 全局 sync(PRR · 跨项目)**(risk_level=low)

> **risk_level** · `low`
> **priority** · 5
> **depends_on** · []

**描述** · ~/.claude/scripts/ralph/ralph.py timeout 默认值 5→20 · ~/.claude/scripts/ralph/sync-to-project.sh 推到所有项目 · .agents/rca/RCA-004.md 标 status=resolved。

**Note**: 本 PRD 仅修 `~/.claude/scripts/ralph/ralph.py` 全局源 + sync-to-project.sh 改进。各项目副本由后续 PRD-N 启动时自动 sync(本 PRD 不强制 sync 历史项目)。

实施步骤:
1. **~/.claude/scripts/ralph/ralph.py**:
   - line 119 函数 `_check_claude_health(timeout: int = 5)` 改 `timeout: int = 20`
   - 函数 docstring 加注释 RCA-004 · 跨 PRD 教训
2. **~/.claude/scripts/ralph/sync-to-project.sh**:
   - 加 ralph.py 版本检测 · 项目副本跟全局源版本不一致时自动 sync(prompt 用户确认 / `--force` flag 跳过)
   - 同步时备份 · `scripts/ralph/ralph.py.bak.before-sync-{timestamp}`
3. **/Users/return/Desktop/QuanAn/.agents/rca/RCA-004-health-check-timeout.md**:
   - 文档头部 status 从 `本项目已修` 改为 `resolved`
   - §5.2 全局级(留 PRR · 跨项目)章节加完成日期: `2026-05-10 · PRD-7 US-005 落地`

**Acceptance Criteria** ·

- [ ] **AC-1** · ~/.claude/scripts/ralph/ralph.py:119 timeout 默认从 `5` 改 `20`
- [ ] **AC-2** · ~/.claude/scripts/ralph/ralph.py:119 docstring 加 'RCA-004 (PRD-7 US-005 · 2026-05-10 · 全局 sync)' 注释
- [ ] **AC-3** · ~/.claude/scripts/ralph/sync-to-project.sh 加 `_check_ralph_version()` 函数 · 用 md5sum 比对 ~/.claude/scripts/ralph/ralph.py 跟 <project>/scripts/ralph/ralph.py
- [ ] **AC-4** · sync-to-project.sh 主流程加判断: 若版本不一致 + `--force` flag · 自动 cp 全局到项目 · 备份旧版到 ralph.py.bak.before-sync-{timestamp}
- [ ] **AC-5** · sync-to-project.sh 不带 `--force` 时仅 prompt warning(不强制 sync)
- [ ] **AC-6** · /Users/return/Desktop/QuanAn/.agents/rca/RCA-004-health-check-timeout.md 头部 status 改 `resolved` · §5.2 加 'PRD-7 US-005 落地 · 2026-05-10' 完成标记
- [ ] **AC-7** · 实测: 跑 `bash ~/.claude/scripts/ralph/sync-to-project.sh /Users/return/Desktop/QuanAn` 不报错 · 项目副本 ralph.py timeout 也是 20
- [ ] **AC-8** · grep 验证: `grep "timeout: int = 20" ~/.claude/scripts/ralph/ralph.py` 命中 1
- [ ] **AC-9** · grep 验证: `grep "timeout: int = 5\b" ~/.claude/scripts/ralph/ralph.py` 命中 0(防止还有其他地方写 5)

**files_to_modify**:
- `~/.claude/scripts/ralph/ralph.py`(全局 · timeout 改 20)
- `~/.claude/scripts/ralph/sync-to-project.sh`(全局 · 加版本检测)
- `/Users/return/Desktop/QuanAn/.agents/rca/RCA-004-health-check-timeout.md`(本项目 · status 改 resolved)
- `/Users/return/Desktop/QuanAn/scripts/ralph/ralph.py`(项目副本 · 同步全局 · 已经在 PRD-6 临时修过 · 本期再确认)

**files_to_create**: 无

**test_command** · `bash ~/.claude/scripts/ralph/sync-to-project.sh --check /Users/return/Desktop/QuanAn` (or similar dry-run)

**anti_patterns**: 无相关 reject 历史

---

### **US-006 · TD-003 audit-artifacts.py manifest 缺 exit_code 硬 reject**(risk_level=low)

> **risk_level** · `low`
> **priority** · 6
> **depends_on** · [US-003](US-003 改 audit-artifacts.py · 本期再加 exit_code 硬 reject 逻辑)

**描述** · ~/.claude/scripts/ralph/audit-artifacts.py manifest 缺 exit_code 字段时硬 reject(而非 SKIP)· exit_code 是 Validator 通过的关键凭证。

实施步骤:
1. **~/.claude/scripts/ralph/audit-artifacts.py** 在 manifest validation 阶段:
   - 加 `_check_exit_code(manifest)` 函数 · 检查 manifest['exit_code'] 是否存在 + 整数类型 + 值 = 0
   - 缺失 → exit code 1 + 输出 `[FAIL] manifest 缺 exit_code 字段 · Validator 凭证不全 · 拒绝 audit`
   - 不为 0 → exit code 1 + 输出 `[FAIL] manifest exit_code={N} ≠ 0 · Validator 实测失败 · 拒绝 audit`
2. 同步项目副本(若适合)

**Acceptance Criteria** ·

- [ ] **AC-1** · audit-artifacts.py 加 `_check_exit_code(manifest: dict) -> tuple[bool, str]` 函数 · 返回 (passed, message)
- [ ] **AC-2** · main 流程: manifest load 后第一步调 `_check_exit_code` · 失败立即 sys.exit(1)
- [ ] **AC-3** · manifest 缺 exit_code key → 输出 `[FAIL] manifest 缺 exit_code 字段 · Validator 凭证不全 · 拒绝 audit` · exit 1
- [ ] **AC-4** · manifest['exit_code'] 不是 int → 同样 reject(防类型错误)
- [ ] **AC-5** · manifest['exit_code'] != 0 → 输出 `[FAIL] manifest exit_code={N} ≠ 0 · 拒绝 audit` · exit 1
- [ ] **AC-6** · 跟 US-003 的 zero_regression skip 兼容(zero_regression=PASS 时仍要求 exit_code=0)
- [ ] **AC-7** · 实测 mock manifest · 缺 exit_code → reject · exit_code=1 → reject · exit_code=0 → pass(进 timestamps 等其他检查)
- [ ] **AC-8** · 跑 PRD-7 US-001 audit 时 · audit-artifacts.py 实际通过(因为 Validator 写 manifest.exit_code=0)

**files_to_modify**:
- `~/.claude/scripts/ralph/audit-artifacts.py`(全局 · 加 exit_code 硬检查)
- `scripts/ralph/audit-artifacts.py`(项目副本同步 · 若已有)

**test_command** · `python3 ~/.claude/scripts/ralph/audit-artifacts.py --story US-001` (US-001 manifest 含 exit_code=0 · 应 pass)

**anti_patterns**: 无相关 reject 历史

---

### **US-007 · TD-006 ralph daemon 启动期 detect [US-XXX] commit · 路径 B 自动触发**(risk_level=low)

> **risk_level** · `low`
> **priority** · 7
> **depends_on** · [US-002](US-002 改 ralph.py 加 cleanup · 本期同 ralph.py 加 detect 逻辑)

**描述** · ~/.claude/scripts/ralph/ralph.py daemon 启动期 detect 已存在 [US-XXX] commit · 5 retry 全 fail 时自动检查 git log --since · 有 [US-XXX] commit 时自动 audit-gate(pending) 让 Opus 接管(路径 B 自动触发)· 不需要用户手动 reset。

实施步骤:
1. **~/.claude/scripts/ralph/ralph.py** 在 5 retry 全 fail 流程中加:
   - `_check_existing_commit(story_id: str, since: str = '30 minutes ago') -> Optional[str]` · 跑 `git log --since={since} --oneline | grep "\\[{story_id}\\]"`
   - 命中 → 返回 commit hash · 否则 None
2. 当 retryCount=5 且 dev 失败时 · 调 `_check_existing_commit(current_story_id)`:
   - 命中 → 写 audit-gate.json {status:'pending', story_id, commit_hash, reason:'路径 B 自动触发: ralph 实际已 commit · daemon validate 误报 · 等 Opus 路径 B 接管'} · 跳过 retry · 返回 main loop 等 Opus
   - 未命中 → 走原有 BLOCKED 流程
3. 加日志 `[PATH-B] story={story_id} retry=5 git_log_hit={commit_hash} · 自动 audit-gate(pending)`

**Acceptance Criteria** ·

- [ ] **AC-1** · ralph.py 加 `_check_existing_commit(story_id, since='30 minutes ago')` 函数 · subprocess.run git log + grep + 提取 hash
- [ ] **AC-2** · ralph.py 在 dev failure 流程(retryCount >= 5)前加 `if (commit_hash := _check_existing_commit(story_id))` 判断
- [ ] **AC-3** · 命中 commit_hash → 调 ralph-tools.py `audit-trigger --story {story_id} --commit {hash} --reason "路径 B 自动触发"` 或直接写 audit-gate.json
- [ ] **AC-4** · 未命中 → 维持原有 BLOCKED 行为
- [ ] **AC-5** · 日志输出 `[PATH-B] story={story_id} retry=5 git_log_hit={commit_hash} · 自动 audit-gate(pending)` · 写 ralph-output.log
- [ ] **AC-6** · 实测 mock · 模拟 retry=5 + git log 有 [US-006] commit → audit-gate.json 写入 pending status
- [ ] **AC-7** · 实测 mock · 模拟 retry=5 + git log 无命中 → BLOCKED 写入(原行为)
- [ ] **AC-8** · 跨 PRD 兼容 · since='30 minutes ago' 不会扫到上一 PRD 残留 commit(因 PRD 间隔 > 30 min · 实际更长)

**files_to_modify**:
- `~/.claude/scripts/ralph/ralph.py`(全局 · 加 detect commit + 路径 B 自动)
- `scripts/ralph/ralph.py`(项目副本同步)

**test_command** · `python3 -c "import sys; sys.path.insert(0, '${HOME}/.claude/scripts/ralph'); from ralph import _check_existing_commit; print(_check_existing_commit('US-001', since='10 minutes ago'))"` (期望: 跑在 PRD-7 分支时返回 commit hash if exists · None otherwise)

**anti_patterns**: 无相关 reject 历史

---

### **US-008 · TD-011 AccountDropdown ScrollArea 自适应**(risk_level=low)

> **risk_level** · `low`
> **priority** · 8
> **depends_on** · []

**描述** · apps/web/src/components/Header.tsx AccountDropdown · N=1-3 accounts 时 240px ScrollArea 空旷 · 改为 max-height + 自适应。

**当前代码**(Header.tsx line 116 + 143):
```tsx
function AccountDropdown() {
  // ...
  <ScrollArea className="h-60">
    {accounts.map(...)}
  </ScrollArea>
}
```

**目标代码**:
```tsx
function AccountDropdown() {
  // ...
  // 1 account: 不渲染 ScrollArea · 直接 <div>
  // 2-3 accounts: max-h-60 紧凑布局
  // 4+ accounts: max-h-60 + ScrollArea(滚动)
  
  if (accounts.length === 1) {
    return <div className="py-1">{accounts.map(...)}</div>;
  }
  if (accounts.length <= 3) {
    return <div className="py-1 max-h-60">{accounts.map(...)}</div>;
  }
  return (
    <ScrollArea className="max-h-60">
      {accounts.map(...)}
    </ScrollArea>
  );
}
```

**注**: 需实测 Radix DropdownMenuContent 是否兼容 max-h-N + 内部 viewport overflow:auto · PRD-3 retro 教训说不兼容时需保留 h-N。**先尝试 max-h · 不兼容 fallback h-N + 条件渲染**(N=1 不显示 ScrollArea / N=2-3 用更小 h-N · 如 h-32 / N=4+ 用 h-60)。

实施步骤:
1. **apps/web/src/components/Header.tsx** AccountDropdown(line 116-)修改:
   - 先尝试 max-h-60 · 实测 Radix dropdown portal 是否 break
   - 兼容 → 加 N=1 不渲染 ScrollArea / N=2-3 max-h-{auto-calc}
   - 不兼容 fallback → N 分档 ScrollArea h-{auto-calc}(N=1 不渲染 / N=2 h-20 / N=3 h-40 / N=4+ h-60)
2. 不动 line 188(ToolsDropdown h-52)— ToolsDropdown 14 项稳定数 · 不存在空旷问题
3. 不动 line 250(其他 ScrollArea · h-[calc(100vh-100px)] 是另一组件)

**Acceptance Criteria** ·

- [ ] **AC-1** · apps/web/src/components/Header.tsx AccountDropdown(line 116-)按 N 分档渲染:
  - N=1: 不渲染 ScrollArea · 直接 div(`<div className="py-1">`)
  - N=2-3: 紧凑布局(max-h-{N*40}px 或类似自适应 · 或 h-{20|40})
  - N=4+: ScrollArea max-h-60 或 h-60(实测后确定)
- [ ] **AC-2** · 用 agent-browser 打开 `http://localhost:5173/login` 完成登录 · 然后访问主页面 · click `AccountDropdown` 触发器
- [ ] **AC-3** · 用 agent-browser 实测:
  - **N=1 场景** · seed 1 个 ip_account · dropdown 高度 ≤ 80px(不空旷)
  - **N=2 场景** · seed 2 个 · dropdown 高度 ≈ 120px(紧凑)
  - **N=3 场景** · seed 3 个 · dropdown 高度 ≈ 160px(紧凑)
  - **N=4+ 场景** · seed 4+ 个 · dropdown 高度 ≤ 240px · 内部可滚
- [ ] **AC-4** · 截图保存 · `verify-artifacts/US-008/screenshot-{N}.png` × 4 张(N=1/2/3/4)
- [ ] **AC-5** · 无控制台错误 · 无 Radix dropdown portal break(若 fallback 路径 · 也接受 h-{20|40|60} 实施)
- [ ] **AC-6** · `pnpm typecheck` 6 ws 0 error · `pnpm lint --max-warnings=0` 全过
- [ ] **AC-7** · `pnpm test` 既有 unit test 不破(Header.tsx 既有 test 适配 · 若有)
- [ ] **AC-8** · 既有 e2e 测试不破(account-step-auth.test.ts / account-isolation.test.ts 等通过)

**files_to_modify**:
- `apps/web/src/components/Header.tsx`(line 116-160 AccountDropdown 自适应高度)

**files_to_create**:
- 视情况加 unit test · `tests/unit/web/account-dropdown.test.tsx`(可选)

**test_command** · `pnpm test && pnpm typecheck && pnpm lint --max-warnings=0`

**anti_patterns**: 无相关 reject 历史(但 PRD-3 / PRD-5 关于 ScrollArea 已有 Codebase Patterns 可参考)

---

## §2 Functional Requirements

- **FR-1**: 5 schema(videoProductionInput/Output, acquisitionVideoInput/Output, aiVideoInput/Output, acquisitionCopywritingInputSchema/Output, imageGenJobPayload/Result)字段名 + 类型 + boundary + enum + regex 在 packages/schemas + apps/api specialists inline + apps/api routers inline 三处必须 1:1 一致
- **FR-2**: ralph.py daemon 启动期自动清 verify-artifacts/ 跨 PRD 残留 · mtime > 24h
- **FR-3**: VALIDATOR.md 含产物清单 · audit-artifacts.py 改进(zero_regression skip / partial FAKE INFO)
- **FR-4**: ImageGen Worker types 不在 worker 内 inline 定义 · 必须 import 自 @quanan/schemas/specialist-io
- **FR-5**: ralph.py timeout 5→20 全局 sync · 各项目副本通过 sync-to-project.sh --force 同步
- **FR-6**: audit-artifacts.py manifest 缺 exit_code 必硬 reject(非 SKIP)
- **FR-7**: ralph.py daemon retry=5 时自动 detect [US-XXX] commit · 命中则路径 B 自动触发(写 audit-gate(pending))· 不命中维持 BLOCKED
- **FR-8**: AccountDropdown 按 N(accounts 数)分档渲染 · 1/2-3/4+ 三档 · 不空旷不破 portal

## §3 范围排除(Non-Goals)

- 不新增任何 Specialist / router / 工具页 / 新功能
- 不改 LLM prompt 模板(PROMPTS.md 不动)
- 不改 LLMGateway / ContextAssembler / BullMQ / Redis 等基础设施
- 不改 prisma schema(Asset / History / cost_log 等表全保持现状)
- 不改 ImageGen Worker 内部 DALL-E 3 wrapper 实现(只改 type import 路径)
- 不改 admin 任何代码(留 PRD-10~14)
- 不强制 sync-to-project.sh 历史项目副本(其他项目用户主动 `--force` sync)

## §4 Design Considerations

- US-001 的 schema SoT 表是本 PRD 的核心 · §1.0 是后续所有 PRD 写新 schema 时的强制对照模板
- US-008 的 AccountDropdown 自适应应**先实测 Radix max-h 兼容** · 不兼容才 fallback 到 N 分档 h-N
- US-005 / US-007 改 `~/.claude/scripts/ralph/` 全局源 + 项目副本同步 · 不强制要求 sync-to-project.sh 推到所有现有项目(那是用户主动操作)

## §5 Technical Considerations

- US-001 改 packages/schemas + specialists inline + routers inline 三处 · 必须严格按 §1.0.6 5 项 grep 验证 · 否则 reject
- US-002 / US-007 修 ralph.py 必须实测 daemon 启动 · `ps aux | grep ralph` 确保不破坏 daemon 主进程
- US-003 / US-006 改 audit-artifacts.py 必须实测跑 US-001 audit · 0 false positive
- US-005 sync-to-project.sh 改进必须**不破坏现有调用 pattern**(用户没 `--force` 时维持现行为)
- US-008 用 agent-browser 截图 4 张(N=1/2/3/4)· 必落 verify-artifacts/US-008/

## §6 跨 Story 协议锁

| 命名 | 类型 | 定义 story | 消费 story | 说明 |
|---|---|---|---|---|
| `videoProductionOutput.shotList` | `z.array(ShotItemSchema).min(1)` | US-001 | (PRD-7 不消费 · 后续 PRD-8+ 写视频相关 schema 必引此 SoT) | 13 必填 + 7 optional 子字段对齐 PROMPTS §6.2 |
| `aiVideoSceneSchema.imagePromptEn.regex` | `/^[\x00-\x7F]+$/` | US-001 | (US-001 同时改 specialists inline 跟 packages/schemas 一致) | 严格 ASCII · 不容忍 \t\n\r 例外 |
| `acquisitionCopywritingInputSchema` | `z.object({scriptType, elements, conversionGoal, topic})` | US-001 | (router/copywriting.ts 删 inline) | 4 字段 · 跟 /generate UI form 字段一一对应 |
| `_cleanup_stale_verify_artifacts(threshold_hours)` | `(int) -> int` | US-002 | (daemon 启动) | 24h 阈值 · 防 PRD 残留误报 |
| `audit-artifacts.py manifest.zero_regression` | `bool/str` field | US-003 | US-006(check exit_code 后再走 zero_regression skip) | manifest 显式字段 · skip timestamps |
| `audit-artifacts.py manifest.exit_code` | `int` field(必填 · 必=0) | US-006 | (Validator 写 manifest 时必带) | 缺则硬 reject |
| `_check_existing_commit(story_id, since)` | `(str, str) -> Optional[str]` | US-007 | (daemon retry=5 fail loop) | 路径 B 自动触发 |
| `~/.claude/scripts/ralph/ralph.py:_check_claude_health` | `(timeout: int=20)` | US-005 | (daemon main loop) | timeout 5→20 |

定义 story 的 priority 必须**小于**消费 story · 即 US-001(P1)< US-008(P8)等。本 PRD 的 8 stories 大部分独立(无强依赖)· 但 US-006 depends_on US-003(改 audit-artifacts.py 同文件)· US-004 / US-007 depends_on US-001 / US-002(避免文件冲突)。

## §7 Locked Decisions(D-046 ~ D-049)

> 本 PRD 锁 4 个新决策 · 跨 PRD 后续不变。

- **D-046**(Schema SoT 三处一致原则):任何新 schema(后续 PRD-N 写时)必须 packages/schemas + apps/api specialists inline + apps/api routers inline 三处字段名 + 类型 + boundary + enum + regex 100% 一致 · plan-check 强制 grep 三处 diff = 0(详 §1.0)
  - 派生:TD-022(5 次显现)
  - 违规检测:US-001 §1.0.6 5 项 grep · 任一 fail → reject
  - 例外:specialists inline 允许有额外 optional 字段(为 LLM fallback 留空间)· 但所有 required 字段必须 100% 跟 packages/schemas 一致

- **D-047**(canonical 选择优先级):跨三处 schema 不一致时 · canonical 优先选 specialists inline(因 specialists 字段对齐 LLM 实际 output + history 渲染逻辑)· 其次选 router inline · 最后选 packages/schemas
  - 派生:TD-022 修复时的判定标准
  - 违规检测:本 PRD 落地时 packages/schemas 5 schema 字段集对应 specialists inline · diff 0
  - 例外:imageGen.schema.ts 已是 packages/schemas canonical(zod 完整 · worker inline 是 TS interface 退化)· 此处 packages/schemas 是 canonical

- **D-048**(verify-artifacts cleanup 时间窗):ralph.py daemon 启动期清 mtime > 24h 跨 PRD 残留 · 24h 是经验值(同一 PRD 不会跨 24h · 同时给跨 session 重启留 buffer)
  - 派生:TD-020
  - 违规检测:US-002 跑后 verify-artifacts/US-001~006/* 跨 PRD 残留全删
  - 例外:特殊 PRD(超 24h)启动前 用户手动 `--no-cleanup` flag

- **D-049**(路径 B 自动触发条件):ralph daemon retry=5 全 fail + git log --since='30 minutes ago' 命中 [US-XXX] commit → 自动写 audit-gate(pending) · 让 Opus 接管 · 不需用户手动 reset
  - 派生:TD-006
  - 违规检测:US-007 mock 测试 · retry=5 + git log 命中 → audit-gate.json 写 pending(非 BLOCKED)
  - 例外:retry=5 + git log 不命中 → 维持 BLOCKED 行为(原有)

## §8 Success Metrics

- TD-022 关闭(packages/schemas + specialists + routers 三处 5 schema 字段 100% 一致 · audit grep 验证)
- TD-020 关闭(ralph.py daemon 启动期自动清 verify-artifacts/ 残留 · audit-artifacts.py 不再误报 timestamps FAKE)
- TD-023 关闭(VALIDATOR.md 含产物清单 · audit-artifacts.py 改进)
- TD-021 关闭(ImageGen Worker types import @quanan/schemas)
- TD-003 关闭(audit-artifacts.py manifest 缺 exit_code 硬 reject)
- TD-006 关闭(ralph.py daemon retry=5 自动路径 B 触发)
- TD-011 关闭(AccountDropdown ScrollArea 自适应)
- RCA-004 status=resolved(timeout 5→20 全局 sync)
- 8 stories 一轮通过率 ≥ 90%
- reject 数 ≤ 2
- vitest 722 / typecheck 0 error / lint 0 warning 全过(零回归)
- judge 39 不破 / e2e 142 不破

## §9 Open Questions

- **Q-1** · D-047 canonical 选择规则是否要写到 AGENTS.md LD-013 段?(本 PRD 暂只锁在 PRD-7 §7 D-047 · 后续 PRD 启动时若再次需要 · 评估提升到 AGENTS.md LD)
- **Q-2** · sync-to-project.sh `--force` 是否要默认强制 sync 跨项目?(本 PRD 不强制 · 用户主动 sync · 留 PRD-N 启动时 evaluate)
- **Q-3** · US-008 AccountDropdown 是否同样应用到 ToolsDropdown(line 188 h-52)?(本 PRD 不动 · 因 ToolsDropdown 14 项稳定数 · 无空旷问题 · 留 PRD-N 评估)
- **Q-4** · D-048 cleanup 24h 阈值是否合适?(经验值 · 实测后调整)

---

## 跨 Story 协议锁(详 §6 表)

详见 §6。

---

## Locked Decisions(详 §7)

- **D-046**: Schema SoT 三处一致原则
- **D-047**: canonical 选择优先级(specialists > routers > packages/schemas)
- **D-048**: verify-artifacts cleanup 24h 时间窗
- **D-049**: 路径 B 自动触发条件(retry=5 + git log 命中 [US-XXX])

---

> **本 PRD 由 Claude(Opus 4.7)在 PRD-6 完整收官后写 · 2026-05-10 · cleanup PRD · 治本 7 open TD + RCA-004 全局 sync。**
> **PRD-6 retro Playbook P-1~P-7 全部纳入实施 · 跨 PRD 复利从此正向。**
