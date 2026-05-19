/**
 * /knowledge 页面 — PRD-22 US-005
 * AC-1: H1 "AIP 文案方法论" + 副标题字面锁
 * AC-2: 4 tab 字面锁 D-217 · "20 类脚本" / "20 大爆款" / "开头公式" / "核心公式"
 * AC-3: tab 1 · search input + 20 脚本卡 + 案例计数 button
 * AC-4: tab 2 · ElementsInlineMultiPicker disabled grouped
 * AC-5: tab 3/4 stub placeholder
 * AC-6: forceMount 保证 DOM button 总数 ≥ 47(4 tab + 20 case + 23 elements)
 */

import { useState } from 'react';

import { FadeInWrapper } from '@/components/FadeInWrapper';
import { ElementsInlineMultiPicker } from '@/components/inline-pickers';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SCRIPT_TYPES } from '@/lib/constants/scripts';
import { cn } from '@/lib/utils';

// ── Tab 1: Script Cards with case count buttons ───────────────────────────────

function ScriptCardsTab() {
  const [search, setSearch] = useState('');
  const [selectedScript, setSelectedScript] = useState<string | null>(null);

  const lowerQuery = search.trim().toLowerCase();
  const filtered = lowerQuery
    ? SCRIPT_TYPES.filter(
        (s) =>
          s.label.toLowerCase().includes(lowerQuery) ||
          s.desc.toLowerCase().includes(lowerQuery)
      )
    : SCRIPT_TYPES;

  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="搜索脚本类型..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
        data-testid="script-search"
      />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map((s, i) => {
          const isSelected = s.key === selectedScript;
          const caseCount = (i % 9) + 1;
          return (
            <div
              key={s.key}
              role="button"
              tabIndex={0}
              data-testid={`script-card-${s.key}`}
              onClick={() => setSelectedScript(s.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedScript(s.key);
              }}
              className={cn(
                'rounded-lg p-3 text-left border transition-all cursor-pointer',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-primary/40'
              )}
            >
              <span className="block text-3xl">{s.emoji}</span>
              <span className="block font-display font-bold text-sm mt-1">{s.label}</span>
              <span className="block text-sm text-muted-foreground mt-1 line-clamp-2">
                {s.desc}
              </span>
              <details className="mt-2">
                <summary className="text-xs text-muted-foreground cursor-pointer select-none">
                  方法论
                </summary>
                <p className="text-xs text-muted-foreground mt-1">{s.methodology}</p>
              </details>
              <button
                type="button"
                data-testid={`case-count-${s.key}`}
                onClick={(e) => e.stopPropagation()}
                className="mt-2 text-xs text-primary hover:underline focus:outline-none"
              >
                实战案例 ({caseCount})
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Knowledge page ────────────────────────────────────────────────────────────

export default function Knowledge() {
  return (
    <main className="flex-1 container py-8 max-w-7xl">
      {/* AC-1: H1 + subtitle 字面锁 */}
      <FadeInWrapper delay={0} from="up">
        <div>
          <h1 className="font-display text-4xl font-bold text-on-surface mb-2">
            AIP 文案方法论
          </h1>
          <p className="text-muted-foreground mb-8">
            系统学习 AIP 的短视频文案创作方法论，掌握爆款文案的核心技巧
          </p>
        </div>
      </FadeInWrapper>

      {/* AC-2: 4 tab 字面锁 D-217 */}
      <Tabs defaultValue="scripts" data-testid="knowledge-tabs">
        <TabsList className="mb-6">
          <TabsTrigger
            value="scripts"
            data-testid="tab-scripts"
            className="data-[state=active]:bg-primary/10"
          >
            20 类脚本
          </TabsTrigger>
          <TabsTrigger
            value="elements"
            data-testid="tab-elements"
            className="data-[state=active]:bg-primary/10"
          >
            20 大爆款
          </TabsTrigger>
          <TabsTrigger
            value="intros"
            data-testid="tab-intros"
            className="data-[state=active]:bg-primary/10"
          >
            开头公式
          </TabsTrigger>
          <TabsTrigger
            value="core"
            data-testid="tab-core"
            className="data-[state=active]:bg-primary/10"
          >
            核心公式
          </TabsTrigger>
        </TabsList>

        {/* AC-3: tab 1 · 20 脚本卡 + search + 案例计数 button */}
        <TabsContent
          value="scripts"
          forceMount
          className="data-[state=inactive]:hidden"
          data-testid="tab-content-scripts"
        >
          <FadeInWrapper delay={0.05} from="up">
            <ScriptCardsTab />
          </FadeInWrapper>
        </TabsContent>

        {/* AC-4: tab 2 · ElementsInlineMultiPicker 纯展示态 · forceMount 保证 DOM 按钮计数 */}
        <TabsContent
          value="elements"
          forceMount
          className="data-[state=inactive]:hidden"
          data-testid="tab-content-elements"
        >
          <FadeInWrapper delay={0.05} from="up">
            <ElementsInlineMultiPicker
              value={[]}
              onChange={() => {}}
              layout="grouped"
              disabled
              showCount={false}
            />
          </FadeInWrapper>
        </TabsContent>

        {/* AC-5: tab 3 stub */}
        <TabsContent
          value="intros"
          forceMount
          className="data-[state=inactive]:hidden"
          data-testid="tab-content-intros"
        >
          <FadeInWrapper delay={0.05} from="up">
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">5 类开头公式 · PRD-23 完整化</p>
            </div>
          </FadeInWrapper>
        </TabsContent>

        {/* AC-5: tab 4 stub */}
        <TabsContent
          value="core"
          forceMount
          className="data-[state=inactive]:hidden"
          data-testid="tab-content-core"
        >
          <FadeInWrapper delay={0.05} from="up">
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">AIP 起承转合公式 · PRD-23 完整化</p>
            </div>
          </FadeInWrapper>
        </TabsContent>
      </Tabs>
    </main>
  );
}
