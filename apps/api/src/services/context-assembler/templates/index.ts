/**
 * Specialist system prompt 模板 barrel
 * PRD-4 US-002 · AC-3 + PRD-5 US-001 (AnalysisAgent) + PRD-6 US-002 (VideoAgent 3 mode)
 * PRD-8 US-002 · AC-7: EvolutionAgent / DailyTaskAgent / VoiceChatAgent
 */

import type { SpecialistId }      from '@/agents/base/types';

import { ACQUISITION_VIDEO_TEMPLATE } from './acquisition-video';
import { AI_VIDEO_TEMPLATE }          from './ai-video';
import { ANALYSIS_TEMPLATE }          from './analysis';
import { BRANDING_TEMPLATE }          from './branding';
import { COPYWRITING_TEMPLATE }       from './copywriting';
import { DAILY_TASK_AGENT_TEMPLATE }  from './daily-task-agent';
import { EVOLUTION_AGENT_TEMPLATE }   from './evolution-agent';
import { LIVESTREAM_TEMPLATE }        from './livestream';
import { MONETIZATION_TEMPLATE }      from './monetization';
import { POSITIONING_TEMPLATE }       from './positioning';
import { TOPIC_TEMPLATE }             from './topic';
import { VIDEO_TEMPLATE }             from './video';
import { VIDEO_PRODUCTION_TEMPLATE }  from './video-production';
import { VOICE_CHAT_AGENT_TEMPLATE }  from './voice-chat-agent';


export interface SpecialistTemplate {
  persona: string;
  methodology: string;
}

/** Specialist → 模板映射 (PRD-4 × 7 + PRD-5 AnalysisAgent + PRD-6 VideoAgent 3 mode + PRD-8 3 L5) */
export const SPECIALIST_TEMPLATES: Partial<Record<SpecialistId, SpecialistTemplate>> & Record<string, SpecialistTemplate> = {
  PositioningAgent:  POSITIONING_TEMPLATE,
  BrandingAgent:     BRANDING_TEMPLATE,
  MonetizationAgent: MONETIZATION_TEMPLATE,
  TopicAgent:        TOPIC_TEMPLATE,
  VideoAgent:        VIDEO_TEMPLATE,
  CopywritingAgent:  COPYWRITING_TEMPLATE,
  LivestreamAgent:   LIVESTREAM_TEMPLATE,
  AnalysisAgent:     ANALYSIS_TEMPLATE,
  // PRD-6 US-002 · AC-7: VideoAgent mode-specific templates
  'VideoAgent:production':  VIDEO_PRODUCTION_TEMPLATE,
  'VideoAgent:acquisition': ACQUISITION_VIDEO_TEMPLATE,
  'VideoAgent:storyboard':  AI_VIDEO_TEMPLATE,
  // PRD-8 US-002 · AC-7: 3 L5 Specialist templates
  EvolutionAgent:   EVOLUTION_AGENT_TEMPLATE,
  DailyTaskAgent:   DAILY_TASK_AGENT_TEMPLATE,
  VoiceChatAgent:   VOICE_CHAT_AGENT_TEMPLATE,
};

export {
  POSITIONING_TEMPLATE,
  BRANDING_TEMPLATE,
  MONETIZATION_TEMPLATE,
  TOPIC_TEMPLATE,
  VIDEO_TEMPLATE,
  COPYWRITING_TEMPLATE,
  LIVESTREAM_TEMPLATE,
  ANALYSIS_TEMPLATE,
  VIDEO_PRODUCTION_TEMPLATE,
  ACQUISITION_VIDEO_TEMPLATE,
  AI_VIDEO_TEMPLATE,
  EVOLUTION_AGENT_TEMPLATE,
  DAILY_TASK_AGENT_TEMPLATE,
  VOICE_CHAT_AGENT_TEMPLATE,
};
