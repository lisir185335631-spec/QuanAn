/**
 * Evolution.tsx · sally 1:1 복刻版
 * /evolution · 智能体进化中心 · mock-first · 0 backend
 * 6 段: breadcrumb header · level card · 4 stat · 2 col empty · archive list · settings
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { ArchiveListItem } from '@/components/evolution/ArchiveListItem';
import { EmptyFeedbackCard } from '@/components/evolution/EmptyFeedbackCard';
import { EmptyInsightCard } from '@/components/evolution/EmptyInsightCard';
import { EvolutionHeader } from '@/components/evolution/EvolutionHeader';
import { LevelCard } from '@/components/evolution/LevelCard';
import { SettingRow } from '@/components/evolution/SettingRow';
import { StatCard } from '@/components/evolution/StatCard';
import {
  EVOLUTION_ARCHIVE_ADD,
  EVOLUTION_ARCHIVE_MOCK,
  EVOLUTION_ARCHIVE_TITLE,
  EVOLUTION_DEFAULT_STATS,
  EVOLUTION_DIR_DEFAULT_TAG,
  EVOLUTION_SETTING_AUTO_DESC,
  EVOLUTION_SETTING_AUTO_LABEL,
  EVOLUTION_SETTING_DIR_DESC,
  EVOLUTION_SETTING_DIR_LABEL,
  EVOLUTION_SETTINGS_TITLE,
  EVOLUTION_STAT_LABELS,
  EVOLUTION_TOAST_AUTO_OFF,
  EVOLUTION_TOAST_AUTO_ON,
  EVOLUTION_TOAST_TRIGGER,
} from '@/lib/constants/evolution';

export default function Evolution() {
  const navigate = useNavigate();
  const [autoOn, setAutoOn] = useState(true);

  return (
    <main className="flex-1 container py-8 max-w-6xl space-y-8">
      {/* §1 header: breadcrumb + h1 + subtitle + 触发进化 btn */}
      <EvolutionHeader onTrigger={() => toast.info(EVOLUTION_TOAST_TRIGGER)} />

      {/* §2 进化等级 card */}
      <LevelCard />

      {/* §3 4 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          variant="good"
          label={EVOLUTION_STAT_LABELS.good}
          value={EVOLUTION_DEFAULT_STATS.good}
        />
        <StatCard
          variant="needsImprove"
          label={EVOLUTION_STAT_LABELS.needsImprove}
          value={EVOLUTION_DEFAULT_STATS.needsImprove}
        />
        <StatCard
          variant="learning"
          label={EVOLUTION_STAT_LABELS.learningArchive}
          value={EVOLUTION_DEFAULT_STATS.learningArchive}
        />
        <StatCard
          variant="satisfaction"
          label={EVOLUTION_STAT_LABELS.satisfaction}
          value={EVOLUTION_DEFAULT_STATS.satisfaction}
          unit="%"
          showDelta
        />
      </div>

      {/* §4 2 col empty cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EmptyInsightCard />
        <EmptyFeedbackCard />
      </div>

      {/* §5 深度学习档案 section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2 text-on-surface">
            <Sparkles className="w-5 h-5 text-primary" />
            {EVOLUTION_ARCHIVE_TITLE}
          </h2>
          <button
            type="button"
            data-testid="add-learning-link"
            onClick={() => navigate('/deep-learning')}
            className="text-primary text-sm flex items-center gap-1 hover:underline"
          >
            <Sparkles className="w-4 h-4" />
            {EVOLUTION_ARCHIVE_ADD}
          </button>
        </div>
        {EVOLUTION_ARCHIVE_MOCK.map((a) => (
          <ArchiveListItem key={a.id} archive={a} />
        ))}
      </div>

      {/* §6 进化设置 section */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-on-surface">{EVOLUTION_SETTINGS_TITLE}</h2>
        <SettingRow
          label={EVOLUTION_SETTING_AUTO_LABEL}
          desc={EVOLUTION_SETTING_AUTO_DESC}
          control={
            <button
              type="button"
              data-testid="auto-toggle"
              onClick={() => {
                const next = !autoOn;
                setAutoOn(next);
                toast.info(next ? EVOLUTION_TOAST_AUTO_ON : EVOLUTION_TOAST_AUTO_OFF);
              }}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                autoOn ? 'bg-primary' : 'bg-muted'
              }`}
              aria-pressed={autoOn}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all ${
                  autoOn ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          }
        />
        <SettingRow
          label={EVOLUTION_SETTING_DIR_LABEL}
          desc={EVOLUTION_SETTING_DIR_DESC}
          control={
            <span className="px-3 py-1 rounded-md border border-primary/40 text-primary text-sm">
              {EVOLUTION_DIR_DEFAULT_TAG}
            </span>
          }
        />
      </div>
    </main>
  );
}
