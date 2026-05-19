# QuanAn · PRD 总纲(PRD-MASTER.md)

> **版本** · v0.2(2026-05-07 创建 · 2026-05-07 v0.2 修订:全链路 11 项修 — 35 反例 / 4 类 AC / 失败回滚 / 状态协议 / ownership 等)· 跟 ARCHITECTURE.md / ADMIN-ARCHITECTURE.md 平级
> **角色** · ARCHITECTURE-driven PRD 模式的"事实来源 + 写作总纲 + 缺口清单"
> **产出** · 14 份 PRD-1 ~ PRD-14 之外的 1 份**总纲文档** · 不是 PRD 本身
> **派生自**(诊断输入)
> ① [`ARCHITECTURE.md`](ARCHITECTURE.md) v0.3 · 9 章 / 3256 行
> ② [`ADMIN-ARCHITECTURE.md`](ADMIN-ARCHITECTURE.md) v0.1 · 9 章 / 1762 行
> ③ [`AGENTS.md`](AGENTS.md) v0.2 · 10 章 / 2591 行
> ④ [`ADR.md`](ADR.md) v0.2 · 21 ADR / 1779 行
> ⑤ [`DATA-MODEL.md`](DATA-MODEL.md) v0.2 · 13 节 + 31 实体 / 3579 行
> ⑥ [`PROMPTS.md`](PROMPTS.md) · 14 Specialist / 2340 行
> ⑦ [`SCAFFOLD.md`](SCAFFOLD.md) v0.2 · 强制 monorepo / 535 行
> ⑧ [`aiipznt-spec.md`](aiipznt-spec.md) · 322KB / 复刻基线
> ⑨ [`ui/`](ui/) · 66 子目录 / 60+ 实际设计稿 + [aurelian_dark/DESIGN.md](ui/aurelian_dark/DESIGN.md)(YAML 元数据 + 文字描述)
> **方法论** · ARCHITECTURE-driven PRD(参 [`ARCHITECTURE-REVIEW.md`](ARCHITECTURE-REVIEW.md) 后续讨论 · 2026-05-07 决定采纳)

---

## 🚀 TL;DR(★ 2026-05-07 v0.2 加 · 1 分钟读懂)

```
本文件是什么 · 14 PRD 之外的 1 份"总纲" · 派生 PRD 的方法论 + 反例库 + 协议 · 不是 PRD 本身

关键产出 · 9 章 / ~1500 行 / 88KB
  §0 7 维度诊断 + 10 缺口
  §1 14 PRD 全景索引 + ownership(P1-7)+ 状态切换(P1-8)
  §2 写作模板 v1.0(★ 4 类 AC 必含 H/E/B/P)
  §3 工作流详细协议 + 实施期 ARCHITECTURE 改动流程(P1-6)
  §4 5 大支撑规范(risk / depends / anti / Judge / 测试)
  §5 缺口清单 + PRD 失败回滚(P1-5)+ 过期重写(P2-10)
  §6 35 条反例预填(★ P0 阻塞已修)
  §7 启动顺序 + 单 daemon 串行(★ 选方案 A · 25w 总周期)
  §8 修订记录 + 引用源

启动 PRD-1 前必跑 ·
  bash scripts/seed-reject-examples.sh   # 35 条反例 → ~/.claude/playbooks/reject-examples.jsonl
  (此前 0 字节 · 现 35 行 · prd skill 注入机制就绪)

启动姿势 ·
  1. prd skill 写 tasks/prd-1.md(轻量模板 · 10-20KB)
  2. ralph skill 转 prd.json
  3. /plan-check 7 项检查
  4. cp prd-1.json scripts/ralph/prd.json
  5. python scripts/ralph/ralph.py --model sonnet --daemon
  6. /monitor-ralph 起监测
  7. 跑完 → /goal-verify(双向对账)→ /prd-retro → bash scripts/ralph/switch-prd.sh prd-2

总周期 · 25 周(主 16 + admin 9 · 严格串行)· MVP 路径 5w 可上线
```

---

## 文档地图

| § | 章节 | 一句话 |
|:-:|---|---|
| §0 | **7 维度诊断结论 + 整体就绪度** | 实测 7 维度 · 找到 10 缺口 · ARCHITECTURE-driven 整体就绪度评估 |
| §1 | **14 PRD 全景索引** | 每份 PRD 的 Phase / 周期 / 引用清单 / risk / depends_on / 关键 US 数 |
| §2 | **PRD 写作模板 v1.0(锁定版)** | §0 引用 / §1 US / §2 AC(★ 4 类必含) / §3 范围 / §4 风险 / §5 测试 / §6 反例 |
| §3 | **ARCHITECTURE-driven 工作流详细协议** | prd / ralph / ralph.py / Opus audit 4 阶段在本模式下的具体协议 |
| §4 | **5 大支撑规范** | risk_level 打分 / depends_on 拓扑 / anti_patterns 注入 / LLM Judge / 测试配额 |
| §5 | **缺口清单 + 修复路径(10 项)** | §0 诊断的 10 缺口 · 每个 P0/P1/P2/P3 + 修复 |
| §6 | **PRD-anti-patterns 预填**(★ 反例库空 · 必须手动准备)| ≥ 30 条 QuanAn 通用反例 + 写入 reject-examples.jsonl 脚本 |
| §7 | **14 PRD 启动顺序 + 并行机会** | depends_on 全图 + 主/admin 双 daemon 协同时间轴 |
| §8 | 修订记录 + 引用源 | 收尾 |

---

## §0 7 维度诊断结论 + 整体就绪度

> **方法** · 2026-05-07 实测 9 文档体系 + ui/ + 知识库 · grep / Read 取真实证据 · 不是表面扫描。
> **诊断对象** · ARCHITECTURE-driven PRD 模式落地的"环节就绪度"(不是文档质量本身的就绪度 — 文档质量 ARCHITECTURE-REVIEW.md 已评)

### §0.1 7 维度评分

| # | 维度 | 评级 | 关键发现(实测证据) |
|:-:|---|:-:|---|
| 1 | **业务完整性** | 🟡 部分就绪 | • 33 路由 · ARCHITECTURE §2 业务模型(L372-380 9 步表 + L425-444 14 工具表 + L468-486 6 新模块表 + L505-541 admin 边界)+ ROUTES.md 实测对齐 ✅<br>• ui/ 66 子目录(`ls /ui/ \| wc -l` 实测 · 含 aurelian_dark/ 设计系统目录 + .DS_Store)· 但**14 工具页只有 4 个有专属设计稿**(ai_copywriting_studio_1/2 / ai_storyboard / ip_voice_chat / market_intelligence_hub)· 其余 10 个工具页(generate / analysis / video-production / acquisition-video / boom-generate / private-domain / monetization / deep-learning / knowledge / present-styles)需从 aip_N(19)/ip_N(4)/_N(15)派生<br>• step_02 / step_04 / step_07 **无专属设计稿** · spec.md §ⅩⅦ 实测 step_02=404 删除 · step_04+07 是 markdown 输出页 · 复用 step_03 通用骨架 |
| 2 | **AC 可派生度** | 🟡 雏形够 · 细化不够 | • ARCHITECTURE §9.2-§9.10 共 9 个 Phase 退出条件已就位(grep `\| \*\*退出条件\*\* \|` 命中 9 行 L2813-2899)<br>• ADMIN §8.2-§8.6 共 5 个 Phase 退出条件(命中 5 行 L1502-1544)<br>• 合计 14 个 Phase 退出条件 · 直接转 Given/When/Then 的"原料"齐全<br>• 🔴 **但只覆盖 happy path** · 例:"9 步全部能生成结果"(ARCHITECTURE:2846)— 没说 LLM 超时怎么办 / 网络断怎么办 / 用户中途切换账号怎么办 / 配额耗尽怎么办 / 输入非法怎么办<br>• 🔴 **错误路径 / 边界 / 性能 AC 完全缺位** · 必须在 PRD §2 强制要求 4 类 AC(happy + error + boundary + perf) |
| 3 | **数据契约就绪度** | 🟡 整体好 · 2 处推断 | • DATA-MODEL.md 31 实体(主 18 + admin 13)schema 完整就位<br>• 🟡 **2 处明确标 schema 推断**(grep `schema 推断` ARCHITECTURE 命中 L761 step6 + L763 step8)· 原文"⚠️ schema 推断 · sally 账号实测 lastResult=null 未跑"<br>• 🟡 多处"由 8 步问卷推断"字段(DATA-MODEL L366 / L381 / L438 / L1253 / L1256 — 不算硬缺口 · 因为 DiagnosisAgent 实施时填)<br>• ✅ **不阻塞 P0-P3** · 影响 P5(step6 设计) + P7(step8 设计) + P8(step9 缓存)|
| 4 | **接口契约就绪度** | 🟡 名字齐 · zod 待填 | • 主应用 13 router · ARCHITECTURE §3.2 给了 procedure 名清单(L676-679 等 · `auth.me/logout` / `ipAccounts.list/active/create/...` 共 50+ procedure)<br>• admin 14 router · ADMIN §5.1 给了子树命名(L934-949)<br>• 🟡 **但 input/output zod schema 还在 packages/schemas/ 待填** — 实施时才到代码层(不是规划阶段缺口)<br>• 🟡 6 闸鉴权链 middleware 是骨架级 · ADMIN §5.3 给了链顺序 · 具体代码留 P9.0 实施 |
| 5 | **依赖关系可推导性** | ✅ 强 | • ARCHITECTURE §9 P0-P8 顺序明确(L2811-2899)<br>• ADMIN §8 P9.0-P9.4 顺序明确(L1463-1544)<br>• ARCHITECTURE §9.X 4 项埋点(L504-506) → P9.1 依赖 P1 索引 / P9.2 依赖 P5+P7 Worker 改造 / P9.1 域④⑤依赖 P3 cost_log RLS<br>• ADMIN §8.7 协同节奏明确 · P9.0 可与主 P8 并行节流 1 周(L1556)<br>• ✅ **14 PRD 间 depends_on 完全可画**(详 §7) |
| 6 | **anti_patterns 可注入度** | 🔴 **空** · P0 阻塞 | • 实测 `ls -la ~/.claude/playbooks/` · `reject-examples.jsonl` 文件存在但 **0 字节 / 0 行**(`wc -l` 返回 0)<br>• 全局 `~/.claude/CLAUDE.md` 写明"prd skill 转 prd.json 时按关键词检索 · 把 ≤3 条相关反例注入到新 story 的 anti_patterns 字段"<br>• 🔴 当前注入 0 条 · Ralph 看不到任何历史教训<br>• 🔴 **必须在 PRD-1 启动前手动预填**(§6 给方案) |
| 7 | **测试金标准可准备度** | 🟡 5/9 步有素材 | • aiipznt-clone-research/api/ 有 4 个 API 响应样本(api-probe-results.json / api-probe-v3.json / api-probe-v4.json / api-responses-raw.json)+ knowledge-cases-full.json(67 案例完整)<br>• sally 账号实测覆盖 step3/3b/4b/5/7(5 步)· spec 附录 C 列"step6/8 sally 账号没用过"(L9162)<br>• 🔴 **AI prompts 模板未抓**(后端拿不到 · spec L9159)· PROMPTS.md 14 模板是自造 · LLM Judge 没有"原版对照基线"<br>• ✅ ARCHITECTURE §9.11-E.4 LLM Judge 配置完整(GPT-4o 当 Judge / 100 金标准 / 阈值 4.0)<br>• 🟡 **100 金标准来源**:sally 5 步参考(可做 30 条)+ 自造 70 条(每 Specialist ~7 条) |

### §0.2 整体就绪度判断

```
ARCHITECTURE-driven PRD 模式落地条件 ·
┌─────────────────────────────────────────────────┐
│ ✅ 业务事实来源(SoT)就绪度       9/10          │
│   ARCHITECTURE §2 + ui/ + spec.md 三方互锁       │
│   仅 10 个工具页缺专属设计稿 · 但有探索稿可派生 │
├─────────────────────────────────────────────────┤
│ ✅ 数据契约就绪度                  9/10          │
│   31 实体齐 · 2 处 schema 推断不阻塞 P0-P3       │
├─────────────────────────────────────────────────┤
│ 🟡 AC 可派生度                     7/10          │
│   14 个 happy path 退出条件齐                    │
│   错误/边界/性能 AC 必须 PRD 阶段补              │
├─────────────────────────────────────────────────┤
│ 🟡 接口契约就绪度                  7/10          │
│   procedure 名齐 · zod 待 P1 实施时填           │
├─────────────────────────────────────────────────┤
│ ✅ 依赖关系可推导性                10/10         │
│   14 PRD 间 depends_on 完全可画(§7)            │
├─────────────────────────────────────────────────┤
│ 🔴 anti_patterns 可注入度          0/10          │
│   reject-examples.jsonl 0 字节 · 必须 §6 预填  │
├─────────────────────────────────────────────────┤
│ 🟡 测试金标准可准备度              6/10          │
│   sally 5 步参考 · 70 条需自造 · 没原版 prompt 对照│
└─────────────────────────────────────────────────┘

  按维度看 · 不汇总总分(参 knowledge-base/12-knowledge-management/03 教训)

  关键判断 · ARCHITECTURE-driven 整体可行 · 但 §6 anti_patterns 预填 + 
            §2 强制 4 类 AC + §4 LLM Judge 金标准来源规范 是 PRD-1 启动前的硬门槛
```

### §0.3 10 个真实缺口(按严重度 · 详 §5 修复路径)

| # | 缺口 | 实测证据 | 严重度 | §5 章节 |
|:-:|---|---|:-:|:-:|
| 1 | reject-examples.jsonl 空 → 自动注入 0 条反例 | `wc -l ~/.claude/playbooks/reject-examples.jsonl` = 0 | 🔴 P0 | §5.1 |
| 2 | 14 Phase 退出条件只覆盖 happy path · 错误/边界/性能 AC 缺位 | grep ARCHITECTURE 退出条件 L2813-2899 共 9 行 · 全部仅 happy 描述 | 🔴 P0 | §5.2 |
| 3 | 14 工具页中 10 个无专属设计稿 | `ls /ui/ \| wc -l` 实测 66 子目录 · 工具页专属仅 ai_copywriting_studio×2 + ai_storyboard + ip_voice_chat + market_intelligence_hub = 4 | 🟠 P1 | §5.3 |
| 4 | step6/step8 schema 推断(sally 实测 lastResult=null)| ARCHITECTURE L761 + L763 + DATA-MODEL L938 实测标 "⚠️ schema 推断" | 🟠 P1 | §5.4 |
| 5 | LLM Judge 100 金标准来源不明 | spec 附录 C L9162 "step6/8 sally 没用过" + L9159 "AI prompts 模板拿不到" | 🟠 P1 | §5.5 |
| 6 | 14 PRD 内部 US 间 depends_on 不能预画 | 设计判断 · US 拆分由 prd skill 写 PRD 时定 | 🟡 P2 | §5.6 |
| 7 | procedure input/output zod schema 待填 | ARCHITECTURE §3.2 仅给 procedure 名 · packages/schemas/admin/ 仅占位 | 🟡 P2 | §5.7 |
| 8 | 6 闸鉴权链 middleware 骨架 | ADMIN §5.3 给链顺序 · 具体代码 P9.0 实施 | 🟡 P2 | §5.8 |
| 9 | step9 复盘已规划未实现 | ARCHITECTURE L383 标 "已规划但未实现" | 🟢 P3 | §5.9 |
| 10 | user_history_vec / 语音录音 / pgvector L3 多处"可选" | ARCHITECTURE 多处 grep `可选` 命中 13 处 · 都不阻塞 | 🟢 P3 | §5.10 |

### §0.4 一句话结论

> **ARCHITECTURE-driven PRD 模式整体可行(7 维度中 3 ✅ + 3 🟡 + 1 🔴)** ·
> 关键阻塞是 **🔴 P0 #1 反例库空** + **🔴 P0 #2 错误 AC 缺位** — 这两项必须在 PRD-1 启动前完成(§6 预填反例 / §2 模板强制 4 类 AC)·
> 其余 8 个缺口都是 P1/P2/P3 · 可滚动修复或不动。

---

## §1 14 PRD 全景索引

> 14 份 PRD = 主应用 P0-P8(9 份)+ admin P9.0-P9.4(5 份) · 对应 ARCHITECTURE §9 + ADMIN §8。
> 每份 PRD 是该 Phase 的"轻量执行清单" · 只补 ARCHITECTURE 没覆盖的"US/AC/risk/depends/anti"五字段。

### §1.1 主应用 9 份 PRD(P0-P8)

| PRD | Phase | 周期 | risk | 引用 ARCHITECTURE | 引用 ADMIN | 引用其他 | 关键 US 数(预估)| depends_on | 状态 |
|:-:|---|:-:|:-:|---|---|---|:-:|---|:-:|
| **PRD-1** | P0 基础设施 | 2w | foundation | §9.2 + §1.4b + §1.5 + §8 | — | SCAFFOLD §A · AGENTS §1-§9 · ADR-019 | 6-8 | (无)| 🔵 待写 |
| **PRD-2** | P1 数据底座 | 2w | foundation | §9.3 + §3 + §1.4 | §4(admin RLS bypass)+ §13(admin 索引)| DATA-MODEL.md 全 · ADR-010/011/012 · AGENTS §3 LD-009 | 8-10 | PRD-1 | 🔵 待写 |
| **PRD-3** | P2 路由 + 首页 | 1w | medium | §9.4 + §2.5 6 新模块 + §8 | — | ui/ 33 主路由稿 · spec §Ⅴ §Ⅵ | 5-7 | PRD-1, PRD-2 | 🔵 待写 |
| **PRD-4** | P3 IP 主流程 9 步 ★ | 3w | high | §9.5 + §4 + §6 + §2.2 | — | 11/02 八 Agent · ui/step_* 设计稿 · DATA-MODEL §4 | 14-18(每步 1-2 US) | PRD-2, PRD-3 | 🔵 待写 |
| **PRD-5** | P4 创作模块 | 2w | high | §9.6 + §2.4 14 工具表 | — | 05-vertical/02 爆款文案(22 元素 + 20 脚本) · ui/ai_copywriting_studio | 8-10 | PRD-4 | 🔵 待写 |
| **PRD-6** | P5 视频模块 | 2w | high | §9.7 + §9.13b trending 合规 | §3.4 域 ⑦(为 P9.2 埋点)| 05-vertical/03 视频 · ui/ai_storyboard · ADR-017 | 8-10 | PRD-4, PRD-5 | 🔵 待写 |
| **PRD-7** | P6 私域 + 变现 | 1w | medium | §9.8 + §2.4 | — | 05-vertical/04 + 05 私域 6 阶段 | 4-6 | PRD-4 | 🔵 待写 |
| **PRD-8** | P7 智能工具 ★ | 2w | high | §9.9 + §2.5 + §4.4 + §5 | §3.4 域 ⑧(为 P9.2 埋点)| ADR-018 · 11/04 五层记忆 · 两种记忆范式 | 10-12(3 L5 自治) | PRD-4 | 🔵 待写 |
| **PRD-9** | P8 知识库 + 静态页 | 1w | low | §9.10 + §3.6 | — | 03 RAG 架构 · 11/03 ChromaDB 实战 | 4-6 | PRD-4 | 🔵 待写 |

> ⚠️ **PRD-1 + PRD-2** 标 `risk_level=foundation`(参全局 CLAUDE.md 决策 1) · 因为这两个被 PRD-3 ~ PRD-9 全部 depends_on · 一旦出 bug 下游全炸。
> ⚠️ **PRD-4(P3 IP 主流程)** 是核心战场 · risk=high · 周期 3 周 · 单元 + 集成 + E2E + LLM Judge 全要齐。

### §1.2 admin 5 份 PRD(P9.0-P9.4)

| PRD | Phase | 周期 | risk | 引用 ADMIN | 引用 ARCHITECTURE | 引用其他 | 关键 US 数(预估)| depends_on | 状态 |
|:-:|---|:-:|:-:|---|---|---|:-:|---|:-:|
| **PRD-10** | P9.0 admin 基础设施 | 1w | foundation | §1 + §2 + §4 + §5 + §7 + §8.2 | §1.4b + §2.5b | SCAFFOLD §A · AGENTS §10 · ADR-021 + ADR-019 | 8-10 | PRD-1(可与 PRD-9 / 主 P8 并行起步) | 🔵 待写 |
| **PRD-11** | P9.1 6 个 P0 业务核心域 | 3w | high | §3.2 域 ①②③④⑤⑥ + §6 + §8.3 | §9.X 主应用 4 项埋点(P1+P3) | DATA-MODEL §13 · reference/Agent 运营数据分析框架 | 18-24(每域 3-4 US) | PRD-10 + PRD-2(P1 索引)+ PRD-4(cost_log RLS) | 🔵 待写 |
| **PRD-12** | P9.2 2 个 P0 内容审核域 | 2w | high | §3.4 域 ⑦⑧ + §8.4 | §9.X(P5 + P7 Worker 改造)| ADR-017 + reference/Agent 安全架构 | 8-10 | PRD-10 + PRD-6(P5 trending 改造)+ PRD-8(P7 file-parser 改造) | 🔵 待写 |
| **PRD-13** | P9.3 5 个 P1 健康度域 | 2w | high | §3.5 域 ⑨⑩⑪⑫⑬ + §4.4 + §7.6 + §8.5 | — | ADR-016 + ADR-020 + LLMOps 指南 | 15-20 | PRD-10 + PRD-11 | 🔵 待写 |
| **PRD-14** | P9.4 3 个 P2 高级域 | 1w(可后续)| medium | §3.7 域 ⑭⑮⑯ + §8.6 | — | reference/A/B 测试 + LLMOps | 8-10 | PRD-13 | 🔵 待写 |

### §1.3 14 PRD depends_on 总图

```
PRD-1 (P0 基础设施 · foundation)
  ├─→ PRD-2 (P1 数据底座 · foundation)
  │     ├─→ PRD-3 (P2 路由 · medium)
  │     │     └─→ PRD-4 (P3 IP 主流程 ★ high)
  │     │           ├─→ PRD-5 (P4 创作 · high)
  │     │           ├─→ PRD-6 (P5 视频 · high)
  │     │           ├─→ PRD-7 (P6 私域 · medium)
  │     │           ├─→ PRD-8 (P7 智能工具 ★ high)
  │     │           └─→ PRD-9 (P8 知识库 · low)
  │     │
  │     └─→ PRD-11 (P9.1 6 P0 业务域 · high) ← PRD-10
  │
  └─→ PRD-10 (P9.0 admin 基础 · foundation · 可与 PRD-9 / 主 P8 并行)
        ├─→ PRD-11 (P9.1 · high) ← PRD-2 + PRD-4
        │     └─→ PRD-13 (P9.3 5 P1 域 · high)
        │           └─→ PRD-14 (P9.4 3 P2 域 · medium · 可后续)
        ├─→ PRD-12 (P9.2 内容审核 · high) ← PRD-6 + PRD-8
        └─→ PRD-13 ← PRD-11

  时间线(主线 16w + admin 9w · 串行 = 25w 总周期):
    主应用 ·  PRD-1 → PRD-2 → PRD-3 → PRD-4 → PRD-5 → PRD-6 → PRD-7 → PRD-8 → PRD-9
              [2w]   [2w]   [1w]   [3w]   [2w]   [2w]   [1w]   [2w]   [1w]   = 16w
    admin ·                                                                  └─→ PRD-10(1w · ★ 主应用 P8 完成后启动)
                                                                                  └─→ PRD-11(3w)
                                                                                       └─→ PRD-12(2w)
                                                                                            └─→ PRD-13(2w)
                                                                                                 └─→ PRD-14(1w 可后续)
  ⚠️ 2026-05-07 v0.2 修订 · ralph.py 单 PROJECT_ROOT 限制 · 串行执行 · 总 25w(原 v0.1 写 24w · 含并行 · 并行不可行 · 详 §3.5 + §7.4)
```

### §1.4 索引使用说明 + 状态切换协议(★ 2026-05-07 v0.2 加 P1-8)

#### A · 状态标记 4 档 + 切换协议

| 状态 | 含义 | 触发切换的事件 | 谁切换 | 维护位置 |
|:-:|---|---|---|---|
| 🔵 **待写** | 还没开始写 PRD | (初始状态) | — | 本文件 §1.1 / §1.2 表 |
| 🟡 **进行中** | prd skill 已开始派生 / ralph daemon 正在跑 | `prd skill` 调用时(Phase A:写)/ `python ralph.py --daemon` 启动时(Phase B:跑) | prd skill 自动 / 用户手动跑 ralph 时 | 本文件 §1.1 / §1.2 表 + tasks/prd-N.md frontmatter |
| 🟢 **已完成** | 该 PRD 全 AC 过 + /goal-verify 双向对账过 + /prd-retro 反哺反例库完成 | `/goal-verify` 输出 verified=true | Opus(运行 /goal-verify 后)+ 用户人工确认 | 本文件 §1.1 / §1.2 表 |
| 🔴 **阻塞** | 实施失败(参 §5.12 4 级失败)/ 上游 PRD 出 bug / ARCHITECTURE 必须改 | ralph reject_reason="architecture_drift" / story 累计 reject ≥ 5 | Ralph 自动写 audit-gate.json status=blocked + 通知 Opus + 用户 | 本文件 §1.1 / §1.2 表 + audit-gate.json |

#### B · 状态生命周期(标准流转)

```
🔵 待写
   │ prd skill 启动
   ▼
🟡 进行中(Phase A · 写 PRD 文件)
   │ prd skill 完成 + tasks/prd-N.md 写好
   ▼
🟡 进行中(Phase B · ralph daemon 跑)
   │
   ├── 跑通(全 AC 过)
   │     │ /goal-verify verified=true + /prd-retro 完成
   │     ▼
   │  🟢 已完成
   │
   └── 失败(reject ≥ 5 / architecture_drift / 上游 bug)
         │ ralph 写 audit-gate.json blocked
         ▼
      🔴 阻塞
         │ §5.12 回滚处理 · 改 PRD / 改 ARCHITECTURE / 拆 story
         ▼
      🟡 进行中(重新跑)
```

#### C · 状态切换的"硬约束"

- ✅ 状态切换必有 trigger 事件(不允许无故改)
- ✅ 状态切换必写 progress.txt(append-only · 时间戳 + 切换原因)
- ✅ 🟢 状态必有 /goal-verify 输出作证据
- ❌ 不允许跳过 🟡 直接 🔵→🟢
- ❌ 不允许从 🟢 回退到 🟡(只能开新版本 / 新 PRD-N+0.1 hotfix)

#### D · 索引使用说明

- **状态标记** · 见 A 表 + B 生命周期
- **关键路径** · PRD-1 → PRD-2 → PRD-4 是骨干 · 任一延期影响全部下游
- **每份 PRD 的体量** · 预估 10-20KB / 100-200 行(轻量模板 · §2 锁定)
- **执行节奏** · 严格串行(单 daemon · 方案 A · 25 周总周期 · 详 §7.4)

#### E · 14 PRD ownership 矩阵(★ 2026-05-07 v0.2 加 P1-7)

> review 发现 v0.1 没说"每份 PRD 谁写 / 谁 review / 谁切状态" · 实施期不清晰会导致职责漂移。本节给标准 4 角色定义。

| 角色 | 职责 | 14 PRD 中负责的工作 |
|---|---|---|
| **PRD 作者**(`prd_author`) | 写 tasks/prd-N.md(Phase A) | prd skill(Opus 主对话)/ 复杂场景人工补 |
| **PRD 审核**(`prd_reviewer`) | 在 prd skill 输出后 + ralph 执行前 review · 跑 /plan-check 7 项 | Opus 主对话 |
| **PRD 执行**(`prd_executor`) | 跑 ralph daemon 写代码 + 自审 | Ralph Agent(Sonnet)|
| **PRD 验收**(`prd_verifier`) | story 级 audit + PRD 级 /goal-verify + /prd-retro | Opus 主对话(每 story 后)+ 用户(/goal-verify 双向对账时)|

#### F · 14 PRD 默认 ownership 分配

| PRD | 作者 | 审核 | 执行 | 验收 | 用户介入点 |
|:-:|:-:|:-:|:-:|:-:|---|
| PRD-1 ~ PRD-9(主应用)| prd skill | Opus | Ralph(Sonnet)| Opus + 用户 | 写 PRD 时(确认决策)+ /goal-verify 双向对账 |
| PRD-10 ~ PRD-14(admin) | prd skill | Opus | Ralph(Sonnet)| Opus + 用户 | 同上 + Approval Gates 高风险动作(参 ADMIN §7.6 14 类) |

> 当前是 1 人(用户)+ AI(Claude Opus + Ralph Sonnet)项目 · 4 角色都映射到 1 人 + AI 协作。如果未来扩展到团队 · 此矩阵可拆分(`prd_author`=PM / `prd_reviewer`=架构师 / `prd_executor`=工程师 + Ralph / `prd_verifier`=QA + Opus)。

#### G · ownership 写到 PRD 文件 frontmatter

每份 tasks/prd-N.md 在 frontmatter 必含 ownership:

```markdown
---
prd_id: PRD-1
phase: P0 基础设施
risk_level: foundation
depends_on: []

# ownership(★ 2026-05-07 v0.2 加 P1-7)
prd_author: prd skill (Opus)
prd_reviewer: Opus(主对话)
prd_executor: Ralph Agent (Sonnet · daemon)
prd_verifier: Opus + 用户

# 状态(★ 2026-05-07 v0.2 加 P1-8)
status: 🔵 待写  # 🔵 待写 / 🟡 进行中 / 🟢 已完成 / 🔴 阻塞
status_history:
  - YYYY-MM-DD HH:MM · 🔵 → 🟡 · prd skill 启动
---
```

---

## §2 PRD 写作模板 v1.0(锁定版)

> 本章是 14 份 PRD 的**写作宪法** · 锁定后任何 PRD 必须按此结构写。
> **核心设计原则** · 跟传统 PRD 比 · 砍掉所有 ARCHITECTURE 已覆盖的部分(业务模型 / UI / 数据 / 接口 / 退出条件)· 只补 5 字段:**US / AC(★ 4 类必含) / risk / depends / anti**。

### §2.1 模板结构

```markdown
# PRD-N · <Phase 名称>

> **派生自** · ARCHITECTURE.md §X.Y · ADMIN-ARCHITECTURE.md §X.Y(如适用)
> **风险等级** · low / medium / high / foundation
> **依赖前置** · PRD-(N-X) 已完成
> **预估周期** · X 周
> **作者 / 审核** · prd skill / Opus

---

## §0 引用清单(单一真理来源 · 不复制大段)

| 维度 | 来源(只引用 · 不复制) |
|---|---|
| 业务模型 | [ARCHITECTURE.md §X.Y](ARCHITECTURE.md#§X.Y) |
| UI 设计稿 | [ui/<目录>](ui/<目录>) · 共 N 张 · 重点稿:<列出 1-3 张> |
| 数据契约 | [DATA-MODEL.md §X](DATA-MODEL.md#§X) · 涉及实体:<列出 1-5 个> |
| 接口契约 | [ARCHITECTURE.md §6.X](ARCHITECTURE.md#§6.X) · 涉及 procedure:<列出 1-N 个> |
| 退出条件 | [ARCHITECTURE.md §9.X](ARCHITECTURE.md#§9.X) · 完整粘贴在本 PRD §6 |
| 不做的事 | [AGENTS.md §1.4](AGENTS.md#§1.4) + 本 PRD §3 范围排除 |
| 代码层约束 | [AGENTS.md §X](AGENTS.md#§X) · 主应用部分;§10(如涉及 admin) |
| 关联 ADR | ADR-XXX / ADR-YYY |
| 反例库 | [PRD-MASTER.md §6 anti-patterns](PRD-MASTER.md#§6) + ~/.claude/playbooks/reject-examples.jsonl |

## §1 用户故事(US-001 ~ US-NN)

> ★ ARCHITECTURE 没有 · PRD 必填。每个 US 是 1 个可独立交付 + 可独立验收的最小单元 · 跟 ralph 的 1 个 story 一一映射。

### US-001 · <故事标题>

- **As**(角色)· 引用 ARCHITECTURE §1.6 4 类用户之一(IP 起号者 / OPC / 转型者 / MCN)· 或 admin 子系统的 6 类内部用户(super_admin / admin / cs / reviewer / finance / legal)
- **I want**(具体动作)· 引用 ARCHITECTURE §X.Y 业务流程
- **So that**(目的)· 关联北极星指标(NSM)或子指标(参 AGENTS §1.2)
- **risk_level** · low / medium / high / foundation(详 §4.1)
- **depends_on** · [US-XXX, US-YYY] · 空表示无依赖
- **anti_patterns** · 由 prd skill 自动从 reject-examples.jsonl grep 注入(参 §6)
- **测试配额** · M 单元 + N 集成 + K E2E + J LLM Judge 金标准(详 §4.5)

(US-002 ~ US-NN 同上)

## §2 验收标准(AC · ★ 4 类必含)

> ★ 强制规范(对应 §0.1 维度 2 + §5.2 缺口修复)· 每个 US 必有以下 4 类 AC:

### AC-001-H(对应 US-001 happy path · 必含)

- **Given** · <前置状态 · 含数据 / 用户角色 / 系统状态>
- **When** · <用户/系统动作 · 引用 ARCHITECTURE §6 procedure 或 §2 业务流程>
- **Then** · <期望结果 · 必须可机器验证 · 含数据库状态 / API 响应 / UI 状态>

### AC-001-E(对应 US-001 error path · 必含 ≥ 1 条)

- 错误场景 1 · <如 LLM 超时>
  - Given / When / Then
- 错误场景 2 · <如 网络断>
  - Given / When / Then

### AC-001-B(对应 US-001 边界条件 · 必含 ≥ 1 条)

- 边界场景 1 · <如 输入超长 / 空输入 / 用户切换账号 / 配额耗尽>
  - Given / When / Then

### AC-001-P(对应 US-001 性能 · 必含 ≥ 1 条)

- 性能场景 1 · <如 P50 latency / P99 latency / token 用量 / cost>
  - Given / When / Then(必含数字阈值)

(AC-002-H/E/B/P ~ AC-NN-H/E/B/P 同上)

## §3 范围排除(明确不做)

> 引用 AGENTS §1.4(全局不做事项)+ 本 PRD 特有的 out-of-scope。

| # | 不做的事 | 理由 | 排到哪个版本 |
|:-:|---|---|:-:|
| 1 | <例:本 Phase 不做语音流式 SSE> | <理由> | <PRD-X 或 1.0 之后> |

## §4 风险 + 缓解

> 从 ARCHITECTURE §9.X 风险表派生 + 本 PRD 特有风险。

| # | 风险 | 严重度 | 缓解 | 触发回滚条件 |
|:-:|---|:-:|---|---|
| 1 | <例:9 步并发冲突> | 高 | <例:乐观锁 version 字段> | <例:冲突率 > 5% 一周> |

## §5 测试配额(★ 跟 §4.5 规范对齐)

| 类别 | 数量 | 范围 | 工具 |
|---|:-:|---|---|
| 单元 | N 用例 | 每 US 平均 N/(US 数)用例 | vitest |
| 集成 | N 用例 | 跨 procedure + DB | vitest + prisma 测试 DB |
| E2E | N 用例 | 主链路 | playwright |
| LLM Judge | N 条金标准 | 每 Specialist N/(涉及 Specialist 数) | GPT-4o Judge · 阈值 4.0 |

## §6 退出条件(从 ARCHITECTURE §9.X 完整粘贴 + AC 总和)

> 完整粘贴 ARCHITECTURE.md §9.X 该 Phase 的退出条件 · 加 PRD §2 全部 AC 通过。

[完整粘贴 ARCHITECTURE §9.X 退出条件原文]

**总和验收清单**:
- [ ] 上述 ARCHITECTURE 退出条件全部满足
- [ ] PRD §2 全部 AC-XXX-H 通过
- [ ] PRD §2 全部 AC-XXX-E 通过(关键错误场景)
- [ ] PRD §2 全部 AC-XXX-B 通过(关键边界)
- [ ] PRD §2 全部 AC-XXX-P 满足性能阈值
- [ ] §5 测试配额全部达成
- [ ] LLM Judge 评分 ≥ 4.0(若涉及 Specialist)
- [ ] AGENTS § 红线 0 触发(grep 检测)
- [ ] §4 高风险无未缓解项

## §7 跟 Coding 3.0 的协同协议

| 步骤 | 本 PRD 在该步的输入 / 输出 |
|---|---|
| `prd skill` 转 prd.json | 输入本文件 · 输出 prd.json(US-NN → story-NN 1:1 映射) |
| `/plan-check` | 检查 §1 US 完整 · §2 AC 4 类齐 · §4 风险有缓解 · §5 测试配额合理 |
| `ralph.py --workspace=apps/X` | 读 prd.json · 按 risk_level + depends_on 拓扑执行 |
| Opus audit(每 story 后)| 看 §2 AC 是否过 · 看 AGENTS § 红线 / §10(admin)是否触发 · 看 ARCHITECTURE §X.Y 引用是否一致 |
| `/goal-verify` | 双向对账 · 实际代码 vs PRD §2 AC + 实际代码 vs ARCHITECTURE 接口契约 |

## §8 修订记录

- vN.M · YYYY-MM-DD · <作者> · <一句话总结>
```

### §2.2 字段语义详解

#### A · §0 引用清单(避免漂移的关键)

**为什么不复制 ARCHITECTURE 大段** · 复制 → ARCHITECTURE 改了 PRD 不动 → PRD 信息陈旧 → Ralph 按陈旧信息写代码 → 跟主架构漂移。

**为什么"完整粘贴退出条件"是例外**(§6) · 因为退出条件是验收硬门槛 · PRD 必须自包含可执行 · 不能让 Opus audit 时还要跳到 ARCHITECTURE 找。

**写作要求**:
- ✅ 每行引用必带 file:line 锚点(如 `ARCHITECTURE.md#§6.4`)
- ✅ "重点稿"列出 1-3 张 ui/ 设计稿(不是全部 64 张都列)
- ✅ "涉及实体"列出 1-5 个(不是 31 个全列)
- ❌ 禁止泛指引用(如"参 ARCHITECTURE")· 必须到 §X.Y 级

#### B · §1 用户故事(为什么用 BDD-Lite 格式)

**As / I want / So that 三段式** · 对应:
- As · 用户角色(从 ARCHITECTURE §1.6 选)
- I want · 具体功能(可机器验证)
- So that · 业务价值(关联 NSM)

**risk_level 怎么选** · 详 §4.1 4 档定义。

**anti_patterns 自动注入** · 由 prd skill 跑 `reject-examples.jsonl` 关键词 grep · 注入 ≤3 条相关历史教训(参全局 CLAUDE.md "Reject 反例自动入库 + 注入"机制)。

**测试配额** · 由 §4.5 规范派生 · 每份 PRD 总测试用例 = 单元 + 集成 + E2E + Judge · 不是每个 US 都要齐 4 类 · 但每份 PRD 总数有最低门槛。

#### C · §2 验收标准(★ 4 类必含 · 修复 §0 维度 2 缺口)

> 这是本模板的**最关键创新** · 解决 ARCHITECTURE §9.X 退出条件只覆盖 happy path 的问题。

**4 类 AC 的必填规则**:

| 类别 | 后缀 | 含义 | 数量 |
|:-:|:-:|---|:-:|
| Happy | -H | 主路径 · 用户按设计走 → 拿到结果 | 每 US 必有 1 条 |
| Error | -E | 错误路径 · LLM 超时/网络断/服务挂等 | 每 US ≥ 1 条 |
| Boundary | -B | 边界条件 · 输入超长/空/切换账号/配额耗尽等 | 每 US ≥ 1 条 |
| Performance | -P | 性能 · 必含数字阈值(如 P99 < 3s) | 每 US ≥ 1 条 |

**示范**(以 PRD-4 P3 主流程的 step7 文案生成 US-005 为例):

```markdown
### US-005 · 用户在 step7 用 CopywritingAgent 生成文案

- As · IP 起号者(ARCHITECTURE §1.6 第 1 类)
- I want · 选 scriptType + elements + topic · 点"生成" · 看到 markdown 文案
- So that · 完成 9 步主向导第 7 步 · 推进 NSM「9 步完成率」(目标 > 30%)

### AC-005-H(happy)
- Given · 用户已完成 step1+3+3b+4b · activeAccountId 已设
- When · POST /trpc/copywriting.generate · input={scriptType:'opinion', elements:['fear'], topic:'XXX'}
- Then ·
  - 响应含 lastResult: string(markdown · 长度 ≥ 500)
  - history 表新增 1 行 · trace_id 写入
  - LS aiip_memory_acc_{id}_step7_copywriting 写入
  - feedback 按钮可点
  - 响应时间 < 30s

### AC-005-E(error)
- 场景 E1 · LLM Gateway 超时
  - Given · 同上
  - When · LLMGateway 60s timeout
  - Then · 重试 1 次 → 仍失败 → 降到 lightweight tier · 仍失败返回 fallback 模板("AI 暂不可用 · 模板:...") · history 标 is_fallback=true · trace 完整
- 场景 E2 · zod 校验失败
  - Given · 同上
  - When · LLM 输出非 markdown(如返回 JSON 错误)
  - Then · 重试 1 次 · 失败 toast "生成失败 · 请重试" · history 标 zod_failed=true

### AC-005-B(boundary)
- 场景 B1 · topic 超长(> 500 字)
  - Given · 同上
  - When · topic = "X" * 600
  - Then · 客户端 hook 截断到 500 字 + toast 提示 / 服务端二次校验 reject 返回 400
- 场景 B2 · 用户中途切换账号
  - Given · 用户在 step7 提交后 · 等待 LLM 返回时切换 activeAccountId
  - Then · 当前生成不影响 · 写入仍属原账号 · 切到新账号后该结果不展示

### AC-005-P(performance)
- 场景 P1 · 单次调用
  - P50 latency < 12s · P99 < 30s
  - input + output token 总 < 16K(对应 reasoning tier 上限)
  - cost < $0.30 / 次(对应 ARCHITECTURE §9.12b 估算)
```

> 🟢 **这就是 ARCHITECTURE-driven 模式的精华** · 不重写业务(business 由 ARCHITECTURE §2.4 + ui/aiipznt_studio 给) · 只补"4 类 AC + 性能阈值"的工程合约。

#### D · §3 范围排除(防止 scope creep)

引用 AGENTS §1.4(全局不做)+ 本 Phase 特有 out-of-scope。例:

```
本 Phase(P3 主流程)不做的事:
| 不做 | 理由 | 排到哪 |
|---|---|---|
| step6/step8 真实输出生成 | sally 实测 lastResult=null · schema 推断 · 留 P5/P7 | PRD-6 / PRD-8 |
| 用户自定义 LLM 模型(自带 API Key)| AGENTS §1.4 明列 | 1.0 之后 |
```

#### E · §4 风险(必带触发回滚条件)

每个风险必带"触发回滚条件" — 当指标恶化到什么阈值就回滚(不是嘴上说"出问题就回滚")。

#### F · §5 测试配额(详 §4.5)

#### G · §6 退出条件(完整粘贴 + 总和验收清单)

#### H · §7 跟 Coding 3.0 的协同协议

每份 PRD 显式声明跟 prd skill / ralph / Opus audit 的协议 · 让 Opus 知道在每个步骤检查什么。

### §2.3 反例 · 不要这样写 PRD(★ 真实陷阱)

| 反例 | 为什么不行 | 应该怎样 |
|---|---|---|
| US 写"作为用户 · 我希望系统好用" | 不可机器验证 · 太抽象 | 具体到"作为 IP 起号者 · 我希望 30s 内拿到 step7 文案 · 跑通 NSM 9 步完成率" |
| AC 只写 happy path | 修复了 §0 维度 2 缺口 — 必须 4 类齐 | 每 US 必含 -H/-E/-B/-P |
| AC 写"系统响应快" | 没数字 · Opus audit 无法判断 | "P99 < 3s · cost < $0.30" |
| 复制 ARCHITECTURE 整章到 PRD | 信息漂移源 | §0 引用清单 + §6 仅完整粘贴退出条件 |
| risk_level 全填 medium | 没用心评估 · ralph 拓扑会误调度 | 按 §4.1 4 档严格评估 · foundation/high/medium/low |
| depends_on 留空 | ralph 串行/并行调度依据 | 哪怕"无依赖"也要明确写 `depends_on: []` |
| anti_patterns 留空 | 错过历史教训 | prd skill 自动注入 · 写 PRD 时不动手填 |
| 测试配额拍脑袋写"100 用例" | 没分类 · 没法验收 | 按 §4.5 规范分单元/集成/E2E/Judge |

---

## §3 ARCHITECTURE-driven 工作流详细协议

> 本章把 ARCHITECTURE-driven PRD 模式跟 Coding 3.0 工具链(全局 `~/.claude/CLAUDE.md` 12 步流程)的协议写清楚 · 每个工具在本模式下的输入输出 / 跟文档体系的引用关系。

### §3.1 全景:从 ARCHITECTURE 到 prod 的 5 阶段

```
阶段 1 · 文档冻结(已完成)
─────────────────────────────────────
  ARCHITECTURE.md v0.3 + ADMIN-ARCHITECTURE.md v0.1 + 5 配套(AGENTS/ADR/DATA-MODEL/PROMPTS/SCAFFOLD)
  + ui/(66 子目录 · 60+ 实际设计稿 + aurelian_dark/DESIGN.md)+ aiipznt-spec.md(322KB 复刻基线)
  ↓ 事实来源(SoT)
       ↓
阶段 2 · PRD-MASTER 总纲 + 14 PRD 派生(本阶段 · 当前在做)
─────────────────────────────────────
  本文件 §0-§8 · 锁定写作模板 + 反例预填 + 14 PRD 索引
  ↓
  prd skill ─→ tasks/prd-1.md ~ prd-14.md(轻量执行清单 · 每份 10-20KB)
       ↓
阶段 3 · ralph skill 转 prd.json
─────────────────────────────────────
  prd skill 输出 PRD 文件 · ralph skill 转 prd.json(JSON 结构化 · 每 US → 1 story)
       ↓ JSON · 含 anti_patterns(自动注入)+ depends_on + risk_level
       ↓
阶段 4 · ralph.py 自主执行循环 + Opus 审计 + Approval Gates
─────────────────────────────────────
  ralph.py --workspace=apps/X --prd-file=prd-N.json --daemon
    ├── Ralph Agent · 写代码 + commit
    ├── Validator Agent · X-6 零回归 + zod 校验 + AC 检查
    ├── Audit Gate · 写 audit-gate-N.json(pending)
    ├── Opus audit · 4 维度(AC/AGENTS/安全/PRD-架构一致性)
    └── approve / reject(reject 写入 reject-examples.jsonl)
       ↓
阶段 5 · /goal-verify · /prd-retro · 上线
─────────────────────────────────────
  /goal-verify · 双向对账(代码 vs PRD AC + 代码 vs ARCHITECTURE 接口契约)
  /prd-retro · 跨 PRD 复盘 · 提炼 playbook 回 reject-examples.jsonl
  上线 · 监控 · 反馈 · 进入下一份 PRD
```

### §3.2 prd skill 在本模式下的输入输出协议

```
prd skill 输入(调用时给):
  ① 哪份 PRD · "PRD-1 · P0 基础设施"
  ② ARCHITECTURE-driven 模式确认
  ③ 引用清单(从本文件 §1 PRD-N 行复制)·
     - ARCHITECTURE.md §X.Y
     - ADMIN-ARCHITECTURE.md §X.Y(如适用)
     - ui/<目录>
     - DATA-MODEL.md §X
     - 关联 ADR 编号

prd skill 内部行为:
  ① 读 ARCHITECTURE.md 引用章节 · 提取业务模型 / 退出条件
  ② 读 ui/ 引用目录 · 列出该 Phase 设计稿
  ③ 读 DATA-MODEL.md · 提取涉及实体 schema
  ④ 读 §1 PRD-N 行 · 拿 risk_level / depends_on / 关键 US 数预估
  ⑤ 按 §2 模板生成 PRD 草稿(US-001 ~ US-NN)
  ⑥ 每个 US 自动跑反例库 grep · 注入 anti_patterns(参 §6)
  ⑦ 每个 US 跑 4 类 AC 必填检查(-H/-E/-B/-P)
  ⑧ 输出 tasks/prd-N.md(完整 PRD)

prd skill 输出:
  · tasks/prd-N.md · 按 §2 模板写
  · 文件大小 10-20KB · 100-200 行
  · 含 §0-§8 全部章节
```

### §3.3 ralph skill 转 prd.json 的协议

```
ralph skill 输入:
  · tasks/prd-N.md(本仓库)
  · ~/.claude/playbooks/reject-examples.jsonl(反例库)

ralph skill 内部行为:
  ① 解析 PRD §1 US-001 ~ US-NN · 每个 US → 1 个 story
  ② 解析 §2 AC · 每条 AC → story.acceptance_criteria 一条
  ③ 解析 §1 US 的 risk_level · 写 story.risk_level
  ④ 解析 §1 US 的 depends_on · 写 story.depends_on(拓扑用)
  ⑤ 解析 §1 US 的 anti_patterns · 写 story.anti_patterns(prompt 注入用)
  ⑥ 解析 §0 引用清单 · 写 story.references(Opus audit 用)
  ⑦ 跑 W-patches 预埋(参全局 CLAUDE.md plan-check 机制)
  ⑧ 跑 risk_level 校验(downstream count ≥ 3 自动升 foundation · 详 §4.1)
  ⑨ 输出 prd.json

prd.json 关键字段(每 story):
{
  "id": "US-005",
  "title": "用户在 step7 用 CopywritingAgent 生成文案",
  "as_role": "IP 起号者",
  "i_want": "选 scriptType + elements + topic · 点'生成' · 看到 markdown 文案",
  "so_that": "完成 9 步主向导第 7 步 · 推进 NSM「9 步完成率」",
  "risk_level": "high",
  "depends_on": ["US-001", "US-002", "US-003", "US-004"],
  "anti_patterns": [
    "❌ Specialist execute() 内调 LLM 不走 LLMGateway(参 reject-examples #5)",
    "❌ history.create 不带 trace_id(参 reject-examples #12)"
  ],
  "acceptance_criteria": [
    {"id": "AC-005-H", "type": "happy", "given": "...", "when": "...", "then": "..."},
    {"id": "AC-005-E1", "type": "error", "given": "...", "when": "...", "then": "..."},
    {"id": "AC-005-B1", "type": "boundary", "given": "...", "when": "...", "then": "..."},
    {"id": "AC-005-P1", "type": "performance", "given": "...", "when": "...", "then": "P99 < 30s"}
  ],
  "references": [
    "ARCHITECTURE.md#§4.3-CopywritingAgent",
    "ARCHITECTURE.md#§6.7-流程1",
    "DATA-MODEL.md#§5.1-History",
    "ui/ai_copywriting_studio_1/code.html"
  ],
  "test_quota": {"unit": 4, "integration": 2, "e2e": 1, "llm_judge": 5}
}
```

### §3.4 /plan-check 在本模式下检查什么

```
/plan-check 检查清单(对 prd.json):
  □ 每个 story 有 risk_level · 不能空
  □ 每个 story 的 depends_on 是 [] 或都指向已存在的 story id
  □ 每个 story 的 acceptance_criteria 含至少 4 类(H/E/B/P 各 ≥ 1)★ 强制
  □ 每个 story 的 references 至少含 1 个 ARCHITECTURE.md 锚点 ★ ARCHITECTURE-driven 强制
  □ 每个 story 的 test_quota 4 类齐(unit/integration/e2e/llm_judge)
  □ foundation 档 story 必有 downstream count ≥ 3(自动升档逻辑)
  □ high 档 story 必有 anti_patterns ≥ 2 条
  □ 整体 · 14 PRD 总 story 数预估 100-130(参 §4.5 测试配额规范汇总)
```

### §3.5 ralph.py 在本模式下的执行协议(2026-05-07 v0.2 修订 · 对应 review P0-1)

> ⚠️ **v0.1 错误** · v0.1 写"用 `--workspace` `--prd-file` `--lock-file` `--audit-gate` `--cost-log` 5 个 cli 参数"是**编造的** · 实测 `~/.claude/scripts/ralph/ralph.py` 只支持 4 参数:`--model` / `--no-audit-gate` / `--daemon` + 1 个位置参数 `agent`(默认 `claude`)· 完全没有 workspace/prd-file 等 cli 参数。
>
> ⚠️ **ralph.py 实际工作原理** · 通过 `Path(__file__).parent.parent` 推 PROJECT_ROOT · 在该 root 下默认查 `scripts/ralph/prd.json` / `ralph-lock.json` / `audit-gate.json` / `cost-log.jsonl`。**一个 PROJECT_ROOT 只能跑一个 daemon**。

#### A · 真实启动命令(单 daemon · 14 PRD 串行)

```bash
# 在项目根 /Users/return/Desktop/QuanAn 跑 ralph.py
# 当前要跑哪份 PRD 就把对应 prd-N.json 复制为 scripts/ralph/prd.json
cp scripts/ralph/prd-1.json scripts/ralph/prd.json

# 启动 ralph daemon(仅 4 个真实参数)
python scripts/ralph/ralph.py --model sonnet --daemon

# 调试模式(跳过 Audit Gate · 仅开发用)
python scripts/ralph/ralph.py --model sonnet --no-audit-gate --daemon
```

> 详细参数说明见 `~/.claude/scripts/ralph/ralph.py` 实测 · 参数解析在文件 L60-80。

#### B · 14 PRD 严格串行(选方案 A · 详见 §7.4)

```
PRD-1 跑完 + Opus approve all stories → cp prd-2.json prd.json → 启 daemon → ... → PRD-14
```

**为什么选串行**(方案 A):
- ralph.py 单 PROJECT_ROOT 设计 · 同项目内不能并行
- 改全局 ralph.py 加 workspace 参数(方案 B)成本高(动全局工具 · 影响其他项目)
- admin 当独立 PROJECT_ROOT(方案 C)违反 monorepo 设计
- 串行总周期 25 周(主 16 + admin 9)· 比并行 24 周多 1 周 · 但工程简单度高

**串行的代价**:
- ❌ 失去主 P8 + admin P9.0 并行节流 1w 的机会
- ✅ ralph 工具链不动 · 风险低 · 可立即开工

#### C · PRD 切换的标准动作(每跑完 1 PRD)

```bash
# 1. 等当前 PRD 全部 stories 跑完(ralph.py 输出"所有任务已完成 / All stories resolved")
# 2. /goal-verify 双向对账(代码 vs PRD AC + 代码 vs ARCHITECTURE 接口契约)
# 3. /prd-retro 反哺反例库
python scripts/ralph/ralph-tools.py reject-export  # 把本 PRD reject 历史 append 到 reject-examples.jsonl

# 4. 备份当前 prd.json 为 prd-N.json(保留交付证据)
cp scripts/ralph/prd.json scripts/ralph/prd-1.done.json

# 5. 切下一份 PRD
cp scripts/ralph/prd-2.json scripts/ralph/prd.json

# 6. 清掉旧的 audit-gate / lock(ralph.py 启动时会自动恢复 · 但保险)
rm -f scripts/ralph/audit-gate.json scripts/ralph/ralph-lock.json

# 7. 重启 daemon
python scripts/ralph/ralph.py --model sonnet --daemon
```

> 写一个 `scripts/ralph/switch-prd.sh` 封装上面 7 步 · 实施期减少手动失误。

### §3.6 Opus audit 4 维度独立锚点

> ARCHITECTURE-driven 模式下 · Opus audit 4 维度仍有清晰独立锚点:

| 维度 | 锚点(独立 · 不混淆) | 检查方法 |
|---|---|---|
| 1 · AC 合规 | PRD §2 各 AC | 跑测试 · 看 AC-XXX-H/E/B/P 是否过 |
| 2 · 技术约束 | AGENTS §3-§9(主)+ §10(admin)| `bash scripts/audit-redlines.sh` + AGENTS §8 audit_commands |
| 3 · 安全 | AGENTS § 红线 + ADMIN §10.2 R-A | grep 红线触发 + 审计日志 |
| 4 · ARCHITECTURE 一致性 ★ | PRD §0 引用清单(锚点到 §X.Y)| Opus 跑 ARCHITECTURE 文件相关章节 vs 实际代码 · 看接口契约一致 |

**新增维度 4 是 ARCHITECTURE-driven 的关键** · 因为 PRD 不复制业务描述 · Opus 必须有"PRD AC + ARCHITECTURE 接口契约"双源审计能力。

### §3.7 /goal-verify 双向对账

```
/goal-verify 在 ARCHITECTURE-driven 下的两轨:

轨 A · 实际代码 vs PRD §2 AC(传统验收)
  对每个 AC-XXX-H/E/B/P · 跑测试 · 看是否过
  AC 通过率 100% 是必要条件

轨 B · 实际代码 vs ARCHITECTURE 接口契约 / DATA-MODEL schema(架构一致性)★ ARCHITECTURE-driven 加
  对 PRD §0 references 列的 ARCHITECTURE §X.Y 章节 · 检查代码实现是否一致
  例 · references 含 "ARCHITECTURE.md#§6.4-ContextAssembler" · 则代码 ContextAssembler.assemble() 必须实现 §6.4 表格里的全部字段
  例 · references 含 "DATA-MODEL.md#§5.1-History" · 则 prisma model History 字段必须跟 §5.1 对齐
  
  双轨都过才算 verified · 任一失败就算 PRD 未交付
```

### §3.8 /prd-retro 反哺反例库

```
/prd-retro 在本模式下做的事:
  ① 对比本 PRD 跟前一 PRD 的成功率
  ② 提取 reject 历史 · 写入 ~/.claude/playbooks/reject-examples.jsonl
     - 格式:{prd, story_id, attempt, reject_reason, fix_pattern, anti_pattern}
     - 关键 · anti_pattern 字段会被下一份 PRD 的 prd skill 检索注入
  ③ 提取 playbook · 写到 progress.txt
  ④ 不删反例(反例库 append-only)

效果 · 14 PRD 跑完后 · reject-examples.jsonl 有 100+ 条 QuanAn 专属反例
       下次开新项目时 · 这个反例库可以全局共享(参全局 CLAUDE.md "反例库跨项目积累")
```

### §3.10 实施期 ARCHITECTURE 改动流程(★ 2026-05-07 v0.2 新增 · 修复 review P1-6)

> review 发现 v0.1 说"ARCHITECTURE v0.3 是冻结点" · 但**没说真要改时怎么走流程**。实施期一定会发现某些细节没考虑到 · 必须有标准协议防止文档跟代码漂移。

#### A · 4 类"实施期改 ARCHITECTURE"的触发场景

| 场景 | 例子 | 严重度 | 处理方式 |
|---|---|:-:|---|
| **a · 无关紧要的笔误 / 链接坏** | 错别字 / file:line 偏移 | 🟢 低 | 直接改 · 无需 ADR · 在 ARCHITECTURE 修订记录追加 |
| **b · 业务模型遗漏(不变结构 · 加新模块)** | 跑 PRD-5 时发现 step5 的"selectedTopic 收藏到 my-topics"没考虑离线场景 | 🟡 中 | 加 ADR-022 / ADR-023 · 改 ARCHITECTURE.md 相关章节 · 通知所有未启动的 PRD 的引用清单 |
| **c · 接口契约改动(影响 procedure / Specialist)** | 跑 PRD-4 时发现 CopywritingAgent 输出必须含 cta 字段(原 PROMPTS.md 没说) | 🟠 高 | 走完整 ADR 流程 · 改 ARCHITECTURE + DATA-MODEL + AGENTS · 重新跑已 approved story 的 LLM Judge 看是否回归 |
| **d · 架构性失误(L4)** | 跑 PRD-6 时发现 ARCHITECTURE §6.5 LLMGateway 限流策略根本跑不通(实测后才发现) | 🔴 严重 | 整体暂停 · 开新 ADR + 重写 ARCHITECTURE 相关章 · 影响范围内的全部 PRD 重新评估 |

#### B · 标准 5 步流程(b/c/d 三类必走 · a 类直接改即可)

```
Step 1 · 发现问题
  Ralph Agent 写代码时发现 ARCHITECTURE 引用章节跑不通
  → 在 audit-gate.json 写 reject_reason="architecture_drift" + 详细描述
  → ralph.py 标 story=blocked
  → 通知 Opus

Step 2 · Opus 审判
  Opus audit 看 reject 详情 · 判断属于 a/b/c/d 类
  → a/b · 写新 ADR 草稿(标 status=proposed)
  → c · 写 ADR + 影响范围分析(列出受影响的 已 approved story · 待跑 PRD 引用清单)
  → d · 全局停 · 通知用户

Step 3 · 用户决策
  用户看 ADR 草稿 + 影响范围 · 决定 ·
  → accept · ADR 标 status=accepted · 进入 Step 4
  → reject · ADR 标 status=rejected · ralph 按原 ARCHITECTURE 死磕(可能要拆 story)
  → defer · 暂存 ADR(status=deferred)· 该 story 标 deferred · 跳过先跑别的

Step 4 · 改 ARCHITECTURE / DATA-MODEL / AGENTS / SCAFFOLD(全链路)
  按 ADR 决议改全部相关文档(同 §1.4b 的"互锁同心圆"原则 · 不能只改 1 处)
  ARCHITECTURE 修订记录追加 · 版本号 + 1(v0.3 → v0.4)
  
Step 5 · 影响传播 + 重跑
  → 已 approved 的 story · 看是否需要重跑 LLM Judge / 改代码(若是 c/d 类 · 100% 重跑)
  → 待跑 PRD · 改 §0 引用清单 + 相关 US/AC(若是 b/c/d 类 · 必改)
  → 反例库 append 新反例(把"为什么原版 ARCHITECTURE 错"沉淀)
  → 取消 story=blocked · 重启 ralph daemon
```

#### C · 改动频率上限(防止 ARCHITECTURE 失控)

| 频率 | 状态 |
|---|---|
| ≤ 2 处 / 月(a 类无限制 · b/c 类合计 ≤ 2 处)| ✅ 健康 |
| 3-5 处 / 月 | 🟡 警告 · 检查 PRD 写作粒度是否过粗 |
| ≥ 6 处 / 月 | 🔴 危险 · 暂停所有 ralph daemon · 整体 review ARCHITECTURE 是否有方向性问题 |

#### D · 不允许的事

```
❌ Ralph Agent 私自改 ARCHITECTURE.md(必须通过 Opus 审 + 用户批准)
❌ 跳过 ADR 改文档(b/c/d 类必有 ADR)
❌ 改了 ARCHITECTURE 不传播到下游 PRD(导致 PRD 引用陈旧)
❌ 改了 ARCHITECTURE 不重跑 LLM Judge(c/d 类影响 Specialist 输出)
❌ a 类改动也写 ADR(过度治理 · ADR 应该用于真有决策的事)
```

#### E · 跟 Coding 3.0 工具链的集成

```
当前 Coding 3.0 全局 ~/.claude/CLAUDE.md L329 写明 ·
  "改了一处 · 全栈同步 · 任一文档改了全栈跟"
本 §3.10 是这条规则在 ARCHITECTURE-driven 模式下的细化 ·
  · 加了 a/b/c/d 4 类分级
  · 加了 5 步流程 + 频率上限
  · 加了不允许的事 · 防止 Ralph 私改
```

### §3.11 §3 小结(2026-05-07 v0.2 修订)

本节答 6 件事:
1. **5 阶段** · 文档冻结 → PRD 派生 → prd.json → Ralph 执行 → goal-verify
2. **prd / ralph / ralph.py / Opus audit 协议**(单 daemon · 方案 A)
3. **prd.json 关键字段** · references / 4 类 AC / anti_patterns
4. **Opus audit 4 维度独立锚点** · 维度 4 ARCHITECTURE 一致性是新增
5. **/goal-verify 双向对账 + /prd-retro 反哺反例库**
6. **§3.10 实施期 ARCHITECTURE 改动流程** · a/b/c/d 4 类 · 5 步标准流程 · 频率上限 · 不允许私改

---

## §4 5 大支撑规范

> 本章把"PRD 写作 + ralph 执行 + Opus audit"过程中的 5 个共性规范固化下来 · 给所有 14 份 PRD 共用。

### §4.1 risk_level 4 档打分规范(对应全局 CLAUDE.md "Foundation 档分档")

| 档 | 含义 | 触发条件 | 实例 | Opus audit 强度 |
|:-:|---|---|---|---|
| **foundation** | 被 ≥ 3 个下游 story `depends_on` 的基础 story | downstream count ≥ 3 · 或属于 model/schema/protocol/conftest 类 | PRD-1 全部 P0 基础 / PRD-2 全部 schema · PRD-10 admin 基础 | §0 4 项实测 + §Z 全部域 grep + line-by-line + SQL 实测 + **必读全部相关测试** |
| **high** | gateway 热路径 / 金额 / 并发 / 安全 / 破坏性 | 涉及 LLM Gateway / 多账号隔离 / 进化飞轮 / 内容审核 / Approval Gates | PRD-4 主流程 9 步 / PRD-8 飞轮 / PRD-12 内容审核 | §0 + 通用 + 全部域 grep + line-by-line + SQL 实测 + 必读测试代码 |
| **medium** | service / CRUD API · 标准业务 | 涉及 1-2 个 procedure · 1 个 Specialist | PRD-3 路由 / PRD-7 私域 / PRD-14 P2 高级 | §0 + 通用 + 3-5 条 grep + 关键函数阅读 |
| **low** | 纯 model / 常量 / 小迁移 | 影响范围小 · 单文件 | 加常量 / 静态页 | §0 4 项实测 + 通用 4 维度 + 1-2 条 grep |

**自动升档规则**:
- ralph skill 转 prd.json 时跑 `python scripts/ralph/ralph-tools.py check-risk` 自动检测
- 当某 story 被 ≥ 3 个下游 depends_on · 自动从 low/medium 升 foundation
- 防 P0 rubber-stamp(参全局 CLAUDE.md 2026-05-04 升级 · "low 档 rubber-stamp 污染下游")

### §4.2 depends_on 拓扑规范

**14 PRD 间依赖图**(详 §1.3):

```
foundation 链 · PRD-1 → PRD-2(主)/ PRD-10(admin)
        ↓
high 链 · PRD-4 → PRD-5/6/7/8/9
        + PRD-11/12/13(admin)
        ↓
medium 链 · PRD-3 / PRD-14
```

**PRD 内部 US 间依赖** · 必须满足:
- ✅ 无环(DAG · ralph 拓扑排序前置)
- ✅ depends_on 列的 US 必须在同一 PRD 内 · 不允许跨 PRD 依赖(跨 PRD 通过 PRD 间 depends_on 表达)
- ✅ foundation 档 US 必有 ≥ 3 个 high/medium/low US depends_on 它

**示范** · PRD-4 内部 US 拓扑:

```
US-001 (foundation) · BaseSpecialist 抽象类
  ├─→ US-002 (foundation) · ContextAssembler 完整版
  │     └─→ US-003 ~ US-009(9 个 step Specialist · high)
  └─→ US-010 (foundation) · LLMGateway 完整(限流+降级+计费)
        └─→ US-003 ~ US-009 共享
```

### §4.3 anti_patterns 注入规范(★ 2026-05-07 v0.2 修订 · P2-9 去重)

> ⚠️ **跟 §3.3 的关系** · §3.3 讲"prd skill 转 prd.json 时何时注入" · 本节讲"注入用什么格式 + 怎么 grep" · 不重复 §3.3 的流程描述。

**注入触发** · 见 §3.3 第 ⑤ 步(prd skill 自动跑 · 不需要人工)

**注入算法**:
1. prd skill 解析 PRD 每个 US 的关键词(从 `i_want` 字段提取 `Specialist` / `LLM` / `RLS` / `Approval` 等)
2. 跑 `grep -E "<keyword>" ~/.claude/playbooks/reject-examples.jsonl`
3. 按 keywords 命中数排序 · 取相关度最高的 ≤ 3 条 · 注入到 story.anti_patterns

**反例 JSON 格式**(reject-examples.jsonl 单行):

```json
{
  "id": "REJ-001",
  "source_prd": "QuanAn-PRD-4",
  "source_story": "US-005",
  "domain": "Specialist",
  "keywords": ["Specialist", "LLM", "Gateway"],
  "anti_pattern": "❌ Specialist execute() 内直接调 anthropic.messages.create",
  "fix_pattern": "✅ 必须通过 LLMGateway.complete() · 由 Gateway 统一限流/降级/计费",
  "evidence": "AGENTS §3 LD-012 + ARCHITECTURE §6.5",
  "rejected_at": "2026-05-XX"
}
```

**首批预填 30+ 条** · 见 §6 PRD-anti-patterns 预填(★ 修复 §0 维度 6 + §5.1 缺口)

### §4.4 LLM Judge 100 金标准准备规范(★ 修复 §0 维度 7 + §5.5 缺口)

#### A · 100 条金标准的来源(双轨 · 共 100 条)

| 来源 | 数量 | 说明 |
|---|:-:|---|
| **轨 1 · sally 实测样本扩展**(参考基线 · 30 条)| 30 | aiipznt 已抓 sally step3/3b/4b/5/7 实测数据(参 spec 附录 C)· 每步 5-7 条样本作为"基线" · 但**不是答案** · LLM Judge 用来理解"原版输出风格" |
| **轨 2 · 自造金标准**(70 条)| 70 | 团队人工写 70 条覆盖 14 Specialist · 每个 Specialist ~5 条 · 含 happy / edge / 错误恢复场景 |
| **合计** | **100** | |

#### B · 每 Specialist 的金标准配额

```
14 Specialist × 5 条平均 = 70 条(轨 2)
sally 5 步参考 × 6 条平均 = 30 条(轨 1)
                          ─────────
                          100 条

具体分配 ·
  CopywritingAgent · 12 条(主力 · 4 mode × 3 条)
  BrandingAgent     · 10 条(2 mode × 5 条)
  TopicAgent        · 8 条(5 类 × 1-2 条)
  PositioningAgent  · 6 条(2 mode × 3 条)
  MonetizationAgent · 6 条
  VideoAgent        · 8 条(4 mode × 2 条)
  AnalysisAgent     · 6 条(2 mode × 3 条)
  其他 7 Specialist · 共 44 条(平均 6.3 条)
```

#### C · 准备时机(分阶段 · 不一次性写)

```
PRD-4 (P3 主流程 9 步)启动前 ·
  必备 · 主线 9 步对应 Specialist 的金标准(60 条 · CopywritingAgent + BrandingAgent + TopicAgent + 等)

PRD-5/6 启动前 ·
  补 · 创作 + 视频对应 Specialist 金标准(20 条 · CopywritingAgent 4 mode + VideoAgent 4 mode)

PRD-8 启动前 ·
  补 · L5 自治 Agent 金标准(10 条 · VoiceChatAgent + EvolutionAgent + DailyTaskAgent)

PRD-13 启动前(admin Prompt 版本管理) ·
  · LLM Judge CI 集成 · 100 条全部跑完
```

#### D · 评分规则

> 沿用 ARCHITECTURE §9.11-E.4 已就位:

| 维度 | 阈值 | 工具 |
|---|:-:|---|
| 结构完整性 | zod schema 100% 通过 | vitest |
| 内容相关性 | ≥ 4.0 / 5 | GPT-4o Judge |
| 风格一致性 | ≥ 0.7 cosine 相似度 | embedding 比对 |
| 进化有效性 | 进化前/后用户偏好金句出现率 ≥ 60% | 自定义跑批 |
| 回归保护 | 改 prompt 评分不降 | CI 集成 |

### §4.5 测试配额规范

#### A · 14 PRD 总配额预估

| 类别 | 14 PRD 总数 | 每 PRD 平均 | 跟 ARCHITECTURE §9.11-E 对齐 |
|---|:-:|:-:|---|
| 单元测试 | 200+ | ~14 / PRD | ARCHITECTURE §9.11-E.1 "200+ 用例 · 每 Specialist 平均 14" |
| 集成测试 | 60-80 | ~5 / PRD | §9.11-E.2 "40-60 用例" → 加 admin 后 60-80 |
| E2E | 18-20 | ~1.4 / PRD | §9.11-E.3 "8-10 主链路" + admin 8 = 16-18 |
| LLM Judge | 100 金标准 | (一次性 · 不平均到 PRD)| §9.11-E.4 "100 金标准 · 阈值 4.0" |

#### B · 每份 PRD 内部最低配额

| risk_level | 单元 | 集成 | E2E | Judge |
|:-:|:-:|:-:|:-:|:-:|
| foundation | ≥ 15 | ≥ 5 | ≥ 1 | ≥ 5(若涉及 Specialist)|
| high | ≥ 12 | ≥ 4 | ≥ 1 | ≥ 5 |
| medium | ≥ 8 | ≥ 2 | 0(如不涉及主链路)| 0(如不涉及 Specialist)|
| low | ≥ 5 | ≥ 1 | 0 | 0 |

#### C · 测试金字塔守则

```
┌──────────────────────┐
│  E2E(18-20)         │   关键用户旅程 · playwright
└──────────────────────┘
  ┌────────────────────────┐
  │ 集成(60-80)           │   tRPC procedure 端到端
  └────────────────────────┘
    ┌──────────────────────────────┐
    │ 单元(200+)                  │   Specialist input→output
    └──────────────────────────────┘
      ┌────────────────────────────────────┐
      │ 静态(类型 + lint + zod)           │   每 PR 必跑
      └────────────────────────────────────┘
      ┌────────────────────────────────────┐
      │ LLM Judge(100 条金标准)           │   夜跑 + Prompt 改动 CI 触发
      └────────────────────────────────────┘
```

### §4.6 5 大规范小结

本节答 5 件事:
1. **risk_level 4 档** · foundation/high/medium/low · 自动升档(downstream count ≥ 3)
2. **depends_on 拓扑** · 无环 + PRD 内 US · 跨 PRD 通过 PRD 间 depends_on 表达
3. **anti_patterns 注入** · prd skill 自动 grep · ≤ 3 条 · 30+ 反例首批预填(§6)
4. **LLM Judge 100 金标准** · sally 30 条参考 + 自造 70 条 · 分阶段准备
5. **测试配额** · 总 200+ 单元 / 60-80 集成 / 18-20 E2E / 100 Judge · 每 PRD 按 risk 分档配额

---

## §5 缺口清单 + 修复路径(10 项 · 实测发现)

> 把 §0.3 找到的 10 个缺口逐条展开 · 每条写"证据 / 严重度 / 修复路径 / 修复时机 / 谁来修"。

### §5.1 缺口 #1 · reject-examples.jsonl 空(🔴 P0 阻塞)

| 项 | 内容 |
|---|---|
| **证据** | `wc -l ~/.claude/playbooks/reject-examples.jsonl` 实测 = 0(文件存在但 0 字节)|
| **影响** | prd skill 转 prd.json 时按关键词检索反例库 · 当前**注入 0 条反例** · Ralph Agent 看不到任何历史教训 · 容易重复犯已知错误 |
| **严重度** | 🔴 P0 · 阻塞 PRD-1 启动 |
| **修复路径** | **本文件 §6 PRD-anti-patterns 预填**(从 AGENTS § 红线 17 R + ADMIN §10 LD-A 5 条 + R-A 6 条 派生 ≥ 30 条)+ 写脚本批量导入 reject-examples.jsonl |
| **修复时机** | PRD-1 启动前 · 跟 §6 同步完成 |
| **谁来修** | 本 PRD-MASTER 文件 §6 + 自动化脚本 · **本次会话即修完** |

### §5.2 缺口 #2 · 14 Phase 退出条件只覆盖 happy path(🔴 P0 阻塞)

| 项 | 内容 |
|---|---|
| **证据** | grep `\| \*\*退出条件\*\* \|` ARCHITECTURE.md 命中 9 行(L2813 ~ L2899)+ ADMIN §8 命中 5 行 · 全部仅 happy 描述 · 例 ARCHITECTURE:2846 "9 步全部能生成结果 · /ip-plan 显示完成度 · 切账号后数据隔离" — 没说 LLM 超时 / 网络断 / 配额耗尽 / 输入非法 / 用户中断 怎么办 |
| **影响** | 如果 PRD 直接抄退出条件做 AC · 错误路径完全空白 · ralph 写代码时不会写错误恢复 · Opus audit 4 维度也没法验"错误处理是否合规" |
| **严重度** | 🔴 P0 · 阻塞 PRD-1 启动 |
| **修复路径** | **§2 PRD 写作模板强制 4 类 AC 必含**(-H/-E/-B/-P)· prd skill 自动校验 · 未含 4 类的 PRD 不允许进 ralph |
| **修复时机** | 已通过 §2.1 模板锁定 + §2.2 字段语义详解 §C + §3.4 /plan-check 规则解决 |
| **谁来修** | 本 PRD-MASTER §2 已锁定 · **本次会话即修完** |

### §5.3 缺口 #3 · 14 工具页中 10 个无专属设计稿(🟠 P1)

| 项 | 内容 |
|---|---|
| **证据** | `ls /ui/ \| wc -l` 实测 66 子目录 · 工具页专属仅 4 个(ai_copywriting_studio_1/2 = 2 + ai_storyboard + ip_voice_chat + market_intelligence_hub)· 14 工具页中 10 个无专属(/generate / /analysis / /video-production / /acquisition-video / /boom-generate / /private-domain / /monetization / /deep-learning / /knowledge / /present-styles)|
| **影响** | PRD 写到对应 Phase(P4 创作 / P5 视频 / P6 私域 / P7 智能 / P8 知识库)时 · 设计稿引用必须明确"用什么基础稿 + 局部改造点" · 否则 Ralph 写 UI 时找不到视觉依据 |
| **严重度** | 🟠 P1 · 不阻塞 PRD-1(P0 不涉及工具页)· 阻塞 PRD-5 / 6 / 7 / 8 / 9 |
| **修复路径** | 每份相关 PRD §0 引用清单的 `UI 设计稿` 行 · 必明确"用什么基础稿(如 ai_copywriting_studio_2)+ 该工具页的局部改造点(色调/按钮/卡片如何变)"。aip_N(19 张)+ ip_N(4 张)+ _N(15 张)= 38 张探索稿可挑选基础骨架。 |
| **修复时机** | PRD-5 启动前(2 周后)· 期间可让设计师补 5-10 张快稿 |
| **谁来修** | 写 PRD-5 ~ PRD-9 时 · 由 prd skill 在 §0 强制要求 + 设计师可选补稿 |

### §5.4 缺口 #4 · step6/step8 schema 推断(🟠 P1)

| 项 | 内容 |
|---|---|
| **证据** | grep ARCHITECTURE.md L761 + L763 实测 · 标 "⚠️ schema 推断 · sally 账号实测 lastResult=null 未跑" · spec 附录 C L9162 "step6/8 sally 账号没用过" |
| **影响** | DATA-MODEL §4.4 step6/step8 result schema 是推断 · 实施时可能跟原版不一致 · 影响 LLM Judge 评分基线 |
| **严重度** | 🟠 P1 · 阻塞 PRD-6(step6 在 P5 视频)+ PRD-8(step8 在 P7 智能) |
| **修复路径** | **二选一**:<br>① **PRD-6 / PRD-8 启动前** · 用 sally 账号在 aiipznt.vip 跑通 step6 + step8 · 抓真实输出 · 写到 DATA-MODEL.md(成本:0.5-1 天人工 + 几次 LLM 调用费)<br>② **PRD-6 / PRD-8 实施时跑通顺便实测** · 把"实测真实输出"作为 PRD-6/8 的一个 US · risk_level=high · 用早期 Specialist 跑出"自家版本"作为 schema |
| **推荐** | 选 ① · 因为 sally 账号还在 · 抓快 · 风险小 |
| **修复时机** | PRD-6 启动前(8-10 周后) |
| **谁来修** | 用户(操作 sally 账号 · 跑 aiipznt.vip step6/8 · 抓 LS 数据)+ 然后我更新 DATA-MODEL §4.4 |

### §5.5 缺口 #5 · LLM Judge 100 金标准来源不明(🟠 P1)

| 项 | 内容 |
|---|---|
| **证据** | spec 附录 C L9159 "AI prompts 模板拿不到" + L9162 "step6/8 sally 没用过" · ARCHITECTURE §9.11-E.4 配置完整但**没说金标准从哪来** |
| **影响** | LLM Judge 跑回归没有"对照基线" · 改 prompt 时不知道分数下降的"真值"在哪 |
| **严重度** | 🟠 P1 · 阻塞 PRD-4(P3 主流程是核心)启动前 |
| **修复路径** | 已在 **§4.4 LLM Judge 金标准准备规范** 给出双轨方案:轨 1 sally 30 条参考 + 轨 2 自造 70 条 · 每 Specialist 平均 5-12 条 · 分阶段准备(PRD-4 前主流程 60 条 / PRD-5+6 前 20 条 / PRD-8 前 10 条 / PRD-13 前 100 条 LLM Judge CI 集成) |
| **修复时机** | PRD-4 启动前(4 周后) · 必备 60 条 |
| **谁来修** | 团队人工 · 1-2 人 · 5-7 天写 70 条 + 整理 sally 30 条 |

### §5.6 缺口 #6 · 14 PRD 内部 US 间 depends_on 不能预画(🟡 P2)

| 项 | 内容 |
|---|---|
| **证据** | 设计判断 · US 拆分粒度由 prd skill 写每份 PRD 时定 · 不能预先全画 |
| **影响** | 本 §1 全景索引只画 PRD 间 depends_on(14 PRD 级)· US 内部 depends_on 留 PRD 写作时定 |
| **严重度** | 🟡 P2 · 不阻塞 |
| **修复路径** | §4.2 depends_on 拓扑规范已明确 · 写每份 PRD 时由 prd skill 自动按"foundation 档先 → high → medium → low"排序 |
| **修复时机** | 写每份 PRD 时 |
| **谁来修** | prd skill 自动 |

### §5.7 缺口 #7 · procedure input/output zod schema 待填(🟡 P2)

| 项 | 内容 |
|---|---|
| **证据** | ARCHITECTURE §3.2 仅给 procedure 名清单 · packages/schemas/admin/ 仅占位 · 实际 zod schema 文件 0 字节 |
| **影响** | tRPC client 类型推断不完整 · 但实施时填即可 · 不阻塞规划 |
| **严重度** | 🟡 P2 · 实施期补 |
| **修复路径** | PRD-2(P1 数据底座)实施时 · 把全部 50+ procedure 的 input/output 写到 packages/schemas/ |
| **修复时机** | PRD-2 实施期(第 3-4 周) |
| **谁来修** | Ralph Agent 写代码时 |

### §5.8 缺口 #8 · 6 闸鉴权链 middleware 骨架(🟡 P2)

| 项 | 内容 |
|---|---|
| **证据** | ADMIN §5.3 给链顺序(adminAuth → roleCheck → ipWhitelist → mfaCheck → adminRLS → approvalGateCheck)· 但具体代码留 P9.0 实施 |
| **影响** | admin 子系统启动前的工程改造 · 不阻塞主应用 |
| **严重度** | 🟡 P2 · admin 阶段补 |
| **修复路径** | PRD-10(P9.0 admin 基础)实施时 · 写 6 个 middleware 文件到 apps/api/src/trpc/middleware/admin/ |
| **修复时机** | PRD-10 实施期(主应用 P8 后启动) |
| **谁来修** | Ralph Agent(admin daemon) |

### §5.9 缺口 #9 · step9 复盘已规划未实现(🟢 P3)

| 项 | 内容 |
|---|---|
| **证据** | ARCHITECTURE.md L383 "⚠️ step9 复盘 · 路由代码已注册但 UI 未上线 · 本架构按"已规划但未实现"处理" |
| **影响** | 1.0 不做 · 留 1.0 之后 |
| **严重度** | 🟢 P3 · 不动 |
| **修复路径** | 留到 1.x 版本 · 不在本 14 PRD 范围 |
| **修复时机** | 后续版本 |
| **谁来修** | (后续) |

### §5.10 缺口 #10 · 多处"可选"字段(🟢 P3)

| 项 | 内容 |
|---|---|
| **证据** | grep `可选` ARCHITECTURE.md 命中 13 处 · 包括 user_history_vec / 语音录音 / pgvector L3 / step9 复盘 / EvolutionProfile 跨账号克隆 等 |
| **影响** | 都是"如需要再做"的扩展点 · 不阻塞 MVP |
| **严重度** | 🟢 P3 · 不动 |
| **修复路径** | 自然演进 · 后续 PRD 滚动评估 |
| **修复时机** | 跟随业务发展 |
| **谁来修** | (滚动) |

### §5.11 缺口修复时序

```
PRD-1 启动前(本周)·
  ✅ §5.1 反例库预填(本文件 §6 完成 + 脚本导入)
  ✅ §5.2 4 类 AC 强制(本文件 §2 完成)
  
PRD-4 启动前(4 周后)·
  📌 §5.5 LLM Judge 100 金标准 60 条(主流程 Specialist 必备)
  
PRD-5 启动前(7 周后)·
  📌 §5.3 10 个工具页设计稿确认(基础稿 + 改造点)
  
PRD-6 启动前(9 周后)·
  📌 §5.4 step6 sally 实测(可选)
  📌 §5.5 LLM Judge 创作 + 视频 20 条
  
PRD-8 启动前(11 周后)·
  📌 §5.4 step8 sally 实测(可选)
  📌 §5.5 LLM Judge L5 自治 10 条
  
PRD-13 启动前(主应用上线 + 5 周后)·
  📌 §5.5 LLM Judge 100 全部 + CI 集成
  
实施期(滚动)·
  §5.6 / §5.7 / §5.8 · 跟随各 PRD 实施时填
  
不动 ·
  §5.9 step9 复盘 · 1.0 之后
  §5.10 多处"可选" · 自然演进
```

### §5.12 PRD 失败回滚协议(★ 2026-05-07 v0.2 新增 · 修复 review P1-5)

> review 发现 v0.1 完全没说"PRD-N 跑一半失败怎么办" · 实施期出问题时无标准动作。本节补完整回滚协议。

#### A · 失败的 4 个层级

| 级别 | 例子 | 影响 | 处理方式 |
|:-:|---|---|---|
| **L1 · 单 story 失败** | US-005 跑了 3 次都被 Opus reject | 单 story 卡住 | 走 §5.12-B 单 story 回滚 |
| **L2 · 单 PRD 失败** | PRD-4 中多个 story 反复 reject(≥ 5 个 story 累计 ≥ 15 次 reject)· 或者 24h 无进展 | 整份 PRD 卡住 | 走 §5.12-C PRD 重做 |
| **L3 · 上游 PRD 出 bug 暴露** | 跑 PRD-5 时发现 PRD-2 数据底座有 bug(多账号隔离漏字段) | PRD-5 不能继续 + PRD-2 之前的"过 audit"是错的 | 走 §5.12-D 上游补丁 |
| **L4 · 架构性失误** | 跑 PRD-6 时发现 ARCHITECTURE §6.5 LLMGateway 设计根本跑不通(实测后才发现) | 多 PRD 受影响 + ARCHITECTURE 必须改 | 走 §6 ARCHITECTURE 改动流程 |

#### B · L1 单 story 失败 · 标准回滚动作

```
触发条件 · 同一 story 累计 reject ≥ 3 次

操作步骤 ·
  1. ralph.py 自动停止该 story 重试(MAX_RETRIES=5 · 触底直接 abort · 不影响其他 story)
  2. ralph.py 写 ralph-tools.py block <story_id>(标 status=blocked)
  3. 用户/Opus 人工介入 · 选 1 ·
     a) 改 PRD US 描述(细化 / 拆 1→2 个 story)→ ralph-tools.py reset → 重跑
     b) 改 ARCHITECTURE 引用章节(走 §6 ARCHITECTURE 改动流程)→ 改 PRD §0 引用 → 重跑
     c) 标 story 为"deferred"(留到下次 PRD 处理)→ ralph 跳过该 story 继续跑其他
  4. 写 reject 反例到 reject-examples.jsonl(由 ralph-tools.py reject 自动)
  
不允许 · 直接改代码绕过 audit
```

#### C · L2 单 PRD 失败 · PRD 重做

```
触发条件(任一) ·
  · ≥ 5 个 story 累计 ≥ 15 次 reject
  · 24h 无进展(Ralph 静默 / Opus 无 approval / Validator 无验证通过)
  · 多 story 互相阻塞(depends_on 死锁)

操作步骤 ·
  1. /goal-verify 对当前 PRD 跑 · 看哪些 story 已 approved(保留)/ 哪些卡住(重做)
  2. 备份当前 prd.json + audit-gate.json + ralph-lock.json + 已生成代码 commit 历史
  3. 决策 ·
     a) 重写 PRD 文件 · 改 US 拆分 + risk_level + AC 粒度 → 重跑
     b) 拆当前 PRD 为 PRD-Na + PRD-Nb 两份(已 approved 的留 PRD-Na · 卡住的进 PRD-Nb · 后续做)
     c) 整体延期 · 把 PRD 拆到下一版本
  4. 不允许 · 删 git history / 强制回滚到上一 PRD 状态(有审计追溯需求 · 删 history 会失合规)
```

#### D · L3 上游 PRD 出 bug · 上游补丁

```
触发条件 · 跑 PRD-N 时发现 PRD-N-X(X >= 1)留下的代码 / schema 有 bug

操作步骤 ·
  1. 标记 PRD-N 暂停(audit-gate.json status=blocked_upstream)
  2. 创建上游 PRD-补丁(命名 prd-N-X-hotfix.json) · 含修复 US + AC
  3. 切到补丁 PRD · ralph.py 跑(走完整 audit 流程)
  4. 补丁过 /goal-verify · 写到 reject-examples.jsonl(防止再犯)
  5. 切回 PRD-N · 继续跑

绝对不能跳过的步骤 · 上游补丁 PRD 必须有自己的 audit · 不能"顺手改一行"绕过审计 · 否则 audit_log 不完整 · 法务取证失效
```

#### E · 状态恢复 + 数据保护

| 场景 | 保护策略 |
|---|---|
| ralph daemon 进程被 kill | ralph.py 启动时自动恢复(读 ralph-lock.json + audit-gate.json · 续跑) |
| audit-gate.json 损坏 | switch-prd.sh rm -f 清掉 · ralph 启动时自动重建 |
| prd.json 改坏(JSON 语法错)| 从 prd-N.start.json 恢复(switch-prd.sh 已备份 step 6) |
| 误删 reject-examples.jsonl | seed-reject-examples.sh 重跑(35 条基础反例不丢)+ /prd-retro 历史可补 |
| git history 误删 commit | 重跑 ralph 不行 · 必须从 reflog 恢复 · 写 audit_log incident 记录 |

#### F · §5.12 小结

本节答 4 件事:
1. 失败有 4 级 · L1 story · L2 PRD · L3 上游 · L4 架构(L4 走 §6)
2. 每级有标准回滚动作 · 防止"顺手改一行绕过 audit"
3. 状态文件全部可恢复(ralph-lock / audit-gate / prd.json / reject-examples / git history)
4. **不允许的事** · 删 git history / 跳 audit / 强制覆盖上游 · 这些破坏审计追溯

### §5.13 PRD 过期重写策略(★ 2026-05-07 v0.2 加 P2-10)

> review 发现 v0.1 没说 PRD 写完到实施可能漂移 · 此节给"什么时候必须 refresh PRD"标准。

#### A · PRD 过期的 3 类触发

| 触发 | 例子 | 应对 |
|---|---|---|
| **a · 上游 PRD 改了** | PRD-1 已 🟢 · 跑 PRD-2 时改了 ARCHITECTURE.md §3 数据架构 · PRD-1 引用陈旧 | 不重做 PRD-1(它已 🟢 · 不能回退)· 但 PRD-2 启动前 prd skill 必读最新 ARCHITECTURE 派生 |
| **b · 写完到实施间隔 > 2 周** | PRD-5 写于 Week 7 · 实际跑到 Week 10(隔 3 周)· 期间反例库 +20 条 / 上游有 Specialist 实测改了行为 | 启动前重跑 prd skill refresh 一次(grep reject-examples · 重新检索)· 不重写整份 PRD |
| **c · 同一 PRD 被实际项目情况改了 ≥ 3 个 US** | 跑 PRD-4 时 · 因 ARCHITECTURE 改动(§3.10 b/c 类)· 改了 3 个 US 的 AC | PRD 版本 v1.0 → v1.1 · 不算重写 · 改 status_history · 通知 Opus 重审受影响 story |

#### B · refresh 不算重写

```
prd skill refresh 流程 ·
  1. 读最新 ARCHITECTURE / DATA-MODEL / AGENTS · 跟 PRD §0 引用清单对账
  2. grep 最新 reject-examples.jsonl · 重新注入 anti_patterns(可能多 0-5 条新反例)
  3. AC 类检查 · 看每个 US 是否仍 4 类齐全(若 ARCHITECTURE 改了 · 可能要补错误 AC)
  4. 输出 patch · 用户人工 review patch 是否合理 · 接受或拒绝
  5. 不动 PRD US 数 / risk_level / depends_on(这些是 PRD 骨架 · 改了等于重写)
  
预估时间 · 5-15 分钟 · 不影响关键路径
```

#### C · 何时必须重写而非 refresh

| 触发 | 处理 |
|---|---|
| ARCHITECTURE §3.10 d 类(架构性失误) | PRD 全部受影响章节都重写 · 走完整 ADR 流程 |
| 同一 PRD ≥ 5 个 US 要改 | 重写 · 标新版 v2.0 · 老版备份 |
| `risk_level` 整体调整(low → high) | 重写 · 因为 risk 影响 audit 强度 + ralph 调度顺序 |
| `depends_on` 关系大改 | 重写 · 因为影响 PRD 间拓扑 |

#### D · 14 PRD 全周期 refresh / 重写预估

| 类型 | 数量 | 时间成本 |
|---|:-:|:-:|
| 启动前 refresh(每份 PRD)| 14 次 | 14 × 10 分钟 = 2.5 小时 |
| 实施期 a 类 PRD 改动(§5.12 路径)| 预估 3-5 次 | 3 × 15 分钟 = 1 小时 |
| 实施期 b/c 类 ARCHITECTURE 改动 → PRD 重写 | 预估 2-3 次 | 3 × 1 小时 = 3 小时 |
| 全 14 PRD 最坏情况 | 总治理时间 | ~7 小时(分散在 25 周) |

> 治理时间分散到 25 周 · 平均每周 ~17 分钟 · 不影响关键路径执行节奏。

---

## §6 PRD-anti-patterns 预填(★ 修复 §5.1 缺口)

> 本章是 ARCHITECTURE-driven PRD 模式启动前的**最关键准备工作** — reject-examples.jsonl 当前 0 字节 · 必须**手动预填首批反例** · 让 prd skill 在 PRD-1 启动时有可注入的内容。
>
> **预填来源** · 从 [`AGENTS.md`](AGENTS.md) §3-§5(主应用 18 LD + 17 R)+ §10(admin 5 LD-A + 6 R-A)+ ARCHITECTURE.md 风险章节 派生 · 总 35+ 条 QuanAn 通用反例。

### §6.1 反例分类(6 大领域 · 35+ 条)

| 领域 | 反例数 | 来源 | 关键词(prd skill grep 用)|
|---|:-:|---|---|
| A · Specialist + LLM Gateway | 7 | AGENTS §3 LD-001/012 · ARCHITECTURE §6.5 | Specialist · LLM · Gateway · execute · model_tier |
| B · 数据隔离 + RLS | 6 | AGENTS §3 LD-009 · DATA-MODEL §9 · ADR-010 | account_id · RLS · 隔离 · 跨账号 · WHERE |
| C · 进化飞轮 + 记忆系统 | 5 | AGENTS §3 LD-006/008 · ARCHITECTURE §5 | EvolutionAgent · feedback · trace_id · 五层记忆 · ContextAssembler |
| D · admin 子系统 | 8 | AGENTS §10 LD-A · R-A · ADR-021 | admin · adminRouter · ipWhitelist · MFA · audit_log · Approval |
| E · 内容审核 | 5 | AGENTS §10 LD-A5 · ADR-017 | TrendingScraper · FileParser · review_queue · 入向量库 · PII |
| F · 类型 + 错误恢复 | 4 | AGENTS §3 LD-013/014 · §5 R-X | zod · trace_id · any · fallback · timeout |
| **合计** | **35** | | |

### §6.2 完整反例 35 条(JSON Lines · 直接可写入 reject-examples.jsonl)

#### A · Specialist + LLM Gateway(7 条)

```json
{"id":"REJ-001","source_prd":"QuanAn-base","domain":"Specialist","keywords":["Specialist","LLM","Gateway","execute"],"anti_pattern":"❌ Specialist execute() 内直接调 anthropic.messages.create / openai.chat.completions","fix_pattern":"✅ 必须通过 LLMGateway.complete() · 由 Gateway 统一限流/降级/计费/审计","evidence":"AGENTS §3 LD-012 + ARCHITECTURE §6.5 + 11/05 LLM 网关","rejected_at":"2026-05-07"}
{"id":"REJ-002","source_prd":"QuanAn-base","domain":"Specialist","keywords":["Specialist","execute","循环","while"],"anti_pattern":"❌ Specialist execute() 内 while/for 循环调 LLM(伪 Agent 行为)","fix_pattern":"✅ Specialist 是 95% Workflow · 单次 LLM 调用 + 单次 zod 校验 + 单次返回 · 多轮 Agent 必须独立成 L5(VoiceChat/Evolution/DailyTask)","evidence":"AGENTS §3 LD-001 + ARCHITECTURE §4.1 + reference/PI/03","rejected_at":"2026-05-07"}
{"id":"REJ-003","source_prd":"QuanAn-base","domain":"Specialist","keywords":["model","claude","gpt"],"anti_pattern":"❌ 应用代码硬编码 model 名(如 'claude-sonnet-4-6' / 'gpt-4o')","fix_pattern":"✅ 用 model_tier: 'reasoning' | 'lightweight' · 由 LLMGateway 决定具体 model · 降级策略集中处理","evidence":"AGENTS §2.4 + ARCHITECTURE §6.5","rejected_at":"2026-05-07"}
{"id":"REJ-004","source_prd":"QuanAn-base","domain":"Specialist","keywords":["Specialist","invoke","call","直接"],"anti_pattern":"❌ tRPC procedure 内直接 new Specialist().execute()","fix_pattern":"✅ 通过 BaseSpecialist.run() 模板方法(自动跑 ContextAssembler.assemble + writeAuditLog)","evidence":"AGENTS §3 LD-005 + ARCHITECTURE §6.3","rejected_at":"2026-05-07"}
{"id":"REJ-005","source_prd":"QuanAn-base","domain":"Specialist","keywords":["systemPrompt","prompt","manual"],"anti_pattern":"❌ Specialist 自己拼 systemPrompt(读 stepData / EvolutionProfile / 常量)","fix_pattern":"✅ 必须通过 ContextAssembler.assemble() · ContextAssembler 是 prompt 注入唯一入口","evidence":"AGENTS §3 LD-007 + ADR-007 + ARCHITECTURE §4.6","rejected_at":"2026-05-07"}
{"id":"REJ-006","source_prd":"QuanAn-base","domain":"Specialist","keywords":["Specialist","timeout"],"anti_pattern":"❌ Specialist 不设 timeout · 让 LLM 卡死任意时间","fix_pattern":"✅ LLMGateway 内置 timeout(reasoning 60s / lightweight 30s)· 失败重试 1 次 + 降级 · 仍失败返回 fallback 模板","evidence":"ARCHITECTURE §6.5 + §6.8","rejected_at":"2026-05-07"}
{"id":"REJ-007","source_prd":"QuanAn-base","domain":"Specialist","keywords":["Specialist","output","mode"],"anti_pattern":"❌ 同一 Specialist 多 mode 共用一个输出 zod schema(如 CopywritingAgent step7+free+boom 共用)","fix_pattern":"✅ 每个 mode 一个 zod schema · CopywritingAgent.run({mode:'step7'}) 跑 stepResultSchema.step7 / mode='boom' 跑 boomResultSchema","evidence":"PROMPTS.md 14 模板规范 + AGENTS §3 LD-013","rejected_at":"2026-05-07"}
```

#### B · 数据隔离 + RLS(6 条)

```json
{"id":"REJ-008","source_prd":"QuanAn-base","domain":"data-isolation","keywords":["account_id","WHERE","prisma","隔离"],"anti_pattern":"❌ prisma.histories.findMany() 不带 account_id WHERE","fix_pattern":"✅ 必带 where: { accountId: ctx.activeAccountId } · 即使 RLS 兜底 · ORM 层也必显式带","evidence":"AGENTS §3 LD-009 + DATA-MODEL §9 + ARCHITECTURE §3.8 3 道闸","rejected_at":"2026-05-07"}
{"id":"REJ-009","source_prd":"QuanAn-base","domain":"data-isolation","keywords":["RLS","DISABLE","raw","executeRaw"],"anti_pattern":"❌ 业务代码用 prisma.$executeRawUnsafe / $queryRawUnsafe 绕过 RLS","fix_pattern":"✅ 业务代码必须走 prisma 类型安全 API · raw SQL 仅 admin migration 文件允许","evidence":"AGENTS §10.2 R-A6 + DATA-MODEL §9","rejected_at":"2026-05-07"}
{"id":"REJ-010","source_prd":"QuanAn-base","domain":"data-isolation","keywords":["LS","localStorage","aiip_memory_acc"],"anti_pattern":"❌ localStorage key 不带 acc_{id} 前缀(如直接写 'step3_account_v3')","fix_pattern":"✅ 必带 'aiip_memory_acc_{accountId}_{stepKey}' 命名空间 · 切账号时不污染","evidence":"ARCHITECTURE §3.3 18 LS keys + ADR-011","rejected_at":"2026-05-07"}
{"id":"REJ-011","source_prd":"QuanAn-base","domain":"data-isolation","keywords":["Redis","cache","key"],"anti_pattern":"❌ Redis key 不带 acc_{id} 前缀(如 'evolution:profile:123')","fix_pattern":"✅ 必带 acc_{id} · 'evolution:profile:acc_{accountId}' · 防止跨账号缓存污染","evidence":"ARCHITECTURE §3.8 闸 3 命名空间","rejected_at":"2026-05-07"}
{"id":"REJ-012","source_prd":"QuanAn-base","domain":"data-isolation","keywords":["pgvector","namespace","embedding"],"anti_pattern":"❌ pgvector 查询不带 namespace = 'account_{id}'","fix_pattern":"✅ user_samples_vec / user_history_vec 必带 namespace · 防止用户 A 的样本被 B 的 prompt 检索到","evidence":"ARCHITECTURE §3.6 B 向量库 namespace 策略","rejected_at":"2026-05-07"}
{"id":"REJ-013","source_prd":"QuanAn-base","domain":"data-isolation","keywords":["activeAccountId","middleware","switchActive"],"anti_pattern":"❌ tRPC procedure 不经 accountIsolation middleware · 直接信任 input.accountId","fix_pattern":"✅ 必经 accountIsolation middleware(参 DATA-MODEL §9.5)· assert(user owns activeAccountId)+ 设 RLS context","evidence":"AGENTS §3 LD-009 闸 1 + DATA-MODEL §9.5","rejected_at":"2026-05-07"}
```

#### C · 进化飞轮 + 记忆系统(5 条)

```json
{"id":"REJ-014","source_prd":"QuanAn-base","domain":"evolution","keywords":["EvolutionAgent","feedback","trigger"],"anti_pattern":"❌ EvolutionAgent 在主调用栈同步跑批(阻塞用户)","fix_pattern":"✅ 必须异步队列(bullmq)· 用户点 👍/👎 后写 feedback_log 立即返回 · EvolutionAgent 后台跑批","evidence":"AGENTS §3 LD-008 + ADR-018 外部 orchestrator + ARCHITECTURE §5.5","rejected_at":"2026-05-07"}
{"id":"REJ-015","source_prd":"QuanAn-base","domain":"evolution","keywords":["EvolutionInsight","write","atomic"],"anti_pattern":"❌ EvolutionAgent 升级 level 跟写 insight 不在同一 transaction","fix_pattern":"✅ 必须原子事务 · 任一失败全部回滚 · 防止'已升级 L2 但 insight 为空'","evidence":"ARCHITECTURE §6.8 错误处理 · DATA-MODEL §6.5 飞轮 SQL 链路","rejected_at":"2026-05-07"}
{"id":"REJ-016","source_prd":"QuanAn-base","domain":"evolution","keywords":["EvolutionProfile","userId","accountId"],"anti_pattern":"❌ EvolutionProfile 用 userId 关联(应该是 accountId)","fix_pattern":"✅ 进化档案是「账号级」非「用户级」· 同一用户的企业号 vs 个人号有不同进化方向","evidence":"AGENTS §3 LD-008 + ADR-009 + ARCHITECTURE §5.6","rejected_at":"2026-05-07"}
{"id":"REJ-017","source_prd":"QuanAn-base","domain":"evolution","keywords":["trace_id","history","feedback"],"anti_pattern":"❌ history.create / feedback_log.create 不带 trace_id","fix_pattern":"✅ 全栈 trace_id 贯穿 · history.trace_id / feedback_log.trace_id / audit_log.trace_id 都同一个","evidence":"AGENTS §3 LD-013 + ARCHITECTURE §6.9","rejected_at":"2026-05-07"}
{"id":"REJ-018","source_prd":"QuanAn-base","domain":"evolution","keywords":["L1","Buffer","Redis","TTL"],"anti_pattern":"❌ VoiceChat L1 Buffer 不设 TTL · 用户长时间不挂断造成 Redis 内存爆","fix_pattern":"✅ L1 Buffer key 必设 TTL 30min(参 ARCHITECTURE §5.2)· 5 分钟无声自动结束","evidence":"ARCHITECTURE §4.4-A + §5.2 L1","rejected_at":"2026-05-07"}
```

#### D · admin 子系统(8 条)

```json
{"id":"REJ-019","source_prd":"QuanAn-base","domain":"admin","keywords":["adminRouter","appRouter","import"],"anti_pattern":"❌ adminRouter 内 import 调 appRouter 的 procedure(反之亦然)","fix_pattern":"✅ adminRouter 跟 appRouter 严格分离(对应 LD-A2)· 共享数据通过 adminPrisma 直接查 · 不调彼此 procedure","evidence":"AGENTS §10.1 LD-A2 + ADMIN §5.4","rejected_at":"2026-05-07"}
{"id":"REJ-020","source_prd":"QuanAn-base","domain":"admin","keywords":["admin","procedure","adminRLS"],"anti_pattern":"❌ admin procedure 链路里漏 adminRLS middleware","fix_pattern":"✅ 6 闸鉴权链每条都不能漏 · adminAuth → roleCheck → ipWhitelist → mfaCheck → adminRLS → approvalGateCheck","evidence":"AGENTS §10.1 LD-A2 + ADMIN §5.3","rejected_at":"2026-05-07"}
{"id":"REJ-021","source_prd":"QuanAn-base","domain":"admin","keywords":["cross_account_query","admin_audit_log"],"anti_pattern":"❌ admin 跨账号查不写 cross_account_query 事件","fix_pattern":"✅ 由 adminRLS middleware 自动写 admin_audit_log eventType='cross_account_query' · 法务取证生命线","evidence":"AGENTS §10.1 LD-A3 + ADMIN §4.1","rejected_at":"2026-05-07"}
{"id":"REJ-022","source_prd":"QuanAn-base","domain":"admin","keywords":["admin","page","主应用"],"anti_pattern":"❌ 主应用 src/pages/ 加 admin 子目录","fix_pattern":"✅ admin 在 apps/admin/src/pages/ · 主应用前端不暴露任何 admin 入口(对应 R-A2)","evidence":"AGENTS §10.2 R-A1 + R-A2 + ARCHITECTURE §1.4b D","rejected_at":"2026-05-07"}
{"id":"REJ-023","source_prd":"QuanAn-base","domain":"admin","keywords":["high-risk","Approval","封禁"],"anti_pattern":"❌ admin 高风险操作(封禁 / 改套餐 / Prompt 发布)硬编码 meta.requiresApproval=false","fix_pattern":"✅ 14 类高风险动作必带 requiresApproval=true · 走 Approval Gates(对应 LD-A4)","evidence":"AGENTS §10.1 LD-A4 + §10.3 + ADR-020","rejected_at":"2026-05-07"}
{"id":"REJ-024","source_prd":"QuanAn-base","domain":"admin","keywords":["MFA","super_admin"],"anti_pattern":"❌ super_admin 不强制 MFA(允许仅 OAuth 通过即登录)","fix_pattern":"✅ super_admin 强制 TOTP/WebAuthn(决策 4=B)· 30 天强制 reverify · 失败 3 次锁账号","evidence":"ADMIN §7.3 + ADR-021","rejected_at":"2026-05-07"}
{"id":"REJ-025","source_prd":"QuanAn-base","domain":"admin","keywords":["IP","白名单","WAF"],"anti_pattern":"❌ admin SPA 不配 WAF IP 白名单 直接公网访问","fix_pattern":"✅ admin.quanan.com 必经 Cloudflare/Vercel WAF IP 白名单(office + VPN)· 部署前 CI 必检(对应 R-A3)","evidence":"AGENTS §10.2 R-A3 + ADMIN §7.2","rejected_at":"2026-05-07"}
{"id":"REJ-026","source_prd":"QuanAn-base","domain":"admin","keywords":["app:session","admin:session","Redis"],"anti_pattern":"❌ admin session 用主应用 Redis namespace(app:session:*)","fix_pattern":"✅ admin 独立 namespace(admin:session:*)· session ttl 12h(短于主应用 30 天)· idle timeout 30min","evidence":"AGENTS §10.1 LD-A1 + ADMIN §7.1","rejected_at":"2026-05-07"}
```

#### E · 内容审核(5 条)

```json
{"id":"REJ-027","source_prd":"QuanAn-base","domain":"content-review","keywords":["TrendingScraper","trendingItem","create"],"anti_pattern":"❌ TrendingScraper Worker 直接 prisma.trendingItem.create({...})","fix_pattern":"✅ 必须先进 trending_review_queue(status='pending')· 通过 admin 审核后才入主表 + embed 入向量库(对应 LD-A5)","evidence":"AGENTS §10.1 LD-A5 + ADMIN §3.4 域 ⑦","rejected_at":"2026-05-07"}
{"id":"REJ-028","source_prd":"QuanAn-base","domain":"content-review","keywords":["FileParser","deepLearningArchive","upload"],"anti_pattern":"❌ FileParser Worker 直接写 deep_learning_archives + 入 vector store","fix_pattern":"✅ 必须先进 deep_learn_review_queue · 自动 PII 扫描 + 违禁词扫描 + 抽样人审 · 通过才入向量库","evidence":"AGENTS §10.1 LD-A5 + ADMIN §3.4 域 ⑧","rejected_at":"2026-05-07"}
{"id":"REJ-029","source_prd":"QuanAn-base","domain":"content-review","keywords":["PII","email","phone","身份证"],"anti_pattern":"❌ 用户上传内容不扫 PII 直接进 prompt","fix_pattern":"✅ 必跑 PII 扫描(邮箱/手机/身份证/银行卡正则)· 命中阻断 + 用户提示 · 不允许 PII 进 LLM Gateway","evidence":"AGENTS §1.4 + §9.11-D + ADMIN §3.4 域 ⑧","rejected_at":"2026-05-07"}
{"id":"REJ-030","source_prd":"QuanAn-base","domain":"content-review","keywords":["robots.txt","scraper","crawl"],"anti_pattern":"❌ TrendingScraper 用爬虫直接抓 5 平台(违反 robots.txt + 平台风控)","fix_pattern":"✅ 走第三方授权(新榜/蝉妈妈/飞瓜)· 月费换 0 法律风险 · 长期申请官方 API · 严禁自建爬虫","evidence":"ADR-017 trending 合规 + ARCHITECTURE §9.13b","rejected_at":"2026-05-07"}
{"id":"REJ-031","source_prd":"QuanAn-base","domain":"content-review","keywords":["disclaimer","医疗","法律","金融"],"anti_pattern":"❌ 医疗/法律/金融行业输出不加免责声明","fix_pattern":"✅ 必自动加免责 · 命中行业关键词 → 输出末尾追加'本内容仅供参考 · 不构成 X 建议' · 写 audit_log eventCategory='compliance'","evidence":"AGENTS §9.11-D + ARCHITECTURE §9.11-D","rejected_at":"2026-05-07"}
```

#### F · 类型 + 错误恢复(4 条)

```json
{"id":"REJ-032","source_prd":"QuanAn-base","domain":"type-safety","keywords":["any","zod","schema"],"anti_pattern":"❌ Specialist 输出用 any 兜底(如 result: any)","fix_pattern":"✅ 必过 zod schema 校验 · 失败重试 1 次 · 仍失败标 is_fallback=true 返回简版 · 不允许 any","evidence":"AGENTS §3 LD-013 + ARCHITECTURE §6.8","rejected_at":"2026-05-07"}
{"id":"REJ-033","source_prd":"QuanAn-base","domain":"type-safety","keywords":["zod","safeParse","throw"],"anti_pattern":"❌ zod 校验失败 throw Error 不重试","fix_pattern":"✅ 失败重试 1 次 · 仍失败走降级路径(fallback 模板)· 不阻断用户主流程","evidence":"ARCHITECTURE §6.8 错误处理与降级契约","rejected_at":"2026-05-07"}
{"id":"REJ-034","source_prd":"QuanAn-base","domain":"type-safety","keywords":["concurrent","version","optimistic"],"anti_pattern":"❌ stepData.save 没乐观锁 · 多 tab 同时改 step3 后写覆盖前写","fix_pattern":"✅ 加 version 字段 · 第二次 save 报错 → toast '已被另一处修改 · 请刷新' · 用户决定","evidence":"ARCHITECTURE §6.8 stepData 并发冲突 ★","rejected_at":"2026-05-07"}
{"id":"REJ-035","source_prd":"QuanAn-base","domain":"type-safety","keywords":["LS","fail","rollback"],"anti_pattern":"❌ stepData.save mutation 失败不回滚 LS · LS 有数据但 DB 没","fix_pattern":"✅ 客户端 hook 必带 onError 回滚 LS · toast '同步失败' · 30s 后自动重试","evidence":"ARCHITECTURE §3.4 规则 1 + §6.8","rejected_at":"2026-05-07"}
```

### §6.3 写入 reject-examples.jsonl 的脚本

> 本节给一个简单脚本 · 把上面 §6.2 的 35 条 JSON 直接写入 `~/.claude/playbooks/reject-examples.jsonl`。

```bash
#!/bin/bash
# scripts/seed-reject-examples.sh
# 用途 · 把 PRD-MASTER.md §6.2 的 35 条 QuanAn 通用反例预填到 reject-examples.jsonl

set -e
TARGET=~/.claude/playbooks/reject-examples.jsonl
SOURCE=$(dirname "$0")/../PRD-MASTER.md

# 备份现有文件(如有)
if [ -s "$TARGET" ]; then
  cp "$TARGET" "${TARGET}.bak.$(date +%Y%m%d_%H%M%S)"
  echo "已备份原 reject-examples.jsonl"
fi

# 提取 PRD-MASTER.md §6.2 的 JSON 行(以 { 开头 } 结尾的行)
# 简化方案 · 直接 grep 匹配 REJ-XXX
grep -E '^\{"id":"REJ-' "$SOURCE" >> "$TARGET"

# 验证
COUNT=$(wc -l < "$TARGET")
echo "✅ 已写入 reject-examples.jsonl · 当前 ${COUNT} 条"

# 跑健康检查
if [ "$COUNT" -lt 35 ]; then
  echo "❌ 异常 · 应有 ≥ 35 条 · 实际 ${COUNT}"
  exit 1
fi

echo "✅ §6.1 anti_patterns 预填完成 · prd skill 现在可正常注入"
```

**使用方法**:
```bash
mkdir -p /Users/return/Desktop/QuanAn/scripts
# 把上面脚本保存到 scripts/seed-reject-examples.sh
chmod +x scripts/seed-reject-examples.sh
bash scripts/seed-reject-examples.sh

# 或者直接 ·
grep -E '^\{"id":"REJ-' /Users/return/Desktop/QuanAn/PRD-MASTER.md \
  >> ~/.claude/playbooks/reject-examples.jsonl
wc -l ~/.claude/playbooks/reject-examples.jsonl
# 应输出 35
```

### §6.4 反例库使用流程(prd skill 自动)

```
prd skill 转 prd.json 时 ·
  ① 解析 PRD §1 每个 US 的 i_want 字段提取关键词
  ② 跑 grep 关键词 in reject-examples.jsonl
  ③ 取相关度最高的 ≤ 3 条 · 注入到 story.anti_patterns
  ④ Ralph Agent 写代码时 · 看 anti_patterns · 显式避开

效果 ·
  · PRD-1 启动时 · 35 条反例可用
  · 跑完 PRD-1 + reject 几次后 · 反例库 +5 条 = 40 条
  · 跑完 14 PRD 后 · 反例库 100+ 条 · 跨项目可共享
```

### §6.5 §6 小结

本节答 4 件事:
1. **6 大领域 35 条反例预填** · A Specialist + B 数据隔离 + C 进化飞轮 + D admin + E 内容审核 + F 类型错误恢复
2. **每条反例 7 字段标准格式** · id / source_prd / domain / keywords / anti_pattern / fix_pattern / evidence
3. **写入脚本一键导入** · `bash scripts/seed-reject-examples.sh` 即可填到 ~/.claude/playbooks/reject-examples.jsonl
4. **prd skill 自动消费** · 关键词 grep → 注入 ≤ 3 条 → Ralph 看到历史教训

→ **修复 §0 维度 6 + §5.1 缺口 #1** ✅

---

## §7 14 PRD 启动顺序 + 并行机会 + 双 daemon 协同

> §1.3 已画了 depends_on 总图 · 本章把它转成"25 周时间轴 + 单 daemon 串行节奏 + 关键路径"(2026-05-07 v0.2 改 24w → 25w · 详 §3.5)。

### §7.1 25 周时间轴(主应用 16w + admin 9w · 严格串行 · 选方案 A)

```
Week 1-2  · PRD-1 (P0 基础) ─────────────────────────────────────────────────┐
                                                                              │
Week 3-4  · PRD-2 (P1 数据底座) ★ depends PRD-1 ─────────────────────────────┤
                                                                              │
Week 5    · PRD-3 (P2 路由) ★ depends PRD-1+2 ──────────────────────────────┤
                                                                              │
Week 6-8  · PRD-4 (P3 主流程 9 步 ★ high) ★ depends PRD-2+3 ─────────────────┤
                                                                              │
Week 9-10 · PRD-5 (P4 创作) ★ depends PRD-4 ───────────────────────────────┤
                                                                              │
Week 11-12· PRD-6 (P5 视频) ★ depends PRD-4+5 ──────────────────────────────┤
                                                                              │
Week 13   · PRD-7 (P6 私域+变现) ★ depends PRD-4 ─────────────────────────────┤
                                                                              │
Week 14-15· PRD-8 (P7 智能 ★ 3 L5) ★ depends PRD-4 ─────────────────────────┤
                                                                              │
Week 16   · PRD-9 (P8 知识库) ★ depends PRD-4 · 主应用上线 ────────────────┤
                                                                              │
   ───────────────────  主应用上线后才启动 admin(方案 A · 串行)  ─────────  │
                                                                              │
Week 17   · PRD-10 (P9.0 admin 基础) ★ ★ 主 P8 完成后启动 ─────────────────┤
                                                                              │
Week 18-20· PRD-11 (P9.1 6 P0 业务核心) ★ depends PRD-2+4+10 ─────────────────┤
                                                                              │
Week 21-22· PRD-12 (P9.2 内容审核) ★ depends PRD-6+8+10 ──────────────────────┤
                                                                              │
Week 23-24· PRD-13 (P9.3 5 P1 健康度) ★ depends PRD-10+11 ────────────────────┤
                                                                              │
Week 25   · PRD-14 (P9.4 3 P2 高级 · 可后续)★ depends PRD-13 ─────────────────┘

总周期 · 25 周(主线 16 + admin 9 · 严格串行)
方案 A 选择代价 · 多 1 周 · 但 ralph 工具链不动 · 工程简单 · 可立即开工

MVP 路径(P0+P1+P2+P3 5 步+P8 精简)· 5 周可上线(参 ARCHITECTURE §9.14)
admin MVP 路径(P9.0 + P9.1 6 P0 域)· 主应用上线 + 4 周
```

### §7.2 关键路径(任一延期影响全部下游)

```
PRD-1 → PRD-2 → PRD-4 → PRD-5/6/8(任一)→ PRD-12
   ★      ★      ★         ★               ★
foundation foundation high      high          high

  PRD-1 + PRD-2 是 foundation · 任一延期 1 周 · 总周期 +1 周
  PRD-4 是核心战场 · 延期 1 周 · 后续 5 PRD 全部顺延
  PRD-5/6/8 任一延期 · 影响 admin PRD-12 内容审核启动
  PRD-12 是 admin 法律生命线 · 延期 = trending 抓回内容直接进 RAG 风险
```

### §7.3 并行机会(★ 2026-05-07 v0.2 修订 · 选方案 A 后大部分关闭)

> ⚠️ **v0.1 错误** · v0.1 写"3 组并行机会节流 1-2 周"是基于"双 daemon"假设 · 但实测 ralph.py 不支持(详 §3.5 + §7.4)· 全部不可行。
>
> ⚠️ **v0.2 真相** · 14 PRD 严格串行(单 daemon)· 没有 ralph 层面的并行机会 · 但**仍有 3 类"伪并行"可在团队层面跑**:

| 类型 | PRD | 节流 | 实施方式 |
|---|---|:-:|---|
| **A · 文档前置准备并行** | 写 PRD-N+1 PRD 文件 · 同时 ralph 跑 PRD-N | 0.3w / PRD | 在 ralph 跑当前 PRD 时 · prd skill 提前写下一份 PRD 文档 · ralph 跑完无缝切 |
| **B · 测试金标准并行** | 写 PRD-4 ~ PRD-8 的 LLM Judge 100 金标准 · 同时主流程 ralph 跑 | 0.5w 节流 | 团队成员写金标准 · 不动 ralph |
| **C · 设计稿补充并行** | 设计师补 10 个工具页设计稿(参 §5.3)· 同时 ralph 跑 PRD-1/2 | 1w | 设计师/团队补稿 · ralph 不依赖设计稿(直到 PRD-5) |

> 团队层面节流(总周期可降到 23-24 周)· 但 **ralph 单 daemon 总执行时间 25 周不变** · 节流来自"非 ralph 工作并行" · 不是"两个 daemon 并行"。

### §7.4 单 daemon Coding 3.0 协同(★ 2026-05-07 v0.2 修订 · 方案 A)

> ⚠️ **v0.1 错误** · v0.1 写双 daemon 主+admin 并行 · 用编造的 5 个 cli 参数 · 实测不可行(详 §3.5)。v0.2 改为单 daemon 严格串行。

#### A · 14 PRD 串行执行的标准流程

```bash
# 项目根 · /Users/return/Desktop/QuanAn
# 14 PRD 严格串行 · 一次只跑 1 份

# Step 1 · 把当前要跑的 PRD 复制为 prd.json
cp scripts/ralph/prd-1.json scripts/ralph/prd.json

# Step 2 · 启 ralph daemon(后台 · 自动 detached)
python scripts/ralph/ralph.py --model sonnet --daemon

# Step 3 · watch-audit-gate 在 ralph.py --daemon 启动时已自动 fork
# (参全局 CLAUDE.md 2026-05-04 升级)
# 用户终端可选用 /monitor-ralph 跑 Monitor 工具盯日志

# Step 4 · 等所有 stories 跑完(audit-gate.json 显示 all_approved)
# Step 5 · /goal-verify 双向对账
# Step 6 · /prd-retro 反哺反例库
# Step 7 · 切下一份 PRD · 重复 Step 1
```

#### B · PRD 切换 7 步(自动化建议 · 写到 scripts/ralph/switch-prd.sh)

```bash
#!/bin/bash
# scripts/ralph/switch-prd.sh
# 用途 · 安全切换 14 PRD 中的下一份

set -e
NEXT_PRD=$1  # 例:"prd-2"

if [ -z "$NEXT_PRD" ]; then
  echo "用法 · bash scripts/ralph/switch-prd.sh prd-2"
  exit 1
fi

cd "$(dirname "$0")/../.."

# 1. 检查当前 PRD 是否跑完(audit-gate.json 状态)
if [ -f scripts/ralph/audit-gate.json ]; then
  STATUS=$(jq -r '.status' scripts/ralph/audit-gate.json 2>/dev/null || echo "unknown")
  if [ "$STATUS" != "all_approved" ] && [ "$STATUS" != "all_completed" ]; then
    echo "⚠️ 当前 PRD 未完成(status=$STATUS)· 中止切换"
    exit 1
  fi
fi

# 2. 备份当前 PRD 为 prd-N.done.json
if [ -f scripts/ralph/prd.json ]; then
  CURRENT_NAME=$(jq -r '.name // .id // "unknown"' scripts/ralph/prd.json 2>/dev/null)
  cp scripts/ralph/prd.json "scripts/ralph/${CURRENT_NAME}.done.json"
  echo "✅ 已备份 ${CURRENT_NAME}.done.json"
fi

# 3. 反哺反例库(参 ralph-tools.py reject-export · 如有)
if [ -f scripts/ralph/ralph-tools.py ]; then
  python scripts/ralph/ralph-tools.py reject-export 2>/dev/null || true
fi

# 4. 清旧 audit-gate / lock(让 ralph.py 启动时不被旧状态干扰)
rm -f scripts/ralph/audit-gate.json scripts/ralph/ralph-lock.json

# 5. 复制新 PRD
cp "scripts/ralph/${NEXT_PRD}.json" scripts/ralph/prd.json

# 6. 备份新 PRD 启动前快照(给 /goal-verify 回查用)
cp scripts/ralph/prd.json "scripts/ralph/${NEXT_PRD}.start.json"

echo "✅ 已切换到 ${NEXT_PRD}"
echo "   下一步 · python scripts/ralph/ralph.py --model sonnet --daemon"
```

#### C · admin PRD 启动时机(主应用 P8 完成后 · Week 17 起)

```
Week 1-16 · 主应用 PRD-1 ~ PRD-9 · 单 daemon 跑
  └─ 在项目根 /Users/return/Desktop/QuanAn 跑
  └─ 每跑完 1 PRD · bash scripts/ralph/switch-prd.sh prd-N+1

Week 17 起 · 主应用 P8 上线 · 切 admin PRD
  └─ 仍在项目根 /Users/return/Desktop/QuanAn 跑(同一 PROJECT_ROOT)
  └─ ralph daemon 不变 · 只是 prd.json 切到 prd-10.json
  └─ bash scripts/ralph/switch-prd.sh prd-10
```

> ⚠️ **关键** · 同一 PROJECT_ROOT · 同一 ralph daemon · 只是 prd.json 在切换 · admin PRD 跟主应用 PRD **共享**:
> - 同一 ralph-lock.json(切 PRD 时清掉)
> - 同一 audit-gate.json(切 PRD 时清掉)
> - 同一 cost-log.jsonl(append-only · 不清 · 跨 PRD 累加)
> - 同一 progress.txt(append-only)

#### D · 跨 PRD 资源共享(无锁冲突)

| 资源 | 跨 PRD 共享方式 |
|---|---|
| `scripts/ralph/cost-log.jsonl` | append-only · 14 PRD 累加成本 · 给运营总账用 |
| `scripts/ralph/progress.txt` | append-only · 14 PRD 进度连续记录 |
| `~/.claude/playbooks/reject-examples.jsonl` | 跨项目 + 跨 PRD 反例累加(每跑完 1 PRD · /prd-retro 自动 append)|
| `prisma/schema.prisma` | 跟着 PRD 变化逐步加表 · migration 时间戳自然串行 |
| `packages/schemas/` | 跟着 PRD 变化逐步加 zod schema |

> 所有跨 PRD 共享资源都是 append-only 或 union 增长 · 无锁冲突。

#### E · 方案 A 跟方案 B/C/D 的对比(为什么选 A)

| 方案 | 实现 | 工作量 | 总周期 | 风险 | 选 |
|:-:|---|:-:|:-:|:-:|:-:|
| **A · 同项目串行** | 单 daemon 跑 14 PRD · switch-prd.sh 切换 | 0.5h(写 switch-prd.sh)| 25w | 低 | ✅ 选这个 |
| B · 改全局 ralph.py 加 `--workspace` | 改 ~/.claude/scripts/ralph/ralph.py | 1-2 天 + 跨项目回归 | 24w | 高 · 影响其他项目 | ❌ |
| C · admin 当独立 PROJECT_ROOT(`apps/admin/scripts/ralph/`)| 在 apps/admin 下复制一份 ralph 配置 | 0.5 天 | 24w(并行)| 中 · 违反 monorepo · 数据库 migration 路径冲突 | ❌ |
| D · 写 wrapper 脚本传环境变量 | 改 ralph.py 读环境变量定 path | 1 天 | 24w | 中 · 仍要动全局工具 | ❌ |

### §7.5 14 PRD 启动 checklist

> 每份 PRD 启动前的强制 checklist(由 prd skill / 用户人工执行):

```markdown
## PRD-N 启动前 checklist

### 文档前置(自动检查)
- [ ] 上游 PRD 全部已合入主干(查 depends_on)
- [ ] ARCHITECTURE.md 引用章节已冻结(无 TODO / FIXME)
- [ ] DATA-MODEL.md 引用 schema 已冻结

### 反例库(§5.1 阻塞)
- [ ] reject-examples.jsonl 行数 ≥ 35(预填完成)
- [ ] 上一 PRD 的 reject 已 append 到反例库

### LLM Judge(§5.5 · PRD-4 起逐步)
- [ ] 本 Phase Specialist 的金标准已写到 tests/llm-judge/(数量按 §4.4-B 配额)

### 设计稿(§5.3 · PRD-5 起逐步)
- [ ] 本 Phase 涉及的 ui/ 设计稿已确认(基础稿 + 改造点)

### 实测数据(§5.4 · PRD-6/8)
- [ ] step6 / step8 sally 实测已抓(若选方案 ①)· 否则注明走方案 ②

### Coding 3.0 工具
- [ ] prd skill 输出 tasks/prd-N.md
- [ ] /plan-check 通过(§3.4 全部 7 项)
- [ ] ralph skill 转 prd.json
- [ ] /monitor-ralph 已跑(主 daemon)+ watch-audit-gate.py 起 daemon

### 双 daemon(PRD-10 起)
- [ ] 独立锁文件 / audit-gate / cost-log 已配
- [ ] 4 类冲突场景测试通过
```

### §7.6 §7 小结(2026-05-07 v0.2 修订)

本节答 4 件事:
1. **25 周总时间轴** · 主 16w + admin 9w · 严格串行(选方案 A · 单 daemon)
2. **关键路径**:PRD-1 → PRD-2 → PRD-4 → PRD-5/6/8 → PRD-12 · 任一延期影响全链
3. **3 类伪并行机会** · 文档前置准备 / 测试金标准编写 / 设计稿补充 · 在团队层面节流 1-2 周(ralph 总执行时间 25w 不变)
4. **单 daemon Coding 3.0 协同** · 同一 PROJECT_ROOT · 同一 ralph daemon · prd.json 串行切换(switch-prd.sh 7 步)· 反例库 / cost-log / progress.txt append-only 跨 PRD 累加

---

## §8 修订记录 + 引用源

### §8.1 修订记录

- **2026-05-07 v0.2** · 全链路修复 review 发现的 11 项问题(3 P0 + 5 P1 + 3 P2)
  - **🔴 P0-1 修** · 双 daemon → 方案 A(单 daemon 串行 · 25w)· 改 §1.3 时间线 / §3.5 ralph.py 启动协议 / §7.1 时间轴 / §7.3 并行机会 / §7.4 协同 / §7.6 小结 + ADMIN §8.7 / §9.3 + ARCHITECTURE §9.X · 删除编造的 5 个 cli 参数
  - **🔴 P0-2 修** · 真创建 `scripts/seed-reject-examples.sh`(去重 + 备份 + 验证 + chmod +x · 试跑成功 · 35 条已写入 reject-examples.jsonl)
  - **🔴 P0-3 修** · DESIGN.md 死链 · 改为 `ui/aurelian_dark/DESIGN.md` 全文显式
  - **🟠 P1-4 修** · ui/ 子目录数 64 → 66(全文 4 处替换)
  - **🟠 P1-5 加** · §5.12 PRD 失败回滚协议(L1 story / L2 PRD / L3 上游 / L4 架构 4 级 + 5 步流程 + 状态恢复 + 5 条不允许)
  - **🟠 P1-6 加** · §3.10 实施期 ARCHITECTURE 改动流程(a/b/c/d 4 类 + 5 步 + 频率上限 + 不允许私改)
  - **🟠 P1-7 加** · §1.4 E ownership 矩阵 + F 默认分配 + G frontmatter 模板(4 角色 prd_author / prd_reviewer / prd_executor / prd_verifier)
  - **🟠 P1-8 加** · §1.4 A-C 状态切换协议(4 档 + 触发事件 + 切换者 + 维护位置 + 生命周期图 + 硬约束)
  - **🟡 P2-9 修** · §4.3 anti_patterns 跟 §3.3 去重(改为"§3.3 讲流程 / §4.3 讲格式 + 算法")
  - **🟡 P2-10 加** · §5.13 PRD 过期重写策略(3 类触发 + refresh 不算重写 + 何时必须重写 + 14 PRD 全周期成本)
  - **🟡 P2-11 加** · 文件头 TL;DR 速览(1 分钟读懂 + 9 章产出 + 启动姿势 + 总周期)

- **2026-05-07 v0.1** · 创建 PRD-MASTER.md · ARCHITECTURE-driven PRD 模式启动总纲
  - **§0 7 维度诊断结论** · 实测 9 文档体系 + ui/ + 知识库 · 找到 10 真实缺口 · 整体就绪度按维度评分
  - **§1 14 PRD 全景索引** · 主应用 9 + admin 5 = 14 · depends_on 总图 + 时间线
  - **§2 PRD 写作模板 v1.0(锁定版)** · 8 字段 + 4 类 AC 强制(H/E/B/P)· 真实示范 · 8 反例
  - **§3 ARCHITECTURE-driven 工作流详细协议** · 5 阶段 + prd skill 输入输出 + ralph skill 转 prd.json + /plan-check 7 项 + ralph.py 双 daemon + Opus audit 4 维度 + /goal-verify 双向对账 + /prd-retro 反哺反例库
  - **§4 5 大支撑规范** · risk_level 4 档 + depends_on 拓扑 + anti_patterns 注入 + LLM Judge 100 金标准(双轨)+ 测试配额(200+/60-80/18-20/100)
  - **§5 缺口清单 10 项** · 2 P0 + 3 P1 + 3 P2 + 2 P3 · 每条带证据/影响/修复路径/时机
  - **§6 PRD-anti-patterns 预填**(★ 修复 P0 阻塞)· 35 条 6 大领域反例 + 一键导入脚本
  - **§7 14 PRD 启动顺序** · 24 周时间轴 + 关键路径 + 3 组并行 + 双 daemon Coding 3.0 协同 + 启动 checklist

### §8.2 引用源(本文件诊断 + 设计的全部依据)

#### 项目内文档
- [ARCHITECTURE.md](ARCHITECTURE.md) v0.3 · 9 章 / 3256 行 · 主架构骨架(诊断维度 1/2/4/5)
- [ADMIN-ARCHITECTURE.md](ADMIN-ARCHITECTURE.md) v0.1 · 9 章 / 1762 行 · admin 子系统骨架(诊断维度 1/4/5)
- [AGENTS.md](AGENTS.md) v0.2 · 10 章 / 2591 行 · 代码层约束(§6 反例 35 条派生源)
- [ADR.md](ADR.md) v0.2 · 21 ADR / 1779 行(§6 反例 evidence 引用)
- [DATA-MODEL.md](DATA-MODEL.md) v0.2 · 13 节 / 31 实体 / 3579 行(诊断维度 3)
- [PROMPTS.md](PROMPTS.md) · 14 Specialist · 2340 行
- [SCAFFOLD.md](SCAFFOLD.md) v0.2 · 强制 monorepo / 535 行
- [ARCHITECTURE-REVIEW.md](ARCHITECTURE-REVIEW.md) · 1223 行 · 上一轮诊断 · 提供 ARCHITECTURE-driven 决策背景
- [aiipznt-spec.md](aiipznt-spec.md) · 322KB · 复刻基线(诊断维度 1/3/7)
- [ui/](ui/) · 66 子目录 / 60+ 实际设计稿 + [aurelian_dark/DESIGN.md](ui/aurelian_dark/DESIGN.md)(诊断维度 1)

#### 知识库引用
- [knowledge-base/12-knowledge-management/03 两方案对比矩阵](../Ai_Agent/knowledge-base/12-knowledge-management/03-两方案对比矩阵.md) · "不汇总总分"教训 · §0.2 应用
- [knowledge-base/reference-materials/PI-Agent设计哲学/03 Workflow与Agent二分法](../Ai_Agent/knowledge-base/reference-materials/PI-Agent设计哲学/03-Workflow与Agent二分法.md) · §6 反例 #2 派生源
- [knowledge-base/reference-materials/Agent运营数据分析框架](../Ai_Agent/knowledge-base/reference-materials/Agent运营数据分析框架.md) · §1 PRD-11 索引引用
- [knowledge-base/reference-materials/LLMOps与团队协作指南](../Ai_Agent/knowledge-base/reference-materials/LLMOps与团队协作指南.md) · §1 PRD-13 索引引用
- [knowledge-base/reference-materials/Agent安全架构与合规指南](../Ai_Agent/knowledge-base/reference-materials/Agent安全架构与合规指南.md) · §6 反例 #29 派生源
- [knowledge-base/08-tech-decisions/架构决策记录(ADR)](../Ai_Agent/knowledge-base/08-tech-decisions/) · ADR-016 Approval Gates / ADR-018 外部 orchestrator

#### 全局 Coding 3.0 配置
- `~/.claude/CLAUDE.md` · 全局 Coding 3.0 12 步流程 · §3 工作流协议派生源
- `~/.claude/scripts/ralph/AUDIT-CHECKLIST-TEMPLATE.md` · §Z risk_level 分档 · §4.1 派生源
- `~/.claude/scripts/ralph/REJECT-TEMPLATE.md` · §6 反例格式派生源
- `~/.claude/playbooks/reject-examples.jsonl` · §6 写入目标(当前 0 字节 · 必须预填)

#### 实测命令(诊断时跑过)
- `wc -l ~/.claude/playbooks/reject-examples.jsonl` → 0(§5.1 证据)
- `ls /Users/return/Desktop/QuanAn/ui/ \| wc -l` → 66 子目录(§5.3 证据)
- `grep "schema 推断" ARCHITECTURE.md` → L761 + L763(§5.4 证据)
- `grep "退出条件" ARCHITECTURE.md` → 9 行(§5.2 证据)+ ADMIN.md → 5 行(同)
- `grep "可选" ARCHITECTURE.md` → 13 处(§5.10 证据)

---

## 全文小结

> 本 PRD-MASTER.md 是 ARCHITECTURE-driven PRD 模式启动前的"事实来源 + 写作总纲 + 缺口清单"·
> 不是 PRD 本身 · 是写 14 份 PRD 的方法论锁定 + 反例库预填 + 协议规范。

**关键产出**:
1. **诊断 7 维度** · 实测 9 文档体系 · 找到 10 真实缺口(2 P0 + 3 P1 + 3 P2 + 2 P3)
2. **2 个 P0 阻塞已修**:
   - §6 35 条反例预填 · `bash scripts/seed-reject-examples.sh` 一键导入
   - §2 PRD 写作模板锁定 4 类 AC(H/E/B/P)强制必含
3. **14 PRD 全景索引** · §1 索引 + §7 时间轴 + 双 daemon 协同
4. **5 大支撑规范** · §4 risk/depends/anti/Judge/测试配额

**下一步**(给用户决定)·
1. 跑 `bash scripts/seed-reject-examples.sh` 把 35 条反例写入 reject-examples.jsonl(立即可做 · 30 秒)
2. 跑 `prd skill` 写 PRD-1(P0 基础设施 · 1 小时)· 严格按 §2 模板
3. 评审 §0 诊断 + §5 缺口 · 如有遗漏再补
4. 看其他

> **本文件由 Claude(Opus 4.7)基于 9 文档体系 + 知识库 + 全局 Coding 3.0 流程派生 · 实测 7 维度 · 2026-05-07 创建。**

