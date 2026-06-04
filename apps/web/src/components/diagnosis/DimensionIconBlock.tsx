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
      className="flex items-center gap-4 rounded-xl p-5 mb-2"
      style={{
        border: '1px solid rgba(43,83,230,0.18)',
        background: 'linear-gradient(135deg, #F3F5FC, #FFFFFF)',
      }}
    >
      <div
        className="flex items-center justify-center w-12 h-12 rounded-xl shadow-md shrink-0"
        style={{
          background: 'linear-gradient(110deg, #2B53E6 0%, #7A3BE0 52%, #EF3E6B 100%)',
          boxShadow: '0 4px 12px rgba(43,83,230,0.20)',
        }}
      >
        <span className="material-symbols-outlined text-[24px] text-white" aria-hidden={true}>{icon}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[18px] font-bold" style={{ color: '#161D33' }}>{label}</span>
        <span className="text-[14px] text-[#6b7280]">{subtitle}</span>
      </div>
    </div>
  );
}
