/**
 * CreateAccountModal — PRD-23 US-002 AC-3/4 + PRD-25 US-007 AC-7
 * '新建账号' 按钮 + Dialog modal · 4 字段 · tRPC ipAccounts.create · redirect /step/1
 * US-007 AC-7: 「智能推荐」 button (industry 旁) · trpc.ipAccounts.smartRecommend
 *              onSuccess 自动填 platform/followersRange/ipPositioning + rationale hint
 * SHIELD ANTI-PATTERN: smartRecommend is protectedProcedure (requires auth · not public)
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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

interface CreateAccountModalProps {
  /** Controlled mode: pass open+onOpenChange to suppress the built-in trigger */
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  /** Called after successful creation instead of navigate('/step/1') */
  onCreated?: () => void;
}

export function CreateAccountModal({
  open: openProp,
  onOpenChange: onOpenChangeProp,
  onCreated,
}: CreateAccountModalProps = {}) {
  const navigate = useNavigate();
  const [openInternal, setOpenInternal] = useState(false);

  // Controlled when open prop is supplied
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : openInternal;
  function setOpen(v: boolean) {
    if (isControlled) {
      onOpenChangeProp?.(v);
    } else {
      setOpenInternal(v);
    }
  }

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [platform, setPlatform] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  // US-007 AC-7: auto-filled by smartRecommend
  const [followersRange, setFollowersRange] = useState('');
  const [ipPositioning, setIpPositioning] = useState('');
  const [rationale, setRationale] = useState('');

  const createMutation = trpc.ipAccounts.create.useMutation();

  // US-007 AC-7: smartRecommend mutation
  const smartRecommendMutation = trpc.ipAccounts.smartRecommend.useMutation({
    onSuccess(data) {
      setPlatform(data.platform);
      setFollowersRange(data.followersRange);
      setIpPositioning(data.ipPositioning);
      setRationale(data.rationale);
    },
    onError() {
      toast.error('智能推荐失败 · 请稍后重试');
    },
  });

  const isDisabled = !name.trim() || !industry.trim() || !platform;

  async function handleCreate() {
    if (isDisabled || createMutation.isPending) return;
    await createMutation.mutateAsync({
      name: name.trim(),
      industry: industry.trim(),
      platform: platform ?? '',
      ...(description.trim() ? { personalInfo: description.trim() } : {}),
      ...(followersRange ? { followersRange } : {}),
      ...(ipPositioning ? { ipPositioning } : {}),
    });
    toast.success('账号创建成功');
    setOpen(false);
    if (onCreated) {
      onCreated();
    } else {
      navigate('/step/1');
    }
  }

  function handleSmartRecommend() {
    if (!industry.trim() || smartRecommendMutation.isPending) return;
    smartRecommendMutation.mutate({ industry: industry.trim() });
  }

  function handleCancel() {
    setOpen(false);
    setName('');
    setIndustry('');
    setPlatform(null);
    setDescription('');
    setFollowersRange('');
    setIpPositioning('');
    setRationale('');
  }

  function handleOpenChange(v: boolean) {
    if (!v) handleCancel();
    else setOpen(true);
  }

  return (
    <>
      {/* Controlled mode: no built-in trigger (caller renders its own button) */}
      {!isControlled && (
        <Button
          className="ikb-gradbtn ikb-focusring"
          style={{ color: '#fff' }}
          onClick={() => setOpen(true)}
          data-testid="create-account-trigger"
        >
          新建账号
        </Button>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent data-testid="create-account-modal">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: F.display, color: C.ink }}>新建 IP 账号</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div>
              <label htmlFor="ca-name" className="text-body-sm font-medium text-on-surface mb-1.5 block">
                IP 账号名 <span className="text-destructive">*</span>
              </label>
              <Input
                id="ca-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="如：赵语AI"
                data-testid="create-account-name"
                className="ikb-input"
                style={{ borderColor: C.line }}
              />
            </div>

            {/* US-007 AC-7: industry + 智能推荐 button */}
            <div>
              <label htmlFor="ca-industry" className="text-body-sm font-medium text-on-surface mb-1.5 block">
                行业 <span className="text-destructive">*</span>
              </label>
              <div className="flex gap-2">
                <Input
                  id="ca-industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="如：企业服务"
                  data-testid="create-account-industry"
                  className="ikb-input flex-1"
                  style={{ borderColor: C.line }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!industry.trim() || smartRecommendMutation.isPending}
                  onClick={handleSmartRecommend}
                  data-testid="create-account-smart-recommend"
                >
                  {smartRecommendMutation.isPending ? '推荐中…' : '智能推荐'}
                </Button>
              </div>
              {/* AC-7: rationale hint (gray) */}
              {rationale && (
                <p
                  className="mt-1.5 text-body-xs text-muted-foreground"
                  data-testid="create-account-rationale-hint"
                >
                  {rationale}
                </p>
              )}
            </div>

            <div>
              {/* PlatformInlineRadio uses radio group — label acts as group label */}
              <p className="text-body-sm font-medium text-on-surface mb-1.5">
                平台 <span className="text-destructive">*</span>
              </p>
              <PlatformInlineRadio
                value={platform}
                onChange={setPlatform}
                size="sm"
              />
            </div>

            <div>
              <label htmlFor="ca-description" className="text-body-sm font-medium text-on-surface mb-1.5 block">
                业务描述
              </label>
              <Textarea
                id="ca-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="如：定制智能体和 opc 培训"
                data-testid="create-account-description"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              data-testid="create-account-cancel"
              className="ikb-focusring"
              style={{ border: `1px solid ${C.line}`, color: C.ink, background: 'transparent' }}
            >
              取消
            </Button>
            <Button
              disabled={isDisabled || createMutation.isPending}
              onClick={() => void handleCreate()}
              data-testid="create-account-submit"
              className="ikb-gradbtn ikb-focusring"
              style={{ color: '#fff' }}
            >
              {createMutation.isPending ? '创建中…' : '创建并开始'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
