import { type FormEvent, useEffect, useState } from 'react';

import Step4bOutputContent from '@/components/step4b/Step4bOutputContent';
import type { Step4bResult } from '@/components/step4b/Step4bOutputContent';
import { EmptyState, LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  STEP4B_BUTTON_GENERATE,
  STEP4B_BUTTON_OPTIMIZE,
  STEP4B_BUTTON_REGENERATE,
  STEP4B_H1,
  STEP4B_INPUTS_3,
  STEP4B_LOADING_TEXT,
  STEP4B_PRODUCT_TYPES_4,
  STEP4B_STEP_TAG,
  STEP4B_SUBTITLE_TEMPLATE,
  STEP4B_TEXTAREA,
  STEP4B_THREE_STAGES,
} from '@/lib/constants/step4b';
import { cn } from '@/lib/utils';

const LS_STEP1 = 'acc_step1';
const LS_STEP4B = 'acc_step4b';

export interface Step4bFormData {
  product_description: string;
  target_audience: string;
  ip_positioning: string;
  current_income: string;
}

type GenState = 'idle' | 'generating' | 'optimizing' | 'regenerating';

function readStep1Industry(): string {
  try {
    const raw = localStorage.getItem(LS_STEP1);
    if (raw) {
      const parsed = JSON.parse(raw) as { industry?: string };
      return parsed.industry ?? '你的行业';
    }
  } catch {
    // ignore parse errors
  }
  return '你的行业';
}

function generateMockResult(formData: Step4bFormData): Step4bResult {
  return {
    market_analysis: {
      industry: readStep1Industry(),
      marketSize: '千亿级市场，年增速 12%-18%',
      competitionLevel: '中高竞争，头部 IP 占 80% 流量',
      monetizationPotential: '★★★★★ 极强 · 复购率高 · 客单价弹性大',
    },
    three_stages: [
      {
        range: STEP4B_THREE_STAGES[0].range,
        title: STEP4B_THREE_STAGES[0].title,
        duration: STEP4B_THREE_STAGES[0].duration,
        coreStrategy: '先积累 100 个精准案例，验证产品-市场 fit，建立私域流量池',
        productMatrix: [
          {
            type: STEP4B_PRODUCT_TYPES_4[0],
            name: '9.9 元诊断报告',
            priceRange: '9.9元',
            targetCustomer: '初阶用户',
            monthlyTarget: '200份',
            monthlyRevenue: '1980元',
          },
          {
            type: STEP4B_PRODUCT_TYPES_4[1],
            name: '199元体验课',
            priceRange: '199元',
            targetCustomer: '意向强用户',
            monthlyTarget: '50份',
            monthlyRevenue: '9950元',
          },
          {
            type: STEP4B_PRODUCT_TYPES_4[2],
            name: '1980元精修班',
            priceRange: '1980-3000元',
            targetCustomer: '核心客户',
            monthlyTarget: '15人',
            monthlyRevenue: '29700元',
          },
          {
            type: STEP4B_PRODUCT_TYPES_4[3],
            name: 'VIP 私教',
            priceRange: '9800元/季',
            targetCustomer: '高净值用户',
            monthlyTarget: '3人',
            monthlyRevenue: '29400元',
          },
        ],
        trafficStrategy: `抖音短视频 + 小红书图文 · 结合「${formData.product_description.slice(0, 10)}」场景，每日 1 条干货引导私信咨询`,
        conversionFlow: ['刷到内容', '主页了解', '私信咨询', '免费诊断', '购买体验课', '升级正课'],
        keyActions: [
          '每周产出 5 条干货内容，聚焦一个核心痛点',
          '建立 1 个微信群，提供免费答疑服务',
          '积累 50 个付费学员案例，制作结果截图',
          '月度直播 2 次，分享真实学员成果',
        ],
        risks: ['初期变现慢，需 3-6 个月积累才能稳定出单', '内容同质化严重，差异化表达是关键'],
      },
      {
        range: STEP4B_THREE_STAGES[1].range,
        title: STEP4B_THREE_STAGES[1].title,
        duration: STEP4B_THREE_STAGES[1].duration,
        coreStrategy: '团队化运营 + 标准化课程体系，启动分销与代理合作',
        productMatrix: [
          {
            type: STEP4B_PRODUCT_TYPES_4[0],
            name: '免费电子书/直播',
            priceRange: '0元',
            targetCustomer: '泛流量',
            monthlyTarget: '1000份',
            monthlyRevenue: '引流价值',
          },
          {
            type: STEP4B_PRODUCT_TYPES_4[1],
            name: '399元工作坊',
            priceRange: '399元',
            targetCustomer: '有需求用户',
            monthlyTarget: '200人',
            monthlyRevenue: '79800元',
          },
          {
            type: STEP4B_PRODUCT_TYPES_4[2],
            name: '9800元年度课',
            priceRange: '9800元',
            targetCustomer: '深度学习者',
            monthlyTarget: '30人',
            monthlyRevenue: '294000元',
          },
          {
            type: STEP4B_PRODUCT_TYPES_4[3],
            name: '代理授权套餐',
            priceRange: '2-5万元/年',
            targetCustomer: '想做副业的人',
            monthlyTarget: '5人',
            monthlyRevenue: '200000元',
          },
        ],
        trafficStrategy: '矩阵账号 + KOL 合作 + 付费投流 + 社群裂变',
        conversionFlow: ['内容触达', '公众号沉淀', '社群运营', '直播转化', '成交课程', '发展代理'],
        keyActions: [
          '招募 2-3 名运营助理，内容生产标准化',
          '搭建课程 SaaS 平台，完善学员学习系统',
          '启动代理计划，首批 20 个城市代理',
          '与同频 IP 联合直播，互换流量',
        ],
        risks: ['团队管理成本增加，需建立严格 SOP', '代理质量参差不齐，品控风险较高'],
      },
      {
        range: STEP4B_THREE_STAGES[2].range,
        title: STEP4B_THREE_STAGES[2].title,
        duration: STEP4B_THREE_STAGES[2].duration,
        coreStrategy: '品牌 IP 化 + 资本运作 + 跨界生态布局',
        productMatrix: [
          {
            type: STEP4B_PRODUCT_TYPES_4[0],
            name: '品牌联名活动',
            priceRange: '0-99元',
            targetCustomer: '大众市场',
            monthlyTarget: '5000人次',
            monthlyRevenue: '品牌价值',
          },
          {
            type: STEP4B_PRODUCT_TYPES_4[1],
            name: '出版书籍/纪录片',
            priceRange: '68-168元',
            targetCustomer: '全年龄段',
            monthlyTarget: '持续销售',
            monthlyRevenue: '稳定版税',
          },
          {
            type: STEP4B_PRODUCT_TYPES_4[2],
            name: '企业定制培训',
            priceRange: '5-30万元/场',
            targetCustomer: '500强企业',
            monthlyTarget: '3-5场',
            monthlyRevenue: '600000元',
          },
          {
            type: STEP4B_PRODUCT_TYPES_4[3],
            name: 'IP 生态投资',
            priceRange: '百万级',
            targetCustomer: '机构/同行',
            monthlyTarget: '战略合作',
            monthlyRevenue: '股权回报',
          },
        ],
        trafficStrategy: '媒体矩阵 + 品牌赞助 + 行业峰会 + 国际化布局',
        conversionFlow: ['品牌曝光', '行业背书', '战略合作', '资本加持', '生态变现'],
        keyActions: [
          '启动品牌 IPO 规划，引入战略投资人',
          '出版专业著作，在主流媒体发声',
          '打造年度行业峰会，成为行业定价者',
          '孵化 3-5 个子品牌，构建 IP 矩阵生态',
        ],
        risks: ['品牌管理复杂度极高，需专业团队', '市场环境变化可能影响品牌溢价'],
      },
    ],
    revenue_structure: [
      { category: '课程/培训收入', percent: 45, description: '核心业务，高利润，可持续' },
      { category: '代理/分销收入', percent: 25, description: '规模化增长引擎，边际成本低' },
      { category: '品牌广告/赞助', percent: 20, description: '粉丝基础变现，被动收入' },
      { category: '知识产品/版权', percent: 10, description: '书籍/专栏/IP 授权，长尾价值' },
    ],
    success_cases: [
      {
        name: '张晓敏',
        type: '美容 IP',
        journey: '从美容院老板到 IP 创业，历时 18 个月',
        result: '年收入从 30 万增长至 380 万，私域 8000 人',
        insight: '专注皮肤修复垂类，差异化击败泛美容账号',
      },
      {
        name: '李健康',
        type: '健康管理师',
        journey: '线下诊所 + 线上课程双轨并行',
        result: '线上年收入 220 万，学员 1200+，复购率 62%',
        insight: '真实案例 + 数据背书 = 信任变现的最短路径',
      },
      {
        name: '王教练',
        type: '职业规划',
        journey: '500强HR出身，转型职业顾问',
        result: '18个月 0→500 万，主要客群 25-35 岁职场人',
        insight: '精准人群 + 高客单价 + 口碑裂变 = 可复制公式',
      },
      {
        name: '刘创业',
        type: '创业导师',
        journey: '连续创业者，3 次失败后总结方法论',
        result: '知识星球 3000+ 付费会员，年收入 600 万',
        insight: '失败经历反而成最强差异化：真实比成功更有说服力',
      },
      {
        name: '陈读书',
        type: '知识博主',
        journey: '普通上班族，利用碎片时间日更读书笔记',
        result: '粉丝 150 万，年收入 180 万，出版 2 本书',
        insight: '坚持 > 技巧，持续输出 1 个细分主题远好于泛泛而谈',
      },
    ],
  };
}

function generateOptimizedResult(prev: Step4bResult): Step4bResult {
  return {
    ...prev,
    market_analysis: {
      ...prev.market_analysis,
      marketSize: '万亿级蓝海市场，AI 驱动年增速 25%+',
      monetizationPotential: '★★★★★ 极强 · AI 赋能后变现效率提升 3 倍',
    },
    revenue_structure: prev.revenue_structure.map((item, i) => ({
      ...item,
      description: i === 0 ? `${item.description} · AI 优化后利润率提升 15%` : item.description,
    })),
  };
}

export default function Step4b() {
  const [formData, setFormData] = useState<Step4bFormData>({
    product_description: '',
    target_audience: '',
    ip_positioning: '',
    current_income: '',
  });
  const [genState, setGenState] = useState<GenState>('idle');
  const [result, setResult] = useState<Step4bResult | null>(null);

  const industry = readStep1Industry();
  const subtitle = STEP4B_SUBTITLE_TEMPLATE.replace('{industry}', industry);

  const isAnyLoading = genState !== 'idle';
  const hasResult = result !== null;
  const generateDisabled = hasResult || isAnyLoading || !formData.product_description.trim();
  const optimizeDisabled = !hasResult || isAnyLoading;
  const regenerateDisabled = !hasResult || isAnyLoading;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_STEP4B);
      if (raw) {
        const parsed = JSON.parse(raw) as { formData?: Step4bFormData; result?: Step4bResult };
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.result) setResult(parsed.result);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  function setField(field: keyof Step4bFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (generateDisabled) return;

    setGenState('generating');
    await new Promise<void>((r) => setTimeout(r, 3000 + Math.random() * 2000));

    const mockResult = generateMockResult(formData);
    localStorage.setItem(LS_STEP4B, JSON.stringify({ formData, result: mockResult }));
    setResult(mockResult);
    setGenState('idle');
    document.getElementById('step4b-output')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleOptimize() {
    if (optimizeDisabled || !result) return;
    setGenState('optimizing');
    await new Promise<void>((r) => setTimeout(r, 2000 + Math.random() * 1000));
    const optimized = generateOptimizedResult(result);
    localStorage.setItem(LS_STEP4B, JSON.stringify({ formData, result: optimized }));
    setResult(optimized);
    setGenState('idle');
  }

  async function handleRegenerate() {
    if (regenerateDisabled) return;
    setGenState('regenerating');
    await new Promise<void>((r) => setTimeout(r, 3000 + Math.random() * 2000));
    const fresh = generateMockResult(formData);
    localStorage.setItem(LS_STEP4B, JSON.stringify({ formData, result: fresh }));
    setResult(fresh);
    setGenState('idle');
    document.getElementById('step4b-output')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <main className="flex-1 container py-8">
      {/* Header */}
      <p className="text-label-sm font-label text-primary uppercase tracking-wide mb-2">
        {STEP4B_STEP_TAG}
      </p>
      <h1 className="text-h1 font-display text-on-surface mb-2">{STEP4B_H1}</h1>
      <p className="text-body-md text-muted-foreground mb-8">{subtitle}</p>

      {/* Form glass-card */}
      <form onSubmit={(e) => { void handleSubmit(e); }} className="glass-card rounded-xl p-6 space-y-6 max-w-2xl">
        {/* Required textarea — STEP4B_TEXTAREA */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP4B_TEXTAREA.label}
            <span className="text-destructive ml-1">*</span>
          </label>
          <textarea
            required
            value={formData.product_description}
            onChange={(e) => setField('product_description', e.target.value)}
            placeholder={STEP4B_TEXTAREA.placeholder}
            className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-cn resize-y"
            style={{ minHeight: '100px' }}
          />
        </div>

        {/* 3 optional inputs — STEP4B_INPUTS_3 */}
        {STEP4B_INPUTS_3.map((input) => (
          <div key={input.id}>
            <label className="block text-body-sm font-label text-on-surface mb-2">
              {input.label}
            </label>
            <Input
              value={formData[input.id as keyof Step4bFormData]}
              onChange={(e) => setField(input.id as keyof Step4bFormData, e.target.value)}
              placeholder={input.placeholder}
            />
          </div>
        ))}

        {/* 3 buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={generateDisabled}
            className={cn('flex-1 min-w-[140px]', !generateDisabled && 'bg-gradient-to-r from-primary to-primary/80')}
          >
            {STEP4B_BUTTON_GENERATE}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={optimizeDisabled}
            onClick={() => { void handleOptimize(); }}
            className="flex-1 min-w-[120px]"
          >
            {STEP4B_BUTTON_OPTIMIZE}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={regenerateDisabled}
            onClick={() => { void handleRegenerate(); }}
            className="flex-1 min-w-[120px]"
          >
            {STEP4B_BUTTON_REGENERATE}
          </Button>
        </div>
      </form>

      {/* Three-state feedback */}
      <div className="mt-8 max-w-2xl">
        {isAnyLoading && <LoadingState text={STEP4B_LOADING_TEXT} size="lg" />}
        {!isAnyLoading && !hasResult && (
          <EmptyState title={`提交表单后查看${STEP4B_H1}规划`} />
        )}
      </div>

      {/* Output section — 5 H3 blocks */}
      {hasResult && result && (
        <section id="step4b-output" className="mt-10 max-w-4xl">
          <Step4bOutputContent result={result} />
        </section>
      )}
    </main>
  );
}
