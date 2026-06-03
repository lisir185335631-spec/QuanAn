# /step/3 账号包装方案 · Page Topology

> **派生** · ai-website-cloner-template SKILL.md §Phase 1.4 Page Topology · 本文是 builder 的 assembly blueprint
> **生成** · 2026-05-23 BJT · spike-step3-recon.mjs
> **viewport baseline** · 1440x900 desktop(已抓 tablet 768 + mobile 390 待 visual 对照)
> **State** · A 空表单(606 els · 7 H3) · B 填表(同) · C 提交后(183 els · 0 H3 · 跳 generation pending state)

---

## §0 视觉顺序(从上到下)

```
┌────────────────────────────────────────────────────────────────────────┐
│ Header(全 32 page 共享 · 不在本 page scope · /clone-aiipznt skill 不动) │
│   logo · 4 一级 dropdown · AccountSwitcher · UserChip · Logout         │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│ ★ 1. PageHeader · H1 + STEP_TAG + Subtitle                              │
│   `STEP 03 · 账号包装方案`(label-sm Orbitron · text-primary)            │
│   `<h1>账号包装方案</h1>` (Orbitron 30px / 700 / 36px lh)               │
│   "AI 智能生成账号包装方案 · 含昵称 / 头像 / 简介 / 背景图"               │
├────────────────────────────────────────────────────────────────────────┤
│ ★ 2. UserBackgroundTextarea · 个人背景描述                              │
│   <textarea> 必填 · placeholder "详细描述你的个人背景 · 专业技能 · 从业  │
│   经验 · 擅长领域 · 个人特点等。\n\n示例:我是一名有10年经验的美容师..." │
│   宽度 942px · 高 78px · minHeight 64px                                  │
├────────────────────────────────────────────────────────────────────────┤
│ ★ 3. PlatformRadioGroup · 5 平台选择                                    │
│   `📱 抖音` `📕 小红书` `📺 视频号` `🎬 快手` `📺 B站` 一排                │
│   单选 · 高亮选中状态                                                    │
├────────────────────────────────────────────────────────────────────────┤
│ ★ 4. TargetAudienceInput · 目标受众                                     │
│   <input type=text> placeholder "你想吸引什么样的粉丝?"                  │
├────────────────────────────────────────────────────────────────────────┤
│ ★ 5. AccountStatusInput · 账号情况                                      │
│   <input type=text> placeholder "新账号/已有账号的粉丝量等"               │
├────────────────────────────────────────────────────────────────────────┤
│ ★ 6. PrimaryGenerateCTA · 主 CTA                                        │
│   `[生成账号包装方案]` 金色 gradient button(QuanAn 现 `进入 IP 定位 →`)  │
├────────────────────────────────────────────────────────────────────────┤
│ ★ 7. BulkActionsToolbar · 7 H3 输出区上方工具栏(默认隐藏 · stub 时显示) │
│   `[一键重新生成]` `[复制全部]`                                          │
├────────────────────────────────────────────────────────────────────────┤
│ ★ 8. 7 H3 输出区(default 空 placeholder + 各 [复制] [重新生成] [智能优化]) │
│   <h3>账号包装方案</h3>      + body placeholder + 3 button              │
│   <h3>视频参考案例</h3>      + body placeholder + 3 button(含 `生成参考图`) │
│   <h3>昵称推荐</h3>          + body placeholder + 3 button              │
│   <h3>头像设计方案</h3>      + body placeholder + 3 button(含 `生成参考图`) │
│   <h3>背景图设计方案</h3>    + body placeholder + 3 button              │
│   <h3>简介文案方案</h3>      + body placeholder + 3 button              │
│   <h3>整体包装策略</h3>      + body placeholder + 3 button              │
├────────────────────────────────────────────────────────────────────────┤
│ (无 footer · 直接 main 容器结束)                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## §1 Interaction Model 分类(per cloner SKILL.md Principle 6)

| Section | INTERACTION_MODEL | 触发机制 |
|:-:|---|---|
| 1 PageHeader | **static** | - |
| 2 UserBackgroundTextarea | **input-driven** | textarea onChange |
| 3 PlatformRadioGroup | **click-driven** | radio onClick · 高亮 active 平台 + 后续 generate 时随附 |
| 4 TargetAudienceInput | input-driven | - |
| 5 AccountStatusInput | input-driven | - |
| 6 PrimaryGenerateCTA | **click-driven** | onClick → submit form → trigger generation |
| 7 BulkActionsToolbar | **conditional render** | 仅 generation 完成后显示(stub 阶段可一直显示) |
| 8 H3 输出区 × 7 | **conditional content + click-driven action** | 默认空 placeholder · 用户 submit 后填充 · 每个 H3 内的 [复制] [重新生成] [智能优化] 是 click-driven |

⚠️ **关键 anti-pattern 避免** · 不要把 7 H3 输出区做成 scroll-driven 或 IntersectionObserver-driven · aiipznt 实测是默认渲染(state A 606 els · 包含 7 H3 placeholder) + content conditional fill。

---

## §2 Dependencies between sections

- 6 PrimaryGenerateCTA → 8 H3 输出区(submit 后 fill content · 不是创建)
- 3 PlatformRadioGroup → 6 CTA(平台值是 submit payload 一部分)
- 2/4/5 inputs → 6 CTA(payload 必填)
- 7 BulkActionsToolbar → 8 H3 输出区(一键重新生成 = 触发全 7 个区 re-fill)

---

## §3 Sub-component complexity assessment

| Section | 复杂度 | 拆为 ralph US 数 | 备注 |
|:-:|:-:|:-:|---|
| 1 PageHeader | simple | 0(并入 wrapper) | 现有 page 已有 H1 · 字面校准即可 |
| 2 UserBackgroundTextarea | simple | 0 | shadcn `<Textarea>` 直用 |
| 3 PlatformRadioGroup | medium | **1** | 新组件 · `platforms.ts` 加 emoji 字段 · 5 平台 emoji + radio 行为 |
| 4 TargetAudienceInput | simple | 0 | shadcn `<Input>` 直用 |
| 5 AccountStatusInput | simple | 0 | shadcn `<Input>` 直用 |
| 6 PrimaryGenerateCTA | simple | 0 | shadcn `<Button>` + 字面校准 |
| 7 BulkActionsToolbar | simple | 0(并入 wrapper) | 2 button + 字面 |
| 8 H3 输出区 × 7 | **复杂** | **7 US** | 每 H3 一个组件 · 各 placeholder + 3 button + 复制 / 重新生成 / 智能优化 / 生成参考图 |
| Wrapper Step3.tsx | medium | **1** | 把 form + 7 输出区 wire 起来 · 调 tRPC + state management |

**总 ralph US = 9**(1 platform + 7 输出区 + 1 wrapper)。

---

## §4 跟 QuanAn 现有 /step/3 的 gap

| 维度 | aiipznt | QuanAn 现有(apps/web/src/pages/step/Step3.tsx 475 LOC) | Gap |
|---|---|---|---|
| 7 H3 输出区(默认 placeholder) | 全 7 个 H3 在 default state 渲染 | 0 H3(可能输出区是 conditional · 仅 submit 后才显示) | ❌ 全缺 |
| 5 平台 emoji radio | `📱抖音 📕小红书 📺视频号 🎬快手 📺B站` | 无 emoji(`platforms.ts` 没 emoji 字段) | ❌ emoji 字面缺 |
| H1 字面 | `账号包装方案` | `账号包装方案` | ✅ 一致 |
| Primary CTA button label | `生成账号包装方案` | `进入 IP 定位 →`(STEP1_NEXT_LABEL?)| ❌ 字面 drift 严重 |
| Per H3 区 3 button | `复制` / `重新生成` / `智能优化`(部分 H3 加 `生成参考图`) | 缺 | ❌ |
| BulkActionsToolbar | `一键重新生成` / `复制全部` | 缺 | ❌ |
| textarea placeholder | `详细描述你的个人背景...示例:我是一名有10年经验的美容师...` | (待 verify) | ⚠️ |
| target audience input placeholder | `你想吸引什么样的粉丝?` | (待 verify) | ⚠️ |
| account status input placeholder | `新账号/已有账号的粉丝量等` | (待 verify) | ⚠️ |

**结论** · 9 项 gap · 全部修复 = ralph 9 US。

---

## §5 Asset 清单

aiipznt /step/3 page 不含特殊图片 · 主要是 ·
- Header logo(共享 · 不在 page scope)
- glass-card background pattern(共享 · `data-grid-bg`)
- Lucide icons(已有 lucide-react)

**Phase 2 Foundation 阶段** · 5 平台 emoji 是 unicode 字符 · 不是图片 · 直接在 constants 加。

---

## §6 Responsive Behavior(待 visual 对照 · spike Phase 1 已抓 768 + 390 截图)

由 spike Phase 1 screenshots(`screenshots/tablet-768-state-a-empty.png` + `screenshots/mobile-390-state-a-empty.png`)对照 desktop · 写完整 responsive spec。

预期(per cloner SKILL.md §1.6 mobile-first):
- desktop · form 单列 · 7 输出区 vertical stack
- tablet · 同 desktop · 仅 padding 缩小
- mobile · form 单列 · 输出区 vertical stack · button stack(原横排改竖排)

---

> **本 PAGE_TOPOLOGY 由 Opus 4.7 在 2026-05-23 BJT spike PRD-29 时写 · 是 /step/3 1:1 复刻的 assembly blueprint · 后续 ralph US Developer prompt 必 inline 引用此文件 + 各 sub-component spec file**
