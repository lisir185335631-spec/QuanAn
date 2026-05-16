/**
 * AccountSwitcher — PRD-15 US-001 AC-5
 * 头部账号切换器 · 列出所有 IP 账号(含 5 mock 账号)
 * 切换走 useActiveAccount.switchTo(accountId) 整页刷新
 */

import { ChevronDown, Cpu, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { trpc } from '@/lib/trpc';

interface AccountSwitcherProps {
  onCreateAccount?: () => void;
}

export function AccountSwitcher({ onCreateAccount }: AccountSwitcherProps) {
  const { account: activeAccount, switchTo } = useActiveAccount();
  const { data: accounts = [] } = trpc.ipAccounts.list.useQuery(undefined, {
    staleTime: 30_000,
  });

  const n = accounts.length;

  const accountItems = accounts.map((acc) => (
    <DropdownMenuItem
      key={acc.id}
      className="gap-2 cursor-pointer"
      onClick={() => switchTo(acc.id)}
      data-testid={`account-switcher-item-${acc.id}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full shrink-0 ${acc.id === activeAccount?.id ? 'bg-primary' : 'bg-border'}`}
      />
      <span className="flex-1 truncate text-body-sm">{acc.name}</span>
      <span className="text-label-md text-muted-foreground">{acc.platform}</span>
    </DropdownMenuItem>
  ));

  const accountList =
    n >= 4 ? (
      <ScrollArea className="h-60">{accountItems}</ScrollArea>
    ) : n >= 2 ? (
      <div style={{ maxHeight: `${n * 44}px`, overflowY: 'auto' }}>{accountItems}</div>
    ) : (
      <div>{accountItems}</div>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 rounded-lg text-xs bg-secondary/50 border border-primary/15 hover:border-primary/30 px-2.5 py-1.5"
          aria-label="IP 账号切换"
          data-testid="account-switcher-trigger"
        >
          <Cpu className="h-3.5 w-3.5 text-primary" />
          <span className="text-label-md font-medium max-w-[90px] truncate">
            {activeAccount?.name ?? '—'}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-52 rounded-xl border border-primary/15 bg-popover/95 backdrop-blur-xl shadow-lg shadow-primary/5" data-testid="account-switcher-menu">
        <DropdownMenuLabel>IP 账号</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {accountList}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 text-primary focus:text-primary cursor-pointer"
          onClick={onCreateAccount}
          data-testid="account-switcher-create"
        >
          <Plus className="h-4 w-4" />
          新建账号
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
