# PRD-3 · P2 路由 + 首页

> **派生** · ARCHITECTURE §9.4 + §2.5/§2.6 6 新模块 + §4.6 IPProgressService + spec.md §Ⅴ 全局 + §Ⅵ 首页
> **风险** · medium · **依赖** · PRD-2 ✅ · **预估** · 1 周 · 6 US

## §0 引用

| 维度 | 来源 |
|---|---|
| 业务 | ARCHITECTURE §2.4(14 工具)+ §2.5(6 新模块)+ §3.6.4(34 路由) |
| UI | ui/ 60+ 设计稿 + Aurelian Dark token(PRD-1 US-004 已就位) |
| 数据 | DATA-MODEL · 17 router 全 PRD-2 mock 就位 |
| 接口 | ARCHITECTURE §3.2 53 procedure(PRD-2)· PRD-3 前端调 |
| 退出 | ARCHITECTURE §9.4 · 34 路由可达 + 切账号 + /ip-plan 0/9 |
| 沉淀 | .planning/retros/PRD-2-RETRO.md · 5 节 Patterns + 36 反例 |

★ 继承 PRD-2 ·
- TD-012 合并 · hooks 改调 ipAccounts/stepData · 删 account/step alias router(US-001 顺带)
- LS↔DB hooks 就位 · PRD-3 用现成
- protectedProcedure 走 RLS · 已可用

## §1 用户故事

**US-001 · 合并 TD-012 + React Router setup + 34 路由 config**(medium)
- 删 apps/api/src/trpc/routers/{account,step}.ts(alias 重复)
- hooks 改调 trpc.ipAccounts.switchActive / trpc.stepData.save
- React Router v6 createBrowserRouter · 34 路由 config(9 step + 14 工具 + 6 新 + 3 辅助 + 1 /ip-plan + 1 /accounts)
- 路由懒加载(React.lazy + Suspense)

**US-002 · 9 step 页 + 14 工具页占位**(medium)
- apps/web/src/pages/step/{1..9}.tsx · h1 + 占位卡片
- apps/web/src/pages/tools/{14}.tsx · 占位 + 调用 mock router
- 全用 Aurelian Dark token + shadcn 组件

**US-003 · 6 新模块 + 3 辅助页占位**(medium)
- /diagnosis · /daily-tasks · /evolution · /accounts · /my-topics · /history(6 新)
- /knowledge · /trending · /settings(3 辅助)
- 全占位 · 调 mock router

**US-004 · IP 账号切换器(Header 集成 · reload + 预热)**(medium · ★ ARCHITECTURE 风险点)
- AccountDropdown 改调 trpc.ipAccounts.switchActive · 切账号 reload(window.location.reload)
- 切换前预热 · 调 ipAccounts.list 拿全列表 · 切完 reload 后 useActiveAccount 立读新值
- clearLsNamespace 调 · 切账号清旧 LS namespace(REJ-010)

**US-005 · /ip-plan 进度可视化(IPProgressService)**(medium)
- IPProgressService 计算当前 account 的 9 step 完成数
- UI · 9 step 进度条 + 当前 step 高亮 + 0/9 默认
- 接 stepData.progress procedure(PRD-2 已有)

**US-006 · 反馈按钮 placeholder + 路由 e2e 测试**(medium)
- 全 step 页加 Feedback 按钮 · 点后写 trace_id 到 cost_log(P0 仅 trace · 实 evolve 留 PRD-7)
- e2e · 34 路由可达 / 切账号 / /ip-plan 显示 / lint clean
- 删 account/step alias router 后 typecheck + tests 全过

## §2 AC

每 US 4 类 AC(简化版):

### AC-001 React Router + 34 路由
- H · createBrowserRouter 34 路由 · 全可访问(URL 直输 + 跳转)
- E · 路径不存在 → /404 page
- B · 嵌套路由 nested · 共享 Header layout
- P · 首屏 < 2s · 路由切换 < 200ms · 懒加载 chunk

### AC-002 9 step + 14 工具占位
- H · 每 page 渲染 h1 + 占位文字 + Aurelian Dark 主题
- E · 页面 crash · 全栈 error boundary 兜底
- B · 移动端响应式 · ≤640px 不 break
- P · 单 page render < 16ms

### AC-003 6 新 + 3 辅助
- H · /diagnosis 调 trpc.diagnosis.latest 显示 mock · /knowledge 调 knowledge.getRecommendations
- 同上(简化)

### AC-004 IP 账号切换器
- H · 用户点 AccountDropdown · 选新账号 · trpc.ipAccounts.switchActive · clearLsNamespace · window.location.reload · 新账号生效
- E · switchActive 失败 toast 提示 · 不 reload
- B · 切到当前账号 · 幂等(不 reload)
- P · 切账号总耗时 < 1s

### AC-005 /ip-plan 进度
- H · 显示 9 step 进度条 · 0/9 默认 · 完成 step 高亮
- E · stepData 加载失败 · skeleton 占位
- B · 切账号后 progress 重新加载
- P · /ip-plan 首屏 < 1s

### AC-006 反馈 + e2e
- H · 反馈按钮点击 → cost_log 写 traceId · 不报错(P0 仅打 trace)
- e2e · 34 路由可达 + 切账号正确 + /ip-plan 0/9
- typecheck + lint clean
- 全 tests pass

## §3 范围排除

| # | 不做 | 理由 |
|:-:|---|---|
| 1 | 真 Specialist 调用 · 仍走 mock | PRD-4 P3 实施 |
| 2 | 反馈按钮真接 evolve | PRD-7 P6 实施 |
| 3 | UI 完整设计落地(spec.md §Ⅵ 首页详情) | PRD-3 仅占位 · 美化留 PRD-4 |
| 4 | admin 任何代码 | P9.0 留 |

## §4 风险

| # | 风险 | 缓解 |
|:-:|---|---|
| 1 | 切账号 reload 副作用(LS / SW cache 不清)| US-004 clearLsNamespace + reload + 预热 |
| 2 | 34 路由懒加载 chunk 太碎(性能差)| 同模块路由共享 chunk(/step/* 一个 chunk)|
| 3 | TD-012 合并漏调用点 | typecheck 兜底 |

## §5 测试

- 单元 · ≥ 10(IPProgressService + 切换器逻辑 + 路由 config)
- 集成 · 2(切账号 LS↔DB 同步 + cost_log 写)
- E2E · 4(34 路由可达 + 切账号 + /ip-plan + 反馈)

## §6 退出条件

ARCHITECTURE §9.4 ·
- 34 路由全部可达 ✅
- 切账号正确(reload + 预热)✅
- /ip-plan 显示 0/9 进度 ✅

加 · TD-012 合并 + lint clean + typecheck

## §7 修订
- v0.1 · 2026-05-08 12:00 · prd skill (Opus) · 简化版(context 71% 节省)
