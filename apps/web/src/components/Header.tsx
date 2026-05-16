import { Menu, LogOut, Plus, ChevronDown, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AccountSwitcher } from '@/components/AccountSwitcher';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { HEADER_NAV } from '@/lib/constants/header-nav';

// ── Sub-components ─────────────────────────────────────────────────────────────

function UserChip({ name }: { name: string }) {
  return (
    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping-primary absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
      </span>
      <span className="font-cn text-sm font-medium text-foreground">{name}</span>
    </div>
  );
}

function LogoutIconButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label="退出登录"
      data-testid="header-logout-icon"
      className="h-8 w-8 text-muted-foreground hover:text-destructive"
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
}

function HeaderRight() {
  const { user, login, logout } = useAuth();

  if (!user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 h-8 px-2 text-on-surface"
        aria-label="登录"
        data-testid="header-login-button"
        onClick={() => void login()}
      >
        <LogIn className="h-4 w-4" />
        <span className="text-label-md font-medium">登录</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <AccountSwitcher />
      <UserChip name={user.name} />
      <LogoutIconButton onClick={logout} />
    </div>
  );
}

function HeaderNav() {
  return (
    <nav className="hidden lg:flex items-center gap-1">
      {HEADER_NAV.map((group) => (
        <DropdownMenu key={group.label}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 h-8 px-2.5 text-on-surface"
              aria-label={group.label}
            >
              <span className="text-label-md font-medium">{group.label}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="min-w-[180px] rounded-xl border border-primary/15 bg-popover/95 backdrop-blur-xl shadow-lg shadow-primary/5 mt-1"
          >
            {group.items.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link to={item.href} className="cursor-pointer">
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </nav>
  );
}

// ── Mobile sheet navigation ────────────────────────────────────────────────────

function MobileNav() {
  const { user, login, logout } = useAuth();
  const { account: activeAccount, switchTo } = useActiveAccount();
  const { data: accounts = [] } = trpc.ipAccounts.list.useQuery(undefined, {
    staleTime: 30_000,
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 lg:hidden"
          aria-label="打开菜单"
          data-testid="header-hamburger"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col" data-testid="header-mobile-sheet">
        <SheetHeader className="px-4 pt-5 pb-3 border-b border-border">
          <SheetTitle className="text-h2">QuanQn</SheetTitle>
          {user ? (
            <div className="flex flex-col gap-0.5 mt-1">
              <span className="text-body-sm font-medium text-on-surface">{user.name}</span>
              <span className="text-label-md text-muted-foreground">{user.email}</span>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 w-fit gap-1.5 text-primary"
              onClick={() => void login()}
            >
              <LogIn className="h-4 w-4" />
              登录
            </Button>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-3 py-3 space-y-1">
            <p className="px-2 text-label-md text-muted-foreground uppercase tracking-wider py-1">IP 账号</p>
            {accounts.map((acc) => (
              <button
                key={acc.id}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-accent text-body-sm text-on-surface"
                onClick={() => switchTo(acc.id)}
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

            <Separator className="my-2" />

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
                  >
                    {item.label}
                  </Link>
                ))}
                <Separator className="my-2" />
              </div>
            ))}

            {user && (
              <button
                className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent text-body-sm text-destructive-foreground"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                退出登录
              </button>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// ── Header ─────────────────────────────────────────────────────────────────────

export function Header() {
  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-border bg-surface-container-low/90 backdrop-blur-sm"
      data-testid="app-header"
    >
      <div className="container flex h-12 items-center gap-2">
        <div className="flex items-center gap-2 mr-3">
          <span className="text-body-md font-display font-semibold text-primary tracking-tight select-none">
            QuanQn
          </span>
        </div>

        <div className="flex-1 flex justify-center">
          <HeaderNav />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <div className="hidden sm:block">
            <HeaderRight />
          </div>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
