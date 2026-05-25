/**
 * ai-video.ts — /ai-video STORYBOARD 工具常量 · 1:1 sally zhao 复刻
 * mock-first 模式 · 0 backend
 * 2026-05-25
 */

// ── chip card ─────────────────────────────────────────────────────────────────
export const AI_VIDEO_CHIP_TITLE = 'STORYBOARD' as const;
export const AI_VIDEO_CHIP_SUBTITLE = '专业分镜表生成器 · 文案一键转拍摄方案' as const;

// ── form labels ────────────────────────────────────────────────────────────────
export const AI_VIDEO_LABEL_TEXT = '输入文案内容' as const;
export const AI_VIDEO_LABEL_PLATFORM = '发布平台' as const;
export const AI_VIDEO_LABEL_TYPE = '视频类型' as const;
export const AI_VIDEO_CTA_TEXT = '一键生成专业分镜表' as const;
export const AI_VIDEO_RESTART_TEXT = '清空记录，重新开始' as const;
export const AI_VIDEO_COPY_ALL_TEXT = '复制全部' as const;
export const AI_VIDEO_EXPORT_CSV_TEXT = '导出CSV' as const;

// ── 5 platform ────────────────────────────────────────────────────────────────
export interface PlatformOption {
  key: string;
  label: string;
  emoji: string;
}

export const AI_VIDEO_PLATFORMS: ReadonlyArray<PlatformOption> = [
  { key: 'douyin',       label: '抖音',   emoji: '📱' },
  { key: 'kuaishou',     label: '快手',   emoji: '🎬' },
  { key: 'xiaohongshu',  label: '小红书', emoji: '📕' },
  { key: 'bilibili',     label: 'B站',    emoji: '📺' },
  { key: 'wechat_video', label: '视频号', emoji: '📲' },
] as const;

// ── default demo script (sally 演示文案 · ~797 字) ────────────────────────────
export const AI_VIDEO_DEFAULT_DEMO_SCRIPT: string = `【标题】为什么美业老板，有人赚钱那么轻松，有人却苦苦挣扎？

【话题抛出】你有没有发现，同样是美业老板，有人每天忙得焦头烂额，赚的却是辛苦钱；有人却能轻轻松松，钱自己就来了？这背后到底藏着什么秘密？

【正方】（轻松赚钱派：AI赋能，效率为王）
我见过一个美容院老板，店里只有三个人，但去年线上成交额却做到了370万。她是怎么做到的？就是把所有重复性、耗时的工作，比如预约排班、客户维护、营销话术，全部交给AI智能体。员工从繁琐的事务中解放出来，能把更多精力放在服务客户和提升专业技能上。这不就是把时间卖出更高的价钱吗？她算了一笔账，一个智能体每年帮她省下至少20万的人力成本，而且效率是人工的十倍。

【反方】（传统派：服务为本，温度至上）
但也有人说，美业是服务行业，最重要的是人情味和体验感。冰冷的AI怎么能替代美容师的巧手和贴心？一个老牌美容院老板就告诉我，她的客户都是跟着她十几年甚至二十几年的，靠的就是她和员工的专业、细致和情感连接。她觉得，如果把这些都交给AI，那美业就失去了灵魂，变成了流水线。客户来这里不仅是变美，更是寻求一份放松和信任，这是AI给不了的。

【我的立场】
其实，这两种观点都有道理，但我觉得，轻松赚钱和人情味并不冲突。那些赚钱轻松的美业老板，不是抛弃了服务，而是找到了一个支点，用AI把那些可以标准化的流程优化到极致，把省下来的时间和精力，投入到真正需要"人"的服务上。比如，AI帮你筛选出高意向客户，你再用你的专业和温度去转化和维护。这不就是把"低成本高回报"和"以小搏大"玩明白了？关键在于，你有没有看到这个趋势，有没有勇气去尝试。

【评论区引导】
你觉得美业未来是AI主导，还是人情味更重要？或者说，两者该怎么结合？评论区聊聊你的看法。

【话题标签】#美业 #AI赋能 #智能体 #赚钱思维 #效率提升 #创业者 #商业模式 #美业老板 #行业洞察` as const;

// ── empty placeholder ─────────────────────────────────────────────────────────
export const AI_VIDEO_EMPTY_H3 = '专业分镜表生成器' as const;
export const AI_VIDEO_EMPTY_DESC = '输入你的短视频文案，AI将自动生成专业的分镜表，包含场景、景别、角度、运镜、情绪、台词、动作指导等完整拍摄参数，可直接交给摄影师执行。' as const;
export const AI_VIDEO_EMPTY_BULLETS: ReadonlyArray<string> = [
  '输入文案 → AI生成6-12个专业分镜',
  '每个分镜包含：景别、角度、运镜、情绪、台词',
  '支持5大平台 × 6种视频类型',
  '一键导出CSV分镜表，直接交给团队执行',
] as const;

// ── result · title card ───────────────────────────────────────────────────────
export const AI_VIDEO_RESULT_TITLE = '美业老板的秘密：AI赋能还是人情味？' as const;
export const AI_VIDEO_RESULT_TOTAL_DURATION = '110秒' as const;
export const AI_VIDEO_RESULT_SHOT_COUNT = '10个分镜' as const;

// ── result · timeline 10 段 ───────────────────────────────────────────────────
export const AI_VIDEO_TIMELINE_SEGMENTS: ReadonlyArray<string> = [
  '3s', '5s', '15s', '12s', '15s', '10s', '15s', '15s', '5s', '10s',
] as const;

// ── result · 3 段建议 ─────────────────────────────────────────────────────────
export interface AdviceCardData {
  id: string;
  label: string;
  content: string;
}

export const AI_VIDEO_ADVICE: ReadonlyArray<AdviceCardData> = [
  {
    id: 'shooting',
    label: '拍摄建议：',
    content: '灯光：主光清晰，辅光柔和，营造专业且有质感的画面。收音：务必使用专业麦克风，保证口播清晰无杂音。服装妆造：主播形象专业、时尚，符合美业老板的定位。背景：简洁不杂乱，能体现科技感或专业感。眼神：主播要多与镜头互动，眼神真诚有力。',
  },
  {
    id: 'editing',
    label: '剪辑要点：',
    content: '整体节奏要快，尤其前3-5秒。画面文字叠加要简洁有力，突出关键信息和数据。转场以硬切为主，保持视频紧凑感。调色风格偏明亮、现代，突出专业感。适当加入AI界面或数据图表的动态特效，增强科技感。音效要配合台词和情绪变化。',
  },
  {
    id: 'music',
    label: '音乐建议：',
    content: '整体音乐风格为现代电子乐，节奏明快，富有科技感和思考性。在讲述AI优势时节奏加快，讲述人情味时节奏放缓并转为舒缓，最后回到积极有力的旋律，结尾处轻松收尾。',
  },
] as const;

// ── result · 10 SHOT mock data ────────────────────────────────────────────────
export type ShotFraming = '中景' | '近景' | '特写';

export interface ShotMockData {
  num: string;
  duration: string;
  framing: ShotFraming;
  angle: string;
  movement: string;
  emotion: string;
  transition: string;
  scene: string;
  dialogue: string;
  action: string;
  subtitle: string;
  music: string;
  tip: string;
}

export const AI_VIDEO_MOCK_SHOTS: ReadonlyArray<ShotMockData> = [
  // SHOT 01 · 3秒 · 中景
  {
    num: '01',
    duration: '3秒',
    framing: '中景',
    angle: '平拍',
    movement: '固定，开场时画面略微向后拉，营造一点空间感。',
    emotion: '眼神坚定，略带疑惑和引人深思的表情。',
    transition: '硬切',
    scene: '主播（女性，妆容精致，职业装或时尚休闲装）站在一个现代感十足的办公室或工作室，背景有模糊的科技元素（如LED屏的抽象光影）。',
    dialogue: '你有没有发现，同样是美业老板，有人每天忙得焦头烂额，赚的却是辛苦钱；',
    action: '开场时双手抱胸，眉头微蹙，接着摊开手，表示疑问。',
    subtitle: '为什么美业老板，有人轻松赚钱，有人苦苦挣扎？',
    music: '开场悬疑/思考型音效，如轻微的电子音效或疑问符音效。',
    tip: '前3秒必须抓住眼球，主播表情和文字叠加是关键。背景要简洁，突出人物。',
  },
  // SHOT 02 · 5秒 · 近景
  {
    num: '02',
    duration: '5秒',
    framing: '近景',
    angle: '平拍',
    movement: '固定',
    emotion: '语气带有强调和好奇。',
    transition: '硬切',
    scene: '同上，背景不变。',
    dialogue: '有人却能轻轻松松，钱自己就来了？这背后到底藏着什么秘密？',
    action: '身体略微前倾，右手食指轻点太阳穴，表示思考，然后看向镜头，眼神充满探究。',
    subtitle: '秘密是什么？',
    music: '节奏感渐强，带有探究意味的背景音乐。',
    tip: '强调"秘密"二字，眼神要到位。',
  },
  // SHOT 03 · 15秒 · 中景
  {
    num: '03',
    duration: '15秒',
    framing: '中景',
    angle: '平拍',
    movement: '固定',
    emotion: '讲述时自信、条理清晰，带有赞叹。',
    transition: '硬切',
    scene: '主播坐在一个简约的办公桌前，桌上摆放一台笔记本电脑，屏幕上可模糊显示一些数据图表或AI界面。背景可有绿植或现代装饰画。',
    dialogue: '我见过一个美容院老板，店里只有三个人，但去年线上成交额却做到了370万。她是怎么做到的？就是把所有重复性、耗时的工作，比如预约排班、客户维护、营销话术，全部交给AI智能体。',
    action: '讲述时用手势辅助，说到"370万"时，右手伸出三根手指，表示数字。说到"AI智能体"时，指向电脑屏幕。',
    subtitle: 'AI赋能：3人团队年销370万！重复性工作交给AI',
    music: '轻快、现代感的电子音乐，带有科技感。',
    tip: '强调AI带来的效率提升，文字叠加要突出关键数据和AI功能。',
  },
  // SHOT 04 · 12秒 · 近景
  {
    num: '04',
    duration: '12秒',
    framing: '近景',
    angle: '平拍',
    movement: '固定',
    emotion: '语气肯定，带有分析和总结。',
    transition: '硬切',
    scene: '同上，背景不变。',
    dialogue: '员工从繁琐的事务中解放出来，能把更多精力放在服务客户和提升专业技能上。这不就是把时间卖出更高的价钱吗？她算了一笔账，一个智能体每年帮她省下至少20万的人力成本，而且效率是人工的十倍。',
    action: '说到"解放出来"时，双手做舒展动作。说到"更高价钱"时，右手向上抬起。说到"20万"和"十倍"时，眼神坚定，用手势强调数字。',
    subtitle: '解放员工精力，专注服务！AI省20万/年，效率提升10倍！',
    music: '音乐节奏略微加快，突出效率和价值。',
    tip: '口播节奏要快，数字和对比要清晰有力。',
  },
  // SHOT 05 · 15秒 · 中景
  {
    num: '05',
    duration: '15秒',
    framing: '中景',
    angle: '平拍',
    movement: '固定',
    emotion: '语气略带转折，强调人情味和体验感。',
    transition: '硬切',
    scene: '主播换一个稍微柔和的场景，比如有暖色调灯光、舒适沙发或绿植的角落，营造温馨感。可手持一杯咖啡或茶。',
    dialogue: '但也有人说，美业是服务行业，最重要的是人情味和体验感。冰冷的AI怎么能替代美容师的巧手和贴心？一个老牌美容院老板就告诉我，她的客户都是跟着她十几年甚至二十几年的，靠的就是她和员工的专业、细致和情感连接。',
    action: '说到"人情味"时，左手轻抚胸口。说到"冰冷的AI"时，略微摇头。说到"十几年"时，伸出双手比划。',
    subtitle: '人情味至上：AI能替代温度吗？老客户靠的是"情感连接"',
    music: '音乐转为舒缓、温暖的旋律，突出"人情味"主题。',
    tip: '场景和音乐的转变要明显，对比AI的冰冷与人情味的温暖。',
  },
  // SHOT 06 · 10秒 · 近景
  {
    num: '06',
    duration: '10秒',
    framing: '近景',
    angle: '平拍',
    movement: '固定',
    emotion: '语气真诚，略带思考。',
    transition: '硬切',
    scene: '同上，背景不变。',
    dialogue: '她觉得，如果把这些都交给AI，那美业就失去了灵魂，变成了流水线。客户来这里不仅是变美，更是寻求一份放松和信任，这是AI给不了的。',
    action: '说到"失去灵魂"时，双手做摊开状，表示无奈。说到"放松和信任"时，眼神温柔，略微点头。',
    subtitle: '美业若无"灵魂"，何谈信任？',
    music: '音乐保持舒缓，但略带一丝忧虑。',
    tip: '强调传统派的担忧，情感表达要真实。',
  },
  // SHOT 07 · 15秒 · 中景
  {
    num: '07',
    duration: '15秒',
    framing: '中景',
    angle: '平拍',
    movement: '固定，可略微向前推，增加亲近感。',
    emotion: '语气坚定，充满洞察力，展现自己的观点。',
    transition: '硬切',
    scene: '回到最初的现代感办公室场景，主播站立。',
    dialogue: '其实，这两种观点都有道理，但我觉得，轻松赚钱和人情味并不冲突。那些赚钱轻松的美业老板，不是抛弃了服务，而是找到了一个支点，用AI把那些可以标准化的流程优化到极致，',
    action: '开场时双手交叉，表示权衡。说到"不冲突"时，右手食指向上指，表示找到关键点。说到"优化到极致"时，手势向下按，表示落实。',
    subtitle: '我的观点：赚钱与人情味不冲突！AI优化标准化流程',
    music: '音乐转为积极、有力的旋律，带有解决问题的信心。',
    tip: '场景切换回主场景，表明主播要给出自己的核心观点。语速适中，强调逻辑。',
  },
  // SHOT 08 · 15秒 · 近景
  {
    num: '08',
    duration: '15秒',
    framing: '近景',
    angle: '平拍',
    movement: '固定',
    emotion: '自信，启发，带有鼓励。',
    transition: '硬切',
    scene: '同上，背景不变。',
    dialogue: '把省下来的时间和精力，投入到真正需要"人"的服务上。比如，AI帮你筛选出高意向客户，你再用你的专业和温度去转化和维护。这不就是把"低成本高回报"和"以小搏大"玩明白了？',
    action: '说到"投入到人"时，双手做包容状。说到"筛选客户"时，右手做筛选动作。说到"玩明白了"时，自信地摊开双手，略微耸肩。',
    subtitle: 'AI筛选客户，你用专业和温度转化！低成本高回报，以小搏大！',
    music: '音乐更加激昂，充满成功的预示。',
    tip: '核心观点阐述，文字叠加要突出"低成本高回报"和"以小搏大"。',
  },
  // SHOT 09 · 5秒 · 特写
  {
    num: '09',
    duration: '5秒',
    framing: '特写',
    angle: '平拍',
    movement: '固定',
    emotion: '眼神锐利，充满挑战和鼓励。',
    transition: '硬切',
    scene: '同上，背景不变。',
    dialogue: '关键在于，你有没有看到这个趋势，有没有勇气去尝试。',
    action: '身体略微前倾，眼神直视镜头，右手食指指向镜头，强调"你"。',
    subtitle: '你敢不敢尝试？',
    music: '音乐突然变得有力，带有冲击感，结尾处可加入一个"叮"的音效。',
    tip: '特写镜头增加冲击力，直接向观众提问，激发思考和行动。',
  },
  // SHOT 10 · 10秒 · 中景
  {
    num: '10',
    duration: '10秒',
    framing: '中景',
    angle: '平拍',
    movement: '固定',
    emotion: '亲切，期待互动。',
    transition: '淡出',
    scene: '同上，背景不变。',
    dialogue: '你觉得美业未来是AI主导，还是人情味更重要？或者说，两者该怎么结合？评论区聊聊你的看法。',
    action: '双手做邀请状，眼神看向下方，示意评论区。',
    subtitle: '评论区聊聊：AI vs 人情味，怎么结合？ #美业 #AI赋能 #智能体 #赚钱思维 #效率提升 #创业者 #商业模式 #美业老板 #行业洞察',
    music: '音乐逐渐减弱，轻松愉快的收尾。',
    tip: '引导评论，确保话题标签清晰展示。',
  },
] as const;

// ── SHOT card label prefix ────────────────────────────────────────────────────
export const SHOT_LABEL_ANGLE = '角度' as const;
export const SHOT_LABEL_MOVEMENT = '运镜' as const;
export const SHOT_LABEL_EMOTION = '情绪' as const;
export const SHOT_LABEL_TRANSITION = '转场' as const;
export const SHOT_LABEL_SCENE = '场景' as const;
export const SHOT_LABEL_DIALOGUE = '台词/旁白' as const;
export const SHOT_LABEL_ACTION = '动作指导' as const;
