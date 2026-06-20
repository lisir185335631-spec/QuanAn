/**
 * /step/1 · 选择行业赛道 — 液态玻璃皮(iOS26 LiquidGlass 体系)
 *
 * 数据/行为保留:56 行业 + 分类 tabs + 搜索过滤 + 选择 + 自定义行业 modal + 跳 /step/3。
 * 视觉换向:LiquidShell 外壳 + lg-glass 卡片 + Reveal/RevealGroup/Item 入场 + 冷蓝渐变字。
 */

import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Magnetic, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
import { CustomIndustryModal } from '@/components/industry/CustomIndustryModal';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { useStepData } from '@/hooks/useStepData';
import { trpc } from '@/lib/trpc';
import {
  type Industry,
  STEP1_INDUSTRIES_56,
  STEP1_PAGE_H1,
  STEP1_SEARCH_PLACEHOLDER,
  STEP1_SUBTITLE_COUNT,
  STEP1_SUBTITLE_CUSTOM_LINK,
  STEP1_SUBTITLE_PART1,
  STEP1_SUBTITLE_PART2,
  STEP1_SUBTITLE_PART3,
  STEP1_TABS,
} from '@/lib/constants/industries';

// ── 静态 KPI 数据 ────────────────────────────────────────────────────────────
const S1_KPI = [
  {
    icon: 'hub',
    label: '可选赛道数',
    value: String(STEP1_INDUSTRIES_56.length),
    unit: '个',
    badge: '全覆盖',
    badgeColor: C.ikb,
    badgeBg: 'rgba(168,197,224,0.22)',
    iconColor: C.ikb,
    iconBg: 'rgba(168,197,224,0.18)',
    extra: null,
  },
  {
    icon: 'verified',
    label: '推荐匹配度',
    value: '92',
    unit: '%',
    badge: '+18%',
    badgeColor: C.ikb,
    badgeBg: 'rgba(168,197,224,0.22)',
    iconColor: 'rgba(255,255,255,0.94)',
    iconBg: 'rgba(255,255,255,0.12)',
    extra: 'ring',
  },
  {
    icon: 'track_changes',
    label: '已选行业',
    value: '0',
    unit: '个',
    badge: '选择中',
    badgeColor: 'rgba(255,255,255,0.9)',
    badgeBg: 'rgba(228,238,255,0.18)',
    iconColor: 'rgba(255,255,255,0.9)',
    iconBg: 'rgba(228,238,255,0.18)',
    extra: 'bar',
  },
  {
    icon: 'local_fire_department',
    label: '平均热度',
    value: '86',
    unit: '/100',
    badge: '↑热门',
    badgeColor: C.ikb,
    badgeBg: 'rgba(168,197,224,0.22)',
    iconColor: C.ikb,
    iconBg: 'rgba(168,197,224,0.18)',
    extra: null,
  },
] as const;

// ── 赛道吸引力雷达六维(S1 suffix 防 id 冲突) ─────────────────────────────────
const S1_RADAR_DIMS = [
  { label: '市场规模', value: 88, color: C.ikb },
  { label: '增长性', value: 82, color: 'rgba(255,255,255,0.95)' },
  { label: '变现力', value: 90, color: C.ikb },
  { label: '竞争度', value: 72, color: C.ikb },
  { label: '门槛', value: 68, color: 'rgba(255,255,255,0.95)' },
  { label: '政策', value: 85, color: C.ikb },
];

// ── 赛道热度趋势数据 ─────────────────────────────────────────────────────────
const S1_TREND_DATA = [22, 35, 44, 58, 70, 83, 92, 100];
const S1_TREND_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月'];

// ── 行业卡 icon tile 颜色轮转(冷蓝体系) ──────────────────────────────────────
const S1_TILE_COLORS = [C.ikb, 'rgba(255,255,255,0.95)', C.ikb, C.ikb, 'rgba(255,255,255,0.95)'];

// ── 行业卡微指标静态热度(循环分配) · 占位假数据,待接入真实 API ────────────────────
const S1_HEAT = [92, 85, 88, 78, 83, 90, 72, 86, 80, 94, 75, 88, 82, 76, 89, 84, 71, 93,
                 87, 79, 85, 91, 73, 88, 82, 77, 86, 94, 80, 75, 89, 83, 70, 92, 85, 78,
                 88, 82, 76, 90, 84, 71, 93, 87, 79, 85, 91, 73, 88, 82, 77, 86, 94, 80, 75, 89];

export default function Step1() {
  const navigate = useNavigate();
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const { save } = useStepData(accountId, 'step1');
  const [activeTabId, setActiveTabId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [customIndustry, setCustomIndustry] = useState<string>('');
  const [customModalOpen, setCustomModalOpen] = useState(false);

  // ── US-P08: 文件上传状态 ─────────────────────────────────────────────────────
  const productFileInputRef = useRef<HTMLInputElement>(null);
  const personaFileInputRef = useRef<HTMLInputElement>(null);
  const [productFiles, setProductFiles] = useState<Array<{ name: string; assetId: number }>>([]);
  const [personaFiles, setPersonaFiles] = useState<Array<{ name: string; assetId: number }>>([]);
  const [uploadingProduct, setUploadingProduct] = useState(false);
  const [uploadingPersona, setUploadingPersona] = useState(false);

  // ── US-P10 AC1: 生成爆款选题 — 关联资料下拉框 ──────────────────────────────
  const [topicGenAssetId, setTopicGenAssetId] = useState<string>('');
  const allUploadedFiles = [
    ...productFiles.map((f) => ({ ...f, type: '产品资料' })),
    ...personaFiles.map((f) => ({ ...f, type: '人物介绍' })),
  ];

  const uploadAssetMutation = trpc.asset.uploadAsset.useMutation();
  const summarizeStep1AssetsMutation = trpc.asset.summarizeStep1Assets.useMutation();

  // PRD-37 US-P08: 支持 PDF/Word(.docx)/Excel(.xlsx)/Markdown(.md)
  const STEP1_FILE_ACCEPT = '.pdf,.doc,.docx,.xlsx,.xls,.md,.markdown';
  const STEP1_FILE_ACCEPT_LABEL = 'PDF / Word / Excel / Markdown';

  function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) ?? '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleProductFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploadingProduct(true);
    try {
      const newEntries: Array<{ name: string; assetId: number }> = [];
      for (const file of files) {
        const dataUrl = await readFileAsBase64(file);
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        const inferredMime = (file.type && file.type !== 'application/octet-stream')
          ? file.type
          : (ext === 'md' || ext === 'markdown' ? 'text/markdown' : (file.type || 'application/octet-stream'));
        const result = await uploadAssetMutation.mutateAsync({
          fileDataUrl: dataUrl,
          fileName: file.name,
          fileMime: inferredMime,
          fileSizeBytes: file.size,
          relatedStepKey: 'step1',
          assetSubtype: 'product_material',
        });
        newEntries.push({ name: file.name, assetId: result.assetId });
      }
      setProductFiles((prev) => [...prev, ...newEntries]);
      toast.success(`已上传 ${newEntries.length} 个产品资料，解析中…`);
    } catch {
      toast.error('上传失败，请重试');
    } finally {
      setUploadingProduct(false);
      if (productFileInputRef.current) productFileInputRef.current.value = '';
    }
  }

  async function handlePersonaFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploadingPersona(true);
    try {
      const newEntries: Array<{ name: string; assetId: number }> = [];
      for (const file of files) {
        const dataUrl = await readFileAsBase64(file);
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        const inferredMime = (file.type && file.type !== 'application/octet-stream')
          ? file.type
          : (ext === 'md' || ext === 'markdown' ? 'text/markdown' : (file.type || 'application/octet-stream'));
        const result = await uploadAssetMutation.mutateAsync({
          fileDataUrl: dataUrl,
          fileName: file.name,
          fileMime: inferredMime,
          fileSizeBytes: file.size,
          relatedStepKey: 'step1',
          assetSubtype: 'persona_file',
        });
        newEntries.push({ name: file.name, assetId: result.assetId });
      }
      setPersonaFiles((prev) => [...prev, ...newEntries]);
      toast.success(`已上传 ${newEntries.length} 个人物介绍，解析中…`);
    } catch {
      toast.error('上传失败，请重试');
    } finally {
      setUploadingPersona(false);
      if (personaFileInputRef.current) personaFileInputRef.current.value = '';
    }
  }

  // ── US-P05: 子行业两层选择状态 ───────────────────────────────────────────────
  const [selectedSubId, setSelectedSubId] = useState<string>('');
  const [subCustomValue, setSubCustomValue] = useState<string>('');
  const [subCustomModalOpen, setSubCustomModalOpen] = useState(false);
  const [subError, setSubError] = useState<string>('');

  // 当前行业的 subIndustries 列表
  const currentSubIndustries = selectedIndustry?.subIndustries ?? [];
  const hasSubIndustries = currentSubIndustries.length > 0;

  // 实际存储的子行业值(other 时用自定义值；否则存中文 label 而非英文 id · 让 LLM 收到精准语义)
  const resolvedSubValue =
    selectedSubId === 'other'
      ? subCustomValue
      : (currentSubIndustries.find((s) => s.id === selectedSubId)?.label ?? selectedSubId);
  const hasSubSelection = hasSubIndustries
    ? (selectedSubId !== '' && (selectedSubId !== 'other' || subCustomValue !== ''))
    : true; // 无 subIndustries 的行业不强求

  const activeTab = STEP1_TABS.find((t) => t.id === activeTabId) ?? STEP1_TABS[0]!;
  const tabFiltered =
    activeTabId === 'all'
      ? STEP1_INDUSTRIES_56
      : STEP1_INDUSTRIES_56.filter((ind) => ind.category === activeTab.label);
  const filteredIndustries = searchQuery.trim()
    ? tabFiltered.filter(
        (ind) =>
          ind.label.includes(searchQuery) ||
          (ind.keywords ?? []).some((kw) => kw.includes(searchQuery)),
      )
    : tabFiltered;

  const selectedLabel = selectedIndustry?.label ?? customIndustry;
  const hasSelection = !!selectedIndustry || !!customIndustry;

  function handleSelectIndustry(ind: Industry) {
    setSelectedIndustry(ind);
    setCustomIndustry('');
    // 切换大类时重置子行业选择
    setSelectedSubId('');
    setSubCustomValue('');
    setSubError('');
  }

  function handleSubSelect(subId: string) {
    setSelectedSubId(subId);
    setSubError('');
    if (subId === 'other') {
      setSubCustomModalOpen(true);
    }
  }

  function handleSubCustomConfirm(value: string) {
    setSubCustomValue(value);
    setSubError('');
  }

  function handleCustomConfirm(value: string) {
    setCustomIndustry(value);
    setSelectedIndustry(null);
    setSelectedSubId('');
    setSubCustomValue('');
  }

  function clearSelection() {
    setSelectedIndustry(null);
    setCustomIndustry('');
    setSelectedSubId('');
    setSubCustomValue('');
    setSubError('');
  }

  // ── US-P10 AC1: 跳转到爆款选题生成(Step5) ──────────────────────────────────
  function handleGoToTopicGen() {
    // 与 handleSubmit 对齐：选了大类但未选子行业 → 提示，不跳转
    if (selectedIndustry && hasSubIndustries && !hasSubSelection) {
      setSubError('请选择子行业');
      return;
    }
    // 先保存当前行业选择(如有)，再跳转到 Step5 带上关联 assetId
    if (hasSelection && accountId !== null) {
      const subCustomFlag = selectedSubId === 'other' && subCustomValue !== '';
      save({
        industry: selectedLabel,
        lastIndustry: selectedLabel,
        lastIndustryCategory: selectedIndustry?.label ?? '',
        lastIndustrySub: resolvedSubValue,
        ...(subCustomFlag ? { industrySubCustom: true } : {}),
        productMaterialAssetIds: productFiles.map((f) => f.assetId),
        personaFileAssetIds: personaFiles.map((f) => f.assetId),
      });
    }
    const params = new URLSearchParams();
    if (topicGenAssetId) params.set('assetId', topicGenAssetId);
    navigate(`/step/5${params.toString() ? `?${params.toString()}` : ''}`);
  }

  function handleSubmit() {
    if (!hasSelection) return;
    // AC-3: 选了大类但未选子行业 → 提示，不跳转
    if (selectedIndustry && hasSubIndustries && !hasSubSelection) {
      setSubError('请选择子行业');
      return;
    }
    // AC-4: 落库 industry / lastIndustry / lastIndustryCategory / lastIndustrySub
    // PRD-37 US-P08: 同时存 productMaterialAssetIds / personaFileAssetIds
    const subCustomFlag = selectedSubId === 'other' && subCustomValue !== '';
    save({
      industry: selectedLabel,
      lastIndustry: selectedLabel,
      lastIndustryCategory: selectedIndustry?.label ?? '',
      lastIndustrySub: resolvedSubValue,
      ...(subCustomFlag ? { industrySubCustom: true } : {}),
      productMaterialAssetIds: productFiles.map((f) => f.assetId),
      personaFileAssetIds: personaFiles.map((f) => f.assetId),
    });
    // PRD-37 US-P08: fire-and-forget LLM 梳理(有上传资料才调 · 不阻塞跳转)
    const allAssetIds = [
      ...productFiles.map((f) => f.assetId),
      ...personaFiles.map((f) => f.assetId),
    ];
    if (allAssetIds.length > 0) {
      summarizeStep1AssetsMutation.mutate({
        productMaterialAssetIds: productFiles.map((f) => f.assetId),
        personaFileAssetIds: personaFiles.map((f) => f.assetId),
      });
    }
    navigate('/step/3');
  }

  // ── 雷达 SVG 渲染(静态)──────────────────────────────────────────────────────
  function renderRadar() {
    const dims = S1_RADAR_DIMS;
    const cx = 130;
    const cy = 122;
    const R = 88;
    const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
    const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
    const poly = (r: number) => dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
    const dataPoly = dims.map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');
    return (
      <svg viewBox="0 0 260 244" className="w-full">
        <defs>
          <linearGradient id="radarFillS1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.95)" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon key={f} points={poly(R * f)} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        ))}
        {dims.map((_, i) => {
          const [x, y] = pt(i, R);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />;
        })}
        <polygon points={dataPoly} fill="url(#radarFillS1)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
        {dims.map((d, i) => {
          const [x, y] = pt(i, R * (d.value / 100));
          return <circle key={i} cx={x} cy={y} r="3.2" fill="rgba(255,255,255,0.9)" stroke={d.color} strokeWidth="2" />;
        })}
        {dims.map((d, i) => {
          const [x, y] = pt(i, R + 16);
          return (
            <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.84)" fontSize="10.5" fontWeight="600">
              {d.label}
            </text>
          );
        })}
      </svg>
    );
  }

  // ── 趋势折线 SVG ─────────────────────────────────────────────────────────────
  function renderTrend() {
    const data = S1_TREND_DATA;
    const W = 560;
    const H = 168;
    const padL = 6;
    const padR = 6;
    const padT = 12;
    const padB = 8;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;
    const max = 110;
    const x = (i: number) => padL + (innerW * i) / (data.length - 1);
    const y = (v: number) => padT + innerH * (1 - v / max);
    const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    const area = `${line} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <linearGradient id="trendFillS1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.ikb} stopOpacity="0.24" />
            <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="trendLineS1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.ikb} />
            <stop offset="100%" stopColor="rgba(255,255,255,0.95)" />
          </linearGradient>
        </defs>
        {[0, 0.33, 0.66, 1].map((f) => (
          <line
            key={f}
            x1={padL}
            x2={W - padR}
            y1={(padT + innerH * f).toFixed(1)}
            y2={(padT + innerH * f).toFixed(1)}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth="1"
          />
        ))}
        <path d={area} fill="url(#trendFillS1)" />
        <path d={line} fill="none" stroke="url(#trendLineS1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((v, i) =>
          i % 2 === 0 ? <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="rgba(255,255,255,0.9)" stroke={C.ikb} strokeWidth="2" /> : null,
        )}
      </svg>
    );
  }

  return (
    <LiquidShell>
      <div className="pb-28">
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="mb-12 flex flex-row items-center justify-between gap-8">
          <div className="shrink-0">
            <Reveal style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
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
                战略节点
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
                赛道选择
              </span>
            </Reveal>
            <h1
              style={{
                fontFamily: F.display,
                fontWeight: 800,
                fontSize: 52,
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                margin: 0,
                whiteSpace: 'nowrap',
                background: C.grad,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
                textShadow: 'none',
              }}
            >
              STEP 01 · {STEP1_PAGE_H1}
            </h1>
            <p
              className="mt-2 max-w-2xl"
              style={{ fontSize: 16, color: C.burgundyText, fontFamily: F.cn, textShadow: C.textShadow }}
            >
              {STEP1_SUBTITLE_PART1}
              <span style={{ fontWeight: 700, color: C.ikb }}>{STEP1_SUBTITLE_COUNT}</span>
              {STEP1_SUBTITLE_PART2}
              <button
                type="button"
                data-testid="subtitle-custom-link"
                onClick={() => setCustomModalOpen(true)}
                style={{
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.94)',
                  textDecoration: 'underline',
                  textUnderlineOffset: 2,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: F.cn,
                  fontSize: 16,
                  padding: 0,
                  textShadow: C.textShadow,
                }}
              >
                {STEP1_SUBTITLE_CUSTOM_LINK}
              </button>
              {STEP1_SUBTITLE_PART3}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            {/* ── US-P10 AC1: 生成爆款选题入口 ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
              {/* 关联资料下拉(暂定 · AC1 规定下拉框形式) */}
              {allUploadedFiles.length > 0 && (
                <div
                  className="lg-glass"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 10,
                    padding: '2px 4px',
                    border: `0.5px solid rgba(168,197,224,0.5)`,
                    minWidth: 160,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: C.ikb, flexShrink: 0, marginLeft: 6 }}>attach_file</span>
                  <select
                    data-testid="step1-topic-asset-select"
                    value={topicGenAssetId}
                    onChange={(e) => setTopicGenAssetId(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: 11,
                      fontFamily: F.cn,
                      color: topicGenAssetId ? C.ink : 'rgba(255,255,255,0.55)',
                      padding: '6px 8px',
                      cursor: 'pointer',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                    }}
                  >
                    <option value="" style={{ background: '#1a2a4a', color: 'rgba(255,255,255,0.6)' }}>关联资料（可选）</option>
                    {allUploadedFiles.map((f) => (
                      <option key={f.assetId} value={String(f.assetId)} style={{ background: '#1a2a4a', color: '#fff' }}>
                        [{f.type}] {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <motion.button
                type="button"
                data-testid="step1-goto-topic-gen"
                onClick={handleGoToTopicGen}
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                className="lg-glass ikb-focusring"
                style={{
                  display: 'flex',
                  flexShrink: 0,
                  alignItems: 'center',
                  gap: 8,
                  whiteSpace: 'nowrap',
                  borderRadius: 12,
                  padding: '10px 16px',
                  fontFamily: F.cn,
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.ikb,
                  cursor: 'pointer',
                  border: `0.5px solid rgba(168,197,224,0.55)`,
                  background: 'rgba(168,197,224,0.12)',
                  textShadow: C.textShadow,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>local_fire_department</span>
                生成爆款选题
              </motion.button>
            </div>

            <motion.button
              type="button"
              onClick={() => setCustomModalOpen(true)}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              className="lg-glass lg-spec ikb-focusring"
              style={{
                display: 'flex',
                flexShrink: 0,
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                borderRadius: 12,
                padding: '10px 16px',
                fontFamily: F.mono,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: C.ink,
                cursor: 'pointer',
                border: 'none',
                textShadow: C.textShadow,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
              自定义行业
            </motion.button>
            <Magnetic strength={0.3}>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!hasSelection}
                className="lg-gradbtn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  whiteSpace: 'nowrap',
                  borderRadius: 9999,
                  padding: '10px 22px',
                  fontFamily: F.cn,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#fff',
                  border: 'none',
                  cursor: hasSelection ? 'pointer' : 'not-allowed',
                  opacity: hasSelection ? 1 : 0.4,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                确认并进入下一步
              </button>
            </Magnetic>
          </div>
        </header>

        {/* ── KPI 概览卡(4 张)──────────────────────────────── */}
        <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 44 }}>
          {S1_KPI.map((kpi, idx) => (
            <Item key={kpi.label} style={{ height: '100%' }}>
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
                      background: kpi.iconBg,
                      color: kpi.iconColor,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{kpi.icon}</span>
                  </span>
                  <span
                    style={{
                      borderRadius: 999,
                      padding: '2px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: F.mono,
                      letterSpacing: '0.06em',
                      background: kpi.badgeBg,
                      color: kpi.badgeColor,
                    }}
                  >
                    {idx === 1 ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>trending_up</span>
                        {kpi.badge}
                      </span>
                    ) : kpi.badge}
                  </span>
                </div>
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>
                      {idx === 2 ? (hasSelection ? '1' : '0') : kpi.value}
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, fontWeight: 400, marginLeft: 4 }}>{kpi.unit}</span>
                    </p>
                    <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{kpi.label}</p>
                  </div>
                  {kpi.extra === 'ring' && (
                    <div style={{ height: 48, width: 48, flexShrink: 0 }}>
                      <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3.5" />
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="92 100" />
                      </svg>
                    </div>
                  )}
                </div>
                {kpi.extra === 'bar' && (
                  <div style={{ marginTop: 12, height: 8, width: '100%', borderRadius: 999, background: 'rgba(228,238,255,0.15)' }}>
                    <div
                      style={{
                        height: 8,
                        borderRadius: 999,
                        background: C.grad,
                        width: hasSelection ? '100%' : '4%',
                        transition: 'width 0.4s',
                      }}
                    />
                  </div>
                )}
                {kpi.extra === null && idx === 3 && (
                  <div style={{ marginTop: 12, display: 'flex', height: 24, alignItems: 'flex-end', gap: 4 }}>
                    {[68, 82, 75, 90, 78].map((h, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          borderRadius: '2px 2px 0 0',
                          background: `rgba(168,197,224,0.6)`,
                          height: `${h}%`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            </Item>
          ))}
        </RevealGroup>

        {/* ── Filters + search ───────────────────────────────── */}
        <Reveal style={{ marginBottom: 24, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {STEP1_TABS.map((tab) => {
              const active = activeTabId === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`tab-${tab.id}`}
                  data-state={active ? 'active' : 'inactive'}
                  onClick={() => setActiveTabId(tab.id)}
                  className="ikb-focusring"
                  style={{
                    borderRadius: 9999,
                    border: active ? `1px solid rgba(168,197,224,0.7)` : `0.5px solid ${C.line}`,
                    background: active ? 'rgba(168,197,224,0.25)' : 'rgba(255,255,255,0.08)',
                    color: active ? C.ikb : 'rgba(255,255,255,0.84)',
                    padding: '8px 16px',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    fontFamily: F.mono,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backdropFilter: 'blur(8px)',
                    textShadow: C.textShadow,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(168,197,224,0.5)';
                      (e.currentTarget as HTMLButtonElement).style.color = C.ikb;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = C.line;
                      (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.84)';
                    }
                  }}
                >
                  {tab.label} ({tab.count})
                </button>
              );
            })}
          </div>
          <div
            className="lg-glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              borderRadius: 12,
              padding: '8px 14px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: C.ikb, flexShrink: 0 }}>
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={STEP1_SEARCH_PLACEHOLDER}
              data-testid="industry-search"
              style={{
                width: 340,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: 14,
                fontFamily: F.cn,
                color: C.ink,
                textShadow: C.textShadow,
              }}
              onFocus={(e) => {
                (e.currentTarget.parentElement as HTMLDivElement).style.boxShadow = '0 0 0 2px rgba(168,197,224,0.45)';
              }}
              onBlur={(e) => {
                (e.currentTarget.parentElement as HTMLDivElement).style.boxShadow = '';
              }}
            />
          </div>
        </Reveal>

        {/* ── Industry bento grid ────────────────────────────── */}
        {filteredIndustries.length === 0 ? (
          <Reveal>
            <div
              className="lg-glass"
              style={{
                borderRadius: 16,
                padding: '64px 0',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>未找到匹配的行业</p>
              <button
                type="button"
                onClick={() => setCustomModalOpen(true)}
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.ikb,
                  textDecoration: 'underline',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: F.cn,
                  textShadow: C.textShadow,
                }}
              >
                尝试自定义输入 →
              </button>
            </div>
          </Reveal>
        ) : (
          <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 14, marginBottom: 48 }}>
            {filteredIndustries.map((ind, idx) => {
              const active = selectedIndustry?.label === ind.label;
              const tileColor = S1_TILE_COLORS[idx % S1_TILE_COLORS.length]!;
              const heat = S1_HEAT[idx % S1_HEAT.length] ?? 80;
              return (
                <Item key={ind.label}>
                  <motion.button
                    type="button"
                    data-testid={`industry-card-${ind.label}`}
                    data-state={active ? 'active' : 'inactive'}
                    onClick={() => handleSelectIndustry(ind)}
                    whileHover={{ y: -4 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                    className="lg-glass lg-spec ikb-focusring"
                    style={{
                      position: 'relative',
                      display: 'flex',
                      cursor: 'pointer',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 8,
                      overflow: 'hidden',
                      borderRadius: 16,
                      padding: 16,
                      textAlign: 'left',
                      width: '100%',
                      border: active ? `1.5px solid rgba(168,197,224,0.7)` : `0.5px solid ${C.line}`,
                      background: active ? 'rgba(168,197,224,0.18)' : 'rgba(255,255,255,0.08)',
                      boxShadow: active ? `0 2px 16px rgba(168,197,224,0.25)` : 'none',
                    }}
                  >
                    {/* 选中 check 徽标 */}
                    <span
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: 10,
                        display: 'flex',
                        height: 16,
                        width: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        background: active ? C.ikb : 'rgba(255,255,255,0.12)',
                        border: active ? 'none' : `0.5px solid ${C.line}`,
                        color: active ? '#fff' : 'transparent',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>check</span>
                    </span>

                    {/* 彩色 icon tile */}
                    <span
                      style={{
                        display: 'flex',
                        height: 40,
                        width: 40,
                        flexShrink: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, rgba(168,197,224,0.45), rgba(120,160,220,0.28))',
                        boxShadow: `0 2px 8px rgba(168,197,224,0.25)`,
                        color: tileColor,
                      }}
                    >
                      {ind.emoji}
                    </span>

                    {/* 行业名 + 副标 */}
                    <div style={{ width: '100%', minWidth: 0 }}>
                      <h3
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          lineHeight: 1.25,
                          fontFamily: F.cn,
                          color: active ? C.ikb : C.ink,
                          margin: 0,
                          textShadow: C.textShadow,
                        }}
                      >
                        {ind.label}
                      </h3>
                      <p
                        style={{
                          marginTop: 2,
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: 'rgba(255,255,255,0.84)',
                          fontFamily: F.mono,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          margin: '2px 0 0',
                        }}
                      >
                        {ind.category}
                      </p>
                    </div>

                    {/* 微指标: 热度进度条 */}
                    <div style={{ width: '100%' }}>
                      <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10 }}>
                        <span style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.mono }}>热度</span>
                        <span
                          style={{
                            fontWeight: 700,
                            color: active ? C.ikb : 'rgba(255,255,255,0.84)',
                            fontFamily: F.mono,
                          }}
                        >
                          {heat}%
                        </span>
                      </div>
                      <div style={{ height: 4, width: '100%', borderRadius: 999, background: 'rgba(255,255,255,0.12)' }}>
                        <div
                          style={{
                            height: 4,
                            borderRadius: 999,
                            transition: 'all 0.3s',
                            width: `${heat}%`,
                            background: active ? C.grad : 'rgba(168,197,224,0.55)',
                            opacity: active ? 1 : 0.8,
                          }}
                        />
                      </div>
                    </div>
                  </motion.button>
                </Item>
              );
            })}
          </RevealGroup>
        )}

        {/* ── US-P05: 子行业选择区块(大类选中后出现) ──────── */}
        {selectedIndustry && hasSubIndustries && (
          <Reveal style={{ marginBottom: 40 }}>
            <motion.div
              className="lg-glass lg-spec"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              style={{ borderRadius: 20, padding: 28 }}
            >
              {/* 区块标题 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span
                  style={{
                    display: 'flex',
                    height: 36,
                    width: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    background: 'rgba(168,197,224,0.22)',
                    color: C.ikb,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    category
                  </span>
                </span>
                <div>
                  <h2
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: C.ink,
                      fontFamily: F.cn,
                      margin: 0,
                      textShadow: C.textShadow,
                    }}
                  >
                    选择子行业
                  </h2>
                  <p
                    style={{
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.7)',
                      fontFamily: F.cn,
                      margin: 0,
                    }}
                  >
                    {selectedIndustry.label} · 请进一步细化你的赛道
                  </p>
                </div>
                {subError && (
                  <span
                    data-testid="sub-industry-error"
                    style={{
                      marginLeft: 'auto',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      borderRadius: 999,
                      background: 'rgba(255,80,80,0.18)',
                      border: '0.5px solid rgba(255,80,80,0.4)',
                      padding: '4px 14px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'rgba(255,120,120,0.95)',
                      fontFamily: F.cn,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      warning
                    </span>
                    {subError}
                  </span>
                )}
              </div>

              {/* 入口 1: 下拉框 */}
              <div style={{ marginBottom: 20 }}>
                <label
                  htmlFor="sub-industry-select"
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.ikb,
                    fontFamily: F.mono,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                    textShadow: C.textShadow,
                  }}
                >
                  下拉选择
                </label>
                <div
                  className="lg-glass"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 12,
                    padding: '2px 4px',
                    border:
                      selectedSubId !== ''
                        ? '1px solid rgba(168,197,224,0.6)'
                        : `0.5px solid ${C.line}`,
                  }}
                >
                  <select
                    id="sub-industry-select"
                    data-testid="sub-industry-select"
                    value={selectedSubId}
                    onChange={(e) => handleSubSelect(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: 14,
                      fontFamily: F.cn,
                      color: selectedSubId !== '' ? C.ink : 'rgba(255,255,255,0.5)',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                    }}
                  >
                    <option value="" disabled style={{ background: '#1a2a4a', color: 'rgba(255,255,255,0.6)' }}>
                      请选择子行业…
                    </option>
                    {currentSubIndustries.map((sub) => (
                      <option
                        key={sub.id}
                        value={sub.id}
                        style={{ background: '#1a2a4a', color: '#fff' }}
                      >
                        {sub.label}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: C.ikb, flexShrink: 0, marginRight: 10 }}>
                    expand_more
                  </span>
                </div>
              </div>

              {/* 分割线 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.5)',
                    fontFamily: F.mono,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  或
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
              </div>

              {/* 入口 2: 网格点选 */}
              <div>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.ikb,
                    fontFamily: F.mono,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: 12,
                    margin: '0 0 12px',
                    textShadow: C.textShadow,
                  }}
                >
                  网格点选
                </p>
                <div
                  data-testid="sub-industry-grid"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  {currentSubIndustries.map((sub) => {
                    const isActive = selectedSubId === sub.id;
                    return (
                      <motion.button
                        key={sub.id}
                        type="button"
                        data-testid={`sub-industry-chip-${sub.id}`}
                        data-state={isActive ? 'active' : 'inactive'}
                        onClick={() => handleSubSelect(sub.id)}
                        whileHover={{ y: -2 }}
                        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                        style={{
                          borderRadius: 9999,
                          border: isActive
                            ? '1.5px solid rgba(168,197,224,0.75)'
                            : `0.5px solid ${C.line}`,
                          background: isActive
                            ? 'rgba(168,197,224,0.25)'
                            : 'rgba(255,255,255,0.07)',
                          color: isActive ? C.ikb : 'rgba(255,255,255,0.84)',
                          padding: '8px 18px',
                          fontSize: 13,
                          fontWeight: isActive ? 700 : 500,
                          fontFamily: F.cn,
                          cursor: 'pointer',
                          boxShadow: isActive ? '0 2px 12px rgba(168,197,224,0.2)' : 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.2s',
                          textShadow: C.textShadow,
                        }}
                      >
                        {isActive && (
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                            check
                          </span>
                        )}
                        {sub.id === 'other' && !isActive && (
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                            edit
                          </span>
                        )}
                        {sub.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* 子行业已选展示 + 自定义值提示 */}
              {selectedSubId !== '' && selectedSubId !== 'other' && (
                <div
                  style={{
                    marginTop: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.7)',
                    fontFamily: F.cn,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: C.ikb }}>
                    check_circle
                  </span>
                  <span>已选子行业:</span>
                  <span
                    data-testid="sub-industry-selected-label"
                    style={{ fontWeight: 700, color: C.ikb }}
                  >
                    {currentSubIndustries.find((s) => s.id === selectedSubId)?.label ?? selectedSubId}
                  </span>
                </div>
              )}
              {selectedSubId === 'other' && subCustomValue && (
                <div
                  style={{
                    marginTop: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.7)',
                    fontFamily: F.cn,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: C.ikb }}>
                    check_circle
                  </span>
                  <span>自定义子行业:</span>
                  <span
                    data-testid="sub-industry-selected-label"
                    style={{ fontWeight: 700, color: C.ikb }}
                  >
                    {subCustomValue}
                  </span>
                </div>
              )}
              {selectedSubId === 'other' && !subCustomValue && (
                <div
                  style={{
                    marginTop: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: 'rgba(255,200,80,0.85)',
                    fontFamily: F.cn,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    info
                  </span>
                  <span>请在弹窗中输入自定义子行业名称</span>
                  <button
                    type="button"
                    onClick={() => setSubCustomModalOpen(true)}
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.ikb,
                      textDecoration: 'underline',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: F.cn,
                      padding: 0,
                    }}
                  >
                    点击输入
                  </button>
                </div>
              )}
            </motion.div>
          </Reveal>
        )}

        {/* ── US-P08: 文件上传(产品资料 + 人物介绍) ─────────── */}
        <Reveal style={{ marginBottom: 44 }}>
          <motion.div
            className="lg-glass lg-spec"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            style={{ borderRadius: 20, padding: 28 }}
          >
            {/* 区块标题 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <span
                style={{
                  display: 'flex',
                  height: 36,
                  width: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  background: 'rgba(168,197,224,0.22)',
                  color: C.ikb,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>upload_file</span>
              </span>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>
                  信息采集（可选）
                </h2>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: F.cn, margin: 0 }}>
                  上传产品资料 · AI 将自动梳理产品卖点与人物背景
                </p>
              </div>
              <span
                style={{
                  marginLeft: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  borderRadius: 999,
                  background: 'rgba(168,197,224,0.15)',
                  padding: '4px 12px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.ikb,
                  fontFamily: F.mono,
                }}
              >
                支持 {STEP1_FILE_ACCEPT_LABEL}
              </span>
            </div>

            {/* 两个上传区 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* 产品资料 dropzone */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.ikb, fontFamily: F.mono, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, textShadow: C.textShadow }}>
                  产品资料
                </p>
                <motion.button
                  type="button"
                  aria-label="上传产品资料"
                  data-testid="step1-upload-product"
                  onClick={() => productFileInputRef.current?.click()}
                  disabled={uploadingProduct}
                  whileHover={uploadingProduct ? {} : { y: -4 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                  className="lg-glass"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    cursor: uploadingProduct ? 'not-allowed' : 'pointer',
                    borderRadius: 16,
                    borderStyle: 'dashed',
                    borderWidth: 1,
                    borderColor: 'rgba(168,197,224,0.4)',
                    padding: '28px 16px',
                    textAlign: 'center',
                    background: 'rgba(168,197,224,0.06)',
                    opacity: uploadingProduct ? 0.6 : 1,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 28, color: C.ink, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }}>
                    {uploadingProduct ? 'progress_activity' : 'description'}
                  </span>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>
                    {uploadingProduct ? '上传中…' : '上传产品资料'}
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: 0, fontFamily: F.cn }}>
                    产品介绍、卖点、价格体系、客户案例等
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: 0, fontFamily: F.cn }}>
                    仅支持 PDF / Word / Excel / Markdown
                  </p>
                </motion.button>
                <input
                  ref={productFileInputRef}
                  type="file"
                  accept={STEP1_FILE_ACCEPT}
                  multiple
                  onChange={handleProductFilesChange}
                  className="sr-only"
                  data-testid="step1-product-file-input"
                />
                {/* 已上传文件列表 */}
                {productFiles.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {productFiles.map((f, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          borderRadius: 8,
                          background: 'rgba(168,197,224,0.12)',
                          border: '0.5px solid rgba(168,197,224,0.3)',
                          padding: '6px 10px',
                          fontSize: 12,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: C.ikb }}>check_circle</span>
                        <span style={{ flex: 1, color: C.ink, fontFamily: F.cn, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: C.textShadow }}>
                          {f.name}
                        </span>
                        <span style={{ fontSize: 10, color: C.ikb, fontFamily: F.mono }}>解析中</span>
                        <button
                          type="button"
                          aria-label={`删除 ${f.name}`}
                          onClick={() => setProductFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 0, display: 'flex' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 人物介绍 dropzone */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.ikb, fontFamily: F.mono, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, textShadow: C.textShadow }}>
                  人物介绍
                </p>
                <motion.button
                  type="button"
                  aria-label="上传人物介绍"
                  data-testid="step1-upload-persona"
                  onClick={() => personaFileInputRef.current?.click()}
                  disabled={uploadingPersona}
                  whileHover={uploadingPersona ? {} : { y: -4 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                  className="lg-glass"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    cursor: uploadingPersona ? 'not-allowed' : 'pointer',
                    borderRadius: 16,
                    borderStyle: 'dashed',
                    borderWidth: 1,
                    borderColor: 'rgba(168,197,224,0.4)',
                    padding: '28px 16px',
                    textAlign: 'center',
                    background: 'rgba(168,197,224,0.06)',
                    opacity: uploadingPersona ? 0.6 : 1,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 28, color: C.ink, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }}>
                    {uploadingPersona ? 'progress_activity' : 'person'}
                  </span>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>
                    {uploadingPersona ? '上传中…' : '上传人物介绍'}
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: 0, fontFamily: F.cn }}>
                    个人经历、行业背景、专业资质、从业故事等
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: 0, fontFamily: F.cn }}>
                    仅支持 PDF / Word / Excel / Markdown
                  </p>
                </motion.button>
                <input
                  ref={personaFileInputRef}
                  type="file"
                  accept={STEP1_FILE_ACCEPT}
                  multiple
                  onChange={handlePersonaFilesChange}
                  className="sr-only"
                  data-testid="step1-persona-file-input"
                />
                {/* 已上传文件列表 */}
                {personaFiles.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {personaFiles.map((f, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          borderRadius: 8,
                          background: 'rgba(168,197,224,0.12)',
                          border: '0.5px solid rgba(168,197,224,0.3)',
                          padding: '6px 10px',
                          fontSize: 12,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: C.ikb }}>check_circle</span>
                        <span style={{ flex: 1, color: C.ink, fontFamily: F.cn, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: C.textShadow }}>
                          {f.name}
                        </span>
                        <span style={{ fontSize: 10, color: C.ikb, fontFamily: F.mono }}>解析中</span>
                        <button
                          type="button"
                          aria-label={`删除 ${f.name}`}
                          onClick={() => setPersonaFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 0, display: 'flex' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </Reveal>

        {/* ── 数据洞察(雷达 + 趋势)──────────────────────────── */}
        <Reveal style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }}>insights</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>数据洞察</h2>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>· AI 综合评估 · 行业吸引力实时测算</span>
          <span
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 999,
              background: 'rgba(168,197,224,0.18)',
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 600,
              color: C.ikb,
              fontFamily: F.mono,
              letterSpacing: '0.04em',
            }}
          >
            <span
              style={{
                height: 6,
                width: 6,
                borderRadius: '50%',
                background: C.ikb,
                animation: 'ikb-pulse 1.6s ease-in-out infinite',
                display: 'inline-block',
              }}
            />
            模型已就绪
          </span>
        </Reveal>

        <div className="mb-8 grid grid-cols-12 gap-6">
          {/* 赛道吸引力雷达 */}
          <Reveal style={{ gridColumn: 'span 5' }}>
            <motion.div
              className="lg-glass"
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 20, padding: 24, height: '100%' }}
            >
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    style={{
                      display: 'flex',
                      height: 38,
                      width: 38,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 10,
                      background: 'rgba(168,197,224,0.22)',
                      color: C.ikb,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>radar</span>
                  </span>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>赛道吸引力雷达</h3>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>六维模型评估</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p
                    style={{
                      fontSize: 26,
                      fontWeight: 700,
                      lineHeight: 1,
                      margin: 0,
                      fontFamily: F.display,
                      background: C.grad,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      color: 'transparent',
                      textShadow: 'none',
                    }}
                  >
                    81
                  </p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.84)', fontFamily: F.mono, margin: 0 }}>综合分</p>
                </div>
              </div>
              {renderRadar()}
              <div className="mt-2 grid grid-cols-3 gap-y-2">
                {S1_RADAR_DIMS.map((d) => (
                  <div key={d.label} className="flex items-center gap-1.5">
                    <span style={{ height: 8, width: 8, borderRadius: '50%', backgroundColor: d.color, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{d.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: F.mono, textShadow: C.textShadow }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </Reveal>

          {/* 赛道热度趋势 */}
          <Reveal style={{ gridColumn: 'span 7' }}>
            <motion.div
              className="lg-glass"
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 20, padding: 24, height: '100%' }}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    style={{
                      display: 'flex',
                      height: 38,
                      width: 38,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.94)',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>show_chart</span>
                  </span>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>赛道热度趋势</h3>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>近 8 个月综合热度指数</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {(['热度', '流量', '竞争'] as const).map((t, i) => (
                    <span
                      key={t}
                      style={{
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: F.mono,
                        background: i === 0 ? 'rgba(168,197,224,0.35)' : 'rgba(255,255,255,0.10)',
                        color: i === 0 ? C.ikb : 'rgba(255,255,255,0.84)',
                        textShadow: C.textShadow,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mb-3 flex items-end gap-3">
                <p style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>100</p>
                <span
                  style={{
                    marginBottom: 4,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 2,
                    borderRadius: 999,
                    background: 'rgba(168,197,224,0.18)',
                    padding: '2px 8px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.ikb,
                    fontFamily: F.mono,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>trending_up</span>+354%
                </span>
                <span style={{ marginBottom: 4, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>较同期基线</span>
              </div>
              {renderTrend()}
              <div className="mt-1 flex justify-between px-1" style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontFamily: F.mono }}>
                {S1_TREND_LABELS.map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </motion.div>
          </Reveal>
        </div>
      </div>

      {/* ── Sticky action bar ────────────────────────────────── */}
      {hasSelection && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 30,
            borderTop: `0.5px solid ${C.line}`,
            background: 'rgba(18,34,66,0.82)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            boxShadow: `0 -4px 24px rgba(168,197,224,0.12)`,
          }}
        >
          <div
            style={{
              margin: '0 auto',
              display: 'flex',
              width: '100%',
              maxWidth: 1440,
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 40px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>已选择:</span>
              {/* 大类 pill */}
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  borderRadius: 999,
                  border: `0.5px solid rgba(168,197,224,0.45)`,
                  background: 'rgba(168,197,224,0.18)',
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.ikb,
                  fontFamily: F.cn,
                  textShadow: C.textShadow,
                }}
              >
                {selectedLabel}
                <button
                  type="button"
                  aria-label="清除选择"
                  onClick={clearSelection}
                  style={{
                    fontSize: 14,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: C.ikb,
                    padding: 0,
                    display: 'inline-flex',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.94)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.ikb; }}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">close</span>
                </button>
              </span>
              {/* 子行业 pill(已选时显示) */}
              {resolvedSubValue && (
                <>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>›</span>
                  <span
                    data-testid="sticky-sub-industry-pill"
                    style={{
                      borderRadius: 999,
                      border: `0.5px solid rgba(168,197,224,0.35)`,
                      background: 'rgba(168,197,224,0.12)',
                      padding: '4px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'rgba(168,197,224,0.9)',
                      fontFamily: F.cn,
                      textShadow: C.textShadow,
                    }}
                  >
                    {resolvedSubValue}
                  </span>
                </>
              )}
              {/* 未选子行业且有子行业列表时 → 提示 */}
              {selectedIndustry && hasSubIndustries && !resolvedSubValue && (
                <span
                  style={{
                    fontSize: 12,
                    color: 'rgba(255,200,80,0.8)',
                    fontFamily: F.cn,
                  }}
                >
                  ↑ 请选择子行业
                </span>
              )}
            </div>
            <Magnetic strength={0.3}>
              <button
                type="button"
                onClick={handleSubmit}
                className="lg-gradbtn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  borderRadius: 9999,
                  padding: '12px 32px',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: F.cn,
                }}
              >
                确认并进入下一步
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </button>
            </Magnetic>
          </div>
        </div>
      )}

      <CustomIndustryModal
        open={customModalOpen}
        onOpenChange={setCustomModalOpen}
        hideTrigger
        onConfirm={handleCustomConfirm}
      />

      {/* US-P05: 子行业自定义 modal(复用 CustomIndustryModal) */}
      <CustomIndustryModal
        open={subCustomModalOpen}
        onOpenChange={(open) => {
          setSubCustomModalOpen(open);
          // 用户关闭弹窗但未输入时，重置 other 选中
          if (!open && !subCustomValue) {
            setSelectedSubId('');
          }
        }}
        hideTrigger
        onConfirm={handleSubCustomConfirm}
      />
    </LiquidShell>
  );
}
