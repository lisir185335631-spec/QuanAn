import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';

// Aurelian Dark fonts — three weight subsets per typography scale
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import './styles/globals.css';
import './styles/aiipznt-motion.css';
// ikb-hero.css 提供全站工具类(ikb-focusring / ikb-pulse / ikb-gradtext / ikb-accent / ikb-input)·
// 仍被 sheet / diagnosis / Step1 / VideoProduction / History 等 ~30 处使用。全局加载一次以避免工具类失样;
// 这些工具类向 lg-* 的全面迁移属更大范围清理(待后续单独处理)。
import './styles/ikb-hero.css';
import { C, F } from './components/home-next/ikb/system';
import { trpc, trpcClient, queryClient } from './lib/trpc';
import { router } from './router';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root element not found');
createRoot(rootEl).render(
  <StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        {/* 全局 toast 提示 · 液态玻璃样式(玻璃面 / 白半透边 / 深投影 / 得意黑标题) */}
        <Toaster
          position="top-center"
          gap={10}
          toastOptions={{
            style: {
              background: C.paper,
              color: C.ink,
              border: `1px solid ${C.line}`,
              borderRadius: 0,
              boxShadow: '8px 8px 0 rgba(43,83,230,0.10)',
              fontFamily: F.cn,
              fontSize: 14,
            },
          }}
        />
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>,
);
