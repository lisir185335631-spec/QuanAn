import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';

import { Header } from '@/components/Header';

function PageSkeleton() {
  return (
    <div className="flex-1 container py-8 data-grid-bg">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-surface-variant rounded w-1/3" />
        <div className="h-4 bg-surface-variant rounded w-2/3" />
        <div className="h-4 bg-surface-variant rounded w-1/2" />
      </div>
    </div>
  );
}

export function RootLayout() {
  return (
    <>
      <Toaster position="bottom-right" duration={4000} richColors />
      <Header />
      <main className="flex-1 data-grid-bg">
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
    </>
  );
}
