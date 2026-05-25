/**
 * ShotMetaCell.tsx — SHOT 内 4 cell 中单个
 * label 灰 + value 白 bold
 */
interface ShotMetaCellProps {
  label: string;
  value: string;
}

export function ShotMetaCell({ label, value }: ShotMetaCellProps) {
  return (
    <div
      className="flex flex-col gap-0.5 rounded-lg border border-border bg-card/60 p-3"
      data-testid="shot-meta-cell"
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-on-surface">{value}</span>
    </div>
  );
}
