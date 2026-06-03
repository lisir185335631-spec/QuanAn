// PRD-10 US-002 · AdminRouter type for apps/admin tRPC client
// 现由 scripts/codegen-shadow.cjs 从真 AdminRouter【自动生成】扁平自包含 shadow(取代手写镜像)。
// 原手写 shadow 曾 load-bearing:真 AdminRouter(24 子 router × adminProcedure 7 道中间件)喂 createTRPCReact
// 超 TS 实例化上限、客户端类型被毒化("collides with a built-in method"),叠加 api @/ 自引用串扰。
// codegen 用「扁平化 + 自包含」同时解掉这两点 → 此处只 re-export 生成物,永不手写、零漂移。
// 改后端 router 后须跑 `pnpm codegen:shadow` 重生成;CI 有 regen-diff 检查兜底。
export type { AdminRouter } from './admin-router-types.generated';
