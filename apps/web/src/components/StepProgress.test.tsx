/**
 * StepProgress.test.tsx — PRD-3 US-005 · AC-8
 * 4 unit tests: loading skeleton, completed highlight, current highlight, pending state
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { StepProgress, STEP_ORDER_KEYS } from './StepProgress';

describe('StepProgress', () => {
  it('renders loading skeleton when isLoading=true', () => {
    render(<StepProgress completedSteps={[]} isLoading />);
    expect(screen.getByLabelText('加载中')).toBeInTheDocument();
    // No step items rendered during loading
    expect(screen.queryByTestId('step-step1')).not.toBeInTheDocument();
  });

  it('renders 9 step items when loaded', () => {
    render(<StepProgress completedSteps={[]} />);
    expect(screen.getAllByTestId(/^step-step/)).toHaveLength(9);
  });

  it('marks completed steps with status=completed', () => {
    render(<StepProgress completedSteps={['step1', 'step3']} />);
    expect(screen.getByTestId('step-step1')).toHaveAttribute('data-status', 'completed');
    expect(screen.getByTestId('step-step3')).toHaveAttribute('data-status', 'completed');
  });

  it('marks first incomplete step as current, rest as pending', () => {
    // step1 completed → step3 is current → rest pending
    render(<StepProgress completedSteps={['step1']} />);
    expect(screen.getByTestId('step-step1')).toHaveAttribute('data-status', 'completed');
    expect(screen.getByTestId('step-step3')).toHaveAttribute('data-status', 'current');
    expect(screen.getByTestId('step-step3b')).toHaveAttribute('data-status', 'pending');
  });

  it('shows 0/9 progress text when no steps completed', () => {
    render(<StepProgress completedSteps={[]} />);
    expect(screen.getByText(/0\/9/)).toBeInTheDocument();
  });

  it('STEP_ORDER_KEYS contains 9 keys', () => {
    expect(STEP_ORDER_KEYS).toHaveLength(9);
  });
});
