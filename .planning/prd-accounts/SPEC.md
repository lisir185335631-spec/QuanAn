# SPEC · /accounts 1:1 复刻

> **目标** · `apps/web/src/pages/modules/Accounts.tsx` + `components/accounts/IpAccountCard.tsx` 改造 · sally 真实页 1:1
> **风险** · L(简单页 · 仅 1 demo card + header + 新建 btn)

---

## §1 · 5 大偏离(现状 PRD-23 → sally)

| # | 偏离 | 现状 | sally 真实 |
|:-:|---|---|---|
| 1 | h1 字面 | `IP 账号管理`(空格) | `IP账号管理`(无空格) |
| 2 | subtitle | `管理多个 IP 账号，每个账号独立配置行业、定位和人设` | `管理多个IP账号，每个账号独立配置行业、定位和人设`(无空格) |
| 3 | 数据源 | `trpc.ipAccounts.list.useQuery()` | mock-first · default 1 demo `赵语AI` |
| 4 | card 字段视觉 | inline text(industry · platform · followersRange 粉丝) | 4 chip 横排(各 lucide icon + label) |
| 5 | 操作 btn | 底部 删除/编辑 btn | 无(简化) |

---

## §2 · 字面源(完整)

### 2.1 header

| 字段 | 字面 |
|---|---|
| h1 | `IP账号管理` |
| subtitle | `管理多个IP账号，每个账号独立配置行业、定位和人设` |
| 新建 btn | `新建账号`(`+` icon prefix) |

### 2.2 demo account mock(1 entry)

| 字段 | 值 |
|---|---|
| id | `1` |
| avatar 字 | `赵`(name[0]) |
| name | `赵语AI` |
| industry chip | `企业服务`(Building icon) |
| platform chip | `抖音`(Globe icon) |
| followers chip | `1-1000粉`(Users icon) |
| positioning chip | `从零开始做IP`(Target icon) |
| desc | `定制智能体和opc培训` |
| active | `true`(ACTIVE chip 绿) |

### 2.3 ACTIVE chip

- 绿 bg(`bg-emerald-500/20`)+ 绿字(`text-emerald-400`)
- `CheckCircle2` icon w-3 h-3 prefix
- text · `ACTIVE`(大写)

---

## §3 · 视觉

- main · `max-w-6xl mx-auto py-8 space-y-8`
- header · `flex justify-between items-start` · 左 h1+subtitle · 右 新建 btn 金底 `+ 新建账号`
- account list · `space-y-4`(单列 stack · sally 截图无 grid)
- card · 大圆角 + 金边 hover · padding p-6
- avatar · w-16 h-16 圆 + 粉色 gradient(`bg-gradient-to-br from-pink-500 to-pink-400`)+ 白字 bold text-2xl
- name · text-xl white bold
- 4 chip row · `flex flex-wrap gap-2` · 每 chip · border-border + bg-card/40 + rounded-md + px-3 py-1 + icon w-4 h-4 + label text-sm
- desc · text-sm muted-foreground
- ACTIVE chip · 绝对定位右上

---

## §4 · 文件改动

| 文件 | 操作 |
|---|---|
| `lib/constants/accounts.ts` | **新建**(IpAccountMock + chip mapping + page labels) |
| `components/accounts/IpAccountCard.tsx` | **rewrite**(4 chip + 删 操作 btn + ACTIVE chip 绿改) |
| `components/accounts/AccountChipRow.tsx` | **新建**(4 chip 横排) |
| `pages/modules/Accounts.tsx` | **rewrite**(58 → ~50 行 · 删 trpc · default mock 1 account · 字面无空格) |
| 老 test | 改字面对齐 |

**不动** · `CreateAccountModal`(保留) / backend / useActiveAccount

---

## §5 · constants(新建)

```ts
import type { LucideIcon } from 'lucide-react';
import { Building2, Globe, Target, Users } from 'lucide-react';

export const ACCOUNTS_H1 = 'IP账号管理' as const;
export const ACCOUNTS_SUBTITLE = '管理多个IP账号，每个账号独立配置行业、定位和人设' as const;
export const ACCOUNTS_CREATE_BTN = '新建账号' as const;
export const ACCOUNT_ACTIVE_CHIP = 'ACTIVE' as const;

export interface AccountChip {
  icon: LucideIcon;
  label: string;
}

export interface IpAccountMock {
  id: number;
  name: string;
  desc: string;
  active: boolean;
  chips: ReadonlyArray<AccountChip>;
}

export const ACCOUNTS_MOCK: ReadonlyArray<IpAccountMock> = [
  {
    id: 1,
    name: '赵语AI',
    desc: '定制智能体和opc培训',
    active: true,
    chips: [
      { icon: Building2, label: '企业服务' },
      { icon: Globe,     label: '抖音' },
      { icon: Users,     label: '1-1000粉' },
      { icon: Target,    label: '从零开始做IP' },
    ],
  },
];

export const ACCOUNTS_TOAST_CREATE = '新建账号 · 即将上线' as const;
```

---

## §6 · 红线

1. ❌ hardcode 字面 · 必走 constants
2. ❌ 中文标点变半角
3. ❌ 保留 trpc.ipAccounts / loading / empty state / 操作 btn 残留
4. ❌ chip 不能用 emoji · 必用 lucide
5. ❌ 动 backend / `CreateAccountModal`(此页改为简单 toast `新建账号 · 即将上线`)

---

## §7 · Sonnet 流程(4 步)

1. 新建 `lib/constants/accounts.ts`(SPEC §5)
2. 新建 `components/accounts/AccountChipRow.tsx` · rewrite `IpAccountCard.tsx`(4 chip 视觉 + 绿 ACTIVE + 删 btn)
3. rewrite `pages/modules/Accounts.tsx`(mock-first · 1 default account · 新建 btn toast)
4. 跑 typecheck + test 全绿
