# SPEC · /ip-plan 1:1 复刻

> **目标** · `apps/web/src/pages/IpPlan.tsx` + `components/ip-plan/IpPlanStepGrid.tsx` 改造 · sally 真实页 1:1 · 关联现有 9 step page
> **截图** · 3 张
> **风险** · L(全 UI labels · 0 sally 长内容)

---

## §1 · 5 大偏离

| # | 偏离 | 现状 | sally 真实 |
|:-:|---|---|---|
| 1 | step grid 视觉 | grid-3/5 紧凑卡 + emoji | 单列 full-width 大卡(rounded-xl + p-5)· lucide icon 圆 |
| 2 | 完成态视觉 | inline `✓ 已完成·数据已保存` + 查看详情 btn | icon 圆 filled 金 + h3 title + `已完成`(灰) + 右 ✓绿圈 + `查看详情 →` · 完成卡下方含子行(`已选择行业: other` / `数据已保存` 等) |
| 3 | 未完成态视觉 | 灰边框 + `未完成` 灰字 | icon 圆 暗 bg-card + h3 title + `未完成` 灰 + 右 ○ 灰圈 + `去完成 →` |
| 4 | 数据源 | trpc.stepData.progress(后端)· loading skeleton | mock-first · 默认前 4 完成 · 后 5 未完成 |
| 5 | 底部 CTA | 无 | `还有 N 步未完成，继续打造你的IP吧！` + `继续下一步` btn(金底 + ChevronRight · navigate 第一个未完成 step) |

---

## §2 · 字面 + 视觉

### 2.1 顶部

- 左 link · `← 返回首页`(ArrowLeft icon · variant ghost)→ `/`
- 右 btn · `刷新`(RefreshCw icon · outline · click `window.location.reload()` 或 mock 切换)

### 2.2 标题区

- h1 · `我的IP方案`(FileText icon 金 prefix · text-3xl bold)
- 副标 · `已完成 {completed}／9 步`(白`已完成` + 金 bold 数字)

### 2.3 进度 card

- card · rounded-xl + bg-card + border + p-6
- row 1 · `IP打造进度` 灰小字 + 右 `{percent}%` 金 bold 大
- row 2 · 全宽 bar h-4 · 金渐变填充 width = percent

### 2.4 9 step list(单列 vertical)

每 step card · `rounded-xl + bg-card + border + p-5` · `flex justify-between items-center` · 左 group(icon 圆 + 文字)· 右 group(✓/○ + `查看详情/去完成 →`) ·

完成态 ·
- left icon 圆 · w-14 h-14 + bg-primary/10 + 金 lucide icon
- title · h3 bold 白
- status · `已完成` 灰
- right · CheckCircle2 绿 + `查看详情` + ChevronRight 灰

未完成态 ·
- left icon 圆 · w-14 h-14 + bg-card/40 + 灰 lucide icon
- title · h3 bold(灰)
- status · `未完成` 灰
- right · Circle 灰 + `去完成` + ChevronRight 灰

完成卡下方(`mt-3 pt-3 border-t border-border/40`)· 含一行附加信息(子行 灰小字)·

| step | 完成态附加文字 |
|:-:|---|
| 1 · 行业选择 | `已选择行业：other` |
| 2-9 · 其他 | `数据已保存` |

### 2.5 底部 CTA(若有未完成)

- center `还有 {N} 步未完成，继续打造你的IP吧！` 灰
- 居中 btn · `继续下一步` 金底 + ChevronRight · click navigate to first uncompleted step's href

### 2.6 9 step 完整 mock(default state)

| # | icon | title | href | 默认 done |
|:-:|---|---|---|:-:|
| 1 | LayoutGrid | `行业选择` | `/step/1` | ✓ |
| 2 | Users | `账号包装` | `/step/3` | ✓ |
| 3 | Fingerprint | `人设定制` | `/step/3b` | ✓ |
| 4 | Target | `执行计划` | `/step/4` | ✓ |
| 5 | DollarSign | `变现路径` | `/step/4b` | ○ |
| 6 | TrendingUp | `爆款选题` | `/step/5` | ○ |
| 7 | Camera | `拍摄计划` | `/step/6` | ○ |
| 8 | Sparkles | `文案生成` | `/step/7` | ○ |
| 9 | Radio | `直播策划` | `/step/8` | ○ |

注 · 默认 completed = 4 · percent = `Math.round(4/9*100)` = 44

---

## §3 · constants 改动

### 3.1 `lib/constants/ipPlan.ts` · 新建

```ts
import type { LucideIcon } from 'lucide-react';
import {
  Camera, DollarSign, Fingerprint, LayoutGrid, Radio, Sparkles,
  Target, TrendingUp, Users,
} from 'lucide-react';

export const IP_PLAN_H1 = '我的IP方案' as const;
export const IP_PLAN_SUBTITLE_TPL = (done: number, total: number) =>
  `已完成 ${done}／${total} 步` as const;
export const IP_PLAN_BACK_HOME = '返回首页' as const;
export const IP_PLAN_REFRESH = '刷新' as const;
export const IP_PLAN_PROGRESS_LABEL = 'IP打造进度' as const;
export const IP_PLAN_STATUS_DONE = '已完成' as const;
export const IP_PLAN_STATUS_TODO = '未完成' as const;
export const IP_PLAN_VIEW_DETAIL = '查看详情' as const;
export const IP_PLAN_GO_COMPLETE = '去完成' as const;
export const IP_PLAN_FOOTER_TPL = (n: number) =>
  `还有 ${n} 步未完成，继续打造你的IP吧！` as const;
export const IP_PLAN_NEXT_BTN = '继续下一步' as const;

export interface IpPlanStep {
  id: string;
  icon: LucideIcon;
  title: string;
  href: string;
  done: boolean;
  extra: string; // 完成态附加行
}

export const IP_PLAN_STEPS: ReadonlyArray<IpPlanStep> = [
  { id: 'step1',  icon: LayoutGrid,  title: '行业选择', href: '/step/1',  done: true,  extra: '已选择行业：other' },
  { id: 'step2',  icon: Users,       title: '账号包装', href: '/step/3',  done: true,  extra: '数据已保存' },
  { id: 'step3b', icon: Fingerprint, title: '人设定制', href: '/step/3b', done: true,  extra: '数据已保存' },
  { id: 'step4',  icon: Target,      title: '执行计划', href: '/step/4',  done: true,  extra: '数据已保存' },
  { id: 'step4b', icon: DollarSign,  title: '变现路径', href: '/step/4b', done: false, extra: '' },
  { id: 'step5',  icon: TrendingUp,  title: '爆款选题', href: '/step/5',  done: false, extra: '' },
  { id: 'step6',  icon: Camera,      title: '拍摄计划', href: '/step/6',  done: false, extra: '' },
  { id: 'step7',  icon: Sparkles,    title: '文案生成', href: '/step/7',  done: false, extra: '' },
  { id: 'step8',  icon: Radio,       title: '直播策划', href: '/step/8',  done: false, extra: '' },
];
```

---

## §4 · sub-component

新建 in `apps/web/src/components/ip-plan/` ·

| 文件 | 用途 |
|---|---|
| `IpPlanHeader.tsx` | 返回首页 + h1 + subtitle + 刷新 btn |
| `IpPlanProgressCard.tsx` | IP打造进度 + 百分比 + bar |
| `IpPlanStepList.tsx` | 9 step vertical list(替换老 grid) |
| `IpPlanStepCard.tsx` | 单 step card(icon 圆 + title + status + 完成态 extra row + 右 btn) |
| `IpPlanFooter.tsx` | 还有 N 步... + 继续下一步 btn |

---

## §5 · page rewrite

### 5.1 `apps/web/src/pages/IpPlan.tsx` · 大改(70 → ~45 行)

```tsx
import { useNavigate } from 'react-router-dom';

import { IpPlanFooter } from '@/components/ip-plan/IpPlanFooter';
import { IpPlanHeader } from '@/components/ip-plan/IpPlanHeader';
import { IpPlanProgressCard } from '@/components/ip-plan/IpPlanProgressCard';
import { IpPlanStepList } from '@/components/ip-plan/IpPlanStepList';
import { IP_PLAN_STEPS } from '@/lib/constants/ipPlan';

export default function IpPlan() {
  const navigate = useNavigate();
  const completed = IP_PLAN_STEPS.filter((s) => s.done).length;
  const total = IP_PLAN_STEPS.length;
  const remaining = total - completed;
  const firstUncompleted = IP_PLAN_STEPS.find((s) => !s.done);

  return (
    <main className="flex-1 container mx-auto max-w-4xl py-8 space-y-6">
      <IpPlanHeader completed={completed} total={total} />
      <IpPlanProgressCard percent={Math.round((completed / total) * 100)} />
      <IpPlanStepList steps={IP_PLAN_STEPS} />
      {remaining > 0 && firstUncompleted && (
        <IpPlanFooter
          remaining={remaining}
          onNext={() => navigate(firstUncompleted.href)}
        />
      )}
    </main>
  );
}
```

删 · trpc.stepData.progress / isLoading / refetch / 老 IpPlanStepGrid 5-col grid / glass-card / data-grid-bg

---

## §6 · 文件清单

| 文件 | 操作 |
|---|---|
| `lib/constants/ipPlan.ts` | **新建** |
| `components/ip-plan/IpPlanHeader.tsx` | **新建** |
| `components/ip-plan/IpPlanProgressCard.tsx` | **新建** |
| `components/ip-plan/IpPlanStepList.tsx` | **新建** |
| `components/ip-plan/IpPlanStepCard.tsx` | **新建** |
| `components/ip-plan/IpPlanFooter.tsx` | **新建** |
| `components/ip-plan/IpPlanStepGrid.tsx` | **保留**(其他 page 可能用 · 不删 · IpPlan.tsx 不再 import) |
| `pages/IpPlan.tsx` | **rewrite** 70 → ~45 行 |
| 老 test | 改 / 新建 |

**不动** · backend / trpc.stepData

---

## §7 · 验收

D1 字面 · innerText grep · 必命中 ·
- `我的IP方案` 1 次 + `已完成 4／9 步` 1 次
- `返回首页` / `刷新` 各 1 次
- `IP打造进度` 1 次 + `44%` 1 次
- 9 step title 各 1 次(行业选择/账号包装/人设定制/执行计划/变现路径/爆款选题/拍摄计划/文案生成/直播策划)
- `已完成` ≥ 5 次 / `未完成` ≥ 5 次
- `查看详情` 4 次 / `去完成` 5 次
- `已选择行业：other` 1 次 + `数据已保存` 3 次
- `还有 5 步未完成，继续打造你的IP吧！` 1 次 + `继续下一步` 1 次
- 字面命中率 ≥ 99%

D2 · 视觉 · 单列大卡 · 完成态金 icon ✓ / 未完成 灰 icon ○ · 底部 CTA 金底
D3 · 交互 · step click navigate /step/N · `继续下一步` click navigate first todo step · 刷新 reload
D4 · 状态 · mock 静态(IP_PLAN_STEPS const · default 4 done)
D6 · typecheck + test 全绿

---

## §8 · Sonnet 流程

1. 新建 `lib/constants/ipPlan.ts`(SPEC §3.1)
2. 新建 5 子组件
3. rewrite `pages/IpPlan.tsx`(SPEC §5.1)
4. 改 / 新建 test
5. 跑 typecheck + test 全绿
6. 报告

---

## §9 · 红线

1. ❌ hardcode 字面 · 走 constants
2. ❌ 半角中文标点(`，` `。` `！` `／` 全角 · 注意 4／9 用 ／ 不是 /)
3. ❌ 保留 trpc.stepData.progress / IpPlanStepGrid(IpPlan.tsx 不 import · grid 文件保留供其他 page)
4. ❌ emoji icon · 全 lucide
5. ❌ 动 backend / `apps/api/`
6. ❌ 装新 npm 包
