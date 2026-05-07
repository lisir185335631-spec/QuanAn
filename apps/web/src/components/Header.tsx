import { Menu, LogOut, Plus, ChevronDown, Wrench, User, Cpu, LogIn } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';

// ── Static data ────────────────────────────────────────────────────────────────

const MOCK_ACCOUNTS = [
  { id: 'acc-1', name: '个人IP号', platform: '抖音', active: true },
  { id: 'acc-2', name: '企业品牌号', platform: '小红书', active: false },
  { id: 'acc-3', name: '测试账号', platform: 'B站', active: false },
] as const;

const TOOLS_14 = [
  { label: '全网爆款库', href: '/trending', category: '市场洞察' },
  { label: '爆款文案解析', href: '/video-analysis', category: '市场洞察' },
  { label: '14 呈现形式', href: '/present-styles', category: '市场洞察' },
  { label: 'IP 变现模型', href: '/monetization', category: '变现设计' },
  { label: '私域成交', href: '/private-domain', category: '变现设计' },
  { label: '爆款元素生成', href: '/boom-generate', category: '变现设计' },
  { label: 'AI 智能生成', href: '/generate', category: '内容创作' },
  { label: '文案结构分析', href: '/analysis', category: '内容创作' },
  { label: '短视频制作', href: '/video-production', category: '内容创作' },
  { label: '获客型视频', href: '/acquisition-video', category: '内容创作' },
  { label: '一键生成视频', href: '/ai-video', category: '智能工具' },
  { label: '语音对话', href: '/voice-chat', category: '智能工具' },
  { label: '深度学习', href: '/deep-learning', category: '智能工具' },
  { label: '方法论知识库', href: '/knowledge', category: '智能工具' },
] as const;

const NEW_MODULES_6 = [
  { label: 'IP 诊断', href: '/diagnosis' },
  { label: '每日任务', href: '/daily-tasks' },
  { label: '进化中心', href: '/evolution' },
  { label: 'IP 账号', href: '/accounts' },
  { label: '选题库', href: '/my-topics' },
  { label: '历史记录', href: '/history' },
] as const;

// ── Sub-components ─────────────────────────────────────────────────────────────

function UserDropdown() {
  const { user, login, logout } = useAuth();

  if (!user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 h-8 px-2 text-on-surface"
        aria-label="登录"
        data-testid="header-login-button"
        onClick={login}
      >
        <LogIn className="h-4 w-4" />
        <span className="text-label-md font-medium">登录</span>
      </Button>
    );
  }

  const initials = user.name
    .split(' ')
    .map((n: string) => n[0])
    .join('');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          aria-label="用户菜单"
          data-testid="header-user-trigger"
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src="" alt={user.name} />
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" data-testid="header-user-menu">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="text-body-sm font-medium text-on-surface">{user.name}</span>
            <span className="text-label-md text-muted-foreground">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          个人设置
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive-foreground focus:text-destructive-foreground"
          onClick={logout}
          data-testid="header-logout-button"
        >
          <LogOut className="mr-2 h-4 w-4" />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AccountDropdown() {
  const activeAccount = MOCK_ACCOUNTS.find((a) => a.active) ?? MOCK_ACCOUNTS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 h-8 px-2 text-on-surface"
          aria-label="IP 账号切换"
          data-testid="header-account-trigger"
        >
          <Cpu className="h-3.5 w-3.5 text-primary" />
          <span className="text-label-md font-medium max-w-[90px] truncate">{activeAccount.name}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-52" data-testid="header-account-menu">
        <DropdownMenuLabel>IP 账号</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {MOCK_ACCOUNTS.map((acc) => (
          <DropdownMenuItem key={acc.id} className="gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full shrink-0 ${acc.active ? 'bg-primary' : 'bg-border'}`}
            />
            <span className="flex-1 truncate text-body-sm">{acc.name}</span>
            <span className="text-label-md text-muted-foreground">{acc.platform}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 text-primary focus:text-primary">
          <Plus className="h-4 w-4" />
          新建账号
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ToolsDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 h-8 px-2 text-on-surface"
          aria-label="工具入口"
          data-testid="header-tools-trigger"
        >
          <Wrench className="h-3.5 w-3.5 text-primary" />
          <span className="text-label-md font-medium">工具</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-56" data-testid="header-tools-menu">
        <DropdownMenuLabel>14 工具</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-52">
          {TOOLS_14.map((tool) => (
            <DropdownMenuItem key={tool.href} className="text-body-sm">
              {tool.label}
            </DropdownMenuItem>
          ))}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>6 新模块</DropdownMenuLabel>
        {NEW_MODULES_6.map((mod) => (
          <DropdownMenuItem key={mod.href} className="text-body-sm text-muted-foreground">
            {mod.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Mobile sheet navigation ────────────────────────────────────────────────────

function MobileNav() {
  const { user, login, logout } = useAuth();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:hidden"
          aria-label="打开菜单"
          data-testid="header-hamburger"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0" data-testid="header-mobile-sheet">
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
              onClick={login}
            >
              <LogIn className="h-4 w-4" />
              登录
            </Button>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(100vh-100px)]">
          <div className="px-3 py-3 space-y-1">
            <p className="px-2 text-label-md text-muted-foreground uppercase tracking-wider py-1">IP 账号</p>
            {MOCK_ACCOUNTS.map((acc) => (
              <button
                key={acc.id}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-accent text-body-sm text-on-surface"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${acc.active ? 'bg-primary' : 'bg-border'}`} />
                {acc.name}
                <span className="ml-auto text-label-md text-muted-foreground">{acc.platform}</span>
              </button>
            ))}
            <button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-accent text-body-sm text-primary">
              <Plus className="h-3.5 w-3.5" />
              新建账号
            </button>

            <Separator className="my-2" />

            <p className="px-2 text-label-md text-muted-foreground uppercase tracking-wider py-1">14 工具</p>
            {TOOLS_14.map((tool) => (
              <button
                key={tool.href}
                className="w-full flex items-center px-2 py-2 rounded-md hover:bg-accent text-body-sm text-on-surface"
              >
                {tool.label}
              </button>
            ))}

            <Separator className="my-2" />

            <p className="px-2 text-label-md text-muted-foreground uppercase tracking-wider py-1">新模块</p>
            {NEW_MODULES_6.map((mod) => (
              <button
                key={mod.href}
                className="w-full flex items-center px-2 py-2 rounded-md hover:bg-accent text-body-sm text-muted-foreground"
              >
                {mod.label}
              </button>
            ))}

            <Separator className="my-2" />

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

        <div className="hidden sm:flex items-center gap-1 flex-1">
          <AccountDropdown />
          <ToolsDropdown />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <div className="hidden sm:block">
            <UserDropdown />
          </div>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
