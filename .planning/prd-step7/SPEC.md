# /step/7 "文案生成" 完全重写 SPEC

> **作者** · Opus 4.7
> **执行** · Sonnet 4.6 max
> **目标** · 1:1 字面复刻 aiipznt sally /step/7 · 2 列 form(左 script types + 右 elements)+ 长文输出 + AI 优化
> **不动** · router.tsx · 旧 step7 常量 / 3 旧组件(留 @deprecated)

---

## 1 · 现状

- `apps/web/src/pages/step/Step7.tsx` (361 行旧 · 完全重写)
- `apps/web/src/lib/constants/step7.ts` (188 行 · 旧 @deprecated · 加新常量)
- `apps/web/src/components/step7/{Step7ElementMultiSelect,Step7OutputContent,Step7ScriptTypeSearch}.tsx` (留 @deprecated · 不 import)
- `apps/web/src/router.tsx:87` 已挂 · **不动**

### 视觉参考
- `apps/web/src/components/step6/Step6VoiceoverScriptSection.tsx` (长文输出 · 复制 button)
- `apps/web/src/pages/tools/components/PrivateDomainScenarioTabs.tsx` (chip multi-select 风格)
- `apps/web/src/components/step8/Step8AiOptimizeSection.tsx` (AI 优化 sub-card)
- `apps/web/src/components/step5/Step5CategoryTabs.tsx` (cards list 风格)

---

## 2 · schema

```typescript
export type Step7ElementCategoryId = 'classic' | 'emotion' | 'content' | 'conversion';

export interface Step7ElementCategory {
  id: Step7ElementCategoryId;
  name: string;        // 经典元素 / 情绪驱动 / 内容策略 / 转化驱动
  elements: Step7Element[];
}

export interface Step7Element {
  id: string;
  label: string;       // 贪念 / 恐惧 / ...
  icon: string;        // $ / 😨 / 🔍 / ...
}

export interface Step7ScriptType {
  id: string;
  name: string;        // 聊观点 / 晒过程 / 教知识 / ...
  desc: string;
}

export interface Step7FormData {
  selectedScriptTypeId: string;     // 默认 'debate'(搞辩论)
  selectedElementIds: string[];     // 默认 9 个
  topic: string;                    // 文案主题(default: 为什么有的人赚钱那么轻松)
  optimizeGoal: string;             // AI 优化方向(选填)
}
```

---

## 3 · Form 默认值

```typescript
const DEFAULT_FORM: Step7FormData = {
  selectedScriptTypeId: 'debate',
  selectedElementIds: [
    'greed', 'fear', 'curiosity', 'contrast', 'worst',
    'leverage', 'resonance', 'empathy', 'leverage_small',
  ],  // 9 个
  topic: '为什么有的人赚钱那么轻松',
  optimizeGoal: '',
};

const SCRIPT_TYPES: Step7ScriptType[] = [
  { id: 'opinion', name: '聊观点',   desc: '表达个人观点，引发共鸣，适合知识分享类账号' },
  { id: 'process', name: '晒过程',   desc: '展示操作过程，平台超大流量体，适合教程类内容' },
  { id: 'teach',   name: '教知识',   desc: '教学类内容，传递价值，适合专业领域分享' },
  { id: 'story',   name: '讲故事',   desc: '故事型脚本，塑造人设，适合个人品牌打造' },
  { id: 'joke',    name: '尬段子',   desc: '搞笑类内容，娱乐性强，适合泛娱乐账号' },
  { id: 'product', name: '说产品',   desc: '以变现为目标的产品脚本，适合带货和商业推广' },
  { id: 'debate',  name: '搞辩论',   desc: '正反观点对抗，引发讨论和互动' },
];

const ELEMENT_CATEGORIES: Step7ElementCategory[] = [
  {
    id: 'classic',
    name: '经典元素',
    elements: [
      { id: 'greed',          label: '贪念',         icon: '$' },
      { id: 'fear',           label: '恐惧',         icon: '😨' },
      { id: 'curiosity',      label: '猎奇',         icon: '🔍' },
      { id: 'contrast',       label: '反差',         icon: '⟳' },
      { id: 'worst',          label: '最差',         icon: '⚠' },
      { id: 'leverage',       label: '借势',         icon: '🔥' },
      { id: 'resonance',      label: '共鸣',         icon: '💬' },
      { id: 'empathy',        label: '共情',         icon: '🤝' },
      { id: 'leverage_small', label: '以小搏大',     icon: '🎯' },
      { id: 'roi_high',       label: '低成本高回报', icon: '📈' },
      { id: 'roi_unknown',    label: '低成本未知回报', icon: '🏛' },
    ],
  },
  {
    id: 'emotion',
    name: '情绪驱动',
    elements: [
      { id: 'anger',    label: '愤怒', icon: '😡' },
      { id: 'surprise', label: '惊喜', icon: '😯' },
    ],
  },
  {
    id: 'content',
    name: '内容策略',
    elements: [
      { id: 'hot',         label: '热点',  icon: '🔥' },
      { id: 'controversy', label: '争议',  icon: '💬' },
      { id: 'reveal',      label: '揭秘',  icon: '🔒' },
      { id: 'list',        label: '清单',  icon: '📋' },
      { id: 'challenge',   label: '挑战',  icon: '🎯' },
      { id: 'transform',   label: '蜕变',  icon: '🦋' },
    ],
  },
  {
    id: 'conversion',
    name: '转化驱动',
    elements: [
      { id: 'scarcity',    label: '稀缺',     icon: '⏳' },
      { id: 'social',      label: '社会证明', icon: '👍' },
      { id: 'authority',   label: '权威',     icon: '🚩' },
      { id: 'benefit',     label: '利益',     icon: '🎁' },
    ],
  },
];
```

---

## 4 · 生成结果 mock(长文 · 跟 sally 截图 1:1 字面)

```typescript
const GENERATED_RESULT = `【标题】为什么美业老板，有人赚钱那么轻松，有人却苦苦挣扎？

【话题抛出】你有没有发现，同样是美业老板，有人每天忙得焦头烂额，赚的却是辛苦钱；有人却能轻轻松松，钱自己就来了？这背后到底藏着什么秘密？

【正方】（轻松赚钱派：AI赋能，效率为王）
我见过一个美容院老板，店里只有三个人，但去年线上成交额却做到了370万。她是怎么做到的？就是把所有重复性、耗时的工作，比如预约排班、客户维护、营销话术，全部交给AI智能体。员工从繁琐的事务中解放出来，能把更多精力放在服务客户和提升专业技能上。这不就是把时间卖出更高的价钱吗？她算了一笔账，一个智能体每年帮她省下至少20万的人力成本，而且效率是人工的十倍。

【反方】（传统派：服务为本，温度至上）
但也有人说，美业是服务行业，最重要的是人情味和体验感。冰冷的AI怎么能替代美容师的巧手和贴心？一个老牌美容院老板就告诉我，她的客户都是跟着她十几年甚至二十几年的，靠的就是她和员工的专业、细致和情感连接。她觉得，如果把这些都交给AI，那美业就失去了灵魂，变成了流水线。客户来这里不仅是变美，更是寻求一份放松和信任，这是AI给不了的。

• 我的立场

其实，这两种观点都有道理，但我觉得，轻松赚钱和人情味并不冲突。那些赚钱轻松的美业老板，不是抛弃了服务，而是找到了一个支点，用AI把那些可以标准化的流程优化到极致，把省下来的时间和精力，投入到真正需要"人"的服务上。比如，AI帮你筛选出高意向客户，你再用你的专业和温度去转化和维护。这不就是把"低成本高回报"和"以小搏大"玩明白了？关键在于，你有没有看到这个趋势，有没有勇气去尝试。

• 评论区引导

你觉得美业未来是AI主导，还是人情味更重要？或者说，两者该怎么结合？评论区聊聊你的看法。

【话题标签】#美业 #AI赋能 #智能体 #赚钱思维 #效率提升 #创业者 #商业模式 #美业老板 #行业洞察`;
```

---

## 5 · sub-component 规格

### 5.1 Step7ScriptTypeList.tsx(左列)

文件 · `apps/web/src/components/step7/Step7ScriptTypeList.tsx`
Props · `{ types: Step7ScriptType[]; selectedId: string; onSelect: (id: string) => void; className?: string; }`

Layout:
1. H3 row · `<h3 text-sm font-semibold>选择脚本类型</h3>`
2. Search input · `🔍 搜索脚本...` placeholder · 内部 useState 控制 query
3. 列表 stack(space-y-3 · max-h-[600px] overflow-y-auto):
   - types.filter(by query).map · 每 card `<button>` ·
     - selected · `border-primary/40 bg-primary/10`
     - inactive · `border-border/40 hover:bg-card/50`
     - 内部 stack · text-sm font-semibold(name) + text-xs text-muted-foreground(desc)

### 5.2 Step7ElementCategoryGrid.tsx(右列 元素)

文件 · `apps/web/src/components/step7/Step7ElementCategoryGrid.tsx`
Props · `{ categories: Step7ElementCategory[]; selectedIds: string[]; onToggle: (id: string) => void; className?: string; }`

Layout:
1. H3 row · `<h3 text-sm font-semibold>选择爆款元素 <span text-muted-foreground>(已选 {selectedIds.length} 个)</span></h3>`
2. categories.map · 每 category · space-y-2:
   - `<p text-xs text-muted-foreground>{category.name}</p>`
   - elements flex-wrap gap-2 · 每 chip `<button>` ·
     - selected · `border-primary/40 bg-primary/15 text-primary font-semibold`
     - inactive · `border-border/40 text-on-surface/70 hover:text-on-surface`
     - 内部 row(items-center gap-1.5 · px-3 py-1.5):
       - icon(text-sm)
       - label(text-xs)

### 5.3 Step7OutputResultSection.tsx(生成结果)

文件 · `apps/web/src/components/step7/Step7OutputResultSection.tsx`
Props · `{ content: string; onCopy?: () => void; className?: string; }`

Layout · SubCard:
1. H3 row · 左 `<h3 text-base font-semibold>✨ 生成结果</h3>` + 右 copy button(`📋` icon)
2. content 渲染 · `<div whitespace-pre-wrap text-sm text-on-surface/85 leading-loose font-cn>{content}</div>`

注意 · 截图里 • 我的立场 / • 评论区引导 是黄色 section break · 用 markdown-like 解析可能复杂 · 简化 · 直接用 whitespace-pre-wrap 把整段文字按行渲染 · 不做特殊高亮(可接受 1:1 字面 · 视觉略简化)。

### 5.4 Step7AiOptimizeSection.tsx(AI 优化)

文件 · `apps/web/src/components/step7/Step7AiOptimizeSection.tsx`
Props · `{ value: string; onChange: (v: string) => void; onOptimize: () => void; className?: string; }`

Layout · SubCard(border-primary/30):
1. H3 row · `<h3 text-sm font-semibold>⟳ AI智能优化</h3>`
2. Input · placeholder "输入优化方向（可选），如：更有吸引力、增加互动感、更口语化..."
3. 按钮 center · `<Button>⟳ AI优化文案</Button>`

---

## 6 · Step7.tsx 重写

```typescript
export default function Step7() {
  const [selectedScriptTypeId, setSelectedScriptTypeId] = useState(DEFAULT_FORM.selectedScriptTypeId);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>(DEFAULT_FORM.selectedElementIds);
  const [topic, setTopic] = useState(DEFAULT_FORM.topic);
  const [optimizeGoal, setOptimizeGoal] = useState('');

  const currentScript = SCRIPT_TYPES.find((t) => t.id === selectedScriptTypeId);

  function handleToggleElement(id: string) {
    setSelectedElementIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }
  function handleGenerate() { toast.success('已生成爆款文案'); }
  function handleCopyResult() {
    navigator.clipboard.writeText(GENERATED_RESULT).then(() => toast.success('已复制文案'));
  }
  function handleOptimize() { toast.success('已 AI 优化文案'); }
  function handleChangeTopic() { toast.info('跳转到爆款选题库'); }
  function handleMyTopics() { toast.info('打开我的选题库'); }
  function handleHotTopics() { toast.info('跳转到爆款选题'); }

  return (
    <main className="flex-1 container py-8 space-y-6 max-w-6xl">
      <p className="text-xs font-semibold text-primary tracking-wide">STEP 07 › AI智能文案生成</p>
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">✨ 文案生成</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          选择脚本类型和爆款元素，输入主题，AI将基于方法论生成
          <span className="text-primary font-semibold mx-1">深度爆款文案</span>
          ，支持AI智能修改优化。
        </p>
      </header>

      {/* 2 列 layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左 · 脚本类型 */}
        <div className="bg-card/30 border border-border/40 rounded-lg p-5">
          <Step7ScriptTypeList types={SCRIPT_TYPES} selectedId={selectedScriptTypeId} onSelect={setSelectedScriptTypeId} />
        </div>

        {/* 右 · 元素 + form + 输出 */}
        <div className="space-y-5">
          <div className="bg-card/30 border border-border/40 rounded-lg p-5">
            <Step7ElementCategoryGrid categories={ELEMENT_CATEGORIES} selectedIds={selectedElementIds} onToggle={handleToggleElement} />
          </div>

          {/* 文案主题 + 当前脚本 + main CTA */}
          <div className="bg-card/30 border border-border/40 rounded-lg p-5 space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface">
                文案主题 <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full min-h-[80px] rounded-md border border-border bg-input px-3 py-2 text-sm text-on-surface resize-y"
                required
              />
            </div>
            {currentScript && (
              <p className="text-xs text-muted-foreground">
                当前脚本：<span className="text-primary font-semibold">{currentScript.name}</span> - {currentScript.desc}
              </p>
            )}
            <Button onClick={handleGenerate} disabled={!topic.trim()} className="w-full bg-primary hover:bg-primary/90">
              ✨ 生成爆款文案
            </Button>
          </div>
        </div>
      </div>

      {/* 生成结果(全宽) */}
      <Step7OutputResultSection content={GENERATED_RESULT} onCopy={handleCopyResult} />

      {/* AI 优化 */}
      <Step7AiOptimizeSection value={optimizeGoal} onChange={setOptimizeGoal} onOptimize={handleOptimize} />

      {/* footer · 想换个选题 + 我的选题库 + 爆款选题 */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/30">
        <button className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5" onClick={handleChangeTopic}>
          <span className="text-rose-400">♡</span> 想换个选题继续生成文案？
        </button>
        <div className="flex items-center gap-4">
          <button className="text-sm text-primary flex items-center gap-1.5" onClick={handleMyTopics}>
            <span className="text-rose-400">♡</span> 我的选题库
          </button>
          <button className="text-sm text-primary flex items-center gap-1.5" onClick={handleHotTopics}>
            ✨ 爆款选题
          </button>
        </div>
      </div>
    </main>
  );
}
```

---

## 7 · step7.ts 常量追加

```typescript
// ─── PRD-29.15 · 真实字面 ──────────────────────────────────
export const STEP7_BREADCRUMB_REAL = 'STEP 07 › AI智能文案生成' as const;
export const STEP7_H1_REAL = '文案生成' as const;
export const STEP7_SUBTITLE_PREFIX = '选择脚本类型和爆款元素，输入主题，AI将基于方法论生成' as const;
export const STEP7_SUBTITLE_HIGHLIGHT = '深度爆款文案' as const;
export const STEP7_SUBTITLE_SUFFIX = '，支持AI智能修改优化。' as const;
export const STEP7_LEFT_TITLE = '选择脚本类型' as const;
export const STEP7_LEFT_SEARCH_PLACEHOLDER = '搜索脚本...' as const;
export const STEP7_RIGHT_TITLE_PREFIX = '选择爆款元素' as const;
export const STEP7_FORM_TOPIC_LABEL = '文案主题' as const;
export const STEP7_CURRENT_SCRIPT_PREFIX = '当前脚本：' as const;
export const STEP7_CTA_GENERATE = '生成爆款文案' as const;
export const STEP7_OUTPUT_H3 = '生成结果' as const;
export const STEP7_OPTIMIZE_H3 = 'AI智能优化' as const;
export const STEP7_OPTIMIZE_PLACEHOLDER = '输入优化方向（可选），如：更有吸引力、增加互动感、更口语化...' as const;
export const STEP7_OPTIMIZE_BUTTON = 'AI优化文案' as const;
export const STEP7_FOOTER_CHANGE_TOPIC = '想换个选题继续生成文案？' as const;
export const STEP7_FOOTER_MY_TOPICS = '我的选题库' as const;
export const STEP7_FOOTER_HOT_TOPICS = '爆款选题' as const;
```

---

## 8 · 文件输出 list

| # | path | 操作 | 行数估 |
|:-:|---|:-:|:-:|
| 1 | `apps/web/src/lib/constants/step7.ts` | Edit 末尾追加 ~20 行 | +20 |
| 2 | `apps/web/src/components/step7/Step7ScriptTypeList.tsx` | new | ~60 |
| 3 | `apps/web/src/components/step7/Step7ElementCategoryGrid.tsx` | new | ~65 |
| 4 | `apps/web/src/components/step7/Step7OutputResultSection.tsx` | new | ~40 |
| 5 | `apps/web/src/components/step7/Step7AiOptimizeSection.tsx` | new | ~45 |
| 6 | `apps/web/src/pages/step/Step7.tsx` | rewrite(替换 361 行 · 含 SCRIPT_TYPES / ELEMENT_CATEGORIES / GENERATED_RESULT) | ~450 |

不动 · router.tsx · 旧常量 · 旧 3 组件

---

## 9 · 验收

1. typecheck 0 error
2. http://localhost:5173/step/7 可访问
3. innerText 50+ key grep
4. script type 切换 + element 多选 work

---

## 10 · Sonnet 工作流

1. Read SPEC.md
2. Read Step6VoiceoverScriptSection / PrivateDomainScenarioTabs / Step8AiOptimizeSection / Step5CategoryTabs / sub-card
3. Edit step7.ts 末尾追加
4. Write 4 sub-component
5. Write Step7.tsx 重写
6. typecheck PASS

---

## 11 · 红线

- ❌ 不动 router.tsx
- ❌ 不删旧 step7 常量
- ❌ §3 mock + §4 生成结果长文必须逐字 · 全角标点 + 中文双引号 "" + 【】 全保留
- ❌ emoji 保留 · ✨ 🔍 ⟳ 📋 ♡ $ 😨 ⚠ 🔥 💬 🤝 🎯 📈 🏛 😡 😯 🔒 🦋 ⏳ 👍 🚩 🎁
- ❌ 不允许 uppercase class
- ❌ 6 → 7 script type(加入 debate "搞辩论" 因为截图当前脚本是它)
- ❌ 默认 9 个 element 选中(SPEC §3 列出)
- ❌ 不启 dev server / 不截图

---

## 12 · 报告

```
DONE / BLOCKED
写了 X 个文件: ...
typecheck: PASS / FAIL
异常: ...
下一步建议 Opus 做的事: ...
```
