import {
  STEP1_BREADCRUMB_CHIP,
  STEP1_BREADCRUMB_LABEL,
} from '@/lib/constants/industries';

export function Step1Breadcrumb() {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 font-display text-xs font-bold text-primary tracking-wider">
        {STEP1_BREADCRUMB_CHIP}
      </span>
      <span className="text-muted-foreground">{'>'}</span>
      <span className="text-primary font-cn text-sm">{STEP1_BREADCRUMB_LABEL}</span>
    </div>
  );
}
