/**
 * LiquidShell.tsx — 首页专属液态玻璃外壳
 *
 * 从 IKBLayout 完整搬运:
 *  - zoom 缩放机制(DESIGN_WIDTH=1360 + zoom)
 *  - NavDropdowns(一级/二级下拉) — 功能逻辑一字不改
 *  - AccountSwitcher(useActiveAccount + trpc) — 功能逻辑一字不改
 *  - HeaderRight(useAuth) — 功能逻辑一字不改
 *  - BrandMark
 *  - footer
 *
 * 视觉皮换成液态玻璃:深色玻璃导航条 · 白字 · 玻璃下拉面板 · 玻璃页脚
 */
import { ChevronDown, LogIn, LogOut, Settings } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import ReactDOM from 'react-dom';
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

import '@/styles/liquid-glass.css';

const DESIGN_WIDTH = 1360;
const MAX_ZOOM = 1.4;

// 字体与色板(液态玻璃版,对齐 system.tsx)
const F = {
  display: "'Smiley Sans', 'Noto Sans SC', sans-serif",
  mono: "'Space Mono', ui-monospace, monospace",
  cn: "'Noto Sans SC', sans-serif",
};
const C = {
  ikb: '#A8C5E0',
  ink: 'rgba(255,255,255,0.92)',
  dim: 'rgba(255,255,255,0.55)',
  line: 'rgba(255,255,255,0.18)',
  grad: 'linear-gradient(110deg,#d4e6ff 0%,#a8c5e0 52%,#7fb0e6 100%)',
  textShadow: '0 1px 2px rgba(8,20,48,.25)',
};

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
  '/deep-learning': 'school',
  '/evolution': 'trending_up',
  '/accounts': 'manage_accounts',
  '/knowledge': 'menu_book',
  '/guide': 'help',
  '/ip-plan': 'description',
  '/my-topics': 'bookmark',
  '/history': 'history',
};

// ── NavDropdowns (逻辑不变 · 只换视觉皮) ─────────────────────────────────────
function NavDropdowns({ pathname }: { pathname: string }) {
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {HEADER_NAV.map((group) => {
        const active = group.items.some((it) => it.href === pathname);
        return (
          <DropdownMenu key={group.label}>
            <DropdownMenuTrigger asChild>
              <button
                data-active={active ? 'true' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 20px',
                  fontFamily: F.cn,
                  fontWeight: 700,
                  fontSize: 16.5,
                  letterSpacing: '0.04em',
                  color: active ? '#fff' : C.ink,
                  background: active ? 'rgba(168,197,224,0.22)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 8,
                  textShadow: C.textShadow,
                }}
              >
                {group.label}
                <ChevronDown size={12} style={{ opacity: 0.5 }} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              style={{
                fontFamily: F.cn,
                minWidth: 208,
                background: 'rgba(22,40,72,0.82)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '0.5px solid rgba(255,255,255,0.22)',
                borderRadius: 14,
                boxShadow: '0 16px 40px -8px rgba(8,20,48,0.52)',
              }}
            >
              {group.items.map((it) => {
                const cur = it.href === pathname;
                return (
                  <DropdownMenuItem key={it.href} asChild className="p-0 focus:bg-transparent">
                    <Link
                      to={it.href}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 11,
                        padding: '9px 12px',
                        fontSize: 14,
                        fontWeight: cur ? 700 : 400,
                        color: cur ? '#fff' : C.ink,
                        background: cur ? 'rgba(168,197,224,0.25)' : 'transparent',
                        textDecoration: 'none',
                        borderRadius: 8,
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 18, color: cur ? '#fff' : C.ikb }}
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

// ── AccountSwitcher (逻辑不变) ─────────────────────────────────────────────────
function AccountSwitcher() {
  const { account, switchTo } = useActiveAccount();
  const { data: accounts = [] } = trpc.ipAccounts.list.useQuery(undefined, { staleTime: 30_000 });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            padding: '5px 11px 5px 5px',
            background: 'rgba(255,255,255,0.12)',
            border: '0.5px solid rgba(255,255,255,0.28)',
            cursor: 'pointer',
            borderRadius: 9999,
          }}
          aria-label="IP 账号切换"
        >
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: C.grad,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: F.display,
              fontSize: 13,
              lineHeight: 1,
            }}
          >
            {(account?.name ?? 'A').slice(0, 1)}
          </span>
          <span
            style={{
              fontFamily: F.cn,
              fontSize: 13,
              color: C.ink,
              maxWidth: 88,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textShadow: C.textShadow,
            }}
          >
            {account?.name ?? '—'}
          </span>
          <ChevronDown size={12} color="rgba(255,255,255,0.55)" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        style={{
          fontFamily: F.cn,
          width: 210,
          background: 'rgba(22,40,72,0.82)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '0.5px solid rgba(255,255,255,0.22)',
          borderRadius: 14,
          boxShadow: '0 16px 40px -8px rgba(8,20,48,0.52)',
        }}
      >
        <DropdownMenuLabel
          style={{
            fontFamily: F.mono,
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: C.dim,
            padding: '6px 10px',
          }}
        >
          IP 账号
        </DropdownMenuLabel>
        <DropdownMenuSeparator style={{ background: C.line }} />
        <div style={{ maxHeight: 240, overflowY: 'auto' }}>
          {accounts.map((acc) => (
            <DropdownMenuItem
              key={acc.id}
              onClick={() => switchTo(acc.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                fontSize: 13,
                color: C.ink,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 9999,
                  background: acc.id === account?.id ? C.ikb : C.line,
                }}
              />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {acc.name}
              </span>
              <span style={{ fontFamily: F.mono, fontSize: 10, color: C.dim }}>{acc.platform}</span>
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator style={{ background: C.line }} />
        <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
          <Link
            to="/accounts"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              fontSize: 13,
              color: C.ink,
              textDecoration: 'none',
            }}
          >
            <Settings size={14} color={C.ikb} />
            管理账号
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── HeaderRight (逻辑不变) ─────────────────────────────────────────────────────
function HeaderRight() {
  const { user, login, logout } = useAuth();
  if (!user) {
    return (
      <button
        onClick={() => void login()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          fontFamily: F.cn,
          fontSize: 13,
          color: C.ink,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textShadow: C.textShadow,
        }}
        aria-label="登录"
      >
        <LogIn size={15} />
        登录
      </button>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <AccountSwitcher />
      <span style={{ width: 1, height: 22, background: C.line }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: C.grad,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: F.display,
            fontSize: 13,
            lineHeight: 1,
          }}
        >
          {(user.name ?? '').slice(0, 1)}
        </span>
        <span style={{ fontFamily: F.cn, fontSize: 13, fontWeight: 500, color: C.ink, textShadow: C.textShadow }}>
          {user.name ?? ''}
        </span>
      </div>
      <button
        onClick={logout}
        aria-label="退出登录"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 30,
          width: 30,
          color: C.dim,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <LogOut size={15} />
      </button>
    </div>
  );
}

// ── BrandMark (液态玻璃版:冷蓝渐变六边形) ────────────────────────────────────
function BrandMark({ size = 42 }: { size?: number }) {
  return (
    <span style={{ display: 'inline-flex', flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <defs>
          <linearGradient id="lg-hex" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#d4e6ff" />
            <stop offset="0.5" stopColor="#a8c5e0" />
            <stop offset="1" stopColor="#7fb0e6" />
          </linearGradient>
        </defs>
        <path
          d="M12 2.3 20.7 7.2 20.7 16.8 12 21.7 3.3 16.8 3.3 7.2Z"
          fill="url(#lg-hex)"
          stroke="url(#lg-hex)"
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

// ── 流体背景层 — fixed 全屏 portal · 脱离 zoom · 各页共用 ──────────────────────
function FluidPortal() {
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = document.createElement('div');
    el.className = 'lg-root';
    el.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;';
    document.body.appendChild(el);
    ref.current = el;
    setMounted(true);
    return () => {
      document.body.removeChild(el);
    };
  }, []);
  if (!mounted || !ref.current) return null;
  return ReactDOM.createPortal(
    <>
      <div className="lg-fluid" />
      <div className="lg-grain" />
    </>,
    ref.current,
  );
}

// ── LiquidShell (主导出) ──────────────────────────────────────────────────────
export function LiquidShell({ children }: { children: ReactNode }) {
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
      className="lg-root"
      style={{
        display: 'flex',
        minHeight: '100vh',
        flexDirection: 'column',
        overflowX: 'hidden',
        background: 'transparent',
        color: 'rgba(255,255,255,0.92)',
        fontFamily: F.cn,
      }}
    >
      {/* 流体背景 — 内置,各页共用 */}
      <FluidPortal />

      {/* 顶栏 — 液态玻璃深色导航条 */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          width: '100%',
          background: 'rgba(18,34,66,0.72)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '0.5px solid rgba(255,255,255,0.16)',
          boxShadow: '0 4px 24px -6px rgba(8,20,48,0.32)',
        }}
      >
        <div className="mx-auto" style={{ width: DESIGN_WIDTH, zoom }}>
          <div style={{ display: 'flex', height: 76, width: '100%', alignItems: 'center', padding: '0 40px' }}>
            {/* 品牌 */}
            <Link
              to="/"
              style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 11, textDecoration: 'none' }}
            >
              <BrandMark size={42} />
              <span
                style={{
                  fontFamily: F.display,
                  fontSize: 28,
                  lineHeight: 1,
                  letterSpacing: '-0.012em',
                  background: C.grad,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent',
                }}
              >
                AIP
              </span>
            </Link>
            {/* 导航居中 */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <NavDropdowns pathname={pathname} />
            </div>
            {/* 右侧账号 */}
            <HeaderRight />
          </div>
        </div>
      </header>

      {/* 内容 */}
      <main style={{ flex: 1, background: 'transparent', position: 'relative', zIndex: 2 }}>
        <div className="mx-auto" style={{ width: DESIGN_WIDTH, zoom }}>
          <div style={{ width: '100%', padding: '40px' }}>{children}</div>
        </div>
      </main>

      {/* 页脚 — 深玻璃 + 白字 */}
      <footer
        style={{
          position: 'relative',
          width: '100%',
          background: 'rgba(12,26,56,0.78)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          borderTop: '0.5px solid rgba(255,255,255,0.16)',
          overflow: 'hidden',
          zIndex: 2,
        }}
      >
        {/* 巨幅得意黑水印 */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: -10,
            bottom: -46,
            fontFamily: F.display,
            fontSize: 200,
            lineHeight: 1,
            color: C.ikb,
            opacity: 0.04,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          AIP
        </div>

        <div
          className="mx-auto"
          style={{ position: 'relative', maxWidth: DESIGN_WIDTH, padding: '52px 40px 26px' }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 48,
              flexWrap: 'wrap',
            }}
          >
            {/* 品牌时刻 */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 14 }}>
                <BrandMark size={46} />
                <span style={{ fontFamily: F.display, fontSize: 42, lineHeight: 1, letterSpacing: '-0.012em', display: 'inline-flex', alignItems: 'baseline' }}>
                  <span
                    style={{
                      background: C.grad,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      color: 'transparent',
                    }}
                  >
                    AIP
                  </span>
                  <span style={{ color: C.ikb }}>.</span>
                </span>
              </div>
              <div
                style={{
                  fontFamily: F.mono,
                  fontSize: 11.5,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.55)',
                }}
              >
                AI Full-Chain IP Monetization Engine
              </div>
              <div
                style={{
                  fontFamily: F.cn,
                  fontSize: 13.5,
                  color: 'rgba(255,255,255,0.65)',
                  marginTop: 12,
                  maxWidth: 360,
                  lineHeight: 1.6,
                }}
              >
                善用 AI,你一个人就是千军万马。
              </div>
            </div>

            {/* 链接分栏 */}
            <div style={{ display: 'flex', gap: 56 }}>
              {[
                { h: 'PRODUCT', items: ['Documentation', 'System Status', 'Global API'] },
                { h: 'PROTOCOL', items: ['Privacy Policy', 'The Pioneer Protocol'] },
              ].map((col) => (
                <div key={col.h}>
                  <div
                    style={{
                      fontFamily: F.mono,
                      fontSize: 10.5,
                      letterSpacing: '0.2em',
                      color: C.ikb,
                      marginBottom: 16,
                    }}
                  >
                    {col.h}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {col.items.map((l) => (
                      <button
                        key={l}
                        type="button"
                        style={{
                          alignSelf: 'flex-start',
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          textAlign: 'left',
                          fontFamily: F.cn,
                          fontSize: 13.5,
                          color: 'rgba(255,255,255,0.72)',
                          cursor: 'pointer',
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 底排 */}
          <div
            style={{
              marginTop: 38,
              paddingTop: 18,
              borderTop: '0.5px solid rgba(255,255,255,0.16)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 10.5,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.38)',
              }}
            >
              © 2026 AIP Intelligent Platform
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 10.5,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.38)',
              }}
            >
              北京 · Beijing · 邀请制内测
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
