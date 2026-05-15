/**
 * privateDomain router — PRD-15 US-005
 * AC-3: generate accepts 6 config fields (productDescription/productPrice/targetAudience/ipPositioning/currentChannel/monthlyTraffic)
 * AC-4: mutation writes History row + returns 6-phase SOP mock content
 * AC-8: PrivateDomainAgent SSE streaming留 PRD-16+ · 本版返回 mock 6 阶段结构化 SOP
 */

import { Decimal } from '@prisma/client/runtime/library';
import { z } from 'zod';

import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';

import type { Prisma } from '@prisma/client';

const generatePrivateDomainInput = z.object({
  productDescription: z.string().min(1).max(1000),
  productPrice: z.number().positive(),
  targetAudience: z.string().min(1).max(500),
  ipPositioning: z.string().min(1).max(500),
  currentChannel: z.enum(['wechat', 'douyin', 'xiaohongshu', 'weibo', 'other']),
  monthlyTraffic: z.number().int().min(0),
});

const HISTORY_SELECT = {
  id: true,
  content: true,
  agentId: true,
  traceId: true,
  createdAt: true,
} satisfies Prisma.HistorySelect;

const PHASE_NAMES: Record<string, string> = {
  attract: '引流获客',
  add_wechat: '加微转化',
  trust: '信任建立',
  moments: '朋友圈打造',
  convert: '成交转化',
  repurchase: '复购裂变',
};

function buildMockSop(input: z.infer<typeof generatePrivateDomainInput>): string {
  const phases = [
    {
      key: 'attract',
      name: PHASE_NAMES.attract,
      goal: `通过${input.currentChannel}内容吸引${input.targetAudience}关注`,
      tactics: ['发布痛点解决内容', '使用热门话题标签', '合作博主互推'],
      scripts: [`"如果你是${input.targetAudience}，这个问题一定困扰过你…"`, `"${input.productDescription}，专为你设计"`],
      metrics: ['每日新增关注量', '内容互动率(>3%)', '主页访问转化率'],
    },
    {
      key: 'add_wechat',
      name: PHASE_NAMES.add_wechat,
      goal: '将平台粉丝引导至微信私域',
      tactics: ['私信发送福利钩子', '评论区引导加微', '直播间加微活动'],
      scripts: ['"加我微信，免费领取[产品资料包]"', '"仅限今天，加微好友享受专属优惠"'],
      metrics: ['加微转化率(>5%)', '每日新增微信好友数', '钩子内容点击率'],
    },
    {
      key: 'trust',
      name: PHASE_NAMES.trust,
      goal: '建立专业信任感，培育购买意愿',
      tactics: ['每日分享行业干货', '客户成功案例展示', '专业认证展示'],
      scripts: ['"今天给大家分享一个我服务客户的真实案例…"', '"做了X年，踩过这些坑，现在教你避开"'],
      metrics: ['消息回复率(>40%)', '朋友圈互动率', '内容保存/转发率'],
    },
    {
      key: 'moments',
      name: PHASE_NAMES.moments,
      goal: '打造专业+真实的朋友圈人设',
      tactics: ['3:4:3法则(干货:生活:产品)', '每日固定发圈时间', '视频号配合增强信任'],
      scripts: ['"今天帮客户解决了一个问题，复盘一下思路…"', '"客户反馈来了，这个结果让我特别开心"'],
      metrics: ['朋友圈点赞互动量', '好友屏蔽率(<2%)', '置顶朋友圈查看次数'],
    },
    {
      key: 'convert',
      name: PHASE_NAMES.convert,
      goal: `完成${input.productDescription}销售，目标客单价¥${input.productPrice}`,
      tactics: ['限时限量活动设计', '一对一需求诊断', '群内成交活动'],
      scripts: ['"针对你的情况，我建议从这个方向入手…"', `"现在购买只需¥${input.productPrice}，还额外赠送…"`],
      metrics: [`成交转化率(>8%)`, '客单价达标率', '成交周期(目标<7天)'],
    },
    {
      key: 'repurchase',
      name: PHASE_NAMES.repurchase,
      goal: '实现复购与裂变，降低获客成本',
      tactics: ['老客户专属福利', '转介绍激励机制', '会员体系设计'],
      scripts: ['"感谢你的信任，作为老客户你将获得…"', '"推荐一位朋友，你和朋友都能享受…"'],
      metrics: ['复购率(目标>30%)', '转介绍率(>20%)', '客户LTV增长'],
    },
  ];

  return JSON.stringify({
    phases,
    summary: `${input.targetAudience}私域成交SOP已生成，月流量${input.monthlyTraffic}，IP定位：${input.ipPositioning}`,
  });
}

export const privateDomainRouter = router({
  generate: protectedProcedure
    .input(generatePrivateDomainInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;
      const t0 = Date.now();
      const sopContent = buildMockSop(input);
      const inputSummary = `${input.productDescription.slice(0, 50)} · ¥${input.productPrice} · ${input.targetAudience.slice(0, 30)}`;
      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'PrivateDomainAgent',
          sourceType: 'user',
          inputSummary,
          content: sopContent,
          traceId: traceId ?? null,
        },
        select: HISTORY_SELECT,
      });
      // AC-8: cost_log write — mock values (real SSE留 PRD-16+)
      await prisma.costLog.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'PrivateDomainAgent',
          callType: 'specialist_call',
          modelTier: 'mock',
          modelUsed: 'mock',
          provider: 'mock',
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          costUsd: new Decimal('0.000000'),
          durationMs: Date.now() - t0,
          traceId: traceId ?? null,
        },
      });
      return row;
    }),
});
