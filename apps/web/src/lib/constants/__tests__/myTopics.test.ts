/**
 * myTopics constants unit tests · sally 1:1 复刻版
 * Phase-2: 筛选维度对齐后端 source · 4 个 filter
 * icon 字段已删(禁 lucide · 页面用 Material Symbols FILTER_ICON)
 * 4-5 it · MY_TOPICS_FILTERS 4 长度 + 字面锁
 */
import { describe, expect, it } from 'vitest';

import {
  MY_TOPICS_BACK,
  MY_TOPICS_BACK_HREF,
  MY_TOPICS_BREADCRUMB,
  MY_TOPICS_COPY_ALL,
  MY_TOPICS_CTA_HREF,
  MY_TOPICS_DOWNLOAD_TXT,
  MY_TOPICS_EMPTY_CTA,
  MY_TOPICS_EMPTY_DESC,
  MY_TOPICS_EMPTY_TITLE,
  MY_TOPICS_FILTERS,
  MY_TOPICS_H1,
  MY_TOPICS_SEARCH_PLACEHOLDER,
  MY_TOPICS_SUBTITLE,
  MY_TOPICS_TOAST_COPY,
  MY_TOPICS_TOAST_COPY_SUCCESS,
  MY_TOPICS_TOAST_DOWNLOAD,
  MY_TOPICS_TOAST_DOWNLOAD_SUCCESS,
} from '@/lib/constants/myTopics';

describe('myTopics constants · sally 1:1 字面锁', () => {
  // ── MY_TOPICS_FILTERS ────────────────────────────────────────────────────────

  it('MY_TOPICS_FILTERS 长度为 4', () => {
    expect(MY_TOPICS_FILTERS).toHaveLength(4);
  });

  it('MY_TOPICS_FILTERS key 序列', () => {
    expect(MY_TOPICS_FILTERS.map((f) => f.key)).toEqual([
      'all', 'step5', 'trending', 'manual',
    ]);
  });

  it('MY_TOPICS_FILTERS label 字面', () => {
    expect(MY_TOPICS_FILTERS.map((f) => f.label)).toEqual([
      '全部', '选题策划', '热点收藏', '手动添加',
    ]);
  });

  it('MY_TOPICS_FILTERS 无 icon 字段(禁 lucide · 用 Material Symbols)', () => {
    for (const f of MY_TOPICS_FILTERS) {
      expect(f).not.toHaveProperty('icon');
    }
  });

  // ── 字面锁 ────────────────────────────────────────────────────────────────────

  it('全局字面 const 完整验收(全角标点 + href)', () => {
    expect(MY_TOPICS_BACK).toBe('返回爆款选题');
    expect(MY_TOPICS_BREADCRUMB).toBe('MY TOPICS');
    expect(MY_TOPICS_H1).toBe('我的选题库');
    expect(MY_TOPICS_SUBTITLE).toBe('你收藏的所有爆款选题都在这里，支持按类型筛选、一键导出和生成文案。');
    expect(MY_TOPICS_SEARCH_PLACEHOLDER).toBe('搜索选题标题...');
    expect(MY_TOPICS_COPY_ALL).toBe('复制全部');
    expect(MY_TOPICS_DOWNLOAD_TXT).toBe('下载TXT');
    expect(MY_TOPICS_EMPTY_TITLE).toBe('还没有收藏任何选题');
    expect(MY_TOPICS_EMPTY_DESC).toBe('去爆款选题页面生成选题，点击红心即可收藏');
    expect(MY_TOPICS_EMPTY_CTA).toBe('去生成选题');
    expect(MY_TOPICS_TOAST_COPY).toBe('暂无选题可复制');
    expect(MY_TOPICS_TOAST_DOWNLOAD).toBe('暂无选题可下载');
    expect(MY_TOPICS_BACK_HREF).toBe('/step/5');
    expect(MY_TOPICS_CTA_HREF).toBe('/step/5');
  });

  it('toast success 文案 · MY_TOPICS_TOAST_COPY_SUCCESS 含计数 + DOWNLOAD_SUCCESS', () => {
    expect(MY_TOPICS_TOAST_COPY_SUCCESS(5)).toBe('已复制 5 条选题');
    expect(MY_TOPICS_TOAST_COPY_SUCCESS(0)).toBe('已复制 0 条选题');
    expect(MY_TOPICS_TOAST_DOWNLOAD_SUCCESS).toBe('已下载 my-topics.txt');
  });
});
