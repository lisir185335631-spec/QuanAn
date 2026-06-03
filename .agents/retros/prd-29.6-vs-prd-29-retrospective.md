# PRD-29.6 vs PRD-29 · 跨 PRD 复盘

> **版本** · v0.1(2026-05-24 · ralph/prd-29.6-step3-buttons-llm-config)
> **比较** · PRD-29.6(6 dev + 1 收官 = 7 US) vs PRD-29(17 dev + 1 收官 = 18 US)
> **主题** · /step/3 button 真实可用 + admin LLM Config 模块

---

## §0 PRD-29.6 摘要

### §0.1 核心交付（5 维度）

| 维度 | PRD-29 基础 | PRD-29.6 升级 | 结果 |
|---|---|---|---|
| **Layout 1:1** | ✅ 完成(PRD-29) | — | ✅ 不变 |
| **字面对账** | ✅ verbatim(PRD-29) | — | ✅ 不变 |
| **Interaction(用户可交互)** | ⚠️ skeleton/disabled | ✅ 全 button wire 真实可用 | 🆙 **升级** |
| **默认内容可见** | ✅ mock data 渲染(PRD-29.5) | ✅ 继承 + button 有反馈 | ✅ 继承 |
| **真实可用 LLM** | ❌ env only · 无 admin 配置 | ✅ admin LLM Config + DB 优先 5min cache | 🆙 **升级** |

### §0.2 US 分布（7 US）

| story | size | AC 数 | 1st iter | audit |
|---|:-:|:-:|:-:|:-:|
| US-001 admin LLM Config page | medium | 10 | ✅ | ✅ |
| US-002 llm-gateway DB 优先 + 5min cache | medium | 7 | ✅ | ✅ |
| US-003 step3.optimizeSection mutation | small | 5 | ✅ | ✅ |
| US-004 一键重新生成 force flag | small | 4 | ✅ | ✅ |
| US-005 复制全部 + per-section copy | small | 5 | ✅ | ✅ |
| US-006 生成参考图/查看图标 stub toast | small | 4 | ✅ | ✅ |
| US-007 收官 verify + retro + tag | medium | 8 | ✅ | — |

---

## §1 通过率分析

| 指标 | PRD-29 | PRD-29.6 | 变化 |
|---|:-:|:-:|:-:|
| dev 1iter rate | 94%(16/17) | **100%(6/6)** | +6pp |
| audit 1iter rate | 100%(17/17) | **100%(6/6)** | = |
| Opus reject | 0 | **0** | = |
| 平均 story 粒度 | medium-large | small-medium | ↓ (更精细) |
| 总 US 数 | 18 | 7 | ↓ (聚焦 sub-PRD) |

### §1.1 100% 1iter rate 原因

1. **所有 story 为 small/medium** · US-003~006 均为 small(≤ 5 AC · ≤ 5 files) · ralph 单 iter 完成无障碍
2. **anti_patterns 注入有效** · 反例库 57 条 · PRD-29.6 story 均生成了 `[SHIELD]` 段 · 避免了跨 PRD 重犯错误
3. **Foundation 完整** · PRD-29 18 US 已建立 step3 完整组件树 · PRD-29.6 只需 wire onclick handlers 和新 mutation · 无大重构
4. **依赖链清晰** · prd.json `depends_on` 链: US-003/004 → US-002 · US-002 先行 · 后续 US 零阻塞

---

## §2 5 维度成绩详解

### §2.1 Layout 1:1（继承 PRD-29）

PRD-29 已完成 168 OKLCH token + 9 section render。PRD-29.6 未修改任何 layout 代码，视觉保持 100% 1:1。

### §2.2 字面对账（继承 PRD-29）

PRD-29 verify-prd-29.sh 7.1~7.8 全部通过。PRD-29.6 新增字面：
- `toast.info('图片生成功能需 admin 配置 OpenAI DALL-E key · 当前请使用文字描述参考')` — stub 说明字面
- admin sidebar: `'LLM 配置'` — 中文字面精确

### §2.3 Interaction 真实可用（PRD-29.6 核心升级）

| button | PRD-29 状态 | PRD-29.6 状态 |
|---|:-:|:-:|
| 生成账号包装方案(CTA) | ✅ generatePackage mutation | ✅ 继承 |
| 一键重新生成 | ⚠️ onClick 未完整 wire | ✅ force flag + isForceRegenerateRef |
| 智能优化 | ❌ 未实现 | ✅ step3.optimizeSection mutation |
| 复制全部(toolbar) | ❌ 未实现 | ✅ clipboard.writeText + toast |
| 生成参考图(VideoRef) | ❌ 按钮 disabled | ✅ handleImageGenStub stub toast |
| 查看图标(Avatar) | ❌ 按钮 disabled | ✅ handleImageGenStub stub toast |
| 生成参考图(Background) | ❌ 按钮 disabled | ✅ handleImageGenStub stub toast |

### §2.4 默认内容可见（继承 PRD-29.5）

PRD-29.5 已实现 `generateMockResult()` · mock data 渲染 6 H3 section。PRD-29.6 `canBulkActions = !isLoading` 升级使按钮在 mock data 时也可点击（D-302 锁）。

### §2.5 真实可用 LLM（PRD-29.6 核心新功能）

| 组件 | 实现 |
|---|---|
| admin /admin/llm-config page | listSystemConfig/updateSystemConfig wire · masked display · 已设置/未设置 indicator |
| LLM gateway DB 优先 | `loadLlmKey(provider)` · prisma findUnique → env fallback · 3 层保险 |
| 5min cache | `Map<provider, {value, expiresAt}>` · invalidateLlmKeyCache(provider?) · admin 改 key 自动 clear |
| audit log | `_updateSystemConfigInTx` 已内置 audit · admin 改 key 自动 append audit 记录 |

---

## §3 Playbook · 5 条可迁移经验

### P-29.6-1 · Sub-PRD 聚焦模式高效

**经验**: PRD-29.6 作为 PRD-29 的 button wiring sub-PRD，聚焦单一主题（交互完整性），7 US 全部 1iter 通过。大 PRD 后跟 sub-PRD 修复遗漏是高效分层策略。

**Apply**: 后续 PRD 如果有"layout PRD + wiring sub-PRD"模式，优先选 small story + sub-PRD 而非把所有内容塞进一个大 PRD。

### P-29.6-2 · canBulkActions = !isLoading 简化状态机

**经验**: PRD-29 原设计 `canBulkActions = !!hasRealData` 使按钮在 mock data 下 disabled。D-302 将其改为 `!isLoading`，使所有按钮在初始渲染时可用，既提升 UX 也使 e2e 测试更简单（无需先 trigger mutation）。

**Apply**: 未来 step page 的 bulk action buttons 默认用 `!isLoading` 策略，而非 `!!hasData`。

### P-29.6-3 · Stub toast 作为 "工作中·未接" 的标准 UX

**经验**: 图片生成功能 DALL-E 未接入时，stub toast 明确告知用户配置需求（`'图片生成功能需 admin 配置 OpenAI DALL-E key'`），比 disabled 更好的 UX。

**Apply**: 任何"功能需要 admin 配置才可用"的场景，stub toast > silent disabled button。

### P-29.6-4 · llm-gateway DB-first cache 是 LLM 配置的标准模式

**经验**: `loadLlmKey()` → DB findUnique → env fallback · 5min cache · invalidate on update。这套 3 层保险 + cache 模式可以直接复用到任何需要动态配置 API key 的 gateway。

**Apply**: PRD-30+ 如有新 LLM gateway（如 image gen），直接复用这个 `loadLlmKey` 模式，不要 hardcode env。

### P-29.6-5 · admin 改配置时自动 invalidate gateway cache

**经验**: `_updateSystemConfigInTx` 在写入后调用 `invalidateLlmKeyCache(provider)`。这样 admin 改 key 后 < 5s 生效，无需手动清 cache 或重启服务。

**Apply**: 任何 service/gateway 使用 DB-backed config 时，config update handler 必须调 `invalidateXxxCache()`。

---

## §4 Tech Debt 状态

| TD | 状态 | 说明 |
|---|:-:|---|
| 93 pre-existing lint errors | 🟡 存在 | PRD-29.6 未引入新 lint error · 存量 TD |
| 图片生成 DALL-E 接入 | 🔵 待 PRD-30+ | stub toast → 真实接入 |
| LLM Config encrypted storage | ⚠️ 待确认 | `_updateSystemConfigInTx` 是否已加密 configValue？ |

---

## §5 PRD-30 提示

> **重要**: PRD-30 启动前，建议沿用 "layout + wiring" 二阶段策略：
>
> - **PRD-30 Phase 1**: /step/3b + /step/4b + /evolution 页面 layout 1:1 复刻（类似 PRD-29）
> - **PRD-30 Phase 2 (sub-PRD)**: 每个 page 的 button wiring + 真实可用 · 每 page 确保"真实可用 + 默认内容"双维度
>
> PRD-29.6 证明了这个模式的有效性：100% 1iter rate · 0 Opus reject · 7 US 全通过。

---

> **作者** · Ralph Agent(claude-sonnet-4-6) · 2026-05-24
> **Branch** · ralph/prd-29.6-step3-buttons-llm-config
> **Commits** · US-001~007 · git tag: prd-29.6-complete
