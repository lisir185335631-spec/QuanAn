# /analysis · 文案结构分析 · 1:1 复刻 SPEC

> **来源** · aiipznt.vip/analysis(sally zhao demo · 4 张截图:表单态 + 综合评分 + 多维度/结构 + 元素/优劣/建议)
> **方式** · Opus 直写(已完成字段提取 · 无 Sonnet 转手) · mock-first · 2026-06-01
> **现状** · 旧 PRD-25 `trpc.analysis.analyze` 内联版整页重写

---

## 1 · 工程约束
- 复用既有克隆范式:薄 `Analysis.tsx` orchestrator + `lib/constants/analysis.ts`(全 verbatim) + `pages/tools/components/analysis/` 子组件
- mock-first:默认 mock 直出(form 预填 797 字 + 结果区常驻) · 不调 trpc · 交互按钮 → sonner toast
- 不动 router.tsx / tools/index.ts(default export 名不变) / apps/api
- accent / 配色用 Tailwind 内置 palette(green/red/amber/orange/yellow-500)+ 项目 token(primary/on-surface/muted-foreground)
- ❌ 红线:不改写 mock 字符 · 不加 uppercase class · 保留全角标点『』（）# · lucide 线性 icon(非 emoji)

## 2 · 页面结构(9 区块 · 单列 stack)
| # | 区块 | 组件 | 要点 |
|:-:|---|---|---|
| 1 | Header | AnalysisHero | H1 文案结构分析 + 副标题 |
| 2 | 输入卡 | AnalysisInputCard | textarea(797 字默认)+ `{n} 字` 计数 + 🔍开始分析 |
| 3 | 综合评分 | AnalysisScoreCard | 大号金色 92 + 综合评分 |
| 4 | 多维度评分 | AnalysisDimensions | BarChart3 icon + 5 绿条(2 列):开头吸引力95/情感张力88/节奏感90/完播率预测92/爆款元素运用93 |
| 5 | 结构拆解 | AnalysisStructure | 起承转合 4 卡 · accent 左边框(orange/amber/yellow/green)+ X分 + 起.类型 + 描述 |
| 6 | 爆款元素 | AnalysisElements | 10 金边 chip |
| 7 | 优点/不足 | AnalysisProsCons | 2 列:优点(绿 ✓ 6 条 +)/ 不足(红 ⚠ 2 条 −) |
| 8 | 优化建议 | AnalysisSuggestions | 金卡 💡 + 3 numbered |
| 9 | 反馈 | AnalysisFeedback | 这个结果对你有帮助吗？👍👎 |

## 3 · 字面真相源
全部 verbatim 文案集中在 `apps/web/src/lib/constants/analysis.ts`:
- `ANALYSIS_DEFAULT_COPY`(797 字 · 截图可见尾段「在于，你有没有看到这个趋势…」+ 评论区引导 + 话题标签逐字 · 头段按 SOP L9 同风格补全:美业 AI主导 vs 人情味 正反辩论)
- `ANALYSIS_OVERALL_SCORE=92` · `ANALYSIS_DIMENSIONS`(5) · `ANALYSIS_STRUCTURE`(4 起承转合 · 仅 起 有 type)· `ANALYSIS_ELEMENTS`(10) · `ANALYSIS_PROS`(6) · `ANALYSIS_CONS`(2) · `ANALYSIS_SUGGESTIONS`(3)

## 4 · 验收结果
- typecheck:`pnpm --filter @quanan/web typecheck` 0 error ✓
- unit:`Analysis.test.tsx` 12/12 pass ✓
- lint:新增 analysis 文件 0 问题 ✓(web 既有 159 债为 trending 等 pre-existing)
- 视觉:playwright innerText grep **33/33** · textarea length **797** · 1440 无溢出 · `screenshots/prd-analysis-full.png` 对照 4 张参考 1:1 ✓
- 5 维度底线全过(D1 字面 / D2 视觉 / D3 交互 toast / D4 默认 mock / D5 边界)

## 5 · 文件清单
**新建**:`lib/constants/analysis.ts` · `components/analysis/{AnalysisHero,AnalysisInputCard,AnalysisScoreCard,AnalysisDimensions,AnalysisStructure,AnalysisElements,AnalysisProsCons,AnalysisSuggestions,AnalysisFeedback}.tsx`(9)
**重写**:`pages/tools/Analysis.tsx` · `pages/tools/__tests__/Analysis.test.tsx`

## 6 · 遗留(非本次范围)
- `VideoAnalysis.test.tsx` 9 测试 pre-existing 失败(PRD-29.16 克隆 VideoAnalysis 为 mock-first 时未同步重写其 trpc 旧测试 · 同 Analysis 此次修法)
