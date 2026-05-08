/**
 * useStepData — PRD-2 US-002 · ADR-010 LS↔DB dual-write
 *
 * AC-1: save() writes to LS first (aiip_memory_acc_{accountId}_{stepKey}),
 *       then fires a tRPC mutation. LS is NOT rolled back on DB failure.
 * AC-5: DB write failure shows toast "已保存到本地 · 网络恢复后同步".
 * AC-8: prunes non-active namespaces when LS exceeds 5 MB.
 */

import { useCallback } from 'react';
import { toast } from 'sonner';

import { trpc } from '@/lib/trpc';
import { stepLsKey, pruneLsNamespaces } from '@/lib/ls-namespace';

export function useStepData(accountId: number | null, stepKey: string) {
  const saveStepData = trpc.step.saveStepData.useMutation();

  const save = useCallback(
    (inputs: Record<string, unknown>): void => {
      if (accountId == null) return;

      // AC-1: LS write first — fast, synchronous, never rolled back
      try {
        localStorage.setItem(stepLsKey(accountId, stepKey), JSON.stringify(inputs));
      } catch {
        // AC-5 (LS full): non-silent, toast then still attempt DB write
        toast.error('本地存储已满，数据将仅保存到服务器');
      }

      // AC-8: prune non-active namespaces when close to limit
      pruneLsNamespaces(localStorage, accountId);

      // DB write: fire-and-forget, no LS rollback on failure
      saveStepData.mutate(
        { stepKey, inputs },
        {
          onError() {
            // AC-5: DB failure toast (must not be silent — REJ-035)
            toast.error('已保存到本地 · 网络恢复后同步');
          },
        },
      );
    },
    [accountId, stepKey, saveStepData],
  );

  const load = useCallback((): Record<string, unknown> | null => {
    if (accountId == null) return null;
    const raw = localStorage.getItem(stepLsKey(accountId, stepKey));
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  }, [accountId, stepKey]);

  return { save, load, isSaving: saveStepData.isPending };
}
