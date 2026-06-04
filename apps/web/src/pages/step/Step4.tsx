// PRD-29.9 · Step4 执行计划 · IKB 红蓝紫渐变重构
import '@/styles/ikb-hero.css';

import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { C, F } from '@/components/home/ikb/system';
import type { Step4Phase } from '@/components/step4/Step4PhaseSection';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';
import { IKBLayout } from '@/layouts/IKBLayout';
import { STEP4_BUTTON_GENERATE, STEP4_H1, STEP4_SUBTITLE_TEMPLATE } from '@/lib/constants/step4';
import { breakSentences } from '@/lib/text';

// ── TypeScript interfaces ────────────────────────────────────────────────────

interface Step4ScheduleItem {
  time: string;
  title: string;
  desc: string;
}

interface Step4Result {
  overview: {
    currentStage: string;
    coreGoal: string;
    timeline: string;
    mainPlatform: string;
    coreAdvantages: string;
  };
  phases: Step4Phase[];
  dailySchedule: {
    morning: Step4ScheduleItem[];
    afternoon: Step4ScheduleItem[];
    evening: Step4ScheduleItem[];
  };
  warnings: Array<{
    signal: string;
    meaning: string;
    solution: string;
  }>;
  successCriteria: Array<{
    period: string;
    desc: string;
  }>;
}

interface Step4FormData {
  platform: string;
  followerCount: string;
  goal: string;
  personalInfo: string;
}

// ── Form 默认值 · 1:1 sally 真实输入 ────────────────────────────────────────

const DEFAULT_FORM: Step4FormData = {
  platform: 'douyin',
  followerCount: '1-1000',
  goal: 'start',
  personalInfo: '我是一名opc创业者，擅长与人沟通和项目交付。专业技能是给企业或者个人定制全自动工作流或者智能体，在这么行业从业半年。我以前是餐饮从业者，从事餐饮行业12年，作为品牌创始人之一的我，高峰时期拥有13家店铺（外卖店+实体店），因为品类周期原因，已经没有利润和持续的意义，加上因为认知问题投资的代加工厂失败，背上近百万的负债。后来果断一家一家店铺关掉，来到ai赛道做一家opc个人创业公司。我也是一名持续创业者，这是十几年期间有成功的项目也有失败血亏的项目，但是我从来不缺从头再来的勇气，目前公司已经交付一些简单的工作流和智能体平台，这些交付的案例都帮助客户解决了提效的问题，把客户从复杂重复的工作里抽身出来把精力放在更重要的商业决策上来。收费有4位数到6位数都有。我以前是技术小白，通过我不断的学习和自我迭代，到我现在可以交付项目。我自己的商业闭环走通这个环节也走了一些弯路，我把这些学习经验和沟通经验做成一系列的课程，想要帮助一些opc创业者避坑。',
};

// ── Mock data · 逐字提取 ─────────────────────────────────────────────────────

function generateMockResult(): Step4Result {
  return {
    overview: {
      currentStage: '你目前处于IP冷启动期，拥有1-1000粉丝，需要快速验证内容方向并积累初期用户。',
      coreGoal: '在3个月内，通过抖音平台获取精准意向客户，并实现首批高客单价智能体定制服务成交，同时启动OPC创业者课程的私域流量积累。',
      timeline: '三阶段规划：战略规划（第1周）、基础建设（第2-3周）、内容启动及增长（第4周+）。',
      mainPlatform: '抖音，作为核心流量入口。',
      coreAdvantages: '你拥有丰富的创业经验（餐饮12年，AI半年），经历过成功与失败，具备强大的抗压能力和从头再来的勇气。擅长沟通和项目交付，能将复杂技术转化为客户价值。同时，你从技术小白成长为交付者，这本身就是极具说服力的IP故事。',
    },

    phases: [
      // ── 阶段一：战略规划与IP定位 ──────────────────────────
      {
        number: 1,
        title: '阶段一：战略规划与IP定位',
        weekRange: '第1周',
        goal: '明确商业模式、双目标，完成IP基础包装，并产出首批内容策略。',
        dailyTasks: [
          {
            day: '周一 09:00-12:00',
            title: '商业模式梳理与目标细化',
            desc: '明确核心价值主张：为企业/个人定制AI工作流，解决提效痛点。目标客户：需要降本增效的企业主（美业、餐饮等）、寻求商业闭环的OPC创业者。盈利模式：智能体定制服务（1-10万+），OPC课程/训练营（9800-29800）。',
            duration: '3小时',
          },
          {
            day: '周一 14:00-17:00',
            title: '双目标设定',
            desc: '变现目标：第一个月成交1单智能体定制服务（1-5万），积累500个OPC创业者私域用户。客资目标：抖音账号月增粉5000，私域引流率10%。',
            duration: '3小时',
          },
          {
            day: '周二 09:00-12:00',
            title: '全域IP矩阵布局（规划）',
            desc: '主号抖音：核心内容发布，引流私域。小红书（规划）：作为案例展示和深度内容补充。视频号（规划）：作为私域承接和长视频输出平台。目前主攻抖音。',
            duration: '3小时',
          },
          {
            day: '周二 14:00-17:00',
            title: '产品体系设计',
            desc: '引流品：免费AI工具清单/AI提效案例集（0元）。信任品：AI工作流定制体验课/AI智能体定制咨询（99-499元）。利润品：基础版AI智能体定制（1-5万），OPC创业者线上课程（9800）。后端品：高级定制AI智能体（5万+），OPC创业者线下高阶培训/训练营（19800-29800）。',
            duration: '3小时',
          },
          {
            day: '周三 09:00-12:00',
            title: '三大素材库搭建（启动）',
            desc: '生活素材库：整理个人创业经历、餐饮经验、AI学习过程中的照片/视频。选题库：基于目标客户痛点（效率低下、成本高、商业闭环难）和AI解决方案，头脑风暴100个短视频选题。案例库：整理已交付的AI工作流/智能体案例，提炼客户痛点、解决方案、效果对比。',
            duration: '3小时',
          },
          {
            day: '周三 14:00-17:00',
            title: 'IP人设与账号包装',
            desc: '昵称：AI老吴、AI工作流定制师、AI创业老兵。头像：专业形象照，体现AI科技感。背景图：展示AI工作流或成功案例。简介："从餐饮老板到AI工作流定制师，用AI助你提效降本，告别重复工作。" 或 "12年创业老兵，半年从小白到AI工作流交付专家，助OPC创业者避坑。"',
            duration: '3小时',
          },
          {
            day: '周四 09:00-12:00',
            title: '抖音内容八大系统策略制定',
            desc: '分配内容类型占比：看见你（20%）、信任你（30%）、认可你（15%）、喜欢你（15%）、成交（10%）、平台托举（5%）、追随（3%）、行业标杆（2%）。重点在前四周快速提升"看见你"和"信任你"的内容。',
            duration: '3小时',
          },
          {
            day: '周四 14:00-17:00',
            title: '私域承接SOP初稿',
            desc: '引流钩子设计："免费领取AI工具清单，提升效率30%"，"私信我，免费诊断你的工作流"。用户标签体系：意向客户（企业主）、OPC创业者、潜在合作者。朋友圈规划：每日3-5条，内容包括AI干货、案例分享、个人生活、课程预告。',
            duration: '3小时',
          },
          {
            day: '周五 09:00-12:00',
            title: '场景化选题指南应用',
            desc: '规划未来一周的拍摄场景：办公室（展示AI工具）、咖啡馆（轻松分享创业经验）、和客户在一起（案例展示）。',
            duration: '3小时',
          },
          {
            day: '周五 14:00-17:00',
            title: '首周内容脚本撰写',
            desc: '撰写3-5个短视频脚本，涵盖"看见你"和"信任你"类型，时长控制在30-60秒。例如："3个AI工具，让你的工作效率翻倍"（看见你），"我如何用AI，半年从餐饮老板转型成功"（信任你）。',
            duration: '3小时',
          },
        ],
        milestones: [
          {
            week: '第1周',
            goal: '完成IP基础设定，明确商业路径，产出首批内容策略和脚本。',
            criteria: '商业模式清晰，双目标量化，产品体系完整，账号包装完成，至少5个可发布脚本。',
          },
        ],
        contentPlan: {
          frequency: '5-7条',
          categories: [
            { name: '看见你（痛点共鸣/价值主张）（20%）', desc: '快速吸引目标用户停留，让他们知道你能解决什么问题。' },
            { name: '信任你（个人故事/专业度展示）（30%）', desc: '通过个人经历、专业知识，建立用户信任感。' },
          ],
          bestTime: '早7:00-8:30、午休12:00-13:30、晚18:00-20:00',
        },
        kpis: [
          { name: '抖音账号粉丝数', target: '500', baseline: '1-1000' },
          { name: '单视频完播率', target: '>30%', baseline: '未知' },
          { name: '单视频点赞率', target: '>3%', baseline: '未知' },
        ],
      },

      // ── 阶段二：基础建设与内容启动 ──────────────────────
      {
        number: 2,
        title: '阶段二：基础建设与内容启动',
        weekRange: '第2-3周',
        goal: '完善素材库，开始发布内容，测试用户反馈，并优化私域承接流程。',
        dailyTasks: [
          {
            day: '周一 09:00-12:00',
            title: '素材库完善',
            desc: '继续扩充选题库（至少50个），案例库（至少5个详细案例），生活素材库（个人学习、工作场景）。',
            duration: '3小时',
          },
          {
            day: '周一 14:00-17:00',
            title: '内容拍摄与剪辑',
            desc: '拍摄并剪辑3条视频，例如："美业老板，还在手算业绩？AI帮你秒出报表！"（看见你），"我用AI打造的餐饮智能助手，让门店成本直降15%"（信任你），"OPC创业者，这3个AI坑你必须避开"（信任你）。注意黄金3秒法则，前3秒突出痛点或结果。',
            duration: '3小时',
          },
          {
            day: '周二 09:00-10:00',
            title: '抖音首发',
            desc: '发布一条视频，选择在早7:00-8:30之间。标题包含关键词，例如："美业AI提效"。文案引导互动："你还遇到哪些工作流难题？评论区告诉我。"',
            duration: '1小时',
          },
          {
            day: '周二 10:00-12:00',
            title: '数据复盘与优化',
            desc: '分析已发布视频的完播率、点赞率、评论，根据数据调整后续内容方向和脚本。',
            duration: '2小时',
          },
          {
            day: '周二 14:00-17:00',
            title: '私域引流钩子优化',
            desc: '设计更具吸引力的引流钩子，例如："私信【AI】，免费获取美业AI提效方案"，"私信【避坑】，领取OPC创业者AI工具避坑指南"。制作对应的落地页或私域欢迎语。',
            duration: '3小时',
          },
          {
            day: '周三 09:00-12:00',
            title: '内容拍摄与剪辑',
            desc: '拍摄并剪辑2条视频，例如："AI工作流定制，到底能帮你省多少钱？"（认可你），"从负债百万到AI创业，我的心路历程"（喜欢你）。',
            duration: '3小时',
          },
          {
            day: '周三 12:00-13:00',
            title: '抖音发布',
            desc: '发布一条视频，选择在午休12:00-13:30之间。文案引导私信。',
            duration: '1小时',
          },
          {
            day: '周四 09:00-12:00',
            title: '私域承接SOP演练',
            desc: '模拟用户添加私域流程，确保欢迎语、自动回复、朋友圈内容流畅且有价值。准备好用户标签体系。',
            duration: '3小时',
          },
          {
            day: '周四 18:00-19:00',
            title: '抖音发布',
            desc: '发布一条视频，选择在晚18:00-20:00之间。文案引导私信或评论。',
            duration: '1小时',
          },
          {
            day: '周五 09:00-12:00',
            title: '内容规划与脚本撰写',
            desc: '根据前几条视频数据反馈，调整下周内容方向。撰写3-5个新脚本，增加"认可你"和"喜欢你"的内容占比。',
            duration: '3小时',
          },
        ],
        milestones: [
          {
            week: '第2周',
            goal: '发布至少5条高质量短视频，测试内容方向和用户反馈，优化私域引流钩子。',
            criteria: '账号粉丝增长100+，单视频平均完播率>35%，私域引流人数>20。',
          },
          {
            week: '第3周',
            goal: '持续发布内容，开始积累私域用户，并进行初步互动。',
            criteria: '账号粉丝增长300+，私域引流人数>50，至少完成10次私域用户互动（咨询、提问等）。',
          },
        ],
        contentPlan: {
          frequency: '5-7条',
          categories: [
            { name: '看见你（痛点共鸣/价值主张）（20%）', desc: '持续吸引新用户' },
            { name: '信任你（个人故事/专业度展示）（30%）', desc: '加深用户对你的了解和信任' },
            { name: '认可你（解决方案/案例展示）（15%）', desc: '展示你的能力和成果，让用户觉得你有真本事' },
            { name: '喜欢你（个人魅力/价值观）（15%）', desc: '通过真诚分享，让用户产生情感连接' },
          ],
          bestTime: '早7:00-8:30、午休12:00-13:30、晚18:00-20:00',
        },
        kpis: [
          { name: '抖音账号粉丝数', target: '3000', baseline: '1-1000' },
          { name: '单视频互动率（评论+转发）', target: '>5%', baseline: '未知' },
          { name: '私域引流人数', target: '100', baseline: '0' },
        ],
      },

      // ── 阶段三：规模增长与变现启动 ──────────────────────
      {
        number: 3,
        title: '阶段三：规模增长与变现启动',
        weekRange: '第4周+',
        goal: '通过付费投流和直播，放大流量，加速私域积累和变现。',
        dailyTasks: [
          {
            day: '每天 09:00-10:00',
            title: '数据复盘与内容优化',
            desc: '分析前一天视频数据，特别是互动率、关注转化率和私域引流数据。根据数据调整当天内容方向和发布策略。例如，如果某个案例视频效果好，就多做类似内容。',
            duration: '1小时',
          },
          {
            day: '每天 10:00-12:00',
            title: '内容拍摄与剪辑',
            desc: '每天产出1-2条高质量视频。例如："美业老板必看！AI帮你分析客户数据，精准营销！"（认可你），"我如何用AI，实现从0到1的商业闭环"（成交），"我的AI智能体，让客户每月节省30000元"（成交）。',
            duration: '2小时',
          },
          {
            day: '每天 12:00-13:00',
            title: '抖音发布与互动',
            desc: '发布视频，并积极回复评论、私信。引导用户进入私域。利用抖音推流机制，在黄金时间发布。',
            duration: '1小时',
          },
          {
            day: '每天 14:00-17:00',
            title: '私域运营与客户沟通',
            desc: '在企业微信/个人微信中，对新引流用户进行标签化管理，提供引流品（免费AI工具清单）。针对意向客户进行一对一咨询，了解痛点，推荐产品体系中的信任品或利润品。例如："你好，我是AI老吴，看到你对AI提效感兴趣，方便聊聊你目前遇到的工作流难题吗？我这里有份【美业AI提效方案】可以免费送你。"',
            duration: '3小时',
          },
          {
            day: '每周二/四 19:00-21:00',
            title: '直播流程设计与执行',
            desc: '暖场（5分钟）：分享个人创业故事，吸引用户。痛点共鸣（15分钟）：深挖企业主/OPC创业者痛点。干货输出（30分钟）：分享AI提效具体方法、工具。产品植入（10分钟）：介绍AI智能体定制服务或OPC课程。答疑（15分钟）：解答用户疑问。逼单（5分钟）：限时优惠或专属福利，引导成交或私域转化。例如："今晚直播间，我将手把手教你搭建第一个AI工作流，前10名用户可获得免费AI诊断！"',
            duration: '2小时',
          },
          {
            day: '每周三/五 10:00-11:00',
            title: '付费投流策略',
            desc: '精准测试投流（100-300元/天）：选择表现好的视频进行DOU+投放，测试不同人群包（企业主、创业者、美业老板、餐饮老板）的效果。目标是提升视频播放量和私域引流成本。批量放大投流（1000-5000元/天）：一旦发现高转化视频和精准人群包，果断放大投放，加速流量获取。',
            duration: '1小时',
          },
        ],
        milestones: [
          {
            week: '第4周',
            goal: '启动直播，进行首次付费投流测试，实现首单成交。',
            criteria: '抖音粉丝突破5000，私域引流人数200+，至少1单智能体定制服务成交（或1个OPC课程成交）。',
          },
          {
            week: '第5-8周',
            goal: '稳定内容输出，优化投流策略，提升成交转化率。',
            criteria: '抖音粉丝突破1万，私域引流人数500+，累计成交3-5单智能体定制服务或OPC课程。',
          },
          {
            week: '第9周+',
            goal: '持续放大，探索裂变增长和IP矩阵复制。',
            criteria: '抖音粉丝突破3万，私域用户1000+，月均成交5万+，开始规划小红书/视频号内容。',
          },
        ],
        contentPlan: {
          frequency: '7-10条',
          categories: [
            { name: '看见你（痛点共鸣/价值主张）（15%）', desc: '持续引入新用户。' },
            { name: '信任你（个人故事/专业度展示）（25%）', desc: '深化信任，建立专业形象。' },
            { name: '认可你（解决方案/案例展示）（20%）', desc: '用成果说话，增强说服力。' },
            { name: '喜欢你（个人魅力/价值观）（15%）', desc: '建立情感连接，培养忠实粉丝。' },
            { name: '成交（产品介绍/促单）（10%）', desc: '直接引导购买或咨询。' },
            { name: '平台托举（热点/挑战）（5%）', desc: '蹭平台流量，扩大曝光。' },
            { name: '追随（用户反馈/互动）（3%）', desc: '增强用户粘性，形成社群氛围。' },
            { name: '行业标杆（深度分析/趋势洞察）（2%）', desc: '树立行业权威形象。' },
          ],
          bestTime: '早7:00-8:30、午休12:00-13:30、晚18:00-20:00',
        },
        kpis: [
          { name: '抖音账号粉丝数', target: '10000', baseline: '3000' },
          { name: '直播间观看人数', target: '200+', baseline: '0' },
          { name: '私域引流人数', target: '500', baseline: '100' },
          { name: '智能体定制服务成交额', target: '50000', baseline: '0' },
        ],
      },
    ],

    dailySchedule: {
      morning: [
        {
          time: '08:30-09:00',
          title: '数据复盘',
          desc: '查看前一天抖音视频数据（完播率、点赞、评论、转发、关注转化、私信量），私域新增人数及互动情况。',
        },
        {
          time: '09:00-12:00',
          title: '内容创作',
          desc: '根据数据反馈，撰写脚本，进行拍摄或剪辑。确保内容符合八大系统占比。',
        },
      ],
      afternoon: [
        {
          time: '12:00-13:00',
          title: '抖音发布与互动',
          desc: '发布当天第一条视频，并回复评论、私信。引导至私域。',
        },
        {
          time: '14:00-17:00',
          title: '私域运营与客户沟通',
          desc: '在企业微信中与新老客户互动，提供价值，进行咨询或促单。',
        },
        {
          time: '17:00-18:00',
          title: '素材整理与选题',
          desc: '整理当天拍摄素材，更新选题库，为第二天内容做准备。',
        },
      ],
      evening: [
        {
          time: '18:00-19:00',
          title: '抖音发布与互动',
          desc: '发布当天第二条视频（如有），并进行互动。尤其关注直播前的预热。',
        },
        {
          time: '19:00-21:00',
          title: '直播/学习',
          desc: '按计划进行直播，或进行行业学习、AI技术迭代学习，提升专业能力。',
        },
      ],
    },

    warnings: [
      {
        signal: '视频完播率低于30%',
        meaning: '内容开头不够吸引人，或节奏拖沓。',
        solution: '优化前3秒内容，增加悬念或直接抛出痛点/结果。加快视频节奏，精简废话。',
      },
      {
        signal: '点赞率低于3%，评论、转发少',
        meaning: '内容没有引起共鸣或互动性差。',
        solution: '增加互动引导，如提问、投票。内容更贴近用户痛点，提供更具体解决方案。',
      },
      {
        signal: '私域引流成本过高，或转化率低',
        meaning: '引流钩子不够吸引人，或私域承接SOP有问题。',
        solution: '优化引流钩子，使其更具价值和稀缺性。检查私域欢迎语、朋友圈内容是否能持续提供价值并建立信任。',
      },
      {
        signal: '直播间互动少，停留时间短',
        meaning: '直播内容枯燥，或没有有效互动环节。',
        solution: '增加直播互动游戏、抽奖。提前预告直播亮点，提升内容密度和干货输出。',
      },
    ],

    successCriteria: [
      {
        period: '第1周',
        desc: '完成IP基础设定，发布至少3条视频，账号粉丝突破100。',
      },
      {
        period: '第1个月',
        desc: '抖音粉丝突破3000，私域引流人数100+，至少1次直播，实现首单成交。',
      },
      {
        period: '第3个月',
        desc: '抖音粉丝突破10000，私域引流人数500+，月均成交额达到5万+，形成稳定内容输出和变现模式。',
      },
    ],
  };
}

// ── Table row status helpers ──────────────────────────────────────────────────

type RowStatus = 'done' | 'running' | 'pending';

function getStatus(index: number): RowStatus {
  if (index === 0) return 'done';
  if (index === 1) return 'running';
  return 'pending';
}

function StatusBadge({ status }: { status: RowStatus }) {
  if (status === 'done') {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1" style={{ borderColor: `${C.ikb}30`, background: `${C.ikb}0d` }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.ikb }} />
        <span className="text-[11px] font-semibold" style={{ color: C.ikb }}>已完成</span>
      </div>
    );
  }
  if (status === 'running') {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1" style={{ borderColor: `${C.accent3}40`, background: `${C.accent3}10` }}>
        <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ backgroundColor: C.accent3 }} />
        <span className="text-[11px] font-semibold" style={{ color: C.purpleText }}>执行中</span>
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1.5 rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-1 opacity-60">
      <span className="h-1.5 w-1.5 rounded-full bg-[#6b7280]" />
      <span className="text-[11px] font-semibold text-[#6b7280]">待命</span>
    </div>
  );
}

// ── Module-level constants (hoisted) ─────────────────────────────────────────

const PLATFORMS = [
  { key: 'xiaohongshu', label: '小红书', icon: 'menu_book', color: '#ff2442', desc: '种草 · 图文' },
  { key: 'douyin', label: '抖音', icon: 'music_note', color: '#0ea5b7', desc: '短视频 · 流量' },
  { key: 'wechat', label: '视频号', icon: 'smart_display', color: '#07c160', desc: '私域 · 转化' },
];

const GOAL_OPTIONS = [
  { key: 'start', label: '起号期', icon: 'rocket_launch', desc: '冷启动 · 建立账号' },
  { key: 'growth', label: '成长期', icon: 'trending_up', desc: '扩粉 · 提升影响力' },
  { key: 'monetize', label: '变现期', icon: 'payments', desc: '转化 · 实现商业价值' },
];

// ── Main Component ───────────────────────────────────────────────────────────

export default function Step4() {
  const navigate = useNavigate();
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const { save, isSaving, dbQuery } = useStepData(accountId, 'step4');

  const industry = readOtherStep<{ industry?: string }>(accountId, 'step1')?.industry ?? '美业';

  // PRD-29.9 · default form 1:1 复刻 sally 真实输入
  const [platform, setPlatform] = useState(DEFAULT_FORM.platform);
  const [followerCount, setFollowerCount] = useState(DEFAULT_FORM.followerCount);
  const [goal, setGoal] = useState(DEFAULT_FORM.goal);
  const [personalInfo, setPersonalInfo] = useState(breakSentences(DEFAULT_FORM.personalInfo));

  const prevIsSavingRef = useRef(false);

  useEffect(() => {
    if (accountId === null) return;
    const saved = readOtherStep<Step4FormData>(accountId, 'step4');
    if (saved?.personalInfo) {
      setPersonalInfo(saved.personalInfo);
      if (saved.platform) setPlatform(saved.platform);
      if (saved.followerCount) setFollowerCount(saved.followerCount);
      if (saved.goal) setGoal(saved.goal);
    }
  }, [accountId]);

  useEffect(() => {
    if (prevIsSavingRef.current && !isSaving) {
      void dbQuery.refetch();
    }
    prevIsSavingRef.current = isSaving;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSaving]);

  const [isLocalGenerating, setIsLocalGenerating] = useState(false);
  const isLoading = isLocalGenerating || isSaving;

  // PRD-29.9 · default 强制 mock
  const generated: Step4Result = generateMockResult();
  const canBulkActions = !isLoading;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoading) return;
    setIsLocalGenerating(true);
    save({ platform, followerCount, goal, personalInfo });
    setTimeout(() => {
      setIsLocalGenerating(false);
      toast.success('生成完成');
    }, 1200);
  }

  function handleRegenerateAll() {
    if (isLoading) return;
    setIsLocalGenerating(true);
    setTimeout(() => {
      setIsLocalGenerating(false);
      toast.success('已重新生成');
    }, 1200);
  }

  function handleCopyAll() {
    const text = JSON.stringify(generated, null, 2);
    void navigator.clipboard.writeText(text).then(() => toast.success('已复制全部'));
  }

  function handleOptimize() {
    if (!canBulkActions) return;
    toast.success('已智能优化');
  }

  function handleFeedbackUp() { toast.success('感谢反馈!'); }
  function handleFeedbackDown() { toast.info('我们会持续改进'); }
  function handleNextStep() {
    void navigate('/step/4b');
  }
  function handleViewIpPlan() { toast.info('IP 方案查看功能开发中'); }
  void handleViewIpPlan;

  // Flatten dailySchedule items for the table
  const allScheduleItems: Array<{ time: string; title: string; desc: string; section: string }> = [
    ...generated.dailySchedule.morning.map((it) => ({ ...it, section: '上午' })),
    ...generated.dailySchedule.afternoon.map((it) => ({ ...it, section: '下午' })),
    ...generated.dailySchedule.evening.map((it) => ({ ...it, section: '晚间' })),
  ];

  const btnSecondary =
    'ikb-focusring flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest transition-colors hover:bg-[#f0f2ff] disabled:cursor-not-allowed disabled:opacity-40';

  // 数据洞察雷达维度 (执行健康度)
  const RADAR_DIMS_S4 = [
    { label: '任务密度', value: 85, color: C.ikb },
    { label: '资源投入', value: 78, color: C.burgundy },
    { label: '风险可控', value: 82, color: C.accent3 },
    { label: '里程碑清晰', value: 90, color: C.ikb },
    { label: '依赖合理', value: 76, color: C.burgundy },
    { label: '节奏稳健', value: 88, color: C.accent3 },
  ];

  // 趋势图数据 (累计完成度预估)
  const TREND_DATA_S4 = [8, 18, 30, 45, 62, 75, 84, 92, 100];
  const TREND_LABELS_S4 = ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周', '第7周', '第8周', '第9周'];

  return (
    <IKBLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mb-12 flex flex-row items-center justify-between gap-8">
        <div className="shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest" style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.mono }}>
              执行矩阵
            </span>
            <span className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest" style={{ borderColor: `${C.accent3}50`, background: `${C.accent3}12`, color: C.purpleText, fontFamily: F.mono }}>
              迭代规划
            </span>
          </div>
          <h1 className="ikb-gradtext whitespace-nowrap text-[40px] font-extrabold tracking-tighter" style={{ fontFamily: F.display }}>
            STEP 04 · {STEP4_H1}
          </h1>
          <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed" style={{ color: '#5A6173', fontFamily: F.cn }}>
            {STEP4_SUBTITLE_TEMPLATE.replace('{industry}', industry)}
          </p>
        </div>
        <div className="flex shrink-0 flex-nowrap gap-3">
          <button
            type="button"
            onClick={handleOptimize}
            disabled={!canBulkActions}
            className={btnSecondary}
            style={{ borderColor: C.line, color: C.ink, fontFamily: F.cn }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>auto_fix_high</span>
            智能优化
          </button>
          <button
            type="button"
            onClick={handleRegenerateAll}
            disabled={isLoading}
            className={btnSecondary}
            style={{ borderColor: C.line, color: C.ink, fontFamily: F.cn }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>refresh</span>
            重新生成
          </button>
          <button
            type="button"
            onClick={handleCopyAll}
            className="ikb-gradbtn ikb-focusring flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5"
            style={{ fontFamily: F.cn }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>download</span>
            导出执行案
          </button>
        </div>
      </header>

      {/* ── Loading bar ────────────────────────────────────── */}
      {isLoading && (
        <div className="mb-8 flex items-center gap-3 rounded-xl border p-4 text-[14px] font-medium" style={{ borderColor: `${C.ikb}25`, background: `${C.ikb}08`, color: C.ikb, fontFamily: F.cn }}>
          <span className="material-symbols-outlined animate-spin text-[20px]" aria-hidden={true}>progress_activity</span>
          正在生成执行计划…
        </div>
      )}

      {/* ── 输入基准参数 ─────────────────────────────────────── */}
      <section className="relative mb-12 overflow-hidden rounded-xl border p-6" style={{ borderColor: C.line, background: C.paper }}>
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-2xl" style={{ background: `${C.ikb}08` }} />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full blur-2xl" style={{ background: `${C.burgundy}06` }} />
        <div className="relative mb-6 flex items-center justify-between pb-5" style={{ borderBottom: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-3">
            <span className="ikb-gradbtn flex h-11 w-11 items-center justify-center rounded-xl text-white">
              <span className="material-symbols-outlined" aria-hidden={true}>tune</span>
            </span>
            <div>
              <h2 className="text-[18px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>基准参数输入</h2>
              <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>填写执行基础信息 · AI 据此生成三阶段执行计划</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold" style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.ikb }} />
            参数就绪
          </span>
        </div>
        <div className="relative">
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* 目标平台 · 可视化平台卡 */}
            <div role="radiogroup" aria-label="目标平台">
              <span className="mb-3 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide before:h-3.5 before:w-1 before:rounded-full before:content-['']" style={{ color: C.ink, fontFamily: F.cn, '--tw-gradient-from': C.ikb, '--tw-gradient-to': C.burgundy } as React.CSSProperties}>
                <span className="mr-1 inline-block h-3.5 w-1 rounded-full" style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }} />
                目标平台
              </span>
              <div className="grid grid-cols-3 gap-4">
                {PLATFORMS.map((p) => {
                  const active = platform === p.key;
                  return (
                    <button
                      type="button"
                      key={p.key}
                      role="radio"
                      aria-checked={active}
                      aria-label={`目标平台：${p.label}`}
                      onClick={() => setPlatform(p.key)}
                      className="ikb-focusring group relative flex items-center gap-3 overflow-hidden rounded-xl border p-3.5 text-left transition-all"
                      style={{ borderColor: active ? C.ikb : C.line, background: active ? `${C.ikb}06` : C.paper }}
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white"
                        style={{ backgroundColor: p.color }}
                      >
                        <span className="material-symbols-outlined text-[22px]" aria-hidden={true}>{p.icon}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{p.label}</span>
                        <span className="block text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{p.desc}</span>
                      </span>
                      <span
                        className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full transition-all"
                        style={{ background: active ? C.ikb : 'transparent', border: active ? 'none' : `1px solid ${C.line}`, color: active ? '#fff' : 'transparent' }}
                        aria-hidden={true}
                      >
                        <span className="material-symbols-outlined text-[12px]">check</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 核心转化目标 · 可视化选择卡 */}
            <div role="radiogroup" aria-label="核心转化目标">
              <span className="mb-3 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide" style={{ color: C.ink, fontFamily: F.cn }}>
                <span className="mr-1 inline-block h-3.5 w-1 rounded-full" style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }} />
                核心转化目标
              </span>
              <div className="grid grid-cols-3 gap-4">
                {GOAL_OPTIONS.map((g) => {
                  const active = goal === g.key;
                  return (
                    <button
                      type="button"
                      key={g.key}
                      role="radio"
                      aria-checked={active}
                      aria-label={`转化目标：${g.label}`}
                      onClick={() => setGoal(g.key)}
                      className="ikb-focusring group relative flex items-center gap-3 overflow-hidden rounded-xl border p-3.5 text-left transition-all"
                      style={{ borderColor: active ? C.ikb : C.line, background: active ? `${C.ikb}06` : C.paper }}
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                        style={active ? { background: C.grad, color: '#fff' } : { background: C.base, color: '#6b7280' }}
                      >
                        <span className="material-symbols-outlined text-[22px]" aria-hidden={true}>{g.icon}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{g.label}</span>
                        <span className="block text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{g.desc}</span>
                      </span>
                      <span
                        className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full transition-all"
                        style={{ background: active ? C.ikb : 'transparent', border: active ? 'none' : `1px solid ${C.line}`, color: active ? '#fff' : 'transparent' }}
                        aria-hidden={true}
                      >
                        <span className="material-symbols-outlined text-[12px]">check</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 目标体量 · 带图标输入 */}
            <div>
              <label htmlFor="s4-follower-count" className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide" style={{ color: C.ink, fontFamily: F.cn }}>
                <span className="mr-1 inline-block h-3.5 w-1 rounded-full" style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }} />
                目标体量 (关注者/用户)
              </label>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: '#6b7280' }} aria-hidden={true}>group_add</span>
                <input
                  id="s4-follower-count"
                  type="text"
                  value={followerCount}
                  onChange={(e) => setFollowerCount(e.target.value)}
                  placeholder="如：1万 / 10万 / 100万"
                  className="ikb-input w-full rounded-lg border py-3 pl-10 pr-3 text-[14px] transition-all focus-visible:outline-2"
                  style={{ borderColor: C.line, background: C.base, fontFamily: F.cn, color: C.ink }}
                />
              </div>
            </div>

            {/* 个人背景 · 框式编辑器 */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="s4-personal-info" className="flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide" style={{ color: C.ink, fontFamily: F.cn }}>
                  <span className="mr-1 inline-block h-3.5 w-1 rounded-full" style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }} />
                  个人背景 <span className="ml-1 text-[12px] font-normal" style={{ color: '#6b7280' }}>(可选)</span>
                </label>
                <span className="flex items-center gap-1 text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
                  <span className="material-symbols-outlined text-[14px]" style={{ color: C.burgundy }} aria-hidden={true}>auto_awesome</span>
                  AI 据此定制执行策略
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border transition-all focus-within:ring-1 focus-within:ring-[#2B53E6]" style={{ borderColor: C.line, background: C.base }}>
                <textarea
                  id="s4-personal-info"
                  value={personalInfo}
                  onChange={(e) => setPersonalInfo(e.target.value)}
                  rows={5}
                  placeholder="输入你的创业经历、行业背景、擅长领域等，AI 将据此生成更精准的执行路径"
                  className="ikb-input w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed"
                  style={{ fontFamily: F.cn, color: C.ink }}
                />
                <div className="flex items-center justify-between gap-3 border-t px-4 py-2.5" style={{ borderColor: C.line, background: 'rgba(255,255,255,0.7)' }}>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>可包含</span>
                    {['经历', '行业', '优势', '目标', '资源'].map((t) => (
                      <span key={t} className="rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ background: `${C.ikb}10`, color: C.purpleText, fontFamily: F.mono }}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums" style={{ color: '#6b7280', fontFamily: F.mono }}>{personalInfo.length} 字</span>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="ikb-gradbtn ikb-focusring flex items-center gap-2 rounded-xl px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white transition-all active:translate-x-px active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ fontFamily: F.mono }}
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>rocket_launch</span>
                  {isLoading ? '生成中…' : STEP4_BUTTON_GENERATE}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* ── 数据洞察(雷达 + 趋势)──────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px]" style={{ color: C.ikb }} aria-hidden={true}>insights</span>
        <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>数据洞察</h2>
        <span className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>· AI 综合评估 · 实时测算</span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold" style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}>
          <span className="ikb-pulse h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.ikb }} />
          模型已就绪
        </span>
      </div>
      <div className="mb-8 grid grid-cols-12 gap-6">
        {/* 执行健康度雷达 */}
        <div className="ikb-hovercard col-span-5 rounded-xl border p-6" style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}>
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.ikb}12`, color: C.ikb }}>
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>radar</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>执行健康度雷达</h3>
                <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>六维模型评估</p>
              </div>
            </div>
            <div className="text-right">
              <p className="ikb-gradtext text-[26px] font-bold leading-none" style={{ fontFamily: F.display }}>83</p>
              <p className="text-[10px]" style={{ color: '#6b7280', fontFamily: F.mono }}>综合分</p>
            </div>
          </div>
          {(() => {
            const dims = RADAR_DIMS_S4;
            const cx = 130;
            const cy = 122;
            const R = 88;
            const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
            const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
            const poly = (r: number) => dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
            const dataPoly = dims.map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');
            return (
              <svg viewBox="0 0 260 244" className="w-full" role="img" aria-label="执行健康度雷达图">
                <defs>
                  <linearGradient id="s4-radarFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                    <stop offset="100%" stopColor={C.burgundy} stopOpacity="0.12" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <polygon key={f} points={poly(R * f)} fill="none" stroke="#e8ebf2" strokeWidth="1" />
                ))}
                {dims.map((_, i) => {
                  const [x, y] = pt(i, R);
                  return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#eef1f6" strokeWidth="1" />;
                })}
                <polygon points={dataPoly} fill="url(#s4-radarFill)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
                {dims.map((d, i) => {
                  const [x, y] = pt(i, R * (d.value / 100));
                  return <circle key={i} cx={x} cy={y} r="3.2" fill="#fff" stroke={d.color} strokeWidth="2" />;
                })}
                {dims.map((d, i) => {
                  const [x, y] = pt(i, R + 16);
                  return (
                    <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#6b7280" fontSize="10.5" fontWeight="600">
                      {d.label}
                    </text>
                  );
                })}
              </svg>
            );
          })()}
          <div className="mt-2 grid grid-cols-3 gap-y-2">
            {RADAR_DIMS_S4.map((d) => (
              <div key={d.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{d.label}</span>
                <span className="text-[11px] font-bold" style={{ color: C.ink, fontFamily: F.mono }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 累计完成度预估 */}
        <div className="ikb-hovercard col-span-7 rounded-xl border p-6" style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}>
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.burgundy}12`, color: C.burgundy }}>
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>show_chart</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>累计完成度预估</h3>
                <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>按当前执行计划测算</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {['进度', '里程碑', '复盘'].map((t, i) => (
                <span
                  key={t}
                  className="rounded-md px-2.5 py-1 text-[11px] font-semibold"
                  style={i === 0 ? { background: C.ikb, color: '#fff', fontFamily: F.mono } : { background: C.base, color: '#6b7280', fontFamily: F.mono }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="mb-3 flex items-end gap-3">
            <p className="text-[30px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>100%</p>
            <span className="mb-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-bold" style={{ background: `${C.ikb}12`, color: C.ikb }}>
              <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>trending_up</span>+{generated.phases.length * 3} 阶段
            </span>
            <span className="mb-1 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>第9周完成</span>
          </div>
          {(() => {
            const data = TREND_DATA_S4;
            const W = 560;
            const H = 168;
            const padL = 6;
            const padR = 6;
            const padT = 12;
            const padB = 8;
            const innerW = W - padL - padR;
            const innerH = H - padT - padB;
            const max = 110;
            const x = (i: number) => padL + (innerW * i) / (data.length - 1);
            const y = (v: number) => padT + innerH * (1 - v / max);
            const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
            const area = `${line} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
            return (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="累计完成度趋势图">
                <defs>
                  <linearGradient id="s4-trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ikb} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="s4-trendLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={C.ikb} />
                    <stop offset="55%" stopColor={C.accent3} />
                    <stop offset="100%" stopColor={C.burgundy} />
                  </linearGradient>
                </defs>
                {[0, 0.33, 0.66, 1].map((f) => (
                  <line
                    key={f}
                    x1={padL}
                    x2={W - padR}
                    y1={(padT + innerH * f).toFixed(1)}
                    y2={(padT + innerH * f).toFixed(1)}
                    stroke="#f1f3f9"
                    strokeWidth="1"
                  />
                ))}
                <path d={area} fill="url(#s4-trendFill)" />
                <path d={line} fill="none" stroke="url(#s4-trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((v, i) =>
                  i % 2 === 0 ? <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke={C.ikb} strokeWidth="2" /> : null,
                )}
              </svg>
            );
          })()}
          <div className="mt-1 flex justify-between px-1 text-[10px]" style={{ color: '#6b7280', fontFamily: F.mono }}>
            {TREND_LABELS_S4.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI 卡一排 ─────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        {/* 任务总数 · 环形进度 · 蓝 */}
        <div className="ikb-hovercard rounded-xl border p-5" style={{ borderColor: `${C.ikb}25`, background: C.paper }}>
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.ikb}12`, color: C.ikb }}>
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>task_alt</span>
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}>
              <span className="material-symbols-outlined text-[13px]" aria-hidden={true}>trending_up</span>全覆盖
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                {allScheduleItems.length}
                <span className="text-[15px]" style={{ color: '#6b7280', fontFamily: F.cn }}> 项</span>
              </p>
              <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>任务总数</p>
            </div>
            <div className="h-12 w-12 shrink-0">
              <svg viewBox="0 0 36 36" className="-rotate-90" role="img" aria-label="任务覆盖率 83%">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke={`${C.ikb}20`} strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke={C.ikb}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="83 100"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 执行周期 · 迷你柱 · 玫红 */}
        <div className="ikb-hovercard rounded-xl border p-5" style={{ borderColor: C.line, background: C.paper }}>
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.burgundy}12`, color: C.burgundy }}>
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>date_range</span>
            </span>
            <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${C.burgundy}12`, color: C.burgundyText, fontFamily: F.mono }}>三阶段</span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
              {generated.phases.length}
              <span className="text-[15px]" style={{ color: '#6b7280', fontFamily: F.cn }}> 周期</span>
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>执行周期</p>
          </div>
          <div className="mt-3 flex h-6 items-end gap-1">
            {[45, 72, 60, 88, 95].map((h, i) => (
              <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, backgroundColor: `${C.burgundy}70` }} />
            ))}
          </div>
        </div>

        {/* 里程碑数 · 进度条 · 紫 */}
        <div className="ikb-hovercard rounded-xl border p-5" style={{ borderColor: C.line, background: C.paper }}>
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.accent3}15`, color: C.accent3 }}>
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>flag</span>
            </span>
            <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${C.accent3}12`, color: C.purpleText, fontFamily: F.mono }}>里程碑</span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
              {generated.phases.reduce((sum, ph) => sum + ph.milestones.length, 0)}
              <span className="text-[15px]" style={{ color: '#6b7280', fontFamily: F.cn }}> 个</span>
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>里程碑节点</p>
          </div>
          <div className="mt-3 h-2 w-full rounded-full" style={{ background: `${C.accent3}15` }}>
            <div className="h-2 w-[78%] rounded-full" style={{ background: `linear-gradient(to right, ${C.accent3}, ${C.ikb})` }} />
          </div>
        </div>

        {/* 避坑预警数 · chip · 蓝 */}
        <div className="ikb-hovercard rounded-xl border p-5" style={{ borderColor: C.line, background: C.paper }}>
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.ikb}12`, color: C.ikb }}>
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>shield</span>
            </span>
            <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}>
              {generated.warnings.length} 项
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
              {generated.warnings.length}
              <span className="text-[15px]" style={{ color: '#6b7280', fontFamily: F.cn }}> 项</span>
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>避坑预警</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {['完播率', '引流', '直播'].slice(0, 3).map((k) => (
              <span
                key={k}
                className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{ background: `${C.ikb}10`, color: C.ikb, fontFamily: F.mono }}
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── 总览区块 ─────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]" style={{ color: C.ikb }} aria-hidden={true}>summarize</span>
          <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>执行总览</h2>
          <span className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>· 核心目标 · 阶段规划 · 平台策略</span>
        </div>
        <div className="ikb-hovercard rounded-xl border p-6" style={{ borderColor: C.line, background: C.paper }}>
          <div className="grid grid-cols-2 gap-6">
            {/* 左列 */}
            <div className="space-y-5">
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: C.ikb, fontFamily: F.mono }}>当前阶段</p>
                <p className="text-[14px] leading-relaxed" style={{ color: '#374151', fontFamily: F.cn }}>{generated.overview.currentStage}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: C.ikb, fontFamily: F.mono }}>总体时间线</p>
                <p className="text-[14px] leading-relaxed" style={{ color: '#374151', fontFamily: F.cn }}>{generated.overview.timeline}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: C.ikb, fontFamily: F.mono }}>主攻平台</p>
                <p className="text-[14px] leading-relaxed" style={{ color: '#374151', fontFamily: F.cn }}>{generated.overview.mainPlatform}</p>
              </div>
            </div>
            {/* 右列 */}
            <div className="space-y-5">
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: C.burgundyText, fontFamily: F.mono }}>核心目标</p>
                <p className="text-[14px] leading-relaxed" style={{ color: '#374151', fontFamily: F.cn }}>{generated.overview.coreGoal}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: C.burgundyText, fontFamily: F.mono }}>核心优势</p>
                <p className="text-[14px] leading-relaxed" style={{ color: '#374151', fontFamily: F.cn }}>{generated.overview.coreAdvantages}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 三阶段完整展开 ────────────────────────────────────── */}
      <section className="mb-8 space-y-6">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]" style={{ color: C.ikb }} aria-hidden={true}>timeline</span>
          <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>三阶段执行路径</h2>
          <span className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>· 每日任务 · 里程碑 · 内容计划 · KPI</span>
        </div>
        {generated.phases.map((phase) => {
          // IKB 轮转: 蓝 · 玫红 · 紫
          const phaseAccent = phase.number === 1 ? C.ikb : phase.number === 2 ? C.burgundy : C.accent3;
          const phaseAccentText = phase.number === 1 ? C.ikb : phase.number === 2 ? C.burgundyText : C.purpleText;
          return (
            <div
              key={phase.number}
              className="overflow-hidden rounded-xl border"
              style={{ borderColor: phaseAccent, background: C.paper }}
            >
              {/* Phase header — 白底 + 顶部渐变色条 · 不铺大底色 */}
              <div className="px-6 py-4" style={{ borderBottom: `3px solid ${phaseAccent}`, background: `${phaseAccent}06` }}>
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[16px] font-bold text-white"
                    style={{ background: phaseAccent }}
                  >
                    {phase.number}
                  </span>
                  <div>
                    <h3 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{phase.title}</h3>
                    <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{phase.weekRange} · {phase.goal}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-6">
                {/* 每日任务 */}
                <div>
                  <p className="mb-3 flex items-center gap-1.5 text-[13px] font-bold" style={{ color: phaseAccentText, fontFamily: F.cn }}>
                    <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>checklist</span>
                    每日任务
                  </p>
                  <div className="space-y-3">
                    {phase.dailyTasks.map((task, ti) => (
                      <div
                        key={ti}
                        className="ikb-hovercard grid grid-cols-[180px_1fr] gap-4 rounded-lg border p-3"
                        style={{ borderColor: C.line, background: C.base }}
                      >
                        <div>
                          <p className="text-[11px] font-bold" style={{ color: phaseAccentText, fontFamily: F.mono }}>{task.day}</p>
                          <p className="text-[10px]" style={{ color: '#6b7280', fontFamily: F.mono }}>{task.duration}</p>
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold" style={{ color: C.ink, fontFamily: F.cn }}>{task.title}</p>
                          <p className="mt-0.5 text-[12px] leading-relaxed" style={{ color: '#6b7280', fontFamily: F.cn }}>{task.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 里程碑 */}
                <div>
                  <p className="mb-3 flex items-center gap-1.5 text-[13px] font-bold" style={{ color: phaseAccentText, fontFamily: F.cn }}>
                    <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>flag</span>
                    里程碑
                  </p>
                  <div className="space-y-3">
                    {phase.milestones.map((m, mi) => (
                      <div key={mi} className="ikb-hovercard rounded-lg border p-3" style={{ borderColor: C.line, background: C.base }}>
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-bold" style={{ color: phaseAccentText, borderColor: `${phaseAccent}40`, background: C.paper, fontFamily: F.mono }}>
                            {m.week}
                          </span>
                          <div>
                            <p className="text-[13px] font-semibold" style={{ color: C.ink, fontFamily: F.cn }}>{m.goal}</p>
                            {m.criteria && (
                              <p className="mt-0.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>验收：{m.criteria}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 内容计划 */}
                <div>
                  <p className="mb-3 flex items-center gap-1.5 text-[13px] font-bold" style={{ color: phaseAccentText, fontFamily: F.cn }}>
                    <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>edit_calendar</span>
                    内容计划
                  </p>
                  <div className="ikb-hovercard rounded-lg border p-4" style={{ borderColor: C.line, background: C.base }}>
                    <div className="mb-3 flex flex-wrap gap-4 text-[12px]" style={{ fontFamily: F.cn }}>
                      <span style={{ color: '#6b7280' }}>
                        每周发布：<span className="font-bold" style={{ color: phaseAccentText }}>{phase.contentPlan.frequency}</span>
                      </span>
                      <span style={{ color: '#6b7280' }}>
                        最佳时间：<span className="font-semibold" style={{ color: '#374151' }}>{phase.contentPlan.bestTime}</span>
                      </span>
                    </div>
                    <div className="space-y-2">
                      {phase.contentPlan.categories.map((cat, ci) => {
                        const ccIdx = ci % 3;
                        const ccBorder = ccIdx === 0 ? `${C.ikb}28` : ccIdx === 1 ? `${C.burgundy}28` : `${C.accent3}28`;
                        const ccBg = ccIdx === 0 ? `${C.ikb}0a` : ccIdx === 1 ? `${C.burgundy}08` : `${C.accent3}08`;
                        return (
                          <div
                            key={ci}
                            className="rounded-lg border p-2.5 text-[12px]"
                            style={{ borderColor: ccBorder, background: ccBg }}
                          >
                            <span className="font-semibold" style={{ color: C.ink, fontFamily: F.cn }}>{cat.name}</span>
                            <span style={{ color: '#6b7280', fontFamily: F.cn }}> — {cat.desc}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* KPI */}
                <div>
                  <p className="mb-3 flex items-center gap-1.5 text-[13px] font-bold" style={{ color: phaseAccentText, fontFamily: F.cn }}>
                    <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>bar_chart</span>
                    KPI 指标
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {phase.kpis.map((kpi, ki) => (
                      <div
                        key={ki}
                        className="ikb-hovercard rounded-lg border p-3"
                        style={{ borderColor: C.line, background: C.base }}
                      >
                        <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{kpi.name}</p>
                        <p className="text-[22px] font-bold leading-tight" style={{ color: phaseAccentText, fontFamily: F.display }}>{kpi.target}</p>
                        <div className="mt-1 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: phaseAccent }} />
                          <p className="text-[10px]" style={{ color: '#6b7280', fontFamily: F.mono }}>基准：{kpi.baseline}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ── 执行任务序列 table ──────────────────────────────── */}
      <div className="mb-6 overflow-hidden rounded-xl border" style={{ borderColor: C.line, background: C.paper }}>
        {/* 白底 + 渐变顶条 header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderBottom: `3px solid ${C.ikb}`, background: `${C.ikb}06` }}>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.ikb}20`, color: C.ikb }}>
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>format_list_numbered</span>
            </span>
            <div>
              <h3 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>执行任务序列</h3>
              <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>日程表 · 全周期 {allScheduleItems.length} 项核心动作</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold" style={{ background: `${C.accent3}15`, color: C.purpleText, fontFamily: F.mono }}>
            <span className="ikb-pulse h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.accent3 }} />
            执行中
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]" style={{ fontFamily: F.cn }}>
            <thead>
              <tr className="border-b" style={{ borderColor: C.line, background: C.base }}>
                <th className="w-24 px-6 py-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#6b7280', fontFamily: F.mono }}>
                  周期
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#6b7280', fontFamily: F.mono }}>
                  核心动作
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#6b7280', fontFamily: F.mono }}>
                  量化产出
                </th>
                <th className="w-32 px-6 py-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#6b7280', fontFamily: F.mono }}>
                  状态
                </th>
                <th className="w-20 px-6 py-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#6b7280', fontFamily: F.mono }}>
                  验收
                </th>
              </tr>
            </thead>
            <tbody>
              {allScheduleItems.map((item, idx) => (
                <tr
                  key={`${item.time}-${idx}`}
                  className="border-t transition-colors"
                  style={{ borderColor: `${C.line}`, background: idx % 2 === 1 ? C.base : C.paper }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = `${C.ikb}06`; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 1 ? C.base : C.paper; }}
                >
                  <td className="px-6 py-4 text-[12px] font-bold" style={{ color: C.ikb, fontFamily: F.mono }}>
                    {`D-${String(idx + 1).padStart(2, '0')}`}
                  </td>
                  <td className="px-6 py-4 font-semibold" style={{ color: C.ink }}>{item.title}</td>
                  <td className="px-6 py-4" style={{ color: '#6b7280' }}>{item.desc.slice(0, 60)}…</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={getStatus(idx)} />
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      className="ikb-focusring flex h-6 w-6 items-center justify-center rounded-md border transition-colors"
                      style={{ borderColor: C.line }}
                      aria-label={`验收：${item.title}`}
                      onMouseEnter={(e) => { const b = e.currentTarget; b.style.background = C.ikb; b.style.color = '#fff'; b.style.borderColor = C.ikb; }}
                      onMouseLeave={(e) => { const b = e.currentTarget; b.style.background = ''; b.style.color = ''; b.style.borderColor = C.line; }}
                    >
                      <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>check</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end border-t px-6 py-3" style={{ borderColor: C.line, background: C.base }}>
          <button
            type="button"
            className="ikb-focusring text-[13px] font-semibold hover:underline"
            style={{ color: C.ikb, fontFamily: F.cn, background: 'transparent', border: 'none', cursor: 'pointer' }}
            aria-label="查看完整周期"
          >
            查看完整周期 →
          </button>
        </div>
      </div>

      {/* ── 避坑预警 + 成功标准 ────────────────────────────── */}
      <div className="grid grid-cols-2 gap-6">
        {/* 避坑预警 · 玫红/紫 轮转 */}
        <section className="ikb-hovercard rounded-xl border p-6" style={{ borderColor: C.line, background: C.paper }}>
          <h3 className="mb-5 flex items-center gap-2.5 text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.burgundy}12`, color: C.burgundy }}>
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>warning</span>
            </span>
            避坑预警
          </h3>
          <div className="space-y-4">
            {generated.warnings.map((w, wi) => {
              const wc = wi % 2 === 0
                ? { border: `${C.burgundy}28`, bg: `${C.burgundy}06`, iconColor: C.burgundy }
                : { border: `${C.accent3}28`, bg: `${C.accent3}06`, iconColor: C.accent3 };
              const wTextColor = wi % 2 === 0 ? C.burgundyText : C.purpleText;
              return (
                <div
                  key={w.signal}
                  className="ikb-hovercard rounded-xl border p-4"
                  style={{ borderColor: wc.border, background: wc.bg }}
                >
                  <div className="mb-1 flex items-start gap-2">
                    <span className="material-symbols-outlined mt-0.5 shrink-0 text-[16px]" style={{ color: wc.iconColor }} aria-hidden={true}>
                      error_outline
                    </span>
                    <span className="text-[13px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{w.signal}</span>
                  </div>
                  <p className="mb-1 pl-6 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{w.meaning}</p>
                  <p className="pl-6 text-[12px]" style={{ color: '#374151', fontFamily: F.cn }}>
                    <span className="font-semibold" style={{ color: wTextColor }}>方案：</span>
                    {w.solution}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 成功标准 · 蓝/紫轮转 */}
        <section className="ikb-hovercard rounded-xl border p-6" style={{ borderColor: C.line, background: C.paper }}>
          <h3 className="mb-5 flex items-center gap-2.5 text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${C.ikb}12`, color: C.ikb }}>
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>check_circle</span>
            </span>
            成功标准
          </h3>
          <div className="space-y-4">
            {generated.successCriteria.map((sc, si) => {
              const scAccent = si === 0 ? C.ikb : si === 1 ? C.accent3 : C.burgundy;
              const scTextColor = si === 0 ? C.ikb : si === 1 ? C.purpleText : C.burgundyText;
              return (
                <div
                  key={sc.period}
                  className="ikb-hovercard flex items-start gap-3 rounded-xl border p-4"
                  style={{ borderColor: `${scAccent}28`, background: `${scAccent}06` }}
                >
                  <span className="mt-0.5 shrink-0 rounded-lg border px-2 py-0.5 text-[11px] font-bold" style={{ borderColor: `${scAccent}40`, background: C.paper, color: scTextColor, fontFamily: F.mono }}>
                    {sc.period}
                  </span>
                  <p className="text-[13px]" style={{ color: '#374151', fontFamily: F.cn }}>{sc.desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ── Footer actions ──────────────────────────────────── */}
      <div className="ikb-hovercard mt-6 rounded-xl border p-6" style={{ borderColor: C.line, background: C.paper }}>
        <div className="flex flex-row items-center justify-between gap-6">
          {/* Feedback */}
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-medium" style={{ color: '#6b7280', fontFamily: F.cn }}>这个结果对你有帮助吗？</span>
            <button
              type="button"
              onClick={handleFeedbackUp}
              className="ikb-focusring flex h-8 w-8 items-center justify-center rounded-md border shadow-sm transition-colors"
              style={{ borderColor: C.line, background: C.paper, color: '#374151' }}
              aria-label="有帮助"
              onMouseEnter={(e) => { const b = e.currentTarget; b.style.background = `${C.ikb}10`; b.style.color = C.ikb; b.style.borderColor = C.ikb; }}
              onMouseLeave={(e) => { const b = e.currentTarget; b.style.background = C.paper; b.style.color = '#374151'; b.style.borderColor = C.line; }}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>thumb_up</span>
            </button>
            <button
              type="button"
              onClick={handleFeedbackDown}
              className="ikb-focusring flex h-8 w-8 items-center justify-center rounded-md border shadow-sm transition-colors"
              style={{ borderColor: C.line, background: C.paper, color: '#374151' }}
              aria-label="没帮助"
              onMouseEnter={(e) => { const b = e.currentTarget; b.style.background = `${C.burgundy}10`; b.style.color = C.burgundy; b.style.borderColor = C.burgundy; }}
              onMouseLeave={(e) => { const b = e.currentTarget; b.style.background = C.paper; b.style.color = '#374151'; b.style.borderColor = C.line; }}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>thumb_down</span>
            </button>
          </div>

          {/* Next step */}
          <button
            type="button"
            onClick={handleNextStep}
            className="ikb-gradbtn ikb-focusring flex items-center gap-2 rounded-xl px-6 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-0.5"
            style={{ fontFamily: F.cn }}
          >
            继续下一步：变现路径
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>arrow_forward</span>
          </button>
        </div>
      </div>
    </IKBLayout>
  );
}

// Suppress unused import — Step4Phase type is used in Step4Result.phases
void (0 as unknown as Step4Phase);
