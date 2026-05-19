# @quanan/admin · 管理后台 SPA(占位)

> **当前状态** · P0 占位 · 仅目录骨架就位 · 实施留 P9.0(参 ADMIN-ARCHITECTURE.md §8.2)
> **触发** · 主应用 P8(PRD-9 知识库)完成后启动 · ADMIN-ARCHITECTURE.md §8.7 协同节奏
> **独立** · 独立 OAuth(Google Workspace Internal · @quanan.com 限定)+ WAF IP 白名单 + 独立子域名 admin.quanan.com(参 ADR-021)

---

## 实施清单(P9.0 启动前阅读)

- [ADMIN-ARCHITECTURE.md](../../ADMIN-ARCHITECTURE.md) · 整个文档(114K · 9 章 · 16 业务管理域)
- [SCAFFOLD.md §A.1](../../SCAFFOLD.md) · admin SPA 完整目录树 · 13 路由组对应 16 业务管理域
- [DATA-MODEL.md §13](../../DATA-MODEL.md) · 13 admin 表 schema + RLS bypass 策略
- [AGENTS.md §10](../../AGENTS.md) · admin 5 LD-A + 6 R-A + 14 高风险约束
- [ADR.md ADR-019/020/021](../../ADR.md) · monorepo + 双 daemon + admin 独立部署

---

## 路线图(P9.0 ~ P9.4 · 9w)

| Phase | 周 | PRD | 关键产出 |
|:-:|:-:|---|---|
| P9.0 | 17 | PRD-10 | apps/admin 骨架 + 6 闸鉴权链 stub + admin_audit_log |
| P9.1 | 18-20 | PRD-11 | 6 P0 业务核心域(NSM/用户/账号/成本/审计/邀请码) |
| P9.2 | 21-22 | PRD-12 | 2 P0 内容审核域(TrendingItem/DeepLearning) |
| P9.3 | 23-24 | PRD-13 | 5 P1 健康度域(进化/Prompt/配额/合规/Approval Gates) |
| P9.4 | 25 | PRD-14 | 3 P2 高级域(A/B/常量/配置中心) |

---

## 不要在 P9.0 之前动这个目录

- 主应用 PRD-1 ~ PRD-9 实施期 · `apps/admin/` **必须保持空骨架**
- 主应用 ralph daemon 跑代码时 · 不应触及 apps/admin/(red line · AGENTS §10 LD-A-1)
- 任何"提前在 admin 写代码"的尝试 · 走 PRD-MASTER §3.10 实施期改动协议
