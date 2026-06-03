/**
 * QuanAn · Step 4b 变现路径规划常量 — 字面锁
 * 命名锁: STEP4B_TEXTAREA / STEP4B_INPUTS_3 / STEP4B_THREE_STAGES / STEP4B_PRODUCT_TYPES_4 / STEP4B_OUTPUT_H3_5
 * D1=A 红线: 所有字面量 1:1 来源 spec §7.5 line 1516-1585, 禁止改写
 * 数字锁: STEP4B_THREE_STAGES.length === 3 · STEP4B_PRODUCT_TYPES_4.length === 4 · STEP4B_OUTPUT_H3_5.length === 5
 */

// ─── Interface Definitions ────────────────────────────────────────────────────

export interface Step4bTextarea {
  id: 'product_description';
  label: string;
  required: boolean;
  placeholder: string;
}

export interface Step4bInput {
  id: string;
  label: string;
  required: boolean;
  placeholder: string;
}

export interface Step4bStage {
  range: string;
  title: string;
  duration: string;
}

export interface Step4bOutputBlock {
  id: string;
  h3Label: string;
}

export interface Step4bProductItem {
  type: '引流品' | '信任品' | '利润品' | '后端产品';
  name: string;
  priceRange: string;
  targetCustomer: string;
  monthlyTarget: string;
  monthlyRevenue: string;
}

export interface Step4bStageDetail {
  range: string;
  title: string;
  duration: string;
  coreStrategy: string;
  productMatrix: Step4bProductItem[];
  trafficStrategy: string;
  conversionFlow: string[];
  keyActions: string[];
  risks: string[];
}

export interface Step4bResult {
  market_analysis: {
    industry: string;
    marketSize: string;
    competitionLevel: string;
    monetizationPotential: string;
  };
  three_stages: [Step4bStageDetail, Step4bStageDetail, Step4bStageDetail];
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

// ─── Page Labels ──────────────────────────────────────────────────────────────

// D-224 字面锁 · PRD-22 US-008 更新 · uppercase B
export const STEP4B_STEP_TAG = 'STEP 04B · 变现路径规划';
export const STEP4B_H1 = '变现路径规划';

// STEP4B_SUBTITLE_TEMPLATE · 字面严格 1:1 来源 spec §7.5 line 1521 · 含全角箭头 → · 全角中文冒号
export const STEP4B_SUBTITLE_TEMPLATE =
  '当前行业：{industry}。AI 将为你规划三阶梯变现路径：0→90 万、100 万→1000 万、1000 万→1 亿，每个阶梯有具体的产品设计、定价策略和成交流程。';

// ─── Form Inputs ──────────────────────────────────────────────────────────────

// STEP4B_TEXTAREA · 产品/服务描述 · 必填 textarea · spec §7.5 — PRD-22 US-008 placeholder 更新为多行格式
export const STEP4B_TEXTAREA: Step4bTextarea = {
  id: 'product_description',
  label: '产品/服务描述',
  required: true,
  placeholder:
    '描述你的产品或服务，比如：\n- 美容院皮肤管理项目，客单价500-3000元\n- 线上知识付费课程，定价199-999元',
};

// STEP4B_INPUTS_3 · PRD-22 US-008 更新 · 仅保留"行业领域" 1 项(PlatformInlineRadio 单独渲染)
export const STEP4B_INPUTS_3: readonly Step4bInput[] = [
  {
    id: 'industry',
    label: '行业领域',
    required: false,
    placeholder: '如：美容行业 / 教育培训 / 母婴育儿',
  },
] as const;

// ─── Buttons ──────────────────────────────────────────────────────────────────

// spec §7.5 line 1532: [生成变现路径] / [智能优化] / [重新生成]
export const STEP4B_BUTTON_GENERATE = '生成变现路径';
export const STEP4B_BUTTON_OPTIMIZE = '智能优化';
export const STEP4B_BUTTON_REGENERATE = '重新生成';
export const STEP4B_LOADING_TEXT = 'AI 正在规划你的变现路径，预计 60-120 秒...';

// ─── Three Stages Schema ──────────────────────────────────────────────────────

// STEP4B_THREE_STAGES · 3 项严格字面 1:1 来源 spec §7.5 line 1546-1564
// range 严禁改写为 '0万→90万' 或 '0-90万' · 全角箭头 → 必保留
export const STEP4B_THREE_STAGES: readonly [Step4bStage, Step4bStage, Step4bStage] = [
  {
    range: '0→90万',
    title: '积累案例与私域流量，验证培训模型',
    duration: '6-12个月',
  },
  {
    range: '100万→1000万',
    title: '扩张团队 + 标准化产品 + 多渠道引流',
    duration: '12-24个月',
  },
  {
    range: '1000万→1亿',
    title: '品牌化运营 + 资源整合 + 跨界合作',
    duration: '24-60个月',
  },
] as const;

// ─── Product Types ────────────────────────────────────────────────────────────

// STEP4B_PRODUCT_TYPES_4 · 4 产品类型字面 1:1 来源 spec §7.5 line 1551 · 中文字面严禁翻译为英文 enum
export const STEP4B_PRODUCT_TYPES_4 = ['引流品', '信任品', '利润品', '后端产品'] as const;

// ─── Output H3 Blocks ─────────────────────────────────────────────────────────

// STEP4B_OUTPUT_H3_5 · 5 H3 输出区 — D-220 字面锁 · PRD-22 US-008 更新
// 字面严守: "初阶变现路径/中阶变现路径/高阶变现路径" 禁止改写为 "低阶/中阶/高阶" 或 "阶段一/二/三"
export const STEP4B_OUTPUT_H3_5 = [
  { id: 'stage_low',           h3Label: '初阶变现路径' },
  { id: 'stage_mid',           h3Label: '中阶变现路径' },
  { id: 'stage_high',          h3Label: '高阶变现路径' },
  { id: 'revenue_structure',   h3Label: '收入结构分析' },
  { id: 'success_cases',       h3Label: '成功案例参考' },
] as const;

// 粉丝量级 stub · 按阶梯 index 对应
export const STEP4B_STAGE_FOLLOWER_RANGES = [
  '0-5000粉',
  '5000-5万粉',
  '5万粉以上',
] as const;

// 月收入预估 stub · 按阶梯 index 对应
export const STEP4B_STAGE_REVENUE_ESTIMATES = [
  '月收入3,000-8,000元',
  '月收入1-5万元',
  '月收入5万元以上',
] as const;

// ─── PRD-29.10 · 真实字面(根据 sally zhao /step/4b demo 截图)─────────
// 旧 step4b 常量是 PRD-20 历史 schema · 跟实际 aiipznt 不符 · 保留 @deprecated
// 实际 aiipznt sally /step/4b · form 4 字段 + 4 output sub-component

// 顶部 breadcrumb + H1
export const STEP4B_BREADCRUMB_REAL = 'STEP 04b › 变现路径规划' as const;
export const STEP4B_H1_REAL = '变现路径' as const;
export const STEP4B_OUTPUT_H2_REAL = '你的三阶梯变现路径' as const;
export const STEP4B_SUBTITLE_REAL = '当前行业：{industry}。AI将为你规划三阶梯变现路径：0→90万、100万→1000万、1000万→1亿，每个阶梯有具体的产品设计、定价策略和成交流程。' as const;

// CTA 字面
export const STEP4B_BUTTON_GENERATE_REAL = '生成变现路径' as const;
export const STEP4B_CTA_BULK_OPTIMIZE = '智能优化' as const;
export const STEP4B_CTA_BULK_REGENERATE = '重新生成' as const;
export const STEP4B_CTA_BULK_COPY = '复制全部' as const;

// footer
export const STEP4B_FOOTER_FEEDBACK_QUESTION = '这个结果对你有帮助吗？' as const;

// form labels
export const STEP4B_FORM_PRODUCT_LABEL = '产品/服务描述' as const;
export const STEP4B_FORM_AUDIENCE_LABEL = '目标受众' as const;
export const STEP4B_FORM_IP_LABEL = 'IP定位' as const;
export const STEP4B_FORM_INCOME_LABEL = '当前收入水平' as const;
