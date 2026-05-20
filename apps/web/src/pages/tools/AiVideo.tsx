/**
 * AiVideo.tsx — /ai-video 工具页 · PRD-22 US-004
 * 完整 inline 重构: H1 STORYBOARD(Orbitron) + 5 平台 radio + 6 视频类型 + textarea 5000 + 分镜表 13 列
 * H1 字面锁: "STORYBOARD"
 * 副标题锁: "专业分镜表生成器 · 文案一键转拍摄方案"
 * 模块标题 H3: "专业分镜表生成器"
 * D-221 · 13 列表头字面锁 (header→key 1:1 对应, 防 PRD-6 US-004 教训)
 * stub 6-8 行假数据用于视觉密度对齐 · LLM 集成留 PRD-23+
 */

import { useState } from 'react';

import { FadeInWrapper } from '@/components/FadeInWrapper';
import { PlatformInlineRadio } from '@/components/inline-pickers';
import { VIDEO_TYPES } from '@/lib/constants/video-types';
import { cn } from '@/lib/utils';

// ── D-221 · 13 列分镜表定义 (header→key 1:1 对应) ────────────────────────────

interface StoryboardColumn {
  header: string;
  key: keyof StoryboardRow;
}

interface StoryboardRow {
  shotNumber: string;
  framing: string;
  angle: string;
  movement: string;
  duration: string;
  visualDesc: string;
  dialogue: string;
  subtitle: string;
  bgm: string;
  sfx: string;
  emotion: string;
  shootingNotes: string;
  editingNotes: string;
}

const STORYBOARD_COLUMNS: StoryboardColumn[] = [
  { header: '镜号',    key: 'shotNumber'    },
  { header: '景别',    key: 'framing'       },
  { header: '角度',    key: 'angle'         },
  { header: '运镜',    key: 'movement'      },
  { header: '时长',    key: 'duration'      },
  { header: '画面描述', key: 'visualDesc'   },
  { header: '台词/解说', key: 'dialogue'   },
  { header: '字幕',    key: 'subtitle'      },
  { header: '背景音乐', key: 'bgm'         },
  { header: '音效',    key: 'sfx'           },
  { header: '情绪',    key: 'emotion'       },
  { header: '拍摄要点', key: 'shootingNotes' },
  { header: '剪辑建议', key: 'editingNotes'  },
];

// Stub data (6 rows for visual density) · replaced by real LLM output in PRD-23+
const STUB_ROWS: StoryboardRow[] = [
  { shotNumber: '01', framing: '全景',   angle: '平视', movement: '固定',     duration: '3s',  visualDesc: '博主出现在镜头前，背景整洁',      dialogue: '大家好，今天给大家带来...',  subtitle: '大家好，今天给大家带来...', bgm: '轻快背景乐',   sfx: '环境音',   emotion: '活力',   shootingNotes: '注意背景简洁',  editingNotes: '配合开场音乐剪辑' },
  { shotNumber: '02', framing: '中景',   angle: '微俯', movement: '推进',     duration: '5s',  visualDesc: '主角走向产品，眼神坚定',           dialogue: '这款产品让我...',           subtitle: '这款产品让我...',          bgm: '渐强背景乐',   sfx: '脚步声',   emotion: '期待',   shootingNotes: '保持平稳推进',  editingNotes: '慢推配合情绪渐入' },
  { shotNumber: '03', framing: '近景',   angle: '平视', movement: '固定',     duration: '8s',  visualDesc: '产品特写，展示核心功能',           dialogue: '你们看这里...',             subtitle: '你们看这里...',            bgm: '高潮背景乐',   sfx: '点击声',   emotion: '惊喜',   shootingNotes: '对焦清晰',      editingNotes: '配合文字特效' },
  { shotNumber: '04', framing: '特写',   angle: '仰视', movement: '环绕',     duration: '4s',  visualDesc: '细节展示，质感突出',              dialogue: '（无对话）',               subtitle: '',                        bgm: '高潮背景乐',   sfx: '无',       emotion: '震撼',   shootingNotes: '微距镜头',      editingNotes: '慢动作处理' },
  { shotNumber: '05', framing: '中景',   angle: '平视', movement: '摇镜',     duration: '6s',  visualDesc: '博主展示使用效果',               dialogue: '实际用起来感觉...',         subtitle: '实际用起来感觉...',        bgm: '温和背景乐',   sfx: '环境音',   emotion: '满足',   shootingNotes: '稳定器拍摄',    editingNotes: '自然剪辑' },
  { shotNumber: '06', framing: '全景',   angle: '平视', movement: '固定',     duration: '5s',  visualDesc: '博主面对镜头，总结推荐',          dialogue: '总结来说，强烈推荐...',     subtitle: '总结来说，强烈推荐...',   bgm: '收尾背景乐',   sfx: '无',       emotion: '真诚',   shootingNotes: '注意结尾表情',  editingNotes: '渐出淡化' },
  { shotNumber: '07', framing: '近景',   angle: '平视', movement: '固定',     duration: '3s',  visualDesc: '点赞关注引导画面',               dialogue: '如果觉得有用点个赞...',     subtitle: '点赞关注！',              bgm: '轻快结尾乐',   sfx: '提示音',   emotion: '友好',   shootingNotes: '手势配合',      editingNotes: '配合弹出引导动画' },
  { shotNumber: '08', framing: '全景',   angle: '俯视', movement: '拉远',     duration: '2s',  visualDesc: '结尾定格画面',                   dialogue: '下次见！',                  subtitle: '下次见！',                bgm: '收尾',         sfx: '无',       emotion: '愉快',   shootingNotes: '留出片尾空间',  editingNotes: 'Logo 叠加' },
];

// ── Page component ────────────────────────────────────────────────────────────

export default function AiVideo() {
  const [platform, setPlatform] = useState<string | null>('douyin');
  const [videoType, setVideoType] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDisabled = text.trim().length === 0;

  async function handleGenerate() {
    if (isDisabled || isSubmitting) return;
    setIsSubmitting(true);
    // Stub: show table immediately · real LLM call leaves for PRD-23+
    await new Promise((resolve) => setTimeout(resolve, 800));
    setShowResult(true);
    setIsSubmitting(false);
  }

  function handleExportCsv() {
    // Stub: real export integration leaves for PRD-23+
    const headers = STORYBOARD_COLUMNS.map((c) => c.header).join(',');
    const rows = STUB_ROWS.map((row) =>
      STORYBOARD_COLUMNS.map((c) => `"${row[c.key]}"`).join(',')
    ).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'storyboard.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="flex-1 container py-8 space-y-8">
      {/* AC-1: PageHeader + H1 STORYBOARD (Orbitron uppercase) */}
      <FadeInWrapper delay={0} from="up">
        <div>
          <span className="text-label-sm font-label text-primary uppercase tracking-wide">
            内容创作
          </span>
          <h1 className="mt-1 text-h1 font-display uppercase tracking-widest text-on-surface">
            STORYBOARD
          </h1>
          <p className="mt-2 text-body-md text-muted-foreground">
            专业分镜表生成器 · 文案一键转拍摄方案
          </p>
        </div>
      </FadeInWrapper>

      {/* AC-3(2): textarea 文案内容 */}
      <FadeInWrapper delay={0.05} from="up">
        <div className="space-y-2">
          <h3 className="text-h3 font-display text-on-surface mb-2">专业分镜表生成器</h3>
          <label htmlFor="ai-video-text" className="block text-body-md font-medium text-on-surface">
            文案内容
          </label>
          <textarea
            id="ai-video-text"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 5000))}
            maxLength={5000}
            placeholder="粘贴你的短视频文案，AI 将自动生成专业分镜表，可直接交给摄影师执行..."
            rows={6}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
            data-testid="ai-video-textarea"
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              data-testid="ai-video-example"
              onClick={() => setText('大家好！今天给大家分享一款让我爱不释手的好物。它的设计非常精致，功能也超级实用。我已经用了一个月了，真的超级好用！强烈推荐给大家，点赞收藏不迷路～')}
              className="text-body-sm text-primary hover:underline transition-all duration-200"
            >
              示例文案
            </button>
            <span className="text-body-sm text-muted-foreground" data-testid="ai-video-char-count">
              {text.length}/5000
            </span>
          </div>
        </div>
      </FadeInWrapper>

      {/* AC-3(3): 5 平台 radio */}
      <FadeInWrapper delay={0.1} from="up">
        <div className="space-y-2">
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label className="block text-body-md font-medium text-on-surface">目标平台</label>
          <PlatformInlineRadio value={platform} onChange={setPlatform} size="lg" />
        </div>
      </FadeInWrapper>

      {/* AC-3(4): 6 视频类型 button */}
      <FadeInWrapper delay={0.15} from="up">
        <div className="space-y-2">
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label className="block text-body-md font-medium text-on-surface">视频类型</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3" data-testid="video-type-grid">
            {VIDEO_TYPES.map((vt) => {
              const isSelected = vt.key === videoType;
              return (
                <button
                  key={vt.key}
                  type="button"
                  onClick={() => setVideoType(isSelected ? null : vt.key)}
                  data-testid={`video-type-${vt.key}`}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border p-4 text-center transition-all duration-200',
                    isSelected
                      ? 'border-primary bg-primary/10 ring-1 ring-primary'
                      : 'border-border bg-card hover:border-primary/40',
                  )}
                >
                  <span className="text-2xl">{vt.emoji}</span>
                  <span className="font-display font-bold text-sm text-on-surface">{vt.label}</span>
                  <span className="text-xs text-muted-foreground">{vt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </FadeInWrapper>

      {/* AC-3(5): 主 CTA */}
      <FadeInWrapper delay={0.2} from="up">
        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={isDisabled || isSubmitting}
          data-testid="ai-video-cta"
          className={cn(
            'w-full py-3 rounded-xl font-display font-bold text-white bg-gradient-to-r from-primary to-primary/60 transition-opacity',
            (isDisabled || isSubmitting) && 'opacity-50 cursor-not-allowed',
          )}
        >
          {isSubmitting ? '生成中...' : '一键生成专业分镜表'}
        </button>
      </FadeInWrapper>

      {/* Loading skeleton */}
      {isSubmitting && (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-48 w-full rounded bg-muted" />
        </div>
      )}

      {/* AC-3(6): 分镜表 13 列 table (AC-4 · D-221 字面锁) */}
      {showResult && !isSubmitting && (
        <div className="space-y-3" data-testid="ai-video-storyboard-wrapper">
          <div className="flex items-center justify-between">
            <h4 className="text-body-md font-medium text-on-surface">分镜表</h4>
            {/* AC-5: 导出 CSV button */}
            <button
              type="button"
              onClick={handleExportCsv}
              data-testid="ai-video-export-csv"
              className="px-3 py-1.5 rounded-lg border border-border bg-card text-body-sm text-on-surface hover:border-primary/40 transition-all duration-200"
            >
              一键导出 CSV
            </button>
          </div>

          {/* AC-4 · 横向滚动 · 13 列 */}
          <div className="overflow-x-auto rounded-lg border border-border" data-testid="ai-video-storyboard-table">
            <table className="w-full min-w-max text-body-sm">
              <thead className="bg-muted/40">
                <tr>
                  {STORYBOARD_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className="font-display uppercase text-xs px-3 py-2 text-left whitespace-nowrap text-muted-foreground border-b border-border"
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STUB_ROWS.map((row) => (
                  <tr key={row.shotNumber} className="border-b border-border last:border-0 hover:bg-muted/20 transition-all duration-200">
                    {STORYBOARD_COLUMNS.map((col) => (
                      <td key={col.key} className="px-3 py-2 whitespace-nowrap text-on-surface">
                        {row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
