import { C, F } from '@/components/home-next/ikb/system';

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
      className="lg-glass lg-spec flex items-center gap-4 rounded-xl p-5 mb-2"
    >
      <div
        className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
        style={{
          background: 'linear-gradient(110deg, #2B53E6 0%, #7A3BE0 52%, #EF3E6B 100%)',
          boxShadow: '0 4px 12px rgba(43,83,230,0.30)',
        }}
      >
        <span className="material-symbols-outlined text-[24px] text-white" aria-hidden={true}>{icon}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span
          className="text-[18px] font-bold"
          style={{ color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}
        >
          {label}
        </span>
        <span
          className="text-[14px]"
          style={{ color: 'rgba(255,255,255,0.60)', fontFamily: F.cn, textShadow: C.textShadow }}
        >
          {subtitle}
        </span>
      </div>
    </div>
  );
}
