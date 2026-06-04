// PRD-29.10 · /step/4b 变现路径 · IKB 红蓝紫渐变重构
import '@/styles/ikb-hero.css';

import { type FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { C, F } from '@/components/home/ikb/system';
import { type Step4bStage } from '@/components/step4b/Step4bStageSection';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';
import { IKBLayout } from '@/layouts/IKBLayout';
import {
  STEP4B_BUTTON_GENERATE_REAL,
  STEP4B_H1,
  STEP4B_SUBTITLE_REAL,
  STEP4B_THREE_STAGES,
} from '@/lib/constants/step4b';
import { breakSentences } from '@/lib/text';

// ── Legacy adapter types (kept for backward compat with existing tests) ───────

/** @deprecated PRD-20 schema · kept for adaptStep4bResult test compatibility */
interface LegacyStep4bStageDetail {
  range: string;
  title: string;
  duration: string;
  coreStrategy: string;
  productMatrix: unknown[];
  trafficStrategy: string;
  conversionFlow: string[];
  keyActions: string[];
  risks: string[];
}

/** @deprecated PRD-20 schema · kept for adaptStep4bResult test compatibility */
interface LegacyStep4bResult {
  market_analysis: {
    industry: string;
    marketSize: string;
    competitionLevel: string;
    monetizationPotential: string;
  };
  three_stages: [LegacyStep4bStageDetail, LegacyStep4bStageDetail, LegacyStep4bStageDetail];
  revenue_structure: Array<{
    category: string;
    percent: number;
    description: string;
  }>;
  success_cases: Array<{
    name: string;
    type: string;
    journey: string;
    result: string;
    insight: string;
  }>;
}

/** @deprecated legacy adapter · tests import this · do not remove */
export function adaptStep4bResult(
  raw: Record<string, unknown>,
  industryLabel: string,
): LegacyStep4bResult {
  const currentAnalysis = typeof raw.currentAnalysis === 'string' ? raw.currentAnalysis : '';
  const ladder = Array.isArray(raw.ladder)
    ? (raw.ladder as Array<{ stage?: string; revenue?: string; action?: string }>)
    : [];
  const rs = (raw.revenueStructure as { primary?: string; secondary?: string[] } | null) ?? {};
  const successCasesRaw = Array.isArray(raw.successCases)
    ? (raw.successCases as Array<{ title?: string; summary?: string }>)
    : [];

  function mapLadder(i: number, stageConst: (typeof STEP4B_THREE_STAGES)[number]): LegacyStep4bStageDetail {
    const lad = ladder[i] ?? {};
    return {
      range: stageConst.range,
      title: stageConst.title,
      duration: stageConst.duration,
      coreStrategy: lad.action ?? '',
      productMatrix: [],
      trafficStrategy: lad.stage ?? '',
      conversionFlow: [],
      keyActions: lad.revenue ? [`目标营收：${lad.revenue}`] : [],
      risks: [],
    };
  }

  const revCategories: LegacyStep4bResult['revenue_structure'] = [];
  if (rs.primary) {
    revCategories.push({ category: rs.primary, percent: 60, description: '主要收入来源' });
  }
  (rs.secondary ?? []).forEach((cat, i) => {
    revCategories.push({ category: cat, percent: i === 0 ? 25 : 15, description: '辅助收入来源' });
  });

  return {
    market_analysis: {
      industry: industryLabel,
      marketSize: currentAnalysis.slice(0, 200) || '待 AI 分析',
      competitionLevel: '中高竞争',
      monetizationPotential: currentAnalysis || '',
    },
    three_stages: [
      mapLadder(0, STEP4B_THREE_STAGES[0]),
      mapLadder(1, STEP4B_THREE_STAGES[1]),
      mapLadder(2, STEP4B_THREE_STAGES[2]),
    ],
    revenue_structure: revCategories,
    success_cases: successCasesRaw.map((c) => ({
      name: c.title ?? '',
      type: '',
      journey: c.summary ?? '',
      result: c.summary ?? '',
      insight: '',
    })),
  };
}

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface Step4bResult {
  // ── 市场分析 ─────────────────────────────────────────────
  marketAnalysis: {
    industryAnalysis: string;
    marketScale: string;
    competition: string;
    monetizationPotential: string;
  };

  // ── 3 阶段 ──────────────────────────────────────────────
  stages: Step4bStage[];

  // ── 收入结构 ─────────────────────────────────────────────
  revenueStructure: Array<{
    name: string;
    percentage: string;
    desc: string;
    highlight?: boolean;
  }>;

  // ── 成功案例参考 ─────────────────────────────────────────
  successCases: Array<{
    title: string;
    category: string;
    journey: string;
    outcome: string;
    insight: string;
  }>;
}

export interface Step4bFormData {
  productService: string;
  targetAudience: string;
  ipPositioning: string;
  currentIncome: string;
}

// ── Default form · PRD-29.10 · 1:1 sally ────────────────────────────────────

const DEFAULT_FORM: Step4bFormData = {
  productService: '定制智能体定价：10000-100000（根据客户需求专业定制）\n针对opc创业者：自己做ip获取流量，9800线上智能体使用和19800线下高阶段培训\n技术升级项目落地培训29800，训练营',
  targetAudience: '25-40男性',
  ipPositioning: 'ai智能体定制',
  currentIncome: '年入30万',
};

// ── Mock data · 逐字 1:1 sally zhao ─────────────────────────────────────────

function generateMockResult(): Step4bResult {
  return {
    // ── 🎯 市场分析 ────────────────────────────────────────
    marketAnalysis: {
      industryAnalysis: 'AI智能体定制与OPC创业培训',
      marketScale: 'AI技术正在爆发式增长，企业和个人对降本增效的需求巨大，尤其在重复性工作自动化方面。OPC（One Person Company）创业者对AI工具和方法论的需求也日益旺盛。市场规模难以精确估算，但增长潜力巨大。',
      competition: 'AI定制服务竞争激烈，但垂直细分领域（如特定行业、特定功能）仍有蓝海。OPC培训市场竞争同样激烈，但结合AI技术和个人实践经验的IP具有独特优势。',
      monetizationPotential: '非常高。定制化服务客单价高，培训产品可规模化。IP的个人经历（餐饮创业、负债、转型AI成功）是极佳的信任背书和故事素材，能吸引大量共鸣者。',
    },

    // ── 3 阶段 ─────────────────────────────────────────────
    stages: [
      // 📈 阶段一: 0→90万
      {
        number: 1,
        icon: 'trending',
        range: '0→90万',
        title: '起步阶段：积累案例与私域流量，验证培训模型',
        duration: '6-12个月',
        coreStrategy: '以引流品快速获取私域流量，通过信任品建立口碑和转化，同时提供定制服务积累高客单价案例。核心是把你的成功转型故事包装成引人入胜的IP。',
        productMatrix: [
          {
            category: '引流品',
            name: 'AI智能体免费体验课／9.9元《AI创业避坑指南》电子书',
            priceRange: '0-9.9元',
            targetCustomer: '对AI智能体感兴趣的企业主、希望通过AI提升效率的OPC创业者',
            monthlyTarget: '300-500人',
            monthlyRevenue: '0-5000元',
          },
          {
            category: '信任品',
            name: 'AI智能体实战训练营（初级）／《OPC AI创业加速营》',
            priceRange: '499元',
            targetCustomer: '对AI智能体有初步兴趣，想深入学习搭建和应用的OPC创业者、小企业主',
            monthlyTarget: '50-80人',
            monthlyRevenue: '2.5万-4万元',
          },
          {
            category: '利润品',
            name: '定制智能体服务（轻量版）',
            priceRange: '10000-30000元',
            targetCustomer: '有明确降本增效需求，但预算有限的小型企业主、OPC创业者',
            monthlyTarget: '1-2单',
            monthlyRevenue: '1万-6万元',
          },
        ],
        trafficStrategy: '抖音短视频（内容包括：AI智能体案例展示、AI创业避坑、个人转型故事、AI工具教学）、直播（免费体验课）、私域社群运营（提供价值、互动答疑）。',
        conversionFlow: [
          '抖音短视频/直播吸引用户 -> 引导至私域（微信群/个人号）获取引流品（免费课/电子书）',
          '私域内持续输出价值，分享案例，建立信任 -> 推出信任品（训练营）',
          '训练营内筛选高意向客户，或通过私域一对一咨询 -> 转化利润品（定制服务）',
        ],
        keyActions: [
          '每周至少发布3-5条高质量抖音短视频，内容聚焦AI应用和OPC创业经验。',
          '每月至少进行2场免费直播体验课，引导用户进入私域。',
          '持续在私域社群内分享AI最新资讯、成功案例、答疑解惑，保持活跃度。',
          '积极寻求定制服务客户，积累成功案例，并将其转化为IP内容。',
        ],
        risks: [
          '初期流量获取成本高，转化率不稳定。',
          '定制服务交付周期长，可能影响现金流。',
          '个人IP影响力不足，信任建立需要时间。',
        ],
      },

      // 💎 阶段二: 100万→1000万
      {
        number: 2,
        icon: 'diamond',
        range: '100万→1000万',
        title: '发展阶段：产品线升级，打造爆款，团队协作',
        duration: '12-24个月',
        coreStrategy: '在积累一定私域用户和成功案例后，升级产品线，推出更高客单价的利润品和后端品。开始组建核心团队，实现部分业务标准化和规模化。',
        productMatrix: [
          {
            category: '利润品',
            name: 'AI智能体系统大课／《OPC AI创业实战营》（进阶版）',
            priceRange: '1980-9800元',
            targetCustomer: '希望系统学习AI智能体开发与商业落地，或希望通过AI实现项目从0到1的OPC创业者',
            monthlyTarget: '10-20人',
            monthlyRevenue: '2万-20万元',
          },
          {
            category: '利润品',
            name: '定制智能体服务（专业版）',
            priceRange: '3万-10万元',
            targetCustomer: '有复杂业务流程优化需求，愿意投入更高预算的企业主、中大型OPC创业团队',
            monthlyTarget: '0.5-1单',
            monthlyRevenue: '1.5万-10万元',
          },
          {
            category: '后端产品',
            name: 'OPC AI创业合伙人计划／线下高阶培训',
            priceRange: '19800-29800元',
            targetCustomer: '希望深度绑定，共同发展AI事业的OPC创业者，或寻求技术升级、项目落地的学员',
            monthlyTarget: '2-5人',
            monthlyRevenue: '4万-15万元',
          },
        ],
        teamBuilding: '招聘1-2名课程助理/社群运营，负责日常答疑和社群维护；招聘1-2名技术开发人员，协助定制服务交付和课程内容迭代。',
        systemBuilding: '搭建线上课程平台，实现课程内容标准化、自动化交付；建立客户管理系统（CRM），优化客户跟进流程；制定标准化定制服务SOP，提升交付效率。',
        keyActions: [
          '优化抖音内容策略，尝试投放少量广告，扩大流量池。',
          '定期举办线上/线下高阶分享会，提升IP影响力。',
          '与行业KOL或机构合作，进行联合推广。',
          '建立完善的客户服务体系，提升用户满意度和复购率。',
          '将成功案例进行深度包装，制作成宣传材料和课程素材。',
        ],
        risks: [
          '团队管理和协作效率问题。',
          '产品线扩张可能导致精力分散。',
          '市场竞争加剧，需要持续创新保持领先。',
        ],
      },

      // 👑 阶段三: 1000万→1亿
      {
        number: 3,
        icon: 'crown',
        range: '1000万→1亿',
        title: '规模化阶段：品牌化、平台化、生态化',
        duration: '24-48个月',
        coreStrategy: '将IP打造成行业标杆，实现品牌化运营。构建AI智能体服务平台或OPC创业赋能平台，吸引更多开发者和创业者加入，形成生态。通过资本运作加速发展。',
        productMatrix: [
          {
            category: '后端产品',
            name: '企业内训／行业解决方案定制',
            priceRange: '10万-100万元',
            targetCustomer: '中大型企业、上市公司、政府机构',
            monthlyTarget: '0.1-0.3单',
            monthlyRevenue: '1万-30万元',
          },
          {
            category: '后端产品',
            name: 'AI智能体SaaS平台／OPC创业孵化器',
            priceRange: '年费1万-10万（SaaS）／股权投资（孵化器）',
            targetCustomer: '广大OPC创业者、中小企业、AI开发者',
            monthlyTarget: '平台用户增长/孵化项目',
            monthlyRevenue: '可变',
          },
          {
            category: '利润品',
            name: '私董会／资本对接服务',
            priceRange: '10万-50万元/年',
            targetCustomer: '寻求更高维度发展、资本运作的优秀OPC创业者、中小企业主',
            monthlyTarget: '0.1-0.2人',
            monthlyRevenue: '1万-10万元',
          },
        ],
        brandStrategy: '将个人IP升级为企业品牌，通过媒体公关、行业峰会、出版书籍等方式，提升品牌知名度和影响力。打造行业标准和最佳实践。',
        matrixLayout: '横向拓展AI应用领域（如：教育、医疗、金融），纵向深化AI技术研发。投资或并购相关AI技术公司或内容机构，构建AI生态矩阵。',
        keyActions: [
          '寻求A轮、B轮融资，加速平台和生态建设。',
          '组建专业的市场公关团队，提升品牌声量。',
          '与高校、科研机构合作，进行前沿技术研发。',
          '举办行业峰会，邀请行业专家，打造行业影响力。',
          '持续孵化和投资优质AI创业项目，扩大生态圈。',
        ],
        risks: [
          '市场变化快，技术迭代迅速，需保持前瞻性。',
          '团队规模扩大，管理难度增加。',
          '资本运作风险，需要专业团队支持。',
        ],
      },
    ],

    // ── 📈 收入结构 ────────────────────────────────────────
    revenueStructure: [
      {
        name: '定制智能体服务',
        percentage: '40%',
        desc: '高客单价，利润丰厚，但需要持续投入人力和技术。随着品牌影响力提升，客单价和订单量会稳步增长。',
        highlight: true,
      },
      {
        name: 'AI智能体与OPC创业培训（线上课程、训练营、线下高阶培训）',
        percentage: '35%',
        desc: '可规模化复制，边际成本低，是现金流的重要来源。通过引流品和信任品不断扩大用户基数，提升转化率。',
      },
      {
        name: '后端产品（合伙人计划、私董会、企业内训、SaaS平台）',
        percentage: '25%',
        desc: '利润天花板高，能带来长期稳定的高价值收入。需要IP的深度参与和品牌影响力。随着业务发展，这部分占比会逐渐提升。',
      },
    ],

    // ── 🏆 成功案例参考 ────────────────────────────────────
    successCases: [
      {
        title: '某AI技术IP：从个人博主到AI教育平台创始人',
        category: 'AI技术教育',
        journey: '初期通过免费AI工具教程和短视频积累粉丝 -> 推出99元入门课 -> 升级为1980元系统课程 -> 最终成立AI教育SaaS平台，提供企业内训和解决方案。',
        outcome: '从年入几十万到年营收数千万，估值过亿。',
        insight: '启示：从免费内容切入，逐步提升产品客单价和深度，最终实现平台化和品牌化。个人IP的专业性和教学能力是核心。',
      },
      {
        title: '某创业导师：从个人咨询到创业孵化器',
        category: '创业咨询/孵化',
        journey: '通过分享个人创业故事和避坑经验吸引粉丝 -> 推出99元创业社群 -> 升级为9800元创业训练营 -> 最终成立创业孵化器，提供资金和资源支持。',
        outcome: '从年入百万到年营收数千万，孵化多个成功项目。',
        insight: '启示：个人经历和实战经验是最好的信任背书。通过社群和训练营筛选高潜力学员，最终通过深度绑定（孵化器）实现更大价值。',
      },
    ],
  };
}

// ── Style tokens ──────────────────────────────────────────────────────────────

const btnSecondary =
  'ikb-focusring flex shrink-0 items-center gap-2 whitespace-nowrap rounded border border-[rgba(22,32,72,0.13)] bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest text-[#161D33] transition-colors hover:bg-[#F3F5FC] disabled:cursor-not-allowed disabled:opacity-40';

// ── Case row status helpers ───────────────────────────────────────────────────

type CaseStatus = 'best' | 'expanding' | 'init';

function getCaseStatus(index: number): CaseStatus {
  if (index === 0) return 'best';
  if (index === 1) return 'expanding';
  return 'init';
}

function CaseStatusBadge({ status }: { status: CaseStatus }) {
  if (status === 'best') {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-md border border-[#2B53E6]/20 bg-[#2B53E6]/10 px-2.5 py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-[#2B53E6]" />
        <span className="text-[11px] font-semibold text-[#2B53E6]">最佳</span>
      </div>
    );
  }
  if (status === 'expanding') {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-md border border-[#7A3BE0]/25 bg-[#7A3BE0]/10 px-2.5 py-1">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7A3BE0]" />
        <span className="text-[11px] font-semibold text-[#3A1A6E]">扩展中</span>
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(22,32,72,0.13)] bg-[#F3F5FC] px-2.5 py-1 opacity-60">
      <span className="h-1.5 w-1.5 rounded-full bg-[#6b7280]" />
      <span className="text-[11px] font-semibold text-[#6b7280]">初始化中</span>
    </div>
  );
}

// ── Stage configs · 品牌三色 ─────────────────────────────────────────────────

interface StageCfg {
  barColors: [string, string, string];
  barHeights: [number, number, number];
  labelColor: string;
  valueColor: string;
  subtitle: string;
  accentColor: string;
}

const STAGE_CONFIGS: [StageCfg, StageCfg, StageCfg] = [
  {
    barColors: ['#d1d5db', '#7A3BE0', '#2B53E6'],
    barHeights: [30, 45, 60],
    labelColor: '#6b7280',
    valueColor: '#2B53E6',
    subtitle: '初始捕获',
    accentColor: '#2B53E6',
  },
  {
    barColors: ['#7A3BE0', '#2B53E6', '#EF3E6B'],
    barHeights: [40, 70, 85],
    labelColor: '#6b7280',
    valueColor: '#2B53E6',
    subtitle: '规模与渗透',
    accentColor: '#D11E52',
  },
  {
    barColors: ['#2B53E6', '#EF3E6B', '#7A3BE0'],
    barHeights: [60, 80, 100],
    labelColor: '#2B53E6',
    valueColor: '#D11E52',
    subtitle: '生态系统主导',
    accentColor: '#3A1A6E',
  },
];

// ── Donut chart colors · 品牌三色轮转 ────────────────────────────────────────

const DONUT_COLORS = ['#2B53E6', '#EF3E6B', '#7A3BE0', '#161D33'];
const CIRCUMFERENCE = 440; // 2π × 70 ≈ 439.8 → 440

// ── 数据洞察静态数据 S4B ─────────────────────────────────────────────────────

const RADAR_DIMS_S4B = [
  { label: '获客力', value: 85, color: '#2B53E6' },
  { label: '转化率', value: 78, color: '#EF3E6B' },
  { label: '客单价', value: 92, color: '#7A3BE0' },
  { label: '复购率', value: 70, color: '#2B53E6' },
  { label: '利润率', value: 88, color: '#EF3E6B' },
  { label: '规模化', value: 74, color: '#7A3BE0' },
];

// 收入轨迹趋势 · 12个月 · 单位万
const REVENUE_TREND_S4B = [8, 15, 22, 35, 48, 60, 80, 95, 112, 135, 158, 190];
const REVENUE_LABELS_S4B = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// ── Main Component ───────────────────────────────────────────────────────────

export default function Step4b() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const { save, isSaving, dbQuery } = useStepData(accountId, 'step4b');

  const industry = readOtherStep<{ industry?: string }>(accountId, 'step1')?.industry ?? '美业';

  // PRD-29.10 · default form 1:1 sally
  const [productService, setProductService] = useState(breakSentences(DEFAULT_FORM.productService));
  const [targetAudience, setTargetAudience] = useState(DEFAULT_FORM.targetAudience);
  const [ipPositioning, setIpPositioning] = useState(DEFAULT_FORM.ipPositioning);
  const [currentIncome, setCurrentIncome] = useState(DEFAULT_FORM.currentIncome);

  const prevIsSavingRef = useRef(false);

  useEffect(() => {
    if (accountId === null) return;
    const saved = readOtherStep<Step4bFormData>(accountId, 'step4b');
    if (saved?.productService) {
      setProductService(saved.productService);
      if (saved.targetAudience) setTargetAudience(saved.targetAudience);
      if (saved.ipPositioning) setIpPositioning(saved.ipPositioning);
      if (saved.currentIncome) setCurrentIncome(saved.currentIncome);
    }
  }, [accountId]);

  useEffect(() => {
    if (prevIsSavingRef.current && !isSaving) {
      void dbQuery.refetch();
    }
    prevIsSavingRef.current = isSaving;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSaving]);

  const [isLocalGenerating, setIsLocalGenerating] = useState(false);
  const isLoading = isLocalGenerating || isSaving;

  const generated: Step4bResult = generateMockResult();
  const canBulkActions = !isLoading;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!productService.trim() || isLoading) return;
    setIsLocalGenerating(true);
    save({ productService, targetAudience, ipPositioning, currentIncome });
    setTimeout(() => { setIsLocalGenerating(false); toast.success('生成完成'); }, 1200);
  }

  function handleRegenerateAll() {
    if (!isLoading) {
      setIsLocalGenerating(true);
      setTimeout(() => { setIsLocalGenerating(false); toast.success('已重新生成'); }, 1200);
    }
  }

  function handleCopyAll() {
    void navigator.clipboard.writeText(JSON.stringify(generated, null, 2)).then(() => toast.success('已复制全部'));
  }

  function handleOptimize() {
    if (canBulkActions) toast.success('已智能优化');
  }

  function handleFeedbackUp() { toast.success('感谢反馈!'); }
  function handleFeedbackDown() { toast.info('我们会持续改进'); }

  // ── Donut segments ────────────────────────────────────────────────────────
  let cumulative = 0;
  const donutSegments = generated.revenueStructure.map((item, i) => {
    const pct = parseInt(item.percentage, 10) || 0;
    const dash = (pct / 100) * CIRCUMFERENCE;
    const offset = -(cumulative / 100) * CIRCUMFERENCE;
    cumulative += pct;
    return { ...item, pct, dash, offset, color: DONUT_COLORS[i % DONUT_COLORS.length] };
  });

  return (
    <IKBLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mb-12 flex flex-row items-center justify-between gap-8">
        <div className="shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <span
              className="rounded border px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
              style={{ borderColor: C.line, background: C.base, color: C.ink }}
            >
              战略路径
            </span>
            <span
              className="rounded border px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
              style={{ borderColor: '#7A3BE0', background: '#EEE8FC', color: '#3A1A6E' }}
            >
              增长模型
            </span>
          </div>
          <h1
            className="ikb-gradtext whitespace-nowrap text-[40px] font-extrabold tracking-tighter"
            style={{ fontFamily: F.display }}
          >
            {STEP4B_H1}
          </h1>
          <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed" style={{ color: '#5A6173' }}>
            {STEP4B_SUBTITLE_REAL.replace('{industry}', industry)}
          </p>
        </div>
        <div className="flex shrink-0 flex-nowrap gap-3">
          <button type="button" onClick={handleOptimize} disabled={!canBulkActions} className={btnSecondary} aria-label="智能优化">
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>auto_fix_high</span>
            智能优化
          </button>
          <button type="button" onClick={handleRegenerateAll} disabled={isLoading} className={btnSecondary} aria-label="重新生成">
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>refresh</span>
            重新生成
          </button>
          <button
            type="button"
            onClick={handleCopyAll}
            className="ikb-gradbtn ikb-focusring flex shrink-0 items-center gap-2 whitespace-nowrap rounded px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            aria-label="导出数据"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>download</span>
            导出数据
          </button>
        </div>
      </header>

      {/* ── 输入变现参数 card ───────────────────────────────── */}
      <section
        className="relative mb-12 overflow-hidden rounded p-6"
        style={{ background: 'linear-gradient(135deg, #FFFFFF, #F3F5FC)', border: `1px solid ${C.line}`, boxShadow: '0 2px 8px rgba(43,83,230,0.07)' }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#2B53E6]/[0.05] blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-[#EF3E6B]/[0.04] blur-2xl" />
        <div className="relative mb-6 flex items-center justify-between pb-5" style={{ borderBottom: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-3">
            <span
              className="ikb-gradbtn flex h-11 w-11 items-center justify-center rounded text-white"
              aria-hidden={true}
            >
              <span className="material-symbols-outlined" aria-hidden={true}>payments</span>
            </span>
            <div>
              <h2 className="text-[18px] font-bold" style={{ color: C.ink }}>输入变现参数</h2>
              <p className="text-[12px] text-[#6b7280]">填写基础信息 · AI 据此规划完整变现路径</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2B53E6]/10 px-3 py-1 text-[12px] font-semibold text-[#2B53E6]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2B53E6]" />
            参数就绪
          </span>
        </div>
        <div className="relative">
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* 产品/服务描述 · 框式编辑器 */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="s4b-product-service" className="flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide before:h-3.5 before:w-1 before:rounded-full before:content-['']" style={{ color: C.ink, ['--tw-before-bg' as string]: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }}>
                  <span style={{ display: 'inline-block', width: 4, height: 14, borderRadius: 2, background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})`, marginRight: 4 }} aria-hidden={true} />
                  产品/服务描述 <span className="ml-1" style={{ color: C.burgundyText }}>*</span>
                </label>
                <span className="flex items-center gap-1 text-[11px] text-[#6b7280]">
                  <span className="material-symbols-outlined text-[14px]" style={{ color: C.burgundy }} aria-hidden={true}>auto_awesome</span>
                  AI 据此测算变现潜力
                </span>
              </div>
              <div className="overflow-hidden rounded border bg-[#F3F5FC] transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-[#2B53E6]" style={{ borderColor: C.line }}>
                <textarea
                  id="s4b-product-service"
                  required
                  value={productService}
                  onChange={(e) => setProductService(e.target.value)}
                  rows={4}
                  placeholder="描述你的产品/服务，包括定价、对象、交付形式等"
                  className="ikb-input w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed"
                />
                <div className="flex items-center justify-between gap-3 bg-white/60 px-4 py-2.5" style={{ borderTop: `1px solid ${C.line}` }}>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-[#6b7280]">可包含</span>
                    {['定价', '受众', '交付', '服务范围', '培训'].map((t) => (
                      <span key={t} className="rounded-full bg-[#EEF1FE] px-2.5 py-0.5 text-[11px] font-medium" style={{ color: C.ikb }}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums text-[#6b7280]">{productService.length} 字</span>
                </div>
              </div>
            </div>

            {/* 目标受众 + IP定位 · 双列带图标 */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="s4b-target-audience" className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide" style={{ color: C.ink }}>
                  <span style={{ display: 'inline-block', width: 4, height: 14, borderRadius: 2, background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})`, marginRight: 4 }} aria-hidden={true} />
                  目标受众
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#6b7280]" aria-hidden={true}>groups</span>
                  <input
                    id="s4b-target-audience"
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="例如：25-40男性企业主"
                    className="ikb-input w-full rounded border bg-[#F3F5FC] py-3 pl-10 pr-3 text-[14px] transition-all focus:bg-white focus:ring-2 focus:ring-[#2B53E6]"
                    style={{ borderColor: C.line }}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="s4b-ip-positioning" className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide" style={{ color: C.ink }}>
                  <span style={{ display: 'inline-block', width: 4, height: 14, borderRadius: 2, background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})`, marginRight: 4 }} aria-hidden={true} />
                  IP定位
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#6b7280]" aria-hidden={true}>person_pin</span>
                  <input
                    id="s4b-ip-positioning"
                    type="text"
                    value={ipPositioning}
                    onChange={(e) => setIpPositioning(e.target.value)}
                    placeholder="例如：AI智能体定制"
                    className="ikb-input w-full rounded border bg-[#F3F5FC] py-3 pl-10 pr-3 text-[14px] transition-all focus:bg-white focus:ring-2 focus:ring-[#2B53E6]"
                    style={{ borderColor: C.line }}
                  />
                </div>
              </div>
            </div>

            {/* 当前收入水平 + 提交按钮 */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="s4b-current-income" className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide" style={{ color: C.ink }}>
                  <span style={{ display: 'inline-block', width: 4, height: 14, borderRadius: 2, background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})`, marginRight: 4 }} aria-hidden={true} />
                  当前收入水平
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#6b7280]" aria-hidden={true}>monetization_on</span>
                  <input
                    id="s4b-current-income"
                    type="text"
                    value={currentIncome}
                    onChange={(e) => setCurrentIncome(e.target.value)}
                    placeholder="例如：年入30万"
                    className="ikb-input w-full rounded border bg-[#F3F5FC] py-3 pl-10 pr-3 text-[14px] transition-all focus:bg-white focus:ring-2 focus:ring-[#2B53E6]"
                    style={{ borderColor: C.line }}
                  />
                </div>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={!productService.trim() || isLoading}
                  className="ikb-gradbtn ikb-focusring flex w-full items-center justify-center gap-2 rounded px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white transition-all active:translate-x-px active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>payments</span>
                  {isLoading ? '生成中…' : STEP4B_BUTTON_GENERATE_REAL}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* ── Loading bar ────────────────────────────────────── */}
      {isLoading && (
        <div className="mb-8 flex items-center gap-3 rounded p-4 text-[14px] font-medium" style={{ border: `1px solid ${C.ikb}30`, background: `${C.ikb}08`, color: '#2B53E6' }}>
          <span className="material-symbols-outlined animate-spin text-[20px]" aria-hidden={true}>progress_activity</span>
          正在规划变现路径…
        </div>
      )}

      {/* ── 数据洞察 band ──────────────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px]" style={{ color: C.ikb }} aria-hidden={true}>insights</span>
        <h2 className="text-[16px] font-bold" style={{ color: C.ink }}>数据洞察</h2>
        <span className="text-[12px] text-[#6b7280]">· AI 综合评估 · 实时测算</span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#2B53E6]/10 px-3 py-1 text-[12px] font-semibold text-[#2B53E6]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2B53E6]" />
          模型已就绪
        </span>
      </div>
      <div className="mb-8 grid grid-cols-12 gap-6">
        {/* 变现能力雷达 · col-span-5 */}
        <div
          className="ikb-hovercard col-span-5 rounded p-6"
          style={{ background: 'linear-gradient(135deg, #FFFFFF, #F3F5FC)', border: `1px solid ${C.line}`, boxShadow: '0 2px 8px rgba(43,83,230,0.07)' }}
        >
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded" style={{ background: `${C.ikb}15`, color: C.ikb }}>
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>radar</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold" style={{ color: C.ink }}>变现能力雷达</h3>
                <p className="text-[11px] text-[#6b7280]">六维模型评估</p>
              </div>
            </div>
            <div className="text-right">
              <p className="ikb-gradtext text-[26px] font-bold leading-none" style={{ fontFamily: F.display }}>81</p>
              <p className="text-[10px] text-[#6b7280]">综合分</p>
            </div>
          </div>
          {(() => {
            const dims = RADAR_DIMS_S4B;
            const cx = 130;
            const cy = 122;
            const R = 88;
            const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
            const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
            const poly = (r: number) => dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
            const dataPoly = dims.map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');
            return (
              <svg viewBox="0 0 260 244" className="w-full" role="img" aria-label="变现能力雷达图">
                <defs>
                  <linearGradient id="s4b-radarFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2B53E6" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="#EF3E6B" stopOpacity="0.12" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <polygon key={f} points={poly(R * f)} fill="none" stroke="#e8ebf2" strokeWidth="1" />
                ))}
                {dims.map((_, i) => {
                  const [x, y] = pt(i, R);
                  return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#eef1f6" strokeWidth="1" />;
                })}
                <polygon points={dataPoly} fill="url(#s4b-radarFill)" stroke="#2B53E6" strokeWidth="2" strokeLinejoin="round" />
                {dims.map((d, i) => {
                  const [x, y] = pt(i, R * (d.value / 100));
                  return <circle key={i} cx={x} cy={y} r="3.2" fill="#fff" stroke={d.color} strokeWidth="2" />;
                })}
                {dims.map((d, i) => {
                  const [x, y] = pt(i, R + 16);
                  return (
                    <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#6b7280" fontSize="10.5" fontWeight="600">
                      {d.label}
                    </text>
                  );
                })}
              </svg>
            );
          })()}
          <div className="mt-2 grid grid-cols-3 gap-y-2">
            {RADAR_DIMS_S4B.map((d) => (
              <div key={d.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[11px] text-[#6b7280]">{d.label}</span>
                <span className="text-[11px] font-bold" style={{ color: C.ink }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 营收增长预估 · col-span-7 */}
        <div
          className="ikb-hovercard col-span-7 rounded p-6"
          style={{ background: 'linear-gradient(135deg, #FFFFFF, #F3F5FC)', border: `1px solid ${C.line}`, boxShadow: '0 2px 8px rgba(43,83,230,0.07)' }}
        >
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded" style={{ background: `${C.burgundy}15`, color: C.burgundy }}>
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>show_chart</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold" style={{ color: C.ink }}>营收增长预估</h3>
                <p className="text-[11px] text-[#6b7280]">按当前变现矩阵测算</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {['营收', '增速', '复购'].map((t, i) => (
                <span
                  key={t}
                  className="rounded px-2.5 py-1 text-[11px] font-semibold"
                  style={i === 0 ? { background: C.grad, color: '#fff' } : { background: C.base, color: '#6b7280' }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="mb-3 flex items-end gap-3">
            <p className="text-[30px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>¥190万</p>
            <span className="mb-1 inline-flex items-center gap-0.5 rounded-full bg-[#2B53E6]/10 px-2 py-0.5 text-[12px] font-bold text-[#2B53E6]">
              <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>trending_up</span>+128%
            </span>
            <span className="mb-1 text-[12px] text-[#6b7280]">同比增长</span>
          </div>
          {(() => {
            const data = REVENUE_TREND_S4B;
            const W = 560;
            const H = 168;
            const padL = 6;
            const padR = 6;
            const padT = 12;
            const padB = 8;
            const innerW = W - padL - padR;
            const innerH = H - padT - padB;
            const max = 210;
            const x = (i: number) => padL + (innerW * i) / (data.length - 1);
            const y = (v: number) => padT + innerH * (1 - v / max);
            const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
            const area = `${line} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
            return (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="营收增长趋势图">
                <defs>
                  <linearGradient id="s4b-trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2B53E6" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#2B53E6" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="s4b-trendLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2B53E6" />
                    <stop offset="100%" stopColor="#EF3E6B" />
                  </linearGradient>
                </defs>
                {[0, 0.33, 0.66, 1].map((f) => (
                  <line
                    key={f}
                    x1={padL}
                    x2={W - padR}
                    y1={(padT + innerH * f).toFixed(1)}
                    y2={(padT + innerH * f).toFixed(1)}
                    stroke="#f1f3f9"
                    strokeWidth="1"
                  />
                ))}
                <path d={area} fill="url(#s4b-trendFill)" />
                <path d={line} fill="none" stroke="url(#s4b-trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((v, i) =>
                  i % 3 === 0 ? <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke="#2B53E6" strokeWidth="2" /> : null,
                )}
              </svg>
            );
          })()}
          <div className="mt-1 flex justify-between px-1 text-[10px] text-[#6b7280]">
            {REVENUE_LABELS_S4B.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI 卡一排 ─────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        {/* 预估年营收 · 环形 · 蓝 */}
        <div
          className="ikb-focusring ikb-hovercard rounded p-5"
          style={{ background: 'linear-gradient(135deg, #FFFFFF, #F3F5FC)', border: `1px solid ${C.line}`, boxShadow: '0 2px 8px rgba(43,83,230,0.07)' }}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded" style={{ background: `${C.ikb}15`, color: C.ikb }}>
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>monitoring</span>
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#2B53E6]/10 px-2 py-0.5 text-[11px] font-bold text-[#2B53E6]">
              <span className="material-symbols-outlined text-[13px]" aria-hidden={true}>trending_up</span>+128%
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                1,420<span className="text-[15px] text-[#6b7280]">万</span>
              </p>
              <p className="mt-1.5 text-[12px] text-[#6b7280]">预估年营收(ARR)</p>
            </div>
            <div className="h-12 w-12 shrink-0">
              <svg viewBox="0 0 36 36" className="-rotate-90" role="img" aria-label="78% 进度">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#EEF1FE" strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#2B53E6"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="78 100"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 变现渠道数 · 迷你柱 · 玫红 */}
        <div
          className="ikb-focusring ikb-hovercard rounded p-5"
          style={{ background: C.paper, border: `1px solid ${C.line}`, boxShadow: '0 1px 4px rgba(22,32,72,0.06)' }}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded" style={{ background: `${C.burgundy}15`, color: C.burgundy }}>
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>account_tree</span>
            </span>
            <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${C.burgundy}15`, color: C.burgundyText }}>已规划</span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
              {generated.revenueStructure.length}
              <span className="text-[15px] text-[#6b7280]"> 条</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">变现渠道</p>
          </div>
          <div className="mt-3 flex h-6 items-end gap-1" aria-hidden={true}>
            {[40, 70, 85, 58, 92].map((h, i) => (
              <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: `${C.burgundy}99` }} />
            ))}
          </div>
        </div>

        {/* 客单价区间 · 进度条 · 紫 */}
        <div
          className="ikb-focusring ikb-hovercard rounded p-5"
          style={{ background: C.paper, border: `1px solid ${C.line}`, boxShadow: '0 1px 4px rgba(22,32,72,0.06)' }}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded" style={{ background: `${C.accent3}18`, color: C.accent3 }}>
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>sell</span>
            </span>
            <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${C.accent3}15`, color: C.purpleText }}>高客单</span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
              1万<span className="text-[15px] text-[#6b7280]">-100万</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">客单价区间</p>
          </div>
          <div className="mt-3 h-2 w-full rounded-full" style={{ background: `${C.accent3}20` }} aria-hidden={true}>
            <div className="h-2 rounded-full" style={{ width: '82%', background: `linear-gradient(to right, ${C.ikb}, ${C.accent3})` }} />
          </div>
        </div>

        {/* 综合转化率 · 关键词 chip · 蓝 */}
        <div
          className="ikb-focusring ikb-hovercard rounded p-5"
          style={{ background: C.paper, border: `1px solid ${C.line}`, boxShadow: '0 1px 4px rgba(22,32,72,0.06)' }}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded" style={{ background: `${C.ikb}15`, color: C.ikb }}>
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>conversion_path</span>
            </span>
            <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${C.ikb}15`, color: C.ikb }}>
              {generated.stages.length} 阶段
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
              3.8<span className="text-[15px] text-[#6b7280]">%</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">综合转化率</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {['引流品', '信任品', '利润品'].map((k) => (
              <span
                key={k}
                className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{ background: '#EEF1FE', color: C.ikb }}
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main grid: 收入轨迹 + 右侧 ─────────────────────── */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left col-span-2: 收入轨迹分析 */}
        <div className="ikb-hovercard col-span-2 overflow-hidden rounded" style={{ border: `1px solid ${C.line}`, background: C.paper, boxShadow: '0 2px 8px rgba(43,83,230,0.07)' }}>
          <div className="ikb-gradbtn flex items-center justify-between px-6 py-4 text-white">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded bg-white/15">
                <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>bar_chart</span>
              </span>
              <h3 className="text-[16px] font-bold" style={{ fontFamily: F.display }}>收入轨迹分析</h3>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
              3 阶段规划
            </span>
          </div>
          <div className="space-y-6 p-6" style={{ background: C.base }}>
            {generated.stages.map((stage, idx) => {
              const cfgIdx = (idx < 3 ? idx : 0) as 0 | 1 | 2;
              const cfg: StageCfg = STAGE_CONFIGS[cfgIdx];
              return (
                <div
                  key={stage.number}
                  className="ikb-hovercard rounded p-6"
                  style={{ border: `1px solid ${C.line}`, background: C.paper, boxShadow: '0 1px 4px rgba(22,32,72,0.06)' }}
                >
                  {/* Stage header */}
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className="text-[11px] font-bold uppercase tracking-wider"
                          style={{ color: cfg.labelColor }}
                        >
                          阶段 {String(stage.number).padStart(2, '0')}
                        </span>
                        <span className="rounded border px-2 py-0.5 text-[10px] font-semibold text-[#6b7280]" style={{ borderColor: C.line, background: C.base }}>
                          {stage.duration}
                        </span>
                      </div>
                      <div
                        className="ikb-gradtext mb-1 text-[22px] font-bold leading-none"
                        style={{ fontFamily: F.display }}
                      >
                        {stage.range}
                      </div>
                      <p className="text-[13px] font-semibold" style={{ color: C.ink }}>{stage.title}</p>
                      <p
                        className="mt-0.5 text-[11px] font-semibold"
                        style={{ color: cfg.accentColor }}
                      >
                        {cfg.subtitle}
                      </p>
                    </div>
                    <div className="flex h-20 shrink-0 items-end gap-1.5" aria-hidden={true}>
                      {cfg.barColors.map((color, bi) => (
                        <div
                          key={bi}
                          className="w-4 rounded-t"
                          style={{ height: `${cfg.barHeights[bi]}%`, backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 核心策略 */}
                  <div className="mb-4 rounded p-4" style={{ border: `1px solid ${C.line}`, background: C.base }}>
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest" style={{ color: C.ikb }}>
                      <span style={{ display: 'inline-block', width: 2, height: 10, borderRadius: 1, background: C.ikb, marginRight: 2 }} aria-hidden={true} />
                      核心策略
                    </p>
                    <p className="text-[13px] leading-relaxed text-[#374151]">{stage.coreStrategy}</p>
                  </div>

                  {/* 产品矩阵 */}
                  {stage.productMatrix.length > 0 && (
                    <div className="mb-4">
                      <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest" style={{ color: C.burgundyText }}>
                        <span style={{ display: 'inline-block', width: 2, height: 10, borderRadius: 1, background: C.burgundy, marginRight: 2 }} aria-hidden={true} />
                        产品矩阵
                      </p>
                      <div className="grid grid-cols-1 gap-3">
                        {stage.productMatrix.map((product, pi) => (
                          <div
                            key={pi}
                            className="ikb-hovercard rounded p-4"
                            style={{ border: `1px solid ${C.line}`, background: C.paper, boxShadow: '0 1px 4px rgba(22,32,72,0.05)' }}
                          >
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <div>
                                <span className="rounded px-2 py-0.5 text-[10px] font-bold" style={{ background: '#EEF1FE', color: C.ikb }}>
                                  {product.category}
                                </span>
                                <p className="mt-1 text-[13px] font-semibold" style={{ color: C.ink }}>{product.name}</p>
                              </div>
                              <span className="shrink-0 rounded border px-2.5 py-1 text-[12px] font-bold" style={{ borderColor: `${C.accent3}40`, background: '#EEE8FC', color: C.purpleText }}>
                                {product.priceRange}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-[11px] text-[#6b7280]">
                              <div>
                                <span className="font-semibold text-[#374151]">目标客户</span>
                                <p className="mt-0.5 leading-relaxed">{product.targetCustomer}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-[#374151]">月目标</span>
                                <p className="mt-0.5">{product.monthlyTarget}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-[#374151]">月收入</span>
                                <p className="mt-0.5 font-semibold text-[#2B53E6]">{product.monthlyRevenue}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 流量策略 */}
                  {stage.trafficStrategy && (
                    <div className="mb-4 rounded p-4" style={{ border: `1px solid ${C.line}`, background: C.base }}>
                      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest" style={{ color: C.ikb }}>
                        <span style={{ display: 'inline-block', width: 2, height: 10, borderRadius: 1, background: C.ikb, marginRight: 2 }} aria-hidden={true} />
                        流量策略
                      </p>
                      <p className="text-[13px] leading-relaxed text-[#374151]">{stage.trafficStrategy}</p>
                    </div>
                  )}

                  {/* 转化流程 */}
                  {stage.conversionFlow && stage.conversionFlow.length > 0 && (
                    <div className="mb-4 rounded p-4" style={{ border: `1px solid ${C.line}`, background: C.base }}>
                      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest" style={{ color: C.ikb }}>
                        <span style={{ display: 'inline-block', width: 2, height: 10, borderRadius: 1, background: C.ikb, marginRight: 2 }} aria-hidden={true} />
                        转化流程
                      </p>
                      <div className="space-y-2">
                        {stage.conversionFlow.map((step, si) => (
                          <div key={si} className="flex items-start gap-2 text-[13px] leading-relaxed text-[#374151]">
                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ background: C.ikb }}>
                              {si + 1}
                            </span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 团队建设 */}
                  {stage.teamBuilding && (
                    <div className="mb-4 rounded p-4" style={{ border: `1px solid ${C.line}`, background: C.base }}>
                      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest" style={{ color: C.burgundyText }}>
                        <span style={{ display: 'inline-block', width: 2, height: 10, borderRadius: 1, background: C.burgundy, marginRight: 2 }} aria-hidden={true} />
                        团队建设
                      </p>
                      <p className="text-[13px] leading-relaxed text-[#374151]">{stage.teamBuilding}</p>
                    </div>
                  )}

                  {/* 体系化建设 */}
                  {stage.systemBuilding && (
                    <div className="mb-4 rounded p-4" style={{ border: `1px solid ${C.line}`, background: C.base }}>
                      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest" style={{ color: C.burgundyText }}>
                        <span style={{ display: 'inline-block', width: 2, height: 10, borderRadius: 1, background: C.burgundy, marginRight: 2 }} aria-hidden={true} />
                        体系化建设
                      </p>
                      <p className="text-[13px] leading-relaxed text-[#374151]">{stage.systemBuilding}</p>
                    </div>
                  )}

                  {/* 品牌化策略 */}
                  {stage.brandStrategy && (
                    <div className="mb-4 rounded p-4" style={{ border: `1px solid ${C.line}`, background: C.base }}>
                      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest" style={{ color: C.purpleText }}>
                        <span style={{ display: 'inline-block', width: 2, height: 10, borderRadius: 1, background: C.accent3, marginRight: 2 }} aria-hidden={true} />
                        品牌化策略
                      </p>
                      <p className="text-[13px] leading-relaxed text-[#374151]">{stage.brandStrategy}</p>
                    </div>
                  )}

                  {/* 矩阵化布局 */}
                  {stage.matrixLayout && (
                    <div className="mb-4 rounded p-4" style={{ border: `1px solid ${C.line}`, background: C.base }}>
                      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest" style={{ color: C.purpleText }}>
                        <span style={{ display: 'inline-block', width: 2, height: 10, borderRadius: 1, background: C.accent3, marginRight: 2 }} aria-hidden={true} />
                        矩阵化布局
                      </p>
                      <p className="text-[13px] leading-relaxed text-[#374151]">{stage.matrixLayout}</p>
                    </div>
                  )}

                  {/* 关键动作 */}
                  {stage.keyActions.length > 0 && (
                    <div className="mb-4 rounded p-4" style={{ border: '1px solid #dcfce7', background: '#f0fdf4' }}>
                      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#166534]">
                        <span style={{ display: 'inline-block', width: 2, height: 10, borderRadius: 1, background: '#16a34a', marginRight: 2 }} aria-hidden={true} />
                        关键动作
                      </p>
                      <ul className="space-y-1.5">
                        {stage.keyActions.map((action, ai) => (
                          <li key={ai} className="flex items-start gap-2 text-[13px] leading-relaxed text-[#374151]">
                            <span className="material-symbols-outlined mt-0.5 shrink-0 text-[14px] text-[#16a34a]" aria-hidden={true}>check_circle</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 风险提示 */}
                  {stage.risks.length > 0 && (
                    <div className="rounded p-4" style={{ border: `1px solid ${C.burgundy}30`, background: `${C.burgundy}06` }}>
                      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest" style={{ color: C.burgundyText }}>
                        <span style={{ display: 'inline-block', width: 2, height: 10, borderRadius: 1, background: C.burgundy, marginRight: 2 }} aria-hidden={true} />
                        风险提示
                      </p>
                      <ul className="space-y-1.5">
                        {stage.risks.map((risk, ri) => (
                          <li key={ri} className="flex items-start gap-2 text-[13px] leading-relaxed" style={{ color: C.burgundyText }}>
                            <span className="material-symbols-outlined mt-0.5 shrink-0 text-[14px]" style={{ color: C.burgundy }} aria-hidden={true}>warning</span>
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right col-span-1 */}
        <div className="flex flex-col gap-6">
          {/* 收入结构模型 */}
          <div
            className="ikb-hovercard rounded p-6"
            style={{ border: `1px solid ${C.line}`, background: C.paper, boxShadow: '0 2px 8px rgba(43,83,230,0.07)' }}
          >
            <h3 className="mb-1 text-[16px] font-bold" style={{ color: C.ink }}>收入结构模型</h3>
            <p className="mb-4 text-[11px] text-[#6b7280]">三色环形占比 · 红蓝紫轮转</p>
            <div className="mb-6 flex items-center justify-center">
              <svg className="-rotate-90" viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="收入结构环形图">
                {/* track */}
                <circle cx="80" cy="80" fill="none" r="70" stroke="#EEF1FE" strokeWidth="12" />
                {/* segments */}
                {donutSegments.map((seg, i) => (
                  <circle
                    key={i}
                    cx="80"
                    cy="80"
                    fill="none"
                    r="70"
                    stroke={seg.color}
                    strokeWidth="12"
                    strokeDasharray={`${seg.dash} ${CIRCUMFERENCE}`}
                    strokeDashoffset={seg.offset}
                  />
                ))}
              </svg>
            </div>
            <div className="space-y-4">
              {donutSegments.map((seg) => (
                <div key={seg.name} className="ikb-hovercard rounded p-3" style={{ border: `1px solid ${C.line}`, background: C.base }}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
                    <span className="flex-1 text-[12px] font-semibold text-[#374151]">{seg.name}</span>
                    <span className="shrink-0 text-[13px] font-bold" style={{ color: seg.color }}>
                      {seg.percentage}
                    </span>
                  </div>
                  {seg.desc && (
                    <p className="pl-4 text-[11px] leading-relaxed text-[#6b7280]">{seg.desc}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ARR card · IKB 渐变底 */}
          <div className="ikb-gradbtn relative overflow-hidden rounded p-6 text-white" style={{ boxShadow: '0 4px 16px rgba(43,83,230,0.25)' }}>
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-[#EF3E6B]/20 blur-2xl" />
            <div className="relative z-10">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded bg-white/15">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>currency_yen</span>
                </span>
                <p className="text-[12px] font-medium text-white/80">预计年度经常性收入 (ARR)</p>
              </div>
              <div className="mb-1 text-[32px] font-bold leading-none" style={{ fontFamily: F.display }}>¥1,420万</div>
              <div className="mt-3 flex items-center gap-2 text-[13px]">
                <span className="material-symbols-outlined text-[16px] text-white/90" aria-hidden={true}>trending_up</span>
                <span className="font-semibold text-white/90">同比增长 +128%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 节点性能指标 table ──────────────────────────────── */}
      <div className="ikb-hovercard mt-6 overflow-hidden rounded" style={{ border: `1px solid ${C.line}`, background: C.paper, boxShadow: '0 2px 8px rgba(43,83,230,0.07)' }}>
        <div className="ikb-gradbtn flex items-center justify-between px-6 py-4 text-white" style={{ borderBottom: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-white/15">
              <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>sort</span>
            </span>
            <h3 className="text-[16px] font-bold" style={{ fontFamily: F.display }}>节点性能指标</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">
            {generated.successCases.length} 条参考
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr style={{ background: C.base }}>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: C.ikb }}>名称</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: C.ikb }}>体量层级</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: C.ikb }}>转化率</th>
                <th className="w-32 px-6 py-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: C.ikb }}>状态</th>
                <th className="w-20 px-6 py-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: C.ikb }}>操作</th>
              </tr>
            </thead>
            <tbody className="text-[#374151]">
              {generated.successCases.map((sc, idx) => (
                <tr
                  key={sc.title}
                  className="transition-colors"
                  style={{ borderTop: `1px solid ${C.line}`, background: idx % 2 === 1 ? C.base : 'transparent' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '#EEF1FE'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 1 ? C.base : 'transparent'; }}
                >
                  <td className="px-6 py-4 font-semibold" style={{ color: C.ink }}>
                    {sc.title.length > 28 ? `${sc.title.slice(0, 28)}…` : sc.title}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded border px-2 py-0.5 text-[11px] font-semibold" style={{ borderColor: `${C.ikb}30`, background: '#EEF1FE', color: C.ikb }}>
                      {sc.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#6b7280]">
                    {sc.outcome.length > 20 ? `${sc.outcome.slice(0, 20)}…` : sc.outcome}
                  </td>
                  <td className="px-6 py-4">
                    <CaseStatusBadge status={getCaseStatus(idx)} />
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      className="ikb-focusring flex h-7 w-7 items-center justify-center rounded border text-[#6b7280] transition-colors hover:text-white"
                      style={{ borderColor: C.line, background: C.paper }}
                      aria-label={`操作 ${sc.title}`}
                      onMouseEnter={(e) => { const b = e.currentTarget; b.style.background = C.ikb; b.style.borderColor = C.ikb; b.style.color = '#fff'; }}
                      onMouseLeave={(e) => { const b = e.currentTarget; b.style.background = C.paper; b.style.borderColor = C.line; b.style.color = '#6b7280'; }}
                    >
                      <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 成功案例参考 cards ──────────────────────────────── */}
      <div className="ikb-hovercard mt-6 overflow-hidden rounded" style={{ border: `1px solid ${C.line}`, background: C.paper, boxShadow: '0 2px 8px rgba(43,83,230,0.07)' }}>
        <div
          className="flex items-center justify-between px-6 py-4 text-white"
          style={{ background: `linear-gradient(110deg, ${C.burgundy} 0%, #9B2A51 100%)` }}
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-white/15">
              <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>emoji_events</span>
            </span>
            <h3 className="text-[16px] font-bold" style={{ fontFamily: F.display }}>成功案例参考</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">
            {generated.successCases.length} 个案例
          </span>
        </div>
        <div className="grid grid-cols-2 gap-6 p-6">
          {generated.successCases.map((sc, idx) => (
            <div
              key={sc.title}
              className="ikb-hovercard rounded p-5"
              style={{ border: `1px solid ${C.line}`, background: C.paper, boxShadow: '0 1px 4px rgba(22,32,72,0.06)' }}
            >
              <div className="mb-3 flex items-start gap-3">
                <CaseStatusBadge status={getCaseStatus(idx)} />
                <span className="rounded border px-2 py-0.5 text-[11px] font-semibold" style={{ borderColor: `${C.ikb}30`, background: '#EEF1FE', color: C.ikb }}>
                  {sc.category}
                </span>
              </div>
              <p className="mb-3 text-[14px] font-bold" style={{ color: C.ink }}>{sc.title}</p>
              {sc.journey && (
                <div className="mb-3 rounded p-3" style={{ border: `1px solid ${C.line}`, background: C.base }}>
                  <p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest" style={{ color: C.ikb }}>成长历程</p>
                  <p className="text-[12px] leading-relaxed text-[#374151]">{sc.journey}</p>
                </div>
              )}
              <div className="mb-3 rounded p-3" style={{ border: '1px solid #dcfce7', background: '#f0fdf4' }}>
                <p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-[#166534]">最终成果</p>
                <p className="text-[12px] font-semibold leading-relaxed text-[#166534]">{sc.outcome}</p>
              </div>
              {sc.insight && (
                <div className="rounded p-3" style={{ border: `1px solid ${C.accent3}30`, background: '#F4F0FD' }}>
                  <p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest" style={{ color: C.purpleText }}>启示</p>
                  <p className="text-[12px] leading-relaxed" style={{ color: C.purpleText }}>{sc.insight}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── 市场分析 card ───────────────────────────────────── */}
      <div className="ikb-hovercard mt-6 rounded p-6" style={{ border: `1px solid ${C.line}`, background: C.paper, boxShadow: '0 2px 8px rgba(43,83,230,0.07)' }}>
        <h3 className="mb-5 flex items-center gap-2.5 text-[16px] font-bold" style={{ color: C.ink }}>
          <span className="flex h-9 w-9 items-center justify-center rounded" style={{ background: `${C.ikb}15`, color: C.ikb }}>
            <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>insights</span>
          </span>
          市场分析
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: '行业分析', val: generated.marketAnalysis.industryAnalysis },
            { key: '市场规模', val: generated.marketAnalysis.marketScale },
            { key: '竞争格局', val: generated.marketAnalysis.competition },
            { key: '变现潜力', val: generated.marketAnalysis.monetizationPotential },
          ].map((item) => (
            <div key={item.key} className="ikb-hovercard rounded p-4" style={{ border: `1px solid ${C.line}`, background: C.base }}>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest" style={{ color: C.ikb }}>
                <span style={{ display: 'inline-block', width: 2, height: 10, borderRadius: 1, background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})`, marginRight: 2 }} aria-hidden={true} />
                {item.key}
              </p>
              <p className="text-[13px] leading-relaxed text-[#374151]">{item.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer actions ──────────────────────────────────── */}
      <div className="ikb-hovercard mt-6 rounded p-6" style={{ border: `1px solid ${C.line}`, background: C.paper, boxShadow: '0 1px 4px rgba(22,32,72,0.06)' }}>
        <div className="flex flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-medium text-[#6b7280]">这个结果对你有帮助吗？</span>
            <button
              type="button"
              onClick={handleFeedbackUp}
              className="ikb-focusring flex h-8 w-8 items-center justify-center rounded border text-[#374151] shadow-sm transition-colors hover:bg-[#EEF1FE] hover:text-[#2B53E6]"
              style={{ borderColor: C.line, background: C.paper }}
              aria-label="有帮助"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>thumb_up</span>
            </button>
            <button
              type="button"
              onClick={handleFeedbackDown}
              className="ikb-focusring flex h-8 w-8 items-center justify-center rounded border text-[#374151] shadow-sm transition-colors"
              style={{ borderColor: C.line, background: C.paper }}
              aria-label="没帮助"
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.burgundyText; (e.currentTarget as HTMLButtonElement).style.background = `${C.burgundy}08`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#374151'; (e.currentTarget as HTMLButtonElement).style.background = C.paper; }}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>thumb_down</span>
            </button>
          </div>
        </div>
      </div>
    </IKBLayout>
  );
}
