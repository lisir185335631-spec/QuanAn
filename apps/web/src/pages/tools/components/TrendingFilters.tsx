/**
 * TrendingFilters — PRD-15 US-006 AC-3
 * Platform multi-select (6) + IndustryDropdown + time range + sort + search
 */

import { Search } from 'lucide-react';

import { IndustryDropdown } from '@/components/IndustryDropdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type TrendingPlatform = 'douyin' | 'xiaohongshu' | 'bilibili' | 'kuaishou' | 'shipinhao' | 'weibo';
export type TimeRange = 'today' | 'week' | 'month' | 'quarter';
export type SortField = 'likeCount' | 'commentCount' | 'shareCount';

export interface TrendingFilterState {
  platforms: TrendingPlatform[];
  industry: string;
  timeRange: TimeRange;
  sort: SortField;
  search: string;
}

interface TrendingFiltersProps {
  filters: TrendingFilterState;
  onChange: (filters: TrendingFilterState) => void;
}

const PLATFORM_OPTIONS: Array<{ key: TrendingPlatform; label: string; icon: string }> = [
  { key: 'douyin', label: '抖音', icon: '📱' },
  { key: 'xiaohongshu', label: '小红书', icon: '📕' },
  { key: 'bilibili', label: 'B站', icon: '📺' },
  { key: 'kuaishou', label: '快手', icon: '🎬' },
  { key: 'shipinhao', label: '视频号', icon: '📹' },
  { key: 'weibo', label: '微博', icon: '🌐' },
];

const TIME_OPTIONS: Array<{ value: TimeRange; label: string }> = [
  { value: 'today', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'quarter', label: '最近 3 月' },
];

const SORT_OPTIONS: Array<{ value: SortField; label: string }> = [
  { value: 'likeCount', label: '按点赞' },
  { value: 'commentCount', label: '按评论' },
  { value: 'shareCount', label: '按转发' },
];

export function TrendingFilters({ filters, onChange }: TrendingFiltersProps) {
  function togglePlatform(platform: TrendingPlatform) {
    const next = filters.platforms.includes(platform)
      ? filters.platforms.filter((p) => p !== platform)
      : [...filters.platforms, platform];
    onChange({ ...filters, platforms: next });
  }

  return (
    <div
      className="bg-surface-container rounded-lg border border-outline-variant p-4 mb-4 flex flex-col gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
      data-testid="trending-filters"
    >
      {/* Row 1: Platform + Secondary filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Platform chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-label-sm font-label text-on-surface-variant uppercase mr-1">监控平台</span>
          {PLATFORM_OPTIONS.map(({ key, label, icon }) => {
            const active = filters.platforms.includes(key);
            return (
              <Button
                key={key}
                variant={active ? 'default' : 'outline'}
                size="sm"
                className="rounded-full h-7 px-3 text-xs gap-1"
                onClick={() => togglePlatform(key)}
                data-testid={`platform-filter-${key}`}
                data-active={active}
              >
                <span>{icon}</span>
                {label}
              </Button>
            );
          })}
        </div>

        {/* Secondary: time + sort */}
        <div className="flex items-center gap-3">
          <Select
            value={filters.timeRange}
            onValueChange={(v) => onChange({ ...filters, timeRange: v as TimeRange })}
          >
            <SelectTrigger className="w-32 h-8 text-xs" data-testid="time-range-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.sort}
            onValueChange={(v) => onChange({ ...filters, sort: v as SortField })}
          >
            <SelectTrigger className="w-28 h-8 text-xs" data-testid="sort-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2: Industry + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <IndustryDropdown
          value={filters.industry || undefined}
          onValueChange={(v) => onChange({ ...filters, industry: v === 'all' ? '' : v })}
          placeholder="全行业"
          className="w-48 h-8 text-xs"
        />

        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="搜索关键词..."
            className="pl-8 h-8 text-xs"
            data-testid="search-input"
          />
        </div>
      </div>
    </div>
  );
}
