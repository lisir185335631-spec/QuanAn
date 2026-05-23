import { type FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { AvatarDesignSection, type AvatarDesignContent } from '@/components/step3/AvatarDesignSection';
import { BackgroundImageDesignSection, type BackgroundImageContent } from '@/components/step3/BackgroundImageDesignSection';
import { IntroCopySection, type IntroCopyEntry } from '@/components/step3/IntroCopySection';
import { NicknameRecommendSection, type NicknameEvaluation, type NicknameSelectionStrategy } from '@/components/step3/NicknameRecommendSection';
import { OverallStrategySection, type OverallStrategyContent } from '@/components/step3/OverallStrategySection';
import { Step3Form } from '@/components/step3/Step3Form';
import { Step3LoadingState } from '@/components/step3/Step3LoadingState';
import { Step3PageHeader, Step3SectionDivider } from '@/components/step3/Step3PageHeader';
import { VideoReferenceCaseSection, type VideoReferenceCase } from '@/components/step3/VideoReferenceCaseSection';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';
import { trpc } from '@/lib/trpc';

// ── AC-5: stub result shape (D-292 锁 · 6 sections always renderable) ────────

interface Step3Result {
  videoReferences: VideoReferenceCase[];
  nicknames: NicknameEvaluation[];
  nicknameStrategy?: NicknameSelectionStrategy;
  avatar: AvatarDesignContent;
  background: BackgroundImageContent;
  bioFormula?: string;
  bioEntries: IntroCopyEntry[];
  overallStrategy: OverallStrategyContent;
}

// AC-5: mock fallback — UI 永远能渲染 6 sections (D-292 锁)
function generateMockResult(): Step3Result {
  return {
    videoReferences: [
      { title: '行业头部博主揭秘 · 从 0 到 10 万粉的完整路径', description: '真实案例拆解 · 内容策略 + 账号包装 + 互动技巧全展示', searchHint: '美业 10 万粉 运营 案例' },
      { title: '同行差异化对比 · 为什么她的粉丝增长比你快 3 倍', description: '视觉设计 + 人设定位 + 发布节奏三重维度对比分析', searchHint: '美业 差异化 IP 打造' },
      { title: '爆款账号包装模板 · 美业 IP 的视觉一致性公式', description: '头像 / 背景图 / 简介三件套标准模板 · 可直接复用', searchHint: '美业 账号包装 模板 2024' },
    ],
    nicknames: [
      { name: '美业进化论', description: '行业专业感 + 成长叙事 · 适合知识输出型 IP', psychology: '进化论触发上升欲望', searchability: '高', tags: ['专业', '成长'] },
      { name: '皮肤管理师小 A', description: '职业标签 + 亲切符号 · 建立信任感强', psychology: '职业前缀快速建立权威', searchability: '中', tags: ['亲切', '职业'] },
      { name: '美业实战派', description: '实战二字建立行动力标签 · 吸引创业型粉丝', psychology: '实战感 vs 理论感区隔', searchability: '中', tags: ['实战', '创业'] },
      { name: '10 年美容师自白', description: '时间背书 + 自白体 · 真实感最强', psychology: '自白体降低戒备心', searchability: '高', tags: ['真实', '经验'] },
      { name: '美业增长笔记', description: '笔记体暗示内容价值 · 适合干货型 IP', psychology: '笔记 = 干货预期管理', searchability: '高', tags: ['干货', '增长'] },
    ],
    nicknameStrategy: {
      hint: '优先选择含职业关键词 + 情绪词的组合昵称 · 搜索可达性高 · 记忆成本低',
      chips: ['行业词', '情绪词', '时间背书', '动作词'],
    },
    avatar: {
      风格: '专业温暖型 · 职业感 + 亲和力兼顾',
      配色方案: '暖金 + 米白 · 传递专业与品质感',
      主色调: '#D4A04A (暖金)',
      辅色调: '#F5F0E8 (米白)',
      心理学依据: '暖金触发信任与价值感 · 米白降低戒备 · 组合提升转化率',
      '表情/姿态': '微笑 + 正面望镜头 · 自信不失亲和 · 避免低头/侧脸',
      '服装/造型': '职业装或整洁便装 · 品牌色系单品呼应头像配色',
      背景设计: '纯色或轻质感渐变 · 避免杂乱背景 · 强化主体',
    },
    background: {
      风格理念: 'Aurelian Dark 极简专业风 · 与头像形成视觉统一',
      布局结构: '中心主题文字 + 左下角职业标签 + 右下角 logo 或品牌符号',
      色调: '暗金底 + 白字 · 高对比度 · 视觉识别度强',
      主色调: '#1A1A2E (深蓝黑)',
      辅色调: '#D4A04A (暖金)',
      品牌元素: '行业关键词短句 · 如「10年 · 皮肤管理」',
      '字体/icon': 'Orbitron 英文标题 + 思源黑体 中文副标',
      分镜建议: '抖音 9:16 · 小红书 3:4 · 视频号 1:1',
    },
    bioFormula: '职业定位 + 核心价值主张 + 粉丝利益点 + 行动指令',
    bioEntries: [
      { platformKey: 'douyin_main', platformLabel: '抖音主号', copy: '皮肤管理师 10 年经验 | 帮你少走 3 年弯路 | 每周分享真实案例 | 👇 点关注', hashtags: ['#皮肤管理', '#美业干货', '#真实案例'], evaluation: '职业背书强 · 利益承诺明确 · 引导关注' },
      { platformKey: 'douyin_sub', platformLabel: '抖音副号', copy: '美容师日常 vlog | 行业内幕 + 从业技巧 | 关注学习实战方法', hashtags: ['#美容师日常', '#行业内幕'], evaluation: '生活感强 · 与主号形成互补' },
      { platformKey: 'xhs_knowledge', platformLabel: '小红书干货博主', copy: '✨ 10年皮肤管理实战派 | 专业护肤知识 + 真实案例 | 帮你科学变美不踩坑', hashtags: ['#护肤干货', '#皮肤管理', '#科学变美'], evaluation: 'emoji 提升颜值 · 科学变美锁定理性用户' },
      { platformKey: 'xhs_personal', platformLabel: '小红书个人IP', copy: '美业 10 年 | 用真实经历告诉你护肤真相 | 拒绝套路，只讲实话 💛', hashtags: ['#真实测评', '#护肤真相', '#个人IP'], evaluation: '真实感强 · 与用户建立情感连接' },
      { platformKey: 'sph_quality', platformLabel: '视频号品质创业', copy: '皮肤管理师｜10年行业经验｜帮助创业者少走弯路｜真实分享美业创业路', hashtags: ['#创业', '#美业创业', '#皮肤管理'], evaluation: '创业标签吸引同频用户' },
      { platformKey: 'sph_life', platformLabel: '视频号个人生活', copy: '美容师妈妈的生活日记 | 专业与生活的平衡艺术 | 用美滋养生活每一天', hashtags: ['#生活日记', '#美容师', '#工作与生活'], evaluation: '情感连接强 · 女性用户共鸣高' },
    ],
    overallStrategy: {
      视觉统一性: '头像 → 背景图 → 简介三件套使用同一配色体系(暖金 + 深底色) · 跨平台识别度统一',
      第一印象设计: '3 秒原则 · 头像+昵称+第一句简介必须传递"我是谁 + 能帮你做什么" · 拒绝模糊定位',
      内容封面与简介公益策略: '封面用统一模板(左侧竖色块 + 标题 + 数字hook) · 简介首行必含职业标签和核心利益点',
      内容创意建议: '黄金内容比例 = 干货60% + 案例20% + 互动/情感20% · 每周至少2条原创内容保持活跃',
    },
  };
}

// AC-5: 从 backend raw output 解析 · 字段不全时用 mock 兜底
function adaptStep3Result(raw: Record<string, unknown>): Step3Result {
  const mock = generateMockResult();

  // nicknames: backend returns string[] → convert to NicknameEvaluation[]
  const nicknameArr = Array.isArray(raw.nickname) ? (raw.nickname as string[]) : [];
  const nicknames: NicknameEvaluation[] = nicknameArr.length > 0
    ? nicknameArr.map((name) => ({
        name: typeof name === 'string' ? name : '昵称推荐',
        description: '命名策略见下方选择策略',
        psychology: '—',
        searchability: '中',
        tags: [],
      }))
    : mock.nicknames;

  // avatar: backend returns { prompt, style }
  const rawAvatar = raw.avatar as { prompt?: string; style?: string } | undefined;
  const avatar: AvatarDesignContent = rawAvatar
    ? {
        风格: rawAvatar.style ?? mock.avatar.风格,
        配色方案: mock.avatar.配色方案,
        主色调: mock.avatar.主色调,
        辅色调: mock.avatar.辅色调,
        心理学依据: mock.avatar.心理学依据,
        '表情/姿态': mock.avatar['表情/姿态'],
        '服装/造型': mock.avatar['服装/造型'],
        背景设计: rawAvatar.prompt ?? mock.avatar.背景设计,
      }
    : mock.avatar;

  // background: backend returns { prompt, platformVersions: string[3] }
  const rawBg = raw.background as { prompt?: string; platformVersions?: string[] } | undefined;
  const background: BackgroundImageContent = rawBg
    ? {
        风格理念: rawBg.prompt ?? mock.background.风格理念,
        布局结构: mock.background.布局结构,
        色调: mock.background.色调,
        主色调: mock.background.主色调,
        辅色调: mock.background.辅色调,
        品牌元素: mock.background.品牌元素,
        '字体/icon': mock.background['字体/icon'],
        分镜建议: Array.isArray(rawBg.platformVersions)
          ? rawBg.platformVersions.join(' · ')
          : mock.background.分镜建议,
      }
    : mock.background;

  // bio: backend returns [{ platform, text }][6]
  const rawBio = Array.isArray(raw.bio)
    ? (raw.bio as Array<{ platform?: string; text?: string }>)
    : [];
  const BIO_LABEL_MAP: Record<string, { key: string; label: string }> = {
    douyin: { key: 'douyin_main', label: '抖音主号' },
    xiaohongshu: { key: 'xhs_knowledge', label: '小红书干货博主' },
    wechat: { key: 'sph_quality', label: '视频号品质创业' },
    kuaishou: { key: 'douyin_sub', label: '抖音副号' },
    bilibili: { key: 'xhs_personal', label: '小红书个人IP' },
  };
  const bioEntries: IntroCopyEntry[] = rawBio.length > 0
    ? rawBio.map((b, i) => {
        const mapped = b.platform ? (BIO_LABEL_MAP[b.platform] ?? { key: `bio_${i}`, label: b.platform }) : { key: `bio_${i}`, label: `平台 ${i + 1}` };
        return {
          platformKey: mapped.key,
          platformLabel: mapped.label,
          copy: typeof b.text === 'string' ? b.text : '',
          hashtags: [],
          evaluation: '',
        };
      })
    : mock.bioEntries;

  // overallStrategy
  const rawStrategy = typeof raw.overallStrategy === 'string' ? raw.overallStrategy : null;
  const overallStrategy: OverallStrategyContent = rawStrategy
    ? { 视觉统一性: rawStrategy, 第一印象设计: mock.overallStrategy.第一印象设计, 内容封面与简介公益策略: mock.overallStrategy.内容封面与简介公益策略, 内容创意建议: mock.overallStrategy.内容创意建议 }
    : mock.overallStrategy;

  return {
    videoReferences: mock.videoReferences,
    nicknames,
    nicknameStrategy: mock.nicknameStrategy,
    avatar,
    background,
    bioFormula: mock.bioFormula,
    bioEntries,
    overallStrategy,
  };
}

export default function Step3() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;

  // AC-2: useStepData for persistence + cross-session restore
  const { save, isSaving, dbQuery } = useStepData(accountId, 'step3');

  // AC-3: industry from step1
  const industry = readOtherStep<{ industry?: string }>(accountId, 'step1')?.industry ?? '美业';

  const [personalInfo, setPersonalInfo] = useState('');
  const [platform, setPlatform] = useState('');
  const [audience, setAudience] = useState('');
  const [accountStatus, setAccountStatus] = useState('');

  const prevIsSavingRef = useRef(false);

  // Restore form from LS on accountId change
  useEffect(() => {
    if (accountId === null) return;
    const saved = readOtherStep<{ personalInfo?: string; platform?: string; audience?: string; accountStatus?: string }>(accountId, 'step3');
    if (saved?.personalInfo) {
      setPersonalInfo(saved.personalInfo);
      if (saved.platform) setPlatform(saved.platform);
      if (saved.audience) setAudience(saved.audience);
      if (saved.accountStatus) setAccountStatus(saved.accountStatus);
    }
  }, [accountId]);

  // Refetch after save completes
  useEffect(() => {
    if (prevIsSavingRef.current && !isSaving) {
      void dbQuery.refetch();
    }
    prevIsSavingRef.current = isSaving;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSaving]);

  // AC-1: trpc.step3.generatePackage mutation
  const generateMutation = trpc.step3.generatePackage.useMutation({
    onSuccess: () => {
      // AC-2: persist form inputs via useStepData
      save({ personalInfo, platform, audience, accountStatus });
      void dbQuery.refetch();
      toast.success('生成完成');
    },
    onError: (err) => {
      toast.error(err.message || '生成失败，请重试');
    },
  });

  const isLoading = generateMutation.isPending || isSaving;

  // AC-5: adapt backend result with stub parsing + mock fallback
  // PRD-29.5 · default 用 mock data render(真 1:1 复刻 · 跟 aiipznt sally 默认看到内容一致)
  // hasRealData 区分 · canBulkActions 用 real(防 mock 数据被"复制全部"误触)
  const rawResult = dbQuery.data?.result as Record<string, unknown> | null | undefined;
  const hasRealData = !!rawResult;
  const generated: Step3Result = rawResult ? adaptStep3Result(rawResult) : generateMockResult();

  // AC-4: canBulkActions = 真数据 && 非 loading(mock 状态下 disabled · 防误复制 mock)
  const canBulkActions = hasRealData && !isLoading;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!personalInfo.trim() || !platform || isLoading) return;
    generateMutation.mutate({ personalInfo, platform, audience, accountStatus });
  }

  return (
    <main className="flex-1 container py-8 space-y-8">
      {/* 1. Step3PageHeader · canBulkActions controls 3 toolbar buttons */}
      <Step3PageHeader
        industry={industry}
        canBulkActions={canBulkActions}
      />

      {/* 2. Step3Form */}
      <Step3Form
        personalInfo={personalInfo}
        onPersonalInfoChange={setPersonalInfo}
        platform={platform}
        onPlatformChange={setPlatform}
        audience={audience}
        onAudienceChange={setAudience}
        accountStatus={accountStatus}
        onAccountStatusChange={setAccountStatus}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        isDisabled={!personalInfo.trim() || !platform || isLoading}
      />

      {/* 3. Step3LoadingState — inline notification when isLoading=true (AC-3) */}
      {isLoading && <Step3LoadingState />}

      {/* 4. Step3SectionDivider */}
      <Step3SectionDivider />

      {/* 4-9. 6 H3 sections — D-292 锁: always render, skeleton when no data */}
      <VideoReferenceCaseSection
        cases={generated?.videoReferences ?? []}
        canGenerate={canBulkActions}
      />

      <NicknameRecommendSection
        nicknames={generated?.nicknames ?? []}
        strategy={generated?.nicknameStrategy}
      />

      <AvatarDesignSection
        content={generated?.avatar ?? null}
        canViewImage={canBulkActions}
      />

      <BackgroundImageDesignSection
        content={generated?.background ?? null}
        canGenerate={canBulkActions}
      />

      <IntroCopySection
        formula={generated?.bioFormula}
        entries={generated?.bioEntries ?? []}
      />

      <OverallStrategySection
        content={generated?.overallStrategy ?? null}
      />
    </main>
  );
}
