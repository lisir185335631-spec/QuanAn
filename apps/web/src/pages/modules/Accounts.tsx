/**
 * /accounts — PRD-23 US-002 AC-1/5
 * IP 账号管理页 · 账号 grid + 新建账号 modal
 * H1 字面锁 'IP 账号管理' · D-227 AC-1
 */
import { CreateAccountModal } from '@/components/accounts/CreateAccountModal';
import { IpAccountCard } from '@/components/accounts/IpAccountCard';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { trpc } from '@/lib/trpc';

const PAGE_TITLE = 'IP 账号管理' as const;
const PAGE_SUBTITLE = '管理多个 IP 账号，每个账号独立配置行业、定位和人设' as const;

export default function Accounts() {
  const { data: accounts = [], isLoading } = trpc.ipAccounts.list.useQuery();
  const { account: activeAccount, switchTo } = useActiveAccount();

  return (
    <main className="flex-1 container py-8">
      {/* Header row — AC-1 */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-h1 font-display text-on-surface">{PAGE_TITLE}</h1>
          <p className="text-body-md text-muted-foreground mt-1">{PAGE_SUBTITLE}</p>
        </div>
        {/* 新建账号 button — AC-3/5 · 顶部右侧 */}
        <CreateAccountModal />
      </div>

      {isLoading ? (
        <p className="text-body-md text-muted-foreground">加载中…</p>
      ) : accounts.length > 0 ? (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="accounts-grid"
        >
          {accounts.map((account) => (
            <IpAccountCard
              key={account.id}
              account={account}
              isActive={account.id === (activeAccount as { id: number } | null)?.id}
              onActivate={() => switchTo(account.id)}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          ))}
        </div>
      ) : (
        <p
          className="text-body-md text-muted-foreground"
          data-testid="accounts-empty"
        >
          暂无 IP 账号 · 点击"新建账号"开始
        </p>
      )}
    </main>
  );
}
