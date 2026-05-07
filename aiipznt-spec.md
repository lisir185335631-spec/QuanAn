# aiipznt.vip 完整产品规格 + 操作流程文档

> 复刻蓝图，基于 2026-05-05 全站抓取
> 源站：https://aiipznt.vip/  ·  抓取账号：sally zhao（acc_390012, beauty_industry）
> 原始数据：`~/Desktop/aiipznt-clone-research/`

---

## 〇 · 文档地图

| 章节 | 内容 |
|---|---|
| Ⅰ | 产品总览、定位、核心价值、目标用户 |
| Ⅱ | 技术架构、技术栈选型、数据持久化 |
| Ⅲ | **完整 tRPC API 50+ 路由 + 真实 Schema**（第三轮实测） |
| Ⅳ | 全局设计系统：色板、字体、组件库（建议先看 ⅩⅢ + ⅩⅨ 完整版） |
| Ⅴ | 全局布局：Header / 顶部导航 / 用户区 |
| Ⅵ | 首页详情 |
| Ⅶ | IP 打造主流程（9 步向导）·**含完整操作 SOP** |
| Ⅷ | 5 大类 20+ 独立功能模块详情 ·**含完整操作 SOP** |
| Ⅸ | 辅助页面（使用说明 / IP 方案查看 / 404） |
| Ⅹ | 核心方法论数据资产（20 脚本类型 / 22 爆款元素 / 14 呈现形式 / 56 行业 / 8 维度诊断） |
| Ⅺ | 复刻路线图建议 |
| Ⅻ | 第二轮补抓的动态 UI 细节（dropdown / toast / loading / mobile） |
| ⅩⅢ | Design System 基础（OKLCH + Tailwind v4 + glass-card + 6 自定义动画） |
| ⅩⅣ | **PWA + SEO + Service Worker**（manifest / sw.js / SEO 漏洞警告） |
| ⅩⅤ | **完整 Toast 文案库**（40+ 实测，含触发场景） |
| ⅩⅥ | **邀请码机制**（pendingInviteCode 完整流程 + 管理员后台） |
| ⅩⅦ | **完整路由清单 34 个**（含未上线 step9_review、admin /invite-manage） |
| ⅩⅧ | **React Router + 项目结构反编译**（来自 data-loc 实测路径） |
| ⅩⅨ | **CSS 深度补充**（断点 / 容器 / 5 色金渐变 / 全息扫描 / 霓虹下划线 / 光泽闪烁） |
| ⅩⅩ | **完整 Lucide 图标映射 68 个**（按页面/语义分类） |
| ⅩⅩⅠ | **Footer + 登录 + Onboarding + 11 个未登录态文案** |
| ⅩⅩⅡ | **tRPC 真实响应 Schema 16 endpoint**（含 Prisma schema 推断） |
| ⅩⅩⅢ | **键盘 / 滚动 / 拖拽 / 剪贴板 / Web Speech / a11y** |
| ⅩⅩⅣ | **危险操作弹窗**（AlertDialog 完整 + toast 文案库） |
| ⅩⅩⅤ | **业务边界**（无配额 / Manus 依赖剥离 / 文件上传规格 / Console 日志规范） |
| ⅩⅩⅥ | **修订 / 错误更正**（warmup/icebreak / accountName / boomElements 等） |
| ⅩⅩⅦ | **完整方法论数据库**（20 类脚本 67 案例 / 23 文案公式 / 22 元素心理学 / 14 呈现形式真实 key） |
| ⅩⅩⅧ | **CSS 极致深挖**（max-w 13 档 / 字号 10 档 / cubic-bezier 4 种 / :has 现代选择器 / @layer 5 层） |
| ⅩⅩⅨ | **每页元数据 + 布局变体表**（document.title 不动态 / H1 字号体系 / max-w-* 使用情况） |
| ⅩⅩⅩ | **HTTP 响应头 + 安全配置**（HSTS 1 年 + 5 个缺失安全头 + Cloudflare/Express/GCP 栈） |
| ⅩⅩⅪ | **真实数据范例库**（trending 25 条爆款 / scriptCases 67 案例 / step3-5 完整 sally 数据） |
| ⅩⅩⅫ | **业务规则 + 第五轮修正**（脚本 6 个 key 修正 / Cascade Delete / SEO 优化清单） |
| ⅩⅩⅩⅢ | **完整 npm 依赖清单 + React 组件树**（wouter / Streamdown / Button cva / 97 lazy chunks） |
| ⅩⅩⅩⅣ | **表单字段完整 specs**（maxLength 3 档 / IME 处理 / 校验文案映射） |
| ⅩⅩⅩⅤ | **UI Helpers 函数库**（数字/日期/头像/截断 - 全手写无第三方） |
| ⅩⅩⅩⅥ | **搜索/筛选/复制/导出**（朴素 includes / 5 类筛选 / Blob+BOM 下载） |
| ⅩⅩⅩⅦ | **错误处理 + ErrorBoundary**（retry:1 / Token 过期 / 401-500 区分） |
| ⅩⅩⅩⅧ | **移动端兼容 + 性能优化**（28 memo+56 useMemo+70 useCallback / 0 React.lazy / 移动端适配清单） |
| ⅩⅩⅩⅨ | **完整 data-* 属性 + window 全局**（11 种 data 属性 + window 干净）|
| ⅩⅬ | **React useState 初始值 + 全局常量**（10 个默认值 + **分镜表 13 列**）|
| ⅩⅬⅠ | **路由参数 + Deeplink**（wouter v3 + 无 query param + OAuth 流程） |
| ⅩⅬⅡ | **生产环境性能基线**（FCP 3.4s / 38 资源 / 577KB / Lighthouse 优化方向）|
| ⅩⅬⅢ | **OAuth + Streamdown + AI 流式**（**实测 AI 非流式 + Streamdown 是前端打字机模拟**）|
| ⅩⅬⅣ | **业务规则边界 + 修正**（**`demand` 不是 `discover` 二次修正** + scale desc / followerCount label 修正）|
| ⅩⅬⅤ | **完整文案库（按场景 i18n）**（9 空态 + 15 loading + 30+ placeholder + 80+ 按钮）|
| ⅩⅬⅥ | **Emoji + 视觉资产**（5 进化 + 22 元素 + 5 平台 + 56 行业 + 14 形式 lucide 映射）|
| ⅩⅬⅦ | **Markdown / Streamdown 完整规则**（react-markdown 配置 + 22 子组件 + 【标题】格式）|
| ⅩⅬⅧ | **Analytics 实际配置**（Plausible 6 特性 + Amplitude SDK + Manus Umami + 推荐 events）|
| ⅩⅬⅨ | **完整资源路径 + CSP**（9 域名清单 + 完整 CSP + 9 安全头 + preload 策略）|
| ⅼ | **业务正则 + 完整常量库**（30+ 常量 + 18 LS keys 命名规范 + 进化阈值）|

---

# Ⅰ · 产品总览

## 1.1 产品名

- **正式名**：AIP 全案获客操盘手 · OPC 全案落地，从流量到成交
- **简称**：AiIP / AIP 智能体 / AiIP 超级获客智能体
- **域名**：aiipznt.vip
- **PWA 桌面图标名**："AIP智能体"

## 1.2 产品定位

> AI 驱动全链路 IP 孵化与变现加速平台。覆盖同行分析、爆款文案生成、短视频分镜制作、私域成交流程、直播策划等 12 大核心功能，助力创业者一键爆款获客，实现 IP 变现千万级增长。

**Slogan**：「善用 AI，你一个人就是千军万马！」

## 1.3 核心价值主张

把"做 IP / 上短视频 / 私域成交"全链路拆成 **9 步标准化向导**，每一步用 AI 替用户完成专业活：
- 选什么行业 → 怎么包装账号 → 立什么人设 → 制定执行计划 → 设计变现 → 出选题 → 出拍摄方案 → 写文案 → 做直播
- 56 行业 × 22 爆款元素 × 20 种脚本 × 5 个平台（抖音/小红书/视频号/快手/B站）

## 1.4 目标用户

- **个人 IP 起号者**：刚开始做短视频但不知道怎么定位
- **OPC 创业者**（One Person Company）：单人公司想做内容获客
- **传统行业转型者**：实体店老板、培训师、咨询师等
- **MCN 机构 / 品牌方**：批量做账号、做矩阵的团队

## 1.5 商业模式（推测）

- 个人会员订阅（按月 / 按年）
- 算力消耗（生成每篇文案、每个分镜、每张图都会扣点）
- 团队版 / 企业定制
- 推荐分销

---

# Ⅱ · 技术架构

## 2.1 总体栈选型（前端）

| 层 | 技术 | 证据 |
|---|---|---|
| 渲染框架 | **React 18+** | `<div id="root">` 入口、SPA 客户端路由、bundle 中含 `react.transitional.element` Symbol |
| 路由 | **React Router v6** | URL 切换不刷新、可程序式 navigate |
| 构建工具 | **Vite** | bundle 命名 `index-B6zCgsAe.js` / `index-CQjJjGlX.css`（hash 风格 = Vite 默认） |
| CSS 框架 | **Tailwind CSS 3** | 类名密集出现 `flex items-center gap-2.5`、`px-3 py-2 rounded-lg`、`whitespace-nowrap` |
| UI 组件库 | **shadcn/ui** | 按钮典型类名 `inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium...` |
| 状态管理 | 推测 **Zustand** 或 **Jotai**（轻量，无 Redux 痕迹） | 无 redux devtools 痕迹 |
| 数据查询 | **tRPC client + React Query** | 所有 API 都走 `/api/trpc/xxx?batch=1&input=...` |
| 字体 | Google Fonts | Orbitron / Rajdhani / Noto Sans SC |
| 图标 | 推测 **lucide-react**（shadcn 默认搭档） | - |

## 2.2 后端栈选型

| 层 | 技术 | 证据 |
|---|---|---|
| API 协议 | **tRPC**（含 batch 模式） | 路径 `/api/trpc/auth.me,ipAccounts.active,stepData.get,...?batch=1` |
| Runtime | Node.js（Express / Fastify / Hono） | 所有 API 同源在 aiipznt.vip 下 |
| 数据库 | 推测 **PostgreSQL + Prisma**（tRPC 标准搭配） | - |
| 文件上传 | 支持 PDF / Word / TXT / Markdown / CSV，最大 20MB | 来自 step/5 + /deep-learning 的 file input |
| AI 模型 | 推测使用 OpenAI / Claude / 国产大模型 | 大量 AI 文本生成场景 |
| 视频生成 | 推测 Runway / Sora / 国产视频模型 | 仅生成"分镜表 + 提示词"，不直接生成视频成品 |
| 图片生成 | 接入 AI 图像 API | 头像参考图、背景图参考图都用 AI Prompt 生成 |

## 2.3 部署 / 平台

- **托管**：**Manus 平台**（manus.im）
  - 证据：`<MANUS-CONTENT-ROOT>` 自定义元素、`script id="manus-runtime"`、`files.manuscdn.com` CDN
  - **复刻可不依赖 Manus**：实际渲染层是标准 React，复刻时去掉 manus 标记即可
- **CDN**：自建 + Manus CDN
- **分析**：Manus Analytics (umami) + Plausible
- **PWA**：✅ 已配置 manifest.json + apple-touch-icon

## 2.4 前端目录推测（复刻参考）

```
src/
├── pages/
│   ├── Home.tsx                  # 首页
│   ├── Guide.tsx                 # /guide 使用说明
│   ├── IpPlan.tsx                # /ip-plan IP 方案进度
│   ├── steps/
│   │   ├── Step1Industry.tsx     # /step/1
│   │   ├── Step3Account.tsx      # /step/3
│   │   ├── Step3bPersona.tsx     # /step/3b
│   │   ├── Step4Execution.tsx    # /step/4
│   │   ├── Step4bMonetization.tsx# /step/4b
│   │   ├── Step5Topics.tsx       # /step/5
│   │   ├── Step6Shooting.tsx     # /step/6
│   │   ├── Step7Copywriting.tsx  # /step/7
│   │   └── Step8Livestream.tsx   # /step/8
│   ├── insight/
│   │   ├── Trending.tsx          # /trending
│   │   ├── VideoAnalysis.tsx     # /video-analysis
│   │   └── PresentStyles.tsx     # /present-styles
│   ├── monetize/
│   │   ├── Monetization.tsx      # /monetization
│   │   ├── PrivateDomain.tsx     # /private-domain
│   │   └── BoomGenerate.tsx      # /boom-generate
│   ├── create/
│   │   ├── Generate.tsx          # /generate
│   │   ├── Analysis.tsx          # /analysis
│   │   ├── VideoProduction.tsx   # /video-production
│   │   └── AcquisitionVideo.tsx  # /acquisition-video
│   ├── tools/
│   │   ├── AiVideo.tsx           # /ai-video
│   │   ├── VoiceChat.tsx         # /voice-chat
│   │   └── DeepLearning.tsx      # /deep-learning
│   └── Knowledge.tsx             # /knowledge
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── DropdownMenu.tsx
│   │   └── ZhaoyuAiButton.tsx    # 「赵语 AI」浮窗按钮
│   ├── ui/                       # shadcn 组件
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── card.tsx
│   │   ├── tabs.tsx
│   │   └── ...
│   └── shared/
│       ├── PlatformPicker.tsx    # 5 平台选择（抖音/小红书/视频号/快手/B站）
│       ├── IndustryPicker.tsx    # 56 行业选择
│       ├── HotElementsPicker.tsx # 22 爆款元素多选
│       ├── ScriptTypePicker.tsx  # 20 脚本类型单选
│       ├── ResultCard.tsx        # 通用结果卡片（带"复制"+"重新生成"+"AI优化")
│       ├── FileUpload.tsx        # PDF/Word/TXT/MD/CSV 通用上传
│       └── StepHeader.tsx        # "STEP 0X · 标题"
├── hooks/
│   ├── useStepData.ts            # 封装 tRPC stepData 读写
│   ├── useLocalMemory.ts         # localStorage 缓存层
│   └── useActiveAccount.ts
├── lib/
│   ├── trpc.ts
│   └── constants/
│       ├── industries.ts         # 56 行业 + 5 大类分组
│       ├── platforms.ts          # 5 平台
│       ├── scriptTypes.ts        # 20 脚本类型
│       ├── hotElements.ts        # 22 爆款元素 4 组
│       └── presentStyles.ts      # 14 呈现形式
└── App.tsx
```

---

# Ⅲ · 数据模型 / API

## 3.1 后端 tRPC API 路由（实测 50+ 全部）

> 第三轮深度抓取：从 `index-B6zCgsAe.js` bundle 反编译，**全部确认存在**。

### 1. 用户系统 (auth)

| Procedure | 用途 |
|---|---|
| `auth.me` | 取当前登录用户（含 role: 'user' \| 'admin'） |
| `auth.logout` | 登出 |

### 2. IP 账号管理 (ipAccounts)

| Procedure | 用途 |
|---|---|
| `ipAccounts.list` | 列出当前用户所有 IP 账号 |
| `ipAccounts.active` | 取活跃账号 |
| `ipAccounts.create` | 新建（3 步表单：基本信息 + 选择行业 + 详细配置） |
| `ipAccounts.update` | 更新 |
| `ipAccounts.delete` | 删除 |
| `ipAccounts.switchActive` | 切换活跃账号（**onSuccess 后整页 reload**） |

### 3. Step 系统 (stepData)

| Procedure | 用途 |
|---|---|
| `stepData.get` | 取单个 step 存档（含 stepKey） |
| `stepData.getAll` | 取该账号全部 step 存档 |
| `stepData.save` | 保存（mutation） |
| `stepData.progress` | 计算 IP 打造进度（N/9, 百分比） |

### 4. 文案 (copywriting)

| Procedure | 用途 |
|---|---|
| `copywriting.generate` | /step/7 生成文案（**结果是 markdown 字符串**） |
| `copywriting.optimize` | AI 优化文案 |
| `copywriting.list` | 历史记录列表（用于 /history） |
| `copywriting.delete` | 删除单条 |

### 5. 视频分析 (videoAnalysis)

| Procedure | 用途 |
|---|---|
| `videoAnalysis.analyze` | /video-analysis 解析爆款 |
| `videoAnalysis.rewrite` | 一键仿写 |

### 6. 视频制作类 (3 个 router)

| Procedure | 用途 |
|---|---|
| `videoProduction.generate` | /video-production 完整制作方案 |
| `acquisitionVideo.generate` | /acquisition-video 获客方案 |
| `aiVideo.generateStoryboard` | /ai-video 生成分镜表 |
| `aiVideo.generateSceneImage` | **每个分镜的场景图（AI 生图）** |

### 7. 文案/变现/私域

| Procedure | 用途 |
|---|---|
| `boomGenerate.generate` | /boom-generate 5 篇爆款文案 |
| `monetization.generate` | /monetization 变现模型 |
| `privateDomain.generate` | /private-domain 6 阶段话术 |

### 8. 诊断 (diagnosis)

| Procedure | 用途 |
|---|---|
| `diagnosis.generate` | 提交 8 步问卷 → 生成报告 |
| `diagnosis.history` | 历史诊断列表 |
| `diagnosis.latest` | 最近一次诊断 |

### 9. 进化系统 (evolution)

| Procedure | 用途 |
|---|---|
| `evolution.evolve` | 触发进化（点"触发进化"按钮） |
| `evolution.getConfig` | 取进化设置 |
| `evolution.updateConfig` | 修改进化设置（自动开关 / 方向） |
| `evolution.history` | 进化历史 |
| `evolution.recentFeedback` | 最近反馈列表 |
| `evolution.feedbackTrend` | 反馈趋势（图表用） |
| `evolution.moduleRanking` | 模块排名（哪个功能反馈最多） |

### 10. 深度学习 (deepLearning)

| Procedure | 用途 |
|---|---|
| `deepLearning.list` | 学习档案列表 |
| `deepLearning.create` | 粘贴文案创建 |
| `deepLearning.createFromFile` | 从文件创建 |
| `deepLearning.learn` | 触发学习（"开始深度学习"按钮） |
| `deepLearning.delete` | 删除档案 |

### 11. 知识库 (knowledge)

| Procedure | 用途 |
|---|---|
| `knowledge.getRecommendations` | 推荐 |
| `knowledge.getScriptCases` | 实战案例（每个脚本类型下的案例） |
| `knowledge.getFavorites` | 收藏列表 |
| `knowledge.addFavorite` | 收藏 |
| `knowledge.removeFavorite` | 取消收藏 |
| `knowledge.getNotes` | 笔记列表 |
| `knowledge.addNote` | 加笔记 |

### 12. 全网爆款 (trending)

| Procedure | 用途 |
|---|---|
| `trending.fetch` | 主动抓取最新爆款（"抓取最新爆款"按钮） |
| `trending.listByIndustry` | 按行业列出 |
| `trending.listByStyle` | 按呈现形式列出 |

### 13. 调用方式（实测代码片段）

```typescript
// 切换账号 - 注意 reload
const switchAcc = trpc.ipAccounts.switchActive.useMutation({
  onSuccess: async (d, p) => {
    localStorage.setItem('aiip_active_account_id', String(p.id));
    if (d.account) updateLocalCache(p.id, d.account);
    await utils.invalidate();
    toast.success('已切换账号');
    window.location.reload();    // 软切换有副作用，强制刷新
  }
});

// 进化反馈
const feedback = trpc.evolution.evolve.useMutation({
  onSuccess: () => {
    toast.success(rating === 'good' ? '感谢好评！' : '收到反馈，智能体将持续进化');
    setLoading(false);
  }
});

// 邀请码自动兑换（登录后）
useEffect(() => {
  if (isLoggedIn && hasUser) {
    const code = sessionStorage.getItem('pendingInviteCode');
    if (code) inviteRedeem.mutate({ code });
  }
}, [isLoggedIn, hasUser]);

const inviteRedeem = trpc.invite.redeem.useMutation({  // 推测路由名
  onSuccess: () => sessionStorage.removeItem('pendingInviteCode'),
  onError: (h) => toast.error('激活码兑换失败：' + (h.message || '请重试'))
});
```

### 14. WebSocket（tRPC subscription，未实际使用）

bundle 含 `WebSocketPonyfill` 代码（tRPC wsLink 的支持），但当前没主动调用 `subscription`。说明产品规划过流式推送但还没上线。

`stepKey` 格式：
- 全局通用：`step1` / `step3` / `step3b` / ...
- 账号关联：`acc_{accountId}_step1` / `acc_{accountId}_step3` ...

例（实测请求体 url-decoded）：

```json
[
  { "json": null, "meta": { "values": ["undefined"] } },           // auth.me
  { "json": null, "meta": { "values": ["undefined"] } },           // ipAccounts.active
  { "json": { "stepKey": "step1" } },                              // stepData.get(step1)
  { "json": { "stepKey": "step3" } },                              // stepData.get(step3)
  { "json": null, "meta": { "values": ["undefined"] } }            // stepData.getAll
]
```

## 3.2 用户对象（auth.me 返回）

```typescript
interface User {
  id: number              // 2010002
  openId: string          // "mk9g7YY3JquSvSe5LGjzgP"
  name: string            // "sally zhao"
  email: string           // "zhaolisally2006@gmail.com"
  loginMethod: 'google'   // OAuth provider
  role: 'user' | 'admin'
  isActivated: boolean
  industry: string        // "beauty_industry" 全局首选行业（如未在 IP 账号选过则用这个）
  createdAt: string       // ISO 8601
  updatedAt: string
  lastSignedIn: string
}
```

存在 localStorage：`manus-runtime-user-info`

## 3.3 IP 账号（ipAccounts.active 返回）

```typescript
interface IpAccount {
  id: number              // 390012
  userId: number
  name?: string           // 账号备注
  industry: string        // beauty_industry
  industryLabel: string   // "美业"
  platform?: string       // douyin / xiaohongshu / ...
  platformLabel?: string
  customIndustry?: string
  createdAt: string
  // ...
}
```

存在 localStorage：
- `aiip_active_account_id`: "390012"
- `aiip_memory_acc_390012_global_industry`: 当前账号的行业 + 平台

## 3.4 Step 存档（stepData.get 返回）—— **第三轮实测真实 Schema**

> 第三轮深度抓取：从 sally zhao 账号 (acc_390012) 实际 localStorage dump 反推 schema。
> 字段名是**真实 minified 后的字段**，复刻方按这个建表/写 zod schema。

每个 step 都有自己的存档结构（字段名都用 `last*` 前缀，表示"上次输入"）：

### step1: 行业选择
```typescript
{
  industry: string,       // "beauty_industry" 或 "other"
  industryLabel: string,  // "美业"
  platform: string,
  platformLabel: string,
  customIndustry?: string
}
```
存在：`aiip_memory_acc_{accId}_global_industry`

### step3: 账号包装方案 (实测真实 Schema)
```typescript
{
  lastPlatform: 'douyin' | 'xiaohongshu' | 'shipinhao' | 'kuaishou' | 'bilibili',
  lastPersonalInfo: string,            // 个人背景描述
  lastTargetAudience: string,          // 目标受众
  lastCurrentAccount: '新账号' | '已有账号',
  lastResult: {
    nickname: {
      recommended: Array<{
        name: string,                   // "智能体老王"
        reason: string,                 // 推荐理由
        searchability: string           // "高" | "中高" | "中"（搜索友好度）
      }>,                              // 共 5 项
      namingStrategy: {
        principles: string[],           // 4 项 ✓ 命名原则
        avoidList: string[],            // 4 项 ✗ 避免事项
        platformDifference: string      // 各平台调整建议
      }
    },
    avatar: {
      style: string,                    // 风格说明
      colorScheme: string,              // 配色方案
      elements: string[],               // 必含元素 (2 项)
      expression: string,               // 表情/姿态
      taboos: string[],                 // 禁忌 (4 项)
      prompt: string,                   // AI 绘图英文 prompt（约 480 字）
      referenceDescription: string      // 参考案例描述
    },
    background: {
      style: string,
      layout: string,
      elements: string[],               // 必含元素 (4 项)
      text: string,                     // 文案内容
      colorTone: string,
      prompt: string,                   // AI 绘图 prompt（约 600 字）
      platformVersions: Array<{         // 不是 platformSizes!
        platform: '抖音' | '小红书' | '视频号',
        size: string,                   // "1128x636像素"
        adjustments: string             // 该平台特殊调整
      }>                               // 共 3 项
    },
    bio: {
      bioFormula: string,               // 简介公式
      versions: Array<{
        platform: string,               // "抖音 (主号：专业人设号)"
        bio: string,                    // 5 行简介
        structure: string,              // 结构解析
        highlights: string[],           // 亮点拆解 (3 项)
        seoKeywords: string[]           // SEO 关键词 (5 项)
      }>,                              // 共 6 个版本（3 平台 × 主/副号）
      keywords: string[]                // 全局核心关键词 (5 个)
    },
    overallStrategy: {
      visualIdentity: string,           // 视觉统一性
      firstImpression: string,          // 第一印象设计
      conversionPath: string,           // 转化路径
      platformPriority: Array<{
        platform: '抖音' | '小红书' | '视频号',
        priority: '高' | '中' | '低',
        reason: string
      }>                               // 共 3 项
    }
  }
}
```
存在：`aiip_memory_acc_{accId}_step3_account_v3` (v3 是版本号)

### step3b: 人设定制方案 (实测真实 Schema)
```typescript
{
  lastPlatform: string,
  lastPersonalInfo: string,
  lastStrengths: string,                // 个人优势/特长（不是 lastAdvantages）
  lastStory: string,                    // 个人故事/经历
  lastTargetAudience: string,
  lastResult: {
    coreIdentity: {
      title: string,                    // 人设标签 "AI转型实战家：从餐饮老板到智能体定制专家"
      slogan: string[],                 // 个人口号/金句 (3 个)，**注意是数组**
      memoryPoints: Array<{
        point: string,                  // "餐饮老板转行AI"
        description: string,            // 为什么有效
        implementation: string          // 落地方式
      }>,                              // 共 3 项
      differentiator: string,           // 差异化定位（不是 differentiation）
      personalityTraits: string[]       // 性格特质 (3 项)
    },
    thoughtSystem: {
      coreBeliefs: Array<{              // 核心理念（不是 coreIdeas）
        belief: string,                 // "AI是普通人弯道超车的最佳机会。"
        explanation: string,            // 解释
        contentAngle: string            // 内容角度
      }>,                              // 共 3 项
      uniqueViews: Array<{
        view: string,                   // 独特观点
        reasoning: string,              // 推理（不是 reason）
        sampleContent: string           // 示例标题（不是 sampleTitles）
      }>,                              // 共 2 项
      catchphrases: Array<{
        phrase: string,                 // 口头禅 "用AI，做个聪明的老板。"
        usage: string,                  // 使用场景（不是 whenToUse）
        effect: string                  // 效果
      }>                               // 共 3 项
    },
    contentPersona: {
      toneOfVoice: {                    // 说话风格（不是 speakingStyle）
        description: string,
        dos: string[],                  // ✓ 列表（不是中文）
        donts: string[],                // ✗ 列表
        sampleScript: string            // 示例口播
      },
      visualStyle: {
        description: string,
        clothing: string,               // 穿搭（不是 outfit）
        scene: string,                  // 场景
        props: string[]                 // 道具 (4 项)
      },
      contentPillars: Array<{
        pillar: string,                 // "AI降本增效实战案例"
        description: string,
        percentage: string,             // "40%" (不是 percent)
        frequency: string,              // "每周2-3次"
        examples: string[]              // 示例标题（不是 sampleTitles）
      }>                               // 共 4 项
    },
    trustBuilding: {                    // 信任构建（不是 trustSystem）
      credentials: Array<{              // 信任背书（不是 endorsements）
        credential: string,             // "12年餐饮创业经验，曾拥有13家店铺"
        howToShow: string               // 展示方式
      }>,
      socialProof: Array<{
        proof: string,
        howToCollect: string            // 获取方式
      }>,
      storyAngle: {                     // 个人故事（不是 personalStory）
        mainStory: string,              // 故事线（不是 narrative）
        turningPoint: string,           // 转折点
        howToTell: string               // 讲述方式（不是 tellingMethod）
      }
    },
    personaRoadmap: {                   // 不是 roadmap，且是 Object（不是 Array）
      phase1: {
        period: '0-1个月',
        focus: string,
        milestones: string[]            // 阶段目标 (3 项)
      },
      phase2: {
        period: '1-3个月',
        focus: string,
        milestones: string[]            // (4 项)
      },
      phase3: {
        period: '3-6个月',
        focus: string,
        milestones: string[]
      }
    }
  }
}
```
存在：`aiip_memory_acc_{accId}_step3b_persona`

### step4: 执行计划 (实测真实 Schema)
```typescript
{
  lastPlatform: string,
  lastFollowers: '1-1000' | '1000-10000' | '10000-100000' | '100000+',
  lastPersonalInfo: string,
  lastGoals: 'start' | 'grow' | 'monetize' | 'scale',  // 不是 lastGoal
  lastResult: string                  // ⚠️ 是 markdown 字符串（约 16000 字）
}
```
存在：`aiip_memory_acc_{accId}_step4_execution_v2`

**关键**：`lastResult` 是 **markdown 字符串**，不是结构化 JSON！
前端用 `react-markdown + rehype-katex + rehype-raw` 渲染。
复刻方：后端直接存 string，前端 `<ReactMarkdown>{lastResult}</ReactMarkdown>`

### step4b: 变现路径 (实测真实 Schema)
```typescript
{
  lastProductDesc: string,
  lastTargetAudience: string,
  lastIpPositioning: string,
  lastCurrentRevenue: string,
  lastResult: {
    currentAnalysis: {
      industry: string,
      marketSize: string,
      competitionLevel: string,
      monetizationPotential: string
    },
    ladder: Array<{                     // 不是 threeStages
      stage: '0→90万' | '100万→1000万' | '1000万→1亿',
      title: string,                    // "起步阶段：积累案例与私域流量..."
      timeline: string,                 // "6-12个月"
      coreStrategy: string,
      products: Array<{
        name: string,                   // "AI智能体免费体验课"
        price: string,                  // "0-9.9元"
        targetCustomers: string,
        monthlyGoal: string,            // "300-500人"
        monthlyRevenue: string,         // "0-5000元"
        F: string,                      // FABE 包装：Feature 特征
        A: string,                      // Advantage 优势
        B: string,                      // Benefit 利益
        E: string                       // Evidence 证据
      }>,
      trafficStrategy: string,
      conversionFlow: string[],         // 转化流程步骤
      keyActions: string[],             // 关键动作 ✓
      riskPoints: string[]              // 风险提示
    }>,                                // 共 3 阶梯
    revenueStructure: {                // ⚠️ Object，不是 Array
      primary: {
        source: string,
        percentage: string,             // "40%"
        description: string
      },
      secondary: Array<{
        source: string,
        percentage: string,
        description: string
      }>                               // 共 2 项
    },
    successCases: Array<{
      name: string,                     // "某AI技术IP：从个人博主到AI教育平台创始人"
      industry: string,
      path: string,                     // 发展路径
      result: string,                   // "从年入几十万到年营收数千万..."
      keyTakeaway: string               // 启示
    }>                                 // 共 2 案例
  }
}
```
存在：`aiip_memory_acc_{accId}_step4b_monetization`

**FABE 价值包装**：每个产品 4 字段 (F/A/B/E)，是销售模型 FABE 法则（Feature/Advantage/Benefit/Evidence）。

### step5: 爆款选题 (实测真实 Schema)
```typescript
{
  lastIndustry: string,
  lastProduct: string,
  lastCategory: 'traffic' | 'monetize' | 'persona' | 'cognition' | 'case',  // 当前激活的 tab
  results: {
    traffic:   Array<TopicItem>,        // 流量型 20 个
    monetize:  Array<TopicItem>,
    persona:   Array<TopicItem>,
    cognition: Array<TopicItem>,
    case:      Array<TopicItem>
  }
}

interface TopicItem {
  id: number,                           // 1-20（每类内部顺序）
  title: string,                        // "老板们为什么还在熬夜加班"
  logicType?: string,                   // "恐惧"/"贪" 等（仅 traffic 类有，其他类无此字段）
  hook: string,                         // 钩子开头一句
  structure: string,                    // 内容结构
  formula: string,                      // 创作公式 "放大现有痛点，提供解药..."
  platform: 'douyin' | 'xiaohongshu' | 'shipinhao',
  difficulty: '简单' | '中等' | '困难',
  viralPotential: string                // "⭐⭐⭐⭐" 1-5 颗
}
```

**实测样本** (sally 账号 5 类各取 1)：

```
[traffic] {id:1, title:"老板们为什么还在熬夜加班", logicType:"恐惧",
           hook:"昨天凌晨两点，一个老板给我发消息说...",
           formula:"放大现有痛点，提供解药，引发共鸣和求助欲望。"}

[monetize] {id:1, title:"你还在花钱买流量吗",
            hook:"我有个客户，以前每月花5万买流量，现在...",
            formula:"算账型：直观展示成本节约，激发用户对免费流量的渴望。"}

[persona] {id:1, title:"我曾是餐饮老板，现在做AI",
           hook:"今天想跟大家聊聊我的故事...",
           formula:"自嘲式：通过幽默和坦诚，拉近与用户的距离..."}

[cognition] {id:1, title:"别再把AI当成万能工具了",
             hook:"很多人对AI有误解...",
             formula:"纠错式：纠正普遍认知误区，建立正确认知。"}

[case] {id:1, title:"一个老板，用AI省了20万年薪",
        hook:"我有个客户，他公司原来每年要花20万招人...",
        formula:"结果前置型：直接抛出惊人结果，吸引用户了解过程。"}
```

存在：`aiip_memory_acc_{accId}_step5_topics_v2`

### step6: 拍摄计划
```typescript
{
  lastSourceCopy: string,    // 文案原文
  lastResult: { /* 分镜脚本 + 拍摄方案 + 提词器 */ }
}
```
存在：`aiip_memory_acc_{accId}_step6_shooting`

### step7: 文案生成 (实测真实 Schema)
```typescript
{
  lastScriptType: 'debate' | 'opinion' | 'process' | 'knowledge' | 'story' | 'comedy'
                  | 'product' | 'review' | 'expose' | 'challenge' | 'interview'
                  | 'daily' | 'transform' | 'list' | 'reaction' | 'qna'
                  | 'collab' | 'behind' | 'trend_news' | 'motivation',
  lastElements: string[],               // ["contrast", "curiosity", "leverage", "resonance",
                                        //  "low_cost_high", "small_big", "controversy",
                                        //  "benefit", "greed"] 等英文 key
  lastTopic: string,
  lastResult: string                    // ⚠️ markdown 字符串（含【标题】【话题抛出】等结构化标记）
}
```

**实测 lastResult 内容片段**（"搞辩论"模板，约 1054 字 markdown）：
```markdown
【标题】为什么有的人赚钱那么轻松？是运气好，还是你没看懂？

【话题抛出】
你有没有发现，身边总有那么一类人，看起来没你努力...

【正方】
有人说，赚钱轻松，靠的是"信息差"和"风口"。
1. 信息差就是财富。
2. 抓住风口，猪都能飞。

【反方】
也有人说，赚钱轻松，靠的是"持续学习"和"认知升级"...

【我的立场】...

【评论区引导】...

【话题标签】#赚钱思维 #AI创业 ...
```

存在：`aiip_memory_acc_{accId}_step7_copywriting`

### step8: 直播策划
```typescript
{
  lastPlatform: string,
  lastProductInfo: string,
  lastTargetAudience: string,
  lastExperience: 'beginner' | 'experienced' | 'expert',
  lastResult: { /* 直播话术/引流策略/互动设计 */ },
  lastOptimizedResult: { /* AI 优化后版本 */ }
}
```
存在：`aiip_memory_acc_{accId}_step8_livestream`

## 3.5 独立功能模块的 localStorage 缓存

| 模块 | localStorage Key | 字段 |
|---|---|---|
| 文案解析 (/video-analysis) | `aiip_memory_acc_{accId}_video_analysis` | `lastCopy, lastTitle` |
| 爆款元素生成 (/boom-generate) | `aiip_memory_acc_{accId}_boom_generate` | `lastElements, lastTopic` |
| 一键生成视频 (/ai-video) | `aiip_memory_acc_{accId}_ai_video_storyboard` | `copyText, platform, videoType, lastStoryboard` |
| 私域成交 (/private-domain) | `aiip_memory_acc_{accId}_private_domain_v2` | `stage, product, targetUser, scenario, lastResult, lastStage` |
| 语音对话 (/voice-chat) | `voice_chat_history` | 对话历史数组（见下） |
| 邀请码 | `sessionStorage.pendingInviteCode` | 待兑换的邀请码（见 §16） |

### voice_chat_history 真实结构

```typescript
type ChatMessage = {
  role: 'user' | 'assistant',
  content: string,                      // markdown，AI 回复用 **加粗** *列表 等
  timestamp: number                     // Unix milliseconds
};
type ChatHistory = ChatMessage[];        // 全量历史，本地永久保存
```

**实测样本**：
```json
[
  {"role":"user","content":"帮我分析一下美业赛道怎么做IP","timestamp":1777956889424},
  {"role":"assistant","content":"老铁，你这个问题问得太对了！...","timestamp":1777956891000}
]
```

> **AI 回复格式**：用 markdown，含 `**第一步：xxx**`、`*   列表项`、`> 引用` 等。前端用 react-markdown 渲染。

## 3.6 6 个新模块的数据归属（实测）

第二轮发现的 6 个新页面（/diagnosis, /daily-tasks, /evolution, /accounts, /my-topics, /history）**全部数据在后端**，无 localStorage 缓存。

理由：
- 跨账号一致（不像 step 数据是按 IP 账号绑定）
- 涉及多用户共享数据（如收藏）
- 状态变更频繁（反馈、任务完成）

复刻方建议：用 React Query 默认缓存策略 (staleTime: 0~6) + 手动 invalidate 即可。

## 3.7 IP 账号 (ipAccounts) 完整 Schema

### 创建账号的 3 步表单字段（实测从 modal）

```typescript
// Step 1: 基本信息
{
  name: string,                          // 必填："账号名称"
  nickname?: string,                     // 选填："账号昵称"
  platform: 'douyin' | 'xiaohongshu' | 'kuaishou' | 'shipinhao' | 'bilibili',
  colorTag: string                       // 标识颜色（chip 配色用）
}

// Step 2: 选择行业（同 /step/1 的 56 行业）
{
  industry: string,                      // "beauty" 等
  industryLabel: string,                 // "美业"
  customIndustry?: string                // 自定义行业（如非 56 之内）
}

// Step 3: 详细配置（推测，未抓取）
{
  positioning?: string,                  // IP 定位
  audience?: string,                     // 目标受众
  bio?: string                           // 备注
}
```

### Modal 实现

- **Radix UI Dialog**: `<DialogContent>` `data-slot="dialog-content"`
- **样式**: `fixed top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-full sm:max-w-lg max-w-lg max-h-[85vh] overflow-y-auto rounded-lg border border-gold/20 bg-background p-6 shadow-lg`
- **进/出动画**: `data-[state=open]:zoom-in-95 data-[state=open]:fade-in-0 duration-200`
- **步骤指示器**: 圆形数字 + 文字，当前步骤 `bg-gold/15 text-gold border-gold/30`

## 3.6 第三方 SDK 存储

- `AMP_remote_config_46ac3f9abb` / `AMP_unsent_46ac3f9abb` — Amplitude 分析
- `__imt_handshake_page_id` — Manus 沉浸式翻译 / 嵌入沟通

---

# Ⅳ · 全局设计系统

## 4.1 主题色板

```css
/* 主题色 - 深色背景 */
--background:        #0a0e1a       /* 深空蓝/近黑 */
--foreground:        #f0f0f0       /* 主文字 */
--muted-foreground:  #8a8a8a
--card:              rgba(20,25,40,.5)   /* card 半透明 */
--border:            rgba(255,255,255,.08)

/* 主色调 - 金色（按钮 + 高亮） */
--gold:              #f5c842       /* 主金色 */
--gold-dark:         #d4a818       /* 深金色（用于次级强调） */
--gold/10:           rgba(245,200,66,.1)   /* 金色背景态 */
--gold/30:           rgba(245,200,66,.3)   /* 金色边框 */

/* 强调色 - 青色（meta theme-color） */
--theme:             #00e5ff       /* 浏览器主题栏色 */
```

**配色风格**：深色赛博 / 霓虹科技感，金色为主调（CTA、高亮、Step 编号），偶尔用青色点缀（meta tag、glow 效果）。

## 4.2 字体

```css
/* 英文标题 - 科技感粗体 */
font-family: 'Orbitron', monospace;  /* 用于 STEP 01, FUNCTION MATRIX, USER GUIDE 等英文大标题 */

/* 英文副标题 - 细科技 */
font-family: 'Rajdhani', sans-serif;  /* 用于次级英文标题 */

/* 中文 */
font-family: 'Noto Sans SC', sans-serif;
```

引入：

```html
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet">
```

## 4.3 关键 Tailwind 实用 class（蓝图）

```css
/* 顶部 header */
.container.flex.h-16.items-center.justify-between

/* 一级导航按钮（创作/策划/智能/更多） */
.flex.items-center.gap-1.px-3.py-2.rounded-lg.text-sm.font-medium.transition-all
  /* 选中态 */ .bg-gold/10.text-gold
  /* 未选 */   .text-muted-foreground.hover:text-foreground.hover:bg-card/50

/* 主 CTA 按钮 */
.inline-flex.items-center.justify-center.whitespace-nowrap.rounded-md.text-sm.font-medium
  .bg-gradient-to-r.from-gold.to-gold-dark.text-background
  .px-6.py-3.gap-2

/* 次级按钮 / 浅色按钮 */
.inline-flex.items-center.justify-center.whitespace-nowrap.text-sm.font-medium
  .border.border-gold/30.bg-transparent.text-gold

/* 卡片 */
.rounded-xl.bg-card/30.border.border-border/30
  .backdrop-blur-sm  /* 玻璃态 */

/* 行业选择卡 */
.group.relative.flex.flex-col.items-center.gap-2.p-4.rounded-xl.border.transition-all.duration-200.hover:scale-[1.02]
  /* 选中 */ .bg-gold/10.border-gold/40.shadow-lg
  /* 未选 */ .bg-card/30.border-border/30

/* 步骤 header */
.flex.items-center.gap-2.text-gold/60.text-sm.mb-2  /* "STEP 03 · 账号包装方案" */
```

## 4.4 关键交互组件

### 1. 平台选择器（5 选 1，单选）

```jsx
<div className="flex gap-2 flex-wrap">
  {[
    { key: 'douyin',     label: '📱 抖音' },
    { key: 'xiaohongshu', label: '📕 小红书' },
    { key: 'shipinhao',  label: '📺 视频号' },
    { key: 'kuaishou',   label: '🎬 快手' },
    { key: 'bilibili',   label: '📺 B站' }
  ].map(p => (
    <button className={selected === p.key
      ? 'px-3 py-1.5 rounded-lg text-sm font-medium border bg-gold/10 text-gold border-gold/30'
      : 'px-3 py-1.5 rounded-lg text-sm font-medium border bg-card/30 text-muted-foreground border-border/30 hover:bg-card/60'
    }>{p.label}</button>
  ))}
</div>
```

### 2. 行业选择器（56 行业，5 大类）

详见 §Ⅹ.4

### 3. 爆款元素多选（22 个，4 组）

详见 §Ⅹ.2

### 4. 脚本类型单选（20 类）

详见 §Ⅹ.3

### 5. 文件上传组件

```jsx
<div className="rounded-xl border-2 border-dashed p-4 text-center cursor-pointer
                border-border/30 hover:border-border/50 bg-card/10">
  <div className="flex flex-col items-center gap-2 py-2">
    <UploadIcon />
    <p className="font-medium">上传产品资料</p>
    <p className="text-xs text-muted-foreground">产品介绍、卖点、价格体系、客户案例等</p>
    <p className="text-xs text-muted-foreground">支持 PDF、Word、TXT、Markdown、CSV（最大 20MB）</p>
  </div>
  <input type="file" hidden accept=".pdf,.doc,.docx,.txt,.md,.csv" />
</div>
```

### 6. 通用结果卡

```jsx
<Card>
  <CardHeader className="flex items-center justify-between">
    <h3>结果标题</h3>
    <div className="flex gap-2">
      <Button variant="ghost">智能优化</Button>
      <Button variant="ghost">重新生成</Button>
      <Button variant="ghost">复制全部</Button>
    </div>
  </CardHeader>
  <CardContent>
    <!-- 结构化结果内容 -->
    <div className="grid gap-3">
      {items.map(item => (
        <div className="rounded-lg p-4 bg-card/40">
          <div className="flex items-center justify-between mb-2">
            <span>{item.title}</span>
            <button className="text-xs text-muted-foreground hover:text-gold">复制</button>
          </div>
          <p>{item.content}</p>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

---

# Ⅴ · 全局布局

## 5.1 顶部 Header（所有页面通用）

```
┌────────────────────────────────────────────────────────────────────────────┐
│  [Logo] AIP AGENT       [创作] [策划] [智能] [更多]      [赵语AI] [sally] [≡]  │
└────────────────────────────────────────────────────────────────────────────┘
```

- **高度**：`h-16` (64px)
- **容器**：`container flex h-16 items-center justify-between`
- **左侧 Logo**：`AIP / AGENT` 双行文字 + 金色方块图标，点击回首页
- **中间导航**：4 个一级菜单按钮，**鼠标 hover 弹出二级 dropdown**
- **右侧**：
  - 「赵语 AI」按钮（小尺寸，金色描边，AI 助手浮窗入口）
  - 用户名展示（`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold/5`）
  - 移动端汉堡菜单按钮（`lg:hidden`）

## 5.2 一级菜单分组（**实测数据见 §12.1**）

⚠️ 第二轮补抓修正了菜单映射，**这里的旧推断已废弃，请直接看 §12.1**：

- 创作（5）：爆款选题 / 文案生成 / 文案解析 / 获客视频 / 呈现形式
- 策划（8）：选行业 / 账号 / 人设 / 执行 / 变现 / 拍摄 / 直播 / 私域
- 智能（6）：IP诊断 / 每日任务 / AI视频 / 语音 / 深度学习 / 进化仪表盘
- 更多（6）：账号管理 / 方法论 / 使用说明 / IP方案 / 选题库 / 历史

实现：shadcn `DropdownMenu`，**click 触发**（非 hover），自定义样式见 §12.1。

## 5.3 「赵语 AI」按钮 = IP 账号切换器（**非 AI 浮窗**）

> 第二轮补抓修正：原推测是 AI 助手浮窗，**实际是 IP 账号下拉切换器**

- **位置**：header 右侧，logout 图标按钮的左边
- **按钮文本**：当前活跃 IP 账号名（如 "赵语AI"）+ chevron-down 图标
- **样式**：`px-2.5 py-1.5 rounded-lg text-xs bg-secondary/50 border border-gold/15 hover:border-gold/30`
- **点击**：弹出 dropdown，显示所有 IP 账号 + 「管理账号」入口（跳 /accounts）

详见 §12.2

## 5.4 用户区（不可点）+ 登出图标

- **「sally zhao」chip**：纯展示，左边带 `animate-ping` 跳动金色圆点（在线状态）
- **登出按钮**：独立 `lucide-log-out` icon-only button，单击直接登出无确认
- **没有传统的"用户菜单"**

详见 §12.3

## 5.5 整体页面骨架

```jsx
<div className="min-h-screen bg-background data-grid-bg">
  <Header />
  <main className="container mx-auto px-4 py-8">
    <PageContent />
  </main>
  <Toaster position="bottom-right" />  {/* sonner */}
</div>
```

> 注：原"ZhaoyuFloatingButton"已删除（实际不存在浮窗）

---

# Ⅵ · 首页详情

## 6.1 URL & 元信息

- **URL**：`/`
- **`<title>`**：AIP全案获客操盘手 - OPC全案落地，从流量到成交
- **`<h1>`**：从流量到成交

## 6.2 首页结构（从上到下）

```
┌─────────────────────────────────────────────┐
│  Header（同 §Ⅴ.1）                          │
├─────────────────────────────────────────────┤
│                                             │
│  Hero 区（H1: 从流量到成交）                 │
│  - 副标题 / Slogan                          │
│  - 主 CTA："启动智能分析" → /step/1         │
│  - 次 CTA："使用说明" → /guide               │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  H2: 我的IP打造进度                         │
│  - 9 步进度条                               │
│  - 每步状态：已完成 / 进行中 / 未开始         │
│  - "查看IP方案" 按钮 → /ip-plan              │
│  - "继续" 按钮 → 下一未完成 step              │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  H2: FUNCTION MATRIX (Orbitron 大标题)      │
│                                             │
│  H3: 市场洞察                               │
│  ┌──────┐ ┌──────┐ ┌──────┐                 │
│  │爆款库│ │文案解│ │呈现形│                 │
│  └──────┘ └──────┘ └──────┘                 │
│                                             │
│  H3: 变现设计                               │
│  ┌──────┐ ┌──────┐                          │
│  │变现模│ │私域成│                          │
│  └──────┘ └──────┘                          │
│                                             │
│  H3: 内容创作                               │
│  ┌──────┐ ┌──────┐ ┌──────┐                 │
│  │爆款生│ │AI生成│ │结构分│ ...             │
│  └──────┘ └──────┘ └──────┘                 │
│                                             │
│  H3: 智能工具                               │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│  │AI视频│ │语音对│ │深度学│ │知识库│         │
│  └──────┘ └──────┘ └──────┘ └──────┘        │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  H2: WORKFLOW (Orbitron 大标题)             │
│  - 7 步系统化流程图（选行业→变现设计→学爆款 │
│    →生成文案→制作视频→私域转化）             │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  H2: READY TO START?                        │
│  - 主 CTA："立即启动" → /step/1             │
│                                             │
└─────────────────────────────────────────────┘
```

## 6.3 首页操作流程 SOP

| 用户行为 | 系统响应 |
|---|---|
| 1. 用户进入首页 | 调 `auth.me` 校验登录态；未登录跳 Google OAuth |
| 2. 调 `ipAccounts.active` 取活跃账号 | 没有则使用 user.industry 作为兜底 |
| 3. 调 `stepData.getAll` 算每步完成度 | 渲染"我的IP打造进度"模块 |
| 4. 用户点 "启动智能分析" / "立即启动" | 跳 `/step/1` |
| 5. 用户点 "使用说明" | 跳 `/guide` |
| 6. 用户点 "查看IP方案" | 跳 `/ip-plan` |
| 7. 用户点 FUNCTION MATRIX 内任意卡片 | 跳对应模块路由 |
| 8. 用户点"继续" | 自动跳到第一个未完成 step |

---

# Ⅶ · IP 打造主流程（9 步向导）

> 流程：1 (选行业) → 3 (账号包装) → 3b (人设) → 4 (执行) → 4b (变现) → 5 (选题) → 6 (拍摄) → 7 (文案) → 8 (直播)
>
> ⚠️ 流程**跳过 step/2**，访问 `/step/2` 返回 404。

通用 step 页骨架：

```
┌────────────────────────────────────────┐
│  [Header]                              │
├────────────────────────────────────────┤
│  STEP 0X · 副标题（gold/60，小字）       │
│  H1（白色大字）                          │
│                                        │
│  [当前行业：xxx 美业。] 描述文字。       │
│                                        │
│  ┌──────────────────────────┐          │
│  │  输入表单区               │          │
│  │  - 表单字段...            │          │
│  │  - [生成 XX] 主按钮（金色）│          │
│  └──────────────────────────┘          │
│                                        │
│  ┌──────────────────────────┐          │
│  │  结果区（生成后展示）      │          │
│  │  ┌────┐ [智能优化][重生][复│         │
│  │  │ H3 │                    │          │
│  │  ├────┴────────────────┐   │          │
│  │  │ 子模块 1            │   │          │
│  │  │ 子模块 2            │   │          │
│  │  └─────────────────────┘   │          │
│  └──────────────────────────┘          │
└────────────────────────────────────────┘
```

---

## 7.1 Step 1 · 选择行业赛道

- **URL**：`/step/1`
- **顶部标签**：`STEP 01 · 选择行业赛道`
- **H1**：选择你的行业赛道
- **副标题**：覆盖抖音、视频号等主流平台的 56+ 个细分行业。你也可以自定义输入行业。

### UI 元素清单

| 元素 | 类型 | 数据 |
|---|---|---|
| 搜索框 | input text | placeholder: 搜索行业名称或关键词（如：美容院、餐饮、教育...） |
| 5 大类 tab 横向滚动 | button × 6 | 全部行业 (56) / 🏠 生活服务 (18) / 🛒 电商零售 (13) / ✍️ 内容创作 (7) / 💼 专业服务 (14) / 🏭 产业制造 (4) |
| 56 个行业卡片 | button × 56 | 见 §Ⅹ.4（emoji + 中文名两行排版） |
| "自定义输入行业" | button (link 风格) | 弹出弹窗输入自定义行业 |
| 已选状态卡 | div | 显示已选行业 emoji + 名称 + 关键词列表 |
| 主 CTA | button (gold gradient) | 「确认并进入下一步」 |

### 操作 SOP

```
1. 用户进入 /step/1
   - 系统自动从 stepData.get(step1) 读上次选择
   - 已选行业用 .bg-gold/10 .border-gold/40 高亮显示

2. 用户【点击 5 大类 tab】筛选行业
   → 行业卡片网格按类筛选

3. 用户【输入搜索关键词】
   → 行业卡片实时按 name + 关键词模糊匹配

4. 用户【点击行业卡】（如「💅 美业」）
   → 卡片高亮，顶部显示"已选择：美业 / 关键词：美容院、美发、美甲、美睫、纹绣"
   → 触发 stepData.save(step1, { industry: 'beauty', industryLabel: '美业' })

5. 如果 56 个行业不满意，用户【点"自定义输入行业"】
   → 弹出 modal，输入自定义行业名 → 保存为 customIndustry

6. 用户【点"确认并进入下一步"】
   → 跳转 /step/3
```

### 关键字段

```typescript
{
  industry: string,           // "beauty" 或 "other"
  industryLabel: string,      // "美业"
  platform?: string,          // 此 step 不强制选平台
  customIndustry?: string
}
```

---

## 7.2 Step 3 · 账号包装方案

- **URL**：`/step/3`
- **顶部标签**：`STEP 03 · 账号包装方案`
- **H1**：账号包装方案
- **副标题**：当前行业：{industry}。输入你的个人信息，AI 将为你生成极其详细的账号包装方案，包含昵称、头像参考图、背景图参考、简介等全方位深度解析。

### 输入表单

| 字段 | 类型 | 必填 | placeholder |
|---|---|---|---|
| 你的个人信息 | textarea | ✅ | 详细描述你的个人背景、专业技能、从业经验、擅长领域、个人特点等。\n\n示例：我是一名有10年经验的美容师，擅长皮肤管理和抗衰项目... |
| 目标平台 | radio (5 选 1) | ✅ | 📱 抖音 / 📕 小红书 / 📺 视频号 / 🎬 快手 / 📺 B站 |
| 目标受众 | input text | 可选 | 你想吸引什么样的粉丝？ |
| 现有账号情况 | input text | 可选 | 新账号/已有账号的粉丝量等 |

按钮：`[生成账号包装方案]`（主 CTA）/ `[重新生成]` / `[智能优化]`（次级，已有结果时显示）

### 操作 SOP

```
1. 进入 /step/3
   - stepData.get(step3) 读上次输入和结果
   - 表单预填上次值，结果区直接渲染上次方案

2. 用户【填写"你的个人信息"】（必填）
   → textarea 字符计数（如有限制）

3. 用户【点击平台 tab】（如"📱 抖音"）
   → 选中态高亮

4. 用户填写【目标受众】、【现有账号情况】（可选）

5. 用户【点击"生成账号包装方案"】
   → 按钮变 loading
   → 调后端：trpc.stepData.generateStep3({ personalInfo, platform, audience, accountStatus })
   → 大约 30-60 秒后返回结构化方案
   → stepData.save(step3, { input, result })
   → localStorage 同步
   → 滚动到结果区

6. 用户【点击"重新生成"】
   → 用相同输入重新调 AI（拿不同结果）

7. 用户【点击"智能优化"】
   → 弹出输入框让用户填"优化方向"（如"更年轻化")，把现有结果作为基础再调 AI
```

### 生成结果结构（6 大模块）

```typescript
{
  videoReferences: Array<{                  // 1. 视频参考案例（3 个）
    title, description, platform, searchQuery
  }>,
  nickname: {                                // 2. 昵称推荐（5 个备选）
    recommended: Array<{
      name,                                  // "智能体老王"
      reason,
      searchability                          // "高"/"中高"/"中"
    }>,
    strategy: { /* 命名策略 ✓ × 列表 */ },
    platformAdjust: string                   // 各平台昵称调整建议
  },
  avatar: {                                  // 3. 头像设计方案
    style: string,                           // 风格建议
    colorScheme: string,                     // 配色方案
    expression: string,                      // 表情/姿态
    references: string,                      // 参考案例
    mustHave: string[],                      // 必含元素
    avoid: string[],                         // 禁忌
    aiPrompt: string                         // 英文 AI 绘图 prompt
  },
  background: {                              // 4. 背景图设计方案
    style, layout, colorTone, copyContent,
    mustHave, platformSizes: {               // 平台适配尺寸
      douyin: { size: '1128x636', tip: '...' },
      xiaohongshu: { size: '1242x800', tip: '...' },
      shipinhao: { size: '1200x675', tip: '...' }
    },
    aiPrompt: string
  },
  bio: {                                     // 5. 简介文案方案
    formula: string,                         // 简介公式
    versions: Array<{                        // 6 个版本（3 平台 × 主号副号）
      platform: string,                      // "抖音 (主号：专业人设号)"
      content: string,                       // 5 行简介
      structure: string,                     // 结构解析
      highlights: string[],                  // 亮点拆解
      seoKeywords: string[]
    }>
  },
  strategy: {                                // 6. 整体包装策略
    visualConsistency: string,
    firstImpression: string,
    conversionPath: string,
    platformPriority: Array<{ rank, platform, reason }>
  }
}
```

### 结果区操作

每个子模块右侧都有：
- **复制** 按钮（复制本节内容到剪贴板）
- 头像 / 背景图 子模块还有 **生成参考图** 按钮 → 调用图像生成 API，把 aiPrompt 传过去，返回参考图 URL

主操作：
- **一键重新生成** / **复制全部**（顶部右侧）

---

## 7.3 Step 3b · 人设定制方案

- **URL**：`/step/3b`
- **顶部标签**：`STEP 03b · 人设定制方案`
- **H1**：人设定制方案
- **副标题**：当前行业：{industry}。输入你的个人信息和故事，AI 将精准识别你的独特人设、记忆点、思想体系，打造有辨识度的个人 IP。

### 输入表单

| 字段 | 类型 | 必填 | placeholder |
|---|---|---|---|
| 你的个人信息 | textarea | ✅ | （同 step3） |
| 个人优势/特长 | textarea | 可选 | 你有什么独特的优势？比如：独特的经历、专业证书、成功案例、个人特质... |
| 个人故事/经历 | textarea | 可选 | 分享你的个人故事：为什么做这个行业？有什么转折点？什么经历让你与众不同？ |
| 目标平台 | radio (5 选 1) | ✅ | 同上 |
| 目标受众 | input text | 可选 | 你想吸引什么样的粉丝？ |

按钮：`[生成专属人设方案]` / `[智能优化]` / `[复制全部]`

### 操作 SOP

```
1. 进入 /step/3b
   - stepData.get(step3b)
   - 自动复用 step3 的"个人信息"作为预填（如有）

2. 用户填写表单（"个人故事"段落是关键，AI 会用来构造记忆点）

3. 用户【点"生成专属人设方案"】
   → AI 调用，生成 5 大模块结果
```

### 生成结果（5 大模块）

```typescript
{
  coreIdentity: {                            // 1. 核心身份定位
    persona: string,                         // 人设标签 "AI转型实战家"
    slogan: string,                          // 个人口号 / 金句
    differentiation: string,                 // 差异化定位
    memoryPoints: Array<{                    // 记忆点设计
      keyword,                               // "餐饮老板转行AI"
      why,                                   // 为什么有效
      howToUse                               // 落地方式
    }>,
    personality: string[]                    // 性格特质 3-5 个
  },
  thoughtSystem: {                           // 2. 思想体系
    coreIdeas: Array<{                       // 核心理念（3 个）
      idea,                                  // "AI 是普通人弯道超车的最佳机会"
      reason,
      contentAngles: string[]                // 内容角度
    }>,
    uniqueViews: Array<{                     // 独特观点（引爆流量）
      view,                                  // "💥 所有人都说AI要学编程，但..."
      reason,
      sampleTitles: string[]
    }>,
    catchphrases: Array<{                    // 口头禅设计
      phrase,                                // "用AI，做个聪明的老板。"
      whenToUse,
      effect
    }>
  },
  contentPersona: {                          // 3. 内容人设
    speakingStyle: string,                   // 说话风格（含 ✓ × 列表）
    sampleScript: string,                    // 示例口播
    visualStyle: {
      style, outfit, scene, props: string[]
    },
    contentPillars: Array<{                  // 4 大内容支柱
      pillar,                                // "AI降本增效实战案例"
      percent,                               // "40%"
      frequency,                             // "每周2-3次"
      description,
      sampleTitles: string[]
    }>
  },
  trustSystem: {                             // 4. 信任构建体系
    endorsements: Array<{ point, howToShow }>,
    socialProof: Array<{ type, howToGet }>,
    personalStory: {
      narrative: string,                     // 完整故事线
      turningPoint: string,                  // 转折点
      tellingMethod: string                  // 讲述方式
    }
  },
  roadmap: Array<{                           // 5. 人设打造路线图
    duration: '0-1个月' | '1-3个月' | '3-6个月',
    goal: string,                            // 阶段目标
    keyResults: string[]                     // 关键成果（→）
  }>
}
```

---

## 7.4 Step 4 · 执行计划

- **URL**：`/step/4`
- **顶部标签**：`STEP 04 · 制定执行计划`
- **H1**：执行计划
- **副标题**：当前行业：{industry}。AI 将为你制定每天具体做什么、每周里程碑、每个阶段 KPI 的可执行运营计划。

### 输入表单

| 字段 | 类型 | placeholder |
|---|---|---|
| 选择平台 ✅ | radio | 抖音 / 小红书 / 视频号 / 快手 / B站 |
| 当前粉丝量 | input text | 如：0 / 500 / 1万 / 10万 |
| 目标 | input text | 如：3个月涨粉1万、月入5万 |
| 个人信息 | textarea | 描述你的情况，比如：每天可投入2小时 / 有实体店/线上课程 / 擅长口播/拍摄 |

按钮：`[生成执行计划]`

### 操作 SOP

```
1. 进入 /step/4 → 读 stepData.get(step4)
2. 用户选平台、填粉丝量、目标、个人时间情况
3. 点"生成执行计划"
4. AI 生成：每日任务表 + 每周里程碑 + 阶段 KPI
```

---

## 7.5 Step 4b · 变现路径规划

- **URL**：`/step/4b`
- **顶部标签**：`STEP 04b · 变现路径规划`
- **H1**：变现路径
- **副标题**：当前行业：{industry}。AI 将为你规划三阶梯变现路径：0→90 万、100 万→1000 万、1000 万→1 亿，每个阶梯有具体的产品设计、定价策略和成交流程。

### 输入表单

| 字段 | 类型 | 必填 | placeholder |
|---|---|---|---|
| 产品/服务描述 | textarea | ✅ | 描述你的产品或服务，比如：美容院皮肤管理项目，客单价500-3000元 / 线上知识付费课程，定价199-999元 / 实体店+线上双渠道 |
| 目标受众 | input text | 可选 | 如：25-40岁女性 |
| IP 定位 | input text | 可选 | 如：专业皮肤管理师 |
| 当前收入水平 | input text | 可选 | 如：月入3万 / 年收入50万 |

按钮：`[生成变现路径]` / `[智能优化]` / `[重新生成]`

### 生成结果结构（含三阶梯 + 收入结构 + 案例参考）

```typescript
{
  marketAnalysis: {                          // 市场分析
    industry: string,                        // 行业判断
    marketSize: string,
    competitionLevel: string,
    monetizationPotential: string
  },
  threeStages: [
    {
      range: '0→90万',                       // 起步阶段
      title: '积累案例与私域流量，验证培训模型',
      duration: '6-12个月',
      coreStrategy: string,
      productMatrix: Array<{                 // 产品矩阵
        type: '引流品' | '信任品' | '利润品' | '后端产品',
        name: string,                        // 产品名称
        priceRange: string,                  // 0-9.9元 / 499元 / ...
        targetCustomer: string,
        monthlyTarget: string,               // 月目标
        monthlyRevenue: string               // 月收入
      }>,
      trafficStrategy: string,
      conversionFlow: string[],              // 🔄 转化流程（→ 步骤）
      keyActions: string[],                  // 🎯 关键动作 ✓
      risks: string[]                        // 风险提示
    },
    { range: '100万→1000万', /* ... */ },
    { range: '1000万→1亿', /* ... */ }
  ],
  revenueStructure: Array<{                  // 收入结构（占比饼图）
    category: string,
    percent: number,                         // 40
    description: string
  }>,
  successCases: Array<{                      // 成功案例参考
    name, type, journey, result, insight
  }>
}
```

### 操作 SOP

```
1. 进入 /step/4b → 读上次方案
2. 填表 → 点"生成变现路径"
3. 渲染三阶梯卡片（每张折叠展开）
4. 用户可点"重新生成" / "智能优化"
5. 底部"这个结果对你有帮助吗？" 反馈按钮（推测：影响 AI 后续优化）
```

---

## 7.6 Step 5 · 爆款选题库

- **URL**：`/step/5`
- **菜单分类**：「**创作**」高亮（不是「策划」）
- **顶部标签**：`STEP 05 · 爆款选题库`
- **H1**：爆款选题库
- **副标题**：输入你的行业和产品信息，还可以上传产品资料和人物介绍文档，AI 将结合这些素材一次性生成 5 大类爆款选题（流量型/变现型/人设型/认知型/案例型），每类 20 个选题，共 100 个。

### 输入表单

| 字段 | 类型 | 必填 | placeholder |
|---|---|---|---|
| 你的行业 | input text | ✅ | 例如：美业、餐饮、教育培训、服装... |
| 你的产品/服务 | input text | ✅ | 例如：皮肤管理项目、火锅加盟、英语培训课... |
| 上传产品资料 | file | 可选 | 产品介绍、卖点、价格体系、客户案例等。支持 PDF、Word、TXT、Markdown、CSV（最大 20MB） |
| 上传人物介绍与行业 | file | 可选 | 个人经历、行业背景、专业资质、从业故事等。支持 PDF、Word、TXT、Markdown、CSV（最大 20MB） |

按钮：`[一键生成 5大类 爆款选题]`

### 操作 SOP

```
1. 进入 /step/5 → 读 stepData.get(step5)
2. 用户填行业 + 产品（必填）
3. 可选上传 PDF / Word / TXT / MD / CSV 文件（最大 20MB）
   - 后端解析文件文本，附加到 AI prompt
4. 点"一键生成 5大类 爆款选题"
   → 调 AI 一次性生成 100 个选题（5 类 × 20）
5. 结果按 5 类 tab 展示
   每个选题卡片：标题 / 钩子 / 结构 / 公式 / 平台 / 难度 / 爆款潜力星级
6. 用户点某选题 → 跳 step/7 文案生成（自动预填 lastTopic）
```

### 5 大选题类别

| 类别 | key | 数量 |
|---|---|---|
| 流量型 | traffic | 20 |
| 变现型 | monetize | 20 |
| 人设型 | persona | 20 |
| 认知型 | cognition | 20 |
| 案例型 | case | 20 |

---

## 7.7 Step 6 · 拍摄计划

- **URL**：`/step/6`
- **顶部标签**：`STEP 06 · 生成拍摄计划`
- **H1**：拍摄计划
- **副标题**：输入你的文案内容，AI 将自动生成完整的分镜脚本、拍摄方案和口播提词器。

### 输入表单

| 字段 | 类型 | 必填 | placeholder |
|---|---|---|---|
| 文案内容 | textarea | ✅ | 粘贴你的短视频文案（至少 10 个字），AI 将基于文案生成完整的拍摄计划。\n\n你可以使用第七步「文案生成」功能先生成文案，再来这里生成拍摄计划。 |

字符计数：「已输入 0 字」（需达到 10 字才能触发生成）

按钮：`[生成拍摄计划]`

### 操作 SOP

```
1. 进入 /step/6
2. 用户粘贴文案（至少 10 字）
3. 点"生成拍摄计划"
4. 输出：
   - 分镜脚本（每个镜头：时长 / 场景 / 景别 / 角度 / 运镜 / 情绪 / 台词 / 动作）
   - 拍摄方案（道具 / 灯光 / 服装 / 场景）
   - 口播提词器（断句版文案，方便录制）
```

---

## 7.8 Step 7 · 文案生成

- **URL**：`/step/7`
- **菜单分类**：「**创作**」高亮
- **顶部标签**：`STEP 07 · AI 智能文案生成`
- **H1**：文案生成
- **副标题**：选择脚本类型和爆款元素，输入主题，AI 将基于方法论生成深度爆款文案，支持 AI 智能修改优化。

### UI 元素

#### 1. 选择脚本类型（20 选 1）

详见 §Ⅹ.3 完整列表

带搜索框：「搜索脚本...」

每个脚本类型卡：
```
[名称]
[一句话定位]
```

例：「聊观点 / 表达个人观点，引发共鸣，适合知识分享类账号」

#### 2. 选择爆款元素（22 选 N，多选）

详见 §Ⅹ.2 完整 4 组

顶部计数：`选择爆款元素（已选 N 个）`

#### 3. 文案主题输入

| 字段 | 类型 | 必填 | placeholder |
|---|---|---|---|
| 文案主题 | textarea | ✅ | 输入你的文案主题，如：美容院如何用抖音获客100个精准客户... |

显示「当前脚本：聊观点 - 表达个人观点，引发共鸣，适合知识分享类账号」

#### 4. AI 智能优化

| 字段 | 类型 | placeholder |
|---|---|---|
| 优化方向 | input text | 输入优化方向（可选），如：更有吸引力、增加互动感、更口语化... |

按钮：
- 主：`[生成爆款文案]`
- 优化：`[AI 优化文案]`
- 跳转：`[我的选题库]` / `[爆款选题]`（跳 step/5）

### 操作 SOP

```
1. 进入 /step/7 → 读 stepData.get(step7)，预填上次的脚本类型/元素/主题/结果
2. 用户【从 20 类脚本中选 1 个】
3. 用户【从 22 个爆款元素中多选 N 个】
4. 用户【输入文案主题】
5. 点"生成爆款文案"
   → AI 按方法论生成深度文案
   → 不同脚本类型有不同的结构化字段（见下）
6. 结果区显示文案
7. 用户可【点"AI 优化文案"】，输入"优化方向"做二次优化
```

### 文案结果结构（按脚本类型）

例：**搞辩论** 类型 → 结构化字段：

```typescript
{
  title: string,                  // 【标题】
  topicHook: string,              // 话题抛出
  prosArguments: string,          // 正方
  consArguments: string,          // 反方
  myStance: string,               // 我的立场
  commentGuide: string,           // 评论区引导
  topicTags: string[]             // 话题标签 #xxx
}
```

其他脚本类型的字段结构不同（如「聊观点」可能是 `[hook, viewpoint, evidence, callToAction]`，复刻时需为每种脚本类型设计独立 schema）。

---

## 7.9 Step 8 · 直播策划

- **URL**：`/step/8`
- **顶部标签**：`STEP 08 · 直播策划`
- **H1**：直播策划
- **副标题**：当前行业：{industry}。AI 将生成完整的直播方案，包含详细话术、引流策略、互动设计，并支持 AI 优化直播脚本。

### 子功能 1：生成直播方案

| 字段 | 类型 | placeholder |
|---|---|---|
| 产品/服务信息 | textarea | 描述你要在直播中推广的产品或服务... |
| 目标受众 | input text | 如：25-40岁女性... |
| 直播平台 | radio (5 选 1) | 抖音 / 小红书 / 视频号 / 快手 / B站 |
| 直播经验 | radio (3 选 1) | 新手 · 刚开始做直播 / 有经验 · 有一定直播经验 / 资深 · 直播经验丰富 |

按钮：`[生成直播方案]`

### 子功能 2：AI 优化直播话术

| 字段 | 类型 | placeholder |
|---|---|---|
| 直播话术脚本 | textarea | 粘贴你的直播话术脚本（至少 10 个字），AI 将深度优化话术表达、互动设计和转化逻辑... |
| 优化目标 | input text | 优化目标（可选），如：提升互动率、增强转化、更有感染力... |

按钮：`[AI 优化话术]`

### 操作 SOP

```
1. 进入 /step/8
2. 子功能 1：从 0 生成直播方案
   - 填产品/受众/平台/经验
   - 点"生成直播方案"
   - 输出：开场话术 / 中场互动 / 成交话术 / 收尾 / 引流策略 / 互动设计
3. 子功能 2：优化已有话术
   - 粘贴现有话术 → 选优化目标 → 点"AI 优化话术"
```

---

# Ⅷ · 14 个独立功能模块

> 这 14 个模块虽然可独立使用，但和 9 步流程的数据相互打通（共用 IP 账号、共用行业等）。

---

## 8.1 一、市场洞察类（3 个）

### 8.1.1 全网爆款库 `/trending`

- **H1**：全网爆款库
- **副标题**：抓取 2025-2026 年全平台（抖音、小红书、视频号、快手、B站）最新爆款视频和完整文案

#### UI

| 元素 | 类型 | 备注 |
|---|---|---|
| 选择行业 | dropdown | 默认显示当前账号行业（如「📲 自媒体运营」） |
| 筛选平台 | dropdown | 默认「全部平台」 |
| 自定义关键词 | input | placeholder: 多个关键词用逗号分隔 |
| 搜索框 | input | placeholder: 搜索爆款内容... |
| 主按钮 | button | `[抓取最新爆款]` |

#### 结果展示

总数：`共 25 条`（卡片网格）

每张爆款卡：
```
[平台 emoji + 名] [呈现形式 tag]
【完整标题】
【完整文案 / 口播稿】
【tags】
👍 8.2万   💬 1.5万   🔄 3.8万
```

#### 操作 SOP

```
1. 进入 /trending
2. 用户【选行业】【选平台】【输入关键词】
3. 点"抓取最新爆款"
   → 后端可能：a) 从已抓取的 DB 取，b) 实时抓取
4. 渲染卡片列表
5. 用户【点某张卡】 → 可能跳 /video-analysis 预填该文案
```

---

### 8.1.2 爆款文案解析 `/video-analysis`

- **H1**：爆款文案解析
- **副标题**：粘贴爆款视频的完整文案/口播稿，AI 将深度拆解爆款密码，支持一键仿写

**使用方法提示**：「打开抖音/小红书/快手等 APP → 找到爆款视频 → 复制视频的完整口播文案/文字内容 → 粘贴到下方输入框 → 点击「开始深度解析」」

#### UI

| 字段 | 类型 | placeholder |
|---|---|---|
| 视频标题 | input text | 视频标题（选填） |
| 视频文案 | textarea | 粘贴爆款视频的完整文案/口播稿（至少 10 个字）... |

按钮：`[开始深度解析]`

#### 操作 SOP

```
1. 用户从抖音/小红书等复制爆款文案
2. 进入 /video-analysis 粘贴
3. 点"开始深度解析"
4. AI 输出：
   - 钩子拆解（开头 3 秒为什么留人）
   - 结构分析（起承转合）
   - 爆款元素识别（用了贪念/恐惧/反差等中的哪几个）
   - 评分（10 维度）
   - 一键仿写（基于解析重写一篇）
```

---

### 8.1.3 爆款呈现形式 `/present-styles`

- **H1**：爆款呈现形式合集
- **副标题**：掌握各种爆款视频的呈现形式，找到最适合你的内容表达方式

#### 内容（14 种呈现形式）

| 形式 | 一句话定位 | 适用场景 |
|---|---|---|
| 口播 | 真人出镜直接讲述，适合知识分享和观点输出 | 通用 |
| 剧情 | 短剧/情景剧形式，适合讲故事和产品植入 | 通用 |
| 教程 | 步骤式教学，适合技能分享和产品使用 | 通用 |
| Vlog | 日常记录/体验分享，适合人设打造 | 通用 |
| 街访 | 街头采访形式，适合话题讨论和互动 | 通用 |
| 对比测评 | 产品/方法对比，适合种草和测评 | 通用 |
| 清单盘点 | 盘点型内容，信息密度高 | 通用 |
| 混剪 | 素材混剪+配音，适合情感和知识类 | 通用 |
| 录屏 | 屏幕录制+讲解，适合软件教程和数据展示 | 通用 |
| 动画 | 动画/图文动效形式，适合科普和数据可视化 | 通用 |
| 反应 | 看视频/看评论的反应，适合二创和互动 | 通用 |
| 前后对比 | 变化前后对比，适合美妆/装修/健身等 | 通用 |
| POV 视角 | 第一人称视角，沉浸式体验 | 通用 |
| 问答 | 一问一答形式，适合知识科普 | 通用 |

**类型**：纯展示页（无表单），用于学习参考。

#### 操作 SOP

```
1. 进入 /present-styles
2. 14 张卡片网格展示
3. 用户点某张卡 → 弹出 detail 弹窗（拍摄技巧、范例、适用产品）
   或跳到对应教学页（推测）
```

---

## 8.2 二、变现设计类（3 个）

### 8.2.1 IP 变现模型定制 `/monetization`

- **H1**：IP 变现模型定制
- **副标题**：结合行业数据和全网成功案例，为您定制清晰的 IP 变现路径

#### UI

| 字段 | 类型 | 必填 | placeholder |
|---|---|---|---|
| 选择行业 | dropdown | ✅ | 默认当前账号行业 |
| 产品/服务描述 | textarea | ✅ | 描述您的产品或服务，例如：线上英语培训课程，面向职场白领... |
| 目标受众 | input text | 可选 | 例如：25-40岁职场女性 |
| IP 定位 | input text | 可选 | 例如：专业、接地气的英语老师人设 |

按钮：`[生成变现模型]`

> 与 step/4b 区别：step/4b 是 IP 主流程的一部分（含三阶梯路线图），`/monetization` 是独立的"快速生成变现模型"工具。

#### 操作 SOP

```
1. 进入 /monetization
2. 选行业 + 描述产品（必填）
3. 点"生成变现模型"
4. 输出：变现模型（产品矩阵 / 定价 / 转化路径）
```

---

### 8.2.2 私域成交流程 `/private-domain`

- **H1**：私域成交流程
- **副标题**：覆盖从加好友到成交复购的全链路话术，让私域转化率翻倍

#### 6 阶段 tabs

```
[欢迎话术] [破冰暖场] [信任建立] [需求挖掘] [成交话术] [售后跟进]
```

#### 每阶段表单

| 字段 | 类型 | 必填 | placeholder |
|---|---|---|---|
| 产品/服务名称 | input text | ✅ | 如：减脂训练营、护肤套装、英语课程 |
| 目标用户 | input text | 可选 | 如：25-35岁宝妈、职场白领 |
| 具体场景 | input text | 可选 | 如：客户看了朋友圈后主动咨询、老客户3个月没复购 |

按钮：`[生成话术]`

#### 操作 SOP

```
1. 进入 /private-domain，默认在"欢迎话术"tab
2. 用户【点其他 tab 切换阶段】
3. 在当前 tab 填表 → 点"生成话术"
4. AI 输出：
   - 话术全文（可复制）
   - 关键变量替换（如 {产品名} {价格}）
   - 多种风格变体（专业版 / 亲切版 / 销售版）
5. localStorage: 保存最后操作的 stage / product / 等
```

---

### 8.2.3 爆款元素自动生成 `/boom-generate`

- **H1**：爆款元素自动生成
- **副标题**：选择爆款元素组合，AI 自动生成 5 篇深度爆款文案，每篇至少 300 字，拒绝表面化

#### UI

##### 选择爆款元素（多选，22 种 4 组）

完整 4 组列表见 §Ⅹ.2

##### 可选设置

| 字段 | 类型 | placeholder |
|---|---|---|
| 行业领域 | input text | 当前：{industry}（可手动输入覆盖） |
| 主题方向 | input text | 如：减肥、理财、育儿... |

按钮：`[一键生成爆款文案]`

#### 操作 SOP

```
1. 进入 /boom-generate
2. 多选 N 个爆款元素
3. （可选）输入主题方向
4. 点"一键生成爆款文案"
   → AI 一次生成 5 篇文案，每篇至少 300 字
5. 用户可逐篇复制 / 调整再生成
```

---

## 8.3 三、内容创作类（4 个）

### 8.3.1 AI 智能生成 `/generate`

- **H1**：生成爆款文案
- **副标题**：选择脚本类型和爆款元素，输入主题，AI 为你生成 AIP 风格的短视频文案

#### UI 与 step/7 几乎相同：

- 20 类脚本单选
- 22 个爆款元素多选
- 文案主题 textarea（max 500 字）
- 字符计数：`0/500`

按钮：`[生成文案]`

> 与 step/7 区别：step/7 强调与 IP 流程串联（自动复用 step3/3b 的人设、step5 的选题），`/generate` 是独立调用版本（不读 step 数据）。

#### 操作 SOP

```
1. 选脚本类型
2. 多选爆款元素
3. 输入主题（max 500 字）
4. 点"生成文案"
5. 结果区按 AIP 方法论的"起承转合"结构输出
```

---

### 8.3.2 文案结构分析 `/analysis`

- **H1**：文案结构分析
- **副标题**：粘贴任意短视频文案，AI 将从结构、节奏、爆款元素等多维度深度分析

#### UI

| 字段 | 类型 | placeholder |
|---|---|---|
| 文案 | textarea | 粘贴需要分析的短视频文案（至少 10 个字）... |

字符计数：`0 字`

按钮：`[开始分析]`

#### 操作 SOP

```
1. 用户粘贴文案
2. 点"开始分析"
3. AI 输出：
   - 结构拆解（起承转合 / 起转合 / hook-body-cta 等）
   - 节奏分析（每段时长 / 留人率预测）
   - 爆款元素识别
   - 多维评分
   - 优化建议
```

> 与 /video-analysis 区别：`/video-analysis` 用于"解析爆款"（仿写），`/analysis` 用于"分析自己写的文案"（优化）。

---

### 8.3.3 短视频一键制作 `/video-production`

- **H1**：短视频一键制作
- **副标题**：输入文案，AI 自动生成分镜脚本、拍摄方案、口播提词器和剪辑指导

#### UI

| 字段 | 类型 | placeholder |
|---|---|---|
| 文案 | textarea | 粘贴你的短视频文案（至少 10 个字），AI 将为你生成完整的制作方案... |

按钮：`[生成制作方案]`

> 与 step/6 区别：step/6 输出"拍摄计划"（侧重前期准备），`/video-production` 输出"制作方案"（含剪辑指导，更全面）。

#### 操作 SOP

```
1. 粘贴文案 → 点"生成制作方案"
2. AI 输出：
   - 分镜脚本（同 step/6）
   - 拍摄方案（设备 / 灯光 / 服装）
   - 口播提词器（断句 / 重音）
   - 剪辑指导（卡点 / 特效 / 字幕样式）
```

---

### 8.3.4 获客型视频制作 `/acquisition-video`

- **H1**：获客型视频制作
- **副标题**：专为获客设计的短视频方案，让精准客户主动找上门

#### UI

| 字段 | 类型 | 必填 | placeholder |
|---|---|---|---|
| 选择行业 | dropdown | ✅ | 默认当前账号行业（📲 自媒体运营） |
| 目标客户画像 | textarea | ✅ | 描述您的理想客户，例如：想要创业的30-45岁宝妈群体，有一定积蓄但缺乏方向... |
| 产品/服务卖点 | textarea | ✅ | 描述您的核心卖点，例如：0基础可学、3个月回本、一对一指导... |

按钮：`[生成获客方案]`

#### 操作 SOP

```
1. 选行业 → 描述客户画像 → 描述卖点
2. 点"生成获客方案"
3. 输出：3 个不同角度的获客视频方案
   - 每个方案含：主题角度 / 钩子 / 内容结构 / CTA
```

---

## 8.4 四、智能工具类（4 个）

### 8.4.1 一键生成视频 `/ai-video` (STORYBOARD)

- **H1**：STORYBOARD（Orbitron 字体）
- **副标题**：专业分镜表生成器 · 文案一键转拍摄方案
- **模块标题**：专业分镜表生成器

#### UI

| 字段 | 类型 | 必填 | placeholder |
|---|---|---|---|
| 文案内容 | textarea | ✅ | 粘贴你的短视频文案，AI 将自动生成专业分镜表，可直接交给摄影师执行... |

字符计数：`0/5000`

##### 发布平台（5 选 1，icon 大格）

📱 抖音 / 🎬 快手 / 📕 小红书 / 📺 B站 / 📲 视频号

##### 视频类型（6 选 1）

| 类型 | 描述 |
|---|---|
| 口播 | 真人出镜讲述 |
| 剧情 | 故事情节演绎 |
| Vlog | 生活记录风格 |
| 产品展示 | 商品种草带货 |
| 街头采访 | 随机路人互动 |
| 教程 | 知识技能教学 |

按钮：`[一键生成专业分镜表]`

#### 输出

```
输入文案 → AI 生成 6-12 个专业分镜
每个分镜包含：景别、角度、运镜、情绪、台词
支持 5 大平台 × 6 种视频类型
一键导出 CSV 分镜表，直接交给团队执行
```

#### 操作 SOP

```
1. 粘贴文案（max 5000 字）
2. 选发布平台
3. 选视频类型
4. 点"一键生成专业分镜表"
5. 输出 6-12 个分镜（表格形式）
6. 用户可【一键导出 CSV】
```

---

### 8.4.2 语音对话 `/voice-chat` (VOICE CHAT)

- **H1**：VOICE CHAT
- **副标题**：语音对话 · 你的专属 IP 变现顾问
- **模块标题**：你的专属 IP 变现顾问

**自我介绍文案**：
> 有什么问题尽管问我，我会用大白话给你讲清楚，还会给你详细的解决方案和落地步骤。不管是短视频、直播、还是私域变现，我都能帮你搞定。

#### UI

| 字段 | 类型 | placeholder |
|---|---|---|
| 输入框 | input text | 有什么问题尽管问我... |

##### 推荐问题（quick prompts）

```
[我是新手，怎么从0开始做短视频变现？]
[帮我分析一下美业赛道怎么做IP]
[怎么写出让人停不下来的爆款文案？]
[直播带货有哪些实操技巧？]
[如何打造个人 IP 的记忆点？]
[小红书和抖音哪个更适合新手？]
```

#### 操作 SOP

```
1. 进入 /voice-chat
2. 历史从 localStorage.voice_chat_history 加载
3. 用户【点 quick prompt】或【输入问题】
4. AI 流式返回（推测有打字机效果）
5. 支持语音输入（mic 按钮 - 推测）
6. 支持 TTS 播放（speaker 按钮 - 推测）
7. 历史持久化到 localStorage
```

---

### 8.4.3 文案深度学习 `/deep-learning`

- **H1**：文案深度学习
- **副标题**：上传文件或粘贴文案样本，AI 将深度分析文案逻辑、包装风格，生成可复用的风格画像

#### UI

##### 输入方式 tabs

```
[上传文件] [粘贴文案] [批量粘贴]
```

##### 表单（粘贴模式）

| 字段 | 类型 | placeholder |
|---|---|---|
| 文案样本 | textarea | 粘贴一篇文案内容（口播文案、短视频文案、图文文案均可） |
| 学习档案名称 | input text | 学习档案名称（可选，如：XX老师的文案风格） |

按钮：`[添加这篇]` / `[开始深度学习（N篇文案）]`

##### 学习档案列表

```
学习档案 (0)
还没有学习档案
上传文件或添加文案样本，开始深度学习
```

#### 使用说明（产品里写明）

> **文件上传模式：**
> 1. 支持上传 PDF、Word（.doc/.docx）、TXT、Markdown、CSV 文件
> 2. 系统会自动提取文件中的文本内容，拆分成段落进行深度学习
> 3. 建议上传你的代表作品集、话术文档、文案素材库等
>
> **文案粘贴模式：**
> 4. 逐条粘贴或使用"批量粘贴"模式一次性添加多篇（用空行或 --- 分隔）
> 5. 最多支持 50 篇文案，建议添加 10 篇以上以获得更精准的风格分析
>
> **通用说明：**
> 6. AI 会深度分析文案逻辑（开头模式、结构、钩子技巧等）和包装风格
> 7. 分析完成后，点击"复制风格提示词"可将学习成果应用到文案生成中

#### 操作 SOP

```
1. 用户【选输入方式】（上传 / 粘贴 / 批量）
2. 添加 10+ 篇文案样本
3. 命名学习档案（如「XX老师的文案风格」）
4. 点"开始深度学习"
5. AI 分析每篇文案的开头模式、结构、钩子、风格
6. 生成"风格画像"（含风格提示词）
7. 用户【复制风格提示词】 → 粘到 step/7 或 /generate 的优化方向，让生成更贴合学习的风格
```

---

### 8.4.4 AIP 文案方法论知识库 `/knowledge`

- **H1**：AIP 文案方法论
- **副标题**：系统学习 AIP 的短视频文案创作方法论，掌握爆款文案的核心技巧

#### Tab 切换（4 大类知识）

```
[20 类脚本] [20 大爆款] [开头公式] [核心公式]
```

##### Tab 1: 20 类脚本

详见 §Ⅹ.3 的 20 类脚本完整列表。

每类卡片：
```
[emoji 简写]
[脚本类型名]
[一句话定位]
[详细方法论 / 核心要素 1)2)3)4)]
[实战案例 (N 个)] 按钮 → 展开案例
```

##### Tab 2: 20 大爆款

详见 §Ⅹ.2 的 22 个爆款元素（实际可能是 20 个核心 + 衍生）。

##### Tab 3: 开头公式

（推测）经典开头模板：
- 提问开头
- 反差开头
- 故事开头
- 数据开头
- 痛点开头
- ...

##### Tab 4: 核心公式

（推测）AIP 的"起承转合"公式 / 钩子-内容-CTA 公式 / 私域转化公式 等。

#### 操作 SOP

```
1. 进入 /knowledge → 默认在 "20 类脚本" tab
2. 用户【点 tab 切换】
3. 用户【点某脚本卡的"实战案例 (N 个)"】 → 展开实战案例列表
4. 顶部有【搜索脚本类型...】框
```

---

## 8.5 五、第二轮发现的 6 个模块（账号 / 历史 / 进化系统）

### 8.5.1 IP 诊断报告 `/diagnosis`

- **H1**：7 维度 IP 诊断报告
- **副标题**：像老师一样诊断你的 IP，找出问题，给出具体可执行的改进方案
- **菜单分类**：「智能」

#### 形态：8 步问卷向导

```
[步骤 1 / 8 · 基本信息]
[步骤 2 / 8 · ...]
...
[步骤 8 / 8 · 诊断结果]
```

#### Step 1 实测内容

| 字段 | 类型 | 必填 | placeholder |
|---|---|---|---|
| 你的行业 | input text | ✅ | 例如：美业、大健康、服装、教育培训... |
| 你的产品/服务 | input text | ✅ | 例如：皮肤管理项目、减脂训练营、女装定制... |
| 你目前的阶段 | radio (4 选 1) | ✅ | 起步期 / 成长期 / 爆发期 / 瓶颈期 |

阶段选项每个带描述：
- **起步期** · 刚开始做 IP，还在摸索中
- **成长期** · 有一定内容了，但变现不稳定
- **爆发期** · 内容有爆款，正在放大变现
- **瓶颈期** · 遇到增长瓶颈，需要突破

按钮：`[上一步]` / `[下一步]`

#### 操作 SOP

```
1. 用户进入 /diagnosis
2. 走完 8 步表单（每步问 1 个维度的状态）
3. 最后一步生成"7 维度 IP 健康度报告"，含每个维度评分 + 改进建议
```

### 8 步完整维度（**第三轮实测**）

| Step | 维度 | 副标题 | 自评项数 |
|---|---|---|---|
| 1 | 基本信息 | 行业 / 产品 / 阶段 | （表单填写）|
| 2 | **定位清晰度** | 赛道、产品、产品链条 | 3 项 |
| 3 | **账号包装** | 头像、昵称、简介 | 3 项 |
| 4 | **流量型内容** | 破圈引流，勾精准人群 | 2 项 |
| 5 | **价值型内容** | 干货教学，建立信任 | 2 项 |
| 6 | **案例型内容** | 展示结果，促进成交 | 3 项 |
| 7 | **人设型内容** | 让人记住你这个人 | 3 项 |
| 8 | **内容状态** | 真实、口语、有情绪 | 3 项 |

每步 UI 模式相同：
- 顶部："步骤 N / 8 · {维度名}"
- 大标题：维度名
- 副标题：维度描述
- 多个 checkbox（自评项）
- "补充说明 (选填，越详细诊断越准)" textarea
- 底部 [上一步] [下一步]（最后一步是 [生成诊断报告]）

### 完整自评项明细（实测）

#### Step 2 · 定位清晰度
- ☐ 已确定赛道方向
- ☐ 产品定位明确，知道卖什么
- ☐ 产品链条清晰（引流品→利润品→高端品）

#### Step 3 · 账号包装
- ☐ 头像是生活化的真人照片
- ☐ 昵称格式：小名/外号+行业（如：霖AIP·IP孵化）
- ☐ 简介包含：我是谁+解决什么问题+提供什么价值+案例

#### Step 4 · 流量型内容
- ☐ 有行业猎奇/奇葩/冷知识类选题
- ☐ 有单条视频破10万播放

#### Step 5 · 价值型内容
- ☐ 有干货/教知识/痛点解决方案类内容
- ☐ 有单条视频播放量超过20万

#### Step 6 · 案例型内容
- ☐ 有清晰的案例结果展示
- ☐ 有详细的服务/合作过程记录
- ☐ 有真实的用户评价/反馈

#### Step 7 · 人设型内容
- ☐ 有对人对事的态度/观点类内容
- ☐ 有从业故事/创业故事类内容
- ☐ 有做公益/体恤员工/孝顺父母等内容

#### Step 8 · 内容状态
- ☐ 内容是真实的，不是演的
- ☐ 说话是口语化的，不是念稿/播音腔
- ☐ 内容有情绪感染力

---

### 8.5.2 每日任务 `/daily-tasks`

- **菜单分类**：「智能」
- **核心提示**："AI老师正在为你制定今日任务..."

#### 推测形态

- AI 根据当前 IP 账号的状态（来自 stepData + diagnosis 数据），每天生成 3-5 个建议任务
- 任务形如：
  - 「今天发布 1 条 step/7 生成的文案」
  - 「优化 step/3 的简介」
  - 「回复粉丝评论 X 条」
- 完成后打卡 → 累计经验值 → 影响 /evolution 等级

#### UI 元素

按钮：`[添加账号]`（无活跃账号时显示）

> 实测当前账号下还在 loading 中，未抓到完整任务列表 UI。

---

### 8.5.3 智能体进化中心 `/evolution`

- **H1**：智能体进化中心
- **副标题**：你的智能体通过反馈学习和深度学习持续进化，越用越懂你
- **菜单分类**：「智能」

#### 5 级进化系统

```
🌱 L1 初始化   (0-4 反馈)
📚 L2 学习中   (5-19 反馈)
🌿 L3 成长期   (20-49 反馈)
🌳 L4 成熟期   (50-99 反馈)
👑 L5 大师级   (100+ 反馈)
```

升级条件：累计反馈数 + 学习档案数

#### 仪表盘 4 个核心指标

| 指标 | 含义 |
|---|---|
| 好评数 | 用户在功能页点 👍 的次数 |
| 待改进 | 用户点 👎 的次数 |
| 学习档案 | 来自 /deep-learning 上传的样本数 |
| 满意率 | 好评数 / (好评 + 待改进) % |

#### 5 大模块

| 模块 | 功能 |
|---|---|
| 进化等级 | 显示当前 L1-L5 + 升级条件提示 + 「触发进化」按钮 |
| 进化洞察 | 累计 3+ 反馈后点"触发进化"生成 AI 自我分析 |
| 最近反馈 | 在各功能 👍/👎 的历史记录 |
| 深度学习档案 | 关联 /deep-learning，可「新增学习」 |
| 进化设置 | 自动进化开关 / 进化方向选择 |

#### 进化方向（推测枚举）
- 综合优化（积累反馈后自动生成）
- 创意性优先
- 转化率优先
- 真实感优先

#### 操作 SOP

```
1. 用户在使用 /step/7 等功能时，看到结果点 👍 或 👎 反馈
2. 反馈累计到 5+ 后，/evolution 升级到 L2，可点"触发进化"
3. AI 分析所有反馈 → 生成"进化洞察"
4. 后续生成内容时，AI 会按洞察调整风格
5. 也可手动上传文案样本到"深度学习档案"加速进化
```

#### 关键 localStorage（推测）
- `aiip_evolution_l1_feedback` 反馈历史
- `aiip_evolution_insights` 洞察列表
- `aiip_evolution_settings` 自动进化开关

---

### 8.5.4 IP 账号管理 `/accounts`

- **H1**：IP 账号管理
- **副标题**：管理多个 IP 账号，每个账号独立配置行业、定位和人设
- **菜单分类**：「更多」
- **入口**：除菜单外，header「赵语AI」dropdown 底部「管理账号」也跳这

#### 账号卡片结构

```
┌─────────────────────────────────────┐
│ [ACTIVE 标]                         │
│ [赵 圆形头像]                        │
│ 赵语AI                              │
│ 企业服务 · 抖音                     │
│ 1-1000 粉                           │
│ 从零开始做 IP                        │
│ 定制智能体和 opc 培训                │
│ [删除] [编辑]（推测）               │
└─────────────────────────────────────┘
```

按钮：`[新建账号]`（顶部右侧）

#### 操作 SOP

```
1. 用户进入 /accounts → 调 ipAccounts.list 列出所有账号
2. 当前活跃账号顶部显示 ACTIVE 标
3. 点击其他账号 → 切换 active (ipAccounts.setActive)
4. 点「新建账号」→ 弹出表单（行业 / 平台 / 名字 / 业务描述）→ 创建后跳 /step/1
5. 编辑 / 删除（推测）
```

#### 头像生成
- 取 IP 账号名首字符（如「赵语AI」→ 显示「赵」）
- 圆形 + 金色背景 (`bg-gold/15`)

---

### 8.5.5 我的选题库 `/my-topics`

- **H1**：我的选题库
- **副标题**：你收藏的所有爆款选题都在这里，支持按类型筛选、一键导出和生成文案
- **菜单分类**：「更多」

#### UI 元素

| 元素 | 类型 |
|---|---|
| `[返回爆款选题]` | 顶部左侧返回按钮（跳 /step/5） |
| `[复制全部]` `[下载TXT]` | 顶部右侧操作 |
| 5 类筛选 tab | 全部 / 流量型 / 变现型 / 人设型 / 认知型 / 案例型 |
| 搜索框 | placeholder: 搜索选题、行业、产品... |
| 选题卡片列表 | 每个收藏的选题 |
| `[去生成选题]` | 空态 CTA |

#### 空态

```
还没有收藏任何选题
去爆款选题页面生成选题，点击红心即可收藏
[去生成选题] → 跳 /step/5
```

#### 操作 SOP

```
1. 用户在 /step/5 或 /trending 看选题时，点❤️心形按钮收藏
2. 来 /my-topics 看全部收藏 → 5 类 tab 切换
3. 点单个选题 → 跳 /step/7 文案生成（自动预填该选题作为 lastTopic）
4. 「下载 TXT」→ 导出当前 tab 下选题为 .txt 文件
```

#### 关键 localStorage（推测）
- `aiip_memory_acc_{accId}_my_topics` 收藏列表

---

### 8.5.6 历史记录 `/history`

- **H1**：历史记录
- **副标题**：查看和管理你生成的所有文案（共 N 条）
- **菜单分类**：「更多」

#### 历史卡片结构

```
┌──────────────────────────────────────────┐
│ [脚本类型 tag] 搞辩论                     │
│ [元素 emoji] 🔄 反差 🔍 猎奇 🔥 借势 ...   │
│ 主题：为什么有的人赚钱那么轻松             │
│ 2026/4/14 15:33:43                       │
│ [查看] [复制] [删除]（推测）              │
└──────────────────────────────────────────┘
```

#### 数据来源
- 每次 /step/7 或 /generate 生成文案后，自动写入历史
- 关联当前活跃 IP 账号

#### 操作 SOP

```
1. 用户进入 /history → 列出所有生成历史（按时间倒序）
2. 点单条 → 展开看完整文案 / 跳回 /step/7 编辑
3. 可复制 / 删除单条
4. （推测）支持按脚本类型 / 元素 筛选
```

#### 关键 localStorage / API（推测）
- 后端 `aiHistory.list` / `aiHistory.delete`
- 或 localStorage `aiip_memory_acc_{accId}_history`

---

# Ⅸ · 辅助页面

## 9.1 使用说明 `/guide` (USER GUIDE)

- **H1**：USER GUIDE
- **副标题**：产品使用说明 · 功能详解 · 最佳实践

#### 页面结构

##### 1. 推荐使用流程

```
[深度学习] → [设计变现] → [创作内容] → [制作视频] → [私域成交]
  批量文案分析  规划盈利模式  爆款文案生成  AI 辅助制作   转化变现
```

##### 2. 系统概览

3 个步骤介绍：
1. **什么是 AIP 智能体？** - AI 工具简介
2. **核心定位** - 从行业洞察 → 内容创作 → 流量变现
3. **使用前准备** - 登录账号 / 选行业 / 选功能模块

实用技巧（提示框）：
- 建议先完成行业选择，这样 AI 会根据你的行业提供更精准的建议
- 所有 AI 生成的内容都可以复制和导出

##### 3. 13 个功能模块详解（带卡片）

| 模块 | 一句话 |
|---|---|
| 爆款库 | 全网爆款内容实时追踪 |
| 爆款解析 | 拆解爆款视频的成功密码 |
| 呈现形式 | 多样化的内容呈现方式 |
| 变现模型 | 定制你的 IP 变现策略 |
| 私域成交 | 打造高转化的私域成交体系 |
| 爆款生成 | 融合爆款元素一键生成文案 |
| 生成文案 | AI 智能文案创作与优化 |
| 文案分析 | AI 分析文案结构和优化建议 |
| AI 视频 | 文案一键转视频分镜 |
| 语音对话 | AI 语音智能助手 |
| 深度学习 | 批量添加文案，AI 深度分析风格逻辑 |
| 视频制作 | AI 辅助视频脚本制作 |
| 获客视频 | 制作高转化获客视频方案 |

每张卡片可点击展开详细使用步骤。

顶部搜索框：「搜索功能说明...」

##### 4. 常见问题（FAQ）

| 问 | 答 |
|---|---|
| AI 生成的内容可以直接使用吗？ | AI 生成的内容是高质量的初稿，建议根据你的实际情况和个人风格进行适当调整后使用。 |
| 语音对话支持哪些语言？ | 目前主要支持中文语音识别和对话，AI 回答也以中文为主。 |
| AI 视频功能可以直接生成视频吗？ | 目前 AI 视频功能会生成详细的分镜脚本和场景图片，你可以根据这些素材在剪辑软件中快速制作视频。 |
| 如何让 AI 更了解我的风格？ | 使用'智能进化'功能，上传你的代表作品，AI 会学习你的写作风格，后续生成的内容会更贴合你的特点。 |
| 数据会被保存吗？ | 你的所有生成记录都会保存在'历史记录'中，可以随时查看和复用。 |

---

## 9.2 IP 方案查看 `/ip-plan`

- **H1**：我的 IP 方案
- **顶部按钮**：`[返回首页]` `[刷新]`

#### 进度条

```
已完成 4 / 9 步
IP 打造进度: 44%
[████████░░░░░░░░░░░░]
```

#### 9 个 step 卡片网格

每张卡片：
```
┌──────────────────┐
│ [emoji] 步骤名    │
│ 已完成 / 未完成    │
│                  │
│ 数据已保存        │
│                  │
│ [查看详情]/[去完成] │
└──────────────────┘
```

底部 CTA：「还有 N 步未完成，继续打造你的 IP 吧！」 + `[继续下一步]`

#### 操作 SOP

```
1. 进入 /ip-plan
2. 调 stepData.getAll → 算出每步完成状态
3. 已完成的：显示"查看详情"按钮 → 跳对应 step 看上次结果
4. 未完成的：显示"去完成"按钮 → 跳对应 step 表单
5. 用户【点"刷新"】 → 重新拉数据（避免数据过期）
6. 用户【点"继续下一步"】 → 跳第一个未完成的 step
```

---

## 9.3 404 页 `/step/2` 等无效路由

- **H1**：404
- **H2**：页面未找到
- **正文**：抱歉，您访问的页面不存在。该页面可能已被移动或删除。
- **按钮**：`[返回首页]`

---

# Ⅹ · 核心方法论数据资产

## Ⅹ.1 全局常量 - 5 个目标平台

```typescript
export const PLATFORMS = [
  { key: 'douyin',       label: '抖音',      emoji: '📱', icon: 'douyin' },
  { key: 'xiaohongshu',  label: '小红书',    emoji: '📕', icon: 'xiaohongshu' },
  { key: 'shipinhao',    label: '视频号',    emoji: '📺', icon: 'shipinhao' },
  { key: 'kuaishou',     label: '快手',      emoji: '🎬', icon: 'kuaishou' },
  { key: 'bilibili',     label: 'B站',       emoji: '📺', icon: 'bilibili' }
]
```

## Ⅹ.2 22 个爆款元素（4 组分类）

```typescript
export const HOT_ELEMENTS = {
  // 经典元素 (11)
  classic: [
    { key: 'greed',        emoji: '💰', label: '贪念' },
    { key: 'fear',         emoji: '😨', label: '恐惧' },
    { key: 'curiosity',    emoji: '🔍', label: '猎奇' },
    { key: 'contrast',     emoji: '🔄', label: '反差' },
    { key: 'worst',        emoji: '⚠️', label: '最差' },
    { key: 'leverage',     emoji: '🔥', label: '借势' },
    { key: 'resonance',    emoji: '💬', label: '共鸣' },
    { key: 'empathy',      emoji: '🤝', label: '共情' },
    { key: 'small_big',    emoji: '🎯', label: '以小搏大' },
    { key: 'low_cost_high', emoji: '📈', label: '低成本高回报' },
    { key: 'low_cost_unknown', emoji: '🎰', label: '低成本未知回报' }
  ],
  // 情绪驱动 (2)
  emotion: [
    { key: 'anger',     emoji: '😡', label: '愤怒' },
    { key: 'surprise',  emoji: '😲', label: '惊喜' }
  ],
  // 内容策略 (6)
  content: [
    { key: 'trend',         emoji: '🔥', label: '热点' },
    { key: 'controversy',   emoji: '💬', label: '争议' },
    { key: 'reveal',        emoji: '🔓', label: '揭秘' },
    { key: 'list',          emoji: '📋', label: '清单' },
    { key: 'challenge',     emoji: '🎯', label: '挑战' },
    { key: 'transformation', emoji: '🦋', label: '蜕变' }
  ],
  // 转化驱动 (4)  
  conversion: [
    { key: 'scarcity',     emoji: '⏳', label: '稀缺' },
    { key: 'social_proof', emoji: '👍', label: '社会证明' },
    { key: 'authority',    emoji: '🎓', label: '权威' },
    { key: 'benefit',      emoji: '🎁', label: '利益' }
  ]
}
// 共 11 + 2 + 6 + 4 = 23（部分元素跨组复用，实际去重后约 22 个）
```

## Ⅹ.3 20 类脚本

```typescript
export const SCRIPT_TYPES = [
  { key: 'opinion',      emoji: '聊', label: '聊观点',  desc: '表达个人观点，引发共鸣，适合知识分享类账号',
    methodology: '聊观点脚本适合表达个人见解和行业洞察。核心要素：1）选择有争议性或共鸣性的话题；2）用数据或案例支撑观点；3）给出独特的角度和见解；4）引导观众参与讨论。' },
  { key: 'process',      emoji: '晒', label: '晒过程',  desc: '展示操作过程，平台超大流量体，适合教程类内容',
    methodology: '晒过程脚本是平台超大流量体。核心要素：1）展示完整的操作过程；2）声画分离，画面展示过程，声音讲解要点；3）任务型脚本设定明确目标；4）元素拆解让内容更丰富。' },
  { key: 'knowledge',    emoji: '教', label: '教知识',  desc: '教学类内容，传递价值，适合专业领域分享',
    methodology: '教知识脚本包含五个子模板：解题型、案例型、推导型、建构型。核心是提供实用价值，让观众有获得感。' },
  { key: 'story',        emoji: '讲', label: '讲故事',  desc: '故事型脚本，塑造人设，适合个人品牌打造',
    methodology: '讲故事脚本是塑造人设的通关密码。包含：小商业成功故事型、干货英雄型、经历型。故事要有情节起伏和情感共鸣。' },
  { key: 'comedy',       emoji: '尬', label: '尬段子',  desc: '搞笑类内容，娱乐性强，适合泛娱乐账号',
    methodology: '尬段子脚本以娱乐性为主。核心要素：1）设置出人意料的笑点；2）利用反转和误解制造笑料；3）结合热点话题增加传播性。' },
  { key: 'product',      emoji: '说', label: '说产品',  desc: '以变现为目标的产品脚本，适合带货和商业推广',
    methodology: '说产品脚本以变现为目标。核心要素：1）不直接推销，而是通过场景带入；2）展示产品解决的痛点；3）用对比突出产品优势。' },
  { key: 'review',       emoji: '做', label: '做测评',  desc: '产品/服务真实测评，横向对比，适合种草和消费决策',
    methodology: '做测评脚本适合种草和消费决策。核心要素：1）真实体验产品/服务；2）多维度横向对比；3）客观分析优缺点；4）给出明确购买建议。' },
  { key: 'expose',       emoji: '揭', label: '揭内幕',  desc: '揭露行业内幕/潜规则，满足窥探欲，引发传播',
    methodology: '揭内幕脚本能快速吸引注意力。核心要素：1）揭露行业不为人知的内幕；2）用具体数据和案例支撑；3）给出避坑建议；4）建立专业人设。' },
  { key: 'challenge',    emoji: '做', label: '做挑战',  desc: '设定挑战目标并记录过程，制造悬念和期待',
    methodology: '做挑战脚本能制造悬念和期待。核心要素：1）设定有难度的目标；2）真实记录过程；3）展示困难和突破；4）结果揭晓制造高潮。' },
  { key: 'interview',    emoji: '做', label: '做采访',  desc: '街头采访/人物访谈，真实反应引发共鸣',
    methodology: '做采访脚本能获取真实反应。核心要素：1）问题要有争议性或共鸣性；2）被采访者反应要真实；3）剪辑节奏要快；4）结尾要有总结或反转。' },
  { key: 'daily',        emoji: '拍', label: '拍日常',  desc: '记录真实生活/工作日常，打造真实人设',
    methodology: '拍日常脚本打造真实人设。核心要素：1）展示真实生活/工作状态；2）不过度修饰，保持真实感；3）融入个人价值观；4）让观众产生代入感。' },
  { key: 'transform',    emoji: '秀', label: '秀蜕变',  desc: '展示前后对比/成长蜕变，激励人心',
    methodology: '秀蜕变脚本激励人心。核心要素：1）展示明显的前后对比；2）分享蜕变过程和方法；3）提炼可复制的经验；4）给观众希望和动力。' },
  { key: 'debate',       emoji: '搞', label: '搞辩论',  desc: '正反观点对抗，引发讨论和互动',
    methodology: '搞辩论脚本引发讨论。核心要素：1）选择有争议的话题；2）展示正反两方观点；3）引导观众参与讨论；4）用评论区互动提升流量。' },
  { key: 'list',         emoji: '列', label: '列清单',  desc: '盘点型内容，信息密度高，收藏率高',
    methodology: '列清单脚本信息密度高。核心要素：1）数字要具体，标题要有吸引力；2）每条简洁有力；3）排序有逻辑；4）适合收藏和分享。' },
  { key: 'reaction',     emoji: '看', label: '看反应',  desc: '记录真实反应/惊喜时刻，情绪感染力强',
    methodology: '看反应脚本情绪感染力强。核心要素：1）反应要真实有趣；2）选择能引发强烈情绪的内容；3）剪辑节奏要快；4）加入个人观点和评论。' },
  { key: 'qna',          emoji: '答', label: '答粉丝',  desc: '回答粉丝提问，增强互动和粘性',
    methodology: '答粉丝脚本增强互动。核心要素：1）选择粉丝真正关心的问题；2）回答要专业且有价值；3）引导更多粉丝提问；4）建立专家人设。' },
  { key: 'collab',       emoji: '搞', label: '搞联动',  desc: '与其他博主/品牌联动，互相引流',
    methodology: '搞联动脚本互相引流。核心要素：1）选择受众重叠的博主；2）设计有趣的互动环节；3）双方都有价值输出；4）互相导流引导关注。' },
  { key: 'behind',       emoji: '幕', label: '幕后花絮', desc: '展示幕后制作过程，增加真实感和信任',
    methodology: '幕后花絮脚本增加信任。核心要素：1）展示制作过程的真实一面；2）分享幕后故事和心得；3）让观众感受到用心和专业；4）拉近与观众的距离。' },
  { key: 'trend_news',   emoji: '追', label: '追热点',  desc: '快速跟进热点话题，借势获取流量',
    methodology: '追热点脚本借势获流。核心要素：1）快速反应，抢占先机；2）独特角度解读热点；3）结合自身行业领域；4）提供有价值的视角。' },
  { key: 'motivation',   emoji: '打', label: '打鸡血',  desc: '励志/激励型内容，传递正能量，引发共鸣',
    methodology: '打鸡血脚本传递正能量。核心要素：1）真实的奋斗故事；2）具体的方法论；3）激励性的金句；4）号召行动。' }
]
```

## Ⅹ.4 56 个行业（5 大类分组）

```typescript
export const INDUSTRIES = {
  // 🏠 生活服务 (18)
  '生活服务': [
    { key: 'beauty',         emoji: '💅', label: '美业',     keywords: ['美容院', '美发', '美甲', '美睫', '纹绣'] },
    { key: 'cosmetics',      emoji: '💄', label: '美妆护肤' },
    { key: 'food',           emoji: '🍜', label: '餐饮美食' },
    { key: 'tea_coffee',     emoji: '☕', label: '茶饮咖啡' },
    { key: 'liquor',         emoji: '🍷', label: '酒水' },
    { key: 'health',         emoji: '🏥', label: '健康养生' },
    { key: 'medical',        emoji: '🩺', label: '医疗健康' },
    { key: 'psychology',     emoji: '🧠', label: '心理咨询' },
    { key: 'fitness',        emoji: '💪', label: '运动健身' },
    { key: 'sports',         emoji: '⚽', label: '体育运动' },
    { key: 'baby_parenting', emoji: '👶', label: '母婴亲子' },
    { key: 'travel',         emoji: '✈️', label: '旅游出行' },
    { key: 'pet',            emoji: '🐾', label: '宠物' },
    { key: 'wedding',        emoji: '💍', label: '婚庆婚嫁' },
    { key: 'local',          emoji: '📍', label: '本地生活' },
    { key: 'cleaning',       emoji: '🧹', label: '家政服务' },
    { key: 'logistics',      emoji: '📦', label: '物流快递' },
    { key: 'auto_service',   emoji: '🔧', label: '汽车服务' }
  ],
  // 🛒 电商零售 (13)
  '电商零售': [
    { key: 'apparel',        emoji: '👗', label: '服装穿搭' },
    { key: 'luxury',         emoji: '👜', label: '奢侈品' },
    { key: 'shoes_bags',     emoji: '👟', label: '鞋靴箱包' },
    { key: 'auto',           emoji: '🚗', label: '汽车' },
    { key: 'ecommerce',      emoji: '🛒', label: '电商零售' },
    { key: 'fresh',          emoji: '🥬', label: '生鲜配送' },
    { key: 'home_appliance', emoji: '📺', label: '家电' },
    { key: 'home',           emoji: '🛋️', label: '家装家居' },
    { key: 'jewelry',        emoji: '💎', label: '珠宝饰品' },
    { key: 'supplement',     emoji: '💊', label: '营养保健' },
    { key: 'daily',          emoji: '🧴', label: '日用百货' },
    { key: 'books',          emoji: '📖', label: '图书文创' },
    { key: 'second_hand',    emoji: '♻️', label: '二手闲置' }
  ],
  // ✍️ 内容创作 (7)
  '内容创作': [
    { key: 'self_media',  emoji: '📲', label: '自媒体运营' },
    { key: 'photo',       emoji: '📷', label: '摄影摄像' },
    { key: 'design',      emoji: '🎨', label: '设计创意' },
    { key: 'game',        emoji: '🎮', label: '游戏' },
    { key: 'entertainment', emoji: '🎬', label: '娱乐' },
    { key: 'media',       emoji: '📰', label: '文化传媒' },
    { key: 'social',      emoji: '❤️', label: '情感社交' }
  ],
  // 💼 专业服务 (14)
  '专业服务': [
    { key: 'edu',           emoji: '📚', label: '教育培训' },
    { key: 'k12',           emoji: '🎒', label: 'K12教育' },
    { key: 'preschool',     emoji: '🧒', label: '早教托育' },
    { key: 'art_edu',       emoji: '🎨', label: '艺术培训' },
    { key: 'language',      emoji: '🌍', label: '语言培训' },
    { key: 'it_edu',        emoji: '💻', label: 'IT培训' },
    { key: 'real_estate',   emoji: '🏠', label: '房产' },
    { key: 'finance',       emoji: '💰', label: '金融理财' },
    { key: 'tech',          emoji: '📱', label: '科技数码' },
    { key: 'law',           emoji: '⚖️', label: '法律咨询' },
    { key: 'franchise',     emoji: '🤝', label: '招商加盟' },
    { key: 'recruitment',   emoji: '👔', label: '人力招聘' },
    { key: 'enterprise',    emoji: '🏢', label: '企业服务' },
    { key: 'gov',           emoji: '🏛️', label: '政务公益' }
  ],
  // 🏭 产业制造 (4)
  '产业制造': [
    { key: 'agriculture',   emoji: '🌾', label: '农业农村' },
    { key: 'manufacturing', emoji: '🏭', label: '工业制造' },
    { key: 'construction',  emoji: '🏗️', label: '建筑工程' },
    { key: 'other',         emoji: '🔧', label: '其他行业' }
  ]
}
// 注：部分行业（如 emoji '🎨'、'📺'）在源站存在重复 emoji 但 label 不同
// 5 大类总计：18 + 13 + 7 + 14 + 4 = 56
```

## Ⅹ.5 私域成交 6 阶段

```typescript
export const PRIVATE_DOMAIN_STAGES = [
  { key: 'welcome',  label: '欢迎话术', desc: '新好友添加后的第一印象话术' },
  { key: 'icebreak', label: '破冰暖场' },
  { key: 'trust',    label: '信任建立' },
  { key: 'discover', label: '需求挖掘' },
  { key: 'close',    label: '成交话术' },
  { key: 'follow',   label: '售后跟进' }
]
```

## Ⅹ.6 14 种呈现形式

详见 §Ⅷ.1.3。

## Ⅹ.7 9 步主流程映射

```typescript
export const STEPS = [
  { key: 'step1',  label: '行业选择',  emoji: '🎯', menu: '策划' },
  { key: 'step3',  label: '账号包装',  emoji: '📝', menu: '策划' },
  { key: 'step3b', label: '人设定制',  emoji: '🎭', menu: '策划' },
  { key: 'step4',  label: '执行计划',  emoji: '📅', menu: '策划' },
  { key: 'step4b', label: '变现路径',  emoji: '💰', menu: '策划' },
  { key: 'step5',  label: '爆款选题',  emoji: '🔥', menu: '创作' },
  { key: 'step6',  label: '拍摄计划',  emoji: '🎬', menu: '策划' },
  { key: 'step7',  label: '文案生成',  emoji: '✍️', menu: '创作' },
  { key: 'step8',  label: '直播策划',  emoji: '📡', menu: '策划' }
]
// step2 不存在（404），原因可能是产品迭代时被合并/删除
```

---

# Ⅺ · 复刻路线图建议

## 11.1 推荐技术栈（不依赖 Manus 平台）

```yaml
前端:
  - Vite + React 18 + TypeScript
  - React Router v6
  - Tailwind CSS 3 + shadcn/ui
  - Zustand (状态管理)
  - tRPC client + React Query
  - lucide-react (图标)
  - Google Fonts (Orbitron / Rajdhani / Noto Sans SC)

后端:
  - Node.js + Hono (轻量) 或 Express
  - tRPC server
  - PostgreSQL + Prisma
  - Redis (会话 / 限流)
  - S3 / 阿里 OSS (文件上传)

AI:
  - Claude Sonnet 4.6 / GPT-4o（文本生成）
  - DALL-E 3 / Midjourney API（头像 / 背景图参考图）
  - 国产 Sora 类（如腾讯云、字节）（视频分镜→视频，可选）
  - Whisper（语音对话 STT）
  - TTS API（语音对话 TTS）
  - 文件解析：pdf-parse / mammoth (Word) / fast-csv

认证:
  - Google OAuth
  - 推荐再加：微信 / 手机号

部署:
  - 前端：Vercel / Cloudflare Pages
  - 后端：Railway / Fly.io / 自建 K8s
  - 数据库：Supabase / Neon
```

## 11.2 复刻拆分建议（按 9 个 Phase）

| Phase | 目标 | 关键交付 |
|---|---|---|
| **P0 · 基础设施** | 项目骨架 / 设计系统 / 认证 | Vite 工程、Tailwind 配置、shadcn 组件、Google OAuth、Header 布局 |
| **P1 · 数据底座** | tRPC + DB + 用户系统 | User/IpAccount/StepData schema、tRPC routers、localStorage 缓存 hook |
| **P2 · 首页 + 路由地图** | 静态首页 + 全部 26 个空页面占位 | Hero / FUNCTION MATRIX / WORKFLOW + 26 个 placeholder 路由 |
| **P3 · IP 主流程 9 步** | step/1, 3, 3b, 4, 4b, 5, 6, 7, 8 + /ip-plan | 各 step 的表单 + 结果展示 + AI 调用 |
| **P4 · 创作模块** | /generate, /analysis, /video-analysis, /boom-generate | 4 个文案生成 / 分析模块 |
| **P5 · 视频模块** | /video-production, /acquisition-video, /ai-video, /trending | 4 个视频相关模块 |
| **P6 · 私域 + 变现** | /monetization, /private-domain | 2 个变现 SOP 模块 |
| **P7 · 智能工具** | /voice-chat, /deep-learning | 语音对话流式输出 + 深度学习风格分析 |
| **P8 · 知识库 + 静态页** | /knowledge, /guide, /present-styles | 方法论展示 / 使用说明 |

## 11.3 关键技术挑战 & 解决方案

| 挑战 | 解决方案 |
|---|---|
| **AI prompt 设计** | 把每个 step 的 prompt 模板独立成 .md 文件，按场景调用；建议用 Claude Sonnet 4.6（中文好 + 长输出稳） |
| **结果结构化** | 每个生成结果都用 zod schema 验证；prompt 里强制要求 JSON 输出 |
| **流式响应** | step3/4b 这种结果很长的，用 SSE 流式输出，提升体验 |
| **localStorage 同步** | 写 useStepData hook：本地优先 + 后端兜底 + 自动同步 |
| **多 IP 账号切换** | header 加账号切换器，切换时刷新 stepData 缓存 |
| **并发限流** | 后端用 Redis + token bucket，单用户每分钟最多 N 次 AI 调用 |
| **文件解析** | 上传后异步解析（PDF/Word/CSV），结果缓存 |
| **图像生成** | step3 的头像/背景图参考图，调用图像 API 异步返回 |

## 11.4 优先级建议

**MVP（4 周可上线）**：
- P0 + P1 + P2 + P3 (step1/3/3b/4b/5/7) + P8 (knowledge / guide)
- 即：能完整走 IP 打造的核心 5 步 + 看方法论

**完整版（8-10 周）**：
- 加 P4 P5 P6 P7

**优化版（持续迭代）**：
- 视频生成（真做出 mp4）
- 实时直播间话术挂件
- 多人协作 / 团队版
- 移动 App

---

# Ⅻ · 补抓的动态 UI 细节（Phase 1-5 实测）

> 第二轮补抓产物，基于 sally zhao 用户当前激活账号 = **赵语AI**（企业服务·抖音, 7/9 步, 78%）
> 详细 JSON：`~/Desktop/aiipznt-clone-research/dynamic/`

## 12.1 Header dropdown 完整结构（修正 §Ⅴ.2）

### 4 个一级菜单的二级项（去重后）

| 一级 | 二级项 |
|---|---|
| **创作**（5） | 爆款选题 / 文案生成 / 文案解析 / 获客视频 / 呈现形式 |
| **策划**（8） | 选择行业 / 账号包装 / 人设定制 / 执行计划 / 变现路径 / 拍摄计划 / 直播策划 / 私域成交 |
| **智能**（6） | IP诊断 / 每日任务 / AI视频 / 语音对话 / 深度学习 / 进化仪表盘 |
| **更多**（6） | 账号管理 / 方法论 / 使用说明 / 我的IP方案 / 我的选题库 / 历史记录 |

### Dropdown 样式（shadcn DropdownMenu 风格）

```css
.absolute.top-full.left-0.mt-1.py-1.min-w-[180px]   /* 创作/策划/智能/更多 */
.absolute.top-full.right-0.mt-1.py-1.min-w-[200px]  /* 赵语AI 账号切换 */
.rounded-xl.border.border-gold/15
.bg-popover/95.backdrop-blur-xl
.text-popover-foreground
.shadow-lg.shadow-gold/5
.z-50
```

### Trigger 行为
- **Click 触发**（不是 hover）
- 每个一级菜单 button 后跟 `lucide-chevron-down h-3 w-3 transition-transform`（展开时旋转）

## 12.2 「赵语AI」是 IP 账号切换器（**重大修正**）

**原 SPEC §Ⅴ.3 把「赵语AI」误判为 AI 助手浮窗，实际是 IP 账号切换 dropdown**：

```
[赵语AI ▼]   ← header 右侧按钮
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

按钮文字 = 当前活跃 IP 账号的名称（不是固定的"赵语AI"）。

复刻方案：用 shadcn `DropdownMenu`，trigger 显示 `{currentAccount.name}`，list 显示 `ipAccounts.list` 调用结果，每项有 emoji + name + industry + platform，底部固定「管理账号」入口跳 `/accounts`。

## 12.3 用户菜单 = 不存在

实测：「sally zhao」chip 是**纯展示**（`<div>` 不可点），左边带个跳动的金色圆点（`animate-ping bg-gold-light` 在线状态）。

「LOGOUT」是独立的 icon-only button（`lucide-log-out h-4 w-4`），单击直接登出**无确认**。

无传统的"用户菜单"。设置/账号/套餐都散落在 dropdown「更多」→「账号管理」(/accounts)。

## 12.4 移动端导航（< 1024px lg breakpoint）

不是 drawer / sheet，是 **header 下方展开的下拉面板**：

```css
.lg:hidden                            /* 仅小于 lg 显示 */
.border-t.border-gold/10              /* 顶部金色细边 */
.bg-background/95.backdrop-blur-2xl   /* 玻璃模糊背景 */
.max-h-[70vh].overflow-y-auto         /* 最高 70vh，超出滚动 */
```

**布局**：
```
┌──────────────────────────────────┐
│  Header (logo + 汉堡菜单按钮)        │
├──────────────────────────────────┤
│  创作                             │  ← 4 大类分组标题（Rajdhani 字体）
│    ├ 爆款选题                     │
│    ├ 文案生成                     │
│    ├ 文案解析                     │
│    ├ 获客视频                     │
│    └ 呈现形式                     │
│  策划                             │
│    ├ 选择行业 ... (8 项)          │
│  智能                             │
│    ├ IP诊断 ... (6 项)            │
│  更多                             │
│    ├ 账号管理 ... (6 项)          │
│  ───────                          │
│  sally zhao                      │  ← 用户区固定底部
│  退出                             │
└──────────────────────────────────┘
```

汉堡按钮：`lg:hidden p-2 text-muted-foreground hover:text-gold transition-colors` + `lucide-menu h-5 w-5`

## 12.5 进度条样式（/ip-plan 完整结构）

```html
<!-- 顶部页头 -->
<div class="mb-8">
  <a href="/">
    <button class="...h-8 rounded-md gap-1.5 px-3 mb-4 text-muted-foreground hover:text-foreground">
      [lucide-arrow-left h-4 w-4 mr-1] 返回首页
    </button>
  </a>
  <div class="flex items-center justify-between flex-wrap gap-4">
    <div>
      <h1 class="text-3xl font-bold" style="font-family:Orbitron,Rajdhani,sans-serif">
        [lucide-file-text inline h-7 w-7 mr-2 text-gold] 我的IP方案
      </h1>
      <p class="text-muted-foreground">
        已完成 <span class="text-gold font-bold">4</span> / 9 步
      </p>
    </div>
    <button class="...border-gold/30 text-gold hover:bg-gold/10">
      [lucide-refresh-cw h-4 w-4 mr-1] 刷新
    </button>
  </div>
</div>

<!-- 进度条 -->
<div class="mb-8 glass-card rounded-xl p-4">
  <div class="flex items-center justify-between text-sm mb-2">
    <span class="text-muted-foreground">IP打造进度</span>
    <span class="text-gold font-bold">44%</span>
  </div>
  <div class="w-full h-3 bg-muted/20 rounded-full overflow-hidden">
    <div class="h-full bg-gradient-to-r from-gold to-gold-dark rounded-full"
         style="width: 44.4444%"></div>
  </div>
</div>

<!-- 已完成 step 卡 -->
<div class="space-y-4">
  <div class="glass-card rounded-xl p-5 border border-gold/20"
       style="opacity:1;transform:none">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/15">
          [lucide-layout-grid h-5 w-5 text-gold]    <!-- 不同 step 用不同 icon -->
        </div>
        <div>
          <h3 class="text-sm font-bold">行业选择</h3>
          <p class="text-xs text-muted-foreground">已完成</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        [lucide-circle-check h-5 w-5 text-gold]    <!-- 完成状态对号 -->
        <a href="/step/1">
          <button class="...h-8 text-xs">查看详情 [lucide-chevron-right]</button>
        </a>
      </div>
    </div>
    <div class="pt-3 border-t border-border/20">
      <div class="text-sm">
        <span class="text-muted-foreground">已选择行业：</span>
        <span class="text-gold font-medium">other</span>
      </div>
    </div>
  </div>
</div>
```

**未完成 step 卡**：
- 圆框背景：`bg-gold-dim/15`（灰金色，弱化）
- icon：`text-gold-dim`
- 右侧按钮：`[去完成]` 替代 `[查看详情]`，无对号

**进度推算**：完成 N/9 → `width: ${N/9*100}%`（精确到小数 4 位）

## 12.6 各 step 的 lucide icon（已识别）

| Step | Lucide Icon |
|---|---|
| 行业选择 | `lucide-layout-grid` |
| 账号包装 | `lucide-fingerprint` |
| ... | (需补抓其他) |

## 12.7 Toast / 错误提示（Sonner）

**库**：`npm install sonner` (npm 第三方包，maintained by Emil Kowalski)

**根组件**（在 root 处加 1 次）：
```jsx
import { Toaster } from 'sonner';
<Toaster position="bottom-right" />
```

**触发**：
```js
import { toast } from 'sonner';
toast.success('已复制简介')          // 成功
toast.error('请输入你的个人信息')    // 错误
```

**样式属性**（实测从 sonner 默认）：
```css
--width: 356px
--gap: 14px
--offset-bottom: 24px
--offset-right: 24px
--mobile-offset: 16px
--normal-bg: var(--popover)
--normal-text: var(--popover-foreground)
--normal-border: var(--border)
```

**类型**：
- `data-type="success"` → 绿色对号填充图标
- `data-type="error"` → 红色感叹号填充图标

**实测文案**：
- 复制按钮 → `已复制简介` / `已复制头像方案` / 等（按节内容动态）
- 必填校验 → `请输入你的个人信息`

## 12.8 Loading UI

### 整页 loading（如 /ip-plan 等待 stepData.getAll）

```jsx
<div class="flex items-center justify-center h-[60vh]">
  [lucide-loader-circle h-8 w-8 animate-spin text-gold]
</div>
```

### 局部加载中
- 文案显示 `加载中...` / `SYSTEM LOADING...` / `正在思考中，马上给你答案...`
- 按钮内可能加 spinner（实测 /video-analysis 太快没截到）

## 12.9 /voice-chat 对话气泡

```jsx
{/* 用户消息（右对齐） */}
<div className="flex justify-end">
  <div className="...bubble-user">
    {message.text}
    <span className="...time">12:54</span>
  </div>
</div>

{/* AI 消息 / loading（左对齐） */}
<div className="flex justify-start">
  <div className="...bubble-ai">
    {isLoading ? '正在思考中，马上给你答案...' : message.text}
  </div>
</div>
```

气泡布局用 `flex justify-end / justify-start` 控制左右对齐（不用绝对定位）。

## 12.10 /step/1 "自定义输入行业" — inline 切换

不是 modal，是同页面 **状态机切换**：

| 状态 | UI 展示 |
|---|---|
| `mode = 'list'` | 56 行业网格 + 5 大类 tab + 搜索框 + 「自定义输入行业」按钮 |
| `mode = 'custom'` | 标题「自定义行业」 + 输入框（placeholder：宠物美容、新能源汽车...）+ 「返回选择列表」按钮 |

输入框 placeholder：`输入你的行业名称，如：宠物美容、新能源汽车、心理咨询...`

## 12.11 React 源码线索（来自 data-loc 属性）

实测 React 组件每个 DOM 都带 `data-loc` 属性，暴露源码位置：

| 组件文件 | 用途 |
|---|---|
| `client/src/components/Navbar.tsx` | header (line 117=root, 120=logo, 135=nav, 141=右侧 div, 151=user chip, 165=赵语AI, 170=LOGOUT, 177=汉堡) |
| `client/src/components/ProgressBar.tsx`（推测） | 首页"我的IP打造进度"模块 |
| `client/src/pages/IPPlanPage.tsx` | /ip-plan 页 |
| `client/src/pages/VideoChatPage.tsx`（推测） | /voice-chat |

**复刻参考价值**：
- 项目用 **Vite + TS（client/src 是 Vite 默认结构）**
- 组件按页面 vs 组件分层（pages/ + components/）
- 推测有 `tsconfig.json` 配 `data-loc` 注入（Vite 插件 `vite-plugin-react-source` 之类）

## 12.12 全部 32 页 SPA 路由清单（最终版）

```
/                       首页
/guide                  使用说明
/ip-plan                我的 IP 方案
/step/1                 选行业
/step/3                 账号包装
/step/3b                人设定制
/step/4                 执行计划
/step/4b                变现路径
/step/5                 爆款选题（创作菜单）
/step/6                 拍摄计划
/step/7                 文案生成（创作菜单）
/step/8                 直播策划

/trending               全网爆款库
/video-analysis         爆款文案解析
/present-styles         爆款呈现形式（更多菜单的 14 种）

/monetization           IP 变现模型
/private-domain         私域成交流程
/boom-generate          爆款元素生成

/generate               AI 智能生成
/analysis               文案结构分析
/video-production       短视频制作
/acquisition-video      获客型视频

/ai-video               一键生成视频 (STORYBOARD)
/voice-chat             语音对话 (VOICE CHAT)
/deep-learning          深度学习
/knowledge              方法论知识库

/diagnosis              IP 诊断           ← 新发现
/daily-tasks            每日任务           ← 新发现
/evolution              进化仪表盘         ← 新发现
/accounts               账号管理           ← 新发现
/my-topics              我的选题库         ← 新发现
/history                历史记录           ← 新发现

/step/2                 → 404
```

## 12.13 复刻关键库清单（更新）

```
依赖：
  react@18 + react-dom@18
  react-router-dom@6
  @trpc/client + @trpc/react-query + @tanstack/react-query
  zustand
  tailwindcss + autoprefixer
  @radix-ui/* (shadcn 底层)
  lucide-react           (所有图标)
  sonner                 (toast 系统)
  framer-motion          (推测：step 卡的 opacity/transform 动画)
  react-markdown         (推测：AI 输出的 markdown 渲染)
  date-fns               (推测：时间戳格式化)
```

---

# ⅩⅢ · 完整 Design System（实测 CSS 解析）

> 数据源：解析 `https://aiipznt.vip/assets/index-CQjJjGlX.css`（200KB minified）
> 原文件：`~/Desktop/aiipznt-clone-research/assets/index.css`

## 13.1 CSS 变量（OKLCH 颜色，Tailwind v4 风格）

```css
:root {
  --radius: .75rem;                            /* 12px */
  
  /* 表层 */
  --background:        oklch(7%  .005 75);    /* 极深暗色 */
  --foreground:        oklch(92% .02  85);    /* 主文字 */
  --card:              oklch(11% .008 75);
  --card-foreground:   oklch(92% .02  85);
  --popover:           oklch(9%  .008 75);
  --popover-foreground:oklch(92% .02  85);
  
  /* 主色 - 金色 */
  --primary:           oklch(82% .14  85);    /* gold #eebc4a */
  --primary-foreground:oklch(8%  .005 75);
  
  /* 次色 */
  --secondary:         oklch(14% .008 75);
  --secondary-foreground: oklch(88% .03 85);
  --muted:             oklch(16% .008 75);
  --muted-foreground:  oklch(55% .03  75);
  --accent:            oklch(72% .13  85);    /* 中金 */
  --accent-foreground: oklch(8%  .005 75);
  
  /* 状态 */
  --destructive:       oklch(65% .25  25);    /* 红色 - error */
  --destructive-foreground: oklch(95% 0 0);
  
  /* 边界 */
  --border: oklch(22% .02 75);
  --input:  oklch(16% .01 75);
  --ring:   oklch(82% .14 85);
  
  /* 图表 5 色（金色系渐变） */
  --chart-1: oklch(82% .14 85);
  --chart-2: oklch(72% .13 85);
  --chart-3: oklch(65% .14 75);
  --chart-4: oklch(88% .12 85);
  --chart-5: oklch(50% .1  75);
  
  /* 侧边栏（暂未实际使用） */
  --sidebar: oklch(8% .005 75);
  --sidebar-foreground: oklch(88% .03 85);
  --sidebar-primary: oklch(82% .14 85);
  --sidebar-border: oklch(22% .02 75);
}

@theme inline {
  --font-sans: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --font-weight-black: 900;
  --font-weight-bold: 700;
  --font-weight-semibold: 600;
  --font-weight-medium: 500;
  --font-weight-normal: 400;
  
  /* 标准动画 */
  --animate-spin:   spin 1s linear infinite;
  --animate-ping:   ping 1s cubic-bezier(0,0,.2,1) infinite;
  --animate-pulse:  pulse 2s cubic-bezier(.4,0,.6,1) infinite;
  --animate-bounce: bounce 1s infinite;
}
```

## 13.2 Gold 调色板（精确 hex）

CSS 同时输出了 hex 和 oklab 两个格式（fallback）。复刻方建议在 `tailwind.config.ts` 里：

```typescript
// tailwind.config.ts
extend: {
  colors: {
    gold:        '#eebc4a',  // 主金色
    'gold-dark': '#bf8100',  // 深金（按钮 hover）
    'gold-dim':  '#845a0f',  // 灰金（未完成步骤）
    'gold-light':'#fcd176',  // 浅金（状态指示灯，跳动小圆点）
  }
}
```

每个 gold 都自动衍生 7 个透明度档（Tailwind 的 `/10 /15 /20 /30 /40 /60 /95` 语法）：

```css
.bg-gold       { background-color: #eebc4a }      /* 100% */
.bg-gold/5     { background-color: #eebc4a0d }    /* 5% */
.bg-gold/10    { background-color: #eebc4a1a }
.bg-gold/15    { background-color: #eebc4a26 }
.bg-gold/20    { background-color: #eebc4a33 }
.bg-gold/40    { background-color: #eebc4a66 }
.bg-gold/60    { background-color: #eebc4a99 }
```

实测 CSS 用了 `color-mix(in oklab, ...)` 计算半透明色，**Tailwind v4 的标志特征**。

## 13.3 自定义 Class 完整定义

### `.glass-card`（玻璃卡片，全站基础容器）

```css
.glass-card {
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
  backdrop-filter: blur(20px) saturate(1.5);
  background: #06040399;                          /* 深褐黑 60% alpha */
  border: 1px solid oklch(82% .14 85 / .15);     /* 半透明金边 */
  transition: all .4s cubic-bezier(.4, 0, .2, 1);
}
```

复刻：
```jsx
<div className="glass-card rounded-xl p-5">...</div>
```

### `.glow-gold` / `.glow-gold-dark` / `.glow-gold-light`（金色辉光）

```css
.glow-gold       { box-shadow: 0 0 20px #eebc4a59, 0 0 60px #eebc4a1f }
.glow-gold-dark  { box-shadow: 0 0 20px #cf9a354d, 0 0 60px #cf9a351a }
.glow-gold-light { box-shadow: 0 0 20px #f6d4764d, 0 0 60px #f6d4761a }
```

用法：hover Logo 框、CTA 按钮 emphasis。

### `.data-grid-bg`（科技感网格背景）

```css
.data-grid-bg {
  background-image:
    linear-gradient(#eebc4a08 1px, transparent 1px),       /* 横线 */
    linear-gradient(90deg, #eebc4a08 1px, transparent 1px);/* 竖线 */
  background-size: 40px 40px;
}
```

`#eebc4a08` = 金色 3% alpha，极淡，用作整页面背景的"网格科技感"。

## 13.4 自定义 Animations

### `progressive-shimmer`（信息浮动）

```css
@keyframes progressive-shimmer {
  0%   { opacity: .3 }
  50%  { opacity: .6 }
  100% { opacity: .3 }
}

.animate-shimmer {
  animation: 1.5s ease-in-out infinite progressive-shimmer;
}
```

用法：loading 中文字 / 占位符闪动。

### `pulse-subtle`（轻微心跳）

```css
@keyframes pulse-subtle {
  0%, 100% { opacity: 1 }
  50%      { opacity: .85 }
}

.animate-pulse-subtle {
  animation: 2s ease-in-out infinite pulse-subtle;
}
```

比 Tailwind 标准 `pulse` 弱（不闪到 0），用于活跃状态指示。

### `scan-line`（扫描线效果）

```css
@keyframes scan-line {
  0%   { top: -5% }
  100% { top: 105% }
}
```

用于科技感卡片的扫描线动效（一条从上扫到下的高光）。

### `float`（漂浮效果）

```css
@keyframes float {
  0%, 100% { transform: translateY(0) }
  50%      { transform: translateY(-10px) }
}
```

用于 emoji 图标 / 装饰元素的浮动。

### `gradient-shift` / `border-pulse`（渐变位移）

```css
@keyframes gradient-shift {
  0%, 100% { background-position: 0% }
  50%      { background-position: 100% }
}
```

用于金色渐变背景的"流动"效果（配合 `bg-gradient-to-r from-gold to-gold-dark`）。

## 13.5 字体加载（HTML head）

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet">
```

#### 字体使用规则

| 字体 | 用途 | 出现位置 |
|---|---|---|
| **Orbitron** | 英文大标题（科技粗体） | `STEP 01` `FUNCTION MATRIX` `WORKFLOW` `USER GUIDE` `STORYBOARD` `VOICE CHAT` `EVOLUTION` |
| **Rajdhani** | 英文细体 / 一级菜单 | nav 按钮（创作 / 策划 / 智能 / 更多）/ Logo `AGENT` 副标题 |
| **Noto Sans SC** | 中文 | 所有中文正文 |
| ui-sans-serif (system) | 默认 fallback | 用于 placeholder / 数字等 |
| ui-monospace | 等宽 | 代码片段（如 AI Prompt 展示） |

实测样式 inline：
```html
<span style="font-family: Orbitron, sans-serif; letter-spacing: 0.05em;">AIP</span>
<span style="font-family: Rajdhani, sans-serif;">AGENT</span>
<span style="font-family: 'Noto Sans SC', sans-serif;">sally zhao</span>
<h1 style="font-family: Orbitron, Rajdhani, sans-serif">我的IP方案</h1>
```

## 13.6 KaTeX 数学公式渲染

CSS 文件前段含完整的 KaTeX 字体（`KaTeX_AMS`、`KaTeX_Caligraphic`、`KaTeX_Fraktur`、`KaTeX_Main`、`KaTeX_Math`、`KaTeX_Script`、`KaTeX_Size1-4`、`KaTeX_Typewriter`）。

**含义**：产品集成了 [KaTeX](https://katex.org)，能渲染 LaTeX 数学公式。可能场景：
- AI 生成内容里出现公式（如「转化率 = 成交数 / 访客数 × 100%」）
- 数据指标可视化
- 教育类内容生成（数学题）

复刻：`npm install katex react-katex`

## 13.7 复刻 tailwind.config.ts 完整模板

```typescript
import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // shadcn 标准 token (用 OKLCH)
        background: 'oklch(7% .005 75)',
        foreground: 'oklch(92% .02 85)',
        card: { DEFAULT: 'oklch(11% .008 75)', foreground: 'oklch(92% .02 85)' },
        popover: { DEFAULT: 'oklch(9% .008 75)', foreground: 'oklch(92% .02 85)' },
        primary: { DEFAULT: 'oklch(82% .14 85)', foreground: 'oklch(8% .005 75)' },
        secondary: { DEFAULT: 'oklch(14% .008 75)', foreground: 'oklch(88% .03 85)' },
        muted: { DEFAULT: 'oklch(16% .008 75)', foreground: 'oklch(55% .03 75)' },
        accent: { DEFAULT: 'oklch(72% .13 85)', foreground: 'oklch(8% .005 75)' },
        destructive: { DEFAULT: 'oklch(65% .25 25)', foreground: 'oklch(95% 0 0)' },
        border: 'oklch(22% .02 75)',
        input: 'oklch(16% .01 75)',
        ring: 'oklch(82% .14 85)',
        
        // 自定义金色 4 档
        gold: '#eebc4a',
        'gold-dark': '#bf8100',
        'gold-dim': '#845a0f',
        'gold-light': '#fcd176',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'ui-sans-serif', 'system-ui'],
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
      },
      animation: {
        shimmer: '1.5s ease-in-out infinite progressive-shimmer',
        'pulse-subtle': '2s ease-in-out infinite pulse-subtle',
        'scan-line': '2s linear infinite scan-line',
        float: '3s ease-in-out infinite float',
        'gradient-shift': '4s ease-in-out infinite gradient-shift',
      },
      keyframes: {
        'progressive-shimmer': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.6' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        'scan-line': {
          '0%': { top: '-5%' },
          '100%': { top: '105%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0%' },
          '50%': { backgroundPosition: '100%' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
```

## 13.8 全局 CSS（src/index.css 模板）

```css
@import 'tailwindcss';

@layer base {
  :root {
    --radius: .75rem;
  }
  
  body {
    @apply bg-background text-foreground;
    font-family: 'Noto Sans SC', ui-sans-serif, system-ui, sans-serif,
                 'Apple Color Emoji', 'Segoe UI Emoji';
  }
}

@layer components {
  .glass-card {
    -webkit-backdrop-filter: blur(20px) saturate(1.5);
    backdrop-filter: blur(20px) saturate(1.5);
    background: #06040399;
    border: 1px solid oklch(82% .14 85 / .15);
    transition: all .4s cubic-bezier(.4, 0, .2, 1);
  }
  
  .glow-gold       { box-shadow: 0 0 20px #eebc4a59, 0 0 60px #eebc4a1f }
  .glow-gold-dark  { box-shadow: 0 0 20px #cf9a354d, 0 0 60px #cf9a351a }
  .glow-gold-light { box-shadow: 0 0 20px #f6d4764d, 0 0 60px #f6d4761a }
  
  .data-grid-bg {
    background-image:
      linear-gradient(#eebc4a08 1px, transparent 1px),
      linear-gradient(90deg, #eebc4a08 1px, transparent 1px);
    background-size: 40px 40px;
  }
}
```

---

# ⅩⅣ · PWA + SEO + Service Worker（实测）

## 14.1 manifest.json 完整内容

```json
{
  "name": "AIP智能体",
  "short_name": "AIP智能体",
  "description": "基于AIP方法论的AI短视频文案生成工具",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#e8863a",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/icon-72.png",  "sizes": "72x72",  "type": "image/png" },
    { "src": "/icons/icon-96.png",  "sizes": "96x96",  "type": "image/png" },
    { "src": "/icons/icon-128.png", "sizes": "128x128","type": "image/png" },
    { "src": "/icons/icon-144.png", "sizes": "144x144","type": "image/png" },
    { "src": "/icons/icon-152.png", "sizes": "152x152","type": "image/png" },
    { "src": "/icons/icon-192.png", "sizes": "192x192","type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-384.png", "sizes": "384x384","type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512","type": "image/png" }
  ]
}
```

**关键点**：
- `theme_color` PWA 是 **#e8863a**（橙金，比主金 #eebc4a 暖一点）
- `background_color` **#0a0a0a**（启动屏背景，比 CSS `--background` 略亮）
- `orientation: portrait-primary` —— **移动端竖屏锁定**
- 9 档 icon (72/96/128/144/152/192/384/512)
- icon-192 标记 `purpose: any maskable`（Android 自适应图标）

> ⚠️ 注意 HTML `<meta name="theme-color" content="#00e5ff">` 是**青色**（浏览器顶部栏色），manifest theme_color 是**橙金**（PWA 启动屏色）。两者不同！

## 14.2 Service Worker (sw.js) 实现

完整代码（51 行，1.6KB）：

```javascript
const CACHE_NAME = 'aiip-agent-v2';
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install: 预缓存关键静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: 清理旧版本 cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Fetch 策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 非 GET 直接放行
  if (request.method !== 'GET') return;

  // API 请求：纯网络（不缓存）
  if (url.pathname.startsWith('/api/')) return;

  // HTML 页面：network-first，失败用 cache
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // 静态资源：network-first + 写入 cache 作 fallback
  event.respondWith(
    fetch(request).then((response) => {
      if (response && response.status === 200 && response.type === 'basic') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return response;
    }).catch(() => caches.match(request))
  );
});
```

**复刻方策略**：直接抄就行。基础 PWA，无 push notification、无离线模式、无 background sync。

## 14.3 SEO 漏洞警告（**复刻必补**）

实测：
- ❌ `/robots.txt` 不存在（返回 SPA fallback HTML）
- ❌ `/sitemap.xml` 不存在
- ❌ 没有 JSON-LD structured data
- ❌ SPA 客户端渲染，搜索引擎抓取困难

复刻方建议：
1. 加 `/robots.txt`：
   ```
   User-agent: *
   Allow: /
   Sitemap: https://your-domain.com/sitemap.xml
   ```
2. 加 `/sitemap.xml`：列出 34 个公开路由
3. 改用 **Next.js SSR/SSG** 或 vite-prerender，至少首页 + /guide + /knowledge SSR
4. 加 JSON-LD：
   ```json
   {
     "@context": "https://schema.org",
     "@type": "WebApplication",
     "name": "AIP智能体",
     "applicationCategory": "BusinessApplication"
   }
   ```

## 14.4 完整 HTML head 标签

```html
<!doctype html>
<html lang="zh-CN" translate="no" class="notranslate">
<head>
  <meta charset="UTF-8" />
  <meta name="google" content="notranslate" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
  
  <title>AIP全案获客操盘手 - OPC全案落地，从流量到成交</title>
  <meta name="description" content="AIP全案获客操盘手，OPC全案落地，从流量到成交。AI+短视频+IP全链路变现，覆盖同行分析、爆款文案生成、短视频分镜制作、私域成交流程、直播策划等12大核心功能。" />
  <meta name="keywords" content="AI智能体,IP孵化,IP变现,爆款文案,短视频制作,私域成交,获客智能体,同行分析,直播策划,爆款获客,AIP智能体,AI文案" />
  
  <!-- 主题色 -->
  <meta name="theme-color" content="#00e5ff" />          <!-- 浏览器顶部栏 -->
  
  <!-- iOS PWA -->
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="AIP智能体" />
  
  <!-- PWA -->
  <link rel="manifest" href="/manifest.json" />
  <link rel="apple-touch-icon" href="/icons/icon-192.png" />
  
  <!-- 字体 -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet" />
  
  <!-- bundle -->
  <script type="module" crossorigin src="/assets/index-{hash}.js"></script>
  <link rel="stylesheet" crossorigin href="/assets/index-{hash}.css">
  
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://aiipznt.vip/">
  <meta property="og:title" content="AiIP超级获客智能体">
  <meta property="og:description" content="AiIP超级获客智能体，AI驱动全链路IP孵化与变现加速平台...">
  <meta property="og:image" content="https://files.manuscdn.com/webdev_screenshots/.../full.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
</head>
```

---

# ⅩⅤ · 完整 Toast 文案库（40+ 实测）

> 第三轮抓取：从 bundle.js 反编译所有 `pe.success(...)` / `pe.error(...)` 调用

## 15.1 success 文案

| 文案 | 触发场景 |
|---|---|
| 已切换账号 | /accounts 切换账号 |
| 激活成功！欢迎使用AIP超级获客智能体 | 邀请码兑换成功（首次） |
| 已复制简介 | step3 简介子节点击"复制" |
| 已复制 + (其他子节名) | step3 各子节复制 |
| 仿写文案已生成 | /video-analysis 一键仿写完成 |
| 感谢好评！ | /evolution 反馈点 👍 |
| 收到反馈，智能体将持续进化 | /evolution 反馈点 👎 |

## 15.2 error 文案 (40+)

### 通用错误
- `保存失败：{msg}`
- `保存失败，请重试`
- `操作失败，请重试`
- `获取失败：{msg}`
- `配置更新失败：{msg}`
- `设置失败：{msg}`
- `删除失败：{msg}`
- `切换失败：{msg}`

### 必填校验
- `请输入你的个人信息` (step3/3b)
- `请输入你的行业` (step5)
- `请输入你的行业名称` (/diagnosis)
- `请输入你的产品/服务描述` (step4b/monetization)
- `请输入你的产品/服务信息` (acquisition-video)
- `请输入产品/服务名称` (/private-domain)
- `请输入文案主题` (step7)
- `请输入文案内容` (video-production)
- `请输入至少10个字的文案内容` (video-analysis)
- `请输入至少10个字的直播话术` (step8 优化)
- `请输入账号名称` (/accounts 创建)
- `请输入邀请码` (邀请码兑换)
- `请填写行业信息` (step5)
- `请选择平台` (step3/4/8)
- `请选择一个行业` (step5)
- `请至少添加1篇文案` (deepLearning)
- `请至少选择一个爆款元素` (step7/boom-generate)
- `请先填写行业、产品和阶段信息` (/diagnosis Step 1)
- `请先在第一步选择行业` (跨 step 跳转)
- `请先登录` (未登录访问受保护页)

### 操作失败
- `仿写失败：{msg}`
- `分析失败：{msg}`
- `复制失败` (剪贴板 API 异常)
- `解析分镜失败，请重试`
- `进化分析失败，请重试`
- `激活码兑换失败：{msg}`
- `取消收藏失败：{msg}`

### 数据失败
- `没有可导出的选题` (/my-topics 空态点导出)
- `没有可导出的有效邀请码` (/invite-manage)

### 浏览器兼容
- `浏览器不支持语音合成` (/voice-chat TTS 失败)
- `浏览器不支持语音识别，请使用文字输入` (/voice-chat STT 失败)

### 文件上传
- `请先上传文件` (deepLearning 文件模式)

## 15.3 复刻方建议

把这些文案抽到 `i18n/zh-CN.ts` 集中管理：

```typescript
export const messages = {
  success: {
    accountSwitched: '已切换账号',
    activated: '激活成功！欢迎使用AIP超级获客智能体',
    copied: (section: string) => `已复制${section}`,
    rewriteDone: '仿写文案已生成',
    feedbackGood: '感谢好评！',
    feedbackBad: '收到反馈，智能体将持续进化',
  },
  error: {
    requirePersonalInfo: '请输入你的个人信息',
    requireIndustry: '请输入你的行业',
    // ... 所有 40+ 文案
  }
};
```

---

# ⅩⅥ · 邀请码机制（实测）

## 16.1 流程

```
1. 用户带邀请码访问站点：https://aiipznt.vip/?invite=ABC123
                          或 /invite/ABC123 (推测)

2. 前端检测到 URL 参数 → sessionStorage.setItem('pendingInviteCode', 'ABC123')

3. 用户登录（Google OAuth）

4. 登录成功后 useEffect 触发：
   const code = sessionStorage.getItem('pendingInviteCode');
   if (code) inviteRedeem.mutate({ code });

5. 后端验证邀请码 → 激活账号 / 加积分 / 升级会员

6. 成功 → toast.success('激活成功！欢迎使用AIP超级获客智能体')
   失败 → toast.error('激活码兑换失败：' + msg)

7. 无论成败：sessionStorage.removeItem('pendingInviteCode')
```

## 16.2 关键代码（实测从 bundle）

```typescript
// 进站时检测
useEffect(() => {
  if (urlParams.has('invite')) {
    const code = urlParams.get('invite');
    sessionStorage.setItem('pendingInviteCode', code);
  }
}, []);

// 登录后兑换
useEffect(() => {
  if (isLoggedIn && hasUser) {
    const code = sessionStorage.getItem('pendingInviteCode');
    if (code) redeem.mutate({ code });
  }
}, [isLoggedIn, hasUser]);

const redeem = trpc.invite.redeem.useMutation({  // 推测路由
  onSuccess: () => sessionStorage.removeItem('pendingInviteCode'),
  onError: (h) => toast.error('激活码兑换失败：' + (h.message || '请重试'))
});
```

## 16.3 管理员后台 `/invite-manage`

仅 `role: 'admin'` 用户可访问，普通用户看到：
```
H1: 无权限访问
副标题: 仅管理员可管理邀请码
[返回首页]
```

推测后台功能：
- 生成批量邀请码
- 查看兑换记录
- 设置过期时间
- 导出 CSV（toast 文案 "没有可导出的有效邀请码" 验证）

复刻方：建议建 `/admin/*` 子路由 + middleware 校验 role

---

# ⅩⅦ · 完整路由清单（实测 34 个）

> 第三轮深度抓取：从 bundle 反编译 React Router `path:"..."` 注册项

## 17.1 实际可访问路由（32 个）

```
/                       首页
/guide                  使用说明
/ip-plan                我的 IP 方案
/404                    404 fallback

# 主流程 9 步（实际只 9 个 path 注册，无 step/2/9）
/step/1                 选行业（策划）
/step/3                 账号包装（策划）
/step/3b                人设定制（策划）
/step/4                 执行计划（策划）
/step/4b                变现路径（策划）
/step/5                 爆款选题（创作）
/step/6                 拍摄计划（策划）
/step/7                 文案生成（创作）
/step/8                 直播策划（策划）

# 4 大模块（创作 / 策划 / 智能 / 更多）的具体页面
/trending               全网爆款库（策划，菜单"创作"也有快捷）
/video-analysis         爆款文案解析（创作）
/present-styles         爆款呈现形式（更多）
/monetization           IP 变现模型（策划）
/private-domain         私域成交流程（策划）
/boom-generate          爆款元素生成（创作）
/generate               AI 智能生成（创作）
/analysis               文案结构分析（创作）
/video-production       短视频制作（智能）
/acquisition-video      获客型视频（创作）
/ai-video               一键生成视频 STORYBOARD（智能）
/voice-chat             语音对话 VOICE CHAT（智能）
/deep-learning          深度学习（智能）
/knowledge              方法论知识库 AIP文案方法论（更多）
/diagnosis              7 维度 IP 诊断（智能）
/daily-tasks            每日任务（智能）
/evolution              智能体进化中心（智能）
/accounts               IP 账号管理（更多）
/my-topics              我的选题库（更多）
/history                历史记录（更多）
```

## 17.2 受限路由（1 个）

```
/invite-manage          邀请管理（仅 admin 可访问，user 看到 "无权限访问"）
```

## 17.3 后端定义但路由未上线

```
/step/2                 → 404（产品迭代时跳过）
/step/9                 → 404（step9_review 后端 stepKey 已定义，但路由未注册）
```

## 17.4 路由统计

| 类别 | 数量 |
|---|---|
| 主流程 step | 9 |
| 4 大菜单功能模块 | 20 |
| 辅助页（首页/使用说明/方案/账号/选题库/历史）| 6 |
| 第二轮新发现 | 6（含已计入上面） |
| 受限管理后台 | 1 |
| 路由未注册的 stepKey | 1 (step9_review) |
| **可访问总数** | **32** |
| 含 admin + 后端定义 | **34** |

---

# ⅩⅧ · React Router + 项目结构反编译（来自 data-loc）

> 实测每个 React 组件的 DOM 都带 `data-loc="client/src/xxx.tsx:lineN"` 属性，**完整暴露源码组织**。

## 18.1 推测的项目结构

```
client/                                  # 前端根目录（Vite 项目）
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── icons/icon-{72,96,128,144,152,192,384,512}.png
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css                        # @import 'tailwindcss' + glass-card 等
    ├── components/
    │   ├── Navbar.tsx                   # data-loc:117=root, 120=logo, 135=nav,
    │   │                                #          141=user-area, 151=sally-chip,
    │   │                                #          165=赵语AI, 170=LOGOUT, 177=汉堡
    │   ├── ProgressBar.tsx              # 首页"我的IP打造进度"模块
    │   ├── DropdownMenu.tsx             # shadcn dropdown 封装
    │   ├── Toaster.tsx                  # sonner wrapper（如有）
    │   └── ui/                          # shadcn 组件
    │       ├── button.tsx
    │       ├── input.tsx
    │       ├── textarea.tsx
    │       ├── dialog.tsx               # data-slot="dialog-content/header/title"
    │       ├── card.tsx
    │       ├── tabs.tsx
    │       ├── checkbox.tsx
    │       └── ...
    ├── pages/
    │   ├── HomePage.tsx
    │   ├── GuidePage.tsx
    │   ├── IPPlanPage.tsx               # data-loc:89=stepCard, 207=header,
    │   │                                #          240=progress, 256=cards列表
    │   ├── AccountsPage.tsx             # data-loc:287=createDialog
    │   ├── MyTopicsPage.tsx             # data-loc:161=root
    │   ├── HistoryPage.tsx
    │   ├── DiagnosisPage.tsx
    │   ├── DailyTasksPage.tsx
    │   ├── EvolutionPage.tsx
    │   ├── steps/                       # /step/* 9 步
    │   │   ├── Step1IndustryPage.tsx
    │   │   ├── Step3AccountPage.tsx
    │   │   ├── Step3bPersonaPage.tsx
    │   │   ├── Step4ExecutionPage.tsx
    │   │   ├── Step4bMonetizationPage.tsx
    │   │   ├── Step5TopicsPage.tsx
    │   │   ├── Step6ShootingPage.tsx
    │   │   ├── Step7CopywritingPage.tsx
    │   │   └── Step8LivestreamPage.tsx
    │   ├── insight/
    │   │   ├── TrendingPage.tsx
    │   │   ├── VideoAnalysisPage.tsx
    │   │   └── PresentStylesPage.tsx
    │   ├── monetize/
    │   │   ├── MonetizationPage.tsx
    │   │   ├── PrivateDomainPage.tsx
    │   │   └── BoomGeneratePage.tsx
    │   ├── create/
    │   │   ├── GeneratePage.tsx
    │   │   ├── AnalysisPage.tsx
    │   │   ├── VideoProductionPage.tsx
    │   │   └── AcquisitionVideoPage.tsx
    │   ├── tools/
    │   │   ├── AiVideoPage.tsx
    │   │   ├── VoiceChatPage.tsx
    │   │   └── DeepLearningPage.tsx
    │   ├── KnowledgePage.tsx
    │   ├── InviteManagePage.tsx         # admin only
    │   └── NotFoundPage.tsx             # /404
    ├── hooks/
    │   ├── useStepData.ts               # 封装 trpc.stepData + localStorage
    │   ├── useActiveAccount.ts
    │   ├── useEvolution.ts              # 反馈机制
    │   └── useInviteCode.ts             # sessionStorage 兑换
    ├── lib/
    │   ├── trpc.ts                      # tRPC client
    │   ├── i18n/zh-CN.ts                # toast 文案集中
    │   └── constants/
    │       ├── industries.ts            # 56 行业 + 5 大类
    │       ├── platforms.ts             # 5 平台
    │       ├── scriptTypes.ts           # 20 脚本类型
    │       ├── hotElements.ts           # 22 爆款元素
    │       ├── presentStyles.ts         # 14 呈现形式
    │       ├── diagnosisDimensions.ts   # 7 维度
    │       └── evolutionLevels.ts       # 5 级
    └── types/
        ├── stepData.ts                  # 各 step 的 zod schema
        └── api.ts
```

## 18.2 关键 React 组件参考（data-loc 反编译）

| 文件 | 行号 | 元素 | class |
|---|---|---|---|
| Navbar.tsx | 117 | `<header>` | `sticky top-0 z-50 border-b border-gold/10 bg-background/70 backdrop-blur-2xl` |
| Navbar.tsx | 118 | container | `container flex h-16 items-center justify-between` |
| Navbar.tsx | 120 | logo a | `flex items-center gap-2.5` |
| Navbar.tsx | 121 | logo icon box | `flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10 border border-gold/20 group-hover:glow-gold` |
| Navbar.tsx | 135 | nav | `hidden lg:flex items-center gap-0.5 mx-4` |
| Navbar.tsx | 141 | 右侧用户区 div | `hidden lg:flex items-center gap-3 shrink-0` |
| Navbar.tsx | 151 | sally chip | `flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold/5 border border-gold/10` |
| Navbar.tsx | 165 | 赵语AI 账号切换 | `inline-flex items-center justify-center whitespace-nowrap text-sm transition-all` |
| Navbar.tsx | 170 | LOGOUT icon button | shadcn icon-button + `lucide-log-out h-4 w-4` |
| Navbar.tsx | 177 | 汉堡菜单 | `lg:hidden p-2 text-muted-foreground hover:text-gold` + `lucide-menu h-5 w-5` |
| IPPlanPage.tsx | 207 | header section | `mb-8` |
| IPPlanPage.tsx | 240 | 进度条容器 | `mb-8 glass-card rounded-xl p-4` |
| IPPlanPage.tsx | 256 | 9 个 step 卡列表 | `space-y-4` |
| IPPlanPage.tsx | 89 | 单个 step 卡 | `glass-card rounded-xl p-5 border border-gold/20` |
| AccountsPage.tsx | 287 | 创建账号 Dialog | Radix Dialog + `sm:max-w-lg max-h-[85vh]` |
| EvolutionPage.tsx | - | 主容器 | `container max-w-6xl mx-auto px-4 pt-24 pb-12` |

---

# ⅩⅨ · CSS 深度补充（断点 / 容器 / 动画 / 特效）

> 补充 §13 之外的细节

## 19.1 完整断点（Tailwind v4 默认）

```css
sm:  640px   /* 40rem */
md:  768px   /* 48rem */
lg:  1024px  /* 64rem */
xl:  1280px  /* 80rem */
2xl: 1536px  /* 96rem */
```

实测：
- header `lg:hidden` 在 < 1024px 显示汉堡
- 移动端 nav `max-h-[70vh]`

## 19.2 .container 完整规则

```css
.container {
  width: 100%;
  margin-left: auto; margin-right: auto;
  padding-left: 1rem; padding-right: 1rem;
}

@media (min-width: 640px) {
  .container { padding-left: 1.5rem; padding-right: 1.5rem; }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1280px;            /* 主容器最大宽度 */
    padding-left: 2rem; padding-right: 2rem;
  }
}

/* Tailwind v4 自动响应 max-width */
@media (min-width:40rem)  { .container { max-width: 40rem }}
@media (min-width:48rem)  { .container { max-width: 48rem }}
@media (min-width:64rem)  { .container { max-width: 64rem }}
@media (min-width:80rem)  { .container { max-width: 80rem }}
@media (min-width:96rem)  { .container { max-width: 96rem }}
```

## 19.3 .gradient-text（5 色金渐变文字）

```css
.gradient-text {
  -webkit-text-fill-color: transparent;
  background: linear-gradient(135deg,
    #fcd176,   /* gold-light */
    #eebc4a 50%, /* gold */
    #d79e2b 75%,
    #cb8f16,
    #bf8100   /* gold-dark */
  ) 0 0 / 200% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  animation: 4s infinite gradient-shift;
}

.gradient-text-alt {  /* 简版 2 色 */
  -webkit-text-fill-color: transparent;
  background: linear-gradient(90deg, #eebc4a, #ca9d33);
  -webkit-background-clip: text;
  background-clip: text;
}
```

用法：标题强调（`<h1 class="gradient-text">从流量到成交</h1>`）

## 19.4 .holo-scan（全息扫描线）

```css
.holo-scan {
  position: relative;
  overflow: hidden;
}

.holo-scan::after {
  content: '';
  position: absolute;
  top: -100%;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #eebc4a99, transparent);
  animation: 3s ease-in-out infinite scan-line;
}

@keyframes scan-line {
  0%   { top: -5% }
  100% { top: 105% }
}
```

效果：卡片上一道金色 1px 横线从上扫到下，3s 一次。

## 19.5 .neon-underline（霓虹 hover 下划线）

```css
.neon-underline {
  position: relative;
}

.neon-underline::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #eebc4a, #d79e2b 50%, #cb8f16, #bf8100);
  box-shadow: 0 0 8px #eebc4a80;
  transition: width .3s;
}

.neon-underline:hover::after {
  width: 100%;
}
```

效果：hover 时 0→100% 宽度展开 + 金色发光阴影。

## 19.6 .shimmer（光泽闪烁）

```css
.shimmer {
  position: relative;
  overflow: hidden;
}

.shimmer::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, #eebc4a0f, transparent);
  animation: 3s ease-in-out infinite shimmer;
}

@keyframes shimmer {
  0%   { left: -100% }
  100% { left: 100% }
}
```

效果：从左到右滑过的金色光泽，3s 一次。

## 19.7 .glass-card-purple（紫色玻璃卡变体）

```css
.glass-card-purple {
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
  backdrop-filter: blur(20px) saturate(1.5);
  background: #06040399;
  border: 1px solid oklch(72% .13 85 / .15);   /* accent 色 */
  transition: all .4s cubic-bezier(.4, 0, .2, 1);
}
```

`.glass-card` 用 primary（金）边框，`.glass-card-purple` 用 accent（中金）边框，比主卡稍弱一档。

## 19.8 缓动函数

实测 4 种 cubic-bezier：

```css
cubic-bezier(.4, 0, .2, 1)     /* glass-card 标准过渡 */
cubic-bezier(.4, 0, .6, 1)     /* Tailwind --animate-pulse */
cubic-bezier(.8, 0, 1, 1)      /* 加速 */
cubic-bezier(0, 0, .2, 1)      /* 减速 */
```

## 19.9 完整 keyframes 列表（17 个）

```
@keyframes accordion-down      /* shadcn accordion */
@keyframes accordion-up
@keyframes blink               /* 0/100=opacity:1, 50=opacity:0 */
@keyframes border-pulse        /* 背景位置 0→100%→0 */
@keyframes bounce              /* tw 默认 */
@keyframes caret-blink         /* 光标闪烁，0/70/100=1, 20/50=0 */
@keyframes enter               /* tailwindcss-animate 通用进入 */
@keyframes exit                /* tailwindcss-animate 通用退出 */
@keyframes float               /* translateY(0 / -10px / 0) */
@keyframes gradient-shift      /* background-position 0→100%→0 */
@keyframes ping                /* tw 默认 */
@keyframes progressive-shimmer /* opacity .3→.6→.3 */
@keyframes pulse               /* tw 默认 */
@keyframes pulse-subtle        /* opacity 1→.85→1（比 pulse 弱）*/
@keyframes scan-line           /* top -5%→105% */
@keyframes shimmer             /* left -100%→100% */
@keyframes spin                /* tw 默认 */
```

## 19.10 .float-animation（更慢的浮动）

```css
.float-animation {
  animation: 6s ease-in-out infinite float;
}
```

⚠️ 与 `.animate-float` 用了同一个 keyframes 但周期不同（默认是 3s）。

## 19.11 .fade-in（tailwindcss-animate）

```css
.fade-in { --tw-enter-opacity: 0; }  /* 配合 .animate-in 使用 */
```

完整入场动画用法：
```jsx
<div className="animate-in fade-in zoom-in-95 duration-200">...</div>
```

依赖 `tailwindcss-animate` 包（shadcn 默认搭配）。

## 19.12 完整字体 weight 枚举

```css
--font-weight-black:    900
--font-weight-bold:     700
--font-weight-semibold: 600
--font-weight-medium:   500
--font-weight-normal:   400
```

实测使用：
- `font-black` (900) → Logo `AIP` 文字
- `font-bold` (700) → H1/H2 标题、step 卡名
- `font-semibold` (600) → Modal 标题
- `font-medium` (500) → 按钮、tab、card 子标题
- `font-normal` (400) → 正文

---

# ⅩⅩ · 完整 Lucide 图标映射（实测 68 个）

> 第四轮 Phase 15：从 16 个核心页面实际 DOM 抓取的全部 lucide-* class

## 20.1 全部图标清单（按字母排序）

```
lucide-arrow-left          lucide-arrow-up-right      lucide-award
lucide-book-open           lucide-brain               lucide-briefcase
lucide-camera              lucide-chart-column        lucide-check
lucide-chevron-down        lucide-chevron-left        lucide-chevron-right
lucide-circle              lucide-circle-check        lucide-circle-user
lucide-clapperboard        lucide-clock               lucide-copy
lucide-crown               lucide-dollar-sign         lucide-download
lucide-external-link       lucide-eye                 lucide-file-text
lucide-filter              lucide-fingerprint         lucide-flame
lucide-gem                 lucide-globe               lucide-heart
lucide-image               lucide-layout-grid         lucide-lightbulb
lucide-loader-circle       lucide-log-out             lucide-menu
lucide-message-square      lucide-mic                 lucide-minus
lucide-package             lucide-palette             lucide-panels-top-left
lucide-pencil              lucide-plus                lucide-radio
lucide-refresh-cw          lucide-rocket              lucide-rotate-cw
lucide-search              lucide-send                lucide-shield
lucide-shield-alert        lucide-sparkles            lucide-star
lucide-star-off            lucide-stethoscope         lucide-sticky-note
lucide-target              lucide-thumbs-down         lucide-thumbs-up
lucide-trash               lucide-trending-up         lucide-upload
lucide-users               lucide-video               lucide-volume
lucide-wand-sparkles       lucide-zap
```

## 20.2 按页面/语义分类

### 全局
- `shield` Logo 盾牌
- `chevron-down/right/left` 下拉/方向
- `log-out` 登出
- `menu` 移动端汉堡

### IP Plan / 步骤进度
- `file-text` "我的IP方案"标题图标
- `arrow-left` 返回首页
- `refresh-cw` 刷新
- `circle-check` 已完成对号
- `circle` 未完成圆圈
- `layout-grid` step1 行业选择
- `fingerprint` step3 账号包装
- `users` step3b 人设
- `target` step4 执行计划
- `dollar-sign` step4b 变现路径
- `flame` step5 爆款选题
- `camera` step6 拍摄
- `sparkles` step7 文案 + 通用 AI 标识
- `radio` step8 直播
- `trending-up` 数据趋势
- `chevron-right` 查看详情

### Diagnosis / Evolution
- `stethoscope` IP 诊断（医生听诊器）
- `brain` 进化中心（大脑）
- `zap` 触发进化（闪电）
- `thumbs-up` / `thumbs-down` 反馈
- `award` 等级勋章
- `message-square` 反馈/聊天

### Accounts
- `plus` 新建账号
- `check` 选中
- `briefcase` 行业
- `globe` 平台
- `pencil` 编辑
- `trash` 删除

### MyTopics
- `heart` 收藏
- `search` 搜索
- `copy` 复制
- `download` 下载
- `book-open` 案例型
- `flame` 流量型

### History
- `clock` 时间
- `eye` 查看
- `copy` / `trash` 操作

### Knowledge
- `lightbulb` 公式
- `book-open` 方法论
- `sticky-note` 笔记
- `star-off` 取消收藏

### VoiceChat
- `mic` 麦克风录音
- `volume` 喇叭播放
- `send` 发送

### DeepLearning
- `upload` / `file-text` 文件上传
- `brain` 学习

### Step3 子模块
- `circle-user` 头像（圆形人脸）
- `palette` 配色
- `image` 背景图
- `eye` 预览
- `external-link` 外链参考

### Step4b
- `rocket` 起步阶段
- `package` 产品矩阵
- `chart-column` 数据图表
- `shield-alert` 风险
- `gem` 利润品
- `crown` 后端品

### AI Video
- `clapperboard` 分镜表（电影场记板）

### Loading
- `loader-circle` 标准 spinner

## 20.3 复刻方安装

```bash
npm install lucide-react
```

```jsx
import { Sparkles, FileText, ChevronRight, /* ... */ } from 'lucide-react';
// PascalCase 命名（如 lucide-file-text → FileText）
```

---

# ⅩⅩⅠ · Footer + 登录 + Onboarding + 未登录态

## 21.1 Footer（极简）

实测唯一 footer：

```jsx
<footer className="border-t border-gold/10 py-8">
  <div className="container text-center">
    <p className="text-xs text-muted-foreground"
       style={{fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.1em'}}>
      AIP AGENT · AI FULL-CHAIN IP MONETIZATION ENGINE
    </p>
  </div>
</footer>
```

**特点**：
- 只在首页 (`pages/Home.tsx:424`) 出现
- 无版权信息 / 备案号 / 联系方式 / 友链
- Rajdhani 字体 + 0.1em 字符间距
- 副标题：「AI 全链路 IP 变现引擎」（中英对照）

> 复刻方建议：补完 ICP 备案号 / 隐私政策 / 服务条款

## 21.2 登录系统

### Google OAuth 流程

```
1. 用户点 [LOGIN] 按钮
2. window.location.href = ss()                    // 跳转登录页
   实际跳到 https://aiipznt.vip/api/auth/login
3. 后端 redirect 到 Google OAuth
4. 用户授权
5. Google 回调 → /oauth/callback?code=xxx
6. 后端用 code 换 token → 创建/查询 user → 设置 cookie
7. redirect 回首页 (/)
8. 前端检测到登录态 → 自动调用 onboarding.get
   - 如果 isCompleted=0 → 弹出 OnboardingModal
   - 如果 isCompleted=1 → 直接进首页
```

### 关键代码（实测 bundle）

```typescript
const isLoggedIn = !!localStorage.getItem('manus-runtime-user-info');
// 注意：用 manus-runtime-user-info 判断登录态（不是 cookie）

<button className="bg-gold text-background"
        onClick={() => { window.location.href = ss(); }}>
  立即登录
</button>
```

### Auth 错误处理

| HTTP 状态 | 文案 |
|---|---|
| 401 / Unauthorized | "登录已过期，请刷新页面重新登录" |
| 429 / Too Many Requests | (限流提示，文案未确认) |
| 其他 | "操作失败，请重试" |

## 21.3 OnboardingModal（首次登录引导）

> 文件：`client/src/components/OnboardingModal.tsx`
> tRPC：`onboarding.get` / `onboarding.save`

### 触发时机

```typescript
const { data: onboardingData, isLoading } = trpc.onboarding.get.useQuery(undefined, {
  enabled: isLoggedIn,
  retry: false
});

// onboardingData?.isCompleted === 0 → 弹出 modal
```

### 2 步表单字段

```typescript
type OnboardingState = {
  industry: string;          // step 1: 选行业（同 56 行业）
  industryLabel: string;
  followerCount: '1-1000' | '1000-10000' | '10000-100000' | '100000+';
  mainGoal: 'start' | 'content' | 'monetize' | 'scale';
};
```

### Step 1: 选行业 + 粉丝数

```
[选择行业] - 56 行业网格（同 /step/1）
[粉丝量] - 4 选 1
  ☐ 1-1000      "1千以下"
  ☐ 1000-10000  "1千-1万"
  ☐ 10000-100000 "1万-10万"
  ☐ 100000+    "10万粉以上"
```

### Step 2: 选主要目标 mainGoal

| value | label | description |
|---|---|---|
| `start` | 从零开始做 IP | 不知道怎么起步，需要全流程指导 |
| `content` | 提升内容质量 | 已经在做了，但内容不够爆 |
| `monetize` | 提高变现效率 | 有流量但变现不理想 |
| `scale` | 已有一定规模 | 需要更上一层楼 |

### 选项卡片样式

```jsx
className={`w-full flex items-start gap-4 p-4 rounded-xl transition-all ${
  selected === option.value
    ? 'bg-gold/15 border border-gold/40 ring-1 ring-gold/30'   // 选中
    : 'bg-muted/30 border border-transparent'                  // 未选
}`}
```

选中时右侧显示 `<Check className="h-5 w-5 text-gold mt-0.5" />` 对号。

### 完成后

```typescript
const save = trpc.onboarding.save.useMutation();
save.mutate({ industry, industryLabel, followerCount, mainGoal });
// → 后端写入 onboarding 表 isCompleted=1
// → 自动 invalidate onboarding.get
// → modal 关闭
// → 首页恢复正常
```

## 21.4 未登录态完整文案库（11 个页面）

实测每个独立功能页都有未登录态遮罩：

| 路由 | 提示文案 | 按钮 |
|---|---|---|
| `/evolution` | 登录后查看智能体进化状态 | 立即登录 |
| `/history` | 登录后即可查看文案历史记录 | 立即登录 |
| `/video-analysis` | 登录后即可拆解爆款文案的成功密码 | 立即登录 |
| `/boom-generate` | 登录后即可根据爆款元素一键生成多篇爆款文案 | 立即登录 |
| `/video-production` | 登录后即可将文案转化为完整的拍摄制作方案 | 立即登录 |
| `/private-domain` | 登录后即可生成完整的私域成交话术 | 立即登录 |
| `/analysis` | 登录后即可使用 AI 深度分析文案结构 | 立即登录 |
| `/generate` | 登录后即可使用 AI 文案生成功能 | 立即登录 |
| `/monetization` | 登录后可根据行业定制专属 IP 变现路径 | 登录使用 |
| `/acquisition-video` | 登录后可生成精准获客的短视频方案 | 登录使用 |
| `/trending` | 登录后可抓取和浏览全网爆款视频文案 | 登录使用 |
| `/present-styles` | 登录后浏览各种爆款视频的呈现形式 | 登录使用 |

**两种按钮文案规律**：
- "立即登录"：内容生成类（writing intensive）
- "登录使用"：浏览类 + 配置类

复刻方建议：抽到 `i18n/auth.ts`：
```typescript
export const authPrompts = {
  evolutionPage: '登录后查看智能体进化状态',
  historyPage: '登录后即可查看文案历史记录',
  // ...
};
```

---

# ⅩⅩⅡ · tRPC 真实响应 Schema（实测 16 endpoint）

> 第四轮 Phase 17：用 sally zhao 当前 session cookies 直接调用所有 GET tRPC，反编译响应字段

## 22.1 tRPC 响应外壳格式

所有响应都用 batch 格式：

```typescript
type TrpcBatchResponse<T> = Array<{
  result: {
    data: {
      json: T,                            // 真实数据
      meta?: {                            // 类型 hint
        values?: Record<string, string[]>  // 如 { createdAt: ['Date'] }
      }
    }
  }
}>;
```

`meta.values` 告诉前端哪些字段需要反序列化（如 Date / BigInt）。

## 22.2 auth.me 真实响应

```typescript
type User = {
  id: number;                              // 2010002
  openId: string;                          // "mk9g7YY3JquSvSe5LGjzgP"（Manus 平台 ID）
  name: string;                            // "sally zhao"
  email: string;
  loginMethod: 'google';                   // OAuth provider
  role: 'user' | 'admin';
  isActivated: boolean;                    // 是否激活（邀请码兑换后 true）
  industry: string;                        // 用户级默认行业（来自 onboarding）
  createdAt: string;                       // ISO 8601
  updatedAt: string;
  lastSignedIn: string;
};
```

## 22.3 ipAccounts.active / list 真实响应

```typescript
type IpAccount = {
  id: number;                              // 390012
  userId: number;                          // 关联 User.id
  accountName: string;                     // "赵语AI"（账号名，复刻方不要用 name）
  industry: string;                        // "enterprise"
  industryLabel: string;                   // "企业服务"
  platform: 'douyin' | 'xiaohongshu' | 'shipinhao' | 'kuaishou' | 'bilibili';
  nickname: string;                        // 账号昵称（可与 accountName 同）
  followerCount: '1-1000' | '1000-10000' | '10000-100000' | '100000+';
  mainGoal: 'start' | 'content' | 'monetize' | 'scale';
  bio: string;                             // 业务描述
  product: string;                         // 主营产品/服务
  targetAudience: string;                  // 目标受众
  // createdAt / updatedAt 等标准列
};
```

## 22.4 stepData.getAll / get 真实响应

```typescript
type StepData = {
  id: number;                              // 2130012
  userId: number;
  stepKey: string;                         // "acc_390012_private_domain_v2" / "step1" 等
  stepData: string;                        // ⚠️ JSON string，需 JSON.parse
  isCompleted: 0 | 1;                      // SQLite/MySQL 的 boolean
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
```

**关键**：`stepData` 是 string，前端用 `JSON.parse(record.stepData)` 解构。复刻方用 PostgreSQL 推荐 `jsonb` 类型。

## 22.5 stepData.progress 真实响应

```typescript
type StepProgress = Array<{
  stepKey: string;                         // "step1" / "step3" / ...
  isCompleted: 0 | 1;
  completedAt: string | null;
  updatedAt: string;
}>;
```

用于 /ip-plan 页面计算 N/9 进度 + /home 的"我的IP打造进度"模块。

## 22.6 evolution.getConfig 真实响应

```typescript
type EvolutionConfig = {
  config: null | {                         // 用户自定义设置（首次为 null）
    autoEvolve: boolean;
    direction: 'comprehensive' | 'creativity' | 'conversion' | 'authentic';
  };
  feedbackStats: {
    total: number;
    good: number;
    bad: number;
    moduleStats: Record<string, { total: number, good: number, bad: number }>;
  };
  deepLearningCount: number;               // 深度学习档案数
  styleProfileCount: number;               // ⭐ 风格画像数（额外发现）
  deepLearningProfiles: Array<unknown>;
  styleProfiles: Array<unknown>;
};
```

> **新发现**：`styleProfile` 是独立于 `deepLearningProfile` 的概念。可能是 deepLearning.learn 完成后产出的"风格画像"。

## 22.7 evolution.feedbackTrend 真实响应

```typescript
type FeedbackTrend = Array<{
  date: string;                            // "2026-04-05"
  good: number;
  bad: number;
  total: number;
  satisfactionRate: number;                // good / total，无数据时 = -1
}>;
```

返回近 30 天的反馈趋势（推测）。`satisfactionRate: -1` 表示该日无反馈。

## 22.8 copywriting.list 真实响应

```typescript
type CopyRecord = {
  id: number;
  userId: number;
  scriptType: string;                      // "debate" 等 20 类英文 key
  boomElements: string;                    // ⚠️ 逗号分隔字符串！如 "contrast,curiosity,leverage,..."
  topic: string;                           // 主题
  generatedCopy: string;                   // 生成的文案 markdown
  // createdAt 等
};

type CopyListResponse = {
  records: CopyRecord[];
  // 推测有 total / hasMore / cursor 等分页字段
};
```

**关键**：`boomElements` 是**逗号分隔字符串**（不是数组）！复刻方两选：
- 数据库：`VARCHAR(255)` + 逗号分隔（同 source）
- 数据库：`JSONB` 数组 + 转换层（更规范但要 migration）

## 22.9 onboarding.get 真实响应

```typescript
type Onboarding = {
  id: number;                              // 90001
  userId: number;
  isCompleted: 0 | 1;
  answers: string;                         // JSON string of OnboardingAnswers
  createdAt: string;
  updatedAt: string;
};

type OnboardingAnswers = {
  industry: string;
  industryLabel: string;
  followerCount: '1-1000' | '1000-10000' | '10000-100000' | '100000+';
  mainGoal: 'start' | 'content' | 'monetize' | 'scale';
};
```

## 22.10 knowledge.getRecommendations 真实响应

```typescript
type Recommendations = {
  topScripts: Array<{ id, label, count, percentage }>;     // 用户最常用的脚本
  topElements: Array<{ id, label, emoji, count }>;          // 用户最常用的爆款元素
  topIndustry: { industry, industryLabel } | null;          // 主要行业
  unexploredScripts: Array<{                                // ⭐ "未探索"推荐
    id: string;                            // "opinion"
    label: string;                         // "聊观点"
    description: string;
    reason: string;                        // "你还未尝试过这类脚本，建议探索"
  }>;
};
```

> **未探索推荐机制**：基于用户 history 排除已用 → 推荐没用过的 20 个脚本类型。激励多样化创作。

## 22.11 空响应 endpoint（用户无数据时）

| Endpoint | 空响应 |
|---|---|
| `evolution.recentFeedback` | `[]` |
| `evolution.moduleRanking` | `[]` |
| `diagnosis.latest` | `null` |
| `diagnosis.history` | `[]` |
| `knowledge.getFavorites` | `[]` |
| `knowledge.getNotes` | `[]` |

## 22.12 数据库表结构推断

基于 tRPC 响应反推 Prisma schema：

```prisma
model User {
  id           Int      @id
  openId       String   @unique
  name         String
  email        String   @unique
  loginMethod  String   @default("google")
  role         String   @default("user")
  isActivated  Boolean  @default(false)
  industry     String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  lastSignedIn DateTime?
  
  ipAccounts   IpAccount[]
  stepData     StepData[]
  copywriting  Copywriting[]
  onboarding   Onboarding?
}

model IpAccount {
  id              Int      @id @default(autoincrement())
  userId          Int
  accountName     String
  industry        String
  industryLabel   String
  platform        String
  nickname        String
  followerCount   String
  mainGoal        String
  bio             String   @db.Text
  product         String
  targetAudience  String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
}

model StepData {
  id          Int       @id @default(autoincrement())
  userId      Int
  stepKey     String                          // "acc_{accId}_step3" / "step1"
  stepData    String    @db.Text              // JSON string
  isCompleted Int       @default(0)           // 0 | 1
  completedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  user        User      @relation(fields: [userId], references: [id])
  @@unique([userId, stepKey])
}

model Copywriting {
  id            Int      @id @default(autoincrement())
  userId        Int
  scriptType    String
  boomElements  String                         // 逗号分隔
  topic         String
  generatedCopy String   @db.Text
  createdAt     DateTime @default(now())
  
  user          User     @relation(fields: [userId], references: [id])
}

model Onboarding {
  id          Int      @id @default(autoincrement())
  userId      Int      @unique
  isCompleted Int      @default(0)
  answers     String   @db.Text                // JSON string
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id])
}

// 待加：Diagnosis / Evolution / DeepLearning / Knowledge / Trending 等
```

---

# ⅩⅩⅢ · 键盘 + 滚动 + 拖拽 + 剪贴板 + Web Speech + a11y

## 23.1 键盘快捷键

| 键 | 触发场景 |
|---|---|
| **Enter**（不带 Shift）| 在输入框提交（如 voice-chat 发送） |
| **Shift + Enter** | 在 textarea 换行（不提交） |
| **Escape** | 关闭 Dialog / Modal / 取消编辑 |
| **Tab** | 焦点切换（标准浏览器行为） |
| **Cmd/Ctrl/Alt 组合键** | bundle 监听了但**未发现具体用途**（推测保留功能） |

实测代码片段：
```javascript
// 输入框 Enter 提交（Shift+Enter 换行）
if (f.key === 'Enter' && !f.shiftKey) {
  f.stopPropagation();
  submit();
}

// Escape 关闭
if (event.key === 'Escape') closeDialog();
```

## 23.2 滚动行为

### Sticky Header

```html
<header class="sticky top-0 z-50 border-b border-gold/10 bg-background/70 backdrop-blur-2xl">
```

特点：
- `sticky top-0` 粘在顶部
- `z-50` 高于一般内容
- `bg-background/70` 70% 透明（**毛玻璃效果**）
- `backdrop-blur-2xl` 强模糊

### 程序化滚动

bundle 用了：
- `scrollTo({top:0, behavior:'smooth'})` 
- `scrollIntoView({behavior:'smooth', block:'center'})` （生成结果后滚动到结果区）

### "返回顶部"按钮

bundle 含 `scroll-up` 字符串，但未确认是否有可见 UI（可能在长页面如 /knowledge）。

## 23.3 文件拖拽上传

实测 bundle 用了完整 drag-and-drop API：
```
ondrop / onDragOver / onDragEnter / onDragLeave
dragenter / dragover / dragleave events
```

**确认**：step5 上传产品资料 + /deep-learning 添加文案样本 都支持**拖拽上传**。

复刻参考：
```jsx
<div className="rounded-xl border-2 border-dashed p-4 cursor-pointer transition-all
                border-border/30 hover:border-border/50 bg-card/10
                data-[drag=over]:border-gold/50 data-[drag=over]:bg-gold/5"
     onDragOver={e => { e.preventDefault(); setDragOver(true); }}
     onDragLeave={() => setDragOver(false)}
     onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
  ...
</div>
```

## 23.4 剪贴板 API

```javascript
navigator.clipboard.writeText(text)        // 文本复制（"复制"按钮统一用这个）
navigator.clipboard.write([blob])          // 富剪贴板（图片）
```

异常处理：捕获后 `toast.error('复制失败')`（旧浏览器 / HTTP 站点 / iframe 沙箱可能失败）。

## 23.5 Web Speech API（/voice-chat 实现）

```javascript
// STT 语音识别
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
  toast.error('浏览器不支持语音识别，请使用文字输入');
  return;
}

// TTS 文字转语音
const synth = window.speechSynthesis;
if (!synth) {
  toast.error('浏览器不支持语音合成');
  return;
}
```

**全部用浏览器原生 Web Speech API**，不依赖第三方。

兼容性问题：
- Safari iOS 部分支持
- Chrome 桌面 + Android 完整支持
- Firefox 部分支持

麦克风权限被拒：`toast.error('无法访问麦克风，请检查权限设置')`

## 23.6 无障碍 a11y（**实测几乎空白**）

实测全站 aria 属性：
- `aria-label`：唯一一处 "Notifications alt+T"（来自 sonner toaster）
- `aria-live` / `aria-relevant` / `aria-atomic`：来自 sonner
- 全站 **0 个 `role` 属性**

**复刻方必须补**：
- `<button aria-label="复制">` icon-only 按钮加 label
- `<input id="x" /><label htmlFor="x">` 表单关联
- `<nav role="navigation">` 语义化角色
- focus-visible 状态完善
- skip-link 跳过导航

---

# ⅩⅩⅣ · 危险操作弹窗（AlertDialog）

> 第四轮 Phase 19：bundle 反编译所有删除/确认场景

## 24.1 AlertDialog 完整组件（shadcn）

```typescript
import {
  AlertDialog,           // root
  AlertDialogTrigger,    // 触发按钮（推荐与 Button 组合用 asChild）
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,     // 确认按钮（默认 destructive 样式）
  AlertDialogCancel,     // 取消按钮
  AlertDialogPortal,
  AlertDialogOverlay,
} from '@/components/ui/alert-dialog';
```

## 24.2 实测确认弹窗文案库

| 场景 | 标题 / 描述 | 确认按钮 |
|---|---|---|
| 删除文案 (`/history`) | "删除后无法恢复，确定要删除这条文案记录吗？" | "确认删除" |
| 删除邀请码 (`/invite-manage`, admin) | "确定删除此邀请码？" | "确认删除" |
| 删除 IP 账号 (`/accounts`) | (推测) "确定要删除该 IP 账号？所有相关数据将丢失" | "确认删除" |
| 删除学习档案 (`/deep-learning`) | (推测) | "确认删除" |
| 取消收藏 (`/my-topics`) | 无弹窗，直接 toast.success("已取消收藏") | - |
| 清空对话 (`/voice-chat`) | (推测) "清空后无法恢复" | "清空记录，重新开始" |

## 24.3 操作完成后 toast

| 操作 | toast 文案 |
|---|---|
| 删除文案 | "已删除" |
| 删除账号 | "账号已删除" |
| 清空对话 | "对话已清空" / "已清空记录" |
| 取消收藏 | "已取消收藏" |
| 删除失败 | "删除失败：{msg}" |
| 取消收藏失败 | "取消收藏失败：{msg}" |

## 24.4 复刻范例

```jsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel,
         AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
         AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/ui/alert-dialog';

function DeleteCopyButton({ id, onDeleted }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>
            删除后无法恢复，确定要删除这条文案记录吗？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMutation.mutate({ id })}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            确认删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

# ⅩⅩⅤ · 业务边界 + Manus 依赖 + 商业模式

## 25.1 配额 / 算力（**当前没有**）

> 第四轮深度排查：bundle 中**无任何 quota / credit / billing / wallet / subscription 关键字**

**结论**：当前产品**没有付费 / 算力扣点机制**。
- 所有功能对登录用户免费
- 唯一限制可能是后端 rate limit（不在前端 UI 反映）
- 邀请码机制（`isActivated` 字段）可能是「邀请才能注册」，但激活后无配额

**推测商业模式**：
- 当前是 PMF 阶段（产品市场契合验证）
- 通过邀请码控制用户增长
- 后续可能加：会员订阅 / 算力购买 / 团队版

## 25.2 Manus 平台依赖（最小化）

实测 bundle 中 manus 引用：
```
manus-runtime-user-info             // localStorage key
manus.im                            // 域名
manuscdn.com                        // CDN（screenshot 图）
manus-analytics.com                 // analytics endpoint
files.manuscdn.com                  // 用户上传文件 CDN
```

**剥离 Manus 改造方案**：

1. **localStorage key 重命名**：
   - `manus-runtime-user-info` → `aiip-user-info`

2. **OG image 自托管**：
   - 现状：`https://files.manuscdn.com/webdev_screenshots/.../full.png`
   - 改：自己生成 1200x630 OG 图传 OSS

3. **Analytics 替换**：
   - 现状：`manus-analytics.com/api/send`
   - 改：直接用 Plausible / Umami 自部署

4. **去掉 Manus 标记**：
   - 删除 `<script id="manus-runtime">`
   - 删除 `<MANUS-CONTENT-ROOT>` 自定义元素

5. **文件上传**：
   - 后端：用自己的 S3 / OSS

## 25.3 文件上传规格

```typescript
const FILE_CONFIG = {
  maxSize: 20 * 1024 * 1024,                                  // 20 MB
  accept: '.pdf,.doc,.docx,.txt,.md,.csv',
};

// 实测使用页面：
// - /step/5 (爆款选题) 上传产品资料 + 人物介绍
// - /deep-learning 上传文案样本
```

后端处理：
- 支持文本类格式（PDF/Word/TXT/MD/CSV）
- 服务端解析提取文本（推测用 `pdf-parse / mammoth / fast-csv`）
- 存储推测：S3 + 元数据入库

## 25.4 KaTeX 数学公式

实测 bundle 用：
- `react-markdown + rehype-katex + rehype-raw`
- 仅支持 **inlineMath**（行内公式 `$x^2$`），不支持块级（`$$x^2$$`）

实际场景：AI 生成内容里包含百分比/数学公式时渲染。

## 25.5 BigInt 处理

bundle 含警告：`Please add a BigInt polyfill.`
- 推测后端某些 ID 用了 BigInt（超过 Number.MAX_SAFE_INTEGER）
- 复刻方注意：用 string 传 ID，避免精度丢失

## 25.6 React Query 缓存策略

```typescript
{
  staleTime: 0,        // 默认完全不缓存（每次都重新请求）
  staleTime: 6,        // 部分查询缓存 6ms（基本无缓存）
}
```

策略：**乐观刷新**——快速失效，依赖 server 给最新数据。

## 25.7 Console 日志规范

bundle 实测 log/warn/error 前缀：
- `[API Mutation Error]` - tRPC mutation 失败
- `[API Query Error]` - tRPC query 失败
- `[SW] Registered:` / `[SW] Registration failed:` - Service Worker
- `Failed to download image:` - 图像下载失败（step3 头像参考图）

复刻方建议沿用：
```typescript
console.error('[API Mutation Error]', mutation, error);
console.error('[API Query Error]', query, error);
console.log('[SW] Registered:', registration);
```

## 25.8 Plausible / Amplitude 自定义事件

实测 bundle **0 个** custom event 调用：
- 没有 `plausible('event_name')` / `amplitude.track('xxx')`
- **只跟 pageview**（自动）

复刻方建议：补上自定义事件追踪关键转化点：
- `signup_complete`
- `onboarding_complete`
- `step_n_completed`
- `copy_generated`
- `feedback_given` (good/bad)
- `account_created`
- `invite_redeemed`

---

# ⅩⅩⅥ · 修订 / 错误更正

> 第四轮排查中发现的对前面章节的修正

## 26.1 私域成交 6 阶段 key 修正（**重要**）

§Ⅹ.5 之前推测：
```typescript
{ key: 'icebreak', label: '破冰暖场' }   // ❌ 错误
```

**实测修正**：
```typescript
const PRIVATE_DOMAIN_STAGES = [
  { value: 'welcome',  label: '欢迎话术', desc: '新好友添加后的第一印象话术' },
  { value: 'warmup',   label: '破冰暖场' },                    // ✅ 是 warmup 不是 icebreak
  { value: 'trust',    label: '信任建立' },
  { value: 'discover', label: '需求挖掘' },
  { value: 'close',    label: '成交话术' },
  { value: 'follow',   label: '售后跟进' }
];
```

## 26.2 14 呈现形式 key 命名

实测 bundle 中部分 key（之前未列出）：
- `screen_record` (录屏)
- `tutorial` (教程)
- `vlog` (Vlog)
- `interview` / `street_interview` (街访)
- `duet` / `reaction` (反应)

完整列表需进一步抓取。

## 26.3 IpAccount 字段名修正

§3.7 之前推测 `name`，实测真实字段是 `accountName`：

```typescript
// 修正后
type IpAccount = {
  accountName: string;   // ✅ 不是 name
  nickname: string;
  followerCount: '1-1000' | '1000-10000' | '10000-100000' | '100000+';
  mainGoal: 'start' | 'content' | 'monetize' | 'scale';
  // ...
};
```

## 26.4 Onboarding 字段确认

之前未实测的 mainGoal 4 个 value 全部确认（§ⅩⅩⅠ.3）：
```
start | content | monetize | scale
```

## 26.5 boomElements 类型修正

§3.4 step7 的 lastElements 是 `string[]` 数组（前端层），但 §22.8 实测 server 返回的 `boomElements` 是**逗号分隔字符串**：

```typescript
// 前端 stepData (localStorage)
lastElements: ["contrast", "curiosity", "leverage"]   // string[]

// 后端 copywriting 表 (database)
boomElements: "contrast,curiosity,leverage"           // string (CSV)
```

复刻方注意：在 tRPC 中间层做序列化转换。

---

# ⅩⅩⅦ · 完整方法论数据库（实测真值）

> 第五轮 Phase 21：从 `knowledge.getScriptCases` API 抓到全部脚本案例 + bundle 反编译 23 公式 + 22 元素心理学

## 27.1 20 类脚本 — 真实英文 key（**6 处修正**）

⚠️ 之前 §Ⅹ.3 推测的 6 个 key 错误，第五轮实测修正：

| 中文 | ⚠️ 错误推测 key | ✅ 实测 key |
|---|---|---|
| 尬段子 | comedy | **humor** |
| 揭内幕 | expose | **reveal** |
| 秀蜕变 | transform | **transformation** |
| 答粉丝 | qna | **qa** |
| 追热点 | trend_news | **trend** |
| 打鸡血 | motivation | **motivate** |

### 完整 20 类（实测）

```typescript
export const SCRIPT_TYPES = [
  { id: 'opinion',        label: '聊观点',  desc: '表达个人观点，引发共鸣，适合知识分享类账号' },
  { id: 'process',        label: '晒过程',  desc: '展示操作过程，平台超大流量体，适合教程类内容' },
  { id: 'knowledge',      label: '教知识',  desc: '教学类内容，传递价值，适合专业领域分享' },
  { id: 'story',          label: '讲故事',  desc: '故事型脚本，塑造人设，适合个人品牌打造' },
  { id: 'humor',          label: '尬段子',  desc: '搞笑类内容，娱乐性强，适合泛娱乐账号' },
  { id: 'product',        label: '说产品',  desc: '以变现为目标的产品脚本，适合带货和商业推广' },
  { id: 'review',         label: '做测评',  desc: '产品/服务真实测评，横向对比，适合种草和消费决策' },
  { id: 'reveal',         label: '揭内幕',  desc: '揭露行业内幕/潜规则，满足窥探欲，引发传播' },
  { id: 'challenge',      label: '做挑战',  desc: '设定挑战目标并记录过程，制造悬念和期待' },
  { id: 'interview',      label: '做采访',  desc: '街头采访/人物访谈，真实反应引发共鸣' },
  { id: 'daily',          label: '拍日常',  desc: '记录真实生活/工作日常，打造真实人设' },
  { id: 'transformation', label: '秀蜕变',  desc: '展示前后对比/成长蜕变，激励人心' },
  { id: 'debate',         label: '搞辩论',  desc: '正反观点对抗，引发讨论和互动' },
  { id: 'list',           label: '列清单',  desc: '盘点型内容，信息密度高，收藏率高' },
  { id: 'reaction',       label: '看反应',  desc: '记录真实反应/惊喜时刻，情绪感染力强' },
  { id: 'qa',             label: '答粉丝',  desc: '回答粉丝提问，增强互动和粘性' },
  { id: 'collab',         label: '搞联动',  desc: '与其他博主/品牌联动，互相引流' },
  { id: 'behind',         label: '幕后花絮', desc: '展示幕后制作过程，增加真实感和信任' },
  { id: 'trend',          label: '追热点',  desc: '快速跟进热点话题，借势获取流量' },
  { id: 'motivate',       label: '打鸡血',  desc: '励志/激励型内容，传递正能量，引发共鸣' },
];
```

## 27.2 20 类脚本 × 67 个实战案例（来自 `knowledge.getScriptCases`）

```typescript
type ScriptCase = {
  title: string;          // "为什么90%的人永远赚不到钱"
  platform: '抖音' | '小红书' | '视频号' | '快手' | 'B站';
  industry: string;       // "商业" | "职场" | "美业" | ...
  copySnippet: string;    // 文案开头片段（~80字）
  boomElements: string[]; // ["反差", "共情"]（中文标签）
  metrics: string;        // "点赞82万 评论3.2万"
  viralReason: string;    // "打破常规认知，引发强烈共鸣"
};
```

### 案例分布

| 脚本类型 | 案例数 |
|---|---|
| opinion (聊观点) | 4 |
| process (晒过程) | **5** |
| knowledge (教知识) | 4 |
| story (讲故事) | 4 |
| humor (尬段子) | 3 |
| product (说产品) | 4 |
| review (做测评) | 3 |
| reveal (揭内幕) | 3 |
| challenge (做挑战) | 3 |
| interview (做采访) | 3 |
| daily (拍日常) | 3 |
| transformation (秀蜕变) | 3 |
| debate (搞辩论) | 3 |
| list (列清单) | 4 |
| reaction (看反应) | 3 |
| qa (答粉丝) | 3 |
| collab (搞联动) | 3 |
| behind (幕后花絮) | 3 |
| trend (追热点) | 3 |
| motivate (打鸡血) | 3 |
| **总计** | **67** |

### 实测样例（opinion 类）

```json
[
  {
    "title": "为什么90%的人永远赚不到钱",
    "platform": "抖音",
    "industry": "商业",
    "copySnippet": "你有没有发现，身边那些真正赚到钱的人，从来不在朋友圈晒收入？而那些天天晒的，往往都是在割韭菜……",
    "boomElements": ["反差", "共情"],
    "metrics": "点赞82万 评论3.2万",
    "viralReason": "打破常规认知，引发强烈共鸣"
  },
  {
    "title": "35岁以后千万别跳槽",
    "platform": "小红书",
    "industry": "职场",
    "copySnippet": "35岁跳槽不是重新开始，是从零开始。你以为带走了经验，其实丢掉了人脉、信任和隐性资源……",
    "boomElements": ["恐惧", "人群"],
    "metrics": "收藏12万 点赞45万",
    "viralReason": "精准击中35岁职场焦虑"
  },
  {
    "title": "实体店倒闭潮的真相",
    "platform": "视频号",
    "industry": "商业",
    "copySnippet": "不是实体店不行了，是你的实体店不行了。那些月入50万的店主，都在做这三件事……",
    "boomElements": ["反差", "成本"],
    "metrics": "转发8.5万 点赞38万",
    "viralReason": "..."
  }
]
```

完整 67 案例数据存档：`~/Desktop/aiipznt-clone-research/api/knowledge-cases-full.json`（13 KB）

复刻方建议：把这 67 案例作为 seed data 入库（`seed/script_cases.json`）。

## 27.3 23 个文案公式（实测全部）

| # | 公式名 | formula |
|---|---|---|
| 1 | 测评对比公式 | 产品展示 + 多维度对比 + 亲身体验 + 明确结论 |
| 2 | 产品种草公式 | 使用场景 + 亲身体验 + 效果展示 + 购买引导 |
| 3 | 场景痛点公式 | 场景痛点 + 低成本行动解决难题 + 具体操作过程 |
| 4 | 错误纠正公式 | 错误操作 + 负面结果 + 正确方法 + 正面结果展示 |
| 5 | 对比反差公式 | 常规认知 + 反差展示 + 原因分析 + 方法输出 |
| 6 | 反差冲击公式 | 常规认知 + 反转事实 + 深度解析 + 行动建议 |
| 7 | 故事塑人公式 | 困境开场 + 转折事件 + 行动突破 + 成果展示 + 方法提炼 |
| 8 | 好奇驱动公式 | 猎奇开头 + 过程展示 + 结果揭晓 + 价值总结 |
| 9 | 恐惧营销公式 | 风险描述 + 数据支撑 + 解决方案 + 行动引导 |
| 10 | 连载钩子公式 | 悬念开场 + 分步揭示 + 每步留钩 + 结尾预告下集 |
| 11 | 裂变传播公式 | 情绪触发 + 身份认同 + 分享动机 + 行动指引 |
| 12 | 清单盘点公式 | 数字标题 + 逐条列举 + 每条一句话解释 + 总结号召 |
| 13 | 情绪共鸣公式 | 情绪触发 + 共同经历 + 情感升华 + 价值输出 |
| 14 | 权威背书公式 | 专家引言 + 数据证据 + 案例展示 + 方法输出 |
| 15 | 热点借势公式 | 热点事件 + 独特角度 + 行业关联 + 价值输出 |
| 16 | 人设塑造公式 | 标签定位 + 故事支撑 + 价值观输出 + 口头禅强化 |
| 17 | 三步教学公式 | 问题提出 + 三步解决 + 每步详解 + 效果验证 |
| 18 | 社会证明公式 | 用户评价 + 成功案例 + 数据展示 + 信任建立 |
| 19 | 私域引流公式 | 价值展示 + 利益诱导 + 行动指引 + 私信引导 |
| 20 | 挑战记录公式 | 目标设定 + 过程记录 + 困难展示 + 结果揭晓 |
| 21 | 痛点放大公式 | 痛点描述 + 后果放大 + 解决方案 + 效果展示 |
| 22 | 稀缺促单公式 | 价值塑造 + 限时限量 + 损失描述 + 立即行动 |
| 23 | 信任递进公式 | 免费价值 + 小额体验 + 效果展示 + 高客单转化 |

`/knowledge` 页面 4 个 tab：
- 20 类脚本
- 20 大爆款（22 元素，§27.4）
- 开头公式（部分公式归类）
- 核心公式（含上面 23 个）

## 27.4 22 大爆款元素 — 完整心理学描述（实测）

```typescript
export const HOT_ELEMENTS = [
  // 经典元素 (11 个)
  { id: 'greed',           label: '贪念',         emoji: '💰', category: '经典元素', description: "利益驱动，让人觉得'不做就亏了'，触发占便宜心理" },
  { id: 'fear',            label: '恐惧',         emoji: '😨', category: '经典元素', description: "损失厌恶、风险警告，'不知道就会被坑'的焦虑感" },
  { id: 'curiosity',       label: '猎奇',         emoji: '🔍', category: '经典元素', description: "信息差、悬念、反常识，'不看完就亏了'的好奇心" },
  { id: 'contrast',        label: '反差',         emoji: '🔄', category: '经典元素', description: "出乎意料的对比，颠覆认知，制造'原来是这样'的冲击" },
  { id: 'worst',           label: '最差',         emoji: '⚠️', category: '经典元素', description: '最差情况/底线思维，用最坏结果倒逼行动' },
  { id: 'leverage',        label: '借势',         emoji: '🔥', category: '经典元素', description: '借热点、借名人、借趋势，四两拨千斤' },
  { id: 'resonance',       label: '共鸣',         emoji: '💬', category: '经典元素', description: "说出心里话，'这不就是我吗'的认同感" },
  { id: 'empathy',         label: '共情',         emoji: '🤝', category: '经典元素', description: "感同身受，情绪代入，'我理解你'的温暖" },
  { id: 'small_big',       label: '以小搏大',     emoji: '🎯', category: '经典元素', description: '小人物逆袭、小投入大回报、小细节大变化' },
  { id: 'low_cost_high',   label: '低成本高回报', emoji: '📈', category: '经典元素', description: '明确的投入产出比，花最少的钱/时间得到最大的结果' },
  { id: 'low_cost_unknown',label: '低成本未知回报',emoji:'🎰', category: '经典元素', description: '低门槛试错，结果未知但充满期待，激发冒险和尝试欲' },
  
  // 情绪驱动 (2 个)
  { id: 'anger',           label: '愤怒',         emoji: '😡', category: '情绪驱动', description: '引发不满和共鸣，激发传播欲' },
  { id: 'surprise',        label: '惊喜',         emoji: '😲', category: '情绪驱动', description: '超出预期的结果，制造 wow 时刻' },
  
  // 内容策略 (1 个独立 + 5 个与脚本重叠)
  { id: 'controversy',     label: '争议',         emoji: '💬', category: '内容策略', description: '有争议性的观点，引发讨论和互动' },
  // 注：内容策略其他 5 个 (热点/揭秘/清单/挑战/蜕变) 与脚本类型重叠，复用同一 id
  
  // 转化驱动 (4 个)
  { id: 'scarcity',        label: '稀缺',         emoji: '⏳', category: '转化驱动', description: '限时限量，制造紧迫感促进行动' },
  { id: 'social_proof',    label: '社会证明',     emoji: '👍', category: '转化驱动', description: '他人评价/案例，增强信任感' },
  { id: 'authority',       label: '权威',         emoji: '🎓', category: '转化驱动', description: '专家/机构背书，提升可信度' },
  { id: 'benefit',         label: '利益',         emoji: '🎁', category: '转化驱动', description: '直接利益承诺，明确价值主张' },
];
```

## 27.5 14 呈现形式 — 真实 key + tips（**完整重写**）

⚠️ **重大修正**：§Ⅹ.6 之前把 20 类脚本误认为是 14 呈现形式，现在重抓真实 14 形式：

```typescript
export const PRESENT_STYLES = [
  { id: 'talking_head',    label: '口播',     description: '真人出镜直接讲述，适合知识分享和观点输出', tips: '注意表情管理和语速控制，前 3 秒表情要夸张' },
  { id: 'drama',           label: '剧情',     description: '短剧/情景剧形式，适合讲故事和产品植入',     tips: '冲突前置，反转要出人意料' },
  { id: 'tutorial',        label: '教程',     description: '步骤式教学，适合技能分享和产品使用',        tips: '声画分离效果更好，步骤要清晰' },
  { id: 'vlog',            label: 'Vlog',     description: '日常记录/体验分享，适合人设打造',            tips: '真实感最重要，不要过度修饰' },
  { id: 'street_interview',label: '街访',     description: '街头采访形式，适合话题讨论和互动',          tips: '问题要有争议性，被采访者反应要真实' },
  { id: 'comparison',      label: '对比测评', description: '产品/方法对比，适合种草和测评',              tips: '对比维度要清晰，结论要明确' },
  { id: 'list_style',      label: '清单盘点', description: '盘点型内容，信息密度高',                    tips: '数字要具体，排序有逻辑' },
  { id: 'mashup',          label: '混剪',     description: '素材混剪+配音，适合情感和知识类',           tips: '画面节奏要配合文案节奏' },
  { id: 'screen_record',   label: '录屏',     description: '屏幕录制+讲解，适合软件教程和数据展示',     tips: '操作要流畅，重点部分要放大' },
  { id: 'animation',       label: '动画',     description: '动画/图文动效形式，适合科普和数据可视化',   tips: '动效不要过于花哨，信息传达为主' },
  { id: 'reaction',        label: '反应',     description: '看视频/看评论的反应，适合二创和互动',       tips: '反应要真实有趣，评论要有代表性' },
  { id: 'before_after',    label: '前后对比', description: '变化前后对比，适合美妆/装修/健身等',        tips: '对比要在同一条件下，差异要明显' },
  { id: 'pov',             label: 'POV视角',  description: '第一人称视角，沉浸式体验',                  tips: '代入感要强，场景要真实' },
  { id: 'qa',              label: '问答',     description: '一问一答形式，适合知识科普',                tips: '问题要是用户真正关心的' },
];
```

⚠️ 注意：`reaction` 与脚本类型 `reaction` 重名，但语义不同（脚本类型 reaction = 看反应，呈现形式 reaction = 看视频反应）。
⚠️ 注意：`qa` 与脚本类型 `qa` 重名（脚本 qa = 答粉丝，呈现 qa = 一问一答）。

## 27.6 /ai-video 6 视频类型（独立于上面 14）

```typescript
export const AI_VIDEO_TYPES = [
  { id: '口播',     label: '口播',     desc: '真人出镜讲述' },
  { id: '剧情',     label: '剧情',     desc: '故事情节演绎' },
  { id: 'Vlog',     label: 'Vlog',     desc: '生活记录风格' },
  { id: '产品展示', label: '产品展示', desc: '商品种草带货' },
  { id: '街头采访', label: '街头采访', desc: '随机路人互动' },
  { id: '教程',     label: '教程',     desc: '知识技能教学' },
];
```

⚠️ 注意：这 6 个用**中文字符串作 ID**（不是英文 key），与上面的 14 形式系统不同。

## 27.7 私域 6 阶段 — 完整 4 字段（icon + desc）

```typescript
export const PRIVATE_DOMAIN_STAGES = [
  { value: 'welcome',  label: '欢迎话术', icon: 'Send',          desc: '新好友添加后的第一印象话术' },
  { value: 'warmup',   label: '破冰暖场', icon: 'MessageCircle', desc: '日常互动、朋友圈评论、私聊破冰' },
  { value: 'trust',    label: '信任建立', icon: 'Shield',        desc: '价值输出、案例分享、专业展示' },
  { value: 'discover', label: '需求挖掘', icon: 'Search',        desc: '挖掘客户真实需求、痛点和预算' },        // 实测从 SPEC §Ⅷ.2.2
  { value: 'close',    label: '成交话术', icon: 'TrendingUp',    desc: '产品推荐、异议处理、促单话术' },
  { value: 'follow',   label: '售后跟进', icon: 'CheckCircle',   desc: '复购引导、转介绍话术、社群运营' },        // 实测推测
];
```

## 27.8 5 大选题分类（step5）

```typescript
export const TOPIC_CATEGORIES = [
  { id: 'traffic',   label: '流量型', emoji: '🔥', desc: '破圈引流，勾精准人群' },
  { id: 'monetize',  label: '变现型', emoji: '💰', desc: '直接转化变现' },
  { id: 'persona',   label: '人设型', emoji: '👤', desc: '让人记住你这个人' },
  { id: 'cognition', label: '认知型', emoji: '🧠', desc: '提升用户认知，建立专业形象' },
  { id: 'case',      label: '案例型', emoji: '📋', desc: '展示结果，促进成交' },
];
```

每类 20 个选题 = 100 个选题（之前 §7.6 已抓）。

---

# ⅩⅩⅧ · CSS 极致深挖（Tailwind v4 + 第五轮补充）

## 28.1 完整断点（Tailwind v4 默认）

```css
sm:  640px   /* 40rem */
md:  768px   /* 48rem */
lg:  1024px  /* 64rem */
xl:  1280px  /* 80rem */
2xl: 1536px  /* 96rem */
```

## 28.2 完整 max-w-* 容器宽度（13 档）

```css
.max-w-xs   { max-width: var(--container-xs);  /* ~20rem 320px */ }
.max-w-sm   { max-width: var(--container-sm);  /* ~24rem 384px */ }
.max-w-md   { max-width: var(--container-md);  /* ~28rem 448px */ }
.max-w-lg   { max-width: var(--container-lg);  /* ~32rem 512px */ }
.max-w-xl   { max-width: var(--container-xl);  /* ~36rem 576px */ }
.max-w-2xl  { max-width: var(--container-2xl); /* ~42rem 672px */ }
.max-w-3xl  { max-width: var(--container-3xl); /* ~48rem 768px */ }
.max-w-4xl  { max-width: var(--container-4xl); /* ~56rem 896px */ }
.max-w-5xl  { max-width: var(--container-5xl); /* ~64rem 1024px */ }
.max-w-6xl  { max-width: var(--container-6xl); /* ~72rem 1152px */ }
.max-w-7xl  { max-width: var(--container-7xl); /* ~80rem 1280px */ }
.max-w-max  { max-width: max-content; }
.max-w-none { max-width: none; }
```

实测使用情况见 §29。

## 28.3 完整字号 text-* (10 档)

```css
.text-xs   /* ~12px */
.text-sm   /* ~14px */
.text-base /* ~16px */
.text-lg   /* ~18px */
.text-xl   /* ~20px */
.text-2xl  /* ~24px */
.text-3xl  /* ~30px */
.text-4xl  /* ~36px */
.text-5xl  /* ~48px */
.text-6xl  /* ~60px */
```

> 实测**未使用 text-7xl / 8xl / 9xl**，但首页 Hero H1 用了 `text-7xl/8xl`（响应式）。

## 28.4 字体 weight 5 档（用了哪些）

```css
font-black     /* 900 - Logo "AIP" */
font-bold      /* 700 - H1/H2 中文标题 */
font-semibold  /* 600 - Modal 标题 / 数字 */
font-medium    /* 500 - 按钮 / tab / card 副标题 */
font-normal    /* 400 - 正文 */
```

> 未使用：thin/extralight/light/extrabold

## 28.5 间距 padding p-* (9 档)

```css
.p-0  .p-1  .p-2  .p-3  .p-4  .p-5  .p-6  .p-8  .p-16
```

> 未使用：p-7 / p-9-15 / p-20+

## 28.6 间距 gap-* (8 档)

```css
.gap-0  .gap-1  .gap-2  .gap-3  .gap-4  .gap-6  .gap-7  .gap-8
```

> 未使用：gap-5 / gap-9+

## 28.7 圆角 rounded-* (8 档)

```css
.rounded-none /* 0 */
.rounded-xs   /* var(--radius-xs) */
.rounded-sm   /* calc(var(--radius) - 4px) */
.rounded-md   /* calc(var(--radius) - 2px) */
.rounded-lg   /* var(--radius) = 0.75rem (12px) */
.rounded-xl   /* calc(var(--radius) + 4px) */
.rounded-2xl  /* var(--radius-2xl) */
.rounded-full /* 3.40282e38px (无穷大) */
.rounded-t    /* 仅顶部圆角 0.25rem */
```

## 28.8 渐变方向 (4 种)

```css
.bg-gradient-to-b   /* 向下 */
.bg-gradient-to-br  /* 右下 */
.bg-gradient-to-r   /* 向右 - step 进度条用 */
.bg-gradient-to-t   /* 向上 */
```

> 未使用：to-l / to-tl / to-bl / to-tr

## 28.9 z-index 层级 (4 档 + 1)

```css
.z-10  /* 普通浮层 */
.z-20  /* 中层 */
.z-40  /* modal overlay */
.z-50  /* sticky header / dialog content / popover */
```

## 28.10 backdrop-blur (3 档)

```css
.backdrop-blur-sm   /* 弱模糊（如 input focus 态）*/
.backdrop-blur-xl   /* 强模糊（dropdown menu）*/
.backdrop-blur-2xl  /* 最强（header / 移动端 nav）*/
```

## 28.11 transition-duration (8 档)

```css
.duration-75   /* 75ms - 极快 */
.duration-100  /* 100ms */
.duration-150  /* 150ms - 默认 hover */
.duration-200  /* 200ms - dialog 进出 */
.duration-300  /* 300ms - underline 展开 */
.duration-500  /* 500ms */
.duration-700  /* 700ms */
.duration-1000 /* 1s */
```

## 28.12 缓动函数 cubic-bezier (4 种)

```css
cubic-bezier(.4, 0, .2, 1)    /* 标准 ease-in-out (glass-card 过渡) */
cubic-bezier(.4, 0, .6, 1)    /* Tailwind --animate-pulse */
cubic-bezier(.8, 0, 1, 1)     /* 加速 */
cubic-bezier(0, 0, .2, 1)     /* 减速 (pop in) */
```

## 28.13 Tailwind v4 现代选择器 :has()

实测使用 `:has()` 智能选择器（CSS Selectors Level 4）：

```css
[data-slot="card"]:has([data-slot=card-action])   /* 包含 action 的 card */
[data-slot="input-group"]:has([data-slot=input-group-control]:focus-visible)
:has([data-state=checked])                         /* 包含 checked 的父 */
:has(:disabled)                                    /* 含 disabled 的父 */
:has([data-orientation=horizontal])                /* 横向 tabs */
:has(:focus)                                       /* 含 focus 的父 */
```

复刻方注意：**Safari 15.4+ / Chrome 105+ / Firefox 121+** 才支持。Tailwind v4 默认依赖。

## 28.14 媒体查询完整 (7 个)

```css
@media (min-width: 640px)   /* sm */
@media (min-width: 40rem)   /* sm (rem) */
@media (min-width: 48rem)   /* md */
@media (min-width: 1024px)  /* lg */
@media (min-width: 64rem)   /* lg (rem) */
@media (min-width: 80rem)   /* xl */
@media (min-width: 96rem)   /* 2xl */
@media (forced-colors: active)  /* Windows 高对比模式 */
@media (hover: hover)        /* 区分鼠标 vs 触摸设备 */

/* ⚠️ 没有 @media print */
```

## 28.15 @layer 层级 (Tailwind v4 标准)

```css
@layer base         /* 重置样式 */
@layer components   /* shadcn 组件、glass-card 等 */
@layer properties   /* @property 自定义属性 */
@layer theme        /* 主题 token */
@layer utilities    /* tw 原子类 */
```

## 28.16 color-mix 用法（OKLAB）

CSS 中 1 处用了 `color-mix(in oklab, ...)`，是 Tailwind v4 标志：

```css
/* 例：当前色 50% 透明 */
color: color-mix(in oklab, currentcolor 50%, transparent);

/* 例：金色阴影叠加 */
--tw-shadow-color: color-mix(in oklab, oklab(82% .0122 .139/.05) ...);
```

复刻方：`oklab()` 浏览器兼容 = Safari 15.4+ / Chrome 111+

## 28.17 第三方颜色调色板（除 gold）

实测引用了 Tailwind 默认调色板的部分颜色：

```
amber-400 / amber-500    /* 橙黄（活跃状态）*/
emerald-500              /* 翠绿（success）*/
green-400 / green-500    /* 绿（成功状态）*/
gray-700 / gray-800      /* 灰（次级文字）*/
black / white            /* 边界 */
```

复刻方建议：在 `tailwind.config.ts` 加这些 fallback：
```typescript
extend: {
  colors: {
    // gold + 默认调色板（Tailwind v4 默认全引入）
  }
}
```

## 28.18 缺失的样式类（产品没用）

复刻方可放心**不实现**：
- ❌ `@media print` 样式
- ❌ rtl / dir="rtl" 支持
- ❌ light theme（产品永远 dark）
- ❌ skeleton 占位符（用 `text-muted` + `animate-pulse` 替代）
- ❌ `text-7xl` 及以上原子类（仅 hero 用响应式 `text-7xl lg:text-8xl`）

---

# ⅩⅩⅨ · 每页元数据 + 布局变体表

> 第五轮 Phase 23：跳 16 个核心页面实测每页元数据

## 29.1 document.title — **不动态**（SEO 漏洞）

实测：

| 路由 | document.title |
|---|---|
| `/` | AIP全案获客操盘手 - OPC全案落地，从流量到成交 |
| **其他全部页面** | **AiIP超级获客智能体**（不变） |

**SEO 严重漏洞**：除首页外所有页面 title 都一样。复刻方必补：

```typescript
// 每个页面用 useEffect 动态设置
useEffect(() => {
  document.title = `${pageTitle} - AIP智能体`;
}, [pageTitle]);

// 或用 Helmet
<Helmet><title>{pageTitle} - AIP智能体</title></Helmet>
```

推荐 title 模板：

| 路由 | 推荐 title |
|---|---|
| `/` | AIP全案获客操盘手 - OPC全案落地，从流量到成交 |
| `/guide` | 使用说明 - AIP智能体 |
| `/ip-plan` | 我的 IP 方案 - AIP智能体 |
| `/diagnosis` | 7 维度 IP 诊断 - AIP智能体 |
| `/evolution` | 智能体进化中心 - AIP智能体 |
| `/accounts` | IP 账号管理 - AIP智能体 |
| `/my-topics` | 我的选题库 - AIP智能体 |
| `/history` | 历史记录 - AIP智能体 |
| `/knowledge` | AIP 文案方法论 - AIP智能体 |
| `/voice-chat` | 语音对话 - AIP智能体 |
| `/step/{n}` | Step {n} {名} - AIP智能体 |
| `/{module}` | {模块名} - AIP智能体 |

## 29.2 H1 字号体系（实测 4 档 + 响应式）

| 页面 | H1 类名 | 像素估算 |
|---|---|---|
| `/`（首页 Hero）| `text-5xl md:text-7xl lg:text-8xl font-black` | 48 / 72 / 96px |
| `/ip-plan` | `text-3xl font-bold` | 30px |
| `/evolution` | `text-3xl font-bold` | 30px |
| `/my-topics` | `text-3xl font-bold` | 30px |
| `/trending` | `text-3xl font-bold` | 30px |
| `/present-styles` | `text-3xl font-bold` | 30px |
| `/step/3` | `text-3xl font-bold` | 30px |
| `/step/7` | `text-3xl font-bold` | 30px |
| `/diagnosis` | `text-2xl md:text-3xl font-bold` | 24 / 30px |
| `/history` | `text-2xl md:text-3xl font-bold` | 24 / 30px |
| `/knowledge` | `text-2xl md:text-3xl font-bold` | 24 / 30px |
| `/accounts` | `text-2xl font-bold` | 24px |
| `/deep-learning` | `text-2xl font-bold` | 24px |
| `/guide` | `text-2xl font-black` | 24px (英文标题加重) |
| `/ai-video` | `text-2xl font-black` | 24px (英文标题 STORYBOARD) |
| `/voice-chat` | `text-xl font-black` | 20px (英文标题 VOICE CHAT) |

**规律**：
- **英文标题 (`USER GUIDE` / `VOICE CHAT` / `STORYBOARD`)** → `font-black`（更粗）
- **中文标题** → `font-bold`
- **首页 Hero** → 跨 3 档响应式（5xl / 7xl / 8xl）
- **小屏移动端** → `text-2xl`，桌面 → `text-3xl`（用 md: 前缀）

## 29.3 容器 max-w-* 使用情况

| 容器宽度 | 使用页面 | 适用场景 |
|---|---|---|
| `max-w-7xl` (1280px) | /trending | 内容密度高的卡片网格 |
| `max-w-6xl` (1152px) | /evolution, /my-topics, /present-styles, /step/7 | 多列内容 |
| `max-w-5xl` (1024px) | /ip-plan, /step/3 | 中等内容（含 9 个 step 卡） |
| `max-w-4xl` (896px) | 首页 hero, /guide, /diagnosis, /accounts | 标准内容页 |
| `max-w-3xl` (768px) | /voice-chat, /deep-learning | 单列内容 / 对话流 |
| `max-w-2xl` (672px) | /diagnosis 局部 | 表单 |
| `max-w-md` (448px) | /ai-video, /trending 局部 | 小卡片 |
| `max-w-sm` (384px) | /knowledge 搜索框 | 输入控件 |

## 29.4 Container Padding 模式

实测所有页面都用同一个根容器：

```jsx
<main className="container mx-auto px-4 pt-24 pb-12 max-w-{Nxl}">
  ...
</main>
```

- `container` 自动响应（小屏 100% / sm 1.5rem / lg 2rem）
- `pt-24` (6rem = 96px) — 给 header sticky 留位置
- `pb-12` (3rem = 48px) — 底部留白

## 29.5 SPA 路由切换无 page transition

实测：路由切换时**无淡入淡出动画**，直接换内容。复刻方建议：
```jsx
// 加个简单的过渡
<motion.div
  key={location.pathname}
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
>
  <Outlet />
</motion.div>
```

---

# ⅩⅩⅩ · HTTP 响应头 + 安全配置（实测）

> 第五轮 Phase 24：curl -I 抓全部关键资源响应头

## 30.1 服务端栈（从响应头反推）

```
HTTP/2 协议
Cloudflare CDN (server: cloudflare, cf-ray)
Backend: Express.js (x-powered-by: Express)
部署: Google Cloud (x-cloud-trace-context)
TLS: Cloudflare 自动管理
```

## 30.2 完整响应头表

### 首页 HTML (`/`)

```http
HTTP/2 200
content-type: text/html; charset=utf-8
cache-control: no-cache, no-store, must-revalidate    ← 完全不缓存
expires: 0
pragma: no-cache
strict-transport-security: max-age=31536000; includeSubDomains   ← HSTS 1 年
server: cloudflare
```

### tRPC API (`/api/trpc/*`)

```http
HTTP/2 204                                            ← OPTIONS preflight
content-type: text/html
cf-cache-status: DYNAMIC                              ← API 不缓存
x-cloud-trace-context: ...                            ← GCP tracing
x-powered-by: Express
```

### 静态资源 (`/assets/*.js` / `/assets/*.css` / `/icons/*` / `manifest.json` / `sw.js`)

```http
HTTP/2 200
cache-control: max-age=7776000                        ← 90 天缓存
content-length: ...
server: cloudflare
```

## 30.3 ✅ 已配置的安全头

| 头 | 值 | 评级 |
|---|---|---|
| `strict-transport-security` | `max-age=31536000; includeSubDomains` | ✅ HSTS 1 年 + 子域名 |
| `cache-control` (HTML) | `no-cache, no-store, must-revalidate` | ✅ HTML 不缓存 |
| `cache-control` (静态) | `max-age=7776000` | ✅ 90 天 |
| HTTPS | 强制 + Cloudflare | ✅ |

## 30.4 ❌ 缺失的安全头（**复刻必补**）

| 缺失 | 推荐值 | 防御 |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://manus-analytics.com https://plausible.io; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' https://*.amplitude.com https://*.manus.im https://plausible.io; font-src 'self' https://fonts.gstatic.com data:` | XSS / 资源加载控制 |
| `X-Frame-Options` | `DENY` | clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME 嗅探攻击 |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | 隐私 |
| `Permissions-Policy` | `camera=(), microphone=(self), geolocation=(), interest-cohort=()` | 浏览器特性 |
| `X-DNS-Prefetch-Control` | `on` | 性能 |

## 30.5 推荐 Cloudflare Workers 中间件

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const response = await fetch(request);
  const newResponse = new Response(response.body, response);
  
  // 安全头补全
  newResponse.headers.set('Content-Security-Policy', '...');
  newResponse.headers.set('X-Frame-Options', 'DENY');
  newResponse.headers.set('X-Content-Type-Options', 'nosniff');
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  newResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(self)');
  
  return newResponse;
}
```

或者用 **Helmet.js** (Express middleware)：
```javascript
import helmet from 'helmet';
app.use(helmet({
  contentSecurityPolicy: { directives: { ... } },
  hsts: { maxAge: 31536000, includeSubDomains: true }
}));
```

## 30.6 Cookie 策略（推测）

实测未直接抓 Set-Cookie 头（需用 fetch with credentials），但从行为推测：

```http
Set-Cookie: session=...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000
```

复刻方要点：
- `HttpOnly` 防 XSS 窃取
- `Secure` 仅 HTTPS
- `SameSite=Lax` 防 CSRF（不影响外部链接跳转）
- `Max-Age` 30 天默认

---

# ⅩⅩⅪ · 真实数据范例库

> 第五轮 Phase 25：完整解析已抓数据 + API 真实响应

## 31.1 /trending 25 条爆款样本（已抓的全集）

来自 `/Desktop/aiipznt-clone-research/pages/13-全网爆款库.json`（51 KB），共 25 条爆款记录。

### 卡片 schema

```typescript
type TrendingItem = {
  platform: '📕 小红书' | '📱 抖音' | '📺 视频号' | '🎬 快手' | '📺 B站',
  presentStyle: string,                  // 呈现形式中文（如 '清单盘点' '口播' '剧情'）
  title: string,                         // 标题（红字加粗显示）
  copy: string,                          // 完整文案 (4-5 段)
  tags: string[],                        // 4-5 个 tag
  metrics: {                             // 数据
    likes: string,                       // '8.2万'
    comments: string,                    // '1.5万'
    shares: string,                      // '3.8万'
  }
};
```

### 实测样本 (3/25)

```json
[
  {
    "platform": "📕 小红书",
    "presentStyle": "清单盘点",
    "title": "普通人如何靠小红书内容变现？我用这3招，月入5位数！",
    "copy": "你是不是也想在小红书上赚钱？但不知道从何开始？我告诉你，普通人也能做到。2025年，我靠小红书内容变现，每月稳定收入超过5位数...",
    "tags": ["小红书变现", "内容定位", "私域流量", "普通人逆袭"],
    "metrics": { "likes": "8.2万", "comments": "1.5万", "shares": "3.8万" }
  },
  {
    "platform": "📺 视频号",
    "presentStyle": "口播",
    "title": "视频号直播新玩法：一场带货20万，我只用了这3个技巧！",
    "copy": "...",
    "tags": ["视频号直播", "带货技巧", "私域流量", "数据分析"],
    "metrics": { "likes": "6.5万", "comments": "1.2万", "shares": "2.8万" }
  },
  {
    "platform": "🎬 快手",
    "presentStyle": "剧情",
    "title": "快手土味营销逆袭：我用AI短剧，月入10万！",
    "copy": "你是不是觉得快手内容太'土'？不适合你？我告诉你...",
    "tags": ["快手", "AI短剧", "土味营销"],
    "metrics": { "likes": "1.8万 (估)", "comments": "...", "shares": "3.5万" }
  }
]
```

完整 25 条数据：`pages/13-全网爆款库.json`

## 31.2 /knowledge.getScriptCases 67 个案例（完整全集）

来自 `~/Desktop/aiipznt-clone-research/api/knowledge-cases-full.json`（13 KB）。

按脚本类型分类，每类 3-5 个案例。结构见 §27.2。

复刻方建议作为后端 seed data：
```bash
psql -d aiipznt -c "\\copy script_cases FROM 'knowledge-cases-full.json' WITH (FORMAT json)"
```

## 31.3 step3 实测真实生成结果（sally 账号）

来自 `localStorage.aiip_memory_acc_390012_step3_account_v3` (8 KB)，结构见 §3.4 step3 Schema。

实测 sally 提供的输入：
```
lastPlatform: "douyin"
lastPersonalInfo: "我是一家软件开发公司的负责人，我们定制企业和个人级别的智能体开发，和opc培训业务..."
lastTargetAudience: "企业老板和opc创业者"
lastCurrentAccount: "新账号"
```

AI 输出包含：
- **5 个昵称推荐**：智能体老王 / AI定制师老高 / 智能体架构师高 / 高老板的智能体 / AI赋能者老高
- **头像设计**：风格 + 配色 + AI Prompt（477 字英文）
- **背景图设计**：含 3 平台尺寸（抖音 1128×636 / 小红书 1242×800 / 视频号 1200×675）
- **简介**：6 个版本（3 平台 × 主号副号）
- **整体策略**：视觉统一性 / 第一印象 / 转化路径 / 平台优先级

## 31.4 step5 实测 100 个选题样本（sally）

来自 `localStorage.aiip_memory_acc_390012_step5_topics_v2` (22 KB)，5 类各 20 个。

实测样本：
```json
{
  "traffic": [
    { "id": 1, "title": "老板们为什么还在熬夜加班", "logicType": "恐惧", "viralPotential": "⭐⭐⭐⭐" },
    { "id": 2, "title": "别再用人肉做表格了", "logicType": "贪", "viralPotential": "⭐⭐⭐⭐" },
    // ...
  ],
  "monetize": [...20],
  "persona": [...20],
  "cognition": [...20],
  "case": [...20]
}
```

## 31.5 step4b 实测变现路径（sally）

来自 `localStorage.aiip_memory_acc_390012_step4b_monetization` (8 KB)。

完整 3 阶梯：
- **0 → 90 万**（6-12 个月）：起步阶段，引流品 + 信任品 + 利润品
- **100 万 → 1000 万**（12-24 个月）：发展阶段，团队建设 + 体系化
- **1000 万 → 1 亿**（24-48 个月）：规模化，品牌化 + 矩阵化

每阶梯 4 个产品（FABE 字段）+ 流量策略 + 转化流程 + 关键动作 + 风险提示。

---

# ⅩⅩⅫ · 业务规则 + 第五轮修正

## 32.1 实测业务规则（来自 API 响应 + bundle 行为）

### Step 数据是按 IP 账号绑定（不是按用户）

stepData.stepKey 格式：
```
"acc_{accountId}_{stepName}_v{version}"

例：
acc_390012_step3_account_v3
acc_390012_private_domain_v2
```

✅ **同一用户不同账号的 step 数据互相隔离**
✅ 切换账号时 stepData 自动按 accountId 过滤

### onboarding 是按用户级别（不是账号）

`onboarding.answers.industry` 是用户级默认行业，作为新建账号的预填值。

### user.industry vs account.industry

```
优先级：account.industry > user.industry
当前页面行业 = activeAccount.industry || user.industry || onboarding.industry
```

### 账号上限（推测）

实测 sally 只有 1 个账号（赵语AI），未触发上限。bundle 中未发现 maxAccounts 限制，**推测无上限**或上限较高。

### 切换账号触发整页 reload

实测 `ipAccounts.switchActive.useMutation` 的 onSuccess：
```typescript
onSuccess: async (d, p) => {
  localStorage.setItem('aiip_active_account_id', String(p.id));
  if (d.account) updateLocalCache(p.id, d.account);
  await utils.invalidate();
  toast.success('已切换账号');
  window.location.reload();    // ⚠️ 整页 reload
}
```

理由：避免 SPA 切换时 step 数据残留 / 缓存不一致。

### Cascade Delete（推测）

删除 IP 账号时，所有相关 stepData 应该 cascade delete。复刻方 Prisma：
```prisma
model StepData {
  // ...
  account IpAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)
}
```

### Onboarding 强制完成

`onboarding.isCompleted === 0` 时弹 modal，强制填完才能用其他功能（推测）。

## 32.2 第五轮新发现的修正

### 修正 1：脚本类型 6 个 key

| 中文 | ❌ 旧（推测）| ✅ 新（实测）|
|---|---|---|
| 尬段子 | comedy | **humor** |
| 揭内幕 | expose | **reveal** |
| 秀蜕变 | transform | **transformation** |
| 答粉丝 | qna | **qa** |
| 追热点 | trend_news | **trend** |
| 打鸡血 | motivation | **motivate** |

详见 §27.1。

### 修正 2：14 呈现形式 vs 20 类脚本（彻底分开）

之前 §Ⅹ.6 把 20 类脚本误当成 14 呈现形式。实测两者**独立体系**：
- 20 类脚本：内容主题角度（聊观点、晒过程、教知识...）
- 14 呈现形式：拍摄表现形式（口播、剧情、Vlog、教程...）

详见 §27.5。

### 修正 3：22 元素含完整 description

之前 §Ⅹ.2 只有 emoji + label，第五轮抓到完整 **category + description**（每个元素的心理学触发点）。

详见 §27.4。

### 修正 4：document.title 不动态

之前 §Ⅴ 假设每页有自己 title，实测**只有首页动态**。SEO 漏洞，复刻必补。

详见 §29.1。

### 修正 5：HTTP 响应头缺失 5 个安全头

之前未实测，第五轮发现完全没配 CSP / X-Frame-Options / X-Content-Type-Options / Referrer-Policy / Permissions-Policy。

详见 §30.4。

### 修正 6：Tailwind v4 :has() 选择器

第五轮发现产品大量使用 CSS Selectors Level 4 的 `:has()` 选择器，要求浏览器版本 ≥ Safari 15.4 / Chrome 105。复刻方需在 `package.json` 中加 browserslist：

```json
"browserslist": [
  "Chrome >= 105",
  "Safari >= 15.4",
  "Firefox >= 121",
  "Edge >= 105"
]
```

## 32.3 关键 SEO 与性能优化清单

| 项 | 实测状态 | 复刻应做 |
|---|---|---|
| document.title 动态 | ❌ 仅首页 | ✅ 每页用 `useEffect` / Helmet |
| meta description 动态 | ❌ 全站一样 | ✅ 每页定制 |
| /robots.txt | ❌ 不存在 | ✅ 加 |
| /sitemap.xml | ❌ 不存在 | ✅ 加，列 32 个公开路由 |
| structured data (JSON-LD) | ❌ 无 | ✅ 加 WebApplication schema |
| Open Graph | ✅ 有 og:image/title/description | ⚠️ og:image 自托管 |
| 5 个安全头 | ❌ 都没 | ✅ Helmet middleware 一键 |
| HTTP/2 | ✅ Cloudflare 自动 | - |
| HSTS | ✅ 1 年 | - |
| 静态资源 90 天缓存 | ✅ | - |
| 字体 preconnect | ✅ Google Fonts | - |
| 字体子集化 | ❌ 全字符集 | ✅ 中文按需子集 |
| 代码分割 | ❌ 单 bundle 2.2MB | ✅ React.lazy + route splitting |
| Critical CSS | ❌ 全部 200KB inline | ✅ 抽 above-the-fold |

复刻方做完上述 → Lighthouse 应 > 90 分。

---

# ⅩⅩⅩⅢ · 完整 npm 依赖清单 + React 组件树（实测 bundle 反编译）

> 第六轮 Phase 27：grep 整个 2.2MB bundle.js 反编译

## 33.1 完整运行时依赖（**复刻方 npm install 直接照抄**）

### 核心框架

```json
{
  "dependencies": {
    // React 系统（production builds 实测）
    "react": "^18.3.0",
    "react-dom": "^18.3.0",

    // 路由 — wouter v3（不是 react-router！）
    "wouter": "^3.0.0",
    
    // tRPC 客户端
    "@trpc/client": "^10.x",
    "@trpc/react-query": "^10.x",
    "@trpc/server": "^10.x",
    
    // React Query（tRPC 依赖）
    "@tanstack/react-query": "^5.x",
    
    // 状态管理（实测 immer + persist 中间件）
    "zustand": "^4.x",
    "immer": "^10.x",
    
    // shadcn/ui 底层
    "@radix-ui/react-visually-hidden": "^1.x",
    "@radix-ui/react-dialog": "^1.x",
    "@radix-ui/react-alert-dialog": "^1.x",
    "@radix-ui/react-dropdown-menu": "^2.x",
    "@radix-ui/react-popover": "^1.x",
    "@radix-ui/react-tooltip": "^1.x",
    "@radix-ui/react-tabs": "^1.x",
    "@radix-ui/react-select": "^2.x",
    "@radix-ui/react-progress": "^1.x",
    "@radix-ui/react-separator": "^1.x",
    "@radix-ui/react-toggle": "^1.x",
    "@radix-ui/react-label": "^2.x",
    "@radix-ui/react-checkbox": "^1.x",
    
    // shadcn 工具
    "class-variance-authority": "^0.7.x",   // cva (Button/Badge 变体)
    "clsx": "^2.x",                          // className 合并
    "tailwind-merge": "^2.x",                // tailwind class 去重
    
    // UI 增强
    "lucide-react": "^0.4xx.x",              // 68 个图标
    "sonner": "^1.x",                        // toast 系统
    
    // 动画
    "framer-motion": "^11.x",                // motion. + AnimatePresence
    "tailwindcss-animate": "^1.x",           // animate-in/out
    
    // Markdown 渲染（AI 输出 + 流式）
    "react-markdown": "^9.x",                // markdown 渲染
    "rehype-raw": "^7.x",                    // raw HTML 支持
    "rehype-katex": "^7.x",                  // 数学公式
    "katex": "^0.16.x",                      // LaTeX 渲染
    "streamdown": "^x.x.x",                  // ⭐ 流式 markdown（AI 输出专用）
    
    // 语法高亮（97 种语言 lazy chunks）
    "shiki": "^1.x",                         // 现代代码高亮
    
    // PWA
    // sw.js 自定义实现，不依赖 workbox
    
    // 开发依赖
    "vite": "^5.x",
    "@vitejs/plugin-react": "^4.x",
    "typescript": "^5.x",
    "tailwindcss": "^4.0",                   // ⭐ Tailwind v4 (OKLCH/color-mix)
    "@tailwindcss/vite": "^4.0",
    
    // 后端（推测）
    "@hono/node-server": "^x.x" 或 "express": "^4.x",
    "prisma": "^5.x",
    "@prisma/client": "^5.x"
  }
}
```

### 标记为「未发现」（复刻方可不装）

```
❌ react-router-dom         # 用 wouter 替代
❌ axios                    # tRPC 用 fetch
❌ date-fns / dayjs / moment # 用浏览器原生 Date
❌ lodash                    # 手写实现
❌ react-hook-form / formik  # 简单 useState
❌ zod                       # 后端有，前端无 schema 校验
❌ workbox                   # SW 手写
❌ next/link                 # SPA 不用 Next
```

## 33.2 React 入口（main.tsx 实测）

```tsx
// client/src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient } from './lib/trpc';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,         // ⭐ 实测：默认不缓存
      retry: 1              // ⭐ 实测：失败重试 1 次
    }
  }
});

const root = createRoot(document.getElementById('root')!);

root.render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>      // line 59
    <QueryClientProvider client={queryClient}>                       // line 60
      <App />                                                         // line 61
    </QueryClientProvider>
  </trpc.Provider>
);

// Service Worker 注册
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (e) => console.log('[SW] Registered:', e.scope),
      (e) => console.log('[SW] Registration failed:', e)
    );
  });
}
```

## 33.3 React Hooks 使用全集（实测）

bundle 中实际用到的 React hooks（**12 个**）：

```typescript
useState           // 状态
useEffect          // 副作用
useCallback        // 函数 memo (实测 70 处)
useMemo            // 值 memo (实测 56 处)
useRef             // ref
useContext         // 24 个 createContext
useReducer         // reducer
useLayoutEffect    // 布局副作用
useId              // 唯一 ID（Radix 内部用）
useDeferredValue   // ⭐ 替代 debounce (React 18 原生)
useTransition      // ⭐ 非阻塞状态更新
useSyncExternalStore  // ⭐ Zustand subscribe
```

### React 高级 API（实测）

```typescript
React.memo         // 28 处
React.forwardRef   // ref 转发
React.cloneElement // 克隆
React.createContext // 24 个
React.isValidElement
// ❌ React.lazy 未使用（无路由级别代码分割，只语言高亮 lazy）
```

## 33.4 Streamdown 流式 Markdown（核心组件）

```typescript
// 22 个 Markdown 子组件（全部带 displayName）
const MarkdownComponents = {
  MarkdownA,            // <a>
  MarkdownBlockquote,   // <blockquote>
  MarkdownCode,         // <code> + 语法高亮
  MarkdownHr,           // <hr>
  MarkdownImg,          // <img> 含 data-streamdown="image"
  MarkdownLi,           // <li>
  MarkdownOl,           // <ol>
  MarkdownParagraph,    // <p>
  MarkdownSection,      // <section>
  MarkdownStrong,       // <strong>
  MarkdownSub,          // <sub>
  MarkdownSup,          // <sup>
  MarkdownTable,        // <table> 含 data-streamdown="table-wrapper"
  MarkdownTbody,
  MarkdownTd,
  MarkdownTh,
  MarkdownThead,
  MarkdownTr,
  MarkdownUl,
  // ... 等
};
```

**特点**：
- `data-streamdown="image"` `data-streamdown="image-wrapper"` `data-streamdown="table-wrapper"` 自定义 data 属性
- 流式接收 markdown 字符串，逐字符渲染
- 配合 react-markdown 使用

## 33.5 完整 shadcn 组件库（实测）

```
✅ AlertDialog (含 9 子组件)
✅ Button (cva 6 变体)
✅ Card (含 card-action slot)
✅ ContextMenu
✅ Dialog (含 DialogOverlay)
✅ Form
✅ Input (含 input-group-control)
✅ Label
✅ Progress
✅ Select (Radix select-viewport)
✅ Separator
✅ Sheet
✅ Tab / Tabs
✅ Table
✅ Toast (Sonner，不是 shadcn 的)
✅ Toggle
✅ Tooltip
```

复刻方运行：
```bash
npx shadcn@latest init
npx shadcn@latest add alert-dialog button card context-menu dialog form input label progress select separator sheet tabs toggle tooltip
```

## 33.6 Button cva 完整 6 变体（实测）

```typescript
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
  {
    variants: {
      variant: {
        default:     'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:     'border bg-transparent shadow-xs hover:bg-accent dark:bg-transparent dark:border-input dark:hover:bg-input/50',
        secondary:   'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:       'hover:bg-accent dark:hover:bg-accent/50',
        link:        'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm:      'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg:      'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon:    'size-9',
      }
    },
    defaultVariants: { variant: 'default', size: 'default' }
  }
);
```

## 33.7 Badge cva 完整 4 变体（实测）

```typescript
const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0',
  {
    variants: {
      variant: {
        default:     'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:   'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive: 'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:     'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
      }
    }
  }
);
```

注意 `[a&]:hover:` 是 Tailwind v4 任意修饰符语法（仅当作为 `<a>` 时才 hover）。

## 33.8 Vite lazy chunks（97 个语言高亮）

代码分割只用在语法高亮（用于 markdown 代码块）：

```javascript
// vite.config.ts (推测)
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        // 每个语言独立 chunk，用户只在文案含该语言代码块时才加载
      }
    }
  }
}
```

支持的 97 种语言（部分）：

```
angular-html / angular-ts / apl / astro / blade / bsl / c / cairo / cmake /
cobol / coffee / cpp / crystal / csharp / css / csv / diff / edge / elixir / elm /
erb / erlang / fortran-fixed-form / fortran-free-form / fsharp /
gdresource / gdscript / gdshader / git-commit / git-rebase /
glimmer-js / glimmer-ts / glsl / go / graphql / hack / haml /
handlebars / haxe / hlsl / html / http / hurl / hxml /
java / javascript / jinja / jison / json / jsx / julia /
latex / less / liquid / ... (剩余约 50 种)
```

复刻方建议：用 **Shiki** 配合 dynamic import 实现按需加载。

---

# ⅩⅩⅩⅣ · 表单字段完整 specs

> 第六轮 Phase 28：实测每个 textarea/input 的 maxLength / pattern / required / 字符计数

## 34.1 maxLength 全集（**实测仅 3 个值**）

```
maxLength: 2     // 单字符输入（推测某 OTP 验证码或单字段）
maxLength: 64    // 短文本（推测账号名称）
maxLength: 500   // /generate 文案主题 textarea (唯一长文本限制)
```

**重大发现**：除 `/generate` 外，**所有 textarea 都不设 maxLength**！前端任意长度，后端可能限制。

## 34.2 字符计数器（实测 4 个）

| 页面 | 计数器格式 | 关联输入 |
|---|---|---|
| `/generate` | `0/500` | 文案主题（唯一硬限制）|
| `/ai-video` | `0/5000` | 文案内容（前端展示但不强制）|
| `/step/6` | `已输入 0 字` | 文案（无限制）|
| `/analysis` | `0 字` | 文案（无限制）|

## 34.3 全部表单字段表（实测 12 页 30+ 字段）

### 表单总览

| 页面 | 字段数 | 必填 | 关键字段 |
|---|---|---|---|
| `/step/3` 账号包装 | 4 | 1 | 个人信息 (textarea) ✅ |
| `/step/3b` 人设 | 5 | 1 | 个人信息 ✅ + 优势 + 故事 |
| `/step/4` 执行计划 | 4 | 1 | 平台 ✅ |
| `/step/4b` 变现 | 4 | 1 | 产品/服务描述 ✅ |
| `/step/5` 选题 | 4 | 2 | 行业 ✅ + 产品 ✅ + 2 file |
| `/step/6` 拍摄 | 1 | 1 | 文案 (textarea) ≥10 字 ✅ |
| `/step/7` 文案 | 3 | 2 | 主题 ✅ + 元素 ≥1 ✅ + 优化方向 (max=500)|
| `/step/8` 直播 | 4 + 4 | 2 | 产品 + 受众 + 平台 ✅ + 经验 ✅ \| 优化话术 + 目标 |
| `/voice-chat` | 1 | - | 输入框 |
| `/video-analysis` | 2 | 1 | 文案 ≥10 字 ✅ + 标题（选填）|
| `/analysis` | 1 | 1 | 文案 ≥10 字 ✅ |
| `/private-domain` | 3 | 1 | 产品 ✅ + 用户 + 场景 |
| `/diagnosis` Step 1 | 3 | 3 | 行业 + 产品 + 阶段 ✅ |
| `/ai-video` | 1 | 1 | 文案 (max=5000) |
| `/deep-learning` | 2 | 1 | 文案 ✅ + 档案名 |
| `/accounts` 创建 | 4 | 1 | 账号名 ✅ + 昵称 + 平台 + 颜色 |

### 校验规则

| 字段类型 | 校验 | 错误文案 |
|---|---|---|
| 必填长文本 | 非空 | `请输入你的个人信息` 等（详见 §15.2）|
| 至少 10 字文案 | `length >= 10` | `请输入至少10个字的文案内容` |
| 至少 10 字话术 | `length >= 10` | `请输入至少10个字的直播话术` |
| 元素多选 | `arr.length >= 1` | `请至少选择一个爆款元素` |
| 平台单选 | 必选 | `请选择平台` |
| 行业单选 | 必选 | `请选择一个行业` |
| 文案样本 | `arr.length >= 1` | `请至少添加1篇文案` |
| 文件 | 必传 | `请先上传文件` |

### 校验实现

```typescript
// 实测：用 JS 自定义校验，不用 HTML5 required/pattern
function handleSubmit() {
  if (!personalInfo) {
    toast.error('请输入你的个人信息');
    return;
  }
  if (!platform) {
    toast.error('请选择平台');
    return;
  }
  // ...
  mutation.mutate({ personalInfo, platform, ... });
}
```

## 34.4 表单 UI 模式

### Input/Textarea 标准 class

```jsx
<input
  className="
    file:text-foreground placeholder:text-muted-foreground
    selection:bg-primary selection:text-primary-foreground
    dark:bg-input/30 h-9 w-full min-w-0 rounded-md border px-3 py-1
    text-base shadow-xs transition-[color,box-shadow] outline-none
    file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium
    disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50
    md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
    aria-invalid:ring-destructive/20 aria-invalid:border-destructive
  "
/>
```

### IME 输入法支持

```typescript
// 实测代码片段
const [composing, setComposing] = useState(false);

// 100ms 延迟用于 IME 完成
onCompositionEnd={(e) => {
  setTimeout(() => setComposing(false), 100);
}}

// Enter 提交时跳过 IME 中
onKeyDown={(e) => {
  if (composing || e.justEndedComposing) return;
  if (e.key === 'Enter' && !e.shiftKey) {
    submit();
  }
}}
```

复刻方注意：中文输入用户必须处理 IME composition events，否则误触发提交。

---

# ⅩⅩⅩⅤ · UI Helpers 函数库（实测）

> 第六轮 Phase 29：从 bundle 反编译实际工具函数实现

## 35.1 没用第三方库 — 全部手写

实测：
- ❌ **没用 date-fns / dayjs / moment**
- ❌ **没用 lodash / underscore / ramda**
- ❌ **没用 numeral.js / pretty-bytes**
- ✅ 全部用浏览器原生 API + 手写实现

## 35.2 数字格式化（10000 → 10K / 10万）

```typescript
// 实测从 trending 卡片样本: "8.2万" "1.5万" "3.8万"
function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1).replace('.0', '') + '万';
  if (n >= 1000)  return (n / 1000).toFixed(1).replace('.0', '')  + 'K';
  return n.toString();
}

// 用 toLocaleString (浏览器原生 i18n)
n.toLocaleString('zh-CN');  // 自动逗号
```

## 35.3 日期格式化（实测格式：`2026/4/14 15:33:43`）

```typescript
function formatDateTime(d: Date | string | number): string {
  const date = new Date(d);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ` +
         `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function pad(n: number): string {
  return n < 10 ? '0' + n : '' + n;
}

// 实测来自 /history 卡片: "2026/4/14 15:33:43"
```

> ⚠️ **没用 toLocaleDateString('zh-CN')**（推测因为格式不一致），手写格式化。

## 35.4 时间相对显示

```typescript
// 实测 voice-chat 显示 "12:54"（仅时:分）
function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
```

> 实测**没有"3 分钟前"这种相对时间**（推测因 history 用绝对时间）。

## 35.5 头像首字符

```typescript
// /accounts 实测：「赵语AI」→ 头像显示「赵」
function getInitial(name: string): string {
  return name.charAt(0) || '?';
}
```

样式：
```jsx
<div className="h-10 w-10 rounded-full bg-gold/15 flex items-center justify-center
                text-gold font-bold text-lg">
  {getInitial(account.accountName)}
</div>
```

> 实测**头像背景色固定 `bg-gold/15`**（不是按 hash 生成颜色）。

## 35.6 文本截断

```typescript
// 实测 .slice() 模式：1/2/3/4/5/10/30/200/300/500
function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '...' : text;
}
```

或用 CSS（更常见）：
```css
.line-clamp-1 { -webkit-line-clamp: 1; ... }
.line-clamp-2 { -webkit-line-clamp: 2; ... }
.line-clamp-3 { -webkit-line-clamp: 3; ... }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
```

## 35.7 文件大小格式化

```typescript
// 实测：手动除 1024
function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 ** 2) return (bytes / 1024).toFixed(1) + 'KB';
  if (bytes < 1024 ** 3) return (bytes / 1024 ** 2).toFixed(1) + 'MB';
  return (bytes / 1024 ** 3).toFixed(1) + 'GB';
}

// 实测最大上传 20MB: 20 * 1024 * 1024
```

## 35.8 className 工具 cn()

```typescript
// 实测：用 clsx + tailwind-merge
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 用法：
<div className={cn('base-class', conditional && 'conditional-class', props.className)} />
```

## 35.9 拷贝到剪贴板

```typescript
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('已复制');
  } catch (e) {
    toast.error('复制失败');
  }
}
```

---

# ⅩⅩⅩⅥ · 搜索 / 筛选 / 复制 / 导出实现细节

> 第六轮 Phase 30：从 bundle 反编译数据流

## 36.1 搜索算法（实测：朴素 includes，**非模糊匹配**）

```typescript
// /knowledge 搜索脚本类型
function filterScripts(scripts, query) {
  const q = query.trim().toLowerCase();
  if (!q) return scripts;
  return scripts.filter(s =>
    s.label.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    s.keywords?.some(k => k.toLowerCase().includes(q))
  );
}

// /step/1 行业搜索
const filteredIndustries = industries.filter(i =>
  !category || i.category === category &&
  (!query || i.label.includes(query) || i.keywords.some(k => k.includes(query)))
);
```

> ⚠️ 中文搜索**直接 includes**，不用拼音/分词。复刻方可补：
> - 拼音：`pinyin-pro`
> - 模糊：`fuse.js`

## 36.2 筛选 tab 实现（/my-topics 5 类）

```typescript
const [activeCategory, setActiveCategory] = useState<TopicCategory>('all');

const filteredTopics = useMemo(() => {
  if (activeCategory === 'all') return allTopics;
  return allTopics.filter(t => t.category === activeCategory);
}, [allTopics, activeCategory]);

// 5 类：traffic / monetize / persona / cognition / case + all
```

## 36.3 "复制全部" 拼接逻辑

```typescript
// step/3 "复制全部" 把 6 子模块拼成一段
function copyAllStep3(result: Step3Result) {
  const text = [
    `=== 昵称推荐 ===`,
    ...result.nickname.recommended.map(n => `${n.name}\n  ${n.reason}`),
    ``,
    `=== 头像设计 ===`,
    `风格：${result.avatar.style}`,
    `配色：${result.avatar.colorScheme}`,
    `AI Prompt：${result.avatar.prompt}`,
    ``,
    `=== 背景图设计 ===`,
    // ...
  ].join('\n');
  
  navigator.clipboard.writeText(text);
  toast.success('已复制全部');
}
```

## 36.4 "下载 TXT" 实现

```typescript
function downloadTxt(content: string, filename: string) {
  // ⭐ 加 BOM 用于 Excel 中文兼容
  const blob = new Blob(['﻿' + content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;       // 如 "我的选题库-2026-05-05.txt"
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
```

实测出现的导出场景：
- /my-topics 「下载 TXT」（按当前 tab 筛选导出）
- /step/3 「复制全部」（→ 剪贴板，不是文件）

## 36.5 没用 Web Share API

```typescript
// ❌ 实测无 navigator.share / navigator.canShare
// 复刻方可加：
async function shareContent(text: string) {
  if (navigator.share) {
    await navigator.share({ text, title: 'AIP 智能体' });
  } else {
    await copyToClipboard(text);
  }
}
```

## 36.6 排序逻辑

实测全用原生 `.sort()`：

```typescript
// 按时间倒序
records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

// 按 priority
items.sort((a, b) => a.priority - b.priority);

// 按字符串
items.sort((a, b) => a.name.localeCompare(b.name));
```

---

# ⅩⅩⅩⅦ · 错误处理 + ErrorBoundary

> 第六轮 Phase 31

## 37.1 React ErrorBoundary（标准实现）

```typescript
class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('[App Error]', error, errorInfo);
    // 上报推测 (实测无 Sentry / Bugsnag)
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

## 37.2 React Query 错误处理

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,                  // ⭐ 实测重试 1 次
      retryDelay: 1000,          // (推测)
      staleTime: 0,              // 不缓存
    },
    mutations: {
      onError: (error) => {
        console.error('[API Mutation Error]', error);
      }
    }
  }
});
```

## 37.3 错误分类与文案映射

```typescript
function getErrorMessage(error: any): string {
  const message = error?.message || '';
  
  // tRPC 错误码
  if (error?.data?.code === 'UNAUTHORIZED') {
    return '登录已过期，请刷新页面重新登录';
  }
  
  // HTTP 状态码
  if (message.includes('500') || message.includes('Internal')) {
    return '服务器内部错误，请稍后重试';
  }
  if (message.includes('401')) {
    return '登录已过期，请刷新页面重新登录';
  }
  if (message.includes('429')) {
    return '请求过于频繁，请稍后再试';
  }
  
  return message || '操作失败，请重试';
}

// 用法
try {
  await mutation.mutateAsync(input);
} catch (error) {
  toast.error(getErrorMessage(error));
}
```

## 37.4 401 / Token 过期完整处理

```typescript
// 全局 tRPC 错误中间件
const trpcLink = httpBatchLink({
  url: '/api/trpc',
  fetch: async (url, opts) => {
    const response = await fetch(url, opts);
    
    if (response.status === 401) {
      // Token 过期 → 提示 + 引导重登
      toast.error('登录已过期，请刷新页面重新登录');
      // 不自动跳转，让用户主动刷新
    }
    
    return response;
  }
});
```

## 37.5 全局未捕获错误监听

```typescript
window.addEventListener('error', (event) => {
  console.error('[Global Error]', event.error);
  // 上报...
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Rejection]', event.reason);
  // 上报...
});
```

## 37.6 Console 日志规范（实测前缀）

```
[API Mutation Error] - tRPC mutation 失败
[API Query Error] - tRPC query 失败
[SW] Registered: - Service Worker 注册成功
[SW] Registration failed: - SW 注册失败
[Global Error] - 全局错误（推测）
Failed to download image: - 图像下载（step3 头像参考图）
Please add a BigInt polyfill. - BigInt 兼容警告
```

复刻方建议沿用统一前缀，方便日志聚合。

## 37.7 离线检测（推测有但未实测）

```typescript
window.addEventListener('online', () => {
  toast.success('网络已恢复');
});
window.addEventListener('offline', () => {
  toast.error('网络已断开');
});

// React 检测
const isOnline = navigator.onLine;
```

bundle 中有 `offline / onoffline / ononline` 字符串，推测有处理。

---

# ⅩⅩⅩⅧ · 移动端兼容 + 性能优化

> 第六轮 Phase 32

## 38.1 性能优化用法统计（实测）

| 技术 | 用法次数 | 说明 |
|---|---|---|
| `React.memo` | 28 处 | 组件级 memo |
| `useMemo` | 56 处 | 值 memo |
| `useCallback` | 70 处 | 函数 memo |
| `useDeferredValue` | 多处 | ⭐ 替代 debounce |
| `useTransition` | 多处 | 非阻塞状态 |
| `IntersectionObserver` | 5 处 | 滚动检测 |
| `MutationObserver` | 1 处 | DOM 变化监听 |
| `ResizeObserver` | 1 处 | 容器尺寸 |
| `requestAnimationFrame` | 多处 | 动画 |
| `React.lazy` | **0 处** | ❌ 无路由级代码分割 |

## 38.2 IntersectionObserver 用法

```typescript
// 实测代码片段：用于 dropdown 容器内的可见性检测
new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // 显示
    }
  });
}, {
  root: container.ownerDocument,
  rootMargin: '0px',
  threshold: 0.1
});
```

## 38.3 防抖 / 节流（用 React 18 原生替代）

实测 **没用 lodash/use-debounce**，而是用 React 18 原生：

```typescript
// 替代 debounce
const deferredQuery = useDeferredValue(query);
const results = useMemo(
  () => allData.filter(d => d.label.includes(deferredQuery)),
  [allData, deferredQuery]
);

// 替代 throttle (用 useTransition)
const [isPending, startTransition] = useTransition();
const handleSearch = (q: string) => {
  setQuery(q);                                // 立即更新
  startTransition(() => {                     // 非阻塞渲染
    setResults(filter(q));
  });
};
```

## 38.4 TouchEvent 处理（移动端）

```typescript
// 实测全部 touch 事件支持
element.addEventListener('touchstart', handler);
element.addEventListener('touchmove', handler);
element.addEventListener('touchend', handler);
element.addEventListener('touchcancel', handler);
```

> ⚠️ 没有自定义长按手势 / 滑动手势库（如 hammer.js / react-use-gesture）。简单 touch 事件已够。

## 38.5 设备特性检测

```typescript
// 实测代码片段
window.matchMedia('(prefers-color-scheme: dark)');     // 主题偏好
window.matchMedia('(hover: hover)');                    // 区分鼠标 vs 触摸
window.matchMedia('(prefers-reduced-motion: reduce)');  // 无障碍
```

```typescript
// React 包装
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}
```

## 38.6 setTimeout 延迟模式

实测常用延迟：

```typescript
setTimeout(callback, 0);       // 异步执行
setTimeout(callback, 20);      // 微延迟
setTimeout(callback, 100);     // IME 完成检测
setTimeout(callback, 150);     // 短动画
setTimeout(callback, 800);     // 页面跳转延迟（让 toast 显示）
setTimeout(callback, 1500);    // 长动画 / 自动消失
```

## 38.7 动画性能

```typescript
// requestAnimationFrame 用于动画
function animate() {
  // ...
  requestAnimationFrame(animate);
}

// cancelAnimationFrame 清理
const id = requestAnimationFrame(animate);
cancelAnimationFrame(id);
```

## 38.8 Bundle 大小优化建议

实测 bundle 大小：
- `index.js` **2.2 MB** (minified)
- 97 个 lazy chunks (语法高亮，按需)

复刻方优化方向：
1. ✅ 保留 prism/shiki 按需加载
2. ⚠️ **添加路由级 code splitting**：
   ```typescript
   const AccountsPage = React.lazy(() => import('./pages/AccountsPage'));
   <Suspense fallback={<Loader />}>
     <AccountsPage />
   </Suspense>
   ```
3. ⚠️ **拆 vendor**：react / react-dom / radix 单独 chunk
4. ⚠️ **Tree shaking**：lucide-react 按需引入（不要 `import * as Icons`）
5. ⚠️ **预加载**：`<link rel="preload">` 关键 chunks

预期可降到 ≤ 800 KB（首屏）。

## 38.9 移动端适配清单

复刻方必做：

```css
/* 1. 触摸目标 ≥ 44px (iOS HIG) */
button, a { min-height: 44px; min-width: 44px; }

/* 2. 输入字号 ≥ 16px (防 iOS Safari 自动缩放) */
input, textarea { font-size: 16px; @media (min-width: 768px) { font-size: 14px; } }

/* 3. 安全区适配 (iOS notch) */
.container {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}

/* 4. 防止双击缩放 */
* { touch-action: manipulation; }

/* 5. 滑动惯性 */
.scrollable { -webkit-overflow-scrolling: touch; }
```

## 38.10 PWA 离线策略增强建议

当前 sw.js 仅 cache 了 manifest + 2 个 icon。复刻方建议增强：

```javascript
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/index.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/assets/index-{hash}.js',     // 主 bundle
  '/assets/index-{hash}.css',    // 主 CSS
];

// 离线 fallback 页
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html'))
    );
  }
});
```

---

# ⅩⅩⅩⅨ · 完整 data-* 属性 + window 全局变量

> 第七轮 Phase 33

## 39.1 全局 data-* 属性清单（实测）

| 属性 | 用途 |
|---|---|
| `data-loc` | 源码位置（如 `client/src/components/Navbar.tsx:117`），开发用 |
| `data-slot` | shadcn 组件标识（`dialog-content`、`button` 等）|
| `data-website-id` | Plausible 网站 ID |
| `data-domain` | Plausible domain |
| `data-manus-selector-input` | Manus 平台编辑器标识（剥离时删除）|
| `data-immersive-translate-page-theme` | 沉浸式翻译插件标识（用户浏览器装的扩展加的）|
| `data-state` | Radix UI 组件状态（open/closed/checked/unchecked）|
| `data-orientation` | 方向（horizontal/vertical）|
| `data-streamdown` | Streamdown 标识（image / table-wrapper）|
| `data-radix-*` | Radix UI 内部用 |
| `data-sonner-*` | Sonner toast 内部用 |

复刻方建议保留：`data-slot`（shadcn 标准）、`data-state`（Radix 标准）。删除：`data-loc`（生产无意义）、`data-manus-*`（Manus 专属）。

## 39.2 window 全局变量（实测干净）

```javascript
// 实测 window 上没有自定义全局（除浏览器扩展加的）
// 没有 window.__APP__ / window.__MANUS__ / window.aiip 等
```

复刻方建议：保持 window 干净，所有全局状态走 Zustand。

---

# ⅩⅬ · React useState 初始值 + 全局常量

> 第七轮 Phase 34

## 40.1 关键 useState 默认值（实测从 bundle）

| useState 初始值 | 推测来源 |
|---|---|
| `useState("all")` | 筛选 tab 默认全部（/my-topics 等）|
| `useState("douyin")` | 默认平台抖音 |
| `useState("form")` | 默认 view 模式 |
| `useState("idle")` | 默认 loading 状态（idle/loading/success/error）|
| `useState("media")` | 默认筛选维度 |
| `useState("opinion")` | 默认脚本类型（聊观点）|
| `useState("overview")` | 默认 tab |
| `useState("short_video")` | 默认内容类型 |
| `useState("text")` | 默认输入类型 |
| `useState("口播")` | /ai-video 默认视频类型 |

复刻方提示：默认值都是合理的"最常见"选项，新用户友好。

## 40.2 关键全局常量（实测从 bundle）

### 拍摄分镜表 13 列（aiVideo.generateStoryboard 输出）

```typescript
const STORYBOARD_COLUMNS = [
  '镜号',
  '时长(秒)',
  '景别',
  '角度',
  '运镜',
  '情绪',
  '场景',
  '台词',
  '动作',
  '字幕',
  '转场',
  'BGM',
  '注意事项',
];
```

复刻方建议把分镜表导出为 CSV 时按这 13 列。

### Void HTML 元素（标准）

```typescript
const VOID_ELEMENTS = [
  'area', 'base', 'basefont', 'bgsound', 'br', 'col', 'command',
  'embed', 'frame', 'hr', 'image', 'img', 'input', 'keygen',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
];
// 用于 react-markdown 自闭合判断
```

### tRPC client 内部常量

```typescript
const TRPC_CLIENT_KEYS = ['client', 'ssrContext', 'ssrState', 'abortOnUnmount'];
const TRPC_QUERY_KEYS = ['cursor', 'direction'];
```

## 40.3 没有 VITE 环境变量

实测 bundle 中**无** `VITE_API_URL` / `VITE_BASE` 等。所有 API 走相对路径 `/api/trpc/*`（同源）。

复刻方建议：保持同源调用，避免 CORS。

---

# ⅩⅬⅠ · 路由参数 + 嵌套 + Deeplink

> 第七轮 Phase 35

## 41.1 wouter v3 路由用法（实测）

```typescript
import { Switch, Route, Link, useLocation, useRoute } from 'wouter';

// 路由匹配
<Switch>
  <Route path="/" component={HomePage} />
  <Route path="/step/:id" component={StepPage} />
  // ...
</Switch>

// 程序式跳转
const [location, navigate] = useLocation();
navigate('/step/3');
```

实测 bundle 用了：`Switch`、`navigate`、`history.push`。

## 41.2 路径参数（实测）

| 路由 | 动态参数 |
|---|---|
| `/step/:id` | id = 1, 3, 3b, 4, 4b, 5, 6, 7, 8（含字母版本号）|
| 其他 | 全部静态路由，无 :param |

⚠️ **没有 query string 参数**：实测全站不用 `?key=value` 传参，跨页传参用 localStorage / Zustand。

## 41.3 跨页跳转模式

```typescript
// 模式 1：跳页 + 自动延迟（让 toast 显示）
toast.success('行业已选择');
setTimeout(() => navigate('/step/3'), 800);

// 模式 2：跳页 + 自动预填（用 localStorage）
function jumpToCopywriting(topic: string) {
  // 保存 lastTopic 到 localStorage
  setStepData('step7', { lastTopic: topic, ... });
  navigate('/step/7');
  // /step/7 加载时从 localStorage 读取并预填
}
```

## 41.4 OAuth 流程

```
/oauth/callback?code=xxx&state=yyy
```

实测是后端处理 callback，前端只显示 loading。

## 41.5 推荐 Deeplink 设计（复刻方加）

当前**没有 share-link / deeplink 设计**，建议：

```
/share/copy/{id}     # 分享某条文案
/share/topic/{id}    # 分享某个选题
/invite/{code}       # 邀请链接（已有 sessionStorage 机制）
```

---

# ⅩⅬⅡ · 生产环境性能基线（实测）

> 第七轮 Phase 36：performance.getEntriesByType 实测

## 42.1 首页加载性能

| 指标 | 值 |
|---|---|
| **资源数** | 38 个 |
| **DOMContentLoaded** | 3373ms |
| **LoadEvent** | 3394ms |
| **First Paint** | 3396ms |
| **First Contentful Paint** | 3396ms |
| **总传输大小** | ~577 KB（首页加载）|

## 42.2 性能等级评估

| 指标 | 实测 | Lighthouse 标准 | 评级 |
|---|---|---|---|
| FCP | 3396ms | < 1800ms | ❌ Poor |
| LCP（推测）| ~3500ms | < 2500ms | ❌ Poor |
| TTI（推测）| > 5s | < 3800ms | ❌ Poor |
| 总下载量 | 577 KB | < 1.5 MB | ✅ Good |
| 资源数 | 38 | < 50 | ✅ Good |

**复刻方应优化方向**：
1. 路由级 code splitting（React.lazy）→ 预计 FCP < 1800ms
2. Critical CSS 内联
3. 字体子集化（中文按需）
4. preload 关键资源
5. 上 SSR/SSG（Next.js）

## 42.3 完整资源加载瀑布（首页 38 个）

主要资源（按顺序）：
1. `index.html` (网络)
2. `assets/index-*.js` 主 bundle 2.2 MB
3. `assets/index-*.css` 200 KB
4. `manifest.json`
5. `icons/icon-144.png`
6. `fonts.googleapis.com` Google Fonts CSS
7. `fonts.gstatic.com` Orbitron / Rajdhani / Noto Sans SC 字体
8. tRPC API 调用（auth.me, ipAccounts.active, stepData.getAll, onboarding.get 等）
9. analytics: `manus-analytics.com/api/send`, `plausible.io`
10. amplitude SDK
11. Manus runtime / spaceEditor

## 42.4 首屏关键路径

```
HTML → JS bundle 解析 → React 渲染
       ↓
       并发：Google Fonts + tRPC.auth.me
       ↓
       Hydrate → 显示
```

预计可优化点：
- ✅ 字体 preconnect 已加
- ⚠️ 主 bundle 太大（2.2 MB）
- ⚠️ 没有 SSR（首屏依赖 JS）

---

# ⅩⅬⅢ · OAuth + Streamdown + AI 流式

> 第七轮 Phase 37

## 43.1 OAuth 路由

实测路由：
- `/oauth/callback` — Google OAuth 回调端点

完整流程：
```
1. 用户点 [LOGIN] → window.location.href = '/api/auth/login'（后端处理）
2. 后端 redirect → https://accounts.google.com/o/oauth2/v2/auth?...
3. 用户授权 Google
4. Google redirect → https://aiipznt.vip/oauth/callback?code=xxx
5. 前端 /oauth/callback 路由组件：显示 loading，调后端 exchange code
6. 后端 exchange code → access_token → 创建/更新 User → 设置 cookie
7. 前端 redirect → / (首页)
8. 检测 onboarding.get → 弹 OnboardingModal（首次）
9. 自动 invite.redeem（如有 pendingInviteCode）
```

## 43.2 AI 流式输出（**实测无 SSE**）

实测：
- ❌ 无 `text/event-stream` 响应（grep bundle 0 处）
- ❌ 无 `EventSource` 调用
- ❌ 无 `ReadableStream.getReader()` 流式读取
- ✅ AI 调用是**普通 tRPC mutation**（一次性返回完整结果）

## 43.3 Streamdown 渲染（不是流式接收，而是流式渲染）

虽然没有 SSE，但 `Streamdown` 仍然存在 — 实际作用：
- **接收完整字符串后，按字符渐进显示**（前端模拟流式）
- 提供"打字机效果"，提升 UX

```typescript
// 实测 (推测) Streamdown 用法
<Streamdown text={aiResponse} speed={50} />
// speed 是字符/秒
```

## 43.4 AI 调用真实模式

```typescript
// 实测：非流式
const generate = trpc.copywriting.generate.useMutation();

async function handleGenerate() {
  setLoading(true);
  try {
    const result = await generate.mutateAsync({
      scriptType, boomElements, topic
    });
    // result 是完整 markdown 字符串（非流）
    setResult(result.copy);
    saveToLocalStorage(result);
  } catch (e) {
    toast.error('生成失败：' + e.message);
  } finally {
    setLoading(false);
  }
}
```

复刻方建议：可以升级为 SSE 流式，提升大文本生成体验：

```typescript
// 推荐升级方案
const stream = await fetch('/api/generate-stream', {
  method: 'POST', body: JSON.stringify(input)
});
const reader = stream.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  appendText(decoder.decode(value));
}
```

---

# ⅩⅬⅣ · 业务规则边界 + 修正

> 第七轮 Phase 38

## 44.1 followerCount 完整 4 选项（**实测 label 修正**）

```typescript
const FOLLOWER_COUNT_OPTIONS = [
  { value: '1-1000',        label: '1-1000粉' },          // 之前推测："1千以下"
  { value: '1000-10000',    label: '1千-1万粉' },         // 之前推测："1千-1万"
  { value: '10000-100000',  label: '1万-10万粉' },        // 之前推测："1万-10万"
  { value: '100000+',       label: '10万粉以上' },        // ✅
];
```

## 44.2 mainGoal 完整 4 选项（**desc 修正**）

```typescript
const MAIN_GOAL_OPTIONS = [
  { value: 'start',    label: '从零开始做IP',  desc: '不知道怎么起步，需要全流程指导' },
  { value: 'content',  label: '提升内容质量',  desc: '已经在做了，但内容不够爆' },
  { value: 'monetize', label: '提高变现效率',  desc: '有流量但变现不理想' },
  { value: 'scale',    label: '规模化复制',    desc: '想把成功经验复制到更多账号' },
  // ⚠️ 修正：之前 SPEC §ⅩⅩⅠ.3 写的 "已有一定规模 / 需要更上一层楼" 是推测的，实际是 "规模化复制"
];
```

## 44.3 ⚠️ 私域第 4 阶段 key 修正（**第二次修正**）

§Ⅹ.5 / §27.7 之前用过两次错误的 key：

| 中文 | ❌ V1 推测 | ❌ V2 推测 | ✅ 实测 |
|---|---|---|---|
| 需求挖掘 | discover | discover | **`demand`** |

完整修正：
```typescript
const PRIVATE_DOMAIN_STAGES = [
  { value: 'welcome', label: '欢迎话术', icon: 'Send',          desc: '新好友添加后的第一印象话术' },
  { value: 'warmup',  label: '破冰暖场', icon: 'MessageCircle', desc: '日常互动、朋友圈评论、私聊破冰' },
  { value: 'trust',   label: '信任建立', icon: 'Shield',        desc: '价值输出、案例分享、专业展示' },
  { value: 'demand',  label: '需求挖掘', icon: 'Search',        desc: '挖掘客户真实需求、痛点和预算' },  // ⭐ 不是 discover
  { value: 'close',   label: '成交话术', icon: 'TrendingUp',    desc: '产品推荐、异议处理、促单话术' },
  { value: 'follow',  label: '售后跟进', icon: 'CheckCircle',   desc: '复购引导、转介绍话术、社群运营' },
];
```

## 44.4 IP 账号上限（实测）

bundle grep `maxAccounts / MAX_ACCOUNTS / account_limit / max_accounts` **0 处命中**。

**结论**：当前**前端无上限限制**，可能后端有但 sally 实测只用 1 个，未触发。

复刻方建议：默认上限 5 个（防滥用），通过会员升级解锁更多。

## 44.5 国际化痕迹

实测：
- `languages` / `zh-CN` 字符串存在（来自 toLocaleDateString 调用）
- ❌ 没有 i18n 字典（如 `messages.zh.json`）
- ❌ 没有 `useTranslation` / `t('key')` 模式
- 全部文案 hardcode 中文

复刻方建议：用 `react-i18next` 或 `lingui` 抽离文案，方便后续多语言。

## 44.6 第七轮新发现

| # | 发现 |
|---|---|
| 1 | data-* 属性 11 种全部识别 |
| 2 | useState 初始值 10 个常用枚举 |
| 3 | **拍摄分镜表 13 列** schema |
| 4 | 路由用 wouter，**全静态无 query param** |
| 5 | **AI 调用非流式**（一次性返回 markdown）|
| 6 | Streamdown 是前端模拟"打字机"，不是接收 SSE |
| 7 | followerCount 4 个 label 完整修正 |
| 8 | mainGoal `scale` desc 修正为「规模化复制」 |
| 9 | **私域 `demand` 不是 `discover`**（**第二次修正**）|
| 10 | 性能基线：FCP 3.4s（差），可优化至 < 1.8s |

---

# ⅩⅬⅤ · 完整文案库（按场景 i18n）

> 第八轮 Phase 39：完整文案集合，可直接 i18n 化

## 45.1 空态文案完整库（9 条）

```typescript
export const EMPTY_STATES = {
  '/accounts':       { text: '还没有 IP 账号', cta: '新建账号', icon: 'Users' },
  '/evolution': {
    feedback:        { text: '还没有反馈记录', subtitle: '在使用各功能时点击 👍 或 👎 留下反馈', icon: 'MessageSquare' },
    insight:         { text: '还没有进化洞察', subtitle: '积累至少 3 条反馈后，点击"触发进化"生成洞察', icon: 'Sparkles' },
    learning:        { text: '还没有深度学习档案', cta: '去创建第一个学习档案', icon: 'Brain' }
  },
  '/daily-tasks':    { text: '还没有今日任务', subtitle: 'AI 老师正在为你制定今日任务...', icon: 'Calendar' },
  '/my-topics':      { text: '还没有收藏任何选题', subtitle: '去爆款选题页面生成选题，点击红心即可收藏', cta: '去生成选题', icon: 'Heart' },
  '/knowledge':      { text: '还没有收藏任何内容', icon: 'Bookmark' },
  '/deep-learning':  { text: '还没有学习档案', subtitle: '上传文件或添加文案样本，开始深度学习', icon: 'Upload' },
  '/diagnosis':      { text: '还没有诊断记录', subtitle: '完成 8 步问卷生成诊断报告', cta: '开始诊断', icon: 'Stethoscope' },
  '/history':        { text: '还没有生成记录', subtitle: '在文案生成或视频制作页面生成内容后会出现在这里', icon: 'Clock' }
};
```

### 空态 UI 标准布局

```jsx
<div className="flex flex-col items-center justify-center py-20 text-center">
  <div className="mb-4 text-muted-foreground/50">
    <Icon className="h-16 w-16" />
  </div>
  <p className="text-lg font-medium text-muted-foreground">{text}</p>
  {subtitle && (
    <p className="mt-2 text-sm text-muted-foreground/70">{subtitle}</p>
  )}
  {cta && (
    <Button className="mt-6 bg-gold text-background" onClick={onCta}>
      {cta}
    </Button>
  )}
</div>
```

## 45.2 Loading 文案完整库（15 条）

按 4 大类分组：

### 通用 loading（4 条）
```typescript
const GENERIC_LOADING = {
  loading:     '加载中...',
  parsing:     '解析中...',
  analyzing:   '分析中...',
  generating:  '生成中...'
};
```

### AI 生成场景（含预期时间提示）
```typescript
const AI_LOADING = {
  // ⭐ 长操作显式给用户预期时间
  topicsGen5x20:     '正在为你生成 5 大类爆款选题，预计需要 15-30 秒',  // step5
  copyGen5pcs:       '正在生成 5 篇深度爆款文案...',                       // boom-generate
  acquisitionGen:    '正在生成获客视频方案...',                            // acquisition-video
  analysisReport:    '正在生成专业分析报告，请稍候片刻',                   // analysis
  monetizationGen:   '正在结合全网数据生成变现模型...',                    // monetization
  voiceChat:         '正在思考中，马上给你答案...'                         // voice-chat AI 回复
};
```

### 文件操作（2 条）
```typescript
const FILE_LOADING = {
  parsing:   '正在解析文档...',           // 上传后解析
  uploading: '正在上传并提取内容...'      // deepLearning.createFromFile
};
```

### 语音交互（2 条）
```typescript
const VOICE_LOADING = {
  recording: '正在录音...',         // STT 录音中
  playing:   '正在播放语音...'      // TTS 播放
};
```

### 跳转动作（1 条）
```typescript
const NAVIGATION_LOADING = {
  toCopywriting: '正在跳转到文案生成...'   // step5 → step7
};
```

### Loading UI 标准模式

```jsx
<div className="flex items-center justify-center gap-3 py-12">
  <Loader2 className="h-5 w-5 animate-spin text-gold" />
  <span className="text-sm text-muted-foreground animate-pulse-subtle">
    {loadingText}
  </span>
</div>
```

⭐ **UX 最佳实践**：长操作（>5s）显式给"预计 15-30 秒"等时间预期，降低用户焦虑。

## 45.3 placeholder 文案完整库（30+）

按字段类型分组：

### 行业 / 产品 placeholder
```typescript
const INDUSTRY_PLACEHOLDERS = {
  industryInput:    '例如：美业、餐饮、教育培训、服装...',
  industryDiag:     '例如：美业、大健康、服装、教育培训...',
  productInput:     '例如：皮肤管理项目、火锅加盟、英语培训课...',
  productDiag:      '例如：皮肤管理项目、减脂训练营、女装定制...',
  customIndustry:   '输入你的行业名称，如：宠物美容、新能源汽车、心理咨询...'
};
```

### 受众 / 定位 placeholder
```typescript
const TARGET_PLACEHOLDERS = {
  audience:         '例如：25-40岁职场女性',
  audienceVague:    '你想吸引什么样的粉丝？',
  audienceDetail:   '比如：25-40 岁女性、创业者、宝妈...',
  audienceTarget:   '你的目标客户是谁',
  positioning:      '例如：专业、接地气的英语老师人设',
  ipPositioning:    '如：专业皮肤管理师'
};
```

### 内容输入 placeholder
```typescript
const CONTENT_PLACEHOLDERS = {
  productDesc:      '描述你的核心产品或服务',
  productInfo:      '描述您的产品或服务，例如：线上英语培训课程，面向职场白领...',
  sellingPoint:     '描述您的核心卖点，例如：0 基础可学、3 个月回本、一对一指导...',
  customerProfile:  '描述您的理想客户，例如：想要创业的 30-45 岁宝妈群体，有一定积蓄但缺乏方向...',
  liveProduct:      '描述你要在直播中推广的产品或服务...',
  personalInfo:     '详细描述你的个人背景、专业技能、从业经验、擅长领域、个人特点等。\n\n示例：我是一名有 10 年经验的美容师，擅长皮肤管理和抗衰项目...',
  strengths:        '你有什么独特的优势？比如：独特的经历、专业证书、成功案例、个人特质...',
  story:            '分享你的个人故事：为什么做这个行业？有什么转折点？什么经历让你与众不同？'
};
```

### 数据录入 placeholder
```typescript
const DATA_PLACEHOLDERS = {
  followerCount:    '如：0 / 500 / 1万 / 10万',
  followerVague:    '比如：皮肤管理、健身私教、服装设计...',
  goal:             '如：3 个月涨粉 1 万、月入 5 万',
  currentRevenue:   '如：月入 3 万 / 年收入 50 万',
  audienceLite:     '如：25-35 岁宝妈、职场白领',
  scenarioLite:     '如：客户看了朋友圈后主动咨询、老客户 3 个月没复购'
};
```

### 优化 / 反馈 placeholder
```typescript
const OPTIMIZE_PLACEHOLDERS = {
  optimizeDirection: '例如：加强开头吸引力、增加情感共鸣、突出产品卖点...',
  optimizeBrief:     '输入优化方向（可选），如：更有吸引力、增加互动感、更口语化...',
  optimizeLive:      '优化目标（可选），如：提升互动率、增强转化、更有感染力...',
  feedbackBad:       '告诉我哪里不满意，我会持续改进...',  // ⭐ evolution 反馈
  archiveName:       '例如：2 月活动批次',                  // 学习档案命名
  archiveStyle:      '学习档案名称（可选，如：XX 老师的文案风格）'
};
```

### 杂项 placeholder
```typescript
const MISC_PLACEHOLDERS = {
  voiceChat:         '有什么问题尽管问我...',
  topicCopy:         '输入你的文案主题，如：美容院如何用抖音获客 100 个精准客户...',
  topicQuick:        '输入你的文案主题或关键词，例如：如何在 30 天内涨粉 1 万、新手做短视频最容易犯的 3 个错误...',
  topicMain:         '如：减脂训练营、护肤套装、英语课程',
  scriptSearch:      '搜索脚本...',
  searchTopics:      '搜索选题、行业、产品...',
  searchTrending:    '搜索爆款内容...',
  searchKeywords:    '多个关键词用逗号分隔',
  videoCopy:         '粘贴你的短视频文案（至少 10 个字），AI 将为你生成完整的拍摄计划。\n\n你可以使用第七步「文案生成」功能先生成文案，再来这里生成拍摄计划。',
  videoTitle:        '视频标题（选填）',
  videoCopyAnalyze:  '粘贴爆款视频的完整文案/口播稿（至少 10 个字）...',
  videoCopyMyText:   '粘贴需要分析的短视频文案（至少 10 个字）...',
  videoStoryboard:   '粘贴你的短视频文案，AI 将自动生成专业分镜表，可直接交给摄影师执行...',
  liveScript:        '粘贴你的直播话术脚本（至少 10 个字），AI 将深度优化话术表达、互动设计和转化逻辑...',
  deepLearningCopy:  '粘贴一篇文案内容（口播文案、短视频文案、图文文案均可）',
  accountNickname:   '平台上的账号昵称',
  inviteCode:        '请输入邀请码',
  liveBatchName:     '例如：2 月活动批次'
};
```

## 45.4 按钮文案完整集合（80+）

### Step 流程主按钮
```
[确认并进入下一步]    → step/1, /diagnosis
[生成账号包装方案]    → step/3
[生成专属人设方案]    → step/3b
[生成执行计划]        → step/4
[生成变现路径]        → step/4b
[一键生成 5 大类 爆款选题] → step/5
[生成拍摄计划]        → step/6
[生成爆款文案]        → step/7
[生成直播方案]        → step/8 子1
[AI 优化话术]         → step/8 子2
[继续下一步] [上一步] → 通用导航
```

### 操作类按钮
```
[重新生成] [一键重新生成] [智能优化] [AI 优化文案]
[复制] [复制全部] [下载 TXT]
[确认删除] [取消]
[新建账号] [编辑] [删除]
[添加这篇] [开始深度学习（N 篇文案）]
[触发进化] [新增学习] [去创建第一个学习档案]
[抓取最新爆款]
[开始深度解析] [开始分析]
[一键生成专业分镜表]
[生成话术]
[生成获客方案]
[生成变现模型]
[生成参考图]              ← step3 头像/背景图
[一键生成爆款文案]        → boom-generate
[导出] [下载 TXT] [批量导出]
```

### 导航类按钮
```
[启动智能分析]   → 首页 hero CTA
[使用说明]       → /guide
[查看 IP 方案]   → /ip-plan
[立即启动]       → 首页底部 CTA
[继续]           → 续做未完成 step
[返回首页] [返回选择列表] [返回爆款选题]
[查看详情] [去完成] [查看报告]
[去生成选题]     → /my-topics 空态
[管理账号]       → /accounts
```

### 子模块标签 / 分类按钮
```
/private-domain 6 阶段：
[欢迎话术] [破冰暖场] [信任建立] [需求挖掘] [成交话术] [售后跟进]
扩展子分类（**新发现**）：
[逼单话术]                   ⭐ 推测属于 close 阶段细分

/my-topics 5 类：
[全部] [流量型] [变现型] [人设型] [认知型] [案例型]

/knowledge 4 tab：
[20 类脚本] [20 大爆款] [开头公式] [核心公式]

/step5 5 大选题：
[流量型] [变现型] [人设型] [认知型] [案例型]
```

### 子内容标签 / 字段名（30+）

> 来自 step3 / step3b 等结果区的子模块标题

```
账号包装方案：
[包装风格] [必含元素] [禁忌] [参考案例] [差异化定位]
[昵称推荐] [命名策略] [头像设计方案] [背景图设计方案]
[简介文案方案] [简介公式] [整体包装策略]
[视觉统一性] [第一印象设计] [转化路径] [平台优先级]

人设定制：
[核心身份定位] [人设标签] [个人口号/金句] [差异化定位]
[记忆点设计] [性格特质] [思想体系] [深度内核]
[核心理念] [独特观点] [口头禅设计] [内容人设]
[说话风格] [视觉风格] [穿搭] [场景] [道具] [道具清单]
[内容支柱] [信任构建体系] [信任背书] [社会证明]
[个人故事线] [人设打造路线图] [执行计划]

变现路径：
[市场分析] [行业分析] [市场规模] [竞争程度] [变现潜力]
[起步阶段] [发展阶段] [规模化阶段]
[核心策略] [产品矩阵] [流量策略] [转化流程] [关键动作]
[风险提示] [收入结构] [成功案例参考]
[当前阶段] [团队建设] [体系化建设] [品牌化策略] [矩阵化布局]

文案/视频：
[选题策略分析] [选题类别] [切入角度] [目标受众]
[场景] [场景建议] [灯光建议] [布局结构]
[成交话术] [成交技巧] [成交文案]
[爆款结构] [爆款生成] [爆款元素自动生成]
```

### 状态/反馈按钮
```
[等级勋章] [待改进] [好评数] [学习档案] [满意率]
[建议下一步] [继续]
[👍] [👎]              ← evolution 反馈
[❤️ 收藏] [☆ 取消收藏]
```

### 登录态按钮
```
[LOGIN] [立即登录] [登录使用]
[退出]
[登录后即可拆解爆款文案的成功密码]   ← /video-analysis 未登录
[登录后即可使用 AI 文案生成功能]      ← /generate
[登录后查看智能体进化状态]            ← /evolution
（详见 §21.4 完整 11 条）
```

复刻方建议：把上面所有按钮文案抽到 `i18n/buttons.ts`，按页面/场景组织。

---

# ⅩⅬⅥ · Emoji + 视觉资产完整清单

> 第八轮 Phase 40

## 46.1 进化等级 emoji（5 档 - L1 到 L5）

```typescript
export const EVOLUTION_LEVELS = [
  { level: 1, emoji: '🌱', label: '初始化',  threshold: 0,    desc: '萌芽阶段，开始收集反馈' },
  { level: 2, emoji: '📚', label: '学习中',  threshold: 5,    desc: '积累反馈，AI 开始学习偏好' },
  { level: 3, emoji: '🌿', label: '成长期',  threshold: 20,   desc: '风格逐渐形成' },
  { level: 4, emoji: '🌳', label: '成熟期',  threshold: 50,   desc: 'AI 高度匹配你的风格' },
  { level: 5, emoji: '👑', label: '大师级',  threshold: 100,  desc: 'AI 已成为你的最佳搭档' }
];
```

**UI 实测**：5 个 emoji 横向排列，**当前等级用 `glow-gold` 高亮**，未达等级用 `text-muted-foreground/30` 灰化。

```jsx
<div className="flex items-center gap-3">
  {EVOLUTION_LEVELS.map(lv => (
    <div key={lv.level} className={cn(
      'h-12 w-12 rounded-full flex items-center justify-center text-2xl',
      currentLevel >= lv.level
        ? 'bg-gold/20 glow-gold'                    // 已达
        : 'bg-muted/20 text-muted-foreground/30'    // 未达
    )}>
      {lv.emoji}
    </div>
  ))}
</div>
```

## 46.2 22 大爆款元素 emoji（4 类）

| 类别 | emoji × label |
|---|---|
| **经典元素 (11)** | 💰 贪念 · 😨 恐惧 · 🔍 猎奇 · 🔄 反差 · ⚠️ 最差 · 🔥 借势 · 💬 共鸣 · 🤝 共情 · 🎯 以小搏大 · 📈 低成本高回报 · 🎰 低成本未知回报 |
| **情绪驱动 (2)** | 😡 愤怒 · 😲 惊喜 |
| **内容策略 (6)** | 🔥 热点 · 💬 争议 · 🔓 揭秘 · 📋 清单 · 🎯 挑战 · 🦋 蜕变 |
| **转化驱动 (4)** | ⏳ 稀缺 · 👍 社会证明 · 🎓 权威 · 🎁 利益 |

详见 §27.4。

## 46.3 5 平台 emoji

```typescript
export const PLATFORMS = [
  { id: 'douyin',       emoji: '📱', label: '抖音' },
  { id: 'xiaohongshu',  emoji: '📕', label: '小红书' },
  { id: 'shipinhao',    emoji: '📺', label: '视频号' },   // ⚠️ 与 B 站同 emoji，靠 label 区分
  { id: 'kuaishou',     emoji: '🎬', label: '快手' },
  { id: 'bilibili',     emoji: '📺', label: 'B站' },     // ⚠️ 与视频号同 emoji
  { id: 'wechat',       emoji: '📲', label: '微信视频号 (备选)' }
];
```

⚠️ **重要 UX 问题**：`📺` 同时被 `视频号` 和 `B站` 使用，应在标签上明确区分。

## 46.4 56 行业 emoji（5 大类）

完整列表见 §Ⅹ.4。归类预览：

```
🏠 生活服务 (18):
  💅 美业  💄 美妆护肤  🍜 餐饮美食  ☕ 茶饮咖啡  🍷 酒水
  🏥 健康养生  🩺 医疗健康  🧠 心理咨询  💪 运动健身  ⚽ 体育运动
  👶 母婴亲子  ✈️ 旅游出行  🐾 宠物  💍 婚庆婚嫁  📍 本地生活
  🧹 家政服务  📦 物流快递  🔧 汽车服务

🛒 电商零售 (13):
  👗 服装穿搭  👜 奢侈品  👟 鞋靴箱包  🚗 汽车  🛒 电商零售
  🥬 生鲜配送  📺 家电  🛋️ 家装家居  💎 珠宝饰品  💊 营养保健
  🧴 日用百货  📖 图书文创  ♻️ 二手闲置

✍️ 内容创作 (7):
  📲 自媒体运营  📷 摄影摄像  🎨 设计创意  🎮 游戏
  🎬 娱乐  📰 文化传媒  ❤️ 情感社交

💼 专业服务 (14):
  📚 教育培训  🎒 K12 教育  🧒 早教托育  🎨 艺术培训  🌍 语言培训
  💻 IT 培训  🏠 房产  💰 金融理财  📱 科技数码  ⚖️ 法律咨询
  🤝 招商加盟  👔 人力招聘  🏢 企业服务  🏛️ 政务公益

🏭 产业制造 (4):
  🌾 农业农村  🏭 工业制造  🏗️ 建筑工程  🔧 其他行业
```

## 46.5 5 选题分类 emoji

```typescript
export const TOPIC_CATEGORIES = [
  { id: 'traffic',   emoji: '🔥', label: '流量型', color: 'red' },
  { id: 'monetize',  emoji: '💰', label: '变现型', color: 'gold' },
  { id: 'persona',   emoji: '👤', label: '人设型', color: 'blue' },
  { id: 'cognition', emoji: '🧠', label: '认知型', color: 'purple' },
  { id: 'case',      emoji: '📋', label: '案例型', color: 'green' }
];
```

## 46.6 6 直播经验 emoji

```typescript
export const LIVESTREAM_EXP = [
  { id: 'beginner',     label: '新手 · 刚开始做直播', emoji: '🌱' },
  { id: 'experienced',  label: '有经验 · 有一定直播经验', emoji: '🎯' },
  { id: 'expert',       label: '资深 · 直播经验丰富', emoji: '👑' }
];
```

## 46.7 14 呈现形式（无 emoji，纯 lucide icon）

实测 14 呈现形式**不用 emoji**，用 lucide-react icon。映射建议：

```typescript
const PRESENT_STYLE_ICONS = {
  talking_head:     'Mic',           // 口播
  drama:            'Clapperboard',  // 剧情
  tutorial:         'BookOpen',      // 教程
  vlog:             'Camera',        // Vlog
  street_interview: 'Users',         // 街访
  comparison:       'GitCompare',    // 对比测评
  list_style:       'List',          // 清单盘点
  mashup:           'Music',         // 混剪
  screen_record:    'Monitor',       // 录屏
  animation:        'Wand2',         // 动画
  reaction:         'Smile',         // 反应
  before_after:     'ArrowRight',    // 前后对比
  pov:              'Eye',           // POV 视角
  qa:               'MessageCircle'  // 问答
};
```

## 46.8 emoji 使用规范

复刻方建议：
1. **用 unicode emoji**（不用图片），SSR / 复制兼容
2. **加 `font-emoji` class** 强制 emoji 字体（避免某些 OS 显示样式不一）：
   ```css
   .emoji {
     font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif;
   }
   ```
3. **iOS Safari 显示问题**：部分 emoji（如 ⚠️）在 iOS 自动加 variation selector，不要强制单宽度
4. **数据库存储**：用 `varchar` + utf8mb4 编码

---

# ⅩⅬⅦ · Markdown / Streamdown 完整渲染规则

> 第八轮 Phase 41

## 47.1 react-markdown 完整配置（实测）

```typescript
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
// 实测无 remark-gfm（推测：AI 输出不需要 GFM 表格）

<ReactMarkdown
  remarkPlugins={[]}                              // 空（推测）
  rehypePlugins={[
    rehypeRaw,                                    // 允许 raw HTML
    rehypeKatex                                   // LaTeX 公式（仅 inline）
  ]}
  skipHtml={false}                                // 不跳过 HTML
  allowDangerousHtml={false}                      // 不允许危险 HTML
  components={{
    a:           MarkdownA,
    blockquote:  MarkdownBlockquote,
    code:        MarkdownCode,
    hr:          MarkdownHr,
    img:         MarkdownImg,
    li:          MarkdownLi,
    ol:          MarkdownOl,
    p:           MarkdownParagraph,
    section:     MarkdownSection,
    strong:      MarkdownStrong,
    sub:         MarkdownSub,
    sup:         MarkdownSup,
    table:       MarkdownTable,
    tbody:       MarkdownTbody,
    td:          MarkdownTd,
    th:          MarkdownTh,
    thead:       MarkdownThead,
    tr:          MarkdownTr,
    ul:          MarkdownUl
  }}
>
  {markdownText}
</ReactMarkdown>
```

## 47.2 Streamdown（流式 Markdown）

实际作用：**前端模拟流式渲染**（不是接收 SSE）

```typescript
import { Streamdown } from 'streamdown';

<Streamdown
  text={fullMarkdownText}     // AI 一次性返回的完整 markdown
  speed={50}                  // 字符/秒（推测）
  components={{ /* 同上 22 个 */ }}
/>
```

特点：
- 显式自定义元素 `data-streamdown="image"` `data-streamdown="image-wrapper"` `data-streamdown="table-wrapper"`
- 图片包装：`group relative my-4 inline-block`
- 表格包装：可滚动 + 鼠标悬停高亮
- 完整代码块（`<code>`）支持 shiki 语法高亮

## 47.3 自定义 Markdown 组件样式

### MarkdownImg（图片）

```jsx
<div data-streamdown="image-wrapper" className="group relative my-4 inline-block">
  <img
    data-streamdown="image"
    className={cn('max-w-full rounded-lg', className)}
    alt={alt}
    src={src}
  />
  <div className="poi /* 鼠标 hover 高亮 */"></div>
</div>
```

### MarkdownTable（表格）

```jsx
<div data-streamdown="table-wrapper" className="overflow-x-auto my-4 rounded-lg border">
  <table className="w-full text-sm">
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
</div>
```

### MarkdownCode（代码块）

```jsx
{inline ? (
  <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">
    {children}
  </code>
) : (
  <pre className="overflow-x-auto rounded-lg bg-muted/50 p-4">
    <code className={`language-${lang}`}>{children}</code>
  </pre>
)}
```

实测启用了 **shiki**（97 种语言 lazy chunk）做语法高亮。

### MarkdownStrong / Em / Sub / Sup

```jsx
<strong className="font-bold text-foreground">{children}</strong>
<em className="italic">{children}</em>
<sub className="text-xs">{children}</sub>
<sup className="text-xs">{children}</sup>
```

### MarkdownBlockquote（引用）

```jsx
<blockquote className="my-4 border-l-4 border-gold/40 bg-gold/5 px-4 py-3 text-muted-foreground italic">
  {children}
</blockquote>
```

### MarkdownOl / MarkdownUl / MarkdownLi

```jsx
<ol className="list-decimal pl-6 my-3 space-y-1">{children}</ol>
<ul className="list-disc pl-6 my-3 space-y-1">{children}</ul>
<li className="leading-relaxed">{children}</li>
```

### MarkdownHr（分割线）

```jsx
<hr className="my-6 border-t border-border/30" />
```

### MarkdownA（链接）

```jsx
<a
  href={href}
  className="text-gold underline-offset-4 hover:underline"
  target={isExternal ? '_blank' : undefined}
  rel={isExternal ? 'noopener noreferrer' : undefined}
>
  {children}
</a>
```

## 47.4 KaTeX 数学公式

仅 **inline math** (`$x^2$`)，不支持块级 (`$$x^2$$`)。

```typescript
// 实测从 bundle: inlineMath
{
  inlineMath: [['$', '$']],
  displayMath: false
}
```

样式：
```css
/* katex.css 默认 */
.katex { font-family: KaTeX_Main, sans-serif; }
.katex-display { display: inline-block; margin: 0 0.5em; }
```

## 47.5 AI 输出 markdown 标准格式

AI 生成内容遵循以下标记规范（基于 `/^【(.+?)】$/` 正则推测）：

```markdown
【标题】为什么有的人赚钱那么轻松？是运气好，还是你没看懂？

【话题抛出】
你有没有发现，身边总有那么一类人...

【正方】
有人说，赚钱轻松，靠的是「信息差」和「风口」。

1. **信息差就是财富。** 就像我之前做餐饮...
2. **抓住风口，猪都能飞。** 就像现在 AI 赛道...

【反方】
也有人说，赚钱轻松，靠的是「持续学习」和「认知升级」...

1. **认知决定上限。** 我从一个餐饮老板...
2. **方法不对，努力白费。** ...

【我的立场】
我觉得，赚钱轻松这事...

【评论区引导】
你觉得赚钱轻松，到底靠的是什么？...

【话题标签】
#赚钱思维 #AI 创业 #认知升级 #OPC 创业 #智能体 #商业洞察 #搞辩论
```

复刻方建议：在 AI prompt 中明确要求按 `【段落名】` 格式输出，前端可正则提取做结构化展示。

```typescript
// 正则提取段落
const SECTION_REGEX = /【(.+?)】\n([\s\S]+?)(?=【.+?】|$)/g;

function parseAIResponse(markdown: string) {
  const sections = [];
  let match;
  while ((match = SECTION_REGEX.exec(markdown)) !== null) {
    sections.push({ title: match[1], content: match[2].trim() });
  }
  return sections;
}
```

---

# ⅩⅬⅧ · Analytics 实际配置

> 第八轮 Phase 42

## 48.1 三套并行 Analytics

| 名称 | 用途 | 提供商 | 是否自部署 |
|---|---|---|---|
| **Manus Analytics** | 站点行为 | manus-analytics.com | ❌ Manus 平台 SaaS |
| **Plausible** | 隐私友好 PV/UV | plausible.io | ❌ Plausible Cloud |
| **Amplitude** | 用户行为漏斗 | api2.amplitude.com | ❌ Amplitude SaaS |

## 48.2 Plausible 配置（实测）

```html
<!-- index.html 中 -->
<script
  defer
  data-domain="aiipznt.vip"
  src="https://plausible.io/js/script.file-downloads.hash.outbound-links.pageview-props.revenue.tagged-events.js">
</script>
```

启用的 6 个特性：
- `file-downloads`: 文件下载追踪
- `hash`: hash 路由（SPA）
- `outbound-links`: 外链点击
- `pageview-props`: 页面属性
- `revenue`: 收入追踪
- `tagged-events`: 自定义事件

实测**没有任何 `plausible('event_name')` 调用**，仅自动 PV 追踪。

## 48.3 Amplitude 配置（实测）

API key（部分混淆）：`46ac3f9abb...` （从 localStorage `AMP_remote_config_46ac3f9abb` 反推）

```typescript
// 实测调用
import { init, track } from '@amplitude/analytics-browser';

init('46ac3f9abb...', userId, {
  defaultTracking: {
    pageViews: true,
    sessions: true,
    formInteractions: true,    // 推测
    fileDownloads: true        // 推测
  },
  serverUrl: 'https://api2.amplitude.com/2/httpapi'
});

// 自定义事件 - 实测无（grep 0 处）
```

实测网络请求：
- `https://api2.amplitude.com/2/httpapi` (POST，beacon)
- `https://sr-client-cfg.amplitude.com/config?api_key=46ac3f9abb...&config_keys=analyticsSDK.pageActions`

localStorage：
- `AMP_remote_config_46ac3f9abb`: 远程配置（含 sessionReplay 0.02 采样率）
- `AMP_unsent_46ac3f9abb`: 未发送队列

## 48.4 Manus Analytics 配置

```html
<!-- index.html 中 -->
<script
  defer
  src="https://manus-analytics.com/umami"
  data-website-id="..."
></script>
```

实测请求：`https://manus-analytics.com/api/send` (POST)

底层是 **Umami**（开源 analytics）的 Manus 托管版。

## 48.5 用户行为追踪（推测发什么 event）

实测**无前端 custom event 调用**，但 Amplitude `formInteractions: true` 自动追踪：
- 表单 focus / blur
- 表单 submit
- 输入字段 change

复刻方建议：补上明确的关键转化事件：

```typescript
// 推荐自定义事件清单
const ANALYTICS_EVENTS = {
  // 注册/登录
  signup_complete:        '完成注册',
  oauth_login_success:    'OAuth 登录成功',
  invite_redeemed:        '邀请码兑换成功',

  // Onboarding
  onboarding_started:     '开始 Onboarding',
  onboarding_completed:   '完成 Onboarding',

  // IP 流程
  step_started:           '开始 step',     // { step: 'step3' }
  step_generated:         '生成 step',     // { step, duration_ms }
  step_completed:         '完成 step',
  step_regenerated:       '重新生成',
  step_optimized:         '智能优化',

  // 内容
  copy_generated:         '生成文案',
  copy_copied:            '复制文案',
  copy_downloaded:        '下载文案 TXT',

  // 反馈
  feedback_given:         '反馈',          // { rating: 'good' | 'bad' }
  evolution_triggered:    '触发进化',

  // 账号
  account_created:        '创建账号',
  account_switched:       '切换账号',
  account_deleted:        '删除账号',

  // 其他
  topic_favorited:        '收藏选题',
  trending_fetched:       '抓取爆款'
};
```

## 48.6 Cookie 策略

### 实测的 cookie

| Cookie | 来源 | 用途 |
|---|---|---|
| `session=...` | aiipznt.vip 后端 | 用户登录态（HttpOnly + Secure + SameSite=Lax）|
| Plausible | plausible.io | **不存** cookie（Plausible 设计无 cookie）|
| Amplitude | aiipznt.vip | `AMP_*` localStorage（不用 cookie）|
| Manus Analytics | manus-analytics.com | 推测有第三方 cookie |

### Cookie Banner（实测无）

实测**没有 cookie 同意 banner / GDPR 提示**。如果产品要进入欧盟市场，复刻方需补：

```jsx
<CookieBanner>
  我们使用 Cookie 改善你的体验。继续使用即表示同意我们的
  <Link href="/privacy">隐私政策</Link>。
  <Button>同意</Button>
  <Button variant="ghost">仅必需</Button>
</CookieBanner>
```

---

# ⅩⅬⅨ · 完整资源路径 + CSP 配置

> 第八轮 Phase 43

## 49.1 完整外部依赖 URL 清单（实测）

### 同源 (`aiipznt.vip`)
```
HTML/SPA:
  https://aiipznt.vip/                            首页
  https://aiipznt.vip/{34 个路由}                 各页

API:
  https://aiipznt.vip/api/trpc/{procedure}        tRPC 端点

静态资源:
  https://aiipznt.vip/assets/index-{hash}.js      主 bundle 2.2MB
  https://aiipznt.vip/assets/index-{hash}.css     主 CSS 200KB
  https://aiipznt.vip/assets/{lang}-{hash}.js     97 个语言 lazy chunks
  https://aiipznt.vip/manifest.json               PWA manifest
  https://aiipznt.vip/sw.js                       Service Worker
  https://aiipznt.vip/icons/icon-{72,96,128,144,152,192,384,512}.png
```

### 字体（Google Fonts）
```
https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900
                                  &family=Rajdhani:wght@300;400;500;600;700
                                  &family=Noto+Sans+SC:wght@400;500;600;700&display=swap
https://fonts.gstatic.com/s/orbitron/v34/...woff2
https://fonts.gstatic.com/s/rajdhani/v17/...woff2
https://fonts.gstatic.com/s/notosanssc/v36/...woff2
```

### Manus 平台
```
https://manus.im/                            主站
https://files.manuscdn.com/                  CDN（用户上传文件 + 平台截图）
https://files.manuscdn.com/manus-space-dispatcher/spaceEditor-{hash}.js  Manus 编辑器
https://manus-analytics.com/umami            Analytics SDK
https://manus-analytics.com/api/send         Analytics 上报
https://api.manus.im/api/user_behavior/batch_create_event_v2  用户行为（推测）
```

### Plausible（独立分析）
```
https://plausible.io/js/script.file-downloads.hash.outbound-links.pageview-props.revenue.tagged-events.js
https://plausible.io/api/event              事件上报
```

### Amplitude（用户分析）
```
https://api2.amplitude.com/2/httpapi         事件上报
https://sr-client-cfg.amplitude.com/config?api_key=46ac3f9abb...
                                             配置（含采样率）
```

## 49.2 完整 CSP 配置（推荐）

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval'
    https://manus-analytics.com
    https://plausible.io
    https://*.amplitude.com
    https://files.manuscdn.com;
  style-src 'self' 'unsafe-inline'
    https://fonts.googleapis.com;
  font-src 'self' data:
    https://fonts.gstatic.com;
  img-src 'self' data: blob:
    https://files.manuscdn.com
    https://www.google-analytics.com;
  connect-src 'self'
    https://*.amplitude.com
    https://plausible.io
    https://manus-analytics.com
    https://api.manus.im
    https://files.manuscdn.com;
  worker-src 'self' blob:;
  manifest-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
```

## 49.3 完整安全头（生产推荐）

```http
# HSTS - 已配
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

# CSP - 必加
Content-Security-Policy: <见上>

# X-Frame - 必加（防 clickjacking）
X-Frame-Options: DENY

# Content-Type 嗅探 - 必加
X-Content-Type-Options: nosniff

# Referrer - 必加
Referrer-Policy: strict-origin-when-cross-origin

# Permissions - 必加
Permissions-Policy:
  camera=(),
  microphone=(self),
  geolocation=(),
  payment=(),
  usb=(),
  bluetooth=(),
  interest-cohort=()

# DNS prefetch - 性能
X-DNS-Prefetch-Control: on

# Cross-Origin Embedder
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```

## 49.4 资源加载策略（推荐）

### preconnect + dns-prefetch

```html
<!-- 实测已配 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- 推荐补 -->
<link rel="preconnect" href="https://files.manuscdn.com">
<link rel="dns-prefetch" href="https://api2.amplitude.com">
<link rel="dns-prefetch" href="https://plausible.io">
```

### preload 关键资源

```html
<!-- 关键 JS bundle -->
<link rel="modulepreload" href="/assets/index-{hash}.js">

<!-- 关键字体（首屏中文文字立即可见）-->
<link rel="preload" as="font" type="font/woff2" crossorigin
      href="https://fonts.gstatic.com/s/notosanssc/...woff2">

<!-- 首屏图标 -->
<link rel="preload" as="image" href="/icons/icon-192.png">
```

---

# ⅼ · 业务正则 + 完整常量库

> 第八轮 Phase 44

## 50.1 业务关键正则（实测）

```typescript
export const REGEX = {
  // ⭐ AI 文案标题提取（【标题】格式）
  AI_SECTION:       /【(.+?)】/g,
  AI_SECTION_FULL:  /【(.+?)】\n([\s\S]+?)(?=【.+?】|$)/g,

  // ⭐ 中文数字编号列表（含 . 、 ）三种符号）
  CHINESE_LIST:     /^(\d+)[.、）]\s*(.+)$/,

  // 颜色值校验
  COLOR_HEX:        /^(#[a-f0-9]{3,4}|#[a-f0-9]{6}|#[a-f0-9]{8}|[a-f0-9]{6}|[a-z]+)$/i,

  // 数字校验
  NUMBER:           /^-?(?:\d+(?:\.\d+)?|\.\d+)$/,

  // Tailwind size 类
  TAILWIND_SIZE:    /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,

  // CSS 自定义属性
  CSS_VAR:          /^--[a-zA-Z0-9_-]+$/,

  // 邮箱（推测，从 OAuth 流程）
  EMAIL:            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // URL（推测）
  URL:              /^https?:\/\/[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=]*$/,

  // 中国手机号（推测，未实测）
  CN_PHONE:         /^1[3-9]\d{9}$/,

  // markdown 表格分隔符
  MD_TABLE_SEP_LEFT:    /^ *:-+ *$/,
  MD_TABLE_SEP_CENTER:  /^ *:-+: *$/,
  MD_TABLE_SEP_RIGHT:   /^ *-+: *$/
};
```

## 50.2 业务常量完整库（30+）

```typescript
// 数量常量
export const COUNTS = {
  STORYBOARD_COLUMNS: 13,           // 分镜表列数
  TOPIC_PER_CATEGORY: 20,            // 每类选题数
  TOPIC_TOTAL:        100,           // 5×20
  SCRIPT_TYPES:       20,
  HOT_ELEMENTS:       22,
  PRESENT_STYLES:     14,
  INDUSTRIES:         56,
  PLATFORMS:          5,
  STEP_COUNT:         9,             // step1, 3, 3b, 4, 4b, 5, 6, 7, 8
  DIAGNOSIS_STEPS:    8,
  PRIVATE_DOMAIN:     6,
  EVOLUTION_LEVELS:   5,
  COPYWRITING_FORMULAS: 23,
  TRENDING_DEFAULT:   25,            // /trending 默认拉 25 条
  ROUTES_TOTAL:       34,            // 含 admin 后台
  TRPC_PROCEDURES:    50,
  LUCIDE_ICONS_USED:  68,
};

// 文本约束
export const TEXT_LIMITS = {
  MIN_COPY_LENGTH:    10,            // 文案最少 10 字
  MAX_TOPIC_LENGTH:   500,           // /generate 主题
  MAX_VIDEO_LENGTH:   5000,          // /ai-video 文案
  MAX_ACCOUNT_NAME:   64,            // 账号名（推测）
  MAX_VERIFY_CODE:    2,             // 验证码（推测）
  MAX_BIO_LENGTH:     500,           // 简介（推测）
};

// 文件
export const FILE_LIMITS = {
  MAX_SIZE:           20 * 1024 * 1024,    // 20MB
  ACCEPT:             '.pdf,.doc,.docx,.txt,.md,.csv',
  MAX_DEEP_LEARNING_SAMPLES: 50,            // /deep-learning 最多 50 篇
};

// 时间常量
export const TIMING = {
  TOAST_DURATION:     4000,                 // sonner 默认
  IME_COMPOSITION_END: 100,                  // IME 完成检测
  PAGE_TRANSITION:    800,                   // 跳页延迟（让 toast 显示）
  ANIMATION_FAST:     150,
  ANIMATION_NORMAL:   300,
  ANIMATION_SLOW:     500,
  MODAL_TRANSITION:   200,                   // dialog 动画
  SCROLL_SMOOTH:      300,
  STREAMDOWN_SPEED_MS: 20,                  // 字符间隔（推测）
};

// 网络
export const NETWORK = {
  REACT_QUERY_RETRY:  1,                    // 失败重试 1 次
  STALE_TIME:         0,                    // 不缓存
  AI_CALL_TIMEOUT:    60_000,               // AI 调用超时（推测）
  POLLING_INTERVAL:   30_000,               // 推测无 polling
};

// 缓存
export const CACHE = {
  STATIC_MAX_AGE:     7776000,              // 90 天（实测）
  HTML_MAX_AGE:       0,                    // 不缓存
  HSTS_MAX_AGE:       31536000,             // 1 年
  SW_CACHE_NAME:      'aiip-agent-v2',
};

// 进化等级阈值
export const EVOLUTION_THRESHOLDS = {
  L1_TO_L2:   5,
  L2_TO_L3:  20,
  L3_TO_L4:  50,
  L4_TO_L5: 100,
};

// 数字格式化
export const NUMBER_FORMAT = {
  WAN_THRESHOLD:      10000,                // 10000+ 显示 "X 万"
  K_THRESHOLD:        1000,                 // 1000-9999 显示 "X K"
  DECIMAL_PLACES:     1,                    // 保留 1 位小数
};
```

## 50.3 LocalStorage Keys 完整命名规范

```typescript
export const LS_KEYS = {
  // Manus 平台
  USER_INFO:          'manus-runtime-user-info',

  // 全局
  ACTIVE_ACCOUNT:     'aiip_active_account_id',
  GLOBAL_INDUSTRY:    'aiip_memory_global_industry',

  // 账号级（{accId} = 当前活跃账号 ID）
  ACC_INDUSTRY:       (id: string) => `aiip_memory_acc_${id}_global_industry`,

  // Step 数据（带版本号 v2/v3 防 schema 升级时丢数据）
  STEP3:              (id) => `aiip_memory_acc_${id}_step3_account_v3`,
  STEP3B:             (id) => `aiip_memory_acc_${id}_step3b_persona`,
  STEP4:              (id) => `aiip_memory_acc_${id}_step4_execution_v2`,
  STEP4B:             (id) => `aiip_memory_acc_${id}_step4b_monetization`,
  STEP5:              (id) => `aiip_memory_acc_${id}_step5_topics_v2`,
  STEP6:              (id) => `aiip_memory_acc_${id}_step6_shooting`,
  STEP7:              (id) => `aiip_memory_acc_${id}_step7_copywriting`,
  STEP8:              (id) => `aiip_memory_acc_${id}_step8_livestream`,

  // 模块缓存
  VIDEO_ANALYSIS:     (id) => `aiip_memory_acc_${id}_video_analysis`,
  BOOM_GENERATE:      (id) => `aiip_memory_acc_${id}_boom_generate`,
  PRIVATE_DOMAIN:     (id) => `aiip_memory_acc_${id}_private_domain_v2`,
  AI_VIDEO:           (id) => `aiip_memory_acc_${id}_ai_video_storyboard`,

  // 全局
  VOICE_CHAT:         'voice_chat_history',

  // Amplitude
  AMP_CONFIG:         'AMP_remote_config_46ac3f9abb',
  AMP_UNSENT:         'AMP_unsent_46ac3f9abb',

  // SessionStorage
  PENDING_INVITE:     'pendingInviteCode',
  IMT_HANDSHAKE:      '__imt_handshake_page_id',  // 沉浸式翻译插件
};
```

## 50.4 第八轮新发现汇总

| # | 类别 | 内容 |
|---|---|---|
| 1 | 子分类 | ⭐ 「逼单话术」可能是 /private-domain `close` 阶段细分 |
| 2 | UX 提示 | ⭐「正在为你生成 5 大类爆款选题，预计需要 15-30 秒」长操作时间预期 |
| 3 | 正则 | ⭐ `/^【(.+?)】$/` 揭示 AI 输出有「`【标题】`」格式规范 |
| 4 | 反馈 | ⭐「告诉我哪里不满意，我会持续改进...」evolution 反馈 placeholder |
| 5 | Schema | ⭐ 分镜表 13 列完整 schema |
| 6 | 文案 | 9 个完整空态 + 15 个完整 loading + 30+ 完整 placeholder + 80+ 按钮 label |
| 7 | emoji | 5 进化 + 22 元素 + 5 平台 + 56 行业 + 5 选题分类 + 3 直播经验 全集 |
| 8 | Markdown | react-markdown 完整配置 + 22 子组件样式 + KaTeX inline 配置 |
| 9 | Analytics | Plausible 6 特性 + Amplitude API key 部分识别 + Manus 自家 Umami |
| 10 | 域名 | 完整外部 URL 9 域 + 推荐 CSP 配置完整版 |
| 11 | 安全 | 9 个推荐安全头完整配置（HSTS/CSP/X-Frame/Permissions 等）|
| 12 | 常量 | 30+ 业务常量整理（数量/文本/文件/时间/网络/缓存/阈值/格式）|
| 13 | LS keys | 完整 18 个 localStorage key 命名规范（含版本号 v2/v3 升级机制）|

---

# 附录 A · 抓取的原始数据位置

```
~/Desktop/aiipznt-clone-research/
├── docs/
│   ├── ROUTES.md                  # 路由清单
│   ├── TECH-STACK.md              # 技术栈推断
│   └── STORAGE-DUMP.json          # localStorage + 网络请求 dump
├── pages/                         # 32 个页面的结构化 JSON
│   ├── 01-step1-选择行业.json
│   ├── ...
│   ├── 26-方法论知识库.json
│   ├── 27-IP诊断.json             # 第二轮新发现
│   ├── 28-每日任务.json
│   ├── 29-进化仪表盘.json
│   ├── 30-账号管理.json
│   ├── 31-我的选题库.json
│   └── 32-历史记录.json
├── raw-html/                      # 26+ 个页面的完整 HTML
├── dynamic/                       # 第二轮 Phase 1-5 补抓产物
│   ├── menu-1-创作.json
│   ├── menu-2-策划.json
│   ├── menu-3-智能.json
│   ├── menu-4-更多.json
│   ├── menu-5-赵语AI.json         # IP 账号切换
│   ├── ip-plan-html.txt           # 完整 ip-plan DOM
│   ├── ip-plan-detail.json        # loading 样式
│   ├── home-progress-module.html  # 首页进度模块
│   ├── copy-toast-captured.json   # Sonner 复制 toast
│   ├── error-empty-form.json      # Sonner 错误 toast
│   ├── voice-chat-bubbles.json    # 对话气泡
│   ├── btn-generate-image.json    # 生成参考图按钮
│   └── custom-industry-mode.json  # /step/1 自定义模式
├── network/                       # (空，待补抓)
└── screenshots/                   # (空，待补抓)
```

# 附录 B · 后续补抓建议（方式 B）

如果要做到 95%+ 还原度，建议手动补抓以下场景（在浏览器实际操作，我同步记录 DOM）：

| 场景 | 抓什么 |
|---|---|
| AI 生成中的 loading 态 | spinner 设计 / 进度提示文案 |
| AI 生成失败的错误提示 | error toast 样式 / 文案 |
| Header 4 个一级菜单的 hover dropdown | 二级菜单完整列表 + 分组 |
| 「赵语 AI」浮窗展开后的 chat UI | 浮窗位置 / 尺寸 / 输入框 / 历史消息样式 |
| step/3 的「生成参考图」按钮 | 调用图像 API 的请求 / 返回的图片样式 |
| step/5 上传文件后的处理过程 | 文件上传进度条 / 解析结果展示 |
| /trending 抓爆款过程 | loading 动画 / 结果分页 / 排序选项 |
| /voice-chat 语音输入 | 录音 UI / 波形动画 / TTS 播放控件 |
| /ip-plan 进度条样式 | 圆环进度 vs 横向进度 / 动画 |
| 移动端布局 | 把窗口缩小到 < 1024px 看 lg:hidden 元素 |
| 登出 / 设置 / 账号切换 | 用户菜单点开后的内容 |
| 充值 / 算力消耗 | 触发"次数不足"时的提示 / 套餐页 |

---

# 附录 C · 已知未抓到的内容（第三轮更新）

## ✅ 第二、三轮已经抓到了（划掉了）

1. ~~CSS 完整规则~~ → 已抓 200KB CSS + 解析所有 design tokens（§ⅩⅢ + §ⅩⅨ）
2. ~~图标资源 lucide~~ → 实测 lucide-react，每个 icon 名字已识别（loader-circle / chevron-down / log-out / fingerprint / circle-check / arrow-left / refresh-cw / file-text / shield / menu / layout-grid / users 等）
3. ~~React Router 路由~~ → 已抓全部 34 个（§ⅩⅦ）
4. ~~tRPC 路由~~ → 已抓 50+（§3.1）
5. ~~Toast 文案~~ → 已抓 40+（§ⅩⅤ）
6. ~~PWA 配置~~ → 已完整（§ⅩⅣ）
7. ~~step Schema 推测~~ → 已实测真实字段（§3.4）

## ⏳ 仍未抓到（需要后续手动配合）

### 高价值缺口（需走完真实流程）
1. **AI prompts 模板** —— 在后端，前端拿不到（除非后端开源）
2. **diagnosis 8 步问卷生成报告 UI** —— 要走完会消耗算力
3. **每日任务真实内容** —— /daily-tasks AI 生成
4. **AI 生成结果完整范例** —— step6/8 sally 账号没用过

### 中价值缺口
5. **/accounts 创建账号 Step 2/3 表单完整字段** —— Step 1 已实测
6. **/evolution 触发进化弹窗** —— 反馈 5+ 后才能点
7. **图片素材** —— 首页 / 卡片图 PNG（验证已知**全站 0 张 img 标签**，纯 SVG 设计）
8. **截图视觉参考** —— macOS 屏幕录制权限未授

### 低价值缺口（设计上不存在）
9. ~~**Plausible 自定义事件名**~~ —— **确认无 custom events**（仅跟 pageview）
10. ~~**支付 / 充值 / 套餐页**~~ —— **确认无**（产品早期，邀请激活制）
11. **管理员后台具体功能** —— 仅 admin 角色可访问 /invite-manage 等
12. **多人协作 / 团队版** —— 产品当前无
13. ~~**WebSocket 流式推送**~~ —— bundle 有支持代码但**确认未启用**

## ✅ 第四轮新增已抓

14. ~~tRPC 真实响应 Schema~~ → 16 endpoint 全部实测（§ⅩⅩⅡ）
15. ~~Lucide 图标完整列表~~ → 68 个全部识别（§ⅩⅩ）
16. ~~Onboarding 字段~~ → 4 选项 + 4 选项（§ⅩⅩⅠ）
17. ~~未登录态文案~~ → 11 个页面全集（§ⅩⅩⅠ）
18. ~~确认弹窗 (AlertDialog)~~ → 9 子组件 + 全文案（§ⅩⅩⅣ）
19. ~~键盘 / 拖拽 / Web Speech~~ → 完整（§ⅩⅩⅢ）
20. ~~Manus 依赖最小化方案~~ → 5 步剥离（§ⅩⅩⅤ.2）
21. ~~Footer / 登录流程~~ → 完整（§ⅩⅩⅠ.1-2）
22. ~~Prisma schema 推断~~ → User/IpAccount/StepData/Copywriting/Onboarding 5 表（§22.12）

---

**文档结束** · 总计约 60KB · 26 个页面 + 完整数据模型 + 操作 SOP 全覆盖
