/**
 * ToolResult — generic tool page result wrapper · PRD-5 US-001
 * switch by toolKey → 4 sub-components
 */

import { AnalysisResult } from './AnalysisResult';
import { BoomGenerateResult } from './BoomGenerateResult';
import { FreeGenerateResult } from './FreeGenerateResult';
import { VideoAnalysisResult } from './VideoAnalysisResult';

export type ToolResultKey = 'generate' | 'boom-generate' | 'analysis' | 'video-analysis';

interface ToolResultProps {
  toolKey: ToolResultKey;
  data: unknown;
}

export function ToolResult({ toolKey, data }: ToolResultProps) {
  switch (toolKey) {
    case 'generate':
      return <FreeGenerateResult data={data} />;
    case 'boom-generate':
      return <BoomGenerateResult data={data} />;
    case 'analysis':
      return <AnalysisResult data={data} />;
    case 'video-analysis':
      return <VideoAnalysisResult data={data} />;
    default:
      return null;
  }
}
