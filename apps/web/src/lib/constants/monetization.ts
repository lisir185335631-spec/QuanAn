// monetization.ts — /monetization IP变现模型定制 · 2026-05-26

export const MONETIZATION_H1 = 'IP变现模型定制' as const;
export const MONETIZATION_SUBTITLE = '结合行业数据和全网成功案例，为您定制清晰的IP变现路径' as const;
export const MONETIZATION_FORM_TITLE = '基本信息' as const;
export const MONETIZATION_RESULT_TITLE = 'IP变现模型' as const;

export const MONETIZATION_LABEL_INDUSTRY = '选择行业' as const;
export const MONETIZATION_LABEL_PRODUCT = '产品/服务描述' as const;
export const MONETIZATION_LABEL_AUDIENCE = '目标受众（可选）' as const;
export const MONETIZATION_LABEL_POSITIONING = 'IP定位（可选）' as const;

export const MONETIZATION_DEFAULT_PRODUCT = '线上英语培训课程，面向职场白领' as const;
export const MONETIZATION_DEFAULT_AUDIENCE = '25-40岁职场女性' as const;
export const MONETIZATION_DEFAULT_POSITIONING = '专业、接地气的英语老师人设' as const;
export const MONETIZATION_DEFAULT_INDUSTRY_ID = 'self_media' as const;

export const MONETIZATION_CTA = '生成变现模型' as const;
export const MONETIZATION_FEEDBACK_PROMPT = '这个结果对你有帮助吗？' as const;

// 完整 JSON mock — §2.6 字面 1:1(全角标点保留)
export const MONETIZATION_MOCK = {
  ipAnalysis: {
    positioning: '专业、接地气的英语老师人设，聚焦职场英语提升',
    uniqueValue: '结合职场痛点，提供实用、高效的英语学习方案，而非传统应试教育',
    targetAudience: '25-40岁职场女性，追求职业发展、渴望提升英语沟通能力',
    contentPillars: [
      '职场英语口语技巧',
      '商务邮件与报告写作',
      '面试与会议英语实战',
      '英语学习方法论分享',
      '职场女性成长与英语结合',
    ],
  },
  monetizationPaths: [
    {
      path: '引流产品：免费/低价课程与资料包',
      description: '通过提供高价值的免费或低价内容，吸引潜在学员进入私域流量池',
      revenueModel: '免费引流，低价转化',
      estimatedRevenue: '0-1000元/月 (主要为引流)',
      difficulty: '低',
      timeToRevenue: '1-2周',
      steps: [
        '制作\'职场英语高频词汇包\' (0元)',
        '设计\'3天口语速成挑战营\' (9.9元)',
        '发布免费英语学习方法论直播课',
        '引导用户添加企业微信/社群',
      ],
    },
    {
      path: '信任产品：精品小课与社群服务',
      description: '提供针对特定痛点的中低价课程，建立信任，筛选高意向用户',
      revenueModel: '课程销售 + 社群服务费',
      estimatedRevenue: '5000-20000元/月',
      difficulty: '中',
      timeToRevenue: '1-2个月',
      steps: [
        '开发\'商务邮件写作精讲\' (99元)',
        '推出\'职场口语发音矫正营\' (199元)',
        '建立VIP学习社群，提供答疑服务 (299-499元)',
        '定期举办社群专属直播分享',
      ],
    },
    {
      path: '利润产品：系统性进阶课程',
      description: '提供全面、深入的英语能力提升课程，解决学员核心痛点，实现高客单价',
      revenueModel: '高价课程销售',
      estimatedRevenue: '30000-100000元/月',
      difficulty: '中高',
      timeToRevenue: '2-4个月',
      steps: [
        '设计\'职场精英英语全能提升计划\' (1980元)',
        '开发\'高阶商务谈判英语实战课\' (3980元)',
        '提供\'一对多小组口语私教课\' (4980-9800元)',
        '课程内容FABE包装：特点→优势→益处→证据',
      ],
    },
    {
      path: '后端产品：定制化服务与高阶社群',
      description: '为高净值学员提供个性化、深度服务，实现持续复购和高价值转化',
      revenueModel: '定制服务费 + 高阶社群年费',
      estimatedRevenue: '20000-50000元/月',
      difficulty: '高',
      timeToRevenue: '4-6个月',
      steps: [
        '提供\'企业内训定制方案\' (10000元+)',
        '推出\'一对一职场英语教练服务\' (15000元+)',
        '建立\'职场女性英语精英俱乐部\' (年费10000元+)',
        '邀请知名职场导师进行联名分享',
      ],
    },
  ],
  revenueStructure: {
    primary: {
      source: '系统性进阶课程销售',
      percentage: '60%',
      description: '通过高客单价的精品课程，贡献主要营收，解决用户核心痛点',
    },
    secondary: [
      { source: '精品小课与社群服务', percentage: '25%', description: '作为利润产品的前置，提供中低价位选择，培养用户付费习惯' },
      { source: '定制化服务与高阶社群', percentage: '10%', description: '服务高净值用户，提供个性化解决方案，提升品牌溢价' },
      { source: '引流产品转化', percentage: '5%', description: '低价产品带来的直接收入，主要目的是获取用户数据和建立连接' },
    ],
  },
  contentMatrix: {
    trafficContent: {
      ratio: '40%',
      types: ['免费英语学习干货短视频', '职场英语常见错误解析', '名人英语演讲片段分析', '英语学习工具推荐'],
      frequency: '每天2-3条',
    },
    trustContent: {
      ratio: '30%',
      types: ['学员成功案例分享', '课程试听片段/免费章节', '英语学习方法论深度直播', '行业专家访谈'],
      frequency: '每周3-4条',
    },
    conversionContent: {
      ratio: '30%',
      types: ['课程FABE价值拆解视频', '限时优惠/报名通道直播', '学员问答与痛点解答', '课程福利与服务介绍'],
      frequency: '每周2-3条 (集中在转化期)',
    },
  },
  phasesPlan: [
    {
      phase: 'IP启动与引流',
      duration: '1-2个月',
      goals: ['IP人设内容体系搭建', '积累1000+私域用户', '测试引流产品转化率'],
      actions: ['发布高频引流内容', '推出9.9元引流课程', '建立企业微信私域社群', '收集用户反馈'],
      kpi: ['私域用户增长率', '引流产品购买率', '内容互动率'],
    },
    {
      phase: '信任建立与小课转化',
      duration: '2-4个月',
      goals: ['推出2-3款信任产品', '提升私域用户活跃度', '实现信任产品月销5000+'],
      actions: ['发布信任内容，分享学员案例', '组织社群专属直播/答疑', '优化信任产品FABE包装', '进行小范围付费推广'],
      kpi: ['信任产品转化率', '私域用户留存率', '用户转介绍率'],
    },
    {
      phase: '利润增长与品牌升级',
      duration: '4-8个月',
      goals: ['推出1-2款利润产品', '实现利润产品月销30000+', '提升IP行业影响力'],
      actions: ['系统化课程开发与迭代', '举办线上大型分享会', '与相关品牌进行联名合作', '扩大付费流量投放'],
      kpi: ['利润产品销售额', 'IP全网曝光量', '品牌搜索指数'],
    },
    {
      phase: '后端服务与生态拓展',
      duration: '8个月+',
      goals: ['开发定制化服务', '建立高阶社群', '探索多元化变现模式'],
      actions: ['提供一对一/企业定制服务', '运营高阶付费社群', '孵化助教团队', '出版英语学习书籍/周边'],
      kpi: ['后端产品客单价', '用户生命周期价值', 'IP生态营收占比'],
    },
  ],
  riskWarnings: [
    '内容同质化风险：需持续创新，保持内容独特性和实用性',
    '用户信任度建立周期长：需耐心运营，提供真实价值',
    '市场竞争激烈：需明确差异化优势，打造不可替代的IP',
    '私域运营效率：社群管理、用户互动需投入大量精力',
  ],
  successCases: [
    { name: '李叫兽', industry: '营销/知识付费', model: '免费内容引流 + 付费课程/咨询', result: '通过深度内容建立专业人设，高价课程与咨询服务获得巨大成功' },
    { name: '秋叶大叔', industry: '职场技能/知识付费', model: '多平台内容输出 + 课程体系 + 社群运营', result: '从PPT教学切入，拓展至职场技能全方位，形成完整知识付费生态' },
    { name: '新东方在线 (部分老师IP)', industry: '教育培训', model: '名师IP打造 + 体系化课程 + 线上直播互动', result: '通过老师个人魅力和专业能力，吸引大量学生，形成忠实用户群体' },
  ],
} as const;
