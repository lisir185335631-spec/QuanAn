/**
 * AiVideo.tsx — /ai-video STORYBOARD 工具页 · 1:1 sally zhao 复刻
 * form + empty + result 三态 · mock-first 模式 · 0 backend
 * 2026-05-25
 */
import { useState } from 'react';

import { Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { AdviceCard } from '@/components/ai-video/AdviceCard';
import { EmptyPlaceholderCard } from '@/components/ai-video/EmptyPlaceholderCard';
import { PlatformCard } from '@/components/ai-video/PlatformCard';
import { ResultTitleCard } from '@/components/ai-video/ResultTitleCard';
import { ShotCard } from '@/components/ai-video/ShotCard';
import { StoryboardChip } from '@/components/ai-video/StoryboardChip';
import { TimelineBar } from '@/components/ai-video/TimelineBar';
import { VideoTypeCard } from '@/components/ai-video/VideoTypeCard';
import {
  AI_VIDEO_ADVICE,
  AI_VIDEO_CTA_TEXT,
  AI_VIDEO_DEFAULT_DEMO_SCRIPT,
  AI_VIDEO_LABEL_PLATFORM,
  AI_VIDEO_LABEL_TEXT,
  AI_VIDEO_LABEL_TYPE,
  AI_VIDEO_MOCK_SHOTS,
  AI_VIDEO_PLATFORMS,
  AI_VIDEO_RESTART_TEXT,
  AI_VIDEO_RESULT_SHOT_COUNT,
  AI_VIDEO_RESULT_TITLE,
  AI_VIDEO_RESULT_TOTAL_DURATION,
  AI_VIDEO_TIMELINE_SEGMENTS,
} from '@/lib/constants/ai-video';
import { VIDEO_TYPES } from '@/lib/constants/video-types';

export default function AiVideo() {
  const [text, setText] = useState(AI_VIDEO_DEFAULT_DEMO_SCRIPT);
  const [platform, setPlatform] = useState<string>('douyin');
  const [videoType, setVideoType] = useState<string>('monologue');
  const [isResultShown, setIsResultShown] = useState(false);

  const handleGenerate = () => setIsResultShown(true);
  const handleRestart = () => setIsResultShown(false);

  return (
    <main className="flex-1 container py-8 max-w-5xl mx-auto space-y-6">
      <StoryboardChip />

      {/* Form · 输入文案内容 */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <label className="block text-base font-medium text-on-surface" htmlFor="ai-video-text">
          {AI_VIDEO_LABEL_TEXT}
        </label>
        <textarea
          id="ai-video-text"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 5000))}
          maxLength={5000}
          rows={12}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y text-sm"
          data-testid="ai-video-textarea"
        />
        <div className="flex justify-end text-sm text-muted-foreground">
          <span data-testid="ai-video-char-count">{text.length}/5000</span>
        </div>
      </div>

      {/* Form · 发布平台 */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label className="block text-base font-medium text-on-surface">{AI_VIDEO_LABEL_PLATFORM}</label>
        <div className="grid grid-cols-3 gap-4" data-testid="platform-grid">
          {AI_VIDEO_PLATFORMS.map((p) => (
            <PlatformCard
              key={p.key}
              platform={p}
              selected={p.key === platform}
              onClick={() => setPlatform(p.key)}
            />
          ))}
        </div>
      </div>

      {/* Form · 视频类型 */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label className="block text-base font-medium text-on-surface">{AI_VIDEO_LABEL_TYPE}</label>
        <div className="grid grid-cols-2 gap-3" data-testid="video-type-grid">
          {VIDEO_TYPES.map((vt) => (
            <VideoTypeCard
              key={vt.key}
              type={vt}
              selected={vt.key === videoType}
              onClick={() => setVideoType(vt.key)}
            />
          ))}
        </div>
      </div>

      {/* 主 CTA */}
      <button
        type="button"
        onClick={handleGenerate}
        data-testid="ai-video-cta"
        className="w-full py-4 rounded-xl bg-primary text-on-primary font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
      >
        <Sparkles className="w-5 h-5" />
        {AI_VIDEO_CTA_TEXT}
      </button>

      {/* Empty 态 · isResultShown=false 时显示 */}
      {!isResultShown && <EmptyPlaceholderCard />}

      {/* Result 态 · isResultShown=true 时显示 */}
      {isResultShown && (
        <div className="space-y-6">
          {/* 清空记录按钮 */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleRestart}
              data-testid="ai-video-restart"
              className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-on-surface transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {AI_VIDEO_RESTART_TEXT}
            </button>
          </div>

          {/* 标题 card */}
          <ResultTitleCard
            title={AI_VIDEO_RESULT_TITLE}
            duration={AI_VIDEO_RESULT_TOTAL_DURATION}
            shotCount={AI_VIDEO_RESULT_SHOT_COUNT}
            onCopy={() => toast.success('已复制全部')}
            onExport={() => toast.info('CSV 导出 · 即将上线')}
          />

          {/* 时间轴 bar */}
          <TimelineBar segments={AI_VIDEO_TIMELINE_SEGMENTS} />

          {/* 3 段建议 */}
          <div className="flex flex-col gap-3">
            {AI_VIDEO_ADVICE.map((a) => (
              <AdviceCard key={a.id} advice={a} />
            ))}
          </div>

          {/* 10 SHOT cards */}
          <div className="flex flex-col gap-4">
            {AI_VIDEO_MOCK_SHOTS.map((shot) => (
              <ShotCard key={shot.num} shot={shot} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
