/**
 * MyTopics.tsx — /my-topics 我的选题库 · PRD-15 US-007
 * 1:1 实现 ui/_11+_13 设计(2 view: 卡片视图 + 表格视图)
 * AC-1: 200+ 行完整实现
 * AC-2: View 1 卡片视图(默认) · 网格布局 · title+source badge+行业+时间+操作
 * AC-3: View 2 表格视图 · DenseTable
 * AC-4: URL state ?view=card|table
 * AC-5: 数据聚合 trpc.myTopics.list(3 sources: step5/trending/manual)
 * AC-6: 多维筛选(source/industry/search)
 * AC-7: 添加选题 Modal
 * AC-8: 一键跳 Step 7 → /step/7?topic=&source=mytopics&topicId=xxx
 */

import { BookOpen, Grid3x3, LayoutList, Plus, Search, Trash2, Edit3, Zap, Loader2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { IndustryDropdown } from '@/components/IndustryDropdown';
import { trpc } from '@/lib/trpc';

import type { MyTopicItem, MyTopicSource } from '@quanan/clients/router-types';

// ── URL state helpers ─────────────────────────────────────────────────────────

type ViewMode = 'card' | 'table';
type SourceFilter = 'all' | 'step5' | 'trending' | 'manual';

function readViewFromUrl(params: URLSearchParams): ViewMode {
  const v = params.get('view');
  return v === 'table' ? 'table' : 'card';
}

function readSourceFromUrl(params: URLSearchParams): SourceFilter {
  const s = params.get('source');
  return (['all', 'step5', 'trending', 'manual'] as SourceFilter[]).includes(s as SourceFilter)
    ? (s as SourceFilter)
    : 'all';
}

// ── Source badge ──────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<MyTopicSource, string> = {
  step5: 'Step5 选题',
  trending: '爆款收藏',
  manual: '手动添加',
};

const SOURCE_COLORS: Record<MyTopicSource, string> = {
  step5: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  trending: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  manual: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
};

function SourceBadge({ source }: { source: MyTopicSource }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${SOURCE_COLORS[source]}`}
      data-testid={`source-badge-${source}`}
    >
      {SOURCE_LABELS[source]}
    </span>
  );
}

// ── AddTopicModal ─────────────────────────────────────────────────────────────

interface AddTopicModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

function AddTopicModal({ open, onClose, onAdded }: AddTopicModalProps) {
  const [title, setTitle] = useState('');
  const [industry, setIndustry] = useState('');
  const [platform, setPlatform] = useState('');
  const utils = trpc.useUtils();

  const addMutation = trpc.myTopics.add.useMutation({
    onSuccess: () => {
      toast.success('选题已添加到库');
      void utils.myTopics.list.invalidate();
      void utils.myTopics.countBySource.invalidate();
      setTitle('');
      setIndustry('');
      setPlatform('');
      onAdded();
      onClose();
    },
    onError: () => toast.error('添加失败，请重试'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addMutation.mutate({ title: title.trim(), industry: industry || undefined, platform: platform || undefined });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md" data-testid="add-topic-modal">
        <DialogHeader>
          <DialogTitle>添加新选题</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">选题标题 *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入选题标题"
              data-testid="add-topic-title-input"
              required
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">行业</label>
            <IndustryDropdown
              value={industry}
              onValueChange={setIndustry}
              placeholder="选择行业（可选）"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">平台</label>
            <Input
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="如：抖音、小红书（可选）"
              data-testid="add-topic-platform-input"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>取消</Button>
            <Button type="submit" disabled={addMutation.isPending || !title.trim()} data-testid="add-topic-submit">
              {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '添加'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── EditTopicModal ────────────────────────────────────────────────────────────

interface EditTopicModalProps {
  item: MyTopicItem | null;
  onClose: () => void;
}

function EditTopicModal({ item, onClose }: EditTopicModalProps) {
  const [title, setTitle] = useState(item?.title ?? '');
  const [industry, setIndustry] = useState(item?.industry ?? '');
  const [platform, setPlatform] = useState(item?.platform ?? '');
  const utils = trpc.useUtils();

  const updateMutation = trpc.myTopics.update.useMutation({
    onSuccess: () => {
      toast.success('选题已更新');
      void utils.myTopics.list.invalidate();
      onClose();
    },
    onError: () => toast.error('更新失败，请重试'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item?.topicId || !title.trim()) return;
    updateMutation.mutate({ topicId: item.topicId, title: title.trim(), industry: industry || undefined, platform: platform || undefined });
  }

  return (
    <Dialog open={!!item} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md" data-testid="edit-topic-modal">
        <DialogHeader>
          <DialogTitle>编辑选题</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">选题标题 *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required data-testid="edit-topic-title-input" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">行业</label>
            <IndustryDropdown value={industry} onValueChange={setIndustry} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">平台</label>
            <Input value={platform} onChange={(e) => setPlatform(e.target.value)} data-testid="edit-topic-platform-input" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>取消</Button>
            <Button type="submit" disabled={updateMutation.isPending || !title.trim()} data-testid="edit-topic-submit">
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── TopicCard (card view) ─────────────────────────────────────────────────────

interface TopicCardProps {
  item: MyTopicItem;
  onStep7: (item: MyTopicItem) => void;
  onEdit: (item: MyTopicItem) => void;
  onDelete: (item: MyTopicItem) => void;
}

function TopicCard({ item, onStep7, onEdit, onDelete }: TopicCardProps) {
  const createdAt = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt);
  const dateStr = new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' }).format(createdAt);

  return (
    <Card
      className="bg-surface-container border border-outline-variant/40 hover:border-primary/40 transition-colors"
      data-testid={`topic-card-${item.id}`}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-on-surface leading-snug line-clamp-2 flex-1">{item.title}</p>
          <SourceBadge source={item.source} />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {item.industry && (
            <span className="text-xs text-muted-foreground bg-surface-variant/40 px-2 py-0.5 rounded" data-testid="topic-industry-tag">
              {item.industry}
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">{dateStr}</span>
        </div>

        <div className="flex items-center gap-1 pt-1">
          <Button
            size="sm"
            variant="default"
            className="h-7 text-xs flex-1"
            onClick={() => onStep7(item)}
            data-testid={`btn-step7-${item.id}`}
          >
            <Zap className="h-3 w-3 mr-1" />
            一键到 Step 7
          </Button>
          {item.source === 'manual' && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => onEdit(item)}
              data-testid={`btn-edit-${item.id}`}
            >
              <Edit3 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(item)}
            data-testid={`btn-delete-${item.id}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── TopicTableRow ─────────────────────────────────────────────────────────────

interface TopicTableRowProps {
  item: MyTopicItem;
  index: number;
  onStep7: (item: MyTopicItem) => void;
  onEdit: (item: MyTopicItem) => void;
  onDelete: (item: MyTopicItem) => void;
}

function TopicTableRow({ item, index: _index, onStep7, onEdit, onDelete }: TopicTableRowProps) {
  const createdAt = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt);
  const dateStr = new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' }).format(createdAt);

  return (
    <div
      className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-3 px-4 py-2.5 border-b border-outline-variant/30 hover:bg-surface-container-high/20 text-sm"
      data-testid={`topic-row-${item.id}`}
    >
      <span className="text-on-surface truncate" title={item.title}>{item.title}</span>
      <span><SourceBadge source={item.source} /></span>
      <span className="text-muted-foreground text-xs">{item.industry ?? '—'}</span>
      <span className="text-muted-foreground text-xs">{dateStr}</span>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => onStep7(item)} data-testid={`table-btn-step7-${item.id}`}>
          <Zap className="h-3 w-3 mr-1" />Step 7
        </Button>
        {item.source === 'manual' && (
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onEdit(item)} data-testid={`table-btn-edit-${item.id}`}>
            <Edit3 className="h-3 w-3" />
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={() => onDelete(item)} data-testid={`table-btn-delete-${item.id}`}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ── KPI Bar ───────────────────────────────────────────────────────────────────

function KpiBar({ step5, trending, manual }: { step5: number; trending: number; manual: number }) {
  return (
    <div className="flex items-center gap-6 text-sm" data-testid="kpi-bar">
      <span className="text-muted-foreground">共 <strong className="text-on-surface">{step5 + trending + manual}</strong> 条选题</span>
      <span className="text-blue-400" data-testid="kpi-step5">Step5 {step5}</span>
      <span className="text-amber-400" data-testid="kpi-trending">爆款 {trending}</span>
      <span className="text-emerald-400" data-testid="kpi-manual">手动 {manual}</span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MyTopics() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const view = readViewFromUrl(searchParams);
  const sourceFilter = readSourceFromUrl(searchParams);
  const industryFilter = searchParams.get('industry') ?? '';
  const searchFilter = searchParams.get('search') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<MyTopicItem | null>(null);

  function updateParams(updates: Record<string, string>) {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    setSearchParams(next, { replace: true });
  }

  const listQuery = trpc.myTopics.list.useQuery({
    source: sourceFilter,
    industry: industryFilter || undefined,
    search: searchFilter || undefined,
    page,
    pageSize: 20,
  });

  const kpiQuery = trpc.myTopics.countBySource.useQuery();

  const utils = trpc.useUtils();

  const deleteMutation = trpc.myTopics.delete.useMutation({
    onSuccess: () => {
      toast.success('已删除');
      void utils.myTopics.list.invalidate();
      void utils.myTopics.countBySource.invalidate();
    },
    onError: () => toast.error('删除失败'),
  });

  const handleStep7 = useCallback((item: MyTopicItem) => {
    const params = new URLSearchParams({ topic: item.title, source: 'mytopics' });
    if (item.topicId) params.set('topicId', String(item.topicId));
    else if (item.trendingItemId) params.set('topicId', String(item.trendingItemId));
    navigate(`/step/7?${params.toString()}`);
  }, [navigate]);

  const handleDelete = useCallback((item: MyTopicItem) => {
    deleteMutation.mutate({ id: item.id });
  }, [deleteMutation]);

  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = listQuery.data?.totalPages ?? 1;
  const kpi = kpiQuery.data ?? { step5: 0, trending: 0, manual: 0 };

  return (
    <main className="flex-1 container py-6 space-y-5" data-testid="my-topics-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-h1 font-display text-on-surface">我的选题库</h1>
        </div>
        <Button onClick={() => setAddOpen(true)} data-testid="btn-add-topic">
          <Plus className="h-4 w-4 mr-1.5" />
          添加选题
        </Button>
      </div>

      {/* KPI Bar */}
      <KpiBar step5={kpi.step5} trending={kpi.trending} manual={kpi.manual} />

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap" data-testid="filter-toolbar">
        {/* Source filter */}
        <div className="flex items-center rounded-md border border-outline-variant/40 overflow-hidden" data-testid="source-filter">
          {(['all', 'step5', 'trending', 'manual'] as SourceFilter[]).map((s) => (
            <button
              key={s}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${sourceFilter === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-on-surface'}`}
              onClick={() => updateParams({ source: s === 'all' ? '' : s, page: '' })}
              data-testid={`source-tab-${s}`}
            >
              {s === 'all' ? '全部' : SOURCE_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Industry filter */}
        <div className="w-40" data-testid="industry-filter">
          <IndustryDropdown
            value={industryFilter}
            onValueChange={(v) => updateParams({ industry: v, page: '' })}
            placeholder="全部行业"
          />
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchFilter}
            onChange={(e) => updateParams({ search: e.target.value, page: '' })}
            placeholder="搜索选题标题"
            className="pl-9"
            data-testid="search-input"
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 ml-auto" data-testid="view-toggle">
          <Button
            size="sm"
            variant={view === 'card' ? 'default' : 'ghost'}
            className="h-8 w-8 p-0"
            onClick={() => updateParams({ view: 'card' })}
            data-testid="view-card-btn"
            aria-label="卡片视图"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={view === 'table' ? 'default' : 'ghost'}
            className="h-8 w-8 p-0"
            onClick={() => updateParams({ view: 'table' })}
            data-testid="view-table-btn"
            aria-label="表格视图"
          >
            <LayoutList className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading */}
      {listQuery.isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground" data-testid="loading-state">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />加载中...
        </div>
      )}

      {/* Empty */}
      {!listQuery.isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-3" data-testid="empty-state">
          <BookOpen className="h-10 w-10 opacity-30" />
          <p className="text-sm">暂无选题 · 从 Step 5 生成、收藏爆款或手动添加</p>
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />手动添加
          </Button>
        </div>
      )}

      {/* Card view */}
      {!listQuery.isLoading && view === 'card' && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="card-grid">
          {items.map((item) => (
            <TopicCard
              key={item.id}
              item={item}
              onStep7={handleStep7}
              onEdit={setEditItem}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Table view */}
      {!listQuery.isLoading && view === 'table' && items.length > 0 && (
        <div className="rounded-lg border border-outline-variant/40 overflow-hidden" data-testid="topic-table">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 px-4 py-2 bg-surface-container text-xs font-medium text-muted-foreground border-b border-outline-variant/40">
            <span>标题</span>
            <span>来源</span>
            <span>行业</span>
            <span>时间</span>
            <span>操作</span>
          </div>
          {items.map((item, idx) => (
            <TopicTableRow
              key={item.id}
              item={item}
              index={idx}
              onStep7={handleStep7}
              onEdit={setEditItem}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground" data-testid="pagination">
          <span>共 {total} 条</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
              data-testid="pagination-prev"
            >
              上一页
            </Button>
            <span>{page} / {totalPages}</span>
            <Button
              size="sm"
              variant="ghost"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
              data-testid="pagination-next"
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <AddTopicModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={() => setAddOpen(false)}
      />

      {/* Edit Modal */}
      <EditTopicModal item={editItem} onClose={() => setEditItem(null)} />
    </main>
  );
}
