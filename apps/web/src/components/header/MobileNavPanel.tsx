import { LogIn, LogOut, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { useAuth } from '@/hooks/useAuth';
import { HEADER_NAV } from '@/lib/constants/header-nav';
import { trpc } from '@/lib/trpc';

interface MobileNavPanelProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNavPanel({ open, onClose }: MobileNavPanelProps) {
  const { user, login, logout } = useAuth();
  const { account: activeAccount, switchTo } = useActiveAccount();
  const { data: accounts = [] } = trpc.ipAccounts.list.useQuery(undefined, {
    staleTime: 30_000,
  });

  if (!open) return null;

  return (
    <div
      className="lg:hidden border-t border-primary/10 bg-background/95 backdrop-blur-2xl max-h-[70vh] overflow-y-auto"
      data-testid="header-mobile-panel"
      role="navigation"
    >
      {/* IP 账号区 */}
      <div className="px-3 py-3 space-y-1">
        <p className="px-2 font-label uppercase tracking-wider text-label-md text-muted-foreground py-1">
          IP 账号
        </p>
        {accounts.map((acc) => (
          <button
            key={acc.id}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-accent text-body-sm text-on-surface"
            onClick={() => { switchTo(acc.id); onClose(); }}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${acc.id === activeAccount?.id ? 'bg-primary' : 'bg-border'}`}
            />
            {acc.name}
            <span className="ml-auto text-label-md text-muted-foreground">{acc.platform}</span>
          </button>
        ))}
        <button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-accent text-body-sm text-primary">
          <Plus className="h-3.5 w-3.5" />
          新建账号
        </button>
      </div>

      <Separator />

      {/* 4 大类 25 二级 — rendered from HEADER_NAV */}
      <div className="px-3 py-3 space-y-1">
        {HEADER_NAV.map((group) => (
          <div key={group.label}>
            <p className="font-label uppercase tracking-wider px-2 text-label-md text-muted-foreground py-1">
              {group.label}
            </p>
            {group.items.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="w-full flex items-center px-2 py-2 rounded-md hover:bg-accent text-body-sm text-on-surface"
                onClick={onClose}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      {/* 用户区固定底部 */}
      <div className="sticky bottom-0 bg-background/95 border-t border-primary/10 px-3 py-3">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-body-sm font-medium text-on-surface">{user.name}</span>
              <span className="text-label-md text-muted-foreground">{user.email}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              aria-label="退出登录"
              onClick={() => { logout(); onClose(); }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-primary"
            onClick={() => { void login(); onClose(); }}
          >
            <LogIn className="h-4 w-4" />
            登录
          </Button>
        )}
      </div>
    </div>
  );
}
