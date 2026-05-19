# aiipznt 复刻执行总览 · 高层视觉 Plan

> **派生** · 用户决策 Q1-A / Q2-B / Q3-cookie / Q4-B / Q5-A / Q6-B / Q7-A / Q8-A
> **互补** · 跟 [aiipznt-spec.md](aiipznt-spec.md)(9192 行 SOP)+ [aiipznt-deep-dom-dump.md](aiipznt-deep-dom-dump.md)(32 路由 DOM 实测)互补
> **不重复** · 本文不抄 dump.md §2 / §4 / §6 内容,只补三件 dump 没的 · **状态矩阵 / 波次甘特 / 共享组件清单**
> **作者** · Opus 4.7 · 2026-05-18 BJT
> **状态** · 待用户 review · 同意后开干 PRD-16

---

## §0 决策落锁(8 项 · 全部已确认)

| 编号 | 决策项 | 选择 | 含义 |
|:-:|---|:-:|---|
| Q1 | 复刻目标位置 | **A** | 直接覆盖 `apps/web`(5173 端口)· 不动 admin |
| Q2 | 后端处理 | **B** | API 占位但走通(`/trpc/*` 已有的保留 + 缺失的加 mock router) |
| Q3 | aiipznt 站点信息源 | 已有 | spec + dump + `/tmp/aiipznt-clone-research/` 抓取产物已够 · cookie 暂不需 |
| Q4 | 配色策略 | **B** | 保留当前 globals.css tokens(`--primary: 43 87% 63%` HSL 金色 + dark BG)· 跟 aiipznt 视觉天然接近 |
| Q5 | 既有代码处理 | **A** | 保留 + 改造 · PRD-15 已沉淀的 8 页仅做视觉对齐验证 · 不删 |
| Q6 | 实施节奏 | **B** | 先出本总览(本文)· 同意后走 Coding 3.0 流程(prd → ralph → daemon → audit) |
| Q7 | Q5-B 冲突修正 | 同 Q5 | 已统一为 Q5-A |
| Q8 | Plan 文档形式 | **A** | dump.md §4 + §6 作为 PRD 拆分基线 · 本文补 3 件高层视觉 |

**D1-D4 历史决策**(dump §0)继续生效 · D1=A 像素级 layout · D2=A 实测访问已做 · D3=A admin 不动 · D4=B 颜色保留。

---

## §1 32 页面状态矩阵(本文新补 · dump §2 没有的"行动列")

> **图例** · ✅ 保留+验证 · ★ 重写 · 🟡 半成品改造 · ❌ 新建
> **PRD 列** · 引用 dump §4 拆分

### §1.1 公开 + 主流程导航(3 page)

| Route | Page | 当前状态 | 目标 | 行动 | LOC | PRD |
|---|---|:-:|---|:-:|:-:|:-:|
| `/` | 首页 | 190 LOC 雏形 | Hero + 9 step 进度 + 15 卡 FUNCTION MATRIX + WORKFLOW + READY TO START | ★ 重写 | 190→~450 | **16** |
| `/guide` | 使用说明 | 占位 Guide.tsx | USER GUIDE H1 + 5 步推荐 + 系统概览 3 卡 + **13 模块卡** + FAQ 5 | ❌ 新建 | →~350 | **16** |
| `/ip-plan` | 我的 IP 方案 | StepProgress + skeleton | H1 + 副标 N/9 + glass-card 进度条 + 9 步卡片网格 | ★ 重写 | →~300 | **16** |

### §1.2 9 步主流程(11 page)

| Step | H1 | 当前 | 目标关键控件 | 行动 | LOC | PRD |
|:-:|---|:-:|---|:-:|:-:|:-:|
| `/step/1` | 选择你的行业赛道 | 310 通用 | 6 tab + 56 行业 emoji 双行卡 + search + 自定义 modal | ★ 重写 | 310→~380 | **17** |
| `/step/2` | (空) | 21 stub | 404 fallback | 🟡 改造 | 21→~30 | **17** |
| `/step/3` | 账号包装方案 | 483 通用 | textarea + 5 平台 radio + 2 input + **7 H3 输出区** | ★ 重写 | 483→~520 | **17** |
| `/step/3b` | 人设定制方案 | 423 通用 | 3 textarea + input + **6 H3 输出区** | ★ 重写 | 423→~470 | **17** |
| `/step/4` | 执行计划 | 218 通用 | 3 input(粉丝/目标/情况) | ★ 重写 | 218→~250 | **18** |
| `/step/4b` | 变现路径 | 266 通用 | textarea + 3 input + 3 阶梯输出 + 收入结构 + 案例 | ★ 重写 | 266→~330 | **18** |
| `/step/5` | 爆款选题库 | 245 通用 | 2 input + 2 file upload + 选题库列表 | ★ 重写 | 245→~280 | **18** |
| `/step/6` | 拍摄计划 | 251 通用 | textarea(≥10字) + 跳 step7 提示 | ★ 重写 | 251→~290 | **18** |
| `/step/7` | 文案生成 | 257 通用 | search + **22 爆款元素多选** + textarea + 优化 input + **4 H4 输出** | ★ 重写 | 257→~400 | **18** |
| `/step/8` | 直播策划 | 69 占位 | **2 H3 子功能**(生成方案 / AI优化话术) | ★ 重写 | 69→~280 | **18** |
| `/step/9` | (review · 未上线) | 21 stub | 保留 stub · 标 hidden | 🟡 改造 | 21→~30 | **17** |

### §1.3 14 工具 page

| Route | H1 | 当前 | 状态 | 行动 | LOC | PRD |
|---|---|:-:|---|:-:|:-:|:-:|
| `/trending` | 全网爆款库 | 256 ✅ | PRD-15 US-006 已完整化 | 🟡 视觉对齐验证 | 256 | **19** |
| `/copywriting` | (从 step7 引出) | 254 ✅ | PRD-15 US-002 已完整化(独立 · 不在 aiipznt 32 路由) | 🟡 验证 + 保留 | 254 | **19** |
| `/present-styles` | 爆款呈现形式合集 | 302 ✅ | PRD-15 US-004 已完整化 | 🟡 验证 | 302 | **19** |
| `/monetization` | IP 变现模型 | 141 ✅ | PRD-15 US-004 已完整化 | 🟡 验证 | 141 | **19** |
| `/private-domain` | 私域成交流程 | 434 ✅ | PRD-15 US-005 已完整化 | 🟡 验证 | 434 | **19** |
| `/deep-learning` | 文案深度学习 | 180 ✅ | PRD-15 US-003 已完整化 | 🟡 验证 | 180 | **19** |
| `/video-analysis` | 爆款文案解析 | 92 stub | 2 input + 7 button | ★ 完整化 | 92→~150 | **19** |
| `/boom-generate` | 爆款元素自动生成 | 136 stub | **22 元素多选** + 2 input + 30 button | ★ 完整化 | 136→~250 | **19** |
| `/generate` | 生成爆款文案 | 226 stub | **50 button**(多脚本 + 多生成 + 历史) + 1 input | ★ 完整化 | 226→~400 | **19** |
| `/analysis` | 文案结构分析 | 92 stub | textarea + 7 button | ★ 完整化 | 92→~140 | **19** |
| `/video-production` | 短视频一键制作 | 103 stub | textarea + 7 button | ★ 完整化 | 103→~150 | **19** |
| `/acquisition-video` | 获客型视频制作 | 110 stub | **双 textarea(客户+卖点)** + 8 button | ★ 完整化 | 110→~180 | **19** |
| `/ai-video` | STORYBOARD | 173 stub | **专业分镜表 13 列** + 18 button + 1 input | ★ 完整化 | 173→~300 | **19** |
| `/voice-chat` | VOICE CHAT | 612 stub | **IP变现顾问对话气泡** + 语音输入 + 12 button | ★ 完整化 | 612→~700 | **19** |
| `/knowledge` | AIP 文案方法论 | 289 stub | **30 button 多脚本卡** + search · 类似 /present-styles | ★ 完整化 | 289→~500 | **19** |

### §1.4 6 modules

| Route | H1 | 当前 | 状态 | 行动 | LOC | PRD |
|---|---|:-:|---|:-:|:-:|:-:|
| `/my-topics` | 我的选题库 | 574 ✅ | PRD-15 US-007 已完整化 | 🟡 验证 | 574 | **19** |
| `/history` | 历史记录 | 839 ✅ | PRD-15 US-008 已完整化 | 🟡 验证 | 839 | **19** |
| `/diagnosis` | 7 维度 IP 诊断报告 | 33 stub | 行业 + 产品 input + 12 button | ★ 完整化 | 33→~250 | **19** |
| `/daily-tasks` | 今日行动清单 | 319 stub | **4 H3 任务卡**(无 input) | ★ 完整化 | 319→~380 | **19** |
| `/evolution` | 智能体进化中心 | 370 stub | **5 H3**(等级/洞察/反馈/学习档案/设置) | ★ 完整化 | 370→~480 | **19** |
| `/accounts` | IP 账号管理 | 38 stub | 当前账号卡 + 新建账号 modal | ★ 完整化 | 38→~280 | **19** |

### §1.5 辅助(非 aiipznt 32 路由 · QuanAn 工程需要保留)

| Route | 用途 | 行动 |
|---|---|:-:|
| `/login` | OAuth 入口 | 🟡 视觉对齐(aiipznt 也有但 dump 没专门列) |
| `/settings` | QuanAn 自有 | ✅ 保留 |
| `/*` 404 | catch-all | ✅ 保留 |

### §1.6 工作量总览(单位 LOC)

| 类别 | 当前 | 目标 | Δ |
|---|:-:|:-:|:-:|
| ✅ 保留(PRD-15 沉淀 8 页) | ~2880 | ~2880 | 0 |
| ★ 重写 / 完整化 | ~5447 | ~7500 | +2053 |
| ❌ 新建(Home + guide + ip-plan + 共享组件) | 190 | ~1500 | +1310 |
| **frontend 总计** | **8327** | **~11880** | **+3553** |

约 **35% 净增** · 主要来自 stub 完整化 + 5 共享 picker + Home 重写。

---

## §2 实施波次甘特图(本文新补)

```
                W1    W2    W3    W4    W5    W6    W7    W8    W9    W10
                ─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────
PRD-16 设计系统 ████████████                                              ← 1.5-2 周
       + 首页                                                                8-11 US
       + Header                                                              ★ foundation
       + guide
       + ip-plan
                            
PRD-17 Step1/3/3b           █████████████                                  ← 2 周
                                                                             8-10 US
                            
PRD-18 Step                                █████████████████                ← 2.5 周
       4/4b/5/6/7/8                                                          10-12 US
                            
PRD-19 14 工具 + 4 modules                                  █████████████████ ← 2-2.5 周
       + 视觉精修 + 全 32                                                     10-12 US
       page visual diff
                ─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────
关键里程碑       │     │     │     │     │     │     │     │     │     │
M1 设计系统就绪 ▲     │     │     │     │     │     │     │     │     │
   (US-001)
M2 PRD-16 ship       ▲                                                       ← 首页可用
M3 PRD-17 ship                   ▲                                           ← 前 3 step 完整
M4 PRD-18 ship                                     ▲                         ← 9 step 全完整
M5 PRD-19 ship                                                         ▲   ← 全 32 page 对齐
M6 visual diff                                                              ▲ ← 全站截图对比通过
   收官 verify
```

**关键路径** · M1 (设计系统 + Header dropdown 25 二级项) 是后续 4 个 PRD 的 unblock 前提 · 必须 W1 内 ship。

**风险点** · PRD-19 跨度最大(14 工具 + 4 modules + 视觉精修)· 可考虑拆 19a / 19b 两段。

---

## §3 共享组件清单(本文新补)

> **图例** · ❌ 新建 · ★ 重写 · 🟡 改造 · ✅ 复用
> **PRD 列** · 该组件首次落地的 PRD

### §3.1 Layout / Header(PRD-16 集中产出)

| 组件 | 路径建议 | 状态 | 用在 | PRD |
|---|---|:-:|---|:-:|
| `<RootLayout>` | `layouts/RootLayout.tsx` | 🟡 改 | 全 32 page | 16 |
| `<Header>` | `components/Header.tsx` | ★ 重写(现 239 LOC) | 全 32 page · sticky 顶部 | 16 |
| `<HeaderDropdown>`(4 一级) | `components/header/HeaderDropdown.tsx` | ❌ 新建 | Header 中央 · 25 二级项 | 16 |
| `<AccountSwitcher>`(赵语AI button) | `components/AccountSwitcher.tsx` | ★ 重写(现有但不符 §1.3) | Header 右侧 IP 切换 | 16 |
| `<UserChip>` | `components/header/UserChip.tsx` | 🟡 改 | Header 右侧 · `animate-ping` 圆点 | 16 |
| `<LogoutIconButton>` | `components/header/LogoutIconButton.tsx` | 🟡 改(无确认弹窗) | Header 右侧 | 16 |
| `<MobileNavPanel>` | `components/header/MobileNavPanel.tsx` | ❌ 新建 | < 1024px · 不是 drawer/sheet · 是 header 下方下拉面板 | 16 |
| `<Toaster>` | sonner 配置 | 🟡 改位置 | 全 32 page · `position="bottom-right"` | 16 |

### §3.2 设计系统 token / 字体 / motion(PRD-16 US-001 foundation)

| 资源 | 状态 | 说明 | PRD |
|---|:-:|---|:-:|
| `tokens.css` 字体导入(Orbitron + Rajdhani + Noto Sans SC) | ❌ 新建 | Google Fonts preconnect + link | 16 |
| `tailwind.config` font-display family | 🟡 改 | 加 Orbitron / Rajdhani key | 16 |
| `animate-ping` 紫色变体(实际是 gold 变体) | 🟡 改 | `bg-primary` opacity-75 | 16 |
| `framer-motion` step 卡入场 | ❌ 新建 | `opacity/transform` 渐入 | 16 |
| `glass-card` utility | ❌ 新建 | bg-card/50 + backdrop-blur + border-primary/15 + shadow | 16 |
| `data-grid-bg` 全局背景纹理 | ❌ 新建 | 全 32 page `<div>` 容器最外层 | 16 |
| dropdown 浮层 utility class(`bg-popover/95 backdrop-blur-xl border-primary/15 shadow-primary/5 z-50`) | ❌ 新建 | Header 4 dropdown + AccountSwitcher | 16 |

### §3.3 表单选择器(5 个核心 picker · PRD-17/18 产出)

| 组件 | 数据源 | 状态 | 用在 | PRD |
|---|---|:-:|---|:-:|
| `<IndustryPicker>`(56 行业 emoji 双行 + 6 tab + search + 自定义 modal) | `lib/constants/industries.ts`(已有) | ★ 重写现有 `IndustryDropdown.tsx` | step1 + step5 + diagnosis | 17 |
| `<PlatformRadio>`(5 平台:抖音/小红书/视频号/快手/B站) | `lib/constants/platforms.ts` | ❌ 新建 | step3 + step8 等 | 17 |
| `<HotElementsMultiPicker>`(22 爆款元素 4 组分类) | `lib/constants/hotElementsZh.ts`(已有) | ❌ 新建 | step7 + boom-generate | 18 |
| `<ScriptTypePicker>`(20 脚本类型 + search) | `lib/constants/scripts.ts`(已有) | ❌ 新建 | step7 + knowledge + generate | 18 |
| `<PresentationFormatPicker>`(14 呈现形式 · 卡片网格 · 配 5 色金渐变) | `lib/constants/presentationFormats.ts` | ❌ 新建 | present-styles + ai-video | 19 |

### §3.4 通用结果 / 工具(全 PRD)

| 组件 | 状态 | 用在 | PRD |
|---|:-:|---|:-:|
| `<ResultCard>`(标题 + 内容 + 复制 + 重新生成 + AI 优化 3 button) | ★ 重写现有 `StepResult/` | 全 step 输出区 + 全 tool 结果区 | 16-17 |
| `<FileUpload>`(PDF/Word/TXT/MD/CSV 通用 · maxSize 20MB) | ❌ 新建 | step5 + deep-learning | 18 |
| `<StepHeader>`("STEP 0X · 标题" Orbitron) | ❌ 新建 | 9 个 step page | 17 |
| `<StepProgress>` 9 步进度条 | 🟡 改造现有(247 LOC) | Home + ip-plan + 9 step page sticky | 16 |
| `<ToolForm>` / `<ToolResult>` 通用 | ✅ 复用现有 | 14 tool page | 19 |
| `<EmptyState>` / `<LoadingState>` | ✅ 复用现有 `components/states/` | 全 page | 16-19 |
| `<FeedbackButton>` | ✅ 复用现有 | 全 step page | - |
| `<StreamdownPreview>`(前端打字机模拟) | ✅ 复用现有 | 文案输出区 | - |
| `<ErrorBoundary>` | ✅ 复用现有 | router 兜底 | - |

### §3.5 Page 专属组件(各自 PRD 产出)

- step3/ step3b/ step4b/ step5/ step7/ step8 的子组件 · **改造现有**(`components/step3/` `components/step5/` 等已有目录) · PRD-17/18
- 14 工具的 stub 完整化 · 沿用 `<ToolForm>` `<ToolResult>` · PRD-19
- modules/ Diagnosis / DailyTasks / Evolution / Accounts 子卡 · ❌ 新建 · PRD-19

---

## §4 红线快引(引用 dump §6.1 · 不重写)

> 5 条红线 · 全部在 [aiipznt-deep-dom-dump.md §6.1](aiipznt-deep-dom-dump.md) · 本文不重抄 · 这里只列编号 + 一句话 trigger

1. ❌ **不切金色 OKLCH** → 保留当前 HSL 金色 token(`--primary: 43 87% 63%`)· `var(--gold)` 引用替换为 `var(--primary)`
2. ❌ **不删 PRD-15 沉淀 8 页** → /copywriting /deep-learning /monetization /present-styles /private-domain /trending /my-topics /history · PRD-19 仅验证
3. ❌ **不动 admin** → `apps/admin/` 完全 0 触动 · 重启了无所谓但代码不动
4. ❌ **不重写 backend tRPC + DB schema** → 仅 frontend 重构 · 14 PRD backend 沉淀保留
5. ❌ **不绕过 Audit Gate** → PRD-16~19 严格走 ralph daemon + Opus 4 维度 audit + risk_level 分档

**额外两条(本文加锁)**:
- 6. ❌ **不直接拷贝 aiipznt 的版权素材** → logo svg / 品牌名「aiipznt」/ slogan「善用 AI 你一个人就是千军万马」/ 产品截图 · 全部用 QuanAn 占位
- 7. ❌ **不依赖 Manus 平台** → 去掉 `<MANUS-CONTENT-ROOT>` `manus-runtime` 等所有 manus 标记 · 用纯 React + Vite 渲染

---

## §5 PRD-16 切入点(下一步)

### §5.1 PRD-16 范围(引用 dump §4 · 不重写)

8-11 US · 1.5-2 周 · 见 [aiipznt-deep-dom-dump.md §4 PRD-16](aiipznt-deep-dom-dump.md) ·
- US-001 ★ foundation · 设计系统切换(字体 + token + motion)
- US-002 high · 首页 Hero
- US-003 high · 首页 9 步进度区
- US-004 high+large · 首页 FUNCTION MATRIX 15 卡
- US-005 medium · 首页 WORKFLOW 7 步
- US-006 medium · 首页 READY TO START
- US-007 ★ high · Header 重构 + 4 一级 dropdown(25 二级项)
- US-008 medium · AccountSwitcher
- US-009 medium · /guide
- US-010 medium · /ip-plan 重写
- US-011 收官 · verify + 4 e2e + visual diff

### §5.2 关键 Locked Decisions(预埋 PRD-16 D-130~D-140)

| 编号 | 决策 | 出处 |
|:-:|---|---|
| D-130 | 设计系统 tokens 保留(D4=B · Q4-B 确认) | 本文 §0 / §4 |
| D-131 | 字体 = Orbitron + Rajdhani + Noto Sans SC | dump §1.6 |
| D-132 | Header dropdown 触发方式 = click(非 hover) | dump §1.1 |
| D-133 | Header 4 一级 = 创作 / 策划 / 智能 / 更多(25 二级项严格按 §1.2) | dump §1.2 |
| D-134 | 移动端 nav = header 下方下拉面板(非 drawer/sheet) | dump §1.5 |
| D-135 | sonner toast position = bottom-right | dump §1.6 |
| D-136 | 首页 FUNCTION MATRIX = 15 卡(14 + footer 使用说明 · 修正 spec §6.2 漏 1) | dump §3 Diff 2 |
| D-137 | 首页 H1 = "AI+短视频+IP"(修正 spec §6.1) | dump §3 Diff 1 |
| D-138 | /ip-plan H1 = "我的IP方案"(无空格) | dump §3 Diff 4 |
| D-139 | logout icon-only · 无确认弹窗 | dump §1.1 |
| D-140 | Manus 标记全去 · 不依赖 Manus 平台 | spec §2.3 |

### §5.3 PRD-16 完成定义(DoD)

- ✅ 11 US 全部 audit approved(Opus 4 维度)
- ✅ verify-prd-16.sh 通过(4 e2e flow:home / guide / ip-plan / header-dropdown)
- ✅ visual diff with `/tmp/aiipznt-clone-research/screenshots/{00-home,01-guide,02-ip-plan}.png` 容差 < 10%
- ✅ /goal-verify §0 跑 /gsd-map-codebase 同步 .planning/codebase/ + 对账 AGENTS.md
- ✅ /prd-retro 提炼可迁移 playbook 回传 progress.txt

---

## §6 实施前置(本文新补 · 在跑 prd skill 写 PRD-16 seed 之前)

### §6.1 必做 4 件(预计 30 min · 用户授权后 Opus 直接动手)

1. **备份当前 main 分支** · `git branch backup/before-prd-16 main` · 防 PRD-16 ship 后回滚需要
2. **确认 dev 服务都在** · admin 5174 / web 5173 / api 3000 都 healthy(本次会话已修)
3. **确认抓取产物在** · `ls /tmp/aiipznt-clone-research/dump/ | wc -l` 应该 = 32 + `_summary.json`
4. **确认 reject 反例库 seed 过** · `wc -l ~/.claude/playbooks/reject-examples.jsonl` 应该 ≥ 35

### §6.2 可选(用户酌情)

- 用户手动 logout aiipznt.vip(防 cookie 泄露 · dump §5.1 已建议)
- 用户在 Comet 浏览器打开 aiipznt.vip 关键页 · 后续 PRD-16 实施时如需要补抓 dropdown 弹层 · 可用 setup-browser-cookies 导 cookie 给 browse skill

### §6.3 Opus 主对话承担

按全局 CLAUDE.md "Opus 全程 + Sonnet 执行子任务" ·
- prd skill 写 tasks/prd-16.md(Opus 主对话)
- ralph skill 转 prd.json(Opus 主对话)
- /plan-check 7 项门禁(Opus 主对话)
- ralph.py daemon 跑 + Opus Audit Gate(Sonnet daemon + Opus audit)
- /goal-verify §0 + 1+(Opus 主对话)
- /prd-retro(Opus 主对话)

---

## §7 你 review 本文需要确认的 4 件事(verify 后开干)

| # | 待确认 | 默认 |
|:-:|---|---|
| C1 | §1 32 页面矩阵的"行动"列(★/🟡/✅/❌)分配是否符合预期 | 按 dump §2 标识 + PRD-15 沉淀 |
| C2 | §2 波次甘特 10 周节奏是否符合预期(或要压到 6-8 周 / 拉到 12 周) | 8-10 周 |
| C3 | §3 共享组件清单是否漏了关键组件 | 已含 Header + 5 picker + ResultCard + glass-card + 8 类工具 |
| C4 | §5 PRD-16 切入点是否就是下一步(同意走 ralph daemon)or 先停在 plan | 同意 → 跑 prd skill 写 PRD-16 seed |

---

## §8 同意后的 SOP(供下一会话也能接续)

```
Step 1 · git branch backup/before-prd-16 main
Step 2 · prd skill (Opus 主对话)写 tasks/prd-16.md · 1500-2000 行 · 11 US + D-130~D-140 + AC-N
Step 3 · ralph skill 转 scripts/ralph/prd-16.json(注入 anti_patterns from reject 库)
Step 4 · /plan-check scripts/ralph/prd-16.json · 7 项质量门禁
Step 5 · cp prd-16.json prd.json · python3 scripts/ralph/ralph.py --model sonnet --daemon
Step 5.1 · ★ Monitor 必启 · tail -F ralph-output.log | grep PENDING_DETECTED 等(项目 CLAUDE.md §9.1)
Step 5.5 · Monitor 通知 PENDING → Opus 5 步 Cheat Sheet audit → approve/reject
Step 6 · 全部 US passed → /goal-verify
Step 7 · /prd-retro → playbook 回传 progress.txt
Step 8 · PRD-17 同节奏继续
```

---

> **本文由 Opus 4.7 在 2026-05-18 BJT 写 · QuanAn 项目内 aiipznt 复刻总览高层 plan · 跟 dump.md §4 + §6 互补 · 等用户 review C1-C4 后开干 PRD-16**
