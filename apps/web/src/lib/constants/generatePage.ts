/**
 * generatePage.ts — /generate 页字面常量 · 1:1 复刻 aiipznt.vip/generate
 * 禁止 hardcode 字面到组件 · 全部走本文件
 */

export const GENERATE_H1 = '生成爆款文案' as const;
export const GENERATE_SUBTITLE =
  '选择脚本类型和爆款元素，输入主题，AI为你生成AIP风格的短视频文案' as const;
export const GENERATE_SCRIPT_TITLE = '选择脚本类型' as const;
export const GENERATE_ELEMENTS_TITLE = '爆款元素（可多选）' as const;
export const GENERATE_TOPIC_TITLE = '文案主题' as const;
export const GENERATE_TOPIC_DEFAULT =
  '如何在3天内涨粉1万、新手做短视频最容易犯的3个错误' as const;
export const GENERATE_TOPIC_MAXLEN = 500 as const;
export const GENERATE_CTA = '生成文案' as const;
export const GENERATE_RESULT_TITLE = '生成结果' as const;
export const GENERATE_BTN_COPY = '复制' as const;
export const GENERATE_BTN_AI_OPT = 'AI优化' as const;
export const GENERATE_BTN_RESTART = '重新开始' as const;
export const GENERATE_FEEDBACK_PROMPT = '这个结果对你有帮助吗?' as const;
export const GENERATE_DEFAULT_SCRIPT_KEY = 'opinion' as const;
export const GENERATE_DEFAULT_ELEMENT_KEYS = ['resonance'] as const;

export const GENERATE_RESULT_PARAGRAPHS: ReadonlyArray<{ label: string; body: string }> = [
  {
    label: '【标题】',
    body: '你做短视频涨粉慢，不是内容不好，是你从一开始就错了',
  },
  {
    label: '【炸裂开头】',
    body: '你是不是也这样：做企业服务好几年，也知道短视频是趋势，但一拍视频就头疼，播放量上不去，涨粉更是遥遥无期，感觉自己就像个局外人?',
  },
  {
    label: '【论证一】',
    body: '我看了不下500个企业服务账号，发现一个普遍现象：很多人一上来就想"涨粉1万"，然后拼命追热点、学剪辑。结果呢? 内容东拼西凑，风格变来变去，粉丝涨得慢不说，来的还都是泛粉，根本转化不了。你以为你在努力，其实你在瞎忙。',
  },
  {
    label: '【论证二】',
    body: '还有一种，觉得内容为王，就开始讲行业知识、企业文化，恨不得把公司所有优势都塞进一个视频。但你有没有想过，用户刷到你的视频，他不是来听课的，他更关心的是：你能不能解决我的问题? 你的内容能不能让我省钱、省事、省心? 如果你的视频没第一时间回答这个问题，用户根本不会停留。',
  },
  {
    label: '【论证三】',
    body: '最要命的是，很多人把短视频当成了"宣传册"，把公司介绍、产品功能一股脑地往外倒。这就像你第一次跟客户见面，还没了解对方需求，就直接掏出合同让人签字。你觉得客户会怎么想? 短视频是建立信任的工具，不是销售的终点。你越想卖，客户就越跑。',
  },
  {
    label: '【深层洞察】',
    body: '所以本质上，你做短视频涨粉慢，不是因为你内容不好，也不是因为你不会剪辑，而是你从一开始就没搞清楚短视频的底层逻辑——它不是一个"宣传"工具，而是一个"筛选"工具。它筛选的不是你的产品，而是那些真正需要你、信任你、愿意为你付费的精准客户。',
  },
  {
    label: '【收尾】',
    body: '如果你还在用"宣传"思维做短视频，那你的努力，可能只会让你离目标越来越远。你是不是也觉得，是时候换个思路了?',
  },
  {
    label: '【话题标签】',
    body: '#企业服务短视频 #短视频涨粉 #短视频运营 #精准获客 #商业洞察',
  },
];
