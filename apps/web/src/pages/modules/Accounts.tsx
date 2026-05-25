/**
 * /accounts — 1:1 复刻 aiipznt.vip/accounts
 * mock-first · 1 demo account · 无 trpc · 新建 btn toast
 */
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { IpAccountCard } from '@/components/accounts/IpAccountCard';
import { Button } from '@/components/ui/button';
import {
  ACCOUNTS_CREATE_BTN,
  ACCOUNTS_H1,
  ACCOUNTS_MOCK,
  ACCOUNTS_SUBTITLE,
  ACCOUNTS_TOAST_CREATE,
} from '@/lib/constants/accounts';

export default function Accounts() {
  function handleCreate() {
    toast.info(ACCOUNTS_TOAST_CREATE);
  }

  return (
    <main className="max-w-6xl mx-auto py-8 space-y-8">
      {/* Header row */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-h1 font-display text-on-surface">{ACCOUNTS_H1}</h1>
          <p className="text-body-md text-muted-foreground mt-1">{ACCOUNTS_SUBTITLE}</p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleCreate}
          data-testid="create-account-trigger"
        >
          <Plus className="w-4 h-4 mr-1" />
          {ACCOUNTS_CREATE_BTN}
        </Button>
      </div>

      {/* Account list — 单列 stack */}
      <div className="space-y-4" data-testid="accounts-list">
        {ACCOUNTS_MOCK.map((account) => (
          <IpAccountCard key={account.id} account={account} />
        ))}
      </div>
    </main>
  );
}
