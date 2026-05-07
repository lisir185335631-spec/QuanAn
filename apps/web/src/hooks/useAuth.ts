/**
 * useAuth — US-006
 * Reads auth state from tRPC auth.me (session cookie → API).
 * AC-9: login() probes /auth/login; shows toast on 500 instead of navigating.
 */

import { toast } from 'sonner';
import { trpc, type AuthMeOutput } from '@/lib/trpc';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export function useAuth() {
  const { data, isLoading, refetch } = trpc.auth.me.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
  }) as { data: AuthMeOutput | undefined; isLoading: boolean; refetch: () => void };

  const user = data?.ok ? data.user : null;

  async function login() {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, { redirect: 'manual' });
      // opaqueredirect (cross-origin 3xx) or 3xx = success path
      if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
        window.location.href = `${API_BASE}/auth/login`;
        return;
      }
      if (res.status >= 500) {
        toast.error('登录暂不可用，请稍后再试');
        return;
      }
      // Unexpected 2xx or 4xx — still navigate (server may redirect there)
      window.location.href = `${API_BASE}/auth/login`;
    } catch {
      toast.error('登录暂不可用，请稍后再试');
    }
  }

  function logout() {
    window.location.href = `${API_BASE}/auth/logout`;
  }

  return { user, isLoading, login, logout, refetch };
}
