# SPEC · /knowledge 1:1 复刻

> **目标** · `apps/web/src/pages/tools/Knowledge.tsx` 全文 rewrite · AIP文案方法论 4 tab 完整页(20 脚本 + 23 爆款 + 23 开头公式 + 23 核心公式 + 起承转合 footer)
> **截图** · 21 张(4 tab + 末尾 footer · 全展开)
> **范围** · 复用 Tab 1+2 现有 constants · 新增 Tab 2 desc/techniques + Tab 3+4 完整 23 entry + 起承转合
> **风险** · M+(最大字段密页 · 但分散小字段 · 非单一长文)

---

## §1 · 现状(PRD-22 US-005) vs sally 偏离

| # | 偏离 | 现状 | sally 真实 |
|:-:|---|---|---|
| 1 | h1 字面 | `AIP 文案方法论`(空格) | `AIP文案方法论`(无空格) |
| 2 | tab 字面 | `20 类脚本`(空格) | `20类脚本`(无空格)等 |
| 3 | Tab 1 视觉 | 2-4 col 小卡 + caseCount mod | sally 3 col 大卡 · 含 chip icon + methodology paragraph + 折叠案例 |
| 4 | Tab 2 视觉 | inline picker disabled | sally 3 col 大卡 · 4 filter chip + emoji + desc + 使用技巧 3 bullet + category chip |
| 5 | Tab 3 内容 | stub placeholder | sally 23 公式 card(序号 + name + 公式 + 示例) |
| 6 | Tab 4 内容 | stub placeholder | sally 23 公式 card(name + 流程 chips 箭头连 + 实战案例 quote + 用这个公式生成文案 btn) |
| 7 | footer | 无 | 起承转合 4 段彩色 stage |

### 1.1 复用现有 constants

- `lib/constants/scripts.ts` · `SCRIPT_TYPES` 20 项 · 已含 `methodology` 字段(对应 sally Tab 1 "核心要素" paragraph)· **完全复用**
- `lib/constants/elements.ts` · `HOT_ELEMENT_GROUPS` 4 组 23 元素 · 已含 key/emoji/label · 需**扩**(加 `desc` + `techniques[3]`)

---

## §2 · 视觉规范

### 2.1 Icon 映射(lucide-react)

| 用途 | lucide icon |
|---|---|
| Tab 1 icon | `MessageCircle`(20类脚本) |
| Tab 2 icon | `Zap`(20大爆款) |
| Tab 3 icon | `BookOpen`(开头公式) |
| Tab 4 icon | `Lightbulb`(核心公式) |
| card 收藏 btn | `StarOff` 灰 |
| card 复制 btn | `FileText` 金 |
| 折叠 chevron | `ChevronDown` |
| 案例 icon prefix | `TrendingUp` 金 |
| 用这个公式生成文案 btn icon | `Sparkles` |
| 流程箭头 | `ArrowRight` 金 |

### 2.2 layout

- main · `max-w-7xl mx-auto py-8 space-y-8`
- header · `flex flex-col gap-2`(h1 大字 + subtitle 灰)
- 4 tab · `Tabs` `TabsList` 4 chip 横排(深 bg + 选中金底)
- Tab 1/3/4 顶 · search input(左 max-w-md)+ "共 N · 显示 N" 右灰
- Tab 2 顶 · 4 filter chip(全部/经典元素/情绪驱动/内容策略/转化驱动)+ "共 23 大 · 显示 23 个" 右
- card grid · `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- card · `rounded-xl border border-border bg-card p-5 space-y-3`
- 起承转合 footer · `grid grid-cols-1 md:grid-cols-4 gap-4`

---

## §3 · 字面源(顶部)

| 字段 | 字面 |
|---|---|
| h1 | `AIP文案方法论` |
| subtitle | `系统学习AIP的短视频文案创作方法论，掌握爆款文案的核心技巧` |
| Tab 1 label | `20类脚本` |
| Tab 2 label | `20大爆款` |
| Tab 3 label | `开头公式` |
| Tab 4 label | `核心公式` |
| Tab 1 search placeholder | `搜索脚本类型...` |
| Tab 3 search placeholder | `搜索开头公式...` |
| Tab 4 search placeholder | `搜索核心公式...` |
| Tab 1 count | `共 20 类 · 显示 20 类` |
| Tab 2 count | `共 23 大 · 显示 23 个` |
| Tab 3 count | `共 23 个公式 · 显示 23 个` |
| Tab 4 count | `共 23 个公式 · 显示 23 个` |
| Tab 2 filter chip | `全部` / `经典元素` / `情绪驱动` / `内容策略` / `转化驱动` |

---

## §4 · Tab 2 · 23 爆款元素扩展(desc + 3 techniques)

> 复用现有 `HOT_ELEMENT_GROUPS` key/emoji/label · 仅追加 desc + techniques · category 字段已在 group key

```ts
// scripts: 'classic' 11 · 'emotion' 2 · 'content' 6 · 'conversion' 4

export const ELEMENT_DETAILS: Record<string, { desc: string; techniques: string[] }> = {
  // ── classic ─────────────────────────────────────────────────────────────────
  greed: {
    desc: "利益驱动，让人觉得'不做就亏了'，触发占便宜心理",
    techniques: ["让人觉得'不做就亏了'", '用具体数字展示利益', '触发占便宜心理和贪心'],
  },
  fear: {
    desc: "损失厌恶、风险警告，'不知道就会被坑'的焦虑感",
    techniques: ['描述不行动的严重后果', '用真实案例制造焦虑', '先制造恐惧再给出路'],
  },
  curiosity: {
    desc: "信息差、悬念、反常识，'不看完就亏了'的好奇心",
    techniques: ['制造信息差和悬念', '抛出反常识的事实', "让人觉得'不看完就亏了'"],
  },
  contrast: {
    desc: "出乎意料的对比，颠覆认知，制造'原来是这样'的冲击",
    techniques: ['前后对比要强烈到弹眼', '打破常规认知', '用数据和案例制造反差冲击'],
  },
  worst: {
    desc: '最差情况/底线思维，用最坏结果倒逼行动',
    techniques: ['描述最坏的情况倒逼行动', '用底线思维降低决策门槛', '展示失败后的真实代价'],
  },
  leverage: {
    desc: '借热点、借名人、借趋势，四两拨千斤',
    techniques: ['借热点事件切入自己的观点', '借名人/大事件拉高关注', '四两拨千斤，用小力气撬动大流量'],
  },
  resonance: {
    desc: "说出心里话，'这不就是我吗'的认同感",
    techniques: ['说出目标用户心里想说但说不出的话', "用'你是不是也...'句式引发认同", '描述具体场景让人对号入座'],
  },
  empathy: {
    desc: "感同身受，情绪代入，'我理解你'的温暖",
    techniques: ['讲述相似经历建立情感连接', "用'我理解你'的姿态而不是居高临下", '先共情再给方法，不要上来就说教'],
  },
  small_big: {
    desc: '小人物逆袭、小投入大回报、小细节大变化',
    techniques: ['小人物逆袭的真实故事', '一个小改动带来巨大变化', '用极小的成本撬动极大的结果'],
  },
  low_cost_high: {
    desc: '明确的投入产出比，花最少的钱/时间得到最大的结果',
    techniques: ['明确展示投入产出比', '用具体数字对比花费和收益', "强调'花XX就能得到XX'的确定性"],
  },
  low_cost_unknown: {
    desc: '低门槛试错，结果未知但充满期待，激发冒险和尝试欲',
    techniques: ['强调低门槛试错的安全感', '制造对未知结果的期待和兴奋', "用'万一成了呢'激发冒险欲"],
  },
  // ── emotion ─────────────────────────────────────────────────────────────────
  anger: {
    desc: '引发不满和共鸣，激发传播欲',
    techniques: ['揭露不公平现象', '替用户发声', '引发正义感'],
  },
  surprise: {
    desc: '超出预期的结果，制造wow时刻',
    techniques: ['设置意想不到的结果', '打破常规思维', '制造wow时刻'],
  },
  // ── content ─────────────────────────────────────────────────────────────────
  trend: {
    desc: '蹭热点话题，借势获取流量',
    techniques: ['快速跟进热点', '独特角度解读', '结合自身领域'],
  },
  controversy: {
    desc: '有争议性的观点，引发讨论和互动',
    techniques: ['提出反常识观点', '引导理性讨论', '多角度分析'],
  },
  reveal: {
    desc: '行业内幕/潜规则，满足窥探欲',
    techniques: ['揭露行业内幕', '分享独家信息', '满足窥探欲'],
  },
  list: {
    desc: '盘点型内容，信息密度高',
    techniques: ['数字具体化', '排序有逻辑', '每条简洁有力'],
  },
  challenge: {
    desc: '挑战类内容，制造悬念和期待',
    techniques: ['设定明确目标', '记录真实过程', '展示最终结果'],
  },
  transformation: {
    desc: '前后对比/成长故事，激励人心',
    techniques: ['展示前后对比', '分享蜕变过程', '提炼方法论'],
  },
  // ── conversion ──────────────────────────────────────────────────────────────
  scarcity: {
    desc: '限时限量，制造紧迫感促进行动',
    techniques: ['限时限量', '倒计时营造紧迫', '强调错过的损失'],
  },
  social_proof: {
    desc: '他人评价/案例，增强信任感',
    techniques: ['展示用户评价', '分享成功案例', '用数据说话'],
  },
  authority: {
    desc: '专家/机构背书，提升可信度',
    techniques: ['引用专家观点', '展示资质证书', '分享专业经验'],
  },
  benefit: {
    desc: '直接利益承诺，明确价值主张',
    techniques: ['直接说明好处', '量化价值', '对比不行动的损失'],
  },
};
```

### 4.1 Tab 2 group label 中文(已存)

`经典元素` / `情绪驱动` / `内容策略` / `转化驱动`

---

## §5 · Tab 3 · 23 开头公式(完整字面源)

```ts
export interface OpeningFormula {
  num: number;
  name: string;
  formula: string;
  example: string;
}

export const OPENING_FORMULAS: ReadonlyArray<OpeningFormula> = [
  { num: 1,  name: '设置疑问',  formula: '你是不是也...？／你知道...吗？',          example: '"你每天都洗头，但是你洗头皮了吗？"' },
  { num: 2,  name: '引发共鸣',  formula: '痛点描述 + 情感共鸣',                    example: '"你是不是每天都在为短视频的选题发愁？"' },
  { num: 3,  name: '制造急迫感', formula: '号外/紧急通知 + 重要信息',                example: '"紧急通知！这个政策马上就要变了"' },
  { num: 4,  name: '告知好处',  formula: '学会这X招 + 具体好处',                    example: '"学会这3步，你也可以轻松上热门"' },
  { num: 5,  name: '盘点清单',  formula: 'X岁之前/之后 + 必须知道的X件事',           example: '"30岁之前，一定要知道的8件事"' },
  { num: 6,  name: '开宗明义',  formula: '直接点明主题',                            example: '"今天教你一个方法，让你的视频播放量翻倍"' },
  { num: 7,  name: '冲突前置',  formula: '挑战/对比 + 悬念',                        example: '"挑战10天成交100单，做到了吗？"' },
  { num: 8,  name: '威胁警告',  formula: '千万不要.../再不...就...',                 example: '"千万不要在晚上发这种视频"' },
  { num: 9,  name: '数字冲击',  formula: '具体数字 + 惊人结果',                      example: '"我花了30天，测试了100个账号，终于找到了规律"' },
  { num: 10, name: '反常识开场', formula: '打破常规认知 + 真相揭示',                 example: '"你以为早起就能成功？大错特错"' },
  { num: 11, name: '身份标签',  formula: '如果你是...+ 就一定要看',                  example: '"如果你是做美业的，这条视频一定要看完"' },
  { num: 12, name: '故事开场',  formula: '时间/地点/人物 + 悬念设置',                example: '"去年这个时候，我还是个月薪3000的打工人"' },
  { num: 13, name: '对比反差',  formula: '别人怎样 vs 我怎样',                       example: '"同行一年赚100万，而我一个月就做到了"' },
  { num: 14, name: '权威背书',  formula: '专家/机构/数据 + 重要结论',                example: '"哈佛研究发现：90%的人都在犯这个错误"' },
  { num: 15, name: '利益前置',  formula: '直接说明能获得什么',                       example: '"看完这条视频，你能省下至少5000元"' },
  { num: 16, name: '情景代入',  formula: '描绘具体场景 + 引发代入感',                example: '"每天晚上躲在被窝里刷手机的你，有没有想过..."' },
  { num: 17, name: '否定式开场', formula: '不要.../别再.../停下来',                  example: '"不要再傻傻地发视频了，先看完这个"' },
  { num: 18, name: '悬念前置',  formula: '结果前置 + 过程悬念',                      example: '"最后的结果让所有人都没想到"' },
  { num: 19, name: '爆料式开场', formula: '独家信息/内幕消息',                       example: '"这个行业的内幕，99%的人都不知道"' },
  { num: 20, name: '自嘲式开场', formula: '自嘲/自贬 + 转折反差',                    example: '"我就是那个曾经被所有人嘲笑的人"' },
  { num: 21, name: '金句开场',  formula: '金句/名言 + 延伸解读',                     example: '"人生没有白走的路，每一步都算数"' },
  { num: 22, name: '反问式开场', formula: '连续反问 + 引发思考',                     example: '"为什么你很努力却赚不到钱？为什么你很勤奋却没结果？"' },
  { num: 23, name: '时间限制',  formula: '限时/倒计时 + 紧迫感',                     example: '"这个方法可能很快就会被封，赶紧收藏"' },
];
```

---

## §6 · Tab 4 · 23 核心公式(完整字面源)

```ts
export interface CoreFormula {
  name: string;
  flow: string[]; // 流程 chips · 由 → 连接渲染
  example: string; // 实战案例 quote
}

export const CORE_FORMULAS: ReadonlyArray<CoreFormula> = [
  {
    name: '场景痛点公式',
    flow: ['场景痛点', '低成本行动解决难题', '具体操作过程'],
    example: '"每次拍视频都不知道说什么？教你一个方法，打开备忘录写下3个关键词，对着镜头像和朋友聊天一样说出来，1分钟就能录完一条爆款"',
  },
  {
    name: '错误纠正公式',
    flow: ['错误操作', '负面结果', '正确方法', '正面结果展示'],
    example: '"很多人做短视频上来就狂发，结果越发越没流量。正确做法是先拆解10个同行爆款，找到规律再动手，我学员用这个方法第一条视频就破了10万播放"',
  },
  {
    name: '好奇驱动公式',
    flow: ['猎奇开头', '过程展示', '结果揭晓', '价值总结'],
    example: '"我花了30天测试了100个账号，终于找到了抖音算法的规律——发布时间、标题关键词、前3秒完播率，这3个因素决定了80%的流量"',
  },
  {
    name: '反差冲击公式',
    flow: ['常规认知', '反转事实', '深度解析', '行动建议'],
    example: '"你以为做短视频最重要的是拍摄技巧？大错特错！真正决定你能不能火的是选题和开头前3秒，这两个占了成功率70%的权重"',
  },
  {
    name: '故事塑人公式',
    flow: ['困境开场', '转折事件', '行动突破', '成果展示', '方法提炼'],
    example: '"3年前我负债50万，娃娃都快和我离婚了。后来我开始死磕短视频，每天拍3条，坚持了180天，现在月入超过20万。记住：所有的逆袭都是死磕出来的"',
  },
  {
    name: '清单盘点公式',
    flow: ['数字标题', '逐条列举', '每条一句话解释', '总结号召'],
    example: '"做短视频必须知道的5个数据指标：①完播率>30%才能进下一个流量池 ②点赞率>3%说明内容有价值 ③评论率>1%说明话题有争议性 ④转发率>0.5%说明值得收藏 ⑤关注率>2%说明人设有吸引力"',
  },
  {
    name: '挑战记录公式',
    flow: ['目标设定', '过程记录', '困难展示', '结果揭晓'],
    example: '"挑战10天从0做到第一个客户！第1天发了3条视频播放量为0，第5天终于有人私信了，第8天成交了第一单，最终结果让所有人都没想到"',
  },
  {
    name: '测评对比公式',
    flow: ['产品展示', '多维度对比', '亲身体验', '明确结论'],
    example: '"测试了3种短视频引流方法：免费引流品vs低价课程vs直接加微信。测试30天后，第二种方法转化率最高，成本最低，客单价还能提升30%"',
  },
  {
    name: '恐惧营销公式',
    flow: ['风险描述', '数据支撑', '解决方案', '行动引导'],
    example: '"如果你现在还不开始做短视频，3年后你会发现同行都在线上抢你的客户。数据显示2025年80%的消费者会先看短视频再决定购买，现在开始还来得及"',
  },
  {
    name: '稀缺促单公式',
    flow: ['价值塑造', '限时限量', '损失描述', '立即行动'],
    example: '"这套IP孵化方案市场价9800，今天只开放10个名额，价格只要十分之一。错过这次，下次就是原价了。已经有7个人报名，只剩最后3个名额"',
  },
  {
    name: '权威背书公式',
    flow: ['专家引言', '数据证据', '案例展示', '方法输出'],
    example: '"我孵化过100多个IP，覆盖美业、大健康、服装等行业，平均每个IP变现千万以上。今天把最核心的方法论分享给你，只需要做好这3步"',
  },
  {
    name: '痛点放大公式',
    flow: ['痛点描述', '后果放大', '解决方案', '效果展示'],
    example: '"你每天花大量时间拍视频，但播放量永远不超过500？问题不是你不努力，而是你的内容结构有问题。我的学员用了这套方法，一周内播放量就突破了10万"',
  },
  {
    name: '社会证明公式',
    flow: ['用户评价', '成功案例', '数据展示', '信任建立'],
    example: '"学员小李，做美业的5年了，之前一直靠老客户介绍。跟我学了短视频IP打造后，第一个月就新增了37个客户，现在月入稳定在15万以上"',
  },
  {
    name: '情绪共鸣公式',
    flow: ['情绪触发', '共同经历', '情感升华', '价值输出'],
    example: '"有没有一个瞬间，你觉得自己特别孤独？创业这条路，没人理解你、没人支持你。但请记住：所有的伟大都是从孤独中长出来的"',
  },
  {
    name: '连载钩子公式',
    flow: ['悬念开场', '分步揭示', '每步留钩', '结尾预告下集'],
    example: '"今天先讲第一步：如何找到你的精准客户。这个方法我用了三年才总结出来，明天我会讲第二步——如何让客户主动找你买单，这个更狠"',
  },
  {
    name: '对比反差公式',
    flow: ['常规认知', '反差展示', '原因分析', '方法输出'],
    example: '"你以为做短视频需要专业设备？我的学员用一部手机就做到了月入超过10万。关键不是设备，而是你有没有掌握内容八大系统的方法"',
  },
  {
    name: '三步教学公式',
    flow: ['问题提出', '三步解决', '每步详解', '效果验证'],
    example: '"新手做短视频只需要3步：第一步找10个同行爆款拆解结构，第二步用黄金3秒公式写开头，第三步每天发布一条坚持30天。我的学员用这个方法，最快7天就出了第一条爆款"',
  },
  {
    name: '私域引流公式',
    flow: ['价值展示', '利益诱导', '行动指引', '私信引导'],
    example: '"我整理了一份《100个爆款选题模板》，已经帮助500多人做出了爆款视频。想要的朋友私信我'选题'两个字，免费送给你"',
  },
  {
    name: '热点借势公式',
    flow: ['热点事件', '独特角度', '行业关联', '价值输出'],
    example: '"2026年AI短视频工具爆发，很多人担心被替代。但我告诉你，会用AI的人和不会用的人，差距会越来越大。关键是你要学会用AI放大你的专业价值"',
  },
  {
    name: '人设塑造公式',
    flow: ['标签定位', '故事支撑', '价值观输出', '口头禅强化'],
    example: '"我是AIP，做了IP孵化这件事5年了。从一个人单打独斗，到现在累计孵化了100多个IP。我始终相信：每个人都值得被看见，关键是你要找到属于自己的表达方式"',
  },
  {
    name: '裂变传播公式',
    flow: ['情绪触发', '身份认同', '分享动机', '行动指引'],
    example: '"如果你也是一个不甘心打工的人，如果你也想通过短视频改变命运，把这条视频转发给你身边同样想改变的朋友，你们可以一起行动"',
  },
  {
    name: '信任递进公式',
    flow: ['免费价值', '小额体验', '效果展示', '高客单转化'],
    example: '"先免费送你一份《行业爆款地图》，觉得有用再报9.9元的入门课试试，学完你就知道我的方法管不管用。不满意随时退款，我对自己的内容有这个自信"',
  },
  {
    name: '产品种草公式',
    flow: ['使用场景', '亲身体验', '效果展示', '购买引导'],
    example: '"我自己用了这套方法做了一个美业账号，从0粉丝开始，30天涨到2万粉，成交了23单。如果你也想要这样的结果，点击下方链接了解详情"',
  },
];
```

注 · `用这个公式生成文案` btn 字面 = `用这个公式生成文案`(每 card 底)

---

## §7 · 起承转合 footer

```ts
export interface StoryStage {
  key: 'qi' | 'cheng' | 'zhuan' | 'he';
  label: string;
  color: string; // tailwind text color
  desc: string;
}

export const STORY_STAGES: ReadonlyArray<StoryStage> = [
  { key: 'qi',    label: '起：黄金3秒',    color: 'text-red-400',    desc: '必须在前3秒抓住观众眼球。可用设置疑问、引发共鸣、制造急迫感、告知好处、盘点清单、开宗明义、冲突前置等技巧。' },
  { key: 'cheng', label: '承：内容发展',    color: 'text-yellow-400', desc: '采用要点式分享，1、2、3层层递进。提供具体可操作的方法或信息，保持节奏感。' },
  { key: 'zhuan', label: '转：高潮转折',    color: 'text-green-400',  desc: "制造意想不到的转折，升华主题，给出核心洞察，让观众产生'原来如此'的感觉。" },
  { key: 'he',    label: '合：有力结尾',    color: 'text-orange-400', desc: '总结核心观点，给出行动号召（点赞、关注、收藏），留下金句或标志性结尾语。' },
];

export const STORY_FOOTER_TITLE = '起承转合 · 文案结构' as const;
```

---

## §8 · 新建 constants 清单

`apps/web/src/lib/constants/openingFormulas.ts` · 新建(SPEC §5)
`apps/web/src/lib/constants/coreFormulas.ts` · 新建(SPEC §6)
`apps/web/src/lib/constants/elementDetails.ts` · 新建(SPEC §4)
`apps/web/src/lib/constants/storyStages.ts` · 新建(SPEC §7)
`apps/web/src/lib/constants/knowledgePage.ts` · 新建(SPEC §3 顶部字面 + tab labels + count templates + search placeholders)

---

## §9 · sub-component 设计

新建组件(`apps/web/src/components/knowledge/`)·

| 文件 | 用途 |
|---|---|
| `KnowledgeHeader.tsx` | h1 + subtitle |
| `KnowledgeTabs.tsx` | 4 tab + content router |
| `ScriptTab.tsx` | Tab 1 · search + 20 ScriptCard grid |
| `ScriptCard.tsx` | 单 script card(chip icon + name + 收藏/复制 + desc + methodology + 案例折叠) |
| `ElementsTab.tsx` | Tab 2 · 4 filter chip + 23 ElementCard grid |
| `ElementCard.tsx` | 单 element card(emoji + name + 收藏/复制 + category chip + desc + 使用技巧 3 bullet) |
| `OpeningTab.tsx` | Tab 3 · search + 23 OpeningCard grid |
| `OpeningCard.tsx` | 单 opening card(num + name + 收藏/复制 + 公式 + 示例 quote) |
| `CoreTab.tsx` | Tab 4 · search + 23 CoreCard grid |
| `CoreCard.tsx` | 单 core card(name + 收藏/复制 + 流程 chips with arrow + 实战案例 quote + 用这个公式生成文案 btn) |
| `StoryFooter.tsx` | 起承转合 4 stage card grid |

---

## §10 · page rewrite

### 10.1 `apps/web/src/pages/tools/Knowledge.tsx` · 全文 rewrite(203 → ~50 行)

```tsx
import { KnowledgeHeader } from '@/components/knowledge/KnowledgeHeader';
import { KnowledgeTabs } from '@/components/knowledge/KnowledgeTabs';
import { StoryFooter } from '@/components/knowledge/StoryFooter';

export default function Knowledge() {
  return (
    <main className="flex-1 container py-8 max-w-7xl space-y-8">
      <KnowledgeHeader />
      <KnowledgeTabs />
      <StoryFooter />
    </main>
  );
}
```

删除 ·
- 老 stub Tab 3/4 placeholder
- ElementsInlineMultiPicker(替换为新 ElementCard grid)
- 老 ScriptCardsTab inline 定义(替换为新 ScriptTab component)
- `caseCount = (i % 9) + 1` 假数据
- forceMount workaround

---

## §11 · 验收(5 维度)

### D1 · 字面

innerText grep(切 Tab 后)· 必命中 ·
- h1 + subtitle 关键词
- 4 tab label
- Tab 1: 共 20 类 · 显示 20 类 + 20 ScriptType label(聊观点/晒过程/...)
- Tab 2: 共 23 大 · 显示 23 个 + 4 filter chip + 23 emoji label
- Tab 3: 共 23 个公式 · 显示 23 个 + 23 OpeningFormula name(设置疑问/引发共鸣/...)
- Tab 4: 共 23 个公式 · 显示 23 个 + 23 CoreFormula name(场景痛点公式/...)
- 起承转合 footer · 4 stage label
- 字面命中率 ≥ 99%

### D2 · 视觉

- 4 tab 切换 OK
- Tab 1/2/3/4 3 col grid card
- Tab 4 流程 chips 由 ArrowRight 连接
- 起承转合 4 col grid 彩色 stage(red/yellow/green/orange)

### D3 · 交互

- tab click 切换
- search input 实时过滤
- Tab 2 filter chip 切换
- 案例折叠 chevron toggle
- 复制 btn · toast `已复制`
- 收藏 btn · toast `收藏 · 即将上线`
- 用这个公式生成文案 btn · toast `生成文案 · 即将上线`

### D4 · 状态

- activeTab · search · selectedFilter · expandedCard · 4 state

### D5 · 边界

- 0 trpc · 全 mock(复用现有 SCRIPT_TYPES + HOT_ELEMENT_GROUPS + 新 OPENING/CORE/STAGES)

### D6 · typecheck + test

- `pnpm typecheck` 全绿
- `pnpm --filter @quanan/web test Knowledge` 全绿

---

## §12 · Sonnet 流程(7 步)

1. 新建 5 constants 文件(SPEC §3-§7 字面 · 中文标点全角)
2. 新建 11 子组件 in `apps/web/src/components/knowledge/`
3. rewrite `pages/tools/Knowledge.tsx`(203 → 50 行)
4. 改 / 新建 test
5. `pnpm typecheck` + `pnpm --filter @quanan/web test Knowledge` 全绿(失败 retry)
6. 报告

---

## §13 · 红线

1. ❌ hardcode 字面 · 必走 constants
2. ❌ 中文标点变半角(`，` `。` `（）` `：` `"` `"` `'` `'` 全角严守 · 尤其 OPENING + CORE quote 示例)
3. ❌ emoji 在 element card · sally 真实保留(SPEC §4 列出的)
4. ❌ 保留旧 stub placeholder / caseCount mod / forceMount workaround
5. ❌ page 直接 inline 子段 · 必抽 sub-component
6. ❌ 动 `apps/api/` backend / 现有 SCRIPT_TYPES / HOT_ELEMENT_GROUPS schema(只追加 ELEMENT_DETAILS map)
7. ❌ 装新 npm 包

---

## §14 · 报告

```yaml
status: done | blocked
files_changed: ...
typecheck: pass | fail
test_run: pass | fail (N passed / N failed)
notes: ...
```
