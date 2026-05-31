/**
 * Analysis.tsx — /analysis 文案结构分析
 * 1:1 字面复刻 aiipznt · mock-first · 2026-06-01
 * 旧 PRD-25 trpc.analysis.analyze 版整页重写 → 默认 mock 直出(form 预填 797 字 + 结果区常驻)
 */
import { useState } from 'react';

import { ANALYSIS_DEFAULT_COPY } from '@/lib/constants/analysis';

import { AnalysisDimensions } from './components/analysis/AnalysisDimensions';
import { AnalysisElements } from './components/analysis/AnalysisElements';
import { AnalysisFeedback } from './components/analysis/AnalysisFeedback';
import { AnalysisHero } from './components/analysis/AnalysisHero';
import { AnalysisInputCard } from './components/analysis/AnalysisInputCard';
import { AnalysisProsCons } from './components/analysis/AnalysisProsCons';
import { AnalysisScoreCard } from './components/analysis/AnalysisScoreCard';
import { AnalysisStructure } from './components/analysis/AnalysisStructure';
import { AnalysisSuggestions } from './components/analysis/AnalysisSuggestions';

export default function Analysis() {
  const [copy, setCopy] = useState<string>(ANALYSIS_DEFAULT_COPY);

  return (
    <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
      <AnalysisHero />
      <AnalysisInputCard copy={copy} onCopyChange={setCopy} />
      <AnalysisScoreCard />
      <AnalysisDimensions />
      <AnalysisStructure />
      <AnalysisElements />
      <AnalysisProsCons />
      <AnalysisSuggestions />
      <AnalysisFeedback />
    </main>
  );
}
