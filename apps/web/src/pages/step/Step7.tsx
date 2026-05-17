import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Step7OutputContent from '@/components/step7/Step7OutputContent';
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
  type Step7Result,
} from '@/lib/constants/step7';

const LS_STEP7 = 'acc_step7';
const LS_STEP5_SELECTED_TOPIC = 'acc_step5_selected_topic';

interface Step7FormData {
  scriptId: string;
  elements: string[];
  topic: string;
  optimize: string;
}

// AC-6: structured mockResult · 美容院如何选购仪器示例 · 4 H4 各 100-200 字 + 评论引导 + 3 话题标签
function generateMockResult(_formData: Step7FormData): Step7Result {
  return {
    script_type: 'debate',
    title: '搞辩论 · 美容院到底该不该采购医美仪器？',
    body: {
      title: '美容院医美仪器选购辩论',
      topic_hook:
        '美容院要不要采购动辄几十万的医美仪器？很多老板纠结了好几年，有人靠它翻盘，有人靠它亏损。这个问题没有标准答案，但背后的逻辑值得每个美容院老板认真研究一遍。选对了，你是差异化竞争的赢家；选错了，设备贷款就是一座大山。',
      pros_arguments:
        '支持采购方认为：仪器是差异化竞争的核心武器。顾客教育程度越来越高，单纯手法项目溢价空间收窄。引进热门项目如光子嫩肤、热玛吉可以显著提升客单价，复购周期也从每月缩短到每季，ROI 通常在 18 个月内回本。头部门店已经靠仪器筑起护城河，不跟进只会越来越难获客。',
      cons_arguments:
        '反对方则指出：大多数美容院月流水不到 15 万，根本扛不住设备贷款压力。仪器厂商培训参差不齐，操作失误风险极高，一旦出现皮肤灼伤投诉，赔偿加口碑损失远超利润。而且同类仪器越来越同质化，价格战已经把光子等项目单价打到地板价，投资回报并不如预期。',
      my_stance:
        '我的判断：先看客群画像再决定。如果主力客户月消费已超 2000 元且有年轻化需求，采购 1 台中端仪器（20 万内）是合理的扩张。但要先签好 20 单预购协议，确认真实需求存在再落单，不要靠直觉赌。小门店优先考虑租赁或分成合作，控制前期风险。',
      comment_guide: '你们美容院有没有采购仪器？踩过哪些坑？评论区聊聊，我看到每条都会回！',
      topic_tags: ['美容院经营', '医美仪器选购', 'IP起号'],
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
  const [result, setResult] = useState<Step7Result | null>(null);

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
        result?: Step7Result;
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

    const formData: Step7FormData = {
      scriptId: selectedScriptId,
      elements: Array.from(selectedElements),
      topic: topic.trim(),
      optimize: optimize.trim(),
    };

    const mockResult = generateMockResult(formData);

    // AC-7: 跨 step localStorage · 写 acc_step7({formData, result})
    localStorage.setItem(
      LS_STEP7,
      JSON.stringify({ formData, result: mockResult }),
    );

    setResult(mockResult);
    setIsGenerating(false);
  }

  function handleRegenerate() {
    if (!result) return;
    const formData: Step7FormData = {
      scriptId: selectedScriptId,
      elements: Array.from(selectedElements),
      topic: topic.trim(),
      optimize: optimize.trim(),
    };
    const mockResult = generateMockResult(formData);
    localStorage.setItem(LS_STEP7, JSON.stringify({ formData, result: mockResult }));
    setResult(mockResult);
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

      {/* AC-7: Step7OutputContent 渲染输出区 */}
      {result && !isGenerating && (
        <section id="step7-output" className="mt-8 max-w-3xl">
          <Step7OutputContent result={result} onRegenerate={handleRegenerate} />
        </section>
      )}
    </main>
  );
}
