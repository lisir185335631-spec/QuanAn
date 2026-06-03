# SPEC · /ai-video 1:1 复刻

> **目标** · `apps/web/src/pages/tools/AiVideo.tsx` 全文 rewrite · STORYBOARD 工具(form + empty + result 三态)1:1 sally
> **截图** · 9 张(form + empty + result · 10 SHOT 完整字面)
> **风险** · M+(最大字段密度页 · 10 SHOT 各含 12 字段 + 演示长文 + 3 段建议 · 但 mock-first 模式)

---

## §1 · 背景 + 8 大偏离

### 1.1 sally 真实页结构(3 态)

- **URL** · `aiipznt.vip/ai-video`
- **form 态** · STORYBOARD chip + 文案 textarea(默认演示文案)+ 5 平台 grid + 6 视频类型 grid + 主 CTA
- **empty 态** · 主 CTA 点之前 · 大占位 card "专业分镜表生成器" + 长描述 + 4 bullet
- **result 态** · 主 CTA + "清空记录，重新开始" small btn · 标题 card + 时间轴 bar(10 段)+ 3 建议(拍摄/剪辑/音乐)+ 10 SHOT card(详细)

### 1.2 8 大偏离(现状 PRD-22 → sally)

| # | 偏离点 | 现状 | sally 真实 |
|:-:|---|---|---|
| **1** | chip 标题样式 | "内容创作" small chip + H1 "STORYBOARD" Orbitron uppercase 大字 | chip box · 板夹 icon + "STORYBOARD" 金大字 + 副标题 2 行 "专业分镜表生成器 · 文案一键转拍摄方案"(注意:不是 page H1 · 是放置在 chip card 内) |
| **2** | 平台选择器 | PlatformInlineRadio 横向 5 平台 | 3+2 grid 5 平台 cards(每 card icon emoji + 名 · 选中态金边) |
| **3** | 视频类型选择 | 2x3 grid 6 type(icon + label + desc 同列) | 2x3 grid 6 type · 选中态金边 · label 大白 + desc 小灰(注意没 emoji · 现状 emoji 删) |
| **4** | textarea 默认 | 空 + placeholder "粘贴你的短视频文案..." | 默认含 sally 完整演示文案(797 字 · 美业老板话题)+ 字数 `797/5000` |
| **5** | 主 CTA 文案 | "一键生成专业分镜表" | 同 + ✨ icon 前缀 · 金底大按钮(占整宽) |
| **6** | empty 态完全缺 | 无 · 直接 textarea 下方有"示例文案" | 大占位 card · 板夹 icon 大灰 + h3 "专业分镜表生成器" + 描述 + 4 bullet(`>`前缀) |
| **7** | result 态完全偏离 | 横向 13 列 table(8 行 stub) | 标题 card(美业老板的秘密... · 110秒/10个分镜 · 复制/导出 btn) + 时间轴 10 段 bar(3s/5s/15s/12s/15s/10s/15s/15s/5s/10s) + 3 段建议(灯泡 拍摄/剪刀 剪辑/♪ 音乐)+ 10 SHOT vertical card |
| **8** | SHOT card 字段 schema 偏离 | 13 列扁平表(镜号/景别/角度/运镜/时长/画面/台词/字幕/音乐/音效/情绪/拍摄/剪辑) | SHOT card 复杂 · 含 (header SHOT#+秒+景别 tag)+ (4 cell grid: 角度/运镜/情绪/转场)+ 场景段 + 台词/旁白 box + 动作指导段 + 3 chip(T 字幕/♪ 音乐/💡 灯泡提示) |

### 1.3 strategy

- mock-first(同 step5/Diagnosis/DailyTasks 已成功模式)· 默认带 textarea sally 演示文案 + click "生成" 后渲染 sally 完整 10 SHOT mock(110 秒)· 0 LLM/0 API
- 保留 video-types.ts 现有 6 type · 删 emoji(sally 无 emoji)
- 5 平台 constants 新建(原 PlatformInlineRadio 不复用)
- TaskCard / TableRow 13 列全部 rewrite 为 ShotCard sub-component
- 删 CSV 导出 / 历史等 backend 依赖逻辑 · result 态 "导出CSV" / "复制全部" 按钮保留(纯视觉/简单 toast)

---

## §2 · 视觉规范

### 2.1 Icon 映射(lucide-react)

| 用途 | lucide icon |
|---|---|
| chip 标题 | `Clapperboard` 大尺寸金 |
| 主 CTA 前缀 | `Sparkles` 黑 |
| empty card 大 icon | `Clapperboard` 大灰 |
| empty bullet 前缀 | `ChevronRight` 金 |
| 标题 card 时长前 | `Clock` 灰 |
| 标题 card 分镜前 | `LayoutGrid` 灰 |
| 复制全部 | `Copy` 金 |
| 导出CSV | `Download` 黑 |
| 清空记录 | `Trash2` 灰 |
| 拍摄建议 | `Lightbulb` 金 |
| 剪辑要点 | `Scissors` 金 |
| 音乐建议 | `Music` 金 |
| SHOT header 秒前 | `Clock` 灰 |
| SHOT 场景 | `MapPin` 金 |
| SHOT 台词/旁白 | `Camera` 金 |
| SHOT 动作指导 | `Clapperboard` 金 |
| SHOT chip T 字幕 | `Type` 金 |
| SHOT chip ♪ 音乐 | `Music` 金 |
| SHOT chip 💡 提示 | `Lightbulb` 金 |
| 景别 tag 中景 | 绿(emerald) |
| 景别 tag 近景 | 金(primary) |
| 景别 tag 特写 | 橙(orange) |

### 2.2 layout

- main · `max-w-5xl mx-auto py-8 space-y-6`
- chip card · 顶部 · 内含 icon 左 + title/subtitle 右 · rounded-xl + border + bg-card + p-6
- form 各 section · 内含在大边框 card 内 · gap-6
- 5 平台 · `grid grid-cols-3 gap-4`(行 1 = 抖音/快手/小红书) + 行 2 = B站/视频号 占 2 列(空 1 列)
- 6 type · `grid grid-cols-2 gap-3`
- 主 CTA · `w-full py-4 rounded-xl text-base bold`
- empty placeholder card · 内含 icon 居中 + h3 居中 + 描述居中 + bullet stack 左对齐 · rounded-xl + border + p-12
- result 标题 card · header row + 时长 row + 时间轴 bar
- 时间轴 · `flex gap-1` · 每段 `flex-1` 但高 12px · 不同色调亮度按时长比例(纯视觉 · 不真按比)
- 3 段建议 · `flex flex-col gap-3` · 每 card border-border + bg-card + p-4
- 10 SHOT cards · `flex flex-col gap-4` · 每 card border-border + bg-card/40 + p-5

### 2.3 颜色

- chip card 边框金 + bg-card
- 5 platform card · 选中=border-primary + bg-primary/5 + 标题金 · 未选=border-border
- 6 type card · 同 platform
- 主 CTA · 金底 bg-primary + 黑字
- 时间轴 段 · 金调亮度按时长比例 / 简化 · 都金底 + opacity 不同
- 3 建议 card · border-border + 灯泡/剪刀/♪ icon 金
- SHOT card · border-border + 子 cell border-border + bg-card/60
- SHOT 景别 tag · 中景=text-emerald-400 bg-emerald-500/10 / 近景=text-primary bg-primary/10 / 特写=text-orange-400 bg-orange-500/10
- SHOT 子 cell label 灰 · value 白 bold
- SHOT chip · border-border + 金 text + 金 icon

---

## §3 · 字面源(form 部分)

### 3.1 chip card

- chip title · `STORYBOARD`(white bold uppercase letter-spacing wide · large text-3xl/4xl)
- chip subtitle · `专业分镜表生成器 · 文案一键转拍摄方案`(灰 text-sm 1 行)

### 3.2 section · 输入文案内容

- label · `输入文案内容`
- textarea default 演示文案(saved as `DEFAULT_DEMO_SCRIPT` constant) · 字符数 ≈797 · 段落 ·

```
【标题】为什么美业老板，有人赚钱那么轻松，有人却苦苦挣扎？

【话题抛出】你有没有发现，同样是美业老板，有人每天忙得焦头烂额，赚的却是辛苦钱；有人却能轻轻松松，钱自己就来了？这背后到底藏着什么秘密？

【正方】（轻松赚钱派：AI赋能，效率为王）
我见过一个美容院老板，店里只有三个人，但去年线上成交额却做到了370万。她是怎么做到的？就是把所有重复性、耗时的工作，比如预约排班、客户维护、营销话术，全部交给AI智能体。员工从繁琐的事务中解放出来，能把更多精力放在服务客户和提升专业技能上。这不就是把时间卖出更高的价钱吗？她算了一笔账，一个智能体每年帮她省下至少20万的人力成本，而且效率是人工的十倍。

【反方】（传统派：服务为本，温度至上）
但也有人说，美业是服务行业，最重要的是人情味和体验感。冰冷的AI怎么能替代美容师的巧手和贴心？一个老牌美容院老板就告诉我，她的客户都是跟着她十几年甚至二十几年的，靠的就是她和员工的专业、细致和情感连接。她觉得，如果把这些都交给AI，那美业就失去了灵魂，变成了流水线。客户来这里不仅是变美，更是寻求一份放松和信任，这是AI给不了的。

【我的立场】
其实，这两种观点都有道理，但我觉得，轻松赚钱和人情味并不冲突。那些赚钱轻松的美业老板，不是抛弃了服务，而是找到了一个支点，用AI把那些可以标准化的流程优化到极致，把省下来的时间和精力，投入到真正需要"人"的服务上。比如，AI帮你筛选出高意向客户，你再用你的专业和温度去转化和维护。这不就是把"低成本高回报"和"以小搏大"玩明白了？关键在于，你有没有看到这个趋势，有没有勇气去尝试。

【评论区引导】
你觉得美业未来是AI主导，还是人情味更重要？或者说，两者该怎么结合？评论区聊聊你的看法。

【话题标签】#美业 #AI赋能 #智能体 #赚钱思维 #效率提升 #创业者 #商业模式 #美业老板 #行业洞察
```

- 字数计 · `797/5000`(textarea default · 直接显示)

### 3.3 section · 发布平台

- label · `发布平台`
- 5 platform cards(grid · 行 1: 3 platform · 行 2: 2 platform) ·

| key | label | emoji icon |
|---|---|---|
| `douyin` | `抖音` | 📱 |
| `kuaishou` | `快手` | 🎬 |
| `xiaohongshu` | `小红书` | 📕 |
| `bilibili` | `B站` | 📺 |
| `wechat_video` | `视频号` | 📲 |

- default 选中 · `抖音`(金边)

### 3.4 section · 视频类型

- label · `视频类型`
- 6 type cards(2x3 grid)·

| key | label | desc |
|---|---|---|
| `monologue` | `口播` | `真人出镜讲述` |
| `plot` | `剧情` | `故事情节演绎` |
| `vlog` | `Vlog` | `生活记录风格` |
| `product` | `产品展示` | `商品种草带货` |
| `interview` | `街头采访` | `随机路人互动` |
| `tutorial` | `教程` | `知识技能教学` |

- default 选中 · `口播`(金边)
- **不要 emoji**(sally 真实无)

### 3.5 主 CTA

- text · `一键生成专业分镜表` + Sparkles icon 前缀
- 全宽金底大按钮

---

## §4 · 字面源(empty 态)

card 内 · 居中布局 ·
- 大 Clapperboard icon 灰(w-16 h-16)
- H3 · `专业分镜表生成器`(白 bold)
- 描述 · `输入你的短视频文案，AI将自动生成专业的分镜表，包含场景、景别、角度、运镜、情绪、台词、动作指导等完整拍摄参数，可直接交给摄影师执行。`
- 4 bullet · 每条 `ChevronRight` 金 prefix + 灰 text ·
  - `输入文案 → AI生成6-12个专业分镜`
  - `每个分镜包含：景别、角度、运镜、情绪、台词`
  - `支持5大平台 × 6种视频类型`
  - `一键导出CSV分镜表，直接交给团队执行`

> **触发条件** · `isResultShown` 为 false 时(默认 form 显示但 empty card 在主 CTA 下方) · 即 form 默认带 empty placeholder · 点 CTA 后切到 result

---

## §5 · 字面源(result 态 · 10 SHOT 完整)

### 5.1 顶部 control row

- 主 CTA 仍显示(同 form)
- 下方居中 small button · `清空记录，重新开始` + Trash2 icon(outline) · onClick = 切回 empty 态

### 5.2 标题 card

- H2 · `美业老板的秘密：AI赋能还是人情味？`(白 bold text-xl/2xl)
- 信息 row · `Clock` icon + `110秒` 灰 + 间距 + `LayoutGrid` icon + `10个分镜` 灰
- 右上 2 button ·
  - `复制全部`(outline · `Copy` icon · text-primary)
  - `导出CSV`(金底 primary · `Download` icon)

### 5.3 时间轴 bar(10 段)

10 段 flex · 每段标 `Ns` 文字(中心)· 不同 opacity(按 sally 截图大致 · 简化:全段相同金底 bg-primary 但 opacity 在 0.5-1.0 间)

| seg | duration |
|:-:|:-:|
| 1 | `3s` |
| 2 | `5s` |
| 3 | `15s` |
| 4 | `12s` |
| 5 | `15s` |
| 6 | `10s` |
| 7 | `15s` |
| 8 | `15s` |
| 9 | `5s` |
| 10 | `10s` |

### 5.4 3 段建议 cards

card 1 · 拍摄建议 ·
- icon · `Lightbulb` 金 + label · `拍摄建议：`(bold)
- 内容 · `灯光：主光清晰，辅光柔和，营造专业且有质感的画面。收音：务必使用专业麦克风，保证口播清晰无杂音。服装妆造：主播形象专业、时尚，符合美业老板的定位。背景：简洁不杂乱，能体现科技感或专业感。眼神：主播要多与镜头互动，眼神真诚有力。`

card 2 · 剪辑要点 ·
- icon · `Scissors` 金 + label · `剪辑要点：`
- 内容 · `整体节奏要快，尤其前3-5秒。画面文字叠加要简洁有力，突出关键信息和数据。转场以硬切为主，保持视频紧凑感。调色风格偏明亮、现代，突出专业感。适当加入AI界面或数据图表的动态特效，增强科技感。音效要配合台词和情绪变化。`

card 3 · 音乐建议 ·
- icon · `Music` 金 + label · `音乐建议：`
- 内容 · `整体音乐风格为现代电子乐，节奏明快，富有科技感和思考性。在讲述AI优势时节奏加快，讲述人情味时节奏放缓并转为舒缓，最后回到积极有力的旋律，结尾处轻松收尾。`

### 5.5 10 SHOT cards(完整 mock 数据)

每 SHOT card 字段:
- `num` · 编号(`01`-`10` 两位补 0)
- `duration` · `3秒`/`5秒`/`15秒`/`12秒`/`15秒`/`10秒`/`15秒`/`15秒`/`5秒`/`10秒`
- `framing` · 景别 tag · `中景`/`近景`/`特写`(按 sally 截图)
- `angle` · 角度(短)
- `movement` · 运镜
- `emotion` · 情绪
- `transition` · 转场
- `scene` · 场景(长段)
- `dialogue` · 台词/旁白(box)
- `action` · 动作指导(段)
- `subtitle` · T 字幕叠加 chip text
- `music` · ♪ 音乐 chip text
- `tip` · 💡 提示 chip text

具体 10 SHOT 字面(写入 constants `STORYBOARD_MOCK_SHOTS`):

```ts
// SHOT 01 · 3秒 · 中景
{
  num: '01', duration: '3秒', framing: '中景',
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
  num: '02', duration: '5秒', framing: '近景',
  angle: '平拍', movement: '固定',
  emotion: '语气带有强调和好奇。', transition: '硬切',
  scene: '同上，背景不变。',
  dialogue: '有人却能轻轻松松，钱自己就来了？这背后到底藏着什么秘密？',
  action: '身体略微前倾，右手食指轻点太阳穴，表示思考，然后看向镜头，眼神充满探究。',
  subtitle: '秘密是什么？',
  music: '节奏感渐强，带有探究意味的背景音乐。',
  tip: '强调"秘密"二字，眼神要到位。',
},

// SHOT 03 · 15秒 · 中景
{
  num: '03', duration: '15秒', framing: '中景',
  angle: '平拍', movement: '固定',
  emotion: '讲述时自信、条理清晰，带有赞叹。', transition: '硬切',
  scene: '主播坐在一个简约的办公桌前，桌上摆放一台笔记本电脑，屏幕上可模糊显示一些数据图表或AI界面。背景可有绿植或现代装饰画。',
  dialogue: '我见过一个美容院老板，店里只有三个人，但去年线上成交额却做到了370万。她是怎么做到的？就是把所有重复性、耗时的工作，比如预约排班、客户维护、营销话术，全部交给AI智能体。',
  action: '讲述时用手势辅助，说到"370万"时，右手伸出三根手指，表示数字。说到"AI智能体"时，指向电脑屏幕。',
  subtitle: 'AI赋能：3人团队年销370万！重复性工作交给AI',
  music: '轻快、现代感的电子音乐，带有科技感。',
  tip: '强调AI带来的效率提升，文字叠加要突出关键数据和AI功能。',
},

// SHOT 04 · 12秒 · 近景
{
  num: '04', duration: '12秒', framing: '近景',
  angle: '平拍', movement: '固定',
  emotion: '语气肯定，带有分析和总结。', transition: '硬切',
  scene: '同上，背景不变。',
  dialogue: '员工从繁琐的事务中解放出来，能把更多精力放在服务客户和提升专业技能上。这不就是把时间卖出更高的价钱吗？她算了一笔账，一个智能体每年帮她省下至少20万的人力成本，而且效率是人工的十倍。',
  action: '说到"解放出来"时，双手做舒展动作。说到"更高价钱"时，右手向上抬起。说到"20万"和"十倍"时，眼神坚定，用手势强调数字。',
  subtitle: '解放员工精力，专注服务！AI省20万/年，效率提升10倍！',
  music: '音乐节奏略微加快，突出效率和价值。',
  tip: '口播节奏要快，数字和对比要清晰有力。',
},

// SHOT 05 · 15秒 · 中景
{
  num: '05', duration: '15秒', framing: '中景',
  angle: '平拍', movement: '固定',
  emotion: '语气略带转折，强调人情味和体验感。', transition: '硬切',
  scene: '主播换一个稍微柔和的场景，比如有暖色调灯光、舒适沙发或绿植的角落，营造温馨感。可手持一杯咖啡或茶。',
  dialogue: '但也有人说，美业是服务行业，最重要的是人情味和体验感。冰冷的AI怎么能替代美容师的巧手和贴心？一个老牌美容院老板就告诉我，她的客户都是跟着她十几年甚至二十几年的，靠的就是她和员工的专业、细致和情感连接。',
  action: '说到"人情味"时，左手轻抚胸口。说到"冰冷的AI"时，略微摇头。说到"十几年"时，伸出双手比划。',
  subtitle: '人情味至上：AI能替代温度吗？老客户靠的是"情感连接"',
  music: '音乐转为舒缓、温暖的旋律，突出"人情味"主题。',
  tip: '场景和音乐的转变要明显，对比AI的冰冷与人情味的温暖。',
},

// SHOT 06 · 10秒 · 近景
{
  num: '06', duration: '10秒', framing: '近景',
  angle: '平拍', movement: '固定',
  emotion: '语气真诚，略带思考。', transition: '硬切',
  scene: '同上，背景不变。',
  dialogue: '她觉得，如果把这些都交给AI，那美业就失去了灵魂，变成了流水线。客户来这里不仅是变美，更是寻求一份放松和信任，这是AI给不了的。',
  action: '说到"失去灵魂"时，双手做摊开状，表示无奈。说到"放松和信任"时，眼神温柔，略微点头。',
  subtitle: '美业若无"灵魂"，何谈信任？',
  music: '音乐保持舒缓，但略带一丝忧虑。',
  tip: '强调传统派的担忧，情感表达要真实。',
},

// SHOT 07 · 15秒 · 中景
{
  num: '07', duration: '15秒', framing: '中景',
  angle: '平拍',
  movement: '固定，可略微向前推，增加亲近感。',
  emotion: '语气坚定，充满洞察力，展现自己的观点。', transition: '硬切',
  scene: '回到最初的现代感办公室场景，主播站立。',
  dialogue: '其实，这两种观点都有道理，但我觉得，轻松赚钱和人情味并不冲突。那些赚钱轻松的美业老板，不是抛弃了服务，而是找到了一个支点，用AI把那些可以标准化的流程优化到极致，',
  action: '开场时双手交叉，表示权衡。说到"不冲突"时，右手食指向上指，表示找到关键点。说到"优化到极致"时，手势向下按，表示落实。',
  subtitle: '我的观点：赚钱与人情味不冲突！AI优化标准化流程',
  music: '音乐转为积极、有力的旋律，带有解决问题的信心。',
  tip: '场景切换回主场景，表明主播要给出自己的核心观点。语速适中，强调逻辑。',
},

// SHOT 08 · 15秒 · 近景
{
  num: '08', duration: '15秒', framing: '近景',
  angle: '平拍', movement: '固定',
  emotion: '自信，启发，带有鼓励。', transition: '硬切',
  scene: '同上，背景不变。',
  dialogue: '把省下来的时间和精力，投入到真正需要"人"的服务上。比如，AI帮你筛选出高意向客户，你再用你的专业和温度去转化和维护。这不就是把"低成本高回报"和"以小搏大"玩明白了？',
  action: '说到"投入到人"时，双手做包容状。说到"筛选客户"时，右手做筛选动作。说到"玩明白了"时，自信地摊开双手，略微耸肩。',
  subtitle: 'AI筛选客户，你用专业和温度转化！低成本高回报，以小搏大！',
  music: '音乐更加激昂，充满成功的预示。',
  tip: '核心观点阐述，文字叠加要突出"低成本高回报"和"以小搏大"。',
},

// SHOT 09 · 5秒 · 特写
{
  num: '09', duration: '5秒', framing: '特写',
  angle: '平拍', movement: '固定',
  emotion: '眼神锐利，充满挑战和鼓励。', transition: '硬切',
  scene: '同上，背景不变。',
  dialogue: '关键在于，你有没有看到这个趋势，有没有勇气去尝试。',
  action: '身体略微前倾，眼神直视镜头，右手食指指向镜头，强调"你"。',
  subtitle: '你敢不敢尝试？',
  music: '音乐突然变得有力，带有冲击感，结尾处可加入一个"叮"的音效。',
  tip: '特写镜头增加冲击力，直接向观众提问，激发思考和行动。',
},

// SHOT 10 · 10秒 · 中景
{
  num: '10', duration: '10秒', framing: '中景',
  angle: '平拍', movement: '固定',
  emotion: '亲切，期待互动。', transition: '淡出',
  scene: '同上，背景不变。',
  dialogue: '你觉得美业未来是AI主导，还是人情味更重要？或者说，两者该怎么结合？评论区聊聊你的看法。',
  action: '双手做邀请状，眼神看向下方，示意评论区。',
  subtitle: '评论区聊聊：AI vs 人情味，怎么结合？ #美业 #AI赋能 #智能体 #赚钱思维 #效率提升 #创业者 #商业模式 #美业老板 #行业洞察',
  music: '音乐逐渐减弱，轻松愉快的收尾。',
  tip: '引导评论，确保话题标签清晰展示。',
},
```

景别 tag 颜色映射 ·
- `中景` → emerald(SHOT 01, 03, 05, 07, 10)
- `近景` → primary 金(SHOT 02, 04, 06, 08)
- `特写` → orange(SHOT 09)

---

## §6 · constants 改动

### 6.1 `apps/web/src/lib/constants/video-types.ts` · 修改

- 删 emoji 字段(`emoji`)· sally 真实无
- 保留 6 type 数据(key/label/desc 不变)
- 改 `VideoType` interface 删 emoji

### 6.2 `apps/web/src/lib/constants/ai-video.ts` · 新建

```ts
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
];

// ── default demo script (sally 演示文案 · 797 字) ─────────────────────────────
export const AI_VIDEO_DEFAULT_DEMO_SCRIPT = `【标题】为什么美业老板，有人赚钱那么轻松，有人却苦苦挣扎？

【话题抛出】你有没有发现，同样是美业老板，有人每天忙得焦头烂额，赚的却是辛苦钱；有人却能轻轻松松，钱自己就来了？这背后到底藏着什么秘密？

【正方】（轻松赚钱派：AI赋能，效率为王）
我见过一个美容院老板，店里只有三个人，但去年线上成交额却做到了370万。她是怎么做到的？就是把所有重复性、耗时的工作，比如预约排班、客户维护、营销话术，全部交给AI智能体。员工从繁琐的事务中解放出来，能把更多精力放在服务客户和提升专业技能上。这不就是把时间卖出更高的价钱吗？她算了一笔账，一个智能体每年帮她省下至少20万的人力成本，而且效率是人工的十倍。

【反方】（传统派：服务为本，温度至上）
但也有人说，美业是服务行业，最重要的是人情味和体验感。冰冷的AI怎么能替代美容师的巧手和贴心？一个老牌美容院老板就告诉我，她的客户都是跟着她十几年甚至二十几年的，靠的就是她和员工的专业、细致和情感连接。她觉得，如果把这些都交给AI，那美业就失去了灵魂，变成了流水线。客户来这里不仅是变美，更是寻求一份放松和信任，这是AI给不了的。

【我的立场】
其实，这两种观点都有道理，但我觉得，轻松赚钱和人情味并不冲突。那些赚钱轻松的美业老板，不是抛弃了服务，而是找到了一个支点，用AI把那些可以标准化的流程优化到极致，把省下来的时间和精力，投入到真正需要"人"的服务上。比如，AI帮你筛选出高意向客户，你再用你的专业和温度去转化和维护。这不就是把"低成本高回报"和"以小搏大"玩明白了？关键在于，你有没有看到这个趋势，有没有勇气去尝试。

【评论区引导】
你觉得美业未来是AI主导，还是人情味更重要？或者说，两者该怎么结合？评论区聊聊你的看法。

【话题标签】#美业 #AI赋能 #智能体 #赚钱思维 #效率提升 #创业者 #商业模式 #美业老板 #行业洞察`;

// ── empty placeholder ────────────────────────────────────────────────────────
export const AI_VIDEO_EMPTY_H3 = '专业分镜表生成器' as const;
export const AI_VIDEO_EMPTY_DESC = '输入你的短视频文案，AI将自动生成专业的分镜表，包含场景、景别、角度、运镜、情绪、台词、动作指导等完整拍摄参数，可直接交给摄影师执行。' as const;
export const AI_VIDEO_EMPTY_BULLETS: ReadonlyArray<string> = [
  '输入文案 → AI生成6-12个专业分镜',
  '每个分镜包含：景别、角度、运镜、情绪、台词',
  '支持5大平台 × 6种视频类型',
  '一键导出CSV分镜表，直接交给团队执行',
];

// ── result · title card ──────────────────────────────────────────────────────
export const AI_VIDEO_RESULT_TITLE = '美业老板的秘密：AI赋能还是人情味？' as const;
export const AI_VIDEO_RESULT_TOTAL_DURATION = '110秒' as const;
export const AI_VIDEO_RESULT_SHOT_COUNT = '10个分镜' as const;

// ── result · timeline ─────────────────────────────────────────────────────────
export const AI_VIDEO_TIMELINE_SEGMENTS: ReadonlyArray<string> = [
  '3s', '5s', '15s', '12s', '15s', '10s', '15s', '15s', '5s', '10s',
];

// ── result · 3 段建议 ────────────────────────────────────────────────────────
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
];

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
  // ... 10 entries 见 §5.5 完整字面
];

// ── SHOT card label prefix ────────────────────────────────────────────────────
export const SHOT_LABEL_ANGLE = '角度' as const;
export const SHOT_LABEL_MOVEMENT = '运镜' as const;
export const SHOT_LABEL_EMOTION = '情绪' as const;
export const SHOT_LABEL_TRANSITION = '转场' as const;
export const SHOT_LABEL_SCENE = '场景' as const;
export const SHOT_LABEL_DIALOGUE = '台词/旁白' as const;
export const SHOT_LABEL_ACTION = '动作指导' as const;
```

---

## §7 · sub-component 设计

新建组件清单(`apps/web/src/components/ai-video/`)·

| 文件 | 用途 | 行数估 |
|---|---|:-:|
| `StoryboardChip.tsx` | 顶部 chip card(Clapperboard icon + title + subtitle) | ~25 |
| `PlatformCard.tsx` | 单 platform card(emoji + label · selected 态金边) | ~25 |
| `VideoTypeCard.tsx` | 单 type card(label + desc · selected 态金边) | ~25 |
| `EmptyPlaceholderCard.tsx` | empty 大占位(icon + h3 + desc + 4 bullet) | ~40 |
| `TimelineBar.tsx` | 10 段 timeline | ~25 |
| `AdviceCard.tsx` | 单建议 card(icon + label + content) | ~25 |
| `ResultTitleCard.tsx` | 标题 + 时长 + 分镜 + 2 button | ~35 |
| `ShotCard.tsx` | 单 SHOT card(header + 4 cell + 场景 + 台词 + 动作 + 3 chip) | ~80 |
| `ShotFramingTag.tsx` | 景别 tag(色按 framing) | ~20 |
| `ShotMetaCell.tsx` | SHOT 内 4 cell 中单个(icon label + 值) | ~25 |
| `ShotChip.tsx` | SHOT 底部 3 chip(T/♪/💡) | ~25 |

---

## §8 · page rewrite

### 8.1 `apps/web/src/pages/tools/AiVideo.tsx` · 全文 rewrite

```tsx
import { useState } from 'react';

import { StoryboardChip } from '@/components/ai-video/StoryboardChip';
import { PlatformCard } from '@/components/ai-video/PlatformCard';
import { VideoTypeCard } from '@/components/ai-video/VideoTypeCard';
import { EmptyPlaceholderCard } from '@/components/ai-video/EmptyPlaceholderCard';
import { TimelineBar } from '@/components/ai-video/TimelineBar';
import { AdviceCard } from '@/components/ai-video/AdviceCard';
import { ResultTitleCard } from '@/components/ai-video/ResultTitleCard';
import { ShotCard } from '@/components/ai-video/ShotCard';
import {
  AI_VIDEO_ADVICE,
  AI_VIDEO_CTA_TEXT,
  AI_VIDEO_DEFAULT_DEMO_SCRIPT,
  AI_VIDEO_LABEL_PLATFORM,
  AI_VIDEO_LABEL_TEXT,
  AI_VIDEO_LABEL_TYPE,
  AI_VIDEO_MOCK_SHOTS,
  AI_VIDEO_PLATFORMS,
  AI_VIDEO_RESTART_TEXT,
  AI_VIDEO_RESULT_SHOT_COUNT,
  AI_VIDEO_RESULT_TITLE,
  AI_VIDEO_RESULT_TOTAL_DURATION,
  AI_VIDEO_TIMELINE_SEGMENTS,
} from '@/lib/constants/ai-video';
import { VIDEO_TYPES } from '@/lib/constants/video-types';
import { Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AiVideo() {
  const [platform, setPlatform] = useState<string>('douyin');
  const [videoType, setVideoType] = useState<string>('monologue');
  const [text, setText] = useState(AI_VIDEO_DEFAULT_DEMO_SCRIPT);
  const [isResultShown, setIsResultShown] = useState(false);

  const handleGenerate = () => setIsResultShown(true);
  const handleRestart = () => setIsResultShown(false);

  return (
    <main className="flex-1 container py-8 max-w-5xl space-y-6">
      <StoryboardChip />

      {/* Form */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-2">
        <label className="text-base font-medium text-on-surface" htmlFor="ai-video-text">{AI_VIDEO_LABEL_TEXT}</label>
        <textarea
          id="ai-video-text"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 5000))}
          maxLength={5000}
          rows={12}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
          data-testid="ai-video-textarea"
        />
        <div className="flex justify-end text-sm text-muted-foreground">
          {text.length}/5000
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <label className="text-base font-medium text-on-surface">{AI_VIDEO_LABEL_PLATFORM}</label>
        <div className="grid grid-cols-3 gap-4">
          {AI_VIDEO_PLATFORMS.map((p) => (
            <PlatformCard key={p.key} platform={p} selected={p.key === platform} onClick={() => setPlatform(p.key)} />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <label className="text-base font-medium text-on-surface">{AI_VIDEO_LABEL_TYPE}</label>
        <div className="grid grid-cols-2 gap-3">
          {VIDEO_TYPES.map((vt) => (
            <VideoTypeCard key={vt.key} type={vt} selected={vt.key === videoType} onClick={() => setVideoType(vt.key)} />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        className="w-full py-4 rounded-xl bg-primary text-on-primary font-bold text-base flex items-center justify-center gap-2"
        data-testid="ai-video-cta"
      >
        <Sparkles className="w-5 h-5" />
        {AI_VIDEO_CTA_TEXT}
      </button>

      {!isResultShown && <EmptyPlaceholderCard />}

      {isResultShown && (
        <div className="space-y-6">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleRestart}
              className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-on-surface"
              data-testid="ai-video-restart"
            >
              <Trash2 className="w-4 h-4" />
              {AI_VIDEO_RESTART_TEXT}
            </button>
          </div>

          <ResultTitleCard
            title={AI_VIDEO_RESULT_TITLE}
            duration={AI_VIDEO_RESULT_TOTAL_DURATION}
            shotCount={AI_VIDEO_RESULT_SHOT_COUNT}
            onCopy={() => toast.success('已复制全部')}
            onExport={() => toast.info('CSV 导出 · 即将上线')}
          />

          <TimelineBar segments={AI_VIDEO_TIMELINE_SEGMENTS} />

          <div className="space-y-3">
            {AI_VIDEO_ADVICE.map((a) => <AdviceCard key={a.id} advice={a} />)}
          </div>

          <div className="space-y-4">
            {AI_VIDEO_MOCK_SHOTS.map((shot) => <ShotCard key={shot.num} shot={shot} />)}
          </div>
        </div>
      )}
    </main>
  );
}
```

---

## §9 · 文件清单

| 文件 | 操作 | 行数估 |
|---|:-:|:-:|
| `lib/constants/video-types.ts` | **改**(删 emoji 字段) | -1 / +0 |
| `lib/constants/ai-video.ts` | **新建**(含 10 SHOT mock + 演示文案 + 5 平台 + 4 bullet + 3 建议 + 字面 const) | ~290 |
| `components/ai-video/` | **新建 11 子组件** | 总 ~370 |
| `pages/tools/AiVideo.tsx` | **全文 rewrite**(267 → ~100 行) | -167 |
| `components/ToolResult/AiVideoResult.tsx` | **保留**(PRD-6 backend 图片生成 · 暂不删 · 不被 AiVideo.tsx 引用) | 不动 |
| 老 test(`apps/web/src/pages/tools/__tests__/AiVideo.test.tsx` 若存) | **rewrite** | ~50 |
| 老 test(constants) | **新建 / 改** | ~30 |

不动 · `apps/api/src/router/aiVideo.ts` backend / video-types.ts 6 type 数据(key/label/desc 字面已 1:1 sally)/ `inline-pickers/PlatformInlineRadio`(其他 page 可能用)

---

## §10 · 验收(5 维度)

### D1 · 字面(必过)

innerText grep · form 态(默认演示文案在 textarea · innerText 抓不到 textarea value · 用 page.$eval('textarea').value 抓)·
- `STORYBOARD` 1 次
- `专业分镜表生成器 · 文案一键转拍摄方案` 1 次
- `输入文案内容` / `发布平台` / `视频类型` 各 1 次
- 5 platform label(抖音/快手/小红书/B站/视频号)各 1 次
- 6 type label(口播/剧情/Vlog/产品展示/街头采访/教程)各 1 次
- 6 type desc 各 1 次
- `一键生成专业分镜表` 1 次
- empty card · `专业分镜表生成器` 2 次(h3 + chip subtitle)+ 描述 + 4 bullet
- `797/5000`(textarea 字数 · default 演示文案是 797 字)
- result 态(点 CTA 后)· 标题 + 110秒 + 10个分镜 + 复制全部 + 导出CSV + 清空记录，重新开始
- 10 SHOT card · SHOT 01 - SHOT 10 各 1 次 + 各 duration + framing tag 字面
- 3 段建议 label + content 各 1 次
- 字面命中率 ≥ 99%

### D2 · 视觉

- chip card 在顶 · 板夹 icon 金 + STORYBOARD 大字
- 5 platform · 3+2 grid · 抖音选中态金边
- 6 type · 2x3 grid · 口播选中态金边
- 主 CTA 全宽金底
- empty card 居中 · 板夹大灰 + h3 + desc + 4 bullet(ChevronRight 金 prefix)
- result · 标题 card · 110秒 + 10个分镜 + 2 button(复制/导出)
- 时间轴 10 段 bar · 金调
- 3 建议 card · 灯泡/剪刀/♪ icon 金
- 10 SHOT vertical stack · 每 card · SHOT 编号 + 秒 + 景别 tag(中绿/近金/特橙)+ 4 cell + 场景 + 台词 + 动作 + 3 chip

### D3 · 交互

- platform/type click toggle 选中
- textarea 改字 · 字数实时
- 主 CTA · 切到 result
- 清空记录 · 切回 empty
- 复制全部 / 导出CSV · toast(纯视觉 demo)

### D4 · 状态

- `text` / `platform` / `videoType` / `isResultShown` 4 state
- mock 渲染 · 0 fetch

### D5 · 边界

- 0 trpc · 0 backend · 同 step5/Diagnosis 模式

### D6 · typecheck + test

- `pnpm typecheck` 全绿
- `pnpm --filter @quanan/web test AiVideo` 全绿(老 test 改 / 新 test 加)

---

## §11 · Sonnet 流程(6 步)

1. **改** `lib/constants/video-types.ts` · 删 emoji 字段 + interface 改
2. **新建** `lib/constants/ai-video.ts` · 按 SPEC §5.5 + §6.2 完整字面(10 SHOT + 演示文案 + 5 平台 + 4 bullet + 3 建议 + 所有 const)· 中文标点全角
3. **新建** 11 子组件 在 `apps/web/src/components/ai-video/`(SPEC §7)· icon 全 lucide(SPEC §2.1 映射)· data-testid kebab-case
4. **全文 rewrite** `apps/web/src/pages/tools/AiVideo.tsx` 按 SPEC §8.1 · 删 13 列 table + STORYBOARD_COLUMNS + STUB_ROWS + handleExportCsv + PlatformInlineRadio import 全部
5. **改 test** · 改 / 新建 test 覆盖
6. **跑** `pnpm typecheck` + `pnpm --filter @quanan/web test AiVideo` 全绿

---

## §12 · 红线(违反 = reject)

1. ❌ 不允许 hardcode 字面 · 必走 constants(`AI_VIDEO_*` / `AI_VIDEO_MOCK_SHOTS[i].*`)
2. ❌ 不允许中文标点变半角 · 全角 `，` `。` `（）` `：` `"` `"` 必严守(尤其演示文案 + 10 SHOT)
3. ❌ 不允许 emoji 在 video type card · 全 lucide / 仅 platform card 用 emoji(per sally)
4. ❌ 不允许保留旧 13 列 table / STORYBOARD_COLUMNS / STUB_ROWS / handleExportCsv 任何残留
5. ❌ 不允许保留 PlatformInlineRadio / FadeInWrapper import(if 旧 page 引用 · 删)
6. ❌ 不允许 page 文件直接 inline ShotCard / PlatformCard / 子组件 · 必抽 sub-component
7. ❌ 不允许动 `apps/api/` backend / `inline-pickers/PlatformInlineRadio.tsx`(其他 page 可能用)
8. ❌ 不允许装新 npm 包

---

## §13 · 报告(Sonnet 干完回填)

```yaml
status: done | blocked
files_changed:
  - <path> · +N / -N
typecheck: pass | fail
test_run: pass | fail (N passed / N failed)
notes: <异常 / 决策>
```
