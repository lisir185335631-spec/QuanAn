/**
 * SettingRow · generic setting row · label + desc left · control right
 */

interface SettingRowProps {
  label: string;
  desc: string;
  control: React.ReactNode;
}

export function SettingRow({ label, desc, control }: SettingRowProps) {
  return (
    <div
      data-testid="setting-row"
      className="flex items-center justify-between gap-4"
    >
      {/* left: label + desc */}
      <div className="space-y-0.5">
        <p className="text-sm font-bold text-on-surface">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {/* right: control */}
      <div className="shrink-0">{control}</div>
    </div>
  );
}
