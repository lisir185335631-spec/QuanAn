/**
 * useActiveAccount — PRD-2 US-002
 *
 * AC-2: returns current active IpAccount; switchTo() clears old LS namespace
 *       and updates activeAccountId server-side.
 * AC-6: after switch, old namespace keys are removed from localStorage.
 * AC-7: React state is per-tab by nature — each tab has independent activeAccountId.
 */

import { useCallback } from 'react';

import { clearLsNamespace } from '@/lib/ls-namespace';
import { trpc } from '@/lib/trpc';

import type { ActiveAccountOutput } from '@quanqn/clients/router-types';

export type { ActiveAccountOutput };

export function useActiveAccount() {
  const {
    data: account,
    refetch,
    isLoading,
  } = trpc.account.getActive.useQuery(undefined, {
    staleTime: 30_000,
    retry: false,
  });

  const switchActiveMutation = trpc.account.switchActive.useMutation();

  const switchTo = useCallback(
    (newAccountId: number): void => {
      const oldAccountId = (account as ActiveAccountOutput)?.id ?? null;

      switchActiveMutation.mutate(
        { accountId: newAccountId },
        {
          onSuccess() {
            // AC-6: clear old namespace from LS — must be 0 hits for old prefix
            if (oldAccountId !== null && oldAccountId !== newAccountId) {
              clearLsNamespace(localStorage, oldAccountId);
            }
            void refetch();
          },
        },
      );
    },
    [account, switchActiveMutation, refetch],
  );

  return {
    account: account ?? null,
    switchTo,
    isSwitching: switchActiveMutation.isPending,
    isLoading,
  };
}
