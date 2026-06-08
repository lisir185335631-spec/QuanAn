/**
 * PrivateDomainConfigView — ui/_5 设计稿 · 配置参数表单 · PRD-15 US-005
 * 液态玻璃皮 · 业务逻辑/testid/props 零改动
 */

import { Loader2, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { C, F } from '@/components/home-next/ikb/system';

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
  { value: 'douyin',       label: '抖音' },
  { value: 'xiaohongshu',  label: '小红书' },
  { value: 'wechat',       label: '微信视频号' },
  { value: 'weibo',        label: '微博' },
  { value: 'other',        label: '其他平台' },
] as const;

// shared input/textarea base style
const inputBase: React.CSSProperties = {
  width: '100%',
  borderRadius: 12,
  border: `0.5px solid ${C.line}`,
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(10px)',
  padding: '10px 14px',
  fontSize: 14,
  color: C.ink,
  fontFamily: F.cn,
  outline: 'none',
  boxSizing: 'border-box',
  resize: 'vertical' as const,
};

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

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 700,
    color: C.ink,
    fontFamily: F.cn,
    textShadow: C.textShadow,
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
      data-testid="private-domain-config-form"
    >
      <p
        style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.55)',
          fontFamily: F.mono,
        }}
      >
        配置私域成交参数
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* productDescription */}
        <div>
          <label htmlFor="pd-product-desc" style={labelStyle}>产品/服务描述</label>
          <textarea
            id="pd-product-desc"
            style={inputBase}
            placeholder="简述你的产品或服务，例如：1对1职业规划咨询，帮助职场新人完成从0到1的职业定位"
            value={values.productDescription}
            onChange={set('productDescription')}
            rows={3}
            data-testid="product-description-textarea"
            required
            onFocus={(e) => { (e.target as HTMLTextAreaElement).style.boxShadow = `0 0 0 1.5px rgba(168,197,224,0.6)`; }}
            onBlur={(e) => { (e.target as HTMLTextAreaElement).style.boxShadow = ''; }}
          />
        </div>

        {/* productPrice */}
        <div>
          <label htmlFor="pd-price" style={labelStyle}>产品客单价（元）</label>
          <input
            id="pd-price"
            type="number"
            min={1}
            placeholder="例如：2980"
            value={values.productPrice}
            onChange={set('productPrice')}
            style={inputBase}
            data-testid="product-price-input"
            required
            onFocus={(e) => { (e.target as HTMLInputElement).style.boxShadow = `0 0 0 1.5px rgba(168,197,224,0.6)`; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.boxShadow = ''; }}
          />
        </div>

        {/* targetAudience */}
        <div>
          <label htmlFor="pd-audience" style={labelStyle}>目标受众</label>
          <textarea
            id="pd-audience"
            style={inputBase}
            placeholder="描述你的目标客户，例如：25-35岁职场女性，月薪1万+，希望跳槽涨薪的职场人"
            value={values.targetAudience}
            onChange={set('targetAudience')}
            rows={2}
            data-testid="target-audience-textarea"
            required
            onFocus={(e) => { (e.target as HTMLTextAreaElement).style.boxShadow = `0 0 0 1.5px rgba(168,197,224,0.6)`; }}
            onBlur={(e) => { (e.target as HTMLTextAreaElement).style.boxShadow = ''; }}
          />
        </div>

        {/* ipPositioning */}
        <div>
          <label htmlFor="pd-ip" style={labelStyle}>IP 定位</label>
          <textarea
            id="pd-ip"
            style={inputBase}
            placeholder="你的IP人设定位，例如：10年500强HR经验，帮你搞定职业规划的职场导师"
            value={values.ipPositioning}
            onChange={set('ipPositioning')}
            rows={2}
            data-testid="ip-positioning-textarea"
            required
            onFocus={(e) => { (e.target as HTMLTextAreaElement).style.boxShadow = `0 0 0 1.5px rgba(168,197,224,0.6)`; }}
            onBlur={(e) => { (e.target as HTMLTextAreaElement).style.boxShadow = ''; }}
          />
        </div>

        {/* currentChannel */}
        <div>
          <label htmlFor="pd-channel" style={labelStyle}>当前主流量渠道</label>
          <Select value={values.currentChannel} onValueChange={handleChannelChange}>
            <SelectTrigger
              id="pd-channel"
              data-testid="current-channel-select"
              style={{
                borderRadius: 12,
                border: `0.5px solid ${C.line}`,
                background: 'rgba(255,255,255,0.07)',
                backdropFilter: 'blur(10px)',
                color: C.ink,
                fontFamily: F.cn,
                fontSize: 14,
              }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              style={{
                background: 'rgba(22,40,72,0.92)',
                backdropFilter: 'blur(24px)',
                border: `0.5px solid ${C.line}`,
                borderRadius: 14,
              }}
            >
              {CHANNEL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} style={{ color: C.ink, fontFamily: F.cn }}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* monthlyTraffic */}
        <div>
          <label htmlFor="pd-traffic" style={labelStyle}>月均流量（粉丝/播放）</label>
          <input
            id="pd-traffic"
            type="number"
            min={0}
            placeholder="例如：50000"
            value={values.monthlyTraffic}
            onChange={set('monthlyTraffic')}
            style={inputBase}
            data-testid="monthly-traffic-input"
            required
            onFocus={(e) => { (e.target as HTMLInputElement).style.boxShadow = `0 0 0 1.5px rgba(168,197,224,0.6)`; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.boxShadow = ''; }}
          />
        </div>
      </div>

      <motion.button
        type="submit"
        disabled={!isValid(values) || isPending}
        whileHover={isValid(values) && !isPending ? { y: -3 } : {}}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderRadius: 12,
          padding: '13px 20px',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: '#081430',
          background: C.ikb,
          border: 'none',
          cursor: isValid(values) && !isPending ? 'pointer' : 'not-allowed',
          opacity: isValid(values) && !isPending ? 1 : 0.4,
          fontFamily: F.cn,
        }}
        data-testid="generate-sop-btn"
      >
        {isPending ? (
          <>
            <Loader2 style={{ height: 16, width: 16, animation: 'spin 1s linear infinite' }} />
            AI 生成中…
          </>
        ) : (
          <>
            <Wand2 style={{ height: 16, width: 16 }} />
            生成私域成交 SOP
          </>
        )}
      </motion.button>
    </form>
  );
}
