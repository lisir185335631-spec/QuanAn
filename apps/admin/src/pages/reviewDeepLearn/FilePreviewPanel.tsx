interface FilePreviewPanelProps {
  fileMime: string;
  fileUrl: string;
  textPreview: string;
}

function parseSimpleCsv(text: string): string[][] {
  return text
    .split('\n')
    .filter((line) => line.trim())
    .slice(0, 21)
    .map((row) => row.split(',').map((cell) => cell.trim()));
}

const baseTextStyle: React.CSSProperties = {
  margin: 0,
  padding: '8px 10px',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  fontSize: 11,
  color: 'var(--text-muted)',
  overflowX: 'auto',
  overflowY: 'auto',
  maxHeight: 200,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
};

const fallbackBoxStyle: React.CSSProperties = {
  padding: '14px 16px',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  fontSize: 12,
  color: 'var(--text-muted)',
  textAlign: 'center',
};

export function FilePreviewPanel({ fileMime, textPreview }: FilePreviewPanelProps) {
  const mime = fileMime.toLowerCase();
  const isPdf = mime === 'application/pdf';
  const isWord =
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/msword';
  const isTxt = mime === 'text/plain' || mime === 'text/markdown' || mime === 'text/md';
  const isCsv = mime === 'text/csv' || mime === 'application/csv';

  if (isPdf) {
    return (
      <div style={fallbackBoxStyle}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>PDF 预览功能见 PRR</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
          S3 跨域限制 · 当前查看 metadata + autoScanResult
        </div>
      </div>
    );
  }

  if (isWord) {
    return (
      <div>
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 4,
            fontSize: 12,
            color: '#f59e0b',
            marginBottom: 8,
          }}
        >
          预览见 PRR · 当前显示解析 text
        </div>
        <pre style={baseTextStyle}>{textPreview || '（无解析内容）'}</pre>
      </div>
    );
  }

  if (isTxt) {
    return (
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
          [redact 脱敏显示]
        </div>
        <pre style={baseTextStyle}>{textPreview || '（无解析内容）'}</pre>
      </div>
    );
  }

  if (isCsv) {
    const rows = parseSimpleCsv(textPreview);
    const headers = rows[0] ?? [];
    const dataRows = rows.slice(1);
    const totalLines = textPreview.split('\n').filter((l) => l.trim()).length;
    const isLimited = totalLines > 21;

    if (rows.length === 0) {
      return <div style={fallbackBoxStyle}>（无 CSV 内容）</div>;
    }

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, color: 'var(--text)' }}>
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  style={{
                    textAlign: 'left',
                    padding: '5px 8px',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : 'var(--bg)' }}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid var(--border)',
                      maxWidth: 160,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {isLimited && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            …仅显示前 20 行
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={fallbackBoxStyle}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>📎</div>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>预览见 PRR</div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
        当前查看 metadata + autoScanResult（{fileMime || '未知类型'}）
      </div>
    </div>
  );
}
