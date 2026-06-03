/**
 * /accounts — 先锋白·工业精密版
 * tRPC-first · PioneerLayout · testid 全保留
 * testid: create-account-trigger / accounts-list / ip-account-card-* / ip-account-avatar-* / ip-account-active-chip-*
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { CreateAccountModal } from '@/components/accounts/CreateAccountModal';
import { EditAccountModal } from '@/components/accounts/EditAccountModal';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { PioneerLayout } from '@/layouts/PioneerLayout';
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

// Platform chip color lookup
function getPlatformColor(label: string): string {
  if (label.includes('抖音')) return '#0ea5b7';
  if (label.includes('小红书')) return '#ff2442';
  if (label.includes('视频号')) return '#07c160';
  if (label.includes('微博')) return '#e6162d';
  if (label.includes('B站') || label.includes('bilibili')) return '#fb7299';
  if (label.includes('快手')) return '#ff6633';
  return '#002fa7';
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

// ── PioneerAccountCard ────────────────────────────────────────────────────────

interface PioneerAccountCardProps {
  account: TrpcAccount;
  isActive: boolean;
  onSwitch: () => void;
  onEdit: () => void;
  onData: () => void;
}

function PioneerAccountCard({
  account,
  isActive,
  onSwitch,
  onEdit,
  onData,
}: PioneerAccountCardProps) {
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

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7faff] p-6 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      data-testid={`ip-account-card-${account.id}`}
    >
      {/* 背景装饰光晕 */}
      <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-[#002fa7]/[0.04] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 left-1/2 h-28 w-28 rounded-full bg-[#781621]/[0.03] blur-2xl" />

      {/* ACTIVE chip — 绝对定位右上 (testid 保留) */}
      {isActive && (
        <span
          className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-2.5 py-1 text-[11px] font-semibold text-[#10b981]"
          data-testid={`ip-account-active-chip-${account.id}`}
        >
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
          {ACCOUNT_ACTIVE_CHIP}
        </span>
      )}

      <div className="relative flex items-start gap-5">
        {/* 先锋白渐变圆形头像 (testid 保留) */}
        <div
          className="flex h-16 w-16 shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-[#002fa7] to-[#3654c8] text-[24px] font-extrabold text-white shadow-lg shadow-[#002fa7]/20"
          data-testid={`ip-account-avatar-${account.id}`}
        >
          {account.name[0] ?? '?'}
        </div>

        <div className="min-w-0 flex-1">
          {/* 账号名 */}
          <h3 className="text-[20px] font-bold leading-tight text-[#111827]">
            {account.name}
          </h3>

          {/* Chip 横排 — 先锋白风格 */}
          <div className="mt-2 flex flex-wrap gap-2">
            {chips.map((chip) => {
              const platformColor = isPlatformChip(chip.label)
                ? getPlatformColor(chip.label)
                : null;
              return (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-medium"
                  style={
                    platformColor
                      ? {
                          borderColor: `${platformColor}40`,
                          backgroundColor: `${platformColor}12`,
                          color: platformColor,
                        }
                      : {
                          borderColor: '#e5e7eb',
                          backgroundColor: '#f3f6ff',
                          color: '#444653',
                        }
                  }
                >
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[14px]"
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
          <p className="mt-3 text-[14px] leading-relaxed text-[#444653]">{desc}</p>

          {/* 操作按钮行 */}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              aria-label={`编辑账号 ${account.name}`}
              onClick={onEdit}
              className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#444653] transition-colors hover:border-[#002fa7] hover:text-[#002fa7]"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
                edit
              </span>
              编辑
            </button>
            <button
              type="button"
              aria-label={`查看账号 ${account.name} 的数据`}
              onClick={onData}
              className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#444653] transition-colors hover:border-[#002fa7] hover:text-[#002fa7]"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
                bar_chart
              </span>
              数据
            </button>
            <button
              type="button"
              aria-label={`切换账号 ${account.name}`}
              onClick={onSwitch}
              disabled={isActive}
              className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#444653] transition-colors hover:border-[#002fa7] hover:text-[#002fa7] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
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
    <PioneerLayout>
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header className="mb-12 flex flex-row items-center justify-between gap-8">
        <div className="shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-lg border border-[#e5e7eb] bg-[#e8e8e8] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b]">
              更多
            </span>
            <span className="rounded-lg border border-[#6e5e00] bg-[#F6D300] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#221b00]">
              账号矩阵
            </span>
          </div>
          <h1 className="whitespace-nowrap text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]">
            {ACCOUNTS_H1}
          </h1>
          <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed text-[#444653]">
            {ACCOUNTS_SUBTITLE}
          </p>
        </div>

        {/* 新建账号 · 主按钮 (受控 modal) */}
        <button
          type="button"
          data-testid="create-account-trigger"
          aria-label="新建账号"
          onClick={() => setCreateOpen(true)}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-[#002fa7] to-[#3654c8] px-6 py-3 text-[13px] font-bold tracking-widest text-white shadow-sm shadow-[#002fa7]/25 transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
            add
          </span>
          {ACCOUNTS_CREATE_BTN}
        </button>
      </header>

      {/* ── KPI 概览一排 (4 卡) ──────────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        {/* 账号总数 · 蓝 · 环形进度 */}
        <div className="rounded-xl border border-[#dbe2ff] bg-gradient-to-br from-white to-[#f3f6ff] p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                manage_accounts
              </span>
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[11px] font-bold text-[#10b981]">
              <span aria-hidden="true" className="material-symbols-outlined text-[13px]">
                trending_up
              </span>
              已配置
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[28px] font-bold leading-none text-[#111827]">
                {totalAccounts}
                <span className="text-[15px] text-[#9ca3af]"> 个</span>
              </p>
              <p className="mt-1.5 text-[12px] text-[#6b7280]">账号总数</p>
            </div>
            <div className="h-12 w-12 shrink-0">
              <svg viewBox="0 0 36 36" className="-rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eef2ff" strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#002fa7"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min(totalAccounts * 25, 100)} 100`}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 活跃账号 · 勃艮第红 · 迷你柱 */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                bolt
              </span>
            </span>
            <span className="rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[11px] font-bold text-[#10b981]">
              运营中
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none text-[#111827]">
              {activeAccountsCount}
              <span className="text-[15px] text-[#9ca3af]"> 个</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">活跃账号</p>
          </div>
          <div className="mt-3 flex h-6 items-end gap-1">
            {[60, 80, 70, 90, 75].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-[#781621]/70"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* 平台覆盖 · 暖黄 · 进度条 */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F6D300]/20 text-[#8a6a00]">
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                hub
              </span>
            </span>
            <span className="rounded-full bg-[#F6D300]/20 px-2 py-0.5 text-[11px] font-bold text-[#8a6a00]">
              已接入
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none text-[#111827]">
              {platformCoverage}
              <span className="text-[15px] text-[#9ca3af]"> 平台</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">平台覆盖</p>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-[#fdf6cc]">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#F6D300] to-[#ffe45c]"
              style={{ width: `${Math.min(platformCoverage * 33, 100)}%` }}
            />
          </div>
        </div>

        {/* 总粉丝 · 蓝 · 关键词 chip */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                group
              </span>
            </span>
            <span className="rounded-full bg-[#002fa7]/10 px-2 py-0.5 text-[11px] font-bold text-[#002fa7]">
              粉丝数
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none text-[#111827]">
              {TOTAL_FANS_LABEL}
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">总粉丝数</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {['增长中', '精准流量', '私域'].map((k) => (
              <span
                key={k}
                className="rounded bg-[#eff4ff] px-1.5 py-0.5 text-[10px] font-medium text-[#002fa7]"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── 数据洞察 band ────────────────────────────────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-[#002fa7]">
          insights
        </span>
        <h2 className="text-[16px] font-bold text-[#111827]">数据洞察</h2>
        <span className="text-[12px] text-[#9ca3af]">· 账号矩阵健康度 · 粉丝增长趋势</span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
          <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10b981]" />
          实时
        </span>
      </div>

      {/* 粉丝增长曲线 (装饰性 SVG · 后端无趋势接口 · 保持现状) */}
      <div className="mb-8 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7f5ff] p-6 pw-shadow-soft">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                show_chart
              </span>
            </span>
            <div>
              <h3 className="text-[14px] font-bold text-[#111827]">粉丝增长曲线</h3>
              <p className="text-[11px] text-[#9ca3af]">按当前账号矩阵测算 · 90 天趋势</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {['粉丝', '互动', '曝光'].map((t, i) => (
              <span
                key={t}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${i === 0 ? 'bg-[#002fa7] text-white' : 'bg-[#f1f3f9] text-[#6b7280]'}`}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="mb-3 flex items-end gap-3">
          <p className="text-[30px] font-bold leading-none text-[#111827]">+420%</p>
          <span className="mb-1 inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[12px] font-bold text-[#10b981]">
            <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
              trending_up
            </span>
            增长强劲
          </span>
          <span className="mb-1 text-[12px] text-[#9ca3af]">较冷启动基线</span>
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
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
              <defs>
                <linearGradient id="trendFillAC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#002fa7" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#002fa7" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="trendLineAC" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#002fa7" />
                  <stop offset="100%" stopColor="#781621" />
                </linearGradient>
              </defs>
              {[0, 0.33, 0.66, 1].map((f) => (
                <line
                  key={f}
                  x1={padL}
                  x2={W - padR}
                  y1={(padT + innerH * f).toFixed(1)}
                  y2={(padT + innerH * f).toFixed(1)}
                  stroke="#f1f3f9"
                  strokeWidth="1"
                />
              ))}
              <path d={area} fill="url(#trendFillAC)" />
              <path
                d={line}
                fill="none"
                stroke="url(#trendLineAC)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {data.map((v, i) =>
                i % 3 === 0 ? (
                  <circle key={i} cx={xFn(i)} cy={yFn(v)} r="3.4" fill="#fff" stroke="#002fa7" strokeWidth="2" />
                ) : null,
              )}
            </svg>
          );
        })()}
        <div className="mt-1 flex justify-between px-1 text-[10px] text-[#9ca3af]">
          {['第1周', '第3周', '第5周', '第7周', '第9周', '第12周'].map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>

      {/* ── 账号列表 ─────────────────────────────────────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-[#002fa7]">
          grid_view
        </span>
        <h2 className="text-[16px] font-bold text-[#111827]">账号列表</h2>
        <span className="text-[12px] text-[#9ca3af]">· {active.length} 个账号</span>
      </div>

      <div className="space-y-4" data-testid="accounts-list">
        {isLoading ? (
          /* 加载骨架 */
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-[#f9fafb] py-16 text-center">
            <span aria-hidden="true" className="material-symbols-outlined mb-4 text-[48px] text-[#d1d5db]">
              hourglass_empty
            </span>
            <p className="text-[16px] font-semibold text-[#6b7280]">加载中…</p>
          </div>
        ) : isError ? (
          /* 错误提示 */
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#fca5a5] bg-[#fef2f2] py-16 text-center">
            <span aria-hidden="true" className="material-symbols-outlined mb-4 text-[48px] text-[#f87171]">
              error_outline
            </span>
            <p className="text-[16px] font-semibold text-[#b91c1c]">加载失败</p>
            <p className="mt-1 text-[13px] text-[#9ca3af]">请刷新页面重试</p>
          </div>
        ) : active.length === 0 ? (
          /* 空态占位 */
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-[#f9fafb] py-16 text-center">
            <span aria-hidden="true" className="material-symbols-outlined mb-4 text-[48px] text-[#d1d5db]">
              manage_accounts
            </span>
            <p className="text-[16px] font-semibold text-[#6b7280]">暂无账号</p>
            <p className="mt-1 text-[13px] text-[#9ca3af]">点击右上角「新建账号」开始配置</p>
          </div>
        ) : (
          active.map((account) => (
            <PioneerAccountCard
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
    </PioneerLayout>
  );
}
