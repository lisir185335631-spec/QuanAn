// PRD-14 US-005 · ExperimentReportPdf
// AC-9: @react-pdf/renderer 4.5.1 · 4 节(实验信息 + 多维结果 + 时间线 + 签名)
// SHIELD: 复用 PRD-13 US-010 framework (import { Page, Text, View } from '@react-pdf/renderer')
// SHIELD: PDF 不支持 SVG · 时间线节用数据表格代替图表

import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

Font.registerHyphenationCallback((word) => [word]);

// ── Types ──────────────────────────────────────────────────────────────────

export interface VariantMetric {
  sampleSize: number;
  conversion: { rate: number; ciLow: number; ciHigh: number };
  retention: Array<{ day: number; rate: number }>;
  avgCost: number;
}

export interface ExperimentReportData {
  experimentKey: string;
  name: string;
  status: string;
  startedAt: Date | string | null;
  stoppedAt: Date | string | null;
  createdAt: Date | string;
  sampleSize: number;
  trafficAllocation: Record<string, number> | null;
  variants: Record<string, VariantMetric>;
  significanceResults: Array<{
    metric: string;
    pValue: number | null;
    isSignificant: boolean;
    effect: number | null;
    recommendation: string;
  }>;
  generatedBy: string;
}

// ── Styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: '#1a1a1a', padding: 40, backgroundColor: '#fff' },
  coverPage: { fontFamily: 'Helvetica', fontSize: 10, color: '#e0e0e0', padding: 60, backgroundColor: '#0a0a0a', justifyContent: 'center' },
  coverTitle: { fontSize: 26, fontFamily: 'Helvetica-Bold', color: '#d4af37', marginBottom: 10, letterSpacing: 1 },
  coverSub: { fontSize: 13, color: '#888', marginBottom: 32 },
  coverMeta: { fontSize: 9, color: '#666', marginBottom: 5 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#d4af37', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e5e5e5', paddingBottom: 3 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  kpiCard: { width: '22%', backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 4, padding: 8 },
  kpiLabel: { fontSize: 7, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  kpiValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#d4af37' },
  th: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#444' },
  td: { fontSize: 8, color: '#333' },
  tdMuted: { fontSize: 7, color: '#888' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f0f0f0', padding: '4px 6px', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#ddd' },
  tableRow: { flexDirection: 'row', padding: '3px 6px', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tableRowAlt: { flexDirection: 'row', padding: '3px 6px', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', backgroundColor: '#fafafa' },
  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: '#bbb' },
  stubBox: { backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#ddd', borderRadius: 4, padding: 16, alignItems: 'center', height: 80, marginBottom: 8 },
  stubText: { fontSize: 9, color: '#aaa', fontFamily: 'Helvetica-Oblique' },
  signaturePage: { fontFamily: 'Helvetica', fontSize: 9, color: '#1a1a1a', padding: 60 },
  signatureRow: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-end' },
  signatureLabel: { fontSize: 9, color: '#666', width: 100 },
  signatureLine: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#999', marginLeft: 8 },
});

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(d: Date | string | null): string {
  if (!d) return '—';
  return new Date(String(d)).toLocaleDateString('zh-CN');
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

const METRIC_LABELS: Record<string, string> = {
  conversion: '转化率',
  retention: '7日留存',
  cost: '平均成本',
};

const VARIANT_LABELS: Record<string, string> = {
  control: 'Control',
  variant_a: 'Variant A',
  variant_b: 'Variant B',
};

const REC_LABELS: Record<string, string> = {
  stop_winner: '升为胜出组',
  stop_loser: '停损',
  continue: '继续观察',
  inconclusive: '样本不足',
};

// ── PDF Document ───────────────────────────────────────────────────────────

export function ExperimentReportPdf({ data }: { data: ExperimentReportData }) {
  const month = new Date().toISOString().slice(0, 7);
  const variants = ['control', 'variant_a', 'variant_b'] as const;

  return (
    <Document
      title={`A/B 实验报告 · ${data.experimentKey} · ${month}`}
      author={data.generatedBy}
      subject="A/B 实验多维结果分析报告"
    >
      {/* 封面 */}
      <Page size="A4" style={s.coverPage}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={s.coverTitle}>QuanQn</Text>
          <Text style={s.coverSub}>A/B 实验报告</Text>
          <Text style={s.coverMeta}>实验 Key：{data.experimentKey}</Text>
          <Text style={s.coverMeta}>实验名称：{data.name}</Text>
          <Text style={s.coverMeta}>状态：{data.status}</Text>
          <Text style={s.coverMeta}>总 Sample：{data.sampleSize.toLocaleString()}</Text>
          <Text style={s.coverMeta}>生成人：{data.generatedBy}</Text>
          <Text style={s.coverMeta}>生成时间：{new Date().toLocaleString('zh-CN')}</Text>
        </View>
        <View style={s.footer}>
          <Text style={s.footerText}>QuanQn A/B 实验报告 · 内部文件</Text>
          <Text style={s.footerText}>{month}</Text>
        </View>
      </Page>

      {/* §1 实验信息 */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>§1 实验信息</Text>
        <View style={s.kpiGrid}>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>总 Sample</Text>
            <Text style={s.kpiValue}>{data.sampleSize.toLocaleString()}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>状态</Text>
            <Text style={[s.kpiValue, { fontSize: 12 }]}>{data.status}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>启动时间</Text>
            <Text style={[s.kpiValue, { fontSize: 10 }]}>{fmtDate(data.startedAt)}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>停止时间</Text>
            <Text style={[s.kpiValue, { fontSize: 10 }]}>{fmtDate(data.stoppedAt)}</Text>
          </View>
        </View>

        {/* Traffic allocation table */}
        {data.trafficAllocation && (
          <>
            <Text style={[s.sectionTitle, { marginTop: 12 }]}>流量分配</Text>
            <View style={s.tableHeader}>
              <Text style={[s.th, { width: '40%' }]}>Variant</Text>
              <Text style={[s.th, { width: '30%' }]}>流量占比</Text>
              <Text style={[s.th, { flex: 1 }]}>Sample Size</Text>
            </View>
            {variants.map((v, idx) => (
              <View key={v} style={idx % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.td, { width: '40%' }]}>{VARIANT_LABELS[v]}</Text>
                <Text style={[s.td, { width: '30%' }]}>
                  {data.trafficAllocation?.[v] != null ? `${String(data.trafficAllocation[v])}%` : '—'}
                </Text>
                <Text style={[s.td, { flex: 1 }]}>
                  {(data.variants[v]?.sampleSize ?? 0).toLocaleString()}
                </Text>
              </View>
            ))}
          </>
        )}

        <View style={s.footer}>
          <Text style={s.footerText}>QuanQn A/B 实验报告 · {data.experimentKey}</Text>
          <Text style={s.footerText}>§1 / 4</Text>
        </View>
      </Page>

      {/* §2 多维结果 */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>§2 多维指标结果</Text>

        {/* Conversion table */}
        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#555', marginBottom: 4 }}>
          转化率
        </Text>
        <View style={s.tableHeader}>
          <Text style={[s.th, { width: '25%' }]}>Variant</Text>
          <Text style={[s.th, { width: '20%' }]}>转化率</Text>
          <Text style={[s.th, { width: '20%' }]}>95% CI 下</Text>
          <Text style={[s.th, { width: '20%' }]}>95% CI 上</Text>
          <Text style={[s.th, { flex: 1 }]}>Sample</Text>
        </View>
        {variants.map((v, idx) => {
          const vm = data.variants[v];
          return (
            <View key={v} style={idx % 2 === 0 ? s.tableRow : s.tableRowAlt}>
              <Text style={[s.td, { width: '25%' }]}>{VARIANT_LABELS[v]}</Text>
              <Text style={[s.td, { width: '20%' }]}>{vm ? fmtPct(vm.conversion.rate) : '—'}</Text>
              <Text style={[s.tdMuted, { width: '20%' }]}>{vm ? fmtPct(vm.conversion.ciLow) : '—'}</Text>
              <Text style={[s.tdMuted, { width: '20%' }]}>{vm ? fmtPct(vm.conversion.ciHigh) : '—'}</Text>
              <Text style={[s.tdMuted, { flex: 1 }]}>{(vm?.sampleSize ?? 0).toLocaleString()}</Text>
            </View>
          );
        })}

        {/* Cost table */}
        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#555', marginTop: 12, marginBottom: 4 }}>
          平均 LLM 成本 (USD/用户)
        </Text>
        <View style={s.tableHeader}>
          <Text style={[s.th, { width: '40%' }]}>Variant</Text>
          <Text style={[s.th, { width: '35%' }]}>平均成本</Text>
          <Text style={[s.th, { flex: 1 }]}>Sample</Text>
        </View>
        {variants.map((v, idx) => {
          const vm = data.variants[v];
          return (
            <View key={v} style={idx % 2 === 0 ? s.tableRow : s.tableRowAlt}>
              <Text style={[s.td, { width: '40%' }]}>{VARIANT_LABELS[v]}</Text>
              <Text style={[s.td, { width: '35%' }]}>
                {vm ? `$${vm.avgCost.toFixed(4)}` : '—'}
              </Text>
              <Text style={[s.tdMuted, { flex: 1 }]}>{(vm?.sampleSize ?? 0).toLocaleString()}</Text>
            </View>
          );
        })}

        {/* Significance summary */}
        {data.significanceResults.length > 0 && (
          <>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#555', marginTop: 12, marginBottom: 4 }}>
              显著性检验结果
            </Text>
            <View style={s.tableHeader}>
              <Text style={[s.th, { width: '25%' }]}>指标</Text>
              <Text style={[s.th, { width: '20%' }]}>p-value</Text>
              <Text style={[s.th, { width: '20%' }]}>Effect</Text>
              <Text style={[s.th, { width: '15%' }]}>显著</Text>
              <Text style={[s.th, { flex: 1 }]}>推荐</Text>
            </View>
            {data.significanceResults.map((r, idx) => (
              <View key={r.metric} style={idx % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.td, { width: '25%' }]}>{METRIC_LABELS[r.metric] ?? r.metric}</Text>
                <Text style={[s.td, { width: '20%' }]}>
                  {r.pValue != null ? r.pValue.toFixed(4) : '—'}
                </Text>
                <Text style={[s.td, { width: '20%' }]}>
                  {r.effect != null ? `${(r.effect * 100).toFixed(1)}%` : '—'}
                </Text>
                <Text style={[s.td, { width: '15%' }]}>{r.isSignificant ? '是' : '否'}</Text>
                <Text style={[s.tdMuted, { flex: 1 }]}>{REC_LABELS[r.recommendation] ?? r.recommendation}</Text>
              </View>
            ))}
          </>
        )}

        <View style={s.footer}>
          <Text style={s.footerText}>QuanQn A/B 实验报告 · {data.experimentKey}</Text>
          <Text style={s.footerText}>§2 / 4</Text>
        </View>
      </Page>

      {/* §3 时间线 (stub — PDF 不支持 SVG 图表) */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>§3 实验时间线</Text>
        <View style={s.stubBox}>
          <Text style={s.stubText}>[累积 Sample 时间线图] — PDF 渲染暂用占位符</Text>
          <Text style={s.stubText}>后端 puppeteer 生成 PNG 留 PRR</Text>
        </View>
        <Text style={[s.tdMuted, { marginTop: 8 }]}>
          实验期间各 variant 累积 sample size 趋势图，详见 admin 面板交互图表。
        </Text>

        {/* 7-day retention table */}
        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#555', marginTop: 16, marginBottom: 4 }}>
          7 日留存率 (control vs variants)
        </Text>
        <View style={s.tableHeader}>
          <Text style={[s.th, { width: '15%' }]}>Day</Text>
          {variants.map((v) => (
            <Text key={v} style={[s.th, { flex: 1 }]}>{VARIANT_LABELS[v]}</Text>
          ))}
        </View>
        {[1, 2, 3, 4, 5, 6, 7].map((day, idx) => (
          <View key={day} style={idx % 2 === 0 ? s.tableRow : s.tableRowAlt}>
            <Text style={[s.tdMuted, { width: '15%' }]}>Day {day}</Text>
            {variants.map((v) => {
              const vm = data.variants[v];
              const retItem = vm?.retention.find((r) => r.day === day);
              return (
                <Text key={v} style={[s.td, { flex: 1 }]}>
                  {retItem != null ? fmtPct(retItem.rate) : '—'}
                </Text>
              );
            })}
          </View>
        ))}

        <View style={s.footer}>
          <Text style={s.footerText}>QuanQn A/B 实验报告 · {data.experimentKey}</Text>
          <Text style={s.footerText}>§3 / 4</Text>
        </View>
      </Page>

      {/* §4 签名 */}
      <Page size="A4" style={s.signaturePage}>
        <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', marginBottom: 30, color: '#333' }}>
          签名确认
        </Text>
        {[
          { label: '实验负责人', hint: '签名 / 日期' },
          { label: '产品 Owner', hint: '签名 / 日期' },
          { label: 'Super Admin', hint: '系统确认' },
        ].map((row) => (
          <View key={row.label} style={s.signatureRow}>
            <Text style={s.signatureLabel}>{row.label}</Text>
            <View style={s.signatureLine} />
            <Text style={[s.tdMuted, { marginLeft: 8, width: 60 }]}>{row.hint}</Text>
          </View>
        ))}
        <Text style={[s.tdMuted, { marginTop: 40 }]}>
          报告编号：ab-{data.experimentKey}-{month}
        </Text>
        <Text style={[s.tdMuted, { marginTop: 6 }]}>
          本报告由 QuanQn 系统自动生成，数据截至 {new Date().toLocaleString('zh-CN')}。
        </Text>
      </Page>
    </Document>
  );
}
