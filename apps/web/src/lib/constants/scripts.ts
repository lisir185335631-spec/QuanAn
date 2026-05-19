/**
 * scripts.ts — Web UI script type constants · PRD-15 US-002 + PRD-22 US-001
 * Re-exports from @quanan/schemas/specialist-io for use in tool pages
 * AC-2: scriptType select(20 选 1 复用 lib/constants/scripts.ts)
 * SCRIPT_TYPES: D1A 字面锁 · spec §Ⅹ.3 · 20 项完整数据(key+emoji+label+desc+methodology)
 */

export { SCRIPT_TYPE_KEYS_20, SCRIPT_TYPE_LABELS } from '@quanan/schemas/specialist-io';

export interface ScriptType {
  key: string;
  emoji: string;
  label: string;
  desc: string;
  methodology: string;
}

export const SCRIPT_TYPES: readonly ScriptType[] = [
  { key: 'opinion', emoji: '聊', label: '聊观点', desc: '表达个人观点，引发共鸣，适合知识分享类账号',
    methodology: '聊观点脚本适合表达个人见解和行业洞察。核心要素：1）选择有争议性或共鸣性的话题；2）用数据或案例支撑观点；3）给出独特的角度和见解；4）引导观众参与讨论。' },
  { key: 'process', emoji: '晒', label: '晒过程', desc: '展示操作过程，平台超大流量体，适合教程类内容',
    methodology: '晒过程脚本是平台超大流量体。核心要素：1）展示完整的操作过程；2）声画分离，画面展示过程，声音讲解要点；3）任务型脚本设定明确目标；4）元素拆解让内容更丰富。' },
  { key: 'knowledge', emoji: '教', label: '教知识', desc: '教学类内容，传递价值，适合专业领域分享',
    methodology: '教知识脚本包含五个子模板：解题型、案例型、推导型、建构型。核心是提供实用价值，让观众有获得感。' },
  { key: 'story', emoji: '讲', label: '讲故事', desc: '故事型脚本，塑造人设，适合个人品牌打造',
    methodology: '讲故事脚本是塑造人设的通关密码。包含：小商业成功故事型、干货英雄型、经历型。故事要有情节起伏和情感共鸣。' },
  { key: 'comedy', emoji: '尬', label: '尬段子', desc: '搞笑类内容，娱乐性强，适合泛娱乐账号',
    methodology: '尬段子脚本以娱乐性为主。核心要素：1）设置出人意料的笑点；2）利用反转和误解制造笑料；3）结合热点话题增加传播性。' },
  { key: 'product', emoji: '说', label: '说产品', desc: '以变现为目标的产品脚本，适合带货和商业推广',
    methodology: '说产品脚本以变现为目标。核心要素：1）不直接推销，而是通过场景带入；2）展示产品解决的痛点；3）用对比突出产品优势。' },
  { key: 'review', emoji: '做', label: '做测评', desc: '产品/服务真实测评，横向对比，适合种草和消费决策',
    methodology: '做测评脚本适合种草和消费决策。核心要素：1）真实体验产品/服务；2）多维度横向对比；3）客观分析优缺点；4）给出明确购买建议。' },
  { key: 'expose', emoji: '揭', label: '揭内幕', desc: '揭露行业内幕/潜规则，满足窥探欲，引发传播',
    methodology: '揭内幕脚本能快速吸引注意力。核心要素：1）揭露行业不为人知的内幕；2）用具体数据和案例支撑；3）给出避坑建议；4）建立专业人设。' },
  { key: 'challenge', emoji: '做', label: '做挑战', desc: '设定挑战目标并记录过程，制造悬念和期待',
    methodology: '做挑战脚本能制造悬念和期待。核心要素：1）设定有难度的目标；2）真实记录过程；3）展示困难和突破；4）结果揭晓制造高潮。' },
  { key: 'interview', emoji: '做', label: '做采访', desc: '街头采访/人物访谈，真实反应引发共鸣',
    methodology: '做采访脚本能获取真实反应。核心要素：1）问题要有争议性或共鸣性；2）被采访者反应要真实；3）剪辑节奏要快；4）结尾要有总结或反转。' },
  { key: 'daily', emoji: '拍', label: '拍日常', desc: '记录真实生活/工作日常，打造真实人设',
    methodology: '拍日常脚本打造真实人设。核心要素：1）展示真实生活/工作状态；2）不过度修饰，保持真实感；3）融入个人价值观；4）让观众产生代入感。' },
  { key: 'transform', emoji: '秀', label: '秀蜕变', desc: '展示前后对比/成长蜕变，激励人心',
    methodology: '秀蜕变脚本激励人心。核心要素：1）展示明显的前后对比；2）分享蜕变过程和方法；3）提炼可复制的经验；4）给观众希望和动力。' },
  { key: 'debate', emoji: '搞', label: '搞辩论', desc: '正反观点对抗，引发讨论和互动',
    methodology: '搞辩论脚本引发讨论。核心要素：1）选择有争议的话题；2）展示正反两方观点；3）引导观众参与讨论；4）用评论区互动提升流量。' },
  { key: 'list', emoji: '列', label: '列清单', desc: '盘点型内容，信息密度高，收藏率高',
    methodology: '列清单脚本信息密度高。核心要素：1）数字要具体，标题要有吸引力；2）每条简洁有力；3）排序有逻辑；4）适合收藏和分享。' },
  { key: 'reaction', emoji: '看', label: '看反应', desc: '记录真实反应/惊喜时刻，情绪感染力强',
    methodology: '看反应脚本情绪感染力强。核心要素：1）反应要真实有趣；2）选择能引发强烈情绪的内容；3）剪辑节奏要快；4）加入个人观点和评论。' },
  { key: 'qna', emoji: '答', label: '答粉丝', desc: '回答粉丝提问，增强互动和粘性',
    methodology: '答粉丝脚本增强互动。核心要素：1）选择粉丝真正关心的问题；2）回答要专业且有价值；3）引导更多粉丝提问；4）建立专家人设。' },
  { key: 'collab', emoji: '搞', label: '搞联动', desc: '与其他博主/品牌联动，互相引流',
    methodology: '搞联动脚本互相引流。核心要素：1）选择受众重叠的博主；2）设计有趣的互动环节；3）双方都有价值输出；4）互相导流引导关注。' },
  { key: 'behind', emoji: '幕', label: '幕后花絮', desc: '展示幕后制作过程，增加真实感和信任',
    methodology: '幕后花絮脚本增加信任。核心要素：1）展示制作过程的真实一面；2）分享幕后故事和心得；3）让观众感受到用心和专业；4）拉近与观众的距离。' },
  { key: 'trend_news', emoji: '追', label: '追热点', desc: '快速跟进热点话题，借势获取流量',
    methodology: '追热点脚本借势获流。核心要素：1）快速反应，抢占先机；2）独特角度解读热点；3）结合自身行业领域；4）提供有价值的视角。' },
  { key: 'motivation', emoji: '打', label: '打鸡血', desc: '励志/激励型内容，传递正能量，引发共鸣',
    methodology: '打鸡血脚本传递正能量。核心要素：1）真实的奋斗故事；2）具体的方法论；3）激励性的金句；4）号召行动。' },
] as const;
