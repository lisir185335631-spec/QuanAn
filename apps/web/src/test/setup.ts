import '@testing-library/jest-dom';
import { vi } from 'vitest';

/**
 * 全局 mock — 所有页面外壳(IKBLayout)的顶栏 / 账号切换器
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

/**
 * jsdom 不实现 IntersectionObserver / ResizeObserver / matchMedia。
 * 首页 IKB sections 用 framer-motion 的 whileInView(依赖 IntersectionObserver),
 * ikb-hero.css 的动效有 prefers-reduced-motion 守卫(依赖 matchMedia)。
 * 缺失会在 render 即抛 "IntersectionObserver is not defined" 整页崩。统一兜底。
 */
class IntersectionObserverStub {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}
vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub);

vi.stubGlobal('matchMedia', (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));
