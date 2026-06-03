/**
 * deep-learning.ts — /tools/deep-learning · 字面源 + mock 数据
 * 1:1 复刻 aiipznt.vip/deep-learning · sally zhao 版
 */

import { FileText, Upload } from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

// ── header ────────────────────────────────────────────────────────────────────
export const DEEP_LEARNING_CHIP = '深度学习' as const;
export const DEEP_LEARNING_H1 = '文案深度学习' as const;
export const DEEP_LEARNING_SUBTITLE =
  '上传文件或粘贴文案样本，AI将深度分析文案逻辑、包装风格，生成可复用的风格画像' as const;

// ── form labels ────────────────────────────────────────────────────────────────
export const DL_TAB_UPLOAD = '上传文件' as const;
export const DL_TAB_PASTE = '粘贴文案' as const;
export const DL_ADD_SAMPLE_LABEL = '添加文案样本' as const;
export const DL_BATCH_PASTE = '批量粘贴' as const;
export const DL_TEXTAREA_PLACEHOLDER =
  '粘贴一篇文案内容（口播文案、短视频文案、图文文案均可）' as const;
export const DL_HINT_CTRL_ENTER = 'Ctrl+Enter 快速添加' as const;
export const DL_ADD_THIS_BTN = '添加这篇' as const;
export const DL_NAME_PLACEHOLDER = '学习档案名称（可选，如：XX老师的文案风格）' as const;
export const DL_START_BTN_PREFIX = '开始深度学习' as const;
export const DL_START_BTN_SUFFIX = (n: number) => `（${n}篇文案）` as const;

// ── toast texts ──────────────────────────────────────────────────────────────
export const DL_TOAST_UPLOAD = '文件上传 · 即将上线' as const;
export const DL_TOAST_BATCH = '批量粘贴 · 即将上线' as const;
export const DL_TOAST_NEED_TEXT = '请粘贴文案后再添加' as const;
export const DL_TOAST_START = '已加入深度学习队列，分析中…' as const;
export const DL_TOAST_COPY = '复制成功' as const;
export const DL_TOAST_DELETE = '学习档案已删除' as const;
export const DL_TOAST_LEARN_QUEUED = '样本已加入批量学习队列，分析中…' as const;
export const DL_TOAST_LEARN_DONE = '深度学习完成' as const;
export const DL_TOAST_LEARN_FAILED = '深度学习任务失败' as const;

// ── 学习档案 ─────────────────────────────────────────────────────────────────
export const DL_ARCHIVES_TITLE_PREFIX = '学习档案' as const;
export const DL_EMPTY_TITLE = '还没有学习档案' as const;
export const DL_EMPTY_DESC = '上传文件或添加文案样本，开始深度学习' as const;
export const DL_ARCHIVE_STATUS_DONE = '已完成' as const;

// ── archive status label mapping ─────────────────────────────────────────────
export const DL_ARCHIVE_STATUS_MAP: Record<string, string> = {
  pending: '待审核',
  approved: '已完成',
  rejected: '已拒绝',
  cancelled: '已取消',
};

export function getDLArchiveStatusLabel(status: string): string {
  return DL_ARCHIVE_STATUS_MAP[status] ?? status;
}

// ── 6 段 archive sub-section labels ──────────────────────────────────────────
export const DL_SECTION_STYLE_PORTRAIT = '风格画像' as const;
export const DL_SECTION_LOGIC = '文案逻辑' as const;
export const DL_SECTION_PACKAGING = '包装风格' as const;
export const DL_SECTION_HIGHLIGHTS_PREFIX = '精华片段' as const;

// ── 9 logic field labels ──────────────────────────────────────────────────────
export interface ArchiveFieldEntry {
  key: string;
  label: string;
  content: string;
}

export const DL_LOGIC_FIELDS: ReadonlyArray<ArchiveFieldEntry> = [
  {
    key: 'opening',
    label: '开头模式：',
    content:
      '通过提出一个行业普遍存在的痛点和对比现象（有人轻松赚钱，有人苦苦挣扎），引发目标受众的共鸣和好奇心，直接切入核心问题。',
  },
  {
    key: 'structure',
    label: '内容结构：',
    content:
      '采用"提出问题 -> 正反观点呈现（AI赋能 vs 人情服务）-> 融合与升华（我的立场）-> 引导讨论"的辩论式/探讨式结构。首先抛出行业困境，接着分别阐述两种看似对立的解决方案及其案例，最后给出作者的独到见解和融合之道，并以互动提问收尾。',
  },
  {
    key: 'language',
    label: '语言风格：',
    content:
      '口语化、平实易懂，带有一定的煽动性和启发性。善用疑问句、反问句和比喻（支点、以小搏大），逻辑清晰，表达流畅，能够有效引导用户思考。',
  },
  {
    key: 'script_type',
    label: '脚本类型：',
    content: '行业洞察分析型 / 辩论探讨型',
  },
  {
    key: 'guidance',
    label: '引导行为：',
    content: '开放式提问，引导评论区用户进行观点分享和讨论，激发互动，形成UGC内容。',
  },
  {
    key: 'audience',
    label: '目标受众：',
    content: '美业老板、创业者、行业从业人员、对商业模式和效率提升感兴趣的人群。',
  },
  {
    key: 'hook',
    label: '钩子技巧：',
    content:
      '痛点共鸣（美业老板赚钱难）、对比反差（轻松赚钱 vs 苦苦挣扎）、悬念提问（背后藏着什么秘密?）、案例故事（美容院老板年入370万）、数据支撑（省20万人力，效率10倍）',
  },
  {
    key: 'emotion',
    label: '情感触发：',
    content:
      '焦虑感（赚钱难、辛苦钱）、好奇心（秘密、趋势）、认同感（我的立场、融合之道）、希望感（轻松赚钱、高回报）、危机感（有没有看到趋势、勇气尝试）',
  },
  {
    key: 'viral',
    label: '爆款元素：',
    content: '行业痛点直击、新旧观念冲突、成功案例分享、数据量化效果、趋势预判与解决方案、互动式结尾',
  },
];

// ── 5 packaging field labels ──────────────────────────────────────────────────
export const DL_PACKAGING_FIELDS: ReadonlyArray<ArchiveFieldEntry> = [
  {
    key: 'brand',
    label: '品牌定位：',
    content:
      '行业专家/导师/思想者形象，具备深度洞察力，能够提供新颖的视角和解决方案，不偏袒任何一方，而是寻求平衡与最优解。',
  },
  {
    key: 'tone',
    label: '语气调性：',
    content: '理性分析、启发思考、略带权威性，同时保持亲和力，鼓励互动。',
  },
  {
    key: 'format',
    label: '呈现形式：',
    content: '短视频文案（适用于口播或配字幕讲解），内容结构清晰，节奏感强，适合碎片化传播。',
  },
  {
    key: 'topic',
    label: '内容主题：',
    content: '美业经营策略、AI赋能商业、效率提升与成本优化、商业模式创新、人与技术结合',
  },
  {
    key: 'differentiation',
    label: '差异化：',
    content:
      '平衡视角：不简单站队，而是探讨融合之道。、案例支撑：用具体故事和数据增强说服力。、趋势洞察：关注前沿科技（AI）在传统行业的应用。、问题解决导向：提供可操作的思路而非纯粹抱怨。',
  },
];

// ── 4 highlight quotes ────────────────────────────────────────────────────────
export const DL_HIGHLIGHTS: ReadonlyArray<string> = [
  '为什么美业老板，有人赚钱那么轻松，有人却苦苦挣扎？',
  'AI智能体能帮美业省下至少20万的人力成本，效率是人工的十倍。',
  '美业是服务行业，最重要的是人情味和体验感，这是AI给不了的。',
  '轻松赚钱和人情味并不冲突，关键在于用AI优化标准化流程，把精力投入到真正需要"人"的服务上。',
];

// ── style portrait ────────────────────────────────────────────────────────────
export const DL_STYLE_PORTRAIT_BODY =
  '这份文案的核心风格画像是一位深谙美业经营之道的"智者型"IP。他擅长以犀利的问题切入行业痛点，通过正反两面的案例对比，展现新旧模式的冲突与融合。其语言风格口语化且富有启发性，善用数据和故事来支撑论点，最终提出独到的平衡解决方案，并以开放式提问引导用户深度参与。整体呈现出一种理性分析、趋势洞察和解决问题导向的专业态度，旨在帮助美业老板们打破思维局限，拥抱高效未来。' as const;

// ── archive mock ──────────────────────────────────────────────────────────────
export interface ArchiveMock {
  id: string;
  title: string;
  sampleCount: number;
  stylePortrait: string;
  logic: ReadonlyArray<ArchiveFieldEntry>;
  packaging: ReadonlyArray<ArchiveFieldEntry>;
  highlights: ReadonlyArray<string>;
}

export const DL_ARCHIVE_MOCK: ArchiveMock = {
  id: 'archive-1',
  title: '文案学习 2026/5/25 (1篇)',
  sampleCount: 1,
  stylePortrait: DL_STYLE_PORTRAIT_BODY,
  logic: DL_LOGIC_FIELDS,
  packaging: DL_PACKAGING_FIELDS,
  highlights: DL_HIGHLIGHTS,
};

// ── 使用说明 ─────────────────────────────────────────────────────────────────
export const DL_USAGE_TITLE = '使用说明' as const;

export interface UsageSection {
  title: string;
  bullets: ReadonlyArray<string>;
}

export const DL_USAGE_SECTIONS: ReadonlyArray<UsageSection> = [
  {
    title: '文件上传模式：',
    bullets: [
      '1. 支持上传 PDF、Word（.doc/.docx）、TXT、Markdown、CSV 文件',
      '2. 系统会自动提取文件中的文本内容，拆分成段落进行深度学习',
      '3. 建议上传你的代表作品集、话术文档、文案素材库等',
    ],
  },
  {
    title: '文案粘贴模式：',
    bullets: [
      '4. 逐条粘贴或使用"批量粘贴"模式一次性添加多篇（用空行或---分隔）',
      '5. 最多支持50篇文案，建议添加10篇以上以获得更精准的风格分析',
    ],
  },
  {
    title: '通用说明：',
    bullets: [
      '6. AI会深度分析文案逻辑（开头模式、结构、钩子技巧等）和包装风格',
      '7. 分析完成后，点击"复制风格提示词"可将学习成果应用到文案生成中',
    ],
  },
];

// ── tab icon mapping (re-export 给 page) ─────────────────────────────────────
export const DL_TAB_ICONS: Record<string, LucideIcon> = {
  upload: Upload,
  paste: FileText,
};
