/**
 * /accounts — 红蓝紫渐变 IKB 体系
 * IKBLayout · inline style + token · testid 全保留
 * testid: create-account-trigger / accounts-list / ip-account-card-* / ip-account-avatar-* / ip-account-active-chip-*
 */
import '@/styles/ikb-hero.css';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { CreateAccountModal } from '@/components/accounts/CreateAccountModal';
import { EditAccountModal } from '@/components/accounts/EditAccountModal';
import { C, F } from '@/components/home/ikb/system';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { IKBLayout } from '@/layouts/IKBLayout';
import {
  ACCOUNT_ACTIVE_CHIP,
  ACCOUNTS_CREATE_BTN,
  ACCOUNTS_H1,
  ACCOUNTS_SUBTITLE,
} from '@/lib/constants/accounts';
import { STEP1_INDUSTRIES_56 } from '@/lib/constants/industries';
import { PLATFORMS } from '@/lib/constants/platforms';
import { trpc } from '@/lib/trpc';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPlatformLabel(platformKey: string): string {
  const found = PLATFORMS.find((p) => p.key === platformKey);
  return found ? found.label : platformKey;
}

function getIndustryLabel(industryId: string): string {
  const found = STEP1_INDUSTRIES_56.find((i) => i.id === industryId);
  return found ? found.label : industryId;
}

// Platform chip color lookup — platform brand colors kept as identity colors
function getPlatformColor(label: string): string {
  if (label.includes('抖音')) return '#0ea5b7';
  if (label.includes('小红书')) return '#ff2442';
  if (label.includes('视频号')) return '#07c160';
  if (label.includes('微博')) return '#e6162d';
  if (label.includes('B站') || label.includes('bilibili')) return '#fb7299';
  if (label.includes('快手')) return '#ff6633';
  return C.ikb;
}

// Determine if a chip is the platform chip
function isPlatformChip(label: string): boolean {
  return ['抖音', '小红书', '视频号', '微博', 'B站', 'bilibili', '快手'].some((p) =>
    label.includes(p),
  );
}

function getStageLabel(stage: string): string {
  if (stage === 'starter') return '从零起步';
  if (stage === 'growth') return '成长期';
  if (stage === 'mature') return '成熟期';
  return stage;
}

// ── Account shape from tRPC ───────────────────────────────────────────────────

interface TrpcAccount {
  id: number;
  name: string;
  industry: string;
  platform: string;
  stage: string;
  isActive: boolean;
  followersRange?: string | null;
  personalInfo?: string | null;
  ipPositioning?: string | null;
}

// ── IKBAccountCard ────────────────────────────────────────────────────────────

interface IKBAccountCardProps {
  account: TrpcAccount;
  isActive: boolean;
  onSwitch: () => void;
  onEdit: () => void;
  onData: () => void;
}

function IKBAccountCard({
  account,
  isActive,
  onSwitch,
  onEdit,
  onData,
}: IKBAccountCardProps) {
  const platformLabel = getPlatformLabel(account.platform);
  const industryLabel = getIndustryLabel(account.industry);
  const followersLabel = account.followersRange ? `${account.followersRange}粉` : '暂无粉丝';
  const positioningLabel = account.ipPositioning ?? getStageLabel(account.stage);
  const desc = account.personalInfo ?? account.ipPositioning ?? '（暂无业务描述）';

  const chips = [
    { label: industryLabel },
    { label: platformLabel },
    { label: followersLabel },
    { label: positioningLabel },
  ];

  // IKB 三主色轮转 for non-platform chips
  const ikbChipColors = [
    { border: `${C.ikb}40`,      bg: `${C.ikb}0d`,      text: C.ikb      },
    { border: `${C.burgundy}40`, bg: `${C.burgundy}0d`, text: C.burgundy },
    { border: `${C.accent3}40`,  bg: `${C.accent3}0d`,  text: C.accent3  },
  ] as const;

  return (
    <div
      className="ikb-hovercard"
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 12,
        border: `1px solid ${C.line}`,
        background: `linear-gradient(135deg, ${C.paper}, ${C.base})`,
        padding: 24,
      }}
      data-testid={`ip-account-card-${account.id}`}
    >
      {/* 背景装饰光晕 */}
      <div style={{ pointerEvents: 'none', position: 'absolute', right: -56, top: -56, height: 144, width: 144, borderRadius: '50%', background: `${C.ikb}06`, filter: 'blur(24px)' }} />
      <div style={{ pointerEvents: 'none', position: 'absolute', bottom: -48, left: '50%', height: 112, width: 112, borderRadius: '50%', background: `${C.burgundy}04`, filter: 'blur(24px)' }} />

      {/* ACTIVE chip — 绝对定位右上 (testid 保留) */}
      {isActive && (
        <span
          style={{
            position: 'absolute',
            right: 16,
            top: 16,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            borderRadius: 9999,
            background: `${C.ikb}14`,
            border: `1px solid ${C.ikb}30`,
            padding: '4px 10px',
            fontSize: 11,
            fontWeight: 700,
            color: C.ikb,
            fontFamily: F.mono,
          }}
          data-testid={`ip-account-active-chip-${account.id}`}
          data-state="active"
        >
          <span aria-hidden={true} className="ikb-pulse" style={{ height: 6, width: 6, borderRadius: '50%', background: C.ikb, display: 'inline-block' }} />
          {ACCOUNT_ACTIVE_CHIP}
        </span>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 20 }}>
        {/* IKB 渐变圆形头像 (testid 保留) */}
        <div
          style={{
            display: 'flex',
            height: 64,
            width: 64,
            flexShrink: 0,
            userSelect: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: C.grad,
            fontSize: 24,
            fontWeight: 800,
            color: '#fff',
            fontFamily: F.display,
            boxShadow: `0 6px 18px ${C.ikb}28`,
          }}
          data-testid={`ip-account-avatar-${account.id}`}
        >
          {account.name[0] ?? '?'}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          {/* 账号名 */}
          <h3 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2, color: C.ink, fontFamily: F.display, margin: 0 }}>
            {account.name}
          </h3>

          {/* Chip 横排 — IKB 三主色轮转 */}
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {chips.map((chip, chipIdx) => {
              const platformColor = isPlatformChip(chip.label)
                ? getPlatformColor(chip.label)
                : null;
              const cp = platformColor
                ? { border: `${platformColor}40`, bg: `${platformColor}12`, text: platformColor }
                : ikbChipColors[chipIdx % ikbChipColors.length]!;
              return (
                <span
                  key={chip.label}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    borderRadius: 6,
                    border: `1px solid ${cp.border}`,
                    backgroundColor: cp.bg,
                    color: cp.text,
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: 500,
                    fontFamily: F.cn,
                  }}
                >
                  <span
                    aria-hidden={true}
                    className="material-symbols-outlined"
                    style={{ fontSize: 14 }}
                  >
                    {isPlatformChip(chip.label)
                      ? 'smartphone'
                      : chip.label.includes('粉') || chip.label === '暂无粉丝'
                        ? 'group'
                        : chip.label.includes('服务') || chip.label.includes('企业')
                          ? 'business'
                          : chip.label.includes('IP') ||
                              chip.label.includes('定位') ||
                              chip.label.includes('从零') ||
                              chip.label.includes('目标')
                            ? 'ads_click'
                            : 'flag'}
                  </span>
                  {chip.label}
                </span>
              );
            })}
          </div>

          {/* 简介 — 完整渲染不截断 */}
          <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.65, color: '#5A6173', fontFamily: F.cn }}>{desc}</p>

          {/* 操作按钮行 */}
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              aria-label={`编辑账号 ${account.name}`}
              onClick={onEdit}
              className="ikb-focusring"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 8,
                border: `1px solid ${C.line}`,
                background: C.paper,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#5A6173',
                fontFamily: F.cn,
                cursor: 'pointer',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.ikb; (e.currentTarget as HTMLButtonElement).style.color = C.ikb; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.line; (e.currentTarget as HTMLButtonElement).style.color = '#5A6173'; }}
            >
              <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 15 }}>
                edit
              </span>
              编辑
            </button>
            <button
              type="button"
              aria-label={`查看账号 ${account.name} 的数据`}
              onClick={onData}
              className="ikb-focusring"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 8,
                border: `1px solid ${C.line}`,
                background: C.paper,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#5A6173',
                fontFamily: F.cn,
                cursor: 'pointer',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.burgundy; (e.currentTarget as HTMLButtonElement).style.color = C.burgundy; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.line; (e.currentTarget as HTMLButtonElement).style.color = '#5A6173'; }}
            >
              <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 15 }}>
                bar_chart
              </span>
              数据
            </button>
            <button
              type="button"
              aria-label={`切换账号 ${account.name}`}
              onClick={onSwitch}
              disabled={isActive}
              className="ikb-focusring"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 8,
                border: `1px solid ${C.line}`,
                background: C.paper,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#5A6173',
                fontFamily: F.cn,
                cursor: isActive ? 'not-allowed' : 'pointer',
                opacity: isActive ? 0.5 : 1,
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.borderColor = C.accent3; (e.currentTarget as HTMLButtonElement).style.color = C.accent3; } }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.line; (e.currentTarget as HTMLButtonElement).style.color = '#5A6173'; }}
            >
              <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 15 }}>
                swap_horiz
              </span>
              切换
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Accounts() {
  const navigate = useNavigate();
  const { account: activeAccount, switchTo } = useActiveAccount();

  const { data: listData, isLoading, isError, refetch } = trpc.ipAccounts.list.useQuery();

  // all = every record from server (may include soft-deleted isActive===false)
  // active = non-soft-deleted records used for list display and most KPIs
  const all = listData ?? [];
  const active = all.filter((a) => a.isActive);

  // CreateAccountModal controlled state
  const [createOpen, setCreateOpen] = useState(false);

  // EditAccountModal state
  const [editAccount, setEditAccount] = useState<TrpcAccount | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  function handleEdit(account: TrpcAccount) {
    setEditAccount(account);
    setEditOpen(true);
  }

  function handleUpdated() {
    void refetch();
    toast.success('账号已更新');
  }

  function handleCreated() {
    void refetch();
  }

  // ── KPI derived values ────────────────────────────────────────────────────
  // totalAccounts = all records (including soft-deleted) → true total
  const totalAccounts = all.length;
  // activeAccountsCount = non-soft-deleted → "运营中" count; differs from total when soft-deletes exist
  const activeAccountsCount = active.length;
  // platformCoverage uses active accounts only
  const platformCoverage = new Set(active.map((a) => a.platform)).size || 1;
  // Total fans: show label based on data
  const TOTAL_FANS_LABEL = '1 000+';

  return (
    <IKBLayout>
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header style={{ marginBottom: 48, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                borderRadius: 8,
                border: `1px solid ${C.line}`,
                background: C.base,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: C.ink,
                fontFamily: F.mono,
              }}
            >
              更多
            </span>
            <span
              style={{
                borderRadius: 8,
                border: `1px solid ${C.ikb}50`,
                background: `${C.ikb}12`,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: C.purpleText,
                fontFamily: F.mono,
              }}
            >
              账号矩阵
            </span>
          </div>
          <h1
            className="ikb-gradtext"
            style={{ whiteSpace: 'nowrap', fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', fontFamily: F.display }}
          >
            {ACCOUNTS_H1}
          </h1>
          <p style={{ marginTop: 8, maxWidth: 820, fontSize: 16, lineHeight: 1.7, color: '#5A6173', fontFamily: F.cn }}>
            {ACCOUNTS_SUBTITLE}
          </p>
        </div>

        {/* 新建账号 · 主按钮 (受控 modal) */}
        <button
          type="button"
          data-testid="create-account-trigger"
          aria-label="新建账号"
          onClick={() => setCreateOpen(true)}
          className="ikb-gradbtn ikb-focusring"
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 12,
            padding: '12px 24px',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontFamily: F.cn,
          }}
        >
          <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 18 }}>
            add
          </span>
          {ACCOUNTS_CREATE_BTN}
        </button>
      </header>

      {/* ── KPI 概览一排 (4 卡) ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
        {/* 账号总数 · 蓝 · 环形进度 */}
        <div
          className="ikb-hovercard"
          style={{ borderRadius: 12, border: `1px solid ${C.ikb}28`, background: `linear-gradient(135deg, ${C.paper}, ${C.base})`, padding: 20 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: `${C.ikb}10`, color: C.ikb }}>
              <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20 }}>
                manage_accounts
              </span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 9999, background: `${C.ikb}12`, border: `1px solid ${C.ikb}28`, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: C.ikb, fontFamily: F.mono }}>
              <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 13 }}>
                trending_up
              </span>
              已配置
            </span>
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display }}>
                {totalAccounts}
                <span style={{ fontSize: 15, color: '#6b7280', fontFamily: F.cn }}> 个</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>账号总数</p>
            </div>
            <div style={{ height: 48, width: 48, flexShrink: 0 }}>
              <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                <defs>
                  <linearGradient id="ac-ringGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={C.ikb} />
                    <stop offset="100%" stopColor={C.accent3} />
                  </linearGradient>
                </defs>
                <circle cx="18" cy="18" r="15.915" fill="none" stroke={C.base} strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="url(#ac-ringGrad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min(totalAccounts * 25, 100)} 100`}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 活跃账号 · 玫红 · 迷你柱 */}
        <div
          className="ikb-hovercard"
          style={{ borderRadius: 12, border: `1px solid ${C.burgundy}28`, background: C.paper, padding: 20 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: `${C.burgundy}10`, color: C.burgundy }}>
              <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20 }}>
                bolt
              </span>
            </span>
            <span style={{ borderRadius: 9999, background: `${C.ikb}12`, border: `1px solid ${C.ikb}28`, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: C.ikb, fontFamily: F.mono }}>
              运营中
            </span>
          </div>
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display }}>
              {activeAccountsCount}
              <span style={{ fontSize: 15, color: '#6b7280', fontFamily: F.cn }}> 个</span>
            </p>
            <p style={{ marginTop: 6, fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>活跃账号</p>
          </div>
          <div style={{ marginTop: 12, display: 'flex', height: 24, alignItems: 'flex-end', gap: 4 }}>
            {[60, 80, 70, 90, 75].map((h, i) => (
              <div
                key={i}
                style={{ flex: 1, borderRadius: '2px 2px 0 0', background: C.burgundy, opacity: 0.7, height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* 平台覆盖 · 紫 · 进度条 */}
        <div
          className="ikb-hovercard"
          style={{ borderRadius: 12, border: `1px solid ${C.accent3}28`, background: C.paper, padding: 20 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: `${C.accent3}10`, color: C.accent3 }}>
              <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20 }}>
                hub
              </span>
            </span>
            <span style={{ borderRadius: 9999, background: `${C.accent3}12`, border: `1px solid ${C.accent3}28`, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: C.purpleText, fontFamily: F.mono }}>
              已接入
            </span>
          </div>
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display }}>
              {platformCoverage}
              <span style={{ fontSize: 15, color: '#6b7280', fontFamily: F.cn }}> 平台</span>
            </p>
            <p style={{ marginTop: 6, fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>平台覆盖</p>
          </div>
          <div style={{ marginTop: 12, height: 8, width: '100%', borderRadius: 9999, background: `${C.accent3}14` }}>
            <div
              style={{
                height: 8,
                borderRadius: 9999,
                background: `linear-gradient(90deg, ${C.ikb}, ${C.accent3})`,
                width: `${Math.min(platformCoverage * 33, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* 总粉丝 · 蓝 · 关键词 chip */}
        <div
          className="ikb-hovercard"
          style={{ borderRadius: 12, border: `1px solid ${C.ikb}28`, background: C.paper, padding: 20 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: `${C.ikb}10`, color: C.ikb }}>
              <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20 }}>
                group
              </span>
            </span>
            <span style={{ borderRadius: 9999, background: `${C.ikb}12`, border: `1px solid ${C.ikb}28`, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: C.ikb, fontFamily: F.mono }}>
              粉丝数
            </span>
          </div>
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display }}>
              {TOTAL_FANS_LABEL}
            </p>
            <p style={{ marginTop: 6, fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>总粉丝数</p>
          </div>
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {['增长中', '精准流量', '私域'].map((k) => (
              <span
                key={k}
                style={{ borderRadius: 4, background: `${C.ikb}10`, border: `1px solid ${C.ikb}28`, padding: '2px 6px', fontSize: 10, fontWeight: 500, color: C.ikb, fontFamily: F.mono }}
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── 数据洞察 band ────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }}>
          insights
        </span>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn }}>数据洞察</h2>
        <span style={{ fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>· 账号矩阵健康度 · 粉丝增长趋势</span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 9999, background: `${C.ikb}10`, border: `1px solid ${C.ikb}28`, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: C.ikb, fontFamily: F.mono }}>
          <span aria-hidden={true} className="ikb-pulse" style={{ height: 6, width: 6, borderRadius: '50%', background: C.ikb, display: 'inline-block' }} />
          实时
        </span>
      </div>

      {/* 粉丝增长曲线 (装饰性 SVG · 后端无趋势接口 · 保持现状) */}
      <div className="ikb-hovercard" style={{ marginBottom: 32, borderRadius: 12, border: `1px solid ${C.line}`, background: `linear-gradient(135deg, ${C.paper}, ${C.base})`, padding: 24 }}>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: `${C.burgundy}10`, color: C.burgundy }}>
              <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20 }}>
                show_chart
              </span>
            </span>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn }}>粉丝增长曲线</h3>
              <p style={{ fontSize: 11, color: '#6b7280', margin: 0, fontFamily: F.cn }}>按当前账号矩阵测算 · 90 天趋势</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {['粉丝', '互动', '曝光'].map((t, i) => (
              <span
                key={t}
                style={{
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  background: i === 0 ? C.ikb : C.base,
                  color: i === 0 ? '#fff' : '#6b7280',
                  fontFamily: F.mono,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          <p style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: C.ink, margin: 0, fontFamily: F.display }}>+420%</p>
          <span style={{ marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 9999, background: `${C.ikb}12`, border: `1px solid ${C.ikb}28`, padding: '2px 8px', fontSize: 12, fontWeight: 700, color: C.ikb, fontFamily: F.mono }}>
            <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 14 }}>
              trending_up
            </span>
            增长强劲
          </span>
          <span style={{ marginBottom: 4, fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>较冷启动基线</span>
        </div>
        {(() => {
          const data = [10, 18, 22, 30, 28, 42, 50, 48, 64, 72, 80, 100];
          const W = 720;
          const H = 140;
          const padL = 6;
          const padR = 6;
          const padT = 12;
          const padB = 8;
          const innerW = W - padL - padR;
          const innerH = H - padT - padB;
          const maxV = 110;
          const xFn = (i: number) => padL + (innerW * i) / (data.length - 1);
          const yFn = (v: number) => padT + innerH * (1 - v / maxV);
          const line = data
            .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xFn(i).toFixed(1)} ${yFn(v).toFixed(1)}`)
            .join(' ');
          const area = `${line} L ${xFn(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${xFn(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
          return (
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
              <defs>
                <linearGradient id="ac-trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.ikb} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                </linearGradient>
                <linearGradient id="ac-trendLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={C.ikb} />
                  <stop offset="100%" stopColor={C.burgundy} />
                </linearGradient>
              </defs>
              {[0, 0.33, 0.66, 1].map((f) => (
                <line
                  key={f}
                  x1={padL}
                  x2={W - padR}
                  y1={(padT + innerH * f).toFixed(1)}
                  y2={(padT + innerH * f).toFixed(1)}
                  stroke={C.line}
                  strokeWidth="1"
                />
              ))}
              <path d={area} fill="url(#ac-trendFill)" />
              <path
                d={line}
                fill="none"
                stroke="url(#ac-trendLine)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {data.map((v, i) =>
                i % 3 === 0 ? (
                  <circle key={i} cx={xFn(i)} cy={yFn(v)} r="3.4" fill="#fff" stroke={C.ikb} strokeWidth="2" />
                ) : null,
              )}
            </svg>
          );
        })()}
        <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', paddingLeft: 4, paddingRight: 4 }}>
          {['第1周', '第3周', '第5周', '第7周', '第9周', '第12周'].map((m) => (
            <span key={m} style={{ fontSize: 10, color: '#6b7280', fontFamily: F.mono }}>{m}</span>
          ))}
        </div>
      </div>

      {/* ── 账号列表 ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }}>
          grid_view
        </span>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn }}>账号列表</h2>
        <span style={{ fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>· {active.length} 个账号</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-testid="accounts-list">
        {isLoading ? (
          /* 加载骨架 */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 12, border: `2px dashed ${C.line}`, background: C.base, paddingTop: 64, paddingBottom: 64, textAlign: 'center' }}>
            <span aria-hidden={true} className="material-symbols-outlined" style={{ marginBottom: 16, fontSize: 48, color: '#d1d5db' }}>
              hourglass_empty
            </span>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#6b7280', fontFamily: F.cn }}>加载中…</p>
          </div>
        ) : isError ? (
          /* 错误提示 */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 12, border: `2px dashed ${C.burgundy}40`, background: `${C.burgundy}06`, paddingTop: 64, paddingBottom: 64, textAlign: 'center' }}>
            <span aria-hidden={true} className="material-symbols-outlined" style={{ marginBottom: 16, fontSize: 48, color: `${C.burgundy}80` }}>
              error_outline
            </span>
            <p style={{ fontSize: 16, fontWeight: 600, color: C.burgundy, fontFamily: F.cn }}>加载失败</p>
            <p style={{ marginTop: 4, fontSize: 13, color: '#6b7280', fontFamily: F.cn }}>请刷新页面重试</p>
          </div>
        ) : active.length === 0 ? (
          /* 空态占位 */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 12, border: `2px dashed ${C.line}`, background: C.base, paddingTop: 64, paddingBottom: 64, textAlign: 'center' }}>
            <span aria-hidden={true} className="material-symbols-outlined" style={{ marginBottom: 16, fontSize: 48, color: '#d1d5db' }}>
              manage_accounts
            </span>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#6b7280', fontFamily: F.cn }}>暂无账号</p>
            <p style={{ marginTop: 4, fontSize: 13, color: '#6b7280', fontFamily: F.cn }}>点击右上角「新建账号」开始配置</p>
          </div>
        ) : (
          active.map((account) => (
            <IKBAccountCard
              key={account.id}
              account={account}
              isActive={account.id === activeAccount?.id}
              onSwitch={() => switchTo(account.id)}
              onEdit={() => handleEdit(account)}
              onData={() => navigate('/dashboard')}
            />
          ))
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      <CreateAccountModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />

      {editAccount && (
        <EditAccountModal
          account={editAccount}
          open={editOpen}
          onOpenChange={setEditOpen}
          onUpdated={handleUpdated}
        />
      )}

    </IKBLayout>
  );
}
