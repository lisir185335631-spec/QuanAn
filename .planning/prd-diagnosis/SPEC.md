# SPEC · /diagnosis 1:1 复刻

> **目标** · `apps/web/src/pages/modules/Diagnosis.tsx` + `components/diagnosis/DiagnosisStepCard.tsx` 改造 + report 全文 rewrite · sally 真实页 1:1
> **截图** · sally 18 张(form 8 step + report 双态) · 字面已完整盘点
> **风险** · L+(大字段量 · 但骨架 D-227 已有 · 主要是字面对齐 + report 完整重写)

---

## §1 · 背景 + 5 大偏离

### 1.1 sally 真实页结构

- **URL** · `aiipznt.vip/diagnosis`
- **流程** · 8 step 表单(基本信息 + 7 维度)→ 生成报告 → 7 维度详细报告页(总分 + 雷达 + 核心问题 + 长文 + 优先级 + 任务清单 + 行动计划 cards)
- **header** · 复用 AIP AGENT logo + 创作/策划/智能/更多 nav + 赵语AI/sally zhao + logout
- **页面正文 max-w** · 约 max-w-3xl 居中(form) · 报告页 max-w-5xl 居中

### 1.2 5 大偏离(D-227 → sally)

| # | 偏离点 | 现状 | sally 真实 |
|:-:|---|---|---|
| **1** | 大标题字面 | `7 维度 IP 诊断报告`(空格) | `7维度IP诊断报告`(无空格) |
| **2** | 副标题字面 | 含空格版 | `像老师一样诊断你的IP，找出问题，给出具体可执行的改进方案`(无空格) |
| **3** | 缺 chip · 缺 progress bar · 缺 icon block | header 只有 H1+P | chip `IP健康度诊断`(听诊器) + 8 段 progress bar + 每 step 有 icon block(7 不同 icon) |
| **4** | Step1 选项布局 + label | vertical list · label "行业/产品/当前阶段" | 2x2 grid 4 cards(标题+描述 2 行) · label "你的行业/你的产品/服务/你目前的阶段" |
| **5** | 报告页 stub | "整体评分 + 7 简单卡(score+issues+suggestions)" | 7 sub-section(总分+雷达 + 核心问题红框 + 详细诊断长文 + 5 维度详细块 + 优先级 5 步 + 任务清单 4 + 行动计划 5 cards) |

### 1.3 strategy

- 偏离 1/2 · constants 字面对齐
- 偏离 3 · 加 3 个新组件(`DiagnosisChip` / `DiagnosisProgressBar` / `DimensionIconBlock`)+ 改 `DiagnosisStepCard` 渲染
- 偏离 4 · 改 `DiagnosisStepCard` Step1 分支
- 偏离 5 · 全文 rewrite report 段 · 新增 7 个 report 子组件 + 1 个 `MOCK_REPORT` 常量(总分 0 demo · 跟 sally 截图字面 1:1)
- **保留** · 现有 trpc.diagnosis.generate mutation 调用 · loading state · error retry · localStorage 进度持久化 · `getInitialProgress` / `handleNext/Prev` 等 hook
- **mock-first 策略** · 报告页默认 render `MOCK_REPORT`(同 step5/7/8 已成功模式) · 不依赖 backend(backend 保留 PRR 评估)

---

## §2 · 视觉规范

### 2.1 Icon 映射(lucide-react)

| step | 维度 | lucide icon | 颜色 |
|:-:|---|---|---|
| 1 | 基本信息 | — | — |
| 2 | 定位清晰度 | `Target` | 金 text-primary |
| 3 | 账号包装 | `Package` | 金 text-primary |
| 4 | 流量型内容 | `Zap` | 金 text-primary |
| 5 | 价值型内容 | `BookOpen` | 金 text-primary |
| 6 | 案例型内容 | `Briefcase` | 金 text-primary |
| 7 | 人设型内容 | `Heart` | 金 text-primary |
| 8 | 内容状态 | `Mic` | 金 text-primary |

报告页相关 ·
- chip icon · `Stethoscope`(听诊器)
- 核心问题 icon · `XCircle`(红 ✕)
- 详细诊断 icon · `Stethoscope`
- 行动计划 H1 icon · `TrendingUp`(↑)
- 总分 icon · `Square`(红色 ban 风格 · 或 `Ban`)

### 2.2 color

- 大背景 · 黑(bg-background)
- chip · 深 bg + 金边 + 金文(听诊器 icon · 金)
- 大标题 · 白(text-on-surface) + display font · text-4xl/5xl bold
- 副标题 · 灰(text-muted-foreground)
- progress bar 段 · 完成 bg-primary(金) · 未完成 bg-muted/30 或 bg-border(灰)
- icon block 容器 · 深 bg(bg-card) + 圆角 rounded-xl + padding p-5
- ✕ row uncheck · 灰圈 ✕ icon(border-muted) + 灰文
- ✕ row check · 金圈 ✓ icon + 白文
- Step1 stage card 选中 · border-primary(金) + bg-primary/5 + 标题金
- Step1 stage card 未选 · border-border(灰) + bg-card
- 上一步 button · outline · 暗
- 下一步 button · 金底 bg-primary + 黑字 text-on-primary
- 核心问题 card · border-destructive(红/粉) + bg-destructive/5
- 详细诊断 card · border-border + bg-card
- 优先级行动 / 任务清单 · 无 card(纯文本流)
- 行动计划 5 cards · 金边 border-primary/40 + 深 bg + 圆形序号金底

### 2.3 layout

- form 页 · `max-w-3xl mx-auto`
- 报告页 · `max-w-5xl mx-auto`
- container `py-8` 上下 padding
- 各 block 间距 · `space-y-8` 或 `gap-8`
- progress bar 8 段 · flex gap-2 · 每段 flex-1 h-1 rounded-full
- Step1 4 cards · `grid grid-cols-2 gap-4`
- 总分+雷达 · `grid grid-cols-1 md:grid-cols-2 gap-6`
- 行动计划 5 cards · `flex flex-col gap-4` vertical stack

---

## §3 · form 部分细节(8 step)

### 3.1 全局 form header(每 step 同)

- chip · 含 `Stethoscope` icon(w-4 h-4 金) + 字 `IP健康度诊断`(text-primary text-sm) · 圆角 rounded-full · padding px-4 py-2 · 深 bg + 金边
- 大标题 · `7维度IP诊断报告` 白 text-4xl/5xl bold · text-center
- 副标题 · `像老师一样诊断你的IP，找出问题，给出具体可执行的改进方案` 灰 text-base · text-center
- progress bar · 8 段 · 当前 step 索引及之前段亮金(bg-primary) · 之后段灰(bg-muted/30)
- 进度文字 · 灰小字 · 左对齐 · `步骤 N/8 · {维度 label}`(注意:N 是 1-8 全角数字 · 分隔符是 `/`)

### 3.2 Step 1 · 基本信息(特殊 · 无 icon block · 无 checkbox)

布局 ·
- label `你的行业` → input(placeholder 空 · 演示值 `企业服务`)
- label `你的产品/服务` → input(placeholder 空 · 演示值 `定制智能体和opc培训`)
- label `你目前的阶段` → 2x2 grid 4 cards ·

| value | 标题 | 描述 |
|---|---|---|
| `startup` | 起步期 | 刚开始做IP，还在摸索中 |
| `growth` | 成长期 | 有一定内容了，但变现不稳定 |
| `breakout` | 爆发期 | 内容有爆款，正在放大变现 |
| `plateau` | 瓶颈期 | 遇到增长瓶颈，需要突破 |

card 视觉 · 选中态金边框 + 标题金 · 未选灰边框 + 标题白
- 上一步(disabled) / 下一步 button

### 3.3 Step 2-8 · 维度 step(同结构)

布局 ·
- icon block · 深 bg + 圆角 + padding · 含 ·
  - 左 icon 容器 w-12 h-12 圆角 bg-card + lucide icon(w-6 h-6 金)
  - 右 · 维度 label(白 text-lg bold) + 维度 subtitle(灰 text-sm)
- N 个 ✕/✓ row · row 含 ·
  - 左 圈 icon (`CircleX` w-5 h-5 灰)(未选)/(`CheckCircle2` w-5 h-5 金)(选中)
  - 右 文字 灰(未选)/ 白(选中)
  - 圆角边框 + padding
- label `补充说明（选填，越详细诊断越准）`(全角括号)
- textarea(每 step 不同 placeholder · 见 §3.4)
- 上一步 / 下一步(或 step8 改 "生成诊断报告" + Stethoscope icon)

### 3.4 7 维度 (Step 2-8) 字面 + textarea placeholder

> **constants 已有的不动**(`DIAGNOSIS_DIMENSIONS_8` 7 维度 label/subtitle/checkboxes 字面已 100% 对) · 仅需新增 placeholder 字段。

| step | 维度 | textarea placeholder |
|:-:|---|---|
| 2 | 定位清晰度 | `简单描述你的赛道和产品，比如：美业赛道，主推皮肤管理项目，引流品是9.9体验，利润品是年卡...` |
| 3 | 账号包装 | `你现在的昵称和简介是什么？` |
| 4 | 流量型内容 | `你发过哪些流量型内容？最高播放量多少？` |
| 5 | 价值型内容 | `你发过哪些价值型内容？效果怎么样？` |
| 6 | 案例型内容 | `你有多少个成功案例？是怎么展示的？` |
| 7 | 人设型内容 | `你发过哪些人设型内容？` |
| 8 | 内容状态 | `你拍视频的状态是怎样的？是对着镜头自然说话还是念稿？` |

---

## §4 · 报告部分细节(7 sub-section)

### 4.1 Section A · 总分 + 雷达图(2 列)

**Left card · `IPHealthScoreCard`**:
- 红 icon(用 `Ban` 红色 / 或 `XSquare`) · 大尺寸 w-16 h-16 · 居中
- `IP健康度总分` text-base 灰 · 居中
- 7 row bar list · 每 row:
  - 左 · 维度 label 4 字截断(`定位清晰` / `账号包装` / `流量型内` / `价值型内` / `案例型内` / `人设型内` / `内容状态`)灰
  - 中 · bar(w-full bg-muted/30 + 内 bar bg-primary 宽度按 score%)
  - 右 · 分数 `0` 灰 + icon `Square` 红
- card · rounded-xl border + bg-card + p-6

**Right card · `IPRadarChart`**:
- 7 角雷达 SVG 自绘 · polygon 7 边形(顶 = 状态)
- 7 角 label · 1-2 字截断 · 按截图 9 顺序 ·
  - 顶 = `状态`(内容状态)
  - 右上 = `包装`(账号包装)
  - 右下 = `流`(流量型内容)
  - 底右 = `价值`(价值型内容)
  - 底左 = `案例`(案例型内容)
  - 左下 = `设`(人设型内容)
  - 左上 = `定位`(定位清晰度)
- 中心点 · 蓝绿色圆点 cyan-400
- 7 圈同心网格 · stroke 灰 stroke-1
- card · 同 left

### 4.2 Section B · 核心问题(红框 card · `CoreIssuesCard`)

- icon `XCircle` w-5 h-5 红 · `核心问题` H3 红 text-lg bold
- 4 bullet(灰 text-base · `·` 前缀 list-disc)·
  1. 定位模糊，缺乏明确的目标客户和产品价值主张。
  2. 账号包装缺失，无法建立专业和信任的第一印象。
  3. 内容体系空白，没有吸引精准流量和建立信任的策略。
  4. 表达方式未经训练，可能存在念稿、播音腔等问题，影响内容真实性和感染力。
- card · border-destructive/40 + bg-destructive/5 + rounded-xl + p-6

### 4.3 Section C · 详细诊断报告 long(`DetailedReportSection`)

card · border-border + bg-card + rounded-xl + p-6 · 内含 ·

- 顶部 row · icon `Stethoscope` w-5 h-5 金 + `详细诊断报告` text-base bold 白
- 开场长文(text-base 灰) ·

> 老铁，看你这情况，我直接跟你说，你现在就是一张白纸，甚至连白纸都算不上，因为你连笔都还没拿起来。这7个维度全是0分，说明你压根儿就还没开始，或者说，你对IP孵化这事儿的理解，还停留在非常初级的阶段。

- `IP诊断报告` H2 白 bold text-2xl
- `**整体评价：** 你现在就是个"裸奔"状态，啥都没有，离变现还隔着十万八千里。`(整体评价: bold)
- 5 个 `DimensionDetailBlock` 子(详 §4.4)

### 4.4 5 维度详细块(`DimensionDetailBlock` · 在 DetailedReportSection 内)

#### 4.4.1 `1. 定位清晰度 (0分)`(H3 白)

- **现状：** `你没填任何定位信息，说明你对"要卖什么、卖给谁、怎么卖"这些核心问题，根本没想清楚，或者说，想了但没落地。`
- **问题在哪：** `没定位，就没方向。你不知道你的目标客户是谁，不知道他们有什么痛点，更不知道你的产品能怎么解决他们的痛点。这就好比你开了一家店，但不知道卖啥，也不知道谁会来买，那肯定没人光顾。`
- **具体怎么改：**
  - **确定赛道：** `"企业服务"太泛了。你的产品是"定制智能体和opc培训"，这听起来是给企业提供AI解决方案和自动化控制培训。你的目标客户是哪些企业？是制造业？科技公司？还是服务业？先圈定一个细分赛道，比如"制造业数字化转型中的智能体应用"或者"工业自动化领域的OPC技术赋能"。`
  - **产品定位明确：** `你的"定制智能体"具体解决企业什么问题？提高效率？降低成本？优化决策？"OPC培训"是给谁培训？技术人员？管理层？培训后能达到什么效果？把这些想清楚，用一句话概括你的产品价值。`
  - **产品链条清晰：** `你是只卖定制服务和培训？还是有后续的维护、升级、咨询服务？有没有配套的软件或硬件产品？把你的产品和服务组合成一个清晰的价值链条。`

#### 4.4.2 `2. 账号包装 (0分)`

- **现状：** `没填任何包装信息。`
- **问题在哪：** `账号包装是你的门面，是用户对你的第一印象。如果门面都没有，或者乱七八糟，精准用户根本不会点进来，更别说停留和转化了。`
- **具体怎么改：**
  - **头像生活化：** `别用什么公司Logo、风景照、卡通图。用你本人的真实照片，最好是半身照，面带微笑，显得专业又亲和。让人感觉你是个活生生的人，而不是一个冷冰冰的机构。`
  - **昵称：** `结合你的名字或外号 + 行业。比如你叫张三，你的行业是智能体/OPC，可以叫"张三智能体老张"、"OPC老张说智能"。这样既有辨识度，又能让人一眼看出你是干啥的。`
  - **简介垂直：** `按照"我是谁 + 解决什么问题 + 提供什么价值 + 案例"的模板来写。`
    - **我是谁：** `比如"我是老张，深耕工业智能体/OPC技术5年"。`
    - **解决什么问题：** `"帮助企业解决生产效率低下、数据孤岛、自动化升级难题"。`
    - **提供什么价值：** `"提供定制化智能体解决方案和实战OPC培训，让你的工厂聪明起来"。`
    - **案例（可选，初期可不写）：** `"已成功赋能XX家企业实现数字化转型"。`

#### 4.4.3 `3. 流量型内容 (0分)`

- **现状：** `没填任何内容信息。`
- **问题在哪：** `没流量，就没人知道你，更别谈变现。你的目标是把精准客户勾进来，而不是泛泛的流量。`
- **具体怎么改：**
  - **行业猎奇/奇葩/冷知识：** `针对你确定的细分赛道，去挖掘那些普通人不知道、但行业内又很关注的"猛料"。`
    - 比如：`"你知道吗？一个智能体能让工厂的废品率降低30%！"（猎奇）`
    - `"OPC协议里藏着多少工业数据黑科技，90%的工程师都不知道！"（冷知识）`
    - `"别再用土办法管理工厂了！你的竞争对手已经用AI智能体悄悄超车了！"（制造焦虑/奇葩现象）`
  - **选题方向：** `围绕"智能体"和"OPC培训"这两个核心，去拆解出用户感兴趣的点。比如：`
    - `"智能体是如何在流水线上'思考'的？"`
    - `"OPC UA：工业4.0的'普通话'，你还不会说？"`
    - `"工厂老板必看：定制智能体，到底能省多少钱？"`
  - **目标：** `至少要有一条视频播放量破10万，把精准人群吸引进来。`

#### 4.4.4 `4. 价值型内容 (0分)`

- **现状：** `没填任何内容信息。`
- **问题在哪：** `流量型内容吸引来人，价值型内容才能留住人、建立信任。没有价值，用户看完就走了，变现无从谈起。`
- **具体怎么改：**
  - **干货/教知识：** `把你的专业知识拆解成小块，用通俗易懂的方式讲出来。`
    - 比如：`"3分钟搞懂智能体定制流程，避开3个大坑！"`
    - `"OPC UA实战教程：从入门到掌握，这5个步骤最关键！"`
    - `"如何判断你的工厂是否需要定制智能体？3个核心指标告诉你！"`
  - **痛点解决方案：** `围绕你目标客户的实际痛点，给出具体的解决方案。`
    - `"工厂数据孤岛怎么办？一个智能体帮你打通所有环节！"`
    - `"OPC通信不稳定？这几个排查方法，让你告别掉线烦恼！"`
    - `"想提升生产效率？智能体帮你优化排产，效率提升20%！"`
  - **目标：** `必须爆一条20万+播放的视频，让你的专业度深入人心。`

#### 4.4.5 `5. 案例型内容 (0分)`

- **现状：** `没填任何内容信息。`
- **问题在哪：** `口说无凭，案例是最好的证明。没有案例，用户怎么相信你的服务是有效的？`
- **具体怎么改：**
  - **清晰展现结果：** `用数据说话。比如"为XX工厂定制智能体后，生产效率提升25%，成本降低10%。"或者"XX学员通过OPC培训，成功解决现场通信难题，获得晋升。"`
  - **详细过程：** `简单介绍一下你是怎么做到的。比如"我们如何通过AI视觉智能体，识别产品缺陷，将质检效率提升3倍。"`
  - **用户评价：** `最直接、最有说服力。可以是你和客户的对话截图，或者客户的录音、视频评价。`
  - **形式：** `可以是短视频，也可以是图文案例分享。`

> **注** · sally 截图只展示了 5 维度详细块 · 第 6/7 维度(人设/状态)无 detail block · 跟 sally 1:1 = 只 render 5 块。

### 4.5 Section D · 优先级排序及行动计划(`PriorityPlanSection`)

card · border-border + bg-card + rounded-xl + p-6 ·

- H2 · `优先级排序及行动计划` 白 text-2xl bold
- 开场 · `你现在是0分，所以每一步都得从头开始，没有捷径。` 灰
- 5 步 · 每步 ·
  - H3 bold(白) ·
    1. `第一步（本周内）：定位清晰度`
    2. `第二步（1周内）：账号包装`
    3. `第三步（2周内）：内容策略规划`
    4. `第四步（3周内）：流量型内容制作与发布`
    5. `第五步（4周内）：价值型内容制作与发布`
  - bullet · **具体执行：** + 内容
    1. `彻底想清楚你的细分赛道、产品定位和产品链条。用纸笔写下来，越详细越好。这是你所有后续工作的基础。`
    2. `按照我上面说的，拍好头像，想好昵称，写出垂直简介。这是你IP的门面，没门面谁会进来？`
    3. `围绕你的定位，分别规划至少3-5条流量型内容选题、3-5条价值型内容选题。先想好主题和大概的表达方式，不用立刻拍。`
    4. `制作并发布第一批2-3条流量型内容。重点是破行业流量层级，把精准人群勾进来。`
    5. `制作并发布第一批2-3条价值型内容。重点是展现专业度，建立信任。`

### 4.6 Section E · 本周立即行动任务清单(`WeeklyTasksSection`)

card · border-border + bg-card + rounded-xl + p-6 ·

- H2 · `本周立即行动任务清单` 白 text-2xl bold
- 4 子 ·
  - **明确细分赛道：** `锁定你的"定制智能体"和"OPC培训"具体服务哪类企业，解决什么核心问题。用一句话总结你的核心价值。`
  - **设计账号包装：** `拍一张专业又亲和的头像，想一个"小名/外号+行业"的昵称，并写出你的账号简介（我是谁+解决什么问题+提供什么价值）。`
  - **挖掘流量选题：** `针对你的细分赛道，至少想出3个"行业猎奇/奇葩/冷知识"的选题，能引发目标客户好奇心和兴趣的。`
  - **录制一条测试视频：** `不用发，就用手机录一段你对着镜头说话的视频，主题可以是随便一个你行业的冷知识。目的是练习口语化、有情绪的表达，避免念稿。`
- 寄语段(p 灰 text-base) ·

> 记住，老铁，IP孵化变现不是玩虚的，每一步都要实打实地干。从0到1是最难的，但只要你按照这个路子走，坚持下去，变现只是时间问题。别光想，赶紧动起来！

### 4.7 Section F · 行动计划 5 cards(`ActionPlanCardsSection`)

- H2 · icon `TrendingUp` w-5 h-5 金 + `行动计划` 白 bold text-2xl
- 5 cards(`ActionPlanCard`) vertical stack · gap-4 ·

| # | title | 维度 | 期限 |
|:-:|---|---|---|
| 1 | 明确细分赛道、产品定位和产品链条，形成书面文档。 | 定位清晰度 | 本周内 |
| 2 | 完成账号头像拍摄（生活化）、昵称设计（小名/外号+行业）和垂直简介撰写（我是谁+解决什么问题+提供什么价值）。 | 账号包装 | 1周内 |
| 3 | 规划至少3-5条流量型内容选题（行业猎奇/奇葩/冷知识）和3-5条价值型内容选题（干货/痛点解决方案）。 | 流量型内容 & 价值型内容 | 2周内 |
| 4 | 制作并发布首批2-3条流量型内容，重点测试用户反馈和播放效果。 | 流量型内容 | 3周内 |
| 5 | 制作并发布首批2-3条价值型内容，开始建立专业度和信任感。 | 价值型内容 | 4周内 |

card 结构 ·
- 左 · 圆形序号 w-10 h-10 bg-primary 金底 + 黑数字 bold
- 右 · 上 title 白 + 下 row(2 col gap-2 · "维度：xxx" 灰 + "期限：xxx" 金 text-sm)
- card · border border-primary/30 + bg-card + rounded-xl + p-5

### 4.8 Section G · 底部 3 button(`ReportFooterActions`)

- 3 button 居中 · gap-4 ·
  - 重新诊断(outline) · 触发 `handleRestartDiagnosis`
  - 诊断历史(outline icon `History`) · 暂用 toast `诊断历史 · PRD-30+`
  - 查看今日任务 → · 金底(`bg-primary text-on-primary`) + icon `ArrowRight` · navigate to `/daily-tasks`

---

## §5 · constants 改动

### 5.1 `apps/web/src/lib/constants/diagnosis.ts` · 修改

#### 5.1.1 字面对齐(替换)

```ts
// 偏离 1 修复
export const DIAGNOSIS_H1 = '7维度IP诊断报告' as const;
// 偏离 2 修复
export const DIAGNOSIS_SUBTITLE = '像老师一样诊断你的IP，找出问题，给出具体可执行的改进方案' as const;
// 全角括号修复
export const DIAGNOSIS_NOTES_PLACEHOLDER = '补充说明（选填，越详细诊断越准）' as const;
```

#### 5.1.2 `DIAGNOSIS_STAGES_4` 重写(增 desc 字段)

```ts
export const DIAGNOSIS_STAGES_4 = [
  { value: 'startup', label: '起步期', desc: '刚开始做IP，还在摸索中' },
  { value: 'growth', label: '成长期', desc: '有一定内容了，但变现不稳定' },
  { value: 'breakout', label: '爆发期', desc: '内容有爆款，正在放大变现' },
  { value: 'plateau', label: '瓶颈期', desc: '遇到增长瓶颈，需要突破' },
] as const;
```

#### 5.1.3 `CHIP_LABEL` 新增

```ts
export const DIAGNOSIS_CHIP_LABEL = 'IP健康度诊断' as const;
```

#### 5.1.4 `STEP1_LABELS` 新增

```ts
export const DIAGNOSIS_STEP1_LABELS = {
  industry: '你的行业',
  product: '你的产品/服务',
  stage: '你目前的阶段',
} as const;
```

#### 5.1.5 7 维度 textarea placeholder 新增

```ts
export const DIAGNOSIS_DIMENSION_PLACEHOLDERS: Record<string, string> = {
  positioning: '简单描述你的赛道和产品，比如：美业赛道，主推皮肤管理项目，引流品是9.9体验，利润品是年卡...',
  branding: '你现在的昵称和简介是什么？',
  traffic: '你发过哪些流量型内容？最高播放量多少？',
  value: '你发过哪些价值型内容？效果怎么样？',
  case: '你有多少个成功案例？是怎么展示的？',
  persona: '你发过哪些人设型内容？',
  authentic: '你拍视频的状态是怎样的？是对着镜头自然说话还是念稿？',
};
```

#### 5.1.6 navigation button 字面新增

```ts
export const DIAGNOSIS_BUTTONS = {
  prev: '上一步',
  next: '下一步',
  generate: '生成诊断报告',
  restart: '重新诊断',
  history: '诊断历史',
  todayTasks: '查看今日任务',
} as const;
```

#### 5.1.7 报告页 mock 常量(新增 · 完整字面对照 SPEC §4)

```ts
export interface ActionPlanCardData {
  num: number;
  title: string;
  dimension: string;
  deadline: string;
}

export interface DimensionDetailData {
  num: number;
  label: string;
  status: string;
  problem: string;
  solutions: ReadonlyArray<{ heading: string; body: string; sub?: ReadonlyArray<{ heading: string; body: string }> }>;
}

export interface PriorityStepData {
  num: number;
  title: string;
  exec: string;
}

export interface WeeklyTaskItem {
  heading: string;
  body: string;
}

export interface DiagnosisMockReport {
  overallScore: number;
  dimensionScores: ReadonlyArray<{ id: string; shortLabel: string; radarLabel: string; score: number }>;
  coreIssues: ReadonlyArray<string>;
  intro: string;
  reportH2: string;
  overallVerdictLead: string; // '整体评价：'
  overallVerdictBody: string; // '你现在就是...'
  details: ReadonlyArray<DimensionDetailData>;
  priorityIntro: string;
  prioritySteps: ReadonlyArray<PriorityStepData>;
  weeklyTasks: ReadonlyArray<WeeklyTaskItem>;
  closingNote: string;
  actionPlans: ReadonlyArray<ActionPlanCardData>;
}

export const DIAGNOSIS_MOCK_REPORT: DiagnosisMockReport = {
  overallScore: 0,
  dimensionScores: [
    { id: 'positioning', shortLabel: '定位清晰', radarLabel: '定位', score: 0 },
    { id: 'branding',    shortLabel: '账号包装', radarLabel: '包装', score: 0 },
    { id: 'traffic',     shortLabel: '流量型内', radarLabel: '流',   score: 0 },
    { id: 'value',       shortLabel: '价值型内', radarLabel: '价值', score: 0 },
    { id: 'case',        shortLabel: '案例型内', radarLabel: '案例', score: 0 },
    { id: 'persona',     shortLabel: '人设型内', radarLabel: '设',   score: 0 },
    { id: 'authentic',   shortLabel: '内容状态', radarLabel: '状态', score: 0 },
  ],
  coreIssues: [
    '定位模糊，缺乏明确的目标客户和产品价值主张。',
    '账号包装缺失，无法建立专业和信任的第一印象。',
    '内容体系空白，没有吸引精准流量和建立信任的策略。',
    '表达方式未经训练，可能存在念稿、播音腔等问题，影响内容真实性和感染力。',
  ],
  intro: '老铁，看你这情况，我直接跟你说，你现在就是一张白纸，甚至连白纸都算不上，因为你连笔都还没拿起来。这7个维度全是0分，说明你压根儿就还没开始，或者说，你对IP孵化这事儿的理解，还停留在非常初级的阶段。',
  reportH2: 'IP诊断报告',
  overallVerdictLead: '整体评价：',
  overallVerdictBody: '你现在就是个"裸奔"状态，啥都没有，离变现还隔着十万八千里。',
  details: [
    {
      num: 1, label: '定位清晰度',
      status: '你没填任何定位信息，说明你对"要卖什么、卖给谁、怎么卖"这些核心问题，根本没想清楚，或者说，想了但没落地。',
      problem: '没定位，就没方向。你不知道你的目标客户是谁，不知道他们有什么痛点，更不知道你的产品能怎么解决他们的痛点。这就好比你开了一家店，但不知道卖啥，也不知道谁会来买，那肯定没人光顾。',
      solutions: [
        { heading: '确定赛道：', body: '"企业服务"太泛了。你的产品是"定制智能体和opc培训"，这听起来是给企业提供AI解决方案和自动化控制培训。你的目标客户是哪些企业？是制造业？科技公司？还是服务业？先圈定一个细分赛道，比如"制造业数字化转型中的智能体应用"或者"工业自动化领域的OPC技术赋能"。' },
        { heading: '产品定位明确：', body: '你的"定制智能体"具体解决企业什么问题？提高效率？降低成本？优化决策？"OPC培训"是给谁培训？技术人员？管理层？培训后能达到什么效果？把这些想清楚，用一句话概括你的产品价值。' },
        { heading: '产品链条清晰：', body: '你是只卖定制服务和培训？还是有后续的维护、升级、咨询服务？有没有配套的软件或硬件产品？把你的产品和服务组合成一个清晰的价值链条。' },
      ],
    },
    {
      num: 2, label: '账号包装',
      status: '没填任何包装信息。',
      problem: '账号包装是你的门面，是用户对你的第一印象。如果门面都没有，或者乱七八糟，精准用户根本不会点进来，更别说停留和转化了。',
      solutions: [
        { heading: '头像生活化：', body: '别用什么公司Logo、风景照、卡通图。用你本人的真实照片，最好是半身照，面带微笑，显得专业又亲和。让人感觉你是个活生生的人，而不是一个冷冰冰的机构。' },
        { heading: '昵称：', body: '结合你的名字或外号 + 行业。比如你叫张三，你的行业是智能体/OPC，可以叫"张三智能体老张"、"OPC老张说智能"。这样既有辨识度，又能让人一眼看出你是干啥的。' },
        {
          heading: '简介垂直：', body: '按照"我是谁 + 解决什么问题 + 提供什么价值 + 案例"的模板来写。',
          sub: [
            { heading: '我是谁：', body: '比如"我是老张，深耕工业智能体/OPC技术5年"。' },
            { heading: '解决什么问题：', body: '"帮助企业解决生产效率低下、数据孤岛、自动化升级难题"。' },
            { heading: '提供什么价值：', body: '"提供定制化智能体解决方案和实战OPC培训，让你的工厂聪明起来"。' },
            { heading: '案例（可选，初期可不写）：', body: '"已成功赋能XX家企业实现数字化转型"。' },
          ],
        },
      ],
    },
    {
      num: 3, label: '流量型内容',
      status: '没填任何内容信息。',
      problem: '没流量，就没人知道你，更别谈变现。你的目标是把精准客户勾进来，而不是泛泛的流量。',
      solutions: [
        {
          heading: '行业猎奇/奇葩/冷知识：', body: '针对你确定的细分赛道，去挖掘那些普通人不知道、但行业内又很关注的"猛料"。',
          sub: [
            { heading: '比如：', body: '"你知道吗？一个智能体能让工厂的废品率降低30%！"（猎奇）' },
            { heading: '', body: '"OPC协议里藏着多少工业数据黑科技，90%的工程师都不知道！"（冷知识）' },
            { heading: '', body: '"别再用土办法管理工厂了！你的竞争对手已经用AI智能体悄悄超车了！"（制造焦虑/奇葩现象）' },
          ],
        },
        {
          heading: '选题方向：', body: '围绕"智能体"和"OPC培训"这两个核心，去拆解出用户感兴趣的点。比如：',
          sub: [
            { heading: '', body: '"智能体是如何在流水线上\'思考\'的？"' },
            { heading: '', body: '"OPC UA：工业4.0的\'普通话\'，你还不会说？"' },
            { heading: '', body: '"工厂老板必看：定制智能体，到底能省多少钱？"' },
          ],
        },
        { heading: '目标：', body: '至少要有一条视频播放量破10万，把精准人群吸引进来。' },
      ],
    },
    {
      num: 4, label: '价值型内容',
      status: '没填任何内容信息。',
      problem: '流量型内容吸引来人，价值型内容才能留住人、建立信任。没有价值，用户看完就走了，变现无从谈起。',
      solutions: [
        {
          heading: '干货/教知识：', body: '把你的专业知识拆解成小块，用通俗易懂的方式讲出来。',
          sub: [
            { heading: '比如：', body: '"3分钟搞懂智能体定制流程，避开3个大坑！"' },
            { heading: '', body: '"OPC UA实战教程：从入门到掌握，这5个步骤最关键！"' },
            { heading: '', body: '"如何判断你的工厂是否需要定制智能体？3个核心指标告诉你！"' },
          ],
        },
        {
          heading: '痛点解决方案：', body: '围绕你目标客户的实际痛点，给出具体的解决方案。',
          sub: [
            { heading: '', body: '"工厂数据孤岛怎么办？一个智能体帮你打通所有环节！"' },
            { heading: '', body: '"OPC通信不稳定？这几个排查方法，让你告别掉线烦恼！"' },
            { heading: '', body: '"想提升生产效率？智能体帮你优化排产，效率提升20%！"' },
          ],
        },
        { heading: '目标：', body: '必须爆一条20万+播放的视频，让你的专业度深入人心。' },
      ],
    },
    {
      num: 5, label: '案例型内容',
      status: '没填任何内容信息。',
      problem: '口说无凭，案例是最好的证明。没有案例，用户怎么相信你的服务是有效的？',
      solutions: [
        { heading: '清晰展现结果：', body: '用数据说话。比如"为XX工厂定制智能体后，生产效率提升25%，成本降低10%。"或者"XX学员通过OPC培训，成功解决现场通信难题，获得晋升。"' },
        { heading: '详细过程：', body: '简单介绍一下你是怎么做到的。比如"我们如何通过AI视觉智能体，识别产品缺陷，将质检效率提升3倍。"' },
        { heading: '用户评价：', body: '最直接、最有说服力。可以是你和客户的对话截图，或者客户的录音、视频评价。' },
        { heading: '形式：', body: '可以是短视频，也可以是图文案例分享。' },
      ],
    },
  ],
  priorityIntro: '你现在是0分，所以每一步都得从头开始，没有捷径。',
  prioritySteps: [
    { num: 1, title: '第一步（本周内）：定位清晰度',          exec: '彻底想清楚你的细分赛道、产品定位和产品链条。用纸笔写下来，越详细越好。这是你所有后续工作的基础。' },
    { num: 2, title: '第二步（1周内）：账号包装',           exec: '按照我上面说的，拍好头像，想好昵称，写出垂直简介。这是你IP的门面，没门面谁会进来？' },
    { num: 3, title: '第三步（2周内）：内容策略规划',         exec: '围绕你的定位，分别规划至少3-5条流量型内容选题、3-5条价值型内容选题。先想好主题和大概的表达方式，不用立刻拍。' },
    { num: 4, title: '第四步（3周内）：流量型内容制作与发布', exec: '制作并发布第一批2-3条流量型内容。重点是破行业流量层级，把精准人群勾进来。' },
    { num: 5, title: '第五步（4周内）：价值型内容制作与发布', exec: '制作并发布第一批2-3条价值型内容。重点是展现专业度，建立信任。' },
  ],
  weeklyTasks: [
    { heading: '明确细分赛道：', body: '锁定你的"定制智能体"和"OPC培训"具体服务哪类企业，解决什么核心问题。用一句话总结你的核心价值。' },
    { heading: '设计账号包装：', body: '拍一张专业又亲和的头像，想一个"小名/外号+行业"的昵称，并写出你的账号简介（我是谁+解决什么问题+提供什么价值）。' },
    { heading: '挖掘流量选题：', body: '针对你的细分赛道，至少想出3个"行业猎奇/奇葩/冷知识"的选题，能引发目标客户好奇心和兴趣的。' },
    { heading: '录制一条测试视频：', body: '不用发，就用手机录一段你对着镜头说话的视频，主题可以是随便一个你行业的冷知识。目的是练习口语化、有情绪的表达，避免念稿。' },
  ],
  closingNote: '记住，老铁，IP孵化变现不是玩虚的，每一步都要实打实地干。从0到1是最难的，但只要你按照这个路子走，坚持下去，变现只是时间问题。别光想，赶紧动起来！',
  actionPlans: [
    { num: 1, title: '明确细分赛道、产品定位和产品链条，形成书面文档。', dimension: '定位清晰度', deadline: '本周内' },
    { num: 2, title: '完成账号头像拍摄（生活化）、昵称设计（小名/外号+行业）和垂直简介撰写（我是谁+解决什么问题+提供什么价值）。', dimension: '账号包装', deadline: '1周内' },
    { num: 3, title: '规划至少3-5条流量型内容选题（行业猎奇/奇葩/冷知识）和3-5条价值型内容选题（干货/痛点解决方案）。', dimension: '流量型内容 & 价值型内容', deadline: '2周内' },
    { num: 4, title: '制作并发布首批2-3条流量型内容，重点测试用户反馈和播放效果。', dimension: '流量型内容', deadline: '3周内' },
    { num: 5, title: '制作并发布首批2-3条价值型内容，开始建立专业度和信任感。', dimension: '价值型内容', deadline: '4周内' },
  ],
};

// Report 页固定 H2 + 段落
export const REPORT_HEADING_PRIORITY = '优先级排序及行动计划' as const;
export const REPORT_HEADING_WEEKLY   = '本周立即行动任务清单' as const;
export const REPORT_HEADING_ACTION_PLAN = '行动计划' as const;
export const REPORT_HEADING_CORE_ISSUES = '核心问题' as const;
export const REPORT_HEADING_DETAILED    = '详细诊断报告' as const;
export const REPORT_LABEL_SCORE_TOTAL   = 'IP健康度总分' as const;
export const REPORT_LABEL_DIMENSION_PREFIX = '维度：' as const;
export const REPORT_LABEL_DEADLINE_PREFIX  = '期限：' as const;
export const REPORT_LABEL_EXEC_PREFIX      = '具体执行：' as const;
export const REPORT_LABEL_STATUS_PREFIX    = '现状：' as const;
export const REPORT_LABEL_PROBLEM_PREFIX   = '问题在哪：' as const;
export const REPORT_LABEL_SOLUTION_PREFIX  = '具体怎么改：' as const;
```

#### 5.1.8 已有的不动

- `DiagnosisDimension` interface · 保留 · 不改 schema
- `DIAGNOSIS_DIMENSIONS_8` 8 维度数据 · 保留 · `id` / `label` / `subtitle` / `checkboxes` 都跟 sally 1:1
- `REPORT_DIMENSIONS_7` · 保留 · 后续 report 仍按 id slice
- `REPORT_SUGGESTIONS` · 保留(老 stub · backend fallback 用)

---

## §6 · sub-component 设计

### 6.1 新建组件清单(`apps/web/src/components/diagnosis/`)

| 文件 | 用途 | 行数估 |
|---|---|:-:|
| `DiagnosisChip.tsx` | IP健康度诊断 chip(Stethoscope icon + 字 · 复用 form/report) | ~20 |
| `DiagnosisProgressBar.tsx` | 8 段 progress bar(currentStep 高亮) | ~25 |
| `DimensionIconBlock.tsx` | step 2-8 icon block(lucide icon 按 dim.id 映射 + label + subtitle) | ~50 |
| `IPHealthScoreCard.tsx` | report 左 · 总分 + 7 bar list | ~50 |
| `IPRadarChart.tsx` | report 右 · 7 角雷达 SVG | ~80 |
| `CoreIssuesCard.tsx` | report · 核心问题红框 | ~25 |
| `DetailedReportSection.tsx` | report · 详细诊断长文 + 5 维度块 | ~60 |
| `DimensionDetailBlock.tsx` | 单维度详(现状/问题/具体怎么改) | ~50 |
| `PriorityPlanSection.tsx` | report · 优先级 5 步 | ~30 |
| `WeeklyTasksSection.tsx` | report · 本周任务 4 + 寄语 | ~30 |
| `ActionPlanCardsSection.tsx` | report · 行动计划 5 cards | ~50 |
| `ActionPlanCard.tsx` | 单 action plan card(序号 + title + 维度 + 期限) | ~25 |
| `ReportFooterActions.tsx` | report · 底部 3 button | ~30 |

### 6.2 修改组件

- `DiagnosisStepCard.tsx` · 大改 ·
  - 删 `text-label-sm text-primary uppercase tracking-wide` step header(改为灰小字 `步骤 {N}/{total} · {label}`)
  - Step1 改 2x2 grid(从 vertical 改) + 删现有 stage option uppercase + 加每选项 desc 行
  - Step1 label 改 `你的行业` / `你的产品/服务` / `你目前的阶段`
  - Step1 input placeholder 删(空)
  - Step 2-8 加 `DimensionIconBlock`(在 dimension header 下)
  - ✕/✓ icon row 改用 lucide `CircleX` / `CheckCircle2`
  - textarea placeholder 改 `DIAGNOSIS_DIMENSION_PLACEHOLDERS[dimension.id]`
  - 下一步 button · isLast 时加 `Stethoscope` icon

---

## §7 · page 重写

### 7.1 `apps/web/src/pages/modules/Diagnosis.tsx` · 大改

保留 ·
- `DiagnosisProgress` interface + `getInitialProgress`
- `accountId` + lsKey localStorage 持久化
- `handlePrev` / `handleNext` / `handleRestartDiagnosis`
- `trpc.diagnosis.generate.useMutation`(保留 · 但 force mock-first)
- loading state(Loader2 + 'AI 分析中...')

新增 ·
- 全局 form header(chip + H1 + subtitle + progress bar)抽到 `<DiagnosisHeader>` 子组件 · form/report 共用
- report 默认 render `DIAGNOSIS_MOCK_REPORT`(force mock 跟 step5/7 同模式)·
  - 进入 report state 条件:`progress.currentStep === TOTAL_STEPS`(到了第 9 个 stepIndex · 即按了第 8 step 的"生成诊断报告"按钮)· 通过 setProgress 添加 isComplete flag 或直接判断
  - 简化:用一个 `isReportView` state · `handleNext` 在 step 8 时 setIsReportView(true)
- report 内布局 ·
  ```tsx
  <main>
    <DiagnosisHeader currentStep={8} totalSteps={8} />
    <section>
      <div grid 2 col>
        <IPHealthScoreCard scores={MOCK.dimensionScores} overallScore={MOCK.overallScore} />
        <IPRadarChart scores={MOCK.dimensionScores} />
      </div>
      <CoreIssuesCard issues={MOCK.coreIssues} />
      <DetailedReportSection intro={MOCK.intro} reportH2={MOCK.reportH2} verdictLead={MOCK.overallVerdictLead} verdictBody={MOCK.overallVerdictBody} details={MOCK.details} />
      <PriorityPlanSection intro={MOCK.priorityIntro} steps={MOCK.prioritySteps} />
      <WeeklyTasksSection tasks={MOCK.weeklyTasks} closing={MOCK.closingNote} />
      <ActionPlanCardsSection plans={MOCK.actionPlans} />
      <ReportFooterActions onRestart={handleRestartDiagnosis} />
    </section>
  </main>
  ```

删除 ·
- 旧 report block(line 204-323 整段)· 替换为 7 sub-section
- 旧 export PDF button(`导出诊断报告 PDF`)· sally 真实无此 button

---

## §8 · 文件清单

| 文件 | 操作 | 行数估 |
|---|:-:|:-:|
| `lib/constants/diagnosis.ts` | **大改**(对齐字面 + 新增 8 组常量 + 1 大 MOCK_REPORT) | +~280 |
| `components/diagnosis/DiagnosisStepCard.tsx` | **大改**(progress bar + chip + icon block + Step1 2x2 + ✕icon + placeholder) | +~80 / -~40 |
| `components/diagnosis/DiagnosisChip.tsx` | **新建** | ~20 |
| `components/diagnosis/DiagnosisProgressBar.tsx` | **新建** | ~25 |
| `components/diagnosis/DiagnosisHeader.tsx` | **新建**(组合 chip + H1 + subtitle + progress) | ~30 |
| `components/diagnosis/DimensionIconBlock.tsx` | **新建** | ~50 |
| `components/diagnosis/IPHealthScoreCard.tsx` | **新建** | ~50 |
| `components/diagnosis/IPRadarChart.tsx` | **新建** | ~80 |
| `components/diagnosis/CoreIssuesCard.tsx` | **新建** | ~25 |
| `components/diagnosis/DetailedReportSection.tsx` | **新建** | ~60 |
| `components/diagnosis/DimensionDetailBlock.tsx` | **新建** | ~50 |
| `components/diagnosis/PriorityPlanSection.tsx` | **新建** | ~30 |
| `components/diagnosis/WeeklyTasksSection.tsx` | **新建** | ~30 |
| `components/diagnosis/ActionPlanCardsSection.tsx` | **新建** | ~30 |
| `components/diagnosis/ActionPlanCard.tsx` | **新建** | ~30 |
| `components/diagnosis/ReportFooterActions.tsx` | **新建** | ~30 |
| `pages/modules/Diagnosis.tsx` | **重组**(抽 header · 替 report) | -~120 / +~80 |
| `pages/modules/__tests__/Diagnosis.test.tsx` | **改**(对齐新字面 + 新组件) | ~50 |
| `pages/__tests__/Diagnosis.test.tsx` | 检查是否 dup · 可能删 | — |
| `lib/constants/__tests__/diagnosis.test.ts` | **改**(对齐新字面 const) | ~30 |
| `components/diagnosis/__tests__/DiagnosisStepCard.test.tsx` | **改**(对齐新字面) | ~40 |

**不动** · `apps/api/src/router/diagnosis.ts` backend 保留(PRR 评估) · `useActiveAccount` / `localStorage` 持久化 / `FadeInWrapper`

---

## §9 · 验收(5 维度)

### D1 · 字面(必过)

- innerText grep · 启 dev + playwright · 必 100% 命中以下集合:

**form 部分(step 1 default)**:
- `IP健康度诊断` 1+ 次
- `7维度IP诊断报告` 1+ 次
- `像老师一样诊断你的IP，找出问题，给出具体可执行的改进方案` 1+ 次
- `步骤 1/8 · 基本信息` 1 次
- `你的行业` / `你的产品/服务` / `你目前的阶段` 各 1 次
- 4 stage label(起步期/成长期/爆发期/瓶颈期)+ 4 desc 各 1 次

**report 部分**(切换到 report 视图后):
- `IP健康度总分` 1 次
- 7 shortLabel(定位清晰/账号包装/流量型内/价值型内/案例型内/人设型内/内容状态)各 1 次
- `核心问题` 1 次 + 4 coreIssues 各 1 次
- `详细诊断报告` 1 次 + `IP诊断报告` 1 次 + intro 长文 + `整体评价：` + verdictBody
- 5 维度详细块 H3(`1. 定位清晰度 (0分)` 等)各 1 次 · 现状/问题在哪/具体怎么改 prefix 各 5 次
- `优先级排序及行动计划` 1 次 + 5 priority title 各 1 次 + 5 exec 各 1 次
- `本周立即行动任务清单` 1 次 + 4 weekly heading 各 1 次 + closingNote 1 次
- `行动计划` 1 次 + 5 actionPlans title 各 1 次 + 5 dimension/deadline 各 1 次
- `重新诊断` / `诊断历史` / `查看今日任务` 各 1 次
- 字面命中率 ≥ 99%

### D2 · 视觉

- chip 圆角金边 + 听诊器 icon 金
- 大标题 text-4xl 白 bold · 居中
- 8 段 progress bar · 当前及之前段亮金 · 其他段灰
- icon block · 深 bg 圆角 + 7 不同 icon
- Step1 4 cards · 2x2 grid · 起步期默认选中(per 截图 1)
- ✕/✓ row · 圈 icon + 文字
- 总分 card 左 + 雷达 card 右 · md:grid-cols-2
- 雷达 7 角 polygon SVG · 中心蓝绿点
- 核心问题 card · 红边框 + 红 ✕ icon + 4 bullet
- 5 维度详细块 · 现状/问题在哪/具体怎么改 bold prefix
- 行动计划 5 cards · 序号金圆 + 维度灰 + 期限金
- 底部 3 button · 居中

### D3 · 交互

- step 1-7 next button · 推进 currentStep + 1
- step 8 next button(`生成诊断报告`)· 切换到 report 视图(直接 mock 渲染 · 不调 API · 跳过 loading state · 或者保留 loading 2s 模拟)
- form 字段填写 · localStorage 持久化(D-227 已有)· 不破坏
- 报告 `重新诊断` · 清 progress + 回 step 1
- 报告 `诊断历史` · toast `诊断历史 · PRD-30+`
- 报告 `查看今日任务` · navigate `/daily-tasks`

### D4 · 状态

- form `currentStep` 0-7 索引(对应 step 1-8)
- `selectedAnswers` / `notesPerStep` / `industry` / `product` / `stage` 持久化(localStorage)
- `isReportView` boolean state(新增)· true 时 render report
- mock report · 静态常量 · 不 fetch

### D5 · 边界

- 不动 backend trpc(保留 · PRR 评估)
- mock-first 默认渲染(同 step5/7/8 已成功模式)· 即使 backend 挂掉也能 demo

### D6 · typecheck + test

- `pnpm typecheck` 全绿
- `pnpm --filter @quanan/web test Diagnosis` 全绿(老 test 改字面 + 新组件覆盖)

---

## §10 · Sonnet 流程(6 步)

1. **改 constants**(`lib/constants/diagnosis.ts`)·
   - 字面对齐 H1 / SUBTITLE / NOTES_PLACEHOLDER(中文标点全角)
   - DIAGNOSIS_STAGES_4 加 desc 字段
   - 新增 8 组常量(`DIAGNOSIS_CHIP_LABEL` / `DIAGNOSIS_STEP1_LABELS` / `DIAGNOSIS_DIMENSION_PLACEHOLDERS` / `DIAGNOSIS_BUTTONS` / `REPORT_HEADING_*` / `REPORT_LABEL_*` / `DIAGNOSIS_MOCK_REPORT`(超长 · ~250 行) / 4 个 interface)
   - 字面**严格按 SPEC §5.1 + §4 字面源**逐字 copy · 中文标点全角 · 双引号用 `"` `"` 全角

2. **新建 14 子组件**(SPEC §6.1 清单 · 全部在 `apps/web/src/components/diagnosis/`)·
   - 5 form 子组件 · `DiagnosisChip` / `DiagnosisProgressBar` / `DiagnosisHeader` / `DimensionIconBlock`
   - 9 report 子组件 · `IPHealthScoreCard` / `IPRadarChart` / `CoreIssuesCard` / `DetailedReportSection` / `DimensionDetailBlock` / `PriorityPlanSection` / `WeeklyTasksSection` / `ActionPlanCardsSection` / `ActionPlanCard` / `ReportFooterActions`
   - 严守 ·
     - icon 全用 lucide-react(无 emoji)· 按 SPEC §2.1 映射
     - 字面全从 constants(`MOCK.coreIssues[i]` / `MOCK.details[i]` 等)· 不 hardcode
     - 雷达图 7 角 SVG 自绘(无第三方库 · 简单 polygon)
     - data-testid 加在 root · 命名 `kebab-case`

3. **改 DiagnosisStepCard**(按 SPEC §6.2)·
   - step header 灰小字(删 uppercase 紫色)
   - Step1 改 2x2 grid + label 改 + placeholder 删 + 加 stage desc 行
   - Step 2-8 加 `<DimensionIconBlock dimensionId={dim.id} label={dim.label} subtitle={dim.subtitle} />`
   - ✕/✓ icon 改 lucide `CircleX` / `CheckCircle2`
   - textarea placeholder `DIAGNOSIS_DIMENSION_PLACEHOLDERS[dim.id] || ''`
   - next button isLast 加 `Stethoscope` icon

4. **改 Diagnosis.tsx**(按 SPEC §7.1)·
   - 抽 header 到 `<DiagnosisHeader currentStep={...} totalSteps={...} />`
   - 加 `isReportView` state · step 8 next 触发 `setIsReportView(true)` 即可(skip API 调用 · 或保留 trpc mutation 调用但 default render mock)
   - report 视图 · 替换为 7 sub-section(SPEC §4)
   - `handleRestartDiagnosis` · 加 `setIsReportView(false)`
   - 底部按钮 onClick 接 navigate / toast

5. **改 test 文件** ·
   - `lib/constants/__tests__/diagnosis.test.ts` · 改老 H1/SUBTITLE 断言 · 加新常量断言
   - `pages/modules/__tests__/Diagnosis.test.tsx` · 改字面 + 加 report 视图 case(切换后断言 IP健康度总分 / 核心问题 等)
   - `components/diagnosis/__tests__/DiagnosisStepCard.test.tsx` · 改字面对齐

6. **跑** ·
   - `pnpm typecheck` 全绿
   - `pnpm --filter @quanan/web test Diagnosis` 全绿
   - 失败 retry 修到绿(最多 3 次)
   - 报告状态

---

## §11 · 红线(违反 = reject)

1. ❌ 不允许 hardcode 任何字面(必走 `DIAGNOSIS_*` 常量 + `DIAGNOSIS_MOCK_REPORT.*` 字段)
2. ❌ 不允许中文标点变半角 · 全角 `，` `。` `（）` `：` `"` `"` 必严守(尤其 `补充说明（选填，越详细诊断越准）`)
3. ❌ 不允许用 emoji · 全用 lucide-react icon
4. ❌ 不允许动 `DIAGNOSIS_DIMENSIONS_8` 现有 7 维度的 label/subtitle/checkboxes(已 1:1 sally)
5. ❌ 不允许加 sally 截图未出现的内容(如老版 "导出诊断报告 PDF" / "AI 暂未生成深度分析" banner 都删)
6. ❌ 不允许保留 H1 / SUBTITLE 的旧空格版本
7. ❌ 不允许 Step1 stage option label 含 `·` 分隔符(应拆 `label` + `desc` 两个字段两行渲染)
8. ❌ 不允许在 page 文件直接 map cards / 子段 · 必须抽 sub-component(SPEC §6)
9. ❌ 不允许动 backend router · 不允许动 trpc schema · 不允许动 schema package
10. ❌ 不允许给 `MOCK_REPORT` 加 sally 截图未展示的字段(如 6/7 维度详细块 · 只 render 5)
11. ❌ 不允许 hardcode "PRD-25+" / "PRD-30+" 等内部 PRD 引用到 UI(用 toast `诊断历史 · 即将上线` 类通用文案)

---

## §12 · 报告(Sonnet 干完回填)

```yaml
status: <pending|done|blocked>
files_changed:
  - <path> · +N / -N
typecheck: <pass|fail>
test_run: <pass|fail> · <N passed / N failed>
notes: <异常 / 偏离 / 决策>
```
