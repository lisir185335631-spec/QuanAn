/**
 * QuanAn · 67 文案实战案例 — PRD-9 US-002
 * CopywritingAgent few-shot · 按 scriptType + industry 检索相似案例
 * metadata: { scriptType, industry }
 */

export interface KnowledgeCase {
  key: string;
  title: string;
  /** 案例正文 · 会作为 embedding content */
  content: string;
  scriptType: string;
  industry: string;
  elements: readonly string[];
  viralPotential: 'high' | 'medium' | 'low';
}

export const KNOWLEDGE_CASES: readonly KnowledgeCase[] = [
  // ── 聊观点 opinion (5) ───────────────────────────────────────────────────────
  {
    key: 'opinion_beauty_01',
    title: '护肤品成分党的底层逻辑',
    scriptType: 'opinion',
    industry: 'cosmetics',
    elements: ['curiosity', 'contrast', 'authority'],
    viralPotential: 'high',
    content:
      '开头：大家都在说成分党，但90%的人买护肤品还是在买智商税。\n核心观点：有效成分只有3类——维A酸/烟酰胺/防晒剂。其余99%成分是载体，作用是"让这3类能进皮肤"。\n反转：花3000块买含玻尿酸的面霜，不如30块的"成分炸弹"精华。\n行动：下次买护肤品先看有没有这3个成分，没有直接跳过。',
  },
  {
    key: 'opinion_fitness_01',
    title: '健身3年告诉你最浪费时间的动作',
    scriptType: 'opinion',
    industry: 'fitness',
    elements: ['worst', 'contrast', 'authority'],
    viralPotential: 'high',
    content:
      '开头：健身3年我踩过最大的坑，就是把时间全花在这5个动作上。\n论点：蝴蝶机/坐姿腿举/史密斯机深蹲/绳索夹胸——所有固定器械都是浪费时间。\n理由：固定轨迹=稳定肌不参与=神经激活率低=增肌效率减半。\n结论：自由重量深蹲+硬拉，每周各练3组，比上述4个动作效果翻倍。\n互动：你还在用固定器械吗，评论区聊聊。',
  },
  {
    key: 'opinion_finance_01',
    title: '为什么月薪5000的人比月薪50000的人存款还多',
    scriptType: 'opinion',
    industry: 'ecommerce',
    elements: ['contrast', 'resonance', 'curiosity'],
    viralPotential: 'high',
    content:
      '核心观点：存款多不是因为收入高，是因为"消费决策成本"低。\n案例：月薪5000的A，每次消费都要想3天，买的全是需要的。月薪50000的B，消费决策快，买了才发现不需要。\n数据：收入提高10倍，消费欲望提高15倍（凡勃伦效应）。\n方法：建立"72小时规则"——非必要消费等72小时再决定，冲动消费减少70%。',
  },
  {
    key: 'opinion_food_01',
    title: '外卖吃了10年，我发现了一个让人上瘾的秘密',
    scriptType: 'opinion',
    industry: 'food',
    elements: ['curiosity', 'reveal', 'contrast'],
    viralPotential: 'medium',
    content:
      '开头：外卖为什么越吃越想吃？不是饿，是瘾。\n内幕：外卖重油重盐的背后是食品科学——高糖+高脂+高盐同时出现，触发多巴胺峰值，比任何一样单独出现强5倍。\n数据：外卖钠含量平均是家常菜3倍，味精含量8倍。\n建议：每周外卖不超过2次，点外卖时优先选清单菜单（食材可见）。\n互动：你每周点几次外卖？',
  },
  {
    key: 'opinion_psychology_01',
    title: '所有沟通问题，根源只有一个',
    scriptType: 'opinion',
    industry: 'psychology',
    elements: ['resonance', 'curiosity', 'reveal'],
    viralPotential: 'high',
    content:
      '观点：所有沟通问题的根源，是你以为对方的认知地图和你一样。\n解释：认知地图=一个人对世界的理解框架，由童年经历/教育/文化决定，两个人的认知地图从来不一样。\n案例：你说"早点回家"=8点前。对方理解=12点前。没有谁对谁错，是地图不同。\n方法：沟通前先确认定义——"你说的早点是几点？"。一句话减少70%误解。',
  },

  // ── 晒过程 process (4) ───────────────────────────────────────────────────────
  {
    key: 'process_beauty_01',
    title: '我的全套护肤流程（干性敏感肌适用）',
    scriptType: 'process',
    industry: 'beauty',
    elements: ['resonance', 'list', 'authority'],
    viralPotential: 'high',
    content:
      '全程展示：洁面→化妆水→精华→面霜，每步停留15秒。\n关键说明：洁面不超过30秒，水温不超过35度（超过破坏皮脂膜）。化妆水用拍打法而非涂抹法（吸收率提升40%）。\n产品选择原则：成分表前5位有神经酰胺或角鲨烷才是干肌首选。\n结尾：坚持这套30天，上过妆的人能看出差别。',
  },
  {
    key: 'process_food_01',
    title: '10分钟做完一周减脂餐备餐（完整过程）',
    scriptType: 'process',
    industry: 'food',
    elements: ['list', 'challenge', 'small_big'],
    viralPotential: 'high',
    content:
      '全程展示：周日下午2小时备餐5天食材。\n步骤：①鸡胸肉切块腌制（盐+黑胡椒+橄榄油）→ ②蔬菜提前焯水分装 → ③杂粮饭分装保鲜盒 → ④统一冷冻。\n数据：每餐热量控制在500大卡，蛋白质不低于35g。\n要点：腌好的鸡胸肉放冰箱冷藏最长保存3天，冷冻最长2周。\n效果：坚持4周，体脂从28%降到23%的完整数据。',
  },
  {
    key: 'process_apparel_01',
    title: '一件基础款T恤的5种穿法（镜前实拍）',
    scriptType: 'process',
    industry: 'apparel',
    elements: ['list', 'transformation', 'contrast'],
    viralPotential: 'high',
    content:
      '展示：同一件白T恤，5种穿搭全程镜前展示，每种换装20秒内完成。\n穿法：①基础款+牛仔裤 ②打结+高腰裙 ③叠穿格纹衬衫 ④塞进西裤+腰带 ⑤配针织背心外搭。\n核心技巧：基础款颜色要买"真正的白"（偏米黄不百搭），领口选圆领优先（v领对脸形要求高）。\n价格：全身穿搭不超过300元，日常通勤绰绰有余。',
  },
  {
    key: 'process_home_01',
    title: '出租屋改造全过程（0元改造版）',
    scriptType: 'process',
    industry: 'home',
    elements: ['transformation', 'small_big', 'contrast'],
    viralPotential: 'high',
    content:
      '展示：同一个出租屋改造前后对比，全程展示3小时改造过程。\n方法：①整理+丢弃（所有不用的东西立刻扔掉，空间感提升50%）→ ②重新规划区域（床+工作区+收纳区）→ ③低成本装饰（绿植+台灯+照片墙，全部加起来不超过200元）。\n核心：出租屋颜值的80%来自整洁度，而不是装修。\n效果数据：改造后焦虑感评分从8分降到4分（自测）。',
  },

  // ── 教知识 knowledge (5) ─────────────────────────────────────────────────────
  {
    key: 'knowledge_finance_01',
    title: '5分钟看懂复利是什么',
    scriptType: 'knowledge',
    industry: 'ecommerce',
    elements: ['curiosity', 'small_big', 'low_cost_high'],
    viralPotential: 'high',
    content:
      '核心知识：复利=本金×(1+利率)^年数。重点是"指数"，不是加法。\n直观感受：1万元，年化10%。20年后：1万×1.1^20=6.7万。40年后：1万×1.1^40=45万。区别不是2倍，是7倍。\n误区纠正：大多数人没体会复利的原因——前10年太慢（第1年只赚1000块），前20年才开始加速。\n行动：25岁开始，每月存1000元，年化8%，65岁有349万。30岁开始，只有186万。早5年，差163万。',
  },
  {
    key: 'knowledge_psychology_02',
    title: '认知失调是什么，为什么你明知道不对还要做',
    scriptType: 'knowledge',
    industry: 'psychology',
    elements: ['resonance', 'curiosity', 'contrast'],
    viralPotential: 'high',
    content:
      '定义：认知失调=行为和信念之间的冲突让人不舒服，于是修改信念来和行为保持一致，而不是改变行为。\n案例：明知道外卖不健康，还是每天点。大脑不会说"我要改变行为"，而会说"外卖也没那么差，偶尔吃也可以"。\n应用：了解认知失调后，你会开始捕捉自己"修改信念"的瞬间，这就是行为改变的第一步。\n练习：今天找一件你"为自己辩护"的事，问问自己：是真的没问题，还是为了让自己舒服？',
  },
  {
    key: 'knowledge_fitness_02',
    title: '增肌的4个底层原则（健身房没人教你的）',
    scriptType: 'knowledge',
    industry: 'fitness',
    elements: ['list', 'authority', 'contrast'],
    viralPotential: 'high',
    content:
      '原则1：渐进超负荷——每周比上周多1kg或多1组，停止进步的唯一方法是停止加重。\n原则2：蛋白质摄入量——每公斤体重1.6-2.2g蛋白质，低于1.6g增肌速度减半。\n原则3：睡眠>补剂——生长激素90%在深度睡眠分泌，睡5小时比睡8小时增肌速度慢40%。\n原则4：训练频次——同一肌群每周2次刺激是最优频次，1次太少，3次以上恢复不足。\n总结：掌握这4点，比"正确的动作姿势"重要10倍。',
  },
  {
    key: 'knowledge_medical_01',
    title: '体检报告你看不懂的3个指标',
    scriptType: 'knowledge',
    industry: 'medical',
    elements: ['curiosity', 'list', 'authority'],
    viralPotential: 'high',
    content:
      '指标1：空腹血糖。正常<6.1，超过7就是糖尿病，6.1-6.9是前期。大多数人不知道6.5就要开始干预（生活方式改变）。\n指标2：转氨酶(ALT)。正常<40U/L，超过3倍提示肝损伤（不一定是肝炎，可能是熬夜/喝酒/油腻饮食）。转氨酶高，先戒酒戒熬夜看1个月。\n指标3：尿酸。正常男性<420，女性<360。超标是痛风前兆，啤酒+海鲜的组合让尿酸飙升150%。\n行动：体检报告不用全看，先看这3个，发现超标立刻预约复查。',
  },
  {
    key: 'knowledge_education_01',
    title: '记忆曲线是真的，用对方法学习效率提升3倍',
    scriptType: 'knowledge',
    industry: 'ecommerce',
    elements: ['authority', 'small_big', 'list'],
    viralPotential: 'medium',
    content:
      '理论：艾宾浩斯遗忘曲线——学完24小时忘70%，1周后忘90%。但复习时间节点对了，长期保留率可达90%。\n正确复习节点：学完→1天后复习→3天后→1周后→2周后→1个月后。总共6次，每次不超过5分钟。\n工具推荐：Anki（间隔重复算法自动计算最佳复习时间，免费开源）。\n实测数据：用Anki背单词，每天15分钟，3个月掌握2000词，传统方法要6个月。',
  },

  // ── 讲故事 story (4) ────────────────────────────────────────────────────────
  {
    key: 'story_apparel_01',
    title: '从月薪3000到年薪30万，我靠这件事翻身',
    scriptType: 'story',
    industry: 'apparel',
    elements: ['resonance', 'transformation', 'empathy'],
    viralPotential: 'high',
    content:
      '情境：2019年，月薪3000，租300元群租房，每天骑共享单车上班，觉得这辈子可能就这样了。\n转折：无意中接触了形象管理，花了一个月工资去上了一节课，学会了用100元穿出1000元感觉。\n改变：工作中开始被人正眼相待，第一次参加公司重要会议，第一次代表团队去谈客户。\n结果：3年内薪资涨了10倍，不是因为变帅了，是因为形象让我变得更自信，自信改变了我的行为。\n结尾：如果你也困在月薪3000，先从整理衣橱开始。',
  },
  {
    key: 'story_food_02',
    title: '我妈的一碗面，让我想通了一件事',
    scriptType: 'story',
    industry: 'food',
    elements: ['resonance', 'empathy', 'contrast'],
    viralPotential: 'high',
    content:
      '故事：上周加班到凌晨2点到家，妈妈一直等着，说"给你下碗面"。\n细节：一碗番茄鸡蛋面，15分钟做好，她看着我吃完才去睡。\n想通了什么：我花了那么多钱吃米其林、网红店，没有一口食物比这碗面好吃。\n升华：好吃的本质不是食材，是温度。那碗面有2点的夜、等了5小时的人、和不需要说出口的"辛苦了"。\n结尾：你上次回家吃妈妈做的饭是什么时候？',
  },
  {
    key: 'story_psychology_02',
    title: '我花了30年才学会一件事：拒绝',
    scriptType: 'story',
    industry: 'psychology',
    elements: ['resonance', 'empathy', 'revelation'],
    viralPotential: 'high',
    content:
      '冲突：从小被教育"不能拒绝别人"——老师布置任务要全力完成，同事请求不好意思说不，朋友邀请不敢拒绝。\n后果：每天焦虑，感觉时间永远不够，却不知道为什么。\n转折：心理咨询时咨询师问：你上次为自己做一件事是什么时候？我答不上来。\n改变：练习"对不起，我今天有安排"——不解释，不道歉，就这9个字。\n数据：第一个月说了47次，被拒绝的人生气了3次，关系变差了0次。\n结尾：你也有"不会拒绝"的困扰吗？',
  },
  {
    key: 'story_fitness_02',
    title: '我300斤的时候，做了一件改变我一生的事',
    scriptType: 'story',
    industry: 'fitness',
    elements: ['resonance', 'contrast', 'transformation'],
    viralPotential: 'high',
    content:
      '起点：27岁，300斤，走路膝盖疼，爬1层楼喘。医生说：再不减就要糖尿病。\n决定那天：不是因为想好看，是因为跪在地上系鞋带，系了3次才站起来。\n过程：第1周跑步跑了200米就跑不动，就走。每天走，走了1个月，开始跑50米。\n不讲捷径：两年，减了130斤。中间停过10次，每次停完就继续。\n结果：现在跑半马，爬4层楼不喘，膝盖不疼了。\n结尾：不要等一个完美的时机开始，你现在的状态就是最好的开始。',
  },

  // ── 尬段子 comedy (3) ────────────────────────────────────────────────────────
  {
    key: 'comedy_daily_01',
    title: '打工人的快乐，就是周五下班前5分钟',
    scriptType: 'comedy',
    industry: 'ecommerce',
    elements: ['resonance', 'contrast', 'surprise'],
    viralPotential: 'high',
    content:
      '场景设定：周五下午4:55，办公室画风完全不一样。\n细节：键盘敲击声从每秒5下变成每秒50下（清理完积压任务）。茶水间的人多了3倍（提前社交）。有人开始穿外套（做好撤退准备）。\n高潮：5:00老板走出来"周一我们开个会……"，整个办公室集体时间静止2秒。\n反转："……好好休息，周一见"，打工人集体灵魂出窍进天堂。\n结尾：评论区打出你下班前的状态，看看有多少人一样。',
  },
  {
    key: 'comedy_food_02',
    title: '你点外卖的时候，脑子里到底在想什么',
    scriptType: 'comedy',
    industry: 'food',
    elements: ['resonance', 'surprise', 'contrast'],
    viralPotential: 'high',
    content:
      '第1分钟：打开外卖App，今天吃什么。\n第2分钟：麻辣烫？昨天吃过了。沙拉？哎，健康饮食。\n第3分钟：刷到一个黄焖鸡，不不不太油了。\n第7分钟：还是刷到最开始那个店……算了，还是麻辣烫。\n结尾：中国人点外卖平均决策时间是8.7分钟（这是我编的但你信了对吗）。\n互动：你点外卖平均要选多久？',
  },
  {
    key: 'comedy_apparel_02',
    title: '有件事我一直很好奇，你是怎么选不出衣服穿的',
    scriptType: 'comedy',
    industry: 'apparel',
    elements: ['resonance', 'contrast', 'anger'],
    viralPotential: 'medium',
    content:
      '画面：衣柜满到关不上，早上站在衣柜前20分钟，结论：没有衣服可穿。\n分析：这不是"没有衣服"，这是"衣柜里全是后悔"。每件衣服都有对应的故事——那件是冲动购买，这件买了才发现不适合，那件买来就没穿过。\n理论：平均女性只穿衣柜里20%的衣服，剩下80%叫"也许有一天能穿"。\n解决方案：整理衣柜时，把超过1年没穿的全扔了，剩下的才是你真正的风格。\n结尾：你衣柜里有没有3年没穿过的衣服？',
  },

  // ── 说产品 product (4) ───────────────────────────────────────────────────────
  {
    key: 'product_cosmetics_01',
    title: '防晒霜选对了，你的护肤步骤少一半',
    scriptType: 'product',
    industry: 'cosmetics',
    elements: ['benefit', 'contrast', 'authority'],
    viralPotential: 'high',
    content:
      '痛点引入：防晒选错了，后面的护肤品全白费——紫外线直接破坏胶原蛋白，维A酸失效，美白成分失效。\n产品分析：化学防晒（轻薄不泛白，但有刺激性成分）vs物理防晒（温和无刺激，但泛白闷热）。敏感肌选物理，混油肌选化学。\n核心参数：SPF≥30日常够用，户外需SPF50+。PA++++对应UVA保护，别只看SPF。\n推荐标准：成分表前5位有氧化锌/二氧化钛（物理），或阿伏苯宗/甲氧基肉桂酸辛酯（化学），再看肤感。',
  },
  {
    key: 'product_supplement_01',
    title: '健身补剂你真的需要的只有这3样',
    scriptType: 'product',
    industry: 'supplement',
    elements: ['list', 'contrast', 'authority'],
    viralPotential: 'high',
    content:
      '直接说结论：99%的健身补剂都是智商税，真正有科学证据的只有3样。\n1. 蛋白粉：每公斤体重摄入1.8g蛋白质，食物不够时补充。普通浓缩乳清足够，不需要水解蛋白（贵3倍效果差不多）。\n2. 肌酸：唯一被证明直接增加力量输出的补剂，单水肌酸每天5g，3周见效，价格极低。\n3. 维生素D：90%城市人缺乏，睾酮水平低通常第一原因就是维D不足，每天2000IU足够。\n结语：这3样加起来每月200元，效果超过任何"增肌粉""黑科技"。',
  },
  {
    key: 'product_home_appliance_01',
    title: '空气炸锅买了3年，我终于知道该买哪个了',
    scriptType: 'product',
    industry: 'home_appliance',
    elements: ['authority', 'contrast', 'list'],
    viralPotential: 'medium',
    content:
      '踩坑总结：用过5个空气炸锅，买贵的不如买对的。\n选购核心参数：①容量4-6L最实用（1-2人3L够，家庭6L），②温度范围80-200度（低温做酸奶高温做鸡翅），③热风循环均匀度（判断方式：放一张纸在中间，开最高温1分钟，纸变色越均匀越好）。\n不值得买的功能：液晶屏（旋钮更耐用）、联网功能（基本没人用）、烤箱组合款（两个都不好用）。\n价格段：200-400元的性价比最高，600元以上边际效益递减。',
  },
  {
    key: 'product_books_01',
    title: '这5本书让我的年收入翻了3倍',
    scriptType: 'product',
    industry: 'books',
    elements: ['authority', 'small_big', 'benefit'],
    viralPotential: 'high',
    content:
      '序：不是读书就能涨收入，是这5本书提供了涨收入必须的底层框架。\n书单：①《思考快与慢》(理解决策偏差，避免冲动决策) ②《影响力》(理解说服原理，谈判必读) ③《金字塔原理》(结构化表达，汇报工作效率×3) ④《哈佛商业评论精粹》(管理思维入门) ⑤《刻意练习》(理解技能习得，学任何东西都用这个框架)。\n结语：这5本书加起来不到200元，但都需要反复读3遍以上才有效。买了不读等于没买，读了不用等于没读。',
  },

  // ── 测评 review (3) ──────────────────────────────────────────────────────────
  {
    key: 'review_cosmetics_01',
    title: '买了50款面膜，终于找到干皮最佳性价比',
    scriptType: 'review',
    industry: 'cosmetics',
    elements: ['authority', 'list', 'contrast'],
    viralPotential: 'high',
    content:
      '测评维度：①成分（有没有功效成分）②精华液量（判断性价比的核心）③敷完24小时肤感④价格。\n测评结论：100元以下最佳：XXX品牌3元/片（精华液足，神经酰胺+玻尿酸）。100-200元区间：YYYY（日本进口原液，上脸不油腻）。300元以上：完全没必要，成本<50元。\n结论：面膜的溢价90%在包装和营销，精华液量少于12ml的面膜都是智商税（一摊开就蒸发了）。\n数据：每周敷2次面膜的合理预算是每月100-150元，超过这个都是情绪消费。',
  },
  {
    key: 'review_fitness_02',
    title: '4款健身App对比测评，我只推荐这一个',
    scriptType: 'review',
    industry: 'fitness',
    elements: ['authority', 'contrast', 'list'],
    viralPotential: 'medium',
    content:
      '测评标准：①课程质量（有无教练真人讲解动作）②课程分类（适合各阶段）③广告频率④价格。\n测评结论：Keep(评分7/10)：课程丰富但付费内容多，广告频繁，适合入门用免费课。帕梅拉(油管→B站)(评分9/10)：真正高质量健身视频，完全免费，动作讲解详细。Nike Training(评分8/10)：免费课程全，风格多样，无广告，无中文。超级猩猩(评分9/10)：线下课最佳，教练质量高，但价格贵（70-120元/课）。\n最终推荐：在家练用帕梅拉，线下练优先超级猩猩。',
  },
  {
    key: 'review_home_02',
    title: '10款懒人神器测评，5个我当场扔了',
    scriptType: 'review',
    industry: 'home',
    elements: ['contrast', 'list', 'curiosity'],
    viralPotential: 'high',
    content:
      '被扔掉的5个（附原因）：①自动叠衣机（叠完的衣服比手叠还皱）②榨汁机（清洗时间>榨汁时间）③扫地机器人(低端款)(漏扫30%，撞角落声音吵）④自动喂猫机（猫不认）⑤可折叠晾衣架（折叠机构用了2次就坏）。\n真香神器5个：①手持蒸汽熨斗 ②抽真空压缩袋 ③一次性马桶刷 ④挂钩粘胶 ⑤壁挂收纳盒。\n结语：懒人神器好不好用，看的是"比不用这个节省多少时间"，不是功能多少。',
  },

  // ── 揭秘 expose (3) ──────────────────────────────────────────────────────────
  {
    key: 'expose_food_01',
    title: '网红餐厅的爆款菜，成本到底是多少',
    scriptType: 'expose',
    industry: 'food',
    elements: ['reveal', 'curiosity', 'contrast'],
    viralPotential: 'high',
    content:
      '揭秘目标：某网红餐厅招牌菜，售价128元/份。\n成本拆解：主食材（牛肉300g）=42元。配料+调料=8元。包装=3元。人工分摊=10元。租金水电分摊=20元。合计成本=83元。利润=45元，利润率35%。\n看起来贵？实际：网红餐厅营销费用=15-30元/每个到店顾客（大众点评/小红书推广），这部分没计入成本。\n结论：网红餐厅比普通餐厅贵30%是合理的，贵50%以上就是品牌溢价了。\n互动：你愿意为品牌溢价多付多少钱？',
  },
  {
    key: 'expose_cosmetics_02',
    title: '护肤品成分表里的猫腻',
    scriptType: 'expose',
    industry: 'cosmetics',
    elements: ['reveal', 'curiosity', 'authority'],
    viralPotential: 'high',
    content:
      '成分表规则：国内化妆品成分按添加量从高到低排列（≥1%的成分按量排，<1%的可任意排）。\n常见猫腻1：把明星成分排前面（实际添加量可能<1%，在"允许任意排"范围内）。\n常见猫腻2："无酒精"产品含"变性酒精"（法规允许不标注）。\n常见猫腻3：成分表倒数第5位是防腐剂（越靠后防腐剂含量越低才是诚意）。\n实操建议：打开化妆品成分查询App（美丽修行/InCI Decoder），看任何产品成分都不超过1分钟。',
  },
  {
    key: 'expose_supplement_02',
    title: '健身补剂里的那些坑（现役运动员告诉你）',
    scriptType: 'expose',
    industry: 'supplement',
    elements: ['reveal', 'authority', 'contrast'],
    viralPotential: 'high',
    content:
      '坑1：合成代谢类补剂（DHEA/雄烯二酮）：被包装成"天然植物提取"，实际上是激素前体，长期使用会抑制内分泌轴。\n坑2：含咖啡因的"爆炸前"：靠咖啡因+beta丙氨酸的刺痒感制造"效果"，实际对训练的促进作用=1杯咖啡。\n坑3：支链氨基酸(BCAA)：只要蛋白质摄入足够，单独买BCAA完全多余——蛋白质里本来就有。\n结论：补剂市场的门槛极低，没有监管标准的"效果声称"。认准：有第三方检测认证（NSF/Informed Sport）的品牌。',
  },

  // ── 挑战 challenge (3) ───────────────────────────────────────────────────────
  {
    key: 'challenge_fitness_01',
    title: '30天每天100个深蹲挑战结果',
    scriptType: 'challenge',
    industry: 'fitness',
    elements: ['challenge', 'transformation', 'curiosity'],
    viralPotential: 'high',
    content:
      '挑战规则：连续30天，每天100个深蹲（可分组，不可中断挑战）。\n过程记录：第1天=30分钟完成，腿酸。第7天=20分钟完成，开始适应。第14天=15分钟，姿势变标准了。第30天=10分钟完成，重量感觉轻了。\n数据变化：体重-1.2kg，臀围-3cm，大腿围-1.5cm，深蹲最大重量+15kg。\n意外收获：习惯运动后，外卖减少了50%（因为不想吃了糟蹋这些运动成果）。\n结论：每天100个深蹲不够"增肌"，但够建立运动习惯。习惯是起点。',
  },
  {
    key: 'challenge_food_02',
    title: '30天不点外卖挑战，我省了多少钱',
    scriptType: 'challenge',
    industry: 'food',
    elements: ['challenge', 'small_big', 'curiosity'],
    viralPotential: 'high',
    content:
      '背景：2024年前每月外卖消费=2100元，30天挑战不点一次外卖。\n过程：第1周：最难，总想打开App。第2周：发现做饭比想象简单（30分钟做完一顿）。第3周：开始享受做饭过程。第4周：甚至嫌外卖味道太重了。\n数据：食材花费=680元。外卖省了=1420元。体重变化=-2.1kg（外卖减少后被动减重）。\n意外发现：做饭后睡眠质量变好了（减少外卖=减少刺激性调料摄入）。\n结论：30天后，我养成了每周至少做4天饭的习惯。',
  },
  {
    key: 'challenge_apparel_02',
    title: '30天只穿10件衣服挑战（胶囊衣橱实测）',
    scriptType: 'challenge',
    industry: 'apparel',
    elements: ['challenge', 'small_big', 'transformation'],
    viralPotential: 'medium',
    content:
      '规则：从衣橱选10件基础款，30天不买新衣服，完全靠这10件穿出变化。\n衣物清单：白T×2，黑T×1，白衬衫×1，基础款连衣裙×1，牛仔裤×1，卡其裤×1，运动裤×1，黑西装×1，简约外套×1。\n每天穿法记录：第1周用尽了所有显而易见的组合。第2周开始发掘叠穿、配件（丝巾/腰带/帽子）。第3周，朋友问我是不是换了造型师。\n结论：时尚不是衣服多，是组合能力强。10件衣服完全够活，如果你买对了。',
  },

  // ── 采访 interview (3) ───────────────────────────────────────────────────────
  {
    key: 'interview_local_01',
    title: '采访街边坚持了20年的包子铺老板',
    scriptType: 'interview',
    industry: 'food',
    elements: ['resonance', 'authority', 'empathy'],
    viralPotential: 'high',
    content:
      '采访设置：凌晨3点进店，老板已经开始发面。\n关键问答：\nQ：做了20年，有没有想过换个行当？\nA："想过，每次看到有人因为我这一口包子吃饱了去上班，又不想换了。"\nQ：最难熬的时候是什么时候？\nA："2020年，店关了3个月。钱存款花完了，但房东没涨租，说先挺过去再说。"\nQ：有没有被人坑过？\nA："太多了，但第二天还得开门，不然谁给那些早起上班的人做早饭？"\n结尾语：我们总以为做小生意的人不体面，但体面从来不是收入决定的。',
  },
  {
    key: 'interview_fitness_02',
    title: '采访健身20年的老教练：他说了什么让我震惊',
    scriptType: 'interview',
    industry: 'fitness',
    elements: ['authority', 'curiosity', 'contrast'],
    viralPotential: 'high',
    content:
      '采访对象：健身房工作了20年的老教练，60岁，体脂依然15%。\nQ：你见过最大的训练误区是什么？\nA："每次都练到力竭。力竭只适合最后一组，前三组控制在70-80%强度，才能持续练20年。"\nQ：什么运动最长寿？\nA："游泳，因为全身关节不受重力，80岁也能练。但教增肌最快的是深蹲，不做深蹲等于没训练下肢。"\nQ：60岁了还有什么健身目标？\nA："明年挑战全马，估计4.5小时完赛。"\n结尾：他说健身的终点不是好看，是能用身体做你想做的事。',
  },
  {
    key: 'interview_psychology_02',
    title: '采访心理咨询师：他说了什么让我沉默3分钟',
    scriptType: 'interview',
    industry: 'psychology',
    elements: ['empathy', 'reveal', 'curiosity'],
    viralPotential: 'high',
    content:
      '采访设置：心理咨询师，执业15年，见过2000+案例。\nQ：你见过最常见的心理问题是什么？\nA："不是抑郁不是焦虑——是人们不知道自己真正想要什么，却不停地假装知道。"\nQ：什么样的人最难咨询？\nA："越聪明的人越难，因为他们太擅长说服自己‘一切都挺好的’。"\nQ：普通人能做的最重要的心理保健是什么？\nA："每天1次，问自己：今天有没有一件事是我真正想做的？如果没有，那是个重要的信号。"\n结尾：那3分钟沉默，是因为我想不起来昨天有没有做一件我真正想做的事。',
  },

  // ── 日常 daily (3) ───────────────────────────────────────────────────────────
  {
    key: 'daily_food_01',
    title: '今天的早餐，15分钟搞定（上班族版）',
    scriptType: 'daily',
    industry: 'food',
    elements: ['resonance', 'list', 'small_big'],
    viralPotential: 'medium',
    content:
      '展示：今天6:30起床，6:45坐下吃早餐，全程15分钟。\n内容：全麦面包2片（烤箱2分钟）+水煮蛋2个（前晚提前煮，冰箱取出就吃）+牛奶1杯+苹果1个。\n营养数据：蛋白质25g，热量约450大卡，GI值低，饱腹感到11点不饿。\n核心技巧：关键是"前晚备好"——鸡蛋前晚煮，面包放烤箱前晚就设置好，早上醒来按一键。\n结论：健康早餐的门槛不是厨艺，是提前准备的习惯。',
  },
  {
    key: 'daily_fitness_03',
    title: '我的早起健身日常（5:30起床，7:30上班）',
    scriptType: 'daily',
    industry: 'fitness',
    elements: ['challenge', 'resonance', 'authority'],
    viralPotential: 'high',
    content:
      '流程实录：5:30 闹钟不贪睡，立刻起来。5:35 换运动服（提前一晚放在床边）。5:40-6:30 训练（上肢或下肢交替，各40分钟）。6:30 淋浴+早餐。7:15 出门。\n如何做到不贪睡：手机闹钟放在离床2米的地方，必须起来关。\n关键认知：早起健身和"反人类"无关，核心是"前一天晚上11点前睡"——睡眠不够，再多意志力也扛不住。\n数据：坚持了18个月，工作效率提升，加班减少，这才是早起健身最大的回报。',
  },
  {
    key: 'daily_apparel_03',
    title: '7月北京通勤穿搭日记（你也在为这件事烦恼吗）',
    scriptType: 'daily',
    industry: 'apparel',
    elements: ['resonance', 'list', 'transformation'],
    viralPotential: 'medium',
    content:
      '场景：北京7月，室外38度，办公室空调20度，通勤地铁30分钟。\n核心难题：室外热→不能穿太多，室内冷→必须穿够，地铁夹缝→不能太占地方。\n方案：基础款短袖+透气轻薄衬衫（不系扣当外搭）+西装裤/阔腿裤，挎包里放一件薄款针织外套。\n材质选择：短袖选莫代尔/竹纤维（比纯棉吸汗快50%），裤子选冰丝（进空调室内不冷）。\n结论：北京夏季通勤的核心是"一件衣搞定温差"，叠穿>换衣服。',
  },

  // ── 蜕变 transform (3) ───────────────────────────────────────────────────────
  {
    key: 'transform_fitness_01',
    title: '6个月减脂30斤，我的完整记录',
    scriptType: 'transform',
    industry: 'fitness',
    elements: ['transformation', 'before_after', 'challenge'],
    viralPotential: 'high',
    content:
      '起点：2023年8月，体重82kg，体脂32%，血压偏高，爬4层楼需要中途休息。\n方法：①饮食：热量缺口500大卡/天（减脂期每公斤体重蛋白质1.8g）②训练：每周3次力量+2次有氧，每次不超过70分钟。③作息：11点前睡，7点起，保证7小时睡眠。\n6个月数据：体重52kg（-30kg），体脂18%，血压恢复正常，4层楼不用停。\n关键时刻：第8周第一次突破瓶颈期（前7周停滞）——方法是增加了20%的饮食蛋白质比例。\n结语：方法比意志力重要，但没有意志力，再好的方法都没用。',
  },
  {
    key: 'transform_apparel_04',
    title: '我的形象改造全过程（从路人甲到有辨识度）',
    scriptType: 'transform',
    industry: 'apparel',
    elements: ['transformation', 'before_after', 'authority'],
    viralPotential: 'high',
    content:
      '改造前：衣橱100+件衣服，每天穿搭费时30分钟，仍然感觉"没有衣服"，同事记不住我。\n诊断问题：①颜色混乱（超过5种主色系）②版型不合身（都是电商标准码）③没有标志性元素。\n改造过程：清空→只留20件（包括基础款+当季最爱）→加入2件标志性单品（特殊颜色/廓形）→选定属于自己的"风格锚点颜色"。\n结果：改造后购物时间减少70%（不确定的不买），被记住的次数明显增加，最重要的是——早上开衣柜不再焦虑了。',
  },
  {
    key: 'transform_beauty_02',
    title: '护肤2年的皮肤变化对比（油皮到普通肤质）',
    scriptType: 'transform',
    industry: 'beauty',
    elements: ['transformation', 'before_after', 'authority'],
    viralPotential: 'high',
    content:
      '皮肤起点：25岁时，重度油皮，T区出油厉害，每天下午2点就开始泛油光，毛孔粗大，偶有痘痘。\n以为是什么问题：皮肤太油，要控油。\n后来发现是什么问题：皮肤屏障受损，过度清洁+刷酸导致，肌肤在应激出油。\n改变策略：①停用控油产品 ②加强保湿 ③只用温和氨基酸洗面奶 ④每天防晒。\n2年后数据：出油量减少60%，毛孔收缩可见，上午护肤下午不需要补妆了。\n结语：护肤的核心不是产品，是"给皮肤减负"的理念。',
  },

  // ── 辩论 debate (3) ──────────────────────────────────────────────────────────
  {
    key: 'debate_finance_01',
    title: '年轻人到底要不要买房',
    scriptType: 'debate',
    industry: 'ecommerce',
    elements: ['controversy', 'contrast', 'resonance'],
    viralPotential: 'high',
    content:
      '正方观点：现在不买，以后更买不起。房子是杠杆工具，30年后还清贷款，净资产超过不买房3倍。\n反方观点：一线城市首付50万，相当于放弃了50万的复利收益。租房+投资，30年后资产不一定少。\n关键变量：你的城市的房价/租金比（低于200倍不建议租，高于250倍建议租）。\n我的判断：北京/上海房价租金比>300，建议租+投资。二三线城市<250，可以考虑买。\n结语：这不是非此即彼的问题，是数学题。把数算清楚，你自然知道答案。',
  },
  {
    key: 'debate_fitness_03',
    title: '练瑜伽能替代力量训练吗',
    scriptType: 'debate',
    industry: 'fitness',
    elements: ['contrast', 'authority', 'controversy'],
    viralPotential: 'medium',
    content:
      '瑜伽支持者：瑜伽改善柔韧性、核心力量、体态，很多人靠瑜伽完成体型改变。\n力量训练支持者：肌肉量是基础代谢的决定因素，只有力量训练能有效增肌，瑜伽不能替代。\n数据：瑜伽平均1小时消耗180大卡，力量训练300大卡+训练后额外代谢提升持续24-48小时。\n我的判断：两者功能不同，不需要替代。最优方案：力量训练3天/周+瑜伽2天/周（力量增肌、瑜伽恢复）。\n结语：不存在"最好的运动"，只存在"你能坚持的运动"。',
  },
  {
    key: 'debate_food_03',
    title: '减脂期到底能不能吃碳水',
    scriptType: 'debate',
    industry: 'food',
    elements: ['controversy', 'contrast', 'authority'],
    viralPotential: 'high',
    content:
      '不能吃碳水派：低碳/生酮使胰岛素下降→脂肪分解加速→减脂更快。研究支持短期（12周内）低碳减脂效率高30%。\n能吃碳水派：长期来看，低碳和正常碳水摄入组减脂效果相同（1年+研究数据）。低碳影响运动表现，肌肉流失风险更高。\n我的判断：碳水不是问题，过量才是问题。减脂期碳水目标：100-150g/天（来自米饭/燕麦/红薯，而不是蛋糕/奶茶）。\n结论：戒碳水=戒主食，不可持续。减少精制碳水，增加复合碳水，才是有效且能坚持的策略。',
  },

  // ── 清单 list (4) ────────────────────────────────────────────────────────────
  {
    key: 'list_home_01',
    title: '搬家必备的10件神器（后悔没早点知道）',
    scriptType: 'list',
    industry: 'home',
    elements: ['list', 'benefit', 'curiosity'],
    viralPotential: 'high',
    content:
      '10件神器：①墙面修复膏（租客必备，退租不扣押金）②超强力挂钩（无痕，承重10kg）③密封条（门窗防噪神器）④壁挂书架（解放桌面）⑤床底收纳箱（增加30%储物空间）⑥魔术贴扎带（线材管理）⑦折叠晾衣架（小空间必备）⑧防水贴纸墙纸（厨房卫生间焕新神器）⑨真空收纳袋（换季衣物体积减少60%）⑩挂式门后收纳袋（门后死角利用）。\n全部加起来<300元，搬家后居家满意度提升显著。',
  },
  {
    key: 'list_cosmetics_02',
    title: '护肤品5大无效成分，以后别买了',
    scriptType: 'list',
    industry: 'cosmetics',
    elements: ['list', 'reveal', 'authority'],
    viralPotential: 'high',
    content:
      '5大无效成分：①胶原蛋白（分子量太大，无法经皮吸收，没有任何护肤效果，纯营销）②珍珠粉（没有临床数据支持任何功效，添加量<1%更是摆设）③马油（普通保湿成分，没有特殊功效，价格虚高）④芦荟原汁（刺激性成分，对部分肤质反而有害）⑤酵母菌提取物（大量是营销概念，真正有效的酵母成分需要特定浓度和工艺）。\n结语：成分名称听起来越天然、越神奇，越需要查是否有临床实证。记住一句话：没有数据的成分，都是营销。',
  },
  {
    key: 'list_fitness_04',
    title: '健身房里你绝对不需要买的6样东西',
    scriptType: 'list',
    industry: 'fitness',
    elements: ['list', 'contrast', 'worst'],
    viralPotential: 'high',
    content:
      '6样不要买：①腰带（初级训练者不需要，依赖腰带反而核心力量不发展）②护腕（除非腕关节有伤，正常训练不必要）③健身手套（降低握感，对高级动作有害）④EMS塑形仪（所有居家EMS设备都是智商税，临床无显著效果）⑤氨基酸补剂（蛋白质够就不需要，贵3倍，效果不如多吃一个鸡蛋）⑥高价蛋白棒（平均含糖量>15g，等价于1根士力架+少量蛋白质，不如直接吃鸡胸肉）。\n总结：健身的成本来自于时间和坚持，不是装备。',
  },
  {
    key: 'list_psychology_03',
    title: '7个让你更快乐的科学方法',
    scriptType: 'list',
    industry: 'psychology',
    elements: ['list', 'authority', 'benefit'],
    viralPotential: 'high',
    content:
      '7个方法（均有研究支持）：①每天记3件感恩的事（注意力从负面转移，2周见效）②冷水浴（激活去甲肾上腺素，抗抑郁效果与部分药物相当）③每天20分钟有氧运动（BDNF分泌增加，等效为轻度抗抑郁药）④减少社交媒体30分钟（1周后幸福感提升显著）⑤帮助他人（利他行为激活奖励回路，效果比接受帮助更强）⑥自然接触（哪怕看窗外的树也有效）⑦与真实朋友每周见面1次（网络互动不能替代面对面接触带来的催产素分泌）。\n这7件事都是免费的，难在坚持。',
  },

  // ── 反应 reaction (2) ────────────────────────────────────────────────────────
  {
    key: 'reaction_food_01',
    title: '我第一次吃到正宗四川火锅的反应',
    scriptType: 'reaction',
    industry: 'food',
    elements: ['surprise', 'resonance', 'curiosity'],
    viralPotential: 'medium',
    content:
      '背景：在北京吃了3年"四川火锅"，以为自己懂。第一次去成都本地的火锅店。\n第1秒：锅底端上来，看着就不一样，颜色更深，辣油更厚。\n第1分钟：吃了一片毛肚，辣度是北京的3倍，但有北京没有的"鲜"。\n第5分钟：满头大汗，停不下来，脑内多巴胺爆发。\n第30分钟：已经吃了北京正常分量的2倍，还在继续。\n结论：正宗和不正宗的差距，真的不是一点点。如果你没去过四川，你没吃过火锅。',
  },
  {
    key: 'reaction_fitness_04',
    title: '第一次做重量级深蹲，我的反应',
    scriptType: 'reaction',
    industry: 'fitness',
    elements: ['surprise', 'curiosity', 'challenge'],
    viralPotential: 'medium',
    content:
      '背景：训练2年，一直回避重量深蹲，第一次挑战体重×1.5的深蹲。\n前一天：焦虑，脑子里想了100遍动作，睡眠受影响。\n准备热身：45分钟热身（比平时多20分钟），心跳加速不像是训练，像是上台表演。\n完成第1组（4个）：比想象简单，但每下都感觉腿是别人的。\n完成第3组：全部完成，没有受伤。\n事后感受：原来恐惧的是我的头脑，不是我的腿。\n结论：大多数健身瓶颈是心理瓶颈，不是力量瓶颈。',
  },

  // ── 问答 qna (3) ────────────────────────────────────────────────────────────
  {
    key: 'qna_cosmetics_01',
    title: '你问我答：关于护肤最常问的5个问题',
    scriptType: 'qna',
    industry: 'cosmetics',
    elements: ['list', 'authority', 'resonance'],
    viralPotential: 'high',
    content:
      'Q1：防晒要每隔2小时补涂吗？A：室内不需要，户外才需要（玻璃会阻挡UVB，但不阻挡UVA）。\nQ2：精华在乳液前还是后？A：先精华后乳液，分子量小的在前。\nQ3：干皮油皮护肤有什么区别？A：干皮重保湿，油皮重控水（不是控油）——皮脂膜修复好了，出油自然减少。\nQ4：素颜霜真的有用吗？A：素颜霜=保湿+轻微遮瑕+提亮，有效果，但不替代粉底。\nQ5：护肤品能改善皱纹吗？A：能延缓，不能逆转。防晒是最便宜最有效的抗老方法。',
  },
  {
    key: 'qna_fitness_03',
    title: '健身问题合集：你问我答（减脂&增肌篇）',
    scriptType: 'qna',
    industry: 'fitness',
    elements: ['list', 'authority', 'resonance'],
    viralPotential: 'high',
    content:
      'Q1：减脂和增肌能同时进行吗？A：初级者可以（新手红利期），进阶者需要分阶段，同时做效果打折50%。\nQ2：有氧放在力量前还是后？A：增肌优先→力量先；减脂优先→有氧先；但差距不大，关键是都要做。\nQ3：停止训练后肌肉多久消失？A：1-2周开始下降，4周显著减少，6个月后恢复基础水平。但肌肉记忆真实存在，重新训练比第一次快3倍。\nQ4：喝蛋白粉会长胖吗？A：蛋白粉=食物的一种，总热量超了才长胖。蛋白粉本身热量极低（100大卡/份）。\nQ5：女性练力量会变壮吗？A：不会。女性睾酮是男性的1/10，怎么练都变不壮，只会更紧致。',
  },
  {
    key: 'qna_food_03',
    title: '减脂饮食问答：你的困惑我来解答',
    scriptType: 'qna',
    industry: 'food',
    elements: ['list', 'authority', 'resonance'],
    viralPotential: 'medium',
    content:
      'Q1：不吃主食能减脂吗？A：短期可以，长期不可持续，且肌肉流失风险高。\nQ2：减脂能吃水果吗？A：可以，但选低GI水果（苹果/草莓/蓝莓），高糖水果（西瓜/葡萄/芒果）控量。\nQ3：减脂期能喝咖啡吗？A：美式可以（0热量，轻微促进脂肪分解），加糖加奶就是在消耗一天热量预算。\nQ4：代餐真的有效吗？A：短期有效（热量控制简单），长期回到正常饮食后反弹率80%以上。\nQ5：减脂期要完全不吃零食吗？A：80%+20%原则——80%时间健康饮食，20%时间享受喜欢的食物，反而更持久。',
  },

  // ── 联动 collab (2) ──────────────────────────────────────────────────────────
  {
    key: 'collab_beauty_01',
    title: '和皮肤科医生一起测评：这些网红护肤品到底有没有用',
    scriptType: 'collab',
    industry: 'beauty',
    elements: ['authority', 'contrast', 'reveal'],
    viralPotential: 'high',
    content:
      '联动形式：拉来皮肤科执业医师（非网红医生），一起测评5款网红护肤品。\n产品1：XXX玻色因精华（医生评分8/10）：玻色因浓度0.3%有效，但价格溢价200%。\n产品2：YYY烟酰胺面膜（医生评分4/10）：含酒精精，长期使用敏感肌不建议。\n产品3：ZZZ某品牌修护乳（医生评分9/10）：成分表干净，神经酰胺前3位，价格合理。\n结论：医生眼中的护肤品≠网红眼中的，核心看成分，不看包装/故事/明星代言。',
  },
  {
    key: 'collab_food_04',
    title: '和营养师一起吃外卖：点餐现场指导',
    scriptType: 'collab',
    industry: 'food',
    elements: ['authority', 'list', 'benefit'],
    viralPotential: 'high',
    content:
      '联动形式：带着注册营养师，真实打开外卖App，让营养师实时指导我点餐。\n场景1：中餐选什么？营养师建议：蒸鱼/清炒蔬菜/杂粮饭>红烧肉/炒饭/宫保鸡丁。\n场景2：哪个避开？所有"干锅/香辣/红烧"标注的，油的用量是正常菜的3倍。\n场景3：有没有相对健康的外卖？沙拉（注意酱汁热量，选油醋汁）、寿司（注意酱油量）、越南春卷。\n结论：营养师的核心原则——外卖就选"能看到食材是什么"的，看不清楚的一般都不健康。',
  },

  // ── 幕后 behind (2) ──────────────────────────────────────────────────────────
  {
    key: 'behind_food_01',
    title: '一个美食视频背后，你不知道的故事',
    scriptType: 'behind',
    industry: 'food',
    elements: ['reveal', 'resonance', 'curiosity'],
    viralPotential: 'high',
    content:
      '展示完整幕后：一个3分钟美食视频的真实制作过程。\n选题：1天（查搜索热度+分析同类视频）→ 食材准备：2天（去7个市场才找到合适的食材）→ 拍摄：8小时（同一道菜做了4次，才拍到满意画面）→ 剪辑：6小时（4500条素材剪成3分钟）→ 发布后：第1天没水花，第3天突然爆了，原因未知。\n一个视频的成本：2000元食材+拍摄设备折旧+3天时间，靠流量变现需要至少50万播放才能回本。\n结语：你看到的"随手一拍"，背后都是看不见的努力。',
  },
  {
    key: 'behind_fitness_05',
    title: '健身博主一天是怎么过的（真实版，不是表演版）',
    scriptType: 'behind',
    industry: 'fitness',
    elements: ['reveal', 'resonance', 'contrast'],
    viralPotential: 'high',
    content:
      '6:00 起床，不是因为状态好，是因为闹钟。\n7:00-8:30 训练，不是每天都状态好，有时候只能完成60%。\n9:00-12:00 拍摄，同一个动作拍20遍才能拍到可用的10秒镜头。\n13:00-17:00 剪辑+回复评论，评论区的恶意评论每天都有，不是每次都不在意。\n18:00 饮食准备，准确说是"称量+记录"，不是随便吃，每餐都在记录蛋白质和热量。\n22:00 睡觉，不能熬夜，熬夜会影响第二天训练质量。\n结语：健康不是因为我们"热爱"运动，而是我们建立了系统。没有系统靠热情，热情会消退。',
  },

  // ── 热点 trend_news (3) ──────────────────────────────────────────────────────
  {
    key: 'trend_health_01',
    title: '最近流行的"情绪进食"，心理学怎么看',
    scriptType: 'trend_news',
    industry: 'psychology',
    elements: ['trend', 'resonance', 'authority'],
    viralPotential: 'high',
    content:
      '热点：情绪进食（emotional eating）最近在小红书/抖音被频繁讨论，"饿了吗？不饿，只是难受"这个话题引发千万共鸣。\n心理学解读：情绪进食不是意志力问题，是神经机制——食物（尤其是糖+脂肪）激活奖励回路，暂时缓解负面情绪。问题是：缓解是暂时的，情绪根源没有被处理，形成循环。\n解决框架：①识别情绪触发点（记录进食前情绪）②延迟5分钟（确认是不是"真饿"）③替代行为（情绪来临时走5分钟）。\n结语：如果每次难过都用食物解决，你解决的不是情绪，是在训练自己"难过=吃东西"的神经链接。',
  },
  {
    key: 'trend_fitness_05',
    title: '"代谢健身"热潮：到底有没有科学依据',
    scriptType: 'trend_news',
    industry: 'fitness',
    elements: ['trend', 'authority', 'contrast'],
    viralPotential: 'high',
    content:
      '热点：2024年"代谢训练"概念火了，各大平台都在推"HIIT提升代谢率，燃脂效果持续48小时"。\n事实核查：EPOC(运动后超量耗氧)确实存在，高强度训练后代谢率提升=额外燃烧100-200大卡（不是几千大卡）。\n真正改变基础代谢的是：肌肉量——每增加1kg肌肉，静息代谢增加约50大卡/天，10kg肌肉=500大卡/天额外消耗。\n结论：HIIT有效，但"持续48小时燃脂"是过度营销。最高ROI的代谢提升方法：做力量训练增加肌肉量，不是每天跑HIIT。',
  },
  {
    key: 'trend_food_04',
    title: '"低脂"食品为什么让你越吃越胖',
    scriptType: 'trend_news',
    industry: 'food',
    elements: ['trend', 'reveal', 'contrast'],
    viralPotential: 'high',
    content:
      '热点：低脂酸奶、低脂饼干、低脂沙拉酱——"低脂"标签在超市食品里遍地都是。\n反常识揭秘：低脂食品为了保证口感，通常增加糖分（每克糖=4大卡，每克脂肪=9大卡，但糖升血糖更快，胰岛素反应更强）。实测：某低脂饼干比普通版少30%脂肪，多60%糖，GI值高了40%。\n结论："低脂"不等于低热量，更不等于健康。判断一个食品是否值得吃，看热量+蛋白质+升糖指数，不要只看脂肪。\n行动：把手边的"低脂"食品翻过来看成分表，看看糖含量多少。',
  },

  // ── 采访 interview (extra 2) → total interview=5, adds 2 to reach 67 ────────
  {
    key: 'interview_beauty_03',
    title: '采访做了15年美甲的老师傅：她说了什么让我改变了对美的看法',
    scriptType: 'interview',
    industry: 'beauty',
    elements: ['resonance', 'empathy', 'authority'],
    viralPotential: 'medium',
    content:
      '采访对象：从业15年美甲师，自己开店，累计服务了约5000名客户。\nQ：你见过最让你印象深刻的客户是什么样的人？\nA："一个每月来做美甲的阿姨，说是唯一会为自己花钱的地方，每次来都聊很多。后来才知道她一个人生活，孩子在外地。"\nQ：你觉得美甲对客户来说意味着什么？\nA："不只是好看。是一种告诉自己‘我值得被善待’的方式。"\nQ：你自己的手好看吗？\nA："（笑）做了15年美甲，我自己的手一直没做过，太忙了。今年打算给自己做一次。"\n结尾：美不是给别人看的，是给自己看的。',
  },
  {
    key: 'interview_apparel_04',
    title: '采访旧衣回收站的志愿者：她说"扔掉的不是衣服"',
    scriptType: 'interview',
    industry: 'apparel',
    elements: ['resonance', 'empathy', 'revelation'],
    viralPotential: 'high',
    content:
      '采访场景：城市旧衣回收站，每天收到约500件衣物。\nQ：这里收来的衣服，最后去哪里？\nA："品质好的分类后捐给西部农村，品质差的送纺织厂循环利用，完全没法用的才进填埋场——其实最后只有20%需要填埋。"\nQ：什么衣服让你印象深刻？\nA："有一件童装，附了一张纸条，写着\'这件衣服陪我女儿从1岁穿到3岁，希望能给另一个宝宝穿\'。"\nQ：你最想告诉消费者的是什么？\nA："不要扔衣服，捐出去。你扔掉的是3年的纺织资源，不只是一件衣服。"\n结尾：也许服装的终点，不应该是垃圾桶。',
  },

  // ── 励志 motivation (3) ──────────────────────────────────────────────────────
  {
    key: 'motivation_general_01',
    title: '35岁失业，我是怎么重新站起来的',
    scriptType: 'motivation',
    industry: 'ecommerce',
    elements: ['resonance', 'empathy', 'transformation'],
    viralPotential: 'high',
    content:
      '事件：35岁，工作15年的公司裁员，在家3个月没有收入，两个孩子，房贷未还清。\n最低谷：有天早上起来，躺着不想动，觉得人生就这样了。\n转折点：孩子来问我"爸爸你今天去哪里工作"，我说"爸爸在找新工作"，他说"没关系，我们等你"。\n行动：那天起，把每天工作时间从"有空就做"变成"9-18点固定工作时间"。3个月后，找到新工作，收入比之前高20%。\n结语：人生不是在谷底时靠"励志名言"爬起来的，是靠一个个小的具体行动。不要想太多，今天做一件事就够了。',
  },
  {
    key: 'motivation_general_02',
    title: '我用5年时间，证明了"天赋论"是一个谎言',
    scriptType: 'motivation',
    industry: 'ecommerce',
    elements: ['resonance', 'contrast', 'authority'],
    viralPotential: 'high',
    content:
      '起点：22岁，没有音乐天赋，五音不全，被老师说"不适合唱歌"。\n行动：5年，每天练声2小时，不管工作多忙（哪怕深夜12点练15分钟）。\n结果：27岁，参加比赛，进入前20名，决赛时已经没有人说"你五音不全"了。\n核心发现：10000小时定律是真的。但大多数人练了100小时就认为"我没有天赋"——100小时距离10000小时差了99%。\n结语：天赋决定上限，但大多数人没有练到哪怕天赋上限的20%。你的"没天赋"，可能只是"没足够的时间"。',
  },
  {
    key: 'motivation_general_03',
    title: '做了5年打工人，我学到的3个不会有人教你的道理',
    scriptType: 'motivation',
    industry: 'ecommerce',
    elements: ['resonance', 'list', 'revelation'],
    viralPotential: 'high',
    content:
      '道理1：公司不是家。公司是商业组织，裁员是商业决策，不是个人否定。理解这一点你才能保护自己的情感健康，同时做好工作。\n道理2：能力不是最重要的，但可见度是。同等能力，让人知道你做了什么，晋升速度快3倍（这不是潜规则，是信息传递的必要性）。\n道理3：跳槽是最快的涨薪方式，但需要策略。在一个岗位做满2-3年，积累了不可替代的专业深度，跳槽时溢价最高（1年就跳只有技能广度，没有深度，容易被替代）。\n结语：职场规则没有人教你，但你早点知道，少走10年弯路。',
  },
] as const;
