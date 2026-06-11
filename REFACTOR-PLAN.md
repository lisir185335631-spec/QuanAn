# QuanAn 重构方案 v1（2026-06-11 用户批准 · 执行形式：方案 A 混合）

> 依据：knowledge-base 四路机制级梳理（2026-06-11）+ PROJECT-PROFILE 画像驱动。
> 原则：正确性 > 质量门 > 体验 > 结构 > 文档收口；全程不改产品行为，视觉零漂移。
> 执行形式：R0/R7 会话直改；R1-R6 走 Ralph（每批一个 PRD：PRD-36 起）。

## 批次

| 批次 | 范围 | 验收 | 形式 |
|---|---|---|---|
| R0 卫生 | git rm _shot.mjs；移除 zustand 幽灵依赖；24MB stitch zip 移入 docs/assets/ | git 干净、typecheck 不变 | 直改 ✅2026-06-11 |
| R1 正确性四连修 | ①ContextAssembler 接通 4 个绕过的 Specialist（DeepLearn/PrivateDomain/Presentation/Monetization，恢复 R-11）②SpecialistRequest 增 userId 透传，消灭 23 处 userId:0 ③llmGateway.embed() 接通真实 embedding ④9 处 catch(()=>{}) 补日志 ⑤audit 脚本增 R-11 绕过检测 | judge 全过；限流 per-user 实测；grep 'userId: 0'=0；audit 新检测项过 | Ralph · PRD-36 |
| R2 api lint 清零 | 150 errors（92 unsafe-member-access 主体，workers/admin routers） | pnpm lint 全绿 | Ralph · PRD-37 |
| R3 真流式 | stream() 改 SDK 原生逐 token；CopywritingAgent 试点→stepData/voiceChat/privateDomain 推广；按 Specialist 灰度可回滚 | 首 token 延迟下降实测；三订阅 e2e 过 | Ralph · PRD-38 |
| R4 Gateway 统一 key/计费 | image-gen/embedding/tts/stt 四 worker 接 SystemConfig key 缓存 + cost_log | admin 改 key 即时生效；cost_log 全覆盖 | Ralph · PRD-39 |
| R5 视觉基线持久化 + PRD-35 收官 | snapshotDir 迁出 /tmp 入 git；重建基线；执行原 PRD-35（visual audit/Lighthouse/SEO） | CI 有基线；PRD-35 验收 | Ralph · PRD-40 |
| R6 前端结构债 | CanarySlider 合并入 packages/ui/admin；4 处镜像类型迁 packages/schemas；Step3.tsx 拆分试点；@quanan/ui/base 启动 | 视觉 diff=0 + typecheck + e2e | Ralph · PRD-41 |
| R7 文档收口 | DATA-MODEL→52 模型实况；SCAFFOLD 路径全替；LD-002/R-1 检测命令对齐 audit 脚本；ARCHITECTURE 路由矩阵 27 | 按文档审计无误报；compound-harness-docs 收口 | 直改 |

## 明确不动

AbExperiment/InviteCampaign 双表合并（原 P9.4 规划，不抢跑）；admin service 层拆分（R7 后可选）；任何 prompt 语义与产品功能。

## 风险与对策

R3 接口面大→按 Specialist 灰度+旧路径开关；R6 回归风险→必须在 R5 基线之后，视觉 diff=0 硬门禁；R4 动 key 链路→先共享缓存层验证再删 env 直读。

## 知识库锚点

画像：PROJECT-PROFILE.yaml（P2 创作容错/P9 多租户/P10 多Agent）。手册条目簇：8 记忆注入（R1①）、D9 成本（R1②，D9.3）、7 RAG/E6a（R1③）、11 输出流式（R3）、D2/D12（R4）、D1 模块化（R6）。经验回流：每批收口按 knowledge-base 复利回流 SOP。
