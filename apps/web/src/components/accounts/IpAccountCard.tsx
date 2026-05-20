/**
 * IpAccountCard — PRD-23 US-002 AC-2
 * 展示单个 IP 账号卡片 · 含 ACTIVE 标 + 圆形首字符头像 + 字段 + 操作按钮
 */
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import type { IpAccountListOutput } from '@quanan/clients/router-types';

export type IpAccount = IpAccountListOutput[number];

export interface IpAccountCardProps {
  account: IpAccount;
  isActive: boolean;
  onActivate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function IpAccountCard({
  account,
  isActive,
  onActivate,
  onEdit,
  onDelete,
}: IpAccountCardProps) {
  function handleStubEdit(e: React.MouseEvent) {
    e.stopPropagation();
    onEdit();
    toast.info('功能 PRD-25+');
  }

  function handleStubDelete(e: React.MouseEvent) {
    e.stopPropagation();
    onDelete();
    toast.info('功能 PRD-25+');
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      onClick={onActivate}
      onKeyDown={(e) => e.key === 'Enter' && onActivate()}
      className="relative rounded-xl border border-border bg-card p-5 cursor-pointer hover:border-primary/40 transition-all"
      data-testid={`ip-account-card-${account.id}`}
    >
      {/* ACTIVE chip — AC-2 */}
      {isActive && (
        <span
          className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full"
          data-testid={`ip-account-active-chip-${account.id}`}
        >
          ACTIVE
        </span>
      )}

      <div className="flex items-start gap-4">
        {/* 圆形头像首字符 d-12 = h-12 w-12 — AC-2 */}
        <div
          className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-primary font-semibold text-lg select-none"
          data-testid={`ip-account-avatar-${account.id}`}
        >
          {account.name[0]}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-body-md font-medium text-on-surface truncate">{account.name}</h3>
          <p className="text-body-sm text-muted-foreground mt-0.5">
            {account.industry} · {account.platform}
          </p>
          {account.followersRange && (
            <p className="text-body-sm text-muted-foreground">{account.followersRange} 粉丝</p>
          )}
          {account.ipPositioning && (
            <p className="text-body-sm text-on-surface-variant mt-1">{account.ipPositioning}</p>
          )}
          {account.personalInfo && (
            <p className="text-body-sm text-muted-foreground mt-1 line-clamp-2">
              {account.personalInfo}
            </p>
          )}
        </div>
      </div>

      {/* 操作按钮 — stub · AC-2 */}
      <div className="flex gap-2 mt-4 justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={handleStubDelete}
          data-testid={`ip-account-delete-${account.id}`}
        >
          删除
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleStubEdit}
          data-testid={`ip-account-edit-${account.id}`}
        >
          编辑
        </Button>
      </div>
    </div>
  );
}
