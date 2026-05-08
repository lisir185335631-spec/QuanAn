/**
 * StepLayout — wraps all step pages · PRD-3 US-005
 * Renders FeedbackButton at the bottom of each step page without modifying 9 page files.
 */

import { Outlet, useLocation } from 'react-router-dom';

import { FeedbackButton } from '@/components/FeedbackButton';

export function StepLayout() {
  const { pathname } = useLocation();
  // /step/1 → step1, /step/3b → step3b
  const match = pathname.match(/\/step\/(\w+)$/);
  const stepKey = match ? `step${match[1]}` : 'unknown';

  return (
    <>
      <Outlet />
      <div className="container pb-8">
        <FeedbackButton stepKey={stepKey} />
      </div>
    </>
  );
}
