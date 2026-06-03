/**
 * trending.ts — /trending 全网爆款库 常量 · 字面 1:1 sally aiipznt
 * 命名锁: TRENDING_H1 / TRENDING_SUBTITLE / TRENDING_MOCK / TRENDING_PLATFORM_OPTIONS / TRENDING_IND_TABS
 * D1 红线: 所有字面量来源 SPEC.md §2 + §2.7 · 禁止改写
 */

// ── Hero 字面 ──────────────────────────────────────────────────────────────────
export const TRENDING_H1 = '全网爆款库' as const;
export const TRENDING_SUBTITLE = '抓取2025-2026年全平台（抖音、小红书、视频号、快手、B站）最新爆款视频和完整文案' as const;

// ── 大筛选 card 字面 ──────────────────────────────────────────────────────────
export const TRENDING_FILTER_INDUSTRY_LABEL = '选择行业' as const;
export const TRENDING_FILTER_PLATFORM_LABEL = '筛选平台' as const;
export const TRENDING_FILTER_KEYWORDS_LABEL = '自定义关键词（可选）' as const;
export const TRENDING_FILTER_KEYWORDS_PLACEHOLDER = '多个关键词用逗号分隔' as const;
export const TRENDING_FETCH_BTN = '抓取最新爆款' as const;

// ── search + count row ─────────────────────────────────────────────────────────
export const TRENDING_SEARCH_PLACEHOLDER = '搜索爆款内容...' as const;
export const TRENDING_COUNT_TPL = (n: number): string => `共 ${n} 条`;

// ── 行业 dropdown popover 字面 ─────────────────────────────────────────────────
export const TRENDING_IND_SEARCH_PLACEHOLDER = '搜索行业名称或关键词...' as const;
export const TRENDING_IND_TOTAL_TPL = (n: number): string => `共 ${n} 个行业`;

// ── 默认值 ─────────────────────────────────────────────────────────────────────
export const TRENDING_DEFAULT_INDUSTRY_ID = 'self_media' as const;
export const TRENDING_PLATFORM_ALL = '全部平台' as const;
export const TRENDING_FAKE_TOTAL = 67 as const;

// ── 行业 chip tabs(5 大类 · sally 真实 emoji) ─────────────────────────────────
export interface TrendingIndTab {
  id: string;
  label: string;
  emoji: string;
}

export const TRENDING_IND_TABS: ReadonlyArray<TrendingIndTab> = [
  { id: 'all',    label: '全部',     emoji: '' },
  { id: 'life',   label: '生活服务', emoji: '🏠' },
  { id: 'ecom',   label: '电商零售', emoji: '🛒' },
  { id: 'create', label: '内容创作', emoji: '✋' },
  { id: 'pro',    label: '专业服务', emoji: '💼' },
  { id: 'mfg',    label: '产业制造', emoji: '🏭' },
] as const;

// ── 平台 dropdown 选项(sally 真实 emoji · B站和视频号同用 📺) ──────────────────
export interface TrendingPlatformOption {
  key: string;
  label: string;
  emoji: string;
}

export const TRENDING_PLATFORM_OPTIONS: ReadonlyArray<TrendingPlatformOption> = [
  { key: 'douyin',      label: '抖音',   emoji: '📲' },
  { key: 'xiaohongshu', label: '小红书', emoji: '📕' },
  { key: 'shipinhao',   label: '视频号', emoji: '📺' },
  { key: 'kuaishou',    label: '快手',   emoji: '🎬' },
  { key: 'bilibili',    label: 'B站',    emoji: '📺' },
  { key: 'weibo',       label: '微博',   emoji: '🌐' },
] as const;

// ── card 数据结构 ───────────────────────────────────────────────────────────────
export type TrendingType = '口播' | '混剪' | '剧情' | 'vlog';
export type TrendingPlatformKey = 'douyin' | 'xiaohongshu' | 'shipinhao' | 'kuaishou' | 'bilibili' | 'weibo';

export interface TrendingCard {
  id: string;
  platform: TrendingPlatformKey;
  platformLabel: string;
  platformEmoji: string;
  type: TrendingType;
  title: string;
  body: string;
  tags: ReadonlyArray<string>;
  likes: string;
  comments: string;
  shares: string;
}

// ── 9 sample card · 完整字面 1:1 sally(body 400-800 字 · 一字不漏) ─────────────
export const TRENDING_MOCK: ReadonlyArray<TrendingCard> = [
  {
    id: 't1',
    platform: 'bilibili',
    platformLabel: 'B站',
    platformEmoji: '📺',
    type: '口播',
    title: 'B站2026年内容趋势：深度+互动，这3类UP主会爆火！',
    body: '你是不是想在B站做出爆款？2026年B站内容趋势很明显，这3类UP主会爆火。第一类，AI深度解析UP主。你不再是简单科普AI工具，而是深入分析AI对某个行业的影响，甚至用AI生成内容，再解读AI的创作逻辑。比如，用AI写一篇科幻小说，然后分析AI的叙事结构和用词偏好。这种深度解读，是B站用户最爱。第二类，跨界联动UP主。你把两个看似不相关的领域结合起来，创造新内容。比如，把历史人物和现代职场困境结合，做成系列短剧。或者把古典音乐和二次元动画融合，做成MV。这种跨界创新，能吸引不同圈层的用户。第三类，互动式体验UP主。你不再是单向输出，而是让观众参与到你的内容创作中。比如，你做游戏解说，让观众投票决定下一期玩什么游戏。或者你做生活Vlog，让观众决定你一天的行程。这种参与感，能大大提升用户粘性。B站用户喜欢深度和互动。你准备好做下一个爆款UP主了吗？评论区告诉我，你最想尝试哪种类型。',
    tags: ['B站爆款', 'AI深度解析', '跨界联动', '互动式内容', 'UP主成长'],
    likes: '18.1万',
    comments: '7200',
    shares: '2.5万',
  },
  {
    id: 't2',
    platform: 'bilibili',
    platformLabel: 'B站',
    platformEmoji: '📺',
    type: '混剪',
    title: 'B站UP主2026年如何破圈？我用AI做了个实验！',
    body: '你是不是觉得B站涨粉越来越难，想破圈却不知道怎么做？2026年，我用AI做了一个实验，告诉你如何破圈。我用AI分析了B站近一年的爆款视频，发现一个共同点：跨领域知识融合。于是，我让AI生成了100个"历史+科技"的选题，并从中挑选了一个"如果秦始皇穿越到2026年，他会怎么用AI治国？"。然后，我用AI生成了脚本、配音、甚至部分动画素材。这个视频发布后，数据直接爆了！平时我的视频播放量只有几万，这个视频直接突破了百万。为什么会爆？因为AI帮我找到了用户感兴趣的"知识盲区"，并且用新颖的方式呈现。它把两个不相关的领域巧妙结合，产生了化学反应。AI是你的内容助理，帮你拓宽思路，提高效率。但核心的创意和深度，还是需要你来把控。你准备好用AI做你的下一个爆款了吗？评论区告诉我你的破圈计划。',
    tags: ['B站破圈', 'AI内容创作', '跨领域融合', '实验揭秘', '知识区'],
    likes: '21.5万',
    comments: '9500',
    shares: '3.1万',
  },
  {
    id: 't3',
    platform: 'kuaishou',
    platformLabel: '快手',
    platformEmoji: '🎬',
    type: '剧情',
    title: '快手2026年短剧变现新模式：我用"直播互动"赚翻了！',
    body: '你是不是还在为快手短剧变现发愁？2026年，我用"直播互动"模式，让短剧赚翻了。第一个模式，短剧直播间"剧情投票"。你短剧拍到关键节点，暂停，让用户在直播间投票决定剧情走向。比如，主角选择A还是B，用户投票决定。这种参与感，能大大提高用户停留和付费意愿。第二个模式，短剧直播间"道具打赏"。你短剧里的道具，比如主角穿的衣服、用的手机，都可以在直播间直接购买。用户打赏的虚拟礼物，也可以对应解锁短剧彩蛋。这让短剧和电商无缝衔接。第三个模式，短剧直播间"演员连麦"。你短剧播放结束后，让演员们进入直播间，和观众实时连麦互动，回答问题。这种近距离接触，能大大增强粉丝粘性。快手短剧变现，不再只是广告。直播互动，是新的金矿。你准备好用直播互动玩转短剧了吗？评论区告诉我你的短剧类型。',
    tags: ['快手短剧', '直播互动', '剧情投票', '道具打赏', '演员连麦'],
    likes: '7.2万',
    comments: '3500',
    shares: '8800',
  },
  {
    id: 't4',
    platform: 'kuaishou',
    platformLabel: '快手',
    platformEmoji: '🎬',
    type: '口播',
    title: '快手2026年新玩法：老铁经济升级，你必须知道的3个点！',
    body: '你是不是觉得快手流量越来越难做了？2026年，快手"老铁经济"升级了，你得掌握这3个新玩法。第一个，内容地域化+生活化。你拍视频，多结合你所在城市的人文特色、风土人情。比如，你是山东人，就多拍山东大集、山东美食，用山东方言讲解。让你的内容有地域标签，更容易被本地老铁看到。第二个，直播间"陪伴式"互动。你直播，不只是卖货，更像跟老铁唠家常。比如，你卖农产品，可以边干农活边直播，分享你的日常。老铁们看的是你的真实生活，而不是冷冰冰的销售。第三个，短视频+直播间"双向奔赴"。你短视频预告直播内容，直播间再回放短视频精彩片段。比如，你短视频拍了一个制作美食的过程，直播间就教大家怎么做这道菜，并卖相关食材。让短视频和直播形成闭环。这3个新玩法，能让你的老铁更铁，流量更稳。快手玩的就是真实和感情。你准备好和老铁们"双向奔赴"了吗？评论区聊聊。',
    tags: ['快手运营', '老铁经济', '地域化内容', '陪伴式直播', '短视频直播联动'],
    likes: '7.8万',
    comments: '3800',
    shares: '9500',
  },
  {
    id: 't5',
    platform: 'shipinhao',
    platformLabel: '视频号',
    platformEmoji: '📺',
    type: '口播',
    title: '视频号2026年知识付费：我用"AI导师"模式，月入10万！',
    body: '你是不是也想在视频号做知识付费？2026年，我用"AI导师"模式，月入10万。怎么做到的？第一个，AI辅助课程设计。你用AI分析市场需求，帮你设计课程大纲、内容结构。比如，AI告诉我"短视频剪辑"课程，用户最关心"手机剪辑技巧"和"变现方法"。我就重点设计这些内容。第二个，AI导师1对N答疑。你录制好核心课程，然后用AI机器人作为"导师"，回答学员的常见问题。对于复杂问题，再由真人导师介入。这样能大大提高服务效率，降低人工成本。第三个，社群化学习+AI伴学。你建立付费社群，让学员互相交流。同时，用AI机器人每天提醒学员学习、打卡，提供个性化学习报告。让学员感觉有专属导师陪伴。视频号知识付费，AI是你的最佳搭档。它能帮你扩大服务范围，提高收益。你准备好用AI导师模式了吗？评论区告诉我你的知识领域。',
    tags: ['视频号知识付费', 'AI导师', '课程设计', '社群学习', '月入10万'],
    likes: '9.5万',
    comments: '4800',
    shares: '1.1万',
  },
  {
    id: 't6',
    platform: 'kuaishou',
    platformLabel: '快手',
    platformEmoji: '🎬',
    type: '口播',
    title: '快手MCN机构2026年新趋势：抱团取暖，这3点是关键！',
    body: '你是不是觉得MCN机构越来越难做了？2026年，快手MCN机构要"抱团取暖"，这3点是关键。第一个，垂直领域深度耕耘。你别再广撒网了，只在一个细分领域做深做透。比如，只孵化"乡村生活"类主播，或者只做"非遗文化"传播。越垂直，你的机构越有竞争力。第二个，打造"家族式"主播矩阵。你别只靠一两个头部主播，要建立一个有共同价值观、互相扶持的家族式主播矩阵。比如，一个家族的主播可以互相连麦、互相导流，形成合力。用户喜欢看这种有温度的家族。第三个，AI赋能内容生产和数据分析。你用AI工具批量生成短视频脚本、剪辑素材。用AI分析主播数据、用户画像，帮你优化运营策略。AI帮你提效，你把精力放在主播培养和内容创意上。这3点，能让你的MCN机构在快手站稳脚跟。别再单打独斗了。你觉得MCN机构未来会走向何方？评论区聊聊。',
    tags: ['快手MCN', '垂直领域', '家族式矩阵', 'AI赋能', '机构运营'],
    likes: '6.5万',
    comments: '2900',
    shares: '7500',
  },
  {
    id: 't7',
    platform: 'kuaishou',
    platformLabel: '快手',
    platformEmoji: '🎬',
    type: 'vlog',
    title: '快手直播带货2026：农村电商新机遇，这3点你得抓住！',
    body: '你是不是觉得农村电商没啥搞头？2026年，快手直播带货给农村电商带来了新机遇，这3点你得抓住。第一个，原产地直播，溯源农产品。你别只卖货，要带老铁们去田间地头，看农产品怎么种出来的。比如，你卖苹果，就拍果农在果园里采摘、分拣的过程。让老铁们看到真实的原产地，建立信任。第二个，打造"乡土人设"，讲好家乡故事。你别只介绍产品，要讲你和家乡的故事。比如，你是一个"返乡创业大学生"，分享你建设家乡的经历。老铁们买的是你的情怀，是你的家乡。第三个，直播间"助农公益"标签。你把一部分销售额捐给当地贫困户，或者帮助滞销农产品。快手用户有很强的公益心。给你的直播间打上"助农公益"标签，能大大提升老铁们的购买意愿。快手农村电商，玩的就是真实和情怀。你准备好为家乡带货了吗？评论区告诉我你的家乡特产。',
    tags: ['快手直播', '农村电商', '原产地直播', '乡土人设', '助农公益'],
    likes: '8.9万',
    comments: '4300',
    shares: '1.0万',
  },
  {
    id: 't8',
    platform: 'shipinhao',
    platformLabel: '视频号',
    platformEmoji: '📺',
    type: '剧情',
    title: '视频号2026年短剧：我用1000块拍出百万播放量！',
    body: '你是不是觉得拍短剧很烧钱？2026年视频号短剧，我用1000块拍出百万播放量。怎么做到的？第一个，小成本，大创意。你别追求大制作，把钱花在创意上。比如，我拍一个都市情感短剧，场景只选在咖啡馆和办公室，但剧情反转不断，引人入胜。创意是短剧的灵魂。第二个，AI辅助剧本创作+剪辑。我用AI生成剧本大纲，再手动修改润色。用AI工具进行初剪，节省大量时间。AI是我的免费助理，帮我把成本降到最低。第三个，系列化+悬念感。你别只拍一集，要拍成系列剧。每集结尾都留下悬念，引导用户追更。比如，我的短剧《消失的她》，每集都留下一个线索，用户看完就想看下一集。视频号短剧，小成本也能出爆款。你不需要专业设备，只需要好故事和巧方法。你准备好拍你的第一部短剧了吗？评论区告诉我你的短剧题材。',
    tags: ['视频号短剧', '小成本制作', 'AI剧本', '系列剧', '百万播放'],
    likes: '10.1万',
    comments: '5200',
    shares: '1.2万',
  },
  {
    id: 't9',
    platform: 'xiaohongshu',
    platformLabel: '小红书',
    platformEmoji: '📕',
    type: '口播',
    title: '2026年小红书内容创作：普通人如何打造"情绪价值"爆款？',
    body: '你是不是觉得小红书爆款很难复制？2026年小红书内容创作，普通人也能打造"情绪价值"爆款。第一个方法，分享你的"高光时刻"与"至暗时刻"。你别只展示完美生活，也要分享你的脆弱和成长。比如，你分享"我创业失败后的30天"，再分享"我如何走出低谷"。这种真实的情绪起伏，更容易引发共鸣。第二个方法，用"故事化"表达传递情绪。你别只堆砌形容词，用一个具体的故事来承载你的情绪。比如，你推荐一款香水，别只说"好闻"，说"这款香水让我想起第一次约会的心动"。故事能让情绪具象化。第三个方法，利用AI分析用户情绪偏好。你用AI工具分析你的粉丝评论、点赞内容，了解他们喜欢什么情绪类型的内容。比如，AI告诉我我的粉丝更喜欢"治愈系"和"励志系"内容，我就多创作这类。小红书爆款，核心是情绪价值。你不需要多专业，只需要更真实、更有温度。你准备好打造你的情绪爆款了吗？评论区告诉我你最想分享的情绪。',
    tags: ['小红书爆款', '情绪价值', '故事化表达', '真实分享', 'AI情绪分析'],
    likes: '14.9万',
    comments: '7500',
    shares: '1.9万',
  },
] as const;
