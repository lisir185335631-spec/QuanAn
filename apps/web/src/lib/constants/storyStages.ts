/**
 * storyStages.ts — 起承转合 footer 4 stage 常量
 * SPEC §7
 */

export interface StoryStage {
  key: 'qi' | 'cheng' | 'zhuan' | 'he';
  label: string;
  color: string; // tailwind text color
  desc: string;
}

export const STORY_STAGES: ReadonlyArray<StoryStage> = [
  {
    key: 'qi',
    label: '起：黄金3秒',
    color: 'text-red-400',
    desc: '必须在前3秒抓住观众眼球。可用设置疑问、引发共鸣、制造急迫感、告知好处、盘点清单、开宗明义、冲突前置等技巧。',
  },
  {
    key: 'cheng',
    label: '承：内容发展',
    color: 'text-yellow-400',
    desc: '采用要点式分享，1、2、3层层递进。提供具体可操作的方法或信息，保持节奏感。',
  },
  {
    key: 'zhuan',
    label: '转：高潮转折',
    color: 'text-green-400',
    desc: "制造意想不到的转折，升华主题，给出核心洞察，让观众产生'原来如此'的感觉。",
  },
  {
    key: 'he',
    label: '合：有力结尾',
    color: 'text-orange-400',
    desc: '总结核心观点，给出行动号召（点赞、关注、收藏），留下金句或标志性结尾语。',
  },
];

export const STORY_FOOTER_TITLE = '起承转合 · 文案结构' as const;
