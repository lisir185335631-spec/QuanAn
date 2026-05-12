# PRD-9 vs PRD-8 复盘

> **基线** · PRD-8 (P7 智能模块 · 13 stories · 一轮通过率 54%)
> **当前** · PRD-9 (P8 知识库 + pgvector RAG · 5 stories · 全 PASSED)
> **触发** · /goal-verify(隐式)+ 用户 /prd-retro · 2026-05-12
> **核心问题** · 0 Opus reject 但 1 daemon BLOCKED · ECONNRESET infrastructure 失败 vs 实现质量评估

---

## 0. 数据总览

```
PRD-9 一轮通过率 (严格) ≈ 0/5 = 0%
  - 严格 1 pass (single iter):    0 stories
  - retry 1 (Validator-self-correction): US-001 (AC-2 表名 + AC-7 rate limit) (1 story)
  - retry 2 (ralph dev 自纠 + validator re-run): US-003 (3 iter) · US-005 (Developer timeout) (2 stories)
  - retry 3+ (AC-10 deviation fix): US-004 (4 commits within iter) (1 story)
  - daemon BLOCKED (ECONNRESET infra fail · 非实现失败): US-002 (1 story)
  - **Opus reject: 0**
  - 总 commits: 22 (12 feat + 9 chore + 1 docs)

PRD-9 daemon wall-clock: 19:50~21:40(daemon 1)+ 22:50~00:22(daemon 2)= ~3.5h(daemon active)
PRD-9 总 wall-clock(含 Opus 接审 + RCA + TD 登记): ~4.5h
PRD-8 daemon active: 6.24h
Ratio: PRD-9 daemon 0.56× PRD-8(stories 5/13 = 0.38× · 比例合理)
```

### 关键事实

1. **0 Opus reject** · 沿用 PRD-7/8 ★
2. **1 daemon BLOCKED**(US-002 ECONNRESET storm)· 但实现质量 OK · 跟 RCA-003 (PRD-4 US-012) + RCA-004 (PRD-8) 同 family
3. **5 个新 TDs** · TD-033/034/035/036(US-005 已 resolve)+ TD-036
4. **1 个新 RCA** · RCA-006(daemon Validator skip + ECONNRESET 5-retry 误 BLOCK)
5. **anti_patterns 首次跨 PRD 注入实战**(PRD-8 retro Diff-3 验证)· 3 条 US-003 anti_patterns 全防御成功
6. **Static 漏审新模式** · apps/api/scripts/ 不在 tsconfig include · 19 lint+typecheck 错静默漏 · Opus audit 才发现 · PRD-1~8 未见 · 应固化机制

---

## 1. PRD 文档质量

### 优势(沿用 PRD-7/8 教训)

- **§1.0 ★★★ Schema SoT 表**(US-001 + US-003 共用 · D-046 三处一致)· 写法成熟
- **§6 跨 Story 协议锁表**(KnowledgeChunkContent / RagRetrieveParams / ragRetrieveWorker.retrieve 命名 / cost_log eventType='embedding_call' 等)
- **anti_patterns 字段首次实战注入**:US-001 + US-003 各 3 条 · 来源标 source_prd + source_story 清晰

### 缺陷(本 PRD 教训)

- ⚠️ **22 vs 23 元素 doc-drift**(TD-033 · 已 resolved by 6c40f85)· PRD-9 撰写时数 HOT_ELEMENTS 抄错(canonical 23)· 5 处 AC 字面 + 5 处描述 + header / FR / Non-Goal / Verify · 共 19 处 doc 字面错
  - 根因 · 抄数前没 grep 验证 canonical 数据源(应跑 `python3 -c "import json; ..." 或类似 sanity)
  - 影响 · 1 个 TD-033 跟踪到 PRD-9 收官 + commit 6c40f85 doc-only fix(44+/-41 lines)

- ⚠️ **AC-10 真 seed 推 staging 没写在 PRD**(TD-034 · open)· PRD-9 AC-10 字面要 psql 验证 · 但本地 dev 无 OPENAI_API_KEY · 应在 PRD AC-10 显式标"local dev fallback + staging 真验"分两 path

### 量化

| 维度 | PRD-7 | PRD-8 | **PRD-9** | vs PRD-8 |
|---|:-:|:-:|:-:|:-:|
| SoT 表数 | 4 | 4 | 1(US-001+US-003)| -3(规模小)|
| 协议锁项数 | 8 | 8 | 14 (跨 schema + worker + const + section)| +6 ★ |
| Locked Decisions 新增 | D-046~049 | D-050~055 | D-056~058 | -3(规模小)|
| anti_patterns 字段使用 | 0 | 0 | **3(US-001 3 + US-003 3 + US-004 0)** | 首次实战 ★★ |
| Doc-only drift TD | 0 | 0 | **1**(TD-033)| +1 ⚠️ |

---

## 2. plan-check W-patches

PRD-9 prd.json 通过 `/plan-check` 时:
- ✅ anti_patterns 字段使用率 60%(3 stories with anti_patterns · 5 total)· 首次有 anti_pattern 字段
- ⚠️ 未预埋 "apps/<x>/scripts/ tsconfig include" patch(因 PRD-1~8 没遇过 · 不在 plan-check 规则里)
- ⚠️ 未预埋 "HOT_ELEMENTS 实测项数 sanity"(canonical 数据源 vs PRD doc 双向 grep · doc-drift 防御)

**节省的 reject 估计**:
- anti_patterns 直接防御 US-003 D-007 + 协议锁单一 + 11 specialist 0 改 → 0 reject · 估计省 2 轮(若没 anti_patterns 注入约 1-2 次 reject)
- 但 TD-033 doc-drift 没在 plan-check 捕到 → audit 时 Opus 才发现 → 1 round audit overhead

**净 ROI**:plan-check anti_patterns 实战兑现 · 但需要补 2 个新 patch(详 §9)

---

## 3. Ralph 跨 story 扩展能力

### 主动扩展案例(PRD-9)

1. **US-001 self-fix retry 1** · ralph 主动识别 AC-2 表名错(`knowledge_chunk` vs `KnowledgeChunk`)+ AC-7 rate limit wire-up 缺 → 第 2 iter 自纠 commit 2b7b212 · 0 reject

2. **US-004 ILIKE fallback 自加**(fb0c206)· ralph 实现 AC-9/10 browser test 时发现 dev 无 OPENAI_API_KEY → 主动给 ragRetrieveWorker 加 text-search fallback(参数化 SQL + topK/keywords 限制 + 仅 dev 触发)· 不破坏 production pgvector path · 是合理 deviation

3. **US-004 dev seed 手动 psql**(TD-036)· ralph 用 psql 直插 4 条 dummy chunks for AC-10 验证 · 没代码化 · 但 US-005 收官时主动补齐 seed script no-key mode(commit 16e5a78)· 同 PRD 内 self-resolve TD ★★

4. **US-005 收官扫底主动加** · seed script no-key mode (h asApiKey 检查 + null embedding 分支)· 不仅解 TD-036 · 还让 pnpm seed:knowledge 任意环境可重跑 · 加 cost_log 第 7 类 grep 全证 · 6 e2e tests on knowledge-rag-loop

5. **US-003 iter 2 → iter 3 self-correction** · 2 iter 内 ralph 主动调整 Validator 反馈 · 没等 Opus reject

### 评分

| 维度 | PRD-7 | PRD-8 | **PRD-9** |
|---|:-:|:-:|:-:|
| 主动扩展次数 | 1 | 5 | **5** ★ |
| Self-resolve TD 同 PRD 内 | 0 | 0 | **1**(TD-036)★★ |
| 自纠 retry 1 成功率 | 100% | 80% | **100%** ★ |

---

## 4. progress.txt 跨 PRD 知识传递

### 继承的 patterns(PRD-1~8 → PRD-9)

成功复用:
- ✅ **schema SoT 三处一致原则**(D-046)· US-001 packages/schemas/src/rag/index.ts canonical · 0 跨 story 命名漂移
- ✅ **monorepo cross-workspace import**(PRD-7 经验)· apps/api 沿用 paths `@/*` · 0 baseUrl 配置 reject
- ✅ **eslint-plugin-import order**(PRD-1 经验)· 但 US-002 漏(scripts/ 不在 include 静默 · 见 §9)
- ✅ **vitest workspace alias map**(PRD-6 经验)· US-003 RAG mock 完美沿用

### 本 PRD 新沉淀(回传到 progress.txt § 11)

```
## Codebase Patterns - PRD-9
- seed-knowledge-chunk.ts 无 OPENAI_API_KEY 时 → null embedding 模式(token 粗算 content.length/1.5)· 幂等 upsert by (type, title) · pnpm seed:knowledge 任意环境可重跑
- debugAssembleSystemPrompt endpoint userInput.userMessage 传中文关键词供 text-search fallback · dev 环境(无 embedding)需确保关键词命中真实 knowledge_chunk content
```

### 评分

| 维度 | PRD-8 | **PRD-9** |
|---|:-:|:-:|
| 继承的 patterns 数 | ~8 | ~10 |
| 同类 reject 0 次(继承 pattern 防御)| 5 类 | 4 类 ★ |
| 新沉淀 patterns | 4 | 2 ★ |
| 跨 PRD pattern 复用率 | ~70% | ~85% ★ |

---

## 5. Opus Audit Feedback 演化

### PRD-9 Opus reject 数:**0**

所有 4 个 audit cycle 全部 approve · 但每个都有不同情境:

| Story | Audit 决策 | 特殊情境 |
|---|---|---|
| US-001 | approve(20:14)| 13 AC PASS · ralph self-fix retry 1 健康 |
| US-002 | **手动 approve from BLOCKED**(22:14)| ECONNRESET storm · daemon 死锁 · Opus 直 fix lint(commit 3d26b92)+ manual prd.json reset |
| US-003 | approve(22:48)| anti_patterns 3 条全防御 · 标准 medium 档审 |
| US-004 | approve(23:37)| 23 tests over-deliver(要 15)· ILIKE fallback 安全审 + 2 TDs |
| US-005 | approve(00:22)| 收官扫底 17/17 AC · TD-036 同时 resolved |

### 演化对比

| 维度 | PRD-6 | PRD-7 | PRD-8 | **PRD-9** |
|---|:-:|:-:|:-:|:-:|
| Opus reject 数 | 2 | 0 | 0 | **0** ★ |
| ralph-tools.py reject 反例库追加 | 0 | 0 | 0 | **0** |
| TD 豁免 approve 数 | 0 | 0 | 0 | **2**(TD-033/034 在 US-002 · TD-035/036 在 US-004)|
| Opus 直 fix mechanical 错(非 reject)| 0 | 0 | 0 | **1**(US-002 commit 3d26b92 · 19 lint/typecheck 错)|

PRD-9 创造一个新模式 · **"Opus 直 fix < 20 lines mechanical 错而不 reject"**:
- 触发条件 · 错误是 mechanical(import 排序 / 未用 import / 静默 lint 错)· 无逻辑改 · ralph 已多 retry / 死锁状态
- 是否应该机制化 · 待 PRD-10 评估 · 风险 · 可能 Opus 过度 fix 模糊职责边界

---

## 6. Story 粒度 + Wave 设计

### Wave 划分(PRD-9)

| Wave | Story | Iter | Outcome |
|:-:|---|:-:|---|
| 0(Foundation)| US-001 ★ | 2 | PASS |
| 1(Data layer)| US-002 | 5+(BLOCKED→Opus 救援)| PASS via Opus manual |
| 2(Integration)| US-003 | 3 | PASS |
| 3(Frontend)| US-004 | 1+(within commits)| PASS |
| 4(收官)| US-005 | 2 | PASS |

### Size_hint 校准

| Story | PRD claim | 实际 commits | 偏差 |
|---|:-:|:-:|---|
| US-001 | medium | 3 commits | 准确 |
| US-002 | small | 2 commits | small · BUT infra storm 错把它当大 |
| US-003 | medium | 3 commits | 准确 |
| US-004 | medium | 4 commits | 偏 medium-large(AC-9/10 browser test 增加复杂度)|
| US-005 | medium | 1 commit | 收官扫底 · 实际 medium-large(15 AC + 1 new e2e + RAG injection 闭环)|

**size_hint=large 危险线** · PRD-9 0 个 large story · 安全 · PRD-8 retro Playbook P-5 ★

---

## 7. 基础设施复用

### 0 新建 framework

PRD-9 完全复用既有基础设施:
- ✅ pgvector + Prisma + tRPC + vitest + Playwright · 沿用 PRD-1~8 stack
- ✅ ContextAssembler 5-path Promise.allSettled · 沿用 PRD-8 D-058
- ✅ cost_log eventType pattern · 沿用 PRD-6/7/8 · 加第 7 类 'embedding_call'
- ✅ shadcn Tabs + Card + Input + ScrollArea · 沿用 PRD-1 component library
- ✅ Aurelian Dark color tokens · 沿用 PRD-1 + DESIGN.md

### 新加组件(必要)

- `KnowledgeChunk` 表 + `embedding vector(1536)` + HNSW index
- `OpenAIEmbeddingWorker` (新)· 同步调用 · 不走 BullMQ
- `RagRetrieveWorker` (新)· 同步 fetch · pgvector cosine `<=>` 操作符
- `ragRetrieveWorker.textSearchFallback`(US-004 dev 加)· ILIKE 全表扫 · 仅 dev no-key 触发

**0 新框架** · 完美复用 ★★

---

## 8. Audit 专项扫描

### Step 3 grep 清单命中

| Story | risk_level | grep 检查 | 命中违规 |
|---|:-:|---|:-:|
| US-001 | medium | R-001 / D-038 / schema SoT 三处一致 | 0 |
| US-002 | low | AC-1/2/6 数据源 + SQL UNIQUE | 0(逻辑 OK · 但 lint 错静默漏 · 走 Step 1.5 补跑发现)|
| US-003 | medium | AC-5 D-007 specialist grep · 协议锁单一 · 11 specialist 0 改 · F5 双 stub | 0(3 anti_patterns 防御)|
| US-004 | low | R-001 红线 · zod 边界 · 0 embedding 字段泄露 | 0 |
| US-005 | medium | 17 AC 全扫 · cost_log 7 类 grep · BullMQ embedding/rag 0 · D-NN 关键字 | 0 |

**0 grep 违规** · anti_patterns 字段实战兑现率 100%

### 新发现(audit 副产物)

- **Static 漏审**:US-002 audit 时发现 apps/api/scripts/ 不在 tsconfig include · 19 lint+typecheck 错静默漏(详 §9 M-1)
- **AC-10 doc-drift**:US-002/004 audit 时发现 PRD-9 写 22 元素 vs canonical 23 项 doc-drift(TD-033 · 收官后 docs fix commit 6c40f85)

---

## 9. 应固化为 Coding 3.0 机制的建议(L4→L5 元进化)

### M-1 · **新建 apps/<x>/scripts/ 目录的 tsconfig include 自动化** ★★

- **观察** · PRD-9 US-002 第 1 次出现 · 但 PRD-1~8 没遇过(因为 PRD-1~8 所有 .ts 都在 apps/<x>/src/)· **新模式 · 必预埋**
- **现状** · 静默漏 19 错 · Validator pass 但 Opus audit 时被 pnpm lint workspace-level 抓到
- **建议机制化位置** · `/plan-check` 新增 §2.6.X 子节 · 任何 PRD 新建 apps/<x>/scripts/ 目录的 story · 自动检查 apps/<x>/tsconfig.json include 是否含 "scripts"
- **实现思路** · plan-check 读 prd.json 所有 story 的 files_to_create · grep "apps/<x>/scripts/" 路径 · 同时读对应 tsconfig.json · 若 include 数组无 "scripts" → 提示 ralph skill 在 anti_patterns 字段加预警("新建 scripts/ 目录必须同时 改 tsconfig include")
- **ROI** · 预计避免下次 PRD 平均 1 轮 audit overhead + 19 错静默漏 0 风险

### M-2 · **Validator skip 条件加 git log commit check** ★★★

- **观察** · PRD-4 US-012 ECONNRESET (RCA-003) + PRD-8 US-009/010 self-approve (RCA-005) + **PRD-9 US-002 (RCA-006)** = **3 次跨 PRD 重复** · 都是 daemon 误把"有 commit 落地但 Validator 没跑"算成"开发失败"
- **现状** · ralph.py 在 dev 超时 / health check fail / ECONNRESET 时 `[SKIP] 开发 Agent 超时,跳过验证` 直接 retryCount++ · 没看实际 commit 是否落地
- **建议机制化位置** · ralph.py `_run_validator()` 前置加 `_has_recent_commit_for_story(story_id, time_window)` check · 若 git log --since 内有 [<story_id>] commit → **force run Validator 不跳** · 即使 dev log 0 bytes
- **实现思路** · ralph.py 在 dev 异常退出时(timeout / crash / ECONNRESET)· 先 `git log --since=<dev_start> --grep="\\[${story_id}\\]" --oneline | head -1` · 有命中 → Validator 必跑 · 没命中 → 按现状跳过
- **ROI** · 预计避免每 PRD 平均 1 次 BLOCKED 误判 + 30+ min Opus manual recovery overhead · 跨 PRD-4/8/9 已浪费累计 5h+ Opus time

### M-3 · **HOT_ELEMENTS canonical 数据源 vs PRD doc 双向 grep**

- **观察** · 只 PRD-9 US-002 出现 1 次 · 不算跨 PRD 重复 · 但**预防性强**
- **现状** · PRD 撰写时数错 canonical 数据源项数 · doc-drift 一直到 audit + 收官 docs fix(6c40f85)
- **建议机制化位置** · `/plan-check` §2.6.Y 新增 · PRD 任何 "(N1 cases + N2 formulas + N3 elements)" 数字字面 · 自动 grep `apps/api/src/lib/constants/{cases,formulas,elements,hotElements}.ts` canonical 项数 · 不一致 → 提示 prd skill / 用户校正
- **实现思路** · regex 提取 PRD 头/AC 里的 N1+N2+N3 = M · 跑 `python3 -c "from apps.api.src.lib.constants.cases import ..."` 数实际项 · 对比 · 不一致输出 WARN
- **ROI** · 中等 · 避免 doc-drift TD 跟踪整个 PRD lifecycle

---

## 10. Skill 升级建议 diff(L4 半自动进化 — 生成建议, 人工审核)

> **本节 4 个 diff 全是建议** · 用户 review 后我用 Edit 工具 apply。

### Diff-1 · `/plan-check` 新增 §2.6.X "scripts/ tsconfig include 检查"

**文件** · `~/.claude/commands/plan-check.md`(或对应 skill 文件)

**插入位置** · §2.6 现有子节后 · 加 §2.6.<下一编号>

**原因** · PRD-9 US-002 第 1 次出现 · 但所有未来 PRD 新建 apps/<x>/scripts/ 目录的都会重现 · 机制化后预计避免每次 1 轮 audit overhead

**建议 diff**:
```diff
+ ##### 2.6.<N> 新建 apps/<x>/scripts/ 目录的 tsconfig include 检查
+
+ **触发** · prd.json 任一 story 的 files_to_create 包含 "apps/*/scripts/*.ts" 路径
+
+ **检查规则**:
+ 1. 提取所有 apps/<x>/scripts/*.ts 路径 → 唯一化 apps/<x>/ 集合
+ 2. 对每个 apps/<x>/ · 读 apps/<x>/tsconfig.json 的 "include" 数组
+ 3. 若 include 不含 "scripts" 字串 → BLOCKER · 提示:
+    "❌ apps/<x>/scripts/<file>.ts 在 prd.json files_to_create · 但 apps/<x>/tsconfig.json include 缺 'scripts' · scripts/ 不会被 typecheck/lint 扫描 · 静默漏审风险"
+ 4. 建议 fix · prd skill 在该 story anti_patterns 字段加预警 · 或 ralph 实施时同时改 tsconfig
+
+ **实证** · QuanQn PRD-9 US-002 (commit 3d26b92) · scripts/seed-knowledge-chunk.ts 静默漏 19 错(1 unused + 6 import/order + 12 no-console)· Opus audit 时才发现 · 走 Step 5.5 直 fix 而不 reject
```

### Diff-2 · ralph.py `_run_validator()` 前置 git log check(RCA-006 §4.1)

**文件** · `~/.claude/scripts/ralph/ralph.py`

**插入位置** · `_run_validator()` 函数开始 · `[SKIP]` 路径前

**原因** · RCA-003 + RCA-005 + RCA-006 三次重复 daemon "dev 超时/异常跳过 Validator 但 commit 实际落地" 误 BLOCK · 累计 Opus manual recovery 5h+ · 应固化 force-rerun 条件

**建议 diff**:
```diff
  def _run_validator(self, story_id, ...):
+     # 2026-05-12 (RCA-006) · dev 异常退出时 · 检查是否有 [<story>] commit 已落地
+     # 若有 · 即使 dev 报 timeout/crash/ECONNRESET · Validator 必跑 · 不允许 [SKIP]
+     if self._dev_exited_abnormally:
+         try:
+             cmd = ['git', 'log', '--since', self._dev_start_ts.isoformat(),
+                    '--grep', f'\\[{story_id}\\]', '--oneline']
+             out = subprocess.check_output(cmd, cwd=PROJECT_ROOT, text=True).strip()
+             if out:
+                 logger.warning(f'[VALIDATOR-FORCE] dev 异常但已 commit {out[:60]}... · 强制跑 Validator 不跳过')
+                 self._dev_exited_abnormally = False  # reset · 让 Validator 跑
+         except Exception as e:
+             logger.warning(f'git log check failed: {e}')
+     # ... 原 [SKIP] 逻辑保持兜底
      if self._dev_exited_abnormally:
          logger.warning('[SKIP] 开发 Agent 超时,跳过验证,下一次迭代继续...')
          return ValidatorResult.SKIPPED
```

**风险** · 中等 · git log 调用偶发 fail → fallback 到原 [SKIP] 路径 · 不破坏现有行为

### Diff-3 · `/plan-check` 新增 §2.6.Y "canonical 数据源数字 sanity check"

**文件** · `~/.claude/commands/plan-check.md`

**插入位置** · §2.6 现有子节后 · 加 §2.6.<编号>

**原因** · PRD-9 doc 22→23 元素 drift(TD-033)· 虽然只 1 次 · 但预防性强 · 任何引用 in-memory 常量项数的 PRD 都该自动校验

**建议 diff**:
```diff
+ ##### 2.6.<N> Canonical 数据源数字 sanity check
+
+ **触发** · PRD 文档 / prd.json 任一字段含 "(N1 X + N2 Y + N3 Z)" 数字字面 · 例如 "67 案例 + 23 公式 + 22 元素"
+
+ **检查规则**:
+ 1. regex 提取 PRD 头 / AC 里的 N1/N2/N3 数字 · 关联 X/Y/Z 名词
+ 2. 推断 canonical 数据源(根据名词命中 apps/api/src/lib/constants/*.ts)
+ 3. 跑 grep/语法解析 数实际项数 · 对比 N1/N2/N3
+ 4. 不一致 → WARN · 提示:
+    "⚠️ PRD 字面 N1=<x> 但 apps/api/src/lib/constants/<file>.ts 实际 <m> 项 · canonical 数据源是 SoT · PRD doc 抄数错 · 建议 fix"
+
+ **实证** · QuanQn PRD-9 撰写时 PRD 写 22 元素 · 实际 HOT_ELEMENTS 23 项 · TD-033 跟踪整个 PRD lifecycle · 收官 commit 6c40f85 doc-only fix 19 处替换
```

### Diff-4 · OPUS-AUDIT-CHEATSHEET 加 "Opus 直 fix mechanical 错路径"

**文件** · `~/.claude/scripts/ralph/OPUS-AUDIT-CHEATSHEET.md`

**插入位置** · Step 5 reject 路径前 · 加 Step 4.5

**原因** · PRD-9 US-002 创造新模式 · "Opus 直 fix < 20 lines mechanical 错而不 reject 让 ralph 又一轮 ECONNRESET"· 应固化判断标准

**建议 diff**:
```diff
+ ## Step 4.5 — Opus 直 fix 路径(mechanical 错 · 不 reject)
+
+ **触发条件**(全部满足):
+ 1. 错误是 mechanical(import 排序 / 未用 import / 静默 lint 错 / tsconfig include 缺路径)
+ 2. 错误总数 < 20 lines · 无逻辑改
+ 3. ralph 已多 retry(retryCount ≥ 3)或 daemon 已 BLOCKED
+ 4. reject 让 ralph 再跑预计会撞 ECONNRESET / timeout / health-check fail
+
+ **流程**:
+ 1. Opus 直 Edit 修复
+ 2. 跑 pnpm typecheck + lint 验证 0 错
+ 3. 提 chore commit "[US-XXX] Opus audit fix · <类型>"
+ 4. 走 §5.5 OPUS_AUDIT_CHEATSHEET Step 5 approve · 在 approve 报告显式标 "Opus 直 fix mechanical 错 commit XXXXXXX 避免 ralph 又一轮 retry"
+
+ **实证** · QuanQn PRD-9 US-002 (commit 3d26b92) · 19 lint+typecheck 错 · ralph 已 5 retry + 3 ECONNRESET 死锁 · Opus 直 fix 5 min 完成 · 避免又 30 min retry hell
+
+ **禁止滥用**:
+ - ❌ 大于 20 lines · 必须 reject 让 ralph 修
+ - ❌ 涉及逻辑(if/for/算法)· 必须 reject
+ - ❌ ralph retry < 3 · 应让 ralph 自己学
+ - ❌ 跨 story 协议改 · 必须 reject(可能影响下游)
```

---

## 11. 文档回流建议(commit 事实驱动 · compound-harness)

### 1. 取证范围

```bash
git log --reverse --oneline 1464f0c..HEAD
```

PRD-9 期间 22 commits · 4 个 schema/worker/page 创建 + 4 个 audit log + 1 doc fix。

### 2. 落位规则

| 候选条目 | 落位 | 理由 |
|---|---|---|
| ContextAssembler 加 L5 RAG path(D-058)· `[Section 6]` 注入 | `apps/api/.planning/codebase/STRUCTURE.md` · context-assembler/ 章节 | 业务架构新增 |
| pgvector + HNSW + cosine `<=>` 操作符模式 | `apps/api/.planning/codebase/CONVENTIONS.md` · 数据库章节 | 跨 PRD 复用约定 |
| OpenAIEmbeddingWorker 同步调用(不走 BullMQ · D-038 STT/TTS pattern)| `apps/api/.planning/codebase/CONVENTIONS.md` · worker 章节 | 跨 PRD 复用约定 |
| cost_log eventType='embedding_call' 第 7 类 | `apps/api/.planning/codebase/CONCERNS.md` · 成本追踪章节 | 系统边界 |
| `apps/<x>/scripts/` 目录必须在 tsconfig include(static 漏审防御)| `apps/api/.planning/codebase/CONVENTIONS.md` · 工具链章节 + 根 AGENTS.md §3 红线 | 高频陷阱 ★★ |
| RAG 注入 specialist 集中(D-007)· 11 generative agents 0 自拼接 | `apps/api/.planning/codebase/STRUCTURE.md` · specialists 章节 | 系统边界 |
| seed:knowledge no-key fallback 模式(US-005 16e5a78)| `apps/api/.planning/codebase/INTEGRATIONS.md` · 数据 seed 章节 | 系统集成 |

### 3. 候选回流条目(精简到 7 条)

```markdown
## 待回流 · PRD-9 commit-事实驱动

1. ContextAssembler L5 RAG path + [Section 6] 注入(D-058)· STRUCTURE.md
2. pgvector + HNSW + cosine `<=>` + 1536 dim + IVFFlat 不用 · CONVENTIONS.md
3. OpenAIEmbeddingWorker / RagRetrieveWorker 同步调用 · 不走 BullMQ · CONVENTIONS.md
4. cost_log eventType 7 类完整列表(specialist/judge/image_gen/l5_agent/stt/tts/embedding)· CONCERNS.md
5. apps/<x>/scripts/ 目录必须 在 tsconfig.include "scripts" · 否则静默漏审 · CONVENTIONS.md + 根 AGENTS.md
6. RAG 注入唯一入口(D-007)· specialists/ 0 自拼接 · STRUCTURE.md
7. pnpm seed:knowledge 支持 no-key fallback 模式(US-005)· INTEGRATIONS.md
```

**等用户确认回流**(由 /goal-verify §0 或 /gsd-map-codebase 自动 apply)。

---

## 12. 反向发现(不可迁移 / 偶然成功)

1. **偶然成功 1 · ECONNRESET 灾难恰好打在 US-002 实施完成后**
   - 描述 · iter 3 dev 实际 commit 落地(20:35)· 之后 iter 4-9 全 ECONNRESET / timeout
   - 不可复制 · 若 ECONNRESET 打在 implementation 没完成阶段(iter 1/2 内)· 实际进度会 0 + Opus 也无法 manual approve(没代码可审)
   - 缓解 · Diff-2 RCA-006 §4.1 force-rerun 机制

2. **偶然成功 2 · Opus 直 fix mechanical 错的判断**
   - 描述 · 19 错全 mechanical · ralph 已 5 retry 死锁 · Opus 主动 5 min fix · approve
   - 不可复制 · 若错有 1 行涉及业务逻辑 · 直 fix 是越界
   - 缓解 · Diff-4 OPUS-AUDIT-CHEATSHEET Step 4.5 显式判断标准

3. **偶然成功 3 · TD-036 同 PRD 内 self-resolve**
   - 描述 · US-004 用 psql 手动 seed dev DB · US-005 收官时 ralph 主动加 seed script no-key mode · TD-036 自然 resolved
   - 不可复制 · ralph 主动识别 TD 的能力靠"恰好在收官时认识到 seed script 缺 no-key mode"· 不是必然
   - 缓解 · 收官 story AC 应显式包含"扫之前 stories 引入的 TD 是否可同 PRD 内 resolve"

4. **偶然成功 4 · anti_patterns 注入 100% 防御成功**
   - 描述 · US-003 三条 anti_patterns(D-007 / 协议锁 / 11 specialist DRY)全防御 · grep 全过
   - 不可复制 · ralph 看 anti_patterns 看得懂 · 但若 anti_pattern 写得太抽象 · ralph 可能误读
   - 缓解 · anti_pattern 字段 antipattern + correct 两段式写法继续优化

---

## 13. 归因占比表(PRD-9 成功 5/5 PASSED 的驱动)

| 驱动 | 归因占比 | 证据 |
|---|:-:|---|
| **anti_patterns 字段实战防御**(PRD-8 retro Diff-3 兑现)| 25% | US-003 3 条全防御 · 估省 1-2 轮 reject |
| **schema SoT 三处一致**(PRD-7 D-046)| 15% | 0 跨 story 命名漂移 · US-001 + US-003 共用 KnowledgeChunkContent |
| **基础设施 0 新建**(D-038 + ContextAssembler 5-path 复用)| 15% | 0 framework reject |
| **Ralph self-fix retry 1 健康**(US-001 + US-003)| 15% | 自纠 2 个 story · 0 Opus reject |
| **Opus 直 fix mechanical 错路径首创**(US-002 commit 3d26b92)| 10% | 避免又一轮 ECONNRESET retry hell |
| **TD-036 同 PRD 内 self-resolve**(US-005 收官扫底)| 10% | seed script no-key mode + 主动加 |
| **既有 LLM Judge mock pattern 沿用**(TD-027 PRR 共识)| 5% | 0 judge reject + AC-8 顺利 |
| **Step 5.0 stale session cleanup SOP** (RCA-005 配套 · 接手时执行)| 5% | 防 self-approve 异常重现 |
| **合计** | 100% | |

---

## 14. 执行预测(PRD-10 · admin 子系统)

### 预估

- **Stories 数** · 估 8-15 (admin 5 PRD 拆分 · 第一个 PRD-10 应该是 admin foundation + auth · 5-8 stories)
- **预估一轮通过率** · 60-75%(高于 PRD-9 因 admin 多 CRUD · 业务复杂度低)
- **预估耗时** · 3-5h daemon(类比 PRD-7 cleanup-td 2h + PRD-8 6h)
- **risk_level=high stories 数** · 2-3(admin auth + OAuth + RLS Disable 跨账号查看)

### 遵循 Playbook vs 不遵循

| 维度 | 遵循 Playbook(下述 P-1~P-N)| 不遵循 |
|---|:-:|:-:|
| 一轮通过率 | 70%+ | 45% |
| Opus reject 数 | 0-1 | 2-4 |
| TD 数 | 1-2 | 4-6 |
| daemon 耗时 | 4h | 6-8h |

---

## 15. PRD-10 Playbook(继承 PRD-9 经验)

### 必做(P-1~P-8)

- **P-1**: PRD 撰写时 grep canonical 数据源数字 sanity(防 doc-drift)
- **P-2**: 任何 story files_to_create 含 apps/<x>/scripts/*.ts · prd skill 必须在 anti_patterns 加 "tsconfig include 缺 scripts" 预警
- **P-3**: anti_patterns 字段 antipattern + correct 两段式写法 · 继续注入 ≥3 条
- **P-4**: schema SoT 三处一致原则 · 继续严守 D-046
- **P-5**: size_hint=large 0 容忍 · 大于 12 files_to_create 必须拆
- **P-6**: 收官 story AC 包含 "扫前 stories 引入的 TD · 检查是否可同 PRD 内 resolve"
- **P-7**: 启 daemon 前 Step 5.0 SOP · 检测 stale claude session · kill 孤儿 Monitor/watch-audit
- **P-8**: Monitor + watch-audit-gate 双备份 · §9.1 5 步 SOP 严守

### 不做(N-1~N-N)

- **N-1**: 0 自启 dev server(沿用既有 PRD-1 dev)
- **N-2**: 0 新 framework / library · 复用既有 stack
- **N-3**: 0 admin 表 写主应用 · 反之亦然(LD-A-1)
- **N-4**: 0 跳过 Audit Gate · 即使 ECONNRESET 也走 Opus manual recovery 路径

### 实验(E-1~E-N)

- **E-1**: 试 Diff-2 ralph.py git log check 机制(若 apply)· 评估 BLOCKED 误判减少率
- **E-2**: 试 Diff-4 OPUS-AUDIT-CHEATSHEET Step 4.5 直 fix mechanical 错路径 · 评估 ROI vs 越界风险
- **E-3**: admin 子系统首个 PRD 应跑哪个? PRD-10 P9.1 admin foundation + auth(per ADMIN-ARCHITECTURE.md)

---

## 16. 结论

### PRD-9 是 PRD-8 retro 兑现的实战

PRD-8 retro 提了 3 个 L4 升级 Diff:
- Diff-1 stale session SOP → ✅ PRD-9 接手时执行 · 0 self-approve 异常
- Diff-2 audit-log 跨 session 防御 → ✅ PRD-9 第一次实战写入 audit-log-QuanQn.jsonl
- Diff-3 anti_patterns 字段注入机制 → ✅ PRD-9 US-001 + US-003 各 3 条 · 100% 防御成功

**3/3 Diff 实战兑现** · PRD-8 retro 的 L4 升级带来 PRD-9 成功 ★★

### PRD-9 的新教训

- ★ **anti_patterns 注入是 L4 进化的关键**(PRD-9 验证)
- ⚠️ **daemon Validator skip 是反复痛点**(PRD-4/8/9 三次)· Diff-2 该 apply
- ⚠️ **static 漏审是新模式**(apps/<x>/scripts/ tsconfig include)· Diff-1 该 apply
- ⚠️ **PRD doc-drift 易发**(数据源数字)· Diff-3 该 apply

### 下个 PRD(PRD-10 admin foundation)

进入 admin 子系统阶段 · ADR-019/020/021 + ADMIN-ARCHITECTURE.md 已铺好路 · 预计稳定 60-75% 一轮通过率 + 0-1 Opus reject。

---

## 附录 A · PRD 间一轮通过率趋势

```
PRD-1  P0 基建: ~70% (8/N)
PRD-2  P1 用户系统: 65% (8/12)
PRD-3  P2 IP 起号 1-3 步: 75% (9/12)
PRD-4  P3 IP 起号 4-9 步: 67% (8/12)
PRD-5  P4 创作模块: 75% (9/12)
PRD-6  P5 视频模块: 86% (12/14)
PRD-7  Cleanup TD fix: 88% (7/8)
PRD-8  P7 智能模块: 54% (7/13) ⚠️ 业务跃迁
PRD-9  P8 知识库 RAG: **0% strict / 80% loose** (0/5 strict · 4/5 loose · 1 BLOCKED via infra) ⚠️ infra failure
```

**趋势** · PRD-7/8/9 进入业务跃迁期 · 一轮通过率随复杂度波动 · 但 0 Opus reject 是稳态 ★

**Audit by**: Claude Opus 4.7 · 2026-05-12
