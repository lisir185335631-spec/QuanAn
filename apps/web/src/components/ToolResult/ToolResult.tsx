/**
 * ToolResult — generic tool page result wrapper · PRD-5 US-001
 * switch by toolKey → 4 sub-components
 */

import { AnalysisResult } from './AnalysisResult';
import { BoomGenerateResult } from './BoomGenerateResult';
import { FreeGenerateResult } from './FreeGenerateResult';
import { VideoAnalysisResult } from './VideoAnalysisResult';
import { VideoProductionResult } from './VideoProductionResult';

export type ToolResultKey = 'generate' | 'boom-generate' | 'analysis' | 'video-analysis' | 'freeGenerate' | 'video-production';

interface ToolResultProps {
  toolKey: ToolResultKey;
  data: unknown;
  isFallback?: boolean;
}

export function ToolResult({ toolKey, data, isFallback }: ToolResultProps) {
  switch (toolKey) {
    case 'freeGenerate':
      return <FreeGenerateResult data={data} isFallback={isFallback} />;
    case 'generate':
      return <FreeGenerateResult data={data} isFallback={isFallback} />;
    case 'boom-generate':
      return <BoomGenerateResult data={data} />;
    case 'analysis':
      return <AnalysisResult data={data} />;
    case 'video-analysis':
      return <VideoAnalysisResult data={data} />;
    case 'video-production':
      return <VideoProductionResult data={data} />;
    default:
      return null;
  }
}
