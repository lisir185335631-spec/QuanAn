import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ShotItem {
  scene?: string;
  duration?: string;
  action?: string;
  dialogue?: string;
  cameraAngle?: string;
  prop?: string;
  lighting?: string;
  transition?: string;
  sfx?: string;
  voiceover?: string;
  subtitle?: string;
  costume?: string;
  location?: string;
}
interface Step6Data {
  shotList?: ShotItem[];
  equipment?: string[];
  schedule?: string;
}

interface Props {
  data: unknown;
  isFallback: boolean;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-muted h-4', className)} />;
}

const SHOT_COLUMNS: { key: keyof ShotItem; label: string }[] = [
  { key: 'scene', label: '场景' },
  { key: 'duration', label: '时长' },
  { key: 'action', label: '动作' },
  { key: 'dialogue', label: '台词' },
  { key: 'cameraAngle', label: '机位' },
  { key: 'prop', label: '道具' },
  { key: 'lighting', label: '灯光' },
  { key: 'transition', label: '转场' },
  { key: 'sfx', label: '音效' },
  { key: 'voiceover', label: '旁白' },
  { key: 'subtitle', label: '字幕' },
  { key: 'costume', label: '服装' },
  { key: 'location', label: '地点' },
];

export function Step6Result({ data, isFallback }: Props) {
  if (data === null || data === undefined) {
    return (
      <div data-testid="step-result-step6" className="space-y-4 max-w-full">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const d = data as Step6Data;
  const shots = d.shotList ?? [];
  const equipment = d.equipment ?? [];

  return (
    <div data-testid="step-result-step6" className="space-y-4">
      {isFallback && (
        <p className="text-body-xs text-muted-foreground rounded border border-border px-3 py-1">
          AI 返回了备用结果 · 内容仅供参考
        </p>
      )}

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-body-lg">
            分镜表
            <span className="ml-2 text-body-xs font-normal text-muted-foreground">{shots.length} 个镜头</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* 13 列横向滚动 table */}
          <ScrollArea className="w-full">
            <div className="min-w-max">
              <table className="w-full text-body-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-2 text-left font-medium text-on-surface whitespace-nowrap">#</th>
                    {SHOT_COLUMNS.map((col) => (
                      <th key={col.key} className="px-3 py-2 text-left font-medium text-on-surface whitespace-nowrap">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shots.length > 0 ? shots.map((shot, i) => (
                    <tr key={i} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-2 text-muted-foreground font-medium">{i + 1}</td>
                      {SHOT_COLUMNS.map((col) => (
                        <td key={col.key} className="px-3 py-2 text-muted-foreground max-w-[200px]">
                          <span className="line-clamp-2">{shot[col.key] ?? '—'}</span>
                        </td>
                      ))}
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={14} className="px-3 py-6 text-center text-muted-foreground">
                        暂无分镜
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      {equipment.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-body-lg">拍摄设备</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {equipment.map((e, i) => (
                <span key={i} className="rounded border border-border px-2 py-1 text-body-xs text-muted-foreground">
                  {e}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {d.schedule && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-body-lg">拍摄计划</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-body-sm text-muted-foreground leading-relaxed">{d.schedule}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
