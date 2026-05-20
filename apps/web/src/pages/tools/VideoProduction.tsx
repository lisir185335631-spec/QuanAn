/**
 * VideoProduction.tsx — /video-production · PRD-25 US-006
 * AC-1: useMutation → trpc.videoProduction.generate · loading spinner
 * AC-2: 4 H3 sections from ProductionOutput fields (shotList/equipment/schedule)
 * AC-5: isFallback banner + retry
 * AC-6: onError toast
 * SHIELD: field names 1:1 from VideoAgent.ts production mode — no guessing
 */
import { useState } from 'react';
import { toast } from 'sonner';

import { trpc } from '@/lib/trpc';

// ── Inline types (no server import · per SHIELD pattern) ─────────────────────

interface ShotItem {
  scene?: string;
  duration?: string;
  action?: string;
  dialogue?: string;
  voiceover?: string;
  cameraAngle?: string;
  prop?: string;
  lighting?: string;
  transition?: string;
  sfx?: string;
  subtitle?: string;
  costume?: string;
  location?: string;
  index?: number;
  angle?: string;
  movement?: string;
  description?: string;
  bgm?: string;
  reference?: string;
  note?: string;
}

interface ProductionOutput {
  shotList?: ShotItem[];
  equipment?: string[];
  schedule?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SUBTITLE = '输入文案，AI 自动生成分镜脚本、拍摄方案、口播提词器和剪辑指导';

// ── Component ─────────────────────────────────────────────────────────────────

export default function VideoProduction() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ProductionOutput | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const generateMutation = trpc.videoProduction.generate.useMutation({
    onSuccess(data) {
      try {
        const parsed = JSON.parse(data.content) as ProductionOutput;
        setResult(parsed);
        setIsFallback(data.isFallback);
      } catch {
        toast.error('解析失败 · 请稍后再试');
      }
    },
    onError() {
      toast.error('生成失败 · 请稍后再试');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (text.length < 10) return;
    setResult(null);
    setIsFallback(false);
    generateMutation.mutate({ sourceCopy: text });
  }

  function handleRetry() {
    if (text.length < 10) return;
    setResult(null);
    setIsFallback(false);
    generateMutation.mutate({ sourceCopy: text });
  }

  return (
    <main className="flex-1 container py-8 space-y-8">
      {/* Header — AC-1 字面锁 */}
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">内容创作</span>
        <h1 className="mt-1 text-h1 font-display text-on-surface">短视频一键制作</h1>
        <p className="mt-2 text-body-md text-muted-foreground">{SUBTITLE}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="vp-source-copy" className="text-label-sm font-label text-on-surface">文案</label>
          <textarea
            id="vp-source-copy"
            placeholder="粘贴你的短视频文案（至少 10 个字），AI 将为你生成完整的制作方案..."
            value={text}
            onChange={e => setText(e.target.value)}
            rows={8}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-body-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />
        </div>
        <button
          type="submit"
          disabled={text.length < 10 || generateMutation.isPending}
          className="w-full rounded-md bg-primary text-primary-foreground py-2.5 text-label-md font-label disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          {generateMutation.isPending ? 'AI 生成制作方案中...' : '生成制作方案'}
        </button>
      </form>

      {/* Loading — AC-1 spinner */}
      {generateMutation.isPending && (
        <div
          className="flex flex-col items-center gap-3 py-8"
          data-testid="video-production-loading"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-body-md text-muted-foreground">AI 生成制作方案中...</p>
        </div>
      )}

      {/* isFallback banner — AC-5 */}
      {result && isFallback && (
        <div
          className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
          data-testid="video-production-fallback-banner"
        >
          <p className="text-body-sm text-muted-foreground">AI 暂未生成制作方案 · 显示备用模板</p>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-md border border-border px-3 py-1.5 text-label-sm font-label text-muted-foreground hover:bg-muted/50 transition-colors"
            data-testid="video-production-retry"
          >
            重试
          </button>
        </div>
      )}

      {/* Output — 4 H3 sections · AC-2 */}
      {result && (
        <div className="space-y-4" data-testid="video-production-output">

          {/* H3-1: 分镜脚本 — shotList */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h3 className="text-h3 font-display text-on-surface">分镜脚本</h3>
            {result.shotList && result.shotList.length > 0 ? (
              <div className="space-y-3" data-testid="vp-shot-list">
                {result.shotList.map((shot, i) => (
                  <div key={i} className="rounded-md bg-muted/30 p-3 space-y-1 text-body-sm">
                    <p className="font-medium text-on-surface">
                      {shot.index ? `镜头 ${shot.index}` : `镜头 ${i + 1}`}
                      {shot.scene ? ` · ${shot.scene}` : ''}
                    </p>
                    {shot.duration && <p className="text-muted-foreground">时长: {shot.duration}</p>}
                    {shot.angle && <p className="text-muted-foreground">景别: {shot.angle}</p>}
                    {!shot.angle && shot.cameraAngle && (
                      <p className="text-muted-foreground">机位: {shot.cameraAngle}</p>
                    )}
                    {shot.movement && <p className="text-muted-foreground">运镜: {shot.movement}</p>}
                    {shot.action && <p className="text-muted-foreground">动作: {shot.action}</p>}
                    {shot.description && <p className="text-muted-foreground">画面: {shot.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-body-md text-muted-foreground italic">暂无分镜数据</p>
            )}
          </div>

          {/* H3-2: 拍摄方案 — equipment + schedule */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h3 className="text-h3 font-display text-on-surface">拍摄方案</h3>
            {result.equipment && result.equipment.length > 0 ? (
              <div data-testid="vp-equipment">
                <p className="text-label-sm font-label text-muted-foreground mb-2">设备清单</p>
                <div className="flex flex-wrap gap-2">
                  {result.equipment.map((eq, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-primary/10 px-2.5 py-0.5 text-body-xs font-medium text-primary"
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-body-md text-muted-foreground italic">暂无设备信息</p>
            )}
            {result.schedule && (
              <div data-testid="vp-schedule">
                <p className="text-label-sm font-label text-muted-foreground mb-1">拍摄时间安排</p>
                <p className="text-body-md text-on-surface">{result.schedule}</p>
              </div>
            )}
          </div>

          {/* H3-3: 口播提词器 — dialogue + voiceover from shotList */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h3 className="text-h3 font-display text-on-surface">口播提词器</h3>
            {result.shotList && result.shotList.some(s => s.dialogue || s.voiceover) ? (
              <div className="space-y-3" data-testid="vp-teleprompter">
                {result.shotList
                  .filter(s => (s.dialogue && s.dialogue !== '无') || (s.voiceover && s.voiceover !== '无'))
                  .map((shot, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-label-sm font-label text-muted-foreground">
                        {shot.index ? `镜头 ${shot.index}` : `镜头 ${i + 1}`}
                        {shot.scene ? ` · ${shot.scene}` : ''}
                      </p>
                      {shot.dialogue && shot.dialogue !== '无' && (
                        <p className="text-body-md text-on-surface leading-relaxed">{shot.dialogue}</p>
                      )}
                      {shot.voiceover && shot.voiceover !== '无' && (
                        <p className="text-body-sm text-muted-foreground italic">旁白: {shot.voiceover}</p>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-body-md text-muted-foreground italic">暂无台词数据</p>
            )}
          </div>

          {/* H3-4: 剪辑指导 — transition + sfx + bgm from shotList */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h3 className="text-h3 font-display text-on-surface">剪辑指导</h3>
            {result.shotList && result.shotList.some(s => s.transition || s.sfx || s.bgm) ? (
              <div className="space-y-2" data-testid="vp-edit-guide">
                {result.shotList
                  .filter(
                    s =>
                      (s.transition && s.transition !== '无') ||
                      (s.sfx && s.sfx !== '无') ||
                      (s.bgm && s.bgm !== '无'),
                  )
                  .map((shot, i) => (
                    <div key={i} className="rounded-md bg-muted/30 p-3 text-body-sm space-y-1">
                      <p className="font-medium text-on-surface">
                        {shot.index ? `镜头 ${shot.index}` : `镜头 ${i + 1}`}
                      </p>
                      {shot.transition && shot.transition !== '无' && (
                        <p className="text-muted-foreground">转场: {shot.transition}</p>
                      )}
                      {shot.sfx && shot.sfx !== '无' && (
                        <p className="text-muted-foreground">音效: {shot.sfx}</p>
                      )}
                      {shot.bgm && shot.bgm !== '无' && (
                        <p className="text-muted-foreground">BGM: {shot.bgm}</p>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-body-md text-muted-foreground italic">暂无剪辑指导数据</p>
            )}
          </div>

        </div>
      )}
    </main>
  );
}
