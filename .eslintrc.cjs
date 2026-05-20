/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'jsx-a11y', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  settings: {
    react: { version: '18' },
    'import/resolver': {
      typescript: { project: './tsconfig.json' },
      node: true,
    },
  },
  rules: {
    // === LD-013 类型严格 ===
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/no-floating-promises': 'error',

    // === §6.8 import 顺序 5 段 ===
    'import/order': ['error', {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
      'newlines-between': 'always',
      alphabetize: { order: 'asc', caseInsensitive: true },
      pathGroups: [{ pattern: '@/**', group: 'internal', position: 'before' }],
    }],
    'import/no-duplicates': 'error',
    'import/no-cycle': 'error',
    '@typescript-eslint/no-misused-promises': 'error',

    // === §6.9 console 禁用 ===
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',

    // === React ===
    'react/react-in-jsx-scope': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/prop-types': 'off',

    // === a11y ===
    'jsx-a11y/click-events-have-key-events': 'warn',

    // === 风格 ===
    eqeqeq: ['error', 'always'],
    'prefer-const': 'error',
    'no-var': 'error',
  },
  overrides: [
    {
      files: ['tests/**/*.ts', '**/*.test.ts', '**/*.spec.ts', '**/*.test.tsx', '**/*.spec.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        'no-console': 'off',
        // PRD-25 prep cleanup(2026-05-21): vitest prisma mock pattern 用 vi.fn() reference · unbound-method false positive
        '@typescript-eslint/unbound-method': 'off',
        // vitest async mock factory 标记 async 但内部不 await · 标准 vitest 用法
        '@typescript-eslint/require-await': 'off',
      },
    },
    {
      files: ['scripts/**/*.ts'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
  ignorePatterns: ['dist', 'node_modules', '.next', 'build', 'apps/web/e2e/**', 'apps/web/playwright.config.ts', 'apps/web/scripts/**'],
};
