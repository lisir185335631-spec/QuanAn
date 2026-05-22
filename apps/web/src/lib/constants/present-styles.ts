/**
 * 14 呈现形式 constants — spec §27.5 字面 1:1 (PRD-27 US-003 AC-4)
 * key 严守 lowercase + underscore · 0 字面漂移
 */

export interface Style {
  id: string;
  label: string;
  description: string;
  tips: string;
}

export const PRESENT_STYLES: readonly Style[] = [
  {
    id: 'talking_head',
    label: '口播',
    description: '真人出镜直接讲述，适合知识分享和观点输出',
    tips: '注意表情管理和语速控制，前 3 秒表情要夸张',
  },
  {
    id: 'drama',
    label: '剧情',
    description: '短剧/情景剧形式，适合讲故事和产品植入',
    tips: '冲突前置，反转要出人意料',
  },
  {
    id: 'tutorial',
    label: '教程',
    description: '步骤式教学，适合技能分享和产品使用',
    tips: '声画分离效果更好，步骤要清晰',
  },
  {
    id: 'vlog',
    label: 'Vlog',
    description: '日常记录/体验分享，适合人设打造',
    tips: '真实感最重要，不要过度修饰',
  },
  {
    id: 'street_interview',
    label: '街访',
    description: '街头采访形式，适合话题讨论和互动',
    tips: '问题要有争议性，被采访者反应要真实',
  },
  {
    id: 'comparison',
    label: '对比测评',
    description: '产品/方法对比，适合种草和测评',
    tips: '对比维度要清晰，结论要明确',
  },
  {
    id: 'list_style',
    label: '清单盘点',
    description: '盘点型内容，信息密度高',
    tips: '数字要具体，排序有逻辑',
  },
  {
    id: 'mashup',
    label: '混剪',
    description: '素材混剪+配音，适合情感和知识类',
    tips: '画面节奏要配合文案节奏',
  },
  {
    id: 'screen_record',
    label: '录屏',
    description: '屏幕录制+讲解，适合软件教程和数据展示',
    tips: '操作要流畅，重点部分要放大',
  },
  {
    id: 'animation',
    label: '动画',
    description: '动画/图文动效形式，适合科普和数据可视化',
    tips: '动效不要过于花哨，信息传达为主',
  },
  {
    id: 'reaction',
    label: '反应',
    description: '看视频/看评论的反应，适合二创和互动',
    tips: '反应要真实有趣，评论要有代表性',
  },
  {
    id: 'before_after',
    label: '前后对比',
    description: '变化前后对比，适合美妆/装修/健身等',
    tips: '对比要在同一条件下，差异要明显',
  },
  {
    id: 'pov',
    label: 'POV视角',
    description: '第一人称视角，沉浸式体验',
    tips: '代入感要强，场景要真实',
  },
  {
    id: 'qa',
    label: '问答',
    description: '一问一答形式，适合知识科普',
    tips: '问题要是用户真正关心的',
  },
] as const;

export const PRESENT_STYLES_MAP: Record<string, Style> = Object.fromEntries(
  PRESENT_STYLES.map((s) => [s.id, s]),
);
