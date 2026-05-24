/**
 * /present-styles · 爆款呈现形式合集 (sally 真实页 1:1 复刻)
 * 14 cards 静态 grid · 0 交互
 */

import StyleCard from '@/components/present-styles/StyleCard';
import { PAGE_SUBTITLE, PAGE_TITLE, PRESENT_STYLES } from '@/lib/constants/present-styles';

export default function PresentStyles() {
  return (
    <main className="flex-1 container py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-on-surface">{PAGE_TITLE}</h1>
        <p className="text-base text-muted-foreground">{PAGE_SUBTITLE}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRESENT_STYLES.map((style) => (
          <StyleCard key={style.id} style={style} />
        ))}
      </div>
    </main>
  );
}
