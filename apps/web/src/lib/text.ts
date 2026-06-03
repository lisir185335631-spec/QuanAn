/**
 * 按句末标点(。！？)逐句换行 · 让长段文字在 textarea 里一句一行显示,不挤成一坨。
 * 已有的换行/空白会被规整;无句末标点的段落原样保留(只 trim 首尾)。
 */
export function breakSentences(text: string): string {
  return text
    .split(/(?<=[。！？])/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n');
}
