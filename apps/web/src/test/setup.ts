import '@testing-library/jest-dom';
import { vi } from 'vitest';

/**
 * 全局 mock — 先锋白迁移后所有页面都套 PioneerLayout,其 HeaderRight/AccountSwitcherPw
 * 依赖 useAuth / useActiveAccount / trpc.ipAccounts.list。测试若无 provider 会在 render 即崩。
 * 这里统一兜底,让任意页面测试都能渲染外壳;需要特定行为的测试在自己文件里 vi.mock 覆盖即可。
 */
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, login: vi.fn(), logout: vi.fn() }),
}));

vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: () => ({
    account: { id: 1, name: '测试账号', platform: 'douyin' },
    switchTo: vi.fn(),
    accounts: [],
  }),
}));

vi.mock('@/lib/trpc', () => {
  const query = () => ({
    data: undefined,
    isLoading: false,
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  });
  const mutation = () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    data: undefined,
  });
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (prop === 'useQuery') return query;
      if (prop === 'useMutation') return mutation;
      return new Proxy({}, handler);
    },
  };
  return { trpc: new Proxy({}, handler) };
});
