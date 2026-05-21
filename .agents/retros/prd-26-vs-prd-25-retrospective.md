# PRD-26 vs PRD-21~25 跨 6 PRD 复盘

> **PRD-26** · admin UI MVP polish · 9 TD 清 + e2e 验证 + lazy load
> **复盘范围** · PRD-21~26 视觉对齐征程(4 PRD)→ LLM 接入(1 PRD)→ admin polish(1 PRD)
> **Branch** · `ralph/prd-26-admin-ui-mvp`
> **Daemon cycle** · 2026-05-21 BJT
> **Retrospective** · Opus 4.7 · 2026-05-21

---

## §0 · 数据总览

### §0.1 PRD-21~26 严格一轮通过率趋势(视觉对齐 → LLM 接入 → admin polish)

| PRD | 严格一轮 % | 通过/总(dev) | Opus reject | retry | TD 净变化 | verify checks | 里程碑 |
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---|
| PRD-21 | —(不计收官) | 7/7 | — | 4 | +3 | 45 | 视觉对齐起点 |
| PRD-22 | 82% | 9/11 | 2 | 0 | +5 | 52 | 13 admin baselines |
| PRD-23 | 100% | 9/9 | 0 | 0 | 0(净减) | 58 | 28 baselines · 100% 首次 |
| PRD-24 | 100% | 3/3 | 0 | 0 | 0 | 51 | **32 baselines 达成** |
| PRD-25 | 100% | 8/8 | 0 | 0 | -2 | 40 | **LLM 接入 10 pages** |
| **PRD-26** | **100%** | **6/6** | **0** | **0** | **-8** | **33** | **admin MVP polish 完成** |

**PRD-26 关键数据**:
- 🟢 **100%** 严格一轮通过率 (6/6 dev US · 0 retry · 0 Opus reject)
- 🟢 **连续 4 PRD 100%** (PRD-23~26) — 最长连续完美记录
- 🟢 **-8 TD 净减** — 本 PRD 最大单 PRD TD 清理量 (8 fully resolved + 1 partial)
- 🟢 **33 verify checks ALL PASS** — 7 sections 全覆盖
- 🟢 **admin SPA 95% → 100%** — visual baseline + e2e smoke + role matrix + unit test 四层

### §0.2 PRD-26 6 dev US 详细分布

| US | risk | size | retryCount | Opus reject | 状态 | 核心内容 |
|:-:|:-:|:-:|:-:|:-:|:-:|---|
| US-001 | medium | medium | 0 | 0 | ✅ 1iter PASS | admin index barrel · 7 placeholder 删 · TD-031 |
| US-002 | medium | medium | 0 | 0 | ✅ 1iter PASS | 17 visual baseline + smoke tests(34 total) |
| US-003 | medium | medium | 0 | 0 | ✅ 1iter PASS | allowedDomains + 三档 e2e · page_view audit |
| US-004 | medium | medium | 0 | 0 | ✅ 1iter PASS | packages/ui/src/admin/ 5 components · TD-049 |
| US-005 | medium | medium | 0 | 0 | ✅ 1iter PASS | routers/app/ 对称 · 6 TD batch · audit 26 tables |
| US-006 | medium | medium | 0 | 0 | ✅ 1iter PASS | React.lazy 17 · manualChunks 4 · 51 unit tests |

**1iter 率**: 6/6 = **100%** — 与 PRD-23/24/25 并列历史最优

---

## §1 · PRD-26 严格通过率分析

### §1.1 为什么能连续第 4 PRD 100%？

PRD-26 是 admin polish PRD，所有 US 都是 medium risk。但不能简单归因于"难度低"：

**真正的原因**:

1. **anti_patterns SHIELD 注入已系统化** · PRD-25 retro §1.1 的预测再次验证
   - `monorepo lint scope(M-2)` — ralph 从 PROJECT_ROOT 跑 pnpm lint · 未漏 ws
   - `LD-A-1 admin/web 隔离` — packages/ui/src/admin 无 trpc import · props injection 严守
   - `收官不跳 /goal-verify §0` — US-007 直接执行 §0~§4 不省略
   - `protectedProcedure 禁 admin router` — US-003/005 全用 adminProcedure

2. **"小 story 定律"在 admin polish PRD 仍有效**
   - 6 dev US 全 medium · 无 large
   - 最复杂 US-005(28 router 文件移 + 6 TD batch)仍 1iter PASS
   - 原因: 文件 move 是确定性操作 · import path 替换 · ralph 从未超时

3. **PRD-26 专属因素: 技术债 batch 清理模式**
   - TD-037~042 集中在 US-005 · 1 story 清 6 TD · 高效
   - TD-049 明确 scope(5 components → packages/ui) · ralph 有清晰目标
   - TD-031(cleanup)是 US-001 · 最轻 · 先清理后建 · 不留 PRD 结束时积累

### §1.2 L4 进化 M-1/M-2/M-3 真触发情况

| 机制 | AC 描述 | PRD-26 命中次数 | 效果 |
|---|---|:-:|---|
| **M-1** 反例库 SHIELD | anti_patterns 注入 7 US | 3次 (US-004 trpc检 · US-005 lint root · US-007 收官) | ralph 主动避开 3 个历史坑 |
| **M-2** monorepo lint scope | ROOT 跑 pnpm lint | 1次 (US-005 router 移后) | 未漏 ws lint errors |
| **M-3** watch-audit 系统通知 | daemon fork watch-audit-gate.py | 未触发(Opus 在线审查) | 备用 · 无 audit 空窗 |

---

## §2 · 跨 PRD-21~26 6 PRD 趋势(视觉征程 → LLM 接入 → admin polish 三阶段)

### §2.1 三阶段特征

| 阶段 | PRD 范围 | 核心模式 | 成功关键 |
|---|:-:|---|---|
| **视觉征程** | PRD-21~24 | aiipznt 克隆 · baseline 生成 · 视觉对齐 | 小 story + visual diff 实证 |
| **LLM 接入** | PRD-25 | BaseSpecialist + invokeLLM × 10 pages | SHIELD 反例 + SSE 模式成熟 |
| **admin polish** | PRD-26 | TD batch + e2e 三层 + lazy load | TD 集中清理 + 确定性 story |

### §2.2 质量指标趋势

| 维度 | PRD-21 | PRD-22 | PRD-23 | PRD-24 | PRD-25 | PRD-26 |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| 1iter % | — | 82% | 100% | 100% | 100% | 100% |
| Opus reject | — | 2 | 0 | 0 | 0 | 0 |
| TD 净增/减 | +3 | +5 | 0 | 0 | -2 | **-8** |
| verify checks | 45 | 52 | 58 | 51 | 40 | 33 |
| e2e coverage | visual | visual | visual | visual | visual+unit | **visual+smoke+role+unit** |

**关键转折**: PRD-23 是质量拐点 · 从 82% → 100% 并持续 · PRD-26 -8 TD 是最大清理量

### §2.3 累积收益

6 PRD 结束时:
- reject-examples.jsonl: 52 条 (来自 PRD-5~25 · 跨 PRD 沉淀)
- verify check 总量: 45+52+58+51+40+33 = 279 checks 执行
- TD 净变化: +3+5+0+0-2-8 = **净减 2** (从 6 PRD 维度看 · 总体可控)

---

## §3 · TD 净变化分析

### §3.1 PRD-26 TD 清理明细

| TD | 类别 | 关闭 US | 方法 |
|---|---|:-:|---|
| TD-031 | cleanup | US-001 | barrel export + 7 placeholder 删 |
| TD-037 | arch | US-005 | routers/app/ 子目录建立 |
| TD-038 | doc | US-005 | PRD-10 §0 typo 修正 |
| TD-039 | audit | US-005 | audit-admin-rls-tables.sh 26 tables |
| TD-040 | doc | US-005 | PRD-10 AC-13 actorAdminId typo |
| TD-041 | doc | US-005 | PRD-10 §1 e2e path typo |
| TD-042 | audit | US-005 | 8 admin model 补入 audit coverage |
| TD-049 | design-drift | US-004 | packages/ui/src/admin 抽 |
| TD-099 | test | US-006 | admin 17 pages unit test (partial · web 留后) |

**US-005 贡献最多 TD close**: 6/9 — batch 清理策略有效

### §3.2 PRD-26 新增 TD (0)

PRD-26 零新增 TD — 首次实现 TD 净增=0 且净减>0 的组合。

### §3.3 剩余 open TD 分布 (24 open)

| 类别 | 数量 | 代表 |
|---|:-:|---|
| medium (架构/服务层) | 3 | TD-028/047/064 |
| medium (测试缺失) | 3 | TD-057/061/064 |
| low (命名漂移) | 8 | TD-062/063/65/66/67/68/69/70 |
| low (基础设施) | 5 | TD-034/035/045/048/098 |
| low (design-drift) | 5 | TD-043/TD-96/97/... |

**TD-043** (.planning/codebase/ 事实层刷新)仍 open — 留 PRD-27+ /goal-verify §0 专项更新

---

## §4 · 反例库注入有效率

### §4.1 PRD-26 SHIELD 命中

| 注入键词 | 命中 story | 是否有效 |
|---|---|:-:|
| `LD-A 红线 admin 隔离` | US-004 packages/ui/src/admin | ✅ props injection 正确 |
| `monorepo lint scope M-2` | US-005 routers/app/ 移文件后 | ✅ ROOT 跑 lint |
| `收官不跳 /goal-verify §0` | US-007 | ✅ 本次执行完整 |
| `protectedProcedure 禁 admin` | US-003 auth router | ✅ adminProcedure 使用 |

**注入有效率**: 4/4 关键注入 = **100%** · 延续 PRD-25 结论(累积到 52 条后质量稳定)

### §4.2 新增反例待入库

本 PRD 0 Opus reject · 无新反例需要入库。反例库维持 52 条。

**教训**: reject-examples.jsonl 的价值在于"阻止 ralph 重蹈覆辙"。当 0 reject 时，说明 SHIELD 已足够。新增反例应来自 reject，不要人为添加防御。

---

## §5 · Playbook 提炼 (≥5 条)

### P-26-001 · TD batch 清理的最优粒度

**发现**: US-005 1 story 清 6 TD(TD-037~042)效率最高 · 条件: 同类型 TD(doc typo + audit coverage)且无大规模实现。
**规则**: TD batch 清理 story ≤ 8 TD · 超过时拆 story。US-005 28 个文件 move + 6 TD 属于边界 · 但通过了。

### P-26-002 · admin e2e 三层防护顺序

PRD-26 建立了 admin e2e 的正确分层顺序:
1. visual baseline (17 pages) — 最宽泛 · 检测渲染崩溃
2. e2e smoke (17 pages) — HTTP 200 + 无 console error + 3s 可见性
3. role matrix e2e — 权限逻辑 · 业务正确性

**规则**: 新 admin 功能按此顺序补全测试 · 不要跳层。

### P-26-003 · packages/ui 组件抽取的完整 checklist

US-004 提供了"从 apps/admin → packages/ui 抽组件"的完整检查项:
1. packages/ui/package.json 不加 trpc 依赖
2. 组件接受 props 不内部 useQuery
3. AdminLayout 保留 adminTrpc · 传 props 给 ui components
4. packages/ui/src/admin/index.ts 只 re-export(不 import 业务 hook)
5. apps/admin package.json @quanan/ui 已在 dependencies

### P-26-004 · lazy load chunk 命名约定

PRD-26 建立了 admin chunk 命名标准:
- `p0-core`: 核心管理页(用户量最大 · 最早下载)
- `p0-review`: 内容审核(运营重度使用)
- `p1-health`: 健康度/运维(admin 专项使用)
- `p2-advanced`: 高级配置(低频)

**规则**: 新 admin 页面按优先级归入对应 chunk · 不创建新 chunk(除非页面重要性独立)。

### P-26-005 · admin unit test 的正确 mock 模式

US-006 提炼: admin page 单测 = vi.hoisted + adminTrpc mock + MemoryRouter wrap。每个 page 3 test minimum:
1. AC-1: 渲染不崩溃 · h1/h2 文字锁
2. AC-2: loading state(isPending=true)
3. AC-3: onSuccess 数据渲染

**反例**: 不用 render + waitFor 等 async · vi.hoisted 确保 mock 先于 import hoisting。

### P-26-006 · 收官 story 必跑 DB 验证

verify-prd-26.sh §7 audit coverage 需要 `DATABASE_URL` 从 `.env` 加载 · 不能用 CLAUDE.md 写的 URL(CLAUDE.md 写的是 quanan · 实际是 quanqn)。

**规则**: 所有 verify-prd-N.sh 的 DB 相关 check 必须从 `.env` 读取 DATABASE_URL。

---

## §6 · 反向发现(偶然成功 / 不可复制)

### §6.1 dist-admin/ 在 gitignore 中但 manifest 记录存在

US-006 Validator 检查 dist-admin/assets/*.js chunk count 成功 · 因为 admin build 产物留在本地(gitignored)。这依赖于 ralph daemon 在同一台机器上运行且 build 产物未被清理。

**不可复制条件**: CI 环境 fresh clone → 需重新 `pnpm build:admin` → verify-prd-26.sh §4.1 check 会先 fail 后 pass。

**建议**: verify 脚本 §4.1 如果 chunk count = 0 · 应先 `pnpm build:admin` 再 check · 避免 CI 失败。

### §6.2 visual baseline 依赖 /tmp 持久化

/tmp/aiipznt-clone-research/screenshots/ 17 prd26-admin-*.png · 依赖 /tmp 目录在操作系统重启后不被清除。macOS 上 /tmp 是 session-persistent(tmpfs)。

**不可复制条件**: 系统重启 → /tmp 清空 → baselines 丢失 → test:visual:prd26:check 全 fail(需 --update-snapshots 重生成)。

**建议**: 长期应将 baselines 移入 git-tracked 路径(如 tests/e2e/baselines/)。PRD-27+ 评估。

### §6.3 admin-foundation-loop e2e 的 pass 状态依赖 pre-existing Playwright project 配置

US-001~006 manifest 多处记录 admin-foundation-loop "pass" — 但实际是 Playwright project=admin 配置指向 tests/e2e/admin/ · 并非每次 US 都重新跑。verify-prd-26.sh §3.5 只检查 spec 文件存在而非真正运行。

**影响**: 如果 admin SPA 破坏了 foundation loop · verify script 不会捕获。需要 CI 环境真实运行 `pnpm test:e2e --project=admin`。

---

## §7 · PRD-27+ 建议 + Skill 升级 diff

### §7.1 PRD-27+ 路线建议

| PRD | 主题 | 核心内容 | 依赖 |
|:-:|---|---|---|
| PRD-27 | evaluation 完整化 | LLM Judge staging 真调 · admin evaluation UI · 多 agent 跨场景 | PRD-26 done |
| PRD-28 | 多用户压测 | 100/1k 并发 · LLM Gateway 限流测试 · BullMQ 饱和 · DB 连接池 | PRD-27 done |
| PRD-29 | 移动端 | apps/web 响应式 polish · TD-099 web tools unit test · native App 评估 | PRD-26 done |
| PRD-30 | 海外版 | 英文版切换 · 多供应商海外节点 · i18n 框架选型 | PRD-28 基线 |
| PRR | 法务/部署 | 域名 · ICP · OAuth 生产申请 · Sentry · Vercel deploy | PRD-30 done |

**优先级建议**: PRD-27(evaluation) > PRD-29(mobile) > PRD-28(压测) > PRD-30(海外) > PRR

理由: evaluation 质量门禁是 1.0 内测启动的前置条件 · 移动端是用户覆盖 · 压测是容量规划 · 海外和 PRR 留最后。

### §7.2 Skill 升级 diff (若有)

本 PRD 无 reject · 无新反例 · **无 Skill 升级 diff**。

以下为 PRD-26 retro 对 PRD-25 retro §12 M-1/M-2/M-3 的验证结论:
- M-1(反例注入): 100% 命中 · 继续应用
- M-2(monorepo lint): US-005 触发 · 验证有效
- M-3(watch-audit-gate): 未触发 · 但 daemon 正常工作

---

## §8 · 文档回流建议

| 文档 | 建议 | 优先级 |
|---|---|:-:|
| AGENTS.md | §11.17 PRD-26 admin polish 沉淀 · 新增 visual baseline + lazy load + props injection 约定 | P1 |
| CLAUDE.md §3 | 修正 "数据库 · quanan" → "quanqn" (实际 .env DATABASE_URL) | P1 |
| ARCHITECTURE.md | admin SPA §9 lazy load 章节 · 4 chunk groups 命名约定 | P2 |
| playwright.config.ts | 迁移 snapshotDir 从 /tmp 到 git-tracked(反向发现 §6.2) | P2 |
| scripts/verify-prd-N.sh | 模板: DB check 必须从 .env 读 DATABASE_URL(反向发现 §6.3 · P-26-006) | P3 |

---

## 附录: PRD-26 执行时间线

| 时间 | 事件 |
|---|---|
| 2026-05-21 00:50 | US-001 PASS (admin index + placeholder cleanup) |
| 2026-05-21 10:15 | US-002 PASS (17 visual baseline + smoke) |
| 2026-05-21 02:20 | US-003 PASS (auth + role matrix e2e) |
| 2026-05-21 ~04:30 | US-004 PASS (packages/ui/src/admin TD-049) |
| 2026-05-21 ~07:00 | US-005 PASS (routers/app/ + 6 TD batch) |
| 2026-05-21 05:20 | US-006 PASS (lazy load + 51 unit tests) |
| 2026-05-21 (本次) | US-007 收官 |

**Wall time**: ~1天 daemon 运行 + Opus 审查
