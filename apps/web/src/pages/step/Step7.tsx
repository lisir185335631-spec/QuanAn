// PRD-29.15 · Step7 文案生成 — 完全重写
// 2 列 layout: 左 script types + 右 elements + 长文输出 + AI 优化 + footer
import { useState } from 'react';
import { toast } from 'sonner';

import { Step7AiOptimizeSection } from '@/components/step7/Step7AiOptimizeSection';
import { Step7ElementCategoryGrid } from '@/components/step7/Step7ElementCategoryGrid';
import { Step7OutputResultSection } from '@/components/step7/Step7OutputResultSection';
import { Step7ScriptTypeList } from '@/components/step7/Step7ScriptTypeList';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScriptType {
  id: string;
  name: string;
  desc: string;
}

interface ElementItem {
  id: string;
  label: string;
  icon: string;
}

interface ElementCategory {
  id: string;
  name: string;
  elements: ElementItem[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SCRIPT_TYPES: ScriptType[] = [
  { id: 'opinion', name: '聊观点',   desc: '表达个人观点，引发共鸣，适合知识分享类账号' },
  { id: 'process', name: '晒过程',   desc: '展示操作过程，平台超大流量体，适合教程类内容' },
  { id: 'teach',   name: '教知识',   desc: '教学类内容，传递价值，适合专业领域分享' },
  { id: 'story',   name: '讲故事',   desc: '故事型脚本，塑造人设，适合个人品牌打造' },
  { id: 'joke',    name: '尬段子',   desc: '搞笑类内容，娱乐性强，适合泛娱乐账号' },
  { id: 'product', name: '说产品',   desc: '以变现为目标的产品脚本，适合带货和商业推广' },
  { id: 'debate',  name: '搞辩论',   desc: '正反观点对抗，引发讨论和互动' },
];

const ELEMENT_CATEGORIES: ElementCategory[] = [
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
      { id: 'scarcity',  label: '稀缺',     icon: '⏳' },
      { id: 'social',    label: '社会证明', icon: '👍' },
      { id: 'authority', label: '权威',     icon: '🚩' },
      { id: 'benefit',   label: '利益',     icon: '🎁' },
    ],
  },
];

const DEFAULT_FORM = {
  selectedScriptTypeId: 'debate',
  selectedElementIds: [
    'greed', 'fear', 'curiosity', 'contrast', 'worst',
    'leverage', 'resonance', 'empathy', 'leverage_small',
  ],
  topic: '为什么有的人赚钱那么轻松',
  optimizeGoal: '',
};

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Step7() {
  const [selectedScriptTypeId, setSelectedScriptTypeId] = useState(DEFAULT_FORM.selectedScriptTypeId);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>(DEFAULT_FORM.selectedElementIds);
  const [topic, setTopic] = useState(DEFAULT_FORM.topic);
  const [optimizeGoal, setOptimizeGoal] = useState('');

  const currentScript = SCRIPT_TYPES.find((t) => t.id === selectedScriptTypeId);

  function handleToggleElement(id: string) {
    setSelectedElementIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleGenerate() {
    toast.success('已生成爆款文案');
  }

  function handleCopyResult() {
    navigator.clipboard.writeText(GENERATED_RESULT).then(
      () => toast.success('已复制文案'),
      () => toast.error('复制失败，请手动选取'),
    );
  }

  function handleOptimize() {
    toast.success('已 AI 优化文案');
  }

  function handleChangeTopic() {
    toast.info('跳转到爆款选题库');
  }

  function handleMyTopics() {
    toast.info('打开我的选题库');
  }

  function handleHotTopics() {
    toast.info('跳转到爆款选题');
  }

  return (
    <main className="flex-1 container py-8 space-y-6 max-w-6xl">
      {/* Breadcrumb */}
      <p className="text-xs font-semibold text-primary tracking-wide">STEP 07 › AI智能文案生成</p>

      {/* Header */}
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
        {/* 左列 · 脚本类型 */}
        <div className="bg-card/30 border border-border/40 rounded-lg p-5">
          <Step7ScriptTypeList
            types={SCRIPT_TYPES}
            selectedId={selectedScriptTypeId}
            onSelect={setSelectedScriptTypeId}
          />
        </div>

        {/* 右列 · 元素 + form + CTA */}
        <div className="space-y-5">
          {/* 爆款元素多选 */}
          <div className="bg-card/30 border border-border/40 rounded-lg p-5">
            <Step7ElementCategoryGrid
              categories={ELEMENT_CATEGORIES}
              selectedIds={selectedElementIds}
              onToggle={handleToggleElement}
            />
          </div>

          {/* 文案主题 + 当前脚本 + 生成按钮 */}
          <div className="bg-card/30 border border-border/40 rounded-lg p-5 space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface">
                文案主题 <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full min-h-[80px] rounded-md border border-border bg-input px-3 py-2 text-sm text-on-surface resize-y placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              />
            </div>

            {currentScript && (
              <p className="text-xs text-muted-foreground">
                当前脚本：<span className="text-primary font-semibold">{currentScript.name}</span> -{' '}
                {currentScript.desc}
              </p>
            )}

            <Button
              type="button"
              onClick={handleGenerate}
              disabled={!topic.trim()}
              className="w-full bg-primary hover:bg-primary/90"
            >
              ✨ 生成爆款文案
            </Button>
          </div>
        </div>
      </div>

      {/* 生成结果(全宽) */}
      <Step7OutputResultSection content={GENERATED_RESULT} onCopy={handleCopyResult} />

      {/* AI 优化 */}
      <Step7AiOptimizeSection
        value={optimizeGoal}
        onChange={setOptimizeGoal}
        onOptimize={handleOptimize}
      />

      {/* Footer */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/30">
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors"
          onClick={handleChangeTopic}
        >
          <span className="text-rose-400">♡</span> 想换个选题继续生成文案？
        </button>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="text-sm text-primary flex items-center gap-1.5 hover:text-primary/80 transition-colors"
            onClick={handleMyTopics}
          >
            <span className="text-rose-400">♡</span> 我的选题库
          </button>
          <button
            type="button"
            className="text-sm text-primary flex items-center gap-1.5 hover:text-primary/80 transition-colors"
            onClick={handleHotTopics}
          >
            ✨ 爆款选题
          </button>
        </div>
      </div>
    </main>
  );
}
