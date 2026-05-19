/**
 * /knowledge 页面 — PRD-9 US-004
 * AC-2: h1 '知识库' + 3 tab(案例/公式/元素) + list view ScrollArea + search input + status bar
 * AC-3: search debounce 300ms · ≥2 字符触发 knowledge.search mutation
 * AC-4/5/6: case/formula/element card 渲染
 * AC-7: search empty state
 * AC-8: /knowledge route 已在 router.tsx 注册
 */

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';

import type { KnowledgeChunkContent } from '@quanan/clients/router-types';

// ── Types ─────────────────────────────────────────────────────────────────────

type TabType = 'case' | 'formula' | 'element';

type StatusType = 'idle' | 'searching' | 'no-results';

const TAB_LABELS: Record<TabType, string> = {
  case: '案例',
  formula: '公式',
  element: '元素',
};

const STATUS_LABEL: Record<StatusType, string> = {
  idle: '就绪',
  searching: '语义检索中…',
  'no-results': '无结果',
};

// ── CaseCard ──────────────────────────────────────────────────────────────────

function CaseCard({
  item,
  expanded,
  onToggle,
}: {
  item: KnowledgeChunkContent;
  expanded: boolean;
  onToggle: () => void;
}) {
  const meta = item.metadata as { scriptType?: string; industry?: string };
  const preview = item.content.slice(0, 100);

  return (
    <Card className="border-outline-variant bg-surface-variant/10">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-body-md font-medium text-on-surface">{item.title}</span>
          <button
            aria-label={expanded ? '收起' : '展开'}
            className="shrink-0 text-on-surface-variant hover:text-primary transition-colors"
            onClick={onToggle}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {meta.scriptType && (
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {meta.scriptType}
            </span>
          )}
          {meta.industry && (
            <span className="inline-flex items-center rounded-md border border-outline-variant px-2 py-0.5 text-xs font-medium text-on-surface-variant">
              {meta.industry}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-body-sm text-on-surface-variant">
          {expanded ? item.content : `${preview}${item.content.length > 100 ? '…' : ''}`}
        </p>
      </CardContent>
    </Card>
  );
}

// ── FormulaCard ───────────────────────────────────────────────────────────────

function FormulaCard({ item }: { item: KnowledgeChunkContent }) {
  const meta = item.metadata as { category?: string };

  return (
    <Card className="border-outline-variant bg-surface-variant/10">
      <CardHeader className="pb-2">
        <span className="text-body-md font-medium text-on-surface">{item.title}</span>
        {meta.category && (
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary mt-1">
            {meta.category}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-body-sm text-on-surface-variant whitespace-pre-wrap">{item.content}</p>
      </CardContent>
    </Card>
  );
}

// ── ElementCard ───────────────────────────────────────────────────────────────

function ElementCard({ item }: { item: KnowledgeChunkContent }) {
  const meta = item.metadata as { psychologyTag?: string };

  return (
    <Card className="border-outline-variant bg-surface-variant/10">
      <CardHeader className="pb-2">
        <span className="text-body-md font-medium text-on-surface">{item.title}</span>
        {meta.psychologyTag && (
          <span className="inline-flex items-center rounded-md border border-outline-variant px-2 py-0.5 text-xs font-medium text-on-surface-variant mt-1">
            {meta.psychologyTag}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-body-sm text-on-surface-variant whitespace-pre-wrap">{item.content}</p>
      </CardContent>
    </Card>
  );
}

// ── ItemCard dispatcher ───────────────────────────────────────────────────────

function ItemCard({
  item,
  expanded,
  onToggle,
}: {
  item: KnowledgeChunkContent;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (item.type === 'case') return <CaseCard item={item} expanded={expanded} onToggle={onToggle} />;
  if (item.type === 'formula') return <FormulaCard item={item} />;
  return <ElementCard item={item} />;
}

// ── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-center"
      data-testid="knowledge-empty-state"
    >
      <p className="text-body-md text-on-surface-variant">
        暂无匹配结果 · 试试矛盾冲突 / AIDA / 稀缺性等关键词
      </p>
    </div>
  );
}

// ── Knowledge page ────────────────────────────────────────────────────────────

export default function Knowledge() {
  const [activeTab, setActiveTab] = useState<TabType>('case');
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<KnowledgeChunkContent[] | null>(null);
  const [status, setStatus] = useState<StatusType>('idle');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const { data: listData, isLoading: listLoading } = trpc.knowledge.list.useQuery({
    type: activeTab,
    limit: 50,
  });

  const { mutate: searchMutate } = trpc.knowledge.search.useMutation({
    onSuccess: (data) => {
      setSearchResults(data);
      setStatus(data.length === 0 ? 'no-results' : 'idle');
    },
    onError: () => setStatus('idle'),
  });

  useEffect(() => {
    if (searchInput.length < 2) {
      setSearchResults(null);
      setStatus('idle');
      return;
    }
    setStatus('searching');
    const id = setTimeout(() => {
      searchMutate({ query: searchInput, type: activeTab });
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput, activeTab, searchMutate]);

  const handleTabChange = useCallback(
    (val: string) => {
      setActiveTab(val as TabType);
      if (searchInput.length >= 2) {
        setStatus('searching');
      }
    },
    [searchInput.length],
  );

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const isSearchMode = searchResults !== null;
  const displayItems = isSearchMode ? searchResults : (listData ?? []);
  const isLoading = listLoading && !isSearchMode;

  const statusText =
    status === 'searching'
      ? STATUS_LABEL.searching
      : status === 'no-results'
        ? STATUS_LABEL['no-results']
        : searchInput.length >= 2
          ? `就绪 · 显示 ${displayItems.length} 条结果`
          : STATUS_LABEL.idle;

  return (
    <main className="flex-1 container py-8">
      <h1 className="text-h1 font-display text-on-surface mb-6">知识库</h1>

      <div className="mb-4 max-w-xl">
        <Input
          placeholder="语义检索… (输入 ≥ 2 字符触发)"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          data-testid="knowledge-search-input"
          className="bg-surface-variant/20"
        />
      </div>

      <p
        className="text-label-sm font-label text-on-surface-variant mb-4"
        aria-live="polite"
        data-testid="knowledge-status-bar"
      >
        {statusText}
      </p>

      <Tabs value={activeTab} onValueChange={handleTabChange} data-testid="knowledge-tabs">
        <TabsList className="mb-4">
          {(['case', 'formula', 'element'] as TabType[]).map((t) => (
            <TabsTrigger key={t} value={t} data-testid={`tab-${t}`}>
              {TAB_LABELS[t]}
            </TabsTrigger>
          ))}
        </TabsList>

        {(['case', 'formula', 'element'] as TabType[]).map((t) => (
          <TabsContent key={t} value={t}>
            <ScrollArea className="h-[60vh]" data-testid="knowledge-list">
              {isLoading ? (
                <p className="text-body-md text-muted-foreground py-8 text-center">加载中…</p>
              ) : displayItems.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="space-y-3 pr-4">
                  {displayItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      expanded={expandedIds.has(item.id)}
                      onToggle={() => toggleExpand(item.id)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </main>
  );
}
