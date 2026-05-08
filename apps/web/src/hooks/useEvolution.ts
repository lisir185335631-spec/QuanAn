/**
 * useEvolution — PRD-2 US-002
 *
 * AC-3: fetches evolution_profile via tRPC; caches result to LS
 *       under aiip_memory_acc_{accountId}_evolution for instant subsequent reads.
 *       Returns LS-cached value immediately while DB fetch is in flight.
 */

import { useEffect, useMemo } from 'react';

import { evolutionLsKey } from '@/lib/ls-namespace';
import { trpc } from '@/lib/trpc';

import type { EvolutionProfileOutput } from '@quanqn/clients/router-types';

export type { EvolutionProfileOutput };

export function useEvolution(accountId: number | null): EvolutionProfileOutput {
  const { data } = trpc.evolution.getProfile.useQuery(undefined, {
    enabled: accountId !== null,
    staleTime: 60_000,
    retry: false,
  });

  // AC-3: cache fresh DB data to LS (non-blocking, silent on failure)
  useEffect(() => {
    if (accountId === null || data === undefined) return;
    try {
      localStorage.setItem(evolutionLsKey(accountId), JSON.stringify(data));
    } catch {
      // silent — LS write failure does not affect functionality
    }
  }, [accountId, data]);

  // LS cache: instant read on mount before DB response arrives (AC-9 LS read < 1ms)
  const lsCached = useMemo<EvolutionProfileOutput>(() => {
    if (accountId === null) return null;
    const raw = localStorage.getItem(evolutionLsKey(accountId));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as EvolutionProfileOutput;
    } catch {
      return null;
    }
  }, [accountId]);

  // DB data takes precedence; fall back to LS cache while loading
  return data !== undefined ? data : lsCached;
}
