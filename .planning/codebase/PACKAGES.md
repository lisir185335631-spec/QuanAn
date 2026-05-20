# packages/* 事实层(精简版 · PRD-26-prep cleanup 2026-05-21)

> **决策** · 3 个 packages(ui/schemas/clients · 总 39 files)体量较小 · 不跑 /gsd-map-codebase × 3 生成 21 标准事实文件(ROI 低)· 改写本精简版汇总 · 关闭 TD-043 packages 子项 · /goal-verify §0 对账可读本文件 + AGENTS.md §11.2 跨包类型共享。

---

## 1 · packages/ui(7 files)

**目的** · 跨 apps 共享 React 组件 · 不依赖业务 specific(stub data / trpc client)

**结构**:
- `packages/ui/src/index.ts` · barrel export
- `packages/ui/src/base/*` · shadcn-style 基础组件(Button / Card / Dialog 等 · PRD-5 US-005 引入 · TD-005 路径偏差 admin lift 时治理)
- `packages/ui/src/admin/*` · admin 专属组件(DenseTable / PdfBillTemplate / PdfForensicTemplate)

**vite.config.ts alias 映射**:
```
@quanan/ui              → packages/ui/src/
@quanan/ui/admin        → packages/ui/src/admin/index.ts
@quanan/ui/admin/pdf    → packages/ui/src/admin/PdfBillTemplate.tsx
@quanan/ui/admin/forensic-pdf → packages/ui/src/admin/PdfForensicTemplate.tsx
```

**关键 patterns**:
- admin DenseTable · 高密度数据展示(继承 PRD-10~14 admin core)
- PdfBillTemplate / PdfForensicTemplate · @react-pdf/renderer · 服务端用(apps/api 跑 · 不在 apps/web)
- base/* · 12 shadcn 组件(TD-005 记录:实际仍在 apps/web/src/components/ui/ · admin lift 时迁移到此)

**测试** · 0 unit test in `packages/ui/`(测试在 apps/{web,admin}/src/**/__tests__/)

**风险** · 跨 apps 共享变更需 sync(packages/ui 改后需 apps/web + apps/admin 同时 rebuild)

---

## 2 · packages/schemas(29 files)

**目的** · 跨 apps 共享 zod schemas(zero runtime deps · TypeScript 类型 + 校验)

**结构**:
- `packages/schemas/src/index.ts` · 顶级 barrel export
- `packages/schemas/src/admin/*` · admin 域 schemas(approval / abExperiment / 等)
- `packages/schemas/src/entities/*` · 业务实体 schemas(ipAccount / diagnosisReport / 等)
- `packages/schemas/src/rag/*` · RAG / knowledge chunk schemas
- `packages/schemas/src/specialist-io/*` · 13 Specialist 输入输出 schemas(关键 · 与 specialist 1:1 对应)
- `packages/schemas/src/step-results/*` · 9 step 数据 schemas(对应 spec §7.X)

**vite.config.ts alias 映射**:
```
@quanan/schemas              → packages/schemas/src/index.ts
@quanan/schemas/specialist-io → packages/schemas/src/specialist-io/index.ts
```

**关键 patterns**:
- 所有 zod schemas 都 export 类型(`export type X = z.infer<typeof xSchema>`)
- specialist-io 是后端 BaseSpecialist + 前端 router-types shadow 的桥梁
- step-results 是 stepData router input/output 类型源头(数据库 jsonb 字段映射)

**测试** · 跨包测试在 apps/api/src/**/__tests__/ + 部分 schemas 验证在 apps/web

**风险** · zod schema 变更影响前后端 + DB 序列化 · 需协议锁严守(LD-A-3 等)

---

## 3 · packages/clients(3 files)

**目的** · 跨 apps 共享 trpc client + router-types shadow(避免后端类型直接 import 到前端)

**结构**:
- `packages/clients/src/index.ts` · barrel export
- `packages/clients/src/router-types.ts` · main app router shadow(`AppRouter` 类型 + procedure 输出类型 inference)· 含 `DiagnosisGenerateOutput` / `SmartRecommendOutput` 等 PRD-25 加的类型
- `packages/clients/src/admin-router-types.ts` · admin router shadow(PRD-10~14 admin core 同模式)

**vite.config.ts alias 映射**:
```
@quanan/clients              → packages/clients/src/
```

**关键 patterns**(继承 AGENTS.md §11.2):
- 前端 NEVER `import type { AppRouter } from 'apps/api'` · 必通过 router-types shadow
- 每加新 trpc router · 在 router-types.ts 同步 shadow type(US-007 实证 · SmartRecommendOutput 加 in commit 3c4011f)
- ts-shadow 模式防 monorepo 循环依赖

**测试** · 0 unit test · 类型层 · 跨包测试通过 apps/web vitest typecheck 自动验证

**风险** · 后端 router 加 procedure 时 · clients shadow 不同步会让前端 trpc.X.useMutation 类型为 unknown · ralph 默认 patterns 已 cover

---

## 4 · 跨 packages 关系图

```
apps/web ─┬─► packages/ui (base + admin)
          ├─► packages/schemas (entities + step-results + specialist-io 类型)
          └─► packages/clients (router-types shadow · trpc useMutation/useQuery)

apps/api ─┬─► packages/schemas (specialist-io · 后端真用 · zod 校验)
          ├─► packages/ui (admin/PdfBillTemplate · 服务端 PDF 生成)
          └─► packages/clients (不依赖 · 后端直接 export AppRouter type)

apps/admin ─┬─► packages/ui (admin/DenseTable + base/* 子集)
            ├─► packages/schemas (admin 域 + entities)
            └─► packages/clients (admin-router-types shadow)
```

---

## 5 · 历史 TD 关联

- **TD-005** · 12 shadcn 组件路径偏差(写在 apps/web/src/components/ui/ 而非 packages/ui/src/base/) · admin lift 时治理 · status=scheduled
- **TD-049** · admin UI primitive 跨 6 页重复 · 应抽到 packages/ui/src/admin/ · status=open · 留 PRD-26 admin UI MVP 实施

---

## 6 · 与 sub-project codebase 事实层关系

| 项 | 状态 | 位置 |
|---|:-:|---|
| apps/web | ✅ 标准 7 files | `apps/web/.planning/codebase/` |
| apps/api | ✅ 标准 7 files | `.planning/codebase/apps-api/` |
| apps/admin | ✅ 标准 7 files | `.planning/codebase/apps-admin/` |
| **packages/*** | ✅ **精简版**(本文件) | `.planning/codebase/PACKAGES.md` |

**为什么 packages 精简** · 39 files 体量比 apps/* 数百 files 小一个数量级 · 跑 /gsd-map-codebase × 3 ROI 低 · 信息已在 vite.config.ts alias + AGENTS.md §11.2 + 各 package src/index.ts barrel · 精简版手写更高效。

---

> **本文件 2026-05-21 PRD-26-prep cleanup 期写 · 关闭 TD-043 packages 子项 · 留 sub-project codebase TD-043 主项继续 open(对账 AGENTS.md 设计约束 vs 实际代码 deferred to PRD-26+)**
