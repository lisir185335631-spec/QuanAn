/**
 * QuanAn · Step 7 文案生成常量 — 字面锁
 * 命名锁: STEP7_SCRIPT_TYPES_20 / STEP7_ELEMENT_GROUPS_4 / STEP7_ELEMENTS_22 / STEP7_DEBATE_H4_4
 * D1=A 红线: 所有字面量 1:1 来源 spec §7.8 line 1665-1744, 禁止改写
 * 数字锁: STEP7_SCRIPT_TYPES_20.length === 20 · STEP7_ELEMENT_GROUPS_4.length === 4
 *         STEP7_ELEMENTS_22.length === 22 (6+5+6+5) · STEP7_DEBATE_H4_4.length === 4
 */

// ─── Interface Definitions ────────────────────────────────────────────────────

export interface Step7ScriptType {
  id: string;
  name: string;
  positioning: string;
}

export interface Step7ElementGroup {
  key: string;
  label: string;
}

export interface Step7Element {
  id: string;
  label: string;
  groupKey: string;
}

export interface Step7Textarea {
  id: string;
  label: string;
  required: boolean;
  placeholder: string;
}

export interface Step7DebateH4 {
  id: string;
  h4Label: string;
}

export interface Step7DebateResult {
  title: string;
  topic_hook: string;
  pros_arguments: string;
  cons_arguments: string;
  my_stance: string;
  comment_guide: string;
  topic_tags: string[];
}

export interface Step7Result {
  script_type: string;
  title: string;
  body: Step7DebateResult | object;
}

// ─── Page Labels ──────────────────────────────────────────────────────────────

export const STEP7_STEP_TAG = 'STEP 07 · AI 智能文案生成';
export const STEP7_H1 = '文案生成';

// STEP7_SUBTITLE · 字面严格 1:1 spec §7.8 line 1671
export const STEP7_SUBTITLE =
  '选择脚本类型和爆款元素，输入主题，AI 将基于方法论生成深度爆款文案，支持 AI 智能修改优化。';

// ─── Script Types (20) ────────────────────────────────────────────────────────

// STEP7_SCRIPT_TYPES_20 · 20 项严格 · spec line 1675 '20 选 1'
// 第 1 = debate(搞辩论) · 其余 19 推断业界主流
export const STEP7_SCRIPT_TYPES_20: readonly Step7ScriptType[] = [
  { id: 'debate',           name: '搞辩论',   positioning: '正反方激烈对撞，引发评论区站队，适合争议性话题' },
  { id: 'opinion',          name: '聊观点',   positioning: '分享独特见解与价值观，引发读者思考，适合建立专家形象' },
  { id: 'story',            name: '讲故事',   positioning: '通过真实故事引发情感共鸣，增强观众代入感，适合个人品牌' },
  { id: 'case_study',       name: '案例分析', positioning: '深度剖析真实案例，提炼可复用方法论，适合干货分享' },
  { id: 'tutorial',         name: '教程攻略', positioning: '手把手教学步骤拆解，降低学习门槛，适合技能类内容' },
  { id: 'review',           name: '产品测评', positioning: '真实使用体验分享，优缺点客观对比，适合消费决策参考' },
  { id: 'industry_insight', name: '行业洞察', positioning: '深度解读行业趋势，预判发展方向，适合专业人士' },
  { id: 'personal_growth',  name: '个人成长', positioning: '分享成长感悟与实践，激励他人突破自我，适合励志' },
  { id: 'product_intro',    name: '产品种草', positioning: '生动展示产品价值，激发购买欲望，适合品牌推广' },
  { id: 'live_promotion',   name: '直播预告', positioning: '预热直播内容，提前吸引观众预约，适合直播营销' },
  { id: 'fact_check',       name: '辟谣打假', positioning: '用数据事实破解常见误区，树立权威形象，适合纠错' },
  { id: 'pain_point',       name: '痛点共鸣', positioning: '精准戳中受众痛点，提供解决方案，适合高转化内容' },
  { id: 'data_driven',      name: '数据驱动', positioning: '用数据说话，用事实支撑观点，适合理性分析型内容' },
  { id: 'list',             name: '清单盘点', positioning: '结构化整理优质内容，易于收藏传播，适合资源汇总类' },
  { id: 'before_after',     name: '前后对比', positioning: '直观展示变化效果，增强说服力，适合效果展示' },
  { id: 'qa',               name: '问答互动', positioning: '解答粉丝疑问，增强互动黏性，适合维护粉丝关系' },
  { id: 'industry_secret',  name: '行业内幕', positioning: '揭露不为人知的行业真相，满足好奇心，适合吸睛' },
  { id: 'milestone',        name: '里程碑',   positioning: '分享重要节点成就，激励粉丝见证成长，适合情感联结' },
  { id: 'behind_scenes',    name: '幕后揭秘', positioning: '展示创作/工作真实过程，增强真实感与信任，适合粉丝运营' },
  { id: 'controversy',      name: '争议讨论', positioning: '引发正反两极讨论，激活评论区互动，适合话题营销' },
] as const;

// ─── Element Groups (4) ───────────────────────────────────────────────────────

// STEP7_ELEMENT_GROUPS_4 · 4 项严格 · spec §7.8 line 1693 分组 key/label 字面 1:1
export const STEP7_ELEMENT_GROUPS_4: readonly Step7ElementGroup[] = [
  { key: 'hook',        label: '内容钩子' },
  { key: 'emotion',     label: '情绪触发' },
  { key: 'structure',   label: '结构强化' },
  { key: 'interaction', label: '互动引导' },
] as const;

// ─── Elements (22) ────────────────────────────────────────────────────────────

// STEP7_ELEMENTS_22 · 22 项严格 · 4 分组累加 = 6+5+6+5 = 22
// 内容钩子 6 · 情绪触发 5 · 结构强化 6 · 互动引导 5
export const STEP7_ELEMENTS_22: readonly Step7Element[] = [
  // 内容钩子 6
  { id: 'question_opener',    label: '提问开头', groupKey: 'hook' },
  { id: 'shocking_fact',      label: '震惊事实', groupKey: 'hook' },
  { id: 'contrast',           label: '反差对比', groupKey: 'hook' },
  { id: 'celebrity_quote',    label: '人物金句', groupKey: 'hook' },
  { id: 'data_impact',        label: '数据冲击', groupKey: 'hook' },
  { id: 'scene_immersion',    label: '场景代入', groupKey: 'hook' },
  // 情绪触发 5
  { id: 'anger_resonance',    label: '愤怒共鸣', groupKey: 'emotion' },
  { id: 'anxiety_trigger',    label: '焦虑唤起', groupKey: 'emotion' },
  { id: 'hope_inspire',       label: '希望激励', groupKey: 'emotion' },
  { id: 'surprise_delight',   label: '意外惊喜', groupKey: 'emotion' },
  { id: 'nostalgia',          label: '怀旧共鸣', groupKey: 'emotion' },
  // 结构强化 6
  { id: 'checklist',          label: '清单结构', groupKey: 'structure' },
  { id: 'story_arc',          label: '故事弧线', groupKey: 'structure' },
  { id: 'problem_solution',   label: '问题-方案', groupKey: 'structure' },
  { id: 'before_after_c',     label: '前后对比', groupKey: 'structure' },
  { id: 'step_breakdown',     label: '步骤分解', groupKey: 'structure' },
  { id: 'case_method',        label: '案例方法', groupKey: 'structure' },
  // 互动引导 5
  { id: 'comment_question',   label: '评论提问', groupKey: 'interaction' },
  { id: 'vote_choice',        label: '选择投票', groupKey: 'interaction' },
  { id: 'share_experience',   label: '经验分享', groupKey: 'interaction' },
  { id: 'invite_opinion',     label: '观点邀请', groupKey: 'interaction' },
  { id: 'call_to_action',     label: '行动召唤', groupKey: 'interaction' },
] as const;

// ─── Form ─────────────────────────────────────────────────────────────────────

// STEP7_TEXTAREA · spec §7.8 line 1699 · placeholder 字面 1:1
export const STEP7_TEXTAREA: Step7Textarea = {
  id: 'topic',
  label: '文案主题',
  required: true,
  placeholder: '输入你的文案主题，如：美容院如何用抖音获客100个精准客户...',
} as const;

// STEP7_SEARCH_PLACEHOLDER · spec line 1679 · 字面 1:1
export const STEP7_SEARCH_PLACEHOLDER = '搜索脚本...';

// ─── TD-76 fix: Form section label constant ───────────────────────────────────
export const STEP7_LABEL_SCRIPT_TYPE = '选择脚本类型';

// ─── Optimize ─────────────────────────────────────────────────────────────────

// STEP7_OPTIMIZE_LABEL + STEP7_OPTIMIZE_PLACEHOLDER · spec §7.8 line 1707 · 字面 1:1
export const STEP7_OPTIMIZE_LABEL = '优化方向';
export const STEP7_OPTIMIZE_PLACEHOLDER =
  '输入优化方向（可选），如：更有吸引力、增加互动感、更口语化...';

// ─── Template Strings ─────────────────────────────────────────────────────────

// spec §7.8 line 1693 · 含全角括号（）· 严禁简化
export const STEP7_ELEMENT_COUNTER_TEMPLATE = '选择爆款元素（已选 {count} 个）';

// spec §7.8 line 1701 · 含全角中文冒号：+ 半角 hyphen -
export const STEP7_SCRIPT_DISPLAY_TEMPLATE = '当前脚本：{name} - {positioning}';

// ─── Buttons ──────────────────────────────────────────────────────────────────

// spec §7.8 line 1710-1712 · 字面 1:1
export const STEP7_BUTTON_GENERATE     = '生成爆款文案';
export const STEP7_BUTTON_OPTIMIZE     = 'AI 优化文案';
export const STEP7_BUTTON_GO_MY_TOPICS = '我的选题库';
export const STEP7_BUTTON_GO_STEP5     = '爆款选题';

// ─── Loading Texts ────────────────────────────────────────────────────────────

export const STEP7_LOADING_TEXT          = 'AI 正在生成爆款文案，预计 30-60 秒...';
export const STEP7_OPTIMIZE_LOADING_TEXT = 'AI 正在优化文案，预计 20-40 秒...';

// ─── Debate H4 Labels (4) ─────────────────────────────────────────────────────

// STEP7_DEBATE_H4_4 · 4 项严格 · spec §7.8 line 1738-1740 字面 1:1
// 严禁加 'H4. ' 前缀 · 严禁翻译为英文
export const STEP7_DEBATE_H4_4: readonly Step7DebateH4[] = [
  { id: 'topic_hook',      h4Label: '话题抛出' },
  { id: 'pros_arguments',  h4Label: '正方' },
  { id: 'cons_arguments',  h4Label: '反方' },
  { id: 'my_stance',       h4Label: '我的立场' },
] as const;

// ─── PRD-29.15 · 真实字面 ──────────────────────────────────
export const STEP7_BREADCRUMB_REAL = 'STEP 07 › AI智能文案生成' as const;
export const STEP7_H1_REAL = '文案生成' as const;
export const STEP7_SUBTITLE_PREFIX = '选择脚本类型和爆款元素，输入主题，AI将基于方法论生成' as const;
export const STEP7_SUBTITLE_HIGHLIGHT = '深度爆款文案' as const;
export const STEP7_SUBTITLE_SUFFIX = '，支持AI智能修改优化。' as const;
export const STEP7_LEFT_TITLE = '选择脚本类型' as const;
export const STEP7_LEFT_SEARCH_PLACEHOLDER = '搜索脚本...' as const;
export const STEP7_RIGHT_TITLE_PREFIX = '选择爆款元素' as const;
export const STEP7_FORM_TOPIC_LABEL = '文案主题' as const;
export const STEP7_CURRENT_SCRIPT_PREFIX = '当前脚本：' as const;
export const STEP7_CTA_GENERATE = '生成爆款文案' as const;
export const STEP7_OUTPUT_H3 = '生成结果' as const;
export const STEP7_OPTIMIZE_H3 = 'AI智能优化' as const;
export const STEP7_OPTIMIZE_PLACEHOLDER_REAL = '输入优化方向（可选），如：更有吸引力、增加互动感、更口语化...' as const;
export const STEP7_OPTIMIZE_BUTTON = 'AI优化文案' as const;
export const STEP7_FOOTER_CHANGE_TOPIC = '想换个选题继续生成文案？' as const;
export const STEP7_FOOTER_MY_TOPICS = '我的选题库' as const;
export const STEP7_FOOTER_HOT_TOPICS = '爆款选题' as const;
