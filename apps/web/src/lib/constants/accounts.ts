import { Building2, Globe, Target, Users } from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

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
