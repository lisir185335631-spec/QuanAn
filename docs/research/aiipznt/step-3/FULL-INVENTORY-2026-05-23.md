# /step/3 真实 sub-feature 全清单(基于用户 2026-05-23 提供完整截图)

> **数据源** · `screenshots/user-provided-full-1440.png`(4.1 MB · sally zhao 实际 default state · 已生成内容显示)
> **生成** · 2026-05-23 BJT · Opus 4.7
> **跟之前 spike 对比** · spike 估 9 H3 / 9 US · **实际 30+ sub-feature / 13 US** · spike 严重低估
> **目的** · 给 PRD-29 真实范围打基础 · 同样方法推广全 25 二级 nav page

---

## §0 顶层 layout 结构(从上到下)

```
Header(64px sticky)
  Logo · 4 一级 dropdown · AccountSwitcher · UserChip · Logout
  ─────────────────────────────────────────────────────
PageHeader 区
  Breadcrumb: STEP 03 › 账号包装方案
  H1: ✨ 账号包装方案(Orbitron 巨大金色 · sparkle prefix icon)
  Subtitle: 当前行业:美业。 输入你的个人信息...(含「美业」金色高亮)
  ─────────────────────────────────────────────────────
Form 区(glass-card 暗背景 rounded · 大约 1100px 高)
  textarea: 你的个人信息 *(必填 · sally 填了真实业务描述)
  5 平台 button radio(抖音 active 金色 · 小红书 / 视频号 / 快手 / B站)
  双列:目标受众(可选)input + 现有账号情况(可选)input
  主 CTA: [✨ 生成账号包装方案](大金色 gradient · 单行)
  右侧: [⟲ 重新生成](outline)
  ─────────────────────────────────────────────────────
H2 分隔标题:账号包装方案
  右侧 toolbar: [★ 智能优化] [⟲ 一键重新生成] [复制全部]
  ─────────────────────────────────────────────────────
H3 #1: 视频参考案例(火焰 icon)+ 右侧 [生成参考图] button
  ★ 2 子卡 grid 2 列:
    左卡: 美业头部账号主页参考 · description + search hint
    右卡: 高转化率账号包装案例 · description + search hint
  + 多个 anchor sub-section(爆款简介文案参考 等)
  ─────────────────────────────────────────────────────
H3 #2: 昵称推荐(火焰 icon)+ 右侧 [生成参考图] button
  ★ 5 个备选昵称 sub-card(每个独立卡):
    #1 智能体老王 ✨
      含:emoji + name + 详细 evaluation 段 + 心理学依据 + 搜索友好度 + 含义解析
      底部:多 chip tag(行业关键词)
    #2 PK定制师老高 ✨(同结构)
    #3 智能体架构师姚(同结构)
    #4 真老板的智能体(同结构 · 无 ✨)
    #5 PA翻译图老王 ✨(同结构)
  ★ 选择策略 sub-section:灰色提示文字 + chip tag
  ─────────────────────────────────────────────────────
H3 #3: 头像设计方案(火焰 icon)
  ★ 8+ sub-section 段:
    1. 专业、自信(风格建议)
    2. 配色方案
    3. 主色调
    4. 辅色调
    5. 心理学依据
    6. 表情/姿态
    7. 服装/造型
    8. 背景设计
  ★ 参考图样例 sub-card:
    空 placeholder 框 + [查看图标] button
  ─────────────────────────────────────────────────────
H3 #4: 背景图设计方案(火焰 icon)+ 右侧 [生成参考图] button
  ★ 7+ sub-section 段:
    1. 风格理念
    2. 布局结构
    3. 色调
    4. 主色调
    5. 辅色调
    6. 品牌元素
    7. 字体/icon
    8. 分镜建议
  ★ 设计参考图区:
    3 平台横向 column grid · 抖音 / 小红书 / 视频号
    每 column 独立 card + 平台标题 + 空 placeholder
  ─────────────────────────────────────────────────────
H3 #5: 简介文案方案(火焰 icon)
  ★ 简介公式 sub-section(灰色 text · 公式 markdown 显示)
  ★ 6 个 platform 子卡(每个独立 card · 内含完整文案):
    #1 抖音(主号:专业人设号)
       标题 + 长简介文案(textarea-like)+ N hashtag chip + 评估文字 + [复制]
    #2 抖音(副号:生活记录号)(同结构)
    #3 小红书(笔记:干货博主号)(同结构)
    #4 小红书(笔记:个人IP号)(同结构)
    #5 视频号(主号:品质创业号)(同结构)
    #6 视频号(副号:个人生活号)(同结构)
  ─────────────────────────────────────────────────────
H3 #6: 整体包装策略(火焰 icon)
  ★ 4+ strategic sub-section:
    1. 视觉统一性
    2. 第一印象设计
    3. 内容封面与简介公益策略
    4. 内容创意建议
  (无 button · 纯 strategic recommendation)
  ─────────────────────────────────────────────────────
右下角浮动:[💡 Made with Manus] badge(不复刻)
```

---

## §1 sub-feature 全清单(按 component 维度 · 30 项)

### §1.1 Form 区(9 项)

| # | sub-feature | 状态(QuanAn) | 复杂度 |
|:-:|---|:-:|:-:|
| 1 | textarea 个人信息(必填 · 大区域)| 🟡 有 textarea · placeholder drift | low |
| 2 | 5 平台 emoji radio(active 金色 bg)| ❌ 缺 emoji 字段 · 缺 active 金色 state | medium |
| 3 | 目标受众 input | 🟡 有 · placeholder drift | low |
| 4 | 现有账号情况 input | 🟡 有 · placeholder drift | low |
| 5 | 主 CTA `[✨ 生成账号包装方案]` 金色 gradient + sparkle icon | ❌ 缺 sparkle icon · 字面 drift(`进入 IP 定位 →`)· 缺 gradient | medium |
| 6 | 右侧 `[⟲ 重新生成]` outline button | ❌ 缺 | low |
| 7 | H2 分隔标题 `账号包装方案`(火焰 icon prefix) | ❌ 缺 H2 + icon | low |
| 8 | H2 右侧 toolbar 3 button(`★ 智能优化` / `⟲ 一键重新生成` / `复制全部`) | ❌ 缺 | medium |
| 9 | H2 toolbar `[★ 智能优化]` button(单独 · 因为是 mutation) | 同 8 | - |

### §1.2 视频参考案例 H3(3 项)

| # | sub-feature | 状态 | 复杂度 |
|:-:|---|:-:|:-:|
| 10 | H3 title `视频参考案例` + 火焰 icon prefix + 右侧 `[生成参考图]` button | ❌ 缺 H3 | low |
| 11 | 2 子卡 grid 2 列 · 左卡 `美业头部账号主页参考` + 右卡 `高转化率账号包装案例` · 各含 description + search hint | ❌ 缺 sub-card | medium |
| 12 | 各子卡 chip tag(平台 / 搜索关键词)| ❌ 缺 | low |

### §1.3 昵称推荐 H3(★ 重点 · 8 项)

| # | sub-feature | 状态 | 复杂度 |
|:-:|---|:-:|:-:|
| 13 | H3 title `昵称推荐` + 火焰 icon | ❌ 缺 | low |
| 14 | 5 备选昵称 sub-card grid (每个独立卡) | ❌ 缺 | **high** |
| 14a | 卡:`智能体老王 ✨` + evaluation + 心理学依据 + 搜索友好度 + chip tag | ❌ | - |
| 14b | 卡:`PK定制师老高 ✨` 同结构 | ❌ | - |
| 14c | 卡:`智能体架构师姚` 同结构 | ❌ | - |
| 14d | 卡:`真老板的智能体` 同结构 | ❌ | - |
| 14e | 卡:`PA翻译图老王 ✨` 同结构 | ❌ | - |
| 15 | 选择策略 sub-section(末尾灰色提示 + chip tag) | ❌ 缺 | low |

### §1.4 头像设计方案 H3(★ 大 · 9 项)

| # | sub-feature | 状态 | 复杂度 |
|:-:|---|:-:|:-:|
| 16 | H3 title `头像设计方案` + 火焰 icon | ❌ 缺 | low |
| 17 | 8 sub-section block(风格 / 配色 / 主色调 / 辅色调 / 心理学依据 / 表情 / 服装 / 背景设计) | ❌ 缺 | **high** |
| 18 | ★ 参考图样例 sub-card(空 placeholder + `[查看图标]` button) | ❌ 缺 | medium |

### §1.5 背景图设计方案 H3(★ 极大 · 9 项)

| # | sub-feature | 状态 | 复杂度 |
|:-:|---|:-:|:-:|
| 19 | H3 title `背景图设计方案` + 火焰 icon + 右侧 `[生成参考图]` button | ❌ 缺 | low |
| 20 | 7 sub-section block(风格理念 / 布局结构 / 色调 / 主色调 / 辅色调 / 品牌元素 / 字体icon / 分镜建议)| ❌ 缺 | **high** |
| 21 | ★ 设计参考图区 · 3 平台横向 column grid(抖音 / 小红书 / 视频号 各 1 column 含 placeholder) | ❌ 缺 | **high** |

### §1.6 简介文案方案 H3(★ 最大 · 8 项)

| # | sub-feature | 状态 | 复杂度 |
|:-:|---|:-:|:-:|
| 22 | H3 title `简介文案方案` + 火焰 icon | ❌ 缺 | low |
| 23 | ★ 简介公式 sub-section(灰色 markdown 公式显示) | ❌ 缺 | low |
| 24 | ★ 6 platform 子卡 grid: | ❌ 缺 | **high** |
| 24a | 卡:抖音(主号:专业人设号)+ 文案 + hashtag + 评估 + `[复制]` | ❌ | - |
| 24b | 卡:抖音(副号:生活记录号)同结构 | ❌ | - |
| 24c | 卡:小红书(笔记:干货博主号)同结构 | ❌ | - |
| 24d | 卡:小红书(笔记:个人IP号)同结构 | ❌ | - |
| 24e | 卡:视频号(主号:品质创业号)同结构 | ❌ | - |
| 24f | 卡:视频号(副号:个人生活号)同结构 | ❌ | - |

### §1.7 整体包装策略 H3(4 项)

| # | sub-feature | 状态 | 复杂度 |
|:-:|---|:-:|:-:|
| 25 | H3 title `整体包装策略` + 火焰 icon | ❌ 缺 | low |
| 26 | 4 strategic sub-section block(视觉统一性 / 第一印象设计 / 内容封面与简介公益策略 / 内容创意建议) | ❌ 缺 | medium |

### §1.8 PageHeader 装饰(4 项)

| # | sub-feature | 状态 | 复杂度 |
|:-:|---|:-:|:-:|
| 27 | breadcrumb `STEP 03 › 账号包装方案`(顶部 label-sm)| ❌ 可能没 | low |
| 28 | H1 `✨ 账号包装方案` sparkle icon prefix | ❌ 缺 sparkle | low |
| 29 | Subtitle 含「美业」金色高亮 span | ❌ 缺金色高亮 | low |

### §1.9 Page-level 行为(submit + loading + state mgmt)(1 项)

| # | sub-feature | 状态 | 复杂度 |
|:-:|---|:-:|:-:|
| 30 | submit 后 CTA 变 `[⟳ 深度分析中...]` + 显示 `AI 正在深度分析中` inline notification + 7 H3 区变 skeleton | ❌ | medium |

---

## §2 真实 US 拆分(13 US · 严格按 cloner SKILL.md "1 sub-component = 1 builder")

| US | 范围 | sub-feature # | risk | 估时 |
|:-:|---|:-:|:-:|:-:|
| 001 | ★ Foundation(token / fonts / emoji 字段 / 火焰 icon component / 公共 sub-card style)| - | foundation | 4-6h |
| 002 | Form 区:5 平台 emoji radio + active 金色 state + sparkle icon CTA + 重新生成 button | 1-6 | medium | 4-6h |
| 003 | PageHeader 装饰(breadcrumb + sparkle H1 + 美业 金色高亮 subtitle) + H2 分隔标题 + toolbar 3 button | 7-9, 27-29 | medium | 3-4h |
| 004 | 视频参考案例 H3 · 2 子卡 grid + chip tag | 10-12 | medium | 4h |
| 005 | 昵称推荐 H3 · 5 备选卡(每卡 evaluation + 心理学 + chip + ✨)+ 选择策略 sub-section | 13-15 | **high** | 8-10h |
| 006 | 头像设计方案 H3 · 8 sub-section + 参考图 placeholder + 查看图标 button | 16-18 | **high** | 6-8h |
| 007 | 背景图设计方案 H3 · 7 sub-section + 3 平台横向 column grid | 19-21 | **high** | 8-10h |
| 008 | 简介文案方案 H3 · 简介公式 + 6 platform 子卡(每卡含 文案 + hashtag + 评估 + 复制) | 22-24 | **high** | 10-12h |
| 009 | 整体包装策略 H3 · 4 strategic sub-section | 25-26 | medium | 3-4h |
| 010 | Step3 wrapper 重写 · wire 全部 sub-component + 双状态(已生成 / 生成中)+ tRPC subscription | 30 | **high** | 6-8h |
| 011 | submit loading state · CTA 变 `[⟳ 深度分析中]` + inline notification card + skeleton 7 H3 | 30 | medium | 3-4h |
| 012 | 字面对账 · 全 button label + placeholder + H 文字 严守 aiipznt verbatim | - | low | 2h |
| 013 | ★ 收官 verify · visual diff < 5% vs aiipznt baseline + e2e + Audit | - | foundation | 4h |

**总** · 13 US · 65-90h(若 ralph daemon 跑 · 1-2 周)

---

## §3 全 25 二级 nav page 推广估算(基于 /step/3 真实复杂度)

**假设** · 用 /step/3 复杂度 = average(中等估)· /trending 等 list-heavy page 更复杂 · /step/4 等 simple form page 略简单。

| 二级 nav 大类 | page 数 | 平均 sub-feature/page | 平均 US/page | 总 US |
|---|:-:|:-:|:-:|:-:|
| **创作 5** | /step/5 /step/7 /video-analysis /acquisition-video /present-styles | ~25 | ~10 | 50 |
| **策划 8** | /step/1 /step/3 /step/3b /step/4 /step/4b /step/6 /step/8 /private-domain | ~30 | ~13 | 104 |
| **智能 6** | /diagnosis /daily-tasks /ai-video /voice-chat /deep-learning /evolution | ~20 | ~10 | 60 |
| **更多 6** | /accounts /knowledge /guide /ip-plan /my-topics /history | ~25 | ~12 | 72 |
| **公开 3** | / /guide /ip-plan(部分跟「更多」重)| ~15 | ~8 | 24 |
| **合计** | 25-28 page | - | - | **~310 US** |

**Foundation 共享** · -10 US(token / fonts / emoji / 公共 sub-card / 火焰 icon 等一次性投入)

**净估** · **~300 US · 跨 5-7 PRD · 15-20 周(3.5-5 个月)** ralph daemon 全自动跑

---

## §4 真实工作量校准(跟之前估算的差距)

| 维度 | 之前 GAP-AUDIT 估 | spike 估 | **基于用户截图重估** | 差距 |
|---|:-:|:-:|:-:|:-:|
| /step/3 sub-feature 数 | "7 H3 缺" | "9 US" | **30 sub-feature · 13 US** | **3 倍低估** |
| 全 25 二级 nav 总 US | "13 US for PRD-29" | "~250 US" | **~300 US** | 之前 30 倍低估 |
| 总时长 | "2-3 周" | "5-6 周" | **15-20 周(3.5-5 个月)** | **3-7 倍低估** |

---

## §5 用户截图对比 spike 的关键漏抓维度

我 spike 漏抓的项 ·

| # | 漏抓项 | 影响 |
|:-:|---|---|
| 1 | H1 前 `✨` sparkle icon prefix | 视觉细节 · 1 字符差 |
| 2 | H3 前 火焰 🔥 icon prefix(所有 7 H3 都有) | 视觉细节 · 7 处 |
| 3 | 副标的 「美业」金色高亮 span | 视觉细节 · 用户业务感知关键 |
| 4 | H2 分隔标题 `账号包装方案` + 3 button toolbar | 整块缺失 |
| 5 | 视频参考案例的 2 子卡 grid 结构 | 整块缺失 |
| 6 | 昵称推荐 5 备选 sub-card(每卡 evaluation + 心理学)| 整块缺失 · 这是最重大遗漏 |
| 7 | 头像设计方案 8 sub-section 详细 | 整块缺失 |
| 8 | 背景图设计方案 3 平台横向 column grid | 整块缺失 |
| 9 | 简介文案方案 6 platform 子卡(各 hashtag + 评估)| 整块缺失 · 最大单 H3 复杂度 |
| 10 | 整体包装策略 4 strategic sub-section | 整块缺失 |
| 11 | submit loading state 的 inline notification + skeleton | 行为缺失 |
| 12 | 右侧 `[⟲ 重新生成]` button(form 区右侧 · 跟主 CTA 并排) | 整块缺失 |

**根因** · spike 用 element count(606)和 H3 count(7)做 heuristic · 但 H3 内部的 sub-section / sub-card 没枚举 · 致严重低估。

---

## §6 给用户的真实状况报告

### §6.1 spike 严重低估实证

- /step/3 真实 sub-feature = **30+ 项** (spike 估 9 · 3 倍低估)
- /step/3 真实 US = **13 US** (spike 估 9)
- 全 25 二级 nav page 总 US ≈ **300 US** (spike 估 ~110)
- 总工期 = **15-20 周** (spike 估 5-6 周)

### §6.2 工作量决策点

3-5 个月连续 ralph daemon 跑 · 单纯 LLM 成本估 ¥几万(每 US Opus audit + Sonnet dev ≈ ¥80-150)。需要用户决定:

- 路 A · 全做(15-20 周 · 完整 1:1)
- 路 B · 减范围(只做 5 核心 page · 4-6 周 · 部分 1:1)
- 路 C · 分批做(PRD-29 先做 1 page · 看效果 · 再批量)

### §6.3 推广方法(此 inventory 模板 · 同样应用全 25 page)

每 page 都跑 ·
1. 抓 fullPage 截图(我用 cookie 已可)
2. 用户提供完整页面 截图 / 实际访问 / 实际数据
3. 我 逐项列 sub-feature inventory(参本文 §1)
4. 拆 US(参本文 §2)
5. PRD-29~33 收纳

---

> **本 inventory 由 Opus 4.7 在 2026-05-23 BJT 基于用户提供完整截图重写 · 实证 spike 严重低估 · 推真实 PRD 范围 = ~300 US 跨 5-7 PRD · 等用户在 §6.2 3 选 1 决定**
