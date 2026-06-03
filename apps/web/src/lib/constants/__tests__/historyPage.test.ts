/**
 * historyPage constants unit tests · sally 1:1 复刻
 * 4-5 it · HISTORY_MOCK 4 长度 + 字面锁
 */
import { Copy, Eye, Trash2 } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import {
  HISTORY_ACTIONS,
  HISTORY_H1,
  HISTORY_MOCK,
  HISTORY_SUBTITLE_TPL,
  HISTORY_TOAST_COPY,
  HISTORY_TOAST_DELETE,
  HISTORY_TOAST_VIEW,
  HISTORY_TOPIC_PREFIX,
} from '@/lib/constants/historyPage';

describe('historyPage constants · sally 1:1 字面锁', () => {
  it('HISTORY_MOCK 长度为 4', () => {
    expect(HISTORY_MOCK).toHaveLength(4);
  });

  it('HISTORY_MOCK id 序列 + scriptType', () => {
    expect(HISTORY_MOCK.map((e) => e.id)).toEqual(['h1', 'h2', 'h3', 'h4']);
    expect(HISTORY_MOCK[0]!.scriptType).toBe('搞辩论');
    expect(HISTORY_MOCK[1]!.scriptType).toBe('搞辩论');
    expect(HISTORY_MOCK[2]!.scriptType).toBe('讲故事');
    expect(HISTORY_MOCK[3]!.scriptType).toBe('讲故事');
  });

  it('HISTORY_MOCK 所有 entry topic 字面', () => {
    HISTORY_MOCK.forEach((e) => {
      expect(e.topic).toBe('为什么有的人赚钱那么轻松');
    });
  });

  it('HISTORY_ACTIONS 3 枚 + icon 类型映射', () => {
    expect(HISTORY_ACTIONS).toHaveLength(3);
    expect(HISTORY_ACTIONS[0]!.key).toBe('view');
    expect(HISTORY_ACTIONS[0]!.icon).toBe(Eye);
    expect(HISTORY_ACTIONS[1]!.key).toBe('copy');
    expect(HISTORY_ACTIONS[1]!.icon).toBe(Copy);
    expect(HISTORY_ACTIONS[2]!.key).toBe('delete');
    expect(HISTORY_ACTIONS[2]!.icon).toBe(Trash2);
  });

  it('全局字面 const 完整验收(全角标点 · 全角空格)', () => {
    expect(HISTORY_H1).toBe('历史记录');
    expect(HISTORY_SUBTITLE_TPL(4)).toBe(
      '查看和管理你生成的所有文案　（共 4 条）',
    );
    expect(HISTORY_TOPIC_PREFIX).toBe('主题：');
    expect(HISTORY_TOAST_VIEW).toBe('查看详情');
    expect(HISTORY_TOAST_COPY).toBe('已复制');
    expect(HISTORY_TOAST_DELETE).toBe('已删除');
  });
});
