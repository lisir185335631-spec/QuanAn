import { BOOM_BREADCRUMB, BOOM_BREADCRUMB_LABEL } from '@/lib/constants/boomGenerate';

export function BoomBreadcrumb() {
  return (
    <div className="flex items-center gap-2 text-sm font-cn">
      <span className="rounded-full border border-primary/60 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
        {BOOM_BREADCRUMB}
      </span>
      <span className="text-muted-foreground">&gt;</span>
      <span className="font-bold text-primary">{BOOM_BREADCRUMB_LABEL}</span>
    </div>
  );
}
