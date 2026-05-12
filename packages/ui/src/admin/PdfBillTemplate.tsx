// PRD-11 US-014 · PDF Bill Template — server-side only (@react-pdf/renderer)
// Used by apps/api/src/services/admin/cost/pdf-bill.service.ts
// DO NOT import this in browser bundles (@quanqn/ui/admin/pdf export path is server-only)

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

// ── Types ──────────────────────────────────────────────────────────────────

export interface PdfBillLineItem {
  label: string;
  totalCost: string;
  callCount: number;
  dimension?: string;
}

export interface PdfBillData {
  month: string; // e.g. "2026-05"
  generatedAt: string; // ISO string
  actorEmail: string;
  actorRole: string;
  actorId: number;
  totalCost: string; // USD string
  yoyPercent: string | null; // e.g. "+12.5%" or null
  items: PdfBillLineItem[];
  payloadHash: string; // SHA-256 hex (redacted fields already removed)
  isEmpty: boolean;
}

// ── Styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    color: '#111',
    backgroundColor: '#fff',
  },
  headerBlock: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 12,
  },
  logo: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  logoSub: {
    fontSize: 9,
    color: '#888',
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginTop: 10,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 9,
    color: '#555',
  },
  summaryRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 24,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 8,
    minWidth: 120,
  },
  summaryLabel: {
    fontSize: 8,
    color: '#888',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
  },
  summaryChange: {
    fontSize: 8,
    color: '#555',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginTop: 16,
    marginBottom: 6,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: '#fafafa',
  },
  colLabel: { flex: 3, fontSize: 8 },
  colCost: { flex: 2, fontSize: 8, textAlign: 'right' },
  colCount: { flex: 1, fontSize: 8, textAlign: 'right' },
  colHeaderText: { fontFamily: 'Helvetica-Bold', fontSize: 8 },
  emptyMsg: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
  },
  signaturePage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sigBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 24,
    width: 320,
    alignItems: 'center',
  },
  sigTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 16,
  },
  sigField: {
    flexDirection: 'row',
    marginBottom: 8,
    width: '100%',
  },
  sigFieldLabel: {
    fontSize: 8,
    color: '#888',
    width: 80,
  },
  sigFieldValue: {
    fontSize: 8,
    color: '#111',
    flex: 1,
  },
  sigLine: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  sigLineText: {
    fontSize: 8,
    color: '#888',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 4,
  },
  footerLeft: {
    fontSize: 7,
    color: '#888',
    flex: 2,
  },
  footerCenter: {
    fontSize: 7,
    color: '#888',
    flex: 1,
    textAlign: 'center',
  },
  footerRight: {
    fontSize: 7,
    color: '#888',
    flex: 2,
    textAlign: 'right',
  },
});

// ── Footer component (fixed, renders on every page) ────────────────────────

interface PageFooterProps {
  data: PdfBillData;
}

function PageFooter({ data }: PageFooterProps) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerLeft} render={({ pageNumber, totalPages }) =>
        `Page ${pageNumber}/${totalPages} · Generated: ${data.generatedAt.slice(0, 19).replace('T', ' ')} UTC`
      } />
      <Text style={s.footerCenter}>
        {`Actor: ${data.actorEmail} (ID:${data.actorId})`}
      </Text>
      <Text style={s.footerRight}>
        {`Content-Hash: SHA-256 = ${data.payloadHash.slice(0, 16)}…`}
      </Text>
    </View>
  );
}

// ── Main template ──────────────────────────────────────────────────────────

export function PdfBillTemplate({ data }: { data: PdfBillData }) {
  const ROWS_PER_PAGE = 50;
  const pages: PdfBillLineItem[][] = [];
  for (let i = 0; i < data.items.length; i += ROWS_PER_PAGE) {
    pages.push(data.items.slice(i, i + ROWS_PER_PAGE));
  }
  const hasItems = pages.length > 0;

  return (
    <Document>
      {/* ── Page 1: Header + Summary + First chunk ── */}
      <Page size="A4" style={s.page}>
        {/* Logo / company header */}
        <View style={s.headerBlock}>
          <Text style={s.logo}>QuanQn</Text>
          <Text style={s.logoSub}>IP 起号 · 内容创作 SaaS · Admin 内部使用</Text>
          <Text style={s.title}>月度成本账单 · {data.month}</Text>
          <Text style={s.subtitle}>系统生成 · 仅供内部财务核对</Text>

          {/* Summary cards */}
          <View style={s.summaryRow}>
            <View style={s.summaryCard}>
              <Text style={s.summaryLabel}>月度总成本 (USD)</Text>
              <Text style={s.summaryValue}>$ {parseFloat(data.totalCost).toFixed(2)}</Text>
            </View>
            {data.yoyPercent !== null && (
              <View style={s.summaryCard}>
                <Text style={s.summaryLabel}>同比 YoY</Text>
                <Text style={s.summaryChange}>{data.yoyPercent}</Text>
              </View>
            )}
            <View style={s.summaryCard}>
              <Text style={s.summaryLabel}>分项行数</Text>
              <Text style={s.summaryValue}>{data.items.length}</Text>
            </View>
          </View>
        </View>

        {/* Empty bill message */}
        {data.isEmpty && (
          <Text style={s.emptyMsg}>本月无成本记录</Text>
        )}

        {/* First page of items */}
        {hasItems && (
          <>
            <Text style={s.sectionTitle}>成本分项明细</Text>

            {/* Table header */}
            <View style={s.tableHeader}>
              <Text style={[s.colLabel, s.colHeaderText]}>项目 / 维度</Text>
              <Text style={[s.colCost, s.colHeaderText]}>成本 (USD)</Text>
              <Text style={[s.colCount, s.colHeaderText]}>调用次数</Text>
            </View>

            {/* First page rows */}
            {pages[0]!.map((item, idx) => (
              <View key={idx} style={idx % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={s.colLabel}>{item.label}</Text>
                <Text style={s.colCost}>$ {parseFloat(item.totalCost).toFixed(4)}</Text>
                <Text style={s.colCount}>{item.callCount.toLocaleString()}</Text>
              </View>
            ))}
          </>
        )}

        <PageFooter data={data} />
      </Page>

      {/* ── Continuation pages for large datasets ── */}
      {pages.slice(1).map((pageItems, pageIdx) => (
        <Page key={pageIdx + 1} size="A4" style={s.page}>
          <Text style={s.sectionTitle}>成本分项明细（续 {pageIdx + 2}）</Text>

          <View style={s.tableHeader}>
            <Text style={[s.colLabel, s.colHeaderText]}>项目 / 维度</Text>
            <Text style={[s.colCost, s.colHeaderText]}>成本 (USD)</Text>
            <Text style={[s.colCount, s.colHeaderText]}>调用次数</Text>
          </View>

          {pageItems.map((item, idx) => (
            <View key={idx} style={idx % 2 === 0 ? s.tableRow : s.tableRowAlt}>
              <Text style={s.colLabel}>{item.label}</Text>
              <Text style={s.colCost}>$ {parseFloat(item.totalCost).toFixed(4)}</Text>
              <Text style={s.colCount}>{item.callCount.toLocaleString()}</Text>
            </View>
          ))}

          <PageFooter data={data} />
        </Page>
      ))}

      {/* ── Signature page (always last) ── */}
      <Page size="A4" style={s.page}>
        <View style={s.signaturePage}>
          <View style={s.sigBox}>
            <Text style={s.sigTitle}>账单确认签章页</Text>

            <View style={s.sigField}>
              <Text style={s.sigFieldLabel}>月份</Text>
              <Text style={s.sigFieldValue}>{data.month}</Text>
            </View>
            <View style={s.sigField}>
              <Text style={s.sigFieldLabel}>总成本</Text>
              <Text style={s.sigFieldValue}>USD $ {parseFloat(data.totalCost).toFixed(4)}</Text>
            </View>
            <View style={s.sigField}>
              <Text style={s.sigFieldLabel}>生成人</Text>
              <Text style={s.sigFieldValue}>{data.actorEmail} ({data.actorRole})</Text>
            </View>
            <View style={s.sigField}>
              <Text style={s.sigFieldLabel}>生成时间</Text>
              <Text style={s.sigFieldValue}>{data.generatedAt.slice(0, 19).replace('T', ' ')} UTC</Text>
            </View>
            <View style={s.sigField}>
              <Text style={s.sigFieldLabel}>防篡改校验</Text>
              <Text style={s.sigFieldValue}>SHA-256</Text>
            </View>
            <View style={s.sigField}>
              <Text style={s.sigFieldLabel}>Hash (前16位)</Text>
              <Text style={s.sigFieldValue}>{data.payloadHash.slice(0, 16)}…</Text>
            </View>

            <View style={s.sigLine}>
              <Text style={s.sigLineText}>完整 Hash: {data.payloadHash}</Text>
            </View>
          </View>
        </View>

        <PageFooter data={data} />
      </Page>
    </Document>
  );
}
