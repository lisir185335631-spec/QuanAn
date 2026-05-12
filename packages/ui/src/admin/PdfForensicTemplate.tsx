// PRD-11 US-018 · Forensic PDF Template — server-side only (@react-pdf/renderer)
// Used by apps/api/src/services/admin/audit/pdf-forensic.service.ts
// DO NOT import in browser bundles — use @quanqn/ui/admin/forensic-pdf export path

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

// ── Types ──────────────────────────────────────────────────────────────────

export interface ForensicTimelineEntry {
  source: string;
  eventType: string;
  eventCategory: string;
  createdAt: string; // ISO string
  payloadSummary: string; // truncated to 200 chars
  payloadHash: string; // SHA-256 hex of redacted payload
}

export interface ForensicPdfData {
  traceId: string;
  caseNumber?: string;
  reason: string;
  generatedAt: string; // ISO string
  requesterEmail: string;
  requesterRole: string;
  requesterAdminId: number;
  contentHash: string; // SHA-256 of all redacted payloads
  entries: ForensicTimelineEntry[];
  isEmpty: boolean;
}

// ── Styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 36,
    color: '#111',
    backgroundColor: '#fff',
  },
  coverBlock: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 14,
  },
  logo: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  logoSub: {
    fontSize: 8,
    color: '#888',
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 9,
    color: '#555',
    marginBottom: 10,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  metaItem: {
    minWidth: 140,
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 7,
    color: '#888',
    marginBottom: 1,
  },
  metaValue: {
    fontSize: 8,
    color: '#1a1a1a',
    fontFamily: 'Helvetica-Bold',
  },
  traceBox: {
    marginTop: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 3,
    padding: 6,
  },
  traceLabel: {
    fontSize: 7,
    color: '#888',
    marginBottom: 2,
  },
  traceValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
  },
  emptyBadge: {
    marginTop: 12,
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffc107',
    borderRadius: 3,
    padding: '4 8',
  },
  emptyBadgeText: {
    fontSize: 9,
    color: '#856404',
    fontFamily: 'Helvetica-Bold',
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginTop: 14,
    marginBottom: 6,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 2,
    paddingHorizontal: 4,
    backgroundColor: '#fafafa',
  },
  colTime: { flex: 2, fontSize: 7 },
  colSource: { flex: 2, fontSize: 7 },
  colCat: { flex: 1.5, fontSize: 7 },
  colType: { flex: 2, fontSize: 7 },
  colPayload: { flex: 4, fontSize: 7 },
  colHash: { flex: 2, fontSize: 7, fontFamily: 'Helvetica' },
  colHeaderText: { fontFamily: 'Helvetica-Bold', fontSize: 7 },
  emptyRow: {
    padding: 12,
    alignItems: 'center',
  },
  emptyRowText: {
    fontSize: 9,
    color: '#888',
  },
  signaturePage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sigOuter: {
    width: 400,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    padding: 28,
  },
  sigTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 18,
    textAlign: 'center',
  },
  sigRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  sigLbl: {
    fontSize: 8,
    color: '#888',
    width: 90,
    flexShrink: 0,
  },
  sigVal: {
    fontSize: 8,
    color: '#111',
    flex: 1,
  },
  sigDivider: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 12,
  },
  sigPlaceholder: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sigPlaceholderText: {
    fontSize: 8,
    color: '#bbb',
  },
  sealPlaceholder: {
    height: 70,
    width: 70,
    borderWidth: 2,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sealText: {
    fontSize: 7,
    color: '#bbb',
    textAlign: 'center',
  },
  hashFullLine: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  hashFullText: {
    fontSize: 6,
    color: '#888',
    fontFamily: 'Helvetica',
    wordBreak: 'break-all',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 3,
  },
  footerLeft: {
    fontSize: 6,
    color: '#888',
    flex: 3,
  },
  footerCenter: {
    fontSize: 6,
    color: '#888',
    flex: 2,
    textAlign: 'center',
  },
  footerRight: {
    fontSize: 6,
    color: '#888',
    flex: 3,
    textAlign: 'right',
  },
});

// ── Footer (fixed — renders on every page) ─────────────────────────────────

function PageFooter({ data }: { data: ForensicPdfData }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerLeft} render={({ pageNumber, totalPages }) =>
        `Page ${pageNumber}/${totalPages}`
      } />
      <Text style={s.footerCenter}>
        {data.generatedAt.slice(0, 19).replace('T', ' ')} UTC
      </Text>
      <Text style={s.footerRight}>
        {`Content-Hash: SHA-256 = ${data.contentHash}`}
      </Text>
    </View>
  );
}

// ── Timeline table header row ──────────────────────────────────────────────

function TimelineTableHeader() {
  return (
    <View style={s.tableHeader}>
      <Text style={[s.colTime, s.colHeaderText]}>时间 (UTC)</Text>
      <Text style={[s.colSource, s.colHeaderText]}>来源</Text>
      <Text style={[s.colCat, s.colHeaderText]}>分类</Text>
      <Text style={[s.colType, s.colHeaderText]}>事件类型</Text>
      <Text style={[s.colPayload, s.colHeaderText]}>Payload 摘要</Text>
      <Text style={[s.colHash, s.colHeaderText]}>payloadHash</Text>
    </View>
  );
}

// ── Main template ──────────────────────────────────────────────────────────

const ROWS_PER_PAGE = 50;

export function PdfForensicTemplate({ data }: { data: ForensicPdfData }) {
  // Chunk timeline into pages
  const pages: ForensicTimelineEntry[][] = [];
  for (let i = 0; i < data.entries.length; i += ROWS_PER_PAGE) {
    pages.push(data.entries.slice(i, i + ROWS_PER_PAGE));
  }

  return (
    <Document>
      {/* ── Cover page ── */}
      <Page size="A4" style={s.page}>
        <View style={s.coverBlock}>
          <Text style={s.logo}>QuanQn</Text>
          <Text style={s.logoSub}>IP 起号 · 内容创作 SaaS · 司法取证文件 · 严禁外传</Text>
          <Text style={s.title}>审计日志取证导出</Text>
          <Text style={s.subtitle}>Forensic Audit Export · 法务专用</Text>

          <View style={s.metaGrid}>
            {data.caseNumber && (
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>案件编号</Text>
                <Text style={s.metaValue}>{data.caseNumber}</Text>
              </View>
            )}
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>取证时间</Text>
              <Text style={s.metaValue}>{data.generatedAt.slice(0, 19).replace('T', ' ')} UTC</Text>
            </View>
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>取证人</Text>
              <Text style={s.metaValue}>{data.requesterEmail}</Text>
            </View>
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>角色</Text>
              <Text style={s.metaValue}>{data.requesterRole}</Text>
            </View>
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>取证原因</Text>
              <Text style={s.metaValue}>{data.reason}</Text>
            </View>
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>事件数量</Text>
              <Text style={s.metaValue}>{data.entries.length} 条</Text>
            </View>
          </View>

          <View style={s.traceBox}>
            <Text style={s.traceLabel}>Trace ID</Text>
            <Text style={s.traceValue}>{data.traceId}</Text>
          </View>

          {data.isEmpty && (
            <View style={s.emptyBadge}>
              <Text style={s.emptyBadgeText}>无匹配记录 · 本 trace 在所有日志表中未找到任何事件 (法务取证空记录)</Text>
            </View>
          )}
        </View>

        <PageFooter data={data} />
      </Page>

      {/* ── Timeline pages ── */}
      {pages.length === 0 ? (
        <Page size="A4" style={s.page}>
          <Text style={s.sectionTitle}>事件时间线</Text>
          <TimelineTableHeader />
          <View style={s.emptyRow}>
            <Text style={s.emptyRowText}>— 无事件记录 —</Text>
          </View>
          <PageFooter data={data} />
        </Page>
      ) : (
        pages.map((pageEntries, pageIdx) => (
          <Page key={pageIdx} size="A4" style={s.page}>
            <Text style={s.sectionTitle}>
              {`事件时间线${pages.length > 1 ? `（第 ${pageIdx + 1}/${pages.length} 页 · 共 ${data.entries.length} 条）` : `（共 ${data.entries.length} 条）`}`}
            </Text>
            <TimelineTableHeader />
            {pageEntries.map((entry, idx) => (
              <View
                key={idx}
                style={idx % 2 === 0 ? s.tableRow : s.tableRowAlt}
              >
                <Text style={s.colTime}>{entry.createdAt.slice(5, 19).replace('T', ' ')}</Text>
                <Text style={s.colSource}>{entry.source}</Text>
                <Text style={s.colCat}>{entry.eventCategory}</Text>
                <Text style={s.colType}>{entry.eventType}</Text>
                <Text style={s.colPayload}>{entry.payloadSummary}</Text>
                <Text style={s.colHash}>{entry.payloadHash.slice(0, 12)}…</Text>
              </View>
            ))}
            <PageFooter data={data} />
          </Page>
        ))
      )}

      {/* ── Signature page ── */}
      <Page size="A4" style={s.page}>
        <View style={s.signaturePage}>
          <View style={s.sigOuter}>
            <Text style={s.sigTitle}>法务签章页</Text>

            <View style={s.sigRow}>
              <Text style={s.sigLbl}>案件编号</Text>
              <Text style={s.sigVal}>{data.caseNumber ?? '—'}</Text>
            </View>
            <View style={s.sigRow}>
              <Text style={s.sigLbl}>Trace ID</Text>
              <Text style={s.sigVal}>{data.traceId}</Text>
            </View>
            <View style={s.sigRow}>
              <Text style={s.sigLbl}>取证时间</Text>
              <Text style={s.sigVal}>{data.generatedAt.slice(0, 19).replace('T', ' ')} UTC</Text>
            </View>
            <View style={s.sigRow}>
              <Text style={s.sigLbl}>取证人</Text>
              <Text style={s.sigVal}>{data.requesterEmail} ({data.requesterRole})</Text>
            </View>
            <View style={s.sigRow}>
              <Text style={s.sigLbl}>事件数量</Text>
              <Text style={s.sigVal}>{data.entries.length} 条</Text>
            </View>

            <View style={s.sigDivider}>
              <Text style={[s.sigLbl, { marginBottom: 4 }]}>取证人手签（待手签）</Text>
              <View style={s.sigPlaceholder}>
                <Text style={s.sigPlaceholderText}>手签区域 · 法务确认后签字</Text>
              </View>

              <Text style={[s.sigLbl, { marginBottom: 4, marginTop: 8 }]}>司法盖章（待盖章）</Text>
              <View style={s.sealPlaceholder}>
                <Text style={s.sealText}>{'司法\n盖章\n占位'}</Text>
              </View>
            </View>

            <View style={s.hashFullLine}>
              <Text style={[s.sigLbl, { marginBottom: 3 }]}>防篡改校验 (SHA-256 · 全文 hash)</Text>
              <Text style={s.hashFullText}>{data.contentHash}</Text>
            </View>
          </View>
        </View>

        <PageFooter data={data} />
      </Page>
    </Document>
  );
}
