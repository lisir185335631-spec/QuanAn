/**
 * CopywritingForm — 文案工作室左侧输入面板 · PRD-15 US-002 AC-2
 * 字段: topic textarea + platform select(6) + scriptType select(20) +
 *       elements checkbox group(22, 4 组) + additionalContext textarea
 */

import { HOT_ELEMENT_GROUPS, HOT_ELEMENT_LABELS } from '@quanqn/schemas/specialist-io';
import { useEffect, useRef, type ChangeEvent } from 'react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HOT_ELEMENTS_ZH } from '@/lib/constants/hotElementsZh';
import { SCRIPT_TYPE_LABELS } from '@/lib/constants/scripts';

export type Platform =
  | 'xiaohongshu'
  | 'douyin'
  | 'shipinhao'
  | 'kuaishou'
  | 'bilibili'
  | 'weibo';

const COPYWRITING_PLATFORMS: Array<{ key: Platform; label: string }> = [
  { key: 'xiaohongshu', label: '📕 小红书' },
  { key: 'douyin', label: '📱 抖音' },
  { key: 'shipinhao', label: '📺 视频号' },
  { key: 'kuaishou', label: '🎬 快手' },
  { key: 'bilibili', label: '📺 B站' },
  { key: 'weibo', label: '🌐 微博' },
];

export interface CopywritingFormValues {
  topic: string;
  platform: Platform;
  scriptType: string;
  elements: string[];
  additionalContext: string;
}

interface CopywritingFormProps {
  values: CopywritingFormValues;
  onChange: (values: CopywritingFormValues) => void;
  onSubmit: (values: CopywritingFormValues) => void;
  isPending: boolean;
}

const GROUP_LABELS = {
  psychological: '心理唤起',
  social: '社会心理',
  rhetoric: '修辞结构',
  information: '信息密度',
} as const;

void HOT_ELEMENT_LABELS; // imported for type consistency · display via HOT_ELEMENTS_ZH

export function CopywritingForm({ values, onChange, onSubmit, isPending }: CopywritingFormProps) {
  const topicRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    topicRef.current?.focus();
  }, []);

  function set<K extends keyof CopywritingFormValues>(key: K, val: CopywritingFormValues[K]) {
    onChange({ ...values, [key]: val });
  }

  function toggleElement(el: string) {
    const next = values.elements.includes(el)
      ? values.elements.filter((e) => e !== el)
      : [...values.elements, el];
    set('elements', next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (values.topic.trim().length < 10) return;
    if (values.elements.length === 0) return;
    onSubmit(values);
  }

  const topicError = values.topic.length > 0 && values.topic.trim().length < 10;
  const canSubmit =
    values.topic.trim().length >= 10 &&
    values.elements.length > 0 &&
    values.scriptType !== '' &&
    !isPending;

  return (
    <form
      className="flex flex-col h-full"
      onSubmit={handleSubmit}
      data-testid="copywriting-form"
    >
      <ScrollArea className="flex-1 pr-1">
        <div className="space-y-5 p-1">
          {/* Topic */}
          <div className="space-y-1.5">
            <label className="text-body-sm font-medium text-on-surface">
              主题 / 话题
              <span className="text-error ml-0.5">*</span>
              <span className="ml-1 text-body-xs text-muted-foreground">（≥10 字）</span>
            </label>
            <textarea
              ref={topicRef}
              rows={3}
              className={`w-full rounded-md border bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none ${topicError ? 'border-error focus:ring-error' : 'border-border'}`}
              placeholder="例如：如何在30天内提升小红书账号涨粉速度"
              value={values.topic}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => set('topic', e.target.value)}
              data-testid="topic-textarea"
            />
            {topicError && (
              <p className="text-body-xs text-error">主题至少需要 10 个字</p>
            )}
          </div>

          {/* Platform */}
          <div className="space-y-1.5">
            <label className="text-body-sm font-medium text-on-surface">
              目标平台
              <span className="text-error ml-0.5">*</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {COPYWRITING_PLATFORMS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => set('platform', p.key)}
                  className={`rounded-md border px-2 py-1.5 text-body-xs text-center transition-colors ${
                    values.platform === p.key
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-surface-container text-on-surface-variant hover:border-primary/50'
                  }`}
                  data-testid={`platform-btn-${p.key}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Script Type */}
          <div className="space-y-1.5">
            <label htmlFor="scriptType-select" className="text-body-sm font-medium text-on-surface">
              脚本类型
              <span className="text-error ml-0.5">*</span>
            </label>
            <select
              id="scriptType-select"
              className="w-full rounded-md border border-border bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              value={values.scriptType}
              onChange={(e) => set('scriptType', e.target.value)}
              data-testid="scripttype-select"
            >
              <option value="" disabled>请选择脚本类型</option>
              {Object.entries(SCRIPT_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Elements */}
          <div className="space-y-2">
            <label className="text-body-sm font-medium text-on-surface">
              核心元素
              <span className="text-error ml-0.5">*</span>
              <span className="ml-1 text-body-xs text-muted-foreground">（选 1-8 个）</span>
            </label>
            {HOT_ELEMENT_GROUPS.map((group) => (
              <div key={group.key} className="space-y-1">
                <p className="text-body-xs text-muted-foreground font-medium">
                  {GROUP_LABELS[group.key as keyof typeof GROUP_LABELS] ?? group.key}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.keys.map((el) => {
                    const selected = values.elements.includes(el);
                    return (
                      <button
                        key={el}
                        type="button"
                        onClick={() => toggleElement(el)}
                        className={`rounded-full px-2.5 py-0.5 text-body-xs transition-colors border ${
                          selected
                            ? 'bg-primary/15 border-primary text-primary'
                            : 'bg-surface-container border-border text-on-surface-variant hover:border-primary/50'
                        }`}
                        data-testid={`element-btn-${el}`}
                      >
                        {HOT_ELEMENTS_ZH[el as keyof typeof HOT_ELEMENTS_ZH] ?? el}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Additional Context */}
          <div className="space-y-1.5">
            <label className="text-body-sm font-medium text-on-surface">
              补充说明
              <span className="ml-1 text-body-xs text-muted-foreground">（可选）</span>
            </label>
            <textarea
              rows={2}
              className="w-full rounded-md border border-border bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="品牌调性、目标用户、特别要求…"
              value={values.additionalContext}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                set('additionalContext', e.target.value)
              }
              data-testid="additional-context-textarea"
            />
          </div>
        </div>
      </ScrollArea>

      <div className="pt-4 pb-1">
        <Button
          type="submit"
          disabled={!canSubmit}
          className="w-full gap-2"
          data-testid="submit-btn"
        >
          {isPending ? (
            <>
              <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              生成中…
            </>
          ) : (
            '✨ 生成爆款文案'
          )}
        </Button>
      </div>
    </form>
  );
}
