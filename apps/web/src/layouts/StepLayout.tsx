/**
 * StepLayout — PRD-4 US-014
 * AC-5: passes stepKey(from pathname) + agentId(from STEP_AGENT_MAP) to FeedbackButton
 * AC-17: single render point (AGENTS.md §11.3)
 */

import { Outlet, useLocation } from 'react-router-dom';

import { FeedbackButton } from '@/components/FeedbackButton';

/** AC-5: stepKey → agentId mapping constant */
const STEP_AGENT_MAP: Record<string, string> = {
  step1: 'PositioningAgent',
  step2: 'web-client',
  step3: 'BrandingAgent',
  step3b: 'BrandingAgent',
  step4: 'PositioningAgent',
  step4b: 'MonetizationAgent',
  step5: 'TopicAgent',
  step6: 'VideoAgent',
  step7: 'CopywritingAgent',
  step8: 'LivestreamAgent',
  step9: 'web-client',
} as const satisfies Record<string, string>;

export function StepLayout() {
  const { pathname } = useLocation();
  // /step/1 → step1, /step/3b → step3b
  const match = pathname.match(/\/step\/(\w+)$/);
  const stepKey = match ? `step${match[1]}` : 'unknown';
  const agentId = STEP_AGENT_MAP[stepKey] ?? 'web-client';

  return (
    <>
      <Outlet />
      <div className="container pb-8">
        <FeedbackButton stepKey={stepKey} agentId={agentId} />
      </div>
    </>
  );
}
