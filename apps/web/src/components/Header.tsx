import { Menu, LogOut, ChevronDown, LogIn, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AccountSwitcher } from '@/components/AccountSwitcher';
import { MobileNavPanel } from '@/components/header/MobileNavPanel';
import { useAuth } from '@/hooks/useAuth';
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
              className="group gap-1 h-8 px-2.5 text-on-surface"
              aria-label={group.label}
            >
              <span className="text-label-md font-medium">{group.label}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
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

// ── Header ─────────────────────────────────────────────────────────────────────

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-border bg-surface-container-low/90 backdrop-blur-2xl"
      data-testid="app-header"
    >
      <div className="container flex h-16 items-center gap-2">
        <Link to="/" className="flex items-center gap-2 mr-3">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center shrink-0">
            <span className="text-on-primary font-display font-black text-xs">Q</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display font-bold text-primary text-sm tracking-tight">QUAN</span>
            <span className="font-display font-bold text-primary text-sm tracking-tight">AN</span>
          </div>
        </Link>

        <div className="flex-1 flex justify-center">
          <HeaderNav />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <div className="hidden sm:block">
            <HeaderRight />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:hidden"
            aria-label="打开菜单"
            data-testid="header-hamburger"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      <MobileNavPanel open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
