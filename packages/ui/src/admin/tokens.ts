// @quanqn/ui/admin · Aurelian Dark 密集模式 design tokens
// 主应用 base tokens 的 admin 子集 · row 32px + font 13px

export const adminTokens = {
  /** Layout dimensions */
  topbarHeight: '60px',
  sidebarWidth: '240px',
  statusBarHeight: '24px',
  drawerWidth: '480px',

  /** Dense mode — admin 专属 */
  rowHeight: '32px',
  fontSize: '13px',
  fontSizeSm: '12px',
  lineHeight: '1.4',

  /** Aurelian Dark palette */
  bg: '#0a0a0a',
  bgPanel: '#111111',
  bgHover: '#1a1a1a',
  bgActive: '#1e1e1e',
  border: '#2a2a2a',
  borderActive: '#d4af37',

  gold: '#d4af37',
  goldDim: 'rgba(212,175,55,0.15)',
  goldText: '#e8cc6a',

  text: '#e0e0e0',
  textMuted: '#888888',
  textDim: '#555555',

  /** Status indicator colors */
  statusOk: '#22c55e',
  statusWarn: '#f59e0b',
  statusErr: '#ef4444',
  statusStub: '#f59e0b',
} as const;

export type AdminTokens = typeof adminTokens;
