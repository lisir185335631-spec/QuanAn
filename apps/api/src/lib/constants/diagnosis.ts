/**
 * QuanAn · 8 步问卷 → 7 维度诊断
 * 派生自 ARCHITECTURE.md §2.5 + spec.md §8.5.1 + PROMPTS §10.2
 */

export interface DiagnosisDimension {
  step: number;
  key: string;
  label: string;
  desc: string;
  /** 该维度的自评项 */
  items: readonly { key: string; label: string }[];
}

export const DIAGNOSIS_DIMENSIONS: readonly DiagnosisDimension[] = [
  // step 1 是基本信息(行业/产品/阶段)· 不出维度报告 · 这里仅含 7 维度(step 2-8)

  {
    step: 2, key: 'positioning', label: '定位清晰度', desc: '赛道 · 产品 · 产品链条',
    items: [
      { key: 'has_track',         label: '已确定赛道方向' },
      { key: 'product_clear',     label: '产品定位明确 · 知道卖什么' },
      { key: 'product_chain',     label: '产品链条清晰(引流品→利润品→高端品)' },
    ],
  },
  {
    step: 3, key: 'packaging', label: '账号包装', desc: '头像 · 昵称 · 简介',
    items: [
      { key: 'avatar_real',       label: '头像是生活化的真人照片' },
      { key: 'nickname_format',   label: '昵称格式 · 小名/外号+行业(如 · 霖AIP·IP孵化)' },
      { key: 'bio_complete',      label: '简介包含 · 我是谁+解决什么问题+提供什么价值+案例' },
    ],
  },
  {
    step: 4, key: 'traffic_content', label: '流量型内容', desc: '破圈引流 · 勾精准人群',
    items: [
      { key: 'has_curiosity',     label: '有行业猎奇/奇葩/冷知识类选题' },
      { key: 'has_viral_video',   label: '有单条视频破 10 万播放' },
    ],
  },
  {
    step: 5, key: 'value_content', label: '价值型内容', desc: '干货 · 教学 · 建立信任',
    items: [
      { key: 'has_tutorial',      label: '有干货/教知识/痛点解决方案类内容' },
      { key: 'has_high_play',     label: '有单条视频播放量超过 20 万' },
    ],
  },
  {
    step: 6, key: 'case_content', label: '案例型内容', desc: '展示结果 · 促进成交',
    items: [
      { key: 'has_case_result',   label: '有清晰的案例结果展示' },
      { key: 'has_case_process',  label: '有详细的服务/合作过程记录' },
      { key: 'has_real_review',   label: '有真实的用户评价/反馈' },
    ],
  },
  {
    step: 7, key: 'persona_content', label: '人设型内容', desc: '让人记住你这个人',
    items: [
      { key: 'has_attitude',      label: '有对人对事的态度/观点类内容' },
      { key: 'has_story',         label: '有从业故事/创业故事类内容' },
      { key: 'has_value_show',    label: '有做公益/体恤员工/孝顺父母等内容' },
    ],
  },
  {
    step: 8, key: 'content_state', label: '内容状态', desc: '真实 · 口语 · 有情绪',
    items: [
      { key: 'is_real',           label: '内容是真实的 · 不是演的' },
      { key: 'is_oral',           label: '说话是口语化的 · 不是念稿/播音腔' },
      { key: 'has_emotion',       label: '内容有情绪感染力' },
    ],
  },
] as const;

export const DIAGNOSIS_DIMENSION_KEYS = DIAGNOSIS_DIMENSIONS.map((d) => d.key) as readonly string[];

/** IP 阶段(step1 用) */
export const IP_STAGES = [
  { key: 'starter',   label: '起步期', desc: '刚开始做 IP · 还在摸索中' },
  { key: 'growth',    label: '成长期', desc: '有一定内容了 · 但变现不稳定' },
  { key: 'breakout',  label: '爆发期', desc: '内容有爆款 · 正在放大变现' },
  { key: 'plateau',   label: '瓶颈期', desc: '遇到增长瓶颈 · 需要突破' },
] as const;

if (DIAGNOSIS_DIMENSIONS.length !== 7) {
  throw new Error(`Expected 7 diagnosis dimensions, got ${DIAGNOSIS_DIMENSIONS.length}`);
}
