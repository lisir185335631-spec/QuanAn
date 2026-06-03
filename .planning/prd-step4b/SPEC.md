# /step/4b "变现路径" 完全重写 SPEC

> **作者** · Opus 4.7(team plan)
> **执行** · Sonnet 4.6 max
> **目标** · 1:1 字面复刻 aiipznt sally zhao /step/4b 真实输出 · form + 4 output sub-component
> **不动** · router.tsx · 旧 step4b.ts 常量(留 @deprecated)

---

## 1 · 背景 + 工程约束

### 现状
- `apps/web/src/pages/step/Step4b.tsx` (350 行旧版 · 必须完全重写)
- `apps/web/src/lib/constants/step4b.ts` (168 行 · 部分复用 · 加新常量 · 旧 @deprecated)
- `apps/web/src/components/step4b/Step4bOutputContent.tsx` (旧 child · 保留不删 · 不再 import)
- `apps/web/src/router.tsx:84` 已挂 `{ path: '4b', element: <Step4b /> }` · **不动 router**

### 视觉风格参考(必读)
Sonnet 必读 ·
- `apps/web/src/components/step4/Step4PhaseSection.tsx` (stage number 圆圈 + sub-card pattern 几乎一样)
- `apps/web/src/components/step4/Step4WarningSection.tsx` (红边风险风格 · 本 page 每 stage 都有 ⚠️ 风险提示)
- `apps/web/src/components/step3b/CoreIdentitySection.tsx` (多 SubCard 堆叠风格)
- `apps/web/src/components/step4/Step4OverviewSection.tsx` (2x2 grid 风格 · 跟"市场分析"一样)
- `apps/web/src/components/ui/sub-card.tsx`
- `apps/web/src/components/icons/aiipznt-icons.tsx`

**严格沿用** · text-xs / text-on-surface / text-muted-foreground / bg-primary/10 · 不引入新颜色。
**警告区** · `border-rose-500/30 bg-rose-500/5` + `text-rose-400`(沿用 /step/4 警告)

---

## 2 · 完整 schema(TypeScript interface)

```typescript
export interface Step4bResult {
  // ── 市场分析 ─────────────────────────────────────────────
  marketAnalysis: {
    industryAnalysis: string;       // 行业分析
    marketScale: string;            // 市场规模
    competition: string;            // 竞争程度
    monetizationPotential: string;  // 变现潜力
  };

  // ── 3 阶段 ──────────────────────────────────────────────
  stages: Step4bStage[];

  // ── 收入结构 ─────────────────────────────────────────────
  revenueStructure: Array<{
    name: string;                   // 定制智能体服务 / AI智能体与OPC创业培训(...) / 后端产品(...)
    percentage: string;             // 40% / 35% / 25%
    desc: string;
    highlight?: boolean;            // 第一条金色高亮边框
  }>;

  // ── 成功案例参考 ─────────────────────────────────────────
  successCases: Array<{
    title: string;                  // 某AI技术IP：从个人博主到AI教育平台创始人
    category: string;               // AI技术教育
    journey: string;                // 初期通过免费AI工具教程和短视频积累粉丝 -> ...
    outcome: string;                // 从年入几十万到年营收数千万，估值过亿。
    insight: string;                // 启示：...
  }>;
}

export interface Step4bStage {
  number: 1 | 2 | 3;
  icon: 'trending' | 'diamond' | 'crown'; // 📈/💎/👑(stage icon 标识)
  range: string;                    // 0→90万 / 100万→1000万 / 1000万→1亿
  title: string;                    // 起步阶段：积累案例与私域流量，验证培训模型
  duration: string;                 // 6-12个月 / 12-24个月 / 24-48个月
  coreStrategy: string;             // ⚡ 核心策略
  productMatrix: Array<{
    category: '引流品' | '信任品' | '利润品' | '后端产品';
    name: string;                   // AI智能体免费体验课／9.9元《AI创业避坑指南》电子书
    priceRange: string;             // 0-9.9元 / 499元 / 10000-30000元 / ...
    targetCustomer: string;         // 目标客户: ...
    monthlyTarget: string;          // 月目标: 300-500人
    monthlyRevenue: string;         // 月收入: 0-5000元
  }>;
  // stage 独有字段(各 stage 选择性出现)
  trafficStrategy?: string;         // 📊 流量策略(仅 stage 1)
  conversionFlow?: string[];        // ⟲ 转化流程(仅 stage 1 · 3 步带 → 箭头)
  teamBuilding?: string;            // 👥 团队建设(仅 stage 2)
  systemBuilding?: string;          // ⚙ 体系化建设(仅 stage 2)
  brandStrategy?: string;           // 🏆 品牌化策略(仅 stage 3)
  matrixLayout?: string;            // 🧭 矩阵化布局(仅 stage 3)
  keyActions: string[];             // 🎯 关键动作 ✓ list(都有)
  risks: string[];                  // ⚠️ 风险提示 红边 · list(都有)
}

export interface Step4bFormData {
  productService: string;           // 产品/服务描述(必填)
  targetAudience: string;
  ipPositioning: string;
  currentIncome: string;
}
```

---

## 3 · Form 默认值(useState initial · 1:1 sally 真实输入)

```typescript
const DEFAULT_FORM: Step4bFormData = {
  productService: '定制智能体定价：10000-100000（根据客户需求专业定制）\n针对opc创业者：自己做ip获取流量，9800线上智能体使用和19800线下高阶段培训\n技术升级项目落地培训29800，训练营',
  targetAudience: '25-40男性',
  ipPositioning: 'ai智能体定制',
  currentIncome: '年入30万',
};
```

---

## 4 · 完整 mock data · 逐字提取

> ⚠️ Sonnet **必须逐字 copy** · 不允许概括 / 删减 / 改标点 · 全角中文标点(，。：、)严格保留

```typescript
function generateMockResult(): Step4bResult {
  return {
    // ── 🎯 市场分析 ────────────────────────────────────────
    marketAnalysis: {
      industryAnalysis: 'AI智能体定制与OPC创业培训',
      marketScale: 'AI技术正在爆发式增长，企业和个人对降本增效的需求巨大，尤其在重复性工作自动化方面。OPC（One Person Company）创业者对AI工具和方法论的需求也日益旺盛。市场规模难以精确估算，但增长潜力巨大。',
      competition: 'AI定制服务竞争激烈，但垂直细分领域（如特定行业、特定功能）仍有蓝海。OPC培训市场竞争同样激烈，但结合AI技术和个人实践经验的IP具有独特优势。',
      monetizationPotential: '非常高。定制化服务客单价高，培训产品可规模化。IP的个人经历（餐饮创业、负债、转型AI成功）是极佳的信任背书和故事素材，能吸引大量共鸣者。',
    },

    // ── 3 阶段 ─────────────────────────────────────────────
    stages: [
      // 📈 阶段一: 0→90万
      {
        number: 1,
        icon: 'trending',
        range: '0→90万',
        title: '起步阶段：积累案例与私域流量，验证培训模型',
        duration: '6-12个月',
        coreStrategy: '以引流品快速获取私域流量，通过信任品建立口碑和转化，同时提供定制服务积累高客单价案例。核心是把你的成功转型故事包装成引人入胜的IP。',
        productMatrix: [
          {
            category: '引流品',
            name: 'AI智能体免费体验课／9.9元《AI创业避坑指南》电子书',
            priceRange: '0-9.9元',
            targetCustomer: '对AI智能体感兴趣的企业主、希望通过AI提升效率的OPC创业者',
            monthlyTarget: '300-500人',
            monthlyRevenue: '0-5000元',
          },
          {
            category: '信任品',
            name: 'AI智能体实战训练营（初级）／《OPC AI创业加速营》',
            priceRange: '499元',
            targetCustomer: '对AI智能体有初步兴趣，想深入学习搭建和应用的OPC创业者、小企业主',
            monthlyTarget: '50-80人',
            monthlyRevenue: '2.5万-4万元',
          },
          {
            category: '利润品',
            name: '定制智能体服务（轻量版）',
            priceRange: '10000-30000元',
            targetCustomer: '有明确降本增效需求，但预算有限的小型企业主、OPC创业者',
            monthlyTarget: '1-2单',
            monthlyRevenue: '1万-6万元',
          },
        ],
        trafficStrategy: '抖音短视频（内容包括：AI智能体案例展示、AI创业避坑、个人转型故事、AI工具教学）、直播（免费体验课）、私域社群运营（提供价值、互动答疑）。',
        conversionFlow: [
          '抖音短视频/直播吸引用户 -> 引导至私域（微信群/个人号）获取引流品（免费课/电子书）',
          '私域内持续输出价值，分享案例，建立信任 -> 推出信任品（训练营）',
          '训练营内筛选高意向客户，或通过私域一对一咨询 -> 转化利润品（定制服务）',
        ],
        keyActions: [
          '每周至少发布3-5条高质量抖音短视频，内容聚焦AI应用和OPC创业经验。',
          '每月至少进行2场免费直播体验课，引导用户进入私域。',
          '持续在私域社群内分享AI最新资讯、成功案例、答疑解惑，保持活跃度。',
          '积极寻求定制服务客户，积累成功案例，并将其转化为IP内容。',
        ],
        risks: [
          '初期流量获取成本高，转化率不稳定。',
          '定制服务交付周期长，可能影响现金流。',
          '个人IP影响力不足，信任建立需要时间。',
        ],
      },

      // 💎 阶段二: 100万→1000万
      {
        number: 2,
        icon: 'diamond',
        range: '100万→1000万',
        title: '发展阶段：产品线升级，打造爆款，团队协作',
        duration: '12-24个月',
        coreStrategy: '在积累一定私域用户和成功案例后，升级产品线，推出更高客单价的利润品和后端品。开始组建核心团队，实现部分业务标准化和规模化。',
        productMatrix: [
          {
            category: '利润品',
            name: 'AI智能体系统大课／《OPC AI创业实战营》（进阶版）',
            priceRange: '1980-9800元',
            targetCustomer: '希望系统学习AI智能体开发与商业落地，或希望通过AI实现项目从0到1的OPC创业者',
            monthlyTarget: '10-20人',
            monthlyRevenue: '2万-20万元',
          },
          {
            category: '利润品',
            name: '定制智能体服务（专业版）',
            priceRange: '3万-10万元',
            targetCustomer: '有复杂业务流程优化需求，愿意投入更高预算的企业主、中大型OPC创业团队',
            monthlyTarget: '0.5-1单',
            monthlyRevenue: '1.5万-10万元',
          },
          {
            category: '后端产品',
            name: 'OPC AI创业合伙人计划／线下高阶培训',
            priceRange: '19800-29800元',
            targetCustomer: '希望深度绑定，共同发展AI事业的OPC创业者，或寻求技术升级、项目落地的学员',
            monthlyTarget: '2-5人',
            monthlyRevenue: '4万-15万元',
          },
        ],
        teamBuilding: '招聘1-2名课程助理/社群运营，负责日常答疑和社群维护；招聘1-2名技术开发人员，协助定制服务交付和课程内容迭代。',
        systemBuilding: '搭建线上课程平台，实现课程内容标准化、自动化交付；建立客户管理系统（CRM），优化客户跟进流程；制定标准化定制服务SOP，提升交付效率。',
        keyActions: [
          '优化抖音内容策略，尝试投放少量广告，扩大流量池。',
          '定期举办线上/线下高阶分享会，提升IP影响力。',
          '与行业KOL或机构合作，进行联合推广。',
          '建立完善的客户服务体系，提升用户满意度和复购率。',
          '将成功案例进行深度包装，制作成宣传材料和课程素材。',
        ],
        risks: [
          '团队管理和协作效率问题。',
          '产品线扩张可能导致精力分散。',
          '市场竞争加剧，需要持续创新保持领先。',
        ],
      },

      // 👑 阶段三: 1000万→1亿
      {
        number: 3,
        icon: 'crown',
        range: '1000万→1亿',
        title: '规模化阶段：品牌化、平台化、生态化',
        duration: '24-48个月',
        coreStrategy: '将IP打造成行业标杆，实现品牌化运营。构建AI智能体服务平台或OPC创业赋能平台，吸引更多开发者和创业者加入，形成生态。通过资本运作加速发展。',
        productMatrix: [
          {
            category: '后端产品',
            name: '企业内训／行业解决方案定制',
            priceRange: '10万-100万元',
            targetCustomer: '中大型企业、上市公司、政府机构',
            monthlyTarget: '0.1-0.3单',
            monthlyRevenue: '1万-30万元',
          },
          {
            category: '后端产品',
            name: 'AI智能体SaaS平台／OPC创业孵化器',
            priceRange: '年费1万-10万（SaaS）／股权投资（孵化器）',
            targetCustomer: '广大OPC创业者、中小企业、AI开发者',
            monthlyTarget: '平台用户增长/孵化项目',
            monthlyRevenue: '可变',
          },
          {
            category: '利润品',
            name: '私董会／资本对接服务',
            priceRange: '10万-50万元/年',
            targetCustomer: '寻求更高维度发展、资本运作的优秀OPC创业者、中小企业主',
            monthlyTarget: '0.1-0.2人',
            monthlyRevenue: '1万-10万元',
          },
        ],
        brandStrategy: '将个人IP升级为企业品牌，通过媒体公关、行业峰会、出版书籍等方式，提升品牌知名度和影响力。打造行业标准和最佳实践。',
        matrixLayout: '横向拓展AI应用领域（如：教育、医疗、金融），纵向深化AI技术研发。投资或并购相关AI技术公司或内容机构，构建AI生态矩阵。',
        keyActions: [
          '寻求A轮、B轮融资，加速平台和生态建设。',
          '组建专业的市场公关团队，提升品牌声量。',
          '与高校、科研机构合作，进行前沿技术研发。',
          '举办行业峰会，邀请行业专家，打造行业影响力。',
          '持续孵化和投资优质AI创业项目，扩大生态圈。',
        ],
        risks: [
          '市场变化快，技术迭代迅速，需保持前瞻性。',
          '团队规模扩大，管理难度增加。',
          '资本运作风险，需要专业团队支持。',
        ],
      },
    ],

    // ── 📈 收入结构 ────────────────────────────────────────
    revenueStructure: [
      {
        name: '定制智能体服务',
        percentage: '40%',
        desc: '高客单价，利润丰厚，但需要持续投入人力和技术。随着品牌影响力提升，客单价和订单量会稳步增长。',
        highlight: true,
      },
      {
        name: 'AI智能体与OPC创业培训（线上课程、训练营、线下高阶培训）',
        percentage: '35%',
        desc: '可规模化复制，边际成本低，是现金流的重要来源。通过引流品和信任品不断扩大用户基数，提升转化率。',
      },
      {
        name: '后端产品（合伙人计划、私董会、企业内训、SaaS平台）',
        percentage: '25%',
        desc: '利润天花板高，能带来长期稳定的高价值收入。需要IP的深度参与和品牌影响力。随着业务发展，这部分占比会逐渐提升。',
      },
    ],

    // ── 🏆 成功案例参考 ────────────────────────────────────
    successCases: [
      {
        title: '某AI技术IP：从个人博主到AI教育平台创始人',
        category: 'AI技术教育',
        journey: '初期通过免费AI工具教程和短视频积累粉丝 -> 推出99元入门课 -> 升级为1980元系统课程 -> 最终成立AI教育SaaS平台，提供企业内训和解决方案。',
        outcome: '从年入几十万到年营收数千万，估值过亿。',
        insight: '启示：从免费内容切入，逐步提升产品客单价和深度，最终实现平台化和品牌化。个人IP的专业性和教学能力是核心。',
      },
      {
        title: '某创业导师：从个人咨询到创业孵化器',
        category: '创业咨询/孵化',
        journey: '通过分享个人创业故事和避坑经验吸引粉丝 -> 推出99元创业社群 -> 升级为9800元创业训练营 -> 最终成立创业孵化器，提供资金和资源支持。',
        outcome: '从年入百万到年营收数千万，孵化多个成功项目。',
        insight: '启示：个人经历和实战经验是最好的信任背书。通过社群和训练营筛选高潜力学员，最终通过深度绑定（孵化器）实现更大价值。',
      },
    ],
  };
}
```

---

## 5 · 4 sub-component 详细规格

### 5.1 Step4bMarketAnalysisSection.tsx(市场分析 · 2x2 grid)

文件 · `apps/web/src/components/step4b/Step4bMarketAnalysisSection.tsx`
Props · `{ analysis?: Step4bResult['marketAnalysis']; className?: string; }`

Layout(整段一个大 SubCard):
1. H3 row · `🎯 市场分析`(emoji 直接 jsx text)
2. SubCard 内 · `<div className="grid grid-cols-1 md:grid-cols-2 gap-6">`:
   - 左列 上 · "行业分析"(sub-label) + 段
   - 右列 上 · "市场规模"(sub-label) + 段
   - 左列 下 · "竞争程度" + 段
   - 右列 下 · "变现潜力" + 段
3. 每 sub-section · `<p text-xs font-semibold text-primary/85>{label}</p>` + `<p text-sm text-on-surface/90 leading-relaxed>{value}</p>`

### 5.2 Step4bStageSection.tsx(单个 stage · 3 次复用)

文件 · `apps/web/src/components/step4b/Step4bStageSection.tsx`
Props · `{ stage: Step4bStage; className?: string; }`

Layout:
1. H3 row · 大 icon circle(W-12 H-12 border + bg-primary/10):
   - stage.icon='trending' → `<TrendingUp text-primary />`(从 lucide-react)或简单 emoji "📈"
   - stage.icon='diamond' → `<Gem text-primary />`或 "💎"
   - stage.icon='crown' → `<Crown text-primary />`或 "👑"
   - 推荐 · 用 emoji 简单展示 · 跟截图一致
   - 右边 · `<span text-primary text-lg font-bold>{range}</span>` + `<h3 text-lg font-semibold ml-2>{title}</h3>`
   - 下方 · `<p text-xs text-muted-foreground>↗ {duration}</p>`

2. SubCard "⚡ 核心策略" · sub-label + coreStrategy 段

3. SubCard "📦 产品矩阵" · sub-label + productMatrix 卡 grid grid-cols-1 md:grid-cols-2 gap-3:
   - 每卡 · border border-primary/15 rounded p-3 ·
     - row · `<p>{category}：<span text-on-surface>{name}</span></p>` + 右 `<span text-primary font-semibold>{priceRange}</span>`
     - 副 · 目标客户: ... / 月目标: ... / 月收入: <span text-emerald-400>...</span>

4. (条件) SubCard "📊 流量策略" · 仅 stage.trafficStrategy 存在
5. (条件) SubCard "⟲ 转化流程" · 仅 stage.conversionFlow 存在
   - 3 段水平 box 用 → 分隔(grid-cols-3 + 中间 → arrow chip · 或者垂直堆叠用 → 前缀)
   - 简化 · 用 `<div className="space-y-2">` 各段独立 + 行内 → 前缀
6. (条件) SubCard "👥 团队建设" · 仅 stage.teamBuilding
7. (条件) SubCard "⚙ 体系化建设" · 仅 stage.systemBuilding
8. (条件) SubCard "🏆 品牌化策略" · 仅 stage.brandStrategy
9. (条件) SubCard "🧭 矩阵化布局" · 仅 stage.matrixLayout

10. SubCard "🎯 关键动作" · sub-label + ul:
    - 每条 · `✓`(text-emerald-500) + text

11. **风险提示**(独立 box · 不在 SubCard 内 · 红边):
    - `<div className="border border-rose-500/30 bg-rose-500/5 rounded-lg p-4">`
    - row · `🛡️ 风险提示`(text-rose-400 font-semibold)
    - ul: 每条 · `·`(text-rose-400/70) + text(text-xs text-rose-300)

### 5.3 Step4bRevenueStructureSection.tsx(收入结构)

文件 · `apps/web/src/components/step4b/Step4bRevenueStructureSection.tsx`
Props · `{ structure?: Step4bResult['revenueStructure']; className?: string; }`

Layout:
1. H3 row · `📈 收入结构`
2. revenueStructure.map · 各独立 box(space-y-3):
   - highlight=true → `border border-primary/40 bg-primary/8 rounded-lg p-4`(金色高亮)
   - highlight=false → `border border-border/40 rounded-lg p-4`
   - row · `<p text-sm font-semibold>{name}</p>` + 右 `<span text-primary font-bold>{percentage}</span>`
   - desc · `<p text-xs text-muted-foreground leading-relaxed mt-1>{desc}</p>`

### 5.4 Step4bSuccessCasesSection.tsx(成功案例参考)

文件 · `apps/web/src/components/step4b/Step4bSuccessCasesSection.tsx`
Props · `{ cases?: Step4bResult['successCases']; className?: string; }`

Layout:
1. H3 row · `🏆 成功案例参考`
2. cases.map · grid grid-cols-1 md:grid-cols-2 gap-4:
   - 每 card · SubCard(space-y-2)
     - `<p text-sm font-semibold text-on-surface>{title}</p>`
     - `<p text-xs text-muted-foreground>{category} · {journey}</p>`(category + journey 一行 · 用 · 分隔)
     - `<p text-xs text-emerald-400 font-semibold>{outcome}</p>`
     - `<p text-xs text-primary>{insight}</p>`

### 5.5 SubCard 写法(必读)

```tsx
import { SubCard } from '@/components/ui/sub-card';
<SubCard>
  <div className="space-y-2">
    <p className="text-xs font-semibold text-on-surface/80">sub-label</p>
    <p className="text-xs text-muted-foreground leading-relaxed">content</p>
  </div>
</SubCard>
```

---

## 6 · Step4b.tsx 重写规格

文件 · `apps/web/src/pages/step/Step4b.tsx`(完全替换 350 行旧版)

### 6.1 import 清单

```typescript
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Step4bMarketAnalysisSection } from '@/components/step4b/Step4bMarketAnalysisSection';
import { Step4bStageSection } from '@/components/step4b/Step4bStageSection';
import { Step4bRevenueStructureSection } from '@/components/step4b/Step4bRevenueStructureSection';
import { Step4bSuccessCasesSection } from '@/components/step4b/Step4bSuccessCasesSection';
import { Step3LoadingState } from '@/components/step3/Step3LoadingState';
import { Step3SectionDivider } from '@/components/step3/Step3PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';
import { STEP4B_H1, STEP4B_BUTTON_GENERATE_REAL, STEP4B_SUBTITLE_REAL } from '@/lib/constants/step4b';
```

### 6.2 函数体结构

```typescript
export default function Step4b() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const { save, isSaving, dbQuery } = useStepData(accountId, 'step4b');

  const industry = readOtherStep<{ industry?: string }>(accountId, 'step1')?.industry ?? '美业';

  // PRD-29.10 · default form 1:1 sally
  const [productService, setProductService] = useState(DEFAULT_FORM.productService);
  const [targetAudience, setTargetAudience] = useState(DEFAULT_FORM.targetAudience);
  const [ipPositioning, setIpPositioning] = useState(DEFAULT_FORM.ipPositioning);
  const [currentIncome, setCurrentIncome] = useState(DEFAULT_FORM.currentIncome);

  const prevIsSavingRef = useRef(false);

  useEffect(() => {
    if (accountId === null) return;
    const saved = readOtherStep<Step4bFormData>(accountId, 'step4b');
    if (saved?.productService) {
      setProductService(saved.productService);
      if (saved.targetAudience) setTargetAudience(saved.targetAudience);
      if (saved.ipPositioning) setIpPositioning(saved.ipPositioning);
      if (saved.currentIncome) setCurrentIncome(saved.currentIncome);
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

  const generated: Step4bResult = generateMockResult();
  const canBulkActions = !isLoading;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!productService.trim() || isLoading) return;
    setIsLocalGenerating(true);
    save({ productService, targetAudience, ipPositioning, currentIncome });
    setTimeout(() => { setIsLocalGenerating(false); toast.success('生成完成'); }, 1200);
  }
  function handleRegenerateAll() { if (!isLoading) { setIsLocalGenerating(true); setTimeout(() => { setIsLocalGenerating(false); toast.success('已重新生成'); }, 1200); }}
  function handleCopyAll() { navigator.clipboard.writeText(JSON.stringify(generated, null, 2)).then(() => toast.success('已复制全部')); }
  function handleOptimize() { if (canBulkActions) toast.success('已智能优化'); }
  function handleFeedbackUp() { toast.success('感谢反馈!'); }
  function handleFeedbackDown() { toast.info('我们会持续改进'); }

  return (
    <main className="flex-1 container py-8 space-y-8">
      {/* 1. Header · breadcrumb + H1 + subtitle */}
      <header className="space-y-3">
        <p className="text-xs font-semibold text-primary tracking-wide">
          STEP 04b › 变现路径规划
        </p>
        <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
          $ {STEP4B_H1}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {STEP4B_SUBTITLE_REAL.replace('{industry}', industry)}
        </p>
      </header>

      {/* 2. Form · 产品/服务 + 3 input + main CTA */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-card/30 border border-border/40 rounded-lg p-6">
        {/* 产品/服务描述 (required *) textarea */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface">
            产品/服务描述 <span className="text-rose-400">*</span>
          </label>
          <textarea
            value={productService}
            onChange={(e) => setProductService(e.target.value)}
            className="w-full min-h-[120px] rounded-md border border-border bg-input px-3 py-2 text-sm text-on-surface resize-y"
            required
          />
        </div>

        {/* 3 col grid: 目标受众 + IP定位 + 当前收入水平 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface">
              目标受众 <span className="text-xs text-muted-foreground font-normal">（可选）</span>
            </label>
            <Input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface">
              IP定位 <span className="text-xs text-muted-foreground font-normal">（可选）</span>
            </label>
            <Input value={ipPositioning} onChange={(e) => setIpPositioning(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface">
              当前收入水平 <span className="text-xs text-muted-foreground font-normal">（可选）</span>
            </label>
            <Input value={currentIncome} onChange={(e) => setCurrentIncome(e.target.value)} />
          </div>
        </div>

        {/* Main CTA */}
        <Button
          type="submit"
          disabled={!productService.trim() || isLoading}
          className="w-full bg-primary hover:bg-primary/90"
        >
          🚀 {STEP4B_BUTTON_GENERATE_REAL}
        </Button>
      </form>

      {/* 3. Loading state */}
      {isLoading && <Step3LoadingState />}

      {/* 4. Output area: H2 + toolbar */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
          $ 你的三阶梯变现路径
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!canBulkActions} onClick={handleOptimize}>
            ✨ 智能优化
          </Button>
          <Button variant="outline" size="sm" disabled={!canBulkActions} onClick={handleRegenerateAll}>
            ⟳ 重新生成
          </Button>
          <Button variant="outline" size="icon" disabled={!canBulkActions} onClick={handleCopyAll} aria-label="复制全部">
            📋
          </Button>
        </div>
      </div>

      {/* 5. Market Analysis */}
      <Step4bMarketAnalysisSection analysis={generated.marketAnalysis} />

      {/* 6. 3 Stages */}
      {generated.stages.map((stage) => (
        <Step4bStageSection key={stage.number} stage={stage} />
      ))}

      {/* 7. Revenue Structure */}
      <Step4bRevenueStructureSection structure={generated.revenueStructure} />

      {/* 8. Success Cases */}
      <Step4bSuccessCasesSection cases={generated.successCases} />

      {/* 9. footer 简化(无完成 chip · 仅反馈) */}
      <div className="flex items-center gap-3 pt-4 border-t border-border/30">
        <p className="text-xs text-muted-foreground">这个结果对你有帮助吗？</p>
        <Button variant="ghost" size="icon" onClick={handleFeedbackUp} aria-label="有帮助">👍</Button>
        <Button variant="ghost" size="icon" onClick={handleFeedbackDown} aria-label="无帮助">👎</Button>
      </div>
    </main>
  );
}
```

---

## 7 · step4b.ts 常量补充

末尾追加(旧 @deprecated 保留):

```typescript
// ─── PRD-29.10 · 真实字面(根据 sally zhao /step/4b demo 截图)─────────
// 旧 step4b 常量是 PRD-20 历史 schema · 跟实际 aiipznt 不符 · 保留 @deprecated
// 实际 aiipznt sally /step/4b · form 4 字段 + 4 output sub-component

// 顶部 breadcrumb + H1
export const STEP4B_BREADCRUMB_REAL = 'STEP 04b › 变现路径规划' as const;
export const STEP4B_H1_REAL = '变现路径' as const;
export const STEP4B_OUTPUT_H2_REAL = '你的三阶梯变现路径' as const;
export const STEP4B_SUBTITLE_REAL = '当前行业：{industry}。AI将为你规划三阶梯变现路径：0→90万、100万→1000万、1000万→1亿，每个阶梯有具体的产品设计、定价策略和成交流程。' as const;

// CTA 字面
export const STEP4B_BUTTON_GENERATE_REAL = '生成变现路径' as const;
export const STEP4B_CTA_BULK_OPTIMIZE = '智能优化' as const;
export const STEP4B_CTA_BULK_REGENERATE = '重新生成' as const;
export const STEP4B_CTA_BULK_COPY = '复制全部' as const;

// footer
export const STEP4B_FOOTER_FEEDBACK_QUESTION = '这个结果对你有帮助吗？' as const;

// form labels
export const STEP4B_FORM_PRODUCT_LABEL = '产品/服务描述' as const;
export const STEP4B_FORM_AUDIENCE_LABEL = '目标受众' as const;
export const STEP4B_FORM_IP_LABEL = 'IP定位' as const;
export const STEP4B_FORM_INCOME_LABEL = '当前收入水平' as const;
```

注意 · 文件中可能已有 `STEP4B_H1`(旧)· 如冲突就用 `STEP4B_H1_REAL` · Sonnet 自行 resolve。

---

## 8 · 文件输出 list(共 6 文件)

| # | path | 操作 | 行数估 |
|:-:|---|:-:|:-:|
| 1 | `apps/web/src/lib/constants/step4b.ts` | Edit(末尾追加 ~25 行) | +25 |
| 2 | `apps/web/src/components/step4b/Step4bMarketAnalysisSection.tsx` | new | ~60 |
| 3 | `apps/web/src/components/step4b/Step4bStageSection.tsx` | new | ~180 |
| 4 | `apps/web/src/components/step4b/Step4bRevenueStructureSection.tsx` | new | ~55 |
| 5 | `apps/web/src/components/step4b/Step4bSuccessCasesSection.tsx` | new | ~55 |
| 6 | `apps/web/src/pages/step/Step4b.tsx` | rewrite(完全替换 350 行 · 含 mock 400+ 行) | ~700 |

**不动**: router.tsx · 旧 step4b 常量 · 其他 page

---

## 9 · 验收

1. typecheck 0 error
2. dev server http://localhost:5173/step/4b 可访问
3. innerText 60-80 关键字 grep(Opus 阶段做)

---

## 10 · Sonnet 工作流程

1. **必读参考组件**:
   ```
   Read apps/web/src/components/step4/Step4PhaseSection.tsx
   Read apps/web/src/components/step4/Step4WarningSection.tsx
   Read apps/web/src/components/step4/Step4OverviewSection.tsx
   Read apps/web/src/components/step3b/CoreIdentitySection.tsx
   Read apps/web/src/components/ui/sub-card.tsx
   ```

2. **Edit step4b.ts 末尾追加新常量**(不动旧)

3. **Write 4 sub-component**(严格按 §5 规格)

4. **Write Step4b.tsx 完全重写**(含 §2/§3/§4 interface + DEFAULT_FORM + generateMockResult 逐字)

5. **跑 typecheck**:
   ```
   cd apps/web && pnpm typecheck
   ```
   遇 error 自己 fix

6. **报告 DONE / BLOCKED**

---

## 11 · 红线

- ❌ 不允许动 router.tsx
- ❌ 不允许删 step4b.ts 旧常量(留 @deprecated)
- ❌ 不允许概括 / 缩短 / 改写 §3 form 默认值或 §4 mock data 任何字符
- ❌ 不允许引入新 npm 依赖
- ❌ 不允许动 /step/3 /step/3b /step/4 已有组件
- ❌ toolbar 必须 "重新生成"(不是 "一键重新生成")
- ❌ emoji 全部保留: 🎯 📦 📈 💎 👑 ⚡ 📊 ⟲ 👥 ⚙ 🏆 🧭 🎯 ⚠️ ⟳ ✨ 📋 🚀 👍 👎 $
- ❌ 不允许尝试启 dev server / 跑 visual screenshot
- ❌ stage.icon='trending'/'diamond'/'crown' 必须用 emoji "📈" / "💎" / "👑"(不要用 lucide icon · 跟截图一致)

---

## 12 · 报告格式

```
DONE / BLOCKED

写了 X 个文件: ...
typecheck: PASS / FAIL
异常: ...
下一步建议 Opus 做的事: ...
```
