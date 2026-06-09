/**
 * /accounts — 液态玻璃皮 (iOS 26 Liquid Glass)
 * LiquidShell · home-next/ikb/system · testid 全保留
 * testid: create-account-trigger / accounts-list / ip-account-card-* / ip-account-avatar-* / ip-account-active-chip-*
 */
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { CreateAccountModal } from '@/components/accounts/CreateAccountModal';
import { EditAccountModal } from '@/components/accounts/EditAccountModal';
import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Magnetic, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
import { useActiveAccount } from '@/hooks/useActiveAccount';
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

// Platform chip — use literal rgba so alpha concat is safe
function getPlatformColor(label: string): string {
  if (label.includes('抖音')) return '#0ea5b7';
  if (label.includes('小红书')) return '#ff2442';
  if (label.includes('视频号')) return '#07c160';
  if (label.includes('微博')) return '#e6162d';
  if (label.includes('B站') || label.includes('bilibili')) return '#fb7299';
  if (label.includes('快手')) return '#ff6633';
  return C.ikb; // C.ikb is hex #d8e8ff — safe to concat alpha
}

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

// ── LiquidAccountCard ─────────────────────────────────────────────────────────

interface LiquidAccountCardProps {
  account: TrpcAccount;
  isActive: boolean;
  onSwitch: () => void;
  onEdit: () => void;
  onData: () => void;
}

function LiquidAccountCard({
  account,
  isActive,
  onSwitch,
  onEdit,
  onData,
}: LiquidAccountCardProps) {
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

  // C.ikb is hex #d8e8ff — safe for alpha concat; platform colors are also hex
  const ikbChipColors = [
    { border: `${C.ikb}40`, bg: `${C.ikb}0d`, text: C.ikb },
    { border: 'rgba(255,255,255,0.22)', bg: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.85)' },
    { border: `${C.ikb}33`, bg: `${C.ikb}0a`, text: C.ikb },
  ] as const;

  return (
    <motion.div
      className="lg-glass lg-spec"
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 18,
        padding: 24,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      data-testid={`ip-account-card-${account.id}`}
    >
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
            background: `${C.ikb}1a`,
            border: `0.5px solid ${C.ikb}55`,
            padding: '4px 10px',
            fontSize: 11,
            fontWeight: 700,
            color: C.ikb,
            fontFamily: F.mono,
            backdropFilter: 'blur(8px)',
          }}
          data-testid={`ip-account-active-chip-${account.id}`}
          data-state="active"
        >
          <span
            aria-hidden={true}
            style={{
              height: 6,
              width: 6,
              borderRadius: '50%',
              background: C.ikb,
              display: 'inline-block',
              boxShadow: `0 0 6px ${C.ikb}`,
            }}
          />
          {ACCOUNT_ACTIVE_CHIP}
        </span>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 20, flex: 1 }}>
        {/* 液态玻璃渐变圆形头像 (testid 保留) */}
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
            background: 'linear-gradient(135deg, rgba(168,197,224,0.5), rgba(120,160,220,0.3))',
            border: `0.5px solid ${C.ikb}55`,
            fontSize: 24,
            fontWeight: 800,
            color: C.ink,
            fontFamily: F.display,
            textShadow: C.textShadow,
            boxShadow: `0 6px 20px rgba(168,197,224,0.25)`,
          }}
          data-testid={`ip-account-avatar-${account.id}`}
        >
          {account.name[0] ?? '?'}
        </div>

        <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* 账号名 */}
          <h3
            style={{
              fontSize: 20,
              fontWeight: 700,
              lineHeight: 1.2,
              color: C.ink,
              fontFamily: F.display,
              margin: 0,
              textShadow: C.textShadow,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
            }}
          >
            {account.name}
          </h3>

          {/* Chip 横排 */}
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {chips.map((chip, chipIdx) => {
              const platformColor = isPlatformChip(chip.label)
                ? getPlatformColor(chip.label)
                : null;
              // Platform colors are hex — safe for alpha concat
              const cp = platformColor
                ? { border: `${platformColor}55`, bg: `${platformColor}18`, text: platformColor }
                : ikbChipColors[chipIdx % ikbChipColors.length]!;
              return (
                <span
                  key={chip.label}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    borderRadius: 6,
                    border: `0.5px solid ${cp.border}`,
                    backgroundColor: cp.bg,
                    color: cp.text,
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: 500,
                    fontFamily: F.cn,
                    backdropFilter: 'blur(8px)',
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

          {/* 简介 */}
          <p
            style={{
              marginTop: 12,
              fontSize: 14,
              lineHeight: 1.65,
              color: 'rgba(255,255,255,0.84)',
              fontFamily: F.cn,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {desc}
          </p>

          {/* 操作按钮行 */}
          <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              aria-label={`编辑账号 ${account.name}`}
              onClick={onEdit}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 8,
                border: `0.5px solid rgba(255,255,255,0.22)`,
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(8px)',
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.7)',
                fontFamily: F.cn,
                cursor: 'pointer',
                transition: 'border-color 0.15s, color 0.15s, background 0.15s',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.borderColor = `${C.ikb}88`;
                b.style.color = C.ikb;
                b.style.background = `${C.ikb}14`;
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.borderColor = 'rgba(255,255,255,0.22)';
                b.style.color = 'rgba(255,255,255,0.7)';
                b.style.background = 'rgba(255,255,255,0.08)';
              }}
              onFocus={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.boxShadow = `0 0 0 2px ${C.ikb}99`; }}
              onBlur={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.boxShadow = ''; }}
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 8,
                border: `0.5px solid rgba(255,255,255,0.22)`,
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(8px)',
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.7)',
                fontFamily: F.cn,
                cursor: 'pointer',
                transition: 'border-color 0.15s, color 0.15s, background 0.15s',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.borderColor = `${C.ikb}88`;
                b.style.color = C.ikb;
                b.style.background = `${C.ikb}14`;
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.borderColor = 'rgba(255,255,255,0.22)';
                b.style.color = 'rgba(255,255,255,0.7)';
                b.style.background = 'rgba(255,255,255,0.08)';
              }}
              onFocus={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.boxShadow = `0 0 0 2px ${C.ikb}99`; }}
              onBlur={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.boxShadow = ''; }}
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 8,
                border: `0.5px solid rgba(255,255,255,0.22)`,
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(8px)',
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.7)',
                fontFamily: F.cn,
                cursor: isActive ? 'not-allowed' : 'pointer',
                opacity: isActive ? 0.45 : 1,
                transition: 'border-color 0.15s, color 0.15s, background 0.15s',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.borderColor = `${C.ikb}88`;
                  b.style.color = C.ikb;
                  b.style.background = `${C.ikb}14`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.borderColor = 'rgba(255,255,255,0.22)';
                  b.style.color = 'rgba(255,255,255,0.7)';
                  b.style.background = 'rgba(255,255,255,0.08)';
                }
              }}
              onFocus={(e) => { if (!isActive) { const b = e.currentTarget as HTMLButtonElement; b.style.boxShadow = `0 0 0 2px ${C.ikb}99`; } }}
              onBlur={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.boxShadow = ''; }}
            >
              <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 15 }}>
                swap_horiz
              </span>
              切换
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Accounts() {
  const navigate = useNavigate();
  const { account: activeAccount, switchTo } = useActiveAccount();

  const { data: listData, isLoading, isError, refetch } = trpc.ipAccounts.list.useQuery();

  const all = listData ?? [];
  const active = all.filter((a) => a.isActive);

  const [createOpen, setCreateOpen] = useState(false);
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
  const totalAccounts = all.length;
  const activeAccountsCount = active.length;
  const platformCoverage = new Set(active.map((a) => a.platform)).size || 1;
  const TOTAL_FANS_LABEL = '1,000+';

  return (
    <LiquidShell>
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <Reveal>
        <header
          style={{
            marginBottom: 48,
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 32,
          }}
        >
          <div style={{ flexShrink: 0 }}>
            {/* chip 标签行 */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  borderRadius: 9999,
                  border: `0.5px solid ${C.line}`,
                  background: 'rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(12px)',
                  padding: '4px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: C.ink,
                  fontFamily: F.mono,
                  textShadow: C.textShadow,
                }}
              >
                更多
              </span>
              <span
                style={{
                  borderRadius: 9999,
                  border: `0.5px solid rgba(168,197,224,0.55)`,
                  background: 'rgba(168,197,224,0.18)',
                  backdropFilter: 'blur(12px)',
                  padding: '4px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: C.ikb,
                  fontFamily: F.mono,
                  textShadow: C.textShadow,
                }}
              >
                账号矩阵
              </span>
            </div>

            {/* 主标题 — 冷蓝渐变字 */}
            <h1
              style={{
                whiteSpace: 'nowrap',
                fontSize: 52,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                fontFamily: F.display,
                margin: 0,
                background: C.grad,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
                textShadow: 'none',
              }}
            >
              {ACCOUNTS_H1}
            </h1>

            <p
              style={{
                marginTop: 10,
                maxWidth: 820,
                fontSize: 16,
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.72)',
                fontFamily: F.cn,
                textShadow: C.textShadow,
              }}
            >
              {ACCOUNTS_SUBTITLE}
            </p>
          </div>

          {/* 新建账号 · 主按钮 (受控 modal) */}
          <Magnetic strength={0.3}>
            <button
              type="button"
              data-testid="create-account-trigger"
              aria-label="新建账号"
              onClick={() => setCreateOpen(true)}
              className="lg-gradbtn"
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 9999,
                padding: '12px 28px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: F.cn,
                border: 'none',
              }}
            >
              <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 18 }}>
                add
              </span>
              {ACCOUNTS_CREATE_BTN}
            </button>
          </Magnetic>
        </header>
      </Reveal>

      {/* ── KPI 概览一排 (4 卡) ──────────────────────────────────────────────── */}
      <RevealGroup
        style={{ marginBottom: 44, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}
      >
        {/* 账号总数 · 冷蓝 · 环形进度 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  display: 'flex',
                  height: 38,
                  width: 38,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  background: 'rgba(168,197,224,0.18)',
                  color: C.ink,
                }}
              >
                <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }}>
                  manage_accounts
                </span>
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  borderRadius: 9999,
                  background: `${C.ikb}1a`,
                  border: `0.5px solid ${C.ikb}44`,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.ikb,
                  fontFamily: F.mono,
                }}
              >
                <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 13 }}>
                  trending_up
                </span>
                已配置
              </span>
            </div>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <p
                  style={{
                    fontSize: 30,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: C.ink,
                    fontFamily: F.display,
                    margin: 0,
                    textShadow: C.textShadow,
                  }}
                >
                  {totalAccounts}
                  <span
                    style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}
                  >
                    {' '}
                    个
                  </span>
                </p>
                <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>
                  账号总数
                </p>
              </div>
              <div style={{ height: 48, width: 48, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  <defs>
                    <linearGradient id="ac-ringGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={C.ikb} />
                      <stop offset="100%" stopColor="#a8c5e0" />
                    </linearGradient>
                  </defs>
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3.5" />
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
          </motion.div>
        </Item>

        {/* 活跃账号 · 玻璃 · 迷你柱 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  display: 'flex',
                  height: 38,
                  width: 38,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  background: 'rgba(228,238,255,0.18)',
                  color: C.yellow,
                }}
              >
                <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  bolt
                </span>
              </span>
              <span
                style={{
                  borderRadius: 9999,
                  background: 'rgba(228,238,255,0.14)',
                  border: `0.5px solid rgba(228,238,255,0.4)`,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.yellow,
                  fontFamily: F.mono,
                }}
              >
                运营中
              </span>
            </div>
            <div style={{ marginTop: 16 }}>
              <p
                style={{
                  fontSize: 30,
                  fontWeight: 700,
                  lineHeight: 1,
                  color: C.ink,
                  fontFamily: F.display,
                  margin: 0,
                  textShadow: C.textShadow,
                }}
              >
                {activeAccountsCount}
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>
                  {' '}
                  个
                </span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>
                活跃账号
              </p>
            </div>
            <div style={{ marginTop: 12, display: 'flex', height: 24, alignItems: 'flex-end', gap: 4 }}>
              {[60, 80, 70, 90, 75].map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    borderRadius: '2px 2px 0 0',
                    background: 'rgba(228,238,255,0.55)',
                    height: `${h}%`,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </Item>

        {/* 平台覆盖 · 冷蓝 · 进度条 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  display: 'flex',
                  height: 38,
                  width: 38,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  background: 'rgba(168,197,224,0.18)',
                  color: C.ink,
                }}
              >
                <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }}>
                  hub
                </span>
              </span>
              <span
                style={{
                  borderRadius: 9999,
                  background: `${C.ikb}1a`,
                  border: `0.5px solid ${C.ikb}44`,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.ikb,
                  fontFamily: F.mono,
                }}
              >
                已接入
              </span>
            </div>
            <div style={{ marginTop: 16 }}>
              <p
                style={{
                  fontSize: 30,
                  fontWeight: 700,
                  lineHeight: 1,
                  color: C.ink,
                  fontFamily: F.display,
                  margin: 0,
                  textShadow: C.textShadow,
                }}
              >
                {platformCoverage}
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>
                  {' '}
                  平台
                </span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>
                平台覆盖
              </p>
            </div>
            <div
              style={{
                marginTop: 12,
                height: 8,
                width: '100%',
                borderRadius: 9999,
                background: 'rgba(255,255,255,0.1)',
              }}
            >
              <div
                style={{
                  height: 8,
                  borderRadius: 9999,
                  background: C.grad,
                  width: `${Math.min(platformCoverage * 33, 100)}%`,
                }}
              />
            </div>
          </motion.div>
        </Item>

        {/* 总粉丝 · 冷蓝 · 关键词 chip */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  display: 'flex',
                  height: 38,
                  width: 38,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  background: 'rgba(168,197,224,0.18)',
                  color: C.ink,
                }}
              >
                <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }}>
                  group
                </span>
              </span>
              <span
                style={{
                  borderRadius: 9999,
                  background: `${C.ikb}1a`,
                  border: `0.5px solid ${C.ikb}44`,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.ikb,
                  fontFamily: F.mono,
                }}
              >
                粉丝数
              </span>
            </div>
            <div style={{ marginTop: 16 }}>
              <p
                style={{
                  fontSize: 30,
                  fontWeight: 700,
                  lineHeight: 1,
                  color: C.ink,
                  fontFamily: F.display,
                  margin: 0,
                  textShadow: C.textShadow,
                }}
              >
                {TOTAL_FANS_LABEL}
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>
                总粉丝数
              </p>
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {['增长中', '精准流量', '私域'].map((k) => (
                <span
                  key={k}
                  style={{
                    borderRadius: 4,
                    background: `${C.ikb}14`,
                    border: `0.5px solid ${C.ikb}44`,
                    padding: '2px 6px',
                    fontSize: 10,
                    fontWeight: 500,
                    color: C.ikb,
                    fontFamily: F.mono,
                  }}
                >
                  {k}
                </span>
              ))}
            </div>
          </motion.div>
        </Item>
      </RevealGroup>

      {/* ── 数据洞察 band ────────────────────────────────────────────────────── */}
      <Reveal style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            display: 'flex',
            height: 38,
            width: 38,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            background: 'rgba(168,197,224,0.18)',
            color: C.ink,
          }}
        >
          <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }}>
            insights
          </span>
        </span>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: C.ink,
            margin: 0,
            fontFamily: F.cn,
            textShadow: C.textShadow,
          }}
        >
          数据洞察
        </h2>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>
          · 账号矩阵健康度 · 粉丝增长趋势
        </span>
        <span
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            borderRadius: 9999,
            background: `${C.ikb}14`,
            border: `0.5px solid ${C.ikb}44`,
            padding: '4px 12px',
            fontSize: 12,
            fontWeight: 600,
            color: C.ikb,
            fontFamily: F.mono,
          }}
        >
          <span
            aria-hidden={true}
            style={{
              height: 6,
              width: 6,
              borderRadius: '50%',
              background: C.ikb,
              display: 'inline-block',
              boxShadow: `0 0 6px ${C.ikb}`,
            }}
          />
          实时
        </span>
      </Reveal>

      {/* 粉丝增长曲线 (装饰性 SVG) */}
      <Reveal>
        <div
          className="lg-glass"
          style={{ marginBottom: 44, borderRadius: 20, overflow: 'hidden', padding: 24 }}
        >
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  display: 'flex',
                  height: 38,
                  width: 38,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  background: 'rgba(228,238,255,0.18)',
                  color: C.yellow,
                }}
              >
                <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  show_chart
                </span>
              </span>
              <div>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: C.ink,
                    margin: 0,
                    fontFamily: F.cn,
                    textShadow: C.textShadow,
                  }}
                >
                  粉丝增长曲线
                </h3>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', margin: 0, fontFamily: F.cn }}>
                  按当前账号矩阵测算 · 90 天趋势
                </p>
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
                    background:
                      i === 0
                        ? 'rgba(168,197,224,0.35)'
                        : 'rgba(255,255,255,0.08)',
                    color: i === 0 ? C.ink : 'rgba(255,255,255,0.8)',
                    fontFamily: F.mono,
                    border: i === 0 ? `0.5px solid ${C.ikb}55` : `0.5px solid rgba(255,255,255,0.15)`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <p
              style={{
                fontSize: 30,
                fontWeight: 700,
                lineHeight: 1,
                color: C.ink,
                margin: 0,
                fontFamily: F.display,
                textShadow: C.textShadow,
                background: C.grad,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              +420%
            </p>
            <span
              style={{
                marginBottom: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                borderRadius: 9999,
                background: `${C.ikb}1a`,
                border: `0.5px solid ${C.ikb}44`,
                padding: '2px 8px',
                fontSize: 12,
                fontWeight: 700,
                color: C.ikb,
                fontFamily: F.mono,
              }}
            >
              <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 14 }}>
                trending_up
              </span>
              增长强劲
            </span>
            <span style={{ marginBottom: 4, fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>
              较冷启动基线
            </span>
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
                    <stop offset="100%" stopColor="#a8c5e0" />
                  </linearGradient>
                </defs>
                {[0, 0.33, 0.66, 1].map((f) => (
                  <line
                    key={f}
                    x1={padL}
                    x2={W - padR}
                    y1={(padT + innerH * f).toFixed(1)}
                    y2={(padT + innerH * f).toFixed(1)}
                    stroke="rgba(255,255,255,0.12)"
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
                    <circle
                      key={i}
                      cx={xFn(i)}
                      cy={yFn(v)}
                      r="3.4"
                      fill="rgba(255,255,255,0.9)"
                      stroke={C.ikb}
                      strokeWidth="2"
                    />
                  ) : null,
                )}
              </svg>
            );
          })()}
          <div
            style={{
              marginTop: 4,
              display: 'flex',
              justifyContent: 'space-between',
              paddingLeft: 4,
              paddingRight: 4,
            }}
          >
            {['第1周', '第3周', '第5周', '第7周', '第9周', '第12周'].map((m) => (
              <span key={m} style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: F.mono }}>
                {m}
              </span>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ── 账号列表 section header ──────────────────────────────────────────── */}
      <Reveal style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            display: 'flex',
            height: 38,
            width: 38,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            background: 'rgba(168,197,224,0.18)',
            color: C.ink,
          }}
        >
          <span aria-hidden={true} className="material-symbols-outlined" style={{ fontSize: 20, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }}>
            grid_view
          </span>
        </span>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: C.ink,
            margin: 0,
            fontFamily: F.cn,
            textShadow: C.textShadow,
          }}
        >
          账号列表
        </h2>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>
          · {active.length} 个账号
        </span>
      </Reveal>

      {/* ── 账号列表 ─────────────────────────────────────────────────────────── */}
      <div data-testid="accounts-list">
        {isLoading ? (
          <div
            className="lg-glass"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 20,
              paddingTop: 64,
              paddingBottom: 64,
              textAlign: 'center',
            }}
          >
            <span
              aria-hidden={true}
              className="material-symbols-outlined"
              style={{ marginBottom: 16, fontSize: 48, color: 'rgba(255,255,255,0.25)' }}
            >
              hourglass_empty
            </span>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>
              加载中…
            </p>
          </div>
        ) : isError ? (
          <div
            className="lg-glass"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 20,
              paddingTop: 64,
              paddingBottom: 64,
              textAlign: 'center',
            }}
          >
            <span
              aria-hidden={true}
              className="material-symbols-outlined"
              style={{ marginBottom: 16, fontSize: 48, color: 'rgba(255,255,255,0.4)' }}
            >
              error_outline
            </span>
            <p style={{ fontSize: 16, fontWeight: 600, color: C.ink, fontFamily: F.cn }}>加载失败</p>
            <p style={{ marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>
              请刷新页面重试
            </p>
          </div>
        ) : active.length === 0 ? (
          <div
            className="lg-glass"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 20,
              paddingTop: 64,
              paddingBottom: 64,
              textAlign: 'center',
            }}
          >
            <span
              aria-hidden={true}
              className="material-symbols-outlined"
              style={{ marginBottom: 16, fontSize: 48, color: 'rgba(255,255,255,0.25)' }}
            >
              manage_accounts
            </span>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>
              暂无账号
            </p>
            <p style={{ marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.45)', fontFamily: F.cn }}>
              点击右上角「新建账号」开始配置
            </p>
          </div>
        ) : (
          <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {active.map((account) => (
              <Item key={account.id} style={{ height: '100%' }}>
                <LiquidAccountCard
                  account={account}
                  isActive={account.id === activeAccount?.id}
                  onSwitch={() => switchTo(account.id)}
                  onEdit={() => handleEdit(account)}
                  onData={() => navigate('/dashboard')}
                />
              </Item>
            ))}
          </RevealGroup>
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
    </LiquidShell>
  );
}
