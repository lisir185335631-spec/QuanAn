const DIMENSION_ICONS: Record<string, string> = {
  positioning: 'target',
  branding: 'inventory_2',
  traffic: 'bolt',
  value: 'menu_book',
  case: 'work',
  persona: 'favorite',
  authentic: 'mic',
};

interface DimensionIconBlockProps {
  dimensionId: string;
  label: string;
  subtitle: string;
}

export function DimensionIconBlock({ dimensionId, label, subtitle }: DimensionIconBlockProps) {
  const icon = DIMENSION_ICONS[dimensionId] ?? 'category';

  return (
    <div
      data-testid={`dimension-icon-block-${dimensionId}`}
      className="flex items-center gap-4 rounded-xl border border-[#dbe2ff] bg-gradient-to-br from-[#eff4ff] to-white p-5 mb-2"
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#002fa7] to-[#3654c8] shadow-md shadow-[#002fa7]/20 shrink-0">
        <span className="material-symbols-outlined text-[24px] text-white" aria-hidden="true">{icon}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[18px] font-bold text-[#111827]">{label}</span>
        <span className="text-[14px] text-[#6b7280]">{subtitle}</span>
      </div>
    </div>
  );
}
