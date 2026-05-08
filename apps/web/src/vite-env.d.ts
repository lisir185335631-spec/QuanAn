/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// @fontsource packages are CSS-only — imported as side effects for font loading
declare module '@fontsource/manrope';
declare module '@fontsource/manrope/*';
declare module '@fontsource/plus-jakarta-sans';
declare module '@fontsource/plus-jakarta-sans/*';
declare module '@fontsource/inter';
declare module '@fontsource/inter/*';
