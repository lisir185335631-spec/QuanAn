// PRD-13 US-010 · AC-6 · 合规月度 PDF 报告
// 4 节: 封面 · §1 KPI · §2 行业分布 · §3 时间趋势(stub PNG) · §4 Top20 事件 · 末页签名栏
// SHIELD: PDF 不支持 SVG · 时间趋势用 SimpleLine.png stub (后端 puppeteer 留 PRR)
// SHIELD: LD-A-3 payload 脱敏 · 仅展示 eventType + industry + count · 不含 user_id/内容详情

import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

// ── Types ──────────────────────────────────────────────────────────────────

export interface ComplianceReportData {
  month: string; // e.g. "2026-05"
  generatedBy: string;
  reportId: string;
  kpi: {
    todayDisclaimerCount: number;
    bannedWordCount: number;
    piiHitRate: number;
    topIndustry: string;
    prevMonthDisclaimerCount?: number;
    prevMonthBannedWordCount?: number;
    prevMonthPiiHitRate?: number;
  };
  industryRows: Array<{ industry: string; count: number; pct: number }>;
  topEvents: Array<{
    id: number;
    eventType: string;
    industry: string | null;
    createdAt: string;
    payloadSummary: string;
  }>;
}

// ── Styles ─────────────────────────────────────────────────────────────────

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1a1a1a',
    padding: 40,
    backgroundColor: '#ffffff',
  },
  coverPage: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
    padding: 60,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
  },
  coverTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#d4af37',
    marginBottom: 12,
    letterSpacing: 1,
  },
  coverSubtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 40,
  },
  coverMeta: {
    fontSize: 10,
    color: '#666',
    marginBottom: 6,
  },
  coverReportId: {
    fontSize: 8,
    color: '#444',
    marginTop: 20,
    fontFamily: 'Helvetica-Oblique',
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#d4af37',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingBottom: 4,
  },
  subsection: {
    marginBottom: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  kpiCard: {
    width: '22%',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 8,
  },
  kpiLabel: {
    fontSize: 7,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#d4af37',
  },
  kpiDelta: {
    fontSize: 7,
    marginTop: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: '4px 6px',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  tableRow: {
    flexDirection: 'row',
    padding: '3px 6px',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: '3px 6px',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  th: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#444',
  },
  td: {
    fontSize: 8,
    color: '#333',
  },
  tdMuted: {
    fontSize: 7,
    color: '#888',
  },
  signaturePage: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1a1a1a',
    padding: 60,
  },
  signatureTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 30,
    color: '#333',
  },
  signatureRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  signatureLabel: {
    fontSize: 9,
    color: '#666',
    width: 100,
  },
  signatureLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    marginLeft: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: '#bbb',
  },
  stubBox: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    marginBottom: 8,
  },
  stubText: {
    fontSize: 9,
    color: '#aaa',
    fontFamily: 'Helvetica-Oblique',
  },
});

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDelta(current: number, prev?: number): { text: string; color: string } {
  if (prev == null) return { text: '—', color: '#888' };
  const delta = current - prev;
  if (delta === 0) return { text: '±0', color: '#888' };
  const sign = delta > 0 ? '+' : '';
  return { text: `${sign}${delta} vs 上月`, color: delta > 0 ? '#ef4444' : '#22c55e' };
}

function eventTypeLabel(t: string): string {
  switch (t) {
    case 'pii_redacted': return 'PII 脱敏';
    case 'banned_word_hit': return '违禁词命中';
    case 'industry_disclaimer_triggered': return '行业免责声明';
    default: return t;
  }
}

// ── PDF Document ───────────────────────────────────────────────────────────

export function ComplianceReportPdf({ data }: { data: ComplianceReportData }) {
  const disclaimerDelta = fmtDelta(data.kpi.todayDisclaimerCount, data.kpi.prevMonthDisclaimerCount);
  const bannedDelta = fmtDelta(data.kpi.bannedWordCount, data.kpi.prevMonthBannedWordCount);
  const piiDelta = fmtDelta(data.kpi.piiHitRate, data.kpi.prevMonthPiiHitRate);

  // Build 56-row industry table (up to 56 entries, pad with zeros)
  const paddedIndustry = [...data.industryRows].slice(0, 56);
  while (paddedIndustry.length < Math.min(data.industryRows.length, 56)) {
    paddedIndustry.push({ industry: '—', count: 0, pct: 0 });
  }

  // Top 20 events (SHIELD: no raw payload/PII fields)
  const top20 = data.topEvents.slice(0, 20);

  return (
    <Document
      title={`QuanQn 合规月度报告 ${data.month}`}
      author={data.generatedBy}
      subject="合规月度报告"
    >
      {/* 封面 */}
      <Page size="A4" style={styles.coverPage}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={styles.coverTitle}>QuanQn</Text>
          <Text style={styles.coverSubtitle}>合规月度报告</Text>
          <Text style={styles.coverMeta}>报告月份：{data.month}</Text>
          <Text style={styles.coverMeta}>生成人：{data.generatedBy}</Text>
          <Text style={styles.coverMeta}>生成时间：{new Date().toLocaleDateString('zh-CN')}</Text>
          <Text style={styles.coverReportId}>报告编号：{data.reportId}</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>QuanQn · 内部合规文件 · 禁止外传</Text>
          <Text style={styles.footerText}>{data.month}</Text>
        </View>
      </Page>

      {/* §1 总览 KPI */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>§1 总览</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>免责声明触发</Text>
            <Text style={styles.kpiValue}>{data.kpi.todayDisclaimerCount}</Text>
            <Text style={[styles.kpiDelta, { color: disclaimerDelta.color }]}>
              {disclaimerDelta.text}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>违禁词命中</Text>
            <Text style={styles.kpiValue}>{data.kpi.bannedWordCount}</Text>
            <Text style={[styles.kpiDelta, { color: bannedDelta.color }]}>
              {bannedDelta.text}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>PII 命中率</Text>
            <Text style={styles.kpiValue}>{data.kpi.piiHitRate}%</Text>
            <Text style={[styles.kpiDelta, { color: piiDelta.color }]}>
              {piiDelta.text}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Top 行业</Text>
            <Text style={[styles.kpiValue, { fontSize: 11 }]}>{data.kpi.topIndustry || '—'}</Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>QuanQn 合规报告 {data.month}</Text>
          <Text style={styles.footerText}>§1 / 4</Text>
        </View>
      </Page>

      {/* §2 行业分布 */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>§2 行业分布</Text>

        {/* Table header — 6 columns as specified */}
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { width: '5%' }]}>#</Text>
          <Text style={[styles.th, { flex: 2 }]}>行业</Text>
          <Text style={[styles.th, { width: '12%' }]}>事件数</Text>
          <Text style={[styles.th, { width: '12%' }]}>占比%</Text>
          <Text style={[styles.th, { width: '15%' }]}>主要事件类型</Text>
          <Text style={[styles.th, { width: '14%' }]}>趋势</Text>
        </View>

        {paddedIndustry.map((row, idx) => (
          <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tdMuted, { width: '5%' }]}>{idx + 1}</Text>
            <Text style={[styles.td, { flex: 2 }]}>{row.industry}</Text>
            <Text style={[styles.td, { width: '12%' }]}>{row.count}</Text>
            <Text style={[styles.td, { width: '12%' }]}>{row.pct.toFixed(1)}%</Text>
            <Text style={[styles.tdMuted, { width: '15%' }]}>—</Text>
            <Text style={[styles.tdMuted, { width: '14%' }]}>—</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>QuanQn 合规报告 {data.month}</Text>
          <Text style={styles.footerText}>§2 / 4</Text>
        </View>
      </Page>

      {/* §3 时间趋势 (stub · 后端 puppeteer 留 PRR) */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>§3 时间趋势</Text>
        <View style={styles.stubBox}>
          {/* SHIELD: PDF 不支持 SVG · 用 stub 占位 · 后端 puppeteer 渲染 PNG 留 PRR */}
          <Text style={styles.stubText}>
            [时间趋势图] — PDF 渲染暂用占位符
          </Text>
          <Text style={styles.stubText}>
            后端 puppeteer 生成 PNG 功能留 PRR · 详见 SimpleLine.png stub
          </Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>QuanQn 合规报告 {data.month}</Text>
          <Text style={styles.footerText}>§3 / 4</Text>
        </View>
      </Page>

      {/* §4 高频事件 Top 20 */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>§4 高频合规事件 Top 20</Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.th, { width: '8%' }]}>#</Text>
          <Text style={[styles.th, { width: '22%' }]}>时间</Text>
          <Text style={[styles.th, { width: '28%' }]}>事件类型</Text>
          <Text style={[styles.th, { flex: 1 }]}>行业</Text>
          <Text style={[styles.th, { width: '22%' }]}>摘要</Text>
        </View>

        {top20.map((ev, idx) => (
          <View key={ev.id} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tdMuted, { width: '8%' }]}>{idx + 1}</Text>
            <Text style={[styles.tdMuted, { width: '22%' }]}>{ev.createdAt.slice(0, 16)}</Text>
            <Text style={[styles.td, { width: '28%' }]}>{eventTypeLabel(ev.eventType)}</Text>
            <Text style={[styles.tdMuted, { flex: 1 }]}>{ev.industry ?? '—'}</Text>
            {/* SHIELD: payloadSummary only — not raw content/PII (LD-A-3) */}
            <Text style={[styles.tdMuted, { width: '22%' }]}>{ev.payloadSummary}</Text>
          </View>
        ))}

        {top20.length === 0 && (
          <Text style={[styles.tdMuted, { marginTop: 12, textAlign: 'center' }]}>
            本月无合规事件记录
          </Text>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>QuanQn 合规报告 {data.month}</Text>
          <Text style={styles.footerText}>§4 / 4</Text>
        </View>
      </Page>

      {/* 末页 · 签名栏 */}
      <Page size="A4" style={styles.signaturePage}>
        <Text style={styles.signatureTitle}>签名确认</Text>

        {[
          { label: '法务负责人', hint: '签名 / 日期' },
          { label: '合规官', hint: '签名 / 日期' },
          { label: 'Super Admin', hint: '系统确认' },
        ].map((row) => (
          <View key={row.label} style={styles.signatureRow}>
            <Text style={styles.signatureLabel}>{row.label}</Text>
            <View style={styles.signatureLine} />
            <Text style={[styles.tdMuted, { marginLeft: 8, width: 60 }]}>{row.hint}</Text>
          </View>
        ))}

        <Text style={[styles.tdMuted, { marginTop: 40 }]}>
          报告编号：{data.reportId}　生成时间：{new Date().toLocaleString('zh-CN')}
        </Text>
        <Text style={[styles.tdMuted, { marginTop: 6 }]}>
          本报告由 QuanQn 系统自动生成，内容依据 admin_audit_log 合规事件数据汇总。
        </Text>
      </Page>
    </Document>
  );
}
