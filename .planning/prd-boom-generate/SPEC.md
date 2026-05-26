# SPEC · /boom-generate 1:1 复刻

> **目标** · `apps/web/src/pages/tools/BoomGenerate.tsx` 大改(205 → ~70 行)+ 5 sub-component 新建 · sally 4 group element + 6 篇 mock 文案
> **风险** · H(6 entry 巨大字面 mock · 每 entry 5 段长文 · 总字数 ~12K · 元素组合分析 红 card · 字面 1:1 关键)

---

## §1 · 7 大偏离

| # | 偏离 | 现状 | sally 真实 |
|:-:|---|---|---|
| 1 | 顶部 breadcrumb | 无 | `CREATE` 金 chip + `>` + `爆款生成` 金 text |
| 2 | h1 | `爆款元素自动生成`(无 emoji) | `⚡ 爆款元素自动生成`(⚡ emoji prefix) |
| 3 | subtitle 金色 inline | 全灰 | `选择爆款元素组合，AI自动生成5篇` + `深度爆款文案` 金 + `，每篇至少300字，拒绝表面化` |
| 4 | 数据源 | `trpc.boomGenerate.generate` + `BoomGenerateResult` + `ElementsInlineMultiPicker` 老组件 | mock-first · default 4 element category + 选中 共鸣 + default fill 美业/减肥 + default 显示 6 entry 完整 mock |
| 5 | 元素选中 banner | 无 / 简单 chip 计数 | 4 group 之下 banner · `已选 1 个元素： 共鸣` 金边 box |
| 6 | 元素组合分析 红 card | 无 | 红边 card · 元素组合分析 + 策略 chip + 共鸣 + 美业减肥 default 分析段 + 最佳实践 + 4 红 chip 避免 |
| 7 | 结果 entry 设计 | BoomGenerateResult 老结构 | 6 entry list · 每 entry · 序号 chip + 标题 + 爆款指数 X/10 + copy icon + 3 type chip(痛点/反常识/算账/方法论/观点/行业洞察 + 口播+xxx + 共鸣)+ 4 段(黄金3秒/内容发展/高潮/转折/结尾CTA)+ 完整文案 + 反馈 + 爆款原因 红字段 |

---

## §2 · 字面 + 视觉

### 2.1 顶部 breadcrumb(同 step/1 模式)

- chip · `CREATE` 金 chip
- `>` 灰
- `爆款生成` 金 text

### 2.2 Hero

- h1 · `⚡ 爆款元素自动生成`(⚡ emoji prefix · 用 lucide `Zap` 或 emoji string)
- subtitle inline · `选择爆款元素组合，AI自动生成5篇` 灰 + `<span text-primary font-bold>深度爆款文案</span>` + `，每篇至少300字，拒绝表面化` 灰

### 2.3 元素 picker section

- container · `rounded-2xl border border-primary/20 bg-card p-6`
- h2 · `选择爆款元素（可多选）` 白
- 4 group vertical · `space-y-6 mt-6` · 每 group ·
  - group label · `经典元素` / `情绪驱动` / `内容策略` / `转化驱动` 金小 `font-cn text-sm text-primary mb-3`
  - chip flex-wrap · `gap-3` · 每 chip ·
    - `rounded-full border border-border bg-card px-4 py-2 font-cn text-sm flex items-center gap-1.5 cursor-pointer hover:border-primary/40 transition`
    - selected · `border-primary text-primary bg-primary/10 font-bold`
    - 内容 · `{emoji} {label}`

- 选中 banner(条件渲染 · selected.length > 0)
  - `mt-6 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3 font-cn text-sm`
  - 内容 · `<span class="text-primary font-bold">已选 ${count} 个元素：</span><span>{labels.join('、')}</span>`(default 选中 共鸣 1 个)

### 2.4 可选设置 section

- container · `rounded-2xl border border-primary/20 bg-card p-6`
- h2 · `可选设置` 白
- 2 col grid `grid-cols-1 md:grid-cols-2 gap-4 mt-4`
- 字段 1 · `行业领域（可手动输入）` label · input · placeholder `当前：美业` · default value `美业`
- 字段 2 · `主题方向（选填）` label · input · placeholder `如：减肥、理财、育儿...` · default value `减肥`

### 2.5 CTA btn(居中)

- `block mx-auto bg-primary text-on-primary hover:bg-primary/90 rounded-full px-10 py-3 font-cn font-bold flex items-center gap-2`
- `Sparkles` icon + `一键生成爆款文案`

### 2.6 元素组合分析 红 card

- container · `rounded-xl border border-destructive/40 bg-destructive/5 p-5 mt-8`
- top row · flex justify-between ·
  - 左 · `<h3 class="font-display text-lg font-bold text-on-surface">元素组合分析</h3>` + `策略` chip(红边 + 红字 + bg-destructive/10)
  - 右 · `ChevronUp` icon 灰
- body 1 段(灰)· `共鸣元素与美业减肥主题结合，能有效触达目标用户内心深处，因为减肥是很多人反复尝试、反复失败的痛点。通过说出用户的心里话、揭示他们未曾察觉的真相，能快速建立信任感和认同感，促使用户停下来观看并寻求解决方案。`
- 最佳实践 row · 金 label `最佳实践：` + body · `1. 开头直接抛出用户的痛点或疑问，让他们感觉"这说的就是我"。 2. 用具体场景、数字或案例来支撑观点，让共鸣更具象化。 3. 揭示深层原因或行业内幕，让用户觉得被理解并获得新的认知。 4. 结尾提供切实可行的解决方案或资源，将共鸣转化为行动。`
- 4 红 chip 避免(flex-wrap gap-2)·
  - `避免空泛的口号式共鸣，要深入到用户行为和心理的细节。`
  - `不要过度贩卖焦虑，共鸣之后要给出希望和解决方案。`
  - `避免使用过于专业的术语，用'人话'解释复杂概念，让用户更容易理解和接受。`
  - `避免重复使用同一种共鸣策略，多样化的切入点能覆盖更广的用户群体。`
- chip 样式 · `rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1.5 font-cn text-xs text-destructive`

### 2.7 结果 entry list(6 entry)

- container · `space-y-6 mt-8`

每 entry ·
- `rounded-2xl border border-primary/20 bg-card p-6`
- **top row** · flex items-start justify-between
  - 左 · `<span class="w-7 h-7 rounded-full border border-primary/40 text-primary font-bold inline-flex items-center justify-center text-sm mr-3">{index}</span>` + 标题 `font-cn text-base font-bold flex-1`
  - 右 · `爆款指数 8/10` 橙色字 `font-display text-sm font-bold text-orange-500` + `Copy` icon btn
- **3 type chip row** · `flex gap-2 mt-3`
  - chip 1 (type · 橙) · `痛点切入型` / `反常识事实型` / `算账对比型` / `方法论拆解型` / `观点输出型` / `行业洞察型` · 橙边 + 橙字
  - chip 2 (format · 绿) · `口播+场景演示` / `口播+图文展示` / `口播+数据图表` / `口播+流程图` / `口播+情景模拟` / `口播+行业数据` · 绿边 + 绿字
  - chip 3 (element · 金) · `共鸣` 金边 + 金字
- **4 段 vertical** · `space-y-4 mt-4`
  - 每段 · 左 4px 竖条 + 段名 + body
  - 段 1 · 橙竖条 + `黄金3秒开头` 橙 label + body
  - 段 2 · 橙竖条 + `内容发展` 橙 label + body
  - 段 3 · 橙竖条 + `高潮/转折` 橙 label + body
  - 段 4 · 绿竖条 + `结尾/CTA` 绿 label + body
- **完整文案 section** · 折叠/展开
  - `mt-6 rounded-xl border border-border bg-muted/20 p-4`
  - 顶 · `完整文案` 金 label
  - body · 4 段拼接的长文
  - 底部 反馈 · `这个结果对你有帮助吗？` 灰小 + ThumbsUp + ThumbsDown btn
- **爆款原因 row** · 底部
  - `mt-4 rounded-lg border-l-2 border-destructive bg-destructive/5 p-3`
  - `爆款原因：` 红 bold + body 灰

### 2.8 6 entry 完整字面

ENTRY 1 ·
- index: 1
- title: `你是不是也觉得，减肥这事儿，总差那么一点点?`
- index_score: `8/10`
- type: `痛点切入型`
- format: `口播+场景演示`
- element: `共鸣`
- opening: `你是不是也觉得，减肥这事儿，总差那么一点点，就好像你已经很努力了，但体重秤上的数字就是不肯动?`
- development: `我懂那种感觉。你每天小心翼翼地计算卡路里，拒绝了多少次深夜的烤串邀约，甚至办了健身卡，却发现自己只是在"努力减肥"的路上反复横跳。你不是不够自律，也不是没有毅力，而是很多时候，我们从一开始就掉进了"伪努力"的陷阱。比如，你可能以为少吃一顿就能瘦，结果饿得头晕眼花，下一顿却报复性进食；或者你每天跑步半小时，却忽略了饮食结构根本没调整。这些看似努力的动作，就像在漏水的船上用勺子舀水，忙活半天，船底的水位却没怎么变。`
- climax: `真正的痛点在于，我们太容易被表面的"努力"迷惑，而没有真正理解身体的运作机制。你以为的"少吃多动"是个万能公式，但它忽略了个体差异、激素水平、睡眠质量，甚至情绪压力对减肥的巨大影响。我见过一个女孩，为了减肥每天只吃水煮菜，结果三个月后不仅没瘦，还内分泌失调，情绪低落。她不是不努力，是努力错了方向。减肥不是一场意志力的较量，更是一场智慧的博弈。`
- ending: `所以，如果你也正在这种"努力却无效"的循环里挣扎，别再责怪自己了。问题不在你，在方法。如果你想知道如何跳出这个循环，真正找到适合自己的减肥策略，我整理了一份《避坑指南》，里面详细拆解了那些让你白费力气的"伪努力"，需要的可以找我拿，让你少走弯路，把力气用在刀刃上。`
- reason: `开头直接点明用户普遍存在的"努力却无效"的痛点，引发强烈共鸣。通过具体场景和案例，让用户感觉被理解，并给出解决方案的引导。`

ENTRY 2 ·
- index: 2
- title: `减肥失败，不是你意志力差，而是你被这三个"常识"骗了!`
- index_score: `9/10`
- type: `反常识事实型`
- format: `口播+图文展示`
- element: `共鸣`
- opening: `减肥失败，不是你意志力差，而是你被这三个"常识"骗了，你是不是也觉得，只要管住嘴迈开腿，就一定能瘦?`
- development: `这个说法错得离谱。第一个被骗的常识：卡路里赤字是唯一王道。你每天盯着APP计算摄入量，却忽略了食物的GI值、营养密度，甚至烹饪方式。同样是100大卡，一块饼干和一把坚果对你身体的影响天差地别。身体不是一台简单的热量计算器，它更像一个复杂的化工厂，激素、酶、肠道菌群都在影响脂肪的储存和燃烧。第二个被骗的常识：运动越多瘦得越快。你每天跑得气喘吁吁，但如果运动强度过大，反而可能导致皮质醇升高，身体进入应激状态，反而更难减脂。而且，运动后很多人会产生"奖励性进食"心理，把辛苦消耗掉的热量又补了回来。第三个被骗的常识：饿肚子才能瘦。很多人为了快速减肥，选择节食，甚至断食。短期内体重可能下降，但减掉的往往是水分和肌肉，脂肪纹丝不动。一旦恢复正常饮食，体重会迅速反弹，甚至比之前更胖，这叫"溜溜球效应"。`
- climax: `这些你深信不疑的"常识"，其实是减肥路上最大的坑。它们让你在错误的道路上越走越远，消耗了你的热情和信心。你以为是自己不够努力，其实是方法有问题。我有个学员，之前就是这样，每天饿得发慌，运动量也很大，但体重就是下不来。后来我们调整了策略，让她不再纠结于卡路里数字，而是关注食物的品质和身体的感受，结果不到两个月，她就轻松减掉了10斤，而且状态越来越好。`
- ending: `所以，如果你也一直被这些"常识"困扰，感觉减肥像一场永无止境的战斗，是时候停下来重新审视了。真正的减肥，是科学地了解身体，而不是盲目地对抗。如果你想知道如何避开这些坑，建立一套真正有效的减肥系统，我准备了一份详细的《科学减脂路线图》，里面有我多年实践总结的经验，需要的可以私信我，帮你少走弯路。`
- reason: `直接否定用户固有认知，制造认知冲突，吸引注意力。通过揭示"常识"的错误，让用户产生"原来如此"的共鸣，并给出学员案例作为佐证，增强说服力。`

ENTRY 3 ·
- index: 3
- title: `你是不是也发现，努力减肥一年，不如别人随便吃瘦十斤?`
- index_score: `8/10`
- type: `算账对比型`
- format: `口播+数据图表`
- element: `共鸣`
- opening: `你是不是也发现，努力减肥一年，不如别人随便吃瘦十斤，感觉自己像个笑话?`
- development: `这背后不是什么"天赋异禀"，而是你可能在为"无效社交"买单。我说的不是人际关系，而是你身体里的"社交"——你和食物的关系。你可能每天花2小时运动，消耗了大概600卡路里，但回家奖励自己一杯奶茶，瞬间就补回了400卡，甚至更多。你以为自己赚了，其实亏大了。再算一笔账：你为了减肥，可能买了上千块的健身卡，几百块的代餐，甚至几百块的减肥药，结果呢? 这些钱换来的，可能只是体重秤上反复波动的数字，和日益增长的焦虑。而那些"随便吃"却瘦的人，他们可能只是无意识地避开了高糖高油，选择了更天然的食物，他们的身体在高效运转，而不是在疲于奔命。`
- climax: `真正的差距，不在于你付出了多少"努力"，而在于你的"努力"是否高效。我见过一个客户，她每个月花2000块请私教，每天在健身房挥汗如雨，但体重始终在120斤徘徊。后来我们分析发现，她运动后总喜欢吃"健康餐"，但那些所谓的健康餐，往往隐藏着高糖或高脂。我们帮她重新规划了饮食，让她学会读懂食物标签，只调整了饮食结构，不到三个月，她就轻松瘦了15斤，而且再也不用花大价钱买私教课了。她一年省下了2万多块钱，还收获了更好的身材。`
- ending: `所以，别再做无效的努力了。如果你也想结束这种"花钱又受罪"的减肥模式，真正学会如何让你的身体高效燃脂，而不是白白消耗时间和金钱，我整理了一份《高效燃脂餐单》，里面有详细的食谱和搭配建议，能帮你省钱又省力。需要的可以找我，让你把每一分钱和每一滴汗都花在刀刃上。`
- reason: `通过对比和算账的方式，直接点明用户在减肥上的无效投入，引发共鸣。用具体数字和案例增强说服力，引导用户思考更高效的减肥方式。`

ENTRY 4 ·
- index: 4
- title: `你是不是也试过无数减肥方法，最后都以失败告终?`
- index_score: `9/10`
- type: `方法论拆解型`
- format: `口播+流程图`
- element: `共鸣`
- opening: `你是不是也试过无数减肥方法，最后都以失败告终，感觉自己是不是天生就不能瘦?`
- development: `其实，你不是不能瘦，而是你一直缺少一套真正适合普通人的"懒人减脂SOP"。很多人减肥失败，不是因为不努力，而是方法太复杂，难以坚持。我总结了一套"三步懒人减脂法"，让你不用饿肚子，不用疯狂运动，也能轻松瘦下来。第一步：调整早餐结构。把高碳水早餐换成高蛋白早餐。比如，你以前吃面包牛奶，现在换成鸡蛋、牛奶、全麦面包。这个小改变，能让你上午的饱腹感更强，减少零食摄入，而且能稳定血糖，避免脂肪堆积。第二步：午餐"三七原则"。午餐七分饱，三七分搭配：30%蛋白质（肉蛋奶豆），70%蔬菜（深色蔬菜为主）。记住，不是让你不吃主食，而是把主食放在最后吃，并且选择粗粮。第三步：晚餐"轻断食"。晚餐尽量在睡前4小时解决，并且以清淡的蔬菜和少量蛋白质为主，避免高油高盐。如果实在饿，可以吃点黄瓜或者番茄。这三步，不需要你计算卡路里，不需要你每天去健身房打卡，只需要你稍微调整一下饮食习惯。`
- climax: `这套方法的核心，是让你的身体从"储脂模式"切换到"燃脂模式"，而且非常容易坚持。我有一个学员，她就是按照这套SOP，每天只是稍微调整了三餐，一个月就轻松减掉了6斤，而且精神状态非常好，完全没有节食的痛苦。她之前也尝试过各种方法，但都因为太复杂而放弃了。这套方法让她觉得，减肥原来可以这么轻松，而且是越吃越瘦。这不是什么魔法，是利用身体的自然规律。`
- ending: `所以，如果你也厌倦了那些复杂又痛苦的减肥方法，想找到一套简单易行、能长期坚持的减脂策略，我把这套"三步懒人减脂SOP"整理成了详细的图文版，里面还有很多实用的食谱建议。需要的可以私信我，让你轻松开启减脂之旅，告别反复减肥的痛苦。`
- reason: `直接点出用户在减肥方法上的困境，并提供一套简单易行的方法论，降低用户行动门槛。通过具体步骤和学员案例，增强可信度和共鸣感。`

ENTRY 5 ·
- index: 5
- title: `你是不是也觉得，减肥就是一场与美食的"苦恋"?`
- index_score: `8/10`
- type: `观点输出型`
- format: `口播+情景模拟`
- element: `共鸣`
- opening: `你是不是也觉得，减肥就是一场与美食的"苦恋"，明明爱得深沉，却不得不忍痛割爱?`
- development: `这个观点，我持反对意见。减肥不应该是苦行僧式的自我折磨，更不是对美食的彻底背叛。如果你把减肥看作是"牺牲"，那你的身体和心理都会抗拒。你会发现自己越是压抑，就越容易爆发，最终导致暴饮暴食，功亏一篑。这种"苦恋"模式，只会让你陷入无限的循环。真正的减肥，应该是学会如何与美食"共舞"，而不是"决裂"。你可以享受食物带来的愉悦，但要学会选择、学会适量、学会搭配。比如，你爱吃甜点，没关系，偶尔吃一块小份的，而不是一整块蛋糕；你爱吃火锅，可以多吃蔬菜和瘦肉，少吃丸子和蘸料。这并不是让你放弃热爱，而是让你学会更智慧地去爱。`
- climax: `我发现很多减肥成功的人，他们并不是意志力超人，而是他们改变了对食物的态度。他们不再把食物看作是敌人，而是看作是提供能量和营养的朋友。他们学会了倾听身体的声音，饿了就吃，饱了就停，而不是被情绪和外部信息所左右。这种"和解"的态度，让他们在享受美食的同时，也能保持健康的体态。反观那些总是减肥失败的人，他们往往把食物妖魔化，把减肥变成一场严酷的战争，结果身心俱疲，最终放弃。所以，减肥的真正核心，不是你吃了什么，而是你如何看待你吃的食物。`
- ending: `如果你也想摆脱这种与美食的"苦恋"，学会如何轻松享受食物，同时又能保持好身材，我整理了一份《情绪饮食调理指南》，里面有我多年研究的心理学方法，帮你重建与食物的健康关系。需要的可以找我，让你不再为吃而焦虑，真正实现自由饮食，自由瘦身。`
- reason: `以一个普遍存在的、带有情绪色彩的观点开场，引发用户共鸣。提出反向观点，并解释其深层原因，帮助用户从心理层面理解减肥，提供情绪价值。`

ENTRY 6 ·
- index: 6
- title: `你是不是也觉得，减肥成功后，就能一劳永逸了?`
- index_score: `9/10`
- type: `行业洞察型`
- format: `口播+行业数据`
- element: `共鸣`
- opening: `你是不是也觉得，减肥成功后，就能一劳永逸，从此告别肥胖烦恼了?`
- development: `这个想法，其实是美业减肥行业最大的"谎言"之一。根据我的行业观察，超过80%的减肥成功者会在一年内反弹，甚至比之前更胖。这不是偶然，而是这个行业心照不宣的"秘密"。为什么会这样? 因为很多机构只关注你短期内的体重数字，通过极端的节食、高强度运动甚至药物，让你快速掉秤。他们卖给你的是"快速瘦身"的希望，而不是"长期健康"的解决方案。他们不会告诉你，一旦你停止这些极端手段，你的身体会因为代谢受损、内分泌紊乱而迅速反弹。你以为你成功了，其实你只是被推入了一个更大的陷阱。`
- climax: `真正的行业洞察是：减肥的终极目标不是"瘦下来"，而是"不反弹"。那些让你快速瘦身的方法，往往是反弹的加速器。一个健康的减肥过程，应该是循序渐进的，它包括饮食习惯的重塑、运动模式的建立、心理状态的调整，甚至还有睡眠质量的改善。这就像盖房子，你不能只追求速度，而忽略了地基。我见过太多在美业机构花了几万块，瘦了20斤，结果半年反弹30斤的案例。他们不是没有努力，而是行业提供的解决方案本身就有问题，它利用了你急于求成的心态，却没能给你真正的健康。所以，当你看到那些宣称"七天瘦十斤"的广告时，一定要警惕，那很可能是一个美丽的陷阱。`
- ending: `如果你也厌倦了这种"瘦了又胖，胖了又瘦"的循环，想真正摆脱反弹的魔咒，学会如何科学地管理体重，我整理了一份《防反弹秘籍》，里面详细揭示了行业内幕，并提供了长期维持体重的有效策略。需要的可以找我，让你不仅能瘦下来，还能一直瘦下去，真正实现身材自由。`
- reason: `直接揭露美业减肥行业的普遍痛点和"谎言"，引发用户对自身经历的强烈共鸣。通过数据和案例，增强洞察的深度和可信度，让用户感觉被点醒。`

---

## §3 · constants 新建

`lib/constants/boomGenerate.ts` ·

```ts
export const BOOM_BREADCRUMB = 'CREATE' as const;
export const BOOM_BREADCRUMB_LABEL = '爆款生成' as const;
export const BOOM_H1 = '爆款元素自动生成' as const;
export const BOOM_SUBTITLE_PART1 = '选择爆款元素组合，AI自动生成5篇' as const;
export const BOOM_SUBTITLE_HIGHLIGHT = '深度爆款文案' as const;
export const BOOM_SUBTITLE_PART2 = '，每篇至少300字，拒绝表面化' as const;
export const BOOM_PICKER_TITLE = '选择爆款元素（可多选）' as const;
export const BOOM_SETTINGS_TITLE = '可选设置' as const;
export const BOOM_FIELD_INDUSTRY_LABEL = '行业领域（可手动输入）' as const;
export const BOOM_FIELD_INDUSTRY_PLACEHOLDER = '当前：美业' as const;
export const BOOM_FIELD_INDUSTRY_DEFAULT = '美业' as const;
export const BOOM_FIELD_TOPIC_LABEL = '主题方向（选填）' as const;
export const BOOM_FIELD_TOPIC_PLACEHOLDER = '如：减肥、理财、育儿...' as const;
export const BOOM_FIELD_TOPIC_DEFAULT = '减肥' as const;
export const BOOM_CTA = '一键生成爆款文案' as const;
export const BOOM_SELECTED_PREFIX = '已选' as const;
export const BOOM_SELECTED_SUFFIX = '个元素：' as const;
export const BOOM_DEFAULT_SELECTED_KEYS = ['resonance'] as const;
export const BOOM_FEEDBACK_PROMPT = '这个结果对你有帮助吗？' as const;

// 元素组合分析(默认共鸣 + 美业减肥)
export const BOOM_ANALYSIS_TITLE = '元素组合分析' as const;
export const BOOM_ANALYSIS_TAG = '策略' as const;
export const BOOM_ANALYSIS_BODY = '共鸣元素与美业减肥主题结合，能有效触达目标用户内心深处，因为减肥是很多人反复尝试、反复失败的痛点。通过说出用户的心里话、揭示他们未曾察觉的真相，能快速建立信任感和认同感，促使用户停下来观看并寻求解决方案。' as const;
export const BOOM_BEST_PRACTICE_LABEL = '最佳实践：' as const;
export const BOOM_BEST_PRACTICE = '1. 开头直接抛出用户的痛点或疑问，让他们感觉"这说的就是我"。 2. 用具体场景、数字或案例来支撑观点，让共鸣更具象化。 3. 揭示深层原因或行业内幕，让用户觉得被理解并获得新的认知。 4. 结尾提供切实可行的解决方案或资源，将共鸣转化为行动。' as const;
export const BOOM_AVOID_LIST: ReadonlyArray<string> = [
  '避免空泛的口号式共鸣，要深入到用户行为和心理的细节。',
  '不要过度贩卖焦虑，共鸣之后要给出希望和解决方案。',
  '避免使用过于专业的术语，用\'人话\'解释复杂概念，让用户更容易理解和接受。',
  '避免重复使用同一种共鸣策略，多样化的切入点能覆盖更广的用户群体。',
];

// entry section labels
export const BOOM_INDEX_PREFIX = '爆款指数 ' as const;
export const BOOM_SECTION_OPENING = '黄金3秒开头' as const;
export const BOOM_SECTION_DEVELOPMENT = '内容发展' as const;
export const BOOM_SECTION_CLIMAX = '高潮/转折' as const;
export const BOOM_SECTION_ENDING = '结尾/CTA' as const;
export const BOOM_SECTION_FULL = '完整文案' as const;
export const BOOM_REASON_PREFIX = '爆款原因：' as const;

// 6 entries
export interface BoomEntry {
  index: number;
  title: string;
  indexScore: string;
  type: string;
  format: string;
  element: string;
  opening: string;
  development: string;
  climax: string;
  ending: string;
  reason: string;
}

export const BOOM_ENTRIES: ReadonlyArray<BoomEntry> = [
  // ... 6 entries 完整字面(§2.8)
];
```

---

## §4 · sub-component 新建

`apps/web/src/pages/tools/components/boomGenerate/` ·

| 文件 | 用途 |
|---|---|
| `BoomBreadcrumb.tsx` | CREATE chip + > + 爆款生成 |
| `BoomHero.tsx` | h1 ⚡ + subtitle inline highlight |
| `BoomElementsPicker.tsx` | h2 + 4 group · chip · 选中 banner |
| `BoomSettings.tsx` | 可选设置 + 2 input |
| `BoomCTA.tsx` | Sparkles + 一键生成爆款文案 btn |
| `BoomAnalysis.tsx` | 红 card · 元素组合分析 + 策略 chip + 最佳实践 + 4 避免 |
| `BoomResultList.tsx` | space-y-6 · map BoomResultEntry |
| `BoomResultEntry.tsx` | 单 entry · top row + 3 type chip + 4 段 + 完整文案 + 反馈 + 爆款原因 |

---

## §5 · page rewrite

`apps/web/src/pages/tools/BoomGenerate.tsx`(205 → ~60 行) ·

```tsx
import { useState } from 'react';

import { BoomAnalysis } from './components/boomGenerate/BoomAnalysis';
import { BoomBreadcrumb } from './components/boomGenerate/BoomBreadcrumb';
import { BoomCTA } from './components/boomGenerate/BoomCTA';
import { BoomElementsPicker } from './components/boomGenerate/BoomElementsPicker';
import { BoomHero } from './components/boomGenerate/BoomHero';
import { BoomResultList } from './components/boomGenerate/BoomResultList';
import { BoomSettings } from './components/boomGenerate/BoomSettings';
import { BOOM_DEFAULT_SELECTED_KEYS, BOOM_ENTRIES, BOOM_FIELD_INDUSTRY_DEFAULT, BOOM_FIELD_TOPIC_DEFAULT } from '@/lib/constants/boomGenerate';

export default function BoomGenerate() {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([...BOOM_DEFAULT_SELECTED_KEYS]);
  const [industry, setIndustry] = useState(BOOM_FIELD_INDUSTRY_DEFAULT);
  const [topic, setTopic] = useState(BOOM_FIELD_TOPIC_DEFAULT);

  return (
    <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
      <BoomBreadcrumb />
      <BoomHero />
      <BoomElementsPicker selectedKeys={selectedKeys} onChange={setSelectedKeys} />
      <BoomSettings industry={industry} topic={topic} onIndustryChange={setIndustry} onTopicChange={setTopic} />
      <BoomCTA />
      <BoomAnalysis />
      <BoomResultList entries={BOOM_ENTRIES} />
    </main>
  );
}
```

删 · trpc.boomGenerate.generate / useActiveAccount / ALL_ELEMENTS / ElementsInlineMultiPicker / BoomGenerateResult / FadeInWrapper / abort controller 全部

---

## §6 · 文件清单

| 文件 | 操作 |
|---|---|
| `apps/web/src/lib/constants/boomGenerate.ts` | 新建 |
| `apps/web/src/pages/tools/components/boomGenerate/` 8 sub-component | 新建 |
| `apps/web/src/pages/tools/BoomGenerate.tsx` | rewrite 205 → ~60 行 |
| `apps/web/src/pages/tools/__tests__/BoomGenerate.test.tsx`(若存在) | 改 / 简化 |

---

## §7 · 验收

D1 字面 grep · 必命中 ·
- `CREATE` 1 次
- `爆款生成` 1 次(breadcrumb)
- `⚡` 1 次(h1)+ `爆款元素自动生成` 1 次
- `选择爆款元素组合，AI自动生成5篇` + `深度爆款文案` + `，每篇至少300字，拒绝表面化`
- `选择爆款元素（可多选）` 1 次
- 4 group label · 经典元素 / 情绪驱动 / 内容策略 / 转化驱动
- 23 元素 label 各 1 次(贪念 / 恐惧 / ... / 利益)
- `已选 1 个元素：` + `共鸣`
- `可选设置` 1 次
- `行业领域（可手动输入）` / `主题方向（选填）` / `当前：美业` / `如：减肥、理财、育儿...` / `美业`(default) / `减肥`(default)
- `一键生成爆款文案` 1 次
- `元素组合分析` 1 次 + `策略` 1 次
- `共鸣元素与美业减肥主题结合` 1 次
- `最佳实践：` 1 次
- 4 避免 chip 完整字面各 1 次
- 6 entry title 各 1 次
- 6 type 各 1 次(痛点切入型 / 反常识事实型 / 算账对比型 / 方法论拆解型 / 观点输出型 / 行业洞察型)
- 6 format 各 1 次(口播+场景演示 / 口播+图文展示 / 口播+数据图表 / 口播+流程图 / 口播+情景模拟 / 口播+行业数据)
- 4 段 label · 黄金3秒开头 / 内容发展 / 高潮/转折 / 结尾/CTA(每段 6 次 · grep 至少 1 次)
- `爆款指数` 6 次 + `8/10` / `9/10`
- `完整文案` 6 次
- `爆款原因：` 6 次
- 6 entry opening 关键句各 1 次

D2 · 布局 · breadcrumb + hero + element picker + settings + CTA + 红 analysis + 6 entry vertical · sally 1:1

D3 · element chip click 选中 · settings input 改 · CTA click(no-op mock)

D6 · typecheck + 测试(若 BoomGenerate.test.tsx 存在 · 改字面锁)

---

## §8 · Sonnet 执行流程

1. Read SPEC.md + 现 BoomGenerate.tsx + elements.ts(复用 HOT_ELEMENT_GROUPS) + AcquisitionVideo.tsx(参考 mock-first 模式)
2. 写 `lib/constants/boomGenerate.ts` · 25+ 字面常量 + BOOM_ENTRIES 6 完整 entry(每个 5 长 body + reason)
3. 写 8 sub-component
4. rewrite BoomGenerate.tsx
5. 改 __tests__/BoomGenerate.test.tsx(若存在 · 删 trpc mock · 字面锁)
6. 跑 typecheck + 测试
7. 报告

---

## §9 · 红线

- ❌ hardcode 字面(走 constants)
- ❌ 半角中文标点(`，` `：` `（）` `。` `"` 全角)
- ❌ 保留 trpc.boomGenerate.generate / useActiveAccount / ElementsInlineMultiPicker / BoomGenerateResult / FadeInWrapper
- ❌ 改 HOT_ELEMENT_GROUPS / ALL_ELEMENTS
- ❌ 动 backend / `apps/api/`
- ❌ 装新 npm 包
- ❌ 改 router.tsx / Header.tsx 外层
- ❌ 缩减 BOOM_ENTRIES 字面(6 entry 每个 5 长 body + reason · 完整保留)
