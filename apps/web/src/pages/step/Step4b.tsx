// PRD-29.10 · /step/4b 变现路径 · Liquid Glass 重构
import { motion } from 'framer-motion';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Magnetic, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
import { type Step4bStage } from '@/components/step4b/Step4bStageSection';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';
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
  marketAnalysis: {
    industryAnalysis: string;
    marketScale: string;
    competition: string;
    monetizationPotential: string;
  };
  stages: Step4bStage[];
  revenueStructure: Array<{
    name: string;
    percentage: string;
    desc: string;
    highlight?: boolean;
  }>;
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
    marketAnalysis: {
      industryAnalysis: 'AI智能体定制与OPC创业培训',
      marketScale: 'AI技术正在爆发式增长，企业和个人对降本增效的需求巨大，尤其在重复性工作自动化方面。OPC（One Person Company）创业者对AI工具和方法论的需求也日益旺盛。市场规模难以精确估算，但增长潜力巨大。',
      competition: 'AI定制服务竞争激烈，但垂直细分领域（如特定行业、特定功能）仍有蓝海。OPC培训市场竞争同样激烈，但结合AI技术和个人实践经验的IP具有独特优势。',
      monetizationPotential: '非常高。定制化服务客单价高，培训产品可规模化。IP的个人经历（餐饮创业、负债、转型AI成功）是极佳的信任背书和故事素材，能吸引大量共鸣者。',
    },
    stages: [
      {
        number: 1,
        icon: 'trending',
        range: '0→90万',
        title: '起步阶段：积累案例与私域流量，验证培训模型',
        duration: '6-12个月',
        coreStrategy: '以引流品快速获取私域流量，通过信任品建立口碑和转化，同时提供定制服务积累高客单价案例。核心是把你的成功转型故事包装成引人入胜的IP。',
        productMatrix: [
          { category: '引流品', name: 'AI智能体免费体验课／9.9元《AI创业避坑指南》电子书', priceRange: '0-9.9元', targetCustomer: '对AI智能体感兴趣的企业主、希望通过AI提升效率的OPC创业者', monthlyTarget: '300-500人', monthlyRevenue: '0-5000元' },
          { category: '信任品', name: 'AI智能体实战训练营（初级）／《OPC AI创业加速营》', priceRange: '499元', targetCustomer: '对AI智能体有初步兴趣，想深入学习搭建和应用的OPC创业者、小企业主', monthlyTarget: '50-80人', monthlyRevenue: '2.5万-4万元' },
          { category: '利润品', name: '定制智能体服务（轻量版）', priceRange: '10000-30000元', targetCustomer: '有明确降本增效需求，但预算有限的小型企业主、OPC创业者', monthlyTarget: '1-2单', monthlyRevenue: '1万-6万元' },
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
      {
        number: 2,
        icon: 'diamond',
        range: '100万→1000万',
        title: '发展阶段：产品线升级，打造爆款，团队协作',
        duration: '12-24个月',
        coreStrategy: '在积累一定私域用户和成功案例后，升级产品线，推出更高客单价的利润品和后端品。开始组建核心团队，实现部分业务标准化和规模化。',
        productMatrix: [
          { category: '利润品', name: 'AI智能体系统大课／《OPC AI创业实战营》（进阶版）', priceRange: '1980-9800元', targetCustomer: '希望系统学习AI智能体开发与商业落地，或希望通过AI实现项目从0到1的OPC创业者', monthlyTarget: '10-20人', monthlyRevenue: '2万-20万元' },
          { category: '利润品', name: '定制智能体服务（专业版）', priceRange: '3万-10万元', targetCustomer: '有复杂业务流程优化需求，愿意投入更高预算的企业主、中大型OPC创业团队', monthlyTarget: '0.5-1单', monthlyRevenue: '1.5万-10万元' },
          { category: '后端产品', name: 'OPC AI创业合伙人计划／线下高阶培训', priceRange: '19800-29800元', targetCustomer: '希望深度绑定，共同发展AI事业的OPC创业者，或寻求技术升级、项目落地的学员', monthlyTarget: '2-5人', monthlyRevenue: '4万-15万元' },
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
      {
        number: 3,
        icon: 'crown',
        range: '1000万→1亿',
        title: '规模化阶段：品牌化、平台化、生态化',
        duration: '24-48个月',
        coreStrategy: '将IP打造成行业标杆，实现品牌化运营。构建AI智能体服务平台或OPC创业赋能平台，吸引更多开发者和创业者加入，形成生态。通过资本运作加速发展。',
        productMatrix: [
          { category: '后端产品', name: '企业内训／行业解决方案定制', priceRange: '10万-100万元', targetCustomer: '中大型企业、上市公司、政府机构', monthlyTarget: '0.1-0.3单', monthlyRevenue: '1万-30万元' },
          { category: '后端产品', name: 'AI智能体SaaS平台／OPC创业孵化器', priceRange: '年费1万-10万（SaaS）／股权投资（孵化器）', targetCustomer: '广大OPC创业者、中小企业、AI开发者', monthlyTarget: '平台用户增长/孵化项目', monthlyRevenue: '可变' },
          { category: '利润品', name: '私董会／资本对接服务', priceRange: '10万-50万元/年', targetCustomer: '寻求更高维度发展、资本运作的优秀OPC创业者、中小企业主', monthlyTarget: '0.1-0.2人', monthlyRevenue: '1万-10万元' },
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
    revenueStructure: [
      { name: '定制智能体服务', percentage: '40%', desc: '高客单价，利润丰厚，但需要持续投入人力和技术。随着品牌影响力提升，客单价和订单量会稳步增长。', highlight: true },
      { name: 'AI智能体与OPC创业培训（线上课程、训练营、线下高阶培训）', percentage: '35%', desc: '可规模化复制，边际成本低，是现金流的重要来源。通过引流品和信任品不断扩大用户基数，提升转化率。' },
      { name: '后端产品（合伙人计划、私董会、企业内训、SaaS平台）', percentage: '25%', desc: '利润天花板高，能带来长期稳定的高价值收入。需要IP的深度参与和品牌影响力。随着业务发展，这部分占比会逐渐提升。' },
    ],
    successCases: [
      { title: '某AI技术IP：从个人博主到AI教育平台创始人', category: 'AI技术教育', journey: '初期通过免费AI工具教程和短视频积累粉丝 -> 推出99元入门课 -> 升级为1980元系统课程 -> 最终成立AI教育SaaS平台，提供企业内训和解决方案。', outcome: '从年入几十万到年营收数千万，估值过亿。', insight: '启示：从免费内容切入，逐步提升产品客单价和深度，最终实现平台化和品牌化。个人IP的专业性和教学能力是核心。' },
      { title: '某创业导师：从个人咨询到创业孵化器', category: '创业咨询/孵化', journey: '通过分享个人创业故事和避坑经验吸引粉丝 -> 推出99元创业社群 -> 升级为9800元创业训练营 -> 最终成立创业孵化器，提供资金和资源支持。', outcome: '从年入百万到年营收数千万，孵化多个成功项目。', insight: '启示：个人经历和实战经验是最好的信任背书。通过社群和训练营筛选高潜力学员，最终通过深度绑定（孵化器）实现更大价值。' },
    ],
  };
}

// ── Stage configs ─────────────────────────────────────────────────────────────

interface StageCfg {
  barColors: [string, string, string];
  barHeights: [number, number, number];
  accentColor: string;
  subtitle: string;
}

const STAGE_CONFIGS: [StageCfg, StageCfg, StageCfg] = [
  { barColors: ['rgba(168,197,224,0.4)', '#a8c5e0', '#d8e8ff'], barHeights: [30, 45, 60], accentColor: C.ikb, subtitle: '初始捕获' },
  { barColors: ['#a8c5e0', '#d8e8ff', 'rgba(228,238,255,0.8)'], barHeights: [40, 70, 85], accentColor: C.yellow, subtitle: '规模与渗透' },
  { barColors: ['#d8e8ff', 'rgba(228,238,255,0.8)', '#a8c5e0'], barHeights: [60, 80, 100], accentColor: C.ikb, subtitle: '生态系统主导' },
];

// ── Donut chart colors ────────────────────────────────────────────────────────

const DONUT_COLORS = ['#d8e8ff', '#a8c5e0', '#7fb0e6', 'rgba(255,255,255,0.5)'];
const CIRCUMFERENCE = 440;

// ── 数据洞察静态数据 S4B ─────────────────────────────────────────────────────

const RADAR_DIMS_S4B = [
  { label: '获客力', value: 85, color: C.ikb },
  { label: '转化率', value: 78, color: C.yellow },
  { label: '客单价', value: 92, color: C.accent3 },
  { label: '复购率', value: 70, color: C.ikb },
  { label: '利润率', value: 88, color: C.yellow },
  { label: '规模化', value: 74, color: C.accent3 },
];

const REVENUE_TREND_S4B = [8, 15, 22, 35, 48, 60, 80, 95, 112, 135, 158, 190];
const REVENUE_LABELS_S4B = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// ── Case status ───────────────────────────────────────────────────────────────

type CaseStatus = 'best' | 'expanding' | 'init';

function getCaseStatus(index: number): CaseStatus {
  if (index === 0) return 'best';
  if (index === 1) return 'expanding';
  return 'init';
}

function CaseStatusBadge({ status }: { status: CaseStatus }) {
  if (status === 'best') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 6, border: `0.5px solid rgba(168,197,224,0.55)`, background: 'rgba(168,197,224,0.18)', padding: '3px 10px' }}>
        <span style={{ height: 6, width: 6, borderRadius: '50%', background: C.ikb, display: 'inline-block' }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: C.ikb }}>最佳</span>
      </div>
    );
  }
  if (status === 'expanding') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 6, border: `0.5px solid rgba(228,238,255,0.45)`, background: 'rgba(228,238,255,0.15)', padding: '3px 10px' }}>
        <span style={{ height: 6, width: 6, borderRadius: '50%', background: C.yellow, display: 'inline-block' }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: C.yellow }}>扩展中</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 6, border: `0.5px solid ${C.line}`, background: 'rgba(255,255,255,0.07)', padding: '3px 10px', opacity: 0.6 }}>
      <span style={{ height: 6, width: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', display: 'inline-block' }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.84)' }}>初始化中</span>
    </div>
  );
}

// ── Shared glass sub-section block ────────────────────────────────────────────

function SubBlock({ accentColor, label, children }: { accentColor: string; label: string; children: React.ReactNode }) {
  return (
    <div className="lg-glass" style={{ borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <p style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: accentColor, textShadow: C.textShadow }}>
        <span style={{ display: 'inline-block', width: 2, height: 10, borderRadius: 1, background: accentColor, marginRight: 2 }} aria-hidden={true} />
        {label}
      </p>
      {children}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function Step4b() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const { save, isSaving, dbQuery } = useStepData(accountId, 'step4b');

  const industry = readOtherStep<{ industry?: string }>(accountId, 'step1')?.industry ?? '美业';

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
    <LiquidShell>
      {/* ── Header ─────────────────────────────────────────── */}
      <Reveal>
        <header style={{ marginBottom: 40, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ borderRadius: 9999, border: `0.5px solid ${C.line}`, background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)', padding: '4px 14px', fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.ink, fontFamily: F.mono, textShadow: C.textShadow }}>
                战略路径
              </span>
              <span style={{ borderRadius: 9999, border: `0.5px solid rgba(168,197,224,0.55)`, background: 'rgba(168,197,224,0.18)', backdropFilter: 'blur(12px)', padding: '4px 14px', fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.ikb, fontFamily: F.mono, textShadow: C.textShadow }}>
                增长模型
              </span>
            </div>
            <h1 style={{ whiteSpace: 'nowrap', fontSize: 48, fontWeight: 800, letterSpacing: '-0.02em', fontFamily: F.display, margin: 0, background: C.grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent', textShadow: 'none' }}>
              {STEP4B_H1}
            </h1>
            <p style={{ marginTop: 10, maxWidth: 820, fontSize: 16, lineHeight: 1.6, color: C.burgundyText, fontFamily: F.cn, textShadow: C.textShadow }}>
              {STEP4B_SUBTITLE_REAL.replace('{industry}', industry)}
            </p>
          </div>
          <div style={{ display: 'flex', flexShrink: 0, flexWrap: 'wrap', gap: 12 }}>
            <motion.button
              type="button"
              onClick={handleOptimize}
              disabled={!canBulkActions}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              aria-label="智能优化"
              className="lg-glass"
              style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', borderRadius: 12, padding: '10px 18px', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.ink, cursor: 'pointer', border: 'none', opacity: canBulkActions ? 1 : 0.4 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>auto_fix_high</span>
              智能优化
            </motion.button>
            <motion.button
              type="button"
              onClick={handleRegenerateAll}
              disabled={isLoading}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              aria-label="重新生成"
              className="lg-glass"
              style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', borderRadius: 12, padding: '10px 18px', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.ink, cursor: 'pointer', border: 'none', opacity: isLoading ? 0.4 : 1 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>refresh</span>
              重新生成
            </motion.button>
            <motion.button
              type="button"
              onClick={handleCopyAll}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              aria-label="导出数据"
              style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', border: 'none', background: 'linear-gradient(110deg,#4a7fd4 0%,#2a5abf 100%)', boxShadow: '0 4px 16px rgba(43,83,230,0.35)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>download</span>
              导出数据
            </motion.button>
          </div>
        </header>
      </Reveal>

      {/* ── 输入变现参数 card ───────────────────────────────── */}
      <Reveal>
        <section
          className="lg-glass"
          style={{ position: 'relative', marginBottom: 40, overflow: 'hidden', borderRadius: 20, padding: 24 }}
        >
          <div style={{ pointerEvents: 'none', position: 'absolute', right: -64, top: -64, height: 176, width: 176, borderRadius: '50%', background: 'rgba(168,197,224,0.08)', filter: 'blur(32px)' }} />
          <div style={{ pointerEvents: 'none', position: 'absolute', bottom: -80, left: '33%', height: 176, width: 176, borderRadius: '50%', background: 'rgba(228,238,255,0.06)', filter: 'blur(32px)' }} />
          <div style={{ position: 'relative', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 18, borderBottom: `0.5px solid ${C.line}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'flex', height: 44, width: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: 'linear-gradient(135deg,rgba(168,197,224,0.5),rgba(120,160,220,0.3))', color: C.ikb }}>
                <span className="material-symbols-outlined" aria-hidden={true}>payments</span>
              </span>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, margin: 0, textShadow: C.textShadow }}>输入变现参数</h2>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }}>填写基础信息 · AI 据此规划完整变现路径</p>
              </div>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 9999, background: 'rgba(168,197,224,0.18)', padding: '4px 12px', fontSize: 12, fontWeight: 600, color: C.ikb }}>
              <span style={{ height: 6, width: 6, borderRadius: '50%', background: C.ikb, display: 'inline-block' }} />
              参数就绪
            </span>
          </div>
          <div style={{ position: 'relative' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* 产品/服务描述 */}
              <div>
                <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label htmlFor="s4b-product-service" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800, letterSpacing: '0.05em', color: C.ink, textShadow: C.textShadow }}>
                    <span style={{ display: 'inline-block', width: 4, height: 14, borderRadius: 2, background: C.grad, marginRight: 4 }} aria-hidden={true} />
                    产品/服务描述 <span style={{ marginLeft: 4, color: C.ikb }}>*</span>
                  </label>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.84)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: C.ikb }} aria-hidden={true}>auto_awesome</span>
                    AI 据此测算变现潜力
                  </span>
                </div>
                <div className="lg-glass" style={{ overflow: 'hidden', borderRadius: 12 }}>
                  <textarea
                    id="s4b-product-service"
                    required
                    value={productService}
                    onChange={(e) => setProductService(e.target.value)}
                    rows={4}
                    placeholder="描述你的产品/服务，包括定价、对象、交付形式等"
                    style={{ width: '100%', resize: 'none', border: 0, background: 'transparent', padding: 16, fontSize: 14, lineHeight: 1.6, color: C.ink, outline: 'none', fontFamily: F.cn }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'rgba(255,255,255,0.06)', padding: '8px 16px', borderTop: `0.5px solid ${C.line}` }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)' }}>可包含</span>
                      {['定价', '受众', '交付', '服务范围', '培训'].map((t) => (
                        <span key={t} style={{ borderRadius: 9999, background: 'rgba(168,197,224,0.2)', padding: '2px 10px', fontSize: 11, fontWeight: 500, color: C.ikb }}>
                          {t}
                        </span>
                      ))}
                    </div>
                    <span style={{ flexShrink: 0, fontSize: 11, fontVariantNumeric: 'tabular-nums', color: 'rgba(255,255,255,0.84)' }}>{productService.length} 字</span>
                  </div>
                </div>
              </div>

              {/* 目标受众 + IP定位 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label htmlFor="s4b-target-audience" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800, letterSpacing: '0.05em', color: C.ink, textShadow: C.textShadow }}>
                    <span style={{ display: 'inline-block', width: 4, height: 14, borderRadius: 2, background: C.grad, marginRight: 4 }} aria-hidden={true} />
                    目标受众
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{ pointerEvents: 'none', position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'rgba(255,255,255,0.72)' }} aria-hidden={true}>groups</span>
                    <input
                      id="s4b-target-audience"
                      type="text"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="例如：25-40男性企业主"
                      className="lg-glass"
                      style={{ width: '100%', borderRadius: 12, padding: '12px 12px 12px 42px', fontSize: 14, color: C.ink, border: 'none', outline: 'none', background: 'transparent', fontFamily: F.cn, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="s4b-ip-positioning" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800, letterSpacing: '0.05em', color: C.ink, textShadow: C.textShadow }}>
                    <span style={{ display: 'inline-block', width: 4, height: 14, borderRadius: 2, background: C.grad, marginRight: 4 }} aria-hidden={true} />
                    IP定位
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{ pointerEvents: 'none', position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'rgba(255,255,255,0.72)' }} aria-hidden={true}>person_pin</span>
                    <input
                      id="s4b-ip-positioning"
                      type="text"
                      value={ipPositioning}
                      onChange={(e) => setIpPositioning(e.target.value)}
                      placeholder="例如：AI智能体定制"
                      className="lg-glass"
                      style={{ width: '100%', borderRadius: 12, padding: '12px 12px 12px 42px', fontSize: 14, color: C.ink, border: 'none', outline: 'none', background: 'transparent', fontFamily: F.cn, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>

              {/* 当前收入水平 + 提交按钮 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label htmlFor="s4b-current-income" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800, letterSpacing: '0.05em', color: C.ink, textShadow: C.textShadow }}>
                    <span style={{ display: 'inline-block', width: 4, height: 14, borderRadius: 2, background: C.grad, marginRight: 4 }} aria-hidden={true} />
                    当前收入水平
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{ pointerEvents: 'none', position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'rgba(255,255,255,0.72)' }} aria-hidden={true}>monetization_on</span>
                    <input
                      id="s4b-current-income"
                      type="text"
                      value={currentIncome}
                      onChange={(e) => setCurrentIncome(e.target.value)}
                      placeholder="例如：年入30万"
                      className="lg-glass"
                      style={{ width: '100%', borderRadius: 12, padding: '12px 12px 12px 42px', fontSize: 14, color: C.ink, border: 'none', outline: 'none', background: 'transparent', fontFamily: F.cn, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <Magnetic strength={0.3}>
                    <button
                      type="submit"
                      disabled={!productService.trim() || isLoading}
                      className="lg-gradbtn"
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 9999, padding: '13px 32px', fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: F.cn, border: 'none', cursor: !productService.trim() || isLoading ? 'not-allowed' : 'pointer', opacity: !productService.trim() || isLoading ? 0.4 : 1 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>payments</span>
                      {isLoading ? '生成中…' : STEP4B_BUTTON_GENERATE_REAL}
                    </button>
                  </Magnetic>
                </div>
              </div>
            </form>
          </div>
        </section>
      </Reveal>

      {/* ── Loading bar ────────────────────────────────────── */}
      {isLoading && (
        <Reveal>
          <div className="lg-glass" style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12, borderRadius: 14, padding: 16, fontSize: 14, fontWeight: 500, color: C.ikb }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, animation: 'spin 1s linear infinite' }} aria-hidden={true}>progress_activity</span>
            正在规划变现路径…
          </div>
        </Reveal>
      )}

      {/* ── KPI 卡一排 ─────────────────────────────────────── */}
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {/* 预估年营收 */}
        <Item style={{ height: '100%' }}>
          <motion.div className="lg-glass lg-spec" whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 240, damping: 18 }} style={{ borderRadius: 20, padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.22)', color: C.ikb }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>monitoring</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, borderRadius: 9999, background: 'rgba(168,197,224,0.2)', padding: '2px 8px', fontSize: 11, fontWeight: 700, color: C.ikb }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13 }} aria-hidden={true}>trending_up</span>+128%
              </span>
            </div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
                  1,420<span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)' }}>万</span>
                </p>
                <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)' }}>预估年营收(ARR)</p>
              </div>
              <div style={{ height: 48, width: 48, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }} role="img" aria-label="78% 进度">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(168,197,224,0.2)" strokeWidth="3.5" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke={C.ikb} strokeWidth="3.5" strokeLinecap="round" strokeDasharray="78 100" />
                </svg>
              </div>
            </div>
          </motion.div>
        </Item>

        {/* 变现渠道数 */}
        <Item style={{ height: '100%' }}>
          <motion.div className="lg-glass lg-spec" whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 240, damping: 18 }} style={{ borderRadius: 20, padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(228,238,255,0.18)', color: C.yellow }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>account_tree</span>
              </span>
              <span style={{ borderRadius: 9999, padding: '2px 8px', fontSize: 11, fontWeight: 700, background: 'rgba(228,238,255,0.15)', color: C.yellow }}>已规划</span>
            </div>
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
                {generated.revenueStructure.length}<span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)' }}> 条</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)' }}>变现渠道</p>
            </div>
            <div style={{ marginTop: 10, display: 'flex', height: 24, alignItems: 'flex-end', gap: 4 }} aria-hidden={true}>
              {[40, 70, 85, 58, 92].map((h, i) => (
                <div key={i} style={{ flex: 1, borderRadius: '2px 2px 0 0', height: `${h}%`, background: 'rgba(228,238,255,0.4)' }} />
              ))}
            </div>
          </motion.div>
        </Item>

        {/* 客单价区间 */}
        <Item style={{ height: '100%' }}>
          <motion.div className="lg-glass lg-spec" whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 240, damping: 18 }} style={{ borderRadius: 20, padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.22)', color: C.accent3 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>sell</span>
              </span>
              <span style={{ borderRadius: 9999, padding: '2px 8px', fontSize: 11, fontWeight: 700, background: 'rgba(168,197,224,0.18)', color: C.accent3 }}>高客单</span>
            </div>
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
                1万<span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)' }}>-100万</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)' }}>客单价区间</p>
            </div>
            <div style={{ marginTop: 10, height: 8, width: '100%', borderRadius: 9999, background: 'rgba(168,197,224,0.18)' }} aria-hidden={true}>
              <div style={{ height: 8, borderRadius: 9999, width: '82%', background: `linear-gradient(to right,${C.ikb},${C.accent3})` }} />
            </div>
          </motion.div>
        </Item>

        {/* 综合转化率 */}
        <Item style={{ height: '100%' }}>
          <motion.div className="lg-glass lg-spec" whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 240, damping: 18 }} style={{ borderRadius: 20, padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.22)', color: C.ikb }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>conversion_path</span>
              </span>
              <span style={{ borderRadius: 9999, padding: '2px 8px', fontSize: 11, fontWeight: 700, background: 'rgba(168,197,224,0.18)', color: C.ikb }}>
                {generated.stages.length} 阶段
              </span>
            </div>
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
                3.8<span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)' }}>%</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)' }}>综合转化率</p>
            </div>
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {['引流品', '信任品', '利润品'].map((k) => (
                <span key={k} style={{ borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 500, background: 'rgba(168,197,224,0.2)', color: C.ikb }}>
                  {k}
                </span>
              ))}
            </div>
          </motion.div>
        </Item>
      </RevealGroup>

      {/* ── Main grid: 收入轨迹 + 右侧 ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Left: 收入轨迹分析 */}
        <div className="lg-glass" style={{ overflow: 'hidden', borderRadius: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: 'linear-gradient(110deg,#4a7fd4 0%,#2a5abf 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'flex', height: 32, width: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'rgba(255,255,255,0.15)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#fff' }} aria-hidden={true}>bar_chart</span>
              </span>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, fontFamily: F.display, textShadow: C.textShadow }}>收入轨迹分析</h3>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 9999, background: 'rgba(255,255,255,0.15)', padding: '4px 12px', fontSize: 11, fontWeight: 600, color: '#fff' }}>
              <span style={{ height: 6, width: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.8)', display: 'inline-block' }} />
              3 阶段规划
            </span>
          </div>
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {generated.stages.map((stage, idx) => {
              const cfgIdx = (idx < 3 ? idx : 0) as 0 | 1 | 2;
              const cfg = STAGE_CONFIGS[cfgIdx];
              return (
                <motion.div
                  key={stage.number}
                  className="lg-glass"
                  whileHover={{ y: -3 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                  style={{ borderRadius: 16, padding: 20 }}
                >
                  {/* Stage header */}
                  <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.84)' }}>
                          阶段 {String(stage.number).padStart(2, '0')}
                        </span>
                        <span className="lg-glass" style={{ borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>
                          {stage.duration}
                        </span>
                      </div>
                      <div style={{ marginBottom: 4, fontSize: 22, fontWeight: 700, lineHeight: 1, fontFamily: F.display, background: C.grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>
                        {stage.range}
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.ink, textShadow: C.textShadow, margin: 0 }}>{stage.title}</p>
                      <p style={{ marginTop: 2, fontSize: 11, fontWeight: 600, color: cfg.accentColor, margin: '2px 0 0' }}>{cfg.subtitle}</p>
                    </div>
                    <div style={{ display: 'flex', height: 80, flexShrink: 0, alignItems: 'flex-end', gap: 6 }} aria-hidden={true}>
                      {cfg.barColors.map((color, bi) => (
                        <div key={bi} style={{ width: 16, borderRadius: '3px 3px 0 0', height: `${cfg.barHeights[bi]}%`, backgroundColor: color }} />
                      ))}
                    </div>
                  </div>

                  {/* 核心策略 */}
                  <SubBlock accentColor={C.ikb} label="核心策略">
                    <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.84)' }}>{stage.coreStrategy}</p>
                  </SubBlock>

                  {/* 产品矩阵 */}
                  {stage.productMatrix.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.yellow, textShadow: C.textShadow }}>
                        <span style={{ display: 'inline-block', width: 2, height: 10, borderRadius: 1, background: C.yellow, marginRight: 2 }} aria-hidden={true} />
                        产品矩阵
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {stage.productMatrix.map((product, pi) => (
                          <motion.div
                            key={pi}
                            className="lg-glass"
                            whileHover={{ y: -2 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            style={{ borderRadius: 12, padding: 14 }}
                          >
                            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                              <div>
                                <span style={{ borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700, background: 'rgba(168,197,224,0.2)', color: C.ikb }}>
                                  {product.category}
                                </span>
                                <p style={{ marginTop: 4, fontSize: 13, fontWeight: 600, color: C.ink, textShadow: C.textShadow }}>{product.name}</p>
                              </div>
                              <span className="lg-glass" style={{ flexShrink: 0, borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700, color: C.accent3 }}>
                                {product.priceRange}
                              </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, fontSize: 11, color: 'rgba(255,255,255,0.84)' }}>
                              <div>
                                <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>目标客户</span>
                                <p style={{ marginTop: 2, lineHeight: 1.5 }}>{product.targetCustomer}</p>
                              </div>
                              <div>
                                <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>月目标</span>
                                <p style={{ marginTop: 2 }}>{product.monthlyTarget}</p>
                              </div>
                              <div>
                                <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>月收入</span>
                                <p style={{ marginTop: 2, fontWeight: 600, color: C.ikb }}>{product.monthlyRevenue}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {stage.trafficStrategy && (
                    <SubBlock accentColor={C.ikb} label="流量策略">
                      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.84)' }}>{stage.trafficStrategy}</p>
                    </SubBlock>
                  )}

                  {stage.conversionFlow && stage.conversionFlow.length > 0 && (
                    <SubBlock accentColor={C.ikb} label="转化流程">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {stage.conversionFlow.map((step, si) => (
                          <div key={si} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.84)' }}>
                            <span style={{ marginTop: 2, display: 'flex', height: 16, width: 16, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: 9, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,rgba(168,197,224,0.6),rgba(120,160,220,0.4))' }}>
                              {si + 1}
                            </span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </SubBlock>
                  )}

                  {stage.teamBuilding && (
                    <SubBlock accentColor={C.yellow} label="团队建设">
                      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.84)' }}>{stage.teamBuilding}</p>
                    </SubBlock>
                  )}

                  {stage.systemBuilding && (
                    <SubBlock accentColor={C.yellow} label="体系化建设">
                      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.84)' }}>{stage.systemBuilding}</p>
                    </SubBlock>
                  )}

                  {stage.brandStrategy && (
                    <SubBlock accentColor={C.accent3} label="品牌化策略">
                      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.84)' }}>{stage.brandStrategy}</p>
                    </SubBlock>
                  )}

                  {stage.matrixLayout && (
                    <SubBlock accentColor={C.accent3} label="矩阵化布局">
                      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.84)' }}>{stage.matrixLayout}</p>
                    </SubBlock>
                  )}

                  {stage.keyActions.length > 0 && (
                    <div className="lg-glass" style={{ borderRadius: 12, padding: 16, marginBottom: 12 }}>
                      <p style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(168,224,180,0.9)', textShadow: C.textShadow }}>
                        <span style={{ display: 'inline-block', width: 2, height: 10, borderRadius: 1, background: 'rgba(168,224,180,0.9)', marginRight: 2 }} aria-hidden={true} />
                        关键动作
                      </p>
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {stage.keyActions.map((action, ai) => (
                          <li key={ai} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.84)' }}>
                            <span className="material-symbols-outlined" style={{ marginTop: 2, flexShrink: 0, fontSize: 14, color: 'rgba(168,224,180,0.9)' }} aria-hidden={true}>check_circle</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {stage.risks.length > 0 && (
                    <div className="lg-glass" style={{ borderRadius: 12, padding: 16 }}>
                      <p style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,180,150,0.9)', textShadow: C.textShadow }}>
                        <span style={{ display: 'inline-block', width: 2, height: 10, borderRadius: 1, background: 'rgba(255,180,150,0.9)', marginRight: 2 }} aria-hidden={true} />
                        风险提示
                      </p>
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {stage.risks.map((risk, ri) => (
                          <li key={ri} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, lineHeight: 1.6, color: 'rgba(255,180,150,0.85)' }}>
                            <span className="material-symbols-outlined" style={{ marginTop: 2, flexShrink: 0, fontSize: 14, color: 'rgba(255,180,150,0.9)' }} aria-hidden={true}>warning</span>
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 收入结构模型 */}
          <div className="lg-glass" style={{ borderRadius: 20, padding: 24 }}>
            <h3 style={{ marginBottom: 4, fontSize: 16, fontWeight: 700, color: C.ink, textShadow: C.textShadow }}>收入结构模型</h3>
            <p style={{ marginBottom: 16, fontSize: 11, color: 'rgba(255,255,255,0.84)' }}>三色环形占比 · 冷蓝玻璃轮转</p>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ transform: 'rotate(-90deg)' }} viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="收入结构环形图">
                <circle cx="80" cy="80" fill="none" r="70" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                {donutSegments.map((seg, i) => (
                  <circle key={i} cx="80" cy="80" fill="none" r="70" stroke={seg.color} strokeWidth="12" strokeDasharray={`${seg.dash} ${CIRCUMFERENCE}`} strokeDashoffset={seg.offset} />
                ))}
              </svg>
            </div>
            <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
              {donutSegments.map((seg) => (
                <Item key={seg.name} style={{ height: '100%' }}>
                  <div className="lg-glass" style={{ borderRadius: 10, padding: 12, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ height: 10, width: 10, flexShrink: 0, borderRadius: '50%', backgroundColor: seg.color }} />
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{seg.name}</span>
                      <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 700, color: seg.color }}>{seg.percentage}</span>
                    </div>
                    {seg.desc && (
                      <p style={{ paddingLeft: 18, fontSize: 11, lineHeight: 1.5, color: 'rgba(255,255,255,0.84)', marginTop: 'auto', paddingTop: 6 }}>{seg.desc}</p>
                    )}
                  </div>
                </Item>
              ))}
            </RevealGroup>
          </div>

          {/* ARR card */}
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, padding: 24, background: 'linear-gradient(110deg,#4a7fd4 0%,#2a5abf 100%)', boxShadow: '0 4px 20px rgba(43,83,230,0.4)', color: '#fff' }}>
            <div style={{ pointerEvents: 'none', position: 'absolute', right: -40, top: -40, height: 160, width: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', filter: 'blur(32px)' }} />
            <div style={{ pointerEvents: 'none', position: 'absolute', bottom: -40, left: -40, height: 128, width: 128, borderRadius: '50%', background: 'rgba(168,197,224,0.20)', filter: 'blur(32px)' }} />
            <div style={{ position: 'relative', zIndex: 10 }}>
              <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'flex', height: 32, width: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'rgba(255,255,255,0.15)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>currency_yen</span>
                </span>
                <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.8)', margin: 0 }}>预计年度经常性收入 (ARR)</p>
              </div>
              <div style={{ marginBottom: 4, fontSize: 32, fontWeight: 700, lineHeight: 1, fontFamily: F.display }}>¥1,420万</div>
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)' }} aria-hidden={true}>trending_up</span>
                <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>同比增长 +128%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 节点性能指标 table ──────────────────────────────── */}
      <Reveal>
        <div className="lg-glass" style={{ marginTop: 20, overflow: 'hidden', borderRadius: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: 'linear-gradient(110deg,#4a7fd4 0%,#2a5abf 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'flex', height: 32, width: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'rgba(255,255,255,0.15)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#fff' }} aria-hidden={true}>sort</span>
              </span>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, fontFamily: F.display, textShadow: C.textShadow }}>节点性能指标</h3>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 9999, background: 'rgba(255,255,255,0.15)', padding: '4px 12px', fontSize: 11, fontWeight: 600, color: '#fff' }}>
              {generated.successCases.length} 条参考
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', fontSize: 14, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                  {['名称', '体量层级', '转化率', '状态', '操作'].map((h) => (
                    <th key={h} style={{ padding: '14px 20px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.ikb }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {generated.successCases.map((sc, idx) => (
                  <tr
                    key={sc.title}
                    style={{ borderTop: `0.5px solid ${C.line}` }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(168,197,224,0.1)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: C.ink, textShadow: C.textShadow }}>
                      {sc.title.length > 28 ? `${sc.title.slice(0, 28)}…` : sc.title}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600, background: 'rgba(168,197,224,0.2)', color: C.ikb }}>
                        {sc.category}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.84)' }}>
                      {sc.outcome.length > 20 ? `${sc.outcome.slice(0, 20)}…` : sc.outcome}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <CaseStatusBadge status={getCaseStatus(idx)} />
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <button
                        type="button"
                        className="lg-glass"
                        style={{ display: 'flex', height: 28, width: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 8, cursor: 'pointer', border: 'none', color: 'rgba(255,255,255,0.84)', background: 'transparent' }}
                        aria-label={`操作 ${sc.title}`}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.ikb; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.84)'; }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden={true}>more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>

      {/* ── 成功案例参考 cards ──────────────────────────────── */}
      <Reveal>
        <div className="lg-glass" style={{ marginTop: 20, overflow: 'hidden', borderRadius: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: 'linear-gradient(110deg,rgba(168,197,224,0.35) 0%,rgba(120,160,220,0.25) 100%)', backdropFilter: 'blur(8px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'flex', height: 32, width: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'rgba(255,255,255,0.15)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: C.ikb }} aria-hidden={true}>emoji_events</span>
              </span>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.display, textShadow: C.textShadow }}>成功案例参考</h3>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 9999, background: 'rgba(168,197,224,0.2)', padding: '4px 12px', fontSize: 11, fontWeight: 600, color: C.ikb }}>
              {generated.successCases.length} 个案例
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: 24 }}>
            {generated.successCases.map((sc, idx) => (
              <motion.div
                key={sc.title}
                className="lg-glass"
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ borderRadius: 16, padding: 20 }}
              >
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <CaseStatusBadge status={getCaseStatus(idx)} />
                  <span style={{ borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600, background: 'rgba(168,197,224,0.2)', color: C.ikb }}>
                    {sc.category}
                  </span>
                </div>
                <p style={{ marginBottom: 12, fontSize: 14, fontWeight: 700, color: C.ink, textShadow: C.textShadow }}>{sc.title}</p>
                {sc.journey && (
                  <div className="lg-glass" style={{ marginBottom: 10, borderRadius: 10, padding: 12 }}>
                    <p style={{ marginBottom: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.ikb }}>成长历程</p>
                    <p style={{ fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.84)' }}>{sc.journey}</p>
                  </div>
                )}
                <div className="lg-glass" style={{ marginBottom: 10, borderRadius: 10, padding: 12, background: 'rgba(168,224,180,0.1)' }}>
                  <p style={{ marginBottom: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(168,224,180,0.9)' }}>最终成果</p>
                  <p style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.5, color: 'rgba(168,224,180,0.9)' }}>{sc.outcome}</p>
                </div>
                {sc.insight && (
                  <div className="lg-glass" style={{ borderRadius: 10, padding: 12, background: 'rgba(168,197,224,0.1)' }}>
                    <p style={{ marginBottom: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.accent3 }}>启示</p>
                    <p style={{ fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.84)' }}>{sc.insight}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ── 市场分析 card ───────────────────────────────────── */}
      <Reveal>
        <div className="lg-glass" style={{ marginTop: 20, borderRadius: 20, padding: 24 }}>
          <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 700, color: C.ink, textShadow: C.textShadow }}>
            <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.22)', color: C.ikb }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>insights</span>
            </span>
            市场分析
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { key: '行业分析', val: generated.marketAnalysis.industryAnalysis },
              { key: '市场规模', val: generated.marketAnalysis.marketScale },
              { key: '竞争格局', val: generated.marketAnalysis.competition },
              { key: '变现潜力', val: generated.marketAnalysis.monetizationPotential },
            ].map((item) => (
              <div key={item.key} className="lg-glass" style={{ borderRadius: 12, padding: 16 }}>
                <p style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.ikb, textShadow: C.textShadow }}>
                  <span style={{ display: 'inline-block', width: 2, height: 10, borderRadius: 1, background: C.grad, marginRight: 2 }} aria-hidden={true} />
                  {item.key}
                </p>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.84)' }}>{item.val}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ── 数据洞察 band ──────────────────────────────────── */}
      <Reveal>
        <div style={{ marginTop: 20, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }} aria-hidden={true}>insights</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, textShadow: C.textShadow }}>数据洞察</h2>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)' }}>· AI 综合评估 · 实时测算</span>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 9999, background: 'rgba(168,197,224,0.18)', padding: '4px 12px', fontSize: 12, fontWeight: 600, color: C.ikb }}>
            <span style={{ height: 6, width: 6, borderRadius: '50%', background: C.ikb, display: 'inline-block' }} />
            模型已就绪
          </span>
        </div>
      </Reveal>
      <div style={{ marginBottom: 28, display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 20 }}>
        {/* 变现能力雷达 */}
        <motion.div
          className="lg-glass"
          whileHover={{ y: -4 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          style={{ borderRadius: 20, padding: 24 }}
        >
          <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.22)', color: C.ikb }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>radar</span>
              </span>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, textShadow: C.textShadow }}>变现能力雷达</h3>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', margin: 0 }}>六维模型评估</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, fontFamily: F.display, background: C.grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent', textShadow: 'none', margin: 0 }}>81</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.84)', margin: 0 }}>综合分</p>
            </div>
          </div>
          {(() => {
            const dims = RADAR_DIMS_S4B;
            const cx = 130, cy = 122, R = 88;
            const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
            const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
            const poly = (r: number) => dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
            const dataPoly = dims.map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');
            return (
              <svg viewBox="0 0 260 244" style={{ width: '100%' }} role="img" aria-label="变现能力雷达图">
                <defs>
                  <linearGradient id="s4b-radarFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d8e8ff" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="#7fb0e6" stopOpacity="0.12" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <polygon key={f} points={poly(R * f)} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                ))}
                {dims.map((_, i) => {
                  const [x, y] = pt(i, R);
                  return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
                })}
                <polygon points={dataPoly} fill="url(#s4b-radarFill)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
                {dims.map((d, i) => {
                  const [x, y] = pt(i, R * (d.value / 100));
                  return <circle key={i} cx={x} cy={y} r="3.2" fill="rgba(255,255,255,0.9)" stroke={d.color} strokeWidth="2" />;
                })}
                {dims.map((d, i) => {
                  const [x, y] = pt(i, R + 16);
                  return (
                    <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.7)" fontSize="10.5" fontWeight="600">
                      {d.label}
                    </text>
                  );
                })}
              </svg>
            );
          })()}
          <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
            {RADAR_DIMS_S4B.map((d) => (
              <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ height: 8, width: 8, borderRadius: '50%', backgroundColor: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)' }}>{d.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.ink }}>{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 营收增长预估 */}
        <motion.div
          className="lg-glass"
          whileHover={{ y: -4 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          style={{ borderRadius: 20, padding: 24 }}
        >
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(228,238,255,0.18)', color: C.yellow }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>show_chart</span>
              </span>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, textShadow: C.textShadow }}>营收增长预估</h3>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', margin: 0 }}>按当前变现矩阵测算</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {['营收', '增速', '复购'].map((t, i) => (
                <span
                  key={t}
                  style={i === 0
                    ? { borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 600, background: 'linear-gradient(110deg,#4a7fd4,#2a5abf)', color: '#fff' }
                    : { borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.84)' }
                  }
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <p style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow, margin: 0 }}>¥190万</p>
            <span style={{ marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 2, borderRadius: 9999, background: 'rgba(168,197,224,0.2)', padding: '2px 8px', fontSize: 12, fontWeight: 700, color: C.ikb }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden={true}>trending_up</span>+128%
            </span>
            <span style={{ marginBottom: 4, fontSize: 12, color: 'rgba(255,255,255,0.84)' }}>同比增长</span>
          </div>
          {(() => {
            const data = REVENUE_TREND_S4B;
            const W = 560, H = 168, padL = 6, padR = 6, padT = 12, padB = 8;
            const innerW = W - padL - padR, innerH = H - padT - padB, max = 210;
            const x = (i: number) => padL + (innerW * i) / (data.length - 1);
            const y = (v: number) => padT + innerH * (1 - v / max);
            const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
            const area = `${line} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
            return (
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }} role="img" aria-label="营收增长趋势图">
                <defs>
                  <linearGradient id="s4b-trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d8e8ff" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#d8e8ff" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="s4b-trendLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#d8e8ff" />
                    <stop offset="100%" stopColor="#a8c5e0" />
                  </linearGradient>
                </defs>
                {[0, 0.33, 0.66, 1].map((f) => (
                  <line key={f} x1={padL} x2={W - padR} y1={(padT + innerH * f).toFixed(1)} y2={(padT + innerH * f).toFixed(1)} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                ))}
                <path d={area} fill="url(#s4b-trendFill)" />
                <path d={line} fill="none" stroke="url(#s4b-trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((v, i) =>
                  i % 3 === 0 ? <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="rgba(255,255,255,0.9)" stroke={C.ikb} strokeWidth="2" /> : null,
                )}
              </svg>
            );
          })()}
          <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', paddingLeft: 4, paddingRight: 4, fontSize: 10, color: 'rgba(255,255,255,0.84)' }}>
            {REVENUE_LABELS_S4B.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Footer actions ──────────────────────────────────── */}
      <Reveal>
        <motion.div
          className="lg-glass"
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          style={{ marginTop: 8, borderRadius: 20, padding: 24 }}
        >
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.84)' }}>这个结果对你有帮助吗？</span>
              <button
                type="button"
                onClick={handleFeedbackUp}
                className="lg-glass"
                style={{ display: 'flex', height: 32, width: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 10, cursor: 'pointer', border: 'none', color: 'rgba(255,255,255,0.84)', background: 'transparent' }}
                aria-label="有帮助"
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.ikb; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>thumb_up</span>
              </button>
              <button
                type="button"
                onClick={handleFeedbackDown}
                className="lg-glass"
                style={{ display: 'flex', height: 32, width: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 10, cursor: 'pointer', border: 'none', color: 'rgba(255,255,255,0.84)', background: 'transparent' }}
                aria-label="没帮助"
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,180,150,0.9)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>thumb_down</span>
              </button>
            </div>
          </div>
        </motion.div>
      </Reveal>
    </LiquidShell>
  );
}
