# /step/5 "爆款选题库" 完全重写 SPEC

> **作者** · Opus 4.7
> **执行** · Sonnet 4.6 max
> **目标** · 1:1 字面复刻 aiipznt sally /step/5 · form + 5 类 chip tabs + 100 选题 list
> **不动** · router.tsx · 旧 Step5FileUpload / Step5TopicGrid(保留 · 不再 import)

---

## 1 · 现状 + 工程约束

- `apps/web/src/pages/step/Step5.tsx` (267 行旧版 · 完全重写)
- `apps/web/src/lib/constants/step5.ts` (120 行 · 旧 @deprecated · 加新常量)
- `apps/web/src/components/step5/Step5FileUpload.tsx + Step5TopicGrid.tsx`(留 @deprecated)
- `apps/web/src/router.tsx:85` 已挂 · **不动**

### 视觉参考
- `apps/web/src/components/step8/Step8PlanTabs.tsx` (chip tabs · 类似 5 大类 tabs)
- `apps/web/src/pages/tools/components/PrivateDomainScenarioTabs.tsx` (chip tab + icon + sub)
- `apps/web/src/components/step6/Step6StoryboardSection.tsx` (list + 数字 chip)
- `apps/web/src/components/ui/sub-card.tsx`

---

## 2 · schema

```typescript
export type Step5CategoryId = 'traffic' | 'monetization' | 'persona' | 'cognition' | 'case';

export interface Step5Category {
  id: Step5CategoryId;
  name: string;          // 流量型选题 / ...
  subtitle: string;      // 追热点、蹭流量、快速涨粉 / ...
  icon: string;          // 📈 / $ / 👥 / 🧠 / 📖
  count: number;         // 20
}

export interface Step5Topic {
  index: number;         // 1-20
  title: string;
  platform: string;      // 'douyin' default
  difficulty: 'simple' | 'medium' | 'hard';
  difficultyLabel: '简单' | '中等' | '困难';
  rating: 4 | 5;         // 4 / 5 星
}

export interface Step5Result {
  topics: Record<Step5CategoryId, Step5Topic[]>;  // 5 × 20 = 100
}

export interface Step5FormData {
  industry: string;
  product: string;
}
```

---

## 3 · Form 默认值

```typescript
const DEFAULT_FORM: Step5FormData = {
  industry: '其他行业',
  product: '定制智能体和opc培训',
};

const CATEGORIES: Step5Category[] = [
  { id: 'traffic',      name: '流量型选题', subtitle: '追热点、蹭流量、快速涨粉',     icon: '📈', count: 20 },
  { id: 'monetization', name: '变现型选题', subtitle: '直接带货、引流变现',            icon: '$',  count: 20 },
  { id: 'persona',      name: '人设型选题', subtitle: '打造个人品牌、建立信任',         icon: '👥', count: 20 },
  { id: 'cognition',    name: '认知型选题', subtitle: '输出价值、建立专业形象',         icon: '🧠', count: 20 },
  { id: 'case',         name: '案例型选题', subtitle: '真实案例、社会证明',            icon: '📖', count: 20 },
];
```

---

## 4 · 完整 mock data · 100 topic

> ⚠️ **流量型 20 个必须严格 1:1 截图** · 不允许改字
> 其他 4 类 80 个 · Opus 4.7 已基于截图风格 + AI/opc/餐饮转型语料生成 · Sonnet 必须**逐字 copy** · 不允许重新生成或改写

```typescript
function generateMockResult(): Step5Result {
  return {
    topics: {
      // ── 流量型选题(20 · sally 截图 1:1)─────────────────
      traffic: [
        { index: 1,  title: '老板们为什么还在熬夜加班',     platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
        { index: 2,  title: '别再用人肉做表格了',           platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 4 },
        { index: 3,  title: '你还不知道AI能帮你做啥',       platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 4 },
        { index: 4,  title: '00后都开始用AI赚钱了',         platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 5,  title: '花2000块学AI不如直接用',       platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 4 },
        { index: 6,  title: 'AI定制比你自己更懂你',          platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 7,  title: '餐饮老板的AI转型秘密',         platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
        { index: 8,  title: '我曾背负百万负债的真相',       platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 9,  title: '从餐饮老板到AI定制师',         platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 10, title: '你的时间值多少钱一小时',       platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 4 },
        { index: 11, title: '为什么有的人赚钱那么轻松',     platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 12, title: 'AI定制到底能省多少钱',         platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
        { index: 13, title: '老板们都在偷偷用的AI',         platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
        { index: 14, title: '一个智能体解放你一半工作',     platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 4 },
        { index: 15, title: 'AI定制，是不是智商税',          platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 16, title: '你公司的隐形内耗有多大',       platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
        { index: 17, title: '为什么你的同行突然加速了',     platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
        { index: 18, title: '我从技术小白到AI定制师',       platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
        { index: 19, title: 'AI定制的真实成本到底多少',     platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
        { index: 20, title: '老板，别再自己瞎折腾了',        platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
      ],

      // ── 变现型选题(20 · Opus 编 · 直接带货/引流变现风格)─────────────
      monetization: [
        { index: 1,  title: 'AI定制服务直降3000 仅限本周',     platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 5 },
        { index: 2,  title: '我帮客户省20万的AI方案',          platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 3,  title: '9800学到AI实战 比单干强10倍',     platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
        { index: 4,  title: 'OPC创业课开放报名 前20名半价',    platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 4 },
        { index: 5,  title: '免费领AI工具清单（限今晚）',       platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 5 },
        { index: 6,  title: '一对一AI诊断 名额仅10个',          platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 5 },
        { index: 7,  title: '我的AI客户案例 你也能做到',         platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 8,  title: '私信领【智能体定制白皮书】',         platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 4 },
        { index: 9,  title: 'AI智能体定制套餐对比图',            platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
        { index: 10, title: '从9800到29800 我的产品矩阵',         platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 11, title: '直播间专属价 只到今晚12点',          platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 5 },
        { index: 12, title: 'AI让你的店铺月入翻倍',                platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
        { index: 13, title: '一年AI陪跑 落地100个智能体',          platform: 'douyin', difficulty: 'hard',   difficultyLabel: '困难', rating: 5 },
        { index: 14, title: '我用AI拿下百万博主商单的过程',         platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 15, title: 'AI定制 30天无理由退款承诺',           platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 4 },
        { index: 16, title: '5万起做AI项目 你敢接吗',              platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
        { index: 17, title: '别人花5万 你只花5000的方案',            platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 18, title: '现在下单送AI入门课3节',                 platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 4 },
        { index: 19, title: '我交付的AI项目客户复购率80%',           platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 20, title: '现金流危机？AI智能体一年回本',           platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
      ],

      // ── 人设型选题(20 · Opus 编 · 打造个人品牌)─────────────
      persona: [
        { index: 1,  title: '12年餐饮老板的AI觉醒时刻',             platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 2,  title: '我是老高 AI智能体定制师',                platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 4 },
        { index: 3,  title: '13家店变0家店 我的至暗时刻',             platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 4,  title: '背负百万负债 用AI翻盘的故事',             platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 5,  title: '为什么我从餐饮 all in AI',                platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 6,  title: '我的一天 · AI创业者日常',                 platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 4 },
        { index: 7,  title: 'OPC创业者的真实独白',                     platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
        { index: 8,  title: '我是怎么从0到月入5万的',                   platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 9,  title: '40岁转型AI 我后悔吗',                     platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 10, title: '从技术小白到能交付企业项目',                platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
        { index: 11, title: '关掉最后一家店那天',                       platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 12, title: '我的AI学习路径 全曝光',                    platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 4 },
        { index: 13, title: '为什么我相信普通人都能做AI',                platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 14, title: '我妻子说我疯了那天',                       platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
        { index: 15, title: 'AI创业半年 我学到的5件事',                  platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
        { index: 16, title: '一个不懂代码的我做AI的方法',                platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 4 },
        { index: 17, title: '我每天读3小时AI资料的原因',                 platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 4 },
        { index: 18, title: '从负债到自由 我的破局之路',                  platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 19, title: '我不是大佬 只是早走了一步',                  platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 4 },
        { index: 20, title: '5年后我希望成为什么样的AI人',                platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
      ],

      // ── 认知型选题(20 · Opus 编 · 输出价值/建立专业)─────────────
      cognition: [
        { index: 1,  title: 'AI时代 3个底层认知',                      platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 2,  title: '为什么你做AI总觉得难',                     platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
        { index: 3,  title: 'OPC创业者必避的4个坑',                     platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 4,  title: 'AI不是替代你 是给你超能力',                platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 4 },
        { index: 5,  title: '判断AI项目能否成 看这3点',                 platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 6,  title: '一个智能体的真正成本结构',                  platform: 'douyin', difficulty: 'hard',   difficultyLabel: '困难', rating: 4 },
        { index: 7,  title: '中小企业用AI的正确姿势',                   platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 8,  title: 'AI产品定价的3个公式',                      platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
        { index: 9,  title: '为什么AI教程看了就忘',                     platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 4 },
        { index: 10, title: 'AI智能体和机器人的本质区别',                 platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
        { index: 11, title: '为什么99%的AI课都教错了',                   platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 12, title: '从0做AI项目 第1步该干啥',                   platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 5 },
        { index: 13, title: 'AI赛道的3条护城河',                        platform: 'douyin', difficulty: 'hard',   difficultyLabel: '困难', rating: 5 },
        { index: 14, title: '判断AI工具好不好 看2个指标',                 platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 4 },
        { index: 15, title: 'AI让信息差变小 但能力差变大',                platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 16, title: '为什么AI落地比AI技术更重要',                 platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 17, title: 'AI项目失败的5个共同点',                     platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
        { index: 18, title: '一个老板该懂的AI 3件事',                    platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 4 },
        { index: 19, title: 'AI不解决问题 它放大问题',                   platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 20, title: '认知决定你能用AI做多大的事',                 platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
      ],

      // ── 案例型选题(20 · Opus 编 · 真实案例/社会证明)─────────────
      case: [
        { index: 1,  title: '我帮美容院做的AI · 月增20万',              platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 2,  title: '餐饮老板用AI · 人力成本降50%',              platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 3,  title: '百万博主用我的AI · 省了一个团队',            platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 4,  title: '电商客户用AI · 客服效率提升300%',           platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 5,  title: '一个连锁美甲店的AI改造',                    platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
        { index: 6,  title: '我交付的第一个AI项目 收费9800',              platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
        { index: 7,  title: '从面诊到智能推荐 美业的AI闭环',              platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 8,  title: '小店老板用AI做出大店的样子',                 platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 4 },
        { index: 9,  title: 'AI智能体让客户复购率从30%涨到65%',           platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 10, title: '一个OPC创业者的6个月蜕变',                   platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 11, title: '客户感谢信集锦 真实反馈',                    platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 4 },
        { index: 12, title: '案例拆解 · 培训机构如何用AI招生',             platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
        { index: 13, title: '从月入1万到月入10万的AI玩家',                 platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 14, title: '我的客户 · 一年回本案例',                    platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
        { index: 15, title: '美容师转型AI讲师 月入5万',                    platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 16, title: '一个智能体 帮老板少招3个人',                  platform: 'douyin', difficulty: 'simple', difficultyLabel: '简单', rating: 4 },
        { index: 17, title: '案例 · 茶饮店的AI排班革命',                   platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
        { index: 18, title: '从被裁员到月入8万的OPC故事',                  platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 19, title: '我帮3个朋友做的AI · 各自月增5万',              platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 5 },
        { index: 20, title: '真实案例 · 工作室一人 干10个人的活',           platform: 'douyin', difficulty: 'medium', difficultyLabel: '中等', rating: 4 },
      ],
    },
  };
}
```

---

## 5 · sub-component 规格

### 5.1 Step5CategoryTabs.tsx(5 大类 chip)

文件 · `apps/web/src/components/step5/Step5CategoryTabs.tsx`
Props · `{ categories: Step5Category[]; activeId: Step5CategoryId; onChange: (id) => void; }`

Layout · grid-cols-1 md:grid-cols-5 gap-3:
- 每 chip `<button>` ·
  - active · `border-primary/40 bg-primary/10 text-primary`
  - inactive · `border-border/40 hover:text-on-surface`
  - 内部 stack(items-start · space-y-2 · py-4 px-4):
    - row · icon(text-lg) + name(text-sm font-semibold)
    - subtitle(text-xs text-muted-foreground)
    - count(text-xs text-on-surface/70) `{count} 个选题`

### 5.2 Step5TopicListItem.tsx(单个 topic · list.map)

文件 · `apps/web/src/components/step5/Step5TopicListItem.tsx`
Props · `{ topic: Step5Topic; onLike?: () => void; onOptimize?: () => void; onCopy?: () => void; className?: string; }`

Layout · row(border-border/40 rounded-lg p-3 grid-cols-[48px_1fr_auto] gap-3 items-center):
- 左 · 序号 chip(`<span text-on-surface/70 bg-primary/8 border-primary/20 rounded-full w-10 h-10 flex items-center justify-center text-sm font-semibold>{index}</span>`)
- 中 · stack(space-y-1.5):
  - title(text-sm font-semibold text-on-surface)
  - row · platform chip(`<span text-[11px] bg-primary/15 border-primary/30 text-primary rounded px-2 py-0.5>{platform}</span>`) + difficulty chip(简单→emerald · 中等→amber · 困难→rose) + rating(`★`.repeat(rating) · text-primary)
- 右 · 3 button stack-row · ♡ heart / ✨ optimize / 📋 copy(variant ghost size icon · 大小 h-8 w-8)

---

## 6 · Step5.tsx 重写规格

```typescript
export default function Step5() {
  const [industry, setIndustry] = useState(DEFAULT_FORM.industry);
  const [product, setProduct] = useState(DEFAULT_FORM.product);
  const [activeCategory, setActiveCategory] = useState<Step5CategoryId>('traffic');
  const [searchQuery, setSearchQuery] = useState('');

  const generated = generateMockResult();
  const currentTopics = generated.topics[activeCategory];
  const filteredTopics = searchQuery.trim()
    ? currentTopics.filter((t) => t.title.includes(searchQuery))
    : currentTopics;

  function handleRegenerateAll() { toast.success('已重新生成全部选题'); }
  function handleOptimize() { toast.success('已智能优化'); }
  function handleLike(t: Step5Topic) { toast.success(`已收藏 #${t.index} ${t.title}`); }
  function handleOptimizeOne(t: Step5Topic) { toast.success(`已优化 #${t.index}`); }
  function handleCopy(t: Step5Topic) { navigator.clipboard.writeText(t.title).then(() => toast.success('已复制选题')); }

  return (
    <main className="flex-1 container py-8 space-y-6 max-w-6xl">
      {/* breadcrumb */}
      <p className="text-xs font-semibold text-primary tracking-wide">STEP 05 › 爆款选题库</p>

      {/* H1 + subtitle */}
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">🔥 爆款选题库</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          输入你的行业和产品信息，还可以上传产品资料和人物介绍文档，AI将结合这些素材一次性生成
          <span className="text-primary font-semibold mx-1">5大类</span>
          爆款选题（流量型/变现型/人设型/认知型/案例型），每类20个选题，共100个。
        </p>
      </header>

      {/* form */}
      <div className="bg-card/30 border border-primary/30 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface">
              <span className="text-rose-400 mr-1">*</span>你的行业
            </label>
            <Input value={industry} onChange={(e) => setIndustry(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface">
              <span className="text-rose-400 mr-1">*</span>你的产品/服务
            </label>
            <Input value={product} onChange={(e) => setProduct(e.target.value)} />
          </div>
        </div>

        {/* 2 上传 dropzone(stub · 不实际上传) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: '上传产品资料', desc: '产品介绍、卖点、价格体系、客户案例等' },
            { title: '上传人物介绍与行业', desc: '个人经历、行业背景、专业资质、从业故事等' },
          ].map((u, i) => (
            <div key={i} className="border border-dashed border-border/50 rounded-lg p-8 text-center space-y-2 hover:border-primary/40 transition-colors cursor-pointer">
              <p className="text-2xl text-primary">⬆</p>
              <p className="text-sm font-semibold text-primary">{u.title}</p>
              <p className="text-xs text-muted-foreground">{u.desc}</p>
              <p className="text-[11px] text-muted-foreground/70">支持 PDF、Word、TXT、Markdown、CSV（最大20MB）</p>
            </div>
          ))}
        </div>

        <Button onClick={handleRegenerateAll} className="w-full bg-primary hover:bg-primary/90">
          ⟳ 重新生成全部选题
        </Button>
      </div>

      {/* 5 大类 chip tabs */}
      <Step5CategoryTabs categories={CATEGORIES} activeId={activeCategory} onChange={setActiveCategory} />

      {/* 智能优化(右上) */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={handleOptimize} className="text-primary">
          ✨ 智能优化
        </Button>
      </div>

      {/* 搜索 + 计数 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索选题关键词..."
            className="pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground shrink-0">
          共 <span className="text-primary font-semibold">{filteredTopics.length}</span> 个选题 <span className="text-muted-foreground/70">（全部 100 个）</span>
        </p>
      </div>

      {/* 选题 list */}
      <div className="space-y-3">
        {filteredTopics.map((t) => (
          <Step5TopicListItem
            key={`${activeCategory}-${t.index}`}
            topic={t}
            onLike={() => handleLike(t)}
            onOptimize={() => handleOptimizeOne(t)}
            onCopy={() => handleCopy(t)}
          />
        ))}
      </div>

      {/* footer · 反馈 */}
      <div className="flex items-center gap-3 pt-6 border-t border-border/30">
        <p className="text-xs text-muted-foreground">这个结果对你有帮助吗？</p>
        <Button variant="ghost" size="icon" aria-label="有帮助">👍</Button>
        <Button variant="ghost" size="icon" aria-label="无帮助">👎</Button>
      </div>
    </main>
  );
}
```

---

## 7 · step5.ts 常量追加

```typescript
// ─── PRD-29.14 · 真实字面 ──────────────────────────────────
export const STEP5_BREADCRUMB_REAL = 'STEP 05 › 爆款选题库' as const;
export const STEP5_H1_REAL = '爆款选题库' as const;
export const STEP5_SUBTITLE_REAL_PREFIX = '输入你的行业和产品信息，还可以上传产品资料和人物介绍文档，AI将结合这些素材一次性生成' as const;
export const STEP5_SUBTITLE_REAL_SUFFIX = '爆款选题（流量型/变现型/人设型/认知型/案例型），每类20个选题，共100个。' as const;
export const STEP5_SUBTITLE_REAL_HIGHLIGHT = '5大类' as const;
export const STEP5_FORM_INDUSTRY_LABEL = '你的行业' as const;
export const STEP5_FORM_PRODUCT_LABEL = '你的产品/服务' as const;
export const STEP5_UPLOAD_PRODUCT_TITLE = '上传产品资料' as const;
export const STEP5_UPLOAD_PRODUCT_DESC = '产品介绍、卖点、价格体系、客户案例等' as const;
export const STEP5_UPLOAD_CHARACTER_TITLE = '上传人物介绍与行业' as const;
export const STEP5_UPLOAD_CHARACTER_DESC = '个人经历、行业背景、专业资质、从业故事等' as const;
export const STEP5_UPLOAD_SUPPORT_HINT = '支持 PDF、Word、TXT、Markdown、CSV（最大20MB）' as const;
export const STEP5_CTA_REGENERATE_ALL = '重新生成全部选题' as const;
export const STEP5_CTA_OPTIMIZE = '智能优化' as const;
export const STEP5_SEARCH_PLACEHOLDER = '搜索选题关键词...' as const;
```

---

## 8 · 文件输出 list

| # | path | 操作 | 行数估 |
|:-:|---|:-:|:-:|
| 1 | `apps/web/src/lib/constants/step5.ts` | Edit 末尾追加 ~20 行 | +20 |
| 2 | `apps/web/src/components/step5/Step5CategoryTabs.tsx` | new | ~55 |
| 3 | `apps/web/src/components/step5/Step5TopicListItem.tsx` | new | ~75 |
| 4 | `apps/web/src/pages/step/Step5.tsx` | rewrite(替换 267 行 · 含 100 topic mock ~400 行) | ~700 |

不动 · router.tsx · 旧常量 · 旧 Step5FileUpload / Step5TopicGrid

---

## 9 · 验收

1. typecheck 0 error
2. http://localhost:5173/step/5 可访问
3. innerText 30+ key grep · 5 类切换 work · 搜索 work

---

## 10 · Sonnet 工作流

1. Read SPEC.md
2. Read Step8PlanTabs / PrivateDomainScenarioTabs / Step6StoryboardSection / sub-card
3. Edit step5.ts 末尾追加
4. Write 2 sub-component
5. Write Step5.tsx 完全重写
6. typecheck PASS

---

## 11 · 红线

- ❌ 不动 router.tsx
- ❌ 不删旧常量
- ❌ §3 form 默认值 + §4 mock(100 topic)必须逐字 · 全角标点保留
- ❌ 流量型 20 个**必须 sally 截图原文**(不允许任何字符改动)
- ❌ emoji 保留: 🔥 📈 $ 👥 🧠 📖 ⟳ ✨ 🔍 ⬆ ♡ 📋 👍 👎
- ❌ 不允许 uppercase class
- ❌ 文件上传是 stub · 不实际处理 File
- ❌ 不启 dev server / 不截图

---

## 12 · 报告格式

```
DONE / BLOCKED
写了 X 个文件: ...
typecheck: PASS / FAIL
异常: ...
下一步建议 Opus 做的事: ...
```
