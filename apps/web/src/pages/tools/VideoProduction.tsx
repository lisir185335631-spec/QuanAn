/**
 * VideoProduction.tsx — /video-production · PRD-23 US-006
 * Stub: local state form + 4 H3 output sections (no tRPC)
 * AC-1: H1 '短视频一键制作' + subtitle 字面锁
 * AC-2: textarea '文案' placeholder 字面锁 · ≥ 10 字
 * AC-3: CTA '生成制作方案' disabled if text.length < 10
 * AC-4: stub 4 H3 区块 · 分镜脚本/拍摄方案/口播提词器/剪辑指导
 */
import { useState } from 'react';

const SUBTITLE = '输入文案，AI 自动生成分镜脚本、拍摄方案、口播提词器和剪辑指导';

const OUTPUT_SECTIONS = [
  { h3: '分镜脚本', desc: '同 step/6' },
  { h3: '拍摄方案', desc: '设备 / 灯光 / 服装' },
  { h3: '口播提词器', desc: '断句 / 重音' },
  { h3: '剪辑指导', desc: '卡点 / 特效 / 字幕样式' },
] as const;

export default function VideoProduction() {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (text.length < 10) return;
    setSubmitted(true);
  }

  return (
    <main className="flex-1 container py-8 space-y-8">
      {/* Header — AC-1 */}
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">内容创作</span>
        <h1 className="mt-1 text-h1 font-display text-on-surface">短视频一键制作</h1>
        <p className="mt-2 text-body-md text-muted-foreground">{SUBTITLE}</p>
      </div>

      {/* Form — AC-2/3 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-label-sm font-label text-on-surface">文案</label>
          <textarea
            placeholder="粘贴你的短视频文案（至少 10 个字），AI 将为你生成完整的制作方案..."
            value={text}
            onChange={e => setText(e.target.value)}
            rows={8}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-body-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />
        </div>
        <button
          type="submit"
          disabled={text.length < 10}
          className="w-full rounded-md bg-primary text-primary-foreground py-2.5 text-label-md font-label disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          生成制作方案
        </button>
      </form>

      {/* Stub output — AC-4 */}
      {submitted && (
        <div className="space-y-4" data-testid="video-production-output">
          {OUTPUT_SECTIONS.map(({ h3, desc }) => (
            <div key={h3} className="rounded-lg border border-border p-4 space-y-2">
              <h3 className="text-h3 font-display text-on-surface">{h3}</h3>
              {desc && <p className="text-body-sm text-muted-foreground">{desc}</p>}
              <p className="text-body-md text-muted-foreground italic">AI 生成中…</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
