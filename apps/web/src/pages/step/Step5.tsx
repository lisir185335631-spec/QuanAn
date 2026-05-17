import { type FormEvent, useEffect, useState } from 'react';

import { Step5FileUpload } from '@/components/step5/Step5FileUpload';
import { Step5TopicGrid } from '@/components/step5/Step5TopicGrid';
import { EmptyState, LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  STEP5_BUTTON_GENERATE,
  STEP5_FILE_UPLOADS_2,
  STEP5_H1,
  STEP5_INPUTS_2,
  STEP5_LOADING_TEXT,
  STEP5_STEP_TAG,
  STEP5_SUBTITLE,
  STEP5_TOPICS_PER_CAT,
  type Step5Result,
  type Step5Topic,
} from '@/lib/constants/step5';

const LS_STEP1 = 'acc_step1';
const LS_STEP5 = 'acc_step5';

export interface Step5FormData {
  industry: string;
  product: string;
}

function readStep1Industry(): string {
  try {
    const raw = localStorage.getItem(LS_STEP1);
    if (raw) {
      const parsed = JSON.parse(raw) as { industry?: string };
      return parsed.industry ?? '';
    }
  } catch {
    // ignore
  }
  return '';
}

type CategoryKey = 'traffic' | 'monetize' | 'persona' | 'cognition' | 'case';

const TRAFFIC_TEMPLATES = [
  '揭秘{industry}行业最赚钱的秘密',
  '为什么{industry}从业者越来越难？',
  '{industry}小白 3 步入门指南',
  '这个{industry}技巧让我粉丝涨了 10 万',
  '普通人如何进入{industry}赚到第一桶金',
  '月薪 3000 到 3 万，我在{industry}做对了什么',
  '{industry}行业黑话大全，新人必看',
  '我是如何在{industry}做到行业 TOP 10 的',
  '{industry}创业第一年，踩过的 7 个坑',
  '一天搞定{industry}所有基础知识',
  '{industry}行业薪资真实曝光',
  '选择{industry}你需要知道的 10 件事',
  '{industry}行业最常见的 5 个误区',
  '2024 年{industry}行业最新趋势分析',
  '{industry}从业 5 年，我总结出这些规律',
  '{industry}初学者 30 天速成攻略',
  '{industry}行业，哪些细分方向最有前途？',
  '做了 3 年{industry}，这些工具必须推荐',
  '{industry}行业竞争太激烈？教你找到蓝海',
  '为什么你在{industry}努力了还是赚不到钱',
];

const MONETIZE_TEMPLATES = [
  '{industry}从业者 5 种变现方式对比',
  '靠{industry}一年赚 100 万是什么体验',
  '{industry}最快变现路径完整拆解',
  '用{industry}知识做知识付费，月入 5 万',
  '{industry}私域变现实操手册',
  '{industry}直播带货，从 0 到 10 万流水',
  '我的{industry}课程如何卖出 1000 份',
  '{industry}咨询如何定价才不亏',
  '{industry}高客单产品如何设计',
  '{industry}会员制变现模式详解',
  '做{industry}博主，广告接单攻略',
  '{industry}线上课程 vs 1v1 辅导，哪个更赚',
  '{industry}行业报告变现实录',
  '{industry}代理加盟模式拆解',
  '打造{industry}知识 IP，年收入翻 3 倍',
  '{industry}课程复购率如何做到 60%',
  '{industry}社群变现，100 人群月入 3 万',
  '{industry}定制服务如何高价成交',
  '{industry}电商变现实战笔记',
  '用{industry}副业月入 1 万，我的全流程',
];

const PERSONA_TEMPLATES = [
  '我是如何成为{industry}行业 IP 的',
  '{industry}创业故事：从小白到专家',
  '30 岁转行{industry}，是冲动还是明智？',
  '做{industry}博主 2 年的真实感受',
  '{industry}从业者的一天是怎么过的',
  '我在{industry}遭遇的最大挫折和转折',
  '{industry}行业里我最崇拜的 3 个人',
  '进入{industry}让我改变最大的一件事',
  '我的{industry}创业原点故事',
  '{industry}路上，我后悔过的 3 个决定',
  '做{industry}博主，我获得了什么失去了什么',
  '我为什么选择{industry}而不是其他行业',
  '{industry}从业 10 年老前辈的忠告',
  '普通背景的我，如何在{industry}站稳脚跟',
  '{industry}行业，帮我实现了财务自由',
  '做了{industry} IP 之后，生活有什么改变',
  '{industry}创业失败后，我重新出发了',
  '我的{industry}成长之路，分享给正在迷茫的你',
  '{industry}这条路值得走吗？我来告诉你',
  '从打工人到{industry}创业者的心路历程',
];

const COGNITION_TEMPLATES = [
  '{industry}行业的本质是什么？99% 的人不知道',
  '重新理解{industry}：它的底层逻辑是这样的',
  '{industry}高手和普通人的 5 个本质区别',
  '做{industry}最重要的能力是什么',
  '{industry}行业的 3 个底层规律',
  '你对{industry}行业的认知可能是错的',
  '{industry}成功者的思维方式解析',
  '影响{industry}结果的核心变量',
  '{industry}初学者 vs 专家的认知差距',
  '重新定义{industry}：什么是真正的高水平',
  '{industry}行业的"护城河"在哪里',
  '学{industry}之前，你需要建立这些认知',
  '{industry}行业的底层竞争逻辑',
  '从系统思维看{industry}这门生意',
  '{industry}成败的关键不是技术，而是这个',
  '{industry}行业的 3 个周期规律',
  '做{industry}为什么需要长期主义思维',
  '{industry}行业知识体系完整图谱',
  '解构{industry}：拆解顶尖高手的方法论',
  '{industry}行业机会判断的 5 个维度',
];

const CASE_TEMPLATES = [
  '我的学员在{industry}做到月入 5 万的全过程',
  '{industry}案例拆解：他是如何 0 到 1 的',
  '亲历{industry}成功变现，我总结出这 6 步',
  '一个{industry}小白的逆袭故事',
  '{industry}最典型失败案例分析，别踩这个坑',
  '复盘我在{industry}做错的 3 件事',
  '{industry}真实案例：月收入从 3000 到 30000',
  '她在{industry}用了 6 个月实现了财务自由',
  '{industry}合伙创业，我们是如何成功的',
  '帮这个{industry}学员省了 10 万弯路',
  '{industry}学员 90 天成长记录完整版',
  '2 年{industry}副业经历，真实收入全曝光',
  '{industry}案例：小城市也能做到百万 IP',
  '40 岁转行{industry}，她做到了什么',
  '同样学{industry}，为什么他比你进步快 3 倍',
  '{industry}项目复盘：从爆到冷，我学到了什么',
  '带着 5 个学员在{industry}创业，这一年发生了什么',
  '{industry}成功案例背后的不为人知的努力',
  '帮这位{industry}创业者找到核心优势的全过程',
  '{industry}社群 1 年，从 0 到 300 付费用户',
];

const CATEGORY_TEMPLATES: Record<CategoryKey, string[]> = {
  traffic: TRAFFIC_TEMPLATES,
  monetize: MONETIZE_TEMPLATES,
  persona: PERSONA_TEMPLATES,
  cognition: COGNITION_TEMPLATES,
  case: CASE_TEMPLATES,
};

const PLATFORMS: Step5Topic['platform'][] = ['抖音', '小红书', '视频号', '快手', 'B站'];
const DIFFICULTIES: Step5Topic['difficulty'][] = ['简单', '中等', '困难'];

function generateMockResult(formData: Step5FormData): Step5Result {
  const industry = formData.industry || '你的行业';
  const topics: Step5Topic[] = [];
  const categoryKeys: CategoryKey[] = ['traffic', 'monetize', 'persona', 'cognition', 'case'];

  categoryKeys.forEach((catKey) => {
    const templates = CATEGORY_TEMPLATES[catKey];
    for (let i = 0; i < STEP5_TOPICS_PER_CAT; i++) {
      const tmpl = templates[i % templates.length] ?? templates[0]!;
      const title = tmpl.replace(/{industry}/g, industry);
      const stars = (((i % 5) + 1) as Step5Topic['potential_stars']);
      const platform = (PLATFORMS[i % PLATFORMS.length] ?? '抖音') as Step5Topic['platform'];
      const difficulty = (DIFFICULTIES[i % DIFFICULTIES.length] ?? '中等') as Step5Topic['difficulty'];
      topics.push({
        id: `${catKey}-${i + 1}`,
        category: catKey,
        title,
        hook: `在${industry}行业，这个问题困扰了太多人——${title.slice(0, 12)}`,
        structure: '痛点引入 → 原因分析 → 解决方案 → 行动号召',
        formula: '标题公式：数字 + 行业词 + 结果',
        platform,
        difficulty,
        potential_stars: stars,
      });
    }
  });

  return {
    topics,
    generated_at: new Date().toISOString(),
  };
}

export default function Step5() {
  const [formData, setFormData] = useState<Step5FormData>({ industry: '', product: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<Step5Result | null>(null);

  useEffect(() => {
    const step1Industry = readStep1Industry();
    if (step1Industry) {
      setFormData((prev) => ({ ...prev, industry: step1Industry }));
    }

    try {
      const raw = localStorage.getItem(LS_STEP5);
      if (raw) {
        const parsed = JSON.parse(raw) as { formData?: Step5FormData; result?: Step5Result };
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.result) setResult(parsed.result);
      }
    } catch {
      // ignore
    }
  }, []);

  function setField(field: keyof Step5FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  const isFormValid = formData.industry.trim() !== '' && formData.product.trim() !== '';
  const generateDisabled = isGenerating || !isFormValid;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (generateDisabled) return;

    setIsGenerating(true);
    await new Promise<void>((r) => setTimeout(r, 3000 + Math.random() * 2000));

    const mockResult = generateMockResult(formData);
    localStorage.setItem(LS_STEP5, JSON.stringify({ formData, result: mockResult }));
    setResult(mockResult);
    setIsGenerating(false);
    document.getElementById('step5-output')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <main className="flex-1 container py-8">
      {/* Header */}
      <p className="text-label-sm font-label text-primary uppercase tracking-wide mb-2">
        {STEP5_STEP_TAG}
      </p>
      <h1 className="text-h1 font-display text-on-surface mb-2">{STEP5_H1}</h1>
      <p className="text-body-md text-muted-foreground mb-8">{STEP5_SUBTITLE}</p>

      {/* Form glass-card */}
      <form
        onSubmit={(e) => { void handleSubmit(e); }}
        className="glass-card rounded-xl p-6 space-y-6 max-w-2xl"
      >
        {/* 2 required text inputs */}
        {STEP5_INPUTS_2.map((input) => (
          <div key={input.id}>
            <label className="block text-body-sm font-label text-on-surface mb-2">
              {input.label}
              {input.required && <span className="text-destructive ml-1">*</span>}
            </label>
            <Input
              required={input.required}
              value={formData[input.id as keyof Step5FormData]}
              onChange={(e) => setField(input.id as keyof Step5FormData, e.target.value)}
              placeholder={input.placeholder}
            />
          </div>
        ))}

        {/* 2 optional file uploads */}
        {STEP5_FILE_UPLOADS_2.map((upload) => (
          <Step5FileUpload
            key={upload.id}
            label={upload.label}
            placeholder={upload.placeholder}
          />
        ))}

        {/* CTA button */}
        <Button
          type="submit"
          disabled={generateDisabled}
          className="w-full bg-gradient-to-r from-primary to-primary/80"
        >
          {STEP5_BUTTON_GENERATE}
        </Button>
      </form>

      {/* Three-state feedback */}
      <div className="mt-8 max-w-2xl">
        {isGenerating && <LoadingState text={STEP5_LOADING_TEXT} size="lg" />}
        {!isGenerating && !result && (
          <EmptyState title={`提交表单后生成 100 个${STEP5_H1}`} />
        )}
      </div>

      {/* Output section — topic grid with 5 tabs */}
      {result && !isGenerating && (
        <section id="step5-output" className="mt-10 max-w-5xl">
          <Step5TopicGrid result={result} />
        </section>
      )}
    </main>
  );
}
