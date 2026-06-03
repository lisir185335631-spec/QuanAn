# PRD-35 收官 · 全站完成度验收 baseline

> **日期** · 2026-06-01
> **分支** · `ralph/prd-29.6-step3-buttons-llm-config`(领先 main 70 提交 · 0 落后 · 0 冲突)
> **目的** · 在「aiipznt 全站页面复刻完成(34 路由)」宣告后,建立**客观、可复现**的全站 done 证据,作为 merge / PRD-35 性能·SEO 收官的前置基线。
> **结论** · ✅ **全站页面渲染完整、内容充实、关键数据流贯通**;⚠️ 仅余 1 项 pre-existing 后端 lint 债(与页面无关)。

---

## 1. 验收范围

- **32 真实路由** · home / guide / step{1,3,3b,4,4b,5,6,7,8} / 14 工具页 / 6 模块页 / ip-plan
- **4 故意 404** · /step/2 · /step/9 · /copywriting · 随机路径(与 sally aiipznt 一致 · catch-all 接管)
- 来源 · `apps/web/src/router.tsx`(34 route 定义)

## 2. 静态 / 测试 gate

| Gate | 命令 | 结果 |
|---|---|:-:|
| Typecheck(全 monorepo) | `pnpm -r typecheck` | ✅ web + admin + api 全 Done |
| Web 单测(页面级证据) | `pnpm --filter @quanan/web test` | ✅ **940/940**(82 文件) |
| Lint · web | `pnpm --filter @quanan/web lint` | ✅ 通过 |
| Lint · admin | `pnpm --filter @quanan/admin lint` | ✅ 通过 |
| Lint · **api** | `pnpm --filter @quanan/api lint` | ❌ **92 error / 36 文件**(见 §4) |

## 3. 站级 smoke + 逐页截图

- **脚本** · `scripts/site-smoke.mjs`(Playwright · 1440×900 · 每页检查 空白 / error-boundary / 误 404 / 未捕获异常 / console error + 全页截图)
- **结果** · ✅ **36/36 ok**(真实 32/32 渲染健康 · 404 4/4 正确)· 0 空白 · 0 error boundary · 0 未捕获异常
- **截图** · `/tmp/quanan-smoke/shots/*.png`(36 张) · `summary.json` 含逐页指标

### 人工视觉抽检(用户特别关注的 PRD-30 三页)

| 页面 | 确认 |
|---|---|
| `/step/3b` 个人定位深化 | ✅ form + 平台 radio + 金色 CTA + 多 H3 输出区 · 内容充实 |
| `/step/4b` 变现路径规划 | ✅ 3 阶梯 + 收入结构 + 成功案例 · 内容充实 |
| `/evolution` 智能体进化中心 | ✅ L1 进化等级 + 4 指标卡 + 进化洞察/反馈 + **深度学习档案 1 条真实 DB 记录** · 数据流(web→api→DB)端到端贯通 |

## 4. 唯一缺口 · api lint 债(pre-existing · 非本轮引入)

- **92 error / 36 文件** · 规则分布:`no-unsafe-member-access`×35 · `no-misused-promises`×8 · `no-unsafe-argument`×7 · `consistent-type-imports`×7 · `require-await`×6 · 其余零散
- **溯源** · `git log main..HEAD -- apps/api/src/jobs/admin/ apps/api/src/lib/env.ts` **为空** → 本分支未触碰这些文件;`git show main:...ab-stop-loss.job.ts` 在 main 上已有同样 `import('@prisma/client')` 触发项 → **债务在 main 既存**,与 PRD-29.x / 30 页面复刻无关。
- **影响** · 不影响页面完成度。仓库**无 GitHub CI**(`.github/workflows/` 空)· husky lint-staged 仅校验**已暂存**改动 · 且债务既存于 main → **不阻塞 merge**;属独立后端质量债,可择期清理。

## 5. 验收结论

| 维度 | 判定 |
|---|:-:|
| 全站页面**渲染完整**(32/32) | ✅ 已验证 |
| 全站页面**内容充实**(非空壳) | ✅ 已验证(自动 textLen + 人工抽检) |
| 关键**数据流贯通**(evolution 真实 DB) | ✅ 已验证 |
| 页面层 typecheck / test / lint | ✅ 全绿 |
| 像素级 visual 对账(vs aiipznt) | ⬜ **未做**(PRD-35 待办 · 本基线只验渲染健康,不验像素 parity) |
| api 后端 lint 债清零 | ⬜ 未做(pre-existing · 与页面无关) |

> **可信度声明** · 本基线证明「**所有页面都能正常渲染且内容完整**」,**不**等同于「像素级 1:1 对齐 aiipznt」。后者是 PRD-35 visual audit 的独立任务。

---

## 6. 建议的后续动作(PRD-35)

1. **(可选)清 api lint 债** · 92 error · 多数 `eslint --fix` 不可自动修(类型不安全需手动)· 1-2 session · **解锁 clean merge**
2. **visual audit** · quanan vs aiipznt 34 路由像素对账 · 建 baseline + diff 阈值
3. **性能** · Lighthouse 90+ · bundle 体积(已有 manualChunks)
4. **SEO** · meta / sitemap / OG
5. **merge** · 70 提交 → main(0 冲突 · 可直接合)· 建议 lint 债处理后或显式豁免

*生成 · 2026-06-01 · 全站验收 baseline · gate + smoke + 人工抽检三重证据*
