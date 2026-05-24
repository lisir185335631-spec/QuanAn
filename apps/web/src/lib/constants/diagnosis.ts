// D-227 · DIAGNOSIS_DIMENSIONS_8 字面 1:1 spec §8.5.1 line 2392-2425

export interface DiagnosisDimension {
  id: string;
  label: string;
  subtitle: string;
  checkboxes: readonly string[];
}

// §5.1.1 字面对齐(偏离 1/2 修复 · 无空格)
export const DIAGNOSIS_H1 = '7维度IP诊断报告' as const;
export const DIAGNOSIS_SUBTITLE = '像老师一样诊断你的IP，找出问题，给出具体可执行的改进方案' as const;
// 全角括号修复
export const DIAGNOSIS_NOTES_PLACEHOLDER = '补充说明（选填，越详细诊断越准）' as const;

// §5.1.2 DIAGNOSIS_STAGES_4 重写(增 desc 字段)
export const DIAGNOSIS_STAGES_4 = [
  { value: 'startup', label: '起步期', desc: '刚开始做IP，还在摸索中' },
  { value: 'growth', label: '成长期', desc: '有一定内容了，但变现不稳定' },
  { value: 'breakout', label: '爆发期', desc: '内容有爆款，正在放大变现' },
  { value: 'plateau', label: '瓶颈期', desc: '遇到增长瓶颈，需要突破' },
] as const;

// §5.1.3 CHIP_LABEL 新增
export const DIAGNOSIS_CHIP_LABEL = 'IP健康度诊断' as const;

// §5.1.4 STEP1_LABELS 新增
export const DIAGNOSIS_STEP1_LABELS = {
  industry: '你的行业',
  product: '你的产品/服务',
  stage: '你目前的阶段',
} as const;

// §5.1.5 7 维度 textarea placeholder 新增
export const DIAGNOSIS_DIMENSION_PLACEHOLDERS: Record<string, string> = {
  positioning: '简单描述你的赛道和产品，比如：美业赛道，主推皮肤管理项目，引流品是9.9体验，利润品是年卡...',
  branding: '你现在的昵称和简介是什么？',
  traffic: '你发过哪些流量型内容？最高播放量多少？',
  value: '你发过哪些价值型内容？效果怎么样？',
  case: '你有多少个成功案例？是怎么展示的？',
  persona: '你发过哪些人设型内容？',
  authentic: '你拍视频的状态是怎样的？是对着镜头自然说话还是念稿？',
};

// §5.1.6 navigation button 字面新增
export const DIAGNOSIS_BUTTONS = {
  prev: '上一步',
  next: '下一步',
  generate: '生成诊断报告',
  restart: '重新诊断',
  history: '诊断历史',
  todayTasks: '查看今日任务',
} as const;

// §5.1.7 报告页 4 个 interface
export interface ActionPlanCardData {
  num: number;
  title: string;
  dimension: string;
  deadline: string;
}

export interface DimensionDetailData {
  num: number;
  label: string;
  status: string;
  problem: string;
  solutions: ReadonlyArray<{ heading: string; body: string; sub?: ReadonlyArray<{ heading: string; body: string }> }>;
}

export interface PriorityStepData {
  num: number;
  title: string;
  exec: string;
}

export interface WeeklyTaskItem {
  heading: string;
  body: string;
}

export interface DiagnosisMockReport {
  overallScore: number;
  dimensionScores: ReadonlyArray<{ id: string; shortLabel: string; radarLabel: string; score: number }>;
  coreIssues: ReadonlyArray<string>;
  intro: string;
  reportH2: string;
  overallVerdictLead: string;
  overallVerdictBody: string;
  details: ReadonlyArray<DimensionDetailData>;
  priorityIntro: string;
  prioritySteps: ReadonlyArray<PriorityStepData>;
  weeklyTasks: ReadonlyArray<WeeklyTaskItem>;
  closingNote: string;
  actionPlans: ReadonlyArray<ActionPlanCardData>;
}

export const DIAGNOSIS_MOCK_REPORT: DiagnosisMockReport = {
  overallScore: 0,
  dimensionScores: [
    { id: 'positioning', shortLabel: '定位清晰', radarLabel: '定位', score: 0 },
    { id: 'branding',    shortLabel: '账号包装', radarLabel: '包装', score: 0 },
    { id: 'traffic',     shortLabel: '流量型内', radarLabel: '流',   score: 0 },
    { id: 'value',       shortLabel: '价值型内', radarLabel: '价值', score: 0 },
    { id: 'case',        shortLabel: '案例型内', radarLabel: '案例', score: 0 },
    { id: 'persona',     shortLabel: '人设型内', radarLabel: '设',   score: 0 },
    { id: 'authentic',   shortLabel: '内容状态', radarLabel: '状态', score: 0 },
  ],
  coreIssues: [
    '定位模糊，缺乏明确的目标客户和产品价值主张。',
    '账号包装缺失，无法建立专业和信任的第一印象。',
    '内容体系空白，没有吸引精准流量和建立信任的策略。',
    '表达方式未经训练，可能存在念稿、播音腔等问题，影响内容真实性和感染力。',
  ],
  intro: '老铁，看你这情况，我直接跟你说，你现在就是一张白纸，甚至连白纸都算不上，因为你连笔都还没拿起来。这7个维度全是0分，说明你压根儿就还没开始，或者说，你对IP孵化这事儿的理解，还停留在非常初级的阶段。',
  reportH2: 'IP诊断报告',
  overallVerdictLead: '整体评价：',
  overallVerdictBody: '你现在就是个"裸奔"状态，啥都没有，离变现还隔着十万八千里。',
  details: [
    {
      num: 1, label: '定位清晰度',
      status: '你没填任何定位信息，说明你对"要卖什么、卖给谁、怎么卖"这些核心问题，根本没想清楚，或者说，想了但没落地。',
      problem: '没定位，就没方向。你不知道你的目标客户是谁，不知道他们有什么痛点，更不知道你的产品能怎么解决他们的痛点。这就好比你开了一家店，但不知道卖啥，也不知道谁会来买，那肯定没人光顾。',
      solutions: [
        { heading: '确定赛道：', body: '"企业服务"太泛了。你的产品是"定制智能体和opc培训"，这听起来是给企业提供AI解决方案和自动化控制培训。你的目标客户是哪些企业？是制造业？科技公司？还是服务业？先圈定一个细分赛道，比如"制造业数字化转型中的智能体应用"或者"工业自动化领域的OPC技术赋能"。' },
        { heading: '产品定位明确：', body: '你的"定制智能体"具体解决企业什么问题？提高效率？降低成本？优化决策？"OPC培训"是给谁培训？技术人员？管理层？培训后能达到什么效果？把这些想清楚，用一句话概括你的产品价值。' },
        { heading: '产品链条清晰：', body: '你是只卖定制服务和培训？还是有后续的维护、升级、咨询服务？有没有配套的软件或硬件产品？把你的产品和服务组合成一个清晰的价值链条。' },
      ],
    },
    {
      num: 2, label: '账号包装',
      status: '没填任何包装信息。',
      problem: '账号包装是你的门面，是用户对你的第一印象。如果门面都没有，或者乱七八糟，精准用户根本不会点进来，更别说停留和转化了。',
      solutions: [
        { heading: '头像生活化：', body: '别用什么公司Logo、风景照、卡通图。用你本人的真实照片，最好是半身照，面带微笑，显得专业又亲和。让人感觉你是个活生生的人，而不是一个冷冰冰的机构。' },
        { heading: '昵称：', body: '结合你的名字或外号 + 行业。比如你叫张三，你的行业是智能体/OPC，可以叫"张三智能体老张"、"OPC老张说智能"。这样既有辨识度，又能让人一眼看出你是干啥的。' },
        {
          heading: '简介垂直：', body: '按照"我是谁 + 解决什么问题 + 提供什么价值 + 案例"的模板来写。',
          sub: [
            { heading: '我是谁：', body: '比如"我是老张，深耕工业智能体/OPC技术5年"。' },
            { heading: '解决什么问题：', body: '"帮助企业解决生产效率低下、数据孤岛、自动化升级难题"。' },
            { heading: '提供什么价值：', body: '"提供定制化智能体解决方案和实战OPC培训，让你的工厂聪明起来"。' },
            { heading: '案例（可选，初期可不写）：', body: '"已成功赋能XX家企业实现数字化转型"。' },
          ],
        },
      ],
    },
    {
      num: 3, label: '流量型内容',
      status: '没填任何内容信息。',
      problem: '没流量，就没人知道你，更别谈变现。你的目标是把精准客户勾进来，而不是泛泛的流量。',
      solutions: [
        {
          heading: '行业猎奇/奇葩/冷知识：', body: '针对你确定的细分赛道，去挖掘那些普通人不知道、但行业内又很关注的"猛料"。',
          sub: [
            { heading: '比如：', body: '"你知道吗？一个智能体能让工厂的废品率降低30%！"（猎奇）' },
            { heading: '', body: '"OPC协议里藏着多少工业数据黑科技，90%的工程师都不知道！"（冷知识）' },
            { heading: '', body: '"别再用土办法管理工厂了！你的竞争对手已经用AI智能体悄悄超车了！"（制造焦虑/奇葩现象）' },
          ],
        },
        {
          heading: '选题方向：', body: '围绕"智能体"和"OPC培训"这两个核心，去拆解出用户感兴趣的点。比如：',
          sub: [
            { heading: '', body: '"智能体是如何在流水线上\'思考\'的？"' },
            { heading: '', body: '"OPC UA：工业4.0的\'普通话\'，你还不会说？"' },
            { heading: '', body: '"工厂老板必看：定制智能体，到底能省多少钱？"' },
          ],
        },
        { heading: '目标：', body: '至少要有一条视频播放量破10万，把精准人群吸引进来。' },
      ],
    },
    {
      num: 4, label: '价值型内容',
      status: '没填任何内容信息。',
      problem: '流量型内容吸引来人，价值型内容才能留住人、建立信任。没有价值，用户看完就走了，变现无从谈起。',
      solutions: [
        {
          heading: '干货/教知识：', body: '把你的专业知识拆解成小块，用通俗易懂的方式讲出来。',
          sub: [
            { heading: '比如：', body: '"3分钟搞懂智能体定制流程，避开3个大坑！"' },
            { heading: '', body: '"OPC UA实战教程：从入门到掌握，这5个步骤最关键！"' },
            { heading: '', body: '"如何判断你的工厂是否需要定制智能体？3个核心指标告诉你！"' },
          ],
        },
        {
          heading: '痛点解决方案：', body: '围绕你目标客户的实际痛点，给出具体的解决方案。',
          sub: [
            { heading: '', body: '"工厂数据孤岛怎么办？一个智能体帮你打通所有环节！"' },
            { heading: '', body: '"OPC通信不稳定？这几个排查方法，让你告别掉线烦恼！"' },
            { heading: '', body: '"想提升生产效率？智能体帮你优化排产，效率提升20%！"' },
          ],
        },
        { heading: '目标：', body: '必须爆一条20万+播放的视频，让你的专业度深入人心。' },
      ],
    },
    {
      num: 5, label: '案例型内容',
      status: '没填任何内容信息。',
      problem: '口说无凭，案例是最好的证明。没有案例，用户怎么相信你的服务是有效的？',
      solutions: [
        { heading: '清晰展现结果：', body: '用数据说话。比如"为XX工厂定制智能体后，生产效率提升25%，成本降低10%。"或者"XX学员通过OPC培训，成功解决现场通信难题，获得晋升。"' },
        { heading: '详细过程：', body: '简单介绍一下你是怎么做到的。比如"我们如何通过AI视觉智能体，识别产品缺陷，将质检效率提升3倍。"' },
        { heading: '用户评价：', body: '最直接、最有说服力。可以是你和客户的对话截图，或者客户的录音、视频评价。' },
        { heading: '形式：', body: '可以是短视频，也可以是图文案例分享。' },
      ],
    },
  ],
  priorityIntro: '你现在是0分，所以每一步都得从头开始，没有捷径。',
  prioritySteps: [
    { num: 1, title: '第一步（本周内）：定位清晰度',          exec: '彻底想清楚你的细分赛道、产品定位和产品链条。用纸笔写下来，越详细越好。这是你所有后续工作的基础。' },
    { num: 2, title: '第二步（1周内）：账号包装',             exec: '按照我上面说的，拍好头像，想好昵称，写出垂直简介。这是你IP的门面，没门面谁会进来？' },
    { num: 3, title: '第三步（2周内）：内容策略规划',          exec: '围绕你的定位，分别规划至少3-5条流量型内容选题、3-5条价值型内容选题。先想好主题和大概的表达方式，不用立刻拍。' },
    { num: 4, title: '第四步（3周内）：流量型内容制作与发布',  exec: '制作并发布第一批2-3条流量型内容。重点是破行业流量层级，把精准人群勾进来。' },
    { num: 5, title: '第五步（4周内）：价值型内容制作与发布',  exec: '制作并发布第一批2-3条价值型内容。重点是展现专业度，建立信任。' },
  ],
  weeklyTasks: [
    { heading: '明确细分赛道：', body: '锁定你的"定制智能体"和"OPC培训"具体服务哪类企业，解决什么核心问题。用一句话总结你的核心价值。' },
    { heading: '设计账号包装：', body: '拍一张专业又亲和的头像，想一个"小名/外号+行业"的昵称，并写出你的账号简介（我是谁+解决什么问题+提供什么价值）。' },
    { heading: '挖掘流量选题：', body: '针对你的细分赛道，至少想出3个"行业猎奇/奇葩/冷知识"的选题，能引发目标客户好奇心和兴趣的。' },
    { heading: '录制一条测试视频：', body: '不用发，就用手机录一段你对着镜头说话的视频，主题可以是随便一个你行业的冷知识。目的是练习口语化、有情绪的表达，避免念稿。' },
  ],
  closingNote: '记住，老铁，IP孵化变现不是玩虚的，每一步都要实打实地干。从0到1是最难的，但只要你按照这个路子走，坚持下去，变现只是时间问题。别光想，赶紧动起来！',
  actionPlans: [
    { num: 1, title: '明确细分赛道、产品定位和产品链条，形成书面文档。', dimension: '定位清晰度', deadline: '本周内' },
    { num: 2, title: '完成账号头像拍摄（生活化）、昵称设计（小名/外号+行业）和垂直简介撰写（我是谁+解决什么问题+提供什么价值）。', dimension: '账号包装', deadline: '1周内' },
    { num: 3, title: '规划至少3-5条流量型内容选题（行业猎奇/奇葩/冷知识）和3-5条价值型内容选题（干货/痛点解决方案）。', dimension: '流量型内容 & 价值型内容', deadline: '2周内' },
    { num: 4, title: '制作并发布首批2-3条流量型内容，重点测试用户反馈和播放效果。', dimension: '流量型内容', deadline: '3周内' },
    { num: 5, title: '制作并发布首批2-3条价值型内容，开始建立专业度和信任感。', dimension: '价值型内容', deadline: '4周内' },
  ],
};

// Report 页固定 H2 + 段落
export const REPORT_HEADING_PRIORITY    = '优先级排序及行动计划' as const;
export const REPORT_HEADING_WEEKLY      = '本周立即行动任务清单' as const;
export const REPORT_HEADING_ACTION_PLAN = '行动计划' as const;
export const REPORT_HEADING_CORE_ISSUES = '核心问题' as const;
export const REPORT_HEADING_DETAILED    = '详细诊断报告' as const;
export const REPORT_LABEL_SCORE_TOTAL   = 'IP健康度总分' as const;
export const REPORT_LABEL_DIMENSION_PREFIX = '维度：' as const;
export const REPORT_LABEL_DEADLINE_PREFIX  = '期限：' as const;
export const REPORT_LABEL_EXEC_PREFIX      = '具体执行：' as const;
export const REPORT_LABEL_STATUS_PREFIX    = '现状：' as const;
export const REPORT_LABEL_PROBLEM_PREFIX   = '问题在哪：' as const;
export const REPORT_LABEL_SOLUTION_PREFIX  = '具体怎么改：' as const;

// §5.1.8 已有的不动
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
