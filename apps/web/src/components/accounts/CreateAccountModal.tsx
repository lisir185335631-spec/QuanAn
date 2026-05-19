/**
 * CreateAccountModal — PRD-23 US-002 AC-3/4
 * '新建账号' 按钮 + Dialog modal · 4 字段 · tRPC ipAccounts.create · redirect /step/1
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
import { trpc } from '@/lib/trpc';

export function CreateAccountModal() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [platform, setPlatform] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  const createMutation = trpc.ipAccounts.create.useMutation();

  const isDisabled = !name.trim() || !industry.trim() || !platform;

  async function handleCreate() {
    if (isDisabled || createMutation.isPending) return;
    await createMutation.mutateAsync({
      name: name.trim(),
      industry: industry.trim(),
      platform: platform!,
      ...(description.trim() ? { personalInfo: description.trim() } : {}),
    });
    toast.success('账号创建成功');
    setOpen(false);
    navigate('/step/1');
  }

  function handleCancel() {
    setOpen(false);
    setName('');
    setIndustry('');
    setPlatform(null);
    setDescription('');
  }

  function handleOpenChange(v: boolean) {
    if (!v) handleCancel();
    else setOpen(true);
  }

  return (
    <>
      <Button
        className="bg-gradient-to-r from-primary to-primary/60 text-primary-foreground"
        onClick={() => setOpen(true)}
        data-testid="create-account-trigger"
      >
        新建账号
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent data-testid="create-account-modal">
          <DialogHeader>
            <DialogTitle>新建 IP 账号</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div>
              <label className="text-body-sm font-medium text-on-surface mb-1.5 block">
                IP 账号名 <span className="text-destructive">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="如：赵语AI"
                data-testid="create-account-name"
              />
            </div>

            <div>
              <label className="text-body-sm font-medium text-on-surface mb-1.5 block">
                行业 <span className="text-destructive">*</span>
              </label>
              <Input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="如：企业服务"
                data-testid="create-account-industry"
              />
            </div>

            <div>
              <label className="text-body-sm font-medium text-on-surface mb-1.5 block">
                平台 <span className="text-destructive">*</span>
              </label>
              <PlatformInlineRadio
                value={platform}
                onChange={setPlatform}
                size="sm"
              />
            </div>

            <div>
              <label className="text-body-sm font-medium text-on-surface mb-1.5 block">
                业务描述
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="如：定制智能体和 opc 培训"
                data-testid="create-account-description"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} data-testid="create-account-cancel">
              取消
            </Button>
            <Button
              disabled={isDisabled || createMutation.isPending}
              onClick={handleCreate}
              data-testid="create-account-submit"
            >
              {createMutation.isPending ? '创建中…' : '创建并开始'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
