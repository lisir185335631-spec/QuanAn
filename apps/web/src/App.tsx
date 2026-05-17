import { useEffect } from 'react';

import { Toaster } from 'sonner';

import { Header } from '@/components/Header';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { migrateLegacyLs } from '@/lib/migration/legacy-ls';

export function App() {
  const { account, isLoading } = useActiveAccount();

  useEffect(() => {
    if (isLoading || account === null) return;
    migrateLegacyLs(localStorage, account.id);
  }, [account?.id, isLoading]);

  return (
    <>
      <Toaster position="top-center" richColors />
      <Header />
      <main className="flex-1 container py-8">
        <h1 className="text-h1 font-display text-on-surface">QuanQn · 工程骨架就绪</h1>
        <p className="mt-2 text-body-md text-muted-foreground">P0 Foundation · PRD-1 US-005</p>
      </main>
    </>
  );
}
