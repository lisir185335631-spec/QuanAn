/**
 * BoomGenerateResult — /boom-generate 工具页结果渲染 · PRD-5 US-006
 * data.content: 5 篇 candidates 以 '\n\n---\n\n' 分隔 (D-032)
 * split on '---' separator → 5 Card · grid md:grid-cols-2 · react-markdown + 字数 + copy button
 * AC-8: split 后篇数不等于 5 时提示"输出格式异常" + 显示原始 content
 * AC-9: clipboard 失败 → toast.error("复制失败 · 请手动")
 * LD-015: 0 hardcode color — all via design token classes
 */

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface BoomGenerateData {
  content?: string;
}

interface BoomGenerateResultProps {
  data: unknown;
}

export function BoomGenerateResult({ data }: BoomGenerateResultProps) {
  const d = (data ?? {}) as BoomGenerateData;
  const raw = d.content ?? '';

  if (raw.length === 0) {
    return (
      <div className="space-y-4" data-testid="tool-result-boom-generate">
        <p className="text-body-sm text-muted-foreground text-center py-8">暂无结果</p>
      </div>
    );
  }

  const candidates = raw.split(/\n*---\n*/);

  if (candidates.length !== 5) {
    return (
      <div className="space-y-4" data-testid="tool-result-boom-generate">
        <p
          className="rounded border border-border px-3 py-2 text-body-sm text-error"
          role="alert"
          data-testid="boom-format-error"
        >
          输出格式异常 · 无法拆分为 5 篇（实际：{candidates.length} 篇）
        </p>
        <div className="rounded-lg border border-border bg-surface-container p-4">
          <pre className="text-body-sm text-on-surface whitespace-pre-wrap">{raw}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="tool-result-boom-generate">
      <div className="grid md:grid-cols-2 gap-4">
        {candidates.map((candidate, i) => (
          <CandidateCard key={i} index={i} content={candidate.trim()} />
        ))}
      </div>
    </div>
  );
}

function CandidateCard({ index, content }: { index: number; content: string }) {
  const [copying, setCopying] = useState(false);
  const wordCount = content.replace(/\s+/g, '').length;

  async function handleCopy() {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(content);
      toast.success('已复制');
    } catch {
      toast.error('复制失败 · 请手动');
    } finally {
      setCopying(false);
    }
  }

  return (
    <Card data-testid={`boom-candidate-${index}`}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-body-xs font-medium text-primary">
            {index + 1}
          </span>
          <span className="text-body-xs text-muted-foreground">约 {wordCount} 字</span>
        </div>
        <article className="prose prose-sm max-w-none text-on-surface prose-headings:text-on-surface prose-p:text-muted-foreground prose-strong:text-on-surface prose-li:text-muted-foreground prose-a:text-primary">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </article>
      </CardContent>
      <CardFooter className="pt-0 pb-4">
        <Button
          variant="outline"
          size="sm"
          disabled={copying}
          onClick={() => { void handleCopy(); }}
          data-testid={`boom-copy-${index}`}
          className="w-full"
        >
          {copying ? '复制中…' : '复制'}
        </Button>
      </CardFooter>
    </Card>
  );
}
