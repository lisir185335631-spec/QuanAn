/**
 * PrivateDomainConfigView — ui/_5 设计稿 · 配置参数表单 · PRD-15 US-005
 * AC-3: productDescription + productPrice + targetAudience + ipPositioning + currentChannel + monthlyTraffic
 * 使用原生 HTML 元素(label/textarea/input) · 避免缺失的 shadcn 组件依赖
 */

import { Loader2, Wand2 } from 'lucide-react';


import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

import type { ChangeEvent, FormEvent } from 'react';

export interface PrivateDomainFormValues {
  productDescription: string;
  productPrice: string;
  targetAudience: string;
  ipPositioning: string;
  currentChannel: 'wechat' | 'douyin' | 'xiaohongshu' | 'weibo' | 'other';
  monthlyTraffic: string;
}

export const DEFAULT_FORM: PrivateDomainFormValues = {
  productDescription: '',
  productPrice: '',
  targetAudience: '',
  ipPositioning: '',
  currentChannel: 'douyin',
  monthlyTraffic: '',
};

const CHANNEL_OPTIONS = [
  { value: 'douyin', label: '抖音' },
  { value: 'xiaohongshu', label: '小红书' },
  { value: 'wechat', label: '微信视频号' },
  { value: 'weibo', label: '微博' },
  { value: 'other', label: '其他平台' },
] as const;

const textareaClass = cn(
  'flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm',
  'text-on-surface shadow-sm transition-colors placeholder:text-muted-foreground',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
  'disabled:cursor-not-allowed disabled:opacity-50 resize-y',
);

interface PrivateDomainConfigViewProps {
  values: PrivateDomainFormValues;
  onChange: (values: PrivateDomainFormValues) => void;
  onSubmit: (values: PrivateDomainFormValues) => void;
  isPending: boolean;
}

function isValid(v: PrivateDomainFormValues): boolean {
  return (
    v.productDescription.trim().length > 0 &&
    v.productPrice.trim().length > 0 &&
    parseFloat(v.productPrice) > 0 &&
    v.targetAudience.trim().length > 0 &&
    v.ipPositioning.trim().length > 0 &&
    v.monthlyTraffic.trim().length > 0 &&
    parseInt(v.monthlyTraffic, 10) >= 0
  );
}

export function PrivateDomainConfigView({
  values,
  onChange,
  onSubmit,
  isPending,
}: PrivateDomainConfigViewProps) {
  function set(field: keyof PrivateDomainFormValues) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange({ ...values, [field]: e.target.value });
    };
  }

  function handleChannelChange(val: string) {
    onChange({ ...values, currentChannel: val as PrivateDomainFormValues['currentChannel'] });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid(values) || isPending) return;
    onSubmit(values);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      data-testid="private-domain-config-form"
    >
      <p className="text-label-sm text-muted-foreground uppercase tracking-wide">
        配置私域成交参数
      </p>

      <div className="space-y-4">
        {/* productDescription */}
        <div className="space-y-1.5">
          <label
            htmlFor="pd-product-desc"
            className="text-body-sm font-medium text-on-surface"
          >
            产品/服务描述
          </label>
          <textarea
            id="pd-product-desc"
            className={textareaClass}
            placeholder="简述你的产品或服务，例如：1对1职业规划咨询，帮助职场新人完成从0到1的职业定位"
            value={values.productDescription}
            onChange={set('productDescription')}
            rows={3}
            data-testid="product-description-textarea"
            required
          />
        </div>

        {/* productPrice */}
        <div className="space-y-1.5">
          <label
            htmlFor="pd-price"
            className="text-body-sm font-medium text-on-surface"
          >
            产品客单价（元）
          </label>
          <Input
            id="pd-price"
            type="number"
            min={1}
            placeholder="例如：2980"
            value={values.productPrice}
            onChange={set('productPrice')}
            data-testid="product-price-input"
            required
          />
        </div>

        {/* targetAudience */}
        <div className="space-y-1.5">
          <label
            htmlFor="pd-audience"
            className="text-body-sm font-medium text-on-surface"
          >
            目标受众
          </label>
          <textarea
            id="pd-audience"
            className={textareaClass}
            placeholder="描述你的目标客户，例如：25-35岁职场女性，月薪1万+，希望跳槽涨薪的职场人"
            value={values.targetAudience}
            onChange={set('targetAudience')}
            rows={2}
            data-testid="target-audience-textarea"
            required
          />
        </div>

        {/* ipPositioning */}
        <div className="space-y-1.5">
          <label
            htmlFor="pd-ip"
            className="text-body-sm font-medium text-on-surface"
          >
            IP 定位
          </label>
          <textarea
            id="pd-ip"
            className={textareaClass}
            placeholder="你的IP人设定位，例如：10年500强HR经验，帮你搞定职业规划的职场导师"
            value={values.ipPositioning}
            onChange={set('ipPositioning')}
            rows={2}
            data-testid="ip-positioning-textarea"
            required
          />
        </div>

        {/* currentChannel */}
        <div className="space-y-1.5">
          <label
            htmlFor="pd-channel"
            className="text-body-sm font-medium text-on-surface"
          >
            当前主流量渠道
          </label>
          <Select
            value={values.currentChannel}
            onValueChange={handleChannelChange}
          >
            <SelectTrigger id="pd-channel" data-testid="current-channel-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHANNEL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* monthlyTraffic */}
        <div className="space-y-1.5">
          <label
            htmlFor="pd-traffic"
            className="text-body-sm font-medium text-on-surface"
          >
            月均流量（粉丝/播放）
          </label>
          <Input
            id="pd-traffic"
            type="number"
            min={0}
            placeholder="例如：50000"
            value={values.monthlyTraffic}
            onChange={set('monthlyTraffic')}
            data-testid="monthly-traffic-input"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={!isValid(values) || isPending}
        className="w-full"
        data-testid="generate-sop-btn"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            AI 生成中…
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4 mr-2" />
            生成私域成交 SOP
          </>
        )}
      </Button>
    </form>
  );
}
