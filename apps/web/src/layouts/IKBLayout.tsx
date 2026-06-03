/**
 * IKBLayout · 红蓝紫渐变·先锋印刷 外壳(首页专用)
 *
 * 结构 = PioneerLayout 同构(一级/二级下拉导航 + 右侧账号区 + FitCanvas 缩放 + 页脚),
 * 仅【换皮】到编辑语言:渐变六边形 logo · 浅纸底 · 红蓝紫渐变点缀 · 锐角面板。
 * 不改 PioneerLayout 本体(其它仍用先锋白的页面不受影响)。
 */
import { ChevronDown, LogIn, LogOut, Settings } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { C, F } from '@/components/home/ikb/system';
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

const DESIGN_WIDTH = 1360;
const MAX_ZOOM = 1.4;

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

/** 一级导航 + 二级下拉(纯中文 · 居中) */
function NavDropdowns({ pathname }: { pathname: string }) {
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {HEADER_NAV.map((group) => {
        const active = group.items.some((it) => it.href === pathname);
        return (
          <DropdownMenu key={group.label}>
            <DropdownMenuTrigger asChild>
              <button
                className="ikb-navtrigger"
                data-active={active ? 'true' : undefined}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', fontFamily: F.cn, fontWeight: 700, fontSize: 16.5, letterSpacing: '0.04em', color: 'inherit', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                {group.label}
                <ChevronDown size={12} style={{ opacity: 0.4 }} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="ikb-navpanel" style={{ fontFamily: F.cn, minWidth: 208 }}>
              {group.items.map((it) => {
                const cur = it.href === pathname;
                return (
                  <DropdownMenuItem key={it.href} asChild className="p-0 focus:bg-transparent">
                    <Link
                      to={it.href}
                      className="ikb-navitem"
                      style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px', fontSize: 14, fontWeight: cur ? 700 : 400, color: cur ? '#fff' : C.ink, background: cur ? C.ikb : 'transparent', textDecoration: 'none' }}
                    >
                      <span className={`material-symbols-outlined ${cur ? 'icon-fill' : ''}`} style={{ fontSize: 18, color: cur ? '#fff' : C.ikb }}>
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

function AccountSwitcher() {
  const { account, switchTo } = useActiveAccount();
  const { data: accounts = [] } = trpc.ipAccounts.list.useQuery(undefined, { staleTime: 30_000 });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="ikb-acct"
          style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '5px 11px 5px 5px', background: 'transparent', border: `1px solid ${C.line}`, cursor: 'pointer' }}
          aria-label="IP 账号切换"
        >
          <span style={{ width: 26, height: 26, borderRadius: '50%', background: C.grad, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontSize: 13, lineHeight: 1 }}>{(account?.name ?? 'A').slice(0, 1)}</span>
          <span style={{ fontFamily: F.cn, fontSize: 13, color: C.ink, maxWidth: 88, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{account?.name ?? '—'}</span>
          <ChevronDown size={12} color="#9095a5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="ikb-navpanel" style={{ fontFamily: F.cn, width: 210 }}>
        <DropdownMenuLabel style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9095a5', padding: '6px 10px' }}>IP 账号</DropdownMenuLabel>
        <DropdownMenuSeparator style={{ background: C.line }} />
        <div style={{ maxHeight: 240, overflowY: 'auto' }}>
          {accounts.map((acc) => (
            <DropdownMenuItem
              key={acc.id}
              onClick={() => switchTo(acc.id)}
              className="ikb-navitem"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', fontSize: 13, color: C.ink, cursor: 'pointer' }}
            >
              <span style={{ width: 6, height: 6, borderRadius: 9999, background: acc.id === account?.id ? C.ikb : C.line }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.name}</span>
              <span style={{ fontFamily: F.mono, fontSize: 10, color: '#9095a5' }}>{acc.platform}</span>
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator style={{ background: C.line }} />
        <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
          <Link to="/accounts" className="ikb-navitem" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', fontSize: 13, color: C.ink, textDecoration: 'none' }}>
            <Settings size={14} />
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
      <button onClick={() => void login()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', fontFamily: F.cn, fontSize: 13, color: C.ink, background: 'transparent', border: 'none', cursor: 'pointer' }} aria-label="登录">
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
        <span style={{ width: 26, height: 26, borderRadius: '50%', background: C.grad, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontSize: 13, lineHeight: 1 }}>{user.name.slice(0, 1)}</span>
        <span style={{ fontFamily: F.cn, fontSize: 13, fontWeight: 500, color: C.ink }}>{user.name}</span>
      </div>
      <button onClick={logout} aria-label="退出登录" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 30, width: 30, color: '#9095a5', background: 'transparent', border: 'none', cursor: 'pointer' }}>
        <LogOut size={15} />
      </button>
    </div>
  );
}

/** 左上角品牌图标 · 红蓝紫渐变实心六边形(方案 A · 里面空 · 无瓷砖) */
function BrandMark({ size = 42 }: { size?: number }) {
  return (
    <span className="ikb-brandico" style={{ display: 'inline-flex', flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <defs>
          <linearGradient id="ikb-hex" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={C.ikb} />
            <stop offset="0.55" stopColor={C.yellow} />
            <stop offset="1" stopColor={C.burgundy} />
          </linearGradient>
        </defs>
        <path d="M12 2.3 20.7 7.2 20.7 16.8 12 21.7 3.3 16.8 3.3 7.2Z" fill="url(#ikb-hex)" stroke="url(#ikb-hex)" strokeWidth={1.4} strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function IKBLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const update = () => setZoom(Math.min(MAX_ZOOM, Math.max(0.2, window.innerWidth / DESIGN_WIDTH)));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', overflowX: 'hidden', background: C.base, color: C.ink, fontFamily: F.cn }}>
      {/* 顶栏 */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, width: '100%', background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.line}` }}>
        <div className="mx-auto" style={{ width: DESIGN_WIDTH, zoom }}>
          <div style={{ display: 'flex', height: 76, width: '100%', alignItems: 'center', padding: '0 40px' }}>
            <Link to="/" className="ikb-brand" style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 11, textDecoration: 'none' }}>
              <BrandMark size={42} />
              <span style={{ fontFamily: F.display, fontSize: 28, lineHeight: 1, letterSpacing: '-0.012em', background: `linear-gradient(110deg, ${C.ikb}, ${C.yellow} 55%, ${C.burgundy})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>AIP</span>
            </Link>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <NavDropdowns pathname={pathname} />
            </div>
            <HeaderRight />
          </div>
        </div>
      </header>

      {/* 内容 */}
      <main style={{ flex: 1, background: C.base }}>
        <div className="mx-auto" style={{ width: DESIGN_WIDTH, zoom }}>
          <div style={{ width: '100%', padding: '40px' }}>{children}</div>
        </div>
      </main>

      {/* 页脚 · 编辑式收尾大版 */}
      <footer style={{ position: 'relative', width: '100%', borderTop: `1px solid ${C.line}`, background: C.paper, overflow: 'hidden' }}>
        {/* 巨幅得意黑水印 */}
        <div aria-hidden style={{ position: 'absolute', right: -10, bottom: -46, fontFamily: F.display, fontSize: 200, lineHeight: 1, color: C.ikb, opacity: 0.05, pointerEvents: 'none', userSelect: 'none' }}>AIP</div>
        <div className="mx-auto" style={{ position: 'relative', maxWidth: DESIGN_WIDTH, padding: '52px 40px 26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 48, flexWrap: 'wrap' }}>
            {/* 品牌时刻 */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 14 }}>
                <BrandMark size={46} />
                <span style={{ fontFamily: F.display, fontSize: 42, lineHeight: 1, letterSpacing: '-0.012em', display: 'inline-flex', alignItems: 'baseline' }}>
                  <span style={{ background: `linear-gradient(110deg, ${C.ikb}, ${C.yellow} 55%, ${C.burgundy})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>AIP</span>
                  <span style={{ color: C.burgundy }}>.</span>
                </span>
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 11.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.ink, opacity: 0.72 }}>AI Full-Chain IP Monetization Engine</div>
              <div style={{ fontFamily: F.cn, fontSize: 13.5, color: '#5A6173', marginTop: 12, maxWidth: 360, lineHeight: 1.6 }}>善用 AI,你一个人就是千军万马。</div>
            </div>
            {/* 链接分栏 */}
            <div style={{ display: 'flex', gap: 56 }}>
              {[
                { h: 'PRODUCT', items: ['Documentation', 'System Status', 'Global API'] },
                { h: 'PROTOCOL', items: ['Privacy Policy', 'The Pioneer Protocol'] },
              ].map((col) => (
                <div key={col.h}>
                  <div style={{ fontFamily: F.mono, fontSize: 10.5, letterSpacing: '0.2em', color: C.burgundyText, marginBottom: 16 }}>{col.h}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {col.items.map((l) => (
                      <button key={l} type="button" className="ikb-footlink" style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', padding: 0, textAlign: 'left', fontFamily: F.cn, fontSize: 13.5, color: C.ink, cursor: 'pointer' }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* 底排 */}
          <div style={{ marginTop: 38, paddingTop: 18, borderTop: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: F.mono, fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9095a5' }}>© 2026 AIP Intelligent Platform</div>
            <div style={{ fontFamily: F.mono, fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9095a5' }}>北京 · Beijing · 邀请制内测</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
