import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';

export default function Accounts() {
  const { data, isLoading } = trpc.ipAccounts.list.useQuery();

  return (
    <main className="flex-1 container py-8">
      <h1 className="text-h1 font-display text-on-surface mb-6">IP 账号</h1>
      {isLoading ? (
        <p className="text-body-md text-muted-foreground">加载中…</p>
      ) : data && data.length > 0 ? (
        <div className="space-y-4 max-w-2xl">
          {data.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <span className="text-label-sm font-label text-primary uppercase tracking-wide">
                  {account.platform}
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-body-md text-on-surface font-medium">{account.name}</p>
                <p className="text-body-sm text-muted-foreground mt-1">{account.industry} · {account.stage}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="max-w-2xl">
          <CardContent className="pt-6">
            <p className="text-body-md text-muted-foreground">暂无 IP 账号 · 请先完成 Step 1 创建</p>
            <p className="mt-4 text-body-sm text-on-surface-variant">实施 PRD-5</p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
