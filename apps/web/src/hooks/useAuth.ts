/**
 * useAuth — US-006
 * Reads auth state from tRPC auth.me (session cookie → API).
 */

import { trpc, type AuthMeOutput } from '@/lib/trpc';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export function useAuth() {
  const { data, isLoading, refetch } = trpc.auth.me.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
  }) as { data: AuthMeOutput | undefined; isLoading: boolean; refetch: () => void };

  const user = data?.ok ? data.user : null;

  function login() {
    window.location.href = `${API_BASE}/auth/login`;
  }

  function logout() {
    window.location.href = `${API_BASE}/auth/logout`;
  }

  return { user, isLoading, login, logout, refetch };
}
