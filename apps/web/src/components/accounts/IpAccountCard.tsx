/**
 * IpAccountCard — 1:1 复刻 aiipznt /accounts card
 * props: IpAccountMock · 4 chip 横排 · 粉色 gradient avatar · 绿 ACTIVE chip
 * 删 onActivate / onEdit / onDelete / 操作 btn
 */
import { CheckCircle2 } from 'lucide-react';

import { AccountChipRow } from '@/components/accounts/AccountChipRow';
import { ACCOUNT_ACTIVE_CHIP } from '@/lib/constants/accounts';
import type { IpAccountMock } from '@/lib/constants/accounts';

interface IpAccountCardProps {
  account: IpAccountMock;
}

export function IpAccountCard({ account }: IpAccountCardProps) {
  return (
    <div
      className="relative rounded-xl border border-border bg-card p-6"
      data-testid={`ip-account-card-${account.id}`}
    >
      {/* ACTIVE chip — 绝对定位右上 */}
      {account.active && (
        <span
          className="absolute top-3 right-3 inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full"
          data-testid={`ip-account-active-chip-${account.id}`}
        >
          <CheckCircle2 className="w-3 h-3 shrink-0" />
          {ACCOUNT_ACTIVE_CHIP}
        </span>
      )}

      <div className="flex items-start gap-4">
        {/* 粉色 gradient 圆形头像 w-16 h-16 */}
        <div
          className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-pink-400 flex items-center justify-center shrink-0 text-white font-bold text-2xl select-none"
          data-testid={`ip-account-avatar-${account.id}`}
        >
          {account.name[0]}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          {/* name */}
          <h3 className="text-xl font-bold text-foreground">{account.name}</h3>

          {/* 4 chip 横排 */}
          <AccountChipRow chips={account.chips} />

          {/* desc */}
          <p className="text-sm text-muted-foreground">{account.desc}</p>
        </div>
      </div>
    </div>
  );
}
