import type { FieldError } from 'react-hook-form';

import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Industry display data — mirrors apps/api/src/lib/constants/industries.ts
const INDUSTRY_GROUPS = [
  {
    label: '🏠 生活服务',
    items: [
      { key: 'beauty', label: '美业' },
      { key: 'cosmetics', label: '美妆护肤' },
      { key: 'food', label: '餐饮美食' },
      { key: 'tea_coffee', label: '茶饮咖啡' },
      { key: 'liquor', label: '酒水' },
      { key: 'health', label: '健康养生' },
      { key: 'medical', label: '医疗健康' },
      { key: 'psychology', label: '心理咨询' },
      { key: 'fitness', label: '运动健身' },
      { key: 'sports', label: '体育运动' },
      { key: 'baby_parenting', label: '母婴亲子' },
      { key: 'travel', label: '旅游出行' },
      { key: 'pet', label: '宠物' },
      { key: 'wedding', label: '婚庆婚嫁' },
      { key: 'local', label: '本地生活' },
      { key: 'cleaning', label: '家政服务' },
      { key: 'logistics', label: '物流快递' },
      { key: 'auto_service', label: '汽车服务' },
    ],
  },
  {
    label: '🛒 电商零售',
    items: [
      { key: 'apparel', label: '服装穿搭' },
      { key: 'luxury', label: '奢侈品' },
      { key: 'shoes_bags', label: '鞋靴箱包' },
      { key: 'auto', label: '汽车' },
      { key: 'ecommerce', label: '电商零售' },
      { key: 'fresh', label: '生鲜配送' },
      { key: 'home_appliance', label: '家电' },
      { key: 'home', label: '家装家居' },
      { key: 'jewelry', label: '珠宝饰品' },
      { key: 'supplement', label: '营养保健' },
      { key: 'daily', label: '日用百货' },
      { key: 'books', label: '图书文创' },
      { key: 'second_hand', label: '二手闲置' },
    ],
  },
  {
    label: '✍️ 内容创作',
    items: [
      { key: 'self_media', label: '自媒体运营' },
      { key: 'photo', label: '摄影摄像' },
      { key: 'design', label: '设计创意' },
      { key: 'game', label: '游戏' },
      { key: 'entertainment', label: '娱乐' },
      { key: 'media', label: '文化传媒' },
      { key: 'social', label: '情感社交' },
    ],
  },
  {
    label: '💼 专业服务',
    items: [
      { key: 'edu', label: '教育培训' },
      { key: 'k12', label: 'K12教育' },
      { key: 'preschool', label: '早教托育' },
      { key: 'art_edu', label: '艺术培训' },
      { key: 'language', label: '语言培训' },
      { key: 'it_edu', label: 'IT培训' },
      { key: 'real_estate', label: '房产' },
      { key: 'finance', label: '金融理财' },
      { key: 'tech', label: '科技数码' },
      { key: 'law', label: '法律咨询' },
      { key: 'franchise', label: '招商加盟' },
      { key: 'recruitment', label: '人力招聘' },
      { key: 'enterprise', label: '企业服务' },
      { key: 'gov', label: '政务公益' },
    ],
  },
  {
    label: '🏭 产业制造',
    items: [
      { key: 'agriculture', label: '农业农村' },
      { key: 'manufacturing', label: '工业制造' },
      { key: 'construction', label: '建筑工程' },
      { key: 'other', label: '其他行业' },
    ],
  },
] as const;

interface IndustrySelectProps {
  value: string;
  onChange: (v: string) => void;
  error?: FieldError;
}

export function IndustrySelect({ value, onChange, error }: IndustrySelectProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-body-sm font-medium text-on-surface">
        所属行业<span className="text-error ml-0.5">*</span>
      </label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className={error ? 'border-error focus:ring-error' : ''}>
          <SelectValue placeholder="请选择行业" />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-72">
            {INDUSTRY_GROUPS.map((group) => (
              <SelectGroup key={group.label}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.items.map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </ScrollArea>
        </SelectContent>
      </Select>
      {error && (
        <p className="text-body-xs text-error" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}
