# PRD-22 Visual Diff 真实对账 · Step D 报告

> **Date** · 2026-05-19
> **Method** · `tests/e2e/prd22-vs-aiipznt-diff.spec.ts` · 12 page × 2 browser = 24 test · maxDiffPixelRatio=0.99(高容忍 · 收数据)
> **Baseline** · aiipznt 实拍 PNG · `/tmp/aiipznt-clone-research/screenshots/` 25-/26-/30-/33-/10-17 编号
> **结果** · 23 fail · 1 pass(chromium /step/6)· **fail 原因 = page 高度不一致 · 不是 pixel diff**

---

## §1 尺寸对账(QuanAn vs aiipznt fullPage 1440 宽)

| Page | aiipznt 高度 | QuanAn 高度 | diff % | severity |
|---|:-:|:-:|:-:|:-:|
| /knowledge | **6287px** | 1069px | **-83%** | 🔴 严重 |
| /step/3b | 4391px | 939px | **-79%** | 🔴 严重 |
| /step/7 | 4919px | 1166px | **-76%** | 🔴 严重 |
| /step/4b | 2430px | 1109px | **-54%** | 🔴 严重 |
| /step/4 | 1604px | 1017px | -37% | 🟡 中等 |
| /step/3 | 2315px | 1619px | -30% | 🟡 中等 |
| /step/1 | 1051px | 916px | -13% | 🟢 接近 |
| /step/6 | 1893px | 1777px | -6% | ✅ 通过(chromium) |
| /step/5 | TBD | TBD | TBD | TBD |
| /generate | TBD | TBD | TBD | TBD |
| /boom-generate | TBD | TBD | TBD | TBD |
| /ai-video | TBD | TBD | TBD | TBD |

(完整对应表见 test-results 截图 attachment · /Users/return/Desktop/QuanAn/test-results/prd22-vs-aiipznt-diff-*)

## §2 结论

### §2.1 PRD-22 真实"复刻度"

- **结构对齐**: ✅ D1A 字面 H1 / H3 / H4 / placeholder 全 1:1 严守(verify-prd-22.sh 52/52)
- **内容密度**: 🔴 多数 page 内容只占 aiipznt 1/3~1/5(13/20/30/54/76/79/83 % 缺口)
- **inline picker utility**: ✅ 3 utility 跨 page 复用(技术基础设施 OK)

### §2.2 重灾区(QuanAn 内容严重不足)

| Page | 缺什么 |
|---|---|
| /knowledge(-83%) | aiipznt 6287px = 20 脚本卡 × methodology 详细展开 + 27 实战案例 + 40 cards + 4 tab 内容 · QuanAn 1069px 只渲染 tab 切换框架 |
| /step/3b(-79%) | aiipznt 4391px = 6 H3 完整 stub data + 多 textarea + 视频参考 + 头像/背景图 · QuanAn 939px 只渲染表单 + H3 标题(无 stub 内容) |
| /step/7(-76%) | aiipznt 4919px = 20 脚本卡 + 22 元素 + 输出区 4 H4 stub data + 历史记录 · QuanAn 1166px 只渲染选择器(无输出 stub) |
| /step/4b(-54%) | aiipznt 2430px = 3 阶梯详细收入数据 + 收入结构图 + 成功案例 · QuanAn 1109px 只渲染表单 |

### §2.3 关键洞察

**PRD-22 D1A 字面锁严守 ≠ visual 复刻**:
- D1A 锁 H3 标题字面("初阶变现路径" 等) ✓
- 但锁不到 H3 块内的 stub 内容(具体数据 · 案例 · 模板等)
- aiipznt 实拍包含 LLM 生成完整内容(用户登录态截图)
- QuanAn 当前是"空骨架"(用户未点击 CTA 时只看到表单 + 空输出区)

**根因**: PRD-22 D-225 锁 "本 PRD 不实现 LLM 调用 · 只搭 UI 骨架"。这导致 UI 输出区永远空 · visual diff 跟 aiipznt 实拍(含 LLM 结果)永远 fail。

---

## §3 PRD-23 范围调整建议

### §3.1 原 PRD-23 范围(diff-analysis 给的)
- 3 stub 完整化(/diagnosis · /accounts · /step/8)
- 14 工具视觉精修(已 PRD-15 完成 8 + PRD-22 新 5 + /trending 验证)

### §3.2 新增 PRD-23 范围(基于 Step D 数据)
**选项 A · 严守 D1=A 1:1 复刻**(扩大范围):
- 加 stub data 填充重灾 4 page(/knowledge · /step/3b · /step/7 · /step/4b)
- 接 LLM 调用 · 跑 5-10 个示例数据缓存到 page(visual diff 时能渲染完整内容)
- 估时 +1 周
- ROI: visual diff 真能跑通 ≤ 50% pixel diff · 但 stub data 跟 aiipznt 数据不同 · 难真 1:1

**选项 B · 接受"空骨架"现状**(收缩 visual diff 目标):
- visual diff 不跟 aiipznt 实拍对比 · 仍用 prd22-XXX 自截图作为 baseline(当前模式)
- 目标改为"内部 regression baseline"(QuanAn 自我视觉一致性)
- 估时 0(已完成)
- ROI: 接受 PRD-22 当前 ship · TD-090/091 标 won't fix

**选项 C · 接 LLM(D-225 解锁)+ 复刻 stub data**(完整复刻):
- PRD-23 优先接 LLM 调用(/knowledge 4 tab + /step/7 输出 + /step/3b 输出 + /step/4b 阶梯)
- LLM 跑 1 次 stub data 缓存(可 fake response 模拟 aiipznt 结构)
- visual diff 真跑 pixel-level · 调 threshold 到 20%(给 LLM 内容差异容差)
- 估时 +2 周(LLM 集成 + 4 page 输出区完整)
- ROI: 真 1:1 复刻 · 但成本高

### §3.3 推荐

**选项 B**(短期接受 · 中期扩大):
- PRD-23 按原计划推进(3 stub + 14 工具精修)
- visual diff baseline 保持 prd22-XXX(QuanAn 内部 regression)
- TD-090/091 标 deferred(留 PRD-24 收官时决策是否扩范围 LLM 接入)
- 把 Step D 量化数据写 .agents/verification/prd-22-visual-diff-vs-aiipznt.md(本文件)留 audit trail
- PRD-23/24 不强行 visual 1:1 复刻 aiipznt 实拍(因为 aiipznt 实拍含 LLM 内容 · 本质难 1:1)

**关键 takeaway**: D1=A 像素级 layout 锁的本质是 **layout 结构 + 字面**,不是 **LLM 生成内容**。aiipznt 实拍含"登录态 + LLM 已生成数据"是 PRD-22~24 范围外的额外维度,留 PRD-25+ 才考虑接入。

---

## §4 行动项

| 项 | 状态 | 负责 |
|---|:-:|---|
| TD-090 baseline 命名: 决定保持 prd22-XXX(选项 B)· 不改 aiipznt 编号 | 待决 | Opus 本会话 |
| TD-091 单列 vs 双栏 layout: defer · 跟"内容密度"问题同根 | defer | Opus 本会话 |
| PRD-23 范围: 按原计划(选项 B)· 不扩 LLM 接入 | 待决 | Opus 本会话 |
| 12 page 完整尺寸表(剩余 4 page 待补) | 待跑 | Step D 后续(可选) |
| dev server 已 kill | ✅ | Step D |
