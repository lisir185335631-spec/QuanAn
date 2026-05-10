/**
 * VideoProductionResult — /video-production 工具页结果渲染 · PRD-6 US-004
 * Accepts VideoProductionHistoryRow (content: string JSON) from trpc.videoProduction.generate
 * JSON.parse(data.content) → ProductionOutput(shotList + equipment + schedule)
 * Renders 13-column storyboard table (固定列名: 镜头号/景别/角度/运镜/时长/画面描述/台词/字幕/音效/BGM/道具/参考/备注)
 * Equipment card + Schedule card
 * JSON.parse fail → "解析失败"
 * AC-14: perf marker on table container
 */

import { useLayoutEffect, useRef } from 'react';

import { Card, CardContent } from '@/components/ui/card';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ShotItem {
  scene?: string;
  transition?: string;
  cameraAngle?: string;
  action?: string;
  duration?: string;
  voiceover?: string;
  dialogue?: string;
  subtitle?: string;
  sfx?: string;
  lighting?: string;
  prop?: string;
  costume?: string;
  location?: string;
}

interface ProductionData {
  shotList?: ShotItem[];
  equipment?: string[];
  schedule?: string;
}

interface VideoProductionHistoryRowLike {
  content?: string;
}

interface VideoProductionResultProps {
  data: unknown;
}

// ── 13 fixed column definitions ───────────────────────────────────────────────

const COLUMNS: { header: string; key: keyof ShotItem }[] = [
  { header: '镜头号', key: 'scene' },
  { header: '景别', key: 'transition' },
  { header: '角度', key: 'cameraAngle' },
  { header: '运镜', key: 'action' },
  { header: '时长', key: 'duration' },
  { header: '画面描述', key: 'voiceover' },
  { header: '台词', key: 'dialogue' },
  { header: '字幕', key: 'subtitle' },
  { header: '音效', key: 'sfx' },
  { header: 'BGM', key: 'lighting' },
  { header: '道具', key: 'prop' },
  { header: '参考', key: 'costume' },
  { header: '备注', key: 'location' },
];

// ── Main component ────────────────────────────────────────────────────────────

export function VideoProductionResult({ data }: VideoProductionResultProps) {
  const row = (data ?? {}) as VideoProductionHistoryRowLike;

  // AC-14: perf marker — hooks must come before early returns
  const perfStartRef = useRef(performance.now());

  let parsed: ProductionData | null = null;
  let parseError = false;
  try {
    if (row.content) {
      parsed = JSON.parse(row.content) as ProductionData;
    }
  } catch {
    parseError = true;
  }

  const shotList = parsed?.shotList ?? [];
  const equipment = parsed?.equipment ?? [];
  const schedule = parsed?.schedule ?? '';

  // AC-14: mark after storyboard table is painted; measure total render duration
  useLayoutEffect(() => {
    if (shotList.length > 0) {
      performance.mark('vp-storyboard-painted');
      try {
        performance.measure('vp-storyboard-render', {
          start: perfStartRef.current,
          end: performance.now(),
        });
      } catch { /* mark may have been cleared */ }
    }
  }, [shotList.length]);

  if (parseError) {
    return (
      <div
        className="rounded-lg border border-error bg-error/5 p-4"
        role="alert"
        data-testid="video-production-parse-error"
      >
        <p className="text-body-sm text-error">解析失败</p>
      </div>
    );
  }

  if (!parsed) {
    return (
      <div className="rounded-lg border border-border bg-surface-container p-4" data-testid="tool-result-video-production">
        <p className="text-body-sm text-muted-foreground text-center py-4">暂无结果</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="tool-result-video-production">
      {/* 13-column storyboard table */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-body-md font-semibold text-on-surface mb-4">分镜脚本</h3>
          <div
            className="overflow-x-auto"
            data-testid="video-production-storyboard-table"
          >
            <table className="w-full text-body-xs border-collapse" style={{ minWidth: '1400px' }}>
              <thead>
                <tr className="bg-surface-container">
                  <th className="border border-border px-2 py-1.5 text-left font-medium text-on-surface whitespace-nowrap">#</th>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className="border border-border px-2 py-1.5 text-left font-medium text-on-surface whitespace-nowrap"
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shotList.map((shot, i) => (
                  <tr
                    key={i}
                    className="even:bg-surface-container/50"
                    data-testid={`video-production-shot-${i}`}
                  >
                    <td className="border border-border px-2 py-1.5 text-muted-foreground tabular-nums">
                      {i + 1}
                    </td>
                    {COLUMNS.map((col) => (
                      <td
                        key={col.key}
                        className="border border-border px-2 py-1.5 text-on-surface"
                      >
                        {shot[col.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
                {shotList.length === 0 && (
                  <tr>
                    <td
                      colSpan={14}
                      className="border border-border px-2 py-4 text-center text-muted-foreground"
                    >
                      暂无分镜数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Equipment card */}
      {equipment.length > 0 && (
        <Card data-testid="video-production-equipment">
          <CardContent className="pt-6">
            <h3 className="text-body-md font-semibold text-on-surface mb-3">设备清单</h3>
            <ul className="space-y-1.5">
              {equipment.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-body-sm text-on-surface">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Schedule card */}
      {schedule && (
        <Card data-testid="video-production-schedule">
          <CardContent className="pt-6">
            <h3 className="text-body-md font-semibold text-on-surface mb-3">拍摄排期</h3>
            <p className="text-body-sm text-on-surface whitespace-pre-line">{schedule}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
