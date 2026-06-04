/**
 * EditAccountModal — 编辑 IP 账号
 * props: { account, open, onOpenChange, onUpdated }
 * 调 trpc.ipAccounts.update.useMutation · 字段: name/industry/platform/personalInfo
 */
import { useEffect, useState } from 'react';

import { C, F } from '@/components/home/ikb/system';
import { PlatformInlineRadio } from '@/components/inline-pickers/PlatformInlineRadio';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import '@/styles/ikb-hero.css';
import { trpc } from '@/lib/trpc';

interface EditableAccount {
  id: number;
  name: string;
  industry: string;
  platform: string;
  personalInfo?: string | null;
  followersRange?: string | null;
  ipPositioning?: string | null;
  stage?: string;
}

interface EditAccountModalProps {
  account: EditableAccount;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdated?: () => void;
}

export function EditAccountModal({
  account,
  open,
  onOpenChange,
  onUpdated,
}: EditAccountModalProps) {
  const [name, setName] = useState(account.name);
  const [industry, setIndustry] = useState(account.industry);
  const [platform, setPlatform] = useState<string | null>(account.platform ?? null);
  const [description, setDescription] = useState(account.personalInfo ?? '');

  // Reset form to the account's current values whenever the modal opens or switches account.
  // `account` is referentially stable (React Query data), so this only fires on open / account swap.
  useEffect(() => {
    if (open) {
      setName(account.name);
      setIndustry(account.industry);
      setPlatform(account.platform ?? null);
      setDescription(account.personalInfo ?? '');
    }
  }, [open, account]);

  const updateMutation = trpc.ipAccounts.update.useMutation();

  const isDisabled = !name.trim() || !industry.trim() || !platform;

  async function handleSave() {
    if (isDisabled || updateMutation.isPending) return;
    await updateMutation.mutateAsync({
      accountId: account.id,
      name: name.trim(),
      industry: industry.trim(),
      platform: platform ?? undefined,
      ...(description.trim() ? { personalInfo: description.trim() } : {}),
    });
    onOpenChange(false);
    onUpdated?.();
  }

  function handleCancel() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="edit-account-modal">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: F.display, color: C.ink }}>编辑 IP 账号</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div>
            <label
              htmlFor="ea-name"
              className="text-body-sm font-medium text-on-surface mb-1.5 block"
            >
              IP 账号名 <span className="text-destructive">*</span>
            </label>
            <Input
              id="ea-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：赵语AI"
              data-testid="edit-account-name"
              className="ikb-input"
              style={{ borderColor: C.line }}
            />
          </div>

          <div>
            <label
              htmlFor="ea-industry"
              className="text-body-sm font-medium text-on-surface mb-1.5 block"
            >
              行业 <span className="text-destructive">*</span>
            </label>
            <Input
              id="ea-industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="如：企业服务"
              data-testid="edit-account-industry"
              className="ikb-input"
              style={{ borderColor: C.line }}
            />
          </div>

          <div>
            <p className="text-body-sm font-medium text-on-surface mb-1.5">
              平台 <span className="text-destructive">*</span>
            </p>
            <PlatformInlineRadio value={platform} onChange={setPlatform} size="sm" />
          </div>

          <div>
            <label
              htmlFor="ea-description"
              className="text-body-sm font-medium text-on-surface mb-1.5 block"
            >
              业务描述
            </label>
            <Textarea
              id="ea-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="如：定制智能体和 opc 培训"
              data-testid="edit-account-description"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            data-testid="edit-account-cancel"
            className="ikb-focusring"
            style={{ border: `1px solid ${C.line}`, color: C.ink, background: 'transparent' }}
          >
            取消
          </Button>
          <Button
            disabled={isDisabled || updateMutation.isPending}
            onClick={() => void handleSave()}
            data-testid="edit-account-submit"
            className="ikb-gradbtn ikb-focusring"
            style={{ color: '#fff' }}
          >
            {updateMutation.isPending ? '保存中…' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
