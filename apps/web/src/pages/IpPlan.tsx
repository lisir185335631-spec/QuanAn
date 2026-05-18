import { ArrowLeft, FileText, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

const STEP_CARDS = [
  { key: '1', emoji: '🎯', title: '行业选择', href: '/step/1' },
  { key: '3', emoji: '📦', title: '账号包装', href: '/step/3' },
  { key: '3b', emoji: '👤', title: '人设定制', href: '/step/3b' },
  { key: '4', emoji: '📋', title: '执行计划', href: '/step/4' },
  { key: '4b', emoji: '💰', title: '变现路径', href: '/step/4b' },
  { key: '5', emoji: '🔥', title: '爆款选题', href: '/step/5' },
  { key: '6', emoji: '🎬', title: '拍摄计划', href: '/step/6' },
  { key: '7', emoji: '✏️', title: '文案生成', href: '/step/7' },
  { key: '8', emoji: '🎙️', title: '直播策划', href: '/step/8' },
] as const;

export default function IpPlan() {
  const { data: progress, refetch } = trpc.stepData.progress.useQuery(undefined, { retry: 1 });

  const completed = progress?.completedSteps ?? [];
  const completedCount = completed.length;
  const percent = Math.round((completedCount / 9) * 100);

  return (
    <main className="flex-1 container mx-auto px-4 py-8 data-grid-bg min-h-screen" data-testid="ip-plan-page">
      <div className="mb-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="font-cn h-8 mb-4 text-muted-foreground hover:text-foreground gap-1.5 px-3">
            <ArrowLeft className="h-4 w-4 mr-1" />返回首页
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground flex items-center">
              <FileText className="inline h-7 w-7 mr-2 text-primary" />我的IP方案
            </h1>
            <p className="font-cn text-muted-foreground mt-1">
              已完成 <span className="text-primary font-bold">{completedCount}</span> / 9 步
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />刷新
          </Button>
        </div>
      </div>

      <div className="mb-8 glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-cn text-sm text-muted-foreground">IP打造进度</span>
          <span className="font-label text-sm font-bold text-primary">{percent}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {STEP_CARDS.map(card => {
          const isDone = completed.includes(card.key);
          return (
            <div
              key={card.key}
              className={`glass-card rounded-xl p-5 border ${isDone ? 'border-primary/40' : 'border-muted/30'}`}
            >
              <div className="text-3xl mb-2">{card.emoji}</div>
              <h3 className="font-cn font-semibold text-foreground mb-1">{card.title}</h3>
              <p className={`font-cn text-sm mb-1 ${isDone ? 'text-primary' : 'text-muted-foreground'}`}>
                {isDone ? '已完成' : '未完成'}
              </p>
              {isDone && (
                <p className="font-cn text-xs text-primary mb-3">✓ 数据已保存</p>
              )}
              <Link to={card.href}>
                <Button variant="outline" size="sm">查看详情</Button>
              </Link>
            </div>
          );
        })}
      </div>
    </main>
  );
}
