import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Step7ElementMultiSelect } from '@/components/step7/Step7ElementMultiSelect';
import { Step7ScriptTypeSearch } from '@/components/step7/Step7ScriptTypeSearch';
import { LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  STEP7_BUTTON_GENERATE,
  STEP7_BUTTON_GO_MY_TOPICS,
  STEP7_BUTTON_GO_STEP5,
  STEP7_BUTTON_OPTIMIZE,
  STEP7_H1,
  STEP7_LOADING_TEXT,
  STEP7_OPTIMIZE_LABEL,
  STEP7_OPTIMIZE_PLACEHOLDER,
  STEP7_SCRIPT_TYPES_20,
  STEP7_STEP_TAG,
  STEP7_SUBTITLE,
  STEP7_TEXTAREA,
} from '@/lib/constants/step7';

const LS_STEP7 = 'acc_step7';
const LS_STEP5_SELECTED_TOPIC = 'acc_step5_selected_topic';

interface MockResult {
  script_type: string;
  title: string;
  body: {
    topic_hook: string;
    pros_arguments: string;
    cons_arguments: string;
    my_stance: string;
    comment_guide: string;
    topic_tags: string[];
  };
}

function generateMockResult(scriptId: string, topic: string): MockResult {
  const script = STEP7_SCRIPT_TYPES_20.find((s) => s.id === scriptId);
  return {
    script_type: scriptId,
    title: `${script?.name ?? ''} · ${topic.slice(0, 20)}`,
    body: {
      topic_hook: `关于"${topic.slice(0, 30)}"，你是否好奇…`,
      pros_arguments: '正方观点：支持者认为这是趋势所向，有大量案例支撑',
      cons_arguments: '反方观点：质疑者认为存在认知误区，不可一概而论',
      my_stance: '我的立场：基于数据与实操，理性支持正方核心论点',
      comment_guide: '你怎么看？评论区聊聊，期待你的观点！',
      topic_tags: ['#内容创作', '#干货分享', '#IP起号'],
    },
  };
}

export default function Step7() {
  const navigate = useNavigate();

  const [selectedScriptId, setSelectedScriptId] = useState<string>(
    STEP7_SCRIPT_TYPES_20[0]!.id
  );
  const [selectedElements, setSelectedElements] = useState<Set<string>>(new Set());
  const [topic, setTopic] = useState('');
  const [optimize, setOptimize] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<MockResult | null>(null);

  useEffect(() => {
    try {
      const acc5 = JSON.parse(
        localStorage.getItem(LS_STEP5_SELECTED_TOPIC) ?? '{}'
      ) as { title?: string };
      if (acc5?.title) setTopic(acc5.title);
    } catch {
      // ignore
    }

    try {
      const acc7 = JSON.parse(localStorage.getItem(LS_STEP7) ?? '{}') as {
        formData?: { scriptId?: string; elements?: string[]; topic?: string; optimize?: string };
        result?: MockResult;
      };
      if (acc7?.formData?.scriptId) setSelectedScriptId(acc7.formData.scriptId);
      if (acc7?.formData?.elements?.length)
        setSelectedElements(new Set(acc7.formData.elements));
      if (acc7?.formData?.topic) setTopic((prev) => prev || acc7.formData!.topic!);
      if (acc7?.formData?.optimize) setOptimize(acc7.formData.optimize);
      if (acc7?.result) setResult(acc7.result);
    } catch {
      // ignore
    }
  }, []);

  const handleToggleElement = useCallback((id: string) => {
    setSelectedElements((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const generateDisabled = isGenerating || !topic.trim();
  const optimizeDisabled = isGenerating || !result;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (generateDisabled) return;

    setIsGenerating(true);

    await new Promise<void>((r) => setTimeout(r, 3000 + Math.random() * 2000));

    const mockResult = generateMockResult(selectedScriptId, topic.trim());
    localStorage.setItem(
      LS_STEP7,
      JSON.stringify({
        formData: {
          scriptId: selectedScriptId,
          elements: Array.from(selectedElements),
          topic: topic.trim(),
          optimize: optimize.trim(),
        },
        result: mockResult,
      })
    );
    setResult(mockResult);
    setIsGenerating(false);
  }

  return (
    <main className="flex-1 container py-8">
      {/* Header */}
      <p className="text-label-sm font-label text-primary uppercase tracking-wide mb-2">
        {STEP7_STEP_TAG}
      </p>
      <h1 className="text-h1 font-display text-on-surface mb-2">{STEP7_H1}</h1>
      <p className="text-body-md text-muted-foreground mb-8">{STEP7_SUBTITLE}</p>

      {/* Form glass-card · 4 sections per spec §7.8 */}
      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="glass-card rounded-xl p-6 space-y-8 max-w-3xl"
      >
        {/* 1. 选择脚本类型 (20 选 1) */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-3">
            选择脚本类型
          </label>
          <Step7ScriptTypeSearch
            selectedId={selectedScriptId}
            onSelect={setSelectedScriptId}
          />
        </div>

        {/* 2. 选择爆款元素 (22 选 N · 4 分组) */}
        <div>
          <Step7ElementMultiSelect
            selected={selectedElements}
            onToggle={handleToggleElement}
          />
        </div>

        {/* 3. 文案主题输入 */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP7_TEXTAREA.label}
            {STEP7_TEXTAREA.required && (
              <span className="text-destructive ml-1">*</span>
            )}
          </label>
          <textarea
            required={STEP7_TEXTAREA.required}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={STEP7_TEXTAREA.placeholder}
            className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-cn resize-y"
            style={{ minHeight: '120px' }}
          />
        </div>

        {/* 4. AI 智能优化 */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP7_OPTIMIZE_LABEL}
          </label>
          <Input
            type="text"
            placeholder={STEP7_OPTIMIZE_PLACEHOLDER}
            value={optimize}
            onChange={(e) => setOptimize(e.target.value)}
          />
        </div>

        {/* 4 Buttons */}
        <div className="space-y-3">
          <Button
            type="submit"
            disabled={generateDisabled}
            className="w-full bg-gradient-to-r from-primary to-primary/80"
          >
            {STEP7_BUTTON_GENERATE}
          </Button>

          <Button
            type="button"
            variant="secondary"
            disabled={optimizeDisabled}
            className="w-full"
            onClick={() => {
              // US-011b implements optimize output
            }}
          >
            {STEP7_BUTTON_OPTIMIZE}
          </Button>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="link"
              className="flex-1"
              onClick={() => void navigate('/my-topics')}
            >
              {STEP7_BUTTON_GO_MY_TOPICS}
            </Button>
            <Button
              type="button"
              variant="link"
              className="flex-1"
              onClick={() => void navigate('/step/5')}
            >
              {STEP7_BUTTON_GO_STEP5}
            </Button>
          </div>
        </div>
      </form>

      {isGenerating && (
        <div className="mt-8 max-w-3xl">
          <LoadingState text={STEP7_LOADING_TEXT} size="lg" />
        </div>
      )}

      {/* Output area — US-011b implements output modules */}
      {result && !isGenerating && (
        <section id="step7-output" className="mt-8 max-w-3xl" />
      )}
    </main>
  );
}
