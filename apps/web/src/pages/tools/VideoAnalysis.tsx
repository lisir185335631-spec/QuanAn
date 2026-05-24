/**
 * VideoAnalysis.tsx — /video-analysis · 爆款文案解析
 * 完全重写 · 1:1 复刻 aiipznt sally /video-analysis
 * form + 5 折叠解析 section + 一键仿写长文
 */
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VideoAnalysisElementsSection } from './components/VideoAnalysisElementsSection';
import { VideoAnalysisRewriteSection } from './components/VideoAnalysisRewriteSection';
import { VideoAnalysisStrategySection } from './components/VideoAnalysisStrategySection';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VideoAnalysisResult {
  topicStrategy: {
    category: string;
    angle: string;
    targetAudience: string;
    evaluation: string;
  };
  hookAnalysis: {
    score: number;
    maxScore: number;
    type: string;
    technique: string;
    evaluation: string;
  };
  narrativeStructure: {
    label: string;
    timeline: string[];
    evaluation: string;
  };
  popularElements: Array<{
    name: string;
    main: string;
    note: string;
  }>;
  popularFormula: {
    title: string;
    chips: string[];
  };
  rewriteResult: {
    title: string;
    intro: string;
    body: string[];
    twist: string;
    ending: string;
    hashtags: string;
  };
}

export interface VideoAnalysisFormData {
  videoTitle: string;
  content: string;
  rewriteTopic: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_FORM: VideoAnalysisFormData = {
  videoTitle: '',
  content: '这是测试文案，用于测试 AI 解析功能。我是一个内容创作者，希望了解爆款的奥秘。',
  rewriteTopic: '',
};

// ── Mock data ─────────────────────────────────────────────────────────────────

function generateMockResult(): VideoAnalysisResult {
  return {
    topicStrategy: {
      category: '测试与探索',
      angle: 'AI功能测试与爆款奥秘探寻',
      targetAudience: 'AI开发者、内容创作者、对爆款机制感兴趣的用户',
      evaluation: '这个文案本身是测试性质的，所以从选题策略上来说，它不是一个常规的爆款选题。但如果把它看作一个创作者在探索爆款的开场白，那它的目标就是引起共鸣，表达对爆款的求知欲。对于一个真实视频来说，这样的选题缺乏具体内容支撑，很难成为爆款。',
    },
    hookAnalysis: {
      score: 20,
      maxScore: 100,
      type: '提问型（潜在）',
      technique: '虽然文案是测试，但"希望了解爆款的奥秘"这句话本身就带有提问和求知欲，可以看作一种潜在的提问型钩子，吸引有相同困惑的人。',
      evaluation: '对于测试文案来说，有效性不适用。如果作为真实视频的开头，仅仅表达求知欲，缺乏具体内容或反差，吸引力会比较弱，很难在黄金3秒内抓住人。',
    },
    narrativeStructure: {
      label: '声明式',
      timeline: [
        '声明：这是测试文案',
        '目的：测试AI解析功能',
        '身份：内容创作者',
        '诉求：希望了解爆款奥秘',
      ],
      evaluation: '平缓，没有明显的起伏或转折，更像一个简单的陈述。',
    },
    popularElements: [
      {
        name: '身份认同',
        main: '"我是一个内容创作者"这句话能让一部分同类用户产生共鸣。',
        note: '在真实视频中，如果能进一步展现创作者的困境或努力，会更有效。目前仅是声明，效果有限。',
      },
      {
        name: '好奇心',
        main: '"希望了解爆款的奥秘"直接点出了很多创作者的痛点和好奇心。',
        note: '这个点是好的，但需要后续内容来承接和满足这份好奇心，否则只是提出问题，没有解答，难以形成爆款。',
      },
    ],
    popularFormula: {
      title: '（测试文案无爆款公式）',
      chips: [
        '真实性（作为测试文案）',
        '身份认同（内容创作者）',
        '求知欲（爆款奥秘）',
      ],
    },
    rewriteResult: {
      title: '你刷到过那些"一眼假"的视频吗？',
      intro: '2025年，我朋友在网上刷到一个视频，博主信誓旦旦说，只要每天对着镜子说三遍"我会暴富"，七天内就能中彩票。当时我俩都笑了。',
      body: [
        '结果不到一周，这个视频播放量破了千万。评论区里，有人说自己真的捡到钱了，有人说工作突然顺利，还有人分享自己买彩票中了小奖。我朋友开始有点动摇，问我，这玩意儿真有魔力？',
        '我当时就想，这怎么可能？但那些评论，那些数字，又实实在在摆在那里。我开始琢磨，为什么这种"一眼假"的东西，反而能火到出圈？它到底戳中了多少人的心？',
        '我翻了上百个类似视频，从"喝水能瘦十斤"到"冥想能吸引好运"，发现它们都有一个共同点：门槛极低，回报极高。你不需要投入金钱，不需要付出巨大努力，只需要动动嘴皮子，或者稍微改变一个习惯，就能得到你梦寐以求的结果。',
        '这就像一个心理安慰剂。在快节奏的生活里，我们每个人都渴望捷径。渴望不劳而获，渴望一夜暴富。哪怕理智告诉我们这是假的，但内心深处，总有一丝丝微弱的期待。',
      ],
      twist: '这些视频，其实不是在卖方法，而是在卖一种情绪价值。它们贩卖的是希望，是幻想，是对美好未来的无条件憧憬。它让你在疲惫的时候，能找到一个短暂的出口，一个可以寄托心愿的虚幻空间。',
      ending: '所以，当你下次再刷到这种视频，不妨想想，它是不是在给你提供一个情绪上的"甜点"？它可能没法改变你的现实，但它能让你在某个瞬间，感受到一点点被点燃的希望。这种希望，对你来说，值不值得？',
      hashtags: '#短视频爆款 #流量密码 #情绪价值 #心理学 #内容创作 #人性洞察 #为什么会火 #社交媒体 #自我安慰 #生活哲学',
    },
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function VideoAnalysis() {
  const [videoTitle, setVideoTitle] = useState(DEFAULT_FORM.videoTitle);
  const [content, setContent] = useState(DEFAULT_FORM.content);
  const [rewriteTopic, setRewriteTopic] = useState(DEFAULT_FORM.rewriteTopic);

  const generated = generateMockResult();

  function handleAnalyze() {
    toast.success('已开始深度解析');
  }

  function handleRewriteGenerate() {
    toast.success('已生成仿写文案');
  }

  function handleRewriteCopy() {
    const r = generated.rewriteResult;
    const text = [
      '• 标题', r.title, '', '• 开头', r.intro, '', '• 正文', ...r.body,
      '', '• 转折/升华', r.twist, '', '• 结尾', r.ending, '', '• 话题标签', r.hashtags,
    ].join('\n');
    navigator.clipboard.writeText(text).then(() => toast.success('已复制仿写文案'));
  }

  function handleFeedbackUp() {
    toast.success('感谢反馈!');
  }

  function handleFeedbackDown() {
    toast.info('我们会持续改进');
  }

  return (
    <main className="flex-1 container py-8 space-y-6 max-w-6xl">
      <p className="text-xs font-semibold text-primary tracking-wide">TOOL › 文案解析</p>

      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
          📹 爆款文案解析
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          粘贴爆款视频的完整文案/口播稿，AI将
          <span className="text-primary font-semibold mx-1">深度拆解</span>
          爆款密码，支持
          <span className="text-primary font-semibold mx-1">一键仿写</span>
        </p>
      </header>

      {/* 使用方法 highlight */}
      <div className="border border-primary/30 bg-primary/5 rounded-lg p-4">
        <p className="text-sm text-on-surface/85 leading-relaxed">
          <span className="text-primary font-semibold">使用方法：</span>
          打开抖音/小红书/快手等APP → 找到爆款视频 → 复制视频的完整口播文案/文字内容 → 粘贴到下方输入框 → 点击「开始深度解析」
        </p>
      </div>

      {/* form */}
      <div className="bg-card/30 border border-border/40 rounded-lg p-5 space-y-4">
        <Input
          value={videoTitle}
          onChange={(e) => setVideoTitle(e.target.value)}
          placeholder="视频标题（选填）"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-[300px] rounded-md border border-border bg-input px-3 py-2 text-sm text-on-surface resize-y"
        />
        <div className="flex justify-end">
          <Button
            onClick={handleAnalyze}
            disabled={!content.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            📹 开始深度解析
          </Button>
        </div>
      </div>

      {/* 解析结果 · 选题策略 + 钩子 + 叙事 */}
      <VideoAnalysisStrategySection
        topicStrategy={generated.topicStrategy}
        hookAnalysis={generated.hookAnalysis}
        narrativeStructure={generated.narrativeStructure}
      />

      {/* 爆款元素 + 公式 */}
      <VideoAnalysisElementsSection
        elements={generated.popularElements}
        formula={generated.popularFormula}
      />

      {/* 一键仿写 */}
      <VideoAnalysisRewriteSection
        rewriteTopic={rewriteTopic}
        onTopicChange={setRewriteTopic}
        onGenerate={handleRewriteGenerate}
        result={generated.rewriteResult}
        onCopy={handleRewriteCopy}
      />

      {/* footer feedback */}
      <div className="flex items-center gap-3 pt-4 border-t border-border/30">
        <p className="text-xs text-muted-foreground">有帮助吗？</p>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFeedbackUp}
          aria-label="有帮助"
        >
          👍
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFeedbackDown}
          aria-label="无帮助"
        >
          👎
        </Button>
      </div>
    </main>
  );
}
