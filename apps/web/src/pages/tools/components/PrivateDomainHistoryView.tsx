/**
 * PrivateDomainHistoryView — ui/_14 设计稿 · 历史回看 · PRD-15 US-005
 * 液态玻璃皮 · 业务逻辑/testid 零改动
 */

import { motion } from 'framer-motion';

import { trpc } from '@/lib/trpc';
import { C, F } from '@/components/home-next/ikb/system';

import type { PhaseData } from './PhaseCard';

interface HistoryEntry {
  id: number;
  inputSummary: string | null;
  content: string | null;
  createdAt: Date | string;
}

interface PrivateDomainHistoryViewProps {
  onRestore: (phases: PhaseData[], summary: string, inputSummary: string) => void;
}

function formatDate(d: Date | string): string {
  const now = new Date();
  const diff = now.getTime() - new Date(d).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

function parseContent(content: string | null): { phases: PhaseData[]; summary: string } | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content) as { phases?: PhaseData[]; summary?: string };
    if (parsed.phases && Array.isArray(parsed.phases)) {
      return { phases: parsed.phases, summary: parsed.summary ?? '' };
    }
  } catch {
    // invalid JSON
  }
  return null;
}

export function PrivateDomainHistoryView({ onRestore }: PrivateDomainHistoryViewProps) {
  const { data: historyItems = [], isLoading, refetch } = trpc.history.list.useQuery(
    { agentId: 'PrivateDomainAgent', limit: 20, offset: 0 },
    { staleTime: 30_000 },
  );

  const rows = historyItems as HistoryEntry[];

  function handleRestore(row: HistoryEntry) {
    const parsed = parseContent(row.content);
    if (!parsed) return;
    onRestore(parsed.phases, parsed.summary, row.inputSummary ?? '');
  }

  const thStyle: React.CSSProperties = {
    padding: '10px 16px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.72)',
    fontFamily: F.mono,
  };

  const tdStyle: React.CSSProperties = {
    padding: '10px 16px',
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: F.cn,
    verticalAlign: 'middle',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-testid="private-domain-history-view">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.8)',
              fontFamily: F.mono,
            }}
          >
            历史记录
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: F.cn }}>
            点击记录恢复之前的 SOP 方案
          </p>
        </div>
        <motion.button
          type="button"
          onClick={() => void refetch()}
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          className="lg-glass"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            borderRadius: 10, padding: '7px 14px',
            fontSize: 12, fontWeight: 600,
            color: 'rgba(255,255,255,0.7)',
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: F.cn,
          }}
          data-testid="history-refresh-btn"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
          刷新
        </motion.button>
      </div>

      {isLoading ? (
        <div
          style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: 'rgba(255,255,255,0.72)', fontFamily: F.cn }}
          data-testid="history-loading"
        >
          加载中…
        </div>
      ) : rows.length === 0 ? (
        <div
          className="lg-glass"
          style={{
            borderRadius: 14,
            padding: 32,
            textAlign: 'center',
            border: `0.5px dashed ${C.line}`,
          }}
          data-testid="history-empty"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 8 }}>history</span>
          <p style={{ margin: '0 0 4px', fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>暂无历史记录</p>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.72)', fontFamily: F.cn }}>
            生成第一份私域 SOP 后，记录将出现在这里
          </p>
        </div>
      ) : (
        <div
          className="lg-glass"
          style={{ borderRadius: 14, overflow: 'hidden' }}
          data-testid="history-table"
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `0.5px solid ${C.line}`, background: 'rgba(255,255,255,0.04)' }}>
                <th style={{ ...thStyle, width: 100 }}>时间</th>
                <th style={thStyle}>产品描述</th>
                <th style={{ ...thStyle, width: 80 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: `0.5px solid ${C.line}`,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onClick={() => handleRestore(row)}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(168,197,224,0.08)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                  data-testid={`history-row-${row.id}`}
                >
                  <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.72)', whiteSpace: 'nowrap' }}>
                    {formatDate(row.createdAt)}
                  </td>
                  <td style={{ ...tdStyle, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.inputSummary ?? '—'}
                  </td>
                  <td style={tdStyle}>
                    <motion.button
                      type="button"
                      whileHover={{ y: -2 }}
                      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                      style={{
                        borderRadius: 8, padding: '4px 12px',
                        fontSize: 12, fontWeight: 600,
                        color: C.ikb,
                        background: 'rgba(168,197,224,0.14)',
                        border: 'none', cursor: 'pointer',
                        fontFamily: F.cn,
                      }}
                      onClick={(e) => { e.stopPropagation(); handleRestore(row); }}
                      data-testid={`restore-btn-${row.id}`}
                    >
                      恢复
                    </motion.button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
