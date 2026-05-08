/**
 * 7 Specialist system prompt 模板 barrel
 * PRD-4 US-002 · AC-3
 */

import { POSITIONING_TEMPLATE }  from './positioning';
import { BRANDING_TEMPLATE }      from './branding';
import { MONETIZATION_TEMPLATE }  from './monetization';
import { TOPIC_TEMPLATE }         from './topic';
import { VIDEO_TEMPLATE }         from './video';
import { COPYWRITING_TEMPLATE }   from './copywriting';
import { LIVESTREAM_TEMPLATE }    from './livestream';
import type { SpecialistId }      from '@/agents/base/types';

export interface SpecialistTemplate {
  persona: string;
  methodology: string;
}

/** 7 PRD-4 Specialist → 模板映射 */
export const SPECIALIST_TEMPLATES: Partial<Record<SpecialistId, SpecialistTemplate>> = {
  PositioningAgent:  POSITIONING_TEMPLATE,
  BrandingAgent:     BRANDING_TEMPLATE,
  MonetizationAgent: MONETIZATION_TEMPLATE,
  TopicAgent:        TOPIC_TEMPLATE,
  VideoAgent:        VIDEO_TEMPLATE,
  CopywritingAgent:  COPYWRITING_TEMPLATE,
  LivestreamAgent:   LIVESTREAM_TEMPLATE,
} as const;

export {
  POSITIONING_TEMPLATE,
  BRANDING_TEMPLATE,
  MONETIZATION_TEMPLATE,
  TOPIC_TEMPLATE,
  VIDEO_TEMPLATE,
  COPYWRITING_TEMPLATE,
  LIVESTREAM_TEMPLATE,
};
