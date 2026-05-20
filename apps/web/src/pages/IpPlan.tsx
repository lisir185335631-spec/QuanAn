import { ArrowLeft, FileText, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { IpPlanStepGrid } from '@/components/ip-plan/IpPlanStepGrid';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

export default function IpPlan() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: progress, refetch, isLoading } = trpc.stepData.progress.useQuery(undefined, { retry: 1 });

  const completed = progress?.completedSteps ?? [];
  const percent = Math.round((completed.length / 9) * 100);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  return (
    <main className="flex-1 container mx-auto px-4 py-8 min-h-screen" data-grid-bg data-testid="ip-plan-page">
      {/* (a) 顶部导航条 */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />返回首页
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { void handleRefresh(); }}
          disabled={isRefreshing}
          className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />刷新
        </Button>
      </div>

      {/* (b) H1 + 副标 N/9 */}
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
          <FileText className="h-7 w-7 text-primary" />我的IP方案
        </h1>
        <p className="font-cn text-muted-foreground">
          已完成 <span className="text-primary font-bold">{completed.length}</span> / 9 步
        </p>
      </div>

      {/* (c) glass-card 进度条 */}
      <div className="glass-card rounded-xl p-6 mb-10 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="font-cn text-sm font-bold text-foreground">IP打造进度</span>
          <span className="text-primary font-bold text-lg">{percent}%</span>
        </div>
        <div className="w-full h-4 bg-muted/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* (d) 9 步卡片网格 */}
      <IpPlanStepGrid completedSteps={completed} isLoading={isLoading} />
    </main>
  );
}
