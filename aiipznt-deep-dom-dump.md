# aiipznt.vip · 32 SPA 路由完整 DOM Dump(2026-05-16 实测)

> **生成** · 2026-05-16 BJT · sally zhao 真实登录态 · Playwright headless chromium-1217 · 1440x900 viewport · 全 32 page 抓 DOM + screenshot
> **目的** · 给 PRD-16~19 主应用前端对齐 aiipznt 提供精确 spec 补丁 · 跟 [aiipznt-spec.md](aiipznt-spec.md)(9192 行 · 早期实测推断)互补
> **跟 aiipznt-spec.md 关系** · spec 是设计文档(SOP / 字段 / 推测) · 本 dump 是 DOM 实测(H 标签 / button 数 / input 列表 / nav href / 实际 page 元素数) · 当 spec 跟 dump 冲突时 **以 dump 为准**
> **抓取 · 产物** · `/tmp/aiipznt-clone-research/dump/` (32 HTML + _summary.json) + `/tmp/aiipznt-clone-research/screenshots/` (32 PNG · fullPage 1440 宽) · ⚠️ 不 commit 进 git(第三方产物 · 临时)

---

## §0 复刻定调(用户决策 D1=A · D2=A · D3=A · D4=B)

- **D1 像素级 layout** · layout / 区块顺序 / 区块尺寸 / spacing / 字体 weight / motion / SVG icons 全部 1:1 对齐 aiipznt
- **D2 实测访问** · ✓ 32 page DOM 全抓 + screenshot 全存(本 dump)
- **D3 仅主应用** · admin (apps/admin) 完全不动 · 保持 PRD-10~14 沉淀
- **D4 颜色保留** · **不切金色 OKLCH** · 所有 `var(--primary)` 等保留 Aurelian Dark 紫色系 · 仅 Header / 字体 / spacing / 区块 / motion 切

---

## §1 跨 page 共享元素(全 32 page 一致)

### §1.1 Header(64px 高 · 全 page 顶部 sticky · 中央 4 dropdown · 右侧 IP切换 + 用户区)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [AIP·AGENT logo]   创作 ▾  策划 ▾  智能 ▾  更多 ▾    [赵语AI ▾]  [sally zhao]  ⎋  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

- **左侧** · `AIP / AGENT` 双行金色 logo · 金色方块图标 · 点击回 `/`
- **中央 4 一级菜单** · click 触发(非 hover)· 每个 button 后跟 `lucide-chevron-down h-3 w-3 transition-transform`(展开旋转)
- **右侧** ·
  - **赵语AI 按钮**(IP 账号切换器 · 不是浮窗)· `px-2.5 py-1.5 rounded-lg text-xs bg-secondary/50 border border-gold/15 hover:border-gold/30` · 显示当前活跃 IP 账号名 · click 弹账号 dropdown
  - **sally zhao chip** · 纯展示(`<div>` 不可点)· 左边 `animate-ping bg-gold-light` 跳动金色圆点(在线状态)
  - **登出 icon-only** · `lucide-log-out h-4 w-4` · 单击直接登出 · 无确认

### §1.2 Header 4 一级菜单 dropdown 完整 25 项(spec §12.1 实测确认)

| 一级 | 项数 | 二级项 | 路由 |
|---|:-:|---|---|
| **创作** | 5 | 爆款选题 / 文案生成 / 文案解析 / 获客视频 / 呈现形式 | /step/5 / /step/7 / /video-analysis / /acquisition-video / /present-styles |
| **策划** | 8 | 选择行业 / 账号包装 / 人设定制 / 执行计划 / 变现路径 / 拍摄计划 / 直播策划 / 私域成交 | /step/1 / /step/3 / /step/3b / /step/4 / /step/4b / /step/6 / /step/8 / /private-domain |
| **智能** | 6 | IP诊断 / 每日任务 / AI视频 / 语音对话 / 深度学习 / 进化仪表盘 | /diagnosis / /daily-tasks / /ai-video / /voice-chat / /deep-learning / /evolution |
| **更多** | 6 | 账号管理 / 方法论 / 使用说明 / 我的IP方案 / 我的选题库 / 历史记录 | /accounts / /knowledge / /guide / /ip-plan / /my-topics / /history |

**dropdown 浮层样式** ·
```css
.absolute.top-full.left-0.mt-1.py-1.min-w-[180px]
.rounded-xl.border.border-gold/15
.bg-popover/95.backdrop-blur-xl
.text-popover-foreground
.shadow-lg.shadow-gold/5
.z-50
```

**D4=B 调整** · 把 `border-gold/15` `shadow-gold/5` 改为 `border-primary/15` `shadow-primary/5`(用 Aurelian Dark 紫色 token)

### §1.3 IP 账号切换 dropdown(`赵语AI` button)

```
[赵语AI ▼]   ← header 右侧
   ↓ click
┌────────────────────────────┐
│ IP ACCOUNTS                │
│ ┌────────────────────────┐ │
│ │ 赵语AI                  │ │  ← 当前活跃账号高亮
│ │ 企业服务 · douyin       │ │
│ └────────────────────────┘ │
│ [其他账号 1...]             │
│ [其他账号 N...]             │
│ [管理账号 →] /accounts      │
└────────────────────────────┘
```

按钮文字 = 当前活跃账号名(动态)· 实测当前是 `赵语AI`(企业服务 · douyin)。

### §1.4 整体页面骨架(全 32 page 一致)

```jsx
<div className="min-h-screen bg-background data-grid-bg">
  <Header />                           {/* §1.1-§1.3 */}
  <main className="container mx-auto px-4 py-8">
    <PageContent />                    {/* 各 page 独立 */}
  </main>
  <Toaster position="bottom-right" />  {/* sonner */}
  <ManusFooterBadge />                 {/* 右下 "Made with Manus" 角标 · 复刻可去 */}
</div>
```

### §1.5 移动端导航(< 1024px lg breakpoint)

不是 drawer / sheet · 是 **header 下方展开的下拉面板**(spec §12.4 实测) ·
```css
.lg:hidden
.border-t.border-gold/10              /* D4=B → border-primary/10 */
.bg-background/95.backdrop-blur-2xl
.max-h-[70vh].overflow-y-auto
```

**布局** · 4 大类分组标题(Rajdhani 字体)+ 25 二级项 + 用户区固定底部(sally zhao + 退出)

### §1.6 字体 + 设计系统(D4=B 颜色保留)

| 元素 | aiipznt 实测 | QuanQn(D4=B 保留) |
|---|---|---|
| 主色 token | OKLCH 金色 `#eebc4a` | **Aurelian Dark 紫色** `var(--primary)` 不变 |
| 大标题字体 | **Orbitron** (FUNCTION MATRIX / WORKFLOW / AI+短视频+IP) | **Orbitron** ★ 切(已是 PRD-3 加的)|
| 副标题字体 | **Rajdhani** (一级菜单 dropdown 大类标题 / 移动端) | **Rajdhani** ★ 切 |
| 中文字体 | **Noto Sans SC** | **Noto Sans SC** ★ 切 |
| 正文字体 | ui-sans-serif system | ui-sans-serif system 不变 |
| icons | **lucide-react** | lucide-react 已用 |
| toast | **sonner** position=bottom-right | sonner ★ 切位置 |
| 入场动画 | framer-motion `opacity/transform` (step 卡 / FUNCTION MATRIX 卡 hover) | framer-motion ★ 加 |
| 跳动小圆点 | `animate-ping` 金色 | `animate-ping` `bg-primary-light` 紫色变体 |

---

## §2 32 SPA 路由完整 page DOM 实测(每行 1 page)

> **格式** · `[路由]` · H1 / H数 / Button数 / Input数 / Total Elements / 关键 button(top 6) / 关键 input(top 3) / QuanQn 现状 + Diff

### §2.1 公开 + 主流程导航(3 page)

#### `/` 首页(00-home)
- **H1** · `AI+短视频+IP` (Orbitron 巨大金色 outline)
- **H** · 24 (H1×1 + H2×4 + H3×4 + H4×15)
- **Buttons** · 40 · `启动智能分析→/step/1` `使用说明→/guide` `查看IP方案→/ip-plan` `选择行业→/step/1` `账号包装→/step/3` `继续→/step/{下一未完成}` ...
- **Inputs** · 0
- **Total els** · 671
- **关键结构** ·
  - Hero · H1 + 3 副标题(`OPC全案落地，从流量到成交` / `AI+短视频+IP` / `全链路变现`)+ 引用副标 + 主 CTA `[启动智能分析]`(金色 gradient) + 次 CTA `[使用说明]`(outline)
  - 我的IP打造进度 · H2 + 9 步进度条 + "已完成 N / 9" + 9 步导航 button(每步 1 个 → 对应 /step/X)+ 「继续」button(动态跳第一个未完成 step)+ "查看IP方案 → /ip-plan"
  - FUNCTION MATRIX(Orbitron 大标题)· 4 H3 分组 + **15 卡(spec §6.2 漏 1)** ·
    - **市场洞察 3** · 全网爆款库 / 爆款文案解析 / 爆款呈现形式
    - **变现设计 2** · IP变现模型 / 私域成交流程
    - **内容创作 5** · 爆款元素生成 / AI智能生成 / 文案结构分析 / 短视频制作 / 获客型视频
    - **智能工具 4** · 一键生成视频 / 语音对话 / 深度学习 / 方法论知识库
    - **footer 1** · 使用说明(单独一张 · 在 4 H3 之外)
  - WORKFLOW(Orbitron 大标题)· 7 步系统化流程图(选行业→变现设计→学爆款→生成文案→制作视频→私域转化)
  - READY TO START? · 主 CTA "立即启动 → /step/1"
- **QuanQn 现状** · ❌ **完全没有**(`/` redirect → `/step/1`)
- **Diff** · 全新建首页 · ★ PRD-16 核心 1 个 US

#### `/guide` 使用说明(01-guide)
- **H1** · `USER GUIDE` (Orbitron)
- **H** · 20 (H1×1 + H2×1 + H3×3 + H4×15)
- **Buttons** · 20 · 13 模块卡 + Header
- **Inputs** · 1 · `搜索功能说明...`
- **Total els** · 437
- **关键结构** ·
  - H1 USER GUIDE + 副标 "产品使用说明 · 功能详解 · 最佳实践"
  - H2 推荐使用流程 · 5 step 横排 [深度学习] → [设计变现] → [创作内容] → [制作视频] → [私域成交]
  - H3 系统概览 · 3 个 H4 卡(什么是AIP智能体 / 核心定位 / 使用前准备)
  - 实用技巧 提示框
  - **13 模块详解卡片**(可点击展开详细使用步骤) · 同 §10.0 §6.2 14 工具(去掉 14 呈现形式 + 加 1 爆款解析)
  - FAQ 5 问 5 答(spec §9.1 已记录)
  - 顶部搜索框 input
- **QuanQn 现状** · ❌ **完全没有**
- **Diff** · 全新建 /guide page · ★ PRD-16 第 2 核心 US

#### `/ip-plan` 我的IP方案(02-ip-plan)
- **H1** · `我的IP方案`(`lucide-file-text` 金色 icon mr-2)· `text-3xl font-bold` Orbitron
- **H** · 10 (H1×1 + H3×9)· 9 H3 = 9 step 名称(行业选择 / 账号包装 / 人设定制 / 执行计划 / 变现路径 / 爆款选题 / 拍摄计划 / 文案生成 / 直播策划)
- **Buttons** · 29 · `返回首页 → /` × 2 + `刷新` + 9 个 `查看详情 → /step/X` + 其他
- **Inputs** · 0
- **Total els** · 315
- **关键结构** ·
  - 顶部 ·  `[← 返回首页]` button(灰)+ H1 + 副标 `已完成 N / 9 步` + `[↻ 刷新]` button(金色 outline)
  - 进度卡 · `glass-card` 容器 + `IP打造进度 N%` + 横向进度条(`bg-gradient-to-r from-gold to-gold-dark` · D4=B → primary 紫色 gradient)
  - 9 步卡片网格 · 每卡 emoji + 步骤名 + 状态(已完成/未完成)+ "数据已保存" hint + `[查看详情 → /step/X]` button
- **QuanQn 现状** · ⚠️ 只有 `<StepProgress>` + skeleton · **无 H1 + 9 step 卡片网格 + glass-card 进度卡**
- **Diff** · 重写 IpPlan.tsx · ★ PRD-16 第 3 核心 US

### §2.2 9 步主流程(11 page · spec §7 已写 SOP · 本 dump 补 DOM 数)

| Step | H1 | H数 | Btns | Inputs | Els | QuanQn 现状 | Diff |
|:-:|---|:-:|:-:|:-:|:-:|---|---|
| `/step/1` | 选择你的行业赛道 | 1 | 71 | 1 | 313 | ⚠️ StepForm 通用 + IndustryDropdown · 无 56 卡 emoji 双行 + 6 tab + 已选状态 + 自定义 modal | ★ 重写 PRD-17 |
| `/step/3` | 账号包装方案 | 8 | 24 | 3 | 606 | ⚠️ StepForm 通用 · 无 textarea + 5 平台 radio + 6 H3 输出区 | ★ 重写 PRD-17 |
| `/step/3b` | 人设定制方案 | 7 | 14 | 4 | 450 | ⚠️ StepForm 通用 · 无 多 textarea + 6 H3 输出区 | ★ 重写 PRD-17 |
| `/step/4` | 执行计划 | 1 | 12 | 3 | 134 | ⚠️ StepForm 通用 · 无 3 input/textarea(粉丝量/目标/情况) | ★ 重写 PRD-18 |
| `/step/4b` | 变现路径 | 8 | 9 | 4 | 464 | ⚠️ StepForm 通用 · 无 3 阶梯输出 + 收入结构 + 成功案例 | ★ 重写 PRD-18 |
| `/step/5` | 爆款选题库 | 1 | 7 | 4 | 147 | ⚠️ StepForm 通用 · 无 行业/产品 input + 2 file upload | ★ 重写 PRD-18 |
| `/step/6` | 拍摄计划 | 1 | 7 | 1 | 116 | ⚠️ StepForm 通用 · 无 textarea(粘贴文案 · 至少10字) + 跳 step7 提示 | ★ 重写 PRD-18 |
| `/step/7` | 文案生成 | 11 | 53 | 3 | 333 | ⚠️ StepForm 通用 · 无 脚本类型搜索 + 22 爆款元素多选 + 4 H4(话题抛出/正方/反方/我的立场) | ★ 重写 PRD-18 |
| `/step/8` | 直播策划 | 3 | 16 | 4 | 158 | ⚠️ StepForm 通用 · 无 2 子功能(生成方案 / AI优化话术) | ★ 重写 PRD-18 |

**关键 input 清单(原文)** ·
- step3 textarea · `详细描述你的个人背景、专业技能、从业经验、擅长领域、个人特点等。\n\n示例：我是一名有10年经验的美容师...`
- step3b textarea×2 · `详细描述你的个人背景...` + `你有什么独特的优势？比如：独特的经历、专业证书、成功案例、个人特质...` + `分享你的个人故事：为什么做这个行业？...`
- step4 textarea · `描述你的情况，比如：\n- 每天可投入2小时\n- 有实体店/线上课程\n- 擅长口播/拍摄`
- step4b textarea · `描述你的产品或服务，比如：\n- 美容院皮肤管理项目，客单价500-3000元\n- 线上知识付费课程，定价199-999元`
- step5 input × 2 + file × 2(占位 `例如：美业、餐饮、教育培训、服装...` + `例如：皮肤管理项目、火锅加盟、英语培训课...`)
- step6 textarea · `粘贴你的短视频文案（至少10个字），AI将基于文案生成完整的拍摄计划。\n\n你可以使用第七步「文案生成」功能先生成文案，再来这里生成拍摄计划。`
- step7 input · `搜索脚本...` + textarea · `输入你的文案主题，如：美容院如何用抖音获客100个精准客户...` + input · `输入优化方向（可选），如：更有吸引力、增加互动感、更口语化...`
- step8 textarea × 2(产品描述 + 直播话术) + input × 2(目标受众 + 优化目标)

### §2.3 14 工具 page(14 page · spec §8 已写 SOP · 本 dump 补 DOM 数)

| 工具 | H1 | H数 | Btns | Inputs | Els | QuanQn 现状 | Diff |
|:-:|---|:-:|:-:|:-:|:-:|---|---|
| `/trending` | 全网爆款库 | 1 | 9 | 2 | 934 | ✅ PRD-15 US-006 完整化 · 验证对齐度 | 🟡 验证视觉精度 PRD-19 |
| `/video-analysis` | 爆款文案解析 | 1 | 7 | 2 | 119 | ⚠️ stub 未触 | ★ 完整化 PRD-19 |
| `/present-styles` | 爆款呈现形式合集 | 15 | 6 | 0 | 251 | ✅ PRD-15 US-004 双 stub 合并 · 验证对齐 | 🟡 验证 PRD-19 |
| `/monetization` | IP变现模型定制 | 1 | 8 | 3 | 126 | ✅ PRD-15 US-004 双 stub 合并 · 验证对齐 | 🟡 验证 PRD-19 |
| `/private-domain` | 私域成交流程 | 1 | 13 | 3 | 169 | ✅ PRD-15 US-005 完整化 · 验证对齐 | 🟡 验证 PRD-19 |
| `/boom-generate` | 爆款元素自动生成 | 3 | 30 | 2 | 184 | ⚠️ stub 未触 · H3 选择爆款元素(可多选)+ 22 元素 | ★ 完整化 PRD-19 |
| `/generate` | 生成爆款文案 | 1 | 50 | 1 | 266 | ⚠️ stub 未触 · 50 button = 多脚本类型 + 多生成 + 历史 | ★ 完整化 PRD-19 |
| `/analysis` | 文案结构分析 | 1 | 7 | 1 | 105 | ⚠️ stub 未触 · 简单 textarea 输入 | ★ 完整化 PRD-19 |
| `/video-production` | 短视频一键制作 | 1 | 7 | 1 | 110 | ⚠️ stub 未触 · 简单 textarea 输入 | ★ 完整化 PRD-19 |
| `/acquisition-video` | 获客型视频制作 | 1 | 8 | 2 | 124 | ⚠️ stub 未触 · 客户画像 + 核心卖点 双 textarea | ★ 完整化 PRD-19 |
| `/ai-video` | STORYBOARD | 2 | 18 | 1 | 191 | ⚠️ stub 未触 · H3 专业分镜表生成器 + 一键生成 | ★ 完整化 PRD-19 |
| `/voice-chat` | VOICE CHAT | 2 | 12 | 1 | 155 | ⚠️ stub 未触 · H3 你的专属IP变现顾问 + 语音输入 | ★ 完整化 PRD-19 |
| `/deep-learning` | 文案深度学习 | 2 | 11 | 2 | 180 | ✅ PRD-15 US-003 完整化 · 验证对齐 | 🟡 验证 PRD-19 |
| `/knowledge` | AIP文案方法论 | 1 | 30 | 1 | 647 | ⚠️ stub 未触 · 30 button = 多种脚本类型卡 + 搜索 input | ★ 完整化 PRD-19 |
| `/copywriting` | (从 step7 引出) | - | - | - | - | ✅ PRD-15 US-002 完整化(独立路由 · 不在 aiipznt 32 路由) | - |

### §2.4 6 modules + 1 衍生 page(6 page · 部分 PRD-15 已加)

| 模块 | H1 | H数 | Btns | Inputs | Els | QuanQn 现状 | Diff |
|:-:|---|:-:|:-:|:-:|:-:|---|---|
| `/diagnosis` | 7维度IP诊断报告 | 1 | 12 | 2 | 146 | ⚠️ stub 未触 · 行业 input + 产品 input | ★ 完整化 PRD-19 |
| `/daily-tasks` | 今日行动清单 | 4 | 8 | 0 | 190 | ⚠️ stub 未触 · 3 H3 任务卡 | ★ 完整化 PRD-19 |
| `/evolution` | 智能体进化中心 | 6 | 9 | 0 | 242 | ⚠️ stub 未触 · 5 H3(进化等级 / 进化洞察 / 最近反馈 / 深度学习档案 / 进化设置) | ★ 完整化 PRD-19 |
| `/accounts` | IP账号管理 | 2 | 7 | 0 | 145 | ⚠️ stub 未触 · H3 赵语AI(当前账号卡)+ 新建账号 modal | ★ 完整化 PRD-19 |
| `/my-topics` | 我的选题库 | 1 | 16 | 1 | 165 | ✅ PRD-15 US-007 完整化 · 验证对齐 | 🟡 验证 PRD-19 |
| `/history` | 历史记录 | 1 | 6 | 0 | 207 | ✅ PRD-15 US-008 完整化 · 验证对齐 | 🟡 验证 PRD-19 |

---

## §3 跟 spec §6.2 / §7.x / §8.x 实测校准点(以 dump 为准)

### Diff 1 · 首页 H1

- spec §6.1 写 `<h1>从流量到成交</h1>`
- **实测** · H1 是 `AI+短视频+IP`(巨大金色 outline · Orbitron) · `从流量到成交` 是副标题之一(spec §6.1 line 1110 描述对 · 但 H1 ≠ 副标题)
- **修正** · 第一个 hero H1 用 `AI+短视频+IP`

### Diff 2 · 首页 FUNCTION MATRIX 卡数

- spec §6.2 line 1136-1156 列 14 卡 · 4 H3 分组(市场洞察 3 / 变现设计 2 / 内容创作 5 / 智能工具 4)
- **实测** · 是 14 + 1 使用说明 = **15 卡** · 使用说明卡在 4 H3 之外的 footer 区
- **修正** · 加 1 卡 "使用说明" → /guide(在 footer 区)

### Diff 3 · Step1 行业 tab 数

- spec §7.1 line 1235 写 5 大类 tab `🏠 生活服务 (18) / 🛒 电商零售 (13) / ✍️ 内容创作 (7) / 💼 专业服务 (14) / 🏭 产业制造 (4)`
- **实测** · 实际是 **6 tab**(`全部行业 (56)` + 5 大类)
- **修正** · 第一 tab 必须是 `全部行业 (56)`(默认选中)

### Diff 4 · /ip-plan H1 + icon

- spec §9.2 写 `H1: 我的 IP 方案` + `[返回首页]` `[刷新]` 按钮
- **实测** · H1 文字是 `我的IP方案`(无空格 · 跟 spec §9.2 line 2734 写法一致 · 但 §6.2 line 1130 写 `[查看IP方案 → /ip-plan]` 也是无空格 · 一致)
- **修正** · 无歧义 · 用 `我的IP方案`(无空格)

### Diff 5 · /step/3 页面区块结构

- spec §7.2 line 1278 写 4 input + 3 button + 结果区
- **实测** · 8 H 标签(H1 + 7 H3)· 7 H3 = 8 个输出区(账号包装方案 / 视频参考案例 / 昵称推荐 / 头像设计方案 / 背景图设计方案 / 简介文案方案 / 整体包装策略)
- **修正** · 输出区分 7 个 H3 分块 · 每块独立 `[复制]` `[重新生成]` button

### Diff 6 · /knowledge 工具实际 30 button

- spec §10.x 没列 /knowledge 详细 button · 推测是简单文档
- **实测** · 30 button = 多种脚本类型卡(可点击展开)+ 1 search input · 类似 /step/7 文案生成的脚本选择
- **修正** · /knowledge 是文案方法论库 · 含 N 张方法论卡片(类似 §22 14 呈现形式 layout)

---

## §4 PRD-16 ~ PRD-19 拆分建议(基于 §2 page diff 优先级)

### PRD-16 · 首页 + Header + 设计系统切换 + /guide(8-10 US · 1.5-2 周)

> **范围** · 跟 aiipznt 完全不一致的 4 件事 · 没法增量 · 只能新建 / 重构

- US-001 ★ foundation · 设计系统切换 · `tokens.css` 加 Orbitron / Rajdhani / Noto Sans SC 字体导入 + `tailwind.config` font-display family + spacing scale 校准 + animate-ping 紫色变体 · **颜色保留 Aurelian Dark 紫(D4=B)**
- US-002 high · `/` 首页 Hero 区 · H1 "AI+短视频+IP"(Orbitron 巨大金色 → 紫色 outline) + 3 副标题 + 2 CTA(`启动智能分析→/step/1` / `使用说明→/guide`) + 引用副标
- US-003 high · 首页 "我的IP打造进度" 9 步进度区 · `glass-card` + 9 step 进度条 + 9 step 导航 button + 「继续」动态跳第一未完成 step + `查看IP方案→/ip-plan`
- US-004 high+large · 首页 FUNCTION MATRIX(Orbitron 大标题)· 4 H3 分组(市场洞察 3 / 变现设计 2 / 内容创作 5 / 智能工具 4)+ **15 工具卡(含 footer 使用说明)** · 每卡 hover `border-primary/30` + 跳转
- US-005 medium · 首页 WORKFLOW 7 步流程图(Orbitron 大标题)· 选行业→变现设计→学爆款→生成文案→制作视频→私域转化
- US-006 medium · 首页 "READY TO START?" CTA 区
- US-007 ★ high · Header 重构 · 4 一级菜单 click 触发 dropdown(创作 5 / 策划 8 / 智能 6 / 更多 6 共 25 二级项)· 严格按 §1.2 实测映射
- US-008 medium · 「赵语AI」IP 账号切换器 dropdown(`bg-secondary/50 border-primary/15` · D4=B 紫色变体)+ sally zhao chip + animate-ping 紫色跳动小圆点 + 登出 icon-only(无确认)
- US-009 medium · `/guide` page (USER GUIDE) · H1 + 5 步推荐流程 + 系统概览 3 卡 + **13 模块详解卡** + FAQ 5 + 顶部 search input
- US-010 medium · `/ip-plan` page 重写 · `[返回首页]` + H1 + 副标 `已完成 N / 9 步` + `[↻ 刷新]` + glass-card 进度条 + 9 step 卡片网格(`查看详情→/step/X`)
- US-011 收官 · `verify-prd-16.sh` + 4 e2e flows(home / guide / ip-plan / header-dropdown)+ visual diff with `/tmp/aiipznt-clone-research/screenshots/00-home.png` 等

### PRD-17 · Step 1 / 3 / 3b 完整化(8-10 US · 2 周)

- US-001~004 · Step 1 · 6 tab(`全部行业(56)` + 5 大类)+ 56 行业 emoji 双行卡 5 列网格 + search input + 已选状态卡 + `[自定义输入行业]` modal + `[确认并进入下一步→/step/3]`
- US-005~007 · Step 3 · textarea(个人信息 必填)+ 5 平台 radio + 2 input(目标受众/账号情况)+ `[生成账号包装方案]` 主 CTA + 7 H3 输出区(包装方案/视频参考/昵称推荐/头像设计/背景图设计/简介文案/整体策略)+ 每 H3 独立 `[复制]` `[重新生成]` `[智能优化]` button
- US-008~010 · Step 3b · 多 textarea(个人背景/独特优势/个人故事)+ input(目标受众)+ `[生成人设定制方案]` + 6 H3 输出区(专属人设方案/核心身份定位/思想体系/内容人设/信任构建体系/人设打造路线图)
- US-011 收官 · verify + e2e

### PRD-18 · Step 4 / 4b / 5 / 6 / 7 / 8 完整化(10-12 US · 2.5 周)

- US-001~002 · Step 4 · 3 input(粉丝量/目标/情况)+ `[生成执行计划]`
- US-003~004 · Step 4b · textarea(产品/服务)+ 3 input(受众/人设/目标)+ 3 阶梯输出 H3(起步/发展/规模化)+ 收入结构 + 成功案例
- US-005~006 · Step 5 · 2 input(行业/产品)+ 2 file upload(参考资料)+ 爆款选题库列表
- US-007 · Step 6 · textarea(粘贴文案 ≥10 字)+ 跳 step7 提示 + 拍摄计划输出
- US-008~010 · Step 7 · search input + 22 爆款元素多选(spec §10 完整)+ 主 textarea + 优化方向 input + 4 H4 输出(话题抛出/正方/反方/我的立场)+ 53 button(脚本类型 + 元素 + 操作)
- US-011~012 · Step 8 · 2 H3(生成方案 / AI优化话术)· 各自独立 textarea + input + 输出
- US-013 收官 · verify + e2e

### PRD-19 · 14 工具完整化(剩余 8 stub · 跟 6 已 PRD-15 完成的 verify)+ 4 modules 完整化 + 视觉精修(10-12 US · 2-2.5 周)

- US-001~006 · 6 stub 工具完整化 · /video-analysis / /boom-generate (22 元素多选)/ /generate (50 button 多脚本)/ /analysis / /video-production / /acquisition-video (双 textarea 客户+卖点)
- US-007~008 · 2 high 工具 · /ai-video (STORYBOARD H1 + 分镜表生成器)/ /voice-chat (VOICE CHAT H1 + IP 变现顾问 + 语音输入)
- US-009 · /knowledge 完整化 · 多脚本类型卡 + search input + 类似 /present-styles 网格 layout
- US-010~011 · 4 modules 完整化 · /diagnosis (7维度报告)/ /daily-tasks (今日行动清单 H3 任务卡)/ /evolution (5 H3 进化中心)/ /accounts (IP账号管理 + 新建账号 modal)
- US-012 · 视觉精修 · animate-ping 紫色 / framer-motion step 卡入场 / sonner bottom-right / hover transition / 移动端 dropdown 面板
- US-013~014 · verify + 6 已完成工具回归(/trending / /present-styles / /monetization / /private-domain / /deep-learning / /my-topics / /history) + 全 32 page visual diff with screenshots

---

## §5 实施前置准备(写 PRD-16 seed 前必做)

### §5.1 抓取产物归档(已完成)

- ✅ `/tmp/aiipznt-clone-research/dump/` · 32 HTML(每个 ~400-700 KB)+ `_summary.json`(38 KB)
- ✅ `/tmp/aiipznt-clone-research/screenshots/` · 32 PNG fullPage 1440 宽

⚠️ **不进 git** · /tmp 第三方产物 · 只本 dump.md 进 git。Cookie 用完 · **请你立即在 aiipznt 浏览器手动 logout 让 cookie 失效**(防泄露)。

### §5.2 字体资源准备(US-001 必依赖)

需要在 PRD-16 US-001 加 ·
```html
<!-- index.html head -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@500;600;700&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
```

### §5.3 SVG icons 资源(可选 PRD-16+)

aiipznt logo "AIP / AGENT" 双行金色 + 金色方块图标 · 我们用文字 + lucide-react 即可 · 不需要复刻 SVG。

### §5.4 第二轮抓取(可选 · 如需 dropdown 弹层 DOM)

如果 PRD-16 US-007 实施时需要看 dropdown 弹层的真实 DOM(我们已有 spec §12.1 实测 · 应该够)· 可跑 ·
```bash
# 在 /tmp/aiipznt-clone-research/scripts/ 加 scrape-interact.mjs
# click 4 一级菜单 + 截图 dropdown + dump dropdown HTML
```

我现在不跑 · 等 US-007 实施时如有需求再补。

---

## §6 风险红线 + 决策落锁

### §6.1 红线 5 条

1. ❌ **不切金色 OKLCH**(D4=B)· 所有 `var(--gold)` `border-gold/15` 等替换为 `var(--primary)` `border-primary/15`(Aurelian Dark 紫色)
2. ❌ **不删 PRD-15 已完成的 6 工具 + 2 衍生页**(/copywriting / /deep-learning / /monetization / /present-styles / /private-domain / /trending / /my-topics / /history)· PRD-19 仅 verify 视觉对齐 · 不重做
3. ❌ **不动 admin**(D3=A)· `apps/admin/` 完全 0 触动
4. ❌ **不重写 backend tRPC + DB schema** · 仅 frontend 重构 · 全 14 PRD backend 沉淀保留
5. ❌ **不绕过 Audit Gate** · PRD-16~19 严格走 ralph + 4 维度 audit

### §6.2 D1+D4 组合的精确语义(再次锁)

| 维度 | 切 / 不切 |
|---|:-:|
| 整体页面布局(layout / 区块顺序 / 区块尺寸) | ✅ **切 1:1** |
| spacing scale | ✅ **切** |
| 字体 family + weight(Orbitron / Rajdhani / Noto Sans SC) | ✅ **切** |
| motion(framer-motion / animate-ping / transition) | ✅ **切** |
| SVG icons / lucide-react | ✅ **切**(已 95% 一致) |
| 卡片 hover 效果 + dropdown 浮层结构 | ✅ **切** |
| **颜色 token**(primary / accent / background / border / shadow) | ❌ **不切 · 保留 Aurelian Dark 紫** |
| 图表 5 色 | ❌ **不切 · 保留 Aurelian Dark 紫色变体** |

---

## §7 下一步(等你 review 本 dump.md 后开干)

1. **你 review 本 dump.md** · 看 §2 32 page Diff 优先级是否符合预期 / §4 PRD-16~19 拆分是否合理 / §6 红线锁是否到位
2. **同意后** → 我立即写 `tasks/prd-16.md` seed(1500-2000 行 · 跟 PRD-15 1216 行同详细度 · 8-10 US + Locked Decisions D-130~D-140 等延续 PRD-15 D-129)
3. **然后** → ralph skill 转 `prd.json` + plan-check + ralph daemon 跑 PRD-16
4. **PRD-16 收官后** → PRD-17/18/19 同节奏(每 2-3 周一个 PRD · 总 8-10 周完工)

> **本 dump 由 Opus 4.7 在 2026-05-16 BJT 写 · 32 page DOM 实测产物 · 跟 aiipznt-spec.md 互补(spec 是设计 · dump 是实测)· 两份文档以 dump 为准**
