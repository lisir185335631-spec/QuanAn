/**
 * useActiveAccount — PRD-3 US-004
 *
 * AC-3: switch → clearLsNamespace(old) → window.location.reload()
 * AC-4: idempotent — clicking the already-active account is a no-op
 * AC-5: on switchActive failure → sonner toast '切换失败 · 请重试', no reload
 */

import { useCallback } from 'react';
import { toast } from 'sonner';

import { clearLsNamespace } from '@/lib/ls-namespace';
import { trpc } from '@/lib/trpc';

import type { ActiveAccountOutput } from '@quanan/clients/router-types';

export type { ActiveAccountOutput };

export function useActiveAccount() {
  const {
    data: account,
    isLoading,
  } = trpc.ipAccounts.active.useQuery(undefined, {
    staleTime: 30_000,
    retry: false,
  });

  const switchActiveMutation = trpc.ipAccounts.switchActive.useMutation();

  const switchTo = useCallback(
    (newAccountId: number): void => {
      const currentAccountId = (account as ActiveAccountOutput)?.id ?? null;

      // AC-4: idempotent — same account, skip
      if (currentAccountId !== null && currentAccountId === newAccountId) {
        return;
      }

      switchActiveMutation.mutate(
        { accountId: newAccountId },
        {
          onSuccess() {
            // AC-9: persist active account id for demo/tooling reads
            localStorage.setItem('aiip_active_account_id', String(newAccountId));
            // AC-3: clear old LS namespace then full reload — new account state served fresh
            if (currentAccountId !== null) {
              clearLsNamespace(localStorage, currentAccountId);
            }
            window.location.reload();
          },
          onError() {
            // AC-5: toast on failure, no reload
            toast.error('切换失败 · 请重试');
          },
        },
      );
    },
    [account, switchActiveMutation],
  );

  return {
    account: account ?? null,
    switchTo,
    isSwitching: switchActiveMutation.isPending,
    isLoading,
  };
}
