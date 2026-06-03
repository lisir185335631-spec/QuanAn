# SPEC · /present-styles 1:1 复刻

> **目标** · 把 `apps/web/src/pages/tools/PresentStyles.tsx` 从 PRD-27 form-submit 工具 · 重写为 sally 真实 14 cards 静态展示页
> **截图证据** · sally 截图 1(top half) + 截图 2(bottom half) · 14 cards 字面已盘
> **风险** · L · 纯静态 · 0 交互 · 0 API · 14 cards 重复结构

---

## §1 · 背景 & 偏离

### 1.1 sally 真实页(2 张截图字面盘点)

- **URL** · `aiipznt.vip/present-styles`
- **header** · 复用 AIP AGENT logo + 创作/策划/智能/更多 nav + 赵语AI/sally zhao + logout(同其他 tools 页)
- **大标题** · `爆款呈现形式合集`(白色 · large bold)
- **副标题** · `掌握各种爆款视频的呈现形式，找到最适合你的内容表达方式`(灰色)
- **14 cards** · 3 列 grid · 顺序严格固定 ·
  | # | 标题 | 描述 |
  |:-:|---|---|
  | 1 | 口播 | 真人出镜直接讲述，适合知识分享和观点输出 |
  | 2 | 剧情 | 短剧/情景剧形式，适合讲故事和产品植入 |
  | 3 | 教程 | 步骤式教学，适合技能分享和产品使用 |
  | 4 | Vlog | 日常记录/体验分享，适合人设打造 |
  | 5 | 街访 | 街头采访形式，适合话题讨论和互动 |
  | 6 | 对比测评 | 产品/方法对比，适合种草和测评 |
  | 7 | 清单盘点 | 盘点型内容，信息密度高 |
  | 8 | 混剪 | 素材混剪+配音，适合情感和知识类 |
  | 9 | 录屏 | 屏幕录制+讲解，适合软件教程和数据展示 |
  | 10 | 动画 | 动画/图文动效形式，适合科普和数据可视化 |
  | 11 | 反应 | 看视频/看评论的反应，适合二创和互动 |
  | 12 | 前后对比 | 变化前后对比，适合美妆/装修/健身等 |
  | 13 | POV视角 | 第一人称视角，沉浸式体验 |
  | 14 | 问答 | 一问一答形式，适合知识科普 |
- **每 card 底部** · `👁 适用场景：通用`(eye icon 金色 + 文字金色 · 14 cards 全部"通用")
- **0 交互** · 纯静态展示 · 无按钮 / 无 form / 无 API

### 1.2 现状偏离(致命)

- 旧版 PRD-27 US-003 是 form-submit-style AI 推荐工具(textarea + select + mutation + 推荐高亮 banner) · 跟 sally 真实页 100% 偏离
- 必须**全文删除** PresentStyles.tsx 重写
- 旧 test `__tests__/PresentStyles.test.tsx` 全部失效 · 重写为 sally 真实页静态 assertion

### 1.3 constants 现状

- `lib/constants/present-styles.ts` 已有 `PRESENT_STYLES` 14 项 · `label` / `description` 字段跟 sally 字面 1:1 ✅
- 但缺 `tips` 字段(老版用 · sally 真实页**不展示** tips) → 保留但不渲染
- 需新增 4 常量 · `PAGE_TITLE` / `PAGE_SUBTITLE` / `SCENE_LABEL` / `SCENE_VALUE_DEFAULT`

---

## §2 · schema(无)

纯静态展示页 · 无 schema 改动 · 无 API · 无 DB。

---

## §3 · form 默认值(无)

无 form。

---

## §4 · mock(无)

无 mock · 14 cards 数据来自 `lib/constants/present-styles.ts` 的 `PRESENT_STYLES` 数组。

---

## §5 · sub-component

### 5.1 `StyleCard.tsx`(新建 · `apps/web/src/components/present-styles/`)

```tsx
import { Eye } from 'lucide-react';
import { SCENE_LABEL, SCENE_VALUE_DEFAULT } from '@/lib/constants/present-styles';
import type { Style } from '@/lib/constants/present-styles';

export interface StyleCardProps {
  style: Style;
}

export default function StyleCard({ style }: StyleCardProps) {
  return (
    <div
      className="rounded-xl border border-border bg-card p-6 min-h-[200px] flex flex-col justify-between"
      data-testid={`style-card-${style.id}`}
    >
      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-on-surface">{style.label}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{style.description}</p>
      </div>
      <div className="flex items-center gap-1.5 text-primary text-sm mt-6">
        <Eye className="w-4 h-4" aria-hidden="true" />
        <span>{SCENE_LABEL}：{SCENE_VALUE_DEFAULT}</span>
      </div>
    </div>
  );
}
```

**红线** ·
- `style.label` / `style.description` **直读** constants · 不允许临时 hardcode
- `SCENE_LABEL` + `SCENE_VALUE_DEFAULT` **常量** · 不允许临时 hardcode
- icon 用 `lucide-react` 的 `Eye` · 不允许 emoji 👁
- `data-testid="style-card-${style.id}"` 必含(后续 verify grep 用)

---

## §6 · page 重写

### 6.1 `apps/web/src/pages/tools/PresentStyles.tsx` · 全文 rewrite

```tsx
/**
 * /present-styles · 爆款呈现形式合集 (sally 真实页 1:1 复刻)
 * 14 cards 静态 grid · 0 交互
 */

import StyleCard from '@/components/present-styles/StyleCard';
import { PAGE_SUBTITLE, PAGE_TITLE, PRESENT_STYLES } from '@/lib/constants/present-styles';

export default function PresentStyles() {
  return (
    <main className="flex-1 container py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-on-surface">{PAGE_TITLE}</h1>
        <p className="text-base text-muted-foreground">{PAGE_SUBTITLE}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRESENT_STYLES.map((style) => (
          <StyleCard key={style.id} style={style} />
        ))}
      </div>
    </main>
  );
}
```

**红线** ·
- 旧 file 所有 import / hook / mutation / form / banner / result / Card 子组件 · **全部删除**
- 不允许保留 `data-testid="present-styles-submit"` / `present-styles-result` / `present-styles-fallback-banner` / `present-styles-recommended` 等老 testid
- 不允许保留 `trpc.presentStyles.recommend.useMutation` 调用(但 backend router 保留 · 留给 PRR 评估)
- 不允许保留 `useActiveAccount` / `useSearchParams` / `localStorage` draft 逻辑
- 不允许保留 `text` / `platform` state · 不允许保留 `recommendMutation` / `abortRef`

---

## §7 · 常量

### 7.1 `apps/web/src/lib/constants/present-styles.ts` · 追加 4 常量

在文件末尾 `export const PRESENT_STYLES_MAP = ...` **之后** 追加 ·

```ts
// ── sally 真实页字面常量 (1:1 复刻) ──────────────────────────────────────────
export const PAGE_TITLE = '爆款呈现形式合集';
export const PAGE_SUBTITLE = '掌握各种爆款视频的呈现形式，找到最适合你的内容表达方式';
export const SCENE_LABEL = '适用场景';
export const SCENE_VALUE_DEFAULT = '通用';
```

**红线** ·
- 14 项 `PRESENT_STYLES` **原封不动** · 不允许改 `id` / `label` / `description` / `tips`
- 字面"爆款呈现形式合集" / "掌握各种爆款视频的呈现形式" / "适用场景" / "通用" 必须**逐字**(中文标点全角 · 不允许半角 `,` `:`)
- export name 严守 `PAGE_TITLE` / `PAGE_SUBTITLE` / `SCENE_LABEL` / `SCENE_VALUE_DEFAULT`

---

## §8 · 文件清单

| 文件 | 操作 | 行数估 |
|---|:-:|:-:|
| `apps/web/src/lib/constants/present-styles.ts` | **追加 4 常量** | +6 |
| `apps/web/src/components/present-styles/StyleCard.tsx` | **新建** | ~25 |
| `apps/web/src/pages/tools/PresentStyles.tsx` | **全文 rewrite**(339 → ~20 行) | -319 |
| `apps/web/src/pages/tools/__tests__/PresentStyles.test.tsx` | **全文 rewrite** · 改为 sally 真实页 assertion | ~50 |

**不动** · `apps/api/src/router/present-styles.ts`(backend 保留 · PRR 评估) · `lib/constants/present-styles.ts` 的 `PRESENT_STYLES` / `PRESENT_STYLES_MAP` / `Style` interface(原封不动)

---

## §9 · 验收(5 维度)

### D1 · 字面(必过)

- `grep -F "爆款呈现形式合集" apps/web/src/lib/constants/present-styles.ts` · 1 命中
- `grep -F "掌握各种爆款视频的呈现形式，找到最适合你的内容表达方式" apps/web/src/lib/constants/present-styles.ts` · 1 命中
- innerText grep · 启 dev server + playwright 抓 /present-styles · 必含:
  - `爆款呈现形式合集` · 1 次
  - `掌握各种爆款视频的呈现形式，找到最适合你的内容表达方式` · 1 次
  - 14 个 label · 各 1 次(`口播` / `剧情` / `教程` / `Vlog` / `街访` / `对比测评` / `清单盘点` / `混剪` / `录屏` / `动画` / `反应` / `前后对比` / `POV视角` / `问答`)
  - 14 个 description · 各 1 次
  - `适用场景：通用` · 14 次(每 card 一次)
- 字面命中率 ≥ 99%

### D2 · 视觉

- 3 列 grid(lg breakpoint) · 间距 gap-6
- card 圆角 + 深色 bg + 边框 + padding 大方
- 标题 text-xl bold 白
- 描述 text-sm 灰
- 底部 eye icon(text-primary 金) + scene label(text-primary 金 text-sm)
- 14 cards 顺序严格(口播 → 剧情 → 教程 → Vlog → 街访 → 对比测评 → 清单盘点 → 混剪 → 录屏 → 动画 → 反应 → 前后对比 → POV视角 → 问答)

### D3 · 交互(无)

- 无 form / 无 button / 无 onClick · 纯静态

### D4 · 状态(无)

- 无 state / 无 loading / 无 error / 无 fallback

### D5 · 边界(无)

- 无 API 调用 · 无 db 依赖 · 无 localStorage · 无 URL params

### D6 · typecheck + test

- `pnpm typecheck` 全绿
- `pnpm --filter @quanan/web test PresentStyles` 全绿(新 test 跑通)

---

## §10 · Sonnet 流程(5 步)

1. **追加** `lib/constants/present-styles.ts` · 末尾加 4 常量(`PAGE_TITLE` / `PAGE_SUBTITLE` / `SCENE_LABEL` / `SCENE_VALUE_DEFAULT`)字面逐字 · 不动 `PRESENT_STYLES` 数据
2. **新建** `apps/web/src/components/present-styles/StyleCard.tsx` · 按 §5.1 模板字面写
3. **全文 rewrite** `apps/web/src/pages/tools/PresentStyles.tsx` · 按 §6.1 模板 · 删尽老 form/mutation/banner
4. **全文 rewrite** `apps/web/src/pages/tools/__tests__/PresentStyles.test.tsx` · 简化为 ·
   ```tsx
   import { render, screen } from '@testing-library/react';
   import { MemoryRouter } from 'react-router-dom';
   import PresentStyles from '@/pages/tools/PresentStyles';
   import { PRESENT_STYLES } from '@/lib/constants/present-styles';

   describe('PresentStyles · sally 真实页 1:1', () => {
     it('renders page title + subtitle', () => {
       render(<MemoryRouter><PresentStyles /></MemoryRouter>);
       expect(screen.getByText('爆款呈现形式合集')).toBeInTheDocument();
       expect(screen.getByText('掌握各种爆款视频的呈现形式，找到最适合你的内容表达方式')).toBeInTheDocument();
     });
     it('renders 14 style cards in order', () => {
       render(<MemoryRouter><PresentStyles /></MemoryRouter>);
       PRESENT_STYLES.forEach((s) => {
         expect(screen.getByText(s.label)).toBeInTheDocument();
         expect(screen.getByText(s.description)).toBeInTheDocument();
       });
     });
     it('renders 14 scene labels (适用场景：通用)', () => {
       render(<MemoryRouter><PresentStyles /></MemoryRouter>);
       const scenes = screen.getAllByText(/适用场景：通用/);
       expect(scenes).toHaveLength(14);
     });
   });
   ```
   - 删旧 `renderPresentStyles` helper · 删 trpc mock · 删 `present-styles-submit` 等老 testid 断言
5. **跑** ·
   - `pnpm typecheck`(全 monorepo)· 必绿
   - `pnpm --filter @quanan/web test PresentStyles` · 必绿
   - 报告执行结果

---

## §11 · 红线(违反 = reject)

1. ❌ 不允许保留旧 form / textarea / select / button / mutation / banner / result 任何残留
2. ❌ 不允许临时 hardcode `'爆款呈现形式合集'` 等字面 · 必走 `PAGE_TITLE` 常量
3. ❌ 不允许临时 hardcode `'通用'` / `'适用场景'` · 必走 `SCENE_VALUE_DEFAULT` / `SCENE_LABEL` 常量
4. ❌ 不允许用 emoji 👁 · 必用 lucide-react `Eye` 组件
5. ❌ 不允许改 `PRESENT_STYLES` 14 项的 `id` / `label` / `description` · 已 1:1 字面对照
6. ❌ 不允许在 page 文件直接 map cards(必须抽 StyleCard 子组件 · 见 §5.1)
7. ❌ 不允许中文标点变半角 · "适用场景：通用" 必须全角 `：` · 不允许半角 `:`
8. ❌ 不允许加额外字段渲染(tips / matchScore / rationale 等老字段) · sally 真实页只有 label / description / scene
9. ❌ 不允许新增 backend router 调用 · 纯前端静态

---

## §12 · 报告(Sonnet 干完后回填)

```yaml
status: <pending|done|blocked>
files_changed:
  - <path> · <+lines / -lines>
typecheck: <pass|fail>
test_run: <pass|fail> · <N passed / N failed>
playwright_grep: <待 Opus verify>
notes: <异常 / 偏离 / 决策>
```
