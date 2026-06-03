// analysis.ts — /analysis 文案结构分析 · 1:1 字面复刻 aiipznt sally · 2026-06-01
// mock-first · 全角标点 / 中文双引号『』/ 标签 # 全保留
// 旧 PRD-25 trpc.analysis.analyze 版整页重写 → 默认 mock 直出

export const ANALYSIS_H1 = '文案结构分析' as const;
export const ANALYSIS_SUBTITLE =
  '粘贴任意短视频文案，AI将从结构、节奏、爆款元素等多维度深度分析' as const;
export const ANALYSIS_CTA = '开始分析' as const;
export const ANALYSIS_CHAR_UNIT = '字' as const;
export const ANALYSIS_FEEDBACK_PROMPT = '这个结果对你有帮助吗？' as const;

// ── section headers ──────────────────────────────────────────────────────────
export const ANALYSIS_OVERALL_LABEL = '综合评分' as const;
export const ANALYSIS_DIMENSIONS_TITLE = '多维度评分' as const;
export const ANALYSIS_STRUCTURE_TITLE = '结构拆解' as const;
export const ANALYSIS_ELEMENTS_TITLE = '识别到的爆款元素' as const;
export const ANALYSIS_PROS_TITLE = '优点' as const;
export const ANALYSIS_CONS_TITLE = '不足' as const;
export const ANALYSIS_SUGGESTIONS_TITLE = '优化建议' as const;

// ── 默认输入文案(textarea default · 截图可见尾段逐字 · 头段同风格补全) ──────────
export const ANALYSIS_DEFAULT_COPY = `朋友圈那个开美容院的姐姐，最近突然不发优惠券了，改成每天晒AI智能体帮她回复客户、排班、算账的截图。短短三个月，她的店从勉强保本做到月入十几万。同样是美业老板，凭什么差距能这么大？

这背后其实是两种完全相反的经营理念在打架。

【正方：AI主导】
一派人坚信，未来的美业一定是AI主导。获客成本越来越高，人工咨询又慢又容易漏单，而AI智能体能7×24小时秒回消息、自动识别客户的消费偏好、精准推送项目和优惠，连老客户的回访提醒都能自动安排。一家两百平的美容院，过去要养三个前台和客服，如今一个AI智能体几乎全包，一年省下的人力成本就是十几万。把这些重复又琐碎的活儿交给AI，老板就能腾出手专注在服务和拓客上，低成本、高回报，这才是聪明人的玩法。

【反方：人情味】
另一派人却摇头。他们觉得，美业卖的从来不只是技术，而是人和人之间的那点温度。客户进店，要的是被记住、被宠着的感觉，是那句『姐，您气色今天真好』的问候。冰冷的机器算得再准，也替代不了一个记得你喜好的眼神、一次恰到好处的贴心。把服务全盘交给AI，迟早把老客户推远。

【我的立场】
但在我看来，这根本不是二选一的单选题。AI不是来抢人情味饭碗的，而是把人从机械劳动里解放出来，让你有更多精力去经营那份人情味。把标准化的事交给机器，把有温度的事留给人：让AI去做记录、提醒、算账、初步答疑，让人去做关怀、设计、谈心。真正能赚钱的美业，从来不是纯AI，也不是纯人工，而是AI的效率加上人的温度。以小博大，说的就是这个。

所以美业的未来，从来不在于你要不要用AI，而在于，你有没有看到这个趋势，有没有勇气去尝试。

【评论区引导】
你觉得美业未来是AI主导，还是人情味更重要？或者说，两者该怎么结合？评论区聊聊你的看法。

【话题标签】#美业 #AI赋能 #智能体 #赚钱思维 #效率提升 #创业者 #商业模式 #美业老板 #行业洞察` as const;

// ── 综合评分 ──────────────────────────────────────────────────────────────────
export const ANALYSIS_OVERALL_SCORE = 92 as const;

// ── 多维度评分(5) ─────────────────────────────────────────────────────────────
export interface AnalysisDimension {
  label: string;
  score: number;
}
export const ANALYSIS_DIMENSIONS: readonly AnalysisDimension[] = [
  { label: '开头吸引力', score: 95 },
  { label: '情感张力', score: 88 },
  { label: '节奏感', score: 90 },
  { label: '完播率预测', score: 92 },
  { label: '爆款元素运用', score: 93 },
] as const;

// ── 结构拆解(起承转合) ────────────────────────────────────────────────────────
export type AnalysisAccent = 'orange' | 'amber' | 'yellow' | 'green';
export interface AnalysisStructureItem {
  stage: string;
  score: number;
  type?: string;
  accent: AnalysisAccent;
  desc: string;
}
export const ANALYSIS_STRUCTURE: readonly AnalysisStructureItem[] = [
  {
    stage: '起：开头',
    score: 95,
    type: '提出问题，制造悬念',
    accent: 'orange',
    desc: '这个开头直接抛出一个大众关心的问题，制造了强烈的对比和悬念，让人忍不住想知道答案。属于黄金3秒开头中的『提出问题』和『制造悬念』的结合体，非常抓人眼球，能有效提高完播率。',
  },
  {
    stage: '承：发展',
    score: 90,
    accent: 'amber',
    desc: '发展部分通过正反两方的案例和观点，将问题具体化，展现了两种截然不同的经营理念。用数据和具体场景支撑观点，让内容更具说服力，也让观众对两种模式有了直观的理解。这种『正反辩论』的结构，能有效调动观众的思考和参与欲。',
  },
  {
    stage: '转：高潮',
    score: 92,
    accent: 'yellow',
    desc: '高潮部分给出了作者的『解决方案』和『价值主张』，将看似矛盾的两方完美结合，提出了一个新颖且实用的思路。用『低成本高回报』和『以小博大』这些爆款词汇，直接点明了核心价值，激发了观众的行动欲望。这种『化解冲突，给出解法』的转折，非常有力。',
  },
  {
    stage: '合：结尾',
    score: 95,
    accent: 'green',
    desc: '结尾部分通过开放式问题引导用户在评论区互动，极大地提升了评论率和互动率。同时，话题标签的设置精准，覆盖了目标人群，有助于视频被更多潜在用户发现。这种『互动提问』的结尾，是私域导流和数据增长的有效手段。',
  },
] as const;

// ── 识别到的爆款元素(10) ──────────────────────────────────────────────────────
export const ANALYSIS_ELEMENTS: readonly string[] = [
  '提出问题，制造悬念',
  '正反辩论，冲突感',
  '数据支撑，案例故事',
  '提供解决方案，价值主张',
  '金钱利益点（赚钱、省钱、高回报）',
  '效率提升，趋势洞察',
  '互动提问，引导评论',
  '精准话题标签',
  '口语化表达',
  '行业痛点',
] as const;

// ── 优点(6) ───────────────────────────────────────────────────────────────────
export const ANALYSIS_PROS: readonly string[] = [
  '开头直击痛点，制造悬念，吸引力强。',
  '结构清晰，通过正反辩论引出核心观点，逻辑性强。',
  '案例具体，数据支撑，增加了内容的真实性和说服力。',
  '提出了创新性的解决方案，结合了行业趋势，具有前瞻性。',
  '结尾引导互动，有效提升用户参与度，利于数据增长和私域沉淀。',
  '话题标签精准，有助于视频的精准分发和曝光。',
] as const;

// ── 不足(2) ───────────────────────────────────────────────────────────────────
export const ANALYSIS_CONS: readonly string[] = [
  '虽然提到了AI智能体，但具体是哪种AI、如何操作，没有展开说明，可能让部分观众觉得不够落地。',
  '『我的立场』部分，虽然提出了结合点，但对于如何具体操作结合，可以再多给一两个小技巧或方法，让观众更有获得感。',
] as const;

// ── 优化建议(3) ───────────────────────────────────────────────────────────────
export const ANALYSIS_SUGGESTIONS: readonly string[] = [
  '在『我的立场』部分，可以简要举例说明AI在客户维护、营销话术上具体能做些什么，让观众对『AI赋能』有更清晰的认知，比如『AI可以自动识别客户的消费偏好，推送个性化服务，省去人工筛选的麻烦』。',
  '可以考虑在视频中加入一些视觉化的元素，比如AI智能体工作的模拟画面，或者轻松赚钱老板的门店场景，增加视频的冲击力。',
  '在评论区引导后，可以再加一句『想了解更多AI赋能美业的干货，点我主页，每天分享！』，进一步强化私域导流，引导用户关注或进入社群。',
] as const;
