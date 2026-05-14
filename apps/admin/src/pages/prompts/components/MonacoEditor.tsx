// PRD-13 US-007 · MonacoEditor wrapper
// SHIELD: lazy import (admin SPA · avoids 'window is not defined' in SSR contexts)
// SHIELD: DiffEditor uses @monaco-editor/react DiffEditor component
import { lazy, Suspense } from 'react';

import type { EditorProps, DiffEditorProps } from '@monaco-editor/react';

// ── Lazy imports ────────────────────────────────────────────────────────────

const Editor = lazy(() => import('@monaco-editor/react').then((m) => ({ default: m.default })));
const DiffEditorComponent = lazy(() =>
  import('@monaco-editor/react').then((m) => ({ default: m.DiffEditor })),
);

// ── Aurelian Dark theme definition ──────────────────────────────────────────

const AURELIAN_THEME = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6b7280' },
    { token: 'keyword', foreground: 'd4af37' },
    { token: 'string', foreground: '86efac' },
    { token: 'variable', foreground: 'c4b5fd' },
  ],
  colors: {
    'editor.background': '#0f1117',
    'editor.foreground': '#e5e7eb',
    'editorLineNumber.foreground': '#4b5563',
    'editor.lineHighlightBackground': '#1f2937',
    'editorCursor.foreground': '#d4af37',
    'editor.selectionBackground': '#374151',
    'editorIndentGuide.background': '#1f2937',
  },
};

// ── MonacoEditor ─────────────────────────────────────────────────────────────

interface MonacoEditorProps {
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  height?: string;
}

function Spinner() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--text-muted)',
        fontSize: 13,
      }}
    >
      加载编辑器…
    </div>
  );
}

function beforeMount(monaco: Parameters<NonNullable<EditorProps['beforeMount']>>[0]) {
  monaco.editor.defineTheme('aurelian-dark', AURELIAN_THEME);
}

export function MonacoEditor({ value, onChange, readOnly = false, height = '100%' }: MonacoEditorProps) {
  return (
    <Suspense fallback={<Spinner />}>
      <Editor
        height={height}
        language="handlebars"
        theme="aurelian-dark"
        value={value}
        options={{ readOnly, minimap: { enabled: false }, wordWrap: 'on', fontSize: 13 }}
        beforeMount={beforeMount}
        onChange={(v) => !readOnly && onChange && onChange(v ?? '')}
      />
    </Suspense>
  );
}

// ── DiffMonacoEditor ─────────────────────────────────────────────────────────

interface DiffMonacoEditorProps {
  original: string;
  modified: string;
  height?: string;
}

function beforeMountDiff(monaco: Parameters<NonNullable<DiffEditorProps['beforeMount']>>[0]) {
  monaco.editor.defineTheme('aurelian-dark', AURELIAN_THEME);
}

export function DiffMonacoEditor({ original, modified, height = '100%' }: DiffMonacoEditorProps) {
  return (
    <Suspense fallback={<Spinner />}>
      <DiffEditorComponent
        height={height}
        language="handlebars"
        theme="aurelian-dark"
        original={original}
        modified={modified}
        options={{ readOnly: true, minimap: { enabled: false }, wordWrap: 'on', fontSize: 13 }}
        beforeMount={beforeMountDiff}
      />
    </Suspense>
  );
}
