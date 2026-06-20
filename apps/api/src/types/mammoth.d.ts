/** Minimal ambient types for mammoth v1 (no @types/mammoth on npm) */
declare module 'mammoth' {
  export interface ConversionResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }

  export interface Input {
    buffer?: Buffer | Uint8Array;
    path?: string;
    arrayBuffer?: ArrayBuffer;
  }

  export function extractRawText(input: Input): Promise<ConversionResult>;
  export function convertToHtml(input: Input): Promise<ConversionResult>;
}
