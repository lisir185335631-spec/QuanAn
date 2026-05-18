# Technology Stack · apps/admin

**Analysis Date:** 2026-05-13

## Languages

**Primary:**
- TypeScript 5.6+ - 全部源码 (.ts / .tsx)
- TSX (React JSX) - 所有 UI 组件

**Secondary:**
- CSS - `apps/admin/src/styles/admin.css` (Aurelian Dark token + Grid Layout)
- HTML - `apps/admin/index.html` (Vite 入口模板 · 13 行)

## Runtime

**Environment:**
- Browser - 现代浏览器 (`tsconfig.base.json` target ES2022 + lib DOM)
- 不支持 SSR (Vite SPA · 纯 client-side render)
- Node 24.15+ (开发期 · Vite + tsc 跑在 Node)

**Package Manager:**
- pnpm 9.15.9 - workspace 模式 (`workspace:*` / `workspace:^` 协议)
- Lockfile: `pnpm-lock.yaml` (在 monorepo 根 · 未在 `apps/admin/` 单独锁定)

## Frameworks

**Core (apps/admin/package.json:13-25):**
- React 18.3.1 - UI runtime
- React DOM 18.3.1 - DOM render + createPortal (Drawer)
- React Router DOM 6.27.0 - 客户端路由 (BrowserRouter / Routes / Route / NavLink / useSearchParams / useNavigate / Outlet / Navigate)

**Data Fetching:**
- @tanstack/react-query 5.59.0 - server state cache + staleTime + refetchInterval
- @trpc/client 11.0.0-rc.0 - HTTP batch link · credentials:'include'
- @trpc/react-query 11.0.0-rc.0 - createTRPCReact 桥接 React Query
- @trpc/server 11.0.0-rc.0 - 仅为 type-only import 用 (`AdminRouter` 类型)

**Visualization:**
- Recharts 3.8.1 - FunnelChart / BarChart / PieChart / LineChart 业务图

**Virtualization:**
- @tanstack/react-virtual 3.13.24 - DenseTable 32px row 虚拟滚动 (>100k 行平滑)

**Testing:** ⚠️ 未配置 (无 vitest / jest / playwright 依赖)

**Build/Dev:**
- Vite 5.4.10 - dev server (port 5174) + production build
- @vitejs/plugin-react 4.3.3 - Fast Refresh + JSX transform
- TypeScript 5.6+ - tsc 类型检查 (build script 先 tsc 再 vite build)

## Key Dependencies

**Critical (workspace · 跨子项目共享):**
- @quanqn/ui workspace:^ - DenseTable + tokens + PdfBillTemplate + PdfForensicTemplate (`packages/ui/src/admin/`)
- @quanqn/clients workspace:* - AdminRouter 类型 (`packages/clients/src/admin-router-types.ts`)
- @quanqn/schemas (path alias 可用 · 当前 apps/admin 未直接 import)

**Infrastructure:**
- react / react-dom 18.3.1 - 基础运行时
- typescript 5.6+ - 类型系统
- vite 5.4.10 - 构建工具链

**DevDependencies (apps/admin/package.json:26-32):**
- @types/react 18.3.12
- @types/react-dom 18.3.1
- @vitejs/plugin-react 4.3.3
- typescript 5.6+
- vite 5.4.10

## Configuration

**TypeScript Compiler (extends `tsconfig.base.json`):**
- `strict: true` + 全套 strict* 子开关
- `noUncheckedIndexedAccess: true` (数组 / object index 强制 `T | undefined`)
- `noImplicitOverride: true` (ErrorBoundary class 加 `override`)
- `noImplicitReturns: true`
- `noUnusedLocals: true` / `noUnusedParameters: true`
- `useUnknownInCatchVariables: true`
- `verbatimModuleSyntax: true` (`import type` 强制)
- target: ES2022 · module: ESNext · moduleResolution: Bundler · jsx: react-jsx

**TypeScript Paths (apps/admin/tsconfig.json:5-13):**
- `@/*` → `./src/*` (业务页 · `import { adminTrpc } from '@/lib/admin-client'` · 见 `pages/Login.tsx:8`)
- `@quanqn/schemas` / `@quanqn/schemas/*` → `../../packages/schemas/src`
- `@quanqn/ui` / `@quanqn/ui/*` → `../../packages/ui/src`
- `@quanqn/clients` / `@quanqn/clients/*` → `../../packages/clients/src`

**Vite Config (apps/admin/vite.config.ts):**
- React plugin
- `@` alias resolve to `src/`
- dev server port 5174 (主应用 apps/web 用 5173 · 隔离避免冲突)
- build outDir `dist-admin` + emptyOutDir true

**Environment Variables (Vite import.meta.env):**
- `VITE_API_BASE_URL` (可选 · 默认 `http://localhost:3000`) · 见 `apps/admin/src/lib/admin-client.ts:21` + `apps/admin/src/pages/users/index.tsx:261`
- `import.meta.env.DEV` (Vite 内置 · 用于 Login mock OAuth 按钮的 dev-only 显示 · 见 `pages/Login.tsx:90`)
- 当前未发现 `apps/admin/.env*` 文件 (未在 apps/admin/ 检测到 .env 配置 · 走 Vite 默认 + 上级目录)

**Build Configuration:**
- `pnpm build` → `tsc && vite build` (先类型检查 · 类型错误阻塞)
- `pnpm dev` → `vite` (dev server 5174 · HMR)
- `pnpm typecheck` → `tsc --noEmit`
- `pnpm lint` → `eslint src --ext ts,tsx --max-warnings=0` (零警告门禁)
- `pnpm preview` → `vite preview` (本地预览 build 产物)

## Platform Requirements

**Development:**
- Node.js 24.15+ (推荐 LTS / Node 22)
- pnpm 9.15+ (workspace 协议要求 pnpm ≥ 7)
- 浏览器 · Chrome / Edge / Safari 最近 2 版本 (Vite ESM dev server 要求)
- 后端 · `apps/api` 跑在 port 3000 (admin-client.ts 默认 VITE_API_BASE_URL)

**Production:**
- 部署目标 · admin.quanqn.com 独立子域名 (ADR-021)
- 部署方式 · 静态站 (dist-admin/ 上 CDN / Vercel static)
- Backend 路径 · `/trpc/admin/*` (与主应用 /trpc/user 同源 / 不同 router)
- WAF / IP 白名单 · 上线前 PRR 阶段配置 (当前 stub · StatusBar 显示 `WAF=stub`)
- OAuth · Google Workspace Internal (@quanqn.com 限定 · 当前 mock · stub button disabled · 见 `pages/Login.tsx:111`)
- TLS · HTTPS 强制 (production 部署平台默认)

## Browser API Usage

**Standard:**
- `fetch()` - tRPC httpBatchLink override (credentials include) + CSV 导出 (`users/index.tsx:268`)
- `Blob` / `URL.createObjectURL` / `<a>.click()` - 文件下载 (CSV / PDF) · `cost/index.tsx:172-180` / `users/index.tsx:274-285` / `audit/index.tsx:117-128`
- `atob()` - base64 → Uint8Array 转换 (PDF) · `cost/index.tsx:171` / `audit/index.tsx:119`
- `document.createPortal` - AuditDrawer + 部分 modal 直接 createElement (showToast)
- `KeyboardEvent` (ESC) - AuditDrawer 关闭 · `components/admin/AuditDrawer.tsx:36`
- `localStorage` / `sessionStorage` - 未使用 (state 走 URL params + cookie)
- `WebSocket` - 未使用 (轮询为主 · 30s refetchInterval)

## tRPC + Auth Stack

**Client (apps/admin/src/lib/admin-client.ts):**
- `createTRPCReact<AdminRouter>()` - 类型从 @quanqn/clients 取
- `httpBatchLink({ url: '/trpc/admin', fetch: ... credentials:'include' })`
- `new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } })`
- 全局 30s staleTime · 单次 retry · 业务页可 override (e.g. CostAlertsPanel staleTime 30s + refetchInterval 60s)

**Session:**
- lucia-auth session cookie (后端 issue)
- Frontend 透明 · 靠 `credentials: 'include'` 自动带 cookie
- 401 当前未做前端拦截 · 由后端强制跳 /login (UX gap · TD)

**Authorization (前端):**
- `adminTrpc.auth.me.useQuery()` 返回 `{ email, role }` · role 字符串 (`super_admin` / `admin` / `readonly_admin`)
- 业务页根据 role 隐藏 action chip / 显示审批通道 (e.g. `ChangePlanDialog.tsx:72` 提示文案区分)

---

*Stack analysis: 2026-05-13*
