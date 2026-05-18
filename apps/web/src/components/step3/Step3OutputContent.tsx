import type { Step3OutputBlock } from '@/lib/constants/step3';

export interface VideoRefCard {
  title: string;
  description: string;
  keywords: string[];
}

export interface Step3Result {
  videoReferences: { cards: VideoRefCard[] };
  nickname: { recommendations: string[]; strategy: string; platformAdjust: string };
  avatar: {
    style: string;
    colorScheme: string;
    expression: string;
    references: string;
    mustHave: string;
    avoid: string;
    aiPrompt: string;
  };
  background: {
    style: string;
    layout: string;
    colorTone: string;
    copyContent: string;
    mustHave: string;
    platformSizes: { douyin: string; xiaohongshu: string; bilibili: string };
    aiPrompt: string;
  };
  bio: { formula: string; versions: string[] };
  strategy: {
    visualConsistency: string;
    firstImpression: string;
    conversionPath: string;
    platformPriority: string;
  };
}

interface Props {
  blockId: Step3OutputBlock['id'];
  result: Step3Result;
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-container p-3">
      <p className="text-xs font-label text-muted-foreground mb-1">{label}</p>
      <p className="text-body-sm text-on-surface">{value}</p>
    </div>
  );
}

function PromptCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
      <p className="text-xs font-label text-primary mb-1">{label}</p>
      <p className="text-body-sm text-on-surface font-mono break-all">{value}</p>
    </div>
  );
}

export function getBlockText(blockId: Step3OutputBlock['id'], result: Step3Result): string {
  switch (blockId) {
    case 'videoReferences':
      return result.videoReferences.cards
        .map((c, i) => `${i + 1}. ${c.title}\n${c.description}\n关键词：${c.keywords.join('、')}`)
        .join('\n\n');
    case 'nickname':
      return `备选昵称：${result.nickname.recommendations.join('、')}\n\n命名策略：${result.nickname.strategy}\n\n各平台调整：${result.nickname.platformAdjust}`;
    case 'avatar': {
      const a = result.avatar;
      return `风格：${a.style}\n配色：${a.colorScheme}\n表情：${a.expression}\n参考账号：${a.references}\n必含元素：${a.mustHave}\n禁忌：${a.avoid}\nAI Prompt：${a.aiPrompt}`;
    }
    case 'background': {
      const bg = result.background;
      const sizes = Object.entries(bg.platformSizes)
        .map(([k, v]) => `${k}：${v}`)
        .join('\n');
      return `风格：${bg.style}\n布局：${bg.layout}\n配色：${bg.colorTone}\n文案：${bg.copyContent}\n必含：${bg.mustHave}\n\n平台尺寸：\n${sizes}\n\nAI Prompt：${bg.aiPrompt}`;
    }
    case 'bio':
      return `简介公式：${result.bio.formula}\n\n${result.bio.versions.map((v, i) => `版本${i + 1}：${v}`).join('\n')}`;
    case 'strategy': {
      const s = result.strategy;
      return `视觉一致性：${s.visualConsistency}\n\n第一印象：${s.firstImpression}\n\n转化路径：${s.conversionPath}\n\n平台优先级：${s.platformPriority}`;
    }
  }
}

export default function Step3OutputContent({ blockId, result }: Props) {
  if (blockId === 'videoReferences') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {result.videoReferences.cards.map((card, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface-container p-4">
            <p className="font-label text-on-surface text-body-sm mb-2">{card.title}</p>
            <p className="text-xs text-muted-foreground mb-3">{card.description}</p>
            <div className="flex flex-wrap gap-1">
              {card.keywords.map((kw) => (
                <span
                  key={kw}
                  className="text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (blockId === 'nickname') {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {result.nickname.recommendations.map((name, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-3 py-1 text-body-sm"
            >
              <span className="text-primary/60 text-xs">#{i + 1}</span>
              {name}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoCard label="命名策略" value={result.nickname.strategy} />
          <InfoCard label="各平台调整建议" value={result.nickname.platformAdjust} />
        </div>
      </div>
    );
  }

  if (blockId === 'avatar') {
    const { style, colorScheme, expression, references, mustHave, avoid, aiPrompt } = result.avatar;
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoCard label="风格" value={style} />
          <InfoCard label="配色方案" value={colorScheme} />
          <InfoCard label="表情神态" value={expression} />
          <InfoCard label="参考账号" value={references} />
          <InfoCard label="必含元素" value={mustHave} />
          <InfoCard label="禁忌" value={avoid} />
        </div>
        <PromptCard label="AI 绘图 Prompt" value={aiPrompt} />
      </div>
    );
  }

  if (blockId === 'background') {
    const { style, layout, colorTone, copyContent, mustHave, platformSizes, aiPrompt } =
      result.background;
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoCard label="风格" value={style} />
          <InfoCard label="布局" value={layout} />
          <InfoCard label="配色调性" value={colorTone} />
          <InfoCard label="文案内容" value={copyContent} />
          <InfoCard label="必含元素" value={mustHave} />
        </div>
        <div className="rounded-lg border border-border bg-surface-container p-3">
          <p className="text-xs font-label text-muted-foreground mb-2">3 平台尺寸适配</p>
          <div className="space-y-1">
            <p className="text-body-sm text-on-surface">
              <span className="font-label">抖音：</span>
              {platformSizes.douyin}
            </p>
            <p className="text-body-sm text-on-surface">
              <span className="font-label">小红书：</span>
              {platformSizes.xiaohongshu}
            </p>
            <p className="text-body-sm text-on-surface">
              <span className="font-label">B站：</span>
              {platformSizes.bilibili}
            </p>
          </div>
        </div>
        <PromptCard label="AI 绘图 Prompt" value={aiPrompt} />
      </div>
    );
  }

  if (blockId === 'bio') {
    return (
      <div className="space-y-3">
        <PromptCard label="简介公式" value={result.bio.formula} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {result.bio.versions.map((version, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface-container p-3">
              <p className="text-xs font-label text-muted-foreground mb-1">版本 {i + 1}</p>
              <p className="text-body-sm text-on-surface">{version}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (blockId === 'strategy') {
    const { visualConsistency, firstImpression, conversionPath, platformPriority } =
      result.strategy;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoCard label="视觉一致性" value={visualConsistency} />
        <InfoCard label="第一印象设计" value={firstImpression} />
        <InfoCard label="转化路径" value={conversionPath} />
        <InfoCard label="平台优先级" value={platformPriority} />
      </div>
    );
  }

  return null;
}
