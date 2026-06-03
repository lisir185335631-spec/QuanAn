# step-3 / account-package-output Specification(sample · 1 of 7 H3 输出区)

> **派生** · ai-website-cloner-template SKILL.md §Phase 3 Step 2 Template
> **本 spec sample** · /step/3 第 1 个 H3 输出区(`账号包装方案`)· 用 cloner template 完整 fill
> **后续 6 个 H3 输出区** · 每个独立 spec file(视频参考案例 / 昵称推荐 / 头像设计方案 / 背景图设计方案 / 简介文案方案 / 整体包装策略)· 模板相同 · 内容字面替换
> **本 spec 长度** · ~120 行 · 符合 cloner < 150 行规则

---

## Overview

- **Target file**: `apps/web/src/components/step3/AccountPackageOutput.tsx`(新建 · sub-component)
- **Wrapper file**: `apps/web/src/pages/step/Step3.tsx` 引入并 wire
- **Screenshot**: `docs/research/aiipznt/step-3/screenshots/desktop-1440-state-a-empty.png` (crop 第 1 个 H3 输出区)
- **Interaction model**: **click-driven**(3 button action) + **conditional content fill**(submit 后由 tRPC mutation result 注入 body)
- **Ralph US**: PRD-29-US-002(假定 US-001 是 Foundation 通项)
- **Risk level**: **medium**(view-layer · 不动 backend · 但 7 个同款 · 模板正确性影响 6 个下游 spec)
- **anti_patterns** 注入(from reject 库): "don't render conditional H3 only after submit · render placeholder by default · 1:1 with aiipznt state A" / "don't use `→` arrow on button labels · severe 字面 drift"

---

## DOM Structure

```
<section class="glass-card rounded-xl border border-primary/15 p-6 mb-4">
  <header class="flex items-center justify-between mb-4">
    <h3 class="font-display text-lg font-bold text-foreground">账号包装方案</h3>
    <div class="flex gap-2">
      <button>复制</button>
      <button>重新生成</button>
      <button>智能优化</button>
    </div>
  </header>
  <div class="content prose-sm text-muted-foreground min-h-[120px]">
    {body || <EmptyPlaceholder text="点击上方"生成账号包装方案"按钮 · 生成内容将在此显示" />}
  </div>
</section>
```

---

## Computed Styles(exact values from aiipznt getComputedStyle · State A · viewport 1440)

### `<section>` 容器(glass-card)
- display: block
- padding: 24px (= p-6)
- marginBottom: 16px (= mb-4)
- borderRadius: 12px (= rounded-xl)
- border: 1px solid `oklch(0.16 0.01 75)` (推断 · 实际 spike 没单独抓此 selector · PRD-29 Phase 1 补)
- backgroundColor: `oklab(0.16 0.00258819 0.00965926 / 0.5)` (glass-card 半透明)
- backdropFilter: blur(20px)
- boxShadow: `0 4px 20px rgba(0,0,0,0.1)` 推断

### `<header>` 内
- display: flex
- justifyContent: space-between
- alignItems: center
- marginBottom: 16px (= mb-4)

### `<h3>账号包装方案</h3>`
- fontFamily: Orbitron, Rajdhani, "Noto Sans SC", system-ui
- fontSize: 18px (= text-lg)
- fontWeight: 700 (= font-bold)
- color: `oklch(0.92 0.02 85)` (aiipznt 浅金色 · 同 H1)
- lineHeight: 28px

### 3 button(`复制` / `重新生成` / `智能优化`)
- shadcn `<Button variant="outline" size="sm">` 默认样式
- 字面字符严守:`复制` / `重新生成` / `智能优化`(**无 `→` 箭头** · **无 emoji**)
- 不允许 QuanAn 加 `→` `✨` 等装饰
- 排列:gap-2 横排

### `<div>` content body
- 最小高度:min-h-[120px](防止空 placeholder 高度坍塌)
- fontSize: 14px (= text-sm)
- color: text-muted-foreground (空时)/ text-foreground (有内容时)
- whiteSpace: pre-wrap(支持 LLM 生成的换行)

---

## States & Behaviors

### A · 空 placeholder(default render · 用户尚未 submit)
- Trigger: 页面初始加载
- 内容:`<EmptyPlaceholder text="点击上方"生成账号包装方案"按钮 · 生成内容将在此显示" />`
- 3 button 显示 + 可点击(但 `复制` `重新生成` 在无内容时灰化 disabled)· `智能优化` disabled
- 视觉:整个 section 显示 + body 区灰文字 placeholder · 高度 120px+

### B · 内容填充(`generateAccountPackage` mutation success 后)
- Trigger: `trpc.step3.generatePackage.mutate({ ... })` resolve
- State A → State B 由 mutation 数据 trigger:
  - body 文本从 `null` 变 `data.outputs.accountPackage`(LLM 生成)
  - 3 button 解灰(可点击)
  - 转场:opacity 0.5 → 1 · transition: opacity 0.3s ease(渐显)

### C · 单独重新生成(`重新生成` button click)
- Trigger: onClick `重新生成`
- 行为:仅本 H3 区 re-mutation(`trpc.step3.regenerateSection.mutate({ section: 'accountPackage' })`)
- 视觉:body 区显示 spinner · 完成后 fade 回 State B
- transition: opacity 0.3s

### D · `复制` button click
- Trigger: onClick `复制`
- 行为:`navigator.clipboard.writeText(body)` · sonner toast `已复制到剪贴板`(bottom-right)
- 视觉:button 短暂显示 `✓ 已复制`(2s) · 然后回 `复制`

### E · `智能优化` button click
- Trigger: onClick `智能优化`
- 行为:`trpc.step3.optimizeSection.mutate({ section: 'accountPackage', currentText: body })` · 替换 body
- 视觉:同 C · 转场动画一致

### Hover states
- 整个 `<section>` hover · border-color 从 `oklch(0.16 0.01 75)` → `oklch(0.22 0.02 85)`(轻金色高亮) · transition: border-color 0.2s
- 3 button hover · shadcn 默认 outline hover(bg-accent · text-accent-foreground)

---

## Per-State Content

### State A(空):
- body: `<EmptyPlaceholder text="点击上方"生成账号包装方案"按钮 · 生成内容将在此显示" />`

### State B(有内容 · 由 mutation 注入):
- body: LLM 生成文本 · 通常 200-500 字 · 含 ##/### 子标题(markdown)· StreamdownPreview 渲染

---

## Assets

- 共享 glass-card utility(已有 · `apps/web/src/styles/globals.css` `.glass-card`)
- shadcn `<Button>`(已有)
- 自定义 `<EmptyPlaceholder>`(可能新建 · 或复用 `apps/web/src/components/states/`)

---

## Text Content(verbatim · 不许 paraphrase)

- H3: `账号包装方案`(**严守 · 不能改 `账号包装方案 →` 或其他**)
- Empty placeholder: `点击上方"生成账号包装方案"按钮 · 生成内容将在此显示`(待 Phase 1 Phase 1 补抓 aiipznt 实际 placeholder · 当前是推测)
- Button labels: `复制` · `重新生成` · `智能优化`(**严守 · 不加 `→` `✨` 等装饰**)
- Toast: `已复制到剪贴板`(spike 没抓 · 推测 · 待 Phase 5 verify)

---

## Responsive Behavior

- **Desktop 1440**:single column · `<section>` 宽 = container max-width(估 992px per H1 width)· padding 24px
- **Tablet 768**:single column · padding 16px · button 行可能 wrap
- **Mobile 390**:single column · padding 12px · 3 button stack vertical(若不 fit · cloner SKILL.md §1.5 mobile-first)
- **Breakpoint**:layout 单列保持 · 仅 padding + button 排列变 · 估 ~640px(`sm:`)

---

## QuanAn 实施改动清单(builder agent 输入)

1. **新建** `apps/web/src/components/step3/AccountPackageOutput.tsx`(本 spec 描述)
2. **修改** `apps/web/src/pages/step/Step3.tsx` 引入 + wire mutation(在 form 下方 vertical stack 渲染 7 个 H3 输出区)
3. **依赖确认** · `apps/web/src/components/ui/button.tsx`(shadcn · 已有)· glass-card utility(已有)
4. **新建** `apps/web/src/components/states/EmptyPlaceholder.tsx`(若不存在 · 通用空态)
5. **mutation contract** · `trpc.step3.generatePackage` 已有(PRD-15 沉淀 · spike 不验)· 仅消费 `data.outputs.accountPackage` 字段
6. **测试** · `apps/web/src/components/step3/__tests__/AccountPackageOutput.test.tsx`(渲染 + 3 button 行为 + State A/B 切换 · vitest + RTL)
7. **e2e** · `tests/e2e/prd-29-step-3-output-h3.spec.ts`(待 PRD-29 收官 US 加 · 不在本 US scope)

---

## Pre-Dispatch Checklist(builder agent 收 spec 前必勾)

- [x] Spec file 写到 `docs/research/aiipznt/components/step-3-account-package-output.spec.md` · 所有 section fill
- [x] 每个 CSS 值标注来源(getComputedStyle 已抓 / Phase 1 待补 / 推断)
- [x] Interaction model identified(`click-driven` + `conditional content fill`)
- [x] Stateful 组件每 state 都记(A / B / C / D / E 共 5 state)
- [x] hover state 前后值 + transition timing 记
- [x] section 全 image 都识别(无图片 · 仅 utility class)
- [x] Responsive behavior desktop + tablet + mobile 都记
- [x] Text content verbatim · 不 paraphrase
- [x] Builder prompt < 150 行(本 spec 约 120 行)

---

> **本 sample spec 由 Opus 4.7 在 2026-05-23 BJT spike PRD-29 时写 · 演示 cloner SKILL.md §Phase 3 Step 2 在 QuanAn 适配后的样式 · 后续 6 个 H3 输出区 spec 文件按相同模板 · 仅替换 H3 文字 + body placeholder + mutation field name**
