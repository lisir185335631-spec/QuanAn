/**
 * AcquisitionVideoResult — /acquisition-video 工具页结果渲染 · PRD-6 US-006
 * Accepts AcquisitionVideoHistoryRow (content: string JSON) from trpc.acquisitionVideo.generate
 * JSON.parse(data.content) → { script, ctaScript, conversionPath, keyMessages }
 * ★ ctaScript 高亮卡片 (背景色突出 + '转化指令' 标题)
 * 转化路径有序列表 (conversionPath + keyMessages ordered list)
 * JSON.parse fail → "解析失败"
 */

import { Card, CardContent } from '@/components/ui/card';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AcquisitionContentData {
  script?: string;
  ctaScript?: string;
  conversionPath?: string;
  keyMessages?: string[];
}

interface AcquisitionVideoResultProps {
  data: unknown;
}

// ── Main component ────────────────────────────────────────────────────────────

export function AcquisitionVideoResult({ data }: AcquisitionVideoResultProps) {
  const row = (data ?? {}) as { content?: string };

  let parsed: AcquisitionContentData | null = null;
  let parseError = false;
  try {
    if (row.content) {
      parsed = JSON.parse(row.content) as AcquisitionContentData;
    }
  } catch {
    parseError = true;
  }

  if (parseError) {
    return (
      <div
        className="rounded-lg border border-error bg-error/5 p-4"
        role="alert"
        data-testid="acquisition-video-parse-error"
      >
        <p className="text-body-sm text-error">解析失败</p>
      </div>
    );
  }

  if (!parsed) {
    return (
      <div className="rounded-lg border border-border bg-surface-container p-4" data-testid="tool-result-acquisition-video">
        <p className="text-body-sm text-muted-foreground text-center py-4">暂无结果</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="tool-result-acquisition-video">
      {/* Video script card */}
      {parsed.script && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-body-md font-semibold text-on-surface mb-4">视频脚本</h3>
            <p
              className="text-body-sm text-on-surface whitespace-pre-line leading-relaxed"
              data-testid="acquisition-video-script"
            >
              {parsed.script}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ★ CTA highlighted card — 背景色突出 + '转化指令' 标题 */}
      {parsed.ctaScript && (
        <Card
          className="border-primary bg-primary/10"
          data-testid="acquisition-video-cta-card"
        >
          <CardContent className="pt-6">
            <h3 className="text-body-md font-semibold text-primary mb-3">转化指令</h3>
            <p className="text-body-sm text-on-surface font-medium">{parsed.ctaScript}</p>
          </CardContent>
        </Card>
      )}

      {/* Conversion path + keyMessages ordered list */}
      {(parsed.conversionPath ?? (parsed.keyMessages && parsed.keyMessages.length > 0)) && (
        <Card data-testid="acquisition-video-conversion-path">
          <CardContent className="pt-6">
            <h3 className="text-body-md font-semibold text-on-surface mb-3">转化路径</h3>
            {parsed.conversionPath && (
              <p className="text-body-sm text-on-surface mb-3">{parsed.conversionPath}</p>
            )}
            {parsed.keyMessages && parsed.keyMessages.length > 0 && (
              <ol className="space-y-2 list-decimal list-inside">
                {parsed.keyMessages.map((msg, i) => (
                  <li key={i} className="text-body-sm text-on-surface">
                    {msg}
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
