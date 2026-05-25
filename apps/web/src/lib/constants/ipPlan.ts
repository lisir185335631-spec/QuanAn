import type { LucideIcon } from 'lucide-react';
import {
  Camera, DollarSign, Fingerprint, LayoutGrid, Radio, Sparkles,
  Target, TrendingUp, Users,
} from 'lucide-react';

export const IP_PLAN_H1 = '我的IP方案' as const;
export const IP_PLAN_SUBTITLE_TPL = (done: number, total: number) =>
  `已完成 ${done}／${total} 步` as const;
export const IP_PLAN_BACK_HOME = '返回首页' as const;
export const IP_PLAN_REFRESH = '刷新' as const;
export const IP_PLAN_PROGRESS_LABEL = 'IP打造进度' as const;
export const IP_PLAN_STATUS_DONE = '已完成' as const;
export const IP_PLAN_STATUS_TODO = '未完成' as const;
export const IP_PLAN_VIEW_DETAIL = '查看详情' as const;
export const IP_PLAN_GO_COMPLETE = '去完成' as const;
export const IP_PLAN_FOOTER_TPL = (n: number) =>
  `还有 ${n} 步未完成，继续打造你的IP吧！` as const;
export const IP_PLAN_NEXT_BTN = '继续下一步' as const;

export interface IpPlanStep {
  id: string;
  icon: LucideIcon;
  title: string;
  href: string;
  done: boolean;
  extra: string;
}

export const IP_PLAN_STEPS: ReadonlyArray<IpPlanStep> = [
  { id: 'step1',  icon: LayoutGrid,  title: '行业选择', href: '/step/1',  done: true,  extra: '已选择行业：other' },
  { id: 'step2',  icon: Users,       title: '账号包装', href: '/step/3',  done: true,  extra: '数据已保存' },
  { id: 'step3b', icon: Fingerprint, title: '人设定制', href: '/step/3b', done: true,  extra: '数据已保存' },
  { id: 'step4',  icon: Target,      title: '执行计划', href: '/step/4',  done: true,  extra: '数据已保存' },
  { id: 'step4b', icon: DollarSign,  title: '变现路径', href: '/step/4b', done: false, extra: '' },
  { id: 'step5',  icon: TrendingUp,  title: '爆款选题', href: '/step/5',  done: false, extra: '' },
  { id: 'step6',  icon: Camera,      title: '拍摄计划', href: '/step/6',  done: false, extra: '' },
  { id: 'step7',  icon: Sparkles,    title: '文案生成', href: '/step/7',  done: false, extra: '' },
  { id: 'step8',  icon: Radio,       title: '直播策划', href: '/step/8',  done: false, extra: '' },
];
