/**
 * PioneerLayout · 先锋白·工业精密版 全局外壳
 *
 * 导航框架严格沿用原全案项目(无左侧栏):
 *   顶部单栏 · 一级(创作/策划/智能/更多)各带二级下拉 · 内容通栏 · 右侧账号区。
 * 视觉皮肤 = 先锋白:克莱因蓝 #002fa7 · 白底 · Manrope · 硬投影 · Material Symbols。
 *
 * 缩放适配:整页(顶栏 + 内容 + 页脚)固定设计宽度画布,视口更窄时整体 zoom 等比缩小,
 *   所有内容(含一级导航)完整可见、不折行、不裁切、不重排。详见记忆 pioneer-scale-to-fit。
 * 重构期:仅承载已迁移到先锋白的页面,不影响其余仍用 Aurelian Dark 的页面。
 */
import { ChevronDown, Cpu, LogIn, LogOut, Settings } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { useAuth } from '@/hooks/useAuth';
import { HEADER_NAV } from '@/lib/constants/header-nav';
import { trpc } from '@/lib/trpc';

const FONT = '"Manrope", system-ui, sans-serif';

/** 基准设计画布宽度 · FitCanvas 以此为基准双向等比缩放(窄屏缩小 / 宽屏放大)*/
const DESIGN_WIDTH = 1360;

/** 宽屏放大上限 · 视口宽于基准时整页等比放大填满,但不超过此倍数(防超宽屏字大得离谱)· 可调 */
const MAX_ZOOM = 1.4;

/** 二级项 Material Symbols 图标(逐条精修) */
const ITEM_ICON: Record<string, string> = {
  '/step/5': 'local_fire_department',
  '/step/7': 'edit_document',
  '/video-analysis': 'document_scanner',
  '/acquisition-video': 'video_camera_back',
  '/present-styles': 'view_carousel',
  '/step/1': 'category',
  '/step/3': 'badge',
  '/step/3b': 'psychology',
  '/step/4': 'checklist',
  '/step/4b': 'payments',
  '/step/6': 'photo_camera',
  '/step/8': 'live_tv',
  '/private-domain': 'forum',
  '/diagnosis': 'monitor_heart',
  '/daily-tasks': 'event_available',
  '/ai-video': 'smart_display',
  '/voice-chat': 'mic',
  '/deep-learning': 'school',
  '/evolution': 'trending_up',
  '/accounts': 'manage_accounts',
  '/knowledge': 'menu_book',
  '/guide': 'help',
  '/ip-plan': 'description',
  '/my-topics': 'bookmark',
  '/history': 'history',
};

const PANEL =
  'min-w-[200px] rounded-lg border border-[#c4c5d6] bg-white p-1 pw-shadow-soft';

/** 一级导航 + 二级下拉(创作/策划/智能/更多)· 始终显示(随整页缩放)*/
function NavDropdowns({ pathname }: { pathname: string }) {
  return (
    <nav className="flex items-center gap-1">
      {HEADER_NAV.map((group) => {
        const active = group.items.some((it) => it.href === pathname);
        return (
          <DropdownMenu key={group.label}>
            <DropdownMenuTrigger asChild>
              <button
                className={[
                  'group flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[16px] font-bold uppercase tracking-widest outline-none transition-all',
                  active
                    ? 'bg-[#002fa7]/10 text-[#002fa7] shadow-sm'
                    : 'text-[#444653] hover:bg-[#f3f4f6] hover:text-[#001e73]',
                ].join(' ')}
              >
                {group.label}
                <ChevronDown className="h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" style={{ fontFamily: FONT }} className={PANEL}>
              {group.items.map((it) => {
                const cur = it.href === pathname;
                return (
                  <DropdownMenuItem
                    key={it.href}
                    asChild
                    className="rounded-md p-0 focus:bg-transparent"
                  >
                    <Link
                      to={it.href}
                      className={[
                        'flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-[14px] transition-colors',
                        cur
                          ? 'bg-[#002fa7] font-bold text-white'
                          : 'text-[#444653] hover:bg-[#f3f3f3] hover:text-[#001e73]',
                      ].join(' ')}
                    >
                      <span
                        className={`material-symbols-outlined text-[18px] ${cur ? 'icon-fill' : ''}`}
                      >
                        {ITEM_ICON[it.href] ?? 'chevron_right'}
                      </span>
                      {it.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </nav>
  );
}

/** 右侧账号区 · IP 账号切换(先锋白皮肤 · 复用真实 hooks) */
function AccountSwitcherPw() {
  const { account, switchTo } = useActiveAccount();
  const { data: accounts = [] } = trpc.ipAccounts.list.useQuery(undefined, { staleTime: 30_000 });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 rounded-md border border-[#c4c5d6] bg-[#f3f3f3] px-2.5 py-1.5 text-[12px] font-medium text-[#1b1b1b] transition-colors hover:border-[#001e73]"
          aria-label="IP 账号切换"
        >
          <Cpu className="h-3.5 w-3.5 text-[#002fa7]" />
          <span className="max-w-[90px] truncate">{account?.name ?? '—'}</span>
          <ChevronDown className="h-3 w-3 text-[#757685]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        style={{ fontFamily: FONT }}
        className="w-52 rounded-lg border border-[#c4c5d6] bg-white p-1 pw-shadow-soft"
      >
        <DropdownMenuLabel className="text-[11px] uppercase tracking-widest text-[#757685]">
          IP 账号
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#e5e7eb]" />
        <div className="max-h-60 overflow-y-auto">
          {accounts.map((acc) => (
            <DropdownMenuItem
              key={acc.id}
              onClick={() => switchTo(acc.id)}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-[#444653] focus:bg-[#f3f3f3]"
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${acc.id === account?.id ? 'bg-[#002fa7]' : 'bg-[#c4c5d6]'}`}
              />
              <span className="flex-1 truncate">{acc.name}</span>
              <span className="text-[11px] text-[#757685]">{acc.platform}</span>
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator className="bg-[#e5e7eb]" />
        <DropdownMenuItem asChild className="rounded-md p-0 focus:bg-transparent">
          <Link
            to="/accounts"
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-[#444653] hover:bg-[#f3f3f3]"
          >
            <Settings className="h-4 w-4" />
            管理账号
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function HeaderRight() {
  const { user, login, logout } = useAuth();
  if (!user) {
    return (
      <button
        onClick={() => void login()}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-medium text-[#1b1b1b] transition-colors hover:text-[#001e73]"
        aria-label="登录"
      >
        <LogIn className="h-4 w-4" />
        登录
      </button>
    );
  }
  return (
    <div className="flex shrink-0 items-center gap-3">
      <AccountSwitcherPw />
      <div className="flex items-center gap-2 rounded-md bg-[#002fa7]/5 px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-[#002fa7]" />
        <span className="text-[13px] font-medium text-[#1b1b1b]">{user.name}</span>
      </div>
      <button
        onClick={logout}
        aria-label="退出登录"
        className="flex h-8 w-8 items-center justify-center text-[#757685] transition-colors hover:text-[#ba1a1a]"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

export function PioneerLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const update = () =>
      setZoom(Math.min(MAX_ZOOM, Math.max(0.2, window.innerWidth / DESIGN_WIDTH)));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div
      className="pw-page flex min-h-screen flex-col overflow-x-hidden bg-[#f8f9fa] text-[#1b1b1b]"
      style={{ fontFamily: FONT }}
    >
      {/* ── 顶部单栏(白底通栏到头 · 内层固定 1360 居中 + 窄屏整页 zoom · 一级导航始终可见)── */}
      <header className="sticky top-0 z-50 w-full border-b border-[#c4c5d6] bg-white/90 backdrop-blur-md">
        <div className="mx-auto" style={{ width: `${DESIGN_WIDTH}px`, zoom }}>
          <div className="flex h-20 w-full items-center gap-6 px-10">
            <Link to="/" className="flex shrink-0 items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7] shadow-sm">
                <svg
                  className="h-5 w-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="M12 2.5 2.5 7 12 11.5 21.5 7z" strokeLinejoin="round" />
                  <path d="M2.5 12 12 16.5 21.5 12M2.5 16.5 12 21 21.5 16.5" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-xl font-extrabold tracking-tighter text-[#001e73]">AIP</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#757685]">
                  AGENT
                </span>
              </span>
            </Link>
            <div className="flex flex-1 justify-center">
              <NavDropdowns pathname={pathname} />
            </div>
            <HeaderRight />
          </div>
        </div>
      </header>

      {/* ── 内容(浅灰底通栏到头 · 内层固定 1360 居中 + 窄屏整页 zoom)── */}
      <main className="flex-1 bg-[#f8f9fa]">
        <div className="mx-auto" style={{ width: `${DESIGN_WIDTH}px`, zoom }}>
          <div className="w-full px-10 py-10">{children}</div>
        </div>
      </main>

      {/* ── 页脚(整宽到头 · 浅色 · 不随 zoom 缩放 · 内容居中对齐正文)── */}
      <footer className="w-full border-t border-[#e5e7eb] bg-[#f9fafb]">
        <div className="mx-auto flex w-full max-w-[1360px] flex-row items-center justify-between gap-6 px-10 py-8">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#002fa7]">
              <svg
                className="h-4 w-4 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M12 2.5 2.5 7 12 11.5 21.5 7z" strokeLinejoin="round" />
                <path d="M2.5 12 12 16.5 21.5 12M2.5 16.5 12 21 21.5 16.5" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-[15px] font-extrabold tracking-tighter text-[#001e73]">AIP</span>
          </div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-[#9ca3af]">
            © 2024 AIP INTELLIGENT PLATFORM. THE PIONEER PROTOCOL.
          </div>
          <div className="flex gap-6">
            {['Documentation', 'Privacy Policy', 'System Status', 'Global API'].map((l) => (
              <button
                key={l}
                type="button"
                className="bg-transparent p-0 text-[11px] uppercase tracking-[0.2em] text-[#9ca3af] transition-colors hover:text-[#002fa7]"
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
