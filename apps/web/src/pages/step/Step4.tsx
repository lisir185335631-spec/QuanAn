// PRD-29.9 · Step4 执行计划 · 液态玻璃皮重构
import { motion } from 'framer-motion';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Magnetic, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
import type { Step4Phase } from '@/components/step4/Step4PhaseSection';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';
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
      {
        number: 1,
        title: '阶段一：战略规划与IP定位',
        weekRange: '第1周',
        goal: '明确商业模式、双目标，完成IP基础包装，并产出首批内容策略。',
        dailyTasks: [
          { day: '周一 09:00-12:00', title: '商业模式梳理与目标细化', desc: '明确核心价值主张：为企业/个人定制AI工作流，解决提效痛点。目标客户：需要降本增效的企业主（美业、餐饮等）、寻求商业闭环的OPC创业者。盈利模式：智能体定制服务（1-10万+），OPC课程/训练营（9800-29800）。', duration: '3小时' },
          { day: '周一 14:00-17:00', title: '双目标设定', desc: '变现目标：第一个月成交1单智能体定制服务（1-5万），积累500个OPC创业者私域用户。客资目标：抖音账号月增粉5000，私域引流率10%。', duration: '3小时' },
          { day: '周二 09:00-12:00', title: '全域IP矩阵布局（规划）', desc: '主号抖音：核心内容发布，引流私域。小红书（规划）：作为案例展示和深度内容补充。视频号（规划）：作为私域承接和长视频输出平台。目前主攻抖音。', duration: '3小时' },
          { day: '周二 14:00-17:00', title: '产品体系设计', desc: '引流品：免费AI工具清单/AI提效案例集（0元）。信任品：AI工作流定制体验课/AI智能体定制咨询（99-499元）。利润品：基础版AI智能体定制（1-5万），OPC创业者线上课程（9800）。后端品：高级定制AI智能体（5万+），OPC创业者线下高阶培训/训练营（19800-29800）。', duration: '3小时' },
          { day: '周三 09:00-12:00', title: '三大素材库搭建（启动）', desc: '生活素材库：整理个人创业经历、餐饮经验、AI学习过程中的照片/视频。选题库：基于目标客户痛点（效率低下、成本高、商业闭环难）和AI解决方案，头脑风暴100个短视频选题。案例库：整理已交付的AI工作流/智能体案例，提炼客户痛点、解决方案、效果对比。', duration: '3小时' },
          { day: '周三 14:00-17:00', title: 'IP人设与账号包装', desc: '昵称：AI老吴、AI工作流定制师、AI创业老兵。头像：专业形象照，体现AI科技感。背景图：展示AI工作流或成功案例。简介："从餐饮老板到AI工作流定制师，用AI助你提效降本，告别重复工作。"', duration: '3小时' },
          { day: '周四 09:00-12:00', title: '抖音内容八大系统策略制定', desc: '分配内容类型占比：看见你（20%）、信任你（30%）、认可你（15%）、喜欢你（15%）、成交（10%）、平台托举（5%）、追随（3%）、行业标杆（2%）。', duration: '3小时' },
          { day: '周四 14:00-17:00', title: '私域承接SOP初稿', desc: '引流钩子设计："免费领取AI工具清单，提升效率30%"，"私信我，免费诊断你的工作流"。用户标签体系：意向客户（企业主）、OPC创业者、潜在合作者。', duration: '3小时' },
          { day: '周五 09:00-12:00', title: '场景化选题指南应用', desc: '规划未来一周的拍摄场景：办公室（展示AI工具）、咖啡馆（轻松分享创业经验）、和客户在一起（案例展示）。', duration: '3小时' },
          { day: '周五 14:00-17:00', title: '首周内容脚本撰写', desc: '撰写3-5个短视频脚本，涵盖"看见你"和"信任你"类型，时长控制在30-60秒。', duration: '3小时' },
        ],
        milestones: [{ week: '第1周', goal: '完成IP基础设定，明确商业路径，产出首批内容策略和脚本。', criteria: '商业模式清晰，双目标量化，产品体系完整，账号包装完成，至少5个可发布脚本。' }],
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
      {
        number: 2,
        title: '阶段二：基础建设与内容启动',
        weekRange: '第2-3周',
        goal: '完善素材库，开始发布内容，测试用户反馈，并优化私域承接流程。',
        dailyTasks: [
          { day: '周一 09:00-12:00', title: '素材库完善', desc: '继续扩充选题库（至少50个），案例库（至少5个详细案例），生活素材库（个人学习、工作场景）。', duration: '3小时' },
          { day: '周一 14:00-17:00', title: '内容拍摄与剪辑', desc: '拍摄并剪辑3条视频，注意黄金3秒法则，前3秒突出痛点或结果。', duration: '3小时' },
          { day: '周二 09:00-10:00', title: '抖音首发', desc: '发布一条视频，选择在早7:00-8:30之间。文案引导互动。', duration: '1小时' },
          { day: '周二 10:00-12:00', title: '数据复盘与优化', desc: '分析已发布视频的完播率、点赞率、评论，根据数据调整后续内容方向和脚本。', duration: '2小时' },
          { day: '周二 14:00-17:00', title: '私域引流钩子优化', desc: '设计更具吸引力的引流钩子，制作对应的落地页或私域欢迎语。', duration: '3小时' },
          { day: '周三 09:00-12:00', title: '内容拍摄与剪辑', desc: '拍摄并剪辑2条视频，例如："AI工作流定制，到底能帮你省多少钱？"（认可你），"从负债百万到AI创业，我的心路历程"（喜欢你）。', duration: '3小时' },
          { day: '周三 12:00-13:00', title: '抖音发布', desc: '发布一条视频，选择在午休12:00-13:30之间。文案引导私信。', duration: '1小时' },
          { day: '周四 09:00-12:00', title: '私域承接SOP演练', desc: '模拟用户添加私域流程，确保欢迎语、自动回复、朋友圈内容流畅且有价值。', duration: '3小时' },
          { day: '周四 18:00-19:00', title: '抖音发布', desc: '发布一条视频，选择在晚18:00-20:00之间。文案引导私信或评论。', duration: '1小时' },
          { day: '周五 09:00-12:00', title: '内容规划与脚本撰写', desc: '根据前几条视频数据反馈，调整下周内容方向。撰写3-5个新脚本，增加"认可你"和"喜欢你"的内容占比。', duration: '3小时' },
        ],
        milestones: [
          { week: '第2周', goal: '发布至少5条高质量短视频，测试内容方向和用户反馈，优化私域引流钩子。', criteria: '账号粉丝增长100+，单视频平均完播率>35%，私域引流人数>20。' },
          { week: '第3周', goal: '持续发布内容，开始积累私域用户，并进行初步互动。', criteria: '账号粉丝增长300+，私域引流人数>50，至少完成10次私域用户互动。' },
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
      {
        number: 3,
        title: '阶段三：规模增长与变现启动',
        weekRange: '第4周+',
        goal: '通过付费投流和直播，放大流量，加速私域积累和变现。',
        dailyTasks: [
          { day: '每天 09:00-10:00', title: '数据复盘与内容优化', desc: '分析前一天视频数据，特别是互动率、关注转化率和私域引流数据。根据数据调整当天内容方向和发布策略。', duration: '1小时' },
          { day: '每天 10:00-12:00', title: '内容拍摄与剪辑', desc: '每天产出1-2条高质量视频。例如："美业老板必看！AI帮你分析客户数据，精准营销！"', duration: '2小时' },
          { day: '每天 12:00-13:00', title: '抖音发布与互动', desc: '发布视频，并积极回复评论、私信。引导用户进入私域。', duration: '1小时' },
          { day: '每天 14:00-17:00', title: '私域运营与客户沟通', desc: '在企业微信/个人微信中，对新引流用户进行标签化管理，提供引流品（免费AI工具清单）。针对意向客户进行一对一咨询。', duration: '3小时' },
          { day: '每周二/四 19:00-21:00', title: '直播流程设计与执行', desc: '暖场（5分钟）→ 痛点共鸣（15分钟）→ 干货输出（30分钟）→ 产品植入（10分钟）→ 答疑（15分钟）→ 逼单（5分钟）。', duration: '2小时' },
          { day: '每周三/五 10:00-11:00', title: '付费投流策略', desc: '精准测试投流（100-300元/天），选择表现好的视频进行DOU+投放。批量放大投流（1000-5000元/天）。', duration: '1小时' },
        ],
        milestones: [
          { week: '第4周', goal: '启动直播，进行首次付费投流测试，实现首单成交。', criteria: '抖音粉丝突破5000，私域引流人数200+，至少1单智能体定制服务成交。' },
          { week: '第5-8周', goal: '稳定内容输出，优化投流策略，提升成交转化率。', criteria: '抖音粉丝突破1万，私域引流人数500+，累计成交3-5单智能体定制服务或OPC课程。' },
          { week: '第9周+', goal: '持续放大，探索裂变增长和IP矩阵复制。', criteria: '抖音粉丝突破3万，私域用户1000+，月均成交5万+，开始规划小红书/视频号内容。' },
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
        { time: '08:30-09:00', title: '数据复盘', desc: '查看前一天抖音视频数据（完播率、点赞、评论、转发、关注转化、私信量），私域新增人数及互动情况。' },
        { time: '09:00-12:00', title: '内容创作', desc: '根据数据反馈，撰写脚本，进行拍摄或剪辑。确保内容符合八大系统占比。' },
      ],
      afternoon: [
        { time: '12:00-13:00', title: '抖音发布与互动', desc: '发布当天第一条视频，并回复评论、私信。引导至私域。' },
        { time: '14:00-17:00', title: '私域运营与客户沟通', desc: '在企业微信中与新老客户互动，提供价值，进行咨询或促单。' },
        { time: '17:00-18:00', title: '素材整理与选题', desc: '整理当天拍摄素材，更新选题库，为第二天内容做准备。' },
      ],
      evening: [
        { time: '18:00-19:00', title: '抖音发布与互动', desc: '发布当天第二条视频（如有），并进行互动。尤其关注直播前的预热。' },
        { time: '19:00-21:00', title: '直播/学习', desc: '按计划进行直播，或进行行业学习、AI技术迭代学习，提升专业能力。' },
      ],
    },

    warnings: [
      { signal: '视频完播率低于30%', meaning: '内容开头不够吸引人，或节奏拖沓。', solution: '优化前3秒内容，增加悬念或直接抛出痛点/结果。加快视频节奏，精简废话。' },
      { signal: '点赞率低于3%，评论、转发少', meaning: '内容没有引起共鸣或互动性差。', solution: '增加互动引导，如提问、投票。内容更贴近用户痛点，提供更具体解决方案。' },
      { signal: '私域引流成本过高，或转化率低', meaning: '引流钩子不够吸引人，或私域承接SOP有问题。', solution: '优化引流钩子，使其更具价值和稀缺性。检查私域欢迎语、朋友圈内容是否能持续提供价值并建立信任。' },
      { signal: '直播间互动少，停留时间短', meaning: '直播内容枯燥，或没有有效互动环节。', solution: '增加直播互动游戏、抽奖。提前预告直播亮点，提升内容密度和干货输出。' },
    ],

    successCriteria: [
      { period: '第1周', desc: '完成IP基础设定，发布至少3条视频，账号粉丝突破100。' },
      { period: '第1个月', desc: '抖音粉丝突破3000，私域引流人数100+，至少1次直播，实现首单成交。' },
      { period: '第3个月', desc: '抖音粉丝突破10000，私域引流人数500+，月均成交额达到5万+，形成稳定内容输出和变现模式。' },
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
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          borderRadius: 8,
          border: `0.5px solid rgba(168,197,224,0.45)`,
          background: 'rgba(168,197,224,0.18)',
          padding: '3px 10px',
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: C.ikb, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: C.ikb, fontFamily: F.mono }}>已完成</span>
      </div>
    );
  }
  if (status === 'running') {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          borderRadius: 8,
          border: `0.5px solid rgba(168,197,224,0.35)`,
          background: 'rgba(168,197,224,0.12)',
          padding: '3px 10px',
        }}
      >
        <span
          style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: C.accent3, flexShrink: 0 }}
          className="animate-pulse"
        />
        <span style={{ fontSize: 11, fontWeight: 700, color: C.purpleText, fontFamily: F.mono }}>执行中</span>
      </div>
    );
  }
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        borderRadius: 8,
        border: `0.5px solid rgba(255,255,255,0.18)`,
        background: 'rgba(255,255,255,0.06)',
        padding: '3px 10px',
        opacity: 0.55,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.84)', fontFamily: F.mono }}>待命</span>
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
  function handleNextStep() { void navigate('/step/4b'); }
  function handleViewIpPlan() { toast.info('IP 方案查看功能开发中'); }
  void handleViewIpPlan;

  const allScheduleItems: Array<{ time: string; title: string; desc: string; section: string }> = [
    ...generated.dailySchedule.morning.map((it) => ({ ...it, section: '上午' })),
    ...generated.dailySchedule.afternoon.map((it) => ({ ...it, section: '下午' })),
    ...generated.dailySchedule.evening.map((it) => ({ ...it, section: '晚间' })),
  ];

  // 数据洞察雷达维度
  const RADAR_DIMS_S4 = [
    { label: '任务密度', value: 85, color: C.ikb },
    { label: '资源投入', value: 78, color: C.burgundy },
    { label: '风险可控', value: 82, color: C.accent3 },
    { label: '里程碑清晰', value: 90, color: C.ikb },
    { label: '依赖合理', value: 76, color: C.burgundy },
    { label: '节奏稳健', value: 88, color: C.accent3 },
  ];

  const TREND_DATA_S4 = [8, 18, 30, 45, 62, 75, 84, 92, 100];
  const TREND_LABELS_S4 = ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周', '第7周', '第8周', '第9周'];

  const PHASE_COLORS = [C.ikb, C.burgundy, C.accent3] as const;
  const PHASE_TEXT_COLORS = [C.ikb, C.burgundyText, C.purpleText] as const;

  return (
    <LiquidShell>
      {/* ── Header ─────────────────────────────────────────── */}
      <Reveal>
        <header style={{ marginBottom: 44, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  borderRadius: 9999,
                  border: `0.5px solid ${C.line}`,
                  background: 'rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(12px)',
                  padding: '4px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase' as const,
                  color: C.ink,
                  fontFamily: F.mono,
                  textShadow: C.textShadow,
                }}
              >
                执行矩阵
              </span>
              <span
                style={{
                  borderRadius: 9999,
                  border: `0.5px solid rgba(168,197,224,0.45)`,
                  background: 'rgba(168,197,224,0.18)',
                  backdropFilter: 'blur(12px)',
                  padding: '4px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase' as const,
                  color: C.ikb,
                  fontFamily: F.mono,
                  textShadow: C.textShadow,
                }}
              >
                迭代规划
              </span>
            </div>
            <h1
              style={{
                whiteSpace: 'nowrap',
                fontSize: 46,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                fontFamily: F.display,
                margin: 0,
                background: C.grad,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
                textShadow: 'none',
              }}
            >
              STEP 04 · {STEP4_H1}
            </h1>
            <p
              style={{
                marginTop: 10,
                maxWidth: 820,
                fontSize: 16,
                lineHeight: 1.6,
                color: C.burgundyText,
                fontFamily: F.cn,
                textShadow: C.textShadow,
              }}
            >
              {STEP4_SUBTITLE_TEMPLATE.replace('{industry}', industry)}
            </p>
          </div>
          <div style={{ display: 'flex', flexShrink: 0, flexWrap: 'wrap', gap: 10 }}>
            <motion.button
              type="button"
              onClick={handleOptimize}
              disabled={!canBulkActions}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 12,
                border: `0.5px solid ${C.line}`,
                background: 'rgba(255,255,255,0.10)',
                backdropFilter: 'blur(12px)',
                color: C.ink,
                fontFamily: F.cn,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                cursor: 'pointer',
                textShadow: C.textShadow,
                opacity: canBulkActions ? 1 : 0.4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden>auto_fix_high</span>
              智能优化
            </motion.button>
            <motion.button
              type="button"
              onClick={handleRegenerateAll}
              disabled={isLoading}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 12,
                border: `0.5px solid ${C.line}`,
                background: 'rgba(255,255,255,0.10)',
                backdropFilter: 'blur(12px)',
                color: C.ink,
                fontFamily: F.cn,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                cursor: 'pointer',
                textShadow: C.textShadow,
                opacity: isLoading ? 0.4 : 1,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden>refresh</span>
              重新生成
            </motion.button>
            <motion.button
              type="button"
              onClick={handleCopyAll}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 12,
                background: C.grad,
                border: 'none',
                color: '#fff',
                fontFamily: F.cn,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                textShadow: C.textShadow,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden>download</span>
              导出执行案
            </motion.button>
          </div>
        </header>
      </Reveal>

      {/* ── Loading bar ────────────────────────────────────── */}
      {isLoading && (
        <div
          className="lg-glass"
          style={{
            marginBottom: 28,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderRadius: 14,
            padding: '14px 18px',
            fontSize: 14,
            fontWeight: 500,
            color: C.ikb,
            fontFamily: F.cn,
          }}
        >
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: 20 }} aria-hidden>progress_activity</span>
          正在生成执行计划…
        </div>
      )}

      {/* ── 输入基准参数 ─────────────────────────────────────── */}
      <Reveal>
        <section
          className="lg-glass"
          style={{ position: 'relative', marginBottom: 44, overflow: 'hidden', borderRadius: 20, padding: 28 }}
        >
          <div style={{ position: 'absolute', right: -60, top: -60, width: 180, height: 180, borderRadius: '50%', background: 'rgba(168,197,224,0.08)', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 18, borderBottom: `0.5px solid ${C.line}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  display: 'flex', height: 44, width: 44, alignItems: 'center', justifyContent: 'center',
                  borderRadius: 12, background: C.grad, color: '#fff',
                }}
              >
                <span className="material-symbols-outlined" aria-hidden>tune</span>
              </span>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>基准参数输入</h2>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>填写执行基础信息 · AI 据此生成三阶段执行计划</p>
              </div>
            </div>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                borderRadius: 9999, padding: '4px 12px',
                background: 'rgba(168,197,224,0.18)', color: C.ikb,
                fontSize: 12, fontWeight: 600, fontFamily: F.mono,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: C.ikb }} />
              参数就绪
            </span>
          </div>
          <div style={{ position: 'relative' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
              {/* 目标平台 */}
              <div role="radiogroup" aria-label="目标平台">
                <span style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, letterSpacing: '0.04em', color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
                  <span style={{ display: 'inline-block', width: 4, height: 14, borderRadius: 2, background: C.grad, flexShrink: 0 }} />
                  目标平台
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                  {PLATFORMS.map((p) => {
                    const active = platform === p.key;
                    return (
                      <motion.button
                        type="button"
                        key={p.key}
                        role="radio"
                        aria-checked={active}
                        aria-label={`目标平台：${p.label}`}
                        onClick={() => setPlatform(p.key)}
                        whileHover={{ y: -3 }}
                        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                        style={{
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          overflow: 'hidden',
                          borderRadius: 14,
                          border: active ? `0.5px solid rgba(168,197,224,0.6)` : `0.5px solid ${C.line}`,
                          background: active ? 'rgba(168,197,224,0.18)' : 'rgba(255,255,255,0.07)',
                          backdropFilter: 'blur(12px)',
                          padding: 14,
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ display: 'flex', height: 40, width: 40, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: p.color, color: '#fff' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 22 }} aria-hidden>{p.icon}</span>
                        </span>
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{p.label}</span>
                          <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{p.desc}</span>
                        </span>
                        <span
                          style={{
                            position: 'absolute', right: 10, top: 10,
                            display: 'flex', height: 16, width: 16, alignItems: 'center', justifyContent: 'center',
                            borderRadius: '50%',
                            background: active ? C.grad : 'transparent',
                            border: active ? 'none' : `0.5px solid ${C.line}`,
                            color: active ? '#fff' : 'transparent',
                          }}
                          aria-hidden
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>check</span>
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* 核心转化目标 */}
              <div role="radiogroup" aria-label="核心转化目标">
                <span style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
                  <span style={{ display: 'inline-block', width: 4, height: 14, borderRadius: 2, background: C.grad, flexShrink: 0 }} />
                  核心转化目标
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                  {GOAL_OPTIONS.map((g) => {
                    const active = goal === g.key;
                    return (
                      <motion.button
                        type="button"
                        key={g.key}
                        role="radio"
                        aria-checked={active}
                        aria-label={`转化目标：${g.label}`}
                        onClick={() => setGoal(g.key)}
                        whileHover={{ y: -3 }}
                        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                        style={{
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          overflow: 'hidden',
                          borderRadius: 14,
                          border: active ? `0.5px solid rgba(168,197,224,0.6)` : `0.5px solid ${C.line}`,
                          background: active ? 'rgba(168,197,224,0.18)' : 'rgba(255,255,255,0.07)',
                          backdropFilter: 'blur(12px)',
                          padding: 14,
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <span
                          style={{
                            display: 'flex', height: 40, width: 40, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 10,
                            background: active ? C.grad : 'rgba(255,255,255,0.10)',
                            color: active ? '#fff' : 'rgba(255,255,255,0.84)',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 22 }} aria-hidden>{g.icon}</span>
                        </span>
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{g.label}</span>
                          <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{g.desc}</span>
                        </span>
                        <span
                          style={{
                            position: 'absolute', right: 10, top: 10,
                            display: 'flex', height: 16, width: 16, alignItems: 'center', justifyContent: 'center',
                            borderRadius: '50%',
                            background: active ? C.grad : 'transparent',
                            border: active ? 'none' : `0.5px solid ${C.line}`,
                            color: active ? '#fff' : 'transparent',
                          }}
                          aria-hidden
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>check</span>
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* 目标体量 */}
              <div>
                <label
                  htmlFor="s4-follower-count"
                  style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}
                >
                  <span style={{ display: 'inline-block', width: 4, height: 14, borderRadius: 2, background: C.grad, flexShrink: 0 }} />
                  目标体量 (关注者/用户)
                </label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'rgba(255,255,255,0.84)', pointerEvents: 'none' }} aria-hidden>group_add</span>
                  <input
                    id="s4-follower-count"
                    type="text"
                    value={followerCount}
                    onChange={(e) => setFollowerCount(e.target.value)}
                    placeholder="如：1万 / 10万 / 100万"
                    style={{
                      width: '100%',
                      borderRadius: 12,
                      border: `0.5px solid ${C.line}`,
                      background: 'rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(8px)',
                      padding: '12px 12px 12px 40px',
                      fontSize: 14,
                      color: C.ink,
                      fontFamily: F.cn,
                      outline: 'none',
                      boxSizing: 'border-box',
                      textShadow: C.textShadow,
                    }}
                    onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.boxShadow = `0 0 0 2px rgba(168,197,224,0.5)`; }}
                    onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.boxShadow = ''; }}
                  />
                </div>
              </div>

              {/* 个人背景 */}
              <div>
                <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label
                    htmlFor="s4-personal-info"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}
                  >
                    <span style={{ display: 'inline-block', width: 4, height: 14, borderRadius: 2, background: C.grad, flexShrink: 0 }} />
                    个人背景 <span style={{ marginLeft: 4, fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.8)' }}>(可选)</span>
                  </label>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: C.burgundyText }} aria-hidden>auto_awesome</span>
                    AI 据此定制执行策略
                  </span>
                </div>
                <div
                  style={{
                    overflow: 'hidden',
                    borderRadius: 14,
                    border: `0.5px solid ${C.line}`,
                    background: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(8px)',
                  }}
                  onFocus={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 2px rgba(168,197,224,0.5)`; }}
                  onBlur={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
                >
                  <textarea
                    id="s4-personal-info"
                    value={personalInfo}
                    onChange={(e) => setPersonalInfo(e.target.value)}
                    rows={5}
                    placeholder="输入你的创业经历、行业背景、擅长领域等，AI 将据此生成更精准的执行路径"
                    style={{
                      width: '100%',
                      resize: 'none',
                      border: 0,
                      background: 'transparent',
                      padding: 16,
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: C.ink,
                      fontFamily: F.cn,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      borderTop: `0.5px solid ${C.line}`,
                      padding: '8px 16px',
                      background: 'rgba(255,255,255,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>可包含</span>
                      {['经历', '行业', '优势', '目标', '资源'].map((t) => (
                        <span
                          key={t}
                          style={{
                            borderRadius: 9999,
                            padding: '2px 10px',
                            fontSize: 11,
                            fontWeight: 500,
                            background: 'rgba(168,197,224,0.18)',
                            color: C.ikb,
                            fontFamily: F.mono,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <span style={{ flexShrink: 0, fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.mono }}>{personalInfo.length} 字</span>
                  </div>
                </div>
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                  <Magnetic strength={0.3}>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="lg-gradbtn"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        borderRadius: 9999,
                        padding: '12px 32px',
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#fff',
                        border: 'none',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.4 : 1,
                        fontFamily: F.cn,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden>rocket_launch</span>
                      {isLoading ? '生成中…' : STEP4_BUTTON_GENERATE}
                    </button>
                  </Magnetic>
                </div>
              </div>
            </form>
          </div>
        </section>
      </Reveal>

      {/* ── KPI 卡一排 ─────────────────────────────────────── */}
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 44 }}>
        {/* 任务总数 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 18, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.22)', color: C.ikb }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden>task_alt</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, borderRadius: 9999, padding: '2px 8px', background: 'rgba(168,197,224,0.18)', color: C.ikb, fontSize: 11, fontWeight: 700, fontFamily: F.mono }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13 }} aria-hidden>trending_up</span>全覆盖
              </span>
            </div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow, margin: 0 }}>
                  {allScheduleItems.length}
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, marginLeft: 3 }}> 项</span>
                </p>
                <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: '6px 0 0' }}>任务总数</p>
              </div>
              <div style={{ height: 48, width: 48, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%' }} role="img" aria-label="任务覆盖率 83%">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(168,197,224,0.2)" strokeWidth="3.5" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke={C.ikb} strokeWidth="3.5" strokeLinecap="round" strokeDasharray="83 100" />
                </svg>
              </div>
            </div>
          </motion.div>
        </Item>

        {/* 执行周期 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 18, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: C.burgundyText }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden>date_range</span>
              </span>
              <span style={{ borderRadius: 9999, padding: '2px 8px', background: 'rgba(255,255,255,0.12)', color: C.burgundyText, fontSize: 11, fontWeight: 700, fontFamily: F.mono }}>三阶段</span>
            </div>
            <p style={{ marginTop: 14, fontSize: 30, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow, margin: '14px 0 0' }}>
              {generated.phases.length}
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, marginLeft: 3 }}> 周期</span>
            </p>
            <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>执行周期</p>
            <div style={{ marginTop: 12, display: 'flex', height: 22, alignItems: 'flex-end', gap: 3 }}>
              {[45, 72, 60, 88, 95].map((h, i) => (
                <div key={i} style={{ flex: 1, borderRadius: '3px 3px 0 0', height: `${h}%`, background: 'rgba(255,255,255,0.35)' }} />
              ))}
            </div>
          </motion.div>
        </Item>

        {/* 里程碑数 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 18, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.18)', color: C.accent3 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden>flag</span>
              </span>
              <span style={{ borderRadius: 9999, padding: '2px 8px', background: 'rgba(168,197,224,0.15)', color: C.purpleText, fontSize: 11, fontWeight: 700, fontFamily: F.mono }}>里程碑</span>
            </div>
            <p style={{ marginTop: 14, fontSize: 30, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
              {generated.phases.reduce((sum, ph) => sum + ph.milestones.length, 0)}
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, marginLeft: 3 }}> 个</span>
            </p>
            <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>里程碑节点</p>
            <div style={{ marginTop: 12, height: 6, width: '100%', borderRadius: 9999, background: 'rgba(168,197,224,0.15)' }}>
              <div style={{ height: 6, width: '78%', borderRadius: 9999, background: `linear-gradient(to right, ${C.accent3}, ${C.ikb})` }} />
            </div>
          </motion.div>
        </Item>

        {/* 避坑预警数 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 18, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.22)', color: C.ikb }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden>shield</span>
              </span>
              <span style={{ borderRadius: 9999, padding: '2px 8px', background: 'rgba(168,197,224,0.18)', color: C.ikb, fontSize: 11, fontWeight: 700, fontFamily: F.mono }}>
                {generated.warnings.length} 项
              </span>
            </div>
            <p style={{ marginTop: 14, fontSize: 30, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
              {generated.warnings.length}
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, marginLeft: 3 }}> 项</span>
            </p>
            <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>避坑预警</p>
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {['完播率', '引流', '直播'].map((k) => (
                <span key={k} style={{ borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 500, background: 'rgba(168,197,224,0.18)', color: C.ikb, fontFamily: F.mono }}>{k}</span>
              ))}
            </div>
          </motion.div>
        </Item>
      </RevealGroup>

      {/* ── 总览区块 ─────────────────────────────────────────── */}
      <Reveal>
        <section style={{ marginBottom: 44 }}>
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }} aria-hidden>summarize</span>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>执行总览</h2>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>· 核心目标 · 阶段规划 · 平台策略</span>
          </div>
          <div className="lg-glass" style={{ borderRadius: 20, padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  { label: '当前阶段', value: generated.overview.currentStage },
                  { label: '总体时间线', value: generated.overview.timeline },
                  { label: '主攻平台', value: generated.overview.mainPlatform },
                ].map((item) => (
                  <div key={item.label}>
                    <p style={{ marginBottom: 4, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: C.ikb, fontFamily: F.mono }}>{item.label}</p>
                    <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', fontFamily: F.cn, margin: 0 }}>{item.value}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  { label: '核心目标', value: generated.overview.coreGoal },
                  { label: '核心优势', value: generated.overview.coreAdvantages },
                ].map((item) => (
                  <div key={item.label}>
                    <p style={{ marginBottom: 4, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: C.burgundyText, fontFamily: F.mono }}>{item.label}</p>
                    <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', fontFamily: F.cn, margin: 0 }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── 三阶段完整展开 ────────────────────────────────────── */}
      <section style={{ marginBottom: 44 }}>
        <Reveal>
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }} aria-hidden>timeline</span>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>三阶段执行路径</h2>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>· 每日任务 · 里程碑 · 内容计划 · KPI</span>
          </div>
        </Reveal>
        <RevealGroup style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {generated.phases.map((phase) => {
            const phaseAccent = PHASE_COLORS[(phase.number - 1) % PHASE_COLORS.length] as string;
            const phaseAccentText = PHASE_TEXT_COLORS[(phase.number - 1) % PHASE_TEXT_COLORS.length] as string;
            return (
              <Item key={phase.number}>
                <div className="lg-glass" style={{ overflow: 'hidden', borderRadius: 20 }}>
                  {/* Phase header */}
                  <div
                    style={{
                      padding: '16px 24px',
                      borderBottom: `2px solid ${phaseAccent}`,
                      background: 'rgba(168,197,224,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center',
                        borderRadius: 10, fontSize: 15, fontWeight: 700, color: '#fff',
                        background: phaseAccent.startsWith('rgba') ? 'rgba(168,197,224,0.5)' : phaseAccent,
                      }}
                    >
                      {phase.number}
                    </span>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>{phase.title}</h3>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>{phase.weekRange} · {phase.goal}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 22, padding: 24 }}>
                    {/* 每日任务 */}
                    <div>
                      <p style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: phaseAccentText, fontFamily: F.cn }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden>checklist</span>
                        每日任务
                      </p>
                      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
                        {phase.dailyTasks.map((task, ti) => (
                          <Item key={ti} style={{ height: '100%' }}>
                            <motion.div
                              whileHover={{ y: -2 }}
                              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                                borderRadius: 12,
                                border: `0.5px solid ${C.line}`,
                                background: 'rgba(255,255,255,0.06)',
                                padding: 12,
                              }}
                            >
                              <div>
                                <p style={{ fontSize: 11, fontWeight: 700, color: phaseAccentText, fontFamily: F.mono, margin: 0 }}>{task.day}</p>
                                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.84)', fontFamily: F.mono, margin: '2px 0 0' }}>{task.duration}</p>
                              </div>
                              <div style={{ marginTop: 'auto' }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>{task.title}</p>
                                <p style={{ marginTop: 4, fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: '4px 0 0' }}>{task.desc}</p>
                              </div>
                            </motion.div>
                          </Item>
                        ))}
                      </RevealGroup>
                    </div>

                    {/* 里程碑 */}
                    <div>
                      <p style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: phaseAccentText, fontFamily: F.cn }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden>flag</span>
                        里程碑
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {phase.milestones.map((m, mi) => (
                          <div
                            key={mi}
                            style={{
                              borderRadius: 12,
                              border: `0.5px solid ${C.line}`,
                              background: 'rgba(255,255,255,0.06)',
                              padding: 12,
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 12,
                            }}
                          >
                            <span
                              style={{
                                marginTop: 2, flexShrink: 0, borderRadius: 8,
                                border: `0.5px solid rgba(168,197,224,0.35)`,
                                padding: '2px 8px',
                                fontSize: 11, fontWeight: 700,
                                color: phaseAccentText,
                                background: 'rgba(168,197,224,0.12)',
                                fontFamily: F.mono,
                              }}
                            >
                              {m.week}
                            </span>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 600, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>{m.goal}</p>
                              {m.criteria && (
                                <p style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: '4px 0 0' }}>验收：{m.criteria}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 内容计划 */}
                    <div>
                      <p style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: phaseAccentText, fontFamily: F.cn }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden>edit_calendar</span>
                        内容计划
                      </p>
                      <div
                        style={{
                          borderRadius: 12,
                          border: `0.5px solid ${C.line}`,
                          background: 'rgba(255,255,255,0.06)',
                          padding: 16,
                        }}
                      >
                        <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, fontFamily: F.cn }}>
                          <span style={{ color: 'rgba(255,255,255,0.84)' }}>
                            每周发布：<span style={{ fontWeight: 700, color: phaseAccentText }}>{phase.contentPlan.frequency}</span>
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.84)' }}>
                            最佳时间：<span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{phase.contentPlan.bestTime}</span>
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {phase.contentPlan.categories.map((cat, ci) => {
                            const bgOpacity = ci % 3 === 0 ? 'rgba(168,197,224,0.10)' : ci % 3 === 1 ? 'rgba(255,255,255,0.08)' : 'rgba(168,197,224,0.08)';
                            const borderColor = ci % 3 === 0 ? 'rgba(168,197,224,0.25)' : ci % 3 === 1 ? 'rgba(255,255,255,0.15)' : 'rgba(168,197,224,0.20)';
                            return (
                              <div key={ci} style={{ borderRadius: 10, border: `0.5px solid ${borderColor}`, background: bgOpacity, padding: '8px 12px', fontSize: 12 }}>
                                <span style={{ fontWeight: 600, color: C.ink, fontFamily: F.cn }}>{cat.name}</span>
                                <span style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}> — {cat.desc}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* KPI */}
                    <div>
                      <p style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: phaseAccentText, fontFamily: F.cn }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden>bar_chart</span>
                        KPI 指标
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {phase.kpis.map((kpi, ki) => (
                          <motion.div
                            key={ki}
                            whileHover={{ y: -3 }}
                            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                            style={{
                              borderRadius: 12,
                              border: `0.5px solid ${C.line}`,
                              background: 'rgba(255,255,255,0.07)',
                              padding: 12,
                            }}
                          >
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>{kpi.name}</p>
                            <p style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2, color: phaseAccentText, fontFamily: F.display, margin: '4px 0 0', textShadow: C.textShadow }}>{kpi.target}</p>
                            <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: phaseAccent.startsWith('rgba') ? 'rgba(255,255,255,0.72)' : phaseAccent }} />
                              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.84)', fontFamily: F.mono, margin: 0 }}>基准：{kpi.baseline}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Item>
            );
          })}
        </RevealGroup>
      </section>

      {/* ── 执行任务序列 table ──────────────────────────────── */}
      <Reveal>
        <div className="lg-glass" style={{ marginBottom: 24, overflow: 'hidden', borderRadius: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `2px solid ${C.ikb}`,
              background: 'rgba(168,197,224,0.08)',
              padding: '16px 24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.22)', color: C.ikb }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden>format_list_numbered</span>
              </span>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>执行任务序列</h3>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>日程表 · 全周期 {allScheduleItems.length} 项核心动作</p>
              </div>
            </div>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                borderRadius: 9999, padding: '4px 12px',
                background: 'rgba(168,197,224,0.15)', color: C.purpleText,
                fontSize: 12, fontWeight: 600, fontFamily: F.mono,
              }}
            >
              <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: C.accent3 }} />
              执行中
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', fontSize: 14, fontFamily: F.cn, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `0.5px solid ${C.line}`, background: 'rgba(255,255,255,0.04)' }}>
                  {['周期', '核心动作', '量化产出', '状态', '验收'].map((h, hi) => (
                    <th
                      key={h}
                      style={{
                        padding: '14px 24px',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase' as const,
                        color: 'rgba(255,255,255,0.8)',
                        fontFamily: F.mono,
                        width: hi === 0 ? 96 : hi === 3 ? 128 : hi === 4 ? 80 : undefined,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allScheduleItems.map((item, idx) => (
                  <tr
                    key={`${item.time}-${idx}`}
                    style={{ borderTop: `0.5px solid ${C.line}`, background: idx % 2 === 1 ? 'rgba(255,255,255,0.03)' : 'transparent', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(168,197,224,0.08)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 1 ? 'rgba(255,255,255,0.03)' : 'transparent'; }}
                  >
                    <td style={{ padding: '14px 24px', fontSize: 12, fontWeight: 700, color: C.ikb, fontFamily: F.mono }}>
                      {`D-${String(idx + 1).padStart(2, '0')}`}
                    </td>
                    <td style={{ padding: '14px 24px', fontWeight: 600, color: C.ink, textShadow: C.textShadow }}>{item.title}</td>
                    <td style={{ padding: '14px 24px', color: 'rgba(255,255,255,0.84)' }}>{item.desc.slice(0, 60)}…</td>
                    <td style={{ padding: '14px 24px' }}>
                      <StatusBadge status={getStatus(idx)} />
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <button
                        type="button"
                        style={{
                          display: 'flex', height: 26, width: 26, alignItems: 'center', justifyContent: 'center',
                          borderRadius: 8, border: `0.5px solid ${C.line}`,
                          background: 'transparent', color: 'rgba(255,255,255,0.84)', cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        aria-label={`验收：${item.title}`}
                        onMouseEnter={(e) => { const b = e.currentTarget; b.style.background = C.ikb; b.style.color = '#fff'; b.style.borderColor = C.ikb; }}
                        onMouseLeave={(e) => { const b = e.currentTarget; b.style.background = 'transparent'; b.style.color = 'rgba(255,255,255,0.84)'; b.style.borderColor = C.line; }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden>check</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: `0.5px solid ${C.line}`, padding: '10px 24px', background: 'rgba(255,255,255,0.03)' }}>
            <button
              type="button"
              style={{ fontSize: 13, fontWeight: 600, color: C.ikb, fontFamily: F.cn, background: 'transparent', border: 'none', cursor: 'pointer' }}
              aria-label="查看完整周期"
            >
              查看完整周期 →
            </button>
          </div>
        </div>
      </Reveal>

      {/* ── 避坑预警 + 成功标准 ────────────────────────────── */}
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 44 }}>
        {/* 避坑预警 */}
        <Item>
          <div className="lg-glass" style={{ borderRadius: 20, padding: 24 }}>
            <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
              <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: C.burgundyText }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden>warning</span>
              </span>
              避坑预警
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {generated.warnings.map((w, wi) => {
                const even = wi % 2 === 0;
                return (
                  <motion.div
                    key={w.signal}
                    whileHover={{ y: -3 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                    style={{
                      borderRadius: 14,
                      border: `0.5px solid ${even ? 'rgba(255,255,255,0.22)' : 'rgba(168,197,224,0.28)'}`,
                      background: even ? 'rgba(255,255,255,0.08)' : 'rgba(168,197,224,0.08)',
                      padding: 16,
                    }}
                  >
                    <div style={{ marginBottom: 4, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ marginTop: 2, flexShrink: 0, fontSize: 16, color: even ? C.burgundyText : C.accent3 }} aria-hidden>error_outline</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{w.signal}</span>
                    </div>
                    <p style={{ marginBottom: 4, paddingLeft: 24, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: '4px 0' }}>{w.meaning}</p>
                    <p style={{ paddingLeft: 24, fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn, margin: 0 }}>
                      <span style={{ fontWeight: 600, color: even ? C.burgundyText : C.purpleText }}>方案：</span>
                      {w.solution}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </Item>

        {/* 成功标准 */}
        <Item>
          <div className="lg-glass" style={{ borderRadius: 20, padding: 24 }}>
            <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
              <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.22)', color: C.ikb }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden>check_circle</span>
              </span>
              成功标准
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {generated.successCriteria.map((sc, si) => {
                const textArr = [C.ikb, C.purpleText, C.burgundyText];
                const scText = textArr[si % textArr.length] as string;
                return (
                  <motion.div
                    key={sc.period}
                    whileHover={{ y: -3 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      borderRadius: 14,
                      border: `0.5px solid rgba(168,197,224,0.25)`,
                      background: 'rgba(168,197,224,0.08)',
                      padding: 16,
                    }}
                  >
                    <span
                      style={{
                        marginTop: 2, flexShrink: 0, borderRadius: 8,
                        border: `0.5px solid rgba(168,197,224,0.35)`,
                        padding: '2px 8px',
                        fontSize: 11, fontWeight: 700,
                        color: scText,
                        background: 'rgba(168,197,224,0.15)',
                        fontFamily: F.mono,
                      }}
                    >
                      {sc.period}
                    </span>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontFamily: F.cn, margin: 0 }}>{sc.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </Item>
      </RevealGroup>

      {/* ── 数据洞察(雷达 + 趋势)──────────────────────────── */}
      <Reveal>
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }} aria-hidden>insights</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>数据洞察</h2>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>· AI 综合评估 · 实时测算</span>
          <span
            style={{
              marginLeft: 'auto',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              borderRadius: 9999, padding: '4px 12px',
              background: 'rgba(168,197,224,0.18)', color: C.ikb,
              fontSize: 12, fontWeight: 600, fontFamily: F.mono,
            }}
          >
            <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: C.ikb }} />
            模型已就绪
          </span>
        </div>
      </Reveal>
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 24, marginBottom: 44 }}>
        {/* 执行健康度雷达 */}
        <Item>
          <div className="lg-glass" style={{ borderRadius: 20, padding: 24 }}>
            <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.22)', color: C.ikb }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden>radar</span>
                </span>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>执行健康度雷达</h3>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>六维模型评估</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p
                  style={{
                    fontSize: 26, fontWeight: 700, lineHeight: 1, margin: 0,
                    background: C.grad, WebkitBackgroundClip: 'text', backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent', color: 'transparent', fontFamily: F.display,
                  }}
                >
                  83
                </p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontFamily: F.mono, margin: 0 }}>综合分</p>
              </div>
            </div>
            {(() => {
              const dims = RADAR_DIMS_S4;
              const cx = 130; const cy = 122; const R = 88;
              const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
              const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
              const poly = (r: number) => dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
              const dataPoly = dims.map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');
              return (
                <svg viewBox="0 0 260 244" style={{ width: '100%' }} role="img" aria-label="执行健康度雷达图">
                  <defs>
                    <linearGradient id="s4-radarFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                      <stop offset="100%" stopColor="rgba(168,197,224,0.1)" stopOpacity="0.12" />
                    </linearGradient>
                  </defs>
                  {[0.25, 0.5, 0.75, 1].map((f) => (
                    <polygon key={f} points={poly(R * f)} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  ))}
                  {dims.map((_, i) => {
                    const [x, y] = pt(i, R);
                    return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
                  })}
                  <polygon points={dataPoly} fill="url(#s4-radarFill)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
                  {dims.map((d, i) => {
                    const [x, y] = pt(i, R * (d.value / 100));
                    return <circle key={i} cx={x} cy={y} r="3.2" fill="rgba(255,255,255,0.9)" stroke={d.color} strokeWidth="2" />;
                  })}
                  {dims.map((d, i) => {
                    const [x, y] = pt(i, R + 16);
                    return (
                      <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.65)" fontSize="10.5" fontWeight="600">
                        {d.label}
                      </text>
                    );
                  })}
                </svg>
              );
            })()}
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {RADAR_DIMS_S4.map((d) => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{d.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: F.mono }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Item>

        {/* 累计完成度预估 */}
        <Item>
          <div className="lg-glass" style={{ borderRadius: 20, padding: 24 }}>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: C.burgundyText }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden>show_chart</span>
                </span>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>累计完成度预估</h3>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>按当前执行计划测算</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {['进度', '里程碑', '复盘'].map((t, i) => (
                  <span
                    key={t}
                    style={{
                      borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 600, fontFamily: F.mono,
                      background: i === 0 ? C.grad : 'rgba(255,255,255,0.10)',
                      color: i === 0 ? '#fff' : 'rgba(255,255,255,0.84)',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              <p style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow, margin: 0 }}>100%</p>
              <span style={{ marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 3, borderRadius: 9999, padding: '2px 8px', fontSize: 12, fontWeight: 700, background: 'rgba(168,197,224,0.18)', color: C.ikb }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden>trending_up</span>+{generated.phases.length * 3} 阶段
              </span>
              <span style={{ marginBottom: 4, fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>第9周完成</span>
            </div>
            {(() => {
              const data = TREND_DATA_S4;
              const W = 560; const H = 168;
              const padL = 6; const padR = 6; const padT = 12; const padB = 8;
              const innerW = W - padL - padR; const innerH = H - padT - padB;
              const max = 110;
              const x = (i: number) => padL + (innerW * i) / (data.length - 1);
              const y = (v: number) => padT + innerH * (1 - v / max);
              const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
              const area = `${line} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
              return (
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }} role="img" aria-label="累计完成度趋势图">
                  <defs>
                    <linearGradient id="s4-trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.ikb} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="s4-trendLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={C.ikb} />
                      <stop offset="55%" stopColor={C.accent3} />
                      <stop offset="100%" stopColor={C.burgundyText} />
                    </linearGradient>
                  </defs>
                  {[0, 0.33, 0.66, 1].map((f) => (
                    <line key={f} x1={padL} x2={W - padR} y1={(padT + innerH * f).toFixed(1)} y2={(padT + innerH * f).toFixed(1)} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                  ))}
                  <path d={area} fill="url(#s4-trendFill)" />
                  <path d={line} fill="none" stroke="url(#s4-trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {data.map((v, i) => i % 2 === 0 ? <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="rgba(255,255,255,0.9)" stroke={C.ikb} strokeWidth="2" /> : null)}
                </svg>
              );
            })()}
            <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', paddingInline: 4, fontSize: 10, color: 'rgba(255,255,255,0.84)', fontFamily: F.mono }}>
              {TREND_LABELS_S4.map((m) => <span key={m}>{m}</span>)}
            </div>
          </div>
        </Item>
      </RevealGroup>

      {/* ── Footer actions ──────────────────────────────────── */}
      <Reveal>
        <div className="lg-glass" style={{ marginTop: 24, borderRadius: 20, padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            {/* Feedback */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>这个结果对你有帮助吗？</span>
              <motion.button
                type="button"
                onClick={handleFeedbackUp}
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{
                  display: 'flex', height: 34, width: 34, alignItems: 'center', justifyContent: 'center',
                  borderRadius: 10, border: `0.5px solid ${C.line}`,
                  background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                aria-label="有帮助"
                onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(168,197,224,0.25)'; b.style.color = C.ikb; b.style.borderColor = 'rgba(168,197,224,0.5)'; }}
                onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(255,255,255,0.08)'; b.style.color = 'rgba(255,255,255,0.7)'; b.style.borderColor = C.line; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden>thumb_up</span>
              </motion.button>
              <motion.button
                type="button"
                onClick={handleFeedbackDown}
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{
                  display: 'flex', height: 34, width: 34, alignItems: 'center', justifyContent: 'center',
                  borderRadius: 10, border: `0.5px solid ${C.line}`,
                  background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                aria-label="没帮助"
                onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(255,255,255,0.14)'; b.style.color = C.ink; }}
                onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(255,255,255,0.08)'; b.style.color = 'rgba(255,255,255,0.7)'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden>thumb_down</span>
              </motion.button>
            </div>

            {/* Next step */}
            <motion.button
              type="button"
              onClick={handleNextStep}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                borderRadius: 14, padding: '12px 26px',
                fontSize: 14, fontWeight: 600, color: '#fff',
                background: C.grad, border: 'none', cursor: 'pointer',
                fontFamily: F.cn, textShadow: '0 1px 3px rgba(8,20,48,0.4)',
              }}
            >
              继续下一步：变现路径
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden>arrow_forward</span>
            </motion.button>
          </div>
        </div>
      </Reveal>
    </LiquidShell>
  );
}

// Suppress unused import — Step4Phase type is used in Step4Result.phases
void (0 as unknown as Step4Phase);
