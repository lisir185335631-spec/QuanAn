// D-227 · DIAGNOSIS_DIMENSIONS_8 字面 1:1 spec §8.5.1 line 2392-2425

export interface DiagnosisDimension {
  id: string;
  label: string;
  subtitle: string;
  checkboxes: readonly string[];
}

export const DIAGNOSIS_H1 = '7 维度 IP 诊断报告' as const;
export const DIAGNOSIS_SUBTITLE = '像老师一样诊断你的 IP，找出问题，给出具体可执行的改进方案' as const;
export const DIAGNOSIS_NOTES_PLACEHOLDER = '补充说明 (选填，越详细诊断越准)' as const;

export const DIAGNOSIS_STAGES_4 = [
  { value: 'startup', label: '起步期 · 刚开始做 IP，还在摸索中' },
  { value: 'growth', label: '成长期 · 有一定内容了，但变现不稳定' },
  { value: 'breakout', label: '爆发期 · 内容有爆款，正在放大变现' },
  { value: 'plateau', label: '瓶颈期 · 遇到增长瓶颈，需要突破' },
] as const;

export const DIAGNOSIS_DIMENSIONS_8: DiagnosisDimension[] = [
  { id: 'basic', label: '基本信息', subtitle: '行业 / 产品 / 阶段', checkboxes: [] },
  {
    id: 'positioning',
    label: '定位清晰度',
    subtitle: '赛道、产品、产品链条',
    checkboxes: [
      '已确定赛道方向',
      '产品定位明确，知道卖什么',
      '产品链条清晰（引流品→利润品→高端品）',
    ],
  },
  {
    id: 'branding',
    label: '账号包装',
    subtitle: '头像、昵称、简介',
    checkboxes: [
      '头像是生活化的真人照片',
      '昵称格式：小名/外号+行业（如：霖AIP·IP孵化）',
      '简介包含：我是谁+解决什么问题+提供什么价值+案例',
    ],
  },
  {
    id: 'traffic',
    label: '流量型内容',
    subtitle: '破圈引流，勾精准人群',
    checkboxes: [
      '有行业猎奇/奇葩/冷知识类选题',
      '有单条视频破10万播放',
    ],
  },
  {
    id: 'value',
    label: '价值型内容',
    subtitle: '干货教学，建立信任',
    checkboxes: [
      '有干货/教知识/痛点解决方案类内容',
      '有单条视频播放量超过20万',
    ],
  },
  {
    id: 'case',
    label: '案例型内容',
    subtitle: '展示结果，促进成交',
    checkboxes: [
      '有清晰的案例结果展示',
      '有详细的服务/合作过程记录',
      '有真实的用户评价/反馈',
    ],
  },
  {
    id: 'persona',
    label: '人设型内容',
    subtitle: '让人记住你这个人',
    checkboxes: [
      '有对人对事的态度/观点类内容',
      '有从业故事/创业故事类内容',
      '有做公益/体恤员工/孝顺父母等内容',
    ],
  },
  {
    id: 'authentic',
    label: '内容状态',
    subtitle: '真实、口语、有情绪',
    checkboxes: [
      '内容是真实的，不是演的',
      '说话是口语化的，不是念稿/播音腔',
      '内容有情绪感染力',
    ],
  },
];

// Report improvement suggestions (stub) for 7 dimensions (excluding 'basic')
export const REPORT_SUGGESTIONS: Record<string, string> = {
  positioning: '明确你的目标用户群体，找到细分赛道的差异化定位，建立清晰的产品矩阵（引流品→利润品→高端品）。',
  branding: '优化你的账号主页包装，让用户3秒内理解你是谁、能提供什么价值，确保头像、昵称、简介形成完整的IP印象。',
  traffic: '加强破圈内容的创作，通过行业冷知识、反常识内容吸引精准流量，目标单条视频破10万播放。',
  value: '持续输出干货教学内容，建立专业权威形象，提升用户信任度，目标单条视频破20万播放。',
  case: '系统整理和展示你的成功案例，用数据和故事证明你的价值，加强用户评价/反馈的收集与展示。',
  persona: '塑造鲜明的个人IP人设，让用户记住你这个人而不仅仅是你的内容，分享真实的从业故事和价值观。',
  authentic: '保持真实自然的表达状态，口语化表达更容易引发用户共鸣，内容要有情绪感染力。',
};

// 7 report dimensions (slice off 'basic' Step 1)
export const REPORT_DIMENSIONS_7 = DIAGNOSIS_DIMENSIONS_8.slice(1);
