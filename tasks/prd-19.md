# PRD-19 · frontend ↔ backend 真接入(LS↔DB 双写桥接 · 11 step page 接 stepData router + 8 Specialist 真 LLM)

> **派生自** · [ARCHITECTURE.md §3 数据架构](../ARCHITECTURE.md) · [§4 Agent 编排](../ARCHITECTURE.md) · [§9.4 P2 路由 + 首页](../ARCHITECTURE.md) · [§9.5 P3 IP 主流程](../ARCHITECTURE.md) · [DATA-MODEL §3.4 LS 同步约定](../DATA-MODEL.md) · [DATA-MODEL §4 StepData](../DATA-MODEL.md) · [AGENTS §3 LD-009 + §11.11 PRD-18 沉淀](../AGENTS.md) · ADR-010(LS↔DB)+ ADR-011(LS 镜像)+ ADR-019(前后端边界)
> **风险等级** · high(PRD-15~18 严重 LD-009 违反纠错 · 11 page 批量改造 · Specialist 真 LLM call cost · 跨 page 命名一致性 risk)
> **依赖前置** · PRD-1/2 已 95% 实施 ✅(brownfield 实证)+ PRD-15~18 frontend 11 step page 已就位 ✅
> **PRD 间编号延续** · 继 PRD-18 D-175 后 · 新决策从 D-176 起

---

## 元数据(frontmatter)

```yaml
prd_id: PRD-19
phase: 跨 P0/P1/P2/P3(brownfield 落地 · 不分 Phase · 修补 PRD-15~18 frontend mock 到 backend 真接)
risk_level: high
depends_on: [PRD-1, PRD-2, PRD-15, PRD-16, PRD-17, PRD-18]
branch: ralph/prd-19-frontend-backend-bridge

# ownership
prd_author: prd skill (Opus)
prd_reviewer: Opus(主对话)
prd_executor: Ralph Agent (Sonnet · daemon)
prd_verifier: Opus + 用户

# 状态
status: 🟡 进行中
status_history:
  - 2026-05-18 01:00 · 🔵 → 🟡 · prd skill 启动(brownfield 实证 P0/P1 已 95% 实施 · scope 重定位为 frontend ↔ backend 真接入)
```

---

## §0 引用清单(单一真理来源 · 不复制大段)

| 知识源 | 单一真理来源 |
|---|---|
| 前后端边界 | [ARCHITECTURE.md §1.4b 前后端拆分](../ARCHITECTURE.md) · ADR-019 |
| 数据架构 | [ARCHITECTURE.md §3](../ARCHITECTURE.md) · 12 实体 + 18 LS keys + RAG/常量分明 |
| Agent 编排 | [ARCHITECTURE.md §4](../ARCHITECTURE.md) · 95% Workflow + 5% Agent · 14 能力域 Specialist |
| LS 同步约定 | [DATA-MODEL.md §3.4](../DATA-MODEL.md) · `aiip_active_account_id` + `aiip_memory_acc_${id}_*` 双写时机 |
| StepData schema | [DATA-MODEL.md §4](../DATA-MODEL.md) · prisma model + LS 镜像约定(ADR-011)+ 输入/输出 schema |
| 工程红线 | [AGENTS.md §3 LD-009](../AGENTS.md) · LocalStorage `aiip_memory_acc_` 强制 namespace |
| 跨 PRD 沉淀 | [AGENTS.md §11.10 PRD-17 + §11.11 PRD-18](../AGENTS.md) · 三态组件 + structured mockResult + EmptyState template literal 等 |
| PRD-15~18 历史 | [tasks/prd-15.md](./prd-15.md) · [tasks/prd-16.md](./prd-16.md) · [tasks/prd-17.md](./prd-17.md) · [tasks/prd-18.md](./prd-18.md) |
| 反例库 | `~/.claude/playbooks/reject-examples.jsonl`(49 条 · 自动注入 high+foundation US) |
| L4 升级实战 | plan-check §2.6.7-ext + §2.6.20 + §2.6.21 扩 + §2.6.22(PRD-18 retro Diff-1/2)|
| brownfield 实证 | apps/api/src/trpc/routers/stepData.ts(439 行 · 8 Specialist 全接)+ ipAccounts.ts(167 行)+ useStepData.ts(63 行)+ ls-namespace.ts(完整)+ StepForm.tsx(已用 stepLsKey + useStepData) |

> Ralph 在 PRD-19 的工作 · 在上述准备基础上 · 完成 9 个 US:
> 1. 不重建 stepData router(已完整 8 Specialist 接好 · brownfield 已实施)
> 2. 不重建 useStepData hook(已完整 LS↔DB 双写 · brownfield 已实施)
> 3. 不动 Specialist 真 LLM call 逻辑(brownfield 已实施 · 仅 frontend 接 result render)
> 4. **★ 改造重点** · 11 step page (Step1/3/3b/4/4b/5/6/7/8 · 跳 Step2/Step9 stub) 替换 hardcode `localStorage.setItem('acc_step{N}')` 为 `useStepData(accountId, 'step{N}')` · 接 `trpc.stepData.save` 真 mutation · 替换 mockResult 为真 Specialist result render
> 5. **★ 数据迁移** · 老 `acc_step{N}` LS 数据迁到新 `aiip_memory_acc_{accountId}_step{N}` 命名规范(用户首访问触发 · 一次性 migration)
> 6. **★ E2E + verify** · 跨 9 step 真后端 + acc 切换 + zero-regression

---

## §1 用户故事(US-001 ~ US-009)

### Wave 1 · 协议 + 铺路(2 US · 0 depends_on)

### US-001 · stepKey 命名规范化 + 老 LS 数据迁移 helper
- **As a** · QuanQn frontend 开发者 · 在 11 step page 接 useStepData 之前 · 需要统一 stepKey 命名 + 一次性迁移 PRD-15~18 老 LS 数据到 LD-009 namespace
- **I want** · 一个 `lib/migration/legacy-ls.ts` helper · 检测老 `acc_step{N}` keys → 读取数据 → 写到新 `stepLsKey(accountId, 'step{N}')` 命名 → 删除老 key
- **So that** · 用户从 PRD-18 升级到 PRD-19 时 0 数据丢失 + 跨账号隔离立即生效(LD-009 严守)
- **risk_level** · foundation(被 US-002~009 全部 depends_on · 任何 bug 升级 high)
- **size_hint** · small
- **files_to_create** · `apps/web/src/lib/migration/legacy-ls.ts` · `apps/web/src/lib/migration/__tests__/legacy-ls.test.ts`
- **files_to_modify** · `apps/web/src/App.tsx`(或 main.tsx · 启动时 1 次调 migrateLegacyLs)
- **test_command** · `cd apps/web && pnpm vitest src/lib/migration/legacy-ls.test.ts`
- **anti_patterns** · 由 prd skill 注入(关键词:LS migration / data loss / acc_namespace / cross-account)

### US-002 · useStepData hook 增强 + 跨 step 预填 helper readStepData
- **As a** · QuanQn 11 step page · 需要在 form mount 时读上游 step 数据(如 Step3 读 acc_step1.industry · Step6 读 acc_step7.body.text)
- **I want** · `useStepData(accountId, stepKey)` 暴露 `load()` 同时新增 `readOtherStep(otherStepKey)` 静态 helper · 直接读 LS 兜底 + DB 预读用 useQuery hook
- **So that** · 跨 step 数据流统一 · 0 hardcode `localStorage.getItem('acc_step{N}')` 跨 page 散落
- **risk_level** · foundation(被 US-003~007 page 全部 depends_on)
- **size_hint** · small
- **files_to_modify** · `apps/web/src/hooks/useStepData.ts`(加 readOtherStep + useQuery 包装)· `apps/web/src/hooks/__tests__/useStepData.test.tsx`
- **anti_patterns** · 由 prd skill 注入(关键词:跨 step 数据 / localStorage hardcode / cache invalidate)

### Wave 2 · step page 真接(5 US · depends_on Wave 1)

### US-003 · Step1 + Step3 + Step3b 真接 stepData router(industry + IP 定位 + 人设)
- **As a** · QuanQn 用户 · 在 Step1 选行业 / Step3 填 IP 定位 / Step3b 填人设
- **I want** · form 提交后 trpc.stepData.save 真接 PositioningAgent(industry mode)+ BrandingAgent(packaging / persona mode)· result 真 LLM 输出(或 fallback mock 若无 OPENAI_KEY)· UI 用 LoadingState + ErrorState 复用
- **So that** · PRD-17 实施的 3 step page 从 frontend mock 升级到 backend 真接 · 跨账号数据隔离生效
- **risk_level** · high(3 page 同步改 · Specialist 真 call cost · LLM error handling)
- **size_hint** · medium-large
- **depends_on** · [US-001, US-002]
- **files_to_modify** · `apps/web/src/pages/step/Step1.tsx` · `Step3.tsx` · `Step3b.tsx` · 各 page 用 useStepData + trpc.stepData.save · 替换 mockResult + setTimeout 为真 mutation
- **anti_patterns** · 由 prd skill 注入(关键词:trpc mutation / loading state / error state / Specialist fallback / LLM cost / 跨 step 预填)

### US-004 · Step4 + Step4b 真接(执行计划 + 变现规划)
- **As a** · QuanQn 用户 · 在 Step4 填粉丝/目标/情况 / Step4b 填产品/受众/IP 定位/收入水平
- **I want** · form 提交 → trpc.stepData.save 接 PositioningAgent(execution mode)/ MonetizationAgent · result 真 LLM(或 fallback)
- **So that** · PRD-18 实施的 Step4/4b 真接后端 · 3 H3 输出 + 3 阶梯 + 收入结构 + 案例 真 Specialist 输出
- **risk_level** · high(2 page 同步改 · Step4b 数据复杂 · 3 阶梯 + 收入 + 案例)
- **size_hint** · medium-large
- **depends_on** · [US-001, US-002]
- **files_to_modify** · `apps/web/src/pages/step/Step4.tsx` · `Step4b.tsx` · `apps/web/src/components/step4b/Step4bOutputContent.tsx`
- **anti_patterns** · 由 prd skill 注入(关键词:trpc mutation / Specialist 真 call / 跨 step 预填)

### US-005 · Step5 真接 saveStream SSE(TopicAgent 5 类爆款选题 · 22KB+ 长输出)
- **As a** · QuanQn 用户 · 在 Step5 填行业/产品 + 上传 file metadata stub
- **I want** · 5 类 Tab(traffic/monetize/persona/cognition/case)切换时 · 每 Tab 各自 saveStream SSE 真接 TopicAgent · 进度 UI(已生成 X / 5 类)· first chunk < 3s
- **So that** · 100 选题真 LLM 输出(20/Tab × 5)· LD-170 file upload 仍 stub 不真传(metadata only)
- **risk_level** · high(SSE subscription · React Suspense / useSubscription · 5 Tab 各自 stream)
- **size_hint** · large(SSE 是新模式 · 不在 PRD-15~18 范围)
- **depends_on** · [US-001, US-002]
- **files_to_modify** · `apps/web/src/pages/step/Step5.tsx` · `apps/web/src/components/step5/Step5FileUpload.tsx`(保 stub · 不动)· `Step5TopicGrid.tsx`(替换 mock 为真 SSE result)
- **anti_patterns** · 由 prd skill 注入(关键词:SSE / saveStream / useSubscription / first chunk / 真上传)

### US-006 · Step6 + Step7 真接(拍摄 + 文案)
- **As a** · QuanQn 用户 · 在 Step6 填 textarea ≥10 字 / Step7 填主题 + 22 元素多选
- **I want** · form 提交 → trpc.stepData.save 接 VideoAgent(shooting mode)/ CopywritingAgent(step7 mode)· 输出 8 列分镜表 + 4 H4 辩论模板
- **So that** · PRD-18 实施的 Step6/7 真接后端 + History 表自动写入(CopywritingAgent 已实施 history.create)
- **risk_level** · high(2 page · Step7 22 元素多选复杂)
- **size_hint** · medium-large
- **depends_on** · [US-001, US-002]
- **files_to_modify** · `apps/web/src/pages/step/Step6.tsx` · `Step7.tsx` · `apps/web/src/components/step7/Step7OutputContent.tsx`
- **anti_patterns** · 由 prd skill 注入(关键词:trpc mutation / 22 元素 Set / CopywritingAgent / history 自动写)

### US-007 · Step8 真接(直播策划 · 2 子功能 generate_plan + optimize_script)
- **As a** · QuanQn 用户 · 在 Step8 切换 2 子功能 · 各自独立 form 提交
- **I want** · form 提交 → trpc.stepData.save 接 LivestreamAgent · result 真 LLM 输出 6 模块 / 2 InfoCard · sub_function discriminator 隔离防交叉污染
- **So that** · PRD-18 实施的 Step8 真接后端 + 2 子功能各自独立调用 LivestreamAgent · TD-77 一并 fix(InfoCard label 常量化)
- **risk_level** · high(2 子功能 discriminator + LivestreamAgent userInput 复杂 enum)
- **size_hint** · medium
- **depends_on** · [US-001, US-002]
- **files_to_modify** · `apps/web/src/pages/step/Step8.tsx` · `apps/web/src/components/step8/Step8GeneratePlan.tsx` · `Step8OptimizeScript.tsx`
- **anti_patterns** · 由 prd skill 注入(关键词:trpc mutation / discriminator / LivestreamAgent / InfoCard label 常量化)

### Wave 3 · 收官(2 US)

### US-008 · 跨 9 step E2E + acc 切换数据隔离 + zero-regression
- **As a** · QuanQn 用户 · 执行完整 9 step 流程(Step1 → Step3 → Step3b → Step4 → Step4b → Step5 → Step6 → Step7 → Step8)
- **I want** · playwright e2e/prd-19-frontend-backend.spec.ts 覆盖 ·
  - 真后端启动(`pnpm dev:api` + `pnpm dev:web` 同时跑 · port 5173 / 3000)
  - 9 step 数据真存 DB(每 step 跑 `await prisma.stepData.findFirst({ where: { stepKey, accountId } })` 验证)
  - acc 切换前后 step1 industry 隔离(account A industry=美食 vs account B industry=美妆 · 互不见)
  - 真 Specialist call 验证(若 OPENAI_KEY 在 .env · 真 LLM · 否则 fallback mock · status='fallback')
  - 119+ 旧 tests zero-regression(vitest 全 PASS · tsc 0 error)
- **So that** · PRD-19 真接入闭环验证 · 数据不丢失 · 跨账号隔离生效
- **risk_level** · high(真后端 + 真 DB + 真 LLM)
- **size_hint** · large(E2E 跨 9 page · 真后端 stack 启动)
- **depends_on** · [US-003, US-004, US-005, US-006, US-007]
- **files_to_create** · `apps/web/e2e/prd-19-frontend-backend.spec.ts`
- **anti_patterns** · 由 prd skill 注入(关键词:e2e / 真后端 / 真 LLM / fallback / acc 切换 / zero-regression)

### US-009 · verify-prd-19.sh 35+ 检查项 + maintenance fix TD-76/77
- **As a** · QuanQn 维护者 · 需要重复执行的脚本验证 PRD-19 全部交付物
- **I want** · `scripts/verify-prd-19.sh` 35+ 检查项 ·
  - §1 11 page 0 hardcode `localStorage.setItem('acc_step{N}')`(LD-009 严守)
  - §2 11 page 全 import useStepData + 用 trpc.stepData.save
  - §3 0 `acc_step{N}` 字面在 page 文件(allow 在 migration helper 转 stepLsKey 时引用)
  - §4 grep `aiip_memory_acc_` 在 ls-namespace.ts + useStepData.ts + StepForm.tsx + 至少 1 测试文件
  - §5 trpc.stepData.save 真 mutation 命中 11 page
  - §6 zero-regression(vitest 119+ tests PASS · tsc 0 error · playwright e2e/prd-{15-19}-*.spec.ts 全 PASS)
  - §7 TD-76 fix · step7.ts 新增 STEP7_LABEL_SCRIPT_TYPE export · Step7.tsx 用常量
  - §8 TD-77 fix · step8.ts 新增 STEP8_OPTIMIZE_OUTPUT_LABELS_2 export · Step8OptimizeScript.tsx 用常量 map
  - §9 D4=B 严守 · grep `from-(violet|amber|gold|purple)` 0 命中(继承 PRD-16/17/18)
  - §10 D3=A 严守 · git diff PRD-19 branch 范围 · apps/admin / packages/(除 clients/router-types)0 触动
- **So that** · PRD-19 收官有客观证据 · 防 audit 漏 catch
- **risk_level** · medium(纯 grep + test 跑 · 但 35+ 检查复杂)
- **size_hint** · medium
- **depends_on** · [US-008]
- **files_to_create** · `scripts/verify-prd-19.sh`(chmod +x)
- **files_to_modify** · `apps/web/src/lib/constants/step7.ts`(加 STEP7_LABEL_SCRIPT_TYPE)· `step8.ts`(加 STEP8_OPTIMIZE_OUTPUT_LABELS_2)· `Step7.tsx`(用常量)· `Step8OptimizeScript.tsx`(用常量 map)
- **anti_patterns** · 由 prd skill 注入(关键词:verify script / grep / zero-regression / TD fix / 常量化)

---

## §2 验收标准(AC · ★ 4 类必含)

### AC-001-H(US-001 happy · migrateLegacyLs 一次性迁移)

```typescript
// apps/web/src/lib/migration/legacy-ls.ts

import { stepLsKey, LS_PREFIX } from '@/lib/ls-namespace';

const LEGACY_KEYS = [
  'acc_step1', 'acc_step3', 'acc_step3b', 'acc_step4', 'acc_step4b',
  'acc_step5', 'acc_step5_selected_topic', 'acc_step6', 'acc_step7', 'acc_step8',
] as const;

const MIGRATION_FLAG_KEY = 'aiip_legacy_migration_v1_done';

/**
 * 一次性迁移老 `acc_step{N}` LS 数据到新 `aiip_memory_acc_{accountId}_{stepKey}` 规范
 * 触发 · App.tsx mount 时 1 次调用 · 用 MIGRATION_FLAG_KEY 防重复跑
 * 注意 · acc_step5_selected_topic 跨 step 数据 · 单独处理 · 迁到 aiip_memory_acc_{id}_selected_topic
 */
export function migrateLegacyLs(store: Storage, accountId: number): { migrated: number; skipped: number } {
  if (store.getItem(MIGRATION_FLAG_KEY) === '1') {
    return { migrated: 0, skipped: LEGACY_KEYS.length };
  }
  let migrated = 0;
  for (const legacyKey of LEGACY_KEYS) {
    const raw = store.getItem(legacyKey);
    if (raw === null) continue;
    // 跨 step 特殊 key
    const newKey = legacyKey === 'acc_step5_selected_topic'
      ? `${LS_PREFIX}_${accountId}_selected_topic`
      : stepLsKey(accountId, legacyKey.replace('acc_', ''));
    // 新 key 已存在(不覆盖)
    if (store.getItem(newKey) !== null) {
      store.removeItem(legacyKey);
      continue;
    }
    store.setItem(newKey, raw);
    store.removeItem(legacyKey);
    migrated += 1;
  }
  store.setItem(MIGRATION_FLAG_KEY, '1');
  return { migrated, skipped: LEGACY_KEYS.length - migrated };
}
```

### AC-001-E(US-001 error · 数据损坏 + LS quota 满 + 多账号同时)

- accountId === null 时不跑 · 直接 return { migrated: 0, skipped: 0 }
- store.setItem 抛 QuotaExceededError 时 · 跳过该 key + console.warn + continue · 不中断流程
- 同时多 tab 切换 accountId · 第二 tab MIGRATION_FLAG_KEY 已 '1' · 直接 skip · 不双跑

### AC-001-B(US-001 boundary)

- 0 legacy keys 存在 → 返回 { migrated: 0, skipped: 10 } · MIGRATION_FLAG_KEY 仍写 '1'
- 全 10 keys 都有数据 → migrated=10
- 部分 keys 已迁 + 部分 legacy 残留 → 仅迁 legacy 残留 · 不动已迁
- 新 key 已存在(不覆盖) → 删 legacy + 不动新

### AC-001-P(US-001 performance)

- 10 keys 迁移 < 50ms(LS read/write 同步操作 · 10 次 < 50ms)
- 启动时 1 次 call · 不影响首屏 FCP > 100ms

### AC-002-H(US-002 happy · useStepData 增强 readOtherStep)

```typescript
// apps/web/src/hooks/useStepData.ts(增强)

import { useQuery } from '@tanstack/react-query';

export function useStepData(accountId: number | null, stepKey: string) {
  // ... 原有 save / load / isSaving 保留 ...

  // 新增 · useQuery 包装 DB 读 + LS fallback
  const dbQuery = trpc.stepData.get.useQuery(
    { stepKey },
    {
      enabled: accountId !== null,
      staleTime: 30_000,
      retry: false,
    },
  );

  return { save, load, isSaving: saveStepData.isPending, dbQuery };
}

// 新增 · 跨 step 数据预填 helper(纯 LS 读 · 无需 hook)
export function readOtherStep<T = Record<string, unknown>>(
  accountId: number | null,
  otherStepKey: string,
): T | null {
  if (accountId === null) return null;
  const raw = localStorage.getItem(stepLsKey(accountId, otherStepKey));
  return raw ? (JSON.parse(raw) as T) : null;
}
```

### AC-002-E(US-002 error)

- accountId === null 时 readOtherStep 返回 null · 不抛
- JSON.parse 失败 → catch + console.warn + 返回 null
- DB query 失败时 dbQuery.error 真返回 · 不影响 LS load 兜底

### AC-002-B(US-002 boundary)

- otherStepKey 不存在 LS · 返回 null
- otherStepKey === stepKey · 允许(用例 · self-read 兜底)
- accountId 切换 · dbQuery 自动 refetch(useQuery key 含 stepKey)

### AC-002-P(US-002 performance)

- readOtherStep 同步 LS 读 < 1ms
- useQuery cache hit 时 0 网络请求

### AC-003-H(US-003 happy · Step1 真接 + LoadingState 复用)

```typescript
// apps/web/src/pages/step/Step1.tsx(改造)

import { useStepData } from '@/hooks/useStepData';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { LoadingState, ErrorState } from '@/components/states';

export default function Step1() {
  const { activeAccount } = useActiveAccount();
  const accountId = activeAccount?.id ?? null;
  const { save, dbQuery, isSaving } = useStepData(accountId, 'step1');

  const handleSubmit = (formData: { industry: string; industryLabel: string }) => {
    save(formData);  // LS first + tRPC mutation(stepData.save 自动接 PositioningAgent industry mode)
  };

  // LoadingState 复用(继承 PRD-17 §11.10.2)
  if (dbQuery.isLoading || isSaving) {
    return <LoadingState text={isSaving ? '正在分析行业 · 请稍候 ...' : '加载中 ...'} />;
  }

  // ErrorState 复用
  if (dbQuery.isError) {
    return <ErrorState message='加载行业数据失败' onRetry={() => dbQuery.refetch()} />;
  }

  // result 来自 stepData.get(PositioningAgent 已 wire 接 step1 = industry mode)
  const result = dbQuery.data?.result;

  return (
    <main>
      {/* form 渲染 ... */}
      {result && <Step1OutputContent result={result} />}
    </main>
  );
}
```

### AC-003-E(US-003 error)

- accountId === null(未登录)→ 重定向到 `/login` · 不渲染 form
- save 失败 · useStepData 内部 toast '已保存到本地 · 网络恢复后同步' · LS 不回滚
- Specialist fallback(无 OPENAI_KEY)→ result.isFallback === true · UI 显示 '【降级模式】' badge
- 网络断 · dbQuery.refetch 重试 · 用户可手动点 [重试]

### AC-003-B(US-003 boundary)

- industry='' · form disabled · 不允许 save
- industryLabel 不在 STEP1_INDUSTRIES_56 内 · save 仍允许(自定义行业 modal 走 LD-009 acc_step1.customIndustry)
- 跨账号切换 · dbQuery 自动 refetch · 显示新账号的 industry · LS 老账号数据保留

### AC-003-P(US-003 performance)

- form 提交 → LS write 完成 < 10ms(同步)
- tRPC mutation 完成 < 500ms(本地 DB)+ PositioningAgent LLM call < 5s(若真 LLM)/ < 100ms(若 fallback mock)
- LoadingState 首屏 < 100ms

### AC-004-H(US-004 happy · Step4 + Step4b 真接)

```typescript
// apps/web/src/pages/step/Step4.tsx(改造)
// 同 AC-003 模式 · useStepData(accountId, 'step4')
// + Step4b 同模式 · useStepData(accountId, 'step4b')
// 跨 step 预填 · readOtherStep(accountId, 'step1') 取 industry 显示副标
```

### AC-004-E(US-004 error · 同 AC-003-E)

### AC-004-B(US-004 boundary)

- Step4b 3 阶梯 schema 渲染来自 MonetizationAgent result.threeStages · 长度必须 === 3 · 否则 fallback mock
- Step4b 收入结构 simple progress bar(继承 LD-174 严守)· 0 import recharts

### AC-004-P(US-004 performance · 同 AC-003-P)

### AC-005-H(US-005 happy · Step5 SSE 真接)

```typescript
// apps/web/src/pages/step/Step5.tsx(改造)

import { trpc } from '@/lib/trpc';

const [activeCategory, setActiveCategory] = useState<'traffic' | 'monetize' | 'persona' | 'cognition' | 'case'>('traffic');

const subscription = trpc.stepData.saveStream.useSubscription(
  {
    stepKey: 'step5',
    category: activeCategory,
    inputs: { industry, product, files: fileMetadataStubs },
  },
  {
    enabled: hasSubmitted,
    onData(data) {
      if (data.type === 'started') setStreamStatus('生成中 ...');
      else if (data.type === 'done') {
        setStreamStatus('完成');
        setTopics(data.result.topics);  // 20 topics
      }
    },
  },
);
```

### AC-005-E(US-005 error)

- 5 类 Tab 切换时 · 老 subscription unsubscribe + 新 subscription enable · 防 stream 串
- saveStream error · 显示 ErrorState · 用户点 [重试] 重新 enable subscription
- LD-170 严守 · file 仍 stub · 仅 metadata 给 LLM 参考 · 不真上传

### AC-005-B(US-005 boundary)

- 5 类 Tab 每类各自独立 acc_step5.{traffic|monetize|...} 数据 · 切换不丢
- subscription enabled=false 时不真 call · 防默认订阅

### AC-005-P(US-005 performance)

- first chunk(`{ type: 'started' }`)< 3s(stepData router AC-8 实施)
- 完整 5 类 100 选题完成 < 30s(若真 LLM · 5 × ~6s)

### AC-006-H(US-006 happy · Step6 + Step7 真接)

```typescript
// apps/web/src/pages/step/Step6.tsx(改造)
// useStepData(accountId, 'step6')
// 跨 step 预填 · readOtherStep(accountId, 'step7') 取 result.body.text 自动填 textarea

// apps/web/src/pages/step/Step7.tsx(改造)
// useStepData(accountId, 'step7')
// 22 elements Set + 20 script types 搜索保留 · onSubmit 改 save(formData)
// CopywritingAgent 自动写 history 表(stepData.save 内已实施 history.create)
```

### AC-006-E / AC-006-B / AC-006-P · 同 AC-003 模式

### AC-007-H(US-007 happy · Step8 真接 LivestreamAgent)

```typescript
// apps/web/src/components/step8/Step8GeneratePlan.tsx(改造)
// useStepData(accountId, 'step8')
// onSubmit · save({ sub_function: 'generate_plan', ...formData })
// LivestreamAgent userInput.experience enum 验证(新手 | 有经验 | 资深)

// apps/web/src/components/step8/Step8OptimizeScript.tsx(改造)
// useStepData(accountId, 'step8')
// onSubmit · save({ sub_function: 'optimize_script', scriptText, optimizeGoal })
```

### AC-007-E(US-007 error)

- 2 子功能 sub_function discriminator 严守 · LS 数据 sub_function 不匹配时 return(防交叉污染 · 继承 PRD-18 §11.11.4)
- LivestreamAgent experience enum 不合法 · Zod 抛 · UI 显示 ErrorState

### AC-007-B(US-007 boundary)

- 2 子功能各自独立 form state · 切换 Tab 不丢
- experience 默认值 = '有经验'(LivestreamAgent 默认)

### AC-007-P(US-007 performance · 同 AC-003-P)

### AC-008-H(US-008 happy · E2E 跨 9 step + acc 切换)

```typescript
// apps/web/e2e/prd-19-frontend-backend.spec.ts

import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

test.describe('PRD-19 · frontend ↔ backend 真接入', () => {
  const prisma = new PrismaClient();

  test('Step 1 真接 PositioningAgent · LS↔DB 双写', async ({ page }) => {
    await page.goto('http://localhost:5173/step/1');
    // 登录 + 切到 account A
    await loginAs(page, 'test_a@example.com');
    // 选行业
    await page.getByRole('button', { name: '美食' }).click();
    await page.getByRole('button', { name: '生成行业洞察' }).click();
    // 等待 LoadingState
    await expect(page.getByText('正在分析行业')).toBeVisible();
    // 真 DB 验证
    const accountAId = await getActiveAccountId(page);
    const dbRow = await prisma.stepData.findFirst({
      where: { stepKey: 'step1', accountId: accountAId },
    });
    expect(dbRow).not.toBeNull();
    expect(dbRow!.inputs).toMatchObject({ industry: expect.any(String), industryLabel: '美食' });
    expect(dbRow!.result).not.toBeNull();  // PositioningAgent 已 wire
    expect(['completed', 'fallback']).toContain(dbRow!.status);
    // LS 镜像验证
    const lsKey = `aiip_memory_acc_${accountAId}_step1`;
    const lsData = await page.evaluate((k) => localStorage.getItem(k), lsKey);
    expect(lsData).not.toBeNull();
  });

  test('acc 切换 · 数据隔离 · Step1 industry 不串', async ({ page, context }) => {
    // account A 行业=美食 · account B 行业=美妆 · 切换后互不见
    // ...
  });

  test('9 step 完整流程 · 数据真存 DB · 0 hardcode acc_step{N} LS', async ({ page }) => {
    // Step1 → Step3 → Step3b → Step4 → Step4b → Step5 → Step6 → Step7 → Step8
    // 每 step verify DB row + 跨 step 预填生效(Step3 industry 来自 Step1)
    // ...
  });

  test('zero-regression · 119+ vitest tests + tsc 0 error + 旧 e2e PRD-15~18 全 PASS', async () => {
    // execSync('pnpm test:unit && pnpm typecheck && pnpm playwright test e2e/prd-{15,16,17,18}-*.spec.ts')
  });
});
```

### AC-008-E(US-008 error · 真后端启动失败)

- 若 PG 未启 · 提示 `brew services start postgresql@16`
- 若 OPENAI_KEY 不在 .env · Specialist fallback · status='fallback' · 验证 fallback path 跑通
- 若 prisma migration 落后 · 提示 `pnpm db:migrate:dev`

### AC-008-B(US-008 boundary)

- 0 旧 e2e PRD-15~18 失败(zero-regression 硬门禁)
- 跨账号切换前后 · 老 acc 数据 LS 镜像保留(per ARCHITECTURE §3.4 · "保留" 不强制清)

### AC-008-P(US-008 performance)

- E2E 9 step 完整流程 < 5min(真 LLM 含)/ < 1min(全 fallback)
- 真后端启动 < 30s(PG + Redis + apps/api + apps/web)

### AC-009-H(US-009 happy · verify-prd-19.sh 35+ 检查 ALL PASS)

```bash
#!/usr/bin/env bash
# scripts/verify-prd-19.sh
set -euo pipefail
PASS=0; FAIL=0
ok()   { echo "  [PASS] $1"; PASS=$((PASS + 1)); }
fail() { echo "  [FAIL] $1"; FAIL=$((FAIL + 1)); }
section() { echo ""; echo "── $1 ──"; }

# §1 11 page 0 hardcode `localStorage.setItem('acc_step{N}')`(LD-009 严守)
section "§1 LD-009 严守 · 0 hardcode acc_step{N}"
HIT=$(grep -rE "localStorage\.setItem\(['\"]acc_step" apps/web/src/pages/step/ 2>/dev/null | wc -l | tr -d ' ')
[ "$HIT" = "0" ] && ok "0 hardcode acc_step{N} in 11 step pages" || fail "$HIT hardcode hits"

# §2 11 page 全 import useStepData(允许 Step2 / Step9 stub 跳过)
section "§2 11 step page import useStepData"
COUNT=$(grep -rln "from '@/hooks/useStepData'\|useStepData(" apps/web/src/pages/step/ 2>/dev/null | wc -l | tr -d ' ')
[ "$COUNT" -ge "9" ] && ok "$COUNT step pages import useStepData (>= 9)" || fail "$COUNT < 9"

# §3 trpc.stepData.save 真 mutation 命中 11 page
section "§3 trpc.stepData.save 真接入"
HIT=$(grep -rl "trpc\.stepData\.save\.useMutation\|useStepData.*save" apps/web/src/pages/step/ 2>/dev/null | wc -l | tr -d ' ')
[ "$HIT" -ge "9" ] && ok "$HIT pages use stepData.save" || fail "$HIT < 9"

# §4 aiip_memory_acc_ 命名严守
section "§4 LD-009 namespace · aiip_memory_acc_ grep"
HIT=$(grep -c "aiip_memory_acc_" apps/web/src/lib/ls-namespace.ts apps/web/src/hooks/useStepData.ts apps/web/src/components/StepForm/StepForm.tsx 2>/dev/null | awk -F: '{sum+=$2} END {print sum}')
[ "$HIT" -ge "5" ] && ok "$HIT references" || fail "$HIT < 5"

# §5 D4=B 严守
section "§5 D4=B 颜色严锁"
HIT=$(grep -rE "from-(violet|amber|gold|purple)" apps/web/src/pages/step/ apps/web/src/components/step{4b,5,6,7,8}/ 2>/dev/null | wc -l | tr -d ' ')
[ "$HIT" = "0" ] && ok "0 violet/amber/gold/purple" || fail "$HIT hits"

# §6 D3=A 严守 · git diff PRD-19 范围 · apps/admin / apps/api 0 触动(除 packages/clients/router-types)
section "§6 D3=A 边界 · apps/admin / apps/api 0 touched"
DIFF=$(git diff --name-only main..HEAD 2>/dev/null | grep -E "^apps/(admin|api)/" | grep -v "packages/clients/" | wc -l | tr -d ' ')
[ "$DIFF" = "0" ] && ok "0 admin/api files touched" || fail "$DIFF files touched"

# §7 TD-76 fix · STEP7_LABEL_SCRIPT_TYPE export
section "§7 TD-76 fix · STEP7_LABEL_SCRIPT_TYPE"
grep -q "export const STEP7_LABEL_SCRIPT_TYPE" apps/web/src/lib/constants/step7.ts && ok "exported" || fail "missing"

# §8 TD-77 fix · STEP8_OPTIMIZE_OUTPUT_LABELS_2 export
section "§8 TD-77 fix · STEP8_OPTIMIZE_OUTPUT_LABELS_2"
grep -q "export const STEP8_OPTIMIZE_OUTPUT_LABELS_2" apps/web/src/lib/constants/step8.ts && ok "exported" || fail "missing"

# §9 zero-regression · vitest + tsc + e2e
section "§9 zero-regression"
cd apps/web && pnpm typecheck > /tmp/tc.txt 2>&1 && ok "typecheck PASS" || { fail "typecheck FAIL"; tail /tmp/tc.txt; }
cd apps/web && pnpm vitest run > /tmp/v.txt 2>&1 && ok "vitest PASS" || { fail "vitest FAIL"; tail /tmp/v.txt; }

# §10 migration helper 实施
section "§10 migration helper · legacy-ls.ts"
[ -f apps/web/src/lib/migration/legacy-ls.ts ] && ok "exists" || fail "missing"
grep -q "migrateLegacyLs\|MIGRATION_FLAG_KEY" apps/web/src/lib/migration/legacy-ls.ts && ok "function defined" || fail "function missing"

echo ""
echo "Result: $PASS passed, $FAIL failed"
exit $FAIL
```

### AC-009-E(US-009 error)

- 任一 §1~§10 失败 · exit non-zero · CI / 用户能 catch
- 不要 silent skip · 全错误明示

### AC-009-B(US-009 boundary)

- 跨 9 step page 全 PASS · 35+ 项全绿
- TD-76/77 fix 不影响 PRD-18 既有 grep 测试 · 反例库未升级(只是常量化 · 不是 reject 反例)

### AC-009-P(US-009 performance)

- verify script 跑完 < 60s(typecheck ~20s + vitest ~30s + 各 grep < 5s)

---

## §3 范围排除(明确不做)

- ❌ 不重写 stepData router(brownfield 已 439 行 + 8 Specialist 全接 · 不动)
- ❌ 不重写 useStepData hook(brownfield 已 63 行 · LS↔DB 双写完整 · 仅增强 readOtherStep)
- ❌ 不动 Specialist 真 LLM call 逻辑(brownfield 已实施 PositioningAgent / BrandingAgent / MonetizationAgent / TopicAgent / VideoAgent / CopywritingAgent / LivestreamAgent · 仅 frontend 接 result render)
- ❌ 不接 OAuth 真 Google(继承 PRD-1 N-1 · mock provider 优先)
- ❌ 不实施 admin 子系统(D3=A 严守 · apps/admin / apps/api/admin/* 0 触动)
- ❌ 不切 Aurelian Dark 颜色 token(D4=B 严守 · primary 金色 HSL(43, 87%, 63%))
- ❌ 不实施 file 真上传(LD-170 严守 · Step5 仍 FileReader stub + metadata only)
- ❌ 不引入 chart 库(LD-174 严守 · Step4b 仍 simple progress bar)
- ❌ 不动 Step2 / Step9 stub page(21 行 stepConfig 占位 · 留 future PRD)
- ❌ 不动 PRD-15~18 已实施的 11 step page 其他 layout / token / D1=A 字面锁(仅替换 hardcode LS + 接 trpc · 其余不动)

---

## §4 风险 + 缓解

| # | 风险 | 缓解策略 |
|:-:|---|---|
| R-1 | **LS migration 数据丢失** · 用户从 PRD-18 升级到 PRD-19 · 老 `acc_step{N}` LS 数据迁失败 | US-001 MIGRATION_FLAG_KEY 防重复跑 + 不覆盖新 key 策略 + 单测覆盖 4 类 edge(空/全/部分/已迁) |
| R-2 | **11 page 批量改造 risk** · 集中改 11 文件 · 单 US 改动量大 · ralph 撞 prompt 12K+ 红线 | US-003~007 拆 5 组(3+2+1+2+1 = 11 page)· 每 US 最多 3 page · prompt < 10K |
| R-3 | **Specialist LLM call 真 cost** · E2E 跑全 9 step 真 LLM · 估每次 ~$0.05~0.10 | E2E 默认走 fallback mock(无 OPENAI_KEY)· 真 LLM 验证只在 manual trigger / CI weekly run |
| R-4 | **跨账号数据隔离 bug** · LS 切换时老 acc 数据 LS 镜像保留 · 但 DB 应严守 RLS · 切错账号显示别 acc 数据 | US-008 E2E AC 覆盖 acc 切换 + DB query(account A industry vs B industry 互不见) |
| R-5 | **跨 step 数据预填断链** · acc_step5_selected_topic → acc_step7 旧链路 · 改造后 readOtherStep 替代 · 字段 id 不一致 | US-002 readOtherStep helper + acc_step5_selected_topic 特殊路径 migration · 单测覆盖跨 step 预填 |
| R-6 | **真后端启动复杂** · pnpm dev:api + dev:web + PG + Redis 同时跑 · E2E 启动 risk | scripts/dev-e2e.sh helper(若未存)· 或 doc 提示用户手启 |
| R-7 | **TopicAgent SSE 真接 UI risk** · React useSubscription + 5 Tab 切换 unsubscribe + 进度 UI 同步 | US-005 SSE 拆为独立 US · 详细 AC + boundary 覆盖 stream 串/重订/断线 |
| R-8 | **zero-regression risk** · 11 page 改动可能 break PRD-15~18 旧 vitest/e2e | US-008/US-009 zero-regression 硬门禁 · 119+ vitest + 旧 e2e 全 PASS 才 approve |

---

## §5 测试配额(★ 跟 §4.5 规范对齐)

| 测试类型 | 配额 | 路径 |
|---|---|---|
| **单元测试 (vitest)** | 50+ 新增 + 119+ 旧不动 | apps/web/src/lib/migration/__tests__/legacy-ls.test.ts(15+ 测) · apps/web/src/hooks/__tests__/useStepData.test.tsx(10+ 测) · apps/web/src/pages/step/__tests__/Step{1,3,3b,4,4b,5,6,7,8}.test.tsx(各 3-5 测 · ~30 测) |
| **集成测试 (vitest + msw)** | 9 step page × 真 trpc.stepData.save mock = 9+ 测 | apps/web/src/pages/step/__tests__/*.integration.test.tsx |
| **E2E (playwright)** | 1 新 spec · 4 tests · 真后端 + 真 DB | apps/web/e2e/prd-19-frontend-backend.spec.ts |
| **LLM Judge (vitest.judge.config.ts)** | 0(本 PRD 不动 Specialist · 留 PRD-20 评估) | — |
| **typecheck (tsc --noEmit)** | 0 error | `pnpm typecheck` |
| **lint** | 0 error | `pnpm lint` |

---

## §6 退出条件(从 ARCHITECTURE §9.4/§9.5 完整粘贴 + AC 总和)

1. ✅ **9 US ALL passes=true**(prd.json 全绿)
2. ✅ **跨 9 step page 真接 trpc.stepData.save**(0 hardcode `localStorage.setItem('acc_step{N}')` · verify §1 0 命中)
3. ✅ **LS↔DB 双写真生效**(aiip_memory_acc_{accountId}_step{N} 命名严守 · LD-009 audit 0 violation)
4. ✅ **跨账号数据隔离** · E2E acc 切换 industry 不串(account A 美食 vs B 美妆 互不见)
5. ✅ **Specialist 真接 result render** · 9 page 全用 trpc.stepData.get/save · LoadingState/ErrorState 复用
6. ✅ **跨 step 数据预填生效** · Step3 自动读 Step1 industry · Step6 自动读 Step7 body.text(若有)
7. ✅ **zero-regression** · 119+ vitest PASS · tsc 0 error · PRD-15~18 旧 e2e 全 PASS
8. ✅ **verify-prd-19.sh 35+ 检查 ALL PASS**
9. ✅ **TD-76/77 一并 fix** · STEP7_LABEL_SCRIPT_TYPE + STEP8_OPTIMIZE_OUTPUT_LABELS_2 export + Step7.tsx / Step8OptimizeScript.tsx 用常量
10. ✅ **D3=A / D4=B 严守** · git diff apps/admin / apps/api 0 触动 · grep violet/amber/gold/purple 0 命中

---

## §7 跟 Coding 3.0 的协同协议

### §7.1 prd skill 启动条件

- ✅ tasks/ 已存在 PRD-15~18(brownfield 完整)
- ✅ Locked Decisions 跨 PRD 延续(D-176 起 · 继 PRD-18 D-175)
- ✅ Assumptions 模式(brownfield 实证 P0/P1 已 95% 实施)

### §7.2 ralph daemon 启动前 checklist

按全局 CLAUDE.md §5 + 项目 CLAUDE.md §9.1 5 步 SOP:

1. 跑 `python scripts/ralph/ralph-tools.py validate` 校验 prd.json 结构
2. 跑 `/plan-check` 7 项 W-patches 检查(包含 PRD-18 retro Diff-1 §2.6.22 EmptyState 检测 + Diff-2 §2.6.21 扩范围 form label / InfoCard label 检测)
3. **★ 先启 Monitor**(persistent=true · 订阅 ralph-output.log) · ★ 不可调换顺序
4. 启 ralph daemon · `/Users/return/.local/bin/python3.11 scripts/ralph/ralph.py --model sonnet --daemon`
5. 等 Monitor 通知 PENDING_DETECTED → Opus 审 → approve / reject

### §7.3 Opus audit 强度分档(per risk_level)

| US | risk | 审计强度(per OPUS-AUDIT-CHEATSHEET §Z) |
|---|---|---|
| US-001 | foundation | §0 4 项实测 + 通用 4 维度 + 全部域 grep + 跨 US 命名一致性核对 + 下游 US AC 是否依赖本 US 字段语义 |
| US-002 | foundation | 同 US-001 + 必读 useStepData / ls-namespace 现实施 |
| US-003~007 | high | §0 4 项实测 + 通用 4 维度 + 全部域 grep + line-by-line + 真 DB 实测(prisma findFirst)+ 必读相关测试代码 |
| US-008 | high | §0 + 通用 + E2E 实测 + 真后端 stack 验证 + acc 切换隔离实测 |
| US-009 | medium | §0 + 通用 + 3-5 条 grep + verify-prd-19.sh 真跑 35+ 项 |

### §7.4 反例库注入(anti_patterns)

每 high+foundation US 注 2-3 条反例 from `~/.claude/playbooks/reject-examples.jsonl`(49 条):
- 关键词 grep · trpc mutation / useQuery / SSE / acc_namespace / localStorage hardcode / Specialist fallback / LLM cost / E2E 真后端 / zero-regression
- 高优先级反例 ·
  - **PRD-17 US-007 SUBTITLE 字面创意改写 reject** · 防 ralph 改 form label 字面
  - **PRD-18 US-007 EmptyState 含 spec 字面 reject** · 防 ralph 改 LoadingState text 字面
  - **PRD-16 US-003 violet 字面读 reject** · 防 ralph 引 Tailwind 真紫色 utility
  - **PRD-14 cross-story routing reject** · 防 ralph 跨 US 函数命名漂移(useStepData vs trpc.stepData.save 接口对齐)

---

## §7.5 跨 Story 协议锁(★ ≥25 项 · 必填)

| # | 命名 | 类型 | 定义 US | 消费 US | 说明 |
|:-:|---|---|---|---|---|
| 1 | `migrateLegacyLs(store, accountId)` | function | US-001 | US-003~007(App.tsx 启动 1 次 call) | 一次性老 LS 迁移 helper |
| 2 | `MIGRATION_FLAG_KEY = 'aiip_legacy_migration_v1_done'` | const | US-001 | US-001 内部用 | 防重复跑标记 |
| 3 | `LEGACY_KEYS` | readonly tuple | US-001 | US-001 内部用 | 老 10 keys 清单 |
| 4 | `stepLsKey(accountId, stepKey)` | function(已存在) | (brownfield) | US-001/US-002/US-003~007 | LS 命名 helper(continue use ls-namespace.ts 现 export) |
| 5 | `readOtherStep<T>(accountId, otherStepKey)` | function | US-002 | US-003~007(跨 step 预填) | 静态 LS 读 helper |
| 6 | `useStepData(accountId, stepKey)` 返回新增 `dbQuery` | hook 返回类型 | US-002 | US-003~007 page | tRPC.stepData.get useQuery 包装 |
| 7 | `aiip_memory_acc_{accountId}_step{N}` | LS key 规范 | (brownfield) | US-001~007 全部 | LD-009 严守 · 不允许散落 |
| 8 | `aiip_memory_acc_{accountId}_selected_topic` | LS key | US-001 | US-005 / US-006(跨 step 预填 Step5→Step7→Step6) | 选题跨 step 桥 |
| 9 | `trpc.stepData.save.useMutation()` | tRPC mutation | (brownfield) | US-003~007 page | save formData 触发 |
| 10 | `trpc.stepData.get.useQuery({ stepKey })` | tRPC query | US-002 包装 | US-003~007 page render | DB 读 result |
| 11 | `trpc.stepData.saveStream.useSubscription({ stepKey: 'step5', category, inputs })` | tRPC subscription | (brownfield) | US-005 | TopicAgent SSE 5 类 |
| 12 | `StepData.status enum: 'completed' \| 'fallback' \| 'pending'` | DB enum | (brownfield) | US-003~007 UI 判断 isFallback | result.status === 'fallback' 显示 [降级] badge |
| 13 | `Step{N}Result` interface(各 page 内部 type) | interface | (PRD-17/18 沉淀) | US-003~007 page render | 跟 Specialist Output schema 对齐(zod runtime validate · 不允许 hardcode 假设) |
| 14 | `PositioningAgent.execute({ mode: 'industry' \| 'execution' })` | Specialist signature | (brownfield) | US-003(Step1 industry)/ US-004(Step4 execution) | step1=industry · step4=execution(stepData router 内分支已实施) |
| 15 | `BrandingAgent.execute({ mode: 'packaging' \| 'persona' })` | Specialist signature | (brownfield) | US-003(Step3 packaging / Step3b persona) | step3=packaging · step3b=persona |
| 16 | `MonetizationAgent.execute({ userInput })` | Specialist signature | (brownfield) | US-004(Step4b) | 单 mode |
| 17 | `TopicAgent.execute({ userInput: { category, ...inputs } })` | Specialist signature | (brownfield) | US-005(Step5 5 类) | category enum · saveStream SSE |
| 18 | `VideoAgent.execute({ mode: 'shooting' })` | Specialist signature | (brownfield) | US-006(Step6) | shooting mode |
| 19 | `CopywritingAgent.execute({ mode: 'step7' })` | Specialist signature | (brownfield) | US-006(Step7) | step7 mode · 自动写 history 表 |
| 20 | `LivestreamAgent.execute({ userInput })` | Specialist signature | (brownfield) | US-007(Step8 2 子功能) | userInput.experience enum |
| 21 | `Step8.sub_function: 'generate_plan' \| 'optimize_script'` | discriminator | (PRD-18 沉淀) | US-007 | LS 数据隔离 + render switch |
| 22 | `useActiveAccount().activeAccount.id` | hook 返回字段 | (brownfield) | US-003~007 全部 page | accountId 传 useStepData |
| 23 | `LoadingState text='正在分析行业 · 请稍候 ...'` etc | UI 文案模板 | US-003~007 | (各 page 复用) | 通用 LoadingState text 跨 step 一致(继承 PRD-17 §11.10.2) |
| 24 | `ErrorState onRetry={dbQuery.refetch}` | UI 复用模式 | US-003~007 | (各 page 复用) | 网络断重试 |
| 25 | `EmptyState title={\`提交表单后查看${STEP{N}_H1}\`}` | UI 复用模式 | (PRD-18 §11.11.1) | US-003~007 | template literal pattern 严守(防 spec 字面 hardcode reject) |
| 26 | `STEP7_LABEL_SCRIPT_TYPE = '选择脚本类型'` | const | US-009(TD-76 fix) | Step7.tsx line 150 | 替换 hardcode `<label>选择脚本类型</label>` |
| 27 | `STEP8_OPTIMIZE_OUTPUT_LABELS_2 = [{ id: 'optimized_text', label: '优化后文案' }, { id: 'optimization_notes', label: '优化说明' }]` | const tuple | US-009(TD-77 fix) | Step8OptimizeScript.tsx 替换 hardcode InfoCard label | TD-77 fix |
| 28 | `X-Trace-Id` HTTP header | header | (brownfield · PRD-1 US-007) | US-003~007 mutation | 全链路 trace 已实施 trpc.ts genTraceId() |
| 29 | `Specialist result.isFallback: boolean` | output 字段 | (brownfield) | US-003~007 UI 判断 [降级] badge | LLM key 缺时 fallback mock 返回 |
| 30 | `StepData.traceId` field | DB column | (brownfield) | US-008 E2E AC | trace_id 写到 prisma StepData 表 · 单链路追踪 |

---

## §8 修订记录

- **2026-05-18 v0.1** · prd skill 启动(brownfield 实证 P0/P1 已 95% 实施 · scope 重定位 14-18 US → 9 US · frontend ↔ backend 真接入)
  - §0 引用清单 11 source
  - §1 9 US(Wave 1 协议铺路 2 + Wave 2 step page 真接 5 + Wave 3 收官 2)
  - §2 9 × 4 类 AC(36 条 · 含完整代码片段 · 严守 PRD-MASTER §2 写作模板)
  - §3 范围排除 10 条(继承 PRD-15~18 N-1~N-7 + 新增 3 条)
  - §4 风险 + 缓解 8 条
  - §5 测试配额(50+ 新单测 + 9 集成 + 1 E2E spec · 0 LLM Judge 留 PRD-20)
  - §6 退出条件 10 条
  - §7 Coding 3.0 协同协议 + risk 分档 + 反例库注入
  - §7.5 跨 Story 协议锁 30 项
  - Locked Decisions D-176 ~ D-190(15 新决策)

---

## Locked Decisions(D-176 ~ D-190 · 继 PRD-18 D-175)

- **D-176** · PRD-19 scope = frontend ↔ backend 真接入(非 P0/P1 重起)· 因 brownfield 实证 prisma schema + 8 Specialist + stepData router + useStepData hook + ls-namespace 全已实施(原因 · 避免重造轮子 · 99% backend 已 ready)
- **D-177** · stepKey 命名继续用 `step{N}`(含 `step3b` / `step4b`) · stepData router stepKeySchema = z.string().min(1).max(64) 已支持任意 key(原因 · 不破坏 brownfield API)
- **D-178** · 老 `acc_step{N}` LS 数据用一次性 migration helper 迁(MIGRATION_FLAG_KEY)· 不重命名 / 不删 LS 直接迁(原因 · 防数据丢失 · 用户体验无感)
- **D-179** · `acc_step5_selected_topic` 特殊跨 step key 迁到 `aiip_memory_acc_{accountId}_selected_topic`(原因 · 跨 step 桥仍需 LS · DB 不存)
- **D-180** · useStepData hook 增强 dbQuery + readOtherStep · 不重写 save / load(原因 · brownfield 已实施 LS↔DB 双写 · 仅 expose 跨 step 读 helper)
- **D-181** · 11 step page 各自 hardcode mockResult + setTimeout 必删 · 全部走 trpc.stepData.save(原因 · LD-009 严守 + 真 DB 持久化)
- **D-182** · Specialist 真 LLM call 是 backend 内部决定 · frontend 0 感知(原因 · status='fallback' badge 是仅有 frontend 路径分支)
- **D-183** · LoadingState text 跨 step 统一 · '正在 X · 请稍候 ...'(继承 PRD-17 §11.10.2 复用规范 · 防散落 hardcode)
- **D-184** · ErrorState 默认 message + 可覆盖 · `<ErrorState message='X' onRetry={fn} />` 模式(原因 · 通用化 + 重试统一 path)
- **D-185** · EmptyState 严守 template literal pattern · 0 hardcode 含 spec 字面常量(继承 PRD-18 §11.11.1 红线级)
- **D-186** · TD-76(step7 form label hardcode) + TD-77(step8 InfoCard label hardcode) 在 PRD-19 US-009 一并 fix · 不留 maintenance 拖延(原因 · plan-check §2.6.21 扩范围 apply 后 audit grep 会 catch)
- **D-187** · E2E 默认走 fallback mock · 真 LLM 验证仅 manual / CI weekly run(原因 · 真 LLM cost ~$0.05~0.10/run · CI 跑频高浪费)
- **D-188** · 跨账号 LS 镜像保留(per ARCHITECTURE §3.4)· 不强制清(原因 · 用户切回老 acc 立即可见 · 体验顺滑)
- **D-189** · 5 Tab Step5 saveStream SSE 切换时 unsubscribe + 新订阅 enable(原因 · 防 stream 串 + memory leak)
- **D-190** · verify-prd-19.sh 用 bash + grep + 真 typecheck/vitest 跑(不依赖外部 lint 工具)· 35+ 检查项 · zero-regression 硬门禁(原因 · 客观证据 + CI 友好)

---

## 详细度自检清单(全过)

- ✅ 每个 user story 的 description 含背景 / 触发场景 / 预期行为
- ✅ 每个 user story 的 acceptanceCriteria 不少于 3 条(实际 4 类 happy/error/boundary/performance · 共 ≥4 条)
- ✅ AC 含完整代码片段(US-001 migrateLegacyLs · US-002 useStepData 增强 · US-003 Step1 改造 · US-005 SSE subscription · US-008 E2E playwright · US-009 verify script · 全 8 个 code block)
- ✅ Functional Requirements 编号(本 PRD 不单列 · 已嵌入 9 US 的 AC 内 · 每 AC = 1 FR)
- ✅ Technical Considerations 列出已知约束(brownfield 实证 + Specialist 已 wire + LS↔DB 已实施 · 仅 frontend 接入)
- ✅ Non-Goals 明确边界(§3 范围排除 10 条)
- ✅ 跨 Story 协议锁(§7.5)30 项填写(超 25 项最低要求)
- ✅ Locked Decisions D-176~D-190 编号 · 跨 PRD 延续

---

## §0.3 复刻定调表(PRD-19 不复刻 aiipznt 新内容 · 仅 backend 接入)

> 本 PRD 0 新 layout / 0 新文字内容 · 仅替换 mockResult 为真 Specialist result render · D1=A 不严锁(因不改 layout)

| 维度 | 切 / 不切 |
|---|:-:|
| layout(11 step page · 继承 PRD-15~18) | ⚪ 不改 |
| spacing scale / 字体 / motion / SVG icons | ⚪ 不改 |
| 文字内容(SUBTITLE / H1 / step_tag / button label) | ⚪ 不改 (继承 PRD-17/18 字面锁) |
| **mockResult 替换为 Specialist result** | ✅ **改**(各 Step{N}OutputContent 接受 Step{N}Result 真数据 · 兼容 mockResult fallback 模式) |
| **localStorage hardcode acc_step{N} 替换为 useStepData** | ✅ **改**(11 page · LD-009 严守) |
| UX behavior(form 提交 / Tab 切换 / 跨 step 预填) | ⚪ 不改 |
| 颜色 token(D4=B 严锁 · primary 金色) | ⚪ 不改 |

**PRD-19 不引 PRD-16 retro M-2 D1=A 定调表锁**(因 0 layout 改动) · 但严守:
- D4=B 颜色锁(继承 · grep violet/amber/gold/purple 0 命中)
- LD-009 LocalStorage acc_ 严守(本 PRD 升级到正规 `aiip_memory_acc_{accountId}_step{N}` 命名)
- D3=A 边界锁(apps/admin / apps/api 除 trpc/routers 必要修改外 0 触动)

---

**End of PRD-19 seed v0.1**
