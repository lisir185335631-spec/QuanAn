/**
 * PrivateDomain.tsx — /tools/private-domain 私域成交流程 · PRD-29.13
 * 1:1 字面复刻 aiipznt sally zhao 真实输出
 * 6 chip scenario tabs + form + 5 output section + KPI + footer · ~80 字段
 *
 * 旧版 PrivateDomain*View 组件保留 @deprecated · 不再 import
 */

import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  PrivateDomainScenarioTabs,
  type PrivateDomainScenario,
  type PrivateDomainScenarioId,
} from './components/PrivateDomainScenarioTabs';
import { PrivateDomainScriptListSection } from './components/PrivateDomainScriptListSection';
import { PrivateDomainMomentsSection } from './components/PrivateDomainMomentsSection';
import { PrivateDomainSalesScriptSection } from './components/PrivateDomainSalesScriptSection';
import { PrivateDomainSopSection } from './components/PrivateDomainSopSection';

// ── types ─────────────────────────────────────────────────────────────────────

interface PrivateDomainResult {
  trafficScripts: {
    shortVideo: string[];
    commentInteraction: string[];
    dmGuidance: string[];
  };
  momentsScripts: {
    grass: string[];
    trust: string[];
    closing: string[];
    fission: string[];
  };
  salesScripts: {
    firstConsult: string[];
    objectionHandling: Array<{ objection: string; response: string }>;
    pushOrder: string[];
    afterSales: string[];
  };
  sop: Array<{
    day: string;
    title: string;
    goal: string;
    desc: string;
  }>;
  keyMetrics: string[];
}

interface PrivateDomainFormData {
  productName: string;
  targetUser: string;
  scenario: string;
}

// ── constants ─────────────────────────────────────────────────────────────────

const DEFAULT_FORM: PrivateDomainFormData = {
  productName: '护肤套装',
  targetUser: '25-35宝妈',
  scenario: '客户看了朋友圈后主动咨询、老客户3个月没复购',
};

const SCENARIOS: PrivateDomainScenario[] = [
  { id: 'welcome',    name: '欢迎话术', subtitle: '新好友添加后的第一印象话术',         icon: '♡' },
  { id: 'icebreaker', name: '破冰暖场', subtitle: '快速拉近距离，降低客户戒备',          icon: '💬' },
  { id: 'trust',      name: '信任建立', subtitle: '通过专业度和真诚建立深度信任',         icon: '🛡' },
  { id: 'discovery',  name: '需求挖掘', subtitle: '深入了解客户痛点和需求',               icon: '◎' },
  { id: 'closing',    name: '成交话术', subtitle: '把握时机促成订单转化',                  icon: '🎁' },
  { id: 'followup',   name: '售后跟进', subtitle: '提升满意度，引导复购和转介绍',          icon: '👥' },
];

// ── mock data (逐字复刻 aiipznt sally zhao) ───────────────────────────────────

function generateMockResult(): PrivateDomainResult {
  return {
    trafficScripts: {
      shortVideo: [
        '25岁后皮肤开始走下坡路？别慌，我用这套搞定细纹暗沉，素颜也敢出门。',
        '带娃熬夜脸垮了？3步焕亮秘籍，让你重回少女肌，老公都夸你变美了。',
        '还在花冤枉钱买大牌？这套平价好物，效果不输千元，真实反馈看评论区。',
      ],
      commentInteraction: [
        '想知道我素颜秘诀？点击主页，免费领【宝妈专属护肤手册】。',
        '皮肤暗沉、毛孔粗大？私信我，免费诊断皮肤问题，送你定制方案。',
        '想了解产品细节？加我微信，一对一解答，还有专属优惠等你。',
      ],
      dmGuidance: [
        '你好，很高兴你对护肤感兴趣。我是你的专属护肤顾问，有什么皮肤问题想解决吗？',
        '宝妈护肤不易，我为你准备了一份【高效护肤小技巧】，点击链接领取：[链接]',
        '为了更好地帮助你，可以简单描述下你的皮肤状况和主要困扰吗？',
      ],
    },

    momentsScripts: {
      grass: [
        '【干货】熬夜带娃皮肤差？这3个护肤误区，你踩雷了吗？正确方法让你事半功倍。',
        '【日常】忙碌一天，睡前给自己10分钟，享受护肤的仪式感，皮肤真的会爱上你。',
        '【好物分享】最近皮肤状态超好，全靠这套XX护肤品，细腻透亮，素颜自信出门。',
      ],
      trust: [
        '【客户反馈】@小雅妈妈：用了XX套装，痘印淡了，皮肤也水润了，真的推荐！',
        '【对比图】真实用户使用XX套装前后对比，皮肤光泽度提升，细纹明显改善。',
        '【专业解析】XX套装核心成分解析：[成分A]抗氧化，[成分B]深层补水，科学有效。',
      ],
      closing: [
        '【限时福利】XX套装，原价999，今天下单立减200，再送价值199的XX面膜！仅限前10名。',
        '【算账法】每天不到10块钱，就能拥有专业级护肤体验，告别皮肤困扰，这笔账怎么算都划算。',
      ],
      fission: [
        '【福利升级】成功推荐1位好友购买XX套装，你和好友各得XX赠品！多推多得。',
        '【社群活动】邀请3位宝妈进群，免费领取【XX护肤体验装】，还有护肤专家在线答疑。',
      ],
    },

    salesScripts: {
      firstConsult: [
        '（客户咨询朋友圈产品）你好，很高兴你对XX护肤套装感兴趣。这款套装专为25-35岁宝妈设计，能有效解决熬夜、压力导致的皮肤暗沉、干燥、细纹等问题。你目前主要想改善哪些方面呢？',
        '（老客户3个月未复购）[客户昵称]你好，我是你的专属护肤顾问。最近皮肤还好吗？上次你用的XX套装效果怎么样？我们最近上新了XX新品，或者XX套装有升级版，想给你推荐下。',
      ],
      objectionHandling: [
        {
          objection: '客户说：价格太贵了',
          response: '我理解你的顾虑。你算算，如果去美容院做一次护理至少要几百块，这套XX套装可以用2-3个月，平均每天不到10块钱。它能从根源改善你的皮肤问题，长期看比频繁去美容院更划算，效果也更持久。而且我们现在有活动，还能省下不少。',
        },
        {
          objection: '客户说：没时间护肤/太麻烦',
          response: '我懂你，宝妈时间确实紧张。这套XX套装设计得很精简，只需要早晚3分钟，就能完成基础护理。我们还附赠了【懒人护肤攻略】，教你如何高效利用碎片时间，效果一点不打折。你试试看，真的不费力。',
        },
        {
          objection: '客户说：担心没效果/过敏',
          response: '你的担心很有道理。我们产品成分都很温和，经过严格测试。如果你实在不放心，可以先申请小样试用，或者我们提供【30天无理由退款】服务，只要你不满意，全额退款。这样你没有任何风险，可以安心尝试。',
        },
      ],
      pushOrder: [
        '这款XX套装的优惠活动只到今晚12点，之后就恢复原价了。现在下单，不仅能省200元，还送价值199的面膜，错过真的可惜。',
        '我们这个月的XX套装库存不多了，目前只剩最后5套。很多宝妈都在抢，如果你想改善皮肤，建议尽快下单，以免断货。',
        '已经有3000多位宝妈通过XX套装改善了皮肤问题，效果都非常好。现在下单，我们还会赠送你一份【定制护肤方案】，帮你更快达成目标。',
      ],
      afterSales: [
        '（成交后）恭喜你做出正确的选择！你的XX套装已经发出，预计X天送达。收到后有任何使用问题，随时联系我，我会全程指导你。',
        '（使用一周后）[客户昵称]你好，XX套装用得怎么样？有没有觉得皮肤更水润了？有什么需要调整的，告诉我哦。',
        '（使用一月后）[客户昵称]你好，你的皮肤状态有明显改善吗？我这里有一些更进阶的护肤小技巧，想分享给你，让效果更好。',
      ],
    },

    sop: [
      {
        day: 'Day 1',
        title: '客户主动咨询/老客户触达',
        goal: '建立初步信任，获取客户信息和需求',
        desc: '（客户咨询）发送欢迎语，了解客户皮肤问题和需求；（老客户）发送关怀语，询问近况，引出产品升级/新品。',
      },
      {
        day: 'Day 1-2',
        title: '提供初步解决方案/产品介绍',
        goal: '激发客户兴趣，展示产品价值',
        desc: '根据客户需求，推荐XX套装，介绍核心成分和功效，结合客户痛点进行说明。提供【宝妈专属护肤手册】作为引流钩子。',
      },
      {
        day: 'Day 2-3',
        title: '朋友圈内容辅助/解答疑问',
        goal: '增强客户信任，消除购买顾虑',
        desc: '朋友圈发布XX套装的客户见证、干货知识（如：宝妈如何高效护肤），私聊解答客户关于产品、价格、效果的疑问。',
      },
      {
        day: 'Day 3-4',
        title: '促单/逼单',
        goal: '引导客户完成购买',
        desc: '利用稀缺性、紧迫感、从众心理等话术促单。提供限时优惠、赠品、无风险承诺（如：30天无理由退款）。',
      },
      {
        day: 'Day 5-7',
        title: '售后服务/建立长期关系',
        goal: '提升客户满意度，为复购和转介绍做铺垫',
        desc: '发货通知，使用指导。定期关怀客户使用情况，解答疑问，分享更多护肤知识。邀请客户加入专属宝妈护肤社群。',
      },
    ],

    keyMetrics: [
      '私域好友添加率',
      '咨询转化率',
      '老客户复购率',
      '客单价',
      '客户好评率',
    ],
  };
}

// ── page component ─────────────────────────────────────────────────────────────

export default function PrivateDomain() {
  const [activeScenario, setActiveScenario] = useState<PrivateDomainScenarioId>('welcome');
  const [productName, setProductName] = useState(DEFAULT_FORM.productName);
  const [targetUser, setTargetUser] = useState(DEFAULT_FORM.targetUser);
  const [scenario, setScenario] = useState(DEFAULT_FORM.scenario);

  const generated = generateMockResult();
  const currentScenario: PrivateDomainScenario =
    SCENARIOS.find((s) => s.id === activeScenario) ?? (SCENARIOS[0] as PrivateDomainScenario);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!productName.trim()) return;
    toast.success('已生成话术');
  }

  function handleCopyAll() {
    const text = JSON.stringify(generated, null, 2);
    navigator.clipboard.writeText(text).then(() => toast.success('已复制全部话术'));
  }

  function handleFeedbackUp() {
    toast.success('感谢反馈！');
  }

  function handleFeedbackDown() {
    toast.info('我们会持续改进');
  }

  return (
    <main className="flex-1 container py-8 space-y-6 max-w-6xl">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-on-surface">私域成交流程</h1>
        <p className="text-sm text-muted-foreground">
          覆盖从加好友到成交复购的全链路话术，让私域转化率翻倍
        </p>
      </header>

      {/* 6 chip scenario tabs */}
      <PrivateDomainScenarioTabs
        scenarios={SCENARIOS}
        activeId={activeScenario}
        onChange={setActiveScenario}
      />

      {/* current scenario card */}
      <div className="bg-card/30 border border-primary/30 rounded-lg p-5 space-y-2">
        <p className="text-sm font-semibold text-on-surface flex items-center gap-2">
          <span className="text-primary">{currentScenario.icon}</span>
          {currentScenario.name}
        </p>
        <p className="text-xs text-muted-foreground">{currentScenario.subtitle}</p>
      </div>

      {/* form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-card/30 border border-border/40 rounded-lg p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface">
              产品/服务名称 <span className="text-rose-400">*</span>
            </label>
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface">
              目标用户{' '}
              <span className="text-xs text-muted-foreground font-normal">（选填）</span>
            </label>
            <Input
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface">
            具体场景{' '}
            <span className="text-xs text-muted-foreground font-normal">（选填）</span>
          </label>
          <textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            className="w-full min-h-[80px] rounded-md border border-border bg-input px-3 py-2 text-sm text-on-surface resize-y"
          />
        </div>
        <Button
          type="submit"
          disabled={!productName.trim()}
          className="bg-primary hover:bg-primary/90"
        >
          👥 生成话术
        </Button>
      </form>

      {/* 5 output sections */}
      <PrivateDomainScriptListSection scripts={generated.trafficScripts} />
      <PrivateDomainMomentsSection scripts={generated.momentsScripts} />
      <PrivateDomainSalesScriptSection scripts={generated.salesScripts} />
      <PrivateDomainSopSection sop={generated.sop} />

      {/* 关键指标 金边 box */}
      <div className="border border-primary/30 bg-primary/5 rounded-lg p-5 space-y-3">
        <p className="text-sm font-semibold text-on-surface flex items-center gap-2">
          <span className="text-primary">◎</span> 关键指标
        </p>
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 list-none">
          {generated.keyMetrics.map((m, i) => (
            <li key={i} className="text-sm text-on-surface/85">
              <span className="text-primary font-semibold">{i + 1}. </span>
              {m}
            </li>
          ))}
        </ol>
      </div>

      {/* footer · copy all */}
      <div className="flex items-center justify-center pt-4">
        <Button variant="outline" size="sm" onClick={handleCopyAll}>
          📋 复制全部话术
        </Button>
      </div>

      {/* footer · feedback */}
      <div className="flex items-center gap-3 pt-2 border-t border-border/30">
        <p className="text-xs text-muted-foreground">这个结果对你有帮助吗？</p>
        <Button variant="ghost" size="icon" onClick={handleFeedbackUp} aria-label="有帮助">
          👍
        </Button>
        <Button variant="ghost" size="icon" onClick={handleFeedbackDown} aria-label="无帮助">
          👎
        </Button>
      </div>
    </main>
  );
}
