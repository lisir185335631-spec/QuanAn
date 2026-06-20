// PRD-37 US-P07 · parse-engine 真实解析 smoke
// Opus 亲核补:既有 parse-engine.test 把 3 个库 mock 了(只验路由),本文件用真实
// 可构造的 buffer(txt/md/xlsx round-trip)真跑解析引擎,验证库 API 集成正确(非 mock)。
// PDF/docx 真实 binary fixture 难构造 → 留 US-P08 上传真文件端到端验。
import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';

import { parseFileBuffer } from '../parse-engine';

describe('parse-engine REAL round-trip smoke (非 mock·真跑库)', () => {
  it('TXT 真解析 → 原文', async () => {
    const r = await parseFileBuffer(Buffer.from('你好 hello 产品介绍文本', 'utf-8'), 'text/plain', 'a.txt');
    expect(r).toContain('hello');
    expect(r).toContain('产品介绍文本');
  });

  it('MD 真解析 → 原文', async () => {
    const r = await parseFileBuffer(Buffer.from('# 标题\n正文内容ABC', 'utf-8'), 'text/markdown', 'a.md');
    expect(r).toContain('正文内容ABC');
  });

  it('XLSX 真解析 (write→parse round-trip·验真库 API)', async () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['产品', '价格'],
      ['面膜礼盒', '99'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    const r = await parseFileBuffer(
      buf,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'products.xlsx',
    );
    expect(r).toContain('面膜礼盒');
    expect(r).toContain('99');
  });
});
