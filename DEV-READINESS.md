# QuanQn · 开发阶段就绪度审计(Dev Readiness)

> **版本** · v0.2(2026-05-07 · 从 PRODUCTION-READINESS.md v0.1 收窄而来)
> **范围** · **只看开发阶段** · 不包括上线后的跨开发工作(部署 / 法务 / 合规 / 监控 / 运营 / 财务 / 应急 / 团队招聘)
> **角色** · 距离"能跑通 14 PRD 实施"还差什么 · 8 维度盘点(从 v0.1 16 维度筛 · 砍 8 跨开发)
> **跟其他 review 的差别** ·
> · ARCHITECTURE-REVIEW.md · 只看架构文档质量
> · PRD-MASTER §0 review · 只看 PRD 模式启动条件
> · **本文件 DEV-READINESS · 只看开发期** · 能不能写代码 / 跑 Ralph / 完成 14 PRD 实施
> · 上线 prod 的事(部署 / ICP / 合规 / 法务 / 商业)· 不在本文范围 · 待开发完成后再单独做 PRR

---

## 🚀 TL;DR · 1 分钟读懂

```
开发阶段就绪度 · ≈ 40%(从全周期 20% 重算 · 砍掉跨开发 8 维度后重新加权)
  ✅ 文档齐(9 文档 · 1.4MB · 16 章节体系)
  ✅ 工具链命令齐(6 commands + reject-examples 35 条)
  🟠 工具链文件缺(scripts/ralph/ 空目录 · 必跑 sync-to-project.sh)
  🔴 0 行业务代码(src/ 仅 20 个空骨架文件)
  🔴 git 还没 init(没版本控制!)
  🔴 monorepo 没拆(apps/ packages/ 都不存在)
  🔴 prisma schema 缺 admin 13 表
  🔴 PRD-N 一份没写

距离"能开始 PRD-1 跑 Ralph daemon" ·
  · 时间 · ~1.5 天(7 件全是我能做的 · 详 §3)
  · 阻塞 · 0 个外部依赖(不依赖你买域名 / 备案 / OAuth · 那些是上线前的事)

距离"14 PRD 全跑完(MVP + 主应用全 + admin)" ·
  · 时间 · 25 周(严格串行 · 单 daemon · 方案 A · 详 PRD-MASTER §7.4)
  · 钱   · 主要 LLM 成本 ¥50-100K · 含 Ralph 跑代码 + Opus audit + LLM Judge

P0 立即可做 7 件(纯代码 / 工具链 / 文档 · 全部我能做) ·
  ① git init + .gitignore(5 分钟)
  ② sync ralph 工具链(1 小时)
  ③ 拆 monorepo workspace(0.5 天)
  ④ prisma schema 加 admin 13 表(0.5 天)
  ⑤ migrations/manual_admin_rls.sql 创建(30 分钟)
  ⑥ scripts/ralph/switch-prd.sh 落地(5 分钟)
  ⑦ 写 PRD-1(prd skill · 1-2 小时)

跑完上面 7 件 → ralph.py --daemon 启动 → 进入 PRD-1 实施

下一步 · §3 P0 7 件 · §4 主开发路线图 · §6 立即可做 3 动作
```

---

## 文档地图

| § | 章节 | 一句话 |
|:-:|---|---|
| §0 | TL;DR + 开发就绪度 | 8 维度 ≈ 40% · 文档齐 + 代码 0% |
| §1 | **8 维度逐条评估** ★ | 从 16 维度砍 8 跨开发 · 留下 8 开发相关 |
| §2 | **7 项硬需求对照(开发视角)** ★ | 你的 7 项 vs 当前(只看开发达成度) |
| §3 | **P0 立即可做 7 件** ★ | 全部我能做 · 1.5 天完成 · 不需外部依赖 |
| §4 | 主开发路线图(25 周 · 14 PRD)| MVP 5w → 主全功能 11w → admin 9w |
| §5 | 开发期成本 / 时间 / 人力 | 只算开发期 · 不含上线后 |
| §6 | 立即可做的 3 个动作 | A 我立即跑 / C 看完再决定 / D 重新审视范围 |

---

## §1 8 维度逐条评估(实测 2026-05-07 · v0.2 已收窄到开发期)

> 评级 · ✅ 已就位 / 🟡 部分(>50%)/ 🟠 缺关键(20-50%)/ 🔴 完全缺位(<20%)

### §1.1 设计与文档层(7 维度 · 大致就绪)

#### 维度 1 · 设计文档 · ✅ 就绪 95%

| 项 | 状态 | 实测证据 |
|---|:-:|---|
| ARCHITECTURE.md | ✅ | 199K · 9 章 · v0.4(双 daemon 修订完成) |
| ADMIN-ARCHITECTURE.md | ✅ | 114K · 9 章 · v0.2 |
| DATA-MODEL.md | ✅ | 144K · 13 节 · 31 实体定义 |
| PROMPTS.md | ✅ | 80K · 14 Specialist |
| SCAFFOLD.md | ✅ | 25K · v0.2 monorepo 强制 |
| ui/ 设计稿 | 🟡 | 66 子目录 · 但 14 工具页中 10 个无专属稿(参 PRD-MASTER §5.3) |
| aiipznt-spec.md | ✅ | 322K · 复刻基线 |

**还差** · ui/ 10 个工具页设计稿(P5 启动前补齐 · 详 §3 路线图)

#### 维度 2 · 工程约束 · ✅ 就绪 95%

| 项 | 状态 | 证据 |
|---|:-:|---|
| AGENTS.md | ✅ | 111K · 10 章 · 18 LD + 17 R + 5 LD-A + 6 R-A |
| ADR.md | ✅ | 82K · 21 ADR(含 ADR-019/020/021)|
| 21 ADR 全部 Accepted | ✅ | grep 验证 |

**还差** · 0(完整就绪)

#### 维度 3 · PRD 体系 · 🟠 缺关键 30%

| 项 | 状态 | 证据 |
|---|:-:|---|
| PRD-MASTER.md(总纲)| ✅ | 1827 行 · v0.2 修订完成 · 9 章 + TL;DR |
| 14 PRD-N 文件 | 🔴 | **`tasks/` 目录不存在** · 0 份 PRD 已写 |
| 反例库 | ✅ | 35 条已写入 ~/.claude/playbooks/reject-examples.jsonl |

**还差** · 14 份 tasks/prd-N.md(预估每份 1-2 小时 prd skill · 总 14-28 小时)

#### 维度 4 · Coding 3.0 工具链 · 🟠 缺关键 60%

| 项 | 状态 | 证据 |
|---|:-:|---|
| 6 commands | ✅ | prime / create-rules / goal-verify / prd-retro / monitor-ralph / plan-check 全在 ~/.claude/commands/ |
| prd skill / ralph skill | ✅ | ~/.claude/skills/prd/ + ~/.claude/skills/ralph/ |
| reject-examples.jsonl | ✅ | 35 条(本会话刚写入)|
| **scripts/ralph/ 工具集** | 🔴 | **空目录** · ralph.py / dashboard.py / VALIDATOR.md / CLAUDE.md / OPUS-AUDIT-CHEATSHEET.md / AUDIT-CHECKLIST-TEMPLATE.md / TECH-DEBT-SCHEMA.md / ralph-tools.py / dashboard.html / dashboard-p.html / audit-artifacts.py 等都没复制 |

**还差** · 跑 `~/.claude/scripts/ralph/sync-to-project.sh` 一键同步(1 小时)· P0 必做(详 §3-2)

### §1.2 代码与基础设施层(5 维度 · 几乎全空)

#### 维度 5 · 代码 · 🔴 完全缺位 5%

| 项 | 状态 | 证据 |
|---|:-:|---|
| package.json + 依赖锁定 | ✅ | 109 deps · 跟 AGENTS §2 锁定一致 |
| Vite / TS / Tailwind / Prettier 配置 | ✅ | vite/tsconfig/tailwind/prettier 全在 |
| **monorepo workspace** | 🔴 | **apps/ packages/ pnpm-workspace.yaml 都不存在** |
| src/ 业务代码 | 🔴 | **仅 20 个文件 · 全部是骨架占位 · 0 行业务实现** |
| **git 仓库** | 🔴 | **`.git` 不存在 · 项目没 init git!** |

**还差** · 几乎全部 · 详 §3 路线图

#### 维度 6 · 数据库 · 🟠 缺关键 30%

| 项 | 状态 | 证据 |
|---|:-:|---|
| prisma/schema.prisma | 🟡 | 626 行 · 18 model 定义(主应用)· **缺 DATA-MODEL §13 13 admin 表** |
| migrations/manual_rls.sql | ✅ | 主应用 12 RLS · 文件存在 |
| migrations/manual_vector_indexes.sql | ✅ | pgvector ivfflat 索引 |
| migrations/manual_admin_rls.sql | 🔴 | **没创建**(DATA-MODEL §13.8 已设计 · 但文件不存在)|
| seed.ts | ✅ | 文件存在 |
| 实际 DB 实例(Supabase / Neon / 自管 PG)| 🔴 | **没创建** |
| pgvector 扩展 | 🔴 | 未启(依赖 DB 实例)|
| Redis 实例 | 🔴 | 未创建 |
| S3 / OSS Bucket | 🔴 | 未创建 |

**还差** · admin 13 表 schema 加到 prisma · DB 实例创建 · Redis + S3 创建(详 §3-4)

#### 维度 7 · 测试体系 · 🔴 完全缺位 10%

| 项 | 状态 | 证据 |
|---|:-:|---|
| tests/ 4 子目录 | ✅ | unit / integration / e2e / llm-judge 都在 |
| vitest.config.ts | ✅ | 文件存在 |
| playwright.config.ts | ✅ | 文件存在 |
| **实际测试用例** | 🔴 | **0 个 .test.ts 文件**(`find tests/ -name '*.test.*' \| wc -l` = 0)|
| LLM Judge 100 金标准 | 🔴 | 0 条(参 PRD-MASTER §4.4 双轨方案 · 还没写) |

**还差** · 跟着 PRD 实施滚动写(主线 200+ 单元 / 60-80 集成 / 18-20 E2E / 100 Judge · 25 周内)

#### 维度 8 · 部署 · 🔴 完全缺位 0%

| 项 | 状态 | 备注 |
|---|:-:|---|
| 域名 quanqn.com | 🔴 | **未购买** · 必须先买 |
| DNS 配置(www / admin / api 子域名) | 🔴 | 未配 |
| Vercel / Cloudflare Pages 项目 | 🔴 | 未建 |
| Railway / Fly.io 后端项目 | 🔴 | 未建 |
| Supabase / Neon 数据库托管 | 🔴 | 未建 |
| WAF IP 白名单(admin) | 🔴 | 未配 |
| CDN | 🔴 | 未配(Vercel / CF 自带) |
| .env.production 模板 | 🟡 | .env.example 在 · 但 .env.production 等敏感配置未准备 |

**还差** · 全部 · 详 §3-5

#### 维度 9 · 安全 · 🔴 完全缺位 5%

| 项 | 状态 | 证据 |
|---|:-:|---|
| 主应用 OAuth 应用申请 | 🔴 | Google Cloud Console 未建 |
| admin OAuth 应用申请(独立)| 🔴 | 同上 |
| Workspace Internal 限定(@quanqn.com)| 🔴 | 域名都没买 |
| MFA(super_admin 强制)| 🔴 | 未实施 |
| IP 白名单(WAF)| 🔴 | 未实施 |
| Approval Gates 代码 | 🔴 | 未实施(PRD-13 P9.3 时实施)|
| 加密(HTTPS / 静态资源签名)| 🔴 | Vercel/CF 自带 · 但需配 |
| 安全审计日志 | 🔴 | admin_audit_log 表设计了 · 实际表未建 |

**还差** · 几乎全部 · 详 §3-6 + §3-7

### §1.3 ~ §1.4 跨开发维度(★ 2026-05-07 v0.2 砍掉)

> 原 v0.1 评估了 8 个跨开发维度(合规 / 监控 / 运营 / 法务 / 财务 / 团队 / 应急 / 部署)·
> v0.2 收窄为"只看开发阶段" · 这 8 维度全部砍掉 · 留待开发完成后单独做 PRR(Production Readiness Review)。
>
> 当前对照视角:
> · 维度 8 部署 · 不在开发范围 · 仅本地 dev 环境跑就行
> · 维度 9 安全 · 不在开发范围(开发期 ralph + Opus audit + AGENTS § 红线已是工程级安全约束)
> · 维度 10 合规 · 不在开发范围(代码层 PII 脱敏由 PRD-2 实施时落地 · 但备案 / 隐私政策不是开发期事)
> · 维度 11 监控 · 不在开发范围(代码层 trace_id / pino logger 在 PRD-1/2 落地 · 但 Sentry / OTel 是上线前事)
> · 维度 12 运营 · 不在开发范围(NSM 仪表盘代码在 PRD-11 admin · 但客服流程 / 工单 不是开发事)
> · 维度 13 法务 · 不在开发范围(Trending 授权在 PRD-6 启动前必须签 · 但属于商业操作 · 非开发动作)
> · 维度 14 财务 · 不在开发范围(套餐定价 / 计费集成 是后续事)
> · 维度 16 应急 · 不在开发范围

> **跨开发 8 维度的留存** · 等开发主线 25w 跑完 · 进入上线准备阶段时 · 单独做新一份 PRR 文档处理。

<details>
<summary>(原 v0.1 §1.3 + §1.4 8 维度详情已折叠 · 仅留作记录)</summary>

#### 维度 10 · 合规 · 🔴 完全缺位 0%

| 项 | 状态 | 备注 |
|---|:-:|---|
| **隐私政策**(PRIVACY.md)| 🔴 | 文件不存在 · 上线前必须 |
| **用户协议**(TERMS.md)| 🔴 | 同上 |
| **ICP 备案** · 中国大陆服务 | 🔴 | 流程 1-3 周 · 必须工信部网站备案 |
| 公安备案 · 部分行业必备 | 🔴 | 同上 · 30 天内 |
| **行业合规免责模板** | 🟡 | ARCHITECTURE §9.11-D 写了规则 · 实际文案未起草 |
| PII 脱敏代码 | 🔴 | src/lib/compliance/pii-mask.ts 是占位 |
| 等保(若涉及金融 / 医疗 / 政企)| 🔴 | 未规划 |
| GDPR(若出海) | 🔴 | 未规划(1.0 仅中文) |

**还差** · 全部 · 详 §3-9

#### 维度 11 · 监控可观测性 · 🔴 完全缺位 5%

| 项 | 状态 | 证据 |
|---|:-:|---|
| pino logger 接入 | 🟡 | src/lib/logger.ts 占位 · 未串到全栈 |
| Sentry 接入 | 🔴 | grep "Sentry" 命中 0 处 |
| OpenTelemetry / Tempo | 🔴 | grep "OTel/opentelemetry" 命中 0 处 |
| Grafana Loki 日志栈 | 🔴 | 未配 |
| Plausible Analytics | 🔴 | 未配 |
| 钉钉 / Slack webhook | 🔴 | 未配 |
| Postgres audit_log 表 | 🟡 | DATA-MODEL §G 设计 · 实际表未建 |

**还差** · 跟代码并行 · 详 §3-8

#### 维度 12 · 运营 · 🔴 完全缺位 0%

| 项 | 状态 | 备注 |
|---|:-:|---|
| NSM 仪表盘代码 | 🔴 | admin 域 ① · PRD-11 时建(Week 18-20)|
| 客服流程文档 | 🔴 | 未规划 · 上线前必须 |
| 工单系统 | 🔴 | 未选型(自建 / Zendesk / 飞书工单) |
| 反馈邮箱 / 客服微信 | 🔴 | 未准备 |
| FAQ / 帮助中心 | 🔴 | 未规划(/guide 是 P8) |
| 发布公告 / changelog | 🔴 | 未规划 |
| **运营手册**(运营每天看什么 / 干什么)| 🔴 | 未起草 |

**还差** · 详 §3-10

#### 维度 13 · 法务 · 🔴 完全缺位 0%

| 项 | 状态 | 备注 |
|---|:-:|---|
| trending 第三方授权(新榜 / 蝉妈妈 / 飞瓜)| 🔴 | 月费 ¥5K-30K · 必须签合同(参 ADR-017)· P5 启动前必备 |
| LLM API 商业合同(Anthropic / OpenAI)| 🟡 | API key 可个人买 · 但生产级需企业账户(月用量大需 Enterprise)|
| 国内 LLM 备选(文心 / 通义 / DeepSeek)| 🔴 | 国内合规备案 · 上线前必备 |
| 商标(QuanQn / 全 Q · 中文 / 英文)| 🔴 | 未注册 · 1-3 个月 |
| 版权(原创内容 · UI 设计版权)| 🔴 | 未规划 |
| 增值电信经营许可证(ICP-VAS · 商业版必需)| 🔴 | 上线前必须(1-3 个月 + 50w+ 注册资本)|

**还差** · 详 §3-11(★ 时间最长的一类 · 必须早动)

### §1.4 商业与运维层(3 维度)

#### 维度 14 · 财务 + 商业 · 🟡 部分 40%

| 项 | 状态 | 证据 |
|---|:-:|---|
| 成本估算(三档:100/1k/10k 用户)| ✅ | ARCHITECTURE §9.12b · ¥1.5K/¥14.5K/¥145K 月度 |
| 收入模式(邀请制 + Free/Pro/Enterprise)| ✅ | ARCHITECTURE §9.12b + spec.md §1.5 |
| 套餐定价(具体数字)| 🔴 | ARCHITECTURE 假设 ¥99/¥999 月 · 但**未市场调研** · 未拍板 |
| 计费系统代码 | 🔴 | 未实施(P9.4 之后)|
| 邀请码运营策略 | 🟡 | 域 ⑥ 设计了 · 但运营 campaign 未策划 |
| 支付集成(微信 / 支付宝 / Stripe)| 🔴 | AGENTS §1.4 写"暂不做支付"· 长期需要 |

**还差** · 套餐定价拍板 · 计费系统 · 支付集成 · 详 §3-12

#### 维度 15 · 团队 + 协作 · 🟡 部分 30%

| 项 | 状态 | 证据 |
|---|:-:|---|
| 团队规模 | ✅ | 当前 1 人(用户)+ AI(Claude Opus + Ralph Sonnet) |
| 协作工具 | 🟡 | 钉钉 / Slack 未明确选 |
| 文档维护周期 | ✅ | PRD-MASTER §5.13 已定 |
| **git repo** | 🔴 | **没 init!**(P0 必做 · §3-1) |
| GitHub repo(私有 / public)| 🔴 | 未建 |
| CI/CD | 🔴 | 未配 |
| 知识库维护(/Users/return/Desktop/Ai_Agent/knowledge-base)| ✅ | 115 文档 · LLM Wiki 模式 |

**还差** · git init + GitHub repo + CI/CD(详 §3-1 / §3-13)

#### 维度 16 · 应急 + 灾备 · 🔴 完全缺位 0%

| 项 | 状态 | 备注 |
|---|:-:|---|
| 故障预案(prod 报错 → 谁处理 → SOP)| 🔴 | 未起草 |
| 紧急止损 SOP(参 ADMIN §3.7 域 ⑯)| 🔴 | 域已设计 · 实际操作流程未起草 |
| 数据库备份策略(Supabase 自动 7 天 / 自管 cron)| 🔴 | 未规划 |
| S3 备份(跨 region)| 🔴 | 未规划 |
| 应急联系人 | 🔴 | 未规划 |
| 用户数据导出(GDPR-like 用户主权)| 🔴 | 未实施 |
| 服务降级策略(LLM 挂了 / DB 挂了)| 🟡 | ARCHITECTURE §6.8 设计了 · 实施未做 |

**还差** · 全部 · 详 §3-14

(原 v0.1 §1.3 + §1.4 维度 10/11/12/13/14/15/16 详情参 git history · 本 v0.2 不展开)

</details>

### §1.5 8 维度小结(★ 2026-05-07 v0.2 重算)

```
开发阶段 8 维度 ·

✅ 已就位(就绪度 ≥ 80%)· 2 维度
   维度 1 设计文档(95%)/ 维度 2 工程约束(95%)

🟡 部分(50-80%)· 2 维度
   维度 6 数据库(prisma schema 主应用 18 model 齐 · 缺 admin 13 表 · 30%)
   维度 15 团队 + 协作(git 没 init · 文档维护就位 · 30%)

🟠 缺关键(20-50%)· 2 维度
   维度 3 PRD 体系(PRD-MASTER 齐 / 0 份 PRD-N · 30%)
   维度 4 Coding 3.0 工具链(commands 齐 / scripts/ralph/ 空 · 60%)

🔴 完全缺位(<20%)· 2 维度
   维度 5 代码(20 个空骨架 · 0 行业务代码 · monorepo 没拆 · 5%)
   维度 7 测试(0 个 .test.ts · 跟代码并行写 · 10%)

开发就绪度评估 ·
  按 8 维度加权 ·
    文档(权重 30%)× 95%   = 28.5%
    工具链(权重 20%)× 60% = 12%
    PRD 体系(权重 15%)× 30% = 4.5%
    数据库(权重 10%)× 30% = 3%
    代码(权重 15%)× 5%    = 0.75%
    测试(权重 5%)× 10%    = 0.5%
    git/协作(权重 5%)× 30% = 1.5%
                              ────
                              ≈ 50% 就绪
                              
  按"能跑 Ralph daemon 跑通 PRD-1"倒推 ·
    还差 §3 P0 7 件 · 1.5 天完成 · 全部我能做(无外部依赖)
    
  按"14 PRD 全跑完"倒推 ·
    还差 25 周 ralph 串行执行(主线 16w + admin 9w · 方案 A)
```

> 跟 v0.1 全周期 20% 的差别 · v0.2 砍掉 8 跨开发维度后 · 同样的"就绪资产"(文档 / 工具链)在 8 维度分母里占比更高 · 所以 50% > 20%。这不是项目变好了 · 是评估范围变小了。

---

## §2 7 项硬需求对照(开发视角 · 2026-05-07 v0.2 收窄)

> 从 2026-05-06 起的对话提炼出你的 7 项硬需求 · 本节**只核对"开发达成度"**(设计 + 代码)· 不评估"上线达成度"(部署 / 备案 / 商业)— 那部分留 PRR。

| # | 你的需求 | 出处(对话日期 / 文档) | 当前状态 | 实测证据 | 距离生产级还差 |
|:-:|---|---|:-:|---|---|
| **1** | 基于 aiipznt 复刻 + 升级 | 2026-05-06 + README.md L3 + ARCHITECTURE §1.1 | ✅ 100% 设计 / 🔴 0% 代码 | 复刻基线 aiipznt-spec.md 322K + ui/ 64 设计稿 + ARCHITECTURE §2 业务模型完整对齐 | 跑 14 PRD 完整实施(25 周) |
| **2** | 引入知识库 Agent 哲学 | 2026-05-06 + ARCHITECTURE §1.1 + §7.7 借鉴清单 11 处 | ✅ 100% 设计 / 🔴 0% 代码 | 显式引用 11/02 八 Agent / 11/04 五层记忆 / 11/05 LLM 网关 / PI-Agent 03 二分法 / ADR-018 外部 orchestrator 等 11 处知识库 | 同上 · 跟 #1 同步 |
| **3** | Aurelian Dark 视觉重塑 | 2026-05-06 + ARCHITECTURE §1.7 第 1 条 + §8 + ui/aurelian_dark/DESIGN.md | ✅ 100% 设计 / 🔴 0% 代码 | DESIGN.md YAML token 全 + 主应用稿 + admin 密度方案(ADMIN §6.1) | 实施(P0 期 token 转 tailwind.config.js · 后续每个 PRD 跑) |
| **4** | 前后端分离 | 2026-05-07 + REVIEW P0-3 + ARCHITECTURE §1.4b + ADR-019 | 🟡 设计 100% / 🔴 实施 0% | 设计就位 · 但 monorepo 没拆 · apps/web/admin/api 全无 | P0 拆 monorepo(0.5 天 · §3-3)+ 实施 25w |
| **5** | 独立的管理后台(独立部署 · 独立 OAuth · 独立子域名)| 2026-05-07 + REVIEW P0-1 根因 + ADMIN-ARCHITECTURE.md(整个文档)+ ADR-021 | 🟡 设计 100% / 🔴 实施 0% | ADMIN-ARCHITECTURE 1762 行 · 16 业务管理域全规划 · 但 admin OAuth / WAF / DB 13 表 全 0 | P9.0-P9.4 共 9w(主应用上线后启动) |
| **6** | 管理后台 web 页面(完整 UI · 13 路由组)| 2026-05-07 + REVIEW P0-1 派生 + ADMIN §3 16 域 + §6 前端架构 | 🟡 设计 100% / 🔴 实施 0% | 16 域 UI 骨架设计完整 · 但**实际页面 0 个** | P9.1 起 · 8w(P9.0 + P9.1 + P9.2 + P9.3) |
| **7** | 完整生产级项目(不是 demo) | 2026-05-07 现在 | 🔴 整体 20% | 16 维度 8 个 🔴 完全缺位(代码 / 测试 / 部署 / 安全 / 合规 / 监控 / 运营 / 法务 / 应急)| **本文件 §3-§5 给完整路线** |

### §2.1 7 项需求达成度小结

```
设计层(7/7 达成)·    ✅✅✅✅✅✅✅
代码层(0/7 达成)·    🔴🔴🔴🔴🔴🔴🔴
基础设施层(0/7 达成)· 🔴🔴🔴🔴🔴🔴🔴
合规法务层(0/7 达成)· 🔴🔴🔴🔴🔴🔴🔴

→ 需求设计已 100% 就位 · 实施侧 0% · 跨开发(合规/法务/部署)0%
→ 距离 #7"完整生产级"达成 · 还需要 22-30 周 + 一些跨开发投入
```

### §2.2 跟 aiipznt 原版的差异化达成度(参 ARCHITECTURE §1.7 9 条偏离决策)

| # | 偏离维度 | 设计 | 实施 |
|:-:|---|:-:|:-:|
| 1 | 视觉风格(Aurelian Dark vs 赛博青)| ✅ | 🔴 |
| 2 | Agent 拓扑(显式 14 Specialist vs 黑盒)| ✅ | 🔴 |
| 3 | 文案生成(共享 CopywritingAgent vs 4 入口各一份)| ✅ | 🔴 |
| 4 | 记忆机制(5 层 vs 18 LS keys)| ✅ | 🔴 |
| 5 | 进化机制(自动注入 vs 手动)| ✅ | 🔴 |
| 6 | 流式响应(SSE 长输出 vs 全非流式)| ✅ | 🔴 |
| 7 | 多账号切换(reload + 预热 vs reload)| ✅ | 🔴 |
| 8 | 架构透明度(100% vs 0)| ✅ | 🟡(文档 100% · 代码 0%)|
| 9 | 管理后台(独立 16 域 vs 嵌入 1 路由)| ✅ | 🔴 |

→ 9 条偏离决策 · 设计层 100% · 代码层 0% · 跟 #7 一致

### §2.3 隐性代价(★ 2026-05-07 v0.2 砍跨开发 · 仅留开发期)

| 你的需求 | 开发期代价 |
|---|---|
| **#1 复刻 aiipznt + #2 知识库哲学 + #3 Aurelian Dark** | 开发期 LLM 成本 ¥30-50K(Ralph 跑代码 + Opus audit + LLM Judge 100 金标准) |
| **#4 前后端分离 + #5 #6 独立 admin** | 开发期 monorepo 拆分 + 双 router 树 + ralph 切 PRD 工作量 · 已锁定 25 周 |
| **#7 完整生产级** | 开发期不在本范围 · 上线前留 PRR 单独评估 |

---

## §3 P0 立即可做(★ 7 件 · 2026-05-07 v0.2 砍到只留我能做的)

> v0.1 写"14 件 P0"包含 7 件你必做(域名 / OAuth / ICP 备案 / Trending / DB 实例 等)·
> v0.2 砍掉那 7 件(留待 PRR 处理)· 只保留**纯代码 / 工具链 / 文档 7 件 · 全部我能做 · 1.5 天完成 · 0 外部依赖**。

### §3.1 我立即可做的 7 件(全部纯代码 / 工具链 / 文档)

| # | 动作 | 工作量 | 谁做 | 阻塞什么 |
|:-:|---|:-:|---|---|
| **3-1** | **`git init` + 配置 .gitignore** | 5 分钟 | 我 + 你确认 | 所有版本控制 / Ralph 写代码后 commit / 灾备 |
| **3-2** | **同步 ralph 工具链** · 跑 `~/.claude/scripts/ralph/sync-to-project.sh /Users/return/Desktop/QuanQn`(把 ralph.py / dashboard.py / VALIDATOR.md / OPUS-AUDIT-CHEATSHEET.md / AUDIT-CHECKLIST-TEMPLATE.md / TECH-DEBT-SCHEMA.md / ralph-tools.py 等复制到 scripts/ralph/)| 1 小时(含可能的 manual fixup)| 我 | ralph daemon 启动 |
| **3-3** | **拆 monorepo workspace**(SCAFFOLD §A.3 10 步迁移 · `apps/web` `apps/admin`(占位)`apps/api` `packages/{schemas,ui,clients}` `pnpm-workspace.yaml`)| 0.5 天 | 我 + 你 review | 主应用 + admin 独立部署边界 |
| **3-4** | **prisma/schema.prisma 加 admin 13 表** · 从 DATA-MODEL §13 复制 | 0.5 天 | 我 | admin PRD 数据层 |
| **3-5** | **创建 migrations/manual_admin_rls.sql**(13 表 DISABLE RLS · 见 DATA-MODEL §13.8) | 30 分钟 | 我 | admin 跨账号查 |
| **3-6** | **写 PRD-1**(P0 基础设施 · 用 PRD-MASTER §2 模板 · 含 4 类 AC · §3.10 实施期 ARCHITECTURE 改动协议)| 1-2 小时 | prd skill(Opus 我)| Ralph 启动 |
| **3-7** | **写 scripts/ralph/switch-prd.sh**(PRD-MASTER §7.4 B 已给完整代码 · 复制落地 + chmod +x)| 5 分钟 | 我 | 14 PRD 切换 |

### §3.2 你必做的部分(★ 2026-05-07 v0.2 砍掉)

> v0.1 此章列了 7 件你必做(域名 / ICP / OAuth / Supabase / Trending / LLM 企业账户 / 套餐定价)·
> v0.2 全部砍掉 · 留待 PRR 评估上线前跨开发工作。

### §3.3 P0 完成顺序(全部我做 · 1.5 天)

```
Day 1 ·
  Hour 1   · 3-1 git init + .gitignore(5 分钟)
  Hour 1-2 · 3-2 sync ralph 工具链(1 小时)
  Hour 2-6 · 3-3 拆 monorepo workspace(0.5 天)
  
Day 2 ·
  上午 · 3-4 prisma 加 admin 13 表(0.5 天)
  下午 · 3-5 manual_admin_rls.sql(30 分钟)+ 3-7 switch-prd.sh(5 分钟)
  下午 · 3-6 写 PRD-1(prd skill · 1-2 小时)

Day 3 起 ·
  cp scripts/ralph/prd-1.json scripts/ralph/prd.json
  python scripts/ralph/ralph.py --model sonnet --daemon
  → 进入 PRD-1 实施(P0 基础设施 · 2 周 · 仅本地 dev 跑)
```

> 🟢 **关键** · 全部 7 件是"我能做"+ "0 外部依赖"+ "本地 dev 不需要域名 / OAuth / DB 实例" — 立即可启动 · 不被任何审批卡住。

---

## §4 主开发路线图(25 周 · 14 PRD · 2026-05-07 v0.2 砍跨开发)

### §4.1 阶段总览

```
┌──────────────────────────────────────────────────────────────────────┐
│  阶段 1 · P0 本周准备(20% → 30%)                                    │
│  · §3 14 件 P0 全部完成                                              │
│  · 主要进展 · git + monorepo + ralph 工具 + PRD-1                    │
│  · 时间 · 1-2 天 · 不含 ICP/OAuth 审批等待                           │
├──────────────────────────────────────────────────────────────────────┤
│  阶段 2 · MVP 路径(30% → 70% · 跑通主链路)                          │
│  · PRD-1(P0 基础)+ PRD-2(P1 数据)+ PRD-3(P2 路由)+              │
│    PRD-4(P3 主流程 9 步 · 5 个 Specialist)+ PRD-9(P8 知识库精简) │
│  · MVP 5 周(参 ARCHITECTURE §9.14)                                  │
│  · 主要进展 · 主应用核心功能跑通 · 单元 + 集成测试齐                │
│  · 阶段末 · 内测可用                                                 │
├──────────────────────────────────────────────────────────────────────┤
│  阶段 3 · 主应用全功能(70% → 85% · 公测前)                          │
│  · PRD-5/6/7/8/9(P4 创作 / P5 视频 / P6 私域 / P7 智能 / P8 知识库)│
│  · 主应用 11 周(MVP 后再 11w)                                       │
│  · 主要进展 · 14 工具页 + 6 新模块 + L5 自治 全部跑                  │
│  · 阶段末 · 主应用公测                                               │
├──────────────────────────────────────────────────────────────────────┤
│  阶段 4 · admin 全功能 + 生产上线(85% → 100%)                       │
│  · PRD-10/11/12/13/14(P9.0-P9.4 · 9w)                               │
│  · 法务 / 备案 / 合规 / 监控 / 运营 全部齐                           │
│  · 主要进展 · admin 16 业务管理域 + 部署 prod + 监控 + 应急         │
│  · 阶段末 · 正式上线 · prod 流量                                     │
└──────────────────────────────────────────────────────────────────────┘
   总周期 · 26-30 周(含 §3 14 件 P0 + 3 阶段开发 + 跨开发并行)
```

### §4.2 阶段 1 · P0 本周准备(20% → 30%)详情

详 §3 已给。**关键阻塞** · 3-9 ICP 备案 1-3 周 · 但**不阻塞 Ralph 在本地 dev 跑**(PRD-1 P0 基础设施仅本地)· 备案期间可正常推进开发。

### §4.3 阶段 2 · MVP 5 周(30% → 70%)

> 跑通主链路 · 内测可用 · **不上 prod**(因为 3-9 ICP 备案可能还在等)。

| Phase | 周 | PRD | 关键产出 | 跨开发并行 |
|:-:|:-:|---|---|---|
| P0 | 1-2 | PRD-1 | monorepo + Vite + tRPC + Prisma + Hono · 用户能登录(本地)| (并行)买域名 / ICP 备案 |
| P1 | 3-4 | PRD-2 | DB schema 全 · 13 router 骨架 + LS↔DB 双写 hook | (并行)Google OAuth 申请 |
| P2 | 5 | PRD-3 | 34 路由占位 · IP 账号切换 · /ip-plan | (并行)写 LLM Judge 60 条金标准 |
| P3 | 6-8 | PRD-4 | 9 步 Specialist 上线 · ContextAssembler · LLMGateway · 主线 9 步跑通 | (并行)Trending 第三方授权谈合同 |
| P8 | 9 | PRD-9 精简 | /knowledge + 67 案例 · /guide | (并行)写隐私政策 / 用户协议 |

阶段末 · 内测可用 · Free 用户邀请测试 5-10 人。

### §4.4 阶段 3 · 主应用全功能 11 周(70% → 85%)

> 14 工具 + 6 新模块 + 3 L5 自治 全部完成 · 主应用公测。

| Phase | 周 | PRD |
|:-:|:-:|---|
| P4 | 10-11 | PRD-5(创作 4 工具)|
| P5 | 12-13 | PRD-6(视频 4 工具 · trending 抓取启用 · ★ 此时 Trending 授权必须签下来)|
| P6 | 14 | PRD-7(私域 + 变现)|
| P7 | 15-16 | PRD-8(L5 自治 + 进化飞轮)|
| P8 | 16 | PRD-9 完整(/knowledge 全 + 67 案例入向量库)|

**阶段末必须达成的跨开发工作**:
- ICP 备案下来(3-9)
- 主应用 OAuth 上线(3-10)
- 主应用监控接入(Sentry / pino / 钉钉告警)
- 隐私政策 / 用户协议 上线
- 真实 DB 实例(Supabase / 阿里云 RDS)切换
- 服务器 / Vercel / Railway 部署 ★ 真实 prod 域名生效

阶段末 · 主应用公测 · 内测扩到 100-500 人。

### §4.5 阶段 4 · admin 开发 9 周(85% → 100%)

> admin 子系统 5 阶段开发 · **不含上线 prod 工作**(留 PRR)。

| Phase | 周 | PRD | 关键产出 |
|:-:|:-:|---|---|
| P9.0 | 17 | PRD-10 | admin 基础设施(monorepo workspace + apps/admin 骨架 + 6 闸鉴权链 stub + admin_audit_log)· **必须** 主应用 P8 完成 |
| P9.1 | 18-20 | PRD-11 | 6 个 P0 业务核心域 · NSM / 用户 / 账号 / 成本 / 审计 / 邀请码 |
| P9.2 | 21-22 | PRD-12 | 2 个 P0 内容审核域 · TrendingItem / DeepLearning(代码层) |
| P9.3 | 23-24 | PRD-13 | 5 个 P1 健康度域 · 进化 / Prompt / 配额 / 合规 / Approval Gates |
| P9.4 | 25(可后续)| PRD-14 | 3 个 P2 高级域 · A/B / 常量 / 配置中心 |

阶段末 · **admin 开发完整跑通**(本地 dev 全部功能可演示)· 但**未上 prod**(那部分留 PRR · 含 OAuth 真实申请 / WAF 配置 / MFA 启用 / 内容审核员招聘 / 部署等)。

### §4.6 路线图小结

```
开发 4 阶段时间线 ·
  阶段 1(P0 准备)       1-2 天        ≈40% → 50%
  阶段 2(MVP)           5w            50% → 70%
  阶段 3(主应用全功能)  11w           70% → 85%
  阶段 4(admin 全功能)  9w            85% → 100%(开发就绪 · 非上线就绪)
  ─────────────────────────────────────────────
  开发主线总周期 · 25w(严格串行 · 方案 A)
  
  阶段末意义 · 14 PRD 全跑完 · 本地 dev 全部功能可演示 · admin 16 业务管理域齐
  下一步(非本文档范围) · 进 PRR 评估上线前跨开发工作(部署 / 法务 / 合规 / 监控 等)
```

---

## §5 开发期时间 / 成本 / 人力(★ 2026-05-07 v0.2 收窄)

### §5.1 时间总账(全周期 26-32 周)

| 阶段 | 周 | 关键内容 |
|:-:|:-:|---|
| 阶段 1 P0 准备 | 1-2 天 | §3 14 件 |
| 阶段 2 MVP | 5w | PRD-1/2/3/4/9 精简 |
| 阶段 3 主全功能 | 11w | PRD-5/6/7/8/9 完整 |
| 阶段 4 admin 上线 | 9w | PRD-10/11/12/13/14 |
| 跨开发并行 | 1-3w | ICP / OAuth / Trending / 法务 / 内容审核员招聘(部分跟开发并行)|
| **总** | **26-32w** | 严格串行 + 跨开发部分并行 |

### §5.2 开发期成本(★ 砍跨开发 · 只留代码相关)

| 类别 | 金额 | 备注 |
|---|:-:|---|
| **开发期 LLM 成本**(主要)| ¥30-100K | Ralph 跑 14 PRD 代码 + Opus audit + LLM Judge 100 金标准 · 25w |
| **Anthropic API key**(开发期)| 个人账户即可 / $50-200/月 | 无需企业账户(上线前再升级 · 留 PRR)|
| **本地 dev DB**(免费)| ¥0 | docker compose Postgres + Redis · 不需要 Supabase |
| **GitHub Free**(可选)| ¥0 | 私有 repo 免费 |
| **其他工具(钉钉机器人等可选)** | ¥0-500 | 钉钉 webhook 测试用 |
| **小计开发期** | **¥30-100K** | 其中 95% 是 LLM 成本 |

> ⚠️ **跨开发成本(部署 / ICP / 商标 / Trending 授权 / 内容审核员 / 法务)不在本文** · 留 PRR 评估。

### §5.3 全周期总账(★ 砍掉)

> 跨开发成本表(域名 / ICP / Trending / 商标 / 法务 等)留 PRR · 本文不展开。

### §5.3 开发期人力

| 角色 | 参与度 | 备注 |
|---|:-:|---|
| **你**(用户)· PM + 决策 + review | 25% 全程 | 拍板 / 看 PRD / 看 Opus audit 报告 |
| **Claude Opus**(我)· PRD 写 + Opus audit + 4 维度审 | 100% | LLM 成本含 §5.2 |
| **Ralph Sonnet** · 写代码 daemon | 100% | 同上 |

> 开发期不需要外包(设计师 / 法务 / 内容审核员 / 客服 全部留 PRR)。**纯 1 人 + AI 模式**。

---

## §6 立即可做的 3 个动作(★ 2026-05-07 v0.2 砍 B/E)

> 把 §3 14 件 P0 + §5 成本 全部消化后 · 你立即能做的 5 类动作 · 选 1 个开始。

### 动作 A · 我立即跑 P0 7 件(★ 推荐)· 1.5 天

```
我立即开始 ·
  3-1 git init + .gitignore
  3-2 同步 ralph 工具链(sync-to-project.sh)
  3-3 拆 monorepo workspace
  3-4 prisma schema 加 admin 13 表
  3-5 manual_admin_rls.sql 创建
  3-7 switch-prd.sh 落地
  
然后 · 写 PRD-1(3-6)· 1-2 小时
最后 · 启动 Ralph daemon · 进入阶段 2 MVP

你需要 · 全程在场 review · 但不需要"动手"
```

### 动作 B · 先看 DEV-READINESS 全文 · 看完再决定

```
你 · 慢慢看 PRODUCTION-READINESS.md(本文件)
我 · 等你决定

适合场景 · 决策很大 · 涉及 ¥30-300K 投入 · 慢慢消化更稳
```

### 动作 C · 先调整 v0.2 范围 · 再决定

```
本文已收窄到"开发阶段" · 砍掉 8 跨开发维度 / 7 件你必做 / 全周期成本表 · 等。
如果还想再调整(比如范围更窄或更宽)· 告诉我 · 我再修订 v0.3。
```

### §6.1 我的推荐 · 动作 A

```
你说"开始" → 我立即跑 7 件 · 1.5 天完成 ·
然后写 PRD-1 → ralph daemon 启动 → 进入 PRD-1 实施(2 周本地 dev)
跨开发(部署 / ICP / OAuth / Trending / 商标 / 法务 等)留 PRR · 上线前再做。
```

---

## §7 修订记录 + 引用源

### §7.1 修订记录

- **2026-05-07 v0.2** · 收窄为开发阶段就绪度(选项 C · 改名 + 砍跨开发)
  - 重命名 PRODUCTION-READINESS.md → DEV-READINESS.md
  - 砍 §1.3 + §1.4 8 跨开发维度(8/9/10/11/12/13/14/16) · 折叠保留作记录
  - 重写 §1.5 8 维度小结 · 重新加权 · 开发就绪度 ≈ 50%
  - §2 改"开发视角" · §2.3 隐性代价砍跨开发部分
  - §3 砍掉"你必做" 7 件 · 只留我能做 7 件 · §3.3 顺序简化(全部我做 1.5 天)
  - §4 阶段 4 砍跨开发 · 改为"admin 开发 9w"(非"上线 9w")
  - §5 砍全周期成本表 · 只留开发期 LLM 成本 + 1 人 + AI 极简模式
  - §6 砍动作 B/E · 留 A(我立即跑)/ B(看完再说)/ C(再调范围) 3 个

- **2026-05-07 v0.1** · 创建 PRODUCTION-READINESS.md
  - **§0 TL;DR** · 1 分钟读懂 · 整体就绪度 ≈ 20%
  - **§1 16 维度评估** · 4 大类(设计文档 / 代码基础设施 / 合规运营 / 商业运维)· 每维度实测证据 + 还差什么
  - **§2 7 项硬需求对照** · 设计 100% / 代码 0% / 跨开发 0% · 含 9 条 aiipznt 偏离决策达成度 + 隐性代价提示
  - **§3 P0 本周必做 14 件** · 我能做 7 件(1.5 天)+ 你必做 7 件(1 天 + 1-3w 等审批)
  - **§4 4 阶段路线图** · 阶段 1 P0 准备 / 阶段 2 MVP 5w / 阶段 3 主全功能 11w / 阶段 4 admin 上线 9w · 总 26-32w
  - **§5 时间 / 成本 / 人力总账** · 全周期开发 ¥80-300K · 上线后月 ¥10-30K · 1 人 + AI 极简 / 1-2 人审核员 + 兼职法务客服 完整
  - **§6 立即可做 5 动作** · A 我来 / B 你来 / C A+B 并行(★ 推荐)/ D 看完再说 / E 重新评估范围

### §7.2 引用源

#### 项目内文档(全部实测引用)
- [ARCHITECTURE.md](ARCHITECTURE.md) v0.4 · 199K · 9 章 · §1.4b / §2.5b / §9.X / §9.12b 成本估算
- [ADMIN-ARCHITECTURE.md](ADMIN-ARCHITECTURE.md) v0.2 · 114K · §3 16 域 + §8 P9 路线图
- [DATA-MODEL.md](DATA-MODEL.md) v0.2 · 144K · §13 admin 13 表
- [AGENTS.md](AGENTS.md) v0.2 · 111K · 18 LD + 17 R + §10 admin 5 LD-A + 6 R-A
- [ADR.md](ADR.md) v0.2 · 82K · 21 ADR(含 ADR-019/020/021)
- [SCAFFOLD.md](SCAFFOLD.md) v0.2 · 25K · §A monorepo 改造
- [PRD-MASTER.md](PRD-MASTER.md) v0.2 · 113K · §3-§6 协议 + §6 35 反例 + §7 路线
- [README.md](README.md) · 项目入口
- [aiipznt-spec.md](aiipznt-spec.md) · 322K · 复刻基线
- [ARCHITECTURE-REVIEW.md](ARCHITECTURE-REVIEW.md) · 77K · 上一轮诊断 · 决策 ARCHITECTURE-driven 的源头
- [ui/aurelian_dark/DESIGN.md](ui/aurelian_dark/DESIGN.md) · 设计 token

#### 实测命令
- `find /Users/return/Desktop/QuanQn -type f` · 文件清单
- `wc -l prisma/schema.prisma` = 626 行 · `grep -c "^model "` = 18 model
- `find tests/ -name "*.test.*" \| wc -l` = 0
- `ls /Users/return/Desktop/QuanQn/scripts/ralph/` = 空目录
- `ls /Users/return/Desktop/QuanQn/.git` = 不存在
- `ls /Users/return/Desktop/QuanQn/apps/` = 不存在
- `wc -l ~/.claude/playbooks/reject-examples.jsonl` = 35
- `grep -E "Sentry\|OTel\|Plausible"` 项目内代码 = 0

#### 知识库引用
- knowledge-base/reference-materials/Agent安全架构与合规指南 · §1.10 合规相关
- knowledge-base/reference-materials/多租户SaaS化架构指南 · §1.14 商业相关
- knowledge-base/05-vertical-solutions/05.5-solo-founder-marketing-automation · §5.3 极简模式参考

---

> **本文件由 Claude(Opus 4.7)基于 9 文档体系 + 实测仓库状态 + 对照用户 7 项硬需求生成 · 2026-05-07 创建。**
>
> **核心结论** · 当前就绪度 ≈ 20% · 距离生产级还有 26-32 周 · 但 **MVP 路径 5 周可跑通内测** · 是否升级到完整生产级 · 阶段 2 末尾拍板。
